import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime } from "../src/index.js";
import { ArgumentException } from "@nivinjoseph/n-exception";


// 2024-01-01 10:00:00 utc
const fixedTimestamp = 1704103200;


await describe("DateTime Fake Clock", async () =>
{
    await describe("useFixedNow", async () =>
    {
        await test(`Given a fixed now
        when now is called
        then it should return that instant every time`,
            () =>
            {
                try
                {
                    DateTime.useFixedNow(fixedTimestamp);

                    assert.strictEqual(DateTime.now().value, "2024-01-01 10:00:00");
                    assert.strictEqual(DateTime.now().timestamp, fixedTimestamp);
                    assert.strictEqual(DateTime.now().timestamp, DateTime.now().timestamp);
                }
                finally
                {
                    DateTime.resetFixedOrRelativeNow();
                }
            }
        );

        await test(`Given a fixed now
        when now is called with a zone
        then it should return that instant expressed in the zone`,
            () =>
            {
                try
                {
                    DateTime.useFixedNow(fixedTimestamp);

                    assert.strictEqual(DateTime.now("America/New_York").value, "2024-01-01 05:00:00");
                    assert.strictEqual(DateTime.now("America/New_York").timestamp, fixedTimestamp);
                }
                finally
                {
                    DateTime.resetFixedOrRelativeNow();
                }
            }
        );

        await test(`Given a fixed now
        when isPast and isFuture are read
        then they should be evaluated against the fixed instant`,
            () =>
            {
                try
                {
                    DateTime.useFixedNow(fixedTimestamp);

                    assert.ok(new DateTime({ value: "2024-01-01 09:00:00", zone: "utc" }).isPast);
                    assert.ok(!new DateTime({ value: "2024-01-01 09:00:00", zone: "utc" }).isFuture);
                    assert.ok(new DateTime({ value: "2024-01-01 11:00:00", zone: "utc" }).isFuture);
                    assert.ok(!new DateTime({ value: "2024-01-01 11:00:00", zone: "utc" }).isPast);
                }
                finally
                {
                    DateTime.resetFixedOrRelativeNow();
                }
            }
        );

        await test(`Given a non numeric timestamp
        when useFixedNow is called
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => DateTime.useFixedNow(null as any), ArgumentException);
                assert.throws(() => DateTime.useFixedNow("nope" as any), ArgumentException);
            }
        );
    });

    await describe("useRelativeNow", async () =>
    {
        await test(`Given a relative now
        when now is called
        then it should start at the base instant`,
            () =>
            {
                try
                {
                    DateTime.useRelativeNow(fixedTimestamp);

                    // no meaningful real time has elapsed, so it should still be within a second
                    assert.ok(Math.abs(DateTime.now().timestamp - fixedTimestamp) <= 1);
                }
                finally
                {
                    DateTime.resetFixedOrRelativeNow();
                }
            }
        );

        await test(`Given a relative now
        when it is set after a fixed now
        then it should replace the fixed now`,
            () =>
            {
                try
                {
                    DateTime.useFixedNow(0);
                    DateTime.useRelativeNow(fixedTimestamp);

                    assert.ok(Math.abs(DateTime.now().timestamp - fixedTimestamp) <= 1);
                }
                finally
                {
                    DateTime.resetFixedOrRelativeNow();
                }
            }
        );

        await test(`Given a non numeric timestamp
        when useRelativeNow is called
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => DateTime.useRelativeNow(null as any), ArgumentException);
            }
        );
    });

    await describe("resetFixedOrRelativeNow", async () =>
    {
        await test(`Given a fixed now
        when it is reset
        then now should return real time again`,
            () =>
            {
                DateTime.useFixedNow(fixedTimestamp);
                assert.strictEqual(DateTime.now().timestamp, fixedTimestamp);

                DateTime.resetFixedOrRelativeNow();

                assert.notStrictEqual(DateTime.now().timestamp, fixedTimestamp);
            }
        );
    });

    await describe("withFixedNow", async () =>
    {
        await test(`Given a function
        when it is run under withFixedNow
        then now should be fixed inside and restored afterwards`,
            () =>
            {
                const before = DateTime.now().timestamp;

                const inside = DateTime.withFixedNow(fixedTimestamp, () => DateTime.now().timestamp);

                assert.strictEqual(inside, fixedTimestamp);
                assert.ok(DateTime.now().timestamp >= before);
                assert.notStrictEqual(DateTime.now().timestamp, fixedTimestamp);
            }
        );

        await test(`Given a function that throws
        when it is run under withFixedNow
        then the clock should still be restored`,
            () =>
            {
                assert.throws(() => DateTime.withFixedNow(fixedTimestamp, () =>
                {
                    throw new Error("boom");
                }), /boom/);

                assert.notStrictEqual(DateTime.now().timestamp, fixedTimestamp);
            }
        );

        await test(`Given a function
        when it returns a value
        then withFixedNow should pass it through`,
            () =>
            {
                assert.strictEqual(DateTime.withFixedNow(fixedTimestamp, () => "result"), "result");
            }
        );

        await test(`Given an outer fixed now
        when withFixedNow is nested inside it
        then the outer fixed now should be restored`,
            () =>
            {
                try
                {
                    DateTime.useFixedNow(0);

                    DateTime.withFixedNow(fixedTimestamp, () =>
                    {
                        assert.strictEqual(DateTime.now().timestamp, fixedTimestamp);
                    });

                    assert.strictEqual(DateTime.now().timestamp, 0);
                }
                finally
                {
                    DateTime.resetFixedOrRelativeNow();
                }
            }
        );

        await test(`Given a missing function
        when withFixedNow is called
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => DateTime.withFixedNow(fixedTimestamp, null as any), ArgumentException);
            }
        );
    });
});
