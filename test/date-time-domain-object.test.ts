import assert from "node:assert";
import { describe, test } from "node:test";
import { DomainObject } from "@nivinjoseph/n-domain";
import { DateTime, DateTimeSpan } from "../src/index.js";


function dt(value: string, zone = "utc"): DateTime
{
    return new DateTime({ value, zone });
}

function span(startValue: string, endValue: string, zone = "utc"): DateTimeSpan
{
    return new DateTimeSpan({ start: dt(startValue, zone), end: dt(endValue, zone) });
}


await describe("DomainObject integration", async () =>
{
    await describe("Inheritance", async () =>
    {
        await test(`Given a DateTime
        when its prototype chain is inspected
        then it should be a DomainObject`,
            () =>
            {
                assert.ok(dt("2024-01-01 10:00:00") instanceof DomainObject);
            }
        );

        await test(`Given a DateTimeSpan
        when its prototype chain is inspected
        then it should be a DomainObject`,
            () =>
            {
                assert.ok(span("2024-01-01 10:00:00", "2024-01-01 12:00:00") instanceof DomainObject);
            }
        );
    });

    await describe("Cross type equals", async () =>
    {
        await test(`Given a DateTime and a DateTimeSpan
        when equals is called in either direction
        then it should return false rather than throw`,
            () =>
            {
                const dateTime = dt("2024-01-01 10:00:00");
                const dateTimeSpan = span("2024-01-01 10:00:00", "2024-01-01 12:00:00");

                assert.strictEqual(dateTime.equals(dateTimeSpan), false);
                assert.strictEqual(dateTimeSpan.equals(dateTime), false);
            }
        );

        await test(`Given a DateTime
        when equals is called with undefined
        then it should return false`,
            () =>
            {
                assert.strictEqual(dt("2024-01-01 10:00:00").equals(undefined), false);
            }
        );

        await test(`Given a DateTimeSpan
        when equals is called with undefined
        then it should return false`,
            () =>
            {
                assert.strictEqual(span("2024-01-01 10:00:00", "2024-01-01 12:00:00").equals(undefined), false);
            }
        );
    });

    await describe("Construction guard", async () =>
    {
        await test(`Given data carrying a key with no matching serialize decorated getter
        when a DateTime is constructed
        then it should throw naming the offending key`,
            () =>
            {
                assert.throws(
                    () => new DateTime({ value: "2024-01-01 10:00:00", zone: "utc", bogus: 1 } as any),
                    (e: Error) => e.message.includes("bogus")
                );
            }
        );

        await test(`Given data carrying a key with no matching serialize decorated getter
        when a DateTimeSpan is constructed
        then it should throw naming the offending key`,
            () =>
            {
                assert.throws(
                    () => new DateTimeSpan({
                        start: dt("2024-01-01 10:00:00"),
                        end: dt("2024-01-01 12:00:00"),
                        duration: 1
                    } as any),
                    (e: Error) => e.message.includes("duration")
                );
            }
        );

        await test(`Given a serialized DateTime carrying its type tag
        when it is passed straight back to the constructor
        then the guard should be skipped so hydration still works`,
            () =>
            {
                const original = dt("2024-01-01 10:00:00", "America/New_York");
                const rehydrated = new DateTime(original.serialize() as any);

                assert.ok(rehydrated.equals(original));
            }
        );
    });
});
