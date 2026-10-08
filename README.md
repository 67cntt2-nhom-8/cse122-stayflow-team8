# StayFlow – Điều phối dịch vụ trong thời gian lưu trú

> **Học phần:** PHÁT TRIỂN ỨNG DỤNG WEB CƠ BẢN – CSE122  
> **Lĩnh vực:** Khách sạn / Hospitality  

## Ngữ cảnh
Khách lưu trú phải gọi lễ tân cho nhiều yêu cầu nhỏ. Bộ phận vận hành lại thiếu trạng thái thống nhất để theo dõi xử lý và SLA.

## Phát biểu vấn đề
- **P1.** Yêu cầu dễ thất lạc.
- **P2.** Khách không biết tiến độ.
- **P3.** Bộ phận vận hành khó ưu tiên.
- **P4.** Quản lý thiếu insight chất lượng phục vụ.

## Mục tiêu
- **O1.** Biến bài toán thực tế thành một sản phẩm Frontend có hành trình người dùng rõ ràng.
- **O2.** Thiết kế đầy đủ giao diện cho từng vai trò, bảo đảm mỗi vai trò có ít nhất 3 màn hình.
- **O3.** Thể hiện các thao tác CRUD hoặc trạng thái nghiệp vụ phù hợp thay vì CRUD hình thức.
- **O4.** Sử dụng JavaScript/DOM cho tìm kiếm, lọc, kiểm tra hợp lệ, cửa sổ bật, thẻ, trạng thái và kết xuất dữ liệu.
- **O5.** Sử dụng JSON giả lập / LocalStorage / MockAPI / API công khai khi phù hợp.
- **O6.** Thiết kế ít nhất 3 trải nghiệm AI có thể mô phỏng được ở Frontend.
- **O7.** Tổ chức làm việc nhóm bằng Trello/Jira/Notion và Git/GitHub theo nhánh + yêu cầu hợp nhất.

## Các vai trò
| Vai trò | Trách nhiệm chính |
|---|---|
| **Khách lưu trú** | Tạo và theo dõi yêu cầu |
| **Nhân viên vận hành** | Nhận task và cập nhật |
| **Quản lý khách sạn** | Điều phối và theo dõi SLA |
| **Quản trị viên** | Quản lý loại dịch vụ và tài khoản |

## Luồng người dùng
Khám phá / đăng nhập → Thực hiện nghiệp vụ chính theo vai trò → Xem trạng thái / dữ liệu / phản hồi → AI hỗ trợ phân tích hoặc gợi ý → Người dùng Chấp nhận / Sửa / Từ chối / Lưu → Vai trò vận hành duyệt / xử lý → Bảng điều khiển / báo cáo / hoàn tất

## Bảng kiểm kê màn hình
*Dưới đây là các giao diện nền tảng bắt buộc, nhóm sẽ tiếp tục bổ sung trong quá trình phát triển:*

1. **Khách lưu trú:** Guest Dashboard (`guest-dashboard.html`), Service Request (`guest-service-request.html`), My Requests (`guest-my-requests.html`)
2. **Nhân viên vận hành:** Task Board (`staff-task-board.html`), Task Detail (`staff-task-detail.html`), Shift View (`staff-shift-view.html`)
3. **Quản lý khách sạn:** Dispatch Board (`manager-dispatch-board.html`), SLA Monitor (`manager-sla-monitor.html`), Service Report (`manager-service-report.html`)
4. **Quản trị viên:** Dashboard (`admin-dashboard.html`), Service Type Management (`admin-service-type-management.html`), User Management (`admin-user-management.html`)

## Tính năng AI
- **AI-1: Request Classifier** - Phân loại yêu cầu vào đúng bộ phận.
- **AI-2: Priority Assistant** - Gợi ý mức ưu tiên + lý do.
- **AI-3: Feedback Summarizer** - Tóm tắt chủ đề phản hồi.

## Công nghệ
- **Mã nguồn giao diện:** HTML, CSS, JavaScript (thiết kế Web responsive)
- **Dữ liệu giả lập:** JSON cục bộ, LocalStorage, MockAPI hoặc Public API
- **Công cụ thiết kế:** Figma / Canva
- **Quản lý phiên bản:** Git và GitHub

## Thành viên nhóm
| STT | Họ và Tên | Vai Trò | Mã Sinh Viên | GitHub |
| :---: | :--- | :---: | :---: | :--- |
| 1 | **Nguyễn Ninh Hải** | SV1 | `[2551060609]` | `[https://github.com/hainguyenninh1-oss]` |
| 2 | **Nguyễn Huy Thành** | SV2 | `[2551060690]` | `[https://github.com/Huythanh-07]` |
| 3 | **Phùng Xuân Thành** | SV3 | `[2551060691]` | `[https://github.com/phungxthanh07-ux]` |

## Phân công công việc
- **Nguyễn Ninh Hải (SV1):** Phụ trách chính Khách lưu trú, đồng phụ trách một phần giao diện dùng chung. Chịu trách nhiệm responsive, hệ thống thiết kế và điều hướng.
- **Nguyễn Huy Thành (SV2):** Phụ trách chính Nhân viên vận hành, đồng phụ trách tương tác JavaScript / dữ liệu giả lập. Phụ trách tương tác AI.
- **Phùng Xuân Thành (SV3):** Phụ trách chính Quản lý khách sạn + Quản trị viên, chịu trách nhiệm tích hợp bố cục và điều hướng. Chịu trách nhiệm phát hành và đảm bảo chất lượng.

## Quy trình Git
Quy trình làm việc nhóm tuân thủ nghiêm ngặt qua các bước:  
`Công việc trên Trello` → `Tạo nhánh` → `Viết mã` → `Ghi nhận thay đổi` → `Đẩy lên máy chủ` → `Yêu cầu hợp nhất` → `Đánh giá chéo` → `Merge vào dev` → `Test tích hợp` → `Merge main`

## Figma / Canva
* `[https://www.figma.com/design/WyFbVAgrJPYtl8MpHxJd6m/Untitled?node-id=0-1&p=f]`

## Demo
* `[Thêm liên kết trang web đã được triển khai (nếu có)]`

## Minh chứng OBS
*Danh sách các video minh chứng thực hành chi tiết sẽ được liệt kê tại `docs/obs-evidence.md`*
* `[Thêm liên kết thư mục Drive/YouTube chứa video OBS tại đây]`

## Khai báo sử dụng AI
*Báo cáo chi tiết về việc ứng dụng AI trong quá trình phát triển được lưu tại `docs/ai-usage-report.md`.*
