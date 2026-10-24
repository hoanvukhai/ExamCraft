# Sửa lỗi bộ kiểm pilot lộ ra

## Gap D — tải Word mã đề có ảnh

- Repro trên production cũ build-draft-ui-final, Chrome cài sẵn, DB thử: xuất Word bàn soạn thành công nhưng mở Trộn4mã rồi tải mã đầu không có download. pilot-shuffle-diagnostic.log ghi pageerror: hình chưa có ảnh để xuất Word.
- Nguyên nhân: ShuffleModal gọi exportExamToDocx trực tiếp, bỏ prepareExportFigures; không bắt lỗi nên không báo trong modal. Dữ liệu nguồn và điểm không đổi.
- Đã sửa: dùng bước chuẩn bị ảnh giống bàn soạn; khóa nút trong lúc xuất và hiển thị lỗi. F3 cuối đã kiểm4tệp mã đủ7câu/media; pilot-complete.log PASS toàn bộ7F. Build mới đạt; không mở Word/in nhiều trang để nhận chất lượng trực quan.

## Phần khác

- Tích hợp b44c0ec thành0f7a29f; chưa tuyên bố duyệt. Đã gửi Claude yêu cầu giữ tương thích mã vào bài cũ (normalize input không so với legacy raw).
- Gap I: script hiện khóa nguồn chính; đã gửi Claude xin quyết định diễn tập nguồn/đích, chưa nới guard, chưa ghi DB chính.
