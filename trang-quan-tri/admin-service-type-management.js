(async () => {
  const main = SF.shell("admin", "svc", "Quản trị / Loại dịch vụ", "Loại dịch vụ");
  let db = await SF.load(), page = 0;
  const PER = 5, PRI = ["Thấp", "Trung bình", "Cao"], act = (s) => s.active !== false, depts = () => [...new Set(db.serviceTypes.map((s) => s.department))];
  const undo = (snap) => () => { db = JSON.parse(snap); SF.save(db); draw(); };

  function draw() {
    const l = db.serviceTypes.filter((s) => SF.match(`${s.categoryName} ${s.description} ${s.department}`, SF.q));
    page = Math.min(page, Math.max(0, Math.ceil(l.length / PER) - 1));
    main.innerHTML = `<div class="head"><div><span class="gold">Quản trị dịch vụ</span><h1>Quản lý loại dịch vụ</h1><p class="muted">${db.serviceTypes.length} loại dịch vụ · ${db.serviceTypes.filter(act).length} đang kích hoạt · SLA được áp dụng khi tạo yêu cầu.</p></div><button class="btn pri" data-new>+ Thêm loại dịch vụ</button></div>
    <div class="wrap"><table><thead><tr><th>Tên dịch vụ</th><th>Nhóm</th><th>SLA chuẩn</th><th>Ưu tiên mặc định</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${l.slice(page * PER, page * PER + PER).map((s) => `<tr><td><strong>${SF.esc(s.categoryName)}</strong><br><small class="muted">${SF.esc(s.description)}</small></td><td>${SF.esc(s.department)}</td><td class="num">${s.expectedSLA} phút</td><td>${s.priority || "Trung bình"}</td><td><span class="chip ${act(s) ? "ok" : "info"}">${act(s) ? "Đang hoạt động" : "Đã lưu trữ"}</span></td><td><button class="btn sm" data-e="${s.id}">Chỉnh sửa</button> <button class="btn sm" data-a="${s.id}">${act(s) ? "Lưu trữ" : "Kích hoạt lại"}</button></td></tr>`).join("")}</tbody></table>${l.length ? "" : SF.empty()}${SF.pager(page, l.length, PER)}</div>`;
  }
  function form(s0) {
    const isNew = !s0, s = s0 || { categoryName: "", description: "", department: depts()[0] || "", expectedSLA: 30, priority: "Trung bình" };
    const p = SF.modal(`<h3>${isNew ? "Thêm" : "Chỉnh sửa"} loại dịch vụ</h3>${isNew ? "" : `<small class="muted">ID: ${s.id}</small>`}
    <div class="field"><label for="f-n">Tên dịch vụ</label><input id="f-n" value="${SF.esc(s.categoryName)}" aria-describedby="e-n"><span class="err" id="e-n" role="alert"></span></div>
    <div class="field"><label for="f-d">Mô tả</label><textarea id="f-d" rows="3" maxlength="200">${SF.esc(s.description)}</textarea></div>
    <div class="field"><label for="f-g">Nhóm</label><input id="f-g" list="dl" value="${SF.esc(s.department)}"><datalist id="dl">${depts().map((d) => `<option value="${SF.esc(d)}">`).join("")}</datalist></div>
    <div class="field"><label for="f-s">SLA chuẩn (phút)</label><input id="f-s" type="number" min="5" max="480" value="${s.expectedSLA}" aria-describedby="e-s"><span class="err" id="e-s" role="alert"></span><span class="hint">Từ 5 đến 480 phút.</span></div>
    <div class="field"><label for="f-p">Ưu tiên mặc định</label><select id="f-p">${PRI.map((x) => `<option${x === (s.priority || "Trung bình") ? " selected" : ""}>${x}</option>`).join("")}</select></div>
    <div class="acts"><button class="btn" data-x>Hủy</button><button class="btn pri" id="ok">Lưu thay đổi</button></div>`, true);
    const v = (id) => p.querySelector(id);
    v("#ok").onclick = () => {
      const name = v("#f-n").value.trim(), sla = +v("#f-s").value, dept = v("#f-g").value.trim();
      const en = name.length < 3 ? "Tên dịch vụ cần ít nhất 3 ký tự." : db.serviceTypes.some((x) => x !== s && SF.norm(x.categoryName) === SF.norm(name)) ? "Tên này đã tồn tại." : "";
      const es = sla >= 5 && sla <= 480 ? "" : "SLA phải từ 5 đến 480 phút.";
      v("#e-n").textContent = en; v("#e-s").textContent = es; v("#f-n").setAttribute("aria-invalid", !!en); v("#f-s").setAttribute("aria-invalid", !!es);
      if (en || es) return (en ? v("#f-n") : v("#f-s")).focus();
      const snap = JSON.stringify(db);
      Object.assign(s, { categoryName: name, description: v("#f-d").value.trim(), department: dept || "Chung", expectedSLA: sla, priority: v("#f-p").value });
      if (isNew) { s.id = "ST" + String(db.serviceTypes.length + 1).padStart(3, "0"); s.active = true; db.serviceTypes.push(s); }
      SF.log(db, `${isNew ? "Thêm" : "Sửa"} loại dịch vụ ${name}`); SF.save(db); SF.close(); draw(); SF.toast(isNew ? "Đã thêm loại dịch vụ" : "Đã lưu thay đổi", undo(snap));
    };
  }
  function archive(s) {
    const p = SF.modal(`<h3>Lưu trữ loại dịch vụ?</h3><p class="muted"><strong>${SF.esc(s.categoryName)}</strong> sẽ không xuất hiện khi tạo yêu cầu mới. Dữ liệu lịch sử vẫn được giữ nguyên.</p><div class="acts"><button class="btn" data-x>Hủy</button><button class="btn danger" id="ok">Xác nhận lưu trữ</button></div>`);
    p.querySelector("#ok").onclick = () => { const snap = JSON.stringify(db); s.active = false; SF.log(db, `Lưu trữ ${s.categoryName}`); SF.save(db); SF.close(); draw(); SF.toast("Đã lưu trữ loại dịch vụ", undo(snap)); };
  }
  main.onclick = (e) => {
    const b = e.target.closest("[data-new],[data-e],[data-a],[data-p]"); if (!b) return; const d = b.dataset, find = (id) => db.serviceTypes.find((x) => x.id === id);
    if (d.p) { page = +d.p; draw(); }
    else if (b.hasAttribute("data-new")) form();
    else if (d.e) form(find(d.e));
    else { const s = find(d.a); if (act(s)) archive(s); else { const snap = JSON.stringify(db); s.active = true; SF.save(db); draw(); SF.toast("Đã kích hoạt lại", undo(snap)); } }
  };
  SF.onq = () => { page = 0; draw(); }; draw();
})();
