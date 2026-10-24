# BIÊN BẢN HỌP STANDUP & SƠ KẾT SPRINT 2

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Thời điểm**: 2026-10-18 11:32 UTC+7
- **Chủ trì**: TEST DIRECTOR (DIR)
- **Thành phần**: ROOM, MON, EXP, ING, FE, UX squads.

---

## 1. TIẾN ĐỘ HOÀN THÀNH (ĐÃ XONG)
- **Phòng thi học sinh (`/a/[publicId]`)**: Kiểm chứng thành công server timer, auto-save draft định kỳ vào CSDL, nộp bài idempotent và chấm điểm tự động.
- **Sanitize Snapshot (R5)**: Đã xác minh hàm `sanitizeSnapshotForStudent` bóc tách sạch 100% `correct` và `solution` với cấu trúc chuẩn.
- **Màn hình giám sát giáo viên**: Giám sát phòng thi thời gian thực, Item Analysis (<50%), chấm tay tự luận, xuất CSV với UTF-8 BOM và chống Formula Injection.
- **Xuất Word .docx (EXP)**: Tạo thành công file OpenXML ZIP chứa công thức OMML Math.

---

## 2. CÁC ĐIỂM NGHẼN & PHÁT HIỆN RỦI RO (TRIAGE)
1. **[CRITICAL BUG] R22 - Mất trắng hình vẽ và bảng biến thiên khi xuất Word**: Trong `src/lib/docx-export.ts` không có bất kỳ dòng code nào xử lý `figures[]` hoặc chèn `ImageRun`. Toàn bộ đồ thị Canvas và bảng biến thiên bị mất hoàn toàn trong file Word.
2. **[HIGH WARNING] R5 - Lỗ hổng sanitize khi snapshot dạng lồng**: Nếu snapshot không có `questions` ở tầng ngoài cùng mà lồng trong `sections[].questions`, `sanitizeSnapshotForStudent` trả về raw snapshot chứa cả đáp án.
3. **[MEDIUM WARNING] R18 - Polling 4s liên tục**: Cần cơ chế pause khi tab không active để tránh ngốn connection pool trên serverless.

---

## 3. KẾ HOẠCH BƯỚC VÀO SPRINT 3
- Triển khai kiểm thử phi chức năng, an ninh mạng và phá hoại:
  - **SEC**: Quét lỗ hổng XSS, SSRF, kiểm tra rò rỉ bí mật trong code/git history, rà soát Nghị định 13/2023/NĐ-CP về dữ liệu học sinh.
  - **PERF**: Viết kịch bản thử tải 100 học sinh ảo nộp bài đồng thời, kiểm tra deadlock/race conditions.
  - **PER (Persona 1, 2, 3)**: Kiểm thử đóng vai Cô Lan (GV lớn tuổi), Em Minh (HS muốn gian lận), và Kẻ phá hoại (Hacker).
  - **Mutation Testing (R1)**: Cố ý phá vỡ logic trong bản sao để kiểm tra bộ test có bắt được lỗi không.
