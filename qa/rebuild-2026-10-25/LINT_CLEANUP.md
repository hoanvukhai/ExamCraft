# CDX-R1 — sửa lint, generation15

Base bc39acf. Danh sách ban đầu r1-lint-before.json; chưa kết luận lint sạch.

## Nhóm1: kiểu dữ liệu thư viện/API
Thay any của bảng biến thiên bằng VariationTableData, dữ liệu đồ thị bằng Record<string,unknown>; snapshot thống kê bài giao có kiểu trường đang dùng, bản cập nhật bài giao dùng Prisma.AssignmentUpdateInput. Danh sách lượt học sinh dùng Pick<Attempt> theo select hiện hành, const thay let. Không đổi logic tính điểm, quyền hoặc cách nộp.

Kiểm nhóm1: npm test đạt425/425 (r1-types-safe.log); tsc --noEmit -p . đạt (r1-types-tsc.log). Chưa build hoặc chạy DB vì chỉ đổi kiểu. Các nhóm React/test/UI còn đang xử lý.
