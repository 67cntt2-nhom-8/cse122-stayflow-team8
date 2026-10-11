(function () {
  "use strict";

  var CORRECT_PASSWORD = "stayflow2026"; // ponytail: no backend — demo credential
  var MAX_TRIES = 5;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^\+?\d[\d\s.-]{7,}$/;const brandPanel = document.querySelector(".brand-panel");
const loginForm = document.querySelector("#login-form");
const identityInput = document.querySelector("#identity");
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

let attemptsRemaining = 4;
let toastTimer;

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
});

identityInput.addEventListener("input", () => {
  identityInput.closest(".input-shell").classList.remove("input-shell--error");
});

forgotPassword.addEventListener("click", (event) => {
  event.preventDefault();
  showToast("Liên kết khôi phục đã được gửi tới email của bạn.");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const identity = identityInput.value.trim();
  const password = passwordInput.value;

  if (!identity) {
    identityInput.closest(".input-shell").classList.add("input-shell--error");
    identityInput.focus();
    shakeForm();
    return;
  }

  submitButton.classList.add("is-loading");
  submitButton.disabled = true;

  window.setTimeout(() => {
    submitButton.classList.remove("is-loading");
    submitButton.disabled = false;

    if (password === "StayFlow2026") {
      passwordShell.classList.remove("input-shell--error");
      passwordShell.classList.add("input-shell--success");
      passwordMessage.classList.add("is-hidden");
      submitButton.classList.add("is-success");
      submitLabel.textContent = "Đăng nhập thành công";
      showToast("Chào mừng bạn quay lại StayFlow.");
      return;
    }

    attemptsRemaining = Math.max(0, attemptsRemaining - 1);
    passwordShell.classList.add("input-shell--error");
    passwordShell.classList.remove("input-shell--success");
    passwordInput.setAttribute("aria-invalid", "true");
    passwordMessage.classList.remove("is-hidden");
    passwordMessageText.textContent =
      attemptsRemaining > 0
        ? `Mật khẩu không đúng. Bạn còn ${attemptsRemaining} lần thử.`
        : "Tài khoản tạm khóa. Vui lòng thử lại sau.";
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


  // Pure helpers: the bits of logic worth a check.
  function isContactValid(value) {
    var v = String(value).trim();
    return EMAIL_RE.test(v) || PHONE_RE.test(v);
  }
  function isLoginValid(email, password) {
    return isContactValid(email) && password === CORRECT_PASSWORD;
  }

  function initLogin() {
    var form = document.getElementById("loginForm");
    var email = document.getElementById("email");
    var emailWrap = document.getElementById("emailWrap");
    var emailError = document.getElementById("emailError");
    var password = document.getElementById("password");
    var pwWrap = document.getElementById("pwWrap");
    var toggle = document.getElementById("pwToggle");
    var error = document.getElementById("pwError");
    var triesOut = document.getElementById("tries");
    var note = document.getElementById("loginNote");
    var submit = form.querySelector(".btn");
    var tries = MAX_TRIES;

    // Hiện / ẩn mật khẩu
    toggle.addEventListener("click", function () {
      var showing = password.type === "text";
      password.type = showing ? "password" : "text";
      toggle.classList.toggle("is-on", !showing);
      toggle.setAttribute("aria-pressed", String(!showing));
      toggle.setAttribute("aria-label", showing ? "Hiện mật khẩu" : "Ẩn mật khẩu");
      password.focus();
    });

    function setFieldError(wrap, el, input, on) {
      el.hidden = !on;
      wrap.classList.toggle("is-error", on);
      if (on) { input.setAttribute("aria-invalid", "true"); }
      else { input.removeAttribute("aria-invalid"); }
    }
    function hideNote() { note.hidden = true; }

    // sửa nội dung -> xoá lỗi của ô đó và ẩn ghi chú trạng thái
    email.addEventListener("input", function () { setFieldError(emailWrap, emailError, email, false); hideNote(); });
    password.addEventListener("input", function () { setFieldError(pwWrap, error, password, false); hideNote(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var emailOk = isContactValid(email.value);
      var pwOk = password.value === CORRECT_PASSWORD;

      if (emailOk && pwOk) {
        setFieldError(emailWrap, emailError, email, false);
        setFieldError(pwWrap, error, password, false);
        hideNote();
        submit.disabled = true;
        submit.textContent = "Đang đăng nhập…";
        window.setTimeout(function () {
          alert("Đăng nhập thành công. Xin chào " + email.value.trim() + "!");
          submit.disabled = false;
          submit.textContent = "Đăng nhập";
        }, 600);
        return;
      }

      setFieldError(emailWrap, emailError, email, !emailOk);
      setFieldError(pwWrap, error, password, !pwOk);
      if (!pwOk) {
        tries -= 1;
        if (tries < 0) { tries = 0; }
        triesOut.textContent = String(tries);
        password.select();
        if (tries === 0) { submit.disabled = true; submit.textContent = "Tài khoản đã tạm khoá"; }
      }
      // ghi chú chỉ hiện khi email hoặc mật khẩu (hay cả hai) không hợp lệ
      note.hidden = false;
      (emailOk ? password : email).focus();
    });
  }

  function selfCheck() {
    console.assert(isLoginValid("thuha.nguyen@email.com", "stayflow2026") === true, "valid login");
    console.assert(isLoginValid("thuha.nguyen@email.com", "sai-mat-khau") === false, "wrong password");
    console.assert(isLoginValid("   ", "stayflow2026") === false, "blank email");
    console.assert(isLoginValid("abc", "stayflow2026") === false, "invalid email format");
    console.assert(isContactValid("0912345678") === true, "valid phone");
    console.log("[login] selfCheck passed");
  }

  selfCheck();
  document.addEventListener("DOMContentLoaded", initLogin);
})();
