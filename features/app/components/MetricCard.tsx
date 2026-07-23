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
  return (
    <article className={`summary-card ${className}`}>
      <div className="summary-card-header">
        <p>{label}</p>
        {icon && <span className="summary-icon">{icon}</span>}
      </div>
      <strong>{value}</strong>
      {trend && <small className="trend">{trend}</small>}
    </article>
  );
}
