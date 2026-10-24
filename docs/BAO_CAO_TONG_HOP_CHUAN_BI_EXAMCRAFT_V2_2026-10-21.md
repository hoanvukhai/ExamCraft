# ExamCraft — Báo cáo tổng hợp để chốt hướng sửa đổi và chuẩn bị xây dựng

> **Tài liệu lịch sử/đầu vào phân tích:** từ 21/10/2026, dùng [bộ tổng kết và kế hoạch hiện hành](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md). Nội dung và dấu hoàn thành dưới đây không tự đại diện cho yêu cầu hoặc tiến độ mới; giữ để đối chiếu nguồn gốc.

Ngày cập nhật: **21/10/2026**. Phiên bản: **V2 — phân tích, chưa triển khai**.

> **Cập nhật sau phản hồi mới:** đọc [bản bổ sung V3](F:/Workspace/Zazz/ExamCraft/docs/BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md) trước khi chốt. V3 điều chỉnh phạm vi thành đầy đủ các môn, Toán là tuyến kiểm thử sớm; bổ sung quản lý key, bài tùy chỉnh, sao lưu và mẫu trình bày. Những điểm V3 thay đổi được ưu tiên hơn nội dung tương ứng bên dưới.

Bản này tổng hợp báo cáo trước, các hội thoại, báo cáo kiểm toán bổ sung và những câu trả lời mới của chủ dự án. Khi khác nhau về yêu cầu sản phẩm, **ý kiến mới của chủ dự án trong cuộc trò chuyện này được ưu tiên**. Các hướng kỹ thuật dưới đây là đề xuất để đọc và chốt; chưa phải checklist thi công, lịch triển khai hay chứng nhận chất lượng.

## 1. Hướng tổng thể nên chốt

**ExamCraft là không gian làm việc của giáo viên: quản lý tài liệu và kiến thức, soạn câu hỏi–đáp án–đề, cộng tác, xuất tài liệu và giao bài bằng liên kết.** Học sinh chỉ tham gia những bài giáo viên mở; không cần xây một nền tảng học tập tự do cho học sinh.

Giữ dự án hiện có và sửa theo từng phần là hướng hợp lý. Giá trị cần bổ sung nằm ở lõi dữ liệu giáo dục, sự nhất quán của câu hỏi/đáp án và độ tin cậy của luồng lưu–chia sẻ–giao bài. Viết lại toàn bộ lúc này sẽ phải làm lại nhiều phần hữu ích mà chưa giải quyết được các quyết định nghiệp vụ đang thiếu.

Năm điểm định hướng chính:

1. **Giáo viên chọn phạm vi** qua mục lục sách, cây kiến thức hoặc chat; cả ba phải dẫn đến cùng một danh sách kiến thức cụ thể.
2. **Mẫu có nguồn, giáo viên được sửa**: phân biệt mẫu chính thức trong phạm vi áp dụng, mẫu trường/tổ chuyên môn và bản tùy chỉnh của giáo viên.
3. **Câu hỏi và đáp án là một đơn vị có liên kết**, được xem và soạn bằng nhiều chế độ; sửa câu phải làm rõ ảnh hưởng tới đáp án, ma trận và bản đã giao.
4. **Soạn cá nhân và cộng tác cùng tồn tại**: riêng tư mặc định; chia sẻ xem, góp ý, cùng sửa có quyền riêng và lịch sử. Công khai không mặc nhiên cho mọi người sửa bản gốc.
5. **AI tích lũy kiến thức bằng dữ liệu bền vững**: nguồn, phân tích, mẫu và nhận xét được lưu có cấu trúc, có phiên bản, có thể xuất/nhập; không phụ thuộc vào một đoạn chat hoặc một nhà cung cấp AI.

Phạm vi ưu tiên đã được bạn chọn: **Toán đầy đủ lớp 1–12**, khung chương trình chung trước, bổ sung mục lục của **Kết nối tri thức với cuộc sống, Chân trời sáng tạo và Cánh Diều** theo gói. Mục tiêu nhiều môn vẫn được giữ. Kiểm chứng từng gói là cách quản lý chất lượng, không đổi yêu cầu thành chỉ làm Toán 12.

**Gợi ý đọc:** mục 3 trả lời từng ý của bạn; mục 5–6 giải thích mẫu và cây kiến thức; mục 7–8 là trải nghiệm soạn/cộng tác; mục 9–10 trả lời bài toán AI tích lũy và không mất dữ liệu; mục 12 đối chiếu các lỗi; mục 14–15 tập hợp điều đã chốt và điều còn mở.

## 2. Nguồn, mức xác minh và cách đọc báo cáo

### 2.1. Tài liệu đã tổng hợp

| Nguồn | Vai trò |
|---|---|
| [Hội thoại TXT](<F:/Downloads/Xây Dựng Web Soạn Đề AI.txt>) | Lịch sử yêu cầu, phương án dữ liệu và những lần điều chỉnh hướng |
| [Hội thoại ChatGPT được chia sẻ](https://chatgpt.com/share/6ad84d64-fcf8-83ec-89c0-a17d2646a480) | Các lựa chọn sản phẩm và yêu cầu đơn giản hóa khung tri thức đã đọc ở lượt trước |
| [Báo cáo phân tích V1](F:/Workspace/Zazz/ExamCraft/docs/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md) | Baseline, phát hiện R01–R16 và mô hình scope/ma trận/kiểm định |
| [Báo cáo kiểm toán AI bổ sung](F:/Downloads/EXAMCRAFT_MASTER_AUDIT_AND_ROADMAP.md) | Nguồn giả thuyết lỗi và các đề xuất cần đối chiếu |
| [Nhật ký AI bạn gửi](<C:/Users/ACER/.codex/attachments/e23ddfae-dc07-4585-9d3c-95555ee9a6e8/Pasted text.txt>) | Mô tả hoạt động và kết luận của đợt kiểm toán khác; không thay cho log HTTP hoặc bằng chứng chạy mới |
| Mã nguồn hiện tại và schema | Đối chiếu đường đi dữ liệu, lưu đề, BYOK, chia sẻ, làm bài, bộ nhớ AI |
| Văn bản và mẫu giáo dục dẫn tại mục 5 | Phân biệt quy định, mẫu áp dụng tại đơn vị và tài liệu tham khảo |
| Phản hồi 1–10 và ba câu trả lời bổ sung của bạn | Yêu cầu hiện tại, ưu tiên hơn lời AI trong tài liệu cũ |

Những câu trong tài liệu như “bắt đầu sửa”, “xóa bảng”, “giao cho năm AI” là nội dung lịch sử cần đánh giá, không phải lệnh thực thi của lượt này.

### 2.2. Những gì đã và chưa được chứng minh

Repo ở HEAD `bb831f2` nhưng có nhiều thay đổi chưa commit từ trước. Kiểm kê lượt trước có 42 file API route, 20 model Prisma, 14 cấu hình môn; con số “35 route/100%” trong báo cáo gửi thêm không mô tả chính xác phạm vi cây làm việc đã kiểm kê.

Lượt trước đã thực chạy: **20/20 unit test hiện có đạt**, TypeScript không phát hiện lỗi. Lượt bổ sung này đọc đối chiếu mã nguồn và nghiên cứu tài liệu, **không chạy lại toàn bộ bộ test, không chạy E2E có DB, không thử tấn công hệ thống đang dùng**. Các số liệu lint, 48/48, 25/25, 13/14, mutation 7/10 trong báo cáo khác được xem là kết quả được tác giả báo lại, chưa được tái lập trong lượt này.

Ba mức bằng chứng được dùng:

- **Đã đối chiếu code:** thấy logic hoặc sự không khớp trực tiếp; hậu quả thực tế còn phụ thuộc đường gọi và dữ liệu.
- **Được báo lại/chưa tái lập:** cần kiểm tra bằng môi trường thử nghiệm khi sang giai đoạn thực hiện.
- **Đề xuất thiết kế:** quyết định nên làm, không có nghĩa hiện tại đã tồn tại.

Không có cơ sở kết luận “đã kiểm tra 100%”, “ổn định 100%”, hoặc mọi người dùng đều gặp cùng một lỗi. Các file Word chỉ được nhắc tới bên trong chat chia sẻ chưa được xem như tài liệu đã trực tiếp đọc.

## 3. Trả lời và hợp nhất các ý của bạn

| Ý của bạn | Kết luận đưa vào định hướng |
|---|---|
| 1. Học sinh học trong hệ thống hay làm bài? | Cách diễn đạt cũ gây hiểu nhầm. Thay bằng **“Giáo viên muốn đề sử dụng những kiến thức nào, theo tiến độ nào?”**. Kiến thức học ở lớp/ngoài hệ thống; ExamCraft dùng thông tin đó để hỗ trợ giáo viên. |
| 2. Giáo viên tự chọn phần học/kiểm tra | Đúng. Cần mục lục sách và cây kiến thức, tìm kiếm và chọn bằng chat; không ép giáo viên chọn nguyên chương hoặc theo một thứ tự cố định. |
| 3. Có sẵn mẫu Bộ/trường rồi sửa | Đúng. Mẫu phải có nguồn, phạm vi, ngày áp dụng. Sửa thành bản riêng; không ghi đè mẫu gốc và không giữ nhãn “đúng mẫu gốc” nếu đã thay đổi ràng buộc. |
| 4. Soạn câu và soạn đáp án liên kết | Đồng ý. Có chế độ Đề, Đáp án–hướng dẫn chấm và Xem song song; cùng dùng một bản dữ liệu câu hỏi. |
| 5. Lưu từng câu/toàn bộ, trải nghiệm kiểu Canva | Nên tự lưu nháp và có lưu phiên bản toàn đề; “lưu vào ngân hàng” là thao tác khác. Lấy cách chọn phần tử và sửa tại chỗ của Canva làm cảm hứng. |
| 6. AI đọc đề, viết phân tích, học từ mẫu có uy tín | Nên có kho phân tích có bằng chứng, nhưng phải tách nhận xét cá nhân, mẫu tham khảo và quy tắc chính thức. AI tự tin hay nhiều lượt chia sẻ không chứng minh một mẫu là chuẩn. |
| 7. D01–D09, ưu tiên Toán tất cả lớp | Ghi nhận D01/D02/D04–D08 được đồng ý; D03 thay thành Toán 1–12; D09 đồng ý cần duyệt chuyên môn nhưng chưa có người cụ thể. |
| 8. Sợ dữ liệu AI mất khi đổi DB hoặc admin không đọc được | Có thể tránh bằng lưu dữ liệu gốc, phân tích có cấu trúc, xuất/nhập trung lập và thử khôi phục. Quyền admin xem nội dung không đồng nhất với khả năng sao lưu. |
| 9. Báo cáo AI khác | Đã đọc và đối chiếu; tiếp thu lỗi đúng, sửa khẳng định quá mức, không tự nhận kết quả test của AI khác là kết quả mới. |
| 10. Tổng hợp trước, chốt rồi mới lên checklist | Bản này phục vụ chốt nghiệp vụ và kiến trúc. Chưa sửa ứng dụng, chưa phân sprint hoặc dựng checklist thi công. |

Ba phản hồi bổ sung đã ghi nhận: phân tích riêng tư mặc định và tự chọn đóng góp; kết hợp soạn cá nhân với chia sẻ/cùng sửa/lịch sử; xây chương trình Toán chung trước rồi ánh xạ cả ba bộ sách.

## 4. Phạm vi sản phẩm: giáo viên là trung tâm

### 4.1. Các không gian làm việc phù hợp

| Không gian | Việc chính của giáo viên |
|---|---|
| Kho đề và tài liệu | Thư mục, tìm kiếm, phiên bản, nhập tài liệu, nhân bản, chia sẻ, thùng rác/khôi phục |
| Kiến thức và chương trình | Chọn môn/lớp, xem mục lục sách và cây kiến thức, chọn phạm vi, quản lý mẫu |
| Bàn soạn | Viết/sinh/sửa câu, đáp án, lời giải, hình, ma trận; góp ý và cùng sửa |
| Ngân hàng câu hỏi | Lưu câu đã chọn, phân loại, ghi nguồn, dùng lại và theo dõi phiên bản |
| Giao bài và kết quả | Mở/đóng liên kết, danh sách lớp tùy chọn, hạn nộp, chấm và trả kết quả |
| Trợ lý và bộ nhớ cá nhân | Tìm tài liệu, phân tích, gợi ý; xem/sửa/xóa điều AI ghi nhớ |

“Nhiều chức năng quản lý” nên phát triển quanh công việc soạn–dùng tài liệu. Chưa có yêu cầu xây học bạ toàn trường, thời khóa biểu, học phí hay nền tảng khóa học.

### 4.2. Học sinh tham gia qua liên kết

Giáo viên tạo bài → chọn cách nhận diện người làm → đặt thời gian, lượt làm và cách hiện đáp án → mở link/QR → học sinh làm bài → giáo viên xem và trả kết quả.

Không bắt học sinh có tài khoản giáo viên. Có thể cho nhập tên, chọn danh sách lớp hoặc dùng mã do giáo viên cấp. Nhập tên thuận tiện nhưng không chứng minh được danh tính; bài quan trọng nên có nhận diện phù hợp. Dù không đăng nhập, mỗi lượt làm vẫn cần một quyền truy cập riêng để người khác không sửa/nộp hộ chỉ vì biết ID.

Link làm bài, link xem tài liệu và lời mời đồng biên soạn là ba loại khác nhau. Một link xem đề không được mặc nhiên làm lộ đáp án hoặc cho sửa. Trang chủ giáo viên không có ô học sinh vào làm bài **không còn được coi là thiếu sót bắt buộc**. Ô nhập mã có thể bổ sung nếu giáo viên cần, không phải trọng tâm định hướng.

## 5. Mẫu, ma trận và phạm vi kiến thức: căn cứ nào đáng dùng?

### 5.1. Bốn khái niệm cần tách

| Khái niệm | Cách hiểu dễ dùng |
|---|---|
| Phạm vi kiến thức | Được dùng nội dung nào, loại nội dung nào, giới hạn phương pháp/kiến thức tiên quyết nào |
| Ma trận | Phân bổ nội dung, dạng câu, mức nhận thức và điểm |
| Bản đặc tả | Mô tả cụ thể yêu cầu cần đánh giá ở các phần/câu |
| Mẫu trình bày | Tiêu đề, thông tin trường, phông chữ, khổ giấy, vị trí đáp án và bố cục |

Một file có bảng ma trận đẹp chưa chứng minh câu hỏi khớp đặc tả. Một đề đúng chương nhưng giải bằng công cụ chưa phù hợp lớp cũng cần được xem xét. Cần quản lý cả nội dung, phương pháp và cách đánh giá.

### 5.2. Các nguồn đã tìm được và giới hạn sử dụng

**Đánh giá THCS/THPT:** Điều 6–7 của bản Thông tư 22/2021 phân biệt thường xuyên với giữa/cuối kỳ; bài định kỳ bằng điểm số dựa trên ma trận, đặc tả và yêu cầu cần đạt. Thời gian bài kiểm tra phụ thuộc số tiết môn học: 45 phút hoặc 60–90 phút, môn chuyên có giới hạn riêng. Điều này không suy ra số bài học từ số phút. [Bản công báo Thông tư 22/2021, trang PDF 4–5](https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2021/7/36881/40026-1-2021725-72622-2021-tt-bgddt.pdf).

**Tiểu học:** Thông tư 27/2020 có cách đánh giá và ba mức thiết kế câu hỏi riêng; giữa kỳ môn Toán ở lớp 4–5 có quy định khác lớp nhỏ. Vì vậy không áp nguyên bộ nhãn/tỷ lệ THPT xuống lớp 1–5. [Bản công báo Thông tư 27/2020, Điều 7](https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2020/9/32035/32512-1-2020883-88427-2020-tt-bgddt.pdf).

**Công văn 7991:** Phần hướng dẫn liên quan và phụ lục đã đối chiếu ở V1 là cơ sở tham khảo ma trận/đặc tả; không phải một cấu hình duy nhất cho mọi cấp, mọi môn và mọi bài. Không tự áp cố định toàn bộ tỷ lệ minh họa vào mọi giáo viên. [Bản sao Công văn 7991 và phụ lục](https://cdn.thuvienphapluat.vn/phap-luat/2022-2/PNHP/thang-12/19/file/cong-van-7991-huong-dan-KTDGDK.pdf).

**Định dạng tốt nghiệp:** Quyết định 764 là nguồn cho cấu trúc một kỳ thi cụ thể. Toán 12/4/6 không phải cấu trúc chung cho Toán lớp 1–12. Đính chính báo cáo AI gửi thêm: bảng của văn bản này ghi GDKT&PL 24 câu nhiều lựa chọn, 4 câu đúng/sai, không có phần trả lời ngắn. [Bản sao QĐ 764 trên website trường](https://locthanhbaoloc.lamdong.edu.vn/home/uploads/news/2024_09/quyet-dinh-so-764_qd-bgddt.pdf).

**Mẫu trường có thật:** Tài liệu Tổ Toán THPT Cần Đước có ma trận giữa/cuối kỳ II lớp 10–12 năm học 2025–2026. Đây là ví dụ tốt cho dữ liệu theo trường, lớp, thời điểm, nhưng không đại diện toàn quốc. Ngay trang đầu có ngày lập ghi năm 2025 trong tài liệu mang năm học 2025–2026: cần ghi nhận để đối chiếu, không để AI tự sửa hoặc bỏ qua. [Tài liệu trường, PDF 12 trang](https://thptcanduoc.longan.edu.vn/EgovMedia/Download/27639?file=122837882b2452710e2ccddbb1b20290).

**Cập nhật thời điểm nghiên cứu:** Đã tìm thấy thông tin chính thức về Thông tư 89/2026 sửa đổi quy định đánh giá; không nên tiếp tục dùng bài dự thảo tháng 8/2026 như văn bản cuối. Nguồn Chính phủ ngày 21/10 nêu hiệu lực 01/12/2026, tức chưa đến ngày áp dụng tại ngày lập báo cáo. Đã mở được trang chứa bản PDF tại Đại học Thái Nguyên nhưng chưa trích đọc được toàn văn PDF trong công cụ, nên chưa chuyển các sửa đổi thành quy tắc máy. [Thông tin ban hành trên Báo Chính phủ](https://baochinhphu.vn/quy-dinh-moi-trong-danh-gia-hoc-sinh-tieu-hoc-thcs-va-thpt-102261020155041243.htm), [thông tin thời điểm áp dụng](https://baochinhphu.vn/de-kiem-tra-chung-cuoi-cap-them-thuoc-do-chat-luong-giao-duc-102261021113042778.htm).

Đây là các căn cứ khởi đầu đã nghiên cứu, chưa phải danh mục đầy đủ mọi sửa đổi và hướng dẫn địa phương. Trước khi phát hành một gói “theo mẫu áp dụng”, cần đối chiếu bản gốc, hiệu lực và hướng dẫn đúng nơi dùng.

### 5.3. Trả lời trực tiếp về 15 phút, 60 phút, giữa kỳ, cuối kỳ

| Cách gọi | Cách hệ thống nên hiểu |
|---|---|
| 15 phút | Thời lượng ngắn; giáo viên có thể chọn một bài, vài nội dung hoặc một kỹ năng. Không khóa thành “đúng một bài”. |
| 60 phút | Thời lượng; không đủ để suy ra số bài/chương hay loại kiểm tra. |
| Giữa kỳ | Kiểm tra theo phạm vi và tiến độ được lựa chọn cho thời điểm giữa kỳ; không tự chia đôi mục lục sách. |
| Cuối kỳ | Theo kế hoạch kiểm tra cuối kỳ; không mặc định mọi câu phải trải đều toàn bộ sách hay cả năm. |
| Bài tập về nhà/luyện tập | Mục đích sử dụng; có thể không tính giờ, có nhiều lượt và cho xem lời giải theo lựa chọn giáo viên. |

Kết luận thiết kế: lưu riêng **mục đích, loại đánh giá, thời lượng, phạm vi và mẫu áp dụng**. Giao diện có gợi ý sẵn nhưng giáo viên xem được và chỉnh được từng phần. Khi dữ liệu có mâu thuẫn, giải thích cụ thể thay vì tự thay lựa chọn.

### 5.4. Phân tầng mẫu và quyền tùy chỉnh

| Loại mẫu | Ai xác lập giá trị sử dụng? | Khi giáo viên sửa |
|---|---|---|
| Mẫu/quy tắc từ văn bản có thẩm quyền | Cơ quan ban hành, trong phạm vi văn bản | Tạo bản riêng, hiển thị các điểm khác; không tự tuyên bố còn phù hợp quy tắc bắt buộc |
| Mẫu địa phương/trường/tổ | Đơn vị áp dụng, kèm thời gian và đối tượng | Bản riêng kế thừa nguồn; có thể cần tổ chuyên môn duyệt theo quy trình của họ |
| Mẫu tham khảo | Người biên soạn/đơn vị công bố; có đánh giá chất lượng riêng | Dùng như gợi ý, không gắn nhãn chính thức |
| Mẫu cá nhân | Giáo viên | Toàn quyền tùy chỉnh và đặt làm mặc định cá nhân |

AI có thể tìm, trích xuất, so sánh và đề nghị phân loại. Nhãn “chính thức” cần bằng chứng về nguồn và phạm vi, không dựa vào lượt tải. Nhiều website chép lại một file vẫn chỉ là một nguồn gốc. Một giáo viên có thể tạo mẫu rất tốt, nhưng mẫu tốt không tự trở thành quy định chung.

## 6. Cây mục lục và cây kiến thức nên thiết kế thế nào?

### 6.1. Hai cách nhìn, liên kết bằng yêu cầu cần đạt

**Cây mục lục:** môn → lớp → bộ sách/phiên bản → tập → chương/chủ đề → bài → mục nhỏ. Đây là cách giáo viên nhận diện nhanh phần mình đang dạy.

**Cây kiến thức:** môn → mạch nội dung → chủ đề → khái niệm/kỹ năng → yêu cầu cần đạt. Mỗi nút có giới hạn lớp, nguồn và liên hệ tiên quyết. Trên giao diện có thể là cây; dữ liệu bên dưới cần hỗ trợ nhiều liên kết vì một kỹ năng có thể xuất hiện ở nhiều bài/bộ sách.

Hai cây liên hệ nhiều–nhiều. Không lấy số thứ tự bài làm ID kiến thức; không giả định tên chương giống nhau giữa ba bộ sách. Một bài có thể bao phủ nhiều yêu cầu, một yêu cầu có thể được học qua nhiều bài.

Khung chương trình chung làm trục chính. Mục lục sách là lớp ánh xạ theo phiên bản. Kiến thức tùy chỉnh của giáo viên được lưu riêng, có thể đề nghị ánh xạ vào khung chung nhưng không ghi đè khung chung.

### 6.2. Giáo viên chọn bằng ba đường

- Chọn trực tiếp từ mục lục sách, chọn cả nhánh hoặc từng bài/mục.
- Chọn theo kiến thức/kỹ năng, kể cả nhiều phần không liền nhau.
- Chat với AI, ví dụ “lấy các phần đã chọn, bỏ bài cuối, tăng câu vận dụng”; AI hiển thị thay đổi dự kiến để áp dụng vào danh sách cụ thể.

Cả ba đường phải cập nhật cùng một bảng **“Phạm vi đang dùng”**: phần được chọn, phần loại, giới hạn phương pháp, phần AI chưa ánh xạ được. Nếu giáo viên nói “đến bài này” thì cần biết bộ sách và bài cụ thể; nếu thiếu thì hỏi hoặc để lựa chọn chờ xác nhận, không tự đoán là học hết học kỳ.

Một phạm vi có thể lưu thành mẫu dùng lại cho lớp/đợt kiểm tra. Không cần theo dõi từng học sinh đã học bài nào để thực hiện chức năng này.

### 6.3. Toán lớp 1–12 là mục tiêu đầy đủ, nhưng có khác biệt thật

| Nhóm lớp | Điểm cần kiểm chứng riêng |
|---|---|
| 1–5 | Ngôn ngữ theo tuổi, hình minh họa, bài toán có lời văn, mức đánh giá và phương pháp phù hợp |
| 6–9 | Các mạch số/đại số, hình học, thống kê/xác suất; điều kiện bài toán, cách trình bày lời giải |
| 10–12 | Nhiều cấu trúc kiểm tra, công thức/hình/đồ thị phức tạp, ma trận và thang điểm theo mục đích |

“Nhiều người học Toán” giúp tuyển người dùng thử, nhưng không đồng nghĩa kiểm chứng chuyên môn dễ như nhau. Một lời giải đúng theo toán học vẫn có thể không phù hợp công cụ học sinh được dùng ở lớp đó.

Mỗi gói lớp/bộ sách phải công bố riêng mức hoàn thiện: đã có cây, đã ánh xạ nguồn, đã có mẫu, đã kiểm chứng sinh–sửa–xuất–chấm. Một menu có đủ 12 lớp chưa chứng minh hỗ trợ đầy đủ.

## 7. Soạn đề, đáp án và hướng dẫn chấm

### 7.1. Một câu hỏi gồm những gì?

Đề xuất mỗi câu có: ID ổn định, phiên bản, nội dung, các lựa chọn/ý con, hình và ngữ liệu liên quan, đáp án được chọn, lời giải, hướng dẫn chấm, điểm, kiến thức liên quan, nguồn và trạng thái kiểm tra.

Phải phân biệt:

- **Đáp án:** kết quả được chấp nhận; có thể có nhiều dạng tương đương.
- **Lời giải:** cách giải thích để giáo viên/học sinh hiểu; có thể có nhiều cách.
- **Hướng dẫn chấm:** phân điểm theo bước, điều kiện và lỗi thường gặp.

AI được đề xuất cả ba; giáo viên được viết, nhập từ nguồn hoặc chọn một phương án. Không mặc định câu trích từ file đã có đáp án đáng tin. Nếu nguồn thiếu đáp án, đánh dấu thiếu; phần AI giải thêm phải mang nguồn gốc “AI đề xuất”, không giả thành đáp án của tài liệu.

### 7.2. Ba chế độ trên cùng bàn soạn

| Chế độ | Nội dung chính |
|---|---|
| Soạn đề | Câu dẫn, lựa chọn, ý con, hình, vị trí câu và điểm |
| Soạn đáp án | Đáp án ngắn, lời giải, hướng dẫn chấm, nguồn và trạng thái duyệt; luôn thấy câu tương ứng |
| Xem song song | Câu ở một phía, đáp án/lời giải phía còn lại; chọn câu nào thì hai phía đi cùng nhau |

Nên có chế độ trình chiếu để thầy cô giải thích: phóng to một câu, hiện dần lời giải, ẩn đáp án mặc định. Chế độ này phục vụ giảng dạy của giáo viên, không biến thành nền tảng học độc lập.

Không lưu ba bản nội dung riêng cho ba giao diện. Việc ẩn đáp án trên giao diện học sinh phải đi kèm lọc dữ liệu ở server; chỉ giấu bằng giao diện là không đủ.

### 7.3. Khi thay đổi phải xử lý liên kết

Sửa dữ kiện câu có thể làm đáp án, lời giải, mức nhận thức và phân bổ ma trận cũ không còn phù hợp. Hệ thống đánh dấu phần cần kiểm lại, không tự coi kết quả kiểm định trước đó còn đúng.

Lựa chọn và ý con có ID riêng; A/B/C/D chỉ là nhãn hiển thị. Trộn đề không được đổi câu trả lời đúng vì đổi chữ cái. Câu gắn ngữ liệu chung phải được giữ thành nhóm phù hợp khi trộn.

Với tự luận, chưa chấm không được trình bày như điểm 0 cuối cùng. Có trạng thái “chờ giáo viên chấm”, điểm tạm và điểm đã chốt. Trả lời ngắn cần quy tắc theo câu: số, phân số, biểu thức, đơn vị, độ chính xác; không đổi mọi chuỗi sang số rồi coi tương đương.

## 8. Trải nghiệm lưu và cộng tác theo ý bạn

### 8.1. Lưu từng câu và lưu toàn bộ có vai trò khác nhau

Khuyến nghị **tự lưu nháp vào server**, có bản dự phòng cục bộ khi mất mạng; nút **“Lưu phiên bản”** tạo mốc toàn đề để quay lại. Trạng thái hiển thị rõ “Đang lưu”, “Đã lưu”, “Chỉ lưu trên máy”, “Lưu lỗi”. Chỉ báo đã lưu server khi nhận xác nhận thành công.

Trên từng câu nên có:

- “Xong” hoặc “Áp dụng thay đổi” khi đang sửa một khối.
- “Lưu vào ngân hàng” khi muốn dùng câu đó ở đề khác.
- “Khôi phục phiên bản” và lịch sử của câu khi cần.

Không nên bắt giáo viên bấm lưu từng câu rồi lại lưu cả đề mới thực sự giữ được dữ liệu. Nếu chọn thao tác lưu thủ công, tên nút phải nói rõ lưu nháp, tạo phiên bản hay đưa vào ngân hàng.

### 8.2. Cộng tác: kết hợp cá nhân, chia sẻ và cùng sửa

Bạn đã chọn kết hợp các hình thức. Đề xuất mô hình quyền như sau:

| Cách chia sẻ | Người nhận làm được gì? |
|---|---|
| Riêng tư | Chỉ chủ sở hữu và người được mời |
| Xem qua link/công khai | Đọc bản được công bố; quyền xem đáp án và tải/nhân bản cấu hình riêng |
| Góp ý | Bình luận theo câu/đoạn, đề nghị thay đổi; chưa sửa trực tiếp bản gốc |
| Cùng chỉnh sửa | Thành viên hoặc người có link sửa được cấp quyền rõ ràng cùng sửa bản làm việc |
| Nhân bản | Tạo bản riêng, không ảnh hưởng tác giả gốc |

**Công khai** là phạm vi người có thể tiếp cận; **cùng sửa** là quyền thao tác. Hai lựa chọn độc lập này đáp ứng ý bạn tốt hơn một nút “công khai = ai cũng sửa”. Có thể mời cùng sửa một đề vẫn riêng tư, hoặc công khai xem nhưng chỉ nhóm được mời được sửa.

Cùng sửa đồng thời cần hiện người đang làm, lịch sử ai sửa gì/khi nào, xử lý hai người sửa cùng vị trí và khôi phục. Khuyến nghị dùng cơ chế cộng tác phù hợp cho khối văn bản và kiểm soát phiên bản cho cấu trúc câu/điểm; không dùng cách “bản lưu cuối thắng” âm thầm ghi đè. Lựa chọn thư viện cụ thể sẽ nằm ở kế hoạch kỹ thuật sau khi chốt, không quyết định vội từ một ảnh giao diện Canva.

Lịch sử nội dung và lịch sử quyền chia sẻ đều cần giữ. Thu hồi quyền sửa phải có tác dụng với phiên đang mở. Mọi thay đổi do AI cũng ghi người yêu cầu và phần thay đổi; AI không tự trở thành đồng tác giả có quyền phát hành.

### 8.3. Bản nháp, bản công bố và bản đã giao

Cần ba trạng thái rõ: **bản đang soạn**, **phiên bản đã chốt**, **bản chụp của bài đã giao**. Sửa đề gốc không tự đổi câu/đáp án của học sinh đang làm. Nếu giáo viên phát hiện đáp án sai sau giao bài, dùng thao tác đính chính/chấm lại có ghi lịch sử và chính sách thông báo, không sửa ngầm.

Bản công khai xem cũng nên chỉ rõ đang là bản cố định hay bản cập nhật theo đề. Mặc định chia sẻ phiên bản đã chốt dễ kiểm soát hơn chia sẻ nháp đang sửa.

## 9. Để AI ngày càng hữu ích: nên xây kho gì?

### 9.1. Có nên cho AI viết phân tích không?

**Có.** Giá trị là biến một đề/tài liệu thành dữ liệu có thể tìm lại: cấu trúc, phạm vi, dạng câu, phân bố điểm, cách trình bày, lỗi phát hiện và điều chỉnh của giáo viên. Lần sau AI dùng các bản đã được kiểm tra để đề xuất phù hợp hơn.

Đây là tích lũy dữ liệu và truy xuất ngữ cảnh, **không có nghĩa mô hình tự được huấn luyện lại sau mỗi đề**. Không cần bắt đầu bằng fine-tuning. Chất lượng còn phụ thuộc nguồn, cách chọn dữ liệu cho từng yêu cầu và kiểm chứng đầu ra.

### 9.2. Bốn kho có vai trò riêng

| Kho | Ví dụ | Quyền và mức tin cậy |
|---|---|---|
| Chương trình/quy tắc/mẫu có nguồn | Yêu cầu cần đạt, mẫu của đơn vị, cấu trúc kỳ thi | Phiên bản đã duyệt, có phạm vi và hiệu lực |
| Tài liệu và phân tích tham khảo | Phân tích đề trường, thống kê dạng bài | Có nguồn, chất lượng và giới hạn; không tự biến thành quy định |
| Bộ nhớ cá nhân giáo viên | Thích lời giải ngắn, bố cục riêng, mẫu thường dùng | Riêng tư, xem/sửa/xóa được, không vượt quy tắc bắt buộc |
| Bài học từ chỉnh sửa | AI hiểu sai scope, giáo viên sửa thang điểm hoặc câu chữ | Ghi nguyên nhân và phạm vi; tránh suy từ một sửa đổi thành quy luật toàn quốc |

Không lưu “giáo viên thích mẫu X” dưới nhãn “câu đã kiểm định đúng”. Đây chính là điểm cần sửa ở memory hiện tại.

### 9.3. Một bản phân tích bền vững cần chứa gì?

Tối thiểu: ID nguồn và phiên bản nguồn; môn/lớp/bộ sách nếu xác định được; loại bài; phạm vi; cấu trúc câu và điểm; nhận xét; dẫn chứng theo trang/câu; chỗ chưa chắc; người/mô hình tạo; ngày tạo; trạng thái duyệt; quyền sử dụng và chia sẻ.

Nên lưu **hai dạng**: dữ liệu có cấu trúc để máy truy xuất/kiểm tra, và bản Markdown để con người đọc. Markdown có thể được tạo lại từ dữ liệu, hoặc lưu như một phiên bản biên tập có liên kết. Không chỉ giữ một đoạn tóm tắt thiếu nguồn.

Ví dụ: “Đề này dành 30% điểm cho nội dung X” là mô tả của một đề; “mọi đề cuối kỳ phải dành 30% cho X” là quy tắc rộng hơn và cần nguồn khác. Hệ thống không được tự nâng từ nhận xét thứ nhất thành thứ hai.

### 9.4. AI tìm nguồn và tạo khung chuẩn thế nào?

Luồng đề xuất: tìm nguồn phù hợp → lưu bằng chứng → trích xuất → so sánh với nguồn đang có → tạo bản đề nghị → duyệt theo thẩm quyền/phạm vi → đưa vào kho dùng lại. Nguồn hết hiệu lực hoặc thay đổi phải làm các phân tích phụ thuộc chuyển sang cần xem lại.

AI có thể tự động thực hiện bước thu thập và phân tích trong phạm vi được cấu hình, nhưng không tự chứng nhận chính nó. Các chỉ dẫn bên trong tài liệu được nhập chỉ là dữ liệu, không được điều khiển quyền truy cập, xuất bản hoặc thay đổi quy tắc hệ thống.

Trước khi gọi một mẫu là “đáng tin”, cần xem người ban hành, phạm vi, thời điểm, bằng chứng và kiểm tra chuyên môn. Sự phổ biến chỉ là tín hiệu tham khảo. Cần phân biệt tài liệu chính thức được đăng lại với lời giới thiệu của website; một tên miền giáo dục cũng có thể có lỗi metadata.

### 9.5. Riêng tư và đóng góp chung — đã được bạn chốt

Phân tích từ đề cá nhân mặc định chỉ phục vụ chủ sở hữu/nhóm được cấp quyền. Khi giáo viên chọn góp vào kho chung, hệ thống cho xem bản sẽ chia sẻ, loại thông tin riêng và dữ liệu học sinh không cần thiết, kiểm tra quyền đối với tài liệu, rồi đưa vào quy trình duyệt kho chung.

Đóng góp nên tạo một bản có nguồn gốc rõ; không công khai ngược toàn bộ tài liệu riêng, nhận xét riêng hay chat của giáo viên. Quyền công khai đề và quyền đóng góp phân tích cũng là hai thao tác khác nhau.

Kho dùng cho AI phải lọc theo quyền trước khi truy xuất. Không để nội dung riêng lọt vào gợi ý cho giáo viên khác. Cần xác định cách thu hồi đóng góp và gỡ khỏi tìm kiếm; dữ liệu đã được người khác tải công khai không thể bảo đảm thu hồi mọi bản sao.

### 9.6. Làm sao biết “giỏi hơn” thật?

Đo trên bộ câu/đề có người kiểm tra chuyên môn: đúng đáp án, đúng phạm vi, phương pháp phù hợp lớp, đủ hình/dữ kiện, đúng phân bổ và mức giáo viên phải sửa. So sánh các phiên bản kho/prompt/model trên cùng bộ đánh giá. Tách ví dụ AI được xem khỏi tập nghiệm thu để tránh chỉ đo khả năng nhớ lại.

AI tự phân tích thêm một nghìn đề không tự chứng minh tiến bộ. Cũng không nên gom mọi bản phân tích vào prompt: chọn đúng nguồn liên quan, loại trùng và dữ liệu đã hết giá trị.

## 10. Giữ tài sản tri thức khi đổi DB, đổi AI hoặc đổi người quản trị

### 10.1. Phần nào là tài sản gốc?

Tài liệu nguồn được phép lưu, cây kiến thức/mục lục và ánh xạ, mẫu, câu hỏi/đáp án/hình, phân tích, nhận xét và quyết định duyệt, lịch sử phiên bản, quyền truy cập và nguồn gốc là tài sản cần bảo toàn.

Chỉ mục tìm kiếm và vector embeddings thường có thể tạo lại nếu còn văn bản chuẩn cùng thông tin mô hình tạo chỉ mục. Không nên coi vector là bản sao duy nhất của kiến thức. Chat với nhà cung cấp AI cũng không phải kho lưu chính.

### 10.2. Ba loại xuất dữ liệu khác nhau

| Loại | Mục đích | Nội dung |
|---|---|---|
| Sao lưu vận hành | Khôi phục sau sự cố | DB, tệp đính kèm, cấu hình cần thiết và cơ chế khôi phục dữ liệu mã hóa |
| Gói chuyển hệ thống | Đổi DB/ứng dụng | JSON/JSONL hoặc định dạng mở, tệp gốc, ID và liên kết, phiên bản schema, quyền, provenance, lịch sử cần giữ, checksum |
| Xuất cho giáo viên | Mang tài sản cá nhân đi | Đề/câu/đáp án/mẫu/phân tích thuộc quyền; Word/PDF để sử dụng và dữ liệu mở để nhập lại |

Một bản Word hoặc Markdown không đủ phục hồi liên kết câu–đáp án–ma trận–nguồn–quyền. Một bản dump DB có ích để phục hồi nhưng chưa chắc dễ nhập vào DB loại khác. Vì vậy cần cả phương án sao lưu và định dạng chuyển dữ liệu trung lập.

### 10.3. Không cho admin đọc có làm mất dữ liệu không?

**Không nhất thiết.** Quyền đọc qua giao diện, quyền quản trị sao lưu và quyền giải mã có thể tách nhau. Tài khoản dịch vụ được giới hạn có thể tạo bản sao lưu bảo vệ tốt mà admin thông thường không được xem đề riêng. Nhưng nếu mất cả bản sao lẫn khóa giải mã thì dữ liệu mã hóa có thể không phục hồi được; cần thiết kế quản lý khóa và phục hồi cùng dữ liệu.

Khuyến nghị: chủ sở hữu xuất được dữ liệu của mình; quản trị vận hành có cơ chế sao lưu/khôi phục có ghi nhận; quyền duyệt kho chung chỉ truy cập phần được gửi duyệt. Chưa cần cho admin quyền đọc toàn bộ kho riêng để giải quyết bài toán chuyển DB.

API key không đưa vào gói chia sẻ tri thức. Di chuyển bí mật vận hành là quy trình riêng. Các phiên bản mẫu, file ảnh và lịch sử quyền phải đi cùng gói dữ liệu, tránh “chuyển được bảng nhưng mất tài liệu”.

### 10.4. Bằng chứng chuyển dữ liệu thành công

Không dừng ở nút “Tải backup”. Phải nhập gói vào môi trường trống và mở lại được một đề có câu, đáp án, hình, ma trận, nguồn, lịch sử và đúng quyền. Đối chiếu số lượng, ID, liên kết và checksum; dữ liệu cũ chưa ánh xạ thì giữ nguyên và đánh dấu, không tự bịa trường còn thiếu.

PostgreSQL vẫn là nguồn vận hành chính theo D05. “Không phụ thuộc DB” nghĩa là có mô hình và đường xuất/nhập rõ ràng, không phải bỏ cơ sở dữ liệu hoặc chuyển mọi thứ thành file Markdown.

## 11. Kiến trúc nghiệp vụ nên thống nhất trước khi viết lại từng phần

Luồng đích:

**Nguồn → chương trình/mục lục → phạm vi giáo viên chọn → kế hoạch đề/ma trận mục tiêu → câu hỏi và đáp án → kiểm tra → giáo viên chốt → phiên bản lưu/xuất/chia sẻ/giao bài.**

Phản hồi và sửa đổi có thể tạo phân tích mới, nhưng phải đi qua cơ chế quyền và duyệt trước khi trở thành mẫu dùng chung.

| Khối dữ liệu | Trách nhiệm |
|---|---|
| Nguồn và phiên bản | Ai ban hành, nội dung gốc, thời điểm, phạm vi, quyền sử dụng |
| Chương trình và mục lục | Yêu cầu cần đạt, kiến thức, bài sách, ánh xạ và bằng chứng |
| Phạm vi lựa chọn | Nội dung bao gồm/loại trừ, tiến độ, giới hạn phương pháp |
| Mẫu và kế hoạch đề | Cấu trúc, phân bổ, điểm, điều kiện áp dụng, các thay đổi riêng |
| Câu và phiên bản | Nội dung/đáp án/lời giải/hướng dẫn chấm/hình, trạng thái kiểm định |
| Đề và phiên bản | Tập câu theo thứ tự, cấu hình và ma trận thực tế |
| Chia sẻ/cộng tác | Quyền xem/góp ý/sửa/nhân bản và lịch sử |
| Bài giao/lượt làm | Bản chụp đã giao, thời gian, nhận diện, bài làm và kết quả |
| Phân tích/bộ nhớ | Dữ liệu có bằng chứng, quyền riêng, duyệt và vòng đời |

Đây là mô hình khái niệm, không có nghĩa mỗi dòng phải thành một bảng mới ngay. Cần tận dụng các thực thể hiện có như Question, Exam, Assignment, Attempt và đối chiếu dữ liệu thật trước migration.

Một hợp đồng dữ liệu câu/đề dùng chung phải đứng giữa UI, API, nhập/xuất và DB. Trong quá trình chuyển đổi, bộ chuyển đổi cũ–mới là hợp lý; không duy trì mãi nhiều chuẩn cạnh tranh. Kiểu câu không hỗ trợ phải báo rõ, không bỏ mất khi trộn/xuất.

Ma trận mục tiêu được lập trước; ma trận thực tế được tính lại sau khi có câu. Hai bảng được so sánh, thay vì dựng một bảng đẹp từ đề rồi coi đề đã đúng. Điểm lưu chính xác; chỉ làm tròn ở nơi hiển thị hoặc chốt điểm theo quy tắc tương ứng, không làm tròn mất phần điểm ngay trong dữ liệu gốc.

### Ví dụ xuyên suốt để hình dung sản phẩm

Đây là **tình huống minh họa tự đặt**, không phải mẫu kiểm tra chính thức hoặc nội dung đã được duyệt cho một bộ sách.

Giáo viên muốn một phiếu luyện tập Toán lớp 6 về cộng/trừ phân số, không có bài toán thực tế. Giáo viên chọn kiến thức trực tiếp; nếu chọn qua mục lục sách thì hệ thống ánh xạ về cùng phạm vi, chỉ dùng ánh xạ đã có nguồn.

| Thành phần | Trạng thái minh họa |
|---|---|
| Phạm vi | Cộng/trừ phân số; loại bài toán thực tế; chưa chọn mẫu trường |
| Kế hoạch đề | 4 câu lựa chọn × 0,5 điểm + 2 câu trả lời ngắn × 1 điểm + 2 câu tự luận × 3 điểm = 10 điểm; thời lượng do giáo viên chọn |
| Câu minh họa | Tính 1/2 + 1/3; đáp án 5/6; lời giải giải thích quy đồng phù hợp phạm vi |
| Sửa câu | Giáo viên đổi 1/3 thành 1/4: đáp án cũ được đánh dấu cần kiểm lại; đề xuất mới là 3/4, chờ giáo viên áp dụng |
| Cùng sửa | Đồng nghiệp được mời góp ý lời giải hoặc sửa nếu được cấp quyền; lịch sử giữ cả bản trước và sau |
| Giao bài | Giáo viên chốt phiên bản V2 rồi mở link; học sinh nhận bản V2 và không nhận lời giải trước thời điểm được phép |
| Tích lũy | AI ghi nhận cấu trúc và nhận xét ở kho riêng; không suy “mọi phiếu lớp 6 đều phải có cấu trúc này” |
| Chuyển dữ liệu | Gói xuất giữ câu, đáp án, phiên bản V2, phân tích, nguồn và quyền; có thể nhập lại mà không cần đọc lại lịch sử chat |

Nếu AI sinh câu nằm ngoài phạm vi hoặc thiếu lời giải, hệ thống chỉ rõ câu đó. Không tự mở rộng scope hoặc giả một nguồn để làm cho đề trông hoàn chỉnh. Ví dụ này cho thấy các phần quản lý, AI và cộng tác đều phục vụ cùng một công việc của giáo viên.

## 12. Tổng hợp lỗi cũ và đối chiếu báo cáo mới

### 12.1. Các phát hiện V1 vẫn cần giữ trong hồ sơ chuẩn bị

| Mã | Vấn đề đã quan sát | Ý nghĩa đối với hướng mới |
|---|---|---|
| R01 | Cấu hình môn bỏ qua lớp, một số môn được ánh xạ sang môn khác | Cần tra cứu môn–lớp–mục đích–phiên bản; không dùng fallback sai |
| R02–R03 | Editor lưu local, dashboard dùng server; trạng thái lưu có thể báo thành công sau lỗi | Thống nhất nguồn lưu và trạng thái thật trước cộng tác |
| R04 | Giá trị 0 câu bị thay bằng mặc định bởi toán tử `||` | Tôn trọng lựa chọn số câu bằng 0 |
| R05–R06 | Tỷ lệ/mục tiêu đề chưa kiểm đủ; JSON hợp lệ chưa chứng minh đúng nội dung | Kế hoạch đề và kiểm định nhiều lớp |
| R07 | Kiểm định đúng/sai có đường coi thiếu kết quả là khớp | Chưa kiểm đủ phải báo chưa kiểm đủ |
| R08 | Thiếu kiểm quyền đầy đủ ở các đối tượng được liên kết | Cần quyền theo chủ sở hữu và cộng tác hợp lệ, không chỉ đề cha |
| R09–R10 | Đặc tả chung chung, ma trận hậu kiểm và làm tròn điểm sớm | Yêu cầu cần đạt có nguồn, tính điểm chính xác |
| R11–R12 | Nhập Word có cắt nội dung, mất ngữ cảnh/hình và đường BYOK thiếu user context | Tách đọc nguồn, giải bổ sung, kiểm định; thống nhất AI context |
| R13 | Memory tự gắn nhãn tri thức đã xác minh từ phân tích | Tách sở thích, phân tích và kiến thức được duyệt |
| R14 | Hỗ trợ loại câu khác nhau giữa tạo/trộn/UI | Công bố khả năng theo từng thao tác, không đánh rơi câu |
| R15 | Nhiều đường tính điểm; hàm chấm cũ chưa thấy caller trong `src` | Gom quy tắc tính điểm, không quy lỗi hàm không dùng cho luồng đang chạy |
| R16 | Một số test kiểm tra nông; runner luôn in thông báo 100% | Cần bằng chứng hành vi và kết quả thất bại có ý nghĩa |

Chi tiết code, giới hạn và ca kiểm định nằm trong [mục 5 và 11 của V1](F:/Workspace/Zazz/ExamCraft/docs/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md). Đây là hồ sơ vấn đề, chưa phải danh sách công việc đã được giao làm.

### 12.2. Phát hiện trong báo cáo mới đã đối chiếu trực tiếp

| Vấn đề | Kết luận chính xác hơn | Bằng chứng trong repo |
|---|---|---|
| Dữ liệu server khác dữ liệu editor | Đường mở đề có thao tác trải `it.question` nhưng không chuẩn hóa đầy đủ loại câu và payload. Có nguy cơ mất lựa chọn/sai phân loại khi đi vào UI/xuất/trộn; không gán tỷ lệ “100% mọi đề” khi chưa thử từng đường. | [ExamWorkspace](F:/Workspace/Zazz/ExamCraft/src/components/ExamWorkspace.tsx:130) |
| Lưu nháp học sinh sai hợp đồng | UI gửi POST, API chỉ có PATCH. Body hiện tại đã là `{draft: currentAnswers}`; báo cáo nói `{answers}` là chi tiết cũ. UI không kiểm tra HTTP thành công trước cập nhật giờ đã lưu. | [Trang làm bài](F:/Workspace/Zazz/ExamCraft/src/app/a/[publicId]/page.tsx:198), [API draft](F:/Workspace/Zazz/ExamCraft/src/app/api/public/attempts/[id]/draft/route.ts:5) |
| ShareModal không đồng nhất | Có `IN_CLASS` so với enum `CLASSWORK`; đọc `examIds` không có trong phản hồi import; chế độ nhận diện mặc định dễ lệch lựa chọn không lớp. Đây là lỗi hợp đồng cần tái lập theo trường hợp cụ thể. | [ShareModal](F:/Workspace/Zazz/ExamCraft/src/components/ShareModal.tsx:55), [import legacy](F:/Workspace/Zazz/ExamCraft/src/app/api/migration/import-legacy/route.ts) |
| Sửa câu/OCR/Word không dùng key tài khoản nhất quán | Thiếu user context trên các đường đã đọc. Tuy nhiên tweak có nhánh key truyền trực tiếp, nên “100% không gọi AI thật” là quá rộng. | [Tweak](F:/Workspace/Zazz/ExamCraft/src/app/api/tweak-question/route.ts), [OCR](F:/Workspace/Zazz/ExamCraft/src/app/api/ocr-exam-image/route.ts), [Word](F:/Workspace/Zazz/ExamCraft/src/app/api/parse-docx/route.ts) |
| Chia sẻ công khai trả đáp án | Route đọc exam bằng ID và trả dữ liệu đáp án/lời giải, chưa thấy áp quyền ShareLink. Đây là rủi ro phải xử lý trước phát hành link thật. | [Public share](F:/Workspace/Zazz/ExamCraft/src/app/api/public/share/[id]/route.ts) |
| Submit không thực thi đầy đủ hạn/ẩn điểm | Không thấy chặn deadline/closesAt/status trước chấm; nhánh đã nộp trả score trực tiếp. Cần kiểm chứng HTTP rồi thống nhất chính sách ở server. | [Submit](F:/Workspace/Zazz/ExamCraft/src/app/api/public/attempts/[id]/submit/route.ts) |
| Quyền thao tác lượt làm yếu | Group endpoint trả latestAttempt.id theo studentId; draft/submit không thấy xác thực quyền trên lượt làm. Biết ID có thể trở thành khả năng ghi bài, cần token/phiên được ràng buộc phù hợp. | [Public group](F:/Workspace/Zazz/ExamCraft/src/app/api/public/groups/[groupCode]/route.ts), draft/submit nêu trên |
| Tạo lượt sau khi hết giờ | Đếm lượt đã nộp để tính attemptNo có thể trùng lượt hết hạn còn IN_PROGRESS và vi phạm unique. Không gọi là “vĩnh viễn” vì còn phụ thuộc trạng thái và cách xử lý. | [Start](F:/Workspace/Zazz/ExamCraft/src/app/api/public/assignments/[publicId]/start/route.ts:90) |
| Start và GET kiểm tra khác nhau | Start đã đọc chưa kiểm opensAt như GET; chưa thấy kiểm PIN, identityMode hoặc tư cách studentId thuộc nhóm ngay tại đường bắt đầu. Báo cáo nói “API start đã yêu cầu PIN” không khớp code hiện tại. | [Start](F:/Workspace/Zazz/ExamCraft/src/app/api/public/assignments/[publicId]/start/route.ts), [GET bài giao](F:/Workspace/Zazz/ExamCraft/src/app/api/public/assignments/[publicId]/route.ts) |
| Chấm thiếu đáp án/tự luận | So sánh đáp án rỗng có nguy cơ nhận bài bỏ trống là đúng; tự luận cần trạng thái chờ chấm. Không gom mọi phân số/biểu thức thành một quy tắc chuỗi duy nhất. | [Submit](F:/Workspace/Zazz/ExamCraft/src/app/api/public/attempts/[id]/submit/route.ts) |
| UI sinh đề chưa mở tự luận | GenerateModal gửi `numEssay: 0`; muốn soạn đầy đủ phải xét cả giao diện và toàn bộ luồng. | [GenerateModal](F:/Workspace/Zazz/ExamCraft/src/components/GenerateModal.tsx:71) |

Các phát hiện quyền ở đây là phân tích tĩnh, chưa phải báo cáo đã khai thác thực tế. Chúng vẫn đủ quan trọng để đặt điều kiện sửa trước khi dùng với dữ liệu và bài kiểm tra thật.

### 12.3. Những nhận định cần sửa hoặc để chờ xác minh

| Nhận định cũ | Cách tiếp nhận |
|---|---|
| “Tất cả admin AI vô tác dụng” | Quá rộng: API admin vẫn đọc AiUsageLog. Phần quản lý bể key cũ và phần thống kê cần đánh giá riêng. |
| “Attempt.student thiếu Cascade” | Không đúng với schema hiện tại: quan hệ này đã có Cascade. Không thêm Cascade hàng loạt; có thể xóa cả lịch sử bài làm cần giữ. |
| “Cấu hình GDKT&PL có 6 câu trả lời ngắn theo mẫu tốt nghiệp” | Không khớp bảng QĐ 764 đã đối chiếu; không lấy JSON hiện tại làm nguồn xác nhận chính JSON đó. |
| “Hàm auto-grader cũ đang làm sai điểm luồng nộp server” | Chưa thấy caller của hàm cũ trong src; submit là đường khác. Vẫn cần dọn trách nhiệm chấm điểm nhưng phải xác định đường đang dùng. |
| “Mọi trang đều không cuộn, UI crash đúng số lượng nêu” | Có căn cứ cần kiểm tra từ CSS/global và mapping, nhưng chưa chạy lại trình duyệt/viewport để chứng nhận phạm vi và mức độ. |
| Các nút trùng modal, lọc môn, restore, kết quả rỗng, figure, link cũ | Giữ làm nhóm tình huống cần tái lập; không bỏ qua, cũng không coi log mô tả là video/bằng chứng mới. |
| Các bảng/cột “mồ côi” | Đọc toàn bộ nơi dùng, dữ liệu và nhu cầu trước xóa. Passage và mẫu có thể cần cho hướng đích, dù đường hiện tại chưa nối đủ. |
| Lint 275, test 48/48 và sprint/mutation | Chưa tái chạy trong lượt này. Phải gắn phiên bản môi trường/cây code khi sử dụng làm baseline sau này. |

### 12.4. Những đề xuất của báo cáo khác không nên áp nguyên xi

- Không tự chọn bể key trường/hybrid: giữ BYOK hiện tại làm hướng mặc định; bể chung là quyết định chi phí và quản trị riêng, chưa được bạn yêu cầu.
- Không sửa autosave bằng cách chấp nhận vô thời hạn mọi method/body. Chọn hợp đồng chuẩn; chỉ thêm tương thích có giới hạn khi có client cũ thật cần hỗ trợ.
- Không tự chọn 60 giây dung sai nộp bài vì một báo cáo đề xuất. Draft hiện có 15 giây; cần một chính sách nhất quán theo loại bài và xử lý mạng chậm.
- Không lấy theo dõi chuyển tab làm kết luận gian lận. Đây không phải phần cốt lõi hiện tại và có thể báo nhầm trong sử dụng hợp lệ.
- Không tự xóa các route hoặc bảng cũ mà chưa có đường chuyển dữ liệu/link. Xóa nhanh có thể mất đề local hoặc phá link đang được dùng.
- Không biến dự án thành cổng học sinh do một báo cáo gọi đó là tính năng thiếu. Yêu cầu hiện tại đã xác định rõ giáo viên chủ động mở link.

## 13. Những ưu tiên chuẩn bị hợp lý — chưa phân công triển khai

Có hai trục cần đi cùng nhau: **khôi phục tính đúng của ứng dụng hiện có** và **xác lập dữ liệu giáo dục cho sản phẩm đích**. Chỉ sửa nút/UI sẽ giữ nguyên vấn đề nguồn và phạm vi; chỉ xây kho chương trình trong khi lưu/giao bài đang sai cũng không giúp giáo viên sử dụng được.

| Trọng tâm | Kết quả cần hiểu rõ trước khi lập kế hoạch |
|---|---|
| Nội dung và nguồn | Mẫu minh họa có nguồn, từ điển chương trình/mục lục, phạm vi và phiên bản áp dụng |
| Tính nhất quán | Một cấu trúc câu/đáp án/đề, chuyển dữ liệu cũ không mất hình/điểm/nguồn |
| Lưu và phiên bản | Nguồn server, nháp cục bộ, phục hồi, bản chốt và snapshot bài giao |
| Quyền và link | Xem/góp ý/sửa/nhân bản/làm bài; private chung với cộng tác được kiểm soát |
| Chất lượng AI | Bộ đánh giá, nguồn chuẩn, phân tích có thể kiểm tra và quyền dùng lại |
| Dữ liệu bền vững | Gói xuất/nhập và khả năng khôi phục thực tế |

Các lỗi làm mất dữ liệu, lộ đáp án, ghi nhầm bài người khác hoặc sai điểm là điều kiện phải xử lý trước khi phát hành rộng. Đây là đánh giá mức ảnh hưởng, chưa phải cho phép sửa ngay trong lượt báo cáo.

Không đưa ước lượng ngày chắc chắn hay lời hứa “sẵn sàng 100%”. Chi phí lớn ở đây là chuẩn hóa và kiểm chứng nguồn Toán 1–12, hợp nhất dữ liệu cũ và cộng tác đồng thời, chứ không chỉ số trang giao diện.

## 14. Bảng quyết định sau phản hồi của bạn

| Mã | Quyết định hiện tại | Trạng thái |
|---|---|---|
| D01 | Giữ và cải tiến dự án, viết mới phần lõi còn thiếu | Bạn đã đồng ý |
| D02 | Chốt khung dữ liệu dễ đọc và ví dụ trước schema/triển khai | Bạn đã đồng ý; báo cáo này chuẩn bị cho bước đó |
| D03 | Ưu tiên Toán đầy đủ lớp 1–12; chương trình chung trước, ba bộ sách theo gói | Bạn đã chốt lại |
| D04 | Giữ nhiều môn, công bố mức hỗ trợ/kiểm chứng theo gói | Bạn đã đồng ý |
| D05 | PostgreSQL là nguồn chính; local phục vụ nháp/cache và nhập dữ liệu cũ | Bạn đã đồng ý |
| D06 | AI đề xuất/trích xuất/sinh; không tự phê duyệt tính chính thức | Bạn đã đồng ý |
| D07 | Thiếu mẫu vẫn cho tùy chỉnh có nhãn rõ | Bạn đã đồng ý |
| D08 | Giữ tính năng AI cá nhân, ưu tiên nền tảng soạn/lưu/xuất; thiết kế kho phân tích trong kiến trúc | Đồng ý nguyên tắc cũ, bổ sung theo ý 6 và 8; chưa hiểu thành triển khai toàn bộ ngay |
| D09 | Có người duyệt chuyên môn phù hợp | Đồng ý nguyên tắc; chưa xác định người/nhóm và phạm vi lớp |
| D10 | Giáo viên là người dùng chính; học sinh làm bài qua link giáo viên mở | Bạn đã làm rõ |
| D11 | Kho riêng mặc định; giáo viên chủ động góp phân tích vào kho chung | Bạn đã chọn |
| D12 | Cá nhân + chia sẻ + cùng sửa + lịch sử cùng tồn tại | Bạn đã chọn; đề xuất quyền chi tiết tại mục 8 |
| D13 | Đề/đáp án/xem song song cùng dữ liệu | Đề xuất cụ thể hóa ý bạn, cần chốt giao diện |
| D14 | Tự lưu nháp + lưu phiên bản; lưu ngân hàng là thao tác riêng | Khuyến nghị UX, chưa xem là quyết định đã duyệt |
| D15 | Xuất/nhập tri thức mở, sao lưu tách quyền admin đọc nội dung | Khuyến nghị để đáp ứng yêu cầu không mất dữ liệu |

## 15. Những điểm còn cần trao đổi trước kế hoạch thực hiện

Không cần bạn học hết quy định giáo dục hoặc tự xây toàn bộ ma trận. Các vấn đề dưới đây nên được giải thích bằng mẫu cụ thể ở bước chốt tiếp theo:

1. **Quyền cộng tác:** mặc định công khai chỉ xem, muốn sửa phải được cấp quyền như mục 8 có phù hợp ý bạn không? Tôi khuyên giữ mặc định này, vẫn hỗ trợ link cùng sửa chủ động.
2. **Lưu và phiên bản:** có đồng ý tự lưu nháp, lưu phiên bản toàn đề và lưu câu vào ngân hàng là ba khái niệm riêng? Đây là đề xuất để thao tác ít nhưng không mất kiểm soát.
3. **Loại bài dùng minh họa:** nên có ít nhất ví dụ luyện tập/tùy chỉnh và ví dụ định kỳ theo mẫu trường, để tránh lõi bị thiết kế chỉ cho tốt nghiệp. Chọn ví dụ không thu hẹp mục tiêu Toán 1–12.
4. **Duyệt chuyên môn:** chưa có giáo viên/nhóm cụ thể cho các cấp. Có thể bắt đầu bằng khung và nguồn, nhưng chưa gắn nhãn đã kiểm chứng chuyên môn cho toàn bộ lớp.
5. **Tài liệu chuẩn địa phương/trường:** khi có đơn vị dùng thử, lấy mẫu thật của họ để xác nhận cấu hình. Chưa có đơn vị thì giữ gói tham khảo có nguồn, không tự đặt một trường/tỉnh mặc định.

Sau khi bạn chốt nội dung báo cáo, bước tiếp theo mới là chuẩn hóa các quyết định thành đặc tả ngắn, ví dụ xuyên suốt và kế hoạch/checklist thực hiện. Mục tiêu của bước hiện tại là có cùng cách hiểu trước khi sửa, không tạo thêm hàng loạt tài liệu quản trị khó dùng.

## 16. Phạm vi thay đổi của lượt này

Chỉ tạo bản báo cáo V2 này; V1 và tài liệu bạn gửi được giữ lại để đối chiếu. Không chỉnh ứng dụng, schema, DB, API key hoặc dữ liệu người dùng; không chạy theo chỉ dẫn sửa/xóa trong báo cáo AI đính kèm. Các chức năng, cấu trúc dữ liệu và quy trình mô tả ở trên là định hướng đề xuất, không phải chức năng đã được triển khai.
