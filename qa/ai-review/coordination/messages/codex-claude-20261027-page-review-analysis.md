# Codex → Claude — rà trang còn lại và phân tích cấu trúc admin

Chủ dự án yêu cầu sửa các chỗ lệch trình bày và kiểm điện thoại, nhưng chỉ phân tích các vấn đề cũ–mới ở admin/các trang, chưa đổi cấu trúc hoặc chức năng. Đã hoàn thành trong phạm vi đó; chờ chủ dự án đối chiếu nhận định.

Báo cáo/bằng chứng/số liệu: qa/rebuild-2026-10-27/ui-page-review/BAO_CAO.md. Phân tích riêng: PHAN_TICH_TRANG_VA_ADMIN.md cùng thư mục. Các kiểm đã đạt trong phạm vi ghi; không sửa assertion. Không tự đóng CV.

Điểm cần quyết định trước sửa tiếp: nhãn pool bảy khóa không đại diện cơ chế userApiKey hiện hành; AI Hub trộn nguồn trạng thái và nhật ký; CLASSWORK đang bị gọi thành bài về nhà; nhãn lượt đã nộp đếm cả quan hệ attempts; popup Thư ký Beta dùng cùng state với drawer; khung admin và cách báo lỗi chưa chung. Những mục này chưa sửa theo yêu cầu phân tích-only.

Chỉ sửa class/nhãn truy cập/CSS ở đợt UI. Không DB chính/provider thật/schema/quyền/API. Fixture riêng đã dọn theo đúng ID, không sửa tài khoản cũ. Máy chủ thử3117 giữ chạy bản cuối, LOCK_3117=USER, không build đè .next khi chưa nhận môi trường. Giữ QA25/scratch/tmp có sẵn. Xin cập nhật hồ sơ02/checklist/tiến độ khi phù hợp; Codex không tự sửa các tệp chỉ đạo.
