/* ============================================================================
 * create-request.js — Riêng trang "Tạo yêu cầu mới"
 * ----------------------------------------------------------------------------
 * Khung dashboard (sidebar, dropdown, toast, Escape, kho yêu cầu, hiệu ứng hiện
 * dần) nằm ở ../shared/dashboard.js. File này chỉ lo phần tạo yêu cầu:
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

const LIST_URL = "guest-service-requests.html"; // danh sách đang chờ yêu cầu vừa gửi
const NOTE_MIN = 3; // ngắn hơn thế thì nhân viên không đủ thông tin để làm

/* Gợi ý nhanh: câu mẫu hay dùng nhất của từng dịch vụ, bấm là chèn vào ghi chú. */
const SUGGESTIONS = {
  "Gọi dọn phòng": ["Dọn phòng và thay ga giường", "Xin thêm 2 chai nước", "Thu gom rác trong phòng"],
  "Yêu cầu khăn": ["Thêm 2 khăn tắm", "Đổi khăn mặt", "Bổ sung 2 gối"],
  "Đặt bữa": ["Bữa sáng cho 2 người lúc 7:00", "Cơm gà và nước cam", "Trà nóng và bánh ngọt"],
  "Báo sự cố": ["Điều hoà không mát", "Vòi nước nóng chảy yếu", "Đèn phòng tắm không sáng"],
};

let selectedService = "";

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
 * quay về danh sách — nơi service-requests.js sẽ dựng thẻ cho yêu cầu vừa gửi. */
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
    try {
      const record = { code: nextRequestCode(), title: selectedService, serviceName: selectedService, note, time: nowClock(), status: "in_progress" };
      saveRequest(record);
      showToast(`Đã gửi yêu cầu ${record.code}. Đang quay về danh sách…`);
      window.setTimeout(() => {
        window.location.href = LIST_URL;
      }, 900); // đủ lâu để khách kịp đọc toast
    } catch (error) {
      console.error("Không thể lưu yêu cầu:", error);
      showToast(`Không thể lưu yêu cầu: ${error.message}`);
      sendButton.disabled = false;
    }
  }, 700);
});

/* --- 7. Khởi động trang ---
 * Thứ tự: dựng nút chọn trước (selectService cần các nút đã có), rồi mới tới mã dự kiến. */
noteInput.addEventListener("input", syncNote);
syncNote();
sendButton.disabled = true;
STAYFLOW_REQUESTS_READY.then(() => {
  selectedService = Object.keys(SERVICE_META)[0];
  if (!selectedService) throw new Error("Chưa có loại dịch vụ đang hoạt động.");
  renderServicePicker();
  selectService(selectedService);
  previewCode.textContent = nextRequestCode();
  sendButton.disabled = false;
}).catch((error) => {
  console.error("Không thể khởi tạo biểu mẫu yêu cầu:", error);
  noteError.textContent = `Không thể tải danh mục dịch vụ: ${error.message}`;
  noteError.hidden = false;
});

/* --- 8. Trợ lý AI giả lập ---
 * Toàn bộ dữ liệu (lời chào, câu hỏi nhanh, từ khoá -> dịch vụ/ưu tiên/ghi chú) nằm
 * trong thẻ <script type="application/json" id="assistant-data"> của create-request.html.
 * Luồng: khách nhắn -> khớp từ khoá (bỏ dấu tiếng Việt bằng normalize() của
 * dashboard.js) -> trả lời + TỰ chọn dịch vụ ở bước 1 và soạn ghi chú ở bước 2.
 * Dữ liệu nằm trong aiMocks.guestAssistant của stayflow.mock.json (data.js đã fetch
 * sẵn, giữ chung cơ chế StayFlowDataReady — không fetch riêng để không trùng lặp).
 * ponytail: khớp từ khoá đơn giản (chuỗi con) — đủ cho bản demo JSON giả lập; khi có
 * API thật chỉ cần thay aiReply() bằng lời gọi API, phần giao diện giữ nguyên. */
let aiData = { assistant: { greeting: "", typing: "…", fallback: "" }, quickPrompts: [], replies: [] };
const aiDataReady = (window.StayFlowDataReady || Promise.reject(new Error("StayFlowDataReady chưa sẵn sàng.")))
  .then(() => {
    /* StayFlowMockData là JSON gốc vừa fetch (data.js gán trước khi promise kết thúc). */
    const mocks = window.StayFlowMockData && window.StayFlowMockData.aiMocks;
    if (!mocks || !mocks.guestAssistant) throw new Error("Thiếu aiMocks.guestAssistant trong stayflow.mock.json.");
    aiData = mocks.guestAssistant;
    renderAiChips();
    /* Khách mở hộp trước khi dữ liệu về: giờ mới có lời chào để hiện. */
    if (!aiPanel.hidden && !aiLog.childElementCount) aiAddMessage(aiData.assistant.greeting, "bot");
  })
  .catch((error) => {
    console.error("Không thể nạp dữ liệu trợ lý AI:", error.message);
  });
const aiBubble = document.querySelector("#ai-bubble");
const aiPanel = document.querySelector("#ai-panel");
const aiClose = document.querySelector("#ai-close");
const aiLog = document.querySelector("#ai-log");
const aiChips = document.querySelector("#ai-chips");
const aiForm = document.querySelector("#ai-form");
const aiInput = document.querySelector("#ai-input");

function aiToggle(open) {
  aiPanel.hidden = !open;
  aiBubble.setAttribute("aria-expanded", String(open));
  if (open) aiInput.focus();
}

/* Thêm một dòng hội thoại; với tin của trợ lý có thể kèm nhãn mức ưu tiên. */
function aiAddMessage(text, who, priority) {
  const message = document.createElement("div");
  message.className = `ai-msg ai-msg--${who}`;
  message.textContent = text;
  if (priority) {
    const badge = document.createElement("span");
    badge.className = "ai-msg__priority";
    badge.textContent = `Mức ưu tiên: ${priority}`;
    message.appendChild(badge);
  }
  aiLog.appendChild(message);
  aiLog.scrollTop = aiLog.scrollHeight; // tin mới nhất luôn hiện trong khung
  return message;
}

/* Tìm câu trả lời: từ khoá và tin nhắn đều bỏ dấu rồi so sánh chuỗi con. */
function aiReply(text) {
  const needle = normalize(text);
  return aiData.replies.find((reply) => reply.keywords.some((keyword) => needle.includes(normalize(keyword)))) || null;
}

function aiSend(text) {
  aiAddMessage(text, "user");

  const typing = aiAddMessage(aiData.assistant.typing, "bot"); // giả lập đang gõ
  typing.classList.add("is-typing");

  window.setTimeout(async () => {
    await aiDataReady; // dữ liệu mẫu có thể về muộn: đợi rồi mới trả lời, tránh trả lời bằng dữ liệu rỗng
    typing.remove();

    const reply = aiReply(text);
    if (!reply) {
      aiAddMessage(aiData.assistant.fallback, "bot");
      return;
    }

    aiAddMessage(reply.answer, "bot", reply.priority);
    selectService(reply.service); // bước 1: chọn đúng dịch vụ
    noteInput.value = reply.note; // bước 2: soạn sẵn ghi chú
    syncNote();
    showToast(`Trợ lý đã điền giúp bạn: ${reply.service}. Sửa thêm nếu cần.`);
  }, 600);
}

aiBubble.addEventListener("click", () => {
  aiToggle(aiPanel.hidden);
  /* Chưa có lời chào (dữ liệu mẫu chưa về) thì để aiDataReady hiện sau, tránh bong bóng rỗng. */
  if (aiPanel.hidden === false && !aiLog.childElementCount && aiData.assistant.greeting) {
    aiAddMessage(aiData.assistant.greeting, "bot");
  }
});

aiClose.addEventListener("click", () => aiToggle(false));

/* Escape đóng hộp trợ lý (handler Escape của dashboard.js không biết tới panel này). */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !aiPanel.hidden) aiToggle(false);
});

aiForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = aiInput.value.trim();
  if (!text) return;
  aiInput.value = "";
  aiSend(text);
});

/* Câu hỏi nhanh từ JSON: bấm là gửi luôn, khỏi gõ. Gọi một lần trong aiDataReady. */
function renderAiChips() {
  aiData.quickPrompts.forEach((text) => {
    const chip = document.createElement("button");
    chip.className = "ai-chip";
    chip.type = "button";
    chip.textContent = text;
    chip.addEventListener("click", () => aiSend(text));
    aiChips.appendChild(chip);
  });
}