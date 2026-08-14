import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime, DateTimeFormat_DEFAULT } from "../src/index.js";
import { given } from "@nivinjoseph/n-defensive";
import { ArgumentException } from "@nivinjoseph/n-exception";
import { Duration } from "@nivinjoseph/n-util";


await describe("DateTime Math", async () =>
{
    await describe("Add time", async () =>
    {
        const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
        const dateTimeNonLeapYear = new DateTime({ value: "2025-01-01 10:00:00", zone: "utc" });
        const dateTimeStartDateDst = new DateTime({ value: "2024-03-10 00:00:00", zone: "America/Los_Angeles" });
        const dateTimeEndDateDst = new DateTime({ value: "2024-11-03 00:00:00", zone: "America/Los_Angeles" });

        async function checkIsCorrect(dateTime: DateTime, duration: Duration, time: string, expectedValue: string): Promise<void>
        {
            given(dateTime, "dateTime").ensureHasValue().ensureIsType(DateTime);
            given(duration, "duration").ensureHasValue().ensureIsInstanceOf(Duration);
            given(time, "time").ensureHasValue().ensureIsString();
            given(expectedValue, "expectedValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));

            await test(`Given a DateTime (${dateTime.toString()}), and a duration of ${time}
            when duration is added to the dateTime
            then it should return value of ${expectedValue}`,
                () =>
                {
                    const result = dateTime.addTime(duration);

                    assert.strictEqual(result.value, expectedValue);
                    // the result must be canonical: its instant must equal the instant of its own (value, zone)
                    assert.strictEqual(result.timestamp, new DateTime({ value: expectedValue, zone: result.zone }).timestamp);
                }
            );
        }

        await describe("Add milliseconds", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromMilliSeconds(0), "0 milliseconds", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromMilliSeconds(1), "1 millisecond", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromMilliSeconds(60000), "60000 milliseconds", "2024-01-01 10:01:00");
        });

        await describe("Add seconds", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromSeconds(0), "0 seconds", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromSeconds(1), "1 second", "2024-01-01 10:00:01");
            await checkIsCorrect(dateTime, Duration.fromSeconds(60), "60 seconds", "2024-01-01 10:01:00");
        });

        await describe("Add minutes", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromMinutes(0), "0 minutes", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromMinutes(1), "1 minute", "2024-01-01 10:01:00");
            await checkIsCorrect(dateTime, Duration.fromMinutes(60), "60 minutes", "2024-01-01 11:00:00");

            await checkIsCorrect(dateTimeStartDateDst, Duration.fromMinutes(60), "60 minute", "2024-03-10 01:00:00");
            await checkIsCorrect(dateTimeStartDateDst, Duration.fromMinutes(120), "120 minute", "2024-03-10 03:00:00");

            await checkIsCorrect(dateTimeEndDateDst, Duration.fromMinutes(60), "60 minute", "2024-11-03 01:00:00");
            await checkIsCorrect(dateTimeEndDateDst, Duration.fromMinutes(120), "120 minute", "2024-11-03 01:00:00");
        });

        await describe("Add hours", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromHours(0), "0 hours", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromHours(1), "1 hour", "2024-01-01 11:00:00");
            await checkIsCorrect(dateTime, Duration.fromHours(24), "24 hours", "2024-01-02 10:00:00");
            await checkIsCorrect(dateTime, Duration.fromHours(48), "48 hours", "2024-01-03 10:00:00");

            await checkIsCorrect(dateTimeStartDateDst, Duration.fromHours(1), "1 hour", "2024-03-10 01:00:00");
            await checkIsCorrect(dateTimeStartDateDst, Duration.fromHours(2), "2 hours", "2024-03-10 03:00:00");

            await checkIsCorrect(dateTimeEndDateDst, Duration.fromHours(1), "1 hour", "2024-11-03 01:00:00");
            await checkIsCorrect(dateTimeEndDateDst, Duration.fromHours(2), "2 hours", "2024-11-03 01:00:00");
        });

        await describe("Add days", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromDays(0), "0 days", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromDays(1), "1 day", "2024-01-02 10:00:00");
            await checkIsCorrect(dateTime, Duration.fromDays(31), "31 days", "2024-02-01 10:00:00");
            await checkIsCorrect(dateTime, Duration.fromDays(366), "366 days", "2025-01-01 10:00:00");
            await checkIsCorrect(dateTimeNonLeapYear, Duration.fromDays(365), "365 days", "2026-01-01 10:00:00");

            await checkIsCorrect(dateTimeStartDateDst, Duration.fromDays(1), "1 day", "2024-03-11 01:00:00");

            await checkIsCorrect(dateTimeEndDateDst, Duration.fromDays(1), "1 day", "2024-11-03 23:00:00");
        });

        await describe("Add weeks", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromWeeks(0), "0 weeks", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromWeeks(1), "1 week", "2024-01-08 10:00:00");
            await checkIsCorrect(dateTime, Duration.fromWeeks(366 / 7), `366 / 7 weeks`, "2025-01-01 10:00:00");
            await checkIsCorrect(dateTimeNonLeapYear, Duration.fromWeeks(365 / 7), `365 / 7 weeks`, "2026-01-01 10:00:00");

            await checkIsCorrect(dateTimeStartDateDst, Duration.fromWeeks(1), "1 week", "2024-03-17 01:00:00");

            await checkIsCorrect(dateTimeEndDateDst, Duration.fromWeeks(1), "1 week", "2024-11-09 23:00:00");
        });
    });


    await describe("Subtract time", async () =>
    {
        const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
        const dateTimeLeapYear = new DateTime({ value: "2025-01-01 10:00:00", zone: "utc" });
        const dateTimeStartDateDst = new DateTime({ value: "2024-03-10 04:00:00", zone: "America/Los_Angeles" });
        const dateTimeEndDateDst = new DateTime({ value: "2024-11-03 04:00:00", zone: "America/Los_Angeles" });

        async function checkIsCorrect(dateTime: DateTime, duration: Duration, time: string, expectedValue: string): Promise<void>
        {
            given(dateTime, "dateTime").ensureHasValue().ensureIsType(DateTime);
            given(duration, "duration").ensureHasValue().ensureIsInstanceOf(Duration);
            given(time, "time").ensureHasValue().ensureIsString();
            given(expectedValue, "expectedValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));

            await test(`Given a DateTime (${dateTime.toString()}), and a duration of ${time}
            when duration is subtracted from the dateTime
            then it should return a value of ${expectedValue}`,
                () =>
                {
                    const result = dateTime.subtractTime(duration);

                    assert.strictEqual(result.value, expectedValue);
                    // the result must be canonical: its instant must equal the instant of its own (value, zone)
                    assert.strictEqual(result.timestamp, new DateTime({ value: expectedValue, zone: result.zone }).timestamp);
                }
            );
        }

        await describe("Subtract milliseconds", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromMilliSeconds(0), "0 milliseconds", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromMilliSeconds(1), "1 millisecond", "2024-01-01 09:59:59");
            await checkIsCorrect(dateTime, Duration.fromMilliSeconds(60000), "60000 milliseconds", "2024-01-01 09:59:00");
            await checkIsCorrect(dateTime, Duration.fromMilliSeconds(60001), "60001 milliseconds", "2024-01-01 09:58:59");
        });

        await describe("Subtract seconds", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromSeconds(0), "0 seconds", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromSeconds(1), "1 second", "2024-01-01 09:59:59");
            await checkIsCorrect(dateTime, Duration.fromSeconds(60), "60 seconds", "2024-01-01 09:59:00");
            await checkIsCorrect(dateTime, Duration.fromSeconds(61), "61 seconds", "2024-01-01 09:58:59");
        });

        await describe("Subtract minutes", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromMinutes(0), "0 minutes", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromMinutes(1), "1 minute", "2024-01-01 09:59:00");
            await checkIsCorrect(dateTime, Duration.fromMinutes(60), "60 minutes", "2024-01-01 09:00:00");
            await checkIsCorrect(dateTime, Duration.fromMinutes(61), "61 minutes", "2024-01-01 08:59:00");

            await checkIsCorrect(dateTimeStartDateDst, Duration.fromMinutes(60), "60 minute", "2024-03-10 03:00:00");
            await checkIsCorrect(dateTimeStartDateDst, Duration.fromMinutes(120), "120 minute", "2024-03-10 01:00:00");

            await checkIsCorrect(dateTimeEndDateDst, Duration.fromMinutes(60), "60 minute", "2024-11-03 03:00:00");
            await checkIsCorrect(dateTimeEndDateDst, Duration.fromMinutes(120), "120 minute", "2024-11-03 02:00:00");
            await checkIsCorrect(dateTimeEndDateDst, Duration.fromMinutes(180), "180 minute", "2024-11-03 01:00:00");
            await checkIsCorrect(dateTimeEndDateDst, Duration.fromMinutes(240), "240 minute", "2024-11-03 01:00:00");
        });

        await describe("Subtract hours", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromHours(0), "0 hours", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromHours(1), "1 hour", "2024-01-01 09:00:00");
            await checkIsCorrect(dateTime, Duration.fromHours(24), "24 hours", "2023-12-31 10:00:00");
            await checkIsCorrect(dateTime, Duration.fromHours(25), "25 hours", "2023-12-31 09:00:00");

            await checkIsCorrect(dateTimeStartDateDst, Duration.fromHours(1), "1 hour", "2024-03-10 03:00:00");
            await checkIsCorrect(dateTimeStartDateDst, Duration.fromHours(2), "2 hours", "2024-03-10 01:00:00");
            await checkIsCorrect(dateTimeStartDateDst, Duration.fromHours(24), "24 hours", "2024-03-09 03:00:00");

            await checkIsCorrect(dateTimeEndDateDst, Duration.fromHours(1), "1 hour", "2024-11-03 03:00:00");
            await checkIsCorrect(dateTimeEndDateDst, Duration.fromHours(2), "2 hours", "2024-11-03 02:00:00");
            await checkIsCorrect(dateTimeEndDateDst, Duration.fromHours(3), "3 hours", "2024-11-03 01:00:00");
            await checkIsCorrect(dateTimeEndDateDst, Duration.fromHours(4), "4 hours", "2024-11-03 01:00:00");
            await checkIsCorrect(dateTimeEndDateDst, Duration.fromHours(24), "24 hours", "2024-11-02 05:00:00");
        });

        await describe("Subtract days", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromDays(0), "0 days", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromDays(1), "1 day", "2023-12-31 10:00:00");
            await checkIsCorrect(dateTime, Duration.fromDays(31), "31 days", "2023-12-01 10:00:00");
            await checkIsCorrect(dateTime, Duration.fromDays(365), "365 days", "2023-01-01 10:00:00");
            await checkIsCorrect(dateTimeLeapYear, Duration.fromDays(366), "366 days", "2024-01-01 10:00:00");

            await checkIsCorrect(dateTimeStartDateDst, Duration.fromDays(1), "1 day", "2024-03-09 03:00:00");

            await checkIsCorrect(dateTimeEndDateDst, Duration.fromDays(1), "1 day", "2024-11-02 05:00:00");
        });

        await describe("Subtract weeks", async () =>
        {
            await checkIsCorrect(dateTime, Duration.fromWeeks(0), "0 weeks", dateTime.value);
            await checkIsCorrect(dateTime, Duration.fromWeeks(1), "1 week", "2023-12-25 10:00:00");
            await checkIsCorrect(dateTime, Duration.fromWeeks(365 / 7), `365 / 7 weeks`, "2023-01-01 10:00:00");
            await checkIsCorrect(dateTimeLeapYear, Duration.fromWeeks(366 / 7), `366 / 7 weeks`, "2024-01-01 10:00:00");

            await checkIsCorrect(dateTimeStartDateDst, Duration.fromWeeks(1), "1 week", "2024-03-03 03:00:00");

            await checkIsCorrect(dateTimeEndDateDst, Duration.fromWeeks(1), "1 week", "2024-10-27 05:00:00");
        });
    });


    await describe("Add days", async () =>
    {
        const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
        const dateTimeNonLeapYear = new DateTime({ value: "2025-01-01 10:00:00", zone: "utc" });

        await describe("Add days", async () =>
        {
            async function checkIsCorrect(dateTime: DateTime, days: number, expectedValue: string): Promise<void>
            {
                given(dateTime, "dateTime").ensureHasValue().ensureIsType(DateTime);
                given(days, "days").ensureHasValue().ensureIsNumber();
                given(expectedValue, "expectedValue").ensureHasValue().ensureIsString()
                    .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));

                await test(`Given a DateTime (${dateTime.toString()}), and number of days ${days}
                when number of days is added to the dateTime
                then it should return value of ${expectedValue}`,
                    () =>
                    {
                        assert.strictEqual(dateTime.addDays(days).value, expectedValue);
                    }
                );
            }

            await checkIsCorrect(dateTime, 0, dateTime.value);
            await checkIsCorrect(dateTime, 1, "2024-01-02 10:00:00");
            await checkIsCorrect(dateTime, 31, "2024-02-01 10:00:00");
            await checkIsCorrect(dateTime, 366, "2025-01-01 10:00:00");
            await checkIsCorrect(dateTimeNonLeapYear, 365, "2026-01-01 10:00:00");

            const dateTimeStartDateDst = new DateTime({ value: "2024-03-10 00:00:00", zone: "America/Los_Angeles" });
            await checkIsCorrect(dateTimeStartDateDst, 1, "2024-03-11 00:00:00");

            const dateTimeEndDateDst = new DateTime({ value: "2024-11-03 00:00:00", zone: "America/Los_Angeles" });
            await checkIsCorrect(dateTimeEndDateDst, 1, "2024-11-04 00:00:00");
        });

        await describe("Invalid Params", async () =>
        {
            async function checkIsInvalidParam(days: number, reason: string): Promise<void>
            {
                await test(`Given a DateTime (${dateTime.toString()}), and and number of days ${days}
                when days is added to dateTime and ${reason}
                then it should throw a validation error`,
                    () =>
                    {
                        assert.throws(() => dateTime.addDays(days), ArgumentException);
                    }
                );
            }

            await checkIsInvalidParam(0.5, "number of days is not integer");
            await checkIsInvalidParam(-1.5, "number of days is not integer");
            await checkIsInvalidParam(1.5, "number of days is not integer");

            await test(`Given a DateTime (2024-01-01 10:00:00 utc), and a negative number of days
                when days is added to dateTime
                then it should shift backwards`,
                () =>
                {
                    const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                    assert.strictEqual(dateTime.addDays(-1).value, "2023-12-31 10:00:00");
                    assert.ok(dateTime.addDays(-1).equals(dateTime.subtractDays(1)));
                }
            );
        });
    });

    await describe("Subtract days", async () =>
    {
        const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
        const dateTimeLeapYear = new DateTime({ value: "2025-01-01 10:00:00", zone: "utc" });

        await describe("Subtract days", async () =>
        {
            async function checkIsCorrect(dateTime: DateTime, days: number, expectedValue: string): Promise<void>
            {
                given(dateTime, "dateTime").ensureHasValue().ensureIsType(DateTime);
                given(days, "days").ensureHasValue().ensureIsNumber();
                given(expectedValue, "expectedValue").ensureHasValue().ensureIsString()
                    .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));

                await test(`Given a DateTime (${dateTime.toString()}), and number of days ${days}
                when number of days is added to the dateTime
                then it should return value of ${expectedValue}`,
                    () =>
                    {
                        assert.strictEqual(dateTime.subtractDays(days).value, expectedValue);
                    }
                );
            }


            await checkIsCorrect(dateTime, 0, dateTime.value);
            await checkIsCorrect(dateTime, 1, "2023-12-31 10:00:00");
            await checkIsCorrect(dateTime, 31, "2023-12-01 10:00:00");
            await checkIsCorrect(dateTime, 365, "2023-01-01 10:00:00");
            await checkIsCorrect(dateTimeLeapYear, 366, "2024-01-01 10:00:00");
            await checkIsCorrect(new DateTime({ value: "2024-03-10 10:00:00", zone: "America/Los_Angeles" }), 1, "2024-03-09 10:00:00");

            const dateTimeStartDateDst = new DateTime({ value: "2024-03-10 04:00:00", zone: "America/Los_Angeles" });
            await checkIsCorrect(dateTimeStartDateDst, 1, "2024-03-09 04:00:00");

            const dateTimeEndDateDst = new DateTime({ value: "2024-11-03 04:00:00", zone: "America/Los_Angeles" });
            await checkIsCorrect(dateTimeEndDateDst, 1, "2024-11-02 04:00:00");
        });

        await describe("Invalid Params", async () =>
        {
           async  function checkIsInvalidParam(days: number, reason: string): Promise<void>
            {
                await test(`Given a DateTime (${dateTime.toString()}), and and number of days ${days}
                when days is subtracted from dateTime and ${reason}
                then it should throw a validation error`,
                    () =>
                    {
                        assert.throws(() => dateTime.subtractDays(days), ArgumentException);
                    }
                );
            }

            await checkIsInvalidParam(0.5, "number of days is not integer");
            await checkIsInvalidParam(-1.5, "number of days is not integer");
            await checkIsInvalidParam(1.5, "number of days is not integer");

            await test(`Given a DateTime (2024-01-01 10:00:00 utc), and a negative number of days
                when days is subtracted from dateTime
                then it should shift forwards`,
                () =>
                {
                    const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                    assert.strictEqual(dateTime.subtractDays(-1).value, "2024-01-02 10:00:00");
                    assert.ok(dateTime.subtractDays(-1).equals(dateTime.addDays(1)));
                }
            );
        });
    });
});

