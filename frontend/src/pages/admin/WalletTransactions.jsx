import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  RiBankCardLine,
  RiCheckDoubleLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiInboxLine,
  RiRefreshLine,
  RiTimeLine,
  RiUser3Line,
  RiWallet3Line,
} from "react-icons/ri";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import api from "../../api/client";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/WalletAdmin.css";

export default function WalletTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("verified");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({});

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filter || "all",
        page,
        per_page: 10,
        ...(searchTerm && { q: searchTerm }),
      });

      const response = await api.get(`/admin/wallet-transactions?${params}`);

      if (response.data.success) {
        setTransactions(response.data.data.data || []);
        setPagination({
          current_page: response.data.data.current_page || 1,
          last_page: response.data.data.last_page || 1,
          total: response.data.data.total || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      showErrorToast("Failed to load transactions", error.response?.data?.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleApprove = async (transactionId) => {
    const result = await Swal.fire({
      title: "Approve Transaction?",
      text: "This will add money to the user wallet.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#00b8c4",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, approve",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await api.post(`/admin/wallet-transactions/${transactionId}/approve`);
      if (response.data.success) {
        showSuccessToast("Approved", "Transaction approved successfully.");
        fetchTransactions(pagination.current_page);
      }
    } catch (error) {
      showErrorToast("Failed to approve", error.response?.data?.message || "Network error occurred");
    }
  };

  const handleReject = async (transactionId) => {
    const { value: reason } = await Swal.fire({
      title: "Enter rejection reason",
      input: "textarea",
      inputLabel: "Reason for rejection",
      inputPlaceholder: "Please enter the reason for rejecting this transaction...",
      inputAttributes: {
        "aria-label": "Enter rejection reason",
      },
      showCancelButton: true,
      confirmButtonText: "Reject Transaction",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#00b8c4",
      inputValidator: (value) => {
        if (!value) return "You need to enter a reason!";
        if (value.length < 10) return "Reason must be at least 10 characters long";
        return undefined;
      },
    });

    if (!reason) return;

    try {
      const response = await api.post(`/admin/wallet-transactions/${transactionId}/reject`, { reason });
      if (response.data.success) {
        showSuccessToast("Rejected", "Transaction rejected successfully.");
        fetchTransactions(pagination.current_page);
      }
    } catch (error) {
      showErrorToast("Failed to reject", error.response?.data?.message || "Network error occurred");
    }
  };

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const stats = useMemo(() => {
    return {
      pending: transactions.filter((item) => item.status === "pending").length,
      verified: transactions.filter((item) => item.status === "verified").length,
      completed: transactions.filter((item) => item.status === "completed").length,
      failed: transactions.filter((item) => item.status === "failed").length,
      totalAmount: transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  }, [transactions]);

  const getFilterTitle = () => {
    if (!filter) return "All";
    if (filter === "verified") return "Waiting Approval";
    if (filter === "completed") return "Approved";
    if (filter === "failed") return "Rejected";
    return filter.charAt(0).toUpperCase() + filter.slice(1);
  };

  const getStatusClass = (status) => {
    if (status === "verified") return "is-confirmed";
    if (status === "completed") return "is-completed";
    if (status === "pending") return "is-pending";
    if (status === "failed") return "is-danger";
    return "is-soft";
  };

  const getStatusLabel = (status) => {
    if (status === "verified") return "Waiting Approval";
    if (status === "completed") return "Approved";
    if (status === "failed") return "Rejected";
    if (status === "pending") return "Pending Verification";
    return status || "N/A";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount) => `BDT ${Number(amount || 0).toFixed(2)}`;

  const statCards = [
    { label: "Pending", value: stats.pending, icon: <RiTimeLine /> },
    { label: "Waiting Approval", value: stats.verified, icon: <RiCheckLine /> },
    { label: "Total Amount", value: formatAmount(stats.totalAmount), icon: <FaBangladeshiTakaSign /> },
  ];

  return (
    <section className="parking-admin-page service-admin-page wallet-admin-page wallet-transactions-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Wallet Transaction Requests</h1>
        </div>
        <button className="pa-btn pa-btn-ghost" type="button" onClick={() => fetchTransactions()} disabled={loading}>
          <RiRefreshLine /> Refresh
        </button>
      </div>

      <div className="pa-stat-grid">
        {statCards.map((card) => (
          <article className="pa-stat-card" key={card.label}>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
            {card.icon}
          </article>
        ))}
      </div>

      <AdminFilterBar
        searchValue={searchTerm}
        searchPlaceholder="Search by transaction ID, user, or mobile"
        onSearchChange={handleSearchChange}
        filters={[
          {
            id: "status",
            label: "Status",
            value: filter,
            onChange: setFilter,
            options: [
              { value: "", label: "All Status" },
              { value: "verified", label: "Waiting Approval" },
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Approved" },
              { value: "failed", label: "Rejected" },
            ],
          },
        ]}
      />

      <div className="pa-panel">
        <div className="wallet-panel-head">
          <div>
            <h2>Transactions ({getFilterTitle()})</h2>
          </div>
          <span className="pa-status is-soft">{pagination.total || 0} records</span>
        </div>

        {loading ? (
          <div className="pa-empty-state">Loading wallet transaction requests...</div>
        ) : transactions.length === 0 ? (
          <div className="pa-empty-state">
            <RiInboxLine />
            <h3>No transactions found</h3>
          </div>
        ) : (
          <>
            <div className="pa-table-wrap">
              <table className="pa-table wallet-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Transaction ID</th>
                    <th>User Details</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Mobile</th>
                    <th>Status</th>
                    <th>Request Date</th>
                    <th className="wallet-actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id}>
                      <td><strong>{index + 1}</strong></td>
                      <td>
                        <strong>{transaction.generated_transaction_id}</strong>
                        {transaction.transaction_id && (
                          <span className="pa-cell-note">Ref: {transaction.transaction_id}</span>
                        )}
                      </td>
                      <td>
                        <span className="pa-icon-text"><RiUser3Line /> {transaction.user?.name || "N/A"}</span>
                        <span className="pa-cell-note">{transaction.user?.email || "N/A"}</span>
                      </td>
                      <td className="wallet-amount is-in">{formatAmount(transaction.amount)}</td>
                      <td className="text-center">
                        <span className="pa-status is-soft">
                          <RiBankCardLine /> {transaction.payment_method || "N/A"}
                        </span>
                      </td>
                      <td className="text-center"><span className="pa-slot-code">{transaction.mobile_number || "N/A"}</span></td>
                      <td className="text-center">
                        <span className={`pa-status ${getStatusClass(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="pa-icon-text">{formatDate(transaction.created_at)}</span>
                      </td>
                      <td className="text-center">
                        <div className="pa-row-actions wallet-row-actions">
                          {transaction.status === "verified" && (
                            <>
                              <button
                                className="pa-mini-btn is-confirm"
                                type="button"
                                onClick={() => handleApprove(transaction.id)}
                                title="Approve Transaction"
                              >
                                <RiCheckDoubleLine /> Approve
                              </button>
                              <button
                                className="pa-mini-btn is-cancelled"
                                type="button"
                                onClick={() => handleReject(transaction.id)}
                                title="Reject Transaction"
                              >
                                <RiCloseCircleLine /> Reject
                              </button>
                            </>
                          )}
                          {transaction.status === "completed" && <span className="pa-status is-completed">Approved</span>}
                          {transaction.status === "failed" && <span className="pa-status is-danger">Rejected</span>}
                          {transaction.status === "pending" && <span className="pa-status is-pending">Waiting Verification</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              total={pagination.total}
              showing={transactions.length}
              label="transactions"
              onPageChange={fetchTransactions}
            />
          </>
        )}
      </div>
    </section>
  );
}
