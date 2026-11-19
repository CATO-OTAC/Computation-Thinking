/**
 * Travel Planner Assistant - Auth API Client
 * Giao tiếp với FastAPI Backend qua fetch() trao đổi dữ liệu JSON thuần.
 */

const TOKEN_KEY = "travel_planner_auth_token";
const USER_KEY = "travel_planner_auth_user";

/**
 * Tự động phát hiện API Base URL:
 * - Khi chạy qua FastAPI (cùng origin hoặc cổng 8000), dùng relative path '/api/auth'.
 * - Khi mở bằng Live Server (port 5500, 3000...) hoặc file cục bộ, dùng 'http://127.0.0.1:8000/api/auth'.
 */
export function getApiBase() {
  if (typeof window !== "undefined" && window.location) {
    if (window.location.origin && window.location.origin.includes(":8000")) {
      return "/api/auth";
    }
  }
  return "http://127.0.0.1:8000/api/auth";
}

const API_BASE = getApiBase();

/**
 * Quản lý lưu trữ phiên làm việc (Session) trên trình duyệt
 */
export const SessionStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },
  setToken(token, remember = false) {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser(user, remember = false) {
    const raw = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(USER_KEY, raw);
    } else {
      sessionStorage.setItem(USER_KEY, raw);
    }
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

/**
 * Thực hiện yêu cầu HTTP với fetch() và xử lý lỗi chuẩn hóa
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = SessionStorage.getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.detail || data.message || `Lỗi máy chủ (${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("Không thể kết nối đến máy chủ backend (FastAPI chưa bật hoặc sai cổng).");
    }
    throw err;
  }
}

/**
 * Các hàm gọi API Authentication thật
 */
export const AuthAPI = {
  async register(name, email, password, confirmPassword) {
    return apiRequest("/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        confirm_password: confirmPassword,
      }),
    });
  },

  async login(email, password) {
    return apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async logout() {
    try {
      await apiRequest("/logout", {
        method: "POST",
        body: JSON.stringify({ token: SessionStorage.getToken() }),
      });
    } catch (e) {
      console.warn("Lỗi khi gọi logout API:", e);
    } finally {
      SessionStorage.clear();
    }
  },

  async forgotPassword(email) {
    return apiRequest("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token, newPassword, confirmPassword) {
    return apiRequest("/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
  },

  async loginDemoTraveler() {
    return apiRequest("/demo-traveler", {
      method: "POST",
    });
  },

  async loginDemoManager() {
    return apiRequest("/demo-manager", {
      method: "POST",
    });
  },

  async getMe() {
    return apiRequest("/me", {
      method: "GET",
    });
  },
};

