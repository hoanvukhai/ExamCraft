# Thiết kế khung chung và bàn soạn (trong và ngoài thống nhất)

Ngày 27/10/2026. Người viết: Claude. **Bản thiết kế, chưa sửa mã.** Nối tiếp [PHAN_TICH_TUNG_TRANG.md](PHAN_TICH_TUNG_TRANG.md). Chủ dự án đã duyệt hướng: chuyển thanh công cụ dọc của bàn soạn thành thanh ngang, khôi phục menu trái từ ngoài vào trong bàn soạn, và thiết kế lại bên phải để trong và ngoài khớp nhau; chấp nhận thiết kế lại nhiều trang.

## 1. Các quyết định (chủ dự án giao tôi chốt những điểm 1, 2, 4)

| Điểm | Quyết định | Lý do |
|---|---|---|
| **1. Nhóm menu** | **Soạn đề:** Kho đề (Tất cả đề thi, Đề quan trọng, Đã sửa gần đây), Thư mục, **Ngân hàng câu hỏi**. **Khảo thí & Lớp:** Lớp học, Bài đã giao. Rồi **Thùng rác**; cuối cùng **Quản trị** (chỉ quản trị viên) | Menu cũ đặt Ngân hàng trong "Khảo thí & Lớp", nhưng ngân hàng là nơi lấy câu để *soạn* (trong bàn soạn cũng nằm ở nhóm "chèn câu vào đề"). "Khảo thí & Lớp" chỉ giữ những gì liên quan học sinh: lớp, bài giao, kết quả. Vẫn là hai nhóm đúng tinh thần menu cũ |
| **2. Thư mục** | Phần **Thư mục** nằm trong menu trái ở **mọi trang** (gấp/mở được, nhớ trạng thái), có nút **+** tạo thư mục. Bấm vào một thư mục đi tới `/?folder=…`. Giữ cây 2 cấp như hiện nay. Theo tinh thần Figma/Canva: thư mục là "dự án" của giáo viên; ở trang Kho đề, đầu danh sách hiện thêm hàng thư mục dạng thẻ nhỏ (làm sau, không chặn các đợt đầu) | Menu chung thật sự phải giống hệt ở mọi trang; thư mục là thứ giáo viên dùng nhiều nhất |
| **3. Bàn soạn** | Mục 4 và 5 dưới đây | Theo yêu cầu của chủ dự án |
| **4. Quản trị** | **Dùng cùng khung** (thanh trên, menu trái, vùng nội dung), thân menu đổi thành nhóm **Quản trị**: Tài khoản, Cấp khóa AI, Hoạt động AI, kèm mục "Về khu giáo viên" | Quản trị viên cũng là giáo viên; bỏ thanh ngang riêng, bớt một kiểu giao diện |

## 2. Phân tích tác dụng: mỗi việc đang nằm ở đâu

Đọc từ mã (`TeacherDashboard`, `Header`, `LeftNavigationRail`, `RightCompanionRail`, `ExamWorkspace`). **Nhận xét chung: cùng một việc bị đặt ở 2–4 chỗ, và chỗ đặt khác nhau giữa ngoài (kho đề) và trong (bàn soạn).**

| Loại việc | Việc cụ thể | Ngoài (kho đề, lớp, bài giao…) | Trong (bàn soạn) | Số chỗ trùng |
|---|---|---|---|---:|
| **Đi lại** | Về kho đề, sang lớp/bài giao/ngân hàng | Thanh dọc (nay), thanh ngang, nút "← Kho đề" trong trang | Chỉ nút "Kho đề", logo, và liên kết "Về kho đề" | 3–4 |
| **Thêm vào đề** | Sinh đề AI, chọn từ ngân hàng, nhập Word/ảnh, thêm câu | Thẻ lớn "Soạn đề trống / AI sinh đề / Nhập Word" | Thanh trái (Sinh đề AI Mới, Ngân hàng câu hỏi, Nhập đề Word/Ảnh), nút "Thêm câu hỏi" ở trang soạn | 2 |
| **Cài đặt cả đề** | Đầu đề trường thi, trộn 4 mã đề, ma trận | — | **Thanh trái *và* thanh phải** (cả ba nút ở cả hai bên); đầu đề cũng nằm trong trang | 2–3 |
| **Đầu ra** | Tải Word, In/PDF, trình chiếu | — | Thanh đầu (Tải Word, In/PDF), thanh xem trước (In/PDF, Tải file Word lần nữa), hàng nút "Trình chiếu" | 3 |
| **Xuất bản** | Chia sẻ & thi online, bảng điểm, cùng soạn/góp ý/lịch sử | Trang Bài đã giao | Thanh trái (Chia sẻ, Bảng điểm), hàng nút "Cùng soạn · Góp ý · Lịch sử" | 2 |
| **Trợ lý AI** | Hỏi đáp; sửa đề theo lệnh | Nút "Thư ký AI" ở thanh trên *và* biểu tượng robot ở thanh phải | Nút "Gemini AI" ở thanh đầu, "Trợ lý AI Copilot" ở thanh trái, biểu tượng ở thanh phải (3 nút cho một ngăn) | 2–3 |
| **Ghi chú/ký ức AI** | Dạy AI phong cách ra đề | "Bộ não AI" (thanh trên) | "Ghi chú riêng cho AI" (thanh trái) — **cùng chức năng, hai tên** | 2 |
| **Khóa AI** | Khóa Gemini của tôi | Nút "Khóa AI: n" thanh trên *và* biểu tượng chìa khóa thanh phải | Huy hiệu "Khóa AI" thanh đầu *và* "Kho Khóa AI (Keys)" thanh trái | 4 |
| **Tài khoản và giao diện** | Sáng/tối, người dùng, đăng xuất | Thanh trên (kho đề) hoặc nút chữ "Tối" (các trang khác) | Thanh đầu | 3 kiểu |
| **Ngân hàng** | Quản lý câu hỏi / chèn câu | Thanh dọc, biểu tượng cơ sở dữ liệu ở thanh phải | Thanh trái (bộ chọn chèn câu) | 3 |

**Nguyên tắc rút ra:**
1. **Mỗi loại việc có đúng một chỗ**, và là cùng một chỗ trong lẫn ngoài.
2. **Bên trái = đi đâu** (menu giáo viên). **Hàng ngang dưới thanh trên = làm gì với thứ đang mở** (công cụ của trang soạn; bộ lọc và nút chính của các trang quản lý). **Bên phải = nhờ AI.** **Góc phải thanh trên = tôi là ai** (khóa AI, sáng/tối, tài khoản).
3. Việc chỉ dùng thỉnh thoảng đi vào menu xổ xuống; việc dùng liên tục để lộ ra thành nút.

## 3. Khung chung (ngoài)

```
┌ Thanh trên ───────────────────────────────────────────────────────────────────────┐
│ ☰ ExamCraft │ [Ô tìm đề – chỉ ở Kho đề]            [Trợ lý AI] [Khóa AI: n] ☀/☾ [Tên ▾] │
├ Menu trái ┬ Tiêu đề trang + mô tả ngắn · hàng lọc · nút chính ─────────────┬ Ngăn AI ┤
│ + Soạn đề │                                                                  │ Hỏi đáp │
│ SOẠN ĐỀ   │  Nội dung (thẻ/bảng/trạng thái trống cùng kiểu)                  │ Ghi chú │
│ Kho đề…   │                                                                  │  AI     │
│ Thư mục   │                                                                  │         │
│ KHẢO THÍ  │                                                                  │         │
│ & LỚP     │                                                                  │         │
│ Thùng rác │                                                                  │         │
│ Quản trị  │                                                                  │         │
└───────────┴──────────────────────────────────────────────────────────────────┴─────────┘
```

- **Thanh trên** (một thành phần, dùng cho mọi trang): bỏ nút "Bộ não AI" và "Thư ký AI" riêng; còn **Trợ lý AI** (bật/tắt ngăn phải), **Khóa AI: n**, sáng/tối, tài khoản (đăng xuất ở đây).
- **Ngăn AI bên phải** (một ngăn, hai tab): **Hỏi đáp** (Thư ký AI hiện nay) và **Ghi chú AI** (Bộ não AI hiện nay, nay một tên duy nhất). Biểu tượng chìa khóa và cơ sở dữ liệu ở thanh phải hiện tại **bỏ** (trùng với Khóa AI và menu).
- **Menu trái**: thu gọn thành biểu tượng được; điện thoại là ngăn kéo mở bằng ☰.

## 4. Bàn soạn (trong): thanh ngang + menu trái + ngăn phải

```
┌ Thanh trên (cùng khung) ──────────────────────────────────────────────────────────┐
│ ☰ ExamCraft │ Tên đề (sửa tại chỗ) ● Đã lưu │ [Chia sẻ] [Trợ lý AI] [Khóa AI] ☀/☾ [Tên ▾] │
├ Thanh công cụ soạn đề (hàng ngang) ───────────────────────────────────────────────┤
│ [+ Thêm câu hỏi] [Ngân hàng] [Nhập Word/Ảnh] [Sinh bằng AI] │ [Đề thi ▾] [Xuất ▾] │ [Bảng điểm (n)] [Cùng soạn ▾] │ Rà soát: n mục ⓘ  Đề của bạn │
├ Menu trái ┬ Trang soạn (cột sửa) │ Xem trước ───────────────────────────────┬ Ngăn AI ┤
│ (biểu     │                      │                                          │ Sửa đề  │
│ tượng,    │                      │                                          │ Hỏi đáp │
│ mở rộng   │                      │                                          │ Ghi chú │
│ được)     │                      │                                          │         │
└───────────┴──────────────────────┴──────────────────────────────────────────┴─────────┘
```

**Thanh công cụ ngang (thay thanh công cụ trái và hàng nút gạch chân):**

| Nhóm | Nút | Hiển thị | Ghi chú |
|---|---|---|---|
| Thêm vào đề | **Thêm câu hỏi**, **Ngân hàng**, **Nhập Word/Ảnh**, **Sinh bằng AI** | Nút lộ ra (dùng liên tục) | Giữ nguyên tên truy cập hiện tại để các bài kiểm trình duyệt không vỡ |
| Đề thi | Cài đặt đầu đề (tiêu đề trường thi), Trộn 4 mã đề, Ma trận & đặc tả, Sao lưu · Nhập kho cũ | Menu xổ **Đề thi ▾** | Gộp các nút đang trùng ở thanh trái *và* phải |
| Xuất | Tải Word, In/PDF, Trình chiếu | Menu xổ **Xuất ▾** (Tải Word là nút lộ riêng nếu đủ chỗ) | Gộp ba chỗ trùng: thanh đầu, thanh xem trước, hàng nút trình chiếu |
| Xuất bản | **Chia sẻ & Thi Online** (nút nổi bật ở thanh trên, kiểu Google Docs), **Bảng điểm (n)**, **Cùng soạn · Góp ý · Lịch sử** | Nút lộ | |
| Trạng thái | Rà soát đề (số mục cần xem, bấm mở khung nhỏ, thay cho thanh `<details>` ngang cả bề rộng), nhãn quyền ("Đề của bạn") | Bên phải thanh | |

**Menu trái trong bàn soạn:** cùng menu như bên ngoài (mục 3). Mặc định thu thành thanh biểu tượng rộng 56 px (đúng bằng thanh công cụ trái hiện nay, nên **không mất chỗ soạn**); rê hoặc bấm để mở rộng chồng lên trang. Nhờ đó giáo viên đi thẳng từ bàn soạn sang lớp, bài giao, ngân hàng, thư mục.

**Ngăn AI bên phải (cùng ngăn với bên ngoài, thêm một tab theo ngữ cảnh):** **Sửa đề** (Copilot hiện nay, chỉ có khi đang mở đề) · **Hỏi đáp** · **Ghi chú AI**. Ba nút của ngăn phải hiện tại (Ma trận, Trộn, Cài đặt) **bỏ**, vì đã nằm trong **Đề thi ▾**.

**Tại sao hợp lý:**
- Trái = đi đâu, ngang = làm gì, phải = nhờ AI, góc phải trên = tôi là ai: **cùng một quy tắc trong lẫn ngoài**, giáo viên không phải học lại khi bước vào bàn soạn.
- Bàn soạn **không mất chỗ** (hai thanh 56 px như hiện nay, thêm một hàng công cụ cao khoảng 44 px thay hàng nút và thanh `<details>` đang có).
- Giảm số nút trùng: Khóa AI từ 4 chỗ còn 1; trợ lý AI từ 3 còn 1; xuất từ 3 còn 1; Ma trận/Trộn/Cài đặt từ 2 còn 1.

**Điện thoại và cửa sổ hẹp (dưới 1024 px):** menu trái là ngăn kéo (☰); thanh công cụ cuộn ngang; ngăn AI mở dạng tấm phủ từ phải/dưới. Hiện nay thanh công cụ trái đã là ngăn kéo trên điện thoại, nên hành vi quen thuộc.

## 5. Thiết kế lại nhiều trang: phạm vi và thứ tự

| Đợt | Việc | Kết quả kiểm |
|---|---|---|
| **A. Khung chung** | Thanh trên chung; menu trái chia nhóm có thư mục (tự tải thư mục); ngăn AI chung (hai tab); thành phần đầu trang, thẻ, khối lọc, trạng thái. Đưa các hộp thoại AI/khóa/thư mục ra khỏi `TeacherDashboard` vào khung | Một trang thử trong khung; ảnh 320/375/568/1440, sáng/tối |
| **B. Đưa từng trang vào khung** | Ngân hàng → Lớp học → Bài đã giao → Chi tiết bài giao → Kho đề. Bỏ khung `min-h-screen` tự bọc, bỏ "← Kho đề", đổi sang thành phần và biến màu chung | Bộ `--teacher` và luồng tương ứng; mốc màu cứng chỉ giảm |
| **C. Bàn soạn** | Thanh công cụ ngang; menu trái chung ở dạng biểu tượng; ngăn phải chung; bỏ hàng nút gạch chân, bỏ nút trùng ở thanh đầu và xem trước | F2, F9, F11, F14, F19 và các luồng soạn; kiểm tay trên điện thoại |
| **D. Quản trị** | Cùng khung, thân menu "Quản trị" | Bộ `--admin` |

Mỗi đợt dựng và kiểm ở bản sao riêng (không dựng đè bản đang xem), có bảng "trước/sau" từng trang, và chỉ đẩy khi chủ dự án xem được.

## 6. Rủi ro và những gì phải sửa theo

1. **Bài kiểm trình duyệt gọi nút bằng tên:** thanh công cụ trái có nhiều nút được gọi theo chú thích. Nút lộ ở thanh ngang giữ nguyên tên; nút vào menu xổ phải thêm bước "mở menu". Ước tính phải chỉnh một phần các bài F2, F9, F11, F14, F19 và `teacher.test.ts`.
2. **Đưa hộp thoại AI/khóa/thư mục ra khung** là phần phức tạp nhất của đợt A: chúng đang giữ trạng thái trong `TeacherDashboard` (1.416 dòng).
3. **Next.js giữ bản ẩn của trang trước** (bộ nhớ đệm), nên khung chung phải tránh trùng hộp thoại hoặc trùng mã nhận dạng.
4. **Bàn soạn dùng chung với chế độ xem của người được mời** (chỉ xem/góp ý): thanh công cụ phải ẩn hoặc khóa nút theo quyền như thanh trái hiện nay (`canEdit`).
5. **Không có người kiểm bằng điện thoại thật** trong các đợt này; kiểm mô phỏng và ảnh.

## 7. Cần chủ dự án xác nhận (ngắn)

1. Bàn soạn: **"Chia sẻ & Thi Online" là nút nổi bật ở góc phải thanh trên** (kiểu Google Docs), còn Tải Word/In/PDF vào **Xuất ▾** — có chấp nhận (tải Word chuyển từ thanh trên vào thanh công cụ)?
2. Ngăn AI: dùng hai tab **Hỏi đáp** và **Ghi chú AI**, ở bàn soạn thêm **Sửa đề**; bỏ nút "Bộ não AI" riêng ở thanh trên — có chấp nhận?
3. Bắt đầu **đợt A**?

## 8. Tình trạng thực hiện (27/10/2026, commit 63370e5 trở đi)

Cả bốn đợt đã làm trong mã. Bản dựng riêng ở thư mục khác, máy chủ thử cổng 3122:

| Kiểm | Kết quả |
|---|---|
| Kiểm kiểu; lint toàn repo | Sạch; 0 lỗi, 114 cảnh báo (trước đợt này 120) |
| Test an toàn (SAFE) | 498/498 |
| Màu viết cứng (`check-ui-tokens.cjs`) | 3.394 (trước 3.754), tệp nào chỉ được giảm |
| Bộ kiểm giáo viên `--teacher` | 7/7 |
| Bộ kiểm quản trị `--admin` | 11/11 |
| Bộ kiểm chữ tiếng Việt `--typography` | 4/4 |
| Luồng F2, F3, F9, F11, F14, F16, F18, F19, F20, F21, F23, F24, F25 | Đạt cả mười ba (F21 từng trượt một lần khi chạy liền nhiều bộ, đạt khi chạy riêng, như đã ghi trước đây) |
| Xem trực tiếp bằng trình duyệt | Kho đề, Lớp học, Ngân hàng, bàn soạn ở 1440 px và 375 px |

**Cấu trúc đã đổi:** các trang chuyển vào nhóm route `src/app/(workspace)/` (địa chỉ không đổi) để một khung `WorkspaceShell` bao tất cả; `TeacherNavigation`, `AdminShell`, `LeftNavigationRail` bị xóa; thêm `src/components/workspace/` (ngữ cảnh, menu, thanh trên, thanh AI, thành phần đầu trang) và `EditorToolbar`. Hộp thoại khóa AI, ghi chú AI, trợ lý và tạo/xóa thư mục thuộc về khung.

**Chỗ làm khác bản thiết kế (có chủ ý, ghi rõ):**
1. **Điện thoại:** menu là một hàng tab cuộn ngang (không phải ngăn kéo); thanh công cụ bàn soạn cũng một dòng cuộn ngang. Cây thư mục chưa có trên điện thoại ngoài ô chọn thư mục của trang Kho đề.
2. **Ghi chú AI:** là nút ở thanh phải (mở hộp thoại hiện có), không phải tab trong ngăn; "Hỏi đáp" vẫn là ngăn Thư ký AI.
3. **Rà soát đề:** vẫn là thanh `<details>` dưới thanh công cụ, chưa thành nhãn nhỏ có khung xổ.
4. **Hàng thẻ thư mục** ở đầu Kho đề: chưa làm (đã ghi "làm sau").
5. **Mã màu viết cứng bên trong từng trang** (bảng, thẻ, hộp thoại) vẫn còn; khung, đầu trang, menu, thanh công cụ đã dùng biến màu chung.
6. **Bản ẩn trong trang:** Next.js giữ một bản ẩn của khung (thuộc tính `hidden`); các bài kiểm phải chọn phần tử đang hiển thị (đã chỉnh trong `pilot.test.ts`).

## 9. Khung hai thanh kiểu Firebase (27/10/2026, đợt sau)

Chủ dự án yêu cầu bỏ thanh trên cùng, chỉ còn hai thanh bên.

- **Menu trái** (`WorkspaceMenu.tsx`): logo; nút "Soạn đề thi mới"; nhóm gập bằng mũi tên (Soạn đề, Thư mục gần đây, Khảo thí & Lớp); Thùng rác; chân menu có nút tròn thu gọn. Trong bàn soạn menu mặc định là thanh icon 56 px, mở đè lên trang.
- **Rail phải** (`WorkspaceRail.tsx`): avatar tài khoản (trạng thái khóa AI, đăng xuất), Trợ lý AI sửa đề (chỉ trong bàn soạn), Thư ký AI, ghi chú AI, khóa AI, đổi sáng/tối ở đáy. Điện thoại: thanh mỏng + hàng tab thay cho hai thanh.
- **Bàn soạn:** `Header.tsx` chỉ còn thanh tài liệu (tên đề, trạng thái lưu, Chia sẻ); không còn thanh trên cùng cũ nên không có "menu trên menu". Bảng Trợ lý AI mở bằng nút ở rail phải (trạng thái nằm trong `WorkspaceContext`).
- **Kho đề:** ô tìm và chọn thư mục nằm trong thanh công cụ của trang.
- **Trang Thư mục mới** `/teacher/folders`: thẻ thư mục, đường dẫn, tìm, tạo (cả thư mục con), sửa tên/màu, xóa, danh sách đề trong thư mục. Cây thư mục bên menu được thay bằng "Thư mục gần đây".
- **Đã xóa:** `WorkspaceTopBar.tsx`, `AiRail.tsx`.

Kiểm: bản dựng riêng, cổng 3122, DB thử. `--teacher` 7/7, `--admin` 11/11, `--typography` 4/4; luồng F2, F3, F9, F11, F14, F16, F18, F19, F20, F21, F23, F24, F25 đạt. Test đã sửa: chờ toast "Đã chuyển đề vào thùng rác" trước khi sang Thùng rác (đua dữ liệu, trước đây lúc đạt lúc trượt); `openExam` chờ tiêu đề đề thi bật được; bộ khóa/Thư ký dùng phần tử đang hiện. Màu viết cứng 3.128 (đã khóa).

Chưa làm/chưa kiểm: chạy lại `npm run ci` đầy đủ trên cổng 3117; thử trên điện thoại thật; bàn soạn chi tiết (đợt kế); trang Thư mục chưa có kéo thả đề vào thư mục.
