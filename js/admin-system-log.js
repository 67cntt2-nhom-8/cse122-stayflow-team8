(async () => {
  const main = SF.shell("admin", "log", "Quản trị / Nhật ký hệ thống", "Nhật ký hệ thống");
  const db = await SF.load(), PER = 8, kindOf = (a) => a.msg.split(" ")[0], when = (a) => new Date(a.at).toLocaleString("vi-VN");
  let page = 0, kind = "";
  const $ = (i) => document.getElementById(i), kinds = [...new Set(db.audit.map(kindOf))];
  main.innerHTML = `<div class="head"><div><span class="gold">Chỉ đọc</span><h1>Nhật ký hệ thống</h1><p class="muted">${db.audit.length} bản ghi · không thể sửa hoặc xóa để đảm bảo kiểm toán.</p></div><button class="btn" id="csv"${db.audit.length ? "" : " disabled"}>Xuất CSV</button></div>
  <div class="tools"><label>Loại thao tác <select id="fk"><option value="">Tất cả</option>${kinds.map((k) => `<option>${SF.esc(k)}</option>`).join("")}</select></label></div><div id="t" class="wrap"></div>`;
  const list = () => db.audit.filter((a) => (!kind || kindOf(a) === kind) && SF.match(a.msg + " " + a.by, SF.q));
  function draw() {
    const l = list(); page = Math.min(page, Math.max(0, Math.ceil(l.length / PER) - 1));
    $("t").innerHTML = `<table><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Loại</th><th>Nội dung</th></tr></thead><tbody>${l.slice(page * PER, page * PER + PER).map((a) => `<tr><td class="num">${when(a)}</td><td>${SF.esc(a.by)}</td><td><span class="chip info">${SF.esc(kindOf(a))}</span></td><td>${SF.esc(a.msg)}</td></tr>`).join("")}</tbody></table>${l.length ? "" : db.audit.length ? SF.empty() : '<div class="empty"><strong>Chưa có bản ghi nào</strong><p class="muted">Thao tác ở các trang Người dùng, Loại dịch vụ hoặc Điều phối sẽ được ghi tại đây.</p></div>'}${SF.pager(page, l.length, PER)}`;
  }
  main.onclick = (e) => {
    const b = e.target.closest("[data-p],#csv"); if (!b) return;
    if (b.id === "csv") {
      const q = (v) => `"${String(v).replace(/"/g, '""')}"`, a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["\ufeff" + ["Thời gian,Người thực hiện,Nội dung", ...list().map((x) => [when(x), x.by, x.msg].map(q).join(","))].join("\n")], { type: "text/csv" }));
      a.download = "nhat-ky-he-thong.csv"; a.click(); SF.toast("Đã xuất nhật ký");
    } else { page = +b.dataset.p; draw(); }
  };
  $("fk").onchange = (e) => { kind = e.target.value; page = 0; draw(); };
  SF.onq = () => { page = 0; draw(); }; draw();
})();
