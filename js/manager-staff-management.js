(async () => {
  const main = SF.shell("manager", "hr", "Quản lý / Nhân sự", "Nhân sự");
  let db = await SF.load(), role = "";
  const CAP = SF.cfg().cap, OPEN = ["Chờ nhận", "Đang làm"], on = (s) => s.status === "Đang trực";
  const load = (s) => db.tasks.filter((t) => t.staffId === s.id && OPEN.includes(t.status)).length;
  const shifts = () => [...new Set(db.shifts.map((shift) => shift.name).concat(db.staff.map((s) => s.shift)))];
  main.innerHTML = `<div id="h"></div><div class="tools"><label>Bộ phận <select id="fr"><option value="">Tất cả</option>${[...new Set(db.staff.map((s) => s.role))].map((r) => `<option>${r}</option>`).join("")}</select></label></div><div id="t" class="wrap"></div>`;
  const $ = (i) => document.getElementById(i), save = (snap, msg) => { SF.save(db); draw(); SF.toast(msg, () => { db = JSON.parse(snap); SF.save(db); draw(); }); };
  function draw() {
    const staffList = db.staff.filter((staff) =>
      (!role || staff.role === role) &&
      SF.match(`${staff.name} ${staff.role} ${staff.email}`, SF.q),
    );
    const onDuty = db.staff.filter(on).length;

    $("h").innerHTML = `<div class="head"><div><span class="gold">Quản lý ca trực</span><h1>Nhân sự</h1><p class="muted">${onDuty}/${db.staff.length} nhân viên đang trực · công suất tối đa ${CAP} việc/người (đổi ở Cấu hình).</p></div></div>`;
    $("t").innerHTML = `<table><thead><tr><th>Nhân viên</th><th>Bộ phận</th><th>Ca</th><th>Tải hiện tại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${staffList.map((staff) => {
      const count = load(staff);

      return `<tr><td><strong>${SF.esc(staff.name)}</strong><br><small class="muted">${SF.esc(staff.phone)} · ${SF.esc(staff.email)}</small></td><td>${staff.role}</td><td><select data-sh="${staff.id}" aria-label="Ca của ${SF.esc(staff.name)}">${shifts().map((shift) => `<option${shift === staff.shift ? " selected" : ""}>${shift}</option>`).join("")}</select></td><td>${count}/${CAP} ${count >= CAP ? "· Quá tải" : ""}<div class="meter"><i class="${count >= CAP ? "bad-f" : count >= CAP / 2 ? "warn-f" : ""}" style="width:${Math.min(100, (count / CAP) * 100)}%"></i></div></td><td><span class="chip ${on(staff) ? "ok" : ""}">${staff.status}</span></td><td><button class="btn sm" data-t="${staff.id}">${on(staff) ? "Chuyển nghỉ" : "Đưa vào trực"}</button></td></tr>`;
    }).join("")}</tbody></table>${staffList.length ? "" : SF.empty()}`;
  }

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
