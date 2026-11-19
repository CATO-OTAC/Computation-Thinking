/**
 * Travel Planner - Unified Navigation Component Logic
 * Quản lý menu đáp ứng (mobile toggle, bàn phím, aria-expanded) và phiên đăng nhập.
 */
import { SessionStorage } from "./api.js?v=8";

export function initGlobalNav(activePageKey = "") {
  const toggleBtn = document.querySelector(".nav-toggle-btn");
  const navLinks = document.querySelector(".nav-links-wrap");

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener("click", () => {
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      toggleBtn.setAttribute("aria-expanded", String(!isExpanded));
      navLinks.classList.toggle("is-open", !isExpanded);
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("is-open")) {
        navLinks.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.focus();
      }
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
      if (!navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        if (navLinks.classList.contains("is-open")) {
          navLinks.classList.remove("is-open");
          toggleBtn.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  // Active state highlighting
  if (activePageKey) {
    document.querySelectorAll(".nav-item").forEach((item) => {
      if (item.dataset.nav === activePageKey) {
        item.classList.add("active");
        item.setAttribute("aria-current", "page");
      }
    });
  }

  // Check login state
  const user = SessionStorage.getUser();
  const authLink = document.getElementById("nav-auth-link");
  const userBadge = document.getElementById("nav-user-badge");
  const usernameSpan = document.getElementById("nav-username");
  const managerLink = document.getElementById("nav-manager-link");

  if (user) {
    if (authLink) authLink.style.display = "none";
    if (userBadge) {
      userBadge.style.display = "inline-flex";
      if (usernameSpan) {
        const roleLabel = user.role === "manager" ? "Quản trị viên" : "Du khách";
        usernameSpan.textContent = `${user.name} (${roleLabel})`;
        usernameSpan.title = `${user.name} (${user.email})`;
      }
      if (user.role === "manager") {
        userBadge.classList.add("manager");
        if (managerLink) managerLink.style.display = "inline-flex";
      }
    }
  } else {
    if (authLink) authLink.style.display = "inline-flex";
    if (userBadge) userBadge.style.display = "none";
    if (managerLink) managerLink.style.display = "none";
  }
}
