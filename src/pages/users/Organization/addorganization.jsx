import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  CreditCard,
  Building2,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Plus,
  Edit,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  MapPin,
  Landmark,
} from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";

const STEPS = [
  { id: 1, title: "Account & Contact", desc: "Credentials & point of contact", icon: User },
  { id: 2, title: "Banking Details", desc: "Account for receiving donations", icon: Landmark },
  { id: 3, title: "Organization Details", desc: "Entity profile & physical address", icon: Building2 },
  { id: 4, title: "Media & Verification", desc: "Photos, credentials & review", icon: FileCheck2 },
];

export function AddOrganization() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    orgName: "",
    orgType: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    contactPerson: "",
    emergencyContactEmail: "",
    contactPhone: "",
    // Banking details
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    routingNumber: "",
    accountType: "",
    bankAddress: "",
    swiftCode: "",
  });

  // Upload states
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Errors state
  const [errors, setErrors] = useState({});

  // Phone number formatter
  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    const limitedNumber = phoneNumber.slice(0, 10);
    if (limitedNumber.length === 0) return "";
    if (limitedNumber.length <= 3) return `(${limitedNumber}`;
    if (limitedNumber.length <= 6) return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6, 10)}`;
  };

  // ZIP Code formatter
  const handleZipCodeChange = (e) => {
    let formatted = e.target.value.replace(/[^\d-]/g, "");
    if (formatted.length > 5 && formatted[5] !== "-") {
      formatted = formatted.slice(0, 5) + "-" + formatted.slice(5);
    }
    if (formatted.length > 10) formatted = formatted.slice(0, 10);
    if (formatted.startsWith("-")) formatted = formatted.slice(1);
    formatted = formatted.replace(/-+/g, "-");

    const parts = formatted.split("-");
    if (parts[0].length > 5) parts[0] = parts[0].slice(0, 5);
    if (parts.length > 1 && parts[1].length > 4) parts[1] = parts[1].slice(0, 4);

    setFormData((prev) => ({ ...prev, zipCode: parts.join("-") }));
    if (errors.zipCode) setErrors((prev) => ({ ...prev, zipCode: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "contactPhone") formattedValue = formatPhoneNumber(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Logo handlers
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(`Logo file "${file.name}" exceeds 5MB size limit`);
      return;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Logo must be an image (JPG, PNG, GIF, WEBP)");
      return;
    }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogo(null);
    setLogoPreview(null);
  };

  // Photos handlers (max 5)
  const handlePhotoAdd = () => {
    if (photos.length >= 5) {
      setError("Maximum 5 organization photos allowed");
      return;
    }
    setPhotos((prev) => [...prev, { id: Date.now(), name: "", file: null, preview: null }]);
  };

  const handlePhotoRemove = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePhotoNameChange = (id, name) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    if (errors[`photoName_${id}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`photoName_${id}`];
        return next;
      });
    }
  };

  const handlePhotoFileChange = (id, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(`File "${file.name}" exceeds 5MB limit`);
      return;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Supported photo formats: JPG, PNG, GIF, WEBP");
      return;
    }
    const preview = URL.createObjectURL(file);
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, file, preview } : p)));
    setError("");
    if (errors.photos) setErrors((prev) => ({ ...prev, photos: "" }));
  };

  // Document handlers (max 3)
  const handleDocumentAdd = () => {
    if (documents.length >= 3) {
      setError("Maximum 3 verification documents allowed");
      return;
    }
    setDocuments((prev) => [...prev, { id: Date.now(), name: "", file: null, preview: null }]);
  };

  const handleDocumentRemove = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDocumentNameChange = (id, name) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
    if (errors[`documentName_${id}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`documentName_${id}`];
        return next;
      });
    }
  };

  const handleDocumentFileChange = (id, file) => {
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
      setError("Supported document formats: PDF, DOC, DOCX, JPG, PNG");
      return;
    }
    let preview = null;
    if (file.type.startsWith("image/")) preview = URL.createObjectURL(file);

    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, file, preview } : d)));
    setError("");
    if (errors.documents) setErrors((prev) => ({ ...prev, documents: "" }));
  };

  // Step validation
  const validateStep = (stepNumber) => {
    const stepErrors = {};

    if (stepNumber === 1) {
      if (!formData.email.trim()) {
        stepErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = "Please enter a valid email address";
      }

      if (!formData.password) {
        stepErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        stepErrors.password = "Password must be at least 8 characters";
      }

      if (
        formData.emergencyContactEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emergencyContactEmail)
      ) {
        stepErrors.emergencyContactEmail = "Please enter a valid email address";
      }

      if (formData.contactPhone) {
        const phoneDigits = formData.contactPhone.replace(/\D/g, "");
        if (phoneDigits.length !== 10) {
          stepErrors.contactPhone = "Phone number must have exactly 10 digits";
        }
      }
    }

    if (stepNumber === 2) {
      if (!formData.bankName.trim()) stepErrors.bankName = "Bank name is required";
      if (!formData.accountHolderName.trim())
        stepErrors.accountHolderName = "Account holder name is required";

      if (!formData.accountNumber.trim()) {
        stepErrors.accountNumber = "Account number is required";
      } else if (!/^\d+$/.test(formData.accountNumber.trim())) {
        stepErrors.accountNumber = "Account number must contain only digits";
      }

      if (!formData.confirmAccountNumber.trim()) {
        stepErrors.confirmAccountNumber = "Please confirm account number";
      } else if (formData.accountNumber.trim() !== formData.confirmAccountNumber.trim()) {
        stepErrors.confirmAccountNumber = "Account numbers do not match";
      }

      if (!formData.routingNumber.trim()) {
        stepErrors.routingNumber = "Routing number is required";
      } else if (!/^\d{9}$/.test(formData.routingNumber.trim())) {
        stepErrors.routingNumber = "Routing number must be exactly 9 digits";
      }

      if (!formData.accountType) stepErrors.accountType = "Account type is required";
    }

    if (stepNumber === 3) {
      if (!formData.orgName.trim()) stepErrors.orgName = "Organization name is required";
      if (!formData.orgType) stepErrors.orgType = "Organization type is required";
      if (!formData.streetAddress.trim()) stepErrors.streetAddress = "Street address is required";
      if (!formData.city.trim()) stepErrors.city = "City is required";
      if (!formData.state.trim()) stepErrors.state = "State is required";

      if (!formData.zipCode.trim()) {
        stepErrors.zipCode = "Zip code is required";
      } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
        stepErrors.zipCode = "Valid US ZIP code required (e.g. 10001)";
      }

      if (!formData.country.trim()) stepErrors.country = "Country is required";
    }

    if (stepNumber === 4) {
      const validPhotos = photos.filter((p) => p.file);
      if (validPhotos.length === 0) {
        stepErrors.photos = "At least 1 organization photo is required";
      }
      photos.forEach((p) => {
        if (p.file && !p.name?.trim()) {
          stepErrors[`photoName_${p.id}`] = "Photo name is required";
        }
      });

      const validDocs = documents.filter((d) => d.file);
      if (validDocs.length === 0) {
        stepErrors.documents = "At least 1 verification document is required";
      }
      documents.forEach((d) => {
        if (d.file && !d.name?.trim()) {
          stepErrors[`documentName_${d.id}`] = "Document title is required";
        }
      });
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setError("");
      setCurrentStep((prev) => Math.min(4, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError("Please complete all required fields marked in red before proceeding.");
    }
  };

  const handlePrevStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepJump = (stepId) => {
    if (stepId < currentStep) {
      setError("");
      setCurrentStep(stepId);
    } else {
      let canAdvance = true;
      for (let s = 1; s < stepId; s++) {
        if (!validateStep(s)) {
          canAdvance = false;
          setCurrentStep(s);
          setError(`Please complete Step ${s} before moving forward.`);
          break;
        }
      }
      if (canAdvance) {
        setError("");
        setCurrentStep(stepId);
      }
    }
  };

  // Map organization types to legacy types
  const mapOrgTypeToLegacy = (orgType) => {
    const typeMapping = {
      nonprofit: "NGO",
      shelter: "NGO",
      food_bank: "NGO",
      employment_agency: "Private",
      merchant: "Private",
      government: "Govt",
      NGO: "NGO",
      Private: "Private",
      Govt: "Govt",
    };
    return typeMapping[orgType] || orgType;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccess(false);

    // Validate all steps
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        setError(`Please check Step ${s} for missing or invalid information.`);
        return;
      }
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("role", "organization");
      formDataToSend.append("orgName", formData.orgName);
      formDataToSend.append("orgType", mapOrgTypeToLegacy(formData.orgType));
      formDataToSend.append("streetAddress", formData.streetAddress);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("zipCode", formData.zipCode);
      formDataToSend.append("country", formData.country);
      formDataToSend.append("contactPerson", formData.contactPerson || "");
      formDataToSend.append(
        "emergencyContactEmail",
        formData.emergencyContactEmail || formData.email
      );
      formDataToSend.append("contactPhone", formData.contactPhone || "");

      // Banking details
      formDataToSend.append("bankName", formData.bankName);
      formDataToSend.append("accountHolderName", formData.accountHolderName);
      formDataToSend.append("accountNumber", formData.accountNumber);
      formDataToSend.append("routingNumber", formData.routingNumber);
      formDataToSend.append("accountType", formData.accountType);
      formDataToSend.append("bankAddress", formData.bankAddress || "");
      formDataToSend.append("swiftCode", formData.swiftCode || "");

      // Logo
      if (logo) formDataToSend.append("logo", logo);

      // Documents
      const documentNames = [];
      documents.forEach((doc) => {
        if (doc.file) {
          formDataToSend.append("documents", doc.file);
          documentNames.push(doc.name);
        }
      });
      if (documentNames.length > 0) {
        formDataToSend.append("documentNames", JSON.stringify(documentNames));
      }

      // Photos
      const photoNames = [];
      photos.forEach((photo) => {
        if (photo.file) {
          formDataToSend.append("photos", photo.file);
          photoNames.push(photo.name);
        }
      });
      if (photoNames.length > 0) {
        formDataToSend.append("photoNames", JSON.stringify(photoNames));
      }

      const response = await fetch(`${API_BASE_URL_V1}/organizations/register`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        let msg = "Failed to create organization";
        try {
          const errData = await response.json();
          msg = errData.message || errData.error || msg;
        } catch {
          msg = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to create organization");
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard/organizations");
      }, 700);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during organization registration.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 1. Header with Breadcrumb & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#E7ECF2] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/organizations")}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#E7ECF2] text-[#68778D] hover:text-[#172033] hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#68778D]" />
            <span className="hidden sm:inline">Back to Organizations</span>
          </button>
          <div className="h-6 w-px bg-[#E7ECF2]" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#172033] leading-tight">
              Create Organization Profile
            </h1>
            <p className="text-xs text-[#68778D]">
              Four-step registration wizard for new charity & enterprise partners
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#EAF3FF] text-[#2878E5] border border-[#2878E5]/20 self-start sm:self-center">
          Step {currentStep} of 4: {STEPS[currentStep - 1].title}
        </div>
      </div>

      {/* 2. Four-Step Progress Indicator */}
      <div className="bg-white rounded-2xl border border-[#E7ECF2] p-4 sm:p-5 shadow-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {STEPS.map((s) => {
            const isCompleted = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            const Icon = s.icon;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStepJump(s.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? "bg-[#EAF3FF]/60 border-[#2878E5] shadow-sm ring-1 ring-[#2878E5]/30"
                    : isCompleted
                    ? "bg-slate-50 border-emerald-200 hover:bg-slate-100"
                    : "bg-slate-50/50 border-[#E7ECF2] opacity-70 cursor-not-allowed"
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
                  <p className="text-[11px] text-[#68778D] truncate hidden sm:block">
                    {s.desc}
                  </p>
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
          <button
            onClick={() => setError("")}
            className="text-rose-600 hover:text-rose-800 p-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold flex-1">
            Organization profile created successfully! Redirecting to directory...
          </span>
        </div>
      )}

      {/* 3. Centered Compact Form Container */}
      <div className="max-w-[1080px] mx-auto bg-white rounded-2xl border border-[#E7ECF2] shadow-card overflow-hidden">
        {/* Step Banner */}
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
          {/* STEP 1: ACCOUNT & CONTACT INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Logo Upload Card */}
              <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="file"
                  id="org-logo"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label
                  htmlFor="org-logo"
                  className="cursor-pointer flex-shrink-0 relative group"
                >
                  {logoPreview ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E7ECF2] shadow-sm bg-white">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeLogo();
                        }}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-sm hover:bg-rose-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-white flex flex-col items-center justify-center text-[#2878E5] group-hover:bg-blue-50/50 transition-colors">
                      <UploadCloud className="w-6 h-6 mb-1 text-[#2878E5]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Logo</span>
                    </div>
                  )}
                </label>
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xs font-bold text-[#172033]">Organization Logo</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/60 text-[#68778D] font-medium">
                      Optional
                    </span>
                  </div>
                  <p className="text-xs text-[#68778D]">
                    Upload your square organization avatar (JPG, PNG, GIF, WEBP up to 5MB).
                  </p>
                </div>
              </div>

              {/* Account Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Address */}
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
                      placeholder="admin@organization.org"
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                        errors.email
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                          : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                      }`}
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-[11px] font-medium text-rose-500">{errors.email}</p>
                  ) : (
                    <p className="text-[11px] text-[#98A2B3]">Primary credential for admin portal sign-in</p>
                  )}
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
                  {errors.password ? (
                    <p className="text-[11px] font-medium text-rose-500">{errors.password}</p>
                  ) : (
                    <p className="text-[11px] text-[#98A2B3]">Must be at least 8 characters long</p>
                  )}
                </div>

                {/* Contact Person */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Contact Person Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-[#98A2B3]">Lead administrator or executive representative</p>
                </div>

                {/* Primary Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Primary Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="(555) 123-4567"
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                        errors.contactPhone
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                          : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                      }`}
                    />
                  </div>
                  {errors.contactPhone ? (
                    <p className="text-[11px] font-medium text-rose-500">{errors.contactPhone}</p>
                  ) : (
                    <p className="text-[11px] text-[#98A2B3]">10-digit US phone format</p>
                  )}
                </div>

                {/* Emergency Contact Email */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-[#172033]">
                    Public Inquiries / Emergency Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                    <input
                      type="email"
                      name="emergencyContactEmail"
                      value={formData.emergencyContactEmail}
                      onChange={handleChange}
                      placeholder="contact@organization.org (Optional, defaults to account email)"
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                        errors.emergencyContactEmail
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                          : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                      }`}
                    />
                  </div>
                  {errors.emergencyContactEmail && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.emergencyContactEmail}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BANKING DETAILS */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Secure Banking Verification:</strong> These bank credentials will be used exclusively for automated ACH disbursement of platform donor funds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g. JPMorgan Chase, Bank of America"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.bankName
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.bankName && <p className="text-[11px] font-medium text-rose-500">{errors.bankName}</p>}
                </div>

                {/* Account Holder Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Account Holder Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    placeholder="e.g. HopeBridge Foundation Inc."
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.accountHolderName
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.accountHolderName && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.accountHolderName}</p>
                  )}
                </div>

                {/* Account Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData((p) => ({ ...p, accountNumber: val }));
                      if (errors.accountNumber) setErrors((p) => ({ ...p, accountNumber: "" }));
                    }}
                    placeholder="Enter digits only"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.accountNumber
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.accountNumber && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.accountNumber}</p>
                  )}
                </div>

                {/* Confirm Account Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Confirm Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmAccountNumber"
                    value={formData.confirmAccountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData((p) => ({ ...p, confirmAccountNumber: val }));
                      if (errors.confirmAccountNumber)
                        setErrors((p) => ({ ...p, confirmAccountNumber: "" }));
                    }}
                    placeholder="Re-enter account digits"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.confirmAccountNumber
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.confirmAccountNumber && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.confirmAccountNumber}</p>
                  )}
                </div>

                {/* Routing Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Routing Number (9 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="routingNumber"
                    maxLength={9}
                    value={formData.routingNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                      setFormData((p) => ({ ...p, routingNumber: val }));
                      if (errors.routingNumber) setErrors((p) => ({ ...p, routingNumber: "" }));
                    }}
                    placeholder="123456789"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.routingNumber
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.routingNumber && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.routingNumber}</p>
                  )}
                </div>

                {/* Account Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Account Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.accountType
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  >
                    <option value="">Select Account Type</option>
                    <option value="checking">Checking Account</option>
                    <option value="savings">Savings Account</option>
                  </select>
                  {errors.accountType && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.accountType}</p>
                  )}
                </div>

                {/* SWIFT / BIC Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    SWIFT / BIC Code (Optional)
                  </label>
                  <input
                    type="text"
                    name="swiftCode"
                    value={formData.swiftCode}
                    onChange={handleChange}
                    placeholder="e.g. CHASUS33"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                  />
                  <p className="text-[11px] text-[#98A2B3]">For international wire transfers</p>
                </div>

                {/* Bank Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Bank Branch Address (Optional)
                  </label>
                  <input
                    type="text"
                    name="bankAddress"
                    value={formData.bankAddress}
                    onChange={handleChange}
                    placeholder="e.g. 100 Main St, New York, NY"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 focus:outline-none transition-all"
                  />
                  <p className="text-[11px] text-[#98A2B3]">Physical bank branch location</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ORGANIZATION DETAILS & ADDRESS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Legal Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="orgName"
                    value={formData.orgName}
                    onChange={handleChange}
                    placeholder="e.g. HopeBridge Outreach Foundation"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.orgName
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.orgName && <p className="text-[11px] font-medium text-rose-500">{errors.orgName}</p>}
                </div>

                {/* Organization Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Organization Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="orgType"
                    value={formData.orgType}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.orgType
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  >
                    <option value="">Select Organization Type</option>
                    <option value="nonprofit">Nonprofit Organization</option>
                    <option value="shelter">Homeless Shelter</option>
                    <option value="food_bank">Food Bank / Soup Kitchen</option>
                    <option value="employment_agency">Employment Agency</option>
                    <option value="merchant">Local Business / Merchant</option>
                    <option value="government">Government Service</option>
                    <option value="NGO">NGO (Legacy)</option>
                    <option value="Private">Private (Legacy)</option>
                    <option value="Govt">Govt (Legacy)</option>
                  </select>
                  {errors.orgType && <p className="text-[11px] font-medium text-rose-500">{errors.orgType}</p>}
                </div>

                {/* Street Address (Full Width) */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-[#172033]">
                    Street Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3] pointer-events-none" />
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleChange}
                      placeholder="e.g. 1234 Main Boulevard, Suite 500"
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                        errors.streetAddress
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                          : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                      }`}
                    />
                  </div>
                  {errors.streetAddress && (
                    <p className="text-[11px] font-medium text-rose-500">{errors.streetAddress}</p>
                  )}
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
                    placeholder="San Francisco"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.city
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.city && <p className="text-[11px] font-medium text-rose-500">{errors.city}</p>}
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    State / Region <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="California"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.state
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.state && <p className="text-[11px] font-medium text-rose-500">{errors.state}</p>}
                </div>

                {/* Zip Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Zip Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    maxLength={10}
                    value={formData.zipCode}
                    onChange={handleZipCodeChange}
                    placeholder="94103 or 94103-1234"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.zipCode
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.zipCode && <p className="text-[11px] font-medium text-rose-500">{errors.zipCode}</p>}
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#172033]">
                    Country <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="United States"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                      errors.country
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                        : "border-[#E7ECF2] focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10"
                    }`}
                  />
                  {errors.country && <p className="text-[11px] font-medium text-rose-500">{errors.country}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: MEDIA, VERIFICATION & FINAL REVIEW */}
          {currentStep === 4 && (
            <div className="space-y-8">
              {/* 4A. Photos Upload Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF2]">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#2878E5]" />
                    <h3 className="text-xs font-bold text-[#172033]">
                      Organization Facility Photos <span className="text-rose-500">*</span>
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#68778D] font-medium">
                    {photos.filter((p) => p.file).length} / 5 uploaded (min 1 required)
                  </span>
                </div>

                {errors.photos && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {errors.photos}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="p-3 bg-[#FAFBFD] rounded-xl border border-[#E7ECF2] relative space-y-2 group"
                    >
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(photo.id)}
                        className="absolute top-2 right-2 p-1 text-[#98A2B3] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#172033]">
                          Photo #{index + 1} Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={photo.name}
                          onChange={(e) => handlePhotoNameChange(photo.id, e.target.value)}
                          placeholder="e.g. Facility Entrance"
                          className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:outline-none ${
                            errors[`photoName_${photo.id}`]
                              ? "border-rose-400"
                              : "border-[#E7ECF2] focus:border-[#2878E5]"
                          }`}
                        />
                        {errors[`photoName_${photo.id}`] && (
                          <p className="text-[10px] text-rose-500 font-medium">
                            {errors[`photoName_${photo.id}`]}
                          </p>
                        )}
                      </div>

                      <div>
                        {photo.preview ? (
                          <div className="relative h-24 rounded-lg overflow-hidden border border-[#E7ECF2]">
                            <img
                              src={photo.preview}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-white cursor-pointer hover:bg-blue-50/40 transition-colors">
                            <UploadCloud className="w-5 h-5 text-[#2878E5] mb-1" />
                            <span className="text-[11px] font-semibold text-[#2878E5]">
                              Select Image File
                            </span>
                            <span className="text-[10px] text-[#98A2B3]">JPG, PNG, WEBP &lt; 5MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoFileChange(photo.id, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}

                  {photos.length < 5 && (
                    <button
                      type="button"
                      onClick={handlePhotoAdd}
                      className="h-full min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed border-[#E7ECF2] hover:border-[#2878E5] rounded-xl text-[#68778D] hover:text-[#2878E5] hover:bg-blue-50/30 transition-all p-4"
                    >
                      <Plus className="w-6 h-6 mb-1 text-[#2878E5]" />
                      <span className="text-xs font-bold">Add Another Photo</span>
                      <span className="text-[11px] text-[#98A2B3]">Up to 5 total</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4B. Verification Documents Upload Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF2]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2878E5]" />
                    <h3 className="text-xs font-bold text-[#172033]">
                      Official Verification Documents <span className="text-rose-500">*</span>
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#68778D] font-medium">
                    {documents.filter((d) => d.file).length} / 3 uploaded (min 1 required)
                  </span>
                </div>

                {errors.documents && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {errors.documents}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-[#FAFBFD] rounded-xl border border-[#E7ECF2] relative space-y-2 group"
                    >
                      <button
                        type="button"
                        onClick={() => handleDocumentRemove(doc.id)}
                        className="absolute top-2 right-2 p-1 text-[#98A2B3] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#172033]">
                          Document #{index + 1} Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={doc.name}
                          onChange={(e) => handleDocumentNameChange(doc.id, e.target.value)}
                          placeholder="e.g. 501(c)(3) Certificate"
                          className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:outline-none ${
                            errors[`documentName_${doc.id}`]
                              ? "border-rose-400"
                              : "border-[#E7ECF2] focus:border-[#2878E5]"
                          }`}
                        />
                        {errors[`documentName_${doc.id}`] && (
                          <p className="text-[10px] text-rose-500 font-medium">
                            {errors[`documentName_${doc.id}`]}
                          </p>
                        )}
                      </div>

                      <div>
                        {doc.file ? (
                          <div className="p-2.5 rounded-lg bg-white border border-[#E7ECF2] flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#2878E5] flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#172033] truncate">
                                {doc.file.name}
                              </p>
                              <p className="text-[10px] text-[#98A2B3]">
                                {(doc.file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-20 rounded-lg border border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-white cursor-pointer hover:bg-blue-50/40 transition-colors">
                            <UploadCloud className="w-5 h-5 text-[#2878E5] mb-1" />
                            <span className="text-[11px] font-semibold text-[#2878E5]">
                              Select Document
                            </span>
                            <span className="text-[10px] text-[#98A2B3]">PDF, DOCX, JPG &lt; 5MB</span>
                            <input
                              type="file"
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentFileChange(doc.id, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}

                  {documents.length < 3 && (
                    <button
                      type="button"
                      onClick={handleDocumentAdd}
                      className="h-full min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed border-[#E7ECF2] hover:border-[#2878E5] rounded-xl text-[#68778D] hover:text-[#2878E5] hover:bg-blue-50/30 transition-all p-4"
                    >
                      <Plus className="w-6 h-6 mb-1 text-[#2878E5]" />
                      <span className="text-xs font-bold">Add Verification Document</span>
                      <span className="text-[11px] text-[#98A2B3]">Up to 3 total</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4C. Summary Review Card */}
              <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#E7ECF2] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7ECF2]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2878E5]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#172033]">
                      Registration Summary & Pre-Flight Review
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ready for Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Step 1 Review */}
                  <div className="p-3 bg-white rounded-xl border border-[#E7ECF2] space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                        Account & Contact
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-[#2878E5] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                    </div>
                    <p className="font-bold text-[#172033] truncate">{formData.email}</p>
                    <p className="text-[#68778D] truncate">
                      {formData.contactPerson || "No contact person"}
                    </p>
                    <p className="text-[#68778D]">{formData.contactPhone || "No phone entered"}</p>
                  </div>

                  {/* Step 2 Review */}
                  <div className="p-3 bg-white rounded-xl border border-[#E7ECF2] space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                        Banking Details
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-[#2878E5] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                    </div>
                    <p className="font-bold text-[#172033] truncate">{formData.bankName}</p>
                    <p className="text-[#68778D] truncate">{formData.accountHolderName}</p>
                    <p className="text-[#68778D]">
                      •••• {formData.accountNumber ? formData.accountNumber.slice(-4) : "••••"} (
                      {formData.accountType})
                    </p>
                  </div>

                  {/* Step 3 Review */}
                  <div className="p-3 bg-white rounded-xl border border-[#E7ECF2] space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                        Organization
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-[#2878E5] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                    </div>
                    <p className="font-bold text-[#172033] truncate">{formData.orgName}</p>
                    <p className="text-[#68778D] capitalize">{formData.orgType || "N/A"}</p>
                    <p className="text-[#68778D] truncate">
                      {formData.city}, {formData.state} {formData.zipCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Sticky Form Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7ECF2] px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between gap-3">
          {/* Left: Cancel */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/organizations")}
            className="px-4 py-2.5 rounded-xl border border-[#E7ECF2] text-xs font-semibold text-[#68778D] hover:text-[#172033] hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          {/* Right: Back & Continue/Submit */}
          <div className="flex items-center gap-2.5">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-xl border border-[#E7ECF2] text-xs font-semibold text-[#172033] hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-[#2878E5] hover:bg-[#1d6cd4] text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#128857] text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registering Organization...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Register Organization</span>
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

export default AddOrganization;
