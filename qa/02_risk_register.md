# SỔ ĐĂNG KÝ RỦI RO (RISK REGISTER) — KHỞI TẠO R1 ĐẾN R30

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Quy chuẩn đánh giá**: Điểm rủi ro = **Xác suất (1–5)** × **Mức độ tác hại (1–5)**.
- **Phân loại**:
  - **Critical (20–25)**: Nguy cơ tê liệt hệ thống, lộ đề/đáp án diện rộng, mất mát dữ liệu, vi phạm pháp lý.
  - **High (12–19)**: Tính năng khảo thí quan trọng bị sai lệch (chấm điểm sai, vỡ file Word, bypass bảo vệ).
  - **Medium (6–11)**: Tính năng phụ gặp trục trặc, trải nghiệm người dùng bị suy giảm đáng kể.
  - **Low (1–5)**: Lỗi thẩm mỹ, lỗi văn bản, lệch thông tin tài liệu.

---

## BẢNG ĐÁNH GIÁ CHI TIẾT 30 RỦI RO ĐẦU VÀO

| Mã Rủi Ro | Tên Rủi Ro & Mô Tả Ngắn | Xác Suất (L) | Tác Hại (I) | Điểm (L×I) | Mức Độ | Vai Phụ Trách | Chiến Lược Kiểm Thử Thực Nghiệm |
|---|---|---|---|---|---|---|---|
| **R1** | Bộ test có sẵn chỉ chứng minh code chạy với chính nó (Assertion yếu, mock quá đà) | 4 | 4 | 16 | **High** | LOG / REC | Chạy Mutation testing cố ý làm sai barem chấm điểm và kiểm tra xem test có bắt được không. |
| **R2** | Lệnh `npm test` trong `package.json` trỏ vào file cũ không tồn tại | 5 | 2 | 10 | **Medium** | OPS | Chạy thử `npm test` trong terminal để xác thực lỗi cú pháp hoặc file thiếu. |
| **R3** | Tuyên bố kiểm thử 12 môn GDPT là ảo (chưa có bộ đề thật) | 4 | 3 | 12 | **High** | REC / LOG | Tìm kiếm file dữ liệu mẫu của 12 môn học trong repository. |
| **R4** | Các mục `[CẦN KIỂM TRA]` chưa được làm sạch hoàn toàn | 4 | 3 | 12 | **High** | REC / SEC | Rà soát các route `/test`, folder `data/` và xử lý triệt để. |
| **R5** | Đáp án bị rò rỉ qua các kênh khác API (HTML SSR, RSC payload `__next_f`, figures) | 3 | 5 | 15 | **Critical** | SEC / ROOM | Bắt gói tin phản hồi HTTP của `/a/[publicId]`, quét chuỗi byte tìm kiếm đáp án đã biết. |
| **R6** | Các route cũ (`/test/[id]`, `/api/cloud/*`) còn hoạt động và làm lộ 100% đề thi | 5 | 5 | 25 | **Critical** | SEC / API | Gọi trực tiếp `GET /api/cloud/exams/[id]` kiểm tra dữ liệu trả về. |
| **R7** | Lỗ hổng IDOR chéo giữa các giáo viên (xem, sửa, xóa tài nguyên của người khác) | 3 | 5 | 15 | **Critical** | AUTH / API | Dùng token giáo viên B để thao tác trên câu hỏi/đề thi/lớp học của giáo viên A. |
| **R8** | Học sinh xem trộm điểm và bài làm của nhau qua chế độ chọn tên hoặc bảng xếp hạng | 3 | 4 | 12 | **High** | ROOM / SEC | Kiểm tra danh sách học sinh trả về ở trang chọn tên và phân tích payload bảng xếp hạng Top & Me. |
| **R9** | Giáo viên thường có thể gọi lậu vào các API quản trị `/api/admin/*` | 2 | 5 | 10 | **Medium** | AUTH | Dùng cookie của tài khoản `TEACHER` gọi vào endpoint cấp tài khoản và dashboard AI. |
| **R10** | Chấm sai điểm khi bật chế độ hoán vị phương án (`shuffleChoices`) | 3 | 5 | 15 | **Critical** | LOG | Tạo bài thi có xáo trộn đáp án, nộp bài kiểm tra đối chiếu ánh xạ `layout` của Attempt. |
| **R11** | Race condition khi nộp bài đồng thời hoặc gửi draft sau khi đã submit | 3 | 4 | 12 | **High** | PERF / ROOM | Bắn 2 request submit cùng mili-giây; gửi draft với timestamp sau khi submit. |
| **R12** | Thang điểm các phần bị hard-code thay vì lấy theo snapshot cấu hình | 3 | 4 | 12 | **High** | LOG | Tạo đề thi với thang điểm tùy chỉnh (ví dụ 0.2đ / câu) và kiểm tra điểm tổng sau chấm. |
| **R13** | Lệch định nghĩa Enum giữa tài liệu và Prisma (`AttemptStatus.GRADED`) | 4 | 2 | 8 | **Medium** | DB / REC | So sánh trực tiếp enum trong `prisma/schema.prisma` và code xử lý trạng thái. |
| **R14** | Snapshot bài thi bị phá vỡ khi giáo viên sửa hoặc xóa câu hỏi trong ngân hàng | 2 | 5 | 10 | **Medium** | DB / ROOM | Xóa hẳn câu hỏi gốc trong CSDL, sau đó kiểm tra lại bài thi của học sinh đã nộp. |
| **R15** | Trích dẫn sai Thông tư 17/2025/TT-BGDĐT về cấu trúc đề thi | 5 | 2 | 10 | **Medium** | REC | Đối chiếu nội dung Thông tư 17/2025 và văn bản quy định cấu trúc đề thi tốt nghiệp THPT. |
| **R16** | Tuyên bố quá mức về bảo mật riêng tư ("tuyệt đối không thu thập...") | 4 | 3 | 12 | **High** | SEC / REC | Rà soát các trường dữ liệu thực tế được lưu trữ trong bảng `Student` và `AuditLog`. |
| **R17** | Sử dụng Secret và Password mặc định trên môi trường triển khai thực tế | 3 | 4 | 12 | **High** | OPS / SEC | Kiểm tra xem ứng dụng có cảnh báo khi `SESSION_SECRET` ở dạng mặc định không. |
| **R18** | Không chạy được trên môi trường Serverless (Vercel) do lưu trạng thái trong RAM | 4 | 4 | 16 | **High** | OPS | Rà soát cơ chế rate-limiting (lockout map), hàng đợi AI xem có nằm hoàn toàn trong DB không. |
| **R19** | Script sao lưu và khôi phục tự động bị lỗi khi chạy trên hệ thống mới | 3 | 4 | 12 | **High** | OPS | Chạy thử nghiệm khôi phục từ file backup dump vào database QA. |
| **R20** | Công thức toán học OMML bị vỡ hoặc hiển thị dạng text thô khi mở trên Word thật | 3 | 4 | 12 | **High** | EXP | Mở file `.docx` xuất ra trên Microsoft Word hoặc bộ đọc tài liệu OpenXML để kiểm định. |
| **R21** | Thuộc tính `keepNext` gây hiện tượng trang in bị thừa khoảng trắng lớn | 3 | 3 | 9 | **Medium** | EXP | Xuất đề thi có cấu trúc phức tạp 40 câu và kiểm tra tỷ lệ tràn trang. |
| **R22** | Đồ thị Canvas và Bảng biến thiên không được chèn vào file Word xuất ra | 3 | 4 | 12 | **High** | EXP | Kiểm tra mã nguồn chuyển đổi đồ thị thành hình ảnh nhúng trong tài liệu Word. |
| **R23** | Race condition trong bộ điều phối 7 Gemini Keys khi nhiều người dùng gọi cùng lúc | 3 | 4 | 12 | **High** | AIP | Gọi song song nhiều request AI và kiểm tra tính nhất quán của bảng `AiKeyState`. |
| **R24** | Nhãn kiểm định đáp án bị đánh đồng giữa "AI đồng thuận" và "Đã xác minh" | 4 | 3 | 12 | **High** | AIP / BANK | Kiểm tra giao diện hiển thị câu hỏi và trường `verifiedBy`. |
| **R25** | Tấn công Prompt Injection thông qua đề thi nhập từ văn bản thô hoặc file ảnh | 3 | 4 | 12 | **High** | AIP / SEC | Gửi nội dung chứa lệnh thao túng mô hình ngôn ngữ lớn để kiểm tra hàng rào phòng thủ. |
| **R26** | Route công khai bị spam gây cạn kiệt tài nguyên (DDoS/Payload lớn) | 3 | 4 | 12 | **High** | SEC / API | Gửi payload kích thước lớn bất thường và tần suất cao vào `/api/public/attempts/[id]/draft`. |
| **R27** | Mã định danh phòng thi (`publicId`, `groupCode`) có thể bị đoán tuần tự | 2 | 4 | 8 | **Medium** | SEC | Phân tích thuật toán sinh mã ngẫu nhiên trong CSDL. |
| **R28** | Cơ chế khóa tài khoản sau 5 lần thử sai bị lợi dụng để tấn công từ chối dịch vụ (DoS) | 3 | 4 | 12 | **High** | AUTH / SEC | Thử nghiệm cố tình nhập sai mật khẩu của Super Admin từ IP lạ. |
| **R29** | API `/api/migration/import-legacy` bị tiêm nhiễm JSON độc hại | 3 | 4 | 12 | **High** | DB / ING | Gửi payload chứa các thuộc tính nguy hiểm (`__proto__`, cấu trúc sai schema). |
| **R30** | Sai lệch múi giờ giữa máy học sinh và máy chủ làm đóng bài thi sai thời điểm | 3 | 4 | 12 | **High** | ROOM | Kiểm tra thuật toán tính toán `deadlineAt` và xử lý ngày giờ ISO UTC. |
