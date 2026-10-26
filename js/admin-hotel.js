(async () => {
  const main = SF.shell("admin", "hotel", "Quản trị / Khách sạn", "Quản lý khách sạn");
  const db = await SF.load();
  const occupied = db.stays.filter(
    (stay) => stay.status === "Đang lưu trú",
  ).length;
  const totalRooms = 120;
  const occupancy = Math.round((occupied / totalRooms) * 100);
  const overdue = db.requests.filter(
    (request) => SF.state(request)[0] === "Quá hạn",
  ).length;
  const team = db.staff.filter(
    (staff) => staff.status === "Đang trực",
  ).length;
  const stayList = [...db.stays].sort((a, b) =>
    a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }),
  );

  const chart = [
    { label: "1W", value: 62 },
    { label: "2W", value: 71 },
    { label: "3W", value: 68 },
    { label: "4W", value: 79 },
    { label: "5W", value: 84 },
    { label: "6W", value: 76 },
    { label: "7W", value: 88 },
  ];

  main.innerHTML = `
    <div class="head">
      <div>
        <span class="gold">AURORA GRAND · ĐÀ NẴNG</span>
        <h1>Quản lý khách sạn</h1>
        <p class="muted">Tỷ lệ lấp đầy, hoạt động lưu trú và hiệu suất phục vụ theo thời gian thực.</p>
      </div>
      <button class="btn pri" type="button" data-refresh>Refresh dữ liệu</button>
    </div>

    <div class="kpis">
      ${[
        ["Phòng đang có khách", `${occupied}/${totalRooms}`, `${occupancy}% lấp đầy`],
        [
          "Yêu cầu đang mở",
          `${db.requests.filter((request) => !["Hoàn thành", "Đã hủy"].includes(request.status)).length}`,
          overdue ? `${overdue} quá hạn` : "Không có chậm trễ",
        ],
        ["Nhân viên đang trực", `${team}/${db.staff.length}`, "Phân bổ theo ca làm"],
        ["Điểm hiệu suất", `4.8/5`, "Khách đánh giá dịch vụ"],
      ].map(([label, value, note]) => `
          <div class="card kpi">
            <span>${label}</span>
            <b>${value}</b>
            <small class="muted">${note}</small>
          </div>
        `).join("")}
    </div>

    <div class="cols" style="grid-template-columns: 1.2fr .8fr;">
      <section class="card">
        <h3>Xu hướng lấp đầy</h3>
        <div class="chart" aria-label="Biểu đồ tỷ lệ lấp đầy">
          ${chart.map((item) => `
            <div>
              <i style="height:${item.value}%" class="${item.value < 70 ? "low" : ""}"></i>
              <span>${item.label}</span>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="card">
        <h3>Trạng thái nhanh</h3>
        <div class="ai">
          <div class="sug">
            <div>
              <strong>Check-in sắp tới</strong>
              <p class="muted">2 khách đặt phòng trong 6 giờ tới.</p>
            </div>
            <div>
              <strong>Dịch vụ VIP</strong>
              <p class="muted">1 yêu cầu spa đang chờ xác nhận.</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="card">
      <h3>Danh sách phòng & lưu trú</h3>
      <div class="wrap">
        <table>
          <thead>
            <tr>
              <th>Phòng</th>
              <th>Khách</th>
              <th>Trạng thái</th>
              <th>Yêu cầu mở</th>
            </tr>
          </thead>
          <tbody>
            ${stayList.slice(0, 8).map((stay) => {
              const openReqs = db.requests.filter(
                (request) =>
                  request.stayId === stay.id &&
                  !["Hoàn thành", "Đã hủy"].includes(request.status),
              ).length;
              return `
                <tr>
                  <td><strong>${SF.esc(stay.roomNumber)}</strong></td>
                  <td>${SF.esc(stay.guestName)}</td>
                  <td><span class="chip ${stay.status === "Đang lưu trú" ? "ok" : "info"}">${SF.esc(stay.status)}</span></td>
                  <td>${openReqs}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  main.onclick = (e) => {
    const button = e.target.closest("[data-refresh]");
    if (!button) return;
    SF.toast("Dữ liệu khách sạn đã được làm mới");
  };
})();
