(async () => {
  const main = SF.shell("manager", "report", "Quản lý / Báo cáo", "Báo cáo dịch vụ");
  const db = await SF.load(), rows = SF.rows(db), act = rows.filter((r) => r.status !== "Đã hủy");
  const done = act.filter((r) => r.status === "Hoàn thành").length, over = act.filter((r) => SF.state(r)[0] === "Quá hạn").length;
  const avg = db.feedback.length ? (db.feedback.reduce((a, f) => a + f.rating, 0) / db.feedback.length).toFixed(1) : "—";
  const by = {}, st = {}; act.forEach((r) => (by[r.svc] = (by[r.svc] || 0) + 1)); rows.forEach((r) => (st[r.status] = (st[r.status] || 0) + 1));
  const max = Math.max(1, ...Object.values(by)), CL = { "Hoàn thành": "ok", "Đang thực hiện": "info", "Chờ xử lý": "warn", "Đã hủy": "" };

  function draw() {
    const fb = db.feedback.filter((f) => SF.match(f.comment + (f.ai_summary || ""), SF.q));
    main.innerHTML = `<div class="head"><div><span class="gold">Tổng hợp từ dữ liệu mẫu</span><h1>Báo cáo dịch vụ</h1><p class="muted">Hiệu suất xử lý yêu cầu và phản hồi của khách.</p></div><button class="btn" id="csv">Xuất báo cáo (CSV)</button></div>
    <div class="kpis">${[["Tổng yêu cầu", act.length, "Không tính yêu cầu đã hủy"], ["Tỷ lệ hoàn thành", (act.length ? Math.round((done / act.length) * 100) : 0) + "%", `${done}/${act.length} yêu cầu`], ["Đánh giá trung bình", avg + " / 5", `${db.feedback.length} phản hồi`], ["Quá hạn SLA", over, over ? "Cần rà soát" : "Không có"]].map(([n, v, h]) => `<div class="card kpi"><span>${n}</span><b>${v}</b><small class="muted">${h}</small></div>`).join("")}</div>
    ${db.feedbackSummary ? `<section class="card"><h3>Tóm tắt phản hồi</h3><p>${SF.esc(db.feedbackSummary)}</p></section>` : ""}
    <div class="cols" style="grid-template-columns:1fr 1fr"><section class="card"><h3>Yêu cầu theo dịch vụ</h3>${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div style="margin-bottom:10px"><div class="between" style="display:flex;justify-content:space-between"><span>${SF.esc(k)}</span><strong>${n}</strong></div><div class="meter"><i style="width:${(n / max) * 100}%"></i></div></div>`).join("") || SF.empty()}</section>
    <section class="card"><h3>Theo trạng thái</h3><p>${Object.entries(st).map(([k, n]) => `<span class="chip ${CL[k] || ""}" style="margin:0 6px 8px 0">${k}: ${n}</span>`).join("")}</p></section></div>
    <section class="card"><h3>Phản hồi của khách</h3>${fb.map((f) => `<div style="padding:10px 0;border-top:1px solid var(--line)"><strong aria-label="${f.rating} trên 5 sao">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</strong> <small class="muted">${f.createdAt.slice(0, 10)}</small><p style="margin:4px 0">${SF.esc(f.comment)}</p>${f.ai_summary ? `<small class="muted">${SF.esc(f.ai_summary)}</small>` : ""}</div>`).join("") || SF.empty()}</section>`;
    document.getElementById("csv").onclick = () => {
      const q = (v) => `"${String(v).replace(/"/g, '""')}"`, a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["\ufeff" + ["Dịch vụ,Số yêu cầu", ...Object.entries(by).map(([k, n]) => [k, n].map(q).join(","))].join("\n")], { type: "text/csv" }));
      a.download = "bao-cao-dich-vu.csv"; a.click(); SF.toast("Đã xuất báo cáo");
    };
  }
  SF.onq = draw; draw();
})();