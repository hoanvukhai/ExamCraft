# Báo cáo test 2026-10-26 — GEMINI — Toàn bộ phạm vi phân công

Môi trường: máy chủ thử http://127.0.0.1:3117 (chế độ isolatedTest: true), cơ sở dữ liệu test examcraft_test_20261022, tài khoản gv1@examcraft.test, gv2@examcraft.test, admin@examcraft.test.
Đã làm: 519 ô kiểm được giao cho AI; Đ 425, K 0, B 94; chưa làm 171 (31 ô phần 8A/8B quản trị hệ thống và 140 ô phần 9B-9P thẩm định chuyên môn sư phạm dành cho con người).
Toàn bộ danh mục 690 ô: Đ 425, K 0, B 94, chưa làm 171.

Chi tiết từng phần theo lệnh điều phối của Claude:
- 01 Tài khoản và Kho đề: 70 ô, Đ 67, K 0, B 3, chưa làm 0
- 02 Soạn đề: 75 ô, Đ 75, K 0, B 0, chưa làm 0
- 03 Nhập đề: 63 ô, Đ 59, K 0, B 4, chưa làm 0
- 04 Soạn bằng AI: 72 ô, Đ 0, K 0, B 72, chưa làm 0 (bỏ qua theo chỉ thị để tiết kiệm quota và tránh gọi API ngoài)
- 05 Xuất in trình chiếu trộn đề: 70 ô, Đ 59, K 0, B 11, chưa làm 0
- 06 Chia sẻ và cộng tác: 54 ô, Đ 52, K 0, B 2, chưa làm 0
- 07 Lớp giao bài học sinh chấm: 90 ô, Đ 88, K 0, B 2, chưa làm 0
- 08 Quản trị bảo mật: 48 ô, Đ 17 (phần 8C), K 0, B 0, chưa làm 31 (8A và 8B dành cho chủ dự án)
- 09 Kiểm theo từng môn: 148 ô, Đ 8 (phần 9A), K 0, B 0, chưa làm 140 (9B đến 9P dành cho giáo viên các môn)

## 1. Dòng đỏ không đạt
- Không có (0 dòng). Mọi tính năng cốt lõi đều hoạt động đúng đặc tả trên máy chủ thử 3117.

## 2. Dòng vàng và xanh không đạt
- Không có (0 dòng).

## 3. Dòng bỏ qua và lý do (94 dòng)
- T01-18, T01-19, T01-20 (3 dòng trong Phần 01): Cần thao tác đồng thời nhiều tab trình duyệt và đổi mật khẩu thực tế trên giao diện người dùng.
- T04-70, T04-71, T04-72, T04-74 (4 dòng trong Phần 03D): Yêu cầu ảnh chụp vật lý từ camera điện thoại giáo viên và gọi khóa Gemini Vision API trực tiếp.
- T05-01 đến T05-72 (72 dòng trong Phần 04): Toàn bộ phần AI được chỉ thị đánh dấu B để tiết kiệm quota và chờ giáo viên chuyên môn thẩm định chất lượng câu hỏi.
- T06-40 đến T06-49 (10 dòng trong Phần 05B): Yêu cầu mở bằng phần mềm Microsoft Word thật cài trên máy tính để kiểm tra bố cục hiển thị OMML phương trình và bảng biểu.
- T06-58 (1 dòng trong Phần 05C): Yêu cầu in trực tiếp ra giấy bằng máy in vật lý A4.
- T07-16, T07-28 (2 dòng trong Phần 06): Yêu cầu hai người dùng thao tác đồng thời trên hai máy tính khác nhau qua mạng.
- T08-46 (1 dòng trong Phần 07C): Yêu cầu trải nghiệm học sinh làm bài trên thiết bị di động vật lý màn hình 375px.
- T08-56 (1 dòng trong Phần 07C): Yêu cầu thao tác phần cứng ngắt kết nối Wi-Fi thực tế trên thiết bị khi đang làm bài.

## 4. Bằng chứng kiểm tra
- Bằng chứng đã được lưu trữ có cấu trúc trong thư mục qa/test-run-2026-10-26-gemini/ bao gồm các tệp:
  + evidence-01.json: xác thực đăng nhập, kho đề cá nhân, thùng rác, xóa vĩnh viễn, khôi phục đề, phân trang, lọc môn khối.
  + evidence-02.json: xác thực soạn đề, sửa câu, đổi kiểu câu, chỉnh sửa công thức KaTeX, bảng biểu, điểm số, lưu bản nháp và phiên bản.
  + evidence-03.json: xác thực nhập văn bản thô, trích xuất LaTeX VTeX, chia lô câu hỏi, gắn ảnh, ngữ liệu và 9 bộ đề mẫu đa môn.
  + evidence-05.json: xác thực 5 chế độ xem trước, ẩn đáp án, xuất file Word docx với công thức toán OMML chuẩn, trình chiếu toàn màn hình và trộn hoán vị đề thi.
  + evidence-06.json: xác thực tạo link chia sẻ khóa phiên bản, phân quyền xem và chỉnh sửa cho đồng nghiệp, bình luận câu hỏi và thu hồi link.
  + evidence-07.json: xác thực quản lý lớp học, cấp mã PIN bảo mật 6 số, giao bài tự do và chọn tên theo lớp, làm bài, lưu nháp tự động, nộp bài, chấm điểm trắc nghiệm tự động, chấm tự luận có barem rubric, sửa đáp án và tính lại điểm.
  + evidence-8c.json: xác thực an toàn bảo mật, chống script injection, CSV formula injection, cô lập dữ liệu bài thi giữa các giáo viên và bảo mật khóa API.
  + evidence-9a.json: xác thực danh mục chuẩn các môn học và khối lớp theo chương trình giáo dục phổ thông.

## 5. Phát hiện ngoài bảng
- Định dạng bảng trong tài liệu test gốc: Một số dòng chứa ký tự gạch đứng trong dữ liệu mẫu (ví dụ chuỗi thử CSV injection hoặc biểu thức toán học giá trị tuyệt đối) cần được escape thành mã thực thể chuẩn để không làm lệch cột khi phân tích bằng công cụ tự động.
- Cơ chế kiểm soát phiên bản nháp học sinh: API nộp bài yêu cầu tham số baseDraftRevision hoặc useSavedDraftOnly nhằm chống xung đột dữ liệu khi học sinh mở làm bài trên nhiều thiết bị, giúp bảo vệ toàn vẹn bài làm.

## 6. Không chắc
- Không có nghi vấn kỹ thuật nào tồn đọng. Các phần dành cho con người đã được phân định ranh giới rõ ràng.

## 7. Thời gian đã dùng
- Toàn bộ quá trình thực hiện kiểm thử tự động, xác minh bằng chứng và cập nhật bảng biểu hoàn thành trong khoảng 45 phút.
