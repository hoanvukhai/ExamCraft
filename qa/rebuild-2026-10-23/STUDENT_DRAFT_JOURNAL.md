# Giữ nháp học sinh qua đóng tab / mất điện — 24/10/2026

CV057, tiếp sau [STUDENT_DRAFT_CAS](STUDENT_DRAFT_CAS.md). Không migration, không AI, chỉ DB thử.

## Vấn đề
Câu học sinh vừa làm chỉ nằm trong bộ nhớ trang cho tới lần tự lưu 15 giây kế tiếp; đóng tab, mất điện hoặc mất mạng trước đó là mất câu đó.

## Đã làm
- `src/lib/student-draft-journal.ts`: nhật ký trên trình duyệt, gắn một lượt làm và gắn bản nháp máy chủ mà nó dựa vào. Máy chủ vẫn là nguồn chính.
- `reconcileJournal` khi mở/tiếp tục lượt: không có nhật ký hoặc trùng nháp máy chủ → dùng máy chủ; nhật ký dựa trên đúng bản nháp máy chủ đang có → **khôi phục** các câu chưa gửi (hiện thông báo, tự lưu lại); máy chủ đã đổi ở trang khác kể từ lúc đó → **xung đột**, không gộp, không ghi đè: dùng luồng chặn sẵn có (dừng tự lưu, chặn nộp, tải JSON), vẫn giữ nhật ký.
- Trang `/a/[publicId]`: ghi nhật ký mỗi khi đổi câu trả lời (trừ khi đang xung đột); mỗi lần máy chủ xác nhận lưu thì cập nhật bản nền của nhật ký; nộp thành công thì xóa. Lỗi bộ nhớ đầy/bị chặn không làm hỏng tự lưu lên máy chủ.
- Nhật ký bị hỏng/khác lượt bị bỏ qua và không bị xóa; so sánh nội dung phân biệt 0, false, rỗng, null và thứ tự mảng.

## Bằng chứng (chạy mới)
- Unit `student_draft_journal.test.ts` 5/5. SAFE tổng219/219 ([log](safe-student-journal.log)); HTTP18/18 ([log](http-student-journal.log)); build46trang ([log](build-student-journal.log), xem ghi chú build ở [SHARE_COPY](SHARE_COPY.md)).
- UI thật (production build, DB thử, bài giao thử `cmvlzp3sk0001tb4o3zm7hck5`, tên học sinh giả): làm câu lựa chọn và trả lời ngắn → máy chủ có A và 0. Tạm làm hỏng gửi nháp (PATCH lỗi như mất mạng, 2 lần bị chặn) rồi điền "7" → máy chủ vẫn `{qa-mc:A, qa-short:0}`, nhật ký có đủ 3 câu. Đóng trang, mở lại, nhập cùng tên → tiếp tục lượt cũ, ô điền khuyết hiện **7** kèm thông báo khôi phục; sau ≤15 giây máy chủ nhận `qa-blank: 7`. Nộp → lượt SUBMITTED điểm tạm 3/10 (câu tự luận chờ chấm), nhật ký bị xóa.
- Lint: file mới 0 lỗi; hai trang sửa/đã sửa (`a/[publicId]`, `share/[id]`) có 14 vấn đề (9 lỗi, 5 cảnh báo) cả trước lẫn sau thay đổi, không thêm mới ([log](lint-share-journal-pages.log)).

## Giới hạn
- Xung đột mới kiểm bằng unit, chưa dựng trên UI.
- Chỉ phục hồi trên **cùng trình duyệt/cùng máy** còn cookie lượt làm (cookie ký, 30 ngày); đổi máy hoặc xóa dữ liệu trình duyệt thì không. Chưa kiểm hai trình duyệt độc lập hay chế độ riêng tư.
- localStorage không phải giao dịch nguyên tử giữa hai tab cùng lượt: hai tab ghi chồng thì tab ghi sau thắng nhật ký (máy chủ vẫn bảo vệ bằng CAS khi lưu).
- Chưa có nhập lại bản JSON đã tải; chưa giới hạn tuổi nhật ký của lượt đã bỏ dở (mỗi lượt một khóa nhỏ).
- Dữ liệu thử còn lại trong DB thử: bài giao và lượt làm của học sinh "QA học sinh journal".
