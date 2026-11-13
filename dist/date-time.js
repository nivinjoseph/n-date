import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { DateTime as LuxonDateTime, FixedOffsetZone, Info as LuxonInfo, Interval as LuxonInterval } from "luxon";
import { DomainObject } from "@nivinjoseph/n-domain";
import { serialize, Duration, TypeHelper } from "@nivinjoseph/n-util";
import { DateTimeFormat, DateTimeFormat_DEFAULT } from "./date-time-format.js";
const dateTimeUnits = ["year", "month", "day", "hour", "minute"];
const millisPerMinute = 60_000;
const millisPerDay = 86_400_000;
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
 *   there ({@link DateTime.createFromTimestamp}, {@link DateTime.createFromEpochMinutes},
 *   {@link DateTime.createFromISO}, {@link DateTime.convertToZone}, {@link DateTime.addTime},
 *   a zone-local {@link DateTime.now}) collapses to the earlier pass, up to one hour earlier.
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
let DateTime = (() => {
    let _classDecorators = [serialize("Ndate")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = DomainObject;
    let _instanceExtraInitializers = [];
    let _get_value_decorators;
    let _get_zone_decorators;
    let _get_timestamp_decorators;
    var DateTime = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_value_decorators = [serialize];
            _get_zone_decorators = [serialize];
            _get_timestamp_decorators = [serialize];
            __esDecorate(this, null, _get_value_decorators, { kind: "getter", name: "value", static: false, private: false, access: { has: obj => "value" in obj, get: obj => obj.value }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_zone_decorators, { kind: "getter", name: "zone", static: false, private: false, access: { has: obj => "zone" in obj, get: obj => obj.zone }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_timestamp_decorators, { kind: "getter", name: "timestamp", static: false, private: false, access: { has: obj => "timestamp" in obj, get: obj => obj.timestamp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DateTime = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static _defaultLocale = "en-US";
        // Zone validity cannot change at runtime, and resolving a zone through luxon is by far the most
        // expensive part of constructing a non-utc DateTime, so successful lookups are memoized.
        static _validatedZones = new Set(["utc"]);
        static _fixedNow = null;
        static _relativeNow = null;
        static _fixedCurrentZone = null;
        _value = __runInitializers(this, _instanceExtraInitializers);
        _zone;
        _dateTime;
        _timestamp;
        /**
         * Gets the current timezone: the fixed zone set via {@link DateTime.useFixedCurrentZone} when
         * one is set, otherwise the host system's local timezone.
         *
         * This is informational only — it is not a default for any factory. {@link DateTime.now} still
         * defaults to utc when no zone is passed, and the machine-relative zone strings "local",
         * "system" and "default" remain rejected everywhere.
         *
         * @returns The current timezone identifier.
         */
        static get currentZone() { return DateTime._fixedCurrentZone ?? LuxonDateTime.local().zoneName; }
        /**
         * Gets the formatted date and time string in "yyyy-MM-dd HH:mm:ss" format.
         *
         * This is always the canonical wall-clock time for {@link DateTime.zone} — see the class
         * documentation for how DST transitions are resolved.
         */
        get value() { return this._value; }
        /**
         * Gets the timezone identifier.
         */
        get zone() { return this._zone; }
        /**
         * Gets the Unix timestamp in seconds. Note that {@link DateTime.valueOf} returns milliseconds.
         *
         * This is part of the serialized form so that stored records can be sorted, filtered and
         * range-queried on the instant without being deserialized. It is derived from {@link DateTime.value}
         * and {@link DateTime.zone} rather than stored alongside them, so it is not a constructor input —
         * see {@link DateTimeData}.
         */
        get timestamp() { return this._timestamp; }
        /**
         * Gets the number of whole minutes since the Unix epoch — the minute bucket containing this
         * instant. Floored rather than truncated, so it is the start of the containing minute for
         * instants before the epoch too.
         *
         * This is not part of the serialized form; {@link DateTime.timestamp} already carries the
         * instant.
         */
        get epochMinutes() { return Math.floor(this._timestamp / 60); }
        /**
         * Gets the date code in YYYYMMDD format.
         */
        get dateCode() { return `${this._value.slice(0, 4)}${this._value.slice(5, 7)}${this._value.slice(8, 10)}`; }
        /**
         * Gets the time code in HHMMSS format.
         */
        get timeCode() { return `${this._value.slice(11, 13)}${this._value.slice(14, 16)}${this._value.slice(17, 19)}`; }
        /**
         * Gets the date value in YYYY-MM-DD format.
         */
        get dateValue() { return this._value.slice(0, 10); }
        /**
         * Gets the time value in HH:mm:ss format.
         */
        get timeValue() { return this._value.slice(11, 19); }
        /**
         * Gets the calendar year.
         */
        get year() { return this._dateTime.year; }
        /**
         * Gets the calendar month (1-12).
         */
        get month() { return this._dateTime.month; }
        /**
         * Gets the day of the month (1-31).
         */
        get day() { return this._dateTime.day; }
        /**
         * Gets the hour of the day (0-23).
         */
        get hour() { return this._dateTime.hour; }
        /**
         * Gets the minute of the hour (0-59).
         */
        get minute() { return this._dateTime.minute; }
        /**
         * Gets the second of the minute (0-59).
         */
        get second() { return this._dateTime.second; }
        /**
         * Gets the day of the week, where 1 is Monday and 7 is Sunday.
         */
        get dayOfWeek() { return this._dateTime.weekday; }
        /**
         * Gets the day of the year (1-366).
         */
        get dayOfYear() { return this._dateTime.ordinal; }
        /**
         * Gets the number of days in this DateTime's month.
         */
        get daysInMonth() { return this._dateTime.daysInMonth; }
        /**
         * Gets whether this DateTime falls on a Saturday or Sunday.
         */
        get isWeekend() { return this._dateTime.weekday >= 6; }
        /**
         * Gets whether this DateTime's year is a leap year.
         */
        get isLeapYear() { return this._dateTime.isInLeapYear; }
        /**
         * Gets whether this DateTime is in the past.
         */
        get isPast() { return this.isBefore(DateTime.now()); }
        /**
         * Gets whether this DateTime is in the future.
         */
        get isFuture() { return this.isAfter(DateTime.now()); }
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
        constructor(data) {
            // DomainObject's data shape is driven by the @serialize decorated getters, so it requires
            // the derived timestamp that this constructor deliberately does not accept. The base only
            // reads the keys of `data` (to reject ones with no matching getter), never its values.
            super(data);
            const { value, zone } = data;
            given(value, "value").ensureHasValue().ensureIsString();
            const normalizedValue = DateTime._normalizeValue(value);
            given(zone, "zone").ensureHasValue().ensureIsString();
            const normalizedZone = DateTime._normalizeZone(zone);
            DateTime._validateZone(normalizedZone);
            // Parse the value as a bare wall-clock reading (utc has no transitions to get in the way)
            // and only then place it in the zone.
            const wallClock = LuxonDateTime.fromFormat(normalizedValue, DateTimeFormat_DEFAULT, { zone: "utc" });
            given(data, "data")
                .ensure(_ => wallClock.isValid, `value and zone is invalid (${wallClock.invalidReason}: ${wallClock.invalidExplanation})`);
            const dateTime = DateTime._placeInZone(wallClock, normalizedZone);
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
        static useFixedNow(timestamp) {
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
        static useRelativeNow(timestamp) {
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
        static resetFixedOrRelativeNow() {
            DateTime._fixedNow = null;
            DateTime._relativeNow = null;
        }
        static withFixedNow(timestamp, func) {
            given(timestamp, "timestamp").ensureHasValue().ensureIsNumber();
            given(func, "func").ensureHasValue().ensureIsFunction();
            const previousFixed = DateTime._fixedNow;
            const previousRelative = DateTime._relativeNow;
            const restore = () => {
                DateTime._fixedNow = previousFixed;
                DateTime._relativeNow = previousRelative;
            };
            DateTime.useFixedNow(timestamp);
            let result;
            try {
                result = func();
            }
            catch (e) {
                restore();
                throw e;
            }
            if (result instanceof Promise)
                return result.finally(restore);
            restore();
            return result;
        }
        /**
         * Sets a fixed zone for {@link DateTime.currentZone}, so that it no longer depends on the host
         * machine. Nothing else is affected: {@link DateTime.now} still defaults to utc, and no factory
         * falls back to this zone.
         *
         * @param zone - The timezone identifier to report as the current zone.
         * @throws ArgumentException if the zone is invalid, or is one of "local", "system" or "default".
         */
        static useFixedCurrentZone(zone) {
            given(zone, "zone").ensureHasValue().ensureIsString();
            DateTime._fixedCurrentZone = DateTime._validatedZone(zone);
        }
        /**
         * Resets any fixed zone set by useFixedCurrentZone.
         * DateTime.currentZone will report the host system's local timezone after calling this method.
         */
        static resetFixedCurrentZone() {
            DateTime._fixedCurrentZone = null;
        }
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
        static now(zone) {
            given(zone, "zone").ensureIsString();
            const targetZone = zone == null ? "utc" : DateTime._validatedZone(zone);
            // Check if we're using fixed or relative now for testing
            let timestamp = null;
            if (DateTime._fixedNow !== null) {
                timestamp = DateTime._fixedNow;
            }
            else if (DateTime._relativeNow !== null) {
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
         * Fractional seconds are truncated per the precision contract. If the instant falls in the
         * second pass of a DST fall-back repeated hour in the zone, it collapses to the earlier pass
         * (up to one hour earlier) — see the class documentation.
         *
         * @param timestamp - The number of seconds since the Unix epoch.
         * @param zone - The timezone identifier.
         * @returns A new DateTime instance.
         * @throws ArgumentException if the timestamp or zone is invalid.
         */
        static createFromTimestamp(timestamp, zone) {
            given(timestamp, "timestamp").ensureHasValue().ensureIsNumber();
            given(zone, "zone").ensureHasValue().ensureIsString();
            const validatedZone = DateTime._validatedZone(zone);
            return DateTime._fromLuxon(LuxonDateTime.fromSeconds(timestamp).setZone(validatedZone), validatedZone);
        }
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
        static createFromMilliSecondsSinceEpoch(milliseconds, zone) {
            given(milliseconds, "milliseconds").ensureHasValue().ensureIsNumber();
            given(zone, "zone").ensureHasValue().ensureIsString();
            const validatedZone = DateTime._validatedZone(zone);
            return DateTime._fromLuxon(LuxonDateTime.fromMillis(milliseconds).setZone(validatedZone), validatedZone);
        }
        /**
         * Creates a DateTime from the number of minutes since the Unix epoch.
         *
         * This is the inverse of {@link DateTime.epochMinutes}, so round-tripping lands on the start of
         * the minute — the seconds of the original instant are not recoverable. A fractional value is
         * floored to the minute that contains it, the same way {@link DateTime.epochMinutes} floors.
         * If the instant falls in the second pass of a DST fall-back repeated hour in the zone, it
         * collapses to the earlier pass (up to one hour earlier), same as
         * {@link DateTime.createFromTimestamp}.
         *
         * @param epochMinutes - The number of minutes since the Unix epoch.
         * @param zone - The timezone identifier.
         * @returns A new DateTime instance.
         * @throws ArgumentException if the epochMinutes or zone is invalid.
         */
        static createFromEpochMinutes(epochMinutes, zone) {
            given(epochMinutes, "epochMinutes").ensureHasValue().ensureIsNumber();
            given(zone, "zone").ensureHasValue().ensureIsString();
            return DateTime.createFromTimestamp(Math.floor(epochMinutes) * 60, zone);
        }
        /**
         * Creates a DateTime from an ISO 8601 string.
         *
         * For a string that carries a date, an offset in the string names the instant. Without one,
         * the string is a wall-clock time in the supplied zone.
         *
         * A dated string may also end with a zone of its own in brackets
         * (`2023-06-11T10:00:00-04:00[America/New_York]`). It is then read in that zone instead, and
         * an offset beside the brackets counts only if that zone was at that offset at the time,
         * which is how such a string says which pass of a repeated hour it means.
         *
         * A string with only a time means that time today, by the system clock (`useFixedNow` does
         * not apply): in the zone it gives in brackets, else at the offset it carries, else in the
         * supplied zone.
         *
         * The resulting DateTime is always expressed in the supplied zone, so an instant in the
         * second pass of a DST fall-back repeated hour in that zone collapses to the earlier pass —
         * see the class documentation.
         *
         * @param value - The ISO 8601 string.
         * @param zone - The timezone identifier.
         * @returns A new DateTime instance.
         * @throws ArgumentException if the value or zone is invalid.
         */
        static createFromISO(value, zone) {
            given(value, "value").ensureHasValue().ensureIsString();
            given(zone, "zone").ensureHasValue().ensureIsString();
            const validatedZone = DateTime._validatedZone(zone);
            const trimmed = value.trim();
            // With setZone, luxon reports a string that names a zone of its own in that zone: a fixed
            // offset if it carries an offset, the named zone if it ends with one in brackets.
            const dateTime = LuxonDateTime.fromISO(trimmed, { zone: validatedZone, setZone: true });
            given(value, "value").ensure(_ => dateTime.isValid, "Invalid ISO format");
            // A zone in brackets takes the place of the supplied one as the zone the string is read
            // in, which needs care of its own. The instant that comes of it only has to be expressed
            // in the supplied zone.
            if (trimmed.endsWith("]")) {
                const instant = DateTime._readBracketedISO(trimmed, dateTime);
                return DateTime._fromLuxon(instant.setZone(validatedZone), validatedZone);
            }
            // A fixed offset means the instant is exact — either the string named it, or the supplied
            // zone itself has no transitions — so it only has to be expressed in the supplied zone.
            if (dateTime.zone.isUniversal)
                return DateTime._fromLuxon(dateTime.setZone(validatedZone), validatedZone);
            // Otherwise the string is a wall-clock reading in the supplied zone, and luxon has resolved
            // it in the way _placeInZone exists to avoid. Read it again against the zone's current
            // offset held fixed — which keeps luxon's idea of "today" for a string that omits the
            // date — and let the constructor place the bare reading.
            const offsetToday = LuxonDateTime.now().setZone(validatedZone).offset;
            const reading = LuxonDateTime.fromISO(trimmed, { zone: FixedOffsetZone.instance(offsetToday) });
            return DateTime._fromLuxon(reading, validatedZone);
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
        static createFromCodes(dateCode, timeCode, zone) {
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
        static createFromValues(dateValue, timeValue, zone) {
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
        static tryCreate(value, zone) {
            if (value == null || zone == null)
                return null;
            try {
                return new DateTime({ value, zone });
            }
            catch {
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
        static min(dateTime1, dateTime2) {
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
        static max(dateTime1, dateTime2) {
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
        static validateDateTimeFormat(value, format = DateTimeFormat_DEFAULT) {
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
        static validateDateFormat(value) {
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
        static validateTimeFormat(value, format = "HH:mm:ss") {
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
        static validateTimeZone(zone) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (zone == null || typeof zone !== "string" || zone.isEmptyOrWhiteSpace())
                return false;
            try {
                DateTime._validateZone(DateTime._normalizeZone(zone));
            }
            catch {
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
        static _normalizeValue(value) {
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
        static _normalizeZone(zone) {
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
        static _validatedZone(zone) {
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
        static _validateZone(zone) {
            if (DateTime._validatedZones.has(zone))
                return;
            given(zone, "zone")
                .ensureWhen(["local", "system", "default"].includes(zone.toLowerCase()), _ => false, "should not use local/system/default zone")
                .ensureWhen(zone.toLowerCase().startsWith("utc+"), t => DateTime._isValidUtcOffset(t, "+"), "Invalid UTC offset for zone")
                .ensureWhen(zone.toLowerCase().startsWith("utc-"), t => DateTime._isValidUtcOffset(t, "-"), "Invalid UTC offset for zone")
                .ensure(t => LuxonDateTime.now().setZone(t).isValid, "is not a valid timezone");
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
        static _isValidUtcOffset(zone, sign) {
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
        static _fromLuxon(dateTime, zone) {
            given(dateTime, "dateTime")
                .ensure(t => t.isValid, "invalid luxon DateTime")
                .ensure(t => t.year >= 0 && t.year <= 9999, "resulting date is outside the supported year range 0000-9999");
            return new DateTime({
                value: dateTime.toFormat(DateTimeFormat_DEFAULT),
                zone
            });
        }
        /**
         * Places a wall-clock reading in a zone, as a function of the two and nothing else.
         *
         * Luxon can do this itself, but it starts its search for the matching instant from the offset
         * the zone has at the moment the code runs, which lets the calendar leak into the result: a
         * reading in a DST fall-back repeated hour resolves to a different pass in summer than in
         * winter, and in a zone whose offsets have moved over the years a perfectly valid reading
         * close to a transition can come back shifted by the size of that transition. The offsets on
         * either side of the reading are therefore looked up directly.
         *
         * @param wallClock - The wall-clock reading, held in utc.
         * @param zone - The normalized, validated timezone.
         * @returns The luxon DateTime for that reading in that zone.
         * @private
         */
        static _placeInZone(wallClock, zone) {
            const luxonZone = LuxonInfo.normalizeZone(zone);
            // held in utc, the reading's epoch milliseconds are the wall-clock time itself
            const reading = wallClock.toMillis();
            // The zone's offset a day before and a day after the reading. The instant behind the
            // reading is not known yet, but no zone is as much as a day away from utc, so these two
            // are sure to lie either side of it — and no zone has ever changed its offset twice in so
            // short a stretch. They are the same unless a transition is close by.
            const offsetBefore = luxonZone.offset(reading - millisPerDay);
            const offsetAfter = luxonZone.offset(reading + millisPerDay);
            // offsets are in minutes, and the ones from before standard time carry seconds as a fraction
            let instant = reading - Math.round(offsetBefore * millisPerMinute);
            if (offsetBefore !== offsetAfter) {
                const instantAfter = reading - Math.round(offsetAfter * millisPerMinute);
                // an offset fits only if the zone really was at that offset at the instant it leads to
                const beforeFits = luxonZone.offset(instant) === offsetBefore;
                const afterFits = luxonZone.offset(instantAfter) === offsetAfter;
                // The earlier offset is the one to use in every case but one. Where it alone fits, the
                // reading comes before the transition. Where both fit, the reading is in a repeated
                // hour and it gives the earlier pass. Where neither fits, the reading is in a gap and
                // it carries the reading forward by the size of the gap. Only a reading that comes
                // after the transition needs the later offset.
                if (afterFits && !beforeFits)
                    instant = instantAfter;
            }
            return LuxonDateTime.fromMillis(instant, { zone: luxonZone });
        }
        /**
         * Reads an ISO 8601 string that ends with a zone of its own in brackets
         * (`2023-06-11T10:00:00-04:00[America/New_York]`).
         *
         * Luxon reads the time in that zone by the search that _placeInZone exists to avoid, and
         * ignores any offset written beside the brackets. For a string that carries a date, the part
         * before the brackets is therefore read on its own.
         *
         * @param text - The string, already known to be valid.
         * @param asLuxonReadsIt - The luxon DateTime for the whole string, in the bracketed zone.
         * @returns The luxon DateTime for the instant the string means.
         * @private
         */
        static _readBracketedISO(text, asLuxonReadsIt) {
            const zone = asLuxonReadsIt.zone;
            const withoutBrackets = text.substring(0, text.lastIndexOf("["));
            // Without a T the string has no date. It is a time today in the bracketed zone, and is
            // left as luxon reads it: taking the brackets off such a string can change what it means
            // ("1030-05" is a month).
            if (!withoutBrackets.toUpperCase().contains("T"))
                return asLuxonReadsIt;
            // With setZone, luxon reports the rest at the offset it carries, if it carries one. That
            // offset counts only if the bracketed zone was at it at the instant it names, which is
            // how such a string says which pass of a repeated hour it means.
            const named = LuxonDateTime.fromISO(withoutBrackets, { zone, setZone: true });
            if (named.zone.isUniversal && named.setZone(zone).offset === named.offset)
                return named;
            // Otherwise the time is taken as it is written, as a wall-clock reading in the bracketed
            // zone. Against utc, luxon gives the rest back as written, at its own offset or in utc.
            const written = LuxonDateTime.fromISO(withoutBrackets, { zone: "utc", setZone: true });
            return DateTime._placeInZone(written.setZone("utc", { keepLocalTime: true }), zone.name);
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
        static _timeCodeToSecondsOfDay(timeCode, argName) {
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
        valueOf() {
            return this._dateTime.valueOf();
        }
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
        equals(value) {
            if (value == null)
                return false;
            if (value === this)
                return true;
            if (!(value instanceof DateTime))
                return false;
            return value.value === this._value && value.zone === this._zone;
        }
        /**
         * Returns the string representation of this DateTime.
         *
         * @returns The string representation in the format "YYYY-MM-DD HH:mm:ss zone".
         */
        toString() {
            return `${this._value} ${this._zone}`;
        }
        /**
         * Returns the date and time string.
         *
         * @returns The string in the format "YYYY-MM-DD HH:mm:ss".
         */
        toStringDateTime() {
            return this._value;
        }
        /**
         * Returns the ISO string representation.
         *
         * @returns The ISO 8601 string representation.
         */
        toStringISO() {
            return this._dateTime.toISO({ format: "extended", includeOffset: true });
        }
        /**
         * Returns the ISO 8601 date portion.
         *
         * @returns The string in the format "YYYY-MM-DD".
         */
        toISODate() {
            return this.dateValue;
        }
        /**
         * Converts this DateTime to a native JavaScript Date.
         *
         * @returns A Date representing the same instant.
         */
        toJSDate() {
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
        toLuxon() {
            return this._dateTime;
        }
        /**
         * Formats this DateTime using one of the standard formats.
         *
         * @param format - The format to use. Defaults to "yyyy-MM-dd HH:mm:ss".
         * @returns The formatted datetime string.
         * @throws ArgumentException if the format is not a DateTimeFormat.
         */
        format(format = DateTimeFormat_DEFAULT) {
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
         * const dt = new DateTime({ value: "2023-07-02 15:30:20", zone: "America/New_York" });
         * dt.formatExt("DD HH:mm:ss"); // "Jul 2, 2023 15:30:20"
         * dt.formatExt("MMMM d, yyyy"); // "July 2, 2023"
         * dt.formatExt("EEEE DD"); // "Sunday Jul 2, 2023"
         * dt.formatExt("DDDD", "fr"); // "dimanche 2 juillet 2023"
         * ```
         */
        formatExt(format, locale = DateTime._defaultLocale) {
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
        isSame(value) {
            given(value, "value").ensureHasValue().ensureIsType(DateTime);
            return this.valueOf() === value.valueOf();
        }
        /**
         * Checks if this DateTime is before another.
         *
         * @param value - The DateTime to compare with.
         * @returns True if this DateTime is before the other, false otherwise.
         */
        isBefore(value) {
            given(value, "value").ensureHasValue().ensureIsType(DateTime);
            return this.valueOf() < value.valueOf();
        }
        /**
         * Checks if this DateTime is the same or before another.
         *
         * @param value - The DateTime to compare with.
         * @returns True if this DateTime is the same or before the other, false otherwise.
         */
        isSameOrBefore(value) {
            given(value, "value").ensureHasValue().ensureIsType(DateTime);
            return this.valueOf() <= value.valueOf();
        }
        /**
         * Checks if this DateTime is after another.
         *
         * @param value - The DateTime to compare with.
         * @returns True if this DateTime is after the other, false otherwise.
         */
        isAfter(value) {
            given(value, "value").ensureHasValue().ensureIsType(DateTime);
            return this.valueOf() > value.valueOf();
        }
        /**
         * Checks if this DateTime is the same or after another.
         *
         * @param value - The DateTime to compare with.
         * @returns True if this DateTime is the same or after the other, false otherwise.
         */
        isSameOrAfter(value) {
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
        isBetween(start, end) {
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
        timeDiff(value) {
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
        daysDiff(value) {
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
        isSameDay(value) {
            given(value, "value").ensureHasValue().ensureIsType(DateTime);
            return this.dateValue === value.dateValue;
        }
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
        addTime(time) {
            given(time, "time").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Duration);
            return DateTime._fromLuxon(this._dateTime.plus({ milliseconds: time.toMilliSeconds() }), this._zone);
        }
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
        subtractTime(time) {
            given(time, "time").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Duration);
            return DateTime._fromLuxon(this._dateTime.minus({ milliseconds: time.toMilliSeconds() }), this._zone);
        }
        /**
         * Adds calendar days to this DateTime, preserving the wall-clock time across DST transitions.
         *
         * @param days - The number of days to add. May be negative.
         * @returns A new DateTime instance with the days added.
         * @throws ArgumentException if days is not an integer.
         */
        addDays(days) {
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
        subtractDays(days) {
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
        addMonths(months) {
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
        subtractMonths(months) {
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
        addYears(years) {
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
        subtractYears(years) {
            given(years, "years").ensureHasValue().ensureIsNumber()
                .ensure(t => Number.isInteger(t), "years should be an integer");
            return DateTime._fromLuxon(this._dateTime.minus({ years }), this._zone);
        }
        /**
         * Returns the start of the given unit.
         *
         * @param unit - The unit to truncate to.
         * @returns A new DateTime at the start of that unit.
         * @throws ArgumentException if the unit is not a DateTimeUnit.
         */
        startOf(unit) {
            given(unit, "unit").ensureHasValue().ensureIsString()
                .ensure(t => dateTimeUnits.includes(t), "must be one of year, month, day, hour, minute");
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
         * @throws ArgumentException if the unit is not a DateTimeUnit.
         */
        endOf(unit) {
            given(unit, "unit").ensureHasValue().ensureIsString()
                .ensure(t => dateTimeUnits.includes(t), "must be one of year, month, day, hour, minute");
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
        getDaysOfMonth() {
            const startOfMonth = this._dateTime.startOf("month");
            const endOfMonth = this._dateTime.endOf("month");
            const luxonDays = LuxonInterval.fromDateTimes(startOfMonth, endOfMonth).splitBy({ days: 1 })
                .map((t) => t.start);
            return luxonDays.map(t => DateTime._fromLuxon(t, this._zone));
        }
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
        convertToZone(zone) {
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
        isWithinTimeRange(startTimeCode, endTimeCode) {
            const start = DateTime._timeCodeToSecondsOfDay(startTimeCode, "startTimeCode");
            const end = DateTime._timeCodeToSecondsOfDay(endTimeCode, "endTimeCode");
            const current = (this._dateTime.hour * 3600) + (this._dateTime.minute * 60) + this._dateTime.second;
            if (start <= end)
                return current >= start && current <= end;
            // the range wraps midnight
            return current >= start || current <= end;
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return DateTime = _classThis;
})();
export { DateTime };
//# sourceMappingURL=date-time.js.map