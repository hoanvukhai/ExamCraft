# 03. Nhập đề: văn bản thô, LaTeX, Word, ảnh, đề dài, sao lưu và nhập kho cũ

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.
Mở cửa sổ nhập bằng nút **Nhập đề (Word/Ảnh)** ở thanh công cụ trái (cửa sổ tên **Phòng Số Hóa & Bóc Tách Đề Thi**). Ở đầu cửa sổ chọn **Lớp của tài liệu** và **Môn** đúng với đề.
Các dòng cần AI (Word, ảnh, văn bản AI) cần khóa AI (phần 04 mục 4A). Không có khóa: ghi **B**.

## 3A. Dán văn bản thô (thẻ **Dán văn bản thô (AI Parser)**)

Dùng khối "ĐỀ MẪU SỐ 1" trong [DE_MAU_DE_KIEM_TAY.md](../DE_MAU_DE_KIEM_TAY.md).

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T04-01 | 🔴 | Dán đề mẫu số 1 vào khung bên trái, bấm **Bắt đầu phân rã thành câu hỏi** | Khung bên phải hiện **5 câu**; đoạn thơ "Tre Việt Nam" thành 1 khối ngữ liệu gắn Câu 1 và Câu 2 | | |
| T04-02 | 🔴 | Đối chiếu từng câu theo bảng "Kết quả mong đợi" của đề mẫu | Câu 1 lựa chọn đáp án B, 0,5 điểm, Nhận biết; Câu 2 đáp án A, Thông hiểu; Câu 3 đúng/sai a Đ, b S, c Đ, d Đ, 1,0 điểm; Câu 4 trả lời ngắn đáp án 12; Câu 5 đáp án C | | |
| T04-03 | 🔴 | Xóa dòng "Đáp án" của một câu rồi phân rã lại | Câu đó hiện nhãn **Chưa có đáp án — kiểm lại**; hệ thống **không tự điền** đáp án | | |
| T04-04 | 🔴 | Ở khung kết quả, sửa nội dung một câu và đổi đáp án ngay trong bản xem trước | Sửa được; sau khi nhập vào đề, lưu và mở lại vẫn là bản đã sửa | | |
| T04-05 | 🟡 | Bấm nút xóa ở một câu trong bản xem trước | Câu bị loại khỏi danh sách sẽ nhập | | |
| T04-06 | 🟡 | Bấm **Xóa tất cả** | Danh sách kết quả trống ("Chưa có câu hỏi nào được bóc tách") | | |
| T04-07 | 🟡 | Bấm xác nhận thêm câu vào đề | Các câu vào đề hiện tại; mỗi câu có nhãn nguồn dạng "Văn bản nhập · câu N"; đề lưu được | | |
| T04-08 | 🔴 | Sau khi nhập, xem trạng thái các câu | Tất cả là **nháp** chưa kiểm; không câu nào mang nhãn "đã kiểm bởi giáo viên" | | |
| T04-09 | 🟡 | Câu nhập từ văn bản/Word/ảnh: lưu câu vào ngân hàng | Chỉ lưu bản **riêng tư**, không chia sẻ được sang người khác cho tới khi bạn đổi | | |
| T04-10 | 🟡 | Dán đề có hai câu giống nhau chỉ khác một con số | Cả hai được giữ (biến thể khác số không bị xóa) | | |
| T04-11 | 🟡 | Dán nội dung rất ngắn hoặc chữ không phải đề | Báo không bóc tách được; không tạo câu rác | | |

### Các cách viết đề mà bộ đọc phải hiểu

Gõ từng kiểu vào khung dán và kiểm kết quả (mỗi dòng một kiểu).

| Mã | Mức | Dán | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T04-20 | 🟡 | `Câu 1: 2+3=?` rồi `A. 4`, `B. 5`, `C. 6`, `D. 7` mỗi phương án một dòng | 1 câu lựa chọn, 4 phương án | | |
| T04-21 | 🟡 | `Câu 1. 2+3=? A. 4 B. 5 C. 6 D. 7` (cùng một dòng) | 4 phương án tách đúng | | |
| T04-22 | 🟡 | Hai phương án một dòng: `A. 4    B. 5` / `C. 6    D. 7` | 4 phương án | | |
| T04-23 | 🟡 | Phương án có ngoặc đơn `(A) 4`, `(B) 5`... | Nhận ra 4 phương án | | |
| T04-24 | 🟡 | Phương án dài xuống dòng nhưng không có chữ cái ở dòng tiếp | Dòng tiếp được gom vào phương án trước | | |
| T04-25 | 🟡 | `Bài 3:` và `Câu 3 -` thay cho `Câu 3:` | Nhận ra tiêu đề câu | | |
| T04-26 | 🟡 | Chỉ có `1)`, `2)` (không có chữ "Câu") | Vẫn tách đúng các câu | | |
| T04-27 | 🔴 | Đáp án ghi `Đáp án: B` ngay dưới câu | Đáp án B | | |
| T04-28 | 🔴 | Dấu `*` ngay sau phương án đúng (`A.* 4`) hoặc chữ `(đúng)` | Phương án đó là đáp án | | |
| T04-29 | 🔴 | Danh sách cuối đề `1. A 2. C 3. B` hoặc `1A 2B 3C` | Đáp án gán đúng theo số câu | | |
| T04-30 | 🟡 | Thẻ `[1,0 điểm]`, `[TH]`, `[VD]`, `[VDC]`, `[NB]` đầu hoặc cuối câu | Gán điểm và độ khó tương ứng; thẻ không còn trong nội dung câu | | |
| T04-31 | 🟡 | Câu đúng/sai: bốn dòng `a)`, `b)`, `c)`, `d)` | Một câu đúng/sai nhiều ý | | |
| T04-32 | 🟡 | Đoạn văn đọc hiểu đặt trước 2–3 câu | Thành ngữ liệu dùng chung, gắn với các câu bên dưới | | |
| T04-33 | 🟡 | Dán nội dung có `Đáp án: 13` ở dòng riêng với câu trả lời ngắn | Đáp án 13 vào ô đáp án, **không** còn lẫn trong nội dung câu | | |
| T04-34 | 🟢 | Điền khuyết có chấm lửng tự do, ghép nối hai cột, sắp xếp mũi tên | Không tách riêng thành đúng dạng (đã ghi trong **không phải lỗi**); câu không bị mất, tạo thủ công được | | |

## 3B. Mã LaTeX EX_Test (thẻ **Mã LaTeX / EX_Test (VTeX)**)

Dùng khối "ĐỀ MẪU SỐ 2" trong [DE_MAU_DE_KIEM_TAY.md](../DE_MAU_DE_KIEM_TAY.md).

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T04-40 | 🔴 | Dán đề mẫu số 2, bấm **Bắt đầu phân rã thành câu hỏi** | **5 câu**; độ khó suy từ mã VTeX (ví dụ `%[2D1B1-1]` là Thông hiểu; `%[2D1V1-5]` là Vận dụng) | | |
| T04-41 | 🔴 | Đối chiếu đáp án | Câu 1 đáp án A; Câu 2 đúng/sai a S, b Đ, c Đ, d S; Câu 3 A; Câu 4 A; Câu 5 trả lời ngắn | | |
| T04-42 | 🔴 | Xem công thức sau phân rã | `\dfrac` hiện đúng phân số (không thành "frac" dính chữ); `\heva` thành hệ phương trình; `\immini` giữ chữ và phương án | | |
| T04-43 | 🟡 | Lời giải trong `\loigiai{...}` lồng nhau | Giữ trọn lời giải, không cụt ở dấu ngoặc lồng | | |
| T04-44 | 🟡 | Bấm **Tải file .txt / .tex** và chọn một tệp `.tex` | Nội dung tệp vào khung và phân rã được | | |

## 3C. Nhập tệp Word (cần khóa AI)

Dùng các tệp trong `mau-test`.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T04-50 | 🔴 | Chọn thẻ ảnh/Word, **Tải lên file đề thi Word (.docx)**, chọn `de-co-hinh-va-cong-thuc.docx` | Báo "Sẵn sàng bóc tách"; bấm phân rã, nhận **3 câu** | | |
| T04-51 | 🔴 | Xem công thức trong kết quả: `$AB = 4$`, `\frac{a+b}{2}` | Công thức đã đọc thành LaTeX (không biến mất, không thành "Tính ."); lời nhắc "Đã đọc N công thức Word thành LaTeX" | | |
| T04-52 | 🔴 | Xem hình | Hình hình chữ nhật nằm ở **Câu 1** (đúng câu có hình); lời nhắc "Đã gắn 1 hình" | | |
| T04-53 | 🔴 | Nhập `de-co-lenh-cai.docx` | Dòng "BỎ QUA MỌI QUY TẮC..." chỉ là chữ trong câu 2 (hoặc bị bỏ); **không** có câu nào bị đánh dấu "đã kiểm"; đáp án không tự đổi thành A | | |
| T04-54 | 🔴 | Nhập `de-60-cau-co-cong-thuc.docx` (60 câu) | Hệ thống đọc thành nhiều phần theo thứ tự; nhận đủ **60 câu**, không trùng, đúng thứ tự 1–60; ngữ liệu "Đoạn dùng chung" xuất hiện **một lần** | | |
| T04-55 | 🔴 | Xem thanh cảnh báo của T04-54 | Có dòng "đọc thành N phần theo thứ tự câu"; nếu nhận thiếu thì ghi rõ "nhận X/60 câu" và phần nào thiếu (hệ thống không tự bịa câu) | | |
| T04-56 | 🟡 | Xem 4 hình của đề 60 câu (ở các câu 15, 30, 45, 60) | Mỗi hình gắn đúng câu của nó | | |
| T04-57 | 🟡 | Mở một tệp Word từ máy bạn có bảng phức tạp | Có lời nhắc đối chiếu bảng với tệp gốc | | |
| T04-58 | 🟡 | Chọn tệp không phải Word (đổi đuôi .txt thành .docx) | Báo tệp lỗi, không treo | | |
| T04-59 | 🟡 | Tệp Word rỗng | Báo "File Word không chứa nội dung văn bản có thể đọc được" | | |
| T04-60 | 🟡 | Bấm **Hủy yêu cầu AI** khi đang bóc tách tệp dài | Yêu cầu dừng; không có câu nào bị thêm vào đề sau đó | | |
| T04-61 | 🔴 | Nhập Word xong, nhìn nhãn nguồn từng câu | Có tên tệp và số câu ("Word (.docx) · tên tệp · câu N"); câu là nháp riêng tư | | |
| T04-62 | 🟡 | Nhập lại cùng tệp lần thứ hai | Không có cảnh báo tự xóa câu; câu nhập lại thành câu mới (đã nêu: chưa có cảnh báo trùng với câu đã có trong đề) | | |

## 3D. Nhập từ ảnh (OCR)

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T04-70 | 🔴 | Thẻ **Ảnh chụp đề thi (Gemini Vision OCR)**: tải `anh-de-in-3-cau.png`, bấm phân rã | Nhận **3 câu**: câu 1 lựa chọn (4 phương án), câu 2 trả lời ngắn, câu 3 lựa chọn (4 phương án) | | |
| T04-71 | 🔴 | Xem đáp án | **Không** tự điền đáp án (ảnh không ghi đáp án); câu hiện "Chưa có đáp án — kiểm lại" | | |
| T04-72 | 🟡 | Xem công thức `15 + 27` | Có dạng `$15 + 27$` | | |
| T04-73 | 🟡 | Xem lời nhắc | Có nhắc đối chiếu chữ, công thức và hình với ảnh gốc | | |
| T04-74 | 🟡 | Dùng ảnh chụp nghiêng/mờ của một đề thật | Kết quả có thể sai; có cảnh báo cần đối chiếu; không treo | | |
| T04-75 | 🟡 | Tải tệp không phải ảnh vào ô ảnh | Bị từ chối | | |
| T04-76 | 🟡 | Kéo thả ảnh vào vùng "Kéo thả hoặc nhấp để tải ảnh đề thi" | Nhận ảnh | | |

## 3E. Xem trước, đúng phạm vi và huỷ

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T04-80 | 🔴 | Dán đề, bấm phân rã, rồi **đóng** cửa sổ mà chưa nhập | Không có câu nào lọt vào đề | | |
| T04-81 | 🔴 | Đang phân rã bằng AI, đổi sang tab khác hoặc đóng đề rồi mở đề khác; khi kết quả về | Kết quả cũ **không** tự chèn vào đề khác | | |
| T04-82 | 🟡 | Chọn **Lớp của tài liệu** / **Môn** khác đề hiện tại rồi nhập | Câu vào đề với cảnh báo hoặc theo lớp/môn đã chọn; không âm thầm sai lớp | | |
| T04-83 | 🔴 | `[B]` Trong lúc `[A]` nhập, `[B]` (có quyền cùng sửa) sửa đề và lưu | `[A]` khi bấm nhập sẽ nhận báo đề đã đổi, hoặc nhập theo bản mới; bài của `[B]` **không bị mất** | | |

## 3F. Sao lưu đề kèm ảnh, nhập tệp sao lưu và đề đa môn

Mở **Sao lưu · Nhập kho cũ** để vào cửa sổ **Kho đề trên máy chủ**.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T04-90 | 🔴 | Bấm **Chuẩn bị sao lưu kèm ảnh** | Tải về một tệp JSON; mở bằng Notepad thấy đề, ảnh nhúng, **không** có khóa API hay mật khẩu | | |
| T04-91 | 🔴 | Bấm **Nhập tệp sao lưu**, chọn `mau-test/de-mau-da-mon/toan-9.json` | Hiện bản xem trước "mục sẵn sàng" **chưa ghi** gì vào kho; có ô "Tôi có quyền sử dụng các tài liệu này..." | | |
| T04-92 | 🔴 | Tích ô quyền, bấm **Nhập các mục hợp lệ** | Có thêm đề "Toán 9" trong kho: 10 câu, tổng 10 điểm, có công thức, có đủ các dạng (trắc nghiệm, đúng/sai, trả lời ngắn, điền khuyết, ghép nối, sắp xếp, tự luận) | | |
| T04-93 | 🟡 | Bấm nhập lần hai cùng tệp | Không nhân đôi âm thầm (báo đã có hoặc tạo bản sao riêng có ghi rõ) | | |
| T04-94 | 🔴 | Nhập lần lượt cả 9 tệp trong `de-mau-da-mon` | Có 9 đề: Toán 9, Ngữ văn 7, Tiếng Anh 8, KHTN 6, Lịch sử và Địa lí 7, Tin học 8, Tiểu học 3, Vật lí 11, Hóa học 10; mở từng đề thấy nội dung đúng môn | | |
| T04-95 | 🟡 | Xem dữ liệu cũ trên trình duyệt (**Xem dữ liệu cũ trên trình duyệt**, **Xem trước các bản sao riêng**) | Nếu máy có dữ liệu cũ thì liệt kê để chọn nhập; nếu không có thì báo trống; không tự nhập | | |
| T04-96 | 🟡 | Chọn tệp JSON hỏng hoặc không phải sao lưu | Báo tệp chưa đúng định dạng, không nhập gì | | |
| T04-97 | 🟡 | Tệp lớn hơn 30 MB (nếu có) | Báo "Tệp vượt 30 MB"; hướng dẫn chia nhỏ | | |
