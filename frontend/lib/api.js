const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
