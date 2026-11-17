import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  MapPin,
  Lock,
  Mail,
  Phone,
  User,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";
import LogoLoader from "@/components/LogoLoader";

export function EditMerchant() {
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
    businessName: "",
    phoneNumber: "",
    businessType: "",
    streetAddress: "",
    city: "",
    state: "",
    contactPersonName: "",
    contactDesignation: "",
  });

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
    const fetchMerchant = async () => {
      try {
        setFetching(true);
        setError("");

        const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/merchants/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) throw new Error("Failed to fetch merchant details");

        const data = await response.json();
        if (data.success) {
          const m = data.data.merchant || data.data;
          setFormData({
            email: m.email || m.userEmail || m.businessEmail || "",
            password: m.hasPassword ? "••••••••" : "",
            newPassword: "",
            confirmPassword: "",
            businessName: m.businessName || "",
            phoneNumber: m.phoneNumber || m.phone || "",
            businessType: m.businessType || "",
            streetAddress: m.streetAddress || m.address || "",
            city: m.city || "",
            state: m.state || "",
            contactPersonName: m.contactPersonName || m.contactPerson || "",
            contactDesignation: m.contactDesignation || m.contactPersonDesignation || "",
          });
        } else {
          setError(data.message || "Failed to load merchant");
        }
      } catch (err) {
        console.error("Fetch merchant error:", err);
        setError(err.message || "Error loading merchant details");
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchMerchant();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "phoneNumber") formattedValue = formatPhoneNumber(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessName.trim()) newErrors.businessName = "Business name is required";
    if (!formData.businessType) newErrors.businessType = "Business type is required";
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (formData.phoneNumber.replace(/\D/g, "").length !== 10) {
      newErrors.phoneNumber = "Phone number must have 10 digits";
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters long";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";

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

      const submitData = { ...formData };
      if (submitData.newPassword && submitData.newPassword.trim() !== "") {
        submitData.password = submitData.newPassword;
      } else {
        delete submitData.password;
      }
      delete submitData.newPassword;
      delete submitData.confirmPassword;

      const response = await fetch(`${API_BASE_URL_V1}/merchants/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to update merchant");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard/merchants"), 600);
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update merchant details");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LogoLoader message="Loading merchant details..." />;

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
              Edit Merchant: {formData.businessName || "Profile"}
            </h1>
            <p className="text-xs text-[#68778D]">Update merchant business information and access credentials</p>
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
          <span className="font-semibold flex-1">Merchant profile updated successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-[1000px] mx-auto space-y-5">
        {/* Card 1: Business Details */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Business Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#172033]">
                Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
              {errors.businessName && <p className="text-[11px] text-rose-500">{errors.businessName}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">
                Business Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              >
                <option value="">Select Type</option>
                <option value="Retail">Retail Store</option>
                <option value="Restaurant">Restaurant / Food Service</option>
                <option value="Grocery">Grocery / Supermarket</option>
                <option value="Pharmacy">Pharmacy / Healthcare</option>
                <option value="Electronics">Electronics & Hardware</option>
                <option value="Clothing">Clothing & Apparel</option>
                <option value="Services">Professional Services</option>
                <option value="Wholesale">Wholesale & Distribution</option>
                <option value="Other">Other</option>
              </select>
              {errors.businessType && <p className="text-[11px] text-rose-500">{errors.businessType}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
              {errors.phoneNumber && <p className="text-[11px] text-rose-500">{errors.phoneNumber}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Contact Person</label>
              <input
                type="text"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Designation</label>
              <input
                type="text"
                name="contactDesignation"
                value={formData.contactDesignation}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Address Information */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Store Address</h2>
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
          </div>
        </div>

        {/* Card 3: Security & Credentials */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Security & Password Update</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">
                New Password (Leave blank to keep existing)
              </label>
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
            onClick={() => navigate("/dashboard/merchants")}
            className="px-5 py-2.5 rounded-xl border border-[#E7ECF2] text-xs font-semibold text-[#68778D] hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#2878E5] hover:bg-[#1d6cd4] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? "Saving Changes..." : "Save Merchant Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditMerchant;
