/* ============================================================================
 * taoyeucau.js — Riêng trang "Tạo yêu cầu mới"
 * ----------------------------------------------------------------------------
 * Khung dashboard (sidebar, dropdown, toast, Escape, kho yêu cầu, hiệu ứng hiện
 * dần) nằm ở ../trang-dung-chung/dashboard.js. File này chỉ lo phần tạo yêu cầu:
 *   1. Dựng ô chọn dịch vụ từ bảng dùng chung SERVICE_META (dashboard.js).
 *   2. Ghi chú: đếm ký tự + chip gợi ý nhanh.
 *   3. Xem trước yêu cầu theo lựa chọn hiện tại.
 *   4. Gửi: kiểm tra, lưu vào kho chung rồi quay về danh sách yêu cầu.
 * ========================================================================= */

/* --- 1. Tham chiếu phần tử của trang --- */
const servicePicker = document.querySelector("#service-picker");
const createForm = document.querySelector("#create-request-form");
const noteInput = document.querySelector("#request-note");
const noteCount = document.querySelector("#note-count");
const noteError = document.querySelector("#note-error");
const suggestRow = document.querySelector("#suggest-row");
const sendButton = document.querySelector("#send-request");
const previewIcon = document.querySelector("#preview-icon");
const previewCode = document.querySelector("#preview-code");
const previewTitle = document.querySelector("#preview-title");
const previewMeta = document.querySelector("#preview-meta");
const previewNote = document.querySelector("#preview-note");
const previewOwner = document.querySelector("#preview-owner");
const previewEta = document.querySelector("#preview-eta");

const LIST_URL = "../trang-yeu-cau/yeucau.html"; // danh sách đang chờ yêu cầu vừa gửi
const NOTE_MIN = 3; // ngắn hơn thế thì nhân viên không đủ thông tin để làm

/* Gợi ý nhanh: câu mẫu hay dùng nhất của từng dịch vụ, bấm là chèn vào ghi chú. */
const SUGGESTIONS = {
  "Gọi dọn phòng": ["Dọn phòng và thay ga giường", "Xin thêm 2 chai nước", "Thu gom rác trong phòng"],
  "Yêu cầu khăn": ["Thêm 2 khăn tắm", "Đổi khăn mặt", "Bổ sung 2 gối"],
  "Đặt bữa": ["Bữa sáng cho 2 người lúc 7:00", "Cơm gà và nước cam", "Trà nóng và bánh ngọt"],
  "Báo sự cố": ["Điều hoà không mát", "Vòi nước nóng chảy yếu", "Đèn phòng tắm không sáng"],
};

let selectedService = Object.keys(SERVICE_META)[0]; // mặc định dịch vụ đầu bảng

/* --- 2. Ô chọn dịch vụ: mỗi dịch vụ một nút, dữ liệu lấy từ SERVICE_META --- */
function renderServicePicker() {
  servicePicker.innerHTML = "";

  Object.entries(SERVICE_META).forEach(([title, meta]) => {
    const option = document.createElement("button");
    option.classList.add("service-option");
    option.type = "button";
    option.dataset.service = title;
    option.setAttribute("role", "radio"); // cả nhóm là radiogroup trong HTML
    option.innerHTML =
      '<span class="service-option__icon"><img alt="" /></span>' +
      '<span class="service-option__text"><strong></strong><small></small></span>' +
      '<span class="service-option__check" aria-hidden="true">✓</span>';

    option.querySelector("img").src = meta.icon;
    option.querySelector("strong").textContent = title;
    option.querySelector("small").textContent = `${meta.owner} · ${meta.eta}`; // ai làm, bao lâu
    option.addEventListener("click", () => selectService(title));

    servicePicker.appendChild(option);
  });
}

/* Chọn dịch vụ: đánh dấu nút vừa bấm, đổi gợi ý và cập nhật khối xem trước. */
function selectService(title) {
  selectedService = title;

  servicePicker.querySelectorAll(".service-option").forEach((option) => {
    const isCurrent = option.dataset.service === title;
    option.classList.toggle("is-selected", isCurrent);
    option.setAttribute("aria-checked", String(isCurrent));
  });

  renderSuggestions();
  updatePreview();
}

/* --- 3. Gợi ý nhanh: chỉ hiện câu mẫu của dịch vụ đang chọn --- */
function renderSuggestions() {
  suggestRow.innerHTML = "";

  (SUGGESTIONS[selectedService] || []).forEach((text) => {
    const chip = document.createElement("button");
    chip.classList.add("suggest-chip");
    chip.type = "button";
    chip.textContent = text;
    chip.addEventListener("click", () => {
      /* Đã có câu này trong ghi chú thì thôi, tránh chèn trùng khi bấm lại. */
      if (!noteInput.value.includes(text)) {
        noteInput.value = noteInput.value.trim() ? `${noteInput.value.trim()} ${text}.` : `${text}.`;
      }
      syncNote();
      noteInput.focus();
    });

    suggestRow.appendChild(chip);
  });
}

/* --- 4. Ghi chú: đếm ký tự, ẩn lỗi khi đã đủ dài, đồng bộ sang khối xem trước --- */
function syncNote() {
  const note = noteInput.value.trim();

  noteCount.textContent = `${noteInput.value.length} / ${noteInput.maxLength}`;
  if (note.length >= NOTE_MIN) noteError.hidden = true;
  previewNote.textContent = note || "Chưa có ghi chú. Nhân viên sẽ chỉ biết loại dịch vụ bạn chọn.";
}

/* --- 5. Khối xem trước: đúng những gì thẻ yêu cầu ở trang Yêu cầu sẽ hiển thị --- */
function updatePreview() {
  const meta = SERVICE_META[selectedService];

  previewIcon.src = meta.icon;
  previewTitle.textContent = selectedService;
  previewOwner.textContent = meta.owner;
  previewEta.textContent = meta.eta;
  previewMeta.textContent = `Gửi ${nowClock()} hôm nay · Phòng 1208`;
}

/* --- 6. Gửi yêu cầu ---
 * Chưa có backend nên giả lập gọi API như modal ở dashboard.js: chờ 700ms cho khách
 * thấy nút đang quay, rồi lưu bản ghi { code, title, note, time } vào kho chung và
 * quay về danh sách — nơi yeucau.js sẽ dựng thẻ cho yêu cầu vừa gửi. */
createForm.addEventListener("submit", (event) => {
  event.preventDefault(); // không để form tải lại trang
  const note = noteInput.value.trim();

  if (note.length < NOTE_MIN) {
    noteError.hidden = false;
    noteInput.focus();
    showToast("Vui lòng mô tả yêu cầu trước khi gửi.");
    return;
  }

  sendButton.classList.add("loading");
  sendButton.disabled = true;

  window.setTimeout(() => {
    const record = { code: nextRequestCode(), title: selectedService, note, time: nowClock() };
    saveRequest(record);
    showToast(`Đã gửi yêu cầu ${record.code}. Đang quay về danh sách…`);
    window.setTimeout(() => {
      window.location.href = LIST_URL;
    }, 900); // đủ lâu để khách kịp đọc toast
  }, 700);
});

/* --- 7. Khởi động trang ---
 * Thứ tự: dựng nút chọn trước (selectService cần các nút đã có), rồi mới tới mã dự kiến. */
renderServicePicker();
selectService(selectedService);
previewCode.textContent = nextRequestCode(); // mã sẽ được cấp nếu bấm gửi ngay bây giờ
noteInput.addEventListener("input", syncNote);
syncNote();