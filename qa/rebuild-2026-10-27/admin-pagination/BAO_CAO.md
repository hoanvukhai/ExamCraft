# Tài khoản: trạng thái xanh, phân trang; AI theo giới hạn nhà cung cấp

27/10/2026. Nền Git `393da5f`. Theo quyết định mới của chủ dự án: **ExamCraft không còn đặt giới hạn số lệnh AI theo ngày.** Không tự phục hồi chính sách cũ từ tài liệu hoặc trường DB còn lưu.

## Đã thay đổi

- Nhãn **Đang hoạt động** và chấm trạng thái chuyển xanh, có cặp màu sáng/tối; nhãn vai trò giữ xám, Đã khóa giữ đỏ.
- Danh sách tài khoản có10/20/50 dòng mỗi trang, Trang trước/Trang sau, chỉ báo trang và khoảng tài khoản đang hiện. Tìm kiếm/lọc vai trò chạy trên toàn danh sách rồi mới phân trang; đổi từ khóa, vai trò hoặc cỡ trang về trang đầu. Dữ liệu thay đổi làm giảm số trang được kẹp về trang hợp lệ. Chuyển trang đưa nhìn/focus về bảng để đọc dòng mới trên điện thoại.
- Phân trang hiện ở client, phù hợp nhóm nội bộ nhỏ. GET danh sách vẫn giữ hợp đồng trả danh sách đầy đủ vì trang cấp khóa cũng dùng nó. Chưa triển khai phân trang/truy vấn tìm kiếm ở DB cho quy mô lớn.
- Bỏ phép so sánh `aiDailyLimit` và phép đếm giữ suất theo ngày trong `reserveOperation`. Không còn lỗi APPLICATION_AI_LIMIT. Tài khoản có giá trị cũ bằng0 hoặc đã vượt giá trị cũ vẫn dùng được khóa của mình theo phản hồi nhà cung cấp.
- Bỏ cột và ô chỉnh giới hạn khỏi admin; bỏ số giới hạn khỏi danh sách người nhận khóa. Bỏ thanh phần trăm, số “còn lại” và mức mặc định100 ở menu/editor. Hộp khóa chỉ hiển thị số thao tác thành công hôm nay và giải thích hạn mức của nhà cung cấp chưa biết.
- API thống kê vẫn giữ số thành công/khóa đang bật; `limit`, `remaining`, `percentageUsed`, `resetsAt` là null, chính sách nguồn provider và `providerQuota=null`. Không quảng bá “không giới hạn” ở phía provider hoặc tự đoán quota từ số khóa.
- `aiDailyLimit` trong DB và trường đọc của API/phiên cũ được giữ để không mất dữ liệu/tương thích, nhưng không dùng để quyết định cho phép AI. Admin không còn ghi/cấu hình trường này. Không có migration hoặc ghi lại hàng loạt giá trị cũ.
- Giữ kiểm đăng nhập, tài khoản khóa, đổi mật khẩu ban đầu, quyền sở hữu khóa, model, hủy yêu cầu, giới hạn đầu vào và số lần thử khóa cùng tài khoản. Provider429 và lỗi quota/billing vẫn được xử lý; không đổi thành công giả hoặc chuyển sang khóa của người khác.
- Sửa phân loại nhật ký admin: mã102 (yêu cầu đang được ghi nhận) cùng null thuộc nhóm chưa có kết quả, không tính thành lỗi hay mẫu số tỷ lệ thành công.

## Đã kiểm và bằng chứng

- Build cuối exit0, CPU1/heap1024, ID **-TELCUR5lFqU8EmJhRi20** (`build.log`). TypeScript và lint cuối ở `typecheck.log`, `lint.log`; kết quả kiểm kiểu đạt, lint không có lỗi, còn153 cảnh báo hiện có. `git diff --check` đạt.
- Bộ an toàn `npm run test:safe`:498 test phần TAP cuối đạt/0 lỗi (`safe.log`), gồm kiểm giá trị cap cũ0 không được đọc để chặn thao tác, metadata quota không bịa số dư, ngày UTC chỉ dùng cho thống kê, giữ kiểm context và retry theo chủ khóa. Sau mốc này chỉ chỉnh class màu/focus bảng và bổ sung kiểm UI, không đổi logic AI.
- `npm run test:http-ai`:44 kiểm đạt/0 lỗi trên API của bản cuối (`http-ai.log`). Có cấp/thu hồi, khóa riêng theo chủ, model, provider429, lỗi provider không lặp vô hạn, gọi vượt cap cũ và cap0, không ghi lại giá trị DB cũ; luồng quyền và không có key vẫn bị chặn đúng lý do. Nhà cung cấp là HTTP giả cục bộ, không bỏ qua lời gọi thật của ứng dụng bằng cách sửa route sản phẩm.
- `npm run test:admin`:11 test tính cả nhóm ngoài đạt/0 lỗi (`admin-browser.log`), gồm phân trang sau lọc, trang cuối, reset khi tìm/đổi cỡ trang, lọc rỗng, màu xanh lấy từ CSS đã tính của phần tử trạng thái, không còn cột hạn mức, hộp khóa và menu editor không còn cap/số dư giả. Giữ cả kiểm quyền, hủy/xác nhận, thu hồi đúng người, drawer Thư ký và màn hình nhỏ.
- Pilot **F13/F21/F22 đều PASS** trên cùng bản cuối (`pilot-F*.log`): điện thoại giáo viên/học sinh; Copilot giữ quyền và bản sửa mới; hủy nhập/sinh chậm không áp dụng kết quả. Không sửa assertion của các luồng pilot này.
- Ảnh sáng/tối ở320x568,568x320,1280x720; thêm tài khoản/dialog/menu/hộp khóa375px. Đã đọc lại ảnh `accounts-375.png`: vai trò xám, trạng thái xanh, không còn cột cap, có điều khiển phân trang. `key-usage-375.png` và `editor-usage-375.png` chứng minh cách hiển thị mới.
- `cleanup.json` ghi đã dọn user/khóa/log/đề/lớp thử theo ID riêng, cùng build ID cuối. Bốn báo cáo HTTP tự sinh ở thư mục cha (`http_ai_mock.json`, `http_workflows.json`, `http_auth.json`, `http_admin_keys.json`) giữ bằng chứng dọn fixture và không AI thật.

Lượt kiểm màu đầu phát hiện class xanh gắn vào nhãn vai trò thay vì nhãn trạng thái. Đã sửa đúng phần tử, trả vai trò về xám và chạy lại trên bản cuối, giữ nguyên assertion màu thật. Log lỗi `admin-active-color-failure.log` và mốc build trước sửa được giữ để truy vết; không coi đó là kết quả cuối.

Kiểm HTTP dùng nhà cung cấp giả trên localhost3118, server3117 được khởi động với EXAMCRAFT_REAL_AI=0, guard DB chính xác `examcraft_test_20261022` và health `isolatedTest=true`. Không dùng khóa thật hoặc gọi AI thật. Các thay đổi test chặn theo ngày phản ánh quyết định mới: thay bằng kiểm giá trị cũ0 vẫn gọi được, vẫn nhận provider429, vẫn cô lập khóa/quyền và vẫn dừng sau thu hồi.

Có kiểm trình duyệt với23 tài khoản giả lập ở lớp phản hồi GET để kiểm đủ trang10/20, trang cuối3 dòng, lọc rỗng và tìm tài khoản ngoài trang hiện tại. Dữ liệu phân trang giả lập không được ghi DB; tài khoản phục vụ kiểm thao tác có ID riêng và được dọn đúng ID.

## Giới hạn và bàn giao

- Không đo quota/chi phí Google thật; chưa kiểm điện thoại vật lý hoặc mọi tổ hợp model/project. Dùng Chrome đã cài, không tải browser.
- Không sửa/xóa dữ liệu chính, không xoay khóa hoặc động `.env`/backup/schema. Bản ghi log, khóa giả và user thử được dọn theo ID; giữ các dữ liệu/tài khoản có sẵn.
- Không tự đóng CV hoặc sửa hồ sơ02/checklist/ASSIGNMENTS/BATCH_REVIEWS. Báo cáo đợt trước: `../admin-refresh/BAO_CAO.md`. Các chỗ nói giới hạn nội bộ trong hồ sơ cũ là lịch sử, quyết định mới ở đầu báo cáo này thay thế chúng.
- Server thử3117 giữ chạy bản cuối với AI thật tắt; trả `LOCK_3117=USER`, không build đè `.next` trong lúc xem. Giữ QA25/scratch/tmp có sẵn ngoài commit. Chủ dự án kiểm tra sản phẩm tiếp; không tự khôi phục cap hoặc mở thêm tính năng.
