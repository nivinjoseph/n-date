import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime, DateTimeFormat } from "../src/index.js";
import { ArgumentException } from "@nivinjoseph/n-exception";


function dt(value: string, zone = "utc"): DateTime
{
    return new DateTime({ value, zone });
}


await describe("DateTime Formatting", async () =>
{
    await describe("format", async () =>
    {
        const subject = dt("2023-07-02 15:30:20");

        await test(`Given no format
        when format is called
        then it should default to the full second precision format`,
            () =>
            {
                assert.strictEqual(subject.format(), "2023-07-02 15:30:20");
                assert.strictEqual(subject.format(), subject.toStringDateTime());
            }
        );

        await test(`Given each standard format
        when format is called
        then it should truncate to that precision`,
            () =>
            {
                assert.strictEqual(subject.format(DateTimeFormat.yearMonthDayHourMinuteSecond), "2023-07-02 15:30:20");
                assert.strictEqual(subject.format(DateTimeFormat.yearMonthDayHourMinute), "2023-07-02 15:30");
                assert.strictEqual(subject.format(DateTimeFormat.yearMonthDayHour), "2023-07-02 15");
                assert.strictEqual(subject.format(DateTimeFormat.yearMonthDay), "2023-07-02");
                assert.strictEqual(subject.format(DateTimeFormat.yearMonth), "2023-07");
                assert.strictEqual(subject.format(DateTimeFormat.year), "2023");
            }
        );

        await test(`Given a format that is not a DateTimeFormat
        when format is called
        then it should throw rather than silently returning the full value`,
            () =>
            {
                assert.throws(() => subject.format("bogus" as any), ArgumentException);
                assert.throws(() => subject.format(null as any), ArgumentException);
            }
        );

        await test(`Given a DateTime whose wall clock time was shifted by a daylight savings gap
        when format is called
        then it should agree with the underlying instant`,
            () =>
            {
                const shifted = dt("2024-03-10 02:30:00", "America/Los_Angeles");

                assert.strictEqual(shifted.format(DateTimeFormat.yearMonthDayHourMinute), "2024-03-10 03:30");
                assert.strictEqual(shifted.format(DateTimeFormat.yearMonthDayHourMinute), shifted.formatExt("yyyy-MM-dd HH:mm"));
            }
        );
    });

    await describe("formatExt", async () =>
    {
        const subject = dt("2023-07-02 15:30:20");

        await test(`Given a set of extended formats
        when formatExt is called
        then it should produce the documented output`,
            () =>
            {
                assert.strictEqual(subject.formatExt("DD HH:mm:ss"), "Jul 2, 2023 15:30:20");
                assert.strictEqual(subject.formatExt("DD HH:mm"), "Jul 2, 2023 15:30");
                assert.strictEqual(subject.formatExt("yyyy/LL/dd"), "2023/07/02");
                assert.strictEqual(subject.formatExt("HH:mm:ss"), "15:30:20");
                assert.strictEqual(subject.formatExt("DDD"), "July 2, 2023");
                assert.strictEqual(subject.formatExt("MMMM yyyy"), "July 2023");
                assert.strictEqual(subject.formatExt("DDDD"), "Sunday, July 2, 2023");
                assert.strictEqual(subject.formatExt("LLL d"), "Jul 2");
            }
        );

        await test(`Given no locale
        when formatExt is called
        then it should not depend on the ambient system locale`,
            () =>
            {
                // this is the guarantee that matters: the same input yields the same output
                // regardless of where the process happens to be running
                assert.strictEqual(subject.formatExt("DDDD"), "Sunday, July 2, 2023");
                assert.strictEqual(subject.formatExt("MMMM"), "July");
            }
        );

        await test(`Given an explicit locale
        when formatExt is called
        then it should format in that locale`,
            () =>
            {
                assert.strictEqual(subject.formatExt("MMMM", "fr"), "juillet");
                assert.strictEqual(subject.formatExt("MMMM", "es"), "julio");
            }
        );

        await test(`Given a missing format or locale
        when formatExt is called
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => subject.formatExt(null as any), ArgumentException);
                assert.throws(() => subject.formatExt("DDDD", null as any), ArgumentException);
            }
        );
    });

    await describe("toString variants", async () =>
    {
        const subject = dt("2023-07-02 15:30:20", "America/New_York");

        await test(`Given a DateTime
        when the string accessors are called
        then each should return its documented shape`,
            () =>
            {
                assert.strictEqual(subject.toString(), "2023-07-02 15:30:20 America/New_York");
                assert.strictEqual(subject.toStringDateTime(), "2023-07-02 15:30:20");
                assert.strictEqual(subject.toStringISO(), "2023-07-02T15:30:20.000-04:00");
                assert.strictEqual(subject.toISODate(), "2023-07-02");
            }
        );

        await test(`Given a DateTime
        when toJSDate is called
        then it should return a Date at the same instant`,
            () =>
            {
                assert.strictEqual(subject.toJSDate().getTime(), subject.valueOf());
            }
        );

        await test(`Given a DateTime
        when toLuxon is called
        then it should return the underlying luxon DateTime`,
            () =>
            {
                assert.strictEqual(subject.toLuxon().toMillis(), subject.valueOf());
                assert.strictEqual(subject.toLuxon().zoneName, "America/New_York");
            }
        );
    });
});
