// StayFlow – phần dùng chung cho Quản lý + Quản trị (SV1): dữ liệu, khung trang, toast, hộp thoại.
const SF = {
  // Các mốc và cấu hình dùng chung giúp đồng hồ SLA và tìm kiếm nhất quán giữa các trang.
  NOW0: new Date("2026-10-06T20:30:00").getTime(),
  T0: Date.now(),
  q: "",
  cfg: () => ({
    warn: 20,
    cap: 4,
    target: 92,
    ai: true,
    ...JSON.parse(localStorage.getItem("sf_cfg") || "{}"),
  }),
  now: () => SF.NOW0 + Date.now() - SF.T0, // đồng hồ giả lập khớp dữ liệu mẫu
  setClock(value) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) throw new Error(`Thời điểm mock không hợp lệ: ${value}`);
    SF.NOW0 = timestamp;
    SF.T0 = Date.now();
  },
  esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]),
  norm: (s) => String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d"),
  match: (text, q) =>
    SF.norm(text).includes(SF.norm(q.trim())), // tìm kiếm không phân biệt dấu
  fmt(s) {
    const a = Math.abs(s);
    const p = (n) => String(n).padStart(2, "0");
    const g = s < 0 ? "-" : "";

    return a >= 86400
      ? `${g}${Math.floor(a / 86400)}n ${Math.floor((a % 86400) / 3600)}g`
      : `${g}${p(Math.floor(a / 3600))}:${p(Math.floor((a % 3600) / 60))}:${p(a % 60)}`;
  },
  NAV: {
    // Mỗi mục điều hướng gồm nhãn, đường dẫn, khóa trang hiện tại và biểu tượng.
    manager: [
      ["Điều phối", "manager-dispatch-board.html", "dispatch", "▦"],
      ["Theo dõi SLA", "manager-sla-monitor.html", "sla", "◷"],
      ["Báo cáo", "manager-service-report.html", "report", "▮"],
      ["Nhân sự", "manager-staff-management.html", "hr", "☺"],
      ["Cấu hình", "manager-settings.html", "cfg", "⚙"],
    ],
    admin: [
      ["Tổng quan", "admin-dashboard.html", "home", "▦"],
      ["Người dùng", "admin-user-management.html", "user", "☺"],
      ["Loại dịch vụ", "admin-service-type-management.html", "svc", "☰"],
      ["Khách sạn", "admin-hotel.html", "hotel", "⌂"],
      ["Nhật ký hệ thống", "admin-system-log.html", "log", "≡"],
    ],
  },
  // Dựng khung trang theo vai trò, gắn điều khiển tìm kiếm/reset và trả về vùng nội dung.
  shell(role, page, crumb, title) {
    const admin = role === "admin";
    const who = admin ? "Quản trị viên" : "Quản lý";
    const nav = SF.NAV[role]
      .map(([name, href, key, icon]) => href
        ? `<a href="${href}"${key === page ? ' class="on" aria-current="page"' : ""}><span aria-hidden="true">${icon}</span>${name}</a>`
        : `<button type="button" data-soon="${name}"><span aria-hidden="true">${icon}</span>${name}</button>`)
      .join("");
    document.getElementById("app").innerHTML = `<a class="skip" href="#main">Bỏ qua điều hướng</a><div class="shell"><aside class="side"><div class="logo"><b>S</b>StayFlow</div><div class="hotel">AURORA GRAND · ĐÀ NẴNG<strong>${who}</strong></div><nav class="nav" aria-label="Điều hướng chính">${nav}</nav><div class="help"><strong>Cần trợ giúp?</strong><br>Trung tâm vận hành hỗ trợ 24/7<br>Máy lẻ 188<br><button type="button" id="reset">Đặt lại dữ liệu mẫu</button></div></aside><div><header class="top"><div class="grow"><small>${crumb}</small><h2>${title}</h2></div><input class="search" id="q" type="search" placeholder="Tìm mã, phòng, khách..." aria-label="Tìm kiếm"><div class="me"><i aria-hidden="true">M</i><span>Minh Anh<br><small>${who}</small></span></div></header><main id="main"></main></div></div><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
    document.getElementById("q").oninput = (e) => {
      SF.q = e.target.value;
      SF.onq && SF.onq();
    };
    document.getElementById("reset").onclick = () => {
      if (confirm("Đặt lại toàn bộ dữ liệu mẫu?")) window.StayFlowStore.reset();
    };
    document.querySelector(".nav").onclick = (e) => {
      const b = e.target.closest("[data-soon]");
      if (b) SF.toast(`${b.dataset.soon}: màn hình này sẽ được bổ sung.`);
    };
    return document.getElementById("main");
  },
  // Chờ dữ liệu mock dùng chung sẵn sàng và hiển thị lỗi rõ ràng nếu khởi tạo thất bại.
  async load() {
    const showError = (message) => {
      document.getElementById("main").innerHTML = `<div class="card"><h3>Không tải được dữ liệu</h3><p class="muted">${SF.esc(message)}</p></div>`;
    };
    try {
      if (!window.StayFlowDataReady) throw new Error("Bộ tải dữ liệu dùng chung chưa được nạp.");
      await window.StayFlowDataReady;
      if (!window.StayFlowStore || !window.StayFlowData) throw new Error("Kho dữ liệu dùng chung chưa sẵn sàng.");
      SF.setClock(window.StayFlowData.clock);
      return window.StayFlowData;
    } catch (error) {
      const message = `Không thể tải dữ liệu StayFlow (${error.message}). Hãy chạy dự án bằng Live Server và kiểm tra dữ liệu đã lưu.`;
      showError(message);
      throw error;
    }
    // Phần chuyển đổi localStorage cũ bên dưới được giữ lại để tương thích; luồng hiện tại kết thúc ở try/catch phía trên.
    let d;
    const saved = localStorage.getItem("sf_db");
    if (saved) {
      try {
        d = JSON.parse(saved);
      } catch (error) {
        const message = "Dữ liệu đã lưu không hợp lệ. Hãy đặt lại dữ liệu mẫu rồi tải lại trang.";
        showError(message);
        throw new Error(message, { cause: error });
      }
    } else {
      const requireMapped = (value, mapping, field) => {
        if (!Object.prototype.hasOwnProperty.call(mapping, value)) {
          const message = `Giá trị "${value}" không hợp lệ trong trường ${field} của dữ liệu mock.`;
          showError(message);
          throw new Error(message);
        }
        return mapping[value];
      };
      const priority = (value) => requireMapped(
        value,
        { high: "Cao", normal: "Trung bình", low: "Thấp" },
        "priority",
      );
      const requestStatus = (value) =>
        requireMapped(
          value,
          {
            new: "Chờ xử lý",
            assigned: "Đang thực hiện",
            in_progress: "Đang thực hiện",
            waiting_guest: "Đang chờ khách",
            completed: "Hoàn thành",
            cancelled: "Đã hủy",
          },
          "requests.status",
        );
      const taskStatus = (value) =>
        requireMapped(
          value,
          {
            assigned: "Chờ nhận",
            in_progress: "Đang làm",
            waiting_guest: "Chờ khách",
            completed: "Hoàn tất",
          },
          "tasks.status",
        );
      const shift = (value) => requireMapped(
        value,
        {
          morning: "Ca sáng",
          afternoon: "Ca chiều",
          day: "Ca ngày",
          evening: "Ca chiều",
          night: "Ca đêm",
        },
        "staff.shift",
      );
      if (!source || typeof source !== "object") {
        const message = "Tệp assets/data/stayflow.mock.json phải chứa một đối tượng JSON.";
        showError(message);
        throw new Error(message);
      }
      const mockStaff = source.staff;
      const mockStays = source.stays;
      const mockRequests = source.requests;
      const mockTasks = source.tasks;
      const mockServiceTypes = source.serviceTypes;
      const mockFeedback = source.feedback;
      if (
        ![
          mockStaff,
          mockStays,
          mockRequests,
          mockTasks,
          mockServiceTypes,
          mockFeedback,
        ].every(Array.isArray)
      ) {
        const message = "Dữ liệu mock cần có các danh sách staff, stays, requests, tasks, serviceTypes và feedback.";
        showError(message);
        throw new Error(message);
      }
      const prioritySuggestions = source.aiMocks?.priorityAssistant || [];
      // Chuẩn hóa dữ liệu JSON mock về cấu trúc mà các màn hình Manager/Admin sử dụng.
      d = {
        staff: mockStaff
          .filter((staff) => staff.role === "staff")
          .map((staff) => ({
            id: staff.id,
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            role: staff.department,
            shift: shift(staff.shift),
            status: requireMapped(
              staff.status,
              { on_duty: "Đang trực", off_duty: "Nghỉ" },
              "staff.status",
            ),
          })),
        serviceTypes: mockServiceTypes.map((service) => ({
          id: service.id,
          categoryName: service.name,
          description: service.description,
          department: service.department,
          expectedSLA: service.defaultSlaMinutes,
          priority: "Trung bình",
          active: service.isActive,
        })),
        stays: mockStays.map((stay) => ({
          id: stay.id,
          guestName: stay.guestName,
          guestPhone: stay.guestPhone,
          roomNumber: stay.roomNumber,
          status: requireMapped(
            stay.status,
            { checked_in: "Đang lưu trú", checked_out: "Đã trả phòng" },
            "stays.status",
          ),
        })),
        requests: mockRequests.map((request) => ({
          id: request.id,
          stayId: request.stayId,
          serviceTypeId: request.serviceTypeId,
          title: request.title,
          content: request.description,
          status: requestStatus(request.status),
          priority: priority(request.priority),
          createdAt: request.createdAt,
          dueAt: request.dueAt,
          ai_priority_reason:
            prioritySuggestions.find((item) => item.requestId === request.id)?.reason ||
            request.notes ||
            "",
        })),
        tasks: mockTasks.map((task) => {
          const request = mockRequests.find((item) => item.id === task.requestId);

          return {
            id: task.id,
            requestId: task.requestId,
            staffId: task.assignedTo,
            status: taskStatus(task.status),
            priority: request ? priority(request.priority) : "Trung bình",
            ai_priority_reason:
              prioritySuggestions.find((item) => item.requestId === task.requestId)?.reason || "",
            assignedAt: task.createdAt,
            completedAt: task.completedAt,
          };
        }),
        feedback: mockFeedback,
        feedbackSummary: source.aiMocks?.feedbackSummarizer?.summary || "",
        users: [
          ...mockStaff.map((staff) => ({
            id: staff.id,
            name: staff.name,
            contact: staff.email,
            role: requireMapped(
              staff.role,
              { staff: "Staff", manager: "Manager", admin: "Admin" },
              "staff.role",
            ),
            scope: staff.role === "staff"
              ? `${staff.department} · ${shift(staff.shift)}`
              : staff.role === "admin"
                ? "Toàn hệ thống"
                : "Toàn khách sạn",
            active: requireMapped(
              staff.status,
              { on_duty: true, off_duty: false },
              "staff.status",
            ),
            perms: staff.role === "admin"
              ? [1, 1, 1, 1]
              : staff.role === "manager"
                ? [1, 1, 1, 0]
                : [1, 0, 0, 0],
          })),
          ...mockStays.filter((stay) => stay.status === "checked_in").map((stay) => ({
            id: stay.guestId,
            name: stay.guestName,
            contact: stay.guestEmail || stay.guestPhone,
            role: "Guest",
            scope: `Phòng ${stay.roomNumber}`,
            active: true,
            perms: [0, 0, 0, 0],
          })),
        ],
        audit: [],
        clock: source.meta?.updatedAt || new Date().toISOString(),
      };
    }
    if (
      ![d.staff, d.stays, d.requests, d.tasks, d.serviceTypes].every(Array.isArray)
    ) {
      const message = "Dữ liệu đã lưu thiếu danh sách cần thiết cho màn hình quản lý.";
      showError(message);
      throw new Error(message);
    }
    d.users = d.users || [];
    d.audit = d.audit || [];
    if (d.feedback === undefined) d.feedback = [];
    if (!Array.isArray(d.feedback)) {
      const message = "Dữ liệu đã lưu không hợp lệ: feedback phải là danh sách.";
      showError(message);
      throw new Error(message);
    }
    if (d.feedbackSummary === undefined) d.feedbackSummary = "";
    if (typeof d.feedbackSummary !== "string") {
      const message = "Dữ liệu đã lưu không hợp lệ: feedbackSummary phải là văn bản.";
      showError(message);
      throw new Error(message);
    }
    if (d.clock) SF.setClock(d.clock);
    return d;
  },
  // Lưu dữ liệu và thêm sự kiện vào đầu nhật ký kiểm toán.
  save: (d) => localStorage.setItem("sf_db", JSON.stringify(d)),
  log(d, msg) {
    d.audit.unshift({
      at: new Date(SF.now()).toISOString(),
      by: "Minh Anh",
      msg,
    });
  },
  rows: (d) =>
    // Ghép yêu cầu với lưu trú, loại dịch vụ và nhiệm vụ để các bảng có đủ dữ liệu hiển thị.
    d.requests.map((r) => {
      const st = d.stays.find((s) => s.id === r.stayId) || {};
      const sv = d.serviceTypes.find((s) => s.id === r.serviceTypeId) || {};
      const task = d.tasks.find((t) => t.requestId === r.id);

      return {
        ...r,
        room: st.roomNumber,
        guest: st.guestName,
        svc: sv.categoryName,
        dept: sv.department,
        due: new Date(
          r.dueAt || new Date(r.createdAt).getTime() + (sv.expectedSLA || 30) * 6e4,
        ).getTime(),
        task,
        staff: task && d.staff.find((s) => s.id === task.staffId),
      };
    }),
  left: (r) => Math.round((r.due - SF.now()) / 1000),
  state(r) {
    // Dùng thời hạn và ngưỡng cấu hình để phân loại trạng thái SLA cũng như màu hiển thị.
    if (["Hoàn thành", "Đã hủy"].includes(r.status)) return ["Đã đóng", "info"];
    const remaining = SF.left(r);
    return remaining < 0
      ? ["Quá hạn", "bad"]
      : remaining < SF.cfg().warn * 60
        ? ["Sắp hạn", "warn"]
        : ["Trong hạn", "ok"];
  },
  toast(msg, undo) {
    // Toast thông báo có thể kèm thao tác hoàn tác và tự ẩn sau một khoảng thời gian.
    const toast = document.getElementById("toast");
    clearTimeout(SF.tt);
    toast.innerHTML = `<span>${SF.esc(msg)}</span>${undo ? '<button type="button">Hoàn tác</button>' : ""}`;
    toast.classList.add("show");
    if (undo) {
      toast.querySelector("button").onclick = () => {
        undo();
        toast.classList.remove("show");
      };
    }
    SF.tt = setTimeout(() => toast.classList.remove("show"), 6000);
  },
  modal(html, drawer) { // chỉ một lớp phủ tại một thời điểm, Esc / bấm nền để đóng
    // Lưu focus hiện tại, dựng lớp phủ và đưa focus vào nội dung để hỗ trợ bàn phím.
    SF.close();
    SF.prev = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "overlay" + (drawer ? " drawer" : "");
    overlay.innerHTML = `<div class="panel" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
    document.getElementById("app").append(overlay);
    overlay.onclick = (e) => {
      if (e.target === overlay) SF.close();
    };
    overlay.onkeydown = (e) => {
      if (e.key === "Escape") SF.close();
    };
    const panel = overlay.firstChild;
    panel.querySelectorAll("[data-x]").forEach((button) => (button.onclick = SF.close));
    (panel.querySelector("input,select,textarea") || panel).focus();
    return panel;
  },
  close() {
    // Đóng lớp phủ đang mở và trả focus về phần tử trước khi mở hộp thoại.
    document.querySelector(".overlay")?.remove();
    SF.prev?.focus?.();
  },
  pager: (page, count, perPage) =>
    `<div class="pager"><span class="muted">${count ? page * perPage + 1 : 0}–${Math.min(count, (page + 1) * perPage)} trong ${count}</span><span><button class="btn sm" data-p="${page - 1}"${page < 1 ? " disabled" : ""}>‹ Trước</button> <button class="btn sm" data-p="${page + 1}"${(page + 1) * perPage >= count ? " disabled" : ""}>Sau ›</button></span></div>`,
  empty: () =>
    '<div class="empty"><strong>Không có kết quả phù hợp</strong><p class="muted">Thử từ khóa khác hoặc xóa bộ lọc.</p></div>',
};