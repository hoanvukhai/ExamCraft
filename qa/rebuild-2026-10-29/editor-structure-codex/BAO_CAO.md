# Hoàn tất kiểm cấu trúc đề sau Claude — 29/10/2026

**Trạng thái: WAITING_REVIEW.** Các việc kỹ thuật còn lại trong bàn giao đã kiểm đạt. Chưa tự duyệt chuyên môn hoặc đóng CV.

## Mã và bản đang xem

- Nền Claude: `f598d1f`; nhánh tiếp nối `codex/editor-structure-verify`.
- Worktree: `F:/Workspace/Zazz/ExamCraft/tmp/verify-ui`.
- `3bd2585`: chỉ đóng khung soạn khi tài liệu thực sự nhận câu; bỏ mũi tên thừa của nút menu gọn để vừa điện thoại.
- `f65e192`: cập nhật F2/F3 và các ca còn dùng nút cũ; CI/HTTP cùng chọn máy chủ thử bằng cấu hình cổng.
- `08da910`: đo ô giao diện trong một ảnh chụp DOM, tránh giữ vị trí ô cũ khi danh sách tải lại; không giảm kiểm tràn ngang.
- Build sản xuất đã kiểm: `AWUHXYIxceX9dvvajJFDr`, máy chủ `http://127.0.0.1:3122`, DB `examcraft_test_20261022`.
- Checkout gốc vẫn ở `b6d81a6`; chưa gộp hoặc push. Bản 3117 không dừng/không build đè.

## Đã xử lý

1. F2 tạo Phần → Nhóm ngữ liệu → Câu qua menu chèn mới. Giữ kiểm bảy dạng câu, ảnh, điểm 0, tên đề, cuộc đua nhận ID máy chủ, ngân hàng, mẫu và mở lại.
2. F3 kiểm ngữ liệu qua dàn ý mới. Một ngữ liệu dùng ở hai phần tạo hai nhóm và in lại theo từng nhóm đúng B3; không ép in một lần cho cả đề. Vẫn kiểm bốn mã đề, Word, đáp án/lời giải, trình chiếu, in và song song.
3. Các ca HTTP đổi/xóa câu nay thay cả dàn ý tương ứng; thêm kiểm tài liệu có tham chiếu câu thiếu phải bị từ chối mà không ghi dở. CAS, quyền bị thu hồi và bản giao cố định vẫn được kiểm.
4. F1/F14/F17/F20/F22/F23 đi qua đúng cửa mới: kho đề, chi tiết trạng thái lưu, menu nhập/sinh và menu lưu ngân hàng. Khóa giả được nạp lại vào trạng thái UI sau khi fixture thêm qua HTTP; không bỏ qua kiểm có khóa. Giữ tình huống mất mạng, nháp xung đột, hủy AI, mất phản hồi và thử lưu lại.
5. Khung thêm câu đóng theo xác nhận của tài liệu hiện tại, không tính lại trên bản React cũ. Có ca mới: xóa phần đang chèn vẫn giữ nguyên nội dung câu đang nhập và chặn chèn vào vị trí cũ.
6. CI dùng được cổng riêng; từ chối địa chỉ ngoài máy, thông tin đăng nhập trong URL, đường dẫn và cổng mâu thuẫn. Không gọi AI thật.

## Kết quả cuối

| Nhóm kiểm | Kết quả | Bằng chứng |
|---|---:|---|
| `npm run ci` đầy đủ | PASS | [CI-verified.log](CI-verified.log) |
| Kiểu, lint, build trong CI | PASS | Cùng log CI |
| SAFE | 533/533 | Cùng log CI |
| HTTP | 118/118 | Cùng log CI và thư mục [http](http/) |
| F1–F7, F9–F25 | 24/24 | [pilot-verified.json](pilot-verified.json) |
| Bàn soạn | 10/10 | [UI-checked-editor.log](UI-checked-editor.log) |
| Khung chung | 4/4 | [UI-checked-frame.log](UI-checked-frame.log) |
| Kho đề | 6/6 | [UI-checked-library.log](UI-checked-library.log) |
| Trang giáo viên | 7/7 | [UI-verified-teacher.log](UI-verified-teacher.log) |
| Quản trị | 11/11 | [UI-verified-admin.log](UI-verified-admin.log) |
| Chữ tiếng Việt, thu phóng, in | 4/4 | [UI-verified-typography.log](UI-verified-typography.log) |
| Kiểu/lint sau sửa phép đo giáo viên | PASS | [final-types.log](final-types.log), [teacher-test-lint.log](teacher-test-lint.log) |

CI chạy trên mã sản phẩm `f65e192`. Commit sau chỉ sửa phép đo của bộ kiểm giáo viên, đã chạy lại suite và kiểm kiểu/lint; mã sản phẩm và build không đổi. Tất cả suite giao diện ở bảng trên cùng kiểm build đã nêu. Tổng hợp có máy kiểm lại nguồn pilot, build và kết quả ở [summary.json](summary.json).

Chỉ dùng Chrome cài sẵn, dữ liệu giả, health `isolatedTest=true` và SQL kiểm đúng DB trước ghi. Các luồng pilot đều báo dọn fixture thành công; mỗi suite giao diện có `cleanup.json` trong thư mục `ui-*`. Không ghi DB chính, không schema/migration mới, không thay key/.env/khóa mã hóa/backup.

Ảnh xem nhanh: [320px sáng](ui-editor/settings-320-light.png), [375px tối](ui-editor/rich-375-dark.png), [ma trận 320px](ui-editor/requirements-320.png). Ảnh các trang, sáng/tối và khổ khác được giữ trong các thư mục `ui-*`.

## Lịch sử lỗi và giới hạn

- Giữ các log CI đầu và replay để truy vết: lỗi ban đầu là phép kiểm theo danh sách phẳng/nút cũ. Không xóa hoặc bỏ qua ca để làm đạt. Lần có Docker dừng thất bại trước khi tạo fixture; Docker được mở lại, container PostgreSQL cũ còn nguyên rồi kiểm lại đạt.
- Lần đo trang giáo viên giữ locator theo số thứ tự giữa hai lần tải danh sách gây timeout; đã đổi sang lấy vị trí các ô đang thấy trong cùng một lần và vẫn kiểm từng ô nằm trong màn hình.
- Chưa test điện thoại vật lý; chưa duyệt từng dạng đề bằng mắt trong Microsoft Word hoặc in giấy. Kiểm DOCX qua cấu trúc và kiểm PDF/thu phóng trên trình duyệt đã đạt.
- Không đánh giá chất lượng provider thật hoặc ký duyệt nội dung chuyên môn. Chưa đọc lại từng dòng toàn bộ S0–S7 kế thừa; đã rà các sửa bảo toàn quan trọng và thêm hồi quy đọc dàn ý lỗi chỉ ở chế độ xem, đường lưu vẫn kiểm nghiêm.
- F8 diễn tập backup là tuyến riêng, không chạy lại trong đợt không đổi schema này. Không tự đóng CV, không sửa hồ sơ02/checklist03/ASSIGNMENTS/BATCH_REVIEWS.

## Bước tiếp theo

Chủ dự án xem bản thử 3122, ưu tiên soạn trong phần/nhóm, nhập câu vào giữa đề, mở Thông tin đề và thử điện thoại thật/Word. Claude có thể duyệt các commit trên nhánh riêng rồi mới quyết định tích hợp vào nhánh đang dùng; không cần tìm lại các lượt chat để hiểu kết quả.
