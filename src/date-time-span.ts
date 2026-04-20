import { given } from "@nivinjoseph/n-defensive";
import { DateTime } from "./date-time.js";
import { Serializable, serialize, Duration, Schema } from "@nivinjoseph/n-util";


@serialize("Ndate")
export class DateTimeSpan extends Serializable<DateTimeSpanSchema>
{
    private readonly _start: DateTime;
    private readonly _end: DateTime;


    @serialize
    public get start(): DateTime { return this._start; }

    @serialize
    public get end(): DateTime { return this._end; }

    public get duration(): Duration { return this._end.timeDiff(this._start); }


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
        given(dateTime, "dateTime").ensureHasValue().ensureIsObject();

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
        return this._start.isSameOrBefore(other._start) && this._end.isSameOrAfter(other._end);
    }

    /**
    Checks if two DateTimeSpans have any intersection or overlap.

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
        // if start and end of self is contained in other
        // or other encompasses self
        // or self encompasses other

        if (this.encompasses(other) || other.encompasses(this)) 
            return true;

        return other.contains(this._start) || other.contains(this._end);
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