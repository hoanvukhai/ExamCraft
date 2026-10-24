# Quản lý khóa AI: đúng tài khoản, giữ form, bỏ phản hồi muộn — Claude, C01 (task8 trong batch10)

CV011/031/032. Nhánh `ai/claude-grade-history`, worktree `tmp/ai-claude-grade-history`. Chưa push/merge. Commit MỚI sau d75bbea, theo thứ tự:

1. `621e8ff` — `src/lib/key-modal-request-context.ts` (mới), `tests/key_modal_request_context.test.ts` (mới) *(bản nộp đầu)*
2. `6503df0` — `src/components/ApiKeyModal.tsx` *(bản nộp đầu)*
3. `5857238` — sửa theo review CHANGES_REQUESTED của Codex (cả ba tệp, commit mới, không amend)

Không có WIP task8 trước đó (cây sạch tại d75bbea) nên làm từ đầu trong C01. Không sửa route/parent/package/checklist. Không DB/server/build/provider/khóa thật.

## Đã sửa (bản nộp đầu)
- `ApiKeyModal` giữ props cũ (`ownerId, isOpen, onClose, onKeyUpdated`) nhưng là vỏ: khi mở dựng `ApiKeyDialog` với `key = ownerId`, nên mỗi lần mở hoặc đổi tài khoản là ngữ cảnh mới (trước đây danh sách, kết quả test, nhật ký sống qua đóng/mở và tài khoản).
- Mọi list/add/toggle/delete/test/set_model/nhật ký đi qua `accountFetch(ownerId, …)` với `AbortSignal`. Cổng một request một lúc (dùng lại `MemoryGate`): bấm đúp bị chặn thật; `release()` của token cũ trả false nên không tắt "đang bận" của request mới; 401 hoặc 409 `ACCOUNT_CHANGED` → khóa, báo tải lại trang, không dùng chủ mới để thử lại. Tạo trong effect (StrictMode chạy lại → ngữ cảnh mới); tải đầu hoãn `setTimeout 0`.
- Danh sách lưu kèm owner đã tải; bật/tắt/xóa/test kiểm `canActOnKey` (cùng owner, ID còn trong danh sách, không dùng chỉ số). `parseKeyList` kiểm hình dạng (sai → giữ danh sách đang xem; dòng hỏng/trùng bị bỏ và báo số lượng; số đếm/quota/model thiếu thì rơi về mặc định).
- Kết quả "Đọc danh mục" đến muộn chỉ vào đúng khóa còn tồn tại, sau làm mới kết quả của khóa đã mất bị xóa. Chỉ gửi khi bấm nút trên khóa đó; không tự dò.
- Form thêm khóa: tên và khóa chỉ nằm trong state/ref (không log, không localStorage, không đưa vào thông báo). Lỗi hoặc khóa phiên → giữ nội dung. Biên nhận chỉ xóa form nếu form còn đúng như đã gửi; khóa khác gõ sau khi bấm Lưu được giữ. Đóng khi còn khóa đang nhập thì hỏi xác nhận.
- Ô model: làm mới hoặc biên nhận lưu model chỉ thay ô khi ô còn đúng giá trị biên nhận nói tới (trước đây mỗi `load()` ghi đè model đang gõ dở).
- Không suy quota/miễn phí/trả phí từ khóa.

## Sửa theo review (5857238)
1. **Biên nhận thêm khóa:** 200 mà body null/thiếu `success`/thiếu `key` hợp lệ không còn xóa form hay gọi `onKeyUpdated`. `parseSavedKey` bắt buộc `success === true` và khóa có đủ `id`, `label`, `keyMasked`, `isActive`; nếu không thì giữ form, không báo thành công, hiện thông báo "chưa chắc khóa đã được lưu".
2. **Hợp đồng mới `clientRequestId`:** POST gửi uuid ổn định theo `JSON.stringify([label.trim(), apiKey.trim()])` giữ **trong RAM** (không đĩa, không log); sửa nội dung → mã mới; bấm Lưu lại sau lỗi dùng cùng mã nên không lưu trùng. Chỉ phản hồi 200 có biên nhận hợp lệ (kể cả `replayed:true`) mới được ACK. 409 `KEY_REQUEST_CONFLICT` hiện thông báo của máy chủ, form giữ nguyên. **Đã dùng hợp đồng mới**; bỏ câu "backend chưa idempotency".
3. **Hai lane dùng chung một sự thật mất tài khoản:** `KeyContext` giữ lane `main` (thao tác) và `logs` (nhật ký). Auth-failure ở lane nào cũng đặt `accountLost`, hủy lane còn lại; mọi cập nhật state đi qua `live(token) = !accountLost && token.isLive()`. Token của ngữ cảnh cũ không khóa hoặc làm sống lại ngữ cảnh mới (tính "sống" luôn hỏi cổng của chính token). `begin`/`loadLogs` kiểm `accountLost` đồng bộ qua context (không dựa vào state `locked` có thể cũ).
4. **`requestClose`** gọi `ctx.dispose()` đồng bộ cho cả hai lane trước `onClose()`, không đợi effect cleanup.

## Đã chạy (thuần, từ worktree)
- `tests/key_modal_request_context.test.ts` (kết quả và log: `qa/rebuild-2026-10-24/CLAUDE_BATCH_CHECKS.md`). Ca mới: biên nhận thêm khóa hỏng/thiếu key/sai kiểu/replayed hợp lệ; hai lane (auth-fail ở lane này vô hiệu lane kia và ngược lại, lane phát hiện vẫn tự nhả busy, token chết không báo mất lần hai); ngữ cảnh cũ không lock/revive/release ngữ cảnh mới; đóng cửa sổ kết thúc cả hai lane và không tính là mất tài khoản.
- `tsc --noEmit` toàn dự án không lỗi. ESLint 3 tệp phạm vi sạch.

## Chưa chạy / giới hạn
- Chưa chạy HTTP, DB, giao diện, build. React (ref/effect/khóa nút/`key` theo owner/dialog confirm) mới qua typecheck/lint. Fingerprint của `clientRequestId` do component dựng (trim label + key) nên không có unit riêng; ca retry/đổi nội dung cần HTTP/UI.
- `key-modal-request-context.ts` import `MemoryGate` từ `ai-memory-request-context.ts`; `ApiKeyModal` import `createRequestIdentity`/`isAccountFailure` từ `template-request-context`. Nếu Codex đổi hai tệp đó thì sửa import.
- **Codex cần kiểm HTTP:** hai POST cùng `clientRequestId` + cùng nội dung → một dòng, lần hai `replayed:true` (receipt đúng `key.id/label/keyMasked/isActive`); đổi key/label cùng mã → 409 `KEY_REQUEST_CONFLICT`; header `x-examcraft-user` sai → 409 `ACCOUNT_CHANGED`; test khóa chỉ chạy khi bấm (khóa giả hoặc chặn mạng).
- **Codex cần kiểm UI:** mở cửa sổ → tải; mở lại sau đổi tài khoản không thấy danh sách cũ; Lưu khóa hai lần nhanh chỉ một request; chặn body 200 rỗng → form còn và hiện "chưa chắc"; lỗi mạng khi lưu → bấm lại cùng mã (xem request) không tạo trùng, sửa nội dung → mã mới; gõ khóa khác sau khi bấm Lưu → khóa mới còn; sửa ô model rồi thêm/bật khóa → ô còn nguyên; mở "Nhật ký" rồi đổi tài khoản ở tab khác: lane nhật ký 401 thì form/nút thao tác cũng khóa, và ngược lại; bấm Đóng khi request đang chạy → không còn cập nhật nào.
- Giới hạn: thao tác xếp một hàng; hủy request phía trình duyệt không hủy xử lý máy chủ; xác nhận xóa/đóng dùng `confirm()` gốc; thông báo cũ bị xóa khi bấm thao tác mới.
