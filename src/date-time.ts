import { given } from "@nivinjoseph/n-defensive";
import { DateTime as LuxonDateTime, Interval as LuxonInterval } from "luxon";
import { Serializable, serialize, Duration, Schema, TypeHelper } from "@nivinjoseph/n-util";
import { DateTimeFormat, DateTimeFormat_DEFAULT, DateTimeFormatExt } from "./date-time-format.js";

/**
 * A robust date and time handling system with timezone support.
 * This class provides comprehensive functionality for date/time manipulation, comparison, and formatting.
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
    private static _fixedNow: number | null = null;
    private static _relativeNow: { baseTimestamp: number; baseRealTime: number; } | null = null;

    private readonly _value: string;
    private readonly _zone: string;
    private readonly _dateTime: LuxonDateTime;
    private readonly _timestamp: number;
    private readonly _dateCode: string;
    private readonly _timeCode: string;
    private readonly _dateValue: string;
    private readonly _timeValue: string;


    /**
     * Gets the system's local timezone.
     * 
     * @returns The local timezone identifier.
     */
    public static get currentZone(): string { return LuxonDateTime.local().zoneName; }

    /**
     * Gets the formatted date and time string.
     */
    @serialize
    public get value(): string { return this._value; }

    /**
     * Gets the timezone identifier.
     */
    @serialize
    public get zone(): string { return this._zone; }

    /**
     * Gets the Unix timestamp in seconds.
     */
    public get timestamp(): number { return this._timestamp; }

    /**
     * Gets the date code in YYYYMMDD format.
     */
    public get dateCode(): string { return this._dateCode; }

    /**
     * Gets the time code in HHMMSS format.
     */
    public get timeCode(): string { return this._timeCode; }

    /**
     * Gets the date value in YYYY-MM-DD format.
     */
    public get dateValue(): string { return this._dateValue; }

    /**
     * Gets the time value in HH:mm:ss format.
     */
    public get timeValue(): string { return this._timeValue; }

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
     * @param data - The DateTime data containing value and zone.
     * @throws Error if the value or zone is invalid.
     */
    public constructor(data: DateTimeSchema)
    {
        super(data);

        let { value, zone } = data;

        given(value, "value").ensureHasValue().ensureIsString();
        value = value.trim()
            .split("")
            .take(DateTimeFormat.yearMonthDayHourMinuteSecond.length)
            .join("");

        if (value.matchesFormat("####"))
            value = `${value}-01`; // MM
        if (value.matchesFormat("####-##"))
            value = `${value}-01`; // dd
        if (value.matchesFormat("####-##-##"))
            value = `${value} 00`; // HH
        if (value.matchesFormat("####-##-## ##"))
            value = `${value}:00`; // mm
        if (value.matchesFormat("####-##-## ##:##"))
            value = `${value}:00`; // ss
        
        given(value, "value")
            .ensure(
                t => t.matchesFormat("####-##-## ##:##:##"),
                "Invalid format"
        );
        
        const [date, time] = value.split(" ");

        const dateSplit = date.split("-");
        // const _year = Number.parseInt(dateSplit[0]);
        const month = Number.parseInt(dateSplit[1]);
        const day = Number.parseInt(dateSplit[2]);

        given(month, "month").ensureHasValue().ensureIsNumber().ensure(t => t >= 1 && t <= 12);
        given(day, "day").ensureHasValue().ensureIsNumber().ensure(t => t >= 1 && t <= 31);

        const timeSplit = time.split(":");
        const hour = Number.parseInt(timeSplit[0]);
        const minute = Number.parseInt(timeSplit[1]);
        const second = Number.parseInt(timeSplit[2]);

        given(hour, "hour").ensureHasValue().ensureIsNumber().ensure(t => t >= 0 && t <= 23);
        given(minute, "minute").ensureHasValue().ensureIsNumber().ensure(t => t >= 0 && t <= 59);
        given(second, "second").ensureHasValue().ensureIsNumber().ensure(t => t >= 0 && t <= 59);

        given(zone, "zone").ensureHasValue().ensureIsString();
        zone = zone.trim();
        if (zone.toLowerCase() === "utc")
            zone = zone.toLowerCase();

        DateTime._validateZone(zone);

        const dateTime = LuxonDateTime.fromFormat(
            value,
            DateTimeFormat.yearMonthDayHourMinuteSecond,
            { zone }
        );
        given(data, "data")
            .ensure(
                _ => dateTime.isValid,
                `value and zone is invalid (${dateTime.invalidReason}: ${dateTime.invalidExplanation})`
            );

        this._value = value;
        this._zone = zone;
        this._dateTime = dateTime;
        this._timestamp = this._dateTime.toUnixInteger();

        this._dateCode = dateSplit.join("");
        this._timeCode = timeSplit.join("");

        this._dateValue = date;
        this._timeValue = time;
    }

    /**
     * Sets a fixed timestamp for testing purposes. All calls to DateTime.now() will return this fixed time.
     *
     * @param timestamp - The Unix timestamp in seconds to use as the fixed "now" time.
     * @throws Error if timestamp is not a valid number.
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
     * @throws Error if timestamp is not a valid number.
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
     * Creates a DateTime instance for the current time.
     *
     * @param zone - The timezone identifier. If not specified, UTC is used.
     * @returns A new DateTime instance representing the current time.
     */
    public static now(zone?: string): DateTime
    {
        given(zone, "zone").ensureIsString();

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

        // If we have a timestamp, use it
        if (timestamp !== null)
        {
            const targetZone = zone ?? "utc";
            return DateTime.createFromTimestamp(timestamp, targetZone);
        }

        // Otherwise, use real current time
        if (zone != null)
        {
            return new DateTime({
                value: LuxonDateTime.now().setZone(zone).toFormat(DateTimeFormat_DEFAULT),
                zone
            });
        }
        else
        {
            return new DateTime({
                value: LuxonDateTime.utc().toFormat(DateTimeFormat_DEFAULT),
                zone: "utc"
            });
        }
    }

    /**
     * Creates a DateTime from a Unix timestamp.
     * 
     * @param timestamp - The number of seconds since the Unix epoch.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     */
    public static createFromTimestamp(timestamp: number, zone: string): DateTime
    {
        given(timestamp, "timestamp").ensureHasValue().ensureIsNumber();
        given(zone, "zone").ensureHasValue().ensureIsString();

        const dateTimeString = LuxonDateTime.fromSeconds(timestamp)
            .setZone(zone).toFormat(DateTimeFormat_DEFAULT);
        
        return new DateTime({
            value: dateTimeString,
            zone
        });
    }

    /**
     * Creates a DateTime from milliseconds since the Unix epoch.
     * 
     * @param milliseconds - The number of milliseconds since the Unix epoch.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     */
    public static createFromMilliSecondsSinceEpoch(milliseconds: number, zone: string): DateTime
    {
        given(milliseconds, "milliseconds").ensureHasValue().ensureIsNumber();
        given(zone, "zone").ensureHasValue().ensureIsString();

        const dateTimeString = LuxonDateTime.fromMillis(milliseconds)
            .setZone(zone).toFormat(DateTimeFormat_DEFAULT);
        return new DateTime({
            value: dateTimeString,
            zone
        });
    }

    /**
     * Creates a DateTime from date and time codes.
     * 
     * @param dateCode - The date code in YYYYMMDD format.
     * @param timeCode - The time code in HHMM format.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     */
    public static createFromCodes(dateCode: string, timeCode: string, zone: string): DateTime
    {
        given(dateCode, "dateCode").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("########"));

        given(timeCode, "timeCode").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("######"));

        given(zone, "zone").ensureHasValue().ensureIsString();

        const dateCodeSplit = dateCode.split("");
        const timeCodeSplit = timeCode.split("");

        const year = dateCodeSplit.take(4).join("");
        const month = dateCodeSplit.skip(4).take(2).join("");
        const day = dateCodeSplit.skip(6).join("");

        const hour = timeCodeSplit.take(2).join("");
        const minute = timeCodeSplit.skip(2).take(2).join("");
        const second = timeCodeSplit.skip(4).join("");

        const dateTimeString = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

        return new DateTime({
            value: dateTimeString,
            zone
        });
    }

    /**
     * Creates a DateTime from date and time values.
     * 
     * @param dateValue - The date in YYYY-MM-DD format.
     * @param timeValue - The time in HH:mm format.
     * @param zone - The timezone identifier.
     * @returns A new DateTime instance.
     */
    public static createFromValues(dateValue: string, timeValue: string, zone: string): DateTime
    {
        given(dateValue, "dateValue").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("####-##-##"));

        given(timeValue, "timeValue").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("##:##:##"));

        given(zone, "zone").ensureHasValue().ensureIsString();

        const dateTimeString = `${dateValue} ${timeValue}`;

        return new DateTime({
            value: dateTimeString,
            zone
        });
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
     * Validates if a string matches the DateTime format "yyyy-MM-dd HH:mm".
     * 
     * @param value - The string to validate.
     * @returns True if the string matches the format, false otherwise.
     */
    public static validateDateTimeFormat(value: string, format: DateTimeFormat): boolean
    {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (value == null || value.isEmptyOrWhiteSpace())
            return false;

        return LuxonDateTime.fromFormat(value, format).isValid;
    }

    /**
     * Validates if a string matches the date format "yyyy-MM-dd".
     * 
     * @param value - The string to validate.
     * @returns True if the string matches the format, false otherwise.
     */
    public static validateDateFormat(value: string): boolean
    {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (value == null || value.isEmptyOrWhiteSpace())
            return false;

        return LuxonDateTime.fromFormat(value, "yyyy-MM-dd").isValid;
    }

    /**
     * Validates if a string matches the time format  "HH:mm".
     * 
     * @param value - The string to validate.
     * @returns True if the string matches the format, false otherwise.
     */
    public static validateTimeFormat(value: string): boolean
    {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (value == null || value.isEmptyOrWhiteSpace())
            return false;

        return LuxonDateTime.fromFormat(value, "HH:mm").isValid;
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
        if (zone == null || zone.isEmptyOrWhiteSpace())
            return false;

        try
        {
            DateTime._validateZone(zone);
        }
        catch
        {
            return false;
        }

        return LuxonDateTime.now().setZone(zone).isValid;
    }


    /**
     * Validates a timezone string.
     * 
     * @param zone - The timezone string to validate.
     * @throws Error if the timezone is invalid.
     * @private
     */
    private static _validateZone(zone: string): void
    {
        zone = zone.trim();

        if (zone.toLowerCase() === "utc")
            return;

        given(zone, "zone")
            .ensureWhen(
                zone.toLowerCase() === "local",
                _ => false,
                "should not use local zone")
            .ensureWhen(
                zone.toLowerCase().startsWith("utc+"),
                t =>
                {
                    // range is +00:00 to +14:00 (https://en.wikipedia.org/wiki/List_of_UTC_offsets)
                    let offset = t.split("+").takeLast().trim();

                    if (!offset.contains(":"))
                        offset = `${offset}:00`;

                    const [hour, minute] = offset.split(":").map(t => TypeHelper.parseNumber(t));

                    if (hour == null || minute == null)
                        return false;

                    return (hour >= 0 && hour < 14 && minute >= 0 && minute < 60)
                        || (hour === 14 && minute === 0);
                },
                "Invalid UTC offset for zone")
            .ensureWhen(
                zone.toLowerCase().startsWith("utc-"),
                t =>
                {
                    // range is -00:00 to -12:00 (https://en.wikipedia.org/wiki/List_of_UTC_offsets)
                    let offset = t.split("-").takeLast();

                    if (!offset.contains(":"))
                        offset = `${offset}:00`;

                    const [hour, minute] = offset.split(":").map(t => TypeHelper.parseNumber(t));

                    if (hour == null || minute == null)
                        return false;

                    return hour >= 0 && hour < 12 && minute >= 0 && minute < 60
                        || (hour === 12 && minute === 0);
                },
                "Invalid UTC offset for zone");
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
     * Compares this DateTime with another for equality.
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
     * Formats a DateTime object to a string using the specified format
     * @param dateTime The DateTime object to format
     * @param format The format to use (defaults to yearMonthDayHourMinute: "yyyy-MM-dd HH:mm")
     * @returns The formatted datetime string
     */
    public format(format: DateTimeFormat = DateTimeFormat.yearMonthDayHourMinuteSecond): string
    {
        // For the default format, use the built-in toStringDateTime()
        if (format === DateTimeFormat.yearMonthDayHourMinuteSecond)
            return this.toStringDateTime();

        // For other formats, parse and reformat
        const value = this.toStringDateTime();

        // Parse the value (format: "yyyy-MM-dd HH:mm:ss")
        const [date, time] = value.split(" ");
        const [year, month, day] = date.split("-");
        const [hour, minute, _second] = time.split(":");

        switch (format)
        {
            case DateTimeFormat.yearMonthDayHourMinute:
                return `${year}-${month}-${day} ${hour}:${minute}`;
            case DateTimeFormat.yearMonthDayHour:
                return `${year}-${month}-${day} ${hour}`;
            case DateTimeFormat.yearMonthDay:
                return `${year}-${month}-${day}`;
            case DateTimeFormat.yearMonth:
                return `${year}-${month}`;
            case DateTimeFormat.year:
                return year;
            default:
                return value;
        }
    }

    /**
     * Formats a DateTime object to a string using extended format capabilities.
     * This method leverages Luxon's full formatting capabilities for more complex formatting needs.
     *
     * @param format - The format string to use. Can be a predefined DateTimeFormatExt or any custom Luxon format string.
     * @returns The formatted datetime string.
     *
     * @example
     * ```typescript
     * const dt = DateTime.now("America/New_York");
     * dt.formatExt("DD HH:mm:ss"); // "Jul 2, 2023 15:30:20"
     * dt.formatExt("MMMM d, yyyy"); // "July 2, 2023"
     * dt.formatExt("EEEE DD"); // "Friday Jul 2, 2023"
     * 
     * export type DateTimeFormatExt =
        "DD HH:mm:ss" // Jul 2, 2023 15:30:20
        | "MMMM d, HH:mm:ss"  // Jul 2 15:30:20
        | "DD HH:mm" // Jul 2, 2023 15:30
        | "MMMM d, HH:mm"  // Jul 2 15:30
        | "yyyy/LL/dd" // 2023/07/21
        | "yyyy/LL/dd HH:mm:ss"
        | "yyyy/LL/dd HH:mm"
        | "yyyy-MM-dd" // 2023-07-21
        | "HH:mm:ss" // 15:30:20
        | "HH:mm" // 15:30
        | "DDD" // July 21, 2023
        | "DD" // Jul 21, 2023
        | "yyyy-MM" // 2023-07
        | "MMMM yyyy" // July 2023
        | "DDDD" // Sunday, July 9, 2023
        | "EEEE DD" // Friday Aug 4, 2023
        | "LLL yyyy" // Jul 2025
        | "LLLL yyyy" // July 2025
        | "MMMM d" // November 2
        | "LLL d" // Nov 2
        ;
     * 
     * ```
     */
    public formatExt(format: DateTimeFormatExt | string): string
    {
        given(format, "format").ensureHasValue().ensureIsString();

        return this._dateTime.toFormat(format);
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
     * Checks if this DateTime is between two others.
     * 
     * @param start - The start DateTime.
     * @param end - The end DateTime.
     * @returns True if this DateTime is between start and end, false otherwise.
     * @throws Error if end is before start.
     */
    public isBetween(start: DateTime, end: DateTime): boolean
    {
        given(start, "start").ensureHasValue().ensureIsType(DateTime);
        given(end, "end").ensureHasValue().ensureIsType(DateTime)
            .ensure(t => t.isSameOrAfter(start), "must be same or after start");

        return this.isSameOrAfter(start) && this.isSameOrBefore(end);
    }

    /**
     * Calculates the time difference between this DateTime and another.
     * 
     * @param value - The DateTime to compare with.
     * @returns A Duration representing the time difference.
     */
    public timeDiff(value: DateTime): Duration
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        return Duration.fromMilliSeconds(Math.abs(this.valueOf() - value.valueOf()));
    }

    /**
     * Calculates the days difference between this DateTime and another.
     * 
     * @param value - The DateTime to compare with.
     * @returns The number of days difference.
     */
    public daysDiff(value: DateTime): number
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        return Math.abs(Number.parseInt(this._dateTime.diff(value._dateTime, ["days"]).days.toString()));
    }

    /**
     * Checks if this DateTime is on the same day as another.
     * 
     * @param value - The DateTime to compare with.
     * @returns True if the DateTime instances are on the same day, false otherwise.
     */
    public isSameDay(value: DateTime): boolean
    {
        given(value, "value").ensureHasValue().ensureIsType(DateTime);

        const daysDiff = this._dateTime.diff(value._dateTime, ["days"]).days;

        return Math.abs(daysDiff) < 1;
    }

    /**
     * Adds a duration to this DateTime. this accounts for shift in DST
     * 
     * @param time - The duration to add.
     * @returns A new DateTime instance with the duration added.
     */
    public addTime(time: Duration): DateTime
    {
        given(time, "time").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Duration);

        return new DateTime({
            value: this._dateTime.plus({ milliseconds: time.toMilliSeconds() }).toFormat(DateTimeFormat_DEFAULT),
            zone: this._zone
        });
    }

    /**
     * Subtracts a duration from this DateTime. this accounts for shift in DST
     * 
     * @param time - The duration to subtract.
     * @returns A new DateTime instance with the duration subtracted.
     */
    public subtractTime(time: Duration): DateTime
    {
        given(time, "time").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Duration);

        return new DateTime({
            value: this._dateTime.minus({ milliseconds: time.toMilliSeconds() }).toFormat(DateTimeFormat_DEFAULT),
            zone: this._zone
        });
    }

    /**
     * Adds days to this DateTime. this doesn't change time based on DST
     * 
     * @param days - The number of days to add.
     * @returns A new DateTime instance with the days added.
     * @throws Error if days is not a positive integer.
     */
    public addDays(days: number): DateTime
    {
        given(days, "days").ensureHasValue().ensureIsNumber()
            .ensure(t => t >= 0 && Number.isInteger(t), "days should be positive integer");

        return new DateTime({
            value: this._dateTime.plus({ days }).toFormat(DateTimeFormat_DEFAULT),
            zone: this._zone
        });
    }

    /**
     * Subtracts days from this DateTime. this doesn't change time based on DST
     * 
     * @param days - The number of days to subtract.
     * @returns A new DateTime instance with the days subtracted.
     * @throws Error if days is not a positive integer.
     */
    public subtractDays(days: number): DateTime
    {
        given(days, "days").ensureHasValue().ensureIsNumber()
            .ensure(t => t >= 0 && Number.isInteger(t), "days should be positive integer");

        return new DateTime({
            value: this._dateTime.minus({ days }).toFormat(DateTimeFormat_DEFAULT),
            zone: this._zone
        });
    }

    /**
     * Gets an array of DateTime instances for each day of the month.
     * 
     * @returns An array of DateTime instances, where:
     * - First element is the start of the month (e.g., "2023-06-01 00:00")
     * - Last element is the end of the month (e.g., "2023-06-30 23:59")
     * - Elements in between represent the start of each day (e.g., "2023-06-11 00:00")
     */
    public getDaysOfMonth(): Array<DateTime>
    {
        const startOfMonth = this._dateTime.startOf("month");
        const endOfMonth = this._dateTime.endOf("month");

        const luxonDays = LuxonInterval.fromDateTimes(startOfMonth, endOfMonth).splitBy({ days: 1 })
            .map((t) => t.start!);

        luxonDays[0] = startOfMonth;
        luxonDays[luxonDays.length - 1] = endOfMonth;

        return luxonDays.map(t => new DateTime({
            value: t.toFormat(DateTimeFormat_DEFAULT),
            zone: this._zone
        }));
    }

    /**
     * Converts this DateTime to a different timezone.
     * 
     * @param zone - The target timezone.
     * @returns A new DateTime instance in the specified timezone.
     * @throws Error if the timezone is invalid.
     */
    public convertToZone(zone: string): DateTime
    {
        given(zone, "zone").ensureHasValue().ensureIsString()
            .ensure(t => DateTime.validateTimeZone(t));

        if (zone === this.zone)
            return this;

        const newDateTime = this._dateTime.setZone(zone).toFormat(DateTimeFormat_DEFAULT);

        return new DateTime({
            value: newDateTime,
            zone
        });
    }

    /**
     * Checks if this DateTime is within a time range.
     * 
     * @param startTimeCode - The start time code in HHMM format.
     * @param endTimeCode - The end time code in HHMM format.
     * @returns True if this DateTime is within the time range, false otherwise.
     * @throws Error if the time codes are invalid or if endTimeCode is before startTimeCode.
     */
    public isWithinTimeRange(startTimeCode: string, endTimeCode: string): boolean
    {
        given(startTimeCode, "startTimeCode").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("######"))
            .ensure(t => Number.parseInt(t) >= 0 && Number.parseInt(t) <= 235959);

        given(endTimeCode, "endTimeCode").ensureHasValue().ensureIsString()
            .ensure(t => t.matchesFormat("######"))
            .ensure(t => Number.parseInt(t) >= 0 && Number.parseInt(t) <= 235959)
            .ensure(t => Number.parseInt(t) >= Number.parseInt(startTimeCode),
                "must be >= startTimeCode");

        const startDateTime = DateTime.createFromCodes(
            this.dateCode,
            startTimeCode,
            this.zone
        );

        const endDateTime = DateTime.createFromCodes(
            this.dateCode,
            endTimeCode,
            this.zone
        );

        return this.isBetween(startDateTime, endDateTime);
    }
}

/**
 * Schema type for DateTime serialization.
 */
export type DateTimeSchema = Schema<DateTime, "value" | "zone">;