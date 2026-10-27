(async () => {
  const main = SF.shell("admin", "home", "Quản trị / Tổng quan", "Tổng quan quản trị");
  const db = await SF.load();
  const rows = SF.rows(db);
  const active = (service) => service.active !== false;
  const users = db.users;
  const open = rows.filter((request) =>
    !["Hoàn thành", "Đã hủy"].includes(request.status),
  ).length;
  const overdue = rows.filter((request) => SF.state(request)[0] === "Quá hạn").length;
  const roles = {};

  users.forEach((user) => {
    roles[user.role] = (roles[user.role] || 0) + 1;
  });

  const total = Math.max(1, users.length);
  const pad = (value) => String(value).padStart(2, "0");
  const recent = db.audit.slice(0, 5);

  main.innerHTML = `<div class="head"><div><span class="gold">AURORA GRAND · ĐÀ NẴNG</span> <span class="chip ${overdue ? "warn" : "ok"}">${overdue ? "Cần chú ý: có yêu cầu quá hạn" : "Hệ thống ổn định"}</span><h1>Bảng điều khiển quản trị</h1><p class="muted">Tổng quan tài khoản, dịch vụ và hoạt động gần đây từ dữ liệu mẫu.</p></div><a class="btn" href="admin-system-log.html">Xem nhật ký</a></div>
  <div class="kpis">${[
      [
        "Tài khoản hoạt động",
        `${users.filter((user) => user.active).length}/${users.length}`,
        "Đã khóa: " + users.filter((user) => !user.active).length,
      ],
      [
        "Loại dịch vụ đang bật",
        `${db.serviceTypes.filter(active).length}/${db.serviceTypes.length}`,
        "SLA áp dụng khi tạo yêu cầu",
      ],
      ["Yêu cầu đang mở", pad(open), "Chưa hoàn thành hoặc hủy"],
      ["Quá hạn SLA", pad(overdue), overdue ? "Cần xử lý ngay" : "Không có"],
    ].map(([name, value, hint]) => `<div class="card kpi"><span>${name}</span><b>${value}</b><small class="muted">${hint}</small></div>`).join("")}</div>
  <div class="cols" style="grid-template-columns:1fr 1fr"><section class="card"><h3>Tài khoản theo vai trò</h3>${Object.entries(roles).map(([role, count]) => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><span>${role}</span><strong>${count}</strong></div><div class="meter"><i style="width:${(count / total) * 100}%"></i></div></div>`).join("") || SF.empty()}</section>
  <section class="card"><h3>Lối tắt</h3><div style="display:grid;gap:10px"><a class="btn" href="admin-user-management.html">Quản lý người dùng</a><a class="btn" href="admin-service-type-management.html">Quản lý loại dịch vụ</a><a class="btn" href="admin-hotel.html">Khách sạn & lưu trú</a><a class="btn" href="admin-system-log.html">Nhật ký hệ thống</a></div></section></div>
  <section class="card"><h3>Hoạt động gần đây</h3>${recent.length ? recent.map((entry) => `<div style="padding:8px 0;border-top:1px solid var(--line)"><strong>${SF.esc(entry.msg)}</strong><br><small class="muted">${SF.esc(entry.by)} · ${new Date(entry.at).toLocaleString("vi-VN")}</small></div>`).join("") : '<p class="muted">Chưa có hoạt động nào. Thao tác ở các trang Người dùng, Loại dịch vụ hoặc Điều phối sẽ được ghi tại đây.</p>'}</section>`;
})();
