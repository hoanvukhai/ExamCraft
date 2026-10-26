# 09. Kiểm theo từng môn học và khối lớp

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.
Phần này giúp bạn kiểm **từng môn** thay vì chỉ Toán. Có hai việc: (A) môn có đúng ở khối đó không, (B) với từng môn, đề soạn ra, xem, xuất, in có đúng đặc thù của môn không.

## 9A. Môn nào xuất hiện ở khối nào (kiểm danh sách chọn)

Khi chọn **Lớp** ở cửa sổ **Soạn bản nháp với AI**, ở **Tiêu đề trường thi** hoặc ở hộp **Lớp của tài liệu / Môn** của cửa sổ nhập đề, danh sách **Môn** phải đúng như bảng dưới (theo chương trình GDPT 2018 mà ứng dụng đang dùng). Hai mục luôn có ở **mọi** khối: **Ngoại ngữ khác (chọn ngôn ngữ và chương trình)** và **Tiếng dân tộc (chọn chương trình/trình độ)**.

| Môn | Khối có môn |
|---|---|
| Tiếng Việt | 1–5 |
| Toán | 1–12 |
| Đạo đức | 1–5 |
| Âm nhạc | 1–12 |
| Mĩ thuật | 1–12 |
| Giáo dục thể chất | 1–12 |
| Hoạt động trải nghiệm | 1–5 |
| Tự nhiên và Xã hội | 1–3 |
| Tiếng Anh | 1–12 |
| Giáo dục địa phương | 1–12 |
| Công nghệ | 3–12 |
| Tin học | 3–12 |
| Khoa học | 4–5 |
| Lịch sử và Địa lí | 4–9 |
| Ngữ văn | 6–12 |
| Giáo dục công dân | 6–9 |
| Khoa học tự nhiên | 6–9 |
| Hoạt động trải nghiệm, hướng nghiệp | 6–12 |
| Lịch sử | 10–12 |
| Địa lí | 10–12 |
| Giáo dục kinh tế và pháp luật | 10–12 |
| Vật lí | 10–12 |
| Hóa học | 10–12 |
| Sinh học | 10–12 |
| Giáo dục quốc phòng và an ninh | 10–12 |

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T10-01 | 🔴 | Chọn **Lớp 1**; xem danh sách môn | Có: Tiếng Việt, Toán, Đạo đức, Âm nhạc, Mĩ thuật, Giáo dục thể chất, Hoạt động trải nghiệm, Tự nhiên và Xã hội, Tiếng Anh (nhãn "Tự chọn"), Giáo dục địa phương, cùng 2 mục ngoại ngữ khác / tiếng dân tộc; **không** có Tin học, Công nghệ, Vật lí | | |
| T10-02 | 🔴 | Chọn **Lớp 4**; xem danh sách | Có Khoa học, Lịch sử và Địa lí, Công nghệ, Tin học; **không** có Tự nhiên và Xã hội (chỉ lớp 1–3) | | |
| T10-03 | 🔴 | Chọn **Lớp 7** | Có Ngữ văn, Giáo dục công dân, Khoa học tự nhiên, Lịch sử và Địa lí, Công nghệ, Tin học, Hoạt động trải nghiệm hướng nghiệp; **không** có Vật lí/Hóa/Sinh riêng | | |
| T10-04 | 🔴 | Chọn **Lớp 10** | Có Lịch sử, Địa lí, Giáo dục kinh tế và pháp luật, Vật lí, Hóa học, Sinh học, Giáo dục quốc phòng và an ninh; **không** có Giáo dục công dân, Khoa học tự nhiên | | |
| T10-05 | 🔴 | Đổi lớp từ 7 sang 10 khi môn đang chọn là "Khoa học tự nhiên" | Môn bị bỏ chọn hoặc báo không thuộc khối; **không** giữ môn sai khối | | |
| T10-06 | 🔴 | Chọn môn mà khối đó **không** có (bằng cách đổi lớp sau khi chọn môn) | Hệ thống báo "Môn không thuộc danh mục lớp đã chọn"; **không** mượn nội dung Toán thay thế | | |
| T10-07 | 🟡 | Xem trạng thái môn–lớp (nơi có chữ "Có đầu mối tài liệu; nội dung và mẫu đánh giá đang chờ duyệt") | Mọi môn–lớp đều ghi **chờ duyệt**; không môn nào ghi "đã duyệt" | | |
| T10-08 | 🟡 | Mở bảng môn–lớp ở tài liệu [DANH_MUC_GOI_THEO_MON.md](../../chuong-trinh-2018/DANH_MUC_GOI_THEO_MON.md) | Đủ 161 ô, khớp bảng trên; người duyệt ghi "chưa có" | | |

## 9B. Quy trình kiểm cho **mỗi môn** (lặp lại, ghi kết quả vào bảng 9C)

Với mỗi môn ở 9C, làm lần lượt:

1. **Tạo đề**: nhập đề mẫu (nếu môn có ở `mau-test/de-mau-da-mon`) bằng T04-91 và T04-92; nếu không có mẫu thì **Soạn đề trống mới** rồi đặt **Lớp**, **Môn** đúng, và/hoặc **Sinh đề AI** (phần 04, T05-21) với một chủ đề của môn, 3 trắc nghiệm và 1 trả lời ngắn.
2. **Kiểm đúng môn/khối** trong **Tiêu đề trường thi**.
3. **Soạn tay** thêm một câu mang đặc thù của môn (cột "Đặc thù cần kiểm").
4. **Xem 5 chế độ** (Đề thi in ấn, Bảng đáp án & Barem, Hướng dẫn giải, Song song, Ma trận & Đặc tả): không lỗi chữ, công thức, bảng.
5. **Tải Word** và mở bằng Word thật; công thức là phương trình; chữ có dấu đúng.
6. **In / PDF** vài trang đầu.
7. Môn chấm điểm: **giao bài thử** cho một học sinh (điện thoại), làm một lượt, xem điểm (phần 07).
8. Môn **nhận xét / theo tiêu chí / khảo sát**: đặt **Cách đánh giá** tương ứng, kiểm đề **không có điểm và đáp án đúng giả**.
9. Môn có AI: kiểm kết quả AI về **đúng chuyên môn**: có chỗ nào AI viết sai kiến thức, chữ nước ngoài lẫn vào không.

Cách ghi trong bảng 9C: cột `AI` là kết quả sinh bằng AI, `W` là Word, `In` là in, `GB` là giao bài cho học sinh, `CM` là chuyên môn đúng; mỗi ô ghi Đ, K hoặc B, và nội dung sai ghi ở cột Ghi chú.

## 9C. Bảng kiểm từng môn

| Mã | Môn (khối thử) | Đề mẫu có sẵn | Đặc thù cần kiểm | AI | W | In | GB | CM | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| T10-10 | Tiếng Việt (3) | `tieu-hoc-3` có phần Tiếng Việt | Bài thơ nhiều dòng giữ dòng; chính tả, dấu câu, dấu thanh in đúng | | | | | | |
| T10-11 | Toán (9; thêm 1, 6, 12) | `toan-9` | Phân thức lồng, căn, hệ phương trình, bảng biến thiên, đồ thị, điểm lẻ 0,25 | | | | | | |
| T10-12 | Đạo đức (2) | — | **Nhận xét** (không điểm), tình huống ngắn | | | | | | |
| T10-13 | Âm nhạc (6) | — | **Nhận xét/Tiêu chí**, câu mô tả; không điểm số | | | | | | |
| T10-14 | Mĩ thuật (6) | — | **Nhận xét/Tiêu chí**; chèn ảnh tranh minh họa, ảnh in rõ | | | | | | |
| T10-15 | Giáo dục thể chất (7) | — | **Nhận xét/Tiêu chí**; bảng tiêu chí | | | | | | |
| T10-16 | Hoạt động trải nghiệm (4) | — | **Nhận xét**; phiếu quan sát | | | | | | |
| T10-17 | Tự nhiên và Xã hội (2) | — | **Nhận xét**; câu gắn hình | | | | | | |
| T10-18 | Tiếng Anh (8; thêm 2, 12) | `tieng-anh-8` | Chữ tiếng Anh, ngữ liệu đọc hiểu, điền khuyết, ghép nối; không lẫn chữ Việt vô nghĩa | | | | | | |
| T10-19 | Giáo dục địa phương (5) | — | Bắt buộc nhập **Địa phương và năm / phiên bản tài liệu**; nhận xét | | | | | | |
| T10-20 | Công nghệ (7) | — | Câu mô tả quy trình, bảng so sánh, hình | | | | | | |
| T10-21 | Tin học (8) | `tin-hoc-8` | Bảng chân trị là bảng thật; đoạn mã Python giữ dòng; ghép nối toán tử | | | | | | |
| T10-22 | Khoa học (5) | — | Hình thí nghiệm, đơn vị đo | | | | | | |
| T10-23 | Lịch sử và Địa lí (7) | `lich-su-dia-ly-7` | Năm tháng, bản đồ (ảnh), sắp xếp sự kiện theo thời gian, ghép nối | | | | | | |
| T10-24 | Ngữ văn (8; thêm 12) | `ngu-van-7` (lớp 7) | Ngữ liệu dài đúng một lần; đoạn thơ giữ dòng; tự luận có barem tiêu chí | | | | | | |
| T10-25 | Giáo dục công dân (7) | — | Tình huống pháp luật, đúng/sai | | | | | | |
| T10-26 | Khoa học tự nhiên (6) | `khtn-6` | Đủ 7 dạng câu; công thức hóa học, đơn vị vật lí | | | | | | |
| T10-27 | Hoạt động trải nghiệm, hướng nghiệp (9) | — | **Nhận xét**; phiếu khảo sát không đáp án | | | | | | |
| T10-28 | Lịch sử (11) | — | Dòng thời gian, sắp xếp sự kiện, bản đồ | | | | | | |
| T10-29 | Địa lí (10) | — | Bản đồ/biểu đồ (ảnh), bảng số liệu (bảng thật) | | | | | | |
| T10-30 | Giáo dục kinh tế và pháp luật (10) | — | Tình huống, đúng/sai | | | | | | |
| T10-31 | Vật lí (11) | `vat-li-11` | Ký hiệu omega, pi, đơn vị, hình; đúng/sai 4 ý | | | | | | |
| T10-32 | Hóa học (10) | `hoa-hoc-10` | Công thức hóa học, phương trình có mũi tên, số oxi hóa; chữ "sắt", không viết "iron" | | | | | | |
| T10-33 | Sinh học (11) | — | Thuật ngữ, sơ đồ, bảng | | | | | | |
| T10-34 | Giáo dục quốc phòng và an ninh (10) | — | Câu đúng/sai, nội dung nhạy cảm đúng chuẩn | | | | | | |
| T10-35 | Ngoại ngữ khác (10) | — | Chọn **Chương trình** (Ngoại ngữ 1 hoặc 2) và **Ngôn ngữ** (Pháp, Nhật...); **bắt buộc chọn ngôn ngữ** mới tạo được | | | | | | |
| T10-36 | Tiếng dân tộc (3) | — | Chọn **Chương trình** Tiếng dân tộc và ngôn ngữ (Raglai, Chăm, Êđê...); ký tự đặc biệt in được | | | | | | |

## 9D. Kiểm thêm theo cấp học

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T10-40 | 🟡 | Tiểu học (khối 1–5): chọn khung nhận thức | Chỉ có khung ba mức cho tiểu học; không có khung THPT | | |
| T10-41 | 🟡 | THPT (khối 10–12): chọn khung nhận thức | Có khung Biết – Hiểu – Vận dụng; khung tiểu học không hiện | | |
| T10-42 | 🟡 | Khối 1–2: dùng câu rất ngắn, in | In đọc được; nếu chữ quá nhỏ ghi lại | | |
| T10-43 | 🟡 | Môn nhận xét ở THCS/THPT (Âm nhạc, Mĩ thuật, Giáo dục thể chất) | Mặc định **Nhận xét**, không bắt buộc điểm | | |
| T10-44 | 🔴 | Thử mọi môn: đáp án do AI viết | Câu AI **không** bao giờ tự gắn "đã kiểm"; giáo viên chuyên môn đọc lại trước khi dùng (ghi tên người duyệt nếu có) | | |
