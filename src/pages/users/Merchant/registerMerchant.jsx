import { useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Input,
  Button,
  Alert,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  MapPinIcon,
  UserIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL_V1, API_BASE_URL } from "@/configs/api";

export function RegisterMerchant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    business: true,
    contact: true,
    documents: true,
    terms: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Form state
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    businessType: "",
    address: "",
    city: "",
    state: "",
    contactPersonName: "",
    contactPersonDesignation: "",
    agreeToTerms: false,
  });

  const [documents, setDocuments] = useState({
    gstCertificate: null,
    businessLicense: null,
    photoId: null,
  });

  const [documentPreviews, setDocumentPreviews] = useState({
    gstCertificate: null,
    businessLicense: null,
    photoId: null,
  });

  // Validation errors
  const [errors, setErrors] = useState({});

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Auto-format phone number fields
    let formattedValue = value;
    if (name === 'phoneNumber') {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : formattedValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      setDocuments((prev) => ({
        ...prev,
        [documentType]: file,
      }));

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreviews((prev) => ({
            ...prev,
            [documentType]: reader.result,
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreviews((prev) => ({
          ...prev,
          [documentType]: file.name,
        }));
      }
    }
  };

  const removeDocument = (documentType) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: null,
    }));
    setDocumentPreviews((prev) => ({
      ...prev,
      [documentType]: null,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.businessEmail.trim()) {
      newErrors.businessEmail = "Business email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
      newErrors.businessEmail = "Please enter a valid email address";
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

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.businessType) {
      newErrors.businessType = "Business type is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.contactPersonName.trim()) {
      newErrors.contactPersonName = "Contact person name is required";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the Terms & Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("businessName", formData.businessName);
      formDataToSend.append("businessEmail", formData.businessEmail);
      formDataToSend.append("phoneNumber", formData.phoneNumber);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("businessType", formData.businessType);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("contactPersonName", formData.contactPersonName);
      if (formData.contactPersonDesignation) {
        formDataToSend.append("contactPersonDesignation", formData.contactPersonDesignation);
      }
      if (documents.gstCertificate) {
        formDataToSend.append("gstCertificate", documents.gstCertificate);
      }
      if (documents.businessLicense) {
        formDataToSend.append("businessLicense", documents.businessLicense);
      }
      if (documents.photoId) {
        formDataToSend.append("photoId", documents.photoId);
      }

      const response = await fetch(`${API_BASE_URL_V1}/merchants/register`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        let errorMessage = "Failed to register merchant";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to register merchant");
      }

      setSuccess(true);
      setError("");

      setTimeout(() => {
        navigate("/dashboard/merchants");
      }, 500);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred. Please try again.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

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
                Register Merchant
              </Typography>
              <Typography variant="small" className="text-gray-500">
                Fill in the details below to register your business
              </Typography>
            </div>


            <form onSubmit={handleSubmit} className="space-y-6">
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
                        Basic details of your business
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




                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="businessEmail" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        Business Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.businessEmail
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="businessEmail"
                            type="email"
                            name="businessEmail"
                            value={formData.businessEmail}
                            onChange={handleChange}
                            placeholder="business@example.com"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.businessEmail && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.businessEmail}
                        </Typography>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
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
                      <Typography variant="small" className="text-xs text-gray-400">
                        Enter 10-digit phone number
                      </Typography>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="businessType" className="block text-sm font-semibold text-gray-700">
                        Business Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.businessType
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <select
                            id="businessType"
                            name="businessType"
                            value={formData.businessType}
                            onChange={handleChange}
                            className="w-full h-11 px-3 py-2.5 text-sm font-normal text-gray-900 bg-transparent focus:outline-none appearance-none cursor-pointer relative z-10"
                          >
                            <option value="">Select Business Type</option>
                            <option value="Shop">Shop</option>
                            <option value="Vendor">Vendor</option>
                            <option value="Restaurant">Restaurant</option>
                            <option value="Other">Other</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-20">
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      {errors.businessType && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.businessType}
                        </Typography>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <LockClosedIcon className="w-4 h-4 text-gray-400" />
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.password
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {errors.password && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.password}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Must be at least 8 characters long
                      </Typography>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <LockClosedIcon className="w-4 h-4 text-gray-400" />
                        Confirm Password <span className="text-red-500">*</span>
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
                            placeholder="••••••••"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20"
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {errors.confirmPassword && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.confirmPassword}
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
                  onClick={() => toggleSection("contact")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <MapPinIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Address & Contact Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Location and contact details
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
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.address
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative">
                          <Input
                            id="address"
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter street address"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.address && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.address}
                        </Typography>
                      )}

                      {/* Map picker placeholder - integrate with Google Maps or similar */}

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

                    <div className="space-y-2">
                      <label htmlFor="contactPersonName" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        Contact Person Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.contactPersonName
                          ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                          : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
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
                      {errors.contactPersonName && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.contactPersonName}
                        </Typography>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contactPersonDesignation" className="block text-sm font-semibold text-gray-700">
                        Contact Person Designation
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm transition-all duration-300 ease-in-out group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="contactPersonDesignation"
                            type="text"
                            name="contactPersonDesignation"
                            value={formData.contactPersonDesignation}
                            onChange={handleChange}
                            placeholder="e.g., Manager, Owner"
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

              {/* Documents Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("documents")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <DocumentTextIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Verification Documents
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Upload required verification documents
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.documents ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.documents && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* GST Certificate */}
                    <div className="space-y-2">
                      <label htmlFor="gstCertificate" className="block text-sm font-semibold text-gray-700">
                        GST Certificate
                      </label>
                      <input
                        type="file"
                        id="gstCertificate"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, "gstCertificate")}
                        className="hidden"
                      />
                      <label
                        htmlFor="gstCertificate"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white/70 hover:bg-white/90 transition-colors"
                      >
                        {documentPreviews.gstCertificate ? (
                          <div className="relative w-full h-full">
                            {typeof documentPreviews.gstCertificate === "string" && documentPreviews.gstCertificate.startsWith("data:image") ? (
                              <img
                                src={documentPreviews.gstCertificate}
                                alt="GST Certificate preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="p-4 text-center">
                                <DocumentTextIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-xs text-gray-600">{documentPreviews.gstCertificate}</p>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDocument("gstCertificate");
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <span className="text-xs">×</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <DocumentTextIcon className="w-10 h-10 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF or Image (MAX. 5MB)</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* Business License */}
                    <div className="space-y-2">
                      <label htmlFor="businessLicense" className="block text-sm font-semibold text-gray-700">
                        Business License
                      </label>
                      <input
                        type="file"
                        id="businessLicense"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, "businessLicense")}
                        className="hidden"
                      />
                      <label
                        htmlFor="businessLicense"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white/70 hover:bg-white/90 transition-colors"
                      >
                        {documentPreviews.businessLicense ? (
                          <div className="relative w-full h-full">
                            {typeof documentPreviews.businessLicense === "string" && documentPreviews.businessLicense.startsWith("data:image") ? (
                              <img
                                src={documentPreviews.businessLicense}
                                alt="Business License preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="p-4 text-center">
                                <DocumentTextIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-xs text-gray-600">{documentPreviews.businessLicense}</p>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDocument("businessLicense");
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <span className="text-xs">×</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <DocumentTextIcon className="w-10 h-10 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF or Image (MAX. 5MB)</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* Photo ID */}
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="photoId" className="block text-sm font-semibold text-gray-700">
                        Photo ID
                      </label>
                      <input
                        type="file"
                        id="photoId"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, "photoId")}
                        className="hidden"
                      />
                      <label
                        htmlFor="photoId"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white/70 hover:bg-white/90 transition-colors"
                      >
                        {documentPreviews.photoId ? (
                          <div className="relative w-full h-full">
                            {typeof documentPreviews.photoId === "string" && documentPreviews.photoId.startsWith("data:image") ? (
                              <img
                                src={documentPreviews.photoId}
                                alt="Photo ID preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="p-4 text-center">
                                <DocumentTextIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-xs text-gray-600">{documentPreviews.photoId}</p>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDocument("photoId");
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <span className="text-xs">×</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <DocumentTextIcon className="w-10 h-10 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF or Image (MAX. 5MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms & Conditions Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("terms")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <DocumentTextIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Terms & Conditions
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.terms ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.terms && (
                  <div className="p-5 pt-0">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Typography variant="small" className="text-gray-700">
                        I agree to the <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a>
                      </Typography>
                    </label>
                    {errors.agreeToTerms && (
                      <Typography variant="small" color="red" className="text-xs mt-2 ml-7">
                        {errors.agreeToTerms}
                      </Typography>
                    )}
                  </div>
                )}
              </div>
              {/* Alerts */}
              {success && (
                <Alert
                  icon={<CheckCircleIcon className="h-5 w-5" />}
                  className="mb-6 bg-green-50 text-green-800 border-green-200 rounded-lg"
                >
                  Merchant registered successfully! Redirecting...
                </Alert>
              )}

              {error && (
                <Alert
                  color="red"
                  className="mb-6 rounded-lg"
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/dashboard/merchants")}
                  className="flex-1 h-12 bg-white/50 border-gray-300 text-gray-700 hover:bg-white/70 hover:border-gray-400 hover:shadow-lg transition-all rounded-xl"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.agreeToTerms}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                      Processing...
                    </span>
                  ) : (
                    "Register Merchant"
                  )}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default RegisterMerchant;

