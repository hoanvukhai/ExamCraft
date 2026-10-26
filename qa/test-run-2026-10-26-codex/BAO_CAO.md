# Báo cáo kiểm giao diện — 26/10/2026 — Codex

Trạng thái: ĐANG THỰC HIỆN, chờ môi trường dùng chung kết thúc CI. Không phải nghiệm thu.

## Môi trường và phạm vi
- Chỉ http://127.0.0.1:3117; health trả status=ok, isolatedTest=true trước khi tạo dữ liệu/thao tác.
- Trình duyệt tích hợp ChatGPT (IAB); chưa phải kiểm đối chiếu Chrome/Edge.
- Tài khoản riêng test-codex-admin-1026, test-codex-gv1-1026, test-codex-gv2-1026 tại examcraft.test, chỉ trong DB thử examcraft_test_20261022. Không đặt lại gv1/gv2 chung. Mật khẩu ngẫu nhiên không ghi báo cáo/tệp.
- Các tài khoản này có mustChangePassword=false để kiểm luồng sản phẩm. Chưa kiểm màn đổi mật khẩu khởi tạo; không suy đạt các dòng đó.
- Bản production lúc bắt đầu có BUILD_ID sửa lúc 13:04 ngày 26/10. HEAD lúc chuẩn bị edcc686. Sau đó có CI khác build lại: không trộn kết quả hai bản mà không nêu rõ.
- Không sửa mã, không gọi provider thật, không mở/sửa .env hoặc backups. Helper được giao tự nạp cấu hình trong tiến trình, không xuất bí mật. Không ghi DB chính.

## Đã quan sát
- T01-01: Đăng nhập tài khoản; EMAIL GIÁO VIÊN / QUẢN TRỊ; MẬT KHẨU; Đăng nhập hệ thống.
- T01-02: hiện mật khẩu giả wrong-test-password; Enter trên nút Ẩn mật khẩu chuyển lại Hiện mật khẩu và che giá trị. Một lần truy vấn locator theo tên cũ không tìm thấy sau khi đổi nhãn; đã dùng trạng thái mới và kiểm lại, không coi là lỗi sản phẩm.
- T01-03: Email hoặc mật khẩu không chính xác; vẫn ở /login.
- Bằng chứng chữ: evidence.json. Không chép mật khẩu thật/giả của tài khoản vào bằng chứng.
- T10-08: kiểm tài liệu riêng, 161 ô, 25 môn, phạm vi khớp bảng 9A, Người duyệt: chưa có; T10-08-doc-evidence.json. Chưa thay thế kiểm dropdown UI.

## Sự cố môi trường
Đăng nhập đúng thì giao diện báo Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng. Máy chủ thử đã dừng (session 72455 exit 1); health bị từ chối kết nối. Đồng thời thấy npm run ci / scripts/ci.cjs PID 28180 đang chạy rồi chuyển build/HTTP/pilot. Chưa biết nguyên nhân server dừng; không kết luận lỗi đăng nhập. Ảnh: anh/MOI_TRUONG-server-dung.png.
Không khởi động chồng, không dừng CI của người khác. Đã gửi tin phối hợp. Các dòng còn lại giữ trống, chưa ghi Đ/K giả.

## Việc tiếp theo
Sau khi CI khác xong, mở server thử riêng, xác minh health, ghi mốc build mới; đăng nhập bằng tài khoản giả đã tạo rồi tiếp tục phần 01–09 theo phạm vi AI. Không chạy lại helper vì chỉ tạo mới, không ghi đè tài khoản. Các phần chuyên môn/in giấy/điện thoại thật cần người kiểm, không suy từ test máy.
