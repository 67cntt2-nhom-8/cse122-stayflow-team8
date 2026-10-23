/* ============================================================================
 * sign-up.js — Tương tác trang Đăng ký (StayFlow)
 * ----------------------------------------------------------------------------
 * Nhiệm vụ:
 *   1. Tham chiếu các ô nhập và gom trạng thái lỗi/đúng của từng ô vào 1 chỗ.
 *   2. Tự định dạng số điện thoại khi khách gõ (090 123 4567).
 *   3. Chấm điểm độ mạnh mật khẩu theo thời gian thực.
 *   4. Kiểm tra toàn bộ form trước khi cho gửi.
 *   5. Gửi thành công -> lưu tên + chuyển sang trang tổng quan.
 * Ẩn/hiện mật khẩu và rung form dùng chung ở ../shared/auth-ui.js.
 * ========================================================================= */

/* --- 1. Tham chiếu phần tử --- */
const brandPanel = document.querySelector(".brand-panel");
const formPanel = document.querySelector(".form-panel");
const registerForm = document.querySelector("#register-form");
const nameInput = document.querySelector("#full-name");
const phoneInput = document.querySelector("#phone");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const confirmInput = document.querySelector("#confirm-password");
const termsInput = document.querySelector("#terms");
const submitButton = document.querySelector(".submit-button");
const passwordToggle = document.querySelector(".password-toggle");
const strength = document.querySelector(".strength");
const strengthLabel = document.querySelector("#strength-label");
const confirmAlert = document.querySelector("#confirm-alert");

// Trang tổng quan cần chuyển tới ngay sau khi tạo tài khoản thành công.
const OVERVIEW_URL = "guest-dashboard.html";
let redirectTimer; // id của setTimeout chuyển sang trang tổng quan

/* Gom mỗi ô nhập với khung viền và dòng báo lỗi của nó -> chỉ cần gọi
   setFieldState("email", ...) là đủ, không phải nhớ 3 phần tử rời rạc. */
const fields = {
  name: {
    input: nameInput,
    shell: document.querySelector("#name-shell"),
    error: document.querySelector("#name-error"),
  },
  phone: {
    input: phoneInput,
    shell: document.querySelector("#phone-shell"),
    error: document.querySelector("#phone-error"),
  },
  email: {
    input: emailInput,
    shell: document.querySelector("#email-shell"),
    error: document.querySelector("#email-error"),
  },
  password: {
    input: passwordInput,
    shell: document.querySelector("#password-shell"),
  },
  confirm: {
    input: confirmInput,
    shell: document.querySelector("#confirm-shell"),
    error: document.querySelector("#confirm-error"),
  },
};

/* --- 3. Nút ẩn/hiện mật khẩu ---
   Hàm dùng chung với trang Đăng nhập / Quên mật khẩu:
   xem shared/auth-ui.js */
setupPasswordToggle(passwordToggle, passwordInput);

passwordInput.addEventListener("input", () => {
  updatePasswordStrength();
  clearFieldState("password");

  if (confirmInput.value) {
    validateConfirmation();
  }

  updateSubmitState();
});

confirmInput.addEventListener("input", () => {
  clearFieldState("confirm");
  confirmAlert.classList.add("is-hidden");

  if (confirmInput.value) {
    validateConfirmation();
  }

  updateSubmitState();
});

[nameInput, phoneInput, emailInput].forEach((input) => {
  input.addEventListener("input", () => {
    const fieldName =
      input === nameInput ? "name" : input === phoneInput ? "phone" : "email";
    clearFieldState(fieldName);
    updateSubmitState();
  });
});

/* Số điện thoại: bỏ hết ký tự không phải số, cắt còn 10 số rồi chèn khoảng trắng
   theo nhóm 3-3-4 để khách thấy ngay mình gõ đúng hay sai. */
phoneInput.addEventListener("input", () => {
  const digits = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  phoneInput.value = digits.replace(
    /(\d{3})(\d{0,3})(\d{0,4})/,
    (_, first, second, third) =>
      [first, second, third].filter(Boolean).join(" "),
  );
});

termsInput.addEventListener("change", updateSubmitState);

/* Gửi form: kiểm tra hết một lượt; sai thì rung form, đúng thì giả lập gọi API
   ~1.1 giây rồi lưu tên và chuyển sang trang tổng quan. */
registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const valid = validateForm();
  updateSubmitState();

  if (!valid) {
    shakeForm(registerForm); // dữ liệu sai -> rung form để báo lỗi
    return;
  }

  submitButton.classList.add("is-loading");
  submitButton.disabled = true;

  window.setTimeout(() => {
    submitButton.classList.remove("is-loading");
    formPanel.classList.add("is-success");

    // Lưu tên người dùng để trang tổng quan hiển thị đúng chủ tài khoản
    localStorage.setItem("stayflow_user_name", nameInput.value.trim());

    // Tạo tài khoản xong → chuyển thẳng sang trang tổng quan
    window.clearTimeout(redirectTimer);
    redirectTimer = window.setTimeout(() => {
      window.location.href = OVERVIEW_URL;
    }, 1200);
  }, 1100);
});

/* Chấm điểm mật khẩu 0-4 (độ dài, hoa+thường, số, ký tự đặc biệt) rồi đổi màu
   thanh độ mạnh và nhãn tương ứng. */
function updatePasswordStrength() {
  const value = passwordInput.value;
  let score = 0;

  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  const states = [
    { label: "Nhập mật khẩu để kiểm tra độ mạnh", color: "#607084" },
    { label: "Yếu · Cần ít nhất 8 ký tự", color: "#b43d45" },
    { label: "Trung bình · Thêm chữ hoa và số", color: "#b8914a" },
    { label: "Khá · Thêm ký tự đặc biệt", color: "#39795e" },
    { label: "Mạnh · Có chữ hoa, số và ký tự đặc biệt", color: "#247a54" },
  ];

  strength.dataset.score = String(score);
  strength.style.setProperty("--strength-color", states[score].color);
  strengthLabel.textContent = states[score].label;
  strengthLabel.style.color = states[score].color;
}

function validateConfirmation() {
  const matches =
    confirmInput.value.length > 0 && confirmInput.value === passwordInput.value;

  fields.confirm.shell.classList.toggle("is-error", !matches);
  fields.confirm.shell.classList.toggle("is-success", matches);
  fields.confirm.error.textContent = matches
    ? ""
    : "Mật khẩu xác nhận chưa trùng khớp.";
  confirmAlert.classList.toggle("is-hidden", matches);
  return matches;
}

/* Kiểm tra toàn bộ form và tô viền đỏ/xanh cho từng ô; trả về true nếu mọi thứ hợp lệ. */
function validateForm() {
  const nameValid = nameInput.value.trim().length >= 2;
  const phoneValid = /^\d{3}\s\d{3}\s\d{4}$/.test(phoneInput.value.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    emailInput.value.trim(),
  );
  const passwordValid =
    passwordInput.value.length >= 8 &&
    /[A-Z]/.test(passwordInput.value) &&
    /\d/.test(passwordInput.value) &&
    /[^A-Za-z0-9]/.test(passwordInput.value);
  const confirmValid = validateConfirmation();

  setFieldState("name", nameValid, "Vui lòng nhập họ và tên.");
  setFieldState("phone", phoneValid, "Số điện thoại chưa hợp lệ.");
  setFieldState("email", emailValid, "Email chưa đúng định dạng.");
  setFieldState(
    "password",
    passwordValid,
    "Mật khẩu cần có chữ hoa, số và ký tự đặc biệt.",
  );

  return (
    nameValid &&
    phoneValid &&
    emailValid &&
    passwordValid &&
    confirmValid &&
    termsInput.checked
  );
}

function setFieldState(name, isValid, message) {
  const field = fields[name];
  field.shell.classList.toggle("is-error", !isValid);
  field.shell.classList.toggle("is-success", isValid);

  if (field.error) {
    field.error.textContent = isValid ? "" : message;
  }
}

function clearFieldState(name) {
  const field = fields[name];
  field.shell.classList.remove("is-error", "is-success");

  if (field.error) {
    field.error.textContent = "";
  }
}

function updateSubmitState() {
  const hasRequiredValues =
    nameInput.value.trim() &&
    phoneInput.value.trim() &&
    emailInput.value.trim() &&
    passwordInput.value &&
    confirmInput.value &&
    termsInput.checked;

  submitButton.disabled = !hasRequiredValues;
}

/* Ghi chú: shakeForm() và setupPasswordToggle() là hàm dùng
   chung, đã chuyển sang ../shared/auth-ui.js. */
