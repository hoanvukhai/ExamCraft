# Tổng hợp bàn giao kỹ thuật — CLAUDE-CONTINUOUS-BATCH (generation 10)

Claude, 24/10/2026. Đây là bảng dẫn đường, không thay báo cáo từng mục và không chép số liệu: loại kiểm và kết quả nằm ở [qa/rebuild-2026-10-24/CLAUDE_BATCH_CHECKS.md](../rebuild-2026-10-24/CLAUDE_BATCH_CHECKS.md). Trạng thái duyệt lấy từ `BATCH_REVIEWS.json` (chỉ Codex ghi) tại lúc viết; có thể đã đổi.

Nhánh `ai/claude-grade-history`, worktree `tmp/ai-claude-grade-history`, base d75bbea. Chưa push/merge. Không có SHA nào bị amend.

## Bảng C01–C05

| Mục | CV | SHA / tệp | Phạm vi | Duyệt (đọc lúc viết) | Báo cáo |
|---|---|---|---|---|---|
| C01 Khóa AI | 011/031/032 | `621e8ff`, `6503df0`, `5857238` · `ApiKeyModal.tsx`, `key-modal-request-context.ts`, test | Cửa sổ khóa ghim theo tài khoản/lần mở, bỏ phản hồi muộn, giữ form, biên nhận thêm khóa hợp lệ, `clientRequestId`, hai lane chung mất tài khoản | RELEASED_FOR_INTEGRATION (Codex giữ) | [CLAUDE_KEY_MODAL_ASYNC](CLAUDE_KEY_MODAL_ASYNC.md) |
| C02 Nháp chấm điểm | 010/060/061 | `fb6819b`, `402635e`, `3481b93` · `teacher-grade-draft.ts`, `TeacherGradeDraftRecovery.tsx`, test | Journal trình duyệt theo giáo viên/lượt/câu/trang, giữ chữ thô, retire chỉ khi đúng request đã gửi, panel chỉ thấy vùng khóa của mình | ACCEPTED_WITH_LIMITS (đóng băng) | [CLAUDE_TEACHER_GRADE_DRAFT](CLAUDE_TEACHER_GRADE_DRAFT.md) |
| C03 Nháp ghi chú AI | 010/064/069 | `674b4f3`, `c518564`, `e29feeb` · `memory-note-draft.ts`, `MemoryNoteDraftRecovery.tsx`, test | Journal trình duyệt theo tài khoản/trang cho ghi chú đang soạn; điền biểu mẫu cần xác nhận; không lưu/gửi gì | ACCEPTED_WITH_LIMITS (đóng băng) | [CLAUDE_MEMORY_NOTE_DRAFT](CLAUDE_MEMORY_NOTE_DRAFT.md) |
| C04 Bản công bố | 030/048 | không có SHA (thiết kế) | Link đã chốt phiên bản trỏ vào `ExamRevision`; expand migration → reader tương thích → bật; fail closed | CHANGES_REQUESTED → đã sửa trong cùng tệp, chờ xem lại | [CLAUDE_PUBLICATION_DESIGN](CLAUDE_PUBLICATION_DESIGN.md) |
| C05 Chấm lại | 059/060/061 | không có SHA (thiết kế) | Tách chỉnh tay / khôi phục / đính chính đáp án / chấm lại; lớp phủ đính chính cộng thêm; xem trước diff; mặc định giữ điểm chấm tay | PENDING lúc viết | [CLAUDE_REGRADE_DESIGN](CLAUDE_REGRADE_DESIGN.md) |

C06 là tệp này. Đợt trước của Claude (restore/template/memory) do Codex đã tích hợp nên không nằm trong bảng.

## Giới hạn chung
- Chỉ unit thuần, `tsc`, ESLint. Chưa có HTTP, DB, giao diện hay trình duyệt thật cho bất kỳ mục code nào; mọi hành vi React (ref, effect, khóa nút, `confirm()`), `localStorage` thật và nhiều tab đều chưa kiểm.
- C02/C03 chỉ tạo helper và component mới, **chưa gắn vào parent**. Journal trình duyệt không mã hóa, không giao dịch nguyên tử, không tự dọn bản của tab đã đóng.
- C04/C05 là thiết kế: không đổi mã, schema hay hồ sơ; không đóng CV nào. Cả hai cần chủ dự án quyết các điểm đã ghi (có mặc định đề xuất).
- Hai chỗ phụ thuộc chéo giữa các tệp mới: `key-modal-request-context.ts` import `MemoryGate` từ `ai-memory-request-context.ts`; `ApiKeyModal.tsx` import hàm từ `template-request-context.ts`.

## Thứ tự tích hợp đề nghị (Codex giữ)
1. C01 (đã release): giữ kiểm HTTP/UI còn lại cho thêm khóa có `clientRequestId`, khóa hai lane.
2. C02 → gắn vào chi tiết chấm điểm: `writerId` mỗi trang, `writeGradeDraft` khi sửa, `retireWriterGradeDraft(sent, ack)` sau 200, `onApply` giữ base cũ; kiểm trình duyệt thật.
3. C03 → gắn vào `AiLearningDialog`: ghi khi sửa, retire bằng đúng nội dung đã gửi, panel khi mở.
4. C04 → chỉ khi chủ dự án chốt 4 điểm; thứ tự bắt buộc: expand migration, reader tương thích, bật tạo/đổi pin.
5. C05 → chỉ khi chủ dự án chốt 6 điểm; thứ tự: bảng cộng thêm, thư viện áp đính chính, route đính chính, route chấm lại, sửa nộp bài chấm theo khóa hiệu lực, giao diện.

## Việc cần Codex
- Quyết định review C04 (đã sửa theo ghi chú) và C05; chuyển quyền hoặc giao thế hệ mới nếu muốn tôi làm tiếp.
- Thêm các test mới vào `test:safe` khi tích hợp (tôi không sửa `package.json`): key modal, teacher grade draft, memory note draft.
- Chạy HTTP/UI/trình duyệt thật theo từng báo cáo; ghi kết quả ở báo cáo nhóm `qa/rebuild-<ngày>/`.
- Cập nhật checklist/hồ sơ 02 khi có bằng chứng; mọi mục ở trên chưa đủ để đóng CV.
