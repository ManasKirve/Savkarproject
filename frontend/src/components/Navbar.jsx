import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for authentication on component mount
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    }

    // Prevent going back after logout
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, "", window.location.href);
    };

    return () => {
      window.onpopstate = null;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-custom fixed-top">
      <div className="container-fluid">
        <button
          className="btn btn-outline-secondary navbar-toggle-btn me-3"
          onClick={toggleSidebar}
          type="button">
          <i className="fas fa-bars"></i>
        </button>

        <div className="d-flex align-items-center navbar-brand-section">
          <h4 className="navbar-title mb-0 mx-3">Money Lending Dashboard</h4>
          <select className="form-select branch-select ms-3">
            <option value="sidhivinayak">Sidhivinayak Finance</option>
            <option value="branch2">Branch Office 2</option>
            <option value="branch3">Branch Office 3</option>
          </select>
        </div>

        <div className="d-flex align-items-center navbar-actions">
          <button
            className="btn btn-outline-secondary border border-secondary user-btn d-flex flex-column align-items-center justify-content-center me-2"
            onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> 
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
