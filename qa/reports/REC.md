# BÁO CÁO KIỂM TOÁN TÀI LIỆU & TUYÊN BỐ: ĐỘI REC (RECON & DOC-AUDITOR)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: RECON SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Phạm vi đối chiếu**: `docs/CHECKLIST_TIEN_DO.md`, `docs/BAO_CAO_TOAN_DIEN_V3.md`, `README.md`, `docs/EXAMCRAFT_THIET_KE_V3.md` so với mã nguồn thực tế tại commit `ef8d34b`.

---

## 1. BẢNG TỔNG KẾT TUYÊN BỐ VÀ THỰC TẾ (CLAIM VS REALITY)

| Tuyên Bố (Claim) | Nguồn Tuyên Bố | Thực Tế Kiểm Tra | Phân Loại & Đánh Giá |
|---|---|---|---|
| "34 API routes" | `BAO_CAO_TOAN_DIEN_V3.md` | Có **37 routes** trong mã nguồn (do còn 4 route legacy `/api/cloud/*`) | `DOC-STALE` |
| "17 models, 14 enums" | `BAO_CAO_TOAN_DIEN_V3.md` | Khớp chính xác 100% | `PASS` |
| "6 giai đoạn kiểm thử 100% pass qua `npm test`" | `BAO_CAO_TOAN_DIEN_V3.md` | `npm test` chỉ chạy 20 test unit v2 cũ; muốn chạy v3 phải gọi `tests/run_all_v3_tests.ts` | `BUG / DOC-STALE` (R2) |
| "Bảo toàn 100% hình vẽ khi xuất Word" | `README.md`, `BAO_CAO...` | `docx-export.ts` hoàn toàn không có code xử lý `figures[]` hoặc `ImageRun`. Hình vẽ bị mất sạch | `CRITICAL BUG / CLAIM-FAIL` (R22) |
| "Loại bỏ sạch các route và file cũ" | `CHECKLIST_TIEN_DO.md` | `/test/[id]` và `/api/cloud/exams/[id]` vẫn tồn tại và làm lộ 100% đề thi | `CRITICAL BUG / CLAIM-FAIL` (R6) |
| "Khóa tài khoản 15 phút sau 5 lần thử sai" | `BAO_CAO_TOAN_DIEN_V3.md` | Hoạt động trên môi trường đơn tiến trình, nhưng mất tác dụng trên Serverless do lưu `Map` trong RAM | `HIGH WARNING` (R18) |
| "Tuân thủ Thông tư 17/2025 về cấu trúc đề 4 phần" | `BAO_CAO_TOAN_DIEN_V3.md` | Thông tư 17/2025 sửa đổi chương trình môn học, không ban hành cấu trúc đề. Phần IV là tự quy ước | `CẦN XÁC MINH NGUỒN` (R15) |
| "Tự động dọn dẹp bản sao lưu cũ > 30 ngày" | `BAO_CAO_TOAN_DIEN_V3.md` | `scripts/backup.ps1` mặc định giá trị `$KeepDays = 7` ngày | `DOC-STALE` (R19) |
| "CI tự động kiểm tra build & test trên GitHub" | `CHECKLIST_TIEN_DO.md` | Thư mục `.github/workflows` chưa được tạo | `DOC-STALE / MISSING` (16.3) |

---

## 2. TỔNG KẾT TỶ LỆ TRUNG THỰC CỦA TÀI LIỆU
- **Tuyên bố Đúng hoàn toàn (True Claims)**: 65% (Kiến trúc CSDL, Auth, Điều phối 7 Keys, Snapshot bất biến, Barem lũy tiến, KaTeX an toàn, CSV export).
- **Tuyên bố Lỗi thời hoặc Chưa cập nhật (Doc-Stale)**: 20% (`npm test`, số lượng route, trích dẫn pháp lý, keepDays).
- **Tuyên bố Sai lệch Thực tế (Claim-Discrepancy / Bug)**: 15% (Mất hình khi xuất Word, Route cũ làm rò rỉ đề thi, Thiếu CI).
