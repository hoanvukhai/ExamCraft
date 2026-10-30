# CODEX status

task_id: UX-CONTEXT-TOOLBAR-FINAL-20261030
state: WAITING_REVIEW
branch: rebuild/2026-10-local
commit_gan_nhat: 8fa5fd0 (đợt sửa hiện tại chưa commit)
worktree: F:/Workspace/Zazz/ExamCraft

Đã xong: thanh công cụ theo vùng chọn, ảnh riêng phương án qua lưu/xem/học sinh/Word/trộn, AI chỉ sửa trường được chọn, công thức theo vùng chữ, sửa văn bản dùng chung nhật ký nháp, xử lý đáp số thập phân; sửa nhảy bố cục và menu vượt màn hình.
Đã kiểm: SAFE, TypeScript, lint các tệp thay đổi, production build; Chrome bộ soạn thật và trang production với dữ liệu giả trên DB thử đã xác nhận bằng health/SQL. Kiểm màn hình hẹp, chế độ tối, nháp, xung đột, đáp án và ảnh lưu/tải lại. Bằng chứng/số liệu/giới hạn ở qa/rebuild-2026-10-30/context-toolbar/BAO_CAO_HOAN_THIEN.md; source snapshot kèm build ID. Không provider thật/DB chính/điện thoại vật lý.
Đang làm: không còn code/build/test treo của đợt này. Máy chủ production thử được giữ ở http://127.0.0.1:3122 từ F gốc; đã thay máy chủ dev cũ, không phải tmp/verify-ui trong launcher so sánh cũ.
Bước kế: chủ dự án thử bản đã dựng và phản hồi. Các mở rộng kiểu dàn trang tự do, font/cắt ảnh/vẽ mới, ảnh lời giải và nhập Word thực tế xem giới hạn trong báo cáo; không coi đã nghiệm thu mọi chức năng tương lai hoặc cả dự án.
Tệp giữ: giữ sửa có sẵn; không reset/push/gộp hay đổi schema/bí mật. Fixture riêng đã dọn; không xóa dữ liệu khác. Checklist03/hồ sơ02 do Claude giữ không sửa, không tự đóng CV. Bản trước sửa và lịch sử vá của đợt ở checkout báo cáo C; không chạy lại script vá lịch sử để đè nguồn mới.
