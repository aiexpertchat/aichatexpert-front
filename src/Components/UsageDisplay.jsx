import React, { useEffect, useState } from "react";
import axios from "axios";

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

const UsageDisplay = ({
  onShowPricingModal,
  fetchInteractionsLeft,
  usageData,
  setUsageData,
  fetchUsageData,
}) => {
  useEffect(() => {
    fetchUsageData();

    // Set up an interval to refresh the data every minute
    const intervalId = setInterval(() => {
      fetchUsageData();
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Format reset time in a user-friendly way
  const formatResetTime = (resetTime) => {
    if (!resetTime) return "Unknown";

    // If it's today, show only time
    const today = new Date();
    const isToday =
      resetTime.getDate() === today.getDate() &&
      resetTime.getMonth() === today.getMonth() &&
      resetTime.getFullYear() === today.getFullYear();

    if (isToday) {
      return `Today at ${resetTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // If it's tomorrow, say "Tomorrow"
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      resetTime.getDate() === tomorrow.getDate() &&
      resetTime.getMonth() === tomorrow.getMonth() &&
      resetTime.getFullYear() === tomorrow.getFullYear();

    if (isTomorrow) {
      return `Tomorrow at ${resetTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise show full date
    return (
      resetTime.toLocaleDateString() +
      " at " +
      resetTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Show appropriate badge color based on plan
  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case "Premium":
        return "bg-purple-100 text-purple-800";
      case "ProPlus":
        return "bg-indigo-100 text-indigo-800";
      case "Pro":
        return "bg-blue-100 text-blue-800";
      case "Free":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get appropriate color for remaining counter
  const getRemainingColor = (remaining, limit) => {
    if (remaining === "Unlimited" || typeof remaining !== "number") {
      return "text-purple-700";
    }

    const percentage = (remaining / limit) * 100;

    if (percentage <= 10) {
      return "text-red-600";
    } else if (percentage <= 25) {
      return "text-amber-600";
    } else {
      return "text-green-600";
    }
  };

  if (usageData.loading) {
    return (
      <div className="border-t border-gray-200 p-3 bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-b-2 border-gray-500 rounded-full animate-spin mr-2"></div>
        <span className="text-sm text-gray-500">Loading usage data...</span>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-xs text-gray-500">Current Plan</span>
            <div className="flex items-center">
              <span className="font-medium text-gray-800">
                {usageData.planType}
              </span>
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getPlanBadgeColor(
                  usageData.planType
                )}`}
              >
                {usageData.planType === "Premium"
                  ? "Unlimited"
                  : `${usageData.windowDuration}`}
              </span>
            </div>
          </div>
          {/* <button
            onClick={onShowPricingModal}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Upgrade
          </button> */}
        </div>

        {usageData.planType !== "Premium" && (
          <div className="mt-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Usage</span>
              <span
                className={`text-xs font-medium ${getRemainingColor(
                  usageData.remaining,
                  usageData.limit
                )}`}
              >
                {usageData.remaining === "Unlimited"
                  ? "Unlimited"
                  : `${usageData.remaining} / ${usageData.limit} remaining`}
              </span>
            </div>

            {usageData.remaining !== "Unlimited" && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    usageData.remaining === 0
                      ? "bg-red-500"
                      : usageData.remaining < usageData.limit * 0.25
                      ? "bg-amber-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (usageData.currentUsage / usageData.limit) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            )}

            {usageData.resetTime && (
              <div className="mt-1 text-xs text-gray-500">
                Resets: {formatResetTime(usageData.resetTime)}
              </div>
            )}

            {usageData.boostCredits > 0 && (
              <div className="mt-1 text-xs text-blue-600">
                <span className="font-medium">+{usageData.boostCredits}</span>{" "}
                boost credits available
              </div>
            )}
          </div>
        )}

        {/* {usageData.error && (
          <div className="text-xs text-red-500 mt-1">{usageData.error}</div>
        )} */}
      </div>
    </div>
  );
};

export default UsageDisplay;
