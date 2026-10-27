# Thống nhất menu và hai thanh trợ lý

Ngày 28/10/2026. Thực hiện theo yêu cầu mới của chủ dự án. Đã đọc commit Claude `7d95594` và `library-direction/DANH_GIA_DON_GIAN_HOA.md`: giữ việc xóa CopilotBar chết, dùng hộp khóa chung và bỏ nút tạo trùng ở Kho đề. Commit mã/kiểm đợt này: `f467523`.

## Phân tích và lựa chọn

1. **Menu trái tự thu do mã chủ động tách bàn soạn ra một chế độ khác.** `variant === 'editor'` dùng biến `peek` riêng, chừa đúng bề rộng biểu tượng rồi đặt menu mở bằng `absolute`. Vì vậy lựa chọn mở ở Kho đề không được dùng trong bàn soạn, và menu mở phủ lên vùng làm việc. Đã bỏ nhánh đặc biệt; mọi trang dùng cùng `menuExpanded` và lựa chọn đã lưu. Mở/thu menu làm vùng giữa thay đổi chiều rộng.
2. **Hai trợ lý có phạm vi khác nhau.** Hỏi đáp chung thuộc khung ứng dụng; Copilot sửa nội dung đề thuộc thanh công cụ của tài liệu. Đã chuyển nút **Sửa đề bằng AI** vào thanh công cụ, không còn biểu tượng Copilot tự xuất hiện bên phải khi vào bàn soạn. Các nút sửa một câu và mở lại đề xuất vẫn dẫn tới cùng bảng, không bỏ chức năng.
3. **Trùng lối vào làm giao diện rối.** Khóa AI từng có cả biểu tượng riêng và một khối quản lý trong avatar. Ghi chú phong cách có biểu tượng ngoài, nút hình não trong chat và nút “Xem” trong banner. Nay khóa và ghi chú mỗi thứ có một nút ở thanh phải; avatar giữ thông tin tài khoản, liên kết quản trị nếu có quyền và đăng xuất. Chat bỏ hai lối mở ghi chú trùng và banner khẳng định cứng “Đang áp dụng Hồ sơ…”; lời chào không còn hứa đã đồng bộ kho đề.
4. **Bảng làm việc dài nên chia chỗ trên máy tính; màn nhỏ cần phủ có kiểm soát.** Chat trước đây `fixed right-0`, che cả vùng làm việc và thanh biểu tượng. Nay chat là một cột trong WorkspaceShell; bảng sửa đề vẫn chia chỗ trong bàn soạn. Từ 1024px dùng dạng cột; màn nhỏ hơn mở toàn màn hình có tên, nút đóng, Escape và giữ vòng Tab. Hộp thoại ngắn như khóa/ghi chú và menu tài khoản tiếp tục mở phủ vì là thao tác tạm thời.
5. **Không mở hai bảng AI cạnh tranh cùng lúc.** Mở chat sẽ thu bảng sửa đề và ngược lại. Thu/mở giữ nội dung đang gõ; không gửi yêu cầu hoặc áp dụng đề xuất chỉ vì chuyển bảng. Trạng thái đề xuất/lịch sử vẫn dùng cơ chế cũ. Bảng sửa đề không hiển thị nếu chưa có quyền sửa.
6. **Chia chỗ phải có vùng soạn thích ứng.** Hai cột danh sách câu/A4 nay phụ thuộc bề rộng thực của vùng giữa, thay vì chỉ chiều rộng toàn màn hình. Dưới 900px ở vùng này có nút đổi Danh sách/Xem A4; tránh ép hai cột vào phần trống hẹp khi mở thanh bên. Menu avatar điện thoại cũng được neo trong mép màn hình và đóng bằng Escape.

Không mở rộng đợt này sang sắp xếp toàn bộ thiết lập đề, đổi quy trình giao bài hoặc thay logic AI. Không đổi schema/migration/API lưu/provider.

## Kiểm và bằng chứng

Bản production cuối: `YybkJ4jwHMqc0fbN2c9dw`. Một build mỗi lần, CPU=1, heap=1024; các lượt lint/build/browser/SAFE chạy tuần tự. Server thử 3117, `isolatedTest=true`, SQL xác nhận `examcraft_test_20261022`; Chrome cài sẵn, không tải trình duyệt.

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Production build + TypeScript | Đạt | [build.log](build.log) |
| Kiểm kiểu riêng | Đạt | [typecheck.log](typecheck.log) |
| Lint phạm vi sửa | Không lỗi, còn 10 cảnh báo có sẵn trong ExamWorkspace | [lint.log](lint.log) |
| SAFE | 500/500 đạt trong runner; lệnh cũng chạy bộ unit nền | [safe.log](safe.log) |
| `npm run test:frame` mới | 4/4 đạt, gồm nhóm cha | [browser.log](browser.log), [cleanup.json](cleanup.json) |
| F21 cộng tác Copilot | Đạt: khóa của người thao tác, giữ bản sửa mới của chủ đề, đề xuất chưa áp dụng được vẫn còn | [F21.log](F21.log), [kết quả có build/source](pilot-run-3904ee35-96b3-41d4-b4d0-0a5abd8b3c3c.json) |
| F19 kho đề | Đạt: điều hướng, tìm/sao/thùng rác/Word/đổi tên/nhân bản/chuyển thư mục và mở/đóng các công cụ | [F19.log](F19.log), [kết quả](pilot-run-93702511-a029-4d48-aa66-9c4186a7ffca.json) |

Bộ kiểm mới đối chiếu tọa độ menu/vùng giữa/chat để xác nhận chia chỗ; mở/thu qua Kho đề và bàn soạn giữ đúng lựa chọn; Copilot chỉ có nút trên toolbar; avatar không có bản quản lý khóa trùng; chat không có nút ghi chú/banner trùng; đổi hai trợ lý giữ cả hai ô nhập; phiên bản/metadata đề giả không bị thay đổi khi chỉ thao tác giao diện.

Kiểm tại desktop 1440, 1024, điện thoại mô phỏng 375, 320 và 568 ngang; sáng/tối, khung không tràn ngang, avatar nằm trong màn hình, Escape và vòng Tab của bảng trên màn nhỏ. Đã mở xem ảnh thực từ browser: [chat desktop](editor-chat-1440.png), [Copilot desktop](editor-copilot-1440.png), [Copilot điện thoại tối](copilot-320-dark.png); các ảnh kích thước/chế độ khác nằm cùng thư mục.

## Bảo toàn và tiếp nối

- Không ghi DB chính, không sửa dữ liệu người dùng, key/.env/backup. Tài khoản/đề/key giả của các kiểm được dọn theo ID riêng; kiểm lại không còn fixture. Không gọi provider thật; F21 dùng máy chủ giả local.
- Máy chủ thử bản cuối giữ ở localhost3117 cho chủ dự án xem; khóa phối hợp chuyển USER, AI thật tắt. Không build đè lúc đang xem. Nếu tiến trình dừng giữa lượt chat, mở lại qua script test-server.
- Điện thoại là mô phỏng trong Chrome desktop; chưa thay kiểm cảm ứng/bàn phím ảo trên thiết bị thật. Chất lượng trả lời AI thật không thuộc lượt kiểm này.
- QA25/scratch/tmp có sẵn được giữ ngoài commit. Không tự đóng CV/sửa ASSIGNMENTS/BATCH_REVIEWS/hồ sơ02/checklist; chờ chủ dự án xem và Claude duyệt. Không push/reset/clean.
