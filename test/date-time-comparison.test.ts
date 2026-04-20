import { given } from "@nivinjoseph/n-defensive";
import { ArgumentException } from "@nivinjoseph/n-exception";
import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime, DateTimeFormat_DEFAULT } from "../src/index.js";
import { Duration } from "@nivinjoseph/n-util";


await describe("DateTime Comparison", async () =>
{

    async function testDifferentSetOfValues(compareFunction: (minValue: string, maxValue: string, diff: string,
        timeDiff: Duration, daysDiff: number) => Promise<void>): Promise<void>
    {
        // Compare different minutes in same zone
        await compareFunction(
            "2024-01-01 10:00:00",
            "2024-01-01 10:01:00",
            "1 minute",
            Duration.fromMinutes(1),
            0
        );

        // Compare different hours in same zone
        await compareFunction(
            "2024-01-01 10:00:00",
            "2024-01-01 11:00:00",
            "1 hour",
            Duration.fromHours(1),
            0
        );

        // Compare different days in same zone
        await compareFunction(
            "2024-01-01 10:00:00",
            "2024-01-02 10:00:00",
            "1 day",
            Duration.fromDays(1),
            1
        );

        // Compare different months in same zone
        await compareFunction(
            "2024-01-01 10:00:00",
            "2024-02-01 10:00:00",
            "1 month",
            Duration.fromDays(31),
            31
        );

        // Compare different years in same zone
        await compareFunction(
            "2023-01-01 10:00:00",
            "2024-01-01 10:00:00",
            "1 year",
            Duration.fromDays(365),
            365
        );

        // Compare different years (leap year) in same zone
        await compareFunction(
            "2024-01-01 10:00:00",
            "2025-01-01 10:00:00",
            "1 year",
            Duration.fromDays(366),
            366
        );
    }


    async function testDifferentZones(compareFunction: (value: string, behindZone: string, aheadZone: string, diff: string,
        timeDiff: Duration, daysDiff: number) => Promise<void>): Promise<void>
    {
        // Compare same value but different zones utc and IST (UTC+5:30)
        await compareFunction(
            "2024-01-01 10:00:00",
            "utc",
            "UTC+5:30",
            "5 hour 30 minute",
            Duration.fromHours(5.5),
            0
        );

        // Compare same value but different zones America/Los_Angeles and utc
        // could be 7 or 8 based on Daylight savings
        await compareFunction(
            "2024-01-01 10:00:00",
            "America/Los_Angeles",
            "utc",
            `8 hours`,
            Duration.fromHours(8),
            0
        );

        // Compare same value but different zones America/Los_Angeles and IST(UTC+5:30)
        // could be 12.5 or 13.5 based on Daylight savings
        await compareFunction(
            "2024-01-01 10:00:00",
            "America/Los_Angeles",
            "UTC+5:30",
            `13 hours 30 minutes`,
            Duration.fromHours(13.5),
            0
        );

        await compareFunction(
            "2024-06-01 10:00:00",
            "America/Los_Angeles",
            "UTC+5:30",
            `12 hours 30 minutes`,
            Duration.fromHours(12.5),
            0
        );
    }


    async function testSameTimestampDifferentValueAndZone(compareFunction: (dateTime1: DateTime, dateTime2: DateTime) => Promise<void>): Promise<void>
    {
        const utcDateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

        // Compare different value and zones utc and IST but represent same time
        await compareFunction(
            utcDateTime,
            utcDateTime.convertToZone("UTC+5:30")
        );

        // Compare different value and zones America/Los_Angeles and utc but represent same time
        await compareFunction(
            utcDateTime,
            utcDateTime.convertToZone("America/Los_Angeles")
        );

        // Compare different value and zones America/Los_Angeles and utc but represent same time
        await compareFunction(
            utcDateTime.convertToZone("UTC+5:30"),
            utcDateTime.convertToZone("America/Los_Angeles")
        );
    }

    await describe("DateTime.min", async () =>
    {
        await test(`Given the same DateTime object
        when it's compared with DateTime.min 
        then it should return the min DateTime object`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                assert.strictEqual(DateTime.min(dateTime, dateTime), dateTime); // return second arg when same
            }
        );

        await test(`Given two DateTime object with same value and zone
        when it's compared with DateTime.min 
        then it should return the second dateTime that's passed in`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.strictEqual(DateTime.min(dateTime1, dateTime2), dateTime2); // return second arg when same
                assert.strictEqual(DateTime.min(dateTime2, dateTime1), dateTime1); // return second arg when same
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's compared with DateTime.min 
            then it should return the one with value ${minValue}`,
                () =>
                {
                    assert.strictEqual(DateTime.min(min, max), min);
                    assert.strictEqual(DateTime.min(max, min), min);
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
            when it's compared with DateTime.min 
            then it should return the one with zone ${aheadZone}`,
                () =>
                {
                    assert.strictEqual(DateTime.min(min, max), min);
                    assert.strictEqual(DateTime.min(max, min), min);
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
            when it's compared with DateTime.min 
            then it should return the second dateTime that's passed in`,
                () =>
                {
                    assert.strictEqual(DateTime.min(dateTime1, dateTime2), dateTime2); // return second arg when same
                    assert.strictEqual(DateTime.min(dateTime2, dateTime1), dateTime1); // return second arg when same
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime.max", async () =>
    {
        await test(`Given the same DateTime object
        when it's compared with DateTime.max 
        then it should return the max DateTime object`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                assert.strictEqual(DateTime.max(dateTime, dateTime), dateTime); // return second arg when same
            }
        );

        await test(`Given two DateTime object with same value and zone
        when it's compared with DateTime.max 
        then it should return the second dateTime that's passed in`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.strictEqual(DateTime.max(dateTime1, dateTime2), dateTime2); // return second arg when same
                assert.strictEqual(DateTime.max(dateTime2, dateTime1), dateTime1); // return second arg when same
            }
        );


        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's compared with DateTime.max 
            then it should return the one with value ${maxValue}`,
                () =>
                {
                    assert.strictEqual(DateTime.max(min, max), max);
                    assert.strictEqual(DateTime.max(max, min), max);
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
            when it's compared with DateTime.max 
            then it should return the one with zone ${aheadZone}`,
                () =>
                {
                    assert.strictEqual(DateTime.max(min, max), max);
                    assert.strictEqual(DateTime.max(max, min), max);
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
            when it's compared with DateTime.max 
            then it should return the second dateTime that's passed in`,
                () =>
                {
                    assert.strictEqual(DateTime.max(dateTime1, dateTime2), dateTime2); // return second arg when same
                    assert.strictEqual(DateTime.max(dateTime2, dateTime1), dateTime1); // return second arg when same
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime Is Same", async () =>
    {
        await test(`Given the same DateTime object
        when it's checked one is same as the other
        then it should return true`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                assert.ok(dateTime.isSame(dateTime));
            }
        );

        await test(`Given two DateTime object with same value and zone
        when it's checked one is same as the other
        then it should return true`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.ok(dateTime1.isSame(dateTime2));
                assert.ok(dateTime2.isSame(dateTime1));
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked one is same as the other
            then it should return false`,
                () =>
                {
                    assert.ok(!min.isSame(max));
                    assert.ok(!max.isSame(min));
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
            when it's checked one is same as the other
            then it should return false`,
                () =>
                {
                    assert.ok(!min.isSame(max));
                    assert.ok(!max.isSame(min));
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
            when it's checked one is same as the other
            then it should return true`,
                () =>
                {
                    assert.ok(dateTime1.isSame(dateTime2));
                    assert.ok(dateTime2.isSame(dateTime1));
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime Is Same Day", async () =>
    {
        await test(`Given the same DateTime object
        when checking if they are on the same day
        then it should return true`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                assert.ok(dateTime.isSameDay(dateTime));
            }
        );

        await test(`Given two DateTime object with same value and zone
        when checking if they are on the same day
        then it should return true`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.ok(dateTime1.isSameDay(dateTime2));
                assert.ok(dateTime2.isSameDay(dateTime1));
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string,
            _: Duration, daysDiff: number): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();
            given(daysDiff, "daysDiff").ensureHasValue().ensureIsNumber().ensure(t => t >= 0);

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when checking if they are on the same day
            then it should return ${daysDiff > 0}`,
                () =>
                {
                    assert.ok(daysDiff > 0 ? !min.isSameDay(max) : min.isSameDay(max));
                    assert.ok(daysDiff > 0 ? !max.isSameDay(min) : max.isSameDay(min));
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string,
            _: Duration, daysDiff: number): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);


            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when checking if they are on the same day
                then it should return ${daysDiff > 0}`,
                () =>
                {
                    assert.ok(daysDiff > 0 ? !min.isSameDay(max) : min.isSameDay(max));
                    assert.ok(daysDiff > 0 ? !max.isSameDay(min) : max.isSameDay(min));
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
                when checking if they are on the same day
                then it should return true`,
                () =>
                {
                    assert.ok(dateTime1.isSameDay(dateTime2));
                    assert.ok(dateTime2.isSameDay(dateTime1));
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime Is Equals", async () =>
    {
        await test(`Given the same DateTime object
        when it's checked one equals the other
        then it should return true`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                assert.ok(dateTime.equals(dateTime));
            }
        );

        await test(`Given two DateTime object with same value and zone
        when it's checked one equals the other
        then it should return true`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.ok(dateTime1.equals(dateTime2));
                assert.ok(dateTime2.equals(dateTime1));
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked one equals the other
            then it should return false`,
                () =>
                {
                    assert.ok(!min.equals(max));
                    assert.ok(!max.equals(min));
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when it's checked one equals the other
                then it should return false`,
                () =>
                {
                    assert.ok(!min.equals(max));
                    assert.ok(!max.equals(min));
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
                when it's checked one equals the other
                then it should return false`,
                () =>
                {
                    assert.ok(!dateTime1.equals(dateTime2));
                    assert.ok(!dateTime2.equals(dateTime1));
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime Is Before", async () =>
    {
        await test(`Given the same DateTime object
        when it's checked one is before the other
        then it should return false`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                assert.ok(!dateTime.isBefore(dateTime));
            }
        );

        await test(`Given two DateTime object with same value and zone
        when it's checked one is before the other
        then it should return false`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.ok(!dateTime1.isBefore(dateTime2));
                assert.ok(!dateTime2.isBefore(dateTime1));
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked dateTime with value ${minValue} is before the dateTime with value ${maxValue}
            then it should return true`,
                () =>
                {
                    assert.ok(min.isBefore(max));
                }
            );

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked dateTime with value ${maxValue} is before the dateTime with value ${minValue}
            then it should return false`,
                () =>
                {
                    assert.ok(!max.isBefore(min));
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when it's checked dateTime with zone ${aheadZone} is before the dateTime with zone ${behindZone}
                then it should return true`,
                () =>
                {
                    assert.ok(min.isBefore(max));
                }
            );

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
            when it's checked dateTime with zone ${behindZone} is before the dateTime with zone ${aheadZone}
            then it should return false`,
                () =>
                {
                    assert.ok(!max.isBefore(min));
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
                when it's checked one is before the other
                then it should return false`,
                () =>
                {
                    assert.ok(!dateTime1.isBefore(dateTime2));
                    assert.ok(!dateTime2.isBefore(dateTime1));
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime Is Same or Before", async () =>
    {
        await test(`Given the same DateTime object
        when it's checked one is same or before the other
        then it should return true`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                assert.ok(dateTime.isSameOrBefore(dateTime));
            }
        );

        await test(`Given two DateTime object with same value and zone
        when it's checked one is same or before the other
        then it should return true`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.ok(dateTime1.isSameOrBefore(dateTime2));
                assert.ok(dateTime2.isSameOrBefore(dateTime1));
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked dateTime with value ${minValue} is same or before the dateTime with value ${maxValue}
            then it should return true`,
                () =>
                {
                    assert.ok(min.isSameOrBefore(max));
                }
            );

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked dateTime with value ${maxValue} is same or before the dateTime with value ${minValue}
            then it should return false`,
                () =>
                {
                    assert.ok(!max.isSameOrBefore(min));
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when it's checked dateTime with zone ${aheadZone} is same or before the dateTime with zone ${behindZone}
                then it should return true`,
                () =>
                {
                    assert.ok(min.isSameOrBefore(max));
                }
            );

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when it's checked dateTime with zone ${behindZone} is same or before the dateTime with zone ${aheadZone}
                then it should return false`,
                () =>
                {
                    assert.ok(!max.isSameOrBefore(min));
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
                when it's checked one is same or before the other
                then it should return true`,
                () =>
                {
                    assert.ok(dateTime1.isSameOrBefore(dateTime2));
                    assert.ok(dateTime2.isSameOrBefore(dateTime1));
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime Is After", async () =>
    {
        await test(`Given the same DateTime object
        when it's checked one is after the other
        then it should return false`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                assert.ok(!dateTime.isAfter(dateTime));
            }
        );

        await test(`Given two DateTime object with same value and zone
        when it's checked one is after the other
        then it should return false`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.ok(!dateTime1.isAfter(dateTime2));
                assert.ok(!dateTime2.isAfter(dateTime1));
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked dateTime with value ${minValue} is after the dateTime with value ${maxValue}
            then it should return false`,
                () =>
                {
                    assert.ok(!min.isAfter(max));
                }
            );

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked dateTime with value ${maxValue} is after the dateTime with value ${minValue}
            then it should return true`,
                () =>
                {
                    assert.ok(max.isAfter(min));
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when it's checked dateTime with zone ${aheadZone} is after the dateTime with zone ${behindZone}
                then it should return false`,
                () =>
                {
                    assert.ok(!min.isAfter(max));
                }
            );

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when it's checked dateTime with zone ${behindZone} is after the dateTime with zone ${aheadZone}
                then it should return true`,
                () =>
                {
                    assert.ok(max.isAfter(min));
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
                when it's checked one is after the other
                then it should return false`,
                () =>
                {
                    assert.ok(!dateTime1.isAfter(dateTime2));
                    assert.ok(!dateTime2.isAfter(dateTime1));
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime Is Same or After", async () =>
    {
        await test(`Given the same DateTime object
        when it's checked one is same or after the other
        then it should return true`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                assert.ok(dateTime.isSameOrAfter(dateTime));
            }
        );

        await test(`Given two DateTime object with same value and zone
        when it's checked one is same or after the other
        then it should return true`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.ok(dateTime1.isSameOrAfter(dateTime2));
                assert.ok(dateTime2.isSameOrAfter(dateTime1));
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked dateTime with value ${minValue} is same or after the dateTime with value ${maxValue}
            then it should return false`,
                () =>
                {
                    assert.ok(!min.isAfter(max));
                    assert.ok(!min.isSameOrAfter(max));
                }
            );

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when it's checked dateTime with value ${maxValue} is same or after the dateTime with value ${minValue}
            then it should return true`,
                () =>
                {
                    assert.ok(max.isSameOrAfter(min));
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when it's checked dateTime with zone ${aheadZone} is same or after the dateTime with zone ${behindZone}
                then it should return false`,
                () =>
                {
                    assert.ok(!min.isSameOrAfter(max));
                }
            );

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when it's checked dateTime with zone ${behindZone} is same or after the dateTime with zone ${aheadZone}
                then it should return true`,
                () =>
                {
                    assert.ok(max.isSameOrAfter(min));
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
                when it's checked one is same or after the other
                then it should return true`,
                () =>
                {
                    assert.ok(dateTime1.isSameOrAfter(dateTime2));
                    assert.ok(dateTime2.isSameOrAfter(dateTime1));
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime Time Difference", async () =>
    {
        await test(`Given the same DateTime object
        when checking the time difference between them
        then it should return Duration of 0 milliseconds`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.strictEqual(dateTime.timeDiff(dateTime).toMilliSeconds(), 0);
            }
        );

        await test(`Given two DateTime object with same value and zone
        when checking the time difference between them
        then it should return Duration of 0 milliseconds`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.strictEqual(dateTime1.timeDiff(dateTime2).toMilliSeconds(), 0);
                assert.strictEqual(dateTime2.timeDiff(dateTime1).toMilliSeconds(), 0);
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string, timeDiff: Duration): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();
            given(timeDiff, "timeDiff").ensureHasValue().ensureIsInstanceOf(Duration);

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when checking the time difference between them
            then it should return Duration of ${diff}`,
                () =>
                {
                    assert.strictEqual(min.timeDiff(max).toMilliSeconds(), timeDiff.toMilliSeconds());
                    assert.strictEqual(max.timeDiff(min).toMilliSeconds(), timeDiff.toMilliSeconds());
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string, timeDiff: Duration): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();
            given(timeDiff, "timeDiff").ensureHasValue().ensureIsInstanceOf(Duration);

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when checking the time difference between them
                then it should return Duration of ${diff}`,
                () =>
                {
                    assert.strictEqual(min.timeDiff(max).toMilliSeconds(), timeDiff.toMilliSeconds());
                    assert.strictEqual(max.timeDiff(min).toMilliSeconds(), timeDiff.toMilliSeconds());
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
                when checking the time difference between them
                then it should return Duration of 0 milliseconds`,
                () =>
                {
                    assert.strictEqual(dateTime1.timeDiff(dateTime2).toMilliSeconds(), 0);
                    assert.strictEqual(dateTime2.timeDiff(dateTime1).toMilliSeconds(), 0);
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("DateTime Days Difference", async () =>
    {
        await test(`Given the same DateTime object
        when checking the difference between them in calendar days
        then it should return 0`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.strictEqual(dateTime.daysDiff(dateTime), 0);
            }
        );

        await test(`Given two DateTime object with same value and zone
        when checking the difference between them in calendar days
        then it should return 0`,
            () =>
            {
                const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
                const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.strictEqual(dateTime1.daysDiff(dateTime2), 0);
                assert.strictEqual(dateTime2.daysDiff(dateTime1), 0);
            }
        );

        async function compareDateTimeWithDifferentValues(minValue: string, maxValue: string, diff: string,
            _: Duration, daysDiff: number): Promise<void>
        {
            given(minValue, "minValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(maxValue, "maxValue").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(diff, "diff").ensureHasValue().ensureIsString();
            given(daysDiff, "daysDiff").ensureHasValue().ensureIsNumber().ensure(t => t >= 0);

            const min = new DateTime({ value: minValue, zone: "utc" });
            const max = new DateTime({ value: maxValue, zone: "utc" });

            await test(`Given two DateTime objects ${minValue} and ${maxValue}, ${diff} apart in the same zone
            when checking the difference between them in calendar days
            then it should return ${daysDiff}`,
                () =>
                {
                    assert.strictEqual(min.daysDiff(max), daysDiff);
                    assert.strictEqual(max.daysDiff(min), daysDiff);
                }
            );
        }

        await testDifferentSetOfValues(compareDateTimeWithDifferentValues);

        async function compareDateTimeWithDifferentZones(value: string, behindZone: string, aheadZone: string, diff: string,
            _: Duration, daysDiff: number): Promise<void>
        {
            given(value, "value").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateDateTimeFormat(t, DateTimeFormat_DEFAULT));
            given(behindZone, "behindZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(aheadZone, "aheadZone").ensureHasValue().ensureIsString()
                .ensure(t => DateTime.validateTimeZone(t));
            given(diff, "diff").ensureHasValue().ensureIsString();
            given(daysDiff, "daysDiff").ensureHasValue().ensureIsNumber().ensure(t => t >= 0);

            const min = new DateTime({ value, zone: aheadZone });
            const max = new DateTime({ value, zone: behindZone });

            given(min, "min").ensure(t => t.timestamp < max.timestamp,
                `zone ${aheadZone} is not ahead of ${behindZone}`);

            await test(`Given two DateTime object with same value and zones ${behindZone} and ${aheadZone} with difference ${diff}
                when checking the difference between them in calendar days
                then it should return ${daysDiff}`,
                () =>
                {
                    assert.strictEqual(min.daysDiff(max), daysDiff);
                    assert.strictEqual(max.daysDiff(min), daysDiff);
                }
            );
        }

        await testDifferentZones(compareDateTimeWithDifferentZones);

        async function compareDateTimeWithSameTimestamp(dateTime1: DateTime, dateTime2: DateTime): Promise<void>
        {
            given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
            given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.timestamp === dateTime1.timestamp, "Timestamps are different");

            await test(`Given two DateTime object with different value and zones (${dateTime1.toString()} and ${dateTime2.toString()}) but represents same time
                when checking the difference between them in calendar days
                then it should return 0`,
                () =>
                {
                    assert.strictEqual(dateTime1.daysDiff(dateTime2), 0);
                    assert.strictEqual(dateTime2.daysDiff(dateTime1), 0);
                }
            );
        }

        await testSameTimestampDifferentValueAndZone(compareDateTimeWithSameTimestamp);
    });

    await describe("Compare three date time Is Between", async () =>
    {
        async function checkIsInvalidParams(dateTime: DateTime, start: DateTime, end: DateTime): Promise<void>
        {
            await test(`Given a DateTime (${dateTime.toString()}), and a start (${start.toString()}) and end (${end.toString()}) DateTime
            when start DateTime timeStamp is after end DateTime timeStamp
            then it should throw a validation error`,
                () =>
                {
                    assert.throws(() => dateTime.isBetween(start, end), ArgumentException);
                }
            );
        }

        async function checkIsCorrect(dateTime: DateTime, start: DateTime, end: DateTime): Promise<void>
        {
            given(dateTime, "dateTime").ensureHasValue().ensureIsType(DateTime);
            given(start, "start").ensureHasValue().ensureIsType(DateTime);
            given(end, "end").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.isSameOrAfter(start), "must be same or after start");

            await test(`Given a DateTime (${dateTime.toString()}), and a start (${start.toString()}) and end (${end.toString()}) DateTime
            when dateTime is in between start and end
            then it should return true`,
                () =>
                {
                    assert.ok(dateTime.isBetween(start, end));
                }
            );
        }

        async function checkIsFalse(dateTime: DateTime, start: DateTime, end: DateTime): Promise<void>
        {
            given(dateTime, "dateTime").ensureHasValue().ensureIsType(DateTime);
            given(start, "start").ensureHasValue().ensureIsType(DateTime);
            given(end, "end").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.isSameOrAfter(start), "must be same or after start");

            await test(`Given a DateTime (${dateTime.toString()}), and a start (${start.toString()}) and end (${end.toString()}) DateTime
            when dateTime is not in between start and end
            then it should return false`,
                () =>
                {
                    assert.ok(!dateTime.isBetween(start, end));
                }
            );
        }

        await test(`Given dateTime start and end as the same DateTime object
        when it's checked it's between the same DateTime
        then it should return true`, () =>
        {
            const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

            assert.ok(dateTime.isBetween(dateTime, dateTime));
        });

        await test(`Given dateTime start and end with same value and zone
        when it's compared isBetween
        then it should return true`, () =>
        {
            const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime3 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

            assert.ok(dateTime1.isBetween(dateTime2, dateTime3));
            assert.ok(dateTime2.isBetween(dateTime1, dateTime3));
            assert.ok(dateTime3.isBetween(dateTime1, dateTime2));
        });

        await describe("Compare different minutes", async () =>
        {
            const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime2 = new DateTime({ value: "2024-01-01 10:01:00", zone: "utc" });
            const dateTime3 = new DateTime({ value: "2024-01-01 10:02:00", zone: "utc" });

            await checkIsFalse(dateTime1, dateTime2, dateTime3);
            await checkIsInvalidParams(dateTime1, dateTime3, dateTime2);

            await checkIsCorrect(dateTime2, dateTime1, dateTime3);
            await checkIsInvalidParams(dateTime2, dateTime3, dateTime1);

            await checkIsFalse(dateTime3, dateTime1, dateTime2);
            await checkIsInvalidParams(dateTime3, dateTime2, dateTime1);
        });

        await describe("Compare different hours", async () =>
        {
            const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime2 = new DateTime({ value: "2024-01-01 11:00:00", zone: "utc" });
            const dateTime3 = new DateTime({ value: "2024-01-01 12:00:00", zone: "utc" });

            await checkIsFalse(dateTime1, dateTime2, dateTime3);
            await checkIsInvalidParams(dateTime1, dateTime3, dateTime2);

            await checkIsCorrect(dateTime2, dateTime1, dateTime3);
            await checkIsInvalidParams(dateTime2, dateTime3, dateTime1);

            await checkIsFalse(dateTime3, dateTime1, dateTime2);
            await checkIsInvalidParams(dateTime3, dateTime2, dateTime1);
        });

        await describe("Compare different days", async () =>
        {
            const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime2 = new DateTime({ value: "2024-01-02 10:00:00", zone: "utc" });
            const dateTime3 = new DateTime({ value: "2024-01-03 10:00:00", zone: "utc" });

            await checkIsFalse(dateTime1, dateTime2, dateTime3);
            await checkIsInvalidParams(dateTime1, dateTime3, dateTime2);

            await checkIsCorrect(dateTime2, dateTime1, dateTime3);
            await checkIsInvalidParams(dateTime2, dateTime3, dateTime1);

            await checkIsFalse(dateTime3, dateTime1, dateTime2);
            await checkIsInvalidParams(dateTime3, dateTime2, dateTime1);
        });

        await describe("Compare different months", async () =>
        {
            const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime2 = new DateTime({ value: "2024-02-01 10:00:00", zone: "utc" });
            const dateTime3 = new DateTime({ value: "2024-03-01 10:00:00", zone: "utc" });

            await checkIsFalse(dateTime1, dateTime2, dateTime3);
            await checkIsInvalidParams(dateTime1, dateTime3, dateTime2);

            await checkIsCorrect(dateTime2, dateTime1, dateTime3);
            await checkIsInvalidParams(dateTime2, dateTime3, dateTime1);

            await checkIsFalse(dateTime3, dateTime1, dateTime2);
            await checkIsInvalidParams(dateTime3, dateTime2, dateTime1);
        });

        await describe("Compare different years", async () =>
        {
            const dateTime1 = new DateTime({ value: "2023-01-01 10:00:00", zone: "utc" });
            const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime3 = new DateTime({ value: "2025-01-01 10:00:00", zone: "utc" });

            await checkIsFalse(dateTime1, dateTime2, dateTime3);
            await checkIsInvalidParams(dateTime1, dateTime3, dateTime2);

            await checkIsCorrect(dateTime2, dateTime1, dateTime3);
            await checkIsInvalidParams(dateTime2, dateTime3, dateTime1);

            await checkIsFalse(dateTime3, dateTime1, dateTime2);
            await checkIsInvalidParams(dateTime3, dateTime2, dateTime1);
        });

        await describe("Compare different zones", async () =>
        {
            const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "UTC+5:30" });
            const dateTime2 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime3 = new DateTime({ value: "2024-01-01 10:00:00", zone: "America/Los_Angeles" });

            await checkIsFalse(dateTime1, dateTime2, dateTime3);
            await checkIsInvalidParams(dateTime1, dateTime3, dateTime2);

            await checkIsCorrect(dateTime2, dateTime1, dateTime3);
            await checkIsInvalidParams(dateTime2, dateTime3, dateTime1);

            await checkIsFalse(dateTime3, dateTime1, dateTime2);
            await checkIsInvalidParams(dateTime3, dateTime2, dateTime1);
        });
    });

    await describe("Compare DateTime is within time range", async () =>
    {
        async function checkIsInvalidParams(dateTime: DateTime, startTimeCode: string, endTimeCode: string, reason: string): Promise<void>
        {
            await test(`Given a DateTime (${dateTime.toString()}), and a startTimeCode (${startTimeCode}) and endTimeCode (${endTimeCode})
            when ${reason}
            then it should throw a validation error`,
                () =>
                {
                    assert.throws(() => dateTime.isWithinTimeRange(startTimeCode, endTimeCode), ArgumentException);
                }
            );
        }

        async function checkIsCorrect(dateTime: DateTime, startTimeCode: string, endTimeCode: string): Promise<void>
        {
            given(dateTime, "dateTime").ensureHasValue().ensureIsType(DateTime);
            given(startTimeCode, "startTimeCode").ensureHasValue().ensureIsString();
            given(endTimeCode, "startTimeCode").ensureHasValue().ensureIsString();

            await test(`Given a DateTime (${dateTime.toString()}), and a startTimeCode (${startTimeCode}) and endTimeCode (${endTimeCode})
                when dateTime is within start and end time
                then it should return true`,
                () =>
                {
                    assert.ok(dateTime.isWithinTimeRange(startTimeCode, endTimeCode));
                }
            );
        }

        async function checkIsFalse(dateTime: DateTime, startTimeCode: string, endTimeCode: string): Promise<void>
        {
            given(dateTime, "dateTime").ensureHasValue().ensureIsType(DateTime);
            given(startTimeCode, "startTimeCode").ensureHasValue().ensureIsString();
            given(endTimeCode, "startTimeCode").ensureHasValue().ensureIsString();

            await test(`Given a DateTime (${dateTime.toString()}), and a startTimeCode (${startTimeCode}) and endTimeCode (${endTimeCode}) 
                when dateTime is not within start and end time
                then it should return false`,
                () =>
                {
                    assert.ok(!dateTime.isWithinTimeRange(startTimeCode, endTimeCode));
                }
            );
        }

        await test(`Given a DateTime, start and end time same as that dateTime
            when dateTime is checked to be within start and end time
            then it should return true`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

                assert.ok(dateTime.isWithinTimeRange(dateTime.timeCode, dateTime.timeCode));
            });

        await describe("Compare to Invalid start time code", async () =>
        {
            const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

            await checkIsInvalidParams(dateTime, "", "1000", "start time code is invalid");
            await checkIsInvalidParams(dateTime, "11", "1000", "start time code is invalid");
            await checkIsInvalidParams(dateTime, "10:00", "1000", "start time code is invalid");
            await checkIsInvalidParams(dateTime, "2400", "1000", "start time code is invalid");
            await checkIsInvalidParams(dateTime, "10000", "1000", "start time code is invalid");
        });

        await describe("Compare to Invalid end time code", async () =>
        {
            const dateTime = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });

            await checkIsInvalidParams(dateTime, "1000", "", "end time code is invalid");
            await checkIsInvalidParams(dateTime, "1000", "11", "end time code is invalid");
            await checkIsInvalidParams(dateTime, "1000", "10:00", "end time code is invalid");
            await checkIsInvalidParams(dateTime, "1000", "2400", "end time code is invalid");
            await checkIsInvalidParams(dateTime, "1000", "10000", "end time code is invalid");
        });

        await describe("Compare different minutes", async () =>
        {
            const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime2 = new DateTime({ value: "2024-01-01 10:01:00", zone: "utc" });
            const dateTime3 = new DateTime({ value: "2024-01-01 10:02:00", zone: "utc" });

            await checkIsFalse(dateTime1, dateTime2.timeCode, dateTime3.timeCode);
            await checkIsInvalidParams(dateTime1, dateTime3.timeCode, dateTime2.timeCode,
                "start time is greater than end time");

            await checkIsCorrect(dateTime2, dateTime1.timeCode, dateTime3.timeCode);
            await checkIsInvalidParams(dateTime2, dateTime3.timeCode, dateTime1.timeCode,
                "start time is greater than end time");

            await checkIsFalse(dateTime3, dateTime1.timeCode, dateTime2.timeCode);
            await checkIsInvalidParams(dateTime3, dateTime2.timeCode, dateTime1.timeCode,
                "start time is greater than end time");
        });

        await describe("Compare different hours", async () =>
        {
            const dateTime1 = new DateTime({ value: "2024-01-01 10:00:00", zone: "utc" });
            const dateTime2 = new DateTime({ value: "2024-01-01 11:00:00", zone: "utc" });
            const dateTime3 = new DateTime({ value: "2024-01-01 12:00:00", zone: "utc" });

            await checkIsFalse(dateTime1, dateTime2.timeCode, dateTime3.timeCode);
            await checkIsInvalidParams(dateTime1, dateTime3.timeCode, dateTime2.timeCode,
                "start time is greater than end time");

            await checkIsCorrect(dateTime2, dateTime1.timeCode, dateTime3.timeCode);
            await checkIsInvalidParams(dateTime2, dateTime3.timeCode, dateTime1.timeCode,
                "start time is greater than end time");

            await checkIsFalse(dateTime3, dateTime1.timeCode, dateTime2.timeCode);
            await checkIsInvalidParams(dateTime3, dateTime2.timeCode, dateTime1.timeCode,
                "start time is greater than end time");
        });
    });
});