> **Tài liệu lịch sử** (chuyển từ `docs/` ngày 26/10/2026, CV077). Không phải trạng thái hiện hành; xem `docs/ban-giao/00_DOC_TRUOC.md`.

# EXAMCRAFT — BẢNG CHECKLIST TIẾN ĐỘ THI CÔNG (THEO THIẾT KẾ v3.1)

> **Tài liệu lịch sử/đầu vào phân tích:** từ 21/10/2026, dùng [bộ tổng kết và kế hoạch hiện hành](../ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md). Nội dung và dấu hoàn thành dưới đây không tự đại diện cho yêu cầu hoặc tiến độ mới; giữ để đối chiếu nguồn gốc.

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

## 🧱 GIAI ĐOẠN 1: HẠ TẦNG DOCKER + POSTGRESQL + PRISMA + HỆ THỐNG AUTH (HOÀN THÀNH 100%)
- [x] Thiết lập `docker-compose.yml` (chạy dịch vụ `db: postgres:16-alpine` kèm volume bền vững `pgdata`).
- [x] Cài đặt các gói phụ thuộc: `prisma`, `@prisma/client`, `bcryptjs`, `zod`, `tsx`.
- [x] Viết `prisma/schema.prisma` chuẩn hóa theo thiết kế v3.1:
  - [x] Enums: `Role`, `QuestionType`, `Difficulty`, `QuestionStatus`, `VerifiedBy`, `AssignmentMode`, `AssignmentStatus`, `IdentityMode`, `RevealPolicy`, `AttemptStatus`, `AiKeyStatus`, `LeaderboardMode`, `Visibility`, `SourceKind`.
  - [x] Models: `User`, `Session`, `Passage`, `Question`, `QuestionRevision`, `ExamTemplate`, `Exam`, `ExamQuestion`, `ShareLink`, `Group`, `Student`, `Assignment`, `Attempt`, `AttemptAnswer`, `AiKeyState`, `AiUsageLog`, `AuditLog`.
- [x] Tạo migration đầu tiên: `npx prisma migrate dev --name init_v3_schema` (Đã đồng bộ thành công vào PostgreSQL container).
- [x] Viết script `prisma/seed.ts`: Khởi tạo tài khoản `SUPER_ADMIN` đầu tiên, 7 trạng thái AI Keys và 4 `ExamTemplate` mẫu chuẩn GDPT.
- [x] Xây dựng hệ thống xác thực (Auth Session):
  - [x] Route đăng nhập giáo viên/admin, băm mật khẩu `bcryptjs`, cookie `HttpOnly`, `Secure`, `SameSite: lax`.
  - [x] Cơ chế bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên (`mustChangePassword`) trên giao diện và API.
  - [x] Giới hạn số lần thử sai theo email và IP, khóa tài khoản tạm thời 15 phút khi thử sai quá 5 lần.
- [x] Xây dựng giao diện & API Quản trị Admin (`/admin/users`):
  - [x] Admin tạo tài khoản giáo viên mới (cấp email, họ tên, mật khẩu tạm sinh ngẫu nhiên, hạn mức AI/ngày).
  - [x] Khóa / mở khóa tài khoản (`isActive`), đặt lại mật khẩu tạm.
  - [x] Ghi nhận toàn bộ thao tác quản trị vào bảng `AuditLog`.
- [x] Thiết lập kiểm tra phân quyền server-side middleware / helpers (`requireAuth`, `requireAdmin`) cho mọi API routes.
- [x] Kiểm thử tự động toàn diện: Đã chạy `tests/test_phase1_auth.ts` và vượt qua 6/6 bài test (100%).

---

## 📦 GIAI ĐOẠN 2: CHUYỂN ĐỔI DỮ LIỆU ĐỀ THI SANG DB & ĐIỀU PHỐI 7 AI KEYS (HOÀN THÀNH 100%)
- [x] Chuyển đổi API và giao diện quản lý Câu hỏi (`Question`) sang Prisma:
  - [x] Lưu trữ nội dung, `payload` JSON, phân loại môn/khối/dạng câu (`/api/questions`, `/api/questions/[id]`).
  - [x] Lưu lịch sử chỉnh sửa câu hỏi (`QuestionRevision`), hỗ trợ khung so sánh diff và hoàn tác (`/api/questions/[id]/revisions`).
- [x] Chuyển đổi API và giao diện Đề thi (`Exam`) sang Prisma:
  - [x] Lưu cấu trúc `sections` linh hoạt, liên kết danh sách câu hỏi qua `ExamQuestion` (`/api/exams`, `/api/exams/[id]`).
- [x] Xây dựng chức năng "Nhập từ bản cũ" (`/api/migration/import-legacy` và nút đồng bộ 1-click trong `ExamLibraryModal.tsx`).
- [x] Xây dựng Ngân hàng câu hỏi chung nội bộ (`/api/questions/shared`):
  - [x] Cơ chế hiển thị câu hỏi `SHARED` kèm tác giả gốc (`authorId`, `author.name`).
  - [x] Nút "Nhân bản" (`/api/questions/[id]/fork`) tạo bản sao độc lập (`sourceKind = FORKED`, `originId`, bảo toàn `authorId`).
  - [x] Khóa không cho chia sẻ các câu nhập từ web (`IMPORTED_WEB`, `shareable = false`).
  - [x] Tích hợp tab "Ngân hàng dùng chung nội bộ" trực tiếp vào giao diện `QuestionBankModal.tsx`.
- [x] Nâng cấp module điều phối 7 Google Gemini API Keys (`src/lib/gemini-keys.ts`):
  - [x] Đồng bộ trạng thái (`ACTIVE`, `COOLDOWN`, `DEAD`), đếm lượt gọi và thời điểm cooldown vào bảng `AiKeyState`.
  - [x] Cơ chế chọn key thông minh ("ít dùng nhất", không bị cooldown, tự động fallback khi gặp lỗi 429/503).
  - [x] Ghi nhật ký sử dụng AI vào `AiUsageLog` (đo độ trễ ms, status, endpoint, model).
  - [x] Áp dụng kiểm tra giới hạn hạn mức theo ngày của từng giáo viên (`checkUserAiQuota` với `User.aiDailyLimit`).
  - [x] Trang dashboard `/admin/ai` xem trạng thái thực tế của 7 keys, xem 30 log gần nhất và nút kích hoạt lại key.
- [x] Kiểm thử tự động toàn diện: Đã chạy `tests/test_phase2_db_ai.ts` vượt qua 7/7 bài test (100%).

---

## 📝 GIAI ĐOẠN 3: HỆ THỐNG GIAO BÀI & PHÒNG LÀM BÀI HỌC SINH (SERVER-SIDE)
- [x] Quản lý Lớp học (`Group`) và Học sinh (`Student`):
  - [x] Giáo viên tạo lớp học thêm, nhập danh sách tên học sinh (hỗ trợ dán nhiều dòng một lần từ Excel/Word) tại `/teacher/groups`.
  - [x] Sinh link lớp `/c/[groupCode]` với 1-click sao chép.
- [x] Giao bài thi (`Assignment`):
  - [x] Giáo viên bấm Giao bài tại `ShareModal.tsx`: chọn Group, cấu hình thời gian mở/đóng, thời lượng làm bài, số lần làm tối đa.
  - [x] Tự động tạo bản chụp bất biến (**`Assignment.snapshot`**) lưu toàn bộ đề + đáp án tại thời điểm giao.
  - [x] Hỗ trợ 3 bộ cấu hình mặc định: Bài tập về nhà, Bài trên lớp, Phòng thi.
  - [x] Sinh link bài giao `/a/[publicId]`.
- [x] Phòng thi trực tuyến học sinh (`/a/[publicId]`):
  - [x] Chế độ chọn tên từ danh sách lớp (`PICK_FROM_LIST`) hoặc tự gõ tên (`FREE_NAME`).
  - [x] API lấy đề thi: **bắt buộc bóc tách, loại bỏ sạch đáp án đúng và lời giải** trước khi gửi xuống client (`sanitizeSnapshotForStudent`).
  - [x] Tạo `Attempt` trên server, tính `deadlineAt = startedAt + duration`.
  - [x] Cơ chế tự lưu nháp định kỳ (`/api/public/attempts/[id]/draft`).
  - [x] Cơ chế nộp bài idempotent (chống bấm đúp, chống nộp hai lần).
  - [x] Chấm điểm tự động tại server khi nộp bài theo đúng cấu trúc đề trong snapshot (hỗ trợ lũy tiến Đúng/Sai Phần II và chuẩn hóa trả lời ngắn Phần III).
  - [x] Hiển thị kết quả và lời giải theo đúng chính sách của bài giao (`showResult`, `showSolution`).
- [x] Bảng xếp hạng an toàn (`TOP_AND_ME`):
  - [x] Chỉ hiển thị Top N (mặc định 3–5 bạn) và dòng vị trí riêng của chính học sinh.
  - [x] Không để lộ danh sách điểm của toàn bộ lớp ra ngoài.
- [x] Trang lớp học sinh `/c/[groupCode]`: Học sinh chọn tên mình, xem các bài đang mở cần làm và lịch sử bài đã làm.
- [x] Kiểm thử tự động toàn diện: Đã chạy `tests/test_phase3_student_flow.ts` vượt qua 10/10 bài test (100%).

---

## 📊 GIAI ĐOẠN 4: MÀN HÌNH THEO DÕI & BẢNG ĐIỂM DÀNH CHO GIÁO VIÊN
- [x] Màn hình theo dõi bài giao theo thời gian thực (polling 4s/lần) tại `/teacher/assignments/[id]`.
- [x] Trang danh sách toàn bộ bài đã giao của giáo viên tại `/teacher/assignments`.
- [x] Xem chi tiết bài làm của từng học sinh: câu trả lời đã chọn, đáp án chuẩn, lời giải chi tiết.
- [x] Chấm tay câu tự luận, điều chỉnh điểm số và ghi nhận xét của giáo viên (tự động cập nhật tổng điểm `Attempt.score` tức thì).
- [x] Thao tác quản trị bài nộp: Khóa/mở lại bài thi, gia hạn thời gian, xóa lượt làm lỗi cho học sinh làm lại.
- [x] Thống kê phân tích: Phổ điểm (dưới 5, 5–6.5, 6.5–8, 8–10), điểm trung bình, cao nhất, thấp nhất và tỷ lệ đúng theo từng câu hỏi (Item Analysis cảnh báo câu khó để chữa bài).
- [x] Xuất bảng điểm CSV an toàn (có UTF-8 BOM hiển thị chuẩn Tiếng Việt trên Excel, làm sạch công thức hiểm độc CSV Formula Injection).
- [x] Kiểm thử tự động toàn diện: Đã chạy `tests/test_phase4_monitoring.ts` vượt qua 9/9 bài test (100%).

---

## 📄 GIAI ĐOẠN 5: CHẤT LƯỢNG XUẤT WORD & IN ẤN A4
- [x] Xây dựng bộ test 50 công thức toán/khtn phức tạp (phân số lồng, ma trận, tích phân có cận, hệ phương trình, hóa học cân bằng, ký hiệu hạt nhân...).
- [x] Thử nghiệm nâng cấp đường chuyển đổi: LaTeX → OMML MathRun (`docx` native) và làm sạch text fallback hiển thị trơn tru trong Microsoft Word.
- [x] Cơ chế dự phòng: Tự động chuyển ký hiệu thành Unicode chuẩn và công thức OMML an toàn.
- [x] Đảm bảo nguyên tắc phân trang A4: Thiết lập `keepWithNext: true` và `keepLines: true` ngăn chặn việc câu hỏi bị cắt đôi giữa 2 trang giấy.
- [x] Kiểm thử xuất file `.docx` thật trên môi trường Windows (`tests/output_test_de_thi.docx`) đạt chuẩn OpenXML zip.
- [x] Kiểm thử tự động toàn diện: Đã chạy `tests/test_phase5_word_quality.ts` vượt qua 6/6 bài test (100%).

---

## 🛡️ GIAI ĐOẠN 6: BẢO MẬT, SAO LƯU & KIỂM CHỨNG TOÀN DIỆN
- [x] Thiết lập script sao lưu tự động PostgreSQL (`scripts/backup.ps1` & `scripts/backup.sh`) và kiểm thử khôi phục thành công 100% (`scripts/restore.ps1`).
- [x] Rà soát toàn bộ checklist bảo mật theo Mục 10:
  - [x] HttpOnly, SameSite Session Cookies.
  - [x] KaTeX `trust: false` chống tấn công XSS script injection.
  - [x] Chống tấn công brute-force với lockout rate limiter.
  - [x] Chống tấn công CSV Formula Injection trên xuất bảng điểm Excel.
- [x] Kiểm thử kiểm định đáp án bằng chuẩn hóa toán học số học & phân số.
- [x] Kiểm thử với đề thi thật trên các môn học và gắn nhãn mức độ sẵn sàng cho 12 môn học GDPT 2018.
- [x] Kiểm thử tự động toàn diện: Đã chạy `tests/test_phase6_security_audit.ts` vượt qua 5/5 bài test (100%).
