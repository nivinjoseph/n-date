# n-date

An immutable, serializable date/time library for TypeScript with first-class timezone support. It
wraps [Luxon](https://moment.github.io/luxon/) behind a small value type that round-trips cleanly
through JSON.

## Installation

```bash
npm install @nivinjoseph/n-date

# or

yarn add @nivinjoseph/n-date
```

Requires Node.js `>= 24.10`. The package is published as pure ESM.

## Usage

```typescript
import { DateTime, DateTimeSpan, DateTimeFormat } from "@nivinjoseph/n-date";
import { Duration } from "@nivinjoseph/n-util";

const now = DateTime.now("America/New_York");
const later = now.addTime(Duration.fromHours(2));

// comparison
later.isAfter(now);                 // true
now.isSameDay(later);               // same calendar day?

// intervals
const span = new DateTimeSpan({ start: now, end: later });
span.contains(now.addTime(Duration.fromMinutes(30)));   // true
span.duration.toHours();                                // 2

// zones preserve the instant
const tokyo = now.convertToZone("Asia/Tokyo");
tokyo.timestamp === now.timestamp;  // true

// formatting
later.format(DateTimeFormat.yearMonthDay);   // e.g. "2026-04-20"
later.formatExt("DDDD");                     // e.g. "Monday, April 20, 2026"

// serialization
const json = JSON.stringify(now.serialize());
```

## Design

- **Immutable** — every mutating-looking method (`addTime`, `convertToZone`, …) returns a new `DateTime` (`convertToZone` returns the same instance when the zone is unchanged).
- **Explicit timezones** — there is no machine-local zone (`"local"`, `"system"` and `"default"` are all rejected); callers pass an IANA zone, `"utc"`, or a `UTC±HH:MM` offset.
- **Serializable** — `DateTime` and `DateTimeSpan` extend `Serializable` from `@nivinjoseph/n-util`, so they round-trip through JSON with their type tag preserved.
- **Defensive** — inputs are validated with `@nivinjoseph/n-defensive` and invalid values throw at construction time rather than silently producing bad dates. Use `DateTime.tryCreate` when parsing untrusted input.
- **Second precision** — a value is `yyyy-MM-dd HH:mm:ss`; milliseconds are not retained.

## Documentation

Full documentation lives in [docs/](./docs/README.md):

- [Getting Started](./docs/getting-started.md) — installation, concepts, and a quick tour.
- [DateTime](./docs/date-time.md) — the core immutable date/time type.
- [DateTimeSpan](./docs/date-time-span.md) — intervals between two `DateTime` values.
- [Formats](./docs/formats.md) — `DateTimeFormat` and `DateTimeFormatExt` reference.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
