# TÀI LIỆU THIẾT KẾ SƠ BỘ: TÍNH NĂNG SAO LƯU GOOGLE DRIVE
*Tài liệu kiến trúc kỹ thuật sơ bộ (Design Draft) — Dự án ExamCraft*
*Căn cứ phân công điều phối: Nhiệm vụ GEM-R7 (P2, Generation 10)*

- **Người thực hiện:** Gemini (Kiến trúc & Phân tích an toàn dữ liệu)
- **Thời điểm lập (UTC):** 2026-10-25T10:45:00Z
- **Trạng thái:** BẢN THẢO THIẾT KẾ (CHƯA TRIỂN KHAI MÃ NGUỒN)
- **Mục tiêu:** Định hình kiến trúc, cấu trúc gói dữ liệu, phân quyền bảo mật tối thiểu và luồng dữ liệu dự phòng cục bộ trước khi quyết định đưa vào lộ trình phát triển.

---

## 1. BỐI CẢNH VÀ MỤC TIÊU THIẾT KẾ

Trong mô hình triển khai của ExamCraft, hệ thống có thể chạy dưới dạng máy chủ cục bộ tại trường học hoặc máy tính cá nhân của giáo viên:
- **Nhu cầu thực tế:** Giáo viên đầu tư nhiều thời gian biên soạn ngân hàng câu hỏi và ma trận đề thi. Khi chuyển đổi máy tính giảng dạy hoặc khi máy chủ trường học được cài đặt lại, nguy cơ thất thoát dữ liệu đề thi là rất lớn.
- **Mục tiêu cốt lõi:**
  1. Cho phép giáo viên chủ động đồng bộ kho đề thi cá nhân lên tài khoản Google Drive của chính mình để lưu trữ an toàn lâu dài.
  2. Trao toàn quyền sở hữu dữ liệu cho người dùng (Self-Sovereign Data), không phụ thuộc vào hạ tầng đám mây tập trung của dự án.
  3. Đảm bảo tính riêng tư tuyệt đối: Chỉ giáo viên mới có thể mở và khôi phục lại kho đề của mình.

---

## 2. CẤU TRÚC DỮ LIỆU GÓI SAO LƯU (EXAM BUNDLE FORMAT)

Dữ liệu sao lưu được đóng gói thành một tệp JSON tiêu chuẩn (hoặc tệp lưu trữ nén chứa tệp JSON cùng thư mục hình ảnh minh họa).

### Sơ đồ cấu trúc tệp sao lưu:
```json
{
  "format": "EXAMCRAFT_BUNDLE",
  "version": "1.0.0",
  "exportedAt": "2026-10-25T10:00Z",
  "generator": "ExamCraft",
  "checksum": "sha256_hash",
  "teacher": {
    "displayName": "Giao vien",
    "subject": "TOAN_6"
  },
  "exams": [
    {
      "id": "exam_id",
      "title": "Toan 6 Giua ky 1",
      "subject": "TOAN",
      "grade": 6,
      "duration": 45,
      "matrix": {
        "know": 40,
        "understand": 30,
        "apply": 20,
        "highApply": 10
      },
      "passages": [],
      "questions": [
        {
          "key": "q1",
          "type": "multiple_choice",
          "content": "Noi dung cau hoi",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "points": 2.0,
          "solution": "Huong dan giai"
        }
      ]
    }
  ]
}
```

### Các nguyên tắc đóng gói dữ liệu:
1. **Chỉ sao lưu tài sản sư phạm:** Gói sao lưu bao gồm ngân hàng câu hỏi, các đề thi đã biên soạn, ma trận đặc tả và đoạn ngữ liệu dùng chung.
2. **Không sao lưu dữ liệu nhạy cảm của học sinh:** Tuyệt đối không đưa họ tên, bảng điểm hay bài làm của học sinh vào gói sao lưu Google Drive cá nhân nhằm tuân thủ quy định bảo vệ dữ liệu giáo dục.
3. **Mã băm toàn vẹn:** Trường checksum được tạo bằng thuật toán SHA-256 từ chuỗi JSON chuẩn hóa để đảm bảo gói tin không bị thay đổi hoặc hư hỏng trong quá trình truyền tải.

---

## 3. PHÂN QUYỀN OAUTH 2.0 TỐI THIỂU (LEAST PRIVILEGE)

Để bảo đảm an toàn thông tin và tạo sự tin tưởng tuyệt đối cho giáo viên, hệ thống áp dụng nguyên tắc đặc quyền tối thiểu khi kết nối Google API:

### A. Phạm vi quyền (OAuth Scope) bắt buộc
- **Scope duy nhất được sử dụng:**
  `https://www.googleapis.com/auth/drive.file`
- **Ý nghĩa kỹ thuật của scope:**
  + Ứng dụng ExamCraft **chỉ có quyền** tạo mới tệp, đọc, cập nhật và xóa các tệp do chính ExamCraft tạo ra trên Google Drive của giáo viên.
  + Ứng dụng **hoàn toàn không có quyền** đọc, xem danh sách, tải về hay chỉnh sửa bất kỳ tài liệu, hình ảnh, bảng tính hay tệp cá nhân nào khác có sẵn trong Google Drive của người dùng.

### B. Phạm vi quyền tuyệt đối bị cấm (Banned Scopes)
- Tuyệt đối cấm sử dụng scope toàn quyền `https://www.googleapis.com/auth/drive`.
- Tuyệt đối cấm sử dụng scope đọc toàn bộ `https://www.googleapis.com/auth/drive.readonly`.

### C. Cơ chế tạo thư mục riêng biệt
Khi giáo viên kết nối lần đầu, ứng dụng tạo một thư mục chuyên dụng mang tên Thư mục sao lưu ExamCraft trên Google Drive. Toàn bộ các bản sao lưu định kỳ sẽ được ghi vào thư mục này để giáo viên dễ dàng quản lý.

---

## 4. PHÂN TÍCH RỦI RO BẢO MẬT VÀ GIẢI PHÁP PHÒNG NGỪA

### Rủi ro 1: Nguy cơ rò rỉ Refresh Token tại máy trạm
- **Mối đe dọa:** Khi kết nối Google Drive qua giao thức Offline Access, hệ thống nhận được Refresh Token có giá trị vô thời hạn. Nếu lưu trữ Refresh Token không an toàn trên máy chủ cục bộ hoặc máy dùng chung ở trường học, kẻ xấu có thể trích xuất token.
- **Biện pháp kỹ thuật:**
  1. Mã hóa Refresh Token bằng thuật toán AES-256-GCM với khóa mã hóa xuất phát từ biến môi trường máy chủ hoặc TPM của máy trạm.
  2. Bố trí nút Hủy liên kết Google Drive trong màn hình cài đặt. Khi giáo viên nhấn hủy, hệ thống gửi yêu cầu thu hồi token tới máy chủ Google và xóa sạch dữ liệu xác thực tại máy cục bộ.

### Rủi ro 2: Nguy cơ lộ đề thi chưa phát hành
- **Mối đe dọa:** Đề thi kiểm tra định kỳ được sao lưu lên Google Drive có thể bị chia sẻ ngoài ý muốn nếu giáo viên vô tình đặt chế độ chia sẻ công khai cho thư mục Drive cá nhân.
- **Biện pháp kỹ thuật:**
  1. Cung cấp tùy chọn Mã hóa gói đề thi bằng mật khẩu do giáo viên tự đặt.
  2. Khi bật tùy chọn này, gói JSON sẽ được mã hóa bằng thuật toán AES-GCM với khóa sinh từ mật khẩu (PBKDF2) trước khi tải lên Drive. Người có tệp sao lưu nhưng không có mật khẩu sẽ không thể đọc được nội dung đề thi.

---

## 5. LUỒNG XUẤT DỮ LIỆU CỤC BỘ DỰ PHÒNG (OFFLINE FALLBACK)

Tính năng sao lưu không được phụ thuộc độc quyền vào Google Drive. Hệ thống bắt buộc phải có luồng làm việc độc lập hoàn toàn không qua Internet:

```text
[Màn hình Quản lý Kho đề]
        |
        +---> Nút [Xuất tệp sao lưu .json] ---> Tải ngay tệp về máy tính cá nhân
        |
        +---> Nút [Khôi phục từ tệp] ---> Chọn tệp từ ổ đĩa ---> Kiểm tra toàn vẹn ---> Nạp vào CSDL
```

### Ưu điểm của luồng dữ liệu cục bộ:
- Hoạt động ngay cả khi phòng máy trường học mất kết nối mạng Internet.
- Phù hợp với các giáo viên hoặc đơn vị giáo dục có chính sách bảo mật nội bộ nghiêm ngặt, không cho phép kết nối tài khoản đám mây bên thứ ba.
- Đơn giản, trực quan, không phát sinh chi phí hạ tầng hay thủ tục xin phê duyệt ứng dụng OAuth từ Google.

---

## 6. KHUYẾN NGHỊ VÀ KẾ HOẠCH HÀNH ĐỘNG

1. **Giai đoạn Pilot hiện tại:**
   - Ưu tiên duy trì và hoàn thiện tính năng Xuất tệp sao lưu cục bộ (Local JSON/ZIP Export/Import).
   - Tạm hoãn việc tích hợp trực tiếp Google Drive SDK cho đến khi quy trình đăng ký ứng dụng Google Cloud và quy trình duyệt ứng dụng (OAuth App Verification) của Google được thông qua.
2. **Giai đoạn phát triển tiếp theo:**
   - Khi có quyết định chính thức từ Chủ dự án, kỹ sư phần mềm sẽ thiết lập mô-đun Drive Sync dựa trên bản thiết kế này, đảm bảo tuân thủ nghiêm ngặt scope tối thiểu và cơ chế mã hóa mật khẩu.

---
*Tài liệu thiết kế sơ bộ sao lưu Google Drive ExamCraft 2026.*
