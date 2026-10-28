# Cấu trúc đề và bàn soạn — tiến độ thực hiện

Trạng thái: **IN_PROGRESS**. Worktree riêng: C:/Users/ACER/.codex/worktrees/editor-structure/ExamCraft; nhánh codex/editor-structure, nền b6d81a6. Không build đè .next hoặc can thiệp máy chủ 3117 (LOCK=USER).

## S0 — mô hình và chuyển đề cũ

Đã thêm outline và Question.parts, kiểm cấu trúc theo cấp, mã duy nhất/câu đúng một chỗ, giới hạn nút; các hàm thuần chuyển đề cũ, đồng bộ thứ tự/liên kết, chèn/xóa/di chuyển và đánh số. Đọc chỉ tạo bản nâng cấp trong bộ nhớ; không ghi ngầm DB. Không Prisma schema/migration.

Kiểm: unit S0 7/7, SAFE 512/512, kiểm kiểu và lint sạch. Bằng chứng S0-* trong thư mục cùng tên ở worktree. Các kiểm nháp/read adapter được cập nhật để mong đợi outline mới khi đọc, vẫn giữ kiểm byte thô/ID/điểm/đáp án/nguồn và không sửa đầu vào.

Quyết định cần Claude xem khi duyệt: B3 nói mỗi phần cũ thành một nút nhưng cũng cấm đổi thứ tự. Với phần xen nhau A1–B1–A2, hai điều này không đồng thời thực hiện được bằng cây không lồng phần. Chọn giữ các đoạn phần đúng thứ tự cũ, dùng trường sectionId để các nút Phần cùng trỏ cấu hình chấm cũ. ID câu, thứ tự, điểm và đáp án không đổi. Phần workspace ẩn nhưng cấu hình điểm được giữ để không làm đổi bài đã giao.

## Còn làm

S1–S7 chưa nghiệm thu. Tiếp theo S1: render/xuất và bề mặt học sinh phải đọc cấu trúc mà không lộ đáp án ý nhỏ, kiểm chấm cũ không đổi. Chưa build hoặc ghi DB cho đợt cấu trúc này. Không tự đóng CV/checklist, không chỉnh phân công hoặc hồ sơ02.

## S1 và S2 — mã và kiểm thuần đã đạt, chưa nghiệm thu trình duyệt

S1 commit 47cfe7c: bản xem/Word/trình chiếu/bài học sinh đọc dàn ý và ý nhỏ; bộ lọc công khai bỏ đáp án/lời giải/barem riêng, ý mới chấm giáo viên; cấu hình chấm cũ không đổi. Unit đầu ra 4/4, SAFE 516/516, kiểu/lint sạch. Với ngữ liệu cũ được dùng ở các vị trí rời nhau, in lại ở từng Nhóm đúng B3, không in một lần ở đầu toàn đề như trước; kiểm Word 120 câu giữ cả thứ tự, ảnh, công thức và kiểm lặp theo số nhóm tách biệt.

S2: trộn theo Phần/Nhóm, tùy chọn giữ vị trí nhóm, layout bài học sinh mới có outline; layout cũ được dựng lại theo đúng questionOrder đã lưu, không trộn lại. Mẫu lưu dàn ý rỗng, bỏ câu/đáp án/ngữ liệu, remap mã khi dùng. Giữ stamp nháp cũ khi outline chỉ biểu diễn lại cấu trúc cũ; thay đổi thật thì từ chối đề xuất cũ. Rà soát thêm phần/nhóm rỗng và ý thiếu nội dung/điểm/đáp án. Unit S2 5/5, SAFE 521/521, kiểu/lint sạch. Kiểm build/DB/trình duyệt/F3 vẫn chờ sau khi xong bàn soạn. Cổng 3117 và DB chính chưa đụng.

Đang tiếp S3. Không được suy S0–S7 hoàn tất từ số test; các kiểm nghiệm tối thiểu trong đặc tả còn phải chạy cuối đợt.
