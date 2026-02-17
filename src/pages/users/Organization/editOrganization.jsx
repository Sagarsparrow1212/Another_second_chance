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
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  ChevronDownIcon,
  KeyIcon,
  LockClosedIcon,
  PhotoIcon,
  DocumentTextIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL_V1, API_BASE_URL, getFileUrl, getUploadUrl } from "@/configs/api";

export function EditOrganization() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    account: true,
    organization: true,
    address: true,
    contact: true,
    photos: true,
    documents: true,
  });

  // Existing photos and documents from server
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);

  // New photos and documents to upload
  const [newPhotos, setNewPhotos] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);

  // Logo state
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [existingLogo, setExistingLogo] = useState(null);

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
    orgName: "",
    orgType: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
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

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setFetching(true);
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
          const org = data.data;
          setFormData({
            email: org.email || org.userEmail || "",
            password: org.hasPassword ? "••••••••" : "", // Show masked password only if password exists
            newPassword: "",
            confirmPassword: "",
            orgName: org.name || org.orgName || "",
            orgType: org.orgType || "",
            streetAddress: org.streetAddress || "",
            city: org.city || "",
            state: org.state || "",
            zipCode: org.zipCode || "",
            country: org.country || "",
            contactPerson: org.contactPerson || "",
            contactEmail: org.contactEmail || "",
            contactPhone: org.contactPhone || "",
          });
          setPasswordChanged(false); // Password hasn't been changed yet

          // Load existing photos and documents
          if (org.photos && Array.isArray(org.photos)) {
            setExistingPhotos(org.photos.map((photo, index) => ({
              id: `existing-${index}`,
              photoName: photo.photoName || '',
              photoUrl: photo.photoUrl || '',
              isExisting: true,
            })));
          }

          if (org.documents && Array.isArray(org.documents)) {
            setExistingDocuments(org.documents.map((doc, index) => ({
              id: `existing-${index}`,
              docName: doc.docName || '',
              docUrl: doc.docUrl || '',
              isExisting: true,
            })));
          }

          // Load existing logo
          if (org.logo) {
            setExistingLogo(getOrganizationEditFileUrl(org.logo));
          }
        } else {
          setError(data.message || 'Failed to fetch organization details');
        }
      } catch (err) {
        console.error('Fetch organization error:', err);
        setError(err.message || 'An error occurred while fetching organization details');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchOrganization();
    }
  }, [id]);

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

    // Track password changes
    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordChanged(true);
    }

    if (name === 'password') {
      // If user starts typing, clear the masked password
      if (value !== "••••••••") {
        setPasswordChanged(true);
      }
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

  const handleSelectChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      orgType: value,
    }));
    if (errors.orgType) {
      setErrors((prev) => ({
        ...prev,
        orgType: "",
      }));
    }
  };

  // Photo handling functions
  const handlePhotoRemove = (id) => {
    // Check if it's an existing photo or new photo
    if (id.startsWith('existing-')) {
      setExistingPhotos((prev) => prev.filter((photo) => photo.id !== id));
    } else {
      setNewPhotos((prev) => prev.filter((photo) => photo.id !== id));
    }
  };

  const handlePhotoAdd = () => {
    const totalPhotos = existingPhotos.length + newPhotos.length;
    if (totalPhotos >= 5) {
      setError("Maximum 5 organization photos allowed");
      return;
    }
    setNewPhotos((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: "",
        file: null,
        preview: null,
      },
    ]);
  };

  const handlePhotoNameChange = (id, name) => {
    const idStr = String(id);
    if (idStr.startsWith('existing-')) {
      setExistingPhotos((prev) =>
        prev.map((photo) => (String(photo.id) === idStr ? { ...photo, photoName: name } : photo))
      );
      // Clear error when user types
      if (errors[`existingPhotoName_${id}`]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`existingPhotoName_${id}`];
          return newErrors;
        });
      }
    } else {
      setNewPhotos((prev) =>
        prev.map((photo) => (String(photo.id) === idStr ? { ...photo, name } : photo))
      );
      // Clear error when user types
      if (errors[`photoName_${id}`]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`photoName_${id}`];
          return newErrors;
        });
      }
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

    setNewPhotos((prev) =>
      prev.map((photo) =>
        String(photo.id) === String(id)
          ? {
            ...photo,
            file,
            preview,
          }
          : photo
      )
    );
    setError(""); // Clear any previous errors
  };

  // Document handling functions
  const handleDocumentRemove = (id) => {
    // Check if it's an existing document or new document
    const idStr = String(id);
    if (idStr.startsWith('existing-')) {
      setExistingDocuments((prev) => prev.filter((doc) => String(doc.id) !== idStr));
    } else {
      setNewDocuments((prev) => prev.filter((doc) => String(doc.id) !== idStr));
    }
  };

  const handleDocumentAdd = () => {
    const totalDocuments = existingDocuments.length + newDocuments.length;
    if (totalDocuments >= 3) {
      setError("Maximum 3 verification documents allowed");
      return;
    }
    setNewDocuments((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: "",
        file: null,
        preview: null,
      },
    ]);
  };

  const handleDocumentNameChange = (id, name) => {
    const idStr = String(id);
    if (idStr.startsWith('existing-')) {
      setExistingDocuments((prev) =>
        prev.map((doc) => (String(doc.id) === idStr ? { ...doc, docName: name } : doc))
      );
      // Clear error when user types
      if (errors[`existingDocumentName_${id}`]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`existingDocumentName_${id}`];
          return newErrors;
        });
      }
    } else {
      setNewDocuments((prev) =>
        prev.map((doc) => (String(doc.id) === idStr ? { ...doc, name } : doc))
      );
      // Clear error when user types
      if (errors[`documentName_${id}`]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`documentName_${id}`];
          return newErrors;
        });
      }
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

    setNewDocuments((prev) =>
      prev.map((doc) =>
        String(doc.id) === String(id)
          ? {
            ...doc,
            file,
            preview,
          }
          : doc
      )
    );
    setError(""); // Clear any previous errors
  };

  const getOrganizationEditFileUrl = (filePath) => {
    if (!filePath) return null;
    // If it's already a full URL, return it
    if (filePath.startsWith('http')) {
      return filePath;
    }
    // If it starts with /uploads, use it directly
    if (filePath.startsWith('/uploads')) {
      return getFileUrl(filePath);
    }
    // Otherwise, construct the URL for organization files
    return getUploadUrl('organizations', filePath);
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

    // Email validation (if provided)
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email address";
    }

    // Phone number validation (if provided)
    if (formData.contactPhone) {
      // Remove formatting to check digits only
      const phoneDigits = formData.contactPhone.replace(/\D/g, '');
      // Should have exactly 10 digits
      if (phoneDigits.length < 10) {
        newErrors.contactPhone = "Phone number must have 10 digits";
      } else if (phoneDigits.length > 10) {
        newErrors.contactPhone = "Phone number must have exactly 10 digits";
      }
    }

    // Validate photo names - user must enter name for each photo
    newPhotos.forEach((photo, index) => {
      if (photo.file && !photo.name?.trim()) {
        newErrors[`photoName_${photo.id}`] = "Photo name is required";
      }
    });

    // Validate existing photo names - user must enter name for each photo
    existingPhotos.forEach((photo, index) => {
      if (!photo.photoName?.trim()) {
        newErrors[`existingPhotoName_${photo.id}`] = "Photo name is required";
      }
    });

    // Validate document names - user must enter name for each document
    newDocuments.forEach((doc, index) => {
      if (doc.file && !doc.name?.trim()) {
        newErrors[`documentName_${doc.id}`] = "Document name is required";
      }
    });

    // Validate existing document names - user must enter name for each document
    existingDocuments.forEach((doc, index) => {
      if (!doc.docName?.trim()) {
        newErrors[`existingDocumentName_${doc.id}`] = "Document name is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      // Create FormData for file uploads
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append('orgName', formData.orgName);
      // Map organization type to legacy format for backend compatibility
      formDataToSend.append('orgType', mapOrgTypeToLegacy(formData.orgType));
      formDataToSend.append('streetAddress', formData.streetAddress);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('zipCode', formData.zipCode);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('contactPerson', formData.contactPerson || '');
      formDataToSend.append('contactEmail', formData.contactEmail || '');
      formDataToSend.append('contactPhone', formData.contactPhone || '');
      formDataToSend.append('email', formData.email);

      // Add logo (optional) - only if a new logo is uploaded
      if (logo) {
        formDataToSend.append('logo', logo);
      }

      // Handle password update - use newPassword if provided, otherwise keep current
      if (formData.newPassword && formData.newPassword.trim() !== '') {
        formDataToSend.append('password', formData.newPassword);
      }

      // Prepare existing photos to keep (those not removed)
      const photosToKeep = existingPhotos.map(photo => ({
        photoName: photo.photoName,
        photoUrl: photo.photoUrl,
      }));
      if (photosToKeep.length > 0) {
        formDataToSend.append('existingPhotos', JSON.stringify(photosToKeep));
      }

      // Add new photo files
      const photoNames = [];
      newPhotos.forEach((photo) => {
        if (photo.file) {
          formDataToSend.append('photos', photo.file);
          // Use only user-entered name (validation ensures it's provided)
          photoNames.push(photo.name);
        }
      });
      if (photoNames.length > 0) {
        formDataToSend.append('photoNames', JSON.stringify(photoNames));
      }

      // Prepare existing documents to keep (those not removed)
      const documentsToKeep = existingDocuments.map(doc => ({
        docName: doc.docName,
        docUrl: doc.docUrl,
      }));
      if (documentsToKeep.length > 0) {
        formDataToSend.append('existingDocuments', JSON.stringify(documentsToKeep));
      }

      // Add new document files
      const documentNames = [];
      newDocuments.forEach((doc) => {
        if (doc.file) {
          formDataToSend.append('documents', doc.file);
          // Use only user-entered name (validation ensures it's provided)
          documentNames.push(doc.name);
        }
      });
      if (documentNames.length > 0) {
        formDataToSend.append('documentNames', JSON.stringify(documentNames));
      }

      const response = await fetch(`${API_BASE_URL_V1}/organizations/${id}`, {
        method: 'PUT',
        headers: {
          // Don't set Content-Type header - browser will set it with boundary for FormData
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update organization");
      }

      setSuccess(true);
      setError("");

      // Redirect after successful update
      setTimeout(() => {
        navigate("/dashboard/organizations");
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
            <Typography color="blue-gray" className="mt-4">Loading organization details...</Typography>
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
            onClick={() => navigate("/dashboard/organizations")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Organization Details</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-xl bg-white/40 rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          <CardBody className="p-6 md:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <Typography variant="h3" className="text-gray-800 mb-2 font-bold">
                Edit Organization Profile
              </Typography>
              <Typography variant="small" className="text-gray-500">
                Update the organization details below
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
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.email
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative z-10">
                          <Input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="organization@example.com"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
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
                        <div className="relative z-10">
                          <Input
                            id="password"
                            type="text"
                            name="password"
                            value={formData.password}
                            readOnly
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none cursor-not-allowed"
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
                        <div className="relative z-10">
                          <Input
                            id="newPassword"
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
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
                        <div className="relative z-10">
                          <Input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
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

              {/* Organization Information Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("organization")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <BuildingOffice2Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Organization Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Basic organization details
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.organization ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.organization && (
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="orgName" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <BuildingOffice2Icon className="w-4 h-4 text-gray-400" />
                        Organization Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.orgName
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative z-10">
                          <Input
                            id="orgName"
                            type="text"
                            name="orgName"
                            value={formData.orgName}
                            onChange={handleChange}
                            placeholder="Enter organization name"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
                          />
                        </div>
                      </div>
                      {errors.orgName && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.orgName}
                        </Typography>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="orgType" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <BuildingOffice2Icon className="w-4 h-4 text-gray-400" />
                        Organization Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.orgType
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative z-10">
                          <Select
                            value={formData.orgType}
                            onChange={handleSelectChange}
                            labelProps={{ className: "hidden" }}
                            className="bg-transparent"
                          >
                            <Option value="">Select organization type</Option>
                            <Option value="nonprofit">Nonprofit Organization</Option>
                            <Option value="shelter">Homeless Shelter</Option>
                            <Option value="food_bank">Food Bank / Soup Kitchen</Option>
                            <Option value="employment_agency">Employment Agency</Option>
                            <Option value="merchant">Local Business / Merchant</Option>
                            <Option value="government">Government Service</Option>
                            {/* Legacy options for backward compatibility */}
                            <Option value="NGO">NGO</Option>
                            <Option value="Private">Private</Option>
                            <Option value="Govt">Govt</Option>
                          </Select>
                        </div>
                      </div>
                      {errors.orgType && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.orgType}
                        </Typography>
                      )}
                    </div>

                    {/* Logo Upload */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <BuildingOffice2Icon className="w-4 h-4 text-gray-400" />
                        Organization Logo <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          id="logo"
                          accept="image/*"
                          onChange={handleLogoChange}
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor="logo"
                          className="cursor-pointer"
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
                          ) : existingLogo ? (
                            <div className="relative">
                              <img
                                src={existingLogo}
                                alt="Current logo"
                                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300"
                              />
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs">Click to replace</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                              <PhotoIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </label>
                        <div className="flex-1">
                          <Typography variant="small" className="text-xs text-gray-500">
                            {existingLogo && !logoPreview ? 'Current logo shown. Click to upload a new logo.' : 'Click to upload organization logo (JPG, PNG, GIF, WEBP)'}
                          </Typography>
                          <Typography variant="small" className="text-xs text-gray-400 mt-1">
                            Maximum file size: 5MB
                          </Typography>
                        </div>
                      </div>
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
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                      <MapPinIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Address Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Physical location details
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
                        <div className="relative z-10">
                          <Input
                            id="streetAddress"
                            type="text"
                            name="streetAddress"
                            value={formData.streetAddress}
                            onChange={handleChange}
                            placeholder="123 Main Street"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
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
                        <div className="relative z-10">
                          <Input
                            id="city"
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
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
                        <div className="relative z-10">
                          <Input
                            id="state"
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="State"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
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
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.zipCode
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative z-10">
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
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
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
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.country
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative z-10">
                          <Input
                            id="country"
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Country"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
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

              {/* Contact Information Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("contact")}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <Typography variant="h6" className="text-gray-800 font-semibold">
                        Contact Information
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        Contact person and communication details
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
                      <label htmlFor="contactPerson" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        Contact Person
                      </label>
                      <div className="relative rounded-lg group">
                        <div className="absolute inset-0 rounded-lg border border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30 transition-all duration-300 ease-in-out pointer-events-none" />
                        <div className="relative z-10">
                          <Input
                            id="contactPerson"
                            type="text"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            placeholder="John Doe"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contactEmail" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        Contact Email
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.contactEmail
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative z-10">
                          <Input
                            id="contactEmail"
                            type="email"
                            name="contactEmail"
                            value={formData.contactEmail}
                            onChange={handleChange}
                            placeholder="contact@example.com"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
                          />
                        </div>
                      </div>
                      {errors.contactEmail && (
                        <Typography variant="small" color="red" className="text-xs mt-1">
                          {errors.contactEmail}
                        </Typography>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        Contact Phone
                      </label>
                      <div className="relative rounded-lg group">
                        <div className={`absolute inset-0 rounded-lg border transition-all duration-300 ease-in-out pointer-events-none ${errors.contactPhone
                            ? "border-red-300 bg-white/90 shadow-sm group-focus-within:border-red-500 group-focus-within:ring-2 group-focus-within:ring-red-500/30"
                            : "border-gray-400 bg-white/90 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500/30"
                          }`} />
                        <div className="relative z-10">
                          <Input
                            id="contactPhone"
                            type="tel"
                            name="contactPhone"
                            value={formData.contactPhone}
                            onChange={handleChange}
                            placeholder="(555) 123-4567"
                            labelProps={{ className: "hidden" }}
                            containerProps={{ className: "min-w-0" }}
                            className="relative bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:shadow-none border-none"
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
                  </div>
                )}
              </div>

              {/* Organization Photos Section */}
              <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/80 overflow-hidden">
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
                        Organization Photos
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs mt-0.5">
                        View and manage your organization photos (max 5)
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.photos ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.photos && (
                  <div className="p-5 pt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Existing Photos */}
                      {existingPhotos.map((photo) => (
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
                                value={photo.photoName}
                                onChange={(e) => handlePhotoNameChange(photo.id, e.target.value)}
                                placeholder="e.g., Office Building"
                                labelProps={{ className: "hidden" }}
                                containerProps={{ className: "min-w-0" }}
                                className={`bg-white text-sm ${errors[`existingPhotoName_${photo.id}`] ? 'border-red-300' : ''}`}
                              />
                              {errors[`existingPhotoName_${photo.id}`] && (
                                <Typography variant="small" color="red" className="text-xs mt-1">
                                  {errors[`existingPhotoName_${photo.id}`]}
                                </Typography>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Photo
                              </label>
                              <img
                                src={getOrganizationEditFileUrl(photo.photoUrl)}
                                alt={photo.photoName || "Organization photo"}
                                className="w-full h-32 object-cover rounded border border-gray-200"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* New Photos */}
                      {newPhotos.map((photo) => (
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

                    {(existingPhotos.length + newPhotos.length) < 5 && (
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

                    <Typography variant="small" className="text-xs text-gray-500">
                      Supported formats: Images (JPG, PNG, GIF, WEBP). Max file size: 5MB per file. Maximum 5 photos allowed.
                    </Typography>
                  </div>
                )}
              </div>

              {/* Verification Documents Section */}
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
                        View and manage your verification documents (max 3)
                      </Typography>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openSections.documents ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {openSections.documents && (
                  <div className="p-5 pt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Existing Documents */}
                      {existingDocuments.map((doc) => (
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
                                value={doc.docName}
                                onChange={(e) => handleDocumentNameChange(doc.id, e.target.value)}
                                placeholder="e.g., Registration Certificate"
                                labelProps={{ className: "hidden" }}
                                containerProps={{ className: "min-w-0" }}
                                className={`bg-white text-sm ${errors[`existingDocumentName_${doc.id}`] ? 'border-red-300' : ''}`}
                              />
                              {errors[`existingDocumentName_${doc.id}`] && (
                                <Typography variant="small" color="red" className="text-xs mt-1">
                                  {errors[`existingDocumentName_${doc.id}`]}
                                </Typography>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Document
                              </label>
                              <div className="w-full h-32 bg-gray-100 rounded border border-gray-200 flex items-center justify-center relative overflow-hidden">
                                {doc.docUrl && (doc.docUrl.toLowerCase().endsWith('.pdf') || doc.docUrl.toLowerCase().includes('pdf')) ? (
                                  <div className="text-center p-4">
                                    <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <Typography variant="small" className="text-gray-600 text-xs">
                                      PDF Document
                                    </Typography>
                                    <a
                                      href={getOrganizationEditFileUrl(doc.docUrl)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700 text-xs underline mt-1 inline-block"
                                    >
                                      View Document
                                    </a>
                                  </div>
                                ) : (
                                  <>
                                    <img
                                      src={getOrganizationEditFileUrl(doc.docUrl)}
                                      alt={doc.docName || "Document"}
                                      className="w-full h-32 object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        const fallback = e.target.nextElementSibling;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                    <div style={{ display: 'none' }} className="absolute inset-0 flex items-center justify-center text-center p-4 bg-gray-100">
                                      <div>
                                        <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <a
                                          href={getOrganizationEditFileUrl(doc.docUrl)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-700 text-xs underline"
                                        >
                                          View Document
                                        </a>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* New Documents */}
                      {newDocuments.map((doc) => (
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

                    {(existingDocuments.length + newDocuments.length) < 3 && (
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

                    <Typography variant="small" className="text-xs text-gray-500">
                      Supported formats: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX). Max file size: 5MB per file. Maximum 3 documents allowed.
                    </Typography>
                  </div>
                )}


              </div>
              {/* Success/Error Messages */}
              {success && (
                <Alert color="green" className="mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5" />
                    Organization updated successfully! Redirecting...
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
                  onClick={() => navigate('/dashboard/organizations')}
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
                  {loading ? "Updating..." : "Update Organization"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

