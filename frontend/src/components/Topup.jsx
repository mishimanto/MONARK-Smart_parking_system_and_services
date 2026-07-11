import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RiArrowLeftLine,
    RiBankCardLine,
    RiCheckLine,
    RiLockPasswordLine,
    RiSecurePaymentLine,
    RiSmartphoneLine,
} from 'react-icons/ri';
import api, { APP_BASE_URL } from '../api/client';
import { showErrorToast } from '../utils/toast';
import './css/Topup.css';

const quickAmounts = [1000, 2000, 5000, 10000];

const resolveMethodIcon = (icon) => {
    if (!icon) return "";
    const iconValue = String(icon).trim();
    if (!iconValue) return "";
    if (/^https?:\/\//i.test(iconValue) || iconValue.startsWith("/")) return iconValue;
    return `${APP_BASE_URL}/${iconValue.replace(/^\/+/, "")}`;
};

export default function Topup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        amount: '',
        payment_method: '',
        mobile_number: '',
        pin: ''
    });
    const [loading, setLoading] = useState(false);
    const [methodsLoading, setMethodsLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            setMethodsLoading(true);
            try {
                const response = await api.get('/payment-methods');
                setPaymentMethods(response.data?.success ? response.data.data || [] : []);
            } catch (error) {
                console.error('Payment methods fetch error:', error.response?.data || error.message);
                setPaymentMethods([]);
                showErrorToast('Payment methods unavailable', 'Please try again later.');
            } finally {
                setMethodsLoading(false);
            }
        };

        fetchPaymentMethods();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'payment_method' && value) {
            setShowPaymentDetails(true);
        }
    };

    const setAmount = (amount) => {
        setFormData((current) => ({
            ...current,
            amount: String(amount),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/initiate-topup', formData);
            if (response.data.success) {
                // Verification page এ redirect করবে
                navigate('/verify-transaction', { 
                    state: { 
                        generated_transaction_id: response.data.data.transaction_id,
                        amount: formData.amount,
                        payment_method: formData.payment_method,
                        verification_code: response.data.data.verification_code
                    } 
                });
            }
        } catch (error) {
            showErrorToast('Transaction failed', error.response?.data?.message || 'Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="topup-page">
            <div className="topup-shell">
                <button type="button" className="topup-back-link" onClick={() => navigate('/dashboard')}>
                    <RiArrowLeftLine />
                    Back to Dashboard
                </button>

                <section className="topup-layout">
                    <aside className="topup-summary">                        
                        <h1>Add money securely</h1>
                        
                        <div className="topup-summary-list">
                            <div>
                                <RiSecurePaymentLine />
                                <span>Wallet payment is verified before balance update.</span>
                            </div>
                            <div>
                                <RiBankCardLine />
                                <span>Supports active payment methods configured by admin.</span>
                            </div>
                            <div>
                                <RiCheckLine />
                                <span>Minimum BDT 1,000 and maximum BDT 50,000.</span>
                            </div>
                        </div>
                    </aside>

                    <div className="topup-card">
                        <div className="topup-card-head">                            
                            <h2>Add Amount to Wallet</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="topup-form">
                            <div className="topup-field">
                                {/* <label htmlFor="amount">Amount</label> */}
                                <div className="topup-input-wrap">
                                    <span>BDT</span>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        min="1000"
                                        max="50000"
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>
                                <div className="topup-quick-amounts">
                                    {quickAmounts.map((amount) => (
                                        <button
                                            type="button"
                                            key={amount}
                                            className={Number(formData.amount) === amount ? 'is-active' : ''}
                                            onClick={() => setAmount(amount)}
                                        >
                                            BDT {amount.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                                <p className="topup-help-text">Enter amount between BDT 1,000 to BDT 50,000.</p>
                            </div>

                            <div className="topup-field">
                                <label>Select Payment Method</label>
                                <div className="topup-payment-grid">
                                    {methodsLoading && (
                                        <div className="topup-method-state">Loading payment methods...</div>
                                    )}

                                    {!methodsLoading && paymentMethods.length === 0 && (
                                        <div className="topup-method-state">No payment method is available right now.</div>
                                    )}

                                    {!methodsLoading && paymentMethods.map((method) => {
                                        const methodIcon = resolveMethodIcon(method.icon);
                                        const methodId = `payment-method-${method.id || method.name}`;

                                        return (
                                            <div className="topup-payment-method" key={method.id || method.name}>
                                                <input
                                                    type="radio"
                                                    id={methodId}
                                                    name="payment_method"
                                                    value={method.name}
                                                    checked={formData.payment_method === method.name}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <label htmlFor={methodId} className={`topup-payment-label ${methodIcon ? 'has-icon' : ''}`}>
                                                    {methodIcon && <img src={methodIcon} alt="" />}
                                                    <div>
                                                        <strong>{method.name}</strong>
                                                        {/* <small>{method.account_number || method.type || 'Payment method'}</small> */}
                                                    </div>
                                                    <RiCheckLine />
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {showPaymentDetails && (
                                <div className="topup-details">
                                    <div className="topup-field">
                                        <label htmlFor="mobile_number">Mobile Number</label>
                                        <div className="topup-input-wrap">
                                            <RiSmartphoneLine />
                                            <input
                                                type="text"
                                                id="mobile_number"
                                                name="mobile_number"
                                                value={formData.mobile_number}
                                                onChange={handleInputChange}
                                                placeholder="01XXXXXXXXX"
                                                pattern="[0-9]{11}"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="topup-field">
                                        <label htmlFor="pin">PIN</label>
                                        <div className="topup-input-wrap">
                                            <RiLockPasswordLine />
                                            <input
                                                type="password"
                                                id="pin"
                                                name="pin"
                                                value={formData.pin}
                                                onChange={handleInputChange}
                                                placeholder="Enter your PIN"
                                                maxLength="6"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="topup-submit"
                                disabled={loading || methodsLoading || paymentMethods.length === 0 || !showPaymentDetails}
                            >
                                {loading ? (
                                    <>
                                        <span className="topup-spinner" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <RiSecurePaymentLine />
                                        Request Add Money
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    );
}
