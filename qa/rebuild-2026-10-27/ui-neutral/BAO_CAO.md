# Giao diện trung tính — 27/10/2026

Yêu cầu chủ dự án: toàn giao diện trắng–xám–đen, bỏ nút xanh nổi bật; thống nhất sáng/tối, giữ dữ liệu và kiểm lại. Thay hướng nhấn màu Google của đợt d973928.

## Phạm vi thực hiện
- Bảng màu dùng chung --ui-* cho nền, bề mặt, outline, chữ, trạng thái chọn và các mức nhấn nút. Không còn tên vai trò --google-blue gây hiểu nhầm.
- Nút chính: sáng than/chữ trắng, tối xám sáng/chữ than; nút tải/xuất/xem/đóng dùng nền trung tính và viền mảnh. Bỏ chuyển màu nền của nút chính khi đảo theme để tránh giai đoạn chữ chìm trên nền trong animation.
- Thay màu nhấn xanh/tím/cyan trong JSX của kho đề, editor, nhập/sinh đề, kế hoạch/mẫu, ngân hàng, chia sẻ/cộng tác, lớp/giao bài/chấm, học sinh/link công khai, login và admin.
- Giảm bo góc và bóng; bỏ gradient, hover phóng to và pulse trang trí; giữ loading spinner và cảnh báo thời gian/lỗi có ý nghĩa. Các thẻ tác vụ và mục đang chọn dùng cùng thang xám.
- Chưa có key AI là hướng dẫn trung tính, không tô vàng hay nảy biểu tượng. Không làm mất thông tin trạng thái/lỗi thật. Giữ màu đỏ/vàng/xanh lá của thông báo lỗi/cảnh báo/thành công có ý nghĩa và nội dung chấm bài.
- Màu thư mục mặc định mới và lựa chọn mới là thang xám; không sửa màu đã lưu do người dùng chọn. Không grayscale ảnh/đồ thị hoặc nội dung đề. Giấy A4 vẫn trắng/chữ in giữ nguyên quy tắc in.

## Bảo toàn
Không API/schema/migration/quyền/thuật toán lưu hay chấm; không sửa .env, khóa, backup hoặc DB chính. Kiểm ghi chỉ qua guard DB examcraft_test_20261022 và health isolatedTest. Không AI/provider thật. Chỉ dùng tài khoản/tệp đề giả riêng đã có; các luồng runner tự dọn theo ID. Không push/reset/clean, giữ scratch và QA có sẵn.

## Bằng chứng
- source-audit.json: AST trước/sau sau khi che className, literal kiểu utility và literal màu hex không đổi phần còn lại ở các tệp JSX đã sửa. Đây là rà phạm vi mã, không thay thế kiểm thực tế hay bảo đảm chất lượng hiển thị.
- palette-audit.json: các biến --ui-* được tham chiếu đều được khai báo.
- Kiểm kiểu: typecheck.log; lint cuối: lint-final.log. Đã đạt, lint còn 156 cảnh báo có sẵn, 0 lỗi.
- build.log là mốc đầu; build-final.log là bản cuối sau sửa hướng dẫn key và animation đảo theme.
- browser-evidence.json và PNG: các ảnh đầu là mốc rà, có thể bắt đúng lúc animation đổi theme đang chuyển. Kết quả FINAL là bản chứng nhận sau sửa và không dùng ảnh trung gian để kết luận.

## Kết quả kiểm cuối
Đã hoàn tất kiểm trong phạm vi UI, chi tiết và giới hạn ở phần kết quả cuối dưới đây. Chưa tổng nghiệm thu.

## Kết quả kiểm cuối — đạt trong phạm vi đợt UI
- Build cuối exit0, CPU1/heap1024; build ID `z51xd6hU6BLvkhFZ0RCaL` (build-final.log).
- Chrome cài sẵn, runner kiểm health isolatedTest và DB thử chính xác trước ghi: F2 soạn/lưu/mở lại7dạng, F15 in60câu A4, F19 kho/ngân hàng, F6 học sinh làm7dạng/tải lại/nộp đều PASS trong lượt riêng trên cùng bản build; bốn log pilot-F*.log. Không đổi assertion/test để lấy PASS; lần này F2 đạt ngay. Không phải toàn bộ CI.
- Kiểm trực tiếp qua IAB: login; kho đề; editor; ghi chú AI; hộp khóa (không nhập khóa/call provider); admin users sáng/tối, admin AI/keys; lớp/bài giao. Ảnh FINAL-* và final-browser-evidence.json là bằng chứng cuối.
- Nút chính sáng rgb(32,33,36)/chữ trắng; tối rgb(227,227,227)/chữ than. Nút phụ nền trắng/than và viền xám. Các nút/lựa chọn/links đã quan sát không còn màu xanh. Không dùng CSS grayscale/filter phủ lên nội dung.
- Chế độ sáng/tối trong các bản FINAL đúng nhãn; kiểm geometry ở375x667 không tràn ngang. Header kho đề/editor/admin nằm trong khung; admin cuộn đến scrollY984.8/max985, header vẫn top0. Giấy A4 trắng.
- Hai ảnh ghi chú/hộp khóa đã kiểm cả hai chế độ. Viewport đã reset; theme cuối giữ tối như đầu đợt. Một vài capture trung gian trong browser-evidence.json bắt lúc theme hoặc navigation đang chuyển, không dùng làm chứng nhận; final-browser-evidence.json lấy bản cuối mỗi nhãn. Bộ lọc màu RGB không tự phân tích Oklch: thông báo trạng thái còn màu được ghi riêng; có kiểm mã và hình ảnh, không suy đạt chỉ từ bộ lọc.
- Màu thư mục cũ do người dùng chọn có thể còn (ví dụ đỏ trong dữ liệu thử); giữ nguyên dữ liệu đó. Màu mặc định/lựa chọn mới là xám. Các màu lỗi/cảnh báo/thành công và nội dung hình/đồ thị có ý nghĩa vẫn được phép.

## Giới hạn và trạng thái vận hành
Không chạy toàn bộ HTTP/SAFE/CI hoặc Word/in giấy; chưa kiểm mọi tổ hợp dữ liệu/hộp thoại/thiết bị thật. Chỉ kết luận các kiểm nêu trên; không tự đóng CV hoặc tổng nghiệm thu. Không mở rộng tính năng.
Trước đợt có server thử production3117 đang chạy. Sau khi kiểm, để lại server thử trên bản mới cho chủ dự án xem; LOCK_3117 giữ USER, tránh AI khác build đè `.next` khi người dùng đang xem. Chỉ dùng dữ liệu thử ở địa chỉ này. Không mở/ghi DB chính. Các đầu ra runner ở qa25 và scratch giữ nguyên, không gom vào commit giao diện.

