import { APP_BASE_URL } from "../api/client";

export const resolveAssetUrl = (asset, fallback = "") => {
  if (!asset || asset === "null" || asset === "undefined") return fallback;

  const value = String(asset).trim();

  if (!value) return fallback;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/images/")) return value;
  if (value.startsWith("images/")) return `/${value}`;
  if (value.startsWith("/storage/")) return `${APP_BASE_URL}${value}`;
  if (value.startsWith("storage/")) return `${APP_BASE_URL}/${value}`;

  return `${APP_BASE_URL}/storage/${value.replace(/^\/+/, "")}`;
};
