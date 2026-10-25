# TÀI LIỆU THIẾT KẾ KỸ THUẬT: TÙY CHỌN ĐỒNG BỘ GOOGLE DRIVE (CV075)

*Tài liệu thiết kế kiến trúc và danh mục nhiệm vụ tồn đọng (Design Specification & Backlog) — Dự án ExamCraft*
*Căn cứ phân công điều phối: Nhiệm vụ GEM-X5 (P2, Generation 16), hoàn thiện tiêu chí CV075*

- Người thực hiện: Gemini (Kiến trúc & Phân tích hệ thống)
- Thời điểm cập nhật chốt: 2026-10-26T00:00:00Z
- Trạng thái kỹ thuật: BẢN THIẾT KẾ CHỐT (CHƯA TRIỂN KHAI MÃ NGUỒN)
- Tuyên bố bắt buộc:
  1. Ứng dụng không yêu cầu Google Drive để hoạt động. Mọi tính năng tạo đề, quản lý câu hỏi, làm bài và xuất bản đều hoạt động bình thường, độc lập hoàn toàn ở chế độ cục bộ (local/offline).
  2. Tính năng kết nối Google Drive hiện tại chưa triển khai trong mã nguồn, được lưu trữ dưới dạng backlog kỹ thuật và thiết kế chuẩn bị cho giai đoạn sau pilot khi có quyết định phê duyệt của chủ dự án.

---

## 1. Mục tiêu và nguyên tắc kiến trúc

1. Mục tiêu:
   - Cung cấp tùy chọn phụ trợ cho giáo viên muốn đồng bộ và lưu trữ dự phòng các gói sao lưu đề thi lên tài khoản Google Drive cá nhân.
   - Tránh thất thoát tài nguyên sư phạm khi chuyển đổi máy tính công tác hoặc cài đặt lại môi trường máy chủ cục bộ.
2. Nguyên tắc bảo mật và quyền riêng tư:
   - Nguyên tắc đặc quyền tối thiểu (Least Privilege): Chỉ yêu cầu quyền đối với các tệp do chính ứng dụng tạo ra.
   - Quyền tự chủ dữ liệu (Self-Sovereign Data): Toàn bộ dữ liệu nằm trên Drive cá nhân của giáo viên; hệ thống không chuyển tiếp hay lưu giữ dữ liệu trên bất kỳ máy chủ trung gian nào của bên thứ ba.
   - Bảo vệ dữ liệu học sinh và bí mật hệ thống: Gói sao lưu hiện có của hệ thống là bản trích xuất toàn diện cơ sở dữ liệu (chứa cả học sinh, bài làm và khóa API mã hóa). Do đó, khi đưa gói này lên Drive cá nhân, bắt buộc phải có cơ chế mã hóa mật khẩu bảo vệ để tuân thủ quyền riêng tư giáo dục.

---

## 2. Định dạng gói đồng bộ (Dựa trên gói sao lưu cục bộ hiện có)

Tính năng Drive Sync kế thừa và tái sử dụng trực tiếp cấu trúc gói sao lưu chuẩn của dự án được quy định tại docs/van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md và scripts/backup-package.cjs:

1. Cấu trúc thư mục gói sao lưu (Package Structure):
   - manifest.json: Tệp thông tin định danh và băm kiểm tra toàn vẹn (SHA-256) của gói:
     - status: BACKUP_PACKAGE_CREATED
     - createdAt: Thời điểm tạo bản sao lưu (chuẩn ISO UTC).
     - sourceDatabase: Tên cơ sở dữ liệu nguồn (examcraft).
     - sourceTables: Bảng kiểm kê toàn bộ các bảng trong CSDL kèm số dòng và mã băm digest.
     - publicFiles: Danh sách các tệp hình ảnh, tài nguyên đi kèm (đường dẫn tương đối, dung lượng bytes, mã băm sha256).
     - backup: Chứa đường dẫn tương đối, dumpBytes, dumpSha256 và dpapiSha256.
   - database.dump: Tệp trích xuất toàn bộ cơ sở dữ liệu PostgreSQL ở định dạng custom dump (lệnh pg_dump --format=custom --dbname examcraft). Tệp này bao gồm toàn bộ dữ liệu nghiệp vụ của hệ thống: tài khoản người dùng, danh sách học sinh, bài giao, lượt làm bài, câu trả lời, ngân hàng câu hỏi, đề thi, ma trận, ngữ liệu và nhật ký hệ thống.
   - public/: Thư mục chứa toàn bộ các tệp tài sản hình ảnh minh họa (figures) được nhúng trong đề thi.
   - config.dpapi: Tệp cấu hình biến môi trường (.env) được mã hóa bảo vệ qua Windows DPAPI (chỉ có thể giải mã trên cùng máy trạm và cùng danh tính người dùng Windows đã tạo).

2. Tính toàn vẹn và an toàn đường dẫn:
   - Tuân thủ quy tắc kiểm tra nghiêm ngặt của bộ công cụ backup-package-tools: Từ chối mọi tệp có đường dẫn thoát ra ngoài thư mục gói (chặn path traversal ../).
   - Bắt buộc kiểm tra khớp mã băm SHA-256 trước khi giải nén hoặc khôi phục dữ liệu vào cơ sở dữ liệu.

---

## 3. Phân quyền OAuth 2.0 tối thiểu (Least Privilege Scope)

1. Scope duy nhất được phép sử dụng:
   - https://www.googleapis.com/auth/drive.file
   - Ý nghĩa: Ứng dụng chỉ có quyền tạo mới, đọc, cập nhật và xóa các tệp do chính ứng dụng ExamCraft tạo ra trên Google Drive của người dùng.
   - Cam kết bảo mật: Ứng dụng không có quyền truy cập, đọc danh sách hay chỉnh sửa bất kỳ tệp cá nhân nào khác của người dùng trên Drive.

2. Các scope tuyệt đối bị cấm:
   - Cấm sử dụng https://www.googleapis.com/auth/drive (toàn quyền truy cập Drive).
   - Cấm sử dụng https://www.googleapis.com/auth/drive.readonly (đọc toàn bộ kho lưu trữ của người dùng).

3. Quản lý thư mục trên Drive:
   - Ứng dụng tạo thư mục chuyên dụng mang tên ExamCraft Backups trên Drive của giáo viên.
   - Các gói sao lưu được tải lên dưới dạng tệp nén mang tên có cấu trúc: examcraft-backup-YYYYMMDD-HHMMSS.zip.

---

## 4. Máy trạng thái sao lưu và khôi phục (Backup & Restore State Machine)

Quá trình tương tác giữa máy khách ExamCraft và Google Drive được mô hình hóa thành máy trạng thái hữu hạn gồm các trạng thái rõ ràng:

1. IDLE (Sẵn sàng): Trạng thái nghỉ. Chưa có thao tác đồng bộ nào đang chạy.
2. CONNECTING (Đang kết nối): Đang thực hiện luồng trao đổi token OAuth 2.0 hoặc làm mới Access Token từ Refresh Token.
3. PREPARING_PACKAGE (Đang đóng gói): Đang tạo gói sao lưu cục bộ, tính mã băm SHA-256 và nén dữ liệu.
4. UPLOADING (Đang tải lên): Đang truyền luồng dữ liệu gói nén lên Google Drive qua Google Drive REST API.
5. SYNCED (Đã đồng bộ): Quá trình tải lên thành công, mã tệp Drive và thời gian đồng bộ được lưu vào nhật ký cục bộ.
6. CONFLICT (Phát hiện xung đột): Phiên bản trên Drive có thời gian cập nhật mới hơn bản sao lưu hiện tại của máy cục bộ; hệ thống yêu cầu giáo viên xác nhận ghi đè hoặc đổi tên bản sao lưu.
7. RESTORE_PREVIEW (Xem trước khôi phục): Đã tải gói từ Drive về vùng tạm; hiển thị thông tin manifest (số lượng đề, câu hỏi, ngày sao lưu) để giáo viên xác nhận trước khi phục hồi.
8. RESTORING (Đang khôi phục): Đang nạp dữ liệu vào cơ sở dữ liệu theo quy trình kiểm tra toàn vẹn nghiêm ngặt.
9. RESTORED (Đã khôi phục thành công): Cơ sở dữ liệu và thư mục tài nguyên đã được cập nhật hoàn tất.
10. ERROR (Lỗi): Xảy ra lỗi mất mạng, hết hạn ngạch Drive, token bị thu hồi hoặc gói dữ liệu bị hỏng (mã băm không khớp). Hiển thị thông báo thân thiện và giữ nguyên dữ liệu hiện tại.

---

## 5. Danh mục nhiệm vụ tồn đọng kỹ thuật (Technical Backlog)

Khi chủ dự án quyết định triển khai tính năng Google Drive, các đầu việc kỹ thuật cần thực hiện theo thứ tự:

| Mã việc | Tên nhiệm vụ | Chi tiết kỹ thuật cần làm | Ghi chú an toàn |
|---|---|---|---|
| DRV-01 | Đăng ký Google Cloud Console Project | Tạo dự án trên GCP, cấu hình màn hình đồng ý OAuth (Consent Screen), khai báo scope drive.file, nhận Client ID và Client Secret. | Dùng chế độ Testing nội bộ, không công khai public |
| DRV-02 | Lưu trữ bảo mật OAuth Token | Tạo bảng UserDriveConnection trong schema Prisma; mã hóa Refresh Token bằng thuật toán AES-256-GCM trước khi lưu vào DB. | Khóa mã hóa lấy từ biến môi trường máy chủ |
| DRV-03 | API Endpoints kết nối và ngắt kết nối | Xây dựng route /api/drive/auth/url, /api/drive/auth/callback, /api/drive/disconnect. | Hỗ trợ nút ngắt kết nối và thu hồi token tức thì |
| DRV-04 | Dịch vụ đóng gói và đồng bộ nền | Viết module drive-sync-service đóng gói thư mục backup theo chuẩn manifest.json và đẩy lên Drive qua multipart upload. | Chặn path traversal; ghi nhật ký trạng thái |
| DRV-05 | Giao diện quản lý Drive tại Cài đặt | Thêm panel Đồng bộ Google Drive trong trang Cài đặt; hiển thị trạng thái kết nối, nút Sao lưu ngay, danh sách bản sao lưu trên Drive. | Bố trí nhãn rõ ràng; có nút Khôi phục kèm xác nhận |
| DRV-06 | Kiểm thử hồi quy tự động | Viết bộ kiểm thử HTTP mock các phản hồi của Google Drive API; kiểm tra kịch bản mất mạng giữa chừng, token hết hạn và băm lỗi. | Không gọi API thật của Google trong test |

---

## 6. Quyết định chủ dự án cần chọn

Để làm căn cứ phê duyệt đưa vào triển khai thực tế, Chủ dự án chỉ cần lựa chọn các vấn đề kiến trúc sau:

1. Phạm vi dữ liệu đưa lên Google Drive:
   - Lựa chọn A: Đưa nguyên gói sao lưu toàn bộ (Full DB package theo scripts/backup.ps1 chứa toàn bộ CSDL gồm học sinh, bài làm, bảng điểm và cấu hình mã hóa; bắt buộc phải đặt mật khẩu mã hóa bảo vệ khi tải lên đám mây).
   - Lựa chọn B: Chỉ trích xuất riêng gói tài nguyên sư phạm (Chỉ xuất đề thi, câu hỏi, ngữ liệu, mẫu đề dưới dạng JSON thuần túy; hoàn toàn không chứa thông tin học sinh, bài làm hay khóa bí mật).

2. Phương thức lưu trữ ưu tiên:
   - Lựa chọn A: Chỉ sử dụng tính năng Xuất/Nhập gói sao lưu thủ công cục bộ (.zip) về máy tính cá nhân (Đơn giản, an toàn tuyệt đối, không phụ thuộc Google).
   - Lựa chọn B: Tích hợp thêm tùy chọn đồng bộ Google Drive cá nhân theo bản thiết kế trên (Thuận tiện khi chuyển đổi máy, cần duy trì kết nối OAuth).

3. Cơ chế kích hoạt sao lưu:
   - Lựa chọn A: Sao lưu thủ công theo yêu cầu (Chỉ sao lưu khi giáo viên chủ động bấm nút yêu cầu sao lưu).
   - Lựa chọn B: Sao lưu tự động định kỳ (Hệ thống tự động sao lưu mỗi tuần một lần khi có kết nối mạng).

4. Mã hóa bảo mật gói sao lưu:
   - Lựa chọn A: Giữ nguyên gói nén tiêu chuẩn (Dễ kiểm tra cấu trúc cục bộ).
   - Lựa chọn B: Bổ sung tùy chọn đặt mật khẩu mã hóa (AES-GCM) trước khi tải lên Drive (Chống lộ đề và bảo vệ dữ liệu ngay cả khi Drive bị người khác truy cập).
