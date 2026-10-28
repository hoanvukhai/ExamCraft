# Thiết kế lại bàn soạn — P0–P8

Ngày 28/10/2026. Theo [đặc tả Claude giao](../editor-direction/PHAN_TICH_TRANG_SOAN.md), mốc `7f8a78a`; giữ sửa `af14a82` và khung Workspace hiện hành. **Đã triển khai và kiểm bản tích hợp; WAITING_REVIEW — chờ Claude duyệt.** Commit tích hợp mã/kiểm `06d7401`. Không tự đóng CV hoặc sửa hồ sơ02/checklist/ASSIGNMENTS/BATCH_REVIEWS.

## Người dùng sẽ thấy gì

- Tên đề, thông tin đề, trạng thái lưu, rà soát và **Giao bài** nằm cùng thanh trên. Chỉ một nơi xem tình trạng lưu; lỗi/xung đột có đường thử lại, tải nháp và giữ thành đề riêng.
- Toolbar một dòng: **Thêm câu · Thiết lập đề · Sửa bằng AI · Xuất**, thêm kết quả/cộng tác khi phù hợp. Trên vùng hẹp, nhãn co lại và thao tác phụ vào menu; không lặp các mục xuất trong menu phụ khi nút Xuất đã hiện.
- Thiết lập đề gom **Thông tin, Phần & ngữ liệu, Ma trận, Phạm vi kiến thức, Mẫu**. Đổi thẻ hoặc thu bảng giữ nội dung biểu mẫu đang nhập. Mở thiết lập/chat/Copilot dùng chung chỗ bên phải, không mở chồng các bảng dài.
- Câu hỏi có ba nhóm thao tác **Sửa · AI · ⋯**. Khi chọn nhiều, các ô chọn hiện rõ. Ngữ liệu và nguồn trích dẫn hiện trước nhóm câu dùng chung; sao vào ngân hàng vẫn mang đủ ngữ liệu.
- Xem trước còn **Đề / Đáp án / Lời giải / Ma trận**; Song song là công tắc trong thẻ Đề. Thu phóng gọn; các loại Word ghi rõ trong menu Xuất, không phụ thuộc thẻ đang xem. Giữ thêm Word đề song song để không mất khả năng cũ.
- Màn hẹp có công tắc **Soạn câu / Xem đề** ngay dưới toolbar. Điện thoại có nút xem toàn màn hình, đóng lại giữ vị trí cuộn. Đề trống hướng dẫn ba bước thay vì xếp nhiều khối thiết lập.
- Nháp tài khoản và các bản đã cất vẫn tìm được ở Kho đề. Trong bàn soạn chỉ gom những việc cần xử lý và thông báo liên quan đề đang mở; không còn banner khóa AI cố định. Bấm AI khi chưa có khóa mới hiện hướng dẫn thêm khóa.

## Đối chiếu P0–P8

Các commit tách theo nhóm thay đổi; ảnh và kiểm nghiệm thu đặt trên **bản tích hợp cuối**, không tuyên bố từng commit trung gian đã qua toàn bộ bộ kiểm.

| Bước | Commit chính | Đã thực hiện |
|---|---|---|
| P0 | `8dc0702` | Bỏ nút ma trận không có tác dụng, bỏ Lưu đề trùng, đổi tên Câu hỏi |
| P1 | `e2b2e6e` | Gom trạng thái lưu/rà soát lên Header; rà soát nhảy tới câu; chuyển nháp tài khoản về Kho đề; chip Cần xử lý; nhắc khóa đúng lúc |
| P2 | `aec45cd` | Bảng thiết lập năm thẻ, tái dùng biểu mẫu và các kiểm ngữ cảnh cũ; giữ sửa dang dở khi đổi thẻ |
| P3 | `18c9b91` | Menu Thêm câu, xác nhận sinh AI khi đề có câu, toolbar co một dòng, kết quả thực, tên Cùng soạn gọn; sao lưu/nhập kho cũ về Kho đề |
| P4 | `e64c3d1` | Bốn thẻ xem trước, công tắc song song, nhóm zoom gọn, bỏ nút xuất trùng; xuất Word theo loại rõ ràng |
| P5 | `7919cb2` | Giữ các callback cũ trong Sửa/AI/⋯, gồm sao vào ngân hàng; menu có bàn phím, ô chọn hiện khi đang chọn nhiều |
| P6 | `5d453aa` | Công tắc vùng soạn luôn ở trên; xem toàn màn điện thoại và giữ vị trí cuộn; bố cục theo bề rộng thật |
| P7 | `6b7747b` | Ba bước cho đề trống, bốn nguồn thêm câu; có câu thì ẩn màn bắt đầu |
| P8 | `bba5a70` | Tách trình bày vào `components/editor/`, thay các màu trung tính đã chạm bằng biến giao diện, giữ màu trạng thái và màu trang in |

Các sửa tích hợp trong `06d7401` gồm popup không bị cắt bởi vùng hẹp, bảo toàn đường cứu nháp khi mất quyền, đủ dòng nguồn ngữ liệu, nhãn Hỏi AI phân biệt với sửa đề, và nhận diện đúng bản phục hồi sau lưu.

## Các điểm bảo toàn cần Claude chú ý

**Lỗi thật phát hiện khi kiểm sâu bản phục hồi:** kiểm cũ mới xác nhận bản sao tồn tại. Khi sửa tiếp ngay sau đó, phiên soạn còn có thể khởi tạo theo mã đề cũ trong lúc URL đã đổi, khiến thay đổi không tới bản sao. Đã mở rộng nhận diện tài liệu vừa được máy chủ xác nhận cho cả bản phục hồi; giữ điều kiện đúng chủ tài khoản và đúng URL. Kiểm F9 được tăng cường để sửa tiếp bản sao và đối chiếu phiên bản đề gốc không đổi. Không sửa giao thức lưu/version CAS hay API.

**Mất quyền sửa:** vùng tải/cất nháp nằm ngoài nhóm ô soạn bị khóa. Menu câu đang mở tự đóng khi quyền thay đổi; menu nổi không thể gọi hành động vượt qua trạng thái khóa của nút gốc. Bản đang gõ vẫn giữ; tải nháp vẫn dùng được.

**Khôi phục nháp:** không xóa bản đã cất, bản chưa đọc được hoặc nháp của đề khác chỉ để dọn giao diện. Các chỉ mục tài khoản vẫn có ở Kho đề. Mở bản máy chủ dùng cơ chế cất riêng nháp hiện có. Khi máy chủ xác nhận lưu, thông báo nháp không còn hiện như đang chờ khôi phục.

**Biểu mẫu và dữ liệu:** dùng lại kiểm trường thay đổi, stamp/phạm vi/gói kiến thức, phản hồi muộn và xác nhận áp dụng của từng khối. Không tự đổi môn/lớp/khung nhận thức/điểm. Đề cũ thiếu thời lượng được hiển thị bằng lời, không gán thời lượng mới; kiểm cả preview và Word không làm thay đầu vào.

**Nguồn và đầu ra:** ngữ liệu hiển thị một lần cho nhóm câu liên tiếp, giữ nguồn và hình; dữ liệu ngữ liệu vẫn được truyền vào thao tác sao câu sang ngân hàng. Trang in giữ màu giấy và mực, không đổi theo dark mode. Word đề, đáp án, lời giải, ma trận và song song có lối xuất riêng.

Không thêm bảng/migration, không đổi API, không xoay khóa mã hóa, không ghi DB chính, không gọi provider thật, không push/reset/clean. Các lượt ghi kiểm dùng DB thử đã xác nhận đích và fixture riêng; dữ liệu/tệp có sẵn được giữ.

## Bản đồ mã để duyệt nhanh

| Thành phần | Vai trò |
|---|---|
| `ExamWorkspace` + `Header` + `EditorToolbar` | Điều phối đề, thanh tài liệu và các hành động |
| `editor/EditorSettings` + `HeaderForm` | Khe thiết lập năm thẻ, tái dùng các khối cũ |
| `editor/EditorSaveStatus` | Một nơi xem lưu/cứu nháp, popup không bị vùng soạn cắt |
| `editor/EditorReview` | Rà soát cấu trúc và nhảy tới câu, xác nhận trước đầu ra/giao bài |
| `editor/EditorPending` + `AccountRecovery` | Nháp/đề xuất của đề và chỉ mục tài khoản |
| `editor/EditorQuestionList` + `QuestionCard` | Nhóm ngữ liệu, tiêu đề danh sách và thao tác câu |
| `editor/EditorStart` + `PhonePreview` | Bắt đầu đề trống và xem toàn màn điện thoại |
| `useExamPersistence` | Chỉ thêm trạng thái hiển thị nháp và sửa nhận diện URL sau ACK; không đổi CAS/API |

## Giới hạn để người dùng kiểm tiếp

- Điện thoại được mô phỏng trong Chrome cài sẵn; vẫn cần xem cảm ứng/bàn phím ảo trên thiết bị thật.
- Word được kiểm qua cấu trúc DOCX và bản xem trước trình duyệt; không thay việc xem Word desktop hoặc in giấy.
- AI dùng phản hồi/máy chủ giả; lượt này không đánh giá chất lượng provider thật hay chứng nhận chuyên môn.
- Kết quả của đợt này không tự đóng các CV còn mở của toàn dự án. Chờ Claude duyệt mã/bằng chứng và chủ dự án xem trải nghiệm.

## Bằng chứng nghiệm thu cuối

Build production: **`CdjH_2G3WN7rc0EiXHZB4`**. [Bảng bằng chứng máy đọc được](FINAL_VERIFICATION.json) kiểm build và dọn fixture của các nhóm; các flow có bản kết quả riêng tại `flows/`. Dùng Chrome cài sẵn, không tải browser. Một build mỗi lần, CPU=1, heap=1024; không chạy lint/SAFE cùng build.

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Build production gồm TypeScript | Đạt | [build.log](build.log) |
| Lint toàn bộ mã và kiểm đã chạm | Không lỗi/cảnh báo | [lint.log](lint.log), [đối chiếu cuối](lint-final-audit.log) |
| SAFE | 502/502 đạt trong runner; lệnh còn chạy bộ unit nền | [safe.log](safe.log) |
| Header/Word khi thiếu thời lượng | 9/9 đạt; cũng nằm trong SAFE | [header-unit.log](header-unit.log) |
| Ngữ liệu nhóm và nguồn trích dẫn | Đạt; không lặp nguồn, không đổi thứ tự/đầu vào; cũng nằm trong SAFE | [passage-unit.log](passage-unit.log) |
| `npm run test:editor` | 6/6 đạt, gồm nhóm cha | [browser.log](browser.log), [cleanup](cleanup.json) |
| `npm run test:library` | 6/6 đạt, gồm nhóm cha | [library.log](library.log), [cleanup](library/cleanup.json) |
| `npm run test:teacher` | 7/7 đạt, gồm nhóm cha | [teacher.log](teacher.log), [cleanup](teacher/cleanup.json) |
| `npm run test:frame` | 4/4 đạt, gồm nhóm cha | [frame.log](frame.log), [cleanup](frame/cleanup.json) |
| F2 | Đạt: bảy dạng câu, ảnh, ngữ liệu, điểm 0, tên, sao ngân hàng, mẫu, mở lại; giữ ô đang sửa qua ACK | [log](F2.log), [kết quả](flows/F2.json) |
| F3 | Đạt: các bản xem, trình chiếu, Word, ảnh, in, bốn mã đề và song song/ngữ liệu dài | [log](F3.log), [kết quả](flows/F3.json) |
| F4 | Đạt: link công khai, cùng sửa, chỉ xem và thu hồi quyền | [log](F4.log), [kết quả](flows/F4.json) |
| F9 tăng cường | Đạt: offline/reconnect, bản riêng khi xung đột, sửa tiếp đúng bản phục hồi; nguồn không đổi phiên bản | [log](F9.log), [kết quả](flows/F9.json) |
| F10 | Đạt: đổi tài khoản không lộ/lưu nháp sang tài khoản khác; trở lại chủ nháp vẫn phục hồi được | [log](F10.log), [kết quả](flows/F10.json) |
| F19 | Đạt: kho, tìm/sao/trash/khôi phục, Word, đổi tên/nhân bản/chuyển thư mục và công cụ chung | [log](F19.log), [kết quả](flows/F19.json) |
| F21 | Đạt: dùng khóa của người thao tác, giữ bản sửa mới của chủ đề và đề xuất chưa áp dụng được | [log](F21.log), [kết quả](flows/F21.json) |

Không cộng các số trên thành tỷ lệ hoàn thành dự án. Unit có thể được chạy riêng và nằm trong SAFE; browser có tính nhóm cha.

Bộ kiểm mới xác nhận lưu và biểu mẫu qua tab; nhắc khóa khi người dùng bấm AI; không còn dải nháp tài khoản ở đề trống; nguồn ngữ liệu hiện đúng; rà soát nhảy tới câu; Word từng loại khác nội dung; menu câu có đủ thao tác/bàn phím, ô chọn hiện khi chọn nhiều; toolbar một dòng khi mở thiết lập; nháp còn tải được sau lỗi lưu hoặc mất quyền, menu đang mở đóng khi bị khóa. Dữ liệu đề gốc không bị sửa bởi thao tác trên bản phục hồi.

Ảnh sáng/tối ở **1440, 1024, 375**, thêm **320 và 568 ngang** cho màn hẹp. Đã mở xem ảnh trình duyệt; các thư mục hồi quy `teacher/`, `library/`, `frame/` giữ ảnh liên quan. Ví dụ: [đề trống desktop](empty-1440-light.png), [đề trống điện thoại](empty-375-light.png), [đề có câu điện thoại tối](rich-375-dark.png), [thiết lập khi vùng giữa hẹp](settings-1024-light.png). Kiểm đổi sang xem toàn màn rồi quay lại giữ vị trí cuộn.

Các lượt đầu có bộ chọn kiểm cũ chưa khớp nhãn/vị trí mới và lỗi bản phục hồi thật nêu trên. Đã cập nhật kiểm theo thao tác mới, không xóa/bỏ qua các kiểm quyền, nguồn, nội dung Word hoặc đối chiếu DB để cho đạt. Kết quả nghiệm thu là các log/bản JSON trong bảng; dữ liệu chẩn đoán cũ giữ tại `chay-tho/`.

## Bàn giao

- Server thử **http://127.0.0.1:3117** giữ build cuối, `isolatedTest=true`, AI thật tắt. `LOCK_3117=USER`; không build đè khi chủ dự án đang xem. Nếu tiến trình dừng giữa lượt chat, mở lại bằng script test-server production.
- Các ghi kiểm chỉ trên **`examcraft_test_20261022`** sau kiểm health và SQL đích; fixture dọn theo ID/tài khoản riêng. Các nhóm cleanup và flow cuối cùng đều xác nhận dọn xong. Không xóa dữ liệu/tệp có sẵn để làm kiểm đạt.
- Giữ các tệp QA25/scratch/tmp có sẵn ngoài commit. Không push. Bước tiếp: Claude duyệt mã/báo cáo; chủ dự án xem sản phẩm và thử trên thiết bị thật.
