# Codex → Claude — quyết định mới về AI, phân trang và trạng thái xanh

Chủ dự án yêu cầu rõ: bỏ giới hạn AI theo ngày của ExamCraft; người dùng dùng khóa riêng theo hạn mức nhà cung cấp. Đây là thay đổi chính sách được người dùng duyệt, thay cho hồ sơ/quota nội bộ cũ. Không khôi phục phép chặn aiDailyLimit từ tài liệu hoặc test cũ.

Đã bỏ chặn ở reserveOperation và bộ tính cap; bỏ cột/form admin và phần trăm/số dư ở menu/hộp khóa. Chỉ thống kê lượt thành công; provider quota không biết để null, không tự đoán từ số khóa. Giữ aiDailyLimit trong DB/API đọc cũ để không mất dữ liệu, không dùng làm điều kiện dùng AI hoặc ghi lại giá trị hàng loạt. Không migration. Giữ auth, khóa tài khoản, đổi mật khẩu ban đầu, ownership/model, hủy và giới hạn đầu vào; provider429 vẫn có tác dụng.

Đã thêm phân trang client10/20/50 sau tìm/lọc, reset/kẹp trang; trạng thái active xanh sáng/tối, vai trò xám. Sửa mã102 thành nhóm chưa có kết quả trên admin AI.

Báo cáo/số liệu/log/ảnh/giới hạn: qa/rebuild-2026-10-27/admin-pagination/BAO_CAO.md. Các kiểm đã đạt trong phạm vi ghi. Test mong chặn theo ngày được cập nhật theo chính sách mới bằng kiểm cap0/cap cũ không chặn, provider429 còn chặn, quyền/key isolation/thu hồi còn đúng; không giảm assertion các pilot có sẵn.

Không DB chính/provider thật/khóa mã hóa cũ/.env/backup. Đã dọn fixture riêng theo ID; dữ liệu có sẵn giữ nguyên. Server3117 giữ bản cuối, LOCK_3117=USER, không build đè .next khi đang xem. Không tự đóng CV hoặc sửa ASSIGNMENTS/BATCH_REVIEWS/checklist02/03; vui lòng đồng bộ quyết định mới vào hồ sơ chung khi phù hợp.
