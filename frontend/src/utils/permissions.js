export const PERMISSIONS = [
  { key: "admin.dashboard", label: "Dashboard", group: "Admin" },

  { key: "parkings.view", label: "View Parking Lots", group: "Parking Lots" },
  { key: "parkings.create", label: "Create Parking Lots", group: "Parking Lots" },
  { key: "parkings.update", label: "Update Parking Lots", group: "Parking Lots" },
  { key: "parkings.delete", label: "Delete Parking Lots", group: "Parking Lots" },

  { key: "slots.view", label: "View Parking Slots", group: "Parking Slots" },
  { key: "slots.create", label: "Create Parking Slots", group: "Parking Slots" },
  { key: "slots.update", label: "Update Parking Slots", group: "Parking Slots" },
  { key: "slots.delete", label: "Delete Parking Slots", group: "Parking Slots" },

  { key: "bookings.view", label: "View Parking Bookings", group: "Parking Bookings" },

  { key: "services.view", label: "View Services", group: "Services" },
  { key: "services.create", label: "Create Services", group: "Services" },
  { key: "services.update", label: "Update Services", group: "Services" },
  { key: "services.delete", label: "Delete Services", group: "Services" },

  { key: "service_orders.view", label: "View Service Orders", group: "Service Orders" },
  { key: "service_orders.update", label: "Update Service Orders", group: "Service Orders" },

  { key: "service_centers.view", label: "View Service Centers", group: "Service Centers" },
  { key: "service_centers.create", label: "Create Service Centers", group: "Service Centers" },
  { key: "service_centers.update", label: "Update Service Centers", group: "Service Centers" },
  { key: "service_centers.delete", label: "Delete Service Centers", group: "Service Centers" },

  { key: "users.view", label: "View Users", group: "Users" },
  { key: "users.update", label: "Update Users", group: "Users" },
  { key: "users.delete", label: "Delete Users", group: "Users" },

  { key: "staff.view", label: "View Staff", group: "Staff" },
  { key: "staff.create", label: "Create Staff", group: "Staff" },
  { key: "staff.update", label: "Update Staff", group: "Staff" },
  { key: "staff.delete", label: "Delete Staff", group: "Staff" },

  { key: "roles.view", label: "View Roles", group: "Roles" },
  { key: "roles.create", label: "Create Roles", group: "Roles" },
  { key: "roles.update", label: "Update Roles", group: "Roles" },
  { key: "roles.delete", label: "Delete Roles", group: "Roles" },

  { key: "wallet.view", label: "View Wallet Overview", group: "Wallet" },
  { key: "wallet_transactions.view", label: "View Wallet Transactions", group: "Wallet" },
  { key: "wallet_transactions.update", label: "Approve/Reject Wallet Transactions", group: "Wallet" },

  { key: "payment_methods.view", label: "View Payment Methods", group: "Payment Methods" },
  { key: "payment_methods.create", label: "Create Payment Methods", group: "Payment Methods" },
  { key: "payment_methods.update", label: "Update Payment Methods", group: "Payment Methods" },
  { key: "payment_methods.delete", label: "Delete Payment Methods", group: "Payment Methods" },

  { key: "checkouts.view", label: "View Checkouts", group: "Checkouts" },
  { key: "checkouts.update", label: "Approve/Reject Checkouts", group: "Checkouts" },

  { key: "reports.view", label: "View Reports", group: "Reports" },
  { key: "reports.export", label: "Export Reports", group: "Reports" },

  { key: "contacts.view", label: "View Contacts", group: "Contacts" },
  { key: "contacts.create", label: "Create Contacts", group: "Contacts" },
  { key: "contacts.update", label: "Update Contacts", group: "Contacts" },
  { key: "contacts.delete", label: "Delete Contacts", group: "Contacts" },

  { key: "messages.view", label: "View Messages", group: "Messages" },
  { key: "messages.update", label: "Update Messages", group: "Messages" },
  { key: "messages.delete", label: "Delete Messages", group: "Messages" },

  { key: "team_members.view", label: "View Team Members", group: "Team Members" },
  { key: "team_members.create", label: "Create Team Members", group: "Team Members" },
  { key: "team_members.update", label: "Update Team Members", group: "Team Members" },
  { key: "team_members.delete", label: "Delete Team Members", group: "Team Members" },

  { key: "site_settings.view", label: "View Site Settings", group: "Site Settings" },
  { key: "site_settings.update", label: "Update Site Settings", group: "Site Settings" },
];

export const hasPermission = (user, permission) => {
  if (!permission) return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.includes("*") || permissions.includes(permission);
};

export const hasAnyPermission = (user, permissions = []) => {
  if (!permissions.length) return true;
  return permissions.some((permission) => hasPermission(user, permission));
};

export const firstAllowedAdminPath = (user) => {
  if (hasPermission(user, "admin.dashboard")) return "/admin";
  if (hasPermission(user, "parkings.view")) return "/admin/parkings";
  if (hasPermission(user, "slots.view")) return "/admin/slots";
  if (hasPermission(user, "bookings.view")) return "/admin/bookings";
  if (hasPermission(user, "service_orders.view")) return "/admin/service-orders";
  if (hasPermission(user, "services.view")) return "/admin/services";
  if (hasPermission(user, "service_centers.view")) return "/admin/service-centers";
  if (hasPermission(user, "users.view")) return "/admin/users";
  if (hasPermission(user, "staff.view")) return "/admin/staff";
  if (hasPermission(user, "roles.view")) return "/admin/roles";
  if (hasPermission(user, "wallet.view")) return "/admin/wallet";
  if (hasPermission(user, "wallet_transactions.view")) return "/admin/wallet-transactions";
  if (hasPermission(user, "payment_methods.view")) return "/admin/payment-methods";
  if (hasPermission(user, "reports.view")) return "/admin/reports/parking";
  if (hasPermission(user, "checkouts.view")) return "/admin/checkouts";
  if (hasPermission(user, "messages.view")) return "/admin/messages";
  if (hasPermission(user, "contacts.view")) return "/admin/contacts";
  if (hasPermission(user, "team_members.view")) return "/admin/team-members";
  if (hasPermission(user, "site_settings.view")) return "/admin/site-settings";
  return "/admin";
};
