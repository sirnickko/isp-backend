import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, Wifi, Package, Clock, CreditCard, History,
  MessageSquareWarning, Inbox, ChevronRight, CheckCircle,
  AlertCircle, X
} from 'lucide-react';

const API = 'http://localhost:5000';

// Reusable Alert component
function Alert({ type, msg, onClose }) {
  const styles = {
    success: { bg: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--success-color)', Icon: CheckCircle },
    error:   { bg: 'rgba(239,68,68,0.1)',  border: '1px solid rgba(239,68,68,0.25)',  color: 'var(--danger-color)',  Icon: AlertCircle  },
  };
  const { bg, border, color, Icon } = styles[type] || styles.error;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:bg, border, padding:'0.875rem 1rem', borderRadius:'8px', marginBottom:'1.25rem', color }}>
      <Icon size={18} />
      <span style={{ flex:1, fontSize:'0.875rem' }}>{msg}</span>
      {onClose && <button onClick={onClose} style={{ background:'none', border:'none', color, cursor:'pointer', lineHeight:1 }}><X size={16}/></button>}
    </div>
  );
}

// --- SECTION: Browse Packages ---
function BrowsePackages({ token, userId }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/packages`)
      .then(r => setPackages(r.data))
      .catch(() => setAlert({ type:'error', msg:'Failed to load packages.' }))
      .finally(() => setLoading(false));
  }, []);

  const subscribe = async (pkg) => {
    try {
      await axios.post(`${API}/api/installations`, {
        isp_id: pkg.isp_id,
        package_id: pkg.package_id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setAlert({ type:'success', msg: `Request submitted for "${pkg.package_name}"! The ISP will review it shortly.` });
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.error || 'Failed to submit request.' });
    }
  };

  if (loading) return <div style={{ padding:'2rem', color:'var(--text-secondary)' }}>Loading packages...</div>;

  return (
    <div>
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1.5rem' }}>
        {packages.length === 0 && <p style={{ color:'var(--text-secondary)' }}>No packages available yet.</p>}
        {packages.map(pkg => (
          <div key={pkg.package_id} className="glass-panel" style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:'1.1rem' }}>{pkg.package_name}</div>
                <div style={{ color:'var(--text-secondary)', fontSize:'0.8rem', marginTop:'0.2rem' }}>by {pkg.provider_name}</div>
              </div>
              <div style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'8px', padding:'0.5rem 0.75rem', textAlign:'center' }}>
                <div style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--accent-color)' }}>${pkg.price}</div>
                <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>/mo</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-secondary)', fontSize:'0.875rem' }}>
              <Wifi size={16} color="var(--accent-color)" />
              <span><strong style={{ color:'var(--text-primary)' }}>{pkg.speed_mbps} Mbps</strong> download</span>
            </div>
            <button
              onClick={() => subscribe(pkg)}
              className="btn-primary"
              style={{ marginTop:'0.5rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}
            >
              Subscribe <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SECTION: My Requests ---
function MyRequests({ token }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/installations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setRequests(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  const badgeClass = s => {
    const map = { pending:'badge-pending', approved:'badge-approved', installed:'badge-installed', rejected:'badge-rejected' };
    return `badge ${map[s?.toLowerCase()] || 'badge-pending'}`;
  };

  if (loading) return <div style={{ padding:'2rem', color:'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div className="glass-panel" style={{ overflow:'hidden' }}>
      <table className="data-table">
        <thead><tr><th>Package</th><th>ISP</th><th>Speed</th><th>Price</th><th>Status</th></tr></thead>
        <tbody>
          {requests.length === 0
            ? <tr><td colSpan="5" style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)' }}>No requests yet. Browse packages to get started!</td></tr>
            : requests.map(r => (
              <tr key={r.request_id}>
                <td style={{ fontWeight:500 }}>{r.package_name}</td>
                <td style={{ color:'var(--text-secondary)' }}>{r.isp_name}</td>
                <td>{r.speed_mbps} Mbps</td>
                <td>${r.price}/mo</td>
                <td><span className={badgeClass(r.status)}>{r.status}</span></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// --- SECTION: My Subscriptions ---
function MySubscriptions({ token }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setSubs(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ padding:'2rem', color:'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.5rem' }}>
      {subs.length === 0
        ? <p style={{ color:'var(--text-secondary)' }}>No active subscriptions. Your ISP will activate one once your installation request is marked Installed.</p>
        : subs.map(s => (
          <div key={s.subscription_id} className="glass-panel" style={{ padding:'1.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <span style={{ fontWeight:700, fontSize:'1.1rem' }}>{s.package_name}</span>
              <span className={`badge ${s.status === 'Active' ? 'badge-installed' : 'badge-rejected'}`}>{s.status}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', color:'var(--text-secondary)', fontSize:'0.875rem' }}>
              <span>Provider: <strong style={{ color:'var(--text-primary)' }}>{s.isp_name}</strong></span>
              <span>Speed: <strong style={{ color:'var(--text-primary)' }}>{s.speed_mbps} Mbps</strong></span>
              <span>Cost: <strong style={{ color:'var(--text-primary)' }}>${s.price}/mo</strong></span>
              <span>Active since: <strong style={{ color:'var(--text-primary)' }}>{new Date(s.activation_date).toLocaleDateString()}</strong></span>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// --- SECTION: Record Payment ---
function RecordPayment({ token }) {
  const [subs, setSubs] = useState([]);
  const [form, setForm] = useState({ subscription_id:'', amount:'', payment_method:'Mobile Money', transaction_ref:'' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setSubs(r.data.filter(s => s.status === 'Active')));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      await axios.post(`${API}/api/payments`, form, { headers: { Authorization: `Bearer ${token}` } });
      setAlert({ type:'success', msg:'Payment recorded successfully!' });
      setForm({ subscription_id:'', amount:'', payment_method:'Mobile Money', transaction_ref:'' });
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.error || 'Failed to record payment.' });
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="glass-panel" style={{ maxWidth:'600px', padding:'2rem' }}>
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
        <div>
          <label style={{ display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:'0.5rem', color:'var(--text-secondary)' }}>Subscription</label>
          <select required className="input-field" value={form.subscription_id} onChange={e => set('subscription_id', e.target.value)} style={{ backgroundColor:'rgba(0,0,0,0.5)', color:'white' }}>
            <option value="">-- Select active subscription --</option>
            {subs.map(s => <option key={s.subscription_id} value={s.subscription_id}>{s.package_name} — ${s.price}/mo</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:'1rem' }}>
          <div style={{ flex:1 }}>
            <label style={{ display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:'0.5rem', color:'var(--text-secondary)' }}>Amount ($)</label>
            <input required type="number" step="0.01" className="input-field" placeholder="49.99" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div style={{ flex:1 }}>
            <label style={{ display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:'0.5rem', color:'var(--text-secondary)' }}>Method</label>
            <select required className="input-field" value={form.payment_method} onChange={e => set('payment_method', e.target.value)} style={{ backgroundColor:'rgba(0,0,0,0.5)', color:'white' }}>
              <option>Mobile Money</option>
              <option>Bank Transfer</option>
              <option>Credit Card</option>
              <option>Cash</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:'0.5rem', color:'var(--text-secondary)' }}>Transaction Reference</label>
          <input required type="text" className="input-field" placeholder="e.g. MPESA-ABC123XYZ" value={form.transaction_ref} onChange={e => set('transaction_ref', e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Recording...' : 'Record Payment'}</button>
      </form>
    </div>
  );
}

// --- SECTION: Payment History ---
function PaymentHistory({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/payments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setPayments(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ padding:'2rem', color:'var(--text-secondary)' }}>Loading...</div>;

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      {payments.length > 0 && (
        <div className="glass-panel" style={{ padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'inline-flex', alignItems:'center', gap:'0.75rem' }}>
          <CreditCard size={20} color="var(--success-color)" />
          <span style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Total paid:</span>
          <span style={{ fontWeight:700, fontSize:'1.25rem', color:'var(--success-color)' }}>${total.toFixed(2)}</span>
        </div>
      )}
      <div className="glass-panel" style={{ overflow:'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Ref</th><th>Package</th><th>Amount</th><th>Method</th></tr></thead>
          <tbody>
            {payments.length === 0
              ? <tr><td colSpan="4" style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)' }}>No payments recorded yet.</td></tr>
              : payments.map(p => (
                <tr key={p.payment_id}>
                  <td style={{ fontFamily:'monospace', fontSize:'0.8rem', color:'var(--text-secondary)' }}>{p.transaction_ref}</td>
                  <td>{p.package_name}</td>
                  <td style={{ fontWeight:600, color:'var(--success-color)' }}>${p.amount}</td>
                  <td>{p.payment_method}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SECTION: Submit Complaint ---
function SubmitComplaint({ token }) {
  const [isps, setIsps] = useState([]);
  const [form, setForm] = useState({ isp_id:'', issue_type:'Slow Speed', description:'' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all packages to get ISP list
    axios.get(`${API}/api/packages`)
      .then(r => {
        const unique = [];
        const seen = new Set();
        r.data.forEach(p => {
          if (!seen.has(p.isp_id)) { seen.add(p.isp_id); unique.push({ id: p.isp_id, name: p.provider_name }); }
        });
        setIsps(unique);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      await axios.post(`${API}/api/complaints`, form, { headers: { Authorization: `Bearer ${token}` } });
      setAlert({ type:'success', msg:'Complaint submitted. Your ISP will be notified.' });
      setForm({ isp_id:'', issue_type:'Slow Speed', description:'' });
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.error || 'Failed to submit complaint.' });
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="glass-panel" style={{ maxWidth:'600px', padding:'2rem' }}>
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
        <div>
          <label style={{ display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:'0.5rem', color:'var(--text-secondary)' }}>ISP / Provider</label>
          <select required className="input-field" value={form.isp_id} onChange={e => set('isp_id', e.target.value)} style={{ backgroundColor:'rgba(0,0,0,0.5)', color:'white' }}>
            <option value="">-- Select your ISP --</option>
            {isps.map(isp => <option key={isp.id} value={isp.id}>{isp.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:'0.5rem', color:'var(--text-secondary)' }}>Issue Type</label>
          <select required className="input-field" value={form.issue_type} onChange={e => set('issue_type', e.target.value)} style={{ backgroundColor:'rgba(0,0,0,0.5)', color:'white' }}>
            <option>Slow Speed</option>
            <option>No Connection</option>
            <option>Billing Issue</option>
            <option>Service Outage</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label style={{ display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:'0.5rem', color:'var(--text-secondary)' }}>Description</label>
          <textarea required className="input-field" rows="4" placeholder="Describe your issue in detail..." value={form.description} onChange={e => set('description', e.target.value)} style={{ resize:'vertical' }} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Complaint'}</button>
      </form>
    </div>
  );
}

// --- SECTION: My Complaints ---
function MyComplaints({ token }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/complaints`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setComplaints(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  const badgeClass = s => {
    const map = { 'open':'badge-pending', 'in progress':'badge-approved', 'resolved':'badge-installed' };
    return `badge ${map[s?.toLowerCase()] || 'badge-pending'}`;
  };

  if (loading) return <div style={{ padding:'2rem', color:'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div className="glass-panel" style={{ overflow:'hidden' }}>
      <table className="data-table">
        <thead><tr><th>Issue Type</th><th>ISP</th><th>Description</th><th>Status</th></tr></thead>
        <tbody>
          {complaints.length === 0
            ? <tr><td colSpan="4" style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)' }}>No complaints filed yet.</td></tr>
            : complaints.map(c => (
              <tr key={c.complaint_id}>
                <td style={{ fontWeight:500 }}>{c.issue_type}</td>
                <td style={{ color:'var(--text-secondary)' }}>{c.isp_name}</td>
                <td style={{ color:'var(--text-secondary)', fontSize:'0.85rem', maxWidth:'260px' }}>{c.description}</td>
                <td><span className={badgeClass(c.status)}>{c.status}</span></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// MAIN COMMUNITY DASHBOARD
// ============================================================
const SECTIONS = [
  { key:'browse',    label:'Browse Packages',   Icon: Package,              Component: BrowsePackages   },
  { key:'requests',  label:'My Requests',        Icon: Clock,                Component: MyRequests       },
  { key:'subs',      label:'My Subscriptions',   Icon: Wifi,                 Component: MySubscriptions  },
  { key:'pay',       label:'Record Payment',     Icon: CreditCard,           Component: RecordPayment    },
  { key:'history',   label:'Payment History',    Icon: History,              Component: PaymentHistory   },
  { key:'complaint', label:'Submit Complaint',   Icon: MessageSquareWarning, Component: SubmitComplaint  },
  { key:'mycomp',    label:'My Complaints',      Icon: Inbox,                Component: MyComplaints     },
];

export default function CommunityDashboard() {
  const { user, token, logout } = useAuth();
  const [active, setActive] = useState('browse');

  const current = SECTIONS.find(s => s.key === active);
  const CurrentComponent = current?.Component;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div style={{ padding:'2rem 1.5rem', borderBottom:'1px solid var(--panel-border)' }}>
          <div className="nav-brand" style={{ fontSize:'1.6rem' }}>ISP Connect</div>
          <div style={{ marginTop:'0.5rem', color:'var(--text-secondary)', fontSize:'0.8rem' }}>Community Portal</div>
          <div style={{ marginTop:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent-color),#60a5fa)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.875rem' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ fontSize:'0.875rem', fontWeight:500 }}>{user?.name || 'User'}</div>
          </div>
        </div>

        <nav className="sidebar-nav-container">
          {SECTIONS.map(({ key, label, Icon }) => {
            const isActive = active === key;
            return (
              <button key={key} onClick={() => setActive(key)} style={{
                display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.75rem 1rem', borderRadius:'8px',
                backgroundColor: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                cursor:'pointer', fontWeight: isActive ? 600 : 400, fontSize:'0.9rem', textAlign:'left',
                transition:'all 0.15s'
              }}>
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding:'1rem', borderTop:'1px solid var(--panel-border)' }}>
          <button onClick={logout} className="btn-secondary" style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header style={{ padding:'1.25rem 2rem', backgroundColor:'var(--panel-bg)', borderBottom:'1px solid var(--panel-border)' }}>
          <h1 style={{ fontSize:'1.25rem', fontWeight:600 }}>{current?.label}</h1>
        </header>
        <div style={{ padding:'2rem', flex:1 }}>
          {CurrentComponent && <CurrentComponent token={token} userId={user?.id} />}
        </div>
      </main>
    </div>
  );
}
