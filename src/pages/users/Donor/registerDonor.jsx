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
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  MapPinIcon,
  DocumentTextIcon,
  GiftIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL_V1, API_BASE_URL } from "@/configs/api";

export function RegisterDonor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    account: true,
    personal: true,
    preferences: true,
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
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    gender: "",
    address: "",
    preferredDonationType: "",
    agreeToTerms: false,
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
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

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
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
      const response = await fetch(`${API_BASE_URL_V1}/donors/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          gender: formData.gender,
          address: formData.address || "",
          preferredDonationType: formData.preferredDonationType || "",
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to register donor";
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
        throw new Error(data.message || "Failed to register donor");
      }

      setSuccess(true);
      setError("");

      setTimeout(() => {
        navigate("/dashboard/donors");
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
            onClick={() => navigate("/dashboard/donors")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Donors</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-xl bg-white/40 rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          <CardBody className="p-6 md:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <Typography variant="h3" className="text-gray-800 mb-2 font-bold">
                Register as Donor
              </Typography>
              <Typography variant="small" className="text-gray-500">
                Join us in making a difference. Fill in your details to get started.
              </Typography>
            </div>

         

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("account")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Account Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Create your account credentials
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openSections.account ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {openSections.account && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.fullName 
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
                        placeholder="Enter your full name"
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

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.email 
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
                        placeholder="your.email@example.com"
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
                      <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.phoneNumber 
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

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <LockClosedIcon className="w-4 h-4 text-gray-400" />
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.password 
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
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.confirmPassword 
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
                        Your personal details
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openSections.personal ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {openSections.personal && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        {["Male", "Female", "Prefer Not to Say"].map((gender) => (
                          <label key={gender} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value={gender}
                              checked={formData.gender === gender}
                              onChange={handleChange}
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
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        Address
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm transition-all duration-300 ease-in-out group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 pointer-events-none" />
                        <div className="relative">
                      <Input
                        id="address"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter your address (optional)"
                        labelProps={{ className: "hidden" }}
                        containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                      />
                        </div>
                      </div>
                      <Typography variant="small" className="text-xs text-gray-400">
                        Optional: For location-based donation suggestions
                      </Typography>
                    </div>
                  </div>
                )}
              </div>

              {/* Donation Preferences Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("preferences")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <GiftIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Donation Preferences
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Your preferred donation type
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openSections.preferences ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {openSections.preferences && (
                  <div className="p-5 pt-0">
                    <div className="space-y-2">
                      <label htmlFor="preferredDonationType" className="block text-sm font-semibold text-gray-700">
                        Preferred Donation Type
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm transition-all duration-300 ease-in-out group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 pointer-events-none" />
                      <div className="relative">
                        <select
                          id="preferredDonationType"
                          name="preferredDonationType"
                          value={formData.preferredDonationType}
                          onChange={handleChange}
                            className="w-full h-11 px-3 py-2.5 text-sm font-normal text-gray-900 bg-transparent focus:outline-none appearance-none cursor-pointer relative z-10"
                        >
                          <option value="">Select donation type (optional)</option>
                          <option value="Money">Money</option>
                          <option value="Food">Food</option>
                          <option value="Clothes">Clothes</option>
                          <option value="Services">Services</option>
                        </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-20">
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <Typography variant="small" className="text-xs text-gray-400">
                        Optional: You can change this preference later
                      </Typography>
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
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openSections.terms ? "rotate-180" : ""
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
                Registration successful! Redirecting...
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
                  onClick={() => navigate("/dashboard/donors")}
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
                    "Register"
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

export default RegisterDonor;

