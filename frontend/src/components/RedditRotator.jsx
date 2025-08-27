import React, { useEffect, useMemo, useRef, useState } from "react";

export default function RedditRotator({ posts = [], intervalMs = 30000 }) {
  const titles = useMemo(
    () =>
      (posts || [])
        .map((p) => (typeof p === "string" ? p : p?.title))
        .filter(Boolean),
    [posts]
  );

  const visibleCount = Math.min(3, titles.length || 0);
  const step = Math.max(visibleCount, 1);

  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(Math.ceil(intervalMs / 1000));

  const deadlineRef = useRef(Date.now() + intervalMs);

  useEffect(() => {
    if (!titles.length) return;

    deadlineRef.current = Date.now() + intervalMs;
    setRemaining(Math.ceil((deadlineRef.current - Date.now()) / 1000));

    const tick = setInterval(() => {
      const now = Date.now();
      const msLeft = deadlineRef.current - now;

      if (msLeft <= 0) {
        setIdx((i) => (i + step) % titles.length);
        do {
          deadlineRef.current += intervalMs;
        } while (deadlineRef.current <= now);
        setRemaining(Math.ceil((deadlineRef.current - now) / 1000));
      } else {
        setRemaining(Math.ceil(msLeft / 1000));
      }
    }, 250);

    const onVis = () => {
      const now = Date.now();
      const msLeft = deadlineRef.current - now;
      if (msLeft <= 0) {
        setIdx((i) => (i + step) % titles.length);
        do {
          deadlineRef.current += intervalMs;
        } while (deadlineRef.current <= now);
      }
      setRemaining(Math.ceil((deadlineRef.current - Date.now()) / 1000));
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [titles.length, intervalMs, step]);

  if (!titles.length) return null;

  const visible = Array.from(
    { length: visibleCount },
    (_, i) => titles[(idx + i) % titles.length]
  );

  return (
    <section className="reddit-box">
      <span className="reddit-timer">{remaining}s</span>
      <header className="reddit-header">
        <svg className="reddit-logo" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#FF4500" />
          <circle cx="9" cy="12" r="1.5" fill="#fff" />
          <circle cx="15" cy="12" r="1.5" fill="#fff" />
          <path
            d="M7.5 15c1.3 1 3 1.5 4.5 1.5S15.2 16 16.5 15"
            stroke="#fff"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="18.2" cy="8.8" r="1.5" fill="#FF4500" stroke="#fff" strokeWidth="1.2" />
          <path d="M12 8l.9-3.4 3.2.9" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
        <div className="reddit-title">
          <span className="reddit-label">Reddit</span>
        </div>
      </header>

      <ul className="reddit-list">
        {visible.map((t, i) => (
          <li className="reddit-item" key={`${idx}-${i}`}>
            <span className="reddit-text">{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
