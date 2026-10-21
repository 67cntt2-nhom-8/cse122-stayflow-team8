/* =========================================================================
 * login.js — Tương tác trang Đăng nhập (StayFlow)
 * -------------------------------------------------------------------------
 * Nhiệm vụ:
 *   1. Hiệu ứng vệt sáng đi theo con trỏ trên panel giới thiệu (bên trái).
 *   2. Ẩn/hiện mật khẩu khi bấm nút con mắt.
 *   3. Kiểm tra thông tin đăng nhập (demo) và hiển thị trạng thái lỗi/thành công.
 *   4. Hiện toast thông báo và hiệu ứng rung form khi đăng nhập sai.
 * ========================================================================= */

/* --- 1. Tham chiếu các phần tử DOM (lấy một lần, dùng lại nhiều lần) --- */
const brandPanel = document.querySelector(".brand-panel"); // panel trái chứa ảnh nền
const loginForm = document.querySelector("#login-form"); // thẻ <form> đăng nhập
const identityInput = document.querySelector("#identity"); // ô nhập email / số điện thoại
const identityShell = document.querySelector("#identity-shell"); // khung bao quanh ô nhập
const identityMessage = document.querySelector("#identity-message"); // dòng báo lỗi dưới ô nhập
const passwordInput = document.querySelector("#password"); // ô nhập mật khẩu
const passwordShell = document.querySelector("#password-shell"); // khung bao quanh ô mật khẩu
const passwordToggle = document.querySelector(".password-toggle"); // nút ẩn/hiện mật khẩu
const passwordMessage = document.querySelector("#password-message"); // khối báo lỗi mật khẩu
const passwordMessageText = passwordMessage.querySelector("span"); // phần chữ trong khối lỗi
const submitButton = document.querySelector(".submit-button"); // nút "Đăng nhập"
const submitLabel = document.querySelector(".submit-button__label"); // phần chữ của nút
const toast = document.querySelector(".toast"); // thông báo nổi ở góc dưới
const toastMessage = document.querySelector(".toast__message"); // nội dung thông báo nổi
const forgotPassword = document.querySelector("#forgot-password"); // link "Quên mật khẩu?"
const uxNote = document.querySelector("#ux-note"); // ghi chú trạng thái lỗi cuối form

/* --- 2. Biến trạng thái dùng chung --- */
let attemptsRemaining = 4; // số lần còn được nhập sai mật khẩu (demo)
let toastTimer; // id của setTimeout để tự ẩn toast sau vài giây
// Tài khoản hợp lệ giả lập chỉ phục vụ demo (không dùng cho thực tế)
const validIdentity = "thuha.nguyen@email.com";
const validPassword = "StayFlow2026";

/* --- 3. Hiệu ứng vệt sáng đi theo con trỏ trên panel trái --- */
// Tính toạ độ con trỏ theo tỉ lệ % so với khung rồi ghi vào biến CSS
// --mouse-x / --mouse-y; CSS dùng biến này để vẽ vệt sáng (.brand-panel__glow).
brandPanel.addEventListener("pointermove", (event) => {
  const bounds = brandPanel.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;

  brandPanel.style.setProperty("--mouse-x", `${x}%`);
  brandPanel.style.setProperty("--mouse-y", `${y}%`);
});

// Khi chuột rời panel thì đưa vệt sáng về vị trí mặc định (giữa panel)
brandPanel.addEventListener("pointerleave", () => {
  brandPanel.style.setProperty("--mouse-x", "50%");
  brandPanel.style.setProperty("--mouse-y", "45%");
});

/* --- 4. Ẩn / hiện mật khẩu --- */
passwordToggle.addEventListener("click", () => {
  // Đang là "password" nghĩa là sắp chuyển sang hiện chữ
  const shouldShowPassword = passwordInput.type === "password";

  passwordInput.type = shouldShowPassword ? "text" : "password";
  // Cập nhật trạng thái cho trình đọc màn hình (accessibility)
  passwordToggle.setAttribute("aria-pressed", String(shouldShowPassword));
  passwordToggle.setAttribute(
    "aria-label",
    shouldShowPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu",
  );
  passwordInput.focus(); // giữ con trỏ trong ô mật khẩu sau khi bấm
});

/* --- 5. Xoá trạng thái lỗi khi người dùng bắt đầu nhập lại --- */
// Ô mật khẩu: bỏ viền đỏ/xanh, ẩn thông báo lỗi và ghi chú cuối form
passwordInput.addEventListener("input", () => {
  passwordShell.classList.remove("input-shell--error", "input-shell--success");
  passwordMessage.classList.add("is-hidden");
  passwordInput.setAttribute("aria-invalid", "false");
  uxNote.classList.add("is-hidden");
});

// Ô email/SĐT: bỏ viền đỏ/xanh và xoá dòng báo lỗi
identityInput.addEventListener("input", () => {
  identityShell.classList.remove("input-shell--error", "input-shell--success");
  identityInput.setAttribute("aria-invalid", "false");
  identityMessage.textContent = "";
  uxNote.classList.add("is-hidden");
});

/* --- 6. Link "Quên mật khẩu?" chỉ giả lập (không điều hướng) --- */
forgotPassword.addEventListener("click", (event) => {
  event.preventDefault(); // chặn hành vi mặc định của thẻ <a href="#">
  showToast("Liên kết khôi phục đã được gửi tới email của bạn.");
});

/* --- 7. Xử lý khi bấm nút "Đăng nhập" --- */
loginForm.addEventListener("submit", (event) => {
  event.preventDefault(); // tự kiểm tra bằng JS, không để form tải lại trang

  const identity = identityInput.value.trim();
  const password = passwordInput.value;

  // Hiện trạng thái đang tải (spinner) trên nút và tạm khoá nút
  submitButton.classList.add("is-loading");
  submitButton.disabled = true;

  // Giả lập gọi API mất ~900ms rồi mới xử lý kết quả
  window.setTimeout(() => {
    submitButton.classList.remove("is-loading");
    submitButton.disabled = false;

    // So sánh với tài khoản demo (email không phân biệt hoa/thường)
    const isIdentityValid = identity.toLowerCase() === validIdentity;
    const isPasswordValid = password === validPassword;

    // --- Trường hợp đúng cả email và mật khẩu ---
    if (isIdentityValid && isPasswordValid) {
      identityShell.classList.remove("input-shell--error");
      identityShell.classList.add("input-shell--success");
      passwordShell.classList.remove("input-shell--error");
      passwordShell.classList.add("input-shell--success");
      identityMessage.textContent = "";
      passwordMessage.classList.add("is-hidden");
      uxNote.classList.add("is-hidden");
      submitButton.classList.add("is-success");
      submitLabel.textContent = "Đăng nhập thành công";
      showToast("Chào mừng bạn quay lại StayFlow.");
      return;
    }

    // --- Trường hợp có lỗi: tô đỏ ô nhập tương ứng ---
    identityShell.classList.toggle("input-shell--error", !isIdentityValid);
    identityShell.classList.remove("input-shell--success");
    identityInput.setAttribute("aria-invalid", String(!isIdentityValid));
    identityMessage.textContent = isIdentityValid
      ? ""
      : "Email hoặc số điện thoại không hợp lệ.";

    passwordShell.classList.toggle("input-shell--error", !isPasswordValid);
    passwordShell.classList.remove("input-shell--success");
    passwordInput.setAttribute("aria-invalid", String(!isPasswordValid));

    // Nếu sai mật khẩu: giảm số lần thử và hiện thông báo tương ứng
    if (!isPasswordValid) {
      attemptsRemaining = Math.max(0, attemptsRemaining - 1);
      passwordMessage.classList.remove("is-hidden");
      passwordMessageText.textContent =
        attemptsRemaining > 0
          ? `Mật khẩu không đúng. Bạn còn ${attemptsRemaining} lần thử.`
          : "Tài khoản tạm khóa. Vui lòng thử lại sau.";
    } else {
      passwordMessage.classList.add("is-hidden");
    }

    uxNote.classList.remove("is-hidden"); // hiện ghi chú "trạng thái lỗi"
    shakeForm(); // rung form để báo lỗi trực quan
  }, 900);
});

/* Rung form để báo đăng nhập thất bại.
 * Phải xoá class rồi ép trình duyệt reflow (đọc offsetWidth) để animation
 * có thể chạy lại từ đầu ở các lần sai tiếp theo. */
function shakeForm() {
  loginForm.classList.remove("shake");
  void loginForm.offsetWidth;
  loginForm.classList.add("shake");
}

/* Hiện thông báo nổi (toast) trong 3.2 giây rồi tự ẩn.
 * clearTimeout để nếu toast cũ đang chạy thì đặt lại thời gian đếm. */
function showToast(message) {
  window.clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toast.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}