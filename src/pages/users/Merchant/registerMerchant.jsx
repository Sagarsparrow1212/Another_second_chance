import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  UploadCloud,
  ArrowRight,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Lock,
  User,
  Briefcase,
  Check,
  Edit,
} from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";

const STEPS = [
  { id: 1, title: "Business & Account", desc: "Credentials and merchant type", icon: Store },
  { id: 2, title: "Contact & Location", desc: "Representative and physical address", icon: MapPin },
  { id: 3, title: "Verification Documents", desc: "License and tax credentials", icon: FileText },
];

export function RegisterMerchant() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    businessType: "",
    address: "",
    city: "",
    state: "",
    contactPersonName: "",
    contactPersonDesignation: "",
    agreeToTerms: false,
  });

  const [documents, setDocuments] = useState({
    gstCertificate: null,
    businessLicense: null,
    photoId: null,
  });

  const [documentPreviews, setDocumentPreviews] = useState({
    gstCertificate: null,
    businessLicense: null,
    photoId: null,
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

  const handleDocumentChange = (documentType, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(`File "${file.name}" exceeds 5MB limit`);
      return;
    }
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setError("Supported file types: PDF, DOC, DOCX, JPG, PNG");
      return;
    }

    setDocuments((prev) => ({ ...prev, [documentType]: file }));
    if (file.type.startsWith("image/")) {
      setDocumentPreviews((prev) => ({ ...prev, [documentType]: URL.createObjectURL(file) }));
    } else {
      setDocumentPreviews((prev) => ({ ...prev, [documentType]: null }));
    }
    setError("");
  };

  const removeDocument = (documentType) => {
    if (documentPreviews[documentType]) URL.revokeObjectURL(documentPreviews[documentType]);
    setDocuments((prev) => ({ ...prev, [documentType]: null }));
    setDocumentPreviews((prev) => ({ ...prev, [documentType]: null }));
  };

  const validateStep = (stepNumber) => {
    const stepErrors = {};

    if (stepNumber === 1) {
      if (!formData.businessName.trim()) stepErrors.businessName = "Business name is required";
      if (!formData.businessEmail.trim()) {
        stepErrors.businessEmail = "Business email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
        stepErrors.businessEmail = "Valid email address required";
      }

      if (!formData.phoneNumber.trim()) {
        stepErrors.phoneNumber = "Phone number is required";
      } else if (formData.phoneNumber.replace(/\D/g, "").length !== 10) {
        stepErrors.phoneNumber = "Phone number must have 10 digits";
      }

      if (!formData.password) {
        stepErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        stepErrors.password = "Password must be at least 8 characters";
      }

      if (!formData.confirmPassword) {
        stepErrors.confirmPassword = "Confirm password is required";
      } else if (formData.password !== formData.confirmPassword) {
        stepErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.businessType) stepErrors.businessType = "Business type is required";
    }

    if (stepNumber === 2) {
      if (!formData.address.trim()) stepErrors.address = "Street address is required";
      if (!formData.city.trim()) stepErrors.city = "City is required";
      if (!formData.state.trim()) stepErrors.state = "State is required";
      if (!formData.contactPersonName.trim())
        stepErrors.contactPersonName = "Contact person name is required";
    }

    if (stepNumber === 3) {
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
      setCurrentStep((prev) => Math.min(3, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError("Please complete all required fields highlighted in red.");
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    for (let s = 1; s <= 3; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        setError(`Please check Step ${s} before submitting.`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("businessName", formData.businessName);
      formDataToSend.append("businessEmail", formData.businessEmail);
      formDataToSend.append("phoneNumber", formData.phoneNumber);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("businessType", formData.businessType);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("contactPersonName", formData.contactPersonName);
      if (formData.contactPersonDesignation) {
        formDataToSend.append("contactPersonDesignation", formData.contactPersonDesignation);
      }
      if (documents.gstCertificate) formDataToSend.append("gstCertificate", documents.gstCertificate);
      if (documents.businessLicense) formDataToSend.append("businessLicense", documents.businessLicense);
      if (documents.photoId) formDataToSend.append("photoId", documents.photoId);

      const response = await fetch(`${API_BASE_URL_V1}/merchants/register`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        let msg = "Failed to register merchant";
        try {
          const errData = await response.json();
          msg = errData.message || errData.error || msg;
        } catch {
          msg = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to register merchant");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard/merchants"), 700);
    } catch (err) {
      console.error("Registration error:", err);
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
            onClick={() => navigate("/dashboard/merchants")}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#E7ECF2] text-[#68778D] hover:text-[#172033] hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#68778D]" />
            <span className="hidden sm:inline">Back to Merchants</span>
          </button>
          <div className="h-6 w-px bg-[#E7ECF2]" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#172033] leading-tight">
              Register New Merchant
            </h1>
            <p className="text-xs text-[#68778D]">
              Three-step registration for business employers and retail partners
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#EAF3FF] text-[#2878E5] border border-[#2878E5]/20 self-start sm:self-center">
          Step {currentStep} of 3: {STEPS[currentStep - 1].title}
        </div>
      </div>

      {/* 3-Step Indicator */}
      <div className="bg-white rounded-2xl border border-[#E7ECF2] p-4 sm:p-5 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
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

      {/* Errors / Success Alerts */}
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
            Merchant profile created successfully! Redirecting...
          </span>
        </div>
      )}

      {/* Centered Form Container */}
      <div className="max-w-[1000px] mx-auto bg-white rounded-2xl border border-[#E7ECF2] shadow-card overflow-hidden">
        <div className="px-6 py-4 bg-[#FAFBFD] border-b border-[#E7ECF2] flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#172033]">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-xs text-[#68778D]">{STEPS[currentStep - 1].desc}</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
            Step {currentStep} of 3
          </span>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          {/* STEP 1: BUSINESS & ACCOUNT */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Business / Trading Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="e.g. Acme Tech Solutions LLC"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.businessName
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                </div>
                {errors.businessName && <p className="text-[11px] text-rose-500">{errors.businessName}</p>}
              </div>

              {/* Business Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Business Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="contact@business.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.businessEmail
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                </div>
                {errors.businessEmail && (
                  <p className="text-[11px] text-rose-500">{errors.businessEmail}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Primary Phone Number <span className="text-rose-500">*</span>
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
                  Account Password <span className="text-rose-500">*</span>
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

              {/* Business Type */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Business Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                    errors.businessType
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                      : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                  }`}
                >
                  <option value="">Select Business Type</option>
                  <option value="Retail">Retail Store</option>
                  <option value="Restaurant">Restaurant / Food Service</option>
                  <option value="Grocery">Grocery / Supermarket</option>
                  <option value="Pharmacy">Pharmacy / Healthcare</option>
                  <option value="Electronics">Electronics & Hardware</option>
                  <option value="Clothing">Clothing & Apparel</option>
                  <option value="Services">Professional Services</option>
                  <option value="Wholesale">Wholesale & Distribution</option>
                  <option value="Other">Other</option>
                </select>
                {errors.businessType && (
                  <p className="text-[11px] text-rose-500">{errors.businessType}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT & LOCATION */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Person Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Contact Person Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={handleChange}
                    placeholder="e.g. Robert Vance"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.contactPersonName
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                </div>
                {errors.contactPersonName && (
                  <p className="text-[11px] text-rose-500">{errors.contactPersonName}</p>
                )}
              </div>

              {/* Designation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Designation / Role (Optional)
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type="text"
                    name="contactPersonDesignation"
                    value={formData.contactPersonDesignation}
                    onChange={handleChange}
                    placeholder="e.g. General Manager, Owner"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Address (Full Width) */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Business Street Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Commerce Way, Suite 400"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.address
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                </div>
                {errors.address && <p className="text-[11px] text-rose-500">{errors.address}</p>}
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Chicago"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                    errors.city
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                      : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                  }`}
                />
                {errors.city && <p className="text-[11px] text-rose-500">{errors.city}</p>}
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  State / Province <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Illinois"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                    errors.state
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                      : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                  }`}
                />
                {errors.state && <p className="text-[11px] text-rose-500">{errors.state}</p>}
              </div>
            </div>
          )}

          {/* STEP 3: VERIFICATION DOCUMENTS & TERMS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[#2878E5] text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700 leading-relaxed">
                  <strong>Verification Notice:</strong> Upload business documentation to qualify your store for official Chance Platform hiring and procurement quotas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* GST / Tax Certificate */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172033]">Tax / GST Certificate</span>
                    {documents.gstCertificate && (
                      <button
                        type="button"
                        onClick={() => removeDocument("gstCertificate")}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {documents.gstCertificate ? (
                    <div className="p-2.5 bg-white rounded-lg border border-[#E7ECF2] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#2878E5] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#172033] truncate">
                          {documents.gstCertificate.name}
                        </p>
                        <p className="text-[10px] text-[#98A2B3]">
                          {(documents.gstCertificate.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-white cursor-pointer hover:bg-blue-50/30 transition-colors p-2 text-center">
                      <UploadCloud className="w-5 h-5 text-[#2878E5] mb-1" />
                      <span className="text-[11px] font-semibold text-[#2878E5]">Select File</span>
                      <span className="text-[10px] text-[#98A2B3]">PDF, JPG &lt; 5MB</span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => handleDocumentChange("gstCertificate", e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Business License */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172033]">Business License</span>
                    {documents.businessLicense && (
                      <button
                        type="button"
                        onClick={() => removeDocument("businessLicense")}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {documents.businessLicense ? (
                    <div className="p-2.5 bg-white rounded-lg border border-[#E7ECF2] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#2878E5] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#172033] truncate">
                          {documents.businessLicense.name}
                        </p>
                        <p className="text-[10px] text-[#98A2B3]">
                          {(documents.businessLicense.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-white cursor-pointer hover:bg-blue-50/30 transition-colors p-2 text-center">
                      <UploadCloud className="w-5 h-5 text-[#2878E5] mb-1" />
                      <span className="text-[11px] font-semibold text-[#2878E5]">Select File</span>
                      <span className="text-[10px] text-[#98A2B3]">PDF, JPG &lt; 5MB</span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => handleDocumentChange("businessLicense", e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Photo ID */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172033]">Representative Photo ID</span>
                    {documents.photoId && (
                      <button
                        type="button"
                        onClick={() => removeDocument("photoId")}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {documents.photoId ? (
                    <div className="p-2.5 bg-white rounded-lg border border-[#E7ECF2] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#2878E5] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#172033] truncate">
                          {documents.photoId.name}
                        </p>
                        <p className="text-[10px] text-[#98A2B3]">
                          {(documents.photoId.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-white cursor-pointer hover:bg-blue-50/30 transition-colors p-2 text-center">
                      <UploadCloud className="w-5 h-5 text-[#2878E5] mb-1" />
                      <span className="text-[11px] font-semibold text-[#2878E5]">Select File</span>
                      <span className="text-[10px] text-[#98A2B3]">PDF, JPG &lt; 5MB</span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => handleDocumentChange("photoId", e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Pre-flight Review */}
              <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF2]">
                  <span className="text-xs font-bold text-[#172033]">Review Business Information</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-semibold text-[#2878E5] hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#98A2B3] text-[10px] uppercase font-bold block">Company</span>
                    <p className="font-semibold text-[#172033]">{formData.businessName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[#98A2B3] text-[10px] uppercase font-bold block">Type</span>
                    <p className="font-semibold text-[#172033]">{formData.businessType || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[#98A2B3] text-[10px] uppercase font-bold block">Contact</span>
                    <p className="font-semibold text-[#172033]">{formData.contactPersonName || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="p-4 rounded-xl bg-white border border-[#E7ECF2] space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-[#2878E5] border-gray-300 focus:ring-[#2878E5] mt-0.5"
                  />
                  <span className="text-xs text-[#172033] leading-relaxed">
                    I confirm that I am authorized to represent this merchant business and agree to the{" "}
                    <span className="text-[#2878E5] font-semibold">Terms & Conditions</span> and Partner Code of Conduct.
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
        <div className="max-w-[1000px] mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/merchants")}
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

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-[#2878E5] hover:bg-[#1d6cd4] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-[#16A36A] hover:bg-[#128857] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registering Merchant...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Register Merchant</span>
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

export default RegisterMerchant;
