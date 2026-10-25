# BỘ 28 CA THỬ NGHIỆM NHẬP ĐỀ THI TỪ VĂN BẢN THÔ (IMPORT CASES)
*Đặc tả ca thử nghiệm thực tế dành cho bộ phân tích văn bản tiếng Việt của ExamCraft*
*Căn cứ mã nguồn: `src/lib/exam-parser.ts`, `src/lib/import-document.ts` và `tests/exam_parser.test.ts`*

- **Người thực hiện:** Gemini (QA & Phân tích thuật toán bóc tách văn bản)
- **Nhiệm vụ:** GEM-T2 (P0, Generation 12)
- **Thời điểm lập (UTC):** 2026-10-25T12:00:00Z
- **Nguyên tắc phân loại độ tin cậy:**
  + **CHẮC:** Hành vi đã có mã xử lý hoặc được bao phủ trực tiếp bởi các ca kiểm thử trong `tests/exam_parser.test.ts`.
  + **NGHI:** Hành vi thường gặp ở giáo viên Việt Nam nhưng chưa có ca test khẳng định hoặc phụ thuộc vào cách biểu thức chính quy xử lý ngoại lệ.

---

## DANH SÁCH 28 CA THỬ NGHIỆM CHI TIẾT

### TC01: Tiêu chuẩn cơ bản [Câu 1:] mỗi lựa chọn một dòng
- **Văn bản đầu vào:**
```text
Câu 1: Thủ đô của Việt Nam là gì?
A. Hà Nội
B. Huế
C. Đà Nẵng
D. Cần Thơ
```
- **Kết quả mong đợi:** 1 câu dạng multiple_choice; nội dung: Thủ đô của Việt Nam là gì?; 4 lựa chọn A, B, C, D; đáp án đúng: chưa xác định.
- **Độ tin cậy:** CHẮC

---

### TC02: Định dạng dấu chấm [Câu 1.] phân tách câu
- **Văn bản đầu vào:**
```text
Câu 1. Số nào sau đây là số nguyên tố?
A. 4
B. 6
C. 7
D. 9
```
- **Kết quả mong đợi:** 1 câu dạng multiple_choice; nội dung: Số nào sau đây là số nguyên tố?; 4 lựa chọn A, B, C, D.
- **Độ tin cậy:** CHẮC

---

### TC03: Định dạng dấu ngoặc đơn [Câu 1)] và phương án [A)]
- **Văn bản đầu vào:**
```text
Câu 1) Đơn vị đo lực trong hệ SI là:
A) Jun (J)
B) Niutơn (N)
C) Oat (W)
D) Pascan (Pa)
```
- **Kết quả mong đợi:** 1 câu dạng multiple_choice; nội dung: Đơn vị đo lực trong hệ SI là:; 4 lựa chọn A, B, C, D nhận diện đúng văn bản.
- **Độ tin cậy:** CHẮC

---

### TC04: Định dạng số trần [1)] hoặc [1.] không có chữ [Câu]
- **Văn bản đầu vào:**
```text
1) Kết quả của phép tính 5 + 7 là:
A. 10
B. 11
C. 12
D. 13
```
- **Kết quả mong đợi:** 1 câu dạng multiple_choice; nội dung: Kết quả của phép tính 5 + 7 là:; 4 lựa chọn A, B, C, D.
- **Độ tin cậy:** NGHI

---

### TC05: Phương án có ngoặc tròn bao quanh [(A)], [(B)]
- **Văn bản đầu vào:**
```text
Câu 1: Từ nào viết đúng chính tả?
(A) Xắp xếp
(B) Sắp xếp
(C) Sắp sếp
(D) Xắp sếp
```
- **Kết quả mong đợi:** 1 câu dạng multiple_choice; 4 lựa chọn A, B, C, D bóc tách đúng nội dung từ vựng.
- **Độ tin cậy:** NGHI

---

### TC06: Bốn phương án trắc nghiệm nằm chung trên một dòng
- **Văn bản đầu vào:**
```text
Câu 1: Giá trị của x thỏa mãn x + 3 = 10 là: A. 5 B. 6 C. 7 D. 8
```
- **Kết quả mong đợi:** 1 câu dạng multiple_choice; nội dung: Giá trị của x thỏa mãn x + 3 = 10 là:; các phương án tách thành 5, 6, 7, 8.
- **Độ tin cậy:** CHẮC

---

### TC07: Phương án dàn thành 2 dòng (mỗi dòng 2 phương án)
- **Văn bản đầu vào:**
```text
Câu 1: Hình vuông có cạnh 4cm thì chu vi là:
A. 8cm         B. 12cm
C. 16cm        D. 20cm
```
- **Kết quả mong đợi:** 1 câu dạng multiple_choice; 4 lựa chọn A, B, C, D nhận diện đầy đủ văn bản và đơn vị đo.
- **Độ tin cậy:** CHẮC

---

### TC08: Nội dung một phương án kéo dài sang dòng tiếp theo
- **Văn bản đầu vào:**
```text
Câu 1: Đặc điểm của đoạn văn quy nạp là gì?
A. Câu chủ đề nằm ở cuối đoạn văn,
làm nhiệm vụ khái quát toàn bộ nội dung
B. Câu chủ đề nằm ở đầu đoạn văn
C. Không có câu chủ đề
D. Có câu chủ đề ở cả đầu và cuối
```
- **Kết quả mong đợi:** 1 câu dạng multiple_choice; lựa chọn A gộp liền mạch thành một câu hoàn chỉnh, không bị cắt đôi.
- **Độ tin cậy:** CHẮC

---

### TC09: Đánh dấu đáp án đúng bằng dấu sao [*] ở đuôi
- **Văn bản đầu vào:**
```text
Câu 1: Số nào sau đây chia hết cho cả 2 và 5?
A. 12
B. 25
C. 30*
D. 42
```
- **Kết quả mong đợi:** 1 câu multiple_choice; đáp án đúng gán tự động là C; văn bản lựa chọn C là 30 (bỏ dấu sao).
- **Độ tin cậy:** CHẮC

---

### TC10: Đánh dấu đáp án đúng bằng chữ [(đúng)] hoặc [(Đ)]
- **Văn bản đầu vào:**
```text
Câu 1: Kim loại nào nhẹ nhất trong các kim loại sau?
A. Nhôm
B. Liti (đúng)
C. Sắt
D. Đồng
```
- **Kết quả mong đợi:** 1 câu multiple_choice; đáp án đúng là B; văn bản lựa chọn B là Liti (bỏ chữ đúng).
- **Độ tin cậy:** CHẮC

---

### TC11: Dòng đáp án riêng [Đáp án: B] ngay dưới câu hỏi
- **Văn bản đầu vào:**
```text
Câu 1: Khí nào chiếm thể tích lớn nhất trong không khí?
A. Oxygen
B. Nitrogen
C. Carbon dioxide
D. Hydrogen
Đáp án: B
```
- **Kết quả mong đợi:** 1 câu multiple_choice; đáp án đúng là B; dòng Đáp án không bị nhét vào nội dung lựa chọn D.
- **Độ tin cậy:** CHẮC

---

### TC12: Danh sách đáp án đặt ở cuối đề thi
- **Văn bản đầu vào:**
```text
Câu 1: Một cộng một bằng mấy?
A. 1
B. 2
C. 3
D. 4

Câu 2: Hai nhân hai bằng mấy?
A. 2
B. 3
C. 4
D. 5

ĐÁP ÁN
1. B  2. C
```
- **Kết quả mong đợi:** 2 câu multiple_choice; Câu 1 có đáp án B; Câu 2 có đáp án C; khối ĐÁP ÁN không tạo thành câu hỏi thứ 3.
- **Độ tin cậy:** CHẮC

---

### TC13: Danh sách đáp án dính liền [1A 2B 3C]
- **Văn bản đầu vào:**
```text
Câu 1: Câu hỏi một?
A. a  B. b  C. c  D. d
Câu 2: Câu hỏi hai?
A. a  B. b  C. c  D. d
Đáp án: 1A 2D
```
- **Kết quả mong đợi:** 2 câu multiple_choice; Câu 1 đáp án A; Câu 2 đáp án D.
- **Độ tin cậy:** NGHI

---

### TC14: Bảng đáp án ở cuối đề thi
- **Văn bản đầu vào:**
```text
Câu 1: Câu một?
A. 1  B. 2  C. 3  D. 4
Câu 2: Câu hai?
A. 1  B. 2  C. 3  D. 4

BẢNG ĐÁP ÁN:
Câu:    1 | 2
Đáp án: B | A
```
- **Kết quả mong đợi:** 2 câu multiple_choice; Câu 1 đáp án B; Câu 2 đáp án A; bảng đáp án được hấp thụ trọn vẹn.
- **Độ tin cậy:** NGHI

---

### TC15: Câu hỏi chứa chữ in hoa [tam giác ABC vuông tại A]
- **Văn bản đầu vào:**
```text
Câu 1: Cho tam giác ABC vuông tại A có AB = 3cm, AC = 4cm. Độ dài cạnh BC là:
A. 5cm
B. 6cm
C. 7cm
D. 8cm
```
- **Kết quả mong đợi:** 1 câu multiple_choice; nội dung giữ nguyên toàn vẹn tam giác ABC vuông tại A; không bị cắt ngang ở chữ A.
- **Độ tin cậy:** CHẮC

---

### TC16: Cụm từ [theo bài 3 và câu 2] nằm giữa câu hỏi
- **Văn bản đầu vào:**
```text
Câu 1: Căn cứ vào bài 3 và câu 2 của bài thơ, em hãy cho biết hoàn cảnh sáng tác là gì?
A. Năm 1945
B. Năm 1954
C. Năm 1975
D. Năm 1986
```
- **Kết quả mong đợi:** Đúng 1 câu duy nhất; cụm từ câu 2 nằm trong nội dung, không bị cắt xẻ thành câu mới.
- **Độ tin cậy:** CHẮC

---

### TC17: Câu chùm Đúng/Sai chuẩn 4 ý a) b) c) d)
- **Văn bản đầu vào:**
```text
Câu 1: Cho hàm số y = 2x - 3. Các mệnh đề sau đúng hay sai?
a) Hàm số đồng biến trên tập xác định.
b) Đồ thị cắt trục tung tại điểm có tung độ bằng 3.
c) Đồ thị đi qua điểm M(1; -1).
d) Hệ số góc của đường thẳng bằng 2.
```
- **Kết quả mong đợi:** 1 câu dạng true_false_group; 4 ý con mang key a, b, c, d; trường isCorrect để trống (undefined).
- **Độ tin cậy:** CHẮC

---

### TC18: Câu chùm Đúng/Sai có đánh dấu inline [(Đ)] và [(S)]
- **Văn bản đầu vào:**
```text
Câu 1: Xét tính đúng sai của các khẳng định sau:
a) Số 0 là số tự nhiên nhỏ nhất. (Đ)
b) Số 1 là số nguyên tố. (S)
c) Mọi số nguyên tố đều là số lẻ. (Sai)
d) Số 2 là số nguyên tố chẵn duy nhất. (Đúng)
```
- **Kết quả mong đợi:** 1 câu dạng true_false_group; 4 ý con có isCorrect lần lượt là true, false, false, true.
- **Độ tin cậy:** CHẮC

---

### TC19: Câu chùm Đúng/Sai có dòng đáp án ở cuối
- **Văn bản đầu vào:**
```text
Câu 1: Xét các nhận định về lịch sử:
a) Khởi nghĩa Hai Bà Trưng bùng nổ năm 40.
b) Chiến thắng Bạch Đằng diễn ra năm 938.
c) Lý Công Uẩn dời đô về Thăng Long năm 1010.
d) Triều đại nhà Trần kết thúc năm 1400.
Đáp án: a) Đ, b) Đ, c) Đ, d) Đ
```
- **Kết quả mong đợi:** 1 câu true_false_group; cả 4 ý con đều nhận diện isCorrect bằng true; dòng đáp án được gỡ bỏ khỏi văn bản câu d.
- **Độ tin cậy:** CHẮC

---

### TC20: Câu tự luận có các ý nhỏ a) b) tính toán
- **Văn bản đầu vào:**
```text
Câu 1: Thực hiện các phép tính sau:
a) 15 + 27 - 12
b) 120 : 4 + 5 * 6
```
- **Kết quả mong đợi:** 1 câu dạng short_answer hoặc essay; tuyệt đối không bị ép thành câu chùm true_false_group.
- **Độ tin cậy:** CHẮC

---

### TC21: Câu hỏi điền khuyết / trả lời ngắn không có phương án
- **Văn bản đầu vào:**
```text
Câu 1: Hãy điền từ thích hợp vào chỗ trống:
Nước sôi ở nhiệt độ .......... độ C trong điều kiện áp suất tiêu chuẩn.
```
- **Kết quả mong đợi:** 1 câu dạng short_answer; không có choices.
- **Độ tin cậy:** CHẮC

---

### TC22: Công thức toán học kẹp trong dấu đô la [$...$]
- **Văn bản đầu vào:**
```text
Câu 1: Rút gọn biểu thức $P = \frac{x^2 - 4}{x - 2}$ với $x \ne 2$:
A. $P = x + 2$
B. $P = x - 2$
C. $P = 2x$
D. $P = x$
```
- **Kết quả mong đợi:** 1 câu multiple_choice; công thức toán học giữ nguyên cú pháp LaTeX trong các cặp ký hiệu đô-la.
- **Độ tin cậy:** CHẮC

---

### TC23: Công thức toán học kẹp trong ký hiệu [\(...\)]
- **Văn bản đầu vào:**
```text
Câu 1: Tìm nghiệm của phương trình \(2x - 6 = 0\):
A. \(x = 1\)
B. \(x = 2\)
C. \(x = 3\)
D. \(x = 4\)
```
- **Kết quả mong đợi:** 1 câu multiple_choice; công thức toán học được chuyển đổi hoặc bảo toàn trọn vẹn sang định dạng hiển thị.
- **Độ tin cậy:** NGHI

---

### TC24: Ngữ liệu dùng chung đặt trước nhóm câu hỏi
- **Văn bản đầu vào:**
```text
Đọc đoạn văn sau và trả lời các câu hỏi từ 1 đến 2:
"Tre xanh, xanh tự bao giờ?
Chuyện ngày xưa đã có bờ tre xanh..."

Câu 1: Thể thơ của đoạn trích trên là gì?
A. Thơ bốn chữ
B. Thơ năm chữ
C. Thơ lục bát
D. Thơ tự do

Câu 2: Hình ảnh cây tre tượng trưng cho điều gì?
A. Phẩm chất kiên cường của con người Việt Nam
B. Vẻ đẹp hiện đại
C. Sự giàu có
D. Tình yêu đôi lứa
```
- **Kết quả mong đợi:** 2 câu hỏi multiple_choice; đoạn thơ được gán vào khối ngữ liệu dùng chung passages và liên kết với cả 2 câu.
- **Độ tin cậy:** NGHI

---

### TC25: Bảng tiêu đề đề thi ở đầu trang không biến thành câu
- **Văn bản đầu vào:**
```text
UBND HUYỆN ĐAN PHƯỢNG
TRƯỜNG THCS TÂN LẬP
ĐỀ THI KIỂM TRA ĐỊNH KỲ NĂM HỌC 2025-2026
Môn: Toán - Lớp 6
Thời gian: 45 phút

Câu 1: Tính 10 + 20:
A. 30
B. 40
C. 50
D. 60
```
- **Kết quả mong đợi:** Đúng 1 câu duy nhất (Câu 1); toàn bộ phần tiêu đề cơ quan/thời gian ở đầu bị bỏ qua, không thành câu hỏi ma.
- **Độ tin cậy:** CHẮC

---

### TC26: Văn bản có nhiều dòng trống thừa và ký tự Tab thụt dòng
- **Văn bản đầu vào:**
```text


		Câu 1:   Biểu thức nào sau đây là đơn thức?   

	A. 2x + y   
	B. 3xy^2   
	C. x - 1   
	D. 1/x   


```
- **Kết quả mong đợi:** 1 câu multiple_choice; nội dung và phương án được cắt bỏ khoảng trắng thừa đầu đuôi (trim).
- **Độ tin cậy:** CHẮC

---

### TC27: Câu hỏi trắc nghiệm chỉ có 2 hoặc 3 phương án lựa chọn
- **Văn bản đầu vào:**
```text
Câu 1: Số 15 có phải là số lẻ không?
A. Có
B. Không

Câu 2: Đèn tín hiệu giao thông gồm mấy màu?
A. 2 màu
B. 3 màu
C. 4 màu
```
- **Kết quả mong đợi:** 2 câu multiple_choice; Câu 1 có 2 choices (A, B); Câu 2 có 3 choices (A, B, C); không bắt buộc phải đủ 4 lựa chọn.
- **Độ tin cậy:** CHẮC

---

### TC28: Thẻ điểm số [1,0 điểm] hoặc mức độ [[TH]] ở đầu câu
- **Văn bản đầu vào:**
```text
Câu 1: [1,0 điểm] [TH] Phát biểu nào sau đây về lực ma sát là đúng?
A. Lực ma sát luôn có hại
B. Lực ma sát luôn có lợi
C. Lực ma sát trượt cản trở chuyển động trượt của vật
D. Lực ma sát không phụ thuộc vào áp lực
```
- **Kết quả mong đợi:** 1 câu multiple_choice; nội dung câu được bóc tách phần dẫn kiến thức, điểm số hoặc mức độ được tách hoặc giữ nguyên văn không làm lệch phương án.
- **Độ tin cậy:** NGHI

---
*Bảng 28 ca thử nghiệm nhập đề thi phục vụ kiểm định bộ bóc tách văn bản ExamCraft 2026.*
