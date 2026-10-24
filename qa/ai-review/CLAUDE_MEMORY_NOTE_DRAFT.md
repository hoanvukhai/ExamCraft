# Nháp ghi chú AI riêng có khôi phục — Claude, C03 (CV010/064/069)

Nhánh `ai/claude-grade-history`, worktree `tmp/ai-claude-grade-history`. Chưa push/merge. Commit MỚI sau 5857238, theo thứ tự:

1. `674b4f3` — `src/lib/memory-note-draft.ts`, `tests/memory_note_draft.test.ts`
2. `c518564` — `src/components/MemoryNoteDraftRecovery.tsx`
3. `e29feeb` — áp dụng nguyên tắc review của C02: `noteDraftsForOwner` lọc theo vùng khóa của tài khoản (kể cả bản không đọc được), panel dùng hàm này

Chỉ tạo tệp mới; không sửa `AiLearningModal`, route, helper memory đã tích hợp hay journal khác. Đã đọc `AiLearningModal` ở root hiện tại (form dùng `draftRef`/`editDraft`/`shouldClearDraft`, ghim theo `ownerId`) để khớp hợp đồng; không chép bản worktree cũ. Không DB/build/server/provider.

## Hợp đồng helper
- Phạm vi: **một tài khoản (`ownerId`) × một trang (`writerId`) × ngữ cảnh `manual-note`**. Khóa: `examcraft:memory-note-draft:v1:<owner>:manual-note:<writer>` (từng thành phần `encodeURIComponent`).
- Bản ghi: `{ v:1, context:'manual-note', ownerId, writerId, title, insight, category, subject, savedAt }` — chữ giữ đúng như gõ (khoảng trắng, xuống dòng, ký tự giống markup). Không có khóa API, cookie, hay dữ liệu tài khoản khác.
- `readNoteDrafts(getStorage, ownerId)` → `{ entries, unavailable }` (mọi bản của tài khoản này). Mục có `value` chỉ khi khóa khớp đúng `ownerId/writerId` trong bản ghi; bản chép sang khóa tài khoản khác, hỏng, sai kiểu, quá 64 KB → chỉ còn `raw`, không áp dụng, không xóa.
- `writeNoteDraft(getStorage, ownerId, writerId, fields)` → `'saved' | 'empty' | 'unavailable' | 'blocked' | 'too_large' | 'invalid'`. Biểu mẫu chưa có tiêu đề lẫn nội dung → `'empty'`, không ghi và **không xóa** bản cũ (xóa trắng không bao giờ xóa bản dự phòng). Ô của chính trang đang chứa dữ liệu không đọc được → `'blocked'`, không ghi đè.
- `retireWriterNoteDraft(getStorage, ownerId, writerId, saved)`: sau khi máy chủ xác nhận ghi chú, xóa **chỉ ô của trang này** và **chỉ khi** bản ghi bằng đúng ghi chú đã lưu (tiêu đề/nội dung so sau `trim` vì máy chủ trim; nhóm và môn so đúng). Gõ thêm sau khi bấm Lưu → khác → giữ; bản của trang/tab khác không bị đụng.
- `discardNoteDraftEntry(getStorage, ownerId, entry)`: giáo viên bấm bỏ một bản trong panel; chỉ xóa bản đọc được của đúng tài khoản và chỉ khi byte lưu vẫn bằng đúng cái panel đã hiện (trang khác vừa ghi lại thì không xóa). Bản không đọc được không bao giờ bị xóa.
- `canApplyNoteDraft(ownerId, record, form)` → `fill_empty` (biểu mẫu trống/chỉ khoảng trắng), `replace_existing` (đang có chữ → cần xác nhận), hoặc không cho (`foreign`). Chỉ **điền biểu mẫu** — chưa phải ghi chú trên máy chủ. `isKnownNoteCategory`: nhóm lạ hiện đúng như đã lưu, không đổi thầm sang nhóm khác. `exportNoteDraft`: đúng byte `raw`, tên tệp không chứa mã tài khoản.

## Props `MemoryNoteDraftRecovery`
`ownerId, entries, unavailable?, writeStatus?, form, writerId?, disabled?, onApply(record, mode), onDiscard?(entry)`. Chỉ đọc/chọn/tải/bỏ; không gọi máy chủ hay AI, không tự áp dụng. Bỏ qua bản của tài khoản khác. Ghi rõ: bản dự phòng trên trình duyệt dùng chung máy, **không mã hóa**, chưa phải ghi chú, không tự bật/góp chung. `replace_existing` có `confirm()` trước khi gọi `onApply`; "Bỏ bản nháp này" cũng hỏi.

## Hướng mount vào `AiLearningDialog` (Codex nối sau, chưa làm)
1. `writerId` = ref tạo một lần khi mount dialog (`crypto.randomUUID()`); dialog đã `key` theo owner nên mỗi tài khoản/lần mở là một ngữ cảnh.
2. Khi `editDraft` đổi, debounce ngắn gọi `writeNoteDraft(() => localStorage, ownerId, writerId, draftRef.current)` và giữ `writeStatus` để panel cảnh báo.
3. Trong `handleCreateManualRule`, sau khi biên nhận hợp lệ (`parseSavedMemory`) và trước/sau `shouldClearDraft`: gọi `retireWriterNoteDraft(..., sent)` với **đúng nội dung đã gửi** (`sent`), không phải `draftRef.current` hiện tại — nhờ vậy chữ gõ thêm sau khi bấm Lưu vẫn còn bản dự phòng. Không retire khi lỗi hoặc khóa phiên.
4. Khi mở dialog (và khi ghim xong tài khoản): `readNoteDrafts` → `entries`; `onApply` gọi `editDraft(record fields)` (tiêu đề/nội dung/nhóm/môn); `onDiscard` gọi `discardNoteDraftEntry` rồi đọc lại. Panel chỉ mount khi tài khoản đã xác nhận.
5. Không đổi `clientRequestId`: nội dung khôi phục vào form là một nội dung mới nên mã yêu cầu theo nội dung vẫn đúng.

## Đã chạy (thuần, từ worktree)
- `tests/memory_note_draft.test.ts` (kết quả và log: `qa/rebuild-2026-10-24/CLAUDE_BATCH_CHECKS.md`): khóa không đụng nhau; bản của tài khoản A không hiện/áp dụng/xóa được cho B (kể cả bản chép sang khóa B); chữ khôi phục đúng byte; biểu mẫu trống không ghi và không xóa bản cũ; hai trang tách bạch; biên nhận muộn không xóa chữ gõ sau (tiêu đề/nhóm/môn/nội dung đổi), `trim` khớp ghi chú đã lưu; storage bị chặn/đầy/JSON hỏng/sai kiểu/ghi đè khóa khác/quá lớn không throw và không xóa dữ liệu hỏng; bỏ bản không xóa nội dung vừa bị ghi lại; điền biểu mẫu cần xác nhận khi đang có chữ; export giữ byte.
- `tsc --noEmit` toàn dự án không lỗi; ESLint 3 tệp sạch.

## Chưa chạy / giới hạn
- Chưa chạy giao diện, trình duyệt thật (localStorage thật, nhiều tab, đóng tab đột ngột), HTTP. Component mới qua typecheck/lint.
- `localStorage` không giao dịch nguyên tử; hai trang cùng `writerId` có thể ghi đè nhau (mỗi trang một `writerId`). Không dọn tự động bản của tab đã đóng: chỉ ACK đúng hoặc giáo viên bấm bỏ.
- Chỉ ngữ cảnh `manual-note` (tạo mới). Chưa hỗ trợ nháp khi sửa ghi chú có sẵn (giao diện hiện chưa có sửa nội dung).
- Gợi ý (không làm vì C02 đã nộp): C02 chưa có nút "bỏ bản của trang khác" như C03; nếu Codex muốn đồng nhất, thêm sau bằng commit riêng.
