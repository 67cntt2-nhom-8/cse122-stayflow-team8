/* --- 1. Tham chiếu phần tử riêng của trang --- */
const searchables = document.querySelectorAll(".searchable"); // các thẻ lọc được
const noResults = document.querySelector("#no-results"); // dòng "không tìm thấy"
const latestRequestTitle = document.querySelector("#latest-request-title");
const requestDescription = document.querySelector("#request-description");
const requestStatus = document.querySelector("#request-status");
const timelineSteps = document.querySelectorAll(".request-timeline .timeline-step");
const viewRequestButton = document.querySelector("#view-request");
const processingCounter = document.querySelector(".metric-card .counter");
const completedCounter = document.querySelectorAll(".metric-card .counter")[1];
let latestRequestCode = "#SF-3184";
let guestDashboardDataReady = false;

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
  latestRequestCode = nextRequestCode();
  saveRequest({ code: latestRequestCode, title, serviceName: title, note, time: nowClock(), status: "in_progress" });
  document.querySelector("#latest-request-code").textContent = latestRequestCode;

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
  document.querySelector(".request-card").dataset.search = `${latestRequestCode} ${title} ${note}`;
});

STAYFLOW_REQUESTS_READY.then(() => {
  const source = window.StayFlowData;
  const stay = source.stays.find((item) => item.id === GUEST_STAY_ID);
  if (source) {
    source.serviceTypes.forEach((service) => {
      const card = Array.from(document.querySelectorAll(".service-card"))
        .find((item) => item.dataset.service === service.categoryName);
      if (!card) return;
      card.querySelector("p").textContent = `Dự kiến ${service.expectedSLA} phút`;
      card.dataset.search = `${service.categoryName} ${service.description} ${service.expectedSLA} phút`;
    });
  }
  if (stay) {
    const checkIn = new Date(stay.checkInAt);
    const checkOut = new Date(stay.checkOutAt);
    const now = new Date(source.clock);
    const parts = (date) => Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(date).map((part) => [part.type, part.value]),
    );
    const formatStayDate = (date) => {
      const value = parts(date);
      return `${value.day} Thg ${value.month} · ${value.hour}:${value.minute}`;
    };
    const totalNights = Math.max(0, Math.ceil((checkOut - checkIn) / 86400000));
    const elapsedNights = Math.min(totalNights, Math.max(0, Math.ceil((now - checkIn) / 86400000)));
    document.querySelector("#stay-checkin").textContent = formatStayDate(checkIn);
    document.querySelector("#stay-checkout").textContent = formatStayDate(checkOut);
    document.querySelector("#stay-nights").textContent = `Đêm ${elapsedNights}/${totalNights} · Còn ${totalNights - elapsedNights} đêm lưu trú`;
    document.querySelector("#stay-progress").style.width = `${totalNights ? (elapsedNights / totalNights) * 100 : 0}%`;

    const stayRequests = source.requests.filter((request) => request.stayId === stay.id);
    const processing = stayRequests.filter((request) => !["Hoàn thành", "Đã hủy"].includes(request.status)).length;
    const completed = stayRequests.filter((request) => request.status === "Hoàn thành").length;
    guestDashboardDataReady = true;
    processingCounter.dataset.target = String(processing);
    processingCounter.textContent = String(processing).padStart(2, "0");
    completedCounter.dataset.target = String(completed);
    completedCounter.textContent = String(completed).padStart(2, "0");
    document.querySelector("#processing-summary").textContent = `${processing} yêu cầu đang được xử lý`;
  } else {
    document.querySelector("#stay-nights").textContent = "Không tìm thấy dữ liệu lưu trú cho phòng 1208.";
  }

  const records = readRequests();
  const latest = records[0];
  if (!latest) return;

  latestRequestCode = latest.code;
  document.querySelector("#latest-request-code").textContent = latestRequestCode;
  latestRequestTitle.textContent = latest.title;
  requestDescription.textContent = latest.note || "Yêu cầu đang được đội ngũ vận hành xử lý.";
  requestStatus.textContent = latest.status === "completed" ? "Hoàn thành" : latest.status === "cancelled" ? "Đã huỷ" : "Đang xử lý";
  document.querySelector(".request-card").dataset.search = `${latestRequestCode} ${latest.title} ${latest.note}`;
  const completedSteps = latest.status === "completed" ? timelineSteps.length : latest.status === "cancelled" ? 1 : 2;
  timelineSteps.forEach((step, index) => {
    step.classList.toggle("done", index < completedSteps);
    step.classList.toggle("active", latest.status !== "completed" && latest.status !== "cancelled" && index === completedSteps - 1);
  });
  viewRequestButton.disabled = false;
});

/* --- 6. Hai nút nhỏ trên trang: xem chi tiết yêu cầu gần nhất và khám phá ưu đãi --- */
viewRequestButton.addEventListener("click", () => {
  const card = document.querySelector(".request-card");
  card.classList.add("focus-card");
  showToast(`Yêu cầu ${latestRequestCode} đang được theo dõi.`);
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