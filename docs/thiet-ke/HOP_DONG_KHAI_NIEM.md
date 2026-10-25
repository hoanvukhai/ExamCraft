# Hợp đồng khái niệm dữ liệu, ánh xạ cơ sở dữ liệu và quy tắc điểm số

Tài liệu này hoàn thành tiêu chí nghiệm thu cho nhiệm vụ CV-007 (phạm vi YC-04, YC-07, YC-09, YC-12, YC-13, YC-25, nghiệm thu NT-11, NT-12) theo kế hoạch kiểm thử và bàn giao của dự án ExamCraft.

---

## 1. Mục tiêu và cơ sở pháp lý kỹ thuật

Nhiệm vụ CV-007 yêu cầu:
1. Ánh xạ toàn bộ khung khái niệm nghiệp vụ đã được định nghĩa trong tài liệu duy nhất bắt đầu bằng `06_` tại thư mục kế hoạch: docs/ke-hoach-2026-10-21/06_KHUNG_DU_LIEU.md sang các mô hình thực thể cơ sở dữ liệu Prisma (prisma/schema.prisma) và các giao diện tệp route API thật trong hệ thống (src/app/api/**/route.ts).
2. Xác định rõ ràng các cột quản lý phiên bản phục vụ cơ chế kiểm soát tương tranh lạc quan (CAS) và lưu trữ lịch sử bất biến.
3. Quy định chính xác quy tắc biểu diễn và làm tròn điểm số trên toàn hệ thống (bao gồm ví dụ xuyên suốt một đề có điểm lẻ 0,25 đi từ kế hoạch, câu hỏi, lượt làm bài đến xuất báo cáo CSV kèm dẫn chứng hàm làm tròn thực tế trong mã nguồn).
4. Phản ánh đúng trạng thái cơ sở dữ liệu: migration chính đã được kiểm tra và áp dụng lên cơ sở dữ liệu chính (CV-002), không tồn tại xung đột cấu trúc bảng chưa giải quyết.

---

## 2. Ánh xạ Khung khái niệm (06_KHUNG_DU_LIEU.md) sang Model Prisma

Căn cứ vào Mục 1 (Mô hình dữ liệu chung) của tài liệu docs/ke-hoach-2026-10-21/06_KHUNG_DU_LIEU.md, các khái niệm nghiệp vụ được hiện thực hóa vào prisma/schema.prisma như sau:

| Khái niệm nghiệp vụ (tại 06_KHUNG_DU_LIEU.md) | Model Prisma tương ứng (prisma/schema.prisma) | Vai trò và tính toàn vẹn dữ liệu |
|---|---|---|
| Người dùng (User) | User, Session | Quản lý thông tin tài khoản giáo viên, mật khẩu băm và phiên làm việc cookie HttpOnly. |
| Ngân hàng câu & Phiên bản câu | Question, QuestionRevision | Lưu trữ câu hỏi độc lập với version tự tăng; mỗi lần sửa tạo QuestionRevision bất biến với ràng buộc @@unique([questionId, version]). |
| Mẫu đề & Khung bố cục (Template) | ExamTemplate | Lưu trữ cấu trúc ma trận, tiêu đề trường và phân bổ câu hỏi mẫu; tách rời nội dung câu hỏi. |
| Đề thi & Danh mục câu trong đề | Exam, ExamQuestion, Folder | Quản lý đề thi của giáo viên, cây thư mục, thứ tự và điểm số cấu hình riêng (pointsOverride). |
| Lịch sử phiên bản đề thi | ExamRevision | Lưu snapshot toàn bộ đề thi tại từng thời điểm lưu; bất biến (append-only), ràng buộc @@unique([examId, version]). |
| Thành viên cộng tác & Góp ý | ExamCollaborator, ExamComment | Phân quyền 4 vai trò (Chủ đề, Chỉ xem, Xem và góp ý, Cùng sửa); bình luận gắn theo questionId. |
| Liên kết chia sẻ công khai | ShareLink | Chia sẻ đề thi qua token phiên bản; cho phép giáo viên khác sao chép không kèm đáp án ẩn. |
| Ngữ liệu dùng chung (Passages) | Passage | Đoạn trích văn học, bài đọc tiếng Anh; liên kết với Question qua passageId để không bị in lặp. |
| Lớp học, Học sinh & Mã PIN | Group, Student | Danh sách nhóm lớp nội bộ, định danh học sinh và mã PIN kiểm soát lúc vào phòng thi. |
| Bài giao & Đợt thi | Assignment | Đóng băng snapshot đề thi lúc giao bài; cấu hình thời gian mở/đóng, mật khẩu, số lượt làm bài. |
| Lượt làm bài của học sinh | Attempt | Ghi nhận phiên làm bài, thời gian nộp, tổng điểm (score) và điểm tối đa (maxScore). |
| Câu trả lời & Điểm thành phần | AttemptAnswer | Lưu câu trả lời của học sinh cho từng câu, điểm tự động chấm (earned) và điểm chấm tay (manualScore). |
| Đính chính đáp án & Chấm lại | AuditLog | Ghi nhận nhật ký sửa đáp án sau khi giao bài; hỗ trợ xem trước và áp dụng cập nhật điểm số. |
| Bộ nhớ tri thức giáo viên | TeacherAiMemory | Lưu phong cách ra đề cá nhân của giáo viên; cô lập hoàn toàn giữa các tài khoản. |
| Khóa kết nối & Hạn ngạch AI | UserApiKey, AiKeyState, AiUsageLog | Lưu khóa API mã hóa cục bộ; ghi nhận nhật ký sử dụng, chặn vượt hạn mức. |

---

## 3. Danh mục các tệp Route API thực tế trong hệ thống

Dưới đây là danh sách đường dẫn tệp route thật (src/app/api/**/route.ts) được kiểm tra trực tiếp trong mã nguồn, phân nhóm theo cụm chức năng nghiệp vụ:

### 3.1. Xác thực và tài khoản
- src/app/api/auth/login/route.ts: Đăng nhập hệ thống, cấp cookie phiên.
- src/app/api/auth/logout/route.ts: Đăng xuất và hủy phiên làm việc.
- src/app/api/auth/me/route.ts: Lấy thông tin tài khoản đang đăng nhập.
- src/app/api/auth/change-password/route.ts: Đổi mật khẩu tài khoản.

### 3.2. Quản lý đề thi và cộng tác
- src/app/api/exams/route.ts: Danh sách đề thi và tạo đề mới.
- src/app/api/exams/[id]/route.ts: Đọc, cập nhật nội dung đề thi (kiểm soát CAS version).
- src/app/api/exams/[id]/history/route.ts: Đọc danh sách lịch sử phiên bản và khôi phục snapshot.
- src/app/api/exams/[id]/collaborators/route.ts: Quản lý thành viên cộng tác (mời, đổi vai trò, thu hồi).
- src/app/api/exams/[id]/comments/route.ts: Đọc và gửi bình luận góp ý theo câu hỏi.
- src/app/api/exams/[id]/share/route.ts: Tạo và quản lý liên kết chia sẻ công khai có khóa phiên bản.

### 3.3. Thư mục và mẫu đề (Templates)
- src/app/api/folders/route.ts: Danh sách thư mục và tạo thư mục đề thi.
- src/app/api/folders/[id]/route.ts: Đổi tên hoặc xóa thư mục.
- src/app/api/templates/route.ts: Danh sách mẫu đề và lưu mẫu cá nhân.
- src/app/api/templates/[id]/route.ts: Đọc chi tiết, sửa hoặc xóa mẫu đề.

### 3.4. Ngân hàng câu hỏi
- src/app/api/questions/route.ts: Danh sách câu hỏi cá nhân và tạo câu mới.
- src/app/api/questions/shared/route.ts: Danh sách câu hỏi được chia sẻ trong trường.
- src/app/api/questions/[id]/route.ts: Đọc chi tiết và cập nhật câu hỏi (tăng version).
- src/app/api/questions/[id]/fork/route.ts: Sao chép câu hỏi về kho cá nhân.
- src/app/api/questions/[id]/revisions/route.ts: Đọc lịch sử sửa đổi của câu hỏi.

### 3.5. Nhóm lớp và học sinh
- src/app/api/groups/route.ts: Danh sách lớp học và tạo lớp mới.
- src/app/api/groups/[id]/route.ts: Cập nhật thông tin lớp, danh sách học sinh và mã PIN.

### 3.6. Giao bài và quản lý kết quả (Giáo viên)
- src/app/api/assignments/route.ts: Tạo đợt giao bài mới (đóng băng snapshot đề thi).
- src/app/api/teacher/assignments/[id]/route.ts: Xem tiến độ làm bài, bảng điểm và thống kê bài giao.
- src/app/api/teacher/assignments/[id]/export-csv/route.ts: Xuất bảng điểm lớp ra tệp CSV có xử lý chống tràn/tiêm lệnh.
- src/app/api/teacher/assignments/[id]/regrade/route.ts: Xem trước và áp dụng chấm lại bài khi sửa đáp án.
- src/app/api/teacher/attempts/[id]/route.ts: Đọc chi tiết bài làm của một học sinh và chấm điểm thủ công (manual grade).

### 3.7. Cổng thông tin công khai và học sinh làm bài
- src/app/api/public/assignments/[publicId]/route.ts: Đọc thông tin bài thi công khai (ẩn đáp án và lời giải).
- src/app/api/public/assignments/[publicId]/start/route.ts: Học sinh nhập họ tên/PIN để bắt đầu làm bài thi.
- src/app/api/public/attempts/[id]/draft/route.ts: Đồng bộ bản nháp câu trả lời định kỳ khi học sinh đang làm bài.
- src/app/api/public/attempts/[id]/submit/route.ts: Nộp bài thi chính thức, tính điểm tự động và khóa bài.
- src/app/api/public/groups/[groupCode]/route.ts: Tra cứu lớp học bằng mã nhóm công khai.
- src/app/api/public/share/[id]/route.ts: Xem đề thi được chia sẻ công khai theo phiên bản token.
- src/app/api/public/share/[id]/copy/route.ts: Giáo viên đăng nhập sao chép đề chia sẻ về kho cá nhân.

### 3.8. Cấu hình khóa AI, hạn ngạch và bộ nhớ
- src/app/api/user/keys/route.ts: Quản lý khóa API nhà cung cấp (mã hóa DPAPI/AES cục bộ).
- src/app/api/user/keys/test/route.ts: Kiểm tra tính hợp lệ của khóa API mà không lộ bí mật.
- src/app/api/user/ai-usage/route.ts: Kiểm tra lượng token và hạn mức sử dụng AI trong ngày.
- src/app/api/teacher/ai-memory/route.ts: Quản lý bộ nhớ phong cách ra đề của giáo viên.
- src/app/api/teacher/ai-memory/analyze/route.ts: Phân tích tài liệu để trích xuất quy tắc sư phạm.
- src/app/api/teacher/ai-memory/archive/route.ts: Lưu trữ hoặc vô hiệu hóa mục ghi nhớ cũ.
- src/app/api/teacher/assistant/route.ts: Trợ lý trò chuyện sư phạm nội bộ.
- src/app/api/exam-copilot/route.ts: Trợ lý biên tập câu hỏi theo ngữ cảnh đề thi.

### 3.9. Soạn đề, chỉnh sửa và nhập khẩu dữ liệu
- src/app/api/generate-exam/route.ts: Tạo khung đề thi theo ma trận yêu cầu.
- src/app/api/tweak-question/route.ts: Tinh chỉnh câu hỏi (đổi số liệu, viết lại phương án).
- src/app/api/verify-question/route.ts: Kiểm tra tính đúng đắn khoa học của câu hỏi.
- src/app/api/knowledge-scope/propose/route.ts: Trợ lý đề xuất phạm vi kiến thức chuẩn GDPT 2018.
- src/app/api/ocr-exam-image/route.ts: Nhận diện đề thi từ tệp hình ảnh.
- src/app/api/parse-docx/route.ts: Trích xuất câu hỏi và công thức toán từ tệp Word .docx.
- src/app/api/parse-exam-text/route.ts: Phân tích đề thi từ văn bản thô dạng plain text.
- src/app/api/migration/import-legacy/route.ts: Nhập khẩu dữ liệu đề thi từ các phiên bản cũ.

### 3.10. Quản trị hệ thống và kiểm tra vận hành
- src/app/api/admin/users/route.ts: Quản trị danh sách người dùng hệ thống.
- src/app/api/admin/users/[id]/route.ts: Khóa/mở tài khoản và phân quyền quản trị viên.
- src/app/api/admin/ai/route.ts: Quản trị hạn mức tiêu thụ AI toàn trường.
- src/app/api/health/route.ts: Kiểm tra trạng thái máy chủ và kết nối cơ sở dữ liệu.

---

## 4. Xác định các cột quản lý phiên bản (Versioning Columns)

Hệ thống sử dụng các trường số nguyên (Integer) và hậu tố phiên bản để bảo đảm tính nhất quán dữ liệu:

1. Thực thể Question:
   - Cột Question.version: kiểu Int, mặc định 1. Tăng sau mỗi lần cập nhật.
   - Bảng QuestionRevision: trường version kiểu Int, ràng buộc @@unique([questionId, version]).

2. Thực thể Exam:
   - Cột Exam.version: kiểu Int, mặc định 1. Đóng vai trò khóa so sánh CAS (Compare-And-Swap).
   - Bảng ExamRevision: trường version kiểu Int, ràng buộc @@unique([examId, version]). Mỗi lần lưu thành công tạo một bản ghi snapshot bất biến.

3. Thực thể ShareLink:
   - Khóa phiên bản trên token: Token chia sẻ mang hậu tố phiên bản dạng .v<N> (ví dụ token-abc.v2) để khóa cố định nội dung tại phiên bản được chia sẻ, ngăn trôi dữ liệu khi đề gốc tiếp tục được sửa.

---

## 5. Quy tắc biểu diễn, làm tròn điểm số và Ví dụ điểm lẻ 0,25

### 5.1. Quy tắc làm tròn và lưu trữ
1. Cơ sở dữ liệu PostgreSQL (prisma/schema.prisma):
   - Question.points: Decimal(5, 2) - độ chính xác 0.01 (tối đa 999.99).
   - ExamQuestion.pointsOverride: Decimal(5, 2) - điểm ghi đè câu hỏi trong đề.
   - Attempt.score: Decimal(6, 2) - tổng điểm bài làm (tối đa 9999.99).
   - Attempt.maxScore: Decimal(6, 2) - điểm tối đa của đề thi.
   - AttemptAnswer.manualScore: Decimal(5, 2) - điểm chấm tự luận của giáo viên.
2. Bài khảo sát và phi số học (Survey / Comment-only / Rubric):
   - Đọc trực tiếp tại src/app/api/public/attempts/[id]/submit/route.ts (dòng 71-74):
     Hàm requiresNumericScore kiểm tra assessmentMode. Nếu bài thi không yêu cầu tính điểm số (như survey hoặc comment_only), hệ thống lưu score = null và maxScore = null vào bảng Attempt.
   - Kiểm chứng tự động tại tests/http_public_policies.test.ts:
     Ca test 'survey, comment-only and rubric store no artificial totals and do not enter numeric statistics or CSV' khẳng định rõ ràng: Nonnumeric work must not store a fabricated zero (Bài không chấm điểm lưu null, tuyệt đối không lưu số 0 giả tạo).

### 5.2. Ví dụ luồng xử lý điểm lẻ 0,25 xuyên suốt hệ thống
Xét câu hỏi trắc nghiệm có mức điểm lẻ 0,25 trong đề thi 10 điểm:

1. Bước 1 - Kế hoạch ma trận đề:
   - Tại src/lib/scoring.ts, hàm totalExamPoints tính tổng điểm đề thi:
     Math.round(freezeExamScoring(exam).questions.reduce((sum, q) => sum + (q.points ?? 0), 0) * 100) / 100.
   - Tại src/lib/matrix-spec-generator.ts, hàm round quy đổi điểm từng slot:
     Math.round(n * 100) / 100 bảo đảm 0.25 được giữ chính xác đến 2 chữ số thập phân.
   - Tại src/lib/exam-plan.ts ghi rõ ràng: Decimal input is exact to hundredths; finer precision is reported, never rounded away (Nhập điểm chính xác đến hàng phần trăm, không tự ý làm tròn mất).

2. Bước 2 - Phân tích câu hỏi và lưu ngân hàng:
   - Khi giáo viên nhập nhãn [0,25 điểm] trong văn bản câu hỏi, hàm parsePointsTag tại src/lib/exam-parser.ts trích xuất chính xác số thực 0.25.
   - Giá trị được ghi vào PostgreSQL trường Question.points dưới dạng Decimal(5, 2) với giá trị 0.25.

3. Bước 3 - Học sinh làm bài và chấm tự động:
   - Học sinh chọn đúng phương án. Khi gửi yêu cầu nộp bài tại src/app/api/public/attempts/[id]/submit/route.ts:
   - Hàm gradeSnapshot tại src/lib/attempt-grading.ts tính điểm thành phần:
     earned: Math.round(earned * 100) / 100 -> trả về đúng 0.25 cho trường AttemptAnswer.earned.
   - Tổng điểm bài thi được tính:
     score: Math.round(gradedAnswers.reduce((sum, a) => sum + a.earned, 0) * 100) / 100.
   - Kết quả được ghi vào bảng Attempt với score = new Prisma.Decimal(0.25) và maxScore = new Prisma.Decimal(10.00).

4. Bước 4 - Chấm tay bổ sung (nếu có):
   - Tại src/lib/manual-grading.ts, hàm applyManualGrade kiểm tra tính hợp lệ:
     Math.abs(Math.round(earned * 100) - earned * 100) > 1e-8. Nếu giáo viên nhập điểm quá 2 chữ số thập phân sẽ bị từ chối; điểm 0.25 được chấp nhận nguyên vẹn.

5. Bước 5 - Xuất bảng điểm CSV cho giáo viên:
   - Tại src/app/api/teacher/assignments/[id]/export-csv/route.ts:
     Hàm sanitizeCsvCell xuất chuỗi điểm tổng hợp: att.score !== null ? `${att.score} / ${att.maxScore ?? ''}` : 'Chưa có'.
     Học sinh đạt 0.25 điểm sẽ xuất hiện chính xác trong tệp CSV với chuỗi: 0.25 / 10.
     Đối với bài thi không chấm điểm (survey), hàm xuất chữ Không chấm điểm, không làm sai lệch bảng điểm của trường.

---

## 6. Trạng thái cơ sở dữ liệu và Migration

1. Cơ sở dữ liệu chính:
   - Theo kết quả nghiệm thu CV-002 tại docs/ke-hoach-2026-10-21/03_CHECKLIST.md, bộ migration chính đã được kiểm tra và áp dụng hoàn tất lên cơ sở dữ liệu chính (đối chiếu hash và số dòng qua main-migration.json).
2. Cơ sở dữ liệu kiểm thử độc lập:
   - Các kiểm thử tương tranh (HTTP, PostgreSQL transaction, CAS) được chạy trên cơ sở dữ liệu kiểm thử cô lập (examcraft_test_20261022), không làm ảnh hưởng đến dữ liệu chính.
3. Không tồn tại xung đột nguồn lưu trữ:
   - Bản nháp trình duyệt (LocalStorage) và cơ sở dữ liệu máy chủ được phân tách rõ ràng qua mã lỗi HTTP 409 và cơ chế Lưu bản nháp thành đề mới.
