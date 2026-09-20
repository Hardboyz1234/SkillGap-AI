import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RefreshCw, TrendingUp } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ReadinessGauge from "../components/ReadinessGauge";
import Sparkline from "../components/Sparkline";
import SkillGapCard from "../components/SkillGapCard";
import SkillHighlightsCard from "../components/SkillHighlightsCard";
import LearningPathCard from "../components/LearningPathCard";
import RecommendedActionsCard from "../components/RecommendedActionsCard";
import ChatWidget from "../components/ChatWidget";
import { getAnalysis, getProgressHistory, listAnalyses } from "../api/client";

export default function DashboardPage() {
  const { analysisId } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [progress, setProgress] = useState([]);
  const [learningSteps, setLearningSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (id) => {
      setLoading(true);
      setError(null);
      try {
        let targetId = id;
        if (!targetId) {
          const all = await listAnalyses();
          if (cancelled) return;
          if (all.length === 0) {
            navigate("/onboarding");
            return;
          }
          targetId = all[0].id;
        }
        const [analysisData, progressData] = await Promise.all([
          getAnalysis(targetId),
          getProgressHistory(),
        ]);
        if (cancelled) return; // a newer navigation already superseded this request
        setAnalysis(analysisData);
        setLearningSteps(analysisData.learning_steps);
        setProgress(progressData.map((p) => p.readiness_score));
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.detail || "Couldn't load your diagnostic.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load(analysisId);
    return () => {
      cancelled = true;
    };
  }, [analysisId, navigate]);

  const loadData = () => {
    // Manual "Refresh Diagnostic" click — simplest correct way to reuse
    // the same loading logic is to re-run with the current analysisId.
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [analysisData, progressData] = await Promise.all([
          getAnalysis(analysisId || analysis?.id),
          getProgressHistory(),
        ]);
        setAnalysis(analysisData);
        setLearningSteps(analysisData.learning_steps);
        setProgress(progressData.map((p) => p.readiness_score));
      } catch (err) {
        setError(err?.response?.data?.detail || "Couldn't load your diagnostic.");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleStepUpdated = (stepId, nextStatus) => {
    setLearningSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status: nextStatus } : s))
    );
  };

  const skillGaps = analysis?.skill_gaps ?? [];
  const activeGaps = skillGaps.filter((s) => s.gap > 15).length;
  const validated = skillGaps.filter((s) => s.gap <= 15).length;
  const estEffort = learningSteps.reduce((sum, s) => sum + (s.estimated_hours || 0), 0);
  const growthPct =
    progress.length >= 2
      ? Math.round(
          ((progress[progress.length - 1] - progress[0]) / Math.max(progress[0], 1)) * 100
        )
      : null;

  return (
    <div className="flex h-screen w-full bg-bg">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">Diagnostic Overview</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Target role:{" "}
              <span className="font-medium text-cyan-300">
                {analysis?.target_job || "—"}
              </span>
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Diagnostic
          </button>
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <div className="mt-16 flex justify-center text-sm text-ink-faint">
            Loading your diagnostic&hellip;
          </div>
        ) : analysis ? (
          <>
            {/* Top stats row */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="card-surface flex items-center gap-4 rounded-2xl p-5">
                <ReadinessGauge score={analysis.overall_readiness_score || 0} />
                <div>
                  <p className="text-xs text-ink-faint">Overall Readiness Score</p>
                  <p className="text-base font-semibold text-ink">
                    {analysis.overall_readiness_score >= 75
                      ? "Ready to Apply"
                      : analysis.overall_readiness_score >= 50
                      ? "Approaching Threshold"
                      : "Building Foundation"}
                  </p>
                  <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-ink-faint">
                    {analysis.summary}
                  </p>
                </div>
              </div>

              <div className="card-surface flex items-center gap-4 rounded-2xl p-5">
                {progress.length >= 2 ? (
                  <Sparkline data={progress} />
                ) : (
                  <div className="flex h-12 w-24 items-center justify-center text-ink-faint">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-ink-faint">Improvement Trend</p>
                  <p className="text-base font-semibold text-ink">
                    {growthPct !== null ? `${growthPct >= 0 ? "+" : ""}${growthPct}% Growth` : "—"}
                  </p>
                  <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-ink-faint">
                    Readiness score trend across your diagnostic runs.
                  </p>
                </div>
              </div>

              <div className="card-surface grid grid-cols-3 gap-2 rounded-2xl p-5">
                <Stat label="Active Gaps" value={activeGaps} color="text-amber-400" />
                <Stat label="Validated" value={validated} color="text-emerald-400" />
                <Stat label="Est Effort" value={`${estEffort} hrs`} color="text-violet-400" />
              </div>
            </div>

            {/* Skill gap + highlights */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
              <SkillGapCard targetJob={analysis.target_job} skillGaps={analysis.skill_gaps} />
              <SkillHighlightsCard skillGaps={analysis.skill_gaps} />
            </div>

            {/* Learning path + recommended actions */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
              <LearningPathCard steps={learningSteps} onStepUpdated={handleStepUpdated} />
              <RecommendedActionsCard steps={learningSteps} />
            </div>
          </>
        ) : null}
      </main>

      <ChatWidget analysisId={analysis?.id} />
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="flex flex-col justify-center">
      <span className={`text-lg font-semibold ${color}`}>{value}</span>
      <span className="text-[11px] text-ink-faint">{label}</span>
    </div>
  );
}
