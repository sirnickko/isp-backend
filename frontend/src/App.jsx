import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import the components
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import RegisterCustomer from './components/activities/RegisterCustomer';
import AddPackage from './components/activities/AddPackage';
import SubscribeCustomer from './components/activities/SubscribeCustomer';
import RecordPayment from './components/activities/RecordPayment';
import ManageServices from './components/activities/ManageServices';
import Reports from './components/activities/Reports';
import ISPDashboard from './components/ISPDashboard';
import AdminDashboard from './components/AdminDashboard';
import CommunityDashboard from './components/CommunityDashboard';

function App() {
  return (
    <Routes>
      {/* Default route is the Login screen */}
      <Route path="/" element={<Login />} />
      
      {/* Redirect old ISP route to new dashboard */}
      <Route path="/isp" element={<Navigate to="/dashboard" replace />} />
      
      {/* New Unified Dashboard Route */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        {/* Default child route shows the old ISPDashboard as a generic home */}
        <Route index element={<ISPDashboard />} />
        
        {/* Activity sub-routes */}
        <Route path="register-customer" element={<RegisterCustomer />} />
        <Route path="add-package" element={<AddPackage />} />
        <Route path="subscribe-customer" element={<SubscribeCustomer />} />
        <Route path="record-payment" element={<RecordPayment />} />
        <Route path="manage-services" element={<ManageServices />} />
        <Route path="reports" element={<Reports />} />
      </Route>
        
      {/* Community Dashboard Route */}
      <Route path="/community" element={
        <ProtectedRoute allowedRoles={['Community', 'Admin']}>
          <CommunityDashboard />
        </ProtectedRoute>
      } />

      {/* Admin Dashboard Route */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

// Simple ProtectedRoute component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  
  return children;
}

export default App;