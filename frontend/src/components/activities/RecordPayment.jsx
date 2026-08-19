import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

export default function RecordPayment() {
  const { token } = useAuth();
  
  const [subscriptions, setSubscriptions] = useState([]);
  
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [transactionRef, setTransactionRef] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/subscriptions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Only show active or suspended subscriptions (filter if necessary, but ISP can see them all)
        setSubscriptions(res.data);
      } catch (err) {
        console.error('Failed to fetch subscriptions', err);
      }
    };

    fetchSubscriptions();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await axios.post('http://localhost:5000/api/payments', {
        subscription_id: selectedSubscriptionId,
        amount: amount,
        payment_method: paymentMethod,
        transaction_ref: transactionRef
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Payment recorded successfully!');
      setSelectedSubscriptionId('');
      setAmount('');
      setTransactionRef('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          <DollarSign size={24} color="var(--success-color)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Record Payment</h2>
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select Customer Subscription</label>
          <select required className="input-field" value={selectedSubscriptionId} onChange={(e) => setSelectedSubscriptionId(e.target.value)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <option value="">-- Choose a Subscription --</option>
            {subscriptions.map(s => (
              <option key={s.subscription_id} value={s.subscription_id}>
                {s.customer_name} - {s.package_name} ({s.status})
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Amount ($)</label>
            <input type="number" step="0.01" required className="input-field" placeholder="49.99" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Payment Method</label>
            <select required className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Mobile Money">Mobile Money</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Transaction Reference</label>
          <input type="text" required className="input-field" placeholder="e.g. TXN-987654321" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={isLoading}>
          {isLoading ? 'Recording...' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
}
