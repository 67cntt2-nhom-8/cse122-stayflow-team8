/* =========================================================================
   Kiểm tra nhanh logic thuần của js/main.js (không cần framework)
   Chạy:  node js/selfcheck.js
   ========================================================================= */
'use strict';

const assert = require('node:assert');
const path = require('node:path');
const source = require('node:fs').readFileSync(path.join(__dirname, 'main.js'), 'utf8');

// Nạp main.js trong Node: phần DOM nằm sau `if (typeof document !== 'undefined')`
// nên chỉ có dữ liệu + hàm thuần được đưa vào phạm vi chạy.
const load = new Function(source + `
    return { tasks, filters, profile, SHIFTS, NEXT_STATUS,
             filterTasks, countByStatus, isOverdue, zoneOf, liveMinutes, applyStatus };
`);
const api = load();

/* --- 1. Đếm nhiệm vụ theo trạng thái --- */
const counts = api.countByStatus(api.filterTasks(api.tasks, Date.now()));
assert.deepStrictEqual(counts, { new: 3, processing: 2, completed: 2 }, 'Số nhiệm vụ mỗi cột phải là 3/2/2');
assert.strictEqual(api.tasks.length, 7, 'Dữ liệu mẫu phải có 7 nhiệm vụ');

/* --- 2. Lọc theo ưu tiên --- */
api.filters.priority = 'high';
const highOnly = api.filterTasks(api.tasks, Date.now());
assert.ok(highOnly.length > 0 && highOnly.every((t) => t.priority === 'high'), 'Lọc ưu tiên cao trả về đúng nhóm');
api.filters.priority = 'all';

/* --- 3. Lọc theo khu vực (tầng 1-4 / 5-14) --- */
api.filters.zone = 'low';
const lowZone = api.filterTasks(api.tasks, Date.now());
assert.ok(lowZone.every((t) => t.floor <= 4), 'Khu vực tầng 1-4 chỉ chứa tầng <= 4');
api.filters.zone = 'all';

/* --- 4. Tìm kiếm theo mã, phòng, dịch vụ --- */
api.filters.query = '3192';
assert.deepStrictEqual(api.filterTasks(api.tasks, Date.now()).map((t) => t.code), ['#SF-3192'], 'Tìm theo mã nhiệm vụ');
api.filters.query = 'kỹ thuật';
assert.strictEqual(api.filterTasks(api.tasks, Date.now()).length, 2, 'Tìm theo loại dịch vụ (không phân biệt hoa thường)');
api.filters.query = '';

/* --- 5. Khu vực suy ra từ số tầng --- */
assert.strictEqual(api.zoneOf({ floor: 4 }), 'low');
assert.strictEqual(api.zoneOf({ floor: 5 }), 'high');

/* --- 6. Quá hạn --- */
assert.strictEqual(api.isOverdue({ status: 'processing', minutes: -12 }), true);
assert.strictEqual(api.isOverdue({ status: 'completed', minutes: -12 }), false, 'Việc đã xong không tính quá hạn');

/* --- 7. Thời gian sống của nhiệm vụ mới đếm lùi theo thời điểm mở trang --- */
const started = 1_700_000_000_000;
assert.strictEqual(api.liveMinutes({ status: 'new', minutes: 30 }, started, started), 30);
assert.strictEqual(api.liveMinutes({ status: 'new', minutes: 30 }, started + 60000, started), 29,
    'Sau 1 phút, thẻ Mới còn 29 phút');
assert.strictEqual(api.liveMinutes({ status: 'processing', minutes: 30 }, started + 60000, started), 30,
    'Thẻ đang xử lý giữ nguyên thời gian');

/* --- 8. Vòng trạng thái khi bấm nút --- */
assert.strictEqual(api.NEXT_STATUS.new, 'processing');
assert.strictEqual(api.NEXT_STATUS.processing, 'completed');
assert.strictEqual(api.NEXT_STATUS.completed, 'new');

/* --- 9. applyStatus: một quy tắc dùng chung cho cả nút thao tác lẫn kéo & thả --- */
const claimed = { code: '#T1', status: 'new', assignee: null, minutes: 20 };
api.applyStatus(claimed, 'processing');
assert.strictEqual(claimed.assignee, 'Minh Anh', 'Nhận việc thì tự gán cho người đang đăng nhập');

const done = { code: '#T2', status: 'processing', assignee: 'Lan Anh', minutes: -12 };
api.applyStatus(done, 'completed');
assert.strictEqual(done.statusMinutes, 12, 'Việc quá hạn khi xong ghi nhận 12 phút xử lý');
assert.strictEqual(done.minutes, 1, 'Phút còn lại được kéo về mốc tối thiểu 1, không giữ dấu âm');

const reopened = { code: '#T3', status: 'completed', assignee: 'Lan Anh', minutes: -12 };
api.applyStatus(reopened, 'new');
assert.strictEqual(reopened.minutes, 12, 'Mở lại việc quá hạn thì bỏ dấu âm');

console.log('✓ selfcheck: 9 nhóm kiểm tra logic đều đạt');
