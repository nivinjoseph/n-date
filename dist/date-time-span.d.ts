import { DateTime } from "./date-time.js";
import { Serializable, Duration, Schema } from "@nivinjoseph/n-util";
export declare class DateTimeSpan extends Serializable<DateTimeSpanSchema> {
    private readonly _start;
    private readonly _end;
    get start(): DateTime;
    get end(): DateTime;
    get duration(): Duration;
    constructor(data: DateTimeSpanSchema);
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
    equals(other: DateTimeSpan | null): boolean;
}
export type DateTimeSpanSchema = Schema<DateTimeSpan, "start" | "end">;
//# sourceMappingURL=date-time-span.d.ts.map