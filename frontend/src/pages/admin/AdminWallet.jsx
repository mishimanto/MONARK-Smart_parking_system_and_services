import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiBankCardLine,
  RiDownloadLine,
  RiExchangeDollarLine,
  RiListCheck2,
  RiRefreshLine,
  RiTimeLine,
  RiWallet3Line,
} from "react-icons/ri";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { API_BASE_URL } from "../../api/client";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { showAdminError } from "./utils/adminAlerts";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/WalletAdmin.css";

export default function AdminWallet() {
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const fetchTransactions = useCallback(async (p = 1, type = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/admin/wallet-transactions`, {
        params: {
          page: p,
          per_page: perPage,
          q: q || undefined,
          type: type || undefined,
          status: filterStatus || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data.success) {
        setTransactions(res.data.data.data);
        setMeta({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          per_page: res.data.data.per_page,
          total: res.data.data.total,
        });
      } else {
        setTransactions([]);
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err.response?.data || err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, perPage, q]);

  useEffect(() => {
    fetchTransactions(page, activeTab === "all" ? "" : activeTab);
  }, [activeTab, fetchTransactions, page]);

  const handleSearchChange = useCallback((value) => {
    setQ(value);
    setPage(1);
  }, []);

  const handleRefresh = () => {
    setQ("");
    setFilterStatus("");
    setPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/admin/wallet-transactions/export`, {
        params: {
          q: q || undefined,
          type: activeTab === "all" ? undefined : activeTab,
          status: filterStatus || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `wallet-transactions-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting transactions:", err.response?.data || err.message);
      showAdminError("Failed to export transactions", err.response?.data?.message || "Please try again.");
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totals = useMemo(() => {
    return transactions.reduce((acc, transaction) => {
      const amount = Number(transaction.amount || 0);
      acc.all += amount;
      acc[transaction.type] = (acc[transaction.type] || 0) + amount;
      return acc;
    }, { all: 0, topup: 0, payment: 0, refund: 0 });
  }, [transactions]);

  const statCards = [
    { label: "Visible Total", value: formatCurrency(totals.all), icon: <FaBangladeshiTakaSign /> },
    { label: "Top Ups", value: formatCurrency(totals.topup), icon: <RiArrowDownLine /> },
    { label: "Payments", value: formatCurrency(totals.payment), icon: <RiArrowUpLine /> },
  ];

  const walletTabs = [
    { key: "all", label: "All Transactions", value: meta.total, icon: <RiListCheck2 /> },
    { key: "topup", label: "Top Ups", value: formatCurrency(totals.topup), icon: <RiArrowDownLine /> },
    { key: "payment", label: "Payments", value: formatCurrency(totals.payment), icon: <RiArrowUpLine /> },
    { key: "refund", label: "Refunds", value: formatCurrency(totals.refund), icon: <RiExchangeDollarLine /> },
  ];

  const getStatusClass = (status) => {
    if (status === "completed") return "is-completed";
    if (status === "pending") return "is-pending";
    if (status === "failed") return "is-danger";
    return "is-soft";
  };

  const getTypeIcon = (type) => {
    if (type === "topup") return <RiArrowDownLine />;
    if (type === "payment") return <RiArrowUpLine />;
    if (type === "refund") return <RiExchangeDollarLine />;
    return <RiWallet3Line />;
  };

  return (
    <section className="parking-admin-page service-admin-page wallet-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Wallet Transactions</h1>
        </div>
        <div className="parking-admin-actions">
          <button className="pa-btn pa-btn-ghost" type="button" onClick={handleRefresh}>
            <RiRefreshLine /> Refresh
          </button>
          <button className="pa-btn pa-btn-primary" type="button" onClick={handleExport}>
            <RiDownloadLine /> Export
          </button>
        </div>
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
        searchValue={q}
        searchPlaceholder="Search transactions, users, or notes"
        onSearchChange={handleSearchChange}
        filters={[
          {
            id: "status",
            label: "Transaction Status",
            value: filterStatus,
            onChange: (value) => {
              setFilterStatus(value);
              setPage(1);
            },
            options: [
              { value: "", label: "All Status" },
              { value: "completed", label: "Completed" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
            ],
          },
        ]}
      />

      <div className="wallet-tab-grid">
        {walletTabs.map((tab) => (
          <button
            className={`wallet-tab ${activeTab === tab.key ? "is-active" : ""}`}
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <strong>{tab.value}</strong>
          </button>
        ))}
      </div>

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading wallet transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="pa-empty-state">
            <FaBangladeshiTakaSign />
            <h3>No transactions found</h3>
            <p>{q || filterStatus ? "Try another search keyword or status filter." : "There are no wallet transactions yet."}</p>
            {(q || filterStatus) && (
              <button className="pa-btn pa-btn-primary" type="button" onClick={handleRefresh}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="pa-table-wrap">
            <table className="pa-table wallet-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td><strong>#{transaction.id}</strong></td>
                    <td>
                      <strong>{transaction.user?.name || "N/A"}</strong>
                      <span className="pa-cell-note">{transaction.user?.email || "N/A"}</span>
                    </td>
                    <td className="text-center">
                      <span className="pa-status is-soft text-center">
                        {getTypeIcon(transaction.type)}
                        {transaction.type?.replace("_", " ") || "N/A"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`wallet-amount ${transaction.type === "payment" ? "is-out" : "is-in"}`}>
                        {transaction.type === "payment" ? "- " : "+ "}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="pa-status is-soft">
                        <RiBankCardLine /> {transaction.payment_method || "N/A"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`pa-status ${getStatusClass(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="text-center"><span className="pa-cell-note">{transaction.description || "N/A"}</span></td>
                    <td className="text-center">
                      <span className="pa-icon-text">
                        {formatDate(transaction.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <AdminPagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            perPage={meta.per_page}
            total={meta.total}
            label="transaction records"
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
}
