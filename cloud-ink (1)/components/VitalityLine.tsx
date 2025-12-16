import React from 'react';

const VitalityLine: React.FC = () => (
  <div className="absolute inset-0 w-full h-full overflow-hidden">
    <svg
      className="absolute top-1/2 left-0 w-[200%] h-auto -translate-y-1/2 animate-pulse-line text-cyan-400/80 [filter:drop-shadow(0_0_4px_theme(colors.cyan.500))]"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1600 100"
      preserveAspectRatio="none"
    >
      <path
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        d="M0 50 h150 l30 20 l40 -40 l30 20 h100 q10 0 20 -10 t20 10 h100 l30 20 l40 -40 l30 20 h150"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        transform="translate(800, 0)"
        d="M0 50 h150 l30 20 l40 -40 l30 20 h100 q10 0 20 -10 t20 10 h100 l30 20 l40 -40 l30 20 h150"
      />
    </svg>
  </div>
);

export default VitalityLine;