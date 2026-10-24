# Giao diện chia sao lưu, JSON lỗi và IndexedDB thật — 23/10/2026

Tiếp nối [BACKUP_LIMITS](BACKUP_LIMITS.md). Chỉ tài khoản giả/DB `examcraft_test_20261022` và origin IndexedDB QA riêng; không ghi DB chính, thay schema, đổi bí mật hoặc gọi AI.

## Giao diện đã kiểm

1. Chạy bản build `y2-iNGvWM3oaX2Gz81aqr` trên server cô lập3117, đăng nhập lại fixture2. Script `scripts/qa-backup-partitions.cjs` kiểm health `isolatedTest=true` trước ghi, thêm94đề rỗng giả với mã cố định; kho thử có tổng101đề. Script không xóa đề hay ghi đè bản đã nhập.
2. Mở **Sao lưu · Nhập kho cũ**, bấm chuẩn bị sao lưu. UI hiện2tệp/101đề/5ảnh và hai liên kết **Tải phần1/2 (100đề)**, **Tải phần2/2 (1đề)**. [Ảnh UI](backup-parts-ui.png).
3. Tải phần2 bằng khả năng downloadMedia trên chính liên kết hiển thị; nhận tệp thật ở Downloads. Bản nguyên byte giữ tại [backup-ui-downloaded-part-002.json](backup-ui-downloaded-part-002.json), [metadata/hash](backup-ui-downloaded-part-002-meta.json). Không tạo tệp bằng script để thay bằng chứng tải UI.
4. Chọn lại chính tệp vừa tải bằng file chooser: UI xem trước0sẵn sàng/1đã chuyển/0lỗi. Chọn checkbox, nút nhập cũ bật. Sau đó chọn `corrupt-backup-fixture.json`: hiện thông báo JSON lỗi bằng tiếng Việt; nút nhập và checkbox cũ đều không còn trong DOM. Không bấm nhập ở vòng này. [Ảnh UI lỗi](backup-corrupt-after-preview-ui.png).

Không tải/chọn lại phần1 ở đợt này; không nhận toàn bộ vòng khôi phục101đề đã qua UI. API xem trước100+1 có bằng chứng đợt giới hạn trước. Chưa thử browser với tổng kho>30MB hay đo bộ nhớ. File chooser/download của công cụ có lúc mất nhiều phút dù timeout cấu hình ngắn; đây là giới hạn thao tác kiểm, không suy ra thời gian phản hồi sản phẩm.

## IndexedDB thật

Thêm harness `scripts/qa-indexeddb-server.cjs` và entry trong thư mục QA. Bundle gọi trực tiếp các hàm production trong `src/lib/db.ts`; không sao chép thuật toán để test lại bản mô phỏng. Server chỉ bind127.0.0.1:3121, không đọc `.env`, không có API PostgreSQL, CSP chặn kết nối mạng của trang. Origin khác3117/các origin ứng dụng nên IndexedDB/localStorage tách biệt; harness từ chối kho không có marker QA nhưng đã có dữ liệu.

Bấm nút chạy trên trang thật qua browser, bốn nhóm đều PASS:

- Có sẵn đề/câu cùng ID: giữ nguyên nội dung cũ trong IndexedDB, chỉ thêm ID thiếu vào cả hai store; nhập lại thêm0mục.
- Hook thử cố ý làm ghi câu hỏi thất bại sau thêm đề trong cùng giao dịch: lỗi được trả ra, đề vừa thêm cũng rollback; bản có sẵn không đổi.
- Export đọc IndexedDB cùng ba nguồn localStorage lịch sử; giữ hai bản cùng ID khác nội dung, kèm nháp hiện tại; không thay byte nguồn localStorage.
- Collection câu hỏi null bị từ chối trước ghi, không thêm một phần đề.

[Kết quả đọc từ DOM](indexeddb-browser-verification.json), [ảnh trang thật](indexeddb-browser-ui.png). Đây là kiểm thư viện local trên IndexedDB thật; chưa thay nghiệm thu toàn bộ UI chuyển kho hoặc race giữa hai browser/thiếu dung lượng/abort trình duyệt. Dữ liệu QA được giữ, không gọi deleteDatabase.

## Chặn cùng mã khác nội dung khi nhập server

Export giữ được các bản khác nội dung, nhưng API cũ dùng mã nguồn để chống nhập lặp nên có thể nhập bản đầu rồi coi bản sau là đã chuyển. Bản sửa dò toàn bộ nhóm trước xử lý: trong cùng lượt nhập, nếu cùng ID nhưng khác nội dung, mọi thành viên nhóm đều báo lỗi và không được nhập; đề/câu khác vẫn xử lý bình thường. So sánh bỏ qua thứ tự khóa object, giữ thứ tự phần tử mảng, không sửa dữ liệu nguồn. Không tự ghi đè hay tự ghép hai bản.

Phạm vi phát hiện hiện tại là **trong một request**, tách đề và câu ngân hàng. Chưa có so sánh fingerprint nguồn giữa nhiều tệp/lượt nhập khác nhau; mục đã chuyển theo ID vẫn được bỏ qua để giữ sửa đổi của giáo viên trên server. Chưa có UI tách các biến thể thành bản sao; thông báo hướng dẫn giữ nguồn và tạo mã riêng. Không tuyên bố giải quyết hết xung đột nguồn CV-014/015.

## Xác minh bản sửa và tiếp nối

Xem [kết quả đợt](browser-idb-verification.json) và log được liên kết ở đó cho kết quả build/SAFE/API cuối. Lượt kiểm từng bị gián đoạn do hết hạn mức duyệt công cụ; sau người dùng yêu cầu tiếp tục đã chạy lại, không nhận lần bị chặn là đã kiểm.

CV-014/015/072 vẫn mở. Tiếp theo cần đường xử lý biến thể dễ dùng/so sánh nguồn giữa nhiều lượt; kiểm UI nhập kho local thực tế; restore vận hành DB+tệp trên bản phục hồi cô lập; offline và nhiều browser theo checklist. Không lặp UI ảnh một tệp chỉ vì giới hạn confirm cũ đã được giải quyết.
