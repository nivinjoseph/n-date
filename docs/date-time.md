# DateTime

An immutable, timezone-aware date/time value. Source: [src/date-time.ts](../src/date-time.ts).

```typescript
import { DateTime, DateTimeData } from "@nivinjoseph/n-date";
```

## The representation, and what follows from it

A `DateTime` is identified by a wall-clock `value` plus a `zone` — together they determine the
instant, and they are the only state the constructor accepts. The [serialized form](#data-type)
additionally carries the derived `timestamp`, which is written out but never read back in. Three
guarantees follow, and it is worth reading them before anything else:

**Second precision.** `value` is `yyyy-MM-dd HH:mm:ss`, so milliseconds are never retained.
`addTime(Duration.fromMilliSeconds(500))` is a no-op, `createFromMilliSecondsSinceEpoch` drops the
millisecond part, and `endOf("day")` is `23:59:59` rather than `23:59:59.999`.

**Canonical wall-clock time.** An instance always reports a wall-clock time that actually exists in
its zone:

- In a DST **spring-forward gap**, the input is shifted forward to the real instant and `value` is
  rewritten to match. `{ value: "2024-03-10 02:30:00", zone: "America/Los_Angeles" }` yields a
  `value` of `"2024-03-10 03:30:00"`, because 02:30 never happened that day. Every accessor —
  `value`, `timeCode`, `hour`, `format()`, `toStringISO()` — agrees.
- In a DST **fall-back**, where one wall-clock time maps to two instants, the **earlier** offset is
  always chosen. This is what makes an instance equal to the result of deserializing its own
  serialized form.

The fall-back rule has a corollary worth internalizing: an instant in the **second** pass of a
repeated hour cannot be represented, so anything that lands there collapses to the earlier pass —
up to one hour earlier. Concretely, once a year in every zone that observes DST:

- `createFromTimestamp` / `createFromMilliSecondsSinceEpoch` given a second-pass instant return the
  first-pass instant.
- `convertToZone` into a zone where the instant falls in a repeated hour loses the hour, and
  converting back does not recover it.
- `addTime` landing in the repeated hour collapses — adding 1 hour and 2 hours from just before the
  transition produce the same instant.
- A zone-local `DateTime.now(zone)` during that hour reads up to an hour early; the default
  `DateTime.now()` (UTC) is always exact.

**Years 0000–9999.** That is the range `yyyy` can carry. Constructions and arithmetic whose result
falls outside it throw (`resulting date is outside the supported year range 0000-9999`).

## Construction

### `new DateTime(data: Omit<DateTimeData, "timestamp">)`

```typescript
new DateTime({ value: "2023-06-11 10:30:45", zone: "America/New_York" });
```

`value` and `zone` are the only state a `DateTime` accepts. `DateTimeData` also carries `timestamp`,
because that is part of the [serialized form](#data-type) — but it is derived from `value` and
`zone`, so the constructor takes the type minus that key and passing it is a compile error.

- `value` — a string matching `yyyy-MM-dd HH:mm:ss`. Shorter forms (`yyyy`, `yyyy-MM`, `yyyy-MM-dd`, `yyyy-MM-dd HH`, `yyyy-MM-dd HH:mm`) are auto-padded with zeros. Anything else — including a value with extra trailing characters such as `"2023-06-11 10:00:00.999"` — is **rejected**, not truncated.
- `zone` — `"utc"` or an IANA timezone id. The machine-relative specifiers `"local"`, `"system"` and `"default"` are rejected — they would make the serialized form mean a different instant on a different machine. `UTC±HH:MM` offsets are accepted within the valid range (`UTC-12:00` … `UTC+14:00`). For `"utc"`, casing and surrounding whitespace are normalized, so `"UTC"`, `" utc "` and `"utc"` produce the same instance; every other zone string is stored and compared verbatim — `"America/New_York"` and `"america/new_york"` are the same zone but distinct strings for `equals` and serialization, so prefer canonical IANA casing.

Throws if the format is wrong, if month/day/hour/minute/second are out of range, or if the zone is invalid.

### Static factories

| Method | Notes |
| --- | --- |
| `DateTime.now(zone?)` | Current instant; defaults to `"utc"`. Honours `useFixedNow` / `useRelativeNow`. |
| `DateTime.createFromTimestamp(seconds, zone)` | Unix timestamp in **seconds**; fractional seconds are truncated. |
| `DateTime.createFromMilliSecondsSinceEpoch(ms, zone)` | Unix timestamp in **milliseconds**; the ms part is dropped. |
| `DateTime.createFromISO(value, zone)` | Parses ISO 8601, honouring any offset in the string. |
| `DateTime.createFromCodes(dateCode, timeCode, zone)` | `dateCode` is `YYYYMMDD`, `timeCode` is `HHmmss`. |
| `DateTime.createFromValues(dateValue, timeValue, zone)` | `dateValue` is `YYYY-MM-DD`, `timeValue` is `HH:mm:ss`. |
| `DateTime.tryCreate(value, zone)` | Returns `DateTime` or `null` instead of throwing. |

The instant-based factories (`now`, `createFromTimestamp`, `createFromMilliSecondsSinceEpoch`,
`createFromISO`) validate the zone up front, so an invalid zone reports an error against `zone`
rather than surfacing as a confusing value-format error. `createFromCodes` and `createFromValues`
validate their value shapes first.

### Parsing untrusted input

```typescript
const dt = DateTime.tryCreate(req.body.startsAt, req.body.zone);
if (dt == null)
    return badRequest("invalid date");
```

### Min / max

```typescript
DateTime.min(a, b); // earlier of the two
DateTime.max(a, b); // later of the two
```

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string` | Canonical `yyyy-MM-dd HH:mm:ss`. |
| `zone` | `string` | Timezone identifier. |
| `timestamp` | `number` | Unix **seconds** (note `valueOf()` returns milliseconds). Serialized, but derived — not a constructor input. |
| `dateCode` | `string` | `YYYYMMDD`. |
| `timeCode` | `string` | `HHMMSS`. |
| `dateValue` | `string` | `YYYY-MM-DD`. |
| `timeValue` | `string` | `HH:mm:ss`. |
| `year` `month` `day` | `number` | Calendar components in the instance's zone. |
| `hour` `minute` `second` | `number` | Clock components in the instance's zone. |
| `dayOfWeek` | `number` | 1 = Monday … 7 = Sunday. |
| `dayOfYear` | `number` | 1–366. |
| `daysInMonth` | `number` | Days in this instance's month. |
| `isWeekend` | `boolean` | Saturday or Sunday. |
| `isLeapYear` | `boolean` | Whether the year is a leap year. |
| `isPast` | `boolean` | Relative to `DateTime.now()`. |
| `isFuture` | `boolean` | Relative to `DateTime.now()`. |
| `DateTime.currentZone` | `string` | The host system's local zone (static). |

## Comparison

```typescript
a.equals(b);        // same value AND same zone
a.isSame(b);        // same instant (zones may differ)
a.isBefore(b);
a.isSameOrBefore(b);
a.isAfter(b);
a.isSameOrAfter(b);
a.isBetween(start, end); // inclusive; throws if end < start
a.isSameDay(b);
```

`isSame` compares instants, so `"2026-04-20 12:00 utc"` and `"2026-04-20 08:00 America/New_York"` are the same. `equals` requires matching `value` **and** `zone`.

`equals` follows the `DomainObject` contract: anything that is not a `DateTime` — another domain object type, `null` or `undefined` — compares as not equal rather than throwing.

### `isSameDay` and `daysDiff` are calendar operations

Both compare **calendar days**, not elapsed 24-hour periods:

```typescript
a = "2023-06-11 23:00"; b = "2023-06-12 01:00";  // 2 hours apart
a.isSameDay(b);   // false — different calendar days
a.daysDiff(b);    // 1
```

The calendar date is taken as written in each instance's own zone, so two instances that read as the
same date in their respective zones are the same day regardless of how far apart the instants are:

```typescript
const la = new DateTime({ value: "2024-01-01 10:00:00", zone: "America/Los_Angeles" });
const ist = new DateTime({ value: "2024-01-01 10:00:00", zone: "UTC+5:30" });
la.isSameDay(ist);   // true — both read as January 1st
la.daysDiff(ist);    // 0
```

Convert to a common zone first if you want instant-based semantics:
`a.isSameDay(b.convertToZone(a.zone))`. Use `timeDiff` when you want elapsed time.

## Differences

```typescript
a.timeDiff(b); // Duration (absolute elapsed time)
a.daysDiff(b); // number (absolute calendar days)
```

## Arithmetic

All methods return a new `DateTime` in the same zone.

| Method | DST behaviour |
| --- | --- |
| `addTime(duration)` / `subtractTime(duration)` | Shifts by elapsed time — wall-clock time may jump across DST boundaries. A result landing in a fall-back repeated hour collapses to the earlier offset (see the representation section). |
| `addDays(n)` / `subtractDays(n)` | Shifts by calendar days — wall-clock time is preserved across DST. |
| `addMonths(n)` / `subtractMonths(n)` | Calendar months; the day clamps to the end of the target month. |
| `addYears(n)` / `subtractYears(n)` | Calendar years; Feb 29 clamps to Feb 28. |

```typescript
import { Duration } from "@nivinjoseph/n-util";

dt.addTime(Duration.fromHours(2));
dt.addDays(7);
dt.addDays(-7);        // negatives are allowed, so signed deltas work
dt.addMonths(1);
```

All of these take any integer — pass a negative value to move backwards, or use the matching
`subtract*` method.

### `startOf(unit)` / `endOf(unit)`

`unit` is a `DateTimeUnit` (exported from the package): `"year" | "month" | "day" | "hour" |
"minute"`. Anything else throws.

```typescript
dt.startOf("day");   // 2024-03-15 00:00:00
dt.endOf("month");   // 2024-03-31 23:59:59
```

`endOf` returns the final whole second of the unit, per the precision contract above.

## Zone conversion

```typescript
const ny = DateTime.now("America/New_York");
const tokyo = ny.convertToZone("Asia/Tokyo");
// tokyo.timestamp === ny.timestamp
```

Returns `this` unchanged when the target zone matches the current one, comparing normalized zones —
so `convertToZone("UTC")` on a `"utc"` instance short-circuits too.

The instant is preserved except in one case: if it falls in the second pass of a DST fall-back
repeated hour in the *target* zone, it collapses to the earlier pass (see the representation
section) — so `tokyo.timestamp === ny.timestamp` above holds because Japan observes no DST, but a
conversion into `America/New_York` during its repeated hour would not.

## Formatting

### `toStringDateTime(): string`

Canonical `yyyy-MM-dd HH:mm:ss`.

### `toStringISO(): string`

Extended ISO-8601 with offset, e.g. `2026-04-20T11:30:45.000-04:00`.

### `toISODate(): string`

The ISO date portion, `yyyy-MM-dd`.

### `toString(): string`

`"${value} ${zone}"`, e.g. `2026-04-20 11:30:45 America/New_York`.

### `format(format?: DateTimeFormat): string`

Truncates to the requested precision. Throws if given something that is not a `DateTimeFormat`.
See [formats](./formats.md).

### `formatExt(format: DateTimeFormatExt | string, locale?: string): string`

Full Luxon formatting — accepts any [Luxon format token string](https://moment.github.io/luxon/#/formatting?id=table-of-tokens). The `DateTimeFormatExt` union documents commonly used presets.

The locale defaults to `"en-US"` so output does not vary with the host's ambient locale; pass a
locale explicitly to override it.

```typescript
dt.formatExt("DDDD");        // "Sunday, July 2, 2023"
dt.formatExt("MMMM", "fr");  // "juillet"
```

## Interop

### `valueOf(): number`

Milliseconds since the Unix epoch (always a whole second, per the precision contract). This is what
the comparison methods use internally; note that `timestamp` is **seconds**.

### `toLuxon(): LuxonDateTime`

The escape hatch for anything this wrapper does not expose. The returned Luxon object is itself
immutable, so it cannot be used to mutate the instance.

### `toJSDate(): Date`

A native `Date` at the same instant.

## Validation helpers (static)

```typescript
DateTime.validateDateTimeFormat(value, format?); // defaults to "yyyy-MM-dd HH:mm:ss"
DateTime.validateDateFormat(value);              // "yyyy-MM-dd"
DateTime.validateTimeFormat(value, format?);     // defaults to "HH:mm:ss"; pass "HH:mm" for minute precision
DateTime.validateTimeZone(zone);                 // boolean
```

`validateTimeFormat` defaults to `"HH:mm:ss"` so that anything it accepts is also accepted by
`createFromValues`.

## Test hooks (static)

Prefer the scoped helper — the fake clock is process-global state, so leaving it set leaks into
every subsequent test:

```typescript
DateTime.withFixedNow(timestampSeconds, () =>
{
    // DateTime.now() is frozen in here; the previous clock is restored afterwards,
    // including when the callback throws
});
```

Async callbacks are fully supported — the clock stays fixed across `await`s and is restored when
the returned promise settles (resolves or rejects):

```typescript
await DateTime.withFixedNow(timestampSeconds, async () =>
{
    await somethingAsync();
    DateTime.now(); // still the fixed instant
});
```

The unscoped hooks remain available:

```typescript
DateTime.useFixedNow(timestampSeconds);    // freeze now()
DateTime.useRelativeNow(timestampSeconds); // now() advances from this base
DateTime.resetFixedOrRelativeNow();        // back to real time
```

`useFixedNow` and `useRelativeNow` are mutually exclusive — calling one clears the other.

## Iteration helpers

### `getDaysOfMonth(): Array<DateTime>`

Returns one element per day of the month, each at the start of its day — there is no special case at either end of the array.

```typescript
new DateTime({ value: "2023-06-15", zone: "utc" }).getDaysOfMonth();
// [ 2023-06-01 00:00:00, 2023-06-02 00:00:00, … , 2023-06-30 00:00:00 ]   (30 elements)
```

Every element is the **first instant of its calendar day**. That is `00:00:00` in almost every case, but in a zone where a DST transition happens at midnight, midnight does not exist on that date and the day starts at the first instant that does — `01:00:00` in `America/Santiago` and `Asia/Beirut`, for example. Assert against `startOf("day")` rather than a literal `00:00:00` if you are testing this.

For the bounds of the month, use `startOf` / `endOf` directly:

```typescript
new DateTimeSpan({ start: dt.startOf("month"), end: dt.endOf("month") });
```

## Time-of-day windows

### `isWithinTimeRange(startTimeCode, endTimeCode): boolean`

Checks whether this `DateTime`'s local time of day falls within `[startTimeCode, endTimeCode]`, inclusive. Codes are `HHmmss` and must be a real time of day — `"007799"` is rejected.

Ranges that wrap midnight are supported: when `endTimeCode` is earlier than `startTimeCode`, the range is treated as running through midnight.

```typescript
DateTime.now("America/Toronto").isWithinTimeRange("090000", "170000"); // business hours
DateTime.now("America/Toronto").isWithinTimeRange("220000", "020000"); // overnight window
```

## Data type

```typescript
export type DateTimeData = DomainObjectData<DateTime>;
// { value: string; zone: string; timestamp: number; }
```

`DateTime` extends `DomainObject` from `@nivinjoseph/n-domain`, so `serialize()` returns `{ value, zone, timestamp, $typename }` with the type tag `"Ndate.DateTime"`.

`timestamp` is redundant — `value` and `zone` already determine the instant — and it is emitted anyway so that a store holding serialized `DateTime`s can sort, filter and range-query them on the instant without deserializing every row. Because it is derived rather than independent state, the constructor takes `Omit<DateTimeData, "timestamp">`, and a `timestamp` arriving on the hydration path (from `Deserializer.deserialize`, or from a payload written by an older version that has none) is ignored and recomputed from `value` and `zone`. Round-tripping is therefore lossless in both directions, and a stale stored `timestamp` can never contradict the wall-clock time it was stored beside.
