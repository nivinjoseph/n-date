# DateTime

An immutable, timezone-aware date/time value. Source: [src/date-time.ts](../src/date-time.ts).

```typescript
import { DateTime, DateTimeSchema } from "@nivinjoseph/n-date";
```

## Construction

### `new DateTime(data: DateTimeSchema)`

```typescript
type DateTimeSchema = { value: string; zone: string; };
```

- `value` — a string matching `yyyy-MM-dd HH:mm:ss`. Shorter forms (`yyyy`, `yyyy-MM`, `yyyy-MM-dd`, `yyyy-MM-dd HH`, `yyyy-MM-dd HH:mm`) are auto-padded with zeros.
- `zone` — `"utc"` or an IANA timezone id. `"local"` is rejected. `UTC±HH:MM` offsets are accepted within the valid range (`UTC-12:00` … `UTC+14:00`).

Throws if the format is wrong, if month/day/hour/minute/second are out of range, or if the zone is invalid.

### Static factories

| Method | Notes |
| --- | --- |
| `DateTime.now(zone?)` | Current instant; defaults to `"utc"`. Honours `useFixedNow` / `useRelativeNow`. |
| `DateTime.createFromTimestamp(seconds, zone)` | Unix timestamp in **seconds**. |
| `DateTime.createFromMilliSecondsSinceEpoch(ms, zone)` | Unix timestamp in **milliseconds**. |
| `DateTime.createFromCodes(dateCode, timeCode, zone)` | `dateCode` is `YYYYMMDD`, `timeCode` is `HHMMSS`. |
| `DateTime.createFromValues(dateValue, timeValue, zone)` | `dateValue` is `YYYY-MM-DD`, `timeValue` is `HH:mm:ss`. |

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
| `timestamp` | `number` | Unix seconds. |
| `dateCode` | `string` | `YYYYMMDD`. |
| `timeCode` | `string` | `HHMMSS`. |
| `dateValue` | `string` | `YYYY-MM-DD`. |
| `timeValue` | `string` | `HH:mm:ss`. |
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

## Differences

```typescript
a.timeDiff(b); // Duration (absolute)
a.daysDiff(b); // number (absolute, integer)
```

## Arithmetic

All methods return a new `DateTime` in the same zone.

| Method | DST behaviour |
| --- | --- |
| `addTime(duration)` / `subtractTime(duration)` | Shifts by elapsed time — wall-clock time may jump across DST boundaries. |
| `addDays(n)` / `subtractDays(n)` | Shifts by calendar days — wall-clock time is preserved across DST. |

```typescript
import { Duration } from "@nivinjoseph/n-util";

dt.addTime(Duration.fromHours(2));
dt.addDays(7);
```

`addDays` / `subtractDays` require a non-negative integer.

## Zone conversion

```typescript
const ny = DateTime.now("America/New_York");
const tokyo = ny.convertToZone("Asia/Tokyo");
// tokyo.timestamp === ny.timestamp
```

Returns `this` unchanged when the target zone matches the current one.

## Formatting

### `toStringDateTime(): string`

Canonical `yyyy-MM-dd HH:mm:ss`.

### `toStringISO(): string`

Extended ISO-8601 with offset, e.g. `2026-04-20T11:30:45.000-04:00`.

### `toString(): string`

`"${value} ${zone}"`, e.g. `2026-04-20 11:30:45 America/New_York`.

### `format(format?: DateTimeFormat): string`

Truncates to the requested precision. See [formats](./formats.md).

### `formatExt(format: DateTimeFormatExt | string): string`

Full Luxon formatting — accepts any [Luxon format token string](https://moment.github.io/luxon/#/formatting?id=table-of-tokens). The `DateTimeFormatExt` union documents commonly used presets.

## Validation helpers (static)

```typescript
DateTime.validateDateTimeFormat(value, format); // boolean
DateTime.validateDateFormat(value);             // "yyyy-MM-dd"
DateTime.validateTimeFormat(value);             // "HH:mm"
DateTime.validateTimeZone(zone);                // boolean
```

## Test hooks (static)

Override the clock during tests. **Always reset in `afterEach` / teardown.**

```typescript
DateTime.useFixedNow(timestampSeconds);    // freeze now()
DateTime.useRelativeNow(timestampSeconds); // now() advances from this base
DateTime.resetFixedOrRelativeNow();        // back to real time
```

`useFixedNow` and `useRelativeNow` are mutually exclusive — calling one clears the other.

## Iteration helpers

### `getDaysOfMonth(): Array<DateTime>`

Returns an array covering the current month. The first element is the start of the month at `00:00:00`, the last element is the end of the month at `23:59:59`, and the in-between elements are the start of each day.

## Time-of-day windows

### `isWithinTimeRange(startTimeCode, endTimeCode): boolean`

Checks whether this `DateTime` falls within `[startTimeCode, endTimeCode]` on its own date, in its own zone. Codes are `HHMMSS`. `endTimeCode` must be `>= startTimeCode` (same-day range; overnight windows are not supported by this method).

```typescript
DateTime.now("America/Toronto").isWithinTimeRange("090000", "170000");
```

## Schema

```typescript
export type DateTimeSchema = Schema<DateTime, "value" | "zone">;
```

Used by the constructor and by the `@nivinjoseph/n-util` serializer (type tag `"Ndate"`).
