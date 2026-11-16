import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Store,
  Plus,
  Search,
  Download,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Tag,
  Building2,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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

export function Merchants() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    typesCount: 0,
    recentCount: 0,
  });

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const menuRefs = useRef({});
  const menuElementRef = useRef(null);

  // Fetch summary stats
  const fetchStats = async () => {
    try {
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/merchants?limit=1000`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.data?.merchants) {
        const list = data.data.merchants;
        const total = list.length;
        const types = new Set(list.map((m) => m.businessType).filter(Boolean)).size;

        // Recent = registered within the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCount = list.filter((m) => new Date(m.createdAt) >= thirtyDaysAgo).length;

        setStats({ total, typesCount: types, recentCount });
      }
    } catch (err) {
      console.warn("Could not fetch merchant stats:", err);
    }
  };

  const fetchMerchants = async (page = 1, search = "") => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError("");

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (search.trim()) {
        queryParams.append("search", search.trim());
      }

      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/merchants?${queryParams}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch merchants");
      }

      const data = await response.json();

      if (data.success) {
        setMerchants(data.data.merchants || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalItems(data.data.pagination?.totalItems || (data.data.merchants || []).length);
      } else {
        throw new Error(data.message || "Failed to fetch merchants");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Fetch merchants error:", err);
      if (isMountedRef.current) {
        setError(err.message || "An error occurred while fetching merchants");
        setMerchants([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        fetchMerchants(currentPage, searchQuery);
      }
    }, searchQuery ? 400 : 0);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, searchQuery, itemsPerPage]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuElementRef.current) {
        if (!menuElementRef.current.contains(event.target)) {
          const buttonElement = menuRefs.current[openMenuId];
          if (buttonElement && !buttonElement.contains(event.target)) {
            setOpenMenuId(null);
          }
        }
      }
    };

    if (openMenuId) {
      window.addEventListener("click", handleClickOutside, true);
      return () => window.removeEventListener("click", handleClickOutside, true);
    }
  }, [openMenuId]);

  const handleCopyEmail = (email, e) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleDelete = async (merchantId) => {
    if (!window.confirm("Are you sure you want to delete this merchant? This action cannot be undone.")) {
      return;
    }

    try {
      setOpenMenuId(null);
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/merchants/${merchantId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error("Failed to delete merchant");
      fetchMerchants(currentPage, searchQuery);
      fetchStats();
    } catch (error) {
      console.error("Error deleting merchant:", error);
      alert("Failed to delete merchant.");
    }
  };

  const handleExport = async () => {
    try {
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/merchants?limit=1000`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();
      const list = data.success ? data.data.merchants : merchants;

      const csvContent = [
        ["Business Name", "Email", "Business Type", "Phone", "Registration Date"],
        ...list.map((m) => [
          `"${m.businessName || ""}"`,
          `"${m.email || ""}"`,
          `"${m.businessType || ""}"`,
          `"${m.phone ? formatPhoneNumber(m.phone) : ""}"`,
          `"${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ""}"`,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `merchants_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      setError("Failed to export merchants");
    }
  };

  // Distinct business types for filter dropdown
  const availableTypes = useMemo(() => {
    const set = new Set();
    merchants.forEach((m) => {
      if (m.businessType) set.add(m.businessType);
    });
    return Array.from(set);
  }, [merchants]);

  // Frontend filter & sort
  const filteredMerchants = useMemo(() => {
    let result = [...merchants];
    if (typeFilter !== "ALL") {
      result = result.filter((m) => m.businessType === typeFilter);
    }

    if (sortBy === "name_asc") {
      result.sort((a, b) => (a.businessName || "").localeCompare(b.businessName || ""));
    } else if (sortBy === "name_desc") {
      result.sort((a, b) => (b.businessName || "").localeCompare(a.businessName || ""));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      // newest
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [merchants, typeFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-enterprise-softBlue border border-[#2878E5]/20 flex items-center justify-center text-[#2878E5] flex-shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-enterprise-textPrimary tracking-tight">
              Merchants
            </h1>
            <p className="text-xs sm:text-sm text-enterprise-textSecondary mt-0.5">
              View and manage all registered merchants and vendors
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard/merchants/register")}
          className="bg-[#2878E5] hover:bg-[#1d6cd4] text-white flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Merchant</span>
        </button>
      </div>

      {/* 2. Merchant Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full min-w-0">
        {/* Total Merchants */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Total Merchants
            </span>
            <div className="p-2 rounded-lg bg-enterprise-softBlue text-[#2878E5] border border-[#2878E5]/20 flex-shrink-0">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.total || totalItems}
            </span>
            <span className="text-xs text-enterprise-muted">registered</span>
          </div>
        </div>

        {/* Business Types */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Business Types
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex-shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.typesCount || (availableTypes.length || 1)}
            </span>
            <span className="text-xs text-emerald-600 font-medium">categories</span>
          </div>
        </div>

        {/* Recently Registered */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Recently Registered
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.recentCount}
            </span>
            <span className="text-xs text-purple-600 font-medium">last 30 days</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Toolbar */}
      <div className="bg-white rounded-xl border border-[#E7ECF2] p-3 sm:p-4 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-enterprise-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by business name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-[#F7F9FC] border border-[#E7ECF2] rounded-lg text-enterprise-textPrimary placeholder:text-enterprise-muted focus:bg-white focus:outline-none focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 transition-all duration-150"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          {/* Business Type filter */}
          <div className="flex items-center gap-1.5 bg-[#F7F9FC] border border-[#E7ECF2] rounded-lg px-2.5 py-1.5 text-xs text-enterprise-textSecondary">
            <Filter className="w-3.5 h-3.5 text-enterprise-muted" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-enterprise-textPrimary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order */}
          <div className="bg-[#F7F9FC] border border-[#E7ECF2] rounded-lg px-2.5 py-1.5 text-xs text-enterprise-textSecondary">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-medium text-enterprise-textPrimary focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>

          {/* Total Badge */}
          <div className="hidden sm:inline-flex px-2.5 py-1.5 text-xs font-medium text-enterprise-textSecondary bg-slate-50 border border-[#E7ECF2] rounded-lg">
            Total: <span className="font-bold text-enterprise-textPrimary ml-1">{totalItems}</span>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-enterprise-textPrimary bg-white border border-[#E7ECF2] hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-subtle transition-all duration-150"
          >
            <Download className="w-3.5 h-3.5 text-enterprise-textSecondary" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 4. Merchant Data Table */}
      <div className="bg-white rounded-xl border border-[#E7ECF2] shadow-card overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-center text-xs font-medium text-enterprise-muted">
              Loading merchants...
            </p>
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-enterprise-softBlue text-[#2878E5] flex items-center justify-center mx-auto mb-3 border border-[#2878E5]/20">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-enterprise-textPrimary">No merchants found</h3>
            <p className="text-xs text-enterprise-textSecondary max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No merchants match "${searchQuery}". Try adjusting your keywords.`
                : "No merchants have registered yet."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-xs font-semibold text-[#2878E5] hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F9FC] border-b border-[#E7ECF2]">
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Business Name
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Email Address
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Business Type
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Phone Number
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Registration Date
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7ECF2]">
                  {filteredMerchants.map((merchant) => {
                    const id = merchant.id || merchant._id;
                    const isMenuOpen = openMenuId === id;

                    return (
                      <tr
                        key={id}
                        onClick={() => navigate(`/dashboard/merchants/${id}`)}
                        className={`group cursor-pointer transition-colors duration-150 ${
                          isMenuOpen ? "bg-enterprise-softBlue/30" : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* 1. Business Name */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-enterprise-softBlue text-[#2878E5] flex items-center justify-center font-bold text-xs border border-[#2878E5]/20 flex-shrink-0 group-hover:scale-102 transition-transform">
                              {merchant.businessName
                                ? merchant.businessName.charAt(0).toUpperCase()
                                : "M"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-enterprise-textPrimary group-hover:text-[#2878E5] transition-colors truncate">
                                {merchant.businessName}
                              </p>
                              <p className="text-[11px] text-enterprise-muted truncate">
                                {merchant.contactPerson || "Merchant Vendor"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Email */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 group/email">
                            <span className="text-xs font-medium text-enterprise-textSecondary truncate max-w-[200px]">
                              {merchant.email || "N/A"}
                            </span>
                            {merchant.email && (
                              <button
                                onClick={(e) => handleCopyEmail(merchant.email, e)}
                                title="Copy Email"
                                className="opacity-0 group-hover/email:opacity-100 p-1 hover:bg-slate-100 rounded text-enterprise-muted hover:text-enterprise-textPrimary transition-all"
                              >
                                {copiedEmail === merchant.email ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 3. Business Type */}
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-enterprise-textPrimary border border-slate-200">
                            {merchant.businessType || "Other"}
                          </span>
                        </td>

                        {/* 4. Phone Number */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-enterprise-textSecondary">
                            <Phone className="w-3.5 h-3.5 text-enterprise-muted" />
                            <span>{formatPhoneNumber(merchant.phone)}</span>
                          </div>
                        </td>

                        {/* 5. Registration Date */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-enterprise-muted">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {merchant.createdAt
                                ? new Date(merchant.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* 6. Contextual Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              className="relative"
                              ref={(el) => {
                                if (el) menuRefs.current[id] = el;
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (openMenuId === id) {
                                    setOpenMenuId(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const menuWidth = 160;
                                    const menuHeight = 120;
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const showAbove =
                                      spaceBelow < menuHeight && rect.top > spaceBelow;

                                    setMenuPosition({
                                      top: showAbove ? rect.top - menuHeight - 6 : rect.bottom + 6,
                                      left: Math.max(8, rect.right - menuWidth),
                                    });
                                    setOpenMenuId(id);
                                  }
                                }}
                                className="p-1 rounded-md text-enterprise-muted hover:text-enterprise-textPrimary hover:bg-slate-100 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination & Rows Per Page Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E7ECF2]">
              <div className="flex items-center gap-3 text-xs text-enterprise-textSecondary">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-enterprise-textPrimary">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-enterprise-textPrimary">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-enterprise-textPrimary">{totalItems}</span>{" "}
                  merchants
                </span>

                <div className="flex items-center gap-1.5 pl-3 border-l border-[#E7ECF2]">
                  <span className="text-enterprise-muted">Rows:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-[#E7ECF2] rounded px-1.5 py-0.5 text-xs text-enterprise-textPrimary font-medium focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Prev / Next Page Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-[#E7ECF2] bg-white text-enterprise-textSecondary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-xs font-semibold text-enterprise-textPrimary bg-white border border-[#E7ECF2] rounded-lg">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#E7ECF2] bg-white text-enterprise-textSecondary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Action Menu dropdown */}
      {openMenuId && (
        <div
          ref={menuElementRef}
          style={{
            position: "fixed",
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            zIndex: 9999,
          }}
          className="w-40 bg-white rounded-xl shadow-floating border border-[#E7ECF2] py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              navigate(`/dashboard/merchants/${openMenuId}`);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-enterprise-textPrimary hover:bg-slate-50 transition-colors font-medium text-left"
          >
            <Eye className="w-3.5 h-3.5 text-enterprise-muted" />
            View Merchant
          </button>
          <button
            onClick={() => {
              navigate(`/dashboard/merchants/${openMenuId}/edit`);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-enterprise-textPrimary hover:bg-slate-50 transition-colors font-medium text-left"
          >
            <Pencil className="w-3.5 h-3.5 text-enterprise-muted" />
            Edit Merchant
          </button>
          <div className="border-t border-[#E7ECF2] my-1" />
          <button
            onClick={() => handleDelete(openMenuId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Merchant
          </button>
        </div>
      )}
    </div>
  );
}

export default Merchants;
