# ExamCraft — Bổ sung chốt hướng V3

> **Tài liệu lịch sử/đầu vào phân tích:** từ 21/10/2026, dùng [bộ tổng kết và kế hoạch hiện hành](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md). Nội dung và dấu hoàn thành dưới đây không tự đại diện cho yêu cầu hoặc tiến độ mới; giữ để đối chiếu nguồn gốc.

Ngày: **21/10/2026**. Trạng thái: **phân tích để duyệt, chưa triển khai**.

Bản này cập nhật những điểm còn thiếu trong [báo cáo V2](F:/Workspace/Zazz/ExamCraft/docs/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md). Khi có khác biệt, nội dung V3 được ưu tiên. Các phát hiện mã nguồn và phân tích chi tiết còn lại của V2 tiếp tục là tài liệu đối chiếu.

## 1. Điều chỉnh quan trọng nhất

**Phạm vi xây dựng là đầy đủ các môn và lớp trong mục tiêu sản phẩm. Toán là môn chủ dự án dùng để tự kiểm tra nhanh, không phải giới hạn triển khai.** Các môn khác vẫn cần được thiết kế và thực hiện; việc chủ dự án khó kiểm tra hơn không phải lý do tự động hoãn chúng.

**Giao diện cần giúp giáo viên làm việc mà không buộc họ hiểu cấu trúc dữ liệu, API, ma trận kỹ thuật hoặc số hiệu văn bản.** Hệ thống xử lý phần phức tạp ở phía sau, đưa ra lựa chọn dễ hiểu và giải thích khi cần. Tài liệu nghiên cứu có thể chi tiết; màn hình làm việc không được bê nguyên tài liệu nghiên cứu lên.

Các kết luận đề xuất để duyệt:

- Giáo viên tự quản lý kết nối AI của mình; key miễn phí/trả phí dùng chung luồng, có quản lý hạn mức và chi phí phù hợp.
- Có bài tùy chỉnh, khảo sát, đánh giá đầu vào, ôn luyện, thi thử, thi học sinh giỏi và các loại bài giáo viên tự đặt tên.
- Giáo viên sửa được tên đề, năm học, tiêu đề, phần/câu và mẫu trình bày; AI không tự ghi đè lựa chọn đã sửa.
- Tự lưu nháp, có lịch sử và mốc phiên bản. Sao lưu vận hành là nền tảng; chuyển đổi DB nâng cao có thể để sau.
- Soạn cá nhân mặc định; công khai xem và cấp quyền cùng sửa là hai lựa chọn riêng như bạn đã đồng ý.

## 2. Quản lý API key phải là một phần rõ ràng của sản phẩm

### 2.1. Đặt ở đâu để dễ hiểu?

Bổ sung vào mục 4.1 của V2 một khu vực **“Cài đặt của tôi”**, gồm:

| Mục | Giáo viên thấy và làm được |
|---|---|
| Thông tin mặc định | Tên trường/đơn vị, tên giáo viên, năm học và mẫu thường dùng |
| Kết nối AI | Thêm key, kiểm tra kết nối, chọn kết nối dùng chính, thay hoặc xóa key |
| Sử dụng AI | Các tác vụ đã dùng, lỗi cần xử lý, chi phí ước tính nếu có đủ thông tin |
| Mẫu của tôi | Mẫu đề, mẫu trình bày, cách đặt tên phần/câu, lời dặn và chữ ký |
| Dữ liệu của tôi | Tải bản sao, xem lịch sử/khôi phục; kết nối nơi sao lưu cá nhân nếu được triển khai |

Tên ngoài giao diện nên là **“Kết nối AI”**. Trong hướng dẫn có thể giải thích “API key là mã kết nối lấy từ nhà cung cấp AI”. Không bắt người mới hiểu token, RPM, TPM hoặc tier ngay lần đầu.

Màn hình ban đầu chỉ cần: nhà cung cấp, tên kết nối, ô dán mã, nút kiểm tra và trạng thái. Quản lý nhiều key, model cụ thể và nhật ký chi tiết đặt trong phần mở rộng. Không bắt thêm nhiều key để ứng dụng hoạt động bình thường.

### 2.2. Miễn phí và trả phí có phải hai loại hệ thống khác nhau?

**Không, nếu cùng dùng Gemini Developer API.** API key dùng để xác thực/quy chiếu dự án; gói sử dụng và thanh toán gắn với cấu hình dự án/tài khoản liên quan. Vì thế thiết kế phù hợp là một bộ kết nối, đọc khả năng và xử lý hạn mức theo kết nối đang dùng, không nhân đôi sản phẩm thành “bản chạy key miễn phí” và “bản chạy key trả phí”. Đây là kết luận kiến trúc từ tài liệu [API key](https://ai.google.dev/gemini-api/docs/api-key) và [billing](https://ai.google.dev/gemini-api/docs/billing) của Google.

| Điểm so sánh | Miễn phí | Trả phí |
|---|---|---|
| Cách giáo viên kết nối ExamCraft | Thêm key, kiểm tra, sử dụng | Cùng cách làm |
| Model/tính năng | Tùy phần được nhà cung cấp cho phép | Có thể mở thêm khả năng, vẫn tùy model và dịch vụ |
| Hạn mức | Thường thấp hơn, dễ phải chờ | Có các mức cao hơn; không có nghĩa vô hạn |
| Chi phí | Theo phạm vi miễn phí được cung cấp | Theo bảng giá và mức dùng; không nên giả định dùng hết miễn phí rồi mới tính tiền |
| Chất lượng câu trả lời | Phụ thuộc model, dữ liệu, yêu cầu và kiểm tra | Trả phí tự nó không bảo đảm câu trả lời đúng hơn nếu vẫn dùng cùng model/cấu hình |

Hạn mức Gemini áp dụng **theo dự án, không phải mỗi key**, và thay đổi theo model. Nhiều key của cùng dự án không tự cộng thêm hạn mức. [Tài liệu hạn mức](https://ai.google.dev/gemini-api/docs/rate-limits).

Chính sách dữ liệu cũng khác: điều khoản dịch vụ miễn phí cho phép sử dụng đầu vào/đầu ra để cải thiện sản phẩm và nêu không gửi thông tin nhạy cảm, bí mật hoặc cá nhân; dịch vụ trả phí có chính sách sử dụng dữ liệu khác. Không được hiểu “riêng tư trong ExamCraft” đồng nghĩa “nhà cung cấp AI không xử lý dữ liệu”. Cần giải thích ngắn ở bước kết nối và giảm dữ liệu gửi đi, chẳng hạn bỏ tên học sinh khỏi nội dung cần phân tích. [Điều khoản Gemini API](https://ai.google.dev/gemini-api/terms).

Gói đăng ký ứng dụng Gemini và thanh toán Gemini API cần được phân biệt. Không suy ra có Google AI Pro là mọi lần gọi API trong ExamCraft đã được trả tiền; cần xem chính dự án API đang dùng. [Hướng dẫn gói ứng dụng](https://support.google.com/gemini/answer/14517446?hl=en), [thanh toán API](https://ai.google.dev/gemini-api/docs/billing).

Các thông tin trên áp dụng cho dịch vụ đã tra cứu ngày lập báo cáo, không phải cam kết mức giá/hạn mức cố định trong tương lai. Không cần hiển thị toàn bộ bảng này mỗi lần giáo viên soạn đề.

### 2.3. Không tự nhận diện gói bằng hình thức chuỗi key

Không dựa vào độ dài hoặc tiền tố key để kết luận miễn phí/trả phí. Cũng không dùng việc một lần gọi thành công để kết luận biết toàn bộ hạn mức hay số dư.

Nếu không có quyền lấy thông tin thanh toán chính xác, giao diện ghi **“Chưa xác định gói — xem tại nhà cung cấp”**. Giáo viên có thể ghi chú gói đang dùng, nhưng thông tin tự khai không phải số liệu đã xác thực. Không mặc định mọi key mới là miễn phí và hứa không phát sinh phí.

Khi kiểm tra kết nối cần nói rõ đó có thể là một lần gọi API. Không âm thầm thử hàng loạt model trả phí để kiểm tra một key.

### 2.4. Cách sử dụng an toàn và dễ quản lý

Đề xuất dùng một key đang được chọn cho mỗi giáo viên; hỗ trợ nhiều key khi họ cần. Key lưu ở server có bảo vệ, giao diện chỉ hiện phần che; không đưa key vào prompt, file xuất, link cộng tác hoặc log. Xóa key khỏi ExamCraft không đồng nghĩa thu hồi key ở Google; cần có đường dẫn hướng dẫn thu hồi tại nhà cung cấp.

Chi phí trên ExamCraft chỉ là **ước tính của các tác vụ ExamCraft ghi nhận**, không phải hóa đơn đầy đủ nếu key còn dùng ở ứng dụng khác. Có thể đặt mức dùng tối đa cho tác vụ và ngân sách ứng dụng, nhưng không hứa nó chặn được mọi chi phí phát sinh bên ngoài ExamCraft. Hóa đơn nhà cung cấp là nguồn đối chiếu cuối.

Không tự chuyển sang key/model khác có thể tốn tiền khi hết hạn mức. Chỉ cho phép phương án dự phòng khi giáo viên đã bật và hiểu chi phí. Tác vụ đọc tài liệu, tổng hợp memory và nghiên cứu nền cũng phải thuộc phạm vi sử dụng được giáo viên cho phép, không tự chạy vô hạn bằng key của họ.

Khi cộng tác, mặc định người bấm yêu cầu AI dùng kết nối của chính mình. Không tự dùng key chủ đề cho mọi người cùng sửa. Nếu sau này có người tài trợ chi phí cho nhóm thì cần một lựa chọn riêng với quyền và hạn mức rõ ràng.

### 2.5. Những gì mã hiện tại đã có và cần đổi

[ApiKeyModal](F:/Workspace/Zazz/ExamCraft/src/components/ApiKeyModal.tsx) đã có nền tảng quản lý nhiều key, trạng thái kiểm tra, chọn model và nhật ký. [API quản lý key](F:/Workspace/Zazz/ExamCraft/src/app/api/user/keys/route.ts) đã giới hạn theo người đăng nhập, lưu key qua hàm mã hóa và trả về bản che.

Tuy nhiên code đang tính cố định **1.500 lượt/key/ngày** rồi nhân số key; số này không phản ánh hạn mức Google thực tế. Cần thay bằng thống kê sử dụng trong ứng dụng và trạng thái hạn mức có nguồn xác thực; không có dữ liệu thì nói chưa biết. Thống kê theo nhãn key cũng cần chuyển sang ID ổn định để tránh hai key cùng tên bị cộng lẫn.

Ngoài ra vẫn giữ phát hiện V2: tất cả tác vụ AI phải dùng chung cách xác định tài khoản/kết nối, bao gồm sửa câu, đọc ảnh, đọc Word và phân tích cá nhân. Không cần viết hai hệ thống AI, nhưng cần sửa sự thiếu nhất quán đang có.

## 3. Các loại bài cần đầy đủ và cho phép tự đặt

### 3.1. Bổ sung bảng loại bài của V2

| Lựa chọn dễ hiểu | Cách hỗ trợ |
|---|---|
| Bài tập/luyện tập | Tự chọn kiến thức, có thể không tính giờ hoặc không chấm điểm |
| Kiểm tra thường xuyên | Chọn mục tiêu và phạm vi; thời lượng cấu hình riêng |
| Giữa kỳ/cuối kỳ | Gợi ý mẫu phù hợp, cho sửa và xem lại trước dùng |
| Khảo sát kiến thức/đánh giá đầu vào | Phát hiện kiến thức đã có hoặc chỗ cần củng cố, không bắt dùng ma trận học kỳ |
| Thi thử/ôn thi | Chọn kỳ thi hoặc cấu trúc mục tiêu; không tự coi đề thi thử là đề chính thức |
| Thi học sinh giỏi/chọn đội tuyển | Hỗ trợ phạm vi nâng cao, tự luận, nhiều cách giải và hướng dẫn chấm phù hợp; dùng nguồn của kỳ thi/đơn vị nếu có |
| Phiếu khảo sát ý kiến | Cho câu hỏi không có đúng/sai, không bắt chấm điểm hoặc gắn kiến thức; phân biệt với khảo sát kiến thức |
| Bài tùy chỉnh | Giáo viên tự đặt tên, loại câu, các phần, thang điểm và thời gian; có thể lưu làm mẫu |

“Bài tùy chỉnh” dễ hiểu hơn ép mọi trường hợp ngoài định kỳ vào một tên “đề tự do”. Tên do giáo viên đặt là nhãn hiển thị; hành vi như tính giờ, chấm điểm, hiện lời giải vẫn là cấu hình riêng.

### 3.2. Ba hoặc bốn mức không phải ba hoặc bốn loại đề

Cần tách **mục đích bài**, **mức nhận thức** và **độ khó**:

- Mục đích: luyện tập, khảo sát, giữa kỳ, thi học sinh giỏi…
- Mức nhận thức: hệ nhãn của mẫu đang áp dụng, có thể ba hoặc bốn mức tùy khung.
- Độ khó: mức phù hợp đối tượng, có thể giáo viên đánh giá hoặc hệ thống gợi ý; không đồng nhất hoàn toàn với mức nhận thức.

Một bài thi học sinh giỏi không có nghĩa mọi câu đều được gắn cùng một nhãn cao nhất. Một bài khảo sát ý kiến không cần các mức nhận thức. Bài tùy chỉnh được phép không phân mức; nếu giáo viên chọn mẫu có yêu cầu phân mức thì hệ thống mới hướng dẫn điền phần đó.

Không ép đổi mọi nguồn ba mức sang bốn mức hoặc ngược lại. Lưu nguyên khung áp dụng và nguồn; việc quy đổi nếu cần phải có cách giải thích, không tự đồng nhất các nhãn có tên gần nhau.

### 3.3. Giao diện không cần một danh sách cấu hình dài

Màn hình tạo bài có thể chỉ hỏi **“Thầy/cô muốn làm gì?”**, cho vài lựa chọn thường dùng và mục “Loại khác”. Sau đó chọn môn/lớp nếu phù hợp, chọn nội dung và bắt đầu từ mẫu hoặc trang trống. Cấu hình sâu mở khi cần.

Không bắt điền đủ mọi trường trước khi bắt đầu soạn. Cho tạo bản nháp thiếu thông tin; trước xuất/giao bài mới chỉ ra những thiếu sót thực sự ảnh hưởng. Ví dụ thiếu tên trường có thể cho phép; câu chấm tự động thiếu đáp án cần xử lý hoặc chuyển sang chấm tay.

## 4. D15 có thể giảm mức độ, nhưng không nên bỏ bảo vệ dữ liệu

**Người dùng dùng nhiều không thay thế sao lưu.** Dữ liệu còn có thể mất vì xóa nhầm, lỗi đồng bộ, lỗi chuyển phiên bản, hỏng lưu trữ hoặc mất quyền truy cập. Số lượng người dùng không giải quyết các trường hợp này.

Tôi đề xuất đổi D15 thành ba mức dễ quản lý:

| Mức | Quyết định đề xuất |
|---|---|
| Bảo vệ dữ liệu vận hành | Cần có: lưu server đúng, lịch sử/khôi phục, backup DB và tệp, kiểm tra phục hồi |
| Mang dữ liệu cá nhân ra ngoài | Nên có cách tải bản sao đề/câu/đáp án và tài liệu liên quan; giao diện đơn giản |
| Công cụ chuyển sang DB bất kỳ | Chưa cần hoàn thiện ngay; giữ ID, phiên bản dữ liệu và quan hệ rõ để không tự khóa đường chuyển sau này |

Không cần đưa “schema, JSONL, checksum, migration” lên màn hình giáo viên. Đó là trách nhiệm kỹ thuật ở phía sau. Có thể đặt tên tính năng là **“Tải bản sao dữ liệu của tôi”**.

### 4.1. Google Drive có thể dùng được không?

**Có thể chọn làm nơi giữ bản sao cá nhân bổ sung.** Tích hợp cần giáo viên kết nối Google và cấp quyền phù hợp; Google có cơ chế lưu dữ liệu riêng của ứng dụng trên Drive. [Tài liệu Drive](https://developers.google.com/workspace/drive/api/guides/appdata).

Đề xuất trải nghiệm: “Kết nối Google Drive” → chọn cách sao lưu → thấy lần sao lưu thành công gần nhất → có thao tác khôi phục/tải bản sao. Nếu muốn người dùng nhìn thấy file và tự tải, nên chọn thiết kế thư mục/file phù hợp; dữ liệu ẩn của ứng dụng là một lựa chọn khác, không đánh đồng hai cách.

Drive là nơi lưu bản sao, **không thay cho DB làm việc và không phải backup đầy đủ toàn hệ thống**. Một file Word trên Drive không chứa hết lịch sử, đáp án có cấu trúc, quyền cùng sửa hoặc bản đã giao. Đồng bộ thao tác xóa sang Drive ngay cũng không tạo ra lịch sử phục hồi; cần giữ nhiều phiên bản theo chính sách.

Nếu hết dung lượng, mất quyền kết nối hoặc backup thất bại thì phải báo thật. Không có Drive vẫn phải dùng ứng dụng và được hệ thống bảo vệ dữ liệu. Không buộc giáo viên biết cấu hình cloud mới giữ được đề của mình.

### 4.2. Phương án tôi chọn làm cơ sở lập kế hoạch

Lưu tự động lên server + dự phòng nháp trên thiết bị + mốc lịch sử + backup hệ thống tách khỏi bản đang dùng. Google Drive là kết nối tùy chọn cho bản sao cá nhân. Công cụ chuyển DB toàn diện chưa đặt làm điều kiện hoàn thành phiên bản đầu.

Tần suất backup, thời gian giữ và mức dữ liệu tối đa có thể mất khi sự cố phải được xác định trong kế hoạch vận hành theo hạ tầng/chi phí. Không cam kết “không bao giờ mất dữ liệu”; cần kiểm tra phục hồi thật và nói rõ mức bảo vệ. Backup phải bao gồm hình/tệp và khả năng khôi phục dữ liệu mã hóa, không chỉ bảng DB.

## 5. Giáo viên được sửa mọi thông tin trình bày phù hợp

**Có thể và nên cho sửa** tên đề, năm học, học kỳ, tên bài, tên phần, trường/đơn vị, môn/lớp hiển thị, thời gian, lời dặn, chữ ký và cách đánh số. Những giá trị AI gợi ý chỉ là nội dung ban đầu.

Một số trường là dữ liệu có tác động nghiệp vụ: thời lượng làm bài hoặc điểm không chỉ là chữ trang trí. Khi sửa trường này, cập nhật từ một nguồn dữ liệu và thông báo ảnh hưởng; không để đầu đề ghi 60 phút trong khi đồng hồ vẫn 45 phút. Nếu chỉ viết một ghi chú tự do thì đánh dấu là ghi chú, không hiểu thành cấu hình hệ thống.

### 5.1. Không bắt giáo viên cấu hình DB “dòng mấy, cột mấy”

Giáo viên nhìn bản xem trước, bấm vào phần cần sửa. Các thao tác quen thuộc: đổi chữ, thêm/xóa dòng, căn trái/giữa/phải, in đậm, kéo đổi thứ tự khối, ẩn thông tin không cần. Cấu hình chi tiết có thể mở ở thanh bên khi chọn khối.

Ví dụ đầu trang:

| Vùng trái | Vùng phải |
|---|---|
| Tên đơn vị chủ quản — có thể ẩn | Tên đề/bài |
| Tên trường/nhóm | Năm học/học kỳ — có thể ẩn |
| Mã đề — có thể ẩn hoặc chuyển vị trí | Môn, lớp, thời gian |

Đây chỉ là một mẫu hai cột. Cần hỗ trợ mẫu một cột, mẫu đơn giản cho phiếu bài tập và mẫu cá nhân. Không ép mọi giáo viên dùng phần đầu trang của đề thi THPT.

DB nên lưu **các khối có ID, vai trò, nội dung/liên kết dữ liệu, thứ tự và kiểu trình bày**; không dùng “dòng 3 của trang 1” làm định danh chính. Đổi font hoặc khổ giấy có thể làm dòng và trang thay đổi. Bố cục dựa trên khối và luồng văn bản phù hợp tài liệu dài hơn việc đặt mọi thành phần theo tọa độ cố định.

Lấy cách chọn phần tử/sửa trực quan của Canva làm cảm hứng, đồng thời giữ cách phân trang và dòng chảy của tài liệu. Tự động ngắt trang, kiểm tra tràn và giữ câu với hình/ngữ liệu cần được thiết kế cho xuất Word/PDF.

### 5.2. Tên phần và cách đánh số cũng tùy chỉnh

Giáo viên có thể đổi “Phần I” thành “A. Trắc nghiệm”, “Bài 1” hoặc tên khác, thêm phần không chấm điểm và chọn kiểu đánh số. Hệ thống vẫn giữ ID nội bộ ổn định để đáp án, trộn đề và chấm bài không phụ thuộc tên hiển thị.

Tách **kiểu câu thực tế** khỏi **tên phần**. Đổi tên phần thành “Tự luận” không tự biến các câu lựa chọn bên trong thành tự luận. Nếu muốn đổi kiểu câu, dùng thao tác riêng để kiểm tra dữ liệu/đáp án liên quan.

### 5.3. Mẫu chung, mẫu cá nhân và từng đề

Ba lớp kế thừa: **mẫu chung → bản sao/mẫu cá nhân → điều chỉnh trên đề cụ thể**. Giáo viên sửa bản cá nhân không sửa mẫu chung của mọi người. Thay đổi mẫu cá nhân về sau không tự làm thay đổi các bản đề đã chốt/giao.

Có các nút dễ hiểu: “Lưu làm mẫu của tôi”, “Dùng cho đề mới”, “Khôi phục mẫu”. Cập nhật mẫu lên đề đang soạn cần cho xem phần nào sẽ đổi. Nội dung đã được giáo viên sửa được giữ lại khi AI sinh lại câu; AI chỉ thay các vùng được yêu cầu, có thể đề nghị sửa vùng khác nhưng không tự áp dụng.

Giữ đúng dữ liệu trường/môn/lớp thật ở phía sau; trường chữ hiển thị tùy chỉnh không được làm sai bộ lọc hoặc scope. Khi người dùng đổi lớp thực tế, cần kiểm tra lại nội dung; khi đổi cách viết tên lớp hiển thị, không tự chuyển chương trình.

### 5.4. Quan sát trong code hiện tại

[Header](F:/Workspace/Zazz/ExamCraft/src/components/Header.tsx) đã có điểm vào đổi tên đề. [ExamMetadata](F:/Workspace/Zazz/ExamCraft/src/types/exam.ts:111) đã có một số trường như tên trường, năm học và học kỳ. Đây là nền tảng có thể tận dụng, không cần giả định toàn bộ đang thiếu.

Tuy nhiên [A4Preview](F:/Workspace/Zazz/ExamCraft/src/components/A4Preview.tsx:213) và [xuất Word](F:/Workspace/Zazz/ExamCraft/src/lib/docx-export.ts:440) còn có bố cục/chuỗi mặc định riêng. Có trường hợp để trống lại hiện tên cơ quan hoặc trường giả định. Cần phân biệt **chưa nhập**, **cố ý để trống/ẩn** và **dùng giá trị mặc định**. Không tự thêm “Sở” hoặc “Trường chuyên” vào tài liệu của người dùng.

Mẫu được soạn trên màn hình, in và xuất Word phải cùng nguồn cấu hình. Kiểm tra file xuất thực tế vẫn cần thiết vì mỗi định dạng có cách dàn trang khác nhau; không hứa giống từng pixel giữa web và Word.

## 6. Đơn giản hóa giao diện: làm cụ thể thế nào?

### 6.1. Mặc định ngắn, mở rộng khi cần

Màn hình chính chỉ ưu tiên công việc hiện tại: tìm tài liệu, tạo bài, soạn, xem đáp án, lưu, chia sẻ và xuất. Thông tin hỗ trợ đặt gần chỗ cần hành động, không mở đồng thời nhiều bảng thống kê/trợ lý/thông báo.

| Nội dung kỹ thuật trong báo cáo | Cách trình bày với giáo viên |
|---|---|
| Scope và curriculum mapping | “Nội dung được chọn” |
| Blueprint và allocation | “Phân bố câu và điểm”; khi cần mới mở ma trận chi tiết |
| Provenance và hiệu lực văn bản | “Nguồn mẫu” và “Xem chi tiết” |
| Validator báo thiếu answer key | “Câu 5 chưa có đáp án để chấm tự động” |
| Quota/429 | “AI đang quá giới hạn sử dụng. Thử lại sau hoặc xem kết nối.” |
| Version conflict | “Có người vừa sửa phần này. Xem hai bản trước khi lưu.” |
| Migration/export JSON | “Tải bản sao dữ liệu” |

Không yêu cầu giáo viên nhớ số văn bản. Gợi ý mẫu bằng tên dễ nhận: “Mẫu của trường”, “Mẫu kiểm tra giữa kỳ”, “Mẫu của tôi”. Có nguồn và thời điểm để tra cứu, nhưng không dùng số văn bản làm tên nút chính.

Không nên che thông tin quan trọng như phí AI, chưa lưu được hoặc câu chưa đủ dữ kiện. Đơn giản hóa là chọn đúng thời điểm và ngôn ngữ, không giấu lỗi để giao diện trông gọn.

### 6.2. Luồng tạo bài mặc định

**Chọn việc cần làm → chọn nội dung → chọn mẫu hoặc trang trống → soạn và xem lại.** Có thể nhập câu ngay hoặc nhờ AI, không bắt đi hết một biểu mẫu dài. Chat là đường bổ sung; người không muốn chat vẫn thao tác được bằng nút và chọn trực tiếp.

Khi giáo viên chọn mẫu có sẵn, tự điền cấu hình hợp lý và cho xem bản tóm tắt. Các mục như tỷ lệ mức độ, quy tắc chấm đặc biệt, phân bổ chi tiết và nguồn văn bản đặt trong “Điều chỉnh thêm”.

Lần đầu chưa có key vẫn cho soạn thủ công, nhập phần nội dung hỗ trợ không cần AI, lưu và xuất theo khả năng đã làm. Chỉ yêu cầu kết nối khi bấm tính năng AI. Có hướng dẫn từng bước, thông báo lỗi bằng tiếng Việt dễ hiểu và đường quay lại bản nháp.

### 6.3. Cần kiểm tra với người ít thành thạo công nghệ

Chủ dự án kiểm tra Toán rất có ích, nhưng chưa đại diện hoàn toàn cho giáo viên sử dụng hàng ngày. Khi kiểm thử nên có người mới thực hiện các việc thực tế: tạo một phiếu, sửa tiêu đề, đổi đáp án, mở lại đề, mời cùng sửa và giao link. Quan sát họ có tìm thấy thao tác và hiểu trạng thái lưu/chi phí không.

Không cần bắt mọi giáo viên trở thành người nghiên cứu quy định. Tuy vậy nội dung chuyên môn ở nhiều môn vẫn cần người phù hợp rà soát; AI và giao diện dễ dùng không thay thế được việc kiểm chứng chất lượng đó.

## 7. Làm đầy đủ các môn: cập nhật phạm vi để tránh hiểu sai

Thay cách diễn đạt “Toán là gói ưu tiên triển khai” bằng **“Toán là tuyến kiểm thử sớm của chủ dự án trong phạm vi triển khai nhiều môn”**.

Các phần dùng chung gồm lưu, tài khoản/key, mẫu, trình soạn, phiên bản, cộng tác, nhập/xuất và giao bài. Các phần đặc thù cần dữ liệu và kiểm chứng riêng, ví dụ:

| Nhóm nội dung | Điểm phải hỗ trợ phù hợp |
|---|---|
| Toán và các môn có công thức | Công thức, đơn vị, đồ thị/hình, đáp án tương đương và phương pháp theo lớp |
| Ngữ văn và môn có tự luận | Ngữ liệu, nhiều cách trả lời, tiêu chí và hướng dẫn chấm; không ép một đáp án ngắn |
| Ngoại ngữ | Ngữ liệu chung, nhiều dạng câu; âm thanh nếu loại bài yêu cầu, không giả đã có âm thanh |
| Lịch sử/Địa lí/GDKT&PL và các môn liên quan | Tư liệu, bản đồ/bảng số liệu, mốc thời gian/nguồn và phạm vi lớp |
| Môn/hoạt động đánh giá bằng nhận xét | Tiêu chí, nhiệm vụ thực hành/sản phẩm; không ép mọi bài thành trắc nghiệm thang 10 |

Các ví dụ này là yêu cầu thiết kế, không phải tuyên bố khả năng đã có trong app. Khi lập kế hoạch cần lập danh mục môn theo cấp/lớp và khả năng tạo–sửa–nhập–xuất–giao–chấm thực sự, không chỉ đếm 14 file cấu hình hiện có.

Có thể triển khai theo đợt để quản lý phụ thuộc và kiểm thử, nhưng không tự cắt các môn khác khỏi phạm vi. Dữ liệu chuyên môn chưa được kiểm chứng được ghi rõ trạng thái; không lấy Toán đạt để đánh dấu mọi môn đạt.

## 8. Cập nhật các quyết định để chuẩn bị duyệt

| Nội dung | Kết luận dùng cho lượt lập kế hoạch sau |
|---|---|
| Phạm vi | Đầy đủ các môn/lớp theo mục tiêu; Toán để chủ dự án kiểm tra sớm |
| Công khai và cộng tác | Bạn đã đồng ý: công khai xem tách quyền sửa, có cùng sửa và lịch sử |
| Cách lưu | Tôi chọn tự lưu nháp + mốc phiên bản + lưu vào ngân hàng là thao tác riêng, theo quyền bạn giao lựa chọn |
| Ví dụ thử | Bạn đồng ý có cả bài tùy chỉnh/luyện tập và bài theo mẫu; mở rộng các loại bài ở mục 3 |
| Người duyệt chuyên môn | Chọn người theo môn/cấp, có thể nhiều người; chưa có danh tính cụ thể. Không cần chặn phân tích/thiết kế vì chưa có người, nhưng chưa chứng nhận chất lượng thay họ |
| Mẫu địa phương/trường | Bạn đồng ý lấy mẫu thật khi có nơi dùng; ban đầu dùng nguồn có phạm vi rõ |
| API key | Bổ sung quản lý cá nhân, cùng bộ kết nối miễn phí/trả phí; không mặc định biết gói hoặc hạn mức |
| D15 | Giữ bảo vệ dữ liệu và bản sao người dùng; hoãn công cụ chuyển DB tổng quát; Drive tùy chọn |
| Mẫu trình bày | Cho sửa trực quan và lưu mẫu cá nhân; không ép cấu hình DB bằng dòng/cột |
| Giao diện | Ngắn, dễ hiểu, mở dần thông tin; nguồn và quy định nằm trong chi tiết tra cứu |

Các nội dung kỹ thuật như thư viện cộng tác, nơi lưu backup, tần suất/chi phí vận hành và cách đóng gói xuất dữ liệu sẽ được cụ thể hóa trong kế hoạch. Không cần buộc chủ dự án lựa chọn thư viện hoặc hiểu chi tiết DB ngay ở bước này.

## 9. Có cần hỏi thêm trước khi duyệt không?

**Hiện không có câu hỏi nào bắt buộc để hoàn thiện hướng sản phẩm.** Những điểm bạn giao lựa chọn đã có khuyến nghị cụ thể ở trên. Mặc định đề xuất: một kết nối AI chính của mỗi giáo viên; không tự chuyển sang kết nối có phí; soạn riêng tư; công khai chỉ xem; tự lưu; bảo vệ dữ liệu do hệ thống đảm nhiệm; Drive là tùy chọn.

Bạn có thể duyệt V3 cùng các phần không thay đổi của V2. Sau khi duyệt, mới lập kế hoạch và checklist đầy đủ, tách phần sửa nền hiện tại, phần giao diện, dữ liệu các môn, AI, cộng tác và nghiệm thu. Lượt này chỉ phân tích và bổ sung tài liệu, chưa thay đổi code hoặc dữ liệu ứng dụng.
