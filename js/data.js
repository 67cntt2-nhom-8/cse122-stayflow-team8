/* =========================================================================
   StayFlow – Dữ liệu giả lập tập trung (mock data)
   -------------------------------------------------------------------------
   Dữ liệu này phục vụ riêng màn hình nhân viên; các trang quản lý/quản trị
   đọc assets/data/stayflow.mock.json.
   Chạy được cả trên trình duyệt (file:// hoặc http://) lẫn trong Node.

   - Trình duyệt: <script src="js/data.js"></script>  -> window.StayFlowData
   - Node:        require('./js/data.js')              -> module.exports
   ========================================================================= */
(function (root, factory) {
    'use strict';
    const data = factory();

    // Trình duyệt
    if (typeof window !== 'undefined') {
        window.StayFlowData = data;
    }
    // Node (selfcheck / domcheck)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = data;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ---------- Nhân viên ----------
       `role`  = bộ phận (dùng để lọc lịch ca trực)
       `shift` = ca đăng ký, khớp shifts[].name bên dưới
       `status`= 'Đang trực' (có thể xếp ca) hoặc 'Nghỉ' (không xếp ca) */
    const staff = [
        { id: 'STF001', name: 'Nguyễn Thị Mai Anh', role: 'Lễ tân', status: 'Đang trực', shift: 'Ca sáng', phone: '0901234567', email: 'maianh.n@stayflow.vn' },
        { id: 'STF002', name: 'Trần Văn Bình', role: 'Buồng phòng', status: 'Đang trực', shift: 'Ca sáng', phone: '0902345678', email: 'binh.tr@stayflow.vn' },
        { id: 'STF003', name: 'Lê Hoàng Phúc', role: 'Kỹ thuật', status: 'Đang trực', shift: 'Ca chiều', phone: '0903456789', email: 'phuc.le@stayflow.vn' },
        { id: 'STF004', name: 'Phạm Thị Hương', role: 'Lễ tân', status: 'Nghỉ', shift: 'Ca đêm', phone: '0904567890', email: 'huong.p@stayflow.vn' },
        { id: 'STF005', name: 'Vũ Đức Thành', role: 'Buồng phòng', status: 'Đang trực', shift: 'Ca chiều', phone: '0905678901', email: 'thanh.vu@stayflow.vn' },
        { id: 'STF006', name: 'Ngô Thị Lan', role: 'Lễ tân', status: 'Đang trực', shift: 'Ca sáng', phone: '0906789012', email: 'lan.ngo@stayflow.vn' },
        { id: 'STF007', name: 'Đặng Minh Quân', role: 'Kỹ thuật', status: 'Đang trực', shift: 'Ca đêm', phone: '0907890123', email: 'quan.dang@stayflow.vn' },
        { id: 'STF008', name: 'Bùi Thị Ngọc', role: 'Buồng phòng', status: 'Đang trực', shift: 'Ca đêm', phone: '0908901234', email: 'ngoc.bui@stayflow.vn' },
        { id: 'STF009', name: 'Hoàng Văn Tú', role: 'Kỹ thuật', status: 'Đang trực', shift: 'Ca sáng', phone: '0909012345', email: 'tu.hoang@stayflow.vn' },
        { id: 'STF010', name: 'Đỗ Thị Thu Hà', role: 'Lễ tân', status: 'Đang trực', shift: 'Ca chiều', phone: '0910123456', email: 'ha.do@stayflow.vn' }
    ];

    /* ---------- Ca làm việc ---------- */
    const shifts = [
        { id: 'morning', name: 'Ca sáng', start: '06:00', end: '14:00' },
        { id: 'afternoon', name: 'Ca chiều', start: '14:00', end: '22:00' },
        { id: 'night', name: 'Ca đêm', start: '22:00', end: '06:00' }
    ];

    /* ---------- Loại dịch vụ ---------- */
    const serviceTypes = [
        { id: 'ST001', categoryName: 'Vệ sinh phòng', description: 'Dịch vụ dọn dẹp, thay đồ giường, cung cấp đồ dùng phòng tắm', expectedSLA: 30, department: 'Buồng phòng' },
        { id: 'ST002', categoryName: 'Bảo trì kỹ thuật', description: 'Sửa chữa, bảo dưỡng hệ thống điện, nước, điều hòa, thiết bị phòng', expectedSLA: 60, department: 'Kỹ thuật' },
        { id: 'ST003', categoryName: 'Ăn uống & Phòng ăn', description: 'Dịch vụ giao đồ ăn, nước uống tại phòng hoặc phục vụ tại nhà hàng khách sạn', expectedSLA: 45, department: 'F&B' },
        { id: 'ST004', categoryName: 'Hỗ trợ lễ tân', description: 'Yêu cầu liên quan đến nhận phòng, trả phòng, lưu trữ hành lý, in ấn', expectedSLA: 15, department: 'Lễ tân' },
        { id: 'ST005', categoryName: 'Spa & Thư giãn', description: 'Đặt lịch massage, phòng xông hơi, dịch vụ spa tại khách sạn', expectedSLA: 120, department: 'Spa' }
    ];

    /* ---------- Lưu trú ---------- */
    const stays = [
        { id: 'STR001', guestName: 'Ông Nguyễn Hoàng Long', roomNumber: '305', checkInDate: '2026-10-01', checkOutDate: '2026-10-07', status: 'Đang lưu trú', guestPhone: '0912345678', specialRequests: 'Tầng cao, không hút thuốc' },
        { id: 'STR002', guestName: 'Cô Trần Thị Hạnh', roomNumber: '218', checkInDate: '2026-10-05', checkOutDate: '2026-10-08', status: 'Đang lưu trú', guestPhone: '0923456789', specialRequests: 'Muốn thêm gối mềm' },
        { id: 'STR003', guestName: 'Gia đình anh Phạm Minh Tuấn', roomNumber: '412', checkInDate: '2026-10-03', checkOutDate: '2026-10-10', status: 'Đang lưu trú', guestPhone: '0934567890', specialRequests: 'Gia đình có trẻ em, cần cũi' },
        { id: 'STR004', guestName: 'Anh Đỗ Quang Huy', roomNumber: '110', checkInDate: '2026-09-25', checkOutDate: '2026-09-30', status: 'Đã trả phòng', guestPhone: '0945678901', specialRequests: 'Không có' },
        { id: 'STR005', guestName: 'Chị Lê Thủy Tiên', roomNumber: '501', checkInDate: '2026-10-06', checkOutDate: '2026-10-09', status: 'Đang lưu trú', guestPhone: '0956789012', specialRequests: 'Phòng view biển, tầng cao' }
    ];

    /* ---------- Yêu cầu của khách ---------- */
    const requests = [
        {
            id: 'REQ001', stayId: 'STR001', serviceTypeId: 'ST002', title: 'Điều hòa không mát',
            content: 'Điều hòa phòng 305 không lạnh, quạt chạy nhưng không làm mát. Khách cần sửa gấp vì thời tiết đang rất nóng.',
            status: 'Chờ xử lý', createdAt: '2026-10-07T11:40:00', ai_classification: 'Kỹ thuật', priority: 'Cao',
            ai_priority_reason: 'Điều hòa hỏng ảnh hưởng trực tiếp đến trải nghiệm nghỉ ngơi trong thời tiết nóng → Ưu tiên Cao. Nhân viên kỹ thuật đang trực ca chiều nên có thể tiếp cận nhanh.'
        },
        {
            id: 'REQ002', stayId: 'STR002', serviceTypeId: 'ST001', title: 'Bổ sung nước suối',
            content: 'Bổ sung thêm 4 chai nước suối và 2 ly thủy tinh cho khách tại phòng 218.',
            status: 'Chờ xử lý', createdAt: '2026-10-07T11:44:00', ai_classification: 'Buồng phòng', priority: 'Trung bình',
            ai_priority_reason: 'Yêu cầu bổ sung vật dụng cơ bản, không khẩn cấp nhưng cần chuẩn bị đúng giờ → Ưu tiên Trung bình.'
        },
        {
            id: 'REQ003', stayId: 'STR003', serviceTypeId: 'ST001', title: 'Dọn phòng buổi tối',
            content: 'Dọn phòng và thay khăn mới cho phòng 412 vào buổi tối sau 19h khi gia đình đi ăn.',
            status: 'Chờ xử lý', createdAt: '2026-10-07T11:36:00', ai_classification: 'Buồng phòng', priority: 'Thấp',
            ai_priority_reason: 'Vệ sinh phòng theo lịch, không gấp và có thể linh hoạt thời gian → Ưu tiên Thấp.'
        },
        {
            id: 'REQ004', stayId: 'STR005', serviceTypeId: 'ST001', title: 'Bổ sung khăn tắm',
            content: 'Bổ sung thêm 2 khăn tắm và 1 khăn chân cho khách phòng 501.',
            status: 'Đang thực hiện', createdAt: '2026-10-07T11:50:00', ai_classification: 'Buồng phòng', priority: 'Trung bình',
            ai_priority_reason: 'Bổ sung vật dụng cần xử lý trong ca nhưng không khẩn cấp → Ưu tiên Trung bình.'
        },
        {
            id: 'REQ005', stayId: 'STR004', serviceTypeId: 'ST002', title: 'Xử lý khóa cửa',
            content: 'Khóa cửa phòng 110 bị kẹt, khách không mở được từ bên trong. Cần kỹ thuật xử lý ngay.',
            status: 'Đang thực hiện', createdAt: '2026-10-07T10:25:00', ai_classification: 'Kỹ thuật', priority: 'Cao',
            ai_priority_reason: 'Sự cố khóa cửa ảnh hưởng đến an toàn của khách → Ưu tiên Cao, cần xử lý ngay.'
        },
        {
            id: 'REQ006', stayId: 'STR001', serviceTypeId: 'ST004', title: 'Giao bàn ủi',
            content: 'Giao bàn ủi và cầu là hơi nước đến phòng 305 cho khách sử dụng trong buổi sáng.',
            status: 'Hoàn thành', createdAt: '2026-10-07T09:28:00', ai_classification: 'Lễ tân', priority: 'Thấp',
            ai_priority_reason: 'Yêu cầu đơn giản, không ảnh hưởng an toàn hay trải nghiệm cơ bản → Ưu tiên Thấp.'
        },
        {
            id: 'REQ007', stayId: 'STR002', serviceTypeId: 'ST003', title: 'Dọn khay thức ăn',
            content: 'Dọn khay thức ăn và thu dọn bàn ăn tại phòng 218 sau khi khách dùng bữa sáng.',
            status: 'Hoàn thành', createdAt: '2026-10-07T10:12:00', ai_classification: 'F&B', priority: 'Trung bình',
            ai_priority_reason: 'Dọn dẹp sau bữa ăn cần thực hiện sớm để giữ vệ sinh phòng → Ưu tiên Trung bình.'
        }
    ];

    /* ---------- Nhiệm vụ (task) ---------- */
    const tasks = [
        { id: 'TSK001', requestId: 'REQ001', staffId: null, status: 'Chờ nhận', priority: 'Cao', ai_priority_reason: 'Điều hòa hỏng ảnh hưởng trực tiếp đến trải nghiệm nghỉ ngơi trong thời tiết nóng → Ưu tiên Cao. Nhân viên kỹ thuật đang trực ca chiều nên có thể tiếp cận nhanh.', assignedAt: '2026-10-07T11:42:00', completedAt: null },
        { id: 'TSK002', requestId: 'REQ002', staffId: null, status: 'Chờ nhận', priority: 'Trung bình', ai_priority_reason: 'Yêu cầu bổ sung vật dụng cơ bản, không khẩn cấp nhưng cần chuẩn bị đúng giờ → Ưu tiên Trung bình.', assignedAt: '2026-10-07T11:46:00', completedAt: null },
        { id: 'TSK003', requestId: 'REQ003', staffId: null, status: 'Chờ nhận', priority: 'Thấp', ai_priority_reason: 'Vệ sinh phòng theo lịch, không gấp và có thể linh hoạt thời gian → Ưu tiên Thấp.', assignedAt: '2026-10-07T11:38:00', completedAt: null },
        { id: 'TSK004', requestId: 'REQ004', staffId: 'STF002', status: 'Đang làm', priority: 'Trung bình', ai_priority_reason: 'Bổ sung vật dụng cần xử lý trong ca nhưng không khẩn cấp → Ưu tiên Trung bình.', assignedAt: '2026-10-07T11:52:00', completedAt: null },
        { id: 'TSK005', requestId: 'REQ005', staffId: 'STF003', status: 'Đang làm', priority: 'Cao', ai_priority_reason: 'Sự cố khóa cửa ảnh hưởng đến an toàn của khách → Ưu tiên Cao, cần xử lý ngay.', assignedAt: '2026-10-07T10:30:00', completedAt: null },
        { id: 'TSK006', requestId: 'REQ006', staffId: 'STF001', status: 'Hoàn tất', priority: 'Thấp', ai_priority_reason: 'Yêu cầu đơn giản, không ảnh hưởng an toàn hay trải nghiệm cơ bản → Ưu tiên Thấp.', assignedAt: '2026-10-07T09:30:00', completedAt: '2026-10-07T09:42:00' },
        { id: 'TSK007', requestId: 'REQ007', staffId: 'STF005', status: 'Hoàn tất', priority: 'Trung bình', ai_priority_reason: 'Dọn dẹp sau bữa ăn cần thực hiện sớm để giữ vệ sinh phòng → Ưu tiên Trung bình.', assignedAt: '2026-10-07T10:15:00', completedAt: '2026-10-07T10:33:00' }
    ];

    /* ---------- Phản hồi của khách ---------- */
    const feedback = [
        { id: 'FB001', stayId: 'STR004', rating: 4, comment: 'Phòng sạch sẽ, nhân viên thân thiện. Nhưng điều hòa hơi ồn vào ban đêm, khiến mình khó ngủ. Nhìn chung vẫn hài lòng với kỳ nghỉ.', ai_summary: 'Chủ đề: Vệ sinh (+), Nhân viên (+), Điều hòa (-). Đánh giá tích cực về cơ sở vật chất và thái độ phục vụ, góp ý về độ ồn điều hòa.', createdAt: '2026-10-01T11:00:00' },
        { id: 'FB002', stayId: 'STR001', rating: 5, comment: 'Dịch vụ tuyệt vời! Đội ngũ lễ tân rất nhiệt tình, phòng ăn ngon và đa dạng. Sẽ quay lại lần sau.', ai_summary: 'Chủ đề: Lễ tân (+), Ăn uống (+). Phản hồi rất tích cực, khách hài lòng về thái độ phục vụ và chất lượng ẩm thực.', createdAt: '2026-10-07T08:30:00' },
        { id: 'FB003', stayId: 'STR005', rating: 3, comment: 'View phòng rất đẹp, nhưng dịch vụ spa đặt trước bị chậm giờ. Nhân viên spa cũng không đúng giờ hẹn.', ai_summary: 'Chủ đề: View phòng (+), Spa (-). Đánh giá trung bình, view phòng được khen nhưng chất lượng dịch vụ spa chưa đảm bảo đúng giờ.', createdAt: '2026-10-09T10:15:00' },
        { id: 'FB004', stayId: 'STR003', rating: 5, comment: 'Gia đình mình rất vui khi ở khách sạn. Nhân viên quan tâm trẻ em rất chu đáo, có khu vui chơi cho con. Cảm ơn khách sạn nhiều!', ai_summary: 'Chủ đề: Dịch vụ gia đình (+), Trẻ em (+), Nhân viên (+). Phản hồi rất tích cực, đặc biệt khen ngợi sự quan tâm đến khách gia đình và trẻ em.', createdAt: '2026-10-10T09:00:00' },
        { id: 'FB005', stayId: 'STR002', rating: 2, comment: 'Phòng có mùi ẩm, ga giường không sạch. Gọi điện yêu cầu thay nhưng mất quá lâu nhân viên mới đến. Rất thất vọng.', ai_summary: 'Chủ đề: Vệ sinh (-), Thời gian phục vụ (-). Đánh giá tiêu cực về chất lượng phòng và tốc độ phản hồi của nhân viên.', createdAt: '2026-10-08T14:30:00' }
    ];

    return {
        staff: staff,
        shifts: shifts,
        serviceTypes: serviceTypes,
        stays: stays,
        requests: requests,
        tasks: tasks,
        feedback: feedback
    };
});
