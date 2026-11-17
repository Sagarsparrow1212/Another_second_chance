import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Store,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Pencil,
  FileText,
  Briefcase,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Trash2,
  DollarSign,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Select,
  Option,
} from "@material-tailwind/react";
import { API_BASE_URL_V1, API_BASE_URL, getFileUrl } from "@/configs/api";

const formatPhoneNumber = (value) => {
  if (!value) return "N/A";
  const phoneNumber = value.replace(/\D/g, "");
  const limitedNumber = phoneNumber.slice(0, 10);
  if (limitedNumber.length === 0) {
    return value;
  } else if (limitedNumber.length <= 3) {
    return `(${limitedNumber}`;
  } else if (limitedNumber.length <= 6) {
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
  } else {
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6, 10)}`;
  }
};

export function MerchantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Job dialog states
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobFormData, setJobFormData] = useState({
    title: "",
    description: "",
    category: "",
    salaryRange: { min: "", max: "" },
    location: { address: "", lat: "", lng: "" },
    status: "active",
  });
  const [jobFormErrors, setJobFormErrors] = useState({});
  const [jobSubmitLoading, setJobSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchMerchantDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/merchants/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch merchant details");
        }

        const data = await response.json();
        if (data.success) {
          setMerchant(data.data.merchant || data.data);
        } else {
          setError(data.message || "Failed to fetch merchant details");
        }
      } catch (err) {
        console.error("Fetch merchant details error:", err);
        setError(err.message || "Failed to load merchant details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMerchantDetails();
  }, [id]);

  // Fetch jobs
  const fetchJobs = async () => {
    if (!id) return;
    try {
      setJobsLoading(true);
      const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/merchants/${id}/jobs`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      if (data.success) {
        setJobs(data.data.jobs || []);
      }
    } catch (err) {
      console.error("Fetch jobs error:", err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (merchant) {
      fetchJobs();
    }
  }, [merchant, id]);

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getMerchantFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    if (filePath.startsWith("/uploads")) return `${API_BASE_URL}${filePath}`;
    return `${API_BASE_URL}/uploads/merchants/${filePath}`;
  };

  // Job CRUD handlers
  const openCreateJobDialog = () => {
    setEditingJob(null);
    setJobFormData({
      title: "",
      description: "",
      category: "",
      salaryRange: { min: "", max: "" },
      location: { address: "", lat: "", lng: "" },
      status: "active",
    });
    setJobFormErrors({});
    setShowJobDialog(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title || "",
      description: job.description || "",
      category: job.category || "",
      salaryRange: {
        min: job.salaryRange?.min?.toString() || "",
        max: job.salaryRange?.max?.toString() || "",
      },
      location: {
        address: job.location?.address || "",
        lat: job.location?.lat ? job.location.lat.toString() : "",
        lng: job.location?.lng ? job.location.lng.toString() : "",
      },
      status: job.status || "active",
    });
    setJobFormErrors({});
    setShowJobDialog(true);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job opportunity?")) return;
    try {
      const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchJobs();
      } else {
        alert(data.message || "Failed to delete job");
      }
    } catch (err) {
      console.error("Delete job error:", err);
      alert("Failed to delete job.");
    }
  };

  const validateJobForm = () => {
    const errors = {};
    if (!jobFormData.title.trim()) errors.title = "Job title is required";
    if (!jobFormData.category.trim()) errors.category = "Category is required";
    if (!jobFormData.location.address.trim()) errors.locationAddress = "Location address is required";
    setJobFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveJob = async () => {
    if (!validateJobForm()) return;
    setJobSubmitLoading(true);

    try {
      const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const endpoint = editingJob
        ? `${API_BASE_URL_V1}/jobs/${editingJob._id || editingJob.id}`
        : `${API_BASE_URL_V1}/merchants/${id}/jobs`;

      const method = editingJob ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title: jobFormData.title.trim(),
          description: jobFormData.description.trim(),
          category: jobFormData.category.trim(),
          salaryRange: {
            min: parseFloat(jobFormData.salaryRange.min) || 0,
            max: parseFloat(jobFormData.salaryRange.max) || 0,
          },
          location: {
            address: jobFormData.location.address.trim(),
            lat: jobFormData.location.lat ? parseFloat(jobFormData.location.lat) : null,
            lng: jobFormData.location.lng ? parseFloat(jobFormData.location.lng) : null,
          },
          status: jobFormData.status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowJobDialog(false);
        fetchJobs();
      } else {
        setJobFormErrors({ submit: data.message || "Failed to save job" });
      }
    } catch (err) {
      console.error("Save job error:", err);
      setJobFormErrors({ submit: err.message || "An error occurred" });
    } finally {
      setJobSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-8 h-8 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-enterprise-muted">Loading merchant details...</p>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7ECF2] p-8 text-center max-w-md mx-auto my-12 shadow-card">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-enterprise-textPrimary mb-1">
          {error || "Merchant Not Found"}
        </h3>
        <p className="text-xs text-enterprise-textSecondary mb-4">
          The requested merchant profile could not be loaded.
        </p>
        <button
          onClick={() => navigate("/dashboard/merchants")}
          className="px-4 py-2 bg-[#2878E5] text-white text-xs font-semibold rounded-lg hover:bg-[#1d6cd4] transition-colors"
        >
          Back to Merchants
        </button>
      </div>
    );
  }

  const tabsData = [
    { label: "Basic Information", value: "basic", icon: Building2 },
    { label: "Address Information", value: "address", icon: MapPin },
    { label: "Documents", value: "documents", icon: FileText },
    { label: "Jobs", value: "jobs", icon: Briefcase, count: jobs.length },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <header className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-[0_1px_3px_0_rgba(16,24,40,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left section: Back button + Avatar + Name + Metadata */}
          <div className="flex items-start sm:items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group p-2.5 sm:px-3 sm:py-2.5 rounded-xl border border-[#E7ECF2] text-[#68778D] hover:text-[#172033] hover:bg-slate-50/80 hover:border-slate-300 transition-all flex items-center gap-2 flex-shrink-0"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 text-[#68778D] group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
                Back
              </span>
            </button>

            <div className="hidden sm:block w-px h-10 bg-[#E7ECF2]" />

            <div className="flex items-center gap-3.5">
              {/* Merchant Avatar */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-[#2878E5]/20 border border-[#2878E5]/20 flex items-center justify-center flex-shrink-0 shadow-sm font-bold text-lg text-[#2878E5]">
                {merchant.businessName ? merchant.businessName.charAt(0).toUpperCase() : "M"}
              </div>

              {/* Merchant Title & Subtitle */}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] truncate">
                    {merchant.businessName}
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-[#475467] border border-slate-200/80">
                    {merchant.businessType || "Vendor"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#68778D] font-medium">
                  <span>Merchant Details</span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" />
                    Registered {new Date(merchant.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right section: Status badge + Edit action */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E7ECF2]">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Merchant</span>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => navigate(`/dashboard/merchants/${id}/edit`)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2878E5] text-white text-xs font-semibold hover:bg-[#1d6cd4] shadow-sm hover:shadow transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Merchant</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Navigation Tabs & Content Container */}
      <main className="bg-white rounded-2xl border border-[#E7ECF2] shadow-[0_1px_3px_0_rgba(16,24,40,0.04)] overflow-hidden">
        {/* Navigation Bar */}
        <nav
          aria-label="Merchant sections"
          className="border-b border-[#E7ECF2] bg-[#FAFBFD] px-4 sm:px-6 overflow-x-auto scrollbar-none"
        >
          <div className="flex space-x-1 sm:space-x-2 min-w-max">
            {tabsData.map(({ label, value, icon: TabIcon, count }) => {
              const isActive = activeTab === value;
              return (
                <button
                  key={value}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(value)}
                  className={`group relative flex items-center gap-2 py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all outline-none ${
                    isActive
                      ? "text-[#2878E5]"
                      : "text-[#68778D] hover:text-[#172033] hover:bg-slate-100/60 rounded-t-lg"
                  }`}
                >
                  <TabIcon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#2878E5]" : "text-[#98A2B3] group-hover:text-[#68778D]"
                    }`}
                  />
                  <span>{label}</span>

                  {typeof count === "number" && (
                    <span
                      className={`ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-[#2878E5]/10 text-[#2878E5]"
                          : "bg-slate-200/80 text-[#68778D] group-hover:bg-slate-300/80"
                      }`}
                    >
                      {count}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2878E5] rounded-t-full shadow-[0_-1px_4px_rgba(40,120,229,0.3)]" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Content Panes */}
        <div className="p-5 sm:p-7 lg:p-8 min-h-[500px]">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === "basic" && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7ECF2] gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#172033]">Basic Information</h2>
                  <p className="text-xs text-[#68778D] mt-0.5">
                    Core business credentials and designated point of contact.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#2878E5] font-semibold bg-[#2878E5]/5 px-2.5 py-1 rounded-lg border border-[#2878E5]/15 self-start sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Business
                </span>
              </div>

              {/* 2-Column Responsive Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Business Type */}
                <div className="group p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-blue-50/80 text-[#2878E5] border border-blue-100 flex-shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                        Business Type
                      </span>
                      <p className="text-sm sm:text-base font-bold text-[#172033] mt-1 break-words">
                        {merchant.businessType || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Person */}
                <div className="group p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-indigo-50/80 text-indigo-600 border border-indigo-100 flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                        Contact Person
                      </span>
                      <p className="text-sm sm:text-base font-bold text-[#172033] mt-1 break-words">
                        {merchant.contactPersonName || merchant.contactPerson || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div className="group p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 text-emerald-600 border border-emerald-100 flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                          Email Address
                        </span>
                        {merchant.email && (
                          <button
                            onClick={() => handleCopyEmail(merchant.email)}
                            className="text-xs text-[#2878E5] hover:text-[#1d6cd4] flex items-center gap-1 font-semibold"
                          >
                            {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedEmail ? "Copied" : "Copy"}
                          </button>
                        )}
                      </div>
                      <a
                        href={`mailto:${merchant.email}`}
                        className="text-sm sm:text-base font-bold text-[#2878E5] hover:underline mt-1 block truncate"
                      >
                        {merchant.email || "N/A"}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="group p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-purple-50/80 text-purple-600 border border-purple-100 flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                        Phone Number
                      </span>
                      <p className="text-sm sm:text-base font-bold text-[#172033] mt-1 break-words">
                        {formatPhoneNumber(merchant.phoneNumber || merchant.phone)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Registration Date */}
                <div className="group p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-50/80 text-amber-600 border border-amber-100 flex-shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                        Registration Date
                      </span>
                      <p className="text-sm sm:text-base font-bold text-[#172033] mt-1 break-words">
                        {new Date(merchant.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="group p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                        Account Status
                      </span>
                      <p className="text-sm sm:text-base font-bold text-emerald-600 mt-1">
                        Active & Verified
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: ADDRESS INFORMATION */}
          {activeTab === "address" && (
            <section className="space-y-6">
              <div className="pb-4 border-b border-[#E7ECF2]">
                <h2 className="text-base font-bold text-[#172033]">Address & Location</h2>
                <p className="text-xs text-[#68778D] mt-0.5">
                  Physical operating address and registered facility details.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 group p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 transition-all">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                    Street Address
                  </span>
                  <p className="text-sm sm:text-base font-bold text-[#172033] mt-1">
                    {merchant.streetAddress || merchant.address || "N/A"}
                  </p>
                </div>

                <div className="group p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 transition-all">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                    City
                  </span>
                  <p className="text-sm sm:text-base font-bold text-[#172033] mt-1">
                    {merchant.city || "N/A"}
                  </p>
                </div>

                <div className="group p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 transition-all">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                    State / Region
                  </span>
                  <p className="text-sm sm:text-base font-bold text-[#172033] mt-1">
                    {merchant.state || "N/A"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === "documents" && (
            <section className="space-y-6">
              <div className="pb-4 border-b border-[#E7ECF2]">
                <h2 className="text-base font-bold text-[#172033]">Verification Documents</h2>
                <p className="text-xs text-[#68778D] mt-0.5">
                  Official certificates and identity proofs uploaded during registration.
                </p>
              </div>

              {merchant.gstCertificate || merchant.photoId || merchant.businessLicense ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {merchant.gstCertificate && (
                    <div className="p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-[#2878E5]" />
                        <h4 className="text-xs font-bold text-[#172033] truncate">
                          Certificate of Incorporation
                        </h4>
                      </div>
                      <a
                        href={getMerchantFileUrl(merchant.gstCertificate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878E5] hover:underline mt-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Document
                      </a>
                    </div>
                  )}

                  {merchant.photoId && (
                    <div className="p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-[#2878E5]" />
                        <h4 className="text-xs font-bold text-[#172033] truncate">
                          State ID / Photo ID
                        </h4>
                      </div>
                      <a
                        href={getMerchantFileUrl(merchant.photoId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878E5] hover:underline mt-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-[#172033]">No documents uploaded</p>
                  <p className="text-[11px] text-[#68778D] mt-0.5">
                    This merchant has not provided external verification documents.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* TAB 4: JOBS */}
          {activeTab === "jobs" && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7ECF2] gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#172033]">Job Opportunities</h2>
                  <p className="text-xs text-[#68778D] mt-0.5">
                    Manage active employment and volunteer listings created by this merchant.
                  </p>
                </div>
                <button
                  onClick={openCreateJobDialog}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2878E5] text-white text-xs font-semibold hover:bg-[#1d6cd4] shadow-sm hover:shadow transition-all self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Job</span>
                </button>
              </div>

              {jobsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-[#68778D]">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2878E5] flex items-center justify-center mx-auto mb-2">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#172033]">No jobs posted yet</h4>
                  <p className="text-xs text-[#68778D] mt-1 max-w-sm mx-auto">
                    Create the first job opening to help homeless individuals find meaningful work.
                  </p>
                  <button
                    onClick={openCreateJobDialog}
                    className="mt-4 px-4 py-2 bg-[#2878E5] text-white text-xs font-semibold rounded-lg hover:bg-[#1d6cd4]"
                  >
                    Create Job Opening
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job._id || job.id}
                      className="p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-bold text-[#172033] truncate">
                            {job.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#2878E5] border border-blue-200">
                            {job.category || "General"}
                          </span>
                        </div>
                        {job.description && (
                          <p className="text-xs text-[#68778D] mt-1 line-clamp-2">
                            {job.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-[#98A2B3]">
                          {job.location?.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#98A2B3]" />
                              {job.location.address}
                            </span>
                          )}
                          {job.salaryRange && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-emerald-600" />
                              ${job.salaryRange.min} - ${job.salaryRange.max}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#172033] bg-white border border-[#E7ECF2] hover:bg-slate-50 rounded-lg shadow-subtle transition-colors flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job._id || job.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* 3. Job Form Dialog */}
      <Dialog
        open={showJobDialog}
        handler={() => setShowJobDialog(false)}
        size="md"
        className="rounded-2xl p-6"
      >
        <DialogHeader className="p-0 pb-3 flex items-center gap-2 text-base font-bold text-enterprise-textPrimary border-b border-[#E7ECF2]">
          <Briefcase className="w-5 h-5 text-[#2878E5]" />
          {editingJob ? "Edit Job Opportunity" : "Create New Job Opportunity"}
        </DialogHeader>

        <DialogBody className="p-0 pt-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {jobFormErrors.submit && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {jobFormErrors.submit}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Job Title *
            </label>
            <input
              type="text"
              value={jobFormData.title}
              onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
              placeholder="e.g. Retail Associate, Kitchen Helper..."
              className="w-full px-3 py-2 text-xs border border-[#E7ECF2] rounded-lg focus:outline-none focus:border-[#2878E5]"
            />
            {jobFormErrors.title && (
              <p className="text-[11px] text-rose-500 mt-1">{jobFormErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Category *
            </label>
            <input
              type="text"
              value={jobFormData.category}
              onChange={(e) => setJobFormData({ ...jobFormData, category: e.target.value })}
              placeholder="e.g. Sales, Hospitality, Maintenance..."
              className="w-full px-3 py-2 text-xs border border-[#E7ECF2] rounded-lg focus:outline-none focus:border-[#2878E5]"
            />
            {jobFormErrors.category && (
              <p className="text-[11px] text-rose-500 mt-1">{jobFormErrors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Job Description
            </label>
            <textarea
              rows={3}
              value={jobFormData.description}
              onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
              placeholder="Responsibilities, requirements, hours..."
              className="w-full px-3 py-2 text-xs border border-[#E7ECF2] rounded-lg focus:outline-none focus:border-[#2878E5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Min Salary ($)
              </label>
              <input
                type="number"
                value={jobFormData.salaryRange.min}
                onChange={(e) =>
                  setJobFormData({
                    ...jobFormData,
                    salaryRange: { ...jobFormData.salaryRange, min: e.target.value },
                  })
                }
                placeholder="15"
                className="w-full px-3 py-2 text-xs border border-[#E7ECF2] rounded-lg focus:outline-none focus:border-[#2878E5]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Max Salary ($)
              </label>
              <input
                type="number"
                value={jobFormData.salaryRange.max}
                onChange={(e) =>
                  setJobFormData({
                    ...jobFormData,
                    salaryRange: { ...jobFormData.salaryRange, max: e.target.value },
                  })
                }
                placeholder="25"
                className="w-full px-3 py-2 text-xs border border-[#E7ECF2] rounded-lg focus:outline-none focus:border-[#2878E5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Location Address *
            </label>
            <input
              type="text"
              value={jobFormData.location.address}
              onChange={(e) =>
                setJobFormData({
                  ...jobFormData,
                  location: { ...jobFormData.location, address: e.target.value },
                })
              }
              placeholder="e.g. 123 Main St, New York, NY"
              className="w-full px-3 py-2 text-xs border border-[#E7ECF2] rounded-lg focus:outline-none focus:border-[#2878E5]"
            />
            {jobFormErrors.locationAddress && (
              <p className="text-[11px] text-rose-500 mt-1">{jobFormErrors.locationAddress}</p>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="p-0 pt-4 flex gap-2 justify-end border-t border-[#E7ECF2]">
          <Button
            variant="text"
            size="sm"
            onClick={() => setShowJobDialog(false)}
            className="normal-case text-xs text-[#68778D]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSaveJob}
            disabled={jobSubmitLoading}
            className="bg-[#2878E5] hover:bg-[#1d6cd4] text-white normal-case text-xs font-semibold px-4 py-2"
          >
            {jobSubmitLoading ? "Saving..." : editingJob ? "Update Job" : "Create Job"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default MerchantDetails;
