import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Edit3,
  UserPlus,
  Paperclip,
  Download,
  Eye,
  Info,
  UploadCloud,
  RefreshCw,
  Image as ImageIcon,
  ZoomIn,
  Users,
  CircleDollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Receipt,
  Layers,
  FileText,
  BadgeAlert,
  Trash2,
} from "lucide-react";
import { API_BASE_URL_V1, API_BASE_URL, getFileUrl, getUploadUrl } from "@/configs/api";

// Phone number formatting utility
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

// Date formatter
const formatDate = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: options.shortMonth ? "short" : "long",
      day: "numeric",
      hour: options.hideTime ? undefined : "2-digit",
      minute: options.hideTime ? undefined : "2-digit",
      ...options,
    });
  } catch (e) {
    return "N/A";
  }
};

export function OrganizationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core state
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  // Related data state
  const [homelessPeople, setHomelessPeople] = useState([]);
  const [loadingHomeless, setLoadingHomeless] = useState(false);
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);

  // UI helpers
  const [copiedKey, setCopiedKey] = useState(null);
  const [homelessSearch, setHomelessSearch] = useState("");
  const [deletingDocIndex, setDeletingDocIndex] = useState(null);
  const [deleteDocConfirmOpen, setDeleteDocConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deletingDocLoading, setDeletingDocLoading] = useState(false);

  // Delete document handler
  const handleDeleteDocument = async () => {
    if (deletingDocIndex === null || !id) return;

    try {
      setDeletingDocLoading(true);
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/organizations/${id}/documents/${deletingDocIndex}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete document");
      }

      // Update state immediately
      setOrganization((prev) => ({
        ...prev,
        documents: data.data?.documents || prev.documents.filter((_, idx) => idx !== deletingDocIndex),
      }));

      setDeleteDocConfirmOpen(false);
      setDocToDelete(null);
      setDeletingDocIndex(null);
    } catch (err) {
      console.error("Delete document error:", err);
      alert(err.message || "Could not delete document. Please try again.");
    } finally {
      setDeletingDocLoading(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text, key) => {
    if (!text || text === "N/A") return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Fetch organization details
  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const sessionData = localStorage.getItem("auth_session");
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/organizations/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch organization details");
        }

        const data = await response.json();

        if (data.success) {
          setOrganization(data.data);
        } else {
          setError(data.message || "Failed to fetch organization details");
        }
      } catch (err) {
        console.error("Fetch organization details error:", err);
        setError(err.message || "An error occurred while fetching organization details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrganizationDetails();
    }
  }, [id]);

  // Fetch homeless people when homeless tab is active
  useEffect(() => {
    const fetchHomelessPeople = async () => {
      if (activeTab !== "homeless" || !id) return;

      try {
        setLoadingHomeless(true);

        const sessionData = localStorage.getItem("auth_session");
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/homeless/organization/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch homeless people");
        }

        const data = await response.json();

        if (data.success) {
          setHomelessPeople(data.data.homeless || []);
        } else {
          setHomelessPeople([]);
        }
      } catch (err) {
        console.error("Fetch homeless people error:", err);
        setHomelessPeople([]);
      } finally {
        setLoadingHomeless(false);
      }
    };

    fetchHomelessPeople();
  }, [activeTab, id]);

  // Fetch donations when donations tab is active
  useEffect(() => {
    const fetchDonations = async () => {
      if (activeTab !== "donations" || !id) return;

      try {
        setLoadingDonations(true);

        const sessionData = localStorage.getItem("auth_session");
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/donations/organization/${id}?limit=100`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch donations");
        }

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

  // File resolution helpers
  const getOrganizationFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    if (filePath.startsWith("/uploads")) return getFileUrl(filePath);
    return getUploadUrl("organizations", filePath);
  };

  const getHomelessFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    if (filePath.startsWith("/uploads")) return `${API_BASE_URL}${filePath}`;
    return `${API_BASE_URL}/uploads/homeless/${filePath}`;
  };

  // Status configuration
  const currentStatus = organization
    ? organization.resubmitted
      ? "RESUBMITTED"
      : (organization.currentStatus || "PENDING").toUpperCase()
    : "PENDING";

  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "APPROVED":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-500/10",
          dot: "bg-emerald-500",
          icon: CheckCircle2,
          label: "Approved",
        };
      case "REJECTED":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200/80 ring-1 ring-rose-500/10",
          dot: "bg-rose-500",
          icon: XCircle,
          label: "Rejected",
        };
      case "RESUBMITTED":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200/80 ring-1 ring-blue-500/10",
          dot: "bg-blue-500",
          icon: RefreshCw,
          label: "Resubmitted",
        };
      case "PENDING":
      default:
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-500/10",
          dot: "bg-amber-500",
          icon: Clock,
          label: "Pending Review",
        };
    }
  };

  // Timeline styling
  const getActivityMeta = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("approved")) {
      return {
        title: "Approved",
        badge: "APPROVED",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        markerBg: "bg-emerald-600 ring-4 ring-emerald-100",
        Icon: CheckCircle2,
      };
    } else if (t.includes("rejected")) {
      return {
        title: "Rejected",
        badge: "REJECTED",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        markerBg: "bg-rose-600 ring-4 ring-rose-100",
        Icon: XCircle,
      };
    } else if (t.includes("resubmitted")) {
      return {
        title: "Resubmitted",
        badge: "RESUBMITTED",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        markerBg: "bg-blue-600 ring-4 ring-blue-100",
        Icon: RefreshCw,
      };
    } else if (t.includes("initial submission") || t.includes("first submit")) {
      return {
        title: "Initial Submission",
        badge: "INITIAL SUBMISSION",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        markerBg: "bg-indigo-600 ring-4 ring-indigo-100",
        Icon: UploadCloud,
      };
    }
    return {
      title: type || "Activity",
      badge: (type || "EVENT").toUpperCase(),
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
      markerBg: "bg-slate-600 ring-4 ring-slate-100",
      Icon: Clock,
    };
  };

  // Filter homeless people
  const filteredHomeless = useMemo(() => {
    if (!homelessSearch.trim()) return homelessPeople;
    const term = homelessSearch.toLowerCase();
    return homelessPeople.filter((p) => {
      const name = (p.name || p.fullName || "").toLowerCase();
      const username = (p.username || "").toLowerCase();
      const phone = (p.phone || p.contactPhone || "").toLowerCase();
      return name.includes(term) || username.includes(term) || phone.includes(term);
    });
  }, [homelessPeople, homelessSearch]);

  // Donation statistics calculation
  const donationStats = useMemo(() => {
    const totalDonations = donations.length;
    let orgShareSum = 0;
    let totalGrossSum = 0;
    let completedCount = 0;

    donations.forEach((d) => {
      if (d.status?.toLowerCase() === "completed") {
        completedCount++;
      }
      if (d.donationType === "Money") {
        orgShareSum += Number(d.organizationAmount || 0);
        totalGrossSum += Number(d.netAmount || 0);
      }
    });

    return {
      totalDonations,
      completedCount,
      orgShareSum,
      totalGrossSum,
      currency: donations[0]?.currency || "USD",
    };
  }, [donations]);

  // Tab definitions
  const tabsData = [
    { label: "Profile", value: "basic", icon: Info, count: null },
    { label: "Address", value: "address", icon: MapPin, count: null },
    {
      label: "Media",
      value: "media",
      icon: ImageIcon,
      count: (organization?.photos?.length || 0) + (organization?.documents?.length || 0),
    },
    {
      label: "Homeless People",
      value: "homeless",
      icon: Users,
      count: homelessPeople.length || null,
    },
    {
      label: "Activity",
      value: "timeline",
      icon: Clock,
      count: organization?.activities?.length || null,
    },
    {
      label: "Donations",
      value: "donations",
      icon: CircleDollarSign,
      count: donations.length || null,
    },
  ];

  // Loading skeleton state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl border border-[#E7ECF2] p-6 shadow-sm animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-slate-200 rounded" />
                  <div className="h-4 w-28 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-24 bg-slate-200 rounded-lg" />
                <div className="h-9 w-32 bg-slate-200 rounded-lg" />
                <div className="h-9 w-24 bg-slate-200 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="bg-white rounded-2xl border border-[#E7ECF2] shadow-sm p-6 space-y-6 animate-pulse">
            <div className="flex gap-4 border-b border-[#E7ECF2] pb-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-8 w-24 bg-slate-200 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 bg-slate-50 rounded-xl border border-[#E7ECF2]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E7ECF2] shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#172033] mb-2">Unable to Load Organization</h2>
          <p className="text-sm text-[#68778D] mb-6 leading-relaxed">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate("/dashboard/organizations")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7ECF2] text-sm font-semibold text-[#172033] hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All Organizations
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878E5] text-white text-sm font-semibold hover:bg-[#1d6cd4] shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E7ECF2] shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <BadgeAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#172033] mb-2">Organization Not Found</h2>
          <p className="text-sm text-[#68778D] mb-6">
            The requested organization does not exist or may have been removed.
          </p>
          <button
            onClick={() => navigate("/dashboard/organizations")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2878E5] text-white text-sm font-semibold hover:bg-[#1d6cd4] shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(currentStatus);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="space-y-6 min-w-0 w-full max-w-full">
      <div className="w-full space-y-6">
        {/* ========================================================================= */}
        {/* 1. ORGANIZATION HEADER                                                   */}
        {/* ========================================================================= */}
        <header className="bg-white rounded-xl sm:rounded-2xl border border-[#E7ECF2] p-4 sm:p-5 shadow-card transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left section: Back button + Avatar + Name + Metadata */}
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="group p-2 sm:px-3 sm:py-2 rounded-lg border border-[#E7ECF2] text-[#68778D] hover:text-[#172033] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 flex-shrink-0"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4 text-[#68778D] group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
                  Back
                </span>
              </button>

              <div className="hidden sm:block w-px h-8 bg-[#E7ECF2]" />

              <div className="flex items-center gap-3 min-w-0">
                {/* Organization Avatar */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-enterprise-softBlue border border-[#2878E5]/20 flex items-center justify-center flex-shrink-0 shadow-subtle overflow-hidden">
                  {organization.logoUrl ? (
                    <img
                      src={getOrganizationFileUrl(organization.logoUrl)}
                      alt={organization.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#2878E5]" />
                  )}
                </div>

                {/* Organization Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#172033] truncate" title={organization.name}>
                      {organization.name}
                    </h1>
                    {organization.orgType && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-[#475467] border border-slate-200">
                        {organization.orgType}
                      </span>
                    )}
                    {/* Status Badge integrated directly in identity row */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${statusBadge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusBadge.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#68778D] font-medium">
                    <span>Organization Profile</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" />
                      Joined {formatDate(organization.createdAt, { hideTime: true, shortMonth: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right section: Header Action Controls */}
            <div className="flex items-center flex-wrap gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E7ECF2] self-start sm:self-auto">
              {/* Add Homeless Member Button */}
              <button
                onClick={() => navigate(`/dashboard/homeless/register/${id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E7ECF2] text-xs font-semibold text-[#172033] hover:bg-slate-50 hover:border-slate-300 shadow-subtle transition-all"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#2878E5]" />
                <span>Add Member</span>
              </button>

              {/* Edit Organization Button */}
              <button
                onClick={() => navigate(`/dashboard/organizations/${id}/edit`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2878E5] text-white text-xs font-semibold hover:bg-[#1d6cd4] shadow-subtle hover:shadow transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. TAB NAVIGATION & CONTENT CONTAINER                                    */}
        {/* ========================================================================= */}
        <main className="bg-white rounded-2xl border border-[#E7ECF2] shadow-[0_1px_3px_0_rgba(16,24,40,0.04)] overflow-hidden">
          {/* Navigation Bar */}
          <nav
            aria-label="Organization sections"
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

                    {/* Active Tab Underline Indicator */}
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
            {/* ========================================================================= */}
            {/* TAB 1: BASIC INFORMATION / PROFILE                                        */}
            {/* ========================================================================= */}
            {activeTab === "basic" && (
              <section className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7ECF2] gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[#172033]">Basic Information</h2>
                    <p className="text-xs text-[#68778D] mt-0.5">
                      Core organizational credentials and designated point of contact.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#2878E5] font-semibold bg-[#2878E5]/5 px-2.5 py-1 rounded-lg border border-[#2878E5]/15 self-start sm:self-auto">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Details
                  </span>
                </div>

                {/* 3-Column Responsive Information Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {/* Organization Type */}
                  <div className="group p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-50/80 text-[#2878E5] border border-blue-100 flex-shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                          Organization Type
                        </span>
                        <p className="text-sm font-bold text-[#172033] mt-0.5 truncate" title={organization.orgType || "N/A"}>
                          {organization.orgType || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="group p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50/80 text-indigo-600 border border-indigo-100 flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                          Contact Person
                        </span>
                        <p className="text-sm font-bold text-[#172033] mt-0.5 truncate" title={organization.contactPerson || "N/A"}>
                          {organization.contactPerson || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="group p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50/80 text-emerald-600 border border-emerald-100 flex-shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                            Email Address
                          </span>
                          {organization.email && (
                            <button
                              onClick={() => copyToClipboard(organization.email, "email")}
                              className="text-xs text-[#68778D] hover:text-[#2878E5] flex items-center gap-1 transition-colors"
                              title="Copy Email"
                            >
                              {copiedKey === "email" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        {organization.email ? (
                          <a
                            href={`mailto:${organization.email}`}
                            className="inline-flex items-center gap-1 text-sm font-bold text-[#2878E5] hover:text-[#1d6cd4] mt-0.5 truncate max-w-full transition-colors"
                            title={organization.email}
                          >
                            <span className="truncate">{organization.email}</span>
                            <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <p className="text-sm font-bold text-[#172033] mt-0.5">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="group p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-50/80 text-cyan-600 border border-cyan-100 flex-shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                            Phone Number
                          </span>
                          {organization.contactPhone && (
                            <button
                              onClick={() =>
                                copyToClipboard(organization.contactPhone, "phone")
                              }
                              className="text-xs text-[#68778D] hover:text-[#2878E5] flex items-center gap-1 transition-colors"
                              title="Copy Phone"
                            >
                              {copiedKey === "phone" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        {organization.contactPhone ? (
                          <a
                            href={`tel:${organization.contactPhone}`}
                            className="inline-flex items-center gap-1 text-sm font-bold text-[#172033] hover:text-[#2878E5] mt-0.5 transition-colors whitespace-nowrap"
                          >
                            <span>{formatPhoneNumber(organization.contactPhone)}</span>
                          </a>
                        ) : (
                          <p className="text-sm font-bold text-[#172033] mt-0.5">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact Email */}
                  <div className="group p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-50/80 text-amber-600 border border-amber-100 flex-shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                            Emergency Email
                          </span>
                          {organization.emergencyContactEmail && (
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  organization.emergencyContactEmail,
                                  "emergencyEmail"
                                )
                              }
                              className="text-xs text-[#68778D] hover:text-[#2878E5] flex items-center gap-1 transition-colors"
                              title="Copy Emergency Email"
                            >
                              {copiedKey === "emergencyEmail" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        {organization.emergencyContactEmail ? (
                          <a
                            href={`mailto:${organization.emergencyContactEmail}`}
                            className="inline-flex items-center gap-1 text-sm font-bold text-[#172033] hover:text-[#2878E5] mt-0.5 truncate max-w-full transition-colors"
                            title={organization.emergencyContactEmail}
                          >
                            <span className="truncate">{organization.emergencyContactEmail}</span>
                            <ArrowUpRight className="w-3 h-3 flex-shrink-0 text-[#68778D]" />
                          </a>
                        ) : (
                          <p className="text-sm font-bold text-[#172033] mt-0.5">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Registration Date */}
                  <div className="group p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-violet-50/80 text-violet-600 border border-violet-100 flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                          Registration Date
                        </span>
                        <p className="text-sm font-bold text-[#172033] mt-0.5">
                          {formatDate(organization.createdAt, { hideTime: true, shortMonth: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: ADDRESS INFORMATION                                                */}
            {/* ========================================================================= */}
            {activeTab === "address" && (
              <section className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7ECF2] gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[#172033]">Address & Location</h2>
                    <p className="text-xs text-[#68778D] mt-0.5">
                      Primary physical location and jurisdiction details.
                    </p>
                  </div>
                  {organization.streetAddress && (
                    <button
                      onClick={() => {
                        const fullAddress = `${organization.streetAddress || ""}, ${
                          organization.city || ""
                        }, ${organization.state || ""} ${organization.zipCode || ""}, ${
                          organization.country || ""
                        }`;
                        copyToClipboard(fullAddress, "fullAddress");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7ECF2] bg-white text-xs font-semibold text-[#172033] hover:bg-slate-50 transition-colors self-start sm:self-auto"
                    >
                      {copiedKey === "fullAddress" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Full Address Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#68778D]" />
                          <span>Copy Full Address</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Street Address - Full Width */}
                  <div className="sm:col-span-2 lg:col-span-4 p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex-shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                          Street Address
                        </span>
                        <p className="text-base font-bold text-[#172033] mt-1 break-words">
                          {organization.streetAddress || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* City */}
                  <div className="p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                      City
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#172033] mt-1.5">
                      {organization.city || "N/A"}
                    </p>
                  </div>

                  {/* State */}
                  <div className="p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                      State / Province
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#172033] mt-1.5">
                      {organization.state || "N/A"}
                    </p>
                  </div>

                  {/* Zip Code */}
                  <div className="p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                      Zip / Postal Code
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#172033] mt-1.5">
                      {organization.zipCode || "N/A"}
                    </p>
                  </div>

                  {/* Country */}
                  <div className="p-4 sm:p-5 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68778D] block">
                      Country
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#172033] mt-1.5">
                      {organization.country || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Optional Location Card Preview */}
                {(organization.streetAddress || organization.city) && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200/80 flex items-center justify-center text-[#68778D]">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-[#68778D]">
                        Location verified:{" "}
                        <span className="font-semibold text-[#172033]">
                          {[organization.city, organization.state, organization.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </span>
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        [
                          organization.streetAddress,
                          organization.city,
                          organization.state,
                          organization.zipCode,
                          organization.country,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878E5] hover:underline"
                    >
                      <span>Open in Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: MEDIA (PHOTOS & DOCUMENTS)                                         */}
            {/* ========================================================================= */}
            {activeTab === "media" && (
              <section className="space-y-10 animate-fadeIn">
                {/* 3A. Organization Photos */}
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#E7ECF2] mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#172033]">
                          Organization Photos
                        </h2>
                        <p className="text-xs text-[#68778D]">
                          Visual verification and facility gallery.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#68778D] bg-slate-100 px-2.5 py-1 rounded-lg">
                      {organization.photos?.length || 0} Photos
                    </span>
                  </div>

                  {organization.photos && organization.photos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {organization.photos.map((photo, index) => {
                        const photoUrl = getOrganizationFileUrl(photo.photoUrl);
                        const photoName = photo.photoName || `Photo ${index + 1}`;

                        return (
                          <div
                            key={index}
                            className="group relative bg-white rounded-xl border border-[#E7ECF2] overflow-hidden hover:border-[#2878E5]/50 hover:shadow-card transition-all"
                          >
                            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                              <img
                                src={photoUrl}
                                alt={photoName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const placeholder =
                                    e.target.parentElement.querySelector(".error-placeholder");
                                  if (placeholder) placeholder.style.display = "flex";
                                }}
                              />
                              <div className="error-placeholder hidden absolute inset-0 items-center justify-center bg-slate-100 text-[#98A2B3]">
                                <ImageIcon className="w-10 h-10" />
                              </div>

                              {/* Hover overlay with actions */}
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                {photoUrl && (
                                  <a
                                    href={photoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl bg-white/95 text-[#172033] hover:bg-white shadow-lg transition-transform hover:scale-110"
                                    title="View Full Size"
                                  >
                                    <ZoomIn className="w-4 h-4" />
                                  </a>
                                )}
                                {photoUrl && (
                                  <a
                                    href={photoUrl}
                                    download
                                    className="p-2.5 rounded-xl bg-white/95 text-[#172033] hover:bg-white shadow-lg transition-transform hover:scale-110"
                                    title="Download Photo"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="p-3.5 flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#172033] truncate max-w-[180px]">
                                {photoName}
                              </span>
                              {photoUrl && (
                                <a
                                  href={photoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-[#2878E5] hover:underline inline-flex items-center gap-1"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-10 rounded-2xl border border-dashed border-[#E7ECF2] bg-slate-50/60 text-center">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-[#E7ECF2] flex items-center justify-center mx-auto mb-3 shadow-sm text-[#98A2B3]">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-[#172033]">No Photos Uploaded</h3>
                      <p className="text-xs text-[#68778D] mt-1 max-w-sm mx-auto">
                        This organization has not submitted any facility or verification photos yet.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3B. Verification Documents */}
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#E7ECF2] mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#172033]">
                          Verification Documents
                        </h2>
                        <p className="text-xs text-[#68778D]">
                          Legal filings, certificates, and compliance papers.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#68778D] bg-slate-100 px-2.5 py-1 rounded-lg">
                      {organization.documents?.length || 0} Documents
                    </span>
                  </div>

                  {organization.documents && organization.documents.length > 0 ? (
                    <div className="space-y-3">
                      {organization.documents.map((doc, index) => {
                        const docUrl = getOrganizationFileUrl(doc.docUrl);
                        const isImage =
                          docUrl &&
                          (docUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || docUrl.includes("image"));
                        const isPdf = docUrl && docUrl.match(/\.pdf$/i);
                        const docName = doc.docName || `Document ${index + 1}`;

                        return (
                          <div
                            key={index}
                            className="p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/40 hover:shadow-subtle transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3.5">
                                <div className="p-2.5 rounded-xl bg-slate-100 text-[#475467] border border-slate-200 flex-shrink-0">
                                  {isPdf ? (
                                    <FileText className="w-5 h-5 text-rose-600" />
                                  ) : isImage ? (
                                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                                  ) : (
                                    <Paperclip className="w-5 h-5 text-[#68778D]" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-[#172033] truncate">
                                    {docName}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#68778D]">
                                    <span className="uppercase font-semibold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-[#475467]">
                                      {isPdf ? "PDF" : isImage ? "Image" : "Document"}
                                    </span>
                                    {docUrl && (
                                      <span className="truncate max-w-[200px] sm:max-w-xs text-[#98A2B3]">
                                        {docUrl.split("/").pop()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {docUrl && (
                                  <a
                                    href={docUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7ECF2] bg-white text-xs font-semibold text-[#172033] hover:bg-slate-50 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#68778D]" />
                                    <span>View</span>
                                  </a>
                                )}
                                {docUrl && (
                                  <a
                                    href={docUrl}
                                    download
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-[#172033] transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5 text-[#68778D]" />
                                    <span>Download</span>
                                  </a>
                                )}

                                {/* Delete Document Trigger */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingDocIndex(index);
                                    setDocToDelete(doc);
                                    setDeleteDocConfirmOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-600 transition-colors cursor-pointer"
                                  title="Delete document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            </div>

                            {/* Inlined image preview if applicable */}
                            {docUrl && isImage && (
                              <div className="mt-4 pt-3 border-t border-[#E7ECF2]">
                                <img
                                  src={docUrl}
                                  alt={docName}
                                  className="max-h-72 w-auto rounded-lg border border-[#E7ECF2] object-contain bg-slate-50"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-10 rounded-2xl border border-dashed border-[#E7ECF2] bg-slate-50/60 text-center">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-[#E7ECF2] flex items-center justify-center mx-auto mb-3 shadow-sm text-[#98A2B3]">
                        <Paperclip className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-[#172033]">No Documents Uploaded</h3>
                      <p className="text-xs text-[#68778D] mt-1 max-w-sm mx-auto">
                        No official verification documents have been attached to this profile.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: HOMELESS PEOPLE (MEMBERS)                                          */}
            {/* ========================================================================= */}
            {activeTab === "homeless" && (
              <section className="space-y-5 animate-fadeIn">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7ECF2] gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#172033]">Registered Members</h2>
                    <p className="text-xs text-[#68778D] mt-0.5">
                      Homeless individuals registered and supported under this organization.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Search filter */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                      <input
                        type="text"
                        value={homelessSearch}
                        onChange={(e) => setHomelessSearch(e.target.value)}
                        placeholder="Search by name, phone..."
                        className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E7ECF2] bg-white focus:outline-none focus:border-[#2878E5] focus:ring-1 focus:ring-[#2878E5] w-52 sm:w-60 text-[#172033] placeholder:text-[#98A2B3]"
                      />
                    </div>

                    <button
                      onClick={() => navigate(`/dashboard/homeless/register/${id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2878E5] text-white text-xs font-semibold hover:bg-[#1d6cd4] shadow-sm transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Member</span>
                    </button>
                  </div>
                </div>

                {loadingHomeless ? (
                  <div className="py-16 text-center">
                    <RefreshCw className="w-6 h-6 text-[#2878E5] animate-spin mx-auto mb-3" />
                    <p className="text-xs text-[#68778D]">Loading member records...</p>
                  </div>
                ) : filteredHomeless.length === 0 ? (
                  <div className="p-12 rounded-2xl border border-dashed border-[#E7ECF2] bg-slate-50/60 text-center">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-[#E7ECF2] flex items-center justify-center mx-auto mb-3 shadow-sm text-[#98A2B3]">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#172033]">
                      {homelessSearch ? "No matching members found" : "No Registered Members Yet"}
                    </h3>
                    <p className="text-xs text-[#68778D] mt-1 max-w-sm mx-auto mb-5">
                      {homelessSearch
                        ? `No members found matching "${homelessSearch}". Try a different keyword.`
                        : "Start onboarding homeless individuals associated with this organization."}
                    </p>
                    <button
                      onClick={() => navigate(`/dashboard/homeless/register/${id}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2878E5] text-white text-xs font-semibold hover:bg-[#1d6cd4] shadow-sm transition-all mx-auto"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add First Member</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-hidden rounded-xl border border-[#E7ECF2]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#FAFBFD] border-b border-[#E7ECF2]">
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Member
                            </th>
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Username
                            </th>
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Contact
                            </th>
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Demographics
                            </th>
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Registered
                            </th>
                            <th className="py-3 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7ECF2] bg-white text-xs">
                          {filteredHomeless.map((person, idx) => {
                            const name = person.name || person.fullName || "Unnamed Member";
                            const avatarUrl = person.profilePicture
                              ? getHomelessFileUrl(person.profilePicture)
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  name
                                )}&background=2878e5&color=fff&size=80`;

                            return (
                              <tr
                                key={person.id || person._id || idx}
                                onClick={() =>
                                  navigate(`/dashboard/homeless/${person.id || person._id}`)
                                }
                                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={avatarUrl}
                                      alt={name}
                                      className="w-9 h-9 rounded-xl object-cover border border-[#E7ECF2] bg-slate-100 flex-shrink-0"
                                      onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                          name
                                        )}&background=2878e5&color=fff`;
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <p className="font-bold text-[#172033] group-hover:text-[#2878E5] transition-colors truncate">
                                        {name}
                                      </p>
                                      <p className="text-[11px] text-[#68778D] truncate">
                                        ID: {person.id || person._id || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-[#475467] font-medium">
                                  {person.username || "—"}
                                </td>
                                <td className="py-3 px-4 text-[#172033] font-medium">
                                  {person.phone || person.contactPhone
                                    ? formatPhoneNumber(person.phone || person.contactPhone)
                                    : "—"}
                                </td>
                                <td className="py-3 px-4 text-[#475467]">
                                  <span className="font-medium text-[#172033]">
                                    {person.age ? `${person.age} yrs` : "—"}
                                  </span>
                                  {person.gender && (
                                    <span className="text-[#98A2B3]"> • {person.gender}</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-[#68778D]">
                                  {formatDate(person.createdAt, {
                                    hideTime: true,
                                    shortMonth: true,
                                  })}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2878E5] group-hover:translate-x-0.5 transition-transform">
                                    <span>View</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden space-y-3">
                      {filteredHomeless.map((person, idx) => {
                        const name = person.name || person.fullName || "Unnamed Member";
                        const avatarUrl = person.profilePicture
                          ? getHomelessFileUrl(person.profilePicture)
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              name
                            )}&background=2878e5&color=fff&size=80`;

                        return (
                          <div
                            key={person.id || person._id || idx}
                            onClick={() =>
                              navigate(`/dashboard/homeless/${person.id || person._id}`)
                            }
                            className="p-4 rounded-xl border border-[#E7ECF2] bg-white hover:border-[#2878E5]/50 transition-all cursor-pointer shadow-subtle"
                          >
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={avatarUrl}
                                  alt={name}
                                  className="w-10 h-10 rounded-xl object-cover border border-[#E7ECF2]"
                                />
                                <div>
                                  <h4 className="text-sm font-bold text-[#172033]">{name}</h4>
                                  <p className="text-xs text-[#68778D]">
                                    {person.username ? `@${person.username}` : "No username"}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#98A2B3]" />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E7ECF2]">
                              <div>
                                <span className="text-[10px] uppercase font-semibold text-[#68778D] block">
                                  Phone
                                </span>
                                <span className="font-semibold text-[#172033]">
                                  {person.phone || person.contactPhone || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-semibold text-[#68778D] block">
                                  Demographics
                                </span>
                                <span className="font-semibold text-[#172033]">
                                  {[person.age ? `${person.age} yrs` : null, person.gender]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: ACTIVITY TIMELINE                                                  */}
            {/* ========================================================================= */}
            {activeTab === "timeline" && (
              <section className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-[#E7ECF2]">
                  <div>
                    <h2 className="text-base font-bold text-[#172033]">Activity & Audit History</h2>
                    <p className="text-xs text-[#68778D] mt-0.5">
                      Chronological review of verification actions, submissions, and status shifts.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#68778D] bg-slate-100 px-2.5 py-1 rounded-lg">
                    {organization.activities?.length || 0} Events
                  </span>
                </div>

                {organization.activities && organization.activities.length > 0 ? (
                  <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E7ECF2]">
                    {organization.activities.map((activity, index) => {
                      const meta = getActivityMeta(activity.type);
                      const ActivityIcon = meta.Icon;

                      return (
                        <div key={index} className="relative group">
                          {/* Timeline node marker */}
                          <div
                            className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-white flex items-center justify-center shadow-sm ${meta.markerBg} transition-transform group-hover:scale-110`}
                          >
                            <ActivityIcon className="w-3.5 h-3.5" />
                          </div>

                          {/* Timeline Event Card */}
                          <div className="bg-white rounded-xl border border-[#E7ECF2] p-4 sm:p-5 hover:border-[#2878E5]/40 hover:shadow-subtle transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h4 className="text-sm font-bold text-[#172033]">{meta.title}</h4>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                                >
                                  {meta.badge}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-[#68778D]">
                                <Clock className="w-3.5 h-3.5 text-[#98A2B3]" />
                                <span>{formatDate(activity.date)}</span>
                              </div>
                            </div>

                            {activity.description && (
                              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed mt-1">
                                {activity.description}
                              </p>
                            )}

                            {/* Additional metadata tags */}
                            {(activity.rejectedBy || activity.requestId) && (
                              <div className="mt-3 pt-3 border-t border-[#E7ECF2] flex items-center gap-3 flex-wrap text-[11px] text-[#68778D]">
                                {activity.rejectedBy && (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-medium">
                                    Action by: {activity.rejectedBy}
                                  </span>
                                )}
                                {activity.requestId && (
                                  <span className="font-mono text-[#98A2B3]">
                                    Req ID: {activity.requestId}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 rounded-2xl border border-dashed border-[#E7ECF2] bg-slate-50/60 text-center">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-[#E7ECF2] flex items-center justify-center mx-auto mb-3 shadow-sm text-[#98A2B3]">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#172033]">No Activity Recorded</h3>
                    <p className="text-xs text-[#68778D] mt-1 max-w-sm mx-auto">
                      No status transitions or review logs have been recorded for this organization.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: DONATIONS RECEIVED                                                 */}
            {/* ========================================================================= */}
            {activeTab === "donations" && (
              <section className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7ECF2] gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[#172033]">Donations & Impact</h2>
                    <p className="text-xs text-[#68778D] mt-0.5">
                      Financial contributions and item donations directed to this organization.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#68778D] bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                    {donationStats.totalDonations} Total Donations
                  </span>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Organization Share */}
                  <div className="p-5 rounded-xl border border-[#E7ECF2] bg-gradient-to-br from-white to-blue-50/20 shadow-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                        Org Share Received
                      </span>
                      <div className="p-2 rounded-lg bg-blue-50 text-[#2878E5]">
                        <CircleDollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">
                      {donationStats.orgShareSum.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs font-semibold text-[#68778D]">
                        {donationStats.currency}
                      </span>
                    </p>
                    <p className="text-[11px] text-[#68778D] mt-1">Direct organizational allocation</p>
                  </div>

                  {/* Net Total Raised */}
                  <div className="p-5 rounded-xl border border-[#E7ECF2] bg-gradient-to-br from-white to-emerald-50/20 shadow-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                        Gross Volume
                      </span>
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">
                      {donationStats.totalGrossSum.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs font-semibold text-[#68778D]">
                        {donationStats.currency}
                      </span>
                    </p>
                    <p className="text-[11px] text-[#68778D] mt-1">Net donation after processing</p>
                  </div>

                  {/* Success Rate */}
                  <div className="p-5 rounded-xl border border-[#E7ECF2] bg-gradient-to-br from-white to-purple-50/20 shadow-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                        Completed Rate
                      </span>
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <Receipt className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">
                      {donationStats.totalDonations > 0
                        ? `${Math.round(
                            (donationStats.completedCount / donationStats.totalDonations) * 100
                          )}%`
                        : "0%"}
                    </p>
                    <p className="text-[11px] text-[#68778D] mt-1">
                      {donationStats.completedCount} of {donationStats.totalDonations} transactions settled
                    </p>
                  </div>
                </div>

                {/* Donation Transactions Table */}
                {loadingDonations ? (
                  <div className="py-16 text-center">
                    <RefreshCw className="w-6 h-6 text-[#2878E5] animate-spin mx-auto mb-3" />
                    <p className="text-xs text-[#68778D]">Loading donation records...</p>
                  </div>
                ) : donations.length === 0 ? (
                  <div className="p-12 rounded-2xl border border-dashed border-[#E7ECF2] bg-slate-50/60 text-center">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-[#E7ECF2] flex items-center justify-center mx-auto mb-3 shadow-sm text-[#98A2B3]">
                      <CircleDollarSign className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#172033]">No Donations Recorded</h3>
                    <p className="text-xs text-[#68778D] mt-1 max-w-sm mx-auto">
                      This organization has not yet processed any financial or in-kind donations.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[#E7ECF2]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[680px]">
                        <thead>
                          <tr className="bg-[#FAFBFD] border-b border-[#E7ECF2]">
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Date
                            </th>
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Donor
                            </th>
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Beneficiary
                            </th>
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Type
                            </th>
                            <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Org Share / Total
                            </th>
                            <th className="py-3 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#68778D]">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7ECF2] bg-white text-xs">
                          {donations.map((donation, key) => {
                            const statusStr = (donation.status || "pending").toLowerCase();
                            let statusBadgeStyle = "bg-slate-50 text-slate-700 border-slate-200";
                            if (statusStr === "completed") {
                              statusBadgeStyle =
                                "bg-emerald-50 text-emerald-700 border-emerald-200";
                            } else if (statusStr === "pending") {
                              statusBadgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                            } else if (statusStr === "cancelled" || statusStr === "failed") {
                              statusBadgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                            }

                            return (
                              <tr key={donation._id || key} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 px-4 text-[#172033] font-medium whitespace-nowrap">
                                  {formatDate(donation.createdAt, {
                                    hideTime: true,
                                    shortMonth: true,
                                  })}
                                </td>
                                <td className="py-3.5 px-4">
                                  <p className="font-bold text-[#172033]">
                                    {donation.donorId?.donorFullName || "Anonymous"}
                                  </p>
                                  {donation.donorId?.donorEmail && (
                                    <p className="text-[11px] text-[#68778D]">
                                      {donation.donorId?.donorEmail}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-[#475467] font-medium">
                                  {donation.homelessId?.fullName || "General Allocation"}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                      donation.donationType === "Money"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}
                                  >
                                    {donation.donationType || "Standard"}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  {donation.donationType === "Money" ? (
                                    <div>
                                      <p className="font-bold text-[#172033]">
                                        {(donation.organizationAmount !== undefined
                                          ? donation.organizationAmount
                                          : 0
                                        ).toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        {donation.currency || "USD"}
                                      </p>
                                      <p className="text-[10px] text-[#68778D] mt-0.5">
                                        Gross:{" "}
                                        {(donation.netAmount || 0).toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        {donation.currency || "USD"}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-[#172033]">
                                      {donation.itemDetails || "In-Kind Items"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadgeStyle}`}
                                  >
                                    {donation.status || "Pending"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Delete Document Confirmation Dialog */}
      {deleteDocConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E7ECF2]">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2.5 rounded-xl border flex items-center justify-center"
                style={{ backgroundColor: "#FEE2E2", borderColor: "#FECACA", color: "#DC2626" }}
              >
                <Trash2 className="w-5 h-5" style={{ color: "#DC2626" }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Delete Verification Document?
                </h3>
                <p className="text-xs text-[#68778D]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#475467] leading-relaxed mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#172033]">
                {docToDelete?.docName || "this document"}
              </span>{" "}
              from this organization's official records?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deletingDocLoading}
                onClick={() => {
                  setDeleteDocConfirmOpen(false);
                  setDocToDelete(null);
                  setDeletingDocIndex(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#E7ECF2] bg-white text-xs font-semibold text-[#172033] hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingDocLoading}
                onClick={handleDeleteDocument}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
              >
                {deletingDocLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span className="text-white">Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                    <span className="text-white">Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationDetails;
