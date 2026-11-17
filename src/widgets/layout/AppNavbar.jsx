import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import NotificationPanel from "./NotificationPanel";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";

export const AppNavbar = ({ brandName = "Another Second Chance" }) => {
  const [openNotifications, setOpenNotifications] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user, logout } = useAuth();
  const [controller, dispatch] = useMaterialTailwindController();
  const { openSidenav } = controller;
  const location = useLocation();

  // Extract clean breadcrumb name from pathname
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentPage = pathSegments.length > 1 
    ? pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1)
    : "Overview";

  return (
    <>
      <header className="fixed top-0 right-0 left-0 xl:left-64 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E7ECF2] transition-all duration-200">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Left: Mobile Toggle & Page Context */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpenSidenav(dispatch, !openSidenav)}
              className="xl:hidden p-2 rounded-lg text-enterprise-muted hover:text-enterprise-textPrimary hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-enterprise-muted">Portal /</span>
              <span className="text-sm font-semibold text-enterprise-textPrimary tracking-tight">
                {currentPage}
              </span>
            </div>
          </div>

          {/* Right: Status, Notifications & Profile */}
          <div className="flex items-center gap-3">
            {/* System Status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              System Live
            </div>

            {/* Notifications Button */}
            <button
              onClick={() => setOpenNotifications(!openNotifications)}
              className="relative p-2 rounded-lg text-enterprise-textSecondary hover:text-enterprise-textPrimary hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-enterprise-textSecondary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2878E5] rounded-full ring-2 ring-white"></span>
            </button>

            {/* Admin Profile Dropdown */}
            <div className="relative pl-2 border-l border-[#E7ECF2]">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-enterprise-softBlue text-[#2878E5] font-bold text-xs flex items-center justify-center border border-[#2878E5]/20">
                  {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-enterprise-textPrimary leading-none">
                    {user?.username || "Super Admin"}
                  </p>
                  <p className="text-[10px] font-medium text-enterprise-muted mt-0.5">
                    Administrator
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-enterprise-muted hidden md:block" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-floating border border-[#E7ECF2] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-[#E7ECF2]">
                      <p className="text-xs font-semibold text-enterprise-textPrimary truncate">
                        {user?.username || "Super Admin"}
                      </p>
                      <p className="text-[11px] text-enterprise-muted truncate">
                        {user?.email || "admin@chance.org"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowLogoutDialog(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Panel (outside header to prevent clipping and inherit full viewport height) */}
      <NotificationPanel
        open={openNotifications}
        onClose={() => setOpenNotifications(false)}
      />

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={() => {
          setShowLogoutDialog(false);
          logout();
        }}
      />
    </>
  );
};

export default AppNavbar;
