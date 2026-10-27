# Gộp thư mục và đề thành trang chính

Ngày 28/10/2026. Yêu cầu chủ dự án đã duyệt theo [phân tích](../library-direction/PHAN_TICH_GOP_KHO_VA_THU_MUC.md). Mốc bắt đầu `09def75`; commit mã và kiểm `2681af8`. Chỉ sửa phạm vi kho đề/điều hướng/ngữ cảnh tạo mới, giữ khung Workspace mới và các thay đổi thùng rác của chủ dự án.

## Kết quả cho người dùng

- **Kho đề** là trang chính: thư mục ở trên, đề tại vị trí đang mở ở dưới. Tạo đề ngay ngoài thư mục hoặc trong thư mục đều được; không bắt buộc tạo thư mục trước.
- **Tất cả / Đã sửa gần đây / Gắn sao** nằm trong trang. Ở trang gốc, gần đây/gắn sao và tìm kiếm bao quát đề xuyên thư mục; trong thư mục giữ phạm vi thư mục đó. Đề do đồng nghiệp mời xem vẫn hiện ở gốc; không lộ thư mục riêng của họ.
- Menu giáo viên còn **Kho đề, Ngân hàng câu hỏi, Lớp học, Bài đã giao, Thùng rác**. Các nhóm hiển thị thẳng, không xổ; vẫn có nút thu toàn menu thành biểu tượng. Điện thoại dùng cùng danh sách.
- Thư mục có đường dẫn quay về, thư mục con, sửa tên/màu, tạo/xóa; danh sách đề dùng phân trang đầy đủ. Liên kết `/teacher/folders?folder=...` cũ chuyển về vị trí tương ứng ở trang chính.
- Tạo thủ công, nhận đề xuất AI và nhập Word/ảnh mang theo thư mục đang mở. Vị trí chỉ gửi ở lần tạo mới; lưu đề đã có không tự đổi thư mục. Đổi vị trí của bản nháp cũ không diễn ra ngầm.
- Nếu thư mục bị xóa trước lần lưu đầu, bản nháp vẫn giữ, có nút **Lưu bản nháp ở ngoài thư mục** để người dùng chủ động chọn.

## Mã và dữ liệu

- Tách thẻ/đường dẫn/hộp sửa thư mục thành `LibraryFolders`; dùng chung `TeacherDashboard` thay cho hai màn quản lý trùng nhau. Cắt các banner tạo đề lớn thành nút gọn, bỏ nút tạo trùng ở trạng thái rỗng.
- Thêm trạng thái tải/lỗi thư mục và chặn phản hồi cũ. Kết quả đề gắn với bộ lọc hiện tại, tránh hiện hàng/tổng của vị trí trước trong lúc đang tải. Cập nhật số đề trong thẻ thư mục khi quay về từ bàn soạn.
- API bổ sung lọc vị trí gốc, vẫn giao với quyền sở hữu/cộng tác sẵn có; không thay hành vi truy vấn mặc định. Sắp xếp có khóa phụ ID để phân trang không mất/trùng các đề cùng thời gian sửa.
- `creationFolderId` chỉ là ngữ cảnh bản nháp, tách khỏi tài liệu gửi server; không thêm cột/bảng/migration. Thư mục của tài khoản khác tiếp tục bị từ chối.
- Bộ kiểm phát hiện một lỗi phát sinh lúc bỏ query thư mục sau lưu: hook có thể khởi tạo thêm bản nháp trống. Đã sửa nhận diện địa chỉ đề vừa lưu và kiểm chống tạo thêm trong cửa sổ tự lưu. Không xóa hay quét sửa nháp của người dùng.
- Không ghi DB chính, không đổi key/cookie/.env/khóa mã hóa. Các thao tác ghi kiểm thử chỉ trên `examcraft_test_20261022` sau health `isolatedTest=true` và đối chiếu SQL tên DB; fixture được dọn theo ID/tài khoản riêng. Không tải trình duyệt, dùng Chrome có sẵn; không gọi provider thật.

## Bằng chứng bản cuối

Bản production kiểm: `w0G2dmRUKY14u_VMa2WWW`. CPU build=1, heap=1024; không chạy SAFE/lint cùng build.

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Build production gồm TypeScript | Đạt | [build.log](build.log) |
| Lint tệp liên quan | Không lỗi; 15 cảnh báo có sẵn trong ExamWorkspace/ImportModal; hook và kiểm bổ sung sạch | [lint-final.log](lint-final.log), [lint-ack.log](lint-ack.log) |
| SAFE và kiểm vị trí tạo mới | 500/500 đạt trong runner; lệnh cũng chạy bộ unit nền | [safe.log](safe.log) |
| `npm run test:library` | 6/6 đạt, gồm nhóm cha | [browser.log](browser.log), [cleanup.json](cleanup.json) |
| `npm run test:teacher` | 7/7 đạt, gồm nhóm cha | [teacher.log](teacher.log), [dọn fixture](teacher/cleanup.json) |
| Hồi quy F19 | Đạt, đã dọn fixture | [F19.log](F19.log), [pilot-results.json](pilot-results.json), [thao tác UI](library-ui-855b64e6-b95d-4a19-b435-786ec888b02a.json) |

Kiểm mới bao gồm: thực đơn đúng năm đích và không xổ; đề gốc/đề được mời; thư mục 53 đề duyệt đủ 20/20/13 với thời gian sửa giống nhau; gắn/bỏ sao và gần đây theo phạm vi; tìm xuyên thư mục; liên kết cũ/quay lại; tạo thủ công/AI giả/nhập văn bản đúng vị trí; cấm thư mục người khác; không đổi metadata/vị trí fixture gốc; không sinh đề trống sau lưu; cứu nháp ở thư mục đã xóa; thư mục không tồn tại không cho tạo nhầm.

Hồi quy teacher/F19 gồm: hủy/xóa/khôi phục/lỗi mạng/thử lại, xóa vĩnh viễn và đề đã giao bị chặn, ngân hàng phân trang/nhập câu đầy đủ, lớp/bài giao không dùng nhầm ngữ cảnh cũ, tìm/đổi tên/nhân bản/di chuyển, xem thẻ/danh sách, tải Word giữ nội dung, mở/đóng các hộp thoại.

Điện thoại mô phỏng Chrome ở 320, 375 và 568 ngang; desktop 1440. Hai giao diện sáng/tối, không tràn chiều ngang; kiểm các trang kho/thùng rác/ngân hàng/lớp/bài giao. Đã mở xem ảnh bản cuối, chỉnh biểu tượng thư mục tối cho dễ thấy. Ví dụ: [gốc desktop](home-1440-light.png), [thư mục điện thoại tối](folder-375-dark.png), [thẻ gốc điện thoại](home-375-light.png); các ảnh hồi quy trong [teacher/](teacher/).

## Giới hạn và tiếp nối

- Đây là kiểm bằng trình duyệt desktop với kích thước điện thoại; chủ dự án vẫn nên xem thao tác cảm ứng trên điện thoại thật.
- Gần đây giữ quy tắc sẵn có 30 ngày. Thư mục giữ giới hạn hai tầng sẵn có; không mở mô hình dự án mới. Gắn sao là thuộc tính đề của chủ sở hữu, không mở thêm sao riêng cho người được mời.
- Luồng AI dùng phản hồi giả trong browser; nhập văn bản dùng parser cục bộ. Không tuyên bố đã kiểm chất lượng AI hay mọi định dạng nhập mới; việc này không đổi parser/OCR/provider.
- Thử khởi đầu có lỗi bộ chọn trùng phần ẩn và phát hiện lỗi hook kể trên; đã sửa và chạy lại trên bản cuối. Log debug khởi đầu không đại diện nghiệm thu; kết quả cuối trong bảng trên.
- Server thử local3117 đang giữ bản cuối, AI thật tắt; khóa phối hợp chuyển USER. Không build đè khi chủ dự án đang xem. Không tự đóng CV hay sửa hồ sơ02/checklist/ASSIGNMENTS/BATCH_REVIEWS; chờ duyệt.
- QA25/scratch/tmp có sẵn được giữ ngoài nhóm thay đổi. Không push/reset/clean.
