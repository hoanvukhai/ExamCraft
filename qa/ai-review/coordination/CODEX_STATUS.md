# CODEX status

task_id: OWNER-TEACHER-UI-FIX-20261027
state: WAITING_REVIEW
updated: 27/10/2026, Asia/Bangkok
branch/worktree: rebuild/2026-10-local, F:/Workspace/Zazz/ExamCraft
commit mã + test gần nhất: 1341eeb, sau 52b0af0 (nền 9283de2)

Chủ dự án đã duyệt sửa theo qa/rebuild-2026-10-27/teacher-ui-audit/PHAN_TICH.md. Đã sửa thùng rác, ngân hàng trang riêng/bộ chọn, chuẩn hóa và phân trang câu, khung teacher, ngữ cảnh lớp/bài giao, bộ lọc URL và giao diện điện thoại. Đã kiểm build/kiểu/lint, an toàn, browser/điện thoại mô phỏng/sáng-tối, quyền/đổi tài khoản, dữ liệu phản hồi muộn và các hồi quy liên quan. Bằng chứng/số liệu/giới hạn: qa/rebuild-2026-10-27/teacher-ui-fix/BAO_CAO.md. Chỉ DB thử đã xác nhận đích, không DB chính/provider thật/migration. Chưa tự đóng CV; chờ chủ dự án xem và Claude duyệt. Chi tiết đợt font trước giữ dưới đây.

QUYẾT ĐỊNH MỚI của chủ dự án: bỏ giới hạn AI theo ngày của ExamCraft, dùng theo nhà cung cấp. Đã bỏ chặn runtime và cấu hình/giao diện cap; chỉ giữ thống kê. Không khôi phục quota nội bộ từ hồ sơ/test cũ. aiDailyLimit trong DB/API đọc cũ giữ nguyên để bảo toàn, không dùng cấp/chặn quyền AI, không migration/ghi lại dữ liệu hàng loạt.

Đã đồng bộ font tiếng Việt giao diện và tài liệu; bỏ fallback Georgia/Cambria gây trộn dấu. Font lưu tại dự án, đề ưu tiên Times tương thích Word và Noto Serif dự phòng. Giữ font toán. Zoom A4 là tỷ lệ thật, có Vừa khung/100% và điều khiển điện thoại; vùng đọc không mất khi nằm ngang. Đã kiểm font thực NFC/NFD/sáng/tối, điện thoại mô phỏng, Word/in, đề dài, admin và hồi quy liên quan. Số liệu/log/ảnh/giới hạn: qa/rebuild-2026-10-27/typography/BAO_CAO.md. Lượt trước giữ nguyên: phân trang tài khoản, trạng thái hoạt động xanh, bỏ cap AI nội bộ.

Không DB chính/provider thật/khóa mã hóa cũ/.env/backup. Fixture riêng đã dọn theo ID; giữ dữ liệu và tài khoản có sẵn. Server3117 giữ bản Y9AvBfJPLDZK2xdngW8ix, AI thật tắt, LOCK_3117=USER; không build đè .next khi đang xem. Có thể cần mở lại server nếu tiến trình dừng giữa lượt chat.

Giữ QA25/scratch/tmp có sẵn ngoài commit. Không sửa hồ sơ02/checklist/ASSIGNMENTS/BATCH_REVIEWS, không tự đóng CV, không push/reset/clean. Bước tiếp theo: chủ dự án xem sản phẩm; không tự mở tính năng hoặc phục hồi cap cũ.
