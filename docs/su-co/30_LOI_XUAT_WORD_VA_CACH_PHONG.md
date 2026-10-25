# DANH MỤC 30 TÌNH HUỐNG SỰ CỐ XUẤT TỆP WORD (.DOCX) VÀ BIỆN PHÁP PHÒNG NGỪA
*Cẩm nang kỹ thuật thực hành dành cho giáo viên và quản trị viên hệ thống ExamCraft*

Tài liệu tổng hợp 30 tình huống thực tế thường gặp khi chuyển đổi đề thi từ giao diện soạn thảo trực tuyến sang tệp văn bản Microsoft Word (.docx). Mỗi tình huống bao gồm hiện tượng quan sát, nguyên nhân kỹ thuật, cách phòng tránh khi soạn thảo và giải pháp khắc phục nhanh.

---

## NHÓM I. SỰ CỐ VỀ CÔNG THỨC TOÁN HỌC VÀ KÝ HIỆU KHOA HỌC

### 1. Công thức toán học hiển thị dưới dạng mã nguồn thô ($...$)
- **Hiện tượng:** Mở tệp Word thấy công thức vẫn hiển thị nguyên vẹn các ký tự đô-la và câu lệnh LaTeX như $\frac{a}{b}$ thay vì phân số thực thụ.
- **Nguyên nhân kỹ thuật:** Thiếu hoặc thừa dấu cách sát bên trong cặp ký hiệu đô-la, hoặc chuỗi LaTeX chứa ký tự xuống dòng bất thường khiến bộ phân tích cú pháp không nhận diện được khối công thức để chuyển sang Office Math (OMML).
- **Cách phòng tránh khi soạn:** Luôn đặt ký hiệu $ sát vào ký tự đầu và cuối của công thức (ví dụ: $x = 1$, không viết $ x = 1 $).
- **Cách khắc phục nhanh:** Trong Microsoft Word, bôi đen đoạn công thức và nhấn tổ hợp phím Alt + = để Word tự động kích hoạt trình soạn thảo phương trình.

### 2. Công thức toán chứa tiếng Việt có dấu bị lỗi ô vuông
- **Hiện tượng:** Các từ tiếng Việt chú thích bên trong công thức (ví dụ: với x > 0) bị biến thành các ô vuông hoặc dấu hỏi chấm.
- **Nguyên nhân kỹ thuật:** Phông chữ Cambria Math mặc định của Word chỉ tối ưu hóa cho các ký tự toán học và bảng mã La-tinh cơ bản, không có đầy đủ ký tự tiếng Việt Unicode dựng sẵn.
- **Cách phòng tránh khi soạn:** Sử dụng lệnh \text{...} hoặc đưa phần văn bản tiếng Việt ra bên ngoài cặp dấu công thức.
- **Cách khắc phục nhanh:** Bôi đen phần chữ tiếng Việt trong phương trình trên Word, chuyển phông chữ riêng của từ đó sang Times New Roman hoặc Calibri.

### 3. Phân số lồng nhiều tầng bị co rúm, chữ số quá nhỏ
- **Hiện tượng:** Các biểu thức phân số phức tạp nhiều tầng có các chữ số ở tử số và mẫu số tầng trong cùng bị thu nhỏ đến mức không đọc được khi in ra giấy.
- **Nguyên nhân kỹ thuật:** Trình kết xuất Word mặc định giảm kích cỡ chữ (script size) theo từng cấp độ lồng nhau của phân số.
- **Cách phòng tránh khi soạn:** Sử dụng lệnh \dfrac thay vì \frac để ép buộc kích thước chuẩn, hoặc tách biểu thức dài thành các bước tính trung gian.
- **Cách khắc phục nhanh:** Nhấp chuột phải vào phân số trong Word, chọn chế độ hiển thị Display Mode (Chế độ chuyên nghiệp).

### 4. Dấu ngoặc đơn bao quanh ma trận hoặc hệ phương trình không tự co giãn
- **Hiện tượng:** Dấu ngoặc mở và đóng chỉ cao bằng một dòng, trong khi hệ phương trình có tới 2 hoặc 3 dòng khiến dấu ngoặc bị lọt thỏm ở giữa.
- **Nguyên nhân kỹ thuật:** Sử dụng dấu ngoặc thông thường trên bàn phím thay vì các cấu trúc ngoặc co giãn động \left( và \right).
- **Cách phòng tránh khi soạn:** Luôn dùng cặp lệnh \left( ... \right) hoặc môi trường \begin{cases} ... \end{cases} cho hệ phương trình.
- **Cách khắc phục nhanh:** Chọn hệ phương trình trong Word, vào thẻ Equation (Phương trình) -> Brackets (Dấu ngoặc) và chọn kiểu ngoặc hệ phương trình tự động ôm trọn các dòng.

### 5. Ký hiệu góc và độ bị lệch dòng hoặc biến thành ký tự lạ
- **Hiện tượng:** Ký hiệu độ hoặc ký hiệu góc nhọn trên đầu chữ cái bị bay lên quá cao hoặc đè lên chữ cái bên cạnh.
- **Nguyên nhân kỹ thuật:** Sử dụng chữ cái 'o' nhỏ làm chỉ số trên hoặc dùng mã Unicode không chuẩn thay vì lệnh độ toán học.
- **Cách phòng tránh khi soạn:** Sử dụng đúng cú pháp: ^\circ cho độ (ví dụ: 90^\circ) và \widehat{ABC} cho góc.
- **Cách khắc phục nhanh:** Nhập trực tiếp ký hiệu độ bằng tổ hợp phím Alt + 0176 trên bàn phím số của Word.

### 6. Mũi tên vectơ không phủ hết độ dài đoạn thẳng
- **Hiện tượng:** Với vectơ AB, mũi tên chỉ nằm trên đầu chữ A, không kéo dài sang chữ B.
- **Nguyên nhân kỹ thuật:** Sử dụng lệnh \vec{AB} (vốn chỉ dành cho vectơ một ký tự) thay cho \overrightarrow{AB}.
- **Cách phòng tránh khi soạn:** Đối với vectơ từ 2 ký tự trở lên, luôn dùng lệnh \overrightarrow{AB}.
- **Cách khắc phục nhanh:** Trong Word, chọn khối phương trình, chọn Accent -> Overbar and Overarrows -> Chọn mũi tên kéo dài.

### 7. Công thức toán quá dài bị tràn khỏi lề phải trang giấy A4
- **Hiện tượng:** Dòng công thức đại số dài vượt qua mép phải trang giấy, phần đuôi công thức bị mất chữ khi in ấn.
- **Nguyên nhân kỹ thuật:** Office Math mặc định coi cả khối công thức là một thực thể liền mạch, không tự động ngắt dòng nếu không có chỉ dẫn vị trí ngắt.
- **Cách phòng tránh khi soạn:** Tách công thức cực dài thành các đoạn nhỏ bằng dấu bằng hoặc dấu cộng, đặt trong môi trường nhiều dòng.
- **Cách khắc phục nhanh:** Đặt con trỏ chuột trước dấu phép tính ở đoạn cần ngắt dòng trong Word, nhấn phím Shift + Enter.

---

## NHÓM II. SỰ CỐ VỀ BẢNG BIỂU VÀ DÀN TRANG MA TRẬN

### 8. Bảng số liệu hoặc ma trận đề thi bị tràn ra ngoài lề trang in
- **Hiện tượng:** Bảng có nhiều cột bị co kéo khiến mép phải của bảng nằm ngoài vùng in được của trang A4.
- **Nguyên nhân kỹ thuật:** Độ rộng bảng được cố định theo đơn vị điểm ảnh tuyệt đối thay vì tỷ lệ phần trăm co giãn theo khổ trang giấy.
- **Cách phòng tránh khi soạn:** Hạn chế các bảng có quá 6 cột trên khổ giấy A4 dọc; nếu bảng quá rộng, cân nhắc rút gọn tiêu đề cột.
- **Cách khắc phục nhanh:** Nhấp chuột phải vào bảng trong Word -> AutoFit -> AutoFit to Window (Tự động khớp với độ rộng cửa sổ).

### 9. Bảng bị cắt ngang lưng chừng, tiêu đề bảng không lặp lại ở trang sau
- **Hiện tượng:** Bảng dài kéo qua 2 trang giấy; trang thứ hai bắt đầu bằng các dòng dữ liệu mà không có dòng tiêu đề cột, gây khó hiểu cho học sinh.
- **Nguyên nhân kỹ thuật:** Chưa kích hoạt thuộc tính lặp lại dòng đầu trang (Repeat Header Rows) trong cấu trúc bảng XML của Word.
- **Cách phòng tránh khi soạn:** Với các bảng dữ liệu dài, ghi chú rõ các thông tin tóm tắt ở đầu bảng.
- **Cách khắc phục nhanh:** Bôi đen dòng tiêu đề đầu tiên của bảng trong Word -> Thẻ Layout của Table Tools -> Bấm chọn Repeat Header Rows.

### 10. Chữ trong ô bảng bị nhảy dòng từng ký tự đơn lẻ
- **Hiện tượng:** Các từ ngắn bị bẻ gãy, ví dụ từ Đúng bị ngắt thành chữ Đ ở trên và chữ úng ở dưới.
- **Nguyên nhân kỹ thuật:** Độ rộng cột quá hẹp kết hợp khoảng đệm lề ô (Cell Margins) bên trái và bên phải quá lớn.
- **Cách phòng tránh khi soạn:** Viết ngắn gọn tiêu đề các cột nhỏ (như STT, Điểm, Đ/S).
- **Cách khắc phục nhanh:** Bôi đen bảng trong Word -> Table Properties -> Options -> Giảm lề Left và Right xuống 0.05 cm.

### 11. Bảng barem chấm điểm tự luận bị lệch cột điểm số
- **Hiện tượng:** Cột ghi số điểm tối đa (0.5 đ, 1.0 đ) bị căn lề trái hoặc dính sát vào nội dung diễn giải tiêu chí.
- **Nguyên nhân kỹ thuật:** Thiếu định dạng căn chỉnh cột số học riêng biệt trong mẫu xuất Word.
- **Cách phòng tránh khi soạn:** Trong mô tả barem, phân tách rõ ràng phần tiêu chuẩn chấm và mức điểm tương ứng.
- **Cách khắc phục nhanh:** Chọn riêng cột Điểm trong bảng Word, bấm tổ hợp phím Ctrl + E (căn giữa) hoặc Ctrl + R (căn phải).

### 12. Dòng kẻ bảng bị mờ hoặc biến mất khi in ấn
- **Hiện tượng:** Trên màn hình vẫn nhìn thấy bảng nhưng khi in ra giấy các đường viền bên trong bị đứt nét hoặc mất hoàn toàn.
- **Nguyên nhân kỹ thuật:** Đường viền bảng mang độ dày quá nhỏ (dưới 0.25 pt) hoặc mang màu xám nhạt không đủ độ tương phản với máy in laser.
- **Cách phòng tránh khi soạn:** Giữ nguyên thiết lập bảng biểu mặc định của hệ thống.
- **Cách khắc phục nhanh:** Bôi đen toàn bộ bảng trong Word -> Thẻ Design -> Borders -> Chọn All Borders với độ dày chuẩn 0.5 pt màu đen.

---

## NHÓM III. SỰ CỐ VỀ HÌNH VẼ, BIỂU ĐỒ VÀ HÌNH ẢNH MINH HỌA

### 13. Hình vẽ minh họa biến thành ô vuông màu đỏ có dấu X
- **Hiện tượng:** Word hiển thị khung chữ nhật rỗng kèm thông báo không thể hiển thị hình ảnh.
- **Nguyên nhân kỹ thuật:** Chuỗi dữ liệu hình ảnh mã hóa Base64 bị cắt cụt do độ dài vượt quá giới hạn bộ đệm, hoặc đường dẫn ảnh bị chặn.
- **Cách phòng tránh khi soạn:** Tải hình ảnh có dung lượng vừa phải (dưới 2MB), định dạng PNG hoặc JPEG chuẩn.
- **Cách khắc phục nhanh:** Nhấp chuột vào khung rỗng trong Word, chọn Change Picture -> Chọn lại tệp ảnh gốc trên máy tính.

### 14. Hình vẽ vector SVG bị biến dạng hoặc mất phông chữ số học
- **Hiện tượng:** Đồ thị hàm số hoặc hình học vector bị mất các trục tọa độ hoặc các nhãn điểm A, B, C bị nhảy lung tung.
- **Nguyên nhân kỹ thuật:** Các phiên bản Word đời cũ (Word 2013 trở về trước) không hỗ trợ đầy đủ chuẩn SVG và phông chữ nhúng trong vector.
- **Cách phòng tránh khi soạn:** Sử dụng tính năng kết xuất hình ảnh của ExamCraft để tự động chuyển vector sang ảnh raster PNG độ phân giải cao trước khi xuất.
- **Cách khắc phục nhanh:** Chụp ảnh màn hình khu vực đồ thị trên trình duyệt và dán trực tiếp vào văn bản Word.

### 15. Hình ảnh chiếm trọn một trang giấy và đẩy chữ sang trang sau
- **Hiện tượng:** Chèn một hình nhỏ nhưng Word tự động mở rộng kích thước hình quá lớn, làm thừa khoảng trống trắng lớn ở trang trước.
- **Nguyên nhân kỹ thuật:** Kích thước siêu dữ liệu (DPI) của ảnh bị đặt mặc định 72 DPI khiến Word diễn giải ảnh có kích thước vật lý khổng lồ.
- **Cách phòng tránh khi soạn:** Kiểm tra kích thước hình ảnh hiển thị trong khung soạn thảo trước khi xuất đề.
- **Cách khắc phục nhanh:** Nhấp vào hình trong Word, nắm góc kéo thu nhỏ kích thước hình lại khoảng 5 đến 7 cm chiều rộng.

### 16. Hình ảnh không nằm thẳng hàng với nội dung câu hỏi
- **Hiện tượng:** Hình ảnh trôi nổi tự do trên trang giấy, che mất chữ của câu hỏi khác.
- **Nguyên nhân kỹ thuật:** Thuộc tính bao bọc văn bản (Text Wrapping) của ảnh bị đặt thành chế độ nổi (In Front of Text hoặc Square).
- **Cách phòng tránh khi soạn:** Hệ thống mặc định neo ảnh thẳng hàng cùng dòng văn bản (In Line with Text).
- **Cách khắc phục nhanh:** Nhấp vào hình trong Word, bấm vào biểu tượng Layout Options bên cạnh hình, chọn kiểu In Line with Text.

### 17. Bảng biến thiên môn Toán bị xô lệch mũi tên chiều biến thiên
- **Hiện tượng:** Các mũi tên đi lên hoặc đi xuống trong bảng biến thiên không chỉ đúng vào các giá trị cực trị tương ứng.
- **Nguyên nhân kỹ thuật:** Các cột của bảng biến thiên bị co giãn không đồng đều khi chuyển đổi sang Word.
- **Cách phòng tránh khi soạn:** Sử dụng công cụ vẽ bảng biến thiên tích hợp sẵn của ExamCraft thay vì tự gõ bảng thủ công.
- **Cách khắc phục nhanh:** Chọn bảng biến thiên trong Word, chỉnh độ rộng của các cột chứa x và f(x) bằng nhau.

---

## NHÓM IV. SỰ CỐ VỀ NGẮT TRANG VÀ BỐ CỤC ĐỀ THI

### 18. Câu hỏi trắc nghiệm bị cắt đôi giữa hai trang giấy
- **Hiện tượng:** Đề bài câu hỏi nằm ở cuối trang trước, nhưng 4 phương án trả lời A, B, C, D lại bị đẩy sang đầu trang sau.
- **Nguyên nhân kỹ thuật:** Các đoạn văn của câu hỏi chưa được áp dụng thuộc tính giữ dòng liền kề (Keep with Next) và giữ khối đoạn (Keep Lines Together).
- **Cách phòng tránh khi soạn:** Soạn câu hỏi ngắn gọn, tránh các phần dẫn quá dài không cần thiết.
- **Cách khắc phục nhanh:** Bôi đen toàn bộ câu hỏi trong Word -> Nhấp chuột phải chọn Paragraph -> Thẻ Line and Page Breaks -> Tích chọn Keep with next và Keep lines together.

### 19. Trang giấy cuối cùng bị thừa một trang trắng tinh
- **Hiện tượng:** Đề thi kết thúc ở đáy trang 2 nhưng tệp Word tự động sinh thêm trang thứ 3 hoàn toàn trắng không có chữ.
- **Nguyên nhân kỹ thuật:** Ký tự ngắt đoạn trống (Enter) hoặc ngắt phần (Section Break) nằm ở dòng cuối cùng sát đáy lề trang.
- **Cách phòng tránh khi soạn:** Xóa các dòng trắng thừa ở cuối đề thi trước khi xuất tệp.
- **Cách khắc phục nhanh:** Bấm tổ hợp phím Ctrl + Shift + 8 trong Word để hiện các ký tự ẩn, đưa con trỏ đến trang trắng cuối và nhấn phím Delete hoặc Backspace.

### 20. Tiêu đề phần hoặc tên mục nằm trơ trọi ở dòng đáy trang (Lỗi Orphan)
- **Hiện tượng:** Dòng chữ PHẦN II. TRẮC NGHIỆM ĐÚNG/SAI nằm đơn độc ở dòng cuối cùng của trang, toàn bộ câu hỏi nằm ở trang tiếp theo.
- **Nguyên nhân kỹ thuật:** Kiểu đoạn tiêu đề (Heading) bị mất thuộc tính Keep with Next.
- **Cách phòng tránh khi soạn:** Sử dụng đúng định dạng khối phần thi theo mẫu chuẩn của hệ thống.
- **Cách khắc phục nhanh:** Đặt con trỏ chuột trước dòng tiêu đề và nhấn tổ hợp phím Ctrl + Enter để chủ động ngắt sang trang mới.

### 21. Bố cục hai cột ở chế độ Song song bị lệch dòng câu hỏi và đáp án
- **Hiện tượng:** Câu hỏi ở cột bên trái không nằm ngang hàng với phần hướng dẫn giải tương ứng ở cột bên phải.
- **Nguyên nhân kỹ thuật:** Sử dụng tính năng chia cột báo chí (Newspaper Columns) thay vì cấu trúc bảng hai cột độc lập (Two-column Table).
- **Cách phòng tránh khi soạn:** Luôn xuất chế độ Song song từ tính năng chuyên dụng của ExamCraft để hệ thống khóa từng cặp câu hỏi - đáp án vào cùng một hàng của bảng.
- **Cách khắc phục nhanh:** Trong Word, điều chỉnh khoảng cách đệm đầu đoạn của ô chứa đáp án để cân bằng với ô câu hỏi bên cạnh.

### 22. Ngữ liệu dùng chung bị lặp lại nhiều lần khi xuất chế độ Song song
- **Hiện tượng:** Một đoạn văn đọc hiểu chung cho 4 câu hỏi bị in lặp lại 4 lần bên cạnh mỗi câu hỏi.
- **Nguyên nhân kỹ thuật:** Thuộc tính gán ngữ liệu (passageId) bị gắn lặp vào từng thẻ câu thay vì đặt làm ngữ liệu bao bọc cho cả chùm câu.
- **Cách phòng tránh khi soạn:** Tạo một khối Ngữ liệu chung ở đầu phần Đọc hiểu, sau đó thêm các câu hỏi con bên trong ngữ liệu đó.
- **Cách khắc phục nhanh:** Xóa các đoạn ngữ liệu lặp thừa trong Word, chỉ giữ lại một đoạn văn đầy đủ ở đầu phần bài tập.

---

## NHÓM V. SỰ CỐ VỀ PHÔNG CHỮ VÀ CHUẨN MÃ TIẾNG VIỆT

### 23. Lỗi mất dấu tiếng Việt khi mở tệp trên máy tính khác
- **Hiện tượng:** Mở tệp Word trên máy in của trường thì chữ tiếng Việt có dấu bị chuyển thành ký tự vô nghĩa hoặc khoảng trống.
- **Nguyên nhân kỹ thuật:** Tệp sử dụng phông chữ không thông dụng và máy tính mở tệp không có sẵn phông chữ đó.
- **Cách phòng tránh khi soạn:** Hệ thống ExamCraft luôn xuất tệp với các phông chữ chuẩn phổ biến toàn cầu: Times New Roman, Calibri hoặc Arial.
- **Cách khắc phục nhanh:** Bấm Ctrl + A trong Word để chọn toàn bộ văn bản, sau đó chọn lại phông chữ Times New Roman ở ô chọn phông trên thanh Home.

### 24. Ký tự tiếng Việt tổ hợp (NFD) bị tách rời dấu thanh
- **Hiện tượng:** Chữ cái và dấu thanh nằm cách rời nhau một khoảng nhỏ (ví dụ dấu sắc nằm lơ lửng bên cạnh chữ e).
- **Nguyên nhân kỹ thuật:** Dữ liệu nguồn sao chép từ một số trang web cũ sử dụng bảng mã Unicode tổ hợp (NFD) thay vì Unicode dựng sẵn (NFC).
- **Cách phòng tránh khi soạn:** Bật tính năng chuẩn hóa văn bản của ExamCraft khi dán nội dung từ nguồn bên ngoài.
- **Cách khắc phục nhanh:** Sao chép đoạn văn bị lỗi, mở công cụ chuyển mã Unikey (Ctrl + Shift + F6), chọn nguồn Unicode Tổ hợp, đích Unicode Dựng sẵn và bấm Chuyển mã, sau đó dán đè lại vào Word.

### 25. Kích thước phông chữ không đồng nhất giữa các câu hỏi
- **Hiện tượng:** Câu 1 dùng chữ cỡ 12 pt, câu 2 nhảy sang cỡ 14 pt, câu 3 lại dùng chữ cỡ 10 pt.
- **Nguyên nhân kỹ thuật:** Sao chép và dán trực tiếp câu hỏi từ nhiều nguồn tài liệu PDF hoặc web khác nhau mà không xóa định dạng gốc.
- **Cách phòng tránh khi soạn:** Khi dán văn bản từ bên ngoài, bấm phím tắt dán thuần văn bản (Ctrl + Shift + V) trên trình duyệt.
- **Cách khắc phục nhanh:** Bôi đen toàn bộ đề thi trong Word, nhập số 12 vào ô Font Size trên thanh công cụ để đồng nhất kích cỡ chữ.

---

## NHÓM VI. SỰ CỐ VỀ TƯƠNG THÍCH PHẦN MỀM VÀ BẢO VỆ TỆP

### 26. Word hiển thị thông báo tệp được tạo từ nguồn không an toàn (Protected View)
- **Hiện tượng:** Mở tệp xuất ra từ trình duyệt, Word hiện thanh màu vàng cảnh báo và không cho chỉnh sửa nội dung.
- **Nguyên nhân kỹ thuật:** Cơ chế bảo vệ của Windows tự động đánh dấu các tệp tải về từ mạng Internet hoặc trình duyệt là tệp tải ngoài (Mark of the Web).
- **Cách phòng tránh khi soạn:** Đây là hành vi bảo mật bình thường của hệ điều hành, không phải lỗi của đề thi.
- **Cách khắc phục nhanh:** Bấm nút Enable Editing (Cho phép chỉnh sửa) trên thanh màu vàng của Word để tiếp tục làm việc bình thường.

### 27. Mở tệp .docx trên Google Docs bị vỡ cấu trúc phương trình toán
- **Hiện tượng:** Tải tệp lên Google Drive để mở bằng Google Docs thì các công thức toán học bị biến thành hình ảnh mờ hoặc mất công thức.
- **Nguyên nhân kỹ thuật:** Google Docs sử dụng trình xử lý công thức riêng biệt, chưa hỗ trợ tương thích hoàn hảo chuẩn Office Math (OMML) của Microsoft Word.
- **Cách phòng tránh khi soạn:** Khuyến cáo giáo viên mở tệp đề thi bằng phần mềm Microsoft Word chính thức cài trên máy tính.
- **Cách khắc phục nhanh:** Nếu bắt buộc phải dùng Google Docs, hãy sử dụng tính năng In A4 -> Lưu dưới dạng PDF từ ExamCraft để gửi tệp PDF hoàn chỉnh.

### 28. Mở tệp trên phần mềm LibreOffice / WPS Office bị tràn lề bảng
- **Hiện tượng:** Các phần mềm văn phòng mã nguồn mở diễn giải khoảng cách lề trang (Margins) khác biệt khoảng 2 đến 3 mm so với Microsoft Word.
- **Nguyên nhân kỹ thuật:** Sai số làm tròn giữa đơn vị đo twips trong XML và đơn vị milimet của các bộ phân giải giao diện khác nhau.
- **Cách phòng tránh khi soạn:** Thiết lập lề trang trong ExamCraft ở mức chuẩn an toàn: Lề trái 2.5 cm, lề phải 1.5 cm, lề trên 2.0 cm, lề dưới 2.0 cm.
- **Cách khắc phục nhanh:** Vào mục Page Setup (Thiết lập trang) trên phần mềm đang mở, chọn lại khổ giấy A4 và điều chỉnh lề về mức tiêu chuẩn.

### 29. Tệp Word có dung lượng quá lớn (trên 20 MB) làm đơ máy in
- **Hiện tượng:** Đề thi tải về rất chậm và khi gửi lệnh in thì máy in báo lỗi đầy bộ nhớ (Memory Full).
- **Nguyên nhân kỹ thuật:** Các hình ảnh chèn vào đề thi có độ phân giải gốc của máy ảnh điện thoại (4K/8K) chưa được nén tối ưu.
- **Cách phòng tránh khi soạn:** Trước khi tải ảnh lên hệ thống, sử dụng ảnh chụp màn hình có kích thước vừa đủ để in ấn.
- **Cách khắc phục nhanh:** Mở tệp trong Word, nhấp vào một hình ảnh bất kỳ -> Thẻ Picture Format -> Bấm Compress Pictures -> Chọn độ phân giải Print (220 ppi) và áp dụng cho toàn bộ hình ảnh trong tệp.

### 30. Số thứ tự câu hỏi bị nhảy số bất thường khi ghép nhiều mã đề
- **Hiện tượng:** Câu 1 nhảy thẳng lên Câu 5 hoặc số thứ tự câu hỏi bị trùng lặp sau khi copy ghép các phần đề.
- **Nguyên nhân kỹ thuật:** Xung đột giữa danh sách đánh số tự động (Numbered List) của Word và các số thứ tự cố định dạng văn bản tĩnh.
- **Cách phòng tránh khi soạn:** ExamCraft cố định số thứ tự câu hỏi thành văn bản tĩnh độc lập (ví dụ: Câu 1., Câu 2.) để chống nhảy số.
- **Cách khắc phục nhanh:** Trong Word, bôi đen các câu bị nhảy số, bấm nút Numbering để tắt đánh số tự động và kiểm tra lại số thứ tự văn bản.

---
*Tài liệu nội bộ — Hướng dẫn xử lý sự cố xuất Word ExamCraft 2026.*
