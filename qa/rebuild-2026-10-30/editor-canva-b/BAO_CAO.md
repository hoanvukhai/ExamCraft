# Giai đoạn B — Bố cục in (một phần)

Nhánh `claude/editor-canva-a`. DB thử `examcraft_test_20261022`, không gọi AI thật, không đổi Prisma.

## Đã làm

| Mã | Việc | Kết quả |
|---|---|---|
| TS-7.2 | Dữ liệu `metadata.printLayout` (v2): dòng thí sinh, lời dặn đầu đề, cuối đề, chân trang 3 cột | Xong. Kiểm bằng zod (≤12 khối/vùng, ≤500 ký tự, mã khối không trùng), qua `normalizeExamDocument` |
| TS-7.6/7.7 | Trường tự điền `{Đơn vị} {Trường} {Tên đề} {Môn} {Lớp} {Thời gian} {Năm học} {Học kì} {Mã đề} {Loại bài} {Tổng điểm} {Số câu}` và `{Trang} {Tổng số trang}` (chân trang) | Xong. Dòng chỉ gồm trường trống tự ẩn khi in |
| TS-7.10 | 5 bố cục mẫu (Trường, Bộ, Tiểu học khung điểm, 15 phút, Phiếu bài tập) + Hoàn tác mẫu vừa áp dụng + Về bố cục cố định | Xong, trong bảng trái tab **Mẫu → Bố cục in** |
| TS-7.11 | Chân trang có số trang | Word: trường số trang thật (`PAGE`, `NUMPAGES`) trong footer. Màn hình: "Trang 1/N", N ước lượng theo chiều cao tờ |
| TS-7.12 | Dòng thí sinh kiểu Một dòng / khung Điểm · Lời nhận xét / Không in; chọn mục (Họ tên, Lớp, SBD, Phòng thi, Số mật mã, Giám thị ký) | Xong cả bản xem và Word |
| TS-7.13 | Word đọc dòng thí sinh, lời dặn, HẾT, chân trang từ bố cục | Xong |
| Mã đề trộn | Chân trang từng mã đề hiện đúng `{Mã đề}` của mã đó | Xong (kiểm bằng test đơn vị) |
| `examKind` | Loại bài kiểm tra | Chọn được trong Bố cục in, đi vào `{Loại bài}` |
| TS-7.14 | Đề chưa có `printLayout` | In **giống bản cũ** (dòng thí sinh, HẾT cố định, không footer). Kiểm: không có footer, có đủ các chuỗi cũ. Chưa so DOCX từng byte với bản trước |
| TS-7.4 | Bấm vào dòng thí sinh/cuối đề/chân trang trên tờ đề | Mở tab Mẫu |
| TS-7.4 | Bấm một dòng đầu trang trên giấy (Môn, Mã đề, Năm học…) | Mở Thông tin đề và đặt con trỏ đúng ô |
| TS-7.1/7.2 | Thông tin đề: Cơ bản (Tên đề, Lớp, Môn, Cách đánh giá, Thời lượng) → Thông tin in (Đơn vị, Trường, Năm học, Học kỳ, Mã đề, Ghi chú) → Yêu cầu ra đề (khung mức) | Xong; dấu `*` ở Tên đề, Lớp, Môn, Cách đánh giá |

## Chưa làm / lệch so với đặc tả

- Đầu trang **không** chuyển sang v2: `headerLayout` v1 (trái/phải) giữ nguyên; ba cột đầu trang, `headerScope`, khối tiêu đề toàn ngang chưa làm. Vì vậy bố cục mẫu chỉ thay phần dòng thí sinh, lời dặn, cuối đề, chân trang.
- Chưa có tuỳ chọn trang (phông, lề, cột phương án, đánh số câu), chưa lưu bố cục vào "mẫu của tôi" (`ExamTemplate`).
- Chưa sửa trực tiếp chữ ngay trên giấy (bấm dòng thí sinh/cuối đề/chân trang chỉ mở bảng bên trái).
- Chưa chặn Giao bài/Sinh AI khi thiếu trường bắt buộc (4 trường bắt buộc luôn có giá trị sẵn).
- Chân trang trên màn hình chỉ vẽ một lần ở cuối tờ; chia trang thật là giai đoạn D. Trình chiếu, trang học sinh không dùng bố cục này.

## Kiểm

- SAFE 553/553 (thêm `tests/print_layout.test.ts`, 6 ca). Kiểu, lint 0 lỗi, ratchet màu 2508 giữ nguyên.
- Trình duyệt: editor 11/11 (thêm ca áp mẫu → thấy "Trang 1/N", sửa chân trang lưu vào DB, hoàn tác), frame 4/4, teacher 7/7, library 6/6, admin 11/11, typography 4/4, pilot 24/24.
- Ảnh: `print-layout-applied-1440.png`, `print-layout-1440.png`.
- Chưa: mở file Word trong Word thật để xem số trang; điện thoại thật.
