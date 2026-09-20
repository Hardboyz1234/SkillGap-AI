import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      navigate("/onboarding");
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, #171b3d 0%, #0d1024 55%, #060814 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card-surface rounded-2xl p-6">
          <h1 className="text-lg font-semibold text-ink">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {mode === "login"
              ? "Log in to see your skill-gap diagnostic."
              : "Start mapping your pathway to the role you want."}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-faint">
                  FULL NAME
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Alexander Smith"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-faint">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-faint">
                PASSWORD
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 60%, #7c3aed 100%)" }}
            >
              {loading ? "Please wait\u2026" : mode === "login" ? "Log in" : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="mt-4 w-full text-center text-xs text-ink-faint hover:text-ink"
          >
            {mode === "login"
              ? "New here? Create an account"
              : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
