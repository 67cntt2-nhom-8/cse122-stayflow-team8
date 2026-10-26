(async () => {
  const main = SF.shell("manager", "sla", "Quản lý / Theo dõi SLA", "Theo dõi SLA");
  let db = await SF.load();
  let sv = "";
  let st = "";
  let cool = {};

  const HOURS = [91, 93, 90, 94, 95, 92, 95, 94, 96, 95];
  const TARGET = SF.cfg().target;
  const S = (request) => SF.state(request)[0];

  main.innerHTML = `<div class="head"><div><span class="gold">Cập nhật trực tiếp</span><h1>Sức khỏe SLA hôm nay</h1><p class="muted">Mục tiêu toàn khách sạn: ≥ ${TARGET}% yêu cầu trong SLA.</p></div><div class="tools"><button class="btn" id="csv">Xuất báo cáo (CSV)</button><a class="btn pri" href="manager-dispatch-board.html">Điều phối lại</a></div></div>
  <div id="k" class="kpis"></div><section class="card" id="c" aria-label="Xu hướng SLA theo giờ"></section>
  <div class="tools"><label>Dịch vụ <select id="fs"><option value="">Tất cả</option>${db.serviceTypes.map((service) => `<option value="${service.id}">${SF.esc(service.categoryName)}</option>`).join("")}</select></label><label>Trạng thái <select id="ft"><option value="">Tất cả</option><option>Quá hạn</option><option>Sắp hạn</option><option>Trong hạn</option><option>Đã đóng</option></select></label></div><div id="t" class="wrap"></div>`;

  const list = () => SF.rows(db)
    .filter((request) =>
      (!sv || request.serviceTypeId === sv) &&
      (!st || S(request) === st) &&
      SF.match(
        request.id + request.room + request.svc + (request.staff?.name || ""),
        SF.q,
      ),
    )
    .sort(
      (a, b) =>
        (S(a) === "Đã đóng") - (S(b) === "Đã đóng") ||
        a.due - b.due,
    );

  function draw() {
    const all = SF.rows(db).filter((request) => request.status !== "Đã hủy");
    const over = all.filter((request) => S(request) === "Quá hạn").length;
    const soon = all.filter((request) => S(request) === "Sắp hạn").length;
    const percent = all.length
      ? Math.round(((all.length - over) / all.length) * 1000) / 10
      : 100;
    const responseTimes = db.tasks
      .map((task) => {
        const request = db.requests.find((item) => item.id === task.requestId);
        return request && (new Date(task.assignedAt) - new Date(request.createdAt)) / 1000;
      })
      .filter((time) => time >= 0);
    const average = responseTimes.length
      ? Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length)
      : 0;

    document.getElementById("k").innerHTML = [
      [
        "SLA đạt",
        percent + "%",
        percent >= TARGET ? "ok" : "bad",
        percent >= TARGET ? "Đạt mục tiêu" : "Dưới mục tiêu " + TARGET + "%",
      ],
      [
        "Phản hồi trung bình",
        `${Math.floor(average / 60)}m ${String(average % 60).padStart(2, "0")}s`,
        "info",
        "Mục tiêu dưới 5 phút",
      ],
      ["Sắp hạn", String(soon).padStart(2, "0"), "warn", `Trong ${SF.cfg().warn} phút tới`],
      ["Quá hạn", String(over).padStart(2, "0"), "bad", over ? "Cần xử lý ngay" : "Không có"],
    ]
      .map(([name, value, className, hint]) =>
        `<div class="card kpi"><span>${name}</span><b>${value}</b><small><span class="chip ${className}">${hint}</span></small></div>`,
      )
      .join("");

    document.getElementById("c").innerHTML = `<h3>Xu hướng SLA theo giờ</h3><p class="muted">Tỷ lệ hoàn thành trong SLA (dữ liệu minh họa). Thanh đỏ: dưới mục tiêu ${TARGET}%.</p><div class="chart" role="img" aria-label="Biểu đồ SLA theo giờ, từ 8:00 đến 17:00">${HOURS.map((value, index) => `<div><small>${value}%</small><i class="${value < TARGET ? "low" : ""}" style="height:${(value - 80) * 4}%"></i>${8 + index}:00</div>`).join("")}</div>`;

    const rows = list();
    document.getElementById("t").innerHTML = `<table><thead><tr><th>Id</th><th>Dịch vụ</th><th>Phòng</th><th>Nhân viên</th><th>Thời gian còn lại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${rows.map((request) => {
      const [label, className] = SF.state(request);
      const closed = label === "Đã đóng";

      return `<tr class="${label === "Quá hạn" ? "bad-r" : label === "Sắp hạn" ? "warn-r" : ""}"><td><strong>${request.id}</strong></td><td>${SF.esc(request.svc)}</td><td>${request.room}</td><td>${request.staff ? SF.esc(request.staff.name) : "Chưa phân công"}</td><td class="num"${closed ? "" : ` data-due="${request.due}"`}>${closed ? "—" : SF.fmt(SF.left(request))}</td><td><span class="chip ${className}">${label}</span></td><td>${closed ? "" : `${request.staff ? `<button class="btn sm" data-n="${request.id}"${cool[request.id] ? " disabled" : ""}>${cool[request.id] ? "Đã nhắc" : "Nhắc nhân viên"}</button> ` : ""}<button class="btn sm" data-r="${request.id}">${request.staff ? "Điều phối lại" : "Phân công"}</button>`}</td></tr>`;
    }).join("")}</tbody></table>${rows.length ? "" : SF.empty()}`;
  }

  function pickStaff(request) {
    const panel = SF.modal(`<h3>${request.staff ? "Điều phối lại" : "Phân công"} ${request.id}</h3><p class="muted">${SF.esc(request.svc)} · Phòng ${request.room}</p><div class="field"><label for="ns">Nhân viên đang trực</label><select id="ns">${db.staff.filter((staff) => staff.status === "Đang trực").map((staff) => `<option value="${staff.id}"${request.staff?.id === staff.id ? " selected" : ""}>${SF.esc(staff.name)} · ${staff.role}</option>`).join("")}</select></div><div class="acts"><button class="btn" data-x>Hủy</button><button class="btn pri" id="ok">Xác nhận</button></div>`);

    panel.querySelector("#ok").onclick = () => {
      const staff = db.staff.find((item) => item.id === panel.querySelector("#ns").value);
      const snapshot = JSON.stringify(db);

      if (request.task) {
        request.task.staffId = staff.id;
      } else {
        db.tasks.push({
          id: "TSK" + String(db.tasks.length + 1).padStart(3, "0"),
          requestId: request.id,
          staffId: staff.id,
          status: "Chờ nhận",
          priority: request.priority,
          ai_priority_reason: request.ai_priority_reason,
          assignedAt: new Date(SF.now()).toISOString().slice(0, 19),
          completedAt: null,
        });
      }

      SF.log(db, `Điều phối ${request.id} cho ${staff.name}`);
      SF.save(db);
      SF.close();
      draw();
      SF.toast(`Đã giao ${request.id} cho ${staff.name}`, () => {
        db = JSON.parse(snapshot);
        SF.save(db);
        draw();
      });
    };
  }

  main.onclick = (e) => {
    const button = e.target.closest("[data-n],[data-r],#csv");
    if (!button) return;

    if (button.id === "csv") {
      const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
      const rows = list().map((request) =>
        [
          request.id,
          request.svc,
          request.room,
          request.staff?.name || "Chưa phân công",
          S(request) === "Đã đóng" ? "" : SF.fmt(SF.left(request)),
          S(request),
        ].map(quote).join(","),
      );
      const link = document.createElement("a");

      link.href = URL.createObjectURL(
        new Blob(
          [
            "\ufeff" + ["Id,Dịch vụ,Phòng,Nhân viên,Còn lại,Trạng thái", ...rows].join("\n"),
          ],
          { type: "text/csv" },
        ),
      );
      link.download = "sla-hom-nay.csv";
      link.click();
      SF.toast(`Đã xuất ${rows.length} dòng`);
    } else if (button.dataset.n) {
      const request = list().find((item) => item.id === button.dataset.n);
      cool[request.id] = 1;
      setTimeout(() => {
        delete cool[request.id];
        draw();
      }, 30000);
      SF.log(db, `Nhắc ${request.staff.name} xử lý ${request.id}`);
      SF.save(db);
      draw();
      SF.toast(`Đã nhắc ${request.staff.name} xử lý ${request.id}`);
    } else {
      pickStaff(list().find((request) => request.id === button.dataset.r));
    }
  };

  document.getElementById("fs").onchange = (e) => {
    sv = e.target.value;
    draw();
  };
  document.getElementById("ft").onchange = (e) => {
    st = e.target.value;
    draw();
  };
  setInterval(() => {
    document.querySelectorAll("[data-due]").forEach((cell) => {
      cell.textContent = SF.fmt(Math.round((+cell.dataset.due - SF.now()) / 1000));
    });
  }, 1000);

  SF.onq = draw;
  draw();
})();
