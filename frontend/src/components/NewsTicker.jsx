import React, { useEffect, useMemo, useRef, useState } from "react";

export default function NewsTicker({
  items = [],
  speedPxPerSec = 80,
  live = true,
}) {
  const safe = useMemo(() => items.filter(Boolean), [items]);
  const trackRef = useRef(null);
  const [durationSec, setDurationSec] = useState(40);

  useEffect(() => {
    const el = trackRef.current;

    const measure = () => {
      const node = trackRef.current || el;
      if (!node) return;
      const w = node.scrollWidth || 1;
      const pxps = Math.max(20, speedPxPerSec);
      setDurationSec(w / pxps);
    };

    measure();
    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 250);

    const ro = "ResizeObserver" in window ? new ResizeObserver(measure) : null;
    if (ro && el) ro.observe(el);

    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
      if (ro && el) ro.unobserve(el);
      if (ro) ro.disconnect();
    };
  }, [safe, speedPxPerSec]);

  const style = { "--ticker-duration": `${durationSec}s` };

  const renderTrack = (keyPrefix = "a") => {
    const out = [];
    safe.forEach((t, i) => {
      out.push(
        <span className="ticker-item" key={`${keyPrefix}-i-${i}`}>
          {t}
        </span>
      );
      if (i !== safe.length - 1) {
        out.push(
          <span className="ticker-sep" aria-hidden="true" key={`${keyPrefix}-s-${i}`}>
            •
          </span>
        );
      }
    });
    return out;
  };

  return (
    <div className={`ticker ${live ? "ticker--live" : ""}`} aria-label="Market News">
      <div className="ticker-header">
        <h3 className="ticker-title">Market News</h3>
        {live && (
          <span className="ticker-badge" aria-hidden="true">
            <span className="pulse-dot" />
            LIVE
          </span>
        )}
      </div>
      <div className="ticker-viewport">
        <div className="ticker-track" ref={trackRef} style={style}>
          {renderTrack("a")}
        </div>
        <div className="ticker-track" aria-hidden="true" style={style}>
          {renderTrack("b")}
        </div>
      </div>
    </div>
  );
}
