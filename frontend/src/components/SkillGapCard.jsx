export default function SkillGapCard({ targetJob, skillGaps }) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          {targetJob ? `${targetJob} Skill-Gap Analysis` : "Skill-Gap Analysis"}
        </h3>
        <div className="flex gap-1 text-xs">
          <button className="rounded-md bg-white/5 px-2.5 py-1 text-ink-muted hover:bg-white/10">
            Priority
          </button>
          <button className="rounded-md px-2.5 py-1 text-ink-faint hover:bg-white/5">
            Recent &amp; Curated
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {skillGaps.length === 0 && (
          <p className="text-sm text-ink-faint">No skill data yet — run a diagnostic to populate this.</p>
        )}
        {skillGaps.map((sg) => {
          const isGap = sg.gap > 15;
          const barColor = isGap ? "bg-amber-500" : "bg-cyan-400";
          const textColor = isGap ? "text-amber-400" : "text-cyan-300";
          return (
            <div key={sg.id} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-ink-muted" title={sg.skill_name}>
                {sg.skill_name}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${sg.current_level}%` }}
                />
              </div>
              <span className={`w-9 shrink-0 text-right text-xs font-medium ${textColor}`}>
                {sg.current_level}%
              </span>
              {isGap && (
                <span className="rounded border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                  GAP
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
