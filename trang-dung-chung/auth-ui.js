/* ============================================================================
 * auth-ui.js — Tiện ích DÙNG CHUNG cho 3 trang xác thực StayFlow
 *   pages/login.html, trang-dang-ky/signup.html,
 *   trang-quen-mat-khau/quenmatkhau.html
 *
 * Nạp TRƯỚC script của trang (login.js / signup.js / quenmatkhau.js).
 * Trước đây 3 file tự copy lại 4 đoạn y hệt nhau; nay chỉ còn 1 bản ở đây:
 *   1. setupBrandSpotlight() — vệt sáng chạy theo con trỏ trên panel trái.
 *   2. setupPasswordToggle() — nút con mắt ẩn/hiện mật khẩu.
 *   3. shakeForm()           — rung form khi dữ liệu sai.
 *   4. showToast()           — thông báo nổi ở góc dưới.
 *
 * Không gộp login.css và signup.css: hai trang dùng bộ biến màu khác nhau
 * (--gold #b8914a và #c9a84c) nên gộp sẽ làm đổi giao diện trang Đăng ký.
 * ========================================================================= */

/* --- 1. Vệt sáng đi theo con trỏ trên panel giới thiệu ---
 * Ghi toạ độ con trỏ (theo %) vào biến CSS --mouse-x/--mouse-y; CSS dùng 2 biến
 * này để vẽ vệt sáng .brand-panel__spotlight.
 * defaultY: vị trí dọc lúc chưa rê chuột (login/quên mật khẩu dùng 45, đăng ký 50). */
function setupBrandSpotlight(panel, defaultY = 45) {
  panel.addEventListener("pointermove", (event) => {
    const bounds = panel.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    panel.style.setProperty("--mouse-x", `${x}%`);
    panel.style.setProperty("--mouse-y", `${y}%`);
  });

  // Chuột rời panel thì đưa vệt sáng về vị trí mặc định
  panel.addEventListener("pointerleave", () => {
    panel.style.setProperty("--mouse-x", "50%");
    panel.style.setProperty("--mouse-y", `${defaultY}%`);
  });
}

/* --- 2. Ẩn / hiện mật khẩu ---
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

/* --- 3. Rung form để báo dữ liệu sai ---
 * Phải xoá class rồi ép trình duyệt reflow (đọc offsetWidth) để animation
 * chạy lại từ đầu ở các lần sai tiếp theo. */
function shakeForm(form) {
  form.classList.remove("shake");
  void form.offsetWidth;
  form.classList.add("shake");
}

/* --- 4. Thông báo nổi (toast) ---
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