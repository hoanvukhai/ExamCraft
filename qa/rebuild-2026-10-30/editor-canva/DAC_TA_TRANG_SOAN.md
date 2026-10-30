# Đặc tả trang soạn đề kiểu "công cụ thiết kế" (30/10/2026)

Claude viết theo trao đổi với chủ dự án ngày 30/10. **Thay toàn bộ** các hướng bàn soạn trước (biểu mẫu bên trái + xem bên phải, thanh vùng chọn cao 112px, mọi ô mở sẵn có khóa). **Giữ nguyên** mô hình dữ liệu dàn ý (Phần → Nhóm/ngữ liệu → Câu → Ý), cơ chế lưu/phiên bản/nháp/quyền và các chức năng đã có; chỉ đổi cách người dùng thao tác.

Tài liệu này dùng cho Codex/Gemini làm theo từng giai đoạn ở mục 21. Mã yêu cầu dạng `[TS-x]` để dẫn chiếu trong báo cáo.

> **31/10/2026:** bản 2 (`qa/rebuild-2026-10-31/editor-v2/DAC_TA_TRANG_SOAN_V2.md`) thay các mục 3, 4, 5, 6, 9, 10, 11, 12, 14, 16, 20, 21 của tài liệu này. Các mục 7, 8, 18, 19, 23 vẫn dùng.

---

## 0. Tóm tắt các quyết định

1. **Thao tác giống Canva, dữ liệu giống Word.** Người dùng nhìn và sửa trên chính tờ đề; thanh công cụ đổi theo thứ đang chọn; tài nguyên (ngân hàng, mẫu, AI, nhập file, hình) nằm ở bảng bên trái; trang, thu phóng, trình chiếu ở thanh dưới. Nhưng nội dung vẫn là tài liệu có cấu trúc, chữ tự xuống dòng, **không kéo đặt vị trí tự do** (để trộn mã đề, xuất Word và làm bài online không vỡ).
2. **Tờ đề có 3 vùng:** đầu trang (tự do trong khuôn), thân đề (có cấu trúc), cuối/chân trang (tự do trong khuôn). Đầu và chân trang gồm các **khối chữ** tự gõ, chèn được **trường tự điền** (`{Môn}`, `{Mã đề}`, `{Trang}`…), ẩn/hiện, căn lề, có **bố cục mẫu**.
3. **Thông tin đề (dữ liệu) tách khỏi cách in.** Dấu `*` là trường bắt buộc vì hệ thống dùng (AI, chấm, ngân hàng, gói kiến thức). Ẩn/hiện là của **khối in trên giấy**, không phải của dữ liệu: ẩn dòng "Môn" trên giấy thì AI vẫn biết môn.
4. **Đánh số trang** bằng trường `{Trang}`/`{Tổng số trang}` ở chân trang; Word dùng trường số trang thật.
5. **Một việc chỉ một chỗ.** Thêm nội dung chỉ từ bảng trái hoặc dấu `+` trên trang; sắp xếp chỉ ở Dàn ý; thông tin đề chỉ ở bảng Thông tin đề hoặc bấm vào chính dòng in; AI tạo câu ở bảng trái, AI hỏi/sửa ở bảng phải.
6. **Thanh công cụ chỉ một hàng**, đổi nội dung theo vùng chọn, không thêm hàng, không làm biến mất nút cố định (các nút cố định nằm ở thanh trên và bảng trái).

---

## 1. Nguyên tắc thiết kế `[TS-1]`

| Mã | Nguyên tắc | Kiểm được bằng |
|---|---|---|
| TS-1.1 | Thấy gì sửa nấy: bấm vào chữ trên tờ đề là sửa chữ đó (giai đoạn C); trước đó bấm vào câu là mở đúng câu đó để sửa ở bảng phải | Bấm vào câu 3 trên giấy → công cụ và trình sửa là của câu 3 |
| TS-1.2 | Khung cố định: thanh trên, bảng trái, thanh dưới không đổi vị trí/nút khi đổi vùng chọn | So ảnh chụp khi chọn câu và khi không chọn: chỉ hàng công cụ đổi |
| TS-1.3 | Mỗi việc một chỗ (mục 0.5) | Danh sách lệnh ở mục 20 không có hai cửa cho cùng một việc |
| TS-1.4 | Không kéo đặt vị trí tự do; chỉ kéo đổi **thứ tự** trong dàn ý | Không có thuộc tính toạ độ x/y trong dữ liệu |
| TS-1.5 | Chữ trên màn hình là lời thường cho giáo viên (mục 18) | Tìm chuỗi cấm ở mục 18 trả về 0 |
| TS-1.6 | Không thêm bảng/cột DB; mọi thay đổi dữ liệu nằm trong tài liệu đề JSON đã có (mục 19) | `prisma/schema.prisma` không đổi |
| TS-1.7 | Giữ toàn bộ lớp bảo vệ: phiên bản CAS, nháp theo tài khoản, quyền, nhật ký đề xuất AI, không tự áp dụng AI | Bộ SAFE và kiểm bảo vệ hiện có vẫn đạt |
| TS-1.8 | Điện thoại và bàn phím/cảm ứng dùng được mọi thao tác chính; không dựa vào rê chuột | Kiểm 375/320px và chỉ dùng bàn phím |

---

## 2. Thuật ngữ

| Từ | Nghĩa |
|---|---|
| Tờ đề | Bản đề hiển thị như giấy A4, gồm các trang |
| Đầu trang | Vùng trên cùng của trang: tên sở/trường, tên đề, môn, thời gian, mã đề… |
| Dòng thí sinh | Họ và tên, Lớp, Số báo danh…; hoặc khung Điểm/Lời nhận xét |
| Lời dặn đầu đề | Ví dụ "Thí sinh làm bài vào giấy thi" |
| Thân đề | Phần → Nhóm (có/không ngữ liệu) → Câu → Ý |
| Cuối đề | Dòng "HẾT", lời dặn cuối ("Cán bộ coi thi không giải thích gì thêm") |
| Chân trang | Dưới cùng mỗi trang: "Trang 1/3 – Mã đề 101" |
| Khối chữ | Một dòng/đoạn trong đầu trang, cuối đề hoặc chân trang |
| Trường tự điền | Chỗ trong khối chữ tự lấy giá trị từ Thông tin đề hoặc từ trang: `{Môn}`, `{Trang}` |
| Vùng chọn | Thứ đang được chọn: cả đề, một khối chữ, phần, nhóm, câu, phương án, ý, hình, đoạn chữ đang bôi đen |
| Bản đầu ra | Đề, Đáp án & barem, Lời giải, Ma trận, Đề song song, các Mã đề |
| Bảng trái | Bảng tài nguyên: Thông tin đề, Mẫu, Ngân hàng, Nhập, AI tạo câu, Hình, Dàn ý |
| Bảng phải | Bảng phụ: Chi tiết câu, AI (Hỏi/Sửa), Góp ý, Rà soát |
| Điểm chèn | Vị trí nội dung mới sẽ vào (mục 12.1) |

---

## 3. Bố cục tổng

### 3.1 Máy tính (≥ 1024px) `[TS-3]`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ① Thanh trên (48px): ☰ · Tên đề ✎ · ● Đã lưu · ↶ ↷ · [người đang mở] + Mời ·  │
│                       Chế độ ▾ · Xuất ▾ · [Giao bài]                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ ② Hàng công cụ theo vùng chọn (44px, một hàng): "Câu 2 ›" + công cụ của câu  │
├────┬───────────────┬┬──────────────────────────────────────┬┬──────────┬────┤
│ ③  │ Bảng trái     ││  Vùng trang (nền xám)                 ││ Bảng phải│ ⑤  │
│rail│ 280–440px     ││   ┌──────── Trang 1 (A4) ────────┐    ││ 320–440px│rail│
│56px│ kéo co giãn,  ││   │ Đầu trang                    │    ││ thu gọn  │44px│
│    │ thu gọn       ││   │ Thân đề (Phần/Nhóm/Câu/Ý)    │    ││ được     │    │
│    │               ││   │ Chân trang: Trang 1/3        │    ││          │    │
│    │               ││   └──────────────────────────────┘    ││          │    │
├────┴───────────────┴┴──────────────────────────────────────┴┴──────────┴────┤
│ ④ Thanh dưới (44px): Đề|Đáp án|Lời giải|Ma trận|Song song · 1 2 3 + ·        │
│                      Góp ý (2) · 65% ━━●━━ · Trang 2/3 · Lưới · Trình chiếu  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Trong trang soạn, **ẩn menu ứng dụng bên trái và thanh phải của khung chung**. Về Kho đề qua ☰; tài khoản, khóa AI, ghi chú cho AI, sáng/tối nằm trong menu ảnh đại diện ở thanh trên. `[TS-3.1]`
- Bảng trái và bảng phải: kéo vạch ngăn để đổi độ rộng (min/max như sơ đồ), nút thu gọn, nhớ độ rộng và trạng thái thu gọn theo từng tài khoản trong localStorage (lỗi đọc thì dùng mặc định). Bấm lại biểu tượng đang mở trên rail thì thu gọn. `[TS-3.2]`
- Mỗi bên chỉ mở **một** bảng một lúc. Không có hộp thoại nổi cho các việc đã có bảng (Ngân hàng, Nhập, AI, Mẫu, Thông tin đề). Hộp thoại chỉ còn cho: Giao bài, Mời cùng soạn, Trộn mã đề, xác nhận xóa. `[TS-3.3]`
- 1024–1279px: bảng trái mặc định thu gọn khi mở bảng phải (không để vùng trang < 560px). `[TS-3.4]`

### 3.2 Máy tính bảng (640–1023px)
- Bảng trái/phải mở dạng **ngăn trượt phủ lên vùng trang** (không đẩy trang), đóng bằng nút X, Esc hoặc bấm ra ngoài.
- Hàng công cụ vẫn một hàng; mục thừa vào "⋯ Khác".

### 3.3 Điện thoại (< 640px) — xem mục 16.

---

## 4. Thanh trên ① `[TS-4]`

| Thành phần | Hành vi |
|---|---|
| ☰ | Menu: Về Kho đề, Tạo đề mới, Thùng rác, Trợ giúp |
| Tên đề | Bấm để sửa tại chỗ; Enter lưu, Esc hủy. Giữ tên truy cập "Tên đề thi" và tiêu đề nút "Nhấn để đổi tên đề thi" (test đang dùng) |
| Trạng thái lưu | Chấm + chữ ngắn: "Đã lưu", "Đang lưu…", "Chưa lưu", "Mất kết nối", "Cần xử lý". Bấm mở popup chi tiết (mục 13). Bên cạnh hiện "n nháp" nếu có câu soạn dở |
| ↶ ↷ | Hoàn tác/làm lại các thao tác trên đề trong phiên (mục 12.5). Ctrl+Z / Ctrl+Y |
| Người đang mở | Ảnh đại diện người đang mở đề (giai đoạn E); trước đó hiện người được mời cùng soạn |
| + Mời | Hộp thoại mời cùng soạn: email + quyền (Sửa / Góp ý / Xem) dùng `ExamCollaborator` sẵn có; Lịch sử phiên bản |
| Chế độ ▾ | Sửa / Góp ý / Xem (mục 14.1). Người không có quyền sửa chỉ thấy các chế độ được phép |
| Xuất ▾ | Word – đề; Word – đáp án & barem; Word – lời giải; Word – ma trận; Word – đề song song; In / PDF; Trộn mã đề…; |
| Giao bài | Nút chính duy nhất (màu đậm). Mở hộp thoại Giao bài hiện có (lớp, link làm bài, tùy chọn giờ/lượt) và Kết quả nếu đã giao |
| Ảnh đại diện | Tài khoản, Khóa AI, Ghi chú riêng cho AI, Giao diện sáng/tối, Đăng xuất |

Rà soát tự chạy trước Giao bài và Xuất như hiện tại (`reviewBefore`), mở trong bảng phải tab Rà soát thay vì hộp thoại.

---

## 5. Hàng công cụ theo vùng chọn ② `[TS-5]`

### 5.1 Quy tắc
- **Một hàng cao 44px, không xuống dòng, không bao giờ thêm hàng thứ hai.** Mục không đủ chỗ dồn vào "⋯ Khác" từ phải sang trái (ưu tiên giữ mục đầu bảng).
- Đầu hàng luôn có **tên vùng chọn** dạng đường dẫn bấm được: `Toàn đề › Phần I › Câu 2 › Phương án B`. Bấm "Toàn đề" bỏ chọn; Esc lùi một cấp.
- Mỗi mục có nhãn chữ (không chỉ biểu tượng) ở ≥ 1024px; < 1024px được còn biểu tượng nhưng phải có `aria-label` và tooltip.
- Hàng công cụ đọc lệnh mới nhất của đối tượng (không giữ bản cũ của dữ liệu) — giữ cơ chế registry của `EditorSelection` nhưng **bỏ khối cao 112px** và bỏ dòng hướng dẫn "Chọn câu…".
- Đối tượng bị xóa thì vùng chọn tự lùi về cấp cha.
- Chế độ Xem: hàng công cụ ẩn. Chế độ Góp ý: chỉ còn "Góp ý" và "Sao chép".

### 5.2 Nội dung theo vùng chọn

| Vùng chọn | Công cụ (theo thứ tự ưu tiên) |
|---|---|
| **Toàn đề** (không chọn gì) | Thông tin đề · Bố cục in ▾ (mẫu đầu/chân trang) · Cỡ chữ in (12/13/14) · Phông in · Lề trang · Phương án mặc định (Tự động / 1 / 2 / 4 cột) · Hiện điểm từng câu (Tự động/Luôn/Không) · Đánh số câu (liên tục / lại từ 1 mỗi phần) |
| **Khối chữ** ở đầu trang/cuối đề/chân trang | Đậm · Nghiêng · Gạch chân · Cỡ (nhỏ/thường/lớn) · Chữ hoa · Căn trái/giữa/phải · Chèn trường ▾ · Dòng kẻ ngắn dưới · Ẩn khối · Xóa khối · Thêm khối · Áp dụng: Trang đầu / Mọi trang (chỉ đầu trang) |
| **Dòng thí sinh** | Chọn mục hiện: Họ và tên, Lớp, Số báo danh, Phòng thi, Số phách, Chữ ký giám thị · Kiểu: Một dòng / Khung Điểm và Lời nhận xét · Ẩn |
| **Phần** | Tên phần (sửa tại chỗ) · Lời dẫn · Đánh số phần (I/II, A/B, 1/2, không) · Gọi câu là (Câu / Bài / Question / tự gõ) · Đánh số câu (tiếp nối / lại từ 1) · Bắt đầu trang mới · Thêm vào phần ▾ · Lên/Xuống · Xóa phần (hỏi: giữ câu ra ngoài / xóa cả câu) |
| **Nhóm / ngữ liệu** | Sửa ngữ liệu · Lời dẫn nhóm (có trường `{Từ câu}`–`{Đến câu}`) · Nguồn · Ảnh/bảng ngữ liệu · Giữ cả nhóm trên một trang · Thêm câu vào nhóm ▾ · Bỏ nhóm (giữ câu) · Lên/Xuống |
| **Câu** | Dạng câu ▾ · Điểm · Đáp án (theo dạng: chọn A–D, Đúng/Sai từng ý, đáp số…) · Mức nhận thức ▾ · Bố cục phương án ▾ · Thêm ý · Hình ▾ · AI ▾ · Lời giải · Chi tiết · Góp ý · ⋯ (Nhân bản, Chuyển sang phần ▾, Lưu vào ngân hàng, Xóa) |
| **Phương án** | Đặt là đáp án đúng · Ảnh trong phương án · Ghim vị trí (không trộn) · AI viết lại phương án · Thêm phương án · Xóa phương án |
| **Mệnh đề Đúng/Sai** | Đặt Đúng · Đặt Sai · Lời giải ý · Thêm/Xóa mệnh đề |
| **Ý (a, b, c…)** | Điểm ý · Đáp án ý · Barem ý · Lên/Xuống · Xóa ý |
| **Hình / ảnh** | Thay ảnh · Cỡ (nhỏ/vừa/lớn/toàn dòng) · Căn · Chú thích · Sửa đồ thị/bảng biến thiên (khi là hình vẽ) · Xóa |
| **Đoạn chữ đang bôi đen** (giai đoạn C) | Đậm · Nghiêng · Gạch chân · Chỉ số trên · Chỉ số dưới · Công thức ∑ · Ký hiệu ▾ · Xóa định dạng · AI viết lại đoạn chọn |
| **Nhiều câu** (đã tick) | Chuyển sang phần ▾ · Gộp thành một câu có các ý · Đặt điểm hàng loạt · Đặt mức nhận thức · Xóa |

"Gộp thành một câu có các ý" dùng `Question.parts` (mỗi câu cũ thành một ý giữ nội dung, điểm, đáp án, lời giải), **thay** hàm `handleMergeSelected` hiện ghép chuỗi `**Bài toán tổng hợp:**`.

---

## 6. Tờ đề (vùng trang) `[TS-6]`

### 6.1 Hiển thị
- Nền vùng trang xám nhạt; mỗi trang là tờ A4 trắng có viền mảnh, cách nhau 24px; căn giữa; thu phóng 25–200% (mặc định "Vừa chiều ngang").
- Giai đoạn A–C: một tờ dài như `A4Preview` hiện nay, có **đường ngắt trang ước lượng** (nét đứt + "Hết trang 1"). Giai đoạn D: chia trang thật (mục 11.3).
- Tờ đề trong trang soạn và bản xem trước là **cùng một bộ dựng** (không còn hai bộ hiển thị khác nhau). Bộ dựng nhận thêm "lớp tương tác" khi ở chế độ Sửa.

### 6.2 Các vùng trên tờ đề (từ trên xuống)

| Vùng | Ví dụ | Sửa thế nào |
|---|---|---|
| Đầu trang | SỞ GD&ĐT … / TRƯỜNG … · ĐỀ KIỂM TRA GIỮA KÌ I / Môn: Toán 9 / Thời gian: 45 phút · Mã đề 101 | Khối chữ, 3 cột trái/giữa/phải (mục 7.2) |
| Khối tiêu đề | ĐỀ KIỂM TRA GIỮA KÌ I – NĂM HỌC 2026-2027 | Khối chữ, toàn chiều ngang |
| Dòng thí sinh | Họ và tên: ……… Lớp: …… SBD: …… | Mục 7.5 |
| Lời dặn đầu đề | (Đề có 3 trang, 20 câu) | Khối chữ, có trường `{Số trang}`, `{Số câu}` |
| Thân đề | PHẦN I. TRẮC NGHIỆM … | Mục 8 |
| Cuối đề | ——— HẾT ——— / Thí sinh không được sử dụng tài liệu | Khối chữ |
| Chân trang | Trang 1/3 – Mã đề 101 | Khối chữ, 3 cột, mọi trang |

### 6.3 Chọn và tương tác
- Rê chuột: viền nhạt quanh đối tượng sẽ được chọn. Bấm: chọn (viền đậm 1.5px màu nhấn) + hàng công cụ đổi. Bấm đúp vào chữ: vào sửa chữ (giai đoạn C; trước đó mở Chi tiết câu ở bảng phải).
- Tab/Shift+Tab đi qua các đối tượng theo thứ tự in; Enter = sửa; Esc = lùi cấp chọn.
- Câu đang có người khác sửa (giai đoạn E) hiện viền màu người đó + tên, không cho sửa.
- Câu có góp ý chưa giải quyết hiện bong bóng nhỏ ở lề phải tờ đề; bấm mở tab Góp ý tại góp ý đó.
- Câu có lỗi rà soát hiện dấu nhỏ ở lề trái; bấm mở tab Rà soát tại lỗi đó.

### 6.4 Dấu `+` chèn trên trang
- Hiện giữa các câu, cuối mỗi phần/nhóm, cuối thân đề. **Luôn nhìn thấy** dạng đường mảnh có `+` ở giữa (không dùng opacity-0 chờ rê chuột), cao tối thiểu 24px để chạm được; to rõ hơn khi rê chuột/focus.
- Bấm `+` mở menu chèn tại đúng chỗ: Câu tự soạn · Từ ngân hàng · Nhập Word/Ảnh · Sinh bằng AI · Ngữ liệu (nhóm mới) · Phần mới (chỉ ở cấp gốc) · Ngắt trang.
- Chọn một nguồn tài nguyên thì bảng trái mở đúng tab với **điểm chèn đã đặt sẵn** (mục 12.1).
- Không in dấu `+` và các viền chọn ra Word/PDF/trình chiếu.

---

## 7. Thông tin đề và bố cục in (đầu trang, dòng thí sinh, cuối đề, chân trang) `[TS-7]`

### 7.1 Thông tin đề (dữ liệu) — bảng trái, tab "Thông tin đề"

| Nhóm | Trường | Bắt buộc | Hệ thống dùng để | Trường tự điền tương ứng |
|---|---|---|---|---|
| Cơ bản | Tên đề | `*` | Định danh trong Kho đề, tên file Word | `{Tên đề}` |
| | Môn | `*` | AI, ngân hàng, gói kiến thức, chấm | `{Môn}` |
| | Lớp | `*` | Như trên | `{Lớp}` |
| | Cách đánh giá (Chấm điểm / Nhận xét / Theo tiêu chí / Khảo sát) | `*` | Chấm, rà soát điểm, ma trận | — |
| | Thời gian làm bài (phút) | nên có (rà soát nhắc nếu trống) | In, giao bài tính giờ | `{Thời gian}` |
| | Loại bài kiểm tra (Thường xuyên, Giữa kì, Cuối kì, Khảo sát, Thi thử, Học sinh giỏi, Khác) | không | Gợi ý mẫu, gợi ý cho AI | `{Loại bài}` |
| Thông tin in | Đơn vị chủ quản (Sở/Phòng) | không | Chỉ để in | `{Đơn vị}` |
| | Trường / tổ chuyên môn | không | Chỉ để in | `{Trường}` |
| | Năm học | không | Chỉ để in | `{Năm học}` |
| | Học kì | không | Chỉ để in | `{Học kì}` |
| | Mã đề | không (trộn mã đề tự điền 101, 102…) | In, trộn đề | `{Mã đề}` |
| Yêu cầu ra đề (tùy chọn, thu gọn mặc định, có tóm tắt khi đã dùng) | Khung mức nhận thức | không | Gắn mức cho câu, ma trận, AI | — |
| | Gói kiến thức và phạm vi | không | AI sinh đúng bài/chương | — |
| | Ma trận đề | không | Đối chiếu số câu/điểm | — |
| Nâng cao (chỉ hiện khi môn cần) | Phân môn KHTN/LS-ĐL, chương trình cốt lõi/chuyên đề, ngôn ngữ (NN1/NN2/tiếng dân tộc) | không | AI, gói kiến thức | — |

- Thứ tự hiển thị đúng như bảng: Cơ bản trước, Thông tin in sau. **Không đặt "Đơn vị chủ quản" lên đầu** như bản hiện tại. `[TS-7.1]`
- Dấu `*` chỉ đặt ở 4 trường bắt buộc. Thiếu trường bắt buộc: không cho Giao bài/Sinh bằng AI, hiện lý do ngay cạnh nút; các việc khác vẫn làm được. `[TS-7.2]`
- Sửa ở đây **xem trước ngay trên tờ đề**; nút "Áp dụng" lưu như cơ chế `HeaderSubmission` hiện có (chỉ gửi trường đã sửa, kiểm xung đột từng trường). Giữ nháp biểu mẫu khi đóng/mở bảng trong phiên. `[TS-7.3]`
- Bấm vào một trường tự điền trên giấy (ví dụ chữ "Toán 9" trong đầu trang) → mở tab Thông tin đề và focus đúng ô đó. `[TS-7.4]`
- Phạm vi và ma trận giữ nguyên logic/kiểm hiện có (`KnowledgeScopeEditor`, `ExamPlanEditor`), chỉ đổi vỏ. Ma trận trên điện thoại hiện dạng thẻ (`MatrixCards`), không bảng 7 cột. `[TS-7.5]`

### 7.2 Bố cục in — khối chữ và trường tự điền

**Câu trả lời cho câu hỏi "có nên tự do không":** đầu trang và chân trang **tự do trong khuôn**. Có quy ước phổ biến (tiêu đề hai cột Sở/Trường – Đề kiểm tra/Môn/Thời gian, dòng Họ tên/SBD, "HẾT", "Trang x/y – Mã đề") nhưng mỗi trường, mỗi sở một khác. Vì vậy: cho **bố cục mẫu** để chọn nhanh, rồi sửa tự do **trong các vùng cố định** (không kéo đặt tọa độ), để Word và trộn mã đề vẫn đúng.

Mô hình dữ liệu `headerLayout` phiên bản 2 (JSON trong `metadata`, không đổi DB):

```ts
type PrintLayoutV2 = {
  formatVersion: 2;
  page: { fontFamily: 'Times New Roman' | 'Arial' | 'Cambria'; fontSize: 12 | 13 | 14;
          margins: 'narrow' | 'normal' | 'wide'; choiceColumns: 'auto' | 1 | 2 | 4;
          showQuestionPoints: 'auto' | 'always' | 'never'; questionNumbering: 'continuous' | 'perPart' };
  zones: {
    headerLeft: Block[]; headerCenter: Block[]; headerRight: Block[];   // đầu trang 3 cột
    title: Block[];                                                    // khối tiêu đề toàn ngang
    studentLine: StudentLine;                                          // dòng thí sinh
    intro: Block[];                                                    // lời dặn đầu đề
    end: Block[];                                                      // cuối đề (HẾT…)
    footerLeft: Block[]; footerCenter: Block[]; footerRight: Block[];  // chân trang
  };
  headerScope: 'firstPage' | 'everyPage';     // mặc định firstPage như đề thi phổ biến
  footerScope: 'everyPage';
};
type Block = { id: string; text: string;       // chữ có trường: "Môn: {Môn} – Lớp {Lớp}"
  bold?: boolean; italic?: boolean; underline?: boolean; size?: 'small' | 'normal' | 'large';
  uppercase?: boolean; align?: 'left' | 'center' | 'right'; rule?: boolean; hidden?: boolean };
type StudentLine = { kind: 'line' | 'scoreBox' | 'none';
  fields: ('fullName' | 'className' | 'candidateNo' | 'room' | 'secretNo' | 'proctorSign')[] };
```

- **Trường tự điền** cho phép: `{Đơn vị}` `{Trường}` `{Tên đề}` `{Môn}` `{Lớp}` `{Thời gian}` `{Năm học}` `{Học kì}` `{Mã đề}` `{Loại bài}` `{Tổng điểm}` `{Số câu}` `{Số trang}` (đầu đề/lời dặn) và `{Trang}` `{Tổng số trang}` (chỉ chân trang). `[TS-7.6]`
- Chèn trường bằng nút "Chèn trường ▾" trên hàng công cụ (không bắt người dùng gõ ngoặc nhọn); trên giấy trường hiện dạng chip nhạt khi đang sửa, in ra là giá trị thật. Gõ tay `{Môn}` cũng được nhận. Trường không có giá trị thì để trống; **khối chỉ gồm trường trống tự ẩn khi in** (ví dụ chưa nhập tên trường thì dòng tên trường không in). `[TS-7.7]`
- Định dạng chỉ trong danh sách trên (không tùy ý màu/phông từng khối) để Word giống bản xem. `[TS-7.8]`
- Thêm khối: trong mỗi vùng, nút "+ Thêm dòng" khi đang chọn vùng đó; tối đa 12 khối/vùng, 500 ký tự/khối. `[TS-7.9]`

### 7.3 Bố cục mẫu (bảng trái, tab Mẫu → "Bố cục in") `[TS-7.10]`

| Mẫu | Đặc điểm |
|---|---|
| Đề kiểm tra trường (mặc định) | Trái: `{Đơn vị}` / `{Trường}` gạch ngắn · Phải: ĐỀ KIỂM TRA `{Loại bài}` / Môn `{Môn}` – Lớp `{Lớp}` / Thời gian `{Thời gian}` phút · Dòng Họ tên–Lớp–SBD · Cuối: HẾT · Chân: Trang `{Trang}`/`{Tổng số trang}` – Mã đề `{Mã đề}` |
| Đề thi theo mẫu Bộ (THPT) | Trái: BỘ GIÁO DỤC VÀ ĐÀO TẠO / ĐỀ THI THAM KHẢO · Phải: KỲ THI … / Bài thi: `{Môn}` / Thời gian `{Thời gian}` phút, không kể thời gian phát đề · Họ tên + SBD · Mã đề ở góc phải · Cuối: HẾT + "Thí sinh không được sử dụng tài liệu…" |
| Tiểu học có khung điểm | Đầu trang trường + lớp · Dòng thí sinh dạng khung Điểm / Lời nhận xét của giáo viên |
| Đề ngắn 15 phút | Một dòng tiêu đề + Họ tên/Lớp, không chân trang |
| Phiếu bài tập | Tên phiếu + Họ tên, không HẾT, không mã đề |

- Áp dụng mẫu chỉ thay `headerLayout` (có xem trước và Hoàn tác), không đụng thân đề và Thông tin đề.
- "Lưu bố cục này làm mẫu của tôi": lưu vào `ExamTemplate` hiện có (`exam-template.ts` đã lưu `headerLayout` theo lược đồ v1), không tạo bảng mới. Lược đồ mẫu phải nhận cả v1 và v2; mẫu v1 cũ đọc ra được chuyển sang v2 như 7.7.

### 7.4 Đánh số trang `[TS-7.11]`
- Chân trang mặc định có `Trang {Trang}/{Tổng số trang}`; xóa được.
- Word: dùng trường số trang thật (`PageNumber.CURRENT`, `PageNumber.TOTAL_PAGES` của thư viện `docx`) trong phần **footer** của section; Word tự đánh đúng dù dàn trang khác bản xem.
- Bản xem: giai đoạn A–C hiện số trang ước lượng ở các đường ngắt; giai đoạn D đúng theo chia trang thật.
- Mỗi mã đề khi trộn có chân trang riêng với `{Mã đề}` của mã đó.

### 7.5 Dòng thí sinh `[TS-7.12]`
- Kiểu **Một dòng**: các mục được chọn nối bằng chấm chấm, tự xuống dòng nếu không vừa.
- Kiểu **Khung Điểm và Lời nhận xét**: bảng 2 ô (Điểm | Lời nhận xét của giáo viên) dưới đầu trang, dùng cho tiểu học.
- Bản Đáp án/Lời giải không in dòng thí sinh.

### 7.6 Xuất Word cho bố cục in `[TS-7.13]`
- Đầu trang 3 cột: bảng 3 cột không viền ở phần thân trang đầu (không đặt trong header Word để giữ khoảng cách và cỡ chữ như đề thật); nếu `headerScope = everyPage` thì đặt vào header Word.
- Chân trang: footer Word, 3 ô căn trái/giữa/phải.
- Cuối đề, lời dặn: đoạn văn thường.
- Thay đoạn mã cứng hiện nay ("Họ và tên thí sinh: …", "Số báo danh", "HẾT") bằng đọc từ `headerLayout`.

### 7.7 Tương thích dữ liệu cũ `[TS-7.14]`
- Đọc đề có `headerLayout` v1 (dòng có `area: left|right|footer`, `binding|text`, `override`, `hidden`) → **chuyển sang v2 trong bộ nhớ**: `left` → `headerLeft`, `right` → `headerRight`, `footer` → `end`; `binding` → chữ có trường tương ứng (`subjectGrade` → `Môn: {Môn} – Lớp {Lớp}`, `durationScore` → `Thời gian: {Thời gian} phút`…); `override` → chữ cố định. Dòng thí sinh và HẾT lấy theo bản cũ đang in cứng.
- Đề không có `headerLayout` → dùng mẫu mặc định 7.3, kết quả in **giống hệt** bản đang in hiện nay (kiểm bằng so DOCX trước/sau).
- Chỉ ghi v2 khi người dùng sửa bố cục và lưu (CAS như thường). Không chuyển hàng loạt.

---

## 8. Thân đề `[TS-8]`

### 8.1 Phần
- Tiêu đề phần in đậm, chữ hoa tùy mẫu; tên trống thì không in tiêu đề (giữ quy ước của cây soạn dọc).
- Thuộc tính mới (JSON trong `outline`): `questionLabel` ("Câu" mặc định, "Bài", "Question", tự gõ ≤ 20 ký tự), `startOnNewPage`, `keepTogether` (chỉ cho nhóm). `[TS-8.1]`
- Điểm phần hiện cạnh tiêu đề khi chế độ hiện điểm cho phép: "(3,0 điểm)" = tổng điểm câu trong phần, chỉ đọc.

### 8.2 Nhóm và ngữ liệu
- Ngữ liệu in một lần ngay trên câu đầu của nhóm, có khung mảnh tùy mẫu; nguồn in nghiêng căn phải.
- Lời dẫn nhóm hỗ trợ `{Từ câu}` và `{Đến câu}` để tự đổi khi thêm/bớt câu: "Đọc văn bản sau và trả lời các câu từ {Từ câu} đến {Đến câu}".
- "Dùng lại ngữ liệu đã có" phải hiện "Đang dùng cho n nhóm"; sửa ngữ liệu dùng chung báo rõ ảnh hưởng các nhóm đó. Không âm thầm đổi liên kết.

### 8.3 Câu — hiển thị trên giấy theo dạng

| Dạng | Trên giấy (bản Đề) | Sửa (giai đoạn A: bảng phải; C: tại chỗ) |
|---|---|---|
| Trắc nghiệm 4 lựa chọn | "Câu n. nội dung" + A–D theo bố cục cột | Nội dung, từng phương án, ảnh phương án, đáp án đúng |
| Đúng/Sai 4 ý | Nội dung + a) b) c) d) | Từng mệnh đề, Đúng/Sai từng ý |
| Trả lời ngắn | Nội dung (+ ô trả lời nếu mẫu yêu cầu) | Đáp án chính + các cách viết được chấp nhận, **mỗi cách một dòng**, không tách bằng dấu phẩy |
| Tự luận | Nội dung + ý a, b, c (`parts`) | Nội dung, ý, điểm ý, barem |
| Điền khuyết | Nội dung có chỗ trống | Nội dung, đáp án từng chỗ trống |
| Ghép nối | Hai cột | Cặp ghép (bảng phải) |
| Sắp xếp | Danh sách cần sắp | Thứ tự đúng (bảng phải) |

- **Bố cục phương án** (`Question.choiceColumns`: `auto|1|2|4`): `auto` chọn 4 cột nếu mọi phương án ngắn, 2 cột nếu vừa, 1 cột nếu dài hoặc có ảnh lớn; áp dụng cả bản xem và Word. `[TS-8.2]`
- **Hiện điểm từng câu** theo `page.showQuestionPoints`: `auto` = hiện cho tự luận, ẩn cho trắc nghiệm.
- Đáp án và lời giải **không hiện trên bản Đề**; xem ở bản Đáp án/Lời giải (thanh dưới) hoặc mục "Lời giải" trong Chi tiết câu.
- Câu thiếu đáp án/điểm: dấu nhắc ở lề trái (không in), liệt kê trong Rà soát.

### 8.4 Định dạng chữ trong nội dung câu — **quyết định D1 cần chủ dự án chốt**
Hiện chuỗi nội dung chỉ hiểu công thức `$…$`, `$$…$$`, bảng biến thiên `[BBT]` và bảng markdown; **chưa có đậm/nghiêng/gạch chân** (ví dụ "**…**" đang hiện nguyên dấu sao). Tiếng Anh cần gạch chân (câu phát âm), các môn cần in đậm chữ "KHÔNG", "SAI".
- **Đề xuất:** cho phép đúng 5 thẻ không thuộc tính trong chuỗi: `<b> <i> <u> <sup> <sub>`; ký tự `<` thường được lưu dưới dạng `&lt;`. Bộ dựng xem, Word, trang học sinh, trộn đề, ngân hàng, AI (lời nhắc + kiểm đầu ra) cùng hiểu một bộ quy tắc; thẻ lạ bị bỏ khi chuẩn hóa. Đề cũ không có thẻ nên không đổi.
- Chưa chốt D1 thì giai đoạn C chỉ làm chỉ số trên/dưới và công thức qua `$…$`, không làm đậm/nghiêng/gạch chân.

### 8.5 Hình và ảnh
- Hình của câu (đồ thị, bảng biến thiên, hình học, ảnh), hình của phương án (`ChoiceItem.figures` đã có), hình của ngữ liệu. Dán ảnh (Ctrl+V) hoặc kéo ảnh từ máy vào câu/phương án đang chọn.
- Cỡ ảnh 4 mức; không xoay/cắt tự do ở giai đoạn này.
- Trộn mã đề: câu có phương án trùng chữ (kể cả phương án chỉ có ảnh, chữ rỗng) hiện **không trộn**; phải báo cho người dùng trong hộp thoại Trộn mã đề ("3 câu không trộn được thứ tự phương án vì …") và dùng mã định danh phương án thay vì so chữ để trộn được câu chỉ có ảnh. `[TS-8.3]`

### 8.6 Chi tiết câu (bảng phải, tab Chi tiết) `[TS-8.4]`
Chứa những gì **không in trên giấy** hoặc khó sửa tại chỗ: mức nhận thức, yêu cầu cần đạt, kiến thức liên kết, đáp án được chấp nhận, barem, cặp ghép, thứ tự đúng, nguồn/bản quyền, trạng thái kiểm (đã thẩm định…). Dùng **cùng một nháp** với sửa tại chỗ (journal `question-draft` hiện có), không phải bộ sửa thứ hai. Giai đoạn A: đây là nơi sửa toàn bộ câu (dùng lại `QuestionEditor`).

---

## 9. Bảng trái — tài nguyên ③ `[TS-9]`

Rail biểu tượng (có chữ nhỏ dưới biểu tượng ở ≥ 1280px):

| Tab | Nội dung | Thay cho |
|---|---|---|
| Thông tin đề | Mục 7.1 | Tab "Thông tin đề" trong cột soạn, `HeaderSettingsModal`, `EditorSettings` |
| Mẫu | Bố cục in (7.3), Mẫu đề của tôi (cấu trúc + bố cục, `ExamTemplatePanel`) | Mục "Dùng mẫu / lưu thành mẫu" trong ⋯ |
| Ngân hàng | Tìm, lọc môn/lớp/dạng/mức, xem trước câu, "Thêm vào vị trí chèn" hoặc kéo vào trang | `QuestionBankModal` |
| Nhập Word/Ảnh | Tải file/ảnh → danh sách câu đọc được (có tick) → "Thêm n câu vào vị trí chèn"; nhận "PHẦN I…" thì đề nghị tạo phần | `ImportModal` |
| AI tạo câu | Theo yêu cầu tự do hoặc theo ma trận/phạm vi; kết quả là danh sách đề xuất, duyệt từng câu, "Thêm vào vị trí chèn". **Không thay cả đề** | `GenerateModal` |
| Hình | Đồ thị hàm số, bảng biến thiên, hình học, ảnh của tôi; chèn vào câu/phương án đang chọn | Các nút hình rải trong thẻ câu |
| Dàn ý | Cây Phần → Nhóm → Câu, **nơi duy nhất kéo thả đổi thứ tự**, có Lên/Xuống bằng bàn phím, đếm số câu/điểm mỗi phần | `OutlineEditor` dạng biểu mẫu |

- Mỗi tab có ô hiển thị **"Sẽ thêm vào: sau Câu 5 · Phần I"** và nút đổi vị trí. Khi bảng trái mở, trên tờ đề có vạch xanh tại điểm chèn. `[TS-9.1]`
- Kéo một câu từ Ngân hàng vào tờ đề: vạch chèn đi theo con trỏ, thả ở giữa hai câu hoặc cuối phần. Bàn phím/chạm dùng nút "Thêm vào vị trí chèn". `[TS-9.2]`
- Tạo câu từ mọi nguồn đi qua cùng hàm chèn dàn ý (`insertOutlineNodes`) và cùng kiểm stamp/quyền như hiện nay. `[TS-9.3]`

---

## 10. Bảng phải ⑤ `[TS-10]`

| Tab | Nội dung | Thay cho |
|---|---|---|
| Chi tiết câu | Mục 8.6 (chỉ khi đang chọn câu/ý) | Nút "Sửa", `QuestionEditor` nổi |
| AI | Hai chế độ rõ: **Hỏi** (trò chuyện, không sửa đề) và **Sửa** (lệnh trên vùng đang chọn hoặc cả đề, ra đề xuất có so sánh trước/sau, Áp dụng/Bỏ, Hoàn tác). Đầu bảng ghi "Phạm vi: Câu 2" hoặc "Cả đề" | `RightCompanionRail` (Copilot), `TeacherAiSecretaryDrawer`, nút "AI câu n", "Bảo AI sửa", "AI sửa phương án", "Hỏi AI về cả câu" |
| Góp ý | Danh sách góp ý theo câu (`ExamComment` có `questionId`, `resolvedAt`), lọc chưa giải quyết, trả lời, đánh dấu đã xử lý, bấm → chọn câu trên giấy | Mục "Góp ý" trong "Cùng soạn" |
| Rà soát | Danh sách lỗi (thiếu đáp án, điểm, phần rỗng, ý thiếu…), bấm → chọn đúng đối tượng; tự mở trước Giao bài/Xuất | `EditorReview` hộp thoại, chip "⚠ n cần xem" |

- AI ▾ trên hàng công cụ chỉ là **lối tắt** mở tab AI-Sửa với lệnh điền sẵn cho vùng chọn: Đổi số liệu, Tạo câu tương đương, Viết lại (đoạn/phương án/câu), Thẩm định, Gợi ý lời giải. Tất cả ra đề xuất, không tự áp dụng (giữ `useAiProposal`, `projectScopedQuestionEdit`). `[TS-10.1]`
- **Sửa theo vùng phải dùng mã trường** (`content`, `choice:B`, `statement:a`, `solution`, `part:<id>`), **không dùng chữ hiển thị** ("Phương án B") làm khóa logic như `scoped-question-edit.ts` hiện nay. `[TS-10.2]`
- Chưa có khóa AI: bấm bất kỳ lệnh AI nào thì hiện thông báo trong bảng AI với nút "Thêm khóa AI", không chặn các việc khác.

---

## 11. Thanh dưới ④ `[TS-11]`

| Thành phần | Hành vi |
|---|---|
| Bản đầu ra | Đề · Đáp án & barem · Lời giải · Ma trận · Song song. **Chỉ bản Đề sửa được**; bản khác chỉ xem, bấm vào một câu → về bản Đề và chọn câu đó. Sau khi trộn: thêm Mã 101, 102… (chỉ xem) |
| Dải trang | Ô thu nhỏ từng trang (1, 2, 3…), bấm để cuộn tới; trang đang xem viền đậm. Nút `+ ▾`: Phần mới (cuối đề) · Ngắt trang tại điểm chèn. **Không kéo đổi thứ tự trang** (trang là kết quả dàn chữ; đổi thứ tự ở Dàn ý) |
| Góp ý (n) | Mở tab Góp ý |
| Thu phóng | Thanh trượt 25–200%, ô %, menu Vừa trang / Vừa chiều ngang / 100% |
| Trang x/y | Trang đang ở giữa màn hình / tổng trang |
| Lưới | Xem toàn bộ trang dạng lưới thu nhỏ để kiểm bố cục; bấm trang để quay lại |
| Trình chiếu | Toàn màn hình từng câu (`ExamPresentation`), có **Đếm ngược** đặt phút (mặc định = thời gian làm bài), tạm dừng/tiếp tục, phím ←/→ |

### 11.3 Chia trang thật (giai đoạn D) `[TS-11.3]`
- Đo chiều cao từng khối (đầu trang, dòng thí sinh, ngữ liệu, câu, phương án, ý) theo khổ A4, lề và cỡ chữ đang chọn; xếp vào trang; tôn trọng `startOnNewPage`, `keepTogether`, "không tách câu ngắn" (câu < 1/3 trang không bị cắt), "tiêu đề phần không nằm cuối trang".
- Word: chuyển các cờ thành `pageBreakBefore`, `keepNext`, `keepLines`. Ghi rõ trong trợ giúp: Word có thể ngắt trang lệch đôi chút so với bản xem; số trang trong Word luôn đúng.
- Dàn lại trang có độ trễ ≤ 300ms sau khi gõ dừng; không làm giật con trỏ.

---

## 12. Chèn, di chuyển, xóa, hoàn tác `[TS-12]`

### 12.1 Điểm chèn
- Đang chọn câu → sau câu đó, cùng phần/nhóm. Đang chọn phần/nhóm → cuối phần/nhóm. Không chọn gì → cuối thân đề. Bấm `+` trên giấy → đúng chỗ dấu `+` đó.
- Điểm chèn không còn tồn tại (bị xóa) → chặn thêm, báo "Vị trí cũ đã bị xóa, chọn lại vị trí", giữ nội dung đang chờ thêm.

### 12.2 Di chuyển
- Lên/Xuống (hàng công cụ, Alt+↑/↓), Chuyển sang phần ▾, kéo trong Dàn ý. Đánh số tự cập nhật.

### 12.3 Xóa
- Xóa câu/khối: không hỏi xác nhận nhưng hiện thông báo "Đã xóa Câu 5 · Hoàn tác" 8 giây. Xóa phần có câu: hỏi giữ câu hay xóa cả.

### 12.4 Nhân bản, gộp, tách
- Nhân bản ngay sau bản gốc (mã mới). Gộp nhiều câu thành câu có ý (5.2). Tách ý thành các câu riêng (ngược lại).

### 12.5 Hoàn tác `[TS-12.5]`
- Một ngăn hoàn tác cho mọi thao tác trên đề trong phiên (chèn, xóa, di chuyển, sửa thuộc tính, áp dụng đề xuất AI, áp dụng mẫu), tối thiểu 50 bước. Hoàn tác tạo **một thay đổi mới** rồi lưu bằng CAS như thường (không quay phiên bản máy chủ). Thay đổi từ người khác chen vào → bước hoàn tác bị chặn kèm lý do. Gõ chữ trong một ô dùng hoàn tác của ô đó trước.

---

## 13. Lưu, nháp, xung đột `[TS-13]`

- **Giữ nguyên** `useExamPersistence` (CAS, offline, conflict), `question-draft` (nháp theo tài khoản/đề/câu), nhật ký đề xuất AI. Chỉ đổi cách hiển thị.
- Popup trạng thái lưu (bấm chấm ở thanh trên): một câu tình trạng + nút đúng việc: "Thử lưu lại", "Tải bản nháp", "Lưu thành đề riêng", "Mở bản mới nhất, giữ bản của tôi riêng".
- "n nháp" cạnh trạng thái lưu: popup liệt kê câu soạn dở của đề này với "Mở lại · Tải về · Bỏ". Danh sách đầy đủ của cả tài khoản ở Kho đề (đã có).
- Sửa tại chỗ (giai đoạn C): mỗi lần gõ ghi nháp câu ngay; đưa vào đề khi rời ô hoặc dừng gõ 1,5 giây; tự lưu máy chủ như hiện tại. Bản xem/đếm điểm cập nhật theo đề. Có bản mới từ người khác khi đang gõ: giữ chữ đang gõ, hiện "Câu này vừa được [tên] sửa · Xem khác biệt · Giữ bản của tôi · Dùng bản mới".
- Không còn hộp "Cần xử lý" lớn ở đầu cột; không còn đoạn giải thích cơ chế nháp trên màn hình.

---

## 14. Chế độ và cộng tác `[TS-14]`

### 14.1 Chế độ (thanh trên)
| Chế độ | Ai | Thấy gì |
|---|---|---|
| Sửa | EDITOR, chủ đề | Đầy đủ |
| Góp ý | COMMENTER trở lên | Chọn được, hàng công cụ chỉ còn Góp ý/Sao chép; không sửa |
| Xem | VIEWER trở lên | Không hàng công cụ, không `+`, chỉ đọc và Xuất (nếu được phép) |

Map đúng `ExamCollaboratorRole` (VIEWER/COMMENTER/EDITOR) hiện có. Mất quyền giữa chừng: tự chuyển chế độ thấp hơn, giữ nháp tải về được (đã có bảo vệ).

### 14.2 Cộng tác nhẹ (giai đoạn E) `[TS-14.2]`
- Ai đang mở đề: ảnh đại diện ở thanh trên (cập nhật mỗi 15–30 giây qua API nhẹ; không cần socket).
- Khóa mềm theo câu: khi một người bắt đầu sửa câu, ghi "đang sửa" có hạn 60 giây, gia hạn khi còn gõ; người khác thấy viền + tên, không sửa được câu đó, vẫn sửa câu khác. Hết hạn thì tự mở.
- Góp ý gắn câu (đã có bảng), có trả lời và đánh dấu đã xử lý; bong bóng trên lề tờ đề.
- Lịch sử phiên bản (`ExamRevision`) xem trước và khôi phục thành phiên bản mới.
- Cần bảng/cột cho "đang mở" và "khóa mềm" thì **dừng và hỏi chủ dự án** (sao lưu DB chính trước), hoặc dùng bộ nhớ máy chủ có hạn nếu chạy một tiến trình.

### 14.3 Sửa đồng thời thời gian thực (giai đoạn F, để sau)
Thấy con trỏ người khác, gõ cùng lúc: cần máy chủ WebSocket + CRDT (ví dụ Yjs), chạy được trên VPS, không hợp Vercel serverless. Chỉ làm khi đã có nhu cầu thật từ tổ chuyên môn.

---

## 15. Xuất, giao bài, trộn mã đề, trình chiếu `[TS-15]`
- Xuất ▾ và Giao bài như mục 4; logic xuất Word giữ `docx-export.ts`, bổ sung bố cục in v2, số trang footer, cột phương án, cờ trang.
- Trộn mã đề: hộp thoại hiện có, thêm báo câu không trộn được (8.5), mã đề tự điền `{Mã đề}`; sau khi trộn các mã xuất hiện ở thanh dưới để xem.
- Trình chiếu: thêm đếm ngược (11).
- Kết quả bài làm: trong Giao bài và trang Bài đã giao (đã có), không cần nút riêng trên bàn soạn.

---

## 16. Điện thoại (< 640px) `[TS-16]`

- **Thanh trên một hàng:** ☰ · tên đề (cắt bớt) · chấm lưu · Giao bài (biểu tượng + chữ ngắn). Xuất, Mời, Chế độ vào ☰.
- **Vùng nội dung mặc định là dạng dòng chảy** (cùng nội dung, chữ cỡ đọc được, không chia trang A4 vì A4 vừa chiều ngang chỉ còn chữ 5–6px). Nút "Xem trang" chuyển sang tờ A4 có thu phóng để kiểm bố cục.
- **Hàng công cụ theo vùng chọn nằm ở đáy màn hình** (tầm ngón cái), một hàng cuộn ngang, cao 52px; bàn phím ảo mở thì hàng này nằm ngay trên bàn phím.
- Bảng trái/phải mở dạng **ngăn từ dưới lên** (bottom sheet) chiếm 70–90% chiều cao, kéo xuống để đóng.
- Thanh dưới máy tính được thay bằng: bản đầu ra trong ☰ › Xem bản…; thu phóng chỉ khi ở "Xem trang".
- Tối đa **2 thanh cố định** (trên + công cụ đáy). Không thêm dải cố định nào khác. Không nút nổi che nội dung.
- Mọi điểm chạm ≥ 40×40px; dấu `+` chèn luôn hiện.

---

## 17. Bàn phím, truy cập, hiệu năng `[TS-17]`

| Phím | Việc |
|---|---|
| Ctrl+Z / Ctrl+Y | Hoàn tác / làm lại |
| Ctrl+S | Lưu ngay |
| Esc | Lùi cấp vùng chọn / đóng bảng |
| Tab / Shift+Tab | Đối tượng kế / trước |
| Enter | Sửa đối tượng đang chọn |
| Alt+↑ / Alt+↓ | Di chuyển câu/phần |
| Ctrl+D | Nhân bản |
| Ctrl+Enter | Câu mới ngay sau câu đang chọn |
| Delete | Xóa đối tượng đang chọn (có Hoàn tác) |

- Hàng công cụ là `role="toolbar"` với roving tabindex; mọi nút có tên truy cập; focus nhìn thấy; tương phản đạt AA.
- Đề 120 câu có ảnh: chọn/gõ phản hồi < 100ms; dàn trang ≤ 300ms sau khi dừng gõ; cuộn mượt (ảo hóa trang ngoài màn hình nếu cần).

---

## 18. Chữ trên màn hình `[TS-18]`

- Mỗi khối tối đa **một câu hướng dẫn** lời thường; cảnh báo kỹ thuật chỉ hiện khi xảy ra, nói việc người dùng cần làm.
- Bỏ gợi ý lặp lại ở từng câu ("Gõ nội dung / công thức LaTeX…", "CHỌN PHƯƠNG ÁN RỒI ĐẶT ĐÁP ÁN TRÊN THANH CÔNG CỤ").
- Ngày giờ dạng "16:13 hôm nay", không ISO.
- **Chuỗi cấm xuất hiện trên giao diện** (kiểm tự động): "máy chủ xác nhận", "không tự chèn lại", "Không thay câu trên máy chủ", "phép chiếu", "đối chiếu", "bản nền", "stamp", "CAS", "ACK", "Cất riêng", "Chống sửa nhầm", "Mở sửa nhanh", "LaTeX" (trừ trong trợ giúp công thức).
- Thay bằng ví dụ: "Câu này đang soạn dở trên máy · Mở lại · Tải về · Bỏ"; "Đề vừa được Lan sửa · Xem khác biệt"; "Chưa lưu được · Thử lại".

---

## 19. Dữ liệu `[TS-19]`

| Thay đổi | Nơi lưu | Ghi chú |
|---|---|---|
| `headerLayout` v2 (7.2) | `metadata` JSON | Đọc v1 → v2 trong bộ nhớ; chỉ ghi v2 khi sửa |
| `metadata.examKind` (Loại bài) | `metadata` JSON | Tùy chọn |
| `OutlineNode.questionLabel`, `startOnNewPage`, `keepTogether` | tài liệu đề JSON (`outline`) | Kiểm trong `validateOutline` |
| `Question.choiceColumns` | câu trong tài liệu đề | Mặc định `auto` |
| Thẻ định dạng `<b><i><u><sup><sub>` | chuỗi nội dung | Chỉ khi chốt D1 |

- **Không đổi:** Prisma schema, API công khai (chỉ thêm trường tùy chọn), CAS, định dạng nháp cũ, snapshot bài đã giao (đề đã giao in/chấm như cũ).
- Bản sao trên `ExamQuestion`/`Question` (ngân hàng) tiếp tục ghi như hiện tại; trường mới của câu đi theo JSON câu.
- Mọi trường mới phải qua `normalizeExamDocument` (kiểm kiểu, giới hạn độ dài) và lọc khỏi bản công khai cho học sinh nếu không cần.

---

## 20. Thành phần hiện tại: giữ / đổi / bỏ `[TS-20]`

| Hiện tại | Số phận |
|---|---|
| `Header.tsx`, `EditorToolbar.tsx`, `EditorSelection` (khối 112px) | Thay bằng Thanh trên ① + Hàng công cụ ② (giữ ý registry lệnh sống) |
| Tab "Nội dung đề / Thông tin đề", công tắc "Soạn câu / Xem đề" | Bỏ (tờ đề là vùng chính; điện thoại dùng dạng dòng chảy + "Xem trang") |
| `OutlineEditor` dạng thẻ biểu mẫu, `QuestionCard` (ô sửa sẵn, nút khóa, nút ẩn bằng `hidden`) | Bỏ khỏi trang soạn; lấy phần hiển thị làm bộ dựng câu trên giấy; Dàn ý chuyển sang bảng trái; **xóa hẳn** bộ nút cũ đang ẩn |
| `A4Preview` | Thành bộ dựng tờ đề chung (soạn + xem + in) |
| `QuestionEditor` | Thành "Chi tiết câu" ở bảng phải, cùng nháp |
| `QuestionBankModal`, `ImportModal`, `GenerateModal`, `ExamTemplatePanel`, `HeaderSettingsModal`, `EditorSettings` | Thành các tab bảng trái |
| `RightCompanionRail`, `TeacherAiSecretaryDrawer` (trong trang soạn) | Thành tab AI (Hỏi/Sửa) bảng phải |
| `EditorReview` hộp thoại | Thành tab Rà soát |
| `ExamCollaboratorsPanel` | Mời (hộp thoại) + Góp ý (tab) + Lịch sử (trong Mời) |
| `EditorPending` hộp lớn | Thành "n nháp" cạnh trạng thái lưu |
| `PhonePreview`, nút nổi "Xem đề" | Bỏ |
| Khung chung `WorkspaceMenu`, `WorkspaceRail` trong trang soạn | Ẩn; chức năng vào ☰ và menu ảnh đại diện |
| `ShareModal`, `ShuffleModal`, `ExamPresentation`, `StudentResultsModal` | Giữ, nối vào vị trí mới |

---

## 21. Giai đoạn và tiêu chí chấp nhận `[TS-21]`

Mỗi giai đoạn: commit riêng trên **nhánh riêng** (không làm trên thư mục chung đang có sửa dở), ảnh 1440 / 1024 / 375 / 320 sáng–tối, chủ dự án xem ảnh và thử trước khi sang giai đoạn sau.

| Giai đoạn | Việc | Chấp nhận |
|---|---|---|
| **A. Khung** | Thanh trên, hàng công cụ một hàng, bảng trái (Thông tin đề, Mẫu, Ngân hàng, Nhập, AI tạo câu, Hình, Dàn ý), bảng phải (Chi tiết câu, AI, Góp ý, Rà soát), thanh dưới (bản đầu ra, thu phóng, trang ước lượng, lưới, trình chiếu + đếm ngược), kéo co giãn/thu gọn, ẩn khung chung. Tờ đề ở giữa là `A4Preview` có lớp chọn: bấm câu → chọn + Chi tiết câu. Điểm chèn + vạch xanh. Hoàn tác cấu trúc. Điện thoại 16 (dạng dòng chảy, công cụ đáy, bottom sheet) | Không còn hai cửa cho một việc (đối chiếu mục 20); khung không đổi khi đổi vùng chọn; chèn từ 4 nguồn đúng vị trí; ≤ 2 thanh cố định trên điện thoại; chuỗi cấm = 0; mọi suite + F1–F25 cập nhật và đạt |
| **B. Bố cục in và thông tin đề** | `headerLayout` v2 + đọc v1, khối chữ, trường tự điền, bố cục mẫu, dòng thí sinh/khung điểm, cuối đề, chân trang có số trang, sửa trực tiếp khối chữ trên giấy, Word footer số trang thật, thứ tự Thông tin đề mới, `examKind` | Đề cũ xuất Word giống hệt trước (so DOCX); số trang Word đúng 1/3, 2/3, 3/3; mã đề trộn hiện đúng ở chân trang từng mã; ẩn/hiện khối đúng; trường trống tự ẩn |
| **C. Sửa tại chỗ** | Sửa chữ/công thức trực tiếp trên giấy (thư viện soạn thảo — quyết định D2), hàng công cụ cho đoạn bôi đen, dán ảnh, cùng nháp với Chi tiết câu, (D1 nếu đã chốt) | Gõ dở rồi tải lại vẫn còn; bản mới từ người khác không đè chữ đang gõ; công thức hiển thị ngay; Word/học sinh/trộn đề đọc đúng nội dung mới |
| **D. Trang thật** | Chia trang đo thật, ngắt trang, giữ nhóm, không tách câu ngắn, dải trang và lưới chính xác, cột phương án `auto`, cờ trang sang Word | Đề 3 trang mẫu hiện đúng số trang; thêm câu làm trang 4 xuất hiện ≤ 300ms; Word có đủ cờ |
| **E. Cộng tác nhẹ** | Ai đang mở, khóa mềm theo câu, góp ý trên lề, chế độ Sửa/Góp ý/Xem, lịch sử phiên bản | Hai tài khoản thử trên DB thử: thấy nhau, không sửa trùng một câu, góp ý hiện đúng câu |
| F. Thời gian thực | Để sau | — |

**Quyết định cần chủ dự án chốt trước giai đoạn tương ứng:**
- D1 (trước C): có cho đậm/nghiêng/gạch chân trong nội dung câu theo 8.4 không.
- D2 (trước C): thư viện soạn thảo. Đề xuất TipTap/ProseMirror (MIT, xử lý vùng chọn, dán, hoàn tác, có nút công thức), cấu hình lược đồ hẹp, chuyển đổi hai chiều với chuỗi nội dung hiện có. Thêm thư viện cần chủ dự án đồng ý.
- D3 (trước E): có cần bảng/cột DB cho "đang mở"/"khóa mềm" không (cần sao lưu và duyệt).

---

## 22. Kiểm thử `[TS-22]`

- **Test theo nhiệm vụ giáo viên** (trình duyệt, DB thử), viết một lần dùng lâu dài, bám `aria-label`/`data-testid` ổn định ghi trong mục này, không bám chữ trang trí:
  1. Đề trống → đặt Thông tin đề → thêm Phần I (4 câu trắc nghiệm từ ngân hàng) + Phần II (2 câu tự luận có ý tự soạn) → Word đề và đáp án.
  2. Mở đề cũ (không có `outline`, `headerLayout` v1) → in và Word không đổi.
  3. Đề Văn: nhóm ngữ liệu 5 câu, lời dẫn có `{Từ câu}`–`{Đến câu}` → thêm câu giữa nhóm → số câu tự đổi.
  4. Đề THPT 3 phần theo mẫu Bộ → trộn 4 mã → chân trang từng mã đúng.
  5. Giao bài → học sinh làm → kết quả (đã có, chạy lại).
  6. Điện thoại: sửa một câu, đổi đáp án, thêm ảnh phương án, giao bài.
  7. Hai giáo viên cùng mở (giai đoạn E).
- Kiểm đơn vị: chuyển `headerLayout` v1→v2, giải trường tự điền, ẩn khối trống, chia trang (với số đo giả), hoàn tác, mã trường cho AI theo vùng, trộn phương án chỉ có ảnh.
- Chạy đủ SAFE, `test:editor` (viết lại theo mục này), `test:library`, `test:teacher`, `test:admin`, `test:typography`, `test:frame`, F1–F25. **Không** ghi "đạt" khi chỉ chạy một phần.

---

## 23. Ràng buộc làm việc `[TS-23]`

- Mỗi giai đoạn trên **nhánh và worktree riêng**, cổng thử riêng (không 3117/3122 đang khóa cho chủ dự án), DB thử `examcraft_test_20261022` sau kiểm `isolatedTest` và tên DB; không DB chính, không AI thật, không đổi khóa/.env.
- **Một tác nhân viết mã một lúc** trên một nhánh; tác nhân khác chỉ duyệt. Thư mục chung hiện có 56 tệp sửa chưa commit (đợt 29–30/10): phải được chủ dự án quyết định gộp/cất vào nhánh trước khi bắt đầu giai đoạn A.
- Mã mới: một thành phần một trách nhiệm, không dòng > 160 ký tự, màu dùng biến `--ui-*` (ratchet chỉ giảm), xóa mã giao diện cũ khi đã thay, không để nút ẩn bằng `hidden`.
- Báo cáo `qa/rebuild-<ngày>/editor-canva-<giai đoạn>/BAO_CAO.md` đối chiếu từng mã `[TS-x]`; không tự đóng CV; không push/gộp `main` khi chưa hỏi.
