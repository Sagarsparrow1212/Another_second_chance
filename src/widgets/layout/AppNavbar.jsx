import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  Bell,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import NotificationPanel from "./NotificationPanel";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";

const AppNavbar = ({
  brandName = "Another Second Chance",
  isDashboard = true,
}) => {
  const [openNotifications, setOpenNotifications] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user, logout } = useAuth();
  const [controller, dispatch] = useMaterialTailwindController();
  const { openSidenav } = controller;

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  return (
    <header className="fixed top-0 right-0 left-0 xl:left-56 z-40 bg-white shadow-md transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-2.5 h-14">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          {isDashboard && (
            <button
              onClick={() => setOpenSidenav(dispatch, !openSidenav)}
              className="xl:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
          )}
          <Link to="/dashboard/home" className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
            {brandName}
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {isDashboard && (
            <button
              onClick={() => setOpenNotifications(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-700" />
            </button>
          )}
          
         

          {user && (
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={openNotifications}
        onClose={() => setOpenNotifications(false)}
      />

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        open={showLogoutDialog}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </header>
  );
};

export default AppNavbar;

