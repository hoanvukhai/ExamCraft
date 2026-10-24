# Bộ nghiệm thu và dữ liệu kiểm thử

Ngày: 21/10/2026. Đây là **thiết kế kiểm thử**, chưa phải kết quả chạy. [Checklist](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/03_CHECKLIST.md).

## 1. Quy tắc bằng chứng

Kiểm unit cho logic, integration cho DB/API, E2E cho đường người dùng, kiểm trực quan cho tài liệu và đánh giá chuyên môn cho nội dung. Không thay một lớp bằng lớp khác. Ca về quyền/chấm/thời gian phải gọi đường server thật trên môi trường cô lập. AI thật chỉ chạy khi có key/ngân sách được cho phép; mock giúp tái lập lỗi nhưng không chứng nhận chất lượng model.

Bằng chứng mỗi ca gồm đầu vào/phiên bản, thao tác, mong đợi, thực tế, log/ảnh/tệp và người đánh giá. Bỏ dữ liệu riêng/bí mật trước lưu. Không chụp PASS giả hoặc đánh dấu người chuyên môn đã duyệt khi chưa có người.

## 2. Các ca nghiệm thu

### NT-01 — Baseline và test có ý nghĩa

**Cách thử:** Cố ý làm một assertion thử thất bại trên nhánh/fixture thử, rồi trả về bình thường; chạy runner và các lệnh nền.

**Đạt khi:** Lỗi tạo exit code thất bại; log cho biết ca thật, runtime và cây code; không in 100% vô điều kiện.

### NT-02 — Kho đề và lưu server

**Cách thử:** Giáo viên A tạo đề, sửa, quay về kho, mở bằng phiên khác; đổi tên, lọc, gắn sao, xóa mềm/khôi phục; fork câu chung.

**Đạt khi:** Nội dung và version đúng, fork hiện kho riêng, recent sắp đúng, restore không mất quan hệ; giáo viên B không thấy dữ liệu riêng.

### NT-03 — Chuyển dữ liệu và round-trip

**Cách thử:** Chuyển mẫu local phẳng/DB payload với kiểu chữ khác nhau, hình object/mảng, đủ loại câu; chạy nhập lại cùng batch; thử record hỏng.

**Đạt khi:** Không mất câu/đáp án/hình/điểm/nguồn, không nhân đôi; ID mapping kiểm được, record hỏng được cô lập; có rollback đã thử.

### NT-04 — Lưu lỗi và nháp

**Cách thử:** Ngắt mạng, trả HTTP 4xx/5xx, reload, đổi tài khoản; gửi request lưu cũ chậm hơn request mới.

**Đạt khi:** Không báo đã lưu server khi thất bại; phục hồi nháp đúng người; bản cũ không ghi đè mới; trạng thái lỗi dễ hiểu.

### NT-05 — Tài khoản và quyền

**Cách thử:** Thử tài khoản buộc đổi mật khẩu, khóa, đăng xuất, session cũ; A gắn folder/question/group/template của B qua API trực tiếp.

**Đạt khi:** Server chặn đúng, không chỉ UI; quyền cộng tác hợp lệ vẫn hoạt động; không lộ nội dung trong thông báo lỗi.

### NT-06 — Chia sẻ và tách quyền

**Cách thử:** Dùng link xem/góp ý/sửa, thử sửa/tải/fork ngoài quyền; thu hồi link; truy cập route cũ/public và dò đối tượng liên kết.

**Đạt khi:** Quyền đúng mỗi thao tác, không lộ đáp án/nguồn riêng ngoài chính sách; không tự cấp quyền key hoặc kho chung.

### NT-07 — Dạng câu và đáp án

**Cách thử:** Tạo/sửa/lưu/mở đủ dạng lựa chọn, đúng-sai, ngắn, tự luận, điền, ghép, sắp xếp; sửa từng lựa chọn/ý, không chỉ câu dẫn.

**Đạt khi:** Đáp án gắn ID, dữ liệu đi hết luồng; dạng chưa được hỗ trợ ở thao tác cụ thể báo rõ, không biến thành dạng khác hoặc mất câu.

### NT-08 — Phiên bản và sửa câu

**Cách thử:** Chuyển Đề/Đáp án/Song song; AI/giáo viên sửa dữ kiện; accept/reject/undo; sửa câu gốc sau khi đã dùng ở đề khác.

**Đạt khi:** Cùng một dữ liệu, đúng version; phần kiểm định phụ thuộc hết hiệu lực; bản đã chốt/giao không đổi ngầm.

### NT-09 — Key và cô lập người dùng

**Cách thử:** A/B thêm key giả hoặc key thử được phép, trùng label; gọi từng tác vụ AI; thử xóa/disable, log và response; cộng tác rồi gọi AI.

**Đạt khi:** Dùng đúng key người yêu cầu, không lộ bí mật; thống kê theo ID; mọi endpoint cùng auth/context; test key không âm thầm gọi nhiều model.

### NT-10 — Chi phí và giới hạn

**Cách thử:** Giả lập 429/503, hết quota, gói chưa xác minh, hủy job, nhiều job đồng thời; cấu hình một kết nối trả phí dự phòng chưa bật.

**Đạt khi:** Retry/hủy có giới hạn, không tự dùng paid fallback; số liệu ước tính có nhãn; không tính 1500*key hoặc hứa số dư ngoài app.

### NT-11 — Cây và nguồn/mức nhận thức

**Cách thử:** Một kỹ năng ở nhiều sách, một bài chứa nhiều kỹ năng; hai version nguồn, ba/bốn mức; thiếu mẫu lớp nhỏ.

**Đạt khi:** Ánh xạ có bằng chứng; giữ khung/định nghĩa riêng; không fallback môn/lớp sai, không tự quy đổi mức hoặc gọi nguồn chưa duyệt là chuẩn.

### NT-12 — Scope

**Cách thử:** Chọn A/B/D loại C; chat thay một mục; sinh câu cần kiến thức C hoặc phương pháp chưa cho phép; thiếu bộ sách trong lời yêu cầu.

**Đạt khi:** Cả chat và UI cùng scope; phát hiện ngoài phạm vi hoặc yêu cầu làm rõ; không tự mở rộng để hợp thức câu.

### NT-13 — Ma trận, đặc tả và điểm

**Cách thử:** Yêu cầu 0 đúng-sai; tổng 10 nhưng sai phân bổ; số lẻ 0,25/0,1; bài không chấm điểm; framework mức khác nhau.

**Đạt khi:** 0 được giữ; kiểm cả tổng và từng ô; đặc tả có outcome, không câu văn mẫu chung; không làm tròn sớm hoặc ép điểm cho khảo sát.

### NT-14 — Mẫu và tiêu đề

**Cách thử:** Đổi trường/năm/tên phần, ẩn trường, đổi bố cục, lưu mẫu cá nhân; AI sinh lại; dùng mẫu mới cho đề đã chốt.

**Đạt khi:** Giữ chỉnh sửa giáo viên; không sinh tên cơ quan giả, không đổi đề đã chốt; thông tin thời gian/điểm khớp cấu hình.

### NT-15 — Sinh và kiểm định AI

**Cách thử:** Trả JSON hợp lệ nhưng sai scope/số câu; 0/2 trong 4 ý đúng-sai được verify; đáp án sai có vẻ hợp lý; công cụ không hỗ trợ dạng toán.

**Đạt khi:** Thiếu kiểm tra không báo đúng; retry có giới hạn; giữ trạng thái và nguồn kiểm; chỉ công nhận phần công cụ/người thật đã kiểm.

### NT-16 — Nhập và tài sản

**Cách thử:** Nhập văn bản/LaTeX, Word có công thức/ảnh, ảnh mờ, tài liệu vượt giới hạn; ngữ liệu chung, tệp mất hoặc bị thay nội dung.

**Đạt khi:** Giữ nguồn và vị trí thiếu; không cắt im lặng/bịa hình/đáp án; asset không mất liên kết; có cách sửa trước lưu và nhận diện trùng.

### NT-17 — Trộn đề

**Cách thử:** Trộn đủ loại câu và ngữ liệu, lựa chọn ghim/phụ thuộc; chạy lại seed; đối chiếu ID và đáp án sau nhiều mã.

**Đạt khi:** Đúng số lượng, không mất/tách nhóm sai, đáp án theo ID; tái lập được; lời giải không sai do thay chữ cái tùy tiện.

### NT-18 — Word/in/PDF

**Cách thử:** Xuất đề, đáp án, lời giải, ma trận; mở bằng Word hoặc phần mềm đích, in/PDF; thử dài hơn một trang, nhiều cột và công thức/hình.

**Đạt khi:** Không mất/tràn nội dung, ngắt hợp lý, đủ hình/điểm, font tiếng Việt đọc được; fallback rõ. Không chỉ kiểm file ZIP và không đòi pixel giống tuyệt đối.

### NT-19 — Trình chiếu

**Cách thử:** Mở một câu, điều khiển tiếp/lùi, hiện dần đáp án, phóng to và dùng bàn phím.

**Đạt khi:** Ẩn/hiện đúng, chữ/hình đọc được, không sửa nội dung/snapshot khi trình chiếu.

### NT-20 — Cùng sửa thật

**Cách thử:** Hai trình duyệt sửa cùng/khác khối, reorder/xóa câu, undo; A offline, B sửa, A reconnect; thu hồi A khi đang mở; AI trả kết quả muộn.

**Đạt khi:** Không mất/nhân đôi dữ liệu; xung đột xử lý nhìn thấy, quyền cập nhật ngay theo cơ chế xác định; lịch sử tác giả đúng; AI không ghi đè bản mới.

### NT-21 — Bài giao và snapshot

**Cách thử:** Giao có/không nhóm qua link, chọn mode/identity, sửa đề gốc; thử nhận đề trước giờ/mã sai/quyền khác.

**Đạt khi:** Một hợp đồng API, snapshot bất biến đầy đủ; dữ liệu gửi học sinh chỉ là phần được phép, không chứa đáp án ẩn.

### NT-22 — Start, hạn và lượt làm

**Cách thử:** Start trước giờ/sau đóng, PIN sai, studentId lớp khác, hai start đồng thời; lượt cũ hết hạn chưa nộp; submit sau deadline.

**Đạt khi:** Server xử lý đúng thời gian/trạng thái/số lượt, không trùng attemptNo; không dùng ID để mạo danh; dung sai theo chính sách đã chọn.

### NT-23 — Học sinh autosave/resume

**Cách thử:** Làm nhiều dạng câu, nhập tự luận, xem hình/ngữ liệu, reload và mất mạng; request chậm; làm trên màn hình nhỏ.

**Đạt khi:** Nháp lưu thật đúng phiên; thông báo trung thực; không mất câu hoặc cần cuộn mà không cuộn được; resume đúng lượt.

### NT-24 — Chấm và idempotency

**Cách thử:** Bỏ trống câu đáp án thiếu, đáp án số 0/false, phân số/đơn vị, tự luận; gửi submit lần hai/đồng thời; thử NEVER/AFTER_CLOSE.

**Đạt khi:** Không blank=đúng; chấm theo quy tắc snapshot; tự luận chờ chấm; một kết quả cuối nhất quán, mọi nhánh giữ chính sách hiện điểm/lời giải.

### NT-25 — Kết quả và quản lý

**Cách thử:** Giáo viên chấm tay/đính chính/gia hạn; xem lịch sử, thống kê/CSV; học sinh xem lại; leaderboard tắt/bật.

**Đạt khi:** Điểm tạm/chốt đúng, có audit, CSV an toàn; không lộ bài/điểm cả lớp; xem lại không tạo lượt mới ngoài ý định.

### NT-26 — Phân tích/memory

**Cách thử:** Phân tích đề riêng; sửa/xóa memory; tìm bằng tài khoản khác; góp bản đã duyệt; nguồn thay thế; file chứa lệnh yêu cầu lộ key.

**Đạt khi:** Lọc quyền trước truy xuất; không biến sở thích thành chuẩn; nguồn/phiên bản/bằng chứng còn; bỏ qua lệnh tài liệu; thu hồi ảnh hưởng tìm kiếm đúng.

### NT-27 — Backup và restore

**Cách thử:** Backup DB+tệp, gây lỗi dump/mất dung lượng/key giải mã trong môi trường thử; restore vào môi trường trống rồi mở đề và kiểm quyền.

**Đạt khi:** Không báo tốt khi tệp rỗng/lệnh lỗi; phục hồi nội dung/hình/quyền/lịch sử; đo thời gian và điểm dữ liệu; không tác động DB thật.

### NT-28 — Độ phủ môn/lớp

**Cách thử:** Chạy bộ ca đại diện theo danh mục gói: tiểu học, THCS, THPT, Toán, ngữ liệu, tích hợp, nhận xét, âm thanh/thực hành theo loại bài.

**Đạt khi:** Mỗi gói có khả năng và bằng chứng riêng, nguồn/reviewer hoặc chờ duyệt; không dùng menu hoặc test Toán làm bằng chứng toàn bộ.

### NT-29 — Tải và vận hành

**Cách thử:** Đo theo số phiên/start/save/submit đồng thời đã định nghĩa; rate limit, hàng đợi, lỗi nhà cung cấp; thử CI trên DB sạch.

**Đạt khi:** Ghi môi trường/dữ liệu/độ trễ/tỷ lệ lỗi; không tự tăng quy mô cam kết; không ghi bí mật; lỗi quan trọng phát hiện được.

### NT-30 — Giáo viên mới dùng

**Cách thử:** Người mới tạo phiếu, sửa tiêu đề/đáp án, tìm lại, mời đồng nghiệp và giao link mà không đọc tài liệu kỹ thuật.

**Đạt khi:** Ghi bước lúng túng, lỗi và khả năng hoàn thành; cải thiện nội dung/UI. Chưa có người thì chỉ ghi kiểm heuristic, không giả là user test.

### NT-31 — Phát hành và dọn cũ

**Cách thử:** Đối chiếu mọi YC/CV, kiểm caller/link/data trước xóa cũ, chạy hồi quy, rehearsal rollback, ghi vấn đề còn lại.

**Đạt khi:** Không còn lỗi chặn, ngoại lệ có người chấp nhận và phạm vi; docs/hướng dẫn đúng sản phẩm; triển khai cần hạ tầng/ngân sách được chốt.

## 3. Bộ dữ liệu cần chuẩn bị

| Mã bộ | Nội dung | Mục đích |
|---|---|---|
| DL-01 | Dữ liệu local/DB cũ đã loại thông tin riêng, payload cả hai dạng, thiếu trường/ID trùng | Chuyển đổi/adapter |
| DL-02 | Câu đủ bảy kiểu hiện có, 0/false/blank, nhiều đáp án, rubric, câu không chấm điểm | Soạn/chấm/kiểm định |
| DL-03 | Công thức lồng, ký hiệu hóa học, bảng, ảnh, đồ thị, bảng biến thiên, ngữ liệu dài, tệp âm thanh khi triển khai | Hiển thị/nhập/xuất |
| DL-04 | Ba khung cấp học, nguồn ba/bốn mức, scope không liền nhau, phiên bản sách khác | Khung giáo dục/ma trận |
| DL-05 | Hai giáo viên, người xem/góp ý/sửa, hai học sinh giả, admin, link thu hồi | Quyền/cộng tác/làm bài |
| DL-06 | Lỗi mạng/429/503/JSON thiếu/AI trả muộn, task hủy, ngân sách giả | Hạn mức/đồng bộ |
| DL-07 | Nguồn chính thức/tham khảo/hết hiệu lực/không rõ nguồn và tài liệu có chỉ dẫn độc hại | Nguồn/memory/riêng tư |
| DL-08 | Đề thật được phép dùng, đáp án và nhận xét của người phù hợp từng môn/cấp | Chuyên môn và đánh giá AI độc lập |

DL-01–07 có thể dựng dữ liệu giả để bắt đầu kỹ thuật; không gọi chúng là đề chuẩn Bộ/trường. DL-08 hiện còn thiếu. Phải giữ một phần tập đánh giá không đưa vào prompt hoặc kho truy xuất khi so sánh chất lượng AI.

## 4. Ma trận độ phủ theo gói

Mỗi dòng của bảng thực hiện phải ghi: mã gói, môn/hoạt động, lớp, chương trình/sách/version, nguồn, loại bài/khung mức, khả năng tạo–nhập–sửa–trộn–xuất–giao–chấm, ca đã chạy, reviewer, lỗi còn lại. Dùng các trạng thái: chưa có / đang làm / kỹ thuật đạt / chờ chuyên môn / đã duyệt trong phạm vi.

Không lấy một mẫu mỗi cấp để chứng nhận toàn bộ lớp. Ca đại diện giúp phát hiện lỗi thiết kế sớm; nghiệm thu gói cần dữ liệu của gói đó. Loại bài không có điểm hoặc không có đáp án phải được thử riêng. Khả năng nghe/thực hành/ảnh không được ghi đạt chỉ vì câu chữ hiển thị đúng.

## 5. Điều kiện đạt và điều kiện dừng

- Các ràng buộc xác định như quyền, lưu dữ liệu, số lượng câu, tính điểm và snapshot phải đạt các ca bắt buộc; không chấp nhận lỗi bằng một tỷ lệ trung bình.
- AI không đặt trước ngưỡng chất lượng tùy ý. Sau khi có DL-08, thống nhất kích thước mẫu, phân nhóm và ngưỡng với người duyệt; báo cả số ca sai và kiểu sai.
- Phát hành bị chặn khi còn đường lộ đáp án ngoài chính sách, thao tác dữ liệu người khác, mất bài, chấm sai nghiêm trọng, backup không khôi phục được hoặc secret cấu hình sai.
- Chưa có người duyệt chuyên môn không chặn phát triển local, nhưng chặn nhãn “đã duyệt/chuẩn” cho nội dung chưa kiểm.
- Không chạy mutation/tải/restore trên dữ liệu thật; tạo môi trường và kiểm mục tiêu trước.

Một câu dài hơn trang không thể hứa không bao giờ ngắt; tiêu chí là không mất/tràn nội dung, ngắt hợp lý và giữ nhóm khi có thể. Hai lần AI đồng thuận không phải hai nguồn xác minh độc lập. Đếm request thành công không phải hóa đơn nhà cung cấp.



## Tình huống bổ sung22/10/2026 — chưa chạy

| Ca hiện có | Tình huống cần thêm | Kết quả mong đợi |
|---|---|---|
| NT-11/NT-28 | Cùng tiếng Nhật có NN1 và NN2; Khmer tổ chức theo trình độ | Chọn đúng chương trình, không gộp/ép thành cùng lớp; không lấy chương trình khác làm fallback |
| NT-11/NT-12 | Một chương trình có hai phiên bản, sách đổi theo năm học | Kế hoạch mới dùng phiên bản đã chọn; đề đã chốt giữ phiên bản cũ; mức nhận thức độc lập độ khó/trình độ |
| NT-11 | Hai phụ lục dùng cùngPDF, hai nơi đăng cùng văn bản | Không mất phụ lục, không nhân đôi tài sản chỉ vì hai mã; chưa so nội dung thì không tự hợp nhất bản lưu |
| NT-11 | Nguồn mới tìm, AI trước nói đã mở, chưa được duyệt | Ba trạng thái tách biệt; không tự gắn nhãn chuẩn hoặc đã được giáo viên nghiệm thu |

Bằng chứng nghiên cứu ở báo cáo04 là dữ liệu đầu vào, không phải kết quả PASS những ca trên.
# Đầu vào nghiệm thu bổ sung22/10/2026

Các ca dưới đây **chưa chạy**; bổ sung vào các NT hiện có, không tính PASS từ việc đọc nguồn.

| Ca | Đầu vào | Kết quả mong đợi |
|---|---|---|
| NT11/12/28 | NguồnTT89 có ban hành16/10 nhưng hiệu lực01/12; chạy trước/ngay/sau mốc | Chọn đúng phiên bản tại thời điểm; không đổi snapshot cũ |
| NT11/28 | Raglai tiểu học, NN2 theo quyển, Công nghệ/Tin học có nhánh | Catalog không ép cùng môn+lớp hoặc gán số quyển thành lớp |
| NT11/28 | URL SGV có thể mở nhưng chưa có quyền tái phân phối; SBT ghi bài mẫu | Tách truy cập, đã đọc, được duyệt và quyền sử dụng; không tự nhập kho chung |
| NT11/12 | Nguồn gắn “còn hiệu lực” nhưng bản ký ghi ngày tương lai; bản dự thảo | Căn cứ văn bản/version; không coi badge hoặc bản dự thảo là quy tắc hiện hành |
| NT03/27 | Migration nguồn và phân tích, phục hồi DB+tệp | Giữ liên kết/hash/quyền/phiên bản; không nhân đôi khi chạy lại |

Bộ fixture cần chuẩn bị: FX01–12 tại [hồ sơ08](08_HO_SO_TRUOC_KHI_CODE.md). Điều kiện thực thi và các NT gốc giữ bên dưới.

