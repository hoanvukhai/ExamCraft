# Giao diện nhập và khôi phục ảnh —23/10/2026

**Đã tiếp nối:** [IMPORT_UI_ROUNDTRIP](IMPORT_UI_ROUNDTRIP.md) xác nhận thành công checkbox→nhập→mở, tải tệp thật→nhập lại→hiển thị ảnh. Chặn native confirm dưới đây là lịch sử; không còn là trạng thái mới nhất.

Phạm vi CV014/015/072. Kết quả: **khôi phục ảnh bằng helper sản phẩm + API đạt, ảnh đã hiển thị trên browser; vòng nhập/xuất trọn vẹn bằng nút UI chưa hoàn tất**. Không đánh dấu nghiệm thu toàn bộ backup/restore.

## Thay đổi

- Nút **Sao lưu · Nhập kho cũ** ở bàn soạn gọi modal đã có. Trước đó callback được truyền nhưng không có nút sử dụng, nên đường nhập khó tiếp cận.
- Bản sao kho đề formatVersion2 dùng `portableExamBackup`: đọc ảnh image/geometry trong câu và ngữ liệu bằng quyền browser, nhúng nguyên byte thành data URL cho cả nguồn hiển thị và fallback. Gộp việc tải cùng URL; không sửa đề nguồn. Đồ thị/bảng biến thiên vẫn giữ dữ liệu cấu trúc. Không dùng proxy server tải ảnh hộ người dùng.
- Ảnh thiếu/tải lỗi/định dạng không hỗ trợ/rỗng/vượt2MB sẽ báo lỗi trước tạo bản sao. Giới hạn15MB mỗi đề vẫn được kiểm. PNG/JPEG/GIF/WebP được hỗ trợ; ảnh cross-origin cần quyền CORS. Không bảo đảm sửa được ảnh nguồn đã hỏng hoặc URL đã hết hiệu lực trước khi sao lưu.
- Chọn tệp mới xóa preview cũ trước parse; JSON lỗi không giữ nút nhập của tệp trước. Chặn tệp quá30MB. Kết quả phân biệt số mục vừa nhập với mục đã chuyển trước đó. Kho lớn chưa chia tự động; cần kiểm và xử lý trường hợp tổng tệp xuất vượt30MB trước nghiệm thu chung.
- Đổi xác nhận nhập từ `window.confirm` sang checkbox trong vùng xem trước, mặc định chưa chọn. Chỉ bật nhập khi giáo viên xác nhận quyền sử dụng; preview mới bỏ lựa chọn cũ. Tránh hộp thoại native và giúp nhìn rõ nội dung đang chốt.

## Đã kiểm

1. [safe-images-tests.log](safe-images-tests.log):20ca cũ +112ca bổ sung =132đạt. Hai ca mới kiểm nguyên byte ảnh, gộp tải nguồn, ảnh câu/ngữ liệu, nhập lại không cần URL cũ và lỗi thiếu/quá lớn/sai định dạng/blob URL; nguồn không bị thay. Suite portable10/10 đạt. SAFE chạy trước đổi checkbox; helper không đổi sau đó.
2. [build-images.log](build-images.log): bản cuối `SGTJQx2t-8IblKafS7nGO`,44trang/TypeScript đạt, gồm checkbox mới. Lint helper portable và test tương ứng đạt, không phải lint toàn repo/modal.
3. [http-images-tests.log](http-images-tests.log):16/16 trên bản cuối/DB thử. Hồi quy nhập/lưu/quyền/auth; không coi số này là kiểm nút bấm UI.
4. Browser IAB: mở đường mới, chọn [tệp giả](image-import-fixture.json) bằng file chooser; hiển thị1mục sẵn sàng,1mục lỗi dạng câu, trước khi nhập. [Ảnh preview](image-import-preview.png).
5. [qa-image-restore.cjs](../../scripts/qa-image-restore.cjs): xác nhận server isolated-test, đăng nhập tài khoản giả2, nhập fixture qua API; gọi đúng helper sản phẩm tạo [bản sao có ảnh](image-portable-backup.json). Kiểm hash nguồn, chuyển duy nhất PNG QA sang [tệp giữ nguyên](image-source-preserved.png), không xóa. URL nguồn sau đó không còn dùng được (Next trả500 cho đường static đã được đăng ký rồi mất tệp). Nhập archive thành đề khác, đối chiếu PNG phục hồi cùng SHA256 `3cdb8f730abecb5f832ecb0cbbbccaee8ac945ad1d51f1876ba24fb619ba14b7`,280bytes. Giữ điểm0/lời giải; đề nguồn không đổi. [Bằng chứng máy](image-restore-api.json).
6. Mở đề phục hồi trên browser khi URL cũ không còn tệp: ảnh nhúng đã tải đủ160×80, ở cả thẻ câu và xem in. Kiểm thuộc tính DOM của hai ảnh: complete=true, naturalWidth160, naturalHeight80, src là data URL. [Ảnh hiển thị](image-restored-visible.png).

## Chưa kiểm xong trên UI

Lần bấm nhập ở tab3 bản cũ mở native confirm; công cụ báo bị ngắt, API getJsDialog không tìm được dialog và các lệnh sau timeout. Không nhận thao tác đó đã nhập thành công. Đã đổi sang checkbox và build lại. Tab mới mở/đọc được ảnh phục hồi, nhưng thao tác bấm tiếp không tạo thay đổi và không có console error; chưa hoàn tất chọn lại tệp/checkbox/nhập hoặc download bằng UI trên bản cuối. Đã hỏi chủ dự án hủy hộp thoại nếu thấy; sau đó thông báo mở được tab mới, không suy việc đó chứng minh đã gỡ hết chặn tương tác.

Không dùng script thay đổi DOM/localStorage hoặc gọi API giả làm thao tác UI. Bản khôi phục được tạo qua API có kiểm đích, và đã tách bằng chứng đó khỏi browser. [image-ui-import-fixture.json](image-ui-import-fixture.json) và [image-invalid-backup.json](image-invalid-backup.json) đã chuẩn bị để kiểm tiếp; chưa nhận hai tệp này đã chạy hết UI.

## Bảo toàn và tiếp nối

Chỉ tài khoản giả, `examcraft_test_20261022` và PNG mới do script QA tạo; không đụng DB chính, kho browser người dùng thật, mật khẩu thật hoặc key AI. Không xóa PNG nguồn: nó nằm trong thư mục QA có hash. Đề ảnh nguồn vẫn giữ URL cũ để kiểm thiếu ảnh; đề phục hồi dùng data URL. Các bản thử được giữ; server QA đã dừng cuối đợt. Chưa backup/restore vận hành toàn bộ DB+tệp, không thay bí mật mã hóa.

Tiếp theo: giải phóng hộp thoại tab3/nạp lại bản mới rồi kiểm chọn tệp hợp lệ→preview→checkbox→nhập→mở, nhập lặp, chọn tệp hỏng sau preview, tải archive bằng UI và nhập lại. Sau đó kiểm IndexedDB thật, ảnh ngữ liệu/nhiều định dạng/CORS/tổng kích thước, restore DB+tệp đầy đủ. CV014/015/072 tiếp tục mở cùng các việc nháp/quyền còn lại trong checklist.
