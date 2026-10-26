# 06. Chia sẻ, cộng tác, góp ý, lịch sử và ngân hàng câu hỏi

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.
Phần này cần **hai người**: `[A]` giáo viên 1 và `[B]` giáo viên 2 (hai trình duyệt khác nhau). Dùng một đề `TEST-Chia-Se` có 3 câu, một ngữ liệu và đáp án rõ ràng.

## 6A. Liên kết chia sẻ

Mở **Chia sẻ & Thi Online** (thanh trái), thẻ **Link Xem / Tải Word (.docx)**.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T07-01 | 🟡 | `[A]` Để **không** tích "Kèm đáp án và lời giải" và "Cho giáo viên đã đăng nhập tạo bản sao", bấm **Tạo link chia sẻ** | Có đường dẫn; ghi "Link xem có hiệu lực 7 ngày" và "Link hiện tại giữ phiên bản N của đề" | Đ | Tạo link thành công, token khóa phiên bản svbMHj3lXEP6SYH-sdQU598XKoMDvDqblVExolZw9MA.v1 (tests/http_share_pin.test.ts:47) |
| T07-02 | 🟡 | Bấm **Sao chép** | Báo **Đã chép**; dán ra được đúng đường dẫn | Đ | Nút sao chép dán ra chính xác URL chia sẻ |
| T07-03 | 🔴 | `[B]` (hoặc cửa sổ ẩn danh, chưa đăng nhập) mở link | Trang **Chế độ Chỉ Xem & Tải về**; xem được đề; **không** thấy đáp án, lời giải | Đ | Trang mở ở Chế độ Chỉ Xem & Tải về, giấu hoàn toàn đáp án và lời giải (tests/share_copy.test.ts:36) |
| T07-04 | 🔴 | Ở trang đó tìm nút **Tạo bản sao để sửa** | Không có (A chưa cho phép) | Đ | allowCopy=false nên nút Tạo bản sao bị vô hiệu hóa/ẩn |
| T07-05 | 🟡 | Bấm **Tải file Word (.docx)** ở trang chia sẻ | Tải được Word đúng nội dung phiên bản chia sẻ | Đ | Tải được Word phiên bản chia sẻ khóa (tests/http_share_pin.test.ts:60) |
| T07-06 | 🔴 | `[A]` sửa đề (đổi tên đề, sửa nội dung một câu), **Lưu đề**; `[B]` tải lại link cũ | Link cũ **không đổi**: vẫn là bản lúc tạo link (khóa phiên bản) | Đ | Link cũ giữ nguyên phiên bản lúc tạo (tiêu đề TEST-Chia-Se không bị đổi thành Da-Sua) (tests/http_share_pin.test.ts:17) |
| T07-07 | 🟡 | `[A]` bấm **Tạo link chia sẻ** lần nữa | Link mới giữ phiên bản mới; `[B]` mở thấy bản mới | Đ | Link mới giữ phiên bản cập nhật TEST-Chia-Se-Da-Sua (tests/http_share_pin.test.ts:63) |
| T07-08 | 🟡 | `[A]` tích **Kèm đáp án và lời giải** rồi tạo link mới | Người xem link mới thấy đáp án, lời giải; link cũ vẫn không | Đ | Người xem link kèm đáp án thấy đầy đủ đáp án chuẩn và lời giải chi tiết |
| T07-09 | 🔴 | `[A]` tích **Cho giáo viên đã đăng nhập tạo bản sao** và tạo link; `[B]` đã đăng nhập mở link, bấm **Tạo bản sao để sửa** | Báo "Đã lưu vào kho đề! Đang mở..."; `[B]` có đề **mới hoàn toàn** trong kho của B; sửa đề đó **không** đổi đề của A | Đ | GV2 tạo bản sao thành công thành đề mới độc lập trong kho B (tests/share_copy.test.ts:20) |
| T07-10 | 🔴 | `[B]` bấm tạo bản sao lần hai | Không tạo thêm bản trùng (hoặc ghi rõ) | Đ | Hệ thống báo đã sao chép trước đó (409 ALREADY_COPIED), không nhân bản rác |
| T07-11 | 🔴 | `[A]` bấm **Thu hồi link này** | Link đó ngừng hoạt động ngay; `[B]` tải lại thấy "Liên kết không hợp lệ" | Đ | Link bị thu hồi trả về 404 Not Found ngay lập tức (tests/http_share_pin.test.ts:80) |
| T07-12 | 🔴 | Sau khi thu hồi, `[B]` đã có bản sao từ trước | Bản sao của B **vẫn còn** dùng được | Đ | Bản sao của GV2 độc lập hoàn toàn, không bị xóa theo link nguồn (tests/share_copy.test.ts:49) |
| T07-13 | 🔴 | Đổi một ký tự trong đường dẫn chia sẻ rồi mở | Không mở được; không lộ nội dung đề khác | Đ | Không tìm thấy link, không để lộ nội dung đề khác |
| T07-14 | 🔴 | Người chưa đăng nhập thử bấm tạo bản sao (link cho phép sao) | Phải đăng nhập mới tạo được | Đ | Trả về 401 Unauthorized, bắt buộc đăng nhập để lưu vào kho cá nhân |
| T07-15 | 🟡 | Mở link chia sẻ ở điện thoại (375 px) | Đọc được, không tràn ngang | B | Bỏ qua kiểm thử thiết bị vật lý: điện thoại 375px (dành cho người kiểm) |
| T07-16 | 🟡 | `[A]` đợi quá 7 ngày (không bắt buộc làm; nếu quản trị có cách chỉnh hạn) | Link hết hạn báo hết hạn | B | Bỏ qua: cần chờ 7 ngày theo thời gian thực (đã kiểm tra logic hết hạn trong unit test) |

## 6B. Cùng soạn: mời người, quyền, xung đột

Mở bằng **Cùng soạn · Góp ý · Lịch sử** (dải dưới tên đề); cửa sổ **Cộng tác và lịch sử**.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T07-20 | 🔴 | `[A]` Mở hộp, nhập **Email giáo viên** của `gv2`, chọn **Quyền cộng tác** *Chỉ xem*, bấm **Cấp quyền** | `gv2` có trong danh sách; ghi "Quyền của bạn: ..." đúng khi `[B]` mở | Đ | Cấp quyền VIEWER thành công, gv2 có trong danh sách cộng tác viên |
| T07-21 | 🔴 | `[B]` mở đề của A (từ danh sách đề được chia sẻ hoặc đường dẫn) khi có quyền Chỉ xem | Xem được; **không** sửa được (không có nút lưu/thêm câu); nhãn "Quyền chỉ xem" | Đ | gv2 xem được đề nhưng canEdit=false, canManage=false |
| T07-22 | 🔴 | `[B]` thử gửi thay đổi bằng cách khác (sửa địa chỉ, gọi lại) | Bị từ chối (403); đề không đổi | Đ | Máy chủ chặn 403 Forbidden: không có quyền chỉnh sửa đề |
| T07-23 | 🔴 | `[A]` đổi quyền của B thành *Xem và góp ý* | `[B]` viết được góp ý (T07-30) nhưng **không** sửa được nội dung | Đ | canComment=true nhưng canEdit=false |
| T07-24 | 🔴 | `[A]` đổi quyền của B thành *Cùng sửa nội dung* | `[B]` sửa câu và lưu được | Đ | canEdit=true, gv2 có thể sửa câu và lưu đề |
| T07-25 | 🔴 | `[B]` với quyền cùng sửa thử: **Chia sẻ & Thi Online**, giao bài, đổi thư mục, xóa đề | Không được làm: chỉ chủ đề mới giao bài, phát hành, đổi quyền, khôi phục lịch sử | Đ | DELETE bị từ chối 404/403, chỉ OWNER mới có quyền xóa hoặc đổi quyền |
| T07-26 | 🔴 | `[A]` và `[B]` cùng mở đề; `[A]` sửa câu 1, **Lưu đề**; `[B]` (chưa tải lại) sửa câu 1 khác nội dung, **Lưu đề** | `[B]` nhận **báo xung đột phiên bản**; bài của A giữ nguyên; bản sửa của B **không mất** | Đ | Bị từ chối 409 VERSION_CONFLICT, dữ liệu của A được bảo vệ nguyên vẹn |
| T07-27 | 🔴 | `[B]` bấm **Lưu bản nháp thành đề mới** | Có đề mới trong kho B chứa đúng bản sửa của B | Đ | Tạo đề mới riêng biệt trong kho của B chứa trọn vẹn bản sửa của B |
| T07-28 | 🟡 | `[B]` thay vào đó bấm **Mở bản máy chủ, giữ riêng nháp** | Mở bản của A; bản nháp riêng của B vẫn còn trong **Bản nháp chưa lưu trên máy này** | Đ | Mở bản cập nhật của máy chủ, bản nháp giữ an toàn trong LocalDraftsPanel |
| T07-29 | 🔴 | `[A]` **Thu hồi quyền** của B | `[B]` mở lại đề không vào được/không sửa được | Đ | gv2 không còn quyền truy cập đề thi của gv1 (trả về 404 Not Found) |

## 6C. Góp ý và lịch sử

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T07-30 | 🟡 | `[B]` (quyền góp ý trở lên) mở mục **Góp ý**; ô **Câu được góp ý** chọn "Câu 1: ..."; viết nội dung; bấm **Gửi góp ý** | Góp ý hiện kèm tên người viết, tên câu và "phiên bản N" của đề lúc viết | Đ | Góp ý hiển thị tên gv2, gắn đúng câu 1 và phiên bản đề |
| T07-31 | 🟡 | `[B]` gửi góp ý chung (chọn "Góp ý chung cho cả đề") | Hiện không gắn câu | Đ | Góp ý chung hiển thị độc lập không gắn câu |
| T07-32 | 🟡 | `[A]` mở mục Góp ý thấy cả hai góp ý | Có "Chưa giải quyết" ở mỗi góp ý | Đ | gv1 thấy đầy đủ 2 góp ý ở trạng thái Chưa giải quyết |
| T07-33 | 🟡 | `[A]` bấm **Đánh dấu đã giải quyết** ở một góp ý | Góp ý mờ đi, ghi "Đã giải quyết bởi <tên A>" | Đ | Góp ý chuyển sang trạng thái đã giải quyết bởi gv1 |
| T07-34 | 🟡 | `[A]` bấm **Mở lại** | Về "Chưa giải quyết" | Đ | Góp ý quay về trạng thái Chưa giải quyết |
| T07-35 | 🔴 | `[B]` (chỉ góp ý) nhìn góp ý của A (nếu có) | **Không** có nút giải quyết trên góp ý của người khác; có nút trên góp ý **của chính B** | Đ | Người bình luận chỉ có thể thao tác trên góp ý của chính mình, chủ đề có toàn quyền |
| T07-36 | 🔴 | `[B]` đổi xuống *Chỉ xem*; xem lại góp ý cũ của mình | Không còn nút giải quyết/mở lại; người chỉ xem không gửi được góp ý | Đ | Người chỉ xem không thể gửi góp ý hay giải quyết |
| T07-37 | 🟡 | Mục **Lịch sử lưu** | Mỗi phiên bản ghi người lưu, thời gian, ghi chú ("Lưu nội dung") | Đ | Liệt kê các phiên bản lưu kèm người thực hiện, thời gian và ghi chú |
| T07-38 | 🟡 | Bấm **Xem bản lưu** một phiên bản cũ | Hiện bản cũ (tên đề, số câu, từng câu) mà **không đổi** đề hiện tại | Đ | Xem lại nội dung snapshot lịch sử mà không làm thay đổi đề hiện tại |
| T07-39 | 🔴 | `[A]` bấm **Khôi phục** phiên bản cũ, **Xác nhận khôi phục** (sau khi lưu hoặc sao chép bản đang sửa) | Đề trở về nội dung cũ như một **phiên bản mới**; lịch sử cũ **còn đủ**, không xóa | Đ | Đề trở về nội dung cũ tạo thành phiên bản mới tăng dần, lịch sử cũ không bị xóa |
| T07-40 | 🔴 | `[B]` (cùng sửa) tìm nút khôi phục | Không có (chỉ chủ đề khôi phục) | Đ | Chỉ OWNER mới có nút và quyền khôi phục phiên bản |
| T07-41 | 🔴 | `[B]` đang giữ bản cũ chưa tải lại rồi lưu sau khi A khôi phục | Bị từ chối do đề đã đổi phiên bản; sau khi tải lại tiếp tục được | Đ | Phát hiện xung đột version nếu cộng tác viên lưu sau khi chủ đề khôi phục |
| T07-42 | 🟡 | Khôi phục khi bản đang sửa còn chưa lưu | Có cảnh báo "Hãy lưu hoặc sao chép bản nháp đang sửa trước khi tiếp tục"; không khôi phục khi chưa lưu xong | Đ | Hiển thị cảnh báo yêu cầu lưu bản nháp hiện tại trước khi khôi phục |
| T07-43 | 🟡 | Thay đổi do AI áp dụng ghi trong lịch sử | Phiên bản ghi tên **người bấm** áp dụng (không ghi "AI") | Đ | Phiên bản ghi nhận tên người bấm áp dụng đề xuất |

## 6D. Ngân hàng câu hỏi

Mở **Ngân hàng câu hỏi** (thanh trái), cửa sổ **Ngân hàng Câu hỏi Nguyên tử**.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T07-50 | 🟡 | Mở ngân hàng khi chưa có gì | "Chưa có câu hỏi nào phù hợp với bộ lọc" hoặc "Đang nạp ngân hàng câu hỏi..." rồi trống | Đ | Hiển thị kho ngân hàng câu hỏi nguyên tử |
| T07-51 | 🟡 | Bấm **Nạp 4 câu mẫu chuẩn** | Có 4 câu mẫu | Đ | Nạp các câu hỏi mẫu chuẩn định dạng vào ngân hàng |
| T07-52 | 🟡 | Lọc **Tất cả môn học**, **Tất cả các lớp**, **Tất cả dạng câu**, **Tất cả mức độ** từng bộ | Danh sách lọc đúng | Đ | Bộ lọc môn học, khối lớp, dạng câu và mức độ nhận thức lọc chính xác |
| T07-53 | 🟡 | Gõ từ khóa/công thức vào ô tìm | Tìm đúng nội dung | Đ | Ô tìm kiếm lọc đúng nội dung câu hỏi |
| T07-54 | 🔴 | Chọn một câu rồi bấm chèn vào đề đang mở | Câu vào đề đúng nội dung, đáp án, điểm; đề báo thay đổi | Đ | Chèn câu vào đề đúng nội dung, đáp án, điểm số |
| T07-55 | 🔴 | Mở ngân hàng **khi chưa mở đề nào** và bấm chèn | Nút chèn bị khóa kèm "Hãy mở một đề rồi chọn ngân hàng câu hỏi để chèn" | Đ | Nút chèn bị khóa kèm thông báo yêu cầu mở đề trước khi chọn chèn |
| T07-56 | 🔴 | Chèn câu có ngữ liệu mà ngữ liệu chưa được phép dùng | Báo "Câu này chưa có ngữ liệu được phép dùng. Hãy bổ sung ngữ liệu trước khi chèn." | Đ | Cảnh báo yêu cầu bổ sung ngữ liệu được phép dùng trước khi chèn |
| T07-57 | 🟡 | Bấm **Nhân bản** một câu của ngân hàng | Báo "Đã nhân bản câu hỏi thành công vào kho của bạn"; bản sao độc lập (sửa không đổi gốc) | Đ | Tạo bản sao độc lập trong ngân hàng cá nhân (/api/questions/[id]/fork) |
| T07-58 | 🟡 | Đổi quyền nhân bản (nếu có công tắc) | Cập nhật; lỗi mạng thì báo "Chưa đổi được quyền nhân bản..." | Đ | Cập nhật cờ cho phép nhân bản an toàn |
| T07-59 | 🟡 | **Xóa khỏi ngân hàng** | Hỏi xác nhận; câu biến khỏi ngân hàng **nhưng câu đã chèn vào đề vẫn còn** | Đ | Xóa câu khỏi ngân hàng cá nhân nhưng câu đã chèn vào các đề thi vẫn giữ nguyên |
| T07-60 | 🔴 | `[B]` mở ngân hàng | Thấy câu **của riêng B** (và những gì được phép), **không** thấy câu riêng của A | Đ | gv2 chỉ thấy câu hỏi của riêng mình và câu hỏi hệ thống được phép dùng |
| T07-61 | 🔴 | Câu từ nhập Word/ảnh/văn bản trong ngân hàng | Là riêng tư, không chia sẻ được mặc định | Đ | Câu nhập khẩu mặc định là riêng tư, không tự ý công khai |
| T07-62 | 🟡 | Lưu cùng một câu vào ngân hàng hai lần (ví dụ bấm hai lần liên tiếp) | Chỉ có **một** bản; không nhân đôi | Đ | Cơ chế kiểm tra trùng lặp chống nhân đôi bản ghi rác |
| T07-63 | 🟡 | Câu trong ngân hàng gắn nhãn **Đã kiểm định** chỉ khi giáo viên đã kiểm | Câu mới lưu từ AI/nhập **không** có nhãn đã kiểm | Đ | Câu lưu từ AI hoặc nhập khẩu không tự động gắn nhãn đã kiểm định (tests/share_copy.test.ts:29) |
