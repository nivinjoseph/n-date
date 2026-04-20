import { ArgumentException } from "@nivinjoseph/n-exception";
import { DateTime as LuxonDateTime } from "luxon";
import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime, DateTimeFormat_DEFAULT } from "../src/index.js";


await describe("DateTime Create", async () =>
{
    await describe("Constructor", async () =>
    {
        const validValue = "2024-01-01 10:00:00";

        function checkIsInvalid(value: string, zone = "utc"): void
        {
            assert.throws(() => new DateTime({ value, zone }), ArgumentException);
        }

        await test(`Given a valid value and zone
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: validValue, zone: "utc" }));
            }
        );

        await test(`Given value as empty string and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("");
            }
        );

        await test(`Given value "2024-01-01 10:60" with an invalid minute and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-01 10:60");
            }
        );

        await test(`Given value "2024-01-01 10:0" with an invalid minute format and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-01 10:0");
            }
        );

        await test(`Given value "2024-01-01 24:00" with an invalid hour(24) and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-01 24:00");
            }
        );

        await test(`Given value "2024-01-01 1:00" with an invalid hour format and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-01 1:00");
            }
        );

        await test(`Given value "2024-01-00 10:00" with an invalid day(0) and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-00 10:00");
            }
        );

        await test(`Given value "2024-01-32 10:00" with an invalid day(32) and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-32 10:00");
            }
        );

        await test(`Given value "2023-02-29 10:00" with an invalid day(february 29 on non-leap year) and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2023-02-29 10:00");
            }
        );

        await test(`Given value "2024-02-30 10:00" with an invalid day(february 30 on leap year)and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-02-30 10:00");
            }
        );

        await test(`Given value "2024-02-29 10:00" with an valid day(february 29 on leap year) and a valid zone
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: "2024-02-29 10:00", zone: "utc" }));
            }
        );

        await test(`Given value "2024-04-31 10:00" with an invalid day(April 31) and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-04-31 10:00");
            }
        );

        await test(`Given value "2024-04-1 10:00" with an invalid day format and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-1 10:00");
            }
        );

        await test(`Given value "2024-00-01 10:00" with an invalid month(0) and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-00-01 10:00");
            }
        );

        await test(`Given value "2024-13-01 10:00" with an invalid month(13) and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-13-01 10:00");
            }
        );

        await test(`Given value "2024-1-01 10:00" with an invalid month format and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-1-01 10:00");
            }
        );

        await test(`Given value "24-01-01 10:00" with an invalid year format and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("24-01-01 10:00");
            }
        );

        await test(`Given value "10000-01-01 10:00" with year greater than 9999 and a valid zone
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid("10000-01-01 10:00");
            }
        );

        await test(`Given valid value and zone as an empty string
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validValue, "");
            }
        );

        await test(`Given valid value and zone as an invalid random string
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validValue, "aksfljn");
            }
        );

        await test(`Given valid value and zone as local
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validValue, "local");
            }
        );

        await test(`Given valid value and zone as valid IANA zone America/Los_Angeles
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: validValue, zone: "America/Los_Angeles" }));
            }
        );

        await test(`Given valid value and zone as invalid IANA zone America/LosAngeles (misspelled)
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validValue, "America/LosAngeles"); // correct is America/Los_Angeles
            }
        );

        await test(`Given valid value and zone as UTC
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: validValue, zone: "UTC" }));
            }
        );

        await test(`Given valid value and zone as valid UTC offset +5:30
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: validValue, zone: "UTC+5:30" }));
            }
        );

        await test(`Given valid value and zone as valid UTC offset -3
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: validValue, zone: "UTC-3" }));
            }
        );

        await test(`Given valid value and zone as valid UTC offset +14:00
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: validValue, zone: "UTC+14:00" }));
            }
        );

        await test(`Given valid value and zone as valid UTC offset -12:00
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: validValue, zone: "UTC-12:00" }));
            }
        );

        await test(`Given valid value and zone as valid UTC offset +00:01
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: validValue, zone: "UTC+00:01" }));
            }
        );

        await test(`Given valid value and zone as valid UTC offset -00:01
        when the constructor is called
        then it should return a DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => new DateTime({ value: validValue, zone: "UTC-00:01" }));
            }
        );

        await test(`Given valid value and zone as invalid UTC offset +14:01
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validValue, "UTC+14:01"); // max is +14:00
            }
        );

        await test(`Given valid value and zone as invalid UTC offset -12:01
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validValue, "UTC-12:01"); // min is -12:00
            }
        );

        await test(`Given valid value and zone as invalid UTC offset +15
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validValue, "UTC+15"); // max is +14:00
            }
        );

        await test(`Given valid value and zone as invalid UTC offset -13
        when the constructor is called
        then it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validValue, "UTC-13"); // max is -12:00
            }
        );
    }
    );


    await describe("Now", async () =>
    {
        await test(`Given DateTime.now() in default zone (utc)
        when it's compared to Date now in utc
        then it should be same`,
            () =>
            {
                const nativeDate = new Date().toISOString().substring(0, 19).replace("T", " ");
                // this might fail if at the end of minute and next is at start of minute. but rare condition
                assert.strictEqual(DateTime.now().value, nativeDate);
            }
        );

        await test(`Given DateTime.now() in zone UTC+5:30
        when it's compared to Luxon DateTime now in zone UTC+5:30
        then it should be same`,
            () =>
            {
                // using luxon in this test because native date does not support timezones well
                // this might fail if at the end of minute and next is at start of minute. but rare condition
                assert.strictEqual(DateTime.now("UTC+5:30").value,
                    LuxonDateTime.now().setZone("UTC+5:30").toFormat(DateTimeFormat_DEFAULT));
            }
        );

        await test(`Given DateTime.now() in different zones utc and UTC+5:30
        when the timestamps are compared
        then it should be same`,
            () =>
            {
                // this might fail if at the end of minute and next is at start of minute. but rare condition
                assert.strictEqual(DateTime.now("UTC+5:30").timestamp, DateTime.now().timestamp);
            }
        );

        await test(`Given zone is not passed in
        when DateTime for now is created with default zone
        then zone property should be utc`,
            () =>
            {
                assert.strictEqual(DateTime.now().zone, "utc");
            }
        );

        await test(`Given zone as utc
        when DateTime for now is created
        then zone property should be utc`,
            () =>
            {
                assert.strictEqual(DateTime.now("utc").zone, "utc");
            }
        );

        await test(`Given zone as UTC+5:30
        when DateTime for now is created
        then zone property should be UTC+5:30`,
            () =>
            {
                assert.strictEqual(DateTime.now("UTC+5:30").zone, "UTC+5:30");
            }
        );

        await test(`Given zone as America/Los_Angeles
        when DateTime for now is created
        then zone property should be America/Los_Angeles`,
            () =>
            {
                assert.strictEqual(DateTime.now("America/Los_Angeles").zone, "America/Los_Angeles");
            }
        );
    });



    await describe("From Timestamp", async () =>
    {
        const timeStamp = 1704103200;// "2024-01-01 10:00"
        const maxTimestamp = 253402300799;// "9999-12-31 23:59:59"
        const minTimestamp = -62167219200;// "0000-01-01 00:00:00"

        await test(`Given a valid timestamp and zone
        when DateTime is created from that timestamp
        then there should not be any issues`,
            () =>
            {
                assert.doesNotThrow(() => DateTime.createFromTimestamp(timeStamp, "utc"));
            }
        );

        await test(`Given a valid timestamp for "2024-01-01 10:00:00"
        when DateTime is created from that timestamp
        then value should be "2024-01-01 10:00:00"`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(timeStamp, "utc").value, "2024-01-01 10:00:00");
            }
        );

        await test(`Given a valid timestamp for "2024-01-01 10:00:00"
        when DateTime is created from that timestamp
        then timestamp property should return what's passed in`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(timeStamp, "utc").timestamp, timeStamp);
            }
        );

        await test(`Given timestamp 0 in utc
        when DateTime is created from that timestamp
        the value should be epoch start`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(0, "utc").value, "1970-01-01 00:00:00");
            }
        );

        await test(`Given timestamp -1 in utc
        when DateTime is created from that timestamp
        the value should be epoch start -1 second`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(-1, "utc").value, "1969-12-31 23:59:59");
            }
        );

        await test(`Given a valid timestamp for "9999-12-31 23:59:59"
        when DateTime is created from that timestamp
        then value should be "9999-12-31 23:59:59"`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(maxTimestamp, "utc").value, "9999-12-31 23:59:59");
            }
        );

        await test(`Given a valid timestamp for "0000-01-01 00:00:00"
        when DateTime is created from that timestamp
        then value should be "0000-01-01 00:00:00"`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(minTimestamp, "utc").value, "0000-01-01 00:00:00");
            }
        );

        await test(`Given a timestamp for greater than "9999-12-31 23:59"
        when DateTime is created from that timestamp
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => DateTime.createFromTimestamp(maxTimestamp + 1, "utc"), ArgumentException);
            }
        );

        await test(`Given a timestamp for less than "0000-01-01 00:00"
        when DateTime is created from that timestamp
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => DateTime.createFromTimestamp(minTimestamp - 1, "utc"), ArgumentException);

            }
        );

        await test(`Given a valid timestamp and zone as utc
        when DateTime is created from that timestamp
        then zone property should be utc`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(timeStamp, "utc").zone, "utc");
            }
        );

        await test(`Given a valid timestamp and zone as UTC+5:30
        when DateTime is created from that timestamp
        then zone property should be UTC+5:30`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(timeStamp, "UTC+5:30").zone, "UTC+5:30");
            }
        );

        await test(`Given a valid timestamp and zone as America/Los_Angeles
        when DateTime is created from that timestamp
        then zone property should be America/Los_Angeles`,
            () =>
            {
                assert.strictEqual(DateTime.createFromTimestamp(timeStamp, "America/Los_Angeles").zone, "America/Los_Angeles");
            }
        );
    });

    await describe("From MilliSecondsSinceEpoch", async () =>
    {
        const milliSeconds = 1704103200000; // "2024-01-01 10:00"
        const maxMilliSecondsSinceEpoch = 253402300799999; // "9999-12-31 23:59:59.999"
        const minMilliSecondsSinceEpoch = -62167219200000; // "0000-01-01 00:00:00.000"

        await test(`Given a valid milliSeconds and zone
        when DateTime is created from that milliSeconds
        then there should not be any issues`,
            () =>
            {
                assert.doesNotThrow(() => DateTime.createFromMilliSecondsSinceEpoch(milliSeconds, "utc"));
            }
        );

        await test(`Given a valid milliSeconds for "2024-01-01 10:00:00"
        when DateTime is created from that milliSeconds
        then value should be "2024-01-01 10:00:00"`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(milliSeconds, "utc").value, "2024-01-01 10:00:00");
            }
        );

        await test(`Given a valid milliSeconds for "2024-01-01 10:00:00"
        when DateTime is created from that milliSeconds
        then valueOf() should return what's passed in`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(milliSeconds, "utc").valueOf(), milliSeconds);
            }
        );

        await test(`Given milliSeconds 0 in utc
        when DateTime is created from that milliSeconds
        the value should be epoch start`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(0, "utc").value, "1970-01-01 00:00:00");
            }
        );

        await test(`Given milliSeconds -1 in utc
        when DateTime is created from that milliSeconds
        the value should be epoch start -1 second`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(-1, "utc").value, "1969-12-31 23:59:59");
            }
        );

        await test(`Given a valid milliSeconds for "9999-12-31 23:59:59"
        when DateTime is created from that milliSeconds
        then value should be "9999-12-31 23:59:59"`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(maxMilliSecondsSinceEpoch, "utc").value,
                    "9999-12-31 23:59:59");
            }
        );

        await test(`Given a valid milliSeconds for "0000-01-01 00:00:00"
        when DateTime is created from that milliSeconds
        then value should be "0000-01-01 00:00:00"`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(minMilliSecondsSinceEpoch, "utc").value,
                    "0000-01-01 00:00:00");
            }
        );

        await test(`Given a milliSeconds for greater than "9999-12-31 23:59:00 999"
        when DateTime is created from that milliSeconds
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => DateTime.createFromMilliSecondsSinceEpoch(maxMilliSecondsSinceEpoch + 1, "utc"),
                    ArgumentException);
            }
        );

        await test(`Given a milliSeconds for less than "0000-01-01 00:00"
        when DateTime is created from that milliSeconds
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => DateTime.createFromMilliSecondsSinceEpoch(minMilliSecondsSinceEpoch - 1, "utc"),
                    ArgumentException);

            }
        );

        await test(`Given a valid milliSeconds and zone as utc
        when DateTime is created from that milliSeconds
        then zone property should be utc`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(milliSeconds, "utc").zone, "utc");
            }
        );

        await test(`Given a valid milliSeconds and zone as UTC+5:30
        when DateTime is created from that milliSeconds
        then zone property should be UTC+5:30`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(milliSeconds, "UTC+5:30").zone, "UTC+5:30");
            }
        );

        await test(`Given a valid milliSeconds and zone as America/Los_Angeles
        when DateTime is created from that milliSeconds
        then zone property should be America/Los_Angeles`,
            () =>
            {
                assert.strictEqual(DateTime.createFromMilliSecondsSinceEpoch(milliSeconds, "America/Los_Angeles").zone, "America/Los_Angeles");
            }
        );
    });

    await describe("From Codes", async () =>
    {
        const validDateCode = "20240101";
        const validTimeCode = "100000";

        function checkIsInvalid(dateCode: string, timeCode: string): void
        {
            assert.throws(() => DateTime.createFromCodes(dateCode, timeCode, "utc"), ArgumentException);
        }

        await test(`Given a valid date code(20240101), time code(100000) and zone
        when DateTime is created from that codes
        then it should not throw any errors"`,
            () =>
            {
                assert.doesNotThrow(() => DateTime.createFromCodes(validDateCode, validTimeCode, "utc"));
            }
        );

        await test(`Given a valid date code(20240101), time code(100000) and zone
        when DateTime is created from that codes
        then it should have the value "2024-01-01 10:00:00"`,
            () =>
            {
                assert.strictEqual(DateTime.createFromCodes(validDateCode, validTimeCode, "utc").value, "2024-01-01 10:00:00");
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code as an empty string
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code is in invalid format 2024-01-01
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-01", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code in invalid format 2411
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2411", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code in invalid format 202411
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("202411", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code in invalid format 2024011
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024011", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code in invalid format 2024101
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024101", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code in invalid format 240101
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("240101", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code with invalid day 0 20240100
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("20240100", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code with invalid day 32 20240132
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("20240132", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code with invalid day feb 29 on non-leap year 20230229
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("20230229", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code with invalid day feb 30 20240230
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("20240230", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code feb 29 on leap year 20240229
        when DateTime is created from that codes
        then  it should return the DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => DateTime.createFromCodes("20240229", validTimeCode, "utc"));
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code with invalid day 20240431 (April 31)
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("20240431", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code with invalid month 0 20240001
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("20240001", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code with invalid month 13 20241301
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("20241301", validTimeCode);
            }
        );

        await test(`Given a valid time code(100000) and zone, and date code with invalid year >9999 100000101
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("100000101", validTimeCode);
            }
        );

        await test(`Given a valid date code(20240101) and zone, and time code as empty string
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateCode, "");
            }
        );

        await test(`Given a valid date code(20240101) and zone, and time code in invalid format 10:00
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateCode, "10:00");
            }
        );

        await test(`Given a valid date code(20240101) and zone, and time code in invalid format 001
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateCode, "001");
            }
        );

        await test(`Given a valid date code(20240101) and zone, and time code in invalid format 10000
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateCode, "10000");
            }
        );

        await test(`Given a valid date code(20240101) and zone, and time code with invalid minute 1060
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateCode, "1060");
            }
        );

        await test(`Given a valid date code(20240101) and zone, and time code with invalid hour 2400
        when DateTime is created from that codes
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateCode, "2400");
            }
        );

        await test(`Given a valid date code(20240101), time code(1000) and zone as utc
        when DateTime is created from that codes
        then zone property should be utc`,
            () =>
            {
                assert.strictEqual(DateTime.createFromCodes(validDateCode, validTimeCode, "utc").zone, "utc");
            }
        );

        await test(`Given a valid date code(20240101), time code(1000) and zone as UTC+5:30
        when DateTime is created from that codes
        then zone property should be UTC+5:30`,
            () =>
            {
                assert.strictEqual(DateTime.createFromCodes(validDateCode, validTimeCode, "UTC+5:30").zone, "UTC+5:30");
            }
        );

        await test(`Given a valid date code(20240101), time code(100000) and zone as America/Los_Angeles
        when DateTime is created from that codes
        then zone property should be America/Los_Angeles`,
            () =>
            {
                assert.strictEqual(DateTime.createFromCodes(validDateCode, validTimeCode, "America/Los_Angeles").zone, "America/Los_Angeles");
            }
        );
    });


    await describe("From values", async () =>
    {
        const validDateValue = "2024-01-01";
        const validTimeValue = "10:00:00";

        function checkIsInvalid(dateValue: string, timeValue: string): void
        {
            assert.throws(() => DateTime.createFromValues(dateValue, timeValue, "utc"), ArgumentException);
        }

        await test(`Given a valid date value(2024-01-01), time value(10:00:00) and zone
        when DateTime is created from that values
        then it should have the value "2024-01-01 10:00:00"`,
            () =>
            {
                assert.strictEqual(DateTime.createFromValues(validDateValue, validTimeValue, "utc").value, "2024-01-01 10:00:00");
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value as an empty string
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value in incorrect format "2024/01/01"
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024/01/01", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value in invalid format 24-1-1
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("24-1-1", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00) and zone, and date value in invalid format 2024-1-1
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-1-1", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value in invalid format 2024-01-1
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-1", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value in invalid format 2024-1-01
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-1-01", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value in invalid format 24-01-01
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("24-01-01", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value with invalid day 0 2024-01-00
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-00", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value with invalid day 32 2024-01-32
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-01-32", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value with invalid day feb 29 on non-leap year 2023-02-29
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2023-02-29", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value with invalid day feb 30 2024-02-30
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-02-30", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value with invalid day 2024-04-31 (April 31)
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-04-31", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value with invalid month 0 2024-00-01
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-00-01", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value with invalid month 13 2024-13-01
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("2024-13-01", validTimeValue);
            }
        );

        await test(`Given a valid time value(10:00:00) and zone, and date value with invalid year >9999 10000-01-01
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid("10000-01-01", validTimeValue);
            }
        );

        await test(`Given a valid date value(2024-01-01) and zone, and time value as empty string
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateValue, "");
            }
        );

        await test(`Given a valid date value(2024-01-01) and zone, and time value in invalid format 10.00
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateValue, "10.00");
            }
        );

        await test(`Given a valid date value(2024-01-01) and zone, and time value in invalid format 1000
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateValue, "1000");
            }
        );

        await test(`Given a valid date value(2024-01-01) and zone, and time value in invalid format 00:1
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateValue, "00:1");
            }
        );

        await test(`Given a valid date value(2024-01-01) and zone, and time value in invalid format 100:00
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateValue, "100:00");
            }
        );

        await test(`Given a valid date value(2024-01-01) and zone, and time value with invalid minute 10:60
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateValue, "10:60");
            }
        );

        await test(`Given a valid date value(2024-01-01) and zone, and time value with invalid hour 24:00
        when DateTime is created from that values
        then  it should throw a validation error`,
            () =>
            {
                checkIsInvalid(validDateValue, "24:00");
            }
        );

        await test(`Given a valid time value(10:00) and zone, and date value feb 29 on leap year 2024-02-29
        when DateTime is created from that values
        then  it should return the DateTime object`,
            () =>
            {
                assert.doesNotThrow(() => DateTime.createFromValues("2024-02-29", validTimeValue, "utc"));
            }
        );

        await test(`Given a valid date value(2024-01-01), time value(10:00) and zone as utc
        when DateTime is created from that values
        then zone property should be utc`,
            () =>
            {
                assert.strictEqual(DateTime.createFromValues(validDateValue, validTimeValue, "utc").zone, "utc");
            }
        );

        await test(`Given a valid date value(2024-01-01), time value(10:00) and zone as UTC+5:30
        when DateTime is created from that values
        then zone property should be UTC+5:30`,
            () =>
            {
                assert.strictEqual(DateTime.createFromValues(validDateValue, validTimeValue, "UTC+5:30").zone, "UTC+5:30");
            }
        );

        await test(`Given a valid date value(2024-01-01), time value(10:00) and zone as America/Los_Angeles
        when DateTime is created from that values
        then zone property should be America/Los_Angeles`,
            () =>
            {
                assert.strictEqual(DateTime.createFromValues(validDateValue, validTimeValue, "America/Los_Angeles").zone, "America/Los_Angeles");
            }
        );
    });
});

