import { DomainObject, DomainObjectData } from "@nivinjoseph/n-domain";
import { DateTime } from "./date-time.js";
import { Duration } from "@nivinjoseph/n-util";
/**
 * An immutable, serializable closed interval `[start, end]` between two {@link DateTime} values.
 *
 * The interval is **closed** — both bounds are inclusive. Two spans that merely touch at an
 * endpoint therefore count as overlapping: `[10:00, 11:00]` and `[11:00, 12:00]` both
 * {@link DateTimeSpan.infringes} and {@link DateTimeSpan.overlap} each other at the single instant
 * 11:00. If you are scheduling back-to-back intervals and want them to be treated as disjoint, use
 * half-open comparisons at the call site (`a.end.isSameOrBefore(b.start)`).
 *
 * `start` and `end` may be in different zones; every comparison is made on instants, so a span is
 * well defined either way.
 */
export declare class DateTimeSpan extends DomainObject<DateTimeSpan, "start" | "end"> {
    private readonly _start;
    private readonly _end;
    private _duration;
    get start(): DateTime;
    get end(): DateTime;
    /**
     * Gets the elapsed time between start and end. Computed once and cached.
     */
    get duration(): Duration;
    constructor(data: DateTimeSpanData);
    /**
    Checks if the given DateTime is within this DateTimeSpan (inclusive of start and end).

    Use cases:

        this: start ─────────────── end
                    ↑
                    dateTime

    Args:

        dateTime (DateTime): The DateTime to check.

    Returns:

        boolean: True if dateTime is within the span [start, end], false otherwise.
    */
    contains(dateTime: DateTime): boolean;
    /**
    Checks if this DateTimeSpan completely encompasses another DateTimeSpan.

    Use cases:

        this: start ─────────────────────── end
        other:      start ─── end

    Returns:

        boolean: True if this span completely contains the other span.
    */
    encompasses(other: DateTimeSpan): boolean;
    /**
    Checks if two DateTimeSpans have any intersection or overlap.

    Because the interval is closed, spans that merely touch at an endpoint count as infringing.

    Use cases:

        This encompasses other:
        this: start ─────────────────────── end
        other:      start ─── end

        Other encompasses this:
        this:       start ─── end
        other: start ─────────────────────── end

        Partial overlap - this starts in other:
        this:           start ─────── end
        other: start ─────── end

        Partial overlap - this ends in other:
        this:  start ─────── end
        other:       start ─────── end

    Returns:

        boolean: True if spans overlap or intersect, false if completely separate.
    */
    infringes(other: DateTimeSpan): boolean;
    /**
    Returns the intersection of this DateTimeSpan and another, or null if they are disjoint.

    Because the interval is closed, spans that merely touch at an endpoint intersect in a
    zero-length span at that instant rather than returning null.

    Use cases:

        this:   start ─────── end
        other:        start ─────── end
        result:       start ─ end

    Args:

        other (DateTimeSpan): The span to intersect with.

    Returns:

        DateTimeSpan | null: The overlapping span, or null if there is no overlap.
    */
    overlap(other: DateTimeSpan): DateTimeSpan | null;
    /**
     * Compares this DateTimeSpan with another for equality of both bounds (value **and** zone).
     *
     * @param other - The value to compare with. Anything that is not a DateTimeSpan — including
     * another domain object type, `null` or `undefined` — compares as not equal rather than
     * throwing.
     * @returns True if both spans have equal start and end, false otherwise.
     */
    equals(other: DomainObject<object, never> | null | undefined): boolean;
}
/**
 * Constructor data type for {@link DateTimeSpan} — its `start` and `end`.
 */
export type DateTimeSpanData = DomainObjectData<DateTimeSpan>;
//# sourceMappingURL=date-time-span.d.ts.map