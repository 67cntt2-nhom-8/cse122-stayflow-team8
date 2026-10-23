// =========================================================================
// 403.js — Tiện ích trang 403 (StayFlow)
// -------------------------------------------------------------------------
// Trang gần như tĩnh: cả 2 nút đều là <a> nên điều hướng không cần JS.
// Việc duy nhất của JS: điền sẵn tiêu đề + nội dung vào thư liên hệ quản trị
// (kèm trang đang bị chặn, mã tham chiếu, thời gian) để quản trị dễ tra cứu.
// Không có JS thì mailto vẫn hoạt động bình thường (chỉ thiếu nội dung sẵn).
// =========================================================================

// Phải khớp với mã tham chiếu hiển thị ở footer của 403.html
const REFERENCE_CODE = "ERR-403-128";

const contactLink = document.getElementById("contact-admin");

if (contactLink) {
  // Lấy địa chỉ quản trị từ href gốc ("mailto:admin@stayflow.vn")
  const adminEmail = contactLink.href.replace(/^mailto:/i, "");

  const subject = encodeURIComponent(
    `[StayFlow] Báo cáo lỗi 403 · ${REFERENCE_CODE}`
  );

  // Nối bằng \r\n để client email xuống dòng đúng
  const body = encodeURIComponent(
    [
      "Xin chào quản trị khách sạn,",
      "",
      "Tôi bị từ chối truy cập trang sau với tài khoản hiện tại:",
      window.location.href,
      "",
      `Mã tham chiếu: ${REFERENCE_CODE}`,
      `Thời gian: ${new Date().toLocaleString("vi-VN")}`,
      "",
      "Tôi cho rằng đây là nhầm lẫn phân quyền, mong được kiểm tra lại.",
    ].join("\r\n")
  );

  contactLink.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;
}