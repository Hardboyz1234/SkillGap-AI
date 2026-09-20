import axios from "axios";

// In local dev, VITE_API_BASE_URL is unset, so this falls back to "/api"
// which Vite's dev server proxies to the local backend (see vite.config.js).
// In production, set VITE_API_BASE_URL to your deployed backend's full URL
// (e.g. "https://skillgap-ai-backend.onrender.com/api") as an environment
// variable in Vercel — no code edit needed when you redeploy.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("skillgap_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export const registerUser = (data) => api.post("/auth/register", data).then((r) => r.data);
export const loginUser = (data) => api.post("/auth/login", data).then((r) => r.data);
export const deleteMyAccount = () => api.delete("/auth/me").then((r) => r.data);

// --- Analysis ---
export const createAnalysis = (formData) =>
  api
    .post("/analysis", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const listAnalyses = () => api.get("/analysis").then((r) => r.data);
export const getAnalysis = (id) => api.get(`/analysis/${id}`).then((r) => r.data);
export const updateStepStatus = (stepId, status) =>
  api.patch(`/analysis/steps/${stepId}`, { status }).then((r) => r.data);
export const getProgressHistory = () =>
  api.get("/analysis/progress/history").then((r) => r.data);

// --- Chat ---
export const sendChatMessage = (message, analysisId) =>
  api.post("/chat", { message, analysis_id: analysisId }).then((r) => r.data);
export const getChatHistory = () => api.get("/chat/history").then((r) => r.data);

export default api;
