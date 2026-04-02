import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../api";
import senseiLogo from "../assets/sensei.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginUser({ email, password });
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E')"
      }}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-4">
            <img src={senseiLogo} alt="Sensei" className="w-20 h-20" />
            <h1 className="text-3xl font-['Manrope'] font-bold text-[#cdc0ec]">Sensei</h1>
          </div>
          <p className="text-[#acabaa] text-sm">Welcome back to your learning journey</p>
        </div>

        <div className="bg-[#131313] border border-[#484848]/20 rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-['Manrope'] font-semibold text-[#e7e5e5] mb-2">Sign In</h2>
          <p className="text-sm text-[#acabaa] mb-6">Enter your credentials to continue</p>

          <form onSubmit={onLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-[#7f2737]/20 border border-[#ec7c8a]/30 rounded-lg p-3">
                <p className="text-sm text-[#ec7c8a]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#acabaa]">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#cdc0ec] hover:text-[#bfb2de] font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
