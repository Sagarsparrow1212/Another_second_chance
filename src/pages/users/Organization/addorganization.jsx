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
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentTextIcon,
  XMarkIcon,
  PlusIcon,
  PhotoIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL_V1, API_BASE_URL } from "@/configs/api";

export function AddOrganization() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    accountContact: true,
    organizationAddress: true,
    bankingDetails: true,
    photos: true,
    documents: true,
  });

  // Documents state
  const [documents, setDocuments] = useState([]);
  
  // Photos state
  const [photos, setPhotos] = useState([]);

  // Logo state
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

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
    orgName: "",
    orgType: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    contactPerson: "",
    emergencyContactEmail: "",
    contactPhone: "",
    // Banking details
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    routingNumber: "",
    accountType: "",
    bankAddress: "",
    swiftCode: "",
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

  const handleZipCodeChange = (e) => {
    const value = e.target.value;
    // Only allow digits and dash, and enforce ZIP code format
    // Allow: digits, and dash only after 5 digits
    let formatted = value.replace(/[^\d-]/g, ''); // Remove non-digits and non-dashes
    
    // Enforce format: 5 digits, optionally followed by dash and 4 digits
    if (formatted.length > 5 && formatted[5] !== '-') {
      // If 6th character is not dash, insert dash
      formatted = formatted.slice(0, 5) + '-' + formatted.slice(5);
    }
    
    // Limit to 10 characters max (5 digits + dash + 4 digits)
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }
    
    // Don't allow dash at the start or multiple dashes
    if (formatted.startsWith('-')) {
      formatted = formatted.slice(1);
    }
    formatted = formatted.replace(/-+/g, '-'); // Replace multiple dashes with single dash
    
    // Don't allow more than 5 digits before dash
    const parts = formatted.split('-');
    if (parts[0].length > 5) {
      parts[0] = parts[0].slice(0, 5);
      formatted = parts.join('-');
    }
    
    // Don't allow more than 4 digits after dash
    if (parts.length > 1 && parts[1].length > 4) {
      parts[1] = parts[1].slice(0, 4);
      formatted = parts.join('-');
    }
    
    setFormData((prev) => ({
      ...prev,
      zipCode: formatted,
    }));
    
    // Clear error when user starts typing
    if (errors.zipCode) {
      setErrors((prev) => ({
        ...prev,
        zipCode: '',
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-format phone number fields
    let formattedValue = value;
    if (name === 'contactPhone') {
      formattedValue = formatPhoneNumber(value);
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

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Document handling functions
  const handleDocumentAdd = () => {
    if (documents.length >= 3) {
      setError("Maximum 3 verification documents allowed");
      return;
    }
    setDocuments((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        file: null,
        preview: null,
      },
    ]);
  };

  const handleDocumentRemove = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleDocumentNameChange = (id, name) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, name } : doc))
    );
    // Clear error when user types
    if (errors[`documentName_${id}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`documentName_${id}`];
        return newErrors;
      });
    }
  };

  const handleDocumentFileChange = (id, file) => {
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(`File "${file.name}" exceeds the 5MB size limit`);
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(`File "${file.name}" is not a supported format. Please upload images (JPG, PNG, GIF) or documents (PDF, DOC, DOCX)`);
      return;
    }

    // Create preview for images
    let preview = null;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              file,
              preview,
              // Don't auto-fill name - user must enter it manually
            }
          : doc
      )
    );
    setError(""); // Clear any previous errors
    // Clear document validation error if at least one document is uploaded
    if (errors.documents) {
      setErrors((prev) => ({
        ...prev,
        documents: '',
      }));
    }
  };

  // Photo handling functions
  const handlePhotoAdd = () => {
    if (photos.length >= 5) {
      setError("Maximum 5 organization photos allowed");
      return;
    }
    setPhotos((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        file: null,
        preview: null,
      },
    ]);
  };

  const handlePhotoRemove = (id) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  const handlePhotoNameChange = (id, name) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, name } : photo))
    );
    // Clear error when user types
    if (errors[`photoName_${id}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`photoName_${id}`];
        return newErrors;
      });
    }
  };

  const handlePhotoFileChange = (id, file) => {
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(`File "${file.name}" exceeds the 5MB size limit`);
      return;
    }

    // Validate file type - only images for photos
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(`File "${file.name}" is not a supported image format. Please upload images (JPG, PNG, GIF, WEBP)`);
      return;
    }

    // Create preview for images
    const preview = URL.createObjectURL(file);

    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === id
          ? {
              ...photo,
              file,
              preview,
              // Don't auto-fill name - user must enter it manually
            }
          : photo
      )
    );
    setError(""); // Clear any previous errors
    // Clear photo validation error if at least one photo is uploaded
    if (errors.photos) {
      setErrors((prev) => ({
        ...prev,
        photos: '',
      }));
    }
  };

  // Logo handling functions
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(`Logo file "${file.name}" exceeds the 5MB size limit`);
      return;
    }

    // Validate file type - only images for logo
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(`Logo file "${file.name}" is not a supported image format. Please upload images (JPG, PNG, GIF, WEBP)`);
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setLogo(file);
    setLogoPreview(preview);
    setError(""); // Clear any previous errors
  };

  const removeLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogo(null);
    setLogoPreview(null);
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.orgName.trim()) {
      newErrors.orgName = "Organization name is required";
    }

    if (!formData.orgType) {
      newErrors.orgType = "Organization type is required";
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

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "Zip code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
      newErrors.zipCode = "Please enter a valid US ZIP code (e.g., 10001 or 10001-1234)";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    // Optional field validation (if provided)
    if (formData.emergencyContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emergencyContactEmail)) {
      newErrors.emergencyContactEmail = "Please enter a valid email address";
    }

    // Phone number validation (if provided)
    if (formData.contactPhone) {
      // Remove formatting to check digits only
      const phoneDigits = formData.contactPhone.replace(/\D/g, '');
      // Should have exactly 10 digits (area code + number)
      if (phoneDigits.length < 10) {
        newErrors.contactPhone = "Phone number must have 10 digits";
      } else if (phoneDigits.length > 10) {
        newErrors.contactPhone = "Phone number must have exactly 10 digits";
      }
    }

    // Validate documents (mandatory, max 3)
    const validDocuments = documents.filter(doc => doc.file);
    if (validDocuments.length === 0) {
      newErrors.documents = "At least 1 verification document is required";
    } else if (validDocuments.length > 3) {
      newErrors.documents = "Maximum 3 verification documents allowed";
    }

    // Validate document names - user must enter name for each document
    documents.forEach((doc) => {
      if (doc.file && !doc.name?.trim()) {
        newErrors[`documentName_${doc.id}`] = "Document name is required";
      }
    });

    // Validate photos (mandatory, max 5)
    const validPhotos = photos.filter(photo => photo.file);
    if (validPhotos.length === 0) {
      newErrors.photos = "At least 1 organization photo is required";
    } else if (validPhotos.length > 5) {
      newErrors.photos = "Maximum 5 organization photos allowed";
    }

    // Validate photo names - user must enter name for each photo
    photos.forEach((photo) => {
      if (photo.file && !photo.name?.trim()) {
        newErrors[`photoName_${photo.id}`] = "Photo name is required";
      }
    });

    // Validate banking details (required for donation collection)
    if (!formData.bankName.trim()) {
      newErrors.bankName = "Bank name is required";
    }

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = "Account holder name is required";
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (!/^\d+$/.test(formData.accountNumber.trim())) {
      newErrors.accountNumber = "Account number must contain only digits";
    }

    if (!formData.confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = "Please confirm your account number";
    } else if (formData.accountNumber.trim() !== formData.confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = "Account numbers do not match";
    }

    if (!formData.routingNumber.trim()) {
      newErrors.routingNumber = "Routing number is required";
    } else if (!/^\d{9}$/.test(formData.routingNumber.trim())) {
      newErrors.routingNumber = "Routing number must be exactly 9 digits";
    }

    if (!formData.accountType) {
      newErrors.accountType = "Account type is required";
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  // Map new organization types to legacy types for backend compatibility
  const mapOrgTypeToLegacy = (orgType) => {
    const typeMapping = {
      'nonprofit': 'NGO',
      'shelter': 'NGO',
      'food_bank': 'NGO',
      'employment_agency': 'Private',
      'merchant': 'Private',
      'government': 'Govt',
      'NGO': 'NGO',
      'Private': 'Private',
      'Govt': 'Govt',
    };
    return typeMapping[orgType] || orgType;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const validation = validateForm();
    if (!validation.isValid) {
      // Scroll to first error field
      const firstErrorField = Object.keys(validation.errors)[0];
      if (firstErrorField) {
        setTimeout(() => {
          const errorElement = document.getElementById(firstErrorField);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
          }
        }, 100);
      }
      setError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('role', 'organization');
      formDataToSend.append('orgName', formData.orgName);
      // Map organization type to legacy format for backend compatibility
      formDataToSend.append('orgType', mapOrgTypeToLegacy(formData.orgType));
      formDataToSend.append('streetAddress', formData.streetAddress);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('zipCode', formData.zipCode);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('contactPerson', formData.contactPerson || '');
      formDataToSend.append('emergencyContactEmail', formData.emergencyContactEmail || formData.email);
      formDataToSend.append('contactPhone', formData.contactPhone || '');

      // Add banking details
      formDataToSend.append('bankName', formData.bankName);
      formDataToSend.append('accountHolderName', formData.accountHolderName);
      formDataToSend.append('accountNumber', formData.accountNumber);
      formDataToSend.append('routingNumber', formData.routingNumber);
      formDataToSend.append('accountType', formData.accountType);
      formDataToSend.append('bankAddress', formData.bankAddress || '');
      formDataToSend.append('swiftCode', formData.swiftCode || '');

      // Add logo (optional)
      if (logo) {
        formDataToSend.append('logo', logo);
      }

      // Add documents
      const documentNames = [];
      documents.forEach((doc) => {
        if (doc.file) {
          formDataToSend.append('documents', doc.file);
          // Use only user-entered name (validation ensures it's provided)
          documentNames.push(doc.name);
        }
      });
      
      // Add photos
      const photoNames = [];
      photos.forEach((photo) => {
        if (photo.file) {
          formDataToSend.append('photos', photo.file);
          // Use only user-entered name (validation ensures it's provided)
          photoNames.push(photo.name);
        }
      });
      
      // Send document names as JSON string
      if (documentNames.length > 0) {
        formDataToSend.append('documentNames', JSON.stringify(documentNames));
      }
      
      // Send photo names as JSON string
      if (photoNames.length > 0) {
        formDataToSend.append('photoNames', JSON.stringify(photoNames));
      }

      const response = await fetch(`${API_BASE_URL_V1}/organizations/register`, {
        method: "POST",
        // Don't set Content-Type header - browser will set it with boundary for FormData
        body: formDataToSend,
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = "Failed to create organization";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          // Include validation errors if available
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage += ": " + errorData.errors.join(", ");
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create organization");
      }

      setSuccess(true);
      setError("");

      // Reset form after successful submission
      setTimeout(() => {
        navigate("/dashboard/organizations");
      }, 500);
    } catch (err) {
      console.error("Registration error:", err);
      // Better error messages
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-9xl mx-auto">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="text"
            size="sm"
            className="flex items-center gap-2 normal-case text-sm font-medium text-gray-700 hover:text-gray-900 p-2"
            onClick={() => navigate("/dashboard/organizations")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Organizations</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-xl bg-white/40 rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          <CardBody className="p-6 md:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <Typography variant="h3" className="text-gray-800 mb-2 font-bold">
                Create Organization Profile
              </Typography>
              <Typography variant="small" className="text-gray-500">
                Fill in the details below to register your organization
              </Typography>
            </div>


            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account & Contact Information Section */}
           <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-black/30 shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("accountContact")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Account & Contact Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Login credentials and primary contacts
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openSections.accountContact ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {openSections.accountContact && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Organization Logo Section */}
                    <div className="md:col-span-2 space-y-2 mb-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <BuildingOffice2Icon className="w-4 h-4 text-gray-400" />
                        Organization Logo <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <div className="flex items-start gap-4">
                        <input
                          type="file"
                          id="logo"
                          accept="image/*"
                          onChange={handleLogoChange}
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor="logo"
                          className="cursor-pointer flex-shrink-0"
                        >
                          {logoPreview ? (
                            <div className="relative">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeLogo();
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                              <PhotoIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </label>
                        <div className="flex-1 pt-2">
                          <Typography variant="small" className="text-xs text-gray-500">
                            Click to upload organization logo (JPG, PNG, GIF, WEBP)
                          </Typography>
                          <Typography variant="small" className="text-xs text-gray-400 mt-1">
                            Maximum file size: 5MB
                          </Typography>
                        </div>
                      </div>
                    </div>
                    
                    {/* Email Field */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        Email Address <span className="text-red-500">*</span>
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
                        placeholder="admin@example.com"
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
                      <Typography variant="small" className="text-xs text-gray-400">
                        This will be your primary login email
                      </Typography>
                    </div>
                    
                    {/* Password Field */}
                    <div className="space-y-2">
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
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
                    
                    {/* Contact Person Field */}
                    <div className="space-y-2">
                      <label htmlFor="contactPerson" className="block text-sm font-semibold text-gray-700">
                        Contact Person
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm transition-all duration-300 ease-in-out group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 pointer-events-none" />
                        <div className="relative">
                      <Input
                        id="contactPerson"
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        placeholder="John Doe"
                        labelProps={{ className: "hidden" }}
                        containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                      />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700">
                        Primary Phone
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.contactPhone 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
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
                      {errors.contactPhone && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.contactPhone}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Enter 10-digit phone number
                      </Typography>
                    </div>
                    
                    {/* Emergency Contact Email Field */}
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="emergencyContactEmail" className="block text-sm font-semibold text-gray-700">
                       Emergency Contact Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.emergencyContactEmail 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                      <Input
                            id="emergencyContactEmail"
                        type="email"
                            name="emergencyContactEmail"
                            value={formData.emergencyContactEmail}
                        onChange={handleChange}
                        placeholder="contact@example.com"
                        labelProps={{ className: "hidden" }}
                        containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                      />
                        </div>
                      </div>
                      {errors.emergencyContactEmail && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.emergencyContactEmail}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Public email for customer inquiries. If not provided, account email will be used.
                      </Typography>
                    </div>
                  </div>
                )}
              </div>

              {/* Banking Details Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-black/30 shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("bankingDetails")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                      <CreditCardIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Banking Details <span className="text-red-500">*</span>
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Bank account information for receiving donations
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openSections.bankingDetails ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {openSections.bankingDetails && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.bankName 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                          <Input
                            id="bankName"
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            placeholder="e.g., Chase Bank"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.bankName && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.bankName}
                        </Typography>
                      )}
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="accountHolderName" className="block text-sm font-semibold text-gray-700">
                        Account Holder Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.accountHolderName 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                          <Input
                            id="accountHolderName"
                            type="text"
                            name="accountHolderName"
                            value={formData.accountHolderName}
                            onChange={handleChange}
                            placeholder="e.g., Acme Corporation"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.accountHolderName && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.accountHolderName}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Name as it appears on the bank account
                      </Typography>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.accountNumber 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                          <Input
                            id="accountNumber"
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setFormData((prev) => ({
                                ...prev,
                                accountNumber: value,
                              }));
                              if (errors.accountNumber) {
                                setErrors((prev) => ({
                                  ...prev,
                                  accountNumber: '',
                                }));
                              }
                            }}
                            placeholder="1234567890"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.accountNumber && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.accountNumber}
                        </Typography>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="confirmAccountNumber" className="block text-sm font-semibold text-gray-700">
                        Confirm Account Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.confirmAccountNumber 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                          <Input
                            id="confirmAccountNumber"
                            type="text"
                            name="confirmAccountNumber"
                            value={formData.confirmAccountNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setFormData((prev) => ({
                                ...prev,
                                confirmAccountNumber: value,
                              }));
                              if (errors.confirmAccountNumber) {
                                setErrors((prev) => ({
                                  ...prev,
                                  confirmAccountNumber: '',
                                }));
                              }
                            }}
                            placeholder="Re-enter account number"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.confirmAccountNumber && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.confirmAccountNumber}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        Re-enter your account number to confirm
                      </Typography>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="routingNumber" className="block text-sm font-semibold text-gray-700">
                        Routing Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.routingNumber 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                          <Input
                            id="routingNumber"
                            type="text"
                            name="routingNumber"
                            value={formData.routingNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                              setFormData((prev) => ({
                                ...prev,
                                routingNumber: value,
                              }));
                              if (errors.routingNumber) {
                                setErrors((prev) => ({
                                  ...prev,
                                  routingNumber: '',
                                }));
                              }
                            }}
                            placeholder="123456789"
                            maxLength={9}
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      {errors.routingNumber && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.routingNumber}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-xs text-gray-400">
                        9-digit US routing number
                      </Typography>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="accountType" className="block text-sm font-semibold text-gray-700">
                        Account Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.accountType 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                          <select
                            id="accountType"
                            name="accountType"
                            value={formData.accountType}
                            onChange={handleSelectChange}
                            className="w-full h-11 px-3 py-2.5 text-sm font-normal text-gray-900 bg-transparent focus:outline-none appearance-none cursor-pointer relative z-10"
                          >
                            <option value="">Select Account Type</option>
                            <option value="checking">Checking</option>
                            <option value="savings">Savings</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-20">
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      {errors.accountType && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.accountType}
                        </Typography>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="swiftCode" className="block text-sm font-semibold text-gray-700">
                        SWIFT/BIC Code <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm transition-all duration-300 ease-in-out group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="swiftCode"
                            type="text"
                            name="swiftCode"
                            value={formData.swiftCode}
                            onChange={handleChange}
                            placeholder="CHASUS33"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                          />
                        </div>
                      </div>
                      <Typography variant="small" className="text-xs text-gray-400">
                        Required for international transfers
                      </Typography>
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="bankAddress" className="block text-sm font-semibold text-gray-700">
                        Bank Address <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm transition-all duration-300 ease-in-out group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 pointer-events-none" />
                        <div className="relative">
                          <Input
                            id="bankAddress"
                            type="text"
                            name="bankAddress"
                            value={formData.bankAddress}
                            onChange={handleChange}
                            placeholder="Bank branch address"
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

              {/* Organization Details & Address Section */}
             <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-black/30 shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("organizationAddress")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <BuildingOffice2Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Organization Details & Address
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Organization profile and physical address
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openSections.organizationAddress ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {openSections.organizationAddress && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="orgName" className="block text-sm font-semibold text-gray-700">
                        Organization Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.orgName 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                      <Input
                        id="orgName"
                        type="text"
                        name="orgName"
                        value={formData.orgName}
                        onChange={handleChange}
                        placeholder="Acme Corporation"
                        labelProps={{ className: "hidden" }}
                        containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                      />
                        </div>
                      </div>
                      {errors.orgName && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.orgName}
                        </Typography>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="orgType" className="block text-sm font-semibold text-gray-700">
                        Organization Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.orgType 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                      <div className="relative">
                        <select
                          id="orgType"
                          name="orgType"
                          value={formData.orgType}
                          onChange={handleSelectChange}
                            className="w-full h-11 px-3 py-2.5 text-sm font-normal text-gray-900 bg-transparent focus:outline-none appearance-none cursor-pointer relative z-10"
                        >
                          <option value="">Select Organization Type</option>
                          <option value="nonprofit">Nonprofit Organization</option>
                          <option value="shelter">Homeless Shelter</option>
                          <option value="food_bank">Food Bank / Soup Kitchen</option>
                          <option value="employment_agency">Employment Agency</option>
                          <option value="merchant">Local Business / Merchant</option>
                          <option value="government">Government Service</option>
                          {/* Legacy options for backward compatibility */}
                          <option value="NGO">NGO (Legacy)</option>
                          <option value="Private">Private (Legacy)</option>
                          <option value="Govt">Govt (Legacy)</option>

                        </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-20">
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      {errors.orgType && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.orgType}
                        </Typography>
                      )}
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="streetAddress" className="block text-sm font-semibold text-gray-700">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.streetAddress 
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
                        placeholder="123 Main Street"
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
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.city 
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
                        placeholder="San Francisco"
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
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.state 
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
                        placeholder="California"
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
                      <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700">
                        Zip Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.zipCode 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                      <Input
                        id="zipCode"
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleZipCodeChange}
                        placeholder="10001 or 10001-1234"
                        maxLength={10}
                        labelProps={{ className: "hidden" }}
                        containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                      />
                        </div>
                      </div>
                      {errors.zipCode && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.zipCode}
                        </Typography>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="country" className="block text-sm font-semibold text-gray-700">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${
                          errors.country 
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                        }`} />
                        <div className="relative">
                      <Input
                        id="country"
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="United States"
                        labelProps={{ className: "hidden" }}
                        containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none z-10"
                      />
                        </div>
                      </div>
                      {errors.country && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.country}
                        </Typography>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Organization Photos Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-black/30 shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("photos")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                      <PhotoIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Organization Photos <span className="text-red-500">*</span>
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Upload photos of your organization (max 5)
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openSections.photos ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {openSections.photos && (
                  <div className="p-5 pt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="p-4 bg-white/50 rounded-lg border border-gray-200 space-y-3 relative"
                        >
                          <button
                            type="button"
                            onClick={() => handlePhotoRemove(photo.id)}
                            className="absolute top-2 right-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors z-10"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Photo Name
                              </label>
                              <Input
                                value={photo.name}
                                onChange={(e) => handlePhotoNameChange(photo.id, e.target.value)}
                                placeholder="e.g., Office Building"
                                labelProps={{ className: "hidden" }}
                                containerProps={{ className: "min-w-0" }}
                                className={`bg-white text-sm ${errors[`photoName_${photo.id}`] ? 'border-red-300' : ''}`}
                              />
                              {errors[`photoName_${photo.id}`] && (
                                <Typography variant="small" color="red" className="text-xs mt-1">
                                  {errors[`photoName_${photo.id}`]}
                                </Typography>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Photo File
                              </label>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handlePhotoFileChange(photo.id, file);
                                }}
                                accept="image/*"
                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                              />
                              {photo.preview && (
                                <div className="mt-2">
                                  <img
                                    src={photo.preview}
                                    alt="Preview"
                                    className="w-full h-32 object-cover rounded border border-gray-200"
                                  />
                                </div>
                              )}
                              {photo.file && !photo.preview && (
                                <Typography variant="small" className="text-gray-600 mt-2 text-xs">
                                  File: {photo.file.name} ({(photo.file.size / 1024).toFixed(2)} KB)
                                </Typography>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {photos.length < 5 && (
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={handlePhotoAdd}
                        className="w-full flex items-center justify-center gap-2 border-dashed border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 hover:text-green-700"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Add Photo
                      </Button>
                    )}
                    
                    {errors.photos && (
                      <Typography variant="small" color="red" className="text-xs">
                        {errors.photos}
                      </Typography>
                    )}
                    
                    <Typography variant="small" className="text-xs text-gray-500">
                      Supported formats: Images (JPG, PNG, GIF, WEBP). Max file size: 5MB per file. At least 1 photo required (max 5).
                    </Typography>
                  </div>
                )}
              </div>

              {/* Verification Documents Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-black/30 shadow-lg overflow-hidden">
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
                        Verification Documents <span className="text-red-500">*</span>
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Upload documents for verification (max 3)
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openSections.documents ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {openSections.documents && (
                  <div className="p-5 pt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-4 bg-white/50 rounded-lg border border-gray-200 space-y-3 relative"
                        >
                          <button
                            type="button"
                            onClick={() => handleDocumentRemove(doc.id)}
                            className="absolute top-2 right-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors z-10"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Document Name
                              </label>
                              <Input
                                value={doc.name}
                                onChange={(e) => handleDocumentNameChange(doc.id, e.target.value)}
                                placeholder="e.g., Registration Certificate"
                                labelProps={{ className: "hidden" }}
                                containerProps={{ className: "min-w-0" }}
                                className={`bg-white text-sm ${errors[`documentName_${doc.id}`] ? 'border-red-300' : ''}`}
                              />
                              {errors[`documentName_${doc.id}`] && (
                                <Typography variant="small" color="red" className="text-xs mt-1">
                                  {errors[`documentName_${doc.id}`]}
                                </Typography>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Document File
                              </label>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleDocumentFileChange(doc.id, file);
                                }}
                                accept="image/*,.pdf,.doc,.docx"
                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                              />
                              {doc.preview && (
                                <div className="mt-2">
                                  <img
                                    src={doc.preview}
                                    alt="Preview"
                                    className="w-full h-32 object-cover rounded border border-gray-200"
                                  />
                                </div>
                              )}
                              {doc.file && !doc.preview && (
                                <Typography variant="small" className="text-gray-600 mt-2 text-xs">
                                  File: {doc.file.name} ({(doc.file.size / 1024).toFixed(2)} KB)
                                </Typography>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {documents.length < 3 && (
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={handleDocumentAdd}
                        className="w-full flex items-center justify-center gap-2 border-dashed border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Add Document
                      </Button>
                    )}
                    
                    {errors.documents && (
                      <Typography variant="small" color="red" className="text-xs">
                        {errors.documents}
                      </Typography>
                    )}
                    
                    <Typography variant="small" className="text-xs text-gray-500">
                      Supported formats: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX). Max file size: 5MB per file. At least 1 document required (max 3).
                    </Typography>
                  </div>
                )}
              </div>

              
            {/* Alerts */}
            {success && (
              <Alert
                icon={<CheckCircleIcon className="h-5 w-5" />}
                className="mb-6 bg-green-50 text-green-800 border-green-200 rounded-lg"
              >
                Organization created successfully! Redirecting...
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
                  onClick={() => navigate("/dashboard/organizations")}
                  className="flex-1 h-12 bg-white/50 border-gray-300 text-gray-700 hover:bg-white/70 hover:border-gray-400 hover:shadow-lg transition-all rounded-xl"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl border-0"
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
                    "Register Organization"
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

export default AddOrganization;
