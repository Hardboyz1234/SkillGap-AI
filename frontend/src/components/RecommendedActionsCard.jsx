import { FlaskConical, BookOpen, ExternalLink } from "lucide-react";

export default function RecommendedActionsCard({ steps }) {
  const withLinks = steps.filter((s) => s.resource_url).slice(0, 3);

  return (
    <div className="card-surface rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-ink">Recommended Actions</h3>

      <div className="mt-4 space-y-2">
        {withLinks.length === 0 && (
          <p className="text-sm text-ink-faint">Resources will appear here after your diagnostic.</p>
        )}
        {withLinks.map((step, i) => (
          <a
            key={step.id}
            href={step.resource_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm text-ink-muted transition-colors hover:border-violet-500/30 hover:text-ink"
          >
            {i % 2 === 0 ? (
              <FlaskConical className="h-4 w-4 shrink-0 text-cyan-400" />
            ) : (
              <BookOpen className="h-4 w-4 shrink-0 text-violet-400" />
            )}
            <span className="min-w-0 flex-1 truncate">{step.title}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
          </a>
        ))}
      </div>
    </div>
  );
}
