# CDX-R1 — sửa lint, generation15

Base bc39acf. Danh sách ban đầu r1-lint-before.json; chưa kết luận lint sạch.

## Nhóm1: kiểu dữ liệu thư viện/API
Thay any của bảng biến thiên bằng VariationTableData, dữ liệu đồ thị bằng Record<string,unknown>; snapshot thống kê bài giao có kiểu trường đang dùng, bản cập nhật bài giao dùng Prisma.AssignmentUpdateInput. Danh sách lượt học sinh dùng Pick<Attempt> theo select hiện hành, const thay let. Không đổi logic tính điểm, quyền hoặc cách nộp.

Kiểm nhóm1: npm test đạt425/425 (r1-types-safe.log); tsc --noEmit -p . đạt (r1-types-tsc.log). Chưa build hoặc chạy DB vì chỉ đổi kiểu. Các nhóm React/test/UI còn đang xử lý.

## Nhóm2: kiểu trong bộ kiểm cũ
Đã thay any bằng unknown, kiểu field JSON và chữ ký mock Prisma ở các test bảo mật/legacy. Một ngoại lệ có lý do tại test double question_history vì mô phỏng linh động hàng và tham số nhiều model/select/include; không tắt quy tắc toàn tệp hoặc sản phẩm. Các kịch bản legacy DB/AI chỉ typecheck, không chạy vì có nhánh AI thật. npm test đạt425/425, tsc đạt; r1-test-types-safe.log và r1-test-types-tsc.log.

## Nhóm3: trạng thái React, UI và CI
Bỏ effect chỉ để đồng bộ tiêu đề/biến thể dẫn xuất; giữ form có source tương ứng. Theme và token URL đọc bằng useSyncExternalStore; bản answersRef/liveExam chỉ cập nhật sau commit bằng layout effect, timer/guard nộp giữ nguyên. Token nhập tay vẫn được giữ đúng URL/tài liệu. handleFinalSubmit dùng khai báo hàm hoisted, không đổi nội dung xử lý; kiểu câu trả lời là unknown và thu hẹp tại chỗ dùng, thêm guard null cho Object.keys. Khôi phục chấm chỉ làm phẳng JSX thuần, không đổi kiểm quyền/điểm/CAS. Dữ liệu tải từ mạng cập nhật trong callback Promise sau phản hồi; loading cho thao tác chủ động vẫn có, reset theo nguồn được tính trước render children. Kho giữ cơ chế request sequence chống phản hồi cũ. Link rời bàn soạn vẫn dùng điều hướng toàn trang để giữ beforeunload.

Đã kiểm nhóm3: npm test425/425 và tsc đạt (r1-hooks-safe.log/r1-hooks-tsc.log); bản cuối npm run ci -- --quick đạt cả Type check → Lint → SAFE (r1-ci-quick.log). Lint trước77lỗi, cuối0lỗi/131cảnh báo (r1-lint-before.json, r1-lint-final.json); chưa tuyên bố hết cảnh báo. CI thêm Lint ngay sau Type check; --quick nay gồm3bước. Không tắt rule toàn cục.

Giới hạn: chưa build hoặc HTTP/browser sau refactorR1; kiểm trình duyệt sẽ thực hiện cùng R2/R3, không suy SAFE thay thế kiểm hành vi. Các test legacy có nhánh AI thật chỉ typecheck. Không DB chính/provider/migration. Chờ Claude duyệt R1.

## Hồi quy sauR2
Typecheck/lint/SAFE bản cuối đạt r2-ci-quick.log; HTTP99/99 và browser18/18 đạt sau refactor, gồm tài khoản/offline/lưu/nộp/chấm/lịch sử/nhập/trìnhchiếu/kho. R2 sửa thêm khóa React trùng của modal và trạng thái chèn từ dashboard; chi tiết LIBRARY_UI.md. Không suy đã hết131cảnh báo từ việc0lỗi.
