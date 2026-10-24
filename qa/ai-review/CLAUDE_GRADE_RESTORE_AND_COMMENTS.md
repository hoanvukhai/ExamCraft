# Khôi phục điểm từ lịch sử và bộ soạn nhận xét — Claude, 24/10/2026

Task CLAUDE-GRADE-RESTORE-AND-COMMENTS (generation 2), CV060/061. Nhánh `ai/claude-grade-history`, worktree `tmp/ai-claude-grade-history`. Chưa push/merge. Chỉ các commit MỚI sau ca73871:

1. `4473f17` — `src/lib/grade-history-restore.ts`, `tests/grade_history_restore.test.ts`
2. `1a1bdad` — `src/app/api/teacher/attempts/[id]/route.ts`
3. `f3dca22` — `src/components/TeacherGradeEditor.tsx`, `src/app/teacher/assignments/[id]/page.tsx`

Không migration/dependency/schema; không sửa tệp ngoài `allowed_code`.

## 1. Khôi phục (CV060)
- `POST /api/teacher/attempts/{id}` với `{action:"restore", eventId, side:"before"|"after", baseGradeRevision}` (strict). Client **không** gửi điểm/nhận xét; máy chủ đọc lại AuditLog.
- Cùng same-origin, owner, `SUBMITTED`, `FOR UPDATE` trên Attempt, một transaction như chấm tay. Sự kiện phải có `action=attempt.grade`, `targetType=Attempt`, `targetId={id}` (sự kiện của bài khác → 404). `questionKey` trong meta phải còn trong snapshot.
- Trạng thái đích phải đủ 4 trường (`earned`, `manualScore`, `comment`, `isCorrect`) đúng kiểu, nếu không → 422 `HISTORY_STATE_UNUSABLE` và không đổi gì. Kiểm theo giới hạn câu hiện tại: điểm ≤ tối đa, hai chữ số thập phân, `earned = manualScore`, `isCorrect` khớp điểm, bài nhận xét/khảo sát không có điểm số, câu chưa cấu hình điểm không nhận điểm chấm tay.
- Quyết định (`decideRestore`): trạng thái hiện tại **bằng** đích (so sánh nghiêm: chờ chấm ≠ 0 đã chấm, null ≠ chuỗi rỗng, false ≠ null) → 200 `restored:false`, không tạo sự kiện (retry sau mất receipt); khác đích và token nền khớp → ghi; khác và token cũ → 409 `GRADE_CONFLICT`, không tự lấy token mới.
- Ghi: chỉ cập nhật `earned/manualScore/isCorrect/comment` (tạo dòng mới với `response: {}` nếu chưa có), không đụng response học sinh/snapshot/sự kiện cũ. Tổng và `needsGrading` tính lại bằng `summarizeManualGrades`. Sự kiện MỚI `attempt.grade` có `before/after/scoreBefore/scoreAfter` và `restoredFrom:{eventId, side}`.
- Giữ sửa nhỏ của Codex: GET `?historyCursor=` kiểm owner **trước** `decodeGradeHistoryCursor` (cursor hỏng của lượt người khác vẫn 404).

## 2. Bộ soạn điểm/nhận xét (CV060/061)
- `TeacherGradeEditor` thay ô điểm onBlur. Ô điểm + ô nhận xét + nút "Lưu điểm và nhận xét" + "Bỏ thay đổi". **Không gửi khi blur, đóng, đổi bài.**
- Nháp nằm trong state của trang, khóa theo attempt + câu, kèm token nền lúc bắt đầu sửa; không mất khi lỗi mạng, 409, tải thêm lịch sử, tải lại sau lưu/khôi phục (tải lại tại chỗ `handleOpenAttemptDetail(id, true)` không gỡ ô nhập). Token nền đổi ở nơi khác → báo rõ, chặn lưu đè, người dùng chọn "Bỏ bản nhập, dùng giá trị hiện tại".
- Câu đang chờ chấm hiện ô điểm trống; phải nhập điểm rõ (kể cả 0) mới lưu được, nên nhận xét một mình không biến "chờ chấm" thành 0 điểm. Nhận xét không đổi thì không gửi; xóa nhận xét gửi chuỗi rỗng.
- `comment_only/survey`: ẩn điểm, nhận xét bắt buộc, gửi `earned:null` theo hợp đồng hiện tại.
- Đóng khi còn nháp → hộp "Giữ lại và tiếp tục sửa" / "Bỏ thay đổi và đóng"; thêm cảnh báo `beforeunload` khi còn nháp.
- Lịch sử: mỗi dòng có "Xem trước: khôi phục trạng thái trước/sau lần này" (chỉ khi đọc được đủ trạng thái; lịch sử cũ thiếu trường hiện lý do). Xem trước có Hiện tại/Sau khôi phục, nút "Xác nhận khôi phục", "Hủy". Chặn xác nhận nếu câu đang có nháp (có nút bỏ nháp rõ ràng) hoặc token nền đổi từ lúc xem trước. Phản hồi muộn của bài khác bị bỏ.

## Đã chạy (thuần, từ worktree; không build/server/DB/HTTP/UI)
- 3 tệp unit liên quan: 16/16 đạt (restore 8, paging 6, manual_grade_revision 2). Test restore phủ: parse đủ/thiếu/giả/khác câu/sai kiểu (18 ca), null/0/false/rỗng, phạm vi điểm, số thập phân, nhất quán earned/manual/isCorrect, mode nhận xét, retry/conflict/apply, dựng bản gửi (chờ chấm, dấu phẩy, nhận xét không đổi/xóa, survey), nhận biết nháp "bẩn".
- `tsc --noEmit` toàn dự án: không lỗi. ESLint: helper, test, route, TeacherGradeEditor sạch; trang giáo viên đúng 3 errors + 7 warnings kế thừa (không thêm).

## Chưa chạy / giới hạn
- Chưa chạy: HTTP có ghi, PostgreSQL, giao diện thật, build. Logic route (transaction, upsert `comment:null`, Decimal) mới được typecheck, chưa chạy thật.
- **Codex cần kiểm HTTP (DB thử):** (a) restore trước/sau đúng, tạo đúng 1 sự kiện có `restoredFrom`, response/snapshot/tổng bài khác không đổi; (b) retry y hệt → 200 `restored:false`, không thêm sự kiện; (c) token cũ khi trạng thái đã khác → 409, DB không đổi; (d) sự kiện của bài khác/ID bậy → 404; (e) meta cũ thiếu `manualScore/isCorrect` (chèn AuditLog giả) → 422; (f) restore về "chờ chấm" (manualScore null) → `needsGrading` lại true, không thành 0 đã chấm; (g) giáo viên khác → 404; khác origin → 403; bài chưa nộp → 409; (h) GET cursor hỏng của bài người khác → 404.
- **Codex cần kiểm UI:** lỗi/retry khi lưu; phản hồi muộn bài A sau khi mở B; gõ chưa lưu rồi bấm "Xem lịch sử cũ hơn" (ô không mất/không remount); đổi tài khoản giữa chừng; restore từ bản cũ rồi xem nháp câu khác còn nguyên; no-op retry; đóng khi còn nháp; bài comment_only.
- Giới hạn: lưu nhận xét một mình ở câu đã có điểm tự động sẽ ghi điểm hiển thị thành điểm chấm tay cùng giá trị (hành vi sẵn có của API); xem trước "Hiện tại" lấy từ chi tiết bài (không có `manualScore`), nên phân biệt chờ chấm theo `isCorrect===null`; xem trước chưa tính tổng điểm sau khôi phục; không regrade/đổi đáp án, không phân trang kèm khôi phục từ trang lịch sử chưa tải.
