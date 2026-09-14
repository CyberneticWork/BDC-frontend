import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "@utils/axios";
import { applyThemeToDocument, DEFAULT_THEME } from "@utils/logoTheme";
import { setBrandedCompany } from "../utils/tenantCompanies";

const BrandingContext = createContext({
  branding: null,
  loading: false,
  refreshBranding: async () => {},
});
const BRANDING_CACHE_KEY = "hr_public_branding";

function tenantSlugFromPath() {
  const m = window.location.pathname.match(/^\/c\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function readCachedBranding() {
  try {
    const raw = sessionStorage.getItem(BRANDING_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCachedBranding(row) {
  try {
    if (row) sessionStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(row));
  } catch {
    /* ignore */
  }
}

function applyBrandingRow(row) {
  setBrandedCompany(row);
  writeCachedBranding(row);
  applyThemeToDocument(row?.theme || DEFAULT_THEME);
  if (row?.name) document.title = `${row.name} HR`;
  if (row?.logo_url) {
    const link = document.querySelector("link[rel='icon']");
    if (link) link.href = row.logo_url;
  }
}

async function loadPublicBranding() {
  const host = window.location.hostname.replace(/^www\./, "");
  const slug = tenantSlugFromPath();
  const { data } = await axios.get("/public/branding", {
    params: { host, slug: slug || undefined, _: Date.now() },
    timeout: 6000,
  });
  return data?.data || null;
}

export function BrandingProvider({ children }) {
  const cached = readCachedBranding();
  const [branding, setBranding] = useState(cached);
  const [loading, setLoading] = useState(!cached);

  const refreshBranding = async () => {
    try {
      sessionStorage.removeItem(BRANDING_CACHE_KEY);
      const row = await loadPublicBranding();
      setBranding(row);
      applyBrandingRow(row);
      return row;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (cached?.theme) applyThemeToDocument(cached.theme);
    if (cached?.name) document.title = `${cached.name} HR`;

    loadPublicBranding()
      .then((row) => {
        if (cancelled) return;
        setBranding(row);
        applyBrandingRow(row);
      })
      .catch(() => {
        if (!cancelled && !cached) {
          setBranding(null);
          setBrandedCompany(null);
          applyThemeToDocument(DEFAULT_THEME);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ branding, loading, refreshBranding }),
    [branding, loading]
  );
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
