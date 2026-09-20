import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Briefcase, ArrowRight, X } from "lucide-react";
import GithubMark from "../components/GithubMark";
import Logo from "../components/Logo";
import { createAnalysis } from "../api/client";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [targetJob, setTargetJob] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    if (file) setResumeFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetJob.trim()) {
      setError("Tell us the role you're targeting first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("target_job", targetJob);
      if (githubUsername) formData.append("github_username", githubUsername);
      if (projectDescription) formData.append("project_description", projectDescription);
      if (resumeFile) formData.append("resume", resumeFile);

      const analysis = await createAnalysis(formData);
      navigate(`/dashboard/${analysis.id}`);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Something went wrong running your diagnostic. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-bg">
      {/* Left: hero / pitch */}
      <div
        className="relative flex flex-col justify-between px-10 py-12 lg:px-16 lg:py-16"
        style={{
          background:
            "radial-gradient(120% 120% at 0% 0%, #171b3d 0%, #0d1024 55%, #080a1c 100%)",
        }}
      >
        <div>
          <Logo />

          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-3 py-1 text-xs font-medium tracking-wide text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            AI-DRIVEN CAREER INTELLIGENCE
          </div>

          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-[1.1] text-ink lg:text-[2.75rem]">
            Map your pathway to the role you want.
          </h1>

          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-muted">
            Upload your career artifacts. Our diagnostic agent parses your
            experience, compares it to gathering thresholds, and builds a
            targeted, project-based learning pathway to fit your goals.
          </p>
        </div>

        <div className="mt-12 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-ink-faint">
              DIAGNOSTIC TARGET
            </span>
            <span className="text-xs font-medium text-violet-400">Backend Developer</span>
          </div>

          <div className="space-y-3">
            <TargetRow label="Python" tag="(Ready)" percent={94} color="cyan" />
            <TargetRow label="Docker" percent={38} color="amber" badge="GAP" />
          </div>
        </div>

        <p className="mt-10 max-w-sm text-xs text-ink-faint">
          SkillGap.AI is an evaluative career-intelligence engine. All data stays
          private to your account and is powered by Gemini models.
        </p>
      </div>

      {/* Right: configuration form */}
      <div className="flex items-center justify-center bg-panel px-6 py-12 lg:px-16">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-ink">Configure your career profile</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Provide your targets and documents below to run your AI diagnostic.
          </p>

          <Field label="Target job description / role">
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder="Backend Developer"
                className="w-full rounded-lg border border-card-border bg-card py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </Field>

          <Field label="Resume upload">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
                dragActive
                  ? "border-violet-400 bg-violet-500/10"
                  : "border-violet-500/30 bg-card"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {resumeFile ? (
                <>
                  <UploadCloud className="h-5 w-5 text-violet-400" />
                  <span className="text-sm font-medium text-ink">{resumeFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setResumeFile(null);
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink"
                  >
                    <X className="h-3 w-3" /> Remove and choose another file
                  </button>
                </>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5 text-violet-400" />
                  <span className="text-sm text-ink-muted">
                    Click to browse or drag and drop your resume
                  </span>
                  <span className="text-xs text-ink-faint">PDF, DOCX, or TXT</span>
                </>
              )}
            </label>
          </Field>

          <Field label="GitHub information">
            <div className="relative">
              <GithubMark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="github-username"
                className="w-full rounded-lg border border-card-border bg-card py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </Field>

          <Field label="Project & experience overview (optional)">
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              placeholder="Developed high-traffic microservices using Python and Flask. Deployed on PostgreSQL, achieved integration latency, or mention completed or missed operations."
              className="w-full resize-none rounded-lg border border-card-border bg-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </Field>

          {error && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 60%, #7c3aed 100%)" }}
          >
            {loading ? "Running diagnostic\u2026" : "Launch AI Skill-Gap Analysis"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mt-5">
      <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-faint">
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

function TargetRow({ label, tag, percent, color, badge }) {
  const barColor = color === "cyan" ? "bg-cyan-400" : "bg-amber-500";
  const textColor = color === "cyan" ? "text-cyan-300" : "text-amber-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-ink-muted">
        {label} {tag && <span className="text-ink-faint">{tag}</span>}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
      <span className={`w-9 shrink-0 text-right text-xs font-medium ${textColor}`}>
        {percent}%
      </span>
      {badge && (
        <span className="rounded border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
          {badge}
        </span>
      )}
    </div>
  );
}
