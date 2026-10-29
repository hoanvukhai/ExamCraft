# Bàn soạn dọc — theo yêu cầu ngày 29/10/2026

Trạng thái: hoàn tất mã và kiểm thử; chờ người dùng xem và Claude duyệt tích hợp.

## Kết quả thiết kế

- Bỏ bảng quản lý phần/ngữ liệu riêng và bốn thẻ khởi đầu phía dưới. Nội dung nằm trong một cây dọc: Phần → câu, hoặc Phần → nội dung dùng chung → các câu sử dụng nó.
- Đề mới có một phần không tên. Nhập tên trực tiếp tại chỗ; tên trống hoặc chỉ có khoảng trắng không in tiêu đề và không tự sinh số phần. Không thêm cờ ẩn/hiện vào dữ liệu.
- Dấu cộng ở đầu, giữa, cuối các mục để chèn đúng chỗ. Bốn nguồn tự soạn/ngân hàng/Word-ảnh/AI còn trong thanh công cụ và menu chèn; không lặp thành các thẻ lớn khi đề trống.
- Nội dung dùng chung được soạn ngay trong nhóm chứa câu; có thể đưa câu sẵn có vào nhóm, đổi vị trí, thu gọn, xóa mục và chọn giữ câu.
- Câu có đoạn dẫn/hình/ý nhỏ riêng vẫn giữ mô hình câu hiện có. Đợt này không bổ sung một trình biên tập rich text mới hoặc hứa hỗ trợ ảnh riêng cho mọi ô đáp án.

## Bảo toàn và các lỗi được sửa kèm

- Đọc đề cũ không tự lưu/chạy chuyển đổi DB. Giữ thứ tự, ID, đáp án, hình/ngữ liệu và cấu hình tính điểm cũ. Các dãy câu cũ ngoài phần được bọc bằng phần trình bày không tên trong vùng soạn; chỉ lưu khi có chỉnh sửa được chấp nhận.
- Liên kết `sectionId: null` của phần trình bày giữ ngữ cảnh tính điểm cũ; đây không phải cờ ẩn tiêu đề. Không đổi Prisma/schema/migration, không chuyển đổi hàng loạt.
- Giữ dấu mốc nháp/đề xuất khi chỉ thêm lớp trình bày trung tính; dữ liệu cấu trúc thay đổi thực sự vẫn có kiểm tra. Mã phần trình bày ổn định khi máy chủ xác nhận tạo đề.
- Nếu xóa phần chứa câu đang soạn, phần mới không tái sử dụng ID vừa xóa; câu soạn dở vẫn còn và việc chèn vào điểm đã mất bị chặn.
- F2 phát hiện nháp bị coi là cũ sau lưu đầu tiên vì thứ tự trường JSON thay đổi. Chẩn đoán tại `F2-stamp-diagnostic.json`: chuỗi khác, giá trị giống. Sửa đối chiếu ngữ cảnh ở luồng câu thủ công/AI/Copilot/khôi phục theo giá trị JSON: chỉ bỏ qua thứ tự khóa đối tượng; thứ tự mảng, điểm, nội dung, tài khoản, quyền và kiểm phiên bản vẫn giữ. Không đổi định dạng nháp cũ hoặc bỏ qua kiểm CAS.
- Phần có cấu hình điểm nhưng không tên cũng lưu được thành mẫu. Nội dung/lời dẫn và điểm vẫn giữ khi không in tên phần.

## Phạm vi chạy

Worktree: `F:/Workspace/Zazz/ExamCraft/tmp/verify-ui`, nhánh `codex/editor-structure-verify`, nền `d92fcb9`; commit mã + test `768988d`. Cổng riêng 3122, DB `examcraft_test_20261022` có kiểm health `isolatedTest` và tên DB; tài khoản/dữ liệu thử, AI giả. Không sửa DB thật, bí mật, cổng 3117 hoặc mã ở nhánh chính. Các ảnh/log bẩn có sẵn của Claude được giữ nguyên.

## Kiểm chứng

| Kiểm | Kết quả và bằng chứng |
|---|---|
| CI đầy đủ sau sửa nháp | Đạt: kiểu, lint, SAFE 541/541, build, HTTP 118/118, 24/24 luồng F1–F7 và F9–F25. `CI-final.log`, `pilot-ci.json`; build `TekYtmNCrmHLNMGmvC3cX`. Lint không có lỗi; vẫn có cảnh báo của kho. |
| Hoàn thiện mẫu phần không tên | Sau CI bổ sung cho phép tên phần rỗng trong mẫu, rồi sửa một dòng hướng dẫn đề trống theo menu mới. Không thay đổi nghiệp vụ khác. Có bản dựng và kiểm UI riêng đúng mã sau cùng. |
| Kiểm logic mới nhất | SAFE 542/542 (`safe-complete.log`); bộ phần trình bày/điểm/mẫu/Word/dấu mốc 9/9 (`unit-complete.log`); nhóm bảo vệ câu và Copilot 39/39 (`guard-regression.log`). Kiểm kiểu `types-complete.log` và lint bổ sung `lint-complete.log`, `lint-preview.log` đạt. |
| Bản dựng sau cùng | `build-release.log`; ID xem `ui-editor/cleanup.json` và `health.json`. |
| Trình duyệt bàn soạn | `ui-release.log` và `ui-editor/cleanup.json`: 10/10 đạt trên build `jV8SBxzOLom249BFlhHmy`; kiểm mẫu phần không tên qua API thật của server thử, chuyển câu vào/ra nhóm, tên rỗng/xem ngay, thu gọn, Word, giữ nháp/lỗi lưu/mất quyền và điểm chèn đã xóa; giao diện 320/375/568/1024/1440 px, sáng/tối; dọn đúng tài khoản giả. |

Ảnh: `ui-editor/empty-1440-light.png`, `ui-editor/rich-1440-light.png`, `ui-editor/rich-320-dark.png`, `ui-editor/rich-375-light.png`, `ui-editor/new-question-375.png`. Bộ kiểm bắt buộc mở thẻ **Soạn câu** khi chụp điện thoại và kiểm tràn cả trong cây nội dung, không chỉ trang xem đề. Đã xem ảnh đề trống, cây dọc trên máy tính và điện thoại.

Các log `CI.log`, `F2-diagnostic.log`, `F2-stamp-diagnostic.json` giữ bằng chứng trước sửa nháp. Lượt `ui-editor.log` ban đầu lỗi ở chính phép chờ của test (đọc phần thứ hai trước khi autosave hoàn tất); sửa điều kiện chờ rồi chạy đạt, tiếp tục bổ sung ảnh điện thoại và chạy lại ở `ui-release.log`. Những tệp này không được dùng thay kết quả cuối. `CI-final.log` thuộc bản trước hai bổ sung nhỏ nêu rõ ở bảng, không khẳng định đã chạy CI đầy đủ trên bản cuối; SAFE, bản dựng và kiểm bàn soạn sau bổ sung có bằng chứng riêng. Không chạy lại các bộ không bị ảnh hưởng chỉ để đổi mã bản dựng.

## Người dùng xem sau khi bàn giao

Mở đề trống và đề cũ, đặt/xóa tên phần, chèn câu trước/giữa/sau, thêm đoạn dẫn cho nhiều câu, chuyển câu vào/ra nhóm; xem bản đề bên phải và Word. Cần người xem điện thoại thật và bố cục Word/in giấy thực tế. Codex không tự đóng CV hay sửa hồ sơ/checklist do Claude quản lý; chưa push/gộp vào nhánh chính.
