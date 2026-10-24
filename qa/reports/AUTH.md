# BÁO CÁO KIỂM THỬ: ĐỘI AUTH (AUTHENTICATION & ACCESS CONTROL)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: AUTH SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Môi trường**: Next.js 16 Auth, bcryptjs, session cookies, DB QA.

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-AUTH-001` | Băm và đối chiếu mật khẩu `bcryptjs` | **PASS** | Băm mật khẩu an toàn với salt round 10, đối chiếu đúng cho phép, sai từ chối. |
| `TC-AUTH-002` | Quản lý phiên Session Server-side | **PASS** | Token sinh ngẫu nhiên 32 bytes hex, lưu bảng `Session`, xóa hoàn toàn khi logout. |
| `TC-AUTH-003` | Cookie an toàn `auth_session` | **PASS** | Thiết lập cờ `HttpOnly: true`, `SameSite: lax`, `Path: /`, `Secure` (khi NODE_ENV=production). |
| `TC-AUTH-004` | Khóa tài khoản sau 5 lần thử sai (Brute-force) | **PASS** | Sau 5 lần nhập sai, `checkLoginRateLimit` trả về `allowed: false, waitMinutes: 15`. |
| `TC-AUTH-005` | Nguy cơ mất trạng thái lockout trên Serverless (R18) | **WARNING (HIGH)** | `loginAttempts` đang lưu trong bộ nhớ tiến trình (`new Map()`), sẽ mất tác dụng nếu chạy đa container hoặc Serverless Vercel. |
| `TC-AUTH-006` | Phân quyền Super Admin vs Teacher | **PASS** | Hàm `requireAdmin()` trong `src/lib/auth.ts` ném lỗi `FORBIDDEN` nếu role khác `SUPER_ADMIN`. |
| `TC-AUTH-007` | Bảo vệ chống tấn công IDOR chéo giáo viên (R7) | **PASS** | Đã xác minh: Giáo viên B gọi vào câu hỏi của Giáo viên A bị chặn với HTTP 403 Forbidden. Mọi câu hỏi riêng tư `PRIVATE` đều lọc theo `ownerId`. |

---

## 2. BẰNG CHỨNG THỰC NGHIỆM
Trích xuất từ kết quả chạy `tests_e2e/test_sprint1.ts`:
```text
✅ PASS: Xác thực mật khẩu đúng của Teacher A
✅ PASS: Từ chối mật khẩu sai
✅ PASS: Tạo phiên Session thành công trong CSDL
✅ PASS: Hủy phiên Session thành công sau khi đăng xuất
✅ PASS: Khóa tạm thời tài khoản sau 5 lần đăng nhập thất bại
✅ PASS: Teacher B không thấy câu hỏi của Teacher A trong danh sách cá nhân
✅ PASS: Hệ thống chặn Teacher B đọc câu hỏi PRIVATE của Teacher A (IDOR Protection)
```
