# GEMINI status
task_id: GEMINI-NEXT
assignment_generation: 11
state: WAITING_REVIEW
updated_at_utc: 2026-10-25T11:20:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-S1: COMPLETED
  GEM-S2: COMPLETED
  GEM-S3: COMPLETED
  GEM-S4: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-NEXT (Generation 11) gồm 4 việc GEM-S1 đến GEM-S4 theo chỉ đạo của Claude tại tin nhắn giao việc ngày 25/10/2026 (claude-gemini-20261025T150000Z-4a8c2f61-9e17-4b35-a0d6-3c5e7b1f9d82.md).
  - Tuân thủ quy tắc trích dẫn kiểm thử nghiêm ngặt: Rà soát toàn bộ các tài liệu báo cáo bằng thuật toán check-test-citations, xác nhận 0 cụm từ vi phạm tiêu chuẩn trích dẫn.
  - Hoàn thành GEM-S1 (P0): Biên soạn hồ sơ mạch kiến thức và yêu cầu cần đạt GDPT 2018 (TT 32/2018/TT-BGDĐT) theo định dạng chuẩn PILOT-TOAN-6 cho 2 môn:
    * `docs/chuong-trinh-2018/NGU_VAN_7.md`: Học kỳ I Ngữ văn 7 (5 bài, thể loại truyện ngắn, thơ 4-5 chữ, tùy bút, văn bản thông tin, tiếng Việt; trạng thái CHO_DUYET, 0 lỗi trích dẫn).
    * `docs/chuong-trinh-2018/TIENG_ANH_8.md`: Học kỳ I Tiếng Anh 8 (6 Unit Global Success, ngữ âm, ngữ pháp, cloze-test, kỹ năng viết; trạng thái CHO_DUYET, 0 lỗi trích dẫn).
  - Hoàn thành GEM-S2 (P1): Bổ sung vào `docs/huong-dan/THE_KIEM_TAY_PILOT_2.md` thẻ kiểm thử THẺ F17 về mở tệp Word thực tế và đối chiếu trực quan 10 dạng công thức toán học chuyên sâu (phân số lồng nhau, căn bậc ba, số mũ, chỉ số dưới, tổng Sigma, giới hạn, tích phân, hàm lượng giác, ký hiệu tập hợp, hệ phương trình) với mô tả hình dạng đúng mong đợi.
  - Hoàn thành GEM-S3 (P1): Biên soạn `docs/huong-dan/PHIEU_GHI_LOI.md` mẫu phiếu ghi nhận sự cố dành cho giáo viên và giám thị phòng thi kèm 5 ví dụ thực tế đã điền sẵn cho các lỗi có thật đã gặp trong dự án (form câu biến mất, lỗi 503 khi nộp đồng loạt, nút đúng/sai nhỏ trên mobile, công thức Word hiện mã thô, link chia sẻ khóa phiên bản).
  - Hoàn thành GEM-S4 (P2): Biên soạn `docs/huong-dan/BANG_THUAT_NGU_GIAO_DIEN.md` bảng đề xuất chuẩn hóa 12 thuật ngữ giao diện cốt lõi (Kho đề của tôi, Tải file Word, Tạo bản sao, Giao bài thi, Số lượt làm bài, Bản nháp tự lưu trên máy, Sửa đáp án và chấm lại, Chia sẻ đề thi, In đề thi A4, Đăng nhập, Bảng xếp hạng lớp, Barem chấm điểm) kèm danh sách vị trí đang dùng khác nhau và cảnh báo kỹ thuật cho nút Đăng nhập hệ thống.
Đang làm:
  - Hoàn tất toàn bộ 4/4 mục của Generation 11.
Tiếp theo:
  - Báo cáo Người chỉ đạo Claude nghiệm thu Generation 11.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã nguồn src/, tests/ (ngoài fixture), prisma/, không sửa checklist 03, hồ sơ 02, ASSIGNMENTS hay BATCH_REVIEWS. Không đưa số test vào tài liệu.
Tệp giao trong batch Generation 11:
  - docs/chuong-trinh-2018/NGU_VAN_7.md (GEM-S1)
  - docs/chuong-trinh-2018/TIENG_ANH_8.md (GEM-S1)
  - docs/huong-dan/THE_KIEM_TAY_PILOT_2.md (GEM-S2, bổ sung THẺ F17)
  - docs/huong-dan/PHIEU_GHI_LOI.md (GEM-S3)
  - docs/huong-dan/BANG_THUAT_NGU_GIAO_DIEN.md (GEM-S4)
Chặn việc: Không. Sẵn sàng chờ Người chỉ đạo Claude review nghiệm thu.
