# Giới hạn tệp sao lưu và kiểm tra đầu vào — 23/10/2026

Tiếp nối [vòng nhập–tải–nhập lại có ảnh](IMPORT_UI_ROUNDTRIP.md). Chỉ dùng fixture và DB `examcraft_test_20261022`; không chuyển/xóa dữ liệu thật, đổi schema, xoay bí mật hoặc gọi AI.

## Đã sửa

Kho xuất trước đây có thể vượt giới hạn của chính luồng nhập: giao diện nhận tối đa 30 MB/tệp và API nhận tối đa 100 đề/lượt. Nay bản sao lưu tự chia theo cả hai giới hạn, tính bằng byte UTF-8 thực tế, giữ nguyên từng đề và thứ tự. Mỗi phần có tên thứ tự riêng và liên kết tải riêng; giáo viên tải đủ rồi nhập lần lượt. Ảnh vẫn nằm trong đề như bản sao lưu nhúng ảnh đợt trước; số ảnh trong mỗi phần được tính lại. Nếu một đề không vừa một tệp, dừng chuẩn bị và báo lỗi thay vì cắt mất nội dung.

Đọc JSON có thông báo tiếng Việt, hỗ trợ BOM, đề đơn, kho cũ và archive v1/v2; từ chối JSON hỏng, collection sai kiểu/null, phiên bản ExamCraft chưa hỗ trợ và số mục vượt giới hạn. Chọn tệp mới xóa preview/checkbox cũ trước đọc; lỗi không còn để lại nút nhập cho bản xem trước cũ. Việc kiểm nội dung từng đề/câu vẫn thuộc API, không nhận client parser là validator chuyên môn.

## Đã kiểm

- 14/14 ca trong `portable_and_exports.test.ts`: gồm 4 ca mới cho parser, UTF-8 sát biên, 101 đề → 100+1, chia theo byte sát biên, giữ đủ nội dung/ảnh, đếm ảnh từng phần, đề quá lớn, archive rỗng và nguồn không đổi. Bản so sánh dùng dữ liệu JSON đã tuần tự hóa vì thuộc tính undefined không tồn tại trong JSON.
- SAFE: 20 ca cũ + 116 ca bổ sung = 136 đạt. [Log](safe-backup-limits.log).
- Build/typecheck đạt. [Log](build-backup-limits.log).
- HTTP 16/16 đạt trên bản build mới. Trong ca nhập cũ, batch 101 đề chưa chia bị API từ chối 400; hai phần đã chia đều xem trước 200/0 lỗi/đủ số mục ready; số đề theo chủ trong DB không thay đổi. Đây là preview thật qua server/PostgreSQL, không ghi 101 đề chỉ để thử giới hạn. Các ca import/resume/quyền/hồi quy hiện có vẫn chạy. [Log](http-backup-limits.log).
- ESLint ba tệp helper/test sửa trong đợt đạt. Không nhận lint toàn repo sạch. Diff-check toàn working tree còn trailing whitespace có sẵn ở `A4Preview.tsx:11`; không sửa ngoài phạm vi.

## Giới hạn và tiếp nối

Không chạy lại UI upload/download dài ở đợt này: vòng một tệp kèm ảnh có bằng chứng đợt trước; UI nhiều liên kết và chọn JSON hỏng sau preview cần kiểm riêng trên bản mới. Không suy unit/HTTP thành nghiệm thu UI. Biên 30 MB được kiểm bằng cùng thuật toán byte với ngưỡng nhỏ trong unit, chưa chạy browser với kho >30 MB hoặc đo áp lực bộ nhớ. Hiện vẫn gom tài liệu/ảnh trong bộ nhớ trước chia; không tuyên bố streaming hay tải kho vô hạn.

Chưa kiểm transaction IndexedDB thật/cùng ID khác nội dung; câu ngân hàng rời có ngữ liệu vẫn bị chặn rõ ràng; chưa thay bản backup/restore vận hành DB+tệp, quyền và bí mật. Integration 7/7 kế thừa đợt trước, không chạy lại vì không đổi dịch vụ DB. CV-014/015/072 vẫn mở.

Bước tiếp: kiểm UI tệp lỗi sau preview và các phần tải, rồi transaction IndexedDB thật với dữ liệu giả; tiếp restore vận hành DB+tệp theo checklist. Server QA đã dừng sau kiểm tra.
