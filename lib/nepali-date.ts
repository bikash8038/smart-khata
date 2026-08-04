import { adToBs, formatBsDate, toNepaliNumeral, type Language } from "@munatech/nepali-datepicker";

const NE_BS_MONTHS = [
  "बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "असोज",
  "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"
];

const EN_BS_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const NE_WEEKDAYS = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
const EN_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Formats a Gregorian AD date string (YYYY-MM-DD) into a localized Bikram Sambat (BS) date string.
 */
export function formatAdToBs(adDateString: string, locale: Language = "ne"): string {
  if (!adDateString || !/^\d{4}-\d{2}-\d{2}/.exec(adDateString)) {
    return adDateString;
  }
  try {
    const [yearStr, monthStr, dayStr] = adDateString.slice(0, 10).split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const bsDate = adToBs(year, month, day);
    return formatBsDate(bsDate, "YYYY MMMM D", locale);
  } catch {
    return adDateString;
  }
}

/**
 * Converts standard numbers to Nepali numerals if locale is 'ne'.
 */
export function formatNumeral(num: number | string, locale: Language = "ne"): string {
  if (locale !== "ne") return String(num);
  return toNepaliNumeral(Number(num));
}

export interface StatementDateHeaderInfo {
  bsDayNumber: string;
  bsWeekday: string;
  bsMonthYear: string;
  fullBsDateStr: string;
  adFormatted: string;
}

/**
 * Returns structured BS Date & Weekday information for bank-statement daily group headers.
 */
export function getStatementDateHeaderInfo(adDateString: string, locale: Language = "ne"): StatementDateHeaderInfo {
  if (!adDateString || !/^\d{4}-\d{2}-\d{2}/.exec(adDateString)) {
    return {
      bsDayNumber: "--",
      bsWeekday: "",
      bsMonthYear: adDateString,
      fullBsDateStr: adDateString,
      adFormatted: adDateString,
    };
  }

  try {
    const [yearStr, monthStr, dayStr] = adDateString.slice(0, 10).split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const adDate = new Date(year, month - 1, day);
    const dayOfWeek = adDate.getDay();
    const bs = adToBs(year, month, day);

    const bsDayNumStr = locale === "ne" ? toNepaliNumeral(bs.day) : String(bs.day);
    const weekdayStr = locale === "ne" ? NE_WEEKDAYS[dayOfWeek] : EN_WEEKDAYS[dayOfWeek];
    const monthNameStr = locale === "ne" ? NE_BS_MONTHS[bs.month - 1] : EN_BS_MONTHS[bs.month - 1];
    const bsYearStr = locale === "ne" ? toNepaliNumeral(bs.year) : String(bs.year);

    const fullBsDateStr = locale === "ne"
      ? `${bsDayNumStr} ${monthNameStr} ${bsYearStr}, ${weekdayStr}`
      : `${bsDayNumStr} ${monthNameStr} ${bsYearStr}, ${weekdayStr}`;

    return {
      bsDayNumber: bsDayNumStr,
      bsWeekday: weekdayStr,
      bsMonthYear: `${monthNameStr}, ${bsYearStr}`,
      fullBsDateStr,
      adFormatted: adDateString,
    };
  } catch {
    return {
      bsDayNumber: "--",
      bsWeekday: "",
      bsMonthYear: adDateString,
      fullBsDateStr: adDateString,
      adFormatted: adDateString,
    };
  }
}

/**
 * Formats a timestamp/date string into localized AM/PM time (e.g., "07:03 PM" or "०७:०३ PM").
 */
export function formatAmPmTime(dateString?: string, locale: Language = "ne"): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";

    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;

    const hrStr = hours < 10 ? `0${hours}` : `${hours}`;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

    if (locale === "ne") {
      const toNeNum = (val: string) => val.replace(/\d/g, (x) => ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"][Number(x)]);
      return `${toNeNum(hrStr)}:${toNeNum(minStr)} ${ampm}`;
    }
    return `${hrStr}:${minStr} ${ampm}`;
  } catch {
    return "";
  }
}
