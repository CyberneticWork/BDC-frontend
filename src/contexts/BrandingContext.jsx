import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "@utils/axios";
import { applyThemeToDocument, DEFAULT_THEME } from "@utils/logoTheme";
import { setBrandedCompany } from "../utils/tenantCompanies";

const BrandingContext = createContext({ branding: null, loading: true });

function tenantSlugFromPath() {
  const m = window.location.pathname.match(/^\/c\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : "";
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const host = window.location.hostname.replace(/^www\./, "");
    const slug = tenantSlugFromPath();
    axios
      .get("/public/branding", { params: { host, slug: slug || undefined } })
      .then(({ data }) => {
        if (cancelled) return;
        const row = data?.data || null;
        setBranding(row);
        setBrandedCompany(row);
        applyThemeToDocument(row?.theme || DEFAULT_THEME);
        if (row?.name) document.title = `${row.name} HR`;
        if (row?.logo_url) {
          const link = document.querySelector("link[rel='icon']");
          if (link) link.href = row.logo_url;
        }
      })
      .catch(() => {
        if (!cancelled) {
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

