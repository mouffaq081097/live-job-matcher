"use client";

import { motion, useReducedMotion } from "motion/react";

const SIZE = 200;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function MarketValueGauge({ value = 72 }: { value?: number }) {
  const reduce = useReducedMotion();
  const pct = Math.min(100, Math.max(0, value));
  const offset = C - (pct / 100) * C;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            initial={reduce ? false : { strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: reduce ? 0 : 1.2, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {pct}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Job search strength
          </span>
        </div>
      </div>
      <p className="mt-4 max-w-[16rem] text-center text-sm text-slate-500 dark:text-zinc-400">
        Calibrated against recent UAE hiring velocity and your CV signals.
      </p>
    </div>
  );
}
