import React, { useEffect, useMemo, useRef, useState } from "react";

export default function NewsTicker({ items = [], speedPxPerSec = 80 }) {
  const safe = useMemo(() => items.filter(Boolean), [items]);
  const trackRef = useRef(null);
  const [durationSec, setDurationSec] = useState(40);

  useEffect(() => {
    function measure() {
      const el = trackRef.current;
      if (!el) return;
      const w = el.scrollWidth || 1;
      const pxps = Math.max(20, speedPxPerSec);
      setDurationSec(w / pxps);
    }
    measure();
    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 250);
    const ro = "ResizeObserver" in window ? new ResizeObserver(measure) : null;
    if (ro && trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro && trackRef.current) ro.disconnect();
      window.removeEventListener("resize", measure);
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
    <div className="ticker" aria-label="Market News">
      <div className="ticker-header">
        <h3 className="ticker-title">Market News</h3>
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
