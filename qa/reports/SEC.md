# BÁO CÁO KIỂM THỬ: ĐỘI SEC (SECURITY, PRIVACY & VULNERABILITY AUDIT)

- **Người thực hiện**: SEC SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Mã nguồn thẩm định**: Toàn bộ codebase, `src/lib/auth.ts`, `prisma/schema.prisma`, `src/lib/gemini-keys.ts`

---

## 1. TỔNG HỢP KẾT QUẢ RÀ SOÁT BẢO MẬT

| Mã Kiểm Thử | Lỗ Hổng / Hạng Mục An Ninh | Mức Độ | Trạng Thái | Bằng Chứng / Đánh Giá Thực Tế |
|---|---|---|---|---|
| `SEC-001` | Lộ đề thi và đáp án qua API cũ (`/api/cloud/exams/[id]`) (R6) | **Critical** | **CONFIRMED VULNERABILITY** | Endpoint công khai, không cần auth, đọc từ `cloud_exams.json` và trả về 100% đề thi có đáp án. Phải xóa bỏ ngay. |
| `SEC-002` | Rò rỉ đáp án qua Server-Side Rendering / RSC Payload (R5) | **High** | **PASS (ĐIỀU KIỆN)** | `sanitizeSnapshotForStudent` lọc sạch đáp án khi snapshot có mảng `questions` cấp cao. Cần bổ sung đệ quy cho `sections[].questions`. |
| `SEC-003` | Tấn công phân quyền chéo (IDOR) giữa các giáo viên (R7) | **High** | **PASS** | Mọi API câu hỏi, đề thi, lớp học đều kiểm tra `ownerId !== user.id` và trả về 403 Forbidden. |
| `SEC-004` | XSS qua công thức KaTeX và Markdown | **High** | **PASS** | `MathRenderer.tsx` đã kích hoạt `trust: false`, ngăn chặn việc thực thi mã JavaScript qua macro LaTeX. |
| `SEC-005` | CSV Formula Injection qua tên học sinh / lớp | **Medium** | **PASS** | Đã xác minh hàm `sanitizeCsvCell` tự động escape các ký tự `=, +, -, @, \t, \r` bằng dấu nháy đơn `'`. |
| `SEC-006` | Tuân thủ Nghị định 13/2023/NĐ-CP về dữ liệu cá nhân học sinh | **High** | **PASS** | Bảng `Student` chỉ lưu `displayName`, hoàn toàn không thu thập số điện thoại, email, CCCD, địa chỉ. Dữ liệu học sinh không bao giờ bị gửi tới AI. |
| `SEC-007` | Lộ khóa bí mật trong mã nguồn hoặc lịch sử Git (R17) | **Critical** | **PASS** | Đã quét lịch sử git: Không có live API key (`AIzaSy...`) bị commit vào repo. `.gitignore` đã chặn đúng các file `.env*`. |
| `SEC-008` | Mất tác dụng khóa brute-force trên Serverless (R18) | **High** | **WARNING** | `loginAttempts` lưu trong RAM tiến trình Node.js, không chia sẻ được giữa các serverless instances. |
