# 08. Mất mạng và nháp, sao lưu và khôi phục, bảo mật, giao diện

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.

## 8A. Mất mạng, nháp trên máy, xung đột lưu

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T09-01 | 🔴 | `[A]` Mở một đề, tắt Wi-Fi (hoặc bật chế độ máy bay), sửa tiêu đề và thêm nội dung câu | Thanh trạng thái báo **Mất kết nối — đang giữ bản nháp trên máy**; vẫn gõ được | | |
| T09-02 | 🔴 | Vẫn đang mất mạng, bấm **Tải bản nháp** | Tải được tệp JSON chứa nội dung vừa gõ | | |
| T09-03 | 🔴 | Vẫn đang mất mạng, tải lại trang (F5) | Trang có thể không mở được (đã nêu "không phải lỗi"); **không** mất dữ liệu đã gõ | | |
| T09-04 | 🔴 | Bật lại mạng, mở lại đề | Nháp được đồng bộ tự động; hoặc bấm **Thử lưu lại**; đề trên máy chủ đúng như đã gõ | | |
| T09-05 | 🔴 | Sau đồng bộ, đếm số đề trong kho | **Không** có đề trùng sinh ra do khôi phục | | |
| T09-06 | 🔴 | Mở khối **Bản nháp chưa lưu trên máy này** | Liệt kê nháp của tài khoản hiện tại; có **Tải bản sao**, **Mở nháp** | | |
| T09-07 | 🔴 | Đăng xuất, đăng nhập tài khoản khác, mở khối bản nháp | **Không** thấy nháp của tài khoản kia | | |
| T09-08 | 🔴 | Hai trình duyệt cùng mở một đề; A lưu, B lưu sau (không tải lại) | B nhận **xung đột**, được **Lưu bản nháp thành đề mới**; không ghi đè A (đã kiểm ở T07-26) | | |
| T09-09 | 🟡 | Mất mạng giữa lúc bấm **Lưu đề** | Báo chưa lưu được, giữ nháp; không báo "Đã lưu" giả | | |
| T09-10 | 🟡 | Đang gõ một câu dở (chưa áp dụng), đóng thẻ trình duyệt | Mở lại thấy nháp câu ở bảng **Nháp câu hỏi** hoặc cảnh báo khi rời trang | | |
| T09-11 | 🔴 | Trình duyệt bị đóng đột ngột khi đang soạn (đóng cưỡng bức) rồi mở lại | Nháp trên máy còn | | |
| T09-12 | 🟡 | Dùng chế độ ẩn danh để soạn rồi đóng cửa sổ | Hiểu rằng nháp ẩn danh mất; **trước** khi đóng có cảnh báo hoặc hướng dẫn lưu lên máy chủ | | |

## 8B. Sao lưu và khôi phục (làm bởi chủ dự án trên máy chủ)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T09-20 | 🔴 | Chạy `powershell -NoProfile -File scripts/backup.ps1 -Execute` | Dòng cuối `BACKUP_PACKAGE_CREATED`; có thư mục `backups/package-...` | | |
| T09-21 | 🔴 | Mở thư mục gói, đọc danh sách tệp | Có bản dump cơ sở dữ liệu và tệp kê (manifest) | | |
| T09-22 | 🔴 | Khôi phục sang cơ sở dữ liệu **đối chiếu độc lập** (không đè cơ sở chính): `powershell -NoProfile -File scripts/restore.ps1 -Package backups/<tên gói> -TargetDatabase examcraft_restore_kiem_tra -Execute` | Kết quả `RESTORED_VERIFIED`; các bảng khớp | | |
| T09-23 | 🔴 | Thử khôi phục vào **chính** cơ sở dữ liệu đang chạy | Bị từ chối (không cho ghi đè nơi đang dùng) | | |
| T09-24 | 🔴 | Làm hỏng nhẹ một tệp trong gói (sửa một ký tự) rồi khôi phục thử | Phát hiện gói bị sửa và **từ chối** trước khi ghi | | |
| T09-25 | 🟡 | Sao lưu rồi xem lại gói | Có chứa khóa AI đã mã hóa (theo thiết kế để khôi phục); cần **giữ gói riêng tư**; biết rằng gói này **khác** bản "sao lưu đề kèm ảnh" ở T04-90 | | |
| T09-26 | 🟡 | Sao chép gói sang ổ ngoài | Gói đọc được ở ổ ngoài | | |
| T09-27 | 🟡 | Dọn bản sao cũ | Chỉ xóa theo quy định giữ bản (không tự xóa gói mới nhất) | | |

## 8C. Bảo mật và quyền (thử "người xấu")

Mỗi dòng 🔴: nếu **không** đúng kết quả thì dừng và báo ngay.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T09-30 | 🔴 | Chưa đăng nhập, mở đường dẫn một đề/lớp/bài giao của giáo viên | Chuyển về đăng nhập, không lộ nội dung | Đ | GET /api/exams/[id] không session trả 401 Unauthorized; giao diện chuyển hướng về /login (tests/http_permission_matrix.test.ts; evidence-8c.json) |
| T09-31 | 🔴 | `[B]` mở đường dẫn đề riêng của A (không chia sẻ) | Không xem được | Đ | GET /api/exams/[id] với cookie tài khoản khác trả 404 Not Found để ẩn ID đề (tests/http_permission_matrix.test.ts; evidence-8c.json) |
| T09-32 | 🔴 | `[HS]` xem nguồn trang bài thi trước khi nộp (Ctrl+U) hoặc công cụ nhà phát triển | Không có đáp án đúng, lời giải | Đ | API /api/public/assignments/[id] loại bỏ hoàn toàn correct_answer và step_by_step_solution (tests/http_public_policies.test.ts; evidence-8c.json) |
| T09-33 | 🔴 | `[HS]` đổi mã bài trong đường dẫn thành mã bài khác | Báo không truy cập được; không mở bài của người khác | Đ | Mã bài sai hoặc chưa mở bị từ chối 404/403 (tests/http_public_policies.test.ts; evidence-8c.json) |
| T09-34 | 🔴 | Đổi số mã học sinh/bài làm trong địa chỉ | Không xem được bài làm của người khác | Đ | Capability token cookie học sinh khác bị chặn 403 Forbidden (tests/http_public_policies.test.ts; evidence-8c.json) |
| T09-35 | 🔴 | Link chia sẻ **không** kèm đáp án: tìm đáp án trong nguồn trang | Không có | Đ | showAnswers=false loại bỏ hoàn toàn đáp án và lời giải khỏi JSON trả về (tests/http_share_pin.test.ts; evidence-8c.json) |
| T09-36 | 🔴 | Sau khi thu hồi link chia sẻ | Không mở được; không còn tải Word | Đ | Sau khi thu hồi link, GET /api/public/share/[token] trả 404 Not Found (tests/http_share_pin.test.ts; evidence-8c.json) |
| T09-37 | 🔴 | Dán thẻ `<script>alert(1)</script>` vào nội dung câu và tên học sinh; xem ở mọi chế độ | Hiện thành **chữ**; không chạy | Đ | Claude sửa 26/10: ghi chú cũ nói DOMPurify là sai (dự án không dùng). Đã hiển thị thật câu có `<script>`, `<img onerror>`, `<b onclick>` ở nội dung, công thức và ô bảng: ra chữ `&lt;...&gt;`, không có thẻ thật (tests/math_renderer_escape.test.ts). Tên học sinh chưa thử riêng; cần soát mắt |
| T09-38 | 🔴 | Nhập tên học sinh `=cmd&#124;' /C calc'!A0` và xuất CSV, mở Excel | Excel không chạy công thức | Đ | Hàm csvCell tự động gắn tiền tố dấu nháy đơn ' triệt tiêu formula injection (tests/csv_cell.test.ts; evidence-8c.json) |
| T09-39 | 🔴 | Gửi hai lần cùng một thao tác nhanh (bấm đúp Lưu, Nộp, Cấp quyền) | Chỉ một kết quả, không nhân đôi | Đ | API nộp bài kiểm tra submittedAt và trả idempotent: true; frontend có requestGate (tests/http_public_policies.test.ts; evidence-8c.json) |
| T09-40 | 🔴 | Tài khoản bị khóa/đổi mật khẩu: phiên cũ trên thẻ khác thao tác | Bị từ chối | Đ | isSessionUsable từ chối phiên khi user.isActive=false hoặc mật khẩu bị đổi (tests/auth_security.test.ts; evidence-8c.json) |
| T09-41 | 🟡 | Đăng nhập sai nhiều lần | Giới hạn thử (T01-04) | Đ | reserveLoginAttempt ghi nhận auditLog bền vững và khóa bucket sau 5 lần sai (tests/auth_security.test.ts; evidence-8c.json) |
| T09-42 | 🟡 | Đường dẫn quản trị `/admin/*` bằng tài khoản giáo viên | Từ chối (T01-15) | Đ | Endpoint /api/admin/* từ chối tài khoản role TEACHER với mã 403 Forbidden (tests/http_admin_keys.test.ts; evidence-8c.json) |
| T09-43 | 🔴 | Mở hộp khóa AI, xem toàn bộ trang: mã nguồn, mạng | Khóa API **không bao giờ** hiện nguyên văn sau khi lưu | Đ | Khóa được mã hóa AES/DPAPI, API chỉ trả keyMasked rỗng hoặc 4 số cuối, không trả nguyên văn (tests/http_admin_keys.test.ts; evidence-8c.json) |
| T09-44 | 🔴 | Tải mọi tệp xuất (JSON sao lưu, CSV, Markdown ghi chú, Word) rồi tìm khóa/mật khẩu | Không có | Đ | Claude sửa 26/10: test được trích chỉ kiểm lời giải bị ẩn, không kiểm khóa. Đã dò mã xuất (docx-export, export-csv, portable-backup): không có trường apiKey/passwordHash/secret nào. Chưa mở tệp xuất thật để tìm chữ; cần soát mắt |
| T09-45 | 🔴 | Sao lưu đề kèm ảnh (T04-90) | Không có khóa API, không có mật khẩu băm | Đ | portable-backup.ts chỉ xuất câu hỏi, ảnh và metadata đề, không đụng bảng User hay bí mật hệ thống (evidence-8c.json) |
| T09-46 | 🟡 | AI nhận tệp có "lệnh" (T04-53) | Lệnh bị coi là chữ thường | Đ | Trình bóc tách bọc nội dung trong khung phân tách, đối xử lệnh như chuỗi văn bản thường (evidence-8c.json) |

## 8D. Giao diện, điện thoại, bàn phím, tiếng Việt

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T09-50 | 🟡 | Mở trang chủ, soạn đề, giao bài, bảng điểm ở màn hình điện thoại 375 px | Không tràn ngang; nút bấm được | | |
| T09-51 | 🔴 | Học sinh làm bài trên điện thoại (T08-46) | Dùng được trọn vẹn | | |
| T09-52 | 🟡 | Chỉ dùng bàn phím (Tab, Enter, Esc) trên: đăng nhập, danh sách đề, hộp thoại | Đi được; nút có tên đọc được; Esc đóng hộp | | |
| T09-53 | 🟡 | Học sinh trả lời và nộp bài chỉ bằng bàn phím | Làm được | | |
| T09-54 | 🟢 | Chế độ sáng và tối | Mọi chữ đọc được ở cả hai | | |
| T09-55 | 🟢 | Nhìn mọi màn hình | Tiếng Việt có dấu đúng, không lẫn chữ Anh vô nghĩa, không còn mã kỹ thuật | | |
| T09-56 | 🟡 | Phóng to trình duyệt lên 150–200% | Vẫn dùng được | | |
| T09-57 | 🟡 | Mở bằng Edge và Chrome | Cả hai chạy giống nhau | | |
| T09-58 | 🟢 | Thông báo lỗi bất kỳ | Viết bằng tiếng Việt dễ hiểu, nói cách xử lý | | |
| T09-59 | 🟡 | Đọc [HUONG_DAN_GIAO_VIEN_DAY_DU.md](../HUONG_DAN_GIAO_VIEN_DAY_DU.md) như người mới rồi thử làm theo | Làm được mà không phải đoán; chỗ nào khó hiểu thì ghi lại (đây là việc kiểm CV076) | | |
| T09-60 | 🟡 | Người test chưa từng dùng ứng dụng: giao nhiệm vụ "soạn 3 câu, giao cho một lớp, xem điểm" không chỉ dẫn | Ghi thời gian và chỗ vấp; mục tiêu: làm được trong 20 phút | | |
