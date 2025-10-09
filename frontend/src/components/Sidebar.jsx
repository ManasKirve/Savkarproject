import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isCollapsed }) => {
  const menuItems = [
    { 
      title: "Dashboard", 
      url: "/", 
      icon: "fas fa-tachometer-alt",
      description: "Overview & Analytics"
    },
    { 
      title: "Loan Records", 
      url: "/loan-records", 
      icon: "fas fa-file-alt",
      description: "Loan Management"
    },
    { 
      title: "Legal Notices", 
      url: "/legal-notices", 
      icon: "fas fa-balance-scale",
      description: "Notice Management"
    },
    { 
      title: "Loan Calculator", 
      url: "/loan-calculator", 
      icon: "fas fa-balance-scale",
      description: "Loan Calculation"
    },
  ];

  const quickActions = [
    { 
      title: "Add New Loan", 
      url: "/loan-records?action=add", 
      icon: "fas fa-plus",
      color: "text-primary"
    },
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} bg-light border-end`} 
         style={{ 
           width: isCollapsed ? '80px' : '280px', 
           transition: 'width 0.3s',
           position: 'fixed',
           top: '76px',
           left: '0',
           zIndex: 1000,
           paddingTop: '20px'
         }}>
      
      {/* Logo Section */}
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded d-flex align-items-center justify-content-center me-3" 
               style={{ width: '32px', height: '32px', fontSize: '14px', fontWeight: 'bold' }}>
            ML
          </div>
          {!isCollapsed && (
            <div>
              <h6 className="mb-0 fw-bold">Money Lender</h6>
              <small className="text-muted">Financial Services</small>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="p-3">
        <div className="mb-3">
          <small className="text-muted text-uppercase fw-bold">Navigation</small>
        </div>
        <div className="list-group list-group-flush">
          {menuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              end
              className={({ isActive }) => 
                `list-group-item list-group-item-action mb-3 border-0 rounded mb-1 ${
                  isActive ? 'active-nav' : ''
                }`
              }
            >
              {({ isActive }) => (
              <div className="d-flex align-items-center">
                <i className={`${item.icon} me-3`} style={{ width: '16px' }}></i>
                {!isCollapsed && (
                  <div>
                    <div className="fw-medium">{item.title}</div>
                      <small className={`opacity-75 ${isActive ? 'text-white' : 'text-gray'}`}>{item.description}</small>
                  </div>
                )}
              </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3">
        <div className="mb-3">
          <small className="text-muted text-uppercase fw-bold">Quick Actions</small>
        </div>
        <div className="list-group list-group-flush">
          {quickActions.map((action) => (
            <NavLink
              key={action.title}
              to={action.url}
              className="list-group-item list-group-item-action border-0 rounded mb-1"
            >
              <div className="d-flex align-items-center">
                <i className={`${action.icon} ${action.color} me-3`} style={{ width: '16px' }}></i>
                {!isCollapsed && (
                  <span className="fw-medium">{action.title}</span>
                )}
              </div>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-3 border-top" style={{ position: 'absolute', bottom: '20px', left: '0', right: '0' }}>
        {!isCollapsed && (
          <div className="text-center">
            <p className="small text-muted mb-0">© 2024 Money Lender Pro</p>
            <p className="small text-muted">v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;