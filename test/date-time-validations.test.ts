import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime, DateTimeFormat } from "../src/index.js";


await describe("DateTime Format Validations", async () =>
{
    await describe("Date Time Format", async () =>
    {
        await test(`Given value "2024-01-01 10:00" with correct format
        when the format is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateDateTimeFormat("2024-01-01 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value as an empty string
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-01-01 10:60" with an invalid minute
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-01-01 10:60", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-01-01 10:0" with an invalid minute format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-01-01 10:0", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-01-01 25:00" with an invalid hour
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-01-01 25:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-01-01 1:00" with an invalid hour format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-01-01 1:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-01-00 10:00" with an invalid day(0)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-01-00 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-01-32 10:00" with an invalid day(32)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-01-32 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2023-02-29 10:00" with an invalid day(february 29 on non-leap year)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2023-02-29 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-02-30 10:00" with an invalid day(february 30 on leap year)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-02-30 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-02-29 10:00" with an valid day(february 29 on leap year)
        when the format is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateDateTimeFormat("2024-02-29 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-04-31 10:00" with an invalid day(April 31)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-04-31 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-04-1 10:00" with an invalid day format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-01-1 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-00-01 10:00" with an invalid month(0)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-00-01 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-13-01 10:00" with an invalid month(13)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-13-01 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "2024-1-01 10:00" with an invalid month format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("2024-1-01 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "24-01-01 10:00" with an invalid year format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("24-01-01 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );

        await test(`Given value "10000-01-01 10:00" with year greater than 9999
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateTimeFormat("10000-01-01 10:00", DateTimeFormat.yearMonthDayHourMinute));
            }
        );
    }
    );


    await describe("Date Format", async () =>
    {
        await test(`Given value "2024-01-01" with correct format
        when the format is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateDateFormat("2024-01-01"));
            }
        );

        await test(`Given value as an empty string
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat(""));
            }
        );

        await test(`Given value "2024-01-00" with an invalid day(0)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("2024-01-00"));
            }
        );

        await test(`Given value "2024-01-32" with an invalid day(32)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("2024-01-32"));
            }
        );

        await test(`Given value "2023-02-29" with an invalid day(february 29 on non-leap year)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("2023-02-29"));
            }
        );

        await test(`Given value "2024-02-30" with an invalid day(february 30 on leap year)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("2024-02-30"));
            }
        );

        await test(`Given value "2024-02-29" with an valid day(february 29 on leap year)
        when the format is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateDateFormat("2024-02-29"));
            }
        );

        await test(`Given value "2024-04-31" with an invalid day(April 31)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("2024-04-31"));
            }
        );

        await test(`Given value "2024-04-1" with an invalid day format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("2024-01-1"));
            }
        );

        await test(`Given value "2024-00-01" with an invalid month(0)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("2024-00-01"));
            }
        );

        await test(`Given value "2024-13-01" with an invalid month(13)
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("2024-13-01"));
            }
        );

        await test(`Given value "2024-1-01" with an invalid month format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("2024-1-01"));
            }
        );

        await test(`Given value "24-01-01" with an invalid year format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("24-01-01"));
            }
        );

        await test(`Given value "10000-01-01" with year greater than 9999
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateDateFormat("10000-01-01"));
            }
        );
    }
    );

    await describe("Time Format", async () =>
    {
        await test(`Given value "10:00" with correct format
        when the format is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeFormat("10:00"));
            }
        );

        await test(`Given value as an empty string
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeFormat(""));
            }
        );

        await test(`Given value "10:60" with an invalid minute
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeFormat("10:60"));
            }
        );

        await test(`Given value "10:0" with an invalid minute format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeFormat("10:0"));
            }
        );

        await test(`Given value "25:00" with an invalid hour
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeFormat("25:00"));
            }
        );

        await test(`Given value "1:00" with an invalid hour format
        when the format is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeFormat("1:00"));
            }
        );
    }
    );

    await describe("Zone", async () =>
    {
        await test(`Given zone as an empty string
        when the zone is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeZone(""));
            }
        );

        await test(`Given zone as an invalid random string
        when the zone is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeZone("aksfljn"));
            }
        );

        await test(`Given zone as valid IANA zone America/Los_Angeles
        when the zone is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone("America/Los_Angeles"));
            }
        );

        await test(`Given zone as invalid IANA zone America/LosAngeles (misspelled)
        when the zone is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeZone("America/LosAngeles")); // correct is America/Los_Angeles
            }
        );

        await test(`Given zone as UTC
        when the zone is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone("UTC"));
            }
        );

        await test(`Given zone as utc
        when the zone is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone("utc"));
            }
        );

        await test(`Given zone as local
        when the zone is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeZone("local"));
            }
        );

        await test(`Given zone as valid UTC offset +5:30"
        when the zone is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone("UTC+5:30"));
            }
        );

        await test(`Given zone as valid UTC offset -3"
        when the zone is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone("UTC-3"));
            }
        );

        await test(`Given zone as valid UTC offset +14:00"
        when the zone is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone("UTC+14:00"));
            }
        );

        await test(`Given zone as valid UTC offset -12:00"
        when the zone is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone("UTC-12:00"));
            }
        );

        await test(`Given zone as valid UTC offset +00:01"
        when the zone is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone("UTC+00:01"));
            }
        );

        await test(`Given zone as valid UTC offset -00:01"
        when the zone is validated
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone("UTC-00:01"));
            }
        );

        await test(`Given zone as invalid UTC offset +14:01"
        when the zone is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeZone("UTC+14:01")); // max is +14:00
            }
        );

        await test(`Given zone as invalid UTC offset -12:01"
        when the zone is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeZone("UTC-12:01")); // min is -12:00
            }
        );

        await test(`Given zone as invalid UTC offset +15"
        when the zone is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeZone("UTC+15")); // max is +14:00
            }
        );

        await test(`Given zone as invalid UTC offset -13"
        when the zone is validated
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.validateTimeZone("UTC-13")); // min is -12:00
            }
        );
    }
    );
}
);

