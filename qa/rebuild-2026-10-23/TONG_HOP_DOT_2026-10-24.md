# Tổng hợp đợt làm 24/10/2026

Dành cho chủ dự án. Các báo cáo con chỉ cần mở khi muốn xem chi tiết. Mọi kiểm tra dùng DB thử và server thử cô lập, không gọi AI thật, không ghi DB chính; server thử đã dừng.

## 1. Kết quả một câu mỗi việc

| Việc | Kết quả | Trạng thái CV |
|---|---|---|
| Chấm tay, hai người cùng chấm (CV060/061) | Đã kiểm trên giao diện thật: tab cũ bị từ chối và giữ số đang nhập, điểm và lịch sử đúng | Giữ mở (còn phân trang/khôi phục điểm, đính chính đáp án, gia hạn) |
| Sao chép từ link chia sẻ (CV048) | **Đã sửa lỗi**: trước đó chỉ lưu trên trình duyệt, nay tạo đề trong kho trên máy chủ | Giữ mở, cần bạn quyết một chính sách (mục 3) |
| Giữ nháp học sinh khi đóng tab / mất mạng (CV057) | **Đã làm**: mở lại cùng trình duyệt thì khôi phục và tự lưu lại | Giữ mở (còn xung đột trên UI, hai browser độc lập) |
| Dọn hồ sơ (CV077 một phần) | 103 liên kết `F:/…` thành tương đối, 38 báo cáo cũ có ghi chú lịch sử, bỏ nút `/room` 404 | Giữ mở (chưa dọn đường cũ trong mã) |
| Hồ sơ (một nơi cho số liệu) | Checklist, 02, tiến độ cập nhật; nhật ký cũ chuyển vào `docs/lich-su/` | — |

## 2. Chi tiết ngắn từng phần

**Chấm tay.** Tab A đổi điểm câu tự luận 2.5 → 2.25 (tổng 9.25, ghi lịch sử). Tab B còn trang cũ nhập 1.75 bị từ chối, điểm trong DB không đổi, ô vẫn giữ 1.75, có thông báo "đã được sửa ở trang khác". Tab A đổi lại 2.5 (tổng về 9.5, lịch sử đủ hai dòng đúng thứ tự). Lint nhóm chấm: file mới sạch, chỉ trang giáo viên còn lỗi cũ. [MANUAL_GRADE_CAS_AND_HISTORY](MANUAL_GRADE_CAS_AND_HISTORY.md).

**Sao chép từ link chia sẻ.** Route mới `POST /api/public/share/[id]/copy`: phải đăng nhập, đúng nguồn gốc yêu cầu, đúng tài khoản, link còn hạn và chủ cho phép sao chép. Mỗi người một bản cho mỗi link (bấm lại không tạo thêm). Bản sao không mang gói kiến thức, kế hoạch đề hay mã kiến thức riêng, mọi câu về trạng thái nháp, giữ điểm 0. Đã thử bằng bộ kiểm HTTP (từ chối khi chưa đăng nhập/khác origin/sai tài khoản/link không cho phép; đề gốc không đổi) và bấm thật trên giao diện. [SHARE_COPY](SHARE_COPY.md).

**Giữ nháp học sinh.** Trình duyệt lưu các câu chưa được máy chủ xác nhận. Mở lại thì: trùng máy chủ thì dùng máy chủ; máy chủ chưa đổi thì khôi phục; máy chủ đã đổi ở nơi khác thì báo xung đột, không gộp, không ghi đè. Thử thật: làm giả mất kết nối, điền một câu, đóng trang, mở lại → câu đó hiện lại kèm thông báo, 15 giây sau máy chủ nhận; nộp xong thì xóa. [STUDENT_DRAFT_JOURNAL](STUDENT_DRAFT_JOURNAL.md).

**Dọn hồ sơ.** Liên kết trong tài liệu dùng được trên máy khác và trên GitHub; báo cáo `qa/` cũ không còn dễ bị đọc nhầm là tiến độ hiện tại; trang link cũ `/test/[id]` không còn nút dẫn tới trang không tồn tại.

## 3. Cần bạn quyết định

1. **Chính sách đáp án của bản sao.** Hiện tại: bản sao chỉ mang đáp án/lời giải khi link được bật "hiện đáp án"; nếu link ẩn đáp án thì bản sao bị xóa các phần đó và giáo viên phải nhập lại. Lý do: tránh lộ đáp án ngoài chính sách chủ đề đã chọn. Nếu bạn muốn "cho sao chép" luôn kèm đáp án thì đổi một chỗ ở `src/lib/share-copy.ts`.
2. **Model AI mặc định đang lệch** (CV032): DB mặc định `gemini-3.5-flash`, mã nguồn mặc định `gemini-3.8-flash` và danh sách chọn không có 3.5. Tài khoản chưa tự chọn sẽ gọi 3.5-flash. Cần chọn một mặc định và kiểm với project của bạn trước khi đổi; mình chưa động vào dữ liệu người dùng.

## 4. Kiểm sau sửa cuối

| Kiểm | Kết quả |
|---|---|
| Kiểm thử nền (không DB/AI) | 219/219 đạt ([log](safe-student-journal.log)) |
| Kiểm thử API trên server thử | 18/18 đạt ([log](http-student-journal.log)) |
| Build production | 46 trang đạt ([log](build-student-journal.log)) |
| TypeScript và lint trang `/test` | Đạt sau sửa cuối |
| Lint | File mới sạch; trang học sinh và trang chia sẻ không thêm vấn đề mới so với trước (14 cũ) |

Các thay đổi nhỏ sau lần build cuối (xóa nút ở `/test/[id]`, sửa tài liệu) đã qua TypeScript và lint nhưng không chạy lại build đầy đủ.

## 5. Phát hiện và việc còn lại

- **Build có thể sập trên máy này:** 3 lần build mặc định (11 tiến trình song song) bị Node tự dừng khi máy chỉ còn khoảng 800MB RAM trống; build chạy được khi tạm đặt `experimental.cpus: 2` (đã hoàn lại, không commit). Nếu cần build thường xuyên trên máy này, nên đặt giá trị đó vĩnh viễn hoặc đóng bớt ứng dụng. Cần bạn đồng ý mới sửa `next.config.ts`.
- **Bộ kiểm thử phụ thuộc `pwsh`:** đã sửa để dùng `powershell` có sẵn khi không có `pwsh`. Qua đó cũng thấy script khôi phục chạy được bằng PowerShell 5.1 (trường hợp đích sai).
- **Còn mở theo thứ tự đề nghị:** (1) CV057 dựng xung đột nhật ký trên UI và thử hai browser độc lập; (2) CV010/011 offline/nhiều tab; (3) CV025 mỗi lần lưu đề ghi lại phiên bản của mọi câu (cần đo trước khi đổi); (4) nội dung theo sổ nguồn, tìm giáo viên/mẫu thực tế.
- **Dữ liệu thử còn lại trong DB thử:** bài giao thử `cmvlzp3sk0001tb4o3zm7hck5` và một lượt nộp của học sinh giả; một số dòng câu hỏi mồ côi do xóa bản sao thử. Không ảnh hưởng DB chính.

## 6. Git

Nhánh local `rebuild/2026-10-local`, chưa push; `main` vẫn ở `bb831f2`. Các commit trong đợt này: sao chép từ link chia sẻ, nhật ký nháp học sinh, liên kết/ghi chú lịch sử, cùng các commit hồ sơ. `.env` và `backups/` không vào commit.
