# StayFlow – Điều phối dịch vụ trong thời gian lưu trú[cite: 2]

> **Học phần:** PHÁT TRIỂN ỨNG DỤNG WEB CƠ BẢN – CSE122[cite: 2]
> **Lĩnh vực:** Khách sạn / Hospitality[cite: 2]

## Ngữ cảnh
Khách lưu trú phải gọi lễ tân cho nhiều yêu cầu nhỏ[cite: 2]. Bộ phận vận hành lại thiếu trạng thái thống nhất để theo dõi xử lý và SLA[cite: 2].

## Phát biểu vấn đề
- **P1.** Yêu cầu dễ thất lạc[cite: 2].
- **P2.** Khách không biết tiến độ[cite: 2].
- **P3.** Bộ phận vận hành khó ưu tiên[cite: 2].
- **P4.** Quản lý thiếu insight chất lượng phục vụ[cite: 2].

## Mục tiêu
- **O1.** Biến bài toán thực tế thành một sản phẩm Frontend có hành trình người dùng rõ ràng[cite: 2].
- **O2.** Thiết kế đầy đủ giao diện cho từng vai trò, bảo đảm mỗi vai trò có ít nhất 3 màn hình[cite: 2].
- **O3.** Thể hiện các thao tác CRUD hoặc trạng thái nghiệp vụ phù hợp thay vì CRUD hình thức[cite: 2].
- **O4.** Sử dụng JavaScript/DOM cho tìm kiếm, lọc, kiểm tra hợp lệ, cửa sổ bật, thẻ, trạng thái và kết xuất dữ liệu[cite: 2].
- **O5.** Sử dụng JSON giả lập / LocalStorage / MockAPI / API công khai khi phù hợp[cite: 2].
- **O6.** Thiết kế ít nhất 3 trải nghiệm AI có thể mô phỏng được ở Frontend[cite: 2].
- **O7.** Tổ chức làm việc nhóm bằng Trello/Jira/Notion và Git/GitHub theo nhánh + yêu cầu hợp nhất[cite: 2].

## Các vai trò
| Vai trò | Trách nhiệm chính[cite: 2] |
|---|---|
| **Khách lưu trú** | Tạo và theo dõi yêu cầu[cite: 2]. |
| **Nhân viên vận hành** | Nhận task và cập nhật[cite: 2]. |
| **Quản lý khách sạn** | Điều phối và theo dõi sla[cite: 2]. |
| **Quản trị viên** | Quản lý loại dịch vụ và tài khoản[cite: 2]. |

## Luồng người dùng
Khám phá / đăng nhập → Thực hiện nghiệp vụ chính theo vai trò → Xem trạng thái / dữ liệu / phản hồi → AI hỗ trợ phân tích hoặc gợi ý → Người dùng Chấp nhận / Sửa / Từ chối / Lưu → Vai trò vận hành duyệt / xử lý → Bảng điều khiển / báo cáo / hoàn tất[cite: 2].

## Bảng kiểm kê màn hình
*Dưới đây là các giao diện nền tảng bắt buộc, nhóm sẽ tiếp tục bổ sung trong quá trình phát triển[cite: 2]*:

1. **Khách lưu trú:** Guest Dashboard (`guest-dashboard.html`), Service Request (`guest-service-request.html`), My Requests (`guest-my-requests.html`)[cite: 2].
2. **Nhân viên vận hành:** Task Board (`staff-task-board.html`), Task Detail (`staff-task-detail.html`), Shift View (`staff-shift-view.html`)[cite: 2].
3. **Quản lý khách sạn:** Dispatch Board (`manager-dispatch-board.html`), Sla Monitor (`manager-sla-monitor.html`), Service Report (`manager-service-report.html`)[cite: 2].
4. **Quản trị viên:** Dashboard (`admin-dashboard.html`), Service Type Management (`admin-service-type-management.html`), User Management (`admin-user-management.html`)[cite: 2].

## Tính năng AI
- **AI-1: Request Classifier** - Phân loại yêu cầu vào đúng bộ phận[cite: 2].
- **AI-2: Priority Assistant** - Gợi ý mức ưu tiên + lý do[cite: 2].
- **AI-3: Feedback Summarizer** - Tóm tắt chủ đề phản hồi[cite: 2].

## Công nghệ
- **Mã nguồn giao diện:** HTML, CSS, JavaScript (thiết kế Web responsive)[cite: 3].
- **Dữ liệu giả lập:** JSON cục bộ, LocalStorage, MockAPI hoặc Public API[cite: 3].
- **Công cụ thiết kế:** Figma / Canva[cite: 3].
- **Quản lý phiên bản:** Git và GitHub[cite: 3].

## Thành viên nhóm
| STT | Họ và Tên | Vai Trò | Mã Sinh Viên | GitHub |
| :---: | :--- | :---: | :---: | :--- |
| 1 | **Nguyễn Ninh Hải** | SV1 | `[2551060609]` | `[https://github.com/hainguyenninh1-oss]` |
| 2 | **Nguyễn Huy Thành** | SV2 | `[2551060690]` | `[https://github.com/Huythanh-07]` |
| 3 | **Phùng Xuân Thành** | SV3 | `[2551060691]` | `[https://github.com/phungxthanh07-ux]` |

## Phân công công việc
- **Nguyễn Ninh Hải (SV1):** Phụ trách chính Khách lưu trú, đồng phụ trách một phần giao diện dùng chung[cite: 2]. Chịu trách nhiệm responsive, hệ thống thiết kế và điều hướng[cite: 2, 3].
- **Nguyễn Huy Thành (SV2):** Phụ trách chính Nhân viên vận hành, đồng phụ trách tương tác JavaScript / dữ liệu giả lập[cite: 2]. Phụ trách tương tác AI[cite: 3].
- **Phùng Xuân Thành (SV3):** Phụ trách chính Quản lý khách sạn + Quản trị viên, chịu trách nhiệm tích hợp bố cục và điều hướng[cite: 2]. Chịu trách nhiệm phát hành và đảm bảo chất lượng[cite: 2, 3].

## Quy trình Git
Quy trình làm việc nhóm tuân thủ nghiêm ngặt qua các bước[cite: 2]:
`Công việc trên Trello` → `Tạo nhánh` → `Viết mã` → `Ghi nhận thay đổi` → `Đẩy lên máy chủ` → `Yêu cầu hợp nhất` → `Đánh giá chéo` → `Merge vào dev` → `Test tích hợp` → `Merge main`[cite: 2].

## Figma / Canva
* `[https://www.figma.com/design/WyFbVAgrJPYtl8MpHxJd6m/Untitled?node-id=0-1&p=f&t=dXFYh4lwOirOre6G-0]`

## Demo
* `[Thêm liên kết trang web đã được triển khai (nếu có)]`

## Minh chứng OBS
*Danh sách các video minh chứng thực hành chi tiết sẽ được liệt kê tại `docs/obs-evidence.md`[cite: 3]*
* `[Thêm liên kết thư mục Drive/YouTube chứa video OBS tại đây]`

## Khai báo sử dụng AI
*Báo cáo chi tiết về việc ứng dụng AI trong quá trình phát triển được lưu tại `docs/ai-usage-report.md`[cite: 2, 3].*
