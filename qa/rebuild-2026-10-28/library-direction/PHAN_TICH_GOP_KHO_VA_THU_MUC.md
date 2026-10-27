# Gộp trang thư mục và đề thành trang chính

Ngày 28/10/2026. Chỉ phân tích theo yêu cầu mới, chưa sửa mã/build/test/DB. Mốc đã đọc: HEAD `09def75`; giữ nguyên thay đổi và dữ liệu có sẵn.

## Đã đọc các thay đổi mới

So với đợt Codex trước, mã hiện tại đã có:

- Nhóm route `(workspace)` và `WorkspaceShell/Context/Menu/Rail`: khung chung, menu trái/thanh phải, bỏ thanh ngang desktop; điện thoại dùng điều hướng hẹp riêng.
- Bàn soạn dùng thanh công cụ ngang và khung chung; admin cũng nằm trong khung này.
- Trang lớp, bài giao, ngân hàng dùng PageBody/PageHeader/FilterBar/Panel/EmptyState chung; có sửa icon tìm kiếm, empty state và quy tắc màu.
- Trang `/teacher/folders` mới: thẻ thư mục, đi vào thư mục con, sửa/xóa/tạo thư mục và danh sách đề bên trong.
- Thùng rác đã bổ sung xóa vĩnh viễn có kiểm điều kiện đề đã giao; đây là thay đổi mới cần giữ, không quay lại giả định của báo cáo cũ rằng chưa có chức năng này.
- Có lệnh chạy server thử và các kiểm đã được chỉnh theo giao diện mới. Đợt đọc này không chạy lại hoặc suy nghiệm thu từ tên commit.

Nguồn chính đã đối chiếu: `src/components/workspace/WorkspaceMenu.tsx`, `WorkspaceShell.tsx`, `WorkspaceContext.tsx`, `src/app/(workspace)/teacher/folders/page.tsx`, `src/components/TeacherDashboard.tsx`, API thư mục và đề. Báo cáo thiết kế cũ được dùng làm bối cảnh, yêu cầu hôm nay quyết định hướng mới.

## Điểm hiện tại chưa khớp ý mới

1. Menu vẫn tách **Tất cả đề thi** và **Thư mục**, thêm mục Gắn sao/Gần đây riêng và các nhóm có mũi tên đóng/mở. Người dùng phải hiểu hai cách đi tới cùng một đề.
2. Trang thư mục gốc mới hiện thư mục; chỉ khi vào thư mục mới có danh sách đề. Trong kho đề lại có bộ chọn thư mục. Chưa có trang chính bao quát cả hai loại đối tượng.
3. Trang thư mục rỗng vẫn hướng dẫn quay về Kho đề để tạo/mở rồi chuyển đề vào. Chưa tạo đề ngay trong thư mục đang xem.
4. `FolderExams` hiện gọi `limit=50`, không nối điều khiển phân trang; không nên lấy nguyên danh sách rút gọn này làm nền trang chính rồi bỏ sót các đề ở trang sau.
5. Nhóm **Thư mục gần đây** lấy `folders.slice(0,5)`, trong khi API sắp thư mục theo tên. Đó là năm thư mục đầu theo tên, chưa phải lịch sử truy cập/chỉnh sửa gần đây.

## Hướng đề xuất cụ thể

### Một trang chính, hai loại nội dung

Giữ điểm vào `/`, một mục menu **Kho đề**; tiêu đề trang có thể ghi **Thư mục và đề thi**. Gộp hai nơi quản lý thành một trải nghiệm, không tạo thêm một đối tượng DB tên Dự án.

- Tại gốc: hiện các thẻ thư mục gốc và các đề nằm trực tiếp ở gốc. Thư mục có thể được đặt tên tự do: Toán6, Học kỳ1, Ôn HSG, Dự án của tổ… Giáo viên tự tổ chức, không ép mọi thư mục là môn học.
- Vào một thư mục: cùng bố cục, hiện thư mục con và đề thuộc đúng thư mục đó; có đường dẫn bấm quay về cấp trên.
- Các đề trong thư mục không bị nhân thành một file khác khi xem qua tìm kiếm/Gần đây/Gắn sao. Đó là các cách nhìn cùng một bản ghi, giữ nguyên ID/quyền/lịch sử.
- Phân biệt rõ màn gốc với kết quả tìm toàn kho: tìm toàn kho có thể trả đề nằm sâu kèm đường dẫn. Không gọi danh sách chỉ các đề ở gốc là toàn bộ đề của tài khoản.
- Đề được đồng nghiệp chia sẻ vẫn phải có chỗ nhìn thấy và nhãn quyền rõ. Không vì chuyển màn gốc sang “đề chưa xếp thư mục” mà làm biến mất các đề được mời cộng tác.

### Không bắt tạo thư mục trước

Cho phép tạo đề ngay để giáo viên bắt đầu nhanh. Tạo tại gốc thì đề ở gốc; có thể chuyển vào thư mục sau. Tạo khi đang ở trong thư mục thì đề mới tự thuộc thư mục đó, đồng thời vẫn kiểm quyền sở hữu thư mục ở server.

Không tự gom đề cũ vào thư mục mới, không đổi tên cấu trúc dữ liệu, không ép người dùng dọn kho trước khi dùng. Giữ quan hệ `folderId` hiện có; bối cảnh tạo phải đi qua cả tạo thủ công, AI và nhập file để tránh tạo xong lại rơi ra gốc.

### Gần đây và gắn sao chuyển vào trang chính

Trên trang chính dùng hàng lựa chọn ngắn **Tất cả · Đã sửa gần đây · Gắn sao**. Hai mục sau không cần chiếm thêm hàng trong menu trái.

- Đã sửa gần đây: giữ nghĩa theo `updatedAt`, hiện xuyên các thư mục kèm tên/đường dẫn. Không gọi đó là “vừa mở” vì chưa có lịch sử mở làm căn cứ.
- Gắn sao: đặt ngay trên thẻ/hàng đề ở trang quản lý. Trong bàn soạn có thể bật/tắt cạnh tên đề, nhưng vẫn cùng một trạng thái. Hai nơi không tạo hai kiểu sao.
- Gắn sao không di chuyển hay sao chép đề. Chưa cần thêm sao cho thư mục trong đợt gộp này. Cơ chế hiện có là cờ của đề thuộc chủ sở hữu; không tự dùng nó để cấp quyền sửa đề cộng tác hoặc giả thành yêu thích riêng của từng người.
- Khi đang trong thư mục, mặc định giữ phạm vi thư mục; nếu cho mở Gần đây/Gắn sao toàn kho thì nhãn/đường dẫn phải thể hiện đã chuyển phạm vi, không âm thầm trộn hai tập dữ liệu.

### Menu ít mục, hiển thị thẳng

Giữ nhãn nhóm tĩnh nếu cần, bỏ nút mũi tên đóng/mở nhóm:

| Nhóm | Điểm đến |
|---|---|
| Soạn đề | Kho đề; Ngân hàng câu hỏi |
| Khảo thí & Lớp | Lớp học; Bài đã giao |
| Khác | Thùng rác |

Quản trị chỉ hiện theo quyền như hiện tại. Các tiện ích tài khoản/AI vẫn ở thanh phải đã có; không đưa trở lại một thanh đầu trang khác. Thu gọn toàn menu thành icon vẫn có thể giữ để có diện tích soạn thảo; việc này khác với xổ từng nhóm ít mục.

**Ngân hàng câu hỏi tiếp tục nằm trong nhóm Soạn đề**: trang riêng để quản lý, bộ chọn gọn để chèn khi đang ở bàn soạn. Không gộp các câu ngân hàng vào danh sách file đề.

Bỏ cây/nhóm thư mục gần đây lặp trên menu ở đợt này; người dùng đi qua thẻ thư mục trên trang chính. Các bộ chọn môn/lớp trong form vẫn giữ khi có tác dụng; yêu cầu giảm menu xổ không được suy thành xóa mọi select của ứng dụng.

## Phạm vi thực hiện nếu chốt hướng

1. Tận dụng khung Workspace mới và các thành phần UI mới; không quay lại Dashboard có sidebar/top bar riêng của bản cũ.
2. Hợp nhất danh sách thư mục + danh sách đề có phân trang, các trạng thái tải/lỗi/trống và đường dẫn cấp thư mục. Gỡ đường vòng “về Kho đề để chuyển vào đây”.
3. Rút gọn một nguồn menu chung cho desktop/mobile; chuyển Gần đây/Gắn sao thành lựa chọn trên trang chính; bỏ các nhóm xổ và nhóm thư mục giả gần đây.
4. Truyền vị trí tạo đề xuyên thủ công/AI/nhập; giữ ID, folderId, quyền, CAS, cộng tác, thùng rác và các điều kiện xóa vĩnh viễn hiện có.
5. Giữ liên kết cũ `/teacher/folders?folder=...` và `/?folder=...` bằng ánh xạ về màn hợp nhất, không làm mất bookmark/đường quay lại. Giữ các URL view cũ như lối vào tương thích dù đã gỡ khỏi menu.
6. Kiểm đề cũ ở gốc/trong thư mục, thư mục con, cộng tác, tạo tại vị trí hiện tại, chuyển thư mục, sao đồng bộ, gần đây xuyên thư mục, hơn một trang dữ liệu, tìm kiếm, điện thoại và lịch sử quay lại.

Đây chủ yếu là gộp menu và trang quản lý, không phải làm lại khung giao diện hoặc đổi DB. Không có căn cứ để hứa chỉ sửa vài dòng vì cần kiểm cả vị trí tạo và truy vấn phân trang. Chưa sửa mã hoặc chạy test trong đợt phân tích này; chờ chủ dự án chốt cách tổ chức.
