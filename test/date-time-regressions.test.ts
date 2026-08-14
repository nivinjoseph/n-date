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

    await describe("DST fall-back collapses to the earlier offset", async () =>
    {
        // These pin the *documented* consequence of the (value, zone) representation: an
        // ambiguous wall clock time always resolves to the earlier offset, so any instant in the
        // second pass of a repeated hour collapses back one hour. If the representation is ever
        // changed to preserve instants, these assertions must be revisited deliberately.
        //
        // America/New_York, 2023-11-05: clocks fall back 02:00 EDT -> 01:00 EST.
        const firstPassTs = 1699162200;   // 2023-11-05T05:30:00Z == 01:30:00 EDT (-04)
        const secondPassTs = 1699165800;  // 2023-11-05T06:30:00Z == 01:30:00 EST (-05)

        await test(`Given a wall clock time in the repeated hour
        when a DateTime is created
        then the earlier offset should be chosen`,
            () =>
            {
                const subject = dt("2023-11-05 01:30:00", "America/New_York");

                assert.strictEqual(subject.toStringISO(), "2023-11-05T01:30:00.000-04:00");
                assert.strictEqual(subject.timestamp, firstPassTs);
            }
        );

        await test(`Given a timestamp in the second pass of the repeated hour
        when createFromTimestamp is called
        then the instant should collapse to the first pass`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(firstPassTs, "America/New_York").timestamp, firstPassTs);
                assert.strictEqual(DateTime.createFromTimestamp(secondPassTs, "America/New_York").timestamp, firstPassTs);
            }
        );

        await test(`Given an instant in the second pass of the repeated hour
        when it is converted to the zone and back
        then an hour should be lost to the collapse`,
            () =>
            {
                const utcInstant = dt("2023-11-05 06:30:00", "utc");
                const converted = utcInstant.convertToZone("America/New_York");

                assert.strictEqual(converted.value, "2023-11-05 01:30:00");
                assert.strictEqual(converted.timestamp, firstPassTs);
                assert.strictEqual(converted.convertToZone("utc").value, "2023-11-05 05:30:00");
            }
        );

        await test(`Given a DateTime just before the transition
        when one and two hours are added
        then both should land on the same collapsed instant`,
            () =>
            {
                const subject = dt("2023-11-05 00:30:00", "America/New_York");
                const plusOne = subject.addTime(Duration.fromHours(1));
                const plusTwo = subject.addTime(Duration.fromHours(2));

                assert.strictEqual(plusOne.value, "2023-11-05 01:30:00");
                assert.strictEqual(plusTwo.value, "2023-11-05 01:30:00");
                assert.ok(plusOne.isSame(plusTwo));
                assert.strictEqual(plusTwo.timestamp - subject.timestamp, 3600);
            }
        );

        await test(`Given the real clock sits in the second pass of the repeated hour
        when now is called with a zone that repeats that hour
        then the reported instant should collapse while utc does not`,
            () =>
            {
                DateTime.withFixedNow(secondPassTs, () =>
                {
                    assert.strictEqual(DateTime.now().timestamp, secondPassTs);
                    assert.strictEqual(DateTime.now("America/New_York").timestamp, firstPassTs);
                });
            }
        );
    });

    await describe("Numeric edge inputs", async () =>
    {
        await test(`Given NaN or Infinity
        when the numeric factories or the fake clock are called
        then they should throw a validation error`,
            () =>
            {
                for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])
                {
                    assert.throws(() => DateTime.createFromTimestamp(bad, "utc"), ArgumentException);
                    assert.throws(() => DateTime.createFromMilliSecondsSinceEpoch(bad, "utc"), ArgumentException);
                    assert.throws(() => DateTime.useFixedNow(bad), ArgumentException);
                    assert.throws(() => DateTime.useRelativeNow(bad), ArgumentException);
                }
            }
        );

        await test(`Given a fractional timestamp
        when createFromTimestamp is called
        then it should truncate to the whole second per the precision contract`,
            () =>
            {
                const subject = DateTime.createFromTimestamp(1686484800.7, "utc");

                assert.strictEqual(subject.value, "2023-06-11 12:00:00");
                assert.strictEqual(subject.timestamp, 1686484800);
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

    await describe("Machine-relative zones are rejected", async () =>
    {
        await test(`Given a machine relative zone specifier
        when a DateTime is created with it
        then it should be rejected the same way local is`,
            () =>
            {
                for (const zone of ["system", "default", "SYSTEM", "Default", " system "])
                {
                    assert.throws(() => dt("2024-01-01 10:00:00", zone), ArgumentException,
                        `zone "${zone}" should be rejected`);
                }
            }
        );

        await test(`Given a machine relative zone specifier
        when now or convertToZone is called with it
        then it should be rejected`,
            () =>
            {
                for (const zone of ["system", "default"])
                {
                    assert.throws(() => DateTime.now(zone), ArgumentException,
                        `now("${zone}") should be rejected`);
                    assert.throws(() => dt("2024-01-01 10:00:00").convertToZone(zone), ArgumentException,
                        `convertToZone("${zone}") should be rejected`);
                }
            }
        );

        await test(`Given a machine relative zone specifier
        when the zone is validated
        then it should not validate`,
            () =>
            {
                assert.ok(!DateTime.validateTimeZone("system"));
                assert.ok(!DateTime.validateTimeZone("default"));
                assert.ok(!DateTime.validateTimeZone("local"));
            }
        );
    });

    await describe("Supported year range", async () =>
    {
        await test(`Given an instant beyond year 9999
        when a DateTime is created from it
        then it should throw an error naming the year range`,
            () =>
            {
                // 253402300800 is 10000-01-01T00:00:00Z
                assert.throws(() => DateTime.createFromTimestamp(253402300800, "utc"),
                    (e: Error) => e instanceof ArgumentException && e.message.contains("year range"));
                assert.throws(() => DateTime.createFromMilliSecondsSinceEpoch(253402300800000, "utc"),
                    (e: Error) => e instanceof ArgumentException && e.message.contains("year range"));
            }
        );

        await test(`Given arithmetic that lands outside the supported years
        when it is performed
        then it should throw an error naming the year range`,
            () =>
            {
                const subject = dt("2024-01-01 10:00:00");

                assert.throws(() => subject.addYears(8000),
                    (e: Error) => e instanceof ArgumentException && e.message.contains("year range"));
                assert.throws(() => subject.subtractYears(2500),
                    (e: Error) => e instanceof ArgumentException && e.message.contains("year range"));
            }
        );

        await test(`Given an instant before year 0
        when a DateTime is created from it
        then it should throw an error naming the year range`,
            () =>
            {
                // -62167219201 is 1 second before 0000-01-01T00:00:00Z
                assert.throws(() => DateTime.createFromTimestamp(-62167219201, "utc"),
                    (e: Error) => e instanceof ArgumentException && e.message.contains("year range"));
            }
        );

        await test(`Given an instant at the edges of the supported years
        when a DateTime is created from it
        then it should work`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(-62167219200, "utc").value, "0000-01-01 00:00:00");
                assert.strictEqual(DateTime.createFromTimestamp(253402300799, "utc").value, "9999-12-31 23:59:59");
                assert.strictEqual(DateTime.createFromISO("0099-01-01T00:00:00Z", "utc").value, "0099-01-01 00:00:00");
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
