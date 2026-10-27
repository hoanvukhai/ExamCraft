# Sửa khu quản lý giáo viên — thùng rác, ngân hàng và điều hướng

Ngày 27/10/2026. Trạng thái **WAITING_REVIEW**. Thực hiện theo phân tích đã được chủ dự án duyệt tại [PHAN_TICH.md](../teacher-ui-audit/PHAN_TICH.md).

Mã và test: **52b0af0**, bổ sung **1341eeb**; nền trước đợt sửa **9283de2**. Bản sản phẩm cuối: **Y9AvBfJPLDZK2xdngW8ix**. Server thử localhost:3117, health xác nhận `isolatedTest=true`, chỉ DB `examcraft_test_20261022`, AI thật tắt.

## Đã sửa

| Nhóm | Kết quả |
|---|---|
| Thùng rác | Nút có chữ **Khôi phục** và biểu tượng khôi phục đúng nghĩa ở cả thẻ/bảng. Bỏ banner tạo/sinh/nhập đề và nháp khỏi nội dung thùng rác; không mở đề đã xóa vào editor, không nhân bản/tải Word/đổi tên/chuyển thư mục/đánh sao ở đây. Có ngày xóa. |
| Xóa, khôi phục và phản hồi | Chuyển vào thùng rác có hộp xác nhận dùng chung, hủy không ghi. Chặn bấm lặp; lỗi mạng/phiên bản được báo, không tự báo thành công. Khôi phục thất bại giữ bản ghi đã xóa để thử lại. Lỗi tải kho có trạng thái riêng và nút thử lại. Xóa thư mục cũng dùng xác nhận và báo lỗi non-OK, không im lặng. |
| Ngân hàng | Có trang `/teacher/questions` để quản lý. Trong editor chỉ mở bộ chọn câu, vẫn có đường mở trang quản lý ở tab riêng để giữ bản đang soạn. Trang quản lý không còn nút chèn vô hiệu hoặc nút nạp mẫu được gọi là “chuẩn”. Các câu đã lưu trước đó không bị xóa. |
| Dữ liệu câu | Cả kho riêng và dùng chung đi qua cùng bộ chuẩn hóa enum/payload. Hiển thị/chèn giữ phương án, đáp án, lời giải, điểm, ngữ liệu và hình; đủ bảy nhãn dạng câu. Không ép độ khó cũ thành nhận thức mới. |
| Phân trang và bộ lọc | Cả hai kho đọc trang/lọc trên server, có tổng số và điều khiển trang; không chỉ lọc trong trang đầu của kho dùng chung. Bộ lọc trang quản lý được giữ qua URL khi tải lại/quay về; bộ chọn trong editor giữ ngữ cảnh cục bộ. Kết quả/tổng số chỉ được hiện khi thuộc đúng truy vấn đã nhận, tránh nháy dữ liệu trước khi đổi bộ lọc. |
| Không gian giáo viên | Khung/điều hướng chung giữa kho đề, ngân hàng, lớp, bài đã giao và thùng rác; teacher layout kiểm đăng nhập/đổi mật khẩu. Giữ bàn soạn riêng theo nhiệm vụ. Đồng bộ nhãn **Bài đã giao**, đường về **Kho đề**, tên môn tiếng Việt và trường chọn môn/lớp. |
| Ngữ cảnh khảo thí | Đi từ kết quả một đề sang danh sách bài giao lọc theo đề đó; API vẫn giới hạn chủ sở hữu. Có phân biệt lỗi tải, danh sách trống và tìm không khớp. Nhãn lưu trữ không còn bị gộp thành đã đóng. |
| Lớp học | Không lấy học sinh của lớp trước để hiện dưới tên lớp mới. Chốt phản hồi theo lớp và lượt yêu cầu; đóng/đổi lớp vô hiệu phản hồi cũ. Lỗi tải học sinh có báo lỗi/thử lại, PIN của lớp trước được bỏ khỏi màn hình khi đổi lớp. |
| Kho đề và điện thoại | Giữ view/thư mục/môn/lớp/tìm kiếm/trang trong URL. “Gần đây” thực sự lọc các đề sửa trong30 ngày. Tìm kiếm nói đúng phạm vi tên đề. Thẻ/bảng có đổi tên/chuyển thư mục; bảng chuyển thành thẻ có hành động tại chỗ trên điện thoại. Sửa tràn trường chọn môn, nhãn ngày xóa và số câu lặp. |

## Bằng chứng và kiểm tra

| Kiểm | Kết quả / tệp |
|---|---|
| Build cuối, CPU1/heap1024 | Đạt, gồm kiểm kiểu; [build.log](build.log) |
| Kiểm kiểu riêng | Đạt, [typecheck.log](typecheck.log) |
| Lint phạm vi sửa | Đạt không lỗi/cảnh báo, [scoped-lint.log](scoped-lint.log), lượt bổ sung [final-lint.log](final-lint.log) |
| Lint toàn repo | Không lỗi; còn120 cảnh báo toàn repo ở lượt ghi nhận, không dọn lan sang phần ngoài phạm vi; [lint.log](lint.log) |
| SAFE | Unit20/20 và Node498/498 đạt; [safe.log](safe.log). Chạy trước lượt bổ sung khóa ngữ cảnh truy vấn/xác nhận thư mục; các bổ sung này được kiểm bằng E2E trên build cuối. |
| `npm run test:teacher` | 6/6 đạt gồm test cha; [browser.log](browser.log), [cleanup.json](cleanup.json). Bản cuối Y9AvBfJPLDZK2xdngW8ix. |
| F19 kho đề | Đạt trên bản cuối: tìm, sao, gần đây, xóa/khôi phục, mở/quay lại, thẻ/bảng, đổi tên, nhân bản, tạo/chuyển thư mục, các điểm mở an toàn; [pilot-F19.log](pilot-F19.log), chi tiết trong [pilot](pilot/). |
| F3 Word/công thức/song song/in | Đạt; [pilot-F3.log](pilot-F3.log). Kiểm hồi quy trên G-ANRR-A71qJf91p8iXU3 trước các bổ sung ngữ cảnh ngân hàng/xác nhận thư mục; phần xuất/in không bị thay đổi sau lượt này. |
| Font tiếng Việt và zoom/in | 4/4 đạt gồm test cha; [typography.log](typography.log), [typography](typography/). Không ghi đè hồ sơ đợt font trước. |
| Admin | 11/11 đạt gồm test cha; [admin.log](admin.log), [admin](admin/). Giữ phân trang, trạng thái hoạt động xanh và chính sách không cap AI theo ngày. |

Luồng E2E mới kiểm trực tiếp:

- Hủy chuyển đề vào thùng rác: toàn bộ bản ghi không đổi. Xóa mềm/khôi phục: nội dung giữ nguyên, version tăng đúng; bấm lặp chỉ gửi một yêu cầu; mất mạng không khôi phục giả. Chế độ bảng trên điện thoại có nút đúng nghĩa.
- Hủy xóa thư mục và lỗi máy chủ: thư mục vẫn tồn tại, lỗi hiện rõ. Không thử xóa vĩnh viễn dữ liệu.
- Kho dùng chung23 câu: lấy20 câu ở trang đầu,3 câu trang sau; tải lại giữ trang; lọc được toàn bộ kết quả, đọc phương án/đáp án/lời giải từ payload đúng. Lỗi mạng không bị báo là không có câu.
- Không có nút xóa câu của người khác; API từ chối xóa nguồn của người khác. Đổi tài khoản trong tab cũ không xóa được câu của tài khoản trước. Hủy xóa câu không ghi, xóa thành công có thông báo.
- Chèn câu dùng chung vào đề, lưu và mở lại: đúng dạng câu, phương án, đáp án và lời giải. Fixture có điểm để kiểm cả giao bài, không bỏ qua kiểm điểm của sản phẩm.
- Lỗi tải lớp B không hiện học sinh lớp A; phản hồi lớp A đến muộn không ghi đè lớp B. Danh sách bài giao theo đề không lẫn bài của đề khác; lỗi tải không giả làm danh sách trống.
- Màn hình320×740,375×812,568×320 và1440×1000; sáng/tối được chuyển bằng nút thật. Kiểm trang không tràn ngang và từng trường nhập/chọn nằm trong khung, không chỉ dựa vào scrollWidth toàn trang.

Ảnh đã xem trực tiếp: [thùng rác có đề trên375px](trash-with-record-375.png), [bảng kho đề trên375px](library-table-375-light.png), [câu dùng chung trên375px](shared-question-375.png), [lớp học](groups-1440-light.png), [bài giao nằm ngang/tối](assignments-568-dark.png). Các biến thể khác nằm cùng thư mục.

## Lưu ý kiểm thử và giới hạn

- Đợt bổ sung phát hiện nháy tổng số/danh sách cũ khi đổi bộ lọc; đã sửa bằng gắn dữ liệu và trạng thái tải với đúng truy vấn. Không nới kỳ vọng số câu để cho test qua.
- Sửa bộ kiểm cũ theo hành vi đã duyệt: xác nhận HTML thay native confirm; ngân hàng mở trang quản lý; tìm kiếm đổi tên đúng phạm vi. F19 còn kỳ vọng thông báo trợ lý “đang phát triển” đã lỗi thời so với component hiện có: đổi thành kiểm mở/đóng drawer, không gửi AI hoặc suy ra chất lượng AI đã đạt.
- Một lượt ghi báo cáo F19 dùng sai thư mục con và bị guard từ chối; giữ guard, chỉ cho cấu hình thư mục gốc QA theo ngày. Artifact được gom về `pilot/` sau khi chạy, không ghi lại QA25 có sẵn. Các JSON/ảnh lỗi cũ được giữ để truy vết; bảng kết quả trên chỉ lượt cuối tương ứng.
- Phone là mô phỏng Chrome cài sẵn, chưa điện thoại thật/Safari, chưa Word native/in giấy. Không khẳng định đã kiểm mọi tổ hợp nghiệp vụ hoặc mọi lỗi còn tồn tại trong dự án.
- Không thêm xóa vĩnh viễn hoặc tự dọn câu/ảnh/đề cũ. Chi tiết lớp/chấm bài và một số tác vụ ngắn vẫn dùng popup phù hợp; không biến mọi popup thành trang. Trang ngân hàng giữ luồng tạo/biên soạn câu từ bàn soạn; không mở thêm hệ biên tập ngân hàng độc lập trong đợt này.
- Các khung nhận thức/độ khó vẫn cần ngữ cảnh chuyên môn và nguồn áp dụng; không dùng việc sửa UI để chứng nhận mẫu hay nội dung “chuẩn”.

## Bảo toàn và bàn giao

Test kiểm health và `current_database()` đúng DB thử trước khi tạo fixture. Dọn theo ID/owner riêng; không xóa tài khoản/đề có sẵn, không ghi DB chính, không migration, không gọi provider thật, không chép key/cookie/.env vào báo cáo. Giữ các thay đổi QA25/scratch/tmp đã có ngoài commit. Không push/reset/clean, không sửa ASSIGNMENTS/BATCH_REVIEWS, không tự đóng CV hoặc ghi đè hồ sơ02/checklist03 của Claude.

Server cuối giữ cho chủ dự án xem; LOCK3117 trả USER, AI thật tắt. Chủ dự án tải lại trang để thử; Claude duyệt mã/bằng chứng và cập nhật hồ sơ chính theo quyền đã giao. Báo cáo này là bằng chứng của một đợt sửa, không thay checklist dự án.
