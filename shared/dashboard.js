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
const toast = document.querySelector("#toast"); // thông báo nổi góc dưới phải
const searchInput = document.querySelector("#dashboard-search"); // ô tìm trên topbar
let toastTimer; // id setTimeout để tự ẩn toast

/* Thông tin phụ trách / thời gian dự kiến theo từng loại dịch vụ. Trang Yêu cầu dùng
   để dựng thẻ, trang Tạo yêu cầu dùng để dựng ô chọn + khối xem trước; để chung ở đây
   nên thêm dịch vụ mới chỉ phải sửa một nơi. Icon nằm trong assets/ của từng trang
   (đường dẫn tính theo trang đang mở, giống mọi ảnh khác của khối dùng chung). */
const SERVICE_META = {
  "Gọi dọn phòng": { icon: "../assets/images/ccf51.svg", owner: "Đội buồng phòng", eta: "Trong 20 phút" },
  "Yêu cầu khăn": { icon: "../assets/images/f8914.svg", owner: "Đội buồng phòng", eta: "Trong 10 phút" },
  "Đặt bữa": { icon: "../assets/images/9e188.svg", owner: "Bếp Aurora", eta: "Trong 40 phút" },
  "Báo sự cố": { icon: "../assets/images/3df7f.svg", owner: "Kỹ thuật toà nhà", eta: "Trong 15 phút" },
};

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

/* Tên người dùng do login.js / sign-up.js lưu lại; mở thẳng trang mà chưa đăng nhập
   thì giữ nguyên tên mặc định trong HTML. */
const currentUserName = localStorage.getItem("stayflow_user_name");
if (currentUserName) {
  const profileName = document.querySelector("#profile-button b");
  if (profileName) profileName.textContent = currentUserName;
}

/* --- 6. Modal "Gửi yêu cầu mới" (chỉ guest-dashboard còn dùng) ---
 * Trang gọi setupRequestModal(handler): guest-dashboard.js lưu vào kho + cập nhật thẻ
 * "Yêu cầu gần nhất". Trang "Yêu cầu" hiện dẫn hẳn sang trang tạo yêu cầu riêng.
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