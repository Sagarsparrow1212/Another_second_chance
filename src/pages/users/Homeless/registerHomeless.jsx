import { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  UserIcon,
  PhotoIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL_V1, API_BASE_URL } from "@/configs/api";
import "./registerHomeless.css";

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


export function RegisterHomeless() {
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isOrganizationLocked, setIsOrganizationLocked] = useState(false);
  const [selectKey, setSelectKey] = useState(0); // Force re-render of Select component

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    profile: true,
    personal: true,
    skills: true,
    location: true,
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
    username: "",
    password: "",
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
    verificationDocument: null,
    organizationCutPercentage: "",
    agreeToTerms: false,
    organizationId: "",
  });

  const [documentPreview, setDocumentPreview] = useState(null);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch organizations for dropdown
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

          // If organizationId is provided in params, find and set it
          if (organizationId) {
            // Convert to string for comparison
            const orgIdStr = String(organizationId);
            console.log('Looking for organization with ID:', orgIdStr);
            console.log('Available organizations:', data.data.organizations.map(o => ({ id: o.id, name: o.name })));

            const org = data.data.organizations.find(o => {
              const orgId = String(o.id);
              return orgId === orgIdStr;
            });

            if (org) {
              console.log('Found organization:', org);
              setSelectedOrganization(org);
              setIsOrganizationLocked(true);
              // Set the organizationId in formData after organizations are loaded
              setFormData(prev => {
                console.log('Setting organizationId in formData:', orgIdStr);
                return { ...prev, organizationId: orgIdStr };
              });
              // Force Select component to remount
              setSelectKey(prev => prev + 1);
            } else {
              console.warn(`Organization with ID ${organizationId} not found`);
              setError(`Organization not found. Please select an organization manually.`);
            }
          }
        }
      } catch (err) {
        console.error('Fetch organizations error:', err);
        setError('Failed to load organizations. Please refresh the page.');
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, [organizationId]);

  // Force update when organization is found and set
  useEffect(() => {
    if (organizationId && organizations.length > 0 && !formData.organizationId) {
      const orgIdStr = String(organizationId);
      const org = organizations.find(o => String(o.id) === orgIdStr);
      if (org) {
        console.log('Force setting organization in useEffect:', orgIdStr);
        setSelectedOrganization(org);
        setIsOrganizationLocked(true);
        setFormData(prev => {
          if (prev.organizationId !== orgIdStr) {
            return { ...prev, organizationId: orgIdStr };
          }
          return prev;
        });
        // Force Select component to remount
        setSelectKey(prev => prev + 1);
      }
    }
  }, [organizationId, organizations, formData.organizationId]);

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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        verificationDocument: file,
      }));

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreview(file.name);
      }
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePreview(null);
  };

  const removeDocument = () => {
    setFormData((prev) => ({
      ...prev,
      verificationDocument: null,
    }));
    setDocumentPreview(null);
  };



  const validateForm = () => {
    const newErrors = {};

    if (!formData.organizationId) {
      newErrors.organizationId = "Organization is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else {
      const usernameRegex = /^(?![0-9]+$)(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]{3,30}$/;
      if (!usernameRegex.test(formData.username.trim())) {
        newErrors.username = "Username must be 3-30 characters, can contain letters, numbers, dots, and underscores. Cannot be all digits, cannot start/end with a dot, and cannot have consecutive dots.";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.age) {
      newErrors.age = "Age is required";
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 10 || ageNum > 90) {
        newErrors.age = "Age must be between 10 and 90";
      }
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (formData.skillset.length === 0) {
      newErrors.skillset = "Please select at least one skill";
    }

    if (formData.organizationCutPercentage) {
      const cp = parseFloat(String(formData.organizationCutPercentage));
      if (isNaN(cp) || cp < 0 || cp > 100) {
        newErrors.organizationCutPercentage = "Commission percentage must be between 0 and 100";
      }
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
      formDataToSend.append("username", formData.username.trim().toLowerCase());
      formDataToSend.append("password", formData.password);
      formDataToSend.append("organizationId", formData.organizationId);
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("skillset", JSON.stringify(formData.skillset));
      formDataToSend.append("experience", formData.experience || "");
      formDataToSend.append("location", formData.location || "");
      formDataToSend.append("address", formData.address || "");
      if (formData.contactPhone) {
        formDataToSend.append("contactPhone", formData.contactPhone);
      }
      if (formData.contactEmail) {
        formDataToSend.append("contactEmail", formData.contactEmail);
      }
      formDataToSend.append("bio", formData.bio || "");
      formDataToSend.append("languages", JSON.stringify(formData.languages));
      if (formData.healthConditions) {
        formDataToSend.append("healthConditions", formData.healthConditions);
      }
      if (formData.organizationCutPercentage !== "" && formData.organizationCutPercentage !== null && formData.organizationCutPercentage !== undefined) {
        formDataToSend.append("organizationCutPercentage", String(formData.organizationCutPercentage));
      }
      if (profilePicture) {
        formDataToSend.append("profilePicture", profilePicture);
      }
      if (formData.verificationDocument) {
        formDataToSend.append("verificationDocument", formData.verificationDocument);
      }

      const response = await fetch(`${API_BASE_URL_V1}/homeless/register`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        let errorMessage = "Failed to register";
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
        throw new Error(data.message || "Failed to register");
      }

      setSuccess(true);
      setError("");

      setTimeout(() => {
        navigate("/dashboard/homeless");
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
    <div className="register-homeless-container">
      <div className="register-homeless-wrapper">
        {/* Back Button */}
        <div className="back-button-container">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="back-button-icon" />
            <span className="back-button-text">Back</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="main-card">
          <div className="card-body">
            {/* Header */}
            <div className="header-section">
              <h1 className="header-title">Register as Homeless User</h1>
              <p className="header-subtitle">Fill in your details to create your profile</p>
            </div>



            <form onSubmit={handleSubmit} className="register-form">
              {/* Profile Picture Section */}
              <div className="form-section">
                <button
                  type="button"
                  onClick={() => toggleSection("profile")}
                  className="section-header"
                >
                  <div className="section-header-content">
                    <div className="section-icon-wrapper">
                      <PhotoIcon className="section-icon" />
                    </div>
                    <div>
                      <h2 className="section-title">Profile Picture</h2>
                      <p className="section-subtitle">Upload your profile photo</p>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`chevron-icon ${openSections.profile ? "rotated" : ""}`}
                  />
                </button>

                {openSections.profile && (
                  <div className="section-content">
                    <div className="profile-picture-container">
                      <input
                        type="file"
                        id="profilePicture"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="profilePicture"
                        className="profile-picture-label"
                      >
                        {profilePreview ? (
                          <div className="profile-picture-wrapper">
                            <img
                              src={profilePreview}
                              alt="Profile preview"
                              className="profile-picture-preview"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProfilePicture();
                              }}
                              className="profile-picture-close-btn"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="profile-picture-upload-area">
                            <PhotoIcon style={{ width: '3rem', height: '3rem', color: '#9ca3af' }} />
                          </div>
                        )}
                      </label>
                      <p className="help-text profile-picture-help-text">
                        Click to upload profile picture
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Information Section */}
              <div className="form-section">
                <button
                  type="button"
                  onClick={() => toggleSection("personal")}
                  className="section-header"
                >
                  <div className="section-header-content">
                    <div className="section-icon-wrapper">
                      <UserIcon className="section-icon" />
                    </div>
                    <div>
                      <h2 className="section-title">Personal Information</h2>
                      <p className="section-subtitle">Your basic personal details</p>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`chevron-icon ${openSections.personal ? "rotated" : ""}`}
                  />
                </button>

                {openSections.personal && (
                  <div className="section-content">
                    <div className="form-grid">
                      <div className="form-field form-field-full">
                        <label htmlFor="organizationId" className="form-label">
                          <BuildingOffice2Icon className="label-icon" />
                          Organization <span className="required-asterisk">*</span>
                          {isOrganizationLocked && (
                            <span className="pre-selected-badge">(Pre-selected)</span>
                          )}
                        </label>
                        <div className="select-wrapper">
                          <div className={`select-overlay ${errors.organizationId ? 'error' : ''}`} />
                          <div className="select-inner">
                            {loadingOrgs ? (
                              <div className="loading-text">Loading organizations...</div>
                            ) : isOrganizationLocked && selectedOrganization ? (
                              <div className="readonly-display">
                                {selectedOrganization.name} {selectedOrganization.city && selectedOrganization.state ? `(${selectedOrganization.city}, ${selectedOrganization.state})` : ''}
                              </div>
                            ) : (
                              <select
                                key={`org-select-${selectKey}-${formData.organizationId || 'empty'}-${isOrganizationLocked}`}
                                id="organizationId"
                                value={formData.organizationId ? String(formData.organizationId) : ""}
                                onChange={(e) => {
                                  if (!isOrganizationLocked) {
                                    const value = e.target.value;
                                    const orgId = value || "";
                                    setFormData(prev => ({ ...prev, organizationId: orgId }));
                                    const org = organizations.find(o => String(o.id) === String(value));
                                    setSelectedOrganization(org);
                                    if (errors.organizationId) {
                                      setErrors(prev => ({ ...prev, organizationId: "" }));
                                    }
                                  }
                                }}
                                disabled={isOrganizationLocked || loadingOrgs}
                                className="select-field"
                                style={{ zIndex: 20 }}
                              >
                                {organizations.length === 0 ? (
                                  <option value="" disabled>No organizations available</option>
                                ) : (
                                  <>
                                    {!isOrganizationLocked && <option value="">Select an organization</option>}
                                    {organizations.map((org) => (
                                      <option key={String(org.id)} value={String(org.id)}>
                                        {org.name} {org.city && org.state ? `(${org.city}, ${org.state})` : ''}
                                      </option>
                                    ))}
                                  </>
                                )}
                              </select>
                            )}
                          </div>
                        </div>
                        {errors.organizationId && (
                          <div className="error-message">{errors.organizationId}</div>
                        )}
                        <p className="help-text">
                          {isOrganizationLocked
                            ? "Organization is pre-selected from the organization details page"
                            : "Select the organization this homeless individual belongs to"}
                        </p>
                      </div>

                      <div className="form-field">
                        <label htmlFor="username" className="form-label">
                          Username <span className="required-asterisk">*</span>
                        </label>
                        <div className="input-wrapper">
                          <div className={`input-overlay ${errors.username ? 'error' : ''}`} />
                          <div className="input-inner">
                            <input
                              id="username"
                              type="text"
                              name="username"
                              value={formData.username}
                              onChange={handleChange}
                              placeholder="Enter username"
                              className="input-field"
                            />
                          </div>
                        </div>
                        {errors.username && (
                          <div className="error-message">{errors.username}</div>
                        )}
                        <p className="help-text">
                          3-30 characters. Letters, numbers, dots, and underscores allowed. Cannot be all digits, cannot start/end with a dot.
                        </p>
                      </div>

                      <div className="form-field">
                        <label htmlFor="password" className="form-label">
                          Password <span className="required-asterisk">*</span>
                        </label>
                        <div className="input-wrapper">
                          <div className={`input-overlay ${errors.password ? 'error' : ''}`} />
                          <div className="input-inner" style={{ position: 'relative' }}>
                            <input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              placeholder="Enter password"
                              className="input-field"
                              style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="password-toggle"
                            >
                              {showPassword ? (
                                <EyeSlashIcon className="password-toggle-icon" />
                              ) : (
                                <EyeIcon className="password-toggle-icon" />
                              )}
                            </button>
                          </div>
                        </div>
                        {errors.password && (
                          <div className="error-message">{errors.password}</div>
                        )}
                        <p className="help-text">Must be at least 8 characters long</p>
                      </div>

                      <div className="form-field form-field-full">
                        <label htmlFor="fullName" className="form-label">
                          Full Name <span className="required-asterisk">*</span>
                        </label>
                        <div className="input-wrapper">
                          <div className={`input-overlay ${errors.fullName ? 'error' : ''}`} />
                          <div className="input-inner">
                            <input
                              id="fullName"
                              type="text"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleChange}
                              placeholder="Enter your full name"
                              className="input-field"
                            />
                          </div>
                        </div>
                        {errors.fullName && (
                          <div className="error-message">{errors.fullName}</div>
                        )}
                      </div>

                      <div className="form-field">
                        <label htmlFor="age" className="form-label">
                          Age <span className="required-asterisk">*</span>
                        </label>
                        <div className="input-wrapper">
                          <div className={`input-overlay ${errors.age ? 'error' : ''}`} />
                          <div className="input-inner">
                            <input
                              id="age"
                              type="number"
                              name="age"
                              value={formData.age}
                              onChange={handleChange}
                              placeholder="Enter age"
                              min="10"
                              max="90"
                              className="input-field"
                            />
                          </div>
                        </div>
                        {errors.age && (
                          <div className="error-message">{errors.age}</div>
                        )}
                        <p className="help-text">Age must be between 10 and 90</p>
                      </div>

                      <div className="form-field">
                        <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                          Gender <span className="required-asterisk">*</span>
                        </label>
                        <div className="radio-group">
                          {["Male", "Female", "Prefer not to say"].map((gender) => (
                            <label key={gender} className="radio-option">
                              <input
                                type="radio"
                                name="gender"
                                value={gender}
                                checked={formData.gender === gender}
                                onChange={handleChange}
                                className="radio-input"
                              />
                              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{gender}</span>
                            </label>
                          ))}
                        </div>
                        {errors.gender && (
                          <div className="error-message">{errors.gender}</div>
                        )}
                      </div>

                      <div className="form-field form-field-full">
                        <label htmlFor="bio" className="form-label">
                          Short Bio / Description
                        </label>
                        <div className="input-wrapper">
                          <div className={`input-overlay ${errors.bio ? 'error' : ''}`} />
                          <div className="input-inner">
                            <textarea
                              id="bio"
                              name="bio"
                              value={formData.bio}
                              onChange={handleChange}
                              placeholder="Tell us about your background, needs, or abilities..."
                              rows={4}
                              className="textarea-field"
                            />
                          </div>
                        </div>
                        <p className="help-text">Optional: Share your story, skills, or what you need help with</p>
                      </div>

                      <div className="form-field" style={{ maxWidth: '12rem' }}>
                        <label htmlFor="organizationCutPercentage" className="form-label">
                          Commission Cut (%)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="input-wrapper" style={{ flex: '1', minWidth: '0' }}>
                            <div className={`input-overlay ${errors.organizationCutPercentage ? 'error' : ''}`} />
                            <div className="input-inner">
                              <input
                                id="organizationCutPercentage"
                                type="text"
                                name="organizationCutPercentage"
                                value={formData.organizationCutPercentage}
                                onChange={handleChange}
                                placeholder="10"
                                className="input-field"
                              />
                            </div>
                          </div>
                          <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>%</span>
                        </div>
                        {errors.organizationCutPercentage && (
                          <div className="error-message">{errors.organizationCutPercentage}</div>
                        )}
                        <p className="help-text">Optional: enter commission percentage (0-100)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills & Experience Section */}
              <div className="form-section">
                <button
                  type="button"
                  onClick={() => toggleSection("skills")}
                  className="section-header"
                >
                  <div className="section-header-content">
                    <div className="section-icon-wrapper">
                      <DocumentTextIcon className="section-icon" />
                    </div>
                    <div>
                      <h2 className="section-title">Skills & Experience</h2>
                      <p className="section-subtitle">Your skills and work experience</p>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`chevron-icon ${openSections.skills ? "rotated" : ""}`}
                  />
                </button>

                {openSections.skills && (
                  <div className="section-content">
                    <div className="form-grid">
                      <div className="form-field form-field-full">
                        <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                          Skillset <span className="required-asterisk">*</span>
                        </label>
                        <div className="checkbox-grid">
                          {SKILLS_OPTIONS.map((skill) => (
                            <label key={skill} className="checkbox-option">
                              <input
                                type="checkbox"
                                checked={formData.skillset.includes(skill)}
                                onChange={() => handleMultiSelect("skillset", skill)}
                                className="checkbox-input"
                              />
                              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{skill}</span>
                            </label>
                          ))}
                        </div>
                        {errors.skillset && (
                          <div className="error-message">{errors.skillset}</div>
                        )}
                      </div>

                      <div className="form-field form-field-full">
                        <label htmlFor="experience" className="form-label">
                          Experience
                        </label>
                        <div className="input-wrapper">
                          <div className="input-overlay" />
                          <div className="input-inner">
                            <input
                              id="experience"
                              type="text"
                              name="experience"
                              value={formData.experience}
                              onChange={handleChange}
                              placeholder="e.g., 5 years in construction, or describe your experience"
                              className="input-field"
                            />
                          </div>
                        </div>
                        <p className="help-text">Optional: Years of experience or description</p>
                      </div>

                      <div className="form-field form-field-full">
                        <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                          Languages Known
                        </label>
                        <div className="checkbox-grid">
                          {LANGUAGES_OPTIONS.map((language) => (
                            <label key={language} className="checkbox-option">
                              <input
                                type="checkbox"
                                checked={formData.languages.includes(language)}
                                onChange={() => handleMultiSelect("languages", language)}
                                className="checkbox-input"
                              />
                              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{language}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="form-field form-field-full">
                        <label htmlFor="healthConditions" className="form-label">
                          Health Conditions (Optional)
                        </label>
                        <div className="input-wrapper">
                          <div className="input-overlay" />
                          <div className="input-inner">
                            <textarea
                              id="healthConditions"
                              name="healthConditions"
                              value={formData.healthConditions}
                              onChange={handleChange}
                              placeholder="Any health conditions or special needs..."
                              rows={3}
                              className="textarea-field"
                            />
                          </div>
                        </div>
                        <p className="help-text">This information helps NGOs provide better care</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Location & Contact Section */}
              <div className="form-section">
                <button
                  type="button"
                  onClick={() => toggleSection("location")}
                  className="section-header"
                >
                  <div className="section-header-content">
                    <div className="section-icon-wrapper">
                      <MapPinIcon className="section-icon" />
                    </div>
                    <div>
                      <h2 className="section-title">Location & Contact</h2>
                      <p className="section-subtitle">Your location and contact information</p>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`chevron-icon ${openSections.location ? "rotated" : ""}`}
                  />
                </button>

                {openSections.location && (
                  <div className="section-content">
                    <div className="form-grid">
                      <div className="form-field form-field-full">
                        <label htmlFor="address" className="form-label">
                          Address
                        </label>
                        <div className="input-wrapper">
                          <div className="input-overlay" />
                          <div className="input-inner">
                            <input
                              id="address"
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="Enter your address"
                              className="input-field"
                            />
                          </div>
                        </div>
                        <p className="help-text">Optional: Manual address entry</p>
                      </div>

                      <div className="form-field">
                        <label htmlFor="contactPhone" className="form-label">
                          <PhoneIcon className="label-icon" />
                          Phone Number
                        </label>
                        <div className="input-wrapper">
                          <div className="input-overlay" />
                          <div className="input-inner">
                            <input
                              id="contactPhone"
                              type="tel"
                              name="contactPhone"
                              value={formData.contactPhone}
                              onChange={handleChange}
                              placeholder="+1 (555) 123-4567"
                              className="input-field"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-field">
                        <label htmlFor="contactEmail" className="form-label">
                          <EnvelopeIcon className="label-icon" />
                          Email Address
                        </label>
                        <div className="input-wrapper">
                          <div className="input-overlay" />
                          <div className="input-inner">
                            <input
                              id="contactEmail"
                              type="email"
                              name="contactEmail"
                              value={formData.contactEmail}
                              onChange={handleChange}
                              placeholder="email@example.com"
                              className="input-field"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Document Section */}
              <div className="form-section">
                <button
                  type="button"
                  onClick={() => toggleSection("documents")}
                  className="section-header"
                >
                  <div className="section-header-content">
                    <div className="section-icon-wrapper">
                      <DocumentTextIcon className="section-icon" />
                    </div>
                    <div>
                      <h2 className="section-title">Verification Document</h2>
                      <p className="section-subtitle">Upload ID if available (Aadhaar, local ID, etc.)</p>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`chevron-icon ${openSections.documents ? "rotated" : ""}`}
                  />
                </button>

                {openSections.documents && (
                  <div className="p-5 pt-0">
                    <input
                      type="file"
                      id="verificationDocument"
                      accept="image/*,.pdf"
                      onChange={handleDocumentChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="verificationDocument"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white/70 hover:bg-white/90 transition-colors"
                    >
                      {documentPreview ? (
                        <div className="relative w-full h-full">
                          {typeof documentPreview === "string" && documentPreview.startsWith("data:image") ? (
                            <img
                              src={documentPreview}
                              alt="Document preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="p-4 text-center">
                              <DocumentTextIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-xs text-gray-600">{documentPreview}</p>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDocument();
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
                )}
              </div>

              {/* Terms & Conditions Section */}
              <div className="form-section">
                <button
                  type="button"
                  onClick={() => toggleSection("terms")}
                  className="section-header"
                >
                  <div className="section-header-content">
                    <div className="section-icon-wrapper">
                      <DocumentTextIcon className="section-icon" />
                    </div>
                    <div>
                      <h2 className="section-title">Terms & Conditions</h2>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`chevron-icon ${openSections.terms ? "rotated" : ""}`}
                  />
                </button>

                {openSections.terms && (
                  <div className="section-content">
                    <label className="checkbox-option" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        className="checkbox-input"
                        style={{ marginTop: '0.25rem' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        I agree to the <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>Terms & Conditions</a>
                      </span>
                    </label>
                    {errors.agreeToTerms && (
                      <div className="error-message" style={{ marginTop: '0.5rem', marginLeft: '1.75rem' }}>
                        {errors.agreeToTerms}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Alerts */}
              {success && (
                <div className="alert alert-success">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    <span>Registration successful! Redirecting...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="alert-close"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}


              {/* Action Buttons */}
              <div className="button-group">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="button button-cancel"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.agreeToTerms}
                  className="button button-submit"
                  style={{ color: '#ffffff' }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                      <span className="loading-spinner"></span>
                      Processing...
                    </span>
                  ) : (
                    <span style={{ color: '#ffffff' }}>Register</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterHomeless;

