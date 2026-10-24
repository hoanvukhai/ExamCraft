# Rà soát hồi quy: quyền, lưu dữ liệu, khóa AI và chấm tay

Cập nhật 22/10/2026. Đợt này tiếp nối ACCESS/BYOK/COLLABORATION, tập trung lỗi có thể làm sai quyền hoặc mất nội dung. Không chạy AI thật, không sửa DB chính.

## Những lỗi đã sửa

### Ngân hàng câu hỏi và ngữ liệu

- Fork câu dùng chung trước đây bỏ passage, giữ logical ID gốc và trả email tác giả. Nay đọc và kiểm nguồn trong transaction; chỉ nhân bản câu được phép, ngữ liệu phải cùng chủ sở hữu nguồn; tạo ngữ liệu riêng trong kho người nhận, ID câu/ID ngữ liệu mới, giữ nguồn/ghi chú giấy phép và tác giả gốc. Bản mới riêng tư, không được coi đã duyệt.
- Rollback câu trước đây không yêu cầu bản hiện tại, ghi theo ID sau khi kiểm chủ ở ngoài transaction và bỏ qua passage. Nay yêu cầu baseVersion, row lock + CAS + owner + undeleted, kiểm passage riêng, giữ điểm 0, xóa hình thật khi snapshot null, ghi revision mới. Không khôi phục quyền công khai/trạng thái duyệt của bản cũ.
- PATCH câu cũng yêu cầu baseVersion; DELETE giữ tương thích client cũ không cần body nhưng thực hiện lock/CAS nội bộ và tăng version/ghi lịch sử. Không sửa/xóa/rollback câu có __workspace_only qua API ngân hàng: phải lưu hoặc khôi phục toàn đề để không làm cache document lệch dữ liệu câu.
- Tạo câu ngân hàng có ID editorData mới khớp DB, kiểm điểm không âm, bỏ marker nội bộ; không sao chép quyền sở hữu từ client. Câu dùng chung không trả email tác giả và không liệt kê câu workspace-only.
- Contract ngữ liệu: POST /api/questions nhận passage chứa content/title/source/figures để tạo bản riêng, hoặc passageId đã có thuộc chính giáo viên. Không tra nội dung ngữ liệu của tài khoản khác qua ID. Danh sách ngân hàng trả passage bằng dữ liệu cho phép; ngữ liệu ngoài quyền bị ẩn và báo passageUnavailable.
- question-client có BankQuestion/BankPassage; saveBankQuestion(question,passage?) và dbSaveQuestionToBank(question,passage?) nhận thêm ngữ liệu. QuestionBankModal onInsertQuestion(question,passage?) gửi ngữ liệu để editor ghép vào exam.passages, chặn chèn câu đã tham chiếu ngữ liệu nhưng chưa lấy được nội dung. Root nối editor/QuestionCard qua hai tham số này.

### Chấm tay bài đã giao

- Trước đây nhận questionKey tùy ý, điểm âm/vượt mức, chấm cả lượt chưa nộp, không cập nhật needsGrading và tổng điểm có thể bị đè khi chấm đồng thời.
- Nay chỉ chủ bài giao, lượt SUBMITTED, questionKey thuộc snapshot; điểm hữu hạn từ 0 đến mức tối đa đã cấu hình, tối đa hai chữ số thập phân. So sánh số thập phân có epsilon để 0,29 không bị từ chối do biểu diễn số thực. Không dùng thang 0,25/10 mặc định cho dữ liệu thiếu.
- Transaction khóa hàng Attempt trước khi lưu câu và tính lại tổng/pending. Chấm 0 vẫn được tính đã xem; điểm một phần không tự gắn đúng toàn câu. Điểm âm/ngoài mức từ dữ liệu cũ không được coi đã giải quyết pending.
- Survey/nhận xét không tạo tổng điểm số; nhận xét cần nội dung. Bài survey không có pending chấm điểm; bài nhận xét cần đánh dấu đã góp ý từng câu.
- GET teacher attempt detail chuyển cả snapshot phẳng và payload cũ sang payload thống nhất để hiện đúng choices/correct/sub_questions/accepted_answers/rubric/matching/order và lời giải; trả passageId/passages và assessmentMode. Đây là adapter chỉ dành giáo viên đã xác thực, không dùng cho API học sinh.

### AI, kho ghi chú và client

- Kiểm tra cùng nguồn cho các thao tác AI còn thiếu và nhập/sửa/xóa ghi chú; chặn gọi từ origin khác sử dụng cookie giáo viên để tiêu lượt hoặc ghi dữ liệu.
- Thống nhất alias khóa tạm customApiKey/userApiKey/apiKey ở generate/verify/parseText/copilot/assistant/analyze; mâu thuẫn hoặc kiểu dữ liệu sai trả 400, không âm thầm chọn khóa và không in khóa ra lỗi.
- Memory analyze từ examId chỉ lấy đề chưa xóa thuộc giáo viên, kiểm các câu liên kết thuộc cùng chủ trước khi gửi dịch vụ AI.
- Review hook phát hiện bản nháp cache không nhận quyền mới từ server và response cũ từ route trước có thể đánh dấu lỗi lên đề mới. Đã bàn giao root sửa quyền khi nạp draft và kiểm generation/ID trong polling. Không sửa file controller đang do root giữ.

## Kiểm chứng

- Suite question_history: 7/7 đạt (service fake thực thi fork/rollback thật, ngữ liệu, quyền nguồn, CAS, snapshot, chặn workspace-only, client contract truyền passage và loại owner khỏi portable passage).
- Suite manual_grading: 6/6 đạt (0,29/0/precision, cấu hình thiếu, survey/nhận xét, pending/tổng chỉ câu snapshot, TF bỏ trống và canonical teacher answer).
- Trước mở rộng hai suite này: tổ hợp AI policy + persistence + bank + manual 32/32 đạt. Sau mở rộng chạy bank+manual 13/13 đạt. Không cộng hai số này thành số ca độc lập.
- Typecheck trước các thay đổi adapter/passages cuối đã đạt; kết quả lượt cuối ghi bổ sung khi hoàn thành.
- Root báo HTTP thực tế 6/6 và DB test 7/7 cho luồng cộng tác/lịch sử/public/attempt/manual/memory; tester tiếp tục đối chiếu phần bank mới. Báo cáo tổng QA là nguồn kết quả nghiệm thu cuối, không coi fake test là kiểm chứng khóa PostgreSQL.

## Giới hạn còn phải thể hiện rõ

Không có mô phỏng AI thật và không có kiểm tra khả năng sinh nội dung/billing bằng khóa thật. Cộng tác là lưu theo phiên bản có xung đột, chưa phải cùng gõ từng ký tự. Những mẫu môn/lớp và nguồn giáo dục vẫn ở trạng thái cần duyệt theo EDUCATION.md; sửa quyền/lưu không làm các gói tài liệu tự được công nhận.
