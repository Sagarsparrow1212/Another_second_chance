import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Input,
  Button,
  Alert,
  Textarea,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  KeyIcon,
  LockClosedIcon,
  PhotoIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL_V1, API_BASE_URL, getFileUrl } from "@/configs/api";
import LogoLoader from "@/components/LogoLoader";

const SKILLS_OPTIONS = [
  "General Labor",
  "Cleaning / Housekeeping",
  "Construction Helper",
  "Landscaping / Gardening",
  "Kitchen / Cooking Help",
  "Painting",
  "Driving / Delivery",
  "Retail Helper",
  "Warehouse Work",
  "Maintenance Helper",
  "Pet Care",
  "Other",
];




const LANGUAGES_OPTIONS = [
  "English",
  "Spanish",
  "Other",
];


export function EditHomeless() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    account: true,
    personal: true,
    skills: true,
    location: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
    fullName: "",
    age: "",
    gender: "",
    skillset: [],
    experience: "",
    location: "",
    address: "",
    contactPhone: "",
    contactEmail: "",
    bio: "",
    languages: [],
    healthConditions: "",
    organizationId: "",
    organizationCutPercentage: "",
  });

  // Organizations state
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Track if password has been changed
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  // Phone number formatting function
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');

    // Limit to 10 digits (US phone number format)
    const limitedNumber = phoneNumber.slice(0, 10);

    // Format: (555) 123-4567
    if (limitedNumber.length === 0) {
      return '';
    } else if (limitedNumber.length <= 3) {
      return `(${limitedNumber}`;
    } else if (limitedNumber.length <= 6) {
      return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
    } else {
      return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6, 10)}`;
    }
  };

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true);
      try {
        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/organizations?limit=1000`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }

        const data = await response.json();
        if (data.success) {
          setOrganizations(data.data.organizations);
        }
      } catch (err) {
        console.error('Fetch organizations error:', err);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Ensure organizationId is set when both organizations and homeless data are loaded
  useEffect(() => {
    if (organizations.length > 0 && formData.organizationId) {
      const orgIdStr = String(formData.organizationId);
      const orgExists = organizations.find(org => String(org.id) === orgIdStr);

      if (orgExists) {
        console.log('Organization found and set:', {
          orgId: orgIdStr,
          orgName: orgExists.name || orgExists.orgName
        });
      } else {
        console.warn('Organization ID not found in organizations list:', {
          formDataOrgId: formData.organizationId,
          availableOrgs: organizations.map(o => ({ id: String(o.id), name: o.name || o.orgName }))
        });
      }
    }
  }, [organizations, formData.organizationId]);

  // Fetch homeless user data
  useEffect(() => {
    const fetchHomeless = async () => {
      try {
        setFetching(true);
        setError("");

        const sessionData = localStorage.getItem('auth_session');
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/homeless/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data && data.message ? data.message : 'Failed to fetch homeless user details');
        }

        if (data.success) {
          const homeless = data.data;
          // Extract organizationId - handle both string and object formats
          let orgId = "";
          if (homeless.organizationId) {
            orgId = String(homeless.organizationId);
          } else if (homeless.organization && homeless.organization.id) {
            orgId = String(homeless.organization.id);
          }

          console.log('Homeless data loaded:', {
            organizationId: orgId,
            homelessOrgId: homeless.organizationId,
            homelessOrg: homeless.organization
          });

          setFormData({
            username: homeless.username || "",
            email: homeless.email || homeless.userEmail || homeless.contactEmail || "",
            password: homeless.hasPassword ? "••••••••" : "",
            newPassword: "",
            confirmPassword: "",
            fullName: homeless.fullName || homeless.name || "",
            age: homeless.age || "",
            gender: homeless.gender || "",
            skillset: homeless.skillset || homeless.skills || [],
            experience: homeless.experience || "",
            location: homeless.location || "",
            address: homeless.address || "",
            contactPhone: homeless.contactPhone || homeless.phone || "",
            contactEmail: homeless.contactEmail || homeless.email || "",
            bio: homeless.bio || "",
            languages: homeless.languages || [],
            healthConditions: homeless.healthConditions || "",
            organizationId: orgId,
            organizationCutPercentage: homeless.organizationCutPercentage !== undefined && homeless.organizationCutPercentage !== null ? String(homeless.organizationCutPercentage) : "",
          });
          setPasswordChanged(false);

          // Set profile picture if exists
          if (homeless.profilePicture) {
            const pictureUrl = homeless.profilePicture.startsWith('http')
              ? homeless.profilePicture
              : getFileUrl(homeless.profilePicture);
            setProfilePicture(pictureUrl);
            setProfilePicturePreview(pictureUrl);
          }
        } else {
          setError(data.message || 'Failed to fetch homeless user details');
        }
      } catch (err) {
        console.error('Fetch homeless error:', err);
        setError(err.message || 'An error occurred while fetching homeless user details');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchHomeless();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Auto-format phone number fields
    let formattedValue = value;
    if (name === 'contactPhone') {
      formattedValue = formatPhoneNumber(value);
    }

    // Validate organizationCutPercentage - only allow numbers and decimal point
    if (name === 'organizationCutPercentage') {
      // Allow empty string
      if (value === '') {
        formattedValue = '';
      } else {
        // Only allow numbers and one decimal point
        const regex = /^\d*\.?\d*$/;
        if (regex.test(value)) {
          formattedValue = value;
        } else {
          // If invalid, don't update the value
          return;
        }
      }
    }

    // Track password changes
    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordChanged(true);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : formattedValue,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleMultiSelect = (name, value) => {
    setFormData((prev) => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [name]: newValues,
      };
    });
  };

  const handleGenderChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      gender: value,
    }));
    if (errors.gender) {
      setErrors((prev) => ({
        ...prev,
        gender: "",
      }));
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(`Profile picture exceeds the 5MB size limit`);
      return;
    }

    // Validate file type - only images
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(`Profile picture must be an image (JPG, PNG, GIF, WEBP)`);
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setProfilePictureFile(file);
    setProfilePicturePreview(preview);
    setError(""); // Clear any previous errors
  };

  const handleRemoveProfilePicture = () => {
    setProfilePictureFile(null);
    // Reset preview to original profile picture if it exists
    if (profilePicture) {
      setProfilePicturePreview(profilePicture);
    } else {
      setProfilePicturePreview(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation (required)
    if (formData.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }
    // Password validation (if new password is provided)
    if (formData.newPassword) {
      console.log("New password is provided");
      if (formData.newPassword.length < 8) {

        console.log("Password must be at least 8 characters long");
        newErrors.newPassword = "Password must be at least 8 characters long";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        console.log("Passwords do not match");
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // If new password is provided, confirm password is required
    if (formData.newPassword && !formData.confirmPassword) {
      console.log("Please confirm your password");
      newErrors.confirmPassword = "Please confirm your password";
    }

    // Required fields validation
    if (!formData.organizationId || formData.organizationId.trim() === '') {
      newErrors.organizationId = "Organization is required";
    }

    // organizationCutPercentage validation (optional but must be 0-100, backend uses 0-30 default max check)
    if (formData.organizationCutPercentage && formData.organizationCutPercentage !== "") {
      const cp = parseFloat(String(formData.organizationCutPercentage));
      if (isNaN(cp) || cp < 0 || cp > 100) {
        newErrors.organizationCutPercentage = "Commission percentage must be between 0 and 100";
      }
    }

    if (!formData.fullName.trim()) {
      console.log("Full name is required");
      newErrors.fullName = "Full name is required";
    }
    if (!formData.age) {
      console.log("Age is required");
      newErrors.age = "Age is required";
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 10 || ageNum > 90) {
        console.log("Age must be between 10 and 90");
        newErrors.age = "Age must be between 10 and 90";
      }
    }
    if (!formData.gender) {
      console.log("Gender is required");
      newErrors.gender = "Gender is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('age', parseInt(formData.age));
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('skillset', JSON.stringify(formData.skillset));
      formDataToSend.append('experience', formData.experience || '');
      formDataToSend.append('location', formData.location || '');
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('contactPhone', formData.contactPhone || '');
      formDataToSend.append('contactEmail', formData.contactEmail || '');
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('languages', JSON.stringify(formData.languages));
      formDataToSend.append('healthConditions', formData.healthConditions || '');
      formDataToSend.append('email', formData.email);
      formDataToSend.append('organizationId', formData.organizationId || '');

      // Handle password update - use newPassword if provided, otherwise keep current
      if (formData.newPassword && formData.newPassword.trim() !== '') {
        formDataToSend.append('password', formData.newPassword);
      }

      // Add profile picture if a new one was selected
      if (profilePictureFile) {
        formDataToSend.append('profilePicture', profilePictureFile);
      }
      // Include organizationCutPercentage if provided
      if (formData.organizationCutPercentage !== "" && formData.organizationCutPercentage !== null && formData.organizationCutPercentage !== undefined) {
        formDataToSend.append('organizationCutPercentage', String(formData.organizationCutPercentage));
      }

      // Get token from localStorage for authentication
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const response = await fetch(`${API_BASE_URL_V1}/homeless/${id}`, {
        method: 'PUT',
        headers: {
          // Don't set Content-Type header - browser will set it with boundary for FormData
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update homeless user");
      }

      setSuccess(true);
      setError("");

      // Redirect after successful update
      setTimeout(() => {
        navigate("/dashboard/homeless");
      }, 500);
    } catch (err) {
      console.error("Update error:", err);
      if (err.message.includes("fetch")) {
        setError("Network error: Could not connect to server. Please check if the API server is running.");
      } else if (err.message.includes("CORS")) {
        setError("CORS error: Please check server configuration.");
      } else {
        setError(err.message || "An error occurred. Please try again.");
      }
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <LogoLoader message="Loading homeless user details..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FBFF] via-[#EAEFF5] to-[#F8FBFF] py-4 px-4 sm:py-6 sm:px-6 lg:py-8">
      <div className="max-w-9xl mx-auto">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="text"
            size="sm"
            className="flex items-center gap-2 normal-case text-sm font-medium text-gray-700 hover:text-gray-900 p-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-xl bg-white/40 rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          <CardBody className="p-6 md:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <Typography variant="h3" className="text-gray-800 mb-2 font-bold">
                Edit Homeless User Profile
              </Typography>
              <Typography variant="small" className="text-gray-500">
                Update the homeless user details below
              </Typography>
            </div>



            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Credentials Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("account")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      <KeyIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Account Credentials
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Main email and password for login
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.account ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.account && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="username" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        Username
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="username"
                            type="text"
                            name="username"
                            value={formData.username}
                            readOnly
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <Typography variant="small" className="text-xs text-gray-400">
                        Username (read-only)
                      </Typography>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        Email Address
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.email
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="homeless@example.com"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.email && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.email}
                        </Typography>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <LockClosedIcon className="w-4 h-4 text-gray-400" />
                        Current Password
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="password"
                            type="text"
                            name="password"
                            value={formData.password}
                            readOnly
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <Typography variant="small" className="text-xs text-gray-400">
                        Current password (read-only)
                      </Typography>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <LockClosedIcon className="w-4 h-4 text-gray-400" />
                        New Password
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.newPassword
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0 pr-10" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            {showNewPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {errors.newPassword && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.newPassword}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Minimum 8 characters
                      </Typography>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <LockClosedIcon className="w-4 h-4 text-gray-400" />
                        Confirm New Password
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.confirmPassword
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0 pr-10" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {errors.confirmPassword && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.confirmPassword}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Re-enter new password to confirm
                      </Typography>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Information Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("personal")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Personal Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Basic personal details
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.personal ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.personal && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Organization Field */}
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="organizationId" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <BuildingOffice2Icon className="w-4 h-4 text-gray-400" />
                        Organization <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.organizationId
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <select
                            key={`org-select-${formData.organizationId || 'empty'}-${organizations.length}`}
                            id="organizationId"
                            name="organizationId"
                            value={formData.organizationId || ""}
                            onChange={handleChange}
                            className="relative w-full px-3 py-2 bg-transparent text-gray-900 border-none outline-none focus:outline-none z-10 appearance-none cursor-pointer"
                            style={{ paddingRight: '2.5rem' }}
                          >
                            {loadingOrgs ? (
                              <option value="">Loading organizations...</option>
                            ) : organizations.length === 0 ? (
                              <option value="">No organizations available</option>
                            ) : (
                              <>
                                <option value="">Select an organization</option>
                                {organizations.map((org) => (
                                  <option key={String(org.id)} value={String(org.id)}>
                                    {org.name || org.orgName} {org.city && org.state ? `(${org.city}, ${org.state})` : ''}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      {errors.organizationId && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.organizationId}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Select the organization this homeless individual belongs to
                      </Typography>
                    </div>

                    {/* Profile Picture Section */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <PhotoIcon className="w-4 h-4 text-gray-400" />
                        Profile Picture
                      </label>
                      <div className="flex items-start gap-4">
                        {/* Current/Preview Profile Picture */}
                        {(profilePicturePreview || profilePicture) && (
                          <div className="relative">
                            <img
                              src={profilePicturePreview || profilePicture}
                              alt="Profile"
                              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                            />
                            {profilePictureFile && (
                              <button
                                type="button"
                                onClick={handleRemoveProfilePicture}
                                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Upload Button */}
                        <div className="flex-1">
                          <input
                            type="file"
                            id="profilePicture"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="profilePicture"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                          >
                            <PhotoIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">
                              {profilePictureFile ? "Change Picture" : profilePicture ? "Change Picture" : "Upload Picture"}
                            </span>
                          </label>
                          <Typography variant="small" className="text-xs text-gray-400 mt-2">
                            Supported formats: JPG, PNG, GIF, WEBP. Max file size: 5MB
                          </Typography>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.fullName
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="fullName"
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.fullName && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.fullName}
                        </Typography>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="organizationCutPercentage" className="block text-sm font-semibold text-gray-700">
                        Organization Cut (%)
                      </label>
                      <div className="flex items-center gap-2" style={{ maxWidth: '9rem' }}>
                        <div className="relative rounded-lg group flex-1">
                          <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.organizationCutPercentage
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                            }`} />
                          <div className="relative">
                            <Input
                              id="organizationCutPercentage"
                              type="text"
                              name="organizationCutPercentage"
                              value={formData.organizationCutPercentage}
                              onChange={handleChange}
                              placeholder="10"
                              labelProps={{ className: "hidden" }}
                              containerProps={{ className: "min-w-0" }}
                              className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">%</span>
                      </div>
                      {errors.organizationCutPercentage && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.organizationCutPercentage}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Optional: Commission percentage (0-100)
                      </Typography>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="age" className="block text-sm font-semibold text-gray-700">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.age
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="age"
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Enter age"
                            min="10"
                            max="90"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.age && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.age}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Age must be between 10 and 90
                      </Typography>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        {["Male", "Female", "Prefer not to say"].map((gender) => (
                          <label key={gender} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <input
                              type="radio"
                              name="gender"
                              value={gender}
                              checked={formData.gender === gender}
                              onChange={handleGenderChange}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <Typography variant="small" className="text-gray-700">
                              {gender}
                            </Typography>
                          </label>
                        ))}
                      </div>
                      {errors.gender && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.gender}
                        </Typography>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="bio" className="block text-sm font-semibold text-gray-700">
                        Short Bio / Description
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about your background, needs, or abilities..."
                            rows={4}
                            variant="static"
                            textareaProps={{ className: "!border-none" }}
                            className="relative w-full p-2 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none !border-none z-10"
                          />
                        </div>
                      </div>
                      <Typography variant="small" className="text-xs text-gray-400">
                        Optional: Share your story, skills, or what you need help with
                      </Typography>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills & Experience Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("skills")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                      <BriefcaseIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Skills & Experience
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Your skills and work experience
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.skills ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.skills && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Skillset
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {SKILLS_OPTIONS.map((skill) => (
                          <label key={skill} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.skillset.includes(skill)}
                              onChange={() => handleMultiSelect("skillset", skill)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <Typography variant="small" className="text-gray-700">
                              {skill}
                            </Typography>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="experience" className="block text-sm font-semibold text-gray-700">
                        Experience
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="experience"
                            type="text"
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            placeholder="e.g., 5 years in construction, or describe your experience"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      <Typography variant="small" className="text-xs text-gray-400">
                        Optional: Years of experience or description
                      </Typography>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Languages Known
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {LANGUAGES_OPTIONS.map((language) => (
                          <label key={language} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.languages.includes(language)}
                              onChange={() => handleMultiSelect("languages", language)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <Typography variant="small" className="text-gray-700">
                              {language}
                            </Typography>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="healthConditions" className="block text-sm font-semibold text-gray-700">
                        Health Conditions (Optional)
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Textarea
                            id="healthConditions"
                            name="healthConditions"
                            value={formData.healthConditions}
                            onChange={handleChange}
                            placeholder="Any health conditions or special needs..."
                            rows={3}
                            variant="static"
                            textareaProps={{ className: "!border-none" }}
                            className="relative w-full p-2 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none !border-none z-10"
                          />
                        </div>
                      </div>
                      <Typography variant="small" className="text-xs text-gray-400">
                        This information helps NGOs provide better care
                      </Typography>
                    </div>
                  </div>
                )}
              </div>

              {/* Location & Contact Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("location")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
                      <MapPinIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Location & Contact
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Location and contact information
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.location ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.location && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">


                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700">
                        Address
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="address"
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter address"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        Phone Number
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="contactPhone"
                            type="tel"
                            name="contactPhone"
                            value={formData.contactPhone}
                            onChange={handleChange}
                            placeholder="(555) 123-4567"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contactEmail" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        Email Address
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="contactEmail"
                            type="email"
                            name="contactEmail"
                            value={formData.contactEmail}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {success && (
                <Alert color="green" className="mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5" />
                    Homeless user updated successfully! Redirecting...
                  </div>
                </Alert>
              )}

              {error && (
                <Alert color="red" className="mb-6">
                  {error}
                </Alert>
              )}


              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
                <Button
                  type="button"
                  variant="outlined"
                  color="gray"
                  onClick={() => navigate(-1)}
                  className="normal-case"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="normal-case bg-gradient-to-r from-blue-600 to-indigo-600"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Homeless User"}
                </Button>
              </div>
            </form>

            {/* Success/Error Messages */}

          </CardBody>
        </Card>
      </div>
    </div>
  );
}

