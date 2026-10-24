# BÁO CÁO HOÀN THÀNH TÁI CẤU TRÚC VÀ REDESIGN EXAMCRAFT

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.
*(Google Workspace Minimalist • User API Key Vault AES-256-GCM • Authentication Gate)*

---

## 1. TỔNG QUAN CÁC HẠNG MỤC ĐÃ HOÀN THÀNH

Theo đúng các yêu cầu và đề xuất của bạn, toàn bộ hệ thống đã được tái cấu trúc triệt để theo 4 trụ cột cốt lõi:

| STT | Yêu cầu của bạn | Giải pháp kỹ thuật đã triển khai | Trạng thái |
|---|---|---|---|
| 1 | **Sao không đăng nhập mà vẫn dùng được?** | Thêm **Authentication Gate** ở cấp Server trên route `/`. Nếu chưa có phiên cookie hợp lệ, tự động chuyển hướng ngay về `/login?redirect=/`. | **HOÀN THÀNH** |
| 2 | **Lưu API Key thẳng vào Database với bảng riêng, thuật toán giống mật khẩu không đọc được?** | Tạo bảng `UserApiKey` trong PostgreSQL. Áp dụng chuẩn **Mã hóa đối xứng 2 chiều AES-256-GCM** (IV 12 bytes + Auth Tag 16 bytes). Database chỉ lưu chuỗi vô nghĩa (`ciphertext`), không thể đọc được key gốc. | **HOÀN THÀNH** |
| 3 | **Xem được API dung lượng, kiểm tra key còn sống, hết hạn hay hết lượt (429)?** | Xây dựng API `/api/user/keys/test` ping trực tiếp sang Google Gemini; hiển thị thanh tiến trình hạn mức trong ngày (`usedToday` / `dailyLimit`) và trạng thái từng key: Sẵn sàng, Hết lượt (429) hoặc Hết hạn. | **HOÀN THÀNH** |
| 4 | **Xoay tua nhiều API Key cho người dùng** | Cho phép người dùng thêm nhiều key cá nhân. Khi gửi lệnh AI, backend tự động xoay tua **Round-robin**; nếu Key 1 gặp lỗi Quota 429 thì tự động fallback sang Key 2, Key 3. | **HOÀN THÀNH** |
| 5 | **Thiết kế phong cách Google: Chủ đạo màu trắng, Menu dọc bên trái, hỗ trợ Dark Mode** | Thiết kế lại theo chuẩn **Google Workspace / Google Docs**: Nền trắng tinh khôi `#FFFFFF` và `#F8F9FA`, Header tinh gọn (đổi tên đề thi trực tiếp), dải **Thanh Menu dọc bên trái (Left Navigation Rail)** thu gọn/mở rộng mượt mà, và chế độ Dark Mode chuẩn Material Dark. | **HOÀN THÀNH** |

---

## 2. CHI TIẾT KIẾN TRÚC & KỸ THUẬT

### 2.1. Authentication Gate (Bắt buộc đăng nhập)
* File: `src/app/page.tsx`
* Cơ chế: Trang chủ được bao bọc bởi Server Component và `<Suspense>`. Trước khi render Workspace, hàm `getCurrentUser()` kiểm tra session token trong cookie `examcraft_session`. Nếu không tồn tại hoặc hết hạn, Next.js thực hiện `redirect('/login?redirect=/')` ngay lập tức, ngăn chặn hoàn toàn việc người dùng vãng lai truy cập Workspace khi chưa đăng nhập.

### 2.2. Kho khóa cá nhân (User API Key Vault) chuẩn AES-256-GCM
* Module mã hóa: `src/lib/crypto.ts`
  * Thuật toán: `aes-256-gcm` với Master Key sinh từ `SESSION_SECRET`.
  * Hàm `encryptApiKey(plainKey)`: Sinh ngẫu nhiên vector khởi tạo (IV) và Auth Tag bảo vệ tính toàn vẹn dữ liệu.
  * Hàm `decryptApiKey(ciphertext, iv, tag)`: Giải mã tạm thời trong RAM khi thực thi gọi Google Gemini.
  * Hàm `maskApiKey(rawKey)`: Che phần thân key, chỉ để lộ phần đầu và cuối (ví dụ: `AIzaSy...7xWk`).
* Bảng Database mới (`prisma/schema.prisma`):
  ```prisma
  model UserApiKey {
    id           String    @id @default(cuid())
    userId       String
    user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    label        String    @default("Khóa chính")
    keyEncrypted String    @db.Text
    keyIv        String
    keyTag       String
    keyMasked    String
    isActive     Boolean   @default(true)
    createdAt    DateTime  @default(now())
    lastUsedAt   DateTime?
    errorCount   Int       @default(0)

    @@index([userId])
  }
  ```
* Bộ API quản lý:
  * `GET /api/user/keys`: Lấy danh sách key đã che (masked) và thông tin dung lượng/lượt dùng trong ngày (`aiDailyLimit`, `usedToday`, `remaining`).
  * `POST /api/user/keys`: Mã hóa AES-256-GCM và lưu key mới vào PostgreSQL.
  * `DELETE /api/user/keys?id=...`: Xóa key khỏi tài khoản.
  * `PATCH /api/user/keys`: Bật/tắt trạng thái hoạt động của key.
  * `POST /api/user/keys/test`: Ping kiểm tra trực tiếp trạng thái sống/chết/hết lượt (429) kèm độ trễ phản hồi (ms).

### 2.3. Thiết kế Google Workspace Minimalist
* **Thanh Header phong cách Google Docs (`src/components/Header.tsx`)**:
  * Tinh gọn chiều cao chuẩn 56px.
  * **Sửa tên đề thi trực tiếp (Inline Editing)**: Bấm vào tên đề để sửa ngay, tự động lưu đám mây giống tên tài liệu trên Google Docs.
  * Trạng thái đồng bộ tự động: `Đã lưu đám mây` / `Đang lưu...`.
  * Nút chuyển đổi Dark Mode / Light Mode mượt mà.
  * Nút trạng thái Khóa AI cá nhân và Avatar tài khoản giáo viên.
  * Toàn bộ 13 nút bấm lộn xộn trước đây trên Header đã được dọn sạch hoàn toàn!
* **Thanh Menu dọc bên trái (`src/components/LeftNavigationRail.tsx`)**:
  * Đặt dọc mép trái theo phong cách Google Drive / Classroom / Gmail.
  * Hỗ trợ nút "Thu gọn" (Icon Rail hẹp 64px) hoặc "Mở rộng" (240px kèm nhãn).
  * Phân chia nhóm chức năng rõ ràng:
    1. *Soạn đề & Trợ lý*: Sinh đề AI Mới, Trợ lý AI Copilot, Trộn 4 mã đề, Ma trận (CV 7991), Tiêu đề trường thi.
    2. *Xuất bản & In*: Tải file Word (.docx), In ấn / Lưu PDF A4.
    3. *Khảo thí & Lớp*: Chia sẻ & Thi Online, Bảng điểm thi, Quản lý Lớp học.
    4. *Thư viện câu hỏi*: Ngân hàng câu hỏi, Nhập đề (Word/Ảnh), Kho đề đã lưu.
    5. *Chân menu*: Kho Khóa AI (Keys) và Nút thu gọn.
* **Modal Quản lý API Key (`src/components/ApiKeyModal.tsx`)**:
  * Thanh tiến trình hiển thị dung lượng AI hôm nay (`usedToday / dailyLimit`).
  * Danh sách các key cá nhân đã lưu kèm giá trị masked và badge trạng thái.
  * Nút "Kiểm tra key" để ping trực tiếp tới Google Gemini.
  * Form thêm key mới có cảnh báo mã hóa AES-256-GCM và hướng dẫn nhận key miễn phí từ Google AI Studio.
* **Hỗ trợ Dark Mode toàn diện (`src/components/ThemeProvider.tsx` & `src/app/globals.css`)**:
  * Tự động lưu chế độ vào `localStorage`.
  * Màu nền, thẻ câu hỏi, KaTeX công thức toán, modal và thanh công cụ đều đổi màu tương phản chuẩn WCAG mà không bị chói hay mất nét.

---

## 3. KẾT QUẢ KIỂM THỬ & NGHIỆM THU

### 3.1. Kiểm thử Đơn vị (Unit Tests)
```
npm run test:unit
-> KẾT QUẢ: ĐÃ VƯỢT QUA 20/20 BÀI KIỂM THỬ (100% PASS)
```

### 3.2. Kiểm thử Tích hợp Toàn diện (Full Test Suite)
```
npm test
-> Giai đoạn 1: Auth & Docker PostgreSQL... PASS (100%)
-> Giai đoạn 2: CSDL Câu hỏi, Đề thi & 7 Gemini Keys... PASS (100%)
-> Giai đoạn 3: Giao bài & Phòng thi học sinh... PASS (100%)
-> Giai đoạn 4: Giám sát bài thi & Bảng điểm giáo viên... PASS (100%)
-> Giai đoạn 5: Xuất file Word .docx & Định dạng A4... PASS (100%)
-> Giai đoạn 6: Bảo mật, Sao lưu & Kiểm chứng toàn diện... PASS (100%)
🎉 TẤT CẢ 6/6 GIAI ĐOẠN ĐÃ VƯỢT QUA KIỂM THỬ XUẤT SẮC!
```

### 3.3. Kiểm thử Biên dịch Next.js (Turbopack Production Build)
```
npx next build
-> ✓ Compiled successfully in 9.0s
-> ✓ Generating static pages using 11 workers (35/35) in 11.1s
-> The command exited with code 0.
```

### 3.4. Kiểm thử Thực tế trên Trình duyệt (Browser Subagent Verification)
* **Xác thực Auth Gate**: Truy cập `http://localhost:3000/` tự động chuyển hướng chính xác sang `http://localhost:3000/login?redirect=/`.
* **Đăng nhập**: Đăng nhập thành công với tài khoản giáo viên `teacher@examcraft.local`.
* **Giao diện mới**:
  * Header tối giản phong cách Google Docs tải mượt mà, cho phép đổi tên đề thi trực tiếp.
  * Thanh Menu dọc bên trái hoạt động trơn tru, hỗ trợ thu gọn/mở rộng.
  * Chuyển đổi Dark Mode / Light Mode hoạt động tức thì, không giật lag.
  * Mở Kho Khóa AI (Keys) hiển thị đầy đủ bảng dung lượng hạn mức, kiểm tra ping key và form mã hóa AES-256-GCM.
