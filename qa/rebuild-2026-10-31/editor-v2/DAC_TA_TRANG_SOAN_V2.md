# Đặc tả trang soạn đề — bản 2: chọn và sửa ngay trên tờ đề (31/10/2026)

Claude viết sau trao đổi với chủ dự án ngày 31/10. **Trạng thái: chờ chủ dự án duyệt, chưa làm.**

Bản 2 **thay** các mục 3, 4, 5, 6, 9, 10, 11, 12, 14, 16, 20, 21 của bản 1 (`qa/rebuild-2026-10-30/editor-canva/DAC_TA_TRANG_SOAN.md`). Vẫn **giữ** của bản 1: mục 7 (thông tin đề, bố cục in; mục 14 dưới đây sửa phần cách sửa dòng in), mục 8 (thân đề theo dạng câu), mục 18 (chữ trên màn hình), mục 19 (dữ liệu; mục 17 dưới đây bổ sung), mục 23 (ràng buộc làm việc).

Bản 1 đã đặt hướng "nhìn và sửa trên chính tờ đề, một việc một chỗ", nhưng giai đoạn A làm lệch: cây thẻ câu cũ được đặt cạnh tờ đề cũ nên một đề hiện hai lần, phải bấm đúp mới sửa, và nhiều việc có 3–6 chỗ bấm. Bản 2 đưa phần làm về đúng hướng đó và nói rõ cách làm. Mã yêu cầu dạng `[TS2-x]`.

---

## 0. Đã chốt

| Mã | Quyết định | Nguồn |
|---|---|---|
| A | Bỏ cây thẻ câu ở bảng trái. Tờ đề là nơi chọn; bảng trái hiện **Chi tiết** của thứ đang chọn | Chủ dự án đồng ý |
| B | Có thẻ **Dàn ý** gọn: mỗi mục một dòng, kéo đổi thứ tự, chọn nhiều; không có ô sửa | Đồng ý |
| C | Bỏ nút "Áp dụng câu": sửa đến đâu tờ đề đổi đến đó, tự lưu khi hợp lệ, có Hoàn tác/Làm lại; nháp trên máy vẫn giữ để cứu | Đồng ý |
| D | **Một chỗ AI**: nút AI mở bảng AI bên phải; gộp Trợ lý sửa đề, Hỏi AI, AI tạo câu, các lệnh AI của câu | Đồng ý |
| E | Bỏ ô "Chế độ Sửa/Góp ý/Xem" và nút ⋯ "Thêm công cụ" | Đồng ý |
| F | Thêm bảng DB `ExamPresence` (ai đang mở, đang sửa gì). Chạy trên DB thử trước, hỏi trước khi chạy DB thật, có sao lưu | Đồng ý |
| G | Giữ Trình chiếu, chỉ trong Xuất ▾, không chặn rà soát; rà lại và sửa theo mục 15.3 | Đồng ý, yêu cầu kiểm lại |
| H | Chia trang thật: khối không vừa thì sang trang sau. Dải trang ngang ở dưới kiểu Canva, có thao tác trang | Đồng ý |
| — | Không làm giai đoạn F (gõ chung thời gian thực); mục 13 thay thế | Đồng ý |
| — | Chưa làm gõ trực tiếp trên giấy (cần thư viện soạn thảo) | Để sau |
| — | Phần B còn lại: không làm đầu trang 3 cột; làm phông/cỡ/lề, gộp chỗ sửa dòng in, lưu bố cục vào mẫu | Claude quyết theo ủy quyền |

---

## 1. Chỗ trùng hiện có và chỗ duy nhất sau khi làm `[TS2-1]`

| Việc | Hiện có ở | Bản 2: chỉ ở |
|---|---|---|
| Xem nội dung đề | Tờ đề giữa; cây thẻ câu bên trái hiện lại nội dung; ô Chế độ "Xem"; nút Soạn/Xem trên điện thoại | Tờ đề |
| Sửa câu | Bấm thẻ ở cây; "Chỉnh nội dung" ở hàng công cụ; bấm đúp tờ đề; ô Điểm trên thẻ | Bấm câu trên tờ đề → bảng trái |
| Thêm nội dung | Thêm ▾ ("Tự soạn câu mới"…); menu ＋ trong cây ("Câu tự soạn", "Nội dung dùng chung"); ⋯ của phần | Thêm ▾ theo vùng chọn; dấu ＋ trên tờ đề mở **cùng** menu đó |
| AI | AI ▾ (Sửa đề bằng Trợ lý, Hỏi AI); Thêm ▾ → Sinh bằng AI; thanh trái "AI tạo câu"; lệnh câu (Hỏi AI về cả câu, AI sửa, Đổi số liệu, Tạo câu tương đương, Thẩm định); thẻ AI bên phải; ngăn kéo Hỏi AI riêng | Bảng AI bên phải (mở bằng nút AI; "Sinh bằng AI" trong Thêm ▾ mở thẳng mục Sinh câu) |
| Thông tin đề | Thanh trái "Thông tin"; nút "Thông tin đề"; bấm dòng đầu trang | Chi tiết của Toàn đề |
| Dòng in | Thông tin đề → "Dòng in, vị trí và căn chỉnh nâng cao"; Mẫu → Bố cục in (sửa từng vùng) | Bấm khối in trên tờ đề; Mẫu chỉ còn chọn mẫu nhanh |
| Mẫu đề | Thanh trái Mẫu; ⋯ → Dùng mẫu / lưu thành mẫu | Thanh trái Mẫu |
| Rà soát | ⋯ → Rà soát đề; tự bật trước Giao bài, Xuất, Trình chiếu; dấu !; thẻ phải | Thẻ Rà soát (mở bằng nút "Rà soát · n" hoặc dấu !); chỉ chặn trước Giao bài |
| Góp ý, cộng tác | Mời; Chế độ "Góp ý"; ⋯ Cùng soạn; bong bóng; thẻ Góp ý; Giao bài khi không có quyền | Thẻ Góp ý & cộng tác (Mời, Góp ý trên hàng công cụ, bong bóng đều mở thẻ này) |
| Trình chiếu | Xuất ▾ và thanh dưới | Xuất ▾ |
| Hoàn tác | Nút Hoàn tác/Làm lại riêng trên từng thẻ câu | ↶ ↷ chung ở thanh trên |

Quy tắc khi làm: trước khi thêm nút, menu hay bảng nào, kiểm việc đó đã có chỗ chưa; có rồi thì dẫn về chỗ đó, không làm bản thứ hai.

---

## 2. Nguyên tắc `[TS2-2]`

- **NT1. Một tờ đề.** Trong trang soạn, nội dung đề chỉ hiện ở vùng trang. Không có bản thứ hai (cây thẻ, khung xem trước riêng).
- **NT2. Chọn rồi làm.** Mọi lệnh tác động lên thứ đang chọn. Không gắn nút lệnh lên từng câu.
- **NT3. Một việc một chỗ** (mục 1).
- **NT4. Thêm theo ngữ cảnh.** Thêm ▾ chèn vào đúng chỗ đang chọn; tên mục giống nhau ở mọi nơi.
- **NT5. Tự lưu, có hoàn tác.** Sửa tay không cần nút Áp dụng. Thay đổi do AI vẫn phải duyệt.
- **NT6. Không đổi đề cũ khi không sửa.** Đề cũ in và xuất như cũ cho đến khi giáo viên đổi bố cục (ngoại lệ có chủ ý: mục 10.7).
- **NT7. Tên gọi thống nhất:** Toàn đề, Trang, Khối in, Phần, Ngữ liệu (nhóm), Câu, Phương án, Mệnh đề, Ý, Hình, Điểm chèn.

---

## 3. Bố cục màn hình `[TS2-3]`

Máy tính (≥ 1024px):

```
┌ Thanh trên ───────────────────────────────────────────────────────────────────────────┐
│ ☰  ↶ ↷  Tên đề  ● Đã lưu   (L)(M)   [Rà soát · 3] [Mời] [Xuất ▾] [Giao bài ▾]  (ảnh)  │
├ Hàng công cụ ─────────────────────────────────────────────────────────────────────────┤
│ [+ Thêm ▾] [AI] │ Toàn đề › Phần I › Câu 3 │ lệnh của Câu 3 …               [Khác ▾] │
├────┬───────────────┬─────────────────────────────────────────────┬────────────────────┤
│Chi │ Bảng trái     │ Vùng trang (cuộn dọc)                        │ Bảng phải (khi mở) │
│tiết│ (Chi tiết của │  Trang 1                    [khóa][⧉][🗑]    │ [AI][Góp ý][Rà soát]│
│Mẫu │  thứ đang     │  ┌──────────── tờ A4 ────────────┐           │                    │
│Ngân│  chọn, hoặc   │  │ …                             │           │                    │
│hàng│  tài nguyên)  │  └───────────────────────────────┘           │                    │
│Nhập│               │  Trang 2 …                                   │                    │
│Dàn │               │                                              │                    │
│ ý  │               │                                              │                    │
├────┴───────────────┴─────────────────────────────────────────────┴────────────────────┤
│ Đề · Đáp án · Lời giải · Ma trận  ☐ Song song      [▤ Trang] [▦ Lưới]  3/5   − 65% +   │
│ [1][2][3][4][5][+]   ← dải trang ngang, bật/tắt bằng nút Trang                          │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

- Bảng trái 320–720px (mặc định 400), bảng phải 300–560px (mặc định 380); kéo đổi rộng, thu gọn, nhớ độ rộng (đã có `ResizablePanel`).
- Bảng phải chỉ hiện khi mở; không có cột biểu tượng thường trực.
- Máy tính bảng (640–1023px): bảng trái và phải mở đè lên vùng trang.
- Điện thoại: mục 16.

---

## 4. Thanh trên `[TS2-4]`

Từ trái sang phải:

1. **☰ Menu ứng dụng:** Về Kho đề, Tạo đề mới, Ngân hàng câu hỏi, Lớp học, Bài đã giao, Thùng rác (giữ `AppMenu`).
2. **↶ Hoàn tác, ↷ Làm lại** (mục 9.3).
3. **Tên đề** (bấm để đổi tên, giữ như hiện nay).
4. **Trạng thái lưu.** Bấm vào: chi tiết lưu, bản soạn dở trên máy (`EditorPending` chuyển vào đây), chỗ cần chọn bản (mục 13.4).
5. **Người đang mở:** vòng tròn chữ cái, mỗi người một màu cố định. Bấm: danh sách "Cô Lan · đang sửa Câu 5", "Thầy Minh · đang xem".
6. **Rà soát · n:** chỉ hiện khi có mục cần xem; bấm mở thẻ Rà soát.
7. **Mời:** mở thẻ Góp ý & cộng tác, mục Người cùng soạn.
8. **Xuất ▾** (mục 15.1).
9. **Giao bài ▾:** nút chính là Giao bài; mũi tên mở Kết quả bài đã giao (n), Link đã chia sẻ.
10. **Ảnh đại diện:** Tài khoản, Ghi chú riêng cho AI, Khóa AI, Sáng/tối (giữ `AccountMenu`).

Bỏ: ô Chế độ, nút ⋯ "Thêm công cụ" (`MoreMenu`), nút Soạn/Xem trên điện thoại.

---

## 5. Hàng công cụ `[TS2-5]`

```
[+ Thêm ▾] [AI] │ đường dẫn: Toàn đề › Phần I › Câu 3 │ lệnh của đối tượng … [Khác ▾]
```

- **Thêm ▾** và **AI** luôn ở đầu, không đổi chỗ, không biến mất.
- **Đường dẫn:** mỗi cấp bấm được để chọn cấp đó; cấp cuối đậm.
- **Lệnh:** theo bảng mục 7, đúng thứ tự trong bảng; hiện tối đa khoảng 6 lệnh, phần còn lại vào **Khác ▾**.
- Khi con trỏ đang ở một ô chữ của bảng Chi tiết và có bôi đen chữ, thêm nhóm **Đậm · Nghiêng · Gạch chân · x² · x₂ · Công thức** ngay sau đường dẫn (các lệnh này đã có, nay hiện thẳng thay vì nằm trong Khác).
- Luôn một hàng. Trên điện thoại hàng này ở đáy màn hình và cuộn ngang.
- Giữ `aria-label="Công cụ soạn đề"`; đường dẫn có `aria-label="Đang chọn"`.

---

## 6. Mô hình chọn `[TS2-6]`

### 6.1 Đối tượng chọn được

| Đối tượng | Mã chọn | Cấp cha | Chọn trên tờ đề bằng cách |
|---|---|---|---|
| Toàn đề | `exam` | — | Bấm phần giấy trống hoặc nền xám ngoài tờ |
| Trang | `page:<n>` | Toàn đề | Bấm hình nhỏ ở dải trang hoặc nhãn "Trang n" |
| Khối in | `print:<vùng>:<mã dòng>` | Toàn đề | Bấm một dòng ở đầu trang (cột trái, cột phải, dòng tiêu đề), dòng thí sinh, lời dặn, cuối đề, chân trang |
| Phần | `part:<nodeId>` | Toàn đề | Bấm tiêu đề hoặc lời dẫn của phần |
| Ngữ liệu (nhóm) | `group:<nodeId>` | Phần hoặc Toàn đề | Bấm khung ngữ liệu, ngoài các câu bên trong |
| Câu | `question:<id>` | Ngữ liệu, Phần hoặc Toàn đề | Bấm số câu hoặc nội dung câu |
| Phương án | `choice:<id>:<key>` | Câu | Bấm phương án |
| Mệnh đề Đúng/Sai | `statement:<id>:<key>` | Câu | Bấm mệnh đề |
| Ý tự luận | `item:<id>:<partId>` | Câu | Bấm ý a), b)… |
| Cặp ghép / mục sắp xếp | `pair:<id>:<pairId>`, `order:<id>:<key>` | Câu | Bấm dòng |
| Hình | `figure:<chủ>:<figureId>` | Câu, Phương án, Ý hoặc Ngữ liệu | Bấm hình |
| Điểm chèn | `insert:<parentId>:<afterId>` | — | Bấm dấu ＋ |

### 6.2 Chuột

- Một lần bấm chọn **đối tượng sâu nhất** dưới chuột (bấm phương án B là chọn Phương án B). **Không có bấm đúp.**
- Rê chuột: viền nét đứt mảnh. Đang chọn: viền liền 1,5px màu nhấn kèm thẻ tên nhỏ ("Câu 3").
- Bấm vào chữ của đối tượng: bảng Chi tiết đặt con trỏ vào đúng ô tương ứng (nội dung câu, phương án B, ý a…).
- Không kéo thả đối tượng trên tờ đề ở bản 2. Đổi thứ tự bằng Lên/Xuống, Alt+↑/↓, Dàn ý hoặc dải trang.
- Mọi bản xem (Đề, Đáp án, Lời giải, Song song) đều chọn được câu. Ở bản Đáp án/Lời giải, chọn câu thì con trỏ vào ô Đáp án/Lời giải. Ma trận chỉ để xem.

### 6.3 Bàn phím (khi tiêu điểm ở vùng trang)

| Phím | Việc |
|---|---|
| ↑ / ↓ | Đối tượng trước / sau cùng cấp |
| → / ← | Vào cấp con đầu tiên / lên cấp cha |
| Esc | Lên cấp cha; ở Toàn đề thì bỏ qua. Trong bảng Chi tiết: trở lại tờ đề |
| Enter | Đưa con trỏ vào ô đầu tiên của bảng Chi tiết |
| Delete | Xóa đối tượng (hỏi trước khi xóa phần, ngữ liệu, trang hoặc nhiều câu) |
| Ctrl+D | Nhân bản |
| Alt+↑ / Alt+↓ | Lên / xuống |
| Ctrl+C / Ctrl+V | Sao chép / dán (mục 11.6) |
| Ctrl+Z / Ctrl+Shift+Z | Hoàn tác / làm lại (khi không ở trong ô chữ) |
| PageUp / PageDown | Sang trang trước / sau |

Tab vào vùng trang đặt tiêu điểm ở đối tượng đang chọn (roving tabindex); Tab tiếp theo ra khỏi vùng trang.

### 6.4 Dấu hiệu trên tờ đề

Không in, không ra Word, không ra trình chiếu:

- Đối tượng bị khóa: biểu tượng khóa nhỏ ở góc phải.
- Người khác đang sửa: viền màu của người đó kèm tên (mục 13.2).
- Góp ý chưa giải quyết: bong bóng số ở lề phải (đã có).
- Mục cần rà soát: dấu ! ở lề trái (đã có).
- Vừa bị người khác đổi: chấm màu nhỏ ở lề trong 1 phút (mục 13.3).
- Dấu ＋: đường mảnh **luôn thấy** giữa các câu, cuối phần, cuối ngữ liệu, cuối đề; vùng chạm cao ít nhất 24px.

### 6.5 Chọn nhiều

- Shift+bấm: chọn một dải câu liên tiếp. Ctrl+bấm: thêm hoặc bớt từng câu. Dàn ý có ô chọn. Dải trang dùng Shift/Ctrl như vậy cho trang.
- Hàng công cụ khi chọn nhiều câu: "n câu" · Chuyển sang phần ▾ · Đặt điểm ▾ · Nhân bản · Khóa · Gộp vào ngữ liệu ▾ · Xóa.
- Bảng trái: tóm tắt (số câu, tổng điểm, các dạng). Bảng AI biết các câu đang chọn.

### 6.6 Thuộc tính cho truy cập và kiểm thử

- Mỗi đối tượng có `data-object="<mã chọn>"`, tên truy cập ("Câu 3", "Phương án B của Câu 3", "Đầu trang, cột trái, dòng 2") và `aria-selected`.
- Một vùng thông báo đọc "Đã chọn Câu 3".

---

## 7. Lệnh theo đối tượng `[TS2-7]`

"3 nguồn câu" = Từ ngân hàng · Nhập Word/Ảnh · Sinh bằng AI. Hai mục đầu mở thẻ tương ứng ở bảng trái; mục thứ ba mở bảng AI, mục Sinh câu. Cả ba ghi sẵn chỗ chèn ("Thêm vào: sau Câu 1", dùng `describeInsertion` đã có). "Câu ▸" mở danh sách dạng: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Trả lời ngắn, Tự luận, Điền khuyết, Ghép nối, Sắp xếp.

| Đối tượng | Hàng công cụ (theo thứ tự) | Thêm ▾ chèn vào | Bảng Chi tiết |
|---|---|---|---|
| Toàn đề | Cột phương án ▾ · Phông ▾ · Cỡ chữ ▾ · Bố cục in ▾ (mẫu nhanh) · Góp ý | Cuối đề: Phần · Câu ▸ · Ngữ liệu · Ngắt trang · 3 nguồn câu | Thông tin đề · Yêu cầu ra đề · Trang và in (mục 8.1) |
| Trang | Nhân bản trang · Khóa trang · Ngắt trang sau · Sao chép · Xóa trang | Sau khối cuối của trang: như Toàn đề | "Trang 2: Câu 9–15" và các lệnh trên |
| Khối in | Chèn trường ▾ · Đậm · Nghiêng · IN HOA · Căn ▾ · Ẩn dòng · Xóa dòng | Trong vùng đó: Dòng mới · Trường tự điền ▸ | Chữ của dòng, kiểu, căn lề; đầu trang có thêm "In ở trang đầu / mọi trang" |
| Phần | Đánh số ▾ · Trang mới ☐ · Lên · Xuống · Nhân bản · Góp ý · Khác ▾ (Sao chép, Xóa phần) | Cuối phần: Câu ▸ · Ngữ liệu · Ngắt trang · 3 nguồn câu | Tên, lời dẫn, đánh số phần, đánh số câu, bắt đầu trang mới; "n câu · tổng điểm" |
| Ngữ liệu | Giữ cùng trang ☐ · Dùng lại ngữ liệu ▾ · Lên · Xuống · Góp ý · Khác ▾ (Bỏ nhóm giữ câu, Xóa nhóm) | Cuối nhóm: Câu ▸ · Hình vào ngữ liệu | Tiêu đề, nội dung, nguồn, hình; "đang dùng cho n nhóm" và Tách thành bản riêng |
| Câu | Dạng ▾ · Điểm · Lời giải · Cột phương án ▾ (chỉ trắc nghiệm) · Góp ý · Nhân bản · Lên · Xuống · Khác ▾ (Sao chép, Chuyển sang phần ▸, Trang mới trước câu này, Khóa câu, Lưu vào ngân hàng, Xóa) | Sau câu: Câu ▸ · Phương án / Mệnh đề / Ý / Cặp / Mục (theo dạng) · Hình · Công thức · Bảng · 3 nguồn câu | Biểu mẫu câu đầy đủ (mục 8.2) |
| Phương án | Đặt là đáp án đúng · Ghim vị trí · Lên · Xuống · Xóa | Sau phương án: Phương án · Hình vào phương án | Biểu mẫu câu, con trỏ ở ô phương án đó |
| Mệnh đề Đ/S | Đúng · Sai · Lên · Xuống · Xóa | Sau mệnh đề: Mệnh đề · Hình | Biểu mẫu câu, con trỏ ở ô mệnh đề |
| Ý tự luận | Điểm ý · Barem · Lên · Xuống · Xóa | Sau ý: Ý · Hình vào ý | Biểu mẫu câu, con trỏ ở ý |
| Cặp ghép / mục sắp xếp | Lên · Xuống · Xóa | Sau dòng: Cặp / Mục | Biểu mẫu câu |
| Hình | Sửa hình · Cỡ ▾ (4 mức) · Thay ảnh · Lên · Xuống · Xóa | (theo đối tượng chứa hình) | Bộ sửa hình (`FigureEditor` đã có) |
| Điểm chèn | — | Tại điểm đó (menu tự mở): Câu ▸ · Ngữ liệu · Phần (chỉ ở cấp ngoài cùng) · Ngắt trang · 3 nguồn câu | "Chèn vào: sau Câu 1" và danh sách như menu |
| Nhiều câu | Mục 6.5 | Sau câu cuối: như Câu | Tóm tắt |

Ý nghĩa các mục Thêm:

- **Câu (dạng X):** chèn câu mới có khung theo dạng (trắc nghiệm có sẵn A–D trống, Đúng/Sai có a–d…), chọn câu đó, con trỏ ở ô Nội dung. Câu mới vẫn **trống hoàn toàn** khi bỏ chọn thì tự bỏ, kèm thông báo "Đã bỏ câu trống" và Hoàn tác.
- **Ngữ liệu:** tạo nhóm mới với ngữ liệu trống. Mục "Dùng lại ngữ liệu đã có ▸" liệt kê ngữ liệu trong đề.
- **Phần:** phần mới sau phần đang chọn, hoặc cuối đề.
- **Ngắt trang:** đặt "bắt đầu ở trang mới" cho khối ngay sau điểm chèn.
- **Hình:** thêm hình vào đối tượng đang chọn (câu, phương án, ý, ngữ liệu) rồi mở bộ sửa hình ở bảng trái. Loại hình: Ảnh (tải lên hoặc dán), Đồ thị hàm số, Bảng biến thiên, Hình học. Phần "Hình và đồ thị" trong biểu mẫu câu chỉ còn danh sách hình đã có.
- **Công thức:** chèn `$…$` tại con trỏ của ô đang sửa (không có ô thì cuối nội dung câu) và chọn sẵn phần giữa.
- **Bảng:** chèn bảng 2×2 dạng bảng markdown đã hỗ trợ.
- **Phương án / Mệnh đề / Ý / Cặp / Mục:** thêm dòng mới sau dòng đang chọn (không chọn dòng nào thì thêm cuối).

---

## 8. Bảng trái `[TS2-8]`

Thanh dọc còn 5 mục: **Chi tiết · Mẫu · Ngân hàng · Nhập đề · Dàn ý.**

Bỏ: "Nội dung" (cây thẻ câu), "Thông tin" (gộp vào Chi tiết của Toàn đề), "AI tạo câu" (sang bảng AI).

Chọn một đối tượng trên tờ đề thì bảng trái tự chuyển về Chi tiết. Ngoại lệ: đang mở Ngân hàng hoặc Nhập đề để thêm vào một điểm chèn; khi đó giữ thẻ nguồn và hiện dòng "Đang chọn: Câu 3 · Mở chi tiết".

### 8.1 Chi tiết · Toàn đề

Ba mục gập được:

1. **Thông tin đề:** Thông tin cơ bản (Tên đề*, Lớp*, Môn*, Cách đánh giá*, Thời lượng, Loại bài) và Thông tin in (Đơn vị, Trường, Năm học, Học kỳ, Mã đề, Ghi chú). Giữ thứ tự và dấu `*` đã làm ở giai đoạn B.
2. **Yêu cầu ra đề:** Khung mức nhận thức, Phạm vi kiến thức, Ma trận. Giữ nguyên bộ sửa và cách áp dụng hiện có (`KnowledgeScopeEditor`, `ExamPlanEditor`).
3. **Trang và in** (mục 14.5).

Thông tin đề **tự áp dụng từng ô**, dùng cơ chế `HeaderSubmission` kiểm xung đột từng trường đang có. Bỏ nút Áp dụng, dòng "Đang xem thử thông tin chưa áp dụng" và mục "Dòng in, vị trí và căn chỉnh nâng cao".

### 8.2 Chi tiết · Câu

`QuestionEditor` đổi thành bộ sửa chi tiết của câu:

- **Đầu bảng:** "Câu 3 · Tự luận · 1,0 điểm" và trạng thái ("Đã lưu" hoặc "Chưa lưu: phương án C trống").
- **Các ô theo dạng, giữ đủ những gì đang có:** Dạng, Điểm, Nội dung, phương án (đúng, ghim, hình từng phương án), mệnh đề Đúng/Sai, đáp án ngắn và các cách viết khác (mỗi dòng một cách), ý tự luận (nhãn, điểm, nội dung, đáp án, barem), ghép nối, sắp xếp, Lời giải, Mức nhận thức, Yêu cầu cần đạt và kiến thức (gắn gói), Nguồn/bản quyền, danh sách Hình của câu, Khóa câu, Cột phương án.
- **Bỏ:** nút "Áp dụng câu vào đề", "Đóng, giữ nháp", "Hủy thêm", đoạn giải thích nháp ở đầu biểu mẫu.
- Kết quả AI của câu (thẩm định, đề xuất) hiện ở bảng AI, không nằm trong biểu mẫu.

### 8.3 Chi tiết của các đối tượng khác

Theo cột "Bảng Chi tiết" ở mục 7. Mọi ô đều tự áp dụng như mục 9.1.

### 8.4 Mẫu

- **Mẫu đề:** dùng mẫu, lưu đề thành mẫu (`EditorTemplate` đang có).
- **Bố cục in nhanh:** 5 mẫu, thêm "Như cũ", Hoàn tác lần áp mẫu (lấy từ `EditorPrint`; phần sửa từng vùng bỏ đi vì đã sửa trên tờ đề).
- **Lưu bố cục in hiện tại làm mẫu của tôi** (mục 14.6).

### 8.5 Ngân hàng, Nhập đề

Như giai đoạn A: là thẻ ở bảng trái và ghi rõ chỗ chèn.

### 8.6 Dàn ý

- Mỗi mục một dòng. Phần: tên, số câu, điểm. Ngữ liệu: tiêu đề. Câu: "Câu 5 · TN · 0,25 đ · 40 ký tự đầu".
- Kéo dòng để đổi thứ tự (`moveOutlineNode`). Có ô chọn nhiều.
- Bấm một dòng: chọn đối tượng đó trên tờ đề và cuộn tới.
- Không có ô sửa trong Dàn ý.
- Nên có lọc nhanh: Tất cả · Thiếu đáp án · Chưa có điểm · Có góp ý.

---

## 9. Sửa, lưu và hoàn tác `[TS2-9]`

### 9.1 Tự áp dụng

- Mỗi lần gõ cập nhật **bản đang sửa** của đối tượng. Tờ đề vẽ lại theo bản đang sửa ngay (≤ 100ms).
- Bản đang sửa được ghi vào nháp trên máy (nhật ký nháp câu đang có) mỗi lần đổi.
- Khi bản đang sửa **hợp lệ** (`normalizeQuestion` không báo lỗi), nó được áp vào đề sau 600ms ngừng gõ hoặc khi chọn sang đối tượng khác. Bộ lưu (`useExamPersistence`) lưu lên máy chủ như hiện nay, có kiểm phiên bản.
- Khi **chưa hợp lệ:**
  - Không áp vào đề, không lưu lên máy chủ.
  - Ô lỗi viền đỏ, kèm dòng "Chưa lưu: …".
  - Tờ đề vẫn hiện bản đang sửa, có dấu "chưa lưu" ở lề.
  - Rời đối tượng vẫn giữ nháp; Rà soát liệt kê "Câu 3 chưa lưu vì …".
- Nháp trên máy tự bỏ khi máy chủ xác nhận đã lưu (`retireSavedQuestionDrafts` đang có).
- **Áp dụng cho:** câu, phần, ngữ liệu, khối in, Thông tin đề, Trang và in.
- **Không áp dụng cho:** đề xuất của AI (vẫn Áp dụng/Bỏ), khôi phục lịch sử, gói kiến thức và ma trận (giữ cách hiện có).

### 9.2 Bản trên máy chủ đổi trong lúc mình đang sửa

Gộp theo ô như mục 13.4. Nếu đúng ô mình đang gõ vừa bị người khác đổi, ngay dưới ô hiện "Cô Lan vừa đổi thành …" kèm hai nút [Giữ của tôi] [Lấy của Cô Lan].

### 9.3 Hoàn tác / Làm lại

- Mỗi thao tác của người này trong tab này là một bước: sửa ô (các lần gõ cùng ô trong 1 giây gộp làm một), thêm, xóa, nhân bản, di chuyển, thao tác trang, đổi bố cục in, áp mẫu.
- Mỗi bước lưu "trước" và "sau" của **đúng các đối tượng bị đổi** (câu, ngữ liệu, nút dàn ý, trường thông tin, bố cục in). Không chụp cả đề, vì đề có thể chứa ảnh lớn.
- Hoàn tác chỉ đặt lại những đối tượng **còn đúng như "sau"**. Đối tượng đã bị người khác sửa tiếp thì bỏ qua và báo "1 thay đổi không hoàn tác được vì Cô Lan đã sửa sau đó".
- Giữ tối đa 100 bước; mất khi tải lại trang. Mỗi lần hoàn tác được lưu như một lần sửa bình thường.
- Đang gõ trong ô chữ: Ctrl+Z là hoàn tác chữ của trình duyệt. Ngoài ô chữ: hoàn tác của trang soạn. Nút ↶ ↷ ở thanh trên luôn là hoàn tác của trang soạn.
- Bỏ Hoàn tác/Làm lại riêng từng câu (trong `QuestionCard`).

---

## 10. Trang `[TS2-10]`

### 10.1 Khổ, lề, chữ

- Khổ A4, 210 × 297mm.
- **Lề:** Hẹp 12,7mm. Vừa: đúng như Word hiện nay (trên/dưới 17,6mm, trái/phải 21,2mm). Rộng 25,4mm.
- **Cỡ chữ** mặc định như Word hiện nay (nội dung 11pt). Chọn 12/13/14 thì bản xem và Word cùng đổi.
- Bản xem dùng đúng phông, cỡ, lề như Word để số trang gần với Word nhất.

### 10.2 Khối chảy, theo thứ tự in

Đầu trang (trang đầu hoặc mọi trang) · Dòng thí sinh · Lời dặn · [Tiêu đề phần · Lời dẫn] · [Ngữ liệu] · Câu · … · Cuối đề.

Chân trang in ở mọi trang, nằm ngoài vùng chảy.

### 10.3 Quy tắc xếp trang

1. Khối vừa chỗ còn lại thì đặt ở trang hiện tại; không vừa thì **cả khối** sang đầu trang sau.
2. Tiêu đề phần đi cùng khối đầu tiên của phần. Ngữ liệu đi cùng câu đầu của nhóm. Không để tiêu đề hay ngữ liệu đứng một mình ở cuối trang.
3. Nhóm bật "Giữ cùng trang" thì cả nhóm sang trang mới nếu không vừa (bỏ qua quy tắc này khi cả nhóm dài hơn một trang).
4. Khối dài hơn một trang (ngữ liệu, câu tự luận dài) được cắt giữa các đoạn văn, dòng phương án hoặc hình; không cắt giữa một dòng chữ.
5. "Bắt đầu ở trang mới" (phần, ngữ liệu, câu) luôn mở trang mới.
6. Mỗi câu "thuộc" trang mà nó bắt đầu.

### 10.4 Hiển thị

- Mỗi trang là một tờ riêng, các tờ cách nhau 24px.
- Phía trên mỗi tờ: nhãn "Trang n" và các nút nhỏ Khóa trang · Nhân bản trang · Xóa trang, giống Canva. Đây cùng một danh sách lệnh với dải trang và hàng công cụ.
- Thu phóng: **Vừa chiều ngang** (mặc định), **Vừa trang** (thấy trọn một trang như một slide), 25–200%.
- Cuộn dọc giữa các trang. Trang nằm giữa màn hình là trang hiện tại: hiện ở bộ đếm "3/5" và tô trên dải trang.

### 10.5 Tính lại trang

- Tính lại khi nội dung đổi (sau 150ms), khi phông chữ tải xong và khi ảnh tải xong.
- Đo chiều cao từng khối trong một vùng đo ẩn có cùng bề rộng, rồi xếp trang bằng một hàm thuần (dễ viết test).
- Mục tiêu: đề 50 câu tính lại ≤ 300ms.
- Khi số trang đổi, giữ nguyên vị trí của đối tượng đang chọn trên màn hình (không nhảy cuộn).

### 10.6 In / PDF

In theo đúng các tờ, mỗi tờ một trang giấy. Không in khung chọn, dấu ＋, nhãn trang, bong bóng hay dấu !.

### 10.7 Word

- Thêm thuộc tính "giữ với đoạn sau" (`keepNext`) và "giữ các dòng" (`keepLines`) cho các đoạn của cùng một câu, cho tiêu đề phần, và cho ngữ liệu với câu đầu của nhóm. Nhờ vậy Word cũng đẩy cả câu sang trang sau. Đây là thay đổi có chủ ý cho **mọi** đề, kể cả đề cũ (chỉ đổi cách ngắt trang, không đổi chữ).
- Ngắt trang thủ công thành `pageBreakBefore` (đã có cho phần và nhóm; thêm cho câu).
- Số trang trong Word là số thật. Bản xem có thể lệch vài dòng so với Word vì hai bên vẽ chữ khác nhau; ghi rõ điều này trong dòng trợ giúp ở dải trang.

---

## 11. Dải trang và thao tác trang `[TS2-11]`

### 11.1 Dải trang

- Nằm ở thanh dưới. Nút **[▤ Trang]** bật/tắt dải; mặc định bật trên máy tính khi đề có hơn 1 trang; nhớ lựa chọn.
- Dải cuộn ngang. Mỗi trang là một **hình nhỏ thật** (cùng bộ vẽ, thu nhỏ), số trang ở góc.
- Rê chuột lên hình nhỏ: hiện "Câu 9–15".
- Trang hiện tại có viền; trang đang chọn viền màu nhấn; trang có câu bị khóa có biểu tượng khóa.
- Cuối dải có **[+]** "Thêm trang": đặt ngắt trang ở cuối đề và đặt điểm chèn ở trang mới.

### 11.2 Chọn trang

Bấm hình nhỏ: cuộn tới trang đó và chọn "Trang n". Shift/Ctrl chọn nhiều trang như mục 6.5.

### 11.3 Thao tác trang

Có ở ba nơi nhưng cùng một danh sách lệnh: menu ⋯ trên hình nhỏ, nút trên nhãn trang, hàng công cụ khi chọn trang. Các lệnh: Nhân bản trang · Sao chép trang · Khóa/Mở khóa trang · Ngắt trang sau trang này / Bỏ ngắt trang · Xóa trang.

Vì nội dung đề chảy qua các trang, lệnh trang được hiểu như sau:

- **Nội dung của trang** = các câu, ngữ liệu, tiêu đề phần **bắt đầu** ở trang đó.
- **Nhân bản trang:** chép các câu của trang, cùng ngữ liệu đi kèm (ngữ liệu được chép thành bản riêng). Bản chép chèn ngay sau câu cuối của trang, trong cùng phần với câu cuối đó; tiêu đề phần không chép. Sau đó tính lại trang.
- **Xóa trang:** hỏi "Xóa 7 câu: Câu 9–15?" rồi xóa các câu của trang. Ngữ liệu không còn câu nào thì bỏ nhóm; phần không còn câu nào vẫn giữ tiêu đề. Có Hoàn tác.
- **Khóa trang:** khóa các câu của trang (`Question.locked`). Mọi người có quyền sửa đều mở khóa được. Câu bị khóa không sửa, không di chuyển, không xóa được cho tới khi mở khóa.
- **Kéo hình nhỏ để đổi thứ tự trang:** chuyển khối câu của trang tới trước khối đầu tiên của trang đích. Câu thuộc phần ở chỗ thả; số câu tự đánh lại. Báo "Đã chuyển Câu 9–15 lên trước Câu 1" kèm Hoàn tác. Bàn phím: chọn trang rồi Alt+← / Alt+→.
- **Chọn nhiều trang** rồi xóa, khóa hoặc nhân bản: áp cho tất cả trang đã chọn.

### 11.4 Lưới

Nút **[▦ Lưới]** thay vùng trang bằng lưới các trang (4–6 cột), có cùng thao tác và kéo đổi thứ tự. Chọn một trang rồi Esc (hoặc bấm lại nút Lưới) để trở về vùng trang tại trang đó.

### 11.5 Hiệu năng

Chỉ vẽ những hình nhỏ đang thấy. Trang ngoài tầm nhìn hiện khung trống kèm "Câu 9–15".

### 11.6 Sao chép / Dán

- **Sao chép:** Ctrl+C hoặc Khác ▾ → Sao chép, cho câu, nhiều câu, ngữ liệu, phần hoặc trang.
- **Dán:** Ctrl+V dán sau đối tượng đang chọn (hoặc tại điểm chèn), cấp mã mới.
- Dán sang đề khác trong cùng trình duyệt được (lưu tạm trong bộ nhớ trình duyệt theo tài khoản).
- Ngữ liệu có cùng mã đã có trong đề đích thì dùng lại; chưa có thì thêm bản sao.
- Dữ liệu quá lớn (ảnh) thì báo "dùng Nhân bản trong cùng đề".
- Đồng thời ghi chữ thường vào bộ nhớ hệ thống để dán sang Word hoặc Zalo.

---

## 12. Bảng phải `[TS2-12]`

### 12.1 Chung

- Chỉ hiện khi mở, với ba thẻ: **AI · Góp ý & cộng tác · Rà soát**.
- Đóng từng thẻ; kéo đổi rộng, thu gọn (đã có).
- Bỏ thẻ "Chi tiết câu" (đã chuyển sang bảng trái) và `EditorDetailSlot`.

### 12.2 AI (một chỗ)

- **Mở bằng:** nút AI ở hàng công cụ; "Sinh bằng AI" trong Thêm ▾ (mở thẳng mục Sinh câu, kèm điểm chèn).
- Thiếu khóa AI thì chính bảng hiện hướng dẫn khóa, thay cho hộp thoại "Cần khóa AI".
- **Đầu bảng:** "Đang nói về: Câu 3" theo vùng chọn (nhiều câu: "3 câu"; hoặc Toàn đề). Bấm × để về Toàn đề.
- **Việc nhanh theo vùng chọn:**
  - Toàn đề, Phần: Sinh câu mới (biểu mẫu của `GenerateModal`: số câu, dạng, mức, phạm vi); Viết đáp án và lời giải còn thiếu.
  - Câu: Viết lại lời giải, Đổi số liệu, Tạo câu tương đương, Thẩm định đáp án, Sửa theo yêu cầu.
  - Chữ đang bôi đen trong bảng Chi tiết: Sửa đoạn này theo yêu cầu.
- **Một khung trò chuyện duy nhất,** gộp Trợ lý sửa đề (`RightCompanionRail`) và Hỏi AI (`TeacherAiSecretaryDrawer`). Hỏi chung thì AI trả lời. Yêu cầu sửa đề thì AI trả về thẻ đề xuất có xem trước/sau và nút Áp dụng / Bỏ (dùng nhật ký đề xuất AI đang có).
- **Bỏ khỏi trang soạn:** ngăn kéo Hỏi AI (các trang khác vẫn giữ), thẻ "AI tạo câu" ở thanh trái, lệnh AI trong Khác ▾ của câu, các biểu mẫu AI trong thẻ câu.
- Khóa AI và ghi chú riêng cho AI vẫn ở menu tài khoản.

### 12.3 Góp ý & cộng tác

Các mục:

- **Góp ý:** lọc theo câu đang chọn / tất cả / chưa giải quyết; gửi góp ý cho đối tượng đang chọn.
- **Hoạt động** (mục 13.3).
- **Cần chọn bản**, chỉ hiện khi có (mục 13.4).
- **Lịch sử phiên bản** và khôi phục (đã có).
- **Người cùng soạn:** mời, đổi quyền (đã có). Nút Mời mở thẳng mục này.

### 12.4 Rà soát

- Danh sách các mục cần xem (đã có). Bấm một mục: chọn đối tượng đó trên tờ đề.
- **Chỉ chặn trước Giao bài**, kèm nút "Đã xem, tiếp tục giao bài".
- Xuất Word, In và Trình chiếu không bị chặn. Đầu menu Xuất ghi "Đề còn 3 mục cần xem".

---

## 13. Cùng soạn không cần thời gian thực `[TS2-13]`

Đã có sẵn: trang soạn hỏi lại máy chủ mỗi 8 giây, mỗi lần lưu có bản ghi lịch sử (`ExamRevision`, kèm người lưu), có góp ý và phân quyền. Chỗ kém hiện nay: khi người khác lưu lúc mình có thay đổi chưa lưu, hệ thống báo xung đột **cả đề**, dù hai người sửa hai câu khác nhau.

### 13.1 Người đang mở

- Thêm bảng `ExamPresence` (mục 17.2). Mỗi tab gửi tín hiệu 8 giây một lần, thay cho việc tải cả đề mỗi 8 giây như hiện nay. Chỉ tải lại đề khi máy chủ báo có phiên bản mới.
- Quá 30 giây không có tín hiệu thì coi là đã rời. Đóng trang thì gửi tín hiệu rời (`sendBeacon`).
- Hiện ở thanh trên (mục 4, ý 5).

### 13.2 Khóa mềm

- Người A **đang sửa** đối tượng X nghĩa là A đã chọn X và có gõ trong 2 phút gần nhất.
- Với người B: X có viền màu của A kèm tên A. B chọn X thì bảng Chi tiết chỉ đọc, với dòng "Cô Lan đang sửa câu này (từ 10:32)" và hai nút [Góp ý] [Vẫn sửa]. Bấm "Vẫn sửa" thì sửa được, và khi lưu gộp theo 13.4.
- Khóa mềm tự hết khi A chọn chỗ khác, rời trang, hoặc 30 giây không có tín hiệu.
- Khóa mềm khác **Khóa câu** (mục 11.3): Khóa câu là lưu trong đề; khóa mềm chỉ là báo hiệu.

### 13.3 Báo đã sửa gì, có giới hạn

- Khi có phiên bản mới do người khác lưu: so bản đang có với bản mới, ra danh sách "đối tượng (mục)". Ví dụ: Câu 5 (đáp án), thêm Câu 12, xóa Câu 7, đổi thứ tự câu, Thông tin đề (thời gian), Bố cục in.
- **Hiện gọn:**
  - Một dòng nhỏ dưới thanh trên, tự tắt sau 6 giây: "Cô Lan vừa sửa Câu 5 (đáp án) và thêm Câu 12 · Xem".
  - Các lần lưu của cùng một người trong 1 phút gộp thành một dòng. Nhiều người cùng lúc: "2 người vừa sửa 4 chỗ · Xem".
  - Đối tượng vừa đổi có chấm màu nhỏ ở lề trong 1 phút.
- **Không báo:** việc của chính mình; thay đổi chỉ do sắp xếp lại khi lưu (ví dụ thời điểm cập nhật).
- **Mục Hoạt động:** giữ danh sách trong phiên, tối đa 50 dòng. Bấm một dòng: chọn đối tượng và mở "Xem trước/sau" (chỉ phần đã đổi).
- **Mở lại đề:** nếu phiên bản hiện tại mới hơn phiên bản mình đã xem lần trước (`seenVersion`), hiện "Từ lần trước bạn mở: Cô Lan, Thầy Minh sửa 6 chỗ · Xem". Bản so lấy từ lịch sử phiên bản sẵn có. Bấm "Đã xem" hoặc mở mục Hoạt động thì cập nhật `seenVersion`.
- Không gửi email hay thông báo ra ngoài.
- Nên có, làm sau cùng: Kho đề có chấm nhỏ trên đề được chia sẻ có thay đổi chưa xem.

### 13.4 Gộp khi lưu, thay cho xung đột cả đề

- Ba bản: **gốc** (bản máy chủ lúc mình bắt đầu sửa), **của tôi**, **của người kia** (bản mới).
- Gộp theo đối tượng (câu, ngữ liệu, nút dàn ý, trường thông tin, từng vùng bố cục in) và theo ô (nội dung, từng phương án, đáp án, lời giải, điểm, mức, hình…).
- Quy tắc:
  - Chỉ một bên đổi: lấy bản của bên đổi.
  - Hai bên đổi khác ô: lấy cả hai.
  - Hai bên đổi cùng ô, khác giá trị: thành **cần chọn**.
  - Người kia xóa câu mình đang sửa: cần chọn "Giữ câu (khôi phục)" hoặc "Đồng ý xóa".
  - Hai bên cùng đổi thứ tự hoặc cấu trúc dàn ý: lấy thứ tự của người kia, rồi giữ các câu mình mới thêm (đặt sau câu đứng trước nó trong bản của tôi). Không đặt được thì cần chọn "Thứ tự câu".
- Không có chỗ cần chọn: tự lưu bản gộp với phiên bản mới, báo "Đã gộp với thay đổi của Cô Lan".
- Có chỗ cần chọn:
  - Tạm dừng lưu; bản của tôi vẫn nằm trong nháp trên máy.
  - Trạng thái lưu đỏ: "2 chỗ cần chọn".
  - Mục Cần chọn bản liệt kê từng chỗ, hai cột Bản của tôi / Bản của Cô Lan, với ba nút [Giữ của tôi] [Lấy của Cô Lan] [Giữ cả hai]. Với câu, "Giữ cả hai" là nhân bản câu; với chữ, là nối hai bản để tự sửa.
  - Chọn xong hết thì lưu.
- Máy chủ vẫn kiểm phiên bản như hiện nay; việc gộp làm ở trình duyệt.

### 13.5 Không làm

Gõ chung thời gian thực, con trỏ của người khác trong chữ (giai đoạn F cũ).

---

## 14. Bố cục in và trang (phần B còn lại) `[TS2-14]`

### 14.1 Đầu trang

Không làm 3 cột. Đầu trang gồm: cột trái, cột phải, **dòng tiêu đề toàn ngang** (mới, tùy chọn), và tùy chọn in ở trang đầu hoặc mọi trang.

### 14.2 Một chỗ sửa dòng in

Bấm khối in trên tờ đề, sửa bằng hàng công cụ và bảng Chi tiết của khối in. Bỏ mục "Dòng in, vị trí và căn chỉnh nâng cao" trong Thông tin đề, và bỏ phần sửa từng vùng trong Mẫu → Bố cục in.

### 14.3 Dữ liệu

Gộp tất cả vào `printLayout`. Lược đồ này **chưa lên main**, nên còn đổi được:

```ts
printLayout: {
  formatVersion: 2,
  page?: {
    fontFamily: 'Times New Roman' | 'Arial' | 'Cambria';
    fontSize: 11 | 12 | 13 | 14;
    margins: 'narrow' | 'normal' | 'wide';
    choiceColumns: 'auto' | 1 | 2 | 4;
    showQuestionPoints: 'auto' | 'always' | 'never';
    headerScope: 'firstPage' | 'everyPage';
  };
  header?: { left: Block[]; right: Block[]; title: Block[] }; // có thì thay headerLayout v1 khi in
  studentLine: { kind: 'line' | 'scoreBox' | 'none'; fields: { key: StudentField; label?: string }[] };
  intro: Block[]; end: Block[]; footerLeft: Block[]; footerCenter: Block[]; footerRight: Block[];
}
```

- `metadata.choiceColumns` (đang có trên nhánh) chuyển vào `printLayout.page.choiceColumns`. Từng câu ghi đè được bằng `Question.choiceColumns`.
- `Block` thêm `binding?`: chỉ dùng khi chuyển từ v1, để dòng in ra giống hệt (ví dụ "Thời gian làm bài: 45 phút · Tổng 3,00 điểm"). Giáo viên sửa chữ của dòng đó thì bỏ `binding`, dòng thành chữ có trường.
- Nhãn dòng thí sinh đổi được, để giữ đúng "Họ và tên thí sinh".

### 14.4 Chuyển dữ liệu

- Đề chưa có `printLayout` in như hiện nay.
- Lần đầu giáo viên sửa một khối in, đổi Trang và in, hoặc áp mẫu: tạo `printLayout` "Như cũ" trước. Bản này sinh ra đúng chữ và thứ tự như bố cục cố định hiện nay, gồm cả các dòng `headerLayout` v1. Sau đó mới áp thay đổi.
- Từ đó chỉ ghi `printLayout`. `headerLayout` v1 chỉ còn để đọc đề cũ và mẫu cũ.

### 14.5 Trang và in (trong Chi tiết của Toàn đề)

Phông (Times New Roman, Arial, Cambria) · Cỡ (11 như cũ, 12, 13, 14) · Lề (Hẹp, Vừa, Rộng) · Cột phương án (Như cũ, Tự chọn, 1, 2, 4) · Hiện điểm từng câu (Như cũ, Luôn, Không) · Đầu trang (Trang đầu, Mọi trang).

Áp dụng cho bản xem, In và Word.

### 14.6 Lưu vào mẫu của tôi

- Ảnh chụp cấu hình của `ExamTemplate` thêm `printLayout` (hiện đã chứa `headerLayout`). Lược đồ mẫu vẫn nhận mẫu cũ không có `printLayout`.
- Nút "Lưu bố cục in này làm mẫu của tôi" ở thẻ Mẫu, cùng chỗ với lưu mẫu đề.

### 14.7 Kiểm

- Đề cũ: file Word trước và sau bản 2 giống nhau về chữ và thứ tự đoạn. Chỉ khác thuộc tính giữ câu liền trang (mục 10.7).
- Đề vừa chuyển "Như cũ" mà chưa đổi gì: chữ trong file Word giống hệt.
- Số trang trong Word là trường thật. Mã đề trộn hiện đúng ở chân trang của từng mã.

---

## 15. Xuất, Giao bài, Trình chiếu `[TS2-15]`

### 15.1 Xuất ▾

- Các mục: Word – đề · Word – đáp án/barem · Word – lời giải · Word – ma trận · Word – đề song song · In / PDF · Trình chiếu · Trộn mã đề… (chỉ khi có quyền sửa).
- Đầu menu ghi số mục cần rà soát nếu có. Không chặn.

### 15.2 Giao bài ▾

- Nút chính mở Giao bài; rà soát chặn trước như hiện nay.
- Mũi tên: Kết quả bài đã giao (n), Link đã chia sẻ.
- Người không có quyền phát hành: mở thẻ Góp ý & cộng tác với dòng "Chỉ chủ đề được giao bài" (như hiện nay).

### 15.3 Trình chiếu

Dùng để **chữa bài trên lớp**: chiếu từng câu lên máy chiếu, chữ to, hiện đáp án khi cần. Không phải để xem từng trang; xem từng trang là việc của mục 10–11.

Rà code ngày 31/10 thấy các chỗ cần sửa:

1. Nút luôn chạy rà soát trước. Đề có mục cần xem thì nó mở thẻ Rà soát thay vì trình chiếu, nên người dùng thấy "bấm không ra". → Bỏ bước chặn này.
2. Tiêu đề "Câu n/tổng" và ô chọn câu dùng số thứ tự, không dùng số in trên đề. Phần đánh số câu lại từ 1 thì bị lệch. → Dùng số của dàn ý.
3. Ngữ liệu bị thu gọn, phải bấm mới mở. → Mở sẵn, có nút "Ẩn ngữ liệu". Màn hình ≥ 1024px: ngữ liệu bên trái, câu bên phải.
4. Luôn bắt đầu từ câu 1. → Bắt đầu từ câu đang chọn nếu có.
5. Không có nút toàn màn hình. → Thêm nút "Toàn màn hình" (Fullscreen API của trình duyệt; Esc để thoát).
6. Phím chỉ có ←/→ và Esc. → Thêm Space hiện/ẩn đáp án, Home/End về câu đầu/cuối.
7. Hình của phương án không vẽ nền sáng như các hình khác. → Vẽ nền sáng.
8. Có cả ở thanh dưới và Xuất ▾. → Chỉ để ở Xuất ▾.

Kiểm:

- Mở và đóng (bằng nút, bằng Esc); các phím.
- Hiện đáp án đúng cho từng dạng: trắc nghiệm tô phương án đúng, Đúng/Sai, trả lời ngắn, tự luận và barem, ghép nối, sắp xếp.
- Ngữ liệu, hình, chữ to/nhỏ, số câu khi phần đánh số lại.
- Điện thoại 375 và 320. Trang soạn để giao diện tối thì trình chiếu vẫn nền sáng.
- Trình chiếu không làm đổi đề (luồng F18 đang có).

---

## 16. Điện thoại (< 640px) `[TS2-16]`

- **Thanh trên:** ☰ · tên đề (cắt ngắn) · chấm trạng thái lưu · [Giao bài] · ⋯ (Xuất, Mời, Rà soát, Hoàn tác, Làm lại). Trên điện thoại, ⋯ là chỗ duy nhất của các mục này vì không đủ chỗ; trên máy tính không có ⋯.
- **Vùng trang** toàn bề rộng, thu phóng "Vừa chiều ngang". Chạm để chọn; chạm lại đối tượng đang chọn để mở Chi tiết dạng ngăn kéo từ đáy (nửa màn hình, kéo lên thành đầy).
- **Hàng công cụ ở đáy**, cuộn ngang: [Thêm] [AI] · đường dẫn rút gọn (‹ Câu 3) · lệnh.
- Bảng trái (Mẫu, Ngân hàng, Nhập đề, Dàn ý) và bảng phải mở toàn màn hình, có nút Đóng.
- **Dải trang** ẩn; thay bằng "Trang 2/5 ‹ ›" ở thanh dưới. Lưới mở toàn màn hình.
- Tối đa 2 thanh cố định (thanh trên và hàng công cụ đáy). Không cuộn ngang trang ở 375 và 320.

---

## 17. Dữ liệu `[TS2-17]`

### 17.1 Trong tài liệu đề (JSON, không đổi DB)

| Thay đổi | Nơi | Ghi chú |
|---|---|---|
| `Question.locked?: boolean` | câu | Bản cho học sinh không có (`publicQuestion` chỉ lấy trường cho phép, đã đúng) |
| `Question.choiceColumns?: 'auto' \| 1 \| 2 \| 4` | câu | Ghi đè cột của đề |
| `startOnNewPage` cho cả nút câu | `outline` | `validateOutline` cho phép ở mọi loại nút |
| `keepTogether?: boolean` | `outline` (nút nhóm) | |
| `printLayout.page`, `printLayout.header`, nhãn dòng thí sinh, `binding` | `metadata` | Lược đồ v2 chưa lên main nên đổi được; vẫn đọc được bản không có `page`/`header` |
| `metadata.choiceColumns` | bỏ, chuyển vào `printLayout.page` | Chỉ có trên nhánh |
| `printLayout` trong ảnh chụp mẫu | JSON của mẫu | |

Mọi trường mới đều qua `normalizeExamDocument` (kiểm kiểu, giới hạn độ dài).

### 17.2 Bảng mới trong DB (thay đổi lược đồ DB duy nhất)

```prisma
model ExamPresence {
  id          String   @id @default(cuid())
  examId      String
  exam        Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  focus       String?  // mã chọn đang chọn, ví dụ "question:abc"
  editing     Boolean  @default(false)
  seenVersion Int?
  lastSeenAt  DateTime @default(now())

  @@unique([examId, userId])
  @@index([examId, lastSeenAt])
}
```

- Thêm quan hệ `presences` ở `Exam` và `User`.
- Migration mới trong `prisma/migrations/`. Chạy trên DB thử trước. Hỏi chủ dự án trước khi chạy trên DB thật, và sao lưu trước.

### 17.3 API

- **`POST /api/exams/[id]/presence`.**
  - Gửi: `{ focus?: string | null, editing?: boolean, seenVersion?: number, leave?: boolean }`. `focus` tối đa 200 ký tự, đúng dạng mã chọn.
  - Quyền: ai xem được đề thì gửi được.
  - Trả: `{ version, people: [{ userId, name, color, focus, editing, since }], seenVersion }`. `people` gồm người khác có tín hiệu trong 30 giây.
  - Mỗi lần gọi xóa các dòng của đề đó đã quá 1 ngày.
  - Gửi header `x-examcraft-user` như các API cộng tác hiện có.
- **Không thêm API so sánh bản:** dùng `GET /api/exams/[id]` (bản mới) và `GET /api/exams/[id]/history?version=` (bản đã xem) đang có.
- Thêm `lastSavedBy` (tên người lưu gần nhất) vào phản hồi `GET /api/exams/[id]`, để dòng báo ghi được tên.

---

## 18. Thành phần: giữ / đổi / bỏ `[TS2-18]`

| Thành phần | Bản 2 |
|---|---|
| `ExamWorkspace.tsx` | Viết lại bố cục: vùng trang ở giữa; bảng trái 5 thẻ; bảng phải 3 thẻ; bỏ Chế độ, `MoreMenu`, nút Soạn/Xem |
| `A4Preview.tsx` | Tách thành **vùng trang soạn** (chia trang, lớp chọn, dấu ＋) và các bản xem (Đáp án, Lời giải, Ma trận, Song song) dùng chung bộ vẽ khối. `A4Preview` vẫn dùng cho trang chia sẻ (`/share/[id]`) |
| `OutlineEditor.tsx` | Bỏ phần vẽ thẻ câu và menu ＋ riêng. Giữ các thao tác dàn ý để dùng cho vùng trang và Dàn ý gọn |
| `QuestionCard.tsx` | Không dùng trong trang soạn nữa. Lệnh AI chuyển sang bảng AI; nhân bản, di chuyển, xóa, khóa, lưu vào ngân hàng chuyển sang hàng công cụ; hoàn tác riêng thay bằng hoàn tác chung; kết quả thẩm định chuyển sang bảng AI |
| `QuestionEditor.tsx` | Thành bộ sửa Chi tiết câu, tự áp dụng; giữ nhật ký nháp |
| `EditorSelection.tsx` | Giữ sổ đăng ký lệnh; mở rộng mã chọn theo mục 6.1 và chọn nhiều; đối tượng trên vùng trang đăng ký lệnh thay cho thẻ câu |
| `EditorToolbar.tsx` | Thêm ▾ theo vùng chọn, AI, đường dẫn, lệnh, Khác ▾ |
| `EditorMenus.tsx` | Giữ `AppMenu`, `ExportMenu` (thêm dòng rà soát), `AccountMenu`; bỏ `MoreMenu` |
| `EditorSettings` / `HeaderForm` | Thành Chi tiết của Toàn đề, tự áp dụng; bỏ mục dòng in nâng cao |
| `EditorPrint.tsx` | Mẫu nhanh chuyển vào thẻ Mẫu; phần sửa từng vùng chuyển thành Chi tiết khối in |
| `EditorRequirements` (`EditorTemplate`) | Thẻ Mẫu |
| `QuestionBankModal`, `ImportModal` | Giữ là thẻ ở bảng trái |
| `GenerateModal` | Biểu mẫu Sinh câu trong bảng AI (Kho đề vẫn dùng như cũ) |
| `RightCompanionRail` và `TeacherAiSecretaryDrawer` | Gộp thành bảng AI của trang soạn; ngăn kéo vẫn dùng ở các trang khác |
| `EditorReview` | Thẻ Rà soát; chỉ chặn trước Giao bài |
| `ExamCollaboratorsPanel` | Thẻ Góp ý & cộng tác, thêm mục Hoạt động và Cần chọn bản |
| `EditorDetailSlot` | Bỏ |
| `ExamPresentation` | Sửa theo mục 15.3 |
| `useExamPersistence` | Tín hiệu có mặt thay cho tải cả đề mỗi 8 giây; gộp ba bản (mục 13.4) |
| Thư viện mới (hàm thuần, có test) | `canvas-objects` (mã chọn, cấp cha, thứ tự, điểm chèn), `pagination` (xếp trang), `exam-diff` (đã đổi gì), `exam-merge` (gộp ba bản), `undo-history`, `exam-clipboard` |

---

## 19. Kiểm thử `[TS2-19]`

**Test đơn vị** (thêm vào SAFE):

- `canvas-objects`: mã chọn, cấp cha, thứ tự, điểm chèn.
- `pagination`: 6 quy tắc ở mục 10.3.
- `exam-diff`: nhãn thay đổi đúng.
- `exam-merge`: khác câu; khác ô; cùng ô; xóa – sửa; cùng đổi thứ tự; cùng thêm câu.
- `undo-history`: bỏ qua đối tượng đã bị người khác đổi.
- `exam-clipboard`: cấp mã mới, dùng lại hoặc chép ngữ liệu.
- Chuyển `printLayout` "Như cũ": chữ trong file Word giống hệt.
- Word có `keepNext`/`keepLines`.
- Số câu trong trình chiếu.
- API có mặt (trên DB thử): quyền, cửa sổ 30 giây, xóa dòng cũ.

**Trình duyệt** (bộ editor, pilot):

- Chọn từng loại đối tượng thì hàng công cụ và Chi tiết đúng.
- Thêm ▾ ở từng cấp chèn đúng chỗ.
- Tự lưu rồi tải lại vẫn còn. Bản chưa hợp lệ không lưu, có nhắc.
- Hoàn tác / làm lại.
- Dàn ý kéo đổi thứ tự.
- Dải trang: số hình nhỏ bằng số trang; bấm thì cuộn tới; nhân bản, xóa, khóa, kéo trang; lưới.
- Chia trang: câu dài sang trang sau; tiêu đề phần không đứng một mình; ngắt trang thủ công.
- Trình chiếu theo mục 15.3.
- Điện thoại 375 và 320: chạm chọn, ngăn kéo, ≤ 2 thanh, không tràn ngang.
- Sáng/tối. Ảnh chụp 1440 / 1024 / 375 / 320.

**Hai tài khoản** (luồng mới F26, F27, trên DB thử):

- Thấy nhau đang mở.
- Khóa mềm và nút "Vẫn sửa".
- Báo "vừa sửa Câu n (mục)".
- Sửa khác câu thì tự gộp; sửa cùng ô thì hiện Cần chọn bản.
- Mở lại đề thấy "Từ lần trước bạn mở".

**Cập nhật bộ kiểm hiện có:**

- Thêm hàm trợ giúp mới trong `tests_pilot/editor-ui.ts` (chọn trên tờ đề, bảng Chi tiết, thêm tại điểm chèn, hình nhỏ trang…).
- Các bộ editor, frame, teacher, library, admin, typography, pilot F1–F25 (trừ F8) và SAFE đều đạt.
- Ratchet màu không tăng; kiểu và lint 0 lỗi.

**Ràng buộc:** không gọi AI thật; chỉ dùng DB thử `examcraft_test_20261022`. Báo cáo và ảnh đặt ở `qa/rebuild-<ngày>/editor-v2-<giai đoạn>/`.

---

## 20. Giai đoạn và tiêu chí chấp nhận `[TS2-20]`

Mỗi giai đoạn: commit riêng trên nhánh `claude/editor-v2` (tách từ `claude/editor-canva-a`), có ảnh chụp; chủ dự án xem và thử trước khi sang giai đoạn sau. Hỏi trước khi gộp vào main.

| Giai đoạn | Việc | Chấp nhận |
|---|---|---|
| V2-1. Chọn và sửa trên tờ đề | Mô hình chọn (6); hàng công cụ và đường dẫn (5, 7); bảng trái gồm Chi tiết và Dàn ý (8); Thêm theo vùng chọn; tự áp dụng và hoàn tác (9); gộp chỗ trùng (bảng mục 1); thanh trên (4); bảng phải: AI một chỗ, Rà soát chỉ chặn Giao bài (12); điện thoại không vỡ | Đối chiếu bảng mục 1 đạt; nội dung đề chỉ hiện một lần; không còn bấm đúp; mọi bộ kiểm đã cập nhật và đạt |
| V2-2. Trang | Chia trang thật (10); dải trang, thao tác trang, lưới, sao chép/dán (11); Word giữ câu liền trang; In theo trang | Đề mẫu 3 trang hiện đúng 3 trang; thêm câu làm sang trang 4 trong ≤ 300ms; không cắt đôi câu (trừ khối dài hơn trang); thao tác trang có Hoàn tác |
| V2-3. Trình chiếu | Mục 15.3 | Các kiểm ở 15.3 đạt |
| V2-4. Bố cục in và trang | Mục 14 | File Word của đề cũ giống chữ; đổi phông/cỡ/lề có hiệu lực ở bản xem, In và Word; mẫu lưu kèm bố cục in |
| V2-5. Cùng soạn | Mục 13 và bảng `ExamPresence` | Hai tài khoản trên DB thử đạt F26–F27; migration chạy được trên DB thử; hỏi chủ dự án trước khi chạy DB thật (có sao lưu) |
| V2-6. Điện thoại hoàn thiện | Mục 16 | ≤ 2 thanh cố định; chạm chọn và ngăn kéo; 375 và 320 không tràn |

---

## 21. Ràng buộc, rủi ro, để sau `[TS2-21]`

**Ràng buộc:** giữ như bản 1, mục 23.

- Không đưa khóa, bí mật, `.env`, bản sao lưu vào Git hay vào chat.
- Test có ghi chỉ dùng DB thử đã kiểm đúng đích. Không gọi AI thật.
- Không đổi Prisma ngoài `ExamPresence`.
- Hỏi trước khi push hoặc gộp vào main.
- Không dùng cổng 3117/3122 và không dừng server của người khác.
- Không đè việc đang làm dở trong thư mục chung.

**Rủi ro:**

- Số trang của bản xem lệch Word vài dòng.
- Đề có nhiều ảnh lớn làm hình nhỏ chậm; phải vẽ lười.
- Bộ kiểm cũ dựa vào cây thẻ câu nên phải viết lại nhiều.
- Tự áp dụng thay cho nút Áp dụng làm đổi luồng nháp đã kiểm kỹ trước đây; phải giữ nhật ký nháp và kiểm lại việc khôi phục nháp.

**Để sau:**

- Gõ trực tiếp trên giấy (cần thư viện soạn thảo).
- Gõ chung thời gian thực.
- Kéo thả đối tượng ngay trên tờ đề.
- Đầu trang 3 cột.
- Nhãn câu "Bài/Question" theo phần.
- Chấm báo thay đổi ở Kho đề, nếu chưa kịp làm trong V2-5.
