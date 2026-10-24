# BÁO CÁO KIỂM THỬ: ĐỘI LOG (BUSINESS LOGIC, SCORING & SHUFFLING)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: LOG SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Mã nguồn thẩm định**: `src/lib/scoring.ts`, `src/lib/shuffler.ts`, `tests_e2e/test_sprint1.ts`

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-LOG-001` | Barem lũy tiến Đúng/Sai Phần II (Bộ GD&ĐT) | **PASS** | 0 ý: 0.0đ; 1 ý: 0.1đ; 2 ý: 0.25đ; 3 ý: 0.5đ; 4 ý: 1.0đ. Khớp 100% bảng oracle. |
| `TC-LOG-002` | Chuẩn hóa trả lời ngắn Phần III | **PASS** | Hỗ trợ dấu chấm (`1.5`), dấu phẩy (`1,5`), khoảng trắng (` 1.5 `), phân số (`3/2`), số thập phân tương đương (`1.50` == `1.5`), dấu trừ unicode (`−`). |
| `TC-LOG-003` | Thuật toán hoán vị Fisher-Yates (Mulberry32) | **PASS** | Tái lập 100% với cùng 1 seed. Không làm mất phương án, không làm sai lệch đáp án đúng. |
| `TC-LOG-004` | Bảo vệ phương án phụ thuộc ("Cả A và B") | **PASS** | Tự động phát hiện phương án phụ thuộc và ghim cố định ở vị trí D, không bị đảo lên trên. |
| `TC-LOG-005` | Thẩm định cơ sở pháp lý cấu trúc đề (R15) | **CẦN XÁC MINH (DOC-STALE)** | Thông tư 17/2025/TT-BGDĐT sửa đổi chương trình môn học GDPT 2018, không quy định cấu trúc đề thi 4 phần. Cấu trúc 3 phần là theo Quyết định 764/QĐ-BGDĐT. "Phần IV" là do phần mềm tự mở rộng. |

---

## 2. BẰNG CHỨNG THỰC NGHIỆM
Trích xuất từ kết quả chạy `tests_e2e/test_sprint1.ts`:
```text
✅ PASS: Phần II: Đúng 0 ý = 0.0đ
✅ PASS: Phần II: Đúng 1 ý = 0.1đ
✅ PASS: Phần II: Đúng 2 ý = 0.25đ
✅ PASS: Phần II: Đúng 3 ý = 0.5đ
✅ PASS: Phần II: Đúng 4 ý = 1.0đ
✅ PASS: Phần III: Khớp số thập phân dấu chấm (1.5)
✅ PASS: Phần III: Khớp số thập phân dấu phẩy (1,5)
✅ PASS: Phần III: Tự động loại bỏ khoảng trắng thừa
✅ PASS: Phần III: Khớp số học thập phân (1.50 == 1.5)
✅ PASS: Phần III: Chặn đáp số sai
```
