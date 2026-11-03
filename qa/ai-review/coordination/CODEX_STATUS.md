# CODEX — xử lý rà soát bàn giao chat AI V2

- task_id: CHAT-AI-V2-REVIEW-FIX
- state: WAITING_REVIEW
- worktree: F:/Workspace/Zazz/ExamCraft/tmp/chat-ai-v2; branch codex/chat-ai-v2.
- Commit mã/test gần nhất: 657d66e. Nền trước rà: 5f6bf4d (mã), 85ac659 (hồ sơ). Commit hồ sơ/dọn output đi sau, xem Git log.
- Đã xong: cập nhật library theo bootstrap và vị trí thư mục; khôi phục complementary desktop/dialog không modal trên điện thoại, không khóa Tab; đưa library/frame vào CI; pin/cấu hình Prettier, định dạng phạm vi nhánh; guard key/caller bằng AST; kết quả kiểm chuẩn ghi theo ngày chạy.
- Đã dọn raw QA mới sau khi cất/kiểm hash, trả riêng output lịch sử và thêm ignore/policy. Giữ báo cáo, mã kiểm, đặc tả, cấu hình, trạng thái tài khoản manual và dữ liệu. Không dùng reset/clean.
- Kiểm đã chạy: CI mở rộng, integration riêng, chat completion và Đ0–Đ2, formatter check/debug-check, hash bảo toàn dữ liệu manual; đều đạt. Số liệu, lệnh và giới hạn chỉ tại qa/rebuild-2026-11-03/chat-review/BAO_CAO.md.
- Đang giữ: máy chủ người dùng 3123 đã mở lại, tài khoản/mật khẩu và SESSION_SECRET cũ; health không nhận isolatedTest để chặn chạy tự động nhầm. Máy chủ tự động 3124/AI giả đã dừng sau CI.
- Bước kế: Claude duyệt commit/báo cáo; chủ dự án thử AI thật và chuyên môn trên 3123. Chưa thử AI thật, điện thoại vật lý hoặc trình đọc màn hình thật. Không còn việc mã trong phạm vi rà này; chưa tự đóng CV hay coi nghiệm thu chuyên môn hoàn tất.
- Không gọi AI thật, không ghi DB chính, không migration/push/deploy. Không sửa checklist/02/ASSIGNMENTS/BATCH_REVIEWS của Claude.
- Raw cất ở tmp/qa-before-review-20261103T152251Z-0cfe6971; giữ manual-preview-identities.json/log local, không đưa raw trở lại Git.
