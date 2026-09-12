import axios from "@utils/axios";

let brandedCompanyId = null;
let brandedCompany = null;
let brandingPromise = null;

export function setBrandedCompany(row) {
  brandedCompany = row || null;
  brandedCompanyId = row?.id != null ? Number(row.id) : null;
}

export function getBrandedCompanyId() {
  return brandedCompanyId;
}

function groupKey(row) {
  return String(row?.org_group || "")
    .trim()
    .toLowerCase();
}

export function currentAppHost() {
  if (typeof window === "undefined") return "";
  return window.location.hostname.replace(/^www\./i, "").toLowerCase();
}

export function normalizeCompanyHost(host) {
  return String(host || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
}

export function isLocalAppHost(host = currentAppHost()) {
  return ["localhost", "127.0.0.1", "::1"].includes(host);
}

function tenantSlugFromPath() {
  if (typeof window === "undefined") return "";
  const m = window.location.pathname.match(/^\/c\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : "";
}

export async function ensureBrandedCompany() {
  if (brandedCompanyId) return brandedCompanyId;
  if (!brandingPromise) {
    brandingPromise = axios
      .get("/public/branding", {
        params: {
          host: currentAppHost(),
          slug: tenantSlugFromPath() || undefined,
        },
      })
      .then(({ data }) => {
        setBrandedCompany(data?.data || null);
        return brandedCompanyId;
      })
      .catch(() => brandedCompanyId)
      .finally(() => {
        brandingPromise = null;
      });
  }
  return brandingPromise;
}

export function companyListQueryParams() {
  const host = currentAppHost();
  const params = { host };
  const slug = tenantSlugFromPath();
  if (slug) params.slug = slug;
  if (isLocalAppHost(host)) {
    const pinId = brandedCompanyId || Number(userCompanyId() || 0) || null;
    if (pinId) {
      params.company_id = pinId;
    }
  }
  return params;
}

function userCompanyId() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!raw) return null;
    const user = JSON.parse(raw);
    return (
      user?.organization_assignment?.company_id ||
      user?.organizationAssignment?.company_id ||
      user?.company_id ||
      null
    );
  } catch {
    return null;
  }
}

/** Companies that belong on this login URL / organization group. */
export function companiesForCurrentUrl(companies) {
  const list = Array.isArray(companies) ? companies : [];
  const host = currentAppHost();
  const userId = Number(userCompanyId() || 0) || null;

  const seed =
    list.find((row) => Number(row.id) === Number(brandedCompanyId)) ||
    list.find((row) => Number(row.id) === userId) ||
    list.find((row) => normalizeCompanyHost(row.frontend_host) === host) ||
    null;

  const group = groupKey(seed) || groupKey(brandedCompany);
  if (group) {
    const grouped = list.filter((row) => groupKey(row) === group);
    if (grouped.length) {
      return grouped;
    }
  }

  const seedCode = String(seed?.company_code || brandedCompany?.company_code || "")
    .trim()
    .toUpperCase();
  if (seedCode.startsWith("SPM")) {
    const spm = list.filter((row) =>
      String(row.company_code || "")
        .trim()
        .toUpperCase()
        .startsWith("SPM")
    );
    if (spm.length) {
      return spm;
    }
  }

  if (!isLocalAppHost(host)) {
    const onThisUrl = list.filter((row) => normalizeCompanyHost(row.frontend_host) === host);
    if (onThisUrl.length) {
      return onThisUrl;
    }
  }

  if (seed) {
    return [seed];
  }

  const pinId = brandedCompanyId || userId;
  if (pinId) {
    const pinned = list.filter((row) => Number(row.id) === Number(pinId));
    if (pinned.length) {
      return pinned;
    }
  }

  if (isLocalAppHost(host)) {
    return [];
  }

  return list.filter((row) => !normalizeCompanyHost(row.frontend_host));
}

export function isDedicatedCompanyUrl(companies) {
  return companiesForCurrentUrl(companies).length === 1;
}

export function scopeOrgRecords(companies, departments = [], subDepartments = []) {
  const ids = new Set((companies || []).map((row) => Number(row.id)));
  const depts = (departments || []).filter((row) => ids.has(Number(row.company_id)));
  const deptIds = new Set(depts.map((row) => Number(row.id)));
  const subs = (subDepartments || []).filter((row) => deptIds.has(Number(row.department_id)));
  return { companies, departments: depts, subDepartments: subs };
}
