import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Chip,
  Card,
  CardBody,
  Alert,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  DocumentTextIcon,
  PaperAirplaneIcon, // Check if this icon exists or use another one. Will use CheckCircleIcon if not available or just text.
} from "@heroicons/react/24/outline";
import { API_BASE_URL_V1, API_BASE_URL } from "@/configs/api";

export function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/jobs/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }

        const data = await response.json();

        if (data.success) {
          setJob(data.data);
        } else {
          setError(data.message || 'Failed to fetch job details');
        }
      } catch (err) {
        console.error('Fetch job details error:', err);
        setError(err.message || 'An error occurred while fetching job details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobDetails();
    }
  }, [id]);

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

  const handleStatusChange = async (newStatus) => {
    if (!job || newStatus === job.status) return;

    try {
      setUpdatingStatus(true);

      // Get token from localStorage
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/jobs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setJob({ ...job, status: newStatus });
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.message || 'An error occurred while updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    try {
      setLoading(true); // Re-use loading state or create a specific one if needed. Using loading might hide the UI. Better to use a specific state.
      // But for now, let's just use window.confirm then fetch.

      if (!window.confirm("Are you sure you want to apply for this job?")) {
        setLoading(false);
        return;
      }

      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/jobs/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (data.success) {
        alert("Application submitted successfully!");
      } else {
        alert(data.message || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Apply error:', err);
      alert(err.message || 'An error occurred while applying');
    } finally {
      setLoading(false);
    }
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
          <Typography color="blue-gray">Loading job details...</Typography>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardBody className="p-6">
            <Alert color="red" className="mb-4">
              {error}
            </Alert>
            <Button
              variant="outlined"
              onClick={() => navigate("/dashboard/jobs")}
              className="w-full"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Jobs List
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardBody className="p-6 text-center">
            <Typography variant="h6" color="blue-gray" className="mb-4">
              Job not found
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate("/dashboard/jobs")}
              className="w-full"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Jobs List
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto ">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="text"
            size="sm"
            className="flex items-center gap-2 normal-case text-sm font-medium text-gray-700 hover:text-gray-900 p-2 mb-4"
            onClick={() => navigate("/dashboard/jobs")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Jobs List</span>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BriefcaseIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <Typography variant="h4" className="text-gray-900 font-bold">
                {job.title}
              </Typography>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Select
                    value={job.status}
                    onChange={handleStatusChange}
                    disabled={updatingStatus}
                    className="w-32"
                    labelProps={{
                      className: "hidden",
                    }}
                    containerProps={{
                      className: "min-w-[120px]",
                    }}
                  >
                    <Option value="pending">Pending</Option>
                    <Option value="active">Active</Option>
                    <Option value="closed">Closed</Option>
                  </Select>
                  {updatingStatus && (
                    <div className="flex items-center gap-1">
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
                <Typography variant="small" className="text-gray-500">
                  Posted {formatDate(job.createdAt)}
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                  <Typography variant="h6" className="text-gray-900 font-semibold">
                    Job Description
                  </Typography>
                </div>
                <Typography variant="paragraph" className="text-gray-700 whitespace-pre-wrap">
                  {job.description || 'No description provided.'}
                </Typography>
              </CardBody>
            </Card>

            {/* Job Details */}
            <Card>
              <CardBody className="p-6">
                <Typography variant="h6" className="text-gray-900 font-semibold mb-4">
                  Job Details
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="flex items-start gap-3">
                    <TagIcon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <Typography variant="small" className="text-gray-500 font-medium">
                        Category
                      </Typography>
                      <Typography variant="paragraph" className="text-gray-900 font-semibold capitalize">
                        {job.category || 'N/A'}
                      </Typography>
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="flex items-start gap-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <Typography variant="small" className="text-gray-500 font-medium">
                        Salary Range
                      </Typography>
                      <Typography variant="paragraph" className="text-gray-900 font-semibold">
                        ₹{job.salaryRange?.min?.toLocaleString() || '0'} - ₹{job.salaryRange?.max?.toLocaleString() || '0'}
                      </Typography>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <Typography variant="small" className="text-gray-500 font-medium">
                        Location
                      </Typography>
                      <Typography variant="paragraph" className="text-gray-900 font-semibold">
                        {job.location?.address || 'N/A'}
                      </Typography>
                      {job.location?.lat && job.location?.lng && (
                        <Typography variant="small" className="text-gray-500 mt-1">
                          Coordinates: {job.location.lat.toFixed(6)}, {job.location.lng.toFixed(6)}
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Merchant Information */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
                  <Typography variant="h6" className="text-gray-900 font-semibold">
                    Posted By
                  </Typography>
                </div>
                <div className="space-y-3">
                  <div>
                    <Typography variant="small" className="text-gray-500 font-medium">
                      Merchant Name
                    </Typography>
                    <Typography variant="paragraph" className="text-gray-900 font-semibold">
                      {job.merchantId?.businessName || 'N/A'}
                    </Typography>
                  </div>
                  {job.merchantId?._id && (
                    <Button
                      variant="outlined"
                      size="sm"
                      className="w-full normal-case"
                      onClick={() => navigate(`/dashboard/merchants/${job.merchantId._id}`)}
                    >
                      View Merchant Profile
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Job Information */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-5 h-5 text-gray-600" />
                  <Typography variant="h6" className="text-gray-900 font-semibold">
                    Job Information
                  </Typography>
                </div>
                <div className="space-y-4">
                  <div>
                    <Typography variant="small" className="text-gray-500 font-medium mb-2">
                      Status
                    </Typography>
                    <div className="mt-1">
                      <Select
                        value={job.status}
                        onChange={handleStatusChange}
                        disabled={updatingStatus}
                        className="w-full"
                        labelProps={{
                          className: "hidden",
                        }}
                      >
                        <Option value="pending">Pending</Option>
                        <Option value="active">Active</Option>
                        <Option value="closed">Closed</Option>
                      </Select>
                      {updatingStatus && (
                        <div className="flex items-center gap-1 mt-2">
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
                          <Typography variant="small" className="text-gray-500">
                            Updating...
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Typography variant="small" className="text-gray-500 font-medium">
                      Created At
                    </Typography>
                    <Typography variant="paragraph" className="text-gray-900 font-semibold">
                      {formatDate(job.createdAt)}
                    </Typography>
                  </div>
                  {job.updatedAt && job.updatedAt !== job.createdAt && (
                    <div>
                      <Typography variant="small" className="text-gray-500 font-medium">
                        Last Updated
                      </Typography>
                      <Typography variant="paragraph" className="text-gray-900 font-semibold">
                        {formatDate(job.updatedAt)}
                      </Typography>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Apply Button Section */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PaperAirplaneIcon className="w-5 h-5 text-gray-600" />
                  <Typography variant="h6" className="text-gray-900 font-semibold">
                    Action
                  </Typography>
                </div>
                <Button
                  color="green"
                  fullWidth
                  className="flex items-center justify-center gap-2"
                  onClick={handleApply}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Apply Now
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;

