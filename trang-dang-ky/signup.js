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

brandPanel.addEventListener("pointermove", (event) => {
  const bounds = brandPanel.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;

  brandPanel.style.setProperty("--mouse-x", `${x}%`);
  brandPanel.style.setProperty("--mouse-y", `${y}%`);
});

brandPanel.addEventListener("pointerleave", () => {
  brandPanel.style.setProperty("--mouse-x", "50%");
  brandPanel.style.setProperty("--mouse-y", "50%");
});

passwordToggle.addEventListener("click", () => {
  const shouldShow = passwordInput.type === "password";
  passwordInput.type = shouldShow ? "text" : "password";
  passwordToggle.setAttribute("aria-pressed", String(shouldShow));
  passwordToggle.setAttribute(
    "aria-label",
    shouldShow ? "Ẩn mật khẩu" : "Hiện mật khẩu",
  );
  passwordInput.focus();
});

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

phoneInput.addEventListener("input", () => {
  const digits = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  phoneInput.value = digits.replace(
    /(\d{3})(\d{0,3})(\d{0,4})/,
    (_, first, second, third) =>
      [first, second, third].filter(Boolean).join(" "),
  );
});

termsInput.addEventListener("change", updateSubmitState);

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const valid = validateForm();
  updateSubmitState();

  if (!valid) {
    shakeForm();
    return;
  }

  submitButton.classList.add("is-loading");
  submitButton.disabled = true;

  window.setTimeout(() => {
    submitButton.classList.remove("is-loading");
    formPanel.classList.add("is-success");
  }, 1100);
});

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

function shakeForm() {
  registerForm.classList.remove("shake");
  void registerForm.offsetWidth;
  registerForm.classList.add("shake");
}
