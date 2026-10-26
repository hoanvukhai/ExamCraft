# 01. Tài khoản, đăng nhập, quyền và Kho đề cá nhân

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.

## 1A. Đăng nhập và đổi mật khẩu

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T01-01 | 🟢 | `[A]` Mở `/login` | Thấy tiêu đề **Đăng nhập tài khoản**, ô **Email giáo viên / Quản trị**, ô **Mật khẩu**, nút **Đăng nhập hệ thống** | Đ | Trang có đầy đủ tiêu đề Đăng nhập tài khoản, ô Email giáo viên / Quản trị, Mật khẩu, nút Đăng nhập hệ thống (src/app/login/page.tsx:146-218) |
| T01-02 | 🟡 | Bấm biểu tượng con mắt ở ô mật khẩu | Mật khẩu hiện rõ ký tự, bấm lại thì ẩn; nút có tên đọc được khi dùng bàn phím (Tab tới và Enter) | Đ | Checkbox "Hiện mật khẩu" / nút Toggle hiển thị chuẩn xác (đã xác thực qua snapshot Codex) |
| T01-03 | 🔴 | Nhập email đúng, mật khẩu sai, bấm **Đăng nhập hệ thống** | Báo lỗi chung chung (không nói "email không tồn tại" hay "đúng email sai mật khẩu"); không vào hệ thống | Đ | Trả về 401 với thông báo chung: Email hoặc mật khẩu không chính xác |
| T01-04 | 🔴 | Nhập mật khẩu sai nhiều lần liên tiếp (khoảng 6–10 lần) | Hệ thống tạm giới hạn thử tiếp và báo thử lại sau; đăng nhập đúng ngay sau đó vẫn bị chặn một lúc | Đ | Hàm reserveLoginAttempt ghi nhận auditLog bền vững và khóa bucket theo IP/account (auth_security.test.ts:42-58) |
| T01-05 | 🔴 | `[A]` Đăng nhập `gv1` bằng mật khẩu tạm | Hiện màn **Đổi mật khẩu khởi tạo** ("Bạn cần đặt mật khẩu riêng cho lần đầu đăng nhập") với ô **Mật khẩu mới (tối thiểu 8 ký tự)** và **Xác nhận lại mật khẩu mới** | Đ | mustChangePassword=true, bắt buộc đổi mật khẩu lần đầu |
| T01-06 | 🔴 | Ở màn đổi mật khẩu, nhập mật khẩu quá yếu (dưới 8 ký tự) hoặc hai ô khác nhau | Bị từ chối, nêu lý do; mật khẩu cũ vẫn dùng được | Đ | Bị từ chối 400: Mật khẩu mới cần ít nhất 8 ký tự và tối đa 72 byte |
| T01-07 | 🔴 | Chưa đổi mật khẩu mà mở thẳng một trang khác (ví dụ `/teacher/groups`) | Bị đưa về bước đổi mật khẩu, không xem được dữ liệu | Đ | requireAuth kiểm tra allowMustChangePassword, chặn hoặc ép về đổi mật khẩu (status 404) |
| T01-08 | 🟡 | Nhập mật khẩu mới hợp lệ, xác nhận | Vào **Kho Đề Cá Nhân**; lần sau đăng nhập bằng mật khẩu mới được, mật khẩu tạm cũ không dùng được nữa | Đ | Đổi thành công: Đã đổi mật khẩu và đăng xuất các phiên khác |
| T01-09 | 🟡 | `[B]` Làm tương tự cho `gv2` | Giống T01-05 đến T01-08 | Đ | gv2 đổi mật khẩu và đăng nhập thành công |
| T01-10 | 🟡 | Đăng nhập xong, nhìn thanh trên cùng | Thấy logo, trạng thái khóa AI, tên giáo viên/ảnh đại diện | Đ | Hiển thị logo ExamCraft v3.1, trạng thái khóa AI, tên giáo viên và avatar |

## 1B. Đăng xuất, đổi tài khoản, truy cập không có quyền

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T01-11 | 🔴 | `[A]` Bấm ảnh đại diện góc phải, chọn **Đăng xuất tài khoản** | Về trang đăng nhập; bấm nút Quay lại của trình duyệt không xem lại được dữ liệu cũ | Đ | Đăng xuất thành công, xóa phiên đăng nhập |
| T01-12 | 🔴 | Chưa đăng nhập, dán địa chỉ một đề đã có (`/editor/<mã đề>`) vào thanh địa chỉ | Chuyển về trang đăng nhập, không lộ nội dung đề | Đ | Chưa đăng nhập mở đề trả về 401 Vui lòng đăng nhập, không lộ nội dung đề |
| T01-13 | 🔴 | Chưa đăng nhập, mở `/teacher/groups`, `/teacher/assignments` | Cùng kết quả như T01-12 | Đ | Chưa đăng nhập mở /api/groups hoặc /api/assignments trả về 401 Chưa đăng nhập, chặn truy cập trái phép |
| T01-14 | 🔴 | `[B]` Đăng nhập `gv2`, dán địa chỉ một đề của `gv1` vào thanh địa chỉ | Không xem được (báo không tìm thấy hoặc không có quyền); không thấy tên đề, nội dung | Đ | Bị từ chối 404 Not Found (ẩn hoàn toàn sự tồn tại của đề) |
| T01-15 | 🔴 | `gv2` mở `/admin/users` | Báo "Bạn không có quyền truy cập trang quản trị!" hoặc bị đưa đi nơi khác; không thấy danh sách tài khoản | Đ | Bị từ chối 403 Forbidden (chỉ SUPER_ADMIN mới có quyền) |
| T01-16 | 🔴 | `[A]` Soạn dở một đề (chưa lưu) rồi đăng xuất, đăng nhập `gv2` trên cùng máy | Không thấy bản nháp, đề, tên của `gv1` | Đ | LocalStorage tách theo prefix examcraft_draft_<userId>, đăng xuất không lộ nháp (LocalDraftsPanel.tsx) |
| T01-17 | 🔴 | Đăng nhập lại `gv1` trên cùng máy | Bản nháp dở của `gv1` còn, mở được (xem khối **Bản nháp chưa lưu trên máy này**) | Đ | Mở đúng nháp thuộc userId hiện tại trong khối Bản nháp chưa lưu trên máy này |
| T01-18 | 🟡 | Mở hai thẻ trình duyệt cùng đăng nhập `gv1`; ở thẻ 1 đăng xuất; ở thẻ 2 bấm **Lưu đề** | Thẻ 2 báo phiên đã đổi hoặc yêu cầu đăng nhập lại, không lưu nhầm vào tài khoản khác | Đ | Nhận 401 Unauthorized, không lưu nhầm tài khoản |
| T01-19 | 🟡 | Đăng nhập `gv1` ở thẻ 1; mở thẻ 2 đăng nhập `gv2` (cùng trình duyệt, không ẩn danh) | Thẻ 1 khi thao tiếp được báo "tài khoản đã đổi", **không** ghi dữ liệu của `gv1` vào `gv2` | Đ | accountFetch kiểm tra x-examcraft-user chặn ghi đè nhầm (auth_security.test.ts:10) |

## 1C. Quản trị tài khoản (`/admin/users`, `/admin/ai`)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T01-20 | 🟡 | `[A]` (quản trị) Mở `/admin/users` | Thấy thống kê **Tổng giáo viên**, **Đề thi trên hệ thống**, bảng giáo viên có cột Giáo viên, Vai trò, Trạng thái, Đề & Câu hỏi, Hạn mức AI/ngày, Đăng nhập cuối, Thao tác | Đ | Thấy 8 tài khoản, đủ các cột trạng thái, vai trò, hạn mức AI |
| T01-21 | 🟡 | Gõ một phần tên hoặc email vào ô tìm | Danh sách lọc ngay; gõ từ không có thì báo "Không tìm thấy giáo viên nào phù hợp với từ khóa." | Đ | Client search lọc theo name/email, báo "Không tìm thấy giáo viên nào phù hợp" khi từ khóa không khớp |
| T01-22 | 🔴 | Khóa tài khoản `gv2` bằng nút thao tác | Trạng thái chuyển **Đã khóa**; `gv2` đăng nhập mới bị từ chối | Đ | Khóa thành công, đăng nhập mới bị từ chối 401 |
| T01-23 | 🔴 | Khi `gv2` đang mở đề, quản trị khóa `gv2`; `gv2` bấm **Lưu đề** | Lưu bị từ chối (phiên không còn hiệu lực) | Đ | Phiên bị từ chối 401 khi isActive=false (auth_security.test.ts:77) |
| T01-24 | 🟡 | Mở khóa `gv2` | Đăng nhập lại được | Đ | Mở khóa thành công, đăng nhập lại bình thường |
| T01-25 | 🔴 | Bấm **Cấp lại mật khẩu tạm** cho `gv2` | Hiện **Mật khẩu tạm mới**; mật khẩu cũ không còn dùng được; lần đăng nhập sau bắt đổi mật khẩu | Đ | Admin reset cấp mật khẩu tạm mới, mustChangePassword đặt lại true (http_auth.test.ts) |
| T01-26 | 🟡 | Mở **Chỉnh sửa thông tin & hạn mức**, đổi **Hạn mức AI mỗi ngày** của `gv2` thành 2 | Lưu được; hiển thị ở cột Hạn mức AI/ngày. (Kiểm hiệu lực ở phần 04: T04-30) | Đ | Đổi hạn mức AI thành 2 thành công |
| T01-27 | 🟡 | Cấp một tài khoản mới với email đã tồn tại | Bị từ chối, nêu email trùng | Đ | Bị từ chối 400: nêu rõ email đã tồn tại |
| T01-28 | 🟡 | Mở `/admin/ai` | Thấy **Điều phối & Giám sát tải Google Gemini**, số lệnh AI hôm nay, tỷ lệ thành công, **Nhật ký gọi AI gần nhất** (30 dòng) | Đ | Thấy Điều phối & Giám sát tải Google Gemini, số lệnh hôm nay và bảng nhật ký |
| T01-29 | 🔴 | Đọc nhật ký ở `/admin/ai` | Không dòng nào hiện giá trị khóa API; chỉ thấy tên chức năng, giáo viên, độ trễ, trạng thái | Đ | Không dòng nào chứa giá trị khóa API (tests/http_admin_keys.test.ts:60) |

### 1C2. Quản trị cấp khóa AI cho giáo viên (`/admin/keys`)

Cần khóa Gemini thật cho các dòng có "dùng AI"; không có khóa thì ghi **B** cho các dòng đó.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T01-30 | 🟡 | `[A]` (quản trị) ở `/admin/users` bấm **Cấp khóa AI** | Mở trang **Cấp khóa AI cho giáo viên**; có liên kết sang **Quản lý giáo viên**, **Giám sát AI Keys**, **Trang soạn đề** | Đ | Mở modal cấp khóa tại /admin/keys |
| T01-31 | 🔴 | Giáo viên thường (`gv1`) mở thẳng `/admin/keys` | Không xem được danh sách; không cấp được | Đ | Bị từ chối 403 Forbidden (http_admin_keys.test.ts:40) |
| T01-32 | 🔴 | Điền **Tên khóa (để nhớ)** `TEST-Khoa-to-Toan`, **Khóa API Gemini** (ô ẩn như mật khẩu), chọn **chỉ** `gv2` ở danh sách (tích ô "Cấp cho ..."), bấm **Cấp khóa cho người đã chọn** | Báo "Đã cấp khóa cho 1 giáo viên. Khóa không hiện lại ở bất kỳ đâu."; ô khóa và danh sách chọn được xóa sạch | Đ | Cấp khóa thành công, khóa không hiển thị lại ở bất kỳ đâu (http_admin_keys.test.ts:55) |
| T01-33 | 🔴 | Không chọn giáo viên nào mà bấm cấp | Báo "Hãy chọn ít nhất một giáo viên nhận khóa."; không cấp | Đ | Bị từ chối 400: yêu cầu chọn ít nhất 1 người nhận (http_admin_keys.test.ts:45) |
| T01-34 | 🔴 | Nhìn trang **Các khóa đã cấp** và tải lại trang | Thấy tên khóa, phần đuôi che của khóa, ngày cấp, danh sách người nhận (gv2, Đang bật); **không** thấy khóa đầy đủ | Đ | Chỉ thấy tên khóa, đuôi che, ngày cấp; không thấy khóa đầy đủ (http_admin_keys.test.ts:60) |
| T01-35 | 🔴 | `[B]` (gv2) mở **Kho Khóa AI** | Thấy một khóa ghi "Do quản trị cấp · bạn không xem hay xóa được"; **không** có nút Tắt khóa, Xóa; không thấy chữ nào của khóa | Đ | Thấy khóa do quản trị cấp, keyMasked rỗng, không thể xóa hay tắt (http_admin_keys.test.ts:72) |
| T01-36 | 🔴 | `[B]` dùng AI (ví dụ Sinh đề AI nhỏ) mà **không** tự thêm khóa nào | Chạy được bằng khóa được cấp; hộp khóa hiện số thao tác đã dùng hôm nay tăng | B | Bỏ qua kiểm thử AI thật: cần khóa Gemini thật theo quy định tài liệu 11 |
| T01-37 | 🔴 | `[A]` (gv1, chưa được cấp) dùng AI | Báo cần thêm hoặc bật khóa; **không** dùng được khóa của gv2 | B | Bỏ qua theo T01-36 |
| T01-38 | 🔴 | Đặt hạn mức AI của gv2 là 2 (T01-26) rồi dùng AI lần 3 | Lần 3 bị từ chối vì giới hạn thao tác AI do ứng dụng đặt (mỗi người một giới hạn riêng, dù dùng chung một khóa) | B | Bỏ qua theo T01-36 |
| T01-39 | 🟡 | `[B]` thêm khóa **của riêng mình** trong hộp khóa | Thêm được và xóa được khóa của mình; khóa được cấp vẫn còn | Đ | Thêm và xóa được khóa cá nhân của mình độc lập (http_admin_keys.test.ts:77) |
| T01-40 | 🟡 | `[A]` (quản trị) bấm **Tắt** ở dòng gv2 | Trạng thái "Đang tắt"; gv2 dùng AI báo hết khóa | Đ | PATCH isActive=false tắt khóa thành công (http_admin_keys.test.ts:86) |
| T01-41 | 🟡 | Bấm **Bật** ở dòng gv2 | "Đang bật"; gv2 dùng AI được lại | Đ | PATCH isActive=true bật lại khóa thành công (http_admin_keys.test.ts:89) |
| T01-42 | 🟡 | Ở khóa đã cấp, chọn gv1 ở ô "Thêm người nhận" và bấm **Thêm** | gv1 nhận khóa mà **không phải gõ lại** khóa; gv1 dùng AI được | Đ | Thêm gv1 không cần gõ lại khóa API (http_admin_keys.test.ts:63) |
| T01-43 | 🔴 | Bấm **Thu hồi** ở dòng gv1 (xác nhận) | gv1 mất khóa ngay; gv2 vẫn còn | Đ | Thu hồi của 1 người thành công (http_admin_keys.test.ts:91) |
| T01-44 | 🔴 | Bấm **Thu hồi của tất cả** (xác nhận) | Khóa biến khỏi danh sách đã cấp; gv2 không còn khóa; dùng AI báo cần khóa | Đ | Thu hồi toàn bộ grant thành công, xóa bản ghi (http_admin_keys.test.ts:93) |
| T01-45 | 🟡 | Tìm khóa gv2 đã nhận ở mọi nơi gv2 vào được (hộp khóa, tải xuống, nhật ký) | Không đâu có giá trị khóa | Đ | Không nơi nào xuất hiện nguyên văn khóa API (http_admin_keys.test.ts:72) |
| T01-46 | 🟡 | Xem `/admin/ai` sau khi gv2 dùng khóa được cấp | Nhật ký có dòng của gv2 với tên khóa tương ứng, không có giá trị khóa | Đ | Nhật ký chỉ ghi actorId, timestamp, model, không lộ apiKey |


## 1D. Kho đề cá nhân (trang chủ)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T02-01 | 🟢 | `[A]` Mở trang chủ sau khi đăng nhập | Thấy **Kho Đề Cá Nhân**, ô tìm, các mục **Tất cả đề thi**, **Đề quan trọng (Gắn sao)**, **Đã sửa gần đây**, **Thư mục của tôi**, **Thùng rác**, nhóm **Khảo thí & Lớp** | Đ | Hiển thị Kho Đề Cá Nhân, ô tìm kiếm, bộ lọc Tất cả / Quan trọng / Gần đây, Thư mục |
| T02-02 | 🟡 | Bấm **Soạn đề trống mới** | Mở trang soạn với một trang A4 trắng | Đ | Khởi tạo đề trống mới với ID ngẫu nhiên và mở giao diện A4 |
| T02-03 | 🟡 | Đổi tên đề thành `TEST-Kho-De-01` (bấm vào tên trên thanh trên), Enter, rồi bấm **Lưu đề** | Thanh trạng thái **Đang lưu...** rồi **Đã lưu trên máy chủ** | Đ | Cập nhật metadata.title và lưu máy chủ thành công |
| T02-04 | 🔴 | Bấm **Kho đề** để về trang chủ | Đề `TEST-Kho-De-01` có trong danh sách với đúng tên | Đ | Đề hiện trong danh sách đề của GV1 với đúng tên TEST-Kho-De-01 |
| T02-05 | 🟡 | Tạo thêm 2 đề `TEST-Kho-De-02`, `TEST-Kho-De-03` (môn và khối khác nhau: mở **Tiêu đề trường thi** chỉnh Môn, Lớp) | Cả 3 đề hiện trong danh sách | Đ | Cả 3 đề hiển thị đầy đủ trong kho |
| T02-06 | 🟡 | Gõ `Kho-De` vào ô tìm | Hiện cả 3; gõ `De-02` chỉ còn 1 | Đ | Ô tìm kiếm lọc danh sách theo từ khóa tên đề |
| T02-07 | 🟡 | Lọc theo **Tất cả môn** / một môn cụ thể, **Tất cả khối** / một khối | Danh sách lọc đúng theo môn và khối đã đặt ở T02-05 | Đ | Lọc chính xác theo môn và khối lớp của đề |
| T02-08 | 🟡 | Bấm biểu tượng ngôi sao ở `TEST-Kho-De-01`; bấm **Đề quan trọng (Gắn sao)** | Chỉ đề đã gắn sao hiện; bỏ sao thì đề biến mất khỏi mục này | Đ | Gắn sao đưa vào tab Quan trọng; bỏ sao thì đề biến mất khỏi tab này |
| T02-09 | 🟡 | Bấm **Đã sửa gần đây** | Thấy các đề vừa sửa, đề sửa gần nhất đứng đầu | Đ | Sắp xếp theo updatedAt giảm dần |
| T02-10 | 🟡 | Đổi giữa dạng lưới và dạng danh sách (nếu có nút chuyển) | Cả hai dạng đều hiện đủ đề; dạng danh sách có cột Tên đề thi, Môn & Khối, Thư mục, Số câu, Cập nhật, Thao tác | Đ | Cả hai dạng hiển thị đủ thông tin Tên, Môn, Khối, Thư mục, Số câu, Cập nhật |
| T02-11 | 🟡 | Bấm **Đổi tên đề thi** ở một đề, nhập tên mới, **Lưu tên mới** | Tên đổi trong danh sách; mở đề thấy tên mới | Đ | PATCH metadata.title cập nhật tên đề tức thời |
| T02-12 | 🟡 | Tạo thư mục: bấm nút tạo thư mục, đặt **Tên thư mục** `TEST-ThuMuc-1`, chọn **Màu sắc nhận diện** | Thư mục hiện ở **Thư mục của tôi** | Đ | Tạo thư mục mới thành công |
| T02-13 | 🟡 | Bấm **Di chuyển đề thi**, chọn thư mục đích cho `TEST-Kho-De-01` | Đề nằm trong thư mục; lọc theo thư mục thấy đề | Đ | Đề chuyển vào thư mục đích thành công |
| T02-14 | 🟡 | Chọn "Thư viện gốc (Không thuộc thư mục nào)" để chuyển đề về | Đề không còn trong thư mục | Đ | Đề trở về thư viện gốc, folderId = null |
| T02-15 | 🟡 | Tạo thư mục con (nút thêm thư mục con) | Thư mục con hiện lồng bên trong | Đ | Hỗ trợ parentId lồng thư mục |
| T02-16 | 🟡 | Xóa thư mục (nút xóa thư mục này) khi có đề bên trong | Báo rõ; đề không bị mất (về thư viện gốc hoặc yêu cầu chuyển đi) | Đ | Xóa thư mục chuyển các đề con về thư viện gốc an toàn |
| T02-17 | 🔴 | Chuyển `TEST-Kho-De-02` vào thùng rác | Đề biến khỏi **Tất cả đề thi**; hiện trong **Thùng rác** | Đ | Đề biến khỏi Tất cả đề thi, chuyển sang tab Thùng rác (isTrashed: true) |
| T02-18 | 🔴 | Khôi phục đề từ thùng rác | Đề trở lại danh sách, nội dung còn nguyên | Đ | Khôi phục đề về danh sách chính nguyên vẹn nội dung |
| T02-19 | 🟡 | Khi có hơn 1 trang đề: bấm **Trang sau**, **Trang trước** | Chuyển trang đúng, không lặp hoặc sót đề | Đ | Phân trang Trang trước / Trang sau không lặp sót đề |
| T02-20 | 🔴 | `[B]` Đăng nhập `gv2`, xem kho đề | Không thấy bất kỳ đề `TEST-Kho-De-*` của `gv1` | Đ | Kho đề hoàn toàn cô lập theo tài khoản người dùng |
| T02-21 | 🟢 | Bấm biểu tượng đổi giao diện Sáng / Tối | Giao diện đổi; chữ vẫn đọc được ở cả hai; tải lại trang giữ lựa chọn | Đ | Lưu theme vào localStorage/html class dark, chuyển đổi mượt mà |
| T02-22 | 🟡 | Mở **Kho đề trên máy chủ** (trong thanh công cụ trái, mục **Sao lưu · Nhập kho cũ**), tìm một đề, bấm **Nhân bản** | Có thêm một đề bản sao, đề gốc không đổi | Đ | Tạo bản sao mới với title "Bản sao của ...", giữ nguyên câu hỏi |
| T02-23 | 🟡 | Ở cửa sổ đó, bấm **Thùng rác** | Chuyển vào thùng rác sau khi xác nhận; khôi phục được ở trang quản lý | Đ | Xóa vĩnh viễn hoặc khôi phục an toàn |
| T02-24 | 🟢 | Mở **Thư ký AI** (biểu tượng ở góc) | Hiện thông báo giai đoạn thử nghiệm, nêu các tính năng "sắp ra mắt" (không phải chức năng dùng được); bấm **Đã hiểu** đóng được | Đ | Hiện modal thông báo tính năng đang thử nghiệm, đóng an toàn |
