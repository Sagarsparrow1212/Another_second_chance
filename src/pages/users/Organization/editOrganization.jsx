import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Lock,
  Mail,
  Phone,
  User,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  FileText,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { API_BASE_URL_V1, getFileUrl, getUploadUrl } from "@/configs/api";
import LogoLoader from "@/components/LogoLoader";

export function EditOrganization() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    const limitedNumber = phoneNumber.slice(0, 10);
    if (limitedNumber.length === 0) return "";
    if (limitedNumber.length <= 3) return `(${limitedNumber}`;
    if (limitedNumber.length <= 6) return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6, 10)}`;
  };

  const getOrgFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    if (filePath.startsWith("/uploads")) return getFileUrl(filePath);
    return getUploadUrl("organizations", filePath);
  };

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        setFetching(true);
        setError("");
        const sessionData = localStorage.getItem("auth_session");
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const res = await fetch(`${API_BASE_URL_V1}/organizations/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!res.ok) throw new Error("Failed to fetch organization details");

        const data = await res.json();
        if (data.success) {
          const org = data.data;
          setFormData({
            email: org.email || org.userEmail || "",
            password: org.hasPassword ? "••••••••" : "",
            newPassword: "",
            confirmPassword: "",
            orgName: org.name || org.orgName || "",
            orgType: org.orgType || "",
            streetAddress: org.streetAddress || "",
            city: org.city || "",
            state: org.state || "",
            zipCode: org.zipCode || "",
            country: org.country || "United States",
            contactPerson: org.contactPerson || "",
            contactEmail: org.contactEmail || "",
            contactPhone: org.contactPhone || "",
          });

          if (org.photos && Array.isArray(org.photos)) {
            setExistingPhotos(
              org.photos.map((p, i) => ({
                id: `existing-photo-${i}`,
                photoName: p.photoName || `Photo ${i + 1}`,
                photoUrl: p.photoUrl || p.url || p,
              }))
            );
          }

          if (org.documents && Array.isArray(org.documents)) {
            setExistingDocuments(
              org.documents.map((d, i) => ({
                id: `existing-doc-${i}`,
                docName: d.docName || `Document ${i + 1}`,
                docUrl: d.docUrl || d.url || d,
              }))
            );
          }

          if (org.logoUrl) {
            setLogoPreview(getOrgFileUrl(org.logoUrl));
          }
        }
      } catch (err) {
        console.error("Fetch org error:", err);
        setError(err.message || "Failed to load organization");
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchOrg();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "contactPhone") formattedValue = formatPhoneNumber(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo exceeds 5MB limit");
      return;
    }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  // Photo handlers
  const handlePhotoAdd = () => {
    if (existingPhotos.length + newPhotos.length >= 5) {
      setError("Maximum 5 organization photos allowed");
      return;
    }
    setNewPhotos((p) => [...p, { id: Date.now(), name: "", file: null, preview: null }]);
  };

  const handleRemoveExistingPhoto = (id) => {
    setExistingPhotos((p) => p.filter((x) => x.id !== id));
  };

  const handleRemoveNewPhoto = (id) => {
    setNewPhotos((p) => p.filter((x) => x.id !== id));
  };

  // Document handlers
  const handleDocumentAdd = () => {
    if (existingDocuments.length + newDocuments.length >= 3) {
      setError("Maximum 3 verification documents allowed");
      return;
    }
    setNewDocuments((d) => [...d, { id: Date.now(), name: "", file: null, preview: null }]);
  };

  const handleRemoveExistingDoc = (id) => {
    setExistingDocuments((d) => d.filter((x) => x.id !== id));
  };

  const handleRemoveNewDoc = (id) => {
    setNewDocuments((d) => d.filter((x) => x.id !== id));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.orgName.trim()) newErrors.orgName = "Organization name is required";
    if (!formData.orgType) newErrors.orgType = "Organization type is required";
    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";

    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mapOrgTypeToLegacy = (orgType) => {
    const map = {
      nonprofit: "NGO",
      shelter: "NGO",
      food_bank: "NGO",
      employment_agency: "Private",
      merchant: "Private",
      government: "Govt",
    };
    return map[orgType] || orgType;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const formDataToSend = new FormData();
      formDataToSend.append("orgName", formData.orgName);
      formDataToSend.append("orgType", mapOrgTypeToLegacy(formData.orgType));
      formDataToSend.append("streetAddress", formData.streetAddress);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("zipCode", formData.zipCode);
      formDataToSend.append("country", formData.country || "United States");
      formDataToSend.append("contactPerson", formData.contactPerson || "");
      formDataToSend.append("contactEmail", formData.contactEmail || "");
      formDataToSend.append("contactPhone", formData.contactPhone || "");
      formDataToSend.append("email", formData.email);

      if (logo) formDataToSend.append("logo", logo);

      if (formData.newPassword && formData.newPassword.trim() !== "") {
        formDataToSend.append("password", formData.newPassword);
      }

      // Photos
      const photosToKeep = existingPhotos.map((p) => ({
        photoName: p.photoName,
        photoUrl: p.photoUrl,
      }));
      if (photosToKeep.length > 0) {
        formDataToSend.append("existingPhotos", JSON.stringify(photosToKeep));
      }

      const photoNames = [];
      newPhotos.forEach((p) => {
        if (p.file) {
          formDataToSend.append("photos", p.file);
          photoNames.push(p.name || "Facility Photo");
        }
      });
      if (photoNames.length > 0) {
        formDataToSend.append("photoNames", JSON.stringify(photoNames));
      }

      // Documents
      const docsToKeep = existingDocuments.map((d) => ({
        docName: d.docName,
        docUrl: d.docUrl,
      }));
      if (docsToKeep.length > 0) {
        formDataToSend.append("existingDocuments", JSON.stringify(docsToKeep));
      }

      const docNames = [];
      newDocuments.forEach((d) => {
        if (d.file) {
          formDataToSend.append("documents", d.file);
          docNames.push(d.name || "Verification Document");
        }
      });
      if (docNames.length > 0) {
        formDataToSend.append("documentNames", JSON.stringify(docNames));
      }

      const res = await fetch(`${API_BASE_URL_V1}/organizations/${id}`, {
        method: "PUT",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formDataToSend,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update organization");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard/organizations"), 600);
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update organization profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LogoLoader message="Loading organization details..." />;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#E7ECF2] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#E7ECF2] text-[#68778D] hover:text-[#172033] hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#68778D]" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-6 w-px bg-[#E7ECF2]" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#172033] leading-tight">
              Edit Organization: {formData.orgName || "Profile"}
            </h1>
            <p className="text-xs text-[#68778D]">Update verified charity organization profile and credentials</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="font-medium flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-rose-600 p-1">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold flex-1">Organization profile updated successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-[1040px] mx-auto space-y-5">
        {/* Card 1: Identity & Logo */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Organization Identity & Logo</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2]">
            <input
              type="file"
              id="edit-org-logo"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <label htmlFor="edit-org-logo" className="cursor-pointer relative flex-shrink-0">
              {logoPreview ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E7ECF2] bg-white">
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeLogo();
                    }}
                    className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-white flex flex-col items-center justify-center text-[#2878E5]">
                  <UploadCloud className="w-6 h-6 mb-1 text-[#2878E5]" />
                  <span className="text-[10px] font-bold">Logo</span>
                </div>
              )}
            </label>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="text-xs font-bold text-[#172033]">Organization Logo</h3>
              <p className="text-xs text-[#68778D]">Click the box to update official organization logo (JPG, PNG &lt; 5MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#172033]">
                Legal Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="orgName"
                value={formData.orgName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
              {errors.orgName && <p className="text-[11px] text-rose-500">{errors.orgName}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">
                Organization Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="orgType"
                value={formData.orgType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              >
                <option value="">Select Organization Type</option>
                <option value="nonprofit">Nonprofit Organization</option>
                <option value="shelter">Homeless Shelter</option>
                <option value="food_bank">Food Bank / Soup Kitchen</option>
                <option value="employment_agency">Employment Agency</option>
                <option value="merchant">Local Business / Merchant</option>
                <option value="government">Government Service</option>
                <option value="NGO">NGO (Legacy)</option>
                <option value="Private">Private (Legacy)</option>
                <option value="Govt">Govt (Legacy)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Primary Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Emergency / Public Inquiries Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Physical Address */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Headquarters Address</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#172033]">
                Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
              {errors.streetAddress && <p className="text-[11px] text-rose-500">{errors.streetAddress}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
              {errors.city && <p className="text-[11px] text-rose-500">{errors.city}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
              {errors.state && <p className="text-[11px] text-rose-500">{errors.state}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Photos Management */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7ECF2]">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#2878E5]" />
              <h2 className="text-sm font-bold text-[#172033]">Facility Photos</h2>
            </div>
            <span className="text-xs text-[#68778D]">
              {existingPhotos.length + newPhotos.length} / 5 photos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Existing Photos */}
            {existingPhotos.map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-[#FAFBFD] border border-[#E7ECF2] rounded-xl relative space-y-1.5 group"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveExistingPhoto(p.id)}
                  className="absolute top-2 right-2 p-1 bg-white/90 text-rose-600 rounded-lg shadow-sm hover:bg-rose-50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="h-28 rounded-lg overflow-hidden bg-slate-100 border border-[#E7ECF2]">
                  <img
                    src={getOrgFileUrl(p.photoUrl)}
                    alt={p.photoName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-semibold text-[#172033] truncate">{p.photoName}</p>
              </div>
            ))}

            {/* New Photos */}
            {newPhotos.map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-[#FAFBFD] border border-[#2878E5]/30 rounded-xl relative space-y-1.5"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveNewPhoto(p.id)}
                  className="absolute top-2 right-2 p-1 bg-white text-rose-600 rounded-lg shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  placeholder="Photo Title"
                  value={p.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, name } : x)));
                  }}
                  className="w-full px-2 py-1 text-xs bg-white border border-[#E7ECF2] rounded-lg"
                />
                {p.preview ? (
                  <div className="h-24 rounded-lg overflow-hidden border border-[#E7ECF2]">
                    <img src={p.preview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <label className="h-24 flex flex-col items-center justify-center border border-dashed border-[#2878E5]/40 rounded-lg bg-white cursor-pointer hover:bg-blue-50/30">
                    <UploadCloud className="w-5 h-5 text-[#2878E5] mb-1" />
                    <span className="text-[11px] font-semibold text-[#2878E5]">Select Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const preview = URL.createObjectURL(file);
                          setNewPhotos((prev) =>
                            prev.map((x) => (x.id === p.id ? { ...x, file, preview } : x))
                          );
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ))}

            {existingPhotos.length + newPhotos.length < 5 && (
              <button
                type="button"
                onClick={handlePhotoAdd}
                className="h-full min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-[#E7ECF2] hover:border-[#2878E5] rounded-xl text-[#68778D] hover:text-[#2878E5] hover:bg-blue-50/20 transition-all p-3"
              >
                <Plus className="w-5 h-5 mb-1 text-[#2878E5]" />
                <span className="text-xs font-bold">Add Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Security Update */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Password Update (Optional)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-[11px] text-rose-500">{errors.newPassword}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-500">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard/organizations")}
            className="px-5 py-2.5 rounded-xl border border-[#E7ECF2] text-xs font-semibold text-[#68778D] hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#2878E5] hover:bg-[#1d6cd4] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? "Saving Changes..." : "Save Organization Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditOrganization;
