# Gói kiến thức và phạm vi — đợt triển khai 22/10/2026

## Đã làm

- Định dạng JSON có mã gói, phiên bản, môn/lớp, phiên bản chương trình, nguồn, quyền dùng, cây kiến thức và quan hệ tiên quyết. Mục lục theo từng sách/ấn bản/tập; liên kết nhiều–nhiều tới kiến thức và yêu cầu cần đạt. Không dùng số thứ tự bài làm mã kiến thức.
- Kiểm mã trùng, tham chiếu thiếu, vòng lặp, giới hạn kích thước và ngày hiệu lực. Nhập tệp luôn thành **chờ duyệt**, kể cả tệp tự khai đã duyệt. Nguồn được lưu để đối chiếu; không tự tải hoặc đưa tài liệu vào kho AI chung.
- Trong bàn soạn có mục tùy chọn, thu gọn mặc định: nhập gói, chọn bao gồm/loại trừ, chọn qua mục lục, giới hạn phương pháp. Hiện số lượng và thay đổi trước nút **Áp dụng phạm vi vào đề**. Chọn mục cha bao gồm mục con; loại trừ được ưu tiên. Quan hệ tiên quyết không tự mở rộng phạm vi.
- Gói và phạm vi là snapshot riêng trong metadata của đề, qua cùng quyền truy cập/lưu phiên bản/lịch sử. Đổi nội dung cùng mã gói và phiên bản bị chặn bằng HTTP409; đổi phiên bản gói nhưng giữ phạm vi cũ bị từ chối. Có tải JSON và gỡ gói khỏi đề, giữ câu hỏi.
- Kế hoạch sinh AI nhận phạm vi đã giải quyết; gửi phần được chọn và giới hạn, không gửi toàn bộ tài liệu nguồn. Kết quả có mã ngoài phạm vi hoặc thiếu liên kết ở bài không phải khảo sát bị chặn. Đây là kiểm hợp đồng, chưa chứng minh AI tuân thủ kiến thức trong nội dung câu.
- Mỗi câu có thể gắn kiến thức/yêu cầu trong phần sửa thủ công. Liên kết ghi mã gói và phiên bản; mã giống nhau ở gói khác không tự coi là tương đương. Liên kết cũ hoặc ngoài phạm vi có cảnh báo và vẫn được giữ để sửa sau. Không xóa câu khi đổi phạm vi. Thống kê số câu gắn mã chỉ là kiểm liên kết, không phải chứng nhận chuyên môn.

## Bằng chứng và giới hạn

- `tests/knowledge_package.test.ts`: kiểm định cấu trúc, mapping theo chương, ưu tiên loại trừ, diff không tự áp dụng, giữ phiên bản, adapter và phạm vi AI. Bổ sung kiểm nguồn gốc mã từng câu và cảnh báo ngoài phạm vi.
- `integration_s1.json`: roundtrip gói/phạm vi trong PostgreSQL và chặn đổi cùng phiên bản; dữ liệu giả trên DB thử.
- `http_workflows.json`: kiểm lưu/mở/sửa gói, từ chối phiên bản sai, nguồn riêng không xuất hiện trong share public. Lượt trước phần gắn mã từng câu đạt tổng14/14 cùng suite auth; lượt mới sau bổ sung được ghi tại TESTING khi chạy xong.
- Giao diện đã nhập fixture, chọn nhóm bao gồm + phép trừ loại trừ, thêm hai giới hạn phương pháp, áp dụng/lưu/tải lại. Sau tải lại còn đúng2mục kiến thức và1yêu cầu; `knowledge-scope-saved.png`. Bản đề cũ xung đột được giữ và lưu thành bản sao phục hồi trước thử này.
- Công cụ chọn tệp đã chờ rất lâu (khoảng107phút); thao tác nhập cuối cùng thành công. Không lấy thời gian chờ công cụ làm lỗi hay thời gian đáp ứng ứng dụng. Một click dùng chỉ số cũ bị timeout, đã đọc lại trang và bấm nút theo tên, không báo thành công từ lần timeout.

## Chưa hoàn thành, không đánh dấu S2 đã xong

- Fixture `tests/fixtures/knowledge-package.json` là dữ liệu giả cá nhân để kiểm kỹ thuật, **không là chương trình Toán lớp6 chính thức**.
- Chưa có kho registry gói được biên tập/duyệt đủ môn–lớp và ba bộ sách. Sổ tài liệu nghiên cứu là đầu vào; không được chuyển số URL thành số gói đã duyệt.
- Chưa có chat chuyển yêu cầu thành đề nghị scope có diff. Không suy đoán bộ sách hoặc nội dung chỉ từ tên bài.
- Chưa có quy trình reviewer xác nhận nguồn và hiệu lực để phát hành gói chuẩn; trạng thái nhập luôn chờ duyệt.
- Chưa hỗ trợ cây chương trình theo trình độ không gắn lớp trong định dạng v1 này. Các nhánh ngoại ngữ/tiếng dân tộc và biến thể địa phương cần mở rộng có phiên bản, không ép về Toán hoặc gói lớp khác.
- Chưa gọi nhà cung cấp AI thật, chưa nghiệm thu chuyên môn các câu sinh ra. Đã mở rộng hợp đồng sinh bản nháp lên7dạng, xem GENERATION.md; chưa thử nhà cung cấp thật.

Các CV016–022 và034 còn mở theo toàn bộ tiêu chí, dù luồng kỹ thuật trên đã có bằng chứng riêng.

## Giao diện liên kết từng câu đã kiểm

Sau dựng lại, đã mở sửa câu, chọn kiến thức bị loại trừ và thấy cảnh báo; bỏ lựa chọn đó, chọn kiến thức/yêu cầu phù hợp, lưu và tải lại. Cả hai checkbox được giữ và trạng thái hiện “Đã gắn mã; giáo viên cần kiểm nội dung”. Bằng chứng: question-knowledge-saved.png. Lượt HTTP sau bổ sung provenance đạt14/14 cùng auth, bản dựng44trang đạt.
