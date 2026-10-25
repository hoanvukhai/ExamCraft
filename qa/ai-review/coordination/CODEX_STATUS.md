# CODEX status

task_id: SOLO-EXAM-REVIEW-PRESENTATION-WORD
assignment_generation: solo-2026-10-25
state: NEEDS_RESUME (kiểm browser chờ Docker/DB thử sẵn sàng; không chờ Claude/Gemini)
updated_at_utc: 2026-10-25T04:51:17.272Z
branch/worktree: rebuild/2026-10-local, F:/Workspace/Zazz/ExamCraft
commit mã/tests gần nhất: 23e9eb5

Đã làm: rà soát cấu trúc toàn đề; chọn câu/cỡ chữ trình chiếu; nút ngân hàng giữ bản sao riêng/chặn gửi lặp và sửa dở; Word Song song hai cột, ảnh vừa cột và công thức ngữ liệu.

Kiểm: SAFE và build tích hợp đạt. Chi tiết/log/số liệu chỉ ở qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md. Browser F3 bị chặn trước kiểm bởi DB5436 không chạy. Docker Desktop đã mở nhưng engine/DB chưa sẵn sàng, đã hỏi chủ dự án. QA3117 đã dừng. Chưa kiểm trực quan Word dài. Lint mã mới đạt; tệp cũ có lỗi lint kế thừa, không báo toàn repo sạch.

Bước kế: xác nhận Docker Engine và container PostgreSQL; giữ DB chính, chỉ guard DB thử rồi chạy F3 mở rộng và kiểm nút ngân hàng. Sau đó tiếp publication/regrade theo thiết kế và bảo toàn/rollback, không thêm journal trái đóng băng. Không lặp lại các tính năng đã xong, không suy hoàn thành từ test.

Tệp giữ: mã đã commit; hồ sơ/bằng chứng cùng nhóm. Giữ tmp/backups/worktrees. Không schema mới, provider thật, push/reset/clean.
