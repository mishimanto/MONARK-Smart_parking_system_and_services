import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiEditLine,
  RiGithubLine,
  RiLinkedinBoxLine,
  RiRefreshLine,
  RiShieldStarLine,
  RiTeamLine,
  RiTwitterXLine,
} from "react-icons/ri";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import {
  bulkDeleteAdminResource,
  deleteTeamMember,
  getAdminTeamMembers,
  toggleTeamMemberStatus,
} from "../../api/client";
import { resolveAssetUrl } from "../../utils/assets";
import { getInitialAvatar } from "../../utils/avatar";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import AdminBulkActions from "./components/AdminBulkActions";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import useBulkSelection from "./utils/useBulkSelection";
import "./css/ParkingAdmin.css";
import "./css/SiteSettingsAdmin.css";
import "./css/TeamAdmin.css";

export default function TeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [stats, setStats] = useState({ total: 0, active: 0, founders: 0 });
  const bulk = useBulkSelection(members);

  const fetchMembers = useCallback(async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await getAdminTeamMembers(page, perPage, {
        q,
        status: statusFilter,
        role: roleFilter,
      });
      const pageData = response.data || {};
      setMembers(pageData.data || []);
      setPagination({
        current_page: pageData.current_page || 1,
        last_page: pageData.last_page || 1,
        total: pageData.total || 0,
      });
      setCurrentPage(pageData.current_page || 1);
      setStats(response.stats || { total: 0, active: 0, founders: 0 });
    } catch (error) {
      showErrorToast("Failed to load team", error.response?.data?.message || "Please try again.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, q, roleFilter, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleDelete = async (member) => {
    if (!window.confirm(`Delete ${member.name}?`)) return;

    try {
      await deleteTeamMember(member.id);
      showSuccessToast("Team member deleted", "About page data refreshed.");
      fetchMembers(currentPage);
    } catch (error) {
      showErrorToast("Delete failed", error.response?.data?.message || "Please try again.");
    }
  };

  const handleStatusToggle = async (member) => {
    try {
      await toggleTeamMemberStatus(member.id);
      showSuccessToast("Status updated", `${member.name} status changed.`);
      fetchMembers(currentPage);
    } catch (error) {
      showErrorToast("Status update failed", error.response?.data?.message || "Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${bulk.selectedCount} team members?`)) return;

    try {
      const response = await bulkDeleteAdminResource("team-members", bulk.selectedNumericIds);
      bulk.clearSelection();
      showSuccessToast("Bulk delete complete", response.message);
      fetchMembers(currentPage);
    } catch (error) {
      showErrorToast("Bulk delete failed", error.response?.data?.message || "Please try again.");
    }
  };

  const handleSearchChange = useCallback((value) => {
    setQ(value);
    setCurrentPage(1);
  }, []);

  return (
    <section className="parking-admin-page team-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Team Members</h1>
        </div>
        <div className="parking-admin-actions">
          <button className="pa-btn pa-btn-ghost" type="button" onClick={() => fetchMembers(currentPage)} disabled={loading}>
            <RiRefreshLine /> Refresh
          </button>
          <Link className="pa-btn pa-btn-primary" to="/admin/team-members/new">
            <RiAddLine /> Add Member
          </Link>
        </div>
      </div>

      <div className="pa-stat-grid">
        <article className="pa-stat-card">
          <div>
            <span>Total Members</span>
            <strong>{stats.total}</strong>
          </div>
          <RiTeamLine />
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
            <span>Founder</span>
            <strong>{stats.founders}</strong>
          </div>
          <RiShieldStarLine />
        </article>
      </div>

      <AdminFilterBar
        searchValue={q}
        searchPlaceholder="Search by name, position, or bio"
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
          {
            id: "role",
            label: "Role",
            value: roleFilter,
            onChange: (value) => {
              setRoleFilter(value);
              setCurrentPage(1);
            },
            options: [
              { value: "", label: "All Roles" },
              { value: "founder", label: "Founder" },
            ],
          },
        ]}
      />

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading team members...</div>
        ) : members.length === 0 ? (
          <div className="pa-empty-state">
            <RiTeamLine />
            <h3>No team members found</h3>
          </div>
        ) : (
          <>
          <AdminBulkActions
            selectedCount={bulk.selectedCount}
            totalCount={members.length}
            label="team members"
            onToggleAll={bulk.toggleAllVisible}
            onClear={bulk.clearSelection}
            onDelete={handleBulkDelete}
          />
          <div className="pa-table-wrap">
            <table className="pa-table team-admin-table">
              <thead>
                <tr>
                  <th className="pa-select-col">Select</th>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Social</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="pa-select-col">
                      <label className="pa-row-check" title={`Select ${member.name}`}>
                        <input type="checkbox" checked={bulk.isSelected(member.id)} onChange={() => bulk.toggleSelection(member.id)} />
                      </label>
                    </td>
                    <td>
                      <div className="pa-media-cell">
                        <img
                          src={resolveAssetUrl(member.image, getInitialAvatar(member.name))}
                          alt={member.name}
                          onError={(event) => {
                            event.currentTarget.src = getInitialAvatar(member.name);
                          }}
                        />
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.bio || "No bio added"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{member.position}</strong>
                      {member.is_founder && <span className="pa-status is-live team-founder-badge">Founder & CEO</span>}
                    </td>
                    <td>
                      <span className={`pa-status ${member.is_active ? "is-live" : "is-muted"}`}>
                        {member.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="pa-price">{member.sort_order || 0}</td>
                    <td>
                      <div className="team-social-icons">
                        {member.linkedin_url && <RiLinkedinBoxLine />}
                        {member.twitter_url && <RiTwitterXLine />}
                        {member.github_url && <RiGithubLine />}
                        {!member.linkedin_url && !member.twitter_url && !member.github_url && <span className="pa-cell-note">None</span>}
                      </div>
                    </td>
                    <td>
                      <div className="pa-row-actions">
                        <Link className="pa-icon-btn" title="Edit" to={`/admin/team-members/${member.id}/edit`}>
                          <RiEditLine />
                        </Link>
                        <button className="pa-icon-btn" type="button" title="Toggle Status" onClick={() => handleStatusToggle(member)}>
                          {member.is_active ? <FiXCircle /> : <FiCheckCircle />}
                        </button>
                        <button className="pa-icon-btn is-danger" type="button" title="Delete" onClick={() => handleDelete(member)}>
                          <RiDeleteBin6Line />
                        </button>
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
          currentPage={pagination.current_page}
          lastPage={pagination.last_page}
          perPage={perPage}
          total={pagination.total}
          label="team members"
          onPageChange={fetchMembers}
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
        </select>
      </div>
    </section>
  );
}
