import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Route,
  FlaskConical,
  FileText,
  Settings,
  ShieldAlert,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { deleteMyAccount } from "../api/client";

const NAV_ITEMS = [
  { label: "Career Dashboard", icon: LayoutDashboard, active: true },
  { label: "Gap Diagnosis", icon: Target },
  { label: "Learning Path", icon: Route },
  { label: "Project Sandbox", icon: FlaskConical },
  { label: "Resume Refinement", icon: FileText },
  { label: "Settings", icon: Settings, isSettings: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
    } finally {
      logout();
      navigate("/auth");
    }
  };

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col justify-between border-r border-white/5 bg-sidebar px-4 py-6">
      <div>
        <div className="px-2">
          <Logo size="sm" />
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, icon: Icon, active, isSettings }) => (
            <button
              key={label}
              onClick={() => isSettings && setShowSettings(true)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                active
                  ? "bg-violet-500/15 font-medium text-violet-300"
                  : "text-ink-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-xs font-semibold text-white">
          {(user?.full_name || user?.email || "U").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">
            {user?.full_name || "Your account"}
          </p>
          <p className="truncate text-xs text-ink-faint">{user?.email}</p>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Privacy &amp; Data</h3>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setConfirming(false);
                }}
                className="text-ink-faint hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Your resume text, GitHub snapshots, skill-gap reports, and chat
              history are private to your account and are never shared. You
              can permanently delete all of it at any time.
            </p>

            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20"
              >
                <ShieldAlert className="h-4 w-4" />
                Delete my account &amp; all data
              </button>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  This permanently deletes your account, resume data, GitHub
                  snapshots, reports, and chat history. This cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {deleting ? "Deleting\u2026" : "Yes, permanently delete everything"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="w-full rounded-lg border border-card-border py-2.5 text-sm text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
