# 01. Tài khoản, đăng nhập, quyền và Kho đề cá nhân

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.

## 1A. Đăng nhập và đổi mật khẩu

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T01-01 | 🟢 | `[A]` Mở `/login` | Thấy tiêu đề **Đăng nhập tài khoản**, ô **Email giáo viên / Quản trị**, ô **Mật khẩu**, nút **Đăng nhập hệ thống** | | |
| T01-02 | 🟡 | Bấm biểu tượng con mắt ở ô mật khẩu | Mật khẩu hiện rõ ký tự, bấm lại thì ẩn; nút có tên đọc được khi dùng bàn phím (Tab tới và Enter) | | |
| T01-03 | 🔴 | Nhập email đúng, mật khẩu sai, bấm **Đăng nhập hệ thống** | Báo lỗi chung chung (không nói "email không tồn tại" hay "đúng email sai mật khẩu"); không vào hệ thống | | |
| T01-04 | 🔴 | Nhập mật khẩu sai nhiều lần liên tiếp (khoảng 6–10 lần) | Hệ thống tạm giới hạn thử tiếp và báo thử lại sau; đăng nhập đúng ngay sau đó vẫn bị chặn một lúc | | |
| T01-05 | 🔴 | `[A]` Đăng nhập `gv1` bằng mật khẩu tạm | Hiện màn **Đổi mật khẩu khởi tạo** ("Bạn cần đặt mật khẩu riêng cho lần đầu đăng nhập") với ô **Mật khẩu mới (tối thiểu 8 ký tự)** và **Xác nhận lại mật khẩu mới** | | |
| T01-06 | 🔴 | Ở màn đổi mật khẩu, nhập mật khẩu quá yếu (dưới 8 ký tự) hoặc hai ô khác nhau | Bị từ chối, nêu lý do; mật khẩu cũ vẫn dùng được | | |
| T01-07 | 🔴 | Chưa đổi mật khẩu mà mở thẳng một trang khác (ví dụ `/teacher/groups`) | Bị đưa về bước đổi mật khẩu, không xem được dữ liệu | | |
| T01-08 | 🟡 | Nhập mật khẩu mới hợp lệ, xác nhận | Vào **Kho Đề Cá Nhân**; lần sau đăng nhập bằng mật khẩu mới được, mật khẩu tạm cũ không dùng được nữa | | |
| T01-09 | 🟡 | `[B]` Làm tương tự cho `gv2` | Giống T01-05 đến T01-08 | | |
| T01-10 | 🟡 | Đăng nhập xong, nhìn thanh trên cùng | Thấy logo, trạng thái khóa AI, tên giáo viên/ảnh đại diện | | |

## 1B. Đăng xuất, đổi tài khoản, truy cập không có quyền

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T01-11 | 🔴 | `[A]` Bấm ảnh đại diện góc phải, chọn **Đăng xuất tài khoản** | Về trang đăng nhập; bấm nút Quay lại của trình duyệt không xem lại được dữ liệu cũ | | |
| T01-12 | 🔴 | Chưa đăng nhập, dán địa chỉ một đề đã có (`/editor/<mã đề>`) vào thanh địa chỉ | Chuyển về trang đăng nhập, không lộ nội dung đề | | |
| T01-13 | 🔴 | Chưa đăng nhập, mở `/teacher/groups`, `/teacher/assignments` | Cùng kết quả như T01-12 | | |
| T01-14 | 🔴 | `[B]` Đăng nhập `gv2`, dán địa chỉ một đề của `gv1` vào thanh địa chỉ | Không xem được (báo không tìm thấy hoặc không có quyền); không thấy tên đề, nội dung | | |
| T01-15 | 🔴 | `gv2` mở `/admin/users` | Báo "Bạn không có quyền truy cập trang quản trị!" hoặc bị đưa đi nơi khác; không thấy danh sách tài khoản | | |
| T01-16 | 🔴 | `[A]` Soạn dở một đề (chưa lưu) rồi đăng xuất, đăng nhập `gv2` trên cùng máy | Không thấy bản nháp, đề, tên của `gv1` | | |
| T01-17 | 🔴 | Đăng nhập lại `gv1` trên cùng máy | Bản nháp dở của `gv1` còn, mở được (xem khối **Bản nháp chưa lưu trên máy này**) | | |
| T01-18 | 🟡 | Mở hai thẻ trình duyệt cùng đăng nhập `gv1`; ở thẻ 1 đăng xuất; ở thẻ 2 bấm **Lưu đề** | Thẻ 2 báo phiên đã đổi hoặc yêu cầu đăng nhập lại, không lưu nhầm vào tài khoản khác | | |
| T01-19 | 🟡 | Đăng nhập `gv1` ở thẻ 1; mở thẻ 2 đăng nhập `gv2` (cùng trình duyệt, không ẩn danh) | Thẻ 1 khi thao tiếp được báo "tài khoản đã đổi", **không** ghi dữ liệu của `gv1` vào `gv2` | | |

## 1C. Quản trị tài khoản (`/admin/users`, `/admin/ai`)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T01-20 | 🟡 | `[A]` (quản trị) Mở `/admin/users` | Thấy thống kê **Tổng giáo viên**, **Đề thi trên hệ thống**, bảng giáo viên có cột Giáo viên, Vai trò, Trạng thái, Đề & Câu hỏi, Hạn mức AI/ngày, Đăng nhập cuối, Thao tác | | |
| T01-21 | 🟡 | Gõ một phần tên hoặc email vào ô tìm | Danh sách lọc ngay; gõ từ không có thì báo "Không tìm thấy giáo viên nào phù hợp với từ khóa." | | |
| T01-22 | 🔴 | Khóa tài khoản `gv2` bằng nút thao tác | Trạng thái chuyển **Đã khóa**; `gv2` đăng nhập mới bị từ chối | | |
| T01-23 | 🔴 | Khi `gv2` đang mở đề, quản trị khóa `gv2`; `gv2` bấm **Lưu đề** | Lưu bị từ chối (phiên không còn hiệu lực) | | |
| T01-24 | 🟡 | Mở khóa `gv2` | Đăng nhập lại được | | |
| T01-25 | 🔴 | Bấm **Cấp lại mật khẩu tạm** cho `gv2` | Hiện **Mật khẩu tạm mới**; mật khẩu cũ không còn dùng được; lần đăng nhập sau bắt đổi mật khẩu | | |
| T01-26 | 🟡 | Mở **Chỉnh sửa thông tin & hạn mức**, đổi **Hạn mức AI mỗi ngày** của `gv2` thành 2 | Lưu được; hiển thị ở cột Hạn mức AI/ngày. (Kiểm hiệu lực ở phần 04: T04-30) | | |
| T01-27 | 🟡 | Cấp một tài khoản mới với email đã tồn tại | Bị từ chối, nêu email trùng | | |
| T01-28 | 🟡 | Mở `/admin/ai` | Thấy **Điều phối & Giám sát tải Google Gemini**, số lệnh AI hôm nay, tỷ lệ thành công, **Nhật ký gọi AI gần nhất** (30 dòng) | | |
| T01-29 | 🔴 | Đọc nhật ký ở `/admin/ai` | Không dòng nào hiện giá trị khóa API; chỉ thấy tên chức năng, giáo viên, độ trễ, trạng thái | | |

## 1D. Kho đề cá nhân (trang chủ)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T02-01 | 🟢 | `[A]` Mở trang chủ sau khi đăng nhập | Thấy **Kho Đề Cá Nhân**, ô tìm, các mục **Tất cả đề thi**, **Đề quan trọng (Gắn sao)**, **Đã sửa gần đây**, **Thư mục của tôi**, **Thùng rác**, nhóm **Khảo thí & Lớp** | | |
| T02-02 | 🟡 | Bấm **Soạn đề trống mới** | Mở trang soạn với một trang A4 trắng | | |
| T02-03 | 🟡 | Đổi tên đề thành `TEST-Kho-De-01` (bấm vào tên trên thanh trên), Enter, rồi bấm **Lưu đề** | Thanh trạng thái **Đang lưu...** rồi **Đã lưu trên máy chủ** | | |
| T02-04 | 🔴 | Bấm **Kho đề** để về trang chủ | Đề `TEST-Kho-De-01` có trong danh sách với đúng tên | | |
| T02-05 | 🟡 | Tạo thêm 2 đề `TEST-Kho-De-02`, `TEST-Kho-De-03` (môn và khối khác nhau: mở **Tiêu đề trường thi** chỉnh Môn, Lớp) | Cả 3 đề hiện trong danh sách | | |
| T02-06 | 🟡 | Gõ `Kho-De` vào ô tìm | Hiện cả 3; gõ `De-02` chỉ còn 1 | | |
| T02-07 | 🟡 | Lọc theo **Tất cả môn** / một môn cụ thể, **Tất cả khối** / một khối | Danh sách lọc đúng theo môn và khối đã đặt ở T02-05 | | |
| T02-08 | 🟡 | Bấm biểu tượng ngôi sao ở `TEST-Kho-De-01`; bấm **Đề quan trọng (Gắn sao)** | Chỉ đề đã gắn sao hiện; bỏ sao thì đề biến mất khỏi mục này | | |
| T02-09 | 🟡 | Bấm **Đã sửa gần đây** | Thấy các đề vừa sửa, đề sửa gần nhất đứng đầu | | |
| T02-10 | 🟡 | Đổi giữa dạng lưới và dạng danh sách (nếu có nút chuyển) | Cả hai dạng đều hiện đủ đề; dạng danh sách có cột Tên đề thi, Môn & Khối, Thư mục, Số câu, Cập nhật, Thao tác | | |
| T02-11 | 🟡 | Bấm **Đổi tên đề thi** ở một đề, nhập tên mới, **Lưu tên mới** | Tên đổi trong danh sách; mở đề thấy tên mới | | |
| T02-12 | 🟡 | Tạo thư mục: bấm nút tạo thư mục, đặt **Tên thư mục** `TEST-ThuMuc-1`, chọn **Màu sắc nhận diện** | Thư mục hiện ở **Thư mục của tôi** | | |
| T02-13 | 🟡 | Bấm **Di chuyển đề thi**, chọn thư mục đích cho `TEST-Kho-De-01` | Đề nằm trong thư mục; lọc theo thư mục thấy đề | | |
| T02-14 | 🟡 | Chọn "Thư viện gốc (Không thuộc thư mục nào)" để chuyển đề về | Đề không còn trong thư mục | | |
| T02-15 | 🟡 | Tạo thư mục con (nút thêm thư mục con) | Thư mục con hiện lồng bên trong | | |
| T02-16 | 🟡 | Xóa thư mục (nút xóa thư mục này) khi có đề bên trong | Báo rõ; đề không bị mất (về thư viện gốc hoặc yêu cầu chuyển đi) | | |
| T02-17 | 🔴 | Chuyển `TEST-Kho-De-02` vào thùng rác | Đề biến khỏi **Tất cả đề thi**; hiện trong **Thùng rác** | | |
| T02-18 | 🔴 | Khôi phục đề từ thùng rác | Đề trở lại danh sách, nội dung còn nguyên | | |
| T02-19 | 🟡 | Khi có hơn 1 trang đề: bấm **Trang sau**, **Trang trước** | Chuyển trang đúng, không lặp hoặc sót đề | | |
| T02-20 | 🔴 | `[B]` Đăng nhập `gv2`, xem kho đề | Không thấy bất kỳ đề `TEST-Kho-De-*` của `gv1` | | |
| T02-21 | 🟢 | Bấm biểu tượng đổi giao diện Sáng / Tối | Giao diện đổi; chữ vẫn đọc được ở cả hai; tải lại trang giữ lựa chọn | | |
| T02-22 | 🟡 | Mở **Kho đề trên máy chủ** (trong thanh công cụ trái, mục **Sao lưu · Nhập kho cũ**), tìm một đề, bấm **Nhân bản** | Có thêm một đề bản sao, đề gốc không đổi | | |
| T02-23 | 🟡 | Ở cửa sổ đó, bấm **Thùng rác** | Chuyển vào thùng rác sau khi xác nhận; khôi phục được ở trang quản lý | | |
| T02-24 | 🟢 | Mở **Thư ký AI** (biểu tượng ở góc) | Hiện thông báo giai đoạn thử nghiệm, nêu các tính năng "sắp ra mắt" (không phải chức năng dùng được); bấm **Đã hiểu** đóng được | | |
