# Hợp đồng khái niệm dữ liệu, ánh xạ cơ sở dữ liệu và quy tắc điểm số

Tài liệu này hoàn thành tiêu chí nghiệm thu cho nhiệm vụ CV-007 (phạm vi YC-04, YC-07, YC-09, YC-12, YC-13, YC-25, nghiệm thu NT-11, NT-12) theo kế hoạch kiểm thử và bàn giao của dự án ExamCraft.

---

## 1. Mục tiêu và cơ sở pháp lý kỹ thuật

Nhiệm vụ CV-007 yêu cầu:
1. Ánh xạ toàn bộ khung khái niệm nghiệp vụ đã được định nghĩa trong tài liệu docs/ke-hoach-2026-10-21/06_KHUNG_DU_LIEU.md sang các mô hình thực thể cơ sở dữ liệu Prisma (prisma/schema.prisma) và các giao diện lập trình ứng dụng (src/app/api/...).
2. Xác định rõ ràng các cột quản lý phiên bản (versioning columns) phục vụ cơ chế kiểm soát tương tranh lạc quan (CAS) và lưu trữ lịch sử bất biến.
3. Quy định chính xác quy tắc biểu diễn và làm tròn điểm số trên toàn hệ thống (từ nhập liệu ma trận, chấm bài tự động, chấm thủ công đến xuất báo cáo).
4. Rà soát và ghi nhận các xung đột nguồn lưu trữ còn lại (nếu có) trước khi thực hiện migration.

---

## 2. Bảng ánh xạ từ Khung khái niệm sang Prisma Models và API Endpoints

Căn cứ vào tài liệu gốc docs/ke-hoach-2026-10-21/06_KHUNG_DU_LIEU.md, các khái niệm nghiệp vụ được hiện thực hóa qua hệ thống tệp mã nguồn như sau:

| Khái niệm nghiệp vụ (tại 06_KHUNG_DU_LIEU.md) | Thực thể Prisma tương ứng (prisma/schema.prisma) | Giao diện API chính (src/app/api/...) | Vai trò và tính toàn vẹn dữ liệu |
|---|---|---|---|
| Người dùng & Phiên xác thực | User, Session | /api/auth/login, /api/auth/session, /api/auth/logout | Định danh giáo viên, quản lý phiên qua HTTP cookie an toàn (HttpOnly, SameSite). |
| Ngữ liệu dùng chung (Passages) | Passage | /api/passages | Lưu đoạn trích văn học, bài đọc ngoại ngữ dùng chung cho nhiều câu hỏi; ngăn lặp lại khi xuất in. |
| Câu hỏi & Lịch sử câu hỏi | Question, QuestionRevision | /api/questions, /api/questions/[id], /api/questions/[id]/revisions | Quản lý ngân hàng câu hỏi độc lập; mỗi lần sửa tạo revision mới gắn với tác giả và phiên bản. |
| Mẫu đề & Khung bố cục (Template) | ExamTemplate | /api/templates | Lưu mẫu tiêu đề trường, cấu trúc phần thi, ma trận gợi ý; độc lập với nội dung câu hỏi cụ thể. |
| Đề thi & Danh mục câu trong đề | Exam, ExamQuestion, Folder | /api/exams, /api/exams/[id], /api/exams/[id]/export | Quản lý đề thi của giáo viên, thư mục lưu trữ, thứ tự và điểm số riêng cho từng câu trong đề. |
| Lịch sử phiên bản đề thi | ExamRevision | /api/exams/[id]/history | Lưu snapshot toàn bộ đề thi tại từng thời điểm lưu; bất biến (append-only), hỗ trợ khôi phục. |
| Thành viên cộng tác & Bình luận | ExamCollaborator, ExamComment | /api/exams/[id]/collaborators, /api/exams/[id]/comments | Phân quyền 4 vai trò (Chủ đề, Chỉ xem, Xem và góp ý, Cùng sửa); bình luận gắn theo câu hỏi. |
| Liên kết chia sẻ công khai | ShareLink | /api/public/share/[token], /api/public/share/[token]/copy | Chia sẻ đề qua mã định danh phiên bản; cho phép giáo viên khác sao chép không kèm đáp án ẩn. |
| Lớp học, Học sinh & Mã PIN | Group, Student | /api/groups, /api/students | Danh sách lớp học nội bộ, quản lý định danh học sinh và mã bảo mật (PIN) khi vào thi. |
| Bài giao & Đợt thi | Assignment | /api/assignments, /api/teacher/assignments/[id] | Đóng băng snapshot đề thi lúc giao bài; cấu hình thời gian mở/đóng, mật khẩu, số lượt làm bài. |
| Lượt làm bài của học sinh | Attempt | /api/public/attempts/[attemptId], /api/public/attempts/[attemptId]/submit | Ghi nhận phiên làm bài, thời gian bắt đầu, thời gian nộp, tổng điểm và trạng thái hoàn thành. |
| Câu trả lời & Điểm thành phần | AttemptAnswer | /api/teacher/assignments/[id]/grade | Lưu câu trả lời của học sinh cho từng câu hỏi, kết quả tự động chấm và điểm chấm tay của giáo viên. |
| Đính chính đáp án & Chấm lại | AuditLog | /api/teacher/assignments/[id]/regrade | Ghi nhận sự kiện sửa đáp án sau khi giao bài; hỗ trợ xem trước và áp dụng cập nhật điểm số. |
| Bộ nhớ tri thức giáo viên | TeacherAiMemory | /api/teacher/memory | Lưu phong cách ra đề, ghi chú sư phạm cá nhân; độc lập hoàn toàn giữa các tài khoản giáo viên. |
| Khóa kết nối & Hạn ngạch AI | AiKeyState, AiUsageLog, UserApiKey | /api/settings/keys, /api/ai/usage | Lưu khóa API mã hóa cục bộ; ghi nhận nhật ký sử dụng, chặn vượt hạn mức; không lộ bí mật. |

---

## 3. Xác định các cột quản lý phiên bản (Versioning Columns)

Nhằm bảo đảm tính toàn vẹn dữ liệu khi có nhiều người cùng chỉnh sửa hoặc khi học sinh nộp bài đồng thời, hệ thống sử dụng các cột phiên bản số nguyên (Integer) cụ thể:

1. Thực thể Question:
   - Cột Question.version: kiểu Int, mặc định là 1. Tăng tuyến tính sau mỗi thao tác cập nhật thành công.
   - Bảng QuestionRevision: trường version kiểu Int, kết hợp với questionId tạo ràng buộc duy nhất: @@unique([questionId, version]).

2. Thực thể Exam:
   - Cột Exam.version: kiểu Int, mặc định là 1. Đóng vai trò trường so sánh CAS (Compare-And-Swap) khi giáo viên gửi yêu cầu lưu đề từ giao diện.
   - Bảng ExamRevision: trường version kiểu Int, kết hợp với examId tạo ràng buộc duy nhất: @@unique([examId, version]). Mỗi lần lưu thành công sẽ tạo một bản ghi ExamRevision với số phiên bản tương ứng.

3. Thực thể ShareLink:
   - Khóa phiên bản trên token: Thay vì dùng trường số nguyên rời rạc trong cơ sở dữ liệu, token chia sẻ công khai được gắn trực tiếp hậu tố phiên bản dạng .v<N> (ví dụ: share-token-abc.v3). Cơ chế này khóa cố định liên kết tại đúng bản lịch sử phiên bản thứ 3 mà không làm xáo trộn dữ liệu khi đề gốc tiếp tục được sửa lên phiên bản 4.

4. Thực thể Attempt (Lượt làm bài):
   - Xử lý tương tranh nộp bài: Dựa trên mã định danh attemptId và trạng thái nộp bài (submittedAt) kết hợp cơ chế thử lại giao dịch tự động trong src/lib/transaction-retry.ts. Khi có hai yêu cầu nộp bài cùng lúc, giao dịch tuần tự hóa bảo đảm chỉ một kết quả được ghi nhận và ngăn chặn hoàn toàn việc nhân đôi câu trả lời.

---

## 4. Quy tắc biểu diễn và làm tròn điểm số (Score Precision & Rounding Rules)

Để tránh hiện tượng sai lệch điểm số do sai số dấu phẩy động (floating-point error) và bảo đảm tính công bằng sư phạm theo quy định của Bộ Giáo dục và Đào tạo:

1. Kiểu dữ liệu trong Cơ sở dữ liệu PostgreSQL:
   - Question.points: kiểu Decimal(5, 2) - độ chính xác 2 chữ số thập phân sau dấu phẩy (tối đa 999.99 điểm).
   - ExamQuestion.pointsOverride: kiểu Decimal(5, 2) - cho phép tùy biến điểm câu trong đề cụ thể với độ chính xác 0.01.
   - Attempt.score: kiểu Decimal(6, 2) - tổng điểm bài thi của học sinh, chính xác tới hàng phần trăm (tối đa 9999.99 điểm).
   - Attempt.maxScore: kiểu Decimal(6, 2) - điểm tối đa của đề thi.
   - AttemptAnswer.manualScore: kiểu Decimal(5, 2) - điểm chấm tự luận của giáo viên.

2. Quy tắc làm tròn tại tầng ứng dụng (TypeScript / Runtime):
   - Công thức chuẩn hóa: Mọi điểm số thành phần và tổng điểm đều áp dụng phép làm tròn tiêu chuẩn đến 2 chữ số thập phân: Math.round(score * 100) / 100.
   - Không tự ý cắt bỏ (never rounded away): Như được quy định trong src/lib/exam-plan.ts, dữ liệu đầu vào điểm số được giữ chính xác đến hàng phần trăm (0.01); nếu có độ chính xác chi tiết hơn sẽ được ghi nhận chứ không tự ý làm tròn mất điểm của học sinh.
   - Chế độ đánh giá phi số học (Non-numeric Assessment Modes):
     - Theo src/lib/education-catalog.ts, hệ thống hỗ trợ 4 chế độ: scored (tính điểm số), comment_only (chỉ nhận xét), rubric (theo tiêu chí), survey (khảo sát).
     - Với môn học hoặc bài kiểm tra thuộc chế độ comment_only, hàm requiresNumericScore trả về false; điểm tổng được cố định là 0 (score: 0, maxScore: 0) và hệ thống không cố ép lưu các giá trị điểm số vô nghĩa vào bảng điểm.

---

## 5. Rà soát xung đột nguồn lưu trữ (Storage Conflicts Review)

Trước khi tiến hành các đợt migration hoặc mở rộng hệ thống, kết quả rà soát hiện trạng kỹ thuật như sau:

1. Xung đột giữa LocalStorage và Máy chủ:
   - Đã xử lý triệt để: Bản nháp trình duyệt được định danh theo cặp [userId, examId]. Khi mất mạng, bản nháp giữ ở máy khách. Khi có mạng, CAS version ngăn chặn ghi đè nếu phiên khác đã cập nhật đề trên máy chủ.
2. Xung đột phiên bản khi chia sẻ:
   - Đã xử lý triệt để: Cơ chế token hậu tố phiên bản (.v<N>) giải quyết hoàn toàn việc liên kết chia sẻ bị thay đổi khi giáo viên tiếp tục chỉnh sửa đề, không đòi hỏi sửa đổi cấu trúc bảng ShareLink trong cơ sở dữ liệu chính.
3. Đồng bộ kiểu dữ liệu điểm số:
   - Đã xử lý triệt để: Trường Decimal trong Prisma khớp hoàn toàn với số thực làm tròn 2 chữ số thập phân của TypeScript runtime, không có hiện tượng chuyển đổi kiểu gây mất dữ liệu hay lỗi NaN/null.
4. Tình trạng Migration hiện tại:
   - Mọi migration cộng thêm (ví dụ exam_collaboration) đã được kiểm chứng an toàn trên cơ sở dữ liệu kiểm thử cục bộ (DB test).
   - Chưa áp dụng migration lên cơ sở dữ liệu chính khi chưa có quyết định phê duyệt chính thức từ chủ dự án, bảo đảm làm đúng nguyên tắc an toàn dữ liệu và bảo toàn working tree.
