"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  adToBs,
  bsToAd,
  getTodayBs,
  getDaysInBsMonth,
  getFirstDayOfBsMonth,
  type NepaliDate,
} from "@munatech/nepali-datepicker";

interface NepaliDatePickerProps {
  value: string; // AD Date string (YYYY-MM-DD)
  onChange: (adDateString: string) => void;
  locale?: "ne" | "en";
  name?: string;
}

const EN_BS_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const NE_BS_MONTHS = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भदौ",
  "असोज",
  "कात्तिक",
  "मंसिर",
  "पुस",
  "माघ",
  "फागुन",
  "चैत",
];

const toNepaliNum = (num: number | string): string => {
  const digits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num).replace(/\d/g, (d) => digits[Number(d)]);
};

const YEAR_OPTIONS = Array.from({ length: 91 }, (_, i) => 2000 + i);

export function NepaliDatePicker({ value, onChange, locale = "ne", name = "date" }: NepaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Lock background scroll when datepicker modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Convert initial AD date string YYYY-MM-DD -> BS NepaliDate
  const getNepaliDateFromAd = (adStr: string): NepaliDate => {
    if (adStr && /^\d{4}-\d{2}-\d{2}/.test(adStr)) {
      try {
        const [y, m, d] = adStr.slice(0, 10).split("-").map(Number);
        const bs = adToBs(y, m, d);
        if (bs && bs.year && bs.month && bs.day) return bs;
      } catch {
        // Fallback
      }
    }
    return getTodayBs();
  };

  const [selectedBs, setSelectedBs] = useState<NepaliDate>(() => getNepaliDateFromAd(value));
  const [prevValue, setPrevValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    const newBs = getNepaliDateFromAd(value);
    setSelectedBs(newBs);
  }

  // Temporary viewing state inside the modal
  const [viewYear, setViewYear] = useState<number>(selectedBs.year);
  const [viewMonth, setViewMonth] = useState<number>(selectedBs.month); // 1 - 12
  const [tempBs, setTempBs] = useState<NepaliDate>(selectedBs);

  const openModal = () => {
    const currentBs = getNepaliDateFromAd(value);
    setSelectedBs(currentBs);
    setTempBs(currentBs);
    setViewYear(currentBs.year);
    setViewMonth(currentBs.month);
    setIsOpen(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      if (viewYear > 2000) {
        setViewYear(viewYear - 1);
        setViewMonth(12);
      }
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      if (viewYear < 2090) {
        setViewYear(viewYear + 1);
        setViewMonth(1);
      }
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSetToday = () => {
    const today = getTodayBs();
    setViewYear(today.year);
    setViewMonth(today.month);
    setTempBs(today);
  };

  const handleConfirm = () => {
    try {
      const adObj = bsToAd(tempBs.year, tempBs.month, tempBs.day);
      const yStr = String(adObj.year).padStart(4, "0");
      const mStr = String(adObj.month).padStart(2, "0");
      const dStr = String(adObj.day).padStart(2, "0");
      const adDateStr = `${yStr}-${mStr}-${dStr}`;
      setSelectedBs(tempBs);
      onChange(adDateStr);
    } catch {
      // Fallback
    }
    setIsOpen(false);
  };

  // Format trigger button value
  const displayFormattedDate =
    locale === "ne"
      ? `${toNepaliNum(selectedBs.year)}-${toNepaliNum(String(selectedBs.month).padStart(2, "0"))}-${toNepaliNum(String(selectedBs.day).padStart(2, "0"))}`
      : `${selectedBs.year}-${String(selectedBs.month).padStart(2, "0")}-${String(selectedBs.day).padStart(2, "0")}`;

  // Header display string e.g. "Bhadra 30, 2081" or "२०८१ भदौ ३०"
  const mName = locale === "ne" ? NE_BS_MONTHS[tempBs.month - 1] : EN_BS_MONTHS[tempBs.month - 1];
  const headerDateStr =
    locale === "ne"
      ? `${mName} ${toNepaliNum(tempBs.day)}, ${toNepaliNum(tempBs.year)}`
      : `${mName} ${tempBs.day}, ${tempBs.year}`;

  const totalDaysInMonth = getDaysInBsMonth(viewYear, viewMonth) || 30;
  const startDayIndex = getFirstDayOfBsMonth(viewYear, viewMonth) || 0;

  const weekdaysHeader =
    locale === "ne"
      ? ["आइ", "सोम", "मंग", "बुध", "बिही", "शुक्र", "शनि"]
      : ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="nepali-datepicker-wrapper">
      <input type="hidden" name={name} value={value} />
      
      <button
        type="button"
        className="nepali-date-trigger-btn"
        onClick={openModal}
      >
        <span className="nepali-date-display-text">{displayFormattedDate}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nepali-date-calendar-icon">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>

      {isOpen && typeof window !== "undefined" && createPortal(
        <div className="nepali-picker-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="nepali-picker-modal-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Top Material 3 Header */}
            <div className="nepali-picker-header">
              <span className="nepali-picker-subheading">
                {locale === "ne" ? "नेपाली मिति छान्नुहोस्" : "Select Nepali Date"}
              </span>
              <h3 className="nepali-picker-title">{headerDateStr}</h3>
            </div>

            <div className="nepali-picker-divider" />

            {/* Controls Bar: Month / Year Select + Navigation */}
            <div className="nepali-picker-controls">
              <div className="nepali-picker-selectors">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                >
                  {EN_BS_MONTHS.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {locale === "ne" ? NE_BS_MONTHS[idx] : m}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                >
                  {YEAR_OPTIONS.map((yr) => (
                    <option key={yr} value={yr}>
                      {locale === "ne" ? toNepaliNum(yr) : yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="nepali-picker-nav">
                <button
                  type="button"
                  className="nepali-picker-today-btn"
                  onClick={handleSetToday}
                >
                  {locale === "ne" ? "आज" : "TODAY"}
                </button>
                <button
                  type="button"
                  className="nepali-picker-arrow-btn"
                  onClick={handlePrevMonth}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="nepali-picker-arrow-btn"
                  onClick={handleNextMonth}
                >
                  ›
                </button>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="nepali-picker-weekdays">
              {weekdaysHeader.map((wd, i) => (
                <span key={i}>{wd}</span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="nepali-picker-grid">
              {/* Empty padding cells */}
              {Array.from({ length: startDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="nepali-picker-cell empty" />
              ))}

              {/* Day cells 1..totalDaysInMonth */}
              {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  tempBs.year === viewYear &&
                  tempBs.month === viewMonth &&
                  tempBs.day === dayNum;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    className={`nepali-picker-cell day-btn ${isSelected ? "selected" : ""}`}
                    onClick={() =>
                      setTempBs({ year: viewYear, month: viewMonth, day: dayNum })
                    }
                  >
                    <span>{locale === "ne" ? toNepaliNum(dayNum) : dayNum}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer Actions */}
            <div className="nepali-picker-footer">
              <button
                type="button"
                className="nepali-picker-cancel"
                onClick={() => setIsOpen(false)}
              >
                {locale === "ne" ? "रद्द गर्नुहोस्" : "Cancel"}
              </button>
              <button
                type="button"
                className="nepali-picker-ok"
                onClick={handleConfirm}
              >
                {locale === "ne" ? "ठिक छ" : "OK"}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
