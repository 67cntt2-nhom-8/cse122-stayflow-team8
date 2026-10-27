(async () => {
  const main = SF.shell("manager", "hr", "Quản lý / Nhân sự", "Nhân sự");
  let db = await SF.load();
  let role = "";

  // Các helper xác định trực ca, số task đang mở và danh sách ca có thể chọn.
  const CAP = SF.cfg().cap;
  const OPEN = ["Chờ nhận", "Đang làm"];
  const on = (staff) => staff.status === "Đang trực";
  const load = (staff) =>
    db.tasks.filter((task) => task.staffId === staff.id && OPEN.includes(task.status)).length;
  const shifts = () =>
    [...new Set(db.shifts.map((shift) => shift.name).concat(db.staff.map((staff) => staff.shift)))];

  main.innerHTML = `<div id="h"></div><div class="tools"><label>Bộ phận <select id="fr"><option value="">Tất cả</option>${[...new Set(db.staff.map((staff) => staff.role))].map((item) => `<option>${item}</option>`).join("")}</select></label></div><div id="t" class="wrap"></div>`;

  const $ = (id) => document.getElementById(id);
  const save = (snapshot, message) => {
    SF.save(db);
    draw();
    SF.toast(message, () => {
      db = JSON.parse(snapshot);
      SF.save(db);
      draw();
    });
  };

  function draw() {
    // Lọc nhân sự rồi cập nhật bảng ca trực, khối lượng công việc và trạng thái.
    const staffList = db.staff.filter((staff) =>
      (!role || staff.role === role) &&
      SF.match(`${staff.name} ${staff.role} ${staff.email}`, SF.q),
    );
    const onDuty = db.staff.filter(on).length;

    $("h").innerHTML = `<div class="head"><div><span class="gold">Quản lý ca trực</span><h1>Nhân sự</h1><p class="muted">${onDuty}/${db.staff.length} nhân viên đang trực · công suất tối đa ${CAP} việc/người (đổi ở Cấu hình). Tải tính từ việc chờ nhận và đang làm.</p></div></div>`;
    $("t").innerHTML = `<table><thead><tr><th>Nhân viên</th><th>Bộ phận</th><th>Ca</th><th>Tải hiện tại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${staffList.map((staff) => {
      const count = load(staff);

      return `<tr><td><strong>${SF.esc(staff.name)}</strong><br><small class="muted">${SF.esc(staff.phone)} · ${SF.esc(staff.email)}</small></td><td>${staff.role}</td><td><select data-sh="${staff.id}" aria-label="Ca của ${SF.esc(staff.name)}">${shifts().map((shift) => `<option${shift === staff.shift ? " selected" : ""}>${shift}</option>`).join("")}</select></td><td>${count}/${CAP} ${count >= CAP ? "· Quá tải" : ""}<div class="meter"><i class="${count >= CAP ? "bad-f" : count >= CAP / 2 ? "warn-f" : ""}" style="width:${Math.min(100, (count / CAP) * 100)}%"></i></div></td><td><span class="chip ${on(staff) ? "ok" : ""}">${staff.status}</span></td><td><button class="btn sm" data-t="${staff.id}">${on(staff) ? "Chuyển nghỉ" : "Đưa vào trực"}</button></td></tr>`;
    }).join("")}</tbody></table>${staffList.length ? "" : SF.empty()}`;
  }

  // Không cho chuyển nhân viên sang nghỉ khi vẫn còn task đang xử lý.
  main.onclick = (e) => {
    const button = e.target.closest("[data-t]");
    if (!button) return;

    const staff = db.staff.find((item) => item.id === button.dataset.t);
    const count = load(staff);
    const snapshot = JSON.stringify(db);

    if (on(staff) && count) {
      return SF.toast(
        `${staff.name} còn ${count} việc đang xử lý. Hãy điều phối lại trước khi cho nghỉ.`,
      );
    }

    staff.status = on(staff) ? "Nghỉ" : "Đang trực";
    SF.log(db, `${staff.name} → ${staff.status}`);
    save(snapshot, `${staff.name}: ${staff.status}`);
  };

  // Thay đổi bộ lọc phòng ban hoặc ca làm sẽ cập nhật trạng thái và ghi audit.
  main.onchange = (e) => {
    const target = e.target;
    if (target.id === "fr") {
      role = target.value;
      draw();
    } else if (target.dataset.sh) {
      const staff = db.staff.find((item) => item.id === target.dataset.sh);
      const snapshot = JSON.stringify(db);

      staff.shift = target.value;
      SF.log(db, `${staff.name} đổi sang ${target.value}`);
      save(snapshot, `Đã đổi ${staff.name} sang ${target.value}`);
    }
  };

  SF.onq = draw;
  draw();
})();
