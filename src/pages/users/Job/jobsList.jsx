import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Search,
  Download,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Building2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Tag,
} from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";

export function JobsList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const itemsPerPage = 10;

  const menuRefs = useRef({});
  const menuElementRef = useRef(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });

        if (statusFilter) {
          params.append("status", statusFilter);
        }

        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/jobs?${params.toString()}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch jobs: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setJobs(data.data.jobs || []);
          setPagination(
            data.data.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalItems: (data.data.jobs || []).length,
              itemsPerPage: 10,
            }
          );
        } else {
          setError(data.message || "Failed to fetch jobs");
        }
      } catch (err) {
        console.error("Fetch jobs error:", err);
        setError(err.message || "An error occurred while fetching jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage, statusFilter, searchQuery]);

  // Outside click for menu
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

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job opportunity?")) {
      return;
    }

    try {
      setOpenMenuId(null);
      const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error("Failed to delete job");
      // Refresh
      setCurrentPage(1);
    } catch (err) {
      console.error("Delete job error:", err);
      alert("Failed to delete job.");
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Job Title", "Merchant Name", "Category", "Status", "Created At"],
      ...jobs.map((j) => [
        `"${j.title || ""}"`,
        `"${j.merchantId?.businessName || j.merchantName || ""}"`,
        `"${j.category || ""}"`,
        `"${j.status || "active"}"`,
        `"${j.createdAt ? new Date(j.createdAt).toLocaleDateString() : ""}"`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `jobs_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary counts
  const stats = useMemo(() => {
    const total = pagination.totalItems || jobs.length;
    const active = jobs.filter((j) => (j.status || "active").toLowerCase() === "active").length;
    const pending = jobs.filter((j) => (j.status || "").toLowerCase() === "pending").length;
    return { total, active, pending };
  }, [jobs, pagination]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-enterprise-softBlue border border-[#2878E5]/20 flex items-center justify-center text-[#2878E5] flex-shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-enterprise-textPrimary tracking-tight">
              Job Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-enterprise-textSecondary mt-0.5">
              View and manage all job openings posted by registered merchants
            </p>
          </div>
        </div>
      </div>

      {/* 2. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full min-w-0">
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Total Job Listings
            </span>
            <div className="p-2 rounded-lg bg-enterprise-softBlue text-[#2878E5] border border-[#2878E5]/20 flex-shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs text-enterprise-muted">opportunities</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Active Listings
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.active}
            </span>
            <span className="text-xs text-emerald-600 font-medium">available</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
              Pending Review
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
              {stats.pending}
            </span>
            <span className="text-xs text-amber-600 font-medium">in queue</span>
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
            placeholder="Search jobs by title, description, or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F7F9FC] border border-[#E7ECF2] rounded-lg text-enterprise-textPrimary placeholder:text-enterprise-muted focus:bg-white focus:outline-none focus:border-[#2878E5] focus:ring-2 focus:ring-[#2878E5]/10 transition-all duration-150"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          <div className="flex items-center gap-1.5 bg-[#F7F9FC] border border-[#E7ECF2] rounded-lg px-2.5 py-1.5 text-xs text-enterprise-textSecondary">
            <Filter className="w-3.5 h-3.5 text-enterprise-muted" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-medium text-enterprise-textPrimary focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="hidden sm:inline-flex px-2.5 py-1.5 text-xs font-medium text-enterprise-textSecondary bg-slate-50 border border-[#E7ECF2] rounded-lg">
            Total: <span className="font-bold text-enterprise-textPrimary ml-1">{pagination.totalItems}</span>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-enterprise-textPrimary bg-white border border-[#E7ECF2] hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-subtle transition-all duration-150"
          >
            <Download className="w-3.5 h-3.5 text-enterprise-textSecondary" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 4. Jobs Table */}
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
              Loading job listings...
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-enterprise-softBlue text-[#2878E5] flex items-center justify-center mx-auto mb-3 border border-[#2878E5]/20">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-enterprise-textPrimary">No jobs found</h3>
            <p className="text-xs text-enterprise-textSecondary max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No jobs match "${searchQuery}". Try adjusting your keywords.`
                : "No job opportunities have been posted yet."}
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
                      Job Title
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Merchant Name
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Category
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Status
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted">
                      Created At
                    </th>
                    <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-enterprise-muted text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7ECF2]">
                  {jobs.map((job) => {
                    const id = job.id || job._id;
                    const merchantName =
                      job.merchantId?.businessName || job.merchantName || "Unknown Merchant";
                    const isMenuOpen = openMenuId === id;
                    const statusStr = (job.status || "active").toLowerCase();

                    return (
                      <tr
                        key={id}
                        onClick={() => navigate(`/dashboard/jobs/${id}`)}
                        className={`group cursor-pointer transition-colors duration-150 ${
                          isMenuOpen ? "bg-enterprise-softBlue/30" : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* 1. Job Title */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-enterprise-softBlue text-[#2878E5] flex items-center justify-center font-bold text-xs border border-[#2878E5]/20 flex-shrink-0 group-hover:scale-102 transition-transform">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 max-w-[240px]">
                              <p className="text-xs sm:text-sm font-semibold text-enterprise-textPrimary group-hover:text-[#2878E5] transition-colors truncate">
                                {job.title}
                              </p>
                              {job.description && (
                                <p className="text-[11px] text-enterprise-muted truncate">
                                  {job.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Merchant Name */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-enterprise-textSecondary">
                            <Building2 className="w-3.5 h-3.5 text-enterprise-muted flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{merchantName}</span>
                          </div>
                        </td>

                        {/* 3. Category */}
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-enterprise-textPrimary border border-slate-200">
                            {job.category || "General"}
                          </span>
                        </td>

                        {/* 4. Status */}
                        <td className="py-3.5 px-5">
                          {statusStr === "active" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : statusStr === "closed" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* 5. Date */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-enterprise-muted">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {job.createdAt
                                ? new Date(job.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* 6. Context Menu */}
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
                                    const menuWidth = 150;
                                    const menuHeight = 110;
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
                    {Math.min((currentPage - 1) * itemsPerPage + 1, pagination.totalItems)}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-enterprise-textPrimary">
                    {Math.min(currentPage * itemsPerPage, pagination.totalItems)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-enterprise-textPrimary">
                    {pagination.totalItems}
                  </span>{" "}
                  jobs
                </span>
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
                  {currentPage} / {pagination.totalPages || 1}
                </span>
                <button
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#E7ECF2] bg-white text-enterprise-textSecondary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Action Menu */}
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
              navigate(`/dashboard/jobs/${openMenuId}`);
              setOpenMenuId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-enterprise-textPrimary hover:bg-slate-50 transition-colors font-medium text-left"
          >
            <Eye className="w-3.5 h-3.5 text-enterprise-muted" />
            View Job
          </button>
          <div className="border-t border-[#E7ECF2] my-1" />
          <button
            onClick={() => handleDelete(openMenuId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Job
          </button>
        </div>
      )}
    </div>
  );
}

export default JobsList;
