(async () => {
  const main = SF.shell("manager", "dispatch", "Vận hành / Điều phối trực tiếp", "Bảng điều phối");
  let db = await SF.load();
  let sel;
  let pick;
  let hide = !SF.cfg().ai;

  // Thứ tự ưu tiên, công suất và các helper dùng để xếp hàng/chọn nhân viên.
  const PR = {
    Cao: ["bad", 0],
    "Trung bình": ["warn", 1],
    Thấp: ["info", 2],
  };
  const CAP = SF.cfg().cap;
  const queue = () => SF.rows(db)
    .filter((r) =>
      r.status === "Chờ xử lý" &&
      SF.match(r.id + r.room + r.guest + r.svc + r.title + r.content, SF.q),
    )
    .sort((a, b) => PR[a.priority][1] - PR[b.priority][1] || a.due - b.due);
  const load = (s) => db.tasks.filter((t) =>
    t.staffId === s.id && ["Chờ nhận", "Đang làm"].includes(t.status),
  ).length;
  const best = (r) => {
    const score = (s) => (s.role === r.dept ? 0 : 9) + load(s);
    return db.staff
      .filter((s) => s.status === "Đang trực")
      .sort((a, b) => score(a) - score(b))[0];
  };
  const level = (n) => (
    n >= CAP
      ? ["Quá tải", "bad-f"]
      : n >= CAP * 0.5
        ? ["Gần đầy", "warn-f"]
        : ["Khả dụng", ""]
  );

  function assign(r, s) {
    // Cập nhật task có sẵn hoặc tạo task mới, sau đó đổi trạng thái request và ghi audit.
    const task = r.task;

    if (task) {
      task.staffId = s.id;
      task.status = "Chờ nhận";
    } else {
      const next = db.tasks.reduce((max, item) => {
        const match = /-(\d+)$/.exec(item.id);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 5000) + 1;

      db.tasks.push({
        id: `TSK-${new Date(SF.now()).getFullYear()}-${next}`,
        requestId: r.id,
        staffId: s.id,
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

    const request = db.requests.find((item) => item.id === r.id);
    request.assignedStaffId = s.id;
    request.status = "Đang thực hiện";
    request.updatedAt = new Date(SF.now()).toISOString();
    SF.log(db, `Phân công ${r.id} cho ${s.name}`);
  }

  function run(assignments, message) {
    // Lưu snapshot trước khi phân công để toast có thể khôi phục toàn bộ thay đổi.
    const snapshot = JSON.stringify(db);
    assignments.forEach(([request, staff]) => assign(request, staff));
    SF.save(db);
    draw();
    SF.toast(message, () => {
      db = JSON.parse(snapshot);
      SF.save(db);
      draw();
    });
  } 

  function draw() {
    // Đồng bộ lựa chọn với hàng đợi mới nhất và dựng các khu vực hàng đợi, tải, chi tiết.
    const rows = queue();
    const all = SF.rows(db);
    const request = rows.find((item) => item.id === sel) || rows[0];
    sel = request?.id;

    const duty = db.staff.filter((staff) => staff.status === "Đang trực");
    const over = all.filter((item) => SF.state(item)[0] === "Quá hạn").length;
    const target = request && (db.staff.find((staff) => staff.id === pick) || best(request));
    const suggestions = rows.slice(0, 3);

    main.innerHTML = `<div class="head"><div><span class="gold">Điều phối dịch vụ · dữ liệu mẫu</span><h1>Bảng điều phối</h1><p class="muted">Chọn yêu cầu, xem nhân viên phù hợp rồi xác nhận phân công. Gợi ý AI không được áp dụng tự động.</p></div><a class="btn" href="manager-sla-monitor.html">Theo dõi SLA</a></div>
    <div class="kpis"><div class="card kpi"><span>Yêu cầu chờ</span><b>${String(rows.length).padStart(2, "0")}</b><small class="muted">Sắp theo ưu tiên, rồi hạn SLA</small></div><div class="card kpi"><span>Quá hạn</span><b>${String(over).padStart(2, "0")}</b><small style="color:var(--red)">${over ? "Cần xử lý ngay" : "Không có"}</small></div><div class="card kpi"><span>Nhân viên khả dụng</span><b>${duty.length}/${db.staff.length}</b><small class="muted">Đang trực ca</small></div></div>
    <div class="cols"><section class="card" aria-label="Hàng đợi"><h3>Hàng đợi</h3>${rows.length ? rows.map((item) => `<button class="row" data-q="${item.id}" aria-pressed="${item.id === sel}"><span class="between"><strong>${item.id}</strong><span class="chip ${PR[item.priority][0]}">${item.priority}</span></span><div>${SF.esc(item.svc)} · Phòng ${item.room}</div><small class="muted">Còn ${SF.fmt(SF.left(item))} · ${SF.esc(item.guest)}</small></button>`).join("") : SF.empty()}</section>
    <section class="card" aria-label="Tải nhân viên"><h3>Tải nhân viên</h3>${db.staff.map((staff) => {
      const count = load(staff);
      const [label, className] = level(count);
      const off = staff.status !== "Đang trực";

      return `<button class="row st" data-s="${staff.id}" aria-pressed="${target?.id === staff.id}"${off ? " disabled" : ""}><span class="between"><strong>${SF.esc(staff.name)}</strong><span>${off ? "Nghỉ" : count + "/" + CAP}</span></span><small class="muted">${staff.role} · ${staff.shift} · ${off ? "Không khả dụng" : label}</small><div class="meter"><i class="${className}" style="width:${Math.min(100, (count / CAP) * 100)}%"></i></div></button>`;
    }).join("")}</section>
    <section class="card" aria-label="Chi tiết yêu cầu">${request ? `<span class="chip ${PR[request.priority][0]}">Ưu tiên ${request.priority}</span><h3>${SF.esc(request.svc)}</h3><p class="muted">${SF.esc(request.content)}</p><dl><dt>Mã</dt><dd>${request.id}</dd><dt>Phòng</dt><dd>${request.room}</dd><dt>Khách</dt><dd>${SF.esc(request.guest)}</dd><dt>SLA còn</dt><dd>${SF.fmt(SF.left(request))}</dd></dl><p class="hint">${SF.esc(request.ai_priority_reason)}</p>${target ? `<div class="best"><small>${pick ? "ĐÃ CHỌN" : "PHÙ HỢP NHẤT"}</small><br><strong>${SF.esc(target.name)}</strong> · ${target.role}</div><button class="btn pri" data-go style="width:100%">Phân công ${SF.esc(target.name.split(" ").pop())}</button>` : '<p class="note">Chưa có nhân viên đang trực.</p>'}` : '<p class="empty muted">Không còn yêu cầu chờ xử lý 🎉</p>'}</section></div>
    ${suggestions.length && !hide ? `<section class="card ai" aria-label="Gợi ý AI"><h3>AI Priority Assistant</h3><div class="sug">${suggestions.map((item, index) => `<div><strong>${index + 1}. ${item.id} → ${SF.esc((best(item) || {}).name || "—")}</strong><br><small class="muted">${SF.esc(item.ai_priority_reason)}</small></div>`).join("")}</div><div class="acts"><small class="muted">Gợi ý chưa tự động áp dụng</small><button class="btn" data-no>Từ chối</button><button class="btn pri" data-all>Chấp nhận tất cả</button></div></section>` : ""}`;
  }

  // Một listener xử lý chọn request/nhân viên, phân công đơn hoặc áp dụng gợi ý AI.
  main.onclick = (e) => {
    const button = e.target.closest("[data-q],[data-s],[data-go],[data-all],[data-no]");
    if (!button) return;

    const request = queue().find((item) => item.id === sel);
    const { q, s } = button.dataset;

    if (q) {
      sel = q;
      pick = 0;
      draw();
    } else if (s) {
      pick = pick === s ? 0 : s;
      draw();
    } else if (button.hasAttribute("data-go")) {
      const staff = db.staff.find((item) => item.id === pick) || best(request);
      run([[request, staff]], `Đã phân công ${staff.name} cho ${request.id}`);
      pick = 0;
    } else if (button.hasAttribute("data-all")) {
      const list = queue()
        .slice(0, 3)
        .map((item) => [item, best(item)])
        .filter((pair) => pair[1]);
      run(list, `Đã chấp nhận ${list.length} gợi ý của AI`);
    } else {
      hide = true;
      draw();
      SF.toast("Đã bỏ qua gợi ý AI");
    }
  };

  SF.onq = draw;
  draw();
})();
