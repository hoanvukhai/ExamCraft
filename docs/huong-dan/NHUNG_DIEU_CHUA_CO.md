# NHỮNG ĐIỀU HỆ THỐNG CHƯA CÓ HOẶC CỐ Ý KHÔNG LÀM
*Tài liệu rà soát giới hạn kỹ thuật và phạm vi thiết kế nội bộ dành cho Chủ dự án trước khi kiểm thử*

- *Người thực hiện:* Gemini (QA & Phân tích phạm vi)
- *Nhiệm vụ:* GEM-V3 (P1, Generation 14)
- *Thời điểm lập (UTC):* 2026-10-25T12:45:00Z
- *Căn cứ:* Mục Giới hạn tại các hạng mục công việc đã nghiệm thu trong docs/ke-hoach-2026-10-21/03_CHECKLIST.md.
- *Mục đích:* Giúp Chủ dự án nắm rõ các tính năng hệ thống chưa hỗ trợ hoặc cố ý chưa đưa vào phạm vi sử dụng nội bộ, tránh nhầm lẫn giữa giới hạn thiết kế và lỗi phần mềm (bug).

---

## BẢNG TỔNG HỢP GIỚI HẠN THIẾT KẾ VÀ PHƯƠNG ÁN XỬ LÝ TẠM THỜI

| STT | Việc gì (Hệ thống chưa hỗ trợ / Cố ý không làm) | Cách làm tạm thời | Vì sao (Lý do kỹ thuật và phạm vi) |
|---|---|---|---|
| 1 | Chưa có âm thanh (Audio listening) và tệp đính kèm trong đề thi | Chèn đường liên kết âm thanh hoặc tệp lưu trên Drive vào phần lời dẫn câu hỏi, hoặc bật loa phát chung trên lớp. | ExamCraft phục vụ nhóm nhỏ nội bộ cho các môn cơ bản (Toán, Văn, KHTN). Chủ dự án đã chính thức phê duyệt lược bỏ yêu cầu tệp đính kèm và âm thanh ngày 25/10/2026. |
| 2 | Nhập đề từ văn bản chưa tự bóc tách dạng Điền khuyết, Ghép nối và Sắp xếp | Bấm nút **Thêm câu hỏi** trên thanh công cụ để tự tạo câu hỏi cấu trúc, hoặc chuyển đổi câu hỏi thành trắc nghiệm 4 lựa chọn (A, B, C, D) trước khi dán. | Định dạng văn bản tự do của giáo viên rất đa dạng và dễ xung đột cú pháp với trắc nghiệm A-D hoặc tự luận (xem phân tích tại GEMINI_TEXT_FORMATS.md). |
| 3 | Nhập đề từ Ảnh chụp hoặc file Word (.docx) đòi hỏi phải có khóa AI cá nhân | Mở tệp Word trên máy tính, nhấn phím Ctrl+A để chọn tất cả rồi Ctrl+C sao chép, sau đó dán vào thẻ **Dán văn bản thô (AI Parser)**. | Hệ thống ưu tiên hoạt động cục bộ (local-first) không phụ thuộc mạng ngoại vi; không tích hợp sẵn khóa AI thương mại dùng chung để tránh phát sinh chi phí cho giáo viên. |
| 4 | Không có tính năng Hoàn tác (Undo/Redo) đồng thời giữa nhiều người cùng sửa một đề | Khi có hai người cùng sửa một đề và bị báo xung đột, hệ thống bảo vệ dữ liệu bằng nút **Lưu bản nháp thành đề mới** để giữ lại toàn bộ bài sửa thành đề thi riêng. | Hệ thống thiết kế cho nhóm nội bộ cá nhân, sử dụng cơ chế Snapshot và phát hiện xung đột phiên bản (Optimistic Concurrency) thay vì kiến trúc thời gian thực phức tạp. |
| 5 | Chưa có giao diện gia hạn thời gian cho từng lượt làm bài cá nhân đã mở | Giáo viên có thể điều chỉnh thời hạn đóng phòng thi chung, hoặc cho phép học sinh làm thêm lượt mới bằng cách tăng số lượt làm bài. | Thời lượng làm bài được gắn cứng với phiên làm bài để đảm bảo tính công bằng và chống gian lận trong khảo thí tự động. |
| 6 | Tính năng Chấm lại (Regrade) chưa hỗ trợ câu ghép nối, sắp xếp và rubric tự luận | Vào thẻ **Bảng điểm & Bài nộp**, bấm nút **Xem bài** của từng học sinh để xem chi tiết và chấm điểm/sửa điểm trực tiếp bằng tay. | Thuật toán chấm lại hàng loạt tập trung bảo toàn tính bất biến của các bài đã chấm tay và ưu tiên các dạng trắc nghiệm/điền khuyết đơn trị. |
| 7 | Học sinh chưa xem được nhận xét chi tiết của giáo viên trên màn hình làm bài | Bấm nút **Xuất Excel (CSV)** trên trang quản lý bài giao để tải bảng điểm đầy đủ nhận xét và gửi qua kênh liên lạc lớp học. | Thiết kế đảm bảo sự riêng tư tuyệt đối, tránh tình trạng lộ lọt các nhận xét nội bộ của giáo viên trước khi công bố chính thức. |
| 8 | Ứng dụng chưa hỗ trợ mở trang mới hoàn toàn khi đang mất kết nối Internet | Giữ nguyên tab trình duyệt đang soạn bài khi mất mạng; hệ thống tự lưu nháp trên bộ nhớ máy tính và tự đồng bộ khi có mạng trở lại. | ExamCraft chạy trên máy chủ nội bộ hoặc máy cá nhân, chưa đóng gói thành ứng dụng di động ngoại tuyến (PWA Offline Service Worker). |
| 9 | Chưa có trình biên tập tương tác cho mô hình hình học động (như Geogebra) | Chèn hình vẽ dưới dạng tệp ảnh tĩnh (.png, .jpg) hoặc chèn mã TikZ vào công thức Toán học. | Hệ thống tập trung tối ưu hiển thị công thức chuẩn KaTeX và xuất tệp Word sang đối tượng toán học OMML sắc nét. |
| 10 | Chưa hỗ trợ biểu thức tương đương toán học mở rộng (CAS Solver) | Điền đầy đủ các dạng đáp số tương đương vào danh sách đáp án chấp nhận (mỗi dòng một đáp án) tại mục cấu hình câu hỏi trả lời ngắn. | Ứng dụng không tích hợp hệ thống đại số máy tính nặng nề (CAS) nhằm đảm bảo tốc độ phản hồi siêu nhanh khi chấm bài tự động. |

---
*Tài liệu rà soát giới hạn thiết kế — Lưu hành nội bộ ExamCraft.*
