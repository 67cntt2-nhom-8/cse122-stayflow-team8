// StayFlow – phần dùng chung cho Quản lý + Quản trị (SV1): dữ liệu, khung trang, toast, hộp thoại.
const SF = {
  NOW0: new Date("2026-10-06T20:30:00").getTime(), T0: Date.now(), q: "",
  cfg: () => ({ warn: 20, cap: 4, target: 92, ai: true, ...JSON.parse(localStorage.getItem("sf_cfg") || "{}") }),
  now: () => SF.NOW0 + Date.now() - SF.T0, // đồng hồ giả lập khớp dữ liệu mẫu
  setClock(value) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) throw new Error(`Thời điểm mock không hợp lệ: ${value}`);
    SF.NOW0 = timestamp;
    SF.T0 = Date.now();
  },
  esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]),
  norm: (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d"),
  match: (text, q) => SF.norm(text).includes(SF.norm(q.trim())), // tìm kiếm không phân biệt dấu
  fmt(s) {
    const a = Math.abs(s), p = (n) => String(n).padStart(2, "0"), g = s < 0 ? "-" : "";
    return a >= 86400 ? `${g}${Math.floor(a / 86400)}n ${Math.floor((a % 86400) / 3600)}g` : `${g}${p(Math.floor(a / 3600))}:${p(Math.floor((a % 3600) / 60))}:${p(a % 60)}`;
  },
  NAV: {
    manager: [["Điều phối", "manager-dispatch-board.html", "dispatch", "▦"], ["Theo dõi SLA", "manager-sla-monitor.html", "sla", "◷"], ["Báo cáo", "manager-service-report.html", "report", "▮"], ["Nhân sự", "manager-staff-management.html", "hr", "☺"], ["Cấu hình", "manager-settings.html", "cfg", "⚙"]],
    admin: [["Tổng quan", "admin-dashboard.html", "home", "▦"], ["Người dùng", "admin-user-management.html", "user", "☺"], ["Loại dịch vụ", "admin-service-type-management.html", "svc", "☰"], ["Khách sạn", "admin-hotel.html", "hotel", "⌂"], ["Nhật ký hệ thống", "admin-system-log.html", "log", "≡"]],
  },
  shell(role, page, crumb, title) {
    const admin = role === "admin", who = admin ? "Quản trị viên" : "Quản lý";
    const nav = SF.NAV[role].map(([n, h, k, i]) => h
      ? `<a href="${h}"${k === page ? ' class="on" aria-current="page"' : ""}><span aria-hidden="true">${i}</span>${n}</a>`
      : `<button type="button" data-soon="${n}"><span aria-hidden="true">${i}</span>${n}</button>`).join("");
    document.getElementById("app").innerHTML = `<a class="skip" href="#main">Bỏ qua điều hướng</a><div class="shell"><aside class="side"><div class="logo"><b>S</b>StayFlow</div><div class="hotel">AURORA GRAND · ĐÀ NẴNG<strong>${who}</strong></div><nav class="nav" aria-label="Điều hướng chính">${nav}</nav><div class="help"><strong>Cần trợ giúp?</strong><br>Trung tâm vận hành hỗ trợ 24/7<br>Máy lẻ 188<br><button type="button" id="reset">Đặt lại dữ liệu mẫu</button></div></aside><div><header class="top"><div class="grow"><small>${crumb}</small><h2>${title}</h2></div><input class="search" id="q" type="search" placeholder="Tìm mã, phòng, khách..." aria-label="Tìm kiếm"><div class="me"><i aria-hidden="true">M</i><span>Minh Anh<br><small>${who}</small></span></div></header><main id="main"></main></div></div><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
    document.getElementById("q").oninput = (e) => { SF.q = e.target.value; SF.onq && SF.onq(); };
    document.getElementById("reset").onclick = () => {
      if (confirm("Đặt lại toàn bộ dữ liệu mẫu?")) window.StayFlowStore.reset();
    };
    document.querySelector(".nav").onclick = (e) => { const b = e.target.closest("[data-soon]"); if (b) SF.toast(`${b.dataset.soon}: màn hình này sẽ được bổ sung.`); };
    return document.getElementById("main");
  },
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
  },
  save: (d) => window.StayFlowStore.save(d),
  log(d, msg) { d.audit.unshift({ at: new Date(SF.now()).toISOString(), by: "Minh Anh", msg }); },
  rows: (d) => d.requests.map((r) => {
    const st = d.stays.find((s) => s.id === r.stayId) || {}, sv = d.serviceTypes.find((s) => s.id === r.serviceTypeId) || {}, task = d.tasks.find((t) => t.requestId === r.id);
    return { ...r, room: st.roomNumber, guest: st.guestName, svc: sv.categoryName, dept: sv.department, due: new Date(r.dueAt || new Date(r.createdAt).getTime() + (sv.expectedSLA || 30) * 6e4).getTime(), task, staff: task && d.staff.find((s) => s.id === task.staffId) };
  }),
  left: (r) => Math.round((r.due - SF.now()) / 1000),
  state(r) {
    if (["Hoàn thành", "Đã hủy"].includes(r.status)) return ["Đã đóng", "info"];
    const l = SF.left(r); return l < 0 ? ["Quá hạn", "bad"] : l < SF.cfg().warn * 60 ? ["Sắp hạn", "warn"] : ["Trong hạn", "ok"];
  },
  toast(msg, undo) {
    const t = document.getElementById("toast"); clearTimeout(SF.tt);
    t.innerHTML = `<span>${SF.esc(msg)}</span>${undo ? '<button type="button">Hoàn tác</button>' : ""}`; t.classList.add("show");
    if (undo) t.querySelector("button").onclick = () => { undo(); t.classList.remove("show"); };
    SF.tt = setTimeout(() => t.classList.remove("show"), 6000);
  },
  modal(html, drawer) { // chỉ một lớp phủ tại một thời điểm, Esc / bấm nền để đóng
    SF.close(); SF.prev = document.activeElement;
    const o = document.createElement("div"); o.className = "overlay" + (drawer ? " drawer" : "");
    o.innerHTML = `<div class="panel" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
    document.getElementById("app").append(o);
    o.onclick = (e) => { if (e.target === o) SF.close(); };
    o.onkeydown = (e) => { if (e.key === "Escape") SF.close(); };
    const p = o.firstChild; p.querySelectorAll("[data-x]").forEach((b) => (b.onclick = SF.close));
    (p.querySelector("input,select,textarea") || p).focus(); return p;
  },
  close() { document.querySelector(".overlay")?.remove(); SF.prev?.focus?.(); },
  pager: (p, n, per) => `<div class="pager"><span class="muted">${n ? p * per + 1 : 0}–${Math.min(n, (p + 1) * per)} trong ${n}</span><span><button class="btn sm" data-p="${p - 1}"${p < 1 ? " disabled" : ""}>‹ Trước</button> <button class="btn sm" data-p="${p + 1}"${(p + 1) * per >= n ? " disabled" : ""}>Sau ›</button></span></div>`,
  empty: () => '<div class="empty"><strong>Không có kết quả phù hợp</strong><p class="muted">Thử từ khóa khác hoặc xóa bộ lọc.</p></div>',
};