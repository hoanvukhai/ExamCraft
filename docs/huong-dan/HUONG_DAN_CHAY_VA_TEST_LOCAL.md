# Chạy ExamCraft trên máy bạn và test toàn bộ trước khi đẩy lên Vercel

Đọc từ trên xuống. Phần 1–4 là chạy máy, phần 5–6 là test, phần 7 là khi nào đủ điều kiện đẩy lên Vercel. Các lệnh đã được chạy thử trên máy dự án ngày 26/10/2026. **Mở PowerShell trong thư mục dự án** (chuột phải vào thư mục, chọn mở bằng Terminal) và chạy từng lệnh một.

## 0. Lộ trình một nhìn

| Bước | Làm gì | Mất bao lâu |
|---|---|---|
| 1 | Chuẩn bị máy (Docker, Node) | 5 phút, một lần |
| 2 | Dựng bản chạy và tài khoản thử | 5 phút |
| 3 | Mở máy chủ thử, đăng nhập | 2 phút |
| 4 | (Tùy chọn) bật AI thật, mở cho điện thoại | 5 phút |
| 5 | Test theo bản test đầy đủ, theo vai | 6 buổi, mỗi buổi khoảng 2 giờ |
| 6 | Ghi lỗi, gửi cho tôi sửa, test lại | tùy |
| 7 | Đạt điều kiện thì làm theo [TRIEN_KHAI_VERCEL.md](TRIEN_KHAI_VERCEL.md) | 1–2 giờ |

## 1. Chuẩn bị máy

- **Docker Desktop** đang chạy (biểu tượng cá voi, trạng thái "Running").
- **Node.js 22** (máy dự án dùng 22.21). Kiểm bằng:

```bash
node -v
```

- Thư mục dự án `F:\Workspace\Zazz\ExamCraft` đã có `node_modules` và tệp `.env`. Nếu mở máy khác hoặc thư mục mới: chạy `npm install`, rồi sao chép `.env.example` thành `.env` và điền `DATABASE_URL`, `SESSION_SECRET` (xem mục 2 của [TRIEN_KHAI_VERCEL.md](TRIEN_KHAI_VERCEL.md)).
- Chrome hoặc Edge; **Microsoft Word thật**; một điện thoại cùng Wi-Fi; Excel hoặc Google Sheets; máy in hoặc "Lưu thành PDF".

Bật cơ sở dữ liệu (nếu chưa chạy). Lệnh này an toàn khi chạy lại:

```bash
docker compose up -d
```

Kiểm cơ sở dữ liệu đã sẵn sàng (phải thấy `healthy`):

```bash
docker ps --format "{{.Names}} {{.Status}}"
```

## 2. Dựng bản chạy và tài khoản thử

Bạn test trên **cơ sở dữ liệu thử riêng** (`examcraft_test_20261022`), không phải cơ sở dữ liệu thật `examcraft`. Máy chủ thử luôn ép dùng cơ sở dữ liệu thử, nên test làm hỏng gì cũng không ảnh hưởng dữ liệu thật.

**Bước 2.1. Sao lưu cho chắc (làm một lần đầu đợt test).**

```bash
powershell -NoProfile -File scripts/backup.ps1 -Execute
```

Thấy dòng `BACKUP_PACKAGE_CREATED` là xong.

**Bước 2.2. Dựng bản chạy.** Lệnh này giống hệt lệnh Vercel sẽ chạy nên bắt được lỗi dựng sớm. Mất 1–3 phút:

```bash
npm run build
```

Máy yếu RAM thì chạy lệnh sau thay cho lệnh trên (chỉ cần trên máy bạn, không ảnh hưởng Vercel):

```powershell
$env:NEXT_BUILD_CPUS='1'; $env:NODE_OPTIONS='--max-old-space-size=1024'; npm run build
```

**Bước 2.3. Tạo ba tài khoản thử.**

```bash
node scripts/run-with-test-db.cjs scripts/make-test-accounts.ts
```

Màn hình in ra email và mật khẩu của `admin`, `gv1`, `gv2`. **Chép mật khẩu ngay, chỉ hiện một lần.** Chạy lại lệnh bất kỳ lúc nào để lấy bộ mới: tài khoản cũ cùng tên được khóa và cất lại (giữ nguyên dữ liệu của nó), tài khoản mới bắt đầu từ trống.

## 3. Mở máy chủ thử và đăng nhập

```bash
node scripts/test-server.cjs --production
```

Chờ dòng `Ready`. **Để cửa sổ này mở suốt lúc test.** Tắt bằng `Ctrl+C`. Mở trình duyệt vào:

**http://127.0.0.1:3117/login**

| Tài khoản | Email | Mật khẩu | Dùng để |
|---|---|---|---|
| Quản trị | `admin@examcraft.test` | in ở bước 2.3 | trang `/admin/users`, `/admin/keys`, `/admin/ai` |
| Giáo viên 1 (A) | `gv1@examcraft.test` | tạm, in ở bước 2.3 | toàn bộ phần giáo viên. **Lần đầu bị bắt đổi mật khẩu**, đó là chức năng cần test |
| Giáo viên 2 (B) | `gv2@examcraft.test` | tạm, in ở bước 2.3 | kiểm cộng tác, chia sẻ, quyền |
| Học sinh | không có tài khoản | — | vào bằng link bài giao hoặc link lớp, hoặc mã PIN |

Ghi chú:
- Mỗi lần khởi động lại máy chủ thử, **phiên đăng nhập bị đăng xuất** và **khóa AI đã lưu phải nhập lại** (máy chủ thử sinh khóa mã hóa mới mỗi lần). Đây là hành vi của bản thử; bản Vercel dùng một `SESSION_SECRET` cố định nên không bị.
- Hai người test cùng lúc cần hai phiên đăng nhập tách biệt: dùng hai trình duyệt khác nhau, hoặc một cửa sổ thường và một cửa sổ ẩn danh.

### Các trang chính (để biết đang ở đâu)

| Địa chỉ | Là gì | Ai dùng |
|---|---|---|
| `/login` | Đăng nhập | Giáo viên, quản trị |
| `/` | Kho đề | Giáo viên |
| `/editor`, `/editor/…` | Soạn đề | Giáo viên |
| `/teacher/groups` | Lớp học, mã PIN học sinh | Giáo viên |
| `/teacher/assignments` | Bài đã giao, theo dõi, chấm, bảng điểm | Giáo viên |
| `/admin/users` | Cấp, khóa, đổi mật khẩu tài khoản | Quản trị |
| `/admin/keys` | Cấp khóa AI cho người dùng chọn | Quản trị |
| `/admin/ai` | Trạng thái các khóa AI dùng chung và nhật ký gọi AI gần nhất | Quản trị |
| `/a/…` | Phòng làm bài của học sinh | Học sinh |
| `/c/…` | Trang lớp: học sinh chọn tên mình để xem điểm | Học sinh |
| `/share/…` | Xem đề được chia sẻ | Người nhận link |

## 4. Tùy chọn: AI thật và điện thoại

### 4.1 Bật AI thật
Mặc định máy chủ thử dùng **AI giả** (không tốn khóa, trả nội dung giả) để các bài kiểm không phụ thuộc mạng. Muốn thử AI thật, tắt máy chủ (Ctrl+C), rồi:

```powershell
$env:EXAMCRAFT_REAL_AI='1'; node scripts/test-server.cjs --production
```

Sau đó đăng nhập `gv1`, nhập khóa Gemini của bạn vào hộp **Khóa AI** (hoặc để `admin` cấp ở `/admin/keys`). Mỗi khóa miễn phí chỉ gọi được khoảng 15–20 lần mỗi ngày, hồi lại khoảng 14:00 giờ Việt Nam. Đừng đưa khóa vào tệp trong dự án.

### 4.2 Cho điện thoại vào cùng
Điện thoại phải cùng Wi-Fi với máy tính. Tắt máy chủ rồi chạy:

```powershell
$env:EXAMCRAFT_TEST_HOST='0.0.0.0'; node scripts/test-server.cjs --production
```

Windows hỏi về tường lửa thì chọn **Mạng riêng tư**. Xem địa chỉ IP của máy:

```bash
ipconfig
```

Lấy dòng `IPv4 Address` của Wi-Fi (ví dụ `192.168.0.103`). Rồi **mở ứng dụng trên máy tính bằng chính địa chỉ đó** (`http://192.168.0.103:3117/login`, không dùng `127.0.0.1`), vì link học sinh được tạo theo địa chỉ bạn đang mở. Link bài giao khi đó dùng được trên điện thoại. Test xong, tắt máy chủ và chạy lại lệnh ở mục 3 để đóng lại: chế độ này cho mọi máy cùng Wi-Fi vào xem dữ liệu thử.

## 5. Test thế nào

Bản test đầy đủ là [ban-test-day-du](ban-test-day-du/00_HUONG_DAN_DUNG_VA_CHUAN_BI.md): khoảng 690 dòng kiểm, mỗi dòng là "làm gì → thấy gì thì đúng → ghi Đ / K / B". Đọc phần 00 trước (cách dùng, ký hiệu 🔴🟡🟢, những điều không phải lỗi).

**Đừng ghi trực tiếp vào bản gốc.** Sao ra thư mục của riêng bạn (một lần):

```powershell
Copy-Item -Recurse docs/huong-dan/ban-test-day-du qa/test-run-2026-10-27-chu-du-an
```

Đổi ngày trong tên thư mục cho đúng hôm bạn bắt đầu. Ghi kết quả vào cột **Kq** của các tệp trong thư mục đó. Xem tiến độ bất cứ lúc nào:

```bash
node scripts/tally-test-results.cjs qa/test-run-2026-10-27-chu-du-an
```

### Bản đồ theo vai: test gì với tài khoản nào

| Vai | Phần cần làm | Nội dung chính |
|---|---|---|
| **Quản trị** (`admin`) | 01 (T01-30 đến T01-46), 08 | Cấp, khóa tài khoản, đổi mật khẩu; cấp khóa AI cho người chọn; theo dõi AI; sao lưu và khôi phục; bảo mật |
| **Giáo viên 1** (`gv1`) | 01, 02, 03, 04, 05, 06, 07 | Đăng nhập lần đầu, kho đề; soạn bảy dạng câu; nhập Word, ảnh, văn bản; AI; xuất Word, in, trình chiếu, trộn mã đề; chia sẻ; lớp, giao bài, chấm |
| **Giáo viên 2** (`gv2`) | 06, 07 (phần quyền) | Nhận chia sẻ, cùng sửa đề, góp ý, ngân hàng; thử xem đề của người khác khi không có quyền |
| **Học sinh** (điện thoại) | 07 | Vào bằng link hoặc PIN, làm bài, lưu nháp, nộp, xem kết quả, làm bài khi mạng chậm |
| **Mọi vai** | 09 | Từng môn, từng khối lớp |

### Thứ tự và lịch gợi ý (sáu buổi)

| Buổi | Phần | Cần |
|---|---|---|
| 1 | 01, 02 | Một mình |
| 2 | 03, 04 | Tệp trong [mau-test](mau-test/); khóa AI (phần 04) |
| 3 | 05 | Microsoft Word, máy in hoặc PDF |
| 4 | 06 | Hai người, hai trình duyệt |
| 5 | 07 | Hai người và một điện thoại |
| 6 | 08, 09 | Cả hai; dọn dẹp ở cuối |

Phần nào làm không được thì ghi **B** và nêu lý do, đừng bỏ trống.

### Ba nguyên tắc khi test
1. Tên đề, lớp, bài giao đều bắt đầu bằng `TEST-` để dọn.
2. Gặp lỗi thì ghi lại rồi làm dòng sau; chỉ dừng khi lỗi chặn hẳn dòng kế tiếp hoặc nghi mất dữ liệu, lộ đáp án, sai điểm.
3. Dòng 🔴 trượt là lỗi chặn: báo ngay.

## 6. Khi gặp lỗi

1. Ghi vào cột Ghi chú của dòng đó: *đã làm gì → thấy gì → mong đợi gì*, kèm ảnh chụp màn hình. Mẫu ở [10_BANG_TONG_HOP_VA_BAO_LOI.md](ban-test-day-du/10_BANG_TONG_HOP_VA_BAO_LOI.md).
2. Gửi cho tôi thư mục `qa/test-run-…-chu-du-an` (hoặc bảo tôi "đọc báo cáo test"). Tôi chạy `tally`, phân loại từng lỗi (lỗi ứng dụng, lỗi tài liệu hay do thao tác), sửa phần của ứng dụng và báo lại.
3. Sau khi tôi sửa, **dựng lại bản và chạy lại máy chủ** (`npm run build`, rồi lệnh ở mục 3) và test lại đúng dòng đó.

## 7. Khi nào đủ điều kiện đẩy lên Vercel

Đẩy khi **tất cả** đều đúng:
- Không còn dòng 🔴 ghi **K**. Dòng 🟡 **K** thì bạn quyết định chấp nhận hay chờ sửa.
- Phần 01, 02, 05, 06, 07 đã làm trọn (các phần giáo viên dùng hằng ngày).
- Đã thử **AI thật** ít nhất một lần sinh đề và một lần nhập Word.
- Đã thử trên **điện thoại thật** phần học sinh làm bài.
- `npm run build` chạy xong không lỗi.
- Bạn đã xem [NHUNG_DIEU_CHUA_CO.md](NHUNG_DIEU_CHUA_CO.md) và đồng ý với những điều chưa có.

Sau khi đẩy lên Vercel, **bạn vẫn sửa được mọi thứ**: sửa mã trên máy, test lại ở máy này, rồi `git push`; Vercel tự dựng lại bản mới (xem mục "Cập nhật về sau" trong [TRIEN_KHAI_VERCEL.md](TRIEN_KHAI_VERCEL.md)). Nếu bản sửa có đổi cấu trúc cơ sở dữ liệu thì phải chạy thêm `prisma migrate deploy` và sao lưu trước.

## 8. Dọn dẹp và đặt lại

- Tắt máy chủ thử: `Ctrl+C` trong cửa sổ đang chạy.
- Làm lại từ đầu: chạy lại lệnh ở bước 2.3 (tài khoản mới, trống), rồi mục 3.
- Dữ liệu thử cũ không cần xóa. Cơ sở dữ liệu thật `examcraft` không bị đụng.
- Đừng để chế độ mở cho điện thoại (mục 4.2) chạy lúc không dùng.
