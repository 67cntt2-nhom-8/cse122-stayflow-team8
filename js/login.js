/* =========================================================================
 * login.js — Tương tác trang Đăng nhập (StayFlow)
 * -------------------------------------------------------------------------
 * Nhiệm vụ:
 *   1. Ẩn/hiện mật khẩu khi bấm nút con mắt.
 *   2. Kiểm tra thông tin đăng nhập (demo) và hiển thị trạng thái lỗi/thành công.
 *   3. Hiện toast thông báo và hiệu ứng rung form khi đăng nhập sai.
 *   4. Đăng nhập thành công → chuyển thẳng sang trang tổng quan.
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
const uxNote = document.querySelector("#ux-note"); // ghi chú trạng thái lỗi cuối form

/* --- 2. Biến trạng thái dùng chung --- */
let attemptsRemaining = 4; // số lần còn được nhập sai mật khẩu (demo)
let redirectTimer; // id của setTimeout chuyển sang trang tổng quan
// Tài khoản hợp lệ giả lập chỉ phục vụ demo (không dùng cho thực tế)
const validIdentity = "thuha.nguyen@email.com";
const validPassword = "StayFlow2026";
// Trang tổng quan cần chuyển tới ngay sau khi đăng nhập thành công.
const OVERVIEW_URL = "guest-dashboard.html";

/* --- 3. Ẩn / hiện mật khẩu (dùng chung: auth-ui.js) --- */
setupPasswordToggle(passwordToggle, passwordInput);

/* --- 4. Xoá trạng thái lỗi khi người dùng bắt đầu nhập lại --- */
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

/* --- 5. Link "Quên mật khẩu?" --- */
// Không cần JS: link là thẻ <a> trỏ tới forgot-password.html,
// trình duyệt tự điều hướng khi click hoặc bấm Enter.

/* --- 6. Xử lý khi bấm nút "Đăng nhập" --- */
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
      showToast(toast, "Chào mừng bạn quay lại StayFlow.");

      // Lưu tên người dùng để trang tổng quan hiển thị đúng chủ tài khoản;
      // giữ nguyên tên đã lưu nếu người dùng đã đăng ký trước đó.
      if (!localStorage.getItem("stayflow_user_name")) {
        localStorage.setItem("stayflow_user_name", "Thu Hà");
      }

      // Chờ một nhịp ngắn để người dùng thấy thông báo rồi vào trang tổng quan
      window.clearTimeout(redirectTimer);
      redirectTimer = window.setTimeout(() => {
        window.location.href = OVERVIEW_URL;
      }, 1200);
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
    shakeForm(loginForm); // rung form để báo lỗi trực quan
  }, 900);
});

/* Ghi chú: shakeForm() và showToast() là hàm dùng chung, đã chuyển sang
   ../shared/auth-ui.js (nạp trước file này trong login.html). */