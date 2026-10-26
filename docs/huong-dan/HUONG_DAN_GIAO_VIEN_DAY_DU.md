# Sổ tay hướng dẫn giáo viên sử dụng ExamCraft (Bản đầy đủ)

Tài liệu hướng dẫn toàn diện dành cho giáo viên soạn thảo đề thi, nhập liệu văn bản tự nhiên, hoán vị mã đề, xuất bản in/Word, chia sẻ chuyên môn, giao bài trực tuyến và quản lý kết quả học sinh trên hệ thống ExamCraft.

---

## 1. Bắt đầu và Quản lý tài khoản

### 1.1 Đăng nhập và Bảng điều khiển chính
- *Việc bạn làm:* Mở liên kết hệ thống nội bộ do quản trị viên cung cấp. Nhập tài khoản và mật khẩu được cấp, bấm **Đăng nhập**. Nếu đăng nhập lần đầu, đổi mật khẩu theo yêu cầu để bảo mật.
- *Điều bạn thấy:* Giao diện **Kho Đề Cá Nhân** hiện ra. Thanh điều hướng trên cùng hiển thị logo ExamCraft, trạng thái khóa AI cá nhân và ảnh đại diện/tên giáo viên. Khu vực chính liệt kê các đề thi gần đây cùng các bộ lọc: **Tất cả**, **Quan trọng**, **Gần đây**, **Thùng rác**.

### 1.2 Đổi tài khoản trên cùng máy tính
- *Việc bạn làm:* Bấm vào biểu tượng ảnh đại diện ở góc phải trên cùng thanh tiêu đề, chọn **Đăng xuất tài khoản**. Sau đó giáo viên khác tiến hành đăng nhập bằng tài khoản của mình.
- *Điều bạn thấy:* Phiên làm việc cũ kết thúc hoàn toàn. Bản nháp chưa lưu và kho đề cá nhân của giáo viên trước được cô lập tuyệt đối trong bộ nhớ theo định danh tài khoản, không hiển thị và không ảnh hưởng sang tài khoản của giáo viên mới đăng nhập.

---

## 2. Soạn thảo đề thi và Cơ chế lưu trữ an toàn

### 2.1 Tạo đề thi mới
- *Việc bạn làm:* Từ Kho đề, bấm nút **Soạn Đề Thi Mới** (để tạo đề thông qua trợ lý cấu trúc) hoặc **Soạn đề trống mới** để tự nhập từng câu. Nhấp trực tiếp vào dòng tiêu đề trên thanh trên cùng để đổi tên bài thi, sau đó nhấn phím Enter hoặc nhấp chuột ra ngoài.
- *Điều bạn thấy:* Không gian soạn thảo mở ra. Thanh trạng thái trên cùng cập nhật tên đề thi và hiển thị trạng thái lưu trữ đám mây.

### 2.2 Thêm câu hỏi và nhập liệu công thức, hình ảnh
- *Việc bạn làm:* 
  - Bấm **Thêm câu hỏi**, chọn dạng thức phù hợp trong danh mục: Nhiều lựa chọn, Đúng/Sai, Trả lời ngắn, Tự luận, Điền khuyết, Ghép nối, Sắp xếp.
  - Nhập nội dung câu hỏi, các phương án đáp án và hướng dẫn giải.
  - Công thức toán học đặt trong cặp ký hiệu $ (công thức cùng dòng) hoặc $$ (công thức khối riêng).
  - Bấm nút áp dụng trên thẻ câu hỏi để xác nhận đưa câu hỏi vào cấu trúc đề.
- *Điều bạn thấy:* Thẻ câu hỏi được thêm vào đề thi với số thứ tự tự động. Công thức toán học và bảng biểu được hiển thị trực quan ngay trên trang soạn thảo.

### 2.3 Nhập đề từ văn bản thô và mã LaTeX EX_Test (Tính năng mới)
Giáo viên có thể đưa đề thi có sẵn từ Word, PDF hoặc tài liệu LaTeX vào hệ thống cực kỳ nhanh chóng:
- *Việc bạn làm:*
  1. Trên thanh công cụ bên trái, bấm nút **Nhập đề (Word/Ảnh)**.
  2. Chọn thẻ **Dán văn bản thô (AI Parser)** (nếu copy từ Word/web) hoặc thẻ **Mã LaTeX / EX_Test (VTeX)** (nếu dùng mã nguồn LaTeX).
  3. Dán toàn bộ nội dung đề thi vào khung bên trái.
  4. Bấm nút **Bắt đầu phân rã thành câu hỏi**.
  5. Kiểm tra kết quả bóc tách ở khung bên phải, sau đó bấm nút xác nhận thêm câu hỏi vào đề thi hiện tại.
- *Các định dạng văn bản được hệ thống hiểu chính xác (28 trường hợp chuẩn hóa):*
  - Tiêu đề câu hỏi: Chấp nhận *Câu 1:*, *Câu 1.*, *Câu 1 -*, *Bài 1:*, hoặc chỉ cần số trần *1)* khi văn bản không có từ *Câu*.
  - Bố trí phương án trắc nghiệm: Phương án trên 4 dòng riêng biệt, trên cùng 1 dòng, 2 phương án một dòng, hoặc phương án có ngoặc đơn *(A)*, *(B)*. Phương án dài xuống dòng tiếp diễn vẫn được gom trọn vẹn.
  - Nhận diện đáp án đúng: Ký hiệu dấu sao ngay sau phương án đúng (như A.*), từ khóa *(đúng)*, dòng *Đáp án: B* bên dưới câu hỏi, danh sách đáp án tổng hợp ở cuối đề (dạng *1. A 2. C 3. B* hoặc *1A 2B 3C*), hoặc bảng đáp án cuối đề.
  - Thẻ điểm số và mức độ nhận thức: Các thẻ như *[1,0 điểm]*, *[TH]*, *[VD]*, *[VDC]*, *[NB]* đặt ở đầu hoặc cuối câu được nhận diện tự động để gán độ khó.
  - Dạng Đúng/Sai nhiều ý: 4 phát biểu *a)*, *b)*, *c)*, *d)* theo định dạng thi 2025.
  - Ngữ liệu dùng chung (Passage): Đoạn văn đọc hiểu hoặc ngữ liệu văn bản đặt trước một nhóm câu hỏi sẽ được tự động nhận diện và gắn kết với các câu hỏi bên dưới.
  - Với mã LaTeX: Hỗ trợ trọn vẹn các lệnh chuẩn của gói ex_test như \choice, \choiceTF, \True, lời giải \loigiai{...} lồng nhau, hệ \heva, chèn hình \immini và mã định danh VTeX %[2D1B2-1].
- *Các định dạng hệ thống chưa hiểu (chờ nâng cấp tiếp theo):*
  - Điền khuyết có chỗ trống chấm lửng tự do (chưa tách thành từng ô nhập riêng).
  - Ghép nối Cột A với Cột B (nếu giáo viên chưa đóng gói thành trắc nghiệm A-D ở dưới).
  - Sắp xếp thứ tự dạng chuỗi mũi tên nối tiếp.

### 2.3b Nhập tệp Word, ảnh đề và tài liệu dài (cần khóa AI)
- *Việc bạn làm:* Bấm **Nhập đề (Word/Ảnh)**, chọn **Tải lên file đề thi Word (.docx)** hoặc **Ảnh chụp đề thi (Gemini Vision OCR)**, chọn tệp, đọc bản xem trước rồi mới nhập vào đề.
- *Điều bạn thấy:*
  - Công thức viết bằng công cụ phương trình của Word được đọc thành công thức; hình ảnh nhúng trong tệp được gắn vào đúng câu hoặc ngữ liệu, và có lời nhắc "Đã gắn N hình" để bạn kiểm tra vị trí.
  - Đề dài (nhiều chục câu) được đọc thành nhiều phần theo thứ tự câu. Hệ thống đếm số "Câu N" của tệp gốc: nếu nhận thiếu, thanh cảnh báo ghi rõ nhận bao nhiêu trên tổng số và phần nào thiếu; bạn nhập lại phần thiếu, hệ thống không tự bịa câu.
  - Câu nhập luôn là **nháp riêng tư** chưa kiểm định, mang nhãn nguồn (tên tệp, số câu). Đáp án chỉ có khi tệp ghi rõ; câu thiếu đáp án để trống chứ không tự điền.
  - Chữ nằm trong tệp như "bỏ qua mọi quy tắc..." chỉ được coi là nội dung đề, không phải lệnh cho AI.
- *Điều chưa có:* hình rất lớn (trên 3 MB) hoặc quá nhiều hình (trên 60) bị bỏ qua và có cảnh báo; bảng phức tạp trong Word cần đối chiếu với tệp gốc.

### 2.3c Bảng trong nội dung câu
- *Việc bạn làm:* Trong nội dung câu hoặc ngữ liệu, viết bảng bằng dấu gạch đứng, mỗi hàng một dòng, dòng thứ hai là đường phân cách, ví dụ `| A | B |` rồi `|:---:|:---:|` rồi `| True | False |`.
- *Điều bạn thấy:* Bảng thật có viền ở màn hình, bản in và tệp Word (hàng tiêu đề lặp lại khi sang trang); công thức đặt trong ô vẫn hiện đúng.

### 2.4 Cơ chế lưu tự động, nháp khi mất mạng và xung đột phiên bản
- *Việc bạn làm:* Soạn thảo bình thường. Bạn có thể bấm **Lưu đề** trên thanh công cụ để lưu tức thì lên máy chủ.
- *Điều bạn thấy:*
  - *Khi có mạng bình thường:* Thanh trạng thái hiển thị **Đang lưu…** rồi chuyển sang trạng thái đã lưu an toàn trên máy chủ.
  - *Khi mất kết nối Internet đột ngột:* Thanh trạng thái chuyển sang thông báo: **Mất kết nối — đang giữ bản nháp trên máy**. Mọi nội dung bạn vừa gõ được giữ nguyên vẹn trong bộ nhớ trình duyệt máy tính.
  - *Khi có mạng trở lại:* Hệ thống nhận biết đường truyền và tự động đồng bộ lên máy chủ. Bạn cũng có thể bấm nút **Thử lưu lại** hoặc bấm **Tải bản nháp** để lưu tệp dự phòng về máy tính.
  - *Khi có xung đột (đề bị sửa từ một máy khác hoặc phiên khác):* Hệ thống bảo vệ dữ liệu bằng cách không ghi đè mất mát. Nút **Lưu bản nháp thành đề mới** xuất hiện, cho phép bạn tách bản nháp thành một đề thi độc lập, hoặc bấm **Mở bản máy chủ, giữ riêng nháp** để đối chiếu.
  - *Kiểm tra nháp đã lưu trên máy:* Mở khối **Bản nháp chưa lưu trên máy này** ở đầu trang soạn thảo để xem danh sách các bản nháp cục bộ của tài khoản, bấm **Tải bản sao** hoặc **Mở nháp** khi cần.

---

## 3. Hoán vị mã đề (Trộn đề thi) và Ma trận đáp án

### 3.1 Trộn đề thi thành nhiều mã đề hoán vị
- *Việc bạn làm:* Trên thanh công cụ bên trái, bấm **Trộn 4 mã đề**, hoặc mở hộp thoại **Trộn Đề Thi & Tạo Ma Trận Đáp Án**.
- *Quy tắc trộn đề thông minh theo chuẩn GDPT 2018:*
  1. *Đảo thứ tự câu hỏi trong từng phần:* Hệ thống hoán vị vị trí câu hỏi độc lập trong từng phần cấu trúc (Phần I trắc nghiệm nhiều lựa chọn, Phần II trắc nghiệm đúng/sai, Phần III trả lời ngắn). Không bao giờ làm lẫn lộn các phần với nhau.
  2. *Bảo toàn tuyệt đối khối ngữ liệu dùng chung:* Nhóm câu hỏi đọc hiểu đi kèm một đoạn văn ngữ liệu luôn di chuyển cùng nhau thành một khối thống nhất, giữ nguyên thứ tự logic của bài đọc.
  3. *Đồng bộ lời giải theo chữ cái phương án mới:* Khi hoán vị các phương án A, B, C, D, hệ thống tự động cập nhật mọi cụm từ nhắc đến đáp án trong lời giải chi tiết (như chọn đáp án B, Phương án A, Đáp án: B) tương ứng với chữ cái mới, không bị lệch logic.
  4. *Bảo vệ câu hỏi có phương án phụ thuộc:* Những câu hỏi có phương án như Cả A và B đều đúng hoặc các phương án có gắn cờ ghim sẽ được tự động giữ nguyên thứ tự các phương án để đảm bảo tính chính xác khoa học.
  5. *Ma trận đáp án chuẩn xác:* Tự động sinh bảng đáp án tổng hợp đối chiếu cho tất cả các mã đề (101, 102, 103, 104) để giáo viên thuận tiện chấm bài. Bấm **Trộn ngẫu nhiên lại** nếu muốn đổi tổ hợp hoán vị khác.

---

## 4. Xem trước, In ấn và Xuất tệp Word (.docx)

### 4.1 Chuyển đổi các chế độ xem
- *Việc bạn làm:* Trên thanh công cụ xem trước, chuyển đổi giữa các thẻ: **Đề thi in ấn**, **Bảng đáp án & Barem**, **Hướng dẫn giải** và **Song song**.
- *Điều bạn thấy:*
  - **Đề thi in ấn:** Hiển thị trang đề sạch đẹp theo chuẩn A4, ẩn đáp án để sẵn sàng in phát cho học sinh.
  - **Bảng đáp án & Barem:** Bảng tổng hợp đáp án trắc nghiệm và thang điểm chi tiết cho các câu tự luận/điền khuyết.
  - **Hướng dẫn giải:** Lời giải chi tiết từng bước kèm công thức minh họa.
  - **Song song:** Đặt nội dung câu hỏi và đáp án/lời giải bên cạnh nhau cùng ngữ liệu dùng chung, giúp giáo viên rà soát nhanh.

### 4.2 Tải tệp Word và In A4 / Xuất PDF nhiều trang
- *Việc bạn làm:* Bấm nút **Tải Word (.docx)** hoặc bấm nút có biểu tượng máy in với tiêu đề **In đề thi hoặc xuất ra PDF** (nút **In / PDF** trên thanh tiêu đề).
- *Điều bạn thấy:*
  - Với tệp Word: Hệ thống kết xuất tệp .docx chuẩn định dạng, giữ nguyên bảng biểu, hình vẽ vector và công thức toán học sắc nét. Khi xuất ở chế độ Song song, câu hỏi và đáp án được bố trí hai cột kèm ngữ liệu chung.
  - Với chế độ In đề / Xuất PDF: Trình duyệt mở hộp thoại in chuẩn của hệ điều hành. Bản in được phân trang thông minh trên khổ A4, hỗ trợ in nhiều trang liên tục mà không bị cắt đôi câu hỏi hoặc tràn lề ngang. Giáo viên có thể gửi trực tiếp tới máy in hoặc chọn mục máy in là lưu dưới dạng tệp PDF.

---

## 5. Chia sẻ đề thi với đồng nghiệp (Khóa phiên bản)

### 5.1 Tạo liên kết chia sẻ đề thi
- *Việc bạn làm:* Bấm nút **Chia sẻ** trên thanh công cụ bên trái, chuyển sang thẻ **Link Xem / Tải Word (.docx)**. Đánh dấu chọn tùy chọn:
  - **Kèm đáp án và lời giải** (nếu muốn đồng nghiệp xem được phương án đúng).
  - **Cho giáo viên đã đăng nhập tạo bản sao** (nếu cho phép đồng nghiệp lưu về kho đề của họ để chỉnh sửa riêng).
  - Bấm nút **Tạo link chia sẻ**, sau đó bấm **Sao chép**.
- *Điều bạn thấy:* Hệ thống tạo liên kết công khai có hiệu lực trong 7 ngày. Phía dưới hiển thị đường dẫn dạng xem/tải Word. Nếu muốn hủy quyền truy cập bất kỳ lúc nào, bạn bấm **Thu hồi link này**.

### 5.2 Cơ chế Khóa phiên bản (Version Lock) của liên kết chia sẻ
- *Việc bạn làm:* Sau khi đã gửi link chia sẻ cho đồng nghiệp, bạn có thể quay lại trang soạn thảo để sửa đổi câu hỏi, đổi đáp án hoặc thêm nội dung mới.
- *Điều bạn thấy:*
  - Liên kết chia sẻ đã tạo trước đó được khóa cứng tại phiên bản đề thi lúc bấm nút tạo. Đồng nghiệp mở link cũ vẫn xem đúng bản đề đã gửi mà không bị ảnh hưởng bởi những chỉnh sửa dở dang của bạn.
  - Nếu muốn đồng nghiệp xem phiên bản mới nhất vừa sửa, bạn mở lại hộp thoại chia sẻ và bấm **Tạo link chia sẻ** mới.

### 5.3 Đồng nghiệp nhận liên kết chia sẻ
- *Việc bạn làm:* Mở liên kết chia sẻ được gửi trong trình duyệt.
- *Điều bạn thấy:* Trang xem đề hiển thị nhãn **Chế độ Chỉ Xem & Tải về**. Đồng nghiệp có thể bấm **Tải file Word (.docx)**, bấm xem in, hoặc bấm **Tạo bản sao để sửa** (nếu người tạo cho phép). Bản sao sẽ được tạo mới hoàn toàn trong kho đề của đồng nghiệp, không làm thay đổi đề gốc của người gửi.


### 5.4 Cùng soạn: góp ý và đánh dấu đã giải quyết
- *Việc bạn làm:* Mở đề đã lưu, bấm **Cùng soạn · Góp ý · Lịch sử**, mở mục **Góp ý**. Chọn câu ở ô **Câu được góp ý** (hoặc để góp ý chung cho cả đề), viết nội dung, bấm **Gửi góp ý**. Khi đã xử lý xong, bấm **Đánh dấu đã giải quyết**; cần xem lại thì bấm **Mở lại**.
- *Điều bạn thấy:* Mỗi góp ý ghi tên người viết, câu được góp ý và phiên bản của đề lúc viết; góp ý đã giải quyết mờ đi kèm "Đã giải quyết bởi <tên>".
- *Ai làm được gì:* người cùng sửa hoặc chủ đề đánh dấu được mọi góp ý; người chỉ góp ý chỉ đánh dấu được góp ý của chính mình; người chỉ xem không thấy nút. Mục **Lịch sử lưu** ghi ai lưu phiên bản nào; khôi phục luôn tạo phiên bản mới, không xóa lịch sử.

### 5.5 Ghi chú riêng cho AI: nguồn, bằng chứng và bản đọc được
- *Việc bạn làm:* Bấm **Ghi chú riêng cho AI** ở cột trái. Ghi chú AI đề xuất luôn ở trạng thái tắt chờ bạn đọc và bật. Bấm **Tải bản đọc được (.md)** để lấy bản văn bản đọc bằng Notepad, hoặc **Xuất ghi chú riêng** để lấy bản JSON nhập lại được.
- *Điều bạn thấy:* Mỗi ghi chú AI ghi nguồn (câu hay đề nào, phiên bản nào), đoạn trích làm bằng chứng và điều chưa chắc. Nếu đoạn trích AI đưa không khớp nguyên văn dữ liệu nguồn, ghi chú được đánh dấu để bạn tự đối chiếu. Độ tin cậy là AI tự chấm, không phải xác nhận chuyên môn. Tệp xuất không chứa khóa API.

---

## 6. Giao bài kiểm tra trực tuyến cho học sinh

### 6.1 Thiết lập phòng thi và Tùy chọn nâng cao
- *Việc bạn làm:* Bấm nút **Chia sẻ** trên thanh công cụ bên trái, chọn thẻ **Giao Bài Thi Online (Chấm Tự Động)**.
  - Lựa chọn hình thức nhận diện: Theo danh sách lớp hoặc Cho học sinh tự điền tên.
  - Đặt thời lượng làm bài (phút), chế độ xem kết quả và bảng xếp hạng.
  - Nhấp mở khối **Tùy chọn nâng cao: giờ mở/đóng, số lượt, mã vào bài**:
    + **Giờ mở (để trống: mở ngay):** Đặt thời điểm chính xác bắt đầu cho phép học sinh vào làm.
    + **Giờ đóng (để trống: không hạn):** Đặt thời hạn đóng phòng thi. Sau giờ này học sinh không thể bắt đầu lượt mới.
    + **Số lượt làm (1–10):** Quy định số lần tối đa mỗi học sinh được phép làm bài (mặc định là 1 cho phòng thi chính thức).
    + **Mã vào bài (4–12 chữ/số, tùy chọn):** Đặt mật khẩu phòng thi, yêu cầu học sinh phải nhập đúng mới được vào làm.
    + Đánh dấu chọn: **Trộn thứ tự câu hỏi cho mỗi học sinh**, **Trộn thứ tự đáp án A/B/C/D**, và **Yêu cầu PIN của học sinh (chỉ khi giao cho một lớp)** nếu cần kiểm soát danh tính nghiêm ngặt.
  - Bấm nút **Giao Bài & Tạo Phòng Thi Ngay**.
- *Điều bạn thấy:* Bản chụp đề thi bất biến được đóng gói. Màn hình thông báo **Phòng Thi Trực Tuyến Đã Sẵn Sàng!** xuất hiện kèm liên kết phòng thi. Bấm **Sao chép** để gửi liên kết cho học sinh, hoặc bấm **Vào phòng thi thử** để kiểm tra trải nghiệm thực tế.

### 6.2 Học sinh tham gia phòng thi
- *Việc bạn làm:* Hướng dẫn học sinh nhấp vào đường link phòng thi trên máy tính hoặc điện thoại.
- *Điều bạn thấy:*
  - Nếu có đặt Mã vào bài hoặc PIN, màn hình yêu cầu học sinh điền mã trước khi tiếp tục.
  - Học sinh chọn tên trong danh sách hoặc tự nhập họ tên, kiểm tra thời lượng và số câu, sau đó bấm **Bắt đầu làm bài**.
  - Trong quá trình làm bài, đồng hồ đếm ngược hiển thị liên tục. Khi chọn đáp án, hệ thống tự động ghi nhận nháp lên máy chủ và lưu nhật ký trên máy học sinh.
  - Khi hoàn thành, học sinh bấm **Nộp bài**. Nếu hết thời gian làm bài, hệ thống tự động khóa và nộp bài. Màn hình hiển thị điểm số tức thì (với các câu chấm tự động) và lời giải chi tiết theo cấu hình giáo viên đã đặt.

---

## 7. Theo dõi kết quả, Sửa đáp án và Chấm lại (Regrade)

### 7.1 Xem danh sách bài nộp và chấm điểm tự luận
- *Việc bạn làm:* Vào mục **Bài đã giao**, chọn đợt giao bài cần kiểm tra.
- *Điều bạn thấy:* Trang tổng quan hiển thị số bài đã nộp, điểm trung bình, điểm cao nhất và phổ điểm lớp học. Thẻ **Bảng điểm & Bài nộp** liệt kê danh sách học sinh kèm thời gian nộp, số lượt làm và điểm số.
- *Chấm tự luận/bổ sung:* Nhấp **Xem bài** của từng học sinh để xem chi tiết bài làm. Với các câu tự luận hoặc câu trả lời mở, giáo viên nhập điểm và nhận xét vào từng câu, sau đó bấm nút lưu điểm. Bấm **Xuất Excel (CSV)** để tải bảng điểm tổng hợp về máy tính.

### 7.2 Sửa đáp án và chấm lại hàng loạt (Tính năng mới ngày 25/10)
Trong trường hợp phát hiện đề thi có câu bị nhầm đáp án sau khi học sinh đã nộp bài:
- *Việc bạn làm:*
  1. Trong trang chi tiết bài đã giao, nhấp chọn thẻ **Phân tích câu hỏi**.
  2. Bấm mở khối **Sửa đáp án và chấm lại**.
  3. Tại mục **Câu cần sửa**, chọn câu hỏi có đáp án cần đính chính.
  4. Chọn **Đáp án đúng mới** (đối với câu trắc nghiệm một đáp án) hoặc điền **Các đáp án được chấp nhận (mỗi dòng một đáp án)** (đối với câu trả lời ngắn/điền khuyết).
  5. Nhập vào ô **Lý do (bắt buộc, lưu vào lịch sử)** (tối thiểu 3 ký tự, ví dụ: Đính chính đáp án câu 5).
  6. Bấm nút **Xem trước ảnh hưởng**.
  7. Quan sát kết quả xem trước. Khi đã đối chiếu chính xác, bấm nút **Sửa đáp án và chấm lại** để áp dụng thực tế.
- *Điều bạn thấy:*
  - Khi bấm **Xem trước ảnh hưởng**, khung thông tin hiển thị số lượng bài thi bị thay đổi điểm, số bài không đổi, và nêu rõ: các bài học sinh đã được giáo viên tự chấm tay sẽ được giữ nguyên điểm số (không bị ghi đè tự động). Danh sách học sinh cùng mức điểm cũ và mức điểm mới được liệt kê chi tiết.
  - Khi bấm **Sửa đáp án và chấm lại**, hệ thống cập nhật lại điểm toàn bộ bài nộp tương ứng, ghi nhận sự kiện vào mục **Lịch sử sửa đáp án** kèm thời gian và lý do đính chính.

---

## 8. Hướng dẫn xử lý các tình huống sự cố thường gặp

### 8.1 Mất kết nối Internet trong lúc soạn thảo
- *Hiện tượng:* Xuất hiện cảnh báo **Mất kết nối — đang giữ bản nháp trên máy**.
- *Cách xử lý:* 
  1. Tuyệt đối không đóng tab trình duyệt và không xóa lịch sử duyệt web.
  2. Bạn vẫn có thể tiếp tục thao tác soạn câu hỏi bình thường.
  3. Để an toàn tuyệt đối, bấm nút **Tải bản nháp** để lưu một bản tệp .json về máy tính.
  4. Khi mạng Internet kết nối lại, hệ thống sẽ tự động đồng bộ. Nếu thông báo chưa tắt, bấm **Thử lưu lại**.

### 8.2 Bị báo xung đột phiên bản (Đề đã được sửa ở nơi khác)
- *Hiện tượng:* Thanh trạng thái báo lỗi xung đột phiên bản dữ liệu.
- *Cách xử lý:* 
  1. Bấm **Lưu bản nháp thành đề mới** để lưu toàn bộ công sức bạn vừa sửa thành một bản sao đề thi mới trong kho đề.
  2. Mở đề mới đó để kiểm tra hoặc đối chiếu lại với đề cũ. Thao tác này đảm bảo bạn không bao giờ bị mất bài sửa khi cùng lúc có người khác mở đề.

### 8.3 Không tải được tệp Word (.docx) hoặc báo lỗi kết xuất
- *Hiện tượng:* Nhấp nút **Tải Word (.docx)** nhưng tệp không tải về hoặc báo lỗi.
- *Cách xử lý:*
  1. Kiểm tra các câu hỏi có công thức toán phức tạp hoặc hình ảnh chèn vào đề.
  2. Thử bấm nút **In đề thi hoặc xuất ra PDF**: Trình duyệt sẽ mở trực tiếp chế độ in ấn chất lượng cao. Bạn có thể chọn mục Máy in là lưu dưới dạng PDF để phát hành ngay đề thi cho học sinh.
  3. Nếu cần chỉnh sửa trên Word, hãy làm mới lại trang trình duyệt và thử xuất lại.

### 8.4 Học sinh báo không vào được bài kiểm tra
- *Hiện tượng:* Học sinh mở liên kết nhưng nhận thông báo lỗi không thể truy cập bài thi.
- *Cách xử lý:*
  1. *Kiểm tra giờ mở và giờ đóng:* Mở trang bài đã giao, kiểm tra xem bài thi đã đến giờ mở chưa hoặc đã quá giờ đóng phòng thi hay chưa.
  2. *Kiểm tra Mã vào bài:* Nếu bạn có đặt Mã vào bài, hãy nhắc học sinh nhập đúng từng ký tự (mã không phân biệt chữ hoa/thường).
  3. *Kiểm tra số lượt làm:* Nếu quy định số lượt là 1 và học sinh đã bấm nộp bài trước đó, học sinh sẽ không thể vào làm lại. Nếu muốn cho học sinh làm lại, giáo viên tạo một đợt giao bài mới hoặc điều chỉnh số lượt làm bài.
  4. *Kiểm tra mã PIN:* Khi giao bài theo lớp và bật yêu cầu mã PIN, học sinh cần nhập chính xác mã PIN cá nhân do giáo viên cung cấp.

---
*Tài liệu hướng dẫn nội bộ ExamCraft — Cập nhật đầy đủ tính năng ngày 25/10/2026.*
