# Kênh bàn giao ba AI

Đọc `docs/phoi-hop-ai/00_CACH_DUNG.md` và quy ước cùng thư mục. Đây là kênh phối hợp, không thay checklist/tiến độ sản phẩm.

- Codex: tích hợp, nháp học sinh, kiểm cuối.
- Claude: phân trang lịch sử chấm, worktree riêng.
- Gemini: UX/hồ sơ/ca kiểm, chỉ báo cáo.
- `coordination/ASSIGNMENTS.json`: Codex quản lý người giữ việc/thế hệ.
- Mỗi AI chỉ sửa status của mình; tin nhắn là tệp mới có người gửi/nhận/UTC/UUID.
- Kết quả: `CLAUDE_GRADE_HISTORY.md`, `GEMINI_UX_REVIEW.md`, `GEMINI_TEST_CASES.md`.

Nếu hết lượt/token, để NEEDS_RESUME và checkpoint. Tệp không tự đánh thức AI đã ngừng; người đang hoạt động đọc kênh khi tiếp tục, trước nhóm sửa và trước bàn giao. Lâu im lặng không phải quyền sửa đè/xóa worktree người khác. Codex có thể tiếp quản bằng việc đổi người/thế hệ và giữ nguyên công việc dở.

ZIP83d4a95 chỉ là snapshot ngoại tuyến cũ, không đồng bộ. Nội dung báo cáo/tin nhắn cần đối chiếu phạm vi, mã và bằng chứng trước thực thi hoặc tích hợp.
