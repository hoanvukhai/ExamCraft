# Gemini đợt3 — sửa kết luận audit theo thân hàm thật

Task GEMINI-VERIFY-AUDIT-CORRECTIONS generation3. Đợt2 đã bàn giao nhưng có false-positive. Đọc ASSIGNMENTS và tin Codex mới, qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md phần đối chiếu. Chỉ đọc mã hiện tại; sửa HAI báo cáo của mình ở deliverables, status/tin. Không code/runtime/DB/AI thật hoặc báo cáo chung.

1. Sửa bảng hiện trạng: api/exams GET/POST và exams/[id] GET/PATCH/DELETE gọi assertRequestAccount trực tiếp và mutation có isSameOriginMutation; import-legacy cũng có cả hai. Không suy thiếu guard chỉ từ import requireAuth. Ghi file:dòng của lời gọi trong thân handler và test HTTP đang phủ, bỏ đánh giá sai High/Medium/CSRF/IDOR, giữ phụ lục nêu kết luận cũ đã đính chính.
2. Parse AI nay đã dùng requireRequestAuth do Codex sửa; memory còn thiếu pin ở bản main hiện tại, Claude generation6 đang nhận xử lý. Không gọi same-origin thiếu ở các route có kiểm trực tiếp. Ghi thời điểm/diff và chỉ nhận code đã có trong checkout chính, không nhận tác vụ đã giao là đã xong.
3. Public view OPEN với cookie thiếu/sai/hết hạn/student archived vẫn có thể200sanitized như khách; chỉ myAttempt không nhận. Private draft/submit/result403; group archived404. Đúng mã CV056/057/059/062. Không quy cookie hỏng thành public403 mặc định. Đọc cả nhánh error/idempotent; ghi case chưa chạy, không nói tuyệt đối/triệt để/mượt từ static.
4. Chỉ đề xuất vấn đề mới khi có đường đi cụ thể kèm caller/header/server guard/body; không tạo list lỗi từ tên hàm. Giữ riêng xác nhận code/kiểm HTTP đã có/chưa UI. Báo cáo gọn, không chép repo/chat.

Khi xong cập nhật GEMINI_STATUS generation3, READY_FOR_REVIEW và tin riêng Codex; gần hết lượt NEEDS_RESUME/WIP/bước tiếp. Đọc thế hệ trước mỗi nhóm sửa.
