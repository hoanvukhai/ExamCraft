# BỘ CA THỬ NGHIỆM BÓC TÁCH ĐỀ THI TỪ LATEX EX_TEST
*Căn cứ mã nguồn: src/lib/exam-parser.ts (hàm parseExTestLatex, extractBracedContent, parseVTexId) và tests/ex_test_parser.test.ts*

- **Người thực hiện:** Gemini (QA & Phân tích ca thử nghiệm)
- **Nhiệm vụ:** GEM-U1 (P0, Generation 13)
- **Thời điểm lập (UTC):** 2026-10-25T11:55:00Z
- **Mục tiêu:** Xây dựng ít nhất 20 khối LaTeX ex_test thực tế thường gặp của giáo viên Toán THPT sử dụng gói ex_test (dự án VTeX / ngân hàng đề LaTeX Việt Nam). Đầy đủ các cấu trúc: trắc nghiệm 4 lựa chọn, đúng-sai 4 ý, lời giải ngoặc lồng, hình chèn TikZ, immini, hệ phương trình heva, phân loại mã ID VTeX, câu trả lời ngắn shortans và khối chú thích.

---

## 1. TỔNG HỢP CÁC QUY TẮC BÓC TÁCH CỦA BỘ PHÂN TÍCH

Dựa trên việc đọc trực tiếp mã nguồn src/lib/exam-parser.ts:
1. **Khối câu hỏi:** Nhận diện bằng biểu thức chính quy với thẻ begin ex và end ex.
2. **Mã nhận diện VTeX:** Nằm trong thẻ %[Mã] ngay sau begin ex.
   - Chứa chữ N hoặc Y: Độ khó nhan_biet.
   - Chứa chữ B: Độ khó thong_hieu.
   - Chứa chữ K hoặc V: Độ khó van_dung.
   - Chứa chữ G hoặc C: Độ khó van_dung_cao.
   - Để trống hoặc không có chữ quy ước: Mặc định thong_hieu và gán thẻ EX_Test.
3. **Lời giải chi tiết:** Bóc tách khối loigiai bằng thuật toán đếm độ sâu ngoặc nhọn (Bracket Depth Counter), bảo toàn toàn bộ công thức lồng nhau bên trong. Nếu không có loigiai, gán mặc định thông báo xem lời giải gốc.
4. **Câu hỏi Đúng/Sai:** Nhận diện lệnh choiceTF gồm 4 ý tương ứng phím a, b, c, d. Ý nào có từ khóa True thì isCorrect = true và True được cắt bỏ khỏi nội dung hiển thị.
5. **Câu hỏi Nhiều lựa chọn:** Nhận diện lệnh choice gồm tối đa 4 phương án tương ứng nhãn A, B, C, D. Phương án có từ khóa True sẽ xác định đáp án đúng. Nếu không có True, đáp án đúng giữ nguyên undefined (không tự gán là A). Nếu có từ 2 đến 3 lựa chọn vẫn xem là câu hỏi nhiều lựa chọn; nếu chỉ có 1 lựa chọn sẽ chuyển thành trả lời ngắn.
6. **Câu hỏi Trả lời ngắn / Tự luận:** Các khối không chứa lệnh choice và choiceTF.

---

## 2. DANH SÁCH 22 CA THỬ NGHIỆM CHI TIẾT (EX-01 ĐẾN EX-22)

### Ca EX-01: Trắc nghiệm 4 lựa chọn cơ bản, đáp án đúng ở B
- **Mục đích:** Thử nghiệm bóc tách khối trắc nghiệm chuẩn, đáp án B đánh dấu True, mã độ khó Thông hiểu 1D1B1-1.
- **Độ tin cậy:** CHẮC (suy trực tiếp từ mã hiện tại).
- **Văn bản vào:**
```latex
\begin{ex}%[1D1B1-1]
Giá trị của $\dfrac{1}{2}+\dfrac{1}{3}$ là
\choice
{$\dfrac{2}{5}$}
{$\dfrac{5}{6}$ \True}
{$\dfrac{1}{6}$}
{$1$}
\loigiai{Quy đồng mẫu số: $\dfrac{3}{6}+\dfrac{2}{6}=\dfrac{5}{6}$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: thong_hieu
  - Thẻ tags: 1D1B1-1
  - Nội dung: Giá trị của $\dfrac{1}{2}+\dfrac{1}{3}$ là
  - Phương án: A ($\dfrac{2}{5}$), B ($\dfrac{5}{6}$), C ($\dfrac{1}{6}$), D ($1$)
  - Đáp án đúng: B
  - Lời giải: Quy đồng mẫu số: $\dfrac{3}{6}+\dfrac{2}{6}=\dfrac{5}{6}$.

---

### Ca EX-02: Trắc nghiệm 4 lựa chọn, đáp án đúng ở A
- **Mục đích:** Thử nghiệm đáp án đúng nằm ở phương án đầu tiên A, công thức phân số lồng nhau.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D1B1-2]
Nghiệm của phương trình $\log_2(x - 1) = 3$ là
\choice
{$x = 9$ \True}
{$x = 7$}
{$x = 8$}
{$x = 10$}
\loigiai{Điều kiện: $x > 1$. Phương trình tương đương: $x - 1 = 2^3 = 8 \Leftrightarrow x = 9$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: thong_hieu
  - Thẻ tags: 2D1B1-2
  - Nội dung: Nghiệm của phương trình $\log_2(x - 1) = 3$ là
  - Phương án: A ($x = 9$), B ($x = 7$), C ($x = 8$), D ($x = 10$)
  - Đáp án đúng: A
  - Lời giải: Điều kiện: $x > 1$. Phương trình tương đương: $x - 1 = 2^3 = 8 \Leftrightarrow x = 9$.

---

### Ca EX-03: Trắc nghiệm 4 lựa chọn, đáp án đúng ở C
- **Mục đích:** Thử nghiệm đáp án đúng ở C, phương án chứa tọa độ và số nguyên.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D1B3-1]
Đồ thị hàm số $y = x^3 - 3x + 2$ có điểm cực tiểu là
\choice
{$( -1; 4 )$}
{$( 0; 2 )$}
{$( 1; 0 )$ \True}
{$( 2; 4 )$}
\loigiai{Ta có $y' = 3x^2 - 3 = 0 \Leftrightarrow x = \pm 1$. Bảng biến thiên cho thấy điểm cực tiểu là $(1; 0)$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: thong_hieu
  - Thẻ tags: 2D1B3-1
  - Nội dung: Đồ thị hàm số $y = x^3 - 3x + 2$ có điểm cực tiểu là
  - Phương án: A ($( -1; 4 )$), B ($( 0; 2 )$), C ($( 1; 0 )$), D ($( 2; 4 )$)
  - Đáp án đúng: C
  - Lời giải: Ta có $y' = 3x^2 - 3 = 0 \Leftrightarrow x = \pm 1$. Bảng biến thiên cho thấy điểm cực tiểu là $(1; 0)$.

---

### Ca EX-04: Trắc nghiệm 4 lựa chọn, đáp án đúng ở D kèm khoảng trắng
- **Mục đích:** Thử nghiệm thẻ True nằm ở cuối lựa chọn D kèm khoảng trắng.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2H1B1-1]
Thể tích khối lăng trụ có diện tích đáy $B$ và chiều cao $h$ bằng
\choice
{$V = \dfrac{1}{3}Bh$}
{$V = \dfrac{1}{2}Bh$}
{$V = 3Bh$}
{$V = Bh$ \True }
\loigiai{Công thức tính thể tích lăng trụ là $V = B \cdot h$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: thong_hieu
  - Thẻ tags: 2H1B1-1
  - Nội dung: Thể tích khối lăng trụ có diện tích đáy $B$ và chiều cao $h$ bằng
  - Phương án: A ($V = \dfrac{1}{3}Bh$), B ($V = \dfrac{1}{2}Bh$), C ($V = 3Bh$), D ($V = Bh$)
  - Đáp án đúng: D
  - Lời giải: Công thức tính thể tích lăng trụ là $V = B \cdot h$.

---

### Ca EX-05: Trắc nghiệm 4 lựa chọn không đánh dấu đáp án đúng
- **Mục đích:** Thử nghiệm đề thi chỉ có 4 lựa chọn không kèm True. Hệ thống giữ đáp án là undefined, không tự điền bừa A.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[1D1B2-1]
Cho hàm số $y=f(x)$ liên tục trên $\mathbb{R}$. Mệnh đề nào sau đây đúng?
\choice
{Hàm số luôn có cực trị}
{Hàm số luôn đồng biến}
{Hàm số xác định trên $\mathbb{R}$}
{Hàm số là hàm chẵn}
\loigiai{Chưa có đáp án chính thức trong tài liệu gốc.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: thong_hieu
  - Thẻ tags: 1D1B2-1
  - Nội dung: Cho hàm số $y=f(x)$ liên tục trên $\mathbb{R}$. Mệnh đề nào sau đây đúng?
  - Phương án: 4 phương án như trên
  - Đáp án đúng: undefined
  - Lời giải: Chưa có đáp án chính thức trong tài liệu gốc.

---

### Ca EX-06: Câu hỏi Đúng/Sai nhóm 4 ý (\choiceTF) chuẩn định dạng 2025
- **Mục đích:** Thử nghiệm bóc tách câu hỏi Đúng/Sai dạng mới theo Chương trình 2018 (Phần II), hai ý Đúng (b và c), hai ý Sai (a và d).
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D1B2-2]
Cho hàm số $y = f(x) = x^4 - 2x^2 + 3$. Xét tính đúng sai của các mệnh đề sau:
\choiceTF
{Hàm số nghịch biến trên khoảng $(0; +\infty)$}
{Hàm số đạt cực đại tại điểm $x = 0$ \True}
{Giá trị nhỏ nhất của hàm số bằng $2$ \True}
{Đồ thị hàm số nhận trục hoành làm trục đối xứng}
\loigiai{Ta có $y' = 4x^3 - 4x = 4x(x^2 - 1) = 0 \Leftrightarrow x \in \{0; 1; -1\}$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: true_false_group
  - Độ khó: thong_hieu
  - Thẻ tags: 2D1B2-2
  - Nội dung: Cho hàm số $y = f(x) = x^4 - 2x^2 + 3$. Xét tính đúng sai của các mệnh đề sau:
  - Ý a: Hàm số nghịch biến trên khoảng $(0; +\infty)$ (Sai)
  - Ý b: Hàm số đạt cực đại tại điểm $x = 0$ (Đúng)
  - Ý c: Giá trị nhỏ nhất của hàm số bằng $2$ (Đúng)
  - Ý d: Đồ thị hàm số nhận trục hoành làm trục đối xứng (Sai)
  - Chuỗi đáp án: a:S b:Đ c:Đ d:S
  - Lời giải: Ta có $y' = 4x^3 - 4x = 4x(x^2 - 1) = 0 \Leftrightarrow x \in \{0; 1; -1\}$.

---

### Ca EX-07: Đúng/Sai nhóm 4 ý không có ý nào Đúng (\choiceTF toàn Sai)
- **Mục đích:** Thử nghiệm trường hợp tất cả 4 ý đều sai (không có True nào).
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D1B3-3]
Cho hình chóp $S.ABCD$ có đáy là hình vuông. Xét các mệnh đề sau:
\choiceTF
{$SA \perp (ABCD)$ với mọi vị trí đỉnh $S$}
{Mặt bên $SAB$ luôn là tam giác đều}
{Thể tích khối chóp bằng diện tích đáy nhân chiều cao}
{Góc giữa cạnh bên và mặt đáy luôn bằng $45^\circ$}
\loigiai{Cả 4 mệnh đề đều không chính xác trong trường hợp tổng quát.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: true_false_group
  - Ý a, b, c, d: đều có isCorrect là false
  - Chuỗi đáp án: a:S b:S c:S d:S
  - Lời giải: Cả 4 mệnh đề đều không chính xác trong trường hợp tổng quát.

---

### Ca EX-08: Đúng/Sai nhóm 4 ý cả 4 ý đều Đúng (\choiceTF toàn Đúng)
- **Mục đích:** Thử nghiệm cả 4 ý trong choiceTF đều gắn True.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D1B4-1]
Cho hình hộp chữ nhật $ABCD.A_1B_1C_1D_1$. Xét các mệnh đề sau:
\choiceTF
{Các mặt đối diện là các hình chữ nhật bằng nhau \True}
{Đường thẳng $AA_1$ song song với $CC_1$ \True}
{Mặt phẳng $(ABB_1A_1)$ song song với mặt phẳng $(CDD_1C_1)$ \True}
{Bốn đường chéo cắt nhau tại trung điểm của mỗi đường \True}
\loigiai{Theo tính chất hình hộp chữ nhật, cả bốn khẳng định trên đều đúng.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: true_false_group
  - Ý a, b, c, d: đều có isCorrect là true
  - Chuỗi đáp án: a:Đ b:Đ c:Đ d:Đ

---

### Ca EX-09: Lời giải có ngoặc nhọn lồng nhau sâu (\loigiai phức tạp)
- **Mục đích:** Kiểm tra thuật toán đếm độ sâu ngoặc nhọn xử lý nhiều tầng ngoặc trong dfrac, sqrt mà không bị cắt cụt lời giải.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D1K1-3]
Tính tích phân $I = \int_0^1 \dfrac{x}{\sqrt{x^2 + 1}} \mathrm{d}x$.
\choice
{$\sqrt{2} - 1$ \True}
{$\sqrt{2}$}
{$1$}
{$\dfrac{\sqrt{2}}{2}$}
\loigiai{Đặt $t = \sqrt{x^2 + 1} \Rightarrow t^2 = x^2 + 1 \Rightarrow t\mathrm{d}t = x\mathrm{d}x$.
Đổi cận: $x = 0 \Rightarrow t = 1$; $x = 1 \Rightarrow t = \sqrt{2}$.
Khi đó: $I = \int_1^{\sqrt{2}} \dfrac{t\mathrm{d}t}{t} = \int_1^{\sqrt{2}} \mathrm{d}t = \sqrt{2} - 1$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Đáp án đúng: A
  - Lời giải: Chứa toàn bộ nội dung tính phân phân và đổi cận, không bị mất phần ngoặc nào.

---

### Ca EX-10: Công thức có dấu ngoặc nhọn được escape
- **Mục đích:** Kiểm tra bộ phân tích không nhầm dấu ngoặc nhọn tập hợp thoát hiểm là ngoặc cấu trúc LaTeX.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[1D1B1-3]
Tập nghiệm của phương trình $x^2 - 4 = 0$ là
\choice
{$S = \{ -2; 2 \}$ \True}
{$S = \{ 2 \}$}
{$S = \{ -2 \}$}
{$S = \{-4; 4\}$}
\loigiai{Phương trình có hai nghiệm $x = 2$ và $x = -2$. Do đó $S = \{-2; 2\}$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Phương án: Các phương án giữ nguyên cặp ngoặc tập hợp mà không làm hỏng ranh giới phương án.
  - Đáp án đúng: A

---

### Ca EX-11: Hệ phương trình sử dụng macro heva
- **Mục đích:** Giáo viên Toán VTeX thường dùng lệnh heva thay cho begin cases.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[1D2B1-1]
Hệ phương trình $\heva{2x + y &= 5 \\ x - y &= 1}$ có nghiệm $(x_0; y_0)$. Giá trị $x_0 + y_0$ là
\choice
{$3$ \True}
{$1$}
{$2$}
{$4$}
\loigiai{Cộng hai vế ta được $3x = 6 \Rightarrow x = 2$. Thay vào ta có $y = 1$. Suy ra $x_0 + y_0 = 3$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Nội dung: Giữ nguyên chuỗi $\heva{2x + y &= 5 \\ x - y &= 1}$
  - Đáp án đúng: A

---

### Ca EX-12: Câu hỏi có chèn hình bằng lệnh immini
- **Mục đích:** Lệnh immini là macro phổ biến nhất trong ex_test để đặt câu hỏi bên trái và đồ thị TikZ bên phải.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D1B1-5]
\immini{
Cho hàm số $y=f(x)$ có bảng biến thiên như hình bên. Điểm cực đại của đồ thị hàm số đã cho là
\choice
{$(1; -2)$}
{$( -1; 2 )$ \True}
{$x = -1$}
{$y = 2$}
}{
\begin{tikzpicture}[scale=0.6]
\draw[->] (-2,0) -- (2,0) node[right]{$x$};
\draw[->] (0,-3) -- (0,3) node[above]{$y$};
\end{tikzpicture}
}
\loigiai{Dựa vào hình vẽ, điểm cực đại của đồ thị là $(-1; 2)$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Nội dung: Chứa toàn bộ phần văn bản trước lệnh choice.
  - Đáp án đúng: B
  - Lời giải: Dựa vào hình vẽ, điểm cực đại của đồ thị là $(-1; 2)$.

---

### Ca EX-13: Câu hỏi Trả lời ngắn theo định dạng 2025 có thẻ shortans
- **Mục đích:** Câu hỏi trả lời ngắn (Phần III đề 2025) không có choice, có thẻ shortans.
- **Độ tin cậy:** NGHI (Hiện tại nhận diện là short_answer nhưng chưa bóc tách riêng số trong thẻ thành correct_answer).
- **Văn bản vào:**
```latex
\begin{ex}%[2D1B1-4]
Tìm giá trị nhỏ nhất của hàm số $f(x) = x^2 - 4x + 7$ trên đoạn $[0; 3]$.
\shortans{3}
\loigiai{Ta có $f(x) = (x - 2)^2 + 3 \ge 3$. Đạt được khi $x = 2 \in [0; 3]$. Vậy giá trị nhỏ nhất bằng $3$.}
\end{ex}
```
- **Kết quả hiện tại của mã:**
  - Dạng: short_answer
  - Độ khó: thong_hieu
  - Nội dung: Bao gồm cả thẻ shortans.
  - Lời giải: Ta có $f(x) = (x - 2)^2 + 3 \ge 3$. Đạt được khi $x = 2 \in [0; 3]$. Vậy giá trị nhỏ nhất bằng $3$.
- **Đề xuất nâng cấp:** Nhận diện lệnh shortans để gán trực tiếp vào correct_answer và cắt bỏ thẻ khỏi nội dung câu hỏi.

---

### Ca EX-14: Mã nhận diện VTeX chứa chữ N (Nhận biết)
- **Mục đích:** Kiểm tra quy tắc phân loại độ khó nhan_biet khi mã chứa chữ N.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[1D1N1-2]
Hàm số nào sau đây là hàm số tuần hoàn?
\choice
{$y = \sin x$ \True}
{$y = x^2$}
{$y = 2^x$}
{$y = \sqrt{x}$}
\loigiai{Hàm số $y = \sin x$ là hàm số tuần hoàn chu kỳ $2\pi$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: nhan_biet
  - Thẻ tags: 1D1N1-2
  - Đáp án đúng: A

---

### Ca EX-15: Mã nhận diện VTeX chứa chữ Y (Nhận biết / Yếu)
- **Mục đích:** Kiểm tra quy tắc phân loại độ khó nhan_biet khi mã chứa chữ Y.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[0D1Y1-1]
Số nào sau đây là số nguyên tố?
\choice
{$4$}
{$6$}
{$7$ \True}
{$9$}
\loigiai{Số 7 chỉ có hai ước dương là 1 và 7.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: nhan_biet
  - Thẻ tags: 0D1Y1-1
  - Đáp án đúng: C

---

### Ca EX-16: Mã nhận diện VTeX chứa chữ V (Vận dụng)
- **Mục đích:** Kiểm tra quy tắc phân loại độ khó van_dung khi mã chứa chữ V.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D3V1-4]
Biết $\int_1^2 f(x)\mathrm{d}x = 3$. Tính $\int_1^2 [2f(x) - 1]\mathrm{d}x$.
\choice
{$5$ \True}
{$6$}
{$4$}
{$2$}
\loigiai{Ta có $\int_1^2 [2f(x) - 1]\mathrm{d}x = 2\int_1^2 f(x)\mathrm{d}x - \int_1^2 1\mathrm{d}x = 2 \cdot 3 - (2 - 1) = 5$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: van_dung
  - Thẻ tags: 2D3V1-4
  - Đáp án đúng: A

---

### Ca EX-17: Mã nhận diện VTeX chứa chữ K (Khá / Vận dụng)
- **Mục đích:** Kiểm tra quy tắc phân loại độ khó van_dung khi mã chứa chữ K.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D1K2-3]
Số đường tiệm cận ngang của đồ thị hàm số $y = \dfrac{\sqrt{x^2 + 1}}{x - 1}$ là
\choice
{$1$}
{$2$ \True}
{$0$}
{$3$}
\loigiai{$\lim_{x \to +\infty} y = 1$ và $\lim_{x \to -\infty} y = -1$. Đồ thị có 2 tiệm cận ngang.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: van_dung
  - Thẻ tags: 2D1K2-3
  - Đáp án đúng: B

---

### Ca EX-18: Mã nhận diện VTeX chứa chữ G (Giỏi / Vận dụng cao)
- **Mục đích:** Kiểm tra quy tắc phân loại độ khó van_dung_cao khi mã chứa chữ G.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2D4G2-3]
Tìm tất cả các giá trị của tham số $m$ để phương trình có đúng 3 nghiệm thực phân biệt.
\choice
{$m > 2$}
{$m < 0$}
{$0 < m < 4$ \True}
{$m \ge 4$}
\loigiai{Khảo sát hàm số và biện luận tương giao theo giá trị cực trị.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: van_dung_cao
  - Thẻ tags: 2D4G2-3
  - Đáp án đúng: C

---

### Ca EX-19: Mã nhận diện VTeX chứa chữ C (Vận dụng cao)
- **Mục đích:** Kiểm tra quy tắc phân loại độ khó van_dung_cao khi mã chứa chữ C.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[2H3C3-2]
Trong không gian $Oxyz$, khoảng cách nhỏ nhất giữa hai điểm di động trên hai đường thẳng chéo nhau bằng
\choice
{$3$}
{$\sqrt{5}$ \True}
{$2$}
{$\sqrt{6}$}
\loigiai{Dựng đoạn vuông góc chung giữa hai đường thẳng.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: van_dung_cao
  - Thẻ tags: 2H3C3-2
  - Đáp án đúng: B

---

### Ca EX-20: Khối câu hỏi không có mã VTeX
- **Mục đích:** Khối câu hỏi thông thường không gắn mã VTeX. Mặc định độ khó thong_hieu và thẻ EX_Test.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}
Cho tứ diện đều $ABCD$ cạnh $a$. Chiều cao của tứ diện bằng
\choice
{$\dfrac{a\sqrt{6}}{3}$ \True}
{$\dfrac{a\sqrt{3}}{2}$}
{$\dfrac{a\sqrt{2}}{2}$}
{$\dfrac{a\sqrt{6}}{2}$}
\loigiai{Gọi $H$ là trọng tâm tam giác $BCD$, chiều cao $AH = \dfrac{a\sqrt{6}}{3}$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Độ khó: thong_hieu
  - Thẻ tags: EX_Test
  - Đáp án đúng: A

---

### Ca EX-21: Câu hỏi trắc nghiệm có 3 lựa chọn
- **Mục đích:** Đề thi hoặc câu hỏi đặc thù chỉ có 3 lựa chọn A, B, C. Theo mã, nếu số lựa chọn lớn hơn hoặc bằng 2 thì vẫn là multiple_choice.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
\begin{ex}%[1D1B1-9]
Phương trình $\sin x = 2$ có bao nhiêu nghiệm thực?
\choice
{Vô số nghiệm}
{$0$ nghiệm \True}
{$2$ nghiệm}
\loigiai{Vì $-1 \le \sin x \le 1$ với mọi $x \in \mathbb{R}$ nên phương trình vô nghiệm.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Dạng: multiple_choice
  - Phương án: Mảng gồm 3 phần tử A, B, C
  - Đáp án đúng: B

---

### Ca EX-22: Nhiều khối liên tiếp kèm dòng chú thích dấu phần trăm
- **Mục đích:** Kiểm tra việc bóc tách liên tiếp nhiều khối câu hỏi có dòng chú thích xen kẽ bằng dấu phần trăm và khoảng trắng dư thừa giữa các câu.
- **Độ tin cậy:** CHẮC.
- **Văn bản vào:**
```latex
% ===================================
% ĐỀ KIỂM TRA THỬ TOÁN 12
% ===================================

\begin{ex}%[2D1B1-1]
Câu hỏi số 1: Đạo hàm của $y=e^x$ là
\choice
{$y'=e^x$ \True}
{$y'=xe^{x-1}$}
{$y'=\ln x$}
{$y'=1$}
\loigiai{Ta có $(e^x)' = e^x$.}
\end{ex}

% Chú thích giữa hai câu hỏi
% Biên soạn: Nhóm VTeX

\begin{ex}%[2D1B1-2]
Câu hỏi số 2: Nguyên hàm của hàm số $f(x)=1$ là
\choice
{$F(x)=x+C$ \True}
{$F(x)=1+C$}
{$F(x)=0$}
{$F(x)=x^2+C$}
\loigiai{$\int 1\mathrm{d}x = x + C$.}
\end{ex}
```
- **Kết quả mong đợi:**
  - Trả về đúng 2 câu hỏi.
  - Cả 2 câu đều có ID riêng biệt.
  - Các dòng chú thích phần trăm nằm ngoài không bị lẫn vào nội dung câu hỏi.
  - Cả hai đều có dạng multiple_choice với đáp án đúng là A.

---

## 3. TỔNG KẾT VÀ KHUYẾN NGHỊ CHO BỘ BÓC TÁCH LATEX

1. **Về độ bao phủ:** Bộ 22 ca trên bao quát toàn diện các cấu trúc cốt lõi của gói ex_test:
   - 4 dạng bài chuẩn (Trắc nghiệm 4 lựa chọn, Trắc nghiệm khuyết phương án, Đúng/Sai nhóm 4 ý, Trả lời ngắn / Tự luận).
   - Đủ 4 mức nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) qua các chữ ký hiệu VTeX (N, Y, B, K, V, G, C).
   - Xử lý chính xác các trường hợp biên: dấu ngoặc nhọn lồng nhau, ngoặc thoát hiểm, hình vẽ TikZ, immini, heva.
2. **Khuyến nghị nâng cấp tiếp theo:**
   - Hỗ trợ bóc tách thẻ shortans để tự động gán vào trường correct_answer của câu hỏi trả lời ngắn.
   - Thêm bộ lọc dọn dẹp các môi trường hình vẽ như begin tikzpicture hoặc chuyển thành chú thích đồ họa khi hiển thị ở giao diện web đơn giản.
