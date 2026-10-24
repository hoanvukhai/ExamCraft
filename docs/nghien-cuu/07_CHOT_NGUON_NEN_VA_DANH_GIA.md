# Chốt nguồn nền và đánh giá tài liệu ExamCraft

Mốc kiểm tra: **22/10/2026**. Đây là kết luận nghiên cứu để chuẩn bị triển khai, chưa phải duyệt chuyên môn hay chứng nhận tuân thủ. Không sửa ứng dụng trong đợt này. Báo cáo này nối tiếp báo cáo04; không xóa lịch sử bàn giao.

## 1. Kết quả và giới hạn

Đã chốt cấu trúc nguồn nền: chương trình chung và sửa đổi → quy định đánh giá theo cấp → danh mục sách theo năm → học liệu theo cuốn → mẫu đánh giá theo môn/lớp/địa phương. Không dùng một bộ đề THPT hoặc một bảng ba/bốn mức làm chuẩn toàn hệ thống.

- Lưu **5 PDF** văn bản công khai, kèm URL, ngày tải, dung lượng và SHA-256 tại [manifest](goi/NC-NEN-2026-10-22/nguon/manifest.json). Có bản gốc trên cổng Chính phủ và bản sao trên cơ sở giáo dục; không gọi mọi bản lưu là nơi ban hành.
- Duyệt 26 trang danh mục NXB, thu 309 lượt liên kết, khử lặp còn **302 trang sách**; đã mở từng trang chi tiết. Ghi **1.876 URL học liệu khác nhau** sau bổ sung các liên kết SharePoint hiển thị. Đây là URL được dẫn từ trang sách, không phải 1.876 tệp đã tải/đọc/duyệt. Các đích liên kết chưa được kiểm lần lượt.
- Lập **161 ô lớp–môn/hoạt động cơ sở** cho lớp1–12, có liên kết trang sách và số học liệu quan sát được. Nhánh chuyên đề, ngoại ngữ, tiếng dân tộc và địa phương phải kiểm thêm theo phạm vi; 161 không phải tổng mọi tổ hợp chương trình.
- Có nguồn mới về Raglai; phải mở rộng hồ sơ tiếng dân tộc cũ. Có cập nhật đánh giá mới ban hành nhưng chưa hiệu lực tại ngày nghiên cứu.
- **Chưa đủ** mục lục đã đối chiếu và bộ đề–đáp án–rubric đã duyệt cho tất cả ô. Chưa có giáo viên nghiệm thu. Kết quả đủ để quyết định kiến trúc và thứ tự làm local; chưa đủ phát hành kho “chuẩn đầy đủ mọi môn”.

Tra cứu: [từng sách và học liệu](goi/NC-NEN-2026-10-22/SACH_VA_HOC_LIEU.md), [bảng từng lớp/môn](goi/NC-NEN-2026-10-22/MA_TRAN_LOP_MON.md), [dữ liệu tra cứu](goi/NC-NEN-2026-10-22/sach-va-hoc-lieu.json).

## 2. Nguồn nền được chọn và phạm vi chốt

| Nhóm | Nguồn nền | Quyết định sử dụng | Phần chưa được suy ra |
|---|---|---|---|
| Chương trình | TT32/2018 và phụ lục môn; TT20/2021, TT13/2022, TT17/2025 | Xác định yêu cầu cần đạt trước, ánh xạ sách sau; quản lý chuỗi sửa đổi | Chưa đọc lại từng dòng yêu cầu cần đạt của toàn bộ phụ lục |
| Tiểu học | TT27/2020, QĐ2904/2022; bổ sung TT89/2026 từ ngày hiệu lực | Khung riêng tiểu học, không áp mẫu THPT | Không dùng nhãn mức học lực thay mức nhận thức câu hỏi |
| THCS/THPT | TT22/2021; TT89/2026 từ ngày hiệu lực | Phân biệt nhận xét và điểm; bài viết/thực hành/dự án | Không biến mọi môn thành bài trắc nghiệm chấm số |
| Ma trận/đặc tả | CV7991/2024, kèm hướng dẫn áp dụng tại nơi tổ chức | Mẫu tham khảo có phạm vi; cấu hình hóa | Không áp tỷ lệ/dạng câu của phụ lục cho mọi lớp/môn |
| Sách 2026–27 | QĐ3588/2025 + QĐ185/2026 + thông báo NXB và từng ấn bản | Mặc định theo năm/danh mục đã kiểm; giữ tham chiếu sách cũ | Danh mục phê duyệt không đồng nghĩa đã có đủ nội dung sách hoặc quyền phân phối |
| Ngoại ngữ, tiếng dân tộc | Các hồ sơ TK0017,0028–0048; thêm TT14/2026 Raglai | Có vai trò NN1/NN2, cấp/trình độ, nhánh thí điểm | Không gán số quyển ngoại ngữ2 thành lớp; không dừng ở tám tiếng dân tộc |
| GDĐP | Hướng dẫn chung + quyết định/tài liệu của địa phương đúng năm | Quản lý theo địa bàn và mốc địa giới | Một tỉnh hoặc một quyết định không đại diện cả nước |
| HSG/tuyển sinh/tốt nghiệp/khảo sát | Quy chế và bộ đề của đúng kỳ thi/đơn vị | Nhánh mẫu riêng, không dùng làm mặc định bài học | Đề HSG không mặc nhiên nằm trong khung thời lượng/độ khó định kỳ |

“Chốt” ở đây là chọn các nguồn và nguyên tắc làm căn cứ thiết kế. Gói nội dung cụ thể chỉ chuyển thành được duyệt khi có đủ phiên bản, bằng chứng và người duyệt; không đóng băng pháp lý vĩnh viễn tại ngày này.

### Chương trình: những điều đã kiểm thêm

[TT20/2021, Công báo](https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2021/7/34076/36399-1-2021697-69820-2021-tt-bgddt.pdf) ban hành01/07/2021, hiệu lực16/08/2021, bổ sung chuyển tiếp môn Tin học THCS vào Điều3 TT32. Không phải thay toàn bộ chương trình môn học.

[TT13/2022, bản lưu đã tải](goi/NC-NEN-2026-10-22/nguon/TT13-2022.pdf), trang1–2: Lịch sử thuộc phần bắt buộc THPT; các môn lựa chọn và chuyên đề cần được biểu diễn riêng. Việc liệt kê đầy đủ môn trong sản phẩm không có nghĩa mỗi học sinh học mọi môn lựa chọn.

[Thông tin chính thức về TT17/2025](https://xaydungchinhsach.chinhphu.vn/thong-tu-so-17-2025-tt-bgddt-sua-doi-bo-sung-mot-so-noi-dung-trong-chuong-trinh-giao-duc-pho-thong-119250916145653739.htm) xác định năm nhóm phụ lục chỉnh sửa, liên quan LSĐL tiểu học/THCS, Lịch sử10, Địa lí và GDCD. Cần đối chiếu từng yêu cầu/bản đồ/số liệu trước khi nhập gói; chưa xem việc đọc bài thông tin là đã đối chiếu đầy đủ phụ lục. Hồ sơ CSDL trả403 trong lượt mở lại.

[Dự thảo sửa chương trình tháng8/2026](https://xaydungchinhsach.chinhphu.vn/toan-van-du-thao-thong-tu-sua-doi-bo-sung-mot-so-noi-dung-trong-chuong-trinh-giao-duc-pho-thong-119260820174117596.htm) được giữ ở trạng thái **dự thảo**. Lượt tìm chưa xác minh được văn bản ban hành thay thế dự thảo này; không suy từ đó rằng chắc chắn chưa ban hành. Trước đóng gói tiếng Anh1–2 hoặc phát hành, kiểm lại văn bản ký và ngày áp dụng.

### Đánh giá: cập nhật cần đặc biệt lưu ý

[TT22/2021 trên Công báo](https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2021/7/36881/40026-1-2021725-72622-2021-tt-bgddt.pdf), Điều5–7, phân biệt môn đánh giá nhận xét và môn có điểm; định kỳ có thể dùng bài kiểm tra, thực hành hoặc dự án. Vì vậy hệ thống phải hỗ trợ tiêu chí/nhận xét và bài không có đáp án duy nhất. Không dùng thời gian15/60 phút để tự suy phạm vi kiến thức.

[CV7991, bản sao ba trang đã đọc](https://cdn.thuvienphapluat.vn/uploads/tintuc/2024/12/19/20241210-Cong-van-7991-huong-dan-KTDGDK.pdf) hướng dẫn phần xây dựng ma trận/đặc tả/đề/chấm cho THPT và phụ lục tham khảo. Có ba cột Biết–Hiểu–Vận dụng; điều đó không thiết lập một enum bắt buộc cho mọi cấp và loại bài. Khung mức và độ khó phải tách riêng.

[QĐ2904/2022](goi/NC-NEN-2026-10-22/nguon/QD2904-2022.pdf), đã đọc2trang, đính chính biểu mẫu TT27 đối với phần Tin học và Công nghệ. Nên quản lý quan hệ môn tích hợp–thành phần; không dựa tên cột OCR để tạo môn mới tùy tiện.

**TT89/2026 ban hành16/10/2026, có hiệu lực01/12/2026**: đã đọc10trang bản scan, Điều24 trang9 ghi mốc hiệu lực. Tại22/10 không áp ngay như quy định đang hiệu lực, kể cả khi trang đăng gắn nhãn “còn hiệu lực”. [Bản lưu và bằng chứng](goi/NC-NEN-2026-10-22/nguon/TT89-2026.pdf).

Các tác động thiết kế từ TT89: điều chỉnh tiếp cận cho học sinh khuyết tật; điều kiện kiểm tra trên máy tính và phương án sự cố; đề chung một số môn do Sở lựa chọn ở các lớp cuối cấp; hồ sơ điện tử. Không tự mở rộng ExamCraft thành hệ thống học bạ. Link giao bài cũng không tự đáp ứng mọi điều kiện tổ chức kiểm tra chính thức. Cần lịch hiệu lực, phạm vi áp dụng và phiên bản mẫu; đề đã giao giữ snapshot.

### Sách và các phiên bản

[QĐ3588](goi/NC-NEN-2026-10-22/nguon/QD3588-2025.pdf) ghi130 mục SGK, dùng từ2026–27; văn bản ghi ngày26/12/2025 và hiệu lực01/01/2026. Cách đếm mục trong phụ lục có thể gộp tập1/tập2, không lấy130 làm số tệp. [QĐ185](goi/NC-NEN-2026-10-22/nguon/QD185-2026.pdf) đã xem đủ7trang: ngày đúng **29/01/2026**, bổ sung99 mục, có tám tiếng dân tộc lớp1–5, ngoại ngữ theo lớp và NN2 theo quyển. Sửa việc ngày09/01 xuất hiện ở đầu mối cũ; giữ dấu vết đính chính.

[NXB thông báo sử dụng sách2026–27](https://nxbgd.vn/bai-viet/nha-xuat-ban-giao-duc-viet-nam-thong-bao-ve-viec-su-dung-sach-giao-khoa-nam-hoc-2026-2027) nêu11 đầu sách chỉnh sửa: LSĐL4–9; Lịch sử10 và chuyên đề10; GDKTPL10; Địa lí12 và chuyên đề12. Các sách cũ khác trong phạm vi thông báo có thể tiếp tục sử dụng. Không đánh đồng “có cập nhật” với “mọi sách cũ vô hiệu”.

302 trang NXB gồm nhiều tập/nhánh/chuyên đề/ngôn ngữ. Không cộng130+99+302 thành số sách độc lập. Chưa có bảng đối chiếu một–một toàn bộ302trang với hai quyết định. Một trang có SGV/SBT chưa chứng minh toàn văn hoặc ấn bản đúng; nhãn “bài mẫu” phải giữ nguyên.

## 3. Đánh giá từng nhóm tài liệu

| Nhóm | Chất lượng bằng chứng hiện có | Được dùng ngay cho nghiên cứu | Việc cần thêm trước phát hành nội dung |
|---|---|---|---|
| Chương trình, yêu cầu cần đạt | Có hệ nguồn theo môn và chuỗi sửa đổi; mức đọc không đồng đều | Xác định cấu trúc gói, quan hệ kiến thức và phạm vi | Đọc từng phụ lục, trích yêu cầu có trang/ID, đối chiếu sửa đổi |
| Quy định đánh giá | Có bản trực tiếp/Công báo và scan cập nhật; phạm vi đã phân biệt | Quyết định điểm/nhận xét/rubric, phiên bản và ngày hiệu lực | Người am hiểu kiểm hồ sơ áp dụng thực tế, không để AI tự chứng nhận |
| SGK/SGV/bài tập/tập huấn | NXB chính thức;302 trang chi tiết; học liệu con chưa kiểm đầy đủ | Tạo danh mục theo cuốn, giao việc lấy mục lục và cập nhật | Đọc đích, xác minh ấn bản; kiểm quyền sao chép/AI/kinh doanh |
| Cánh Diều/Chân trời sáng tạo/ấn bản cũ | Có cổng và nguồn kế thừa; chưa đạt mức thu chi tiết như đợt NXB hiện hành | Giữ gói tham chiếu và đề của người dùng theo ấn bản gốc | Thu mục lục, SGV, bài tập từng gói; không gọi ba bộ đã đủ ngang nhau |
| Đề trường/Sở | Có trang đề cụ thể; nhiều tệp Word hoặc link bị đổi | Mẫu cấu trúc có địa bàn/năm và độ tin cậy giới hạn | Đọc file, nối đề–đáp án–ma trận, kiểm điểm và lỗi, thêm nguồn ngoài một tỉnh |
| Tốt nghiệp/HSG/tuyển sinh | Có nguồn Cục QLCL và quy chế; nguồn cũ có cả bản bên thứ ba | Tách kỳ thi, mục tiêu và chính sách chấm | Đủ ngữ liệu/âm thanh/đáp án, xác minh kỳ thi và văn bản sửa đổi |
| Nghệ thuật/GDTC/trải nghiệm/thực hành | Có SGV/tập huấn qua NXB, tìm được ứng viên đề Âm nhạc6–9 | Bắt buộc hỗ trợ sản phẩm, thao tác và rubric | Bộ rubric thật theo từng lớp; không lấy câu lý thuyết thay biểu diễn/thực hành |
| Ngoại ngữ | Có chương trình NN1/NN2, sách nhiều ngôn ngữ | Phân biệt vai trò, kỹ năng và trình độ | Kiểm nghe/audio/transcript/nói; quyền âm thanh; không chỉ đề đọc–viết |
| Tiếng dân tộc | Tám chương trình cũ + Raglai mới; QĐ185 có tên sách cụ thể | Không đóng cứng tám tiếng; lưu chữ viết/trình độ | Người biết ngôn ngữ duyệt chữ/âm/ngữ liệu và ánh xạ trình độ |
| GDĐP | Hướng dẫn chung và một số đầu mối địa phương | Mô hình gói địa bàn/năm; tiểu học tích hợp | Tài liệu đúng địa giới hiện hành, ba cấp; không báo đủ toàn quốc |
| Khảo sát tự do | Khái niệm sản phẩm rõ, chưa có bộ mẫu nghiệm thu thực tế | Thiết kế không điểm/không đáp án và bảo mật phản hồi | Mẫu tự soạn có nhãn minh họa; thử cách hiểu với giáo viên |
| Nguồn quốc tế/PISA/SEA-PLM | Nguồn tham khảo trong SRC; không là chương trình Việt Nam | Học cách gắn ngữ liệu, năng lực, câu và tiêu chí | Giữ điều kiện sử dụng, ngôn ngữ và phạm vi; không thay chuẩn Việt Nam |
| Kết quả do AI khác tổng hợp | Đã giữ bản gốc và mã nguồn kế thừa | Chỉ dẫn tìm kiếm và giả thuyết cần kiểm | Mỗi kết luận quay về nguồn; lời “đã mở/đã chuẩn” không đủ |

Đánh giá quyền sử dụng: truy cập công khai không tự cấp quyền đưa sách vào sản phẩm thương mại hay kho AI chung. [Cổng NXB](https://taphuan.nxbgd.vn/) có thông báo miễn phí cho giảng dạy/học tập, không dùng kinh doanh. Kế hoạch hiện tại chỉ lưu metadata/đường dẫn, tự tạo mẫu minh họa và xin quyền phù hợp nếu cần phân phối nội dung. Không tải vòng qua hạn chế hay đưa sách vào bộ huấn luyện.

## 4. Đầu mối đề được bổ sung trong lượt này

| Nguồn | Đã xác minh tới đâu | Hạn chế và bước xử lý |
|---|---|---|
| [Toán1 cuối HKI2025–26, TH Nguyễn Văn Trỗi](https://thnguyenvantroi.haiphong.edu.vn/giao-an-de-kiem-tra/de-kiem-tra-cuoi-hoc-ki-1-mon-toan-lop-1-nam-hoc-2025-2026/ct/17225/564402) | Trang trường có liên kết tệp .doc | Chưa đọc tệp; chưa xác nhận đủ đáp án/thang điểm |
| [Tiếng Việt2 cuối kỳ2, TH Vĩnh Phong–Tiền Phong](https://thvinhphong-tienphong.haiphong.edu.vn/khoi-2/de-kiem-tra-tieng-viet-cuoi-ki-2-lop-2/ctmb/23719/331023) | Trang và nhãn tệp .docx; ngày đăng22/02/2025 | Ngày đăng không tự là năm học của đề; đích tải lỗi qua công cụ |
| [Công nghệ8 giữa HKI, TH–THCS Lê Khắc Cẩn](https://th-thcslekhaccan.haiphong.edu.vn/thu-vien-de-kiem-tra/kiem-tra-giua-ki-1-mo-cong-nghe-8/ctmb/9160/522449) | Trang có tệp tên25–26 | Chưa đọc tệp; có đầu mối liên quan KHTN8/9, chưa coi là bộ đã thu |
| [Ngữ văn11 cuối HKII2025–26, THPT Thanh MiệnII](https://thptthanhmienii.haiphong.edu.vn/van-the-mi/de-dap-an-kiem-tra-cuoi-ki-2-mon-ngu-van-lop-11-2025-2026/vbct/42494/663657) | Trang ghi đề+đáp án, tệp Word và đầu mối ma trận | Phải kiểm đáp án mở và thang điểm trong file; chưa chấm/duyệt |
| [Đề Âm nhạc6–9 cuối HKI2024–25](https://thcslythuongkiet.edu.vn/files/CUOI%20HKI/%C4%90%E1%BB%81%20ki%E1%BB%83m%20tra%20cu%E1%BB%91i%20k%E1%BB%B3%20I%20NH%E1%BA%A0C_%206%2C7%2C8%2C9%20%2824-25%29.pdf) | Tìm được PDF trên tên miền trường; đoạn tìm kiếm có nội dung biểu diễn | Mở lại lỗi; chưa đánh dấu đã đọc bộ đề |
| [Kho đề THCS Thống Kênh](https://thcsthongkenh.haiphong.edu.vn/de-kiem-tra/c/39468) | Kết quả web lưu danh mục KHTN/KHXH | Trình duyệt trực tiếp báo tên miền chưa đăng ký; nguồn bất ổn, không coi đang tải được |

Nguồn trường tập trung ở Hải Phòng do tìm được kho công khai; đây là **thiên lệch mẫu**, không phải đại diện cả nước. Chưa đủ gói đề cho từng lớp3–7,9,10,12 và mọi môn ở các lớp còn lại. Nguồn quốc gia/HSG đã có trong sổ cũ vẫn giữ, không cấp lại mã cho cùng tài liệu.

## 5. Raglai và nguồn thi cần mở rộng

[Công báo179 ngày03/04/2026](https://congbao.cdnchinhphu.vn/180507251028987904/2026/4/2/cong-bao-so-179-ngay-03-04-47095_1775113721_signed.pdf) chứa TT14/2026, ban hành18/03, hiệu lực03/05/2026, chương trình Tiếng Raglai cấp tiểu học. Đã đọc phần nhận diện và mụcVIII về đánh giá, trang32–33 bản Công báo; chưa đối chiếu toàn bộ chương trình. Sổ cũ thiếu tiếng này. Không lấy một PDF Công báo147trang làm147 tài liệu giáo dục.

[VBHN02/2026 về thi tốt nghiệp](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/02-vbhn-bgddt.pdf) là đầu mối cập nhật quy chế với TT13/2026; cần đọc phần cấu trúc/chấm thi liên quan khi xây gói thi thử. Không đưa toàn bộ nghiệp vụ tổ chức kỳ thi quốc gia vào ExamCraft.

## 6. Thử mô hình bằng các tình huống đối trọng

Đây là kiểm tra thiết kế trên giấy, chưa chạy phần mềm và chưa duyệt chuyên môn.

| Tình huống | Mô hình cần biểu diễn | Sai lầm phải tránh |
|---|---|---|
| Toán2: hình ảnh + lời giải ngắn | Câu/ảnh/đáp án có version, phần nhận xét | Dùng cấu trúc thi tốt nghiệp mặc định |
| Toán6: một kỹ năng nằm ở nhiều bài sách | Yêu cầu cần đạt nhiều–nhiều mục lục | Xem số bài là ID kiến thức |
| Toán12: nhóm đúng/sai, mã đề | ID ý con ổn định, chính sách điểm theo mẫu | Xáo câu rồi nối đáp án bằng số thứ tự |
| Văn11: cùng văn bản, nhiều hướng trả lời | Passage dùng chung, rubric + đáp án mở | Chỉ so khớp chuỗi hoặc cho AI chốt điểm cuối |
| Ngoại ngữ: nghe và nói | Audio/transcript/timing/tiêu chí chấm | Đọc được chữ là coi đã hỗ trợ nghe |
| KHTN: thí nghiệm/dự án | Nhiệm vụ, minh chứng, tiêu chí và chấm tay | Ép tất cả thành trắc nghiệm |
| Âm nhạc/Mĩ thuật/GDTC | Biểu diễn/sản phẩm/quan sát, nhận xét | Bắt tổng10 điểm hoặc đáp án A/B/C/D |
| GDĐP và LSĐL thay bản đồ | Địa bàn, năm, source-version, cảnh báo phụ thuộc | Sửa đề đã giao khi cập nhật nguồn |
| Nhật NN1/NN2; Raglai | Vai trò/trình độ/chương trình riêng | Cùng tên ngôn ngữ thì gộp cùng gói |
| Khảo sát ý kiến | Không đáp án, có thể không điểm, quyền xem phản hồi | Tự sinh đáp án “đúng” hoặc xếp hạng người trả lời |

Kết quả: mô hình khái niệm06 đáp ứng được nếu bổ sung trạng thái hiệu lực theo thời gian, phạm vi quyền dùng, nhánh sách và hồ sơ học liệu. Chưa cần viết lại toàn ứng dụng hoặc chọn công nghệ đồng bộ trước thử nghiệm có kiểm soát.

## 7. Điều kiện chuyển sang triển khai

**Đủ để lập kế hoạch và xin xác nhận bắt đầu local:** phạm vi sản phẩm, nguyên tắc nguồn, dữ liệu, quyền và thứ tự sửa đã rõ. **Chưa đủ phát hành kho nội dung toàn môn:** mục lục chi tiết, mẫu đánh giá, quyền sử dụng và chuyên môn còn thiếu.

Việc tìm bù tiếp tục theo161ô và các nhánh phụ, ưu tiên ô không có đầu sách, thiếu SGV/tập huấn, thiếu mẫu đối trọng và thay đổi chương trình. Mỗi gói phải ghi nguồn, phần đã đọc, phần còn thiếu, người duyệt; không lấy số lượng liên kết làm tỷ lệ hoàn thành.

Bước kế tiếp trước code được cụ thể hóa tại [08 — Hồ sơ sẵn sàng triển khai](../ke-hoach-2026-10-21/08_HO_SO_TRUOC_KHI_CODE.md). Chủ dự án xác nhận bắt đầu kỹ thuật; không cần tự đi tổng hợp lại tài liệu đã có.
