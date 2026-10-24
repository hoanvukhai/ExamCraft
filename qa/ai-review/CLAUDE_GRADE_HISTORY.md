# Phân trang lịch sử chấm — Claude, 24/10/2026

Task CLAUDE-GRADE-HISTORY-PAGING (generation 1), CV060/061. Commit `ca738712aed01604a4d4072733cb9dea33ae8e5b` trên nhánh `ai/claude-grade-history` (worktree `tmp/ai-claude-grade-history`, từ 83d4a95). Chưa push/merge.

## Thay đổi
- `src/lib/grade-history-pagination.ts` (mới): mã hóa/giải mã cursor, điều kiện truy vấn, cắt trang. Không migration/dependency.
- `src/app/api/teacher/attempts/[id]/route.ts`: GET dùng helper; thêm `historyNextCursor`.
- `src/app/teacher/assignments/[id]/page.tsx`: nút "Xem lịch sử cũ hơn".
- `tests/grade_history_pagination.test.ts` (mới, chưa có trong script `test:safe` của package.json vì ngoài phạm vi; Codex thêm khi tích hợp).

## Hợp đồng cursor
- Sắp xếp `createdAt desc, id desc`; mỗi trang 50, đọc 51 dòng để biết còn nữa.
- Cursor = base64url(JSON{a: attemptId, t: createdAt ISO ms, i: id}) của dòng cuối trang đã hiện. Trang kế lấy `createdAt < t` hoặc (`createdAt = t` và `id < i`), nên timestamp trùng không lặp/sót, dòng mới (mới hơn) không ảnh hưởng trang cũ.
- `GET /api/teacher/attempts/{id}` không cursor: như cũ (50 dòng, `historyHasMore`) và thêm `historyNextCursor` (null nếu hết).
- `GET ...?historyCursor=<c>`: sau xác thực và kiểm chủ bài (404 nếu không phải của giáo viên), chỉ trả `{gradingHistory, historyHasMore, historyNextCursor}`, không dựng lại đề/câu hỏi. Truy vấn luôn ghim `action=attempt.grade, targetType=Attempt, targetId={id}`.
- Cursor sai định dạng, ngày không chuẩn, thiếu trường hoặc cấp cho bài khác → 400 `HISTORY_CURSOR_INVALID`; không đoán, không đọc lượt khác. AuditLog cũ không bị sửa.

## UI
- Chỉ gọi thêm khi bấm nút. Có "Đang tải...", lỗi hiện tại chỗ và nút đổi thành "Thử lại". Dòng mới nối vào state riêng, không đụng `attemptDetail`/ô điểm đang nhập, không tự chấm.
- Mở bài khác, đóng, hoặc tải lại bài sau khi lưu điểm (luồng sẵn có `handleOpenAttemptDetail`) đều đặt lại trạng thái lịch sử cũ và bỏ phản hồi muộn (bộ đếm yêu cầu + kiểm bài đang chọn). CAS điểm và guard phản hồi muộn của chi tiết không đổi.

## Đã chạy (từ worktree, không DB/server/build)
- Unit `tests/grade_history_pagination.test.ts`: 6/6 đạt. Dùng một "DB giả" độc lập (tự lọc/sắp xếp theo where) để so sánh: timestamp trùng nhiều dòng với cỡ trang 1–12, ghi điểm mới giữa hai lần tải, đúng 50 dòng/51 dòng, cursor giả/đổi bài/sai kiểu. Thử phá điều kiện (`lt`→`lte`) thì 4/6 ca fail.
- `tsc --noEmit` toàn dự án: không lỗi. ESLint route, helper, test: sạch. ESLint trang giáo viên: vẫn đúng 3 errors + 7 warnings kế thừa từ trước (2 any, 1 setState trong effect), không thêm mới.

## Chưa chạy / giới hạn
- Chưa có HTTP thật trên DB thử (cursor trên PostgreSQL, giáo viên khác → 404, cursor bài khác → 400) và chưa kiểm UI thật (bấm nút, lỗi/thử lại, đổi bài giữa chừng): cần Codex chạy sau tích hợp.
- So sánh `id < i` dùng collation DB, cùng collation với `orderBy id`; unit dùng so sánh chuỗi nên chưa chứng minh trên PostgreSQL.
- Không làm khôi phục điểm, regrade, rubric hay nhật ký học sinh.
