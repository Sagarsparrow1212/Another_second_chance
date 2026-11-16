import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { LogOut } from "lucide-react";

export function LogoutConfirmDialog({ open, onClose, onConfirm }) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-[3px] transition-opacity duration-200 animate-in fade-in"
      />

      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] bg-white rounded-2xl p-6 shadow-floating border border-[#E7ECF2] z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          {/* Icon Section */}
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-5 h-5 text-[#DC4141]" />
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <h3
              id="logout-dialog-title"
              className="text-lg sm:text-xl font-bold text-[#172033] tracking-tight"
            >
              Confirm logout?
            </h3>
            <p
              id="logout-dialog-description"
              className="text-sm text-[#68778D] mt-1.5 leading-relaxed"
            >
              Are you sure you want to sign out of your account? You'll need to log in again to continue.
            </p>
          </div>
        </div>

        {/* Buttons Aligned to Bottom-Right */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 text-xs sm:text-sm font-semibold text-[#172033] bg-[#F7F9FC] hover:bg-slate-100 border border-[#E7ECF2] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 px-5 text-xs sm:text-sm font-semibold text-white bg-[#DC4141] hover:bg-[#c93434] rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

LogoutConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

LogoutConfirmDialog.displayName = "/src/components/LogoutConfirmDialog.jsx";

export default LogoutConfirmDialog;
