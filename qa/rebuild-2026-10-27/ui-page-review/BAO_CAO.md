# Rà các trang còn lại: giao diện và phân tích admin

27/10/2026 — nhánh `rebuild/2026-10-local`, nền `af919b3`.

## Kết quả và phạm vi

Đã sửa các chỗ lệch trình bày trên trang lớp/bài giao/giám sát, link học sinh/chia sẻ, đăng nhập và admin. Đã rà kho đề/editor để đối chiếu; không thiết kế lại hai không gian này. Nội dung và cấu trúc có dấu hiệu cũ–mới chồng nhau được **phân tích riêng, chưa sửa**, trong [PHAN_TICH_TRANG_VA_ADMIN.md](PHAN_TICH_TRANG_VA_ADMIN.md).

Không đổi schema, quyền, API, callbacks, chính sách thi, thuật toán lưu/chấm, nội dung đề thật hoặc dữ liệu chính. Không thêm tính năng. Không đóng CV hoặc sửa hồ sơ02/checklist/ASSIGNMENTS/BATCH_REVIEWS.

## Đã sửa

| Nhóm | Thay đổi trình bày | Bằng chứng |
|---|---|---|
| Nút còn màu trang trí | Xuất CSV và các nút nộp/xác nhận nộp dùng primary trung tính; tạo bản sao ở trang chia sẻ dùng secondary. | Ảnh FINAL-monitor / FINAL-student / FINAL-share; test liên quan bên dưới. |
| Admin | Toast dùng cặp nền/chữ theo theme, không còn chữ trắng trên nền xám nhạt. Icon trang trí còn vàng chuyển xám; chấm active dùng màu chữ để không chìm vào nền badge. Nút phụ Keys dùng cùng vai trò nút; thu hồi giữ màu nguy hiểm sáng/tối. | Mã/CSS và ảnh admin. Không chủ động reset/cấp/thu hồi để kích hoạt toast thật. |
| Điện thoại | Tìm kiếm có thể xuống hàng với tổng số; badge/dòng thông tin dài có thể wrap. Trường nhập/select bo góc chung, chữ nhập 16px trên màn hình nhỏ; nút primary/secondary trong các trang quản lý có chiều cao tối thiểu40px. Tiêu đề xuống dòng, icon không bị bóp. | Ảnh375px và số đo browser-evidence. Không đổi toàn bộ chữ nhỏ của bảng thành cùng kích cỡ vì vai trò/mật độ khác nhau. |
| Link lớp320px | Bỏ `min-w-[280px]` cố định ở khối chọn học sinh; dùng bề rộng theo panel, giữ bề rộng desktop riêng. Trước khối bị cắt do card overflow-hidden, dù toàn trang không tràn ngang. Sau select nằm hoàn toàn trong panel. | BEFORE-class-320-dark.png → FINAL-class-320-dark.png. |
| Thanh xem trước A4 | Trước các chế độ xem bị ép chữ và lựa chọn cuối nằm ngoài vùng nhìn trên375px. Cho nhóm nút wrap, mỗi nút không bị co, chữ14px và cao40px; đủ năm chế độ hiện được. | BEFORE-preview-tabs-375-light.png → FINAL-share-375-light.png; preview-tabs-geometry.json: cả năm nút fits=true. Đã chuyển thử Song song và Ma trận. |
| Nhãn điều hướng | Thêm tên truy cập cho hai link admin bị ẩn chữ trên điện thoại. Giữ đích điều hướng. | `admin/users/page.tsx`; không thay layout admin. |
| Đăng nhập/cảnh báo | Icon theme/bảo mật trang trí chuyển trung tính. Cảnh báo phiên của trang lớp có màu tối phù hợp theme. | Ảnh FINAL-login và rà nguồn; chưa kích hoạt mọi lỗi mạng/phiên. |

Các màu trạng thái có ý nghĩa, thời gian sắp hết, lỗi/quyền, đúng/sai và nội dung giáo viên được giữ. Giấy A4 vẫn trắng; CSS tiêu đề trang loại trừ nội dung `.a4-paper`. Không sửa kiểu chữ/in của tài liệu chỉ để làm giao diện cùng màu.

## Đã kiểm mã và build

- `typecheck.log`: `tsc --noEmit` exit0. Build cuối có bước TypeScript và exit0, CPU1/heap1024, ID **YRo3GVgYP84Y4hWFfEGDE**; `build-final.log`. Có dựng bổ sung sau phát hiện thực tế ở thanh xem trước, không chạy build song song.
- `lint.log`: exit0, 0 lỗi/156 cảnh báo có sẵn. Hai tệp chỉnh cuối cùng được kiểm thêm ở `lint-final-touched.log`: exit0, 0 lỗi/3 cảnh báo có sẵn.
- `source-audit.json`: 11 tệp TSX không khác AST ngoài className, aria-label và hằng chuỗi class `pill` của admin/keys. CSS rà riêng. Đây là kiểm phạm vi thay đổi, không thay thế chạy ứng dụng.
- `git diff --check`: đạt ở mốc chốt nguồn; sẽ kiểm lại trước lưu Git.

## Giao diện đã kiểm trực tiếp

- IAB trên bản build cuối; **54 trường hợp FINAL** và ảnh/số đo trong `final-browser-evidence.json`. Không có tràn ngang **toàn trang** trong các trường hợp đó. Bảng rộng có khung cuộn riêng vẫn là giới hạn trải nghiệm được phân tích, không coi đây là thiết kế mobile đã hoàn thiện.
- Phủ các mặt trang: kho đề, editor, đăng nhập; users/AI/keys; lớp/danh sách bài/giám sát; link lớp/vào bài/chia sẻ; trang thông báo link thi cũ. `/editor` là redirect được đối chiếu bằng nguồn, không là một thiết kế khác.
- Kiểm375x667 sáng/tối; đối chiếu desktop1280x720 sáng/tối ở các trang chính; bổ sung320x568 cho khối chọn tên và568x320 cho Keys/chia sẻ. Không suy mọi trang đã kiểm ở mọi tổ hợp viewport/trạng thái.
- Có dữ liệu giả tiêu đề/tên lớp dài để kiểm xuống dòng. Admin có tài khoản thử riêng, không lưu form quản lý hay đổi tài khoản có sẵn. Không cấp khóa/provider thật.
- Nhãn FINAL được chốt sau build cuối; BEFORE và INTERMEDIATE giữ quan sát trước/mốc giữa. Các lỗi selector khi kiểm (heading chứa cả badge, nút sidebar ẩn trên mobile) được xử lý bằng đối chiếu trạng thái/selector phù hợp, không sửa sản phẩm hoặc assertion để ép đạt.
- Viewport đã reset, theme trả về tối như lúc bắt đầu. Không kiểm điện thoại vật lý, bàn phím ảo/iOS zoom thực tế hoặc tất cả trạng thái lỗi.

## Kiểm luồng trình duyệt và môi trường

Chạy bằng Chrome cài sẵn qua `npm run test:pilot`, không tải browser, guard `isolatedTest=true` và DB chính xác `examcraft_test_20261022`, không AI thật. Bản build cuối không thay đổi giữa các lượt dưới đây; không sửa test/assertion.

| Luồng | Kết quả | Log |
|---|---|---|
| F3: xem đáp án, trộn, Word và in | PASS | pilot-F3.log |
| F4: chia sẻ, quyền sửa cộng tác và thu hồi | PASS | pilot-F4.log |
| F5: giao bài có/không có lớp, chính sách snapshot | PASS | pilot-F5.log |
| F6: trả lời các dạng câu, reload, nộp và ẩn lời giải | PASS | pilot-F6.log |
| F7: chấm tự luận, tổng điểm và CSV | PASS | pilot-F7.log |
| F13: học sinh/giáo viên375px, cỡ nút và không tràn ngang | PASS | pilot-F13.log |

Lượt đầu sau khi tiếp nối bị dừng ở preflight vì server3117 đã tắt giữa hai lượt chat; không ghi fixture. Giữ log `preflight-stopped-F*.log`, không coi đó là lỗi sản phẩm. Đã khởi động lại cùng bản build, không build lại chỉ vì server dừng.

## Dữ liệu, điểm còn mở và bàn giao

- Dữ liệu thử riêng thuộc `qa_ui_pages_20261027`, các ID không bí mật ở `fixture-ids.json`. Đã dọn đúng assignment/group/exam/question/passage/audit của tài khoản đó rồi xóa tài khoản thử riêng; script exit0, `fixture-cleanup.log`. Các luồng pilot tự dọn fixture của chúng. Không sửa/xóa dữ liệu của tài khoản có sẵn. Các link trong fixture-ids vì thế không còn là link demo sống.
- JSON đề mẫu `tests/fixtures/pilot/toan6-bay-dang.json` có chuỗi tiếng Việt lỗi mã hóa sẵn; bản sao trong editor/chia sẻ cũng có. Không phải font CSS mới; chưa sửa fixture chung/tài liệu thật. Xem phân tích để phân biệt lỗi nội dung và lỗi hiển thị.
- Phần **chưa sửa theo yêu cầu**: pool “7 Keys” và nguồn trạng thái cũ; nhãn CLASSWORK; số “lượt đã nộp”; popup Thư ký Beta chồng drawer; khung admin riêng; tên kỹ thuật và tỷ lệ100% khi không có dữ liệu. Không coi các mục đó đã được giải quyết chỉ nhờ thay màu.
- Không full CI/SAFE, không chứng nhận quyền hoặc chất lượng provider từ đợt UI này. Chỉ báo kết quả các kiểm thực sự chạy.
- Giữ các QA25/scratch/tmp có sẵn ngoài commit. Báo cáo đợt trước: `../ui-popup-review/BAO_CAO.md`.
- Máy chủ thử3117 đang chạy bản cuối, bàn giao LOCK_3117=USER để xem giao diện; không build đè `.next` khi đang dùng. Nếu tiến trình bị kết thúc giữa các lượt chat, mở lại `scripts/test-server.cjs --production` bằng bản build này, không cần build lại vì chỉ để xem báo cáo.
