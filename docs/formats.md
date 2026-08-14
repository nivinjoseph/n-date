# Formats

Format tokens follow [Luxon's grammar](https://moment.github.io/luxon/#/formatting?id=table-of-tokens). Source: [src/date-time-format.ts](../src/date-time-format.ts).

## `DateTimeFormat` (enum)

Used by [`DateTime#format`](./date-time.md#formatformat-datetimeformat-string) to truncate to a given precision.

| Member | Token | Example |
| --- | --- | --- |
| `yearMonthDayHourMinuteSecond` | `yyyy-MM-dd HH:mm:ss` | `2026-04-20 15:30:45` |
| `yearMonthDayHourMinute` | `yyyy-MM-dd HH:mm` | `2026-04-20 15:30` |
| `yearMonthDayHour` | `yyyy-MM-dd HH` | `2026-04-20 15` |
| `yearMonthDay` | `yyyy-MM-dd` | `2026-04-20` |
| `yearMonth` | `yyyy-MM` | `2026-04` |
| `year` | `yyyy` | `2026` |

`DateTimeFormat_DEFAULT` is `yearMonthDayHourMinuteSecond` and is also the canonical internal representation.

## `DateTimeFormatExt` (type)

A union of commonly used Luxon format strings, passed to [`DateTime#formatExt`](./date-time.md#formatextformat-datetimeformatext--string-locale-string-string). The type exists to give IntelliSense; `formatExt` also accepts any other Luxon format string.

| Token | Example |
| --- | --- |
| `DD HH:mm:ss` | `Apr 20, 2026 15:30:20` |
| `MMMM d, HH:mm:ss` | `April 20, 15:30:20` |
| `DD HH:mm` | `Apr 20, 2026 15:30` |
| `MMMM d, HH:mm` | `April 20, 15:30` |
| `yyyy/LL/dd` | `2026/04/20` |
| `yyyy/LL/dd HH:mm:ss` | `2026/04/20 15:30:20` |
| `yyyy/LL/dd HH:mm` | `2026/04/20 15:30` |
| `yyyy-MM-dd` | `2026-04-20` |
| `HH:mm:ss` | `15:30:20` |
| `HH:mm` | `15:30` |
| `DDD` | `April 20, 2026` |
| `DD` | `Apr 20, 2026` |
| `yyyy-MM` | `2026-04` |
| `MMMM yyyy` | `April 2026` |
| `DDDD` | `Monday, April 20, 2026` |
| `EEEE DD` | `Monday Apr 20, 2026` |
| `LLL yyyy` | `Apr 2026` |
| `LLLL yyyy` | `April 2026` |
| `MMMM d` | `April 20` |
| `LLL d` | `Apr 20` |

## Validating format strings

```typescript
DateTime.validateDateTimeFormat("2026-04-20 15:30:45"); // true — defaults to yyyy-MM-dd HH:mm:ss
DateTime.validateDateTimeFormat("2026-04-20 15:30", DateTimeFormat.yearMonthDayHourMinute); // true
DateTime.validateDateFormat("2026-04-20");      // true
DateTime.validateTimeFormat("15:30:45");        // true — defaults to HH:mm:ss
DateTime.validateTimeFormat("15:30", "HH:mm");  // true — minute precision on request
DateTime.validateTimeZone("America/Toronto");   // true
```

All of these return `false` (rather than throwing) on empty or malformed input, making them safe to use in form-validation pipelines.

`validateDateFormat` and `validateTimeFormat` default to exactly the formats `DateTime.createFromValues` requires, so anything they accept is guaranteed to construct:

```typescript
if (DateTime.validateDateFormat(d) && DateTime.validateTimeFormat(t))
    DateTime.createFromValues(d, t, zone); // will not throw on the value arguments
```

To validate a whole value/zone pair at once, use `DateTime.tryCreate(value, zone)`, which returns `null` rather than throwing.
