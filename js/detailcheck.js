/* =========================================================================
   Smoke test cho trang chi tiết nhiệm vụ: chạy js/staff-task-detail.js
   trên DOM giả tối thiểu.
   Chạy: node js/detailcheck.js
   Mục đích: bắt lỗi runtime (thiếu phần tử, sai tên API) và kiểm tra
   đổi trạng thái + lưu ghi chú + nhật ký hoạt động đúng.
   ========================================================================= */
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'pages', 'staff-task-detail.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8') + '\n' +
    fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8') + '\n' +
    fs.readFileSync(path.join(__dirname, 'staff-task-detail.js'), 'utf8');

/* ---------- DOM giả tối thiểu ---------- */
function el(tag) {
    return {
        tagName: tag,
        dataset: {},
        children: [],
        classes: new Set(),
        style: {},
        textContent: '',
        innerHTML: '',
        hidden: false,
        disabled: false,
        value: '',
        offsetWidth: 0,
        attributes: {},
        get classList() {
            const self = this;
            return {
                add: (...names) => names.forEach((n) => self.classes.add(n)),
                remove: (...names) => names.forEach((n) => self.classes.delete(n)),
                toggle: (name, force) => {
                    const on = force === undefined ? !self.classes.has(name) : force;
                    if (on) self.classes.add(name); else self.classes.delete(name);
                    return on;
                },
                contains: (name) => self.classes.has(name),
            };
        },
        setAttribute: function (k, v) { this.attributes[k] = v; },
        appendChild: function (child) { this.children.push(child); return child; },
        remove: function () { },
        focus: function () { this.focused = true; },
        closest: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function (type, handler) { this.handlers = this.handlers || {}; this.handlers[type] = handler; },
    };
}

/* Mỗi id trong HTML -> một phần tử */
const byId = {};
html.replace(/id="([^"]+)"/g, (_, id) => { byId[id] = el('div'); return ''; });

/* Nút hành động cần dataset.action như trong HTML */
byId.btnProcessing.dataset.action = 'processing';
byId.btnCompleted.dataset.action = 'completed';
byId.btnReopen.dataset.action = 'new';
byId.btnReopen.hidden = true;

/* Các phần tử không có id nhưng được truy vấn bằng data-* */
const dataNodes = {
    '[data-code]': [el('span')],
    '[data-title]': [el('p')],
    '[data-note]': [el('p')],
    '[data-reason]': [el('p')],
    '[data-room]': [el('dd')],
    '[data-guest]': [el('dd')],
    '[data-service]': [el('dd')],
    '[data-department]': [el('dd')],
    '[data-priority]': [el('dd')],
    '[data-received]': [el('dd')],
    '[data-sla]': [el('dd')],
    '[data-remaining]': [el('dd')],
    '[data-assignee]': [el('dd')],
    '[data-status-row]': [el('dd')],
    '[data-status-text]': [el('span')],
    '[data-timeline]': [el('ol')],
};

const document = {
    title: '',
    addEventListener: (type, handler) => { if (type === 'DOMContentLoaded') document.ready = handler; },
    querySelector: (selector) => {
        if (selector[0] === '#') return byId[selector.slice(1)] || null;
        if (dataNodes[selector]) return dataNodes[selector][0];
        return null;
    },
    querySelectorAll: (selector) => dataNodes[selector] || [],
    createElement: el,
};

const window = {
    location: { search: '' },
    matchMedia: () => ({ matches: true, addEventListener: () => { }, addListener: () => { } }),
};

/* ---------- Chạy 2 file rồi gọi init() ---------- */
new Function('document', 'window', 'setInterval', 'require', 'module', source)(
    document, window, () => 0, require, { exports: {} });
document.ready();

/* ---------- Kiểm tra dữ liệu đổ lên giao diện ---------- */
assert.strictEqual(dataNodes['[data-code]'][0].textContent, '#REQ-2026-3002', 'Mặc định là nhiệm vụ từ dữ liệu mock');
assert.strictEqual(dataNodes['[data-title]'][0].textContent, 'Bổ sung khăn tắm', 'Tiêu đề lấy từ dữ liệu');
assert.strictEqual(dataNodes['[data-room]'][0].textContent, 'Phòng 0815 · Tầng 8', 'Phòng/tầng đúng');
assert.strictEqual(dataNodes['[data-guest]'][0].textContent, 'Trần Quốc Bảo', 'Tên khách đúng');
assert.strictEqual(dataNodes['[data-priority]'][0].textContent, 'Trung bình', 'Tag ưu tiên dịch sang tiếng Việt');
assert.strictEqual(dataNodes['[data-status-row]'][0].textContent, 'Mới', 'Trạng thái đầu là Mới');
assert.match(dataNodes['[data-received]'][0].textContent, /14\/10\/2026/, 'Thời gian tiếp nhận theo dữ liệu mock');
assert.strictEqual(dataNodes['[data-sla]'][0].textContent, '30 phút', 'SLA lấy từ loại dịch vụ liên kết');
assert.strictEqual(byId.statusPill.dataset.status, 'new', 'Pill trạng thái có data-status');
assert.match(byId.statusPill.className, /status-pill--new/, 'Pill mang lớp theo trạng thái');

/* Nhật ký ban đầu: có mốc tiếp nhận yêu cầu */
assert.match(dataNodes['[data-timeline]'][0].innerHTML, /Tiếp nhận yêu cầu/, 'Nhật ký có mốc tiếp nhận');

/* Nút theo trạng thái: 'new' -> hiện Bắt đầu / Hoàn tất, ẩn Mở lại */
assert.strictEqual(byId.btnProcessing.hidden, false, 'Trạng thái Mới: hiện nút Bắt đầu');
assert.strictEqual(byId.btnProcessing.disabled, false, 'Trạng thái Mới: nút Bắt đầu khả dụng');
assert.strictEqual(byId.btnCompleted.hidden, false, 'Trạng thái Mới: hiện nút Hoàn tất');
assert.strictEqual(byId.btnReopen.hidden, true, 'Trạng thái Mới: ẩn nút Mở lại');

/* ---------- Bấm "Đang xử lý" -> gán người + nhật ký + toast ---------- */
byId.btnProcessing.handlers.click();
assert.strictEqual(dataNodes['[data-status-row]'][0].textContent, 'Đang xử lý', 'Bấm Bắt đầu -> Đang xử lý');
assert.strictEqual(dataNodes['[data-assignee]'][0].textContent, 'Nguyễn Thị Mai Anh', 'Nhận việc hiển thị nhân viên đang đăng nhập');
assert.match(dataNodes['[data-timeline]'][0].innerHTML, /Mới → Đang xử lý/, 'Nhật ký ghi chuyển trạng thái');
assert.strictEqual(byId.toasts.children.length, 1, 'Đổi trạng thái thành công sinh 1 toast');
assert.strictEqual(byId.btnProcessing.hidden, false, 'Sau khi đang xử lý: vẫn hiện nút Bắt đầu');
assert.strictEqual(byId.btnProcessing.disabled, true, 'Sau khi đang xử lý: nút Bắt đầu bị vô hiệu hóa');
assert.ok(dataNodes['[data-status-text]'][0].textContent === 'Đang xử lý', 'Nhãn trạng thái trong pill cập nhật');

/* ---------- Hoàn tất khi chưa ghi chú -> bị chặn ---------- */
byId.btnCompleted.handlers.click();
assert.strictEqual(dataNodes['[data-status-row]'][0].textContent, 'Đang xử lý', 'Thiếu ghi chú thì chặn không cho hoàn tất');
assert.strictEqual(byId.noteError.hidden, false, 'Hiện thông báo lỗi ghi chú');
assert.strictEqual(byId.staffNote.focused, true, 'Đưa tiêu điểm về ô ghi chú');
assert.ok(byId.noteField.classList.contains('is-invalid'), 'Ô ghi chú được đánh dấu lỗi');

/* ---------- Nhập ghi chú rồi hoàn tất -> thành công ---------- */
byId.staffNote.value = '  Đã sửa điều hòa, khách đã kiểm tra và hài lòng.  ';
byId.btnCompleted.handlers.click();
assert.strictEqual(dataNodes['[data-status-row]'][0].textContent, 'Hoàn thành', 'Có ghi chú thì hoàn tất được');
assert.strictEqual(byId.noteError.hidden, true, 'Lỗi ghi chú được ẩn sau khi hoàn tất');
assert.match(dataNodes['[data-timeline]'][0].innerHTML, /Đã sửa điều hòa/, 'Ghi chú được lưu vào nhật ký');
assert.strictEqual(byId.btnReopen.hidden, false, 'Sau khi hoàn tất: hiện nút Mở lại');
assert.strictEqual(byId.btnCompleted.hidden, true, 'Sau khi hoàn tất: ẩn nút Hoàn tất');

/* ---------- Lưu ghi chú riêng ---------- */
const before = byId.toasts.children.length;
byId.staffNote.value = 'Bổ sung thêm 1 remote dự phòng cho khách.';
byId.btnSaveNote.handlers.click();
assert.ok(byId.toasts.children.length > before, 'Lưu ghi chú sinh thêm toast');
assert.match(dataNodes['[data-timeline]'][0].innerHTML, /Bổ sung thêm 1 remote/, 'Ghi chú mới vào nhật ký');

/* ---------- Hàm thuần: pickCode đọc tham số URL ---------- */
const detail = require('./staff-task-detail.js');
assert.strictEqual(detail.pickCode('?code=%23REQ-2026-3001', '#REQ-2026-3002'), '#REQ-2026-3001', 'Đọc mã từ ?code=');
assert.strictEqual(detail.pickCode('', '#REQ-2026-3002'), '#REQ-2026-3002', 'Không có tham số thì dùng mặc định');
assert.strictEqual(detail.formatDateTime('không-phải-ngày'), '—', 'ISO sai trả về dấu gạch');

console.log('✓ detailcheck: đổ dữ liệu, đổi trạng thái, ghi chú và nhật ký đều đạt');