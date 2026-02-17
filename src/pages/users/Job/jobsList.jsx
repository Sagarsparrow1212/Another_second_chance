import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Input,
  IconButton,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL_V1, API_BASE_URL } from "@/configs/api";

export function JobsList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRefs = useRef({});
  const menuElementRef = useRef(null);
  const itemsPerPage = 10;

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

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

        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/jobs?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch jobs: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          setJobs(data.data.jobs || []);
          setPagination(data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
          });
        } else {
          setError(data.message || 'Failed to fetch jobs');
        }
      } catch (err) {
        console.error('Fetch jobs error:', err);
        setError(err.message || 'An error occurred while fetching jobs');
        // Log the full error for debugging
        console.error('Full error details:', {
          message: err.message,
          stack: err.stack,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage, statusFilter, searchQuery]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? "" : status);
    setCurrentPage(1); // Reset to first page on filter
  };

  // Close menu when clicking outside and handle scroll lock
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuElementRef.current) {
        // Check if click is outside the menu
        if (!menuElementRef.current.contains(event.target)) {
          // Also check if click is not on the button that opened it
          const buttonElement = menuRefs.current[openMenuId];
          if (buttonElement && !buttonElement.contains(event.target)) {
            setOpenMenuId(null);
          }
        }
      }
    };

    // Lock scroll when menu is open
    if (openMenuId) {
      document.body.style.overflow = "hidden";
      // Use setTimeout to avoid immediate closure when opening menu
      const timeoutId = setTimeout(() => {
        window.addEventListener("click", handleClickOutside, true);
        window.addEventListener("contextmenu", handleClickOutside, true);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("click", handleClickOutside, true);
        window.removeEventListener("contextmenu", handleClickOutside, true);
        document.body.style.overflow = "auto";
      };
    } else {
      document.body.style.overflow = "auto";
    }
  }, [openMenuId]);

  const handleStatusChange = async (jobId, newStatus) => {
    const job = jobs.find(j => j._id === jobId);
    if (!job || newStatus === job.status) return;

    try {
      setUpdatingStatusId(jobId);

      // Get token from localStorage
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the job in the local state
        setJobs(prevJobs =>
          prevJobs.map(j =>
            j._id === jobId ? { ...j, status: newStatus } : j
          )
        );
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert(err.message || 'An error occurred while updating status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(jobId);
      setOpenMenuId(null);

      // Get token from localStorage
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh jobs list
        // Get token from localStorage (reuse from above or get fresh)
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const jobsResponse = await fetch(`${API_BASE_URL_V1}/jobs?page=${currentPage}&limit=${itemsPerPage}${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery.trim() ? `&search=${searchQuery.trim()}` : ''}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        const jobsData = await jobsResponse.json();
        if (jobsData.success) {
          setJobs(jobsData.data.jobs || []);
          setPagination(jobsData.data.pagination || pagination);
        }
      } else {
        alert(data.message || 'Failed to delete job');
      }
    } catch (err) {
      console.error('Delete job error:', err);
      alert(err.message || 'An error occurred while deleting the job');
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate paginated jobs
  const paginatedJobs = useMemo(() => {
    return jobs;
  }, [jobs]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'closed':
        return 'red';
      case 'pending':
        return 'amber';
      default:
        return 'gray';
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <Typography color="blue-gray">Loading jobs...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto" style={{ borderColor: "transparent", }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BriefcaseIcon className="w-6 h-6 text-blue-600" />
            </div>
            <Typography variant="h4" className="text-gray-900 font-bold">
              Job List
            </Typography>
          </div>
          <Typography variant="small" className="text-gray-600">
            View and manage all job opportunities posted by merchants
          </Typography>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-6">
          <CardBody className="p-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search */}
              <div className="w-full md:flex-1 md:max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search jobs by title, description, or category..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-10"
                    labelProps={{
                      className: "hidden",
                    }}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Typography variant="small" className="text-gray-700 font-medium">
                  Filter:
                </Typography>
                <Button
                  size="sm"
                  variant={statusFilter === "" ? "filled" : "outlined"}
                  color="blue"
                  className="normal-case"
                  onClick={() => handleStatusFilter("")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "active" ? "filled" : "outlined"}
                  color="green"
                  className="normal-case"
                  onClick={() => handleStatusFilter("active")}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "pending" ? "filled" : "outlined"}
                  color="amber"
                  className="normal-case"
                  onClick={() => handleStatusFilter("pending")}
                >
                  Pending
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "closed" ? "filled" : "outlined"}
                  color="red"
                  className="normal-case"
                  onClick={() => handleStatusFilter("closed")}
                >
                  Closed
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardBody className="p-4">
              <Typography color="red">{error}</Typography>
            </CardBody>
          </Card>
        )}

        {/* Jobs Table */}
        <Card className="border border-blue-gray-200 shadow-sm">
          <CardBody className="px-0 pt-0 pb-2">
            {loading && jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center mb-4">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <Typography color="blue-gray">Loading jobs...</Typography>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BriefcaseIcon className="w-8 h-8 text-gray-400" />
                </div>
                <Typography color="blue-gray" className="text-lg mb-2">
                  No jobs found
                </Typography>
                <Typography variant="small" color="blue-gray">
                  {searchQuery || statusFilter
                    ? "Try adjusting your search or filter criteria"
                    : "No jobs have been posted yet"}
                </Typography>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <div className="relative">
                    <table className="w-full min-w-[800px] table-auto">
                      <thead>
                        <tr>
                          {["Job Title", "Merchant Name", "Created At", "Status", "Actions"].map((el) => (
                            <th
                              key={el}
                              className="border-b border-blue-gray-400 py-3 px-5 text-left"
                            >
                              <Typography
                                variant="small"
                                className="text-[13px] font-bold uppercase text-blue-gray-400"
                              >
                                {el}
                              </Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedJobs.map((job, key) => {
                          const className = `py-3 px-5 ${key === paginatedJobs.length - 1
                              ? ""
                              : "border-b border-blue-gray-200"
                            }`;

                          const isMenuOpen = openMenuId === job._id;
                          return (
                            <tr
                              key={`${job._id}-${key}`}
                              onClick={() => navigate(`/dashboard/jobs/${job._id}`)}
                              className={isMenuOpen ? "bg-blue-50 transition-colors duration-200" : ""}
                            >
                              <td className={className}>
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="text-sm font-semibold"
                                >
                                  {job.title}
                                </Typography>
                              </td>
                              <td className={className}>
                                <Typography className="text-sm font-normal text-blue-gray-500">
                                  {job.merchantId?.businessName || "N/A"}
                                </Typography>
                              </td>
                              <td className={className}>
                                <Typography className="text-sm font-normal text-blue-gray-500">
                                  {formatDate(job.createdAt)}
                                </Typography>
                              </td>
                              <td className={className}>
                                <div className="flex items-center gap-2">
                                  <div className="w-[120px]">
                                    <Select
                                      value={job.status}
                                      onChange={(value) => handleStatusChange(job._id, value)}
                                      disabled={updatingStatusId === job._id}
                                      labelProps={{
                                        className: "hidden",
                                      }}
                                      containerProps={{
                                        className: "!min-w-[120px]",
                                      }}
                                      menuProps={{
                                        className: "!min-w-[120px]",
                                      }}
                                    >
                                      <Option value="pending">Pending</Option>
                                      <Option value="active">Active</Option>
                                      <Option value="closed">Closed</Option>
                                    </Select>
                                  </div>
                                  {updatingStatusId === job._id && (
                                    <div className="flex items-center">
                                      <svg
                                        className="animate-spin h-4 w-4 text-blue-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className={className}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="relative inline-block"
                                    ref={(el) => {
                                      if (el) menuRefs.current[job._id] = el;
                                    }}
                                  >
                                    <IconButton
                                      size="sm"
                                      variant="text"
                                      color={isMenuOpen ? "blue" : "gray"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (openMenuId === job._id) {
                                          setOpenMenuId(null);
                                        } else {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const menuWidth = 192; // w-48 = 192px
                                          const menuHeight = 180; // Approximate menu height
                                          const viewportHeight = window.innerHeight;
                                          const viewportWidth = window.innerWidth;

                                          // Calculate available space below and above
                                          const spaceBelow = viewportHeight - rect.bottom;
                                          const spaceAbove = rect.top;

                                          // Determine vertical position (above or below) using clientY
                                          const showAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
                                          const topPosition = showAbove
                                            ? rect.top - menuHeight - 8
                                            : rect.bottom + 8;

                                          // Determine horizontal position (right-aligned to button, but adjust if needed)
                                          // Use clientX for fixed positioning
                                          let leftPosition = rect.right - menuWidth;

                                          // If menu would go off the left edge, align to left edge of button
                                          if (leftPosition < 0) {
                                            leftPosition = rect.left;
                                          }

                                          // If menu would go off the right edge, adjust
                                          if (leftPosition + menuWidth > viewportWidth) {
                                            leftPosition = viewportWidth - menuWidth - 8;
                                          }

                                          // Ensure menu doesn't go off screen
                                          if (leftPosition < 8) {
                                            leftPosition = 8;
                                          }

                                          setMenuPosition({
                                            top: topPosition,
                                            left: leftPosition,
                                            buttonRight: rect.right,
                                            buttonTop: rect.top,
                                            buttonBottom: rect.bottom,
                                            showAbove: showAbove
                                          });
                                          setOpenMenuId(job._id);
                                        }
                                      }}
                                      className={`rounded-lg transition-colors ${isMenuOpen ? "bg-blue-100" : ""}`}
                                    >
                                      <EllipsisVerticalIcon className={`h-5 w-5 ${isMenuOpen ? "text-blue-600" : ""}`} />
                                    </IconButton>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 p-4">
                  {/* Header Row - Only shown once at top */}
                  <div className="bg-blue-gray-50 rounded-t-lg border border-b-0 border-blue-gray-100 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <Typography
                        variant="small"
                        className="text-xs font-bold uppercase text-blue-gray-600"
                      >
                        Job Title
                      </Typography>
                      <div className="flex items-center gap-8">
                        <Typography
                          variant="small"
                          className="text-xs font-bold uppercase text-blue-gray-600"
                        >
                          Status
                        </Typography>
                        <div className="w-6"></div> {/* Spacer for expand icon */}
                      </div>
                    </div>
                  </div>

                  {paginatedJobs.map((job, key) => {
                    const isExpanded = expandedRows.has(`${job._id}-${key}`);

                    return (
                      <div
                        key={`${job._id}-${key}`}
                        className="bg-white rounded-lg border border-blue-gray-100 shadow-sm overflow-hidden"
                      >
                        {/* Main Row - Title and Status in One Row - Entire Row Clickable */}
                        <div
                          className="flex items-center gap-2 p-4 border-b border-blue-gray-200 cursor-pointer hover:bg-blue-gray-50/50 transition-colors"
                          onClick={() => toggleRow(`${job._id}-${key}`)}
                        >
                          {/* Job Title */}
                          <div className="flex-1 min-w-0">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="text-sm font-semibold break-words"
                            >
                              {job.title}
                            </Typography>
                          </div>
                          {/* Status Dropdown */}
                          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <div className="w-[100px]">
                              <Select
                                value={job.status}
                                onChange={(value) => handleStatusChange(job._id, value)}
                                disabled={updatingStatusId === job._id}
                                labelProps={{
                                  className: "hidden",
                                }}
                                containerProps={{
                                  className: "!min-w-[100px]",
                                }}
                                menuProps={{
                                  className: "!min-w-[100px]",
                                }}
                              >
                                <Option value="pending">Pending</Option>
                                <Option value="active">Active</Option>
                                <Option value="closed">Closed</Option>
                              </Select>
                            </div>
                            {updatingStatusId === job._id && (
                              <div className="flex items-center justify-center mt-1">
                                <svg
                                  className="animate-spin h-3 w-3 text-blue-600"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                              </div>
                            )}
                          </div>
                          {/* Expand/Collapse Icon */}
                          <div className="flex-shrink-0 ml-1 pointer-events-none">
                            {isExpanded ? (
                              <ChevronUpIcon className="h-5 w-5 text-blue-gray-600" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-blue-gray-600" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Details - Hidden by Default */}
                        {isExpanded && (
                          <div className="bg-blue-gray-50/30">
                            {/* Merchant Name Field */}
                            <div className="px-4 py-3 border-b border-blue-gray-200">
                              <div className="flex items-center justify-between">
                                <Typography
                                  variant="small"
                                  className="text-xs font-normal text-blue-gray-500"
                                >
                                  Merchant Name
                                </Typography>
                                <Typography className="text-sm font-normal text-blue-gray-900">
                                  {job.merchantId?.businessName || "N/A"}
                                </Typography>
                              </div>
                            </div>

                            {/* Created At Field */}
                            <div className="px-4 py-3 border-b border-blue-gray-200">
                              <div className="flex items-center justify-between">
                                <Typography
                                  variant="small"
                                  className="text-xs font-normal text-blue-gray-500"
                                >
                                  Created At
                                </Typography>
                                <Typography className="text-sm font-normal text-blue-gray-900">
                                  {formatDate(job.createdAt)}
                                </Typography>
                              </div>
                            </div>

                            {/* Actions Buttons */}
                            <div className="px-4 py-4 border-t border-blue-gray-200">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outlined"
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-blue-300 bg-white hover:bg-blue-50 normal-case text-blue-700 rounded-lg flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/dashboard/jobs/${job._id}`);
                                    }}
                                  >
                                    <EyeIcon className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">View Details</span>
                                  </Button>

                                  <IconButton
                                    size="sm"
                                    variant="outlined"
                                    className="border border-red-300 bg-white hover:bg-red-50 rounded-lg w-10 h-10 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(job._id);
                                    }}
                                    disabled={deletingId === job._id}
                                  >
                                    <TrashIcon className="h-4 w-4 text-red-600" />
                                  </IconButton>
                                </div>

                                <Button
                                  size="sm"
                                  variant="outlined"
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 normal-case text-gray-700 rounded-lg w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/dashboard/merchants/${job.merchantId?._id || job.merchantId}`);
                                  }}
                                >
                                  <BuildingStorefrontIcon className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm font-medium">View Merchant</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4">
                    <Typography variant="small" color="blue-gray" className="font-normal text-center sm:text-left">
                      Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
                      {pagination.totalItems} entries
                    </Typography>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* First Button */}
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
                        className={`min-w-[50px] text-xs normal-case ${pagination.currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                      >
                        First
                      </Button>

                      {/* Previous Button */}
                      <IconButton
                        variant="text"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className={pagination.currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </IconButton>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === pagination.totalPages ||
                            (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                          ) {
                            return (
                              <Button
                                key={page}
                                variant={pagination.currentPage === page ? "filled" : "text"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={`min-w-[32px] ${pagination.currentPage === page
                                    ? "bg-blue-gray-900 text-white"
                                    : "text-blue-gray-600"
                                  }`}
                              >
                                {page}
                              </Button>
                            );
                          } else if (page === pagination.currentPage - 2 || page === pagination.currentPage + 2) {
                            return (
                              <Typography key={page} variant="small" className="px-2 text-blue-gray-400">
                                ...
                              </Typography>
                            );
                          }
                          return null;
                        })}
                      </div>

                      {/* Last Button */}
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className={`min-w-[60px] text-xs normal-case ${pagination.currentPage === pagination.totalPages ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {/* Context Menu Overlay */}
        {openMenuId && (
          <>
            {/* Backdrop - transparent overlay to catch clicks */}
            <div
              className="fixed inset-0 z-[9998] bg-transparent"
              onClick={() => setOpenMenuId(null)}
            />
            {/* Menu */}
            <div
              ref={menuElementRef}
              className="fixed z-[9999] w-48 bg-white rounded-lg shadow-xl border-2 border-blue-200 py-1"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Job title header */}
              {(() => {
                const job = jobs.find(j => j._id === openMenuId);
                return job ? (
                  <div className="px-4 py-2 border-b border-gray-200 bg-blue-50">
                    <Typography variant="small" className="text-xs font-semibold text-blue-gray-700 truncate">
                      {job.title}
                    </Typography>
                  </div>
                ) : null;
              })()}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const currentMenuId = openMenuId;
                  setOpenMenuId(null);
                  navigate(`/dashboard/jobs/${currentMenuId}`);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <EyeIcon className="h-4 w-4" />
                View Details
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const currentMenuId = openMenuId;
                  setOpenMenuId(null);
                  const job = jobs.find(j => j._id === currentMenuId);
                  if (job && job.merchantId) {
                    navigate(`/dashboard/merchants/${job.merchantId._id || job.merchantId}`);
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <BuildingStorefrontIcon className="h-4 w-4" />
                View Merchant
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const currentMenuId = openMenuId;
                  if (currentMenuId) {
                    setOpenMenuId(null);
                    handleDelete(currentMenuId);
                  }
                }}
                disabled={deletingId === openMenuId}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <TrashIcon className="h-4 w-4" />
                {deletingId === openMenuId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default JobsList;

