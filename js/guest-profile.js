/* --- 1. Tham chiếu phần tử riêng của trang --- */
const profileForm = document.querySelector("#profile-form");
const saveBanner = document.querySelector("#save-banner");
const cardName = document.querySelector("#profile-card-name"); // tên in trên danh thiếp
const avatarImage = document.querySelector("#profile-avatar");
const avatarInput = document.querySelector("#avatar-input");
const PROFILE_KEY = "stayflow_profile";

/* Thứ tự khoá = thứ tự lấy giá trị từ form; dùng chung cho đọc và ghi. */
const PROFILE_FIELDS = ["fullName", "phone", "email", "language", "timezone", "emergency"];

/* Giá trị mặc định = thông tin kỳ lưu trú đang có (phòng 1208, mã khách #GT-20481). */
const PROFILE_DEFAULTS = {
  fullName: "Nguyễn Thu Hà",
  phone: "090 123 4567",
  email: "thuha.nguyen@email.com",
  language: "vi",
  timezone: "gmt7",
  emergency: "Nguyễn Minh Khang · 091 882 4012",
};

/* --- 2. Đọc/ghi hồ sơ --- */
/* Hồ sơ đã lưu (nếu có) đè lên giá trị mặc định; JSON hỏng hoặc localStorage bị
   chặn thì dùng lại mặc định để trang vẫn hiển thị đủ thông tin. */
function readProfile() {
  try {
    return { ...PROFILE_DEFAULTS, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
  } catch {
    return { ...PROFILE_DEFAULTS };
  }
}

/* Điền biểu mẫu + danh thiếp từ một bộ giá trị. */
function fillProfile(values) {
  PROFILE_FIELDS.forEach((name) => {
    const field = profileForm.elements[name];
    if (field) field.value = values[name];
  });
  cardName.textContent = values.fullName; // đổi tên trong form là danh thiếp đổi theo
}

/* --- 3. Lưu thay đổi --- */
profileForm.addEventListener("submit", (event) => {
  event.preventDefault(); // trình duyệt đã kiểm tra required/type trước khi tới đây

  const values = {};
  PROFILE_FIELDS.forEach((name) => {
    values[name] = profileForm.elements[name].value.trim();
  });

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(values));
  } catch {
    /* localStorage bị chặn thì bỏ qua: biểu mẫu vẫn hiển thị đúng, chỉ không nhớ lần sau. */
  }
  /* Topbar của mọi trang đọc tên từ khoá này (dashboard.js) -> giữ đồng bộ ngay. */
  localStorage.setItem("stayflow_user_name", values.fullName);
  const profileName = document.querySelector("#profile-button b");
  if (profileName) profileName.textContent = values.fullName;

  fillProfile(values);
  saveBanner.querySelector("span").textContent = `Đã lưu thay đổi lúc ${nowClock()} hôm nay.`;
  saveBanner.hidden = false;
  showToast("Thông tin cá nhân đã được lưu.");
});

/* --- 4. "Hủy": bỏ các thay đổi chưa lưu, trả về dữ liệu đã lưu gần nhất --- */
document.querySelector("#reset-profile").addEventListener("click", () => {
  fillProfile(readProfile());
  saveBanner.hidden = true;
  showToast("Đã khôi phục thông tin đã lưu.");
});

/* --- 5. "Đổi ảnh": xem trước ảnh vừa chọn ---
   ponytail: ảnh chỉ hiện trong phiên này, tải lại trang là mất (chưa có máy chủ để
   lưu tệp). Khi có API thì thay bằng upload và lưu URL trả về vào stayflow_profile. */
document.querySelector("#avatar-button").addEventListener("click", () => avatarInput.click());

avatarInput.addEventListener("change", () => {
  const file = avatarInput.files[0];
  if (!file) return;
  avatarImage.src = URL.createObjectURL(file);
});

/* --- 6. Khởi động: điền sẵn hồ sơ đã lưu --- */
fillProfile(readProfile());

STAYFLOW_REQUESTS_READY.then(() => {
  const stay = window.StayFlowData?.stays.find((item) => item.id === GUEST_STAY_ID);
  if (!stay) return;

  try {
    if (localStorage.getItem(PROFILE_KEY) !== null) return;
    PROFILE_DEFAULTS.fullName = stay.guestName;
    PROFILE_DEFAULTS.phone = stay.guestPhone;
    PROFILE_DEFAULTS.email = stay.guestEmail || PROFILE_DEFAULTS.email;
    const profile = readProfile();
    fillProfile(profile);
    localStorage.setItem("stayflow_user_name", profile.fullName);
    const profileName = document.querySelector("#profile-button b");
    if (profileName) profileName.textContent = profile.fullName;
  } catch (error) {
    console.error("Không thể nạp hồ sơ khách từ dữ liệu mock:", error);
  }
});
