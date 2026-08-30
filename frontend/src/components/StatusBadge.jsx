import React from "react";

export default function StatusBadge({ status }) {
  const raw = String(status || "—");
  const formatted = raw.replaceAll("_", " ").toLowerCase();

  return (
    <span className={`status-badge status-${formatted.replaceAll(" ", "-")}`}>
      <span className="status-dot" />
      {raw.replaceAll("_", " ").toUpperCase()}
    </span>
  );
}
