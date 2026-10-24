# BÁO CÁO KIỂM THỬ: ĐỘI PERF (PERFORMANCE & CONCURRENCY LOAD TESTING)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: PERF SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Môi trường**: PostgreSQL 16 (QA Container cổng 5437), Prisma Connection Pool

---

## 1. TỔNG HỢP KẾT QUẢ THỬ TẢI 100 HỌC SINH ẢO

| Chỉ Số Đánh Giá | Mục Tiêu (Target) | Kết Quả Thực Tế | Đánh Giá & Trạng Thái |
|---|---|---|---|
| **Số lượng thí sinh ảo đồng thời** | 100 Virtual Students | **100 Học sinh ảo** | **PASS**: 100% người dùng thực hiện đủ chu trình thi. |
| **Tỷ lệ thành công nộp bài** | 100% (Không lỗi, không mất bài) | **100 / 100 (100%)** | **PASS**: Không có bài nào bị rơi vào trạng thái treo hoặc lỗi kết nối. |
| **Tổng thời gian xử lý 100 request đồng thời** | < 3,000 ms | **82 ms** | **XUẤT SẮC**: ~0.8 ms trên mỗi request nộp bài. |
| **Khả năng chịu tải Connection Pool** | Không tràn pool kết nối | **Ổn định** | Prisma connection pool tự động điều tiết, không phát sinh lỗi timeout kết nối. |
| **Tính toàn vẹn dữ liệu** | 100% bản ghi chuyển `SUBMITTED` | **100% ĐẠT** | Mọi bản ghi `Attempt` đều có điểm số, timestamp nộp bài và trạng thái hoàn tất. |

---

## 2. BẰNG CHỨNG LỆNH THỰC TẾ
Trích xuất từ kết quả chạy `tests_e2e/test_sprint3_security_perf_mutation.ts`:
```text
--- 2. THỬ TẢI 100 HỌC SINH ẢO NỘP BÀI ĐỒNG THỜI (PERF) ---
⏳ Đang khởi tạo 100 học sinh ảo...
✅ PASS: Đã tạo thành công 100 học sinh ảo
⏳ 100 học sinh ảo đồng thời Start và Lưu nháp...
⏱️ Thời gian hoàn tất 100 lượt nộp bài đồng thời: 82 ms (~0.8 ms/request)
✅ PASS: Tất cả 100 học sinh ảo đã nộp bài thành công (0% thất bại)
✅ PASS: 100% bản ghi Attempt mang trạng thái SUBMITTED, không xảy ra deadlock hay mất bài
```
