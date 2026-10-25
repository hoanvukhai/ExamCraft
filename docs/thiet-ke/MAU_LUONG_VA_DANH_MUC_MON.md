# MẪU LUỒNG GIAO DIỆN VÀ DANH MỤC MÔN HỌC
*Tài liệu thiết kế kiến trúc luồng người dùng và chuẩn hóa danh mục môn - lớp GDPT 2018 (CV-004)*

- *Người thực hiện:* Gemini (QA & Phân tích hệ thống)
- *Nhiệm vụ:* GEM-W2 (P0, Generation 15)
- *Thời điểm lập (UTC):* 2026-10-25T13:45:00Z
- *Căn cứ mã nguồn:* `src/lib/education-catalog.ts`, `src/types/exam.ts`, `qa/ai-review/fixtures/da-mon/`

---

## 1. SƠ ĐỒ CÁC MÀN HÌNH THEO GIAO DIỆN THẬT HIỆN TẠI

Hệ thống ExamCraft tổ chức luồng thao tác của giáo viên qua 4 không gian làm việc chính với nhãn nút bấm chuẩn hóa từ mã nguồn:

```
[Kho Đề Cá Nhân] (/dashboard)
       │
       ├──► [Soạn Đề Mới] ──► [Không Gian Soạn Thảo Đề Thi] (/editor/[id])
       │                            │
       │                            ├──► [Thêm câu hỏi / Nhập liệu]
       │                            ├──► [Chế độ Xem trước & In ấn]
       │                            ├──► [Trộn đề & Tạo Ma trận]
       │                            └──► [Trợ lý AI Gemini]
       │
       ├──► [Chia sẻ Chuyên môn] ──► Link xem đề (Khóa phiên bản)
       │
       └──► [Giao Bài Trực Tuyến] ──► Phòng thi học sinh (/a/[publicId])
                                           │
                                           └──► [Chấm điểm & Phân tích] (/teacher/assignments/[id])
```

### 1.1 Luồng Tạo bài và Soạn thảo đề thi
- Từ Kho đề, giáo viên bấm nút **Soạn Đề Thi Mới** (hoặc bấm **Soạn đề trống mới**).
- Không gian biên tập mở ra, giáo viên có thể:
  + Thêm từng câu thủ công: Bấm nút **Thêm câu hỏi**, chọn dạng thức phù hợp trong danh mục: Nhiều lựa chọn, Đúng/Sai, Trả lời ngắn, Tự luận, Điền khuyết, Ghép nối, Sắp xếp.
  + Nhập liệu đề có sẵn: Bấm nút **Nhập đề (Word/Ảnh)** trên thanh công cụ bên trái. Hộp thoại mở ra cho phép chọn:
    * Thẻ **Dán văn bản thô (AI Parser)**: Dán văn bản từ Word/Web rồi bấm **Bắt đầu phân rã thành câu hỏi**.
    * Thẻ **Mã LaTeX / EX_Test (VTeX)**: Dán mã LaTeX gói ex_test rồi bấm **Bắt đầu phân rã thành câu hỏi**.
  + Lưu trữ: Bấm nút **Lưu đề** trên thanh công cụ để lưu tức thì lên máy chủ.

### 1.2 Luồng Đáp án, Lời giải và Chế độ xem trước
- Giáo viên chuyển đổi linh hoạt giữa 4 chế độ xem:
  + Thẻ **Đề thi in ấn**: Ẩn toàn bộ đáp án, sẵn sàng phát cho học sinh.
  + Thẻ **Bảng đáp án & Barem**: Bảng tổng hợp đáp án trắc nghiệm và thang điểm chi tiết.
  + Thẻ **Hướng dẫn giải**: Lời giải chi tiết từng bước.
  + Thẻ **Song song**: Bố trí hai cột (câu hỏi và đáp án/lời giải song song kèm ngữ liệu dùng chung).
- Hoán vị mã đề: Bấm nút **Trộn 4 mã đề** trên thanh công cụ bên trái để mở hộp thoại **Trộn Đề Thi & Tạo Ma Trận Đáp Án**, bấm **Trộn ngẫu nhiên lại** để đổi tổ hợp hoán vị.
- Xuất bản:
  + Tải file Word: Bấm nút **Tải Word (.docx)**.
  + In ấn và PDF: Bấm nút có tiêu đề **In đề thi hoặc xuất ra PDF** (nút **In / PDF** trên thanh tiêu đề).

### 1.3 Luồng Cấu hình Khóa AI cá nhân
- Giáo viên bấm biểu tượng Trợ lý AI ở góc phải thanh tiêu đề để mở bảng điều khiển.
- Nhập khóa Google Gemini API cá nhân: Khóa được mã hóa bằng thuật toán an toàn trước khi lưu trữ trong cơ sở dữ liệu.
- Khi không có khóa AI, hệ thống tự động sử dụng bộ phân tích văn bản nội bộ (Regex Parser) mà không làm gián đoạn trải nghiệm của giáo viên.

### 1.4 Luồng Chia sẻ đề thi và Giao bài kiểm tra
- Bấm nút **Chia sẻ** trên thanh công cụ bên trái:
  + Thẻ **Link Xem / Tải Word (.docx)**: Tạo liên kết công khai khóa cứng phiên bản tại thời điểm tạo, cho phép đồng nghiệp xem, tải Word hoặc tạo bản sao. Có thể bấm **Thu hồi link này** bất kỳ lúc nào.
  + Thẻ **Giao Bài Thi Online (Chấm Tự Động)**: Thiết lập thời lượng, số lượt làm, mã vào bài, mã PIN, trộn đề cho học sinh và bấm **Giao Bài & Tạo Phòng Thi Ngay**.

---

## 2. BẢNG DANH MỤC MÔN - LỚP THEO CHƯƠNG TRÌNH GDPT 2018

Căn cứ mã nguồn chuẩn hóa tại `src/lib/education-catalog.ts`, hệ thống hỗ trợ danh mục môn học toàn diện qua 3 cấp học:

| Cấp học | Khối lớp | Môn học bắt buộc | Môn học lựa chọn / Tự chọn | Trạng thái gói dữ liệu |
|---|---|---|---|---|
| **Tiểu học** | Lớp 1, 2 | Tiếng Việt, Toán | Tiếng Anh (Tự chọn), Tự nhiên và Xã hội | Khung chờ duyệt |
| | Lớp 3 | Tiếng Việt, Toán, Tiếng Anh, Tin học và Công nghệ | Đạo đức, Tự nhiên và Xã hội | Đã có fixture mẫu (`tieu-hoc-3.json`), khung chờ duyệt |
| | Lớp 4, 5 | Tiếng Việt, Toán, Tiếng Anh, Lịch sử và Địa lí, Khoa học, Tin học và Công nghệ | Đạo đức | Khung chờ duyệt |
| **THCS** | Lớp 6 | Ngữ văn, Toán, Tiếng Anh, Khoa học tự nhiên, Lịch sử và Địa lí, Giáo dục công dân, Tin học, Công nghệ | Ngoại ngữ 2, Tiếng dân tộc | Đã có gói nạp Toán 6 (gói PILOT-TOAN-6); KHTN 6 có fixture mẫu |
| | Lớp 7 | Ngữ văn, Toán, Tiếng Anh, Khoa học tự nhiên, Lịch sử và Địa lí, Giáo dục công dân, Tin học, Công nghệ | Ngoại ngữ 2, Tiếng dân tộc | Ngữ văn 7, Lịch sử và Địa lí 7 có fixture mẫu (thư mục da-mon) |
| | Lớp 8 | Ngữ văn, Toán, Tiếng Anh, Khoa học tự nhiên, Lịch sử và Địa lí, Giáo dục công dân, Tin học, Công nghệ | Ngoại ngữ 2, Tiếng dân tộc | Tiếng Anh 8, Tin học 8 có fixture mẫu (thư mục da-mon) |
| | Lớp 9 | Ngữ văn, Toán, Tiếng Anh, Khoa học tự nhiên, Lịch sử và Địa lí, Giáo dục công dân, Tin học, Công nghệ | Ngoại ngữ 2, Tiếng dân tộc | Toán 9 có fixture mẫu (toan-9.json) |
| **THPT** | Lớp 10, 11, 12 | Ngữ văn, Toán, Ngoại ngữ 1, Lịch sử, Giáo dục quốc phòng | Vật lí, Hóa học, Sinh học, Địa lí, Giáo dục kinh tế và pháp luật, Tin học, Công nghệ, Âm nhạc, Mĩ thuật | Khung tham khảo 3 mức (CV7991), khung chờ duyệt |

---

## 3. BA BỘ ĐỀ MẪU ĐẠI DIỆN BA CẤP HỌC (TOÁN KHÔNG PHẢI LÀ GIỚI HẠN DUY NHẤT)

Hệ thống đã triển khai sẵn sàng các bộ đề mẫu fixture đa môn đại diện cho cả 3 cấp học tại thư mục qa/ai-review/fixtures/da-mon/:

### 3.1 Cấp Tiểu học (Đại diện: Tiểu học lớp 3)
- Tệp mẫu: qa/ai-review/fixtures/da-mon/tieu-hoc-3.json
- Môn học: Tích hợp Toán học 3 và Tiếng Việt 3.
- Quy mô & Cấu trúc: 10 câu hỏi, số nhỏ trong phạm vi 1000, câu hỏi ngắn gọn, có hình vẽ mô tả đồng hồ bằng văn bản và ngữ liệu bài thơ Mùa thu của em. Tự chấm điểm 100% qua bộ kiểm tra tự động.

### 3.2 Cấp Trung học cơ sở (Đại diện: Ngữ văn 7, Tiếng Anh 8, KHTN 6)
- Tệp mẫu 1: qa/ai-review/fixtures/da-mon/ngu-van-7.json (Ngữ văn 7 có 2 ngữ liệu dài trên 500 từ và câu tự luận có rubric chấm điểm 4 tiêu chí).
- Tệp mẫu 2: qa/ai-review/fixtures/da-mon/tieng-anh-8.json (Tiếng Anh 8 có bài đọc hiểu, trắc nghiệm đọc, câu hỏi Đúng/Sai nhóm và ghép nối mệnh đề).
- Tệp mẫu 3: qa/ai-review/fixtures/da-mon/khtn-6.json (Khoa học tự nhiên 6 tích hợp Vật lý, Hóa học và Sinh học).

### 3.3 Cấp Trung học phổ thông (Đại diện: Toán 9 & VTeX EX_Test THPT)
- Tệp mẫu: qa/ai-review/fixtures/da-mon/toan-9.json và bộ 22 ca qa/ai-review/GEMINI_EXTEST_CASES.md.
- Đặc trưng: Công thức toán học phức tạp, phân số nhiều tầng, tích phân, căn thức lồng nhau, hệ phương trình macro heva và câu hỏi Đúng/Sai nhóm 4 ý theo định dạng thi tốt nghiệp THPT 2025.

---
*Tài liệu thiết kế luồng giao diện và danh mục môn học — ExamCraft 2026.*
