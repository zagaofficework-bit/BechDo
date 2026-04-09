import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_URL || "http://localhost:3000",
  withCredentials: true,
});

// REQUEST INTERCEPTOR — attach accessToken to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE INTERCEPTOR — auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_URL || "http://localhost:3000"}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export async function register({ firebaseToken, firstname, lastname, email }) {
  const response = await api.post("/api/auth/register", {
    firebaseToken,
    firstname,
    lastname,
    email,
  });
  return response.data;
}

export async function login({ firebaseToken }) {
  const response = await api.post("/api/auth/login", { firebaseToken });
  return response.data;
}

/**
 * Google Sign-In / Sign-Up
 * @param {string} credential - Google ID token from Google One Tap or OAuth popup
 */
export async function googleAuth(credential) {
  const response = await api.post("/api/auth/google", { credential });
  return response.data;
}

// Logout
export async function logout() {
  const response = await api.post("/api/auth/logout");
  return response.data;
}

// Get me
export async function getMe() {
  const response = await api.get("/api/auth/me");
  return response.data;
}