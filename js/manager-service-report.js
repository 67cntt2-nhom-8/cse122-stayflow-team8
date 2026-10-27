(async () => {
  const main = SF.shell("manager", "report", "Quản lý / Báo cáo", "Báo cáo dịch vụ");
  const db = await SF.load();
  const rows = SF.rows(db);
  const active = rows.filter((request) => request.status !== "Đã hủy");
  const done = active.filter((request) => request.status === "Hoàn thành").length;
  const overdue = active.filter((request) => SF.state(request)[0] === "Quá hạn").length;
  const average = db.feedback.length
    ? (
      db.feedback.reduce((total, feedback) => total + feedback.rating, 0) /
      db.feedback.length
    ).toFixed(1)
    : "—";
  const byService = {};
  const byStatus = {};

  active.forEach((request) => {
    byService[request.svc] = (byService[request.svc] || 0) + 1;
  });
  rows.forEach((request) => {
    byStatus[request.status] = (byStatus[request.status] || 0) + 1;
  });
  const max = Math.max(1, ...Object.values(byService));
  const max = Math.max(1, ...Object.values(byService));
  const CL = {
    "Hoàn thành": "ok",
    "Đang thực hiện": "info",
    "Chờ xử lý": "warn",
    "Đã hủy": "",
  };

  function draw() {
    const feedback = db.feedback.filter((item) =>
      SF.match(item.comment + (item.ai_summary || ""), SF.q),
    );

    main.innerHTML = `<div class="head"><div><span class="gold">Tổng hợp từ dữ liệu mẫu</span><h1>Báo cáo dịch vụ</h1><p class="muted">Hiệu suất xử lý yêu cầu và phản hồi của khách.</p></div><button class="btn" id="csv">Xuất báo cáo (CSV)</button></div>
    <div class="kpis">${[
        ["Tổng yêu cầu", active.length, "Không tính yêu cầu đã hủy"],
        [
          "Tỷ lệ hoàn thành",
          (active.length ? Math.round((done / active.length) * 100) : 0) + "%",
          `${done}/${active.length} yêu cầu`,
        ],
        ["Đánh giá trung bình", average + " / 5", `${db.feedback.length} phản hồi`],
        ["Quá hạn SLA", overdue, overdue ? "Cần rà soát" : "Không có"],
      ].map(([name, value, hint]) => `<div class="card kpi"><span>${name}</span><b>${value}</b><small class="muted">${hint}</small></div>`).join("")}</div>
    ${db.feedbackSummary ? `<section class="card"><h3>Tóm tắt phản hồi</h3><p>${SF.esc(db.feedbackSummary)}</p></section>` : ""}
    <div class="cols" style="grid-template-columns:1fr 1fr"><section class="card"><h3>Yêu cầu theo dịch vụ</h3>${Object.entries(byService).sort((a, b) => b[1] - a[1]).map(([name, count]) => `<div style="margin-bottom:10px"><div class="between" style="display:flex;justify-content:space-between"><span>${SF.esc(name)}</span><strong>${count}</strong></div><div class="meter"><i style="width:${(count / max) * 100}%"></i></div></div>`).join("") || SF.empty()}</section>
    <section class="card"><h3>Theo trạng thái</h3><p>${Object.entries(byStatus).map(([status, count]) => `<span class="chip ${CL[status] || ""}" style="margin:0 6px 8px 0">${status}: ${count}</span>`).join("")}</p></section></div>
    <section class="card"><h3>Phản hồi của khách</h3>${feedback.map((item) => `<div style="padding:10px 0;border-top:1px solid var(--line)"><strong aria-label="${item.rating} trên 5 sao">${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</strong> <small class="muted">${item.createdAt.slice(0, 10)}</small><p style="margin:4px 0">${SF.esc(item.comment)}</p>${item.ai_summary ? `<small class="muted">${SF.esc(item.ai_summary)}</small>` : ""}</div>`).join("") || SF.empty()}</section>`;

    document.getElementById("csv").onclick = () => {
      const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob(
          [
            "\ufeff" + [
              "Dịch vụ,Số yêu cầu",
              ...Object.entries(byService).map(([name, count]) =>
                [name, count].map(quote).join(","),
              ),
            ].join("\n"),
          ],
          { type: "text/csv" },
        ),
      );
      link.download = "bao-cao-dich-vu.csv";
      link.click();
      SF.toast("Đã xuất báo cáo");
    };
  }

  SF.onq = draw;
  draw();
})();
