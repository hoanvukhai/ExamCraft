# ExamCraft — Tổng kết dự án và phạm vi làm việc

**Bổ sung mới nhất22/10/2026:** phương án và điểm xác nhận code tại [hồ sơ08](08_HO_SO_TRUOC_KHI_CODE.md); nguồn/giới hạn tại [nghiên cứu07](../nghien-cuu/07_CHOT_NGUON_NEN_VA_DANH_GIA.md). Giữ30yêu cầu và14quyết định dưới đây. Bổ sung: ngày hiệu lực độc lập ngày ban hành; Raglai ngoài8tiếng cũ; quản lý nhánh/tập/ấn bản; metadata sách không đồng nghĩa quyền dùng toàn văn. Chưa sửa ứng dụng.

Ngày: 21/10/2026. Tài liệu chuẩn của đợt cải tiến. [Mục lục bộ tài liệu](00_BAT_DAU_TU_DAY.md).

## 1. Sản phẩm cần trở thành gì?

ExamCraft là không gian làm việc của giáo viên để quản lý tài liệu, chọn kiến thức, soạn câu hỏi và đáp án, tạo đề/bài tập, cùng biên soạn, xuất tài liệu và giao bài bằng link. AI hỗ trợ; giáo viên giữ quyền quyết định nội dung và phát hành.

Giữ nền Next.js/React/PostgreSQL/Prisma hiện có, sửa các phần đứt luồng và xây lõi dữ liệu giáo dục còn thiếu. Không viết lại toàn bộ, không tách nhiều dịch vụ khi chưa có nhu cầu được đo. Đây là quyết định dùng nền hiện tại, không phải chứng nhận các module đang đúng.

Phạm vi là nhiều môn từ lớp 1–12 và các dạng đánh giá phù hợp. Toán được dùng để chủ dự án thử nhanh trong khi dữ liệu và chức năng các môn khác vẫn được thực hiện. Không coi một file cấu hình môn là gói môn hoàn chỉnh.

## 2. Ai dùng và được làm gì?

| Người dùng | Vai trò |
|---|---|
| Giáo viên | Quản lý tài sản riêng, key riêng, lớp/bài giao; soạn, duyệt, chia sẻ và cấp quyền cộng tác |
| Đồng nghiệp được mời | Xem/góp ý/sửa theo quyền cụ thể; không tự có quyền phát hành, quản trị hoặc dùng key của chủ đề |
| Học sinh | Vào link giáo viên mở; làm bài và xem kết quả theo chính sách; không cần tài khoản giáo viên |
| Quản trị | Quản lý tài khoản, vận hành, nguồn/mẫu dùng chung được giao; không mặc nhiên đọc toàn bộ kho riêng |
| Người duyệt chuyên môn | Duyệt gói nội dung được cấp quyền, ghi phạm vi duyệt; không thay thế bằng nhãn AI tự tin |

Giữ cách admin cấp tài khoản hiện tại làm mặc định của giai đoạn thử nghiệm; đăng ký công khai chưa được thêm vào phạm vi. Lớp là nhóm giáo viên quản lý, không phải hệ thống quản lý trường học đầy đủ.

## 3. Quyết định đã hợp nhất

| Mã | Quyết định |
|---|---|
| QD-01 | Giữ dự án, cải tiến theo module; chỉ làm mới phần thiếu hoặc không thể dùng lại hợp lý |
| QD-02 | Giáo viên là trung tâm; không xây nền tảng học tập độc lập cho học sinh |
| QD-03 | Hỗ trợ đầy đủ các môn/lớp mục tiêu, kiểm chứng theo gói; Toán là tuyến kiểm thử sớm |
| QD-04 | Chương trình chung trước; sách theo gói và ấn bản, giữ ba bộ và nguồn khác để tham chiếu; lựa chọn mặc định theo năm học/danh mục đã kiểm, không coi mọi bộ đều hiện hành ngang nhau |
| QD-05 | Khuyến nghị chuyên môn/kiến trúc: chọn khung mức theo nguồn và phạm vi đã kiểm, giữ định nghĩa/version; chủ dự án không yêu cầu cố định Biết–Hiểu–Vận dụng hoặc số mức |
| QD-06 | Câu hỏi–đáp án–lời giải–hướng dẫn chấm liên kết theo phiên bản; ba chế độ xem dùng cùng dữ liệu |
| QD-07 | Soạn cá nhân, chia sẻ, cùng sửa đồng thời và lịch sử đều thuộc phạm vi; công khai không tự cho quyền sửa |
| QD-08 | Tự lưu nháp; lưu phiên bản toàn đề; lưu vào ngân hàng là thao tác riêng |
| QD-09 | PostgreSQL là nguồn vận hành chính; local là dự phòng nháp và nguồn cũ cần chuyển |
| QD-10 | BYOK cá nhân, một đường kết nối cho gói miễn phí/trả phí; không tự chuyển sang kết nối/model có phí |
| QD-11 | AI tích lũy qua dữ liệu có bằng chứng; riêng tư mặc định, chủ động góp vào kho chung; không tự chứng nhận chính thức |
| QD-12 | Giáo viên được sửa nội dung và bố cục mẫu; thông tin nguồn/quy định nằm trong phần tra cứu |
| QD-13 | Backup/khôi phục bắt buộc trước dữ liệu thật; Drive tùy chọn; công cụ đổi DB tổng quát hoãn |
| QD-14 | Dữ liệu cũ cần đối chiếu và đường lui; không xóa bảng/route theo tên “legacy” nếu chưa kiểm phụ thuộc và tài sản |

Các lựa chọn sản phẩm được hợp nhất từ phản hồi chủ dự án. Các kết luận chuyên môn, bao gồm QD-05, là khuyến nghị cần bằng chứng và kiểm tra phạm vi, không coi lời chủ dự án là chứng nhận chuyên môn. Chi tiết triển khai là phương án hiện tại để thực hiện có kiểm chứng. Hạ tầng/ngân sách và người duyệt cụ thể vẫn là đầu vào cần xác định đúng thời điểm.

## 4. Danh mục yêu cầu chuẩn

Các mã dưới đây là phạm vi dùng để đối chiếu checklist; không phải trạng thái đã hoàn thành.

| Mã | Yêu cầu | Đầu ra người dùng mong đợi |
|---|---|---|
| YC-01 | Tài khoản và quyền | Đăng nhập/đổi mật khẩu/đăng xuất, khóa tài khoản, quyền server đúng với chủ sở hữu và người được mời |
| YC-02 | Kho đề/tài liệu | Thư mục, tìm kiếm, lọc đúng môn/lớp, gần đây, gắn sao, nhân bản, thùng rác/khôi phục |
| YC-03 | Kết nối AI cá nhân | Thêm/kiểm tra/chọn/thay/xóa key, phần che, sử dụng và chi phí ước tính có giới hạn rõ |
| YC-04 | Cây giáo dục | Cây kiến thức và mục lục sách theo phiên bản, tìm/chọn qua giao diện hoặc chat |
| YC-05 | Phạm vi | Chọn bài/kiến thức không liền nhau, loại trừ, giới hạn phương pháp, lưu lựa chọn và xem thay đổi AI đề xuất |
| YC-06 | Loại bài linh hoạt | Luyện tập, thường xuyên, định kỳ, đầu vào, thi thử/HSG, khảo sát, tùy chỉnh; thời gian không quyết định scope |
| YC-07 | Ma trận và mức nhận thức | Khung mức theo nguồn/phạm vi và phiên bản, không giới hạn cứng3/4; ma trận mục tiêu và thực tế; đặc tả gắn yêu cầu cần đạt |
| YC-08 | Bàn soạn câu | Thêm/sửa/xóa/sắp xếp đủ loại câu, lựa chọn/ý con, undo, báo lỗi rõ |
| YC-09 | Đáp án/lời giải/chấm | Soạn riêng hoặc song song; nhiều đáp án chấp nhận, rubric, nguồn, trạng thái duyệt theo phiên bản |
| YC-10 | Tài sản đi kèm | Công thức, ảnh, hình học, đồ thị, bảng biến thiên, ngữ liệu chung, tệp/âm thanh khi loại bài cần |
| YC-11 | Nhập tài liệu | Văn bản/LaTeX, Word, ảnh; xem nguồn và kết quả; giữ phần chưa đọc được, không bịa đáp án |
| YC-12 | Mẫu trình bày | Sửa tiêu đề/năm/trường/phần/cách đánh số, thêm/ẩn dòng, bố cục; mẫu chung → mẫu cá nhân → đề |
| YC-13 | Lưu và phiên bản | Lưu server thật, nháp offline, phục hồi, phát hiện xung đột, bản chốt và snapshot độc lập |
| YC-14 | Ngân hàng câu hỏi | Kho riêng/chung, lọc, tác giả/nguồn, nhập nhiều câu, bản sao độc lập, lịch sử và quyền dùng lại |
| YC-15 | AI soạn và sửa | Sinh theo kế hoạch, sửa đúng vùng chọn, so sánh trước/sau, hủy/thử lại có giới hạn, không ghi đè ngoài yêu cầu |
| YC-16 | Kiểm định | Cấu trúc/điểm/scope/nội dung; thiếu kiểm tra không báo đúng; sửa câu làm hết hiệu lực kiểm định phụ thuộc |
| YC-17 | Trộn mã đề | Số mã tùy chọn, seed tái lập, giữ nhóm/ghim, không mất câu; đáp án theo ID |
| YC-18 | Xuất và trình chiếu | Word, in/PDF, đề riêng/đáp án riêng/song song, ma trận tùy chọn, trình chiếu hiện dần lời giải |
| YC-19 | Chia sẻ và cộng tác | Link xem/thu hồi, góp ý, cùng sửa đồng thời, lịch sử và khôi phục; quyền tải/nhân bản riêng |
| YC-20 | Giao bài/lớp | Nhóm tùy chọn, tên/mã nhận diện, mở/đóng, thời lượng/lượt, snapshot; không yêu cầu cổng học tập độc lập |
| YC-21 | Làm bài | Quyền riêng từng lượt, resume, lưu nháp thật, đầy đủ dạng câu/hình/ngữ liệu, nộp đúng hạn và không nộp hộ |
| YC-22 | Chấm và kết quả | Chấm server, chờ chấm tay, điểm tạm/chốt, phản hồi, gia hạn/mở lại có lịch sử, thống kê và CSV |
| YC-23 | Phân tích và memory | Phân tích có nguồn, sở thích riêng, sửa/xóa, đồng ý góp kho chung và duyệt; quyền lọc trước truy xuất |
| YC-24 | An toàn dữ liệu/vận hành | Backup DB+tệp, restore, bí mật, giám sát, phiên bản dữ liệu và đường lui |
| YC-25 | Nguồn/mẫu chung | Nguồn, phạm vi, hiệu lực/phiên bản, duyệt, thu hồi; quyền sử dụng tài liệu và xử lý nguồn thay đổi |
| YC-26 | Giao diện dễ dùng | Công việc trước, chi tiết sau; không nhồi thuật ngữ/quy định, dùng được khi chưa có key; bàn phím/mobile/đọc chữ |
| YC-27 | Độ phủ nhiều môn/lớp | Danh mục thật, gói nội dung và khả năng theo thao tác; không dùng sai môn làm fallback |
| YC-28 | Trợ lý quản lý | Tìm tài liệu/câu, giải thích, đề nghị sắp xếp trong quyền; thao tác thay đổi có xem trước và lịch sử |
| YC-29 | Chất lượng phần mềm | Test hành vi thật, CI, bằng chứng theo cây code, đánh giá chuyên môn và hồi quy; không gắn sẵn “100%” |
| YC-30 | Chuyển đổi và dọn cũ | Chuyển dữ liệu local/server cũ không trùng/mất, đường link tương thích có hạn, dọn sau kiểm chứng |

## 5. Mức nhận thức: lựa chọn theo bằng chứng và phạm vi

Chủ dự án chỉ giải thích “ba/bốn mức” nói tới mức nhận thức, không yêu cầu hệ thống làm theo một khung cố định. Khuyến nghị dựa trên nguồn là lưu `khung mức + phiên bản + mã mức + mô tả`, không chỉ một trường có tên difficulty rồi dùng thay mọi khái niệm. Căn cứ kiểm tra bước đầu và giới hạn được ghi trong [quy trình nghiên cứu](07_NGHIEN_CUU_VA_PROMPT.md).

Độ khó là một thuộc tính khác, có thể do giáo viên nhận định hoặc tính từ kết quả thực nghiệm. Không tự coi Vận dụng luôn khó hơn mọi câu Hiểu. Với nguồn bốn mức, giữ định nghĩa của nguồn; không tự gộp Vận dụng cao vào Vận dụng hoặc ngược lại. Mẫu tiểu học giữ cách gọi/mô tả phù hợp nguồn.

Giáo viên dùng mẫu thì hệ thống điền khung tương ứng, chỉ mở phân bổ khi cần. Bài khảo sát ý kiến có thể không có mức nhận thức/đáp án/điểm. Không cần giáo viên tự đọc văn bản để bắt đầu bản nháp.

## 6. Các luồng chính và thiết kế dễ dùng

**Tạo bài:** chọn mục đích → chọn nội dung hoặc trang trống → dùng/sửa mẫu → lấy/sinh/nhập câu → soạn đáp án → kiểm tra → chốt → xuất/giao/chia sẻ.

**Cộng tác:** đề riêng → mời xem/góp ý/sửa → làm việc có nhận biết người đang sửa → xử lý xung đột → lưu mốc → chủ thể có quyền chốt/phát hành. Chia sẻ công khai chỉ xem là mặc định.

**Giao bài:** chọn phiên bản chốt → cấu hình link và người làm → mở → làm/lưu/nộp → chấm → trả kết quả. Chỉnh đề gốc không thay bài đang làm; đính chính đáp án là một thao tác có lịch sử riêng.

**Tích lũy AI:** đọc nguồn/đề được phép → tạo phân tích có bằng chứng → duyệt/chỉnh → dùng lại trong quyền → tự chọn đóng góp. Không coi việc tăng số người dùng là học máy hoặc backup.

Trang quản lý và bàn soạn tách nhau. Bàn soạn chỉ hiện công cụ của đề đang mở; Đề/Đáp án/Song song là ba góc nhìn cùng dữ liệu. Một bảng trợ lý có thể thu gọn; tránh nhiều modal chồng nhau. Tên nút là “Nội dung được chọn”, “Phân bố câu và điểm”, “Nguồn mẫu”, “Kết nối AI”.

Tiêu đề, trường, năm và phần được sửa trực tiếp trên bản xem trước. DB lưu khối/ID/thứ tự/căn chỉnh, không định danh bằng dòng trên giấy. Cho để trống có chủ ý, không tự hiện tên trường/sở giả. Các giá trị nghiệp vụ như thời gian/điểm dùng chung cho tiêu đề, file xuất và bài giao.

## 7. Giữ, thêm, sửa, ngừng hoặc hoãn

| Hành động | Nội dung | Điều kiện/ghi chú |
|---|---|---|
| Giữ và cải tiến | Nền app/DB/auth, dashboard/editor, ngân hàng, lớp/bài giao, công thức, hình, xuất Word | Có kiểm tra hành vi, không mặc định module đúng |
| Thêm | Cây kiến thức/mục lục có nguồn; scope; kế hoạch đề; khung mức; mẫu cá nhân theo khối | YC-04–07,12,25,27 |
| Thêm | Cộng tác đồng thời, quyền chi tiết, ba chế độ câu/đáp án, phân tích bền vững | YC-09,19,23 |
| Sửa | Mapping dữ liệu, lưu server, status lưu, zero-count, thiếu ý kiểm định, chấm, deadline, quyền và lộ đáp án | Các điểm chặn trước dùng thật |
| Sửa | BYOK mọi endpoint, thống kê hạn mức giả, quản lý chi phí và key người yêu cầu | Không hai hệ thống miễn phí/trả phí |
| Sửa | Nhập/xuất đủ hình/công thức/ngữ liệu, tất cả loại câu đi hết luồng | Kiểu chưa hỗ trợ báo rõ, không âm thầm bỏ |
| Ngừng dùng làm chuẩn | Cấu hình THPT áp mọi lớp; nguồn/mẫu không rõ; tên văn bản thành nút chính; “AI verified” chỉ vì confidence | Giữ lịch sử nhưng bỏ cách suy luận sai |
| Ngừng sau chuyển đổi | Luồng lưu chính local, route công khai cũ không kiểm quyền, hàm/bảng trùng không còn dùng | Có inventory, mapping, bản sao, test và rollback trước dọn |
| Không đưa vào lõi | Nền tảng học độc lập học sinh; theo dõi chuyển tab như bằng chứng gian lận; social feed/like; crawl đại trà | Không phát sinh ngầm từ tài liệu cũ |
| Hoãn có tên rõ | Công cụ chuyển DB bất kỳ, pool key trường/hybrid, thanh toán thương mại, đăng ký tự do | Không cần cho luồng cốt lõi; muốn thêm phải cập nhật phạm vi |
| Tùy chọn sau nền | Backup cá nhân Drive, nhập URL nguồn được phép | Có kế hoạch riêng, không thay backup hệ thống/nhập file |

Mục tiêu “đầy đủ” không có nghĩa hoàn thiện mọi tích hợp trên internet. Các chức năng cốt lõi và đặc thù môn thuộc phạm vi phải được theo dõi tới cùng; các tùy chọn hoãn không được dùng để tuyên bố đã xong toàn bộ.

## 8. Những quy tắc dữ liệu không được phá

1. Câu/đáp án/ý/lựa chọn có ID ổn định; số câu và A/B/C/D là nhãn hiển thị.
2. Thay đổi nội dung tạo phiên bản; kết quả kiểm định ràng buộc phiên bản hoặc hash cụ thể.
3. Đề ngân hàng, bản nháp cộng tác và snapshot bài giao có vòng đời riêng.
4. Mẫu có nguồn/phạm vi/ngày áp dụng; mẫu riêng không ghi đè mẫu chung.
5. Ma trận mục tiêu và thực tế phải so được; điểm không làm tròn sớm hoặc dùng mặc định thay số 0.
6. Server kiểm quyền trên mọi đối tượng liên kết và thao tác; UI ẩn nút chưa đủ.
7. Quyền chia sẻ tài liệu, quyền sửa, quyền dùng key và quyền góp phân tích không suy ra từ nhau.
8. Không gửi đáp án cho người làm trước chính sách công bố; không dùng ID công khai như bí mật lượt làm.
9. Nhập thiếu/không đọc được phải giữ trạng thái và nguồn; không điền đáp án mặc định đúng.
10. Backup chỉ được công nhận khi có thể phục hồi cả nội dung, tệp, quyền và dữ liệu mã hóa cần thiết.

## 9. Hiện trạng và giới hạn bằng chứng

Cây làm việc có thay đổi từ trước, HEAD ghi nhận ở các báo cáo là `bb831f2`. Phân tích trước đã kiểm kê 42 route, 20 model và 14 cấu hình; đó không phải thước đo hoàn thành. Lượt trước thực chạy 20/20 unit test và TypeScript đạt, nhưng còn thiếu E2E/HTTP/DB cô lập, kiểm tra trực quan Word và đánh giá AI thật. Lượt này chỉ lập tài liệu, không tái chạy hoặc kế thừa số PASS của các AI khác thành kết quả mới.

V1 R01–R16 và các lỗi V2 được đưa vào checklist. Những báo cáo cũ đã có chỉnh sửa sau đó được xem là giả thuyết cần tái lập, không tự ghi lỗi hiện tại. Đặc biệt: body autosave hiện có `draft` nhưng method lệch; key trực tiếp vẫn có thể đi nhánh AI thật; admin AI còn telemetry; `Attempt.student` đã có Cascade; hàm auto-grader cũ chưa thấy caller; không tự gán lại những kết luận quá rộng này.

## 10. Khi nào được coi là hoàn thành?

Hoàn thành một chức năng cần: hành vi đúng qua UI/API thật, dữ liệu lưu/mở lại đúng, quyền đúng, thông báo dễ hiểu, bằng chứng nghiệm thu và tài liệu cập nhật. Không lấy số dòng code, tên menu hoặc dấu `[x]` lịch sử làm tiêu chí.

Hoàn thành phạm vi đợt cải tiến cần các cổng nghiệm thu trong 02 và 04, ma trận môn/lớp có bằng chứng, không còn lỗi mất dữ liệu/lộ đáp án/sai quyền/sai điểm nghiêm trọng. Không tuyên bố mọi môn đạt chỉ vì Toán đạt. Trạng thái chưa duyệt chuyên môn phải được ghi đúng.


## Bổ sung từ nghiên cứu22/10/2026

[báo cáo hợp nhất22/10](../nghien-cuu/04_TONG_HOP_VA_DINH_CHINH_2026-10-22.md) bổ sung cách thực hiện YC-04/07/25/27, không giảm phạm vi toàn môn1–12. Dữ liệu cần năm học, phiên bản chương trình/sách, địa bàn khi áp dụng, vai trò NN1/NN2 và trình độ ngôn ngữ. Giữ riêng văn bản, phụ lục, tệp và nơi lưu. Phân tích AI phải dẫn nguồn-version và trang/đoạn; chưa duyệt không trở thành mẫu chuẩn.

Đề xuất mặc định sách theo danh mục năm học dựa trên kiểm tra QĐ3588 và hồ sơ bổ sung còn phải đọc; không xóa gói ba bộ/hồ sơ cũ. Độ khó, mức nhận thức và trình độ ngôn ngữ không dùng chung một trường. Các chức năng BYOK, lưu/backup, cộng tác, giao bài và quyền riêng tư đã chốt tiếp tục giữ nguyên.
