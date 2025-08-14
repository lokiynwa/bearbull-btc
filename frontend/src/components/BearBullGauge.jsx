import React, { useId } from "react";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import bear from "../assets/bear.png";
import bull from "../assets/bull.png";

function lerpHex(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const pc = pa.map((ca, i) => Math.round(ca + (pb[i] - ca) * t));
  return `#${pc.map(x => x.toString(16).padStart(2, "0")).join("")}`;
}

function colourAtValue(v) {
  const clamped = Math.max(0, Math.min(100, v));
  const mid = 50;
  const RED = "#ff2d2d";
  const ORG = "#ffb400";
  const GRN = "#00c853";
  if (clamped <= mid) return lerpHex(RED, ORG, clamped / mid);
  return lerpHex(ORG, GRN, (clamped - mid) / mid);
}

export default function BearBullGauge({ value = 0, label = "" }) {
  const v = Math.max(0, Math.min(100, value));
  const gradId = useId();
  const rotationTurn = 0.75;
  const rotationDeg = rotationTurn * 360;
  const counterRotate = -rotationDeg;
  const strokeWidth = 11;
  const currentColour = colourAtValue(v);

  return (
    <div className="gauge-wrap" aria-label="Bitcoin sentiment gauge">
      <img className="side-img side-img--left" src={bear} alt="" />
      <img className="side-img side-img--right" src={bull} alt="" />
      <div className="gauge-box">
        <CircularProgressbarWithChildren
          value={v}
          minValue={0}
          maxValue={100}
          circleRatio={0.5}
          strokeWidth={strokeWidth}
          styles={buildStyles({
            rotation: rotationTurn,
            strokeLinecap: "round",
            trailColor: "#2a2a2a",
            pathColor: `url(#gaugeGradient-${gradId})`,
          })}
        >
          <div className="gauge-number" style={{ color: currentColour }}>{v}</div>
          <div className="gauge-status" style={{ color: currentColour }}>{label}</div>
        </CircularProgressbarWithChildren>
        <div className="gauge-ticks" aria-hidden="true">
          <span>0</span><span>100</span>
        </div>
      </div>
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <linearGradient
            id={`gaugeGradient-${gradId}`}
            gradientUnits="userSpaceOnUse"
            x1="0" y1="50"
            x2="100" y2="50"
            gradientTransform={`rotate(${counterRotate} 50 50)`}
            spreadMethod="pad"
          >
            <stop offset="0%" stopColor="#ff2d2d" />
            <stop offset="50%" stopColor="#ffb400" />
            <stop offset="100%" stopColor="#00c853" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
