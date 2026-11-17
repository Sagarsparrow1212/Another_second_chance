import React, { useState, useEffect } from "react";
import { X, Check, Bell, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";

const NotificationPanel = ({ open, isOpen, onClose }) => {
  // Support either `open` or `isOpen` prop
  const visible = open ?? isOpen ?? false;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;
      if (!token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL_V1}/user/notifications`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;
      if (!token) return;

      await fetch(`${API_BASE_URL_V1}/user/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const sessionData = localStorage.getItem("auth_session");
      const token = sessionData ? JSON.parse(sessionData).token : null;
      if (!token) return;

      await fetch(`${API_BASE_URL_V1}/user/notifications/read-all`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-[9998] transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Side Panel Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-white shadow-2xl z-[9999] flex flex-col transform transition-transform duration-300 ease-in-out border-l border-[#E7ECF2] ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Notifications panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7ECF2] bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-enterprise-textPrimary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-enterprise-softBlue text-[#2878E5] rounded-full border border-[#2878E5]/20">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#2878E5] hover:text-[#2878E5]/80 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-enterprise-muted hover:text-enterprise-textPrimary hover:bg-slate-100 transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E7ECF2]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-enterprise-muted text-xs">
              <div className="w-6 h-6 border-2 border-[#2878E5] border-t-transparent rounded-full animate-spin mb-2" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-enterprise-textPrimary mb-1">
                No notifications yet
              </p>
              <p className="text-xs text-enterprise-muted max-w-xs">
                You're all caught up! New system alerts and activity updates will appear here in real time.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const notifId = item._id || item.id;
              const isUnread = !item.isRead;

              return (
                <div
                  key={notifId}
                  onClick={() => !item.isRead && markAsRead(notifId)}
                  className={`p-4 transition-colors cursor-pointer text-left ${
                    isUnread
                      ? "bg-blue-50/40 hover:bg-blue-50/70"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.type === "success"
                          ? "bg-emerald-50 text-emerald-600"
                          : item.type === "warning"
                          ? "bg-amber-50 text-amber-600"
                          : item.type === "danger"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-blue-50 text-[#2878E5]"
                      }`}
                    >
                      {item.type === "success" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : item.type === "warning" ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs truncate ${
                            isUnread
                              ? "font-bold text-enterprise-textPrimary"
                              : "font-semibold text-enterprise-textSecondary"
                          }`}
                        >
                          {item.title || "System Notification"}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#2878E5] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-enterprise-muted mt-0.5 line-clamp-2">
                        {item.message || item.body || ""}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Just now"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

export default NotificationPanel;


