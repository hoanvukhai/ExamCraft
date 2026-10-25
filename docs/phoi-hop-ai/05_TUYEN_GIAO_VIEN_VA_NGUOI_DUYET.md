# KẾ HOẠCH TUYỂN GIÁO VIÊN VÀ NGƯỜI DUYỆT CHUYÊN MÔN THÍ ĐIỂM (PILOT)
*Tài liệu hướng dẫn điều phối dành riêng cho Chủ dự án ExamCraft*
*Căn cứ mốc kế hoạch điều phối 24/10/2026: docs/phoi-hop-ai/04_MOC_PILOT.md*

> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC DÀNH CHO CÁC HỆ THỐNG AI VÀ ĐỘI NGŨ KỸ THUẬT:**
> Tài liệu này được biên soạn độc quyền để **Chủ dự án xem xét và trực tiếp sử dụng**. Toàn bộ các AI (Claude, Gemini, Codex) và nhóm phát triển **tuyệt đối không được tự ý liên hệ, gửi thư mời, gọi điện hoặc cam kết với bất kỳ cá nhân, giáo viên hay cơ sở giáo dục nào bên ngoài** khi chưa có phê duyệt chính thức bằng văn bản từ Chủ dự án.

---

## 1. MỤC TIÊU ĐỢT THỬ NGHIỆM THÍ ĐIỂM

Đợt thí điểm (Pilot) nhằm mục đích kiểm tra tính ổn định thực tế, độ tin cậy sư phạm và trải nghiệm người dùng cuối trong môi trường trường học kiểm soát hẹp:
- **Thời lượng:** Mỗi đợt thử nghiệm diễn ra từ 2 đến 3 buổi làm việc (tổng cộng 3 đến 5 giờ).
- **Môi trường:** Chạy trên máy chủ cục bộ hoặc môi trường thử nghiệm bảo mật của dự án. Không yêu cầu đưa dữ liệu nhạy cảm lên mạng công cộng.
- **Quy mô nhân sự tối thiểu:** Ít nhất 6 giáo viên đứng lớp tương ứng với 6 môn học cốt lõi (Toán 6, Ngữ văn 11, Tiếng Anh 8, Khoa học tự nhiên 6, Lịch sử và Địa lí 7, Tin học 8) cùng 2 đến 3 chuyên gia thẩm định chuyên môn.

---

## 2. TIÊU CHÍ LỰA CHỌN GIÁO VIÊN VÀ NGƯỜI DUYỆT THEO MÔN

### A. Giáo viên bộ môn Toán lớp 6
- **Kinh nghiệm:** Đang trực tiếp giảng dạy Toán 6 theo Chương trình GDPT 2018 (ưu tiên đã dạy từ 1 năm trở lên theo bộ sách Kết nối tri thức hoặc Cánh Diều hoặc Chân trời sáng tạo).
- **Năng lực trọng tâm:** Soạn thảo công thức số học, phân số, hình học trực quan; kiểm tra khả năng hiển thị công thức toán LaTeX trên thiết bị di động.
- **Thái độ:** Sẵn sàng kiểm tra thuật toán chấm điểm câu trả lời ngắn với các định dạng số thập phân, phân số tương đương.

### B. Giáo viên bộ môn Ngữ văn lớp 11
- **Kinh nghiệm:** Đang giảng dạy Ngữ văn cấp Trung học phổ thông, quen thuộc với cấu trúc đề kiểm tra đánh giá năng lực theo định hướng mới.
- **Năng lực trọng tâm:** Thao tác với văn bản ngữ liệu đọc hiểu dung lượng lớn (từ 500 đến 1000 chữ); kiểm tra barem chấm điểm tự luận và tính năng chấm bài trên giao diện web.
- **Thái độ:** Chú trọng thẩm định tính liền mạch của ngữ liệu và giao diện hiển thị hai cột (văn bản một bên, câu hỏi một bên).

### C. Giáo viên bộ môn Tiếng Anh lớp 8
- **Kinh nghiệm:** Giáo viên Tiếng Anh cấp THCS, có thói quen ứng dụng công nghệ trong kiểm tra đánh giá thường xuyên và định kỳ.
- **Năng lực trọng tâm:** Thẩm định dạng câu hỏi điền khuyết (Cloze Test), bài tập ngữ âm trọng âm, trắc nghiệm ngữ pháp; kiểm tra việc không phân biệt chữ hoa, chữ thường khi học sinh nộp bài.
- **Thái độ:** Cởi mở với công cụ trực tuyến, phản hồi về độ nhạy và thời gian phản hồi khi học sinh làm bài tập nhanh.

### D. Giáo viên bộ môn Khoa học tự nhiên lớp 6
- **Kinh nghiệm:** Giáo viên dạy tích hợp Khoa học tự nhiên (hoặc giáo viên chuyên ban Vật lý, Hóa học, Sinh học được bồi dưỡng dạy KHTN).
- **Năng lực trọng tâm:** Soạn thảo đề thi tích hợp liên môn có bảng số liệu thực nghiệm, sơ đồ thí nghiệm; kiểm tra dạng câu hỏi ghép nối cặp thuật ngữ và hiện tượng.
- **Thái độ:** Chú trọng tính chính xác của các đơn vị đo lường và sơ đồ trực quan.

### E. Giáo viên bộ môn Lịch sử và Địa lí lớp 7
- **Kinh nghiệm:** Giáo viên dạy tích hợp phân môn Lịch sử hoặc Địa lí lớp 7 cấp THCS.
- **Năng lực trọng tâm:** Soạn thảo câu hỏi dựa trên kênh hình (lược đồ, bản đồ lịch sử, biểu đồ khí hậu); kiểm tra việc hiển thị đúng tiếng Việt có dấu chuẩn Unicode (không lỗi phông chữ).
- **Thái độ:** Tỉ mỉ trong việc kiểm tra mốc thời gian, địa danh và trích dẫn tư liệu lịch sử.

### F. Giáo viên bộ môn Tin học lớp 8
- **Kinh nghiệm:** Giáo viên Tin học THCS, nắm vững chương trình Tin học GDPT 2018 (chủ đề thuật toán, bảng tính, mạng máy tính và đạo đức số).
- **Năng lực trọng tâm:** Đánh giá đề thi có dạng chùm câu hỏi Đúng/Sai, câu hỏi sắp xếp thứ tự các bước thuật toán; có tư duy phản biện kỹ thuật cao.
- **Thái độ:** Sẵn sàng thử nghiệm các thao tác ngoại lệ (ngắt mạng, tải lại trang, đổi thiết bị) để rà soát lỗi bảo mật và độ bền hệ thống.

### G. Người duyệt chuyên môn (Tổ trưởng / Chuyên viên khảo thí)
- **Kinh nghiệm:** Từ 7 năm công tác trở lên; từng tham gia hội đồng ra đề hoặc thẩm định đề thi học kỳ cấp trường, cấp huyện, cấp tỉnh.
- **Nhiệm vụ:** Rà soát toàn bộ ma trận đề, tính tương thích với Thông tư 22/2021 và cấu trúc định dạng khảo thí mới của Bộ Giáo dục và Đào tạo.

---

## 3. BA MẪU TIN MỜI THAM GIA THÍ ĐIỂM (DÀNH CHO CHỦ DỰ ÁN)

### Mẫu 1: Thư điện tử (Email) trang trọng gửi Giáo viên / Chuyên gia
**Tiêu đề:** Thư mời tham gia thử nghiệm và phản biện giải pháp khảo thí số ExamCraft

**Nội dung:**
Kính gửi Thầy/Cô [Họ và tên giáo viên / chuyên gia],

Nhóm nghiên cứu phát triển giải pháp khảo thí số giáo dục ExamCraft trân trọng gửi lời chào và lời chúc sức khỏe tới Thầy/Cô.

Hiện nay, chúng tôi đang hoàn thiện nền tảng ExamCraft nhằm hỗ trợ giáo viên phổ thông biên soạn đề thi chuẩn GDPT 2018, tổ chức kiểm tra trực tuyến an toàn không mất dữ liệu, và hỗ trợ chấm điểm tự động đa dạng thức (trắc nghiệm, đúng sai nhóm, điền khuyết, ghép nối, tự luận).

Nhận thấy kinh nghiệm chuyên môn dày dặn và tâm huyết của Thầy/Cô trong công tác giảng dạy môn [Tên môn học], chúng tôi trân trọng kính mời Thầy/Cô tham gia đợt Trải nghiệm thí điểm (Pilot) với thông tin như sau:
- Thời gian làm việc: Khoảng 2 buổi (tổng cộng 3 đến 4 giờ), bố trí linh hoạt theo thời gian biểu của Thầy/Cô.
- Hình thức: Trải nghiệm thực tế trên máy tính hoặc điện thoại cá nhân dưới sự đồng hành hỗ trợ kỹ thuật trực tiếp 1-1 từ nhóm nghiên cứu.
- Bảo mật và an toàn: Hệ thống chạy độc lập, tuyệt đối không thu thập dữ liệu định danh nhạy cảm của học sinh, đề thi do Thầy/Cô khởi tạo thuộc toàn quyền sở hữu của Thầy/Cô.
- Quyền lợi: Thầy/Cô được tiếp cận sớm công cụ hỗ trợ công việc và nhận thư tri ân đóng góp chuyên môn từ dự án.

Chúng tôi rất mong nhận được sự đồng ý tham gia của Thầy/Cô. Xin Thầy/Cô vui lòng phản hồi email này hoặc liên hệ qua số điện thoại cá nhân của tôi bên dưới.

Trân trọng cảm ơn,
[Chữ ký của Chủ dự án]
[Số điện thoại - Đơn vị công tác]

---

### Mẫu 2: Tin nhắn ngắn qua Zalo / Tin nhắn cá nhân gửi Thầy Cô quen biết
**Nội dung:**
Em chào Thầy/Cô [Tên Thầy/Cô] ạ!
Em là [Tên Chủ dự án]. Hiện tại nhóm em đang phát triển giải pháp ExamCraft giúp các thầy cô soạn đề và tổ chức kiểm tra chuẩn chương trình mới 2018 (hỗ trợ đủ các dạng câu hỏi mới, chống mất bài khi mất mạng và tự động phân tích điểm số rất nhanh).

Dự án đang bước vào giai đoạn thử nghiệm kín (Pilot). Biết Thầy/Cô có nhiều kinh nghiệm giảng dạy môn [Tên môn], em muốn kính mời Thầy/Cô trải nghiệm thử hệ thống và cho chúng em xin vài lời góp ý chân tình từ góc nhìn sư phạm thực tế. Thời gian thử nghiệm chỉ khoảng 1 đến 2 tiếng vào thời điểm Thầy/Cô rảnh rỗi, bên em sẽ có bạn kỹ thuật hướng dẫn chi tiết tận nơi hoặc qua Ultraviewer/Meet.

Thầy/Cô xem giúp em nếu sắp xếp được thì cho em xin phép gửi thông tin tài khoản dùng thử nhé ạ. Em cảm ơn Thầy/Cô rất nhiều!

---

### Mẫu 3: Văn bản / Bản đề xuất gửi Ban giám hiệu nhà trường
**Kính gửi:** Ban Giám hiệu Trường [Tên trường THCS / THPT]
**Đồng kính gửi:** Tổ Chuyên môn [Tên tổ bộ môn]

**Về việc:** Đề xuất phối hợp thử nghiệm giải pháp chuyển đổi số trong khảo thí học đường (Dự án ExamCraft)

Căn cứ định hướng đẩy mạnh chuyển đổi số trong giáo dục và đổi mới phương pháp kiểm tra đánh giá theo Chương trình Giáo dục phổ thông 2018;
Nhóm phát triển giải pháp giáo dục ExamCraft kính gửi tới Ban Giám hiệu nhà trường đề xuất phối hợp triển khai đợt thử nghiệm ngắn hạn (Pilot) với nội dung cụ thể:

1. **Mục đích:** Đánh giá hiệu quả thực tế của công cụ hỗ trợ giáo viên thiết kế ma trận đề thi, xuất đề in chuẩn A4, và tổ chức kiểm tra trực tuyến an toàn trên các thiết bị sẵn có của nhà trường hoặc học sinh.
2. **Quy mô phối hợp:** Đăng ký từ 1 đến 2 giáo viên thuộc các bộ môn Toán, Ngữ văn, Tiếng Anh, KHTN tham gia thử nghiệm trên 01 lớp học mẫu (thời lượng 01 tiết học kiểm tra hoặc ngoại khóa).
3. **Cam kết an toàn thông tin:**
   - Hoàn toàn miễn phí, không phát sinh bất kỳ khoản kinh phí nào từ phía nhà trường, giáo viên hay cha mẹ học sinh.
   - Không thu thập căn cước công dân, số điện thoại hay thông tin nhân thân của học sinh.
   - Không ảnh hưởng đến kế hoạch giảng dạy chính khóa của nhà trường.

Kính mong Ban Giám hiệu nhà trường xem xét tạo điều kiện để nhóm có cơ hội báo cáo chi tiết và tiếp thu ý kiến quý báu từ quý Thầy/Cô.

Đại diện dự án,
[Họ và tên Chủ dự án - Ký tên]

---

## 4. PHIẾU PHẢN HỒI SAU THÍ ĐIỂM (10 CÂU HỎI ĐÁNH GIÁ)

Sau khi hoàn thành đợt thử nghiệm, giáo viên và chuyên gia thẩm định sẽ điền vào phiếu khảo sát ngắn gọn gồm 10 câu hỏi nhằm chuẩn hóa số liệu phản hồi:

### Phần I: Đánh giá định lượng (Thang điểm 1 đến 5)
*Quy ước thang điểm: 1 = Rất không hài lòng / Rất khó; 2 = Chưa hài lòng; 3 = Bình thường / Chấp nhận được; 4 = Hài lòng / Dễ dùng; 5 = Rất hài lòng / Rất thuận tiện.*

1. **Đăng nhập và định hướng ban đầu:** Thao tác đăng nhập, tạo đề mới và bố cục màn hình làm việc có rõ ràng, dễ hiểu không? *(Điểm: 1 - 2 - 3 - 4 - 5)*
2. **Soạn thảo câu hỏi đa dạng thức:** Việc nhập các câu hỏi trắc nghiệm, đúng/sai nhóm, điền khuyết và công thức toán học có thuận tiện không? *(Điểm: 1 - 2 - 3 - 4 - 5)*
3. **Trải nghiệm in ấn và xuất tệp Word:** Bản xem trước trang in A4 và tệp Word tải về máy có chuẩn định dạng để in trực tiếp cho học sinh không? *(Điểm: 1 - 2 - 3 - 4 - 5)*
4. **Cơ chế lưu nháp và chống mất bài:** Cảm nhận của Thầy/Cô về độ an tâm khi nhập liệu (hệ thống tự lưu, không sợ mất công gõ khi mất điện hay tắt tab)? *(Điểm: 1 - 2 - 3 - 4 - 5)*
5. **Giao diện làm bài của học sinh trên điện thoại:** Mức độ thân thiện, dễ nhìn và thuận tiện của học sinh khi thao tác làm bài trên thiết bị cầm tay? *(Điểm: 1 - 2 - 3 - 4 - 5)*
6. **Tính năng sửa đáp án và chấm lại tự động:** Quy trình xem trước biến động điểm và cập nhật lại kết quả sau khi đính chính đáp án có dễ thao tác và minh bạch không? *(Điểm: 1 - 2 - 3 - 4 - 5)*
7. **Bảng thống kê và xuất bảng điểm:** Mức độ hữu ích của bảng xếp hạng, phổ điểm và danh sách điểm xuất ra định dạng bảng tính? *(Điểm: 1 - 2 - 3 - 4 - 5)*
8. **Độ ổn định và tốc độ phản hồi:** Hệ thống có gặp tình trạng đứng hình, báo lỗi khó hiểu hoặc phản hồi chậm chạp trong quá trình dùng không? *(Điểm: 1 - 2 - 3 - 4 - 5)*

### Phần II: Đánh giá định tính và đóng góp chuyên môn (Tự luận)
9. **Điều gì Thầy/Cô thích nhất hoặc cảm thấy tiện lợi nhất khi sử dụng ExamCraft so với các công cụ hiện tại đang dùng?**
   *(Ghi nhận ý kiến mở của giáo viên)*
10. **Những điểm gây lúng túng, từ ngữ chưa chuẩn sư phạm hoặc tính năng Thầy/Cô mong muốn cải tiến ngay trước khi nhân rộng?**
   *(Ghi nhận phản hồi cụ thể để đội ngũ sửa đổi)*

---

## 5. DANH MỤC KIỂM CHUYÊN MÔN THEO TỪNG BỘ MÔN (SUBJECT CHECKLIST)

Bảng hướng dẫn kiểm tra dành riêng cho Người duyệt chuyên môn để rà soát chất lượng bộ đề mẫu trước khi bàn giao cho học sinh:

### 1. Môn Toán
- [ ] Công thức toán học (phân số, căn bậc hai, lũy thừa, ký hiệu hình học) hiển thị sắc nét, không bị nhảy dòng trên cả màn hình máy tính và điện thoại.
- [ ] Đáp án câu trả lời ngắn đã bao quát các dạng biểu diễn tương đương (ví dụ số thập phân dùng dấu chấm hoặc dấu phẩy, phân số tối giản).
- [ ] Các phương án nhiễu trong câu hỏi trắc nghiệm phản ánh đúng những sai lầm điển hình của học sinh.

### 2. Môn Ngữ văn
- [ ] Đoạn ngữ liệu trích dẫn nêu rõ nguồn xuất bản, tác giả, tên tác phẩm và nằm trong danh mục định hướng của chương trình.
- [ ] Câu hỏi đọc hiểu phân hóa rõ ràng theo các mức độ nhận thức: nhận biết chi tiết, thông hiểu ý nghĩa, vận dụng liên hệ bản thân.
- [ ] Barem chấm điểm câu tự luận có tiêu chí rõ ràng cho từng mức điểm (sáng tạo, lập luận, chính tả ngữ pháp).

### 3. Môn Tiếng Anh
- [ ] Ngữ liệu bài đọc và câu hỏi chuẩn ngữ pháp, tự nhiên về ngữ dụng, không có lỗi chính tả.
- [ ] Câu hỏi trắc nghiệm ngữ âm phân biệt rõ ràng giữa nguyên âm ngắn/dài, phụ âm hoặc vị trí trọng âm chính.
- [ ] Câu hỏi điền khuyết có hướng dẫn rõ ràng về số lượng từ được phép điền (ví dụ không quá 2 từ).

### 4. Môn Khoa học tự nhiên
- [ ] Các đơn vị đo lường tuân thủ quy chuẩn đo lường quốc tế và sách giáo khoa hiện hành.
- [ ] Hình vẽ thí nghiệm, sơ đồ giải phẫu hoặc cấu trúc hóa học có chú thích rõ ràng, tỷ lệ hợp lý.
- [ ] Tính liên môn giữa Vật lý - Hóa học - Sinh học được thể hiện mạch lạc trong các câu hỏi tình huống thực tiễn.

### 5. Môn Lịch sử và Địa lí
- [ ] Địa danh, niên đại lịch sử và số liệu địa lý chính xác tuyệt đối theo tài liệu chuẩn của Bộ Giáo dục và Đào tạo.
- [ ] Văn bản sử dụng bộ mã tiếng Việt Unicode chuẩn dựng sẵn, không bị lỗi phông chữ khi xem trên các hệ điều hành khác nhau.
- [ ] Kênh hình (bản đồ, biểu đồ) có chú giải, tỷ lệ thước đo và nguồn gốc tin cậy.

### 6. Môn Tin học
- [ ] Thuật toán và các bước mô tả không bị mập mờ, cấu trúc dữ liệu và cú pháp logic chuẩn xác.
- [ ] Các câu hỏi chùm Đúng/Sai bao quát các khía cạnh nhận định lý thuyết và thực hành.
- [ ] Tình huống đạo đức và văn hóa số phù hợp với lứa tuổi học sinh trung học cơ sở.

---

## 6. NGUYÊN TẮC BẢO MẬT VÀ QUYỀN RIÊNG TƯ DỮ LIỆU

1. **Không lưu trữ thông tin nhận dạng cá nhân:** Không yêu cầu học sinh cung cấp số căn cước, ngày sinh hay tài khoản cá nhân.
2. **Quyền tác giả:** Toàn bộ đề thi do thầy cô đưa vào hệ thống thử nghiệm thuộc quyền sở hữu riêng của thầy cô; hệ thống không sử dụng dữ liệu này để huấn luyện mô hình trí tuệ nhân tạo khi chưa có thỏa thuận riêng.
3. **Môi trường độc lập:** Toàn bộ dữ liệu bài làm trong giai đoạn thử nghiệm được lưu trữ trên môi trường độc lập, có thể xóa sạch hoàn toàn sau khi kết thúc đợt đánh giá nếu thầy cô yêu cầu.

---
*Tài liệu hướng dẫn điều phối tuyển giáo viên và chuyên gia thẩm định thí điểm ExamCraft 2026.*
