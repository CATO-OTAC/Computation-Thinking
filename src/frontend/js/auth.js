/**
 * Travel Planner Assistant - Authentication Client Logic
 * Xử lý tương tác giao diện 4 trang auth, validate form, toggle mật khẩu,
 * gọi backend API và quản lý phiên người dùng.
 */

import { AuthAPI, SessionStorage } from "./api.js";

// ============================================================================
// SVG Icons tái sử dụng (Chuẩn Lucide / Feather sắc nét)
// ============================================================================

const ICONS = {
  eyeOpen: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`,
  eyeOff: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>`,
  check: `
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m5 10 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  alert: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`,
  info: `
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 9.5v4M10 6.5h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
};

// ============================================================================
// Trợ giúp Hiển thị Thông báo & Trạng thái (Alerts, Loading & Errors)
// ============================================================================

export function showAlert(elementId, message, type = "error") {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `alert-banner ${type}`;
  el.innerHTML = `
    <span class="alert-icon">${type === "success" ? ICONS.check : ICONS.alert}</span>
    <span>${message}</span>
  `;
  el.classList.remove("hidden");
  el.setAttribute("role", type === "error" ? "alert" : "status");
}

export function clearAlert(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = "";
  el.className = "alert-banner hidden";
  el.removeAttribute("role");
}

export function setFieldError(fieldId, errorMsg) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  const fieldGroup = input ? input.closest(".field-group") : null;
  const inputWrap = input ? input.closest(".input-wrap") : null;

  if (errorMsg) {
    if (input) {
      input.classList.add("has-error");
      input.setAttribute("aria-invalid", "true");
    }
    if (fieldGroup) fieldGroup.classList.add("has-error");
    if (inputWrap) {
      inputWrap.classList.remove("has-error-shake");
      void inputWrap.offsetWidth;
      inputWrap.classList.add("has-error-shake");
    }
    if (errorEl) {
      errorEl.innerHTML = `${ICONS.alert} <span>${errorMsg}</span>`;
      errorEl.style.display = "flex";
    }
  } else {
    if (input) {
      input.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
    }
    if (fieldGroup) fieldGroup.classList.remove("has-error");
    if (inputWrap) inputWrap.classList.remove("has-error-shake");
    if (errorEl) {
      errorEl.innerHTML = "";
      errorEl.style.display = "none";
    }
  }
}

export function clearAllErrors() {
  document.querySelectorAll(".field-error").forEach((el) => {
    el.innerHTML = "";
    el.style.display = "none";
  });
  document.querySelectorAll(".field-group").forEach((el) => el.classList.remove("has-error"));
  document.querySelectorAll(".input-wrap").forEach((el) => el.classList.remove("has-error-shake"));
  document.querySelectorAll(".requirements").forEach((el) => el.classList.remove("has-error"));
  document.querySelectorAll("input").forEach((input) => {
    input.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
  });
}

export function setButtonLoading(button, isLoading, defaultText = "Gửi") {
  if (!button) return;
  if (isLoading) {
    button.disabled = true;
    button.classList.add("is-loading");
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span> <span>Đang xử lý...</span>`;
  } else {
    button.classList.remove("is-loading");
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    } else {
      button.innerHTML = defaultText;
    }
  }
}

// ============================================================================
// Hiện / Ẩn Mật khẩu (Show / Hide Password Toggle)
// ============================================================================

export function setupPasswordToggles() {
  document.querySelectorAll(".eye-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.innerHTML = isHidden ? ICONS.eyeOff : ICONS.eyeOpen;
      btn.setAttribute("aria-label", isHidden ? "Ẩn mật khẩu" : "Hiện mật khẩu");
      btn.setAttribute("title", isHidden ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    });
  });
}

// ============================================================================
// Kiểm tra Quy tắc Mật khẩu (Live Password Requirements)
// ============================================================================

export function checkPasswordStrength(password) {
  return {
    length: password.length >= 8,
    digit: /\d/.test(password),
    casing: /[A-Z]/.test(password) && /[a-z]/.test(password),
  };
}

export function updateRequirementGrid(checks, containerId = "password-requirements") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const items = {
    length: container.querySelector("[data-rule='length']"),
    digit: container.querySelector("[data-rule='digit']"),
    casing: container.querySelector("[data-rule='casing']"),
  };

  Object.entries(items).forEach(([key, el]) => {
    if (!el) return;
    if (checks[key]) {
      el.classList.add("passed");
      el.setAttribute("aria-checked", "true");
    } else {
      el.classList.remove("passed");
      el.setAttribute("aria-checked", "false");
    }
  });
}

// ============================================================================
// 1. Màn hình ĐĂNG NHẬP (login.html)
// ============================================================================

function initLoginPage() {
  const form = document.getElementById("form-login");
  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("registered") === "true") {
    showAlert("login-alert", "Tài khoản đã được tạo thành công! Vui lòng đăng nhập để tiếp tục.", "success");
  }

  const savedToken = SessionStorage.getToken();
  if (savedToken) {
    AuthAPI.getMe()
      .then((res) => {
        if (res && res.user) {
          window.location.href = "dashboard.html";
        }
      })
      .catch(() => {
        SessionStorage.clear();
      });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAllErrors();
    clearAlert("login-alert");

    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const rememberInput = document.getElementById("login-remember");
    const submitBtn = document.getElementById("btn-login-submit");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;
    if (!email) {
      setFieldError("login-email", "Vui lòng nhập địa chỉ email.");
      hasError = true;
    } else if (!email.includes("@")) {
      setFieldError("login-email", "Email chưa đúng định dạng.");
      hasError = true;
    }

    if (!password) {
      setFieldError("login-password", "Vui lòng nhập mật khẩu.");
      hasError = true;
    }

    if (hasError) {
      const firstInvalid = form.querySelector("input.has-error");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setButtonLoading(submitBtn, true);
    try {
      const res = await AuthAPI.login(email, password);
      const remember = rememberInput ? rememberInput.checked : false;
      SessionStorage.setToken(res.token, remember);
      SessionStorage.setUser(res.user, remember);

      if (res.user && res.user.role === "manager") {
        window.location.href = "manager.html";
      } else {
        window.location.href = "planner.html";
      }
    } catch (err) {
      showAlert("login-alert", err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false, "Đăng nhập");
    }
  });

  // Xử lý nút One-Click Demo Traveler (F01)
  const demoTravelerBtn = document.getElementById("btn-demo-traveler");
  if (demoTravelerBtn) {
    demoTravelerBtn.addEventListener("click", async () => {
      setButtonLoading(demoTravelerBtn, true, "Đang vào...");
      try {
        const res = await AuthAPI.loginDemoTraveler();
        SessionStorage.setToken(res.token, true);
        SessionStorage.setUser(res.user, true);
        window.location.href = "planner.html";
      } catch (err) {
        showAlert("login-alert", err.message, "error");
      } finally {
        setButtonLoading(demoTravelerBtn, false, "⚡ Demo Du Khách");
      }
    });
  }

  // Xử lý nút One-Click Demo Manager (F01 & TC07)
  const demoManagerBtn = document.getElementById("btn-demo-manager");
  if (demoManagerBtn) {
    demoManagerBtn.addEventListener("click", async () => {
      setButtonLoading(demoManagerBtn, true, "Đang vào...");
      try {
        const res = await AuthAPI.loginDemoManager();
        SessionStorage.setToken(res.token, true);
        SessionStorage.setUser(res.user, true);
        window.location.href = "manager.html";
      } catch (err) {
        showAlert("login-alert", err.message, "error");
      } finally {
        setButtonLoading(demoManagerBtn, false, "⚡ Demo Quản Trị");
      }
    });
  }

  ["login-email", "login-password"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => setFieldError(id, ""));
  });
}

// ============================================================================
// 2. Màn hình ĐĂNG KÝ (register.html)
// ============================================================================

function initRegisterPage() {
  const form = document.getElementById("form-register");
  if (!form) return;

  const termsInput = document.getElementById("register-terms");
  const submitBtn = document.getElementById("btn-register-submit");
  const nameInput = document.getElementById("register-name");
  const emailInput = document.getElementById("register-email");
  const confirmInput = document.getElementById("register-confirm");
  const passwordInput = document.getElementById("register-password");

  const DRAFT_KEY = "tp_register_draft";

  // Khôi phục bản nháp họ tên, email nếu người dùng vô tình reload hoặc bấm quay lại
  try {
    const rawDraft = sessionStorage.getItem(DRAFT_KEY);
    if (rawDraft) {
      const draft = JSON.parse(rawDraft);
      if (draft.name && nameInput && !nameInput.value) nameInput.value = draft.name;
      if (draft.email && emailInput && !emailInput.value) emailInput.value = draft.email;
    }
  } catch (_) {}

  function saveDraft() {
    try {
      const draft = {
        name: nameInput ? nameInput.value : "",
        email: emailInput ? emailInput.value : "",
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (_) {}
  }

  nameInput?.addEventListener("input", saveDraft);
  emailInput?.addEventListener("input", saveDraft);

  // Yêu cầu: Nút "Tạo tài khoản" chỉ hoạt động khi tick chọn đồng ý điều khoản
  function syncTermsState() {
    if (submitBtn && termsInput) {
      submitBtn.disabled = !termsInput.checked;
      if (termsInput.checked) {
        submitBtn.removeAttribute("title");
        clearAlert("register-alert");
      } else {
        submitBtn.setAttribute("title", "Vui lòng đồng ý với Điều khoản sử dụng để kích hoạt tạo tài khoản.");
      }
    }
  }

  if (termsInput && submitBtn) {
    syncTermsState();
    termsInput.addEventListener("change", syncTermsState);
  }

  passwordInput?.addEventListener("input", (e) => {
    const checks = checkPasswordStrength(e.target.value);
    updateRequirementGrid(checks, "register-requirements");
    setFieldError("register-password", "");
    const reqContainer = document.getElementById("register-requirements");
    if (reqContainer && checks.length && checks.digit && checks.casing) {
      reqContainer.classList.remove("has-error");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAllErrors();
    clearAlert("register-alert");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    let hasError = false;

    if (!termsInput.checked) {
      showAlert("register-alert", "Bạn cần tích chọn đồng ý với Điều khoản sử dụng để tiếp tục.", "error");
      termsInput.focus();
      return;
    }

    if (!name) {
      setFieldError("register-name", "Vui lòng nhập họ và tên.");
      hasError = true;
    } else if (name.length < 2) {
      setFieldError("register-name", "Họ và tên cần ít nhất 2 ký tự.");
      hasError = true;
    }

    if (!email) {
      setFieldError("register-email", "Vui lòng nhập địa chỉ email.");
      hasError = true;
    } else if (!email.includes("@")) {
      setFieldError("register-email", "Email chưa đúng định dạng.");
      hasError = true;
    }

    const checks = checkPasswordStrength(password);
    const reqContainer = document.getElementById("register-requirements");

    if (!password) {
      setFieldError("register-password", "Vui lòng nhập mật khẩu.");
      if (reqContainer) reqContainer.classList.add("has-error");
      hasError = true;
    } else if (!checks.length || !checks.digit || !checks.casing) {
      setFieldError("register-password", "Mật khẩu chưa đạt điều kiện.");
      if (reqContainer) reqContainer.classList.add("has-error");
      hasError = true;
    } else {
      if (reqContainer) reqContainer.classList.remove("has-error");
    }

    if (!confirm) {
      setFieldError("register-confirm", "Vui lòng xác nhận mật khẩu.");
      hasError = true;
    } else if (password !== confirm) {
      setFieldError("register-confirm", "Mật khẩu xác nhận không khớp.");
      hasError = true;
    }

    if (hasError) {
      const firstInvalid = form.querySelector("input.has-error");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setButtonLoading(submitBtn, true);
    try {
      await AuthAPI.register(name, email, password, confirm);
      sessionStorage.removeItem(DRAFT_KEY);

      const successNotice = document.getElementById("register-success-notice");
      if (successNotice) {
        successNotice.classList.remove("hidden");
        form.reset();
        syncTermsState();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.location.href = "login.html?registered=true";
      }
    } catch (err) {
      showAlert("register-alert", err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false, "Tạo tài khoản");
      syncTermsState();
    }
  });

  ["register-name", "register-email", "register-confirm"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => setFieldError(id, ""));
  });
}

// ============================================================================
// 3. Màn hình QUÊN MẬT KHẨU (forgot-password.html)
// ============================================================================

function initForgotPasswordPage() {
  const form = document.getElementById("form-forgot");
  if (!form) return;

  const forgotView = document.getElementById("forgot-view");
  const sentView = document.getElementById("forgot-sent-view");
  const sentEmailDisplay = document.getElementById("sent-recipient-email");
  const openResetBtn = document.getElementById("btn-open-reset-link");
  const resendBtn = document.getElementById("btn-resend-forgot");

  let lastSentEmail = "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAllErrors();
    clearAlert("forgot-alert");

    const emailInput = document.getElementById("forgot-email");
    const submitBtn = document.getElementById("btn-forgot-submit");
    const email = emailInput.value.trim();

    if (!email) {
      setFieldError("forgot-email", "Vui lòng nhập địa chỉ email đã đăng ký.");
      return;
    }
    if (!email.includes("@")) {
      setFieldError("forgot-email", "Email chưa đúng định dạng.");
      return;
    }

    setButtonLoading(submitBtn, true);
    try {
      const res = await AuthAPI.forgotPassword(email);
      lastSentEmail = email;

      if (sentEmailDisplay) sentEmailDisplay.textContent = email;

      if (openResetBtn) {
        const targetToken = res.reset_token;
        if (targetToken) {
          openResetBtn.href = `reset-password.html?token=${encodeURIComponent(targetToken)}`;
          openResetBtn.style.display = "flex";
        } else {
          openResetBtn.style.display = "none";
        }
      }

      if (forgotView) forgotView.classList.add("hidden");
      if (sentView) sentView.classList.remove("hidden");
    } catch (err) {
      showAlert("forgot-alert", err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false, "Gửi liên kết đặt lại");
    }
  });

  resendBtn?.addEventListener("click", async () => {
    if (!lastSentEmail) return;
    setButtonLoading(resendBtn, true);
    try {
      await AuthAPI.forgotPassword(lastSentEmail);
      showAlert("sent-alert", "Đã gửi lại liên kết thành công!", "success");
    } catch (err) {
      showAlert("sent-alert", err.message, "error");
    } finally {
      setButtonLoading(resendBtn, false, "Gửi lại email");
    }
  });

  document.getElementById("forgot-email")?.addEventListener("input", () => {
    setFieldError("forgot-email", "");
  });
}

// ============================================================================
// 4. Màn hình ĐẶT LẠI MẬT KHẨU (reset-password.html)
// ============================================================================

function initResetPasswordPage() {
  const form = document.getElementById("form-reset");
  if (!form) return;

  const resetView = document.getElementById("reset-view");
  const successView = document.getElementById("reset-success-view");

  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token") || (window.location.hash.includes("token=") ? window.location.hash.split("token=")[1].split("&")[0] : "");
  const tokenInput = document.getElementById("reset-token-input");

  if (tokenFromUrl && tokenInput) {
    tokenInput.value = tokenFromUrl;
  } else if (!tokenInput || !tokenInput.value) {
    showAlert("reset-alert", "Mã liên kết không hợp lệ hoặc thiếu token đặt lại mật khẩu.", "error");
  }

  const newPasswordInput = document.getElementById("reset-new-password");
  newPasswordInput?.addEventListener("input", (e) => {
    const checks = checkPasswordStrength(e.target.value);
    updateRequirementGrid(checks, "reset-requirements");
    setFieldError("reset-new-password", "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAllErrors();
    clearAlert("reset-alert");

    const token = tokenInput ? tokenInput.value.trim() : "";
    const confirmInput = document.getElementById("reset-confirm-password");
    const submitBtn = document.getElementById("btn-reset-submit");

    const newPassword = newPasswordInput.value;
    const confirm = confirmInput.value;

    let hasError = false;

    if (!token) {
      showAlert("reset-alert", "Mã liên kết đặt lại không hợp lệ hoặc đã hết hạn.", "error");
      return;
    }

    const checks = checkPasswordStrength(newPassword);
    const reqContainer = document.getElementById("reset-requirements");

    if (!newPassword) {
      setFieldError("reset-new-password", "Vui lòng nhập mật khẩu mới.");
      if (reqContainer) reqContainer.classList.add("has-error");
      hasError = true;
    } else if (!checks.length || !checks.digit || !checks.casing) {
      setFieldError("reset-new-password", "Mật khẩu chưa đạt điều kiện.");
      if (reqContainer) reqContainer.classList.add("has-error");
      hasError = true;
    } else {
      if (reqContainer) reqContainer.classList.remove("has-error");
    }

    if (!confirm) {
      setFieldError("reset-confirm-password", "Vui lòng xác nhận mật khẩu mới.");
      hasError = true;
    } else if (newPassword !== confirm) {
      setFieldError("reset-confirm-password", "Mật khẩu xác nhận không khớp.");
      hasError = true;
    }

    if (hasError) {
      const firstInvalid = form.querySelector("input.has-error");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setButtonLoading(submitBtn, true);
    try {
      await AuthAPI.resetPassword(token, newPassword, confirm);
      if (resetView) resetView.classList.add("hidden");
      if (successView) successView.classList.remove("hidden");
    } catch (err) {
      showAlert("reset-alert", err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false, "Cập nhật mật khẩu");
    }
  });

  ["reset-new-password", "reset-confirm-password"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => setFieldError(id, ""));
  });
}

// ============================================================================
// 5. Màn hình DASHBOARD (dashboard.html)
// ============================================================================

function initDashboardPage() {
  const dashContainer = document.getElementById("dashboard-page");
  if (!dashContainer) return;

  const token = SessionStorage.getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const nameEl = document.getElementById("dash-name");
  const emailEl = document.getElementById("dash-email");
  const avatarEl = document.getElementById("dash-avatar");
  const logoutBtn = document.getElementById("btn-logout");

  AuthAPI.getMe()
    .then((res) => {
      const user = res.user;
      if (nameEl) nameEl.textContent = user.name || "Khách du lịch";
      if (emailEl) emailEl.textContent = user.email || "";
      if (avatarEl) {
        avatarEl.textContent = (user.name || "U").trim().charAt(0).toUpperCase();
      }
    })
    .catch(() => {
      SessionStorage.clear();
      window.location.href = "login.html";
    });

  logoutBtn?.addEventListener("click", async () => {
    setButtonLoading(logoutBtn, true);
    try {
      await AuthAPI.logout();
      window.location.href = "login.html";
    } finally {
      setButtonLoading(logoutBtn, false, "Đăng xuất");
    }
  });
}

// ============================================================================
// 6. Xử lý Modal Xem Điều khoản & Chính sách quyền riêng tư
// ============================================================================

function initLegalModals() {
  document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modalId = trigger.getAttribute("data-open-modal");
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      }
    });
  });

  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    const close = () => {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    };

    modal.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      });
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay:not(.hidden)").forEach((modal) => {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
      });
    }
  });
}

// ============================================================================
// Khởi chạy khi DOM sẵn sàng
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  setupPasswordToggles();
  initLoginPage();
  initRegisterPage();
  initForgotPasswordPage();
  initResetPasswordPage();
  initDashboardPage();
  initLegalModals();
});
