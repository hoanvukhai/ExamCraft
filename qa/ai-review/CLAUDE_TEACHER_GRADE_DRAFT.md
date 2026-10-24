# Nháp chấm điểm/nhận xét có đường khôi phục — Claude, C02 (CV010/060/061)

Nhánh `ai/claude-grade-history`, worktree `tmp/ai-claude-grade-history`. Chưa push/merge. Commit MỚI sau 6503df0, theo thứ tự:

1. `fb6819b` — `src/lib/teacher-grade-draft.ts`, `tests/teacher_grade_draft.test.ts` *(bản nộp đầu)*
2. `402635e` — `src/components/TeacherGradeDraftRecovery.tsx` *(bản nộp đầu)*
3. `3481b93` — sửa theo review CHANGES_REQUESTED (cả ba tệp, commit mới, không amend)

Chỉ tạo tệp mới; không đụng `TeacherGradeEditor`, `page.tsx`, route, schema, package, journal học sinh. Parent do Codex nối. Không DB/build/server/provider.

## Hợp đồng đề xuất (helper)
Ngữ cảnh `{ teacherId, attemptId, questionKey }` + `writerId` (mỗi trang/tab một mã, parent tạo bằng `crypto.randomUUID()` khi mount).
- Khóa lưu: `examcraft:teacher-grade-draft:v1:<teacher>:<attempt>:<question>:<writer>` (từng thành phần `encodeURIComponent`, nên `a:b` không đụng `a`+`b`).
- Bản ghi: `{ v:1, teacherId, attemptId, questionKey, writerId, baseRevision, score, comment, rubric, savedAt }`. `score` là **chuỗi đúng như gõ** (`''`, `'0'`, `'1,5'`, `'abc'` khác nhau); `rubric` là trạng thái mờ của parent hoặc `null`; `baseRevision` là `gradeRevision` lúc bắt đầu sửa.
- `readGradeDrafts(getStorage, teacherId, attemptId, questionKey?)` → `{ entries, unavailable }`. Mục có `value` chỉ khi khóa khớp đúng các trường trong bản ghi (bản chép sang khóa khác, hỏng, quá 256 KB, sai kiểu → chỉ còn `raw`, không áp dụng, không xóa).
- `writeGradeDraft(getStorage, ctx, writerId, { baseRevision, score, comment, rubric? })` → `'saved' | 'unavailable' | 'blocked' | 'too_large' | 'invalid'`. Chỉ ghi vào ô của chính trang này; ô đó đang chứa dữ liệu không đọc được thì `'blocked'`, không ghi đè.
- `retireWriterGradeDraft(getStorage, ctx, writerId, sent, ack)` với `sent = { baseRevision, score, comment, rubric? }` (đúng request đã gửi: token nền và chữ thô đã gõ) và `ack = { manualScore, comment, rubric? }` (cái máy chủ vừa xác nhận) → xóa **chỉ ô của trang này** và **chỉ khi cả hai đúng**: bản ghi bằng đúng `sent` (cùng `baseRevision`, cùng chữ thô, cùng rubric) và máy chủ đang giữ đúng nội dung đó (`'1,75'` = 1.75; `''` = chờ chấm ≠ 0 đã chấm; `'abc'` không bao giờ bằng điểm nào; nhận xét `null` ≡ `''`; rubric chưa có ở máy chủ thì giữ). Nháp đã sang nền mới (B) với cùng chữ không bị ACK của yêu cầu nền cũ (A) xóa; gõ thêm sau khi gửi cũng được giữ.
- `discardWriterGradeDraft(...)` khi giáo viên bấm bỏ nháp; không đụng ô của trang khác hay bản không đọc được.
- `gradeDraftsForOpen(entries, teacherId, attemptId)` (lọc theo vùng khóa của đúng giáo viên và lượt, kể cả bản không đọc được; panel gọi hàm này nên props cũ không lộ byte của tài khoản/lượt khác) và `canApplyGradeDraft(open, currentRevisions, record)` → `same_base` | `stale_base` | không cho (`foreign` khác tài khoản/lượt, `question_missing`). `exportGradeDraft(entry, index)` trả đúng byte `raw`; tên tệp không chứa mã tài khoản. `parseScoreText` để parent hiển thị blank/số/invalid.

## Props component `TeacherGradeDraftRecovery`
`teacherId, attemptId, entries, unavailable?, writeStatus?, currentRevisions, questionLabel?, writerId?, disabled?, onApply(record, mode)`. Chỉ đọc, xem, đối chiếu, chọn, tải; không gọi server, không tự áp dụng. Bỏ qua mục của tài khoản/lượt khác (lớp phòng thủ thứ hai). Hiển thị rõ: đây là bản dự phòng trên trình duyệt dùng chung máy, **không mã hóa**; điểm "chưa nhập" ≠ 0; bản dựa trên điểm cũ chỉ để đối chiếu; lưu trữ bị chặn/đầy/bản cũ chặn ghi thì báo ngay.

## Hướng mount/CAS (Codex nối vào parent, chưa làm)
1. Parent giữ `writerId` (ref, tạo một lần) và gọi `writeGradeDraft` khi nháp của câu đổi và `isGradeDraftDirty` (debounce ngắn); ghi `writeStatus` để hiện cảnh báo.
2. Sau khi `POST` chấm trả 200, trước khi xóa nháp trong state gọi `retireWriterGradeDraft(getStorage, ctx, writerId, sent, ack)` với `sent` = `{ baseRevision: draft.base đã gửi, score: chuỗi thô đã gửi, comment: chuỗi đã gửi }` và `ack` = `{ manualScore: số đã gửi, comment: chuỗi đã gửi hoặc null }`, rồi mới tải lại chi tiết; khi giáo viên bấm "Bỏ thay đổi" gọi `discardWriterGradeDraft`. Không xóa khi 409/mạng lỗi.
3. Khi mở bài: `readGradeDrafts(...)` → truyền `entries` và `currentRevisions` (questionKey → `gradeRevision`) cho panel. `onApply(record, mode)`: dựng nháp `{ score: record.score, comment: record.comment, base: record.baseRevision }` (**giữ base cũ**, không thay bằng base hiện tại) rồi để `TeacherGradeEditor` hiện cảnh báo "đã đổi ở nơi khác" và chặn lưu khi `stale_base`. Máy chủ vẫn là CAS cuối cùng.
4. Panel nên đặt `key={teacherId + attemptId}` và chỉ mount khi tài khoản đã ghim. Parent kiểm lại `selectedAttempt` khi nhận callback.

## Đã chạy (thuần, từ worktree)
- `tests/teacher_grade_draft.test.ts` (kết quả và log: `qa/rebuild-2026-10-24/CLAUDE_BATCH_CHECKS.md`): khóa không đụng nhau; raw trống/0/`1,5`/invalid/xuống dòng/rubric null so với `{}` khôi phục đúng; tài khoản/lượt/câu khác không thấy, bản chép sang khóa khác không tin; hai trang không xóa nhau; ACK đúng/gõ thêm/chờ chấm so với 0/invalid/rubric; storage bị chặn/đầy/JSON hỏng/legacy/quá lớn không throw và không xóa dữ liệu hỏng; `canApplyGradeDraft` cả năm kết quả (kể cả thuộc tính kế thừa); export giữ đúng byte.
- `tsc --noEmit` toàn dự án không lỗi; ESLint 3 tệp sạch.

## Chưa chạy / giới hạn
- Sửa theo review: (1) lọc vùng khóa (xem trên); (2) hợp đồng `retire` mới có `sent`; (3) `writeGradeDraft` bắt lỗi tuần tự hóa (rubric vòng/BigInt) và trả `'invalid'`, không chạm storage; `parseScoreText` chỉ trả số khi hữu hạn.
- Chưa chạy giao diện, HTTP, trình duyệt thật (chưa kiểm localStorage thật, nhiều tab thật, đóng tab đột ngột). Component mới qua typecheck/lint.
- `localStorage` không giao dịch nguyên tử: hai trang cùng ghi một ô (cùng `writerId`) có thể ghi đè nhau; thiết kế dựa vào mỗi trang một `writerId`. Không có dọn tự động bản cũ (chỉ ACK đúng hoặc bỏ tay); bản của tab đã đóng sẽ còn cho đến khi người dùng bỏ.
- Rubric hiện chưa có UI chấm nên `rubric` chỉ là chỗ chờ (mờ, so khớp bằng `stableJson`); parent chưa dùng thì truyền `null`.
- Xóa khi giáo viên lưu thành công phụ thuộc parent gọi `retireWriterGradeDraft` đúng thời điểm; nếu quên, bản cũ chỉ còn để đối chiếu (không tự áp dụng).
