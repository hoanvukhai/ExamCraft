# CODEX status

task_id: OWNER-FRAME-PANELS-20261028
state: WAITING_REVIEW
updated: 28/10/2026, Asia/Bangkok
branch/worktree: rebuild/2026-10-local, F:/Workspace/Zazz/ExamCraft
commit mã + kiểm: f467523
mốc đã đọc của Claude: 7d95594

Yêu cầu hiện tại đã xử lý: menu trái bàn soạn dùng cùng lựa chọn mở/thu với các trang, chia chỗ thay vì phủ; nút sửa đề bằng AI vào toolbar; avatar bỏ quản lý khóa trùng; chat bỏ nút ghi chú/banner trùng. Chat và Copilot chia chỗ trên desktop, mở toàn màn trên điện thoại có nút đóng/Escape/vòng Tab; không mở cả hai bảng cùng lúc, giữ nội dung đang gõ. Vùng soạn thích ứng bề rộng thực và avatar điện thoại nằm trong màn hình.

Giữ thay đổi Claude: bỏ CopilotBar chết, một hộp khóa chung, bỏ nút tạo đề trùng trong menu Kho đề. Không đổi logic lưu/áp dụng AI/giao bài/schema/migration.

Đã kiểm build production/TypeScript, lint phạm vi, SAFE, browser thanh bên/điện thoại mô phỏng/sáng-tối, F19 và F21 (provider giả, đúng tài khoản, không đè bản sửa mới). Số liệu/ảnh/log/dọn fixture/giới hạn chỉ tại qa/rebuild-2026-10-28/frame-panels/BAO_CAO.md. Không suy đóng CV từ số kiểm. Chưa kiểm cảm ứng thật/bàn phím ảo hoặc chất lượng AI thật.

Server thử localhost3117 giữ build YybkJ4jwHMqc0fbN2c9dw, isolatedTest=true, AI thật tắt; LOCK_3117=USER. Chỉ DB examcraft_test_20261022 đã kiểm đích với fixture dọn riêng. Không DB chính/key/.env/backup. Không build đè lúc người dùng xem; mở lại server nếu tiến trình dừng giữa lượt chat.

Bước kế: chủ dự án xem sản phẩm; Claude duyệt nhóm thay đổi và báo cáo. Không tự mở tính năng/đóng CV/sửa ASSIGNMENTS/BATCH_REVIEWS/hồ sơ02/checklist. Báo cáo gộp kho trước: qa/rebuild-2026-10-28/library-merge/BAO_CAO.md.

Giữ ngoài commit: sửa/ảnh/kết quả QA25 có sẵn, scratch/, tmp/. Không push/reset/clean.
