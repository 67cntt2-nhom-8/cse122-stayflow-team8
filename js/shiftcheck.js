/* =========================================================================
   Kiểm tra nhanh js/staff-shift-view.js (không cần framework)
   Chạy:  node js/shiftcheck.js
   Phần A: logic thuần (dải ngày tuần/tháng, chia ca, lọc)
   Phần B: smoke test DOM giả - chạy init() để bắt lỗi runtime/mất id
   ========================================================================= */
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'staff-shift-view.js'), 'utf8');

/* ---------- Phần A: nạp file ở chế độ Node (không có `document`) ----------
   Truyền `require` vào để nhánh dữ liệu dùng require('./data.js'). */
const api = new Function('require', source + `
    return { SHIFT_ORDER, SHIFT_NEED, WEEKDAYS, DEPARTMENTS, shiftFilters, shiftData,
             shiftType, startOfDay, weekStart, addDays, addMonths, dayIndex, isoDate,
             pickForShift, daySchedule, rangeFor, normalize, matchStaff, filterDay, countSlots };
`)(require);

const staff = api.shiftData.staff;

/* --- 1. Dữ liệu mẫu --- */
assert.strictEqual(staff.length, 10, 'Dữ liệu mẫu phải có 10 nhân sự');
assert.strictEqual(api.shiftData.shifts.length, 3, 'Có 3 ca: sáng / chiều / đêm');
assert.strictEqual(staff.filter((s) => s.status === 'Nghỉ').length, 1, 'Có đúng 1 nhân sự đang nghỉ');
assert.deepStrictEqual(api.SHIFT_ORDER, ['morning', 'afternoon', 'night']);
assert.deepStrictEqual(api.DEPARTMENTS, ['Lễ tân', 'Buồng phòng', 'Kỹ thuật']);
assert.strictEqual(api.shiftType('night').name, 'Ca đêm', 'Mã ca phải khớp shifts[].name trong data.js');

/* --- 2. Tuần bắt đầu Thứ Hai; 16/10/2026 là Thứ Sáu --- */
const friday = new Date(2026, 9, 16);
assert.strictEqual(friday.getDay(), 5, '16/10/2026 phải là Thứ Sáu');
assert.strictEqual(api.isoDate(api.weekStart(friday)), '2026-10-12', 'Tuần chứa 16/10 bắt đầu 12/10');
assert.strictEqual(api.isoDate(api.weekStart(new Date(2026, 9, 12))), '2026-10-12', 'Thứ Hai giữ nguyên');

const week = api.rangeFor('week', friday);
assert.strictEqual(week.days.length, 7, 'Chế độ Tuần render đúng 7 ngày');
assert.strictEqual(api.isoDate(week.days[0]), '2026-10-12');
assert.strictEqual(api.isoDate(week.days[6]), '2026-10-18');
assert.strictEqual(week.month, null, 'Chế độ Tuần không có tháng để làm mờ');

/* --- 3. Lưới tháng: trọn tuần, có thể tràn sang tháng kề --- */
const october = api.rangeFor('month', friday);
assert.strictEqual(october.days.length, 35, 'Tháng 10/2026 cần 35 ô');
assert.strictEqual(api.isoDate(october.days[0]), '2026-09-28', 'Ô đầu tiên là Thứ Hai 28/09');
assert.strictEqual(api.isoDate(october.days[34]), '2026-11-01', 'Ô cuối cùng là Chủ nhật 01/11');
assert.strictEqual(october.month, 9, 'Chỉ số tháng neo để làm mờ ngày giáp ranh');

// Tháng 2/2027 trọn 4 tuần (28 ô, không tràn)
assert.strictEqual(api.rangeFor('month', new Date(2027, 1, 10)).days.length, 28, 'Tháng 2/2027 đủ 4 tuần');
// Tháng 8/2026 bắt đầu Thứ Bảy -> 42 ô
assert.strictEqual(api.rangeFor('month', new Date(2026, 7, 15)).days.length, 42, 'Tháng 8/2026 tràn 6 tuần');
// Các ô phải liền nhau
api.rangeFor('month', new Date(2026, 1, 1)).days.forEach((day, i, all) => {
    if (i) {
        assert.strictEqual(day.getTime() - all[i - 1].getTime(), 86400000, 'Các ô phải liền nhau');
    }
});

/* --- 4. addDays / addMonths / dayIndex --- */
assert.strictEqual(api.isoDate(api.addDays(friday, 3)), '2026-10-19');
assert.strictEqual(api.isoDate(api.addMonths(friday, 1)), '2026-11-01', 'Nhảy tháng luôn neo về ngày 1');
assert.strictEqual(api.addMonths(friday, -1).getMonth(), 8);
assert.strictEqual(api.dayIndex(api.addDays(friday, 1)) - api.dayIndex(friday), 1, 'dayIndex đếm theo ngày');

/* --- 5. Xoay ca: ổn định theo ngày, không lặp người trong cùng ngày --- */
assert.deepStrictEqual(api.pickForShift(['a', 'b', 'c'], 2, 0), ['a', 'b']);
assert.deepStrictEqual(api.pickForShift(['a', 'b', 'c'], 2, 1), ['b', 'c']);
assert.deepStrictEqual(api.pickForShift(['a', 'b', 'c'], 2, 3), ['a', 'b'], 'Xoay vòng theo modulo');
assert.deepStrictEqual(api.pickForShift(['a', 'b', 'c'], 2, -1), ['c', 'a'], 'Số ngày âm vẫn xoay đúng');
assert.deepStrictEqual(api.pickForShift([], 2, 1), [], 'Nhóm rỗng trả về mảng rỗng');

const day = api.daySchedule(staff, friday);
api.SHIFT_ORDER.forEach((id) => {
    assert.strictEqual(day.slots[id].length, api.SHIFT_NEED[id],
        'Ca ' + id + ' phải đủ ' + api.SHIFT_NEED[id] + ' người');
});
assert.strictEqual(api.countSlots(day), 5, 'Một ngày có 2+2+1 = 5 lượt trực');

const again = api.daySchedule(staff, friday);
assert.deepStrictEqual(again.slots, day.slots, 'Mở lại cùng ngày phải ra đúng lịch cũ (rota ổn định)');
const tomorrow = api.daySchedule(staff, api.addDays(friday, 1));
assert.notStrictEqual(tomorrow.slots.morning[0].id, day.slots.morning[0].id, 'Sang ngày mới ca sáng đổi người');

const onDuty = api.SHIFT_ORDER.flatMap((id) => day.slots[id].map((m) => m.id));
assert.ok(!onDuty.includes('STF004'), 'Nhân sự `Nghỉ` không được xếp ca');
assert.strictEqual(new Set(onDuty).size, onDuty.length, 'Mỗi người chỉ trực 1 ca trong ngày');
assert.strictEqual(api.daySchedule([], friday).slots.night.length, 0, 'Không có dữ liệu thì ca rỗng');

/* --- 6. Chuẩn hoá + đối chiếu bộ lọc --- */
assert.strictEqual(api.normalize(null), '');
assert.strictEqual(api.normalize('ĐỖ Thị'), 'đỗ thị');
assert.strictEqual(api.matchStaff(staff[2], { query: 'hoàng', department: 'all', shift: 'all' }), true);
assert.strictEqual(api.matchStaff(staff[2], { query: '  ', department: 'all', shift: 'all' }), true,
    'Từ khoá chỉ có khoảng trắng coi như bỏ lọc');
assert.strictEqual(api.matchStaff(staff[2], { query: '', department: 'Lễ tân', shift: 'all' }), false);

/* Ngày giả để kiểm tra bộ lọc một cách tất định */
const sample = {
    date: friday,
    slots: {
        morning: [staff[0], staff[1]],   // STF001 Lễ tân · STF002 Buồng phòng
        afternoon: [staff[2], staff[9]], // STF003 Kỹ thuật · STF010 Lễ tân
        night: [staff[6]]                // STF007 Kỹ thuật
    }
};

api.shiftFilters.department = 'Lễ tân';
const reception = api.filterDay(sample, api.shiftFilters);
assert.deepStrictEqual(reception.slots.morning.map((m) => m.id), ['STF001']);
assert.deepStrictEqual(reception.slots.afternoon.map((m) => m.id), ['STF010']);
assert.deepStrictEqual(reception.slots.night, [], 'Ca không còn ai khớp thì rỗng nhưng vẫn hiện');
api.shiftFilters.department = 'all';

api.shiftFilters.query = 'thu hà';
const byName = api.filterDay(sample, api.shiftFilters);
assert.deepStrictEqual(byName.slots.afternoon.map((m) => m.id), ['STF010'],
    'Tìm theo tên không phân biệt hoa thường');
assert.deepStrictEqual(byName.slots.morning, []);
api.shiftFilters.query = '';

api.shiftFilters.shift = 'afternoon';
const onlyAfternoon = api.filterDay(sample, api.shiftFilters);
assert.strictEqual(onlyAfternoon.slots.morning, null, 'Ca không chọn trả về null để ẩn hẳn');
assert.strictEqual(onlyAfternoon.slots.night, null);
assert.strictEqual(api.countSlots(onlyAfternoon), 2, 'countSlots chỉ đếm ca đang hiện');
api.shiftFilters.shift = 'all';
assert.strictEqual(api.countSlots(api.filterDay(sample, api.shiftFilters)), 5, 'Bỏ lọc thì về đủ 5 lượt');

console.log('✓ shiftcheck A: 6 nhóm kiểm tra logic thuần đều đạt');

/* =========================================================================
   Phần B: smoke test trên DOM giả của pages/staff-shift-view.html
   ========================================================================= */
const html = fs.readFileSync(path.join(__dirname, '..', 'pages', 'staff-shift-view.html'), 'utf8');

/* DOM giả tối thiểu - cùng kiểu với js/domcheck.js */
function el(tag) {
    return {
        tagName: tag,
        dataset: {},
        classes: new Set(),
        attributes: {},
        className: '',
        innerHTML: '',
        textContent: '',
        value: '',
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
        closest: function () { return null; },
        addEventListener: function (type, handler) {
            this.handlers = this.handlers || {};
            this.handlers[type] = handler;
        },
    };
}

/* Mỗi id trong trang có một phần tử giả */
const byId = {};
html.replace(/id="([^"]+)"/g, (_, id) => { byId[id] = el('div'); return ''; });

['schedGrid', 'shiftRange', 'shiftSummary', 'prevBtn', 'nextBtn', 'todayBtn',
    'shiftFilterForm', 'shiftSearch', 'filterDepartment', 'filterShiftType']
    .forEach((id) => assert.ok(byId[id], 'pages/staff-shift-view.html thiếu #' + id));

/* Hai nút gạt Tuần/Tháng không có id, được tìm qua [data-mode] */
const modeButtons = ['week', 'month'].map((mode) => {
    const button = el('button');
    button.dataset.mode = mode;
    return button;
});

const document = {
    addEventListener: (type, handler) => { if (type === 'DOMContentLoaded') document.ready = handler; },
    querySelector: (selector) => (selector[0] === '#' ? byId[selector.slice(1)] || null : null),
    querySelectorAll: (selector) => (selector === '[data-mode]' ? modeButtons : []),
};

/* Trình duyệt lấy value của <select> theo <option> đầu tiên (value="all") */
byId.filterDepartment.value = 'all';
byId.filterShiftType.value = 'all';

new Function('document', 'window', 'require', source)(
    document, { StayFlowData: require('./data.js') }, require
);
document.ready();  // mô phỏng DOMContentLoaded

const grid = byId.schedGrid;
const count = (text, pattern) => (text.match(pattern) || []).length;

/* --- 7. Chế độ Tuần là mặc định --- */
assert.strictEqual(grid.className, 'sched', 'Mở trang mặc định ở chế độ Tuần');
assert.strictEqual(count(grid.innerHTML, /class="day-card[" ]/g), 7, 'Tuần render 7 thẻ ngày');
assert.strictEqual(count(grid.innerHTML, /class="slot slot--/g), 21, '7 ngày x 3 ca = 21 khối ca');
assert.strictEqual(count(grid.innerHTML, /class="member"/g), 35, '7 ngày x 5 lượt trực = 35 dòng nhân sự');
assert.strictEqual(count(grid.innerHTML, /is-today/g), 1, 'Đúng một ngày được đánh dấu Hôm nay');
assert.match(byId.shiftRange.textContent, /^Tuần \d+\/\d+ – \d+\/\d+\/\d{4}$/, 'Nhãn kỳ đang xem');
assert.match(byId.shiftSummary.textContent, /^35\/35 lượt trực/, 'Tóm tắt: 7 ngày x 5 lượt trực');
assert.match(byId.shiftSummary.textContent, / 9 nhân sự$/, 'Cả 9 nhân sự đang trực đều có ca trong tuần');
assert.strictEqual(modeButtons[0].classes.has('is-active'), true, 'Nút Tuần được đánh dấu đang chọn');
assert.strictEqual(modeButtons[0].attributes['aria-pressed'], 'true');
assert.ok(!grid.innerHTML.includes('Phạm Thị Hương'), 'Nhân sự đang nghỉ không xuất hiện trên lịch');

/* --- 8. Chuyển sang chế độ Tháng --- */
modeButtons[1].handlers.click();
assert.strictEqual(grid.className, 'sched sched--month', 'Lưới tháng thêm lớp sched--month');
assert.strictEqual(modeButtons[1].classes.has('is-active'), true, 'Nút Tháng được đánh dấu đang chọn');
assert.strictEqual(modeButtons[0].classes.has('is-active'), false);
assert.strictEqual(modeButtons[0].attributes['aria-pressed'], 'false');
assert.match(byId.shiftRange.textContent, /^Tháng \d+\/\d{4}$/, 'Nhãn kỳ ở chế độ Tháng');

const cells = count(grid.innerHTML, /class="mcell[" ]/g);
assert.ok(cells % 7 === 0 && cells >= 28 && cells <= 42, 'Lưới tháng trọn tuần (28-42 ô), thực tế ' + cells);
assert.strictEqual(count(grid.innerHTML, /class="pill pill--/g), cells * 3, 'Mỗi ô có 3 nhãn ca');
assert.strictEqual(count(grid.innerHTML, /data-date="\d{4}-\d{2}-\d{2}"/g), cells,
    'Mỗi ô mang data-date để bấm mở tuần');

/* --- 9. Bấm một ô ngày -> mở tuần chứa ngày đó --- */
const cell = el('button');
cell.dataset.date = '2026-10-16';
cell.closest = (selector) => (selector === '[data-date]' ? cell : null);
grid.handlers.click({ target: cell });
assert.strictEqual(grid.className, 'sched', 'Bấm ô ngày phải quay về chế độ Tuần');
assert.match(byId.shiftRange.textContent, /^Tuần 12\/10 – 18\/10\/2026$/, 'Mở đúng tuần chứa 16/10/2026');

/* --- 10. Nút Trước / Hôm nay / Sau --- */
const label = byId.shiftRange.textContent;
byId.nextBtn.handlers.click();
assert.match(byId.shiftRange.textContent, /^Tuần 19\/10 – 25\/10\/2026$/, 'Nút Sau nhảy đúng 1 tuần');
byId.prevBtn.handlers.click();
assert.strictEqual(byId.shiftRange.textContent, label, 'Nút Trước trả về kỳ cũ');

modeButtons[1].handlers.click();
const monthLabel = byId.shiftRange.textContent;
byId.nextBtn.handlers.click();
assert.notStrictEqual(byId.shiftRange.textContent, monthLabel, 'Ở chế độ Tháng, nút Sau nhảy sang tháng kế');
modeButtons[0].handlers.click();

byId.nextBtn.handlers.click();
byId.todayBtn.handlers.click();
assert.match(byId.shiftRange.textContent, /^Tuần /, 'Nút Hôm nay đưa về tuần hiện tại');

/* --- 11. Bộ lọc qua sự kiện thật của trang --- */
const search = byId.shiftSearch;
search.handlers.input({ target: { value: 'mai anh' } });
assert.match(byId.shiftSummary.textContent, / 1 nhân sự$/, 'Tìm "mai anh" chỉ còn 1 nhân sự');
assert.match(byId.shiftSummary.textContent, /\/35 lượt trực/, 'Tổng số lượt không đổi khi lọc theo tên');
search.handlers.input({ target: { value: '' } });

const department = byId.filterDepartment;
department.value = 'Kỹ thuật';
department.handlers.change({ target: department });
assert.ok(/<small>Kỹ thuật/.test(grid.innerHTML), 'Có ca của bộ phận Kỹ thuật');
assert.ok(!/<small>Lễ tân|<small>Buồng phòng/.test(grid.innerHTML), 'Chỉ còn nhân sự bộ phận Kỹ thuật');
department.value = 'all';
department.handlers.change({ target: department });

const shiftSelect = byId.filterShiftType;
shiftSelect.value = 'night';
shiftSelect.handlers.change({ target: shiftSelect });
assert.strictEqual(count(grid.innerHTML, /class="slot slot--/g), 7, 'Chọn ca đêm: 7 ngày x 1 ca');
assert.ok(!/slot--morning|slot--afternoon/.test(grid.innerHTML), 'Ca không chọn bị ẩn hẳn');
assert.match(byId.shiftSummary.textContent, /^7\/35 lượt trực/, '7 lượt đang hiện trên tổng 35 lượt');
shiftSelect.value = 'all';
shiftSelect.handlers.change({ target: shiftSelect });
assert.match(byId.shiftSummary.textContent, /^35\/35 lượt trực/, 'Bỏ hết lọc thì về đủ 35 lượt');

/* Enter trong ô tìm kiếm không được tải lại trang */
let prevented = false;
byId.shiftFilterForm.handlers.submit({ preventDefault: () => { prevented = true; } });
assert.strictEqual(prevented, true, 'Submit bộ lọc phải preventDefault');

console.log('✓ shiftcheck B: render tuần/tháng, chuyển kỳ, bấm ô ngày và bộ lọc đều đạt');

/* --- 12. Class riêng của màn hình này (section 11 + JS render) phải có CSS --- */
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'staff.css'), 'utf8');

/* Phần khung trang dùng chung với staff-task-board.html nên không kiểm tra lại ở đây */
const shiftClasses = [
    // markup của trang
    'seg', 'seg__btn', 'sched-bar', 'sched-nav', 'sched-range', 'sched', 'sched--month',
    'legend__item--morning', 'legend__item--afternoon', 'legend__item--night',
    // chế độ Tuần (dayCardHTML / slotHTML / memberHTML)
    'day-card', 'day-card__head', 'day-card__date', 'tag-today',
    'slot', 'slot--morning', 'slot--afternoon', 'slot--night',
    'slot__head', 'slot__name', 'slot__time', 'slot__empty',
    'members', 'member', 'member__text', 'avatar',
    // chế độ Tháng (monthCellHTML)
    'mcell', 'mcell__head', 'mcell__dow', 'mcell__list',
    'pill', 'pill--morning', 'pill--afternoon', 'pill--night',
    // class trạng thái
    'is-today', 'is-out', 'is-zero'
];

const missing = shiftClasses.filter((name) => !css.includes('.' + name));
assert.deepStrictEqual(missing, [], 'Các class này chưa có rule trong css/staff.css');

/* Tên class JS render ra phải khớp đúng danh sách trên (bắt lỗi gõ sai) */
const rendered = new Set();
grid.innerHTML.replace(/class="([^"]*)"/g, (_, list) => {
    list.split(/\s+/).filter(Boolean).forEach((name) => rendered.add(name));
    return '';
});
assert.deepStrictEqual([...rendered].filter((name) => !shiftClasses.includes(name)).sort(), [],
    'Chế độ Tuần đang render class lạ, chưa khai báo CSS');

console.log('✓ shiftcheck C: ' + shiftClasses.length + ' class của lịch ca trực đều có CSS tương ứng');

/* --- 13. Mọi id mà js/staff-shift-view.js lấy đều phải tồn tại trong trang --- */
/* JS dùng helper $('#id') lẫn getElementById('id'); bỏ qua selector class như $('.nav') */
const ids = [...source.matchAll(/(getElementById|querySelectorAll?|\$)\(\s*(['"])([^'"]+)\2/g)]
    .map((m) => (m[1] === 'getElementById' ? m[3] : m[3].replace(/^#/, '')))
    .filter((id) => /^[A-Za-z][\w-]*$/.test(id));
assert.ok(ids.length > 0, 'Không đọc được id nào từ js/staff-shift-view.js');
const notInPage = [...new Set(ids)].filter((id) => !html.includes('id="' + id + '"'));
assert.deepStrictEqual(notInPage, [], 'Các id sau thiếu trong pages/staff-shift-view.html');

/* Trang phải có đúng hai nút chuyển chế độ mà JS gắn sự kiện */
assert.match(html, /data-mode="week"/, 'Thiếu nút chế độ Tuần');
assert.match(html, /data-mode="month"/, 'Thiếu nút chế độ Tháng');

console.log('✓ shiftcheck D: ' + new Set(ids).size + ' id nối trang với js/staff-shift-view.js đều khớp');