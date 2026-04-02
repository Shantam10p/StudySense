import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signupUser } from "../api";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await signupUser({ name, email, password });
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to sign up");
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
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#4b4166] rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-[#cdc0ec]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-['Manrope'] font-bold text-[#cdc0ec]">Sensei</h1>
          </div>
          <p className="text-[#acabaa] text-sm">Start your personalized learning journey</p>
        </div>

        <div className="bg-[#131313] border border-[#484848]/20 rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-['Manrope'] font-semibold text-[#e7e5e5] mb-2">Create Account</h2>
          <p className="text-sm text-[#acabaa] mb-6">Join Sensei and unlock your potential</p>

          <form onSubmit={onSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>

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
                placeholder="At least 8 characters"
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#acabaa]">
              Already have an account?{" "}
              <Link to="/login" className="text-[#cdc0ec] hover:text-[#bfb2de] font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
