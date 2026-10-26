# Đưa ExamCraft lên Vercel: từng bước

Làm **sau khi** bạn đã test xong trên máy theo [HUONG_DAN_CHAY_VA_TEST_LOCAL.md](HUONG_DAN_CHAY_VA_TEST_LOCAL.md) (mục 7 của hướng dẫn đó nêu điều kiện đủ). Đọc [NHUNG_DIEU_CHUA_CO.md](NHUNG_DIEU_CHUA_CO.md) để biết giáo viên sẽ chưa có gì.

Phần nào ghi "chưa thử" là tôi viết theo cách các dịch vụ này vẫn làm việc, chưa chạy thật trên tài khoản của bạn. Giao diện Vercel và nhà cung cấp cơ sở dữ liệu thỉnh thoảng đổi chữ; nếu tên nút khác chút thì tìm nút gần nghĩa nhất.

## 0. Bức tranh tổng thể

```
Giáo viên / học sinh  →  Vercel (chạy ứng dụng)  →  PostgreSQL trên mạng (giữ dữ liệu)
                                    ↑
                         GitHub (nhánh main) – mỗi lần bạn push, Vercel dựng bản mới
```

Ba thứ bạn cần: **tài khoản GitHub** (đã có, repo `hoanvukhai/ExamCraft`, `main` đã cập nhật), **tài khoản Vercel**, **một cơ sở dữ liệu PostgreSQL trên mạng**. Máy tính và Docker của bạn không nằm trong đường này; chúng chỉ để test và sửa.

## 1. Tạo cơ sở dữ liệu trên mạng

Vercel không giữ dữ liệu. Chọn một nhà cung cấp PostgreSQL, ví dụ **Neon** hoặc **Supabase** (đều có gói miễn phí; xem giá và giới hạn hiện tại trên trang của họ), hoặc Postgres trong Vercel Storage.

1. Tạo tài khoản và một dự án mới, tên ví dụ `examcraft`.
2. **Chọn vùng gần Việt Nam** (ví dụ Singapore). Vùng xa làm mỗi thao tác chậm hơn.
3. **Không dùng chung** với cơ sở dữ liệu test. Dự án mới, cơ sở dữ liệu rỗng.
4. Tìm chuỗi kết nối. Thường có **hai** chuỗi: *trực tiếp* ("direct") và *qua pooler* ("pooled"/"transaction pooler"). Lưu cả hai vào một tệp ghi chú **ngoài thư mục dự án**; chuỗi này chứa mật khẩu cơ sở dữ liệu, không dán vào chat hay Git.
   - **Chuỗi trực tiếp** dùng để dựng cấu trúc (bước 2).
   - **Chuỗi pooler** dùng cho ứng dụng trên Vercel (bước 4). Nhiều ứng dụng serverless cần pooler để không cạn kết nối. Nếu nhà cung cấp dặn thêm `?pgbouncer=true` vào chuỗi pooler cho Prisma thì thêm; làm theo hướng dẫn Prisma của nhà cung cấp đó.
5. Bật sao lưu tự động của nhà cung cấp nếu có (xem mục 8).

## 2. Dựng cấu trúc cơ sở dữ liệu (làm từ máy bạn)

Vercel **không tự chạy** migration. Bạn chạy một lần từ máy, trỏ vào cơ sở dữ liệu mới bằng **chuỗi trực tiếp**. Mở PowerShell trong thư mục dự án:

```powershell
$env:DATABASE_URL='dán-chuỗi-kết-nối-TRỰC-TIẾP-vào-đây'
```

**Kiểm đích trước khi chạy.** Lệnh sau in ra địa chỉ máy chủ mà `DATABASE_URL` đang trỏ tới. Phải thấy địa chỉ của nhà cung cấp (ví dụ `ep-….neon.tech`), **không** được là `localhost` hay `127.0.0.1`:

```powershell
(($env:DATABASE_URL -split '@')[-1] -split '/')[0]
```

Đúng rồi mới chạy:

```bash
npx prisma migrate deploy
```

Thấy danh sách migration được áp dụng và không báo lỗi là xong. **Chỉ dùng `migrate deploy`**, không dùng `migrate dev` hay `db push` với cơ sở dữ liệu thật.

## 3. Tạo tài khoản quản trị đầu tiên

Vẫn trong cửa sổ PowerShell đó (biến `DATABASE_URL` vẫn trỏ vào cơ sở dữ liệu mới; kiểm lại bằng lệnh in địa chỉ ở bước 2), đặt email và mật khẩu quản trị **của bạn** rồi chạy seed:

```powershell
$env:ADMIN_EMAIL='email-của-bạn@...'; $env:ADMIN_INITIAL_PASSWORD='mật-khẩu-dài-khó-đoán'
```

```bash
npx prisma db seed
```

- **Bắt buộc đặt `ADMIN_INITIAL_PASSWORD`.** Bỏ trống thì mật khẩu là giá trị mặc định có trong mã nguồn công khai, ai cũng đoán được.
- Seed tạo tài khoản quản trị (lần đăng nhập đầu bắt đổi mật khẩu), trạng thái khóa AI quản trị và các mẫu cấu trúc đề hệ thống. Chạy lại không tạo trùng.
- Xong thì đóng cửa sổ PowerShell để biến môi trường mất đi.

## 4. Tạo dự án trên Vercel

1. Vào vercel.com, đăng nhập bằng GitHub.
2. **Add New… → Project**, chọn repo `ExamCraft`, bấm **Import**.
3. Các ô cấu hình:
   - **Framework Preset:** Next.js (tự nhận).
   - **Root Directory:** để trống (gốc repo).
   - **Branch:** `main`.
   - **Build Command, Install Command, Output Directory:** để mặc định. Lệnh build lấy từ `package.json` (`next build --webpack`) và `postinstall` tự chạy `prisma generate`.
   - **Node.js Version:** chọn 22.x trong Settings → General nếu có ô này.
4. **Trước khi bấm Deploy**, mở mục **Environment Variables** và thêm các biến sau (chọn phạm vi Production; thêm cả Preview nếu muốn thử bản xem trước):

| Tên | Giá trị | Ghi chú |
|---|---|---|
| `DATABASE_URL` | chuỗi **pooler** của bước 1 | Bắt buộc |
| `SESSION_SECRET` | chuỗi ngẫu nhiên dài từ 32 ký tự | Bắt buộc. **Không đổi sau này**: khóa AI người dùng đã lưu được mã hóa bằng nó, đổi là mất. Để trống hoặc giá trị mặc định thì ứng dụng từ chối chạy ở production |
| `TRUST_PROXY_HEADERS` | `true` | Để nhật ký ghi đúng địa chỉ IP người dùng |
| `GEMINI_MODEL` | (tùy chọn) tên mô hình | Để trống dùng mặc định |
| `ATTEMPT_SESSION_SECRET` | (tùy chọn) chuỗi ngẫu nhiên khác | Mặc định dùng `SESSION_SECRET` |

Tạo `SESSION_SECRET` bằng lệnh này, rồi sao chép kết quả vào Vercel (đừng lưu vào tệp trong dự án):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Không đặt `EXAMCRAFT_ISOLATED_TEST_SERVER`, `GOOGLE_GEMINI_BASE_URL`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `NEXT_BUILD_CPUS` trên Vercel. Hai biến đầu là của máy chủ thử; hai biến quản trị chỉ cần ở máy bạn khi chạy seed; biến cuối chỉ để dựng trên máy yếu và làm chậm bản dựng của Vercel.

5. Bấm **Deploy**. Vercel dựng khoảng 2–5 phút. Nếu lỗi, mở nhật ký dựng trong trang Deployments và gửi tôi đoạn đỏ.
6. **Thời gian chạy tối đa của hàm:** các route gọi AI đã đặt 300 giây (sinh đề, nhập Word, nhập văn bản, nhập từ ảnh) và 60 giây (các route AI còn lại). Nếu Vercel báo con số vượt giới hạn của gói bạn, hạ số `maxDuration` trong các tệp `route.ts` tương ứng, biết rằng nhập Word dài có thể bị cắt giữa chừng.
7. **Vùng chạy hàm:** vào Settings → Functions, chọn vùng gần cơ sở dữ liệu (Singapore nếu cơ sở dữ liệu ở Singapore). Mặc định thường ở Mỹ, làm ứng dụng chậm rõ rệt khi cơ sở dữ liệu ở châu Á. (Chưa thử; tên ô có thể khác.)

## 5. Kiểm ngay sau khi lên

Vercel cho địa chỉ dạng `https://tên-dự-án.vercel.app`. Làm lần lượt, mỗi bước xong mới sang bước sau:

1. Mở `/login`, đăng nhập bằng email và mật khẩu quản trị ở bước 3. Đổi mật khẩu khi được yêu cầu.
2. Vào `/admin/users`, cấp **một** tài khoản giáo viên thử (của bạn), đăng nhập bằng nó ở cửa sổ ẩn danh, đổi mật khẩu.
3. Soạn một đề nhỏ, lưu, tải lại trang: đề còn.
4. Xuất Word và mở bằng Word.
5. Nhập khóa Gemini riêng của bạn, thử sinh một đề nhỏ (kiểm đường gọi AI thật).
6. Nhập thử một tệp Word nhỏ (kiểm hàm chạy đủ lâu).
7. Giao một bài, mở link bài giao bằng **điện thoại dùng 4G** (không dùng Wi-Fi nhà), làm bài, nộp, xem điểm ở phía giáo viên.
8. Đăng xuất, thử mở thẳng một địa chỉ đề của giáo viên: phải bị chặn.

Có bước nào trượt thì **chưa mời giáo viên**, gửi cho tôi.

## 6. Mời giáo viên

1. Với mỗi giáo viên, vào `/admin/users` → **Cấp tài khoản giáo viên mới**: họ tên, email, mật khẩu tạm (hoặc **Sinh ngẫu nhiên**), hạn mức gọi AI mỗi ngày. Gửi mật khẩu tạm qua kênh riêng, không đăng nhóm chung. Lần đầu họ phải đổi mật khẩu.
2. **Khóa AI:** mỗi giáo viên tự nhập khóa Gemini của mình trong hộp **Khóa AI**, hoặc bạn cấp khóa ở `/admin/keys` cho người bạn chọn (mỗi người vẫn có hạn mức riêng mỗi ngày). Khóa miễn phí gọi được rất ít lần mỗi ngày.
3. Đưa cho họ [HUONG_DAN_GIAO_VIEN_DAY_DU.md](HUONG_DAN_GIAO_VIEN_DAY_DU.md) và cho học sinh [HUONG_DAN_HOC_SINH_MOBILE.md](HUONG_DAN_HOC_SINH_MOBILE.md).
4. Dặn rõ ba điều: **đề AI sinh là bản nháp**, giáo viên phải xem lại nội dung, đáp án và điểm; link bài giao **ai có link đều vào được**, nên gửi đúng lớp; chưa có người kiểm chuyên môn từng môn.
5. Bắt đầu với **một hai giáo viên** trong một tuần, rồi mở rộng.
6. Lỗi họ gặp ghi vào [PHIEU_GHI_LOI.md](PHIEU_GHI_LOI.md) và gửi cho bạn, bạn gửi cho tôi.

## 7. Cập nhật về sau: sửa gì cũng quy về một vòng

1. **Sửa trên máy** (nhờ tôi sửa mã, hoặc bạn tự sửa).
2. **Test trên máy:** `npm run build`, rồi chạy máy chủ thử và test dòng liên quan (xem hướng dẫn local).
3. **Đẩy lên GitHub:** `git push`. Vercel nhận được và tự dựng bản mới trong vài phút; người dùng đang dùng không bị ngắt giữa chừng.
4. **Nếu bản sửa có đổi cấu trúc cơ sở dữ liệu** (có thư mục mới trong `prisma/migrations`): **sao lưu trước** (mục 8), chạy `npx prisma migrate deploy` bằng chuỗi trực tiếp như bước 2, **rồi** mới đẩy mã.
5. **Muốn thử trước khi cho mọi người dùng:** đẩy lên một nhánh khác `main`; Vercel dựng một địa chỉ xem trước riêng để bạn thử. Chỉ khi hài lòng mới trộn vào `main`. (Địa chỉ xem trước dùng chung cơ sở dữ liệu nếu bạn đặt cùng biến; đặt biến Preview trỏ cơ sở dữ liệu khác nếu muốn tách.)
6. **Quay lại bản trước nếu bản mới lỗi:** vào Deployments, chọn bản dựng tốt trước đó và đưa về Production (Promote / Instant Rollback). Việc này chỉ quay **mã**, không quay lại cơ sở dữ liệu; vì vậy cần sao lưu trước khi đổi cấu trúc.

## 8. Sao lưu

- Bật sao lưu tự động của nhà cung cấp cơ sở dữ liệu (kiểm thời gian giữ bản của gói bạn dùng).
- Thêm một bản sao tự tay trước mỗi đợt đổi cấu trúc và định kỳ hằng tuần. Chưa thử trên máy này: dùng công cụ `pg_dump` có sẵn trong container Docker của dự án, đưa chuỗi **trực tiếp** vào:

```powershell
docker exec examcraft_postgres pg_dump "dán-chuỗi-trực-tiếp" -Fc -f /tmp/prod.dump
```

```powershell
docker cp examcraft_postgres:/tmp/prod.dump backups/prod-ngay-thang.dump
```

- Cất bản sao sang ổ ngoài. Tệp này chứa dữ liệu thật; không đưa vào Git (thư mục `backups` đã bị bỏ qua).

## 9. Theo dõi và sự cố

- **Nhật ký ứng dụng:** trong dự án Vercel, mục Logs; lọc theo lỗi (Error) khi giáo viên báo sự cố.
- **Cơ sở dữ liệu:** trang quản lý của nhà cung cấp cho biết dung lượng, số kết nối, thời gian truy vấn.
- **AI ngừng chạy:** thường do hết hạn mức khóa trong ngày (lỗi 429) hoặc khóa bị thu hồi. Quản trị xem ở `/admin/ai` và `/admin/keys`.
- **Đăng nhập báo sai nhiều lần:** mỗi tài khoản bị khóa tạm 15 phút sau 5 lần sai; chờ hoặc quản trị đặt lại mật khẩu.
- **Không vào được trang:** kiểm trang trạng thái của Vercel và nhà cung cấp cơ sở dữ liệu trước khi nghi lỗi ứng dụng.

## 10. Những điều cần biết trước khi cho giáo viên dùng thật

- **Repo công khai:** mã nguồn và tài liệu ai cũng đọc được. Bản mã không chứa khóa hay dữ liệu thật; mật khẩu thử trong tài liệu chỉ dùng cho bản test. Bạn có thể chuyển repo sang riêng tư (Vercel vẫn dựng được) khi muốn.
- **Quyền riêng tư học sinh:** tên học sinh và bài làm nằm trong cơ sở dữ liệu của nhà cung cấp bạn chọn. Xem quy định của trường về dữ liệu học sinh trước khi dùng thật.
- **Gói miễn phí:** có giới hạn dung lượng, số lần gọi và mục đích sử dụng. Gói Hobby của Vercel dành cho dùng cá nhân phi thương mại; kiểm điều khoản hiện tại nếu dùng cho cả trường.
- **Chưa kiểm:** chuyên môn từng môn và độ khó theo kỳ thi (cần giáo viên đúng cấp), in giấy hàng loạt, Word thật cho mọi môn.
- **Khi cần giúp:** gửi cho tôi đoạn lỗi hoặc ảnh chụp, kèm các bước đã làm.
