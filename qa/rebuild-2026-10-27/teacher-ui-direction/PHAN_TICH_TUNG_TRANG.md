# Phân tích từng trang giáo viên trước khi sửa tiếp

Ngày 27/10/2026. Người viết: Claude. **Chỉ phân tích, chưa sửa mã.** Căn cứ: đọc mã các trang, đếm lớp giao diện trong mã, và ba ảnh chụp chủ dự án gửi (kho đề, trang soạn, ngân hàng câu hỏi). Nối tiếp [DINH_HUONG.md](DINH_HUONG.md).

## 1. Kết luận ngắn

1. **Chủ dự án nói đúng: vẫn chưa đồng nhất.** Đợt trước tôi chỉ thống nhất *danh sách đích đến của menu*. Tôi chưa thống nhất *khung trang*: thanh trên, vùng nội dung, tiêu đề, thẻ, ô nhập, nút. Tôi cũng làm mất cách chia nhóm của menu cũ (nhóm **Khảo thí & Lớp**) khi gộp thành năm mục phẳng. Sai lầm này của tôi, sẽ khôi phục.
2. **Cùng là "khu giáo viên" nhưng đang có bốn kiểu thanh trên, ba kiểu menu và hai "thế hệ" giao diện** chạy cạnh nhau (mục 3, 4).
3. **Trang soạn: đúng, thanh công cụ trái chiếm chỗ của menu.** Thanh trái có 12 công cụ soạn đề và không có đích đến nào của khu giáo viên; đường ra duy nhất là nút "Kho đề" ở thanh đầu (mục 6).
4. Hướng đúng là **một khung duy nhất** (thanh trên + menu dọc chia nhóm + vùng nội dung có tiêu đề và thẻ cùng kiểu), mọi trang giáo viên đặt vào khung đó. Đây không phải sửa từng màn lẻ.

## 2. Hiện trạng từng trang

Số liệu đếm từ mã (27/10): mã màu viết cứng (hex), số chỗ dùng nút chung `app-button-*`, ô nhập chung `teacher-field`.

| Trang | Thanh trên | Menu | Vùng nội dung | Tiêu đề | Hex | Nút chung | Ô chung |
|---|---|---|---|---|---:|---:|---:|
| **Kho đề** `/` | Thanh riêng cao 64 px: biểu tượng + chữ + nhãn "Kho Đề Cá Nhân", ô tìm, Bộ não AI, Thư ký AI, Khóa AI, đèn sáng/tối, tên + vai | Thanh dọc (nay còn 5 mục phẳng + bộ lọc + cây thư mục), hàng tab ở điện thoại | Rộng hết cỡ, thẻ nhỏ chữ xs | `text-2xl font-semibold` (chỉ ở Thùng rác) | 302 | 10 | 2 |
| **Ngân hàng câu hỏi** `/teacher/questions` | Thanh tối giản của `teacher/layout`: "ExamCraft · Giáo viên", tên, nút chữ "Tối" | Thanh dọc phẳng | Một thẻ trắng ở giữa (`max-w-6xl`), tiêu đề **nằm trong thẻ**; ô có nhãn phía trên | `text-2xl font-semibold` | **0** | 9 | 1 |
| **Lớp học** `/teacher/groups` | Như trên | Như trên | `max-w-6xl`, tiêu đề ngoài thẻ, **có đường dẫn "← Kho đề / Quản lý lớp học"** và biểu tượng cạnh tiêu đề | `text-2xl font-bold` | 234 | 5 | 0 |
| **Bài đã giao** `/teacher/assignments` | Như trên | Như trên | Như Lớp học, đường dẫn "← Kho đề / Danh sách bài đã giao" | `text-2xl font-bold` | 93 | 3 | 0 |
| **Chi tiết bài giao** `/teacher/assignments/[id]` | Như trên | Như trên | `max-w-7xl` (rộng hơn các trang trên), nhiều bảng và hộp thoại | `text-xl md:text-2xl font-bold` | 379 | 4 | 0 |
| **Bàn soạn** `/editor/[id]` | `Header.tsx`: nút menu, logo, nút "Kho đề", tên đề, trạng thái lưu, Tải Word, In/PDF, Gemini AI, sáng/tối, Khóa AI, tài khoản | **Không có menu giáo viên**; thanh trái là 12 công cụ soạn; thanh phải là trợ lý | Ba vùng: công cụ trái, trang soạn, xem trước | — | 344 (cả ba tệp) | 11 | 0 |
| **Quản trị** `/admin/*` | `AdminShell`: tên, nút "Về kho đề", sáng/tối, đăng xuất, kèm hàng nút điều hướng | Thanh **ngang** riêng (Tài khoản, Cấp khóa AI, Hoạt động AI) | `max-w-7xl` | `text-2xl font-semibold` | 249 | 8 | 0 |
| **Học sinh** `/a/…`, **chia sẻ** `/share/…` | Thanh riêng mỗi trang, không có menu (đúng, vì không phải khu giáo viên) | — | — | — | 354 / — | — | — |

Phát hiện đáng chú ý trong bảng:
- **Trang Ngân hàng là trang duy nhất dùng biến màu chung (0 hex)**; các trang còn lại viết màu cứng. Đây là "thế hệ hai" Codex dựng đợt vừa rồi, đặt cạnh "thế hệ một". Vì vậy ảnh ngân hàng nhìn khác hẳn Lớp học và Bài đã giao (thẻ trắng chính giữa, ô có nhãn, bo góc nhỏ) dù cùng một khu.
- **Ba lần đặt tên khác nhau cho cùng một nơi:** menu cũ "Quản lý Lớp học", menu mới "Lớp học", đường dẫn "Quản lý lớp học"; tương tự "Tất cả đề thi" (menu cũ) / "Kho đề" (menu mới) / "Kho đề của tôi" (thanh công cụ trang).

## 3. Các lớp đang lệch nhau

Mỗi dòng dưới đây là một "lớp" của giao diện; một trang chỉ nhìn đồng nhất khi **mọi** lớp cùng khớp.

| Lớp | Đang có bao nhiêu kiểu | Chi tiết |
|---|---:|---|
| Thanh trên | **4** | Kho đề (64 px, đủ nút AI); `teacher/layout` (tối giản, nút chữ "Tối"); Bàn soạn (`Header`); Quản trị (`AdminShell`) |
| Menu điều hướng | **3** | Thanh dọc (kho đề + `/teacher/*`), thanh ngang (quản trị), thanh công cụ trái (bàn soạn) |
| Đường dẫn "← Kho đề" trong thân trang | 2 trang còn | Lớp học, Bài đã giao: lặp với mục "Kho đề" của menu |
| Khung bọc trang | 3 | Kho đề không bọc; Lớp học/Bài đã giao **tự bọc `min-h-screen` + nền riêng bên trong layout đã có nền**, `max-w-6xl`; Chi tiết/Quản trị `max-w-7xl`; Ngân hàng `max-w-6xl` + thẻ |
| Tiêu đề trang | 3 | Không tiêu đề (kho đề); tiêu đề ngoài thẻ có biểu tượng (Lớp, Bài giao); tiêu đề trong thẻ (Ngân hàng) |
| Ô tìm và ô lọc | 3 | Ô tìm bo tròn hết cỡ ở thanh trên (kho đề), ô tìm bo tròn trong thân trang (Lớp, Bài giao), ô có nhãn phía trên bo vuông (Ngân hàng, `teacher-field`) |
| Nút chính | 2 | Nút chung `app-button-primary` (Ngân hàng, Soạn đề mới) và nút tự ghi `app-button-primary` kèm `dark:bg-[#e3e3e3]` ghi đè tay (Lớp học, Bài giao) |
| Thẻ và bảng | 3 | Thẻ nhỏ chữ xs (kho đề), thẻ lớn (Lớp học), bảng và hộp thoại tự dựng (Chi tiết bài giao) |
| Trạng thái trống, lỗi, tải | nhiều | Mỗi trang có mẫu riêng (đường kẻ đứt, khung đỏ, chữ "Đang tải…") |

## 4. Nguyên nhân

1. **Thanh trên của kho đề không dùng chung được** vì nó nằm trong `TeacherDashboard.tsx` (1.416 dòng) và các nút AI mở hộp thoại do chính tệp đó giữ trạng thái. Khi Codex nối các trang, `teacher/layout` dựng một thanh trên mới tối giản thay vì dùng thanh trên thật.
2. **Không có "khung trang" và "thẻ" chung trong thư viện giao diện.** `globals.css` chỉ định nghĩa nút, hộp thoại, ô nhập, `app-page`, `app-bar`, `app-menu`; không có tiêu đề trang, thẻ, khối bộ lọc, trạng thái trống. Mỗi trang tự ghép từ lớp Tailwind và mã màu.
3. **Hai thế hệ giao diện cạnh nhau** (hex và token), như mục 2.
4. **Menu của tôi chỉ giải quyết "đích đến"**, bỏ qua nhóm, thứ tự và nội dung riêng của kho đề (thư mục, bộ lọc), nên trang ngoài kho đề trông như một app khác.

## 5. Thiết kế đích

Một khung dùng cho **mọi trang giáo viên** (kho đề, ngân hàng, lớp học, bài đã giao, chi tiết bài giao, thùng rác):

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ExamCraft │ [Ô tìm đề – chỉ hiện ở Kho đề] │ Bộ não AI · Thư ký AI · Khóa AI │ ☀/☾ │ Tên │  ← Thanh trên (MỘT thành phần)
├────────────┬───────────────────────────────────────────────────────────────┤
│ [+ Soạn đề │  Tiêu đề trang + mô tả ngắn                    [Nút chính]     │
│   thi mới] │  ───────────────────────────────────────────────────────────   │
│ KHO ĐỀ     │  Thanh lọc/tìm (cùng kiểu ô)                                    │
│  Tất cả đề │  Thẻ / bảng / trạng thái trống (cùng kiểu)                      │
│  Đề quan   │                                                                 │
│  trọng     │                                                                 │
│  Đã sửa    │                                                                 │
│  gần đây   │                                                                 │
│ THƯ MỤC CỦA│                                                                 │
│ TÔI (cây)  │                                                                 │
│ KHẢO THÍ & │                                                                 │
│ LỚP        │                                                                 │
│  Lớp học   │                                                                 │
│  Bài đã    │                                                                 │
│  giao      │                                                                 │
│  Ngân hàng │                                                                 │
│  câu hỏi   │                                                                 │
│ Thùng rác  │                                                                 │
│ [Quản trị] │                                                                 │
└────────────┴───────────────────────────────────────────────────────────────┘
```

**Menu** (khôi phục đúng thứ tự và tên cũ như chủ dự án yêu cầu, dùng một thành phần duy nhất cho mọi trang):

1. Nút **Soạn đề thi mới**.
2. Nhóm kho đề: **Tất cả đề thi** (kèm số), **Đề quan trọng (Gắn sao)**, **Đã sửa gần đây**.
3. **Thư mục của tôi** (cây thư mục, tạo, xóa).
4. Nhóm **Khảo thí & Lớp**: **Lớp học** (nhãn cũ "Quản lý Lớp học" có thể giữ), **Bài đã giao**, **Ngân hàng câu hỏi**.
5. **Thùng rác**.
6. **Trang quản trị hệ thống** (chỉ quản trị viên).

Quy tắc "một đích đến chỉ xuất hiện một lần" vẫn giữ: bỏ đường dẫn "← Kho đề / …" trong thân trang Lớp học và Bài giao; trên điện thoại menu dọc thành ngăn kéo (nút ☰) hoặc hàng tab, không có hai menu cùng lúc.

**Khung nội dung chung** (các thành phần mới dùng biến màu chung): đầu trang (tiêu đề, mô tả, nút chính, cùng cỡ chữ), thẻ, khối bộ lọc/tìm, trạng thái trống/lỗi/đang tải. Tiêu đề và thẻ của Ngân hàng (thế hệ hai) được lấy làm chuẩn vì đã dùng biến màu.

**Lọc và cây thư mục trên mọi trang.** "Chung menu" có hai mức. Mức rẻ: cùng nhóm, cùng tên, cùng thứ tự ở mọi trang, còn bộ lọc và cây thư mục chỉ hiện ở kho đề. Mức đúng với yêu cầu "chung menu": cây thư mục và bộ lọc hiện ở mọi trang (bấm vào đi về `/?folder=…` hoặc `/?view=…`). Mức này cần đưa việc tải và quản lý thư mục khỏi `TeacherDashboard` vào khung chung. **Tôi đề xuất mức đúng** vì nếu không, menu vẫn đổi hình khi chuyển trang.

## 6. Trang soạn đề

Thanh trái hiện có 12 công cụ (đọc từ `LeftNavigationRail.tsx`): tạo bản nháp bằng AI, trợ lý AI, ghi chú riêng cho trợ lý, trộn đề, ma trận, cài đặt đầu đề, chọn câu từ ngân hàng, sao lưu/nhập kho cũ, nhập Word/ảnh, chia sẻ, kết quả, khóa AI. Chủ dự án nói đúng: nó thay cho vị trí menu nên trang soạn **không có đường đi trực tiếp** tới lớp, bài giao, ngân hàng.

| Phương án | Mô tả | Ưu | Nhược |
|---|---|---|---|
| A. Giữ nguyên | Soạn là màn hình chuyên dụng như Google Docs; chỉ có nút "Kho đề" để thoát | Không đổi, rộng chỗ soạn | Không đồng nhất với khu còn lại; không đi thẳng sang lớp/bài giao |
| **B. Thanh công cụ ngang (đề xuất)** | Chuyển 12 công cụ lên một thanh ngang dưới thanh đầu, gom thành vài nhóm xổ xuống: *Thêm câu hỏi* (thủ công, chọn từ ngân hàng, nhập Word/ảnh, sinh bằng AI) · *Đề thi* (cài đặt đầu đề, trộn đề, ma trận, sao lưu) · *Chia sẻ & kết quả* · *Xuất* (Word, in) · *AI* (trợ lý, ghi chú riêng, khóa AI). Thanh trái trở thành **chính menu giáo viên** (thu gọn thành biểu tượng để dành chỗ soạn) | Đúng ý chủ dự án; mọi trang giáo viên có cùng menu trái; trang soạn vẫn rộng | Tốn công hơn: viết lại `LeftNavigationRail` thành thanh ngang + menu xổ; trên điện thoại thanh ngang cuộn ngang, menu trái thành ngăn kéo |
| C. Nút ☰ mở menu | Giữ thanh công cụ trái; thêm nút ☰ mở menu giáo viên dạng ngăn kéo | Ít sửa | Menu bị giấu, vẫn không "chung" |

**Ràng buộc khi làm B:** các bài kiểm trình duyệt gọi nút công cụ theo chú thích (ví dụ "Chọn câu hỏi từ Ngân hàng chèn vào đề"); phải giữ tên truy cập của từng nút để không phải viết lại hàng loạt.

## 7. Trang cần sửa gì

| Trang | Việc | Công sức |
|---|---|---|
| Khung chung | Thanh trên chung; menu chia nhóm chung (có cây thư mục); thành phần đầu trang, thẻ, khối lọc, trạng thái | Lớn nhất, làm trước |
| Kho đề | Dùng khung chung; thanh trên cũ bỏ vì đã nằm trong khung; chuyển cây thư mục và hộp thoại thư mục ra khung | Lớn (tệp 1.416 dòng) |
| Ngân hàng | Chỉ bọc vào khung; làm chuẩn cho tiêu đề và thẻ | Nhỏ |
| Lớp học, Bài đã giao | Bỏ khung `min-h-screen` tự bọc, bỏ đường dẫn "← Kho đề", đổi đầu trang/ô tìm/nút sang thành phần chung, đổi hex sang biến màu | Vừa (532 và 216 dòng) |
| Chi tiết bài giao | Cùng khung và đầu trang; bảng và hộp thoại sang kiểu chung | Lớn (1.009 dòng, 379 hex) |
| Bàn soạn | Phương án B | Lớn |
| Quản trị | Cùng khung với nhóm menu riêng (thay thanh ngang) | Vừa |
| Học sinh, chia sẻ, đăng nhập | Ngoài phạm vi khung giáo viên; chuyển hex sang biến màu về sau | Để sau |

## 8. Thứ tự đề xuất và cách kiểm

1. **Đợt A, khung chung:** thanh trên, menu chia nhóm (có thư mục), thành phần đầu trang/thẻ/lọc/trạng thái. Chưa đụng nội dung từng trang. Kiểm: một trang thử dùng khung, ảnh chụp 320/375/568/1440, sáng/tối.
2. **Đợt B, đưa từng trang vào khung**, theo thứ tự Ngân hàng, Lớp học, Bài đã giao, Chi tiết bài giao, Kho đề. Mỗi trang xong: chạy bộ kiểm `--teacher` và luồng tương ứng, cập nhật mốc `check-ui-tokens.cjs` (hex chỉ giảm).
3. **Đợt C, bàn soạn** (phương án B).
4. **Đợt D, quản trị.**

Mỗi đợt dựng và kiểm ở bản sao riêng (không dựng đè bản bạn đang xem), và báo lại bảng "trước/sau" cho từng trang.

**Rủi ro cần biết:** bài kiểm trình duyệt hiện gọi menu theo tên (nay đã gồm "Kho đề", "Thùng rác", nút "Đề quan trọng (Gắn sao)", "Đã sửa gần đây"); khôi phục nhóm "Tất cả đề thi" và tên cũ sẽ buộc chỉnh lại các đoạn đó. Next.js giữ bản ẩn của trang trước nên bài kiểm phải lọc theo phần tử đang hiển thị.

## 9. Bốn điều cần chủ dự án quyết

1. **Thứ tự menu** như mục 5 có đúng ý (đặc biệt "Ngân hàng câu hỏi" nằm trong nhóm Khảo thí & Lớp như menu cũ, hay chuyển sang nhóm kho đề vì liên quan soạn)?
2. **Cây thư mục và bộ lọc có hiện ở mọi trang** (mức đúng, đề xuất) hay chỉ ở kho đề?
3. **Trang soạn:** chọn A, B (đề xuất) hay C?
4. **Quản trị** có dùng cùng khung (menu dọc có nhóm riêng) không, hay giữ thanh ngang?
