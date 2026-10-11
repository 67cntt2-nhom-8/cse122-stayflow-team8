const brandPanel = document.querySelector(".brand-panel");
const loginForm = document.querySelector("#login-form");
const identityInput = document.querySelector("#identity");
const identityShell = document.querySelector("#identity-shell");
const identityMessage = document.querySelector("#identity-message");
const passwordInput = document.querySelector("#password");
const passwordShell = document.querySelector("#password-shell");
const passwordToggle = document.querySelector(".password-toggle");
const passwordMessage = document.querySelector("#password-message");
const passwordMessageText = passwordMessage.querySelector("span");
const submitButton = document.querySelector(".submit-button");
const submitLabel = document.querySelector(".submit-button__label");
const toast = document.querySelector(".toast");
const toastMessage = document.querySelector(".toast__message");
const forgotPassword = document.querySelector("#forgot-password");
const uxNote = document.querySelector("#ux-note");

let attemptsRemaining = 4;
let toastTimer;
const validIdentity = "thuha.nguyen@email.com";
const validPassword = "StayFlow2026";

brandPanel.addEventListener("pointermove", (event) => {
  const bounds = brandPanel.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;

  brandPanel.style.setProperty("--mouse-x", `${x}%`);
  brandPanel.style.setProperty("--mouse-y", `${y}%`);
});

brandPanel.addEventListener("pointerleave", () => {
  brandPanel.style.setProperty("--mouse-x", "50%");
  brandPanel.style.setProperty("--mouse-y", "45%");
});

passwordToggle.addEventListener("click", () => {
  const shouldShowPassword = passwordInput.type === "password";

  passwordInput.type = shouldShowPassword ? "text" : "password";
  passwordToggle.setAttribute("aria-pressed", String(shouldShowPassword));
  passwordToggle.setAttribute(
    "aria-label",
    shouldShowPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu",
  );
  passwordInput.focus();
});

passwordInput.addEventListener("input", () => {
  passwordShell.classList.remove("input-shell--error", "input-shell--success");
  passwordMessage.classList.add("is-hidden");
  passwordInput.setAttribute("aria-invalid", "false");
  uxNote.classList.add("is-hidden");
});

identityInput.addEventListener("input", () => {
  identityShell.classList.remove("input-shell--error", "input-shell--success");
  identityInput.setAttribute("aria-invalid", "false");
  identityMessage.textContent = "";
  uxNote.classList.add("is-hidden");
});

forgotPassword.addEventListener("click", (event) => {
  event.preventDefault();
  showToast("Liên kết khôi phục đã được gửi tới email của bạn.");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const identity = identityInput.value.trim();
  const password = passwordInput.value;

  submitButton.classList.add("is-loading");
  submitButton.disabled = true;

  window.setTimeout(() => {
    submitButton.classList.remove("is-loading");
    submitButton.disabled = false;

    const isIdentityValid = identity.toLowerCase() === validIdentity;
    const isPasswordValid = password === validPassword;

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

    identityShell.classList.toggle("input-shell--error", !isIdentityValid);
    identityShell.classList.remove("input-shell--success");
    identityInput.setAttribute("aria-invalid", String(!isIdentityValid));
    identityMessage.textContent = isIdentityValid
      ? ""
      : "Email hoặc số điện thoại không hợp lệ.";

    passwordShell.classList.toggle("input-shell--error", !isPasswordValid);
    passwordShell.classList.remove("input-shell--success");
    passwordInput.setAttribute("aria-invalid", String(!isPasswordValid));

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

    uxNote.classList.remove("is-hidden");
    shakeForm();
  }, 900);
});

function shakeForm() {
  loginForm.classList.remove("shake");
  void loginForm.offsetWidth;
  loginForm.classList.add("shake");
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toast.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}
