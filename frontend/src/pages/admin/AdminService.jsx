import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiPauseLine,
  RiPlayLine,
  RiServiceLine,
  RiTimeLine,
  RiWallet3Line,
} from "react-icons/ri";
import { FiCheckCircle, FiEdit } from "react-icons/fi";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import Swal from "sweetalert2";
import {
  APP_BASE_URL,
  bulkDeleteAdminResource,
  deleteService,
  getAdminServices,
  toggleServiceStatus,
} from "../../api/client";
import AdminBulkActions from "./components/AdminBulkActions";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import useBulkSelection from "./utils/useBulkSelection";
import { AuthContext } from "../../contexts/AuthContext";
import { hasPermission } from "../../utils/permissions";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";

const SERVICE_IMAGE_FALLBACK = "/images/parking-hero-3.jpg";

const getServiceImageUrl = (image) => {
  if (!image || image === "null" || image === "undefined") return SERVICE_IMAGE_FALLBACK;

  const imageValue = String(image).trim();

  if (!imageValue) return SERVICE_IMAGE_FALLBACK;
  if (/^(https?:)?\/\//i.test(imageValue) || imageValue.startsWith("data:")) return imageValue;
  if (imageValue.startsWith("/images/")) return imageValue;
  if (imageValue.startsWith("/storage/")) return `${APP_BASE_URL}${imageValue}`;
  if (imageValue.startsWith("storage/")) return `${APP_BASE_URL}/${imageValue}`;
  if (imageValue.startsWith("images/")) return `/${imageValue}`;

  const cleanPath = imageValue.replace(/^\/+/, "");
  return `${APP_BASE_URL}/storage/${cleanPath}`;
};

export default function AdminServices() {
  const { user } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchServices = useCallback(async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await getAdminServices(page, perPage, {
        q,
        status: statusFilter,
      });
      if (response.success) {
        const paginationInfo = response.data;
        setServices(paginationInfo?.data || []);
        setCurrentPage(paginationInfo?.current_page || 1);
        setTotalPages(paginationInfo?.last_page || 1);
        setTotalServices(paginationInfo?.total || 0);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error("Error fetching services:", err.response?.data || err.message);
      showErrorToast("Failed to fetch services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, q, statusFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const handleDeleteService = async (serviceId, serviceName) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You want to delete "${serviceName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteService(serviceId);
      if (response.success) {
        showSuccessToast("Deleted", "Service has been deleted successfully");
        fetchServices(currentPage);
      }
    } catch (error) {
      showErrorToast("Failed to delete service", error.response?.data?.message || error.message || "Please try again.");
    }
  };

  const handleStatusToggle = async (service) => {
    const action = service.status === "active" ? "deactivate" : "activate";
    const result = await Swal.fire({
      title: "Change Status?",
      text: `Are you sure you want to ${action} "${service.name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await toggleServiceStatus(service.id);
      if (response.success) {
        showSuccessToast("Status updated", `Service ${action}d successfully.`);
        fetchServices(currentPage);
      }
    } catch (error) {
      showErrorToast("Failed to update status", error.response?.data?.message || error.message || "Please try again.");
    }
  };

  const activeServices = services.filter((service) => service.status === "active").length;
  const visibleRevenue = services.reduce((sum, service) => sum + Number(service.price || 0), 0);
  const bulk = useBulkSelection(services);
  const canCreate = hasPermission(user, "services.create");
  const canUpdate = hasPermission(user, "services.update");
  const canDelete = hasPermission(user, "services.delete");

  const handleSearchChange = useCallback((value) => {
    setQ(value);
    setCurrentPage(1);
  }, []);

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `Delete ${bulk.selectedCount} services?`,
      text: "Services with active orders will be skipped.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete selected",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#991b1b",
      cancelButtonColor: "#64748b",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await bulkDeleteAdminResource("services", bulk.selectedNumericIds);
      bulk.clearSelection();
      showSuccessToast("Bulk delete complete", response.message);
      fetchServices(currentPage);
    } catch (error) {
      showErrorToast("Bulk delete failed", error.response?.data?.message || error.message || "Please try again.");
    }
  };

  return (
    <section className="parking-admin-page service-admin-page services-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Car Services</h1>
        </div>
        {canCreate && (
          <Link className="pa-btn pa-btn-primary" to="/admin/services/new">
            <RiAddLine /> Add Service
          </Link>
        )}
      </div>

      <div className="pa-stat-grid">
        <article className="pa-stat-card">
          <div>
            <span>Total Services</span>
            <strong>{totalServices}</strong>
          </div>
          <HiWrenchScrewdriver />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Active</span>
            <strong>{activeServices}</strong>
          </div>
          <FiCheckCircle />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Visible Value</span>
            <strong>{formatCurrency(visibleRevenue)}</strong>
          </div>
          <FaBangladeshiTakaSign />
        </article>
      </div>

      <AdminFilterBar
        searchValue={q}
        searchPlaceholder="Search by service name or description"
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
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
      />

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading services data...</div>
        ) : services.length === 0 ? (
          <div className="pa-empty-state">
            <HiWrenchScrewdriver />
            <h3>No services found</h3>
          </div>
        ) : (
          <>
          {canDelete && <AdminBulkActions
            selectedCount={bulk.selectedCount}
            totalCount={services.length}
            label="services"
            onToggleAll={bulk.toggleAllVisible}
            onClear={bulk.clearSelection}
            onDelete={handleBulkDelete}
          />}
          <div className="pa-table-wrap">
            <table className="pa-table">
              <thead>
                <tr>
                  {canDelete && <th className="pa-select-col">Select</th>}
                  <th>Image</th>
                  <th>Service Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th className="service-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    {canDelete && <td className="pa-select-col">
                      <label className="pa-row-check" title={`Select ${service.name}`}>
                        <input type="checkbox" checked={bulk.isSelected(service.id)} onChange={() => bulk.toggleSelection(service.id)} />
                      </label>
                    </td>}
                    <td>
                      <img
                        src={getServiceImageUrl(service.image)}
                        alt={service.name}
                        className="service-thumb"
                        onError={(event) => {
                          event.currentTarget.src = SERVICE_IMAGE_FALLBACK;
                        }}
                      />
                    </td>
                    <td><strong>{service.name}</strong></td>
                    <td><span className="pa-cell-note" title={service.description}>{service.description}</span></td>
                    <td className="pa-price">
                      <span className="pa-price-value">{formatCurrency(service.price)}</span>
                    </td>
                    <td><span className="pa-icon-text text-center"><RiTimeLine /> {service.duration}</span></td>
                    <td className="text-center">
                      <span className={`pa-status ${service.status === "active" ? "is-live" : "is-muted"}`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="d-flex justify-center">
                      <div className="pa-row-actions service-row-actions">
                        {canUpdate && <Link className="pa-icon-btn" to={`/admin/services/${service.id}/edit`} title="Edit Service">
                          <FiEdit />
                        </Link>}
                        {canUpdate && <button
                          className={`pa-icon-btn ${service.status === "active" ? "is-warning" : "is-success"}`}
                          type="button"
                          onClick={() => handleStatusToggle(service)}
                          title={service.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {service.status === "active" ? <RiPauseLine /> : <RiPlayLine />}
                        </button>}
                        {canDelete && <button
                          className="pa-icon-btn is-danger"
                          type="button"
                          onClick={() => handleDeleteService(service.id, service.name)}
                          title="Delete Service"
                        >
                          <RiDeleteBin6Line />
                        </button>}
                        {!canUpdate && !canDelete && <span className="pa-cell-note">View only</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        <AdminPagination
          currentPage={currentPage}
          lastPage={totalPages}
          perPage={perPage}
          total={totalServices}
          label="services"
          onPageChange={fetchServices}
        />
      </div>

      <div className="service-per-page">
        <span>Rows per page</span>
        <select
          value={perPage}
          onChange={(event) => {
            setPerPage(Number(event.target.value));
            setCurrentPage(1);
          }}
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </section>
  );
}
