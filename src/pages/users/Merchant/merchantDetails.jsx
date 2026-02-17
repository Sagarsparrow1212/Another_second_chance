import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Chip,
  Card,
  CardBody,
  Input,
  Textarea,
  Select,
  Option,
  Alert,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  IdentificationIcon,
  BriefcaseIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL_V1, API_BASE_URL, getFileUrl } from "@/configs/api";

export function MerchantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState("basic");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobFormData, setJobFormData] = useState({
    title: "",
    description: "",
    category: "",
    salaryRange: { min: "", max: "" },
    location: { address: "", lat: "", lng: "" },
    status: "pending",
  });
  const [jobFormErrors, setJobFormErrors] = useState({});
  const [jobSubmitLoading, setJobSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchMerchantDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/merchants/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch merchant details');
        }

        const data = await response.json();

        if (data.success) {
          setMerchant(data.data);
        } else {
          setError(data.message || 'Failed to fetch merchant details');
        }
      } catch (err) {
        console.error('Fetch merchant details error:', err);
        setError(err.message || 'An error occurred while fetching merchant details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMerchantDetails();
    }
  }, [id]);

  // Fetch jobs when merchant is loaded (to show count in tab)
  useEffect(() => {
    const fetchJobs = async () => {
      if (id) {
        try {
          setJobsLoading(true);
          
          // Get token from localStorage
          const sessionData = localStorage.getItem('auth_session');
          const token = sessionData ? JSON.parse(sessionData).token : null;
          
          const response = await fetch(`${API_BASE_URL_V1}/merchants/${id}/jobs`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch jobs');
          }

          const data = await response.json();

          if (data.success) {
            setJobs(data.data.jobs || []);
          }
        } catch (err) {
          console.error('Fetch jobs error:', err);
        } finally {
          setJobsLoading(false);
        }
      }
    };

    // Fetch jobs when merchant is loaded
    if (merchant) {
      fetchJobs();
    }
  }, [merchant, id]);

  // Refresh jobs when Jobs tab becomes active (in case jobs were added/updated)
  useEffect(() => {
    const refreshJobs = async () => {
      if (activeTab === "jobs" && id) {
        try {
          setJobsLoading(true);
          
          // Get token from localStorage
          const sessionData = localStorage.getItem('auth_session');
          const token = sessionData ? JSON.parse(sessionData).token : null;
          
          const response = await fetch(`${API_BASE_URL_V1}/merchants/${id}/jobs`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch jobs');
          }

          const data = await response.json();

          if (data.success) {
            setJobs(data.data.jobs || []);
          }
        } catch (err) {
          console.error('Fetch jobs error:', err);
        } finally {
          setJobsLoading(false);
        }
      }
    };

    // Refresh jobs when Jobs tab is activated
    if (activeTab === "jobs") {
      refreshJobs();
    }
  }, [activeTab, id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (verified) => {
    if (verified) {
      return "green";
    }
    return "amber";
  };

  const getMerchantFileUrl = (filePath) => {
    if (!filePath) return null;
    // If it's already a full URL, return it
    if (filePath.startsWith('http')) {
      return filePath;
    }
    // Otherwise, construct the URL using the imported helper
    return getFileUrl(filePath);
  };

  if (loading) {
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
          <Typography color="blue-gray">Loading merchant details...</Typography>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Typography color="red" className="mb-4">{error}</Typography>
          <Button 
            onClick={() => navigate("/dashboard/merchants")} 
            className="bg-blue-600 text-white"
          >
            Back to Merchants
          </Button>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Typography color="blue-gray" className="mb-4">Merchant not found</Typography>
          <Button 
            onClick={() => navigate("/dashboard/merchants")} 
            className="bg-blue-600 text-white"
          >
            Back to Merchants
          </Button>
        </div>
      </div>
    );
  }

  const statusText = merchant.verified ? 'VERIFIED' : 'PENDING';

  const tabsData = [
    {
      label: "Basic Information",
      value: "basic",
      icon: InformationCircleIcon,
    },
    {
      label: "Address Information",
      value: "address",
      icon: MapPinIcon,
    },
    {
      label: "Documents",
      value: "documents",
      icon: IdentificationIcon,
    },
    {
      label: "Jobs",
      value: "jobs",
      icon: BriefcaseIcon,
    },
  ];

  // Job management functions
  const handleJobFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setJobFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setJobFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    // Clear error for this field
    if (jobFormErrors[field]) {
      setJobFormErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateJobForm = () => {
    const errors = {};
    if (!jobFormData.title.trim()) errors.title = "Title is required";
    if (!jobFormData.description.trim()) errors.description = "Description is required";
    if (!jobFormData.category.trim()) errors.category = "Category is required";
    if (!jobFormData.salaryRange.min || jobFormData.salaryRange.min < 0) {
      errors.salaryMin = "Valid minimum salary is required";
    }
    if (!jobFormData.salaryRange.max || jobFormData.salaryRange.max < 0) {
      errors.salaryMax = "Valid maximum salary is required";
    }
    if (parseFloat(jobFormData.salaryRange.min) > parseFloat(jobFormData.salaryRange.max)) {
      errors.salaryRange = "Minimum salary cannot be greater than maximum salary";
    }
    if (!jobFormData.location.address.trim()) {
      errors.locationAddress = "Location address is required";
    }
    setJobFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateJob = async () => {
    if (!validateJobForm()) return;

    setJobSubmitLoading(true);
    try {
      // Get token from localStorage
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/merchants/${id}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title: jobFormData.title.trim(),
          description: jobFormData.description.trim(),
          category: jobFormData.category.trim(),
          salaryRange: {
            min: parseFloat(jobFormData.salaryRange.min),
            max: parseFloat(jobFormData.salaryRange.max),
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
        setJobFormData({
          title: "",
          description: "",
          category: "",
          salaryRange: { min: "", max: "" },
          location: { address: "", lat: "", lng: "" },
          status: "pending",
        });
        setJobFormErrors({});
        // Refresh jobs list
        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const jobsResponse = await fetch(`${API_BASE_URL_V1}/merchants/${id}/jobs`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        const jobsData = await jobsResponse.json();
        if (jobsData.success) {
          setJobs(jobsData.data.jobs || []);
        }
      } else {
        setJobFormErrors({ submit: data.message || "Failed to create job" });
      }
    } catch (err) {
      console.error("Create job error:", err);
      setJobFormErrors({ submit: err.message || "An error occurred" });
    } finally {
      setJobSubmitLoading(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!validateJobForm()) return;

    setJobSubmitLoading(true);
    try {
      // Get token from localStorage
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/jobs/${editingJob._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title: jobFormData.title.trim(),
          description: jobFormData.description.trim(),
          category: jobFormData.category.trim(),
          salaryRange: {
            min: parseFloat(jobFormData.salaryRange.min),
            max: parseFloat(jobFormData.salaryRange.max),
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
        setEditingJob(null);
        setJobFormData({
          title: "",
          description: "",
          category: "",
          salaryRange: { min: "", max: "" },
          location: { address: "", lat: "", lng: "" },
          status: "pending",
        });
        setJobFormErrors({});
        // Refresh jobs list
        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const jobsResponse = await fetch(`${API_BASE_URL_V1}/merchants/${id}/jobs`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        const jobsData = await jobsResponse.json();
        if (jobsData.success) {
          setJobs(jobsData.data.jobs || []);
        }
      } else {
        setJobFormErrors({ submit: data.message || "Failed to update job" });
      }
    } catch (err) {
      console.error("Update job error:", err);
      setJobFormErrors({ submit: err.message || "An error occurred" });
    } finally {
      setJobSubmitLoading(false);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title,
      description: job.description,
      category: job.category,
      salaryRange: {
        min: job.salaryRange.min.toString(),
        max: job.salaryRange.max.toString(),
      },
      location: {
        address: job.location.address,
        lat: job.location.lat ? job.location.lat.toString() : "",
        lng: job.location.lng ? job.location.lng.toString() : "",
      },
      status: job.status,
    });
    setJobFormErrors({});
    setShowJobDialog(true);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      // Get token from localStorage
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh jobs list
        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const jobsResponse = await fetch(`${API_BASE_URL_V1}/merchants/${id}/jobs`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        const jobsData = await jobsResponse.json();
        if (jobsData.success) {
          setJobs(jobsData.data.jobs || []);
        }
      } else {
        alert(data.message || "Failed to delete job");
      }
    } catch (err) {
      console.error("Delete job error:", err);
      alert(err.message || "An error occurred");
    }
  };

  const openCreateJobDialog = () => {
    setEditingJob(null);
    setJobFormData({
      title: "",
      description: "",
      category: "",
      salaryRange: { min: "", max: "" },
      location: { address: "", lat: "", lng: "" },
      status: "pending",
    });
    setJobFormErrors({});
    setShowJobDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto" style={{ borderColor: "transparent",  }}>
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Back</span>
              </button>
              <div className="w-px h-8 bg-gray-300" />
              <div>
                <Typography variant="h4" className="text-gray-900 font-bold">
                  {merchant.businessName}
                </Typography>
                <Typography variant="small" className="text-gray-500 mt-1">
                  Merchant Details  
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-3">
              
              <Button
                size="sm"
                variant="outlined"
                className="flex items-center gap-2 normal-case"
                onClick={() => navigate(`/dashboard/merchants/${id}/edit`)}
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <Tabs value={activeTab} className="min-h-[600px]">
            <div className="overflow-x-auto -mx-4 sm:mx-0 scrollbar-hide">
              <TabsHeader
                className="rounded-none border-b border-blue-gray-100 bg-gray-50/50 px-4 sm:px-4 md:px-6 pt-4 pb-0 w-full min-w-max"
                indicatorProps={{
                  className: "bg-transparent border-b-2 border-blue-600 shadow-none rounded-none",
                }}
              >
                {tabsData.map(({ label, value, icon: Icon }) => {
                  const isActive = activeTab === value;
                  return (
                    <Tab
                      key={value}
                      value={value}
                      onClick={() => setActiveTab(value)}
                      className="px-2 sm:px-3 md:px-4 py-3 font-semibold text-xs sm:text-sm md:text-base transition-all whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 inline-block ${
                          isActive ? "text-blue-600" : "text-gray-500"
                        }`} />
                        <span className={`${
                          isActive ? "text-blue-600" : "text-gray-600"
                        }`}>
                          <span className="hidden sm:inline">{label==="Jobs" ? label + " (" + jobs.length + ")" : label}</span>
                          <span className="sm:hidden">
                            {value === "basic" ? "Basic" : value === "address" ? "Address" : value === "documents" ? "Docs" : "Jobs"}
                          </span>
                        </span>
                      </div>
                    </Tab>
                  );
                })}
              </TabsHeader>
            </div>

            <TabsBody className="p-6">
              {/* Basic Information Tab */}
              <TabPanel value="basic" className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <InformationCircleIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Basic Information
                  </Typography>
                </div>
                <div className="space-y-6">
                  {/* Business Type and Contact Person */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Business Type</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <BuildingStorefrontIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{merchant.businessType || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Contact Person</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{merchant.contactPersonName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Designation */}
                  {merchant.contactDesignation && (
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Contact Designation</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <IdentificationIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{merchant.contactDesignation}</p>
                      </div>
                    </div>
                  )}

                  {/* Email Address and Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Email Address</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <a 
                          href={`mailto:${merchant.email}`}
                          className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold text-lg"
                        >
                          {merchant.email || 'N/A'}
                        </a>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Phone Number</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <PhoneIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{merchant.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Registration Date */}
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">Registration Date</label>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-gray-900 font-semibold text-lg">{formatDate(merchant.createdAt)}</p>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                    
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Account Status</label>
                      <div className="flex items-center gap-2">
                        {merchant.isActive ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-500" />
                        )}
                        <p className="text-gray-900 font-semibold text-lg">{merchant.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                    </div>
                    {merchant.updatedAt && (
                      <div className="p-4 rounded-lg bg-gray-50 sm:col-span-2">
                        <label className="block text-gray-500 text-sm mb-2 font-medium">Last Updated</label>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <ClockIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-gray-900 font-semibold text-lg">{formatDate(merchant.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabPanel>

              {/* Address Information Tab */}
              <TabPanel value="address" className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <MapPinIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Address Information
                  </Typography>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-gray-50 sm:col-span-2">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">Street Address</label>
                    <p className="text-gray-900 font-semibold text-lg">{merchant.streetAddress || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">City</label>
                    <p className="text-gray-900 font-semibold text-lg">{merchant.city || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">State</label>
                    <p className="text-gray-900 font-semibold text-lg">{merchant.state || 'N/A'}</p>
                  </div>
                </div>
              </TabPanel>

              {/* Documents Tab */}
              <TabPanel value="documents" className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <IdentificationIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Verification Documents
                  </Typography>
                </div>
                {(merchant.gstCertificate || merchant.businessLicense || merchant.photoId) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {merchant.gstCertificate && (
                      <div className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <IdentificationIcon className="w-5 h-5 text-gray-600" />
                          <Typography variant="h6" className="text-gray-900 font-semibold text-sm">
                            GST Certificate
                          </Typography>
                        </div>
                        <a
                          href={getMerchantFileUrl(merchant.gstCertificate)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium underline inline-flex items-center gap-1"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                    {merchant.businessLicense && (
                      <div className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                          <Typography variant="h6" className="text-gray-900 font-semibold text-sm">
                            Business License
                          </Typography>
                        </div>
                        <a
                          href={getMerchantFileUrl(merchant.businessLicense)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium underline inline-flex items-center gap-1"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                    {merchant.photoId && (
                      <div className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <IdentificationIcon className="w-5 h-5 text-gray-600" />
                          <Typography variant="h6" className="text-gray-900 font-semibold text-sm">
                            Photo ID
                          </Typography>
                        </div>
                        <a
                          href={getMerchantFileUrl(merchant.photoId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium underline inline-flex items-center gap-1"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <Typography color="blue-gray" className="text-lg">
                      No documents uploaded
                    </Typography>
                  </div>
                )}
              </TabPanel>

              {/* Jobs Tab */}
              <TabPanel value="jobs" className="p-0">
                {/* For desktop/tablet: horizontal flex, for mobile: stack + move button to bottom right */}
                <div className="mb-6">
                  <div className="flex items-center justify-between sm:flex-row flex-col gap-4 sm:gap-0 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <Typography variant="h5" className="text-gray-900 font-bold">
                        Job Opportunities
                      </Typography>
                    </div>
                    {/* Desktop/tablet: show here, mobile: hidden */}
                    <Button
                      size="sm"
                      className="flex items-center gap-2 bg-blue-600 text-white hidden sm:flex"
                      onClick={openCreateJobDialog}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Create Job
                    </Button>
                  </div>
                  {/* Mobile only: fixed button at the bottom right */}
                  <div className="sm:hidden">
                    <div className="fixed inset-x-0 bottom-4 flex justify-end pr-6 z-30 pointer-events-none">
                      <div className="pointer-events-auto">
                        <Button
                          size="md"
                          className="flex items-center gap-2 bg-blue-600 text-white shadow-lg rounded-full"
                          onClick={openCreateJobDialog}
                        >
                          <PlusIcon className="h-5 w-5" />
                          <span className="font-medium">Create Job</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {jobsLoading ? (
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
                ) : jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <Card key={job._id} className="border border-gray-200">
                        <CardBody className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Typography variant="h6" className="text-gray-900 font-bold">
                                  {job.title}
                                </Typography>
                                <Chip
                                  value={job.status.toUpperCase()}
                                  size="sm"
                                  color={
                                    job.status === "active"
                                      ? "green"
                                      : job.status === "closed"
                                      ? "red"
                                      : "amber"
                                  }
                                />
                              </div>
                              <Typography variant="small" className="text-gray-600 mb-3">
                                {job.description}
                              </Typography>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <Typography variant="small" className="text-gray-500 mb-1">
                                    Category
                                  </Typography>
                                  <Typography variant="small" className="text-gray-900 font-medium">
                                    {job.category}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="small" className="text-gray-500 mb-1">
                                    Salary Range
                                  </Typography>
                                  <Typography variant="small" className="text-gray-900 font-medium">
                                    ${job.salaryRange.min} - ${job.salaryRange.max}
                                  </Typography>
                                </div>
                                <div className="sm:col-span-2">
                                  <Typography variant="small" className="text-gray-500 mb-1">
                                    Location
                                  </Typography>
                                  <Typography variant="small" className="text-gray-900 font-medium">
                                    {job.location.address}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="small" className="text-gray-500 mb-1">
                                    Created
                                  </Typography>
                                  <Typography variant="small" className="text-gray-900 font-medium">
                                    {formatDate(job.createdAt)}
                                  </Typography>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <IconButton
                                size="sm"
                                variant="text"
                                color="blue"
                                onClick={() => handleEditJob(job)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </IconButton>
                              <IconButton
                                size="sm"
                                variant="text"
                                color="red"
                                onClick={() => handleDeleteJob(job._id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </IconButton>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <BriefcaseIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <Typography color="blue-gray" className="text-lg mb-2">
                      No jobs posted yet
                    </Typography>
                    <Typography variant="small" color="blue-gray" className="mb-4">
                      Create your first job opportunity to get started
                    </Typography>
                    <Button
                      size="sm"
                      className="bg-blue-600 text-white"
                      onClick={openCreateJobDialog}
                    >
                      Create Job
                    </Button>
                  </div>
                )}
              </TabPanel>
            </TabsBody>
          </Tabs>
        </div>
      </div>

      {/* Job Form Dialog */}
      <Dialog 
        open={showJobDialog} 
        handler={() => setShowJobDialog(false)} 
        size="lg"
        className="sm:max-w-[600px] max-w-[95vw]"
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <Typography variant="h5" className="text-lg sm:text-xl font-bold">
            {editingJob ? "Edit Job" : "Create New Job"}
          </Typography>
        </DialogHeader>
        <DialogBody className="max-h-[calc(100vh-200px)] sm:max-h-[70vh] overflow-y-auto px-4 sm:px-6 py-4">
          {jobFormErrors.submit && (
            <Alert color="red" className="mb-4 text-sm">
              {jobFormErrors.submit}
            </Alert>
          )}
          <div className="space-y-4 sm:space-y-5">
            <div>
              <Input
                label="Job Title *"
                value={jobFormData.title}
                onChange={(e) => handleJobFormChange("title", e.target.value)}
                error={!!jobFormErrors.title}
                className="text-base sm:text-sm"
                labelProps={{
                  className: "text-sm sm:text-xs"
                }}
              />
              {jobFormErrors.title && (
                <Typography variant="small" color="red" className="mt-1 text-xs">
                  {jobFormErrors.title}
                </Typography>
              )}
            </div>

            <div>
              <Textarea
                label="Description *"
                value={jobFormData.description}
                onChange={(e) => handleJobFormChange("description", e.target.value)}
                rows={4}
                error={!!jobFormErrors.description}
                className="text-base sm:text-sm"
                labelProps={{
                  className: "text-sm sm:text-xs"
                }}
              />
              {jobFormErrors.description && (
                <Typography variant="small" color="red" className="mt-1 text-xs">
                  {jobFormErrors.description}
                </Typography>
              )}
            </div>

            <div>
              <label className="block text-sm sm:text-xs font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <Input
                value={jobFormData.category}
                onChange={(e) => handleJobFormChange("category", e.target.value)}
                placeholder="e.g., Warehouse Helper, Delivery Driver"
                error={!!jobFormErrors.category}
                className="text-base sm:text-sm"
                labelProps={{
                  className: "hidden"
                }}
                containerProps={{
                  className: "min-w-0"
                }}
              />
              {jobFormErrors.category && (
                <Typography variant="small" color="red" className="mt-1 text-xs">
                  {jobFormErrors.category}
                </Typography>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Min Salary ($) *"
                  type="number"
                  value={jobFormData.salaryRange.min}
                  onChange={(e) => handleJobFormChange("salaryRange.min", e.target.value)}
                  error={!!jobFormErrors.salaryMin || !!jobFormErrors.salaryRange}
                  className="text-base sm:text-sm"
                />
                {jobFormErrors.salaryMin && (
                  <Typography variant="small" color="red" className="mt-1 text-xs">
                    {jobFormErrors.salaryMin}
                  </Typography>
                )}
              </div>
              <div>
                <Input
                  label="Max Salary ($) *"
                  type="number"
                  value={jobFormData.salaryRange.max}
                  onChange={(e) => handleJobFormChange("salaryRange.max", e.target.value)}
                  error={!!jobFormErrors.salaryMax || !!jobFormErrors.salaryRange}
                  className="text-base sm:text-sm"
                />
                {jobFormErrors.salaryMax && (
                  <Typography variant="small" color="red" className="mt-1 text-xs">
                    {jobFormErrors.salaryMax}
                  </Typography>
                )}
              </div>
            </div>
            {jobFormErrors.salaryRange && (
              <Typography variant="small" color="red">
                {jobFormErrors.salaryRange}
              </Typography>
            )}

            <div>
              <Input
                label="Location Address *"
                value={jobFormData.location.address}
                onChange={(e) => handleJobFormChange("location.address", e.target.value)}
                error={!!jobFormErrors.locationAddress}
                className="text-base sm:text-sm"
                labelProps={{
                  className: "text-sm sm:text-xs"
                }}
              />
              {jobFormErrors.locationAddress && (
                <Typography variant="small" color="red" className="mt-1 text-xs">
                  {jobFormErrors.locationAddress}
                </Typography>
              )}
            </div>

            

            <div>
              <Select
                label="Status *"
                value={jobFormData.status}
                onChange={(value) => handleJobFormChange("status", value)}
                className="text-base sm:text-sm"
                labelProps={{
                  className: "text-sm sm:text-xs"
                }}
              >
                <Option value="pending">Pending</Option>
                <Option value="active">Active</Option>
                <Option value="closed">Closed</Option>
              </Select>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="text"
            color="red"
            onClick={() => {
              setShowJobDialog(false);
              setEditingJob(null);
              setJobFormErrors({});
            }}
            className="w-full sm:w-auto sm:mr-1 order-2 sm:order-1 text-sm sm:text-base py-2.5 sm:py-2"
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            color="blue"
            onClick={editingJob ? handleUpdateJob : handleCreateJob}
            disabled={jobSubmitLoading}
            className="w-full sm:w-auto order-1 sm:order-2 text-sm sm:text-base py-2.5 sm:py-2"
          >
            {jobSubmitLoading
              ? "Processing..."
              : editingJob
              ? "Update Job"
              : "Create Job"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default MerchantDetails;
