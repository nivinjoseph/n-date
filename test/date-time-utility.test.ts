import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime } from "../src/index.js";
import { DateTime as LuxonDateTime } from "luxon";
import { ArgumentException } from "@nivinjoseph/n-exception";


await describe("DateTime Utility", async () =>
{
    await describe("Current zone", async () =>
    {
        await test(`Given current system zone from DateTime
        when it's validated that it's a proper zone
        then it should return true`,
            () =>
            {
                assert.ok(DateTime.validateTimeZone(DateTime.currentZone));
            }
        );

        await test(`Given current system zone from DateTime
        when it's compared to luxon current system zone
        then it should be same as Luxon local zone`,
            () =>
            {
                assert.strictEqual(LuxonDateTime.now().zoneName, DateTime.currentZone);
            }
        );
    });

    await describe("Value of", async () =>
    {
        const value = "2024-01-01 10:00";
        const zone = "utc";
        const dateTime = new DateTime({ value: value, zone: zone });

        await test(`Given a DateTime with value "2024-01-01 10:00" and zone utc
        when it's compared to luxon dateTime representing the same 
        then it's valueOf() should be same as Luxon DateTime`,
            () =>
            {
                assert.strictEqual(dateTime.valueOf(), 1704103200000);
            }
        );

        await test(`Given a DateTime with value "2024-01-01 10:00" and zone utc
        when it's valueOf() is validated with luxon
        then it should return true`,
            () =>
            {
                assert.ok(LuxonDateTime.fromMillis(dateTime.valueOf()).isValid);
            }
        );

        await test(`Given the value epoch start ("1970-01-01 00:00") in utc
        when DateTime is created from that
        then it should have valueOf() 0`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: "1970-01-01 00:00", zone: "utc" }).valueOf(), 0);
            }
        );

        await test(`Given a value before epoch start ("1969-12-31 23:59") in utc
        when DateTime is created from that
        then it should have valueOf() negative (-60000)`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: "1969-12-31 23:59", zone: "utc" }).valueOf(), -60000);
            }
        );

        await test(`Given a value epoch start ("1970-01-01 00:01") in utc
        when DateTime is created from that
        then it should have valueOf() positive (60000)`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: "1970-01-01 00:01", zone: "utc" }).valueOf(), 60000);
            }
        );
    });


    await describe("to string", async () =>
    {
        const value = "2024-01-01 10:00:00";

        await test(`Given a valid value (${value}) and zone (utc)
        when a DateTime is created from that value and zone
        then toString() on that dateTime should return a string with value and zone`,
            () =>
            {
                const zone = "utc";
                const dateTime = new DateTime({ value: value, zone: zone });
                assert.strictEqual(dateTime.toString(), `${value} ${zone}`);
            }
        );

        await test(`Given a valid value (${value}) and zone (UTC+5:30)
        when a DateTime is created from that value and zone
        then toString() on that dateTime should return a string with value and zone`,
            () =>
            {
                const zone = "UTC+5:30";
                const dateTime = new DateTime({ value: value, zone: zone });
                assert.strictEqual(dateTime.toString(), `${value} ${zone}`);
            }
        );

        await test(`Given a valid value (${value}) and zone (America/Los_Angeles)
        when a DateTime is created from that value and zone
        then toString() on that dateTime should return a string with value and zone`,
            () =>
            {
                const zone = "America/Los_Angeles";
                const dateTime = new DateTime({ value: value, zone: zone });
                assert.strictEqual(dateTime.toString(), `${value} ${zone}`);
            }
        );
    });

    await describe("to string date time", async () =>
    {
        const value = "2024-01-01 10:00:00";

        await test(`Given a valid value (${value}) and zone (utc)
        when a DateTime is created from that value and zone
        then toStringDateTime() on that dateTime should return the passed in value`,
            () =>
            {
                assert.strictEqual(new DateTime({ value, zone: "utc" }).toStringDateTime(), value);
            }
        );

        const value1 = "2024-02-29 18:30:00";
        await test(`Given a valid value (${value1}) and zone (utc)
        when a DateTime is created from that value and zone
        then toStringDateTime() on that dateTime should return the passed in value`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: value1, zone: "utc" }).toStringDateTime(), value1);
            }
        );

        const value2 = "1986-08-17 15:57:00";
        await test(`Given a valid value (${value2}) and zone (utc)
        when a DateTime is created from that value and zone
        then toStringDateTime() on that dateTime should return the passed in value`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: value2, zone: "utc" }).toStringDateTime(), value2);
            }
        );

        await test(`Given a valid value (${value}) in different zone
        when a DateTime is created from that value and zone
        then toStringDateTime() should return the same value for both dateTime`,
            () =>
            {
                const dateTime1 = new DateTime({ value, zone: "UTC+5:30" });
                const dateTime2 = new DateTime({ value, zone: "America/Los_Angeles" });
                assert.strictEqual(dateTime1.toStringDateTime(), dateTime2.toStringDateTime());
            }
        );
    });

    await describe("to string ISO", async () =>
    {
        const value = "2024-01-01 10:00";

        await test(`Given a valid value (${value}) and zone (utc)
        when a DateTime is created from that value and zone
        then toStringISO() should return a valid ISO string`,
            () =>
            {
                assert.ok(LuxonDateTime.fromISO(new DateTime({ value, zone: "utc" }).toStringISO()).isValid);
            }
        );

        await test(`Given a valid value (${value}) and zone (UTC+5:30)
        when a DateTime is created from that value and zone
        then toStringISO() should return a valid ISO string`,
            () =>
            {
                assert.ok(LuxonDateTime.fromISO(new DateTime({ value, zone: "UTC+5:30" }).toStringISO()).isValid);
            }
        );

        await test(`Given a valid value (${value}) and zone (America/Los_Angeles)
        when a DateTime is created from that value and zone
        then toStringISO() should return a valid ISO string`,
            () =>
            {
                assert.ok(LuxonDateTime.fromISO(new DateTime({ value, zone: "America/Los_Angeles" }).toStringISO()).isValid);
            }
        );

        await test(`Given a valid value (${value}) and zone (utc)
        when a DateTime is created from that value and zone
        then toStringISO() on that dateTime should return "2024-01-01T10:00:00.000Z"`,
            () =>
            {
                assert.strictEqual(new DateTime({ value, zone: "utc" }).toStringISO(), "2024-01-01T10:00:00.000Z");
            }
        );

        const value1 = "2024-02-29 18:30";
        await test(`Given a valid value (${value1}) and zone (utc)
        when a DateTime is created from that value and zone
        then toStringDateTime() on that dateTime should return the passed in value`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: value1, zone: "utc" }).toStringISO(), "2024-02-29T18:30:00.000Z");
            }
        );

        const value2 = "1986-08-17 15:57";
        await test(`Given a valid value (${value2}) and zone (utc)
        when a DateTime is created from that value and zone
        then toStringDateTime() on that dateTime should return the passed in value`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: value2, zone: "utc" }).toStringISO(), "1986-08-17T15:57:00.000Z");
            }
        );

        await test(`Given a valid value (${value}) and zone (UTC+5:30)
        when a DateTime is created from that value and zone
        then toStringISO() on that dateTime should return "2024-01-01T10:00:00.000+05:30"`,
            () =>
            {
                assert.strictEqual(new DateTime({ value, zone: "UTC+5:30" }).toStringISO(), "2024-01-01T10:00:00.000+05:30");
            }
        );

        // The offset must come from the instant under test, not from the current date, otherwise
        // the expectation moves twice a year. Both offsets are pinned so that each is covered.
        await test(`Given a valid value (${value}) and zone (America/Los_Angeles) outside daylight savings
        when a DateTime is created from that value and zone
        then toStringISO() on that dateTime should return "2024-01-01T10:00:00.000-08:00"`,
            () =>
            {
                assert.strictEqual(new DateTime({ value, zone: "America/Los_Angeles" }).toStringISO(), "2024-01-01T10:00:00.000-08:00");
            }
        );

        const summerValue = "2024-07-01 10:00";
        await test(`Given a valid value (${summerValue}) and zone (America/Los_Angeles) during daylight savings
        when a DateTime is created from that value and zone
        then toStringISO() on that dateTime should return "2024-07-01T10:00:00.000-07:00"`,
            () =>
            {
                assert.strictEqual(new DateTime({ value: summerValue, zone: "America/Los_Angeles" }).toStringISO(), "2024-07-01T10:00:00.000-07:00");
            }
        );
    });

    await describe("Get Days of Month", async () =>
    {
        await describe("For 2024 jan",
            async () =>
            {
                const daysOfMonth = new DateTime({ value: "2024-01-01 10:00", zone: "utc" }).getDaysOfMonth();

                await test(`Given a DateTime object with value in January "2024-01-01 10:00"
                when daysOfMonth is calculated for that DateTime
                then it should return an array of 31 days`,
                    () =>
                    {
                        assert.strictEqual(daysOfMonth.length, 31);
                    }
                );

                await test(`Given a DateTime object with value in January "2024-01-01 10:00"
                when daysOfMonth is calculated for that DateTime
                then first element of the array should represent first day of month`,
                    () =>
                    {
                        assert.strictEqual(daysOfMonth.takeFirst().value, "2024-01-01 00:00:00");
                        assert.strictEqual(daysOfMonth.takeFirst().dateValue, "2024-01-01");
                    }
                );

                await test(`Given a DateTime object with value in January "2024-01-01 10:00"
                when daysOfMonth is calculated for that DateTime
                then last element of the array should represent last day of month`,
                    () =>
                    {
                        assert.strictEqual(daysOfMonth.takeLast().value, "2024-01-31 00:00:00");
                        assert.strictEqual(daysOfMonth.takeLast().dateValue, "2024-01-31");
                    }
                );
            });

        await describe("For 2024 feb (leap year)", async () =>
        {
            const daysOfMonth = new DateTime({ value: "2024-02-01 10:00", zone: "utc" }).getDaysOfMonth();

            await test(`Given a DateTime object with value in leap year February "2024-02-01 10:00"
            when daysOfMonth is calculated for that DateTime
            then it should return an array of 29 days`,
                () =>
                {
                    assert.strictEqual(daysOfMonth.length, 29);
                }
            );

            await test(`Given a DateTime object with value in leap year February "2024-02-01 10:00"
            when daysOfMonth is calculated for that DateTime
            then first element of the array should represent first day of month`,
                () =>
                {
                    assert.strictEqual(daysOfMonth.takeFirst().value, "2024-02-01 00:00:00");
                    assert.strictEqual(daysOfMonth.takeFirst().dateValue, "2024-02-01");
                }
            );

            await test(`Given a DateTime object with value in leap year February "2024-02-01 10:00"
            when daysOfMonth is calculated for that DateTime
            then last element of the array should represent last day of month`,
                () =>
                {
                    assert.strictEqual(daysOfMonth.takeLast().value, "2024-02-29 00:00:00");
                    assert.strictEqual(daysOfMonth.takeLast().dateValue, "2024-02-29");
                }
            );
        });

        await describe("for 2023 feb (non leap year)", async () =>
        {
            const daysOfMonth = new DateTime({ value: "2023-02-01 10:00", zone: "utc" }).getDaysOfMonth();

            await test(`Given a DateTime object with value in non leap year February "2023-02-01 10:00"
            when daysOfMonth is calculated for that DateTime
            then it should return an array of 28 days`,
                () =>
                {
                    assert.strictEqual(daysOfMonth.length, 28);
                }
            );

            await test(`Given a DateTime object with value in non leap year February "2024-02-01 10:00"
            when daysOfMonth is calculated for that DateTime
            then first element of the array should represent first day of month`,
                () =>
                {
                    assert.strictEqual(daysOfMonth.takeFirst().value, "2023-02-01 00:00:00");
                    assert.strictEqual(daysOfMonth.takeFirst().dateValue, "2023-02-01");
                }
            );

            await test(`Given a DateTime object with value in non leap year February "2024-02-01 10:00"
            when daysOfMonth is calculated for that DateTime
            then last element of the array should represent last day of month`,
                () =>
                {
                    assert.strictEqual(daysOfMonth.takeLast().value, "2023-02-28 00:00:00");
                    assert.strictEqual(daysOfMonth.takeLast().dateValue, "2023-02-28");
                }
            );
        });

        await describe("Every element is the start of its day", async () =>
        {
            // The contract, asserted directly rather than by spot-checking the first and last
            // elements — the last element used to be the end of the month instead of a day start.
            const cases: Array<[string, string, number]> = [
                ["2024-01-15 10:00:00", "utc", 31],
                ["2024-02-15 10:00:00", "utc", 29],
                ["2023-02-15 10:00:00", "utc", 28],
                ["2024-04-15 10:00:00", "utc", 30],
                ["2024-03-15 10:00:00", "America/New_York", 31],
                ["2024-11-15 10:00:00", "America/New_York", 30],
                ["2024-10-15 10:00:00", "Australia/Lord_Howe", 31],
                ["2024-09-15 10:00:00", "America/Santiago", 30],
                ["2024-03-15 10:00:00", "Asia/Beirut", 31]
            ];

            for (const [value, zone, expectedLength] of cases)
            {
                await test(`Given a DateTime (${value} ${zone})
            when daysOfMonth is calculated for that DateTime
            then it should return ${expectedLength} consecutive day starts`,
                    () =>
                    {
                        const daysOfMonth = new DateTime({ value, zone }).getDaysOfMonth();

                        assert.strictEqual(daysOfMonth.length, expectedLength);

                        daysOfMonth.forEach((day, index) =>
                        {
                            // the first instant of its day — 00:00:00 except where midnight does
                            // not exist in this zone, so compare against startOf("day")
                            assert.ok(day.equals(day.startOf("day")),
                                `${day.toString()} is not the start of its day`);
                            assert.strictEqual(day.day, index + 1);
                            assert.strictEqual(day.zone, zone);
                        });
                    }
                );
            }
        });

        await describe("Daylight savings", async () =>
        {
            await test(`Given a month containing a daylight savings transition at 02:00
            when daysOfMonth is calculated
            then the transition day should still be a day start at midnight`,
                () =>
                {
                    const march = new DateTime({ value: "2024-03-15 10:00:00", zone: "America/New_York" }).getDaysOfMonth();

                    assert.strictEqual(march[9].value, "2024-03-10 00:00:00");
                    assert.strictEqual(march[10].value, "2024-03-11 00:00:00");
                }
            );

            await test(`Given a month in a zone whose daylight savings transition is at midnight
            when daysOfMonth is calculated
            then the affected day should start at the first instant that exists`,
                () =>
                {
                    // Beirut moves 00:00 -> 01:00 on 2024-03-31, so that day has no midnight
                    const beirut = new DateTime({ value: "2024-03-15 10:00:00", zone: "Asia/Beirut" }).getDaysOfMonth();
                    const transitionDay = beirut.takeLast();

                    assert.strictEqual(transitionDay.dateValue, "2024-03-31");
                    assert.strictEqual(transitionDay.timeValue, "01:00:00");
                    assert.ok(transitionDay.equals(transitionDay.startOf("day")));
                }
            );
        });

        await test(`Given a DateTime
        when the month bounds are needed
        then startOf and endOf should provide them`,
            () =>
            {
                const dateTime = new DateTime({ value: "2023-06-15 12:00:00", zone: "utc" });
                const daysOfMonth = dateTime.getDaysOfMonth();

                assert.ok(daysOfMonth.takeFirst().equals(dateTime.startOf("month")));
                assert.strictEqual(dateTime.endOf("month").value, "2023-06-30 23:59:59");
            }
        );
    });

    await describe("Convert to zone", async () =>
    {
        const value = "2024-01-01 10:00:00";

        const dateTime = new DateTime({ value, zone: "utc" });

        await test(`Given a DateTime object with value (${value}) and zone (utc)
        when a DateTime is converted to another zone
        then DateTime returned should have zone set to the new zone`,
            () =>
            {
                assert.strictEqual(dateTime.convertToZone("utc").zone, "utc");
                assert.strictEqual(dateTime.convertToZone("UTC+5:30").zone, "UTC+5:30");
                assert.strictEqual(dateTime.convertToZone("America/Los_Angeles").zone, "America/Los_Angeles");
            }
        );

        await test(`Given a DateTime object with value (${value}) and zone (utc)
        when a DateTime is converted to another zone
        then DateTime returned should have value changed with a difference of offset between the zones`,
            () =>
            {
                assert.strictEqual(dateTime.convertToZone("utc").value, value);
                assert.strictEqual(dateTime.convertToZone("UTC+5:30").value, "2024-01-01 15:30:00");
            }
        );

        await test(`Given a DateTime object with value ("2024-01-01 10:00") outside DST and zone (utc)
        when a DateTime is converted to America/Los_Angeles (PST - Pacific Standard Time)
        then DateTime returned should have value changed with -8 hours`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-01-01 10:00", zone: "utc" });
                assert.strictEqual(dateTime.convertToZone("America/Los_Angeles").value, "2024-01-01 02:00:00");
            }
        );

        await test(`Given a DateTime object with value ("2024-06-01 10:00") within DST and zone (utc)
        when a DateTime is converted to America/Los_Angeles (PDT — Pacific Daylight Time)
        then DateTime returned should have value changed with -7 hours`,
            () =>
            {
                const dateTime = new DateTime({ value: "2024-06-01 10:00", zone: "utc" });
                assert.strictEqual(dateTime.convertToZone("America/Los_Angeles").value, "2024-06-01 03:00:00");
            }
        );

        await describe("Check Invalid param for zone", async () =>
        {
            const dateTime = new DateTime({ value: "2024-01-01 10:00", zone: "utc" });

            async function checkIsInvalidParam(zone: string, reason: string): Promise<void>
            {
                await test(`Given a DateTime (${dateTime.toString()}), and a zone to convert it to (${zone})
                when ${reason}
                then it should throw a validation error`,
                    () =>
                    {
                        assert.throws(() => dateTime.convertToZone(zone), ArgumentException);
                    }
                );
            }

            await checkIsInvalidParam("", "zone is an empty string");
            await checkIsInvalidParam("aksfljn", "zone is a random string");
            await checkIsInvalidParam("local", "zone is local");
            await checkIsInvalidParam("America/LosAngeles", "zone is misspelled"); // correct is America/Los_Angeles
            await checkIsInvalidParam("UTC+14:01", "zone is invalid");
            await checkIsInvalidParam("UTC-12:01", "zone is invalid");
            await checkIsInvalidParam("UTC+15", "zone is invalid");
            await checkIsInvalidParam("UTC-13", "zone is invalid");
        });
    });
});

