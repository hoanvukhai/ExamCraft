# ExamCraft — Trợ Lý Soạn Đề AI Chuẩn GDPT 2018

> **ExamCraft** là nền tảng trợ lý AI chuyên sâu hỗ trợ giáo viên Việt Nam biên tập, trộn đề, tổ chức thi trực tuyến và xuất bản đề kiểm tra chuẩn chương trình GDPT 2018 (cập nhật mới nhất theo **Thông tư 17/2025/TT-BGDĐT**).

---

## 🌟 Tính Năng Nổi Bật

### 1. 🤖 Trợ Lý Biên Tập AI Copilot 2.0
- **Ra lệnh bằng tiếng Việt tự nhiên**: Yêu cầu AI đổi số liệu, tăng/giảm độ khó, chuyển sang bài toán ứng dụng thực tế, tạo câu tương tự...
- **Hộp thoại tương tác thông minh**: AI tự động hỏi lại để làm rõ ý giáo viên kèm các tùy chọn nhanh hoặc **ô tự gõ phương án riêng**.
- **Bảo toàn 100% hình vẽ & bảng biểu**: Tự động đồng bộ và không bao giờ làm mất đồ thị hàm số, bảng biến thiên hay hình ảnh minh họa khi AI sửa đề.

### 2. 📈 Đồ Thị Hàm Số & Bảng Biến Thiên Động
- **Đồ thị HTML5 Canvas sắc nét**: Tự động tính toán và vẽ lại đường cong khi thay đổi công thức toán học ($y = ax+b$, bậc 2, bậc 3, phân thức hữu tỉ...).
- **Đầy đủ vạch chia tọa độ**: Tự động đánh dấu vạch chia số trên trục Ox, Oy và **tự động vẽ đường tiệm cận đứng, tiệm cận ngang nét đứt** ($x = x_0, y = y_0$).
- **Bảng biến thiên chuẩn mực**: Định dạng bảng biến thiên 3 dòng ($x, y', y$) theo đúng quy chuẩn sách giáo khoa Việt Nam.

### 3. 🔀 Trộn Đề & Hoán Vị Mã Đề
- Trộn đề gốc thành **4 mã đề** (101, 102, 103, 104) với thuật toán hoán vị công bằng.
- Tự động xuất **Ma trận đáp án đối soát** dạng bảng giúp giáo viên chấm bài nhanh chóng.

### 4. 📝 Phòng Thi Trực Tuyến Học Sinh (`/test/[id]`)
- Giáo viên tạo link gửi học sinh vào làm bài thi trực tiếp trên web hoặc điện thoại (như Google Forms / Azota).
- Học sinh nhập Họ tên, Lớp -> Làm bài với **đồng hồ đếm ngược** và giao diện chuẩn 3 phần của Bộ GD&ĐT:
  - **Phần I**: Trắc nghiệm 4 lựa chọn (0,25đ / câu).
  - **Phần II**: Trắc nghiệm Đúng / Sai 4 ý ($a, b, c, d$) chấm theo barem lũy tiến (1 ý: 0,1đ; 2 ý: 0,25đ; 3 ý: 0,5đ; 4 ý: 1,0đ).
  - **Phần III**: Câu trắc nghiệm trả lời ngắn / điền số (0,5đ / câu).
- **Chấm điểm tự động tức thì**: Thông báo kết quả ngay khi nộp bài kèm lời giải chi tiết từng bước.

### 5. 📊 Bảng Điểm Lớp Học & Xuất File Excel
- Giáo viên theo dõi danh sách học sinh đã nộp bài trong thời gian thực.
- Thống kê điểm trung bình, phổ điểm, điểm cao nhất.
- Hỗ trợ **xuất file Excel (.csv)** tiếng Việt chuẩn UTF-8 BOM mở trực tiếp trên Excel không bị lỗi font.

### 6. 🔗 Chia Sẻ Đề Thi "Chỉ Xem & Tải Về" (`/share/[id]`)
- Chia sẻ link cho đồng nghiệp hoặc học sinh chỉ để xem định dạng A4, in ấn hoặc tải file Word `.docx`.
- Hỗ trợ nút **"Tạo bản sao để sửa"** cho phép giáo viên khác nhân bản về kho đề của họ mà không làm thay đổi đề gốc của tác giả.

### 7. 📥 Import Thông Minh Đa Nguồn
- Nhập đề từ file Word (`.docx`), hình ảnh chụp đề thi (OCR AI), hoặc dán văn bản thô / mã LaTeX.

### 8. 🛡️ Cơ Chế Xoay Tua 7 Google Gemini API Keys
- Hệ thống tự động xoay tua qua tối đa 7 API Keys kèm thuật toán Exponential Backoff và bắt lỗi Spike in demand (503) / Rate limit (429), đảm bảo quá trình soạn đề không bị gián đoạn.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Trí tuệ nhân tạo**: Google Gemini AI (`@google/genai`)
- **Công thức Toán**: KaTeX / MathJax ([rehype-katex](https://github.com/remarkjs/remark-math), [remark-math](https://github.com/remarkjs/remark-math))
- **Đồ thị Canvas**: HTML5 Canvas 2D Engine
- **Lưu trữ dữ liệu**: IndexedDB ([Dexie.js](https://dexie.org/)) & Cloud File Storage
- **Xuất bản**: [docx](https://github.com/dolanmiu/docx) (Tạo file Word .docx tiêu chuẩn)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

### 1. Clone dự án về máy
```bash
git clone https://github.com/hoanvukhai/ExamCraft.git
cd ExamCraft
```

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env.local` từ file mẫu:
```bash
cp .env.example .env.local
```
Mở file `.env.local` và điền Google Gemini API Key của bạn:
```env
GEMINI_API_KEY_1=AIzaSy...
# Có thể thêm các key dự phòng từ key 2 đến key 7
```

### 4. Khởi động môi trường phát triển
```bash
npm run dev
```
Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

---

## 📄 Bản Quyền & Giấy Phép

Phát triển với mục đích phục vụ cộng đồng giáo viên và nền giáo dục Việt Nam.
Giấy phép: MIT License.
