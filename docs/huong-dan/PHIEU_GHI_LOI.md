# PHIẾU GHI NHẬN SỰ CỐ VÀ PHẢN HỒI LỖI (BUG REPORT)
*Dành cho Giáo viên thử nghiệm và Giám thị phòng thi — Dự án ExamCraft*
*Đầu ra bàn giao: Nhiệm vụ GEM-S3 (P1, Generation 11)*

Tài liệu này cung cấp mẫu chuẩn để Thầy/Cô ghi nhận nhanh sự cố kỹ thuật trong quá trình soạn đề hoặc tổ chức thi thử nghiệm. Cuối tài liệu có 5 ví dụ thực tế đã điền mẫu giúp Thầy/Cô dễ dàng đối chiếu.

---

## PHẦN I. MẪU PHIẾU BÁO LỖI CHUẨN (DÀNH CHO GIÁO VIÊN ĐIỀN)

```text
PHIẾU BÁO CÁO LỖI KỸ THUẬT EXAMCRAFT
----------------------------------------------------------------------------------
1. Thông tin người báo:
   - Họ và tên giáo viên: ........................................................
   - Bộ môn / Khối lớp: ..........................................................
   - Thời điểm phát hiện lỗi: ...... giờ ...... ngày ....../....../202...

2. Thiết bị & Môi trường sử dụng:
   - [ ] Máy tính để bàn / Laptop (Windows / macOS)
   - [ ] Điện thoại di động / Máy tính bảng (iOS / Android)
   - Tên trình duyệt: [ ] Chrome   [ ] Edge   [ ] Safari   [ ] Khác: ............

3. Mức độ ảnh hưởng:
   - [ ] Nhẹ: Giao diện lệch chữ, sai chính tả, vẫn dùng tiếp được
   - [ ] Vừa: Tính năng không chạy nhưng không mất dữ liệu
   - [ ] Nghiêm trọng: Mất dữ liệu, đứng hình toàn trang, học sinh không nộp được bài

4. Chi tiết sự cố:
   - Thầy/Cô đang làm gì: ........................................................
   - Thao tác vừa bấm là gì: .....................................................
   - Điều nhìn thấy trên màn hình: ...............................................
   - Mong đợi của Thầy/Cô là gì: .................................................

5. Tình trạng dữ liệu:
   - Có bị mất dữ liệu không? [ ] CÓ    [ ] KHÔNG
   - Nếu có, bị mất những gì: ....................................................

6. Minh chứng đính kèm:
   - Tên tệp ảnh chụp màn hình hoặc video: .......................................
----------------------------------------------------------------------------------
```

---

## PHẦN II. NĂM VÍ DỤ ĐIỀN MẪU TỪ SỰ CỐ THỰC TẾ ĐÃ GẶP

### Ví dụ 1: Form câu hỏi biến mất khi lưu đề lần đầu
- **Người báo:** Thầy Nguyễn Văn A (Môn Toán 6)
- **Thiết bị:** Laptop Windows 11, trình duyệt Google Chrome
- **Mức độ:** Nghiêm trọng (Gây hoang mang mất dữ liệu)
- **Đang làm gì:** Soạn câu hỏi mới ở ô soạn thảo cuối trang đề thi vừa tạo, chưa bấm Lưu đề lần nào.
- **Thao tác bấm:** Bấm nút **Lưu đề** trên thanh tiêu đề góc trên bên phải.
- **Hiện tượng thấy:** Trang nhấp nháy chuyển đường dẫn URL từ editor/new sang editor/uuid-moi; ô câu hỏi đang gõ dở bị đóng lại và biến mất, danh sách câu hỏi chỉ còn các câu trước đó.
- **Mong đợi:** Sau khi máy chủ cấp mã đề mới, câu hỏi đang gõ dở phải được giữ nguyên trạng thái mở để tiếp tục chỉnh sửa.
- **Có mất dữ liệu không:** Có (bị mất đoạn văn bản đang gõ dở ở câu cuối).
- **Ảnh chụp:** Đính kèm tệp anh_01.png

---

### Ví dụ 2: Nộp bài thi trả về mã lỗi 503 khi cả lớp cùng nộp bài
- **Người báo:** Cô Trần Thị B (Môn KHTN 6)
- **Thiết bị:** 35 điện thoại thông minh của học sinh lớp 6A trong phòng thi
- **Mức độ:** Nghiêm trọng (Học sinh hoảng sợ tưởng bị 0 điểm)
- **Đang làm gì:** 35 học sinh làm bài thi 15 phút, khi đồng hồ còn 10 giây thì các em cùng nhấn nộp bài.
- **Thao tác bấm:** Học sinh bấm nút **Nộp bài**, sau đó bấm **Nộp bài ngay** trên hộp thoại xác nhận.
- **Hiện tượng thấy:** Khoảng 12 em hiện thông báo đỏ: Lỗi máy chủ bận (HTTP 503), vui lòng thử lại sau. Nút nộp bài bị khóa xám tạm thời.
- **Mong đợi:** Hệ thống xếp hàng xử lý lần lượt và trả về điểm số cho từng em mà không báo lỗi sập dịch vụ.
- **Có mất dữ liệu không:** Không (hệ thống có giữ bản nháp trên máy học sinh và khi bấm Thử nộp lại thì nộp thành công).
- **Ảnh chụp:** Đính kèm tệp anh_02.png

---

### Ví dụ 3: Nút chọn phương án Đúng/Sai quá nhỏ trên điện thoại
- **Người báo:** Em Lê Văn C (Học sinh lớp 8, Giáo viên ghi nhận lại)
- **Thiết bị:** Điện thoại iPhone SE (màn hình 4.7 inch, chiều rộng 375px)
- **Mức độ:** Vừa (Gây khó chịu và dễ bấm nhầm)
- **Đang làm gì:** Làm câu hỏi chùm Đúng/Sai gồm 4 ý nhỏ a, b, c, d môn Tin học 8.
- **Thao tác bấm:** Dùng ngón tay chạm vào nút Đ hoặc S ở cột bên phải mỗi ý.
- **Hiện tượng thấy:** Hai nút Đ và S nằm quá sát nhau và kích thước nút chỉ khoảng 24px; học sinh ngón tay lớn bấm vào nút Đ nhưng màn hình lại nhận sang nút S bên cạnh.
- **Mong đợi:** Nút bấm trên điện thoại cần có chiều rộng tối thiểu 44px, có khoảng cách đệm an toàn giữa hai lựa chọn Đúng và Sai để chạm ngón tay chính xác.
- **Có mất dữ liệu không:** Không.
- **Ảnh chụp:** Đính kèm tệp anh_03.png

---

### Ví dụ 4: Công thức toán trong tệp Word hiển thị mã nguồn thô
- **Người báo:** Thầy Phạm Quốc D (Môn Toán 9)
- **Thiết bị:** Máy tính để bàn trường học, Microsoft Word 2016
- **Mức độ:** Vừa (Không in được đề cho học sinh, phải chỉnh tay)
- **Đang làm gì:** Xuất đề thi học kỳ môn Toán ra tệp Word để in trên giấy phát cho học sinh làm bài trên lớp.
- **Thao tác bấm:** Bấm nút **Tải Word (.docx)** trên thanh tiêu đề và mở tệp bằng Word.
- **Hiện tượng thấy:** Tại câu số 3 và câu số 7, công thức phân số không hiển thị dạng toán học mà hiển thị chữ thô dạng `$x = \frac{1}{2}$`.
- **Mong đợi:** Mọi công thức toán học phải hiển thị ở định dạng công thức Office Math đẹp mắt, sẵn sàng đưa vào máy in.
- **Có mất dữ liệu không:** Không (nội dung đề trên trang web vẫn đúng).
- **Ảnh chụp:** Đính kèm tệp anh_04.png

---

### Ví dụ 5: Đường link chia sẻ đề thi không tự đổi khi giáo viên sửa đề
- **Người báo:** Cô Hoàng Thị E (Môn Ngữ văn 7)
- **Thiết bị:** Laptop cá nhân, trình duyệt Microsoft Edge
- **Mức độ:** Vừa (Gây hiểu lầm giữa các đồng nghiệp trong tổ)
- **Đang làm gì:** Tạo link chia sẻ đề thi gửi qua Zalo cho Tổ trưởng chuyên môn duyệt. Sau đó phát hiện sai chính tả nên vào sửa lại đề trên web.
- **Thao tác bấm:** Bấm **Lưu đề** sau khi sửa xong câu số 2.
- **Hiện tượng thấy:** Tổ trưởng mở lại link cũ vẫn thấy câu hỏi chưa sửa. Cô E phải bấm nút **Chia sẻ** và tạo một link mới gửi lại thì Tổ trưởng mới thấy bản sửa.
- **Mong đợi:** Giáo viên mong muốn hiểu rõ cơ chế khóa phiên bản của link chia sẻ để không thắc mắc vì sao link cũ không tự đổi nội dung.
- **Có mất dữ liệu không:** Không (đây là tính năng bảo vệ phiên bản của hệ thống, cần ghi rõ giải thích trên giao diện chia sẻ).
- **Ảnh chụp:** Đính kèm tệp anh_05.png

---
*Biểu mẫu ghi nhận sự cố phục vụ công tác bảo trì kỹ thuật ExamCraft 2026.*
