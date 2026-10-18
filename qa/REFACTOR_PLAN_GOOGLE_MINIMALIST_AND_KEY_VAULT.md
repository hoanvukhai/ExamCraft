# KẾ HOẠCH TÁI CẤU TRÚC & NÂNG CẤP GIAO DIỆN EXAMCRAFT
*(Google Workspace Minimalist • User API Key Vault AES-256-GCM • Authentication Gate)*

---

## 1. PHÂN TÍCH & GIẢI ĐÁP CÁC VẤN ĐỀ BẠN NÊU

### 1.1. Tại sao chưa đăng nhập mà vẫn dùng được?
- **Thực trạng**: Hiện tại `src/app/page.tsx` là một Client Component tải trực tiếp bộ đề mẫu mà chưa kiểm tra phiên (`sessionToken`). Bất kỳ ai mở URL `http://localhost:3000/` đều vào thẳng không gian soạn thảo.
- **Giải pháp**:
  - **Bảo vệ bằng Authentication Gate**: Bắt buộc người dùng phải đăng nhập tài khoản (Giáo viên / Admin) trước khi được vào Workspace.
  - Nếu chưa đăng nhập: Tự động chuyển hướng ngay về `/login?redirect=/`.
  - Toàn bộ dữ liệu đề thi, câu hỏi và API key cá nhân sẽ gắn liền với `userId` trong PostgreSQL.

---

### 1.2. Vấn đề API Key: Lưu vào hệ thống, thuật toán bảo mật, không điền thì khóa, và xoay tua nhiều key
Bạn đã đặt ra những câu hỏi rất sâu sắc về nghiệp vụ và kiến trúc:

1. **Cấu hình AI hiện tại có tác dụng gì? Hệ thống hết API Key thì người dùng add à?**
   - Trước đây, hệ thống xoay 7 key qua file cấu hình môi trường `.env.local` ở server, còn modal ở giao diện chỉ lưu tạm vào `localStorage` của trình duyệt. Nếu 7 key hệ thống bị cạn hạn mức (Quota 429), người dùng sẽ gặp gián đoạn.
   - Do đó, việc chuyển sang cho **từng giáo viên tự lưu Google Gemini API Key cá nhân của họ** (hoàn toàn miễn phí từ Google AI Studio) là giải pháp bền vững và chuẩn mực nhất.

2. **Đề xuất lưu API Key thẳng vào hệ thống với bảng riêng & "thuật toán giống mật khẩu giúp không đọc được"?**
   - **Về thuật toán**:
     - *Mật khẩu đăng nhập*: Dùng hàm **Băm 1 chiều (One-Way Hash như Bcrypt/Argon2)**. Chiều này chỉ đi một chiều — băm xong thì **không bao giờ giải mã ngược lại được**, hệ thống chỉ cần so khớp `hash(input) === stored_hash`.
     - *Gemini API Key*: Backend bắt buộc phải gửi chuỗi API key nguyên bản sang máy chủ của Google để xác thực cuộc gọi AI. Do đó, **không thể dùng băm 1 chiều**.
     - *Giải pháp chuẩn bảo mật doanh nghiệp*: Sử dụng **Mã hóa đối xứng 2 chiều chuẩn quân sự AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode):
       - Master Key được lưu an toàn tại biến môi trường server (`SESSION_SECRET` / `ENCRYPTION_KEY`).
       - Trong Database (PostgreSQL): Bảng mới `UserApiKey` chỉ lưu chuỗi vô nghĩa (`ciphertext + iv + authTag`). Bất kỳ ai mở database hoặc xem SQL dump cũng **không thể đọc được key thật**.
       - Trên giao diện: Người dùng chỉ thấy key đã che dạng masked (ví dụ: `AIzaSy...7xWk`).
       - Khi gọi AI: Server giải mã tạm thời trong RAM trong vài mili-giây, gửi request sang Google Gemini, rồi giải phóng ngay khỏi bộ nhớ.

3. **Không điền API Key thì không dùng được AI?**
   - Đúng vậy! Nếu tài khoản chưa có API key nào đang kích hoạt trong kho khóa cá nhân, các tính năng AI (Sinh đề, Copilot sửa câu hỏi, đổi số liệu) sẽ hiển thị thông báo nhẹ nhàng yêu cầu thêm API Key để mở khóa.

4. **Xoay tua API Key khi người dùng thêm nhiều key (Multi-Key Rotation)?**
   - Cho phép một người dùng lưu nhiều key cá nhân (ví dụ: *Key chính*, *Key phụ 1*, *Key dự phòng 2*).
   - Hệ thống tự động **Round-robin** luân phiên giữa các key của chính người dùng đó.
   - Nếu Key 1 bị lỗi hạn mức `429 Too Many Requests`, hệ thống tự động chuyển sang Key 2, Key 3 mà không làm gián đoạn việc soạn đề.

---

### 1.3. Tái thiết kế Giao diện: Phong cách Google Minimalist, Màu trắng chủ đạo, Menu dọc bên phải & Dark Mode
Quan sát thực tế ảnh chụp giao diện hiện tại:
- **Thực trạng**: Thanh Header có đến 13 nút bấm và nhãn chen chúc (`GDPT 2018`, `Cloud & Offline Sync`, `Chia sẻ`, `Bảng điểm`, `Lớp học`, `Lưu Cloud`, `Trộn 4 mã đề`, `Ngân hàng câu hỏi`, `Nhập đề`, `Kho đề`, `Cấu hình AI`, `Sinh đề AI`, `Đăng nhập`), cùng banner cảnh báo màu vàng to tướng gây ngợp mắt và rối loạn thị giác.
- **Giải pháp Thiết kế mới theo phong cách Google Workspace (Google Docs / Google Forms)**:
  1. **Thanh Header phong cách Google Docs (Ultra Clean & Minimalist)**:
     - **Bên trái**: Logo ExamCraft + **Tên đề thi cho phép click để sửa trực tiếp** (như tên văn bản trong Google Docs) + Trạng thái đám mây nhỏ gọn (`☁ Đã lưu vào Đám mây`).
     - **Bên phải**: Nút chuyển đổi Dark/Light mode + Trạng thái Kho Key AI + Avatar & Menu tài khoản giáo viên.
     - *Loại bỏ toàn bộ các nút bấm dàn ngang lộn xộn.*
  2. **Thanh Menu dọc bên phải (Vertical Right Action Rail - Google Side Panel)**:
     - Tương tự như thanh tiện ích bên phải của **Google Docs / Gmail** (nơi Google đặt Keep, Tasks, Gemini Side Panel):
     - Một dải thanh mảnh, tinh tế ở mép phải với các icon công cụ trực quan:
       - 🪄 **Trợ lý AI Copilot**: Bấm mở Drawer / Panel bên phải để trò chuyện/yêu cầu AI sửa đề mà không che khuất trang soạn thảo.
       - 📤 **Xuất bản & In ấn**: Xuất file Word `.docx` chuẩn công thức, In / PDF A4.
       - 🔀 **Trộn đề**: Trộn 4 mã đề kèm ma trận đáp án.
       - 📊 **Ma trận & Bản đặc tả**: Xem/sửa bảng ma trận chuẩn Công văn 7991.
       - 🔗 **Chia sẻ & Khảo thí**: Tạo link làm bài trực tuyến cho học sinh, mở bảng điểm.
       - 📚 **Thư viện & Ngân hàng câu hỏi**: Nhập đề Word/Ảnh OCR, tìm kiếm câu hỏi có sẵn.
  3. **Tone màu & Phong cách tối giản (Predominant White & Dark Mode)**:
     - **Light Mode**: Trắng tinh khôi (`#FFFFFF`), nền canvas màu kem/xám nhạt Google Docs (`#F8F9FA`), đường viền xám siêu mảnh `#E8EAED`, điểm nhấn xanh Google (`#1A73E8`) hoặc Indigo thanh lịch.
     - **Dark Mode**: Bảng màu Material You chuẩn chống mỏi mắt (`#121212`, `#1E1E1E`, `#2D2D2D`), KaTeX và công thức Toán/Lý/Hóa hiển thị tương phản cao, rõ nét.

---

## 2. KIẾN TRÚC GIAO DIỆN MỚI (MOCKUP DẠNG SƠ ĐỒ)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE MINIMALIST HEADER                        │
│ [Logo ExamCraft]  [Đề kiểm tra học kỳ 2 (Toán 12) ✎]  [☁ Đã lưu]      │
│                                    [🌓 Dark/Light] [🔑 AI Key] [👤 Avt]│
├───────────────────────────────────────────────────────┬────────────────┤
│                                                       │ VERTICAL RIGHT │
│                   MAIN WORKSPACE                      │  ACTION RAIL   │
│                                                       │ (Google Style) │
│ ┌───────────────────────────┬───────────────────────┐ │ ┌────────────┐ │
│ │  DANH SÁCH CÂU HỎI        │  A4 LIVE PREVIEW      │ │ │ 🪄 Copilot │ │
│ │  (Thẻ phẳng trắng Google) │  (Tờ đề A4 chuẩn in)  │ │ │ 🔀 Trộn đề │ │
│ │                           │                       │ │ │ 📤 Xuất đề │ │
│ │  - Câu 1: [Nhận biết]     │  TRƯỜNG THPT...       │ │ │ 📊 Ma trận │ │
│ │    Nội dung câu hỏi...    │  ĐỀ THI HỌC KỲ...     │ │ │ 🔗 Thi ON  │ │
│ │    [Sửa] [Đổi số] [AI]    │                       │ │ │ 📚 Ngân hg │ │
│ │                           │  Câu 1. Cho hàm số... │ │ │ 📥 Nhập đề │ │
│ │  + Thêm câu hỏi mới       │  A. ...   B. ...      │ │ └────────────┘ │
│ └───────────────────────────┴───────────────────────┘ │                │
└───────────────────────────────────────────────────────┴────────────────┘
```

---

## 3. LỘ TRÌNH THỰC HIỆN (4 GIAI ĐOẠN)

### Giai đoạn 1: Bắt buộc đăng nhập & Bảo vệ Workspace (Auth Gate)
- Tạo lớp kiểm tra phiên `getCurrentUser()` cho trang chủ `/`.
- Nếu chưa có phiên đăng nhập hợp lệ: Chuyển hướng về `/login?redirect=/`.
- Sau khi đăng nhập: Nạp dữ liệu đề thi của chính người dùng đó.

### Giai đoạn 2: Bảng Database & Quản lý API Key người dùng (AES-256-GCM)
- Cập nhật `prisma/schema.prisma` với model `UserApiKey`:
  - `keyEncrypted`, `keyIv`, `keyTag`, `keyMasked`, `label`, `isActive`, `lastUsedAt`.
- Chạy `npx prisma db push` để đồng bộ cơ sở dữ liệu.
- Xây dựng module mã hóa `src/lib/crypto.ts` (chuẩn mã hóa đối xứng AES-256-GCM với IV và Auth Tag).
- Xây dựng API `/api/user/keys` (thêm key, xóa key, lấy danh sách key masked).
- Cập nhật backend gọi AI (`/api/generate-exam` và Copilot): Tự động lấy key giải mã của chính người dùng và kích hoạt cơ chế xoay tua (Round-robin + Fallback khi 429). Nếu chưa có key thì báo lỗi yêu cầu cấu hình.

### Giai đoạn 3: Redesign Giao diện Tối giản Google Workspace (White & Dark Mode)
- **Thiết kế lại Header (`src/components/Header.tsx`)**:
  - Tối giản hoàn toàn: Logo + Tên đề (sửa trực tiếp) + Trạng thái Đám mây + Nút Dark/Light mode + Nút Kho Key AI + Menu User.
- **Xây dựng Thanh công cụ dọc bên phải (`src/components/RightActionRail.tsx`)**:
  - Dải công cụ dọc cố định bên phải theo phong cách Google Side Panel.
  - Tích hợp các modal/drawer: Trợ lý AI Copilot, Xuất bản Word/PDF, Trộn 4 mã đề, Ma trận CV 7991, Chia sẻ thi online, Ngân hàng câu hỏi.
- **Xây dựng Modal Quản lý API Key mới (`src/components/ApiKeyModal.tsx`)**:
  - Giao diện quản lý danh sách key cá nhân, trạng thái hoạt động, hướng dẫn lấy key miễn phí từ Google AI Studio, nút thêm key mới.
- **Tối ưu toàn diện bảng màu**:
  - Nền Trắng tinh khôi tối giản của Google trong Light Mode.
  - Nền xám đen sang trọng, tương phản sắc nét trong Dark Mode (Material You).

### Giai đoạn 4: Kiểm thử, Thẩm định UI trên Trình duyệt & Hoàn thiện
- Chạy bộ kiểm thử tự động (`npm test`, `npm run test:unit`, `next build`).
- Dùng Browser Subagent duyệt trực tiếp và chụp ảnh giao diện mới ở cả 2 chế độ Light Mode & Dark Mode.
- Kiểm tra tính năng lưu/mã hóa API key vào PostgreSQL và kiểm tra cơ chế bắt buộc đăng nhập.
