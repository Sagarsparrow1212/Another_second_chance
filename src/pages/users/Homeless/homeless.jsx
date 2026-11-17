import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  Plus,
  Search,
  Download,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
  Clock,
  UserCheck,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL_V1, API_BASE_URL } from "@/configs/api";

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

export function Homeless() {
  const navigate = useNavigate();
  const [homelessUsers, setHomelessUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedText, setCopiedText] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const menuRefs = useRef({});
  const menuElementRef = useRef(null);

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    if (filePath.startsWith("/uploads")) return `${API_BASE_URL}${filePath}`;
    return `${API_BASE_URL}/uploads/homeless/${filePath}`;
  };

  const fetchHomelessUsers = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError("");

      const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/homeless?limit=1000`, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch homeless users");
      }

      const data = await response.json();

      if (data.success && (data.data?.homeless || data.data?.homelessUsers)) {
        const users = data.data.homeless || data.data.homelessUsers || [];
        const formatted = users.map((user) => ({
          id: user.id || user._id,
          name: user.name || user.fullName || "N/A",
          username: user.username || "",
          phone: user.phone || user.contactNumber || "",
          organization:
            user.organizationId?.name ||
            user.organizationName ||
            user.organization ||
            "Direct / Unassigned",
          organizationId:
            user.organizationId?._id || user.organizationId?.id || user.organizationId,
          profilePicture: user.profilePicture || user.avatar || null,
          skills: user.skills || user.skillset || [],
          gender: user.gender || "N/A",
          age: user.age || null,
          createdAt: user.createdAt || "",
        }));

        setHomelessUsers(formatted);
      } else {
        throw new Error(data.message || "Failed to fetch homeless users");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Fetch homeless error:", err);
      if (isMountedRef.current) {
        setError(err.message || "An error occurred while fetching homeless users");
        setHomelessUsers([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchHomelessUsers();

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

  const handleCopy = (text, e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this homeless user? This action cannot be undone.")) {
      return;
    }

    try {
      setOpenMenuId(null);
      const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/homeless/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error("Failed to delete homeless user");
      fetchHomelessUsers();
    } catch (error) {
      console.error("Error deleting homeless user:", error);
      alert("Failed to delete homeless user.");
    }
  };

  // Distinct organizations list for filter
  const availableOrgs = useMemo(() => {
    const set = new Set();
    homelessUsers.forEach((u) => {
      if (u.organization && u.organization !== "Direct / Unassigned") {
        set.add(u.organization);
      }
    });
    return Array.from(set);
  }, [homelessUsers]);

  // Frontend filter, search & sort
  const filteredUsers = useMemo(() => {
    let result = [...homelessUsers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q)
      );
    }

    if (orgFilter !== "ALL") {
      result = result.filter((u) => u.organization === orgFilter);
    }

    if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name_desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      // newest
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [homelessUsers, searchQuery, orgFilter, sortBy]);

  // Derived statistics based on real data
  const stats = useMemo(() => {
    const total = homelessUsers.length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyAdded = homelessUsers.filter(
      (u) => new Date(u.createdAt) >= thirtyDaysAgo
    ).length;

    const orgCount = availableOrgs.length;

    return {
      total,
      recentlyAdded,
      activeProfiles: total, // All fetched users are active records
      orgCount,
    };
  }, [homelessUsers, availableOrgs]);

  // Pagination calculation
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    const csvContent = [
      ["Full Name", "Username", "Phone", "Associated Organization", "Registration Date"],
      ...filteredUsers.map((u) => [
        `"${u.name || ""}"`,
        `"${u.username || ""}"`,
        `"${u.phone ? formatPhoneNumber(u.phone) : ""}"`,
        `"${u.organization || ""}"`,
        `"${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""}"`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `homeless_users_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-enterprise-softBlue border border-[#2878E5]/20 flex items-center justify-center text-[#2878E5] flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-enterprise-textPrimary tracking-tight">
              Homeless Users
            </h1>
            <p className="text-xs sm:text-sm text-enterprise-textSecondary mt-0.5">
              View and manage registered individuals supported by partner organizations
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard/homeless/register")}
          className="bg-[#2878E5] hover:bg-[#1d6cd4] text-white flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
        {/* Total Homeless Users */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Total Individuals
            </span>
            <div className="p-2 rounded-lg bg-enterprise-softBlue text-[#2878E5] border border-[#2878E5]/20 flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs text-enterprise-muted">registered</span>
          </div>
        </div>

        {/* Recently Added */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Recently Added
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.recentlyAdded}
            </span>
            <span className="text-xs text-emerald-600 font-medium">last 30 days</span>
          </div>
        </div>

        {/* Active Profiles */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Active Profiles
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex-shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.activeProfiles}
            </span>
            <span className="text-xs text-amber-600 font-medium">in system</span>
          </div>
        </div>

        {/* Partner Organizations */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Organizations
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60 flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.orgCount}
            </span>
            <span className="text-xs text-purple-600 font-medium">active sponsors</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Toolbar */}
      <div className="bg-white rounded-xl border border-[#E7ECF2] p-3 sm:p-4 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-enterprise-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by full name, username, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F7F9FC] border border-[#E7ECF2] rounded-lg text-enterprise-textPrimary placeholder:text-enterprise-muted focus:bg-white focus:outline-none focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 transition-all duration-150"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          {/* Organization filter */}
          <div className="flex items-center gap-1.5 bg-[#F7F9FC] border border-[#E7ECF2] rounded-lg px-2.5 py-1.5 text-xs text-enterprise-textSecondary">
            <Filter className="w-3.5 h-3.5 text-enterprise-muted" />
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-enterprise-textPrimary focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">All Organizations</option>
              {availableOrgs.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
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

      {/* 4. Homeless Users Data Table */}
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
              Loading homeless user records...
            </p>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-enterprise-softBlue text-[#2878E5] flex items-center justify-center mx-auto mb-3 border border-[#2878E5]/20">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-enterprise-textPrimary">No homeless users found</h3>
            <p className="text-xs text-enterprise-textSecondary max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No users match "${searchQuery}". Try adjusting your keywords.`
                : "No homeless users have been registered yet."}
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
            <div className="overflow-x-auto w-full min-w-0">
              <table className="w-full text-left border-collapse table-auto min-w-[960px]">
                <colgroup>
                  <col className="w-[230px]" />
                  <col className="w-[180px]" />
                  <col className="w-[160px]" />
                  <col className="w-[180px]" />
                  <col className="w-[140px]" />
                  <col className="w-[80px]" />
                </colgroup>
                <thead>
                  <tr className="bg-[#F7F9FC] border-b border-[#E7ECF2]">
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted w-[230px]">
                      Profile / Name
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted w-[180px]">
                      Username
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted w-[160px]">
                      Phone Number
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted w-[180px]">
                      Organization
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted w-[140px]">
                      Registration Date
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted text-right w-[80px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7ECF2]">
                  {paginatedUsers.map((user) => {
                    const id = user.id;
                    const isMenuOpen = openMenuId === id;
                    const photoUrl = getFileUrl(user.profilePicture);

                    return (
                      <tr
                        key={id}
                        onClick={() => navigate(`/dashboard/homeless/${id}`)}
                        className={`group cursor-pointer transition-colors duration-150 ${
                          isMenuOpen ? "bg-enterprise-softBlue/30" : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* 1. Profile / Name */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={user.name}
                                className="w-9 h-9 rounded-lg object-cover border border-[#E7ECF2] flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              style={{ display: photoUrl ? "none" : "flex" }}
                              className="w-9 h-9 rounded-lg bg-enterprise-navy text-white items-center justify-center font-bold text-xs flex-shrink-0 tracking-wider shadow-subtle"
                            >
                              {getInitials(user.name)}
                            </div>

                            <div className="min-w-0 max-w-[200px]">
                              <p className="text-xs sm:text-sm font-semibold text-enterprise-textPrimary group-hover:text-[#2878E5] transition-colors truncate">
                                {user.name}
                              </p>
                              <p className="text-[11px] text-enterprise-muted truncate">
                                {user.age ? `${user.age} yrs` : ""} {user.gender && user.gender !== "N/A" ? `• ${user.gender}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Username with quick copy */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 group/user">
                            <span className="text-xs font-medium text-enterprise-textSecondary truncate max-w-[150px]">
                              @{user.username}
                            </span>
                            {user.username && (
                              <button
                                onClick={(e) => handleCopy(user.username, e)}
                                title="Copy Username"
                                className="opacity-0 group-hover/user:opacity-100 p-1 hover:bg-slate-100 rounded text-enterprise-muted hover:text-enterprise-textPrimary transition-all"
                              >
                                {copiedText === user.username ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 3. Phone */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-enterprise-textSecondary">
                            <Phone className="w-3.5 h-3.5 text-enterprise-muted" />
                            <span>{formatPhoneNumber(user.phone)}</span>
                          </div>
                        </td>

                        {/* 4. Associated Organization */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-enterprise-textSecondary max-w-[180px] truncate">
                            <Building2 className="w-3.5 h-3.5 text-enterprise-muted flex-shrink-0" />
                            <span className="truncate">{user.organization}</span>
                          </div>
                        </td>

                        {/* 5. Registration Date */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-enterprise-muted">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* 6. Contextual Action Menu */}
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
                                    const menuWidth = 170;
                                    const menuHeight = 125;
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

            {/* Pagination Toolbar */}
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
                  users
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
          className="w-44 bg-white rounded-xl shadow-floating border border-[#E7ECF2] py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              navigate(`/dashboard/homeless/${openMenuId}`);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-enterprise-textPrimary hover:bg-slate-50 transition-colors font-medium text-left"
          >
            <Eye className="w-3.5 h-3.5 text-enterprise-muted" />
            View Profile
          </button>
          <button
            onClick={() => {
              navigate(`/dashboard/homeless/${openMenuId}/edit`);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-enterprise-textPrimary hover:bg-slate-50 transition-colors font-medium text-left"
          >
            <Pencil className="w-3.5 h-3.5 text-enterprise-muted" />
            Edit Profile
          </button>
          <div className="border-t border-[#E7ECF2] my-1" />
          <button
            onClick={() => handleDelete(openMenuId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete User
          </button>
        </div>
      )}
    </div>
  );
}

export default Homeless;
