import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime } from "../src/index.js";
import { ArgumentException } from "@nivinjoseph/n-exception";


function dt(value: string, zone = "utc"): DateTime
{
    return new DateTime({ value, zone });
}


await describe("DateTime API", async () =>
{
    await describe("Component accessors", async () =>
    {
        await test(`Given a DateTime
        when its components are read
        then each should reflect the local wall clock time`,
            () =>
            {
                const subject = dt("2024-03-15 14:45:30", "America/New_York");

                assert.strictEqual(subject.year, 2024);
                assert.strictEqual(subject.month, 3);
                assert.strictEqual(subject.day, 15);
                assert.strictEqual(subject.hour, 14);
                assert.strictEqual(subject.minute, 45);
                assert.strictEqual(subject.second, 30);
            }
        );

        await test(`Given a DateTime
        when dayOfWeek is read
        then Monday should be 1 and Sunday should be 7`,
            () =>
            {
                assert.strictEqual(dt("2024-03-11 00:00:00").dayOfWeek, 1);
                assert.strictEqual(dt("2024-03-17 00:00:00").dayOfWeek, 7);
            }
        );

        await test(`Given a DateTime
        when dayOfYear and daysInMonth are read
        then they should reflect the calendar`,
            () =>
            {
                assert.strictEqual(dt("2024-01-01 00:00:00").dayOfYear, 1);
                assert.strictEqual(dt("2024-12-31 00:00:00").dayOfYear, 366);
                assert.strictEqual(dt("2024-02-01 00:00:00").daysInMonth, 29);
                assert.strictEqual(dt("2023-02-01 00:00:00").daysInMonth, 28);
            }
        );

        await test(`Given a DateTime
        when isWeekend is read
        then only Saturday and Sunday should qualify`,
            () =>
            {
                assert.ok(!dt("2024-03-15 00:00:00").isWeekend);
                assert.ok(dt("2024-03-16 00:00:00").isWeekend);
                assert.ok(dt("2024-03-17 00:00:00").isWeekend);
                assert.ok(!dt("2024-03-18 00:00:00").isWeekend);
            }
        );

        await test(`Given a DateTime
        when isLeapYear is read
        then it should follow the leap year rules`,
            () =>
            {
                assert.ok(dt("2024-01-01 00:00:00").isLeapYear);
                assert.ok(!dt("2023-01-01 00:00:00").isLeapYear);
                assert.ok(dt("2000-01-01 00:00:00").isLeapYear);
                assert.ok(!dt("1900-01-01 00:00:00").isLeapYear);
            }
        );

        await test(`Given the same instant in two zones
        when the components are read
        then each should reflect its own zone`,
            () =>
            {
                const utc = dt("2024-01-01 10:00:00", "utc");
                const ny = utc.convertToZone("America/New_York");

                assert.strictEqual(utc.hour, 10);
                assert.strictEqual(ny.hour, 5);
                assert.strictEqual(utc.timestamp, ny.timestamp);
            }
        );
    });

    await describe("startOf and endOf", async () =>
    {
        const subject = dt("2024-03-15 14:45:30");

        await test(`Given a DateTime
        when startOf is called
        then it should truncate to the start of that unit`,
            () =>
            {
                assert.strictEqual(subject.startOf("minute").value, "2024-03-15 14:45:00");
                assert.strictEqual(subject.startOf("hour").value, "2024-03-15 14:00:00");
                assert.strictEqual(subject.startOf("day").value, "2024-03-15 00:00:00");
                assert.strictEqual(subject.startOf("month").value, "2024-03-01 00:00:00");
                assert.strictEqual(subject.startOf("year").value, "2024-01-01 00:00:00");
            }
        );

        await test(`Given a DateTime
        when endOf is called
        then it should extend to the final whole second of that unit`,
            () =>
            {
                assert.strictEqual(subject.endOf("minute").value, "2024-03-15 14:45:59");
                assert.strictEqual(subject.endOf("hour").value, "2024-03-15 14:59:59");
                assert.strictEqual(subject.endOf("day").value, "2024-03-15 23:59:59");
                assert.strictEqual(subject.endOf("month").value, "2024-03-31 23:59:59");
                assert.strictEqual(subject.endOf("year").value, "2024-12-31 23:59:59");
            }
        );

        await test(`Given a February in a leap year
        when endOf month is called
        then it should land on the 29th`,
            () =>
            {
                assert.strictEqual(dt("2024-02-10 12:00:00").endOf("month").value, "2024-02-29 23:59:59");
                assert.strictEqual(dt("2023-02-10 12:00:00").endOf("month").value, "2023-02-28 23:59:59");
            }
        );
    });

    await describe("Month and year arithmetic", async () =>
    {
        await test(`Given a DateTime
        when months are added or subtracted
        then it should move by calendar months`,
            () =>
            {
                const subject = dt("2024-01-15 10:00:00");

                assert.strictEqual(subject.addMonths(1).value, "2024-02-15 10:00:00");
                assert.strictEqual(subject.addMonths(12).value, "2025-01-15 10:00:00");
                assert.strictEqual(subject.subtractMonths(1).value, "2023-12-15 10:00:00");
                assert.strictEqual(subject.addMonths(-1).value, "2023-12-15 10:00:00");
            }
        );

        await test(`Given the 31st of a month
        when a month is added
        then the day should clamp to the end of the target month`,
            () =>
            {
                assert.strictEqual(dt("2024-01-31 10:00:00").addMonths(1).value, "2024-02-29 10:00:00");
                assert.strictEqual(dt("2023-01-31 10:00:00").addMonths(1).value, "2023-02-28 10:00:00");
            }
        );

        await test(`Given a DateTime
        when years are added or subtracted
        then it should move by calendar years`,
            () =>
            {
                const subject = dt("2024-06-15 10:00:00");

                assert.strictEqual(subject.addYears(1).value, "2025-06-15 10:00:00");
                assert.strictEqual(subject.subtractYears(1).value, "2023-06-15 10:00:00");
                assert.strictEqual(subject.addYears(-1).value, "2023-06-15 10:00:00");
            }
        );

        await test(`Given February 29th
        when a year is added
        then it should clamp to February 28th`,
            () =>
            {
                assert.strictEqual(dt("2024-02-29 10:00:00").addYears(1).value, "2025-02-28 10:00:00");
            }
        );

        await test(`Given a non integer amount
        when month or year arithmetic is called
        then it should throw a validation error`,
            () =>
            {
                const subject = dt("2024-01-15 10:00:00");

                assert.throws(() => subject.addMonths(1.5), ArgumentException);
                assert.throws(() => subject.addYears(1.5), ArgumentException);
                assert.throws(() => subject.subtractMonths(null as any), ArgumentException);
            }
        );
    });

    await describe("createFromISO", async () =>
    {
        await test(`Given an ISO string with an offset
        when a DateTime is created
        then the instant should honour the offset`,
            () =>
            {
                assert.strictEqual(DateTime.createFromISO("2023-06-11T10:00:00Z", "utc").value, "2023-06-11 10:00:00");
                assert.strictEqual(DateTime.createFromISO("2023-06-11T10:00:00-04:00", "utc").value, "2023-06-11 14:00:00");
            }
        );

        await test(`Given an ISO string
        when a DateTime is created in another zone
        then it should be expressed in that zone`,
            () =>
            {
                const result = DateTime.createFromISO("2023-06-11T10:00:00Z", "America/New_York");

                assert.strictEqual(result.value, "2023-06-11 06:00:00");
                assert.strictEqual(result.zone, "America/New_York");
            }
        );

        await test(`Given an invalid ISO string
        when a DateTime is created
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => DateTime.createFromISO("not an iso string", "utc"), ArgumentException);
                assert.throws(() => DateTime.createFromISO("", "utc"), ArgumentException);
            }
        );

        await test(`Given a DateTime
        when its ISO output is fed back through createFromISO
        then it should round trip`,
            () =>
            {
                const original = dt("2023-06-11 10:00:00", "America/New_York");
                const result = DateTime.createFromISO(original.toStringISO(), original.zone);

                assert.ok(result.equals(original));
            }
        );
    });
});
