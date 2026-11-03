# CODEX — tiếp nối trợ lý AI V2

- task_id: CHAT-AI-V2-CONTINUE
- state: NEEDS_RESUME
- branch: codex/chat-ai-v2
- latest_code_commit: 5c473c8 (metadata); trước đó f9b4864 (hội thoại)
- worktree: F:/Workspace/Zazz/ExamCraft/tmp/chat-ai-v2
- Chủ dự án đã cho phép làm liền mạch các đợt, không cần chờ duyệt từng đợt. Không đổi trạng thái này thành chờ xin phép; tiếp tục công việc khi khôi phục lượt.
- Đã có và kiểm: hội thoại/input/câu hỏi làm rõ lưu riêng theo tài khoản/đề/writer; preflight thiếu khóa; phân loại lỗi và hạn chế retry; Dừng chống kết quả muộn; Enter cảm ứng/IME; metadata proposal allowlist với trước/sau, CAS bản nền, journal v2 đọc v1, common undo và form idle cập nhật.
- Đã kiểm: lint/build, guard liên quan, integration DB thử, Chrome và SAFE. Số liệu/log chỉ tại qa/rebuild-2026-11-03/ai-chat-d1/BAO_CAO.md và ai-chat-d2/BAO_CAO.md. Không suy đã hoàn tất Đ1–Đ4 từ kết quả test.
- Còn Đ1: target nhiều câu/phần/trường và kiểm câu khóa; facts/giới hạn hỏi; chuyển ID chat sau save; nhánh yêu cầu mới; chống trùng writer khi clone tab; thu gọn media; lưu câu trả lời tự nhập đang gõ; thẻ trả lời cũ sau đổi ngữ cảnh.
- Còn Đ2: metadata + nhiều câu/cấu trúc trong cùng proposal; đổi môn/lớp đề đã có câu có đối chiếu; metadata mục tiêu kỳ thi/assessment/scope phức tạp, nút undo trên điện thoại.
- Chưa bắt đầu Đ3: bootstrap trống (không Toán 6/45), shared generation core, tạo cả đề/đáp án/phần/ngữ liệu và proposal nhận một lần; giới hạn lượt gọi toàn đơn vị. Không lách bằng Exam giả.
- Đ4 chưa đủ: full CI/HTTP/provider mock trên đường API, mobile tổng thể, kiểm tương thích và checklist nghiệm thu. SAFE đã qua nhưng chưa đồng nghĩa mọi ca đặc tả đạt.
- DB chính/key dữ liệu cũ giữ nguyên; không migration, provider thật, push/deploy. Chỉ fixture DB examcraft_test_20261022 đã kiểm và dọn. Máy chủ thử 3123 đã dừng; Docker giữ nguyên.
- Cần tiếp tục từ đây, đọc mục 0 và 14 đặc tả 1.1 ở tmp/canva-a/qa/rebuild-2026-11-03/ai-chat-audit; không đọc lại mọi chat/báo cáo cũ. Không tự đóng CV/checklist03/hồ sơ02.
