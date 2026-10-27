# Dọn cấu trúc admin và các phần thiết kế cũ còn sót

27/10/2026. Chủ dự án đã duyệt triển khai sau bản phân tích `../ui-page-review/PHAN_TICH_TRANG_VA_ADMIN.md`. Nền Git: `2bad395`. Phạm vi: giao diện admin, nguồn và ý nghĩa số liệu, nhãn bài giao, popup Thư ký, nội dung giới thiệu cũ và đề mẫu kỹ thuật.

## Đã thay đổi

| Vấn đề trước đây | Cách xử lý |
|---|---|
| Ba trang admin dùng ba khung khác nhau | Dùng chung `AdminShell` và layout admin. Điều hướng luôn có chữ Tài khoản / Cấp khóa AI / Hoạt động AI, có trạng thái mục đang xem, theme, về kho đề và đăng xuất. Header không cố định chiếm phần lớn chiều cao điện thoại ngang. |
| Kiểm quyền ở UI rời rạc | Layout kiểm phiên/vai trò trên server; chưa đăng nhập về login, giáo viên về kho đề, tài khoản cần đổi mật khẩu về bước đổi. API vẫn giữ kiểm quyền riêng. Đăng xuất vẫn chờ xác nhận máy chủ và gửi ID tài khoản dự kiến. |
| Thẻ “7 Gemini Keys”, pool cũ và nút reset dễ gây hiểu nhầm | Mặt chính Hoạt động AI dùng thống kê `userApiKey` và `aiUsageLog` hiện hành; bỏ các thẻ và nút kích hoạt pool cũ khỏi UI. Không chỉ đổi số7 thành độ dài bảng cũ. |
| Lẫn số bản khóa, số khóa thật và quota | Tách số đã lưu/đang bật/tự thêm/được cấp. Giải thích đếm theo từng người nhận, không coi số bản ghi là số khóa provider độc lập hoặc hạn mức còn lại. Không hiển thị giá trị khóa. |
| 0 lượt nhưng 100% thành công | Khi chưa có lượt kết thúc: không tính tỷ lệ. Các lượt chưa có kết quả tách riêng; mẫu số tỷ lệ chỉ gồm lượt đã kết thúc. Không giả định bản ghi chưa hoàn tất chắc chắn đang chạy. |
| Tên kỹ thuật và trạng thái lỗi khó hiểu | Nhật ký dùng tên công việc dễ đọc, tách thành công/chưa thành công/chưa có kết quả. Endpoint/mã HTTP/độ trễ nằm trong Chi tiết kỹ thuật. Có vùng báo lỗi tải và giữ rõ lần dữ liệu gần nhất, có nút thử lại. |
| Bảng tài khoản phải kéo ngang để tìm thao tác | Điện thoại hiển thị từng hàng theo khối hai cột, có nhãn thông tin và thao tác ngay trong khối. Vùng bấm ít nhất40px; email xuống dòng. Desktop vẫn giữ bảng. Có lọc vai trò và số tài khoản đang hiện. |
| Tên “giáo viên” nhưng danh sách có quản trị viên | Trang chính gọi Tài khoản, có phân loại vai trò. Trang cấp khóa gọi người nhận là tài khoản, giữ phạm vi/điều kiện cấp hiện có, không tự thu hẹp hoặc mở rộng quyền. |
| Hộp xác nhận kiểu trình duyệt khác giao diện | Khóa/mở tài khoản và thu hồi khóa dùng cùng dialog theo theme. Nút mặc định Hủy; hỗ trợ Escape; hủy/unmount không thực hiện thao tác. Các lỗi thao tác tài khoản hiển thị trong trang. |
| Popup Thư ký “sắp ra mắt” mở cùng drawer thật | Bỏ mount popup giới thiệu cũ; giữ một drawer hiện hành và các đường mở cũ. Không tự thêm quyền dọn dữ liệu hay gọi AI. Bỏ lời hứa giảm80% cùng popup. |
| CLASSWORK bị gọi thành bài về nhà | Dùng chung nhãn theo enum hiện hành: Bài về nhà / Làm trên lớp / Bài kiểm tra. Mode lạ có nhãn trung tính, không tự coi là bài về nhà. |
| “Lượt đã nộp” đếm cả lượt đang làm | GET danh sách bài giao chỉ đếm attempts trạng thái SUBMITTED cho trường `_count.attempts` mà nhãn sử dụng. Chưa đổi dữ liệu attempt hoặc cơ chế chấm/nộp. |
| Câu chữ/phiên bản giới thiệu cũ | Rút gọn tiêu đề lớp, bài đã giao, đăng nhập; nút chọn đề để giao nói đúng nơi đến. Link thi cũ được gọi đúng là link cũ, vẫn chặn an toàn và không tự đoán liên kết thay thế. |
| Đề mẫu kỹ thuật bị mojibake | Sửa chuỗi tiếng Việt trong JSON mẫu Toán6; giữ ID, dạng câu, số và cấu trúc. Có dấu vết hash/số chuỗi trong `fixture-encoding.json` và kiểm hồi quy. Không chạy giải mã hoặc sửa tài liệu đã lưu của giáo viên. |

## Bảo toàn và tương thích

- Không mở schema/migration, không xóa `aiKeyState` hoặc lịch sử cũ. GET admin AI vẫn giữ trường `keyStates` cho bên dùng API cũ; UI mới không coi nó là nguồn khóa hiện hành. POST reset cũ còn được kiểm quyền, thông báo đã nói rõ chỉ đặt lại theo dõi cũ, không bật khóa tài khoản.
- Không thay provider/model, không gọi AI thật và không diễn giải quota ứng dụng thành quota Google. Không chạm DB chính, tệp khóa mã hóa, `.env`, cookie hoặc backup.
- Kiểm ghi chỉ chạy khi `isolatedTest=true` và DB chính xác `examcraft_test_20261022`. Tài khoản, log và khóa giả của đợt có ID ngẫu nhiên riêng; khởi tạo/dọn theo đúng ID. Không khóa, cấp hoặc thu hồi của người dùng có sẵn.
- Không xóa ghi chú/chat Thư ký; chỉ bỏ giao diện giới thiệu cũ bị mount trùng. Không tự sửa đề đã lưu dù nội dung cũ có thể đang lỗi mã hóa.

## Kiểm chứng

- TypeScript exit0 (`typecheck.log`); lint exit0, 0 lỗi/153 cảnh báo hiện có (`lint.log`). Build cuối exit0, `NEXT_BUILD_CPUS=1`, heap1024, ID **1ZWZ1zCtmRFAecwocOjjy** (`build.log`). `git diff --check` đạt.
- `npm run test:safe` exit0; phần TAP cuối497 đạt/0 lỗi (`safe.log`), có kiểm hồi quy số liệu, nhãn mode và mã hóa đề mẫu. Unit riêng trước đó đạt22 (`unit.log`); không cộng chồng các số này.
- `npm run test:admin` exit0,9 test tính cả nhóm bao ngoài (`admin-browser.log`). Kiểm: anonymous401/teacher403 và layout chuyển giáo viên về kho; nguồn số liệu/không lộ khóa; CLASSWORK/đếm đúng SUBMITTED; lọc vai trò; hủy và xác nhận khóa/mở đúng tài khoản; mất kết nối giữ rõ snapshot cũ rồi tải lại; thu hồi một người không mất khóa người khác; chỉ một drawer Thư ký; vùng bấm tài khoản40px; không tràn ngang ở các trang admin.
- Cùng bản build cuối, các luồng pilot **F3/F5/F6/F7/F13/F25 đều PASS**: xem/in/Word; giao bài; làm/nộp/reload; chấm và CSV; điện thoại; PIN lớp. Log `pilot-F*.log`. Không sửa assertion của các luồng có sẵn.
- Ảnh admin sáng/tối tại320x568,568x320 và1280x720; ảnh tài khoản/dialog/Thư ký tại375x667. Đã đọc lại ảnh thật, sửa thêm vùng bấm và cách xếp thống kê điện thoại rồi mới chạy kiểm cuối. Đây là kiểm Chrome cài sẵn, không tải trình duyệt; không suy mọi thiết bị/engine đều đã kiểm.
- `cleanup.json` xác nhận dọn các user thử theo đúng ID, ghi cùng build ID. Test dọn khóa/log/bài giao/lớp/đề/câu/ngữ liệu/audit thuộc fixture trước khi xóa user. Các luồng pilot tự dọn fixture riêng. Không giữ khóa thử hoặc tài khoản admin của đợt trong DB.
- Có lỗi kiểm ở mốc giữa: build đầu yêu cầu Suspense quanh đọc phiên trong layout (đã sửa theo guide Next cục bộ, giữ server authorization); selector alert quá rộng trùng route announcer của Next (đã thu đúng thông báo lỗi, không giảm assertion). Giữ `build-prerender-failure.log`, `admin-selector-failure.log`. Không coi chúng là kết quả bản cuối.

## Bàn giao

Mã và kiểm đã hoàn tất trong phạm vi đợt, chờ chủ dự án xem sản phẩm. Giữ server thử3117 chạy bản cuối, bàn giao `LOCK_3117=USER`; không build đè `.next` khi đang xem. Nếu tiến trình dừng giữa các lượt chat, khởi động lại máy chủ thử từ bản build này, không cần build lại chỉ để đọc hồ sơ.

Giữ nguyên QA25/scratch/tmp có sẵn ngoài commit. Báo cáo phân tích cũ là ảnh chụp trước khi sửa; dùng báo cáo này làm trạng thái của đợt đã được duyệt. Gửi điểm nối qua CODEX_STATUS và tin cho Claude, không tự sửa hồ sơ chỉ đạo hoặc đóng CV.

## Chưa suy rộng

Chưa kiểm provider thật, phần trăm quota/chi phí của nhà cung cấp hoặc điện thoại vật lý/bàn phím ảo. Chưa chạy mọi tổ hợp khóa, mạng và nhiều người đồng thời. Các form tạo/đổi mật khẩu kế thừa xử lý hiện có; không đổi mật khẩu thật để nghiệm thu đợt này. Không tự đóng CV hoặc sửa checklist/hồ sơ02 do Claude giữ.
