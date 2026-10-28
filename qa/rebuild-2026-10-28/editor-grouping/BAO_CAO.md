# Gom vùng soạn theo công việc giáo viên — 28/10/2026

Trạng thái: **WAITING_REVIEW**. Mã và kiểm: `5d1fec3`. Tiếp nối bản `27af86a`, giữ sửa Claude `52099b3` và toàn bộ dữ liệu/cấu hình cũ.

## Đã sửa

| Trước | Sau |
|---|---|
| Thiết lập gồm nhiều thẻ ngang hàng | Thông tin và đầu đề chỉ chứa thông tin chung/bố cục; bỏ dãy thẻ cũ |
| Phần và ngữ liệu trong Thiết lập | Nằm dưới Nội dung đề, có vùng thêm/sửa phần và nội dung dùng chung |
| Gắn phần/ngữ liệu bằng danh sách ở nơi khác | Mở tại từng câu; có tên phần và ngữ liệu trước nhóm câu, không tự sắp lại thứ tự |
| Sửa ngữ liệu phải quay lại cấu hình | Có Sửa nội dung dùng chung ngay trên khối ngữ liệu; dùng lại biểu mẫu nguồn/ảnh |
| Phạm vi, ma trận, khung nhận thức rải riêng | Gộp trong Yêu cầu ra đề · tùy chọn, mặc định thu gọn; từng nội dung mở khi cần |
| Mẫu là một thẻ thiết lập | Thêm công cụ → Dùng mẫu / lưu thành mẫu, mở tại cột trái, đóng/mở không mất nội dung đang nhập |

Nội dung dùng chung có thể là văn bản, hình hoặc bảng dữ liệu; phần và ngữ liệu vẫn là hai liên kết riêng, không ép chúng thành một. Không xóa các ngữ liệu chưa gắn câu. Các điều khiển gắn phần/ngữ liệu không xuất hiện ở câu khi đề chưa có cấu trúc nào và không hiển thị biểu mẫu sửa tại thẻ câu chỉ xem.

Giữ việc xem thử thông tin bên phải trước khi Áp dụng. Khung nhận thức chuyển vào Yêu cầu ra đề, lưu qua guard từng trường hiện có; không tự đổi khung/nhãn cũ, không ép chọn khung cho mọi đề. Mẫu tự mở nội dung khi gọi từ menu; không nhầm mẫu cấu hình với nhân bản cả đề.

## Bảo toàn

- Không schema/migration/API hay định dạng lưu mới. Không đổi CAS, nhật ký nháp, cơ chế lưu/khôi phục hoặc BYOK.
- Tên phần cập nhật đúng phần được chọn, giữ các thuộc tính cấu hình khác. Giữ ID và thứ tự câu, nội dung, điểm 0, đáp án, nguồn/ảnh ngữ liệu, dữ liệu ma trận/phạm vi/mẫu hiện có.
- Giữ quy tắc sửa ngữ liệu/liên kết thì câu liên quan cần rà soát lại; không tự xác nhận nội dung đúng. Không cho bỏ phần/ngữ liệu đang được câu sử dụng; handler cũng kiểm lại liên kết hiện tại.
- Các biểu mẫu yêu cầu và mẫu vẫn được mount sau khi đã mở, nên thu gọn/đóng chỉ ẩn, không bỏ nháp chưa áp dụng. Đổi tài khoản/tài liệu tách lại phạm vi phiên.
- Mất quyền sửa khóa các trường mới; vẫn có đường tải nháp câu. Mẫu không xuất hiện trong menu sửa của người chỉ xem.
- Test chỉ trên DB `examcraft_test_20261022`, guard `isolatedTest` và SQL kiểm đích. Không DB chính/provider thật, không key/cookie/.env vào hồ sơ.

## Kiểm nghiệm

Bản production cuối: `n4qu6eyMIwfEAbaa-jL4c`. Tóm tắt máy đọc: [FINAL_VERIFICATION.json](FINAL_VERIFICATION.json).

| Kiểm | Kết quả và bằng chứng |
|---|---|
| Build production/TypeScript | Đạt — [build.log](build.log) |
| Lint tệp thay đổi | Không lỗi/cảnh báo — [lint.log](lint.log) |
| SAFE | 505/505 — [safe.log](safe.log) |
| Kiểm riêng render/nháp/header/kế hoạch | 22/22, đã nằm trong SAFE, không cộng lại — [unit.log](unit.log) |
| Trình duyệt editor | 9/9 gồm test cha — [browser.log](browser.log), [cleanup.json](cleanup.json) |
| F2 | Đạt — [F2.json](F2.json), [F2.log](F2.log): bảy dạng câu, ảnh, điểm 0, liên kết nguồn ngữ liệu, lưu mẫu từ menu, dirty form qua creation ACK, ngân hàng khóa khi sửa |
| F9 | Đạt — [F9.json](F9.json), [F9.log](F9.log): mất mạng/nối lại, nháp theo tài khoản, lưu và sửa tiếp bản sao phục hồi mà không đổi đề gốc |

Bộ kiểm mới xác nhận: sửa ngữ liệu tại nhóm vẫn giữ nguồn/ID/thứ tự câu và điểm; không bỏ ngữ liệu đang dùng; nhập gói kiến thức giả, giữ phương pháp chưa áp dụng khi thu gọn, áp dụng phạm vi, giữ ô kế hoạch nháp khi thu gọn và lưu lại. Bảng mẫu giữ tên đang nhập khi đóng/mở. Giữ toàn bộ kiểm xuất Word, xem trước trực tiếp, tải nháp khi mất quyền và thao tác câu đã có.

Kiểm sáng/tối ở 1440/1024/375/320px và 568px ngang. Các vùng yêu cầu có gói/ma trận và mẫu được kiểm chiều rộng bên trong ở 320/375px, đã xem ảnh: [Yêu cầu 320px](requirements-320.png), [Mẫu 320px](template-320.png). Ảnh rich/settings/empty cùng thư mục.

Các lượt chẩn đoán trong `chay-tho/` không phải bằng chứng nghiệm thu: lượt đầu gặp máy chủ cũ giữ cổng, đã dừng đúng máy chủ thử; fixture riêng của lượt bị ngắt được đối chiếu ID/thời điểm rồi dọn, có `aborted-fixtures.json`. Kiểm ban đầu đếm cả textarea sửa đang ẩn như một bản ngữ liệu; đã sửa bộ kiểm đếm bản hiển thị, không bỏ kiểm nguồn/thứ tự. Ô phương pháp giữ dữ liệu nhưng tên truy cập thay đổi theo nội dung textarea; đã thêm tên ổn định và sửa chiều rộng ô chọn tệp, rồi kiểm lại thành công trên build cuối.

## Giới hạn và bước tiếp

- Điện thoại là Chrome mô phỏng; chưa kiểm cảm ứng/bàn phím ảo trên máy thật. Word kiểm cấu trúc DOCX, chưa Word desktop/in giấy. Không chứng nhận chuyên môn hoặc chất lượng AI.
- Gói kiến thức, ma trận và mẫu vẫn dùng logic hiện có; cách gom mới không biến chúng thành tài liệu đã duyệt. Chưa thay mô hình Cách đánh giá/mục đích bài hoặc thêm gói kiến thức đủ mọi môn/lớp.
- Thông tin chưa Áp dụng vẫn chỉ giữ trong phiên biểu mẫu như đợt trước; chưa cam kết phục hồi sau tải lại. Nháp câu dùng nhật ký cũ.
- Claude duyệt mã/bằng chứng; chủ dự án xem thao tác thực tế. Không tự đóng CV, không sửa checklist03/hồ sơ02/ASSIGNMENTS/BATCH_REVIEWS.
