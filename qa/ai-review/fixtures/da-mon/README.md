# BỘ FIXTURE ĐỀ THI ĐA MÔN KIỂM TRA NHẬP/XUẤT (EXAM FIXTURES)

Thư mục này chứa bộ 9 tệp đề thi mẫu đa môn học theo chuẩn Chương trình Giáo dục phổ thông 2018, tuân thủ nghiêm ngặt định dạng lược đồ Exam của hệ thống ExamCraft (mã nguồn tại src/types/exam.ts). Toàn bộ các tệp được mã hóa UTF-8 chuẩn (không chứa ký tự BOM ở đầu tệp, byte đầu là 0x7B).

Bộ dữ liệu phục vụ mục đích kiểm thử tự động (tests/fixture_da_mon.test.ts) và thủ công cho các luồng:
1. Nhập và mở đề trong không gian làm việc ExamWorkspace.
2. Trộn mã đề và giữ nguyên cấu trúc ngữ liệu dùng chung.
3. Xuất tệp văn bản Microsoft Word (.docx), kiểm tra bảng biểu, công thức toán, công thức vật lí, phương trình hóa học và mã nguồn.
4. Chế độ in ấn A4 và chế độ xem Song song (câu hỏi và đáp án).
5. Giao bài thi trực tuyến và tự động chấm điểm cho học sinh.

---

## DANH MỤC 9 TỆP ĐỀ THI ĐA MÔN (BAO QUÁT TIỂU HỌC, THCS, THPT)

Mỗi đề thi trong bộ fixture bao quát từ 4 đến 7 dạng thức câu hỏi khác nhau: Trắc nghiệm 4 lựa chọn (multiple_choice), Trắc nghiệm Đúng/Sai nhóm (true_false_group), Trả lời ngắn (short_answer), Điền khuyết (fill_blank), Ghép nối (matching), Sắp xếp thứ tự (ordering) và Tự luận có barem rubric (essay).

### 1. ngu-van-7.json (Môn Ngữ văn 7)
- Quy mô: 10 câu hỏi, gồm 3 phần (Đọc hiểu, Thực hành Tiếng Việt, Làm văn).
- Các dạng thức: multiple_choice, short_answer, true_false_group, fill_blank, matching, ordering, essay.
- Đặc điểm: Gồm 2 đoạn ngữ liệu độc lập (đoạn 1 dài trên 500 từ); câu tự luận tạo lập văn bản có rubric 4 tiêu chí.

### 2. tieng-anh-8.json (Môn Tiếng Anh 8)
- Quy mô: 10 câu hỏi, gồm 2 phần (Reading Comprehension, Language Focus & Matching).
- Các dạng thức: multiple_choice, true_false_group, fill_blank, short_answer, matching, ordering.
- Đặc điểm: Ngữ liệu bài đọc hiểu tiếng Anh, câu hỏi trắc nghiệm, đúng/sai nhóm 4 ý, điền khuyết và ghép nối mệnh đề.

### 3. khtn-6.json (Môn Khoa học tự nhiên 6)
- Quy mô: 10 câu hỏi tích hợp liên môn Vật lý, Hóa học và Sinh học.
- Các dạng thức: multiple_choice, matching, fill_blank, short_answer, ordering, true_false_group, essay.
- Đặc điểm: Đơn vị đo SI, công thức phân tử, cấu tạo tế bào, bảng số liệu thực nghiệm và câu tự luận kèm rubric.

### 4. lich-su-dia-ly-7.json (Môn Lịch sử và Địa lí 7)
- Quy mô: 10 câu hỏi, gồm 2 phân môn (Lịch sử Đại Việt và Địa lí Châu Âu).
- Các dạng thức: multiple_choice, short_answer, fill_blank, matching, ordering, true_false_group, essay.
- Đặc điểm: Trích dẫn tư liệu Chiếu dời đô, ghép nối triều đại, bảng thống kê dân số và kiểm tra Unicode tiếng Việt có dấu.

### 5. tin-hoc-8.json (Môn Tin học 8)
- Quy mô: 10 câu hỏi, gồm 2 phần (Biểu thức logic và Thuật toán Python).
- Các dạng thức: true_false_group, multiple_choice, fill_blank, matching, ordering, short_answer, essay.
- Đặc điểm: Bảng chân trị Boole, đoạn mã nguồn Python với vòng lặp và câu tự luận phân biệt lỗi cú pháp.

### 6. toan-9.json (Môn Toán học 9 - THCS)
- Quy mô: 10 câu hỏi, gồm 2 phần (Đại số & Căn thức, Hình học phẳng).
- Các dạng thức: short_answer, multiple_choice, fill_blank, true_false_group, ordering, matching, essay.
- Đặc điểm: Biểu thức căn thức lồng nhau dài trên 150 ký tự, hệ phương trình, định lý Viète và hệ thức lượng tam giác vuông.

### 7. tieu-hoc-3.json (Tiểu học lớp 3 - Toán và Tiếng Việt)
- Quy mô: 10 câu hỏi, gồm 2 phần (Toán học 3 và Tiếng Việt 3).
- Các dạng thức: multiple_choice, short_answer, true_false_group, essay.
- Đặc điểm: Câu hỏi ngắn gọn, số nhỏ trong phạm vi 1000, hình vẽ mô tả đồng hồ bằng chữ, bài thơ Mùa thu của em.

### 8. vat-li-11.json (Môn Vật lí 11 - THPT)
- Quy mô: 9 câu hỏi, gồm 4 phần (Trắc nghiệm nhiều phương án, Đúng/Sai nhóm, Trả lời ngắn, Tự luận và thực nghiệm).
- Các dạng thức: multiple_choice, true_false_group, short_answer, essay.
- Đặc điểm sư phạm:
  + Dao động điều hòa, con lắc lò xo, con lắc đơn, giao thoa sóng cơ.
  + Công thức vật lí với đơn vị đo lường chuẩn SI: rad/s, m/s, m/s^2, Hz, chu kỳ T, bước sóng lambda.
  + Bảng số liệu thực nghiệm đo chu kỳ dao động con lắc đơn theo chiều dài dây treo.
  + Câu hỏi tự luận thực nghiệm tính gia tốc trọng trường g từ độ dốc đồ thị T^2 theo l kèm rubric 3 tiêu chí.

### 9. hoa-hoc-10.json (Môn Hóa học 10 - THPT)
- Quy mô: 9 câu hỏi, gồm 4 phần (Trắc nghiệm nhiều phương án, Đúng/Sai nhóm, Trả lời ngắn, Tự luận và bảng số liệu).
- Các dạng thức: multiple_choice, true_false_group, short_answer, essay.
- Đặc điểm sư phạm:
  + Cấu tạo nguyên tử, cấu hình electron, liên kết ion, phản ứng oxi hóa khử và bảng tuần hoàn.
  + Phương trình hóa học có chỉ số dưới và cân bằng hệ số: Fe + 2HCl -> FeCl2 + H2, 2Al + 6HCl -> 2AlCl3 + 3H2, 2KClO3 -> 2KCl + 3O2.
  + Bảng số liệu bán kính nguyên tử và độ âm điện của 7 nguyên tố thuộc chu kỳ 3 (Na đến Cl).
  + Câu hỏi tự luận giải thích quy luật biến đổi tuần hoàn kèm rubric 3 tiêu chí.

---

## HƯỚNG DẪN KIỂM TRA TÍNH HỢP LỆ VÀ SỬ DỤNG
1. Kiểm tra cú pháp JSON và mã hóa:
   Tất cả 9 tệp đều đảm bảo byte đầu tiên là 0x7B ({), không bị chèn byte BOM (0xEF 0xBB 0xBF).
2. Kiểm tra tự chấm điểm tự động:
   Tất cả câu hỏi tự chấm (multiple_choice, short_answer, fill_blank) đều có khóa đáp án chính xác, vượt qua 100% bộ kiểm tra tự động tại tests/fixture_da_mon.test.ts.
