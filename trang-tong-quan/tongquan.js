const sidebar = document.querySelector("#sidebar");
const menuButton = document.querySelector("#menu-button");
const navItems = document.querySelectorAll(".nav-item");
const pageTitle = document.querySelector("#page-title");
const notificationButton = document.querySelector("#notification-button");
const notificationDropdown = document.querySelector("#notification-dropdown");
const profileButton = document.querySelector("#profile-button");
const profileDropdown = document.querySelector("#profile-dropdown");
const searchInput = document.querySelector("#dashboard-search");
const searchables = document.querySelectorAll(".searchable");
const noResults = document.querySelector("#no-results");
const requestModal = document.querySelector("#request-modal");
const requestForm = document.querySelector("#request-form");
const serviceSelect = document.querySelector("#service-select");
const requestNote = document.querySelector("#request-note");
const toast = document.querySelector("#toast");
const latestRequestTitle = document.querySelector("#latest-request-title");
const requestDescription = document.querySelector("#request-description");
const processingCounter = document.querySelector('.counter[data-target="2"]');
let toastTimer;

menuButton.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((navItem) => navItem.classList.remove("active"));
    item.classList.add("active");
    pageTitle.textContent = item.dataset.section;
    sidebar.classList.remove("open");

    if (item.dataset.section !== "Tổng quan") {
      showToast(`${item.dataset.section} đang được chuẩn bị cho bản demo.`);
    }
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

document.addEventListener("click", (event) => {
  if (!event.target.closest(".dropdown-wrap")) {
    notificationDropdown.classList.remove("open");
    profileDropdown.classList.remove("open");
  }

  if (
    window.innerWidth <= 860 &&
    sidebar.classList.contains("open") &&
    !event.target.closest("#sidebar") &&
    !event.target.closest("#menu-button")
  ) {
    sidebar.classList.remove("open");
  }
});

searchInput.addEventListener("input", () => {
  const term = normalize(searchInput.value);
  let visibleCount = 0;

  searchables.forEach((item) => {
    const matches = !term || normalize(item.dataset.search || "").includes(term);
    item.classList.toggle("is-filtered", !matches);
    if (matches) visibleCount += 1;
  });

  noResults.style.display = visibleCount ? "none" : "block";
});

document.querySelectorAll(".open-request").forEach((button) => {
  button.addEventListener("click", () => openRequestModal());
});

document.querySelectorAll(".service-card").forEach((card) => {
  card.querySelector("button").addEventListener("click", () => {
    openRequestModal(card.dataset.service);
  });
});

requestModal.querySelector(".modal__close").addEventListener("click", closeRequestModal);
requestModal.addEventListener("click", (event) => {
  if (event.target === requestModal) closeRequestModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeRequestModal();
    notificationDropdown.classList.remove("open");
    profileDropdown.classList.remove("open");
  }
});

requestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitButton = requestForm.querySelector(".modal__submit");

  submitButton.classList.add("loading");
  submitButton.disabled = true;

  window.setTimeout(() => {
    submitButton.classList.remove("loading");
    submitButton.disabled = false;
    latestRequestTitle.textContent = serviceSelect.value;
    requestDescription.textContent =
      requestNote.value.trim() || "Yêu cầu vừa được gửi đến đội ngũ vận hành.";
    processingCounter.dataset.target = "3";
    processingCounter.textContent = "03";
    closeRequestModal();
    requestNote.value = "";
    showToast("Yêu cầu đã được gửi thành công.");
  }, 850);
});

document.querySelector("#view-request").addEventListener("click", () => {
  document.querySelector(".request-card").classList.add("focus-card");
  showToast("Yêu cầu #SF-3184 đang được thực hiện.");
  window.setTimeout(
    () => document.querySelector(".request-card").classList.remove("focus-card"),
    1200,
  );
});

document.querySelector("#explore-offer").addEventListener("click", () => {
  showToast("Ưu đãi Spa đã được lưu cho phòng 1208.");
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.animationDelay = `${Math.min(index * 55, 350)}ms`;
  revealObserver.observe(element);
});

const counterObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.6 },
);

document.querySelectorAll(".counter").forEach((counter) => {
  counterObserver.observe(counter);
});

function openRequestModal(service) {
  if (service) serviceSelect.value = service;
  requestModal.classList.add("open");
  requestModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  window.setTimeout(() => requestNote.focus(), 250);
}

function closeRequestModal() {
  requestModal.classList.remove("open");
  requestModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function animateCounter(counter) {
  const target = Number(counter.dataset.target);
  const start = performance.now();
  const duration = 900;

  function frame(time) {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = String(Math.round(target * eased)).padStart(2, "0");
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.querySelector("p").textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
