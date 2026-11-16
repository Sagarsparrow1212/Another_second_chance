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
  HeartHandshake,
  DollarSign,
  Gift,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Building2,
  ExternalLink,
} from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";

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

export function DonorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    const fetchDonorDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const sessionData = localStorage.getItem("auth_session");
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/donors/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch donor details");
        }

        const data = await response.json();
        if (data.success) {
          setDonor(data.data.donor || data.data);
        } else {
          setError(data.message || "Failed to fetch donor details");
        }
      } catch (err) {
        console.error("Fetch donor details error:", err);
        setError(err.message || "Failed to load donor details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDonorDetails();
  }, [id]);

  useEffect(() => {
    const fetchDonations = async () => {
      if (activeTab !== "donations" || !id) return;
      try {
        setLoadingDonations(true);
        const sessionData = localStorage.getItem("auth_session");
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/donations/donor/${id}?limit=100`, {
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
        <p className="text-xs font-semibold text-enterprise-muted">Loading donor details...</p>
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7ECF2] p-8 text-center max-w-md mx-auto my-12 shadow-card">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-enterprise-textPrimary mb-1">
          {error || "Donor Not Found"}
        </h3>
        <p className="text-xs text-enterprise-textSecondary mb-4">
          The requested donor profile could not be loaded.
        </p>
        <button
          onClick={() => navigate("/dashboard/donors")}
          className="px-4 py-2 bg-[#2878E5] text-white text-xs font-semibold rounded-lg hover:bg-[#1d6cd4] transition-colors"
        >
          Back to Donors
        </button>
      </div>
    );
  }

  const displayName = donor.name || donor.fullName || "Donor";
  const tabsData = [
    { label: "Basic Information", value: "basic", icon: User },
    { label: "Address Information", value: "address", icon: MapPin },
    { label: "Account Status", value: "status", icon: Clock },
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
              {/* Donor Avatar */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-[#2878E5]/20 border border-[#2878E5]/20 flex items-center justify-center flex-shrink-0 shadow-sm font-bold text-lg text-[#2878E5]">
                {displayName.charAt(0).toUpperCase()}
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] truncate">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-[#2878E5] border border-blue-200/80">
                    Donor Profile
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#68778D] font-medium">
                  <span>Donor and Contribution Details</span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" />
                    Joined {formatDate(donor.createdAt)}
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
                donor.isActive !== false
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  donor.isActive !== false ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span>{donor.isActive !== false ? "Active Donor" : "Inactive"}</span>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => navigate(`/dashboard/donors/${id}/edit`)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2878E5] text-white text-xs font-semibold hover:bg-[#1d6cd4] shadow-sm hover:shadow transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Donor</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Navigation Tabs & Content Container */}
      <main className="bg-white rounded-2xl border border-[#E7ECF2] shadow-[0_1px_3px_0_rgba(16,24,40,0.04)] overflow-hidden">
        {/* Navigation Bar */}
        <nav
          aria-label="Donor sections"
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
              <div className="pb-4 border-b border-[#E7ECF2]">
                <h2 className="text-base font-bold text-[#172033]">Basic Information</h2>
                <p className="text-xs text-[#68778D] mt-0.5">
                  Core donor profile details and preferred support channel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Gender
                    </span>
                    <p className="text-sm font-semibold text-[#172033] capitalize">
                      {donor.gender || "Not Specified"}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E7ECF2] flex items-center justify-center text-[#2878E5] flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                </div>

                {/* Preferred Donation Type */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Preferred Donation Type
                    </span>
                    <p className="text-sm font-semibold text-[#172033]">
                      {donor.preferredDonationType || "Money"}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E7ECF2] flex items-center justify-center text-[#2878E5] flex-shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                </div>

                {/* Email Address */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Email Address
                    </span>
                    {donor.email ? (
                      <a
                        href={`mailto:${donor.email}`}
                        className="text-sm font-semibold text-[#2878E5] hover:underline truncate block"
                      >
                        {donor.email}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-[#172033]">N/A</p>
                    )}
                  </div>
                  {donor.email && (
                    <button
                      onClick={() => handleCopy(donor.email, "email")}
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

                {/* Phone Number */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Phone Number
                    </span>
                    <p className="text-sm font-semibold text-[#172033]">
                      {formatPhoneNumber(donor.phone)}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E7ECF2] flex items-center justify-center text-[#2878E5] flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>

                {/* Registration Date */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between md:col-span-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Registration Date
                    </span>
                    <p className="text-sm font-semibold text-[#172033]">
                      {formatDate(donor.createdAt)}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E7ECF2] flex items-center justify-center text-[#2878E5] flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: ADDRESS INFORMATION */}
          {activeTab === "address" && (
            <section className="space-y-6">
              <div className="pb-4 border-b border-[#E7ECF2]">
                <h2 className="text-base font-bold text-[#172033]">Address Information</h2>
                <p className="text-xs text-[#68778D] mt-0.5">
                  Physical and billing address details on file for this donor.
                </p>
              </div>

              {donor.address ? (
                <div className="p-5 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E7ECF2] flex items-center justify-center text-[#2878E5] flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Full Address
                    </span>
                    <p className="text-sm font-semibold text-[#172033] leading-relaxed">
                      {donor.address}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-[#FAFBFD] rounded-xl border border-dashed border-[#E7ECF2]">
                  <div className="w-12 h-12 bg-white rounded-xl border border-[#E7ECF2] flex items-center justify-center mx-auto mb-3 text-[#98A2B3]">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#172033] mb-1">No Address on Record</h3>
                  <p className="text-xs text-[#68778D]">
                    This donor has not provided a physical address.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* TAB 3: ACCOUNT STATUS */}
          {activeTab === "status" && (
            <section className="space-y-6">
              <div className="pb-4 border-b border-[#E7ECF2]">
                <h2 className="text-base font-bold text-[#172033]">Account Status</h2>
                <p className="text-xs text-[#68778D] mt-0.5">
                  Verification status and last activity tracking timestamps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Platform Status
                    </span>
                    <div className="flex items-center gap-2">
                      {donor.isActive !== false ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span className="text-sm font-semibold text-[#172033]">
                        {donor.isActive !== false ? "Active Account" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      donor.isActive !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {donor.isActive !== false ? "Operational" : "Disabled"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
                      Last Updated
                    </span>
                    <p className="text-sm font-semibold text-[#172033]">
                      {donor.updatedAt ? formatDate(donor.updatedAt) : "N/A"}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E7ECF2] flex items-center justify-center text-[#2878E5] flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: DONATIONS */}
          {activeTab === "donations" && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7ECF2] gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#172033]">Donations History</h2>
                  <p className="text-xs text-[#68778D] mt-0.5">
                    All monetary and item contributions made by this donor.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-[#475467] border border-slate-200 w-fit">
                  {donations.length} total contributions
                </span>
              </div>

              {loadingDonations ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-7 h-7 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-semibold text-enterprise-muted">Loading contribution records...</p>
                </div>
              ) : donations.length === 0 ? (
                <div className="text-center py-14 bg-[#FAFBFD] rounded-xl border border-dashed border-[#E7ECF2]">
                  <div className="w-12 h-12 bg-white rounded-xl border border-[#E7ECF2] flex items-center justify-center mx-auto mb-3 text-[#98A2B3]">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#172033] mb-1">No Donations Yet</h3>
                  <p className="text-xs text-[#68778D]">
                    This donor has not made any recorded donations yet.
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
                          Organization
                        </th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#98A2B3] text-[11px]">
                          Recipient
                        </th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#98A2B3] text-[11px]">
                          Type
                        </th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#98A2B3] text-[11px]">
                          Amount / Details
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
                            <td className="py-3.5 px-4 text-[#475467]">
                              {d.organizationId?.orgName || d.organizationId?.name || "Direct Platform"}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#172033]">
                              {d.homelessId?.fullName || d.homelessId?.name || "General Pool"}
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
                            <td className="py-3.5 px-4 font-bold text-[#172033]">
                              {d.donationType === "Money"
                                ? `$${(Number(d.amount) || 0).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} ${d.currency || "USD"}`
                                : d.itemDetails || "N/A"}
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
    </div>
  );
}

export default DonorDetails;
