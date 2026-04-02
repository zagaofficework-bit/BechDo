import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
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
          "http://localhost:3000/api/auth/refresh-token",
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

// Register step 1: send registration details and receive OTP session token
export async function register({ email, firstname, lastname, mobile }) {
  const response = await api.post("/api/auth/register", {
    email,
    firstname,
    lastname,
    mobile,
  });
  return response.data;
}

// Register OTP verification
export async function verifyRegisterOtp({ otp, sessionToken }) {
  const response = await api.post("/api/auth/register/verify-otp", {
    otp,
    sessionToken,
  });
  return response.data;
}

//login step 1: send OTP
export async function login({ email }) {
  const response = await api.post("/api/auth/login", { email });
  return response.data;
}

//login otp verification
export async function verifyLoginOtp({ otp, sessionToken }) {
  const response = await api.post("/api/auth/login/verify-otp", {
    otp,
    sessionToken,
  });
  return response.data;
}

//Logout
export async function logout() {
  const response = await api.post("/api/auth/logout");
  return response.data;
}

//get me
export async function getMe() {
  const response = await api.get("/api/auth/me");
  return response.data;
}