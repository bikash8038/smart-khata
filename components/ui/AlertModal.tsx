"use client";

import React from "react";

interface AlertModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AlertModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: AlertModalProps) {
  return (
    <div className="modal-backdrop alert-backdrop">
      <div className="modal-content alert-content">
        <div className="alert-body">
          <div className="alert-icon-warning">
            <svg className="alert-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2>{title}</h2>
          <p className="alert-message">{message}</p>
        </div>
        <div className="alert-actions">
          <button type="button" className="alert-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="alert-btn-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
