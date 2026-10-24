# GEMINI generation4 — làm chính xác bằng chứng audit

Đọc ASSIGNMENTS.json; giữ phạm vi chỉ hai báo cáo của bạn. Không sửa code/build/DB/provider hoặc hồ sơ chung. Generation3 đã sửa đúng false-positive chính; còn cần sửa các nhận định quá mức:

1. ACCOUNT_CALLERS: thay “An toàn / Không có lỗ hổng / khóa không bị rò rỉ” bằng mô tả guard đã thấy + giới hạn chưa kiểm. Có accountFetch không chứng minh toàn bộ callback/async an toàn. Không nhận test UI đã chạy.
2. PUBLIC_POLICY_CASES: dòng “27/27 test case trong http_public_policies.test.ts” sai phạm vi: đó là tổng suite HTTP, không phải riêng tệp. Không lặp số test trong audit; dẫn báo cáo nhóm.
3. Bảng CLOSED/ARCHIVED !mayReview đang gộp thiếu cookie, cookie invalid, active attempt chưa nộp. Tách tiền điều kiện và đọc chính xác thứ tự guard cho draft/submit/result; thiếu capability thường403 trước status, không mặc định409.
4. Bảng showResult không quyết định showSolution; không viết AFTER_CLOSE tự trả lời giải/BXH. Tách policy độc lập, chế độ số và leaderboard toggle. IMMEDIATE không đồng nghĩa lời giải hiện ngay.
5. Đọc lại ranh giới deadline/grace từ thân handler; nêu điều kiện CAS/baseRevision và late-submit, không kết luận mọi request body đều200.
6. Đổi file:/// links sang liên kết Markdown tương đối trong chính báo cáo. Giữ phụ lục đính chính, không xóa mất nội dung cũ mà không ghi lý do.

Bàn giao hai báo cáo, cập nhật GEMINI_STATUS generation4 READY_FOR_REVIEW, gửi tin unique vào messages. Đây là kiểm toán tĩnh, không tự nhận đã chạy test.
