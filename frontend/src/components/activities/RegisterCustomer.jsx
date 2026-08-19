import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import API_BASE from '../../api';

export default function RegisterCustomer() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await axios.post(`${API_BASE}/register`, {
        full_name: fullName,
        email: email,
        password: password,
        role: 'Community', // Force community role
        phone_number: phoneNumber
      });
      
      setSuccess('Customer registered successfully!');
      setFullName('');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          <UserPlus size={24} color="var(--accent-color)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Register New Customer</h2>
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
          <input type="text" required className="input-field" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
          <input type="email" required className="input-field" placeholder="customer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone Number</label>
          <input type="text" className="input-field" placeholder="+1 234 567 8900" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Initial Password</label>
          <input type="password" required className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register Customer'}
        </button>
      </form>
    </div>
  );
}
