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
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  GiftIcon,
  InformationCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL_V1 } from "@/configs/api";

export function DonorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    const fetchDonorDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Get token from localStorage
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/donors/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          // Try to get error message from response
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            throw new Error('Unauthorized. Please log in again.');
          } else if (response.status === 404) {
            throw new Error('Donor not found.');
          } else {
            throw new Error(errorData.message || `Failed to fetch donor details (${response.status})`);
          }
        }

        const data = await response.json();

        if (data.success) {
          setDonor(data.data);
        } else {
          setError(data.message || 'Failed to fetch donor details');
        }
      } catch (err) {
        console.error('Fetch donor details error:', err);
        setError(err.message || 'An error occurred while fetching donor details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDonorDetails();
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
          <Typography color="blue-gray">Loading donor details...</Typography>
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
            onClick={() => navigate("/dashboard/donors")} 
            className="bg-blue-600 text-white"
          >
            Back to Donors
          </Button>
        </div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Typography color="blue-gray" className="mb-4">Donor not found</Typography>
          <Button 
            onClick={() => navigate("/dashboard/donors")} 
            className="bg-blue-600 text-white"
          >
            Back to Donors
          </Button>
        </div>
      </div>
    );
  }

  const statusText = donor.verified ? 'VERIFIED' : 'PENDING';

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
      label: "Account Status",
      value: "status",
      icon: ClockIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto" style={{ borderColor: "transparent"}}>
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-md p-3 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard/donors")}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Back</span>
              </button>
              <div className="w-px h-8 bg-gray-300" />
              <div>
                <Typography variant="h5" className="text-gray-900 font-bold">
                  {donor.name || donor.fullName}
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  Donor Details
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-3">
             
              <Button
                size="sm"
                variant="outlined"
                className="flex items-center gap-2 normal-case"
                onClick={() => navigate(`/dashboard/donors/${id}/edit`)}
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
                            {value === "basic" ? "Basic" : value === "address" ? "Address" : "Status"}
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
                  {/* Gender and Preferred Donation Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Gender</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{donor.gender || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Preferred Donation Type</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <GiftIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{donor.preferredDonationType || 'Not specified'}</p>
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
                          href={`mailto:${donor.email}`}
                          className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold text-lg"
                        >
                          {donor.email || 'N/A'}
                        </a>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Phone Number</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <PhoneIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{donor.phone || 'N/A'}</p>
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
                      <p className="text-gray-900 font-semibold text-lg">{formatDate(donor.createdAt)}</p>
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
                {donor.address ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gray-50 sm:col-span-2">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Address</label>
                      <p className="text-gray-900 font-semibold text-lg">{donor.address}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <MapPinIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <Typography color="blue-gray" className="text-lg">
                      No address provided
                    </Typography>
                  </div>
                )}
              </TabPanel>

              {/* Account Status Tab */}
              <TabPanel value="status" className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <Typography variant="h5" className="text-gray-900 font-bold">
                    Account Status
                  </Typography>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">Verification Status</label>
                    <div className="flex items-center gap-2">
                      {donor.verified ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-amber-500" />
                      )}
                      <p className="text-gray-900 font-semibold text-lg">{donor.verified ? 'Verified' : 'Pending Verification'}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-gray-500 text-sm mb-2 font-medium">Account Status</label>
                    <div className="flex items-center gap-2">
                      {donor.isActive ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )}
                      <p className="text-gray-900 font-semibold text-lg">{donor.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  {donor.updatedAt && (
                    <div className="p-4 rounded-lg bg-gray-50 sm:col-span-2">
                      <label className="block text-gray-500 text-sm mb-2 font-medium">Last Updated</label>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <ClockIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">{formatDate(donor.updatedAt)}</p>
                      </div>
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

export default DonorDetails;
