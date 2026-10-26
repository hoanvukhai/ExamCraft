# BẢN TEST ĐẦY ĐỦ EXAMCRAFT — 00. Cách dùng và chuẩn bị

Bản test này dành cho **hai người test cùng nhau**: chủ dự án và một người nữa. Nó đi qua *toàn bộ chức năng* theo từng phần. Mỗi dòng là một việc cụ thể: làm gì, thấy gì thì đúng, rồi bạn ghi **Đ** (đạt), **K** (không đạt) hoặc **B** (bỏ qua, chưa thử được).

Tổng cộng khoảng 560 dòng kiểm trong 10 phần. Không cần làm một lần: mỗi phần độc lập, làm cuối tuần này một phần, tuần sau một phần cũng được. Nên làm theo thứ tự các phần 01 → 08, vì phần sau dùng dữ liệu của phần trước.

## 1. Hai người, ba vai

| Vai | Ai | Dùng gì |
|---|---|---|
| **A** — giáo viên 1 (chủ dự án) | Bạn | Trình duyệt chính trên máy tính, tài khoản `gv1` |
| **B** — giáo viên 2 | Người test cùng | Một máy khác, hoặc cửa sổ ẩn danh của trình duyệt khác (không dùng chung phiên đăng nhập với A), tài khoản `gv2` |
| **HS** — học sinh | A hoặc B đóng vai | **Điện thoại** cùng mạng Wi-Fi, hoặc cửa sổ ẩn danh thu nhỏ khoảng 375 px. Không đăng nhập. |

Khi một dòng ghi `[A]` thì A làm, `[B]` thì B làm, `[HS]` thì đóng vai học sinh. Dòng không ghi vai thì ai làm cũng được.

## 2. Ký hiệu mức quan trọng

- 🔴 **Phải đạt.** Liên quan quyền truy cập, mất dữ liệu, đáp án, điểm số. Một dòng 🔴 trượt là lỗi chặn, báo ngay.
- 🟡 **Quan trọng.** Chức năng chính nhưng có cách làm khác.
- 🟢 **Hình thức.** Chữ, bố cục, tiện dùng.

## 3. Chuẩn bị trước khi bắt đầu

### 3.1 Máy và phần mềm
- Chrome hoặc Edge bản mới; một cửa sổ ẩn danh; một điện thoại có Wi-Fi.
- **Microsoft Word** thật trên máy (không dùng Google Docs hay LibreOffice cho các dòng "mở bằng Word").
- Một máy in hoặc chức năng "Lưu thành PDF" của hộp thoại in.
- Excel hoặc Google Sheets để mở tệp CSV.
- Nên có **khóa Gemini API** cho phần 04 (AI). Không có khóa thì ghi **B** cho các dòng AI; phần còn lại làm được.

### 3.2 Sao lưu trước khi thử (🔴 làm đầu tiên)
Mở PowerShell trong thư mục dự án và chạy:

```bash
powershell -NoProfile -File scripts/backup.ps1 -Execute
```

Thấy dòng `BACKUP_PACKAGE_CREATED` là đã có bản sao trong thư mục `backups`. Cất bản sao đó sang ổ ngoài nếu dữ liệu thật của bạn nằm trong cùng cơ sở dữ liệu.

### 3.3 Quy ước đặt tên
Mọi đề, lớp, thư mục, bài giao tạo khi test đều **bắt đầu bằng `TEST-`** (ví dụ `TEST-Toan-9`, `TEST-Lop-7A`). Cuối đợt test, lọc theo `TEST-` rồi chuyển vào thùng rác cho dễ dọn.

### 3.4 Hai tài khoản giáo viên
1. Đăng nhập tài khoản quản trị, mở trang `/admin/users`.
2. Bấm **Cấp tài khoản giáo viên mới**, tạo `gv1@examcraft.test` và `gv2@examcraft.test` (Họ và tên, Email đăng nhập, Mật khẩu tạm hoặc **Sinh ngẫu nhiên**, Hạn mức gọi AI tối đa). Ghi lại mật khẩu tạm.
3. Mật khẩu tạm chỉ dùng được một lần: lần đầu đăng nhập hệ thống bắt đổi (phần 01 sẽ kiểm việc này).

### 3.4b Một tài khoản học sinh không cần tạo
Học sinh không có tài khoản. Họ vào bằng đường link của bài giao hoặc link lớp.

### 3.5 Bộ tệp mẫu
Tất cả nằm trong thư mục [mau-test](../mau-test/). Dùng đúng tên tệp ở bảng dưới khi các dòng test nhắc đến.

| Tệp | Dùng để |
|---|---|
| `mau-test/de-mau-da-mon/*.json` (9 tệp: Toán 9, Ngữ văn 7, Tiếng Anh 8, KHTN 6, Lịch sử và Địa lí 7, Tin học 8, Tiểu học 3, Vật lí 11, Hóa học 10) | Nhập vào kho bằng **Nhập tệp sao lưu**, để có ngay đề của nhiều môn mà không cần AI |
| `mau-test/de-mau-da-mon/*.docx` (cùng 9 đề, có đáp án) | Mở bằng Word thật để xem công thức, bảng, ngữ liệu |
| `mau-test/de-60-cau-co-cong-thuc.docx` | Nhập đề Word dài: 60 câu, công thức, 4 hình, một đoạn dùng chung |
| `mau-test/de-co-hinh-va-cong-thuc.docx` | Nhập đề Word có hình và công thức |
| `mau-test/de-co-lenh-cai.docx` | Kiểm tra chữ trong tệp không điều khiển được AI |
| `mau-test/anh-de-in-3-cau.png` | Nhập đề từ ảnh (OCR) |
| `mau-test/bang-markdown.txt` | Dán vào câu hỏi để kiểm bảng |
| `mau-test/goi-kien-thuc-mau-toan-6.json` | Nạp gói kiến thức mẫu (chỉ để thử, không phải chương trình chính thức) |
| [DE_MAU_DE_KIEM_TAY.md](../DE_MAU_DE_KIEM_TAY.md) | Ba khối đề dán sẵn: văn bản thô nhiều dạng, mã LaTeX EX_Test, Toán công thức phức tạp |

### 3.6 Những điều **không phải lỗi**
Hãy đọc [NHUNG_DIEU_CHUA_CO.md](../NHUNG_DIEU_CHUA_CO.md) trước. Thứ không có trong đó mà bạn thấy thiếu mới là phát hiện. Một số điều cần nhớ:
- Không có âm thanh hay tệp đính kèm trong đề.
- Hoàn tác (Undo) không tách theo từng người khi hai người cùng sửa.
- Mở trang hoàn toàn mới khi mất mạng thì không mở được (soạn dở trong tab đang mở thì giữ được).
- Mọi ô lớp–môn đều ghi "chờ duyệt": chưa có gói nào được duyệt chuyên môn.
- AI có thể sai: câu AI sinh luôn là **nháp** chưa kiểm, giáo viên phải kiểm.

## 4. Cách ghi kết quả

- Trong từng phần, cột **Kq** ghi `Đ`, `K` hoặc `B`. Có thể in phần đó ra giấy.
- Với mỗi dòng **K**: cột Ghi chú viết *đã làm gì → thấy gì → mong đợi gì*, kèm ảnh chụp màn hình nếu được. Mẫu ở [10_BANG_TONG_HOP_VA_BAO_LOI.md](10_BANG_TONG_HOP_VA_BAO_LOI.md).
- Gặp lỗi thì **không dừng cả đợt**; ghi lại rồi làm tiếp dòng sau, trừ khi lỗi chặn hẳn dòng kế tiếp.
- Khi nghi lỗi nặng (mất dữ liệu, lộ đáp án, sai điểm): dừng, chụp màn hình, **không** thao tác thêm trên đề đó, báo ngay.

## 5. Gợi ý lịch làm (sáu buổi, mỗi buổi khoảng hai giờ)

| Buổi | Phần | Cần ai | Cần gì thêm |
|---|---|---|---|
| 1 | 01 và 02 | A, một mình cũng được | — |
| 2 | 03 và 04 | A | Khóa AI (phần 04); tệp trong `mau-test` |
| 3 | 05 | A | Microsoft Word, máy in |
| 4 | 06 | **A và B cùng lúc** | Hai trình duyệt khác nhau |
| 5 | 07 | **A, B và một điện thoại** | Wi-Fi chung, điện thoại để đóng vai học sinh |
| 6 | 08 và 09 | A và B | Dọn dẹp ở cuối (10E) |

Khi chỉ có một người, làm được phần 01, 02, 03, 05, 08 (trừ vài dòng cần hai tài khoản). Phần 06 và 07 cần hai người hoặc hai trình duyệt.

## 6. Danh sách các phần

| Phần | Nội dung |
|---|---|
| [01](01_TAI_KHOAN_VA_KHO_DE.md) | Tài khoản, đăng nhập, quyền; Kho đề cá nhân |
| [02](02_SOAN_DE.md) | Soạn đề: 7 dạng câu, hình, công thức, ngữ liệu, phần, tiêu đề, kế hoạch/ma trận, mẫu, rà soát |
| [03](03_NHAP_DE.md) | Nhập đề: văn bản thô, LaTeX, Word, ảnh, đề dài, sao lưu/nhập kho cũ |
| [04](04_AI.md) | AI: khóa, sinh đề, sửa câu, thẩm định, Copilot, ghi chú riêng, phạm vi kiến thức |
| [05](05_XUAT_IN_TRINH_CHIEU_TRON_DE.md) | Xem trước, Word, in PDF, trình chiếu, trộn mã đề |
| [06](06_CHIA_SE_CONG_TAC_NGAN_HANG.md) | Chia sẻ, cộng tác, góp ý, lịch sử, ngân hàng câu hỏi |
| [07](07_LOP_GIAO_BAI_HOC_SINH_CHAM.md) | Lớp học, PIN, giao bài, học sinh làm bài, chấm, sửa đáp án, bảng điểm |
| [08](08_QUAN_TRI_SAO_LUU_MANG_BAO_MAT_GIAO_DIEN.md) | Quản trị, sao lưu/khôi phục, mất mạng, bảo mật, giao diện |
| [09](09_KIEM_THEO_TUNG_MON.md) | Kiểm riêng từng môn học và khối lớp |
| [10](10_BANG_TONG_HOP_VA_BAO_LOI.md) | Bảng tổng hợp kết quả và mẫu báo lỗi |
| [11](11_BAN_GIAO_CHO_AI_VA_NGUOI_TEST.md) | Chia việc cho người và các AI, môi trường an toàn, bằng chứng, báo cáo |
