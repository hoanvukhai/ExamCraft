# Rà popup, menu và admin — 27/10/2026

Yêu cầu trực tiếp của chủ dự án sau commit3b992de: sửa nốt chỗ chưa đồng bộ trắng–xám–đen ở popup/menu/admin, kiểm điện thoại, giữ dữ liệu. Đây là kiểm UI theo phạm vi mới, không phải tổng nghiệm thu.

## Lỗi và khác biệt đã tìm
1. **Nhập đề ở375x667:** panel trước sửa client350x612 nhưng nội dung rộng365, cao882; overflow visible. Bấm Đóng phía dưới không tới được vị trí bấm bằng công cụ. Ảnh BEFORE-import-375.png và before-import-375.png, số đo browser-evidence.json. Sau sửa: khung trong viewport, scrollWidth336=client336, overflow:auto; đã thực sự bấm được nút Đóng cuối popup. Kiểm cả568x320.
2. **Menu tài khoản ở568x320:** trước bottom359.95 vượt màn hình320, overflow visible. Sau max-height theo dvh: bottom293.6, overflow:auto; đã cuộn đến Đăng xuất, nút nằm254.75–282.75 và hit-test trúng nút. 667x375 trước sửa vẫn vừa; không coi trường hợp đó là lỗi.
3. **Màu còn sót:** nút xác nhận nhập và chấp nhận đề xuất AI còn xanh lá; trạng thái Đã thêm trong ngân hàng còn nền xanh. Đã đổi sang primary/tonal trung tính. Không đổi nội dung/đáp án đúng được tô màu có ý nghĩa.
4. **Admin/menu:** nhãn GIÁO VIÊN, số liệu thành công, badge Rotation Pool, icon đổi theme và khối key chưa cấu hình vẫn dùng màu trang trí. Đã đổi sang thang xám. Giữ màu cảnh báo thật (khóa lỗi/cooldown, tài khoản khóa/lỗi thao tác).
5. **Thông báo cấp khóa:** nền vàng nhạt cố định không phù hợp dark mode; đổi status sang feedback theo theme. Bổ sung nền/chữ tối cho cảnh báo mất phiên của hộp khóa.
6. **Ô chọn native:** trước không khai báo accent-color nên phụ thuộc màu mặc định trình duyệt. Nay dùng --ui-accent; đã kiểm checkbox được chọn ở sáng rgb(32,33,36), tối rgb(227,227,227), sau kiểm bỏ chọn, không cấp khóa.

## Cách sửa
- Khung .app-dialog dùng surface/chữ/viền trung tính chung, max-height calc(100dvh - 2rem), overflow:auto, giữ max-width riêng trên desktop; điện thoại giảm padding và chặn độ rộng vượt viewport.
- Header/footer không bị co mất, footer tự xuống hàng; trường nhập/select/label co trong bề rộng panel. Không giấu nội dung bằng overflow-x:hidden.
- .app-menu có chiều cao giới hạn/cuộn riêng, giữ trong viewport. Nút avatar có tên và trạng thái expanded đọc được; menu là region chứa thông tin và hành động (không gán sai vai trò menuitem).
- Nút X thiếu tên được thêm Đóng hộp thoại; đóng phần ghi chú dùng tên riêng, tránh trùng tên footer. Chỉ đổi thuộc tính trình bày, không đổi callback.
- Áp dụng cho popup nhập/sinh, ghi chú/khóa, tiêu đề, ngân hàng, kho cũ, chia sẻ, trộn, kết quả, cộng tác; các form kho đề, lớp, chấm, xác nhận nộp và đổi mật khẩu kế thừa cùng khung.

## Đã kiểm
- TypeScript exit0; lint exit0, 0 lỗi/156 cảnh báo có sẵn. Log typecheck.log, lint.log. Build cuối exit0, CPU1/heap1024, ID vlFYng_nKiWiGs8RrgX5x; build-final.log. build.log là mốc trung gian trước khi rà nốt nút xanh lá.
- Chrome cài sẵn; runner xác nhận isolatedTest/DB examcraft_test_20261022 trước ghi. F3 trộn/xuất, F19 kho/ngân hàng, F20 nhập/xem trước/sửa, F6 học sinh làm/nộp đều PASS trong lượt riêng trên cùng bản build, không sửa assertion. Log pilot-F*.log. Không full CI/HTTP/SAFE.
- Kiểm trực tiếp IAB:30 trường hợp FINAL có số đo/ảnh. Bao gồm folder/đổi tên/di chuyển, nhập/sinh, ghi chú/khóa, tiêu đề, ngân hàng/kho cũ, chia sẻ/trộn/kết quả/cộng tác, Thư ký; menu tài khoản; admin tạo/sửa/reset. Đối chiếu sáng/tối bằng các trường hợp ghi nhãn rõ; không suy tất cả popup đã kiểm mọi trạng thái.
- Màn hình375x667,568x320 và1280x720. Các panel FINAL đã mở đều trong viewport, không tràn ngang; nội dung dài cuộn được. Viewport đã reset; theme cuối trả về tối như ban đầu. Không kiểm điện thoại vật lý hoặc bàn phím ảo thực tế.
- Admin AI/users có ảnh desktop và375px sáng/tối; form tạo/sửa/reset đã mở trên điện thoại dọc sáng, ngang tối. Mật khẩu tạm chỉ là đề xuất chưa lưu, đã xóa khỏi ô trước khi chụp. Không bấm tạo/cấp quyền/reset/lưu form.
- source-audit.json: phần AST ngoài className/literal style/thuộc tính aria-label, aria-expanded, role không thay đổi ở21 tệp JSX đã sửa. Đây là rà phạm vi, không thay kiểm ứng dụng. git diff --check đạt.

## Truy vết bằng chứng và giới hạn
- final-browser-evidence.json lấy bản cuối mỗi nhãn và có issues=[]; browser-evidence.json giữ cả các quan sát trước/mốc trung gian. Một lượt thao tác đóng backdrop menu bị rơi vào vùng sidebar phủ, mở nhầm kho cũ; không kết luận lỗi sản phẩm từ lượt đó. Đã đóng kho và dùng nút Thu gọn bảng công cụ, kiểm lại đúng popup Cùng soạn (ảnh FINAL-collaboration-375-dark ghi Cùng soạn đề).
- Đã kiểm bấm nút đóng cuối popup nhập (trước lỗi, sau thành công), hit-test nút Đăng xuất trong menu cuộn và đóng các form mà không lưu. Không đổi mật khẩu thật hoặc tài khoản thử; chỉ đăng nhập bằng tài khoản giả riêng đã có. Không gọi provider thật, không đổi quyền/schema/API/logic lưu/chấm hoặc đọc/in .env/key/cookie/backup.
- Màu ảnh/đồ thị, màu do giáo viên chọn và màu cảnh báo/chấm bài có ý nghĩa giữ nguyên. Menu/hộp thoại do hệ điều hành hoặc trình duyệt vẽ không thuộc phạm vi CSS ứng dụng.
- Không tổng nghiệm thu, không tự đóng CV; chưa kiểm mọi dữ liệu dài/trạng thái lỗi/thiết bị. Đợt trước: ../ui-neutral/BAO_CAO.md. Các tệp QA tự sinh qa25 và scratch giữ nguyên, không gom vào commit này.
- Server thử3117 đã được khởi động lại bằng bản mới, giữ chạy cho chủ dự án xem như trước đợt; trả LOCK_3117=USER. Không build đè .next khi người dùng đang xem.
