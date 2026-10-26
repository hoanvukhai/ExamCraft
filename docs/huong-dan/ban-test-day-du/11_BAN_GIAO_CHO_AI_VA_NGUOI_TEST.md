# 11. Bàn giao việc test cho người và cho các AI (Gemini, Codex, Antigravity, ChatGPT)

Bản test có thể chia cho nhiều người: chủ dự án, người test cùng và các AI có khả năng điều khiển trình duyệt. Mục này nói **ai làm phần nào**, **làm ở đâu cho an toàn**, **ghi bằng chứng thế nào** và **báo cáo thế nào** để Claude đọc và kết luận.

## 1. Ai làm phần nào

AI làm tốt các dòng kiểm lặp lại và có thể quan sát bằng chữ. AI **không thay được** mắt, tay và phán đoán chuyên môn của giáo viên.

| Phần | Giao cho AI được không | Người cần làm | Lý do |
|---|---|---|---|
| 01 Tài khoản, Kho đề | Được (trừ T01-18, T01-19 cần hai phiên) | Soát bằng mắt nhanh | Thao tác và chữ trên màn hình |
| 02 Soạn đề | Được phần nhập liệu và lưu | Xem hình, công thức, bảng có **đẹp** không | AI khó đánh giá "đẹp" |
| 03 Nhập đề | Được văn bản thô và LaTeX; Word/ảnh nếu AI có khóa AI | Đối chiếu nội dung với tệp gốc | Cần đọc kỹ |
| 04 AI | Được thao tác; **không** được tự kết luận chuyên môn | **Giáo viên đúng môn** đọc nội dung câu AI soạn | Chuyên môn đúng/sai chỉ giáo viên biết |
| 05 Xuất, in, trình chiếu, trộn đề | Được trộn đề và xem trước; tải Word và đếm | **Mở Word thật, in giấy** | Cần Word, máy in |
| 06 Chia sẻ, cộng tác | Được nếu có hai phiên trình duyệt độc lập | Một lần chạy thật hai người | Kiểm xung đột thật |
| 07 Lớp, giao bài, học sinh, chấm | Được phần giáo viên và học sinh qua trình duyệt | **Điện thoại thật** làm học sinh; chấm tự luận | Cảm giác trên điện thoại |
| 08 Mất mạng, sao lưu, bảo mật, giao diện | Được bảo mật, sao lưu (chạy lệnh) | Giao diện điện thoại, bàn phím, đọc hướng dẫn như người mới | Cần con người |
| 09 Từng môn | Được kiểm danh sách môn–khối (9A) | **Giáo viên từng môn** kiểm cột CM (chuyên môn) | Chuyên môn |

Gợi ý: giao **AI** phần 01, 02, 03, 05 (trộn, xem trước), 06 (nếu có hai phiên), 07 (phía giáo viên), 08C (bảo mật) và 09A; giữ lại cho **người** phần chuyên môn, Word/in thật, điện thoại và hai người cùng lúc. Có thể giao **cùng một phần cho hai AI khác nhau** để so kết quả; chỗ hai bên khác nhau là chỗ cần người xem.

## 2. Môi trường an toàn cho AI test

**AI không được dùng cơ sở dữ liệu thật của bạn.** Dùng máy chủ thử, chỉ ghi vào cơ sở dữ liệu thử `examcraft_test_20261022`:

```bash
npm run build
```

```bash
node scripts/run-with-test-db.cjs scripts/make-test-accounts.ts
```

Lệnh thứ hai tạo ba tài khoản thử trong cơ sở dữ liệu **thử** (`admin@examcraft.test`, `gv1@examcraft.test`, `gv2@examcraft.test`) và in mật khẩu tạm **một lần**. Chép mật khẩu đó đưa cho AI. Rồi chạy:

```bash
node scripts/test-server.cjs --production
```

Ứng dụng thử mở ở `http://127.0.0.1:3117`. Trong chế độ này, các tính năng AI gọi vào một nhà cung cấp **giả** (cho kết quả cố định) trừ khi bạn chủ động bật `EXAMCRAFT_REAL_AI=1` (khi đó cần khóa thật).

Quy tắc cho AI test:
- Chỉ dùng `http://127.0.0.1:3117`. Không mở, không sửa tệp `.env`, `backups/`, tệp khóa.
- Không dán khóa API thật của bạn vào cuộc trò chuyện với AI. Nếu cần thử AI thật, tự nhập khóa vào ô **Khóa AI của bạn** trong ứng dụng, hoặc dùng một khóa tạm riêng cho việc này rồi thu hồi sau.
- Không chạy lệnh sao lưu/khôi phục (phần 08B) trên cơ sở dữ liệu thật; chỉ làm việc đó chính bạn.
- Không sửa mã nguồn. AI test chỉ **quan sát và báo cáo**.

## 3. Bằng chứng bắt buộc

Mỗi dòng ghi **Đ** của mức 🔴 phải có **bằng chứng**: đoạn chữ thật đọc được trên màn hình hoặc tên tệp ảnh chụp, viết ở cột Ghi chú. Mỗi dòng **K** phải ghi *đã làm gì → thấy gì → mong đợi gì* và đính ảnh. Dòng **B** ghi lý do bỏ qua.

Lý do cần quy tắc này: có AI dễ **bịa kết quả** cho dòng khó, nhất là tên nút hoặc thông báo không có thật. Vì vậy:
- AI không được viết kết quả "Đ" cho dòng nó **không thực sự thấy** trên màn hình.
- Claude sẽ **kiểm ngẫu nhiên ít nhất một phần năm số dòng Đ** và **toàn bộ** dòng K; AI nào có dòng Đ bị bác sẽ bị coi toàn bộ báo cáo là chưa tin cậy.

## 4. Nơi lưu và cách báo cáo

1. Sao chép cả thư mục `docs/huong-dan/ban-test-day-du` thành `qa/test-run-<ngày>-<tên người hoặc AI>/` rồi điền trực tiếp vào các bảng (cột Kq và Ghi chú).
2. Đặt ảnh chụp vào thư mục con `anh/` cạnh đó, tên theo mã dòng (ví dụ `T07-26-b-xung-dot.png`).
3. Chạy tổng hợp:

```bash
node scripts/tally-test-results.cjs qa/test-run-<ngày>-<tên>
```

Lệnh in số Đ, K, B, "chưa làm" của từng phần và liệt kê mọi dòng K, **🔴 trước**.
4. Viết `BAO_CAO.md` trong cùng thư mục theo mẫu ở mục 6.
5. Báo cho Claude biết thư mục. Claude đọc `BAO_CAO.md`, chạy tổng hợp, kiểm ngẫu nhiên, rồi trả lời: *ổn / chưa ổn / cần làm lại phần nào*.

## 5. Lời nhắn mẫu để giao cho một AI

Sao chép nguyên đoạn dưới cho Gemini, Codex hay Antigravity, đổi phần trong ngoặc vuông:

```
Bạn là người kiểm thử ứng dụng ExamCraft (soạn đề thi, giao bài, chấm điểm cho giáo viên Việt Nam).
Việc của bạn: làm đúng phần [01, 02, 03] trong thư mục docs/huong-dan/ban-test-day-du, bắt đầu từ 00_HUONG_DAN_DUNG_VA_CHUAN_BI.md và 11_BAN_GIAO_CHO_AI_VA_NGUOI_TEST.md.
Chỉ dùng http://127.0.0.1:3117 với tài khoản tôi đưa. Không sửa mã nguồn, không đọc .env, không dùng khóa API của tôi.
Với từng dòng test: làm đúng các bước, ghi Đ/K/B vào cột Kq, ghi bằng chứng (chữ thật đọc được trên màn hình hoặc tên ảnh) vào cột Ghi chú.
Tuyệt đối không ghi Đ cho dòng bạn không thực sự thấy kết quả. Không chắc thì ghi B và nêu lý do.
Đừng cố sửa lỗi. Gặp lỗi thì ghi K, mô tả bước, ghi lại, rồi làm tiếp dòng sau.
Cuối cùng viết BAO_CAO.md theo mẫu ở mục 6 và nêu số liệu bằng lệnh: node scripts/tally-test-results.cjs <thư mục của bạn>.
```

## 6. Mẫu `BAO_CAO.md`

```
# Báo cáo test <ngày> — <người hoặc AI> — phần <...>

Môi trường: máy chủ thử 127.0.0.1:3117, trình duyệt <...>, tài khoản <gv1/gv2/admin>.
Đã làm: <số dòng>; Đ <n>, K <n>, B <n>; chưa làm <n>.
Dòng 🔴 không đạt: <mã, mô tả một câu, ảnh>
Dòng 🟡/🟢 không đạt: <danh sách mã>
Dòng bỏ qua và lý do: <mã: lý do>
Điều lạ ngoài bảng: <những gì thấy không ổn dù không có dòng test>
Không chắc: <chỗ bạn nghi nhưng không kết luận được>
Thời gian đã dùng: <...>
```

## 7. Claude đọc báo cáo thế nào

Claude làm theo thứ tự: (1) đọc `BAO_CAO.md`; (2) chạy tổng hợp, so với số liệu trong báo cáo; (3) mở ảnh/bằng chứng của mọi dòng 🔴 K; (4) kiểm ngẫu nhiên các dòng 🔴 Đ bằng cách tự thao tác lại trên máy chủ thử; (5) phân loại lỗi: **lỗi thật của ứng dụng**, **lỗi tài liệu test** (mong đợi viết sai), **lỗi người test** (làm sai bước), **không tái hiện được**; (6) sửa lỗi thật, sửa tài liệu, và báo lại danh sách việc đã làm và việc cần người làm lại.
