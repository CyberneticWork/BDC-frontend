function resolveApiBase() {
  const env = String(import.meta.env.VITE_API_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");

  if (import.meta.env.DEV) {
    return "";
  }

  return env;
}

const config = {
  apiBaseUrl: resolveApiBase(),
};

export default config;
