import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Plus,
  Building2,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  Languages,
  Activity,
  FileText,
  Sparkles,
} from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";

const SKILLS_OPTIONS = [
  "General Labor",
  "Cleaning / Housekeeping",
  "Construction Helper",
  "Landscaping / Gardening",
  "Kitchen / Cooking Help",
  "Painting",
  "Driving / Delivery",
  "Retail Helper",
  "Warehouse Work",
  "Maintenance Helper",
  "Pet Care",
  "Other",
];

const LANGUAGES_OPTIONS = ["English", "Spanish", "Other"];

const STEPS = [
  { id: 1, title: "Sponsor & Identity", desc: "Organization sponsor & account credentials", icon: Building2 },
  { id: 2, title: "Personal & Contact", desc: "Demographics, contact info & bio", icon: User },
  { id: 3, title: "Skills & Background", desc: "Work experience & language skills", icon: Briefcase },
  { id: 4, title: "Location & Verification", desc: "Shelter area & ID verification", icon: FileCheck2 },
];

export function RegisterHomeless() {
  const navigate = useNavigate();
  const { organizationId } = useParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Organizations list
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [isOrganizationLocked, setIsOrganizationLocked] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    age: "",
    gender: "",
    skillset: [],
    experience: "",
    location: "",
    address: "",
    contactPhone: "",
    contactEmail: "",
    bio: "",
    languages: ["English"],
    healthConditions: "",
    verificationDocument: null,
    organizationCutPercentage: "",
    agreeToTerms: false,
    organizationId: "",
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true);
      try {
        const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/organizations?limit=1000`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setOrganizations(data.data.organizations || []);
          }
        }
      } catch (err) {
        console.error("Fetch organizations error:", err);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Set locked organization if navigated with param
  useEffect(() => {
    if (organizationId && organizations.length > 0) {
      const orgIdStr = String(organizationId);
      const found = organizations.find((o) => String(o.id) === orgIdStr);
      if (found) {
        setIsOrganizationLocked(true);
        setFormData((prev) => ({ ...prev, organizationId: orgIdStr }));
      }
    }
  }, [organizationId, organizations]);

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
    if (name === "contactPhone") formattedValue = formatPhoneNumber(value);

    if (name === "organizationCutPercentage") {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      formattedValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : formattedValue,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleToggleArrayItem = (field, item) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const updated = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return { ...prev, [field]: updated };
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture exceeds 5MB limit");
      return;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Please select a valid image (JPG, PNG, GIF, WEBP)");
      return;
    }
    setProfilePicture(file);
    setProfilePreview(URL.createObjectURL(file));
    setError("");
  };

  const removeProfilePicture = () => {
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePicture(null);
    setProfilePreview(null);
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Document file exceeds 5MB limit");
      return;
    }
    setFormData((prev) => ({ ...prev, verificationDocument: file }));
    if (file.type.startsWith("image/")) {
      setDocumentPreview(URL.createObjectURL(file));
    } else {
      setDocumentPreview(null);
    }
    setError("");
  };

  const removeDocument = () => {
    if (documentPreview) URL.revokeObjectURL(documentPreview);
    setFormData((prev) => ({ ...prev, verificationDocument: null }));
    setDocumentPreview(null);
  };

  const validateStep = (stepNumber) => {
    const stepErrors = {};

    if (stepNumber === 1) {
      if (!formData.organizationId) {
        stepErrors.organizationId = "Please select an endorsing organization";
      }

      if (!formData.username.trim()) {
        stepErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        stepErrors.username = "Username must be at least 3 characters";
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        stepErrors.username = "Username can only contain letters, numbers, and underscores";
      }

      if (formData.password && formData.password.length < 6) {
        stepErrors.password = "Password must be at least 6 characters (or leave empty)";
      }

      if (formData.organizationCutPercentage !== "") {
        const num = parseFloat(formData.organizationCutPercentage);
        if (isNaN(num) || num < 0 || num > 30) {
          stepErrors.organizationCutPercentage = "Cut percentage must be between 0% and 30%";
        }
      }
    }

    if (stepNumber === 2) {
      if (!formData.fullName.trim()) stepErrors.fullName = "Full name is required";

      if (formData.age) {
        const ageNum = parseInt(formData.age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
          stepErrors.age = "Please enter a valid age (1-120)";
        }
      }

      if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        stepErrors.contactEmail = "Please enter a valid email address";
      }

      if (formData.contactPhone) {
        const phoneDigits = formData.contactPhone.replace(/\D/g, "");
        if (phoneDigits.length !== 10) {
          stepErrors.contactPhone = "Phone number must have exactly 10 digits";
        }
      }
    }

    if (stepNumber === 3) {
      // Skills & background are optional but validated for safety
    }

    if (stepNumber === 4) {
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
      setCurrentStep((p) => Math.min(4, p + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError("Please complete all required fields highlighted in red.");
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((p) => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        setError(`Please check Step ${s} before registering.`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username.trim());
      if (formData.password) formDataToSend.append("password", formData.password);
      formDataToSend.append("organizationId", formData.organizationId);
      formDataToSend.append("fullName", formData.fullName.trim());
      formDataToSend.append("age", formData.age || "");
      formDataToSend.append("gender", formData.gender || "");
      formDataToSend.append("skillset", JSON.stringify(formData.skillset));
      formDataToSend.append("experience", formData.experience || "");
      formDataToSend.append("location", formData.location || "");
      formDataToSend.append("address", formData.address || "");
      if (formData.contactPhone) formDataToSend.append("contactPhone", formData.contactPhone);
      if (formData.contactEmail) formDataToSend.append("contactEmail", formData.contactEmail);
      formDataToSend.append("bio", formData.bio || "");
      formDataToSend.append("languages", JSON.stringify(formData.languages));
      if (formData.healthConditions) {
        formDataToSend.append("healthConditions", formData.healthConditions);
      }
      if (formData.organizationCutPercentage !== "") {
        formDataToSend.append("organizationCutPercentage", String(formData.organizationCutPercentage));
      }
      if (profilePicture) formDataToSend.append("profilePicture", profilePicture);
      if (formData.verificationDocument) {
        formDataToSend.append("verificationDocument", formData.verificationDocument);
      }

      const response = await fetch(`${API_BASE_URL_V1}/homeless/register`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        let msg = "Failed to register beneficiary";
        try {
          const errData = await response.json();
          msg = errData.message || errData.error || msg;
        } catch {
          msg = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to register beneficiary");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard/homeless"), 700);
    } catch (err) {
      console.error("Beneficiary registration error:", err);
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
            onClick={() => navigate("/dashboard/homeless")}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#E7ECF2] text-[#68778D] hover:text-[#172033] hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#68778D]" />
            <span className="hidden sm:inline">Back to Homeless Users</span>
          </button>
          <div className="h-6 w-px bg-[#E7ECF2]" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#172033] leading-tight">
              Register Beneficiary Profile
            </h1>
            <p className="text-xs text-[#68778D]">
              Four-step registration to enroll individuals under partner sponsorship
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#EAF3FF] text-[#2878E5] border border-[#2878E5]/20 self-start sm:self-center">
          Step {currentStep} of 4: {STEPS[currentStep - 1].title}
        </div>
      </div>

      {/* 4-Step Indicator */}
      <div className="bg-white rounded-2xl border border-[#E7ECF2] p-4 sm:p-5 shadow-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
                  <p className="text-[11px] text-[#68778D] truncate hidden sm:block">{s.desc}</p>
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
            Beneficiary registered successfully! Redirecting...
          </span>
        </div>
      )}

      {/* Form Container */}
      <div className="max-w-[1040px] mx-auto bg-white rounded-2xl border border-[#E7ECF2] shadow-card overflow-hidden">
        <div className="px-6 py-4 bg-[#FAFBFD] border-b border-[#E7ECF2] flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#172033]">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-xs text-[#68778D]">{STEPS[currentStep - 1].desc}</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
            Step {currentStep} of 4
          </span>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          {/* STEP 1: SPONSOR & IDENTITY */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Profile Photo */}
              <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="file"
                  id="profile-pic"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <label htmlFor="profile-pic" className="cursor-pointer flex-shrink-0 relative group">
                  {profilePreview ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E7ECF2] shadow-sm bg-white">
                      <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeProfilePicture();
                        }}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-sm hover:bg-rose-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-white flex flex-col items-center justify-center text-[#2878E5] group-hover:bg-blue-50/50 transition-colors">
                      <UploadCloud className="w-6 h-6 mb-1 text-[#2878E5]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Photo</span>
                    </div>
                  )}
                </label>
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xs font-bold text-[#172033]">Beneficiary Profile Photo</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/60 text-[#68778D] font-medium">
                      Optional
                    </span>
                  </div>
                  <p className="text-xs text-[#68778D]">
                    Upload a recognizable portrait for identification and badge printing (JPG, PNG, WEBP &lt; 5MB).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Sponsor */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-[#172033]">
                    Sponsoring Organization <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                    <select
                      name="organizationId"
                      value={formData.organizationId}
                      onChange={handleChange}
                      disabled={isOrganizationLocked}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                        errors.organizationId
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                          : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                      } ${isOrganizationLocked ? "bg-slate-100 cursor-not-allowed opacity-80" : ""}`}
                    >
                      <option value="">Select Sponsoring Organization</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name || org.orgName} ({org.city || "National"})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.organizationId ? (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.organizationId}</p>
                  ) : (
                    <p className="text-[11px] text-[#98A2B3]">
                      Organization managing this profile and supervising donor disbursements
                    </p>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Public Username / Handle <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="e.g. john_doe"
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                        errors.username
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                          : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                      }`}
                    />
                  </div>
                  {errors.username ? (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.username}</p>
                  ) : (
                    <p className="text-[11px] text-[#98A2B3]">Unique handle for donor QR profile</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Account Password (Optional)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank if non-digital user"
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

                {/* Organization Cut Percentage */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-[#172033]">
                    Organization Service Retainer Cut % (Optional, Max 30%)
                  </label>
                  <input
                    type="text"
                    name="organizationCutPercentage"
                    value={formData.organizationCutPercentage}
                    onChange={handleChange}
                    placeholder="e.g. 10 (Defaults to organization default if empty)"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.organizationCutPercentage
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.organizationCutPercentage && (
                    <p className="text-[11px] text-rose-500">{errors.organizationCutPercentage}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL & CONTACT */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Johnathan Carter"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                    errors.fullName
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                      : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                  }`}
                />
                {errors.fullName && <p className="text-[11px] text-rose-500">{errors.fullName}</p>}
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">Age (Years)</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 42"
                  min="1"
                  max="120"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                    errors.age
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                      : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                  }`}
                />
                {errors.age && <p className="text-[11px] text-rose-500">{errors.age}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Contact Phone (Personal or Case Worker)
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                    errors.contactPhone
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                      : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                  }`}
                />
                {errors.contactPhone && (
                  <p className="text-[11px] text-rose-500">{errors.contactPhone}</p>
                )}
              </div>

              {/* Contact Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="contact@individual.org"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                    errors.contactEmail
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                      : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                  }`}
                />
                {errors.contactEmail && (
                  <p className="text-[11px] text-rose-500">{errors.contactEmail}</p>
                )}
              </div>

              {/* Bio / Background Story */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Brief Personal Story & Background (Public facing)
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Share a short summary of how the individual came to the program and their goals..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS & BACKGROUND */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Skillset checkboxes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Select Relevant Skills & Trades
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {SKILLS_OPTIONS.map((skill) => {
                    const isSelected = formData.skillset.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleToggleArrayItem("skillset", skill)}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-[#EAF3FF] border-[#2878E5] text-[#2878E5] shadow-sm font-semibold"
                            : "bg-white border-[#E7ECF2] text-[#68778D] hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{skill}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2878E5] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Work Experience */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Work History & Prior Experience
                </label>
                <textarea
                  name="experience"
                  rows={3}
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g. 5 years in residential carpentry, warehouse stocking, prep cook..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                />
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#172033]">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES_OPTIONS.map((lang) => {
                    const isSelected = formData.languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleToggleArrayItem("languages", lang)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-[#2878E5] text-white border-[#2878E5]"
                            : "bg-white border-[#E7ECF2] text-[#68778D] hover:bg-slate-50"
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LOCATION & VERIFICATION */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* General Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Current City / Neighborhood
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Downtown San Francisco, Mission District"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                  />
                </div>

                {/* Shelter Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Shelter or Mailing Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 550 Larkin St Shelter"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                  />
                </div>

                {/* Health Conditions */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-[#172033]">
                    Health Considerations / Special Accommodations
                  </label>
                  <textarea
                    name="healthConditions"
                    rows={2}
                    value={formData.healthConditions}
                    onChange={handleChange}
                    placeholder="Dietary requirements, mobility limitations, chronic treatments..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Verification Document Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Identity Verification Document (State ID, Intake Form, or Shelter Card)
                </label>
                {formData.verificationDocument ? (
                  <div className="p-3 bg-[#F7F9FC] border border-[#E7ECF2] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-[#2878E5] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#172033] truncate">
                          {formData.verificationDocument.name}
                        </p>
                        <p className="text-[10px] text-[#98A2B3]">
                          {(formData.verificationDocument.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeDocument}
                      className="p-1 text-[#98A2B3] hover:text-rose-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-[#FAFBFD] cursor-pointer hover:bg-blue-50/30 transition-colors text-center">
                    <UploadCloud className="w-6 h-6 text-[#2878E5] mb-1" />
                    <span className="text-xs font-bold text-[#2878E5]">
                      Upload Intake or Verification Document
                    </span>
                    <span className="text-[11px] text-[#98A2B3]">
                      PDF, JPG, PNG &lt; 5MB (Optional but recommended)
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleDocumentChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Terms Agreement */}
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
                    I certify that this beneficiary profile is created with authorized consent under the participating organization's program guidelines.
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
        <div className="max-w-[1040px] mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/homeless")}
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

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#2878E5] hover:bg-[#1d6cd4] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Continue to Step {currentStep + 1}</span>
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
                    Registering Profile...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Register Beneficiary</span>
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

export default RegisterHomeless;
