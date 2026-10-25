# BỘ FIXTURE ĐỀ THI ĐA MÔN KIỂM TRA NHẬP/XUẤT (EXAM FIXTURES)

Thư mục này chứa bộ 6 tệp đề thi mẫu đa môn học theo chuẩn Chương trình Giáo dục phổ thông 2018, tuân thủ nghiêm ngặt định dạng lược đồ Exam của hệ thống ExamCraft (mã nguồn tại src/types/exam.ts). Toàn bộ các tệp được mã hóa UTF-8 chuẩn (không chứa ký tự BOM ở đầu tệp).

Bộ dữ liệu phục vụ mục đích kiểm thử tự động và thủ công cho các luồng:
1. Nhập và mở đề trong không gian làm việc ExamWorkspace.
2. Trộn mã đề và giữ nguyên cấu trúc ngữ liệu dùng chung.
3. Xuất tệp văn bản Microsoft Word (.docx), kiểm tra bảng biểu, công thức toán và mã nguồn.
4. Chế độ in ấn A4 và chế độ xem Song song (câu hỏi và đáp án).
5. Giao bài thi trực tuyến và tự động chấm điểm cho học sinh.

---

## DANH MỤC 6 TỆP ĐỀ THI VÀ TRƯỜNG HỢP BIÊN ĐÃ CÀI ĐẶT

### 1. ngu-van-7.json (Môn Ngữ văn 7)
- Cấu trúc: 2 phần (I. Đọc hiểu, II. Làm văn); 4 câu hỏi (trắc nghiệm, trả lời ngắn, tự luận).
- Đặc điểm sư phạm:
  + Gồm 2 đoạn ngữ liệu độc lập: Ngữ liệu 1 là truyện ký mở rộng; Ngữ liệu 2 là bài thơ lục bát.
  + Câu tự luận tạo lập văn bản có cấu trúc barem chấm điểm chi tiết (rubric) gồm 4 tiêu chí với điểm tối đa là 4.0 điểm.
- Trường hợp biên cài đặt:
  + Ngữ liệu dài trên 500 từ: Đoạn văn bản đọc hiểu tại Ngữ liệu 1 có độ dài thực tế là 528 từ, kiểm tra khả năng dàn trang, cuộn mượt mà và không gây vỡ giao diện chia cột trong chế độ Song song và xuất Word.

### 2. tieng-anh-8.json (Môn Tiếng Anh 8)
- Cấu trúc: 2 phần (Reading Comprehension, Language Focus & Matching); 4 câu hỏi.
- Đặc điểm sư phạm:
  + Bài đọc hiểu gắn với ngữ liệu văn bản tiếng Anh về đời sống nông thôn hiện đại.
  + Dạng câu hỏi trắc nghiệm nhiều lựa chọn (multiple_choice).
  + Dạng câu hỏi điền từ vào chỗ trống (fill_blank) với mảng đáp án chấp nhận linh hoạt.
  + Dạng câu hỏi ghép nối hai vế câu (matching) với 3 cặp mệnh đề.

### 3. khtn-6.json (Môn Khoa học tự nhiên 6)
- Cấu trúc: 2 phần; 3 câu hỏi tích hợp liên môn Vật lý, Hóa học và Sinh học.
- Đặc điểm sư phạm:
  + Phân môn Vật lý: Đơn vị đo lường chuẩn SI (kg, Kelvin, độ Celsius, giây).
  + Phân môn Hóa học: Công thức phân tử khí oxygen, nước và carbon dioxide với định dạng công thức hóa học chuẩn.
  + Phân môn Sinh học: Câu hỏi dạng chùm Đúng/Sai (true_false_group) 4 ý a, b, c, d gắn liền với bảng số liệu thực nghiệm đo lượng nước thoát ra của lá cây theo nhiệt độ môi trường.

### 4. lich-su-dia-ly-7.json (Môn Lịch sử và Địa lí 7)
- Cấu trúc: 2 phân môn độc lập (Lịch sử Đại Việt và Địa lí Châu Âu); 3 câu hỏi.
- Đặc điểm sư phạm:
  + Phân môn Lịch sử: Trích dẫn tư liệu lịch sử cổ xưa từ Đại Việt sử ký toàn thư về sự kiện vua Lý Thái Tổ ban Chiếu dời đô năm 1010.
  + Phân môn Địa lí: Bảng thống kê số liệu dân số và tỉ lệ đô thị hóa của Châu Âu qua 4 mốc thời gian (1990 - 2020).
- Trường hợp biên cài đặt:
  + Dấu tiếng Việt tổ hợp (Unicode NFD): Chuỗi ký tự trong nội dung câu hỏi và mảng đáp án chứa các ký tự tiếng Việt dạng tổ hợp phân tách (ví dụ ký tự e kèm dấu nón U+0302 và dấu sắc U+0301) nhằm kiểm tra năng lực chuẩn hóa Unicode của trình phân tích cú pháp và công cụ xuất tệp Word.

### 5. tin-hoc-8.json (Môn Tin học 8)
- Cấu trúc: 2 phần; 3 câu hỏi.
- Đặc điểm sư phạm:
  + Bảng chân trị đại số Boole (Truth Table) với các toán tử logic AND, OR, NOT.
  + Đoạn mã nguồn Python định dạng khối mã minh họa cấu trúc vòng lặp for và cấu trúc rẽ nhánh điều kiện if.
  + Thuật toán vòng lặp while tính toán giai thừa trong câu hỏi trả lời ngắn.

### 6. toan-9.json (Môn Toán học 9)
- Cấu trúc: 2 phần (Đại số & Căn thức, Hình học phẳng); 3 câu hỏi.
- Đặc điểm sư phạm:
  + Hệ hai phương trình bậc nhất hai ẩn có ký hiệu hệ phương trình chuẩn LaTeX.
  + Bài toán hình học đường tròn và hai tiếp tuyến cắt nhau, kèm hướng dẫn giải và tiêu chí barem điểm tự luận chi tiết.
- Trường hợp biên cài đặt:
  + Công thức toán học cực dài trên 150 ký tự: Biểu thức đại số chứa căn thức lồng nhau tại Câu 1 có độ dài chuỗi ký tự LaTeX đạt 210 ký tự (vượt xa mốc yêu cầu 150 ký tự), nhằm kiểm tra khả năng hiển thị MathJax/KaTeX và bộ lọc chuyển đổi sang MathML/OMML khi xuất tệp .docx.

---

## HƯỚNG DẪN KIỂM TRA TÍNH HỢP LỆ VÀ SỬ DỤNG
1. Kiểm tra cú pháp JSON và mã hóa:
   Tất cả 6 tệp đều vượt qua kiểm tra cú pháp và đảm bảo byte đầu tiên là 0x7B (ký tự mở ngoặc nhọn {), không bị chèn byte BOM (0xEF 0xBB 0xBF).
2. Kiểm tra nạp vào giao diện:
   Tải nội dung tệp vào bộ nhớ localStorage với tiền tố nháp hoặc truyền qua hàm tạo đề để mở trực tiếp trong ExamWorkspace mà không xảy ra bất kỳ lỗi sai lệch cấu trúc dữ liệu nào.
