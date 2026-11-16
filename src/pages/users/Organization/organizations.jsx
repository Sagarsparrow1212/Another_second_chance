import {
  Card,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Textarea,
} from "@material-tailwind/react";
import {
  Building2,
  Plus,
  Search,
  Download,
  MoreVertical,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Building,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL_V1 } from "@/configs/api";

// Phone number formatting function
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

export function Organizations() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Stats summary counts
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingOrgId, setRejectingOrgId] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const menuRefs = useRef({});
  const menuElementRef = useRef(null);

  // Fetch summary stats across all organizations
  const fetchStats = async () => {
    try {
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/organizations?limit=1000`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.data?.organizations) {
        const orgs = data.data.organizations;
        const total = orgs.length;
        const approved = orgs.filter((o) => (o.currentStatus || (o.verified ? "Approved" : "Pending")) === "Approved").length;
        const rejected = orgs.filter((o) => o.currentStatus === "Rejected").length;
        const pending = orgs.filter((o) => {
          const st = o.currentStatus || (o.verified ? "Approved" : "Pending");
          return st === "Pending" || o.isResubmitted || st === "Resubmitted";
        }).length;

        setStats({ total, approved, pending, rejected });
      }
    } catch (err) {
      console.warn("Could not fetch organization stats:", err);
    }
  };

  const fetchOrganizations = async (page = 1, search = "") => {
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

      const response = await fetch(`${API_BASE_URL_V1}/organizations?${queryParams}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }

      const data = await response.json();

      if (data.success) {
        const formattedOrgs = data.data.organizations.map((org) => ({
          id: org.id || org._id,
          name: org.name,
          email: org.email || "",
          emergencyContactEmail: org.emergencyContactEmail || "",
          phone: org.contactPhone || "",
          currentStatus: org.currentStatus || (org.verified ? "Approved" : "Pending"),
          verified: org.verified || org.currentStatus === "Approved",
          resubmitted: org.resubmitted || false,
          isResubmitted: org.isResubmitted || false,
          createdAt: org.createdAt,
          orgType: org.orgType,
          city: org.city,
          state: org.state,
          country: org.country,
          contactPerson: org.contactPerson || "",
          logo: org.logo || null,
        }));

        setOrganizations(formattedOrgs);
        setTotalPages(data.data.pagination.totalPages || 1);
        setTotalItems(data.data.pagination.totalItems || formattedOrgs.length);
      } else {
        throw new Error(data.message || "Failed to fetch organizations");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Fetch organizations error:", err);
      if (isMountedRef.current) {
        setError(err.message || "An error occurred while fetching organizations");
        setOrganizations([]);
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
        fetchOrganizations(currentPage, searchQuery);
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

  // Status mapping
  const getOrganizationStatus = (org) => {
    if (org.isResubmitted === true || org.currentStatus === "Resubmitted") {
      return {
        label: "Resubmitted",
        badgeClass: "bg-blue-50 text-[#2878E5] border border-blue-200/60",
        dotClass: "bg-[#2878E5]",
      };
    }
    const status = org.currentStatus || (org.verified ? "Approved" : "Pending");

    if (status === "Approved") {
      return {
        label: "Approved",
        badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
        dotClass: "bg-emerald-500",
      };
    } else if (status === "Pending") {
      return {
        label: "Pending",
        badgeClass: "bg-amber-50 text-amber-700 border border-amber-200/60",
        dotClass: "bg-amber-500",
      };
    } else if (status === "Rejected") {
      return {
        label: "Rejected",
        badgeClass: "bg-rose-50 text-rose-700 border border-rose-200/60",
        dotClass: "bg-rose-500",
      };
    }

    return {
      label: "Pending",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200/60",
      dotClass: "bg-amber-500",
    };
  };

  const shouldShowApprove = (org) => {
    if (org.isResubmitted === true || org.currentStatus === "Resubmitted") return true;
    const status = org.currentStatus || (org.verified ? "Approved" : "Pending");
    return status === "Pending";
  };

  const shouldShowReject = (org) => {
    if (org.isResubmitted === true || org.currentStatus === "Resubmitted") return true;
    const status = org.currentStatus || (org.verified ? "Approved" : "Pending");
    return status !== "Rejected";
  };

  const handleApprove = async (orgId, e) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to approve this organization?")) return;

    try {
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/organizations/${orgId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchOrganizations(currentPage, searchQuery);
        fetchStats();
      } else {
        setError(data.message || "Failed to approve organization");
      }
    } catch (err) {
      console.error("Approve error:", err);
      setError("Failed to approve organization.");
    }
  };

  const handleReject = (orgId, e) => {
    e?.stopPropagation();
    setRejectingOrgId(orgId);
    setRejectionMessage("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionMessage.trim()) {
      setError("Please provide a rejection message");
      return;
    }
    if (!rejectingOrgId) return;

    setRejecting(true);
    setError("");

    try {
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/organizations/${rejectingOrgId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          rejectionMessage: rejectionMessage.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRejectModalOpen(false);
        setRejectionMessage("");
        setRejectingOrgId(null);
        fetchOrganizations(currentPage, searchQuery);
        fetchStats();
      } else {
        setError(data.message || "Failed to reject organization");
      }
    } catch (err) {
      console.error("Reject error:", err);
      setError("Failed to reject organization.");
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async (orgId) => {
    if (!window.confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
      return;
    }

    try {
      setOpenMenuId(null);
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/organizations/${orgId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error("Failed to delete organization");
      fetchOrganizations(currentPage, searchQuery);
      fetchStats();
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert("Failed to delete organization.");
    }
  };

  const handleExport = async () => {
    try {
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/organizations?limit=1000`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();
      const orgsToExport = data.success ? data.data.organizations : organizations;

      const csvContent = [
        ["Organization Name", "Phone Number", "Email Address", "Status", "City", "State", "Country", "Registration Date"],
        ...orgsToExport.map((org) => [
          `"${org.name || ""}"`,
          `"${org.contactPhone ? formatPhoneNumber(org.contactPhone) : ""}"`,
          `"${org.email || ""}"`,
          `"${org.currentStatus || (org.verified ? "Approved" : "Pending")}"`,
          `"${org.city || ""}"`,
          `"${org.state || ""}"`,
          `"${org.country || ""}"`,
          `"${org.createdAt ? new Date(org.createdAt).toLocaleDateString() : ""}"`,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `organizations_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      setError("Failed to export organizations");
    }
  };

  // Filter organizations by status on frontend
  const filteredOrganizations = useMemo(() => {
    let result = [...organizations];
    if (statusFilter !== "ALL") {
      result = result.filter((org) => {
        const st = org.currentStatus || (org.verified ? "Approved" : "Pending");
        if (statusFilter === "RESUBMITTED") return org.isResubmitted || st === "Resubmitted";
        return st.toUpperCase() === statusFilter;
      });
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
  }, [organizations, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-enterprise-softBlue border border-[#2878E5]/20 flex items-center justify-center text-[#2878E5] flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-enterprise-textPrimary tracking-tight">
              Organizations
            </h1>
            <p className="text-xs sm:text-sm text-enterprise-textSecondary mt-0.5">
              Manage and review registered organizations across the platform
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate("/dashboard/organizations/add")}
          className="bg-[#2878E5] hover:bg-[#1d6cd4] text-white flex items-center justify-center gap-2 normal-case text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Organization</span>
        </Button>
      </div>

      {/* 2. Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
        {/* Total Organizations */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Total Organizations
            </span>
            <div className="p-2 rounded-lg bg-enterprise-softBlue text-[#2878E5] border border-[#2878E5]/20 flex-shrink-0">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.total || totalItems}
            </span>
            <span className="text-xs text-enterprise-muted">registered</span>
          </div>
        </div>

        {/* Approved Organizations */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Approved
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.approved}
            </span>
            <span className="text-xs text-emerald-600 font-medium">active</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Pending Approvals
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.pending}
            </span>
            <span className="text-xs text-amber-600 font-medium">requires review</span>
          </div>
        </div>

        {/* Rejected Organizations */}
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Rejected
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60 flex-shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.rejected}
            </span>
            <span className="text-xs text-rose-600 font-medium">declined</span>
          </div>
        </div>
      </div>

      {/* 3. Search, Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E7ECF2] p-3 sm:p-4 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-enterprise-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by organization name, email, or phone..."
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
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-[#F7F9FC] border border-[#E7ECF2] rounded-lg px-2.5 py-1.5 text-xs text-enterprise-textSecondary">
            <Filter className="w-3.5 h-3.5 text-enterprise-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-enterprise-textPrimary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="RESUBMITTED">Resubmitted</option>
              <option value="REJECTED">Rejected</option>
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

      {/* 4. Enterprise Data Table Card */}
      <div className="bg-white rounded-xl border border-[#E7ECF2] shadow-card overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-center text-xs font-medium text-enterprise-muted">
              Loading organizations...
            </p>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-enterprise-softBlue text-[#2878E5] flex items-center justify-center mx-auto mb-3 border border-[#2878E5]/20">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-enterprise-textPrimary">
              No organizations found
            </h3>
            <p className="text-xs text-enterprise-textSecondary max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No organizations match "${searchQuery}". Try adjusting your keywords or clearing filters.`
                : "No organizations have registered yet."}
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
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F9FC] border-b border-[#E7ECF2]">
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Organization
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Contact Information
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Email Address
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Verification Status
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
                  {filteredOrganizations.map((org) => {
                    const status = getOrganizationStatus(org);
                    const isMenuOpen = openMenuId === org.id;

                    return (
                      <tr
                        key={org.id}
                        onClick={() => navigate(`/dashboard/organizations/${org.id}`)}
                        className={`group cursor-pointer transition-colors duration-150 ${
                          isMenuOpen ? "bg-enterprise-softBlue/30" : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* 1. Organization Column */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-enterprise-softBlue text-[#2878E5] flex items-center justify-center font-bold text-xs border border-[#2878E5]/20 flex-shrink-0 group-hover:scale-102 transition-transform">
                              {org.name ? org.name.charAt(0).toUpperCase() : "O"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-enterprise-textPrimary group-hover:text-[#2878E5] transition-colors truncate">
                                {org.name}
                              </p>
                              <p className="text-[11px] text-enterprise-muted truncate">
                                {org.city && org.state
                                  ? `${org.city}, ${org.state}`
                                  : org.orgType || "Non-profit Organization"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contact Phone */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-enterprise-textSecondary">
                            <Phone className="w-3.5 h-3.5 text-enterprise-muted" />
                            <span>{formatPhoneNumber(org.phone)}</span>
                          </div>
                        </td>

                        {/* 3. Email Address + Copy interaction */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 group/email">
                            <span className="text-xs font-medium text-enterprise-textSecondary truncate max-w-[200px]">
                              {org.email || "N/A"}
                            </span>
                            {org.email && (
                              <button
                                onClick={(e) => handleCopyEmail(org.email, e)}
                                title="Copy Email"
                                className="opacity-0 group-hover/email:opacity-100 p-1 hover:bg-slate-100 rounded text-enterprise-muted hover:text-enterprise-textPrimary transition-all"
                              >
                                {copiedEmail === org.email ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 4. Verification Status Badge */}
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                            {status.label}
                          </span>
                        </td>

                        {/* 5. Registration Date */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-enterprise-muted">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {org.createdAt
                                ? new Date(org.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* 6. Contextual Action Buttons */}
                        <td className="py-3.5 px-5 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Approve Button (shown only when eligible) */}
                            {shouldShowApprove(org) && (
                              <button
                                onClick={(e) => handleApprove(org.id, e)}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-md transition-colors"
                              >
                                Approve
                              </button>
                            )}

                            {/* Reject Button (shown only when eligible) */}
                            {shouldShowReject(org) && (
                              <button
                                onClick={(e) => handleReject(org.id, e)}
                                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-md transition-colors"
                              >
                                Reject
                              </button>
                            )}

                            {/* More Actions Dropdown Trigger */}
                            <div
                              className="relative"
                              ref={(el) => {
                                if (el) menuRefs.current[org.id] = el;
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (openMenuId === org.id) {
                                    setOpenMenuId(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const menuWidth = 160;
                                    const menuHeight = 120;
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const showAbove = spaceBelow < menuHeight && rect.top > spaceBelow;

                                    setMenuPosition({
                                      top: showAbove ? rect.top - menuHeight - 6 : rect.bottom + 6,
                                      left: Math.max(8, rect.right - menuWidth),
                                    });
                                    setOpenMenuId(org.id);
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
                  <span className="font-semibold text-enterprise-textPrimary">
                    {totalItems}
                  </span>{" "}
                  organizations
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
              navigate(`/dashboard/organizations/${openMenuId}`);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-enterprise-textPrimary hover:bg-slate-50 transition-colors font-medium text-left"
          >
            <Eye className="w-3.5 h-3.5 text-enterprise-muted" />
            View Details
          </button>
          <button
            onClick={() => {
              navigate(`/dashboard/organizations/${openMenuId}/edit`);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-enterprise-textPrimary hover:bg-slate-50 transition-colors font-medium text-left"
          >
            <Building2 className="w-3.5 h-3.5 text-enterprise-muted" />
            Edit Profile
          </button>
          <div className="border-t border-[#E7ECF2] my-1" />
          <button
            onClick={() => handleDelete(openMenuId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
          >
            <XCircle className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog
        open={rejectModalOpen}
        handler={() => setRejectModalOpen(false)}
        size="sm"
        className="rounded-2xl p-6"
      >
        <DialogHeader className="p-0 pb-3 flex items-center gap-2 text-base font-bold text-enterprise-textPrimary border-b border-[#E7ECF2]">
          <XCircle className="w-5 h-5 text-rose-600" />
          Reject Organization
        </DialogHeader>
        <DialogBody className="p-0 pt-4">
          <p className="text-xs text-enterprise-textSecondary mb-3">
            Please provide a specific reason for rejecting this organization. This feedback will be sent to the organization administrator.
          </p>
          <Textarea
            rows={4}
            value={rejectionMessage}
            onChange={(e) => setRejectionMessage(e.target.value)}
            placeholder="e.g. Missing valid 501(c)(3) documentation or invalid business registration number..."
            className="!border-[#E7ECF2] focus:!border-rose-500 text-xs text-enterprise-textPrimary"
            labelProps={{ className: "hidden" }}
          />
        </DialogBody>
        <DialogFooter className="p-0 pt-4 flex gap-2 justify-end">
          <Button
            variant="text"
            size="sm"
            onClick={() => setRejectModalOpen(false)}
            className="normal-case text-xs text-enterprise-textSecondary"
            disabled={rejecting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleRejectSubmit}
            disabled={rejecting || !rejectionMessage.trim()}
            className="bg-rose-600 hover:bg-rose-700 text-white normal-case text-xs font-semibold px-4 py-2"
          >
            {rejecting ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default Organizations;
