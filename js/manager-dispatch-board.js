(async () => {
  const main = SF.shell("manager", "dispatch", "Vận hành / Điều phối trực tiếp", "Bảng điều phối");
  let db = await SF.load(), sel, pick, hide = false;
  const PR = { Cao: ["bad", 0], "Trung bình": ["warn", 1], Thấp: ["info", 2] }, CAP = 4;
  const queue = () => SF.rows(db).filter((r) => r.status === "Chờ xử lý" && SF.match(r.id + r.room + r.guest + r.svc, SF.q)).sort((a, b) => PR[a.priority][1] - PR[b.priority][1] || a.due - b.due);
  const load = (s) => db.tasks.filter((t) => t.staffId === s.id && ["Chờ nhận", "Đang làm"].includes(t.status)).length;
  const best = (r) => { const sc = (s) => (s.role === r.dept ? 0 : 9) + load(s); return db.staff.filter((s) => s.status === "Đang trực").sort((a, b) => sc(a) - sc(b))[0]; };
  const level = (n) => (n >= CAP ? ["Quá tải", "bad-f"] : n >= CAP * 0.5 ? ["Gần đầy", "warn-f"] : ["Khả dụng", ""]);

  function assign(r, s) {
    const t = r.task;
    if (t) t.staffId = s.id;
    else db.tasks.push({ id: "TSK" + String(db.tasks.length + 1).padStart(3, "0"), requestId: r.id, staffId: s.id, status: "Chờ nhận", priority: r.priority, ai_priority_reason: r.ai_priority_reason, assignedAt: new Date(SF.now()).toISOString().slice(0, 19), completedAt: null });
    db.requests.find((x) => x.id === r.id).status = "Đang thực hiện";
    SF.log(db, `Phân công ${r.id} cho ${s.name}`);
  }
  function run(list, msg) { // phân công + cho phép hoàn tác
    const snap = JSON.stringify(db);
    list.forEach(([r, s]) => assign(r, s)); SF.save(db); draw();
    SF.toast(msg, () => { db = JSON.parse(snap); SF.save(db); draw(); });
  }

  function draw() {
    const rows = queue(), all = SF.rows(db), r = rows.find((x) => x.id === sel) || rows[0]; sel = r?.id;
    const duty = db.staff.filter((s) => s.status === "Đang trực"), over = all.filter((x) => SF.state(x)[0] === "Quá hạn").length;
    const target = r && (db.staff.find((s) => s.id === pick) || best(r)), sug = rows.slice(0, 3);
    main.innerHTML = `<div class="head"><div><span class="gold">Điều phối dịch vụ · dữ liệu mẫu</span><h1>Bảng điều phối</h1><p class="muted">Chọn yêu cầu, xem nhân viên phù hợp rồi phân công. Mọi thao tác đều hoàn tác được.</p></div><a class="btn" href="manager-sla-monitor.html">Theo dõi SLA</a></div>
    <div class="kpis"><div class="card kpi"><span>Yêu cầu chờ</span><b>${String(rows.length).padStart(2, "0")}</b><small class="muted">Sắp theo ưu tiên, rồi hạn SLA</small></div><div class="card kpi"><span>Quá hạn</span><b>${String(over).padStart(2, "0")}</b><small style="color:var(--red)">${over ? "Cần xử lý ngay" : "Không có"}</small></div><div class="card kpi"><span>Nhân viên khả dụng</span><b>${duty.length}/${db.staff.length}</b><small class="muted">Đang trực ca</small></div></div>
    <div class="cols"><section class="card" aria-label="Hàng đợi"><h3>Hàng đợi</h3>${rows.length ? rows.map((x) => `<button class="row" data-q="${x.id}" aria-pressed="${x.id === sel}"><span class="between"><strong>${x.id}</strong><span class="chip ${PR[x.priority][0]}">${x.priority}</span></span><div>${SF.esc(x.svc)} · Phòng ${x.room}</div><small class="muted">Còn ${SF.fmt(SF.left(x))} · ${SF.esc(x.guest)}</small></button>`).join("") : SF.empty()}</section>
    <section class="card" aria-label="Tải nhân viên"><h3>Tải nhân viên</h3>${db.staff.map((s) => { const n = load(s), [lb, cl] = level(n), off = s.status !== "Đang trực"; return `<button class="row st" data-s="${s.id}" aria-pressed="${target?.id === s.id}"${off ? " disabled" : ""}><span class="between"><strong>${SF.esc(s.name)}</strong><span>${off ? "Nghỉ" : n + "/" + CAP}</span></span><small class="muted">${s.role} · ${s.shift} · ${off ? "Không khả dụng" : lb}</small><div class="meter"><i class="${cl}" style="width:${Math.min(100, (n / CAP) * 100)}%"></i></div></button>`; }).join("")}</section>
    <section class="card" aria-label="Chi tiết yêu cầu">${r ? `<span class="chip ${PR[r.priority][0]}">Ưu tiên ${r.priority}</span><h3>${SF.esc(r.svc)}</h3><p class="muted">${SF.esc(r.content)}</p><dl><dt>Mã</dt><dd>${r.id}</dd><dt>Phòng</dt><dd>${r.room}</dd><dt>Khách</dt><dd>${SF.esc(r.guest)}</dd><dt>SLA còn</dt><dd>${SF.fmt(SF.left(r))}</dd></dl><p class="hint">${SF.esc(r.ai_priority_reason)}</p>${target ? `<div class="best"><small>${pick ? "ĐÃ CHỌN" : "PHÙ HỢP NHẤT"}</small><br><strong>${SF.esc(target.name)}</strong> · ${target.role}</div><button class="btn pri" data-go style="width:100%">Phân công ${SF.esc(target.name.split(" ").pop())}</button>` : '<p class="note">Chưa có nhân viên đang trực.</p>'}` : '<p class="empty muted">Không còn yêu cầu chờ xử lý 🎉</p>'}</section></div>
    ${sug.length && !hide ? `<section class="card ai" aria-label="Gợi ý AI"><h3>AI Priority Assistant</h3><div class="sug">${sug.map((x, i) => `<div><strong>${i + 1}. ${x.id} → ${SF.esc((best(x) || {}).name || "—")}</strong><br><small class="muted">${SF.esc(x.ai_priority_reason)}</small></div>`).join("")}</div><div class="acts"><small class="muted">Gợi ý chưa tự động áp dụng</small><button class="btn" data-no>Từ chối</button><button class="btn pri" data-all>Chấp nhận tất cả</button></div></section>` : ""}`;
  }

  main.onclick = (e) => {
    const b = e.target.closest("[data-q],[data-s],[data-go],[data-all],[data-no]"); if (!b) return;
    const r = queue().find((x) => x.id === sel), d = b.dataset;
    if (d.q) { sel = d.q; pick = 0; draw(); }
    else if (d.s) { pick = pick === d.s ? 0 : d.s; draw(); }
    else if (b.hasAttribute("data-go")) { const s = db.staff.find((x) => x.id === pick) || best(r); run([[r, s]], `Đã phân công ${s.name} cho ${r.id}`); pick = 0; }
    else if (b.hasAttribute("data-all")) { const list = queue().slice(0, 3).map((x) => [x, best(x)]).filter((p) => p[1]); run(list, `Đã chấp nhận ${list.length} gợi ý của AI`); }
    else { hide = true; draw(); SF.toast("Đã bỏ qua gợi ý AI"); }
  };
  SF.onq = draw; draw();
})();
