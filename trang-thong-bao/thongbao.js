/* ============================================================================
 * thongbao.js — Riêng trang "Trung tâm thông báo"
 * ----------------------------------------------------------------------------
 * Khung dashboard (sidebar, dropdown trên topbar, toast, phím Escape, tên người
 * dùng) nằm ở ../trang-dung-chung/dashboard.js. File này chỉ lo thông báo:
 *   1. Đọc/ghi danh sách trong localStorage (khoá stayflow_notifications).
 *   2. Dựng một dòng cho mỗi thông báo, kèm nhãn "Chưa đọc".
 *   3. Lọc theo chip (Tất cả / Chưa đọc / Hệ thống), theo loại, khoảng thời gian, từ khoá.
 *   4. Đánh dấu đã đọc (từng dòng hoặc tất cả), bỏ đánh dấu, xoá thông báo.
 *   5. Đồng bộ số đếm: chip, dòng phụ đề, chấm đỏ trên chuông, dropdown topbar.
 * ========================================================================= */

/* --- 1. Tham chiếu phần tử riêng của trang --- */
const noticeList = document.querySelector("#notice-list");
const noticeEmpty = document.querySelector("#notice-empty");
const noticeTemplate = document.querySelector("#notice-template");
const listSearchInput = document.querySelector("#notice-search"); // ô tìm trong danh sách
const kindSelect = document.querySelector("#kind-select");
const rangeSelect = document.querySelector("#range-select");
const markAllButton = document.querySelector("#mark-all");
const totalLabel = document.querySelector("#notice-total");
const unreadLabel = document.querySelector("#notice-unread");
const bellDot = document.querySelector("#bell-dot"); // chấm đỏ "còn thông báo chưa đọc"
const NOTICE_KEY = "stayflow_notifications"; // cùng quy ước với stayflow_requests, stayflow_profile

/* Bốn thông báo của kỳ lưu trú hiện tại. "minutes" = số phút trước đây, dùng để
   tính mốc thời gian hiển thị và cho bộ lọc "7 ngày gần đây". */
const NOTICE_SEED = [
  { id: "n1", kind: "request", title: "Yêu cầu #SF-3184 đã hoàn thành", body: "Khăn tắm mới đã được giao đến phòng 1208.", minutes: 5, read: false },
  { id: "n2", kind: "service", title: "Đơn bữa tối đang được chuẩn bị", body: "Dự kiến giao lúc 19:20. Bạn có thể theo dõi trạng thái trong Yêu cầu của tôi.", minutes: 24, read: false },
  { id: "n3", kind: "offer", title: "Ưu đãi spa dành riêng cho kỳ lưu trú", body: "Giảm 20% liệu trình Aurora Signature đến hết ngày mai.", minutes: 120, read: true },
  { id: "n4", kind: "system", title: "Đăng nhập mới được xác nhận", body: "Thiết bị Safari trên macOS · Đà Nẵng.", minutes: 1445, read: true },
];

/* Nhãn + hình icon theo loại. Icon vẽ nội tuyến nên không thêm tệp vào assets/
   và vẫn đổi màu theo CSS (xem .notice-item[data-kind] trong thongbao.css). */
const NOTICE_KINDS = {
  request: { label: "Yêu cầu", icon: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>' },
  service: { label: "Dịch vụ", icon: '<path d="M14.7 6.3a4 4 0 0 1 5 5L9 22l-4 1 1-4Z"/>' },
  offer: { label: "Ưu đãi", icon: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="m18 15.6.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8Z"/>' },
  system: { label: "Hệ thống", icon: '<path d="M12 3.5 20 7v5.5c0 4.2-3.3 7.4-8 8.5-4.7-1.1-8-4.3-8-8.5V7Z"/><path d="m9 12 2 2 4-4.5"/>' },
};

/* --- 2. Đọc/ghi danh sách --- */
/* Lần đầu mở trang thì dùng 4 thông báo mẫu; các lần sau đọc lại đúng trạng thái
   đã đọc/xoá mà khách vừa thao tác. JSON hỏng thì quay về bộ mẫu. */
function seedNotices() {
  return NOTICE_SEED.map((notice) => ({ ...notice }));
}

/* Trả về danh sách thật. Lần đầu (chưa có trong kho) phải LƯU bộ mẫu xuống
   localStorage để các trang khác (Tổng quan, Yêu cầu...) đọc lại cho chuông
   đồng bộ; nếu chỉ trả về trong bộ nhớ thì chuông ở trang khác luôn trống. */
function readNotices() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTICE_KEY) || "null");
    if (Array.isArray(saved)) return saved;
    const seeded = seedNotices();
    localStorage.setItem(NOTICE_KEY, JSON.stringify(seeded));
    return seeded;
  } catch {
    return seedNotices();
  }
}

function saveNotices(list) {
  try {
    localStorage.setItem(NOTICE_KEY, JSON.stringify(list));
  } catch {
    /* localStorage bị chặn thì bỏ qua: danh sách vẫn dùng được trong phiên này. */
  }
}

let notices = readNotices();
let activeFilter = "all"; // chip đang chọn: all | unread | system

/* --- 3. Hiển thị --- */
/* Mốc thời gian tương đối: dưới 1 giờ đếm phút, trong ngày đếm giờ, hơn 1 ngày ghi
   "Hôm qua, HH:MM", xa hơn nữa thì ghi ngày tháng. */
function noticeTime(minutes) {
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;

  const at = new Date(Date.now() - minutes * 60000);
  const clock = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(at);
  return minutes < 2880 ? `Hôm qua, ${clock}` : new Intl.DateTimeFormat("vi-VN").format(at);
}
/* SVG nội tuyến của một loại thông báo (cùng khung nét với các icon khác). */
function iconMarkup(kind) {
  return `<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" viewBox="0 0 24 24">${NOTICE_KINDS[kind].icon}</svg>`;
}

/* Một dòng cho mỗi thông báo. Dòng chưa đọc thêm class .is-unread (CSS lo nền xanh)
   và nhãn "Chưa đọc" — trạng thái hiện bằng cả chữ lẫn màu, không chỉ bằng màu. */
function renderNotice(notice) {
  const node = noticeTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.id = notice.id;
  node.dataset.kind = notice.kind;
  node.dataset.search = normalize(`${notice.title} ${notice.body} ${NOTICE_KINDS[notice.kind].label}`);
  node.querySelector(".notice-item__icon").innerHTML = iconMarkup(notice.kind);
  node.querySelector('[data-field="title"]').textContent = notice.title;
  node.querySelector('[data-field="body"]').textContent = notice.body;
  node.querySelector('[data-field="time"]').textContent = noticeTime(notice.minutes);

  syncNoticeRow(node, notice);
  return node;
}

/* Phần hiển thị phụ thuộc trạng thái đọc: nền, nhãn "Chưa đọc", chữ + kiểu của nút. */
function syncNoticeRow(node, notice) {
  node.classList.toggle("is-unread", !notice.read);
  node.dataset.unread = String(!notice.read);
  node.querySelector(".notice-item__badge").hidden = notice.read;

  const readButton = node.querySelector(".notice-item__read");
  readButton.textContent = notice.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc";
  readButton.setAttribute("aria-pressed", String(notice.read));
  /* Dòng đã đọc dùng nút chữ, dòng chưa đọc dùng nút có viền (như mockup). Đổi bằng
     classList chứ không gán lại className, nếu không sẽ mất class .notice-item__read. */
  readButton.classList.toggle("secondary-button", !notice.read);
  readButton.classList.toggle("text-button", notice.read);
}

/* Dựng lại toàn bộ danh sách, mới nhất lên đầu. */
function renderNotices() {
  noticeList.innerHTML = "";
  [...notices]
    .sort((a, b) => a.minutes - b.minutes)
    .forEach((notice) => noticeList.appendChild(renderNotice(notice)));
  applyFilters();
}

/* --- 4. Lọc: chip + loại + khoảng thời gian + từ khoá (gộp ô tìm trên topbar) --- */
function noticeRows() {
  return Array.from(noticeList.querySelectorAll(".notice-item"));
}

function matchesFilters(row) {
  const term = normalize(`${searchInput.value} ${listSearchInput.value}`.trim());
  const kind = kindSelect.value;
  const days = rangeSelect.value;
  const notice = notices.find((item) => item.id === row.dataset.id);

  return (
    (activeFilter === "all" || (activeFilter === "unread" && row.dataset.unread === "true") || row.dataset.kind === activeFilter) &&
    (kind === "all" || row.dataset.kind === kind) &&
    (days === "all" || notice.minutes <= Number(days) * 1440) &&
    (!term || normalize(row.dataset.search).includes(term))
  );
}

function applyFilters() {
  const rows = noticeRows();
  const visible = rows.filter(matchesFilters);
  const visibleSet = new Set(visible);

  rows.forEach((row) => {
    row.hidden = !visibleSet.has(row);
  });
  /* Dòng hiện đầu tiên không cần đường kẻ trên (dòng trên nó có thể đang bị ẩn). */
  visible.forEach((row, index) => row.classList.toggle("is-first", index === 0));

  noticeEmpty.classList.toggle("show", visible.length === 0);
  noticeEmpty.querySelector("span").textContent = emptyMessage();

  refreshCounts();
}

/* Câu giải thích nói đúng nguyên nhân: chưa có thông báo, hết thông báo chưa đọc,
   hay chỉ là không khớp bộ lọc đang chọn. */
function emptyMessage() {
  if (!notices.length) return "Bạn chưa có thông báo nào.";

  const unreadLeft = notices.some((notice) => !notice.read);
  if (activeFilter === "unread" && !unreadLeft) return "Bạn đã xem hết thông báo chưa đọc.";
  return "Không có thông báo nào khớp với bộ lọc hiện tại.";
}
/* --- 5. Số đếm: chip, dòng phụ đề, chấm trên chuông, dropdown ở topbar --- */
function refreshCounts() {
  const unread = notices.filter((notice) => !notice.read);
  const counts = {
    all: notices.length,
    unread: unread.length,
    system: notices.filter((notice) => notice.kind === "system").length,
  };

  document.querySelectorAll("[data-count]").forEach((element) => {
    element.textContent = counts[element.dataset.count] ?? 0;
  });

  totalLabel.textContent = notices.length;
  unreadLabel.textContent = unread.length;
  /* Chấm đỏ là phần tử SVG nên .hidden (IDL của HTMLElement) không có tác dụng;
     phải bật/tắt attribute thật thì CSS #bell-dot[hidden] mới ẩn được. */
  bellDot.toggleAttribute("hidden", unread.length === 0);
  markAllButton.disabled = unread.length === 0;

  const badge = notificationDropdown.querySelector(".dropdown__heading span");
  const empty = notificationDropdown.querySelector(".dropdown__empty");

  notificationDropdown.querySelectorAll(".notification-item").forEach((item) => item.remove());
  badge.hidden = unread.length === 0;
  badge.textContent = `${unread.length} mới`;
  empty.hidden = unread.length > 0;

  /* Mục mới nhất nằm trên cùng, giống danh sách chính. */
  [...unread].forEach((notice) => {
    const item = document.createElement("button");
    item.className = "notification-item";
    item.type = "button";
    item.innerHTML = "<b></b><small></small>";
    item.querySelector("b").textContent = notice.title;
    item.querySelector("small").textContent = `${noticeTime(notice.minutes)} · ${NOTICE_KINDS[notice.kind].label}`;
    item.addEventListener("click", () => {
      notificationDropdown.classList.remove("open");
      setRead(notice.id, true);
      showNotice(notice.id);
    });
    notificationDropdown.appendChild(item);
  });
}

/* Lưu danh sách rồi vẽ lại: mọi thao tác đọc/xoá đều đi qua hàm này. */
function commit(message) {
  saveNotices(notices);
  renderNotices();
  if (message) showToast(message);
}

function setRead(id, read) {
  const notice = notices.find((item) => item.id === id);
  if (!notice || notice.read === read) return;
  notice.read = read;
  commit(read ? "Đã đánh dấu thông báo là đã đọc." : "Đã chuyển thông báo về chưa đọc.");
}

/* Bỏ mọi bộ lọc rồi cuộn tới đúng dòng thông báo (dùng khi bấm ở dropdown trên topbar). */
function showNotice(id) {
  activeFilter = "all";
  kindSelect.value = "all";
  rangeSelect.value = "all";
  searchInput.value = "";
  listSearchInput.value = "";

  document.querySelectorAll(".filter-tab").forEach((tab) => {
    const isCurrent = tab.dataset.filter === "all";
    tab.classList.toggle("is-active", isCurrent);
    tab.setAttribute("aria-pressed", String(isCurrent));
  });

  applyFilters();
  noticeList.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* --- 6. Gắn sự kiện --- */
document.querySelectorAll(".filter-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".filter-tab").forEach((other) => {
      const isCurrent = other === tab;
      other.classList.toggle("is-active", isCurrent);
      other.setAttribute("aria-pressed", String(isCurrent));
    });

    activeFilter = tab.dataset.filter;
    applyFilters();
  });
});

/* Ô tìm trên topbar và ô tìm trong danh sách cùng lọc trên một danh sách. */
[searchInput, listSearchInput].forEach((input) => input.addEventListener("input", applyFilters));
[kindSelect, rangeSelect].forEach((select) => select.addEventListener("change", applyFilters));

/* Một chỗ duy nhất xử lý mọi cú click trong danh sách. */
noticeList.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;

  const id = action.closest(".notice-item").dataset.id;

  if (action.dataset.action === "read") {
    setRead(id, !notices.find((notice) => notice.id === id).read);
    return;
  }

  /* Xoá là mất dữ liệu, không có hoàn tác: hỏi lại trước khi xoá. */
  if (action.dataset.action === "delete" && window.confirm("Xoá thông báo này?")) {
    notices = notices.filter((notice) => notice.id !== id);
    commit("Đã xoá thông báo.");
  }
});

markAllButton.addEventListener("click", () => {
  notices.forEach((notice) => {
    notice.read = true;
  });
  commit("Đã đánh dấu tất cả thông báo là đã đọc.");
});

/* --- 7. Khởi động: dựng danh sách, rồi applyFilters() lo phần lọc + số đếm --- */
renderNotices();
