import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  IconButton,
  Input,
} from "@material-tailwind/react";
import { Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, Download, MoreVertical, Eye, Trash2, Pencil, Store } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL_V1 } from "@/configs/api";

export function Merchants() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRefs = useRef({});
  const menuElementRef = useRef(null);
  const itemsPerPage = 10;
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchMerchants = async (page = 1, search = "") => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

      try {
          setLoading(true);
      setError("");

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (search.trim()) {
        queryParams.append('search', search.trim());
        }
        
        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;
        
      const response = await fetch(`${API_BASE_URL_V1}/merchants?${queryParams}`, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

      if (!response.ok) {
        throw new Error('Failed to fetch merchants');
      }

        const data = await response.json();
        
        // Only update state if component is still mounted
        if (!isMountedRef.current) {
          return;
        }
        
        if (data.success && data.data.merchants) {
          setMerchants(data.data.merchants);
        setTotalPages(data.data.pagination.totalPages);
        setTotalItems(data.data.pagination.totalItems);
        } else {
        throw new Error(data.message || 'Failed to fetch merchants');
        }
    } catch (err) {
      // Don't show error if request was aborted
      if (err.name === 'AbortError') {
          return;
        }
      console.error('Fetch merchants error:', err);
      if (isMountedRef.current) {
        setError(err.message || 'An error occurred while fetching merchants');
        setMerchants([]);
      }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

  // Combined effect for page and search changes
  useEffect(() => {
    isMountedRef.current = true;

    // Debounce search, but fetch immediately for page changes
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        fetchMerchants(currentPage, searchQuery);
      }
    }, searchQuery ? 500 : 0); // Only debounce if there's a search query

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, searchQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Since we're fetching from API with pagination, we use merchants directly
  const paginatedMerchants = merchants;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const handleDelete = async (merchantId) => {
    if (!window.confirm('Are you sure you want to delete this merchant? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(merchantId);
      setOpenMenuId(null);
      
      // Get token from localStorage
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;
      
      const response = await fetch(`${API_BASE_URL_V1}/merchants/${merchantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete merchant');
      }

      // Refresh the list
      fetchMerchants(currentPage, searchQuery);
    } catch (error) {
      console.error('Error deleting merchant:', error);
      alert('Failed to delete merchant. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setExpandedRows(new Set()); // Reset expanded rows when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = async () => {
    try {
      // Fetch all merchants for export (without pagination)
      // Get token from localStorage
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/merchants?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      const data = await response.json();

      const merchantsToExport = data.success ? data.data.merchants : merchants;

    // Export functionality - can be CSV, Excel, etc.
    const csvContent = [
      ['Business Name', 'Email', 'Business Type', 'Phone', 'Created'],
        ...merchantsToExport.map(merchant => [
        merchant.businessName,
        merchant.email,
        merchant.businessType,
        merchant.phone || 'N/A',
        merchant.createdAt
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `merchants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export merchants');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto" style={{ borderColor: "transparent",  }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <Typography variant="h4" className="text-gray-900 font-bold text-xl sm:text-2xl truncate">
                Merchants
              </Typography>
            </div>
            <Button 
              variant="gradient" 
              className="flex items-center justify-center gap-2 font-normal text-xs sm:text-sm normal-case w-full sm:w-auto flex-shrink-0"
              onClick={() => navigate("/dashboard/merchants/register")}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Merchant</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
          <Typography variant="small" className="text-gray-600 text-xs sm:text-sm">
            View and manage all registered merchants
          </Typography>
        </div>

      {/* Info and Search Section */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
        {/* Search Field */}
        <div className="w-full md:flex-1 md:max-w-md">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!border-t-blue-gray-200 focus:!border-t-gray-900 !pr-10"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              containerProps={{
                className: "min-w-0"
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Total Count and Export - Right Aligned (Desktop: In same row) */}
        <div className="flex items-center gap-4 justify-end md:justify-start">
          <Typography variant="small" color="blue-gray" className="font-normal whitespace-nowrap">
            Total: {totalItems}
          </Typography>
          <Button
            variant="outlined"
            size="sm"
            className="flex items-center gap-2 normal-case"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      <Card className="border border-blue-gray-200 shadow-sm">
        <CardBody className="px-0 pt-0 pb-2">
            {error && (
              <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
                <Typography color="red" className="text-sm">
                  {error}
                </Typography>
              </div>
            )}
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
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
              <Typography color="blue-gray" className="mt-4">Loading merchants...</Typography>
            </div>
          ) : paginatedMerchants.length === 0 ? (
            <div className="p-8 text-center">
              <Typography color="blue-gray">
                {searchQuery ? "No merchants found matching your search" : "No merchants found"}
              </Typography>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-scroll">
                <table className="w-full min-w-[640px] table-auto cursor-pointer-table">
                  <thead>
                    <tr>
                      {["Business Name", "Email", "Business Type", "Phone", "Created", "Actions"].map((el) => (
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
                    {paginatedMerchants.map((merchant, key) => {
                      const className = `py-3 px-5 ${
                        key === paginatedMerchants.length - 1
                          ? ""
                          : "border-b border-blue-gray-200"
                      }`;

                      const isMenuOpen = openMenuId === merchant.id;
                      return (
                        <tr 
                          key={`${merchant.id}-${key}`}
                          onClick={() =>      navigate(`/dashboard/merchants/${merchant.id}`)}
                          className={isMenuOpen ? "bg-blue-50 transition-colors duration-200" : ""}
                        >
                          <td className={className}>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="text-sm font-semibold"
                            >
                              {merchant.businessName}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-sm font-normal text-blue-gray-500">
                              {merchant.email}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-sm font-semibold text-blue-gray-600">
                              {merchant.businessType}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-sm font-normal text-blue-gray-500">
                              {merchant.phone || "N/A"}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-sm font-semibold text-blue-gray-600">
                              {merchant.createdAt}
                            </Typography>
                          </td>
                          <td className={className}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="relative inline-block" 
                                ref={(el) => {
                                  if (el) menuRefs.current[merchant.id] = el;
                                }}
                              >
                                <IconButton
                                  size="sm"
                                  variant="text"
                                  color={openMenuId === merchant.id ? "blue" : "gray"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (openMenuId === merchant.id) {
                                      setOpenMenuId(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const menuWidth = 192; // w-48 = 192px
                                      const menuHeight = 140; // Approximate menu height
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
                                      setOpenMenuId(merchant.id);
                                    }
                                  }}
                                  className={`rounded-lg transition-colors ${openMenuId === merchant.id ? "bg-blue-100" : ""}`}
                                >
                                  <MoreVertical className={`h-5 w-5 ${openMenuId === merchant.id ? "text-blue-600" : ""}`} />
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {/* Header Row - Only shown once at top */}
                <div className="bg-blue-gray-50 rounded-t-lg border border-b-0 border-blue-gray-100 px-4 py-2">
                  <div className="flex items-center justify-between">
                    <Typography
                      variant="small"
                      className="text-xs font-bold uppercase text-blue-gray-600"
                    >
                      Business Name
                    </Typography>
                    <div className="flex items-center gap-8">
                      {/* Remove Status header */}
                      <div className="w-6"></div> {/* Spacer for expand icon */}
                    </div>
                  </div>
                </div>

                {paginatedMerchants.map((merchant, key) => {
                  const isExpanded = expandedRows.has(`${merchant.id}-${key}`);
                  
                  return (
                    <div
                      key={`${merchant.id}-${key}`}
                      
                      className="bg-white rounded-lg border border-blue-gray-100 shadow-sm overflow-hidden"
                    >
                      {/* Main Row - Title and Expand Only - Entire Row Clickable */}
                      <div 
                        className="flex items-center gap-2 p-4 border-b border-blue-gray-200 cursor-pointer hover:bg-blue-gray-50/50 transition-colors"
                        onClick={() => toggleRow(`${merchant.id}-${key}`)}
                      >
                        {/* Business Name - Can wrap if too long */}
                        <div className="flex-1 min-w-0">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="text-sm font-semibold break-words"
                            style={{ 
                              maxWidth: merchant.businessName.length > 25 ? '200px' : 'none',
                              lineHeight: '1.5'
                            }}
                          >
                            {merchant.businessName}
                          </Typography>
                        </div>
                        {/* Expand/Collapse Icon */}
                        <div className="flex-shrink-0 ml-1 pointer-events-none">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-blue-gray-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-blue-gray-600" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details - Hidden by Default */}
                      {isExpanded && (
                        <div className="bg-blue-gray-50/30">
                          {/* Email Field */}
                          <div className="px-4 py-3 border-b border-blue-gray-200">
                            <div className="flex items-center justify-between">
                              <Typography
                                variant="small"
                                className="text-xs font-normal text-blue-gray-500"
                              >
                                Email
                              </Typography>
                              <Typography className="text-sm font-normal text-blue-gray-900">
                                {merchant.email}
                              </Typography>
                            </div>
                          </div>
                          
                          {/* Business Type Field */}
                          <div className="px-4 py-3 border-b border-blue-gray-200">
                            <div className="flex items-center justify-between">
                              <Typography
                                variant="small"
                                className="text-xs font-normal text-blue-gray-500"
                              >
                                Business Type
                              </Typography>
                              <Typography className="text-sm font-semibold text-blue-gray-900">
                                {merchant.businessType}
                              </Typography>
                            </div>
                          </div>
                          
                          {/* Phone Field */}
                          <div className="px-4 py-3 border-b border-blue-gray-200">
                            <div className="flex items-center justify-between">
                              <Typography
                                variant="small"
                                className="text-xs font-normal text-blue-gray-500"
                              >
                                Phone
                              </Typography>
                              <Typography className="text-sm font-normal text-blue-gray-900">
                                {merchant.phone || "N/A"}
                              </Typography>
                            </div>
                          </div>
                          
                          {/* Created Field */}
                          <div className="px-4 py-3 border-b border-blue-gray-200">
                            <div className="flex items-center justify-between">
                              <Typography
                                variant="small"
                                className="text-xs font-normal text-blue-gray-500"
                              >
                                Created
                              </Typography>
                              <Typography className="text-sm font-semibold text-blue-gray-900">
                                {merchant.createdAt}
                              </Typography>
                            </div>
                          </div>
                          
                          {/* Actions Buttons */}
                          <div className="px-4 py-4 border-t border-blue-gray-200">
                            {/* Action Buttons Row - View, Edit, Delete */}
                            <div className="flex items-center gap-2">
                              {/* View Button */}
                              <Button
                                size="sm"
                                variant="outlined"
                                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 normal-case text-gray-700 rounded-lg flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/merchants/${merchant.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium">View</span>
                              </Button>
                              
                              {/* Edit Button */}
                              <Button
                                size="sm"
                                variant="outlined"
                                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 normal-case text-gray-700 rounded-lg flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/merchants/${merchant.id}/edit`);
                                }}
                              >
                                <Pencil className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium">Edit</span>
                              </Button>
                              
                              {/* Delete Button (Icon-only) */}
                              <IconButton
                                size="sm"
                                variant="outlined"
                                className="border border-red-300 bg-white hover:bg-red-50 rounded-lg w-10 h-10 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(merchant.id);
                                }}
                                disabled={deletingId === merchant.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalItems > itemsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4">
                  <Typography variant="small" color="blue-gray" className="font-normal text-center sm:text-left">
                    Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                  </Typography>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* First Button */}
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`min-w-[50px] text-xs normal-case ${
                        currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      First
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // If total pages is 2 or less, show all pages
                        if (totalPages <= 2) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "filled" : "text"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className={`min-w-[32px] ${
                                currentPage === page
                                  ? "bg-blue-gray-900 text-white"
                                  : "text-blue-gray-600"
                              }`}
                            >
                              {page}
                            </Button>
                          );
                        }
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "filled" : "text"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className={`min-w-[32px] ${
                                currentPage === page
                                  ? "bg-blue-gray-900 text-white"
                                  : "text-blue-gray-600"
                              }`}
                            >
                              {page}
                            </Button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
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
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`min-w-[60px] text-xs normal-case ${
                        currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
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
            {/* Merchant name header */}
            {(() => {
              const merchant = merchants.find(m => m.id === openMenuId);
              return merchant ? (
                <div className="px-4 py-2 border-b border-gray-200 bg-blue-50">
                  <Typography variant="small" className="text-xs font-semibold text-blue-gray-700 truncate">
                    {merchant.businessName}
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
                const merchant = merchants.find(m => m.id === currentMenuId);
                if (merchant) {
                  navigate(`/dashboard/merchants/${merchant.id}`);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentMenuId = openMenuId;
                setOpenMenuId(null);
                const merchant = merchants.find(m => m.id === currentMenuId);
                if (merchant) {
                  navigate(`/dashboard/merchants/${merchant.id}/edit`);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Edit
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
              <Trash2 className="h-4 w-4" />
              {deletingId === openMenuId ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

export default Merchants;
