# BỘ FIXTURE ĐỀ THI ĐA MÔN KIỂM TRA NHẬP/XUẤT (EXAM FIXTURES)

Thư mục này chứa bộ 7 tệp đề thi mẫu đa môn học theo chuẩn Chương trình Giáo dục phổ thông 2018, tuân thủ nghiêm ngặt định dạng lược đồ Exam của hệ thống ExamCraft (mã nguồn tại src/types/exam.ts). Toàn bộ các tệp được mã hóa UTF-8 chuẩn (không chứa ký tự BOM ở đầu tệp, byte đầu là 0x7B).

Bộ dữ liệu phục vụ mục đích kiểm thử tự động (tests/fixture_da_mon.test.ts) và thủ công cho các luồng:
1. Nhập và mở đề trong không gian làm việc ExamWorkspace.
2. Trộn mã đề và giữ nguyên cấu trúc ngữ liệu dùng chung.
3. Xuất tệp văn bản Microsoft Word (.docx), kiểm tra bảng biểu, công thức toán và mã nguồn.
4. Chế độ in ấn A4 và chế độ xem Song song (câu hỏi và đáp án).
5. Giao bài thi trực tuyến và tự động chấm điểm cho học sinh.

---

## DANH MỤC 7 TỆP ĐỀ THI ĐÃ MỞ RỘNG (10 CÂU / ĐỀ, ĐA DẠNG DẠNG THỨC)

Mỗi đề thi trong bộ fixture đã được mở rộng lên 10 câu hỏi độc lập, bao quát từ 4 đến 7 dạng thức câu hỏi khác nhau: Trắc nghiệm 4 lựa chọn (multiple_choice), Trắc nghiệm Đúng/Sai nhóm (true_false_group), Trả lời ngắn (short_answer), Điền khuyết (fill_blank), Ghép nối (matching), Sắp xếp thứ tự (ordering) và Tự luận có barem rubric (essay).

### 1. ngu-van-7.json (Môn Ngữ văn 7)
- Quy mô: 10 câu hỏi, gồm 3 phần (Đọc hiểu, Thực hành Tiếng Việt, Làm văn).
- Các dạng thức: multiple_choice, short_answer, true_false_group, fill_blank, matching, ordering, essay.
- Đặc điểm sư phạm:
  + Gồm 2 đoạn ngữ liệu độc lập: Ngữ liệu 1 là truyện ký mở rộng; Ngữ liệu 2 là bài thơ lục bát.
  + Câu tự luận tạo lập văn bản có cấu trúc barem chấm điểm chi tiết (rubric) gồm 4 tiêu chí với điểm tối đa là 3.5 điểm.
- Trường hợp biên cài đặt:
  + Ngữ liệu dài trên 500 từ: Đoạn văn bản đọc hiểu tại Ngữ liệu 1 có độ dài thực tế là 528 từ, kiểm tra khả năng dàn trang, cuộn mượt mà và không gây vỡ giao diện chia cột trong chế độ Song song và xuất Word.

### 2. tieng-anh-8.json (Môn Tiếng Anh 8)
- Quy mô: 10 câu hỏi, gồm 2 phần (Reading Comprehension, Language Focus & Matching).
- Các dạng thức: multiple_choice, true_false_group, fill_blank, short_answer, matching, ordering.
- Đặc điểm sư phạm:
  + Bài đọc hiểu gắn với ngữ liệu văn bản tiếng Anh về đời sống nông thôn hiện đại.
  + Câu hỏi trắc nghiệm đọc hiểu và từ vựng đồng nghĩa.
  + Câu hỏi Đúng/Sai nhóm (true_false_group) 4 ý a, b, c, d đối chiếu bài đọc.
  + Điền từ loại và giới từ (fill_blank) với mảng đáp án chấp nhận linh hoạt.
  + Ghép nối mệnh đề (matching) và sắp xếp trật tự mệnh đề câu phức (ordering).

### 3. khtn-6.json (Môn Khoa học tự nhiên 6)
- Quy mô: 10 câu hỏi tích hợp liên môn Vật lý, Hóa học và Sinh học.
- Các dạng thức: multiple_choice, matching, fill_blank, short_answer, ordering, true_false_group, essay.
- Đặc điểm sư phạm:
  + Phân môn Vật lý: Đơn vị đo lường chuẩn SI, bài toán đổi đơn vị đo chiều dài, ghép dụng cụ đo.
  + Phân môn Hóa học: Công thức phân tử nước, oxygen, phương pháp tách chất (lọc huyền phù).
  + Phân môn Sinh học: Cấu tạo tế bào thực vật, cấp độ tổ chức cơ thể (ordering), câu hỏi chùm Đúng/Sai phân tích bảng số liệu thoát hơi nước, câu tự luận về vai trò của oxygen kèm rubric.

### 4. lich-su-dia-ly-7.json (Môn Lịch sử và Địa lí 7)
- Quy mô: 10 câu hỏi, gồm 2 phân môn độc lập (Lịch sử Đại Việt và Địa lí Châu Âu).
- Các dạng thức: multiple_choice, short_answer, fill_blank, matching, ordering, true_false_group, essay.
- Đặc điểm sư phạm:
  + Phân môn Lịch sử: Trích dẫn tư liệu lịch sử Chiếu dời đô 1010, điền tên vua Lý Thái Tổ, ghép triều đại với kinh đô, sắp xếp thứ tự các triều đại Ngô - Đinh - Tiền Lê - Lý - Trần, tự luận ý nghĩa lịch sử.
  + Phân môn Địa lí: Ranh giới tự nhiên dãy U-ran, đới khí hậu ôn đới, sông Đa-nuýp, bảng thống kê dân số và đô thị hóa Châu Âu qua các năm.
- Trường hợp biên cài đặt:
  + Dấu tiếng Việt tổ hợp (Unicode NFD): Chuỗi ký tự trong nội dung câu hỏi và mảng đáp án chứa các ký tự tiếng Việt dạng tổ hợp phân tách (ví dụ ký tự e kèm dấu nón U+0302 và dấu sắc U+0301) nhằm kiểm tra năng lực chuẩn hóa Unicode của trình phân tích cú pháp và công cụ xuất tệp Word.

### 5. tin-hoc-8.json (Môn Tin học 8)
- Quy mô: 10 câu hỏi, gồm 2 phần (Biểu thức logic và Thuật toán Python).
- Các dạng thức: true_false_group, multiple_choice, fill_blank, matching, ordering, short_answer, essay.
- Đặc điểm sư phạm:
  + Bảng chân trị đại số Boole (Truth Table) với các toán tử logic AND, OR, NOT.
  + Kiểu dữ liệu int, lệnh in print, ghép nối toán tử so sánh, sắp xếp các bước giải bài toán trên máy tính.
  + Đoạn mã nguồn Python vòng lặp for, vòng lặp while tính giai thừa, phép toán chia lấy dư %, cấu trúc rẽ nhánh if-elif-else.
  + Câu tự luận phân biệt lỗi cú pháp và lỗi logic kèm rubric.

### 6. toan-9.json (Môn Toán học 9)
- Quy mô: 10 câu hỏi, gồm 2 phần (Đại số & Căn thức, Hình học phẳng).
- Các dạng thức: short_answer, multiple_choice, fill_blank, true_false_group, ordering, matching, essay.
- Đặc điểm sư phạm:
  + Rút gọn biểu thức căn thức, hệ phương trình bậc nhất hai ẩn, căn bậc hai số học.
  + Hàm số bậc nhất và đồ thị đường thẳng, định lý Viète tính tổng hai nghiệm, sắp xếp các bước giải bài toán bằng cách lập hệ phương trình.
  + Hệ thức lượng tam giác vuông và tỉ số lượng giác, góc nội tiếp chắn nửa đường tròn, bài toán hình học tiếp tuyến kèm barem rubric.
- Trường hợp biên cài đặt:
  + Công thức toán học cực dài trên 150 ký tự: Biểu thức đại số chứa căn thức lồng nhau tại Câu 1 có độ dài chuỗi ký tự LaTeX đạt 210 ký tự, kiểm tra khả năng hiển thị MathJax/KaTeX và bộ lọc chuyển đổi sang MathML/OMML khi xuất tệp .docx.

### 7. tieu-hoc-3.json (Tiểu học lớp 3 - Toán và Tiếng Việt)
- Quy mô: 10 câu hỏi, gồm 2 phần (Toán học lớp 3 và Tiếng Việt lớp 3).
- Các dạng thức: multiple_choice, short_answer, true_false_group, essay.
- Đặc điểm sư phạm:
  + Câu hỏi ngắn gọn, dùng các con số nhỏ trong phạm vi 1000 phù hợp tâm lý tiếp nhận của học sinh tiểu học.
  + Môn Toán: Cấu tạo số có 3 chữ số, phép nhân trong phạm vi 1000, chu vi hình chữ nhật, đặc điểm hình vuông/tam giác và đơn vị đo.
  + Hình vẽ mô tả bằng chữ: Câu hỏi đọc giờ đồng hồ có kèm khối văn bản mô tả trực quan vị trí kim ngắn kim dài.
  + Môn Tiếng Việt: Gắn với ngữ liệu bài thơ "Mùa thu của em", câu hỏi đọc hiểu, biện pháp tu từ so sánh, từ chỉ đặc điểm và câu tự luận ngắn kể về đồ dùng học tập.

---

## HƯỚNG DẪN KIỂM TRA TÍNH HỢP LỆ VÀ SỬ DỤNG
1. Kiểm tra cú pháp JSON và mã hóa:
   Tất cả 7 tệp đều vượt qua kiểm tra cú pháp và đảm bảo byte đầu tiên là 0x7B (ký tự mở ngoặc nhọn {), không bị chèn byte BOM (0xEF 0xBB 0xBF).
2. Kiểm tra tự chấm điểm tự động:
   Tất cả các câu hỏi thuộc các dạng tự chấm (multiple_choice, short_answer, fill_blank) đều có khóa đáp án chính xác, vượt qua 100% bộ kiểm tra tự động tại tests/fixture_da_mon.test.ts.
