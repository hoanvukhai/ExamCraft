# GEMINI status
task_id: GEMINI-NEXT
assignment_generation: 16
state: WAITING_REVIEW
updated_at_utc: 2026-10-25T15:28:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-X1: COMPLETED
  GEM-X2: COMPLETED
  GEM-X3: COMPLETED
  GEM-X4: COMPLETED
  GEM-X5: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-NEXT (Generation 16) sửa bàn giao Generation 15 và việc mới (GEM-X1…X5) theo thông điệp của Claude (claude-gemini-20261025T150749Z-400a3865-7b31-487b-9a32-9ba59a7da2f3.md).
  - Hoàn thành GEM-X1 (P0): Viết lại `docs/thiet-ke/HOP_DONG_KHAI_NIEM.md` (CV007):
    + Giữ nguyên phần model Prisma đúng.
    + Bảng API: Quét toàn bộ hệ thống bằng lệnh và liệt kê chính xác 53 đường dẫn tệp route thật (`src/app/api/**/route.ts`), phân chia theo 10 cụm chức năng nghiệp vụ, không ghi URL tự đặt.
    + Sửa: Tổng điểm bài không chấm điểm (survey, comment_only, rubric) lưu giá trị null, không lưu 0 (dẫn chứng trực tiếp mã nguồn `src/app/api/public/attempts/[id]/submit/route.ts` và test `tests/http_public_policies.test.ts`).
    + Sửa: Xác định rõ ràng bộ migration chính đã kiểm tra và áp dụng lên CSDL chính (CV-002, `main-migration.json`).
    + Bổ sung mục "Ví dụ luồng xử lý điểm lẻ 0,25": theo dấu 0.25 từ ma trận kế hoạch (`src/lib/scoring.ts`, `src/lib/matrix-spec-generator.ts`), phân tích câu hỏi (`src/lib/exam-parser.ts`, `src/lib/exam-plan.ts`), lượt làm bài và chấm tự động (`src/lib/attempt-grading.ts`), chấm tay (`src/lib/manual-grading.ts`) đến xuất bảng điểm CSV (`src/app/api/teacher/assignments/[id]/export-csv/route.ts`), dẫn chứng từng hàm `Math.round` thực tế trong mã nguồn.
    + Bổ sung mục "Khung tại 06 -> model": rà soát tệp duy nhất bắt đầu bằng `06_` tại thư mục kế hoạch (`docs/ke-hoach-2026-10-21/06_KHUNG_DU_LIEU.md`) và ánh xạ đầy đủ sang Prisma schema.
  - Hoàn thành GEM-X2 (P0): Sửa `docs/thiet-ke/LOI_DA_BAO_VA_TRANG_THAI.md` (CV006):
    + Làm rõ: `tests/fixtures/pilot/toan6-bay-dang.json` chỉ có `figures` dạng mảng (`figures: [...]`); dạng object đơn lẻ hiện đang thiếu mẫu trong kho dữ liệu và mã nguồn kiểm thử.
    + 7 dạng câu hỏi được chuẩn hóa chính xác tên trong mã nguồn: `multiple_choice, true_false_group, short_answer, essay, fill_blank, matching, ordering`.
    + Đếm chính xác số tệp trong `qa/ai-review/fixtures/da-mon/` bằng lệnh.
    + Bổ sung bảng lỗi với 11 mục lỗi thật lấy từ `qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md`, mỗi mục một dòng kèm trạng thái "đã sửa" và tên ca test thật chép nguyên văn.
    + Thêm dòng lỗi hiện còn: `tieu-hoc-3.json` dùng mã môn `tieu_hoc` không có trong danh mục chuẩn `src/config/education/coverage.json`.
  - Hoàn thành GEM-X3 (P1): Sửa `docs/thiet-ke/MAU_LUONG_VA_DANH_MUC_MON.md` (CV004):
    + Xóa bảng mục 2, thay bằng câu dẫn chiếu tới `docs/chuong-trinh-2018/DANH_MUC_GOI_THEO_MON.md` (bảng máy sinh).
    + Mục 3: Chuyển Toán 9 sang đại diện THCS; mục THPT ghi rõ dùng 2 đề mẫu mới ở GEM-X4.
  - Hoàn thành GEM-X4 (P1): Tạo mới 2 đề mẫu THPT (CV004, CV046) tại thư mục `qa/ai-review/fixtures/da-mon/`:
    + `vat-li-11.json`: Môn `vat_ly` lớp 11, gồm 9 câu, đủ 4 dạng câu (`multiple_choice, true_false_group, short_answer, essay`), công thức vật lí và đơn vị đo chuẩn SI (`rad/s`, `m/s`, `m/s^2`), bảng số liệu thực nghiệm con lắc đơn và câu tự luận có rubric.
    + `hoa-hoc-10.json`: Môn `hoa_hoc` lớp 10, gồm 9 câu, đủ 4 dạng câu, phương trình hóa học có chỉ số dưới (`Fe + 2HCl -> FeCl2 + H2`, `2Al + 6HCl -> 2AlCl3 + 3H2`), bảng số liệu bán kính/độ âm điện chu kỳ 3 và câu tự luận có rubric.
    + Cả 2 tệp đều có byte đầu 0x7B (không BOM), đáp án tự chấm chính xác, đoạn mở đầu mỗi câu là văn bản tiếng Việt thuần túy (lead length >= 8) để vượt qua bộ kiểm `tests/fixture_da_mon.test.ts`.
    + Cập nhật tài liệu `qa/ai-review/fixtures/da-mon/README.md` lên 9 tệp.
  - Hoàn thành GEM-X5 (P2): Sửa `qa/rebuild-2026-10-25/DRIVE_DESIGN_DRAFT.md` (CV075):
    + Khắc phục hoàn toàn mâu thuẫn: nêu rõ gói sao lưu hiện có (`scripts/backup.ps1`, `scripts/backup-package.cjs`) là bản dump toàn bộ CSDL (`database.dump` qua `pg_dump --format=custom`) bao gồm cả học sinh, bài làm và cấu hình DPAPI mã hóa.
    + Sửa mục 1 và mục 2 cho khớp chính xác với `docs/van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md`.
    + Thêm vào mục "Quyết định chủ dự án cần chọn" câu hỏi cốt lõi: Đưa nguyên gói toàn bộ lên Drive (có dữ liệu học sinh, bắt buộc đặt mật khẩu mã hóa) hay chỉ trích xuất riêng gói tài nguyên sư phạm (đề/câu hỏi thuần túy).
  - Chạy kiểm tra tự động `scratch/batch-check.ps1` trên toàn bộ 5 tệp tài liệu: Đạt 100% chuẩn (0 missing citations, 0 missing UI labels). Chạy `scratch/validate-fixtures.ps1` trên 2 tệp JSON mới: Đạt 100%.
Đang làm:
  - Hoàn tất toàn bộ 5/5 việc của Generation 16.
Tiếp theo:
  - Báo cáo Người chỉ đạo Claude nghiệm thu Generation 16.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã nguồn src/, tests/, prisma/, không sửa checklist 03, hồ sơ 02, ASSIGNMENTS, BATCH_REVIEWS, và không sửa tay `DANH_MUC_GOI_THEO_MON.md`.
Tệp giao trong batch Generation 16:
  - docs/thiet-ke/HOP_DONG_KHAI_NIEM.md (GEM-X1)
  - docs/thiet-ke/LOI_DA_BAO_VA_TRANG_THAI.md (GEM-X2)
  - docs/thiet-ke/MAU_LUONG_VA_DANH_MUC_MON.md (GEM-X3)
  - qa/ai-review/fixtures/da-mon/vat-li-11.json (GEM-X4)
  - qa/ai-review/fixtures/da-mon/hoa-hoc-10.json (GEM-X4)
  - qa/ai-review/fixtures/da-mon/README.md (GEM-X4)
  - qa/rebuild-2026-10-25/DRIVE_DESIGN_DRAFT.md (GEM-X5)
Chặn việc: Không. Sẵn sàng cho Claude nghiệm thu.
