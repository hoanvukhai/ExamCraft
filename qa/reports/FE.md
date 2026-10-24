# BÁO CÁO KIỂM THỬ: ĐỘI FE (FRONTEND ARCHITECTURE & COMPONENTS)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: FE SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Mã nguồn thẩm định**: `src/components/*`, `src/app/page.tsx`, `src/app/a/[publicId]/page.tsx`

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-FE-001` | Kiến trúc thẻ câu hỏi (Card) và Xem trước A4 | **PASS** | Giao diện chia đôi màn hình: biên tập câu hỏi bên trái, xem trước định dạng trang in A4 chuẩn bên phải. |
| `TC-FE-002` | Khối hiển thị công thức toán học KaTeX an toàn | **PASS** | `MathRenderer.tsx` bật cờ `trust: false`, triệt tiêu lỗ hổng thực thi JavaScript qua KaTeX. |
| `TC-FE-003` | Khối vẽ đồ thị Canvas 2D (`FunctionPlotter.tsx`) | **PASS** | Vẽ chính xác tiệm cận đứng/ngang nét đứt, bảng giá trị, vạch chia tọa độ $Oxy$. |
| `TC-FE-004` | Khối vẽ bảng biến thiên 3 dòng (`VariationTable.tsx`) | **PASS** | Render chuẩn 3 dòng: dòng $x$, dòng đạo hàm $y'$, dòng hàm số $y$ với mũi tên biến thiên. |
| `TC-FE-005` | Tương thích Next.js 16 & Suspense Boundaries | **PASS** | Các dynamic routes dùng `use(params)` (`/a/[publicId]`, `/teacher/assignments/[id]`) đều được bao bọc trong `<React.Suspense>` ngăn ngừa lỗi build. |
