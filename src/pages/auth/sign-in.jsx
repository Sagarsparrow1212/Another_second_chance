import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard/home");
    }
  }, [isAuthenticated, navigate]);

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_admin_email");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        if (rememberMe) {
          localStorage.setItem("remembered_admin_email", email.trim());
        } else {
          localStorage.removeItem("remembered_admin_email");
        }
        navigate("/dashboard/home");
      } else {
        setError(result.message || "Invalid credentials. Please verify and try again.");
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setError("An unexpected error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#F8FAFC] antialiased text-[#172033] font-sans selection:bg-[#3987F6]/20 selection:text-[#101B35]">
      
      {/* =========================================================================
          LEFT PANEL: BRANDING & VISUAL STORYTELLING (48% on Desktop)
          ========================================================================= */}
      <div className="hidden lg:flex lg:w-[48%] h-full relative flex-col justify-between overflow-hidden bg-[#101B35] text-white p-8 xl:p-12 border-r border-[#17294B]/60 select-none">
        {/* Subtle radial ambient glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#3987F6]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-4 right-0 w-96 h-96 rounded-full bg-[#17294B] blur-3xl opacity-60" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-[#75D9F5]/10 blur-3xl" />

        {/* Subtle geometric dot grid background overlay */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#FFFFFF 1px, transparent 1px)`,
            backgroundSize: "24px 24px"
          }}
        />

        {/* Top Header / Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#3987F6] to-[#75D9F5] p-0.5 shadow-md shadow-[#3987F6]/20 flex items-center justify-center shrink-0">
            <div className="h-full w-full bg-[#101B35] rounded-[10px] flex items-center justify-center">
              <img
                src="/img/Logo/HomelyHopeIcon.png"
                alt="Another Second Chance"
                className="h-5 w-5 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <HeartHandshake className="hidden h-5 w-5 text-[#3987F6]" />
            </div>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white block leading-tight">
              Another Second Chance
            </span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#75D9F5]/90">
              Administrative Portal
            </span>
          </div>
        </div>

        {/* Center Content & Editorial Visual */}
        <div className="relative z-10 my-auto py-2 xl:py-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#17294B]/80 border border-[#3987F6]/25 text-[#75D9F5] text-xs font-semibold tracking-wide mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#3987F6]" />
            <span>Community Empowerment Platform</span>
          </div>

          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15] mb-3">
            Every Life Deserves <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E2E8F0] to-[#75D9F5]">
              Another Chance.
            </span>
          </h1>

          <p className="text-sm xl:text-base text-[#94A3B8] leading-relaxed max-w-md mb-6 font-normal">
            Connecting organizations, communities, and compassionate people to create
            meaningful opportunities and lasting change.
          </p>

          {/* Premium Visual Card: Ecosystem Overview */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#17294B]/90 to-[#101B35]/90 border border-white/10 p-4 xl:p-5 backdrop-blur-xl shadow-xl max-w-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                Ecosystem Activity
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Network
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 text-center">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <Building2 className="w-4 h-4 mx-auto mb-1.5 text-[#3987F6]" />
                <div className="text-sm font-bold text-white leading-tight">Organizations</div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Verified</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <HeartHandshake className="w-4 h-4 mx-auto mb-1.5 text-[#75D9F5]" />
                <div className="text-sm font-bold text-white leading-tight">Merchants</div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Providers</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <Users className="w-4 h-4 mx-auto mb-1.5 text-[#3987F6]" />
                <div className="text-sm font-bold text-white leading-tight">Donors</div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Advocates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Area: Trust Indicators */}
        <div className="relative z-10 pt-4 border-t border-[#17294B]">
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-[#94A3B8] font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3987F6]" />
              <span>Empowering Communities</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3987F6]" />
              <span>Connecting Organizations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3987F6]" />
              <span>Creating Opportunities</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: LOGIN EXPERIENCE (52% on Desktop, Full Width Mobile)
          ========================================================================= */}
      <div className="w-full lg:w-[52%] h-full flex flex-col justify-between p-6 sm:p-8 xl:p-10 overflow-hidden">
        
        {/* Mobile Header Branding (Shown only on small screens) */}
        <div className="lg:hidden flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <img
              src="/img/Logo/HomelyHopeIcon.png"
              alt="Another Second Chance"
              className="h-7 w-7 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <span className="font-bold text-[#101B35] text-sm tracking-tight">
              Another Second Chance
            </span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#2878E8]/10 text-[#2878E8]">
            Admin
          </span>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-[390px] xl:max-w-[420px] mx-auto my-auto">
          
          {/* Logo & Welcome Header */}
          <div className="text-center sm:text-left mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm mb-3.5 p-1.5">
              <img
                src="/img/Logo/HomelyHopeIcon.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <HeartHandshake className="hidden h-7 w-7 text-[#2878E8]" />
            </div>

            <h2 className="text-2xl xl:text-3xl font-bold text-[#172033] tracking-tight leading-tight">
              Welcome Back
            </h2>
            <p className="text-xs xl:text-sm text-[#718096] mt-1 font-normal">
              Sign in to access your administration portal.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50/90 border border-red-200/80 flex items-start gap-2.5 text-red-700 animate-fadeIn text-xs">
              <AlertCircle className="w-4 h-4 text-[#DC4444] shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {/* Email Input */}
            <div>
              <label 
                htmlFor="admin-email" 
                className="block text-xs xl:text-sm font-medium text-[#172033] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your email address"
                  className="w-full h-[46px] xl:h-[50px] pl-10 pr-4 rounded-xl border border-[#E2E8F0] bg-white text-[#172033] placeholder-[#718096]/70 text-xs xl:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#2878E8]/20 focus:border-[#2878E8] transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="admin-password" 
                className="block text-xs xl:text-sm font-medium text-[#172033] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password"
                  className="w-full h-[46px] xl:h-[50px] pl-10 pr-11 rounded-xl border border-[#E2E8F0] bg-white text-[#172033] placeholder-[#718096]/70 text-xs xl:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#2878E8]/20 focus:border-[#2878E8] transition-all duration-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#718096] hover:text-[#172033] focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Optional Recovery Link */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2878E8] focus:ring-[#2878E8]/30 transition"
                />
                <span className="text-xs xl:text-sm font-normal text-[#718096] hover:text-[#172033] transition-colors">
                  Remember me
                </span>
              </label>

              <span className="text-xs text-[#718096] hover:text-[#2878E8] cursor-pointer transition-colors font-medium">
                Need help?
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[48px] xl:h-[52px] rounded-xl bg-[#2878E8] hover:bg-[#1D65CE] active:bg-[#1752AA] text-white font-semibold text-sm xl:text-[15px] flex items-center justify-center gap-2 shadow-md shadow-[#2878E8]/20 hover:shadow-lg hover:shadow-[#2878E8]/30 transition-all duration-200 disabled:opacity-65 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Assurance Badge */}
          <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-2 text-[#718096]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2878E8]" />
            <p className="text-[11px] xl:text-xs font-normal">
              Secure access to your administration portal.
            </p>
          </div>
        </div>

        {/* Footer / Copyright */}
        <div className="pt-2 text-center text-[11px] text-[#94A3B8]">
          &copy; {new Date().getFullYear()} Another Second Chance. All rights reserved.
        </div>
      </div>

    </div>
  );
}

export default SignIn;
