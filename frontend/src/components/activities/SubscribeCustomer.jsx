import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';

export default function SubscribeCustomer() {
  const { token, user } = useAuth();
  
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch customers (Assuming a new endpoint or fetching from some list)
    const fetchCustomers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users?role=Community', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomers(res.data);
      } catch (err) {
        console.error('Failed to fetch customers', err);
      }
    };

    const fetchPackages = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/packages');
        // Filter for this ISP
        const myPkgs = res.data.filter(p => p.isp_id === user.id);
        setPackages(myPkgs);
      } catch (err) {
        console.error('Failed to fetch packages', err);
      }
    };

    fetchCustomers();
    fetchPackages();
  }, [token, user.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await axios.post('http://localhost:5000/api/installations', {
        customer_id: selectedCustomerId,
        isp_id: user.id,
        package_id: selectedPackageId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Customer subscribed successfully! (Installation request created)');
      setSelectedCustomerId('');
      setSelectedPackageId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to subscribe customer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          <LinkIcon size={24} color="var(--accent-color)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Subscribe Customer</h2>
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select Customer</label>
          {customers.length > 0 ? (
            <select required className="input-field" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
              <option value="">-- Choose a Customer --</option>
              {customers.map(c => (
                <option key={c.user_id} value={c.user_id}>{c.full_name} ({c.email})</option>
              ))}
            </select>
          ) : (
             <input type="number" required className="input-field" placeholder="Enter Customer ID manually" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} />
          )}
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select Package</label>
          <select required className="input-field" value={selectedPackageId} onChange={(e) => setSelectedPackageId(e.target.value)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <option value="">-- Choose a Package --</option>
            {packages.map(p => (
              <option key={p.package_id} value={p.package_id}>{p.package_name} - ${p.price}/mo</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={isLoading}>
          {isLoading ? 'Subscribing...' : 'Subscribe Customer'}
        </button>
      </form>
    </div>
  );
}
