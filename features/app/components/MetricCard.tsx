"use client";

import React from "react";

interface MetricCardProps {
  label: string;
  value: string;
  className?: string;
  trend?: string;
  icon?: string;
}

export function MetricCard({ label, value, className = "", trend, icon }: MetricCardProps) {
  const iconGraphic = className === "balance" ? (
    <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="11" width="34" height="27" rx="4" /><path d="M7 19h34M13 30h13" /></svg>
  ) : className === "income" ? (
    <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 39V10M12 22l12-12 12 12" /></svg>
  ) : className === "expense" ? (
    <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 9v29M12 26l12 12 12-12" /></svg>
  ) : icon;
  return (
    <article className={`summary-card ${className}`}>
      <div className="summary-card-header">
        <p>{label}</p>
        {iconGraphic && <span className="summary-icon">{iconGraphic}</span>}
      </div>
      <strong>{value}</strong>
      {trend && <small className="trend">{trend}</small>}
    </article>
  );
}
