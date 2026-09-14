import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "@utils/axios";
import { applyThemeToDocument, DEFAULT_THEME } from "@utils/logoTheme";
import { setBrandedCompany } from "../utils/tenantCompanies";

const BrandingContext = createContext({ branding: null, loading: false });
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

export function BrandingProvider({ children }) {
  const cached = readCachedBranding();
  const [branding, setBranding] = useState(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    const host = window.location.hostname.replace(/^www\./, "");
    const slug = tenantSlugFromPath();
    if (cached?.theme) applyThemeToDocument(cached.theme);
    if (cached?.name) document.title = `${cached.name} HR`;

    axios
      .get("/public/branding", {
        params: { host, slug: slug || undefined },
        timeout: 6000,
      })
      .then(({ data }) => {
        if (cancelled) return;
        const row = data?.data || null;
        setBranding(row);
        setBrandedCompany(row);
        writeCachedBranding(row);
        applyThemeToDocument(row?.theme || DEFAULT_THEME);
        if (row?.name) document.title = `${row.name} HR`;
        if (row?.logo_url) {
          const link = document.querySelector("link[rel='icon']");
          if (link) link.href = row.logo_url;
        }
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

  const value = useMemo(() => ({ branding, loading }), [branding, loading]);
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
