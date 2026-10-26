(async () => {
  const main = SF.shell("manager", "sla", "Quản lý / Theo dõi SLA", "Theo dõi SLA");
  let db = await SF.load();
  let sv = "";
  let st = "";
  let cool = {};

  const TARGET = SF.cfg().target;
  const S = (r) => SF.state(r)[0];

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
    const all = SF.rows(db).filter((r) => r.status !== "Đã hủy");
    const over = all.filter((r) => S(r) === "Quá hạn").length;
    const soon = all.filter((r) => S(r) === "Sắp hạn").length;
    const pct = all.length
      ? Math.round(((all.length - over) / all.length) * 1000) / 10
      : 100;
    const hourly = Array.from({ length: 10 }, (_, index) => ({
      hour: index + 8,
      total: 0,
      onTime: 0,
    }));

    db.requests
      .filter((request) => request.status !== "Đã hủy")
      .forEach((request) => {
        const hour = Number(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            hourCycle: "h23",
          }).format(new Date(request.createdAt)),
        );
        const bucket = hourly.find((item) => item.hour === hour);
        if (!bucket) return;

        bucket.total += 1;
        if (
          request.status === "Hoàn thành" &&
          request.dueAt &&
          Date.parse(request.updatedAt) <= Date.parse(request.dueAt)
        ) {
          bucket.onTime += 1;
        }
      });

    const chart = hourly.map((item) => ({
      ...item,
      rate: item.total ? Math.round((item.onTime / item.total) * 100) : null,
    }));
    const responseTimes = db.tasks
      .map((task) => {
        const request = db.requests.find((item) => item.id === task.requestId);
        return request && (new Date(task.assignedAt) - new Date(request.createdAt)) / 1000;
      })
      .filter((time) => time >= 0);
    const avg = responseTimes.length
      ? Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length)
      : 0;

    document.getElementById("k").innerHTML = [
      [
        "SLA đạt",
        pct + "%",
        pct >= TARGET ? "ok" : "bad",
        pct >= TARGET ? "Đạt mục tiêu" : "Dưới mục tiêu " + TARGET + "%",
      ],
      [
        "Phản hồi trung bình",
        `${Math.floor(avg / 60)}m ${String(avg % 60).padStart(2, "0")}s`,
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

    document.getElementById("c").innerHTML = `<h3>Hoàn thành trong SLA theo giờ nhận</h3><p class="muted">Tỷ lệ dựa trên hạn dueAt và thời điểm cập nhật hoàn tất. Mốc giờ theo Asia/Ho_Chi_Minh; thanh đỏ thấp hơn mục tiêu ${TARGET}%.</p><div class="chart" role="img" aria-label="Tỷ lệ hoàn thành trong SLA theo giờ nhận, từ 8:00 đến 17:00">${chart.map((item) => `<div><small>${item.rate === null ? "—" : item.rate + "%"}</small><i class="${item.rate !== null && item.rate < TARGET ? "low" : ""}" style="height:${item.rate || 0}%"></i>${item.hour}:00</div>`).join("")}</div>`;

    const rows = list();
    document.getElementById("t").innerHTML = `<table><thead><tr><th>Mã</th><th>Dịch vụ</th><th>Phòng</th><th>Nhân viên</th><th>Thời gian còn lại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${rows.map((r) => {
      const [label, className] = SF.state(r);
      const closed = label === "Đã đóng";

      return `<tr class="${label === "Quá hạn" ? "bad-r" : label === "Sắp hạn" ? "warn-r" : ""}"><td><strong>${r.id}</strong></td><td>${SF.esc(r.svc)}</td><td>${r.room}</td><td>${r.staff ? SF.esc(r.staff.name) : "Chưa phân công"}</td><td class="num"${closed ? "" : ` data-due="${r.due}"`}>${closed ? "—" : SF.fmt(SF.left(r))}</td><td><span class="chip ${className}">${label}</span></td><td>${closed ? "" : `${r.staff ? `<button class="btn sm" data-n="${r.id}"${cool[r.id] ? " disabled" : ""}>${cool[r.id] ? "Đã nhắc" : "Nhắc nhân viên"}</button> ` : ""}<button class="btn sm" data-r="${r.id}">${r.staff ? "Điều phối lại" : "Phân công"}</button>`}</td></tr>`;
    }).join("")}</tbody></table>${rows.length ? "" : SF.empty()}`;
  }

  function pickStaff(r) {
    const panel = SF.modal(`<h3>${r.staff ? "Điều phối lại" : "Phân công"} ${r.id}</h3><p class="muted">${SF.esc(r.svc)} · Phòng ${r.room}</p><div class="field"><label for="ns">Nhân viên đang trực</label><select id="ns">${db.staff.filter((staff) => staff.status === "Đang trực").map((staff) => `<option value="${staff.id}"${r.staff?.id === staff.id ? " selected" : ""}>${SF.esc(staff.name)} · ${staff.role}</option>`).join("")}</select></div><div class="acts"><button class="btn" data-x>Hủy</button><button class="btn pri" id="ok">Xác nhận</button></div>`);

    panel.querySelector("#ok").onclick = () => {
      const staff = db.staff.find((item) => item.id === panel.querySelector("#ns").value);
      const snapshot = JSON.stringify(db);

      if (r.task) {
        r.task.staffId = staff.id;
        r.task.status = "Chờ nhận";
      } else {
        const next = db.tasks.reduce((max, task) => {
          const match = /-(\d+)$/.exec(task.id);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 5000) + 1;

        db.tasks.push({
          id: `TSK-${new Date(SF.now()).getFullYear()}-${next}`,
          requestId: r.id,
          staffId: staff.id,
          status: "Chờ nhận",
          priority: r.priority,
          ai_priority_reason: r.ai_priority_reason,
          assignedAt: new Date(SF.now()).toISOString(),
          startedAt: null,
          completedAt: null,
          checklist: [],
          internalNote: "",
        });
      }

      r.assignedStaffId = staff.id;
      r.status = "Đang thực hiện";
      r.updatedAt = new Date(SF.now()).toISOString();
      SF.log(db, `Điều phối ${r.id} cho ${staff.name}`);
      SF.save(db);
      SF.close();
      draw();
      SF.toast(`Đã giao ${r.id} cho ${staff.name}`, () => {
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
            "\ufeff" + ["Mã,Dịch vụ,Phòng,Nhân viên,Còn lại,Trạng thái", ...rows].join("\n"),
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
