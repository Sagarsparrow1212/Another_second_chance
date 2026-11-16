import PropTypes from "prop-types";
import { Link, NavLink, useLocation } from "react-router-dom";
import { X, ChevronDown, LogOut } from "lucide-react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { useAuth } from "@/context/AuthContext";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { useState } from "react";

export function Sidenav({ routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openSidenav } = controller;
  const [expandedSections, setExpandedSections] = useState({
    "USER MANAGEMENT": true,
    Users: true,
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1280) {
      setOpenSidenav(dispatch, false);
    }
  };

  return (
    <>
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#E7ECF2] transition-transform duration-200 ease-in-out flex flex-col ${
          openSidenav ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } xl:translate-x-0`}
      >
        {/* Brand Section */}
        <div className="flex items-center justify-between px-6 h-18 py-4 border-b border-[#E7ECF2]">
          <Link
            to="/dashboard/home"
            className="flex items-center gap-3 group"
            onClick={handleLinkClick}
          >
            <div className="w-10 h-10 rounded-xl bg-enterprise-softBlue border border-[#2878E5]/20 flex items-center justify-center transition-transform duration-200 group-hover:scale-102">
              <img
                src="/img/Logo/HomelyHopeIcon.png"
                alt="Logo"
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-enterprise-navy tracking-tight leading-tight">
                Another Second Chance
              </h1>
              <p className="text-[10px] font-bold tracking-wider text-[#2878E5] uppercase mt-0.5">
                CHANCE PLATFORM
              </p>
            </div>
          </Link>
          <button
            onClick={() => setOpenSidenav(dispatch, false)}
            className="xl:hidden p-1.5 rounded-lg text-enterprise-muted hover:text-enterprise-textPrimary hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Structure */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {routes.map(({ layout, title, titleIcon, pages }, key) => {
            const visiblePages = pages.filter((page) => !page.hidden && !page.isLogout);
            if (visiblePages.length === 0) return null;

            // Formatted section header label
            const displayTitle = title
              ? (title.toLowerCase() === "users" ? "USER MANAGEMENT" : title.toUpperCase())
              : key === 0
              ? "MAIN MENU"
              : "OPERATIONS";

            return (
              <div key={key} className="space-y-1">
                {title ? (
                  <div>
                    <button
                      onClick={() => toggleSection(displayTitle)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold tracking-wider text-enterprise-muted hover:text-enterprise-textSecondary transition-colors uppercase"
                    >
                      <span className="flex items-center gap-2">
                        {titleIcon && <span className="opacity-70">{titleIcon}</span>}
                        {displayTitle}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-enterprise-muted transition-transform duration-200 ${
                          expandedSections[displayTitle] ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expandedSections[displayTitle] && (
                      <div className="mt-1 space-y-0.5">
                        {visiblePages.map(({ icon, name, path }) => {
                          const fullPath = `/${layout}${path}`;
                          const isActive =
                            location.pathname === fullPath ||
                            (path !== "/home" && location.pathname.startsWith(fullPath));

                          return (
                            <NavLink
                              key={name}
                              to={fullPath}
                              onClick={handleLinkClick}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                                isActive
                                  ? "bg-enterprise-softBlue text-[#2878E5] font-semibold border-l-2 border-[#2878E5]"
                                  : "text-enterprise-textSecondary hover:text-enterprise-textPrimary hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`${
                                  isActive ? "text-[#2878E5]" : "text-enterprise-muted"
                                }`}
                              >
                                {icon}
                              </span>
                              <span>{name}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-enterprise-muted uppercase">
                      {displayTitle}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {visiblePages.map(({ icon, name, path }) => {
                        const fullPath = `/${layout}${path}`;
                        const isActive =
                          location.pathname === fullPath ||
                          (path !== "/home" && location.pathname.startsWith(fullPath));

                        return (
                          <NavLink
                            key={name}
                            to={fullPath}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                              isActive
                                ? "bg-enterprise-softBlue text-[#2878E5] font-semibold border-l-2 border-[#2878E5]"
                                : "text-enterprise-textSecondary hover:text-enterprise-textPrimary hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`${
                                isActive ? "text-[#2878E5]" : "text-enterprise-muted"
                              }`}
                            >
                              {icon}
                            </span>
                            <span>{name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile & Logout Section at bottom */}
        <div className="p-3 border-t border-[#E7ECF2] bg-white">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-enterprise-softBlue text-[#2878E5] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-[#2878E5]/20">
                {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-enterprise-textPrimary truncate">
                  {user?.username || "Admin"}
                </p>
                <p className="text-[11px] text-enterprise-muted truncate">
                  {user?.email || "homelessadmin@gmail.com"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutDialog(true)}
              title="Logout"
              className="p-1.5 text-enterprise-muted hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

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
}

Sidenav.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
