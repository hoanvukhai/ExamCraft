# BỘ ĐỀ MẪU DÁN SẴN DÙNG CHO KIỂM TAY TOÀN DỰ ÁN
*Tài liệu cung cấp dữ liệu thử nghiệm chuẩn hóa dành cho Chủ dự án tự kiểm tra các tính năng của ExamCraft*

- **Người thực hiện:** Gemini (QA & Dữ liệu thử nghiệm)
- **Nhiệm vụ:** GEM-V2 (P0, Generation 14)
- **Thời điểm lập (UTC):** 2026-10-25T12:30:00Z
- **Cách dùng:** Mở từng khối đề bên dưới, bấm sao chép toàn bộ khối văn bản thô hoặc mã LaTeX, sau đó dán trực tiếp vào ô nhập của hệ thống để kiểm tra kết quả phân rã và xuất bản.

---

## 1. ĐỀ MẪU SỐ 1: VĂN BẢN THÔ ĐA DẠNG (KIỂM TRA BỘ PHÂN TÍCH TEXT PARSER)

### 1.1 Khối văn bản thô để sao chép
```text
ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ MÔN NGỮ VĂN VÀ KHOA HỌC TỰ NHIÊN
Thời gian làm bài: 45 phút

[Đọc đoạn ngữ liệu sau và trả lời các câu hỏi 1 và 2:
"Tre xanh,
Xanh tự bao giờ?
Chuyện ngày xưa… đã có bờ tre xanh.
Thân gầy guộc, lá mong manh,
Mà sao nên lũy nên thành tre ơi?
Ở đâu tre cũng xanh tươi,
Cho dù đất sỏi đất vôi bạc màu."
(Trích Tre Việt Nam - Nguyễn Duy)]

Câu 1: Đoạn thơ trên được viết theo thể thơ nào? [0,5 điểm] [NB]
A. Thể thơ tự do
B. Thể thơ lục bát*
C. Thể thơ song thất lục bát
D. Thể thơ năm chữ

Câu 2: Hình ảnh cây tre trong đoạn thơ tượng trưng cho phẩm chất gì của con người Việt Nam? [0,5 điểm] [TH]
A. Sức sống bền bỉ, kiên cường vượt qua khó khăn*
B. Lòng dũng cảm trong chiến đấu chống giặc ngoại xâm
C. Tinh thần hiếu học và sự cần cù lao động
D. Tình yêu thiên nhiên và sự gắn bó với quê hương

Câu 3: Xét tính đúng hoặc sai của các phát biểu sau về quang hợp ở thực vật: [1,0 điểm] [TH]
a) Quá trình quang hợp diễn ra chủ yếu ở bào quan lục lạp của tế bào lá cây. (đúng)
b) Quang hợp hấp thụ khí oxi và thải ra khí cacbonic vào khí quyển.
c) Ánh sáng mặt trời là nguồn năng lượng sơ cấp cho quang hợp. (đúng)
d) Nước và khí cacbonic là hai nguyên liệu chính của quá trình quang hợp. (đúng)

Câu 4: [1,0 điểm] [VD]
Một người đi xe đạp chuyển động đều trên quãng đường dài 18 km hết thời gian 1,5 giờ. Tính tốc độ của người đi xe đạp ra đơn vị km/h.
Đáp án: 12

Câu 5: Trong các phân số sau, phân số nào là phân số tối giản? [0,5 điểm] [NB]
A. 4/6
B. 5/10
C. 7/9*
D. 9/12

BẢNG ĐÁP ÁN:
1. B
2. A
3. a:Đ b:S c:Đ d:Đ
4. 12
5. C
```

### 1.2 Kết quả mong đợi sau khi phân rã
- **Tổng số câu:** 5 câu hỏi được nhận diện chính xác.
- **Ngữ liệu dùng chung (Passage):** Đoạn thơ Tre Việt Nam được bóc tách thành 1 khối ngữ liệu dùng chung gắn liền với Câu 1 và Câu 2.
- **Dạng thức từng câu:**
  - Câu 1: Nhiều lựa chọn (multiple_choice), đáp án đúng B, mức độ Nhận biết (nhan_biet), điểm 0,5.
  - Câu 2: Nhiều lựa chọn (multiple_choice), đáp án đúng A, mức độ Thông hiểu (thong_hieu), điểm 0,5.
  - Câu 3: Đúng/Sai nhóm (true_false_group), 4 phát biểu a, b, c, d với kết quả a:Đ, b:S, c:Đ, d:Đ, điểm 1,0.
  - Câu 4: Trả lời ngắn (short_answer), đáp án đúng là 12, mức độ Vận dụng (van_dung), điểm 1,0.
  - Câu 5: Nhiều lựa chọn (multiple_choice), đáp án đúng C, mức độ Nhận biết (nhan_biet), điểm 0,5.

---

## 2. ĐỀ MẪU SỐ 2: MÃ NGUỒN LATEX EX_TEST (KIỂM TRA BỘ BÓC TÁCH LATEX)

### 2.1 Khối mã LaTeX để sao chép
```latex
% ==============================================================
% ĐỀ THỬ NGHIỆM BÓC TÁCH EX_TEST LATEX
% ==============================================================

\begin{ex}%[2D1B1-1]
Giá trị nhỏ nhất của hàm số $y = x^4 - 2x^2 + 3$ trên đoạn $[0; 2]$ bằng
\choice
{$2$ \True}
{$3$}
{$11$}
{$1$}
\loigiai{Ta có $y' = 4x^3 - 4x = 4x(x^2 - 1) = 0 \Leftrightarrow x = 0$ hoặc $x = 1$ trên $[0; 2]$.
Tính giá trị: $y(0) = 3$, $y(1) = 2$, $y(2) = 11$. Vậy giá trị nhỏ nhất bằng $2$.}
\end{ex}

\begin{ex}%[2D1B2-3]
Cho hàm số $y = f(x)$ có bảng biến thiên và đồ thị trên $\mathbb{R}$. Xét tính đúng sai của các khẳng định sau:
\choiceTF
{Hàm số đồng biến trên khoảng $(-\infty; 1)$}
{Đồ thị hàm số có tiệm cận đứng là đường thẳng $x = 1$ \True}
{Hàm số đạt cực tiểu tại điểm $x = 2$ \True}
{Giá trị lớn nhất của hàm số trên $\mathbb{R}$ bằng $5$}
\loigiai{Dựa vào các đường tiệm cận và đạo hàm, mệnh đề b và c đúng.}
\end{ex}

\begin{ex}%[1D2B1-2]
Hệ phương trình $\heva{3x - 2y &= 7 \\ x + 2y &= 1}$ có nghiệm duy nhất $(x_0; y_0)$. Tính $x_0 - y_0$.
\choice
{$3$ \True}
{$-1$}
{$1$}
{$2$}
\loigiai{Cộng hai phương trình ta được $4x = 8 \Leftrightarrow x = 2$. Thay vào phương trình thứ hai ta được $y = -0.5$. Do đó $x_0 - y_0 = 2 - (-1) = 3$.}
\end{ex}

\begin{ex}%[2D1B3-4]
Cho khối chóp $S.ABC$ có đáy $ABC$ là tam giác vuông cân tại $B$, $AB = a$. Cạnh bên $SA$ vuông góc với mặt phẳng đáy và $SA = 2a$. Thể tích khối chóp đã cho bằng
\choice
{$\dfrac{a^3}{3}$ \True}
{$a^3$}
{$\dfrac{2a^3}{3}$}
{$\dfrac{a^3}{6}$}
\loigiai{Diện tích đáy $S_{\triangle ABC} = \dfrac{1}{2}a^2$. Chiều cao $h = SA = 2a$. Thể tích $V = \dfrac{1}{3} S_{\triangle ABC} \cdot SA = \dfrac{a^3}{3}$.}
\end{ex}

\begin{ex}%[2D1V1-5]
Tìm nghiệm thực của phương trình $\log_3(2x - 1) = 2$.
\shortans{5}
\loigiai{Điều kiện $2x - 1 > 0 \Leftrightarrow x > \dfrac{1}{2}$. Phương trình tương đương $2x - 1 = 3^2 = 9 \Leftrightarrow x = 5$.}
\end{ex}
```

### 2.2 Kết quả mong đợi sau khi bóc tách
- **Tổng số câu:** 5 câu hỏi phân rã độc lập.
- **Độ khó suy từ mã VTeX:**
  - Câu 1: Thẻ %[2D1B1-1] -> Thông hiểu (thong_hieu), Nhiều lựa chọn, đáp án đúng A, lời giải có ngoặc lồng đầy đủ.
  - Câu 2: Thẻ %[2D1B2-3] -> Thông hiểu (thong_hieu), Đúng/Sai nhóm (true_false_group), kết quả a:S, b:Đ, c:Đ, d:S.
  - Câu 3: Thẻ %[1D2B1-2] -> Thông hiểu (thong_hieu), Nhiều lựa chọn, đáp án đúng A, giữ nguyên macro heva.
  - Câu 4: Thẻ %[2D1B3-4] -> Thông hiểu (thong_hieu), Nhiều lựa chọn, đáp án đúng A, giữ nguyên công thức phân số lồng.
  - Câu 5: Thẻ %[2D1V1-5] -> Vận dụng (van_dung), Trả lời ngắn (short_answer), lời giải đầy đủ.

---

## 3. ĐỀ MẪU SỐ 3: TOÁN CÔNG THỨC TOÁN PHỨC TẠP (KIỂM TRA XUẤT WORD & MỞ BẰNG MICROSOFT WORD THẬT)

### 3.1 Khối văn bản đề thi để sao chép
```text
ĐỀ KIỂM TRA ĐÁNH GIÁ CHUYÊN ĐỀ CÔNG THỨC TOÁN HỌC CAO CẤP
Thời gian làm bài: 45 phút

Câu 1: Giá trị của tích phân I = \int_{0}^{1} \dfrac{2x + 1}{\sqrt{x^2 + x + 1}} \mathrm{d}x bằng bao nhiêu? [TH]
A. 2\sqrt{3} - 2*
B. \sqrt{3} - 1
C. 2\sqrt{3}
D. \dfrac{\sqrt{3} - 1}{2}
Lời giải: Đặt t = \sqrt{x^2 + x + 1} \Rightarrow t^2 = x^2 + x + 1 \Rightarrow 2t\mathrm{d}t = (2x + 1)\mathrm{d}x. Đổi cận: x = 0 \Rightarrow t = 1; x = 1 \Rightarrow t = \sqrt{3}. Khi đó I = \int_{1}^{\sqrt{3}} 2\mathrm{d}t = 2(\sqrt{3} - 1).

Câu 2: Giới hạn L = \lim_{x \to 0} \dfrac{\sqrt{1 + 2x} - \sqrt[3]{1 + 3x}}{x^2} có giá trị là: [VD]
A. -\dfrac{1}{2}
B. \dfrac{1}{2}
C. -\dfrac{1}{8}
D. -\dfrac{1}{4}*
Lời giải: Tách tử số thành (\sqrt{1+2x} - (1+x)) - (\sqrt[3]{1+3x} - (1+x)) rồi nhân liên hợp.

Câu 3: Cho hệ phương trình tuyến tính hai ẩn: \begin{cases} \dfrac{1}{x} + \dfrac{1}{y} = \dfrac{5}{6} \\ \dfrac{1}{x} - \dfrac{1}{y} = \dfrac{1}{6} \end{cases}. Nghiệm của hệ là: [TH]
A. (x; y) = (2; 3)*
B. (x; y) = (3; 2)
C. (x; y) = (1; 2)
D. (x; y) = (2; 1)
Lời giải: Cộng hai phương trình ta có 2/x = 1 => x = 2. Trừ hai phương trình có 2/y = 4/6 => y = 3.

Câu 4: Xét tính liên tục và khả vi của hàm số f(x) = \sum_{n=1}^{\infty} \dfrac{\sin(nx)}{n^2}. Phát biểu nào sau đây đúng? [VDC]
A. Hàm số gián đoạn tại mọi điểm nguyên
B. Hàm số liên tục trên toàn trục số thực \mathbb{R}*
C. Hàm số không có đạo hàm tại x = 0
D. Hàm số phân kỳ tại x = \pi
Lời giải: Chuỗi hội tụ đều theo tiêu chuẩn Weierstrass vì |\sin(nx)/n^2| \le 1/n^2. Do đó tổng là hàm số liên tục trên R.

Câu 5: Tính tổng lũy thừa S = 1^2 + 2^2 + 3^2 + \dots + n^2. Công thức tổng quát là: [NB]
A. S = \dfrac{n(n + 1)(2n + 1)}{6}*
B. S = \dfrac{n(n + 1)}{2}
C. S = \dfrac{n(n + 1)(n + 2)}{6}
D. S = \left[\dfrac{n(n + 1)}{2}\right]^2
Lời giải: Đây là công thức tổng bình phương n số nguyên dương đầu tiên.
```

### 3.2 Kết quả mong đợi khi xuất và mở bằng Microsoft Word
- Tệp tải về có đuôi .docx.
- Khi mở trong Microsoft Word thật:
  1. Các công thức toán học hiển thị dưới dạng khung công thức chuẩn OMML của Word (bấm vào công thức xuất hiện thẻ công cụ Equation trên thanh Ribbon).
  2. Tuyệt đối không còn sót mã LaTeX thô như frac, sqrt, int, sum hoặc ký hiệu đô la.
  3. Căn bậc hai, căn bậc ba, tích phân có cận trên/dưới, dấu tổng sigma hiển thị ngay ngắn, không bị vỡ font.
  4. Hệ phương trình có dấu ngoặc nhọn mở lớn bao trọn hai dòng phương trình.

---
*Tài liệu đề mẫu chuẩn hóa hỗ trợ kiểm tra thao tác thực tế ExamCraft.*
