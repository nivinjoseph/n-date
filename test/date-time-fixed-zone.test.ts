import assert from "node:assert";
import { describe, test } from "node:test";
import { DateTime } from "../src/index.js";
import { ArgumentException } from "@nivinjoseph/n-exception";
import { DateTime as LuxonDateTime } from "luxon";


const machineZone = LuxonDateTime.local().zoneName;

// 2024-01-01 10:00:00 utc
const fixedTimestamp = 1704103200;


await describe("DateTime Fixed Current Zone", async () =>
{
    await describe("useFixedCurrentZone", async () =>
    {
        await test(`Given a fixed current zone
        when currentZone is read
        then it should return that zone instead of the machine zone`,
            () =>
            {
                try
                {
                    DateTime.useFixedCurrentZone("America/New_York");

                    assert.strictEqual(DateTime.currentZone, "America/New_York");
                }
                finally
                {
                    DateTime.resetFixedCurrentZone();
                }
            }
        );

        await test(`Given a fixed current zone
        when it is set again
        then the latest value should win`,
            () =>
            {
                try
                {
                    DateTime.useFixedCurrentZone("America/New_York");
                    DateTime.useFixedCurrentZone("Asia/Tokyo");

                    assert.strictEqual(DateTime.currentZone, "Asia/Tokyo");
                }
                finally
                {
                    DateTime.resetFixedCurrentZone();
                }
            }
        );

        await test(`Given a utc zone with different casing and whitespace
        when it is set as the fixed current zone
        then currentZone should report the normalized value`,
            () =>
            {
                try
                {
                    DateTime.useFixedCurrentZone(" UTC ");

                    assert.strictEqual(DateTime.currentZone, "utc");
                }
                finally
                {
                    DateTime.resetFixedCurrentZone();
                }
            }
        );

        await test(`Given a fixed current zone
        when now is called without a zone
        then it should still default to utc`,
            () =>
            {
                try
                {
                    DateTime.useFixedCurrentZone("America/New_York");

                    assert.strictEqual(DateTime.now().zone, "utc");
                }
                finally
                {
                    DateTime.resetFixedCurrentZone();
                }
            }
        );

        await test(`Given an invalid zone
        when useFixedCurrentZone is called
        then it should throw and leave the current zone untouched`,
            () =>
            {
                assert.throws(() => DateTime.useFixedCurrentZone("Not/AZone"), ArgumentException);

                assert.strictEqual(DateTime.currentZone, machineZone);
            }
        );

        await test(`Given a machine relative zone
        when useFixedCurrentZone is called
        then it should throw and leave the current zone untouched`,
            () =>
            {
                for (const zone of ["local", "system", "default"])
                    assert.throws(() => DateTime.useFixedCurrentZone(zone), ArgumentException);

                assert.strictEqual(DateTime.currentZone, machineZone);
            }
        );

        await test(`Given a missing or non string zone
        when useFixedCurrentZone is called
        then it should throw a validation error`,
            () =>
            {
                assert.throws(() => DateTime.useFixedCurrentZone(null as any), ArgumentException);
                assert.throws(() => DateTime.useFixedCurrentZone(undefined as any), ArgumentException);
                assert.throws(() => DateTime.useFixedCurrentZone(5 as any), ArgumentException);

                assert.strictEqual(DateTime.currentZone, machineZone);
            }
        );
    });

    await describe("resetFixedCurrentZone", async () =>
    {
        await test(`Given a fixed current zone
        when it is reset
        then currentZone should report the machine zone again`,
            () =>
            {
                DateTime.useFixedCurrentZone("America/New_York");
                DateTime.resetFixedCurrentZone();

                assert.strictEqual(DateTime.currentZone, machineZone);
            }
        );

        await test(`Given no fixed current zone
        when it is reset
        then it should be a no-op`,
            () =>
            {
                DateTime.resetFixedCurrentZone();

                assert.strictEqual(DateTime.currentZone, machineZone);
            }
        );
    });

    await describe("independence from the fake clock", async () =>
    {
        await test(`Given a fixed current zone
        when the fake clock is reset
        then the fixed current zone should survive`,
            () =>
            {
                try
                {
                    DateTime.useFixedCurrentZone("America/New_York");
                    DateTime.resetFixedOrRelativeNow();

                    assert.strictEqual(DateTime.currentZone, "America/New_York");
                }
                finally
                {
                    DateTime.resetFixedCurrentZone();
                }
            }
        );

        await test(`Given a fixed now
        when the fixed current zone is reset
        then the fake clock should survive`,
            () =>
            {
                try
                {
                    DateTime.useFixedNow(fixedTimestamp);
                    DateTime.useFixedCurrentZone("America/New_York");
                    DateTime.resetFixedCurrentZone();

                    assert.strictEqual(DateTime.now().timestamp, fixedTimestamp);
                    assert.strictEqual(DateTime.currentZone, machineZone);
                }
                finally
                {
                    DateTime.resetFixedOrRelativeNow();
                    DateTime.resetFixedCurrentZone();
                }
            }
        );
    });

});
