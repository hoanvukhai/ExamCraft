# CODEX status

task_id: OWNER-ADMIN-REFRESH-20261027
state: WAITING_REVIEW
updated: 27/10/2026, Asia/Bangkok
branch/worktree: rebuild/2026-10-local, F:/Workspace/Zazz/ExamCraft
commit nền gần nhất: 2bad395

Chủ dự án duyệt triển khai sau phân tích. Đã dọn admin: khung chung, kiểm quyền server, số liệu khóa và hoạt động hiện hành, trạng thái/rỗng/lỗi, tài khoản trên điện thoại và lọc vai trò, dialog xác nhận chung. Đã bỏ popup Thư ký cũ chồng drawer, sửa nhãn CLASSWORK, số lượt SUBMITTED, câu chữ và encoding đề mẫu kỹ thuật.

Đã kiểm mã/build/an toàn, admin trên trình duyệt và hồi quy các luồng liên quan. Số liệu/log/ảnh/giới hạn và phần giữ tương thích: qa/rebuild-2026-10-27/admin-refresh/BAO_CAO.md. Chưa suy toàn sản phẩm/thiết bị/provider thật đã nghiệm thu. Bước tiếp theo: chủ dự án xem giao diện thực tế; không tự mở tính năng mới.

Không DB chính/provider thật/schema/migration/khóa mã hóa cũ. Fixture riêng đã dọn, giữ dữ liệu và tài khoản có sẵn. Server thử3117 giữ chạy bản cuối, LOCK_3117=USER; không build đè .next lúc đang xem. Có thể cần mở lại server nếu tiến trình dừng giữa các lượt chat.

Giữ QA25/scratch/tmp có sẵn, không gom vào commit. Không sửa checklist/02/ASSIGNMENTS/BATCH_REVIEWS, không tự đóng CV, không push/reset/clean. Đợt phân tích trước: qa/rebuild-2026-10-27/ui-page-review/PHAN_TICH_TRANG_VA_ADMIN.md.
