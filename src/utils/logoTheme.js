export function extractThemeFromImageFile(file) {
  return new Promise((resolve) => {
    const fallback = {
      primary: "#0B4F5C",
      secondary: "#0D9488",
      accent: "#FF6B4A",
      ink: "#062A32",
      surface: "#F3FBF9",
    };
    if (!file || !file.type?.startsWith("image/")) {
      resolve(fallback);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = 64;
        const h = 64;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        const buckets = {};
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 80) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max > 245 && min > 230) continue;
          if (max < 28) continue;
          const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
          buckets[key] = (buckets[key] || 0) + 1;
        }
        const top = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
        if (!top) {
          resolve(fallback);
          return;
        }
        const [r, g, b] = top[0].split(",").map(Number);
        const primary = rgbToHex(r, g, b);
        resolve({
          primary,
          secondary: shade(primary, 0.22),
          accent: shade(primary, -0.12),
          ink: shade(primary, -0.45),
          surface: "#F7FAFC",
        });
      } catch {
        resolve(fallback);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(fallback);
    };
    img.src = url;
  });
}

export function applyThemeToDocument(theme) {
  if (typeof document === "undefined" || !theme) return;
  const root = document.documentElement;
  const primary = theme.primary || "#0B4F5C";
  const secondary = theme.secondary || "#0D9488";
  const accent = theme.accent || "#FF6B4A";
  const ink = theme.ink || "#062A32";
  root.style.setProperty("--brand-ink", ink);
  root.style.setProperty("--brand-deep", primary);
  root.style.setProperty("--brand-teal", secondary);
  root.style.setProperty("--brand-coral", accent);
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function shade(hex, amt) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + (amt > 0 ? (255 - r) * amt : r * amt))));
  g = Math.max(0, Math.min(255, Math.round(g + (amt > 0 ? (255 - g) * amt : g * amt))));
  b = Math.max(0, Math.min(255, Math.round(b + (amt > 0 ? (255 - b) * amt : b * amt))));
  return rgbToHex(r, g, b);
}
