import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime, DateTimeSpan } from "../src/index.js";
import { ArgumentException } from "@nivinjoseph/n-exception";


function dt(value: string, zone = "utc"): DateTime
{
    return new DateTime({ value, zone });
}

function span(startValue: string, endValue: string, zone = "utc"): DateTimeSpan
{
    return new DateTimeSpan({ start: dt(startValue, zone), end: dt(endValue, zone) });
}


await describe("DateTimeSpan", async () =>
{
    await describe("Constructor", async () =>
    {
        await test(`Given a start and an end that is after it
        when a DateTimeSpan is created
        then it should expose both bounds`,
            () =>
            {
                const result = span("2024-01-01 10:00:00", "2024-01-01 12:00:00");

                assert.strictEqual(result.start.value, "2024-01-01 10:00:00");
                assert.strictEqual(result.end.value, "2024-01-01 12:00:00");
            }
        );

        await test(`Given a start and an end that are the same
        when a DateTimeSpan is created
        then it should be allowed as a zero length span`,
            () =>
            {
                const result = span("2024-01-01 10:00:00", "2024-01-01 10:00:00");

                assert.strictEqual(result.duration.toMilliSeconds(), 0);
            }
        );

        await test(`Given an end that is before the start
        when a DateTimeSpan is created
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => span("2024-01-01 12:00:00", "2024-01-01 10:00:00"), ArgumentException);
            }
        );

        await test(`Given a missing start or end
        when a DateTimeSpan is created
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => new DateTimeSpan({ start: null as any, end: dt("2024-01-01 10:00:00") }), ArgumentException);
                assert.throws(() => new DateTimeSpan({ start: dt("2024-01-01 10:00:00"), end: null as any }), ArgumentException);
            }
        );

        await test(`Given a start and end in different zones
        when a DateTimeSpan is created
        then ordering should be evaluated on instants`,
            () =>
            {
                // 2024-01-01 10:00 UTC is 05:00 in New York, so this span is valid despite the
                // end reading as an earlier wall-clock time than the start
                const result = new DateTimeSpan({
                    start: dt("2024-01-01 10:00:00", "utc"),
                    end: dt("2024-01-01 06:00:00", "America/New_York")
                });

                assert.strictEqual(result.duration.toHours(), 1);
            }
        );
    });

    await describe("Duration", async () =>
    {
        await test(`Given a span of two hours
        when duration is read
        then it should return two hours`,
            () =>
            {
                assert.strictEqual(span("2024-01-01 10:00:00", "2024-01-01 12:00:00").duration.toHours(), 2);
            }
        );

        await test(`Given a span
        when duration is read more than once
        then it should return the same cached instance`,
            () =>
            {
                const result = span("2024-01-01 10:00:00", "2024-01-01 12:00:00");

                assert.strictEqual(result.duration, result.duration);
            }
        );

        await test(`Given a span across a daylight savings spring forward
        when duration is read
        then it should return the elapsed time rather than the wall clock difference`,
            () =>
            {
                // 2024-03-10 in Los Angeles loses an hour, so 01:00 to 04:00 is only 2 hours
                const result = span("2024-03-10 01:00:00", "2024-03-10 04:00:00", "America/Los_Angeles");

                assert.strictEqual(result.duration.toHours(), 2);
            }
        );
    });

    await describe("Contains", async () =>
    {
        const subject = span("2024-01-01 10:00:00", "2024-01-01 12:00:00");

        await test(`Given a DateTime inside the span
        when contains is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.contains(dt("2024-01-01 11:00:00")));
            }
        );

        await test(`Given a DateTime on either bound
        when contains is called
        then it should return true because the span is closed`,
            () =>
            {
                assert.ok(subject.contains(dt("2024-01-01 10:00:00")));
                assert.ok(subject.contains(dt("2024-01-01 12:00:00")));
            }
        );

        await test(`Given a DateTime outside the span
        when contains is called
        then it should return false`,
            () =>
            {
                assert.ok(!subject.contains(dt("2024-01-01 09:59:59")));
                assert.ok(!subject.contains(dt("2024-01-01 12:00:01")));
            }
        );

        await test(`Given a DateTime in another zone that falls inside the span
        when contains is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.contains(dt("2024-01-01 06:00:00", "America/New_York")));
            }
        );

        await test(`Given something that is not a DateTime
        when contains is called
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => subject.contains(null as any), ArgumentException);
                assert.throws(() => subject.contains({ value: "2024-01-01 11:00:00" } as any), ArgumentException);
            }
        );
    });

    await describe("Encompasses", async () =>
    {
        const subject = span("2024-01-01 10:00:00", "2024-01-01 14:00:00");

        await test(`Given a span fully inside this one
        when encompasses is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.encompasses(span("2024-01-01 11:00:00", "2024-01-01 13:00:00")));
            }
        );

        await test(`Given an identical span
        when encompasses is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.encompasses(span("2024-01-01 10:00:00", "2024-01-01 14:00:00")));
            }
        );

        await test(`Given a span extending past either bound
        when encompasses is called
        then it should return false`,
            () =>
            {
                assert.ok(!subject.encompasses(span("2024-01-01 09:00:00", "2024-01-01 13:00:00")));
                assert.ok(!subject.encompasses(span("2024-01-01 11:00:00", "2024-01-01 15:00:00")));
            }
        );

        await test(`Given a disjoint span
        when encompasses is called
        then it should return false`,
            () =>
            {
                assert.ok(!subject.encompasses(span("2024-01-01 15:00:00", "2024-01-01 16:00:00")));
            }
        );

        await test(`Given something that is not a DateTimeSpan
        when encompasses is called
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => subject.encompasses(null as any), ArgumentException);
            }
        );
    });

    await describe("Infringes", async () =>
    {
        const subject = span("2024-01-01 10:00:00", "2024-01-01 14:00:00");

        await test(`Given a span this one encompasses
        when infringes is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.infringes(span("2024-01-01 11:00:00", "2024-01-01 13:00:00")));
            }
        );

        await test(`Given a span that encompasses this one
        when infringes is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.infringes(span("2024-01-01 09:00:00", "2024-01-01 15:00:00")));
            }
        );

        await test(`Given a span this one starts inside
        when infringes is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.infringes(span("2024-01-01 09:00:00", "2024-01-01 11:00:00")));
            }
        );

        await test(`Given a span this one ends inside
        when infringes is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.infringes(span("2024-01-01 13:00:00", "2024-01-01 15:00:00")));
            }
        );

        await test(`Given a span that only touches this one at an endpoint
        when infringes is called
        then it should return true because the span is closed`,
            () =>
            {
                assert.ok(subject.infringes(span("2024-01-01 14:00:00", "2024-01-01 16:00:00")));
                assert.ok(subject.infringes(span("2024-01-01 08:00:00", "2024-01-01 10:00:00")));
            }
        );

        await test(`Given a completely disjoint span
        when infringes is called
        then it should return false`,
            () =>
            {
                assert.ok(!subject.infringes(span("2024-01-01 15:00:00", "2024-01-01 16:00:00")));
                assert.ok(!subject.infringes(span("2024-01-01 08:00:00", "2024-01-01 09:00:00")));
            }
        );

        await test(`Given two spans
        when infringes is called in either direction
        then it should be symmetric`,
            () =>
            {
                const other = span("2024-01-01 13:00:00", "2024-01-01 15:00:00");
                const disjoint = span("2024-01-01 20:00:00", "2024-01-01 21:00:00");

                assert.strictEqual(subject.infringes(other), other.infringes(subject));
                assert.strictEqual(subject.infringes(disjoint), disjoint.infringes(subject));
            }
        );
    });

    await describe("Overlap", async () =>
    {
        const subject = span("2024-01-01 10:00:00", "2024-01-01 14:00:00");

        await test(`Given a partially overlapping span
        when overlap is called
        then it should return the intersection`,
            () =>
            {
                const result = subject.overlap(span("2024-01-01 13:00:00", "2024-01-01 16:00:00"))!;

                assert.strictEqual(result.start.value, "2024-01-01 13:00:00");
                assert.strictEqual(result.end.value, "2024-01-01 14:00:00");
            }
        );

        await test(`Given a span this one encompasses
        when overlap is called
        then it should return the inner span`,
            () =>
            {
                const result = subject.overlap(span("2024-01-01 11:00:00", "2024-01-01 13:00:00"))!;

                assert.strictEqual(result.start.value, "2024-01-01 11:00:00");
                assert.strictEqual(result.end.value, "2024-01-01 13:00:00");
            }
        );

        await test(`Given a span that only touches at an endpoint
        when overlap is called
        then it should return a zero length span at that instant`,
            () =>
            {
                const result = subject.overlap(span("2024-01-01 14:00:00", "2024-01-01 16:00:00"))!;

                assert.strictEqual(result.duration.toMilliSeconds(), 0);
                assert.strictEqual(result.start.value, "2024-01-01 14:00:00");
            }
        );

        await test(`Given a disjoint span
        when overlap is called
        then it should return null`,
            () =>
            {
                assert.strictEqual(subject.overlap(span("2024-01-01 15:00:00", "2024-01-01 16:00:00")), null);
            }
        );

        await test(`Given two spans
        when overlap is called in either direction
        then it should produce the same interval`,
            () =>
            {
                const other = span("2024-01-01 13:00:00", "2024-01-01 16:00:00");

                assert.ok(subject.overlap(other)!.equals(other.overlap(subject)));
            }
        );
    });

    await describe("Equals", async () =>
    {
        const subject = span("2024-01-01 10:00:00", "2024-01-01 12:00:00");

        await test(`Given the same instance
        when equals is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.equals(subject));
            }
        );

        await test(`Given a distinct span with the same bounds
        when equals is called
        then it should return true`,
            () =>
            {
                assert.ok(subject.equals(span("2024-01-01 10:00:00", "2024-01-01 12:00:00")));
            }
        );

        await test(`Given a span with different bounds
        when equals is called
        then it should return false`,
            () =>
            {
                assert.ok(!subject.equals(span("2024-01-01 10:00:00", "2024-01-01 13:00:00")));
            }
        );

        await test(`Given null
        when equals is called
        then it should return false`,
            () =>
            {
                assert.ok(!subject.equals(null));
            }
        );

        await test(`Given a span covering the same instants in a different zone
        when equals is called
        then it should return false because equality includes the zone`,
            () =>
            {
                const other = new DateTimeSpan({
                    start: dt("2024-01-01 10:00:00", "utc").convertToZone("America/New_York"),
                    end: dt("2024-01-01 12:00:00", "utc").convertToZone("America/New_York")
                });

                assert.ok(!subject.equals(other));
                assert.strictEqual(subject.start.timestamp, other.start.timestamp);
            }
        );
    });
});
