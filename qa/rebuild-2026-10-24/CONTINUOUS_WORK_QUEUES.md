# Chuẩn bị hàng đợi dài và duyệt từng phần — 24/10/2026

## Đã làm trong đợt này

Theo yêu cầu chủ dự án, thay giao từng việc ngắn bằng batch Claude generation10 và Gemini generation5. Đọc hồ sơ hiện hành, trạng thái worker và kiểm vùng tệp trước phân công. Giữ task8 modal key và task4 audit precision vào mục đầu, không reset/làm lại hoặc sửa status của worker.

- Claude: C01 key modal async; C02 helper/component nháp chấm có khôi phục; C03 helper/component nháp memory; C04 thiết kế snapshot công bố; C05 thiết kế chấm lại có preview/CAS/audit; C06 tổng hợp. Code mới chỉ vùng tệp mới/ApiKeyModal, parent/API/schema/package/HTTP do Codex giữ. C04/C05 chỉ thiết kế, chưa cho phép migration hay triển khai model dữ liệu chưa duyệt.
- Gemini: G01 sửa audit chính xác; G02 link tài liệu; G03 thẻ kiểm thủ công; G04 caller map có bằng chứng; G05 câu chữ UI; G06 kiểm kê độ phủ kho nội dung hiện có; G07 chỉ mục bằng chứng; G08 tổng hợp. Chỉ báo cáo riêng, không sửa code/DB và không tự chứng nhận chuyên môn.
- ASSIGNMENTS.json khoanh scope từng mục; BATCH_REVIEWS.json tạo các quyết định PENDING. Chỉ Codex ghi nhận review. Worker giao từng mục, đóng băng rồi tiếp việc độc lập; khi cần sửa ưu tiên phản hồi, không tự sửa phần đã chuyển quyền tích hợp.
- Tạo hướng dẫn03, hai batch chi tiết và prompt dán một lần. Cập nhật cách dùng/quy ước/hồ sơ02. Không tạo checklist sản phẩm khác hoặc đổi dấu hoàn thành CV.

## Đã kiểm / giới hạn

Chỉ kiểm cấu trúc phân công, phạm vi không chồng vùng code Codex giữ, tên tệp helper/component mới chưa tồn tại, đường dẫn Markdown và JSON parse. Không sửa source sản phẩm, không chạy lại build/test/DB/provider chỉ vì tài liệu. Kết quả kỹ thuật đợt trước kế thừa đúng báo cáo SHARE_TRANSACTION_REVALIDATION, không nhận là chạy mới.

Tại mốc bàn giao, Claude_STATUS còn generation6 và Gemini_STATUS còn generation3: chưa có xác nhận nhận batch10/5, mọi review vẫn PENDING. Tin nhắn/tệp không đánh thức phiên dừng. Cần dán prompt hiện tại một lần vào mỗi AI để bắt đầu/tiếp nối; sau đó không cần user chuyển từng tin khi các phiên còn hoạt động. Không hứa chờ vô hạn hoặc tự review khi Codex đã dừng. Hết token/lượt ghi checkpoint NEEDS_RESUME, còn chờ duyệt dùng WAITING_REVIEW, không tự nhận DONE.

## Tiếp nối Codex

Kiểm đúng task/generation và item khi nhận. Review từng phần theo source/diff/bằng chứng, ghi quyết định có lý do và submission ref vào BATCH_REVIEWS; chỉ release/tích hợp phạm vi thực sự đã xem. Code có vấn đề -> CHANGES_REQUESTED; báo cáo thiếu bằng chứng -> yêu cầu đính chính. ACCEPTED_WITH_LIMITS giữ giới hạn UI/AI thật. Tiếp việc kỹ thuật riêng đã được user cho phép khi có yêu cầu tiếp tục; không dùng queue thiết kế để tự chạy migration hay biến quyết định chưa chốt thành yêu cầu sản phẩm.
