# CODEX status

task_id: OWNER-EDITOR-REDESIGN-P0-P8-20261028
state: WAITING_REVIEW
updated: 28/10/2026, Asia/Bangkok
branch/worktree: rebuild/2026-10-local, F:/Workspace/Zazz/ExamCraft
mốc Claude: 7f8a78a; giữ sửa af14a82
commit tích hợp mã + kiểm: 06d7401

Đã làm P0–P8 theo qa/rebuild-2026-10-28/editor-direction/PHAN_TICH_TRANG_SOAN.md: một trạng thái lưu/rà soát trên Header, Thiết lập đề năm thẻ, toolbar một dòng/Thêm câu/Xuất rõ loại, thẻ câu gọn, màn bắt đầu, chế độ hẹp và xem đề toàn màn. Giữ ngữ liệu/nguồn, nháp đã cất và đường cứu nháp khi mất quyền. Giữ các sửa khung Workspace/menu và Copilot của Claude.

Kiểm sâu lộ lỗi nhận diện tài liệu sau lưu bản phục hồi: URL đã đổi nhưng phiên còn bám mã cũ. Đã sửa nhận diện ID vừa ACK; F9 kiểm sửa tiếp vào đúng bản sao và phiên bản nguồn không đổi. Không đổi giao thức CAS, schema/migration hay API.

Đã kiểm production build/TypeScript, lint sạch, SAFE, browser bàn soạn/thư mục/ngân hàng/khung chung, các luồng Word/quyền/offline/đổi tài khoản/Copilot. Có ảnh desktop, điện thoại mô phỏng dọc/ngang và sáng/tối. Số liệu, log, ảnh, bản đồ mã và giới hạn chỉ tại qa/rebuild-2026-10-28/editor-redesign/BAO_CAO.md; FINAL_VERIFICATION.json gắn cùng build và cleanup. Không suy đóng CV từ số kiểm.

Server thử localhost3117 giữ build CdjH_2G3WN7rc0EiXHZB4, isolatedTest=true, AI thật tắt; LOCK_3117=USER. Chỉ DB examcraft_test_20261022 có guard, SQL kiểm đích và fixture dọn riêng; không DB chính, không provider thật, không xoay key/.env/backup. Không build đè lúc người dùng xem. Nếu tiến trình dừng giữa lượt chat, mở lại server thử production.

Bước kế: Claude duyệt mã/bằng chứng; chủ dự án xem giao diện và cảm ứng/bàn phím ảo thật, Word desktop/in giấy. Chưa tự chứng nhận chất lượng AI/chuyên môn hoặc đóng CV. Không sửa hồ sơ02/checklist/ASSIGNMENTS/BATCH_REVIEWS, không push/reset/clean.

Tệp giữ ngoài commit: QA25 chưa theo dõi có sẵn, scratch/, tmp/. Báo cáo gộp kho và khung trước giữ tại các nhóm library-merge/frame-panels cùng ngày.
