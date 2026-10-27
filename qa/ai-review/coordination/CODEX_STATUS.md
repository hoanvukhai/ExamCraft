# CODEX status

task_id: OWNER-PROVIDER-POLICY-PAGINATION-20261027
state: WAITING_REVIEW
updated: 27/10/2026, Asia/Bangkok
branch/worktree: rebuild/2026-10-local, F:/Workspace/Zazz/ExamCraft
commit nền gần nhất: 393da5f

QUYẾT ĐỊNH MỚI của chủ dự án: bỏ giới hạn AI theo ngày của ExamCraft, dùng theo nhà cung cấp. Đã bỏ chặn runtime và cấu hình/giao diện cap; chỉ giữ thống kê. Không khôi phục quota nội bộ từ hồ sơ/test cũ. aiDailyLimit trong DB/API đọc cũ giữ nguyên để bảo toàn, không dùng cấp/chặn quyền AI, không migration/ghi lại dữ liệu hàng loạt.

Đã làm trạng thái Đang hoạt động xanh ở sáng/tối; phân trang tài khoản10/20/50 sau tìm/lọc, reset và kẹp trang, đưa focus về bảng. Giữ quyền/khóa/model/hủy/đầu vào và provider429. Đã kiểm mã/build/an toàn, API với provider giả, giao diện và các luồng liên quan. Số liệu/log/ảnh/giới hạn: qa/rebuild-2026-10-27/admin-pagination/BAO_CAO.md.

Không DB chính/provider thật/khóa mã hóa cũ/.env/backup. Fixture riêng đã dọn theo ID; giữ dữ liệu và tài khoản có sẵn. Server3117 giữ bản cuối, AI thật tắt, LOCK_3117=USER; không build đè .next khi đang xem. Có thể cần mở lại server nếu tiến trình dừng giữa lượt chat.

Giữ QA25/scratch/tmp có sẵn ngoài commit. Không sửa hồ sơ02/checklist/ASSIGNMENTS/BATCH_REVIEWS, không tự đóng CV, không push/reset/clean. Bước tiếp theo: chủ dự án xem sản phẩm; không tự mở tính năng hoặc phục hồi cap cũ.
