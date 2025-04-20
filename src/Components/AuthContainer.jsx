import React, { useState } from "react";
import LoginPage from "./LoginPage";
import SignupPage from "./Register";

const AuthContainer = () => {
  const [currentView, setCurrentView] = useState("login");

  const toggleView = () => {
    setCurrentView(currentView === "login" ? "signup" : "login");
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">BlueDash</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView("login")}
                className={`px-4 py-2 rounded-md ${
                  currentView === "login"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentView("signup")}
                className={`px-4 py-2 rounded-md ${
                  currentView === "signup"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form Container */}
      <div className="transition-all duration-300 ease-in-out">
        {currentView === "login" ? (
          <LoginPage onToggleView={toggleView} />
        ) : (
          <SignupPage onToggleView={toggleView} />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-500 text-sm">
                © 2025 BlueDash. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthContainer;
