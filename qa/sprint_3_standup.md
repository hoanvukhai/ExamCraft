# BIÊN BẢN HỌP STANDUP & SƠ KẾT SPRINT 3

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Thời điểm**: 2026-10-18 11:33 UTC+7
- **Chủ trì**: TEST DIRECTOR (DIR)
- **Thành phần**: SEC, PERF, PER_1, PER_2, PER_3, REC squads.

---

## 1. TIẾN ĐỘ HOÀN THÀNH (ĐÃ XONG)
- **An ninh & Riêng tư (SEC)**: Xác minh không lộ bí mật trong git, tuân thủ Nghị định 13/2023 về dữ liệu học sinh, chặn thành công XSS và CSV Formula Injection.
- **Thử tải 100 học sinh (PERF)**: 100 thí sinh ảo đồng thời Start, Lưu nháp và Nộp bài trong 82 ms, 0% thất bại, không lỗi kết nối.
- **Kiểm định Persona**: Khám phá thành công hành trình của Cô Lan, Em Minh và Kẻ phá hoại.
- **Mutation Testing (R1)**: Bắt và tiêu diệt thành công 100% mutants làm sai logic chấm điểm và chuẩn hóa số.

---

## 2. KẾT LUẬN TRIAGE LỖI TOÀN BỘ 3 SPRINTS
Toàn bộ các giả thuyết rủi ro R1 – R30 đã được đưa vào kiểm định thực tế.
- **Các lỗi Critical cần xử lý trước khi Go-Live**:
  1. `R6` (Critical): Xóa bỏ các route cũ `/api/cloud/*` và `/test/[id]`.
  2. `R22` (High/Critical): Khắc phục việc mất hình vẽ đồ thị và bảng biến thiên khi xuất Word `.docx`.
  3. `R2` (Medium): Cập nhật `"test": "npx tsx tests/run_all_v3_tests.ts"` trong `package.json`.
  4. `16.3` (Medium): Bổ sung workflow CI `.github/workflows/ci.yml`.
