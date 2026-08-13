# Getting Started

## Installation

```bash
npm install @nivinjoseph/n-date
# or
yarn add @nivinjoseph/n-date
```

Peer-adjacent packages used in examples:

```bash
yarn add @nivinjoseph/n-util
```

The library targets Node.js `>= 24.10` and is published as pure ESM.

## Importing

```typescript
import {
    DateTime,
    DateTimeSchema,
    DateTimeSpan,
    DateTimeSpanSchema,
    DateTimeFormat,
    DateTimeFormat_DEFAULT,
    DateTimeFormatExt
} from "@nivinjoseph/n-date";
```

## Core concepts

### A `DateTime` is a value + a zone

Every `DateTime` is constructed from two pieces of data:

- `value` — a string in the canonical format `yyyy-MM-dd HH:mm:ss`.
- `zone` — either `"utc"` or an IANA timezone identifier (e.g. `"America/New_York"`, `"Asia/Tokyo"`). `"local"` is explicitly disallowed so that serialized data is always unambiguous.

Shorter `value` strings are auto-padded on construction (`"2026"` → `"2026-01-01 00:00:00"`), so you can pass month-, day-, or hour-precision inputs directly. Anything that is not one of those shapes is rejected rather than truncated.

Two properties follow from this representation and are worth knowing up front:

- **Second precision.** Milliseconds are never retained, since `value` only goes down to seconds.
- **Canonical wall-clock time.** An instance always reports a time that really exists in its zone. A time inside a DST spring-forward gap is shifted to the real instant and `value` is rewritten to match, so the string accessors can never disagree with `timestamp` or `toStringISO()`. See [DateTime](./date-time.md#the-representation-and-what-follows-from-it) for the full contract.

For input you do not control, use `DateTime.tryCreate(value, zone)`, which returns `null` instead of throwing.

### Immutability

`DateTime` and `DateTimeSpan` instances never mutate. Methods like `addTime`, `subtractDays`, and `convertToZone` return a new instance.

```typescript
const a = DateTime.now("utc");
const b = a.addDays(1);
a.equals(b); // false — a is unchanged
```

### Serialization

Both types extend `Serializable` from `@nivinjoseph/n-util` and are registered under the `"Ndate"` namespace — `DateTime` serializes with the tag `"Ndate.DateTime"` and `DateTimeSpan` with `"Ndate.DateTimeSpan"`. `JSON.stringify` / `Deserializer.deserialize` round-trip them losslessly.

## Quick tour

### Create

```typescript
DateTime.now("utc");
DateTime.now("America/Toronto");

DateTime.createFromTimestamp(1_700_000_000, "utc");
DateTime.createFromMilliSecondsSinceEpoch(Date.now(), "utc");
DateTime.createFromCodes("20260420", "153000", "utc");
DateTime.createFromValues("2026-04-20", "15:30:00", "utc");
DateTime.createFromISO("2026-04-20T15:30:00Z", "utc");

new DateTime({ value: "2026-04-20 15:30:00", zone: "utc" });

DateTime.tryCreate(untrustedValue, untrustedZone); // DateTime | null
```

### Inspect

```typescript
const dt = DateTime.now("America/New_York");

dt.value;      // "2026-04-20 11:30:45"
dt.zone;       // "America/New_York"
dt.timestamp;  // 1745163045 (seconds since epoch)
dt.dateCode;   // "20260420"
dt.timeCode;   // "113045"
dt.dateValue;  // "2026-04-20"
dt.timeValue;  // "11:30:45"
dt.isPast;     // true
dt.isFuture;   // false

dt.year;       // 2026
dt.month;      // 4
dt.day;        // 20
dt.hour;       // 11
dt.dayOfWeek;  // 1 (Monday)
dt.isWeekend;  // false
dt.isLeapYear; // false
```

### Compare

```typescript
a.isSame(b);
a.isBefore(b);
a.isSameOrBefore(b);
a.isAfter(b);
a.isSameOrAfter(b);
a.isBetween(start, end);
a.isSameDay(b);

a.timeDiff(b);  // Duration — elapsed time
a.daysDiff(b);  // number — calendar days
DateTime.min(a, b);
DateTime.max(a, b);
```

`isSameDay` and `daysDiff` compare **calendar days**, not elapsed 24-hour periods — `23:00` and
`01:00` the next morning are two hours apart but are not the same day.

### Arithmetic

```typescript
import { Duration } from "@nivinjoseph/n-util";

dt.addTime(Duration.fromHours(3));    // DST-aware shift
dt.subtractTime(Duration.fromMinutes(15));
dt.addDays(7);                         // calendar day, DST-preserving
dt.subtractDays(1);
dt.addDays(-1);                        // negatives allowed, so signed deltas work
dt.addMonths(1);                       // clamps to the end of the target month
dt.addYears(1);

dt.startOf("day");                     // 2026-04-20 00:00:00
dt.endOf("month");                     // 2026-04-30 23:59:59
```

### Format

```typescript
dt.toStringDateTime();                        // "2026-04-20 11:30:45"
dt.toStringISO();                             // "2026-04-20T11:30:45.000-04:00"
dt.toString();                                // "2026-04-20 11:30:45 America/New_York"
dt.format(DateTimeFormat.yearMonthDay);       // "2026-04-20"
dt.formatExt("DDDD");                         // "Monday, April 20, 2026"
```

### Convert zones

```typescript
const ny = DateTime.now("America/New_York");
const tokyo = ny.convertToZone("Asia/Tokyo");

ny.timestamp === tokyo.timestamp; // true — same instant, different wall clock
```

## Testing with fake time

For deterministic tests, freeze "now" for the duration of a callback:

```typescript
DateTime.withFixedNow(1_700_000_000, () =>
{
    DateTime.now("utc"); // always 2023-11-14 22:13:20
});
// the previous clock is restored here, including if the callback threw
```

The unscoped hooks are also available:

```typescript
DateTime.useFixedNow(1_700_000_000);
DateTime.now("utc"); // always 2023-11-14 22:13:20

DateTime.useRelativeNow(1_700_000_000);
// DateTime.now() advances normally from this base.

DateTime.resetFixedOrRelativeNow();
```

The fake clock is process-global, so prefer `withFixedNow`. If you use the unscoped hooks, always
reset in an `afterEach` hook so leaked state does not affect later tests.
