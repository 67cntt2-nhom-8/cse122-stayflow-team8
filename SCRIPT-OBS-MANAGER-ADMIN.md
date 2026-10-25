# Kịch bản OBS — Manager và Admin

## Lưu ý theo barem

Ảnh barem ghi rõ **mỗi giao diện độc lập trong bảng kiểm kê cuối cùng = 1 video OBS**. Vì vậy không gộp toàn bộ Manager thành một video và Admin thành một video nếu cả 10 trang dưới đây đều nằm trong bảng kiểm kê đã duyệt. Mỗi video có thể ngắn, tập trung vào đúng trang và một tương tác chính.

## Phần bắt buộc trong từng video

1. Bật webcam, giới thiệu tên và trang đang demo.
2. Mở bản thiết kế Figma/Canva có liên quan.
3. Mở đúng HTML, CSS và JavaScript của trang.
4. Giải thích ngắn bố cục và logic chính.
5. Thực hiện một chỉnh sửa nhỏ, có ý nghĩa trong source rồi lưu lại.
6. Quay lại trình duyệt, tải lại và chạy thử tương tác.
7. Commit thay đổi lên GitHub; nói rõ branch và commit thực tế.

> Thay `[tên]`, `[branch]`, `[commit]` bằng thông tin thật. Không đọc thông tin giả định và không cần tạo thay đổi chỉ để quay nếu chỉnh sửa đó không phù hợp.

## Manager

### 1. Bảng điều phối — `pages/manager-dispatch-board.html`

**Thử:** lọc/tìm một yêu cầu, chọn yêu cầu, phân công nhân viên; xác nhận giao diện cập nhật.

**Lời thoại:**  
“Em là [tên], phụ trách trang Bảng điều phối. Trang này giúp quản lý xem yêu cầu đang mở, chọn yêu cầu cần xử lý và phân công cho nhân viên phù hợp. Em tìm yêu cầu [mã/phòng], chọn nhân viên [tên] rồi xác nhận phân công. Kết quả được cập nhật trên bảng và có thể hoàn tác. Em mở các file HTML, CSS, JavaScript để chỉ ra cấu trúc trang và xử lý phân công. Sau đây em chỉnh [mô tả thay đổi thật], tải lại trang và kiểm tra lại thao tác. Mã nguồn nằm trên branch [branch], commit [commit].”

### 2. Theo dõi SLA — `pages/manager-sla-monitor.html`

**Thử:** lọc yêu cầu theo trạng thái/dịch vụ, chỉ ra thẻ SLA đạt, sắp hạn hoặc quá hạn; thử xuất CSV nếu cần.

**Lời thoại:**  
“Đây là trang Theo dõi SLA. Các chỉ số giúp quản lý nhận biết yêu cầu đạt mục tiêu, sắp đến hạn hoặc đã quá hạn. Em lọc danh sách để tập trung vào [trạng thái/dịch vụ], sau đó chỉ ra cách hệ thống thể hiện mức độ cần chú ý. Em mở HTML, CSS, JavaScript và giải thích cách dữ liệu được tổng hợp. Em chỉnh [thay đổi thật], tải lại và thử bộ lọc. Branch: [branch], commit: [commit].”

### 3. Báo cáo dịch vụ — `pages/manager-service-report.html`

**Thử:** xem số liệu/biểu đồ, đổi bộ lọc nếu trang có, xuất CSV.

**Lời thoại:**  
“Đây là trang Báo cáo dịch vụ, dùng để xem hiệu suất xử lý yêu cầu và phản hồi của khách. Em kiểm tra số liệu trên trang, thao tác [bộ lọc/xuất CSV đang có] và giải thích dữ liệu được trình bày như thế nào. Em mở HTML, CSS, JavaScript, chỉnh [thay đổi thật], rồi chạy lại và kiểm tra kết quả. Branch: [branch], commit: [commit].”

### 4. Nhân sự — `pages/manager-staff-management.html`

**Thử:** lọc theo bộ phận, đổi ca hoặc trạng thái trực của một nhân viên.

**Lời thoại:**  
“Đây là trang Nhân sự. Quản lý có thể xem bộ phận, ca làm, tải công việc và trạng thái trực của nhân viên. Em lọc theo [bộ phận], đổi ca hoặc trạng thái của [nhân viên mẫu], rồi kiểm tra thay đổi được lưu. Em mở HTML, CSS, JavaScript để giải thích phần hiển thị và xử lý cập nhật. Em chỉnh [thay đổi thật], chạy thử lại. Branch: [branch], commit: [commit].”

### 5. Cấu hình vận hành — `pages/manager-settings.html`

**Thử:** thay đổi một cấu hình vận hành, lưu và xác nhận cấu hình được áp dụng.

**Lời thoại:**  
“Đây là trang Cấu hình vận hành. Các giá trị ở đây ảnh hưởng đến cách hệ thống theo dõi SLA/điều phối. Em thay đổi [cấu hình đang có], lưu lại rồi kiểm tra kết quả ở trang liên quan. Em mở HTML, CSS, JavaScript để giải thích cách cấu hình được lưu và dùng. Em chỉnh [thay đổi thật], chạy thử. Branch: [branch], commit: [commit].”

## Admin

### 6. Tổng quan quản trị — `pages/admin-dashboard.html`

**Thử:** chỉ ra KPI, hoạt động gần đây, mở một shortcut.

**Lời thoại:**  
“Đây là trang Tổng quan quản trị. Trang tổng hợp tài khoản, loại dịch vụ, yêu cầu đang mở và cảnh báo SLA, đồng thời cung cấp lối tắt đến các trang quản trị. Em mở [shortcut] và cho thấy điều hướng đến đúng trang. Em mở HTML, CSS, JavaScript, giải thích cách KPI được lấy từ dữ liệu dùng chung, chỉnh [thay đổi thật] và kiểm tra lại. Branch: [branch], commit: [commit].”

### 7. Quản lý người dùng — `pages/admin-user-management.html`

**Thử:** lọc theo vai trò, mở phân quyền hoặc khóa/kích hoạt một tài khoản mẫu.

**Lời thoại:**  
“Đây là trang Quản lý người dùng. Admin có thể lọc tài khoản, xem phạm vi, cập nhật phân quyền và khóa hoặc kích hoạt tài khoản. Em lọc theo [vai trò], thực hiện [thao tác], xác nhận kết quả và chỉ ra bản ghi audit nếu có. Em mở HTML, CSS, JavaScript, chỉnh [thay đổi thật] rồi chạy thử. Branch: [branch], commit: [commit].”

### 8. Quản lý loại dịch vụ — `pages/admin-service-type-management.html`

**Thử:** mở form thêm/sửa, kiểm tra validation; lưu hoặc lưu trữ một loại dịch vụ mẫu.

**Lời thoại:**  
“Đây là trang Quản lý loại dịch vụ. Mỗi dịch vụ có nhóm, SLA chuẩn, ưu tiên và trạng thái hoạt động. Em mở form, thử validation với dữ liệu chưa hợp lệ, sau đó lưu [thay đổi mẫu] và xác nhận danh sách cập nhật. Em mở HTML, CSS, JavaScript để giải thích thao tác và lưu dữ liệu. Em chỉnh [thay đổi thật], chạy lại. Branch: [branch], commit: [commit].”

### 9. Nhật ký hệ thống — `pages/admin-system-log.html`

**Thử:** lọc loại thao tác, tìm kiếm, chuyển trang hoặc xuất CSV.

**Lời thoại:**  
“Đây là trang Nhật ký hệ thống ở chế độ chỉ đọc. Nhật ký giúp truy vết ai đã thao tác và nội dung thay đổi. Em lọc theo [loại thao tác], tìm một bản ghi và thử [chuyển trang/xuất CSV]. Em mở HTML, CSS, JavaScript để chỉ ra cách lọc và hiển thị nhật ký. Em chỉnh [thay đổi thật], tải lại và kiểm tra. Branch: [branch], commit: [commit].”

### 10. Quản lý khách sạn — `pages/admin-hotel.html`

**Thử:** xem KPI phòng/nhân viên/yêu cầu, kiểm tra bảng lưu trú, bấm làm mới.

**Lời thoại:**  
“Đây là trang Quản lý khách sạn. Trang tóm tắt tình hình lưu trú, yêu cầu mở, nhân viên đang trực và danh sách phòng. Em đối chiếu một phòng với số yêu cầu đang mở, sau đó thử nút làm mới dữ liệu. Em mở HTML, CSS, JavaScript để giải thích các chỉ số và cách render danh sách. Em chỉnh [thay đổi thật], chạy thử lại. Branch: [branch], commit: [commit].”

## Kết thúc mỗi video

“Thao tác trên trang đã chạy thành công. Thay đổi source đã được ghi nhận tại branch [branch], commit [commit]. Video này minh chứng cho giao diện [tên trang] và tương tác chính của trang.”
