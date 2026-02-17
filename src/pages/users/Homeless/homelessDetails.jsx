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
  Dialog,
  DialogBody,
  DialogHeader,
  Avatar,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  XMarkIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  InformationCircleIcon,
  PencilIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL_V1, API_BASE_URL, getFileUrl, getUploadUrl } from "@/configs/api";

export function HomelessDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [homeless, setHomeless] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(60);

  useEffect(() => {
    const fetchHomelessDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/homeless/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch homeless user details');
        }

        const data = await response.json();

        if (data.success) {
          setHomeless(data.data);
        } else {
          setError(data.message || 'Failed to fetch homeless user details');
        }
      } catch (err) {
        console.error('Fetch homeless details error:', err);
        setError(err.message || 'An error occurred while fetching homeless user details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHomelessDetails();
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

  const getStatusColor = (verified) => {
    if (verified) {
      return "green";
    }
    return "amber";
  };

  const getHomelessFileUrl = (filePath) => {
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
    return getUploadUrl('homeless', filePath);
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
          <Typography color="blue-gray">Loading homeless user details...</Typography>
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
            onClick={() => navigate(-1)} 
            className="bg-blue-600 text-white"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!homeless) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Typography color="blue-gray" className="mb-4">Homeless user not found</Typography>
          <Button 
            onClick={() => navigate(-1)} 
            className="bg-blue-600 text-white"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const statusText = homeless.verified ? 'VERIFIED' : 'PENDING';
  const profilePictureUrl = getHomelessFileUrl(homeless.profilePicture);
  const displayName = homeless.name || homeless.fullName || 'Unknown';

  // Zoom control functions
  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 25, 300)); // Max 300%
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 25, 50)); // Min 50%
  };

  const handleResetZoom = () => {
    setImageZoom(100);
  };

  const handleImageModalClose = () => {
    setImageModalOpen(false);
    setImageZoom(60); // Reset zoom when closing
  };

  const tabsData = [
    {
      label: "Basic Information",
      value: "basic",
      icon: InformationCircleIcon,
    },
    {
      label: "Skills & Experience",
      value: "skills",
      icon: BriefcaseIcon,
    },
    {
      label: "Additional Info",
      value: "additional",
      icon: MapPinIcon,
    },
    {
      label: "Documents",
      value: "documents",
      icon: DocumentTextIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto" style={{ borderColor: "transparent",  }}>
        {/* Image Modal/Popup */}
        <Dialog open={imageModalOpen} handler={handleImageModalClose} size="xl">
          <DialogHeader className="flex justify-between items-center">
            <Typography variant="h5" className="text-gray-900 font-bold">
              {displayName}
            </Typography>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  disabled={imageZoom <= 50}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom Out"
                >
                  <MagnifyingGlassMinusIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors font-medium"
                  title="Reset Zoom"
                >
                  {imageZoom}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={imageZoom >= 300}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom In"
                >
                  <MagnifyingGlassPlusIcon className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleImageModalClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </DialogHeader>
          <DialogBody className="p-0">
            {profilePictureUrl && (
              <div 
                className="flex justify-center items-center bg-gray-100 p-4 min-h-[400px] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={profilePictureUrl}
                  alt={displayName}
                  className="rounded-lg shadow-lg transition-transform duration-300"
                  style={{
                    width: `${imageZoom}%`,
                    height: 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    objectFit: 'contain',
                    cursor: imageZoom > 100 ? 'grab' : 'default',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onError={(e) => {
                    if (!e.target.src.includes('ui-avatars.com') && !e.target.src.includes('placeholder')) {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=400&background=random`;
                    }
                  }}
                  draggable={false}
                />
              </div>
            )}
          </DialogBody>
        </Dialog>

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
                <Typography variant="h5" className="text-gray-900 font-bold">
                  {displayName}
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  Homeless User Details
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-3">
              
              <Button
                size="sm"
                variant="outlined"
                className="flex items-center gap-2 normal-case"
                onClick={() => navigate(`/dashboard/homeless/${id}/edit`)}
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
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 inline-block ${
                          isActive ? "text-blue-600" : "text-gray-500"
                        }`} />
                        <span className={`${
                          isActive ? "text-blue-600" : "text-gray-600"
                        }`}>
                          <span className="hidden sm:inline">{label}</span>
                          <span className="sm:hidden">
                            {value === "basic" ? "Basic" : value === "skills" ? "Skills" : value === "additional" ? "Info" : "Docs"}
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
                {/* Profile Picture with Name - Creative Design */}
                <div className="mb-8">
                  <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-lg overflow-hidden">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full opacity-10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200 rounded-full opacity-10 blur-3xl"></div>
                    
                    <div className="relative flex flex-col sm:flex-row items-center gap-6">
                      {/* Profile Picture */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                        {profilePictureUrl ? (
                          <img
                            src={profilePictureUrl}
                            alt={displayName}
                            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300 shadow-xl border-4 border-white ring-4 ring-blue-100"
                            onClick={() => setImageModalOpen(true)}
                            onError={(e) => {
                              if (!e.target.src.includes('ui-avatars.com') && !e.target.src.includes('placeholder')) {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=160&background=random`;
                              }
                            }}
                          />
                        ) : (
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-xl border-4 border-white ring-4 ring-blue-100">
                            <UserIcon className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white shadow-lg">
                          <CheckCircleIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      {/* Name and Basic Info */}
                      <div className="flex-1 text-center sm:text-left">
                        <Typography variant="h3" className="text-gray-900 font-bold mb-2">
                          {displayName}
                        </Typography>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
                          {homeless.age && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <CalendarIcon className="w-5 h-5 text-blue-600" />
                              <span className="font-medium">{homeless.age} years old</span>
                            </div>
                          )}
                          {homeless.gender && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <UserIcon className="w-5 h-5 text-purple-600" />
                              <span className="font-medium">{homeless.gender}</span>
                            </div>
                          )}
                        </div>
                        {homeless.bio && (
                          <Typography variant="small" className="text-gray-600 mt-4 line-clamp-2">
                            {homeless.bio}
                          </Typography>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <InformationCircleIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Contact Information
                  </Typography>
                </div>
                <div className="space-y-6">
                  {/* Username, Email Address and Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {homeless.username && (
                      <div className="p-4 rounded-lg bg-gray-50">
                        <label className="block text-gray-500 text-sm mb-2 font-medium">Username</label>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <UserIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-gray-900 font-semibold text-lg">{homeless.username}</p>
                        </div>
                      </div>
                    )}
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Email Address</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        {homeless.email ? (
                          <a 
                            href={`mailto:${homeless.email}`}
                            className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold text-lg"
                          >
                            {homeless.email}
                          </a>
                        ) : (
                          <p className="text-gray-900 font-semibold text-lg">N/A</p>
                        )}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Phone Number</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <PhoneIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{homeless.contactPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Organization */}
                  {homeless.organization && (
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Organization</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <BuildingOffice2Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <button
                          onClick={() => navigate(`/dashboard/organizations/${homeless.organization.id}`)}
                          className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold text-lg hover:underline"
                        >
                          {homeless.organization.name}
                          {homeless.organization.city && homeless.organization.state && (
                            <span className="text-gray-500 font-normal ml-1">
                              ({homeless.organization.city}, {homeless.organization.state})
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Registration Date */}
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">Registration Date</label>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-gray-900 font-semibold text-lg">{formatDate(homeless.createdAt)}</p>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Verification Status</label>
                      <div className="flex items-center gap-2">
                        {homeless.verified ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-amber-500" />
                        )}
                        <p className="text-gray-900 font-semibold text-lg">{homeless.verified ? 'Verified' : 'Pending Verification'}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Account Status</label>
                      <div className="flex items-center gap-2">
                        {homeless.isActive ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-500" />
                        )}
                        <p className="text-gray-900 font-semibold text-lg">{homeless.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                    </div>
                    {homeless.updatedAt && (
                      <div className="p-4 rounded-lg bg-gray-50 sm:col-span-2">
                        <label className="block text-gray-500 text-sm mb-2 font-medium">Last Updated</label>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <ClockIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-gray-900 font-semibold text-lg">{formatDate(homeless.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabPanel>

              {/* Skills & Experience Tab */}
              <TabPanel value="skills" className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BriefcaseIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Skills & Experience
                  </Typography>
                </div>
                <div className="space-y-6">
                  {/* Skills */}
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-3 font-medium">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {homeless.skillset && homeless.skillset.length > 0 ? (
                        homeless.skillset.map((skill, idx) => (
                          <Chip
                            key={idx}
                            variant="gradient"
                            color="purple"
                            value={skill}
                            className="py-2 px-4 text-sm font-semibold"
                          />
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No skills listed</p>
                      )}
                    </div>
                  </div>
                  {/* Experience */}
                  {homeless.experience && (
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Experience</label>
                      <p className="text-gray-900 font-semibold text-lg whitespace-pre-wrap">{homeless.experience}</p>
                    </div>
                  )}
                  {/* Languages */}
                  {homeless.languages && homeless.languages.length > 0 && (
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-3 font-medium flex items-center gap-2">
                        <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                        Languages Known
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {homeless.languages.map((language, idx) => (
                          <Chip
                            key={idx}
                            variant="gradient"
                            color="blue"
                            value={language}
                            className="py-2 px-4 text-sm font-semibold"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabPanel>

              {/* Additional Information Tab */}
              <TabPanel value="additional" className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <MapPinIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Additional Information
                  </Typography>
                </div>
                <div className="space-y-6">
                  {homeless.location && (
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Location</label>
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-indigo-600" />
                        <p className="text-gray-900 font-semibold text-lg">{homeless.location}</p>
                      </div>
                    </div>
                  )}
                  {homeless.address && (
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Address</label>
                      <p className="text-gray-900 font-semibold text-lg">{homeless.address}</p>
                    </div>
                  )}
                  {homeless.bio && (
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Bio / Description</label>
                      <p className="text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">{homeless.bio}</p>
                    </div>
                  )}
                  {homeless.healthConditions && (
                    <div className="p-4 rounded-lg bg-red-50/30">
                      <label className="block text-gray-500 text-sm mb-2 font-medium flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-red-600" />
                        Health Conditions
                      </label>
                      <p className="text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">{homeless.healthConditions}</p>
                    </div>
                  )}
                  {!homeless.location && !homeless.address && !homeless.bio && !homeless.healthConditions && (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <MapPinIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <Typography color="blue-gray" className="text-lg">
                        No additional information available
                      </Typography>
                    </div>
                  )}
                </div>
              </TabPanel>

              {/* Documents Tab */}
              <TabPanel value="documents" className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Documents
                  </Typography>
                </div>
                {(homeless.profilePicture || homeless.verificationDocument) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {homeless.profilePicture && (
                      <div className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <UserIcon className="w-5 h-5 text-gray-600" />
                          <Typography variant="h6" className="text-gray-900 font-semibold text-sm">
                            Profile Picture
                          </Typography>
                        </div>
                        <a
                          href={getHomelessFileUrl(homeless.profilePicture)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium underline inline-flex items-center gap-1"
                        >
                          View Image
                        </a>
                      </div>
                    )}
                    {homeless.verificationDocument && (
                      <div className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                          <Typography variant="h6" className="text-gray-900 font-semibold text-sm">
                            Verification Document
                          </Typography>
                        </div>
                        <a
                          href={getHomelessFileUrl(homeless.verificationDocument)}
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
            </TabsBody>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default HomelessDetails;
