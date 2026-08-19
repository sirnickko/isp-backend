import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { PackagePlus, AlertCircle, CheckCircle } from 'lucide-react';
import API_BASE from '../../api';

export default function AddPackage() {
  const { token } = useAuth();

  const [packageName, setPackageName] = useState('');
  const [speedMbps, setSpeedMbps] = useState('');
  const [price, setPrice] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await axios.post(`${API_BASE}/packages`, {
        package_name: packageName,
        speed_mbps: speedMbps,
        price: price
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Internet Package added successfully!');
      setPackageName('');
      setSpeedMbps('');
      setPrice('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add package.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          <PackagePlus size={24} color="var(--accent-color)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Add Internet Package</h2>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--danger-color)' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '0.875rem' }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--success-color)' }}>
          <CheckCircle size={18} />
          <span style={{ fontSize: '0.875rem' }}>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Package Name</label>
          <input type="text" required className="input-field" placeholder="e.g. Super Fast 100M" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Speed (Mbps)</label>
            <input type="number" required className="input-field" placeholder="100" value={speedMbps} onChange={(e) => setSpeedMbps(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Price (KSH/mo)</label>
            <input type="number" step="0.01" required className="input-field" placeholder="49.99" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Package'}
        </button>
      </form>
    </div>
  );
}
