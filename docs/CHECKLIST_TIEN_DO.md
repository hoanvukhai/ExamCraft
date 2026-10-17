# EXAMCRAFT — BẢNG CHECKLIST TIẾN ĐỘ THI CÔNG (THEO THIẾT KẾ v3.1)

> **Tài liệu gốc**: [`docs/EXAMCRAFT_THIET_KE_V3.md`](./EXAMCRAFT_THIET_KE_V3.md)  
> **Nguyên tắc**: "Có code" ≠ "Hoàn thành". Một hạng mục chỉ được đánh dấu `[x]` khi đã qua kiểm thử và đáp ứng tiêu chí nghiệm thu (Mục 16.2).

---

## 🏁 GIAI ĐOẠN 0: DỌN DẸP & CHUẨN BỊ NỀN TẢNG (1–2 NGÀY)
- [x] Tạo thư mục `docs/` và `docs/archive/`, chuyển các tài liệu kế hoạch cũ và file `.docx` vào `docs/archive/`.
- [x] Chuyển `EXAMCRAFT_THIET_KE_V3.md` vào `docs/` làm tài liệu kiến trúc quy chuẩn.
- [x] Tạo file `LICENSE` (Giấy phép MIT License chính thức).
- [x] Cập nhật `README.md` khớp hoàn toàn với kiến trúc v3.1 (PostgreSQL, Prisma, Docker, điểm số động, xoay tua 7 key an toàn).
- [x] Gia cố an ninh nhanh theo các điểm `[CẦN KIỂM TRA]`:
  - [x] Bật `trust: false` trong `MathRenderer.tsx` để triệt tiêu lỗ hổng XSS từ KaTeX.
  - [x] Thêm tiền tố `'` chống CSV Injection cho các ô văn bản trong xuất bảng điểm.
- [x] Tạo file checklist tiến độ theo dõi dài hạn: `docs/CHECKLIST_TIEN_DO.md`.

---

## 🧱 GIAI ĐOẠN 1: HẠ TẦNG DOCKER + POSTGRESQL + PRISMA + HỆ THỐNG AUTH (1–2 TUẦN)
- [ ] Thiết lập `docker-compose.yml` (chạy dịch vụ `db: postgres:16-alpine` kèm volume bền vững `pgdata`).
- [ ] Cài đặt các gói phụ thuộc: `prisma`, `@prisma/client`, `argon2` (hoặc `bcrypt`), `zod`.
- [ ] Viết `prisma/schema.prisma` chuẩn hóa theo thiết kế v3.1:
  - [ ] Enums: `Role`, `QuestionType`, `Difficulty`, `QuestionStatus`, `VerifiedBy`, `AssignmentMode`, `AssignmentStatus`, `IdentityMode`, `RevealPolicy`, `AttemptStatus`, `AiKeyStatus`, `LeaderboardMode`, `Visibility`, `SourceKind`.
  - [ ] Models: `User`, `Passage`, `Question`, `QuestionRevision`, `ExamTemplate`, `Exam`, `ExamQuestion`, `ShareLink`, `Group`, `Student`, `Assignment`, `Attempt`, `AttemptAnswer`, `AiKeyState`, `AiUsageLog`, `AuditLog`.
- [ ] Tạo migration đầu tiên: `npx prisma migrate dev --name init_v3_schema`.
- [ ] Viết script `prisma/seed.ts`: Khởi tạo tài khoản `SUPER_ADMIN` đầu tiên, danh sách môn học và các `ExamTemplate` mẫu chuẩn.
- [ ] Xây dựng hệ thống xác thực (Auth Session):
  - [ ] Route đăng nhập giáo viên/admin, băm mật khẩu `argon2id`, cookie `HttpOnly`, `Secure`, `SameSite`.
  - [ ] Cơ chế bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên (`mustChangePassword`).
  - [ ] Giới hạn số lần thử sai theo email và IP, khóa tài khoản tạm thời khi vượt ngưỡng.
- [ ] Xây dựng giao diện & API Quản trị Admin (`/admin/users`):
  - [ ] Admin tạo tài khoản giáo viên mới (cấp email, mật khẩu tạm).
  - [ ] Khóa / mở khóa tài khoản (`isActive`), đặt lại mật khẩu.
  - [ ] Ghi nhận toàn bộ thao tác quản trị vào bảng `AuditLog`.
- [ ] Thiết lập kiểm tra phân quyền server-side middleware / helpers cho mọi API routes.

---

## 📦 GIAI ĐOẠN 2: CHUYỂN ĐỔI DỮ LIỆU ĐỀ THI SANG DB & ĐIỀU PHỐI 7 AI KEYS
- [ ] Chuyển đổi API và giao diện quản lý Câu hỏi (`Question`) sang Prisma:
  - [ ] Lưu trữ nội dung, `payload` JSON, phân loại môn/khối/dạng câu.
  - [ ] Lưu lịch sử chỉnh sửa câu hỏi (`QuestionRevision`), hỗ trợ khung so sánh diff và hoàn tác.
- [ ] Chuyển đổi API và giao diện Đề thi (`Exam`) sang Prisma:
  - [ ] Lưu cấu trúc `sections` linh hoạt, liên kết danh sách câu hỏi qua `ExamQuestion`.
- [ ] Xây dựng trang "Nhập từ bản cũ" (nhập dữ liệu IndexedDB/JSON cũ vào tài khoản giáo viên trong DB).
- [ ] Gỡ bỏ Dexie.js / IndexedDB khỏi luồng lưu trữ chính.
- [ ] Xây dựng Ngân hàng câu hỏi chung nội bộ (`/questions/shared`):
  - [ ] Cơ chế hiển thị câu hỏi `SHARED` kèm tác giả gốc (`authorId`).
  - [ ] Nút "Thêm vào đề của tôi" tạo bản sao độc lập (`sourceKind = FORKED`, `originId`).
  - [ ] Khóa không cho chia sẻ các câu nhập từ web (`IMPORTED_WEB`, `shareable = false`).
- [ ] Nâng cấp module điều phối 7 Google Gemini API Keys:
  - [ ] Lưu trạng thái (`ACTIVE`, `COOLDOWN`, `DEAD`), đếm lượt gọi và thời điểm reset vào bảng `AiKeyState`.
  - [ ] Cơ chế chọn key thông minh ("ít dùng gần nhất", giới hạn 1–2 yêu cầu đồng thời mỗi key).
  - [ ] Ghi nhật ký sử dụng AI vào `AiUsageLog`.
  - [ ] Áp dụng giới hạn hạn mức theo ngày của từng giáo viên (`User.aiDailyLimit`).
  - [ ] Trang dashboard `/admin/ai` xem trạng thái thực tế của 7 keys.

---

## 📝 GIAI ĐOẠN 3: HỆ THỐNG GIAO BÀI & PHÒNG LÀM BÀI HỌC SINH (SERVER-SIDE)
- [ ] Quản lý Lớp học (`Group`) và Học sinh (`Student`):
  - [ ] Giáo viên tạo lớp học thêm, nhập danh sách tên học sinh (hỗ trợ dán nhiều dòng một lần).
  - [ ] Sinh link lớp `/c/[groupCode]`.
- [ ] Giao bài thi (`Assignment`):
  - [ ] Giáo viên bấm Giao bài: chọn Group, cấu hình thời gian mở/đóng, thời lượng làm bài, số lần làm tối đa.
  - [ ] Tự động tạo bản chụp bất biến (**`Assignment.snapshot`**) lưu toàn bộ đề + đáp án tại thời điểm giao.
  - [ ] Hỗ trợ 3 bộ cấu hình mặc định: Bài tập về nhà, Bài trên lớp, Phòng thi.
  - [ ] Sinh link bài giao `/a/[publicId]`.
- [ ] Phòng thi trực tuyến học sinh (`/a/[publicId]`):
  - [ ] Chế độ chọn tên từ danh sách lớp (`PICK_FROM_LIST`) hoặc tự gõ tên (`FREE_NAME`).
  - [ ] API lấy đề thi: **bắt buộc bóc tách, loại bỏ sạch đáp án đúng và lời giải** trước khi gửi xuống client.
  - [ ] Tạo `Attempt` trên server, tính `deadlineAt = startedAt + duration`.
  - [ ] Cơ chế tự lưu nháp định kỳ (`/api/public/attempts/[id]/draft`).
  - [ ] Cơ chế nộp bài idempotent (chống bấm đúp, chống nộp hai lần).
  - [ ] Chấm điểm tự động tại server khi nộp bài theo đúng cấu trúc đề trong snapshot.
  - [ ] Hiển thị kết quả và lời giải theo đúng chính sách của bài giao (`showResult`, `showSolution`).
- [ ] Bảng xếp hạng an toàn (`TOP_AND_ME`):
  - [ ] Chỉ hiển thị Top N (mặc định 3–5 bạn) và dòng vị trí riêng của chính học sinh.
  - [ ] Không để lộ danh sách điểm của toàn bộ lớp ra ngoài.
- [ ] Trang lớp học sinh `/c/[groupCode]`: Học sinh chọn tên mình, xem các bài đang mở cần làm và lịch sử bài đã làm.
- [ ] Thử tải k6 mô phỏng 100 học sinh cùng lưu nháp và nộp bài.

---

## 📊 GIAI ĐOẠN 4: MÀN HÌNH THEO DÕI & BẢNG ĐIỂM DÀNH CHO GIÁO VIÊN
- [ ] Màn hình theo dõi bài giao theo thời gian thực (polling 3–5s/lần).
- [ ] Xem chi tiết bài làm của từng học sinh: đáp án đã chọn, đúng/sai từng câu.
- [ ] Chấm tay câu tự luận, nhập điểm và nhận xét của giáo viên.
- [ ] Thao tác quản trị bài nộp: Mở lại bài, gia hạn thời gian, cấp thêm 1 lượt làm, xóa lượt làm / xóa học sinh.
- [ ] Thống kê phân tích: Phổ điểm, điểm trung bình, tỷ lệ đúng theo từng câu hỏi (Item Analysis).
- [ ] Xuất bảng điểm CSV an toàn (có UTF-8 BOM, làm sạch công thức hiểm độc).

---

## 📄 GIAI ĐOẠN 5: CHẤT LƯỢNG XUẤT WORD & IN ẤN A4
- [ ] Xây dựng bộ test 50–100 công thức toán/khtn phức tạp (phân số lồng, ma trận, tích phân có cận, hệ phương trình, ký hiệu hạt nhân...).
- [ ] Thử nghiệm nâng cấp đường chuyển đổi: LaTeX → MathML → OMML để sửa được công thức native trong Microsoft Word.
- [ ] Cơ chế dự phòng: Tự động chuyển công thức bị lỗi thành hình ảnh vector/PNG độ nét cao chèn vào Word.
- [ ] Đảm bảo nguyên tắc phân trang A4: Không cắt đôi câu hỏi giữa 2 trang giấy.
- [ ] Kiểm thử mở file `.docx` trên Microsoft Word thật trên Windows.

---

## 🛡️ GIAI ĐOẠN 6: BẢO MẬT, SAO LƯU & KIỂM CHỨNG TOÀN DIỆN
- [ ] Thiết lập script sao lưu tự động PostgreSQL (`scripts/backup.sh`) và chạy thử nghiệm khôi phục (`restore`).
- [ ] Rà soát toàn bộ checklist bảo mật theo Mục 10 (CSRF, XSS, Rate limit, CSP, Cookie flag).
- [ ] Kiểm thử kiểm định đáp án bằng công cụ toán học thật (mathjs/SymPy) cho các bài toán đại số/giải tích.
- [ ] Kiểm thử với đề thi thật trên các môn học và gắn nhãn mức độ sẵn sàng của từng môn.
- [ ] Tổ chức thi thử với lớp học thật và thu thập phản hồi của giáo viên/học sinh.
