import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Building2,
  MapPin,
  Lock,
  Phone,
  Mail,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  FileText,
  Activity,
  Languages,
} from "lucide-react";
import { API_BASE_URL_V1, getFileUrl } from "@/configs/api";
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

const LANGUAGES_OPTIONS = ["English", "Spanish", "Other"];

export function EditHomeless() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const [organizations, setOrganizations] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [errors, setErrors] = useState({});

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    const limitedNumber = phoneNumber.slice(0, 10);
    if (limitedNumber.length === 0) return "";
    if (limitedNumber.length <= 3) return `(${limitedNumber}`;
    if (limitedNumber.length <= 6) return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6, 10)}`;
  };

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
        const token = sessionData ? JSON.parse(sessionData).token : null;
        const res = await fetch(`${API_BASE_URL_V1}/organizations?limit=1000`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setOrganizations(data.data.organizations || []);
        }
      } catch (err) {
        console.error("Fetch orgs error:", err);
      }
    };
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const fetchHomeless = async () => {
      try {
        setFetching(true);
        setError("");
        const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const res = await fetch(`${API_BASE_URL_V1}/homeless/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!res.ok) throw new Error("Failed to fetch beneficiary details");

        const data = await res.json();
        if (data.success) {
          const h = data.data.homeless || data.data;
          let orgId = "";
          if (h.organizationId) orgId = String(h.organizationId);
          else if (h.organization?.id) orgId = String(h.organization.id);

          setFormData({
            username: h.username || "",
            email: h.email || h.userEmail || "",
            password: h.hasPassword ? "••••••••" : "",
            newPassword: "",
            confirmPassword: "",
            fullName: h.fullName || h.name || "",
            age: h.age || "",
            gender: h.gender || "",
            skillset: h.skillset || h.skills || [],
            experience: h.experience || "",
            location: h.location || "",
            address: h.address || "",
            contactPhone: h.contactPhone || h.phone || "",
            contactEmail: h.contactEmail || h.email || "",
            bio: h.bio || "",
            languages: h.languages || ["English"],
            healthConditions: h.healthConditions || "",
            organizationId: orgId,
            organizationCutPercentage:
              h.organizationCutPercentage !== undefined && h.organizationCutPercentage !== null
                ? String(h.organizationCutPercentage)
                : "",
          });

          if (h.profilePicture) {
            const picUrl = h.profilePicture.startsWith("http")
              ? h.profilePicture
              : getFileUrl(h.profilePicture);
            setProfilePicture(picUrl);
            setProfilePicturePreview(picUrl);
          }
        }
      } catch (err) {
        console.error("Fetch homeless error:", err);
        setError(err.message || "Error loading profile details");
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchHomeless();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let formattedValue = value;
    if (name === "contactPhone") formattedValue = formatPhoneNumber(value);

    if (name === "organizationCutPercentage") {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      formattedValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : formattedValue,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleToggleArrayItem = (field, item) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const updated = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return { ...prev, [field]: updated };
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture exceeds 5MB limit");
      return;
    }
    const preview = URL.createObjectURL(file);
    setProfilePictureFile(file);
    setProfilePicturePreview(preview);
    setError("");
  };

  const removeProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.organizationId) newErrors.organizationId = "Organization is required";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
      const token = sessionData ? JSON.parse(sessionData).token : null;

      const formDataToSend = new FormData();
      formDataToSend.append("fullName", formData.fullName || "");
      formDataToSend.append("organizationId", formData.organizationId);
      formDataToSend.append("age", formData.age || "");
      formDataToSend.append("gender", formData.gender || "");
      formDataToSend.append("experience", formData.experience || "");
      formDataToSend.append("location", formData.location || "");
      formDataToSend.append("address", formData.address || "");
      formDataToSend.append("contactPhone", formData.contactPhone || "");
      formDataToSend.append("contactEmail", formData.contactEmail || "");
      formDataToSend.append("bio", formData.bio || "");
      formDataToSend.append("healthConditions", formData.healthConditions || "");
      formDataToSend.append("skillset", JSON.stringify(formData.skillset));
      formDataToSend.append("languages", JSON.stringify(formData.languages));

      if (formData.organizationCutPercentage !== "") {
        formDataToSend.append("organizationCutPercentage", String(formData.organizationCutPercentage));
      }

      if (formData.newPassword && formData.newPassword.trim() !== "") {
        formDataToSend.append("password", formData.newPassword);
      }

      if (profilePictureFile) {
        formDataToSend.append("profilePicture", profilePictureFile);
      }

      const res = await fetch(`${API_BASE_URL_V1}/homeless/${id}`, {
        method: "PUT",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formDataToSend,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update profile");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard/homeless"), 600);
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LogoLoader message="Loading beneficiary details..." />;

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
              Edit Beneficiary: {formData.fullName || formData.username || "Profile"}
            </h1>
            <p className="text-xs text-[#68778D]">Update beneficiary profile details, sponsorship and skills</p>
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
          <span className="font-semibold flex-1">Beneficiary updated successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-[1040px] mx-auto space-y-5">
        {/* Profile Card & Sponsor */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Identity & Sponsorship</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#F7F9FC] border border-[#E7ECF2]">
            <input
              type="file"
              id="edit-profile-pic"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
            <label htmlFor="edit-profile-pic" className="cursor-pointer relative flex-shrink-0">
              {profilePicturePreview ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E7ECF2] bg-white">
                  <img src={profilePicturePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeProfilePicture();
                    }}
                    className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#2878E5]/40 hover:border-[#2878E5] bg-white flex flex-col items-center justify-center text-[#2878E5]">
                  <UploadCloud className="w-6 h-6 mb-1 text-[#2878E5]" />
                  <span className="text-[10px] font-bold">Photo</span>
                </div>
              )}
            </label>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="text-xs font-bold text-[#172033]">Profile Photo</h3>
              <p className="text-xs text-[#68778D]">Click the box to update portrait photo (JPG, PNG &lt; 5MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#172033]">
                Sponsor Organization <span className="text-rose-500">*</span>
              </label>
              <select
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              >
                <option value="">Select Organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name || org.orgName} ({org.city || "National"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Username</label>
              <input
                type="text"
                disabled
                value={formData.username}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100 border border-[#E7ECF2] rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Retainer Cut % (Max 30%)</label>
              <input
                type="text"
                name="organizationCutPercentage"
                value={formData.organizationCutPercentage}
                onChange={handleChange}
                placeholder="e.g. 10"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <User className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Personal & Contact Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#172033]">Full Legal Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
              </select>
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
              <label className="block text-xs font-bold text-[#172033]">Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#172033]">Bio / Public Story</label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Skills & Background */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Skills & Background</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#172033]">Skills & Competencies</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {SKILLS_OPTIONS.map((skill) => {
                  const isSelected = formData.skillset.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleArrayItem("skillset", skill)}
                      className={`p-2 rounded-lg border text-xs font-medium text-left truncate transition-all ${
                        isSelected
                          ? "bg-[#EAF3FF] border-[#2878E5] text-[#2878E5] font-semibold"
                          : "bg-white border-[#E7ECF2] text-[#68778D] hover:bg-slate-50"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Work Experience</label>
              <textarea
                name="experience"
                rows={2}
                value={formData.experience}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Medical / Accommodations</label>
              <textarea
                name="healthConditions"
                rows={2}
                value={formData.healthConditions}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security / Password */}
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
            onClick={() => navigate("/dashboard/homeless")}
            className="px-5 py-2.5 rounded-xl border border-[#E7ECF2] text-xs font-semibold text-[#68778D] hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#2878E5] hover:bg-[#1d6cd4] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? "Saving Changes..." : "Save Beneficiary Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditHomeless;
