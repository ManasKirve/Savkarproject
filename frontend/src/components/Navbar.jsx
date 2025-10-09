import React, { useState } from 'react';


const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-custom fixed-top">
      <div className="container-fluid">
        <button 
          className="btn btn-outline-secondary navbar-toggle-btn me-3"
          onClick={toggleSidebar}
          type="button"
        >
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
          <button className="btn btn-outline-secondary notification-btn me-2 position-relative">
            <i className="fas fa-bell"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge">
              3
            </span>
          </button>
          <button className="btn btn-outline-secondary user-btn">
            <i className="fas fa-user"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;