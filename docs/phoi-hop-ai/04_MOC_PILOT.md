# Mốc pilot và kế hoạch chỉ đạo — 24/10/2026

Người chỉ đạo từ 24/10/2026: **Claude** (chủ dự án giao quyền). Tệp này là kế hoạch điều phối, **không thay** [checklist 03](../ke-hoach-2026-10-21/03_CHECKLIST.md): tiêu chí và dấu hoàn thành CV vẫn theo 03. Trạng thái hiện hành: [hồ sơ 02](../ban-giao/02_TRANG_THAI_TIEP_NOI.md).

## 1. Vì sao đổi cách làm
Sau 33 commit chỉ 8/78 CV đóng. Phần lớn công của ngày 24/10 dồn vào bảng khôi phục nháp (chấm, ghi chú, khóa, mẫu, học sinh); kiểm giao diện còn thủ công/CUA hay lỗi; chưa có người thật dùng. Mục tiêu mới: **một luồng hoàn chỉnh, kiểm tự động được, đưa giáo viên thật dùng thử.**

## 2. Mốc pilot (P)
Một giáo viên chính + một đồng nghiệp, chạy **local**, dữ liệu giả hoặc được phép, **không bắt buộc AI** (khóa AI là tùy chọn). Môn thử: Toán 6 (gói minh họa) và một môn khác Toán (Ngữ văn hoặc Tiếng Anh) để không thiết kế lệch.

Luồng phải chạy trơn từ đầu đến cuối (mỗi luồng có kiểm tự động và thẻ kiểm tay):

| Mã | Luồng |
|---|---|
| F1 | Đăng nhập, đổi mật khẩu lần đầu, vào kho đề |
| F2 | Tạo đề, soạn đủ 7 dạng câu (hình/ngữ liệu/điểm 0), đặt tiêu đề/mẫu, lưu, đóng, mở lại đúng nội dung |
| F3 | Chuyển Đề/Đáp án/Song song, trộn mã đề, xuất Word (mở được, đủ câu/hình) và in |
| F4 | Chia sẻ link xem, mời đồng nghiệp xem/sửa, thu hồi; đồng nghiệp sửa và bị chặn đúng khi hết quyền |
| F5 | Giao bài bằng link (có/không lớp), cấu hình thời gian/lượt/đáp án hiện sau |
| F6 | Học sinh làm đủ 7 dạng, lưu nháp, tải lại làm tiếp, nộp; không thấy đáp án trước chính sách |
| F7 | Giáo viên xem bài nộp, chấm tay tự luận, điểm tổng đúng, xuất CSV |
| F8 | Sao lưu và khôi phục thử (đã đạt CV072), runbook chạy được trên máy này |

## 3. Phân tầng CV (đề xuất điều phối, không đổi 03)

**P0 — chặn pilot** (phải đạt "pilot-ready"): 009✔, 010, 011, 012✔, 013✔, 023, 024, 026, 027, 043, 054, 055, 056, 057, 058, 059, 060, 061, 062, 072✔, 073.
**P1 — nên có trước khi mở rộng:** 008✔, 015, 028, 029, 030, 040, 041, 042, 044, 047, 048, 051, 031, 032, 033, 074, 076.
**Hoãn sau pilot:** 004–007, 016–022, 025, 034–039, 045, 046, 049, 050, 052, 053, 063–071, 075, 077, 078 (các CV nội dung đầy đủ theo môn/lớp, AI sinh/kiểm, cộng tác nâng cao, phân tích/memory, tổng nghiệm thu). Không bỏ khỏi phạm vi; chỉ không chặn pilot.

"Pilot-ready" cho một CV P0: (1) có ca HTTP/DB hoặc unit chạy mới; (2) có ca kiểm tự động trên giao diện trong luồng F; (3) giới hạn còn lại ghi trong báo cáo nhóm. **Đề xuất chờ chủ dự án duyệt:** CV tiện ích được ghi "đạt trong phạm vi pilot" khi (1)–(3) xong; CV về quyền, mất dữ liệu, lộ đáp án, sai điểm giữ tiêu chí đầy đủ của 03. Đến khi duyệt, không đóng CV theo cách mới.

## 4. Đóng băng
- **Không thêm** bảng/nhật ký khôi phục nháp mới. Những cái đã mount (chấm, ghi chú AI, khóa, mẫu, học sinh) giữ nguyên, commit, ghi giới hạn; chỉ sửa khi người dùng thật báo mất dữ liệu hoặc test pilot lộ lỗi.
- Claude worker batch 10 (C01–C06) **đóng**: C04/C06 (thiết kế công bố, chấm lại) để sau pilot; C05 không tiếp. Worktree `tmp/ai-claude-*` giữ nguyên, không xóa.
- Gemini batch 5: G03/G05 gộp vào việc mới; G07 gộp vào GEM-P3; G01/G04 hạ ưu tiên (CV011 caller map, làm khi rảnh); G02/G06 đã duyệt; G08 đóng.

## 5. Việc giao (generation 13, chi tiết ở ASSIGNMENTS.json)

**Codex** (giữ mã, build/DB/server; một việc build tại một thời điểm):
- **CODEX-P0-COMMIT:** commit phần đang làm theo nhóm có kiểm, không thêm tính năng; trả cây sạch (trừ `tmp/`). Cập nhật CODEX_STATUS.
- **CODEX-P1-E2E:** dựng bộ kiểm trình duyệt tự động cho F1–F7 (script `npm run test:pilot`), chạy trên server thử cô lập, dữ liệu giả, **dùng Chrome/Edge cài sẵn, không tải trình duyệt**; báo cáo `qa/rebuild-2026-10-24/PILOT_E2E.md`.
- **CODEX-P2-GAPS:** sửa lỗi lộ ra từ bộ kiểm theo thứ tự P0, commit nhỏ, mỗi lần cập nhật dòng "Hiện trạng" của CV và báo cáo nhóm; chưa đóng CV.

**Gemini** (chỉ đọc mã; chỉ ghi tệp được giao):
- **GEM-P1:** thẻ kiểm tay cho F1–F8 bằng tiếng Việt, nhãn nút đúng giao diện thật.
- **GEM-P2:** hướng dẫn giáo viên pilot 1–2 trang (CV076).
- **GEM-P3:** gói chuẩn bị nội dung `PILOT-TOAN-6`: mục lục/yêu cầu cần đạt có nguồn và trang, trạng thái "chờ duyệt"; không nạp vào mã.
- **GEM-P4:** bản mô tả tuyển giáo viên thử và người duyệt chuyên môn cho chủ dự án (không tự liên hệ ai).

**Claude (chỉ đạo):** duyệt từng bàn giao theo mã/bằng chứng, giữ ASSIGNMENTS/BATCH_REVIEWS, cập nhật 02/03 theo báo cáo nhóm, đề xuất bước kế.

## 6. Thứ tự và cổng
1. CODEX-P0-COMMIT (cây sạch) → mới giao tiếp các việc ghi vào mã.
2. Song song: CODEX-P1-E2E và GEM-P1…P4 (không đụng cùng tệp).
3. Cổng A: bộ kiểm chạy được F1–F7 trên DB thử → Codex sửa theo CODEX-P2-GAPS.
4. Cổng B: tất cả P0 "pilot-ready" + thẻ kiểm tay + hướng dẫn → chủ dự án quyết đưa giáo viên thật dùng thử.

## 7. Quy tắc giữ nguyên
Không push/reset/clean; không ghi DB chính; không gọi AI/provider thật khi chưa được duyệt; không chép key/cookie/.env; test ghi chỉ trên DB thử đã kiểm đích; không chạy build cùng lúc với lint/SAFE trên máy ít RAM.
