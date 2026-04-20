import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime } from "../src/index.js";
import { Duration } from "@nivinjoseph/n-util";


await describe("DateTime Properties", async () =>
{
    await describe("Timestamp", async () =>
    {
        await test(`Given a luxon date time
        when DateTime is created from that value and zone
        then both should have same timeStamp`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: "2024-01-01 10:00", zone: "utc" }).timestamp, 1704103200);
            });

        await test(`Given a value epoch start ("1970-01-01 00:00") in utc
        when DateTime is created from that
        then it should have timeStamp 0`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: "1970-01-01 00:00", zone: "utc" }).timestamp, 0);
            }
        );

        await test(`Given a value before epoch start ("1969-12-31 23:59") in utc
        when DateTime is created from that
        then it should have timeStamp negative (-60)`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: "1969-12-31 23:59", zone: "utc" }).timestamp, -60);
            }
        );

        await test(`Given a value epoch start ("1970-01-01 00:01") in utc
        when DateTime is created from that
        then it should have timeStamp positive (60)`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: "1970-01-01 00:01", zone: "utc" }).timestamp, 60);
            }
        );
    });


    await describe("Date code", async () =>
    {
        await test(`Given a date time value (2024-01-01 10:00)
        when DateTime is created from that value
        then date code should be 20240101`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: "2024-01-01 10:00", zone: "utc" }).dateCode, "20240101");
            }
        );
    });

    await describe("Time code", async () =>
    {
        await test(`Given a date time value (2024-01-01 10:00)
        when DateTime is created from that value
        then time code should be 1000`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: "2024-01-01 10:00", zone: "utc" }).timeCode, "100000");
            }
        );
    });

    await describe("Date value", async () =>
    {
        const value = "2024-01-01 10:00";
        const dateTime = new DateTime({ value, zone: "utc" });
        const dateValue = value.split(" ").takeFirst();

        await test(`Given a valid value (${value}) 
        when a DateTime is created from that value
        then date value should be ${dateValue}`,
            () =>
            {
                assert.strictEqual(dateTime.dateValue, dateValue);
            }
        );

        await test(`Given a valid value (${value}) 
        when a DateTime is created from that value
        then the date value property should be in valid date format`,
            () =>
            {
                assert.ok(dateTime.dateValue.matchesFormat("####-##-##"));
            }
        );
    });

    await describe("Time value", async () =>
    {
        const value = "2024-01-01 10:00:00";
        const dateTime = new DateTime({ value, zone: "utc" });
        const timeValue = value.split(" ").takeLast();

        await test(`Given a valid value (${value}) 
        when a DateTime is created from that value
        then time value should be ${timeValue}`,
            () =>
            {
                assert.strictEqual(dateTime.timeValue, timeValue);
            }
        );

        await test(`Given a valid value (${value}) 
        when a DateTime is created from that value
        then the time value property should be in valid time format`,
            () =>
            {
                assert.ok(dateTime.timeValue.matchesFormat("##:##:##"));
            }
        );
    });

    await describe("Is past", async () =>
    {
        await test(`Given a DateTime with year 2000 (2000-01-01 10:00)
        when it's checked that it's in the past
        then it should return true`,
            () =>
            {
                assert.ok(new DateTime({ value: "2000-01-01 10:00", zone: "utc" }).isPast);
            }
        );

        await test(`Given a DateTime with year 3000 (3000-01-01 10:00)
        when it's checked that it's in the past
        then it should return false`,
            () =>
            {
                assert.ok(!new DateTime({ value: "3000-01-01 10:00", zone: "utc" }).isPast);
            }
        );

        await test(`Given a DateTime 1 minute before now
        when it's checked that it's in the past
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.now().subtractTime(Duration.fromMinutes(1)).isPast);
            }
        );

        await test(`Given a DateTime 1 minute after now
        when it's checked that it's in the past
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.now().addTime(Duration.fromMinutes(1)).isPast);
            }
        );
    });

    await describe("Is future", async () =>
    {
        await test(`Given a DateTime with year 2000 (2000-01-01 10:00)
        when it's checked that it's in the future
        then it should return false`,
            () =>
            {
                assert.ok(!new DateTime({ value: "2000-01-01 10:00", zone: "utc" }).isFuture);
            }
        );

        await test(`Given a DateTime with year 3000 (3000-01-01 10:00)
        when it's checked that it's in the future
        then it should return true`,
            () =>
            {
                assert.ok(new DateTime({ value: "3000-01-01 10:00", zone: "utc" }).isFuture);
            }
        );

        await test(`Given a DateTime 1 minute before now
        when it's checked that it's in the future
        then it should return false`,
            () =>
            {
                assert.ok(!DateTime.now().subtractTime(Duration.fromMinutes(1)).isFuture);
            }
        );

        await test(`Given a DateTime 1 minute after now
        when it's checked that it's in the future
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.now().addTime(Duration.fromMinutes(1)).isFuture);
            }
        );
    });
});

