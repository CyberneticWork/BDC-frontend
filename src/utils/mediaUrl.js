import config from "../config";

export function mediaUrl(path) {
  if (!path) return "";
  const value = String(path);
  if (/^https?:\/\//i.test(value) || value.startsWith("blob:") || value.startsWith("data:")) {
    return value;
  }
  const base = String(config.apiBaseUrl || "").replace(/\/$/, "");
  return `${base}/storage/${value.replace(/^\/+/, "")}`;
}
