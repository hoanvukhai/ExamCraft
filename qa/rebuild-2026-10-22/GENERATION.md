# Sinh bản nháp và duyệt thay đổi — 22/10/2026

## Hợp đồng mới

Soạn AI dùng số câu riêng cho đủ7dạng: lựa chọn, đúng/sai, trả lời ngắn, tự luận, điền khuyết, ghép nối và sắp xếp. Ba dạng bổ sung nằm trong mục thu gọn để màn hình ban đầu dễ đọc. Tất cả mặc định bổ sung bằng0; tổng từ1đến100. Mỗi dạng phải có đúng số câu đã yêu cầu, không tự thêm dạng khi giáo viên để0.

- Điền khuyết v1 dùng một ô trả lời, có đáp án hoặc các cách trả lời được chấp nhận khi chấm điểm.
- Ghép nối có ít nhất hai cặp, mỗi cặp đủ hai vế và mã riêng. Dữ liệu đúng được giữ cho giáo viên; luồng public dùng thành phần hiển thị tách đáp án đã có.
- Sắp xếp có ít nhất hai mục theo thứ tự đúng. Luồng làm bài dùng danh sách đã đảo thay vì phát nguyên thứ tự đáp án.
- Câu có mã kiến thức phải nằm trong phạm vi gói/phiên bản; gói chờ duyệt không được tự thành chuẩn chính thức.
- Khảo sát không ép đáp án đúng/điểm đối với câu trả lời. Matching/ordering vẫn cần cấu trúc các mục để hiển thị; không dùng cấu trúc này chứng nhận một khảo sát có đáp án đúng.

## Bảo vệ đề đang soạn

Kết quả AI trở thành đề xuất trong hộp thoại: đọc câu, đáp án/lời giải và tiêu chí; chọn áp dụng, bỏ hoặc tải JSON. Chưa bấm áp dụng thì đề hiện tại chưa thay đổi. Áp dụng thay bộ câu/ngữ liệu/cấu trúc phần theo bản mới nhưng giữ tên đề, trường/tổ, năm học, học kỳ, mã đề và ghi chú giáo viên đã đặt. ID đề, phiên bản server, quyền và thời điểm tạo gốc được giữ.

Đề xuất gắn dấu nội dung của bản nền. Khi câu, tiêu đề, phạm vi, ngữ liệu hoặc phần đã thay đổi trong lúc chờ, không áp dụng kết quả cũ. Một lần xác nhận lưu chỉ đổi version/thời điểm không tự gây xung đột nội dung. Giáo viên có thể tải đề xuất để không mất kết quả rồi soạn lại từ bản hiện tại.

Đóng hộp thoại ngừng nhận kết quả bằng hủy yêu cầu phía trình duyệt và số thứ tự yêu cầu. Không hứa hoàn tác chi phí ở nhà cung cấp: yêu cầu đã gửi có thể vẫn được xử lý. Route kiểm tài khoản kỳ vọng trước đọc kế hoạch hoặc dùng key, chặn tab cũ gửi tác vụ dưới tài khoản vừa chuyển sang.

## Kiểm chứng và phần chưa đạt

- Test helper dùng phản hồi JSON giả để kiểm đủ7dạng/số câu0, thiếu hoặc trùng cặp, thứ tự thiếu mục, điền khuyết thiếu đáp án, khảo sát và tổng vượt100.
- Test áp dụng đề xuất kiểm giữ tiêu đề riêng, thông tin trường, ghi chú/ID/version và từ chối nội dung đã sửa sau yêu cầu.
- HTTP có ca chặn tài khoản đổi và tổng kế hoạch7dạng vượt100; dừng trước mọi lệnh gọi AI. Kết quả chạy cuối cập nhật tại TESTING.
- Chưa dùng key thật, chưa chứng minh chất lượng hoặc tỷ lệ thành công của nhà cung cấp với7dạng. Không gọi mẫu JSON giả là bài do AI thật tạo.
- Chưa nghiệm thu qua trình duyệt việc nhận đề xuất thật/hủy khi nhà cung cấp đang chạy. Cần phiên nghiệm thu AI có hạn mức do chủ dự án chốt, hoặc máy chủ giả nhà cung cấp riêng trong kiểm thử sau.
- Ma trận phân bổ điểm/kiến thức đầy đủ, tái sinh từng slot có giới hạn, lưu vết model/prompt và rà nội dung chuyên môn còn thuộc CV020/034/036–038. Không đánh dấu hoàn thành chỉ nhờ validator.

## Kết quả cuối đợt

Build94176/typecheck/lint định hướng đạt; SAFE20+101, HTTP14/14 đạt. Giao diện mở đúng từ kho và bàn soạn; chọn ba dạng mới, các dạng cũ bằng0, tổng3câu đúng. Đã đóng mà không gọi AI; ảnh generation-seven-types.png. Bước nhận/áp dụng đề xuất thật vẫn cần nghiệm thu như giới hạn nêu trên. Xem generation-verification.json.
