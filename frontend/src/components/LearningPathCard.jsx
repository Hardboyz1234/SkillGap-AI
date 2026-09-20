import { Check } from "lucide-react";
import { updateStepStatus } from "../api/client";

export default function LearningPathCard({ steps, onStepUpdated }) {
  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);

  const toggle = async (step) => {
    const nextStatus = step.status === "done" ? "not_started" : "done";
    try {
      await updateStepStatus(step.id, nextStatus);
      onStepUpdated?.(step.id, nextStatus);
    } catch {
      // silently ignore — the toggle just won't stick visually
    }
  };

  return (
    <div className="card-surface rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Personalized Learning Path</h3>
        <button className="rounded-full border border-violet-500/40 px-3 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/10">
          View All
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {sorted.length === 0 && (
          <p className="text-sm text-ink-faint">No steps yet — run a diagnostic to generate a path.</p>
        )}
        {sorted.map((step) => {
          const done = step.status === "done";
          return (
            <button
              key={step.id}
              onClick={() => toggle(step)}
              className="flex w-full items-start gap-3 text-left"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  done
                    ? "border-cyan-400 bg-cyan-400 text-bg"
                    : "border-white/20 text-transparent"
                }`}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm ${done ? "text-ink-faint line-through" : "text-ink"}`}
                >
                  {step.title}
                </span>
                <span className="mt-0.5 block text-xs text-ink-faint">
                  {step.estimated_hours ? `${step.estimated_hours} hours` : ""}
                  {step.estimated_hours && step.description ? " \u00b7 " : ""}
                  {step.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
