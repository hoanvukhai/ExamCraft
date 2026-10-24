# Nguồn trùng mã qua nhiều lượt và khôi phục DB+tệp — 23/10/2026

## Kết quả

Đã xử lý đối chiếu nguồn qua nhiều lượt nhập và đường tạo bản sao có xác nhận. Đã khôi phục bản hiện tại của DB chính, toàn bộ tệp `public` và cấu hình cần giải mã vào đích mới: **24 bảng khớp số hàng/hash, 6 tệp khớp SHA256, cấu hình khôi phục đúng và 1 khóa AI mã hóa giải mã được**. Dữ liệu DB chính, tệp public và `.env` không đổi qua lần kiểm. Không gọi nhà cung cấp AI, đổi schema, chuyển ứng dụng hoặc xóa bản nguồn.

[Bằng chứng nhập](cross-import-verification.json), [bằng chứng phục hồi](full-restore-verification.json). Build/typecheck44trang, SAFE20+118=138 và HTTP16/16 đạt. Integration7/7 kế thừa đợt trước. ESLint helper nhập và hai tệp test sửa đạt; không nhận lint toàn repo sạch.

## Nhập lại nguồn và bảo vệ sửa đổi trên server

Mỗi lần nhập mới lưu dấu SHA256 của nguồn trong snapshot lịch sử đầu tiên của đề/câu (`_legacyImport`, phiên bản1), cùng giao dịch tạo tài liệu. Không thêm bảng hay sửa schema. Dấu thuộc server, không tin dấu người dùng tự gửi; không chứa API key. Thứ tự khóa JSON và các trường thời gian/phiên bản/quyền/mã ở gốc không làm thay dấu; nội dung, đáp án, điểm và thứ tự câu vẫn được phân biệt.

- Cùng nguồn: báo đã chuyển, không ghi đè dù giáo viên đã sửa bản server sau nhập.
- Cùng mã nhưng nguồn khác: báo lỗi và cho **Xem trước các bản sao riêng**. Bản cũ trước khi có dấu hoặc mất dấu được xem là chưa xác minh; không tự nhận giống hay tự bổ sung dấu dựa trên bản hiện tại.
- Khi chọn bản sao: vẫn phải xem trước và xác nhận quyền nhập. Đề mới có hậu tố **(Bản nhập riêng)**, mã bản sao suy ra từ tài khoản/loại/mã nguồn/dấu nguồn; nhập lại cùng biến thể không tạo thêm bản nữa, kể cả khi không bật lại tùy chọn bản sao.
- Nhiều biến thể cùng lượt cũng có thể xử lý qua lựa chọn bản sao. Đề và câu ngân hàng được tách miền mã. Các mục lỗi khác vẫn giữ lỗi, không bị tùy chọn này bỏ qua validator hay quyền.
- Giao dịch khóa theo mã nguồn bằng advisory lock PostgreSQL, kể cả khi bản đầu chưa tồn tại: hai request khác nội dung cùng đến không chọn bản đầu rồi âm thầm bỏ bản kia. Một bản được tạo, bản còn lại báo xung đột; người dùng có thể tạo bản sao.

Nếu chính bản sao xác định theo dấu đã tồn tại nhưng mất dấu đối chiếu, hệ thống dừng thay vì ghi đè hoặc liên tục tạo bản không truy vết. Trường hợp sửa tay/xóa dấu lịch sử cần kiểm và tạo nguồn có mã riêng; chưa có công cụ sửa lịch sử tự động. Không tự ghép nội dung, không tự công nhận đáp án đúng.

### Đã kiểm API và UI

HTTP trên DB thử `examcraft_test_20261022`: nhập A → giáo viên sửa server → nguồn B cùng mã qua request sau bị từ chối ở cả preview/import; chọn bản sao tạo B đúng đáp án, giữ nguyên A đã sửa và số revision A. Retry B thêm0. Câu ngân hàng kiểm tương tự. Mô phỏng bản cũ thiếu dấu: báo cần đối chiếu, nhập được bản sao có mã khác. Hai request A/B đồng thời: chỉ một bản nền, nguồn còn lại báo xung đột rồi tạo được bản sao. Mục lỗi, resume, tài khoản và nhập100+1 vẫn qua hồi quy. [Log](http-cross-import.log).

UI trên build mới `lOm4oDENdPsYrIuh__aZb`, tài khoản QA2: chọn fixture1đề cũ thiếu dấu +1đề lỗi →0sẵn sàng/2lỗi và hiện nút bản sao. Bấm nút →1sẵn sàng/1lỗi, checkbox được bỏ chọn/nút nhập khóa. Xác nhận và nhập →1bản sao mới/1lỗi, tên hậu tố hiện trong kho. [Xung đột](cross-import-conflict-ui.png), [kết quả tạo bản sao](cross-import-copy-ui.png). Không chọn tệp lại chỉ để thử lần nữa; file chooser công cụ có lần mất khoảng19phút dù cấu hình timeout ngắn. Không suy thời gian đó là thời gian sản phẩm xử lý JSON.

## Khôi phục đầy đủ dữ liệu local hiện có

Script mới `scripts/verify-full-restore.cjs` mặc định dry-run; `--execute` chỉ nhận nguồn local `examcraft` trên container `examcraft_postgres`, cổng5436. Mỗi lần tạo thư mục và DB `examcraft_restore_full_<timestamp>` hoàn toàn mới; từ chối đích tồn tại, không drop/reuse. Bản đạt ở **examcraft_restore_full_20261023085454302**; backup trong `backups/full-restore-20261023085454302` (được Git ignore).

1. Chụp số hàng/hash tất cả24bảng public, gồm bảng migration; kiểm nguồn tệp không có symlink. Dump custom binary bằng pg_dump và kiểm native exit code/kích thước/list archive trước restore.
2. Sao chép đủ6tệp public vào gói backup rồi vào thư mục phục hồi rỗng; đối chiếu tên/kích thước/SHA256 toàn bộ.
3. Bảo vệ nội dung `.env` bằng Windows CurrentUser DPAPI, sao chép bản mã sang đích và giải mã lại trong RAM, đối chiếu byte cấu hình. Không ghi `.env` rõ vào bản phục hồi hoặc báo cáo.
4. Tạo DB trống mới và pg_restore với exit-on-error/single-transaction; số hàng/hash mọi bảng khớp nguồn trước sao lưu. Dump70.040bytes và SHA256 nằm trong bằng chứng.
5. Dùng cấu hình phục hồi giải mã khóa mã hóa thật trong DB phục hồi, so sánh trong RAM với giải mã theo cấu hình gốc:1khóa đạt/0khóa không xác minh. Thêm canary mã hóa độc lập để kiểm đường mã hóa/cấu hình; không thử gọi API nhà cung cấp.
6. Kiểm lại DB chính, public và cấu hình nguồn không đổi. Inventory các hình liên kết trong DB hiện tại không có đường local thiếu, URL remote hoặc blob; DB chính hiện không có hình liên kết để kiểm mở trên app. PNG QA280bytes thuộc cây public được sao chép đủ; bằng chứng vòng ảnh gắn đề nằm ở đợt QA trước, không gộp hai việc thành một ca.

Ba lần đầu dừng ở bước bảo vệ cấu hình do Windows PowerShell5 không tìm thấy cmdlet trong môi trường module hiện tại. Đã đổi sang `pwsh`7 đang dùng và hoàn tất; thư mục tạo dở giữ nguyên, chưa có DB đích được tạo trong các lần đó. Không coi lần lỗi là backup thành công. Chẩn đoán chỉ ghi giai đoạn/loại lỗi, không in nội dung cấu hình hay khóa.

### Cách chạy lại và giới hạn vận hành

`node scripts/verify-full-restore.cjs` xem phạm vi; `node scripts/verify-full-restore.cjs --execute` tạo một bộ kiểm mới. Cần Docker/container đúng và PowerShell7. Nên giữ ứng dụng yên trong lúc lấy bản sao; script từ chối chứng nhận nếu nội dung nguồn thay đổi qua cửa sổ kiểm. Đây không là cơ chế snapshot nguyên tử DB+tệp khi hệ thống đang ghi liên tục.

DPAPI cần cùng danh tính Windows/máy; chưa là gói di chuyển secrets sang máy khác. **Không khởi động app trực tiếp bằng cấu hình phục hồi chưa thay DATABASE_URL**, vì nó vẫn chứa URL nguồn để đối chiếu nguyên trạng. Đích DB được tạo sẵn để kiểm; chưa khởi động/cutover app vào bản này hoặc nghiệm thu RPO/RTO. `.next`/node_modules/source không nằm trong gói dữ liệu; code vẫn ở workspace/Git/baseline đã giữ, có thể build lại.

Không dùng script `restore.ps1` cũ để restore đè DB chính. Script cũ/retention tự xóa chưa được thay thế trong đợt này; CV-072 vẫn mở cho đường restore từ backup đã chọn, chuẩn hóa entrypoint cũ/retention và diễn tập ứng dụng. Không tự xóa bản phục hồi hoặc backup đã tạo để dọn dung lượng.

## Tiếp nối

Giữ CV-014/015 mở cho nghiệm thu kho tổng thể/câu rời có ngữ liệu/khối lượng lớn. Giữ CV-072 mở cho vận hành như trên; phần kiểm DB+tệp+cấu hình trên bản rỗng hiện có bằng chứng đạt, không lặp chỉ vì ghi chú cũ. Bước hợp lý tiếp theo: chuẩn hóa công cụ restore/retention an toàn và kiểm app từ bản phục hồi với URL đích rõ ràng, rồi tiếp các luồng offline/quyền theo checklist. Server QA3117đã dừng; tab4giữ kết quả bản sao để tiếp nối.
