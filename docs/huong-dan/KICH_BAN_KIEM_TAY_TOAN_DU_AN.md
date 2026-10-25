# KỊCH BẢN KIỂM TỬ THỦ CÔNG TOÀN BỘ DỰ ÁN EXAMCRAFT
*Tài liệu kiểm định thực tế toàn diện dành cho Chủ dự án — Dự án nội bộ cá nhân*

- *Người thực hiện:* Gemini (QA & Điều phối kịch bản)
- *Nhiệm vụ:* GEM-V1 (P0, Generation 14)
- *Thời điểm lập (UTC):* 2026-10-25T13:00:00Z
- *Mục tiêu:* Hướng dẫn Chủ dự án tự mình kiểm tra toàn bộ tính năng của hệ thống ExamCraft từ đầu đến cuối một cách tuần tự, dễ hiểu, không đòi hỏi kiến thức lập trình.
- *Quy ước kiểm thử:*
  + Đặt tên mọi đề thi, lớp học hoặc thư mục thử nghiệm có tiền tố *TEST-* (ví dụ: *TEST-Toan-6*, *TEST-Lop-7A*) để dễ nhận biết và xóa dọn sau khi kiểm xong.
  + Mọi nhãn nút bấm và tiêu đề giao diện đều được đối chiếu chính xác 100% với mã nguồn hệ thống.

---

## MỤC V1-1: CHUẨN BỊ MÔI TRƯỜNG, SAO LƯU DỰ PHÒNG VÀ TÀI KHOẢN

### Thao tác chuẩn bị:
1. *Sao lưu cơ sở dữ liệu trước khi thử:* Mở PowerShell từ thư mục dự án và chạy lệnh sau để bảo vệ an toàn dữ liệu:
   `powershell -NoProfile -File scripts/backup.ps1 -Execute`
   Kết quả hiển thị *BACKUP_PACKAGE_CREATED* là đã sao lưu an toàn.
2. *Chuẩn bị tài khoản thử nghiệm:*
   - Truy cập trang quản trị tài khoản tại địa chỉ: `/admin/users`.
   - Bấm nút **Cấp tài khoản giáo viên mới**.
   - Tạo ít nhất 2 tài khoản giáo viên thử nghiệm:
     + Giáo viên 1: email *gv1@examcraft.test*, bấm **Tạo tài khoản và cấp quyền**.
     + Giáo viên 2: email *gv2@examcraft.test*, bấm **Tạo tài khoản và cấp quyền**.
3. *Chuẩn bị thiết bị học sinh:* Chuẩn bị 1 cửa sổ trình duyệt ẩn danh (Incognito) trên máy tính hoặc 1 điện thoại di động có kết nối Wi-Fi cùng mạng để đóng vai học sinh làm bài thi.

### Kết quả mong đợi:
- Gói sao lưu được tạo thành công trong thư mục backups.
- Trang quản trị danh sách người dùng hiển thị 2 giáo viên mới với trạng thái hoạt động.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-2: ĐĂNG NHẬP, ĐỔI MẬT KHẨU LẦN ĐẦU VÀ NÚT HIỆN/ẨN MẬT KHẨU

### Thao tác:
1. Mở trang đăng nhập tại `/login`.
2. Nhập email *gv1@examcraft.test* và mật khẩu khởi tạo được cấp.
3. Bấm vào biểu tượng con mắt ở ô nhập mật khẩu để kiểm tra tính năng hiện và ẩn mật khẩu.
4. Bấm nút **Đăng nhập**.
5. Màn hình yêu cầu đổi mật khẩu lần đầu xuất hiện. Nhập mật khẩu mới (tối thiểu 8 ký tự, có chữ hoa, chữ thường và số) và xác nhận.
6. Bấm nút xác nhận đổi mật khẩu để vào hệ thống.

### Kết quả mong đợi:
- Nút con mắt bật/tắt hiển thị rõ ràng ký tự mật khẩu.
- Sau khi đổi mật khẩu thành công, hệ thống chuyển thẳng vào giao diện **Kho Đề Cá Nhân**.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-3: KHO ĐỀ CÁ NHÂN (TẠO, TÌM KIẾM, GẮN SAO, THÙNG RÁC, KHÔI PHỤC)

### Thao tác:
1. Từ Kho đề, bấm nút **Soạn Đề Thi Mới** hoặc bấm **Soạn đề trống mới**.
2. Đổi tên đề thi thành *TEST-Kho-De-01*, bấm **Lưu đề** rồi quay lại Kho đề.
3. Thử nghiệm gắn sao: Bấm vào biểu tượng ngôi sao trên thẻ đề thi vừa tạo để chuyển sang trạng thái quan trọng. Bấm chọn bộ lọc **Quan trọng** để xác nhận đề xuất hiện.
4. Thử nghiệm tìm kiếm: Gõ từ khóa *Kho-De* vào ô tìm kiếm, kiểm tra danh sách lọc đúng.
5. Thử nghiệm xóa và khôi phục:
   - Trên thẻ đề thi, chọn hành động chuyển vào thùng rác.
   - Nhấp chọn tab **Thùng rác** trên thanh điều hướng bên trái. Đề thi vừa xóa nằm trong thùng rác.
   - Bấm biểu tượng khôi phục để đưa đề thi trở lại kho đề chính.
   - Quay lại tab **Tất cả**, đề thi xuất hiện bình thường.

### Kết quả mong đợi:
- Bộ lọc và tìm kiếm phản hồi ngay tức thì. Đề thi đưa vào thùng rác không bị mất vĩnh viễn và khôi phục trọn vẹn.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-4: SOẠN ĐỀ TRỰC TIẾP (ĐỦ 7 DẠNG CÂU, HÌNH ẢNH, NGỮ LIỆU CHUNG, ĐIỂM 0)

### Thao tác:
1. Mở trang soạn thảo đề thi (`/editor/new`). Đặt tên đề là *TEST-Bay-Dang-Cau-Hoi*.
2. Thử nghiệm lần lượt bấm **Thêm câu hỏi** cho cả 7 dạng thức:
   - Câu 1: Nhiều lựa chọn (4 phương án A, B, C, D; tích chọn B là đáp án đúng).
   - Câu 2: Đúng/Sai (tạo 4 ý a, b, c, d; đánh dấu đúng sai từng ý).
   - Câu 3: Trả lời ngắn (nhập câu hỏi và điền đáp án chuẩn vào ô đáp số).
   - Câu 4: Tự luận (nhập đề bài và barem điểm rubric).
   - Câu 5: Điền khuyết (tạo câu hỏi có vị trí trống).
   - Câu 6: Ghép nối (tạo các cặp nối Cột A và Cột B).
   - Câu 7: Sắp xếp (tạo các bước cần sắp thứ tự).
3. Thử nghiệm chèn hình ảnh: Bấm nút tải ảnh lên thẻ câu hỏi số 1.
4. Thử nghiệm ngữ liệu dùng chung: Bấm thêm khối ngữ liệu văn bản dùng chung cho Câu 1 và Câu 2.
5. Thử nghiệm câu điểm 0: Đặt điểm số của Câu 7 là 0 điểm (câu hỏi khảo sát / không tính điểm).
6. Bấm **Lưu đề** trên thanh công cụ.

### Kết quả mong đợi:
- Cả 7 dạng câu hỏi đều hiển thị chuẩn xác trên giao diện.
- Hình ảnh hiển thị rõ ràng, câu điểm 0 được lưu hợp lệ mà không bị báo lỗi.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-5: NHẬP ĐỀ TỪ VĂN BẢN THÔ (DÙNG ĐỀ MẪU SỐ 1)

### Thao tác:
1. Trên thanh công cụ bên trái, bấm nút **Nhập đề (Word/Ảnh)**.
2. Chọn thẻ **Dán văn bản thô (AI Parser)**.
3. Mở tệp hướng dẫn `docs/huong-dan/DE_MAU_DE_KIEM_TAY.md`, sao chép toàn bộ nội dung tại mục *ĐỀ MẪU SỐ 1*.
4. Dán văn bản vào khung bên trái.
5. Bấm nút **Bắt đầu phân rã thành câu hỏi** (Lưu ý: khi chưa có khóa AI, ứng dụng tự động dùng bộ tách văn bản nội bộ).
6. Quan sát khung kết quả bên phải: kiểm tra 5 câu hỏi và đoạn ngữ liệu đọc hiểu được nhận diện.
7. Bấm nút xác nhận thêm các câu hỏi vào đề thi hiện tại.

### Kết quả mong đợi:
- Hệ thống bóc tách chính xác 5 câu hỏi (Trắc nghiệm, Đúng/Sai, Trả lời ngắn) kèm đoạn ngữ liệu Tre Việt Nam và bảng đáp án ở cuối đề.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-6: NHẬP ĐỀ TỪ MÃ LATEX EX_TEST (DÙNG ĐỀ MẪU SỐ 2)

### Thao tác:
1. Mở lại hộp thoại nhập đề bằng nút **Nhập đề (Word/Ảnh)**.
2. Chuyển sang thẻ **Mã LaTeX / EX_Test (VTeX)**.
3. Sao chép toàn bộ khối mã LaTeX tại mục *ĐỀ MẪU SỐ 2* trong tệp `DE_MAU_DE_KIEM_TAY.md`.
4. Dán vào khung nhập liệu và bấm **Bắt đầu phân rã thành câu hỏi**.
5. Kiểm tra kết quả hiển thị ở khung bên phải.

### Kết quả mong đợi:
- 5 câu hỏi LaTeX được phân rã hoàn hảo: công thức KaTeX sắc nét, các thẻ độ khó VTeX tự động chuyển thành Thông hiểu và Vận dụng, các phương án lựa chọn và đáp án đúng được nhận diện chính xác.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-7: CÔNG THỨC TOÁN, XUẤT TỆP WORD VÀ MỞ BẰNG MICROSOFT WORD THẬT

### Thao tác:
1. Dán nội dung tại mục *ĐỀ MẪU SỐ 3* (Toán công thức phức tạp) vào đề thi thử nghiệm *TEST-Xuat-Word*.
2. Quan sát hiển thị công thức trên trình duyệt: kiểm tra tích phân, giới hạn, căn thức bậc ba và hệ phương trình hiển thị rõ ràng.
3. Bấm nút **Tải Word (.docx)** trên thanh tiêu đề.
4. Mở tệp vừa tải về bằng ứng dụng Microsoft Word thật trên máy tính.
5. Kiểm tra trực quan:
   - Nhấp chuột vào một công thức: Word có nhận diện đây là đối tượng công thức toán học chuẩn (Equation OMML) hay không.
   - Kiểm tra xem có bị sót mã thô LaTeX (như dấu gạch chéo ngược, từ khóa frac, sqrt) hay không.

### Kết quả mong đợi:
- Tệp Word mở ra sạch đẹp, công thức toán học là đối tượng toán thật của Microsoft Word, căn lề và bảng biểu ngay ngắn.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-8: BA CHẾ ĐỘ XEM TRƯỚC (ĐỀ IN ẤN, BẢNG ĐÁP ÁN, SONG SONG)

### Thao tác:
1. Trong màn hình soạn thảo/xem trước đề thi, chuyển đổi qua lại giữa các thẻ:
   - Thẻ **Đề thi in ấn**: Quan sát đề hiển thị không có đáp án, sẵn sàng phát cho học sinh.
   - Thẻ **Bảng đáp án & Barem**: Kiểm tra bảng ma trận đáp án trắc nghiệm và thang điểm tự luận.
   - Thẻ **Song song**: Kiểm tra bố cục hai cột (cột bên trái là câu hỏi và ngữ liệu chung, cột bên phải là đáp án và lời giải chi tiết tương ứng).

### Kết quả mong đợi:
- Cả 3 chế độ dùng chung một nguồn dữ liệu đồng nhất. Khi sửa câu hỏi ở trình soạn, cả 3 chế độ đều cập nhật đồng thời.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-9: HOÁN VỊ MÃ ĐỀ (TRỘN ĐỀ THI ĐẢO CÂU VÀ ĐỒNG BỘ LỜI GIẢI)

### Thao tác:
1. Trên thanh công cụ bên trái, bấm nút **Trộn 4 mã đề** để mở hộp thoại **Trộn Đề Thi & Tạo Ma Trận Đáp Án**.
2. Kiểm tra danh sách 4 mã đề tự động sinh ra: 101, 102, 103, 104.
3. Đối chiếu giữa Mã đề 101 và Mã đề 102:
   - *Kiểm tra thứ tự câu hỏi:* Xác nhận thứ tự các câu hỏi trong từng phần đã được đảo ngẫu nhiên.
   - *Kiểm tra khối ngữ liệu chung:* Xác nhận các câu hỏi đi kèm bài đọc vẫn đứng liền nhau thành một khối, không bị xé lẻ.
   - *Kiểm tra đồng bộ lời giải:* Quan sát lời giải chi tiết, chữ cái phương án nhắc trong lời giải (như chọn đáp án B) đã tự động đổi theo vị trí mới của phương án.
4. Bấm nút **Trộn ngẫu nhiên lại** để tạo tổ hợp hoán vị mới.

### Kết quả mong đợi:
- Đảo câu hỏi chuẩn xác trong từng phần cấu trúc, bảo toàn khối ngữ liệu, bảng ma trận đáp án 4 mã đề sinh tự động chuẩn xác.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-10: IN ẤN A4 VÀ XUẤT PDF NHIỀU TRANG

### Thao tác:
1. Mở một đề thi có độ dài từ 10 câu trở lên (hoặc đề 60 câu).
2. Bấm nút có biểu tượng máy in mang tiêu đề **In đề thi hoặc xuất ra PDF** (nút **In / PDF** trên thanh tiêu đề).
3. Hộp thoại in của hệ điều hành mở ra.
4. Chọn mục máy in là lưu dưới dạng PDF.
5. Xem trước các trang in: kiểm tra việc ngắt trang giữa các trang A4, không có câu hỏi nào bị cắt đôi giữa chừng, không tràn lề ngang.

### Kết quả mong đợi:
- Bản in dàn trang đẹp mắt, tiêu đề trường/sở hiển thị ngay ngắn, không bị thừa thanh công cụ web.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-11: CHẾ ĐỘ TRÌNH CHIẾU TOÀN MÀN HÌNH

### Thao tác:
1. Trong không gian soạn thảo, bấm nút **Trình chiếu**.
2. Màn hình trình chiếu mở ra ở chế độ toàn màn hình.
3. Thử nghiệm các phím điều khiển:
   - Bấm nút **Câu sau →** hoặc nhấn phím mũi tên sang phải trên bàn phím để chuyển câu tiếp theo.
   - Bấm nút **← Câu trước** hoặc nhấn phím mũi tên sang trái để quay lại câu trước.
   - Bấm nút **Chữ lớn hơn** và **Chữ nhỏ hơn** để thay đổi kích cỡ chữ hiển thị.
   - Bấm nút **Hiện đáp án / lời giải** để hiển thị khung đáp án màu xanh, bấm lại để ẩn đi.
   - Nhấn phím Esc hoặc bấm **Đóng trình chiếu (Esc)** để thoát chế độ trình chiếu.

### Kết quả mong đợi:
- Trình chiếu chuyển câu mượt mà, hỗ trợ đầy đủ phím tắt bàn phím tiện lợi cho giáo viên giảng bài trên lớp.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-12: CHIA SẺ ĐỀ THI VÀ CƠ CHẾ KHÓA PHIÊN BẢN (VERSION LOCK)

### Thao tác:
1. Bấm nút **Chia sẻ** trên thanh công cụ bên trái, chọn thẻ **Link Xem / Tải Word (.docx)**.
2. Tích chọn cho phép giáo viên khác tạo bản sao, bấm **Tạo link chia sẻ** rồi bấm **Sao chép**.
3. Mở cửa sổ trình duyệt thứ hai (hoặc cửa sổ ẩn danh), dán link vừa sao chép để xem đề thi.
4. Quay lại cửa sổ thứ nhất: Sửa tiêu đề đề thi hoặc sửa nội dung 1 câu hỏi và bấm **Lưu đề**.
5. Quay lại cửa sổ thứ hai và bấm F5 tải lại trang: Kiểm tra xem đề thi ở link chia sẻ có bị thay đổi không.
6. Quay lại cửa sổ thứ nhất: Mở lại hộp chia sẻ, bấm **Thu hồi link này**.
7. Sang cửa sổ thứ hai tải lại trang: Kiểm tra xem link có bị báo hết hạn / không tìm thấy không.

### Kết quả mong đợi:
- Link chia sẻ được khóa cứng tại phiên bản lúc tạo link. Sửa đề sau đó không làm thay đổi link cũ. Khi bấm thu hồi thì link bị hủy truy cập ngay lập tức.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-13: HAI NGƯỜI CÙNG SỬA VÀ CƠ CHẾ BẢO VỆ BẢN NHÁP (XUNG ĐỘT PHIÊN BẢN)

### Thao tác:
1. Mở cùng một đề thi trên hai trình duyệt độc lập (Trình duyệt A đăng nhập Giáo viên 1, Trình duyệt B đăng nhập Giáo viên 2).
2. Tại Trình duyệt A: Sửa tiêu đề câu 1 thành *Nội dung A*, bấm **Lưu đề**. Hệ thống báo lưu thành công.
3. Tại Trình duyệt B: Không tải lại trang, sửa tiêu đề câu 1 thành *Nội dung B*, bấm **Lưu đề**.
4. Quan sát thông báo lỗi xung đột phiên bản xuất hiện ở Trình duyệt B.
5. Tại Trình duyệt B: Bấm nút **Lưu bản nháp thành đề mới**.
6. Kiểm tra lại Kho đề của Giáo viên 2: Xác nhận có thêm 1 đề thi bản sao mới chứa nguyên vẹn nội dung vừa sửa.

### Kết quả mong đợi:
- Người lưu sau không thể ghi đè làm mất công sức của người lưu trước. Nút lưu thành đề mới bảo toàn 100% bản nháp.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-14: XỬ LÝ MẤT MẠNG, TỰ ĐỒNG BỘ VÀ ĐỔI TÀI KHOẢN TRÊN CÙNG MÁY

### Thao tác:
1. Đang mở đề thi soạn thảo: Ngắt Wi-Fi hoặc tắt mạng trên máy tính.
2. Tiếp tục gõ thêm nội dung câu hỏi. Quan sát thông báo: **Mất kết nối — đang giữ bản nháp trên máy**.
3. Bấm nút **Tải bản nháp** để tải tệp JSON dự phòng về máy.
4. Bật lại kết nối Wi-Fi. Quan sát thanh trạng thái tự động đồng bộ lên máy chủ (hoặc bấm **Thử lưu lại**).
5. Thử nghiệm đổi tài khoản: Bấm biểu tượng đại diện góc phải, chọn **Đăng xuất tài khoản**. Đăng nhập bằng Giáo viên 2, xác nhận kho đề và khối nháp của Giáo viên 1 hoàn toàn không hiển thị sang Giáo viên 2.

### Kết quả mong đợi:
- Mất mạng không làm mất dữ liệu. Bản nháp cục bộ được cô lập tuyệt đối theo từng tài khoản.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-15: GIAO BÀI TRỰC TUYẾN VÀ HỌC SINH LÀM BÀI TRÊN MÁY TÍNH / ĐIỆN THOẠI

### Thao tác:
1. Trên thanh công cụ, bấm **Chia sẻ**, chọn thẻ **Giao Bài Thi Online (Chấm Tự Động)**.
2. Thiết lập thời lượng 15 phút, số lượt làm là 1, đặt Mã vào bài là *EXAM2026*.
3. Tích chọn **Trộn thứ tự câu hỏi cho mỗi học sinh** và **Trộn thứ tự đáp án A/B/C/D**.
4. Bấm nút **Giao Bài & Tạo Phòng Thi Ngay**, sau đó bấm **Sao chép** liên kết phòng thi.
5. Đóng vai học sinh:
   - Mở liên kết trên điện thoại di động (hoặc cửa sổ ẩn danh thu nhỏ 375px).
   - Nhập họ tên học sinh, nhập mã vào bài *EXAM2026*, bấm **Bắt đầu làm bài**.
   - Làm bài thử: chọn đáp án cho các câu hỏi, kiểm tra giao diện hiển thị gọn gàng, không bị tràn ngang.
   - Bấm **Nộp bài** khi hoàn thành.

### Kết quả mong đợi:
- Học sinh làm bài thuận tiện trên cả điện thoại và máy tính, đồng hồ đếm ngược chính xác, nộp bài nhận điểm ngay tức thì.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-16: CHẤM TỰ LUẬN, SỬA ĐÁP ÁN CHẤM LẠI VÀ XUẤT BẢNG ĐIỂM CSV

### Thao tác:
1. Quay lại tài khoản giáo viên, vào mục **Bài đã giao**, chọn đợt giao bài vừa tạo.
2. Tại thẻ **Bảng điểm & Bài nộp**: Thấy bài làm của học sinh vừa nộp.
3. Bấm **Xem bài**, nhập điểm và lời nhận xét cho câu tự luận, bấm lưu điểm.
4. Thử nghiệm tính năng Sửa đáp án và chấm lại:
   - Chuyển sang thẻ **Phân tích câu hỏi**.
   - Mở khối **Sửa đáp án và chấm lại**.
   - Chọn một câu trắc nghiệm bị nhầm đáp án, chọn đáp án đúng mới, nhập lý do đính chính.
   - Bấm nút **Xem trước ảnh hưởng**: Quan sát bảng đối chiếu điểm cũ và điểm mới của học sinh.
   - Bấm nút **Sửa đáp án và chấm lại** để áp dụng. Điểm số của học sinh tự động cập nhật lại.
5. Bấm nút **Xuất Excel (CSV)** để tải bảng điểm lớp về máy tính.

### Kết quả mong đợi:
- Chấm lại hàng loạt chuẩn xác, bảo toàn điểm các câu đã chấm tay, tệp CSV tải về mở được bằng Microsoft Excel rõ ràng font tiếng Việt.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-17: SAO LƯU TOÀN DIỆN VÀ THỬ NGHIỆM KHÔI PHỤC SANG DATABASE MỚI

### Thao tác:
1. Chạy lệnh sao lưu sau khi đã hoàn tất các bước kiểm tra:
   `powershell -NoProfile -File scripts/backup.ps1 -Execute`
2. Xác nhận gói sao lưu mới được sinh ra trong thư mục `backups/package-...`
3. Thử nghiệm khôi phục sang một cơ sở dữ liệu đối chiếu độc lập (không ghi đè cơ sở dữ liệu chính):
   `powershell -NoProfile -File scripts/restore.ps1 -Package backups/<tên-gói-vừa-tạo> -TargetDatabase examcraft_restore_kiem_tra -Execute`
4. Kiểm tra dòng thông báo kết thúc của lệnh.

### Kết quả mong đợi:
- Kết quả trả về là *RESTORED_VERIFIED* với trạng thái các bảng và tệp tin đều khớp 100%.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- Ghi chú: ............................................................................................................

---

## MỤC V1-18: NHÓM TÍNH NĂNG TRỢ LÝ AI (TÙY CHỌN — KHÔNG BẮT BUỘC)

> [!NOTE]
> Mục này chỉ thực hiện nếu Chủ dự án có sẵn khóa Google Gemini API cá nhân và muốn thử nghiệm khả năng tự động sinh câu hỏi bằng trí tuệ nhân tạo.

### Thao tác:
1. Trong màn hình soạn thảo, bấm biểu tượng Trợ lý AI ở góc phải trên thanh tiêu đề.
2. Bảng điều khiển trợ lý mở ra: Nhập khóa Google Gemini API cá nhân (nếu chưa lưu trong hệ thống).
3. Thử nghiệm nhập yêu cầu: *Hãy sinh cho tôi 2 câu hỏi trắc nghiệm Toán 6 về phép cộng số nguyên*.
4. Bấm nút sinh câu hỏi và quan sát kết quả trả về.
5. Bấm nút đưa câu hỏi được sinh vào đề thi.

### Kết quả mong đợi:
- Trợ lý AI trả về đúng câu hỏi chuẩn định dạng, có thể chèn trực tiếp vào đề thi chỉ với 1 cú nhấp chuột.

### Đánh giá:
- [ ] ĐẠT
- [ ] KHÔNG ĐẠT
- [ ] BỎ QUA (Chưa cấu hình khóa AI)
- Ghi chú: ............................................................................................................

---

## BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ NHANH TOÀN DỰ ÁN

| Mã mục | Tên luồng kiểm tra thực tế | Kết quả (ĐẠT / KHÔNG ĐẠT / BỎ QUA) | Ghi chú phát hiện (nếu có) |
|---|---|---|---|
| V1-1 | Chuẩn bị, sao lưu dự phòng và cấp tài khoản giáo viên | .................... | ...................................................... |
| V1-2 | Đăng nhập, đổi mật khẩu lần đầu và ẩn/hiện mật khẩu | .................... | ...................................................... |
| V1-3 | Kho đề: Tạo đề, tìm kiếm, gắn sao, thùng rác, khôi phục | .................... | ...................................................... |
| V1-4 | Soạn đề trực tiếp đủ 7 dạng câu, hình ảnh, ngữ liệu, điểm 0 | .................... | ...................................................... |
| V1-5 | Nhập đề từ văn bản thô (AI Parser) | .................... | ...................................................... |
| V1-6 | Nhập đề từ mã nguồn LaTeX EX_Test | .................... | ...................................................... |
| V1-7 | Công thức toán học, xuất Word và mở bằng Microsoft Word thật | .................... | ...................................................... |
| V1-8 | Ba chế độ xem trước (Đề in ấn, Bảng đáp án & Barem, Song song) | .................... | ...................................................... |
| V1-9 | Trộn 4 mã đề: Đảo câu trong từng phần, giữ ngữ liệu, đồng bộ lời giải | .................... | ...................................................... |
| V1-10 | In ấn A4 và xuất file PDF nhiều trang | .................... | ...................................................... |
| V1-11 | Chế độ trình chiếu toàn màn hình trên lớp | .................... | ...................................................... |
| V1-12 | Chia sẻ liên kết và cơ chế Khóa phiên bản (Version Lock) | .................... | ...................................................... |
| V1-13 | Chỉnh sửa đồng thời, xung đột phiên bản và lưu nháp thành đề riêng | .................... | ...................................................... |
| V1-14 | Mất mạng giữ nháp trên máy, tự đồng bộ và đổi tài khoản cùng máy | .................... | ...................................................... |
| V1-15 | Giao bài trực tuyến và học sinh làm bài trên máy tính / điện thoại | .................... | ...................................................... |
| V1-16 | Chấm tự luận, Sửa đáp án và chấm lại (Regrade), xuất Excel CSV | .................... | ...................................................... |
| V1-17 | Sao lưu dữ liệu và thử nghiệm khôi phục sang cơ sở dữ liệu mới | .................... | ...................................................... |
| V1-18 | Nhóm tính năng Trợ lý AI Gemini (Tùy chọn không bắt buộc) | .................... | ...................................................... |

---

## MẪU TIN NHẮN PHẢN HỒI GỬI LẠI NHANH CHO CLAUDE

Sau khi hoàn thành kiểm thử, Chủ dự án chỉ cần sao chép dòng tóm tắt và gửi lại cho Claude theo cú pháp ngắn gọn sau:

```text
KẾT QUẢ KIỂM THỬ THỰC TẾ EXAMCRAFT:
- V1-1 đến V1-8: ĐẠT
- V1-9: KHÔNG ĐẠT (ghi chú: mã đề 102 vẫn cùng thứ tự câu với 101)
- V1-10 đến V1-17: ĐẠT
- V1-18: BỎ QUA (chưa thử khóa AI)
```

---
*Tài liệu kịch bản kiểm thử toàn diện — Hệ thống quản lý thi ExamCraft 2026.*
