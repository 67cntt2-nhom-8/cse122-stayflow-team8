(async () => {
  const main = SF.shell("manager", "hr", "Quản lý / Nhân sự", "Nhân sự");
  let db = await SF.load(), role = "";
  const CAP = SF.cfg().cap, OPEN = ["Chờ nhận", "Đang làm"], on = (s) => s.status === "Đang trực";
  const load = (s) => db.tasks.filter((t) => t.staffId === s.id && OPEN.includes(t.status)).length;
  const shifts = () => [...new Set([...db.staff.map((s) => s.shift), "Ca sáng", "Ca chiều", "Ca tối"])];
  main.innerHTML = `<div id="h"></div><div class="tools"><label>Bộ phận <select id="fr"><option value="">Tất cả</option>${[...new Set(db.staff.map((s) => s.role))].map((r) => `<option>${r}</option>`).join("")}</select></label></div><div id="t" class="wrap"></div>`;
  const $ = (i) => document.getElementById(i), save = (snap, msg) => { SF.save(db); draw(); SF.toast(msg, () => { db = JSON.parse(snap); SF.save(db); draw(); }); };
  function draw() {
    const l = db.staff.filter((s) => (!role || s.role === role) && SF.match(`${s.name} ${s.role} ${s.email}`, SF.q)), n = db.staff.filter(on).length;
    $("h").innerHTML = `<div class="head"><div><span class="gold">Quản lý ca trực</span><h1>Nhân sự</h1><p class="muted">${n}/${db.staff.length} nhân viên đang trực · công suất tối đa ${CAP} việc/người (đổi ở Cấu hình).</p></div></div>`;
    $("t").innerHTML = `<table><thead><tr><th>Nhân viên</th><th>Bộ phận</th><th>Ca</th><th>Tải hiện tại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${l.map((s) => { const k = load(s); return `<tr><td><strong>${SF.esc(s.name)}</strong><br><small class="muted">${SF.esc(s.phone)} · ${SF.esc(s.email)}</small></td><td>${s.role}</td><td><select data-sh="${s.id}" aria-label="Ca của ${SF.esc(s.name)}">${shifts().map((x) => `<option${x === s.shift ? " selected" : ""}>${x}</option>`).join("")}</select></td><td>${k}/${CAP} ${k >= CAP ? "· Quá tải" : ""}<div class="meter"><i class="${k >= CAP ? "bad-f" : k >= CAP / 2 ? "warn-f" : ""}" style="width:${Math.min(100, (k / CAP) * 100)}%"></i></div></td><td><span class="chip ${on(s) ? "ok" : ""}">${s.status}</span></td><td><button class="btn sm" data-t="${s.id}">${on(s) ? "Chuyển nghỉ" : "Đưa vào trực"}</button></td></tr>`; }).join("")}</tbody></table>${l.length ? "" : SF.empty()}`;
  }
  main.onclick = (e) => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    const s = db.staff.find((x) => x.id === b.dataset.t), k = load(s), snap = JSON.stringify(db);
    if (on(s) && k) return SF.toast(`${s.name} còn ${k} việc đang xử lý. Hãy điều phối lại trước khi cho nghỉ.`);
    s.status = on(s) ? "Nghỉ" : "Đang trực"; SF.log(db, `${s.name} → ${s.status}`); save(snap, `${s.name}: ${s.status}`);
  };
  main.onchange = (e) => {
    const t = e.target;
    if (t.id === "fr") { role = t.value; draw(); }
    else if (t.dataset.sh) { const s = db.staff.find((x) => x.id === t.dataset.sh), snap = JSON.stringify(db); s.shift = t.value; SF.log(db, `${s.name} đổi sang ${t.value}`); save(snap, `Đã đổi ${s.name} sang ${t.value}`); }
  };
  SF.onq = draw; draw();
})();