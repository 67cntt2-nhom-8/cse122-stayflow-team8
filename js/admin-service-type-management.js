(async () => {
  const main = SF.shell("admin", "svc", "Quản trị / Loại dịch vụ", "Loại dịch vụ");
  let db = await SF.load();
  let page = 0;

  const PER = 5;
  const PRI = ["Thấp", "Trung bình", "Cao"];
  const act = (service) => service.active !== false;
  const depts = () => [...new Set(db.serviceTypes.map((service) => service.department))];
  const undo = (snapshot) => () => {
    db = JSON.parse(snapshot);
    SF.save(db);
    draw();
  };

  function draw() {
    const services = db.serviceTypes.filter((service) =>
      SF.match(`${service.categoryName} ${service.description} ${service.department}`, SF.q),
    );
    page = Math.min(page, Math.max(0, Math.ceil(services.length / PER) - 1));

    main.innerHTML = `<div class="head"><div><span class="gold">Quản trị dịch vụ</span><h1>Quản lý loại dịch vụ</h1><p class="muted">${db.serviceTypes.length} loại dịch vụ · ${db.serviceTypes.filter(act).length} đang kích hoạt · SLA được áp dụng khi tạo yêu cầu.</p></div><button class="btn pri" data-new>+ Thêm loại dịch vụ</button></div>
    <div class="wrap"><table><thead><tr><th>Tên dịch vụ</th><th>Nhóm</th><th>SLA chuẩn</th><th>Ưu tiên mặc định</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${services.slice(page * PER, page * PER + PER).map((service) => `<tr><td><strong>${SF.esc(service.categoryName)}</strong><br><small class="muted">${SF.esc(service.description)}</small></td><td>${SF.esc(service.department)}</td><td class="num">${service.expectedSLA} phút</td><td>${service.priority || "Trung bình"}</td><td><span class="chip ${act(service) ? "ok" : "info"}">${act(service) ? "Đang hoạt động" : "Đã lưu trữ"}</span></td><td><button class="btn sm" data-e="${service.id}">Chỉnh sửa</button> <button class="btn sm" data-a="${service.id}">${act(service) ? "Lưu trữ" : "Kích hoạt lại"}</button></td></tr>`).join("")}</tbody></table>${services.length ? "" : SF.empty()}${SF.pager(page, services.length, PER)}</div>`;
  }

  function form(service0) {
    const isNew = !service0;
    const service = service0 || {
      categoryName: "",
      description: "",
      department: depts()[0] || "",
      expectedSLA: 30,
      priority: "Trung bình",
    };
    const panel = SF.modal(`<h3>${isNew ? "Thêm" : "Chỉnh sửa"} loại dịch vụ</h3>${isNew ? "" : `<small class="muted">ID: ${service.id}</small>`}
    <div class="field"><label for="f-n">Tên dịch vụ</label><input id="f-n" value="${SF.esc(service.categoryName)}" aria-describedby="e-n"><span class="err" id="e-n" role="alert"></span></div>
    <div class="field"><label for="f-d">Mô tả</label><textarea id="f-d" rows="3" maxlength="200">${SF.esc(service.description)}</textarea></div>
    <div class="field"><label for="f-g">Nhóm</label><input id="f-g" list="dl" value="${SF.esc(service.department)}"><datalist id="dl">${depts().map((dept) => `<option value="${SF.esc(dept)}">`).join("")}</datalist></div>
    <div class="field"><label for="f-s">SLA chuẩn (phút)</label><input id="f-s" type="number" min="5" max="480" value="${service.expectedSLA}" aria-describedby="e-s"><span class="err" id="e-s" role="alert"></span><span class="hint">Từ 5 đến 480 phút.</span></div>
    <div class="field"><label for="f-p">Ưu tiên mặc định</label><select id="f-p">${PRI.map((priority) => `<option${priority === (service.priority || "Trung bình") ? " selected" : ""}>${priority}</option>`).join("")}</select></div>
    <div class="acts"><button class="btn" data-x>Hủy</button><button class="btn pri" id="ok">Lưu thay đổi</button></div>`, true);
    const query = (selector) => panel.querySelector(selector);

    query("#ok").onclick = () => {
      const name = query("#f-n").value.trim();
      const sla = +query("#f-s").value;
      const dept = query("#f-g").value.trim();
      const nameError = name.length < 3
        ? "Tên dịch vụ cần ít nhất 3 ký tự."
        : db.serviceTypes.some((item) =>
          item !== service && SF.norm(item.categoryName) === SF.norm(name),
        )
          ? "Tên này đã tồn tại."
          : "";
      const slaError = sla >= 5 && sla <= 480 ? "" : "SLA phải từ 5 đến 480 phút.";

      query("#e-n").textContent = nameError;
      query("#e-s").textContent = slaError;
      query("#f-n").setAttribute("aria-invalid", !!nameError);
      query("#f-s").setAttribute("aria-invalid", !!slaError);
      if (nameError || slaError) return (nameError ? query("#f-n") : query("#f-s")).focus();

      const snapshot = JSON.stringify(db);
      Object.assign(service, {
        categoryName: name,
        description: query("#f-d").value.trim(),
        department: dept || "Chung",
        expectedSLA: sla,
        priority: query("#f-p").value,
      });

      if (isNew) {
        service.id = "ST" + String(db.serviceTypes.length + 1).padStart(3, "0");
        service.active = true;
        db.serviceTypes.push(service);
      }

      SF.log(db, `${isNew ? "Thêm" : "Sửa"} loại dịch vụ ${name}`);
      SF.save(db);
      SF.close();
      draw();
      SF.toast(isNew ? "Đã thêm loại dịch vụ" : "Đã lưu thay đổi", undo(snapshot));
    };
  }

  function archive(service) {
    const panel = SF.modal(`<h3>Lưu trữ loại dịch vụ?</h3><p class="muted"><strong>${SF.esc(service.categoryName)}</strong> sẽ không xuất hiện khi tạo yêu cầu mới. Dữ liệu lịch sử vẫn được giữ nguyên.</p><div class="acts"><button class="btn" data-x>Hủy</button><button class="btn danger" id="ok">Xác nhận lưu trữ</button></div>`);

    panel.querySelector("#ok").onclick = () => {
      const snapshot = JSON.stringify(db);
      service.active = false;
      SF.log(db, `Lưu trữ ${service.categoryName}`);
      SF.save(db);
      SF.close();
      draw();
      SF.toast("Đã lưu trữ loại dịch vụ", undo(snapshot));
    };
  }

  main.onclick = (e) => {
    const button = e.target.closest("[data-new],[data-e],[data-a],[data-p]");
    if (!button) return;

    const { e: editId, a: actionId, p: pageNumber } = button.dataset;
    const find = (id) => db.serviceTypes.find((service) => service.id === id);

    if (pageNumber) {
      page = +pageNumber;
      draw();
    } else if (button.hasAttribute("data-new")) {
      form();
    } else if (editId) {
      form(find(editId));
    } else {
      const service = find(actionId);

      if (act(service)) {
        archive(service);
      } else {
        const snapshot = JSON.stringify(db);
        service.active = true;
        SF.save(db);
        draw();
        SF.toast("Đã kích hoạt lại", undo(snapshot));
      }
    }
  };

  SF.onq = () => {
    page = 0;
    draw();
  };
  draw();
})();
