# CDX-R2 — kho đề trên trình duyệt

## Đã làm
F19 tạo4đề riêng của giáo viên giả, tìm theo tên, dùng nhãn thật desktop: Đề quan trọng (Gắn sao), Đã sửa gần đây, Thùng rác. Kiểm star/trash/restore bằng UI và DB, mở đề đúng nội dung rồi quay lại vẫn giữ đủ đề. Kiểm xem thẻ/danh sách, đổi giao diện sáng/tối, tải Word thực và XML, đổi tên, nhân bản, tạo/chuyển thư mục.

Mở/đóng các nút khóaAI ở header/rail, ghi chú riêng, ngân hàng, sinh/nhập (chỉ mở), thư ký header/rail; chưa triển khai thì có thông báo phát triển, không giả thành công. Kiểm nút tạo đề mới rồi quay lại giữ các đề nguồn. Inventory từng nút hiển thị và nhóm hành vi đã bấm trong library-ui-<run>.json, liên kết qua r2-evidence.json. Không gửi promptAI hoặc nhập/xóa key; không xóa thư mục. Điều hướng lớp/bài giao là link và đã có luồng riêng.

## Lỗi và sửa
- Nút Thêm vào đề trong ngân hàng từ dashboard gọi callback rỗng nhưng vẫn báo Đã thêm. Dashboard nay đặt allowInsert=false, hiển thị Mở đề để chèn/khóa nút; từ editor mặc định vẫn chèn được. F19 nạp4câu mẫu giả vào kho riêng và kiểm4nút đều khóa, không hiển thị thành công giả.
- Hộp ngân hàng không đóng ổn định sau khi mở các hộp khác; phát hiện ngân hàng và key có cùng Reactkey userID ở cùng cấp. Tách bank:userID và keys:userID ở dashboard/editor, giữ cô lập tài khoản. Sau sửa chuỗi mở/đóng và toàn luồng đạt3lầnliêntiếp.
- Lần test đầu dùng helperbutton cho link Về kho đề, đã sửa đúng rolelink; các probe trước giữ trong log. Không tăng timeout để che lỗi.

## Bằng chứng
Ca thật: F19 library search, starred, recent, trash, restore and safe controls. r2-f19-final-1.log đến3.log đều đạt; r2-evidence.json gắn sourcehash/buildID và run riêng. Build đạt r2-modal-keys-build.log. Chỉ DBthử/healthisolatedTest, fixture tựdọn, khôngAIthật. Hồi quy HTTP và toàn bộbrowser sauR1/R2 đang chạy, chưa kết luận ở đây.

## Giới hạn
Gần đây dùng sắp xếp cập nhật của API, không hứa bộlọc theo một số ngày cụ thể. Inventory kiểm các nút an toàn của trang kho; không gửi tác vụ AI, sửa khóa hoặc làm thao tác nguy hiểm để bao phủ bằng mọi giá. Một số nút đóng/color chưa có tên truy cập đầy đủ; đã thêm nhãn đóng ngân hàng. R2 không tự đóngCV015/028; chờClaude duyệt.

## Hồi quy tích hợp
Bản cuối đạt Typecheck → Lint → SAFE425/425 quaCIquick (r2-ci-quick.log); HTTP99/99 (r1-r2-http.log) và browser18/18 (r1-r2-pilot-all.log). F19triple và bộđầyđủ cùng buildID trong manifest/evidence. Không còn lỗi đóng ngân hàng khi key được tách đúng. Các schema/điểm/chính sách giữ nguyên, dữliệu fixture dọn xong. ChờClaude duyệtR2.
