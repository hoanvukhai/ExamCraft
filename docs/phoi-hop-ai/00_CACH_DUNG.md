# Phối hợp AI — dán một lần cho mỗi đợt

Từ 24/10/2026: **Claude chỉ đạo**, Codex thực thi, Gemini chuẩn bị báo cáo/nội dung. Kế hoạch và thứ tự: [04_MOC_PILOT](04_MOC_PILOT.md). Quy ước: [02](02_QUY_UOC_PHOI_HOP.md), [03](03_HANG_DOI_LIEN_MACH.md).

1. Mở chat Codex đang dùng, dán toàn bộ [prompt Codex](02_DAN_CHO_CODEX.txt). Hết lượt thì dùng chat mới, cùng prompt; nó đọc checkpoint rồi làm tiếp, không làm lại từ đầu.
2. Mở chat Gemini đang dùng, dán toàn bộ [prompt Gemini](01_DAN_CHO_GEMINI.txt).
3. Claude (phiên này) đọc status/tin của hai bên khi bạn nhắn "xem tiến độ AI", duyệt bàn giao, cập nhật ASSIGNMENTS và hồ sơ. Bạn không cần chuyển từng báo cáo.

| AI | Việc hiện tại (generation) | Cách làm |
|---|---|---|
| Claude | Người chỉ đạo; không còn worker batch (batch 10 đã đóng) | Giữ ASSIGNMENTS/BATCH_REVIEWS, duyệt theo mã và bằng chứng, cập nhật hồ sơ 02/03 |
| Codex | CODEX-P0-COMMIT → CODEX-P1-E2E → CODEX-P2-GAPS (gen 13) | Checkout chính; commit nhỏ; build/DB/server tuần tự; không thêm bảng khôi phục nháp mới |
| Gemini | GEM-P1…P5 (gen 6): thẻ kiểm tay, hướng dẫn giáo viên, gói Toán 6, mô tả tuyển giáo viên/người duyệt | Chỉ đọc nguồn và ghi báo cáo được giao |

Phạm vi tệp từng việc nằm ở [ASSIGNMENTS.json](../../qa/ai-review/coordination/ASSIGNMENTS.json). Chưa có status đúng generation thì chỉ là đã giao, không phải đang chạy. Tệp chung không đánh thức AI đã dừng: hết lượt thì AI ghi NEEDS_RESUME và bạn dán lại prompt.

Không chạy chung build/DB/server/AI thật; không push/reset/clean; không chia sẻ .env/key/cookie. Hàng đợi không thay checklist 03 và hồ sơ 02.
