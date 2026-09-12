export function googleDriveLogoUrl(input) {
  const value = String(input || "").trim();
  if (!value) return "";
  let id = "";
  const pathMatch = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const queryMatch = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const lhMatch = value.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) id = pathMatch[1];
  else if (queryMatch) id = queryMatch[1];
  else if (lhMatch) id = lhMatch[1];
  if (!id) return value;
  return `https://lh3.googleusercontent.com/d/${id}`;
}
