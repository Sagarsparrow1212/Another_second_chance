import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Typography,
  Card,
  CardBody,
} from "@material-tailwind/react";

const NotificationPanel = ({ isOpen, onClose }) => {
  const notifications = []; // Currently empty, will be populated later

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Typography variant="h6" className="font-semibold text-gray-900">
            Notifications
          </Typography>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close notifications"
          >
            <XMarkIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-73px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <Typography variant="h6" className="text-gray-900 mb-2">
                  No notifications
                </Typography>
                <Typography variant="small" className="text-gray-500">
                  You're all caught up! Check back later for updates.
                </Typography>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification, index) => (
                <Card key={index} className="border border-gray-200 shadow-sm">
                  <CardBody className="p-4">
                    <Typography variant="small" className="font-medium text-gray-900">
                      {notification.title}
                    </Typography>
                    <Typography variant="small" className="text-gray-600 mt-1">
                      {notification.message}
                    </Typography>
                    <Typography variant="small" className="text-gray-400 mt-2">
                      {notification.time}
                    </Typography>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;

