/* =========================================================================
   Smoke test cho phần DOM: chạy init() của js/main.js trên một DOM giả tối thiểu.
   Chạy: node js/domcheck.js
   Mục đích: phát hiện lỗi runtime (thiếu phần tử, sai tên hàm) mà Node thuần bỏ qua.
   ========================================================================= */
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'pages', 'staff-task-board.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8') + '\n' +
    fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

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
        remove: function () {},
        focus: function () {},
        closest: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function (type, handler) { this.handlers = this.handlers || {}; this.handlers[type] = handler; },
    };
}

// Tạo phần tử cho mỗi id trong pages/staff-task-board.html
const byId = {};
html.replace(/id="([^"]+)"/g, (_, id) => { byId[id] = el('div'); return ''; });

// Ba cột Kanban cần querySelector cho [data-list] / [data-count] / [data-dropzone]
const columns = ['new', 'processing', 'completed'].map((status) => {
    const column = el('section');
    column.dataset.status = status;
    const list = el('ul');
    const count = el('span');
    const zone = el('div');
    column.querySelector = (selector) => {
        if (selector === '[data-list]') return list;
        if (selector === '[data-count]') return count;
        if (selector === '[data-dropzone]') return zone;
        return null;
    };
    column.querySelectorAll = () => [];
    return column;
});

const document = {
    addEventListener: (type, handler) => { if (type === 'DOMContentLoaded') document.ready = handler; },
    querySelector: (selector) => (selector[0] === '#' ? byId[selector.slice(1)] || null : null),
    querySelectorAll: (selector) => (selector === '.column' ? columns : []),
    createElement: el,
};

const window = {
    matchMedia: () => ({ matches: true, addEventListener: () => {}, addListener: () => {} }),
};

/* ---------- Chạy main.js rồi gọi init() ---------- */
new Function('document', 'window', 'setInterval', 'require', source)(document, window, () => 0, require);
document.ready();  // mô phỏng DOMContentLoaded

/* ---------- Kiểm tra kết quả render ---------- */
assert.ok(document.ready, 'main.js phải đăng ký sự kiện DOMContentLoaded');

const rendered = columns.map((column) => ({
    status: column.dataset.status,
    cards: column.querySelector('[data-list]').innerHTML.match(/<li class="card/g) || [],
    count: column.querySelector('[data-count]').textContent,
    empty: column.querySelector('[data-dropzone]').classList.contains('is-empty'),
}));

assert.deepStrictEqual(rendered.map((c) => c.cards.length), [1, 2, 1], 'Mỗi cột phải phản ánh trạng thái tác vụ đã liên kết');
assert.deepStrictEqual(rendered.map((c) => c.count), [1, 2, 1], 'Số trên tiêu đề cột phải khớp');
assert.strictEqual(rendered[0].empty, false, 'Cột có thẻ thì không hiện gợi ý kéo thả');

// Lọc theo từ khóa phải làm cột "Mới" còn 1 thẻ
const search = byId.taskSearch;
search.value = '3002';
search.handlers.input({ target: search });
assert.strictEqual(columns[0].querySelector('[data-list]').innerHTML.match(/<li class="card/g).length, 1,
    'Tìm mã yêu cầu hiện trong dữ liệu liên kết');
assert.match(byId.resultCount.textContent, /1\/4 nhiệm vụ/, 'Ô kết quả phải hiện 1/4');

console.log('✓ domcheck: render danh sách chung, đếm trạng thái và tìm kiếm đều đạt');