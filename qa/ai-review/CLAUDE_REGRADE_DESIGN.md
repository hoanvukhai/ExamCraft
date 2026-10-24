# Thiết kế chấm lại / đính chính có xem trước — Claude, C05 (CV059/060/061)

Chỉ đọc và thiết kế; không code, không schema thật, không migration. Đã đọc: `lib/attempt-grading.ts` (`gradeSnapshot`), `lib/manual-grading.ts` (`manualGradeTarget`, `summarizeManualGrades`), `lib/manual-grade-revision.ts`, `api/teacher/attempts/[id]` (GET/POST/restore), `lib/grade-history-restore.ts`, đoạn nộp bài `api/public/attempts/[id]/submit`, `Attempt`/`AttemptAnswer`/`Assignment` trong schema, và [CLAUDE_GRADE_RESTORE_AND_COMMENTS](CLAUDE_GRADE_RESTORE_AND_COMMENTS.md). Không thiết kế lại phần đã có; mọi thứ dưới đây dùng lại khóa hàng, token nền (`gradeRevision`) và nhật ký `attempt.grade` hiện có.

## 1. Bốn thao tác khác nhau

| Thao tác | Việc nó làm | Đổi gì | Hiện có |
|---|---|---|---|
| **Chỉnh điểm tay** | Giáo viên đặt điểm/nhận xét cho một câu của một lượt | `AttemptAnswer` (+ tổng lượt) | Có (CAS bằng `baseGradeRevision`) |
| **Khôi phục lịch sử** | Đưa một câu về trạng thái trước/sau của một sự kiện | `AttemptAnswer` bằng sự kiện **mới** | Có |
| **Đính chính đáp án** | Sửa "đáp án đúng" của bài giao (dữ liệu về bài giao) | Một bản đính chính mới của bài giao; **chưa đổi điểm ai** | Chưa |
| **Chấm lại có chủ đích** | Áp một bản đính chính lên các lượt/câu giáo viên chọn, sau khi xem diff | `AttemptAnswer` bằng sự kiện **mới** | Chưa |

Tách đính chính khỏi chấm lại vì giáo viên có thể sửa khóa trước, xem ai bị ảnh hưởng rồi mới chấm lại từng nhóm; và vì "sửa đáp án" không được tự động làm đổi điểm đã công bố cho học sinh.

## 2. Nguyên tắc cứng
- `Assignment.snapshot` **không bao giờ bị sửa** (nó là bằng chứng của bài đã làm). Đính chính là **lớp phủ cộng thêm**, đọc ra "khóa hiệu lực" = snapshot + các bản đính chính theo thứ tự. Sửa câu trong ngân hàng/đề gốc không chạm bài đã giao.
- Chấm lại **không đụng** `response` của học sinh, snapshot, hay lịch sử cũ; nó chỉ ghi `isCorrect/earned` (tự động) và tạo sự kiện mới.
- Điểm chấm tay là lựa chọn tường minh của giáo viên: mặc định **giữ**; chỉ ghi đè khi giáo viên chọn đúng chế độ đó và thấy từng dòng bị ghi đè.
- Mọi thao tác ghi đều: chủ bài + same-origin + ghim tài khoản (`requireRequestAuth`), `clientRequestId`, khóa hàng, token nền, `AuditLog`, và hoàn tác bằng sự kiện mới (không xóa lịch sử).

## 3. Dữ liệu (≤ 2 phương án, chọn A)

**A — bảng cộng thêm `AssignmentKeyRevision`**: `id, assignmentId, revision Int (unique với assignmentId), changes Json, note, createdById, createdAt, clientRequestId (unique theo assignment)`. Không thêm cột vào `Attempt`/`AttemptAnswer`. "Lượt cần chấm lại" suy ra bằng **tính lại** (so điểm tự động đã lưu với điểm tính theo khóa hiệu lực), không cần cờ.
**B — một cột Json `Assignment.keyCorrections`** (mảng bản đính chính) + `AuditLog`. Ít bảng hơn nhưng khó khóa/idempotent từng bản và dễ ghi đè cả mảng khi hai giáo viên đính chính cùng lúc.

Chọn **A**: unique `(assignmentId, revision)` cho CAS tự nhiên, `clientRequestId` cho retry. `changes` chỉ cho phép trường **khóa đáp án** (v1): `correct`/`correct_answer` (trắc nghiệm), `accepted_answers` (ngắn/điền), `sub_questions[].isCorrect` (đúng/sai), `matchingPairs`, `correctOrder`. Không đổi nội dung câu, điểm tối đa, phần, hình, rubric.

Hàm thuần mới (`applyKeyCorrections(snapshot, revisions)`) dựng snapshot hiệu lực rồi **dùng nguyên `gradeSnapshot`** — không viết lại chấm điểm.

## 4. Quy tắc theo trạng thái từng câu (chấm lại)

| Trạng thái đã lưu | Chấm lại làm gì |
|---|---|
| Tự động (`manualScore = null`, `isCorrect` đúng/sai) | Tính lại theo khóa hiệu lực; đổi `isCorrect/earned` nếu khác; ghi sự kiện |
| **Chấm tay** (`manualScore ≠ null`) | **Giữ** (mặc định). Chế độ `replace_selected`: chỉ ghi đè các dòng giáo viên tích chọn trong bản xem trước, `manualScore` về `null`, `earned/isCorrect` theo tự động |
| **Chờ chấm** (`manualScore = null`, `isCorrect = null`) | Không đổi; **không bao giờ thành 0** |
| Bỏ trống (`response = null`) | Tính theo `gradeSnapshot` (như nộp bài); hiển thị khác với "0 đã chấm" |
| 0 điểm đã chấm tay / `isCorrect=false` | Phân biệt với `null`; giữ theo quy tắc chấm tay |
| Bài `survey` / `comment_only` / `rubric` | **Không áp dụng**: API trả 409 `NOT_APPLICABLE`, giao diện ẩn; rubric chỉ chấm tay |
| Câu đã bị gỡ khỏi snapshot / chưa cấu hình điểm | Bỏ qua, báo trong kết quả, không đoán |

Tổng điểm và `needsGrading` tính lại bằng `summarizeManualGrades` (như chấm tay). Đáp án bị đổi chỉ ảnh hưởng đúng các câu được chọn; câu/lượt khác không đụng.

## 5. Hợp đồng API nhỏ (đề xuất)
1. `POST /api/teacher/assignments/{id}/key-corrections`
   - `{ action:'preview', changes:[{questionKey, field, value}], baseKeyRevision }` → **không ghi**; trả khóa hiệu lực mới của các câu bị sửa và danh sách **lượt/câu sẽ đổi điểm nếu chấm lại** (đếm + mẫu), cùng `previewDigest`.
   - `{ action:'create', changes, baseKeyRevision, note, clientRequestId }` → khóa hàng Assignment, kiểm `baseKeyRevision` là bản mới nhất (409 `KEY_CONFLICT` nếu đã có bản mới hơn), tạo `revision+1`, `AuditLog`. **Không đổi điểm.** Gửi lại cùng mã → trả đúng bản đã tạo (`replayed`); cùng mã khác nội dung → 409.
2. `POST /api/teacher/assignments/{id}/regrade`
   - `{ action:'preview', keyRevision, attempts: 'all_submitted' | [id…], questionKeys?: [...], manualPolicy:'keep'|'replace_selected' }` → bảng diff từng (lượt, câu): `before/after` (điểm, `isCorrect`, nguồn tự động/chấm tay), cờ "chấm tay (sẽ giữ)" hoặc "sẽ ghi đè", cùng `gradeRevision` của từng câu và `previewDigest`.
   - `{ action:'apply', previewDigest, replace:[{attemptId, questionKey}], clientRequestId }` → mỗi lượt một transaction: khóa `Attempt` (cùng thứ tự khóa chấm tay/khôi phục), đọc lại trạng thái, **so token nền đúng như bản xem trước**; lượt nào có câu đã đổi (chấm tay/khôi phục/nộp muộn) → **bỏ qua lượt đó** và liệt kê `conflict` (không áp dụng một phần trong lượt, không tự lấy token mới). Ghi sự kiện `attempt.grade` có thêm `regrade:{runId, keyRevision, policy}` (cùng hình `before/after/scoreBefore/scoreAfter` để **công cụ khôi phục hiện có hoàn tác được**). Tính lại tổng. Trả `applied/conflict/skipped/noop` theo lượt.
   - Idempotent: dòng đã đúng kết quả mới → `noop`, không thêm sự kiện; `runId` = hash(assignment, keyRevision, tập dòng, policy) nên gửi lại cùng mã không nhân đôi.
3. (v2) `POST …/regrade { action:'rollback', runId }` → tạo sự kiện khôi phục mới cho từng lượt mà trạng thái hiện tại vẫn bằng đúng `after` của lần chạy đó; lượt đã bị sửa tiếp thì `conflict`. Trước mắt có thể dùng nút "Khôi phục" từng câu đã có.

## 6. Giao diện (nhỏ, không phải nền tảng mới)
- Trong chi tiết câu của bài giao: nút "Đính chính đáp án" → form chỉ hiện trường khóa của loại câu → "Xem trước ảnh hưởng" (có số lượt/câu đổi, mẫu 20 dòng) → xác nhận. Sau khi tạo: biểu ngữ "Đáp án đã đính chính (bản N). {k} lượt chưa chấm lại".
- "Chấm lại…": chọn lượt (tất cả đã nộp / chọn), chọn câu, chính sách chấm tay (mặc định **Giữ**), xem bảng diff (tách khối "Sẽ đổi", "Giữ vì chấm tay", "Sẽ ghi đè" có ô tích từng dòng), gõ lại số dòng sẽ đổi để xác nhận, kết quả theo lượt, nút mở lịch sử/khôi phục.
- Bản nháp chọn lựa không tự gửi; lỗi/409 giữ nguyên lựa chọn; phản hồi muộn của bài khác bị bỏ (cùng khuôn token đã dùng ở các cửa sổ khác).

## 7. Tranh chấp và thứ tự khóa
Thứ tự đề xuất: **Assignment (chỉ khi tạo bản đính chính) → Attempt → AttemptAnswer (so token)**. Giữ nguyên rằng mọi thao tác đổi điểm một lượt khóa `Attempt FOR UPDATE`.
- *Chấm tay/khôi phục vs chấm lại*: cùng khóa Attempt nên tuần tự; ai đến sau thấy trạng thái mới; chấm lại có token cũ → `conflict` cho lượt đó, chấm tay đến sau thấy 409 `GRADE_CONFLICT` như hiện nay.
- *Nộp bài vs đính chính*: nộp bài đọc bản đính chính mới nhất (đọc Assignment cùng transaction, khóa chia sẻ); nếu bản đính chính commit sau, lượt đó hiện "chưa chấm lại" (tính lại ≠ đã lưu), không mất dữ liệu.
- *Hai đính chính cùng lúc*: unique `(assignmentId, revision)` + `baseKeyRevision` → một thắng, một 409 `KEY_CONFLICT`.
- *Chấm lại hai lần song song*: cùng `runId` → một thắng, một `noop`; khác tập dòng → tuần tự theo từng lượt.
- *Đóng bài / lượt đã nộp*: chỉ lượt `SUBMITTED` mới chấm lại (như chấm tay); lượt `IN_PROGRESS/EXPIRED` bị bỏ qua và báo.

## 8. Chính sách công bố độc lập
Đính chính/chấm lại **không đổi** chính sách hiển thị đáp án hay kết quả cho học sinh và **không** thay đổi bản công bố đã chốt ở C04 (link đã pin giữ đúng bản). Giao diện nhắc "bản chia sẻ đã chốt v N chưa có đính chính; công bố bản mới nếu cần". Điểm học sinh nhìn thấy chỉ đổi theo chính sách xem kết quả đã có của bài giao (không thêm cờ mới ở đợt này).

## 9. Ca nghiệm thu đề xuất
Unit thuần (hàm áp đính chính + hàm so diff): chờ chấm giữ `null`; 0 chấm tay ≠ chờ chấm; bỏ trống; `false` ≠ `null`; từng loại câu (MC, đúng/sai theo tiến trình điểm, ngắn/điền chuẩn hóa dấu phẩy, ghép, sắp xếp); trường không cho phép bị từ chối; survey/comment_only không áp dụng; `runId` ổn định.
HTTP (DB thử): tạo bản đính chính không đổi điểm ai; xem trước không ghi; `KEY_CONFLICT`; retry cùng mã; chấm lại giữ điểm tay / ghi đè đúng dòng được chọn; lượt bị sửa tay giữa xem trước và áp dụng → `conflict` và không đổi; áp dụng lần hai → `noop`; sự kiện có `before/after` và **khôi phục từ sự kiện chấm lại** đưa về đúng trạng thái; tổng/`needsGrading`; lượt khác không đổi; giáo viên khác 404; ngân hàng sửa không đổi bài giao; nộp bài song song với tạo bản đính chính.
Giao diện: xem trước đủ ba nhóm dòng; xác nhận bằng số dòng; mất mạng/409 giữ lựa chọn; phản hồi muộn bài A sau khi mở bài B; hai tab chấm lại cùng bài.

## 10. Tệp cần thay và thứ tự tích hợp (Codex giữ)
1. `prisma/schema.prisma` + migration cộng thêm bảng `AssignmentKeyRevision` (sau sao lưu/restore thử).
2. `src/lib/assignment-key-correction.ts` (mới): áp đính chính, dựng diff, `runId`, kiểm trường; unit thuần.
3. `api/teacher/assignments/[id]/key-corrections/route.ts`, `…/regrade/route.ts` (mới) + dùng lại `manualGradeRevision/summarizeManualGrades`.
4. `api/public/attempts/[id]/submit/route.ts`: chấm theo khóa hiệu lực (thay đổi nhỏ, có test hồi quy).
5. Chi tiết bài/đáp án chuẩn ở `api/teacher/attempts/[id]` hiển thị khóa hiệu lực.
6. UI (trang bài giao của giáo viên) và test HTTP/UI.
7. Chỉ khi đó cập nhật hiện trạng CV059/060/061.

## 11. Rollout cộng thêm và đường lui
Sao lưu trước; migration chỉ `CREATE TABLE`; không backfill; mã chấp nhận bảng rỗng (khóa hiệu lực = snapshot). Đường lui: ngừng dùng bảng và hai route mới → mọi thứ như hiện tại; sự kiện chấm lại đã ghi vẫn khôi phục được bằng công cụ có sẵn; không xóa dữ liệu nào.

## 12. Cần chủ dự án quyết (kèm mặc định đề xuất)
1. **Có cho đính chính điểm tối đa/điểm thành phần không?** Mặc định: **không** ở v1 (chỉ khóa đáp án); đổi điểm tối đa là việc riêng vì ảnh hưởng tổng và công bố.
2. **Điểm chấm tay khi chấm lại:** mặc định **giữ**; ghi đè chỉ khi giáo viên tích từng dòng.
3. **Lượt nộp sau khi có bản đính chính** dùng khóa mới ngay (mặc định có); lượt đã nộp trước đó chỉ đổi khi giáo viên chấm lại.
4. **Bài đã đóng** vẫn cho đính chính/chấm lại? Mặc định có, kèm cảnh báo, vì thường chỉ phát hiện sai khóa sau khi đóng.
5. **Rubric/nhận xét:** mặc định chấm lại không áp dụng (chỉ chấm tay); thiết kế riêng nếu cần chấm rubric tự động.
6. **Học sinh thấy điểm mới ra sao** (thông báo/ẩn): mặc định không thêm gì ngoài chính sách xem kết quả hiện có.

## 13. Chưa đủ nguồn / không làm ở đây
- Chưa đọc chi tiết UI trang bài giao nên chưa chốt chỗ gắn nút; chưa đo số lượt thực tế nên chưa biết cần phân trang bản xem trước (đề xuất giới hạn 200 dòng hiển thị + tổng).
- Chưa thiết kế đính chính nội dung câu, thay phiên bản đề, hay chấm lại hàng loạt đa bài.
- Không tự chốt thay chủ dự án các mục ở phần 12; không đóng CV nào chỉ từ tài liệu này.
