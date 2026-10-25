/* Shared guest dashboard behavior and adapters over the central data store. */
const sidebar = document.querySelector("#sidebar");
const menuButton = document.querySelector("#menu-button");
const pageTitle = document.querySelector("#page-title");
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

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.animationDelay = `${Math.min(index * 55, 350)}ms`;
  revealObserver.observe(element);
});

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
