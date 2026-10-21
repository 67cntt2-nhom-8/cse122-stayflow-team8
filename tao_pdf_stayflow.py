from pathlib import Path
from xml.etree import ElementTree as ET
import zipfile
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'StayFlow_Phan_tich_4_tieu_chi_muc_1_1.pdf'
pdfmetrics.registerFont(TTFont('ArialVN', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialVN-Bold', 'C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('ArialVN', normal='ArialVN', bold='ArialVN-Bold')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='VN', fontName='ArialVN', fontSize=10, leading=15, spaceAfter=7, textColor=colors.HexColor('#243447')))
styles.add(ParagraphStyle(name='TitleVN', parent=styles['VN'], fontName='ArialVN-Bold', fontSize=25, leading=33, spaceAfter=18))
styles.add(ParagraphStyle(name='HeadVN', parent=styles['VN'], fontName='ArialVN-Bold', fontSize=16, leading=22, spaceAfter=12, textColor=colors.HexColor('#126b75')))
styles.add(ParagraphStyle(name='SubVN', parent=styles['VN'], fontName='ArialVN-Bold', fontSize=11, leading=16, spaceBefore=8))
styles.add(ParagraphStyle(name='CellVN', parent=styles['VN'], fontSize=8, leading=11, spaceAfter=0))
story = []

def p(text, style='VN'):
    return Paragraph(text, styles[style])

def add(text, style='VN'):
    story.append(p(text, style))

def title(text):
    add(text, 'HeadVN')

def sub(text):
    add(text, 'SubVN')

def table(headers, rows, widths):
    data = [[p(escape(str(x)), 'CellVN') for x in headers]]
    data += [[p(escape(str(x)), 'CellVN') for x in row] for row in rows]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0),(-1,0),colors.HexColor('#dceef0')),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f3f6f8')]),
        ('VALIGN',(0,0),(-1,-1),'TOP'), ('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#c6d4dc')),
        ('LEFTPADDING',(0,0),(-1,-1),6), ('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),6), ('BOTTOMPADDING',(0,0),(-1,-1),6),
    ]))
    story.append(t)
    story.append(Spacer(1,9))

def page():
    story.append(PageBreak())

# Verify the requested scope directly against the original DOCX.
with zipfile.ZipFile(ROOT / 'CSE122_HUONG_DAN_THUC_HIEN_BTL.docx') as z:
    xml = ET.fromstring(z.read('word/document.xml'))
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
paras = [''.join(t.text or '' for t in e.findall('.//w:t', ns)) for e in xml.findall('.//w:p', ns)]
idx = next(i for i, s in enumerate(paras) if s.startswith('1.1.') and 'Sau BTL' in s)
criteria = paras[idx+1:idx+5]
assert len(criteria) == 4 and 'bảng kiểm kê màn hình' in criteria[3]

story.append(Spacer(1,32))
add('STAYFLOW', 'TitleVN')
add('Điều phối dịch vụ trong thời gian lưu trú', 'HeadVN')
add('BÁO CÁO PHÂN TÍCH ĐỀ TÀI<br/>Theo 4 tiêu chí đầu của mục 1.1', 'SubVN')
add('<b>Học phần:</b> Phát triển ứng dụng web cơ bản – CSE122<br/><b>Lĩnh vực:</b> Khách sạn / Hospitality<br/><b>Quy mô nhóm:</b> 3 sinh viên<br/><b>Loại sản phẩm:</b> Nguyên mẫu Web Frontend đa vai trò')
sub('Phạm vi báo cáo')
for c in criteria:
    add(escape(c))
sub('Cơ sở và giới hạn')
add('Tài liệu được xây dựng từ file hướng dẫn BTL và đề bài BTL-08 StayFlow. Đây là bản phân tích và đề xuất để nhóm trao đổi, hoàn thiện và trình giảng viên duyệt; không phải biên bản xác nhận sản phẩm đã triển khai hoặc đã được duyệt.')
add('Các quy tắc phân quyền, chuyển trạng thái, SLA và màn hình bổ sung trong báo cáo là đề xuất thiết kế. Số màn hình chỉ là kết quả phân tích phạm vi này, không phải chỉ tiêu để cắt bớt nghiệp vụ hoặc tăng số lượng trang.')
sub('Tài liệu nguồn')
add('1. CSE122_HUONG_DAN_THUC_HIEN_BTL.docx – mục 1.1.<br/>2. BTL-08_stayflow-ieu-phoi-dich-vu-trong-thoi-gian-luu-tru.md – đề tài, vai trò, giao diện nền tảng và nguyên tắc phạm vi.')
page()

title('1. Hiểu và phân tích một bài toán thực tế')
sub('1.1. Bối cảnh và nhu cầu')
add('Trong thời gian lưu trú, khách có thể cần bổ sung khăn, dọn phòng, sửa điều hòa hoặc hỗ trợ dịch vụ khác. Khi yêu cầu chủ yếu được truyền qua điện thoại hoặc trao đổi trực tiếp, thông tin dễ phân tán giữa lễ tân và các bộ phận. Khách khó biết tiến độ; nhân viên khó xác định việc cần làm trước; quản lý khó theo dõi chất lượng phục vụ.')
table(['Vấn đề', 'Nguyên nhân cần kiểm chứng', 'Hệ quả', 'Đáp ứng đề xuất'], [
('P1. Yêu cầu dễ thất lạc','Thiếu nơi ghi nhận tập trung','Bỏ sót hoặc xử lý trùng','Mỗi yêu cầu có mã, nội dung, thời điểm và lịch sử.'),
('P2. Khách không biết tiến độ','Trạng thái không được chia sẻ','Khách phải hỏi lại nhiều lần','Danh sách, chi tiết yêu cầu và thông báo cập nhật.'),
('P3. Khó ưu tiên công việc','Thiếu mức ưu tiên, người nhận và hạn SLA','Chậm xử lý việc quan trọng','Bảng công việc, điều phối và theo dõi hạn.'),
('P4. Thiếu insight chất lượng','Phản hồi và thời gian xử lý rời rạc','Khó phát hiện điểm nghẽn','Báo cáo SLA, phản hồi và tóm tắt chủ đề.')
], [78,135,110,188])
sub('1.2. Giải pháp và phạm vi')
add('StayFlow tập trung hóa luồng: khách tạo yêu cầu → quản lý điều phối → nhân viên thực hiện → khách theo dõi và đánh giá → quản lý tổng hợp. Quản trị viên duy trì loại dịch vụ và tài khoản để vận hành luồng này.')
add('<b>Trong phạm vi:</b> 4 vai trò; yêu cầu dịch vụ, task, ca làm, loại dịch vụ, tài khoản, phản hồi; CRUD/trạng thái; tìm kiếm, lọc, validation; responsive; 3 trải nghiệm AI mô phỏng có người dùng kiểm soát.')
add('<b>Ngoài phạm vi:</b> đặt phòng, thanh toán, quản lý doanh thu, kết nối hệ thống khách sạn thật, xác thực/bảo mật máy chủ. Phân quyền Frontend chỉ mô phỏng trải nghiệm, không bảo vệ dữ liệu thật.')
sub('1.3. Kết quả mong đợi và cách kiểm tra')
add('Với dữ liệu thử, một yêu cầu phải đi từ lúc tạo đến hoàn thành, hiển thị thống nhất giữa các vai trò và có lịch sử cập nhật. Hủy phải có điều kiện; dữ liệu không hợp lệ không được lưu; yêu cầu quá hạn phải xuất hiện ở màn hình SLA. Báo cáo phải phản ánh đúng các bản ghi mẫu, không dùng số liệu trang trí.')
add('<b>Cần xác nhận thêm:</b> thời hạn SLA từng loại dịch vụ, thời gian phục vụ, quyền hủy/sửa của khách và quy trình xử lý yêu cầu bị từ chối. Không có dữ liệu khảo sát thực tế trong tài liệu nguồn, nên không khẳng định mức cải thiện định lượng.')
page()

title('2. Phân tích đối tượng sử dụng và xác định vai trò')
table(['Vai trò', 'Bối cảnh / nhu cầu', 'Quyền nghiệp vụ đề xuất', 'Giới hạn'], [
('Khách lưu trú','Chủ yếu dùng điện thoại; cần thao tác nhanh và biết tiến độ.','Tạo, xem yêu cầu của mình; sửa/hủy khi đang chờ; gửi phản hồi sau hoàn thành.','Không xem yêu cầu của khách khác; không phân công nhân viên.'),
('Nhân viên vận hành','Xử lý theo ca; cần biết nhiệm vụ, vị trí, ưu tiên và hạn.','Xem task được giao; nhận việc; cập nhật tiến độ, ghi chú và hoàn thành.','Không quản trị tài khoản; không tự thay SLA hoặc sửa yêu cầu gốc.'),
('Quản lý khách sạn','Theo dõi nhiều bộ phận; cần điều phối và phát hiện quá hạn.','Xem toàn bộ yêu cầu; phân công/đổi người; chỉnh ưu tiên; xử lý ngoại lệ; xem báo cáo và phản hồi.','Không mặc định có quyền quản trị tài khoản hệ thống.'),
('Quản trị viên','Duy trì danh mục và tài khoản; cần tránh sửa sai dữ liệu nền.','Tạo/sửa/vô hiệu hóa loại dịch vụ và tài khoản; gán vai trò; theo dõi tổng quan quản trị.','Không thay quản lý xác nhận hoàn tất nghiệp vụ phục vụ.')
], [82,136,184,109])
sub('2.1. Vì sao cần 4 vai trò?')
add('Khách là người phát sinh nhu cầu; nhân viên là người thực hiện; quản lý quyết định phân công và giám sát; quản trị viên duy trì dữ liệu nền và quyền truy cập. Tách vai trò giúp tránh việc người tạo yêu cầu tự xác nhận xử lý, hoặc nhân viên tự thay đổi quyền hệ thống.')
sub('2.2. Dữ liệu và quan hệ')
add('<b>stays:</b> gắn khách với đợt lưu trú/phòng. <b>requests:</b> gắn khách, đợt lưu trú, loại dịch vụ, ưu tiên, hạn và trạng thái. <b>tasks:</b> gắn yêu cầu với nhân viên và tiến độ. <b>serviceTypes:</b> bộ phận xử lý và SLA đề xuất. <b>feedback:</b> gắn yêu cầu đã hoàn thành với đánh giá. <b>staff:</b> nhân sự, bộ phận và ca làm.')
add('Đề xuất bổ sung <b>users</b> cho tài khoản/vai trò và <b>notifications</b> cho thông báo. Không đồng nhất tài khoản khách với staff. Một yêu cầu có thể có nhiều task; chỉ hoàn tất khi tất cả task bắt buộc đã xong và quản lý xác nhận.')
sub('2.3. Phân công dự kiến')
add('<b>SV1:</b> khách lưu trú + điều hướng/khả năng tiếp cận.<br/><b>SV2:</b> nhân viên + dữ liệu/tương tác.<br/><b>SV3:</b> quản lý và quản trị + tích hợp/QA. Đây là gợi ý từ đề bài; nhóm cần cân bằng lại khối lượng. Mỗi người phải làm trọn một lát cắt từ phân tích đến HTML, CSS, JavaScript, dữ liệu, Git và OBS; không phân chia chỉ theo công nghệ.')
page()

title('3. Mục tiêu, nhiệm vụ và luồng người dùng')
table(['Mã / vai trò', 'Mục tiêu', 'Nhiệm vụ', 'Màn hình liên quan'], [
('G1 – Khách','Gửi đúng nhu cầu','Chọn dịch vụ; nhập mô tả; kiểm tra gợi ý AI; xác nhận gửi.','G01, G02, G04'),
('G2 – Khách','Theo dõi và phản hồi','Lọc yêu cầu; xem lịch sử; sửa/hủy hợp lệ; đánh giá.','G03, G04, G05, C04'),
('S1 – Nhân viên','Xử lý công việc đúng hạn','Xem việc theo ca; nhận task; cập nhật; báo trở ngại; hoàn tất.','S01, S02, S03'),
('M1 – Quản lý','Điều phối đúng người và ưu tiên','Xem yêu cầu; kiểm tra AI; phân công; xử lý ngoại lệ.','M01, M02, M03'),
('M2 – Quản lý','Giám sát chất lượng','Lọc quá hạn; xem báo cáo; đọc và tổng hợp phản hồi.','M03, M04, M05'),
('A1 – Quản trị','Duy trì dữ liệu nền','Tạo/sửa/vô hiệu hóa dịch vụ, tài khoản; kiểm tra dữ liệu.','A01–A05')
], [82,110,197,122])
sub('3.1. Luồng khách tạo và theo dõi yêu cầu')
add('C01 Đăng nhập → G01 Tổng quan → G02 Tạo yêu cầu → chọn đợt lưu trú/loại dịch vụ, nhập mô tả → validation → AI phân loại → khách chấp nhận, sửa hoặc bỏ qua → xác nhận gửi → G04 Chi tiết (Đang chờ) → G03 Danh sách để theo dõi.')
add('<b>Nhánh ngoại lệ:</b> thiếu mô tả hoặc đợt lưu trú không hợp lệ → lỗi tại trường, giữ dữ liệu đã nhập. AI không đủ dữ liệu → chọn bộ phận thủ công. Lưu thất bại → báo lỗi và cho thử lại, không hiển thị thành công giả. Khách chỉ sửa/hủy khi yêu cầu còn Đang chờ theo quy tắc đề xuất.')
sub('3.2. Luồng quản lý điều phối')
add('M01 Bảng điều phối → chọn yêu cầu Đang chờ → M02 Chi tiết/điều phối → AI gợi ý ưu tiên và lý do → quản lý chấp nhận hoặc điều chỉnh → chọn nhân viên phù hợp → xác nhận giao → tạo task và chuyển yêu cầu sang Đã phân công → M03 Giám sát SLA.')
add('<b>Nhánh ngoại lệ:</b> không có nhân viên phù hợp → giữ chờ và hiển thị cảnh báo. Phân công thất bại → không tạo task trùng. Yêu cầu không thể phục vụ → nhập lý do từ chối và thông báo khách. Điều chuyển cần ghi nhận người cũ/người mới trong lịch sử.')
page()

title('3. Mục tiêu, nhiệm vụ và luồng (tiếp)')
sub('3.3. Luồng nhân viên thực hiện')
add('S03 Ca làm → S01 Bảng công việc → S02 Chi tiết task → nhận việc → Đang xử lý → cập nhật ghi chú → gửi kết quả hoàn tất → quản lý kiểm tra tại M02 → nếu mọi task bắt buộc hoàn tất thì yêu cầu Hoàn thành → khách nhận thông báo C04 và xem G04.')
add('<b>Nhánh ngoại lệ:</b> không thể thực hiện → báo trở ngại/lý do, yêu cầu vẫn đang xử lý; quản lý điều chuyển hoặc từ chối có lý do. Task bị điều chuyển không được tiếp tục cập nhật bằng nhân viên cũ. Không coi hoàn thành một task là hoàn thành toàn bộ yêu cầu nhiều task.')
sub('3.4. Luồng đánh giá và báo cáo')
add('G04 Yêu cầu Hoàn thành → G05 Đánh giá dịch vụ → nhập điểm/nội dung → kiểm tra hợp lệ → lưu feedback → M05 Danh sách phản hồi → AI tóm tắt chủ đề → quản lý chấp nhận/sửa/từ chối → lưu bản tóm tắt → M04 Báo cáo đối chiếu với dữ liệu gốc.')
sub('3.5. Luồng quản trị')
add('A01 Tổng quan → A02 Loại dịch vụ hoặc A04 Tài khoản → A03/A05 Tạo hoặc sửa → kiểm tra tên, mã, dữ liệu bắt buộc và vai trò → lưu → quay lại danh sách. Vô hiệu hóa cần xác nhận; bản ghi đang được sử dụng được giữ lại để bảo toàn lịch sử.')
sub('3.6. Trạng thái nghiệp vụ đề xuất')
table(['Đối tượng', 'Luồng chính', 'Quy tắc / ngoại lệ'], [
('Yêu cầu','Đang chờ → Đã phân công → Đang xử lý → Hoàn thành','Khách hủy khi Đang chờ; quản lý từ chối có lý do trước khi bắt đầu. Đã hủy/Bị từ chối là trạng thái kết thúc.'),
('Task','Được giao → Đã nhận → Đang xử lý → Hoàn thành','Trở ngại là cờ kèm lý do; quản lý có thể điều chuyển. Mỗi chuyển trạng thái lưu tác nhân/thời gian.'),
('Danh mục / tài khoản','Hoạt động ↔ Vô hiệu hóa','Không xóa vật lý dữ liệu đã được tham chiếu. Tài khoản vô hiệu hóa không vào được luồng mô phỏng.'),
('SLA','Trong hạn / Sắp đến hạn / Quá hạn','Là nhãn suy ra từ hạn xử lý và thời điểm hiện tại, không thay thế trạng thái yêu cầu.')
], [90,180,241])
add('<b>SLA đề xuất:</b> hạn = thời điểm gửi + thời lượng SLA cấu hình của loại dịch vụ; nguyên mẫu chưa tính giờ làm việc/ngày nghỉ. Ngưỡng “sắp đến hạn” phải cấu hình rõ trong dữ liệu demo. Các quy tắc này cần được giảng viên/nhóm xác nhận.')
page()

title('4. Bảng kiểm kê màn hình cần thiết')
add('Bảng dưới đây là kiểm kê đề xuất trước khi code. Mã G/S/M/A/C dùng để truy vết từ mục tiêu và luồng ở phần 3. Các trang chi tiết được tái sử dụng theo ID; không tạo một trang mới cho mỗi bản ghi. Modal sửa/hủy/xác nhận và trạng thái lỗi không tính thành màn hình độc lập.')
sub('4.1. Khách lưu trú – SV1 phụ trách dự kiến')
table(['Mã / mục tiêu', 'Màn hình / tệp', 'Nhiệm vụ & CRUD/trạng thái', 'AI'], [
('G01 / G1,G2','Tổng quan khách\nguest-dashboard.html','R: lưu trú, yêu cầu gần đây, nút tạo yêu cầu.','Không'),
('G02 / G1','Tạo yêu cầu\nguest-service-request.html','C: chọn dịch vụ, nhập nội dung, kiểm tra và gửi.','AI-1 phân loại'),
('G03 / G2','Yêu cầu của tôi\nguest-my-requests.html','R/U/D: tìm, lọc; sửa/hủy yêu cầu Đang chờ bằng modal.','Không'),
('G04 / G1,G2','Chi tiết yêu cầu (*)\nguest-request-detail.html','R/U/D: lịch sử, tiến độ; sửa/hủy hợp lệ; mở đánh giá.','Không'),
('G05 / G2','Đánh giá dịch vụ (*)\nguest-feedback.html','C/R/U: gửi/xem/sửa phản hồi theo yêu cầu hoàn thành.','Không')
], [78,177,190,66])
sub('4.2. Nhân viên vận hành – SV2 phụ trách dự kiến')
table(['Mã / mục tiêu', 'Màn hình / tệp', 'Nhiệm vụ & CRUD/trạng thái', 'AI'], [
('S01 / S1','Bảng công việc\nstaff-task-board.html','R: lọc theo trạng thái, ưu tiên, hạn và công việc được giao.','Không'),
('S02 / S1','Chi tiết công việc\nstaff-task-detail.html','R/U: nhận việc, ghi chú, báo trở ngại, gửi hoàn tất.','Không'),
('S03 / S1','Ca làm\nstaff-shift-view.html','C/R/U/D: xem ca, tạo/sửa/hủy đề nghị đổi ca; quản lý duyệt tại M02.','Không')
], [78,177,190,66])
add('(*) Màn hình bổ sung ngoài danh sách nền tảng của đề bài. G04 cần cho lịch sử và xử lý ngoại lệ; G05 cần cho phản hồi gắn yêu cầu hoàn thành. Đề nghị đổi ca là phương án cụ thể hóa nghiệp vụ ở Shift View, cần được xác nhận; không cho nhân viên tự sửa lịch ca chính thức.')
page()

title('4. Bảng kiểm kê màn hình (tiếp)')
sub('4.3. Quản lý khách sạn – SV3 phụ trách dự kiến')
table(['Mã / mục tiêu', 'Màn hình / tệp', 'Nhiệm vụ & CRUD/trạng thái', 'AI'], [
('M01 / M1','Bảng điều phối\nmanager-dispatch-board.html','R: xem hàng đợi, bộ phận, người nhận và ưu tiên.','Không'),
('M02 / M1','Chi tiết/điều phối (*)\nmanager-request-detail.html','C/R/U: tạo task, phân công, điều chuyển, xác nhận hoàn tất; duyệt đổi ca bằng modal.','AI-2 ưu tiên'),
('M03 / M1,M2','Giám sát SLA\nmanager-sla-monitor.html','R/U: lọc quá hạn, cập nhật ghi chú theo dõi/escalation.','Không'),
('M04 / M2','Báo cáo dịch vụ\nmanager-service-report.html','C/R/U/D: tạo, lưu, sửa bộ lọc báo cáo, lưu trữ báo cáo; xem chỉ số.','Không'),
('M05 / M2','Phản hồi khách (*)\nmanager-feedback.html','R/U: lọc, đọc phản hồi, lưu tóm tắt và ghi chú xử lý.','AI-3 tóm tắt')
], [78,177,190,66])
sub('4.4. Quản trị viên – SV3 phụ trách dự kiến')
table(['Mã / mục tiêu', 'Màn hình / tệp', 'Nhiệm vụ & CRUD/trạng thái', 'AI'], [
('A01 / A1','Tổng quan quản trị\nadmin-dashboard.html','R: thống kê danh mục, tài khoản và cảnh báo dữ liệu.','Không'),
('A02 / A1','Quản lý loại dịch vụ\nadmin-service-type-management.html','R/U/D: tìm, lọc, chuyển sang form; vô hiệu hóa có xác nhận.','Không'),
('A03 / A1','Form loại dịch vụ (*)\nadmin-service-type-form.html','C/R/U: tên/mã, bộ phận, thời lượng SLA; validation.','Không'),
('A04 / A1','Quản lý tài khoản\nadmin-user-management.html','R/U/D: tìm, lọc; vô hiệu hóa; bảo toàn lịch sử.','Không'),
('A05 / A1','Form tài khoản (*)\nadmin-user-form.html','C/R/U: thông tin, vai trò, bộ phận nếu là nhân viên.','Không')
], [78,177,190,66])
add('Các màn hình form riêng được đề xuất để bao phủ nhập liệu và validation, không để tăng số trang. Có thể gộp A03/A05 thành modal nếu bản thiết kế chứng minh trải nghiệm đầy đủ; khi đó cập nhật kiểm kê và số video tương ứng. M02 bao gồm thông tin nhân sự/ca để duyệt đề nghị đổi ca, không cần tạo một trang riêng cho thao tác nhỏ.')
page()

title('4. Bảng kiểm kê màn hình dùng chung')
sub('4.5. Màn hình dùng chung – phân công dự kiến')
table(['Mã / người làm', 'Màn hình / tệp', 'Nhiệm vụ & CRUD/trạng thái', 'AI'], [
('C01 / SV1','Đăng nhập\nlogin.html','Kiểm tra dữ liệu demo, vào đúng vai trò; báo sai thông tin/tài khoản vô hiệu hóa.','Không'),
('C02 / SV1','Hồ sơ\nprofile.html','R/U: xem/sửa thông tin của tài khoản hiện tại, validation.','Không'),
('C03 / SV2','Cài đặt\nsettings.html','R/U: lựa chọn giao diện và thông báo; lưu thiết lập cá nhân.','Không'),
('C04 / SV2','Thông báo\nnotifications.html','R/U: lọc, đánh dấu đã đọc; mở yêu cầu/task đúng quyền.','Không'),
('C05 / SV3','Không có quyền\n403.html','Thông báo truy cập sai vai trò; quay về tổng quan.','Không'),
('C06 / SV3','Không tìm thấy\n404.html','Thông báo trang/ID không tồn tại; điều hướng về trang hợp lệ.','Không')
], [78,177,190,66])
sub('4.6. Các màn hình đã cân nhắc nhưng chưa đưa vào MVP')
add('<b>index.html:</b> có thể chỉ chuyển tới đăng nhập hoặc dashboard, không coi là giao diện độc lập nếu không có nội dung riêng.<br/><b>register.html:</b> chưa cần vì tài khoản demo do quản trị viên cung cấp; nếu cho khách tự đăng ký thì phải bổ sung luồng xác minh đợt lưu trú.<br/><b>forgot-password.html:</b> chưa đưa vào do không có dịch vụ gửi email/reset thật; nếu mô phỏng thì phải ghi rõ giới hạn và bổ sung kiểm kê.')
sub('4.7. Tổng hợp phạm vi')
table(['Nhóm màn hình', 'Số lượng đề xuất', 'Phụ trách chính dự kiến'], [
('Khách lưu trú','5','SV1'),('Nhân viên vận hành','3','SV2'),('Quản lý khách sạn','5','SV3'),('Quản trị viên','5','SV3'),('Dùng chung','6','SV1: 2; SV2: 2; SV3: 2'),('Tổng','24','Cần cân bằng lại trước khi chốt')
], [220,120,171])
add('Phạm vi đề xuất hiện có 24 giao diện độc lập, bao gồm 12 giao diện nền tảng. Đây chưa phải kiểm kê đã duyệt. SV3 đang có khối lượng lớn; nên phân lại một lát cắt quản trị cho SV1 hoặc SV2 trước khi chốt, đồng thời vẫn bảo đảm trách nhiệm theo vai trò và review chéo.')
page()

title('4. Bao phủ trạng thái và kiểm tra tính đầy đủ')
table(['Nhóm / màn hình', 'Trạng thái cần thiết', 'Cách xử lý'], [
('Danh sách: G03, S01, M01, M03, M05, A02, A04, C04','Bình thường, đang tải, rỗng, lỗi','Thông báo rỗng theo bộ lọc; thử lại khi lỗi; giữ điều kiện lọc.'),
('Form: G02, G05, A03, A05, C01, C02','Không hợp lệ, đang gửi, thành công, lỗi, vô hiệu hóa','Lỗi sát trường; khóa gửi khi xử lý; chống gửi trùng; giữ dữ liệu khi lỗi.'),
('Chi tiết: G04, S02, M02','Đang chờ, bị từ chối, đang xử lý, hoàn thành, đã hủy','Hiển thị lịch sử/lý do; chỉ cho thao tác hợp lệ theo vai trò và trạng thái.'),
('S03, M04, A02, A04','Chờ duyệt, từ chối; lưu trữ/vô hiệu hóa khi phù hợp','Xác nhận thao tác; giữ liên kết lịch sử; thông báo kết quả.'),
('AI: G02, M02, M05','Nhập, đang xử lý, kết quả, không chắc chắn, lỗi','Giải thích; chấp nhận/sửa/từ chối/tạo lại/lưu; cho dùng thủ công.'),
('A01, G01, C03, C05, C06','Bình thường, rỗng/lỗi dữ liệu khi phù hợp; thành công khi lưu thiết lập','Không áp mọi trạng thái máy móc; luôn có điều hướng rõ ràng.')
], [147,169,195])
sub('4.8. Kiểm tra bao phủ luồng end-to-end')
add('• Tạo và theo dõi: C01 → G01 → G02 → G04/G03.<br/>• Điều phối và thực hiện: M01 → M02 → S01 → S02 → M02 → G04.<br/>• Giám sát và chất lượng: M03 → M02; G04 → G05 → M05 → M04.<br/>• Dữ liệu nền: A01 → A02 → A03 và A01 → A04 → A05.<br/>• Điều hướng hỗ trợ: C02/C03/C04; sai quyền → C05; sai trang/ID → C06.')
sub('4.9. Điều kiện để nhóm chứng minh 4 tiêu chí')
add('<b>Tiêu chí 1:</b> giải thích được bối cảnh, P1–P4, giải pháp và giới hạn; không chỉ đọc danh sách tính năng.<br/><b>Tiêu chí 2:</b> nêu lý do phân tách 4 vai trò, dữ liệu được xem và thao tác được phép.<br/><b>Tiêu chí 3:</b> đi được luồng chính lẫn nhánh lỗi; chỉ rõ ai thao tác, dữ liệu thay đổi và màn hình tiếp theo.<br/><b>Tiêu chí 4:</b> đối chiếu từng nhiệm vụ với màn hình, tệp, CRUD/trạng thái, AI và người phụ trách; không có bước nghiệp vụ quan trọng bị bỏ trống.')
add('<b>Trước khi triển khai:</b> chốt quy tắc nghiệp vụ và phân công → cập nhật kiểm kê → lập user flow và Figma/Canva → trình giảng viên duyệt. Bản phân tích này không thay thế bản thiết kế hoặc minh chứng cá nhân. Mỗi sinh viên phải hiểu và giải thích được phần mình phụ trách.')

def footer(c, doc):
    c.setStrokeColor(colors.HexColor('#c6d4dc'))
    c.line(42, 39, A4[0]-42, 39)
    c.setFont('ArialVN', 8)
    c.setFillColor(colors.HexColor('#526476'))
    c.drawString(42, 26, 'CSE122 | StayFlow | Phân tích 4 tiêu chí đầu – mục 1.1')
    c.drawRightString(A4[0]-42, 26, f'Trang {doc.page}')

doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=42, leftMargin=42, topMargin=40, bottomMargin=54,
                        title='StayFlow – Phân tích 4 tiêu chí đầu mục 1.1', author='Báo cáo phân tích đề tài StayFlow')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
reader = PdfReader(str(OUTPUT))
text = '\n'.join(pg.extract_text() for pg in reader.pages)
for needle in ['Hiểu và phân tích', 'vai trò', 'luồng người dùng', 'bảng kiểm kê màn hình', 'guest-request-detail.html', 'manager-feedback.html', '24']:
    assert needle in text, needle
assert len(reader.pages) == 9, f'Unexpected pagination: {len(reader.pages)}'
(ROOT / 'StayFlow_kiem_tra_pdf.txt').write_text(
    f'PDF: {OUTPUT.name}\nSố trang: {len(reader.pages)}\nDung lượng: {OUTPUT.stat().st_size} bytes\n'
    'Đã kiểm tra: 4 tiêu chí gốc từ DOCX; nội dung tiếng Việt trích xuất được; các màn hình bổ sung; tổng 24 màn hình.\n'
    + '\n'.join(f'Trang {i}: {len(pg.extract_text())} ký tự' for i, pg in enumerate(reader.pages, 1)), encoding='utf-8')
print(f'PDF: {OUTPUT}\nPages: {len(reader.pages)}\nSize: {OUTPUT.stat().st_size} bytes')
for i, pg in enumerate(reader.pages, 1):
    print(f'Page {i}: {len(pg.extract_text())} characters')