# DateTimeSpan

A closed interval `[start, end]` between two `DateTime` values. Source: [src/date-time-span.ts](../src/date-time-span.ts).

```typescript
import { DateTimeSpan, DateTimeSpanSchema } from "@nivinjoseph/n-date";
```

## Construction

```typescript
type DateTimeSpanSchema = { start: DateTime; end: DateTime; };

const span = new DateTimeSpan({ start, end });
```

Throws if `end.isBefore(start)`. A zero-length span (`start === end`) is allowed.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `start` | `DateTime` | Inclusive lower bound. |
| `end` | `DateTime` | Inclusive upper bound. |
| `duration` | `Duration` | `end.timeDiff(start)` (from `@nivinjoseph/n-util`). |

## Methods

### `contains(dateTime: DateTime): boolean`

True if `dateTime` falls within `[start, end]` (inclusive on both ends).

```
this:  start ─────────────── end
                  ↑
               dateTime
```

### `encompasses(other: DateTimeSpan): boolean`

True if this span fully contains `other` — i.e. `this.start <= other.start` **and** `this.end >= other.end`.

```
this:  start ─────────────────────── end
other:       start ─── end
```

### `infringes(other: DateTimeSpan): boolean`

True if the two spans overlap in any way — mutual containment, or partial overlap at either end. Returns false only when the spans are completely disjoint.

```
partial overlap — this starts inside other:
this:           start ─────── end
other:  start ─────── end

partial overlap — this ends inside other:
this:   start ─────── end
other:        start ─────── end
```

### `equals(other: DateTimeSpan | null): boolean`

Structural equality — both `start` and `end` must `equals` their counterparts (value **and** zone).

## Serialization

`DateTimeSpan` extends `Serializable` and is registered under the same `"Ndate"` type tag as `DateTime`. It round-trips through `@nivinjoseph/n-util`'s serializer.

```typescript
export type DateTimeSpanSchema = Schema<DateTimeSpan, "start" | "end">;
```
