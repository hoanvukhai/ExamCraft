# CODEX status

task_id: OWNER-REMAINING-PAGES-ADMIN-ANALYSIS-20261027
state: WAITING_REVIEW
updated: 27/10/2026, Asia/Bangkok
branch/worktree: rebuild/2026-10-local, F:/Workspace/Zazz/ExamCraft
commit nền gần nhất: af919b3

Đã sửa phần trình bày còn lệch trên trang lớp/bài giao/giám sát, học sinh/chia sẻ, đăng nhập và admin; sửa thanh chế độ xem A4 bị ép/cắt trên điện thoại. Đã kiểm mã/build, giao diện sáng/tối trên máy tính/điện thoại và các luồng liên quan. Bằng chứng, số liệu, giới hạn: qa/rebuild-2026-10-27/ui-page-review/BAO_CAO.md.

Theo yêu cầu chủ dự án, cấu trúc và nội dung cũ–mới chồng nhau CHỈ PHÂN TÍCH trong qa/rebuild-2026-10-27/ui-page-review/PHAN_TICH_TRANG_VA_ADMIN.md: pool khóa cũ, nhãn/số liệu, khung admin, popup Thư ký và nội dung kỹ thuật. Chưa đổi các hành vi/nội dung này, chưa tự đóng CV. Bước tiếp theo: chủ dự án đối chiếu nhận định rồi mới chốt phạm vi sửa cấu trúc/chức năng.

Giữ dữ liệu chính, quyền và bí mật; DB thử có guard, không AI thật/schema. Đã dọn đúng fixture riêng của đợt; không đổi tài khoản có sẵn. Server thử3117 bản cuối giữ chạy, bàn giao LOCK_3117=USER; có thể cần mở lại nếu tiến trình dừng giữa lượt chat. Không build đè .next lúc đang xem.

Giữ QA25/scratch/tmp có sẵn, không gom vào commit. Không sửa checklist/02/ASSIGNMENTS/BATCH_REVIEWS, không push/reset/clean. Đợt trước: qa/rebuild-2026-10-27/ui-popup-review/BAO_CAO.md.
