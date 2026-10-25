# GEMINI status
task_id: GEMINI-NEXT
assignment_generation: 12
state: WAITING_REVIEW
updated_at_utc: 2026-10-25T12:20:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-T1: COMPLETED
  GEM-T2: COMPLETED
  GEM-T3: COMPLETED
  GEM-T4: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-NEXT (Generation 12) gồm 4 việc GEM-T1 đến GEM-T4 theo chỉ đạo của Claude tại tin nhắn giao việc ngày 25/10/2026 (claude-gemini-20261025T170000Z-7d3f9a52-1c84-4e06-b5a9-8f2e4c6d0b13.md).
  - Quán triệt định hướng phạm vi dự án của Chủ dự án: ExamCraft là dự án CÁ NHÂN, dùng riêng hoặc trong nhóm nhỏ nội bộ do chủ dự án kiểm soát; không tuyển người ngoài, không phát hành rộng rãi, không kinh doanh.
  - Tuân thủ quy tắc trích dẫn kiểm thử nghiêm ngặt: Rà soát toàn bộ các tài liệu báo cáo bằng thuật toán check-test-citations, xác nhận 48 ca test trích dẫn khớp 100% nguyên văn trong tests/ và tests_pilot/, 0 cụm từ vi phạm tiêu chuẩn trích dẫn.
  - Hoàn thành GEM-T1 (P0): Biên soạn `qa/ai-review/GEMINI_CV_GAPS.md` đối chiếu chi tiết dòng tiêu chí Đạt khi của 11 CV chưa đóng (CV-023, 024, 026, 027, 042, 043, 044, 054, 056, 058, 061) với 48 ca test thực tế có thật trong tests/ và tests_pilot/, chỉ ra các khoảng trống còn thiếu: mô hình hình học, âm thanh listening, tái lập seed đảo câu, kiểm tra trực quan ngắt trang trên Word thật.
  - Hoàn thành GEM-T2 (P0): Biên soạn `qa/ai-review/GEMINI_IMPORT_CASES.md` gồm 28 ca thử nghiệm nhập đề thi từ văn bản thô bao quát đầy đủ mọi thói quen gõ của giáo viên Việt Nam ("Câu 1.", "Câu 1:", "1)", "A.", "A)", "(A)", đáp án cuối, bảng đáp án, đúng/sai a-d, công thức $...$ và \(...\), ngữ liệu chung, khoảng trắng/tab thừa). Phân loại rõ ràng 20 ca CHẮC và 8 ca NGHI để kỹ sư đối soát.
  - Hoàn thành GEM-T3 (P1): Biên soạn `docs/huong-dan/THE_KIEM_IN.md` thẻ kiểm tra bản in đề thi A4 và xuất PDF thực tế phục vụ Chủ dự án tự in đề 60 câu cuối đợt (quy trình in, lưu PDF, tắt header/footer, bảng 8 tiêu chí kiểm tra trực quan không xé câu, ngữ liệu in 1 lần, bảo mật đáp án, ẩn thanh web). Nhãn nút khớp nguyên văn giao diện: `In A4`, `In / PDF`, `Đề thi in ấn`, `Song song`, `Bảng đáp án & Barem`.
  - Hoàn thành GEM-T4 (P2): Biên soạn `qa/ai-review/GEMINI_SCOPE_WORDING.md` rà soát 4 tài liệu (`docs/phoi-hop-ai/04_MOC_PILOT.md`, `docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md`, `docs/huong-dan/PHIEU_PHAN_HOI_PILOT.md`, `docs/huong-dan/THE_KIEM_TAY_PILOT.md`), chỉ ra các cụm từ còn mang sắc thái phát hành phần mềm thương mại hoặc tuyển dụng bên ngoài và đề xuất phương án câu chữ thay thế chuẩn phạm vi cá nhân cho Chủ dự án duyệt (không sửa tệp gốc).
Đang làm:
  - Hoàn tất toàn bộ 4/4 mục của Generation 12.
Tiếp theo:
  - Báo cáo Người chỉ đạo Claude nghiệm thu Generation 12.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã nguồn src/, tests/, prisma/, không sửa checklist 03, hồ sơ 02, ASSIGNMENTS hay BATCH_REVIEWS. Không đưa số test vào tài liệu.
Tệp giao trong batch Generation 12:
  - qa/ai-review/GEMINI_CV_GAPS.md (GEM-T1)
  - qa/ai-review/GEMINI_IMPORT_CASES.md (GEM-T2)
  - docs/huong-dan/THE_KIEM_IN.md (GEM-T3)
  - qa/ai-review/GEMINI_SCOPE_WORDING.md (GEM-T4)
Chặn việc: Không. Sẵn sàng chờ Người chỉ đạo Claude review nghiệm thu.
