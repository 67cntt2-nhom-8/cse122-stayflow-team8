# shared — khối dùng chung của StayFlow

Thư mục này gom những phần trước đây bị **copy nguyên văn** sang nhiều trang, để mỗi thứ chỉ còn
một bản duy nhất.

| Tệp | Dùng cho | Nội dung |
| --- | --- | --- |
| `dashboard.css` | `guest-dashboard`, `service-requests`, `profile` | font, biến màu, reset, sidebar, topbar, dropdown, lời chào `.welcome`, thẻ, nhãn trạng thái, nút, toast, keyframes, responsive khung |
| `dashboard.js` | `guest-dashboard`, `service-requests`, `profile` | sidebar mobile, dropdown, Escape, đăng xuất, toast, bỏ dấu tiếng Việt, hiệu ứng hiện dần, kho yêu cầu `stayflow_requests` (sessionStorage), `SERVICE_META`, modal gửi yêu cầu |
| `error-page.css` | `pages/403.html`, `pages/404.html` | font, biến màu, reset, khung trang lỗi, header logo, footer, bộ nút |
| `auth-ui.js` | `login`, `sign-up`, `forgot-password` | ẩn/hiện mật khẩu, rung form, toast |
| `selfcheck.html` | — | trang tự kiểm tra: mở bằng trình duyệt, mọi dòng phải PASS |

## Thứ tự nạp (bắt buộc)

Tệp dùng chung luôn nạp **trước** tệp riêng của trang, để tệp riêng có thể ghi đè khi cần:

```html
<!-- pages/guest-dashboard.html -->
<link rel="stylesheet" href="../shared/dashboard.css" />
<link rel="stylesheet" href="../css/guest-dashboard.css" />
...
<script src="../shared/dashboard.js"></script>
<script src="../js/guest-dashboard.js"></script>
```

`guest-dashboard.js`, `guest-service-requests.js` và `guest-profile.js` dùng các biến/hàm do `dashboard.js` khai báo
(`searchInput`, `showToast`, `normalize`, `readRequests`, `saveRequest`, `nextRequestCode`,
`nowClock`, `currentUserName`, `setupRequestModal`, `openRequestModal`, `closeRequestModal`,
`SERVICE_META`). Vì vậy **không được đảo thứ tự** hai thẻ `<script>`.

## Các trang dùng khung dashboard

| Trang | Nạp | Khoá dữ liệu riêng |
| --- | --- | --- |
| `pages/guest-dashboard.html` | `dashboard.css` + `guest-dashboard.css`, `dashboard.js` + `guest-dashboard.js` | `stayflow_requests` (sessionStorage) |
| `pages/guest-service-requests.html` | `dashboard.css` + `guest-service-requests.css`, `dashboard.js` + `guest-service-requests.js` | `stayflow_requests` (sessionStorage) |
| `pages/guest-profile.html` | `dashboard.css` + `guest-profile.css`, `dashboard.js` + `guest-profile.js` | `stayflow_profile` |

Yêu cầu dịch vụ lưu trong `sessionStorage` (tự xoá khi đóng tab) thay vì `localStorage`,
vì đó là dữ liệu phiên lưu trú chứ không phải tuỳ chọn cá nhân.

`stayflow_user_name` (tên hiện trên topbar) do 3 trang dùng chung: `profile.js` ghi khi lưu hồ sơ,
`dashboard.js` đọc để điền tên, và xoá khi bấm Đăng xuất.

## Không gộp (có lý do)

`login.css` và `sign-up.css` trùng nhau ~130 dòng nhưng dùng bộ biến màu khác nhau
(`--gold: #b8914a` so với `#c9a84c`). Gộp sẽ làm đổi màu giao diện trang Đăng ký, nên để riêng;
phần logic trùng nhau đã đưa vào `auth-ui.js`.

## Quy ước icon mục menu trong `assets/images/`

Icon mục menu phải đổi màu theo trạng thái: bản **kem `#F2E7CF`** cho mục thường (nền navy),
bản **navy `#101D33`** cho mục đang mở (nền vàng). Ảnh nay nằm chung một chỗ ở `assets/images/`,
nên khi hai trang cần cùng một tên file nhưng khác màu, bản navy mang hậu tố `-navy`
(`27592-navy.svg`, `3f703-navy.svg`); bản cùng nội dung nhưng dùng ở ngữ cảnh khác mang hậu tố
tên trang (`b5398-guest-dashboard.svg`, `5605b-guest-profile.svg`).

Làm trang mới: lấy icon kem có sẵn trong `assets/images/`; nếu mục đang mở cần bản navy mà chưa có
thì tạo thêm bản `…-navy.svg`. Quên bước này thì icon thành navy trên nền navy → mất hẳn.

## Kiểm tra sau khi sửa

Mở `selfcheck.html` bằng trình duyệt. Kỳ vọng: mọi dòng đều là `PASS` và dòng cuối có dạng `TONG: n/n PASS`.
