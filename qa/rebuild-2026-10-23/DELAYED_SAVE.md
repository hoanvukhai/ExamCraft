# Phản hồi lưu muộn và đổi tài khoản —23/10/2026

Tiếp CV010/050 sau ca mất kết nối, dùng **useExamPersistence production thật** trong React browser; API được thay bằng hàng đợi có nút trả phản hồi. Harness không nằm trong ứng dụng người dùng, chỉ localhost3122/persistence; CSP connect-src none, không DB/provider. LocalStorage thật dùng hai owner QA ngẫu nhiên riêng mỗi lần tải, không xóa kho cũ.

## Đã kiểm qua browser IAB

- Gửi lưu bản sửa A, giữ phản hồi. Sửa tiếp bản B; trả phản hồi A: hook giữ B đang mở, cập nhật version2, local nháp B vẫn còn; server giả mới chỉ có A. [Bằng chứng](delayed-save-keeps-newer.json). Không dùng assertion helper đơn lẻ để suy trạng thái React.
- Tự lưu tiếp B với baseVersion2; trả phản hồi mới: B đã lưu/version3, điểm0/lời giải còn; không còn nháp chưa lưu của B sau ack. [Bằng chứng](delayed-save-newer-ack.json).
- Gửi yêu cầu tiếp từ tài khoản A rồi chuyển UI sang tài khoản B trước khi trả. B mở bản gốc/version1. Trả phản hồi A: B vẫn nguyên bản gốc/version1; không có nháp A trong B, bản A chưa đối chiếu vẫn giữ riêng bên A. [JSON](delayed-save-account-isolation.json), [ảnh](delayed-save-account-isolation.png). Phản hồi cũ không cập nhật UI/cache của tài khoản mới.

Harness/tab đã dừng/đóng sau kiểm. `scripts/qa-scope-server.cjs` phục vụ component scope/plan/persistence ở origin riêng, không phải máy chủ production/DB chính. Các tệp entry trong thư mục QA dùng callback API giả, không thêm backdoor hay chế độ mock vào endpoint ứng dụng.

## Giới hạn

Đã kiểm hook React, storage và thứ tự phản hồi có kiểm soát; chưa là độ trễ mạng thật/nhà cung cấp AI thật/hai trình duyệt độc lập. Lưu chính và CAS PostgreSQL có bằng chứng HTTP riêng; ca này không chứng minh lại giao dịch DB. Chưa đóng CV010/050 chỉ từ những ca này. Không thay code lưu ngoài no-op guard ở setExam (updater trả cùng đối tượng không tạo một thay đổi/lần tự lưu giả).
