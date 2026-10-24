# BÁO CÁO KIỂM THỬ: ĐỘI ING (INGESTION & DATA PARSING AUDIT)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: ING SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Mã nguồn thẩm định**: `src/app/api/parse-docx/route.ts`, `src/app/api/parse-exam-text/route.ts`, `src/app/api/migration/import-legacy/route.ts`

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-ING-001` | Trích xuất đề thi từ file Word (`.docx`) | **PASS** | Sử dụng thư viện `mammoth`, trích xuất sạch sẽ văn bản thô, bảng biểu và ký tự từ file `.docx`. |
| `TC-ING-002` | Bóc tách đề thi từ văn bản / LaTeX EX_Test | **PASS** | Xử lý tốt các cấu trúc `\choice`, `\choiceTF`, ngoặc lồng `\extractBracedContent`, tách câu hỏi và phương án chính xác. |
| `TC-ING-003` | Nhập dữ liệu di chuyển từ bản cũ (`/api/migration/import-legacy`) (R29) | **WARNING (HIGH)** | API đọc dữ liệu sao lưu cũ và insert vào DB. Cần tăng cường Zod validation chặt chẽ hơn để phòng ngừa JSON độc hại tiêm nhiễm thuộc tính nguy hiểm. |
| `TC-ING-004` | Giới hạn kích thước file tải lên | **PASS** | Chặn các file tải lên vượt quá 10MB để bảo vệ máy chủ khỏi bị tràn bộ nhớ. |
