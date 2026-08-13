import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime, DateTimeFormat } from "../src/index.js";
import { ArgumentException } from "@nivinjoseph/n-exception";
import { Duration } from "@nivinjoseph/n-util";


function dt(value: string, zone = "utc"): DateTime
{
    return new DateTime({ value, zone });
}


await describe("DateTime Regressions", async () =>
{
    await describe("Wall clock state stays consistent with the instant", async () =>
    {
        await test(`Given a wall clock time inside a daylight savings gap
        when a DateTime is created
        then every accessor should report the same shifted time`,
            () =>
            {
                // 02:30 does not exist on 2023-03-12 in New York; it must not be reported as if it did
                const subject = dt("2023-03-12 02:30:00", "America/New_York");

                assert.strictEqual(subject.value, "2023-03-12 03:30:00");
                assert.strictEqual(subject.timeValue, "03:30:00");
                assert.strictEqual(subject.timeCode, "033000");
                assert.strictEqual(subject.hour, 3);
                assert.strictEqual(subject.formatExt("HH:mm:ss"), "03:30:00");
                assert.strictEqual(subject.format(DateTimeFormat.yearMonthDayHourMinute), "2023-03-12 03:30");
                assert.strictEqual(subject.toStringISO(), "2023-03-12T03:30:00.000-04:00");
            }
        );

        await test(`Given a DateTime in a daylight savings gap
        when its value and zone are used to build another DateTime
        then the two should be identical`,
            () =>
            {
                const subject = dt("2023-03-12 02:30:00", "America/New_York");
                const rebuilt = dt(subject.value, subject.zone);

                assert.ok(rebuilt.equals(subject));
                assert.strictEqual(rebuilt.timestamp, subject.timestamp);
            }
        );

        await test(`Given any DateTime
        when its date and time components are read
        then the codes and the luxon backed accessors should agree`,
            () =>
            {
                for (const [value, zone] of [
                    ["2024-03-10 02:30:00", "America/Los_Angeles"],
                    ["2024-11-03 01:30:00", "America/Los_Angeles"],
                    ["2024-02-29 23:59:59", "UTC+5:30"],
                    ["2024-01-01 00:00:00", "utc"]
                ] as Array<[string, string]>)
                {
                    const subject = dt(value, zone);

                    assert.strictEqual(subject.dateCode, `${subject.year}${subject.month.toString().padStart(2, "0")}${subject.day.toString().padStart(2, "0")}`);
                    assert.strictEqual(subject.timeValue, subject.formatExt("HH:mm:ss"));
                    assert.strictEqual(subject.dateValue, subject.formatExt("yyyy-MM-dd"));
                }
            }
        );
    });

    await describe("isSameDay compares calendar days", async () =>
    {
        await test(`Given two DateTimes on different days less than 24 hours apart
        when isSameDay is called
        then it should return false`,
            () =>
            {
                assert.ok(!dt("2023-06-11 23:00:00").isSameDay(dt("2023-06-12 01:00:00")));
                assert.ok(!dt("2023-06-12 01:00:00").isSameDay(dt("2023-06-11 23:00:00")));
            }
        );

        await test(`Given two DateTimes on the same day nearly 24 hours apart
        when isSameDay is called
        then it should return true`,
            () =>
            {
                assert.ok(dt("2023-06-11 00:00:00").isSameDay(dt("2023-06-11 23:59:59")));
            }
        );

        await test(`Given a DateTime compared to itself
        when isSameDay is called
        then it should return true`,
            () =>
            {
                const subject = dt("2023-06-11 12:00:00");

                assert.ok(subject.isSameDay(subject));
            }
        );
    });

    await describe("daysDiff counts calendar days", async () =>
    {
        await test(`Given two DateTimes spanning two calendar days but only 26 hours
        when daysDiff is called
        then it should return 2`,
            () =>
            {
                assert.strictEqual(dt("2023-06-11 23:00:00").daysDiff(dt("2023-06-13 01:00:00")), 2);
                assert.strictEqual(dt("2023-06-13 01:00:00").daysDiff(dt("2023-06-11 23:00:00")), 2);
            }
        );

        await test(`Given two DateTimes on the same day
        when daysDiff is called
        then it should return 0`,
            () =>
            {
                assert.strictEqual(dt("2023-06-11 00:00:00").daysDiff(dt("2023-06-11 23:59:59")), 0);
            }
        );

        await test(`Given two DateTimes spanning a daylight savings transition
        when daysDiff is called
        then the short day should still count as one day`,
            () =>
            {
                assert.strictEqual(
                    dt("2024-03-09 12:00:00", "America/New_York").daysDiff(dt("2024-03-11 12:00:00", "America/New_York")),
                    2
                );
                assert.strictEqual(
                    dt("2024-11-02 12:00:00", "America/New_York").daysDiff(dt("2024-11-04 12:00:00", "America/New_York")),
                    2
                );
            }
        );

        await test(`Given two DateTimes a year apart
        when daysDiff is called
        then it should count every calendar day`,
            () =>
            {
                assert.strictEqual(dt("2024-01-01 00:00:00").daysDiff(dt("2025-01-01 00:00:00")), 366);
            }
        );
    });

    await describe("Input is rejected rather than truncated", async () =>
    {
        await test(`Given a value carrying extra trailing characters
        when a DateTime is created
        then it should throw rather than silently discarding them`,
            () =>
            {
                assert.throws(() => dt("2023-06-11 10:00:00.999"), ArgumentException);
                assert.throws(() => dt("2023-06-11 10:00:00 America/New_York"), ArgumentException);
                assert.throws(() => dt("2023-06-11 10:00:00Z"), ArgumentException);
                assert.throws(() => dt("2023-06-11T10:00:00"), ArgumentException);
            }
        );

        await test(`Given a value at each supported precision
        when a DateTime is created
        then the missing components should be defaulted`,
            () =>
            {
                assert.strictEqual(dt("2023").value, "2023-01-01 00:00:00");
                assert.strictEqual(dt("2023-06").value, "2023-06-01 00:00:00");
                assert.strictEqual(dt("2023-06-11").value, "2023-06-11 00:00:00");
                assert.strictEqual(dt("2023-06-11 10").value, "2023-06-11 10:00:00");
                assert.strictEqual(dt("2023-06-11 10:30").value, "2023-06-11 10:30:00");
                assert.strictEqual(dt("2023-06-11 10:30:45").value, "2023-06-11 10:30:45");
            }
        );
    });

    await describe("Invalid zones are reported against the zone argument", async () =>
    {
        await test(`Given an invalid zone
        when the timestamp factories are called
        then the error should name the zone`,
            () =>
            {
                for (const create of [
                    (): DateTime => DateTime.now("Not/AZone"),
                    (): DateTime => DateTime.createFromTimestamp(0, "Not/AZone"),
                    (): DateTime => DateTime.createFromMilliSecondsSinceEpoch(0, "Not/AZone"),
                    (): DateTime => DateTime.createFromCodes("20240101", "100000", "Not/AZone"),
                    (): DateTime => DateTime.createFromValues("2024-01-01", "10:00:00", "Not/AZone")
                ])
                {
                    assert.throws(create, (e: Error) =>
                        e instanceof ArgumentException && e.message.contains("zone"),
                        `expected a zone error from ${create.toString()}`);
                }
            }
        );

        await test(`Given an invalid zone
        when it is used repeatedly
        then it should be rejected every time`,
            () =>
            {
                // zone validity is memoized; an invalid zone must never enter that cache
                for (let i = 0; i < 3; i++)
                    assert.throws(() => dt("2024-01-01 10:00:00", "Not/AZone"), ArgumentException);

                assert.ok(!DateTime.validateTimeZone("Not/AZone"));
            }
        );

        await test(`Given a valid zone
        when it is used repeatedly
        then it should be accepted every time`,
            () =>
            {
                for (let i = 0; i < 3; i++)
                    assert.strictEqual(dt("2024-01-01 10:00:00", "America/New_York").zone, "America/New_York");

                assert.ok(DateTime.validateTimeZone("America/New_York"));
            }
        );

        await test(`Given a valid zone in a different casing
        when a DateTime is created
        then it should normalize rather than diverge`,
            () =>
            {
                assert.strictEqual(dt("2024-01-01 10:00:00", "UTC").zone, "utc");
                assert.strictEqual(dt("2024-01-01 10:00:00", " utc ").zone, "utc");
                assert.ok(dt("2024-01-01 10:00:00", "UTC").equals(dt("2024-01-01 10:00:00", "utc")));
            }
        );

        await test(`Given a DateTime in utc
        when convertToZone is called with any casing of utc
        then it should return the same instance`,
            () =>
            {
                const subject = dt("2024-01-01 10:00:00", "utc");

                assert.strictEqual(subject.convertToZone("utc"), subject);
                assert.strictEqual(subject.convertToZone("UTC"), subject);
                assert.strictEqual(subject.convertToZone(" UTC "), subject);
            }
        );
    });

    await describe("Safe parsing", async () =>
    {
        await test(`Given invalid input
        when tryCreate is called
        then it should return null instead of throwing`,
            () =>
            {
                assert.strictEqual(DateTime.tryCreate("nonsense", "utc"), null);
                assert.strictEqual(DateTime.tryCreate("2024-01-01 10:00:00", "Not/AZone"), null);
                assert.strictEqual(DateTime.tryCreate(null, "utc"), null);
                assert.strictEqual(DateTime.tryCreate("2024-01-01", null), null);
            }
        );

        await test(`Given valid input
        when tryCreate is called
        then it should return the DateTime`,
            () =>
            {
                assert.strictEqual(DateTime.tryCreate("2024-01-01 10:00:00", "utc")!.value, "2024-01-01 10:00:00");
            }
        );
    });

    await describe("isWithinTimeRange", async () =>
    {
        await test(`Given a time code that is six digits but not a real time
        when isWithinTimeRange is called
        then it should throw naming the offending argument`,
            () =>
            {
                const subject = dt("2024-01-01 10:00:00");

                assert.throws(() => subject.isWithinTimeRange("007799", "235959"),
                    (e: Error) => e instanceof ArgumentException && e.message.contains("startTimeCode"));
                assert.throws(() => subject.isWithinTimeRange("000000", "006099"),
                    (e: Error) => e instanceof ArgumentException && e.message.contains("endTimeCode"));
            }
        );

        await test(`Given a range that wraps midnight
        when isWithinTimeRange is called
        then it should match times on either side of midnight`,
            () =>
            {
                assert.ok(dt("2024-01-01 23:30:00").isWithinTimeRange("220000", "020000"));
                assert.ok(dt("2024-01-01 01:00:00").isWithinTimeRange("220000", "020000"));
                assert.ok(!dt("2024-01-01 12:00:00").isWithinTimeRange("220000", "020000"));
            }
        );
    });

    await describe("Precision contract", async () =>
    {
        await test(`Given a duration with a sub second component
        when it is added
        then the result should be truncated to whole seconds`,
            () =>
            {
                const subject = dt("2024-01-01 10:00:00");

                assert.strictEqual(subject.addTime(Duration.fromMilliSeconds(500)).value, "2024-01-01 10:00:00");
                assert.strictEqual(subject.addTime(Duration.fromMilliSeconds(1500)).value, "2024-01-01 10:00:01");
            }
        );

        await test(`Given milliseconds since the epoch
        when a DateTime is created
        then the millisecond component should be dropped`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(1686484800999, "utc").value, "2023-06-11 12:00:00");
            }
        );

        await test(`Given any DateTime
        when valueOf and timestamp are compared
        then valueOf should be milliseconds and timestamp seconds`,
            () =>
            {
                const subject = dt("2023-06-11 12:00:00");

                assert.strictEqual(subject.valueOf(), subject.timestamp * 1000);
            }
        );
    });
});
