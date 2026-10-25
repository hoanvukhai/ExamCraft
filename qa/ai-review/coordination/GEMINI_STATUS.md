# GEMINI status
task_id: GEMINI-PILOT-PREP
assignment_generation: 8
state: WAITING_REVIEW
updated_at_utc: 2026-10-25T05:40:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-P9: COMPLETED
  GEM-P10: COMPLETED
  GEM-P11: COMPLETED
  GEM-P12: COMPLETED
  GEM-P5: COMPLETED
  GEM-P13: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-PILOT-PREP (Generation 8) theo chỉ đạo của Claude tại tin nhắn `claude-gemini-20261025T090000Z-7b3e1d52-c4a8-4f60-9a1e-3d5c8b2f7e04.md` và `ASSIGNMENTS.json`.
  - Kiểm tra tệp `tests/fixtures/pilot/toan6-bay-dang.json`: Xác nhận sạch 100%, không có BOM UTF-8 (bắt đầu bằng 0x7B `{`).
  - Hoàn thành GEM-P13 (P0): Bàn giao báo cáo kiểm toán tiêu chí "Đạt khi" tại `qa/ai-review/GEMINI_CV_CRITERIA_AUDIT.md` cho 11 CV:
    * CV-010 (Nháp offline & version): THIẾU (thiếu cold-start hoàn toàn offline và 2 engine sửa đồng thời cùng lúc).
    * CV-011 (Quyền đối tượng & liên kết): THIẾU (thiếu ca browser chuyển tài khoản trực tiếp trên cùng một tab để kiểm tra dọn sạch nháp client).
    * CV-047 (Ma trận quyền chia sẻ): THIẾU (quyền comment và publish chưa triển khai schema DB).
    * CV-048 (Link xem & phiên bản chia sẻ): THIẾU (chưa có bảng PublicationSnapshot riêng; hiện bảo vệ bằng sourceVersion).
    * CV-049 (Cùng sửa đồng thời): THIẾU (hoàn toàn chưa có tính năng và ca test cho undo từng người).
    * CV-050 (Mất mạng & thu hồi quyền đang mở): ĐỦ trong phạm vi pilot (có F9 Chrome/Edge, F4 và HTTP).
    * CV-055 (Nhận diện & phiên lượt làm): ĐỦ (phủ kín FREE_NAME, lớp, mã vào bài, PIN, cookie HMAC chống xem chéo).
    * CV-057 (Lưu nháp & resume thật): ĐỦ trong phạm vi pilot (có F6, unit journal và timeout mạng; giới hạn đổi máy vật lý).
    * CV-059 (Chấm server & nộp lặp an toàn): ĐỦ (phân biệt 0/blank/false, row-lock submit, 3 chính sách IMMEDIATE/AFTER_CLOSE/NEVER).
    * CV-060 (Chấm tay & điểm chốt): THIẾU (thiếu tự động regrade hàng loạt sau khi sửa đáp án; C05 tạm dừng).
    * CV-062 (Hồi quy link & toàn luồng HS): ĐỦ (phủ khách, GV khác, link cũ, đã đóng, đã nộp, AFTER_CLOSE/NEVER, payload sạch 100%).
Đang làm:
  - Hoàn thành GEM-P13 (Generation 8).
Tiếp theo:
  - Chờ Người chỉ đạo Claude thẩm định và nghiệm thu báo cáo GEM-P13 tại BATCH_REVIEWS.json.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã, checklist 03, hồ sơ 02, ASSIGNMENTS hay BATCH_REVIEWS.
Tệp giao trong batch:
  - tests/fixtures/pilot/toan6-bay-dang.json (GEM-P9) [ĐÃ KIỂM TRA KHÔNG BOM]
  - tests/fixtures/pilot/mon2-ngu-lieu.json (GEM-P9) [ĐÃ DUYỆT GEN 7]
  - tests/fixtures/pilot/README.md (GEM-P9) [ĐÃ DUYỆT GEN 7]
  - docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md (GEM-P10) [ĐÃ DUYỆT GEN 7]
  - docs/huong-dan/THE_KIEM_TAY_PILOT.md (GEM-P10) [ĐÃ DUYỆT GEN 7]
  - docs/huong-dan/PHIEU_PHAN_HOI_PILOT.md (GEM-P11) [ĐÃ DUYỆT GEN 7]
  - docs/nghien-cuu/goi/PILOT-TOAN-6/02_DOI_CHIEU_NGUON.md (GEM-P12) [ĐÃ DUYỆT GEN 7]
  - docs/nghien-cuu/goi/PILOT-MON-2/02_DOI_CHIEU_NGUON.md (GEM-P12) [ĐÃ DUYỆT GEN 7]
  - qa/ai-review/GEMINI_ACCOUNT_CALLERS.md (GEM-P5) [ĐÃ DUYỆT GEN 7]
  - qa/ai-review/GEMINI_CV_CRITERIA_AUDIT.md (GEM-P13) [ĐÃ BÀN GIAO]
Chặn việc: Không. Chờ Người chỉ đạo Claude review.
