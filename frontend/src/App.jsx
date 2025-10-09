import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LoanRecords from './pages/LoanRecords';
import LegalNotices from './pages/LegalNotices';
import './App.css';
import LoanCalculator from './pages/LoanCalculator';

const queryClient = new QueryClient();

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/loan-records" element={<LoanRecords />} />
              <Route path="/legal-notices" element={<LegalNotices />} />
              <Route path="/loan-calculator" element={<LoanCalculator />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;