# DateTimeSpan

A closed interval `[start, end]` between two `DateTime` values. Source: [src/date-time-span.ts](../src/date-time-span.ts).

The interval is **closed** — both bounds are inclusive — so two spans that merely touch at an endpoint count as overlapping. `[10:00, 11:00]` and `[11:00, 12:00]` both `infringes` and `overlap` each other at the single instant 11:00. If you are scheduling back-to-back intervals and want them treated as disjoint, compare half-open at the call site: `a.end.isSameOrBefore(b.start)`.

`start` and `end` may be in different zones; every comparison is made on instants, so a span is well defined either way.

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

### `overlap(other: DateTimeSpan): DateTimeSpan | null`

The intersection of the two spans, or `null` when they are disjoint. Because the interval is closed, spans that only touch at an endpoint intersect in a zero-length span at that instant rather than returning `null`.

```
this:   start ─────── end
other:        start ─────── end
result:       start ─ end
```

```typescript
const shared = a.overlap(b);
if (shared != null)
    console.log(shared.duration.toMinutes());
```

### `equals(other: DateTimeSpan | null): boolean`

Structural equality — both `start` and `end` must `equals` their counterparts (value **and** zone).

## Serialization

`DateTimeSpan` extends `Serializable` and is registered in the `"Ndate"` namespace, serializing with the type tag `"Ndate.DateTimeSpan"` (`DateTime` uses `"Ndate.DateTime"`). It round-trips through `@nivinjoseph/n-util`'s serializer, nested `DateTime` values included.

```typescript
export type DateTimeSpanSchema = Schema<DateTimeSpan, "start" | "end">;
```
