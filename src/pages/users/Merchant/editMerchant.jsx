import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Input,
  Button,
  Alert,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  ChevronDownIcon,
  KeyIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL_V1, API_BASE_URL } from "@/configs/api";

export function EditMerchant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    account: true,
    business: true,
    address: true,
    contact: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
    businessName: "",
    phoneNumber: "",
    businessType: "",
    streetAddress: "",
    city: "",
    state: "",
    contactPersonName: "",
    contactDesignation: "",
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Track if password has been changed
  const [passwordChanged, setPasswordChanged] = useState(false);

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

  // Fetch merchant data
  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        setFetching(true);
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
          const merchant = data.data;
          setFormData({
            email: merchant.email || merchant.userEmail || merchant.businessEmail || "",
            password: merchant.hasPassword ? "••••••••" : "",
            newPassword: "",
            confirmPassword: "",
            businessName: merchant.businessName || "",
            phoneNumber: merchant.phoneNumber || "",
            businessType: merchant.businessType || "",
            streetAddress: merchant.streetAddress || "",
            city: merchant.city || "",
            state: merchant.state || "",
            contactPersonName: merchant.contactPersonName || "",
            contactDesignation: merchant.contactDesignation || "",
          });
          setPasswordChanged(false);
        } else {
          setError(data.message || 'Failed to fetch merchant details');
        }
      } catch (err) {
        console.error('Fetch merchant error:', err);
        setError(err.message || 'An error occurred while fetching merchant details');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchMerchant();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-format phone number fields
    let formattedValue = value;
    if (name === 'phoneNumber') {
      formattedValue = formatPhoneNumber(value);
    }

    // Track password changes
    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordChanged(true);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSelectChange = (value, fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation (required)
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation (if new password is provided)
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters long";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // If new password is provided, confirm password is required
    if (formData.newPassword && !formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    }

    // Required fields validation
    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else {
      // Remove formatting to check digits only
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      // Should have exactly 10 digits
      if (phoneDigits.length < 10) {
        newErrors.phoneNumber = "Phone number must have 10 digits";
      } else if (phoneDigits.length > 10) {
        newErrors.phoneNumber = "Phone number must have exactly 10 digits";
      }
    }
    if (!formData.businessType) {
      newErrors.businessType = "Business type is required";
    }
    if (!formData.streetAddress.trim()) {
      newErrors.streetAddress = "Street address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
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
      // Get token from localStorage
      const sessionData = localStorage.getItem('auth_session');
      const token = sessionData ? JSON.parse(sessionData).token : null;

      // Prepare data for submission
      const submitData = {
        ...formData,
      };

      // Handle password update - use newPassword if provided, otherwise keep current
      if (submitData.newPassword && submitData.newPassword.trim() !== '') {
        submitData.password = submitData.newPassword; // Set password to new password
      } else {
        delete submitData.password; // Don't update password if new password not provided
      }

      // Remove password-related fields that shouldn't be sent to backend
      delete submitData.newPassword;
      delete submitData.confirmPassword;

      const response = await fetch(`${API_BASE_URL_V1}/merchants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update merchant");
      }

      setSuccess(true);
      setError("");

      // Redirect after successful update
      setTimeout(() => {
        navigate("/dashboard/merchants");
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FBFF] via-[#EAEFF5] to-[#F8FBFF] py-4 px-4 sm:py-6 sm:px-6 lg:py-8">
        <div className="max-w-9xl mx-auto">
          <div className="text-center py-12">
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
            <Typography color="blue-gray" className="mt-4">Loading merchant details...</Typography>
          </div>
        </div>
      </div>
    );
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
            onClick={() => navigate("/dashboard/merchants")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Merchants</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-xl bg-white/40 rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          <CardBody className="p-6 md:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <Typography variant="h3" className="text-gray-800 mb-2 font-bold">
                Edit Merchant Profile
              </Typography>
              <Typography variant="small" className="text-gray-500">
                Update the merchant details below
              </Typography>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <Alert color="green" className="mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  Merchant updated successfully! Redirecting...
                </div>
              </Alert>
            )}

            {error && (
              <Alert color="red" className="mb-6">
                {error}
              </Alert>
            )}

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
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        Email Address <span className="text-red-500">*</span>
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
                            placeholder="merchant@example.com"
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
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
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
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
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

              {/* Business Information Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("business")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <BuildingStorefrontIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Business Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Basic details of the business
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.business ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.business && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="businessName" className="block text-sm font-semibold text-gray-700">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.businessName
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="businessName"
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            placeholder="Enter business name"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.businessName && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.businessName}
                        </Typography>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.phoneNumber
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="phoneNumber"
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="(555) 123-4567"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.phoneNumber && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.phoneNumber}
                        </Typography>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="businessType" className="block text-sm font-semibold text-gray-700">
                        Business Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.businessType
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative z-10">
                          <Select
                            value={formData.businessType}
                            onChange={(value) => handleSelectChange(value, 'businessType')}
                            labelProps={{ className: "hidden" }}
                            className="bg-transparent"
                          >
                            <Option value="">Select business type</Option>
                            <Option value="Shop">Shop</Option>
                            <Option value="Vendor">Vendor</Option>
                            <Option value="Restaurant">Restaurant</Option>
                            <Option value="Other">Other</Option>
                          </Select>
                        </div>
                      </div>
                      {errors.businessType && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.businessType}
                        </Typography>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Address Information Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("address")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                      <MapPinIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Address Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Business location details
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.address ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.address && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="streetAddress" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.streetAddress
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="streetAddress"
                            type="text"
                            name="streetAddress"
                            value={formData.streetAddress}
                            onChange={handleChange}
                            placeholder="Enter street address"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.streetAddress && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.streetAddress}
                        </Typography>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="city" className="block text-sm font-semibold text-gray-700">
                        City <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.city
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="city"
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Enter city"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.city && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.city}
                        </Typography>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="state" className="block text-sm font-semibold text-gray-700">
                        State <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.state
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="state"
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="Enter state"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.state && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.state}
                        </Typography>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("contact")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Contact Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Contact person details
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.contact ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.contact && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="contactPersonName" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        Contact Person Name
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="contactPersonName"
                            type="text"
                            name="contactPersonName"
                            value={formData.contactPersonName}
                            onChange={handleChange}
                            placeholder="Enter contact person name"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contactDesignation" className="block text-sm font-semibold text-gray-700">
                        Contact Designation
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="contactDesignation"
                            type="text"
                            name="contactDesignation"
                            value={formData.contactDesignation}
                            onChange={handleChange}
                            placeholder="Enter designation"
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

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
                <Button
                  type="button"
                  variant="outlined"
                  color="gray"
                  onClick={() => navigate("/dashboard/merchants")}
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
                  {loading ? "Updating..." : "Update Merchant"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

