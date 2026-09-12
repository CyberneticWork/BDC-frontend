import axios from "@utils/axios";

let configuredCache = null;

export async function isFirebaseConfigured() {
  if (configuredCache !== null) {
    return configuredCache;
  }
  try {
    const { data } = await axios.get("/public/firebase-status");
    configuredCache = Boolean(data?.configured);
  } catch {
    configuredCache = false;
  }
  return configuredCache;
}

export async function uploadToFirebase(file, folder = "hr", onProgress) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const { data } = await axios.post("/media/firebase", form, {
    onUploadProgress: (event) => {
      if (typeof onProgress === "function" && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  if (!data?.url) {
    throw new Error(data?.message || "Firebase upload did not return a URL.");
  }
  return data.url;
}
