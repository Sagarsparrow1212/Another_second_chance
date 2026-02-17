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
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  BuildingOffice2Icon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  PencilIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  InformationCircleIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  PhotoIcon,
  MagnifyingGlassPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL_V1, API_BASE_URL, getFileUrl, getUploadUrl } from "@/configs/api";
import { Avatar, Card, CardBody } from "@material-tailwind/react";

export function OrganizationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [homelessPeople, setHomelessPeople] = useState([]);
  const [loadingHomeless, setLoadingHomeless] = useState(false);

  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/organizations/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch organization details');
        }

        const data = await response.json();

        if (data.success) {
          setOrganization(data.data);
        } else {
          setError(data.message || 'Failed to fetch organization details');
        }
      } catch (err) {
        console.error('Fetch organization details error:', err);
        setError(err.message || 'An error occurred while fetching organization details');
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
      if (activeTab !== 'homeless' || !id) return;

      try {
        setLoadingHomeless(true);

        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/homeless/organization/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch homeless people');
        }

        const data = await response.json();

        if (data.success) {
          setHomelessPeople(data.data.homeless || []);
        } else {
          setHomelessPeople([]);
        }
      } catch (err) {
        console.error('Fetch homeless people error:', err);
        setHomelessPeople([]);
      } finally {
        setLoadingHomeless(false);
      }
    };

    fetchHomelessPeople();
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

  const getStatusColor = (status) => {
    const statusUpper = (status || '').toUpperCase();
    switch (statusUpper) {
      case "APPROVED":
        return "green";
      case "REJECTED":
        return "red";
      case "PENDING":
        return "amber";
      case "RESUBMITTED":
        return "blue";
      default:
        return "gray";
    }
  };

  const getTimelineMarkerColor = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('approved')) {
      return "bg-green-500";
    } else if (typeLower.includes('rejected')) {
      return "bg-red-500";
    } else if (typeLower.includes('resubmitted')) {
      return "bg-blue-500";
    } else if (typeLower.includes('initial submission') || typeLower.includes('first submit')) {
      return "bg-purple-500";
    }
    return "bg-gray-500";
  };

  const getTimelineBadgeColor = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('approved')) {
      return "bg-green-500 text-white";
    } else if (typeLower.includes('rejected')) {
      return "bg-red-500 text-white";
    } else if (typeLower.includes('resubmitted')) {
      return "bg-blue-500 text-white";
    } else if (typeLower.includes('initial submission') || typeLower.includes('first submit')) {
      return "bg-purple-500 text-white";
    }
    return "bg-gray-500 text-white";
  };

  const getActivityTitle = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('approved')) {
      return 'Approved';
    } else if (typeLower.includes('rejected')) {
      return 'Rejected';
    } else if (typeLower.includes('resubmitted')) {
      return 'Resubmitted';
    } else if (typeLower.includes('initial submission') || typeLower.includes('first submit')) {
      return 'Initial Submission';
    }
    return type;
  };

  const getActivityChipText = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('approved')) {
      return 'APPROVED';
    } else if (typeLower.includes('rejected')) {
      return 'REJECTED';
    } else if (typeLower.includes('resubmitted')) {
      return 'RESUBMITTED';
    } else if (typeLower.includes('initial submission') || typeLower.includes('first submit')) {
      return 'INITIAL SUBMISSION';
    }
    return type.toUpperCase();
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
          <Typography color="blue-gray">Loading organization details...</Typography>
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
            onClick={() => navigate("/dashboard/organizations")}
            className="bg-blue-600 text-white"
          >
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Typography color="blue-gray" className="mb-4">Organization not found</Typography>
          <Button
            onClick={() => navigate("/dashboard/organizations")}
            className="bg-blue-600 text-white"
          >
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  const currentStatus = organization.resubmitted
    ? 'RESUBMITTED'
    : (organization.currentStatus || 'PENDING').toUpperCase();
  const tabsData = [
    {
      label: "Profile",
      value: "basic",
      icon: InformationCircleIcon,
    },
    {
      label: "Address",
      value: "address",
      icon: MapPinIcon,
    },
    {
      label: "Media",
      value: "media",
      icon: PhotoIcon,
    },
    {
      label: "Homeless People",
      value: "homeless",
      icon: UsersIcon,
    },
    {
      label: "Activity",
      value: "timeline",
      icon: ClockIcon,
    },
  ];


  const getOrganizationFileUrl = (filePath) => {
    if (!filePath) return null;
    // If it's already a full URL, return it
    if (filePath.startsWith('http')) {
      return filePath;
    }
    // If it starts with /uploads, use it directly
    if (filePath.startsWith('/uploads')) {
      return getFileUrl(filePath);
    }
    // Otherwise, construct the URL
    return getUploadUrl('organizations', filePath);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto" style={{ borderColor: "transparent" }}>
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
                  {organization.name}
                </Typography>
                <Typography variant="small" className="text-gray-500 mt-1">
                  Organization Details
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Chip
                value={currentStatus}
                color={getStatusColor(currentStatus)}
                className="font-semibold"
              />
              <Button
                size="sm"
                variant="outlined"
                className="flex items-center gap-2 normal-case"
                onClick={() => navigate(`/dashboard/homeless/register/${id}`)}
              >
                <UserIcon className="w-4 h-4" />
                Add Homeless
              </Button>
              <Button
                size="sm"
                variant="outlined"
                className="flex items-center gap-2 normal-case"
                onClick={() => navigate(`/dashboard/organizations/${id}/edit`)}
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
            <div className="overflow-x-auto">
              <TabsHeader
                className="rounded-none border-b border-blue-gray-100 bg-gray-50/50 px-2 sm:px-4 md:px-6 pt-4 pb-0 w-full min-w-max"
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
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 inline-block ${isActive ? "text-blue-600" : "text-gray-500"
                          }`} />
                        <span className={`${isActive ? "text-blue-600" : "text-gray-600"
                          }`}>
                          <span className="hidden sm:inline">{label}</span>
                          <span className="sm:hidden">
                            {value === "basic" ? "Basic" : value === "address" ? "Address" : value === "media" ? "Media" : value === "homeless" ? "People" : "Timeline"}
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
                  {/* Organization Type and Contact Person */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Organization Type</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <BuildingOffice2Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{organization.orgType || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Contact Person</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{organization.contactPerson || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Email Address and Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Email Address</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <a
                          href={`mailto:${organization.email}`}
                          className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold text-lg"
                        >
                          {organization.email || 'N/A'}
                        </a>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Phone Number</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <PhoneIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{organization.contactPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Emergency Contact Email</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{organization.emergencyContactEmail || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Registration Date</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <CalendarIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{formatDate(organization.createdAt)}</p>
                      </div>
                    </div>
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
                    <p className="text-gray-900 font-semibold text-lg">{organization.streetAddress || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">City</label>
                    <p className="text-gray-900 font-semibold text-lg">{organization.city || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">State</label>
                    <p className="text-gray-900 font-semibold text-lg">{organization.state || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">Zip Code</label>
                    <p className="text-gray-900 font-semibold text-lg">{organization.zipCode || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">Country</label>
                    <p className="text-gray-900 font-semibold text-lg">{organization.country || 'N/A'}</p>
                  </div>
                </div>
              </TabPanel>

              {/* Media Tab - Photos and Documents Combined */}
              <TabPanel value="media" className="p-0">
                {/* Photos Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <PhotoIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <Typography variant="h5" className="text-gray-900 font-bold">
                      Organization Photos
                    </Typography>
                  </div>
                  {organization.photos && organization.photos.length > 0 ? (
                    (() => {
                      // Use photos array directly
                      const imageDocs = organization.photos.map((photo) => ({
                        docName: photo.photoName || 'Organization Photo',
                        docUrl: photo.photoUrl,
                      }));

                      return imageDocs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {imageDocs.map((photo, index) => {
                            const photoUrl = getOrganizationFileUrl(photo.docUrl);
                            return (
                              <div
                                key={index}
                                className="group relative bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all overflow-hidden"
                              >
                                <div className="aspect-square overflow-hidden bg-gray-100">
                                  <img
                                    src={photoUrl}
                                    alt={photo.docName || `Organization Photo ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      const errorDiv = e.target.parentElement.querySelector('.error-placeholder');
                                      if (errorDiv) errorDiv.style.display = 'flex';
                                    }}
                                  />
                                  <div className="error-placeholder hidden w-full h-full items-center justify-center bg-gray-100 absolute inset-0">
                                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                                  </div>
                                </div>
                                <div className="p-4">
                                  <Typography variant="h6" className="text-gray-900 font-semibold mb-2 text-sm">
                                    {photo.docName || `Photo ${index + 1}`}
                                  </Typography>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={photoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                                      title="View Full Size"
                                    >
                                      <MagnifyingGlassPlusIcon className="w-4 h-4" />
                                      View Full Size
                                    </a>
                                    <span className="text-gray-300">|</span>
                                    <a
                                      href={photoUrl}
                                      download
                                      className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors"
                                      title="Download Photo"
                                    >
                                      <ArrowDownTrayIcon className="w-4 h-4" />
                                      Download
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <PhotoIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <Typography color="blue-gray" className="text-lg mb-2">
                            No photos uploaded
                          </Typography>
                          <Typography variant="small" color="gray" className="text-sm">
                            This organization has not submitted any verification photos yet.
                          </Typography>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <Typography color="blue-gray" className="text-lg mb-2">
                        No photos uploaded
                      </Typography>
                      <Typography variant="small" color="gray" className="text-sm">
                        This organization has not submitted any verification photos yet.
                      </Typography>
                    </div>
                  )}
                </div>

                {/* Documents Section */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <PaperClipIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <Typography variant="h5" className="text-gray-900 font-bold">
                      Verification Documents
                    </Typography>
                  </div>
                  {organization.documents && organization.documents.length > 0 ? (
                    <div className="space-y-4">
                      {organization.documents.map((doc, index) => {
                        const docUrl = getOrganizationFileUrl(doc.docUrl);
                        const isImage = docUrl && (docUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || docUrl.includes('image'));
                        const isPdf = docUrl && docUrl.match(/\.pdf$/i);

                        return (
                          <div
                            key={index}
                            className="p-6 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="p-3 bg-indigo-100 rounded-lg">
                                  {isImage ? (
                                    <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                                  ) : isPdf ? (
                                    <DocumentTextIcon className="w-6 h-6 text-red-600" />
                                  ) : (
                                    <PaperClipIcon className="w-6 h-6 text-indigo-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <Typography variant="h6" className="text-gray-900 font-semibold mb-1">
                                    {doc.docName || `Document ${index + 1}`}
                                  </Typography>
                                  {docUrl && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <span className="truncate max-w-md">{docUrl}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {docUrl && (
                                  <>
                                    <a
                                      href={docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                      title="View Document"
                                    >
                                      <EyeIcon className="w-5 h-5" />
                                    </a>
                                    <a
                                      href={docUrl}
                                      download
                                      className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                      title="Download Document"
                                    >
                                      <ArrowDownTrayIcon className="w-5 h-5" />
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                            {docUrl && isImage && (
                              <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={docUrl}
                                  alt={doc.docName || `Document ${index + 1}`}
                                  className="w-full h-auto max-h-96 object-contain bg-gray-50"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <PaperClipIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <Typography color="blue-gray" className="text-lg mb-2">
                        No documents uploaded
                      </Typography>
                      <Typography variant="small" color="gray" className="text-sm">
                        This organization has not submitted any verification documents yet.
                      </Typography>
                    </div>
                  )}
                </div>
              </TabPanel>

              {/* Homeless People Tab */}
              <TabPanel value="homeless" className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <UsersIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Homeless People
                  </Typography>
                  <Typography variant="small" className="text-gray-500">
                    ({homelessPeople.length} {homelessPeople.length === 1 ? 'person' : 'people'})
                  </Typography>
                </div>
                {loadingHomeless ? (
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
                    <Typography color="blue-gray" className="mt-4">Loading homeless people...</Typography>
                  </div>
                ) : homelessPeople.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <UsersIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <Typography color="blue-gray" className="text-lg mb-2">
                      No homeless people found
                    </Typography>
                    <Typography variant="small" color="gray" className="text-sm mb-4">
                      This organization has not registered any homeless people yet.
                    </Typography>
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        variant="gradient"
                        className="normal-case flex items-center justify-center gap-2"
                        onClick={() => navigate(`/dashboard/homeless/register/${id}`)}
                      >
                        <UserIcon className="w-4 h-4" />
                        Add Homeless Person
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card className="border border-blue-gray-200 shadow-sm">
                    <CardBody className="px-0 pt-0 pb-2">
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[640px] table-auto cursor-pointer-table">
                          <thead>
                            <tr>
                              {["Name", "Username", "Phone", "Age", "Gender", "Created"].map((el) => (
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
                            {homelessPeople.map((person, key) => {
                              const className = `py-3 px-5 ${key === homelessPeople.length - 1
                                  ? ""
                                  : "border-b border-blue-gray-200"
                                }`;
                              const getHomelessFileUrl = (filePath) => {
                                if (!filePath) return null;
                                if (filePath.startsWith('http')) return filePath;
                                if (filePath.startsWith('/uploads')) {
                                  return `${API_BASE_URL}${filePath}`;
                                }
                                return `${API_BASE_URL}/uploads/homeless/${filePath}`;
                              };

                              return (
                                <tr
                                  key={person.id || key}
                                  onClick={() => navigate(`/dashboard/homeless/${person.id}`)}
                                  className="cursor-pointer hover:bg-blue-gray-50 transition-colors"
                                >
                                  <td className={className}>
                                    <div className="flex items-center gap-4">
                                      <Avatar
                                        src={person.profilePicture ? getHomelessFileUrl(person.profilePicture) : `https://ui-avatars.com/api/?name=${person.name || person.fullName}&background=random`}
                                        alt={person.name || person.fullName}
                                        size="sm"
                                        variant="rounded"
                                        onError={(e) => {
                                          e.target.src = `https://ui-avatars.com/api/?name=${person.name || person.fullName}&background=random`;
                                        }}
                                      />
                                      <Typography
                                        variant="small"
                                        color="blue-gray"
                                        className="text-sm font-semibold"
                                      >
                                        {person.name || person.fullName}
                                      </Typography>
                                    </div>
                                  </td>
                                  <td className={className}>
                                    <Typography className="text-sm font-normal text-blue-gray-500">
                                      {person.username || 'N/A'}
                                    </Typography>
                                  </td>
                                  <td className={className}>
                                    <Typography className="text-sm font-semibold text-blue-gray-600">
                                      {person.phone || person.contactPhone || "N/A"}
                                    </Typography>
                                  </td>
                                  <td className={className}>
                                    <Typography className="text-sm font-semibold text-blue-gray-600">
                                      {person.age || "N/A"}
                                    </Typography>
                                  </td>
                                  <td className={className}>
                                    <Typography className="text-sm font-semibold text-blue-gray-600">
                                      {person.gender || "N/A"}
                                    </Typography>
                                  </td>
                                  <td className={className}>
                                    <Typography className="text-sm font-semibold text-blue-gray-600">
                                      {person.createdAt ? formatDate(person.createdAt) : "N/A"}
                                    </Typography>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3 p-4">
                        {homelessPeople.map((person, key) => {
                          const getHomelessFileUrl = (filePath) => {
                            if (!filePath) return null;
                            if (filePath.startsWith('http')) return filePath;
                            if (filePath.startsWith('/uploads')) {
                              return `${API_BASE_URL}${filePath}`;
                            }
                            return `${API_BASE_URL}/uploads/homeless/${filePath}`;
                          };

                          return (
                            <div
                              key={person.id || key}
                              onClick={() => navigate(`/dashboard/homeless/${person.id}`)}
                              className="bg-white rounded-lg border border-blue-gray-100 shadow-sm overflow-hidden cursor-pointer hover:bg-blue-gray-50 transition-colors"
                            >
                              <div className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                  <Avatar
                                    src={person.profilePicture ? getHomelessFileUrl(person.profilePicture) : `https://ui-avatars.com/api/?name=${person.name || person.fullName}&background=random`}
                                    alt={person.name || person.fullName}
                                    size="sm"
                                    variant="rounded"
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${person.name || person.fullName}&background=random`;
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <Typography
                                      variant="small"
                                      color="blue-gray"
                                      className="text-sm font-semibold"
                                    >
                                      {person.name || person.fullName}
                                    </Typography>
                                    <Typography className="text-xs text-gray-500">
                                      {person.username || 'N/A'}
                                    </Typography>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <Typography variant="small" className="text-xs text-gray-500 mb-1">
                                      Phone
                                    </Typography>
                                    <Typography className="text-sm font-semibold text-blue-gray-900">
                                      {person.phone || person.contactPhone || "N/A"}
                                    </Typography>
                                  </div>
                                  <div>
                                    <Typography variant="small" className="text-xs text-gray-500 mb-1">
                                      Age
                                    </Typography>
                                    <Typography className="text-sm font-semibold text-blue-gray-900">
                                      {person.age || "N/A"}
                                    </Typography>
                                  </div>
                                  <div>
                                    <Typography variant="small" className="text-xs text-gray-500 mb-1">
                                      Gender
                                    </Typography>
                                    <Typography className="text-sm font-semibold text-blue-gray-900">
                                      {person.gender || "N/A"}
                                    </Typography>
                                  </div>
                                  <div>
                                    <Typography variant="small" className="text-xs text-gray-500 mb-1">
                                      Created
                                    </Typography>
                                    <Typography className="text-sm font-semibold text-blue-gray-900">
                                      {person.createdAt ? formatDate(person.createdAt) : "N/A"}
                                    </Typography>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </TabPanel>

              {/* Activity Timeline Tab */}
              <TabPanel value="timeline" className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Activity Timeline
                  </Typography>
                </div>
                <div className="relative">
                  {organization.activities && organization.activities.length > 0 ? (
                    <div className="space-y-8">
                      {organization.activities.map((activity, index) => (
                        <div key={index} className="relative flex gap-6">
                          {/* Vertical Timeline Line */}
                          {index !== organization.activities.length - 1 && (
                            <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-300" />
                          )}

                          {/* Timeline Marker */}
                          <div className="flex-shrink-0 relative z-10">
                            <div className={`w-10 h-10 rounded-full ${getTimelineMarkerColor(activity.type)} flex items-center justify-center`}>
                              {activity.type.toLowerCase().includes('approved') && (
                                <CheckCircleIcon className="w-6 h-6 text-white" />
                              )}
                              {activity.type.toLowerCase().includes('rejected') && (
                                <XCircleIcon className="w-6 h-6 text-white" />
                              )}
                              {activity.type.toLowerCase().includes('resubmitted') && (
                                <ArrowPathIcon className="w-6 h-6 text-white" />
                              )}
                              {(activity.type.toLowerCase().includes('initial submission') || activity.type.toLowerCase().includes('first submit')) && (
                                <ArrowUpTrayIcon className="w-6 h-6 text-white" />
                              )}
                            </div>
                          </div>

                          {/* Timeline Content */}
                          <div className="flex-1 pb-4">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                              <div className="flex items-center gap-3 mb-3">
                                <Typography variant="h6" className="text-gray-900 font-semibold">
                                  {getActivityTitle(activity.type)}
                                </Typography>
                                <span className={`${getTimelineBadgeColor(activity.type)} text-xs px-3 py-1 rounded-full font-semibold`}>
                                  {getActivityChipText(activity.type)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                                <ClockIcon className="w-3.5 h-3.5" />
                                <p>{formatDate(activity.date)}</p>
                              </div>
                              <p className="text-gray-700 mb-2 font-medium">{activity.description}</p>
                              {activity.rejectedBy && (
                                <p className="text-gray-600 text-sm mb-2 bg-gray-100 px-3 py-1.5 rounded-lg inline-block">
                                  Rejected by: {activity.rejectedBy}
                                </p>
                              )}
                              {activity.requestId && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-gray-500 text-xs">
                                    Request ID: <span className="text-gray-700 font-medium">{activity.requestId}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <ClockIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <Typography color="blue-gray" className="text-lg">
                        No activity recorded yet
                      </Typography>
                    </div>
                  )}
                </div>
              </TabPanel>
            </TabsBody>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default OrganizationDetails;
