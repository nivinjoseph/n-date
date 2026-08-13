import { given } from "@nivinjoseph/n-defensive";
import { DateTime } from "./date-time.js";
import { Serializable, serialize, Duration, Schema } from "@nivinjoseph/n-util";


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
@serialize("Ndate")
export class DateTimeSpan extends Serializable<DateTimeSpanSchema>
{
    private readonly _start: DateTime;
    private readonly _end: DateTime;
    private _duration: Duration | null = null;


    @serialize
    public get start(): DateTime { return this._start; }

    @serialize
    public get end(): DateTime { return this._end; }

    /**
     * Gets the elapsed time between start and end. Computed once and cached.
     */
    public get duration(): Duration
    {
        return this._duration ??= this._end.timeDiff(this._start);
    }


    public constructor(data: DateTimeSpanSchema)
    {
        super(data);

        const { start, end } = data;

        given(start, "start").ensureHasValue().ensureIsType(DateTime);
        this._start = start;

        given(end, "end").ensureHasValue().ensureIsType(DateTime)
            .ensure(t => t.isSameOrAfter(start), "must be same or after start");
        this._end = end;
    }


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
    public contains(dateTime: DateTime): boolean
    {
        given(dateTime, "dateTime").ensureHasValue().ensureIsType(DateTime);

        return dateTime.isBetween(this._start, this._end);
    }

    /**
    Checks if this DateTimeSpan completely encompasses another DateTimeSpan.

    Use cases:

        this: start ─────────────────────── end
        other:      start ─── end

    Returns:

        boolean: True if this span completely contains the other span.
    */
    public encompasses(other: DateTimeSpan): boolean
    {
        given(other, "other").ensureHasValue().ensureIsType(DateTimeSpan);

        return this._start.isSameOrBefore(other._start) && this._end.isSameOrAfter(other._end);
    }

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
    public infringes(other: DateTimeSpan): boolean
    {
        given(other, "other").ensureHasValue().ensureIsType(DateTimeSpan);

        // if start and end of self is contained in other
        // or other encompasses self
        // or self encompasses other

        if (this.encompasses(other) || other.encompasses(this))
            return true;

        return other.contains(this._start) || other.contains(this._end);
    }

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
    public overlap(other: DateTimeSpan): DateTimeSpan | null
    {
        given(other, "other").ensureHasValue().ensureIsType(DateTimeSpan);

        if (!this.infringes(other))
            return null;

        return new DateTimeSpan({
            start: DateTime.max(this._start, other._start),
            end: DateTime.min(this._end, other._end)
        });
    }

    public equals(other: DateTimeSpan | null): boolean
    {
        given(other, "other").ensureIsType(DateTimeSpan);

        if (other == null)
            return false;

        if (other === this)
            return true;

        return this._start.equals(other._start) && this._end.equals(other._end);
    }
}


export type DateTimeSpanSchema = Schema<DateTimeSpan, "start" | "end">;
