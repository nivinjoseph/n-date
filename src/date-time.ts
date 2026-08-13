import { given } from "@nivinjoseph/n-defensive";
import { DateTime as LuxonDateTime, Interval as LuxonInterval } from "luxon";
import { Serializable, serialize, Duration, Schema, TypeHelper } from "@nivinjoseph/n-util";
import { DateTimeFormat, DateTimeFormat_DEFAULT, DateTimeFormatExt } from "./date-time-format.js";

/**
 * The units accepted by {@link DateTime.startOf} and {@link DateTime.endOf}.
 */
export type DateTimeUnit = "year" | "month" | "day" | "hour" | "minute";

/**
 * An immutable, serializable date and time with explicit timezone support.
 *
 * A `DateTime` is identified by a wall-clock `value` plus a `zone`; together they are its
 * complete serialized form. Two consequences follow from that representation, and both are
 * guaranteed rather than incidental:
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
 *   is always equal to the result of deserializing its own serialized form.
 *
 * @example
 * ```typescript
 * const now = DateTime.now("UTC");
 * const future = now.addTime(Duration.fromHours(2));
 * const isAfter = future.isAfter(now);
 * ```
 */
@serialize("Ndate")
export class DateTime extends Serializable<DateTimeSchema>
{
    private static readonly _defaultLocale = "en-US";
    // Zone validity cannot change at runtime, and resolving a zone through luxon is by far the most
    // expensive part of constructing a non-utc DateTime, so successful lookups are memoized.
    private static readonly _validatedZones = new Set<string>(["utc"]);

    private static _fixedNow: number | null = null;
    private static _relativeNow: { baseTimestamp: number; baseRealTime: number; } | null = null;

    private readonly _value: string;
    private readonly _zone: string;
    private readonly _dateTime: LuxonDateTime;
    private readonly _timestamp: number;


    /**
     * Gets the system's local timezone.
     *
     * @returns The local timezone identifier.
     */
    public static get currentZone(): string { return LuxonDateTime.local().zoneName; }

    /**
     * Gets the formatted date and time string in "yyyy-MM-dd HH:mm:ss" format.
     *
     * This is always the canonical wall-clock time for {@link DateTime.zone} — see the class
     * documentation for how DST transitions are resolved.
     */
    @serialize
    public get value(): string { return this._value; }

    /**
     * Gets the timezone identifier.
     */
    @serialize
    public get zone(): string { return this._zone; }

    /**
     * Gets the Unix timestamp in seconds. Note that {@link DateTime.valueOf} returns milliseconds.
     */
    public get timestamp(): number { return this._timestamp; }

    /**
     * Gets the date code in YYYYMMDD format.
     */
    public get dateCode(): string { return `${this._value.slice(0, 4)}${this._value.slice(5, 7)}${this._value.slice(8, 10)}`; }

    /**
     * Gets the time code in HHMMSS format.
     */
    public get timeCode(): string { return `${this._value.slice(11, 13)}${this._value.slice(14, 16)}${this._value.slice(17, 19)}`; }

    /**
     * Gets the date value in YYYY-MM-DD format.
     */
    public get dateValue(): string { return this._value.slice(0, 10); }

    /**
     * Gets the time value in HH:mm:ss format.
     */
    public get timeValue(): string { return this._value.slice(11, 19); }

    /**
     * Gets the calendar year.
     */
    public get year(): number { return this._dateTime.year; }

    /**
     * Gets the calendar month (1-12).
     */
    public get month(): number { return this._dateTime.month; }

    /**
     * Gets the day of the month (1-31).
     */
    public get day(): number { return this._dateTime.day; }

    /**
     * Gets the hour of the day (0-23).
     */
    public get hour(): number { return this._dateTime.hour; }

    /**
     * Gets the minute of the hour (0-59).
     */
    public get minute(): number { return this._dateTime.minute; }

    /**
     * Gets the second of the minute (0-59).
     */
    public get second(): number { return this._dateTime.second; }

    /**
     * Gets the day of the week, where 1 is Monday and 7 is Sunday.
     */
    public get dayOfWeek(): number { return this._dateTime.weekday; }

    /**
     * Gets the day of the year (1-366).
     */
    public get dayOfYear(): number { return this._dateTime.ordinal; }

    /**
     * Gets the number of days in this DateTime's month.
     */
    public get daysInMonth(): number { return this._dateTime.daysInMonth!; }

    /**
     * Gets whether this DateTime falls on a Saturday or Sunday.
     */
    public get isWeekend(): boolean { return this._dateTime.weekday >= 6; }

    /**
     * Gets whether this DateTime's year is a leap year.
     */
    public get isLeapYear(): boolean { return this._dateTime.isInLeapYear; }

    /**
     * Gets whether this DateTime is in the past.
     */
    public get isPast(): boolean { return this.isBefore(DateTime.now()); }

    /**
     * Gets whether this DateTime is in the future.
     */
    public get isFuture(): boolean { return this.isAfter(DateTime.now()); }

    /**
     * Creates a new DateTime instance.
     *
     * The value may be supplied at any precision from year to second — `"2023"`,
     * `"2023-06"`, `"2023-06-11"`, `"2023-06-11 10"`, `"2023-06-11 10:30"` and
     * `"2023-06-11 10:30:45"` are all accepted, with the missing components defaulted.
     * Anything else, including values carrying extra trailing characters, is rejected.
     *
     * @param data - The DateTime data containing value and zone.
     * @throws ArgumentException if the value or zone is invalid.
     */
    public constructor(data: DateTimeSchema)
    {
        super(data);

        const { value, zone } = data;

        given(value, "value").ensureHasValue().ensureIsString();
        const normalizedValue = DateTime._normalizeValue(value);

        given(zone, "zone").ensureHasValue().ensureIsString();
        const normalizedZone = DateTime._normalizeZone(zone);
        DateTime._validateZone(normalizedZone);

        const dateTime = LuxonDateTime.fromFormat(
            normalizedValue,
            DateTimeFormat_DEFAULT,
            { zone: normalizedZone }
        );
        given(data, "data")
            .ensure(
                _ => dateTime.isValid,
                `value and zone is invalid (${dateTime.invalidReason}: ${dateTime.invalidExplanation})`
            );

        this._dateTime = dateTime;
        this._zone = normalizedZone;
        // Canonicalize: derive the wall-clock string from the parsed instant rather than from the
        // input, so that a DST-gap time can never leave the string state and the instant disagreeing.
        this._value = dateTime.toFormat(DateTimeFormat_DEFAULT);
        this._timestamp = dateTime.toUnixInteger();
    }

    /**
     * Sets a fixed timestamp for testing purposes. All calls to DateTime.now() will return this fixed time.
     *
     * @param timestamp - The Unix timestamp in seconds to use as the fixed "now" time.
     * @throws ArgumentException if timestamp is not a valid number.
     */
    public static useFixedNow(timestamp: number): void
    {
        given(timestamp, "timestamp").ensureHasValue().ensureIsNumber();

        DateTime._fixedNow = timestamp;
        DateTime._relativeNow = null;
    }

    /**
     * Sets a relative timestamp for testing purposes. DateTime.now() will return times relative to this base timestamp,
     * advancing as real time advances.
     *
     * @param timestamp - The Unix timestamp in seconds to use as the base "now" time.
     * @throws ArgumentException if timestamp is not a valid number.
     */
    public static useRelativeNow(timestamp: number): void
    {
        given(timestamp, "timestamp").ensureHasValue().ensureIsNumber();

        DateTime._relativeNow = {
            baseTimestamp: timestamp,
            baseRealTime: Date.now()
        };
        DateTime._fixedNow = null;
    }

    /**
     * Resets any fixed or relative "now" time set by useFixedNow or useRelativeNow.
     * DateTime.now() will return the actual current time after calling this method.
     */
    public static resetFixedOrRelativeNow(): void
    {
        DateTime._fixedNow = null;
        DateTime._relativeNow = null;
    }

    /**
     * Runs a function with DateTime.now() fixed to the given timestamp, restoring the previous
     * clock state afterwards — including when the function throws.
     *
     * Prefer this over {@link DateTime.useFixedNow} in tests: the fake clock is process-global
     * state, so leaving it set leaks into every subsequent test.
     *
     * @param timestamp - The Unix timestamp in seconds to use as the fixed "now" time.
     * @param func - The function to run.
     * @returns Whatever func returns.
     */
    public static withFixedNow<T>(timestamp: number, func: () => T): T
    {
        given(timestamp, "timestamp").ensureHasValue().ensureIsNumber();
        given(func, "func").ensureHasValue().ensureIsFunction();

        const previousFixed = DateTime._fixedNow;
        const previousRelative = DateTime._relativeNow;

        DateTime.useFixedNow(timestamp);

        try
        {
            return func();
        }
        finally
        {
            DateTime._fixedNow = previousFixed;
            DateTime._relativeNow = previousRelative;
        }
    }


    /**
     * Creates a DateTime instance for the current time.
     *
     * @param zone - The timezone identifier. If not specified, UTC is used.
     * @returns A new DateTime instance representing the current time.
     * @throws ArgumentException if the zone is invalid.
     */
    public static now(zone?: string): DateTime
    {
        given(zone, "zone").ensureIsString();

        const targetZone = zone == null ? "utc" : DateTime._validatedZone(zone);

        // Check if we're using fixed or relative now for testing
        let timestamp: number | null = null;
        if (DateTime._fixedNow !== null)
        {
            timestamp = DateTime._fixedNow;
        }
        else if (DateTime._relativeNow !== null)
        {
            const elapsedMs = Date.now() - DateTime._relativeNow.baseRealTime;
            timestamp = DateTime._relativeNow.baseTimestamp + Math.floor(elapsedMs / 1000);
        }

        if (timestamp !== null)
            return DateTime.createFromTimestamp(timestamp, targetZone);

        return DateTime._fromLuxon(LuxonDateTime.now().setZone(targetZone), targetZone);
    }

    /**
     * Creates a DateTime from a Unix timestamp.
     *
     * @param timestamp - The number of seconds since the Unix epoch.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     * @throws ArgumentException if the timestamp or zone is invalid.
     */
    public static createFromTimestamp(timestamp: number, zone: string): DateTime
    {
        given(timestamp, "timestamp").ensureHasValue().ensureIsNumber();
        given(zone, "zone").ensureHasValue().ensureIsString();

        const validatedZone = DateTime._validatedZone(zone);

        return DateTime._fromLuxon(
            LuxonDateTime.fromSeconds(timestamp).setZone(validatedZone),
            validatedZone
        );
    }

    /**
     * Creates a DateTime from milliseconds since the Unix epoch.
     *
     * The millisecond component is dropped — see the class documentation on precision.
     *
     * @param milliseconds - The number of milliseconds since the Unix epoch.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     * @throws ArgumentException if the milliseconds or zone is invalid.
     */
    public static createFromMilliSecondsSinceEpoch(milliseconds: number, zone: string): DateTime
    {
        given(milliseconds, "milliseconds").ensureHasValue().ensureIsNumber();
        given(zone, "zone").ensureHasValue().ensureIsString();

        const validatedZone = DateTime._validatedZone(zone);

        return DateTime._fromLuxon(
            LuxonDateTime.fromMillis(milliseconds).setZone(validatedZone),
            validatedZone
        );
    }

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
    public static createFromISO(value: string, zone: string): DateTime
    {
        given(value, "value").ensureHasValue().ensureIsString();
        given(zone, "zone").ensureHasValue().ensureIsString();

        const validatedZone = DateTime._validatedZone(zone);

        const dateTime = LuxonDateTime.fromISO(value.trim(), { zone: validatedZone, setZone: false });
        given(value, "value").ensure(_ => dateTime.isValid, "Invalid ISO format");

        return DateTime._fromLuxon(dateTime, validatedZone);
    }

    /**
     * Creates a DateTime from date and time codes.
     *
     * @param dateCode - The date code in YYYYMMDD format.
     * @param timeCode - The time code in HHmmss format.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     * @throws ArgumentException if any argument is invalid.
     */
    public static createFromCodes(dateCode: string, timeCode: string, zone: string): DateTime
    {
        given(dateCode, "dateCode").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("########"), "must be in YYYYMMDD format");

        given(timeCode, "timeCode").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("######"), "must be in HHmmss format");

        given(zone, "zone").ensureHasValue().ensureIsString();

        const dateValue = `${dateCode.slice(0, 4)}-${dateCode.slice(4, 6)}-${dateCode.slice(6, 8)}`;
        const timeValue = `${timeCode.slice(0, 2)}:${timeCode.slice(2, 4)}:${timeCode.slice(4, 6)}`;

        return new DateTime({
            value: `${dateValue} ${timeValue}`,
            zone
        });
    }

    /**
     * Creates a DateTime from date and time values.
     *
     * @param dateValue - The date in YYYY-MM-DD format.
     * @param timeValue - The time in HH:mm:ss format.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     * @throws ArgumentException if any argument is invalid.
     */
    public static createFromValues(dateValue: string, timeValue: string, zone: string): DateTime
    {
        given(dateValue, "dateValue").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("####-##-##"), "must be in YYYY-MM-DD format");

        given(timeValue, "timeValue").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("##:##:##"), "must be in HH:mm:ss format");

        given(zone, "zone").ensureHasValue().ensureIsString();

        return new DateTime({
            value: `${dateValue} ${timeValue}`,
            zone
        });
    }

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
    public static tryCreate(value?: string | null, zone?: string | null): DateTime | null
    {
        if (value == null || zone == null)
            return null;

        try
        {
            return new DateTime({ value, zone });
        }
        catch
        {
            return null;
        }
    }

    /**
     * Returns the earlier of two DateTime instances.
     *
     * @param dateTime1 - The first DateTime instance.
     * @param dateTime2 - The second DateTime instance.
     * @returns The earlier DateTime instance.
     */
    public static min(dateTime1: DateTime, dateTime2: DateTime): DateTime
    {
        given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
        given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime);

        if (dateTime1.valueOf() < dateTime2.valueOf())
            return dateTime1;

        return dateTime2;
    }

    /**
     * Returns the later of two DateTime instances.
     *
     * @param dateTime1 - The first DateTime instance.
     * @param dateTime2 - The second DateTime instance.
     * @returns The later DateTime instance.
     */
    public static max(dateTime1: DateTime, dateTime2: DateTime): DateTime
    {
        given(dateTime1, "dateTime1").ensureHasValue().ensureIsType(DateTime);
        given(dateTime2, "dateTime2").ensureHasValue().ensureIsType(DateTime);

        if (dateTime1.valueOf() > dateTime2.valueOf())
            return dateTime1;

        return dateTime2;
    }

    /**
     * Validates if a string matches the given DateTime format.
     *
     * @param value - The string to validate.
     * @param format - The format to validate against. Defaults to "yyyy-MM-dd HH:mm:ss".
     * @returns True if the string matches the format, false otherwise.
     */
    public static validateDateTimeFormat(value: string, format: DateTimeFormat = DateTimeFormat_DEFAULT): boolean
    {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (value == null || typeof value !== "string" || value.isEmptyOrWhiteSpace())
            return false;

        return LuxonDateTime.fromFormat(value, format).isValid;
    }

    /**
     * Validates if a string matches the date format "yyyy-MM-dd" accepted by
     * {@link DateTime.createFromValues}.
     *
     * @param value - The string to validate.
     * @returns True if the string matches the format, false otherwise.
     */
    public static validateDateFormat(value: string): boolean
    {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (value == null || typeof value !== "string" || value.isEmptyOrWhiteSpace())
            return false;

        return LuxonDateTime.fromFormat(value, "yyyy-MM-dd").isValid;
    }

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
    public static validateTimeFormat(value: string, format: "HH:mm:ss" | "HH:mm" = "HH:mm:ss"): boolean
    {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (value == null || typeof value !== "string" || value.isEmptyOrWhiteSpace())
            return false;

        return LuxonDateTime.fromFormat(value, format).isValid;
    }

    /**
     * Validates if a string is a valid timezone.
     *
     * @param zone - The timezone string to validate.
     * @returns True if the timezone is valid, false otherwise.
     */
    public static validateTimeZone(zone: string): boolean
    {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (zone == null || typeof zone !== "string" || zone.isEmptyOrWhiteSpace())
            return false;

        try
        {
            DateTime._validateZone(DateTime._normalizeZone(zone));
        }
        catch
        {
            return false;
        }

        return true;
    }


    /**
     * Normalizes a date and time value, defaulting any components coarser than seconds.
     *
     * @param value - The raw value.
     * @returns The value in "yyyy-MM-dd HH:mm:ss" form.
     * @throws ArgumentException if the value cannot be brought into that form.
     * @private
     */
    private static _normalizeValue(value: string): string
    {
        let normalized = value.trim();

        if (normalized.matchesFormat("####"))
            normalized = `${normalized}-01`; // MM
        if (normalized.matchesFormat("####-##"))
            normalized = `${normalized}-01`; // dd
        if (normalized.matchesFormat("####-##-##"))
            normalized = `${normalized} 00`; // HH
        if (normalized.matchesFormat("####-##-## ##"))
            normalized = `${normalized}:00`; // mm
        if (normalized.matchesFormat("####-##-## ##:##"))
            normalized = `${normalized}:00`; // ss

        given(value, "value")
            .ensure(_ => normalized.matchesFormat("####-##-## ##:##:##"), "Invalid format");

        const month = Number.parseInt(normalized.slice(5, 7));
        const day = Number.parseInt(normalized.slice(8, 10));
        const hour = Number.parseInt(normalized.slice(11, 13));
        const minute = Number.parseInt(normalized.slice(14, 16));
        const second = Number.parseInt(normalized.slice(17, 19));

        given(month, "month").ensure(t => t >= 1 && t <= 12);
        given(day, "day").ensure(t => t >= 1 && t <= 31);
        given(hour, "hour").ensure(t => t >= 0 && t <= 23);
        given(minute, "minute").ensure(t => t >= 0 && t <= 59);
        given(second, "second").ensure(t => t >= 0 && t <= 59);

        return normalized;
    }

    /**
     * Normalizes a timezone string so that casing and surrounding whitespace do not produce
     * distinct zones.
     *
     * @param zone - The raw timezone string.
     * @returns The normalized timezone string.
     * @private
     */
    private static _normalizeZone(zone: string): string
    {
        const trimmed = zone.trim();

        return trimmed.toLowerCase() === "utc" ? "utc" : trimmed;
    }

    /**
     * Normalizes and validates a timezone string in one step.
     *
     * @param zone - The raw timezone string.
     * @returns The normalized timezone string.
     * @throws ArgumentException if the timezone is invalid.
     * @private
     */
    private static _validatedZone(zone: string): string
    {
        const normalized = DateTime._normalizeZone(zone);
        DateTime._validateZone(normalized);

        return normalized;
    }

    /**
     * Validates a normalized timezone string.
     *
     * @param zone - The normalized timezone string.
     * @throws ArgumentException if the timezone is invalid.
     * @private
     */
    private static _validateZone(zone: string): void
    {
        if (DateTime._validatedZones.has(zone))
            return;

        given(zone, "zone")
            .ensureWhen(
                zone.toLowerCase() === "local",
                _ => false,
                "should not use local zone")
            .ensureWhen(
                zone.toLowerCase().startsWith("utc+"),
                t => DateTime._isValidUtcOffset(t, "+"),
                "Invalid UTC offset for zone")
            .ensureWhen(
                zone.toLowerCase().startsWith("utc-"),
                t => DateTime._isValidUtcOffset(t, "-"),
                "Invalid UTC offset for zone")
            .ensure(
                t => LuxonDateTime.now().setZone(t).isValid,
                "is not a valid timezone");

        DateTime._validatedZones.add(zone);
    }

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
    private static _isValidUtcOffset(zone: string, sign: "+" | "-"): boolean
    {
        let offset = zone.split(sign).takeLast().trim();

        if (!offset.contains(":"))
            offset = `${offset}:00`;

        const [hour, minute] = offset.split(":").map(t => TypeHelper.parseNumber(t.trim()));

        if (hour == null || minute == null)
            return false;

        if (minute < 0 || minute > 59)
            return false;

        const maxHour = sign === "+" ? 14 : 12;

        return (hour >= 0 && hour < maxHour) || (hour === maxHour && minute === 0);
    }

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
    private static _fromLuxon(dateTime: LuxonDateTime, zone: string): DateTime
    {
        given(dateTime, "dateTime").ensure(t => t.isValid, "invalid luxon DateTime");

        return new DateTime({
            value: dateTime.toFormat(DateTimeFormat_DEFAULT),
            zone
        });
    }

    /**
     * Converts an HHmmss time code to the number of seconds since midnight.
     *
     * @param timeCode - The time code.
     * @param argName - The argument name to report in validation failures.
     * @returns The number of seconds since midnight.
     * @throws ArgumentException if the time code is not a real time of day.
     * @private
     */
    private static _timeCodeToSecondsOfDay(timeCode: string, argName: string): number
    {
        given(timeCode, argName).ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("######"), "must be in HHmmss format")
            .ensure(t => Number.parseInt(t.slice(0, 2)) <= 23, "hour must be between 00 and 23")
            .ensure(t => Number.parseInt(t.slice(2, 4)) <= 59, "minute must be between 00 and 59")
            .ensure(t => Number.parseInt(t.slice(4, 6)) <= 59, "second must be between 00 and 59");

        return (Number.parseInt(timeCode.slice(0, 2)) * 3600)
            + (Number.parseInt(timeCode.slice(2, 4)) * 60)
            + Number.parseInt(timeCode.slice(4, 6));
    }


    /**
     * Gets the numeric value of this DateTime.
     *
     * @returns The milliseconds since the Unix epoch.
     */
    public override valueOf(): number
    {
        return this._dateTime.valueOf();
    }

    /**
     * Compares this DateTime with another for equality of wall-clock value and zone.
     *
     * Note that this is stricter than {@link DateTime.isSame}, which compares instants: the same
     * instant expressed in two different zones is `isSame` but not `equals`.
     *
     * @param value - The DateTime to compare with.
     * @returns True if the DateTime instances are equal, false otherwise.
     */
    public equals(value?: DateTime | null): boolean
    {
        given(value, "value").ensureIsType(DateTime);

        if (value == null)
            return false;

        if (value === this)
            return true;

        return value.value === this._value && value.zone === this._zone;
    }

    /**
     * Returns the string representation of this DateTime.
     *
     * @returns The string representation in the format "YYYY-MM-DD HH:mm:ss zone".
     */
    public override toString(): string
    {
        return `${this._value} ${this._zone}`;
    }

    /**
     * Returns the date and time string.
     *
     * @returns The string in the format "YYYY-MM-DD HH:mm:ss".
     */
    public toStringDateTime(): string
    {
        return this._value;
    }

    /**
     * Returns the ISO string representation.
     *
     * @returns The ISO 8601 string representation.
     */
    public toStringISO(): string
    {
        return this._dateTime.toISO({ format: "extended", includeOffset: true })!;
    }

    /**
     * Returns the ISO 8601 date portion.
     *
     * @returns The string in the format "YYYY-MM-DD".
     */
    public toISODate(): string
    {
        return this.dateValue;
    }

    /**
     * Converts this DateTime to a native JavaScript Date.
     *
     * @returns A Date representing the same instant.
     */
    public toJSDate(): Date
    {
        return this._dateTime.toJSDate();
    }

    /**
     * Returns the underlying luxon DateTime.
     *
     * This is the escape hatch for functionality this wrapper does not expose. The returned
     * object is itself immutable, so it cannot be used to mutate this instance.
     *
     * @returns The underlying luxon DateTime.
     */
    public toLuxon(): LuxonDateTime
    {
        return this._dateTime;
    }

    /**
     * Formats this DateTime using one of the standard formats.
     *
     * @param format - The format to use. Defaults to "yyyy-MM-dd HH:mm:ss".
     * @returns The formatted datetime string.
     * @throws ArgumentException if the format is not a DateTimeFormat.
     */
    public format(format: DateTimeFormat = DateTimeFormat_DEFAULT): string
    {
        given(format, "format").ensureHasValue().ensureIsEnum(DateTimeFormat);

        return this._dateTime.toFormat(format, { locale: DateTime._defaultLocale });
    }

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
     * const dt = DateTime.now("America/New_York");
     * dt.formatExt("DD HH:mm:ss"); // "Jul 2, 2023 15:30:20"
     * dt.formatExt("MMMM d, yyyy"); // "July 2, 2023"
     * dt.formatExt("EEEE DD"); // "Friday Jul 2, 2023"
     * dt.formatExt("DDDD", "fr"); // "dimanche 2 juillet 2023"
     * ```
     */
    public formatExt(format: DateTimeFormatExt | string, locale: string = DateTime._defaultLocale): string
    {
        given(format, "format").ensureHasValue().ensureIsString();
        given(locale, "locale").ensureHasValue().ensureIsString();

        return this._dateTime.toFormat(format, { locale });
    }

    /**
     * Checks if this DateTime represents the same instant as another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if the DateTime instances represent the same instant, false otherwise.
     */
    public isSame(value: DateTime): boolean
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        return this.valueOf() === value.valueOf();
    }

    /**
     * Checks if this DateTime is before another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if this DateTime is before the other, false otherwise.
     */
    public isBefore(value: DateTime): boolean
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        return this.valueOf() < value.valueOf();
    }

    /**
     * Checks if this DateTime is the same or before another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if this DateTime is the same or before the other, false otherwise.
     */
    public isSameOrBefore(value: DateTime): boolean
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        return this.valueOf() <= value.valueOf();
    }

    /**
     * Checks if this DateTime is after another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if this DateTime is after the other, false otherwise.
     */
    public isAfter(value: DateTime): boolean
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        return this.valueOf() > value.valueOf();
    }

    /**
     * Checks if this DateTime is the same or after another.
     *
     * @param value - The DateTime to compare with.
     * @returns True if this DateTime is the same or after the other, false otherwise.
     */
    public isSameOrAfter(value: DateTime): boolean
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        return this.valueOf() >= value.valueOf();
    }

    /**
     * Checks if this DateTime is between two others, inclusive of both bounds.
     *
     * @param start - The start DateTime.
     * @param end - The end DateTime.
     * @returns True if this DateTime is between start and end, false otherwise.
     * @throws ArgumentException if end is before start.
     */
    public isBetween(start: DateTime, end: DateTime): boolean
    {
        given(start, "start").ensureHasValue().ensureIsType(DateTime);
        given(end, "end").ensureHasValue().ensureIsType(DateTime)
            .ensure(t => t.isSameOrAfter(start), "must be same or after start");

        return this.isSameOrAfter(start) && this.isSameOrBefore(end);
    }

    /**
     * Calculates the elapsed time between this DateTime and another.
     *
     * @param value - The DateTime to compare with.
     * @returns A Duration representing the absolute time difference.
     */
    public timeDiff(value: DateTime): Duration
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        return Duration.fromMilliSeconds(Math.abs(this.valueOf() - value.valueOf()));
    }

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
    public daysDiff(value: DateTime): number
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        // anchor both dates in a fixed zone so that DST cannot distort the day count
        const thisDate = LuxonDateTime.fromFormat(this.dateValue, "yyyy-MM-dd", { zone: "utc" });
        const otherDate = LuxonDateTime.fromFormat(value.dateValue, "yyyy-MM-dd", { zone: "utc" });

        return Math.abs(Math.round(thisDate.diff(otherDate, ["days"]).days));
    }

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
    public isSameDay(value: DateTime): boolean
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        return this.dateValue === value.dateValue;
    }

    /**
     * Adds a duration to this DateTime. This shifts by absolute elapsed time, so it accounts for
     * DST transitions. Sub-second components are truncated.
     *
     * @param time - The duration to add.
     * @returns A new DateTime instance with the duration added.
     */
    public addTime(time: Duration): DateTime
    {
        given(time, "time").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Duration);

        return DateTime._fromLuxon(
            this._dateTime.plus({ milliseconds: time.toMilliSeconds() }),
            this._zone
        );
    }

    /**
     * Subtracts a duration from this DateTime. This shifts by absolute elapsed time, so it
     * accounts for DST transitions. Sub-second components are truncated.
     *
     * @param time - The duration to subtract.
     * @returns A new DateTime instance with the duration subtracted.
     */
    public subtractTime(time: Duration): DateTime
    {
        given(time, "time").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Duration);

        return DateTime._fromLuxon(
            this._dateTime.minus({ milliseconds: time.toMilliSeconds() }),
            this._zone
        );
    }

    /**
     * Adds calendar days to this DateTime, preserving the wall-clock time across DST transitions.
     *
     * @param days - The number of days to add. May be negative.
     * @returns A new DateTime instance with the days added.
     * @throws ArgumentException if days is not an integer.
     */
    public addDays(days: number): DateTime
    {
        given(days, "days").ensureHasValue().ensureIsNumber()
            .ensure(t => Number.isInteger(t), "days should be an integer");

        return DateTime._fromLuxon(this._dateTime.plus({ days }), this._zone);
    }

    /**
     * Subtracts calendar days from this DateTime, preserving the wall-clock time across DST
     * transitions.
     *
     * @param days - The number of days to subtract. May be negative.
     * @returns A new DateTime instance with the days subtracted.
     * @throws ArgumentException if days is not an integer.
     */
    public subtractDays(days: number): DateTime
    {
        given(days, "days").ensureHasValue().ensureIsNumber()
            .ensure(t => Number.isInteger(t), "days should be an integer");

        return DateTime._fromLuxon(this._dateTime.minus({ days }), this._zone);
    }

    /**
     * Adds calendar months to this DateTime, clamping the day to the end of the target month.
     *
     * @param months - The number of months to add. May be negative.
     * @returns A new DateTime instance with the months added.
     * @throws ArgumentException if months is not an integer.
     */
    public addMonths(months: number): DateTime
    {
        given(months, "months").ensureHasValue().ensureIsNumber()
            .ensure(t => Number.isInteger(t), "months should be an integer");

        return DateTime._fromLuxon(this._dateTime.plus({ months }), this._zone);
    }

    /**
     * Subtracts calendar months from this DateTime, clamping the day to the end of the target month.
     *
     * @param months - The number of months to subtract. May be negative.
     * @returns A new DateTime instance with the months subtracted.
     * @throws ArgumentException if months is not an integer.
     */
    public subtractMonths(months: number): DateTime
    {
        given(months, "months").ensureHasValue().ensureIsNumber()
            .ensure(t => Number.isInteger(t), "months should be an integer");

        return DateTime._fromLuxon(this._dateTime.minus({ months }), this._zone);
    }

    /**
     * Adds calendar years to this DateTime, clamping Feb 29 to Feb 28 in non-leap years.
     *
     * @param years - The number of years to add. May be negative.
     * @returns A new DateTime instance with the years added.
     * @throws ArgumentException if years is not an integer.
     */
    public addYears(years: number): DateTime
    {
        given(years, "years").ensureHasValue().ensureIsNumber()
            .ensure(t => Number.isInteger(t), "years should be an integer");

        return DateTime._fromLuxon(this._dateTime.plus({ years }), this._zone);
    }

    /**
     * Subtracts calendar years from this DateTime, clamping Feb 29 to Feb 28 in non-leap years.
     *
     * @param years - The number of years to subtract. May be negative.
     * @returns A new DateTime instance with the years subtracted.
     * @throws ArgumentException if years is not an integer.
     */
    public subtractYears(years: number): DateTime
    {
        given(years, "years").ensureHasValue().ensureIsNumber()
            .ensure(t => Number.isInteger(t), "years should be an integer");

        return DateTime._fromLuxon(this._dateTime.minus({ years }), this._zone);
    }

    /**
     * Returns the start of the given unit.
     *
     * @param unit - The unit to truncate to.
     * @returns A new DateTime at the start of that unit.
     */
    public startOf(unit: DateTimeUnit): DateTime
    {
        given(unit, "unit").ensureHasValue().ensureIsString();

        return DateTime._fromLuxon(this._dateTime.startOf(unit), this._zone);
    }

    /**
     * Returns the end of the given unit.
     *
     * Because values carry second precision, this is the final whole second of the unit — the end
     * of a day is 23:59:59, not 23:59:59.999.
     *
     * @param unit - The unit to extend to.
     * @returns A new DateTime at the end of that unit.
     */
    public endOf(unit: DateTimeUnit): DateTime
    {
        given(unit, "unit").ensureHasValue().ensureIsString();

        return DateTime._fromLuxon(this._dateTime.endOf(unit), this._zone);
    }

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
    public getDaysOfMonth(): Array<DateTime>
    {
        const startOfMonth = this._dateTime.startOf("month");
        const endOfMonth = this._dateTime.endOf("month");

        const luxonDays = LuxonInterval.fromDateTimes(startOfMonth, endOfMonth).splitBy({ days: 1 })
            .map((t) => t.start!);

        return luxonDays.map(t => DateTime._fromLuxon(t, this._zone));
    }

    /**
     * Converts this DateTime to a different timezone, preserving the instant.
     *
     * @param zone - The target timezone.
     * @returns A new DateTime instance in the specified timezone, or this instance if the zone is unchanged.
     * @throws ArgumentException if the timezone is invalid.
     */
    public convertToZone(zone: string): DateTime
    {
        given(zone, "zone").ensureHasValue().ensureIsString();

        const validatedZone = DateTime._validatedZone(zone);

        if (validatedZone === this._zone)
            return this;

        return DateTime._fromLuxon(this._dateTime.setZone(validatedZone), validatedZone);
    }

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
    public isWithinTimeRange(startTimeCode: string, endTimeCode: string): boolean
    {
        const start = DateTime._timeCodeToSecondsOfDay(startTimeCode, "startTimeCode");
        const end = DateTime._timeCodeToSecondsOfDay(endTimeCode, "endTimeCode");

        const current = (this._dateTime.hour * 3600) + (this._dateTime.minute * 60) + this._dateTime.second;

        if (start <= end)
            return current >= start && current <= end;

        // the range wraps midnight
        return current >= start || current <= end;
    }
}

/**
 * Schema type for DateTime serialization.
 */
export type DateTimeSchema = Schema<DateTime, "value" | "zone">;
