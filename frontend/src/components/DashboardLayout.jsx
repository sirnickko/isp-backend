import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserPlus, PackagePlus, Link as LinkIcon, DollarSign, Activity, PieChart, LayoutDashboard } from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Register Customer', path: '/dashboard/register-customer', icon: <UserPlus size={20} /> },
    { name: 'Add Internet Package', path: '/dashboard/add-package', icon: <PackagePlus size={20} /> },
    { name: 'Subscribe Customer', path: '/dashboard/subscribe-customer', icon: <LinkIcon size={20} /> },
    { name: 'Record Payment', path: '/dashboard/record-payment', icon: <DollarSign size={20} /> },
    { name: 'Manage Services', path: '/dashboard/manage-services', icon: <Activity size={20} /> },
    { name: 'Reports', path: '/dashboard/reports', icon: <PieChart size={20} /> }
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--panel-border)' }}>
          <div className="nav-brand" style={{ fontSize: '1.75rem' }}>ISP Connect</div>
          <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Welcome, {user?.name || 'ISP'}
          </div>
        </div>
        
        <nav className="sidebar-nav-container">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard');
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                {item.icon}
                {item.name}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--panel-border)' }}>
          <button 
            onClick={logout} 
            className="btn-secondary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <header style={{ 
          padding: '1.5rem 2rem', 
          backgroundColor: 'var(--panel-bg)',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}</h2>
        </header>
        
        <div style={{ padding: '2rem', flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
