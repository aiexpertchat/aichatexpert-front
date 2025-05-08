import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import AuthContainer from "./Components/AuthContainer";
import ForgotPassword from "./Components/ForgotPassword";
import ResetPassword from "./Components/ResetPassword";

function App() {
  // You can add authentication check logic here
  const isAuthenticated = localStorage.getItem("token") ? true : false;

  return (
    <BrowserRouter>
      <div className="h-screen w-full">
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<AuthContainer />} />

          <Route path="/forget-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? <LandingPage /> : <Navigate to="/auth" />
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <LandingPage /> : <Navigate to="/auth" />
            }
          />

          {/* Fallback route - redirects to root if no match */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
