import React, { useEffect, useState } from "react";

export default function RedditRotator({
  posts = [],
  intervalMs = 30000
}) {
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(Math.floor(intervalMs / 1000));
  const intervalSec = Math.floor(intervalMs / 1000);

  useEffect(() => {
    if (!posts.length) return;
    setRemaining(intervalSec);
    const tick = setInterval(() => setRemaining(r => (r > 1 ? r - 1 : 0)), 1000);
    const rot  = setInterval(() => setIdx(i => (i + 1) % posts.length), intervalMs);
    return () => { clearInterval(tick); clearInterval(rot); };
  }, [intervalMs, posts.length, intervalSec]);

  useEffect(() => { setRemaining(intervalSec); }, [idx, intervalSec]);

  if (!posts.length) return null;

  const visibleCount = Math.min(3, posts.length);
  const visible = Array.from({ length: visibleCount }, (_, i) => posts[(idx + i) % posts.length]);

  return (
    <section className="reddit-box">
      <span className="reddit-timer">{remaining}s</span>
      <header className="reddit-header">
        <svg className="reddit-logo" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#FF4500"/>
          <circle cx="9" cy="12" r="1.5" fill="#fff"/>
          <circle cx="15" cy="12" r="1.5" fill="#fff"/>
          <path d="M7.5 15c1.3 1 3 1.5 4.5 1.5S15.2 16 16.5 15" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <circle cx="18.2" cy="8.8" r="1.5" fill="#FF4500" stroke="#fff" strokeWidth="1.2"/>
          <path d="M12 8l.9-3.4 3.2.9" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
        <div className="reddit-title">
          <span className="reddit-label">Reddit</span>
        </div>
      </header>
      <ul className="reddit-list">
        {visible.map((p, i) => (
          <li className="reddit-item" key={`${p.subreddit}-${i}`}>
            <span className="reddit-sub">{p.subreddit}</span>
            <span className="reddit-sep">—</span>
            <span className="reddit-text">{p.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
