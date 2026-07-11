// src/components/admin/ServiceCenters.jsx
import React, { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiEditLine,
  RiMailLine,
  RiMapPin2Line,
  RiPhoneLine,
  RiRefreshLine,
  RiServiceLine,
  RiTimeLine,
} from "react-icons/ri";
import { FiCheckCircle, FiXCircle, FiEdit } from "react-icons/fi";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { API_BASE_URL, bulkDeleteAdminResource, getStoredToken } from '../../api/client';
import AdminBulkActions from "./components/AdminBulkActions";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { confirmAdminAction, showAdminError, showAdminSuccess } from "./utils/adminAlerts";
import useBulkSelection from "./utils/useBulkSelection";
import { AuthContext } from "../../contexts/AuthContext";
import { hasPermission } from "../../utils/permissions";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";

const ServiceCenters = () => {
  const { user } = useContext(AuthContext);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const bulk = useBulkSelection(serviceCenters);
  const canCreate = hasPermission(user, "service_centers.create");
  const canUpdate = hasPermission(user, "service_centers.update");
  const canDelete = hasPermission(user, "service_centers.delete");

  const fetchServiceCenters = useCallback(async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      
      const response = await axios.get(`${API_BASE_URL}/admin/service-centers`, {
        params: {
          search: q || undefined,
          status: statusFilter || undefined,
          page: currentPage,
          per_page: 10,
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      // FIXED: Properly handle paginated response
      let centers = [];
      
      if (response.data && response.data.data) {
        // Case 1: Paginated response { data: { data: [...], current_page: 1, ... } }
        if (Array.isArray(response.data.data)) {
          centers = response.data.data;
        } 
        // Case 2: Direct data array { data: [...] }
        else if (response.data.data.data && Array.isArray(response.data.data.data)) {
          centers = response.data.data.data;
          setPagination({
            current_page: response.data.data.current_page || 1,
            last_page: response.data.data.last_page || 1,
            per_page: response.data.data.per_page || 10,
            total: response.data.data.total || 0,
          });
        }
      }
      
      setServiceCenters(centers);
      setStats(response.data.stats || {
        total: response.data.data?.total || centers.length,
        active: centers.filter((center) => center.is_active).length,
        inactive: centers.filter((center) => !center.is_active).length,
      });
      
    } catch (error) {
      console.error('Error fetching service centers:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      if (error.response?.status === 401) {
        showAdminError("Authentication required", "Please log in again.");
      } else if (error.response?.status === 403) {
        showAdminError("Access forbidden", "Admin privileges are required.");
      } else {
        showAdminError("Failed to load service centers", error.response?.data?.message || "Please try again.");
      }
      setServiceCenters([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, q, statusFilter]);

  useEffect(() => {
    fetchServiceCenters();
  }, [fetchServiceCenters]);

  const handleDelete = async (id) => {
    const result = await confirmAdminAction({
      title: "Delete this service center?",
      text: "This action cannot be undone.",
      confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;

    try {
      const token = getStoredToken();
      await axios.delete(`${API_BASE_URL}/admin/service-centers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      showAdminSuccess("Service center deleted", "The service center was removed successfully.");
      fetchServiceCenters();

    } catch (error) {
      console.error('Error deleting service center:', error);
      showAdminError("Failed to delete service center", error.response?.data?.message || "Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    const result = await confirmAdminAction({
      title: `Delete ${bulk.selectedCount} service centers?`,
      text: "Selected centers and their uploaded images will be removed.",
      confirmButtonText: "Yes, delete selected",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await bulkDeleteAdminResource("service-centers", bulk.selectedNumericIds);
      bulk.clearSelection();
      showAdminSuccess("Bulk delete complete", response.message);
      fetchServiceCenters();
    } catch (error) {
      showAdminError("Bulk delete failed", error.response?.data?.message || "Please try again.");
    }
  };

  const toggleStatus = async (center) => {
    try {
      const token = getStoredToken();
      
      const response = await axios.patch(`${API_BASE_URL}/admin/service-centers/${center.id}/status`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      showAdminSuccess(
        response.data.data.is_active ? "Service center activated" : "Service center deactivated",
        `${center.name} status updated successfully.`
      );
      fetchServiceCenters();
      
    } catch (error) {
      console.error('Error updating status:', error);
      showAdminError("Failed to update status", error.response?.data?.message || "Please try again.");
    }
  };

  const handleSearchChange = useCallback((value) => {
    setQ(value);
    setCurrentPage(1);
  }, []);

  return (
    <section className="parking-admin-page service-admin-page service-centers-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Car Service Centers</h1>
        </div>
        <div className="parking-admin-actions">
          <button className="pa-btn pa-btn-ghost" type="button" onClick={fetchServiceCenters} disabled={loading}>
            <RiRefreshLine /> Refresh
          </button>
          {canCreate && <Link className="pa-btn pa-btn-primary" to="/admin/service-centers/new">
            <RiAddLine /> Add Center
          </Link>}
        </div>
      </div>

      <div className="pa-stat-grid">
        <article className="pa-stat-card">
          <div>
            <span>Total Centers</span>
            <strong>{stats.total}</strong>
          </div>
          <HiWrenchScrewdriver />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>
          <FiCheckCircle />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Inactive</span>
            <strong>{stats.inactive}</strong>
          </div>
          <FiXCircle />
        </article>
      </div>

      <AdminFilterBar
        searchValue={q}
        searchPlaceholder="Search by center name, address, phone, or email"
        onSearchChange={handleSearchChange}
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
            options: [
              { value: "", label: "All Status" },
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ],
          },
        ]}
      />

      {/* No Data State */}
      {serviceCenters.length === 0 ? (
        <div className="pa-panel">
          <div className="pa-empty-state">
            <HiWrenchScrewdriver />
            <h3>No service centers found</h3>
          </div>
        </div>
      ) : (
        <>
          {canDelete && <AdminBulkActions
            selectedCount={bulk.selectedCount}
            totalCount={serviceCenters.length}
            label="service centers"
            onToggleAll={bulk.toggleAllVisible}
            onClear={bulk.clearSelection}
            onDelete={handleBulkDelete}
          />}
          <div className="service-center-grid">
            {serviceCenters.map(center => (
              <article key={center.id} className="service-center-card">
                {canDelete && <label className="pa-card-check" title={`Select ${center.name}`}>
                  <input type="checkbox" checked={bulk.isSelected(center.id)} onChange={() => bulk.toggleSelection(center.id)} />
                  <span>Select</span>
                </label>}
                <div className="service-center-card-top">
                  <HiWrenchScrewdriver />
                  <span className={`pa-status ${center.is_active ? 'is-live' : 'is-danger'}`}>
                    {center.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="service-center-card-body">
                  <h3>{center.name}</h3>
                  <p>
                    <RiMapPin2Line />
                      {center.address}
                  </p>
                  <p>
                    <RiPhoneLine />
                    {center.phone}
                  </p>
                    {center.email && (
                    <p>
                      <RiMailLine />
                      {center.email}
                    </p>
                    )}
                    {center.opening_hours && (
                    <p>
                      <RiTimeLine />
                      {center.opening_hours}
                    </p>
                    )}
                  <small>Coordinates: {parseFloat(center.latitude).toFixed(6)}, {parseFloat(center.longitude).toFixed(6)}</small>
                </div>
                <div className="service-center-card-actions">
                  {canUpdate && <Link className="pa-btn service-center-action is-edit" to={`/admin/service-centers/${center.id}/edit`}>
                    <FiEdit /> Edit
                  </Link>}
                  {canUpdate && <button
                    className={`pa-btn service-center-action ${center.is_active ? 'is-warning' : 'is-success'}`}
                    type="button"
                    onClick={() => toggleStatus(center)}
                  >
                    {center.is_active ? <FiXCircle /> : <FiCheckCircle />}
                    {center.is_active ? 'Deactivate' : 'Activate'}
                  </button>}
                  {canDelete && <button className="pa-btn service-center-action is-delete" type="button" onClick={() => handleDelete(center.id)} title="Delete">
                    <RiDeleteBin6Line /> Delete
                  </button>}
                  {!canUpdate && !canDelete && <span className="pa-cell-note">View only</span>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <AdminPagination
        currentPage={pagination.current_page}
        lastPage={pagination.last_page}
        perPage={pagination.per_page}
        total={pagination.total}
        showing={serviceCenters.length}
        label="centers"
        onPageChange={setCurrentPage}
      />

    </section>
  );
};

export default ServiceCenters;
