/* ============================================================================
 * yeucau.js — Riêng trang "Yêu cầu của tôi"
 * ----------------------------------------------------------------------------
 * Phần khung dashboard (sidebar, dropdown, toast, Escape, kho yêu cầu, hiệu ứng hiện
 * dần) nằm ở ../trang-dung-chung/dashboard.js.
 * File này chỉ xử lý danh sách yêu cầu:
 *   1. Lọc theo tab trạng thái + dropdown + từ khoá, rồi chia trang.
 *   2. Đếm lại số lượng cho các tab và thẻ số liệu.
 *   3. Mở/đóng chi tiết, huỷ, đánh giá, gửi lại một yêu cầu.
 *   4. Dựng thẻ yêu cầu mới / đọc lại từ localStorage.
 *   5. Danh sách thông báo lấy từ chính các yêu cầu đã tạo.
 * ========================================================================= */

/* --- 1. Tham chiếu phần tử riêng của trang --- */
const listSearchInput = document.querySelector("#request-search"); // ô tìm trong danh sách
const statusSelect = document.querySelector("#status-select");
const daySelect = document.querySelector("#day-select");
const requestList = document.querySelector("#request-list"); // <section> chứa các thẻ
const emptyState = document.querySelector("#empty-state");
const pagerElement = document.querySelector("#request-pager");
const pageRange = document.querySelector("#page-range");
const pageTotal = document.querySelector("#page-total");
const requestTemplate = document.querySelector("#request-template");

/* Bảng SERVICE_META (phụ trách + thời gian dự kiến theo dịch vụ) nằm ở dashboard.js
   vì trang "Tạo yêu cầu mới" cũng dùng để dựng ô chọn dịch vụ. */

let activeFilter = "all"; // tab trạng thái đang chọn
let currentPage = 1; // trang hiện tại của danh sách
const PAGE_SIZE = 3; // mỗi trang 3 yêu cầu; đổi số này là đổi luôn phân trang

/* --- 2. Truy vấn danh sách --- */
function requestItems() {
  return Array.from(requestList.querySelectorAll(".request-item"));
}

function cardCode(item) {
  return item.querySelector(".request-item__code").textContent.trim();
}

/* Từ khoá tìm kiếm: gộp ô tìm trên topbar và ô tìm trong danh sách. */
function searchTerm() {
  return normalize(`${searchInput.value} ${listSearchInput.value}`.trim());
}

/* Một yêu cầu có hiện ra hay không: tab trạng thái + dropdown trạng thái + ngày + từ khoá. */
function matchesFilters(item) {
  const term = searchTerm();
  const status = statusSelect.value;
  const day = daySelect.value;

  return (
    (activeFilter === "all" || item.dataset.status === activeFilter) &&
    (status === "all" || item.dataset.status === status) &&
    (day === "all" || item.dataset.day === day) &&
    (!term || normalize(item.dataset.search || "").includes(term))
  );
}

/* Áp bộ lọc rồi chia trang; dùng lại .is-filtered của khối dùng chung để ẩn thẻ. */
function applyFilters() {
  const matched = requestItems().filter(matchesFilters);
  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = new Set(matched.slice(start, start + PAGE_SIZE));

  requestItems().forEach((item) => item.classList.toggle("is-filtered", !pageItems.has(item)));

  /* Trạng thái trống nói đúng nguyên nhân: chưa có yêu cầu nào, hay bị bộ lọc loại. */
  const all = requestItems();
  emptyState.textContent = all.length
    ? "Không có yêu cầu nào khớp với bộ lọc hiện tại."
    : "Bạn chưa có yêu cầu nào. Bấm “Tạo yêu cầu mới” để gửi yêu cầu đầu tiên.";
  emptyState.classList.toggle("show", matched.length === 0);

  pageRange.textContent = matched.length ? `${start + 1}–${start + pageItems.size}` : "0";
  pageTotal.textContent = matched.length;
  renderPager(pageCount);
}

/* Một nút cho mỗi trang + Trước/Sau, thay vì hard-code số trang trong HTML. */
function renderPager(pageCount) {
  pagerElement.innerHTML = "";

  const button = (label, disabled, page) => {
    const element = document.createElement("button");
    element.className = "pager-button";
    element.type = "button";
    element.textContent = label;
    element.disabled = disabled;
    if (page === currentPage) {
      element.classList.add("is-active");
      element.setAttribute("aria-current", "page");
    }
    element.addEventListener("click", () => {
      if (page === currentPage) return;
      currentPage = page;
      applyFilters();
    });
    pagerElement.appendChild(element);
  };

  button("Trước", currentPage === 1, currentPage - 1);
  for (let page = 1; page <= pageCount; page += 1) button(String(page), false, page);
  button("Sau", currentPage === pageCount, currentPage + 1);
}

/* Số trên tab và trên thẻ số liệu luôn tính lại từ danh sách thật. */
function refreshCounts() {
  const counts = { all: 0, processing: 0, done: 0, cancelled: 0 };

  requestItems().forEach((item) => {
    counts.all += 1;
    if (counts[item.dataset.status] !== undefined) counts[item.dataset.status] += 1;
  });

  document.querySelectorAll("[data-count]").forEach((element) => {
    element.textContent = counts[element.dataset.count] ?? 0;
  });

  document.querySelectorAll("[data-status-count]").forEach((element) => {
    element.textContent = String(counts[element.dataset.statusCount] ?? 0).padStart(2, "0");
  });
}
/* --- 3. Gắn sự kiện cho bộ lọc --- */
document.querySelectorAll(".filter-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".filter-tab").forEach((other) => {
      const isCurrent = other === tab;
      other.classList.toggle("is-active", isCurrent);
      other.setAttribute("aria-pressed", String(isCurrent));
    });

    activeFilter = tab.dataset.filter;
    currentPage = 1; // đổi bộ lọc thì quay về trang đầu
    applyFilters();
  });
});

[searchInput, listSearchInput].forEach((input) => {
  input.addEventListener("input", () => {
    currentPage = 1;
    applyFilters();
  });
});

[statusSelect, daySelect].forEach((select) => {
  select.addEventListener("change", () => {
    currentPage = 1;
    applyFilters();
  });
});

/* --- 4. Nhãn + aria-expanded của nút "Xem chi tiết" luôn suy ra từ class .expanded --- */
function syncToggleLabels() {
  requestItems().forEach((item) => {
    const expanded = item.classList.contains("expanded");
    const toggle = item.querySelector(".request-item__toggle");
    toggle.textContent = expanded ? "Thu gọn" : "Xem chi tiết";
    toggle.setAttribute("aria-expanded", String(expanded));
  });
}

/* --- 5. Một chỗ duy nhất xử lý mọi cú click trong danh sách --- */
requestList.addEventListener("click", (event) => {
  const toggle = event.target.closest(".request-item__toggle");
  if (toggle) {
    const item = toggle.closest(".request-item");
    const expanded = item.classList.toggle("expanded"); // CSS lo phần hiện/ẩn chi tiết
    toggle.textContent = expanded ? "Thu gọn" : "Xem chi tiết";
    toggle.setAttribute("aria-expanded", String(expanded));
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;

  const item = action.closest(".request-item");

  if (action.dataset.action === "cancel") {
    markCancelled(item);
    showToast("Yêu cầu đã được huỷ.");
    return;
  }

  if (action.dataset.action === "rate") {
    showToast("Cảm ơn bạn đã đánh giá dịch vụ.");
    return;
  }

  if (action.dataset.action === "repeat") {
    createRequest(item.querySelector("h3").textContent, ""); // gửi lại với ghi chú trống
    showToast("Đã gửi lại yêu cầu.");
  }
});

/* Huỷ yêu cầu: đổi nhãn trạng thái, bỏ bước đang chạy, xoá nút huỷ rồi đếm lại. */
function markCancelled(item) {
  item.dataset.status = "cancelled";

  const pill = item.querySelector(".status");
  pill.className = "status status--muted";
  pill.textContent = "Đã huỷ";

  const steps = Array.from(item.querySelectorAll(".timeline-step"));
  steps.forEach((step) => step.classList.remove("active"));
  if (steps.length) steps[steps.length - 1].querySelector("small").textContent = "Đã huỷ";

  item.querySelectorAll('[data-action="cancel"]').forEach((button) => button.remove());
  const hint = item.querySelector(".request-item__hint");
  if (hint) hint.textContent = "Yêu cầu đã huỷ, không phát sinh phí.";

  refreshCounts();
  applyFilters();
}
/* --- 6. Dựng thẻ yêu cầu từ <template> ---
 * Dùng chung cho yêu cầu vừa tạo và yêu cầu đọc lại từ localStorage,
 * nhờ vậy thẻ mới và thẻ sau khi tải lại trang trông giống hệt nhau. */
function renderRequest({ code, title, note, time }) {
  const meta = SERVICE_META[title] || SERVICE_META["Gọi dọn phòng"];
  const node = requestTemplate.content.firstElementChild.cloneNode(true);
  const field = (name) => node.querySelector(`[data-field="${name}"]`);

  field("title").textContent = title;
  field("code").textContent = code;
  field("meta").textContent = `Gửi ${time} hôm nay · Phòng 1208 · Ưu tiên bình thường`;
  field("owner").textContent = meta.owner;
  field("note").textContent = note || "Không có ghi chú.";
  field("eta").textContent = meta.eta;
  node.querySelector(".request-item__icon img").src = meta.icon;
  node.querySelector(".timeline-step small").textContent = `Đã gửi · ${time}`;

  /* data-day / data-search là dữ liệu cho bộ lọc ở matchesFilters(). */
  node.dataset.day = "today";
  node.dataset.search = `${title} ${code} ${note}`;

  requestList.prepend(node); // yêu cầu mới nhất luôn nằm đầu danh sách
}

/* Yêu cầu mới: cấp mã kế tiếp, lưu vào kho chung, rồi hiện lên đầu danh sách. */
function createRequest(title, note) {
  const record = { code: nextRequestCode(), title, note, time: nowClock() };
  saveRequest(record);
  renderRequest(record);

  currentPage = 1;
  refreshCounts();
  applyFilters();
  renderNotifications();
}

/* Hiện lại yêu cầu đã lưu (kể cả yêu cầu tạo từ trang Tổng quan); bỏ qua mã đã
   có sẵn trong HTML để không nhân đôi thẻ. */
function restoreRequests() {
  const rendered = new Set(requestItems().map(cardCode));

  readRequests().forEach((record) => {
    if (record && record.code && !rendered.has(record.code)) renderRequest(record);
  });
}

/* Thông báo lấy từ chính các yêu cầu đã tạo: chưa tạo gì thì danh sách để trống. */
function renderNotifications() {
  const records = readRequests();
  const badge = notificationDropdown.querySelector(".dropdown__heading span");
  const empty = notificationDropdown.querySelector(".dropdown__empty");

  notificationDropdown.querySelectorAll(".notification-item").forEach((item) => item.remove());

  badge.hidden = records.length === 0;
  badge.textContent = `${records.length} mới`;
  empty.hidden = records.length > 0;

  [...records].reverse().forEach((record) => {
    const item = document.createElement("button");
    item.className = "notification-item";
    item.type = "button";
    item.innerHTML = "<b></b><small></small>";
    item.querySelector("b").textContent = `${record.title} đang được xử lý`;
    item.querySelector("small").textContent = `Gửi ${record.time} hôm nay · ${record.code}`;
    item.addEventListener("click", () => {
      notificationDropdown.classList.remove("open");
      showRequest(record.code);
    });
    notificationDropdown.appendChild(item);
  });
}

/* Bấm vào thông báo: bỏ mọi bộ lọc rồi mở đúng thẻ yêu cầu đó. */
function showRequest(code) {
  activeFilter = "all";
  statusSelect.value = "all";
  daySelect.value = "all";
  searchInput.value = "";
  listSearchInput.value = "";

  document.querySelectorAll(".filter-tab").forEach((tab) => {
    const isCurrent = tab.dataset.filter === "all";
    tab.classList.toggle("is-active", isCurrent);
    tab.setAttribute("aria-pressed", String(isCurrent));
  });

  const card = requestItems().find((item) => cardCode(item) === code);
  if (!card) return;

  /* Nhảy tới đúng trang chứa thẻ rồi mới mở chi tiết và cuộn tới nó. */
  const index = Math.max(requestItems().filter(matchesFilters).indexOf(card), 0);
  currentPage = Math.floor(index / PAGE_SIZE) + 1;
  card.classList.add("expanded");
  syncToggleLabels();
  applyFilters();
  card.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* --- 7. Nút "Tạo yêu cầu mới" ---
 * Trang này không còn modal: nút là liên kết sang trang-tao-yeu-cau/taoyeucau.html,
 * khách chọn dịch vụ rồi gửi ở đó; gửi xong trang đó quay về đây và createRequest()
 * ở mục 6 dựng thẻ từ chính bản ghi đã lưu trong kho chung. */

/* --- 8. Khởi động trang ---
 * Thứ tự quan trọng: đọc lại dữ liệu trước, rồi mới đếm và chia trang, để số trên
 * tab luôn khớp với danh sách đang hiển thị. */
restoreRequests();
renderNotifications();
syncToggleLabels();
refreshCounts();
applyFilters();