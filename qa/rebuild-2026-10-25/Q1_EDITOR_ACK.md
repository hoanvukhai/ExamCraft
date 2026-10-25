# CDX-Q1 — form câu đóng khi nhận ACK đầu tiên

Generation14, base fcdf78a. Chưa bàn giao hoàn tất.

## Nguyên nhân đã tái hiện
Giữ phản hồi POST /api/exams đầu tiên, nhập nội dung câu, rồi trả phản hồi thật từ DB thử. URL chuyển sang ID server, QuestionCard đang dùng key owner:exam.id:question.id bị remount, form biến mất. Ca F2 kiểm trực tiếp inputValue sau ACK thất bại (q1-reproduction.log); không phải chỉ là locator Điểm câu chậm. Nháp câu trước đó vẫn nằm ở ID draft.

## Thay đổi
useExamPersistence cấp key cho phiên mở đề, giữ qua ACK đầu tiên và đổi khi thực sự tải tài liệu/tài khoản khác. QuestionCard dùng key phiên này. Trước khi đổi ID, sao chép journal câu hiện có vào phạm vi ID đã lưu, giữ nguyên bản nguồn; không ghi đè target mới hơn, không đọc nháp tài khoản khác. QuestionEditor ghi lần nhập tiếp theo theo documentId hiện hành. Không thêm bảng hoặc loại journal mới, không đổi CAS hoặc quyền.

## Kiểm
- Unit question_draft: 11/11, gồm ca mới "first create ACK copies question journals within owner and keeps sources and newer targets" (q1-unit.log).
- Build và chuỗi F2: đang thực hiện; chưa báo đạt5lần.
- Chỉ DB thử examcraft_test_20261022/health isolatedTest, dữ liệu giả, không provider. Ảnh/log cũ của Claude giữ nguyên trong Git/working tree, không gom hoặc xóa.

Giới hạn: bản nguồn dưới ID draft được giữ để đối chiếu, có thể thấy bản nháp cũ trong danh sách tất cả; không tự xóa để tránh mất dữ liệu.

## Kết quả bàn giao Q1
Build đạt (q1-build.log). F2 kiểm ACK đến giữa form đạt5lần liên tiếp, không chạy lại bỏ lỗi; từng lượt ở q1-f2-1.log đến q1-f2-5.log và q1-evidence.json. Bao gồm 7dạng/ảnh/ngữ liệu/điểm0/ngân hàng/lưu/mở lại, fixture tự dọn. Không thay quyền/CAS. Chờ Claude duyệt, không tự đóng CV.
