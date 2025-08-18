import React from "react";

export default function NewsTicker({ items = [], durationSec = 60 }) {
  const safe = items.filter(Boolean);
  const trackStyle = { "--ticker-duration": `${durationSec}s` };

  return (
    <div className="ticker">
      <div className="ticker-header">
        <h3 className="ticker-title">Today's Market News</h3>
      </div>
      <div className="ticker-viewport">
        <div className="ticker-track" style={trackStyle}>
          {safe.map((t, i) => (
            <span className="ticker-item" key={`a-${i}`}>{t}</span>
          ))}
        </div>
        <div className="ticker-track" aria-hidden="true" style={trackStyle}>
          {safe.map((t, i) => (
            <span className="ticker-item" key={`b-${i}`}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
