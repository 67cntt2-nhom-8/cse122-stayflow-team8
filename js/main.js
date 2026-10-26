/* =========================================================================
   StayFlow – Bảng nhiệm vụ buồng phòng (Kanban theo ca làm việc)
   -------------------------------------------------------------------------
   Cấu trúc file:
     1) Dữ liệu + hằng số        (thuần, chạy được trong Node để self-check)
     2) Hàm nghiệp vụ thuần       (filterTasks, countByStatus, applyStatus...)
     3) Lớp DOM/UI                (render, lọc, kéo & thả, modal, toast)
   Phần (1)+(2) không đụng tới DOM nên js/selfcheck.js nạp trực tiếp.
   Phần (3) chỉ chạy khi có `document` (trình duyệt hoặc DOM giả ở domcheck).
   ========================================================================= */
'use strict';

/* ========================================================================
   1) DỮ LIỆU + HẰNG SỐ
   ======================================================================== */

/* Ánh xạ trạng thái nghiệp vụ trong dữ liệu (tiếng Việt) -> trạng thái cột */
const STATUS_LABELS = {
    new: 'Chờ nhận',
    processing: 'Đang làm',
    completed: 'Hoàn tất'
};

/* Nhãn tiếng Việt hiển thị cho cột Kanban */
const STATUS_TEXT = {
    new: 'Mới',
    processing: 'Đang xử lý',
    completed: 'Hoàn thành'
};

/* Ca làm việc */
const SHIFTS = {
    morning: { label: 'Ca sáng', time: '06:00-14:00' },
    afternoon: { label: 'Ca chiều', time: '14:00-22:00' },
    night: { label: 'Ca đêm', time: '22:00-06:00' }
};

/* Vòng đời nhiệm vụ khi bấm nút / kéo thả */
const NEXT_STATUS = {
    new: 'processing',
    processing: 'completed',
    completed: 'new'
};

/* Nhãn nút hành động tương ứng với trạng thái đích */
const ACTION_TEXT = {
    processing: 'Nhận việc',
    completed: 'Hoàn thành',
    new: 'Mở lại'
};

/* Ưu tiên -> nhãn hiển thị tiếng Việt */
const PRIORITY = {
    high: { label: 'Cao', data: 'Cao' },
    medium: { label: 'Trung bình', data: 'Trung bình' },
    low: { label: 'Thấp', data: 'Thấp' }
};

/* Nhân viên đang đăng nhập (mô phỏng phiên làm việc) */
const profile = {
    id: 'STF-001',
    name: 'Nguyễn Thị Mai Anh',
    fullName: 'Nguyễn Thị Mai Anh',
    role: 'Nhân viên',
    shift: 'Ca sáng'
};

/* Trạng thái lọc hiện tại (dùng chung cho mọi lần render) */
const filters = {
    query: '',
    priority: 'all',
    zone: 'all',
    shift: 'all'
};

const tasks = [];

/* Chuyển nhiệm vụ đã liên kết sang bản ghi mà bảng Kanban cần. */
function tasksFromMockData(source) {
    const stays = new Map(source.stays.map(function (stay) { return [stay.id, stay]; }));
    const services = new Map(source.serviceTypes.map(function (service) { return [service.id, service]; }));
    const staff = new Map(source.staff.map(function (person) { return [person.id, person]; }));
    const requests = new Map(source.requests.map(function (request) { return [request.id, request]; }));
    const statusMap = { 'Chờ nhận': 'new', 'Đang làm': 'processing', 'Chờ khách': 'processing', 'Hoàn tất': 'completed' };
    const priorityMap = { 'Cao': 'high', 'Trung bình': 'medium', 'Thấp': 'low' };
    const shiftMap = { 'Ca sáng': 'morning', 'Ca chiều': 'afternoon', 'Ca đêm': 'night' };
    const now = Date.parse(source.clock) || Date.now();

    return source.tasks.filter(function (task) {
        const request = requests.get(task.requestId);
        return request && request.status !== 'Đã hủy';
    }).map(function (task) {
        const request = requests.get(task.requestId);
        const stay = stays.get(request.stayId);
        const service = services.get(request.serviceTypeId);
        const assignee = staff.get(task.staffId);
        if (!stay || !service || !statusMap[task.status] || !priorityMap[request.priority]) {
            throw new Error('Nhiệm vụ ' + task.id + ' thiếu liên kết hợp lệ hoặc trạng thái không được hỗ trợ.');
        }
        const dueAt = Date.parse(request.dueAt);
        const sla = Number(service.expectedSLA) || 30;
        const minutes = Number.isFinite(dueAt) ? Math.floor((dueAt - now) / 60000) : sla;
        const floor = Math.floor(Number(stay.roomNumber) / 100) || 1;

        return {
            id: task.id,
            requestId: request.id,
            code: '#' + request.id,
            title: request.title,
            room: stay.roomNumber,
            floor: floor,
            guest: stay.guestName,
            service: service.categoryName,
            department: service.department,
            sla: sla,
            status: statusMap[task.status],
            priority: priorityMap[request.priority],
            assignee: assignee ? assignee.name : null,
            minutes: minutes,
            receivedAt: request.createdAt,
            dueAt: request.dueAt,
            note: request.content,
            reason: task.ai_priority_reason || request.ai_priority_reason || '',
            staffId: task.staffId || null,
            assigneeShift: assignee ? shiftMap[assignee.shift] : null
        };
    });
}

/* Dữ liệu tra cứu: nhân viên, loại dịch vụ, lưu trú, yêu cầu, phản hồi */
const mockData = (typeof window !== 'undefined' && window.StayFlowData) ||
    (typeof require === 'function' ? require('./data.js') : null) ||
    { staff: [], serviceTypes: [], stays: [], requests: [], tasks: [], feedback: [] };
if ((typeof window === 'undefined' || !window.StayFlowDataReady) && mockData) {
    tasks.push.apply(tasks, tasksFromMockData(mockData));
}

/* ========================================================================
   2) HÀM NGHIỆP VỤ THUẦN (không đụng DOM)
   ======================================================================== */

/* Khu vực suy ra từ số tầng: 1-4 là "low", 5 trở lên là "high" */
function zoneOf(task) {
    return task && task.floor >= 5 ? 'high' : 'low';
}

/* Chuẩn hoá chuỗi để so khớp không phân biệt hoa/thường & dấu */
function normalize(text) {
    return String(text == null ? '' : text).toLowerCase();
}

/* Nhiệm vụ có quá hạn không: đang xử lý và thời gian còn lại < 0 */
function isOverdue(task) {
    if (!task || task.status === 'completed') {
        return false;
    }
    return Number(task.minutes) < 0;
}

/* Thời gian sống của nhiệm vụ, đếm lùi theo thời điểm mở trang.
   - Thẻ "new": cứ mỗi phút trôi qua thì thời gian còn lại giảm 1 phút.
   - Các trạng thái khác: giữ nguyên giá trị minutes. */
function liveMinutes(task, now, startedAt) {
    const base = Number(task && task.minutes) || 0;
    if (!task || task.status !== 'new') {
        return base;
    }
    const elapsed = Math.floor((Number(now || 0) - Number(startedAt || 0)) / 60000);
    return base - (elapsed > 0 ? elapsed : 0);
}

/* Lọc danh sách nhiệm vụ theo bộ lọc hiện tại */
function filterTasks(list, now, startedAt) {
    const query = normalize(filters.query).trim();

    return (list || []).filter(function (task) {
        // Ưu tiên
        if (filters.priority !== 'all' && task.priority !== filters.priority) {
            return false;
        }
        if (filters.shift !== 'all' && task.assigneeShift !== filters.shift) {
            return false;
        }
        // Khu vực theo tầng
        if (filters.zone !== 'all' && zoneOf(task) !== filters.zone) {
            return false;
        }
        // Từ khoá: mã, số phòng, tên dịch vụ, tiêu đề, tên khách
        if (query) {
            const haystack = [
                task.code, task.room, task.service, task.title, task.guest
            ].map(normalize).join(' ');
            if (haystack.indexOf(query) === -1) {
                return false;
            }
        }
        return true;
    });
}

/* Đếm số nhiệm vụ theo từng trạng thái cột */
function countByStatus(list) {
    const counts = { new: 0, processing: 0, completed: 0 };
    (list || []).forEach(function (task) {
        if (counts[task.status] === undefined) {
            counts[task.status] = 0;
        }
        counts[task.status] += 1;
    });
    return counts;
}

/* Áp dụng một trạng thái mới cho nhiệm vụ.
   Đây là quy tắc dùng chung cho CẢ nút thao tác lẫn kéo & thả. */
function applyStatus(task, status) {
    if (!task || !STATUS_LABELS[status]) {
        return task;
    }

    const wasOverdue = Number(task.minutes) < 0;

    // Nhận việc: tự gán cho người đang đăng nhập nếu chưa có ai
    if (status === 'processing' && !task.assignee) {
        task.assignee = profile.name;
    }

    // Hoàn thành khi đã quá hạn: ghi nhận số phút xử lý thực tế
    if (status === 'completed' && wasOverdue) {
        const worked = Math.abs(Number(task.minutes));
        task.statusMinutes = worked || 1;
        task.minutes = 1; // không giữ dấu âm
    }

    // Mở lại việc đã quá hạn: bỏ dấu âm của thời gian
    if (status === 'new' && wasOverdue) {
        task.minutes = Math.abs(Number(task.minutes));
    }

    // Mọi trường hợp còn lại: không để thời gian âm lộ ra ngoài
    if (status !== 'completed' && status !== 'new' && Number(task.minutes) < 0) {
        task.minutes = 1;
    }

    task.status = status;
    return task;
}

function saveTask(task, note) {
    if (typeof window === 'undefined' || !window.StayFlowStore) {
        return;
    }
    const staffId = task.staffId || profile.id;
    window.StayFlowStore.updateStaffTask(task.id, task.status, staffId, note);
    task.staffId = staffId;
    if (!task.assignee) {
        const person = window.StayFlowData.staff.find(function (item) { return item.id === staffId; });
        task.assignee = person ? person.name : profile.name;
    }
}

/* Đổi trạng thái theo vòng NEXT_STATUS (dùng cho nút trên thẻ/modal) */
function advanceStatus(task) {
    return applyStatus(task, NEXT_STATUS[task.status]);
}

/* Tìm nhiệm vụ theo mã */
function findTask(code) {
    return tasks.find(function (task) {
        return task.code === code || task.id === code;
    }) || null;
}

/* ========================================================================
   3) LỚP DOM / UI  (chỉ chạy khi có `document`)
   ======================================================================== */
if (typeof document !== 'undefined') {
    /* Thời điểm mở trang: dùng để đếm lùi thời gian thẻ "new" */
    const STARTED_AT = Date.now();

    /* Truy vấn an toàn: dùng querySelector để hợp với cả DOM thật lẫn DOM giả */
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

    /* Định dạng số phút còn lại thành nhãn thời gian */
    function timeLabel(minutes) {
        const value = Number(minutes) || 0;
        if (value < 0) {
            return 'Quá hạn ' + Math.abs(value) + "′";
        }
        return value + "′";
    }

    /* Lớp chip thời gian theo trạng thái quá hạn / còn thời gian */
    function timeChipClass(task) {
        if (isOverdue(task)) {
            return 'chip-time chip-time--over';
        }
        if (task.status === 'completed') {
            return 'chip-time chip-time--ok';
        }
        return 'chip-time';
    }

    /* Sinh HTML cho một thẻ nhiệm vụ (dùng <li class="card ...">) */
    function cardHTML(task, now) {
        const minutes = liveMinutes(task, now, STARTED_AT);
        const overdue = isOverdue({ status: task.status, minutes: minutes });
        const priority = PRIORITY[task.priority] || PRIORITY.medium;
        const next = NEXT_STATUS[task.status];
        const assignee = task.assignee ? esc(task.assignee) : 'Chưa nhận';

        const classes = ['card'];
        if (overdue) {
            classes.push('card--overdue');
        }
        if (task.status === 'completed') {
            classes.push('card--done');
        }

        const overdueAlert = overdue
            ? '<p class="alert-overdue"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17h.01"/></svg>Quá hạn — cần xử lý ngay</p>'
            : '';

        return '' +
            '<li class="' + classes.join(' ') + '" draggable="true" data-code="' + esc(task.code) + '" data-status="' + esc(task.status) + '">' +
                '<div class="card__top">' +
                    '<span class="card__code">' + esc(task.code) + '</span>' +
                    '<span class="' + timeChipClass({ status: task.status, minutes: minutes }) + '" data-time>' + esc(timeLabel(minutes)) + '</span>' +
                '</div>' +
                overdueAlert +
                '<h4 class="card__title">' + esc(task.title) + '</h4>' +
                '<p class="card__meta">' +
                    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
                    'Phòng ' + esc(task.room) + ' · Tầng ' + esc(task.floor) +
                '</p>' +
                '<div class="badges">' +
                    '<span class="badge badge--' + esc(task.priority) + '"><i class="dot" aria-hidden="true"></i>' + esc(priority.label) + '</span>' +
                    '<span class="badge badge--tag">' + esc(task.service) + '</span>' +
                '</div>' +
                '<div class="card__foot">' +
                    '<span class="card__assignee">' +
                        '<span class="avatar" aria-hidden="true">' + esc(initials(task.assignee)) + '</span>' +
                        '<b>' + assignee + '</b>' +
                    '</span>' +
                    '<button class="btn btn--claim" type="button" data-action="advance" data-code="' + esc(task.code) + '">' +
                        esc(ACTION_TEXT[next]) +
                    '</button>' +
                '</div>' +
            '</li>';
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

    /* ---- Toast thông báo ---- */
    function toast(message, type) {
        const host = $('#toasts');
        if (!host) {
            return;
        }
        const node = document.createElement('div');
        node.className = 'toast' + (type === 'success' ? ' toast--success' : '');
        node.textContent = message;
        host.appendChild(node);
        if (typeof setTimeout === 'function') {
            setTimeout(function () {
                node.remove();
            }, 2600);
        }
    }

    /* ---- Render toàn bộ bảng Kanban ---- */
    function render() {
        const now = Date.now();
        const visible = filterTasks(tasks, now, STARTED_AT);
        const counts = countByStatus(visible);

        const columns = document.querySelectorAll('.column');
        Array.prototype.forEach.call(columns, function (column) {
            const status = column.dataset.status;
            const list = column.querySelector('[data-list]');
            const countEl = column.querySelector('[data-count]');
            const zone = column.querySelector('[data-dropzone]');

            const columnTasks = visible.filter(function (task) {
                return task.status === status;
            });

            if (list) {
                list.innerHTML = columnTasks.map(function (task) {
                    return cardHTML(task, now);
                }).join('');
            }
            if (countEl) {
                countEl.textContent = counts[status] || 0;
            }
            if (zone) {
                if (columnTasks.length === 0) {
                    zone.classList.add('is-empty');
                } else {
                    zone.classList.remove('is-empty');
                }
            }
        });

        const resultEl = $('#resultCount');
        if (resultEl) {
            resultEl.textContent = visible.length + '/' + tasks.length + ' nhiệm vụ';
        }
    }

    /* Một dòng trong bảng chi tiết */
    function row(label, value) {
        return '<div class="modal__row"><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>';
    }

    /* ---- Mở modal chi tiết nhiệm vụ ---- */
    function openModal(code) {
        const task = findTask(code);
        if (!task) {
            return;
        }
        const modal = $('#taskModal');
        const codeEl = $('#modalCode');
        const bodyEl = $('#modalBody');
        if (!modal) {
            return;
        }
        if (codeEl) {
            codeEl.textContent = task.code;
        }
        if (bodyEl) {
            const minutes = liveMinutes(task, Date.now(), STARTED_AT);
            bodyEl.innerHTML = '' +
                '<p class="modal__label">Nội dung yêu cầu</p>' +
                '<p class="modal__note">' + esc(task.note) + '</p>' +
                '<dl class="modal__list">' +
                    row('Phòng', task.room + ' · Tầng ' + task.floor) +
                    row('Khách', task.guest) +
                    row('Dịch vụ', task.service) +
                    row('Bộ phận', task.department) +
                    row('Ưu tiên', (PRIORITY[task.priority] || {}).label || '') +
                    row('Phụ trách', task.assignee || 'Chưa nhận') +
                    row('SLA', task.sla + ' phút') +
                    row('Thời gian còn lại', timeLabel(minutes)) +
                '</dl>' +
                '<p class="modal__label">Vì sao AI xếp ưu tiên này?</p>' +
                '<p class="modal__note">' + esc(task.reason) + '</p>';
        }
        const advanceBtn = $('#modalAdvance');
        if (advanceBtn) {
            advanceBtn.textContent = ACTION_TEXT[NEXT_STATUS[task.status]];
            advanceBtn.dataset.code = task.code;
        }
        // Liên kết sang trang chi tiết, mang theo mã nhiệm vụ đang mở
        const detailLink = $('#modalDetail');
        if (detailLink) {
            detailLink.href = 'staff-task-detail.html?code=' + encodeURIComponent(task.code);
        }
        modal.hidden = false;
        modal.dataset.code = task.code;
    }

    /* ---- Đóng modal ---- */
    function closeModal() {
        const modal = $('#taskModal');
        if (modal) {
            modal.hidden = true;
        }
    }

    /* ---- Đổi trạng thái nhiệm vụ rồi render lại ---- */
    function changeStatus(code, status) {
        const task = findTask(code);
        if (!task || !status) {
            return;
        }
        const beforeTask = Object.assign({}, task);
        const before = task.status;
        applyStatus(task, status);
        try {
            saveTask(task);
        } catch (error) {
            Object.assign(task, beforeTask);
            console.error('Không thể lưu trạng thái nhiệm vụ:', error);
            toast('Không thể lưu thay đổi: ' + error.message);
            return;
        }
        closeModal();
        render();
        if (before !== task.status) {
            toast(task.code + ' → ' + STATUS_TEXT[task.status], 'success');
        }
    }
    /* ---- Kéo & thả ---- */
    function bindDragAndDrop() {
        let draggingCode = null;

        document.addEventListener('dragstart', function (e) {
            const card = e.target && e.target.closest ? e.target.closest('.card') : null;
            if (!card) {
                return;
            }
            draggingCode = card.dataset.code;
            card.classList.add('is-dragging');
            if (e.dataTransfer && e.dataTransfer.setData) {
                e.dataTransfer.setData('text/plain', draggingCode);
            }
        });

        document.addEventListener('dragend', function (e) {
            const card = e.target && e.target.closest ? e.target.closest('.card') : null;
            if (card) {
                card.classList.remove('is-dragging');
            }
            Array.prototype.forEach.call(document.querySelectorAll('[data-dropzone]'), function (zone) {
                zone.classList.remove('is-drop-target');
            });
        });

        document.addEventListener('dragover', function (e) {
            const zone = e.target && e.target.closest ? e.target.closest('[data-dropzone]') : null;
            if (!zone) {
                return;
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            zone.classList.add('is-drop-target');
        });

        document.addEventListener('dragleave', function (e) {
            const zone = e.target && e.target.closest ? e.target.closest('[data-dropzone]') : null;
            if (zone) {
                zone.classList.remove('is-drop-target');
            }
        });

        document.addEventListener('drop', function (e) {
            const zone = e.target && e.target.closest ? e.target.closest('[data-dropzone]') : null;
            if (!zone) {
                return;
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            zone.classList.remove('is-drop-target');
            const column = zone.closest ? zone.closest('.column') : null;
            const code = draggingCode ||
                (e.dataTransfer && e.dataTransfer.getData ? e.dataTransfer.getData('text/plain') : '');
            if (column && code) {
                changeStatus(code, column.dataset.status);
            }
        });
    }

    /* ---- Gắn sự kiện click / chọn / nút ---- */
    function bindControls() {
        document.addEventListener('click', function (e) {
            const target = e.target;
            if (!target) {
                return;
            }

            const actionBtn = target.closest ? target.closest('[data-action="advance"]') : null;
            if (actionBtn) {
                const task = findTask(actionBtn.dataset.code);
                if (task) {
                    changeStatus(task.code, NEXT_STATUS[task.status]);
                }
                return;
            }

            const card = target.closest ? target.closest('.card') : null;
            if (card) {
                openModal(card.dataset.code);
                return;
            }

            if (target.closest && target.closest('[data-close]')) {
                closeModal();
            }
        });

        const closeBtn = $('#modalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        const dismissBtn = $('#modalDismiss');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', closeModal);
        }
        const advanceBtn = $('#modalAdvance');
        if (advanceBtn) {
            advanceBtn.addEventListener('click', function () {
                const code = advanceBtn.dataset.code;
                const task = findTask(code);
                if (task) {
                    changeStatus(code, NEXT_STATUS[task.status]);
                }
            });
        }

        const search = $('#taskSearch');
        if (search) {
            search.addEventListener('input', function (e) {
                filters.query = (e && e.target && e.target.value) || '';
                render();
            });
        }

        const form = $('#filterForm');
        if (form) {
            form.addEventListener('submit', function (e) {
                if (e && e.preventDefault) {
                    e.preventDefault();
                }
            });
        }

        const prioritySel = $('#filterPriority');
        if (prioritySel) {
            prioritySel.addEventListener('change', function (e) {
                filters.priority = e.target.value;
                render();
            });
        }
        const zoneSel = $('#filterZone');
        if (zoneSel) {
            zoneSel.addEventListener('change', function (e) {
                filters.zone = e.target.value;
                render();
            });
        }
        const shiftSel = $('#filterShift');
        if (shiftSel) {
            shiftSel.value = filters.shift;
            shiftSel.addEventListener('change', function (e) {
                filters.shift = e.target.value;
                render();
            });
        }

        const refreshBtn = $('#refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function () {
                filters.query = '';
                filters.priority = 'all';
                filters.zone = 'all';
                filters.shift = 'all';
                if (search) {
                    search.value = '';
                }
                if (prioritySel) {
                    prioritySel.value = 'all';
                }
                if (zoneSel) {
                    zoneSel.value = 'all';
                }
                if (shiftSel) {
                    shiftSel.value = 'all';
                }
                render();
                toast('Đã làm mới bảng nhiệm vụ', 'success');
            });
        }
    }

    /* ---- Khởi động ứng dụng ---- */
    function init() {
        bindControls();
        bindDragAndDrop();
        render();

        // Tự cập nhật thời gian đếm lùi mỗi 30 giây (bỏ qua trong test)
        if (typeof setInterval === 'function') {
            setInterval(render, 30000);
        }
    }

    /* API dùng chung cho trang chi tiết; chỉ sẵn sàng sau khi dữ liệu JSON tải xong. */
    function publishApi() {
        return window.StaffFlow = {
            tasks: tasks,
            profile: profile,
            PRIORITY: PRIORITY,
            STATUS_TEXT: STATUS_TEXT,
            STATUS_LABELS: STATUS_LABELS,
            NEXT_STATUS: NEXT_STATUS,
            ACTION_TEXT: ACTION_TEXT,
            findTask: findTask,
            applyStatus: applyStatus,
            isOverdue: isOverdue,
            liveMinutes: liveMinutes,
            timeLabel: timeLabel,
            initials: initials,
            toast: toast,
            saveTask: saveTask
        };
    }

    const mockReady = window.StayFlowDataReady
        ? window.StayFlowDataReady.then(function () {
            const records = tasksFromMockData(window.StayFlowData);
            tasks.splice.apply(tasks, [0, tasks.length].concat(records));
            const currentStaff = window.StayFlowData.staff[0];
            if (currentStaff) {
                profile.id = currentStaff.id;
                profile.name = currentStaff.name;
                profile.fullName = currentStaff.name;
            }
            return publishApi();
        })
        : Promise.resolve(publishApi());
    window.StaffFlowReady = mockReady;

    function showLoadError(error) {
        console.error('Không thể khởi tạo bảng nhiệm vụ từ dữ liệu mock:', error);
        const message = document.createElement('p');
        message.setAttribute('role', 'alert');
        message.textContent = 'Không thể tải dữ liệu nhiệm vụ. Hãy kiểm tra assets/data/stayflow.mock.json và chạy trang qua Live Server.';
        document.body.prepend(message);
    }

    /* Đăng ký chạy khi DOM và dữ liệu sẵn sàng. */
    document.addEventListener('DOMContentLoaded', function () {
        if (window.StayFlowDataReady) {
            mockReady.then(init).catch(showLoadError);
        } else {
            init();
        }
    });

}