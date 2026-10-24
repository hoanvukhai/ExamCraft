# Claude8 — quản lý khóa AI: đúng tài khoản, giữ form, bỏ phản hồi muộn

Đọc ASSIGNMENTS.json, quy ước phối hợp. Dùng worktree hiện tại từ d75bbea; chỉ giao commit MỚI sau d75bbea. Memory6 đã bàn giao, Codex7 giữ để review/HTTP: không sửa lại memory/template/import hoặc hồ sơ chung.

Allowed: src/components/ApiKeyModal.tsx; src/lib/key-modal-request-context.ts; tests/key_modal_request_context.test.ts. Báo cáo qa/ai-review/CLAUDE_KEY_MODAL_ASYNC.md tại gốc chung. Không sửa API routes/package/parent/checklist. Nếu cần mở phạm vi, nhắn Codex trước; chưa tự sửa.

Mục tiêu CV011/031/032: đọc code thực tế, sửa các lỗ hổng async nếu có. Mỗi modal/lần mở/tài khoản có request context, không nhận danh sách/biên nhận cũ sang chủ mới; account pin cho mọi list/add/delete/toggle/test. 401/409 ACCOUNT_CHANGED khóa cửa sổ, giữ form chưa lưu trong đúng context. Không silently adopt owner mới. begin guard cả trạng thái account/ready và ref chống double click; mọi finally/error/auth-failure kiểm chính token cũ. Đóng/đổi owner/dispose abort không lock/unbusy gate mới. Không log/export/ghi localStorage API key hoặc đưa key thật vào báo cáo. Gửi request test key CHỈ khi người dùng bấm, không auto-probe. Không gọi API thật trong kiểm thử.

Form add-key: lỗi gửi/parse/late reply không mất tên/key đã nhập hoặc chữ mới; thành công chỉ xóa đúng form đã gửi. Không suy quota hay paid/free từ key. Danh sách dùng id và loaded owner, không index; không tự thay cờ của item khác. Kết quả test phản hồi muộn không đè kết quả key/owner khác. Nếu backend không có idempotency, không tự hứa retry không tạo trùng; nêu giới hạn để Codex xử lý route sau. Không tự thêm tính năng lớn.

Kiểm unit thuần các quyết định ngữ cảnh/id/draft (không mock mirror React), tsc và lint phạm vi. Không install/build/server/DB/provider/.env/bí mật. Đọc local Next guide trước code. Báo cáo thay đổi+SHA+đã/chưa kiểm+ca Codex cần HTTP/UI. Checkpoint dưới15phút, trước nhóm sửa/commit kiểm generation; hết lượt ghi NEEDS_RESUME cùng WIP. Sau bàn giao chờ task mới, không tự sửa code đã giao.
