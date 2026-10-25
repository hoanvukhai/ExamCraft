# BÁO CÁO KIỂM TOÁN CHỮ GIAO DIỆN VÀ TƯƠNG THÍCH MÀN HÌNH NHỎ (375PX)
*Hệ thống ExamCraft — Phân tích chi tiết thành phần giao diện người dùng*

- **Người thực hiện:** Gemini (QA & UI/UX Auditor)
- **Nhiệm vụ:** GEM-R3 (P1, Generation 10)
- **Căn cứ mã nguồn:** Thư mục `src/components/` và `src/app/` tại commit `rebuild/2026-10-local HEAD`
- **Thời điểm kiểm toán (UTC):** 2026-10-25T10:15:00Z
- **Lưu ý loại trừ:** Không kiểm tra lại cụm nút ĐÚNG/SAI của học sinh tại `src/app/a/[publicId]/page.tsx` do Người chỉ đạo Claude đã trực tiếp hiệu chỉnh và nghiệm thu trên trình duyệt 375px.

---

## 1. BẢNG TỔNG HỢP RÀ SOÁT CHỮ GIAO DIỆN VÀ MÀN HÌNH 375PX

| STT | Tệp mã nguồn | Vị trí dòng | Phân loại vấn đề | Hiện trạng chi tiết | Đề xuất hiệu chỉnh | Mức độ tin cậy |
|:---:|---|:---:|---|---|---|:---:|
| 1 | `src/components/A4Preview.tsx` | Dòng 105–165 | Nghi tràn 375px | Thanh nút 5 chế độ xem (Đề in ấn, Song song, Barem, Lời giải, Ma trận) xếp ngang trong thanh pill tròn cố định không có cuộn ngang, tổng độ rộng vượt 500px gây tràn màn hình 375px. | Thêm lớp overflow-x-auto và no-scrollbar vào thẻ bọc ngoài thanh pill để hỗ trợ vuốt cuộn ngang mượt mà trên di động. | Chắc chắn |
| 2 | `src/components/ShareModal.tsx` | Dòng 248–268 | Nghi tràn 375px | Thanh chuyển thẻ modal gồm 2 nút văn bản dài (Giao Bài Thi Online... và Link Xem / Tải Word...) xếp flex row trên màn hình 375px bị co ép chữ xuống dòng méo mó. | Thêm breakpoint sm:flex-row flex-col hoặc rút gọn nhãn nút trên di động thành: Giao bài trực tuyến và Link xem/tải Word. | Chắc chắn |
| 3 | `src/components/ShareModal.tsx` | Dòng 480–481 | Nghi tràn 375px | Tiêu đề khối details Tùy chọn nâng cao... dài 54 ký tự hiển thị tràn lề sát mép phải trên màn hình hẹp 375px. | Rút ngắn tiêu đề hiển thị trên mobile thành: Tùy chọn nâng cao (giờ, lượt, mã). | Nghi |
| 4 | `src/components/Header.tsx` | Dòng 308 | Nghi tràn 375px | Hộp menu hồ sơ người dùng đặt độ rộng cố định w-72 (288px) kèm right-0; khi mở trên viewport 375px căn sát mép màn hình dễ bị đè lên thanh cuộn. | Đổi thành w-[calc(100vw-32px)] max-w-xs right-2 để luôn cách đều hai mép màn hình di động 16px. | Cần xem trên trình duyệt |
| 5 | `src/components/TeacherDashboard.tsx` | Dòng 811 | Nghi tràn 375px | Ô nhập tìm kiếm kho đề đặt lớp flex-1 min-w-40 (tối thiểu 160px); khi đứng cạnh các nút lọc có nguy cơ đẩy rớt dòng. | Đặt min-w-0 flex-1 trên màn hình nhỏ dưới sm để ô tìm kiếm tự động co giãn theo không gian thực tế. | Nghi |
| 6 | `src/components/TeacherDashboard.tsx` | Dòng 1144, 1151, 1159 | Nút bấm thấp (< 40px) | Các nút thao tác nhanh trên từng hàng đề thi (Tải Word, Nhân bản, Thùng rác) dùng lớp p-1.5 với icon 14px tạo vùng chạm chỉ đạt 26px x 26px, rất khó bấm trên cảm ứng di động. | Tăng vùng đệm lên p-2.5 hoặc min-h-10 min-w-10 để đạt kích thước vùng chạm tối thiểu 40px–44px chuẩn công thái học di động. | Chắc chắn |
| 7 | `src/app/teacher/assignments/[id]/page.tsx` | Dòng 724, 731 | Nút bấm thấp (< 40px) | Nút Xem bài (px-3 py-1.5) và nút Xóa lượt làm (p-1.5) trong bảng điểm học sinh có chiều cao thực tế khoảng 28px, dễ gây chạm nhầm trên điện thoại. | Đổi thành py-2 px-3.5 và min-h-10 để đảm bảo ngón tay chạm chuẩn xác, tránh vô tình bấm trúng nút xóa lượt thi. | Chắc chắn |
| 8 | `src/components/RegradePanel.tsx` | Dòng 76, 77 | Nút bấm thấp (< 40px) | Nút Xem trước ảnh hưởng và Sửa đáp án và chấm lại sử dụng lớp px-3 py-1.5, chiều cao chỉ khoảng 30px. | Điều chỉnh thành py-2.5 px-4 min-h-10 text-xs sm:text-sm để vùng bấm nổi bật và dễ thao tác trên màn hình cảm ứng. | Chắc chắn |
| 9 | `src/components/Header.tsx` | Dòng 143–146 | Nhãn không thống nhất | Nút quay về trang chủ đề thi đặt nhãn là Kho đề, trong khi trang chủ hiển thị tiêu đề Kho Đề Cá Nhân và bộ lọc hiển thị Kho đề của tôi. | Thống nhất dùng tên gọi Kho đề của tôi trên toàn bộ thanh điều hướng và tiêu đề trang chủ. | Chắc chắn |
| 10 | `src/components/TeacherDashboard.tsx` | Dòng 1143 vs A4Preview dòng 74 | Nhãn không thống nhất | Dashboard ghi nhãn là Tải Word, trong khi A4Preview ghi Tải file Word (.docx), trang Share ghi Link Xem / Tải Word (.docx). | Thống nhất chuẩn hóa nhãn rút gọn: Tải file Word (.docx) ở mọi vị trí tải tệp văn bản. | Chắc chắn |
| 11 | `src/components/TeacherDashboard.tsx` | Dòng 1150 vs share/[id] dòng 190 | Nhãn không thống nhất | Dashboard dùng từ Nhân bản, trong khi tệp sinh ra hậu tố (Bản sao), trang share dùng Tạo bản sao để sửa, ShareModal dùng tạo bản sao. | Thống nhất thay chữ Nhân bản bằng Tạo bản sao để đồng bộ thuật ngữ với toàn bộ hệ thống. | Chắc chắn |
| 12 | `src/components/Header.tsx` | Dòng 375 | Lỗi chính tả & diễn đạt | Dòng trạng thái ghi: Tự động xoay tua đa khóa sẵn sàng — cụm từ xoay tua mang tính khẩu ngữ, chưa chuẩn văn phong tin học sư phạm. | Sửa thành: Đã kích hoạt cơ chế tự động luân chuyển khóa AI cá nhân. | Chắc chắn |
| 13 | `src/app/share/[id]/page.tsx` | Dòng 147 | Lỗi chính tả & viết hoa | Huy hiệu hiển thị nhãn: Chế độ Chỉ Xem & Tải về viết hoa tùy tiện các chữ cái đầu từ tiếng Việt. | Đổi thành viết hoa đầu câu chuẩn tiếng Việt: Chế độ chỉ xem và tải về. | Chắc chắn |
| 14 | `src/components/QuestionCard.tsx` | Dòng 622 | Lỗi chính tả / bảng barem | Thẻ tiêu đề cột hiển thị Điểm tối đa thiếu định dạng căn lề số học đồng bộ khi hiển thị trên màn hình hẹp. | Thêm lớp text-center font-semibold và định dạng độ rộng tối thiểu rõ ràng. | Nghi |
| 15 | `src/app/login/page.tsx` | Dòng 50 | Nhãn không thống nhất | Nút gửi form đăng nhập dùng nhãn Đăng nhập hệ thống, trong khi trang chủ và Header dùng Đăng nhập. | Chuẩn hóa thống nhất nhãn nút hành động thành Đăng nhập. | Chắc chắn |

---

## 2. PHÂN TÍCH CHUYÊN SÂU 3 NHÓM VẤN ĐỀ CHÍNH

### 2.1 Nhóm vấn đề co giãn trên màn hình 375px (Viewport Mobile)
- **Thanh chuyển chế độ xem A4Preview:** Khi giáo viên dùng điện thoại để mở xem trước bản in đề thi, thanh pill chứa 5 nút với văn bản tiếng Việt tương đối dài. Không gian 375px bị co kéo khiến các nút bị ép chật chội hoặc đẩy tràn khung nhìn. Giải pháp thêm thuộc tính cuộn ngang `overflow-x-auto` là giải pháp tối ưu và an toàn nhất, giữ nguyên giao diện đẹp trên máy tính và mượt mà trên điện thoại.
- **Thanh chuyển thẻ Modal chia sẻ:** Modal chia sẻ hiện dùng chung cho cả giao bài trực tuyến và lấy link Word. Ở chiều rộng 375px, 2 nút bấm nằm ngang bị ép vào khung 295px. Chuyển sang dạng dọc (flex-col sm:flex-row) sẽ giải phóng hoàn toàn không gian hiển thị.

### 2.2 Nhóm vấn đề kích thước vùng chạm cảm ứng (Touch Target Size)
- Các nút biểu tượng nhỏ (`p-1.5 rounded-full`) trong bảng danh sách bài làm của giáo viên và bảng kho đề hiện có kích thước vật lý khoảng 26px đến 28px.
- Theo khuyến nghị thiết kế công thái học di động (WCAG 2.1 Target Size & Apple Human Interface Guidelines), các phần tử tương tác cảm ứng cần đạt diện tích tối thiểu **44px x 44px** (hoặc ít nhất 40px trên màn hình nhỏ) để tránh việc giáo viên vô tình bấm nhầm sang nút xóa bài thi khi muốn bấm nút xem bài.

### 2.3 Nhóm vấn đề đồng bộ thuật ngữ và câu chữ sư phạm
- Có sự thiếu nhất quán giữa ba thuật ngữ cốt lõi:
  + *Kho đề* vs *Kho Đề Cá Nhân* vs *Kho đề của tôi*.
  + *Tải Word* vs *Tải file Word (.docx)*.
  + *Nhân bản* vs *Tạo bản sao*.
- Việc đồng bộ toàn diện các cụm từ này theo bảng đề xuất ở Mục 1 sẽ nâng cao tính chuyên nghiệp, giúp giáo viên không bị bỡ ngỡ khi chuyển đổi giữa các màn hình làm việc.

---
*Báo cáo kiểm toán chữ giao diện phục vụ đợt hoàn thiện giao diện Pilot ExamCraft 2026.*
