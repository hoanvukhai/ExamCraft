# Hội thoại V2 — nhóm nền Đ1

> Cập nhật lưu trữ QA: ảnh/log/JSON sinh tự động đã cất ở local, không còn theo dõi trong Git. Xem [quy tắc lưu kết quả](../../KET_QUA_SINH_TU_DONG.md) và đợt rà `qa/rebuild-2026-11-03/chat-review/BAO_CAO.md`. Mốc raw cũ vẫn truy được tại Git `85ac659`; bản đang đổi khi dọn có manifest trong `tmp/qa-before-review-20261103T152251Z-0cfe6971`.

03/11/2026. Đang tiếp tục toàn bộ theo lệnh mới của chủ dự án; đây là báo cáo nhóm, chưa tuyên bố Đ1–Đ4 hoàn tất.

Đã có: hội thoại lưu riêng theo tài khoản/đề/writer (không sửa envelope nháp), khôi phục input và câu hỏi làm rõ sau reload, gửi lịch sử có kiểm lên route, tự nhập câu trả lời gắn questionId, trạng thái khóa loading/unknown/missing/present, thiếu khóa không gọi Copilot, nút quản lý khóa/tiếp tục, nút Dừng và chặn phản hồi muộn, Enter cảm ứng xuống dòng/desktop gửi/IME không gửi. Hết quota/dịch vụ không tự xoay khóa; chỉ khóa hỏng được đổi sang khóa khác. Nhận biết nested status, khóa hết hiệu lực/thu hồi/leaked/billing. Route chặn yêu cầu hơn 4 MiB, có abort và phát hiện MAX_TOKENS, schema lỗi không thành 500 chung. Dữ liệu hỏng không bị ghi đè, storage lỗi còn RAM và có tải hội thoại.

Kiểm: typecheck/lint/build đạt; guard liên quan 66/66; integration 8/8; Chrome 4/4 (3 nhóm và ca cha), gồm thiếu khóa không request, hội thoại/câu trả lời/nháp giữ qua reload, Dừng không nhận kết quả muộn. Log và browser-results.json trong thư mục này. Chỉ DB examcraft_test_20261022 đã kiểm SQL/health isolatedTest; fixture đã dọn. Provider trình duyệt giả, không AI thật, không migration/push/deploy.

Chưa đủ Đ1: target nhiều câu/phần/trường; facts có nguồn và vòng hỏi có giới hạn; chuyển hội thoại sang ID server; tạo nhánh yêu cầu mới/cất nhánh; client thu gọn media trước upload; ngân sách SDK/lượt repair; hội thoại khác tab trùng sessionStorage writer. Chưa chạy lại full SAFE/HTTP/mọi viewport sau gói này. Browser mock xác nhận UI/request, không chứng nhận chất lượng model hay nguồn chính thức. Các giới hạn này tiếp tục làm, không coi là đạt toàn bộ yêu cầu tương ứng.

Đợt đầu guard cũ còn mong xoay khóa khi quota; đã đổi fixture sang khóa thực sự invalid theo AC-48 mới, vẫn kiểm đúng owner/model. Tệp tests/ai_policy.test.ts không bỏ ca đó.

Bước tiếp: đề xuất metadata qua allowlist, journal version mới có reader cũ và hoàn tác chung; sau đó bootstrap/tạo cả đề và nghiệm thu. Không dùng bản build này để khẳng định đã có các bước tiếp.
