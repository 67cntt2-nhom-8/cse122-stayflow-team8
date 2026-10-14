(async () => {
  const main = SF.shell("admin", "user", "Quản trị / Người dùng", "Quản lý người dùng");
  let db = await SF.load(), page = 0, role = "", sel = new Set();
  const PER = 6, PERMS = ["Điều phối yêu cầu", "Xem báo cáo dịch vụ", "Xuất dữ liệu", "Quản lý người dùng"], RC = { Guest: "", Staff: "info", Manager: "warn", Admin: "bad" };
  const REASONS = ["Nghi ngờ truy cập trái phép", "Vi phạm chính sách", "Nghỉ việc / hết hợp đồng", "Chủ tài khoản yêu cầu", "Khác"];
  main.innerHTML = `<div id="h"></div><div class="tools"><label>Vai trò <select id="fr"><option value="">Tất cả</option>${Object.keys(RC).map((r) => `<option>${r}</option>`).join("")}</select></label></div><div id="b"></div><div id="t" class="wrap"></div>`;
  const $ = (id) => document.getElementById(id), undo = (snap) => () => { db = JSON.parse(snap); SF.save(db); draw(); };
  const list = () => db.users.filter((u) => (!role || u.role === role) && SF.match(`${u.name} ${u.contact} ${u.scope}`, SF.q));
  const admins = () => db.users.filter((u) => u.role === "Admin" && u.active);

  function draw() {
    const l = list(); page = Math.min(page, Math.max(0, Math.ceil(l.length / PER) - 1)); const pg = l.slice(page * PER, page * PER + PER);
    $("h").innerHTML = `<div class="head"><div><span class="gold">Phân quyền theo vai trò và phạm vi</span><h1>Tài khoản & phân quyền</h1><p class="muted">${db.users.length} tài khoản · ${db.users.filter((u) => u.active).length} đang hoạt động</p></div></div>`;
    $("b").innerHTML = sel.size ? `<div class="bulk"><strong>${sel.size} tài khoản được chọn</strong><button class="btn sm danger" data-bulk>Khóa đã chọn</button><button class="btn sm" data-clr>Bỏ chọn</button></div>` : "";
    $("t").innerHTML = `<table><thead><tr><th><input type="checkbox" data-all aria-label="Chọn tất cả trên trang"${pg.length && pg.every((u) => sel.has(u.id)) ? " checked" : ""}></th><th>Tài khoản</th><th>Vai trò</th><th>Phạm vi</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${pg.map((u) => `<tr><td><input type="checkbox" data-c="${u.id}" aria-label="Chọn ${SF.esc(u.name)}"${sel.has(u.id) ? " checked" : ""}></td><td><button class="btn sm" data-v="${u.id}" style="border:0;padding:0;background:none;text-align:left"><strong>${SF.esc(u.name)}</strong></button><br><small class="muted">${SF.esc(u.contact)}</small></td><td><span class="chip ${RC[u.role]}">${u.role}</span></td><td>${SF.esc(u.scope)}</td><td><span class="chip ${u.active ? "ok" : "bad"}">${u.active ? "Hoạt động" : "Đã khóa"}</span></td><td><button class="btn sm" data-pm="${u.id}">Phân quyền</button> <button class="btn sm" data-rp="${u.id}">Cấp lại mật khẩu</button> <button class="btn sm" data-lk="${u.id}">${u.active ? "Khóa" : "Kích hoạt"}</button></td></tr>`).join("")}</tbody></table>${l.length ? "" : SF.empty()}${SF.pager(page, l.length, PER)}`;
  }
  function view(u) {
    SF.modal(`<h3>${SF.esc(u.name)}</h3><dl><dt>Liên hệ</dt><dd>${SF.esc(u.contact)}</dd><dt>Vai trò</dt><dd>${u.role}</dd><dt>Phạm vi</dt><dd>${SF.esc(u.scope)}</dd><dt>Trạng thái</dt><dd>${u.active ? "Hoạt động" : "Đã khóa"}</dd></dl><div class="acts"><button class="btn pri" data-x>Đóng</button></div>`);
  }
  function perms(u) {
    const p = SF.modal(`<h3>Phân quyền tài khoản</h3><small class="muted">${SF.esc(u.name)} · ${u.role}</small>
    <div class="field"><label for="pr">Vai trò</label><select id="pr">${Object.keys(RC).map((r) => `<option${r === u.role ? " selected" : ""}>${r}</option>`).join("")}</select></div>
    <div class="field"><label for="ps">Phạm vi phụ trách</label><input id="ps" value="${SF.esc(u.scope)}" readonly></div>
    <fieldset class="card"><legend>Quyền chi tiết</legend>${PERMS.map((n, i) => `<label class="sw">${n}<input type="checkbox" id="p${i}"${u.perms[i] ? " checked" : ""}></label>`).join("")}<span class="hint">Chỉ Admin được cấp quyền quản lý người dùng.</span></fieldset>
    <p class="note">Thay đổi quyền được ghi vào nhật ký audit.</p><div class="acts"><button class="btn" data-x>Hủy</button><button class="btn pri" id="ok">Lưu phân quyền</button></div>`, true);
    const sync = () => { const a = p.querySelector("#pr").value === "Admin", c = p.querySelector("#p3"); c.disabled = !a; if (!a) c.checked = false; };
    p.querySelector("#pr").onchange = sync; sync();
    p.querySelector("#ok").onclick = () => {
      const r = p.querySelector("#pr").value;
      if (u.role === "Admin" && r !== "Admin" && admins().length < 2) return SF.toast("Cần ít nhất một quản trị viên đang hoạt động.");
      const snap = JSON.stringify(db); u.role = r; u.perms = PERMS.map((_, i) => +p.querySelector("#p" + i).checked);
      SF.log(db, `Đổi quyền ${u.name} → ${r}`); SF.save(db); SF.close(); draw(); SF.toast("Đã lưu phân quyền", undo(snap));
    };
  }
  function lock(ids) {
    const us = db.users.filter((u) => ids.includes(u.id));
    if (!us.length) return;
    if (us.some((u) => u.role === "Admin") && admins().every((a) => ids.includes(a.id))) return SF.toast("Không thể khóa quản trị viên đang hoạt động cuối cùng.");
    const p = SF.modal(`<h3>Khóa ${us.length > 1 ? us.length + " tài khoản" : SF.esc(us[0].name)}?</h3><p class="muted">Người dùng sẽ bị đăng xuất ngay và không thể đăng nhập cho đến khi được kích hoạt lại.</p><div class="field"><label for="rs">Lý do khóa</label><select id="rs"><option value="">Chọn lý do...</option>${REASONS.map((r) => `<option>${r}</option>`).join("")}</select><span class="err" id="er" role="alert"></span></div><div class="acts"><button class="btn" data-x>Hủy</button><button class="btn danger" id="ok">Xác nhận khóa</button></div>`);
    p.querySelector("#ok").onclick = () => {
      const r = p.querySelector("#rs").value; if (!r) { p.querySelector("#er").textContent = "Hãy chọn lý do khóa."; return p.querySelector("#rs").focus(); }
      const snap = JSON.stringify(db); us.forEach((u) => { u.active = false; SF.log(db, `Khóa ${u.name}: ${r}`); });
      SF.save(db); sel.clear(); SF.close(); draw(); SF.toast(`Đã khóa ${us.length} tài khoản`, undo(snap));
    };
  }
  main.onclick = (e) => {
    const b = e.target.closest("[data-v],[data-pm],[data-rp],[data-lk],[data-bulk],[data-clr],[data-p]"); if (!b) return;
    const d = b.dataset, u = db.users.find((x) => x.id === (d.v || d.pm || d.rp || d.lk));
    if (d.p) { page = +d.p; draw(); }
    else if (b.hasAttribute("data-clr")) { sel.clear(); draw(); }
    else if (b.hasAttribute("data-bulk")) lock([...sel]);
    else if (d.v) view(u);
    else if (d.pm) perms(u);
    else if (d.rp) { SF.log(db, `Cấp lại mật khẩu cho ${u.name}`); SF.save(db); SF.toast(`Đã gửi liên kết đặt lại mật khẩu tới ${u.contact}`); }
    else if (u.active) lock([u.id]);
    else { const snap = JSON.stringify(db); u.active = true; SF.log(db, `Kích hoạt ${u.name}`); SF.save(db); draw(); SF.toast(`Đã kích hoạt ${u.name}`, undo(snap)); }
  };
  main.onchange = (e) => {
    const t = e.target;
    if (t.id === "fr") { role = t.value; page = 0; draw(); }
    else if (t.dataset.c) { t.checked ? sel.add(t.dataset.c) : sel.delete(t.dataset.c); draw(); }
    else if ("all" in t.dataset) { list().slice(page * PER, page * PER + PER).forEach((u) => (t.checked ? sel.add(u.id) : sel.delete(u.id))); draw(); }
  };
  SF.onq = () => { page = 0; draw(); }; draw();
})();
