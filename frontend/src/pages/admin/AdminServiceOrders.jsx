import React, { useCallback, useContext, useState, useEffect } from "react";
import axios from "axios";
import {
  RiCalendarCheckLine,
  RiDownloadLine,
  RiRefreshLine,
  RiServiceLine,
  RiTimeLine,
  RiWallet3Line,
} from "react-icons/ri";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { API_BASE_URL, getStoredToken } from "../../api/client";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { confirmAdminAction, showAdminError, showAdminSuccess } from "./utils/adminAlerts";
import { AuthContext } from "../../contexts/AuthContext";
import { hasPermission } from "../../utils/permissions";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";

const AdminServiceOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      
      if (!token) {
        showAdminError("Please login first");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.current_page,
        ...(searchTerm && { q: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await axios.get(
        `${API_BASE_URL}/admin/service-orders?${params}`, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOrders(response.data.data.data);
        setPagination({
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
          total: response.data.data.total
        });
      }
    } catch (error) {
      console.error("Error:", error);
      showAdminError("Failed to load service orders", error.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const confirmBooking = async (orderId) => {
    const result = await confirmAdminAction({
      title: "Confirm this booking?",
      text: "A confirmation email will be sent to the customer.",
      confirmButtonText: "Yes, confirm",
      confirmButtonColor: "#00b8c4",
    });
    if (!result.isConfirmed) return;

    try {
      const token = getStoredToken();
      const response = await axios.post(
        `${API_BASE_URL}/admin/service-orders/${orderId}/confirm`,
        {}, // empty object since no data is being sent in body
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.data.success) {
        showAdminSuccess("Booking confirmed", "Email sent to customer.");
        fetchOrders();
      } else {
        showAdminError("Failed to confirm booking", response.data.message || "Please try again.");
      }
    } catch (error) {
      console.error('Confirm booking error:', error);
      if (error.response) {
        showAdminError("Failed to confirm booking", error.response.data.message || "Please try again.");
      } else if (error.request) {
        showAdminError("Network error", "Could not connect to server.");
      } else {
        showAdminError("Error", error.message);
      }
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const result = await confirmAdminAction({
      title: `Change status to ${newStatus}?`,
      confirmButtonText: "Yes, update",
      confirmButtonColor: "#00b8c4",
    });
    if (!result.isConfirmed) return;

    try {
      const token = getStoredToken();
      const response = await axios.put(
        `${API_BASE_URL}/admin/service-orders/${orderId}/status`,
        { status: newStatus },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        showAdminSuccess("Status updated");
        fetchOrders();
      }
    } catch (error) {
      showAdminError("Failed to update status", error.response?.data?.message || "Please try again.");
    }
  };

const downloadSlip = async (order) => {
  try {
    const token = getStoredToken();

    const testResponse = await fetch(
      `${API_BASE_URL}/admin/service-orders/${order.id}/download-slip`,
      {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        },
      }
    );
    
    if (testResponse.status === 200) {
      const response = await fetch(
        `${API_BASE_URL}/admin/service-orders/${order.id}/download-slip`,
        {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `booking-slip-${order.slip_number || order.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        showAdminError("Download failed", errorData.message || "Please try again.");
      }
    } else {
      const errorData = await testResponse.json();
      showAdminError("API Error", errorData.message || testResponse.statusText);
    }
  } catch (error) {
    console.error('Download slip error:', error);
    showAdminError("Network error", error.message);
  }
};

  const downloadInvoice = async (order) => {
    try {
      const token = getStoredToken();
      
      const response = await fetch(
        `${API_BASE_URL}/admin/service-orders/${order.id}/download-invoice`,
        {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice-${order.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download invoice');
      }
    } catch (error) {
      console.error('Download invoice error:', error);
      showAdminError("Failed to download invoice", error.message || "Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { class: 'bg-warning text-dark', label: 'Pending' },
      'confirmed': { class: 'bg-info text-white', label: 'Confirmed' },
      'in_progress': { class: 'bg-primary text-white', label: 'In Progress' },
      'completed': { class: 'bg-success text-white', label: 'Completed' },
      'cancelled': { class: 'bg-danger text-white', label: 'Cancelled' }
    };
    
    return statusConfig[status] || { class: 'bg-secondary', label: status };
  };

  const getAvailableActions = (order) => {
    const actions = {
      'pending': [
        { action: 'confirm', label: 'Confirm', class: 'btn-success' },
        { action: 'cancelled', label: 'Cancel', class: 'btn-danger' }
      ],
      'confirmed': [
        { action: 'cancelled', label: 'Cancel', class: 'btn-danger' }
      ],
      'in_progress': [
        { action: 'cancelled', label: 'Cancel', class: 'btn-danger' }
      ],
      'completed': [
        
      ],
      'cancelled': []
    };
    
    return actions[order.status] || [];
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price) => {
    return `BDT ${parseFloat(price).toFixed(2)}`;
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, current_page: newPage }));
  };

  const stats = {
    total_orders: pagination.total,
    pending_orders: orders.filter(o => o.status === 'pending').length,
    in_progress_orders: orders.filter(o => o.status === 'in_progress').length,
    completed_orders: orders.filter(o => o.status === 'completed').length,
    cancelled_orders: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + (parseFloat(order.service?.price) || 0), 0)
  };
  const canUpdateOrders = hasPermission(user, "service_orders.update");


  return (
    <section className="parking-admin-page service-admin-page service-orders-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Car Service Orders</h1>
        </div>
        <button className="pa-btn pa-btn-ghost" type="button" onClick={fetchOrders} disabled={loading}>
          <RiRefreshLine /> Refresh
        </button>
      </div>

      <div className="pa-stat-grid">
        <article className="pa-stat-card">
          <div>
            <span>Total Orders</span>
            <strong>{stats.total_orders}</strong>
          </div>
          <RiCalendarCheckLine />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Pending</span>
            <strong>{stats.pending_orders}</strong>
          </div>
          <RiTimeLine />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Revenue</span>
            <strong>BDT {stats.revenue.toFixed(0)}</strong>
          </div>
          <FaBangladeshiTakaSign />
        </article>
      </div>

      <AdminFilterBar
        searchValue={searchTerm}
        searchPlaceholder="Search customer, service, slip, or notes"
        onSearchChange={handleSearchChange}
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setPagination(prev => ({ ...prev, current_page: 1 }));
            },
            options: [
              { value: "", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
        ]}
      />

      <div className="pa-panel">
        {orders.length === 0 ? (
          <div className="pa-empty-state">
            <HiWrenchScrewdriver />
            <h3>No service orders found</h3>
          </div>
        ) : (
          <div className="pa-table-wrap">
            <table className="pa-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Price</th>
                  <th>Booking Time</th>
                  <th>Status</th>
                  <th>Slip</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusConfig = getStatusBadge(order.status);
                  const availableActions = getAvailableActions(order);

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.id}</strong>
                        {order.notes && <span className="pa-cell-note">{order.notes.length > 30 ? `${order.notes.substring(0, 30)}...` : order.notes}</span>}
                      </td>
                      <td>
                        <strong>{order.user?.name || 'N/A'}</strong>
                        <span className="pa-cell-note">{order.user?.email || 'N/A'}</span>
                      </td>
                      <td>
                        <strong>{order.service?.name || 'N/A'}</strong>
                        <span className="pa-cell-note">{order.service?.duration || ''}</span>
                      </td>
                      <td className="pa-price">
                        <span className="pa-price-value">{formatPrice(order.service?.price)}</span>
                      </td>
                      <td>{formatDate(order.booking_time)}</td>
                      <td><span className={`pa-status is-${order.status || 'muted'}`}>{statusConfig.label}</span></td>
                      <td>
                        {order.slip_number ? (
                          <button className="pa-linklike" type="button" onClick={() => downloadSlip(order)}>
                            <RiDownloadLine /> {order.slip_number}
                          </button>
                        ) : (
                          <span className="pa-cell-note">Not generated</span>
                        )}
                      </td>
                      <td>
                        <div className="pa-row-actions">
                          {canUpdateOrders && availableActions.map((action) => (
                            <button
                              key={action.action}
                              className={`pa-mini-btn is-${action.action}`}
                              type="button"
                              onClick={() => {
                                if (action.action === 'confirm') {
                                  confirmBooking(order.id);
                                } else if (action.action === 'download') {
                                  downloadInvoice(order);
                                } else {
                                  updateOrderStatus(order.id, action.action);
                                }
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                          {order.status === 'completed' && (
                            <button className="pa-mini-btn is-download" type="button" onClick={() => downloadInvoice(order)}>
                              Invoice
                            </button>
                          )}
                          {order.status === 'confirmed' && order.slip_number && (
                            <button className="pa-mini-btn is-download" type="button" onClick={() => downloadSlip(order)}>
                              Slip
                            </button>
                          )}
                          {(!canUpdateOrders || availableActions.length === 0) && order.status !== 'completed' && order.status !== 'confirmed' && (
                            <span className="pa-cell-note">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          currentPage={pagination.current_page}
          lastPage={pagination.last_page}
          total={pagination.total}
          showing={orders.length}
          label="service orders"
          onPageChange={handlePageChange}
        />
      </div>
    </section>
  );
};

export default AdminServiceOrders;
