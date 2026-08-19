import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity, DollarSign, AlertTriangle, ShieldAlert, BarChart3 } from 'lucide-react';
import API_BASE from '../api';

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();

  const [metrics, setMetrics] = useState({
    totalActiveSubscriptions: 0,
    totalRevenue: 0,
    openComplaints: 0
  });
  const [ispRankings, setIspRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suspendLoading, setSuspendLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(res.data.metrics);
      setIspRankings(res.data.ispRankings);
    } catch (err) {
      console.error('Failed to fetch admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const runOverdueSuspension = async () => {
    if (!window.confirm('Are you sure you want to run the overdue suspension job immediately?')) return;

    setSuspendLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/admin/suspend-overdue`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      fetchDashboardData(); // Refresh metrics after suspension
    } catch (err) {
      console.error(err);
      alert('Failed to run suspension job.');
    } finally {
      setSuspendLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Admin Dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={24} color="var(--accent-color)" />
          <span>Admin Page</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Welcome, {user.name}</span>
          <button onClick={logout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <main className="container" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Platform Analytics</h1>

          <button
            onClick={runOverdueSuspension}
            disabled={suspendLoading}
            className="btn-secondary"
            style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <AlertTriangle size={18} />
            {suspendLoading ? 'Running...' : 'Run Overdue Suspensions'}
          </button>
        </div>

        {/* Top Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              <DollarSign size={32} color="var(--success-color)" />
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Platform Revenue</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>${metrics.totalRevenue.toFixed(2)}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              <Activity size={32} color="var(--accent-color)" />
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Active Subscriptions</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{metrics.totalActiveSubscriptions}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              <AlertTriangle size={32} color="var(--danger-color)" />
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Open Complaints</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{metrics.openComplaints}</div>
            </div>
          </div>
        </div>

        {/* ISP Rankings Section */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <BarChart3 size={24} color="#8b5cf6" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>ISP Performance Rankings</h2>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>ISP Name</th>
                <th>Active Subscriptions</th>
              </tr>
            </thead>
            <tbody>
              {ispRankings.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No ISPs registered yet.</td></tr>
              ) : (
                ispRankings.map((isp, index) => (
                  <tr key={isp.user_id}>
                    <td style={{ fontWeight: 600, color: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : 'inherit' }}>
                      #{index + 1}
                    </td>
                    <td style={{ fontWeight: 500 }}>{isp.isp_name}</td>
                    <td>{isp.active_subscriptions}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
