(() => {
  const main = SF.shell("manager", "cfg", "Quản lý / Cấu hình", "Cấu hình vận hành");
  const F = [["warn", "Ngưỡng “Sắp hạn” (phút)", "Yêu cầu còn ít hơn số phút này được đánh dấu Sắp hạn.", 5, 120], ["cap", "Công suất tối đa mỗi nhân viên (việc)", "Dùng để tính mức Khả dụng / Gần đầy / Quá tải.", 1, 10], ["target", "Mục tiêu SLA toàn khách sạn (%)", "Biểu đồ SLA tô đỏ khi thấp hơn mục tiêu.", 50, 100]];
  const $ = (i) => document.getElementById(i);
  function draw() {
    const c = SF.cfg();
    main.innerHTML = `<div class="head"><div><span class="gold">Áp dụng ngay cho Điều phối và Theo dõi SLA</span><h1>Cấu hình vận hành</h1></div></div>
    <form class="card" id="f" novalidate style="max-width:640px;display:grid;gap:14px">${F.map(([k, l, h, a, b]) => `<div class="field"><label for="c-${k}">${l}</label><input id="c-${k}" type="number" min="${a}" max="${b}" value="${c[k]}" aria-describedby="e-${k}"><span class="hint">${h} (${a}–${b})</span><span class="err" id="e-${k}" role="alert"></span></div>`).join("")}
    <label class="sw">Hiển thị gợi ý AI trên bảng điều phối<input type="checkbox" id="c-ai"${c.ai ? " checked" : ""}></label><div class="acts"><button class="btn" type="button" id="rs">Khôi phục mặc định</button><button class="btn pri" type="submit">Lưu cấu hình</button></div></form>`;
    $("rs").onclick = () => { localStorage.removeItem("sf_cfg"); draw(); SF.toast("Đã khôi phục cấu hình mặc định"); };
    $("f").onsubmit = (e) => {
      e.preventDefault(); const out = { ai: $("c-ai").checked }; let first;
      F.forEach(([k, , , a, b]) => { const v = +$("c-" + k).value, ok = Number.isInteger(v) && v >= a && v <= b; $("e-" + k).textContent = ok ? "" : `Nhập số nguyên từ ${a} đến ${b}.`; $("c-" + k).setAttribute("aria-invalid", !ok); if (!ok) first = first || $("c-" + k); out[k] = v; });
      if (first) return first.focus();
      localStorage.setItem("sf_cfg", JSON.stringify(out)); SF.toast("Đã lưu cấu hình");
    };
  }
  draw();
})();