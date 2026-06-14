"use client";

import { scoreTone, statusForScore } from "@/lib/scoring";
import type { DailyLog } from "@/lib/types";

type DomainNode = {
  label: string;
  value: number;
  detail: string;
  x: number;
  y: number;
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const avg = (values: number[]) => (values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0);

function weeklyNodes(logs: DailyLog[]): DomainNode[] {
  const gymDays = logs.filter((log) => log.gym_done).length;
  const dietDays = logs.filter((log) => log.diet_followed).length;
  const cleanDays = logs.filter((log) => !log.porn_relapse).length;
  const count = Math.max(logs.length, 1);

  return [
    {
      label: "Physique",
      value: avg(logs.map((log) => log.physique_score)),
      detail: `${gymDays}/${count} gym days`,
      x: 50,
      y: 14
    },
    {
      label: "Career",
      value: avg(logs.map((log) => log.career_score)),
      detail: `${logs.reduce((total, log) => total + log.dsa_minutes + log.nirmiq_minutes, 0)}m DSA+NIRMIQ`,
      x: 84,
      y: 35
    },
    {
      label: "Discipline",
      value: avg(logs.map((log) => log.discipline_score)),
      detail: `${dietDays}/${count} diet days`,
      x: 72,
      y: 78
    },
    {
      label: "Dopamine",
      value: avg(logs.map((log) => log.dopamine_score)),
      detail: `${cleanDays}/${count} clean days`,
      x: 28,
      y: 78
    },
    {
      label: "Self-Respect",
      value: avg(logs.map((log) => log.self_respect_score)),
      detail: `${avg(logs.map((log) => log.self_respect))}/10 rating`,
      x: 16,
      y: 35
    }
  ];
}

function nodeColor(value: number) {
  if (value >= 75) return "#6EE7B7";
  if (value >= 60) return "#A5F3FC";
  if (value >= 40) return "#FCD34D";
  return "#F87171";
}

function Timeline({ logs }: { logs: DailyLog[] }) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  const points = sorted.map((log, index) => {
    const x = sorted.length <= 1 ? 50 : (index / (sorted.length - 1)) * 100;
    const y = 100 - clamp(log.execution_score);
    return `${x},${y}`;
  });

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">Execution Timeline</p>
          <p className="text-xs text-ghost">Last {sorted.length || 0} logged days</p>
        </div>
        <p className="text-xs text-muted">0-100</p>
      </div>
      {sorted.length ? (
        <>
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label="Line chart of execution score over recent daily logs"
            className="h-56 w-full overflow-visible"
            preserveAspectRatio="none"
          >
            {[25, 50, 75].map((line) => (
              <line key={line} x1="0" x2="100" y1={100 - line} y2={100 - line} stroke="#27272A" strokeWidth="0.7" />
            ))}
            {points.length > 1 ? (
              <polyline points={points.join(" ")} fill="none" stroke="#A5F3FC" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
            ) : null}
            {sorted.map((log, index) => {
              const x = sorted.length <= 1 ? 50 : (index / (sorted.length - 1)) * 100;
              const y = 100 - clamp(log.execution_score);
              return (
                <g key={log.date}>
                  <circle cx={x} cy={y} r="2.8" fill={nodeColor(log.execution_score)} vectorEffect="non-scaling-stroke" />
                  <title>{`${log.date}: ${log.execution_score}`}</title>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-ghost">
            <span>{sorted[0]?.date}</span>
            <span className="text-center">Proof trail</span>
            <span className="text-right">{sorted[sorted.length - 1]?.date}</span>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-panel2 p-5 text-sm text-muted">
          No graph yet. Log proof first.
        </div>
      )}
    </div>
  );
}

function NodeGraph({ logs }: { logs: DailyLog[] }) {
  const nodes = weeklyNodes(logs);
  const execution = avg(logs.map((log) => log.execution_score));

  return (
    <div className="panel p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-text">Memory Graph</p>
        <p className="text-xs text-ghost">Weekly performance map. Strong nodes feed identity. Weak nodes leak proof.</p>
      </div>
      {logs.length ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label="Performance memory graph connecting execution to physique, career, discipline, dopamine, and self-respect"
            className="h-80 w-full"
          >
            <defs>
              <radialGradient id="coreGlow">
                <stop offset="0%" stopColor="#A5F3FC" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="27" fill="url(#coreGlow)" />
            {nodes.map((node) => (
              <line
                key={`${node.label}-edge`}
                x1="50"
                y1="50"
                x2={node.x}
                y2={node.y}
                stroke={nodeColor(node.value)}
                strokeOpacity={0.18 + node.value / 160}
                strokeWidth="1.4"
              />
            ))}
            <circle cx="50" cy="50" r="11" fill="#050505" stroke="#A5F3FC" strokeWidth="1.2" />
            <text x="50" y="48" textAnchor="middle" fill="#F4F4F5" fontSize="6" fontWeight="700">
              {execution}
            </text>
            <text x="50" y="55" textAnchor="middle" fill="#A1A1AA" fontSize="3.4">
              EXECUTION
            </text>
            {nodes.map((node) => {
              const radius = 6 + node.value / 18;
              return (
                <g key={node.label}>
                  <circle cx={node.x} cy={node.y} r={radius} fill="#111111" stroke={nodeColor(node.value)} strokeWidth="1" />
                  <text x={node.x} y={node.y - 1} textAnchor="middle" fill="#F4F4F5" fontSize="3.6" fontWeight="700">
                    {node.value}
                  </text>
                  <text x={node.x} y={node.y + 4.2} textAnchor="middle" fill="#A1A1AA" fontSize="2.8">
                    {node.label}
                  </text>
                  <title>{`${node.label}: ${node.value}. ${node.detail}`}</title>
                </g>
              );
            })}
          </svg>

          <div className="grid content-start gap-2">
            <div>
              <p className={`text-4xl font-semibold tabular-nums ${scoreTone(execution)}`}>{execution}</p>
              <p className="mt-1 text-sm text-muted">{statusForScore(execution)}</p>
            </div>
            {nodes
              .sort((a, b) => a.value - b.value)
              .map((node) => (
                <div key={node.label} className="rounded-md border border-line bg-panel2 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text">{node.label}</p>
                    <p className="text-sm font-semibold" style={{ color: nodeColor(node.value) }}>
                      {node.value}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted">{node.detail}</p>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-panel2 p-5 text-sm text-muted">
          No memory yet. Your graph forms after daily proof.
        </div>
      )}
    </div>
  );
}

export function MemoryGraph({ logs }: { logs: DailyLog[] }) {
  return (
    <div className="grid gap-4">
      <NodeGraph logs={logs.slice(0, 7)} />
      <Timeline logs={logs} />
      {logs.length ? (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <caption className="sr-only">Daily score table backing the memory graph</caption>
            <thead className="bg-panel2 text-xs uppercase text-ghost">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Execution</th>
                <th className="px-3 py-2">Discipline</th>
                <th className="px-3 py-2">Career</th>
                <th className="px-3 py-2">Dopamine</th>
                <th className="px-3 py-2">Physique</th>
                <th className="px-3 py-2">Self-respect</th>
              </tr>
            </thead>
            <tbody>
              {[...logs]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 14)
                .map((log) => (
                  <tr key={log.date} className="border-t border-line text-muted">
                    <td className="px-3 py-2 text-text">{log.date}</td>
                    <td className="px-3 py-2">{log.execution_score}</td>
                    <td className="px-3 py-2">{log.discipline_score}</td>
                    <td className="px-3 py-2">{log.career_score}</td>
                    <td className="px-3 py-2">{log.dopamine_score}</td>
                    <td className="px-3 py-2">{log.physique_score}</td>
                    <td className="px-3 py-2">{log.self_respect_score}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
