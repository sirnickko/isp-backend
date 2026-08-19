import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { PieChart, TrendingUp, Users } from 'lucide-react';

export default function Reports() {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/payments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPayments(res.data);
      } catch (err) {
        console.error('Failed to fetch payments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [token]);

  // Calculate some basic stats
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalTransactions = payments.length;
  // Get unique customers (if customer_name is available)
  const uniqueCustomers = new Set(payments.map(p => p.customer_name)).size;

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Reports...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          <PieChart size={24} color="#8b5cf6" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Financial Reports</h2>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <TrendingUp size={24} color="var(--success-color)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Revenue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <PieChart size={24} color="var(--accent-color)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Transactions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalTransactions}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <Users size={24} color="var(--warning-color)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Paying Customers</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{uniqueCustomers}</div>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Payment History</h3>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction Ref</th>
              <th>Customer</th>
              <th>Package</th>
              <th>Amount</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No payments found.</td></tr>
            ) : (
              payments.map(pay => (
                <tr key={pay.payment_id}>
                  <td style={{ fontFamily: 'monospace' }}>{pay.transaction_ref}</td>
                  <td style={{ fontWeight: 500 }}>{pay.customer_name}</td>
                  <td>{pay.package_name}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>${pay.amount}</td>
                  <td>{pay.payment_method}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
