(async () => {
  const main = SF.shell("manager", "sla", "Quản lý / Theo dõi SLA", "Theo dõi SLA");
  let db = await SF.load(), sv = "", st = "", cool = {};
  const HOURS = [91, 93, 90, 94, 95, 92, 95, 94, 96, 95], TARGET = 92, S = (r) => SF.state(r)[0];
  main.innerHTML = `<div class="head"><div><span class="gold">Cập nhật trực tiếp</span><h1>Sức khỏe SLA hôm nay</h1><p class="muted">Mục tiêu toàn khách sạn: ≥ ${TARGET}% yêu cầu trong SLA.</p></div><div class="tools"><button class="btn" id="csv">Xuất báo cáo (CSV)</button><a class="btn pri" href="manager-dispatch-board.html">Điều phối lại</a></div></div>
  <div id="k" class="kpis"></div><section class="card" id="c" aria-label="Xu hướng SLA theo giờ"></section>
  <div class="tools"><label>Dịch vụ <select id="fs"><option value="">Tất cả</option>${db.serviceTypes.map((s) => `<option value="${s.id}">${SF.esc(s.categoryName)}</option>`).join("")}</select></label><label>Trạng thái <select id="ft"><option value="">Tất cả</option><option>Quá hạn</option><option>Sắp hạn</option><option>Trong hạn</option><option>Đã đóng</option></select></label></div><div id="t" class="wrap"></div>`;
  const list = () => SF.rows(db).filter((r) => (!sv || r.serviceTypeId === sv) && (!st || S(r) === st) && SF.match(r.id + r.room + r.svc + (r.staff?.name || ""), SF.q))
    .sort((a, b) => (S(a) === "Đã đóng") - (S(b) === "Đã đóng") || a.due - b.due);

  function draw() {
    const all = SF.rows(db).filter((r) => r.status !== "Đã hủy"), over = all.filter((r) => S(r) === "Quá hạn").length, soon = all.filter((r) => S(r) === "Sắp hạn").length;
    const pct = all.length ? Math.round(((all.length - over) / all.length) * 1000) / 10 : 100;
    const rs = db.tasks.map((t) => { const r = db.requests.find((x) => x.id === t.requestId); return r && (new Date(t.assignedAt) - new Date(r.createdAt)) / 1000; }).filter((x) => x >= 0);
    const avg = rs.length ? Math.round(rs.reduce((a, b) => a + b) / rs.length) : 0;
    document.getElementById("k").innerHTML = [["SLA đạt", pct + "%", pct >= TARGET ? "ok" : "bad", pct >= TARGET ? "Đạt mục tiêu" : "Dưới mục tiêu " + TARGET + "%"], ["Phản hồi trung bình", `${Math.floor(avg / 60)}m ${String(avg % 60).padStart(2, "0")}s`, "info", "Mục tiêu dưới 5 phút"], ["Sắp hạn", String(soon).padStart(2, "0"), "warn", "Trong 20 phút tới"], ["Quá hạn", String(over).padStart(2, "0"), "bad", over ? "Cần xử lý ngay" : "Không có"]]
      .map(([n, v, c, h]) => `<div class="card kpi"><span>${n}</span><b>${v}</b><small><span class="chip ${c}">${h}</span></small></div>`).join("");
    document.getElementById("c").innerHTML = `<h3>Xu hướng SLA theo giờ</h3><p class="muted">Tỷ lệ hoàn thành trong SLA (dữ liệu minh họa). Thanh đỏ: dưới mục tiêu ${TARGET}%.</p><div class="chart" role="img" aria-label="Biểu đồ SLA theo giờ, từ 8:00 đến 17:00">${HOURS.map((v, i) => `<div><small>${v}%</small><i class="${v < TARGET ? "low" : ""}" style="height:${(v - 80) * 4}%"></i>${8 + i}:00</div>`).join("")}</div>`;
    const l = list();
    document.getElementById("t").innerHTML = `<table><thead><tr><th>Mã</th><th>Dịch vụ</th><th>Phòng</th><th>Nhân viên</th><th>Thời gian còn lại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${l.map((r) => { const [lb, c] = SF.state(r), closed = lb === "Đã đóng";
      return `<tr class="${lb === "Quá hạn" ? "bad-r" : lb === "Sắp hạn" ? "warn-r" : ""}"><td><strong>${r.id}</strong></td><td>${SF.esc(r.svc)}</td><td>${r.room}</td><td>${r.staff ? SF.esc(r.staff.name) : "Chưa phân công"}</td><td class="num"${closed ? "" : ` data-due="${r.due}"`}>${closed ? "—" : SF.fmt(SF.left(r))}</td><td><span class="chip ${c}">${lb}</span></td><td>${closed ? "" : `${r.staff ? `<button class="btn sm" data-n="${r.id}"${cool[r.id] ? " disabled" : ""}>${cool[r.id] ? "Đã nhắc" : "Nhắc nhân viên"}</button> ` : ""}<button class="btn sm" data-r="${r.id}">${r.staff ? "Điều phối lại" : "Phân công"}</button>`}</td></tr>`; }).join("")}</tbody></table>${l.length ? "" : SF.empty()}`;
  }
  function pickStaff(r) {
    const p = SF.modal(`<h3>${r.staff ? "Điều phối lại" : "Phân công"} ${r.id}</h3><p class="muted">${SF.esc(r.svc)} · Phòng ${r.room}</p><div class="field"><label for="ns">Nhân viên đang trực</label><select id="ns">${db.staff.filter((s) => s.status === "Đang trực").map((s) => `<option value="${s.id}"${r.staff?.id === s.id ? " selected" : ""}>${SF.esc(s.name)} · ${s.role}</option>`).join("")}</select></div><div class="acts"><button class="btn" data-x>Hủy</button><button class="btn pri" id="ok">Xác nhận</button></div>`);
    p.querySelector("#ok").onclick = () => {
      const s = db.staff.find((x) => x.id === p.querySelector("#ns").value), snap = JSON.stringify(db);
      if (r.task) r.task.staffId = s.id; else db.tasks.push({ id: "TSK" + String(db.tasks.length + 1).padStart(3, "0"), requestId: r.id, staffId: s.id, status: "Chờ nhận", priority: r.priority, ai_priority_reason: r.ai_priority_reason, assignedAt: new Date(SF.now()).toISOString().slice(0, 19), completedAt: null });
      SF.log(db, `Điều phối ${r.id} cho ${s.name}`); SF.save(db); SF.close(); draw();
      SF.toast(`Đã giao ${r.id} cho ${s.name}`, () => { db = JSON.parse(snap); SF.save(db); draw(); });
    };
  }
  main.onclick = (e) => {
    const b = e.target.closest("[data-n],[data-r],#csv"); if (!b) return;
    if (b.id === "csv") {
      const q = (v) => `"${String(v).replace(/"/g, '""')}"`, rows = list().map((r) => [r.id, r.svc, r.room, r.staff?.name || "Chưa phân công", S(r) === "Đã đóng" ? "" : SF.fmt(SF.left(r)), S(r)].map(q).join(","));
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + ["Mã,Dịch vụ,Phòng,Nhân viên,Còn lại,Trạng thái", ...rows].join("\n")], { type: "text/csv" })); a.download = "sla-hom-nay.csv"; a.click(); SF.toast(`Đã xuất ${rows.length} dòng`);
    } else if (b.dataset.n) { const r = list().find((x) => x.id === b.dataset.n); cool[r.id] = 1; setTimeout(() => { delete cool[r.id]; draw(); }, 30000); SF.log(db, `Nhắc ${r.staff.name} xử lý ${r.id}`); SF.save(db); draw(); SF.toast(`Đã nhắc ${r.staff.name} xử lý ${r.id}`); }
    else pickStaff(list().find((x) => x.id === b.dataset.r));
  };
  document.getElementById("fs").onchange = (e) => { sv = e.target.value; draw(); };
  document.getElementById("ft").onchange = (e) => { st = e.target.value; draw(); };
  setInterval(() => document.querySelectorAll("[data-due]").forEach((c) => (c.textContent = SF.fmt(Math.round((+c.dataset.due - SF.now()) / 1000)))), 1000);
  SF.onq = draw; draw();
})();
