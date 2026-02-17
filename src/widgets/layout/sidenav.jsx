import PropTypes from "prop-types";
import { Link, NavLink, useLocation } from "react-router-dom";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import {
  Avatar,
  Button,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { useAuth } from "@/context/AuthContext";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { useState } from "react";

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const [expandedSections, setExpandedSections] = useState({ Users: true }); // Expand Users by default
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Close sidebar on mobile when a link is clicked
  const handleLinkClick = () => {
    // Check if screen is smaller than xl breakpoint (1280px)
    if (window.innerWidth < 1280) {
      setOpenSidenav(dispatch, false);
    }
  };

  // Handle logout or navigation
  const handleItemClick = (page) => {
    if (page.isLogout) {
      setShowLogoutDialog(true);
    } else {
      handleLinkClick();
    }
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    logout();
    handleLinkClick();
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const isActiveRoute = (path) => {
    const fullPath = path.startsWith('/dashboard') ? path : `/dashboard${path}`;
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
  };

  return (
    <>
      {/* Backdrop overlay for mobile/tablet */}
      {openSidenav && (
        <div
          className="fixed inset-0 bg-black/50 z-40 xl:hidden transition-opacity duration-300 backdrop-blur-sm"
          onClick={() => setOpenSidenav(dispatch, false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${openSidenav
          ? "translate-x-0"
          : "-translate-x-full xl:translate-x-0"
          } fixed left-0 top-0 z-50 h-screen w-56 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] transition-all duration-300 overflow-hidden`}
        style={{
          background: '#ffffff',
          borderRight: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '2px 0 8px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Brand Header */}
        <div className="relative px-3 sm:px-4 xl:px-5 py-4 sm:py-5 xl:py-6 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2 xl:gap-0">
            <Link to="/dashboard/home" className="flex items-center justify-center gap-2 flex-1 min-w-0 pr-2 xl:pr-0" onClick={handleLinkClick}>
              <img
                src="/img/Logo/HomelyHope.png"
                alt="HomelyHope Logo"
                className="h-8 w-8 sm:h-9 sm:w-9 xl:h-10 xl:w-10 object-contain flex-shrink-0"
              />
              <Typography
                variant="h6"
                className="ml-2 text-base font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent tracking-tight leading-tight whitespace-normal break-words"
                style={{
                  fontFamily: "'Inter', 'Poppins', 'Plus Jakarta Sans', sans-serif",
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}
              >
                {brandName}
              </Typography>
            </Link>
            {/* Close Button for Mobile */}
            <button
              onClick={() => setOpenSidenav(dispatch, false)}
              className="xl:hidden flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0"
              aria-label="Close menu"
            >
              <X strokeWidth={2.5} className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {routes.map(({ layout, title, titleIcon, pages }, key) => {
            const isExpanded = expandedSections[title] ?? false;

            return (
              <ul key={key} className="mb-2 flex flex-col gap-1">
                {title && (
                  <li>
                    <button
                      onClick={() => toggleSection(title)}
                      className="w-full flex items-center justify-between px-3 py-2.5"
                      style={{
                        fontFamily: "'Inter', 'Poppins', 'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-gray-600">
                          {titleIcon}
                        </div>
                        <Typography
                          className="text-sm font-semibold capitalize text-gray-700"
                          style={{
                            fontFamily: "'Inter', 'Poppins', 'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          {title}
                        </Typography>
                      </div>
                      <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </div>
                    </button>
                  </li>
                )}

                {/* Submenu Items */}
                {isExpanded && pages
                  .filter((page) => !page.hidden)
                  .map(({ icon, name, path }) => {
                    const fullPath = layout === "dashboard" ? `/dashboard${path}` : `/${layout}${path}`;
                    const isActive = isActiveRoute(path);

                    return (
                      <li key={name} className="ml-2">
                        <NavLink to={fullPath} onClick={handleLinkClick}>
                          {({ isActive: navIsActive }) => {
                            const active = isActive || navIsActive;
                            return (
                              <div
                                className="relative flex items-center gap-3 px-3 py-2.5"
                                style={{
                                  fontFamily: "'Inter', 'Poppins', 'Plus Jakarta Sans', sans-serif",
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={active ? "text-gray-900" : "text-gray-600"}>
                                    {icon}
                                  </div>
                                  <Typography
                                    className={`text-sm capitalize ${active
                                      ? "text-gray-900 font-bold"
                                      : "text-gray-700 font-normal"
                                      }`}
                                    style={{
                                      fontFamily: "'Inter', 'Poppins', 'Plus Jakarta Sans', sans-serif",
                                    }}
                                  >
                                    {name}
                                  </Typography>
                                </div>
                              </div>
                            );
                          }}
                        </NavLink>
                      </li>
                    );
                  })}

                {/* Top-level Menu Items (no title) */}
                {!title && pages
                  .filter((page) => !page.hidden)
                  .map((page) => {
                    const { icon, name, path, isLogout } = page;
                    const fullPath = layout === "dashboard" ? `/dashboard${path}` : `/${layout}${path}`;
                    const isActive = !isLogout && isActiveRoute(path);

                    // Logout button
                    if (isLogout) {
                      return (
                        <li key={name} className="mt-auto pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleItemClick(page)}
                            className="w-full flex items-center gap-3 px-3 py-2.5"
                            style={{
                              fontFamily: "'Inter', 'Poppins', 'Plus Jakarta Sans', sans-serif",
                            }}
                          >
                            <div className="text-gray-600">
                              {icon}
                            </div>
                            <Typography
                              className="text-sm font-normal capitalize text-gray-700"
                              style={{
                                fontFamily: "'Inter', 'Poppins', 'Plus Jakarta Sans', sans-serif",
                              }}
                            >
                              {name}
                            </Typography>
                          </button>
                        </li>
                      );
                    }

                    return (
                      <li key={name}>
                        <NavLink to={fullPath} onClick={handleLinkClick}>
                          {({ isActive: navIsActive }) => {
                            const active = isActive || navIsActive;
                            return (
                              <div
                                className="relative flex items-center gap-3 px-3 py-2.5"
                                style={{
                                  fontFamily: "'Inter', 'Poppins', 'Plus Jakarta Sans', sans-serif",
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={active ? "text-gray-900" : "text-gray-600"}>
                                    {icon}
                                  </div>
                                  <Typography
                                    className={`text-sm capitalize ${active
                                      ? "text-gray-900 font-bold"
                                      : "text-gray-700 font-normal"
                                      }`}
                                    style={{
                                      fontFamily: "'Inter', 'Poppins', 'Plus Jakarta Sans', sans-serif",
                                    }}
                                  >
                                    {name}
                                  </Typography>
                                </div>
                              </div>
                            );
                          }}
                        </NavLink>
                      </li>
                    );
                  })}
              </ul>
            );
          })}
        </div>

        {/* Logout Confirmation Dialog */}
        <LogoutConfirmDialog
          open={showLogoutDialog}
          onClose={handleLogoutCancel}
          onConfirm={handleLogoutConfirm}
        />
      </aside>
    </>
  );
}

Sidenav.defaultProps = {
  brandImg: "/img/logo-ct.png",
  brandName: "Another Second Chance",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidenav.jsx";

export default Sidenav;
