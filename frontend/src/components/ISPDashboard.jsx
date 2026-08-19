import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Wrench, LogOut } from 'lucide-react';

export default function ISPDashboard() {
  const { user, token, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Packages
        const pkgsRes = await fetch('http://localhost:5000/api/packages');
        const pkgsData = await pkgsRes.json();
        // Filter packages by this ISP's ID
        const myPkgs = pkgsData.filter(p => p.isp_id === user.id);
        setPackages(myPkgs);

        // Fetch Installations
        const instRes = await fetch('http://localhost:5000/api/installations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const instData = await instRes.json();
        setInstallations(instData);

      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/installations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Optimistic UI update
        setInstallations(prev =>
          prev.map(inst => inst.request_id === id ? { ...inst, status: newStatus } : inst)
        );
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const getStatusBadge = (status) => {
    const lower = status.toLowerCase();
    return <span className={`badge badge-${lower}`}>{status}</span>;
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Dashboard...</div>;

  return (
    <>
      <main style={{ padding: '0 1rem' }}>

        {/* Packages Section */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <Package size={24} color="var(--accent-color)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>My Internet Packages</h2>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Speed (Mbps)</th>
                  <th>Price ($)</th>
                </tr>
              </thead>
              <tbody>
                {packages.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No packages found.</td></tr>
                ) : (
                  packages.map(pkg => (
                    <tr key={pkg.package_id}>
                      <td style={{ fontWeight: 500 }}>{pkg.package_name}</td>
                      <td>{pkg.speed_mbps} Mbps</td>
                      <td>KSH{pkg.price}/mo</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Installations Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <Wrench size={24} color="var(--warning-color)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Installation Requests</h2>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {installations.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No installation requests found.</td></tr>
                ) : (
                  installations.map(inst => (
                    <tr key={inst.request_id}>
                      <td>{inst.customer_name}</td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>{inst.customer_email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inst.customer_phone}</div>
                      </td>
                      <td>{inst.package_name}</td>
                      <td>{getStatusBadge(inst.status)}</td>
                      <td>
                        {inst.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => updateStatus(inst.request_id, 'Approved')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Approve</button>
                            <button onClick={() => updateStatus(inst.request_id, 'Rejected')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>Reject</button>
                          </div>
                        )}
                        {inst.status === 'Approved' && (
                          <button onClick={() => updateStatus(inst.request_id, 'Installed')} className="btn-primary" style={{ fontSize: '0.75rem', padding: '4px 12px', width: 'auto' }}>Mark Installed</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </>
  );
}
