# Giai đoạn C, D, E (phần làm được không cần quyết định thêm)

Nhánh `claude/editor-canva-a`. DB thử `examcraft_test_20261022`, không AI thật, không đổi Prisma, không thêm thư viện.

## C. Định dạng chữ và sửa câu từ tờ đề

| Việc | Kết quả |
|---|---|
| D1 (đậm/nghiêng/gạch chân/mũ/chỉ số dưới) | Làm theo đề xuất: chỉ nhận đúng 5 thẻ `<b> <i> <u> <sup> <sub>` không thuộc tính, **chỉ khi có đủ cặp mở–đóng lồng đúng**. Thẻ lẻ, `x < 5`, thẻ lạ in nguyên như đã gõ, nên đề cũ không đổi |
| Nơi hiểu thẻ | Bản xem (`MathRenderer`), Word (đậm, nghiêng, gạch chân, chỉ số trên/dưới thật), trang học sinh (dùng cùng `MathRenderer`) |
| Thanh công cụ | Khi bôi đen trong ô nội dung/phương án/ý/lời giải: hàng công cụ có **Chèn công thức · In đậm · In nghiêng** và trong "Khác": Gạch chân, Chỉ số trên, Chỉ số dưới. Bấm lần nữa trên đoạn đã bọc thì bỏ thẻ |
| Bấm câu trên tờ đề | Một bấm: chọn câu ở cây. Bấm đúp: mở **Chi tiết câu** ở bảng phải |

## D. Trang

| Việc | Kết quả |
|---|---|
| Ngắt trang | Phần/nhóm có tuỳ chọn "Bắt đầu ở trang mới" (Tùy chọn phần). Lưu ở `outline[].startOnNewPage`, kiểm bởi `validateOutline`, không lộ cho học sinh. Word: `pageBreakBefore`. Bản xem: đẩy khối xuống đầu trang kế |
| Đường ngắt trang | Nét đứt "Hết trang n" mỗi 297mm trên tờ đề; dải nút "Đến trang n" và tổng số trang ở thanh dưới |
| Số trang chân trang | Dùng số trang đo theo chiều cao tờ |

## E. Rà soát và góp ý ở lề

| Việc | Kết quả |
|---|---|
| Dấu rà soát | Dấu `!` ở lề trái câu có mục cần xem; bấm mở thẻ Rà soát |
| Bong bóng góp ý | Số góp ý chưa giải quyết của từng câu ở lề phải (đọc từ API góp ý có sẵn); bấm mở thẻ Góp ý |

## Chưa làm, để bàn

- **Gõ trực tiếp ngay trên giấy** (con trỏ trong chữ của tờ đề): cần thư viện soạn thảo (D2). Hiện sửa ở Chi tiết câu, mở bằng bấm đúp. Tôi không thêm thư viện khi chưa bàn.
- **Chia trang thật** (đo từng câu để không cắt đôi câu/nhóm, giữ nhóm, cột phương án `auto`): số trang và đường ngắt vẫn là ước lượng theo chiều cao; câu có thể nằm vắt qua đường ngắt.
- **E cần DB (D3):** ai đang mở đề, khóa mềm theo câu, lịch sử phiên bản theo lề. Cần bảng/cột mới nên chưa làm.
- **F:** sửa đồng thời thời gian thực, để sau như đã thống nhất.
- Còn dở từ B: đầu trang 3 cột và `headerScope`, tuỳ chọn trang (phông, lề, cột phương án), lưu bố cục vào "mẫu của tôi".

## Kiểm

- SAFE 557/557 (thêm `rich_text.test.ts` 3 ca, `print_layout.test.ts` 7 ca). Kiểu, lint 0 lỗi, ratchet màu 2508.
- Trình duyệt: editor 12/12 (thêm ca: đề dài có đường ngắt + nút trang, bấm đúp mở Chi tiết, In đậm → thẻ `<b>` → in đậm trên tờ, không hiện thẻ), frame 4/4, teacher 7/7, library 6/6, admin 11/11, typography 4/4, pilot 24/24.
- Chưa: mở Word thật; điện thoại thật.
