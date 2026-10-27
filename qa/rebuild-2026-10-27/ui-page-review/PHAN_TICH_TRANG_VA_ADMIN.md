# Rà cấu trúc trang ExamCraft — nhận định để chủ dự án đối chiếu

27/10/2026. **Phần này chỉ phân tích. Chưa thiết kế lại admin, xóa chức năng, thay API, đổi dữ liệu hay chỉnh các số liệu/nội dung ghi cứng được nêu dưới đây.** Phần sửa màu, khoảng cách và điện thoại nằm riêng trong BAO_CAO.md cùng thư mục.

## Tôi hiểu vấn đề bạn đang nói như thế nào?

Bạn không chỉ muốn đổi giao diện cũ sang màu mới. Bạn đang nghi có những mảnh của các giai đoạn phát triển trước vẫn được giữ lại: tên gọi, thông tin giới thiệu, con số giả định, khối tính năng hoặc cách bố trí. Khi phủ thiết kế mới lên, những mảnh này cũng được đưa sang dù có thể không còn phản ánh đúng sản phẩm hiện tại. Kết quả có thể đẹp hơn nhưng vẫn khó hiểu hoặc báo sai tình trạng.

Đối chiếu mã cho thấy **có những trường hợp cụ thể đúng với nhận định này**, đặc biệt ở admin. Tuy nhiên, việc một màn hình viết CSS riêng hoặc một bảng dữ liệu cũ còn tồn tại không tự chứng minh toàn bộ tính năng đó sai hoặc nên xóa. Cần tách ba việc: lỗi hiển thị có thể sửa ngay; nội dung/khái niệm cần xác minh; và tổ chức lại sản phẩm cần bạn duyệt.

## Các trường hợp admin có bằng chứng rõ

| Vị trí | Mã hiện tại và ý nghĩa | Vấn đề với người dùng | Hướng đề nghị, chưa thực hiện |
|---|---|---|---|
| Thẻ Hạ tầng AI trong `/admin/users` | `src/app/admin/users/page.tsx` ghi nguyên văn “7 Gemini Keys”, “Hệ thống xoay tua chống nghẽn 429”. Con số không lấy từ API. | Trông giống chỉ số vận hành thật, có thể khiến người dùng nghĩ luôn có bảy khóa chung sẵn dùng. | Thay bằng thông tin có nguồn và phạm vi rõ, hoặc bỏ thẻ nếu không giúp quản lý giáo viên. |
| `/admin/ai` | Tiêu đề, badge, nút reset và hộp xác nhận đều nhắc “7”. Mô tả nói khóa nằm trong biến môi trường. `/api/admin/ai` đọc/đặt lại `aiKeyState`. | Giao diện đang kể câu chuyện một pool cố định, trong khi cơ chế gọi AI hiện hành khác. Chỉ đổi màu không giải quyết được. | Rà lại ý nghĩa từng số liệu và tác dụng reset trước khi thiết kế lại màn hình này. |
| Cơ chế gọi AI thật trong mã | `src/lib/gemini-keys.ts`, `executeWithKeyRotation`: dùng khóa tạm do người dùng truyền hoặc `userApiKey` đang bật của chính tài khoản; nhánh này không lấy pool bảy khóa môi trường. Thành công/lỗi cập nhật `userApiKey` và `aiUsageLog`. | Trạng thái ở khối pool cũ không thể được coi là toàn cảnh khóa hiện hành. Reset `aiKeyState` không đồng nghĩa bật lại các khóa cá nhân đã tắt. | Chốt mô hình giám sát cho khóa cá nhân và khóa được admin cấp; chưa xóa bảng hoặc đổi hành vi reset. |
| Phạm vi nhật ký và thẻ trạng thái trong AI Hub | `/api/admin/ai` đếm `aiUsageLog` toàn hệ thống, nhưng danh sách trạng thái lấy từ `aiKeyState`. Trong `src`, tham chiếu `aiKeyState` chỉ tìm thấy ở route admin AI. | Cùng một màn hình ghép số liệu của hai nguồn khác nhau mà chưa giải thích phạm vi. Nhật ký có thể hữu ích và là dữ liệu thật; không nên kết luận cả trang là dữ liệu giả. | Gắn nguồn/phạm vi cho từng khối; giữ nhật ký hữu ích khi rà lại phần pool. |
| `/admin/keys` | Route cấp khóa thao tác `userApiKey` với `grantId`, nhóm theo đợt cấp và người nhận; API người dùng phân biệt khóa được cấp với khóa tự thêm. | Đây là chức năng hiện hành có giá trị, nhưng điều hướng “Giám sát AI Keys / Cấp khóa AI / Khóa AI” khiến ba khái niệm dễ bị hiểu như một. | Dùng tên rõ: cấp cho ai, theo dõi hoạt động gì, ai được tắt/thu hồi. Không nhập các quyền khác nhau thành một nút. |
| Khung trang admin | Users/AI tự vẽ header sticky, logo, nút theme, nội dung kỹ thuật; Keys dùng tiêu đề trang và dãy link khác. Không có layout admin chung trong cây route hiện tại. | Đi từ trang nọ sang trang kia có cảm giác sang công cụ khác, dù màu đã gần nhau. Users và AI không có tiêu đề `h1` nội dung như trang Keys. | Sau khi chốt nội dung, làm khung admin chung: tên mục hiện tại, điều hướng, vùng hành động, cùng quy tắc tiêu đề. |
| Nội dung kỹ thuật đưa ra mặt ngoài | “v3.1”, “PostgreSQL server”, “AiUsageLog”, “Endpoint”, “Auto Round-Robin & Cooldown”, “bảo mật tuyệt đối”. | Quản trị nhóm nhỏ cần biết ai dùng được, ai gặp lỗi, cần làm gì; tên bảng/cơ chế nội bộ và lời khẳng định tuyệt đối chưa giúp quyết định. | Tên dễ hiểu ở mặt chính; chi tiết kỹ thuật mở khi cần. Việc bỏ/sửa câu chữ này chờ duyệt, chưa tự đổi. |
| Xử lý kết quả và lỗi | Users/AI trộn toast, `alert`, `confirm`; một số lỗi tải chỉ `console.error`. Keys có vùng thông báo riêng; không dùng cùng mẫu điều hướng lỗi quyền. | Người dùng có thể không biết dữ liệu chưa tải được; thông báo lỗi và xác nhận trông không thống nhất. | Định nghĩa rõ tải/rỗng/lỗi/thành công/xác nhận nguy hiểm, rồi dùng chung. Chưa thay luồng xử lý lỗi trong đợt sửa CSS. |
| Bảng Users trên điện thoại | Nhiều cột, có khung cuộn ngang. API trả cả hai vai trò, còn nhãn chính nhiều chỗ nói giáo viên; các tổng giáo viên chỉ đếm TEACHER. | Không tràn toàn trang chưa có nghĩa dễ dùng: phải kéo ngang để đến thao tác; cần phân biệt bộ lọc vai trò và tổng toàn hệ thống. | Cân nhắc hàng gọn + chi tiết, hoặc giữ bảng với cột chính và dấu hiệu cuộn. Chưa chuyển sang thẻ hoặc ẩn cột. |
| Danh sách người nhận ở Keys | `teachers` nhận nguyên users từ API; `visible` lọc đang hoạt động và từ tìm kiếm, không lọc role. | Nhãn “giáo viên” có thể bao gồm cả quản trị viên. Không tự kết luận đây là lỗ hổng quyền; cần chốt admin có được nhận khóa như người dùng khác hay không. | Chốt phạm vi và cách gọi “người dùng/giáo viên”, rồi đồng bộ bộ lọc và thông tin trên các trang. |
| Tỷ lệ thành công khi chưa có lượt gọi | API và state mặc định dùng 100 khi `totalToday=0`; ảnh AI Hub đợt này cho thấy 0 lượt nhưng 100%. | Người dùng có thể hiểu đó là kết quả vận hành tốt đã đo được, dù chưa có mẫu. | Hiển thị “Chưa có dữ liệu” cho trường hợp này; chưa sửa công thức hoặc UI điều kiện. |

**Điểm quan trọng:** không nên sửa “7” thành `keyStates.length` rồi coi xong. Cách đó chỉ làm con số động theo bảng cũ, vẫn chưa chứng minh nó đại diện đúng cho các khóa đang được dùng. Cũng không nên xóa ngay AI Hub vì phần nhật ký có nguồn dữ liệu hiện hành.

## Các trang còn lại: lớp giao diện và lớp sản phẩm

| Trang/nhóm | Nhận định sau đọc mã | Cần tách khỏi việc sửa màu |
|---|---|---|
| Kho đề `/` | Là điểm vào cho giáo viên, có thư mục, ngân hàng, nhập/sinh đề. Header, sidebar và thanh công cụ bên phải riêng với editor. | `TeacherDashboard.tsx` render cả popup Thư ký “BETA/ĐANG HUẤN LUYỆN” và `TeacherAiSecretaryDrawer` bằng **cùng** `isAiSecretaryModalOpen`. Popup giới thiệu và drawer trợ lý cùng tồn tại là ví dụ rõ về hai lớp sản phẩm đang chồng lên nhau. Có câu “giảm 80%”, danh sách “sắp ra mắt” trong khi drawer đã có giao diện hoạt động. Chưa thay mount/state hoặc xóa popup. |
| Editor `/editor/[id]` | Có bố cục riêng phục vụ tài liệu A4, công cụ sửa, đáp án, trợ lý, quyền và lịch sử. `/editor` chỉ chuyển đến `/editor/new`. | Không nên ép editor thành trang quản trị đơn giản: giấy A4, nội dung giáo viên và công cụ cần mật độ khác. Cần thống nhất điều hướng và cách mở công cụ, không xóa sự khác nhau có lý do. |
| Lớp `/teacher/groups` | Quản lý lớp, thành viên và PIN; các hành động đã có, không chỉ mẫu trang. | Tiêu đề viết hoa nhiều, ô tìm kiếm và chi tiết lớp dùng mẫu riêng. Câu chữ và thứ tự ưu tiên thao tác nên được rà cùng luồng giao bài, không tự gộp/xóa trong đợt này. |
| Danh sách `/teacher/assignments` | Liệt kê bài giao; nút “Giao Bài Mới” đưa về kho đề, không mở ngay form giao. Trong thẻ có trường mode thô. | Dễ tạo kỳ vọng sai về nơi bắt đầu giao bài. `_count.attempts` được ghi nhãn “lượt đã nộp”, nhưng GET `/api/assignments` đếm toàn bộ quan hệ attempts, không lọc SUBMITTED. Đây là lệch ý nghĩa giữa nhãn và truy vấn; chưa sửa trong đợt trình bày. |
| Giám sát `/teacher/assignments/[id]` | Tập trung lịch thi, khóa/mở, kết quả, chấm, lịch sử và CSV. Nhiều chức năng thật làm trang dày. | Cần phân tầng tổng quan → danh sách → bài làm/chi tiết; chưa di chuyển hoặc ẩn công cụ chấm. Màu điểm, trạng thái và cảnh báo không phải tất cả đều là màu trang trí. |
| Link lớp `/c/[groupCode]` | Chọn học sinh và vào bài được giáo viên giao. | Tiêu đề “lớp học trực tuyến” có thể gợi ý LMS rộng hơn phạm vi đã chốt. **Có lệch nhãn xác nhận được:** JSX nhận EXAM/PRACTICE/còn lại→“Bài về nhà”, trong khi schema/API là EXAM/CLASSWORK/HOMEWORK. Mẫu CLASSWORK vì thế hiện “Bài về nhà” (ảnh BEFORE-class và FINAL-class). Đây là ví dụ cách gọi cũ không theo enum hiện hành; chỉ ghi nhận, chưa đổi nhãn/logic. Đã sửa riêng khối chọn tên bị cắt ở màn hình nhỏ, không sửa chính sách nhận diện. |
| Làm bài `/a/[publicId]` | Có các trạng thái vào bài, đang làm, xác nhận và kết quả. | Chỉ thống nhất nút/chữ và cách xuống dòng; giữ màu ngữ nghĩa ở thời gian sắp hết, đúng/sai, chưa lưu được. Chưa thay quy tắc thi/nộp/chấm. |
| Chia sẻ `/share/[id]` | Xem/in/tải đề, có thể cho tạo bản sao; khác link làm bài. | Phải tiếp tục phân biệt xem, tải, sao chép với quyền sửa và nộp bài. Giấy A4 trắng không phải lỗi dark mode. Chưa gộp route chia sẻ với phòng thi. |
| Link cũ `/test/[id]` | Mã hiện tại hiển thị thông báo không hỗ trợ link thi cũ và dẫn về trang chủ; không tự mở bài giao tương ứng. | Tên “Chuyển Tiếp Phòng Thi Chuẩn v3.1” có thể gây hiểu nhầm là đang chuyển tự động. Giữ cơ chế chặn an toàn, chỉ cân nhắc đổi câu chữ sau duyệt. |
| `/login` | Có đăng nhập và đổi mật khẩu lần đầu. | Nội dung “Chuẩn GDPT 2018”, “v3.1” và thông tin cơ sở dữ liệu nên được rà cùng thông điệp toàn ứng dụng; chưa coi những câu quảng bá này là chứng nhận chuyên môn/bảo mật đã nghiệm thu. |

## Vì sao chỉ đồng bộ màu chưa đủ?

1. **Nguồn dữ liệu và ý nghĩa khối hiển thị:** số ghi cứng, dữ liệu cũ, dữ liệu thật nhưng khác phạm vi đang đặt gần nhau.
2. **Cấu trúc và điều hướng:** trang thêm sau tự dựng header/form; chức năng phát triển tiếp nhưng khối giới thiệu cũ vẫn mount.
3. **Quy tắc giao diện:** đã có token màu và class nút/dialog chung, nhưng còn nhiều mã màu, font, bo góc, khoảng cách lặp trực tiếp trong từng trang. Ghi trực tiếp CSS không tự là lỗi; vấn đề là chưa có một quy tắc vai trò được dùng nhất quán.
4. **Nội dung sản phẩm:** tên kỹ thuật, tên phiên bản và lời hứa trước đây được giữ như nội dung chính.
5. **Trạng thái tương tác:** tải/rỗng/lỗi/xác nhận chưa cùng cách trình bày. Đổi màu không sửa được việc một lỗi chỉ hiện trong console.

## Hướng hợp lý để chốt trước khi sửa tiếp

- Chốt từng mục admin thật sự cần cho nhóm nhỏ: **Tài khoản**, **Cấp khóa cho giáo viên**, **Hoạt động AI**. Đây là đề xuất tổ chức, chưa đổi route/menu.
- Với mỗi thẻ/chỉ số: ghi rõ dữ liệu lấy từ đâu, phạm vi ai, thời gian nào, trạng thái rỗng/lỗi là gì. Thẻ thiếu căn cứ chưa đưa lên làm chỉ số vận hành.
- Lập quyết định giữ/đổi tên/hợp nhất/ẩn cho các mảnh cũ cụ thể: pool bảy khóa, popup Thư ký Beta, thuật ngữ DB và link thi cũ. Đối chiếu quyền và hành vi trước khi bỏ bất kỳ thứ gì.
- Sau đó mới làm khung trang chung và các thành phần quản lý chung. Giữ editor/A4 và phòng thi có bố cục phù hợp công việc của chúng.
- Kiểm bằng nhiệm vụ thực tế trên điện thoại: tìm giáo viên, biết người đó có dùng AI được không, cấp/thu hồi có xác nhận, nhận ra lỗi, tìm bài giao và vào đúng link. Không lấy “cùng màu” làm đủ tiêu chí.

## Giới hạn và phần cần bạn đối chiếu

Đề mẫu `tests/fixtures/pilot/toan6-bay-dang.json` đang có một số chuỗi tiếng Việt bị lỗi mã hóa ngay trong JSON, nên bản sao thử ở editor/chia sẻ cũng hiện các chuỗi đó. Đây là vấn đề nội dung mẫu nguồn, không phải do đổi font/CSS; chưa sửa fixture chung hay tự biến đổi tài liệu giáo viên. Không lấy việc nhãn giao diện đọc đúng làm bằng chứng mọi nội dung đề đã đúng mã hóa.

Đây là phân tích dựa trên mã hiện tại và giao diện DB thử, không phải truy dựng chắc chắn lịch sử từng thiết kế. “Cũ/mới chồng nhau” được chứng minh ở các ví dụ cụ thể; các đề xuất còn lại là nhận định, không phải yêu cầu đã duyệt. Chưa kiểm provider thật, chưa kiểm toàn bộ lỗi mạng/quyền trên admin, chưa thay khung admin hay model dữ liệu.

Bạn có thể đối chiếu trước hết ba ý: **pool bảy khóa có còn cần một mục riêng không; admin nên ưu tiên quản lý người dùng/cấp khóa/hoạt động ra sao; popup Thư ký giới thiệu cũ có còn nên xuất hiện cùng drawer hay không.** Chỉ sau khi thống nhất mới chuyển những mục đó sang kế hoạch sửa chức năng/cấu trúc.
