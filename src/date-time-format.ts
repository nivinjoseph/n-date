export enum DateTimeFormat
{
    yearMonthDayHourMinuteSecond = "yyyy-MM-dd HH:mm:ss",
    yearMonthDayHourMinute = "yyyy-MM-dd HH:mm",
    yearMonthDayHour = "yyyy-MM-dd HH",
    yearMonthDay = "yyyy-MM-dd",
    yearMonth = "yyyy-MM",
    year = "yyyy",
}

export const DateTimeFormat_DEFAULT = DateTimeFormat.yearMonthDayHourMinuteSecond;


export type DateTimeFormatExt =
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