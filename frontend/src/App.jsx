import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LoanRecords from './pages/LoanRecords';
import LegalNotices from './pages/LegalNotices';
import LoanCalculator from './pages/LoanCalculator';
import Login from './pages/Login';
import './App.css';
import InterestCalculator from './pages/InterestCalculator';

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Layout component that includes Navbar and Sidebar
const AppLayout = ({ sidebarCollapsed, toggleSidebar }) => {
  return (
    <div className="app">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isCollapsed={sidebarCollapsed} />
      
      <div 
        className="main-content" 
        style={{ 
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          marginTop: '76px',
          transition: 'margin-left 0.3s'
        }}
      >
        {/* This Outlet will render the matched child route */}
        <Outlet />
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/loan-records" element={
            <ProtectedRoute>
              <LoanRecords />
            </ProtectedRoute>
          } />
          <Route path="/legal-notices" element={
            <ProtectedRoute>
              <LegalNotices />
            </ProtectedRoute>
          } />
          <Route path="/loan-calculator" element={
            <ProtectedRoute>
              <LoanCalculator />
            </ProtectedRoute>
          } />
           <Route path="/Interest-calculator" element={
            <ProtectedRoute>
              <InterestCalculator />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Login page */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with layout */}
          <Route element={
            <ProtectedRoute>
              <AppLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/loan-records" element={<LoanRecords />} />
            <Route path="/legal-notices" element={<LegalNotices />} />
            <Route path="/loan-calculator" element={<LoanCalculator />} />
          </Route>
          
          {/* 404 page - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;