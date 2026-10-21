/* ============================================================================
 * dashboard.js — Hành vi DÙNG CHUNG của khung dashboard StayFlow
 * ----------------------------------------------------------------------------
 * Nạp TRƯỚC script riêng của từng trang:
 *   trang-tong-quan/tongquan.html   -> ../trang-dung-chung/dashboard.js + tongquan.js
 *   trang-yeu-cau/yeucau.html       -> ../trang-dung-chung/dashboard.js + yeucau.js
 *   trang-tao-yeu-cau/taoyeucau.html -> ../trang-dung-chung/dashboard.js + taoyeucau.js
 *   trang-thong-bao/thongbao.html   -> ../trang-dung-chung/dashboard.js + thongbao.js
 *
 * Trước đây mỗi trang tự copy lại: mở/đóng sidebar, dropdown thông báo/hồ sơ,
 * đóng khi bấm ra ngoài, phím Escape, xoá tên khi đăng xuất, toast, bỏ dấu tiếng
 * Việt, hiệu ứng hiện dần, kho yêu cầu localStorage và cả modal gửi yêu cầu.
 * Nay tất cả nằm ở đây; trang chỉ còn xử lý phần đặc thù của mình.
 *
 * Giả định (2 trang đều có): #sidebar, #menu-button, #page-title,
 * #notification-button, #notification-dropdown, #profile-button,
 * #profile-dropdown, #toast.
 * ========================================================================= */

/* --- 1. Tham chiếu phần tử khung dashboard (lấy một lần, dùng lại nhiều lần) --- */
const sidebar = document.querySelector("#sidebar"); // aside điều hướng bên trái
const menuButton = document.querySelector("#menu-button"); // nút 3 gạch trên mobile
const pageTitle = document.querySelector("#page-title"); // tiêu đề trang trên topbar
const notificationButton = document.querySelector("#notification-button");
const notificationDropdown = document.querySelector("#notification-dropdown");
const profileButton = document.querySelector("#profile-button");
const profileDropdown = document.querySelector("#profile-dropdown");
const toast = document.querySelector("#toast"); // thông báo nổi góc dưới phải
const searchInput = document.querySelector("#dashboard-search"); // ô tìm trên topbar
let toastTimer; // id setTimeout để tự ẩn toast

/* --- 2. Kho yêu cầu dùng chung giữa 2 trang (localStorage) --- */
const REQUEST_KEY = "stayflow_requests"; // 1 khoá duy nhất, cả 2 trang đọc/ghi cùng chỗ
const REQUEST_SEQ_START = 0; // danh sách khởi đầu trống -> yêu cầu đầu tiên là #REQ-1208-01

/* Thông tin phụ trách / thời gian dự kiến theo từng loại dịch vụ. Trang Yêu cầu dùng
   để dựng thẻ, trang Tạo yêu cầu dùng để dựng ô chọn + khối xem trước; để chung ở đây
   nên thêm dịch vụ mới chỉ phải sửa một nơi. Icon nằm trong assets/ của từng trang
   (đường dẫn tính theo trang đang mở, giống mọi ảnh khác của khối dùng chung). */
const SERVICE_META = {
  "Gọi dọn phòng": { icon: "./assets/ccf51.svg", owner: "Đội buồng phòng", eta: "Trong 20 phút" },
  "Yêu cầu khăn": { icon: "./assets/f8914.svg", owner: "Đội buồng phòng", eta: "Trong 10 phút" },
  "Đặt bữa": { icon: "./assets/9e188.svg", owner: "Bếp Aurora", eta: "Trong 40 phút" },
  "Báo sự cố": { icon: "./assets/3df7f.svg", owner: "Kỹ thuật toà nhà", eta: "Trong 15 phút" },
};

/* Đọc danh sách yêu cầu; JSON hỏng hoặc localStorage bị chặn thì trả mảng rỗng để
   trang vẫn chạy bình thường. */
function readRequests() {
  try {
    return JSON.parse(localStorage.getItem(REQUEST_KEY) || "[]");
  } catch {
    return [];
  }
}

/* Ghi thêm 1 yêu cầu vào kho. Cấu trúc bản ghi: { code, title, note, time }. */
function saveRequest(record) {
  try {
    localStorage.setItem(REQUEST_KEY, JSON.stringify([...readRequests(), record]));
  } catch {
    /* localStorage bị chặn thì bỏ qua: phần còn lại của trang vẫn hoạt động. */
  }
}

/* Mã kế tiếp: lấy số lớn nhất đang có trong kho rồi cộng 1 -> không trùng mã cũ. */
function nextRequestCode() {
  const highest = readRequests().reduce((max, record) => {
    const number = Number(String(record.code).split("-").pop());
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, REQUEST_SEQ_START);

  return `#REQ-1208-${String(highest + 1).padStart(2, "0")}`;
}

/* Giờ:phút hiện tại (vi-VN) — dùng cho mốc thời gian trên thẻ yêu cầu. */
function nowClock() {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

/* --- 3. Tiện ích dùng chung --- */
/* Toast: ghi nội dung, hiện lên rồi tự ẩn sau 3 giây (clearTimeout để lần gọi
   mới không bị lần gọi cũ ẩn sớm). */
function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.querySelector("p").textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

/* Bỏ dấu tiếng Việt để gõ không dấu vẫn tìm được ("dieu hoa" khớp "điều hoà").
   Lưu ý: NFD không tách được "đ" nên phải thay riêng. */
function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}
/* --- 4. Sidebar trên mobile --- */
menuButton.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

/* Mục điều hướng: mục có href là trang thật -> để trình duyệt tự chuyển trang;
   mục còn lại (chưa làm) -> đổi trạng thái active + tiêu đề, rồi báo là bản demo.
   Bấm lại mục đang mở thì không báo toast. */
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    sidebar.classList.remove("open"); // mobile: chọn xong thì đóng menu
    if (item.tagName === "A") return;

    const alreadyActive = item.classList.contains("active");
    document.querySelectorAll(".nav-item").forEach((navItem) => navItem.classList.remove("active"));
    item.classList.add("active");
    pageTitle.textContent = item.dataset.section;

    if (!alreadyActive) showToast(`${item.dataset.section} đang được chuẩn bị cho bản demo.`);
  });
});

/* --- 5. Hai dropdown trên topbar: mở cái này thì đóng cái kia --- */
notificationButton.addEventListener("click", (event) => {
  event.stopPropagation(); // chặn handler "bấm ra ngoài" ở document bên dưới
  profileDropdown.classList.remove("open");
  notificationDropdown.classList.toggle("open");
});

profileButton.addEventListener("click", (event) => {
  event.stopPropagation();
  notificationDropdown.classList.remove("open");
  profileDropdown.classList.toggle("open");
});

/* Đăng xuất: xoá tên đã lưu để lần đăng nhập sau hiển thị đúng người.
   Chọn theo href chứ không phải "a đầu tiên trong dropdown": dropdown còn có lối
   vào trang Hồ sơ, và handler này phải chỉ gắn cho đúng liên kết đăng xuất. */
const logoutLink = document.querySelector('#profile-dropdown a[href*="login"]');
if (logoutLink) {
  logoutLink.addEventListener("click", () => {
    localStorage.removeItem("stayflow_user_name");
  });
}

/* Bấm bất kỳ đâu ngoài dropdown/sidebar thì đóng chúng lại. */
document.addEventListener("click", (event) => {
  if (!event.target.closest(".dropdown-wrap")) {
    notificationDropdown.classList.remove("open");
    profileDropdown.classList.remove("open");
  }

  if (
    window.innerWidth <= 860 && // chỉ áp dụng ở cỡ màn hình có sidebar trượt
    sidebar.classList.contains("open") &&
    !event.target.closest("#sidebar") &&
    !event.target.closest("#menu-button")
  ) {
    sidebar.classList.remove("open");
  }
});

/* Phím Escape: đóng modal và dropdown đang mở.
   closeRequestModal do setupRequestModal() bên dưới gán vào. */
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeRequestModal();
  notificationDropdown.classList.remove("open");
  profileDropdown.classList.remove("open");
});

/* Tên người dùng do login.js / signup.js lưu lại; mở thẳng trang mà chưa đăng nhập
   thì giữ nguyên tên mặc định trong HTML. */
const currentUserName = localStorage.getItem("stayflow_user_name");
if (currentUserName) {
  const profileName = document.querySelector("#profile-button b");
  if (profileName) profileName.textContent = currentUserName;
}

/* --- 5b. Chuông thông báo: đọc kho dùng chung stayflow_notifications ---
 * Trang Trung tâm thông báo (thongbao.js) ghi danh sách vào kho này; các trang
 * khác (Tổng quan, Hồ sơ, Tạo yêu cầu) đọc lại để chuông luôn hiện đúng số chưa
 * đọc dù mở từ trang nào. yeucau.js / thongbao.js có vòng render riêng chạy sau
 * file này nên tự ghi đè nội dung dropdown — không lo đụng nhau.
 * Bọc trong IIFE để các hằng/hàm trung gian không đụng tên với script trang. */
(() => {
  const NOTICE_KEY = "stayflow_notifications";

  /* Mốc thời gian tương đối (cùng định dạng với Trung tâm thông báo). */
  function noticeTime(minutes) {
    if (minutes < 60) return `${minutes} phút trước`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
    const at = new Date(Date.now() - minutes * 60000);
    const clock = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(at);
    return minutes < 2880 ? `Hôm qua, ${clock}` : new Intl.DateTimeFormat("vi-VN").format(at);
  }

  /* Cập nhật badge "X mới", chấm đỏ trên chuông và vài dòng thông báo chưa đọc.
     Nếu trang đó không có badge (hoso/tongquan) thì bỏ qua phần tương ứng. */
  const unread = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(NOTICE_KEY) || "null");
      return Array.isArray(saved) ? saved.filter((notice) => notice && !notice.read) : [];
    } catch {
      return [];
    }
  })();

  const badge = notificationDropdown.querySelector(".dropdown__heading span");
  if (badge) {
    badge.hidden = unread.length === 0;
    badge.textContent = `${unread.length} mới`;
  }

  const bellDot = document.querySelector("#bell-dot");
  /* Chấm đỏ là phần tử SVG nên dùng toggleAttribute (không có thuộc tính
     hidden như HTMLElement; gán .hidden sẽ không tạo attribute để CSS bắt). */
  if (bellDot) bellDot.toggleAttribute("hidden", unread.length === 0);

  const empty = notificationDropdown.querySelector(".dropdown__empty");
  if (empty) empty.hidden = unread.length > 0;

  const container = notificationDropdown;
  container.querySelectorAll(".notification-item").forEach((item) => item.remove());
  [...unread].slice(0, 3).reverse().forEach((notice) => {
    const item = document.createElement("button");
    item.className = "notification-item";
    item.type = "button";
    item.innerHTML = "<b></b><small></small>";
    item.querySelector("b").textContent = notice.title;
    item.querySelector("small").textContent = noticeTime(notice.minutes);
    item.addEventListener("click", () => {
      window.location.href = "../trang-thong-bao/thongbao.html";
    });
    container.appendChild(item);
  });
})();

/* --- 6. Hiệu ứng "hiện dần khi cuộn tới" cho mọi phần tử .reveal --- */
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target); // hiện rồi thì thôi theo dõi cho nhẹ
    });
  },
  { threshold: 0.12 }, // kích hoạt khi ~12% phần tử đã hiện ra
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.animationDelay = `${Math.min(index * 55, 350)}ms`; // so le nhẹ theo thứ tự
  revealObserver.observe(element);
});
/* --- 7. Modal "Gửi yêu cầu mới" (2 trang dùng y hệt nhau) ---
 * Trang gọi setupRequestModal(handler) rồi tự quyết định xử lý dữ liệu:
 *   - tongquan.js: lưu vào kho + cập nhật thẻ "Yêu cầu gần nhất".
 *   - yeucau.js  : lưu vào kho + dựng thẻ yêu cầu mới trong danh sách.
 * handler nhận { title, note } và chạy sau khi đã giả lập gọi API ~850ms. */
let openRequestModal = () => {}; // 2 biến này được gán lại bên trong setupRequestModal
let closeRequestModal = () => {};

function setupRequestModal(onSubmit) {
  const modal = document.querySelector("#request-modal");
  const form = document.querySelector("#request-form");
  const serviceSelect = document.querySelector("#service-select");
  const noteInput = document.querySelector("#request-note");
  const submitButton = form.querySelector(".modal__submit");

  openRequestModal = (service) => {
    if (service) serviceSelect.value = service; // mở từ một thẻ dịch vụ cụ thể
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // khoá cuộn nền khi modal đang mở
    window.setTimeout(() => noteInput.focus(), 250); // đợi hiệu ứng mở xong rồi focus
  };

  closeRequestModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  modal.querySelector(".modal__close").addEventListener("click", () => closeRequestModal());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeRequestModal(); // bấm vùng nền mờ cũng đóng
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // tự kiểm tra bằng JS, không để form tải lại trang
    submitButton.classList.add("loading"); // hiện spinner trên nút
    submitButton.disabled = true;

    window.setTimeout(() => {
      submitButton.classList.remove("loading");
      submitButton.disabled = false;

      onSubmit({ title: serviceSelect.value, note: noteInput.value.trim() });

      closeRequestModal();
      noteInput.value = "";
      showToast("Yêu cầu đã được gửi thành công.");
    }, 850);
  });
}