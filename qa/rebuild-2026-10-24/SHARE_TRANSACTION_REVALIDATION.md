# Sao chép: quyền và phiên bản được đọc lại trong giao dịch — 24/10/2026

## Phạm vi CV048/CV011

Đợt trước giữ bản sao theo phiên bản và chặn concurrent create, nhưng đọc quyền/nội dung trước giao dịch. Khi request đang chờ lock, quyền/link/phiên bản đó có thể đã cũ. Đợt này sửa POST public/share/[id]/copy:

- Lookup ban đầu chỉ lấy id/examId làm địa chỉ; không dùng quyền/nội dung đó để cho phép copy.
- Trong transaction, khóa Exam trước rồi ShareLink; đọc lại liên kết và toàn bộ đề sau khi khóa. Kiểm thu hồi/hết hạn/đề xóa/câu được chia sẻ/allowCopy và sourceVersion trước createExam.
- Cùng link/đề đã được khóa hàng nên concurrent create vẫn tuần tự, thay advisory lock của đợt trước; giữ nguyên cách tạo ID/legacy/CAS của bản sao, không sửa schema/dữ liệu người dùng.
- Nếu cập nhật đề hoặc thu hồi link thắng trước, copy đọc trạng thái mới và bị từ chối. Nếu copy đã giữ lock, thao tác cập nhật/thu hồi chờ copy kết thúc; bản sao đã tạo hợp lệ không bị xóa khi thu hồi sau đó. Đây là thứ tự giao dịch, không xóa hồi tố dữ liệu.

## Kiểm thử mới

Typecheck và lint route đã đạt (typecheck-share-locks.log, lint-share-locks.log). Build-share-locks.log exit0,46trang/TypeScript đạt, NEXT_BUILD_CPUS=2; QA3117 dừng trước build rồi mở lại vào examcraft_test_20261022. HTTP lượt đầu http-share-locks.log27/27 đạt; bổ sung chiều ngược nên chạy http-share-locks-both-orders.log cuối27/27 fail0/skip0, ba JSON HTTP đều PASS/cleanupComplete. Typecheck cuối typecheck-share-locks-final.log exit0. SAFE268/268 kế thừa đợt MEMORY_AND_SHARE_VERSION, không chạy lại vì không đổi helper/client; không ghi là kiểm SAFE mới.

HTTP mở rộng fixture UUID trên DB thử: giữ row lock bằng một backend PID; gửi request copy; đợi pg_blocking_pids chứng minh request đang chờ đúng PID rồi mới thay dữ liệu/commit. Không dùng thời gian chờ giả làm bằng chứng thứ tự. Kiểm sửa version, tắt allowCopy, hết hạn và revoke trong lúc chờ; không tạo đề mới, bản riêng đã sửa giữ nguyên. Các ca retry/concurrent/ẩn đáp án/legacy của đợt trước vẫn chạy trong cùng suite.

## Giới hạn

- Đã thử chiều copy giữ lock trước: khóa FK recipient User trong DB thử để request dừng tại INSERT, chứng minh backend copy đang chờ đúng PID; gọi API thu hồi rồi chứng minh backend revoke chờ PID copy. Nhả FK, copy200 rồi revoke200, bản riêng vẫn đọc được bằng chủ, copy tiếp404. Không thêm trigger/hook kiểm thử vào app/schema.
- Chưa UI/hai browser độc lập. CUA chưa hoạt động ở lần kiểm trước; đợt này không retry giao diện.
- Lock Exam tuần tự hóa việc sửa đề qua updateExam; chưa thêm lock từng Question/Passage cho mọi thay đổi ngân hàng độc lập hoặc câu đã bị gắn sai quyền từ dữ liệu cũ. Không chứng nhận tất cả race quyền tham chiếu.
- Public GET vẫn đọc hiện trạng đề, chưa chuyển link thành immutable publication snapshot. Giữ mở CV048 theo tiêu chí đã chốt; không suy hoàn tất từ số test.
- Không ghi DB chính, không gọi provider/khóa thật, không push/reset/xóa thay đổi. Claude8 và Gemini4 chưa xác nhận nhiệm vụ mới tại mốc đầu đợt; không sửa code họ được giao.
