import React from "react";

export default function StatusChip({ status }) {
  if (!status?.status_text || !status?.status_updated_at) return null;

  // Check if status is less than 24h old
  const statusAge = Date.now() - new Date(status.status_updated_at).getTime();
  const isActive = statusAge < 24 * 60 * 60 * 1000;

  if (!isActive) return null;

  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold px-2 py-0.5 rounded-full whitespace-nowrap max-w-[120px] truncate shadow-lg z-10">
      {status.status_text}
    </div>
  );
}