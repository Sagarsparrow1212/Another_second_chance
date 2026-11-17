import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  HeartHandshake,
  MapPin,
  Lock,
  Mail,
  Phone,
  Gift,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";
import LogoLoader from "@/components/LogoLoader";

export function EditDonor() {
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
    donorFullName: "",
    donorPhoneNumber: "",
    donorGender: "",
    donorAddress: "",
    preferredDonationType: "",
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
    const fetchDonor = async () => {
      try {
        setFetching(true);
        setError("");

        const sessionData = (sessionStorage.getItem("auth_session") || localStorage.getItem("auth_session"));
        const token = sessionData ? JSON.parse(sessionData).token : null;

        const response = await fetch(`${API_BASE_URL_V1}/donors/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) throw new Error("Failed to fetch donor details");

        const data = await response.json();
        if (data.success) {
          const d = data.data.donor || data.data;
          setFormData({
            email: d.email || d.userEmail || "",
            password: d.hasPassword ? "••••••••" : "",
            newPassword: "",
            confirmPassword: "",
            donorFullName: d.name || d.fullName || d.donorFullName || "",
            donorPhoneNumber: d.phone || d.donorPhoneNumber || "",
            donorGender: d.gender || d.donorGender || "",
            donorAddress: d.address || d.donorAddress || "",
            preferredDonationType: d.preferredDonationType || "Money",
          });
        } else {
          setError(data.message || "Failed to load donor profile");
        }
      } catch (err) {
        console.error("Fetch donor error:", err);
        setError(err.message || "Error loading donor details");
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchDonor();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "donorPhoneNumber") formattedValue = formatPhoneNumber(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.donorFullName.trim()) newErrors.donorFullName = "Full name is required";
    if (!formData.donorPhoneNumber.trim()) {
      newErrors.donorPhoneNumber = "Phone number is required";
    } else if (formData.donorPhoneNumber.replace(/\D/g, "").length !== 10) {
      newErrors.donorPhoneNumber = "Phone number must have 10 digits";
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters long";
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

      const submitData = { ...formData };
      if (submitData.newPassword && submitData.newPassword.trim() !== "") {
        submitData.password = submitData.newPassword;
      } else {
        delete submitData.password;
      }
      delete submitData.newPassword;
      delete submitData.confirmPassword;

      const response = await fetch(`${API_BASE_URL_V1}/donors/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to update donor");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard/donors"), 600);
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update donor profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LogoLoader message="Loading donor details..." />;

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
              Edit Donor: {formData.donorFullName || "Profile"}
            </h1>
            <p className="text-xs text-[#68778D]">Update contributor personal details and preferences</p>
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
          <span className="font-semibold flex-1">Donor profile updated successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-[960px] mx-auto space-y-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-[#E7ECF2] p-5 sm:p-6 shadow-card space-y-4">
          <div className="pb-3 border-b border-[#E7ECF2] flex items-center gap-2">
            <User className="w-4 h-4 text-[#2878E5]" />
            <h2 className="text-sm font-bold text-[#172033]">Donor Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#172033]">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="donorFullName"
                value={formData.donorFullName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
              {errors.donorFullName && (
                <p className="text-[11px] text-rose-500">{errors.donorFullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="donorPhoneNumber"
                value={formData.donorPhoneNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
              {errors.donorPhoneNumber && (
                <p className="text-[11px] text-rose-500">{errors.donorPhoneNumber}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033]">Gender</label>
              <select
                name="donorGender"
                value={formData.donorGender}
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

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#172033]">Preferred Contribution Type</label>
              <select
                name="preferredDonationType"
                value={formData.preferredDonationType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              >
                <option value="Money">Monetary Donations</option>
                <option value="Clothes">Apparel & Goods</option>
                <option value="Both">Both Monetary & Goods</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#172033]">Mailing Address</label>
              <textarea
                name="donorAddress"
                rows={2}
                value={formData.donorAddress}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E7ECF2] rounded-xl focus:border-[#2878E5] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security Update Card */}
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
            onClick={() => navigate("/dashboard/donors")}
            className="px-5 py-2.5 rounded-xl border border-[#E7ECF2] text-xs font-semibold text-[#68778D] hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#2878E5] hover:bg-[#1d6cd4] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? "Saving Changes..." : "Save Donor Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditDonor;
