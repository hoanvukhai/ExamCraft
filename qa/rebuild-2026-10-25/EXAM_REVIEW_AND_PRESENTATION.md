# Rà soát đề và trình chiếu — 25/10/2026

## Phạm vi và mã

CV036: `src/lib/exam-review.ts` kiểm cấu trúc bản đang mở, không sửa tài liệu, không đọc/ghi DB, không gọi AI hoặc tải ảnh. Kiểm mã trùng/trống, nội dung, liên kết phần/ngữ liệu/hình, cấu trúc bảy dạng, đáp án thiếu và điểm; dùng `freezeExamScoring` và `compareExamPlan` hiện có để tránh tạo bộ tính điểm khác. Không ép đúng/sai có bốn ý; khảo sát/nhận xét không bị yêu cầu đáp án đúng hoặc điểm. Điểm 0 và đáp án Sai được giữ đúng.

`ExamReviewPanel` thu gọn mặc định trong bàn soạn và hộp chia sẻ/giao bài. Có vị trí câu và việc cần sửa, tổng điểm chỉ ghi đủ nếu mọi câu đã xác định điểm; đề rỗng không báo đủ. Chưa phải cổng chặn phát hành: vẫn cho lưu bản chưa hoàn thiện, giữ kiểm server hiện có. Không hứa kiểm đúng sai chuyên môn hay kết nối URL ảnh.

Trình chiếu thêm chọn câu và cỡ chữ 18–40px. Chuyển câu luôn ẩn đáp án; phím mũi tên không chiếm thao tác của ô nhập/select; đổi câu đặt lại vùng cuộn bằng key. Không thay nội dung, điểm hoặc snapshot bài giao.

CV025: nút lưu ngân hàng ghi rõ tạo bản sao riêng, khóa bấm lặp khi đang gửi và khóa khi form câu/đề xuất chưa áp dụng. Lỗi hiện tại câu thay vì chỉ alert. Không thay endpoint hoặc cách lưu. Chặn double click phía UI không tương đương idempotency khi mất biên nhận từ server; phần đó vẫn mở.

## Kiểm tra

- Unit cấu trúc: 6/6 đạt trước kiểm nhóm; dữ liệu giả trong RAM, không DB.
- SAFE gồm render: 336/336 đạt (`exam-review-safe.log`).
- Build đầu đạt (`exam-review-build.log`, build ID `qzS3DYG9z10QajL__shoz`); bản cuối gồm guard ngân hàng và Word đã dựng lại đạt.
- Lint cả các tệp có sửa: bốn lỗi cũ nằm tại effect của ExamWorkspace/ShareModal và thẻ liên kết về kho; không thuộc mã mới. Chi tiết `review-lint.json`. Chưa tuyên bố lint toàn repo sạch.
- Browser F3 lần đầu bị chặn vì Docker engine không chạy, DB5436 không kết nối được (`exam-review-browser.log`). Đã yêu cầu khởi động Docker Desktop local để thử tiếp. Chưa kiểm được tương tác; không suy từ render tĩnh rằng phím/zoom đã đạt UI thực tế.

## Phần Word tiếp nối trong cùng lượt

CV024/043/044: thêm view `parallel` thật vào `docx-export.ts`, A4Preview truyền đúng chế độ. Cặp cột lấy lại các block câu/đáp án từ renderer sẵn có, giữ thứ tự, bảy dạng, rubric và lời giải; không tạo mô hình dữ liệu thứ hai. Ngữ liệu giữ một lần ngoài bảng. Hàng tiêu đề lặp ở trang tiếp, hàng câu được phép ngắt trang; ảnh trong câu thu tối đa230px đúng tỷ lệ, bảng biến thiên dùng chiều rộng cột. Công thức ngữ liệu đi qua OMML; đáp án ngắn dùng accepted_answers nếu chưa có correct_answer, thiếu thì ghi rõ.

SAFE cuối sau Word đạt338/338 (`exam-review-final-safe.log`), nhóm portable/export đạt18/18 (`parallel-word-tests.log`): kiểm mỗi câu đứng trước lời giải của chính mình và trước câu sau, không nhân ngữ liệu, ảnh nhúng/tỷ lệ và OMML, không đụng dữ liệu gốc. Lần viết test ảnh đầu thiếu biến fixture `png`, đã sửa và chạy lại đạt; không phải lỗi ứng dụng. Build tích hợp Word đạt, ID `edFk-KPaIc9gE5V-q-3Sz`, log `parallel-word-build.log`; commit mã/tests `23e9eb5`. Chưa mở Word/LibreOffice hoặc PDF để kiểm trực quan phân trang; XML/media đúng chưa chứng minh bố cục hoàn hảo.

## Bảo toàn và giới hạn

Không schema/migration/journal mới, không provider, không DB chính. Lưu ngân hàng riêng đã có đường POST bản sao và câu nháp có tag `__workspace_only`; không viết lại khi chỉ đọc mã. Chưa bổ sung idempotency lưu ngân hàng hoặc Undo bền qua reload; giữ các mục đó mở.

Chưa hoàn tất toàn bộ dự án. Publication/regrade, bộ gói chuyên môn đủ môn/lớp, Word/PDF dài và các tiêu chí chưa nghiệm thu vẫn theo checklist03. Báo cáo này chỉ ghi nhóm thay đổi hiện tại, không thay master.

## Trạng thái bàn giao

Đã khởi động Docker Desktop, tiến trình đã có nhưng cổng PostgreSQL5436 vẫn đóng và docker ps không trả kết quả trong thời gian chờ. Dừng hai lệnh chờ; không reset/xóa container hoặc chạy migration. Server QA3117 đã dừng. Chờ thông tin trạng thái Engine từ chủ dự án để kiểm tiếp. Tệp F3 mở rộng đã có kiểm rà soát/trình chiếu, nhưng chưa có kết quả đạt cho bản mới. Báo cáo pilot-run-43b02325-4751-4d64-ae7e-5696db2e029b.json lưu lần bị chặn.
