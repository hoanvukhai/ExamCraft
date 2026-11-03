# Ca nghiệm thu và truy vết đặc tả trợ lý AI

Ngày 03/11/2026 · Theo [đặc tả 1.1](DAC_TA_CHAT_AI_V2.md) · **Tất cả ca dưới đây chưa chạy cho bản sửa mới.**

Đây là tiêu chí kiểm của một nhóm sửa, không phải checklist tổng dự án. Những kiểm chẩn đoán trước đây chỉ xác nhận lỗi cũ; không chuyển tự động thành “đạt”. Khi triển khai, ghi kết quả/commit/môi trường/bằng chứng vào báo cáo thực thi cùng nhóm, không tích xanh trước từ đọc mã.

## 1. Cách dùng

- `L`: kiểm logic/validator; `C`: component thật, API giả; `H`: HTTP/DB thử có guard; `B`: trình duyệt trang thật; `M`: người xem điện thoại / thực tế / chuyên môn. Một ca có thể cần nhiều lớp.
- P0: dữ liệu, quyền, áp trùng, sai thông tin âm thầm. P1: luồng tạo/sửa chat và xử lý lỗi phải dùng được. P2: tinh chỉnh trình bày và vận hành. Không suy % hoàn thành từ tổng ca.
- Mỗi kết quả phải có: TC, nguồn/commit, fixture/phiên bản mẫu, loại kiểm, môi trường, expected/actual, đường bằng chứng, giới hạn. Ca chưa thể chạy ghi “Chưa kiểm” kèm nguyên nhân, không ghi đạt một phần như đạt toàn ca.
- Không copy key/cookie/.env hoặc dữ liệu người dùng thật vào fixture. Lưu ảnh/request đã khử thông tin nhạy cảm; dữ liệu giả có ID riêng. DB ghi chỉ trên đích thử đã xác minh. Không auto gọi provider thật.

## 2. Tạo đề và metadata

| Ca | Yêu cầu | Mức/lớp | Đầu vào/thao tác | Kết quả phải quan sát |
|---|---|---|---|---|
| TC-001 | AC-01, AC-06, AC-07, AC-12 | P1 C/B | Tạo đề mới với tài khoản không có mẫu mặc định đã chọn | Chưa chọn môn/lớp/thời lượng; không request nào gửi Toán 6 / 45 như dữ liệu đã chọn; nhãn tên tạm rõ ràng |
| TC-002 | AC-08, AC-56 | P0 L/H | Chat bootstrap thiếu môn/lớp, lệnh “Tạo đề Toán lớp 7” | Schema bootstrap hợp lệ; model/điều phối được đọc yêu cầu; không tạo Exam giả để qua validator |
| TC-003 | AC-09, AC-30 | P0 C/H/B | Nhận đề xuất từ bootstrap, save API chậm/thất bại rồi thành công | Không mất yêu cầu; không đổi URL hoặc báo lưu trước ack; không tạo hai đề khi retry |
| TC-004 | AC-02, AC-07, AC-68 | P0 L/H/B | Mở đề cũ Toán 6 / 45 phút và nháp cũ cùng giá trị | Dữ liệu/ID/version không đổi do mở; không tự biến thành bootstrap |
| TC-005 | AC-10, AC-53, AC-79 | P1 C/B | Ở thẻ bắt đầu: tìm nút xuất, tải bản dự phòng yêu cầu; storage bị chặn | Không xuất được môn/lớp giả; tải được yêu cầu; có cảnh báo chưa giữ được trên máy; không báo “Đã lưu” server |
| TC-006 | AC-06, AC-11, AC-12 | P1 L/B | “Thi vào 10 Hà Nội năm 2026 không chuyên” với mẫu fixture đã kiểm | Mục tiêu vào 10 khác grade kiến thức; dùng phạm vi nguồn; không tự grade 10/6; mọi trường có provenance đúng |
| TC-007 | AC-12, AC-27, AC-42 | P0 L/C | Người dùng chọn năm cũ/tên riêng, máy đang năm mới; tạo thêm câu | Không ghi đè năm/tên bằng ngày máy hoặc tên AI |
| TC-008 | AC-18, AC-26, AC-27, AC-28 | P0 L/C/H | “Đổi tên thành Kiểm tra chương II” | Có đề xuất chỉ đổi tên; không gọi tác vụ sinh câu; không đổi điểm, class hoặc version câu; nhận/lưu đúng |
| TC-009 | AC-26, AC-27 | P0 L/H | Patch clear tiêu đề bắt buộc; null/undefined/chuỗi rỗng ở ghi chú | Trường bắt buộc bị từ chối rõ; trường tùy chọn xử lý đúng ýset/clear/preserve; không fallback che lỗi |
| TC-010 | AC-26, AC-28, AC-29, AC-30 | P0 L/C/H | Đề Toán 6 đổi sang Hóa 10 có scope/ma trận/câu cũ | Hiện phụ thuộc và cách giữ/thay; không gắn Hóa lên câu Toán để qua kiểm; candidate không hợp lệ không áp một phần |
| TC-011 | AC-28, AC-29, AC-36, AC-68 | P0 L/H/B | Đổi scored→survey và ngược lại trên đề có điểm/đáp án | Đúng chế độ; không phát đáp án/điểm ẩn cho khảo sát; bản trước còn phục hồi; chuyển về scored cần đáp án/điểm hợp lệ |
| TC-012 | AC-12, AC-26, AC-40 | P1 L/C | Yêu cầu sửa mẫu chính thức khác thời lượng/điểm | Có quyền tùy chỉnh nhưng nhãn nguồn không còn khẳng định khớp hoàn toàn mẫu; chỉ rõ khác biệt |

## 3. Hội thoại và làm rõ

| Ca | Yêu cầu | Mức/lớp | Đầu vào/thao tác | Kết quả phải quan sát |
|---|---|---|---|---|
| TC-013 | AC-13, AC-14, AC-16 | P1 C/B | Yêu cầu vào 10 Hà Nội → AI hỏi năm → bấm 2026 | Request tiếp giữ mục tiêu/môn/địa phương/câu hỏi; không hỏi chủ đề Toán 6 |
| TC-014 | AC-14, AC-16, AC-57 | P1 L/C/B | Trả lời tự nhập “2027, không chuyên” thay vì nút gợi ý | Điền đúng trường; giữ lịch sử; không bắt chép lại lệnh gốc; thẻ đã trả lời không gửi lặp |
| TC-015 | AC-16, AC-24, AC-58 | P0 L/H | Gửi optionId không có, questionId cũ, hoặc option của phiên khác | Bị từ chối có mã rõ; không thay facts hiện hành hoặc thực thi tác vụ |
| TC-016 | AC-17, AC-18 | P1 L/C | Yêu cầu đã đủ môn/năm/loại/mẫu; model cố hỏi lại môn | Bộ điều phối không đưa người dùng vào vòng hỏi trường đã biết; tiếp tục đúng khả năng hoặc báo lỗi đầu ra |
| TC-017 | AC-17, AC-42 | P1 C/B | Chưa có năm/nhánh và có nhiều mẫu khác nhau | Một thẻ hỏi các điểm có tác động; không hỏi môn đã biết; không bịa năm/mẫu để bỏ qua |
| TC-018 | AC-17, AC-19 | P1 L/C | Trả lời mơ hồ nhiều lần / chọn “Để AI đề xuất” / bỏ qua | Không hỏi lặp vô hạn; nhập/chọn cụ thể; giả định chỉ ở trường cho phép; không tự xóa đề hoặc tự nhận nguồn chính thức |
| TC-019 | AC-15, AC-50 | P0 C/B | Gửi A, gõ B lúc chờ, kết quả A về | B còn nguyên; A được gắn đúng lượt; không tự gửi B; nút gửi/đang xử lý đúng trạng thái |
| TC-020 | AC-13, AC-20, AC-24 | P0 C/B | Đóng/mở panel, đổi tab rồi đổi tài khoản/đề khi đang chờ | Trong cùng đề giữ phiên; khác chủ/đề không lộ hoặc áp phản hồi cũ; kết quả cũ được quản lý dưới đúng phiên |
| TC-021 | AC-17, AC-19, AC-20 | P1 L/C | Ban đầu Toán 6, sau đổi “không, Hóa 10”, lịch sử dài có điều loại trừ | Facts mới đúng; phủ định/loại trừ không mất khi tóm tắt; chỉ hỏi lại phụ thuộc thật sự |
| TC-022 | AC-06, AC-17, AC-18 | P1 L/M | Lệnh ngắn, không dấu, sai gõ nhẹ; Văn/Anh/KHTN/GDĐP | Nhận đúng khi đủ căn cứ; nếu mơ hồ hỏi đúng điểm; không hardcode toán thực tế cho mọi môn |
| TC-023 | AC-18, AC-44, AC-61 | P1 C/B | Hỏi cách dùng editor khi không có key | Hướng dẫn cục bộ dùng được; không gọi provider/đòi thêm key |

## 4. Phạm vi, đề xuất và bảo vệ dữ liệu

| Ca | Yêu cầu | Mức/lớp | Đầu vào/thao tác | Kết quả phải quan sát |
|---|---|---|---|---|
| TC-024 | AC-21, AC-22, AC-56 | P0 L/H/C | Chọn hai câu không liền nhau, sửa độ khó | Request có đúng IDs; output ngoài đích không được nhận; hai câu đích đổi, câu còn lại giữ nguyên |
| TC-025 | AC-21, AC-22, AC-35 | P0 L/C/B | Chọn phần, nhóm ngữ liệu hoặc một phương án; gửi chat | NhãnUI khớp target thật; có passage/phụ thuộc cần thiết; sửa đúng phần/nhóm/field, không toàn đề ngầm |
| TC-026 | AC-21, AC-24 | P0 L/C | Sửa thời lượng/năm/mode/scope khi AI đang trả câu hỏi làm rõ | Kết quả cũ được đánh dấu không còn áp dụng nếu liên quan; lần sau nhận ngữ cảnh mới đầy đủ |
| TC-027 | AC-23, AC-24, AC-59 | P0 L/C/H | Chọn câu khác, xóa/khóa câu đích, thu hồi quyền khi AI đang chạy | Không chuyển output sang câu mới; không áp khi đích mất/khóa/quyền hết; đề xuất vẫn còn |
| TC-028 | AC-25, AC-26, AC-58 | P0 L/H | Trong ngữ liệu có lệnh lộ key/đổi owner/xóa đề; output chứa trường quyền | Không tăng quyền, không thực thi ngoài allowlist, không lộ bí mật; thông tin văn bản vẫn được coi là dữ liệu |
| TC-029 | AC-28, AC-30 | P0 L/C/H | Proposal đổi grade 9 và thêm câu lớp9, nền là lớp6 | Sau nhận đúng grade 9 ở tài liệu/câu liên quan; không bị ép lại6; metadata/cấu trúc/câu đổi cùng bước |
| TC-030 | AC-03, AC-28, AC-30 | P0 L/C/B | Xem proposal nhưng chưa bấm nhận; nhận rồi save lỗi | Xem không đổi Exam; nhận chỉ báo bản soạn đổi; lỗi lưu không xóa proposal hoặc báo server đã lưu |
| TC-031 | AC-28, AC-30, AC-59 | P0 L/H | Một trường/ID/liên kết candidate không hợp lệ, trong khi các trường khác hợp lệ | Toàn proposal không áp; không đổi nửa metadata/nửa câu; error chỉ đúng vấn đề |
| TC-032 | AC-31, AC-55, AC-59 | P0 C/H/B | Double-click nhận, timeout sau server đã ghi, tải lại, hai tab nhận cùng proposal | Không thêm câu/đề lần hai; dùng ack/version/receipt hợp lệ để xác nhận; không tin receipt model bịa |
| TC-033 | AC-23, AC-24, AC-30, AC-59 | P0 L/H/B | Đồng nghiệp sửa đề sau khi request được gửi rồi người dùng nhận | Không ghi đè bản mới; giữ proposal, có đối chiếu/tạo lại từ nền mới |
| TC-034 | AC-02, AC-28, AC-32, AC-37 | P0 L/C | Sửa nội dung một câu có điểm0, ảnh lựa chọn, parts, passage | Không mất điểm0/ảnh/liên kết/ý khác; ID giữ ổn định; trạng thái xác minh của câu sửa về draft |
| TC-035 | AC-32, AC-68 | P0 L/C/H | Nhận metadata+câu+outline+sections, undo/redo rồi có sửa mới | Undo cùng gói, không còn nửa metadata; không đè sửa mới; phát hiện giới hạn sections của hàm hiện có trước dùng |
| TC-036 | AC-20, AC-32, AC-51 | P0 C/B | Cất/từ chối proposal, đóng tab rồi mở lại | Bản đối chiếu còn đúng tài khoản; chưa áp thì Exam không đổi; không tạo proposal mất tích |

## 5. Sinh đề, cấu trúc và nguồn

| Ca | Yêu cầu | Mức/lớp | Đầu vào/thao tác | Kết quả phải quan sát |
|---|---|---|---|---|
| TC-037 | AC-04, AC-18, AC-33, AC-34 | P1 L/H/B | Cùng plan từ chat và tab Sinh câu | Dùng chung bộ sinh/kiểm; chat tạo cả đề theo intent, Sinh câu giữ kiểu thêm và điểm chèn; không route tự gọi vòng HTTP |
| TC-038 | AC-06, AC-34, AC-36 | P1 L/H/M | Fixture nhiều môn/lớp và7 dạng; ngôn ngữ/địa phương còn thiếu | Đúng catalog/chương trình/mode; chỉ hỏi trường bắt buộc cho môn đó; không nhận khung nhận thức sai lớp |
| TC-039 | AC-34, AC-35, AC-40 | P0 L/H/B | Mẫu5 bài tự luận, mỗi bài có ý; thêm ngữ liệu chung | Đúng đơn vị đếm và cây; không tính mỗi ý thành một bài; ID remap không trùng/mồ côi; phần không tên hợp lệ |
| TC-040 | AC-35, AC-36, AC-38, AC-58 | P0 L/H | Output thiếu/thừa câu, trùng ID, thiếu đáp án, sai tổng điểm, cognitiveLevel lạ | Từ chối hoàn chỉnh, không báo đủ đề/đã kiểm; chỉ rõ lỗi; repair có giới hạn và không giảm tiêu chí |
| TC-041 | AC-36, AC-37 | P0 L/H/B/M | Câu cần hình, bảng, công thức; ảnh có sẵn trong phương án | Hình hiện/đi theo xuất và lưu; không “xem hình” thiếu ảnh mà báo xong; công thức không mất dấu; không tự tảiURL bịa |
| TC-042 | AC-36, AC-38 | P1 L/H/M | Khảo sát, nhận xét/rubric và đề chấm điểm khác thang10 | Theo chế độ; rubric/đáp án/điểm thích hợp; không ép toàn bộ về10 hoặc gán đáp án đúng cho survey |
| TC-043 | AC-38, AC-39, AC-48, AC-55 | P0 L/C/H | Đề dài nhiều phần; phần2 lỗi sau phần1 đã nhận được | Giữ phần1 trong kết quả tạm; không sinh lại vô cớ; chưa nhận cả đề khi thiếu; tiếp tục đúng phần còn thiếu |
| TC-044 | AC-39, AC-54 | P1 L/C | Vượt 100 câu sinh/1000 câu tài liệu hoặc payload quá lớn | Thông báo giới hạn cụ thể, không cắt bớt lặng lẽ; không mất đầu vào; tải/chia tác vụ rõ ràng |
| TC-045 | AC-12, AC-40, AC-41, AC-42 | P1 L/C/M | Mẫu official đúng năm, mẫu cá nhân cùng tên, mẫu năm cũ | Chọn đúng nguồn/phiên bản/quyền; không đồng nhất tên giống nhau; hiển thị nguồn và tình trạng đối chiếu |
| TC-046 | AC-17, AC-40, AC-41, AC-42 | P1 C/B | Yêu cầu “chuẩn năm tới” nhưng chưa có nguồn | Không bịa cấu trúc; hỏi hoặc đề nghị mẫu luyện tập được ghi rõ; không tra web vô hạn hay lặp câu hỏi |
| TC-047 | AC-40, AC-41, AC-68 | P0 L/H | Browser/model gửi `official:true` hoặc ID nguồn không có quyền | Không nâng trạng thái nguồn/không đọc tài liệu khác chủ; sourceRefs được server kiểm |

## 6. Khóa, model, retry và lỗi

| Ca | Yêu cầu | Mức/lớp | Đầu vào/thao tác | Kết quả phải quan sát |
|---|---|---|---|---|
| TC-048 | AC-43, AC-44, AC-47 | P1 C/H/B | Danh sách khóa đang tải, lỗi tải, thật sự trống hoặc toàn khóa tắt | Phân biệt loading/unknown/missing/disabled; không báo thiếu khi còn tải; lệnh vẫn được giữ |
| TC-049 | AC-44, AC-49 | P0 C/H/B | Gửi khi chưa key, thêm key rồi quay lại | Không lượt gọi provider trước có key; có nút tiếp tục, không tự gọi chỉ vì đóng modal; giữ toàn facts/yêu cầu |
| TC-050 | AC-43, AC-45, AC-49 | P1 L/H/C | Kiểm metadata đạt, quota sinh hết; đổi model/key/tài khoản | Không coi metadata đạt là bảo đảm quota; cache theo đúng chủ/key/model; invalidation đúng; không tái sử dụng trạng thái tài khoản khác |
| TC-051 | AC-46, AC-47 | P1 L/H/C | Sai key/hết hiệu lực/revoked/leaked bằng reason, nested code và thông báo khác nhau | Đúng mã và CTA; chỉ tắt key khi được xác nhận hỏng; không lộ raw key/message có bí mật |
| TC-052 | AC-46, AC-47, AC-48 | P1 L/H | 403 quyền,404 model,402 credit,400 request | Không coi tất cả là hết hạn/mạng; không retry/đổi model tự động; hành động đúng nguyên nhân |
| TC-053 | AC-46, AC-47, AC-48 | P1 L/H/C | 429 có/không retryAfter, nhiều key cùng project | Không hứa quota nhân số key; thời gian chờ có căn cứ; tổng retry/rotation không vượt ngân sách |
| TC-054 | AC-46, AC-47, AC-48, AC-55 | P1 L/H/C | 503/504/network/timeout, phản hồi đến muộn sau timeout | Backoff/deadline đúng; giữ input; không ép đổi key; không tự áp kết quả trễ/sinh lặp khi outcome chưa rõ |
| TC-055 | AC-46, AC-47, AC-58 | P1 L/H/C | Gateway HTML, JSON hỏng, JSON đúng nhưng action lạ, quickOptions null | Mã lỗi ứng dụng đúng; không 500 chung/đổ key; không thực thi action lạ; null tùy chọn xử lý có kiểm |
| TC-056 | AC-02, AC-46, AC-47 | P0 H/C | Khóa lưu không giải mã được | Báo đúng lỗi cấu hình; giữ key cũ; không tự xoay secret hoặc yêu cầu thêm đè |
| TC-057 | AC-04, AC-48, AC-60 | P0 L/H | Provider thành công nhưng ghi log lỗi; output cần repair; SDK có retry nội bộ | Không gọi lại output đã đủ; ngân sách gộp cả SDK/rotation/repair; log không quyết định thành công nghiệp vụ |
| TC-058 | AC-43, AC-44, AC-46, AC-48 | P0 L/H/C | Tài khoản khác/khóa khác, legacy daily cap 0, model không chọn | Chỉ key đúng chủ; không phục hồi giới hạn ngày; giữ model explicit/default công khai, không tự chọn model khác vì lỗi |

## 7. Khôi phục, trạng thái và hợp đồng

| Ca | Yêu cầu | Mức/lớp | Đầu vào/thao tác | Kết quả phải quan sát |
|---|---|---|---|---|
| TC-059 | AC-50, AC-55 | P0 C/H/B | Dừng request, đóng panel, đổi trang, reload khi đang gọi | Phân biệt dừng/đóng; trạng thái không giả; không tự gọi lại sau reload; kết quả muộn không áp sai |
| TC-060 | AC-09, AC-51, AC-52 | P0 L/C/B | Nháp bootstrap có chat, nháp Exam cũ, proposal v1/v2 cùng tồn tại | Đọc/khôi phục đúng loại; không normalize bootstrap như Exam; danh sách phục hồi tìm được mọi loại |
| TC-061 | AC-13, AC-20, AC-51, AC-52, AC-53 | P0 L/C/B | Hai tab/writer sửa chung “new”, đổi account, storage bị hỏng/full | Không ghi đè nháp writer khác; bytes hỏng còn; cảnh báo lưu thất bại; không lộ dữ liệu chéo chủ |
| TC-062 | AC-09, AC-51, AC-52 | P0 L/H/B | Chuyển localId sang serverId sau save, xuất/nhập dự phòng | Chat/proposal vẫn trỏ đúng đề, không nhân/retire nhầm; chỉ chuyển sau ack; bundle nhập có kiểm version/chủ |
| TC-063 | AC-19, AC-51, AC-54 | P1 L/C | Hội thoại dài và proposal vượt ngưỡng, có media Base64 | Không đẩy ảnh vào transcript; không cắt facts/đề xuất chưa nhận; người dùng có cách cất/tải/chia yêu cầu |
| TC-064 | AC-25, AC-56, AC-57, AC-58, AC-59 | P0 L/H | Giả mạo owner/serverVersion/target/source/receipt, request account sai | Session và server là nguồn quyền; schema/allowlist/CAS chặn; output không mở URL/JS tùy ý |
| TC-065 | AC-50, AC-57, AC-60 | P1 L/H/C | Provider 200 nhưng output bị bác; proposal ready; local apply; save fail/success | UI/log phân biệt từng stage, correlation đúng; không báo ứng dụng thành công ngay ở provider 200 |
| TC-066 | AC-51, AC-52, AC-67 | P0 L/B | Reader cũ/mới, rollout reader trước writer, rollback về bản tương thích | Không bật writer khi reader/phục hồi chưa hỗ trợ; không downgrade hủy nháp v2; bytes gốc giữ |
| TC-067 | AC-02, AC-25, AC-68 | P0 L/H/B | Chia sẻ/giao bài/nhân bản/xuất công khai sau khi chat chứa thông tin riêng | Chỉ dữ liệu cho phép; không transcript/key/proposal/đáp án ngoài quyền; snapshot bài đã giao không đổi |

## 8. Giao diện và phát hành

| Ca | Yêu cầu | Mức/lớp | Đầu vào/thao tác | Kết quả phải quan sát |
|---|---|---|---|---|
| TC-068 | AC-01, AC-06, AC-61, AC-62 | P1 C/B | Đề trống/có câu, chọn môn khác, đã có hội thoại | Gợi ý đúng khả năng/môn; không sửa rỗng; thu gọn gợi ý khi chat; không thêm hộp key trùng |
| TC-069 | AC-61, AC-62, AC-65 | P1 B/M | Light/dark, báo lỗi dài, đề xuất có nhiều thay đổi | Trắng–xám–đen đồng bộ; trạng thái có chữ; chi tiết mở rộng, không JSON/luật tràn màn hình; copy được nội dung |
| TC-070 | AC-63, AC-64, AC-65 | P1 B/M | 320/375/390 px; xoay ngang; mở bàn phím thật, phóng to chữ | Cuộn/composer/nút gửi thấy được; không tràn ngang; vùng chạm 44 px; focus vào đúng lớp, đóng/mở hộp khóa không kẹt |
| TC-071 | AC-15, AC-64 | P0 C/B/M | Nhập tiếng Việt IME, Enter, Shift+Enter trên máy tính và cảm ứng, khi rảnh/bận | Máy tính: Enter gửi, Shift+Enter xuống dòng. Cảm ứng: Enter xuống dòng, gửi bằng nút. Composition không gửi nhầm; đang bận không gửi và không mất chữ |
| TC-072 | AC-23, AC-50, AC-64, AC-65 | P1 C/B/M | Tab/ShiftTab/Escape, công cụ đọc màn hình, kết quả về khi đang gõ | Không focus trap trong panel con; không giật focus; status đọc hợp lý, không hủy chỉ vì Escape |
| TC-073 | AC-05, AC-55, AC-69 | P1 H/B | Deploy test có deadline thật; tác vụ dài bị ngắt; không có job server | Báo đúng giới hạn/unknown outcome; không tuyên bố nền vẫn chạy; test không gọi provider thật hoặc DB chính |
| TC-074 | AC-02, AC-04, AC-66, AC-67, AC-70 | P0 L/H/B | Kiểm trước tích hợp/rollback/đổi bản chạy | Giữ sửa có sẵn; đúng worktree/commit/cổng; compatibility pass; không reset/clean/migration/deploy ngoài phạm vi |
| TC-075 | AC-06, AC-36, AC-40, AC-70 | P1 M | Người phù hợp xem đề Toán và ít nhất môn khác, mẫu/đáp án/hình thật | Ghi đánh giá chuyên môn riêng; không dùng mock để khẳng định đúng kiến thức/chuẩn mọi kỳ thi |
| TC-076 | AC-03, AC-09, AC-13, AC-17, AC-33, AC-34, AC-49, AC-70 | P1 H/B/M | Luồng xuyên suốt: mới→chat→hỏi một lần→sửa key→sinh→nhận→lưu→tải lại→sửa thông tin→undo | Hoàn thành cùng một yêu cầu, không nhập lại từ đầu; không sai lớp/môn; không mất dữ liệu; kết quả đúng bản dựng đang kiểm |

Các chuỗi fixture dùng để gây lỗi phải là giá trị giả. Lớp B/M cần ghi rõ đang dùng viewport hay điện thoại thật; máy chủ/local hay Vercel preview. Không gộp những loại kiểm này thành một dấu đạt chung.

## 8a. Ca bổ sung bản 1.1

| Ca | Yêu cầu | Mức/lớp | Đầu vào/thao tác | Kết quả phải quan sát |
|---|---|---|---|---|
| TC-077 | AC-71 | P0 C/B | Mở đề Vật lí 9, 60 phút; xem bảng Thông tin đề; đổi tên rồi tải lại | Form hiện đúng tên/lớp/môn/thời lượng ngay sau khi tải; đổi tên lưu được, không báo xung đột giả |
| TC-078 | AC-72, AC-09 | P0 H/B | Mở `/editor/new`, chờ 5 giây, không thao tác | Không có request lưu; số đề trong DB thử không đổi; URL giữ nguyên; nháp cũ của `new` vẫn khôi phục được |
| TC-079 | AC-79, AC-44 | P1 C/B | Thẻ bắt đầu khi có khóa và chưa có khóa; chọn Tự soạn, Dùng mẫu, Nhập tài liệu | Mỗi lối hỏi Môn + Lớp rồi mở đúng bảng; không có ô chat thứ hai; thiếu khóa vẫn dùng được lối thủ công |
| TC-080 | AC-74 | P0 L/H | Đề có ảnh `data:` tổng trên 5 MB; gửi lệnh đổi tên, rồi lệnh sửa câu có ảnh | Request dưới 4 MB; lệnh đổi tên không mang nội dung câu; không gọi provider khi vượt; báo `PAYLOAD_TOO_LARGE` kèm cách thu hẹp; ảnh trong đề không mất |
| TC-081 | AC-75, AC-38 | P0 L/H | Provider giả trả `finishReason: MAX_TOKENS` với JSON cụt | `AI_INCOMPLETE`; không áp dụng; không báo đủ đề; nút Dừng hủy được request đang chạy |
| TC-082 | AC-76, AC-77 | P0 L/H | Đếm lần gọi provider giả: hỏi cách dùng, trả lời thẻ, sửa khi đề trống, sửa một câu, tạo cả đề | Lần lượt 0, 1, 0, 1, tối đa 2 (cộng tối đa 1 lần sửa đầu ra) |
| TC-083 | AC-32 | P0 C/B | Nhận đề xuất rồi tìm nút hoàn tác | Chỉ có nút Hoàn tác chung; một lần bấm lùi cả đề xuất; không còn nút riêng trong bảng chat |
| TC-084 | AC-73, AC-29 | P0 L/C | Đề lớp 6, AI đề xuất thêm câu lớp 9 mà không đổi lớp đề | Có cảnh báo khác lớp hoặc đề xuất đổi lớp; không âm thầm đổi câu thành lớp 6 |
| TC-085 | AC-51 | P1 C/B | Hội thoại trên đề A và B cùng tài khoản; đổi tài khoản; tải lại; đề đã có nháp trước khi nâng cấp | Đúng hội thoại theo đề và tài khoản; nháp đề không đổi định dạng |
| TC-086 | AC-80 | P1 L | Kiểm trước khi bàn giao mỗi đợt | Commit trên nhánh riêng, không có dòng đồng tác giả, không có migration, `test:integration` đã chạy |

**Ca theo đợt:** Đ0: TC-019, 068, 077, 078, 086. Đ1: TC-013–018, 020–028, 048–056, 063, 069–072, 080–082, 085. Đ2: TC-008–012, 029–036, 083, 084. Đ3: TC-001–007, 037–044, 060–062, 076, 079. Đ4: TC-057–059, 064, 065, 067, 073–075 và chạy lại các ca P0.

**Chưa làm theo phạm vi 1.1 (ghi đúng nhãn này, không tính là không đạt):** TC-045, 046, 047 (kho nguồn), TC-066 (cờ), phần cache của TC-050, phần chia lượt của TC-043.

## 9. Đối chiếu toàn bộ phát hiện audit sang đặc tả

| Phát hiện / bằng chứng audit | Yêu cầu khắc phục | Ca trọng tâm |
|---|---|---|
| Mặc định Toán 6 / 45 phút; D01/ROUTE05 chặn dữ liệu trống | AC-07, AC-08, AC-09, AC-12 | TC-001, TC-002, TC-004 |
| Không có metadata/create action; D02/ROUTE02 | AC-18, AC-26, AC-27, AC-56, AC-58 | TC-008, TC-010, TC-055 |
| Metadata bị bỏ/câu gán lại grade 6; D03 | AC-28, AC-29, AC-30 | TC-029, TC-031 |
| Mất lịch sử và lựa chọn rời; UI02/UI03 | AC-13, AC-14, AC-16, AC-19 | TC-013, TC-014, TC-021 |
| Hỏi lặp; D09; thiếu ngữ cảnh thời lượng/năm/mode ROUTE01 | AC-17, AC-21, AC-24 | TC-016, TC-017, TC-026 |
| Câu làm rõ cũ vẫn hiện UI10 | AC-20, AC-24, AC-50 | TC-020, TC-026, TC-059 |
| Không gắn tự nhập với câu hỏi | AC-16, AC-17, AC-62 | TC-014, TC-015 |
| Key phần có/phần thiếu; D06–08, UI05–07 | AC-43, AC-44, AC-45, AC-46, AC-47, AC-49 | TC-048–056 |
| Mất input đang gõ UI09 | AC-15, AC-50 | TC-019, TC-071 |
| Phạm vi nhiều câu không gửiUI08, phần/ngữ liệu thiếu target | AC-21, AC-22, AC-23 | TC-024, TC-025, TC-027 |
| Ba tên hành động bulk, D04/ROUTE02 | AC-18, AC-33, AC-58 | TC-024, TC-037, TC-055 |
| Sai schema thành 500 chung ROUTE02–04 | AC-38, AC-46, AC-47, AC-58 | TC-040, TC-055 |
| Gợi ý sửa trên đề trốngUI01, hardcodeToán | AC-06, AC-18, AC-61 | TC-022, TC-068 |
| Chat/composer chưa bền nhưproposal | AC-13, AC-20, AC-51, AC-52, AC-53 | TC-020, TC-060–063 |
| Log provider 200 trước kiểmoutput | AC-50, AC-57, AC-60 | TC-057, TC-065 |
| Thiếu cancel/deadline/trạng thái | AC-48, AC-50, AC-55 | TC-054, TC-059, TC-073 |
| Chưa xác minh “chuẩn Sở5 bài”; không có grounding | AC-11, AC-40, AC-41, AC-42 | TC-006, TC-039, TC-045–047 |
| Form hiện sai đề, mở trang tạo đề rác (Claude tái hiện 03/11) | AC-71, AC-72 | TC-077, TC-078 |
| Giữ lại các bảo vệ đã có; D05 và test cũ | AC-02, AC-03, AC-04, AC-23, AC-30, AC-31, AC-32, AC-59, AC-68 | TC-027–036, TC-064, TC-067 |

## 10. Mẫu ghi kết quả khi bắt đầu sửa

| TC | Bản mã/nguồn | Môi trường và lớp kiểm | Kết quả | Bằng chứng | Giới hạn/việc còn lại |
|---|---|---|---|---|---|
| TC-… | commit + thay đổi chưa commit nếu có | mock / DB thử / browser / người xem | Chưa kiểm / Đạt / Không đạt / Bị chặn | đường dẫn trong nhóm QA | lý do cụ thể |

Không đánh dấu hoàn tất yêu cầu chỉ từ một test cùng tên. Các ca P0 phải chạy trên đường thực khi có lưu/quyền; pure test không thay integration. Chỉ chạy kiểm cần thiết cho gói vừa sửa rồi kiểm tích hợp cuối; không lặp build/AI vì thay tài liệu. Checklist03 vẫn do người chỉ đạo duyệt theo tiêu chí và bằng chứng.
