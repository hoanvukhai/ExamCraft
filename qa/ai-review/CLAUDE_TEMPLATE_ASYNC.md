# Mẫu cá nhân: an toàn phản hồi chậm và áp dụng mẫu — Claude, 24/10/2026

Task CLAUDE-TEMPLATE-ASYNC-SAFETY (generation 4), CV011/021. Nhánh `ai/claude-grade-history`, worktree `tmp/ai-claude-grade-history`. Chưa push/merge. Commit MỚI sau f3dca22, theo thứ tự:

1. `b442c22` — `src/lib/template-request-context.ts` (mới), `src/lib/exam-template.ts` (thêm parser), `tests/template_request_context.test.ts` (mới), `tests/exam_template.test.ts` (thêm 4 ca)
2. `f85712e` — `src/components/ExamTemplatePanel.tsx`

Không migration/dependency/schema; không sửa tệp ngoài `allowed_code`. Không DB/server/build.

## Đã sửa
**Vòng request (tải danh sách / mở mẫu / lưu bản riêng)**
- `RequestGate` (một cái cho mỗi lần mount của panel; panel vốn đã re-key theo tài khoản+đề): chỉ một request chạy một lúc (`begin()` trả null khi đang bận — chặn bấm đúp thật, không chỉ `disabled`); `dispose()` khi unmount/đổi đích sẽ abort fetch và token cũ hết "live"; sau `await` mọi nhánh kiểm `token.isLive()` trước khi đụng state, kể cả `finally`.
- Tài khoản đổi: `isAccountFailure` = 401 hoặc 409 `ACCOUNT_CHANGED` → `gate.lock()`: abort request đang chạy, chặn mọi request sau, khóa các nút, báo "phiên/tài khoản đã đổi… tải lại trang". Không coi là lỗi có thể thử lại dưới user khác; nội dung đang nhập (tên, nguồn tự khai, tùy chọn, bản xem trước) giữ nguyên. 409 thường (ví dụ nguồn đổi phiên bản) vẫn là lỗi thử lại được.
- Lưu: `createRequestIdentity` giữ đúng một `clientRequestId` khi body (tên, nguồn, snapshot, liên kết nguồn) không đổi → "thử lại" sau lỗi dùng lại ID, không tạo bản trùng; body khác → ID mới, kể cả quay lại body cũ (không dùng lại ID máy chủ có thể đã gắn với nội dung khác). Lỗi giữ nguyên mọi ô nhập.
- Phản hồi được kiểm trước khi thay đổi gì: `parseTemplateList` (đúng trang đã yêu cầu, `page ≤ pages`, bỏ dòng hỏng/trùng và báo "N mẫu chưa đọc được"; lỗi thì giữ danh sách đang xem), `parseOpenedTemplate` (phải đúng ID đã bấm, đủ sources/snapshot/revision; mẫu cũ đọc được vẫn mở), `parseSavedTemplate` (phải xác nhận success + tên/ID mới đổi thông báo/danh sách).
- Sau lưu: chỉ chèn bản mới vào danh sách khi đang xem trang 1 của danh sách đã tải; trang khác thì báo "bấm Tải danh sách" (trước đây chèn nhầm vào trang 3). Mở mẫu khác bỏ liên kết nguồn đã tick ở mẫu trước.

**Áp dụng mẫu**
- Bấm đúp "Áp dụng" trước khi render lại trước đây tạo hai attempt, attempt thứ hai không bao giờ được áp dụng nên hiện "chưa áp dụng" dù đề đã đổi; nay `applying` ref chặn, chỉ nhả khi đổi tùy chọn/đối chiếu lại/hủy/lỗi.
- Updater trả về `previous` nếu panel đã khóa/đóng; còn kiểm ID, quyền sửa và document stamp vẫn nằm trong `applyPersonalTemplate` (không rebase, không bỏ trường/đáp án/câu). ACK chỉ 'applied' khi bản soạn thật sự mang đúng attempt (cùng `appliedAt`/ID phần) và stamp đúng; updater chưa chạy thì vẫn 'pending'.
- Mẫu gốc không bị sửa; header/context/plan/sections vẫn là lựa chọn riêng kèm cảnh báo như trước.

## Đã chạy (thuần, từ worktree)
- `tests/template_request_context.test.ts` (6) + `tests/exam_template.test.ts` (15): **21/21** đạt. Ca mới: cổng một-request/nhả đúng token cũ/dispose/lock/context thay thế; quy tắc lỗi tài khoản; retry giữ ID, đổi body ID mới; danh sách sai trang/hỏng/vắng trang/dòng hỏng; mẫu mở sai ID/thiếu trường/mẫu cũ; ACK lưu; updater muộn sau khi đề đổi/quyền thu hồi/đề khác không ghi đè tiêu đề và câu giáo viên và không báo thành công.
- `tsc --noEmit` toàn dự án không lỗi. ESLint sạch cho cả 5 tệp phạm vi.

## Chưa chạy / giới hạn
- Chưa chạy HTTP, DB, giao diện thật, build. Hành vi React của panel (abort khi unmount, khóa nút, ref chặn bấm đúp) mới qua typecheck/lint; unit chỉ phủ phần thuần.
- **Codex cần kiểm UI:** (a) bấm "Lưu" hai lần nhanh → một request; (b) lưu lỗi mạng rồi bấm lại → cùng `clientRequestId` (xem request), sửa tên rồi lưu → ID mới; (c) mở mẫu A rồi B nhanh, response A về sau không chen; (d) đổi đề/tài khoản khi đang tải, không thấy lỗi/cập nhật tràn sang; (e) cho phiên hết hạn/đổi tài khoản trong tab khác rồi bấm bất kỳ nút → khóa, nội dung nhập còn; (f) sửa tiêu đề trong lúc đang mở mẫu → "Đề đã đổi", áp dụng bị chặn; (g) bấm "Áp dụng" hai lần nhanh; thu hồi quyền sửa rồi áp dụng; (h) danh sách trang 2 rồi lưu mẫu → thông báo, danh sách không bị chèn; (i) API trả mẫu cũ hỏng → thông báo "N mẫu chưa đọc được".
- **Codex cần kiểm HTTP:** không đổi API; chỉ xác nhận 401/409 `ACCOUNT_CHANGED` hiện có và replay 200 của `POST /api/templates` khớp phần client mong đợi (`success:true`, `template.id/name`).
- Giới hạn: một request tại một thời điểm (bấm "Mở" khi đang lưu bị bỏ qua, không xếp hàng); sau khóa tài khoản chỉ tải lại trang mới dùng tiếp; `pending` ack không có hết hạn nếu parent không bao giờ chạy updater (người dùng thoát bằng "Đối chiếu lại"/"Hủy xem trước").
