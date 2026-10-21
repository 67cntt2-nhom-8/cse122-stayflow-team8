/* =========================================================================
 * quenmatkhau.js — Tương tác trang Xác thực email (StayFlow)
 * -------------------------------------------------------------------------
 * Nhiệm vụ:
 *   1. Hiệu ứng vệt sáng đi theo con trỏ trên panel giới thiệu (bên trái).
 *   2. Kiểm tra email người dùng nhập có đúng định dạng và đã đăng ký.
 *   3. Hợp lệ → chuyển sang trang tổng quan; sai → báo lỗi, rung form.
 * ========================================================================= */

/* --- 1. Tham chiếu các phần tử DOM --- */
const brandPanel = document.querySelector(".brand-panel"); // panel trái chứa ảnh nền
const resetForm = document.querySelector("#reset-form"); // thẻ <form>
const identityInput = document.querySelector("#identity"); // ô nhập email
const identityShell = document.querySelector("#identity-shell"); // khung bao quanh ô nhập
const identityMessage = document.querySelector("#identity-message"); // dòng báo lỗi
const notice = document.querySelector("#reset-notice"); // banner xác nhận thành công
const noticeTarget = document.querySelector("#notice-target"); // nơi in lại email
const submitButton = document.querySelector(".submit-button"); // nút "Xác thực email"
const submitText = document.querySelector(".submit-button__text"); // phần chữ của nút
const toast = document.querySelector(".toast"); // thông báo nổi

/* --- 2. Biến trạng thái --- */
let redirectTimer; // id của setTimeout chuyển sang trang tổng quan
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // định dạng email cơ bản

// Email đã đăng ký (giả lập, dùng chung tài khoản demo với trang đăng nhập).
const VALID_EMAIL = "thuha.nguyen@email.com";

// Trang tổng quan cần chuyển tới sau khi xác thực thành công.
const OVERVIEW_URL = "../trang-tong-quan/tongquan.html";

/* --- 3. Hiệu ứng vệt sáng đi theo con trỏ trên panel trái ---
   Hàm dùng chung với trang Đăng nhập / Đăng ký: xem trang-dung-chung/auth-ui.js */
setupBrandSpotlight(brandPanel, 45);

/* --- 4. Xoá trạng thái lỗi / banner khi người dùng nhập lại --- */
identityInput.addEventListener("input", () => {
  identityShell.classList.remove("input-shell--error", "input-shell--success");
  identityInput.setAttribute("aria-invalid", "false");
  identityMessage.textContent = "";

  // Banner cũ không còn đúng với giá trị mới → ẩn đi
  notice.classList.add("is-hidden");
});

/* --- 5. Xử lý khi bấm nút "Xác thực email" --- */
resetForm.addEventListener("submit", (event) => {
  event.preventDefault(); // tự kiểm tra bằng JS, không để form tải lại trang

  const email = identityInput.value.trim();

  // Hiện spinner trên nút và tạm khoá nút
  submitButton.classList.add("is-loading");
  submitButton.disabled = true;

  // Giả lập gọi API xác thực mất ~900ms rồi mới xử lý kết quả
  window.setTimeout(() => {
    submitButton.classList.remove("is-loading");
    submitButton.disabled = false;

    // --- 5a. Sai định dạng email ---
    const isWellFormed = EMAIL_PATTERN.test(email);
    if (!isWellFormed) {
      showError("Email chưa đúng định dạng. Ví dụ: thuha.nguyen@email.com");
      return;
    }

    // --- 5b. Đúng định dạng nhưng chưa đăng ký ---
    const isRegistered = email.toLowerCase() === VALID_EMAIL;
    if (!isRegistered) {
      showError("Email này chưa được đăng ký trong hệ thống StayFlow.");
      return;
    }

    // --- 5c. Xác thực thành công: đổi giao diện rồi chuyển trang tổng quan ---
    identityShell.classList.remove("input-shell--error");
    identityShell.classList.add("input-shell--success");
    identityInput.setAttribute("aria-invalid", "false");
    identityMessage.textContent = "";

    noticeTarget.textContent = email; // in lại đúng email vừa xác thực
    notice.classList.remove("is-hidden");
    submitButton.classList.add("is-success");
    submitText.textContent = "Xác thực thành công";
    showToast(toast, "Xác thực thành công. Đang mở trang tổng quan…");

    // Chờ một nhịp ngắn để người dùng thấy thông báo rồi mới chuyển trang
    window.clearTimeout(redirectTimer);
    redirectTimer = window.setTimeout(() => {
      window.location.href = OVERVIEW_URL;
    }, 1200);
  }, 900);
});

/* Tô đỏ ô nhập, hiện thông báo lỗi và rung form. */
function showError(message) {
  identityShell.classList.remove("input-shell--success");
  identityShell.classList.add("input-shell--error");
  identityInput.setAttribute("aria-invalid", "true");
  identityMessage.textContent = message;
  notice.classList.add("is-hidden");
  shakeForm(resetForm);
}

/* --- 6. Tự kiểm tra logic xác thực (mở trang với ?selfcheck trên thanh địa chỉ) ---
 * Tách riêng phần so khớp để kiểm tra được mà không phụ thuộc DOM. */
function checkEmail(value) {
  const email = value.trim();
  if (!EMAIL_PATTERN.test(email)) return "invalid"; // sai định dạng
  return email.toLowerCase() === VALID_EMAIL ? "ok" : "unregistered"; // chưa đăng ký
}

if (new URLSearchParams(window.location.search).has("selfcheck")) {
  const cases = [
    ["thuha.nguyen@email.com", "ok"], // email đã đăng ký
    ["ThuHa.Nguyen@Email.com", "ok"], // không phân biệt hoa/thường
    ["abc", "invalid"], // thiếu @ và tên miền
    ["a@b", "invalid"], // thiếu tên miền
    ["0901234567", "invalid"], // số điện thoại không được chấp nhận
    ["", "invalid"], // bỏ trống
    ["nguoikhac@email.com", "unregistered"], // đúng định dạng nhưng chưa đăng ký
  ];
  const failed = cases.filter(([value, expected]) => checkEmail(value) !== expected);
  console.assert(
    failed.length === 0,
    `Self-check thất bại ở ${failed.length} trường hợp:`,
    failed,
  );
}

/* Ghi chú: shakeForm() và showToast() là hàm dùng chung, đã chuyển sang
   ../trang-dung-chung/auth-ui.js (nạp trước file này trong quenmatkhau.html). */
