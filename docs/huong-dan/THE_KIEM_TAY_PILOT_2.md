# BỘ THẺ KIỂM THỬ THỦ CÔNG PILOT ĐỢT 2 (F10–F16)
*Dành cho Ban Thư ký Đánh giá và Giáo viên Thử nghiệm — Hệ thống ExamCraft*
*Căn cứ mã nguồn thực tế tại commit rebuild/2026-10-local HEAD*

- **Người thực hiện:** Gemini (QA & Tài liệu kiểm thử)
- **Nhiệm vụ:** GEM-Q2 (Generation 9)
- **Mã CV đối chiếu:** CV076 (Bộ thẻ kiểm tay đợt 2), CV071 (Ổn định và hoàn thiện luồng người dùng)
- **Thời điểm lập (UTC):** 2026-10-25T07:40:00Z
- **Phạm vi:** 7 kịch bản kiểm thử thủ công chuyên sâu bổ sung cho đợt 2 (F10 đến F16), tập trung vào các tính năng bảo vệ phiên, chống mất dữ liệu, khóa phiên bản chia sẻ, chấm lại sau đính chính đáp án, tương thích Microsoft Word thực tế, in ấn đa trang và hiển thị di động.

---

> [!IMPORTANT]
> **HƯỚNG DẪN THỰC HIỆN VÀ GHI NHẬN KẾT QUẢ:**
> 1. Mỗi thẻ kiểm thử phản ánh một luồng thao tác người dùng độc lập.
> 2. Người kiểm thử thực hiện tuần tự từng bước thao tác, quan sát kết quả trên màn hình và tích chọn vào ô kiểm định cuối mỗi thẻ.
> 3. Tuyệt đối dùng tài khoản và dữ liệu thử nghiệm, không nhập thông tin cá nhân thật của học sinh.

---

## DANH MỤC CÁC THẺ KIỂM THỬ ĐỢT 2

| Mã thẻ | Tên luồng kiểm thử | Mục tiêu cốt lõi |
|---|---|---|
| [THẺ F10](#thẻ-f10-đổi-tài-khoản-trên-cùng-máy-tính) | Đổi tài khoản trên cùng máy | Xác minh cô lập tuyệt đối kho đề và bản nháp giữa các giáo viên dùng chung máy tính |
| [THẺ F11](#thẻ-f11-xử-lý-và-phục-hồi-dữ-liệu-khi-mất-mạng) | Tải lại và phục hồi khi mất mạng | Kiểm tra giữ nháp ngoại tuyến, tự đồng bộ khi có mạng, tải JSON dự phòng |
| [THẺ F12](#thẻ-f12-sửa-đáp-án-và-chấm-lại-hàng-loạt) | Sửa đáp án và chấm lại (Regrade) | Đính chính đáp án, xem trước điểm thay đổi, bảo toàn điểm chấm tay, lưu vết lịch sử |
| [THẺ F13](#thẻ-f13-liên-kết-chia-sẻ-khóa-theo-phiên-bản) | Khóa phiên bản liên kết chia sẻ | Sửa đề sau khi chia sẻ không làm đổi link cũ; tạo link mới để phát hành bản cập nhật |
| [THẺ F14](#thẻ-f14-kiểm-tra-mở-tệp-word-bằng-microsoft-word-thực-tế) | Tương thích Microsoft Word thật | Mở tệp .docx trực tiếp trên Microsoft Word, kiểm tra bảng barem, công thức và hình vẽ |
| [THẺ F15](#thẻ-f15-kiểm-tra-ngắt-trang-nhiều-trang-khi-in-ấn-a4) | Ngắt trang in ấn đa trang | Kiểm tra chế độ Đề in ấn và Song song không bị cắt đôi câu hỏi hay tràn lề trang |
| [THẺ F16](#thẻ-f16-kiểm-tra-giao-diện-học-sinh-trên-màn-hình-di-động-375px) | Giao diện học sinh trên điện thoại | Kiểm tra phòng thi trên viewport di động 375px (iPhone SE/Android nhỏ), làm bài mượt mà |
| [THẺ F17](#thẻ-f17-kiểm-tra-công-thức-toán-học-khi-mở-bằng-microsoft-word-thực-tế) | Hiển thị công thức toán trong Word | Mở file Word xuất từ hệ thống, đối chiếu trực quan 10 dạng công thức toán hiển thị chuẩn OMML |

---

### THẺ F10: Đổi tài khoản trên cùng máy tính
- **Mã kịch bản:** PILOT-F10
- **Mã CV đối chiếu:** CV011, CV071
- **Vai trò:** Hai giáo viên (Giáo viên A và Giáo viên B) cùng dùng một máy tính của phòng hội đồng để soạn đề.
- **Dữ liệu chuẩn bị:** 
  - Tài khoản A: gv_toan_a@examcraft.test
  - Tài khoản B: gv_van_b@examcraft.test

#### Các bước thực hiện:
1. Đăng nhập bằng tài khoản Giáo viên A trên trình duyệt.
2. Tạo một đề thi mới với tiêu đề: Đề thử nghiệm Toán Giáo viên A. Soạn 2 câu hỏi.
3. Không bấm lưu đám mây hoặc giả lập ngắt mạng để đề còn bản nháp cục bộ trên máy.
4. Bấm vào ảnh đại diện/tên người dùng ở góc phải thanh tiêu đề, chọn **Đăng xuất tài khoản**.
5. Quan sát trình duyệt chuyển về trang đăng nhập `/login`.
6. Đăng nhập bằng tài khoản Giáo viên B.
7. Vào **Kho Đề Cá Nhân** của Giáo viên B và kiểm tra danh sách đề.
8. Mở thử trang soạn đề mới của Giáo viên B (`/editor/new`), nhấp mở rộng khối **Bản nháp chưa lưu trên máy này**.

#### Kết quả mong đợi:
- Kho đề của Giáo viên B hoàn toàn không xuất hiện đề của Giáo viên A.
- Trong khối bản nháp chưa lưu của Giáo viên B, không có bản nháp nào của Giáo viên A.
- Nháp cục bộ gắn chặt theo mã định danh người dùng trong bộ nhớ trình duyệt, ngăn ngừa triệt để rò rỉ đề thi giữa các giáo viên dùng chung máy tính.

#### Đánh giá kết quả kiểm thử:
- [ ] ĐẠT (Bản nháp và kho đề được cô lập hoàn toàn giữa 2 tài khoản)
- [ ] KHÔNG ĐẠT (Còn nhìn thấy nháp hoặc đề của tài khoản trước)
- Ghi chú: ............................................................................................................

---

### THẺ F11: Xử lý và phục hồi dữ liệu khi mất mạng
- **Mã kịch bản:** PILOT-F11
- **Mã CV đối chiếu:** CV006, CV050, CV071
- **Vai trò:** Giáo viên đang soạn đề thi thì bị ngắt kết nối Internet đột ngột.
- **Dữ liệu chuẩn bị:** Đề thi đang mở trong không gian soạn thảo.

#### Các bước thực hiện:
1. Đang mở một đề thi có sẵn trên hệ thống.
2. Ngắt kết nối mạng trên máy tính (tắt Wi-Fi hoặc rút dây mạng LAN).
3. Thêm một câu hỏi mới hoặc chỉnh sửa nội dung một câu hỏi hiện có.
4. Quan sát dòng thanh thông báo trạng thái xuất hiện ở đầu trang soạn thảo.
5. Bấm nút **Tải bản nháp** hiển thị trên thanh trạng thái.
6. Thử bấm nút **Thử lưu lại** trong khi vẫn đang mất mạng.
7. Bật lại kết nối Wi-Fi/Internet trên máy tính.
8. Quan sát phản ứng của hệ thống và bấm **Thử lưu lại** nếu cần.
9. Tải lại trang (F5) để kiểm tra việc bảo toàn nội dung câu hỏi vừa sửa.

#### Kết quả mong đợi:
- Khi mất mạng, thanh trạng thái chuyển màu và hiển thị thông báo: **Mất kết nối — đang giữ bản nháp trên máy**.
- Bấm **Tải bản nháp** sẽ tải xuống ngay một tệp .json chứa toàn bộ nội dung đề mới nhất mà không phụ thuộc vào máy chủ.
- Khi bấm **Thử lưu lại** lúc mất mạng, hệ thống không làm mất dữ liệu trên form.
- Khi mạng kết nối lại, hệ thống đồng bộ đề lên máy chủ thành công; tải lại trang nội dung vừa sửa vẫn còn nguyên vẹn 100%.

#### Đánh giá kết quả kiểm thử:
- [ ] ĐẠT (Không mất dữ liệu, tải được tệp JSON nháp, tự đồng bộ khi có mạng lại)
- [ ] KHÔNG ĐẠT (Mất nội dung khi ngắt mạng hoặc trang bị trắng)
- Ghi chú: ............................................................................................................

---

### THẺ F12: Sửa đáp án và chấm lại hàng loạt
- **Mã kịch bản:** PILOT-F12
- **Mã CV đối chiếu:** CV060, CV071, CV076
- **Vai trò:** Giáo viên chủ nhiệm phát hiện một câu trắc nghiệm bị sai đáp án gốc sau khi đã có học sinh nộp bài.
- **Dữ liệu chuẩn bị:** 
  - Một đợt bài đã giao có ít nhất 3 học sinh đã nộp bài (ví dụ: Học sinh 1 chọn A được 10 điểm; Học sinh 2 chọn B được 8 điểm; Học sinh 3 đã được giáo viên chấm tay câu tự luận).

#### Các bước thực hiện:
1. Truy cập vào mục **Bài đã giao**, nhấp mở bài kiểm tra thử nghiệm.
2. Ghi nhận điểm số hiện tại của 3 học sinh tại thẻ **Bảng điểm & Bài nộp**.
3. Chuyển sang thẻ **Phân tích câu hỏi**.
4. Nhấp vào dòng tiêu đề **Sửa đáp án và chấm lại** để mở bảng điều khiển.
5. Tại ô **Câu cần sửa**, chọn câu hỏi trắc nghiệm cần đính chính (ví dụ Câu 1 ban đầu đáp án đúng là A, nay đổi thành B).
6. Tại ô **Đáp án đúng mới**, chọn phương án B.
7. Để trống ô lý do và quan sát hai nút hành động phía dưới.
8. Nhập vào ô **Lý do (bắt buộc, lưu vào lịch sử)**: Đính chính đáp án Câu 1 theo tổ chuyên môn.
9. Bấm nút **Xem trước ảnh hưởng**.
10. Quan sát kỹ bảng thông tin xem trước xuất hiện.
11. Bấm nút **Sửa đáp án và chấm lại** để thi hành chính thức.
12. Quay lại thẻ **Bảng điểm & Bài nộp** để kiểm tra điểm số cập nhật của học sinh.

#### Kết quả mong đợi:
- Khi chưa nhập lý do (dưới 3 ký tự), các nút bấm bị vô hiệu hóa để ngăn thao tác bất cẩn.
- Bấm **Xem trước ảnh hưởng**: Hiển thị chính xác số bài đổi điểm, số bài không đổi, và xác nhận các bài đã chấm tay được giữ nguyên điểm số.
- Danh sách thay đổi điểm liệt kê chi tiết: Học sinh 1 (chọn A cũ) bị giảm điểm, Học sinh 2 (chọn B mới) được tăng điểm.
- Bấm **Sửa đáp án và chấm lại**: Điểm số toàn bộ lớp học được cập nhật tức thì. Khối **Lịch sử sửa đáp án** lưu lại mốc thời gian, người sửa và lý do đính chính.

#### Đánh giá kết quả kiểm thử:
- [ ] ĐẠT (Xem trước minh bạch, chấm lại tự động chính xác, giữ nguyên bài chấm tay, lưu vết lịch sử)
- [ ] KHÔNG ĐẠT (Điểm không đổi, sai điểm chấm tay, hoặc không lưu lịch sử)
- Ghi chú: ............................................................................................................

---

### THẺ F13: Liên kết chia sẻ khóa theo phiên bản
- **Mã kịch bản:** PILOT-F13
- **Mã CV đối chiếu:** CV048, CV071
- **Vai trò:** Giáo viên chia sẻ đề cho tổ chuyên môn xem duyệt, sau đó tiếp tục chỉnh sửa nội dung trong đề.
- **Dữ liệu chuẩn bị:** Đề thi phiên bản 1 (ví dụ có 5 câu hỏi).

#### Các bước thực hiện:
1. Trong không gian soạn thảo, bấm nút **Chia sẻ** trên thanh công cụ bên trái.
2. Chọn thẻ **Link Xem / Tải Word (.docx)**, bấm nút **Tạo link chia sẻ**.
3. Bấm **Sao chép** liên kết (Link 1). Mở liên kết này trong một cửa sổ ẩn danh mới để kiểm tra: Đề hiển thị đúng 5 câu.
4. Quay lại cửa sổ soạn thảo của giáo viên, sửa tiêu đề đề thi hoặc thêm câu hỏi thứ 6, sau đó bấm **Lưu đề**.
5. Mở lại cửa sổ ẩn danh đang xem Link 1 và tải lại trang (F5).
6. Mở lại hộp thoại chia sẻ trong trang soạn thảo, bấm **Tạo link chia sẻ** một lần nữa để lấy đường dẫn mới (Link 2).
7. Mở Link 2 trong cửa sổ ẩn danh khác để đối chiếu.

#### Kết quả mong đợi:
- Tại Link 1 (tạo lúc ban đầu): Trang xem đề vẫn giữ nguyên vẹn nội dung của phiên bản 1 (5 câu hỏi), không bị ảnh hưởng bởi câu thứ 6 vừa thêm mới.
- Tại Link 2 (tạo sau khi sửa): Trang xem đề hiển thị phiên bản mới nhất gồm đầy đủ 6 câu hỏi.
- Cơ chế khóa cứng phiên bản hoạt động tin cậy, giúp đề đã chia sẻ cho đồng nghiệp không bị biến đổi bất ngờ ngoài tầm kiểm soát.

#### Đánh giá kết quả kiểm thử:
- [ ] ĐẠT (Link 1 giữ nguyên nội dung cũ; Link 2 mang nội dung mới)
- [ ] KHÔNG ĐẠT (Link 1 tự động bị đổi theo nội dung mới vừa sửa)
- Ghi chú: ............................................................................................................

---

### THẺ F14: Kiểm tra mở tệp Word bằng Microsoft Word thực tế
- **Mã kịch bản:** PILOT-F14
- **Mã CV đối chiếu:** CV008, CV071
- **Vai trò:** Giáo viên tải tệp .docx từ hệ thống và mở trực tiếp bằng phần mềm Microsoft Word (bản cài trên Windows/macOS, không chỉ xem qua Google Docs).
- **Dữ liệu chuẩn bị:** Đề thi có chứa đầy đủ: công thức toán phân số căn bậc hai, bảng dữ liệu, và một hình vẽ minh họa.

#### Các bước thực hiện:
1. Mở đề thi, chuyển sang chế độ xem **Đề thi in ấn** hoặc **Song song**.
2. Bấm nút **Tải file Word (.docx)** trên thanh tiêu đề.
3. Chờ trình duyệt tải tệp về thư mục Downloads.
4. Mở tệp vừa tải bằng phần mềm **Microsoft Word** (phiên bản 2016, 2019, 2021 hoặc Microsoft 365).
5. Quan sát thanh thông báo đầu tệp Word xem có xuất hiện cảnh báo tệp bị lỗi hoặc yêu cầu phục hồi không.
6. Rà soát lần lượt: Tiêu đề trường/sở, bảng barem điểm, các công thức toán học, bảng số liệu và hình ảnh đính kèm.

#### Kết quả mong đợi:
- Microsoft Word mở tệp mượt mà, không xuất hiện hộp thoại báo lỗi cấu trúc XML hay tệp bị hỏng.
- Tiêu đề đầu đề thi được căn lề chuẩn mực theo quy cách hành chính.
- Bảng biểu không bị tràn lề trang A4; công thức toán học hiển thị rõ ràng, không bị biến dạng ký tự.
- Hình vẽ minh họa được nhúng trực tiếp vào văn bản, hiển thị sắc nét.

#### Đánh giá kết quả kiểm thử:
- [ ] ĐẠT (Mở trực tiếp trên Microsoft Word mượt mà, định dạng chuẩn A4, không lỗi cấu trúc)
- [ ] KHÔNG ĐẠT (Word báo lỗi tệp hỏng, mất hình ảnh hoặc tràn lề bảng biểu)
- Ghi chú: ............................................................................................................

---

### THẺ F15: Kiểm tra ngắt trang nhiều trang khi in ấn A4
- **Mã kịch bản:** PILOT-F15
- **Mã CV đối chiếu:** CV008, CV027, CV071
- **Vai trò:** Giáo viên chuẩn bị in đề thi học kỳ dài từ 3 đến 5 trang giấy A4.
- **Dữ liệu chuẩn bị:** Đề thi hoàn chỉnh có độ dài tối thiểu 20 câu hỏi trải dài trên nhiều trang giấy.

#### Các bước thực hiện:
1. Mở đề thi trong không gian soạn thảo.
2. Bấm nút **In A4** trên thanh tiêu đề.
3. Hộp thoại in của trình duyệt mở ra. Chọn khổ giấy **A4**, tỷ lệ **100% (Mặc định)**.
4. Cuộn xem từng trang trong khung xem trước in của trình duyệt (Trang 1, Trang 2, Trang 3...).
5. Quan sát các vị trí tiếp giáp chân trang và đầu trang kế tiếp:
   - Các câu hỏi trắc nghiệm có bị xé lẻ (nội dung câu ở trang trước, 4 phương án lựa chọn bị đẩy sang trang sau) hay không.
   - Bảng ma trận hoặc barem điểm có bị cắt cụt tiêu đề không.
6. Thử chuyển sang chế độ xem **Song song** và bấm **In A4** để quan sát việc bố trí hai cột trên nhiều trang giấy.

#### Kết quả mong đợi:
- Mỗi thẻ câu hỏi tuân thủ quy tắc giữ liền khối khi in ấn, hạn chế tối đa việc xé lẻ câu hỏi qua trang giấy mới.
- Đầu trang và chân trang hiển thị số trang rõ ràng, căn lề mép giấy đúng tiêu chuẩn in ấn giáo dục.
- Chế độ Song song in ấn duy trì cân đối giữa cột câu hỏi và cột hướng dẫn giải mà không gây xô lệch dòng.

#### Đánh giá kết quả kiểm thử:
- [ ] ĐẠT (Bản in ngắt trang hợp lý, không xé vụn câu hỏi, giữ lề chuẩn A4)
- [ ] KHÔNG ĐẠT (Câu hỏi bị cắt ngang mất chữ, lề bị tràn hoặc xô lệch trang)
- Ghi chú: ............................................................................................................

---

### THẺ F16: Kiểm tra giao diện học sinh trên màn hình di động (375px)
- **Mã kịch bản:** PILOT-F16
- **Mã CV đối chiếu:** CV055, CV057, CV062, CV071
- **Vai trò:** Học sinh truy cập phòng thi trực tuyến bằng điện thoại thông minh (màn hình hẹp tương đương iPhone SE / thiết bị 375px).
- **Dữ liệu chuẩn bị:** Đường liên kết phòng thi đã được giáo viên tạo sẵn (yêu cầu điền tên tự do).

#### Các bước thực hiện:
1. Trên trình duyệt máy tính, mở liên kết phòng thi và bật chế độ Kiểm tra thiết bị của trình duyệt (F12 -> Bật chế độ Responsive, chỉnh chiều rộng là **375px**). Hoặc mở trực tiếp trên điện thoại di động thực tế.
2. Nhập họ tên học sinh vào ô nhập liệu và bấm **Bắt đầu làm bài**.
3. Quan sát màn hình phòng thi đang diễn ra:
   - Thanh tiêu đề cố định trên cùng: Tên bài thi, tên học sinh và đồng hồ đếm ngược có bị che khuất hoặc tràn lề không.
   - Thao tác chọn phương án trắc nghiệm A, B, C, D bằng thao tác chạm trên màn hình nhỏ.
   - Thao tác kéo ghép nối hoặc nhập câu trả lời ngắn trên bàn phím ảo.
4. Bấm nút **Nộp bài**. Quan sát hộp thoại xác nhận nộp bài hiển thị trên màn hình 375px.
5. Xác nhận nộp bài và xem màn hình kết quả điểm số.

#### Kết quả mong đợi:
- Giao diện tự động co giãn hoàn hảo ở độ rộng 375px, không bị xuất hiện thanh cuộn ngang khó chịu.
- Nút bấm và các phương án trả lời có kích thước vùng chạm tối thiểu chuẩn công thái học di động, học sinh không bị bấm nhầm.
- Đồng hồ đếm ngược và trạng thái lưu nháp luôn nhìn thấy rõ ràng.
- Hộp thoại nộp bài và màn hình kết quả điểm số hiển thị gọn gàng, nút nộp bài bấm thuận tiện.

#### Đánh giá kết quả kiểm thử:
- [ ] ĐẠT (Hiển thị hoàn hảo trên màn hình 375px, không cuộn ngang, chạm chọn dễ dàng)
- [ ] KHÔNG ĐẠT (Bị tràn màn hình, che mất đồng hồ, hoặc nút bấm quá nhỏ khó chạm)
- Ghi chú: ............................................................................................................

---

### THẺ F17: Kiểm tra công thức toán học khi mở bằng Microsoft Word thực tế
- **Mã kịch bản:** PILOT-F17
- **Mã CV đối chiếu:** CV043, CV071, CV076
- **Vai trò:** Giáo viên hoặc Thư ký kiểm thử tải tệp Word từ hệ thống và mở trực tiếp bằng phần mềm Microsoft Word trên máy tính cá nhân.
- **Mục tiêu:** Xác minh bộ chuyển đổi công thức toán ngày 25/10 chuyển đổi chính xác cú pháp LaTeX sang định dạng Office Math (OMML), hiển thị sắc nét, đúng hình dạng sư phạm, không bị vỡ hạt, không bị biến thành chuỗi văn bản thô.

#### Các bước thực hiện:
1. Mở đề thi Toán mẫu hoặc soạn đề thi chứa đầy đủ 10 cấu trúc toán học nâng cao.
2. Trên thanh công cụ soạn thảo, bấm nút **Tải Word (.docx)**.
3. Chờ trình duyệt tải tệp về thư mục Downloads của máy tính.
4. Mở tệp vừa tải bằng ứng dụng Microsoft Word cài đặt trên máy tính (phiên bản Word 2016 trở lên hoặc Microsoft 365).
5. Quan sát trực quan từng công thức toán học và đối chiếu từng hàng theo bảng kiểm chuẩn bên dưới.

#### Bảng đối chiếu hình dạng đúng mong đợi của 10 dạng công thức:

| STT | Dạng công thức toán | Cú pháp LaTeX mẫu | Hình dạng đúng mong đợi khi nhìn trong Word | Đánh giá |
|:---:|---|---|---|:---:|
| 1 | **Phân số lồng nhau** | `\frac{\frac{a}{b} + 1}{\frac{c}{d} - 2}` | Có vạch phân số chính nằm ngang ở giữa, vạch phân số con ngắn hơn ở trên tử và dưới mẫu; chữ số và phép tính không đè lên gạch ngang. | [ ] Đạt<br>[ ] Chưa |
| 2 | **Căn bậc ba** | `\sqrt[3]{x^2 + 1}` | Dấu căn bậc mở rộng với chữ số 3 nhỏ đặt khít trên rãnh móc căn bên trái; vạch ngang trên đỉnh kéo dài bao trùm toàn bộ biểu thức bên trong. | [ ] Đạt<br>[ ] Chưa |
| 3 | **Số mũ (Lũy thừa)** | `x^2` hoặc `a^{m+n}` | Chữ số hoặc biểu thức mũ có cỡ chữ nhỏ hơn, được nâng cao lên phía trên bên phải của cơ số; không nằm cùng hàng với cơ số. | [ ] Đạt<br>[ ] Chưa |
| 4 | **Chỉ số dưới** | `x_1, x_2` hoặc `a_{n+1}` | Chữ số hoặc biểu thức chỉ số nhỏ hơn, hạ thấp xuống phía dưới bên phải của ký tự chính; phân biệt rõ ràng với phép nhân. | [ ] Đạt<br>[ ] Chưa |
| 5 | **Tổng Sigma với cận** | `\sum_{i=1}^n i^2` | Ký hiệu Sigma lớn $\Sigma$; cận dưới i=1 nằm ngay ngắn chính giữa phía dưới chân; cận trên n nằm chính giữa trên đỉnh đầu Sigma. | [ ] Đạt<br>[ ] Chưa |
| 6 | **Giới hạn** | `\lim_{x \to 0} \frac{\sin x}{x}` | Chữ lim đứng thẳng (phông đứng); biểu thức x tiến về 0 nằm dưới chân chữ lim kèm mũi tên nhỏ chỉ sang phải rõ nét. | [ ] Đạt<br>[ ] Chưa |
| 7 | **Tích phân có cận** | `\int_a^b f(x)dx` | Dấu tích phân $\int$ uốn lượn thon dài; cận dưới a nằm ở móc đáy, cận trên b nằm ở móc đỉnh; hàm số và vi phân dx thẳng hàng. | [ ] Đạt<br>[ ] Chưa |
| 8 | **Hàm lượng giác** | `\sin^2 x + \cos^2 x = 1` | Tên hàm sin và cos hiển thị thẳng đứng (Roman); số mũ 2 nhỏ nâng cao bên trên tên hàm; biến x in nghiêng phía sau. | [ ] Đạt<br>[ ] Chưa |
| 9 | **Ký hiệu tập hợp** | `A \cap B, x \in \mathbb{R}` | Ký hiệu giao hình móng ngựa úp $\cap$; ký hiệu thuộc $\in$; chữ R tập số thực có nét rỗng đôi $\mathbb{R}$ chuẩn toán học. | [ ] Đạt<br>[ ] Chưa |
| 10 | **Hệ phương trình** | `\begin{cases} 2x + y = 5 \\ x - 3y = -1 \end{cases}` | Một dấu ngoặc nhọn lớn duy nhất tự co giãn ôm trọn cả 2 dòng phương trình; các dấu bằng và biến số thẳng cột với nhau. | [ ] Đạt<br>[ ] Chưa |

#### Tiêu chí đánh giá kết quả:
- [ ] **ĐẠT:** Toàn bộ 10 công thức toán học hiển thị dưới dạng khối phương trình Office Math chỉnh sửa được, đúng hình dạng mong đợi, không xuất hiện mã thô $...$.
- [ ] **KHÔNG ĐẠT:** Xuất hiện chuỗi mã LaTeX thô, công thức bị co rúm biến thành ô vuông hoặc tràn lề trang giấy.
- Ghi chú: ............................................................................................................

---
*Tài liệu kiểm thử thực địa ExamCraft — Đợt 2 (Cập nhật ngày 25/10/2026).*
