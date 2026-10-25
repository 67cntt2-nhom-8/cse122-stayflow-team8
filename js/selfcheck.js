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
const load = new Function('require', source + `
    return { tasks, filters, profile, SHIFTS, NEXT_STATUS,
             filterTasks, countByStatus, isOverdue, zoneOf, liveMinutes, applyStatus,
             tasksFromMockData };
`);
const api = load(require);
const mockData = require('./data.js');
const sourceMock = require('../assets/data/stayflow.mock.json');

/* --- 1. Đếm nhiệm vụ theo trạng thái --- */
const counts = api.countByStatus(api.filterTasks(api.tasks, Date.now()));
assert.deepStrictEqual(counts, { new: 1, processing: 2, completed: 1 }, 'Bảng phải phản ánh các nhiệm vụ đã được tạo từ JSON');
assert.strictEqual(api.tasks.length, 4, 'Bảng chỉ hiển thị các nhiệm vụ liên kết có trong JSON');

/* --- 2. Lọc theo ưu tiên --- */
api.filters.priority = 'high';
const highOnly = api.filterTasks(api.tasks, Date.now());
assert.ok(highOnly.every((t) => t.priority === 'high'), 'Lọc ưu tiên cao trả về đúng nhóm');
api.filters.priority = 'all';

/* --- 3. Lọc theo khu vực (tầng 1-4 / 5-14) --- */
api.filters.zone = 'low';
const lowZone = api.filterTasks(api.tasks, Date.now());
assert.ok(lowZone.every((t) => t.floor <= 4), 'Khu vực tầng 1-4 chỉ chứa tầng <= 4');
api.filters.zone = 'all';

/* --- 4. Lọc theo ca của nhân viên được phân công --- */
['morning', 'afternoon', 'night'].forEach((shift) => {
    api.filters.shift = shift;
    const filtered = api.filterTasks(api.tasks, Date.now()).map((task) => task.id).sort();
    const expected = api.tasks.filter((task) => task.assigneeShift === shift).map((task) => task.id).sort();
    assert.deepStrictEqual(filtered, expected, 'Lọc ca chỉ giữ nhiệm vụ của nhân viên thuộc ca đã chọn');
});
api.filters.shift = 'all';

/* --- 5. Tìm kiếm theo mã, phòng, dịch vụ --- */
api.filters.query = '3002';
assert.deepStrictEqual(api.filterTasks(api.tasks, Date.now()).map((t) => t.code), ['#REQ-2026-3002'], 'Tìm theo mã yêu cầu được liên kết');
api.filters.query = 'đặt bữa';
assert.strictEqual(api.filterTasks(api.tasks, Date.now()).length, 2, 'Tìm theo loại dịch vụ liên kết');
api.filters.query = '';

/* --- 6. Khu vực suy ra từ số tầng --- */
assert.strictEqual(api.zoneOf({ floor: 4 }), 'low');
assert.strictEqual(api.zoneOf({ floor: 5 }), 'high');

/* --- 7. Quá hạn --- */
assert.strictEqual(api.isOverdue({ status: 'processing', minutes: -12 }), true);
assert.strictEqual(api.isOverdue({ status: 'completed', minutes: -12 }), false, 'Việc đã xong không tính quá hạn');

/* --- 8. Thời gian sống của nhiệm vụ mới đếm lùi theo thời điểm mở trang --- */
const started = 1_700_000_000_000;
assert.strictEqual(api.liveMinutes({ status: 'new', minutes: 30 }, started, started), 30);
assert.strictEqual(api.liveMinutes({ status: 'new', minutes: 30 }, started + 60000, started), 29,
    'Sau 1 phút, thẻ Mới còn 29 phút');
assert.strictEqual(api.liveMinutes({ status: 'processing', minutes: 30 }, started + 60000, started), 30,
    'Thẻ đang xử lý giữ nguyên thời gian');

/* --- 9. Vòng trạng thái khi bấm nút --- */
assert.strictEqual(api.NEXT_STATUS.new, 'processing');
assert.strictEqual(api.NEXT_STATUS.processing, 'completed');
assert.strictEqual(api.NEXT_STATUS.completed, 'new');

/* --- 10. applyStatus: một quy tắc dùng chung cho cả nút thao tác lẫn kéo & thả --- */
const claimed = { code: '#T1', status: 'new', assignee: null, minutes: 20 };
api.applyStatus(claimed, 'processing');
assert.strictEqual(claimed.assignee, 'Nguyễn Thị Mai Anh', 'Nhận việc thì tự gán cho người đang đăng nhập');

const done = { code: '#T2', status: 'processing', assignee: 'Lan Anh', minutes: -12 };
api.applyStatus(done, 'completed');
assert.strictEqual(done.statusMinutes, 12, 'Việc quá hạn khi xong ghi nhận 12 phút xử lý');
assert.strictEqual(done.minutes, 1, 'Phút còn lại được kéo về mốc tối thiểu 1, không giữ dấu âm');

const reopened = { code: '#T3', status: 'completed', assignee: 'Lan Anh', minutes: -12 };
api.applyStatus(reopened, 'new');
assert.strictEqual(reopened.minutes, 12, 'Mở lại việc quá hạn thì bỏ dấu âm');

console.log('✓ selfcheck: 10 nhóm kiểm tra logic đều đạt');

/* --- 10. Bảng nhân viên dùng cùng bản ghi và quan hệ từ mock JSON --- */
const importedTasks = api.tasksFromMockData(mockData);
assert.strictEqual(importedTasks.length, 4, 'Chỉ hiển thị tác vụ có trong dữ liệu đã liên kết');
assert.ok(importedTasks.every((task) => task.code.startsWith('#REQ-')), 'Mã trên bảng được tạo từ ID yêu cầu JSON');
assert.strictEqual(importedTasks.find((task) => task.code === '#REQ-2026-3001').guest, 'Nguyễn Thu Hà',
    'Thông tin khách lấy theo stayId liên kết trong JSON');
assert.strictEqual(importedTasks.find((task) => task.code === '#REQ-2026-3002').service, 'Gọi dọn phòng',
    'Tên dịch vụ lấy theo serviceTypeId liên kết trong JSON');
console.log('✓ selfcheck: dữ liệu mock JSON nối với bảng nhiệm vụ');

/* --- 11. Nhân viên, khách và tài khoản mẫu phải liên kết nhất quán --- */
assert.strictEqual(sourceMock.staff.length, 12, 'Mock có 12 hồ sơ nhân viên gồm Staff/Manager/Admin');
assert.strictEqual(mockData.staff.length, 10, 'Lịch nhân viên chỉ dùng 10 nhân viên vận hành');
assert.strictEqual(mockData.stays.length, 4, 'Mock có 4 hồ sơ khách lưu trú');
assert.strictEqual(mockData.users.length, 16, 'Mỗi hồ sơ nhân viên và khách có một tài khoản demo');
assert.strictEqual(mockData.users.filter((user) => user.active).length, 16,
    'Các tài khoản demo ban đầu được kích hoạt');
assert.strictEqual(new Set(mockData.users.map((user) => user.personId)).size, 16,
    'Không có hồ sơ nào bị gắn nhiều tài khoản');
assert.ok(mockData.users.every((user) =>
    sourceMock.staff.some((person) => person.id === user.personId) ||
    sourceMock.stays.some((stay) => stay.guestId === user.personId)),
'Mọi tài khoản phải liên kết đến hồ sơ nhân viên hoặc khách có thật');
const contacts = sourceMock.staff.map((person) => person.email)
    .concat(sourceMock.stays.map((stay) => stay.guestEmail)).filter(Boolean);
assert.strictEqual(new Set(contacts.map((contact) => contact.toLowerCase())).size, contacts.length,
    'Email nhân viên và khách không bị trùng');
assert.strictEqual(mockData.users.filter((user) => user.role === 'Admin').length, 1,
    'Có đúng một tài khoản quản trị mẫu');
console.log('✓ selfcheck: nhân viên, khách và tài khoản demo liên kết nhất quán');