# HƯỚNG DẪN VÀ THẺ KIỂM TRA BẢN IN ĐỀ THI (A4 / PDF)
*Dành cho Chủ dự án tự in thử nghiệm đề thi dài — Hệ thống ExamCraft*
*Căn cứ mã nguồn: `src/components/Header.tsx`, `src/components/A4Preview.tsx` và bài kiểm tra `tests_pilot/pilot.test.ts` (F15)*

- **Người thực hiện:** Gemini (QA & Thẩm định in ấn)
- **Nhiệm vụ:** GEM-T3 (P1, Generation 12)
- **Thời điểm lập (UTC):** 2026-10-25T12:15:00Z
- **Phạm vi kiểm tra:** Thực hiện in ấn trực tiếp đề thi 60 câu trên giấy khổ A4 hoặc xuất tệp PDF qua trình điều khiển in của trình duyệt để đánh giá bố cục trang in thực tế.

---

## 1. QUY TRÌNH THỰC HIỆN CÁC BƯỚC IN ẤN

1. **Chuẩn bị đề thi:**
   - Mở một đề thi có dung lượng lớn (khoảng 50 đến 60 câu hỏi), có chứa hình ảnh, công thức toán và ngữ liệu đọc hiểu dùng chung.
2. **Kích hoạt lệnh in:**
   - Trên thanh tiêu đề chính, rê chuột vào biểu tượng máy in (tooltip hiển thị: **In đề thi hoặc xuất ra PDF**) và bấm nút **In A4**.
   - Hoặc tại khung xem trước A4, bấm nút **In / PDF** ở góc trên bên phải.
3. **Cấu hình hộp thoại in của trình duyệt:**
   - **Máy in đích (Destination):** Chọn máy in văn phòng thực tế hoặc chọn **Lưu dưới dạng PDF** (Save as PDF).
   - **Khổ giấy (Paper size):** Chọn khổ **A4**.
   - **Bố cục (Layout):** Chọn **Dọc** (Portrait).
   - **Tùy chọn khác (More settings):**
     + Tỷ lệ (Scale): Chọn **100%** (Mặc định).
     + Bỏ tích ô **Đầu trang và chân trang** (Headers and footers) để tránh trình duyệt in ngày giờ và đường dẫn URL lên mép giấy.
     + Tích chọn **Đồ họa nền** (Background graphics) nếu muốn in màu khung viền.
4. **Kiểm tra trực quan và bấm in:**
   - Cuộn xem bản xem trước từng trang trên màn hình in trước khi nhấn nút **Lưu** hoặc **In**.

---

## 2. BẢNG TIÊU CHÍ KIỂM TRA TRỰC QUAN BẢN IN

| STT | Hạng mục kiểm tra | Tiêu chuẩn chất lượng mong đợi | Kết quả kiểm tra | Ghi chú thực tế |
|:---:|---|---|:---:|---|
| 1 | **Số lượng trang hợp lý** | Đề thi 60 câu dàn trang gọn gàng, mật độ chữ vừa phải, dễ đọc, không có trang trắng rỗng ở cuối. | [ ] Đạt<br>[ ] Chưa | ................................... |
| 2 | **Không xé đôi câu hỏi** | Toàn bộ nội dung một câu hỏi và các phương án A, B, C, D nằm trọn vẹn trong một trang giấy; không bị ngắt đôi qua trang tiếp theo. | [ ] Đạt<br>[ ] Chưa | ................................... |
| 3 | **Vị trí ngữ liệu dùng chung** | Đoạn văn bản ngữ liệu dùng chung chỉ in một lần duy nhất, nằm ngay phía trên câu hỏi đầu tiên của nhóm câu liên quan. | [ ] Đạt<br>[ ] Chưa | ................................... |
| 4 | **Độ sắc nét công thức toán** | Các công thức phân số, căn bậc hai, số mũ, tích phân hiển thị sắc nét, không bị vỡ hạt, không bị biến thành ký tự lạ hay chuỗi thô. | [ ] Đạt<br>[ ] Chưa | ................................... |
| 5 | **Căn chỉnh hình ảnh** | Hình vẽ và sơ đồ minh họa căn giữa cân đối, giữ đúng tỷ lệ khung hình, không bị tràn ra ngoài lề phải của khổ giấy A4. | [ ] Đạt<br>[ ] Chưa | ................................... |
| 6 | **Bảo mật đáp án & lời giải** | Ở chế độ xem **Đề thi in ấn**, tuyệt đối không lộ dấu vết đáp án đúng, không in kèm lời giải hay barem điểm cho học sinh. | [ ] Đạt<br>[ ] Chưa | ................................... |
| 7 | **Khung tiêu đề trang đầu** | Tiêu đề tên trường, tên kỳ thi, năm học, môn học và khung ghi họ tên học sinh hiển thị trang trọng ở đầu trang 1. | [ ] Đạt<br>[ ] Chưa | ................................... |
| 8 | **Ẩn thanh công cụ web** | Toàn bộ thanh điều hướng, nút bấm zoom, nút chỉnh sửa câu hỏi và chân trang web được ẩn hoàn toàn (lớp no-print). | [ ] Đạt<br>[ ] Chưa | ................................... |

---

## 3. ĐÁNH GIÁ NẰNG LỰC IN Ở CÁC CHẾ ĐỘ XEM KHÁC

Ngoài chế độ in đề thông thường, Thầy/Cô có thể chuyển chế độ xem tại thanh chọn để in các bản phục vụ chấm thi:

1. **Chế độ Song song:**
   - Chọn thẻ **Song song** rồi bấm **In / PDF**.
   - Kiểm tra: Cột câu hỏi bên trái và cột hướng dẫn giải bên phải thẳng hàng tương ứng trên từng trang giấy.
   - Đánh giá: [ ] ĐẠT   [ ] CHƯA ĐẠT

2. **Chế độ Bảng đáp án & Barem:**
   - Chọn thẻ **Bảng đáp án & Barem** rồi bấm **In / PDF**.
   - Kiểm tra: Bảng đáp án trắc nghiệm dạng lưới gọn gàng và thang điểm chi tiết cho các câu tự luận.
   - Đánh giá: [ ] ĐẠT   [ ] CHƯA ĐẠT

---

## 4. KẾT LUẬN NGHIỆM THU BẢN IN

- [ ] **ĐẠT YÊU CẦU:** Đề thi in ấn sẵn sàng phát hành cho học sinh làm bài trên giấy, đạt chuẩn thẩm mỹ sư phạm trường học.
- [ ] **CẦN ĐIỀU CHỈNH:** (Ghi rõ số thứ tự câu hoặc trang bị lỗi cần lập trình viên căn chỉnh lại CSS):
  ..........................................................................................................................................
  ..........................................................................................................................................

---
*Thẻ kiểm tra bản in A4 và PDF phục vụ nghiệm thu nội bộ dự án ExamCraft 2026.*
