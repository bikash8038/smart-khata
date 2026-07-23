"use client";

import React from "react";

interface Notice {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationListProps {
  items: Notice[];
  onRead: (id: string) => void;
  t: Record<string, string>;
}

export function NotificationList({ items, onRead, t }: NotificationListProps) {
  if (items.length === 0) {
    return (
      <section className="record-panel">
        <p className="empty-state">{t.noNotifications}</p>
      </section>
    );
  }

  return (
    <section className="record-panel">
      <h2>{t.yourNotifications}</h2>
      <div className="notification-list-container">
        {items.map((item) => (
          <article className={`record-row notification-row ${item.is_read ? "read" : "unread"}`} key={item.id}>
            <div>
              <strong className="notification-title">
                {!item.is_read && <span className="unread-dot" />} {item.title}
              </strong>
              <p>{item.message}</p>
              <small className="notification-time">{item.created_at.slice(0, 10)}</small>
            </div>
            {!item.is_read && (
              <button
                type="button"
                className="text-button read-button"
                onClick={() => onRead(item.id)}
              >
                {t.markAsRead}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
