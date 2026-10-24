# BÁO CÁO KIỂM THỬ: ĐỘI AIP (AI PIPELINE & 7 GEMINI KEYS AUDIT)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: AIP SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Mã nguồn thẩm định**: `src/lib/gemini-keys.ts`, `src/app/api/admin/ai/route.ts`, `prisma/schema.prisma`

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-AIP-001` | Bảo mật khóa API (Zero raw keys in DB/logs) | **PASS** | `src/lib/gemini-keys.ts` chỉ lưu `keyAlias` (`key1`..`key7`) vào DB. Hàm `executeWithKeyRotation` không bao giờ in `rawKey` ra console hay log. |
| `TC-AIP-002` | Thuật toán chọn key thông minh ("Least Used & Healthy") | **PASS** | Lọc bỏ key `DEAD` và key đang trong thời gian `cooldownUntil`. Sắp xếp tăng dần theo `dailyCount` và `lastUsedAt`. |
| `TC-AIP-003` | Cơ chế xử lý lỗi 429 (Rate limit) và 503 (Spikes in demand) | **PASS** | Tự động đưa key vào `COOLDOWN` 60 giây và chuyển sang key kế tiếp với jitter backoff `300 * (attempt + 1)` ms. |
| `TC-AIP-004` | Xử lý lỗi 401 / 403 (Invalid Key) | **PASS** | Đánh dấu vĩnh viễn key là `DEAD` trong bảng `AiKeyState` để không gọi lại nữa. |
| `TC-AIP-005` | Giới hạn hạn mức AI theo giáo viên (`checkUserAiQuota`) | **PASS** | Đếm số log HTTP 200 trong ngày của `userId`. Nếu vượt `User.aiDailyLimit`, ném lỗi chặn thân thiện tiếng Việt. |
| `TC-AIP-006` | Race condition khi nhiều người dùng gọi đồng thời (R23) | **WARNING (MEDIUM)** | `selectBestKey` đọc `dailyCount` từ DB trước khi transaction hoàn tất. Nếu 10 request đến cùng 1 mili-giây, chúng có thể cùng chọn 1 key trước khi `dailyCount` kịp tăng. |
| `TC-AIP-007` | Lệch múi giờ reset hạn mức ngày (R30) | **WARNING (MEDIUM)** | Dòng 58: `const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);` dùng giờ địa phương của server. Nếu chạy trên Vercel (máy chủ UTC), hạn mức sẽ reset lúc 07:00 sáng Việt Nam thay vì 00:00 đêm. |

---

## 2. GỢI Ý NÂNG CẤP (PATCH PROPOSAL)
- Để reset chuẩn theo múi giờ Việt Nam (UTC+7):
  ```ts
  const now = new Date();
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  vnTime.setHours(0, 0, 0, 0);
  ```
