# CODEX status

task_id: OWNER-LIBRARY-MERGE-20261028
state: WAITING_REVIEW
updated: 28/10/2026, Asia/Bangkok
branch/worktree: rebuild/2026-10-local, F:/Workspace/Zazz/ExamCraft
commit mã + kiểm: 2681af8

Yêu cầu chủ dự án đã thực hiện: gộp thư mục và đề thành Kho đề chính, đưa Gần đây/Gắn sao vào trong trang, menu nhóm hiển thị thẳng. Giữ khung Workspace và thay đổi mới của chủ dự án; thùng rác/ngân hàng/lớp/bài giao còn đầy đủ.

Đã xong: xem thư mục/đề cùng màn và phân trang, đường dẫn cũ chuyển đúng vị trí, quyền đề được mời, ngữ cảnh tạo thủ công/AI giả/nhập theo thư mục; giữ nháp cũ, cứu nháp nếu thư mục đã xóa, chống khởi tạo đề trống sau đổi URL lưu. Không đổi schema/migration.

Đã kiểm: build production/TypeScript, lint tệp liên quan, SAFE, trình duyệt kho hợp nhất và hồi quy teacher/F19, điện thoại mô phỏng dọc/ngang và sáng/tối. Số liệu, ảnh, bằng chứng dọn fixture và giới hạn chỉ tại qa/rebuild-2026-10-28/library-merge/BAO_CAO.md. Không suy đóng CV từ số kiểm. Chưa kiểm cảm ứng trên thiết bị thật hoặc chất lượng provider thật.

Server thử localhost3117 giữ build w0G2dmRUKY14u_VMa2WWW, isolatedTest, AI thật tắt; LOCK_3117=USER. Chỉ DB examcraft_test_20261022 đã kiểm đích và dữ liệu giả theo ID riêng; không ghi DB chính/key/.env/backup. Server có thể cần mở lại nếu tiến trình dừng giữa lượt chat; không build đè lúc người dùng xem.

Bước kế: chủ dự án xem sản phẩm; Claude duyệt nhóm thay đổi/báo cáo. Không tự mở thêm tính năng, đóng CV hoặc sửa hồ sơ02/checklist/ASSIGNMENTS/BATCH_REVIEWS. Hồ sơ phân tích trước giữ tại qa/rebuild-2026-10-28/library-direction/PHAN_TICH_GOP_KHO_VA_THU_MUC.md.

Tệp giữ ngoài commit: các sửa/ảnh/kết quả QA25 có sẵn, scratch/, tmp/. Không push/reset/clean. Bằng chứng đợt UI/font/AI-cap cũ: qa/rebuild-2026-10-27/teacher-ui-fix/BAO_CAO.md và các nhóm trước trong Git; không coi là nghiệm thu lại ở bản này.
