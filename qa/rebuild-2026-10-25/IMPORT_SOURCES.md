# CDX-R6 — nguồn nhập và quyền kho riêng

## Đọc mã
- parse-exam-text và parse-docx gọi parseImportedDocument với nguồn chung Văn bản nhập / Word (.docx); adapter gắn nhãn source, trạng thái draft/verifiedBy none và ID riêng. Chưa giữ tên tệp/trang/câu thành trường cấu trúc. Nguồn có sẵn từng câu còn bị source chung của adapter ghi đè; đây là giới hạn cần quyết định, không tự sửa tính năng lớn.
- Nhánh text cơ bản parseRawVietnameseDocument và EX_Test giữ tagsImport, nhưng không tự đặt source theo tên tệp hoặc URL. Question.source/licenseNote đã có và normalizeQuestion/questionToDatabase giữ khi giáo viên cung cấp.
- Không có bước dedup theo độ gần của nội dung trong parser text/EX_Test/adapterWord: biến thể khác số đều giữ. Cùng nội dung nhập lại có thể thành câu mới; chống nhập lặp của legacy theoID/fingerprint không đồng nghĩa chống lặp cho mọi lần dán Word/text.
- questionToDatabase luôn ghi visibility PRIVATE; saveBankQuestion không truyền visibility/shareable từ dữ liệu tài liệu, endpoint POST mặc địnhPRIVATE. Không tự đưa vào /questions/shared. Riêng shareable ởschema/POST mặc địnhtrue (IMPORTED_WEB mới bị épfalse); nguồn Word/text chưa có trạng thái quyền đã xác minh hoặc mặc định chặn nhân bản. PRIVATE không đồng nghĩa đã xác minh giấy phép.

## Kiểm mới đã chạy
Testfile tests/import_sources.test.ts dùng dữ liệu giả trongRAM và fetchgiả, không DB hoặc provider: text/EX_Test giữ biến thể khác số, adapterWord/text gắnsourcechung, nguồn/ghi chú quyền giữ qua normalization/privatepersistence, bankrequest không nhận lệnh chia sẻ từ nội dung nguồn. Kết quả: nhóm nguồn nhập và parser đạt 17/17; CI quick đạt TypeScript, lint và 431/431 SAFE. Xem r6-import-sources.log và r6-ci-quick.log. Kiểm thử không ghi DB hoặc gọi provider thật. Build/HTTP/browser của R1–R2 chạy trước sửa helper số; chưa chạy lại runtime sau sửa nhỏ này.

## Kết luận phạm vi
Chưa đủ đóng CV041 vì thiếu nguồn chi tiết theo tệp/trang/câu và chính sách quyền nguồn chưa rõ. R6 là báo phát hiện và bằng chứng, không tự đổi schema/luồngchia sẻ hoặc sửa bộ parser lớn. Sẽ gửiClaude duyệt.

## Phát hiện thêm và sửa nhỏ có kiểm
Lượt mới làm lộ Đáp án:13 của câu ngắn bị giữ trong nội dung, nên có thể lộ khóa ngay trên đề. Đã giới hạn sửa tại takeAnswerTail: chỉ tách dòng khóa số tườngminh (số0, số có dấu, thập phân/fraction), giữ văn bản nhiều dòng hoặc không nhận diện để rà, không suy đáp án. Không đổi mô hình nguồn/quyền/parserlớn. Ca trước lỗi trong r6-import-sources-before.log; bản sửa cùng11caseparser cũ đạt17/17 (r6-import-sources.log), gồm6testnguồn/variant mới. Các thiếu hụt nguồn/trang/câu vàshareable vẫn mở, không tuyên bốCV041đủ.
