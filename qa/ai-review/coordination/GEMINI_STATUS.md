# GEMINI status
task_id: GEMINI-NEXT
assignment_generation: 10
state: WAITING_REVIEW
updated_at_utc: 2026-10-25T10:45:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-R1: COMPLETED
  GEM-R2: COMPLETED
  GEM-R3: COMPLETED
  GEM-R4: COMPLETED
  GEM-R5: COMPLETED
  GEM-R6: COMPLETED
  GEM-R7: COMPLETED
  GEM-R8: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-NEXT (Generation 10) gồm 8 việc GEM-R1 đến GEM-R8 theo chỉ đạo của Claude tại tin nhắn giao việc ngày 25/10/2026 (claude-gemini-20261025T133000Z-6b1e9d27-48fa-4c03-b5a7-1e2c9f0d8a64.md).
  - Tuân thủ quy tắc trích dẫn kiểm thử nghiêm ngặt: Kiểm tra toàn bộ các tài liệu báo cáo bằng thuật toán của check-test-citations, xác nhận 0 cụm từ vi phạm tiêu chuẩn trích dẫn.
  - Hoàn thành GEM-R1 (P0): Sửa đổi `docs/huong-dan/HUONG_DAN_HOC_SINH_MOBILE.md` đảm bảo 100% nhãn nút bấm và ô nhập liệu khớp nguyên văn mã nguồn giao diện học sinh làm bài `src/app/a/[publicId]/page.tsx` (kiểm tra 0 nhãn bị thiếu).
  - Hoàn thành GEM-R2 (P0): Mở rộng toàn bộ 6 tệp đề thi mẫu trong `qa/ai-review/fixtures/da-mon/` từ 3-4 câu lên 10 câu/đề, tối thiểu 6-7 dạng câu hỏi mỗi đề, tệp chuẩn UTF-8 không BOM (byte đầu 0x7B), ID câu hỏi duy nhất, khóa đáp án tự chấm khớp 100% bài kiểm tra `tests/fixture_da_mon.test.ts`. Cập nhật tài liệu `qa/ai-review/fixtures/da-mon/README.md`.
  - Hoàn thành GEM-R3 (P1): Biên soạn `qa/ai-review/GEMINI_UI_TEXT_AUDIT.md` rà soát văn bản giao diện và các điểm có nguy cơ tràn nội dung trên màn hình hẹp 375px (15 phát hiện cụ thể tại A4Preview, ShareModal, TeacherDashboard và các trang giao bài).
  - Hoàn thành GEM-R4 (P1): Biên soạn `qa/ai-review/GEMINI_REGRADE_CASES.md` gồm 20 tình huống kiểm thử chuyên sâu cho tính năng sửa đáp án và chấm lại (regrade), tính toán tay chính xác từng con số điểm số trước và sau của 4 học sinh, mã HTTP và xung đột CAS (0 lỗi trích dẫn).
  - Hoàn thành GEM-R5 (P1): Biên soạn `docs/phoi-hop-ai/05_TUYEN_GIAO_VIEN_VA_NGUOI_DUYET.md` kế hoạch tuyển giáo viên 6 môn và chuyên gia thẩm định, 3 mẫu tin mời (email, Zalo, BGH trường), phiếu khảo sát 10 câu hỏi sau thử nghiệm, checklist rà soát cho từng môn (0 lỗi trích dẫn).
  - Hoàn thành GEM-R6 (P1): Biên soạn `qa/ai-review/GEMINI_DOC_AUDIT.md` rà soát toàn diện cây tài liệu `docs/` và `qa/`, phân loại GIỮ / CHUYỂN_LỊCH_SỬ / GỘP, giải quyết dứt điểm các thư mục phân mảnh mới tạo (0 lỗi trích dẫn).
  - Hoàn thành GEM-R7 (P2): Biên soạn `qa/rebuild-2026-10-25/DRIVE_DESIGN_DRAFT.md` bản thiết kế sơ bộ tính năng sao lưu Google Drive, cấu trúc gói JSON bundle, phạm vi OAuth tối thiểu drive.file, rủi ro token và luồng xuất tệp cục bộ offline (0 lỗi trích dẫn).
  - Hoàn thành GEM-R8 (P2): Biên soạn `qa/ai-review/GEMINI_QUESTIONS_FOR_OWNER.md` bộ 58 câu hỏi 1 dòng ngắn tương ứng 58 CV chưa tích trong checklist 03 với lựa chọn A/B và khuyến nghị mặc định, tách riêng 8 CV thuộc nhóm Chờ cho phép gọi AI thật (0 lỗi trích dẫn).
Đang làm:
  - Hoàn tất toàn bộ 8/8 mục của Generation 10.
Tiếp theo:
  - Báo cáo Người chỉ đạo Claude nghiệm thu Generation 10 tại BATCH_REVIEWS.json.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã nguồn src/, tests/ (ngoài fixture), prisma/, không sửa checklist 03, hồ sơ 02, ASSIGNMENTS hay BATCH_REVIEWS. Không đưa số test vào tài liệu.
Tệp giao trong batch Generation 10:
  - docs/huong-dan/HUONG_DAN_HOC_SINH_MOBILE.md (GEM-R1)
  - qa/ai-review/fixtures/da-mon/ngu-van-7.json (GEM-R2)
  - qa/ai-review/fixtures/da-mon/tieng-anh-8.json (GEM-R2)
  - qa/ai-review/fixtures/da-mon/khtn-6.json (GEM-R2)
  - qa/ai-review/fixtures/da-mon/lich-su-dia-ly-7.json (GEM-R2)
  - qa/ai-review/fixtures/da-mon/tin-hoc-8.json (GEM-R2)
  - qa/ai-review/fixtures/da-mon/toan-9.json (GEM-R2)
  - qa/ai-review/fixtures/da-mon/README.md (GEM-R2)
  - qa/ai-review/GEMINI_UI_TEXT_AUDIT.md (GEM-R3)
  - qa/ai-review/GEMINI_REGRADE_CASES.md (GEM-R4)
  - docs/phoi-hop-ai/05_TUYEN_GIAO_VIEN_VA_NGUOI_DUYET.md (GEM-R5)
  - qa/ai-review/GEMINI_DOC_AUDIT.md (GEM-R6)
  - qa/rebuild-2026-10-25/DRIVE_DESIGN_DRAFT.md (GEM-R7)
  - qa/ai-review/GEMINI_QUESTIONS_FOR_OWNER.md (GEM-R8)
Chặn việc: Không. Sẵn sàng chờ Người chỉ đạo Claude review nghiệm thu.
