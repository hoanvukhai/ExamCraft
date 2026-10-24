# MA TRẬN CHÍNH SÁCH CÔNG BỐ VÀ CA KIỂM THỬ BÀI TẬP CÔNG KHAI (PUBLIC POLICY MATRIX & TEST CASES)
*Phiên bản Đính chính Generation 5 (Mục G01 trong GEMINI-CONTINUOUS-BATCH) — Căn cứ mã nguồn thực tế tại commit bb14bee và working tree*

- **Người thực hiện:** Gemini (QA Tài liệu / Phối hợp đa AI)
- **Nhiệm vụ:** `G01` thuộc `GEMINI-CONTINUOUS-BATCH` (Generation 5, `ASSIGNMENTS.json`)
- **Thời điểm rà soát (UTC):** 2026-10-24T13:22:00Z
- **Baseline đối chiếu:** `bb14bee` (kèm các thay đổi đã tích hợp của Codex trên nhánh `rebuild/2026-10-local`)
- **Phân định rõ mã CV liên quan:**
  - `CV048`: Chia sẻ đề thi công khai (ShareModal / trang `/share/[id]` / xuất docx)
  - `CV056`: Chính sách thời hạn mở/đóng bài tập và thời gian làm bài (Window, OpensAt, ClosesAt, DurationMinutes, Grace Period)
  - `CV057`: Bộ nhớ tạm nháp học sinh tại trình duyệt (Local journal & Recovery)
  - `CV058`: Giao diện và luồng làm bài thi học sinh (`/a/[publicId]`)
  - `CV059`: Chính sách công bố kết quả, đáp án/lời giải và bảng xếp hạng (Reveal Policies: IMMEDIATE, AFTER_CLOSE, NEVER)
  - `CV060`: Chấm điểm thủ công và điều chỉnh điểm số của giáo viên (Manual grading & Comments)
  - `CV061`: Giám sát đợt giao đề, theo dõi tiến độ và bảng điểm (Monitor & Grade History & Leaderboard)
  - `CV062`: Báo cáo đánh giá không điểm số và thống kê đợt giao bài (Survey, Rubric, Nonnumeric & CSV)
  - `CV077`: Dọn dẹp dữ liệu cũ và lưu trữ (Archive & Purge)

---

## I. MA TRẬN PHÂN ĐỊNH GIỮA XEM ĐỀ CÔNG KHAI VÀ QUYỀN HẠN BÀI LÀM RIÊNG TƯ

Hệ thống phân tách rạch ròi giữa hai loại yêu cầu:
1. **Public View (`GET /api/public/assignments/[publicId]`):** Cổng xem đề công khai dành cho khách hoặc học sinh chuẩn bị vào làm bài. Đề thi luôn được bóc tách làm sạch (`sanitizeSnapshotForStudent`), loại bỏ đáp án và barem điểm.
2. **Private Attempt Actions (`PATCH /draft`, `POST /submit`, `GET /submit` kết quả):** Các thao tác gắn liền với một lượt thi cụ thể, bắt buộc phải có capability hợp lệ (`hasActiveAttemptAccess`).

---

### 1. Ma trận Hành vi Xác thực & Trạng thái Thực thể

| Tình huống Cookie / Trạng thái Thực thể | Trạng thái Bài tập | Public View (`GET /assignments/[publicId]`) | Draft (`PATCH /attempts/[id]/draft`) | Submit (`POST /attempts/[id]/submit`) | Result (`GET /attempts/[id]/submit`) | Căn cứ mã nguồn & Cơ chế xử lý |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Không có cookie lượt làm bài** | `OPEN` | **HTTP 200** (Xem đề sạch, `myAttempt: null`) | **HTTP 403** (Chặn) | **HTTP 403** (Chặn) | **HTTP 403** (Chặn) | Bài mở cho phép khách xem thông tin đề; private actions yêu cầu cookie lượt thi. |
| **Cookie hỏng / Sai HMAC / Hết hạn (>30d)** | `OPEN` | **HTTP 200** (Xem đề sạch, `myAttempt: null`) | **HTTP 403** (Chặn) | **HTTP 403** (Chặn) | **HTTP 403** (Chặn) | `hasActiveAttemptAccess` trả về `false`. Public view bỏ qua cookie hỏng, hiển thị như khách. |
| **Học sinh bị lưu trữ (`student.archivedAt`)** | `OPEN` | **HTTP 200** (Xem đề sạch, `myAttempt: null`) | **HTTP 403** (Chặn) | **HTTP 403** (Chặn) | **HTTP 403** (Chặn) | `hasActiveAttemptAccess` kiểm tra `student.archivedAt == null`. Chặn mọi quyền ghi/đọc kết quả riêng. |
| **Lớp học bị lưu trữ (`group.archivedAt`)** | Bất kỳ | **HTTP 404** (`Bài giao không tồn tại...`) | **HTTP 403** (Chặn) | **HTTP 403** (Chặn) | **HTTP 403** (Chặn) | Lớp giải tán đóng hoàn toàn cổng public; chỉ giáo viên xem được qua teacher API. |
| **Chưa có lượt nộp (`!mayReview`)** | `CLOSED` hoặc `ARCHIVED` hoặc tương lai (`opensAt > now`) | **HTTP 403** (`Bài thi này hiện đang tạm đóng` / chưa mở / kết thúc) | **HTTP 403** (nếu không có cookie) hoặc **HTTP 409** (nếu có lượt nhưng đã đóng) | **HTTP 403** (nếu không có cookie) hoặc **HTTP 200** chốt nháp (nếu có lượt dở) | **HTTP 403** (nếu không có cookie) hoặc **HTTP 409** (`Bài chưa được nộp`) | Tách biệt rõ: `!mayReview` chỉ là điều kiện cổng ở public view; các hành vi private xử lý theo capability và trạng thái attempt. |
| **Có lượt đang làm (`IN_PROGRESS`), bài tập đã đóng/hết hạn** | `CLOSED` hoặc hết hạn (`closesAt <= now`) | **HTTP 403** (`!mayReview`) | **HTTP 409** (`Lượt đã đóng hoặc hết thời gian làm bài`) | **HTTP 200** (Trong grace 15s: nhận body; Sau grace 15s: chốt nháp server) | **HTTP 409** (`Bài chưa được nộp`) | Cho phép học sinh gửi submit để chốt kết quả bài dở dang ngay cả khi bài đã đóng. |
| **Có lượt nộp hợp lệ (`status: SUBMITTED`, tức `mayReview: true`)** | `CLOSED` hoặc `ARCHIVED` | **HTTP 200** (Xem lại đề và bài nộp) | **HTTP 409** (`Lượt đã đóng hoặc đã nộp`) | **HTTP 200** (Idempotent replay, không ghi đè dữ liệu) | **HTTP 200** (Theo chính sách công bố) | Quyền ôn tập/xem lại của học sinh đã nộp được bảo toàn sau khi đóng bài. |

---

### 2. Ma trận Ranh giới Thời gian và Bù trừ Mạng (CV056)

- Ranh giới mở: `opensAt && opensAt > now` -> Public view và Start trả về **HTTP 403**.
- Ranh giới đóng: `closesAt && closesAt <= now`.
- Hạn nộp cá nhân: `deadlineAt = min(startedAt + durationMinutes, closesAt)`.
- Thời gian ân hạn vận chuyển mạng: `SUBMIT_GRACE_MS = 15_000` (15 giây).

| Mốc thời gian nộp bài | Draft (`PATCH /draft`) | Submit có body mới (`POST /submit`) | Submit chỉ chốt nháp máy chủ (`useSavedDraftOnly: true`) |
| :--- | :--- | :--- | :--- |
| **Trong hạn làm bài (`now <= deadlineAt`)** | **HTTP 200** (Lưu CAS bình thường) | **HTTP 200** (Chấp nhận đáp án trong body) | **HTTP 200** (Chốt nháp máy chủ) |
| **Quá hạn từ 0s đến 15s (Trong Grace)** | **HTTP 409** (Khóa lưu nháp) | **HTTP 200** (Chấp nhận đáp án trong body do mạng trễ) | **HTTP 200** (Chốt nháp máy chủ) |
| **Quá hạn trên 15s (Sau Grace)** | **HTTP 409** (Khóa lưu nháp) | **HTTP 200** (Bỏ qua body, **chỉ chấm nháp máy chủ**) | **HTTP 200** (Chốt nháp máy chủ) |

---

### 3. Ma trận Các Chính Sách Độc Lập và Chế Độ Đánh Giá Không Điểm Số (CV059 & CV062)

Các chính sách công bố được đánh giá độc lập theo từng trường trong `assignment`:
- **Chính sách điểm số (`showResult`):** Đánh giá qua `numeric && isPolicyVisible(assignment.showResult, assignment)`.
- **Chính sách lời giải (`showSolution`):** Đánh giá độc lập qua `mode !== 'survey' && isPolicyVisible(assignment.showSolution, assignment)`. Nếu `showSolution === 'NEVER'`, lời giải luôn `null` kể cả khi điểm số được mở.
- **Chính sách bảng xếp hạng (`leaderboard`):** Đánh giá qua `showResult && assignment.leaderboard === 'TOP_AND_ME' && isPolicyVisible(assignment.leaderboardReveal, assignment)`. Bảng xếp hạng phụ thuộc vào việc điểm số có được mở hay không (tránh lộ điểm gián tiếp qua thứ hạng), nhưng có thời điểm công bố độc lập (`leaderboardReveal`).

| Thiết lập chính sách / Chế độ | Điểm số (`score`) | Lời giải chi tiết (`solutions`) | Bảng xếp hạng (`leaderboard`) | Căn cứ mã nguồn xử lý |
| :--- | :--- | :--- | :--- | :--- |
| **showResult: NEVER** | Luôn `null` | Phụ thuộc riêng vào `showSolution` | **Bắt buộc `null`** (do `showResult = false`) | `src/app/api/public/attempts/[id]/submit/route.ts:18-21` |
| **showResult: AFTER_CLOSE (Khi bài OPEN)** | `null` | Phụ thuộc riêng vào `showSolution` | `null` (chờ bài đóng) | `src/lib/attempt-access.ts:isPolicyVisible` |
| **showResult: AFTER_CLOSE (Khi CLOSED/hết hạn)** | Trả về số điểm | Phụ thuộc riêng vào `showSolution` (nếu `showSolution` cũng đến hạn mở) | Trả về Top & Me (nếu `leaderboardReveal` đến hạn mở) | Đánh giá độc lập từng chính sách |
| **showResult: IMMEDIATE** | Trả về số điểm tức thì | Phụ thuộc riêng vào `showSolution` | Trả về tức thì (nếu `leaderboardReveal` là IMMEDIATE) | Trả về theo cấu hình riêng của từng trường |
| **assessmentMode: survey (Khảo sát)** | **Luôn `null`** | **Luôn `null`** | **Luôn `null`** | DB lưu `null`, không tạo điểm `0` giả; CSV không hiện "Chờ chấm". |
| **assessmentMode: comment_only / rubric** | **Luôn `null`** | Phụ thuộc riêng vào `showSolution` | **Luôn `null`** | Đánh giá định tính/barem; CSV hiển thị "Đã nhận / Chờ nhận xét". |

---

## II. ĐỐI CHIẾU KIỂM SOÁT DỮ LIỆU VÀ TRẠNG THÁI KIỂM THỬ

1. **Bảo vệ Đề thi Công khai:**
   - Hàm `sanitizeSnapshotForStudent` lọc sạch `correct_answer`, `step_by_step_solution`, `explanation`, `sub_questions[].isCorrect`, `matchingPairs`, `correctOrder`, barem điểm `rubric[].maxPoints`.
2. **Xử lý Nộp bài Lặp lại (Idempotent Submit):**
   - Khi học sinh gửi lại `POST .../submit` sau khi đã nộp, server phát hiện `status === 'SUBMITTED'`, gọi cùng hàm `resultResponse(attempt, true)` áp dụng bộ lọc ẩn điểm/lời giải/BXH như lần đầu, không ghi đè cơ sở dữ liệu.
3. **Hiện trạng Bằng chứng Kiểm thử:**
   - **Tầng HTTP/Backend:** Bộ kiểm thử HTTP (`http-public-policies.log`) chạy trên cơ sở dữ liệu thử nghiệm độc lập `examcraft_test_20261022` ghi nhận 27/27 ca kiểm thử pass (đối chiếu tại `qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md`). Bộ test bao gồm các kiểm tra ma trận reveal, start đồng thời, ranh giới ân hạn mạng 15 giây, và xử lý dữ liệu khảo sát/không điểm số (`Decimal 0` vs `null`).
   - **Tầng Giao diện (UI Runtime):** Công cụ CUA hiện tại chưa khởi tạo được kernel assets trên môi trường máy chủ Windows, do đó các kịch bản kiểm thử giao diện thực tế trên trình duyệt vẫn giữ trạng thái mở, chưa nghiệm thu.

---

## III. BỘ 10 CA KIỂM THỬ ĐẶC TẢ CHÍNH SÁCH BÀI GIAO (PUBLIC POLICY TEST CASES)

### TC-P01: Bài giao OPEN cho phép khách xem đề sạch khi không có cookie
- **Mã CV:** CV056 / CV058
- **Mức độ:** **Major** (Trải nghiệm học sinh vào thi)
- **Setup:** Bài giao có `status = OPEN`, không gửi bất kỳ cookie nào.
- **Request:** `GET /api/public/assignments/[publicId]`
- **Kết quả mong đợi:** HTTP 200 `{ assignment: { ... }, exam: { ... }, myAttempt: null }`. Không có `correct_answer` hay lời giải trong `exam`.
- **Dấu hiệu lỗi:** Trả về HTTP 403 hoặc để lộ đáp án câu hỏi.

---

### TC-P02: Cookie hỏng hoặc hết hạn (>30d) không biến public view thành 403
- **Mã CV:** CV058 / CV077
- **Mức độ:** **Major** (Tránh chặn học sinh mở đề)
- **Setup:** Bài giao `status = OPEN`. Trình duyệt gửi cookie `exam_attempt_xyz=invalid_signature`.
- **Request:** `GET /api/public/assignments/[publicId]`
- **Kết quả mong đợi:** HTTP 200 với `myAttempt: null`. Server bỏ qua cookie hỏng và cho xem đề công khai như khách.
- **Dấu hiệu lỗi:** Trả về HTTP 403 do kiểm tra cookie cứng nhắc tại trang public view.

---

### TC-P03: Chặn xem thông tin bài giao khi chưa đến giờ mở (Future opensAt)
- **Mã CV:** CV056 / CV058
- **Mức độ:** **Critical** (Chống lộ đề trước giờ thi)
- **Setup:** Bài giao có `opensAt = now + 1 giờ`, `status = OPEN`.
- **Request:** `GET /api/public/assignments/[publicId]`
- **Kết quả mong đợi:** HTTP 403 `{ error: 'Bài thi chưa mở...' }`.
- **Dấu hiệu lỗi:** Trả về HTTP 200 kèm nội dung câu hỏi.

---

### TC-P04: Nộp bài trong khoảng ân hạn 15 giây bù trừ mạng (Submit Grace Period)
- **Mã CV:** CV056 / CV057
- **Mức độ:** **Major** (Chống mất bài do trễ mạng)
- **Setup:** Lượt thi có `deadlineAt = now - 8 giây` (nằm trong khoảng 15s grace).
- **Request:** `POST /api/public/attempts/[id]/submit` kèm đáp án mới và `baseDraftRevision` khớp nháp.
- **Kết quả mong đợi:** HTTP 200; `canAcceptSubmissionAnswers` trả về `true`; đáp án mới trong body được chấp nhận và tính điểm; `status = SUBMITTED`.
- **Dấu hiệu lỗi:** Bị từ chối HTTP 409 do kiểm tra thời gian cứng không có grace period.

---

### TC-P05: Nộp bài sau khoảng ân hạn 15 giây chỉ chốt nháp máy chủ (Late Saved-only Finalization)
- **Mã CV:** CV056 / CV057
- **Mức độ:** **Critical** (Chống gian lận làm bài quá hạn)
- **Setup:** Lượt thi có `deadlineAt = now - 30 giây`. Nháp lưu trên server là `{ q1: 'A' }`.
- **Request:** `POST /api/public/attempts/[id]/submit` với body chứa `{ answers: { q1: 'B' } }`.
- **Kết quả mong đợi:** HTTP 200; `canAcceptSubmissionAnswers` trả về `false`; server bỏ qua `'B'`, chỉ chốt điểm câu trả lời `'A'` từ `attempt.draft`.
- **Dấu hiệu lỗi:** Server chấp nhận đáp án `'B'` nộp muộn sau 30 giây.

---

### TC-P06: Ẩn điểm (showResult: NEVER) bắt buộc phải ẩn bảng xếp hạng
- **Mã CV:** CV059 / CV061
- **Mức độ:** **Critical** (Chống lộ điểm gián tiếp)
- **Setup:** Bài giao có `showResult = 'NEVER'`, `leaderboard = 'TOP_AND_ME'`, `leaderboardReveal = 'IMMEDIATE'`.
- **Request:** `GET /api/public/attempts/[id]/submit` kèm cookie hợp lệ.
- **Kết quả mong đợi:** HTTP 200; `score = null`, `maxScore = null`, `leaderboard = null`.
- **Dấu hiệu lỗi:** `score` bị ẩn nhưng `leaderboard` vẫn hiển thị điểm hoặc thứ hạng của học sinh.

---

### TC-P07: Tính Idempotent khi nộp bài nhiều lần và bảo toàn dữ liệu
- **Mã CV:** CV058 / CV059
- **Mức độ:** **Major** (Toàn vẹn kết quả)
- **Setup:** Bài thi đã nộp thành công, chính sách `showResult = 'AFTER_CLOSE'`, bài đang `OPEN`.
- **Request:** Gửi lại `POST /api/public/attempts/[id]/submit` với đáp án khác.
- **Kết quả mong đợi:** HTTP 200 `{ idempotent: true, score: null, maxScore: null, solutions: null }`. Không cập nhật lại đáp án trong DB; không làm rò rỉ điểm số.
- **Dấu hiệu lỗi:** Ghi đè lại kết quả bài nộp hoặc trả về điểm ở lần gọi thứ hai.

---

### TC-P08: Khảo sát (Survey) lưu null trong DB, không tạo điểm 0 giả
- **Mã CV:** CV062
- **Mức độ:** **Major** (Bảo toàn thống kê giáo dục)
- **Setup:** Bài tập dạng khảo sát (`assessmentMode = 'survey'`). Học sinh nộp bài.
- **Request:** Kiểm tra dữ liệu ghi vào bảng `Attempt` trong cơ sở dữ liệu.
- **Kết quả mong đợi:** Cột `score` và `maxScore` trong DB là `null`. Phản hồi HTTP 200 `{ score: null, maxScore: null, solutions: null, message: 'Phản hồi của em đã được ghi nhận.' }`.
- **Dấu hiệu lỗi:** `Attempt.score` lưu giá trị số `0.00`, làm kéo tụt điểm trung bình thống kê của lớp.

---

### TC-P09: Học sinh bị lưu trữ bị chặn draft, submit và result
- **Mã CV:** CV058 / CV077
- **Mức độ:** **Critical** (Phân quyền thực thể)
- **Setup:** Học sinh có bài thi đang làm dở, sau đó bị đánh dấu lưu trữ (`student.archivedAt = now`).
- **Request:**
  1. `PATCH /api/public/attempts/[id]/draft`
  2. `POST /api/public/attempts/[id]/submit`
  3. `GET /api/public/attempts/[id]/submit`
- **Kết quả mong đợi:** Cả 3 yêu cầu đều trả về HTTP 403 `{ error: 'Không có quyền truy cập lượt làm bài' }`.
- **Dấu hiệu lỗi:** Cho phép học sinh đã bị xóa/lưu trữ tiếp tục ghi nháp hoặc nộp bài.

---

### TC-P10: Lớp học bị lưu trữ trả về 404 cho bài giao
- **Mã CV:** CV058 / CV077
- **Mức độ:** **Critical** (Chặn cửa truy cập)
- **Setup:** Lớp học bị đánh dấu lưu trữ (`group.archivedAt = now`).
- **Request:** `GET /api/public/assignments/[publicId]`
- **Kết quả mong đợi:** HTTP 404 `{ error: 'Bài giao không tồn tại hoặc link không chính xác' }`.
- **Dấu hiệu lỗi:** Trả về HTTP 200 cho phép truy cập bài tập của lớp đã bị giải tán.
