# Đưa ExamCraft lên Vercel

Hướng dẫn cho người triển khai. Trước hết đọc [NHUNG_DIEU_CHUA_CO](NHUNG_DIEU_CHUA_CO.md): có những việc bản này chưa làm hoặc chưa kiểm.

## 1. Cần có trước
- **Cơ sở dữ liệu PostgreSQL trên mạng** (Neon, Supabase, Vercel Postgres hay máy chủ riêng). Máy tính của bạn (Docker, cổng 5436) không dùng được cho Vercel.
- **Không dùng chung** cơ sở dữ liệu với bản test. Tạo cơ sở dữ liệu mới, rỗng.
- Ứng dụng không ghi tệp lên đĩa khi chạy (đã dò mã), nên hợp với môi trường serverless.

## 2. Biến môi trường (Vercel → Settings → Environment Variables)
| Tên | Ghi chú |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối. Nếu nhà cung cấp có địa chỉ "pooled", dùng cho ứng dụng và thêm `?pgbouncer=true&connection_limit=1` nếu họ yêu cầu |
| `SESSION_SECRET` | Chuỗi ngẫu nhiên dài (nên từ 32 ký tự; để trống hoặc dùng giá trị mặc định thì ứng dụng từ chối chạy ở production). **Không đổi sau khi đã có người dùng**: khóa AI người dùng lưu đã được mã hóa bằng chuỗi này, đổi là mất khả năng giải mã |
| `ATTEMPT_SESSION_SECRET` | Tùy chọn, mặc định dùng `SESSION_SECRET` |
| `TRUST_PROXY_HEADERS` | Đặt `true` trên Vercel để nhật ký ghi đúng địa chỉ IP người dùng (không đặt thì ghi "local") |
| `GEMINI_MODEL` | Để trống hoặc tên mô hình muốn dùng |
| `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` | Không cần trên Vercel; chỉ đặt ở máy bạn khi chạy seed (mục 4) |

Không đặt `EXAMCRAFT_ISOLATED_TEST_SERVER` và `GOOGLE_GEMINI_BASE_URL` trên Vercel: đây là biến của máy chủ thử.

## 3. Dựng cấu trúc cơ sở dữ liệu
Vercel **không tự chạy** migration. Từ máy bạn, trỏ `DATABASE_URL` sang cơ sở dữ liệu mới (dùng địa chỉ **kết nối trực tiếp**, không qua pooler):
```bash
npx prisma migrate deploy
```
Chỉ chạy `migrate deploy`, không chạy `migrate dev` hay `db push` với cơ sở dữ liệu thật.

## 4. Tài khoản quản trị đầu tiên và mẫu đề hệ thống
Chạy từ máy bạn, trỏ `DATABASE_URL` vào cơ sở dữ liệu mới và **đặt cả hai biến** `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` trong cửa sổ lệnh đó:
```bash
npx prisma db seed
```
- **Bắt buộc đặt `ADMIN_INITIAL_PASSWORD`.** Nếu bỏ trống, mã seed dùng mật khẩu mặc định có trong mã nguồn, ai đọc mã cũng đoán được.
- Seed tạo tài khoản quản trị (buộc đổi mật khẩu ở lần đăng nhập đầu), trạng thái 7 khóa AI quản trị và các mẫu cấu trúc đề hệ thống. Chạy lại không tạo trùng.
- Đăng nhập xong, đổi mật khẩu ngay.

## 5. Đưa mã lên
- Lệnh build là `next build --webpack` (đã có trong `package.json`); `postinstall` tự chạy `prisma generate`.
- Các route gọi AI đã đặt thời gian tối đa: 300 giây cho sinh đề và nhập đề, 60 giây cho các route còn lại. Nếu Vercel báo vượt giới hạn gói của bạn, hạ số `maxDuration` trong các tệp `route.ts` tương ứng, rồi biết rằng nhập tệp Word dài có thể bị cắt giữa chừng.
- Repo đang ở nhánh `rebuild/2026-10-local`; `main` chưa có các thay đổi này. Chọn nhánh để Vercel dựng cho đúng.

## 6. Kiểm sau khi lên
1. Mở trang, đăng nhập quản trị, đổi mật khẩu.
2. Tạo một tài khoản giáo viên, đăng nhập bằng tài khoản đó.
3. Soạn một đề, lưu, tải lại trang: đề còn.
4. Xuất Word và mở thử.
5. Nhập một khóa Gemini riêng, thử sinh một đề nhỏ (kiểm đường gọi AI thật).
6. Giao một bài và làm thử bằng điện thoại.

## 7. Trước khi cho giáo viên dùng thật
- **Sao lưu cơ sở dữ liệu** (nhà cung cấp có sao lưu tự động thì bật; hoặc dùng `pg_dump`).
- Dặn giáo viên: đề AI sinh là **bản nháp**; xem lại nội dung, đáp án và điểm trước khi dùng.
- Chưa có người kiểm chuyên môn từng môn; chưa kiểm in giấy và Word thật cho mọi môn.
- Khi gặp lỗi, ghi vào [PHIEU_GHI_LOI](PHIEU_GHI_LOI.md).
