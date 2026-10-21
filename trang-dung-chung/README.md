# trang-dung-chung — khối dùng chung của StayFlow

Thư mục này gom những phần trước đây bị **copy nguyên văn** sang nhiều trang, để mỗi thứ chỉ còn
một bản duy nhất.

| Tệp | Dùng cho | Nội dung |
| --- | --- | --- |
| `dashboard.css` | `trang-tong-quan`, `trang-yeu-cau`, `trang-tao-yeu-cau`, `trang-ho-so`, `trang-thong-bao` | font, biến màu, reset, sidebar, topbar, dropdown, lời chào `.welcome`, thẻ, nhãn trạng thái, nút, toast, keyframes, responsive khung |
| `dashboard.js` | `trang-tong-quan`, `trang-yeu-cau`, `trang-tao-yeu-cau`, `trang-ho-so`, `trang-thong-bao` | sidebar mobile, dropdown, Escape, đăng xuất, toast, bỏ dấu tiếng Việt, hiệu ứng hiện dần, kho yêu cầu `stayflow_requests`, `SERVICE_META`, modal gửi yêu cầu |
| `error-page.css` | `trang-403`, `trang-404` | font, biến màu, reset, khung trang lỗi, header logo, footer, bộ nút |
| `auth-ui.js` | `pages/login.html`, `trang-dang-ky`, `trang-quen-mat-khau` | vệt sáng theo con trỏ, ẩn/hiện mật khẩu, rung form, toast |
| `selfcheck.html` | — | trang tự kiểm tra: mở bằng trình duyệt, mọi dòng phải PASS |

## Thứ tự nạp (bắt buộc)

Tệp dùng chung luôn nạp **trước** tệp riêng của trang, để tệp riêng có thể ghi đè khi cần:

```html
<!-- trang-tong-quan/tongquan.html -->
<link rel="stylesheet" href="../trang-dung-chung/dashboard.css" />
<link rel="stylesheet" href="tongquan.css" />
...
<script src="../trang-dung-chung/dashboard.js"></script>
<script src="tongquan.js"></script>
```

`tongquan.js`, `yeucau.js`, `taoyeucau.js` và `hoso.js` dùng các biến/hàm do `dashboard.js` khai báo
(`searchInput`, `showToast`, `normalize`, `readRequests`, `saveRequest`, `nextRequestCode`,
`nowClock`, `currentUserName`, `setupRequestModal`, `openRequestModal`, `closeRequestModal`,
`SERVICE_META`). Vì vậy **không được đảo thứ tự** hai thẻ `<script>`.

## Các trang dùng khung dashboard

| Trang | Nạp | Khoá localStorage riêng |
| --- | --- | --- |
| `trang-tong-quan/tongquan.html` | `dashboard.css` + `tongquan.css`, `dashboard.js` + `tongquan.js` | `stayflow_requests` |
| `trang-yeu-cau/yeucau.html` | `dashboard.css` + `yeucau.css`, `dashboard.js` + `yeucau.js` | `stayflow_requests` |
| `trang-tao-yeu-cau/taoyeucau.html` | `dashboard.css` + `taoyeucau.css`, `dashboard.js` + `taoyeucau.js` | `stayflow_requests` |
| `trang-ho-so/hoso.html` | `dashboard.css` + `hoso.css`, `dashboard.js` + `hoso.js` | `stayflow_profile` |

`stayflow_user_name` (tên hiện trên topbar) do 3 trang dùng chung: `hoso.js` ghi khi lưu hồ sơ,
`dashboard.js` đọc để điền tên, và xoá khi bấm Đăng xuất.

## Không gộp (có lý do)

`login.css` và `signup.css` trùng nhau ~130 dòng nhưng dùng bộ biến màu khác nhau
(`--gold: #b8914a` so với `#c9a84c`). Gộp sẽ làm đổi màu giao diện trang Đăng ký, nên để riêng;
phần logic trùng nhau đã đưa vào `auth-ui.js`.

## Quy ước icon mục menu trong `assets/`

Thư mục `assets/` được sao chép theo từng trang vì icon mục menu phải đổi màu theo trạng thái:
bản **kem `#F2E7CF`** cho mục thường (nền navy), bản **navy `#101D33`** cho mục đang mở (nền vàng).
Vì tên file giữ nguyên như bản gốc, `trang-ho-so/assets/b5398.svg` **khác màu** với
`trang-tong-quan/assets/b5398.svg`; file đang mở dùng tên `…-navy.svg` cho dễ phân biệt.

Làm trang mới: chép nguyên bộ `assets/` của `trang-tong-quan`, rồi đổi `stroke` của
icon ứng với mục đang mở sang navy. Quên bước này thì icon thành navy trên nền navy → mất hẳn.

## Kiểm tra sau khi sửa

Mở `selfcheck.html` bằng trình duyệt. Kỳ vọng: dòng cuối là `TONG: 53/53 PASS`.
