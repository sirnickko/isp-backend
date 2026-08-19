import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Activity, Power, PowerOff } from 'lucide-react';

export default function ManageServices() {
  const { token } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, [token]);

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptions(res.data);
    } catch (err) {
      console.error('Failed to fetch subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await axios.patch(`http://localhost:5000/api/subscriptions/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 200) {
        // Optimistic UI update
        setSubscriptions(prev => prev.map(sub => sub.subscription_id === id ? { ...sub, status: newStatus } : sub));
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
      alert(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return <span className="badge badge-installed">Active</span>; // using the green badge style from CSS
    }
    return <span className="badge badge-rejected">{status}</span>; // using red for suspended
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Services...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          <Activity size={24} color="var(--accent-color)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Manage Customer Services</h2>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Package</th>
              <th>Activation Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No active services found.</td></tr>
            ) : (
              subscriptions.map(sub => (
                <tr key={sub.subscription_id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{sub.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub.customer_email}</div>
                  </td>
                  <td>{sub.package_name}</td>
                  <td>{new Date(sub.activation_date).toLocaleDateString()}</td>
                  <td>{getStatusBadge(sub.status)}</td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(sub.subscription_id, sub.status)}
                      className="btn-secondary" 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.25rem', 
                        borderColor: sub.status === 'Active' ? 'var(--danger-color)' : 'var(--success-color)',
                        color: sub.status === 'Active' ? 'var(--danger-color)' : 'var(--success-color)',
                        padding: '4px 8px', fontSize: '0.75rem'
                      }}
                    >
                      {sub.status === 'Active' ? <><PowerOff size={14} /> Suspend</> : <><Power size={14} /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
