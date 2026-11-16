import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Pencil,
  Briefcase,
  Building2,
  DollarSign,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Languages,
  Activity,
  FileText,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogHeader, DialogBody } from "@material-tailwind/react";
import { API_BASE_URL_V1, API_BASE_URL, getFileUrl, getUploadUrl } from "@/configs/api";

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

export function HomelessDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [homeless, setHomeless] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    const fetchHomelessDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const sessionData = localStorage.getItem("auth_session");
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/homeless/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch individual profile");
        }

        const data = await response.json();
        if (data.success) {
          setHomeless(data.data.homeless || data.data);
        } else {
          setError(data.message || "Failed to fetch individual profile");
        }
      } catch (err) {
        console.error("Fetch homeless details error:", err);
        setError(err.message || "Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchHomelessDetails();
  }, [id]);

  useEffect(() => {
    const fetchDonations = async () => {
      if (activeTab !== "donations" || !id) return;
      try {
        setLoadingDonations(true);
        const sessionData = localStorage.getItem("auth_session");
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/donations/homeless/${id}?limit=100`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        const data = await response.json();
        if (data.success) {
          setDonations(data.data.donations || []);
        } else {
          setDonations([]);
        }
      } catch (err) {
        console.error("Fetch donations error:", err);
        setDonations([]);
      } finally {
        setLoadingDonations(false);
      }
    };

    fetchDonations();
  }, [activeTab, id]);

  const getHomelessFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    if (filePath.startsWith("/uploads")) return getFileUrl(filePath);
    return getUploadUrl("homeless", filePath);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-8 h-8 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-enterprise-muted">Loading profile details...</p>
      </div>
    );
  }

  if (error || !homeless) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7ECF2] p-8 text-center max-w-md mx-auto my-12 shadow-card">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-enterprise-textPrimary mb-1">
          {error || "Profile Not Found"}
        </h3>
        <p className="text-xs text-enterprise-textSecondary mb-4">
          The requested homeless user profile could not be loaded.
        </p>
        <button
          onClick={() => navigate("/dashboard/homeless")}
          className="px-4 py-2 bg-[#2878E5] text-white text-xs font-semibold rounded-lg hover:bg-[#1d6cd4] transition-colors"
        >
          Back to Homeless Users
        </button>
      </div>
    );
  }

  const displayName = homeless.name || homeless.fullName || "Homeless Individual";
  const photoUrl = getHomelessFileUrl(homeless.profilePicture);

  const tabsData = [
    { label: "Basic Information", value: "basic", icon: User },
    { label: "Skills & Experience", value: "skills", icon: Briefcase },
    { label: "Additional Info", value: "additional", icon: MapPin },
    { label: "Donations", value: "donations", icon: DollarSign, count: donations.length },
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
              {/* Profile Avatar */}
              <div
                onClick={() => photoUrl && setImageModalOpen(true)}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-[#E7ECF2] flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden font-bold text-lg text-white ${
                  photoUrl ? "cursor-pointer hover:opacity-90 transition-opacity" : "bg-[#172B4D]"
                }`}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentNode.innerText = displayName.charAt(0).toUpperCase();
                      e.target.parentNode.className += " bg-[#172B4D]";
                    }}
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] truncate">
                    {displayName}
                  </h1>
                  {homeless.username && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-[#475467] border border-slate-200">
                      @{homeless.username}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#68778D] font-medium">
                  <span>
                    {homeless.age ? `${homeless.age} yrs` : "Age N/A"}
                    {homeless.gender && ` • ${homeless.gender}`}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" />
                    Registered {formatDate(homeless.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right section: Status badge + Edit action */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E7ECF2]">
            {/* Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                homeless.verified !== false
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  homeless.verified !== false ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span>{homeless.verified !== false ? "Verified Profile" : "Pending Review"}</span>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => navigate(`/dashboard/homeless/${id}/edit`)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2878E5] text-white text-xs font-semibold hover:bg-[#1d6cd4] shadow-sm hover:shadow transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Navigation Tabs & Content Container */}
      <main className="bg-white rounded-2xl border border-[#E7ECF2] shadow-[0_1px_3px_0_rgba(16,24,40,0.04)] overflow-hidden">
        {/* Navigation Bar */}
        <nav
          aria-label="Homeless profile sections"
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
        <div className="p-5 sm:p-7 lg:p-8 min-h-[460px]">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === "basic" && (
            <section className="space-y-6">
              {/* Profile Card Banner (Bio + Sponsor Org) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 border border-[#E7ECF2] flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div
                  onClick={() => photoUrl && setImageModalOpen(true)}
                  className={`w-20 h-20 rounded-2xl border border-white shadow-card flex items-center justify-center flex-shrink-0 text-white font-bold text-2xl ${
                    photoUrl ? "cursor-pointer overflow-hidden" : "bg-[#172B4D]"
                  }`}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-[#172033]">{displayName}</h3>
                    {homeless.organization && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-medium bg-white text-[#2878E5] border border-[#2878E5]/20 shadow-subtle">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Sponsored by {homeless.organization.name || "Partner Organization"}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#68778D] leading-relaxed max-w-3xl">
                    {homeless.bio ||
                      "Registered beneficiary receiving platform support, job placement assistance, and donor contributions."}
                  </p>
                </div>
              </div>

              {/* Structured Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Username */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Username
                    </span>
                    <p className="text-sm font-semibold text-[#172033]">
                      @{homeless.username || "n/a"}
                    </p>
                  </div>
                  {homeless.username && (
                    <button
                      onClick={() => handleCopy(homeless.username, "username")}
                      className="p-2 rounded-lg bg-white border border-[#E7ECF2] hover:bg-slate-50 text-[#68778D] transition-colors"
                      title="Copy Username"
                    >
                      {copiedKey === "username" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Email Address */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Email Address
                    </span>
                    {homeless.email ? (
                      <a
                        href={`mailto:${homeless.email}`}
                        className="text-sm font-semibold text-[#2878E5] hover:underline truncate block"
                      >
                        {homeless.email}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-[#172033]">N/A</p>
                    )}
                  </div>
                  {homeless.email && (
                    <button
                      onClick={() => handleCopy(homeless.email, "email")}
                      className="p-2 rounded-lg bg-white border border-[#E7ECF2] hover:bg-slate-50 text-[#68778D] transition-colors"
                      title="Copy Email"
                    >
                      {copiedKey === "email" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Contact Phone */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Phone Number
                    </span>
                    <p className="text-sm font-semibold text-[#172033]">
                      {formatPhoneNumber(homeless.contactPhone || homeless.phone)}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E7ECF2] flex items-center justify-center text-[#2878E5] flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>

                {/* Organization Sponsor */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Sponsor Organization
                    </span>
                    {homeless.organization ? (
                      <button
                        onClick={() =>
                          navigate(`/dashboard/organizations/${homeless.organization.id}`)
                        }
                        className="text-sm font-semibold text-[#2878E5] hover:underline truncate block text-left"
                      >
                        {homeless.organization.name}
                      </button>
                    ) : (
                      <p className="text-sm font-semibold text-[#172033]">None Assigned</p>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E7ECF2] flex items-center justify-center text-[#2878E5] flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Registration Date */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between md:col-span-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Registration Date
                    </span>
                    <p className="text-sm font-semibold text-[#172033]">
                      {formatDate(homeless.createdAt)}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E7ECF2] flex items-center justify-center text-[#2878E5] flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: SKILLS & EXPERIENCE */}
          {activeTab === "skills" && (
            <section className="space-y-6">
              <div className="pb-4 border-b border-[#E7ECF2]">
                <h2 className="text-base font-bold text-[#172033]">Skills & Work Experience</h2>
                <p className="text-xs text-[#68778D] mt-0.5">
                  Employment competencies, language proficiencies, and work history.
                </p>
              </div>

              {/* Skills Tags */}
              <div className="p-5 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block">
                  Identified Skills
                </span>
                {homeless.skillset && homeless.skillset.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {homeless.skillset.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-[#E7ECF2] text-[#172033] shadow-subtle"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#2878E5]" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#68778D]">No specific skills recorded.</p>
                )}
              </div>

              {/* Experience Details */}
              <div className="p-5 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block">
                  Work Experience & Background
                </span>
                <p className="text-xs text-[#172033] font-medium leading-relaxed whitespace-pre-wrap">
                  {homeless.experience || "No prior job history or employment record provided."}
                </p>
              </div>

              {/* Languages */}
              <div className="p-5 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] space-y-3">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-[#2878E5]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
                    Languages Spoken
                  </span>
                </div>
                {homeless.languages && homeless.languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {homeless.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-[#2878E5] border border-blue-200"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#68778D]">English (Default)</p>
                )}
              </div>
            </section>
          )}

          {/* TAB 3: ADDITIONAL INFO */}
          {activeTab === "additional" && (
            <section className="space-y-6">
              <div className="pb-4 border-b border-[#E7ECF2]">
                <h2 className="text-base font-bold text-[#172033]">Additional Information</h2>
                <p className="text-xs text-[#68778D] mt-0.5">
                  Location details, accommodations, and special medical or health considerations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                    Primary Area / Location
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#172033]">
                    <MapPin className="w-4 h-4 text-[#2878E5] flex-shrink-0" />
                    <span>{homeless.location || "Unspecified Area"}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                    Shelter or Mailing Address
                  </span>
                  <p className="text-sm font-semibold text-[#172033]">
                    {homeless.address || "No permanent address"}
                  </p>
                </div>

                {/* Health Conditions */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] md:col-span-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Activity className="w-4 h-4 text-rose-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
                      Health Conditions & Dietary Needs
                    </span>
                  </div>
                  <p className="text-xs text-[#172033] font-medium leading-relaxed">
                    {homeless.healthConditions || "None reported."}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: DONATIONS */}
          {activeTab === "donations" && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7ECF2] gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#172033]">Donations Received</h2>
                  <p className="text-xs text-[#68778D] mt-0.5">
                    History of financial aid and item donations distributed to this individual.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-[#475467] border border-slate-200 w-fit">
                  {donations.length} total receipts
                </span>
              </div>

              {loadingDonations ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-7 h-7 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-semibold text-enterprise-muted">Loading donation receipts...</p>
                </div>
              ) : donations.length === 0 ? (
                <div className="text-center py-14 bg-[#FAFBFD] rounded-xl border border-dashed border-[#E7ECF2]">
                  <div className="w-12 h-12 bg-white rounded-xl border border-[#E7ECF2] flex items-center justify-center mx-auto mb-3 text-[#98A2B3]">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#172033] mb-1">No Donations Received</h3>
                  <p className="text-xs text-[#68778D]">
                    This individual has not received any direct donations yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#E7ECF2]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F7F9FC] border-b border-[#E7ECF2]">
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#98A2B3] text-[11px]">
                          Date
                        </th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#98A2B3] text-[11px]">
                          Donor
                        </th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#98A2B3] text-[11px]">
                          Organization
                        </th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#98A2B3] text-[11px]">
                          Type
                        </th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#98A2B3] text-[11px]">
                          Net Share / Total
                        </th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#98A2B3] text-[11px]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7ECF2]">
                      {donations.map((d, idx) => {
                        const status = (d.status || "Pending").toLowerCase();
                        const isCompleted = status === "completed";
                        const isFailed = status === "failed" || status === "cancelled";

                        return (
                          <tr key={d._id || idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-[#172033]">
                              {formatDate(d.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#172033]">
                              {d.donorId?.donorFullName || d.donorId?.fullName || "Anonymous Donor"}
                            </td>
                            <td className="py-3.5 px-4 text-[#475467]">
                              {d.organizationId?.orgName || d.organizationId?.name || "Direct Platform"}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  d.donationType === "Money"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-blue-50 text-[#2878E5] border border-blue-200"
                                }`}
                              >
                                {d.donationType || "Donation"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {d.donationType === "Money" ? (
                                <div>
                                  <p className="font-bold text-[#172033]">
                                    ${(Number(d.homelessAmount) || 0).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}{" "}
                                    {d.currency || "USD"}
                                  </p>
                                  <p className="text-[10px] text-[#98A2B3]">
                                    Total: ${(Number(d.netAmount) || 0).toFixed(2)}
                                  </p>
                                </div>
                              ) : (
                                <span className="font-semibold text-[#172033]">
                                  {d.itemDetails || "Item Package"}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isFailed
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isCompleted
                                      ? "bg-emerald-500"
                                      : isFailed
                                      ? "bg-rose-500"
                                      : "bg-amber-500"
                                  }`}
                                />
                                <span className="capitalize">{d.status || "Pending"}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Image Zoom Modal */}
      {photoUrl && (
        <Dialog open={imageModalOpen} handler={() => setImageModalOpen(false)} size="md">
          <DialogHeader className="flex justify-between items-center text-sm font-bold text-[#172033] border-b border-[#E7ECF2]">
            <span>{displayName} — Profile Photo</span>
            <button
              onClick={() => setImageModalOpen(false)}
              className="p-1 rounded-lg text-[#98A2B3] hover:text-[#172033] hover:bg-slate-100"
            >
              ✕
            </button>
          </DialogHeader>
          <DialogBody className="p-4 flex items-center justify-center bg-[#FAFBFD]">
            <img
              src={photoUrl}
              alt={displayName}
              className="max-h-[70vh] rounded-xl object-contain shadow-card"
            />
          </DialogBody>
        </Dialog>
      )}
    </div>
  );
}

export default HomelessDetails;
