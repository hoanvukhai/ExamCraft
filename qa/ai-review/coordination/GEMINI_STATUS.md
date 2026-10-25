# GEMINI status
task_id: GEMINI-NEXT
assignment_generation: 13
state: WAITING_REVIEW
updated_at_utc: 2026-10-25T12:00:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-U1: COMPLETED
  GEM-U2: COMPLETED
  GEM-U3: COMPLETED
  GEM-U4: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-NEXT (Generation 13) gồm 4 việc GEM-U1 đến GEM-U4 theo chỉ đạo của Claude tại tin nhắn giao việc ngày 25/10/2026 (claude-gemini-20261025T190000Z-5e2a7c13-8b64-4f09-a1d7-2c9e0b6f3a48.md).
  - Hoàn thành GEM-U1 (P0): Soạn thảo `qa/ai-review/GEMINI_EXTEST_CASES.md` gồm 22 khối LaTeX chuẩn `\begin{ex}...\end{ex}` của gói `ex_test` (Cộng đồng VTeX) dùng cho giáo viên Toán. Bao quát trọn vẹn: trắc nghiệm 4 lựa chọn, đáp án \True ở mọi vị trí (A, B, C, D), câu không đánh dấu đáp án (undefined), đúng-sai nhóm \choiceTF 4 ý (toàn đúng, toàn sai, kết hợp), lời giải \loigiai lồng nhau sâu, hệ phương trình \heva, chèn hình TikZ / \immini, câu trả lời ngắn \shortans, phân loại mã ID VTeX (%[2D1B2-1], %[1D1N1-2], %[2D3V1-4], %[2D4G2-3], %[0D1Y1-1]), khối câu hỏi không mã, và khối chú thích xen kẽ. Đã kiểm tra trích dẫn đạt 0 cụm từ vi phạm.
  - Hoàn thành GEM-U2 (P1): Soạn thảo `qa/ai-review/GEMINI_TEXT_FORMATS.md` khảo sát chi tiết cách giáo viên Việt Nam viết 3 dạng câu hỏi bổ trợ chưa được bộ phân tích hỗ trợ: Điền khuyết (Fill-in-the-blank), Nối cột A với cột B (Matching) và Sắp xếp thứ tự (Ordering). Mỗi dạng cung cấp 5 mẫu thực tế từ các môn Toán, Văn, Anh, KHTN, Sử - Địa, Tin học kèm phân tích các điểm nhận diện đặc trưng và rủi ro gây nhầm lẫn với trắc nghiệm hoặc tự luận để Chủ dự án xem xét định hướng phát triển. Kiểm tra trích dẫn đạt 0 vi phạm.
  - Hoàn thành GEM-U3 (P1): Cập nhật `docs/huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md` tích hợp đầy đủ các tính năng mới: (a) Nhập đề từ văn bản thô (AI Parser) và mã LaTeX / EX_Test (VTeX) liệt kê chi tiết 28 định dạng hỗ trợ và các dạng chưa hiểu; (b) Hoán vị mã đề (Trộn 4 mã đề) với cơ chế đảo câu hỏi độc lập trong từng phần, bảo toàn khối ngữ liệu chung, đồng bộ chữ cái đáp án trong lời giải chi tiết và bảo vệ phương án phụ thuộc; (c) In đề thi / xuất PDF chuẩn khổ A4 nhiều trang không bị cắt câu. Chạy kiểm tra nhãn giao diện bằng công cụ kiểm định đạt 63/63 nhãn khớp 100% mã nguồn `src/` (0 nhãn sai lệch).
  - Hoàn thành GEM-U4 (P2): Cập nhật làm mới `qa/ai-review/GEMINI_CV_GAPS.md` đối chiếu chi tiết 11 CV chưa đóng với toàn bộ các ca kiểm thử mới được bổ sung (`shuffle_variants`, `question_order`, `exam_parser_cases`, `exam_parser`, `ex_test_parser`, `docx_long_exam`, `latex_math`, và luồng trình duyệt F13–F16). Áp dụng chặt chẽ hệ nhãn ĐỦ, PHỦ MỘT PHẦN, KHÔNG CÓ; trích dẫn chính xác nguyên văn 60 ca test có thật từ mã nguồn, đạt 0 lỗi trích dẫn.
Đang làm:
  - Hoàn tất toàn bộ 4/4 mục của Generation 13.
Tiếp theo:
  - Báo cáo Người chỉ đạo Claude nghiệm thu Generation 13.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã nguồn src/, tests/, prisma/, không sửa checklist 03, hồ sơ 02, ASSIGNMENTS hay BATCH_REVIEWS. Không đưa số test vào tài liệu.
Tệp giao trong batch Generation 13:
  - qa/ai-review/GEMINI_EXTEST_CASES.md (GEM-U1)
  - qa/ai-review/GEMINI_TEXT_FORMATS.md (GEM-U2)
  - docs/huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md (GEM-U3)
  - qa/ai-review/GEMINI_CV_GAPS.md (GEM-U4)
Chặn việc: Không. Sẵn sàng chờ Người chỉ đạo Claude review nghiệm thu.
