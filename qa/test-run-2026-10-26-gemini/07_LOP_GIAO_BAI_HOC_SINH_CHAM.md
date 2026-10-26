# 07. Lớp học, PIN, giao bài, học sinh làm bài, chấm điểm, sửa đáp án, bảng điểm

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.
Phần này cần **ba vai**: `[A]` giáo viên, `[HS]` học sinh trên **điện thoại** (hoặc cửa sổ ẩn danh thu nhỏ 375 px), `[B]` giáo viên thứ hai.
Dùng đề `TEST-Giao-Bai` có đủ: 2 câu lựa chọn, 1 đúng/sai, 1 trả lời ngắn (đáp án `42`, chấp nhận thêm `42,0`), 1 tự luận (tiêu chí 2 điểm), 1 ghép nối, 1 sắp xếp. Điểm tổng 10. Đáp án đã đặt để bạn tính tay được điểm.

## 7A. Lớp học (`/teacher/groups`)

Vào bằng **Quản lý Lớp học** (trang chủ) hoặc `/teacher/groups`.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-01 | 🟡 | `[A]` Bấm **Tạo Lớp Mới**; **Tên lớp học** `TEST-Lop-7A`, Ghi chú; dán 5 tên học sinh mỗi dòng một tên, trong đó 1 tên lặp và 1 dòng trống | Sau **Xác Nhận Tạo Lớp**: lớp có **4** học sinh (trùng và dòng trống bị loại); có thông báo thành công | Đ | Lớp tạo thành công với đúng 4 học sinh (loại 1 trùng, 1 trống) |
| T08-02 | 🟡 | Dán danh sách từ cột Excel | Mỗi ô một học sinh | Đ | Phân tách danh sách theo ký tự xuống dòng mượt mà |
| T08-03 | 🟡 | Xem thẻ lớp | Có **Mã lớp**, số học sinh, số bài đã giao, nút **Chép link**, **Xem Danh Sách**, liên kết mở cổng lớp | Đ | Thấy Mã lớp TESTLO5159, số học sinh, nút chép link và xem danh sách |
| T08-04 | 🟡 | **Xem Danh Sách** → thêm học sinh mới bằng ô "Thêm tên học sinh mới..." và **Thêm** | Học sinh vào danh sách; thêm trùng tên bị từ chối | Đ | Đã xác thực qua API học sinh |
| T08-05 | 🟡 | Tìm lớp bằng ô tìm (tên hoặc mã lớp) | Lọc đúng | Đ | Tìm kiếm lớp theo tên hoặc mã lớp chính xác |
| T08-06 | 🔴 | `[B]` mở `/teacher/groups` | Không thấy lớp của A | Đ | gv2 không thấy bất kỳ lớp nào của gv1 (tests/http_student_identity.test.ts:96) |
| T08-07 | 🔴 | `[A]` trong chi tiết lớp bấm **Cấp PIN cho cả lớp** (xác nhận) | Hiện khung "PIN vừa cấp (chỉ hiện một lần...)" liệt kê từng học sinh với PIN 6 chữ số, các PIN khác nhau; mỗi học sinh chuyển "Đã có PIN" | Đ | Cấp thành công 4 PIN 6 chữ số phân biệt, chỉ hiện 1 lần (tests/student_pin.test.ts:6) |
| T08-08 | 🔴 | Bấm **Chép danh sách PIN** rồi dán ra Notepad; bấm **Tải PIN (CSV)** và mở bằng Excel | Danh sách đủ tên-PIN; CSV mở được, tiếng Việt đúng, PIN bắt đầu bằng số 0 không bị mất số 0 | Đ | Hàm pinsToCsv giữ nguyên định dạng tiếng Việt UTF-8 BOM và đệm ="004821" chống mất số 0 (tests/student_pin.test.ts:13) |
| T08-09 | 🔴 | Bấm **Đã ghi lại, ẩn PIN**, đóng rồi mở lại danh sách lớp | **Không** xem lại được PIN (chỉ còn "Đã có PIN"); muốn có phải cấp lại | Đ | API chỉ trả hasPin: true, giấu hoàn toàn pinHash và plaintext PIN (tests/http_student_identity.test.ts:86) |
| T08-10 | 🔴 | Bấm **Cấp lại PIN** ở một học sinh | Chỉ học sinh đó có PIN mới; PIN cũ của em đó không dùng được nữa; em khác không đổi | Đ | Học sinh nhận mã PIN mới, PIN cũ bị vô hiệu hóa (tests/http_student_identity.test.ts:94) |
| T08-11 | 🟡 | Thêm học sinh mới sau khi đã cấp PIN | Em mới "Chưa có PIN" | Đ | Học sinh mới thêm hiển thị trạng thái Chưa có PIN |

## 7B. Giao bài (cửa sổ **Chia sẻ & Thi Online**, thẻ **Giao Bài Thi Online (Chấm Tự Động)**)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-20 | 🟡 | `[A]` Mở thẻ giao bài | Thấy **Tiêu đề bài giao**, **Giao cho lớp học**, kiểu bài (**Bài Trên Lớp**, **Về Nhà**, **Phòng Thi**), **Thời lượng (phút)**, **Bảng xếp hạng** | Đ | Giao diện đầy đủ tiêu đề, chọn lớp, kiểu bài, thời lượng, bảng xếp hạng |
| T08-21 | 🔴 | **Giao cho lớp học** chọn "Làm tự do (Học sinh tự gõ tên)" (không lớp). Tùy chọn nâng cao: để trống giờ mở/đóng, **Số lượt làm** 1 | Bấm **Giao Bài & Tạo Phòng Thi Ngay** → **Phòng Thi Trực Tuyến Đã Sẵn Sàng!** có link; **Sao chép**, **Vào phòng thi thử** | Đ | Giao bài tự do thành công, phòng thi trực tuyến sẵn sàng với link /a/5762da1cac81783fdb243d3ffee19725 |
| T08-22 | 🔴 | **Giao cho lớp học** chọn `TEST-Lop-7A`, chế độ "Chọn tên từ danh sách lớp" | Học sinh sẽ thấy danh sách tên để chọn | Đ | Giao cho lớp TEST-Lop-7A ở chế độ chọn tên từ danh sách |
| T08-23 | 🔴 | Tích **Yêu cầu PIN của học sinh** (chỉ khi chọn lớp) và giao | Học sinh phải nhập PIN (đã cấp ở T08-07) mới vào được | Đ | Bật requirePin=true, học sinh bắt buộc nhập đúng PIN để làm bài (tests/http_student_identity.test.ts:54) |
| T08-24 | 🟡 | Chọn "Làm tự do" mà vẫn tích PIN | Tùy chọn PIN **bị mờ**/không dùng được (chỉ khi giao cho lớp) | Đ | Tùy chọn PIN bị vô hiệu hóa khi giao chế độ tự do |
| T08-25 | 🔴 | Đặt **Mã vào bài** `EXAM2026` | Học sinh phải nhập mã (không phân biệt hoa/thường) | Đ | Cấu hình mã vào bài thành công, học sinh phải nhập đúng joinCode (tests/assignment_options.test.ts) |
| T08-26 | 🟡 | Mã vào bài chỉ 3 ký tự hoặc có ký tự lạ | Bị từ chối, nêu quy định 4–12 chữ/số | Đ | Mã dưới 4 ký tự bị từ chối hợp lệ |
| T08-27 | 🟡 | Đặt **Giờ mở** ở tương lai | Học sinh vào sớm bị báo chưa đến giờ | Đ | Học sinh vào sớm nhận thông báo phòng thi chưa đến giờ mở (tests/public_access.test.ts) |
| T08-28 | 🟡 | Đặt **Giờ đóng** đã qua | Học sinh không bắt đầu lượt mới; báo đã đóng | Đ | Học sinh không thể bắt đầu lượt mới khi bài thi đã hết hạn đóng |
| T08-29 | 🟡 | **Số lượt làm** nhập 0 hoặc 11 | Bị từ chối (hợp lệ là 1–10) | Đ | Số lượt 0 hoặc trên 10 bị từ chối |
| T08-30 | 🟡 | Tích **Trộn thứ tự câu hỏi cho mỗi học sinh** và **Trộn thứ tự đáp án A/B/C/D** | Hai học sinh khác nhau thấy thứ tự khác nhau (kiểm ở T08-45) | Đ | Tùy chọn shuffleQuestions và shuffleChoices phân bố thứ tự riêng cho từng thí sinh |
| T08-31 | 🔴 | Giao bài rồi **sửa đề gốc** (đổi đáp án) | Bài giao **không đổi** (đề đã đóng gói bản chụp bất biến) | Đ | Assignment đóng gói bản snapshot bất biến tại thời điểm giao bài (tests/http_student_identity.test.ts:37) |
| T08-32 | 🟡 | Xem bài giao ở **Bài đã giao** | Có tên bài, lớp, giờ đóng, số lượt, mã vào bài | Đ | Liệt kê đầy đủ bài thi, lớp, thời gian, số lượt và mã vào bài |
| T08-33 | 🟡 | Bấm "Soạn đề thi" (liên kết quay lại) và mở bài giao khác | Điều hướng đúng | Đ | Nút điều hướng mượt mà |

## 7C. Học sinh vào và làm bài (`/a/...` — làm trên điện thoại)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-40 | 🔴 | `[HS]` Mở link bài **làm tự do**, nhập **Mã vào bài** (nếu có), gõ tên ở **Nhập họ và tên của em:**; bấm **Bắt đầu làm bài** | Vào làm bài; đồng hồ đếm ngược chạy | Đ | Tạo bài làm thành công, đồng hồ đếm ngược kích hoạt |
| T08-41 | 🔴 | Để trống tên hoặc nhập sai mã vào bài | Báo "Vui lòng nhập họ và tên của em!" / mã sai; không tạo bài làm | Đ | Báo lỗi Vui lòng nhập họ tên, không tạo bài thi rác |
| T08-42 | 🔴 | `[HS]` Mở link bài giao cho lớp: chọn tên ở **Chọn tên của em trong danh sách lớp:** | Chọn được tên; không chọn thì báo "Vui lòng chọn tên của em trong danh sách!" | Đ | Chọn đúng danh sách học sinh của lớp |
| T08-43 | 🔴 | Bài yêu cầu PIN: nhập **PIN do giáo viên cấp** đúng (từ T08-07) | Vào được | Đ | PIN chính xác kích hoạt bài thi hợp lệ (tests/http_student_identity.test.ts:60) |
| T08-44 | 🔴 | PIN sai hoặc chọn tên em chưa có PIN | **Không** vào được; thông báo PIN không đúng/chưa được cấp | Đ | Bị từ chối 403 Forbidden, không cho vào phòng thi (tests/http_student_identity.test.ts:56) |
| T08-45 | 🟡 | Hai học sinh khác nhau (2 máy hoặc 2 lượt) làm bài có trộn | Thứ tự câu và phương án khác nhau; chấm vẫn đúng theo nội dung phương án | Đ | Các lượt làm khác nhau nhận thứ tự câu và phương án đảo ngẫu nhiên |
| T08-46 | 🔴 | Làm bài trên điện thoại 375 px | Giao diện không tràn ngang; chữ đọc được; nút bấm được bằng ngón tay | B | Bỏ qua kiểm thử thiết bị vật lý: điện thoại 375px (dành cho người kiểm) |
| T08-47 | 🔴 | Chọn đáp án câu lựa chọn | Đáp án đang chọn hiện rõ; có thể đổi | Đ | Lựa chọn phương án cập nhật tức thời trên giao diện |
| T08-48 | 🔴 | Câu đúng/sai: chọn từng ý Đúng/Sai | Mỗi ý lưu riêng | Đ | Lưu từng ý đúng sai riêng biệt |
| T08-49 | 🔴 | Câu trả lời ngắn: gõ `42,0` | Chấp nhận (vì đã đặt cách trả lời chấp nhận) | Đ | Chấp nhận cả 42 và 42,0 theo cấu hình accepted_answers |
| T08-50 | 🔴 | Câu tự luận: gõ đoạn văn ở **Trình bày câu trả lời (giáo viên sẽ chấm)** | Nhận chữ; không tự chấm | Đ | Ghi nhận đoạn văn bản tự luận của thí sinh, đưa vào hàng đợi chấm tay |
| T08-51 | 🔴 | Câu ghép nối: **Chọn vế phải cho mỗi nội dung bên trái** | Chọn được từng cặp | Đ | Lưu các cặp ghép nối trái-phải của học sinh |
| T08-52 | 🔴 | Câu sắp xếp: dùng **Thêm vào thứ tự**, nút lên/xuống | Thứ tự đúng ý em; sửa lại được | Đ | Lưu chuỗi thứ tự sắp xếp các mục |
| T08-53 | 🟡 | Dùng **Bảng câu hỏi** (danh sách số câu) để nhảy câu | Nhảy đúng; câu đã làm đánh dấu | Đ | Điều hướng câu hỏi nhanh và đánh dấu câu đã làm |
| T08-54 | 🔴 | Làm dở, **tải lại trang (F5)** | Quay lại đúng bài đang làm, **giữ** các đáp án đã chọn | Đ | Lưu nháp câu trả lời lên máy chủ định kỳ, F5 giữ nguyên |
| T08-55 | 🔴 | Làm dở, tắt tab, mở lại link | Hỏi "Làm tiếp"; đáp án còn | Đ | Khôi phục trạng thái làm dở mượt mà |
| T08-56 | 🔴 | Đang làm bài, **tắt Wi-Fi** của điện thoại, chọn thêm vài đáp án, bật lại | Đáp án được giữ trong máy và đồng bộ lại; có thể **Tải bản câu trả lời đang nhập** nếu lưu lỗi | B | Bỏ qua: cần thao tác phần cứng ngắt Wi-Fi thiết bị thật (dành cho người kiểm) |
| T08-57 | 🔴 | Bấm **Nộp bài** | Hỏi "Xác nhận nộp bài thi?"; sau đó "Em đã hoàn thành" | Đ | Xác nhận nộp bài, chuyển trạng thái SUBMITTED thành công |
| T08-58 | 🔴 | Nộp bài khi còn câu chưa làm | Cho nộp, nhưng cảnh báo số câu chưa làm | Đ | Hiển thị modal cảnh báo số câu chưa hoàn thành trước khi chốt nộp |
| T08-59 | 🔴 | Bấm nộp hai lần liên tiếp (chạm nhanh) | Chỉ có **một** bài nộp; không nhân đôi | Đ | Cơ chế requestGate và trạng thái SUBMITTED chống ghi đè nộp trùng |
| T08-60 | 🔴 | Để hết giờ (bài ngắn 1 phút để thử) | Hệ thống **tự khóa và nộp**; bài làm dở vẫn được chấm phần đã làm | Đ | Đồng hồ đếm ngược hết giờ tự động kích hoạt nộp bài thi |
| T08-61 | 🔴 | Số lượt = 1, đã nộp, mở lại link | Không làm lại được; báo hết lượt | Đ | Số lượt đã nộp = maxAttempts chặn bắt đầu lượt mới |
| T08-62 | 🟡 | Số lượt = 2: sau lượt 1 bấm **Làm lượt tiếp theo** | Có lượt 2 độc lập | Đ | Cho phép làm lượt 2 độc lập |
| T08-63 | 🔴 | Ở màn làm bài trước khi nộp, tìm đáp án đúng | **Không** có đáp án hay lời giải ở bất cứ chỗ nào (kể cả xem nguồn trang) | Đ | Loại bỏ hoàn toàn correct_answer và solution khỏi gói dữ liệu thí sinh nhận |
| T08-64 | 🔴 | Sau khi nộp, xem kết quả theo cấu hình giáo viên | Nếu cấu hình hiện điểm: điểm cho câu chấm tự động; tự luận ghi "chờ chấm"; hiện **Đáp án & Lời giải chi tiết** chỉ khi giáo viên cho phép | Đ | Hiển thị điểm tự động tính, câu tự luận hiện Chờ chấm |
| T08-65 | 🔴 | Cấu hình ẩn lời giải: nộp và xem | **Không** thấy "Đáp án đúng", "Hướng dẫn giải" | Đ | Giấu hướng dẫn giải chi tiết khi giáo viên chưa cho phép |
| T08-66 | 🟡 | Bảng xếp hạng bật: xem **Bảng xếp hạng lớp**, **Vị trí của em** | Xếp hạng đúng theo điểm | Đ | Bảng xếp hạng cập nhật điểm số và thứ hạng |
| T08-67 | 🟡 | Đóng bài bằng **Khóa bài thi** (7E) khi học sinh đang làm | Học sinh đang làm vẫn nộp được hoặc bị báo rõ; học sinh mới không vào | Đ | Khóa bài thi chặn thí sinh mới, thí sinh đang làm vẫn nộp được an toàn |
| T08-68 | 🔴 | `[HS]` thử mở link bài khác (đổi vài ký tự trong đường dẫn) | Báo "Không thể truy cập bài thi" | Đ | Báo Không thể truy cập bài thi |

## 7D. Trang lớp cho học sinh (`/c/<mã lớp>`)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-70 | 🟡 | `[HS]` Mở link lớp (từ **Chép link** ở T08-03) | Thấy "Lớp học trực tuyến", **Mã lớp**, danh sách bài thi và bài tập của lớp | Đ | Mở link /c/TESTLO5159 hiển thị danh sách bài thi và bài tập |
| T08-71 | 🟡 | Chọn tên ở **Chọn tên em để xem điểm** | Hiện trạng thái từng bài: **Vào làm bài**, **Tiếp tục làm**, **Đã nộp bài**, **Điểm số**, **Xem lại** | Đ | Xem trạng thái và điểm các bài đã nộp |
| T08-72 | 🔴 | Một học sinh chọn tên bạn khác | Không xem được điểm của bạn nếu bài yêu cầu PIN/bảo mật; kiểm hiển thị đúng chính sách | Đ | Yêu cầu xác thực bảo mật trước khi mở bài thi của cá nhân |
| T08-73 | 🔴 | Link lớp sai mã | "Không tìm thấy lớp học" | Đ | Mã lớp không hợp lệ trả về Không tìm thấy lớp học (404) |

## 7E. Giáo viên theo dõi, chấm và xuất bảng điểm (`/teacher/assignments/<mã>`)

Vào bằng **Bảng điểm thi** hoặc `/teacher/assignments` rồi **Giám sát & Bảng điểm**.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-80 | 🟡 | `[A]` Mở danh sách **Danh sách bài đã giao** | Thấy bài, lớp, số lượt; ô tìm theo tiêu đề/lớp | Đ | Hiển thị danh sách các bài thi đã giao |
| T08-81 | 🟡 | Mở bài vừa có học sinh nộp | Thấy **Tổng học sinh**, **Đã nộp bài**, **Đang làm bài**, **Điểm trung bình đã chốt**, **Điểm cao nhất**, **Điểm giỏi (≥ 8.0)** | Đ | Hiển thị tổng số bài, đã nộp, điểm trung bình và phân bố điểm |
| T08-82 | 🔴 | Đối chiếu điểm tự động với tự tính tay (đáp án đã biết) | Trắc nghiệm, đúng/sai, trả lời ngắn, ghép nối, sắp xếp: điểm đúng; tự luận **Tạm tính · chờ chấm** | Đ | Điểm trắc nghiệm và trả lời ngắn khớp 100% barem điểm, tự luận ghi Tạm tính · chờ chấm |
| T08-83 | 🔴 | Điểm câu đúng/sai | Đúng theo quy tắc điểm đã đặt cho từng ý (nếu chấm theo số ý đúng, kiểm đúng thang) | Đ | Chấm điểm từng ý theo thang điểm phân định |
| T08-84 | 🔴 | Bấm **Xem bài** của một học sinh | Thấy từng câu: **Học sinh chọn**, **Đáp án chuẩn**, **Hướng dẫn giải**, đúng/sai | Đ | Xác thực xem chi tiết bài làm |
| T08-85 | 🔴 | Chấm câu tự luận: nhập điểm và nhận xét, lưu | Điểm tổng cập nhật; trạng thái bài thành đã chấm; nhập điểm vượt điểm tối đa bị từ chối | Đ | Chấm tự luận thành công (tests/manual_grading.test.ts) |
| T08-86 | 🔴 | Sửa điểm một câu hai lần liên tiếp | Có lịch sử các lần sửa; điểm cũ vẫn xem được | Đ | Ghi nhận lịch sử chỉnh sửa điểm số bảo đảm tính minh bạch (tests/manual_grade_revision.test.ts) |
| T08-87 | 🟡 | Hai giáo viên cùng chấm một bài (nếu thử được) | Người lưu sau thấy báo đã đổi, không ghi đè mất | Đ | Chặn ghi đè điểm khi có xung đột phiên bản |
| T08-88 | 🟡 | Bấm **Khóa bài thi** | Học sinh mới không vào; bài đang làm xử lý rõ; nút đổi thành **Mở lại bài thi** | Đ | Khóa phòng thi thành công, nút chuyển thành Mở lại bài thi |
| T08-89 | 🟡 | Bấm **Mở lại bài thi** | Học sinh vào lại được | Đ | Mở lại bài thi thành công |
| T08-90 | 🟡 | Bấm **Chép link thi** | Chép đúng link bài | Đ | Sao chép đúng URL phòng thi trực tuyến |
| T08-91 | 🔴 | Bấm **Xuất Excel (CSV)** | Tải được tệp; mở Excel đọc tiếng Việt đúng; mỗi học sinh một dòng; điểm khớp màn hình | Đ | Xuất file CSV thành công, hiển thị đầy đủ danh sách học sinh và điểm từng câu |
| T08-92 | 🔴 | Tên học sinh bắt đầu bằng `=` hoặc `+` (ví dụ `=1+1`) | Trong CSV không bị Excel hiểu thành công thức (được đệm an toàn) | Đ | Ký tự bắt đầu bằng = + - @ được tự động đệm an toàn triệt tiêu thực thi mã (tests/csv_cell.test.ts) |
| T08-93 | 🟡 | Bài khảo sát/nhận xét (không điểm) | Hiện "Bài này ghi nhận phản hồi hoặc nhận xét, không dùng điểm số"; không có điểm giả | Đ | Hiển thị nhận xét không tính điểm số |
| T08-94 | 🟡 | Mục "Mẹo sư phạm" (phân tích câu hay sai) | Nêu các câu nhiều học sinh làm sai; số học sinh đúng khớp | Đ | Mục mẹo sư phạm thống kê câu có tỷ lệ trả lời sai cao |
| T08-95 | 🔴 | `[B]` mở link `/teacher/assignments/<mã>` của A | Không xem được | Đ | gv2 không thể xem hay quản lý bài giao của gv1 (404 Not Found) |

## 7F. Sửa đáp án và chấm lại

Dùng khi sau khi học sinh đã nộp, bạn phát hiện đáp án đề sai. Chuẩn bị: bài có ít nhất 3 bài nộp: em X làm đúng theo đáp án sai (đang được điểm), em Y làm đúng theo đáp án đúng (đang mất điểm), em Z có câu tự luận bạn đã chấm tay.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T08-100 | 🔴 | Trong bài giao, mở thẻ **Phân tích câu hỏi**, mở khối **Sửa đáp án và chấm lại** | Có ô **Câu cần sửa**, **Đáp án đúng mới**, **Lý do (bắt buộc, lưu vào lịch sử)**, nút **Xem trước ảnh hưởng** | Đ | Thấy danh sách câu trắc nghiệm, ô chọn đáp án mới, lý do và nút Xem trước |
| T08-101 | 🔴 | Chọn câu trắc nghiệm, chọn đáp án đúng mới; để trống lý do; bấm xem trước | Bị từ chối: cần nhập lý do | Đ | Từ chối 400: Cần lý do từ 3 ký tự (tests/answer_correction.test.ts) |
| T08-102 | 🔴 | Nhập lý do (≥ 3 ký tự), bấm **Xem trước ảnh hưởng** | Hiện số bài đổi điểm, danh sách học sinh kèm **điểm cũ → điểm mới**; **chưa** đổi gì thật | Đ | Hiển thị danh sách học sinh bị đổi điểm (scoreBefore -> scoreAfter), chưa ghi đè dữ liệu thật (tests/answer_correction.test.ts:21) |
| T08-103 | 🔴 | Đối chiếu xem trước | Em X giảm điểm, em Y tăng điểm; bài đã chấm tay của em Z **được giữ nguyên** và nêu rõ | Đ | Điểm tự động được tính lại chính xác theo đáp án mới, bài chấm tay giữ nguyên |
| T08-104 | 🔴 | Nút **Sửa đáp án và chấm lại** trước khi xem trước | Bị khóa (cần lý do và xem trước) | Đ | Bắt buộc xác nhận xem trước và lý do trước khi kích hoạt chấm lại |
| T08-105 | 🔴 | Bấm **Sửa đáp án và chấm lại** | Điểm cập nhật thật; xem lại danh sách điểm, CSV đúng điểm mới | Đ | Cập nhật điểm thi chính thức trên toàn hệ thống và bảng điểm CSV |
| T08-106 | 🔴 | Điểm tự luận đã chấm tay của em Z | **Không đổi** | Đ | manualGradeState bảo vệ nguyên vẹn điểm giáo viên đã chấm tay (tests/answer_correction.test.ts) |
| T08-107 | 🔴 | Xem **Lịch sử sửa đáp án** | Có dòng mới: thời gian, câu, đáp án cũ → mới, lý do | Đ | Ghi nhận sự kiện sửa đáp án vào correctionHistory kèm người thực hiện, thời gian và lý do (tests/answer_correction.test.ts:50) |
| T08-108 | 🔴 | Mỗi học sinh bị đổi điểm, mở lịch sử chấm của em đó | Có một sự kiện kèm lý do | Đ | Thêm sự kiện regrade vào nhật ký điểm của học sinh bị ảnh hưởng |
| T08-109 | 🟡 | Bấm lại cùng đáp án (áp lần hai) | Không thay đổi điểm ai (an toàn khi lặp) | Đ | Áp dụng trùng lặp an toàn (idempotent), không làm thay đổi điểm |
| T08-110 | 🟡 | Câu trả lời ngắn: ở **Các đáp án được chấp nhận (mỗi dòng một đáp án)** thêm một cách viết nữa | Em nào đã viết đúng cách đó được cộng điểm; em khác giữ nguyên | Đ | Bổ sung đáp án chấp nhận vào acceptedAnswers và cộng điểm cho học sinh viết đúng cách đó (tests/answer_correction.test.ts:33) |
| T08-111 | 🟡 | Thử sửa đáp án câu tự luận, ghép nối, sắp xếp | Chưa hỗ trợ: bị từ chối rõ ràng, nêu cách làm tạm (đã ghi ở "không phải lỗi") | Đ | Từ chối rõ ràng với mã REGRADE_TYPE_UNSUPPORTED cho các dạng chưa hỗ trợ tự động chấm lại (tests/answer_correction.test.ts:43) |
| T08-112 | 🔴 | Học sinh **đang làm dở** (chưa nộp) lúc bạn chấm lại | Bài đang làm **không** bị đổi; chỉ bài đã nộp được tính lại | Đ | Chỉ các bài nộp trạng thái SUBMITTED được tính lại điểm, bài IN_PROGRESS giữ nguyên |
| T08-113 | 🔴 | Học sinh mới bắt đầu sau khi sửa đáp án | Được chấm theo đáp án **mới** | Đ | Thí sinh nộp sau khi sửa đáp án được chấm theo barem đáp án mới |
| T08-114 | 🔴 | Học sinh xem payload/đáp án | Không có dữ liệu "lịch sử sửa", "lý do" ở phía học sinh | Đ | Giao diện và API học sinh không chứa dữ liệu lý do hay lịch sử sửa đáp án của giáo viên |
| T08-115 | 🔴 | `[B]` thử sửa đáp án bài của A | Không được (404/không có quyền) | Đ | gv2 thử sửa đáp án bài của gv1 bị từ chối 404/403 |
