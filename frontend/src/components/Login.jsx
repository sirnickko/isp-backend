import React, { useState } from 'react';
import { Wifi, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../api';

export default function Login() {
  const [isLoginView, setIsLoginView] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Admin');
  const [phoneNumber, setPhoneNumber] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get the login function from context (it sets state + navigates)
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (isLoginView) {
      // --- LOGIN FLOW ---
      // Delegates to AuthContext.login() which sets user state AND navigates.
      // Without this, ProtectedRoute sees user=null and bounces back to /.
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials');
      }
    } else {
      // --- REGISTER FLOW ---
      try {
        await axios.post(`${API_BASE}/register`, { full_name: fullName, email, password, role, phone_number: phoneNumber });

        setSuccess('Account created successfully! You can now sign in.');
        setIsLoginView(true); // Flip UI back to login mode automatically
        setPassword(''); // Clear password field for security
      } catch (err) {
        setError(err.response?.data?.error || 'Registration failed. Server may be unreachable.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>

        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', marginBottom: '1rem' }}>
            <Wifi size={32} color="var(--accent-color)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {isLoginView ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isLoginView ? 'Sign in to manage your ISP network' : 'Register a new system user'}
          </p>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--danger-color)' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        {/* Success Message Alert */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#22c55e' }}>
            <CheckCircle size={18} />
            <span style={{ fontSize: '0.875rem' }}>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Extra Fields (Only visible during Registration) */}
          {!isLoginView && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" required className="input-field" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                <input type="text" className="input-field" placeholder="+254 700 000 000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Account Role</label>
                <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)} style={{ backgroundColor: 'transparent', color: 'black' }}>
                  <option value="Admin" style={{ color: 'black' }}>Admin</option>
                  <option value="ISP" style={{ color: 'black' }}>ISP</option>
                  <option value="Community" style={{ color: 'black' }}>Community User</option>
                </select>
              </div>
            </>
          )}

          {/* Always Visible Fields */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
            <input type="email" required className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
            <input type="password" required className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* The Toggle Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => { setIsLoginView(!isLoginView); setError(''); setSuccess(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLoginView ? "Don't have an account? Register here" : "Already have an account? Sign in"}
          </button>
        </div>

      </div>
    </div>
  );
}