/* --- 0. Giao diện sáng/tối: chạy trước mọi thứ để trang không nháy sai màu ---
 * Lựa chọn lưu ở localStorage nên giữ nguyên khi đổi trang hoặc tải lại. Nút bấm
 * được chèn vào .user-tools của topbar nên 5 trang khách không phải sửa HTML.
 * Bọc trong IIFE để không lộ biến ra phạm vi toàn cục dùng chung với script trang. */
(() => {
  const THEME_KEY = "stayflow_theme"; // khoá riêng, không dính tới kho yêu cầu
  const root = document.documentElement;

  // localStorage có thể bị chặn (chế độ riêng tư) -> lỗi đọc/ghi không được làm sập trang.
  const readTheme = () => {
    try { return localStorage.getItem(THEME_KEY); } catch (error) { return null; }
  };
  const saveTheme = (value) => {
    try { localStorage.setItem(THEME_KEY, value); } catch (error) { /* không lưu được thì thôi */ }
  };

  // Gắn ngay khi script chạy: shared/dashboard.css đọc thuộc tính này.
  root.setAttribute("data-theme", readTheme() === "dark" ? "dark" : "light");

  // Icon vẽ bằng SVG nội tuyến + currentColor nên tự đổi màu theo giao diện.
  const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 14.6A8.6 8.6 0 1 1 9.4 3.5a6.9 6.9 0 0 0 11.1 11.1Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

  const themeButton = document.createElement("button");
  themeButton.type = "button";
  themeButton.className = "theme-toggle";

  // Nút hiện icon của giao diện SẼ chuyển sang: đang sáng -> mặt trăng, đang tối -> mặt trời.
  const renderThemeButton = () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    const label = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
    themeButton.innerHTML = isDark ? ICON_SUN : ICON_MOON;
    themeButton.setAttribute("aria-label", label);
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.title = label;
  };

  themeButton.addEventListener("click", () => {
    const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", nextTheme);
    saveTheme(nextTheme);
    renderThemeButton();
  });

  renderThemeButton();

  // Đặt ngay bên trái chuông thông báo; trang nào không có .user-tools thì chỉ đổi giao diện.
  const userTools = document.querySelector(".user-tools");
  if (userTools) {
    const bellButton = document.querySelector("#notification-button");
    const bellWrap = bellButton && bellButton.closest(".dropdown-wrap");
    userTools.insertBefore(themeButton, bellWrap || userTools.firstChild);
  }
})();

/* --- 1. Tham chiếu phần tử khung dashboard (lấy một lần, dùng lại nhiều lần) --- */
const sidebar = document.querySelector("#sidebar"); // aside điều hướng bên trái
const menuButton = document.querySelector("#menu-button"); // nút 3 gạch trên mobile
const pageTitle = document.querySelector("#page-title"); // tiêu đề trang trên topbar
const notificationButton = document.querySelector("#notification-button");
const notificationDropdown = document.querySelector("#notification-dropdown");
const profileButton = document.querySelector("#profile-button");
const profileDropdown = document.querySelector("#profile-dropdown");
const toast = document.querySelector("#toast");
const searchInput = document.querySelector("#dashboard-search");
let toastTimer;

const GUEST_STAY_ID = "STY-2026-1042";
const SERVICE_META = {};
const ICON_BY_SERVICE = {
  "SVC-ROOM-SERVICE": "../assets/images/9e188.svg",
  "SVC-HOUSEKEEPING": "../assets/images/ccf51.svg",
  "SVC-TOWELS": "../assets/images/f8914.svg",
  "SVC-MAINTENANCE": "../assets/images/3df7f.svg",
  "SVC-TRANSPORT": "../assets/images/9e188.svg",
  "SVC-FRONT-DESK": "../assets/images/f8914.svg",
};
const OWNER_BY_DEPARTMENT = {
  "Ẩm thực": "Bếp Aurora",
  "Buồng phòng": "Đội buồng phòng",
  "Kỹ thuật": "Kỹ thuật toà nhà",
  "Lễ tân": "Lễ tân",
};

function guestStay() {
  if (!window.StayFlowData) throw new Error("Dữ liệu lưu trú chưa sẵn sàng.");
  return window.StayFlowData.stays.find((stay) => stay.id === GUEST_STAY_ID);
}

function requestView(request) {
  const service = window.StayFlowData.serviceTypes.find((item) => item.id === request.serviceTypeId);
  const createdAt = new Date(request.createdAt);
  const dayKey = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(date);
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const createdDay = dayKey(createdAt);
  const day = createdDay === today ? "today" : createdDay === yesterday ? "yesterday" : "older";
  const dayLabel = day === "today" ? "hôm nay" : day === "yesterday" ? "hôm qua" : new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(createdAt);
  return {
    id: request.id,
    code: `#${request.id}`,
    title: request.title,
    serviceName: service && service.categoryName,
    note: request.content,
    time: new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(createdAt),
    day,
    dayLabel,
    status: request.status === "Hoàn thành" ? "completed" : request.status === "Đã hủy" ? "cancelled" : "in_progress",
  };
}

function readRequests() {
  const stay = guestStay();
  if (!stay) throw new Error("Không tìm thấy kỳ lưu trú dành cho tài khoản demo.");
  return window.StayFlowData.requests
    .filter((request) => request.stayId === stay.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(requestView);
}

function saveRequest(record) {
  const id = String(record.id || record.code || "").replace(/^#/, "");
  const existing = window.StayFlowData.requests.find((request) => request.id === id);
  if (existing) {
    return requestView(window.StayFlowStore.updateGuestRequest({ id, status: record.status, note: record.note }));
  }
  const service = window.StayFlowData.serviceTypes.find((item) => item.categoryName === (record.serviceName || record.title));
  if (!service) throw new Error(`Không tìm thấy loại dịch vụ "${record.serviceName || record.title}".`);
  const request = window.StayFlowStore.createRequest({
    id,
    stayId: GUEST_STAY_ID,
    serviceTypeId: service.id,
    title: record.title,
    description: record.note,
    priority: "Trung bình",
  });
  return requestView(request);
}

function nextRequestCode() {
  return `#${window.StayFlowStore.nextRequestId()}`;
}

const STAYFLOW_REQUESTS_READY = window.StayFlowDataReady
  .then(() => {
    const data = window.StayFlowData;
    data.serviceTypes.forEach((service) => {
      if (service.active === false) return;
      SERVICE_META[service.categoryName] = {
        id: service.id,
        icon: ICON_BY_SERVICE[service.id] || "../assets/images/ccf51.svg",
        owner: OWNER_BY_DEPARTMENT[service.department] || service.department,
        eta: `Trong ${service.expectedSLA} phút`,
      };
    });
    const records = readRequests();
    if (!document.querySelector("#request-list")) {
      const dropdown = document.querySelector("#notification-dropdown");
      const heading = dropdown && dropdown.querySelector(".dropdown__heading");
      const empty = dropdown && dropdown.querySelector(".dropdown__empty");
      if (heading && empty) {
        let badge = heading.querySelector("span");
        if (!badge) {
          badge = document.createElement("span");
          heading.appendChild(badge);
        }
        badge.hidden = records.length === 0;
        badge.textContent = `${records.length} mới`;
        empty.hidden = records.length > 0;
        records.forEach((record) => {
          const item = document.createElement("button");
          item.className = "notification-item";
          item.type = "button";
          item.innerHTML = "<b></b><small></small>";
          const state = record.status === "completed" ? "đã hoàn thành" : record.status === "cancelled" ? "đã huỷ" : "đang được xử lý";
          item.querySelector("b").textContent = `${record.title} ${state}`;
          item.querySelector("small").textContent = `Gửi ${record.time} ${record.dayLabel} · ${record.code}`;
          item.addEventListener("click", () => { window.location.href = "guest-service-requests.html"; });
          dropdown.appendChild(item);
        });
      }
    }
    return records;
  })
  .catch((error) => {
    console.error("Không thể khởi tạo dữ liệu khách:", error);
    const message = document.createElement("p");
    message.setAttribute("role", "alert");
    message.textContent = `Không thể tải dữ liệu StayFlow: ${error.message}`;
    document.body.prepend(message);
    throw error;
  });

function nowClock() {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.querySelector("p").textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function normalize(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

menuButton.addEventListener("click", () => sidebar.classList.toggle("open"));

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    sidebar.classList.remove("open");
    if (item.tagName === "A") return;
    const alreadyActive = item.classList.contains("active");
    document.querySelectorAll(".nav-item").forEach((navItem) => navItem.classList.remove("active"));
    item.classList.add("active");
    pageTitle.textContent = item.dataset.section;
    if (!alreadyActive) showToast(`${item.dataset.section} đang được chuẩn bị cho bản demo.`);
  });
});

notificationButton.addEventListener("click", (event) => {
  event.stopPropagation();
  profileDropdown.classList.remove("open");
  notificationDropdown.classList.toggle("open");
});

profileButton.addEventListener("click", (event) => {
  event.stopPropagation();
  notificationDropdown.classList.remove("open");
  profileDropdown.classList.toggle("open");
});

const logoutLink = document.querySelector('#profile-dropdown a[href*="login"]');
if (logoutLink) logoutLink.addEventListener("click", () => localStorage.removeItem("stayflow_user_name"));

document.addEventListener("click", (event) => {
  if (!event.target.closest(".dropdown-wrap")) {
    notificationDropdown.classList.remove("open");
    profileDropdown.classList.remove("open");
  }
  if (window.innerWidth <= 860 && sidebar.classList.contains("open") &&
      !event.target.closest("#sidebar") && !event.target.closest("#menu-button")) {
    sidebar.classList.remove("open");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeRequestModal();
  notificationDropdown.classList.remove("open");
  profileDropdown.classList.remove("open");
});

const currentUserName = localStorage.getItem("stayflow_user_name");
if (currentUserName) {
  const profileName = document.querySelector("#profile-button b");
  if (profileName) profileName.textContent = currentUserName;
}
let openRequestModal = () => {};
let closeRequestModal = () => {};

function setupRequestModal(onSubmit) {
  const modal = document.querySelector("#request-modal");
  const form = document.querySelector("#request-form");
  const serviceSelect = document.querySelector("#service-select");
  const noteInput = document.querySelector("#request-note");
  const submitButton = form.querySelector(".modal__submit");

  openRequestModal = (service) => {
    if (service) serviceSelect.value = service;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => noteInput.focus(), 250);
  };

  closeRequestModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  modal.querySelector(".modal__close").addEventListener("click", closeRequestModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeRequestModal();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitButton.classList.add("loading");
    submitButton.disabled = true;
    window.setTimeout(() => {
      submitButton.classList.remove("loading");
      submitButton.disabled = false;
      try {
        onSubmit({ title: serviceSelect.value, note: noteInput.value.trim() });
        closeRequestModal();
        noteInput.value = "";
        showToast("Yêu cầu đã được gửi thành công.");
      } catch (error) {
        console.error("Không thể lưu yêu cầu khách:", error);
        showToast(`Không thể lưu yêu cầu: ${error.message}`);
      }
    }, 850);
  });
}
