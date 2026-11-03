# Tự xem bản chat AI mới

Bản mã: `F:/Workspace/Zazz/ExamCraft/tmp/chat-ai-v2`, nhánh `codex/chat-ai-v2`. Không dùng thư mục Codex cũ ở ổ C để chạy bản này.

## Đúng bản, đúng cổng

- Cổng **3123** dành cho bản chat AI V2 này khi bàn giao chạy local. Cổng 3117/3122 và web Vercel không được thay bằng đợt này.
- Trong lúc Codex chạy tự động, 3123 là máy chủ DB thử, AI giả; không nhập khóa thật vào máy chủ tự động đó. Chỉ tự thử sau thông báo cuối và xem trạng thái máy chủ trong báo cáo.
- Bản cho bạn thử dùng **DB thử tách riêng** và tài khoản thử được cấp trong thông báo cuối. Bí mật mã hóa ổn định được đọc từ cấu hình local hiện có của `tmp/canva-a/.env`; không chép hoặc đổi tệp cấu hình, không xoay bí mật. Tài khoản dữ liệu chính không dùng để đăng nhập ở đây. Khi chính bạn gửi AI, nhà cung cấp có thể tính lượt/phí theo khóa của bạn; bộ kiểm của Codex không gọi AI thật.

## Tự mở lại nếu máy chủ đã tắt

Dán hai dòng trong PowerShell:

```powershell
Set-Location -LiteralPath 'F:/Workspace/Zazz/ExamCraft/tmp/chat-ai-v2'
& 'C:/nvm4w/nodejs/node.exe' --import tsx qa/rebuild-2026-11-03/ai-chat-completion/manual-preview.cjs 'F:/Workspace/Zazz/ExamCraft/tmp/canva-a/.env' --user-preview
```

Mở <http://localhost:3123> trong cửa sổ riêng tư để không thay phiên đăng nhập cũ ở cổng khác. Lần đầu script tạo tài khoản thử riêng và chỉ hiện mật khẩu trong cửa sổ chạy; lần sau giữ tài khoản/mật khẩu cũ. Chưa xóa dữ liệu bạn thử nhập. Không dùng DB thử cho tài liệu làm việc chính thức. Nếu cổng đang bận, không tắt các tiến trình lạ; hỏi bản nào đang chạy. Không chạy CI/HTTP/browser vào máy chủ ứng dụng thường. Máy chủ cho người dùng có `isolatedTest=false` dù dùng DB thử, để bộ kiểm tự động từ chối chạy nhầm vào chế độ có thể gọi AI thật. Các bộ kiểm luôn phải mở máy chủ cô lập/AI giả riêng sau guard DB thử.

## Bạn chỉ cần thử các bước này

1. Tạo đề mới rồi chưa làm gì: không tự đặt Toán/lớp 6 và không tạo đề rác trong kho.
2. Gõ yêu cầu tự nhiên đủ rõ; ví dụ môn, kỳ thi, năm/địa phương. Nếu AI hỏi thêm, thử cả nút lựa chọn và tự nhập. Kiểm xem có hỏi lặp hoặc hiểu sai lớp kiến thức không.
3. Xem thông tin, nội dung, đáp án/điểm trước khi nhận cả đề; nhãn luyện tập phải rõ. Nhận một lần, thử hoàn tác và làm lại.
4. Chọn câu hoặc phần rồi yêu cầu sửa/thêm; thử đổi tên đề. Đề xuất chỉ thay vùng đúng và giữ những sửa mới của bạn.
5. Gõ thêm khi AI đang chạy, thử dừng, tải lại trang, mở tab thứ hai và tải/nhập hội thoại. Lỗi khóa không được làm mất yêu cầu.
6. Thử điện thoại thật, bàn phím tiếng Việt và một môn khác. Kiểm chuyên môn của đề/đáp án bằng mắt; mock không chứng minh model thật hoặc nguồn chính thức đúng.

Gửi ảnh và câu yêu cầu đã gõ nếu gặp lỗi; không gửi khóa hoặc cookie. Bản web chỉ thay sau khi tích hợp và triển khai riêng; đợt này chưa làm việc đó.
