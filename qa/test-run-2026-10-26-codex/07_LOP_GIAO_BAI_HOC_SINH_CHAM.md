# 07. Lớp học, PIN, giao bài, học sinh làm bài, chấm điểm, sửa đáp án, bảng điểm

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.
Phần này cần **ba vai**: `[A]` giáo viên, `[HS]` học sinh trên **điện thoại** (hoặc cửa sổ ẩn danh thu nhỏ 375 px), `[B]` giáo viên thứ hai.
Dùng đề `TEST-Giao-Bai` có đủ: 2 câu lựa chọn, 1 đúng/sai, 1 trả lời ngắn (đáp án `42`, chấp nhận thêm `42,0`), 1 tự luận (tiêu chí 2 điểm), 1 ghép nối, 1 sắp xếp. Điểm tổng 10. Đáp án đã đặt để bạn tính tay được điểm.

## 7A. Lớp học (`/teacher/groups`)

Vào bằng **Quản lý Lớp học** (trang chủ) hoặc `/teacher/groups`.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-01 | 🟡 | `[A]` Bấm **Tạo Lớp Mới**; **Tên lớp học** `TEST-Lop-7A`, Ghi chú; dán 5 tên học sinh mỗi dòng một tên, trong đó 1 tên lặp và 1 dòng trống | Sau **Xác Nhận Tạo Lớp**: lớp có **4** học sinh (trùng và dòng trống bị loại); có thông báo thành công | | |
| T08-02 | 🟡 | Dán danh sách từ cột Excel | Mỗi ô một học sinh | | |
| T08-03 | 🟡 | Xem thẻ lớp | Có **Mã lớp**, số học sinh, số bài đã giao, nút **Chép link**, **Xem Danh Sách**, liên kết mở cổng lớp | | |
| T08-04 | 🟡 | **Xem Danh Sách** → thêm học sinh mới bằng ô "Thêm tên học sinh mới..." và **Thêm** | Học sinh vào danh sách; thêm trùng tên bị từ chối | | |
| T08-05 | 🟡 | Tìm lớp bằng ô tìm (tên hoặc mã lớp) | Lọc đúng | | |
| T08-06 | 🔴 | `[B]` mở `/teacher/groups` | Không thấy lớp của A | | |
| T08-07 | 🔴 | `[A]` trong chi tiết lớp bấm **Cấp PIN cho cả lớp** (xác nhận) | Hiện khung "PIN vừa cấp (chỉ hiện một lần...)" liệt kê từng học sinh với PIN 6 chữ số, các PIN khác nhau; mỗi học sinh chuyển "Đã có PIN" | | |
| T08-08 | 🔴 | Bấm **Chép danh sách PIN** rồi dán ra Notepad; bấm **Tải PIN (CSV)** và mở bằng Excel | Danh sách đủ tên-PIN; CSV mở được, tiếng Việt đúng, PIN bắt đầu bằng số 0 không bị mất số 0 | | |
| T08-09 | 🔴 | Bấm **Đã ghi lại, ẩn PIN**, đóng rồi mở lại danh sách lớp | **Không** xem lại được PIN (chỉ còn "Đã có PIN"); muốn có phải cấp lại | | |
| T08-10 | 🔴 | Bấm **Cấp lại PIN** ở một học sinh | Chỉ học sinh đó có PIN mới; PIN cũ của em đó không dùng được nữa; em khác không đổi | | |
| T08-11 | 🟡 | Thêm học sinh mới sau khi đã cấp PIN | Em mới "Chưa có PIN" | | |

## 7B. Giao bài (cửa sổ **Chia sẻ & Thi Online**, thẻ **Giao Bài Thi Online (Chấm Tự Động)**)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-20 | 🟡 | `[A]` Mở thẻ giao bài | Thấy **Tiêu đề bài giao**, **Giao cho lớp học**, kiểu bài (**Bài Trên Lớp**, **Về Nhà**, **Phòng Thi**), **Thời lượng (phút)**, **Bảng xếp hạng** | | |
| T08-21 | 🔴 | **Giao cho lớp học** chọn "Làm tự do (Học sinh tự gõ tên)" (không lớp). Tùy chọn nâng cao: để trống giờ mở/đóng, **Số lượt làm** 1 | Bấm **Giao Bài & Tạo Phòng Thi Ngay** → **Phòng Thi Trực Tuyến Đã Sẵn Sàng!** có link; **Sao chép**, **Vào phòng thi thử** | | |
| T08-22 | 🔴 | **Giao cho lớp học** chọn `TEST-Lop-7A`, chế độ "Chọn tên từ danh sách lớp" | Học sinh sẽ thấy danh sách tên để chọn | | |
| T08-23 | 🔴 | Tích **Yêu cầu PIN của học sinh** (chỉ khi chọn lớp) và giao | Học sinh phải nhập PIN (đã cấp ở T08-07) mới vào được | | |
| T08-24 | 🟡 | Chọn "Làm tự do" mà vẫn tích PIN | Tùy chọn PIN **bị mờ**/không dùng được (chỉ khi giao cho lớp) | | |
| T08-25 | 🔴 | Đặt **Mã vào bài** `EXAM2026` | Học sinh phải nhập mã (không phân biệt hoa/thường) | | |
| T08-26 | 🟡 | Mã vào bài chỉ 3 ký tự hoặc có ký tự lạ | Bị từ chối, nêu quy định 4–12 chữ/số | | |
| T08-27 | 🟡 | Đặt **Giờ mở** ở tương lai | Học sinh vào sớm bị báo chưa đến giờ | | |
| T08-28 | 🟡 | Đặt **Giờ đóng** đã qua | Học sinh không bắt đầu lượt mới; báo đã đóng | | |
| T08-29 | 🟡 | **Số lượt làm** nhập 0 hoặc 11 | Bị từ chối (hợp lệ là 1–10) | | |
| T08-30 | 🟡 | Tích **Trộn thứ tự câu hỏi cho mỗi học sinh** và **Trộn thứ tự đáp án A/B/C/D** | Hai học sinh khác nhau thấy thứ tự khác nhau (kiểm ở T08-45) | | |
| T08-31 | 🔴 | Giao bài rồi **sửa đề gốc** (đổi đáp án) | Bài giao **không đổi** (đề đã đóng gói bản chụp bất biến) | | |
| T08-32 | 🟡 | Xem bài giao ở **Bài đã giao** | Có tên bài, lớp, giờ đóng, số lượt, mã vào bài | | |
| T08-33 | 🟡 | Bấm "Soạn đề thi" (liên kết quay lại) và mở bài giao khác | Điều hướng đúng | | |

## 7C. Học sinh vào và làm bài (`/a/...` — làm trên điện thoại)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-40 | 🔴 | `[HS]` Mở link bài **làm tự do**, nhập **Mã vào bài** (nếu có), gõ tên ở **Nhập họ và tên của em:**; bấm **Bắt đầu làm bài** | Vào làm bài; đồng hồ đếm ngược chạy | | |
| T08-41 | 🔴 | Để trống tên hoặc nhập sai mã vào bài | Báo "Vui lòng nhập họ và tên của em!" / mã sai; không tạo bài làm | | |
| T08-42 | 🔴 | `[HS]` Mở link bài giao cho lớp: chọn tên ở **Chọn tên của em trong danh sách lớp:** | Chọn được tên; không chọn thì báo "Vui lòng chọn tên của em trong danh sách!" | | |
| T08-43 | 🔴 | Bài yêu cầu PIN: nhập **PIN do giáo viên cấp** đúng (từ T08-07) | Vào được | | |
| T08-44 | 🔴 | PIN sai hoặc chọn tên em chưa có PIN | **Không** vào được; thông báo PIN không đúng/chưa được cấp | | |
| T08-45 | 🟡 | Hai học sinh khác nhau (2 máy hoặc 2 lượt) làm bài có trộn | Thứ tự câu và phương án khác nhau; chấm vẫn đúng theo nội dung phương án | | |
| T08-46 | 🔴 | Làm bài trên điện thoại 375 px | Giao diện không tràn ngang; chữ đọc được; nút bấm được bằng ngón tay | | |
| T08-47 | 🔴 | Chọn đáp án câu lựa chọn | Đáp án đang chọn hiện rõ; có thể đổi | | |
| T08-48 | 🔴 | Câu đúng/sai: chọn từng ý Đúng/Sai | Mỗi ý lưu riêng | | |
| T08-49 | 🔴 | Câu trả lời ngắn: gõ `42,0` | Chấp nhận (vì đã đặt cách trả lời chấp nhận) | | |
| T08-50 | 🔴 | Câu tự luận: gõ đoạn văn ở **Trình bày câu trả lời (giáo viên sẽ chấm)** | Nhận chữ; không tự chấm | | |
| T08-51 | 🔴 | Câu ghép nối: **Chọn vế phải cho mỗi nội dung bên trái** | Chọn được từng cặp | | |
| T08-52 | 🔴 | Câu sắp xếp: dùng **Thêm vào thứ tự**, nút lên/xuống | Thứ tự đúng ý em; sửa lại được | | |
| T08-53 | 🟡 | Dùng **Bảng câu hỏi** (danh sách số câu) để nhảy câu | Nhảy đúng; câu đã làm đánh dấu | | |
| T08-54 | 🔴 | Làm dở, **tải lại trang (F5)** | Quay lại đúng bài đang làm, **giữ** các đáp án đã chọn | | |
| T08-55 | 🔴 | Làm dở, tắt tab, mở lại link | Hỏi "Làm tiếp"; đáp án còn | | |
| T08-56 | 🔴 | Đang làm bài, **tắt Wi-Fi** của điện thoại, chọn thêm vài đáp án, bật lại | Đáp án được giữ trong máy và đồng bộ lại; có thể **Tải bản câu trả lời đang nhập** nếu lưu lỗi | | |
| T08-57 | 🔴 | Bấm **Nộp bài** | Hỏi "Xác nhận nộp bài thi?"; sau đó "Em đã hoàn thành" | | |
| T08-58 | 🔴 | Nộp bài khi còn câu chưa làm | Cho nộp, nhưng cảnh báo số câu chưa làm | | |
| T08-59 | 🔴 | Bấm nộp hai lần liên tiếp (chạm nhanh) | Chỉ có **một** bài nộp; không nhân đôi | | |
| T08-60 | 🔴 | Để hết giờ (bài ngắn 1 phút để thử) | Hệ thống **tự khóa và nộp**; bài làm dở vẫn được chấm phần đã làm | | |
| T08-61 | 🔴 | Số lượt = 1, đã nộp, mở lại link | Không làm lại được; báo hết lượt | | |
| T08-62 | 🟡 | Số lượt = 2: sau lượt 1 bấm **Làm lượt tiếp theo** | Có lượt 2 độc lập | | |
| T08-63 | 🔴 | Ở màn làm bài trước khi nộp, tìm đáp án đúng | **Không** có đáp án hay lời giải ở bất cứ chỗ nào (kể cả xem nguồn trang) | | |
| T08-64 | 🔴 | Sau khi nộp, xem kết quả theo cấu hình giáo viên | Nếu cấu hình hiện điểm: điểm cho câu chấm tự động; tự luận ghi "chờ chấm"; hiện **Đáp án & Lời giải chi tiết** chỉ khi giáo viên cho phép | | |
| T08-65 | 🔴 | Cấu hình ẩn lời giải: nộp và xem | **Không** thấy "Đáp án đúng", "Hướng dẫn giải" | | |
| T08-66 | 🟡 | Bảng xếp hạng bật: xem **Bảng xếp hạng lớp**, **Vị trí của em** | Xếp hạng đúng theo điểm | | |
| T08-67 | 🟡 | Đóng bài bằng **Khóa bài thi** (7E) khi học sinh đang làm | Học sinh đang làm vẫn nộp được hoặc bị báo rõ; học sinh mới không vào | | |
| T08-68 | 🔴 | `[HS]` thử mở link bài khác (đổi vài ký tự trong đường dẫn) | Báo "Không thể truy cập bài thi" | | |

## 7D. Trang lớp cho học sinh (`/c/<mã lớp>`)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-70 | 🟡 | `[HS]` Mở link lớp (từ **Chép link** ở T08-03) | Thấy "Lớp học trực tuyến", **Mã lớp**, danh sách bài thi và bài tập của lớp | | |
| T08-71 | 🟡 | Chọn tên ở **Chọn tên em để xem điểm** | Hiện trạng thái từng bài: **Vào làm bài**, **Tiếp tục làm**, **Đã nộp bài**, **Điểm số**, **Xem lại** | | |
| T08-72 | 🔴 | Một học sinh chọn tên bạn khác | Không xem được điểm của bạn nếu bài yêu cầu PIN/bảo mật; kiểm hiển thị đúng chính sách | | |
| T08-73 | 🔴 | Link lớp sai mã | "Không tìm thấy lớp học" | | |

## 7E. Giáo viên theo dõi, chấm và xuất bảng điểm (`/teacher/assignments/<mã>`)

Vào bằng **Bảng điểm thi** hoặc `/teacher/assignments` rồi **Giám sát & Bảng điểm**.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-80 | 🟡 | `[A]` Mở danh sách **Danh sách bài đã giao** | Thấy bài, lớp, số lượt; ô tìm theo tiêu đề/lớp | | |
| T08-81 | 🟡 | Mở bài vừa có học sinh nộp | Thấy **Tổng học sinh**, **Đã nộp bài**, **Đang làm bài**, **Điểm trung bình đã chốt**, **Điểm cao nhất**, **Điểm giỏi (≥ 8.0)** | | |
| T08-82 | 🔴 | Đối chiếu điểm tự động với tự tính tay (đáp án đã biết) | Trắc nghiệm, đúng/sai, trả lời ngắn, ghép nối, sắp xếp: điểm đúng; tự luận **Tạm tính · chờ chấm** | | |
| T08-83 | 🔴 | Điểm câu đúng/sai | Đúng theo quy tắc điểm đã đặt cho từng ý (nếu chấm theo số ý đúng, kiểm đúng thang) | | |
| T08-84 | 🔴 | Bấm **Xem bài** của một học sinh | Thấy từng câu: **Học sinh chọn**, **Đáp án chuẩn**, **Hướng dẫn giải**, đúng/sai | | |
| T08-85 | 🔴 | Chấm câu tự luận: nhập điểm và nhận xét, lưu | Điểm tổng cập nhật; trạng thái bài thành đã chấm; nhập điểm vượt điểm tối đa bị từ chối | | |
| T08-86 | 🔴 | Sửa điểm một câu hai lần liên tiếp | Có lịch sử các lần sửa; điểm cũ vẫn xem được | | |
| T08-87 | 🟡 | Hai giáo viên cùng chấm một bài (nếu thử được) | Người lưu sau thấy báo đã đổi, không ghi đè mất | | |
| T08-88 | 🟡 | Bấm **Khóa bài thi** | Học sinh mới không vào; bài đang làm xử lý rõ; nút đổi thành **Mở lại bài thi** | | |
| T08-89 | 🟡 | Bấm **Mở lại bài thi** | Học sinh vào lại được | | |
| T08-90 | 🟡 | Bấm **Chép link thi** | Chép đúng link bài | | |
| T08-91 | 🔴 | Bấm **Xuất Excel (CSV)** | Tải được tệp; mở Excel đọc tiếng Việt đúng; mỗi học sinh một dòng; điểm khớp màn hình | | |
| T08-92 | 🔴 | Tên học sinh bắt đầu bằng `=` hoặc `+` (ví dụ `=1+1`) | Trong CSV không bị Excel hiểu thành công thức (được đệm an toàn) | | |
| T08-93 | 🟡 | Bài khảo sát/nhận xét (không điểm) | Hiện "Bài này ghi nhận phản hồi hoặc nhận xét, không dùng điểm số"; không có điểm giả | | |
| T08-94 | 🟡 | Mục "Mẹo sư phạm" (phân tích câu hay sai) | Nêu các câu nhiều học sinh làm sai; số học sinh đúng khớp | | |
| T08-95 | 🔴 | `[B]` mở link `/teacher/assignments/<mã>` của A | Không xem được | | |

## 7F. Sửa đáp án và chấm lại

Dùng khi sau khi học sinh đã nộp, bạn phát hiện đáp án đề sai. Chuẩn bị: bài có ít nhất 3 bài nộp: em X làm đúng theo đáp án sai (đang được điểm), em Y làm đúng theo đáp án đúng (đang mất điểm), em Z có câu tự luận bạn đã chấm tay.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-100 | 🔴 | Trong bài giao, mở thẻ **Phân tích câu hỏi**, mở khối **Sửa đáp án và chấm lại** | Có ô **Câu cần sửa**, **Đáp án đúng mới**, **Lý do (bắt buộc, lưu vào lịch sử)**, nút **Xem trước ảnh hưởng** | | |
| T08-101 | 🔴 | Chọn câu trắc nghiệm, chọn đáp án đúng mới; để trống lý do; bấm xem trước | Bị từ chối: cần nhập lý do | | |
| T08-102 | 🔴 | Nhập lý do (≥ 3 ký tự), bấm **Xem trước ảnh hưởng** | Hiện số bài đổi điểm, danh sách học sinh kèm **điểm cũ → điểm mới**; **chưa** đổi gì thật | | |
| T08-103 | 🔴 | Đối chiếu xem trước | Em X giảm điểm, em Y tăng điểm; bài đã chấm tay của em Z **được giữ nguyên** và nêu rõ | | |
| T08-104 | 🔴 | Nút **Sửa đáp án và chấm lại** trước khi xem trước | Bị khóa (cần lý do và xem trước) | | |
| T08-105 | 🔴 | Bấm **Sửa đáp án và chấm lại** | Điểm cập nhật thật; xem lại danh sách điểm, CSV đúng điểm mới | | |
| T08-106 | 🔴 | Điểm tự luận đã chấm tay của em Z | **Không đổi** | | |
| T08-107 | 🔴 | Xem **Lịch sử sửa đáp án** | Có dòng mới: thời gian, câu, đáp án cũ → mới, lý do | | |
| T08-108 | 🔴 | Mỗi học sinh bị đổi điểm, mở lịch sử chấm của em đó | Có một sự kiện kèm lý do | | |
| T08-109 | 🟡 | Bấm lại cùng đáp án (áp lần hai) | Không thay đổi điểm ai (an toàn khi lặp) | | |
| T08-110 | 🟡 | Câu trả lời ngắn: ở **Các đáp án được chấp nhận (mỗi dòng một đáp án)** thêm một cách viết nữa | Em nào đã viết đúng cách đó được cộng điểm; em khác giữ nguyên | | |
| T08-111 | 🟡 | Thử sửa đáp án câu tự luận, ghép nối, sắp xếp | Chưa hỗ trợ: bị từ chối rõ ràng, nêu cách làm tạm (đã ghi ở "không phải lỗi") | | |
| T08-112 | 🔴 | Học sinh **đang làm dở** (chưa nộp) lúc bạn chấm lại | Bài đang làm **không** bị đổi; chỉ bài đã nộp được tính lại | | |
| T08-113 | 🔴 | Học sinh mới bắt đầu sau khi sửa đáp án | Được chấm theo đáp án **mới** | | |
| T08-114 | 🔴 | Học sinh xem payload/đáp án | Không có dữ liệu "lịch sử sửa", "lý do" ở phía học sinh | | |
| T08-115 | 🔴 | `[B]` thử sửa đáp án bài của A | Không được (404/không có quyền) | | |
