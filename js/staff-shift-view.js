/* =========================================================================
   StayFlow – Lịch ca trực của nhân sự vận hành (pages/staff-shift-view.html)
   -------------------------------------------------------------------------
   Cấu trúc file:
     1) Hằng số + dữ liệu          (thuần, chạy được trong Node để self-check)
     2) Hàm nghiệp vụ thuần         (dải ngày tuần/tháng, chia ca, lọc)
     3) Lớp DOM/UI                  (render lịch, chuyển kỳ, lọc theo bộ phận)
   Phần (1)+(2) không đụng tới DOM nên js/selfcheck.js nạp trực tiếp.
   Phần (3) chỉ chạy khi có `document` (trình duyệt).
   ========================================================================= */
'use strict';

/* ========================================================================
   1) HẰNG SỐ + DỮ LIỆU
   ======================================================================== */

/* Thứ tự ca trong ngày; khoá khớp shifts[].id trong js/data.js */
const SHIFT_ORDER = ['morning', 'afternoon', 'night'];

/* Số người cần cho mỗi ca */
const SHIFT_NEED = { morning: 2, afternoon: 2, night: 1 };

/* Nhãn thứ; tuần làm việc bắt đầu từ Thứ Hai */
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAYS_FULL = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];

/* Bộ phận có thể lọc (khớp staff[].role trong js/data.js) */
const DEPARTMENTS = ['Lễ tân', 'Buồng phòng', 'Kỹ thuật'];

/* Bộ lọc hiện tại: tên nhân viên · bộ phận · ca */
const shiftFilters = { query: '', department: 'all', shift: 'all' };

/* Dữ liệu tra cứu: js/data.js -> window.StayFlowData (trình duyệt) / require (Node) */
const shiftData = (typeof window !== 'undefined' && window.StayFlowData) ||
    (typeof require === 'function' ? require('./data.js') : null) ||
    { staff: [], shifts: [] };

const DAY_MS = 86400000;

/* ========================================================================
   2) HÀM NGHIỆP VỤ THUẦN (không đụng DOM)
   ======================================================================== */

/* Định nghĩa ca (tên + giờ) lấy từ js/data.js */
function shiftType(id) {
    const found = ((shiftData && shiftData.shifts) || []).find(function (item) {
        return item.id === id;
    });
    return found || { id: id, name: id, start: '--:--', end: '--:--' };
}

/* ---------- Mốc thời gian ---------- */
function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

/* Thứ Hai của tuần chứa `date` */
function weekStart(date) {
    const d = startOfDay(date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
}

function addDays(date, amount) {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return d;
}

function addMonths(date, amount) {
    const d = new Date(date);
    d.setDate(1);
    d.setMonth(d.getMonth() + amount);
    return d;
}

/* Số ngày tuyệt đối – dùng làm "hạt giống" xoay ca nên lịch luôn ổn định */
function dayIndex(date) {
    return Math.floor(startOfDay(date).getTime() / DAY_MS);
}

function isoDate(date) {
    const d = startOfDay(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

/* ---------- Chia ca ---------- */

/* Chọn `needed` người trong nhóm cùng ca, mỗi ngày dịch một người */
function pickForShift(pool, needed, day) {
    if (!pool || !pool.length) {
        return [];
    }
    const offset = ((day % pool.length) + pool.length) % pool.length;
    const ordered = pool.slice(offset).concat(pool.slice(0, offset));
    return ordered.slice(0, needed);
}

/* Lịch một ngày: 3 ca, bỏ qua nhân sự đang nghỉ */
function daySchedule(staff, date) {
    const available = (staff || []).filter(function (member) {
        return member.status === 'Đang trực';
    });
    const day = dayIndex(date);
    const slots = {};

    SHIFT_ORDER.forEach(function (id) {
        const byShift = available.filter(function (member) {
            return member.shift === shiftType(id).name;
        });
        // Không ai đăng ký ca này (thiếu dữ liệu) -> dùng tạm nhóm còn lại
        const pool = byShift.length ? byShift : available;
        slots[id] = pickForShift(pool, SHIFT_NEED[id], day);
    });

    return { date: startOfDay(date), slots: slots };
}

/* Dải ngày hiển thị: 7 ngày (Tuần) hoặc trọn lưới tháng (Tháng) */
function rangeFor(mode, anchor) {
    if (mode === 'month') {
        const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
        const end = addDays(weekStart(last), 6);
        const days = [];
        for (let d = weekStart(first); d.getTime() <= end.getTime(); d = addDays(d, 1)) {
            days.push(d);
        }
        return { days: days, month: anchor.getMonth() };
    }

    const start = weekStart(anchor);
    const days = [];
    for (let i = 0; i < 7; i += 1) {
        days.push(addDays(start, i));
    }
    return { days: days, month: null };
}

/* ---------- Lọc ---------- */

function normalize(text) {
    return String(text == null ? '' : text).toLowerCase();
}

/* Nhân sự có khớp bộ lọc tên + bộ phận không */
function matchStaff(member, filters) {
    const query = normalize(filters.query).trim();
    if (filters.department !== 'all' && member.role !== filters.department) {
        return false;
    }
    return !query || normalize(member.name).indexOf(query) !== -1;
}

/* Giữ nguyên cấu trúc ngày; ca không được chọn thì trả về null để ẩn */
function filterDay(day, filters) {
    const slots = {};
    SHIFT_ORDER.forEach(function (id) {
        if (filters.shift !== 'all' && filters.shift !== id) {
            slots[id] = null;
            return;
        }
        slots[id] = day.slots[id].filter(function (member) {
            return matchStaff(member, filters);
        });
    });
    return { date: day.date, slots: slots };
}

/* Tổng số lượt trực của một ngày (không tính ca bị ẩn) */
function countSlots(day) {
    return SHIFT_ORDER.reduce(function (total, id) {
        return total + (day.slots[id] ? day.slots[id].length : 0);
    }, 0);
}

/* ========================================================================
   3) LỚP DOM / UI (chỉ chạy khi có `document`)
   ======================================================================== */
if (typeof document !== 'undefined') {
    const TODAY = new Date();

    /* Kỳ đang xem: 'week' | 'month' + mốc neo ngày */
    const view = { mode: 'week', anchor: weekStart(TODAY) };
    let selectedShiftDate = startOfDay(TODAY);

    function $(selector) {
        return document.querySelector(selector);
    }

    /* Escape ký tự HTML để chèn vào innerHTML an toàn */
    function esc(text) {
        return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function dowText(date) {
        return WEEKDAYS[(date.getDay() + 6) % 7];
    }

    function dowFull(date) {
        return WEEKDAYS_FULL[(date.getDay() + 6) % 7];
    }

    function shortDate(date) {
        return date.getDate() + '/' + (date.getMonth() + 1);
    }

    function sameDay(a, b) {
        return startOfDay(a).getTime() === startOfDay(b).getTime();
    }

    function longDate(date) {
        return dowFull(date) + ', ' + date.getDate() + ' tháng ' + (date.getMonth() + 1);
    }

    /* Lấy chữ viết tắt của tên nhân viên */
    function initials(name) {
        if (!name) {
            return '––';
        }
        return String(name).trim().split(/\s+/).slice(-2).map(function (word) {
            return word.charAt(0);
        }).join('').toUpperCase();
    }

    /* Nhãn kỳ đang xem: "Tuần 12/10 – 18/10/2026" hoặc "Tháng 10/2026" */
    function periodLabel() {
        if (view.mode === 'month') {
            return 'Tháng ' + (view.anchor.getMonth() + 1) + '/' + view.anchor.getFullYear();
        }
        const start = weekStart(view.anchor);
        const end = addDays(start, 6);
        return 'Tuần ' + shortDate(start) + ' – ' + shortDate(end) + '/' + end.getFullYear();
    }

    /* Một nhân sự trong ca */
    function memberHTML(member) {
        return '<li class="member">' +
            '<span class="avatar" aria-hidden="true">' + esc(initials(member.name)) + '</span>' +
            '<span class="member__text"><b>' + esc(member.name) + '</b>' +
            '<small>' + esc(member.role) + ' · ' + esc(member.shift) + '</small></span>' +
        '</li>';
    }

    /* Một ca trong ngày; ca bị bộ lọc ẩn (null) thì không render */
    function slotHTML(id, day, tally) {
        const members = day.slots[id];
        if (!members) {
            return '';
        }
        const type = shiftType(id);
        tally.shown += members.length;
        members.forEach(function (member) {
            tally.people.push(member.id);
        });

        return '<section class="slot slot--' + id + '">' +
            '<header class="slot__head">' +
                '<h4 class="slot__name">' + esc(type.name) + '</h4>' +
                '<span class="slot__time">' + esc(type.start) + '–' + esc(type.end) + '</span>' +
            '</header>' +
            (members.length
                ? '<ul class="members">' + members.map(memberHTML).join('') + '</ul>'
                : '<p class="slot__empty">Chưa có ai trực ca này</p>') +
        '</section>';
    }

    /* Thẻ ngày gọn cho dải tuần; nội dung ca chi tiết vẫn giữ trong DOM. */
    function dayCardHTML(date, full, filtered, tally) {
        tally.total += countSlots(full);
        const today = sameDay(date, TODAY);
        const selected = sameDay(date, selectedShiftDate);
        const counts = SHIFT_ORDER.map(function (id) {
            const members = filtered.slots[id];
            return {
                id: id,
                count: members ? members.length : 0,
                label: shiftType(id).name.replace('Ca ', '')
            };
        });

        return '<article class="day-card' + (today ? ' is-today' : '') +
            (selected ? ' is-selected' : '') + '" data-date="' + esc(isoDate(date)) + '">' +
            '<button class="day-card__button" type="button" data-date="' + esc(isoDate(date)) +
                '" aria-pressed="' + (selected ? 'true' : 'false') + '" aria-label="' +
                esc('Chọn ' + longDate(date)) + '">' +
                '<span class="day-card__weekday">' + esc(dowText(date)) + '</span>' +
                '<span class="day-card__number">' + date.getDate() + '</span>' +
                '<span class="day-card__month">' + esc(date.toLocaleDateString('vi-VN', { month: 'short' })) + '</span>' +
                (today ? '<span class="tag-today">Hôm nay</span>' : '') +
                '<span class="day-card__coverage">' + counts.map(function (item) {
                    return '<span class="day-card__shift day-card__shift--' + item.id + '">' +
                        '<i aria-hidden="true"></i>' + esc(item.label) + '<b>' + item.count + '</b></span>';
                }).join('') + '</span>' +
            '</button>' +
            SHIFT_ORDER.map(function (id) {
                return slotHTML(id, filtered, tally);
            }).join('') +
            '</article>';
    }

    /* Ô một ngày ở chế độ Tháng */
    function monthCellHTML(date, full, filtered, month, tally) {
        tally.total += countSlots(full);

        const counts = SHIFT_ORDER.filter(function (id) {
            return filtered.slots[id];
        }).map(function (id) {
            const members = filtered.slots[id];
            tally.shown += members.length;
            members.forEach(function (member) {
                tally.people.push(member.id);
            });
            return { id: id, label: shiftType(id).name.replace('Ca ', ''), count: members.length };
        });

        const today = sameDay(date, TODAY);
        const outside = date.getMonth() !== month;
        const summary = counts.map(function (item) {
            return item.label + ' ' + item.count;
        }).join(', ');

        return '<button class="mcell' + (today ? ' is-today' : '') + (outside ? ' is-out' : '') +
            '" type="button" data-date="' + esc(isoDate(date)) +
            '" aria-label="' + esc(dowFull(date) + ' ' + shortDate(date) + ': ' + summary) + '">' +
            '<span class="mcell__head"><b>' + date.getDate() + '</b>' +
                '<span class="mcell__dow">' + esc(dowText(date)) + '</span></span>' +
            '<span class="mcell__list">' + counts.map(function (item) {
                return '<span class="pill pill--' + item.id + (item.count ? '' : ' is-zero') + '">' +
                    esc(item.label) + '<b>' + item.count + '</b></span>';
            }).join('') + '</span>' +
        '</button>';
    }

    /* Đồng bộ trạng thái nút Tuần/Tháng */
    function syncModeButtons() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function (btn) {
            const active = btn.dataset.mode === view.mode;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function renderShiftDetails(staff) {
        const currentStaff = staff.find(function (member) {
            return normalize(member.name).indexOf('mai anh') !== -1;
        }) || staff.find(function (member) {
            return member.status === 'Đang trực';
        });
        const currentShift = currentStaff && SHIFT_ORDER.find(function (id) {
            return shiftType(id).name === currentStaff.shift;
        });
        const schedule = daySchedule(staff, selectedShiftDate);
        const assigned = currentShift && schedule.slots[currentShift].some(function (member) {
            return currentStaff && member.id === currentStaff.id;
        });
        const shift = currentShift ? shiftType(currentShift) : null;
        const title = $('#currentShiftTitle');
        const dateLabel = $('#selectedShiftDate');
        const status = $('#shiftStatus');
        const details = $('#currentShiftContent');
        const timelineDate = $('#timelineDate');
        const teamList = $('#shiftTeamList');
        const teamCount = $('#teamCount');

        if (title) {
            title.textContent = shift ? shift.name : 'Chưa có ca được phân';
        }
        if (dateLabel) {
            dateLabel.textContent = longDate(selectedShiftDate);
        }
        if (timelineDate) {
            timelineDate.textContent = shortDate(selectedShiftDate);
        }
        if (status) {
            status.textContent = assigned ? 'Có trong lịch' : 'Chưa phân ca';
            status.classList.toggle('is-assigned', Boolean(assigned));
        }
        if (details) {
            details.innerHTML = shift && currentStaff
                ? '<div class="shift-detail-item"><span>Giờ làm việc</span><b>' +
                    esc(shift.start + ' – ' + shift.end) + '</b></div>' +
                  '<div class="shift-detail-item"><span>Bộ phận</span><b>' +
                    esc(currentStaff.role) + '</b></div>' +
                  '<div class="shift-detail-item"><span>Nhân sự theo ca</span><b>' +
                    schedule.slots[currentShift].length + ' người</b></div>'
                : '<p class="shift-empty">Chưa có dữ liệu ca làm việc.</p>';
        }

        const teammates = currentShift ? schedule.slots[currentShift] : [];
        if (teamList) {
            teamList.innerHTML = teammates.map(function (member) {
                return '<li class="team-member">' +
                    '<span class="team-member__avatar" aria-hidden="true">' +
                        esc(initials(member.name)) + '</span>' +
                    '<span class="team-member__text"><b>' + esc(member.name) +
                        (currentStaff && member.id === currentStaff.id ? ' <small>(Bạn)</small>' : '') +
                        '</b><small>' + esc(member.role) + '</small></span>' +
                    '<span class="team-member__status" aria-label="Đang trực"></span>' +
                '</li>';
            }).join('') || '<li class="shift-empty">Chưa có đồng nghiệp được xếp ca.</li>';
        }
        if (teamCount) {
            teamCount.textContent = teammates.length + ' người';
        }
    }

    function updateHandoverProgress() {
        const checks = Array.prototype.slice.call(document.querySelectorAll('.handover-check'));
        const completed = checks.filter(function (check) { return check.checked; }).length;
        const label = $('#handoverProgress');
        const bar = $('#handoverProgressBar');
        if (label) {
            label.textContent = completed + '/' + checks.length;
        }
        if (bar && bar.style) {
            bar.style.width = checks.length ? (completed / checks.length * 100) + '%' : '0%';
        }
    }

    /* ---- Render lịch theo kỳ đang xem ---- */
    function render() {
        const grid = $('#schedGrid');
        if (!grid) {
            return;
        }

        const staff = (shiftData && shiftData.staff) || [];
        const range = rangeFor(view.mode, view.anchor);
        const tally = { total: 0, shown: 0, people: [] };
        const month = view.mode === 'month';

        grid.className = month ? 'sched sched--month' : 'sched';
        grid.innerHTML = range.days.map(function (date) {
            const full = daySchedule(staff, date);
            const filtered = filterDay(full, shiftFilters);
            return month
                ? monthCellHTML(date, full, filtered, range.month, tally)
                : dayCardHTML(date, full, filtered, tally);
        }).join('');

        const rangeEl = $('#shiftRange');
        if (rangeEl) {
            rangeEl.textContent = periodLabel();
        }

        const summaryEl = $('#shiftSummary');
        if (summaryEl) {
            summaryEl.textContent = tally.shown
                ? tally.shown + '/' + tally.total + ' lượt trực · ' + new Set(tally.people).size + ' nhân sự'
                : 'Không có ca trực khớp bộ lọc hiện tại';
        }

        const weekHeading = $('#weekHeading');
        if (weekHeading) {
            weekHeading.textContent = month ? 'Lịch theo tháng' : 'Lịch trong tuần';
        }
        renderShiftDetails(staff);
        syncModeButtons();
    }

    /* ---- Gắn sự kiện ---- */
    function bindControls() {
        function step(direction) {
            view.anchor = view.mode === 'month'
                ? addMonths(view.anchor, direction)
                : addDays(view.anchor, direction * 7);
            if (view.mode === 'week') {
                selectedShiftDate = view.anchor;
            }
            render();
        }

        const prevBtn = $('#prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                step(-1);
            });
        }

        const nextBtn = $('#nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                step(1);
            });
        }

        const todayBtn = $('#todayBtn');
        if (todayBtn) {
            todayBtn.addEventListener('click', function () {
                view.anchor = TODAY;
                render();
            });
        }

        Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function (btn) {
            btn.addEventListener('click', function () {
                view.mode = btn.dataset.mode;
                render();
            });
        });

        const search = $('#shiftSearch');
        if (search) {
            search.addEventListener('input', function (e) {
                shiftFilters.query = (e && e.target && e.target.value) || '';
                render();
            });
        }

        const department = $('#filterDepartment');
        if (department) {
            department.addEventListener('change', function (e) {
                shiftFilters.department = e.target.value;
                render();
            });
        }

        const shift = $('#filterShiftType');
        if (shift) {
            shift.addEventListener('change', function (e) {
                shiftFilters.shift = e.target.value;
                render();
            });
        }

        const form = $('#shiftFilterForm');
        if (form) {
            form.addEventListener('submit', function (e) {
                if (e && e.preventDefault) {
                    e.preventDefault();
                }
            });
        }

        /* Bấm một ô ngày ở chế độ Tháng -> mở tuần chứa ngày đó */
        const grid = $('#schedGrid');
        if (grid) {
            grid.addEventListener('click', function (e) {
                const cell = e.target && e.target.closest ? e.target.closest('[data-date]') : null;
                if (!cell) {
                    return;
                }
                const parts = cell.dataset.date.split('-');
                selectedShiftDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                if (view.mode === 'month') {
                    view.mode = 'week';
                    view.anchor = selectedShiftDate;
                }
                render();
            });
        }

        Array.prototype.forEach.call(document.querySelectorAll('.handover-check'), function (check) {
            check.addEventListener('change', updateHandoverProgress);
        });
        updateHandoverProgress();
    }

    /* ---- Khởi động ---- */
    function init() {
        const search = $('#shiftSearch');
        if (search) {
            shiftFilters.query = search.value;
        }
        const department = $('#filterDepartment');
        if (department) {
            shiftFilters.department = department.value;
        }
        const shift = $('#filterShiftType');
        if (shift) {
            shiftFilters.shift = shift.value;
        }

        bindControls();
        render();
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (window.StayFlowDataReady) {
            window.StayFlowDataReady.then(init).catch(function (error) {
                console.error('Không thể tải dữ liệu lịch ca:', error);
                const grid = $('#schedGrid');
                if (grid) {
                    grid.textContent = 'Không thể tải dữ liệu lịch ca. Hãy kiểm tra assets/data/stayflow.mock.json và chạy trang qua Live Server.';
                }
            });
        } else {
            init();
        }
    });
}