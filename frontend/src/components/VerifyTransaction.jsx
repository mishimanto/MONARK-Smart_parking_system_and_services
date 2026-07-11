import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RiArrowLeftLine, RiErrorWarningLine, RiFileList3Line, RiShieldCheckLine } from "react-icons/ri";
import api from "../api/client";
import { showSuccessToast } from "../utils/toast";
import "./css/VerifyTransaction.css";

export default function VerifyTransaction() {
  const location = useLocation();
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionInfo, setTransactionInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state) {
      setTransactionInfo(location.state);
    } else {
      navigate("/topup");
    }
  }, [location, navigate]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");

    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/verify-transaction", {
        transaction_id: transactionInfo.generated_transaction_id,
        verification_code: verificationCode.trim(),
      });

      if (response.data.success) {
        showSuccessToast("Transaction verified", "Waiting for admin approval.");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Verification error:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!transactionInfo) {
    return (
      <main className="verify-page">
        <div className="verify-card verify-loading">Loading...</div>
      </main>
    );
  }

  return (
    <main className="verify-page">
      <div className="verify-card">
        <div className="verify-card-head">
          <RiShieldCheckLine />
          <h2>Verify Transaction</h2>
        </div>

        {error && (
          <div className="verify-error">
            <RiErrorWarningLine />
            <span>{error}</span>
          </div>
        )}

        <div className="verify-summary-box">
          <div>
            <span>Transaction ID:</span>
            <strong>{transactionInfo.generated_transaction_id}</strong>
          </div>
          <div>
            <span>Amount:</span>
            <strong>BDT {transactionInfo.amount}</strong>
          </div>
          <div>
            <span>Method:</span>
            <strong>{transactionInfo.payment_method}</strong>
          </div>
        </div>

        <form onSubmit={handleVerify} className="verify-form">
          <input
            type="text"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value.toUpperCase())}
            placeholder="Enter 6-digit code"
            maxLength="6"
            autoComplete="one-time-code"
            required
          />

          <button type="submit" className="verify-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="verify-spinner" />
                Verifying...
              </>
            ) : (
              <>
                <RiShieldCheckLine />
                Verify Transaction
              </>
            )}
          </button>

          <button type="button" className="verify-secondary" onClick={() => navigate("/topup")}>
            <RiArrowLeftLine />
            Back
          </button>
        </form>
      </div>
    </main>
  );
}
