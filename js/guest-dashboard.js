/* --- 1. Tham chiếu phần tử riêng của trang --- */
const searchables = document.querySelectorAll(".searchable"); // các thẻ lọc được
const noResults = document.querySelector("#no-results"); // dòng "không tìm thấy"
const latestRequestTitle = document.querySelector("#latest-request-title");
const requestDescription = document.querySelector("#request-description");
const requestStatus = document.querySelector("#request-status");
const timelineSteps = document.querySelectorAll(".request-timeline .timeline-step");
const viewRequestButton = document.querySelector("#view-request");
const processingCounter = document.querySelector(".metric-card .counter");

/* --- 2. Lời chào theo tên người dùng (dashboard.js đã điền tên trên topbar) --- */
if (currentUserName) {
  document.querySelector(".welcome .eyebrow").textContent = `XIN CHÀO, ${currentUserName.toUpperCase()}`;
}
/* --- 3. Tìm kiếm: lọc các thẻ .searchable theo data-search (bỏ dấu tiếng Việt) --- */
searchInput.addEventListener("input", () => {
  const term = normalize(searchInput.value);
  let visibleCount = 0;

  searchables.forEach((item) => {
    const matches = !term || normalize(item.dataset.search || "").includes(term);
    item.classList.toggle("is-filtered", !matches); // .is-filtered { display: none }
    if (matches) visibleCount += 1;
  });

  noResults.style.display = visibleCount ? "none" : "block";
});

/* --- 4. Thẻ dịch vụ: bấm là mở modal với đúng loại dịch vụ đã chọn --- */
document.querySelectorAll(".service-card").forEach((card) => {
  card.querySelector("button").addEventListener("click", () => {
    openRequestModal(card.dataset.service);
  });
});

/* --- 5. Modal gửi yêu cầu: hành vi chung ở dashboard.js, ở đây chỉ xử lý dữ liệu --- */
setupRequestModal(({ title, note }) => {
  /* Lưu vào kho chung để trang "Yêu cầu của bạn" đọc được (cùng khoá, cùng cấu trúc). */
  saveRequest({ code: nextRequestCode(), title, note, time: nowClock() });

  /* Cập nhật thẻ "Yêu cầu gần nhất" (đang hiển thị #SF-3184 mẫu) bằng yêu cầu mới. */
  latestRequestTitle.textContent = title;
  requestDescription.textContent = note || "Yêu cầu vừa được gửi đến đội ngũ vận hành.";
  requestStatus.innerHTML = '<img src="../assets/images/979b6.svg" alt="" />Đang xử lý';
  timelineSteps[0].classList.add("done");
  timelineSteps[1].classList.add("active");
  viewRequestButton.disabled = false;

  /* Tăng số "đang xử lý" ngay trên thẻ số liệu (không chạy lại hiệu ứng đếm). */
  const nextProcessing = Number(processingCounter.dataset.target) + 1;
  processingCounter.dataset.target = String(nextProcessing);
  processingCounter.textContent = String(nextProcessing).padStart(2, "0");
});

/* --- 6. Hai nút nhỏ trên trang: "Xem chi tiết" (#SF-3184) và "Khám phá ưu đãi" --- */
viewRequestButton.addEventListener("click", () => {
  const card = document.querySelector(".request-card");
  card.classList.add("focus-card");
  showToast("Yêu cầu #SF-3184 đang được thực hiện.");
  window.setTimeout(() => card.classList.remove("focus-card"), 1200);
});

document.querySelector("#explore-offer").addEventListener("click", () => {
  showToast("Ưu đãi Spa đã được lưu cho phòng 1208.");
});

/* --- 7. Hai thẻ số liệu: ghi thẳng giá trị đích, không đếm dần ---
 * ponytail: bỏ hiệu ứng đếm số theo yêu cầu giảm hiệu ứng; cần dựng lại thì
 * xem lại bản IntersectionObserver + requestAnimationFrame trong git. */
document.querySelectorAll(".counter").forEach((counter) => {
  counter.textContent = String(Number(counter.dataset.target)).padStart(2, "0");
});