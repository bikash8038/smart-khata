import { adToBs, formatBsDate, toNepaliNumeral, type Language } from "@munatech/nepali-datepicker";

/**
 * Formats a Gregorian AD date string (YYYY-MM-DD) into a localized Bikram Sambat (BS) date string.
 * Example (ne): "2026-07-29" -> "२०८३ श्रावण १४"
 * Example (en): "2026-07-29" -> "2083 Shrawan 14"
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
