(() => {
  const main = SF.shell("manager", "cfg", "Quản lý / Cấu hình", "Cấu hình vận hành");
  // Khai báo các ngưỡng vận hành cùng giới hạn hợp lệ và mô tả trên giao diện.
  const F = [
    [
      "warn",
      "Ngưỡng “Sắp hạn” (phút)",
      "Yêu cầu còn ít hơn số phút này được đánh dấu Sắp hạn.",
      5,
      120,
    ],
    [
      "cap",
      "Công suất tối đa mỗi nhân viên (việc)",
      "Dùng để tính mức Khả dụng / Gần đầy / Quá tải.",
      1,
      10,
    ],
    [
      "target",
      "Mục tiêu SLA toàn khách sạn (%)",
      "Biểu đồ SLA tô đỏ khi thấp hơn mục tiêu.",
      50,
      100,
    ],
  ];
  const $ = (id) => document.getElementById(id);

  function draw() {
    // Đọc cấu hình hiện tại và dựng biểu mẫu với các giá trị đã lưu.
    const config = SF.cfg();

    main.innerHTML = `<div class="head"><div><span class="gold">Áp dụng ngay cho Điều phối và Theo dõi SLA</span><h1>Cấu hình vận hành</h1></div></div>
    <form class="card" id="f" novalidate style="max-width:640px;display:grid;gap:14px">${F.map(([key, label, hint, min, max]) => `<div class="field"><label for="c-${key}">${label}</label><input id="c-${key}" type="number" min="${min}" max="${max}" value="${config[key]}" aria-describedby="e-${key}"><span class="hint">${hint} (${min}–${max})</span><span class="err" id="e-${key}" role="alert"></span></div>`).join("")}
    <label class="sw">Hiển thị gợi ý AI trên bảng điều phối<input type="checkbox" id="c-ai"${config.ai ? " checked" : ""}></label><div class="acts"><button class="btn" type="button" id="rs">Khôi phục mặc định</button><button class="btn pri" type="submit">Lưu cấu hình</button></div></form>`;

    // Khôi phục mặc định bằng cách xóa cấu hình tùy chỉnh trong localStorage.
    $("rs").onclick = () => {
      localStorage.removeItem("sf_cfg");
      draw();
      SF.toast("Đã khôi phục cấu hình mặc định");
    };

    // Chặn submit mặc định, xác thực toàn bộ số nguyên rồi mới lưu một lần.
    $("f").onsubmit = (e) => {
      e.preventDefault();

      const output = { ai: $("c-ai").checked };
      let first;

      F.forEach(([key, , , min, max]) => {
        const value = +$("c-" + key).value;
        const valid = Number.isInteger(value) && value >= min && value <= max;

        $("e-" + key).textContent = valid ? "" : `Nhập số nguyên từ ${min} đến ${max}.`;
        $("c-" + key).setAttribute("aria-invalid", !valid);
        if (!valid) first = first || $("c-" + key);
        output[key] = value;
      });

      if (first) return first.focus();

      localStorage.setItem("sf_cfg", JSON.stringify(output));
      SF.toast("Đã lưu cấu hình");
    };
  }

  draw();
})();
