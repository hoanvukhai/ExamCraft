# GEMINI status
task_id: GEMINI-NEXT
assignment_generation: 14
state: WAITING_REVIEW
updated_at_utc: 2026-10-25T13:10:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-V1: COMPLETED
  GEM-V2: COMPLETED
  GEM-V3: COMPLETED
  GEM-V4: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-NEXT (Generation 14) gồm 4 việc GEM-V1 đến GEM-V4 theo chỉ đạo của Claude tại tin nhắn giao việc ngày 25/10/2026 (claude-gemini-20261025T210000Z-8b3d6f41-2c97-4e50-9a1b-7f4e0c5d2a69.md).
  - Hoàn thành GEM-V1 (P0): Biên soạn `docs/huong-dan/KICH_BAN_KIEM_TAY_TOAN_DU_AN.md` kịch bản kiểm thử thủ công toàn bộ dự án ExamCraft từ đầu đến cuối gồm 18 mục tuần tự (V1-1 đến V1-18), tích hợp và kế thừa đầy đủ từ các thẻ kiểm riêng lẻ (THE_KIEM_TAY_PILOT, THE_KIEM_TAY_PILOT_2, THE_KIEM_IN, THE_KIEM_TAY_GIAO_BAI_VA_WORD). Mỗi mục có thao tác chi tiết, kết quả mong đợi, ô kiểm ĐẠT/KHÔNG ĐẠT/GHI CHÚ, bảng tổng hợp một dòng và cú pháp tin nhắn phản hồi nhanh cho Claude. Toàn bộ 48/48 nhãn nút và tiêu đề giao diện khớp 100% mã nguồn `src/` (0 lỗi nhãn).
  - Hoàn thành GEM-V2 (P0): Biên soạn `docs/huong-dan/DE_MAU_DE_KIEM_TAY.md` cung cấp 3 bộ đề thi hoàn chỉnh sẵn sàng sao chép: (1) Đề văn bản thô đa dạng (Ngữ liệu đứng đầu, trắc nghiệm, đúng-sai, trả lời ngắn, bảng đáp án cuối); (2) Đề mã nguồn LaTeX EX_Test chuẩn; (3) Đề Toán công thức toán học cao cấp để kiểm tra xuất Word và mở bằng Microsoft Word thật. Kèm kết quả phân rã mong đợi chi tiết cho từng đề. Kiểm tra trích dẫn đạt 0 lỗi.
  - Hoàn thành GEM-V3 (P1): Biên soạn `docs/huong-dan/NHUNG_DIEU_CHUA_CO.md` rà soát và tổng hợp 10 điểm giới hạn thiết kế / tính năng hệ thống chưa hỗ trợ hoặc cố ý chưa đưa vào phạm vi nội bộ (lấy từ các dòng Giới hạn của checklist 03). Trình bày rõ ràng theo 3 cột: Việc gì, Cách làm tạm thời, Vì sao để Chủ dự án nắm rõ trước khi kiểm thử, tránh nhầm với lỗi phần mềm. Kiểm tra nhãn giao diện và trích dẫn đạt 0 lỗi.
  - Hoàn thành GEM-V4 (P2): Tạo mới fixture đề mẫu Tiểu học lớp 3 `qa/ai-review/fixtures/da-mon/tieu-hoc-3.json` gồm 10 câu (5 câu Toán 3 và 5 câu Tiếng Việt 3), câu ngắn gọn, số nhỏ trong phạm vi 1000, có hình vẽ mô tả bằng chữ (đồng hồ), gắn với bài thơ Mùa thu của em, mã câu duy nhất, UTF-8 chuẩn không BOM (byte đầu 0x7B), tự chấm điểm chính xác 100% qua bộ kiểm tra `tests/fixture_da_mon.test.ts`. Cập nhật tài liệu `qa/ai-review/fixtures/da-mon/README.md` lên 7 tệp.
Đang làm:
  - Hoàn tất toàn bộ 4/4 mục của Generation 14.
Tiếp theo:
  - Báo cáo Người chỉ đạo Claude nghiệm thu Generation 14.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã nguồn src/, tests/, prisma/, không sửa checklist 03, hồ sơ 02, ASSIGNMENTS hay BATCH_REVIEWS. Không đưa số test vào tài liệu.
Tệp giao trong batch Generation 14:
  - docs/huong-dan/KICH_BAN_KIEM_TAY_TOAN_DU_AN.md (GEM-V1)
  - docs/huong-dan/DE_MAU_DE_KIEM_TAY.md (GEM-V2)
  - docs/huong-dan/NHUNG_DIEU_CHUA_CO.md (GEM-V3)
  - qa/ai-review/fixtures/da-mon/tieu-hoc-3.json (GEM-V4)
  - qa/ai-review/fixtures/da-mon/README.md (GEM-V4)
Chặn việc: Không. Sẵn sàng hỗ trợ Chủ dự án tự kiểm tay toàn bộ dự án.
