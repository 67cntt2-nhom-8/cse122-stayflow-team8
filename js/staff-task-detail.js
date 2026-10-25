/* =========================================================================
   StayFlow – Chi tiết nhiệm vụ (staff-task-detail.html)
   -------------------------------------------------------------------------
   Không chép lại nghiệp vụ: đọc dữ liệu + quy tắc từ window.StaffFlow
   (do js/main.js xuất ra) rồi chỉ lo phần hiển thị và nhật ký của trang này.
   Nhiệm vụ lấy theo ?code=... trên URL, mặc định #SF-3192.
   ========================================================================= */
'use strict';

/* Tìm nhiệm vụ: ưu tiên tham số URL, sau đó mã mặc định của màn hình này. */
function pickCode(search, fallback) {
    const match = /[?&]code=([^&]+)/.exec(String(search == null ? '' : search));
    if (!match) {
        return fallback;
    }
    return decodeURIComponent(match[1].replace(/\+/g, ' '));
}

/* Đổi ISO -> "07/10/2026 11:40" */
function formatDateTime(iso) {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
        return '—';
    }
    const pad = function (value) { return String(value).padStart(2, '0'); };
    return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear() +
        ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {

    const DEFAULT_CODE = '#SF-3192';
    const STARTED_AT = Date.now();

    /* Nhật ký của phiên xem trang (mỗi lần đổi trạng thái / lưu ghi chú) */
    const log = [];

    let API = window.StaffFlow || null;

    /* Truy vấn an toàn: dùng querySelector để hợp với DOM thật lẫn DOM giả (domcheck). */
    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    /* Ghi nội dung vào MỌI phần tử có data-* tương ứng (mã hiện ở topbar + tiêu đề) */
    function setAll(attr, value) {
        Array.prototype.forEach.call($$(attr), function (node) {
            node.textContent = value;
        });
    }

    /* Escape ký tự HTML trước khi chèn vào innerHTML */
    function esc(text) {
        return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* Thông báo nhỏ ở góc màn hình – tái dùng đúng khối toast của bảng nhiệm vụ */
    function toast(message) {
        if (API && API.toast) {
            API.toast(message, 'success');
        }
    }

    /* Thông báo cho trình đọc màn hình */
    function announce(message) {
        const live = $('#liveMsg');
        if (live) {
            live.textContent = message;
        }
    }

    /* ---- Đổ dữ liệu nhiệm vụ lên giao diện ---- */
    function paint(task) {
        const now = Date.now();
        const priority = (API.PRIORITY[task.priority] || API.PRIORITY.medium).label;
        const minutes = API.liveMinutes(task, now, STARTED_AT);
        const overdue = API.isOverdue({ status: task.status, minutes: minutes });
        const remaining = API.timeLabel(minutes) + (overdue ? ' (quá hạn)' : '');
        const statusName = API.STATUS_TEXT[task.status];

        setAll('[data-code]', task.code);
        setAll('[data-title]', task.title);
        setAll('[data-note]', task.note);
        setAll('[data-reason]', task.reason);
        setAll('[data-room]', 'Phòng ' + task.room + ' · Tầng ' + task.floor);
        setAll('[data-guest]', task.guest);
        setAll('[data-service]', task.service);
        setAll('[data-department]', task.department);
        setAll('[data-priority]', priority);
        setAll('[data-received]', formatDateTime(task.receivedAt));
        setAll('[data-sla]', task.sla + ' phút');
        setAll('[data-remaining]', remaining);
        setAll('[data-assignee]', task.assignee || 'Chưa nhận');
        setAll('[data-status-row]', statusName);
        setAll('[data-status-text]', statusName);

        const pill = $('#statusPill');
        if (pill) {
            pill.dataset.status = task.status;
            pill.className = 'status-pill status-pill--' + task.status;
        }

        document.title = 'StayFlow - ' + task.code + ' · ' + task.title;
    }

    /* ---- Bật/tắt nút theo trạng thái hiện tại ---- */
    function paintActions(task) {
        const btnProcessing = $('#btnProcessing');
        const btnCompleted = $('#btnCompleted');
        const btnReopen = $('#btnReopen');

        if (btnProcessing) {
            btnProcessing.hidden = task.status !== 'new';
        }
        if (btnCompleted) {
            btnCompleted.hidden = task.status === 'completed';
        }
        if (btnReopen) {
            btnReopen.hidden = task.status !== 'completed';
        }
    }

    /* ---- Nhật ký thay đổi ---- */
    function paintLog() {
        const host = $('[data-timeline]');
        if (!host) {
            return;
        }
        if (!log.length) {
            host.innerHTML = '<li class="timeline__empty">Chưa có thay đổi nào trong phiên làm việc này.</li>';
            return;
        }
        host.innerHTML = log.map(function (entry) {
            return '<li class="timeline__item timeline__item--' + esc(entry.status) + '">' +
                '<p class="timeline__when">' + esc(entry.when) + '</p>' +
                '<p class="timeline__what">' + esc(entry.what) + '</p>' +
                '<p class="timeline__who">' + esc(entry.who) + '</p>' +
                (entry.note ? '<p class="timeline__note">' + esc(entry.note) + '</p>' : '') +
                '</li>';
        }).join('');
    }

    function addLog(status, what, note) {
        log.unshift({
            status: status,
            what: what,
            who: (API.profile && API.profile.name) || 'Nhân viên',
            when: formatDateTime(new Date().toISOString()),
            note: note || ''
        });
        paintLog();
    }

    /* ---- Hiệu ứng thành công: nhấp nháy khối vừa đổi + toast ---- */
    function flash(selector) {
        const node = $(selector);
        if (!node || !node.classList) {
            return;
        }
        node.classList.remove('is-flash');
        // Ép trình duyệt tính lại style để animation chạy lại mỗi lần bấm
        void node.offsetWidth;
        node.classList.add('is-flash');
    }

    /* ---- Trạng thái tĩnh ban đầu của nhiệm vụ (chưa có thao tác nào) ---- */
    function seedLog(task) {
        log.length = 0;
        log.push({
            status: 'new',
            what: 'Tiếp nhận yêu cầu · ' + task.title,
            who: task.guest,
            when: formatDateTime(task.receivedAt),
            note: 'SLA ' + task.sla + ' phút · Ưu tiên ' + (API.PRIORITY[task.priority] || {}).label
        });
        if (task.assignee) {
            log.unshift({
                status: task.status,
                what: API.STATUS_TEXT[task.status] === 'Đang xử lý' ? 'Bắt đầu xử lý' : 'Cập nhật nhiệm vụ',
                who: task.assignee,
                when: formatDateTime(task.receivedAt),
                note: ''
            });
        }
        paintLog();
    }

    /* ---- Đổi trạng thái nhiệm vụ ---- */
    function changeStatus(task, status, note) {
        const before = task.status;
        if (before === status) {
            toast('Nhiệm vụ đã ở trạng thái ' + API.STATUS_TEXT[status]);
            return;
        }
        API.applyStatus(task, status);
        paint(task);
        paintActions(task);
        addLog(status, API.STATUS_TEXT[before] + ' → ' + API.STATUS_TEXT[task.status], note);
        flash('#statusPill');
        toast(task.code + ' → ' + API.STATUS_TEXT[task.status]);
        announce('Nhiệm vụ ' + task.code + ' chuyển sang trạng thái ' + API.STATUS_TEXT[task.status]);
    }

    function readNote() {
        const field = $('#staffNote');
        return field ? String(field.value || '').trim() : '';
    }

    function showNoteError(show) {
        const wrapper = $('#noteField');
        const error = $('#noteError');
        if (wrapper) {
            if (show) {
                wrapper.classList.add('is-invalid');
            } else {
                wrapper.classList.remove('is-invalid');
            }
        }
        if (error) {
            error.hidden = !show;
        }
    }

    /* ---- Gắn sự kiện ---- */
    function bind(task) {
        ['#btnProcessing', '#btnCompleted', '#btnReopen'].forEach(function (selector) {
            const button = $(selector);
            if (!button) {
                return;
            }
            button.addEventListener('click', function () {
                const note = readNote();
                // Hoàn tất mà chưa ghi chú -> chặn lại và báo lỗi
                if (button.dataset.action === 'completed' && !note) {
                    showNoteError(true);
                    const field = $('#staffNote');
                    if (field && field.focus) {
                        field.focus();
                    }
                    return;
                }
                showNoteError(false);
                changeStatus(task, button.dataset.action, note);
            });
        });

        const save = $('#btnSaveNote');
        if (save) {
            save.addEventListener('click', function () {
                const note = readNote();
                if (!note) {
                    showNoteError(true);
                    return;
                }
                showNoteError(false);
                addLog(task.status, 'Ghi chú xử lý: đã lưu phản hồi của nhân viên', note);
                flash('#noteField');
                toast('Đã lưu ghi chú cho ' + task.code);
                announce('Đã lưu ghi chú xử lý');
            });
        }
    }

    /* ---- Khởi động ---- */
    function init() {
        if (!API) {
            return;
        }

        const code = pickCode(window.location ? window.location.search : '', DEFAULT_CODE);
        const task = API.findTask(code) || API.findTask(DEFAULT_CODE) || API.tasks[0];

        if (!task) {
            setAll('[data-title]', 'Không tìm thấy nhiệm vụ');
            return;
        }

        if (task.receivedAt === undefined) {
            task.receivedAt = '2026-10-07T11:40:00';
        }

        paint(task);
        paintActions(task);
        seedLog(task);
        bind(task);

        // Giữ đồng hồ "thời gian còn lại" nhích theo thời gian thực
        if (typeof setInterval === 'function') {
            setInterval(function () { paint(task); }, 30000);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (window.StayFlowDataReady) {
            window.StaffFlowReady.then(function (api) {
                API = api;
                init();
            }).catch(function (error) {
                console.error('Không thể tải dữ liệu chi tiết nhiệm vụ:', error);
                setAll('[data-title]', 'Không thể tải dữ liệu nhiệm vụ');
            });
        } else {
            init();
        }
    });
}

/* Xuất các hàm thuần để kiểm tra bằng Node (js/detailcheck.js) */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { pickCode: pickCode, formatDateTime: formatDateTime };
}