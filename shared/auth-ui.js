/* ============================================================================
 * auth-ui.js — Tiện ích DÙNG CHUNG cho 3 trang xác thực StayFlow
 *   login/login.html, sign-up/sighup.html,
 *   forgot-password/forgot-password.html
 *
 * Nạp TRƯỚC script của trang (login.js / sign-up.js / forgot-password.js).
 * Trước đây 3 file tự copy lại 4 đoạn y hệt nhau; nay chỉ còn 1 bản ở đây:
 *   1. setupPasswordToggle() — nút con mắt ẩn/hiện mật khẩu.
 *   2. shakeForm()           — rung form khi dữ liệu sai.
 *   3. showToast()           — thông báo nổi ở góc dưới.
 *
 * Không gộp login.css và sign-up.css: hai trang dùng bộ biến màu khác nhau
 * (--gold #b8914a và #c9a84c) nên gộp sẽ làm đổi giao diện trang Đăng ký.
 * ========================================================================= */

/* --- 1. Ẩn / hiện mật khẩu ---
 * Đổi type của ô nhập và cập nhật aria cho trình đọc màn hình. */
function setupPasswordToggle(toggle, input) {
  toggle.addEventListener("click", () => {
    // Đang là "password" nghĩa là sắp chuyển sang hiện chữ
    const shouldShow = input.type === "password";

    input.type = shouldShow ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(shouldShow));
    toggle.setAttribute("aria-label", shouldShow ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    input.focus(); // giữ con trỏ trong ô mật khẩu sau khi bấm
  });
}

/* --- 2. Rung form để báo dữ liệu sai ---
 * Phải xoá class rồi ép trình duyệt reflow (đọc offsetWidth) để animation
 * chạy lại từ đầu ở các lần sai tiếp theo. */
function shakeForm(form) {
  form.classList.remove("shake");
  void form.offsetWidth;
  form.classList.add("shake");
}

/* --- 3. Thông báo nổi (toast) ---
 * Hiện trong 3.2 giây rồi tự ẩn; clearTimeout để lần gọi mới không bị lần gọi
 * cũ ẩn sớm. */
let toastTimer;
function showToast(toast, message) {
  window.clearTimeout(toastTimer);
  toast.querySelector(".toast__message").textContent = message;
  toast.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}