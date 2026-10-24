# BÁO CÁO G0.1 & G0.3: BẢN ĐỒ HỆ THỐNG VÀ KIỂM ĐẾM THỰC TẾ (SYSTEM MAP)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Thời điểm lập bản đồ**: 2026-10-18 11:17 UTC+7
- **Người thực hiện**: TEST DIRECTOR (DIR) & RECON (REC)
- **Cơ sở đối chiếu**: Mã nguồn thực tế tại commit `ef8d34b` so với tuyên bố tại `docs/BAO_CAO_TOAN_DIEN_V3.md` và `docs/CHECKLIST_TIEN_DO.md`.

---

## 1. KIỂM ĐẾM THỰC TẾ ROUTE & THỰC THỂ

| Thành phần | Tuyên bố trong báo cáo / checklist | Đếm thực tế trong mã nguồn | Độ lệch / Đánh giá |
|---|---|---|---|
| **API Routes** (`route.ts`) | 34 routes | **37 routes** | `DOC-STALE`: Thực tế có thêm 4 route legacy `/api/cloud/*` và các route mới bổ sung |
| **Giao diện trang** (`page.tsx`) | 10–11 pages | **11 pages** | Khớp (`/`, `/a/[publicId]`, `/admin/ai`, `/admin/users`, `/c/[groupCode]`, `/login`, `/share/[id]`, `/teacher/assignments`, `/teacher/assignments/[id]`, `/teacher/groups`, `/test/[id]`) |
| **Prisma Models** (`model X`) | 17 models | **17 models** | Khớp 100% |
| **Prisma Enums** (`enum X`) | 14 enums | **14 enums** | Khớp 100% |

---

## 2. DANH MỤC CHI TIẾT CÁC ROUTE

### 2.1 Danh Sách 11 Trang Giao Diện (`page.tsx`)
1. `/` — Trang chủ biên tập đề thi chính (Exam Editor, Copilot, Xem trước A4).
2. `/a/[publicId]` — **Phòng thi trực tuyến học sinh (v3.1)**: Zero-account, server-timer, KaTeX, auto-save.
3. `/admin/ai` — Dashboard quản trị 7 Gemini API Keys, latency logs, reset key.
4. `/admin/users` — Quản trị người dùng: tạo GV, khóa tài khoản, cấp lại mật khẩu.
5. `/c/[groupCode]` — Cổng thông tin lớp học: học sinh chọn tên xem bài mở và lịch sử.
6. `/login` — Đăng nhập hệ thống dành cho Giáo viên & Super Admin.
7. `/share/[id]` — **[LEGACY]** Trang xem và tải đề thi công khai từ cloud file.
8. `/teacher/assignments` — Danh sách toàn bộ bài giao của giáo viên.
9. `/teacher/assignments/[id]` — Màn hình giám sát phòng thi thời gian thực (Polling 4s, phổ điểm, Item Analysis).
10. `/teacher/groups` — Quản lý lớp học và danh sách học sinh (dán nhiều dòng).
11. `/test/[id]` — **[LEGACY / RỦI RO CAO]** Phòng làm bài thi nhanh từ phiên bản cũ (đọc từ `data/cloud_exams.json`).

### 2.2 Danh Sách 37 API Endpoints (`route.ts`)

#### A. Phân Hệ Quản Trị & Xác Thực (7 routes)
1. `GET /api/admin/ai` — Lấy trạng thái 7 keys, quota ngày, 30 logs gần nhất.
2. `POST /api/admin/ai` — Thao tác reset cooldown key thủ công.
3. `GET, POST /api/admin/users` — Danh sách giáo viên / Tạo giáo viên mới.
4. `PATCH, DELETE /api/admin/users/[id]` — Khóa tài khoản, đặt lại mật khẩu, xóa GV.
5. `POST /api/auth/login` — Đăng nhập, kiểm tra rate limit thử sai, cấp session cookie.
6. `POST /api/auth/logout` — Đăng xuất, hủy session token trong DB.
7. `GET /api/auth/me` — Lấy thông tin user hiện tại từ session cookie.
8. `POST /api/auth/change-password` — Đổi mật khẩu (hạ cờ `mustChangePassword`).

#### B. Phân Hệ Đề Thi & Câu Hỏi (Prisma v3) (10 routes)
9. `GET, POST /api/questions` — Lấy danh sách câu hỏi / Tạo câu hỏi mới.
10. `GET, PUT, DELETE /api/questions/[id]` — Chi tiết, cập nhật (ghi revision), xóa mềm câu hỏi.
11. `GET /api/questions/[id]/revisions` — Lấy lịch sử chỉnh sửa câu hỏi.
12. `POST /api/questions/[id]/fork` — Nhân bản câu hỏi vào đề riêng (bảo toàn author gốc).
13. `GET /api/questions/shared` — Duyệt ngân hàng câu hỏi dùng chung nội bộ.
14. `GET, POST /api/exams` — Lấy danh sách đề thi / Tạo đề thi mới.
15. `GET, PUT, DELETE /api/exams/[id]` — Chi tiết, sửa, xóa đề thi.
16. `POST /api/migration/import-legacy` — Nhập đề thi/câu hỏi từ file sao lưu cũ vào DB.
17. `POST /api/tweak-question` — AI chỉnh sửa vi mô câu hỏi (đổi số, tăng giảm độ khó).
18. `POST /api/verify-question` — AI/Toán học kiểm định đáp án câu hỏi.

#### C. Phân Hệ Lớp Học, Giao Bài & Học Sinh (v3) (9 routes)
19. `GET, POST /api/groups` — Lấy danh sách lớp / Tạo lớp mới.
20. `GET, PUT, DELETE /api/groups/[id]` — Chi tiết lớp, cập nhật học sinh (dán nhiều dòng), xóa lớp.
21. `POST /api/assignments` — Tạo bài giao với `Assignment.snapshot` bất biến.
22. `GET /api/public/assignments/[publicId]` — Lấy thông tin bài giao (đã lọc sạch đáp án).
23. `POST /api/public/assignments/[publicId]/start` — Bắt đầu làm bài, tạo `Attempt` với `deadlineAt`.
24. `PUT /api/public/attempts/[id]/draft` — Tự động lưu nháp câu trả lời định kỳ.
25. `POST /api/public/attempts/[id]/submit` — Nộp bài idempotent và chấm điểm tự động.
26. `GET /api/public/groups/[groupCode]` — Lấy thông tin lớp và danh sách bài tập cho học sinh.

#### D. Phân Hệ Giám Sát Giáo Viên (v3) (3 routes)
27. `GET /api/teacher/assignments/[id]` — Giám sát bài thi realtime, phổ điểm, Item Analysis.
28. `GET /api/teacher/assignments/[id]/export-csv` — Xuất bảng điểm CSV (UTF-8 BOM, escape formula).
29. `GET, PATCH, DELETE /api/teacher/attempts/[id]` — Xem chi tiết bài làm, chấm tay tự luận, xóa lượt làm.

#### E. Phân Hệ Trợ Lý AI & Ingestion (4 routes)
30. `POST /api/exam-copilot` — Trợ lý Copilot hội thoại soạn đề.
31. `POST /api/generate-exam` — AI sinh đề thi theo ma trận cấu trúc.
32. `POST /api/ocr-exam-image` — Trích xuất đề thi từ hình ảnh (Gemini Multimodal).
33. `POST /api/parse-docx` — Trích xuất đề thi từ file Word (`mammoth`).
34. `POST /api/parse-exam-text` — Parser trích xuất đề thi từ văn bản thô / LaTeX EX_Test.

#### F. Phân Hệ Legacy Cũ (`/api/cloud/*`) (3 routes) — [CẦN LƯU Ý ĐẶC BIỆT]
35. `GET, POST /api/cloud/exams` — Đọc/ghi đề thi vào `data/cloud_exams.json`.
36. `GET, DELETE /api/cloud/exams/[id]` — Đọc chi tiết đề thi thô từ JSON (chứa cả đáp án!).
37. `GET, POST /api/cloud/exams/[id]/submissions` & `submit` — Nộp bài và lấy danh sách nộp bài legacy.

---

## 3. CƠ SỞ DỮ LIỆU: 17 MODELS & 14 ENUMS

### 3.1 14 Enums
`Role`, `QuestionType`, `Difficulty`, `QuestionStatus`, `VerifiedBy`, `AssignmentMode`, `AssignmentStatus`, `IdentityMode`, `RevealPolicy`, `AttemptStatus`, `AiKeyState`, `LeaderboardMode`, `Visibility`, `SourceKind`.

### 3.2 17 Models
1. `User` (id, email, passwordHash, name, role, aiDailyLimit, mustChangePassword, isActive)
2. `Session` (id, token, userId, expiresAt)
3. `Passage` (id, title, content, subject, grade)
4. `Question` (id, code, content, type, difficulty, payload, subject, grade, status, verifiedBy, visibility, sourceKind, authorId, ownerId)
5. `QuestionRevision` (id, questionId, version, content, payload, changeNote, createdById)
6. `ExamTemplate` (id, name, description, durationMinutes, totalPoints, sections, isSystem)
7. `Exam` (id, code, metadata, sections, ownerId)
8. `ExamQuestion` (id, examId, questionId, sectionIndex, orderIndex, customPoints)
9. `ShareLink` (id, token, examId, allowCopy, allowExportDocx, expiresAt)
10. `Group` (id, name, groupCode, grade, teacherId)
11. `Student` (id, groupId, name, studentCode)
12. `Assignment` (id, publicId, examId, groupId, teacherId, mode, snapshot, opensAt, closesAt, durationMinutes, maxAttempts, showResult, showSolution)
13. `Attempt` (id, assignmentId, studentId, studentName, attemptNumber, status, startedAt, deadlineAt, submittedAt, score, maxScore)
14. `AttemptAnswer` (id, attemptId, questionId, response, isCorrect, earned, manualScore, comment)
15. `AiKeyState` (id, keyAlias, status, callCountToday, cooldownUntil, lastError)
16. `AiUsageLog` (id, userId, keyAlias, endpoint, model, promptTokens, completionTokens, httpStatus, latencyMs)
17. `AuditLog` (id, actorId, action, targetType, targetId, meta, ip)

---

## 4. NƠI LƯU TRỮ VÀ ĐIỀU PHỐI KHÓA BÍ MẬT (SECRETS)

- **Gemini API Keys**: Lưu trong `.env` / `.env.local` dưới tên `GEMINI_API_KEY_1` đến `GEMINI_API_KEY_7`. Không lưu giá trị thô trong DB. DB chỉ quản lý `keyAlias` (`key1`..`key7`).
- **Session Auth Cookie**: `auth_session` mang cờ `HttpOnly`, `SameSite: Lax`, được ký/đối chiếu với bảng `Session` trong CSDL.
- **Legacy Storage**: File `data/cloud_exams.json` và `data/student_submissions.json` lưu trực tiếp trên đĩa, không có xác thực quyền sở hữu.
