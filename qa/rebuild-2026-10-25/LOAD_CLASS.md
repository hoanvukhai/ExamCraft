# CDX-Q2 — tải lớp40học sinh

## Cách chạy
Chạy server thử scripts/test-server.cjs --production, sau đó node --import tsx scripts/load-class.cjs. Runner đọc cấu hình local nhưng không ghi bí mật vào báo cáo; xác minh tên DB chính xác examcraft_test_20261022 và health isolatedTest trước tạo fixture. Không gọi provider. Mỗi pha40request cùng bắt đầu, ba lần lưu nháp tuần tự theo pha, nộp đồng thời, rồi gửi lại bài với đáp án khác để kiểm bất biến. Không retry từ client; mọi request trong pha phải kết thúc trước cleanup.

## Baseline
q2-baseline.log: start40 và ba pha nháp đều không lỗi5xx. Submit có7/40lỗi503, p95=915ms; đây là lỗi sản phẩm, không được che bằng retry client. Các lỗi Prisma P2034 khi ghi AttemptAnswer và lỗi commit cùng lớp. Cleanup riêng fixture đã hoàn tất. Chưa có telemetry server ở baseline, không suy retry=0 từ việc không thấy header.

## Sửa
Submit vẫn khóa Attempt FOR UPDATE trước đọc trạng thái/quyền/nháp; giữ CAS, thời hạn, một lần ghi đáp án và idempotency. Đổi Serializable sang ReadCommitted để tránh SSI conflict giữa các lượt độc lập. Không thay cách tính điểm/chấm lại/snapshot. Start giữ khóa theo học sinh đã có của Claude; draft giữ khóa theo lượt. Header số lượt transaction chỉ được bật bằng EXAMCRAFT_ISOLATED_TEST_SERVER=1 trên server, không nhận điều khiển từ request; unit kiểm bình thường không có header.

## Kiểm đang làm
SAFE đạt346/346 (q2-safe.log); build/load lại/HTTP đang thực hiện. Kết quả chi tiết theo từng pha nằm trong load-class-*.json, không chép cookie/key/bodyrequest. Mục tiêu0lỗi5xx, không tạo trùng,40lượt nộp đúng điểm và không thay kết quả khi nộp lại. Chưa kết luận đạt Q2.

## Giới hạn
Local một máy, bài một câu lựa chọn: đo đường giao dịch đồng thời, không đại diện tải Internet hoặc đề dài/ảnh. Không có ngưỡng p95 cam kết từ chủ dự án; chỉ báo số đo. Không giả vờ đã kiểm nhiều máy vật lý.

## Kết quả bản sửa
Build đạt (q2-build.log), SAFE346/346, HTTP60/60 (q2-http.log) gồm ca nộp đồng thời một lượt, nhápCAS, quyền và chính sách. Tải40học sinh đạt240/240request, không lỗi5xx/non200, không retry ở client hoặc server trong lượt đo. p95(ms): start754; nháp464/538/550; submit252; nộp lại270. DB có40học sinh khác nhau,40lượt SUBMITTED, mỗi lượt đúng1điểm/1đáp án; gửi lại đáp án khác không thay kết quả. Cleanup thành công. q2-load-fixed.log và load-class-*.json giữ từng pha/buildID. Không gọi đây là SLA hoặc đã thử nhiều máy vật lý. Chờ Claude duyệt Q2.
