'use client';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle } from 'lucide-react';

interface Props {
  score: number; // 0–100
  loading?: boolean;
}

const zones = [
  { label: 'Calm', color: '#26de81', min: 0, max: 25 },
  { label: 'Mild Stress', color: '#F7B731', min: 25, max: 50 },
  { label: 'Moderate', color: '#FFA500', min: 50, max: 75 },
  { label: 'High Risk', color: '#FC5C65', min: 75, max: 100 },
];

function getZone(score: number) {
  return zones.find(z => score <= z.max) || zones[3];
}

// Convert score (0–100) to angle (-180 to 0 degrees on semicircle)
function scoreToAngle(score: number) {
  return -180 + (score / 100) * 180;
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function DistressGauge({ score, loading = false }: Props) {
  const zone = getZone(score);
  const needleAngle = scoreToAngle(score);
  const cx = 100, cy = 100, r = 70;

  // Needle tip
  const rad = ((needleAngle - 90) * Math.PI) / 180;
  const nx = cx + (r - 8) * Math.cos(rad);
  const ny = cy + (r - 8) * Math.sin(rad);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl bg-card border border-white/10 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-body font-semibold text-text-primary">Distress Gauge</h2>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <svg viewBox="20 30 160 90" className="w-52">
              {/* Background arc */}
              <path
                d={arcPath(cx, cy, r, -180, 0)}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Colored zone arcs */}
              {zones.map((z) => {
                const startDeg = -180 + (z.min / 100) * 180;
                const endDeg = -180 + (z.max / 100) * 180;
                return (
                  <path
                    key={z.label}
                    d={arcPath(cx, cy, r, startDeg, endDeg - 1)}
                    fill="none"
                    stroke={z.color}
                    strokeWidth="14"
                    strokeLinecap="butt"
                    opacity="0.35"
                  />
                );
              })}

              {/* Active arc up to score */}
              <path
                d={arcPath(cx, cy, r, -180, scoreToAngle(score))}
                fill="none"
                stroke={zone.color}
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* Needle */}
              <motion.line
                initial={{ rotate: -180, originX: `${cx}px`, originY: `${cy}px` }}
                animate={{
                  rotate: 0,
                  transition: { delay: 0.4, duration: 1, type: 'spring', stiffness: 80 },
                }}
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transformOrigin: `${cx}px ${cy}px`, rotate: `${needleAngle + 180}deg` } as React.CSSProperties}
              />
              <circle cx={cx} cy={cy} r="4" fill="white" opacity="0.9" />

              {/* Score text */}
              <text x={cx} y={cy + 22} textAnchor="middle" fill="white" fontSize="18" fontWeight="600" opacity="0.9">
                {score}
              </text>
              <text x={cx} y={cy + 32} textAnchor="middle" fill="#94A3B8" fontSize="7">
                / 100
              </text>
            </svg>
          </div>

          <div className="text-center -mt-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-medium"
              style={{ backgroundColor: zone.color + '22', color: zone.color, border: `1px solid ${zone.color}44` }}
            >
              {score >= 75 && <AlertTriangle className="w-3 h-3" />}
              {zone.label}
            </span>
            <p className="text-xs text-muted mt-2">Based on recent journal & chat analysis</p>
          </div>

          {/* Zone legend */}
          <div className="mt-3 grid grid-cols-4 gap-1">
            {zones.map((z) => (
              <div key={z.label} className="flex flex-col items-center gap-1">
                <div className="w-full h-1 rounded-full" style={{ backgroundColor: z.color, opacity: zone.label === z.label ? 1 : 0.3 }} />
                <span className="text-xs text-muted" style={{ color: zone.label === z.label ? z.color : undefined }}>
                  {z.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
