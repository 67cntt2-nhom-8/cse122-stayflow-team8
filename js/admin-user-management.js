(async () => {
  const main = SF.shell("admin", "user", "Quản trị / Người dùng", "Quản lý người dùng");
  let db = await SF.load();
  let page = 0;
  let role = "";
  let sel = new Set();

  // Cấu hình phân trang, nhãn quyền, màu vai trò và lý do khóa tài khoản.
  const PER = 6;
  const PERMS = [
    "Điều phối yêu cầu",
    "Xem báo cáo dịch vụ",
    "Xuất dữ liệu",
    "Quản lý người dùng",
  ];
  const RC = {
    Guest: "",
    Staff: "info",
    Manager: "warn",
    Admin: "bad",
  };
  const REASONS = [
    "Nghi ngờ truy cập trái phép",
    "Vi phạm chính sách",
    "Nghỉ việc / hết hợp đồng",
    "Chủ tài khoản yêu cầu",
    "Khác",
  ];

  main.innerHTML = `<div id="h"></div><div class="tools"><label>Vai trò <select id="fr"><option value="">Tất cả</option>${Object.keys(RC).map((item) => `<option>${item}</option>`).join("")}</select></label></div><div id="b"></div><div id="t" class="wrap"></div>`;

  const $ = (id) => document.getElementById(id);
  // Các helper lọc danh sách, đếm quản trị viên còn hoạt động và khôi phục snapshot.
  const undo = (snapshot) => () => {
    db = JSON.parse(snapshot);
    SF.save(db);
    draw();
  };
  const list = () => db.users.filter((user) =>
    (!role || user.role === role) &&
    SF.match(`${user.name} ${user.contact} ${user.scope}`, SF.q),
  );
  const admins = () => db.users.filter((user) => user.role === "Admin" && user.active);

  function draw() {
    // Cập nhật phần đầu trang, thao tác hàng loạt và bảng tài khoản theo bộ lọc hiện tại.
    const users = list();
    page = Math.min(page, Math.max(0, Math.ceil(users.length / PER) - 1));
    const pageUsers = users.slice(page * PER, page * PER + PER);

    $("h").innerHTML = `<div class="head"><div><span class="gold">Phân quyền theo vai trò và phạm vi</span><h1>Tài khoản & phân quyền</h1><p class="muted">${db.users.length} tài khoản · ${db.users.filter((user) => user.active).length} đang hoạt động</p></div></div>`;
    $("b").innerHTML = sel.size
      ? `<div class="bulk"><strong>${sel.size} tài khoản được chọn</strong><button class="btn sm danger" data-bulk>Khóa đã chọn</button><button class="btn sm" data-clr>Bỏ chọn</button></div>`
      : db.users.length
        ? ""
        : '<div class="note">JSON hiện không có danh sách tài khoản đăng nhập. Nhân viên và khách lưu trú không được tự động coi là tài khoản; chức năng quản lý tài khoản cần nguồn dữ liệu tài khoản riêng.</div>';

    $("t").innerHTML = `<table><thead><tr><th><input type="checkbox" data-all aria-label="Chọn tất cả trên trang"${pageUsers.length && pageUsers.every((user) => sel.has(user.id)) ? " checked" : ""}></th><th>Tài khoản</th><th>Vai trò</th><th>Phạm vi</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${pageUsers.map((user) => `<tr><td><input type="checkbox" data-c="${user.id}" aria-label="Chọn ${SF.esc(user.name)}"${sel.has(user.id) ? " checked" : ""}></td><td><button class="btn sm" data-v="${user.id}" style="border:0;padding:0;background:none;text-align:left"><strong>${SF.esc(user.name)}</strong></button><br><small class="muted">${SF.esc(user.contact)}</small></td><td><span class="chip ${RC[user.role]}">${user.role}</span></td><td>${SF.esc(user.scope)}</td><td><span class="chip ${user.active ? "ok" : "bad"}">${user.active ? "Hoạt động" : "Đã khóa"}</span></td><td><button class="btn sm" data-pm="${user.id}">Phân quyền</button> <button class="btn sm" data-rp="${user.id}">Cấp lại mật khẩu</button> <button class="btn sm" data-lk="${user.id}">${user.active ? "Khóa" : "Kích hoạt"}</button></td></tr>`).join("")}</tbody></table>${users.length ? "" : SF.empty()}${SF.pager(page, users.length, PER)}`;
  }

  function view(user) {
    // Hộp thoại chỉ đọc thông tin tài khoản đã chọn.
    SF.modal(`<h3>${SF.esc(user.name)}</h3><dl><dt>Liên hệ</dt><dd>${SF.esc(user.contact)}</dd><dt>Vai trò</dt><dd>${user.role}</dd><dt>Phạm vi</dt><dd>${SF.esc(user.scope)}</dd><dt>Trạng thái</dt><dd>${user.active ? "Hoạt động" : "Đã khóa"}</dd></dl><div class="acts"><button class="btn pri" data-x>Đóng</button></div>`);
  }

  function perms(user) {
    // Cho phép cập nhật vai trò/quyền; quyền quản lý người dùng chỉ bật với Admin.
    const panel = SF.modal(`<h3>Phân quyền tài khoản</h3><small class="muted">${SF.esc(user.name)} · ${user.role}</small>
    <div class="field"><label for="pr">Vai trò</label><select id="pr">${Object.keys(RC).map((item) => `<option${item === user.role ? " selected" : ""}>${item}</option>`).join("")}</select></div>
    <div class="field"><label for="ps">Phạm vi phụ trách</label><input id="ps" value="${SF.esc(user.scope)}" readonly></div>
    <fieldset class="card"><legend>Quyền chi tiết</legend>${PERMS.map((name, index) => `<label class="sw">${name}<input type="checkbox" id="p${index}"${user.perms[index] ? " checked" : ""}></label>`).join("")}<span class="hint">Chỉ Admin được cấp quyền quản lý người dùng.</span></fieldset>
    <p class="note">Thay đổi quyền được ghi vào nhật ký audit.</p><div class="acts"><button class="btn" data-x>Hủy</button><button class="btn pri" id="ok">Lưu phân quyền</button></div>`, true);

    const sync = () => {
      const isAdmin = panel.querySelector("#pr").value === "Admin";
      const permission = panel.querySelector("#p3");
      permission.disabled = !isAdmin;
      if (!isAdmin) permission.checked = false;
    };

    panel.querySelector("#pr").onchange = sync;
    sync();
    panel.querySelector("#ok").onclick = () => {
      const newRole = panel.querySelector("#pr").value;
      // Bảo đảm không thể hạ quyền Admin hoạt động cuối cùng khỏi hệ thống.
      if (user.role === "Admin" && newRole !== "Admin" && admins().length < 2) {
        return SF.toast("Cần ít nhất một quản trị viên đang hoạt động.");
      }

      const snapshot = JSON.stringify(db);
      user.role = newRole;
      user.perms = PERMS.map((_, index) => +panel.querySelector("#p" + index).checked);
      SF.log(db, `Đổi quyền ${user.name} → ${newRole}`);
      SF.save(db);
      SF.close();
      draw();
      SF.toast("Đã lưu phân quyền", undo(snapshot));
    };
  }

  function lock(ids) {
    // Khóa một hoặc nhiều tài khoản sau khi kiểm tra danh sách và bảo vệ Admin cuối cùng.
    const users = db.users.filter((user) => ids.includes(user.id));
    if (!users.length) return;

    if (
      users.some((user) => user.role === "Admin") &&
      admins().every((admin) => ids.includes(admin.id))
    ) {
      return SF.toast("Không thể khóa quản trị viên đang hoạt động cuối cùng.");
    }

    const panel = SF.modal(`<h3>Khóa ${users.length > 1 ? users.length + " tài khoản" : SF.esc(users[0].name)}?</h3><p class="muted">Người dùng sẽ bị đăng xuất ngay và không thể đăng nhập cho đến khi được kích hoạt lại.</p><div class="field"><label for="rs">Lý do khóa</label><select id="rs"><option value="">Chọn lý do...</option>${REASONS.map((reason) => `<option>${reason}</option>`).join("")}</select><span class="err" id="er" role="alert"></span></div><div class="acts"><button class="btn" data-x>Hủy</button><button class="btn danger" id="ok">Xác nhận khóa</button></div>`);

    panel.querySelector("#ok").onclick = () => {
      const reason = panel.querySelector("#rs").value;
      if (!reason) {
        panel.querySelector("#er").textContent = "Hãy chọn lý do khóa.";
        return panel.querySelector("#rs").focus();
      }

      const snapshot = JSON.stringify(db);
      users.forEach((user) => {
        user.active = false;
        SF.log(db, `Khóa ${user.name}: ${reason}`);
      });
      SF.save(db);
      sel.clear();
      SF.close();
      draw();
      SF.toast(`Đã khóa ${users.length} tài khoản`, undo(snapshot));
    };
  }

  // Điều phối xem, phân quyền, đặt lại mật khẩu, khóa/kích hoạt và thao tác hàng loạt.
  main.onclick = (e) => {
    const button = e.target.closest("[data-v],[data-pm],[data-rp],[data-lk],[data-bulk],[data-clr],[data-p]");
    if (!button) return;

    const { v: viewId, pm: permissionId, rp: resetId, lk: lockId, p: pageNumber } = button.dataset;
    const user = db.users.find((item) =>
      item.id === (viewId || permissionId || resetId || lockId),
    );

    if (pageNumber) {
      page = +pageNumber;
      draw();
    } else if (button.hasAttribute("data-clr")) {
      sel.clear();
      draw();
    } else if (button.hasAttribute("data-bulk")) {
      lock([...sel]);
    } else if (viewId) {
      view(user);
    } else if (permissionId) {
      perms(user);
    } else if (resetId) {
      SF.log(db, `Cấp lại mật khẩu cho ${user.name}`);
      SF.save(db);
      SF.toast(`Đã gửi liên kết đặt lại mật khẩu tới ${user.contact}`);
    } else if (user.active) {
      lock([user.id]);
    } else {
      const snapshot = JSON.stringify(db);
      user.active = true;
      SF.log(db, `Kích hoạt ${user.name}`);
      SF.save(db);
      draw();
      SF.toast(`Đã kích hoạt ${user.name}`, undo(snapshot));
    }
  };

  // Cập nhật bộ lọc vai trò hoặc các checkbox chọn tài khoản trên trang hiện tại.
  main.onchange = (e) => {
    const target = e.target;

    if (target.id === "fr") {
      role = target.value;
      page = 0;
      draw();
    } else if (target.dataset.c) {
      target.checked ? sel.add(target.dataset.c) : sel.delete(target.dataset.c);
      draw();
    } else if ("all" in target.dataset) {
      list()
        .slice(page * PER, page * PER + PER)
        .forEach((user) => (target.checked ? sel.add(user.id) : sel.delete(user.id)));
      draw();
    }
  };

  SF.onq = () => {
    page = 0;
    draw();
  };
  draw();
})();
