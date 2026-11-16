import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  HeartHandshake,
  Mail,
  Phone,
  Lock,
  MapPin,
  Gift,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";

const STEPS = [
  { id: 1, title: "Account & Profile", desc: "Credentials and personal details", icon: User },
  { id: 2, title: "Address & Giving", desc: "Mailing address and donation preference", icon: HeartHandshake },
];

export function RegisterDonor() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    gender: "",
    address: "",
    preferredDonationType: "Money",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    const limitedNumber = phoneNumber.slice(0, 10);
    if (limitedNumber.length === 0) return "";
    if (limitedNumber.length <= 3) return `(${limitedNumber}`;
    if (limitedNumber.length <= 6) return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6, 10)}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let formattedValue = value;
    if (name === "phoneNumber") formattedValue = formatPhoneNumber(value);

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : formattedValue,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep = (stepNumber) => {
    const stepErrors = {};

    if (stepNumber === 1) {
      if (!formData.fullName.trim()) stepErrors.fullName = "Full name is required";

      if (!formData.email.trim()) {
        stepErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = "Valid email address required";
      }

      if (!formData.phoneNumber.trim()) {
        stepErrors.phoneNumber = "Phone number is required";
      } else if (formData.phoneNumber.replace(/\D/g, "").length !== 10) {
        stepErrors.phoneNumber = "Phone number must have exactly 10 digits";
      }

      if (!formData.password) {
        stepErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        stepErrors.password = "Password must be at least 8 characters";
      }

      if (!formData.confirmPassword) {
        stepErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        stepErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.gender) stepErrors.gender = "Gender selection is required";
    }

    if (stepNumber === 2) {
      if (!formData.agreeToTerms) {
        stepErrors.agreeToTerms = "You must agree to the Terms & Conditions";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError("");
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError("Please complete all required fields highlighted in red.");
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    for (let s = 1; s <= 2; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        setError(`Please check Step ${s} before submitting.`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL_V1}/donors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          gender: formData.gender,
          address: formData.address || "",
          preferredDonationType: formData.preferredDonationType || "Money",
        }),
      });

      if (!response.ok) {
        let msg = "Failed to register donor";
        try {
          const errData = await response.json();
          msg = errData.message || errData.error || msg;
        } catch {
          msg = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to register donor");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard/donors"), 700);
    } catch (err) {
      console.error("Donor registration error:", err);
      setError(err.message || "An error occurred during registration.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#E7ECF2] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/donors")}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#E7ECF2] text-[#68778D] hover:text-[#172033] hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#68778D]" />
            <span className="hidden sm:inline">Back to Donors</span>
          </button>
          <div className="h-6 w-px bg-[#E7ECF2]" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#172033] leading-tight">
              Register New Donor
            </h1>
            <p className="text-xs text-[#68778D]">
              Streamlined onboarding for contributors and philanthropic partners
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#EAF3FF] text-[#2878E5] border border-[#2878E5]/20 self-start sm:self-center">
          Step {currentStep} of 2: {STEPS[currentStep - 1].title}
        </div>
      </div>

      {/* 2-Step Indicator */}
      <div className="bg-white rounded-2xl border border-[#E7ECF2] p-4 sm:p-5 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {STEPS.map((s) => {
            const isCompleted = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < currentStep) setCurrentStep(s.id);
                  else if (validateStep(currentStep)) setCurrentStep(s.id);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? "bg-[#EAF3FF]/60 border-[#2878E5] shadow-sm ring-1 ring-[#2878E5]/30"
                    : isCompleted
                    ? "bg-slate-50 border-emerald-200 hover:bg-slate-100"
                    : "bg-slate-50/50 border-[#E7ECF2] opacity-70"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-[#2878E5] text-white shadow-sm"
                      : "bg-white border border-[#E7ECF2] text-[#68778D]"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : s.id}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-bold truncate ${
                      isCurrent ? "text-[#2878E5]" : isCompleted ? "text-emerald-800" : "text-[#172033]"
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-[11px] text-[#68778D] truncate">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="font-medium flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-800 p-1">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold flex-1">
            Donor profile registered successfully! Redirecting...
          </span>
        </div>
      )}

      {/* Form Container */}
      <div className="max-w-[960px] mx-auto bg-white rounded-2xl border border-[#E7ECF2] shadow-card overflow-hidden">
        <div className="px-6 py-4 bg-[#FAFBFD] border-b border-[#E7ECF2] flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#172033]">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-xs text-[#68778D]">{STEPS[currentStep - 1].desc}</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
            Step {currentStep} of 2
          </span>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          {/* STEP 1: ACCOUNT & PROFILE */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Eleanor Vance"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.fullName
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                </div>
                {errors.fullName && <p className="text-[11px] text-rose-500">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="eleanor@domain.org"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.email
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.phoneNumber
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                </div>
                {errors.phoneNumber && <p className="text-[11px] text-rose-500">{errors.phoneNumber}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.password
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#172033]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-500">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.confirmPassword
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#172033]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["Male", "Female", "Other"].map((g) => (
                    <label
                      key={g}
                      className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        formData.gender === g
                          ? "bg-[#EAF3FF] border-[#2878E5] text-[#2878E5] shadow-sm"
                          : "bg-white border-[#E7ECF2] text-[#68778D] hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
                {errors.gender && <p className="text-[11px] text-rose-500">{errors.gender}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: ADDRESS & GIVING PREFERENCES */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Preferred Donation Type */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Preferred Contribution Channel
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { type: "Money", desc: "Monetary contributions & recurring aid" },
                    { type: "Clothes", desc: "Garments, shoes & cold-weather apparel" },
                    { type: "Both", desc: "Both financial and item donations" },
                  ].map((item) => (
                    <label
                      key={item.type}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        formData.preferredDonationType === item.type
                          ? "bg-[#EAF3FF] border-[#2878E5] shadow-sm ring-1 ring-[#2878E5]/20"
                          : "bg-white border-[#E7ECF2] hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="preferredDonationType"
                        value={item.type}
                        checked={formData.preferredDonationType === item.type}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#172033]">{item.type}</span>
                        {formData.preferredDonationType === item.type && (
                          <Check className="w-3.5 h-3.5 text-[#2878E5]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#68778D]">{item.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Physical Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Physical / Mailing Address (Optional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter street, city, state, and zip code for tax receipts and correspondence"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#98A2B3]">Used to generate official end-of-year charitable contribution receipts</p>
              </div>

              {/* Terms Checkbox */}
              <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-[#2878E5] border-gray-300 focus:ring-[#2878E5] mt-0.5"
                  />
                  <span className="text-xs text-[#172033] leading-relaxed">
                    I agree to the <span className="text-[#2878E5] font-semibold">Terms & Conditions</span> and understand my contributions will be transparently audited and allocated to verified beneficiaries.
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="text-[11px] font-medium text-rose-500 pl-6.5">{errors.agreeToTerms}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7ECF2] px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-[960px] mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/donors")}
            className="px-4 py-2 rounded-xl border border-[#E7ECF2] text-xs font-semibold text-[#68778D] hover:text-[#172033] hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl border border-[#E7ECF2] text-xs font-semibold text-[#172033] hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#2878E5] hover:bg-[#1d6cd4] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Continue to Step 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#128857] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registering Donor...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Register Donor</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default RegisterDonor;
