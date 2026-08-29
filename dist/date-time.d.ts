import { DateTime as LuxonDateTime } from "luxon";
import { DomainObject, DomainObjectData } from "@nivinjoseph/n-domain";
import { Duration } from "@nivinjoseph/n-util";
import { DateTimeFormat, DateTimeFormatExt } from "./date-time-format.js";
/**
 * The units accepted by {@link DateTime.startOf} and {@link DateTime.endOf}.
 */
export type DateTimeUnit = "year" | "month" | "day" | "hour" | "minute";
/**
 * An immutable, serializable date and time with explicit timezone support.
 *
 * A `DateTime` is identified by a wall-clock `value` plus a `zone`; together they determine the
 * instant, and they are the only state the constructor accepts. The serialized form additionally
 * carries the derived {@link DateTime.timestamp}, so stored records can be queried on the instant
 * without being deserialized; it is written out but never read back in. Two consequences follow
 * from that representation, and both are guaranteed rather than incidental:
 *
 * - **Second-level precision.** `value` is `"yyyy-MM-dd HH:mm:ss"`, so milliseconds are not
 *   retained. Sub-second components of a {@link Duration} passed to {@link DateTime.addTime}
 *   are truncated, and factories such as {@link DateTime.createFromMilliSecondsSinceEpoch}
 *   drop the millisecond part.
 * - **Canonical wall-clock time.** The instance always reports a wall-clock time that actually
 *   exists in its zone. During a DST spring-forward gap the input is shifted forward to the
 *   real instant and `value` is rewritten to match, so `value`, `dateCode`, `format()` and
 *   `toStringISO()` can never disagree. During a DST fall-back — where one wall-clock time maps
 *   to two instants — the **earlier** offset is always chosen, consistently, so that an instance
 *   is always equal to the result of deserializing its own serialized form. A corollary: an
 *   instant in the **second** pass of a repeated hour cannot be represented — anything that lands
 *   there ({@link DateTime.createFromTimestamp}, {@link DateTime.convertToZone},
 *   {@link DateTime.addTime}, a zone-local {@link DateTime.now}) collapses to the earlier pass,
 *   up to one hour earlier.
 * - **Years 0000–9999.** That is the range the `yyyy` value format can carry; any construction
 *   or arithmetic whose result falls outside it throws.
 *
 * @example
 * ```typescript
 * const now = DateTime.now("UTC");
 * const future = now.addTime(Duration.fromHours(2));
 * const isAfter = future.isAfter(now);
 * ```
 */
export declare class DateTime extends DomainObject<DateTime, "value" | "zone" | "timestamp"> {
    private static readonly _defaultLocale;
    private static readonly _validatedZones;
    private static _fixedNow;
    private static _relativeNow;
    private readonly _value;
    private readonly _zone;
    private readonly _dateTime;
    private readonly _timestamp;
    /**
     * Gets the system's local timezone.
     *
     * @returns The local timezone identifier.
     */
    static get currentZone(): string;
    /**
     * Gets the formatted date and time string in "yyyy-MM-dd HH:mm:ss" format.
     *
     * This is always the canonical wall-clock time for {@link DateTime.zone} — see the class
     * documentation for how DST transitions are resolved.
     */
    get value(): string;
    /**
     * Gets the timezone identifier.
     */
    get zone(): string;
    /**
     * Gets the Unix timestamp in seconds. Note that {@link DateTime.valueOf} returns milliseconds.
     *
     * This is part of the serialized form so that stored records can be sorted, filtered and
     * range-queried on the instant without being deserialized. It is derived from {@link DateTime.value}
     * and {@link DateTime.zone} rather than stored alongside them, so it is not a constructor input —
     * see {@link DateTimeData}.
     */
    get timestamp(): number;
    /**
     * Gets the date code in YYYYMMDD format.
     */
    get dateCode(): string;
    /**
     * Gets the time code in HHMMSS format.
     */
    get timeCode(): string;
    /**
     * Gets the date value in YYYY-MM-DD format.
     */
    get dateValue(): string;
    /**
     * Gets the time value in HH:mm:ss format.
     */
    get timeValue(): string;
    /**
     * Gets the calendar year.
     */
    get year(): number;
    /**
     * Gets the calendar month (1-12).
     */
    get month(): number;
    /**
     * Gets the day of the month (1-31).
     */
    get day(): number;
    /**
     * Gets the hour of the day (0-23).
     */
    get hour(): number;
    /**
     * Gets the minute of the hour (0-59).
     */
    get minute(): number;
    /**
     * Gets the second of the minute (0-59).
     */
    get second(): number;
    /**
     * Gets the day of the week, where 1 is Monday and 7 is Sunday.
     */
    get dayOfWeek(): number;
    /**
     * Gets the day of the year (1-366).
     */
    get dayOfYear(): number;
    /**
     * Gets the number of days in this DateTime's month.
     */
    get daysInMonth(): number;
    /**
     * Gets whether this DateTime falls on a Saturday or Sunday.
     */
    get isWeekend(): boolean;
    /**
     * Gets whether this DateTime's year is a leap year.
     */
    get isLeapYear(): boolean;
    /**
     * Gets whether this DateTime is in the past.
     */
    get isPast(): boolean;
    /**
     * Gets whether this DateTime is in the future.
     */
    get isFuture(): boolean;
    /**
     * Creates a new DateTime instance.
     *
     * The value may be supplied at any precision from year to second — `"2023"`,
     * `"2023-06"`, `"2023-06-11"`, `"2023-06-11 10"`, `"2023-06-11 10:30"` and
     * `"2023-06-11 10:30:45"` are all accepted, with the missing components defaulted.
     * Anything else, including values carrying extra trailing characters, is rejected.
     *
     * `timestamp` is deliberately omitted from the accepted data: it belongs to the serialized
     * form but is derived from `value` and `zone`, so accepting it would invite a stored instant
     * and a stored wall-clock time that disagree. Anything supplied on the hydration path is
     * ignored and recomputed.
     *
     * @param data - The DateTime data containing value and zone.
     * @throws ArgumentException if the value or zone is invalid.
     */
    constructor(data: Omit<DateTimeData, "timestamp">);
    /**
     * Sets a fixed timestamp for testing purposes. All calls to DateTime.now() will return this fixed time.
     *
     * @param timestamp - The Unix timestamp in seconds to use as the fixed "now" time.
     * @throws ArgumentException if timestamp is not a valid number.
     */
    static useFixedNow(timestamp: number): void;
    /**
     * Sets a relative timestamp for testing purposes. DateTime.now() will return times relative to this base timestamp,
     * advancing as real time advances.
     *
     * @param timestamp - The Unix timestamp in seconds to use as the base "now" time.
     * @throws ArgumentException if timestamp is not a valid number.
     */
    static useRelativeNow(timestamp: number): void;
    /**
     * Resets any fixed or relative "now" time set by useFixedNow or useRelativeNow.
     * DateTime.now() will return the actual current time after calling this method.
     */
    static resetFixedOrRelativeNow(): void;
    /**
     * Runs a function with DateTime.now() fixed to the given timestamp, restoring the previous
     * clock state afterwards — including when the function throws.
     *
     * A function returning a Promise (an async function) is fully supported: the clock stays
     * fixed across its awaits and is restored when the promise settles. Note that the fake clock
     * is process-global, so overlapping async withFixedNow calls with different timestamps will
     * see each other's clocks.
     *
     * Prefer this over {@link DateTime.useFixedNow} in tests: the fake clock is process-global
     * state, so leaving it set leaks into every subsequent test.
     *
     * @param timestamp - The Unix timestamp in seconds to use as the fixed "now" time.
     * @param func - The function to run.
     * @returns Whatever func returns.
     */
    static withFixedNow<T>(timestamp: number, func: () => Promise<T>): Promise<T>;
    static withFixedNow<T>(timestamp: number, func: () => T): T;
    /**
     * Creates a DateTime instance for the current time.
     *
     * During a DST fall-back repeated hour, a zone-local now collapses to the earlier offset, so
     * its timestamp can read up to an hour earlier than the true instant; the default UTC now is
     * always exact — see the class documentation.
     *
     * @param zone - The timezone identifier. If not specified, UTC is used.
     * @returns A new DateTime instance representing the current time.
     * @throws ArgumentException if the zone is invalid.
     */
    static now(zone?: string): DateTime;
    /**
     * Creates a DateTime from a Unix timestamp.
     *
     * Fractional seconds are truncated per the precision contract. If the instant falls in the
     * second pass of a DST fall-back repeated hour in the zone, it collapses to the earlier pass
     * (up to one hour earlier) — see the class documentation.
     *
     * @param timestamp - The number of seconds since the Unix epoch.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     * @throws ArgumentException if the timestamp or zone is invalid.
     */
    static createFromTimestamp(timestamp: number, zone: string): DateTime;
    /**
     * Creates a DateTime from milliseconds since the Unix epoch.
     *
     * The millisecond component is dropped — see the class documentation on precision. If the
     * instant falls in the second pass of a DST fall-back repeated hour in the zone, it collapses
     * to the earlier pass (up to one hour earlier).
     *
     * @param milliseconds - The number of milliseconds since the Unix epoch.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     * @throws ArgumentException if the milliseconds or zone is invalid.
     */
    static createFromMilliSecondsSinceEpoch(milliseconds: number, zone: string): DateTime;
    /**
     * Creates a DateTime from an ISO 8601 string.
     *
     * Any offset carried by the string is honoured when resolving the instant; the resulting
     * DateTime is expressed in the supplied zone.
     *
     * @param value - The ISO 8601 string.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     * @throws ArgumentException if the value or zone is invalid.
     */
    static createFromISO(value: string, zone: string): DateTime;
    /**
     * Creates a DateTime from date and time codes.
     *
     * @param dateCode - The date code in YYYYMMDD format.
     * @param timeCode - The time code in HHmmss format.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     * @throws ArgumentException if any argument is invalid.
     */
    static createFromCodes(dateCode: string, timeCode: string, zone: string): DateTime;
    /**
     * Creates a DateTime from date and time values.
     *
     * @param dateValue - The date in YYYY-MM-DD format.
     * @param timeValue - The time in HH:mm:ss format.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     * @throws ArgumentException if any argument is invalid.
     */
    static createFromValues(dateValue: string, timeValue: string, zone: string): DateTime;
    /**
     * Creates a DateTime, returning null instead of throwing when the input is invalid.
     *
     * Use this when parsing untrusted input — values arriving off the wire, from a user, or
     * from storage — where a throw would otherwise have to be caught at every call site.
     *
     * @param value - The date and time value.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance, or null if the value or zone is invalid.
     */
    static tryCreate(value?: string | null, zone?: string | null): DateTime | null;
    /**
     * Returns the earlier of two DateTime instances.
     *
     * @param dateTime1 - The first DateTime instance.
     * @param dateTime2 - The second DateTime instance.
     * @returns The earlier DateTime instance.
     */
    static min(dateTime1: DateTime, dateTime2: DateTime): DateTime;
    /**
     * Returns the later of two DateTime instances.
     *
     * @param dateTime1 - The first DateTime instance.
     * @param dateTime2 - The second DateTime instance.
     * @returns The later DateTime instance.
     */
    static max(dateTime1: DateTime, dateTime2: DateTime): DateTime;
    /**
     * Validates if a string matches the given DateTime format.
     *
     * @param value - The string to validate.
     * @param format - The format to validate against. Defaults to "yyyy-MM-dd HH:mm:ss".
     * @returns True if the string matches the format, false otherwise.
     */
    static validateDateTimeFormat(value: string, format?: DateTimeFormat): boolean;
    /**
     * Validates if a string matches the date format "yyyy-MM-dd" accepted by
     * {@link DateTime.createFromValues}.
     *
     * @param value - The string to validate.
     * @returns True if the string matches the format, false otherwise.
     */
    static validateDateFormat(value: string): boolean;
    /**
     * Validates if a string matches a time format.
     *
     * Defaults to "HH:mm:ss" — the format {@link DateTime.createFromValues} requires — so that a
     * value accepted here is always accepted there. Pass "HH:mm" to validate minute precision.
     *
     * @param value - The string to validate.
     * @param format - The format to validate against. Defaults to "HH:mm:ss".
     * @returns True if the string matches the format, false otherwise.
     */
    static validateTimeFormat(value: string, format?: "HH:mm:ss" | "HH:mm"): boolean;
    /**
     * Validates if a string is a valid timezone.
     *
     * @param zone - The timezone string to validate.
     * @returns True if the timezone is valid, false otherwise.
     */
    static validateTimeZone(zone: string): boolean;
    /**
     * Normalizes a date and time value, defaulting any components coarser than seconds.
     *
     * @param value - The raw value.
     * @returns The value in "yyyy-MM-dd HH:mm:ss" form.
     * @throws ArgumentException if the value cannot be brought into that form.
     * @private
     */
    private static _normalizeValue;
    /**
     * Normalizes a timezone string so that casing and surrounding whitespace do not produce
     * distinct zones.
     *
     * @param zone - The raw timezone string.
     * @returns The normalized timezone string.
     * @private
     */
    private static _normalizeZone;
    /**
     * Normalizes and validates a timezone string in one step.
     *
     * @param zone - The raw timezone string.
     * @returns The normalized timezone string.
     * @throws ArgumentException if the timezone is invalid.
     * @private
     */
    private static _validatedZone;
    /**
     * Validates a normalized timezone string.
     *
     * @param zone - The normalized timezone string.
     * @throws ArgumentException if the timezone is invalid.
     * @private
     */
    private static _validateZone;
    /**
     * Checks that a "utc+HH[:mm]" or "utc-HH[:mm]" zone carries an offset that actually exists.
     *
     * Range is +00:00 to +14:00 and -00:00 to -12:00
     * (https://en.wikipedia.org/wiki/List_of_UTC_offsets).
     *
     * @param zone - The zone string.
     * @param sign - Which of the two forms is being checked.
     * @returns True if the offset is within range.
     * @private
     */
    private static _isValidUtcOffset;
    /**
     * Creates a DateTime from a luxon DateTime.
     *
     * Deliberately routes back through the public constructor rather than adopting the luxon
     * instance directly: the constructor is what guarantees that `value` + `zone` fully determine
     * the instant, which is what makes an instance equal to the result of deserializing its own
     * serialized form.
     *
     * @param dateTime - The luxon DateTime.
     * @param zone - The normalized timezone.
     * @returns A new DateTime instance.
     * @private
     */
    private static _fromLuxon;
    /**
     * Converts an HHmmss time code to the number of seconds since midnight.
     *
     * @param timeCode - The time code.
     * @param argName - The argument name to report in validation failures.
     * @returns The number of seconds since midnight.
     * @throws ArgumentException if the time code is not a real time of day.
     * @private
     */
    private static _timeCodeToSecondsOfDay;
    /**
     * Gets the numeric value of this DateTime.
     *
     * @returns The milliseconds since the Unix epoch.
     */
    valueOf(): number;
    /**
     * Compares this DateTime with another for equality of wall-clock value and zone.
     *
     * Note that this is stricter than {@link DateTime.isSame}, which compares instants: the same
     * instant expressed in two different zones is `isSame` but not `equals`.
     *
     * @param value - The value to compare with. Anything that is not a DateTime — including
     * another domain object type, `null` or `undefined` — compares as not equal rather than
     * throwing.
     * @returns True if the DateTime instances are equal, false otherwise.
     */
    equals(value: DomainObject<object, never> | null | undefined): boolean;
    /**
     * Returns the string representation of this DateTime.
     *
     * @returns The string representation in the format "YYYY-MM-DD HH:mm:ss zone".
     */
    toString(): string;
    /**
     * Returns the date and time string.
     *
     * @returns The string in the format "YYYY-MM-DD HH:mm:ss".
     */
    toStringDateTime(): string;
    /**
     * Returns the ISO string representation.
     *
     * @returns The ISO 8601 string representation.
     */
    toStringISO(): string;
    /**
     * Returns the ISO 8601 date portion.
     *
     * @returns The string in the format "YYYY-MM-DD".
     */
    toISODate(): string;
    /**
     * Converts this DateTime to a native JavaScript Date.
     *
     * @returns A Date representing the same instant.
     */
    toJSDate(): Date;
    /**
     * Returns the underlying luxon DateTime.
     *
     * This is the escape hatch for functionality this wrapper does not expose. The returned
     * object is itself immutable, so it cannot be used to mutate this instance.
     *
     * @returns The underlying luxon DateTime.
     */
    toLuxon(): LuxonDateTime;
    /**
     * Formats this DateTime using one of the standard formats.
     *
     * @param format - The format to use. Defaults to "yyyy-MM-dd HH:mm:ss".
     * @returns The formatted datetime string.
     * @throws ArgumentException if the format is not a DateTimeFormat.
     */
    format(format?: DateTimeFormat): string;
    /**
     * Formats this DateTime using luxon's full formatting capabilities.
     *
     * The locale is pinned to "en-US" by default so that output does not vary with the ambient
     * system locale; pass a locale explicitly to override it.
     *
     * @param format - The format string to use. Can be a predefined DateTimeFormatExt or any custom Luxon format string.
     * @param locale - The locale to format in. Defaults to "en-US".
     * @returns The formatted datetime string.
     *
     * @example
     * ```typescript
     * const dt = new DateTime({ value: "2023-07-02 15:30:20", zone: "America/New_York" });
     * dt.formatExt("DD HH:mm:ss"); // "Jul 2, 2023 15:30:20"
     * dt.formatExt("MMMM d, yyyy"); // "July 2, 2023"
     * dt.formatExt("EEEE DD"); // "Sunday Jul 2, 2023"
     * dt.formatExt("DDDD", "fr"); // "dimanche 2 juillet 2023"
     * ```
     */
    formatExt(format: DateTimeFormatExt | string, locale?: string): string;
    /**
     * Checks if this DateTime represents the same instant as another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if the DateTime instances represent the same instant, false otherwise.
     */
    isSame(value: DateTime): boolean;
    /**
     * Checks if this DateTime is before another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if this DateTime is before the other, false otherwise.
     */
    isBefore(value: DateTime): boolean;
    /**
     * Checks if this DateTime is the same or before another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if this DateTime is the same or before the other, false otherwise.
     */
    isSameOrBefore(value: DateTime): boolean;
    /**
     * Checks if this DateTime is after another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if this DateTime is after the other, false otherwise.
     */
    isAfter(value: DateTime): boolean;
    /**
     * Checks if this DateTime is the same or after another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if this DateTime is the same or after the other, false otherwise.
     */
    isSameOrAfter(value: DateTime): boolean;
    /**
     * Checks if this DateTime is between two others, inclusive of both bounds.
     *
     * @param start - The start DateTime.
     * @param end - The end DateTime.
     * @returns True if this DateTime is between start and end, false otherwise.
     * @throws ArgumentException if end is before start.
     */
    isBetween(start: DateTime, end: DateTime): boolean;
    /**
     * Calculates the elapsed time between this DateTime and another.
     *
     * @param value - The DateTime to compare with.
     * @returns A Duration representing the absolute time difference.
     */
    timeDiff(value: DateTime): Duration;
    /**
     * Calculates the number of calendar days between this DateTime and another.
     *
     * This counts calendar-day boundaries, not elapsed 24-hour periods — so "2023-06-11 23:00"
     * and "2023-06-13 01:00" are 2 days apart, not 1.
     *
     * Each DateTime's calendar date is taken as written in its own zone, so two instances that
     * read as the same date in their respective zones are 0 days apart regardless of how far
     * apart the underlying instants are. Use {@link DateTime.timeDiff} when you want elapsed time.
     *
     * @param value - The DateTime to compare with.
     * @returns The absolute number of calendar days difference.
     */
    daysDiff(value: DateTime): number;
    /**
     * Checks if this DateTime falls on the same calendar day as another.
     *
     * The calendar date is taken as written in each instance's own zone, so "2024-01-01 10:00" in
     * America/Los_Angeles and "2024-01-01 10:00" in UTC+5:30 are the same day even though they are
     * 13.5 hours apart as instants. Convert to a common zone first if you need instant-based
     * semantics: `a.isSameDay(b.convertToZone(a.zone))`.
     *
     * @param value - The DateTime to compare with.
     * @returns True if both fall on the same calendar day, false otherwise.
     */
    isSameDay(value: DateTime): boolean;
    /**
     * Adds a duration to this DateTime. This shifts by absolute elapsed time, so it accounts for
     * DST transitions. Sub-second components are truncated.
     *
     * If the result lands in a DST fall-back repeated hour it collapses to the earlier offset, so
     * the actual elapsed difference can differ from the duration by up to an hour — see the class
     * documentation.
     *
     * @param time - The duration to add.
     * @returns A new DateTime instance with the duration added.
     */
    addTime(time: Duration): DateTime;
    /**
     * Subtracts a duration from this DateTime. This shifts by absolute elapsed time, so it
     * accounts for DST transitions. Sub-second components are truncated.
     *
     * If the result lands in a DST fall-back repeated hour it collapses to the earlier offset, so
     * the actual elapsed difference can differ from the duration by up to an hour — see the class
     * documentation.
     *
     * @param time - The duration to subtract.
     * @returns A new DateTime instance with the duration subtracted.
     */
    subtractTime(time: Duration): DateTime;
    /**
     * Adds calendar days to this DateTime, preserving the wall-clock time across DST transitions.
     *
     * @param days - The number of days to add. May be negative.
     * @returns A new DateTime instance with the days added.
     * @throws ArgumentException if days is not an integer.
     */
    addDays(days: number): DateTime;
    /**
     * Subtracts calendar days from this DateTime, preserving the wall-clock time across DST
     * transitions.
     *
     * @param days - The number of days to subtract. May be negative.
     * @returns A new DateTime instance with the days subtracted.
     * @throws ArgumentException if days is not an integer.
     */
    subtractDays(days: number): DateTime;
    /**
     * Adds calendar months to this DateTime, clamping the day to the end of the target month.
     *
     * @param months - The number of months to add. May be negative.
     * @returns A new DateTime instance with the months added.
     * @throws ArgumentException if months is not an integer.
     */
    addMonths(months: number): DateTime;
    /**
     * Subtracts calendar months from this DateTime, clamping the day to the end of the target month.
     *
     * @param months - The number of months to subtract. May be negative.
     * @returns A new DateTime instance with the months subtracted.
     * @throws ArgumentException if months is not an integer.
     */
    subtractMonths(months: number): DateTime;
    /**
     * Adds calendar years to this DateTime, clamping Feb 29 to Feb 28 in non-leap years.
     *
     * @param years - The number of years to add. May be negative.
     * @returns A new DateTime instance with the years added.
     * @throws ArgumentException if years is not an integer.
     */
    addYears(years: number): DateTime;
    /**
     * Subtracts calendar years from this DateTime, clamping Feb 29 to Feb 28 in non-leap years.
     *
     * @param years - The number of years to subtract. May be negative.
     * @returns A new DateTime instance with the years subtracted.
     * @throws ArgumentException if years is not an integer.
     */
    subtractYears(years: number): DateTime;
    /**
     * Returns the start of the given unit.
     *
     * @param unit - The unit to truncate to.
     * @returns A new DateTime at the start of that unit.
     * @throws ArgumentException if the unit is not a DateTimeUnit.
     */
    startOf(unit: DateTimeUnit): DateTime;
    /**
     * Returns the end of the given unit.
     *
     * Because values carry second precision, this is the final whole second of the unit — the end
     * of a day is 23:59:59, not 23:59:59.999.
     *
     * @param unit - The unit to extend to.
     * @returns A new DateTime at the end of that unit.
     * @throws ArgumentException if the unit is not a DateTimeUnit.
     */
    endOf(unit: DateTimeUnit): DateTime;
    /**
     * Gets an array of DateTime instances, one per day of this DateTime's month.
     *
     * Every element is the first instant of its calendar day — normally `00:00:00`, but on a day
     * where midnight does not exist in this zone because a DST transition happens at midnight, it
     * is the first instant that does exist (e.g. `01:00:00`). There is no special case at either
     * end of the array.
     *
     * @returns An array with one element per day of the month, each at the start of its day
     * (e.g. "2023-06-01 00:00:00", "2023-06-02 00:00:00", … "2023-06-30 00:00:00").
     *
     * @example
     * ```typescript
     * // the bounds of the month come from startOf/endOf, not from this array
     * new DateTimeSpan({ start: dt.startOf("month"), end: dt.endOf("month") });
     * ```
     */
    getDaysOfMonth(): Array<DateTime>;
    /**
     * Converts this DateTime to a different timezone, preserving the instant — except when the
     * instant falls in the second pass of a DST fall-back repeated hour in the target zone, in
     * which case it collapses to the earlier pass (up to one hour earlier) — see the class
     * documentation.
     *
     * @param zone - The target timezone.
     * @returns A new DateTime instance in the specified timezone, or this instance if the zone is unchanged.
     * @throws ArgumentException if the timezone is invalid.
     */
    convertToZone(zone: string): DateTime;
    /**
     * Checks if this DateTime's local time of day falls within a time range, inclusive of both bounds.
     *
     * Ranges that wrap midnight are supported: when endTimeCode is earlier than startTimeCode the
     * range is treated as running through midnight, so "220000" to "020000" matches 23:00 and 01:00
     * but not 12:00.
     *
     * @param startTimeCode - The start time code in HHmmss format.
     * @param endTimeCode - The end time code in HHmmss format.
     * @returns True if this DateTime's time of day is within the range, false otherwise.
     * @throws ArgumentException if either time code is not a real time of day.
     */
    isWithinTimeRange(startTimeCode: string, endTimeCode: string): boolean;
}
/**
 * The full data shape of a {@link DateTime} — its `value`, `zone` and `timestamp`, matching what
 * {@link DateTime.serialize} emits (minus the `$typename` tag).
 *
 * The constructor takes this type **minus `timestamp`**, which is derived from `value` and `zone`
 * rather than supplied: `new DateTime({ value, zone })`.
 */
export type DateTimeData = DomainObjectData<DateTime>;
//# sourceMappingURL=date-time.d.ts.map