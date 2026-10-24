# BÁO CÁO KIỂM THỬ: ĐỘI EXP (EXPORT & RENDERING QUALITY AUDIT)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: EXP SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Mã nguồn thẩm định**: `src/lib/docx-export.ts`, `src/components/FunctionPlot.tsx`, `src/components/VariationTable.tsx`

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-EXP-001` | Cấu trúc tệp tin Word OpenXML chuẩn | **PASS** | Tệp tin xuất ra mang đúng chữ ký container OpenXML ZIP (`PK\x03\x04`), mở trơn tru trên Word. |
| `TC-EXP-002` | Công thức toán học OMML (Office Math) | **PASS** | Xuất thành công phân số (`MathFraction`), căn bậc n (`MathRadical`), tích phân có cận $\int_a^b$, ma trận `pmatrix`, hệ phương trình `cases`. |
| `TC-EXP-003` | Quy chuẩn chống vỡ trang in A4 | **PASS** | Áp dụng `keepNext: true` và `keepLines: true` cho tiêu đề câu hỏi và các phương án, ngăn việc ngắt đôi câu hỏi giữa 2 trang giấy. |
| `TC-EXP-004` | Xuất hình vẽ đồ thị & Bảng biến thiên (R22) | **CRITICAL BUG (CLAIM-FAIL)** | Trong `src/lib/docx-export.ts` **hoàn toàn không có mã nguồn nào xử lý trường `figures[]`** hay chuyển Canvas thành ảnh chèn vào Word (`ImageRun`). Toàn bộ đồ thị và bảng biến thiên bị mất trắng trong file Word xuất ra! |
| `TC-EXP-005` | Tiêu đề và thông tin thí sinh | **PASS** | Bảng tiêu đề Sở/Trường, Mã đề, Thời gian làm bài và khung ghi họ tên, số báo danh được định dạng đẹp mắt. |

---

## 2. PHÂN TÍCH LỖI MẤT HÌNH VẼ KHI XUẤT WORD (R22)
- **Tuyên bố trong báo cáo & README**:
  > *"Bảo toàn 100% hình vẽ & bảng biểu... Khi xuất Word: hình động được vẽ thành PNG độ phân giải cao rồi chèn."*
- **Thực tế kiểm tra trong mã nguồn**:
  - `grep_search` từ khóa `figures` trong `src/lib/docx-export.ts` trả về: **0 kết quả**.
  - `grep_search` từ khóa `ImageRun` trong `src/lib/docx-export.ts` trả về: **0 kết quả**.
- **Kết luận**: Đây là tuyên bố sai lệch nghiêm trọng giữa quảng bá và thực tế (`BUG` / `CLAIM-DISCREPANCY`). Câu hỏi có hình đồ thị Canvas hoặc bảng biến thiên khi in ra giấy qua file Word sẽ bị thiếu toàn bộ hình vẽ.
- **Gợi ý khắc phục**: Cần bổ sung hàm chuyển đổi dữ liệu đồ thị Canvas/SVG thành buffer PNG và chèn vào `docChildren` thông qua `new ImageRun({ data: pngBuffer, transformation: { width: 400, height: 250 } })`.
