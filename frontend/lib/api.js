const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const API_BASE_URL = (configuredApiUrl || (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "")).replace(/\/$/, "");

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
