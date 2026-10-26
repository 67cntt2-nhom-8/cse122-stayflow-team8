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