import React, { useState } from "react";
import LoginPage from "./LoginPage";
import SignupPage from "./Register";

const AuthContainer = () => {
  const [currentView, setCurrentView] = useState("login");

  const toggleView = () => {
    setCurrentView((prev) => (prev === "login" ? "signup" : "login"));
  };

  return (
    <div className="min-h-screen w-full">
      {currentView === "login" ? (
        <LoginPage onToggleView={toggleView} />
      ) : (
        <SignupPage onToggleView={toggleView} />
      )}
    </div>
  );
};

export default AuthContainer;
