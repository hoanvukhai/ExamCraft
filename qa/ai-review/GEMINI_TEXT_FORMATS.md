# PHÂN TÍCH ĐỊNH DẠNG VĂN BẢN CỦA CÁC DẠNG CÂU HỎI CHƯA ĐƯỢC BỘ PHÂN TÍCH HỖ TRỢ
*Tài liệu nghiên cứu cơ chế nhập liệu văn bản tự nhiên dành cho chủ dự án và đội ngũ phát triển*

- **Người thực hiện:** Gemini (QA & Phân tích cấu trúc dữ liệu)
- **Nhiệm vụ:** GEM-U2 (P1, Generation 13)
- **Thời điểm lập (UTC):** 2026-10-25T12:05:00Z
- **Bối cảnh hiện tại:** Bộ phân tích văn bản (exam-parser) hiện hỗ trợ 3 dạng thức câu hỏi cốt lõi:
  1. Trắc nghiệm 4 lựa chọn (A, B, C, D)
  2. Đúng/Sai nhiều ý (a, b, c, d)
  3. Trả lời ngắn / Tự luận (short_answer / essay)
- **Mục tiêu tài liệu:** Khảo sát thực tế cách giáo viên Việt Nam soạn thảo 3 dạng câu hỏi bổ trợ phổ biến: **Điền khuyết**, **Ghép nối hai cột (Cột A - Cột B)** và **Sắp xếp thứ tự**. Cung cấp 5 mẫu thực tế cho mỗi dạng, phân tích dấu hiệu nhận dạng và các điểm xung đột/nhầm lẫn với trắc nghiệm hoặc tự luận để chủ dự án xem xét định hướng hỗ trợ.

---

## PHẦN 1: CÂU HỎI ĐIỀN KHUYẾT (FILL-IN-THE-BLANK / CLOZE)

### 1. Dấu hiệu nhận diện đặc trưng
1. **Ký hiệu vị trí trống:** Giáo viên thường dùng chuỗi dấu chấm dài (...... hoặc ……), dấu gạch dưới dài (___ hoặc _____), cặp ngoặc vuông có chấm ([.....] hoặc [...]), hoặc số thứ tự đặt trong ngoặc kèm chỗ trống như (1) ......; (2) ......
2. **Khung từ khóa cho sẵn (Word Box / Bank):** Xuất hiện một dòng hoặc bảng chứa các từ/cụm từ nằm trong ngoặc vuông hoặc khung viền ngay trước đoạn văn (ví dụ: Cho các từ: [quang hợp, lục lạp, oxi, cacbonic]).
3. **Câu lệnh mở đầu:**
   - Chọn từ/cụm từ thích hợp trong khung điền vào chỗ trống...
   - Điền từ còn thiếu vào chỗ chấm để hoàn thành câu...
   - Fill in each blank with a suitable word from the box...
   - Complete the following sentences with the correct form of the words...

---

### 2. Năm mẫu văn bản thực tế của giáo viên Việt Nam

#### Mẫu DK-01: Tiếng Anh THCS - Đoạn văn điền từ tự do (Open Cloze)
```text
Câu 12: Fill in each numbered blank with ONE suitable word to complete the passage.
Tet is the most important celebration in Vietnam. It usually happens in late January or early February. Before Tet, people clean and decorate their (1) ...... with peach blossoms and marigolds. On the first day of Tet, children wear new clothes and receive lucky (2) ...... from their parents and grandparents. People visit relatives and wish each other a happy new year.
Đáp án: (1) houses; (2) money
```

#### Mẫu DK-02: Tiếng Anh THCS - Điền từ có hộp từ cho sẵn (Word Box)
```text
Câu 15: Choose the words from the box to fill in the blanks:
[ polluted | renewable | sources | save ]
Fossil fuels are non-renewable energy (1) _______. When they are burned, they release harmful gases that make the air (2) _______. Therefore, we should use solar and wind energy to protect our environment.
Đáp án: (1) sources, (2) polluted
```

#### Mẫu DK-03: Khoa học tự nhiên 6 - Điền thuật ngữ khoa học
```text
Câu 8: Điền từ hoặc cụm từ thích hợp vào chỗ trống để hoàn thiện khái niệm về sự nóng chảy:
Sự chuyển từ thể rắn sang thể lỏng của một chất gọi là sự (1) .......... Nhiệt độ tại đó chất rắn bắt đầu chuyển sang thể lỏng gọi là (2) ...........
Đáp án: (1) nóng chảy; (2) nhiệt độ nóng chảy
```

#### Mẫu DK-04: Ngữ văn 7 - Điền từ vào câu tục ngữ hoặc đoạn thơ
```text
Câu 4: Điền từ còn thiếu vào các câu tục ngữ sau:
a) Gần mực thì đen, gần đèn thì (1) .....
b) Uống nước nhớ (2) .....
c) Ăn quả nhớ kẻ (3) ..... cây
Đáp án: (1) rạng; (2) nguồn; (3) trồng
```

#### Mẫu DK-05: Toán học 6 - Điền số hoặc biểu thức vào chỗ trống
```text
Câu 6: Điền số thích hợp vào ô trống:
a) Phân số nghịch đảo của -3/5 là [.....]
b) Kết quả của phép tính (-12) + 20 là [.....]
Đáp án: a) -5/3; b) 8
```

---

### 3. Phân tích nguy cơ nhầm lẫn
- **Dễ nhầm với Tự luận ngắn (short_answer):**
  - Nếu đề không có các phương án lựa chọn, bộ phân tích hiện tại sẽ nhận diện câu điền khuyết thành một câu trả lời ngắn dạng tự luận. Điều này không làm mất nội dung nhưng học sinh sẽ không có giao diện ô nhập tương ứng từng vị trí (1), (2) mà chỉ có 1 ô nhập văn bản lớn.
- **Dễ nhầm với Trắc nghiệm nhiều lựa chọn (multiple_choice):**
  - Trong đề Tiếng Anh tốt nghiệp, rất nhiều bài đọc điền khuyết thực chất được tổ chức theo dạng: Đoạn văn có (1), (2), (3) và bên dưới là:
    Câu 1: A. in  B. on  C. at  D. to
    Câu 2: A. house  B. family  C. home  D. school
  - Trong tình huống này, bản chất là một bài đọc dùng chung (passage) kèm nhiều câu hỏi trắc nghiệm A-D, không phải dạng điền khuyết nguyên bản. Bộ phân tích cần phân biệt rõ đoạn văn là ngữ liệu chung hay là một câu hỏi đơn lẻ có nhiều ô điền.

---

## PHẦN 2: CÂU HỎI GHÉP NỐI (MATCHING - CỘT A VỚI CỘT B)

### 1. Dấu hiệu nhận diện đặc trưng
1. **Tiêu đề cột:** Luôn có hai cột văn bản hoặc bảng 2 cột mang tên: Cột A và Cột B (hoặc Nhóm 1 và Nhóm 2; Khái niệm và Định nghĩa; Nhân vật và Sự kiện).
2. **Ký hiệu đánh dấu hai vế khác nhau:**
   - Vế trái (Cột A): Đánh số thứ tự 1, 2, 3, 4 (hoặc số La Mã I, II, III, IV).
   - Vế phải (Cột B): Đánh chữ cái a, b, c, d (hoặc A, B, C, D).
3. **Câu lệnh mở đầu:**
   - Nối mỗi mục ở cột A với một mục tương ứng ở cột B...
   - Ghép các thông tin ở cột A sao cho phù hợp với nội dung ở cột B...
   - Match the words in column A with their definitions in column B...
4. **Định dạng đáp án nối:** Thường được viết thành các cặp nối như 1-c, 2-a, 3-d, 4-b hoặc 1 - C; 2 - A; 3 - D.

---

### 2. Năm mẫu văn bản thực tế của giáo viên Việt Nam

#### Mẫu GN-01: Lịch sử và Địa lý 7 - Nối nhân vật với sự kiện
```text
Câu 5: Hãy ghép nối tên nhân vật lịch sử ở cột A với sự kiện tiêu biểu ở cột B sao cho đúng:
Cột A:
1. Đinh Bộ Lĩnh
2. Lê Hoàn
3. Lý Thường Kiệt
4. Trần Hưng Đạo

Cột B:
a. Kháng chiến chống Tống lần thứ nhất (năm 981)
b. Dẹp loạn 12 sứ quân, thống nhất đất nước
c. Ba lần lãnh đạo đánh thắng quân Mông - Nguyên
d. Lãnh đạo cuộc kháng chiến chống Tống trên phòng tuyến sông Như Nguyệt

Đáp án: 1-b, 2-a, 3-d, 4-c
```

#### Mẫu GN-02: Khoa học tự nhiên 6 - Nối dụng cụ với công dụng
```text
Câu 7: Nối tên dụng cụ đo ở cột A với công dụng tương ứng ở cột B:
Cột A:
1. Cân đồng hồ
2. Nhiệt kế thủy ngân
3. Thước cuộn
4. Ống đong

Cột B:
a. Đo nhiệt độ cơ thể hoặc môi trường
b. Đo thể tích chất lỏng
c. Đo khối lượng vật
d. Đo chiều dài của lớp học hoặc sân trường

Đáp án: 1-c, 2-a, 3-d, 4-b
```

#### Mẫu GN-03: Tiếng Anh 8 - Ghép từ với định nghĩa (Vocabulary Matching)
```text
Câu 10: Match each word in column A with its appropriate meaning in column B:
Column A:
1. Volunteer
2. Community
3. Donate
4. Environment

Column B:
a. All the people who live in a particular area
b. To give money or goods to help people in need
c. A person who does work without being paid
d. The natural world in which people, animals and plants live

Đáp án: 1-c, 2-a, 3-b, 4-d
```

#### Mẫu GN-04: Tin học 8 - Nối phím tắt với chức năng trong soạn thảo
```text
Câu 3: Ghép phím tắt ở cột bên trái với chức năng tương ứng ở cột bên phải:
Cột A:
1. Ctrl + C
2. Ctrl + V
3. Ctrl + Z
4. Ctrl + S

Cột B:
a. Lưu tệp văn bản hiện thời
b. Sao chép khối văn bản đã chọn
c. Khôi phục lại thao tác trước đó (Undo)
d. Dán nội dung từ bộ nhớ đệm

Đáp án: 1-b, 2-d, 3-c, 4-a
```

#### Mẫu GN-05: Địa lý 7 - Nối khu vực với đặc điểm khí hậu
```text
Câu 9: Nối khu vực địa hình ở cột A với đặc điểm tự nhiên ở cột B:
Cột A:
1. Rừng nhiệt đới A-ma-dôn
2. Hoang mạc Xa-ha-ra
3. Dãy An-pơ

Cột B:
a. Khí hậu khô hạn bậc nhất thế giới, biên độ nhiệt ngày đêm lớn
b. Rừng rậm thường xanh nhiều tầng, mạng lưới sông ngòi dày đặc
c. Địa hình núi cao, băng tuyết bao phủ trên đỉnh quanh năm

Đáp án: 1-b, 2-a, 3-c
```

---

### 3. Phân tích nguy cơ nhầm lẫn
- **Dễ nhầm với Trắc nghiệm biến tướng:**
  - Nhiều giáo viên Việt Nam sau khi đưa ra bảng Cột A và Cột B, lại thêm 4 phương án trắc nghiệm ở dưới:
    A. 1-a, 2-b, 3-c, 4-d
    B. 1-b, 2-a, 3-d, 4-c
    C. 1-c, 2-d, 3-a, 4-b
    D. 1-d, 2-c, 3-b, 4-a
  - Khi đó, bộ phân tích trắc nghiệm sẽ nhận diện các dòng A, B, C, D bên dưới thành 4 phương án của câu multiple_choice, còn bảng ghép nối chỉ là phần nội dung câu hỏi. Đây thực chất là câu trắc nghiệm dạng gián tiếp.
- **Dễ nhầm với câu Đúng/Sai nhóm (true_false_group):**
  - Các mục a, b, c, d ở Cột B rất dễ bị bộ phân tích nhầm là 4 phát biểu a, b, c, d của câu hỏi đúng sai nếu bộ phân tích chỉ quét tìm nhãn chữ cái đầu dòng.

---

## PHẦN 3: CÂU HỎI SẮP XẾP THỨ TỰ (ORDERING / SEQUENCING)

### 1. Dấu hiệu nhận diện đặc trưng
1. **Các bước bị xáo trộn:** Đề bài đưa ra một danh sách gồm 4 đến 6 hành động hoặc sự kiện được đánh dấu bằng chữ cái (a, b, c, d, e) hoặc số (1, 2, 3, 4, 5).
2. **Câu lệnh mở đầu:**
   - Sắp xếp các bước tiến hành thí nghiệm sau theo đúng trình tự...
   - Hãy sắp xếp các sự kiện lịch sử sau theo thứ tự thời gian...
   - Sắp xếp các câu sau để tạo thành đoạn hội thoại hợp lý...
   - Put the following sentences in the correct chronological order...
3. **Định dạng chuỗi đáp án:** Thường có dấu mũi tên liên kết hoặc gạch ngang nối tiếp:
   - 2 -> 4 -> 1 -> 3
   - b - d - a - c
   - (1) -> (3) -> (2) -> (4)

---

### 2. Năm mẫu văn bản thực tế của giáo viên Việt Nam

#### Mẫu SX-01: Khoa học tự nhiên 6 - Quy trình thí nghiệm
```text
Câu 11: Sắp xếp các bước thực hiện thí nghiệm đo thể tích vật rắn không thấm nước bằng bình chia độ:
(1) Thả chìm vật rắn vào bình chia độ, thể tích nước dâng lên là V2.
(2) Đổ một lượng nước vừa phải vào bình chia độ, ghi lại thể tích nước ban đầu V1.
(3) Tính thể tích vật rắn theo công thức: V = V2 - V1.
(4) Chọn bình chia độ có giới hạn đo và độ chia nhỏ nhất thích hợp.
Thứ tự đúng là:
Đáp án: (4) -> (2) -> (1) -> (3)
```

#### Mẫu SX-02: Tiếng Anh 7 - Sắp xếp đoạn hội thoại (Conversation Ordering)
```text
Câu 8: Put the sentences (a-d) in the correct order to make a complete conversation:
a. Sure. Turn left at the traffic lights, then go straight for 200 meters. It is on your right.
b. Excuse me, could you tell me the way to the nearest post office?
c. You are welcome. Have a nice day!
d. Thank you very much for your help.
Đáp án: b -> a -> d -> c
```

#### Mẫu SX-03: Tin học 8 - Thuật toán tìm kiếm tuần tự
```text
Câu 5: Sắp xếp các bước của thuật toán tìm kiếm tuần tự theo đúng trình tự thực hiện:
1. So sánh giá trị của phần tử đang xét với khóa cần tìm k.
2. Bắt đầu từ phần tử đầu tiên của danh sách (vị trí i = 1).
3. Nếu tìm thấy hoặc đã duyệt hết danh sách thì kết thúc thuật toán.
4. Tăng chỉ số vị trí lên 1 để chuyển sang phần tử tiếp theo.
Đáp án: 2 -> 1 -> 3 -> 4
```

#### Mẫu SX-04: Lịch sử 7 - Tiến trình khởi nghĩa Lam Sơn
```text
Câu 7: Hãy sắp xếp các sự kiện lịch sử của khởi nghĩa Lam Sơn theo đúng thứ tự thời gian:
a. Chiến thắng Tốt Động - Chúc Động
b. Hội thề Lũng Nhai, dựng cờ khởi nghĩa
c. Giải phóng Nghệ An, mở rộng vùng giải phóng
d. Chiến thắng Chi Lăng - Xương Giang, buộc Vương Thông đầu hàng
Đáp án: b -> c -> a -> d
```

#### Mẫu SX-05: Ngữ văn 8 - Sắp xếp câu thành đoạn văn hoàn chỉnh
```text
Câu 9: Sắp xếp các câu văn sau thành một đoạn văn miêu tả cảnh buổi sáng ở làng quê:
(1) Mặt trời từ từ nhô lên từ phía chân trời, nhuộm hồng cả một góc mây.
(2) Làng quê bắt đầu thức giấc trong ánh nắng ban mai rực rỡ và tiếng gà gáy rộn rã.
(3) Những giọt sương đêm còn đọng lấp lánh trên từng ngọn cỏ ven đường.
(4) Làn gió sớm thoang thoảng mang theo hương thơm ngọt ngào của lúa mới.
Đáp án: (1) -> (3) -> (4) -> (2)
```

---

### 3. Phân tích nguy cơ nhầm lẫn
- **Cực kỳ dễ nhầm với Trắc nghiệm nếu các bước được ký hiệu là A, B, C, D:**
  - Nếu đề bài viết:
    a. Bước 1
    b. Bước 2
    c. Bước 3
    d. Bước 4
    Bộ phân tích văn bản rất dễ tưởng đây là 4 phương án lựa chọn và tự động gán đáp án là A hoặc gán vào câu hỏi Đúng/Sai nhóm.
- **Trắc nghiệm chọn chuỗi thứ tự:**
  - Tương tự như câu ghép nối, nhiều giáo viên đưa ra 4 chuỗi thứ tự thành các phương án A, B, C, D:
    A. 1 - 2 - 3 - 4
    B. 4 - 2 - 1 - 3
    C. 2 - 4 - 1 - 3
    D. 3 - 1 - 2 - 4
  - Khi đó đề thi trở thành câu trắc nghiệm nhiều lựa chọn tiêu chuẩn.

---

## 4. TỔNG KẾT VÀ ĐỀ XUẤT CHO CHỦ DỰ ÁN

| Dạng câu hỏi | Độ phức tạp khi nhận diện | Rủi ro nhầm lẫn chính | Khuyến nghị hướng xử lý |
|---|---|---|---|
| **Điền khuyết** | Trung bình | Nhầm với đoạn văn ngữ liệu chung (passage) hoặc câu tự luận | Hỗ trợ khi có từ khóa mở đầu (Điền từ/Fill in the blank) và các vị trí đánh số (1), (2) rõ ràng. |
| **Nối cột A - B** | Cao | Nhầm với câu Đúng/Sai nhóm do có các nhãn a, b, c, d ở Cột B | Chỉ kích hoạt nhận diện khi có rõ tiêu đề Cột A / Cột B hoặc Column A / Column B. Nếu có 4 phương án trắc nghiệm ở cuối thì chuyển sang dạng multiple_choice. |
| **Sắp xếp thứ tự** | Cao | Nhầm với các phương án lựa chọn trắc nghiệm A-D | Nhận diện dựa vào chuỗi đáp án có dấu mũi tên (-> hoặc →). Nếu giáo viên đã đóng gói thành các phương án A, B, C, D thì giữ nguyên trắc nghiệm. |

*Tài liệu phân tích định dạng văn bản phục vụ rà soát thiết kế hệ sinh thái ExamCraft.*
