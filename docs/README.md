# n-date Documentation

`@nivinjoseph/n-date` is a TypeScript library for robust date and time handling with first-class timezone support. It wraps [Luxon](https://moment.github.io/luxon/) behind an immutable, serializable API.

## Contents

- [Getting Started](./getting-started.md) — installation, concepts, and a quick tour.
- [DateTime](./date-time.md) — the core immutable date/time type.
- [DateTimeSpan](./date-time-span.md) — intervals between two `DateTime` values.
- [Formats](./formats.md) — `DateTimeFormat` and `DateTimeFormatExt` reference.

## At a glance

```typescript
import { DateTime, DateTimeSpan, DateTimeFormat } from "@nivinjoseph/n-date";
import { Duration } from "@nivinjoseph/n-util";

const now = DateTime.now("America/New_York");
const later = now.addTime(Duration.fromHours(2));

const span = new DateTimeSpan({ start: now, end: later });
span.contains(now.addTime(Duration.fromMinutes(30))); // true

later.format(DateTimeFormat.yearMonthDay);   // "2026-04-20"
later.formatExt("DDDD");                      // "Monday, April 20, 2026"
```

## Design principles

- **Immutable** — every mutating-looking method (`addTime`, `convertToZone`, …) returns a new `DateTime`.
- **Explicit timezones** — there is no "local" zone; callers pass an IANA zone or `"utc"`.
- **Serializable** — `DateTime` and `DateTimeSpan` extend `Serializable` from `@nivinjoseph/n-util`, so they round-trip through JSON with their type tag preserved.
- **Defensive** — inputs are validated with `@nivinjoseph/n-defensive`; invalid values throw at construction time rather than silently producing bad dates.
