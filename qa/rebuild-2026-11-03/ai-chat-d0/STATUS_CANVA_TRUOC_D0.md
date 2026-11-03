# CODEX status

> Cập nhật lưu trữ QA: ảnh/log/JSON sinh tự động đã cất ở local, không còn theo dõi trong Git. Xem [quy tắc lưu kết quả](../../KET_QUA_SINH_TU_DONG.md) và đợt rà `qa/rebuild-2026-11-03/chat-review/BAO_CAO.md`. Mốc raw cũ vẫn truy được tại Git `85ac659`; bản đang đổi khi dọn có manifest trong `tmp/qa-before-review-20261103T152251Z-0cfe6971`.

task_id: AI-CHAT-UX-SPEC-20261103
state: WAITING_REVIEW
source_reviewed: F:/Workspace/Zazz/ExamCraft/tmp/canva-a
source_branch: claude/editor-v2
source_head_audit: 865bcea8efce497b3b36f1963e3bba363a494283
report_checkout: C:/Users/ACER/.codex/worktrees/editor-structure/ExamCraft

Đã xong: đặc tả trợ lý soạn đề phiên bản1.0 và bảng ca nghiệm thu truy vết về các lỗi audit. Bao gồm bootstrap chưa chọn môn/lớp, hội thoại/làm rõ, phạm vi, metadata/full-exam proposal, mẫu có nguồn, khóa/lỗi, trạng thái/lưu/khôi phục, hợp đồng, điện thoại và rollout tương thích.
Tài liệu chính: qa/rebuild-2026-11-03/ai-chat-audit/DAC_TA_CHAT_AI_V2.md; ca nghiệm thu: NGHIEM_THU_CHAT_AI_V2.md; cơ sở: BAO_CAO.md cùng thư mục. Bản bàn giao nằm ở thư mục QA tương ứng trong worktree V2.
Đã kiểm: rà tài liệu, mã yêu cầu, truy vết sang ca kiểm, liên kết nội bộ. Chi tiết ở SPEC_REVIEW.json. Không chạy lại test tính năng/build/DB/AI chỉ vì viết đặc tả; kết quả audit cũ không phải nghiệm thu phiên bản mới.
Đang làm: không có tác vụ code/test treo; chờ chủ dự án chốt đặc tả trước khi viết mã.
Bước kế: sau khi được chốt, đối chiếu các sửa mới và triển khai G0–G5 theo đặc tả; giữ các lớp quyền/bản nền/nháp, không tự mở schema hoặc deploy.
Tệp giữ: chỉ sửa/thêm tài liệu QA và trạng thái Codex; mã, dữ liệu, bí mật, server hiện có giữ nguyên. Không sửa checklist03/hồ sơ02 hoặc tự đóng CV. Trạng thái trước đợt được giữ trong nhóm báo cáo.
