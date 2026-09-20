export default function SkillHighlightsCard({ skillGaps }) {
  const strongest = [...skillGaps].sort((a, b) => a.gap - b.gap).slice(0, 2);
  const weakest = [...skillGaps]
    .filter((s) => s.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2);

  return (
    <div className="card-surface rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-ink">Skill Highlights</h3>

      <div className="mt-5">
        <p className="text-xs font-medium tracking-wide text-emerald-400">STRONGEST MATCHES</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {strongest.length === 0 && <span className="text-xs text-ink-faint">—</span>}
          {strongest.map((s) => (
            <span
              key={s.id}
              className="rounded-full border border-emerald-500/40 bg-emerald-500/5 px-2.5 py-1 text-xs font-medium text-emerald-300"
            >
              {s.skill_name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium tracking-wide text-amber-400">CRITICAL DEFICIENCIES</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {weakest.length === 0 && <span className="text-xs text-ink-faint">None — nice work.</span>}
          {weakest.map((s) => (
            <span
              key={s.id}
              className="rounded-full border border-amber-500/40 bg-amber-500/5 px-2.5 py-1 text-xs font-medium text-amber-300"
            >
              {s.skill_name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
