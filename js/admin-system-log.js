(async () => {
  const main = SF.shell("admin", "log", "Quản trị / Nhật ký hệ thống", "Nhật ký hệ thống");
  const db = await SF.load();
  const PER = 8;
  const kindOf = (entry) => entry.msg.split(" ")[0];
  const when = (entry) => new Date(entry.at).toLocaleString("vi-VN");

  let page = 0;
  let kind = "";

  // Các tiện ích định dạng log và danh sách loại thao tác phục vụ bộ lọc.
  const $ = (id) => document.getElementById(id);
  const kinds = [...new Set(db.audit.map(kindOf))];

  // Nhật ký chỉ đọc: dựng bộ lọc và vùng bảng, không cung cấp thao tác sửa/xóa.
  main.innerHTML = `<div class="head"><div><span class="gold">Chỉ đọc</span><h1>Nhật ký hệ thống</h1><p class="muted">${db.audit.length} bản ghi · không thể sửa hoặc xóa để đảm bảo kiểm toán.</p></div><button class="btn" id="csv"${db.audit.length ? "" : " disabled"}>Xuất CSV</button></div>
  <div class="tools"><label>Loại thao tác <select id="fk"><option value="">Tất cả</option>${kinds.map((item) => `<option>${SF.esc(item)}</option>`).join("")}</select></label></div><div id="t" class="wrap"></div>`;

  const list = () => db.audit.filter((entry) =>
    (!kind || kindOf(entry) === kind) && SF.match(entry.msg + " " + entry.by, SF.q),
  );

  // Vẽ trang hiện tại từ kết quả lọc và giữ chỉ số trang trong giới hạn.
  function draw() {
    const entries = list();
    page = Math.min(page, Math.max(0, Math.ceil(entries.length / PER) - 1));

    $("t").innerHTML = `<table><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Loại</th><th>Nội dung</th></tr></thead><tbody>${entries.slice(page * PER, page * PER + PER).map((entry) => `<tr><td class="num">${when(entry)}</td><td>${SF.esc(entry.by)}</td><td><span class="chip info">${SF.esc(kindOf(entry))}</span></td><td>${SF.esc(entry.msg)}</td></tr>`).join("")}</tbody></table>${entries.length ? "" : db.audit.length ? SF.empty() : '<div class="empty"><strong>Chưa có bản ghi nào</strong><p class="muted">Thao tác ở các trang Người dùng, Loại dịch vụ hoặc Điều phối sẽ được ghi tại đây.</p></div>'}${SF.pager(page, entries.length, PER)}`;
  }

  // Xử lý xuất CSV hoặc chuyển trang; dữ liệu CSV khớp với bộ lọc hiện tại.
  main.onclick = (e) => {
    const button = e.target.closest("[data-p],#csv");
    if (!button) return;

    if (button.id === "csv") {
      const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
      const link = document.createElement("a");

      link.href = URL.createObjectURL(
        new Blob(
          [
            "\ufeff" + [
              "Thời gian,Người thực hiện,Nội dung",
              ...list().map((entry) =>
                [when(entry), entry.by, entry.msg].map(quote).join(","),
              ),
            ].join("\n"),
          ],
          { type: "text/csv" },
        ),
      );
      link.download = "nhat-ky-he-thong.csv";
      link.click();
      SF.toast("Đã xuất nhật ký");
    } else {
      page = +button.dataset.p;
      draw();
    }
  };

  // Mỗi thay đổi bộ lọc/tìm kiếm đưa người dùng về trang đầu để tránh trang rỗng.
  $("fk").onchange = (e) => {
    kind = e.target.value;
    page = 0;
    draw();
  };

  SF.onq = () => {
    page = 0;
    draw();
  };
  draw();
})();
