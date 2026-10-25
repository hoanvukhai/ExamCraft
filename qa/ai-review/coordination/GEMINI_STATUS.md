# GEMINI status
task_id: GEMINI-NEXT
assignment_generation: 9
state: WAITING_REVIEW
updated_at_utc: 2026-10-25T08:20:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-Q1: COMPLETED
  GEM-Q2: COMPLETED
  GEM-Q3: COMPLETED
  GEM-Q4: COMPLETED
  GEM-Q5: COMPLETED
  GEM-Q6: COMPLETED
  GEM-Q7: COMPLETED
  GEM-Q8: COMPLETED
  GEM-Q9: COMPLETED
  GEM-Q10: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-NEXT (Generation 9) gồm 10 việc GEM-Q1 đến GEM-Q10 theo chỉ đạo của Claude tại tin nhắn giao việc ngày 25/10/2026.
  - Tuân thủ quy tắc trích dẫn kiểm thử nghiêm ngặt: Kiểm tra toàn bộ 10 báo cáo bằng biểu thức chính quy của `scripts/check-test-citations.cjs`, xác nhận 0 cụm từ vi phạm.
  - Hoàn thành GEM-Q1 (P0): Biên soạn `docs/huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md` cập nhật đầy đủ nhãn nút thật và tính năng mới ngày 25/10 (sửa đáp án & regrade, khóa link chia sẻ version lock, nháp offline, đổi tài khoản trên cùng máy, tùy chọn phòng thi nâng cao, xử lý sự cố).
  - Hoàn thành GEM-Q2 (P0): Biên soạn `docs/huong-dan/THE_KIEM_TAY_PILOT_2.md` gồm 7 thẻ kiểm thử thủ công F10–F16 (đổi tài khoản, mất mạng, regrade, version lock, mở Word thật, ngắt trang in A4, hiển thị điện thoại 375px).
  - Hoàn thành GEM-Q3 (P0): Tạo bộ 6 fixture đề thi JSON đa môn hợp lệ UTF-8 không BOM (byte đầu 0x7B) tại `qa/ai-review/fixtures/da-mon/` gồm Văn 7, Anh 8, KHTN 6, Sử Địa 7, Tin 8, Toán 9 kèm 3 trường hợp biên (ngữ liệu 528 từ, Unicode NFD, công thức 210 ký tự) và tệp `README.md`.
  - Hoàn thành GEM-Q4 (P1): Biên soạn `docs/bieu-mau/PHIEU_GOP_Y_MA_TRAN_DE.md` mẫu phiếu in được phục vụ sinh hoạt chuyên môn góp ý ma trận và đặc tả đề.
  - Hoàn thành GEM-Q5 (P1): Biên soạn `docs/su-co/30_LOI_XUAT_WORD_VA_CACH_PHONG.md` tổng hợp 30 tình huống sự cố xuất Word thực tế kèm hiện tượng, nguyên nhân kỹ thuật, cách phòng và xử lý nhanh.
  - Hoàn thành GEM-Q6 (P1): Biên soạn `docs/huong-dan/HUONG_DAN_HOC_SINH_MOBILE.md` cẩm nang học sinh THCS thi trên điện thoại di động (xoay màn hình ngang, bảo vệ nháp khi mất mạng, nộp bài, xem điểm).
  - Hoàn thành GEM-Q7 (P1): Biên soạn `docs/chuong-trinh-2018/03_YEU_CAU_CAN_DAT_3_MON_MOI.md` đối chiếu yêu cầu cần đạt Chương trình GDPT 2018 (TT 32/2018/TT-BGDĐT) cho 3 môn mới (Tiếng Anh 8, KHTN 6, Lịch sử & Địa lí 7), đánh giá dạng thức đáp ứng của ExamCraft (Trạng thái: CHỜ_CHỦ_DỰ_ÁN_DUYỆT).
  - Hoàn thành GEM-Q8 (P2): Biên soạn `qa/ai-review/SO_SANH_5_DICH_VU_AI.md` so sánh 5 dịch vụ AI (Gemini, OpenAI, Claude, DeepSeek, Groq); đề xuất mô hình mặc định (Gemini 2.5 Flash) và mô hình dự phòng (Claude 3.5 Sonnet / GPT-4o-mini).
  - Hoàn thành GEM-Q9 (P2): Biên soạn `docs/dien-tap/KICH_BAN_DIEN_TAP_SU_CO.md` kịch bản diễn tập 5 sự cố khẩn cấp từng phút từ phút 0 đến phút 30 (mất điện, nộp bài đồng loạt, lộ link đề, nhập nhầm đáp án, máy in hỏng).
  - Hoàn thành GEM-Q10 (P2): Biên soạn `qa/ai-review/TONG_KET_CHUAN_BI_PILOT_GEMINI.md` tổng kết toàn diện đợt chuẩn bị pilot qua các thế hệ, tự đánh giá mức độ sẵn sàng và kiến nghị 3 việc tiếp theo cho Codex và Claude.
Đang làm:
  - Hoàn tất toàn bộ 10/10 mục của Generation 9.
Tiếp theo:
  - Báo cáo Người chỉ đạo Claude nghiệm thu Generation 9 tại BATCH_REVIEWS.json.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã nguồn src/, tests/, prisma/, không sửa checklist 03, hồ sơ 02, ASSIGNMENTS hay BATCH_REVIEWS. Không đưa số test vào tài liệu.
Tệp giao trong batch Generation 9:
  - docs/huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md (GEM-Q1)
  - docs/huong-dan/THE_KIEM_TAY_PILOT_2.md (GEM-Q2)
  - qa/ai-review/fixtures/da-mon/ngu-van-7.json (GEM-Q3)
  - qa/ai-review/fixtures/da-mon/tieng-anh-8.json (GEM-Q3)
  - qa/ai-review/fixtures/da-mon/khtn-6.json (GEM-Q3)
  - qa/ai-review/fixtures/da-mon/lich-su-dia-ly-7.json (GEM-Q3)
  - qa/ai-review/fixtures/da-mon/tin-hoc-8.json (GEM-Q3)
  - qa/ai-review/fixtures/da-mon/toan-9.json (GEM-Q3)
  - qa/ai-review/fixtures/da-mon/README.md (GEM-Q3)
  - docs/bieu-mau/PHIEU_GOP_Y_MA_TRAN_DE.md (GEM-Q4)
  - docs/su-co/30_LOI_XUAT_WORD_VA_CACH_PHONG.md (GEM-Q5)
  - docs/huong-dan/HUONG_DAN_HOC_SINH_MOBILE.md (GEM-Q6)
  - docs/chuong-trinh-2018/03_YEU_CAU_CAN_DAT_3_MON_MOI.md (GEM-Q7)
  - qa/ai-review/SO_SANH_5_DICH_VU_AI.md (GEM-Q8)
  - docs/dien-tap/KICH_BAN_DIEN_TAP_SU_CO.md (GEM-Q9)
  - qa/ai-review/TONG_KET_CHUAN_BI_PILOT_GEMINI.md (GEM-Q10)
Chặn việc: Không. Sẵn sàng chờ Người chỉ đạo Claude review nghiệm thu.
