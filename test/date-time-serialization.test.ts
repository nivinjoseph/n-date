import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime, DateTimeSpan } from "../src/index.js";
import { Deserializer } from "@nivinjoseph/n-util";


function dt(value: string, zone = "utc"): DateTime
{
    return new DateTime({ value, zone });
}


await describe("Serialization", async () =>
{
    await describe("DateTime", async () =>
    {
        await test(`Given a DateTime
        when it is serialized
        then it should carry value, zone and its type tag`,
            () =>
            {
                const serialized = dt("2024-01-01 10:00:00", "America/New_York").serialize();

                assert.strictEqual(serialized.value, "2024-01-01 10:00:00");
                assert.strictEqual(serialized.zone, "America/New_York");
                assert.strictEqual(serialized.$typename, "Ndate.DateTime");
            }
        );

        await test(`Given a DateTime
        when it is serialized and deserialized
        then it should round trip to an equal DateTime`,
            () =>
            {
                const original = dt("2024-01-01 10:00:00", "America/New_York");
                const result = Deserializer.deserialize<DateTime>(original.serialize());

                assert.ok(result instanceof DateTime);
                assert.ok(result.equals(original));
                assert.strictEqual(result.timestamp, original.timestamp);
            }
        );

        await test(`Given a DateTime
        when it is round tripped through JSON
        then it should survive intact`,
            () =>
            {
                const original = dt("2024-02-29 18:30:00", "UTC+5:30");
                const result = Deserializer.deserialize<DateTime>(JSON.parse(JSON.stringify(original.serialize())));

                assert.ok(result.equals(original));
            }
        );

        await test(`Given DateTimes across a range of zones and values
        when each is round tripped
        then every one should be preserved`,
            () =>
            {
                const cases: Array<[string, string]> = [
                    ["2024-01-01 00:00:00", "utc"],
                    ["1986-08-17 15:57:00", "America/Los_Angeles"],
                    ["2024-02-29 23:59:59", "UTC+5:30"],
                    ["2024-07-01 12:00:00", "UTC-12:00"],
                    ["2024-12-31 23:59:59", "Asia/Tokyo"]
                ];

                for (const [value, zone] of cases)
                {
                    const original = dt(value, zone);
                    const result = Deserializer.deserialize<DateTime>(original.serialize());

                    assert.ok(result.equals(original), `${value} ${zone} did not round trip`);
                    assert.strictEqual(result.timestamp, original.timestamp);
                }
            }
        );
    });

    await describe("DateTimeSpan", async () =>
    {
        await test(`Given a DateTimeSpan
        when it is serialized
        then it should carry nested DateTimes and its own type tag`,
            () =>
            {
                const serialized = new DateTimeSpan({
                    start: dt("2024-01-01 10:00:00"),
                    end: dt("2024-01-01 12:00:00")
                }).serialize();

                assert.strictEqual(serialized.$typename, "Ndate.DateTimeSpan");
                assert.strictEqual(serialized.start.$typename, "Ndate.DateTime");
                assert.strictEqual(serialized.start.value, "2024-01-01 10:00:00");
                assert.strictEqual(serialized.end.value, "2024-01-01 12:00:00");
            }
        );

        await test(`Given a DateTimeSpan
        when it is serialized and deserialized
        then it should round trip to an equal DateTimeSpan`,
            () =>
            {
                const original = new DateTimeSpan({
                    start: dt("2024-01-01 10:00:00", "America/New_York"),
                    end: dt("2024-01-01 12:00:00", "America/New_York")
                });
                const result = Deserializer.deserialize<DateTimeSpan>(original.serialize());

                assert.ok(result instanceof DateTimeSpan);
                assert.ok(result.equals(original));
                assert.strictEqual(result.duration.toHours(), 2);
            }
        );

        await test(`Given a DateTime and a DateTimeSpan
        when both are deserialized
        then each should resolve to its own type despite sharing a namespace`,
            () =>
            {
                const dateTime = Deserializer.deserialize<DateTime>(dt("2024-01-01 10:00:00").serialize());
                const span = Deserializer.deserialize<DateTimeSpan>(new DateTimeSpan({
                    start: dt("2024-01-01 10:00:00"),
                    end: dt("2024-01-01 12:00:00")
                }).serialize());

                assert.ok(dateTime instanceof DateTime);
                assert.ok(span instanceof DateTimeSpan);
            }
        );
    });

    await describe("Canonical form", async () =>
    {
        await test(`Given a DateTime built from a wall clock time that does not exist in its zone
        when it is serialized and deserialized
        then it should be equal to the original`,
            () =>
            {
                // 02:30 does not exist on 2024-03-10 in Los Angeles; the constructor canonicalizes
                // it to 03:30, and that canonical form is what must round trip
                const original = dt("2024-03-10 02:30:00", "America/Los_Angeles");

                assert.strictEqual(original.value, "2024-03-10 03:30:00");

                const result = Deserializer.deserialize<DateTime>(original.serialize());

                assert.ok(result.equals(original));
                assert.strictEqual(result.timestamp, original.timestamp);
            }
        );

        await test(`Given a DateTime on an ambiguous wall clock time
        when it is serialized and deserialized
        then it should resolve to the same instant`,
            () =>
            {
                // 01:30 happens twice on 2024-11-03 in Los Angeles; the earlier offset is always chosen
                const original = dt("2024-11-03 01:30:00", "America/Los_Angeles");
                const result = Deserializer.deserialize<DateTime>(original.serialize());

                assert.ok(result.equals(original));
                assert.strictEqual(result.timestamp, original.timestamp);
                assert.strictEqual(result.toStringISO(), original.toStringISO());
            }
        );

        await test(`Given a DateTime produced by arithmetic
        when it is round tripped
        then it should be stable`,
            () =>
            {
                const original = dt("2024-03-09 12:00:00", "America/Los_Angeles").addDays(1).addMonths(1);
                const result = Deserializer.deserialize<DateTime>(original.serialize());

                assert.ok(result.equals(original));
                assert.strictEqual(result.timestamp, original.timestamp);
            }
        );
    });
});
