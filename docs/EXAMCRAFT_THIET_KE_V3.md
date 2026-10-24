# EXAMCRAFT v3.1 — PHÂN TÍCH, QUYẾT ĐỊNH THIẾT KẾ VÀ KẾ HOẠCH TRIỂN KHAI

> **Tài liệu lịch sử/đầu vào phân tích:** từ 21/10/2026, dùng [bộ tổng kết và kế hoạch hiện hành](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md). Nội dung và dấu hoàn thành dưới đây không tự đại diện cho yêu cầu hoặc tiến độ mới; giữ để đối chiếu nguồn gốc.

> **Bản v3.1** bổ sung so với v3: nơi chạy (Vercel hay VPS), tải thực tế khi học sinh vào làm bài, bảng xếp hạng (top + vị trí của mình), ngân hàng câu hỏi chung có tác giả, nhập câu hỏi từ web ở mức cá nhân, và các quyết định đã chốt.

> Tài liệu này thay thế hai file `ExamCraft_phan_tich_va_ke_hoach.md` và `KE_HOACH_PHAN_TICH_DU_AN_EXAMCRAFT.md`.
> Phạm vi đánh giá: README và hai file kế hoạch hiện có trong repo. **Chưa rà soát mã nguồn `src/`, thư mục `data/` và nội dung file `.docx`**, nên các mục liên quan đến code được đánh dấu **[CẦN KIỂM TRA]**.

---

## MỤC LỤC

1. Tóm tắt quyết định
2. Hiện trạng: những điểm sai, thiếu, mâu thuẫn cần sửa
3. Kiến trúc mục tiêu (hướng B: PostgreSQL + Prisma + Docker)
4. Vai trò và tài khoản
5. Hệ thống giao bài và phòng làm bài (học sinh không tài khoản), tải thực tế, bảng xếp hạng
6. Thiết kế cơ sở dữ liệu (Prisma schema)
7. Xử lý AI: Gemini, nhóm 7 API key, kiểm định
8. Soạn đề, môn học, cấu trúc đề, ngân hàng câu hỏi chung có tác giả
9. Xuất Word, in ấn, phân trang A4
10. Bảo mật
11. Quyền riêng tư dữ liệu học sinh
12. Nơi chạy (Vercel hay VPS), Docker, sao lưu
13. Sơ đồ trang và API
14. Giao diện: nguyên tắc và danh sách màn hình
15. Nhập câu hỏi từ web và nguồn ngoài
16. Kiểm thử và nghiệm thu
17. Lộ trình triển khai
18. Rủi ro và câu hỏi còn mở
19. Danh sách việc dọn dẹp repo

---

## 1. TÓM TẮT QUYẾT ĐỊNH

| # | Chủ đề | Quyết định |
|---|---|---|
| 1 | Hướng phát triển | **Hướng B**: ứng dụng web nhiều giáo viên, dữ liệu trên server |
| 2 | Cơ sở dữ liệu | **PostgreSQL**, quản lý schema bằng **Prisma**, chạy bằng **Docker Compose** |
| 3 | Lưu trữ phía trình duyệt | **Bỏ** IndexedDB/Dexie làm nơi lưu chính. Chỉ giữ một công cụ nhập một lần từ bản local cũ |
| 4 | Quy mô | Vài giáo viên, dự án cá nhân. Giữ đơn giản, không dựng hạ tầng lớn |
| 5 | Tài khoản giáo viên | **Do admin cấp**, không tự đăng ký |
| 6 | Vai trò | `SUPER_ADMIN` và `TEACHER` |
| 7 | Học sinh | **Không có tài khoản**. Vào bằng link, chọn hoặc nhập tên, làm bài. Chỉ lưu tên và nhãn lớp |
| 8 | Hạn nộp, thời gian mở/đóng | **Giáo viên** đặt cho từng bài giao. Admin chỉ quản lý tài khoản và giới hạn hệ thống |
| 9 | Kiểu giao bài | Một cơ chế "bài giao" (Assignment) với 3 chế độ cấu hình sẵn: Bài tập về nhà, Bài trên lớp, Phòng thi |
| 10 | Lịch sử làm bài | Lưu theo học sinh (bản ghi tên), giáo viên xem và xóa được |
| 11 | Học sinh xem kết quả của nhau | **Chấp nhận rủi ro ở giai đoạn đầu**. Có phương án giảm rủi ro ở mục 5.6 |
| 12 | Môn học và lớp | **Giữ đủ mọi môn, lớp 1–12**. Cấu trúc đề do giáo viên tùy chỉnh ở giao diện, có mẫu dựng sẵn |
| 13 | Cộng đồng công khai | **Bỏ**. Thay bằng **ngân hàng chung nội bộ có tác giả** giữa các giáo viên trong hệ thống (mục 8.4) |
| 14 | Nhóm 7 API key | **Giữ** (7 tài khoản Google khác nhau nên mỗi key có quota riêng). Bổ sung quản lý trạng thái trong DB |
| 15 | Lấy câu hỏi từ các trang học online | **Làm ở mức cá nhân, có kiểm soát**: giáo viên dán nội dung/URL cụ thể, chỉ lấy phần câu hỏi, câu gắn nhãn nguồn và **không được chia sẻ** (mục 15). **Không** làm crawler quét cả website |
| 16 | Nơi chạy | Chưa chốt. Khuyến nghị và điều kiện ở mục 12.0. Code viết theo kiểu **không giữ trạng thái trong bộ nhớ** để chạy được cả Vercel lẫn VPS |
| 17 | Tải khi học sinh vào làm | Nhỏ, không cần hạ tầng đặc biệt (mục 5.8). Thử tải 100 người ảo trước khi dùng thật |
| 18 | Bảng xếp hạng | Tùy chọn mỗi bài giao: **top vài người + vị trí của chính học sinh** (mục 5.9). Mặc định tắt |
| 19 | Ngân hàng câu hỏi | Lưu theo **tác giả**; giáo viên khác có thể xem và **chọn câu để thêm vào đề của mình** (tạo bản sao có ghi nguồn) (mục 8.4) |
| 20 | File `.docx` ý tưởng gốc trong repo | Tạm thời giữ (đưa vào `docs/`), xóa sau |
| 21 | Các đề xuất còn lại trong bản phân tích trước | Chấp nhận toàn bộ, đưa vào tài liệu này |

### Trả lời các câu hỏi bạn đã đặt

- **"Học sinh chỉ điền tên, làm kiểu bài tập về nhà, trên lớp hoặc phòng thi, đúng không?"** Đúng. Làm bằng một mô hình duy nhất (Assignment) với các tùy chọn: thời gian mở/đóng, số lần làm, đồng hồ, cách hiện kết quả. Ba "kiểu" chỉ là ba bộ cài đặt mặc định.
- **"Admin chỉnh hạn?"** Không. **Giáo viên** chỉnh hạn của bài mình giao. Admin cấp tài khoản, khóa tài khoản, đặt giới hạn dùng AI, xem nhật ký.
- **"Lịch sử thi lưu vào tên học sinh, giáo viên xem và xóa?"** Đúng. Mỗi lượt làm là một `Attempt` gắn với `Student`. Giáo viên xem, xóa từng lượt hoặc xóa cả học sinh.
- **"Học sinh vào link, bấm chọn tên để xem?"** Làm được. Giáo viên tạo sẵn danh sách học sinh của lớp, học sinh chọn tên mình trong danh sách. Cách này tránh gõ sai và trùng tên (mục 5.3).
- **"Xoay 7 key"**: bạn đúng. Tôi đã nhầm khi giả định các key thuộc cùng một project. Với 7 tài khoản độc lập thì quota cộng dồn thật. Chi tiết và một lưu ý nhỏ ở mục 7.2.
- **Lấy câu hỏi từ trang học online, chỉ câu hỏi, dùng cá nhân:** làm được ở mức có kiểm soát (mục 15). Dùng cá nhân làm rủi ro thấp hơn nhưng không làm vấn đề bản quyền và điều khoản của trang biến mất. Vì vậy các câu này được gắn nhãn nguồn, bị khóa không cho chia sẻ, và dễ xóa hàng loạt nếu sau này bạn chuyển sang dùng kinh doanh.
- **"Sao không dùng Vercel?"** Dùng được, nhưng có 3 điều kiện cần cân nhắc (gói miễn phí chỉ cho mục đích phi thương mại, giới hạn thời gian chạy của hàm, không giữ được trạng thái trong bộ nhớ). Chi tiết ở mục 12.0.
- **"Học sinh có vào cùng lúc hàng trăm người không?"** Không. Lớp học thêm chỉ vài đến vài chục em, bài về nhà thì rải theo thời gian. Tải thực tế rất nhẹ (mục 5.8).
- **"Lưu câu hỏi theo tác giả rồi chọn câu của nhau?"** Được. Mục 8.4.
- **"Xếp hạng chỉ hiện vài người top và vị trí của mình?"** Được. Mục 5.9.

---

## 2. HIỆN TRẠNG: ĐIỂM SAI, THIẾU, MÂU THUẪN CẦN SỬA

### 2.1. Mâu thuẫn giữa README và tài liệu kế hoạch

| README nói | Kế hoạch cũ nói | Xử lý ở v3 |
|---|---|---|
| Có phòng thi online, bảng điểm real-time, lưu "Cloud File Storage" | Offline-first, không server, IndexedDB | Chuyển hẳn sang server + PostgreSQL |
| Chia sẻ đề `/share/[id]` kèm "Tạo bản sao để sửa" | Hoãn mọi thứ cộng đồng | Giữ chia sẻ dạng link xem/tải, có thể thu hồi. Nút "tạo bản sao" chỉ dành cho giáo viên đã đăng nhập |
| Phần III: 0,5đ/câu | Lý/Hóa/Sinh có cấu trúc 18/4/6 với điểm mỗi câu khác Toán | Điểm lấy từ cấu hình từng phần của đề, không hard-code |
| "Trộn 4 mã đề" cố định | "4 đến 8 mã đề" | Số mã đề cấu hình được (1–10) |
| Xoay 7 API key như tính năng | Cho rằng không tăng quota | Giữ, nêu rõ điều kiện: mỗi key thuộc project/tài khoản riêng |
| Giấy phép MIT | Repo không có file `LICENSE` | Thêm file `LICENSE` |

### 2.2. Trạng thái dự án ghi chưa chính xác

- Checklist đánh dấu Giai đoạn 0–4 "hoàn thành 100%", trong khi sơ đồ Gantt ghi Giai đoạn 1 "đang làm" và Giai đoạn 5 (kiểm thử trên đề thật) chưa làm gì.
- Từ nay quy ước: **"Có code" ≠ "Hoàn thành"**. Một tính năng chỉ được đánh dấu xong khi qua tiêu chí nghiệm thu ở mục 16.

### 2.3. Cam kết kỹ thuật cần điều chỉnh

1. **"Preview A4 = In = Word trùng khớp 100%"** không thực hiện được, vì Word có engine dàn trang riêng và kết quả phụ thuộc font, máy. Đổi cam kết thành: "Không cắt đôi một câu hỏi giữa hai trang; hình dạng gần với bản Word". Checklist cũ ghi xong "A4 Physical Pagination Engine" nhưng phần mô tả chỉ là CSS `page-break-inside: avoid` **[CẦN KIỂM TRA]**.
2. **"Dual-solve" không phải xác minh độc lập.** Hai lần giải bởi cùng một mô hình có thể sai cùng kiểu. Bỏ con số "tự động hóa 90%". Với Toán, kiểm bằng công cụ tính toán thật. Đổi nhãn "đã xác minh" thành "AI đồng thuận" (mục 7.4).
3. **Chuyển LaTeX sang Word bằng regex (`cleanLatexForWord`)** dễ gãy với ma trận, hệ phương trình, tích phân có cận. Cần bộ công thức mẫu và kiểm thử trực quan (mục 9.2).
4. **"Bảo toàn 100% hình vẽ"** quá mạnh khi `figures[].kind = 'geometry'` mới chỉ có trong schema. Sửa lời hứa trong README.
5. **Tên mô hình** ("Gemini 2.5 Flash / 1.5 Pro") dễ lỗi thời. Đặt hoàn toàn trong biến môi trường, không ghi cứng trong tài liệu hay code.
6. **Giờ reset quota ngày**: tài liệu cũ ghi "00:00 UTC". Theo tài liệu của Google, hạn mức ngày thường reset vào nửa đêm giờ Thái Bình Dương. **[CẦN KIỂM TRA lại với tài liệu Google hiện hành]**.
7. **Thông tư 17/2025/TT-BGDĐT** trong README: **[CẦN KIỂM TRA]** số hiệu và nội dung trước khi giữ lại.
8. **Cấu trúc đề từng môn** (số câu, thời gian): **[CẦN KIỂM TRA]** lại với văn bản chính thức hiện hành của Bộ GD&ĐT trước khi đưa vào mẫu đề dựng sẵn.

### 2.4. Nguồn dữ liệu gợi ý sai

- `bkai-foundation-models/vietnamese-bi-encoder` là **mô hình embedding**, không phải bộ dữ liệu câu hỏi VMLU như tài liệu cũ ghi. Tìm VMLU từ nguồn chính thức của nó.

### 2.5. Phần thiếu so với một hệ thống nhiều người dùng

Chưa có: tài khoản, phân quyền, nhật ký thao tác, giới hạn dùng AI theo người, sao lưu server, kiểm thử tích hợp, CI, chống lạm dụng API, chấm bài phía server. Các phần này được thiết kế ở các mục sau.

### 2.6. Việc phải kiểm tra trong code hiện có **[CẦN KIỂM TRA]**

- Route `/test/[id]` hiện có gửi đáp án đúng xuống trình duyệt học sinh không?
- Đồng hồ đếm ngược có chạy hoàn toàn ở client không?
- Thư mục `data/` chứa gì? Nếu server ghi file JSON vào đó thì sẽ mất khi redeploy container.
- Có chỗ nào dùng `dangerouslySetInnerHTML` hoặc `rehype-raw`? KaTeX có `trust: false` không?
- Xuất CSV có chống "CSV injection" không (ô bắt đầu bằng `=`, `+`, `-`, `@`)?
- Các API route gọi Gemini có giới hạn tần suất và kiểm tra đăng nhập không?

---

## 3. KIẾN TRÚC MỤC TIÊU

```
Trình duyệt (giáo viên / admin / học sinh)
        │  HTTPS
        ▼
Reverse proxy (Caddy hoặc Nginx, chứng chỉ tự động)
        │
        ▼
Container "app": Next.js (App Router, TypeScript)
   ├─ Giao diện giáo viên, admin, trang học sinh
   ├─ Route Handlers / Server Actions (auth, đề, bài giao, chấm bài)
   ├─ Module AI: hàng đợi + nhóm API key + Zod validate
   └─ Module xuất Word / PDF
        │ Prisma
        ▼
Container "db": PostgreSQL (volume bền vững)
        │
        └─ Container "backup": pg_dump định kỳ ra thư mục/ổ lưu trữ ngoài
```

Nguyên tắc:
- **Server là nguồn sự thật duy nhất.** Chấm điểm, đồng hồ, kiểm tra quyền đều làm ở server.
- **Câu hỏi là đối tượng nguyên tử** (một bản ghi `Question` riêng), đề thi chỉ tham chiếu đến câu hỏi.
- **Bài giao chứa bản chụp (snapshot) của đề** tại thời điểm giao. Sửa câu hỏi về sau không làm đổi bài đã giao hay điểm đã chấm.
- **Cấu hình môn học và mẫu đề** nằm ở dữ liệu (file JSON được seed vào DB), không hard-code trong code.
- Giữ một ứng dụng duy nhất (monolith). Không tách microservices.
- **Ứng dụng không giữ trạng thái trong bộ nhớ (stateless):** trạng thái nhóm API key, hàng đợi AI, số lần làm bài đều nằm trong DB. File ghi ra đĩa chỉ là tạm. Nhờ vậy chạy trên VPS, container hay Vercel đều được (mục 12.0).

---

## 4. VAI TRÒ VÀ TÀI KHOẢN

### 4.1. Vai trò

| Vai trò | Quyền |
|---|---|
| `SUPER_ADMIN` | Tạo, khóa, đặt lại mật khẩu tài khoản giáo viên. Đặt hạn mức dùng AI mỗi người. Xem nhật ký thao tác, mức dùng AI, trạng thái nhóm key. Xóa nội dung vi phạm. Xem thống kê tổng, không cần xem bài làm học sinh |
| `TEACHER` | Toàn quyền với dữ liệu **của mình**: ngân hàng câu hỏi, đề, lớp, học sinh, bài giao, kết quả. Không thấy dữ liệu của giáo viên khác |
| Học sinh | Không phải vai trò trong hệ thống. Truy cập qua link công khai có mã (mục 5) |

### 4.2. Quy tắc tài khoản

- Không có trang đăng ký công khai. Admin tạo giáo viên bằng email và mật khẩu tạm; giáo viên **bắt buộc đổi mật khẩu ở lần đăng nhập đầu** (`mustChangePassword`).
- Super-admin đầu tiên được tạo bằng script seed từ biến môi trường (`ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`), rồi buộc đổi mật khẩu.
- Mật khẩu băm bằng **argon2id** (hoặc bcrypt với cost phù hợp). Không lưu mật khẩu thô ở bất kỳ đâu.
- Giới hạn số lần đăng nhập sai theo email và IP, khóa tạm thời khi vượt ngưỡng.
- Có tài khoản `isActive = false` để khóa mà không xóa dữ liệu.
- Mọi hành động quản trị (tạo, khóa, đặt lại mật khẩu, xóa) ghi vào `AuditLog`.
- Thư viện đăng nhập: Auth.js (Credentials) hoặc cơ chế session tự viết gọn bằng bảng `Session`. Chọn một, không trộn.
- Kiểm tra quyền **ở server** cho mọi thao tác; không chỉ ẩn nút trên giao diện. Mọi truy vấn dữ liệu của giáo viên luôn kèm điều kiện `ownerId = người đang đăng nhập`.

---

## 5. HỆ THỐNG GIAO BÀI VÀ PHÒNG LÀM BÀI

### 5.1. Khái niệm

- **Group (Lớp)**: nhóm học sinh của một giáo viên, ví dụ "Toán 12 – tối T2/T4". Đây là lớp học thêm, chỉ để phân biệt học sinh, không liên quan lớp chính khóa.
- **Student (Học sinh)**: một bản ghi trong Group, chỉ có `displayName`. Không email, không số điện thoại, không ngày sinh.
- **Assignment (Bài giao)**: một đề được giao cho một Group (hoặc giao mở, không gắn Group), kèm cài đặt thời gian và hiển thị kết quả.
- **Attempt (Lượt làm bài)**: một lần một học sinh làm một bài giao.

### 5.2. Ba chế độ cài đặt sẵn

Đây chỉ là giá trị mặc định khi giáo viên tạo bài giao, mọi tùy chọn đều chỉnh được.

| Tùy chọn | Bài tập về nhà | Bài trên lớp | Phòng thi |
|---|---|---|---|
| Thời gian mở/đóng | Dài (vài ngày) | Giáo viên bấm Mở/Đóng | Theo giờ đặt trước hoặc bấm tay |
| Đồng hồ làm bài | Không | Tùy chọn | Có, server tính |
| Số lần làm | Nhiều | 1–2 | 1 |
| Trộn câu / trộn đáp án | Tùy chọn | Tùy chọn | Bật |
| Hiện kết quả | Ngay khi nộp | Ngay hoặc sau khi đóng | Sau khi đóng |
| Hiện lời giải | Ngay | Sau khi đóng | Sau khi đóng hoặc không |
| Tự lưu nháp | Có | Có | Có |

### 5.3. Cách học sinh xác định danh tính ("chế độ định danh")

Mỗi bài giao chọn một trong ba chế độ:

1. **`PICK_FROM_LIST` (mặc định, khuyến nghị):** giáo viên tạo sẵn danh sách học sinh của Group. Học sinh vào link, thấy danh sách tên, bấm vào tên mình. Tránh gõ sai, trùng tên, tên bậy.
2. **`FREE_NAME`:** học sinh tự gõ tên. Dùng cho buổi thử hoặc người ngoài lớp. Hệ thống tạo (hoặc gộp theo tên đã có) bản ghi `Student` trong Group, hoặc đánh dấu "khách" nếu bài không gắn Group.
3. **`PERSONAL_LINK`:** mỗi học sinh có link riêng chứa mã khó đoán. Giáo viên gửi từng link. Học sinh này không xem được kết quả học sinh khác. Đây là phương án giảm rủi ro khi cần.

### 5.4. Luồng học sinh

```
Link bài giao  /a/{publicId}   hoặc   Link lớp  /c/{groupCode}
   → (chọn tên | gõ tên | link riêng đã nhận diện sẵn)
   → [PIN nếu bật]
   → Trang giới thiệu bài: tiêu đề, thời gian còn lại, số lần đã làm
   → Bắt đầu: server tạo Attempt, ghi startedAt, tính deadlineAt
   → Làm bài: tự lưu nháp định kỳ (mỗi vài giây hoặc khi đổi câu)
   → Nộp: server chấm, trả kết quả theo chính sách hiển thị
   → Xem lịch sử của chính mình (theo tên đã chọn)
```

- Trang lớp `/c/{groupCode}` liệt kê các bài đang mở của lớp đó; học sinh chọn tên một lần, thấy bài cần làm và lịch sử của mình.
- Khi chưa được phép xem kết quả (ví dụ chế độ thi, chưa đóng bài), chỉ hiện "Đã nộp bài lúc …".

### 5.5. Luồng giáo viên

- Tạo Group, thêm học sinh (nhập danh sách nhiều dòng một lần).
- Chọn đề, bấm **Giao bài**: chọn Group, chế độ, thời gian, tùy chọn. Hệ thống tạo snapshot đề và sinh link + mã.
- Màn hình theo dõi: ai đã vào, ai đã nộp, ai chưa làm, điểm, thời gian làm. Cập nhật bằng polling vài giây một lần là đủ ở quy mô này, chưa cần WebSocket.
- Xem chi tiết bài của từng học sinh: đáp án đã chọn, đúng/sai từng câu.
- Chấm tay câu tự luận (nếu có), nhập điểm và nhận xét.
- Xóa lượt làm, xóa học sinh, xuất bảng điểm CSV (có chống CSV injection).
- Thống kê theo câu: tỷ lệ đúng từng câu, phổ điểm, điểm trung bình, câu nhiều học sinh sai.
- Có nút **Mở lại / Gia hạn / Đóng sớm** cho từng bài giao, và cho phép cấp thêm một lượt làm cho một học sinh cụ thể.

### 5.6. Rủi ro đã chấp nhận và cách giảm dần

Chấp nhận ở giai đoạn đầu: ở chế độ `PICK_FROM_LIST`, học sinh này có thể bấm tên học sinh khác và xem kết quả của bạn đó.

Các mức giảm rủi ro, làm khi cần (không cần ngay):
1. Dùng `PERSONAL_LINK` cho bài quan trọng.
2. **PIN 4 chữ số** do giáo viên đặt cho từng học sinh (lưu băm), nhập khi chọn tên.
3. Trang chọn tên chỉ hiện tên, **không hiện điểm** của bất kỳ ai trước khi chọn.
4. Về sau: tài khoản học sinh (đã ghi vào danh sách phát triển, mục 17).

### 5.7. Quy tắc chấm điểm (server)

- Bản snapshot của bài giao chứa đáp án; **API trả cho học sinh phải loại bỏ đáp án và lời giải** cho đến khi chính sách hiển thị cho phép.
- **Trắc nghiệm 4 lựa chọn:** đúng được `pointsPerQuestion` của phần đó.
- **Đúng/Sai nhiều ý:** chấm lũy tiến theo số ý đúng, bảng điểm nằm trong cấu hình phần (ví dụ cấu trúc hiện hành của Toán: 0 / 0,1 / 0,25 / 0,5 / 1,0).
- **Trả lời ngắn / điền số:** chuẩn hóa đầu vào (bỏ khoảng trắng, đổi dấu phẩy thành dấu chấm thập phân, so khớp `accepted_answers`). Với số thực có thể có dung sai cấu hình được.
- **Tự luận:** trạng thái "Chờ chấm", giáo viên nhập điểm theo `rubric`.
- Điểm tối đa và điểm từng phần lấy từ cấu hình trong snapshot, không dùng hằng số cố định.
- Đồng hồ: `deadlineAt = startedAt + duration` (và không vượt `closesAt` của bài giao). Server từ chối hoặc đánh dấu quá hạn với bài nộp trễ, có dung sai vài giây cho độ trễ mạng.
- Nộp trùng (bấm hai lần, hai tab) phải **idempotent**: lượt đã nộp không bị nộp lại.
- Chống trùng lượt: kiểm tra số lần làm tối đa bằng ràng buộc trong DB hoặc khóa giao dịch.

### 5.8. Tải thực tế: không có "hàng trăm học sinh vào cùng lúc"

Cách "một link cho cả lớp" (giống một file Sheet chia sẻ) chính là thiết kế hiện tại: mỗi bài giao có một link, mỗi lớp có một link lớp. Về tải:

- **Lớp học thêm:** thường 5–40 học sinh. Ngay cả khi 100 em cùng làm, lưu nháp mỗi 10–15 giây (có độ lệch ngẫu nhiên) chỉ khoảng 7–10 yêu cầu mỗi giây, mỗi yêu cầu là một lệnh cập nhật nhỏ. PostgreSQL và một ứng dụng cấu hình nhỏ xử lý được.
- **Bài về nhà:** học sinh vào rải rác nhiều giờ hoặc nhiều ngày, gần như không đồng thời. Chỉ hơi dồn lại gần hạn nộp.
- **Hai thời điểm dồn:** (a) cả lớp bấm "Bắt đầu" cùng lúc, (b) hết giờ và cả lớp nộp cùng lúc. Chấm bài chỉ là tính toán nhẹ trên vài chục câu nên làm ngay trong yêu cầu nộp bài, không cần hàng đợi riêng.
- **Phần nặng thật sự là AI** (chậm, giới hạn quota), không phải học sinh. Vì vậy **học sinh không bao giờ đi qua đường AI**.
- Biện pháp giữ nhẹ: lưu nháp có độ lệch ngẫu nhiên và chỉ gửi phần thay đổi; nộp bài idempotent; giới hạn tần suất theo IP và theo lượt làm; đọc bản snapshot của đề từ bộ nhớ đệm; đánh chỉ mục đúng; ảnh trong đề nén gọn.
- Chưa cần WebSocket. Màn hình theo dõi của giáo viên dùng polling vài giây một lần là đủ.
- **Cách kiểm chứng:** thử tải với 100 người dùng ảo (ví dụ k6) trước khi dùng thật (mục 16).

### 5.9. Bảng xếp hạng: top vài người và vị trí của mình

Tùy chọn cho từng bài giao, **mặc định tắt**.

| Tùy chọn | Ý nghĩa |
|---|---|
| `leaderboard` | `OFF` hoặc `TOP_AND_ME` |
| `leaderboardTopN` | Số người đứng đầu hiển thị (mặc định 3, tối đa 10) |
| `leaderboardReveal` | Hiện ngay sau khi nộp hoặc chỉ sau khi đóng bài |
| `leaderboardAnonymous` | Hiện tên đầy đủ hoặc rút gọn/ẩn tên những người top |

Học sinh thấy:
- Danh sách top N (tên + điểm).
- Dòng riêng "Bạn đứng thứ X trên Y bạn đã nộp" kèm điểm của mình.
- **Không** thấy danh sách đầy đủ và điểm của những người ngoài top. Giáo viên xem bảng đầy đủ ở màn hình giáo viên.

Quy tắc xếp hạng:
- Mỗi học sinh tính theo **điểm cao nhất** trong các lượt đã nộp.
- Hòa điểm: mặc định **cùng hạng** (1, 2, 2, 4). Có thể cấu hình thêm cách phân xử bằng thời gian làm ngắn hơn.
- Chỉ xếp hạng lượt đã nộp và đã chấm xong. Bài còn câu tự luận chờ chấm thì hiển thị "chờ chấm" thay vì xếp hạng.
- Chỉ so sánh trong cùng một bài giao.
- Gợi ý mặc định: bài về nhà tắt, bài trên lớp tùy chọn, phòng thi tắt hoặc chỉ hiện sau khi đóng bài.
- Tính khi đọc và lưu đệm ngắn. API chỉ trả `{ top: [...], me: { rank, score, total } }`.

---

## 6. THIẾT KẾ CƠ SỞ DỮ LIỆU (PRISMA SCHEMA)

Đây là bản thiết kế khởi đầu, điều chỉnh khi triển khai. **Kiểm tra cú pháp theo phiên bản Prisma hiện hành** (ví dụ cách khai báo `datasource` có thể khác giữa các phiên bản).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ───────────── ENUMS ─────────────

enum Role {
  SUPER_ADMIN
  TEACHER
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE_GROUP
  SHORT_ANSWER
  ESSAY
  FILL_BLANK
  MATCHING
  ORDERING
}

enum Difficulty {
  NHAN_BIET
  THONG_HIEU
  VAN_DUNG
  VAN_DUNG_CAO
}

enum QuestionStatus {
  DRAFT
  VERIFIED
}

enum VerifiedBy {
  NONE
  HUMAN
  AI_CONSENSUS
  MATH_ENGINE
}

enum AssignmentMode {
  HOMEWORK
  CLASSWORK
  EXAM
}

enum AssignmentStatus {
  DRAFT
  OPEN
  CLOSED
  ARCHIVED
}

enum IdentityMode {
  PICK_FROM_LIST
  FREE_NAME
  PERSONAL_LINK
}

enum RevealPolicy {
  IMMEDIATE
  AFTER_CLOSE
  NEVER
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  EXPIRED
}

enum AiKeyStatus {
  ACTIVE
  COOLDOWN
  DEAD
}

enum LeaderboardMode {
  OFF
  TOP_AND_ME
}

enum Visibility {
  PRIVATE   // chỉ chủ sở hữu thấy
  SHARED    // mọi giáo viên trong hệ thống thấy (chỉ đọc)
}

enum SourceKind {
  AI_GENERATED
  TEACHER_WRITTEN
  IMPORTED_FILE
  IMPORTED_WEB
  LICENSED_DATASET
  FORKED
}

// ───────────── NGƯỜI DÙNG ─────────────

model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  name               String
  passwordHash       String
  role               Role      @default(TEACHER)
  isActive           Boolean   @default(true)
  mustChangePassword Boolean   @default(true)
  aiDailyLimit       Int       @default(100)   // số lệnh AI tối đa mỗi ngày
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  lastLoginAt        DateTime?

  questions   Question[] @relation("QuestionOwner")
  authoredQuestions Question[] @relation("QuestionAuthor")
  passages    Passage[]
  exams       Exam[]
  templates   ExamTemplate[]
  groups      Group[]
  assignments Assignment[]
  aiUsage     AiUsageLog[]
  auditLogs   AuditLog[]
}

// Bảng Session/Account: tùy thư viện đăng nhập (Auth.js có adapter Prisma riêng).
// Nếu dùng JWT session thì không cần thêm bảng.

// ───────────── NGÂN HÀNG CÂU HỎI ─────────────

model Passage {
  id        String   @id @default(cuid())
  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id])
  title     String?
  content   String   @db.Text
  source    String?
  figures   Json?
  createdAt DateTime @default(now())

  questions Question[]

  @@index([ownerId])
}

model Question {
  id         String         @id @default(cuid())
  ownerId    String         // người đang giữ bản này
  owner      User           @relation("QuestionOwner", fields: [ownerId], references: [id])
  authorId   String         // tác giả gốc (không đổi khi sao chép)
  author     User           @relation("QuestionAuthor", fields: [authorId], references: [id])
  originId   String?        // nếu là bản sao: trỏ tới câu gốc
  origin     Question?      @relation("QuestionOrigin", fields: [originId], references: [id], onDelete: SetNull)
  copies     Question[]     @relation("QuestionOrigin")
  visibility Visibility     @default(PRIVATE)
  sourceKind SourceKind     @default(TEACHER_WRITTEN)
  sourceUrl  String?        // dùng cho IMPORTED_WEB
  shareable  Boolean        @default(true)  // false với IMPORTED_WEB hoặc giấy phép cấm
  subject    String         // mã môn, kiểm tra theo cấu hình (toan, vat_ly, ...)
  grade      Int            // 1..12
  type       QuestionType
  difficulty Difficulty
  topics     String[]
  tags       String[]
  passageId  String?
  passage    Passage?       @relation(fields: [passageId], references: [id])

  content    String         @db.Text            // nội dung kèm LaTeX
  figures    Json?                              // figures[]: bảng biến thiên, đồ thị, ảnh
  payload    Json                               // choices, correct, sub_questions, accepted_answers, rubric
  solution   String         @db.Text            // lời giải, không nhắc chữ cái A/B/C/D
  points     Decimal?       @db.Decimal(5, 2)

  status     QuestionStatus @default(DRAFT)
  verifiedBy VerifiedBy     @default(NONE)
  aiGenerated Boolean       @default(false)
  source     String?
  licenseNote String?
  version    Int            @default(1)
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
  deletedAt  DateTime?      // xóa mềm

  revisions  QuestionRevision[]
  examItems  ExamQuestion[]

  @@index([ownerId, subject, grade])
  @@index([ownerId, type, difficulty])
  @@index([visibility, subject, grade])
  @@index([authorId])
}

model QuestionRevision {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  version    Int
  snapshot   Json
  note       String?
  createdAt  DateTime @default(now())

  @@unique([questionId, version])
}

// ───────────── ĐỀ THI ─────────────

model ExamTemplate {
  id        String   @id @default(cuid())
  ownerId   String?  // null = mẫu hệ thống
  owner     User?    @relation(fields: [ownerId], references: [id])
  name      String
  subject   String
  gradeFrom Int
  gradeTo   Int
  sections  Json     // danh sách phần: type, questionCount, pointsPerQuestion, scoring...
  isSystem  Boolean  @default(false)
  createdAt DateTime @default(now())

  exams Exam[]
}

model Exam {
  id              String        @id @default(cuid())
  ownerId         String
  owner           User          @relation(fields: [ownerId], references: [id])
  templateId      String?
  template        ExamTemplate? @relation(fields: [templateId], references: [id])
  title           String
  subject         String
  grade           Int
  durationMinutes Int?
  metadata        Json          // trường, sở, năm học, học kỳ, ghi chú
  sections        Json          // bản sao cấu trúc phần đang dùng cho đề này
  variantCount    Int           @default(1)
  version         Int           @default(1)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  items       ExamQuestion[]
  assignments Assignment[]
  shareLinks  ShareLink[]

  @@index([ownerId, updatedAt])
}

model ExamQuestion {
  id             String   @id @default(cuid())
  examId         String
  exam           Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  questionId     String
  question       Question @relation(fields: [questionId], references: [id])
  sectionId      String   // khớp id phần trong Exam.sections
  position       Int
  pointsOverride Decimal? @db.Decimal(5, 2)

  @@unique([examId, position])
  @@index([questionId])
}

model ShareLink {
  id          String    @id @default(cuid())
  examId      String
  exam        Exam      @relation(fields: [examId], references: [id], onDelete: Cascade)
  token       String    @unique   // chuỗi ngẫu nhiên dài, không đoán được
  showAnswers Boolean   @default(false)
  allowCopy   Boolean   @default(false) // chỉ giáo viên đã đăng nhập mới dùng được
  expiresAt   DateTime?
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())
}

// ───────────── LỚP VÀ HỌC SINH ─────────────

model Group {
  id         String    @id @default(cuid())
  ownerId    String
  owner      User      @relation(fields: [ownerId], references: [id])
  name       String
  note       String?
  publicCode String    @unique   // mã cho link lớp /c/{publicCode}
  createdAt  DateTime  @default(now())
  archivedAt DateTime?

  students    Student[]
  assignments Assignment[]

  @@unique([ownerId, name])
}

model Student {
  id            String    @id @default(cuid())
  groupId       String
  group         Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  displayName   String
  personalToken String?   @unique   // dùng cho chế độ PERSONAL_LINK
  pinHash       String?             // tùy chọn, PIN 4 số (lưu băm)
  isGuest       Boolean   @default(false)
  createdAt     DateTime  @default(now())
  archivedAt    DateTime?

  attempts Attempt[]

  @@unique([groupId, displayName])
}

// ───────────── BÀI GIAO VÀ LƯỢT LÀM ─────────────

model Assignment {
  id            String           @id @default(cuid())
  ownerId       String
  owner         User             @relation(fields: [ownerId], references: [id])
  examId        String
  exam          Exam             @relation(fields: [examId], references: [id])
  groupId       String?
  group         Group?           @relation(fields: [groupId], references: [id])

  title         String
  mode          AssignmentMode
  status        AssignmentStatus @default(DRAFT)
  identityMode  IdentityMode     @default(PICK_FROM_LIST)
  publicId      String           @unique  // trong link /a/{publicId}
  joinCode      String?                    // mã ngắn đọc cho cả lớp, tùy chọn

  snapshot      Json             // đề + đáp án + cấu trúc phần tại thời điểm giao (BẤT BIẾN)
  opensAt       DateTime?
  closesAt      DateTime?
  durationMinutes Int?
  maxAttempts   Int              @default(1)
  shuffleQuestions Boolean       @default(false)
  shuffleChoices   Boolean       @default(false)
  showResult    RevealPolicy     @default(IMMEDIATE)
  showSolution  RevealPolicy     @default(AFTER_CLOSE)
  requirePin    Boolean          @default(false)
  leaderboard         LeaderboardMode @default(OFF)
  leaderboardTopN     Int             @default(3)
  leaderboardReveal   RevealPolicy    @default(IMMEDIATE)
  leaderboardAnonymous Boolean        @default(false)

  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  attempts Attempt[]

  @@index([ownerId, status])
  @@index([groupId])
}

model Attempt {
  id           String        @id @default(cuid())
  assignmentId String
  assignment   Assignment    @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  studentId    String
  student      Student       @relation(fields: [studentId], references: [id], onDelete: Cascade)
  attemptNo    Int
  status       AttemptStatus @default(IN_PROGRESS)
  startedAt    DateTime      @default(now())
  deadlineAt   DateTime?     // server tính
  submittedAt  DateTime?
  variantSeed  Int           // seed trộn câu/đáp án riêng cho lượt này
  layout       Json          // thứ tự câu và hoán vị đáp án đã dùng
  draft        Json?         // đáp án nháp khi đang làm
  score        Decimal?      @db.Decimal(6, 2)
  maxScore     Decimal?      @db.Decimal(6, 2)
  needsGrading Boolean       @default(false)

  answers AttemptAnswer[]

  @@unique([assignmentId, studentId, attemptNo])
  @@index([assignmentId, status])
}

model AttemptAnswer {
  id          String   @id @default(cuid())
  attemptId   String
  attempt     Attempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionKey String   // id câu trong snapshot
  response    Json
  isCorrect   Boolean?
  earned      Decimal? @db.Decimal(5, 2)
  manualScore Decimal? @db.Decimal(5, 2)
  comment     String?

  @@unique([attemptId, questionKey])
}

// ───────────── AI, NHẬT KÝ ─────────────

model AiKeyState {
  alias         String      @id       // ví dụ "key1" (KHÔNG lưu giá trị key)
  status        AiKeyStatus @default(ACTIVE)
  cooldownUntil DateTime?
  dailyCount    Int         @default(0)
  dailyResetAt  DateTime?
  lastUsedAt    DateTime?
  lastError     String?
}

model AiUsageLog {
  id               String   @id @default(cuid())
  userId           String?
  user             User?    @relation(fields: [userId], references: [id])
  keyAlias         String?
  endpoint         String
  model            String?
  promptTokens     Int?
  completionTokens Int?
  httpStatus       Int?
  latencyMs        Int?
  createdAt        DateTime @default(now())

  @@index([userId, createdAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  actor      User?    @relation(fields: [actorId], references: [id])
  action     String   // user.create, user.disable, attempt.delete, ...
  targetType String?
  targetId   String?
  meta       Json?
  ip         String?
  createdAt  DateTime @default(now())

  @@index([actorId, createdAt])
}
```

Ghi chú thiết kế:
- **`Assignment.snapshot`** là chìa khóa: điểm và chi tiết bài làm luôn đối chiếu với bản đề đã giao, không bị ảnh hưởng khi giáo viên sửa câu hỏi trong ngân hàng sau đó.
- `payload` của `Question` là JSON có cấu trúc theo `type`, được kiểm bằng Zod ở tầng ứng dụng (DB không ép được cấu trúc bên trong JSON).
- Xóa mềm (`deletedAt`) cho câu hỏi và đề; xóa thật (có xác nhận) cho học sinh và lượt làm theo yêu cầu giáo viên.
- Seed ban đầu: super-admin, các `ExamTemplate` hệ thống, danh sách môn.
- Cân nhắc thêm `Setting`/`HeaderTemplate` cho mẫu tiêu đề trường nếu muốn lưu nhiều mẫu mỗi giáo viên.
- Cân nhắc tự dọn dữ liệu: tùy chọn "tự xóa lượt làm cũ hơn N tháng".

### 6.1. Chuyển từ dữ liệu cũ (IndexedDB) sang DB

- Giữ một **trang "Nhập từ bản cũ"** dùng một lần: đọc file JSON sao lưu của bản local (chức năng export hiện có), kiểm bằng Zod, rồi nhập vào DB dưới tên giáo viên đang đăng nhập.
- Sau khi bản mới ổn định, **gỡ Dexie** và mã di chuyển localStorage khỏi code.
- Trình duyệt chỉ còn giữ: phiên đăng nhập, và (tùy chọn) bản nháp đang soạn chưa lưu để phòng mất mạng.

---

## 7. XỬ LÝ AI

### 7.1. Nguyên tắc chung

- Mọi lệnh AI đi qua **hàng đợi phía server**, giới hạn số yêu cầu đồng thời.
- Đầu ra của AI luôn ép theo JSON schema (`responseSchema`) rồi **kiểm bằng Zod**. Không dùng fallback "đáp án mặc định A" ở bất kỳ route nào.
- **Không gửi tên hay dữ liệu học sinh cho AI.** AI chỉ nhận nội dung đề và yêu cầu của giáo viên.
- Tên mô hình lấy từ biến môi trường (`GEMINI_MODEL`, có thể tách riêng model cho sinh đề, OCR, thẩm định).
- Mọi câu do AI tạo vào DB với `status = DRAFT`, `aiGenerated = true`.

### 7.2. Nhóm 7 API key (giữ nguyên, bổ sung quản lý)

Bạn đang dùng 7 tài khoản Google khác nhau, nên mỗi key có hạn mức riêng và việc xoay vòng là có ý nghĩa.

Cách làm:
- Key đặt trong biến môi trường (`GEMINI_API_KEY_1..7`), hoặc Docker secrets. **Không lưu giá trị key vào DB, không commit, không in ra log.** DB chỉ lưu trạng thái theo `alias`.
- Chọn key theo kiểu "ít dùng gần đây nhất", mỗi key tối đa 1–2 yêu cầu đồng thời.
- Bảng xử lý mã lỗi:

| Phản hồi | Hành động |
|---|---|
| 200 | Kiểm Zod, ghi `AiUsageLog` |
| 400 | Báo lỗi ngay, không thử lại |
| 401/403 | Đánh dấu key `DEAD`, chuyển key khác, báo admin |
| 404 | Lỗi tên model: báo admin kiểm `GEMINI_MODEL` |
| 429 hết lượt theo phút | Key vào `COOLDOWN` ngắn, chuyển key khác; backoff có jitter |
| 429 hết hạn mức ngày | Key vào `COOLDOWN` đến thời điểm reset (**kiểm lại giờ reset theo tài liệu Google**) |
| 5xx / timeout | Thử lại tối đa 2 lần với exponential backoff + jitter, ưu tiên key khác |

- Nếu cả 7 key đều bận hoặc hết hạn mức: trả thông báo rõ ràng "Hệ thống AI đang quá tải, thử lại sau", không mất nội dung giáo viên đang soạn, có nút thử lại.
- **Hạn mức theo giáo viên** (`User.aiDailyLimit`) để một người không làm cạn cả nhóm key. Admin chỉnh được.
- Trang admin hiển thị trạng thái từng key (ACTIVE / COOLDOWN / DEAD), số lệnh trong ngày, lỗi gần nhất.
- **Hai lưu ý:**
  1. Điều khoản của Google về việc dùng nhiều tài khoản để vượt hạn mức có thể thay đổi; bạn nên tự đọc và cân nhắc rủi ro bị khóa key.
  2. Gói miễn phí của Google AI Studio có thể dùng dữ liệu để cải thiện mô hình. Vì vậy đừng đưa đề thi mật hay dữ liệu cá nhân vào. Hiển thị cảnh báo này trên giao diện, không chỉ trong tài liệu.

### 7.3. Các tính năng AI

- Sinh đề theo yêu cầu (môn, lớp, chủ đề, tỷ lệ mức độ, cấu trúc phần).
- Sửa vi mô một câu (đổi số liệu, tăng/giảm độ khó, tạo câu tương tự, lệnh tự do) với **khung diff trước/sau, nút Chấp nhận / Giữ bản gốc, và lịch sử hoàn tác** (đã có `QuestionRevision` trong DB).
- Nhập đề từ ảnh (OCR), từ file Word, từ văn bản dán, từ LaTeX EX_Test, có màn hình duyệt 2 cột trước khi lưu.
- Thẩm định đáp án (mục 7.4).

### 7.4. Kiểm định đáp án: nói đúng mức độ tin cậy

| Nhóm môn | Cách kiểm | Nhãn hiển thị |
|---|---|---|
| Toán | Dùng công cụ tính (mathjs/SymPy) khi tính được, kết hợp AI giải lại | `MATH_ENGINE` nếu tính khớp, nếu không thì chỉ `AI_CONSENSUS` |
| Lý, Hóa | Kiểm đơn vị, bảo toàn, giá trị nằm trong các phương án; AI giải lại | `AI_CONSENSUS` |
| Sinh, Sử, Địa | Bắt buộc dựa trên ngữ liệu giáo viên cung cấp | Giáo viên duyệt |
| Văn, Ngoại ngữ | Barem chi tiết, AI hỗ trợ kiểm ngữ pháp | Giáo viên duyệt |

- Nhãn "AI đồng thuận" khác "đã xác minh". Chỉ `HUMAN` (giáo viên bấm Duyệt) hoặc `MATH_ENGINE` mới được coi là mức tin cậy cao.
- Giao diện hiển thị rõ mức tin cậy từng câu. **Không dùng màu xanh chung chung** cho trường hợp chỉ có AI đồng thuận.

---

## 8. SOẠN ĐỀ, MÔN HỌC, CẤU TRÚC ĐỀ

### 8.1. Mọi môn, lớp 1–12; giáo viên tự quyết cấu trúc

Bạn muốn hỗ trợ tất cả môn và lớp, với cấu trúc do giáo viên soạn. Thiết kế phù hợp:

- Danh sách môn, dạng câu hợp lệ theo môn và theo cấp học nằm trong **cấu hình** (seed vào DB, kiểm bằng Zod).
- **Trình dựng cấu trúc đề (Exam Builder)** ở giao diện: giáo viên thêm/bớt "phần", mỗi phần chọn dạng câu, số câu, điểm mỗi câu, cách chấm (với Đúng/Sai có bảng điểm lũy tiến). Tổng điểm hiển thị trực tiếp, cảnh báo nếu lệch thang.
- **Mẫu dựng sẵn** (`ExamTemplate` hệ thống) để bấm dùng ngay: cấu trúc 3 phần kiểu tốt nghiệp THPT cho các môn phù hợp, đề tự luận, đề tiểu học trắc nghiệm đơn giản... Giáo viên có thể lưu cấu trúc của mình thành mẫu riêng.
- **Các số liệu của mẫu hệ thống phải được đối chiếu với văn bản chính thức** trước khi phát hành (mục 2.3).
- Với cấp tiểu học và THCS, ưu tiên các dạng: trắc nghiệm đơn, điền số/từ, nối cột, sắp xếp, tự luận ngắn.
- Ngữ liệu đọc hiểu (`Passage`) dùng chung cho chùm câu hỏi (Văn, Tiếng Anh, Sử, Địa).

### 8.2. Mức độ sẵn sàng theo môn

Mở được tất cả môn ở giao diện, nhưng **hiển thị nhãn trạng thái kiểm thử** của từng môn (ví dụ "Đã kiểm thử đầy đủ", "Thử nghiệm") để giáo viên biết mức tin cậy. Thứ tự kiểm thử thực tế đề nghị: Toán THPT → Lý/Hóa/Sinh → Văn/Anh/Sử/Địa → Tiểu học và THCS.

### 8.3. Soạn đề ở giao diện

- Kiến trúc **khối câu hỏi (card) + xem trước A4 bên cạnh**, không dùng rich-text editor tổng quát cho toàn đề.
- Mỗi card: nội dung, đáp án, lời giải, mức độ, chuyên đề, trạng thái tin cậy, các nút AI, kéo thả sắp xếp.
- Trộn mã đề: thuật toán Fisher–Yates với seed (Mulberry32) để tái lập; ghim vị trí các phương án phụ thuộc ("Cả A và B"); sửa chữ cái nhắc đến trong lời giải sau khi đảo; sinh bảng ma trận đáp án đối soát.
- Ma trận và bản đặc tả theo công văn 7991: giữ tính năng đã có, **kiểm tra lại số hiệu văn bản và biểu mẫu** trước khi giữ làm tính năng chính thức.
- Lưu nháp tự động; lịch sử phiên bản đề; báo lỗi câu hỏi (giáo viên đánh dấu câu có vấn đề để sửa sau).

### 8.4. Ngân hàng câu hỏi chung có tác giả

Bạn muốn lưu câu hỏi theo tác giả và cho giáo viên khác chọn dùng. Thiết kế:

- Mỗi câu có **tác giả gốc** (`authorId`, không đổi) và **chủ sở hữu bản** (`ownerId`). Câu tự soạn thì hai người là một.
- Mức hiển thị: `PRIVATE` (mặc định, chỉ mình thấy) hoặc `SHARED` (mọi giáo viên trong hệ thống thấy, **chỉ đọc**). Không có "công khai ra internet".
- Trang **Ngân hàng chung**: lọc theo môn, lớp, dạng câu, độ khó, tác giả, mức tin cậy; xem trước; tích chọn nhiều câu rồi bấm **Thêm vào đề của tôi**.
- Khi chọn, hệ thống tạo **bản sao** cho giáo viên đó: `ownerId` là người chọn, `authorId` giữ tác giả gốc, `originId` trỏ về câu gốc, `sourceKind = FORKED`, `visibility = PRIVATE`.
  - Sửa bản sao không ảnh hưởng câu gốc.
  - Tác giả sửa hoặc xóa câu gốc không làm hỏng đề của người đã chọn (`onDelete: SetNull` cho `originId`).
- Tác giả thấy số lần câu mình được dùng (đếm số bản sao) và có thể **gỡ chia sẻ** bất cứ lúc nào (các bản sao đã tạo vẫn tồn tại).
- Ghi nguồn: ngân hàng hiển thị "Tác giả: …". Có tùy chọn in tên tác giả trên đề (mặc định ẩn).
- Câu `DRAFT` (AI sinh, chưa duyệt) luôn có nhãn rõ và có bộ lọc "chỉ lấy câu đã duyệt".
- **Không được chia sẻ:** câu `IMPORTED_WEB` (`shareable = false`) hoặc câu có `licenseNote` cấm. Giao diện khóa nút chia sẻ và giải thích lý do.
- Admin có thể ẩn câu vi phạm (ép về `PRIVATE`/xóa mềm) và việc này ghi vào `AuditLog`.
- Giai đoạn đầu **chưa** làm: thích, bình luận, xếp hạng câu hỏi, duyệt trước khi chia sẻ.

---

## 9. XUẤT WORD, IN ẤN, PHÂN TRANG

### 9.1. Mục tiêu thực tế

- Xem trước A4 trên màn hình, in từ trình duyệt, và xuất `.docx` cho kết quả **gần giống nhau, không cắt đôi một câu hỏi giữa hai trang**.
- Dùng font tương thích số đo với Times New Roman (Tinos hoặc Liberation Serif) cho phần xem trước để không lệch giữa các máy.
- Xem trước A4 luôn nền trắng, kể cả khi giao diện chung ở chế độ tối.

### 9.2. Công thức toán trong Word

- Xuất công thức dạng OMML (Office Math) để sửa được trong Word.
- Đường dẫn đề xuất để thử bên cạnh cách hiện tại: LaTeX → MathML (ví dụ temml) → OMML.
- Tạo **bộ công thức mẫu 50–100 mục** (phân số lồng, căn lồng, ma trận, hệ phương trình, tích phân có cận, giới hạn, tổng, vector, ký hiệu hóa học, hạt nhân) và kiểm tra tự động + kiểm tra bằng mắt khi thay đổi bộ chuyển đổi.
- Công thức không chuyển được: **chuyển thành ảnh** thay vì để lộ mã LaTeX thô.
- Kiểm thử mở file bằng Microsoft Word thật (Windows) trước mỗi phát hành.

### 9.3. Hình vẽ

- `figures[]` có cấu trúc: `variation_table`, `function_plot`, `image`; `geometry` đánh dấu là **chưa hỗ trợ** cho đến khi làm.
- Khi xuất Word: hình động được vẽ thành PNG độ phân giải cao rồi chèn.
- Không hứa "bảo toàn 100% hình" cho các loại hình chưa triển khai (hình học không gian, mạch điện, công thức cấu tạo hóa học).

### 9.4. Nội dung bản xuất

Tiêu đề trường/sở, bảng thông tin thí sinh, nội dung đề (1 hoặc 2 cột), bảng đáp án các mã đề, lời giải chi tiết (file riêng hoặc phần cuối), tùy chọn ma trận đặc tả.

---

## 10. BẢO MẬT

| Hạng mục | Yêu cầu |
|---|---|
| Phân quyền | Kiểm ở server cho mọi route; mọi truy vấn kèm `ownerId` |
| Mật khẩu | argon2id; chính sách độ dài tối thiểu; bắt đổi lần đầu |
| Đăng nhập | Giới hạn thử sai theo email + IP; cookie `HttpOnly`, `Secure`, `SameSite` |
| CSRF | Bật bảo vệ cho các thao tác ghi bằng cookie |
| Bí mật | `.env` không commit; API key và mật khẩu DB qua env hoặc Docker secrets; không log giá trị key |
| Đáp án | **Không bao giờ gửi đáp án/lời giải xuống học sinh** khi chưa được phép |
| Link công khai | `publicId`, `groupCode`, `token` sinh ngẫu nhiên đủ dài (ví dụ nanoid ≥ 16 ký tự); không dùng số tuần tự |
| XSS | Không dùng `dangerouslySetInnerHTML` với nội dung do người dùng/AI tạo; KaTeX `trust: false`; làm sạch Markdown/HTML |
| Upload | Giới hạn loại file (docx, ảnh), kích thước; quét/kiểm định nội dung trước khi xử lý |
| Xuất CSV | Chống CSV injection: thêm tiền tố `'` cho ô bắt đầu bằng `=`, `+`, `-`, `@`; ghi BOM UTF-8 |
| Chống lạm dụng | Rate limit cho API công khai (vào phòng, lưu nháp, nộp bài) và API AI |
| Prompt injection | Nội dung từ file/ảnh nhập vào được coi là dữ liệu, không là lệnh; chỉ chạy qua đường AI có schema cố định |
| Header bảo mật | CSP, `X-Content-Type-Options`, `Referrer-Policy`, HSTS qua reverse proxy |
| Nhật ký | `AuditLog` cho thao tác quản trị và xóa dữ liệu |
| Phụ thuộc | Bật cảnh báo cập nhật phụ thuộc (Dependabot hoặc tương đương) |

**Về chống gian lận khi thi:** ở quy mô lớp học thêm, đừng làm quá phức tạp. Làm: đồng hồ server, trộn đề, một lượt làm, ẩn kết quả đến khi đóng bài. Chưa cần: giám sát tab, camera.

---

## 11. QUYỀN RIÊNG TƯ DỮ LIỆU HỌC SINH

- **Chỉ lưu:** tên hiển thị và (qua `Group`) tên lớp học thêm. Không lưu email, số điện thoại, ngày sinh, địa chỉ, ảnh.
- Dữ liệu học sinh là dữ liệu cá nhân của trẻ em. Có Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân; **nên tham khảo ý kiến người am hiểu pháp lý** nếu triển khai ngoài phạm vi vài lớp của bạn.
- Cho giáo viên **xóa học sinh/lượt làm** dễ dàng, có tùy chọn tự dọn sau N tháng.
- Có dòng thông báo ngắn trên trang học sinh: dữ liệu chỉ gồm tên và kết quả bài làm, giáo viên có thể xem.
- Tên học sinh **không bao giờ** được gửi tới AI hay dịch vụ bên ngoài.
- Sao lưu DB chứa tên học sinh: bảo vệ quyền truy cập file sao lưu, cân nhắc mã hóa.

---

## 12. NƠI CHẠY, DOCKER, SAO LƯU

### 12.0. Chạy ở đâu: Vercel hay VPS?

Hỏi "sao không dùng Vercel" là hợp lý. **Dùng được**, và đỡ phải tự quản máy chủ. Nhưng có điều kiện:

| Tiêu chí | Vercel + PostgreSQL quản lý sẵn (Neon, Supabase...) | VPS + Docker Compose | Dịch vụ chạy container (Railway, Render, Fly...) |
|---|---|---|---|
| Công sức vận hành | Thấp nhất (đẩy code là chạy, có HTTPS) | Cao nhất (tự cập nhật, HTTPS, sao lưu, giám sát) | Trung bình |
| Chi phí | Gói miễn phí có nhưng bị ràng buộc điều khoản | Cố định, thường thấp | Thay đổi theo mức dùng, **cần kiểm tra giá hiện hành** |
| Dùng Docker như bạn định | Không (chỉ dùng Docker cho DB khi phát triển ở máy) | Có | Có |
| Giới hạn thời gian chạy một yêu cầu | Có (ảnh hưởng gọi AI, xuất Word) | Không | Thường rộng hơn |
| Trạng thái trong bộ nhớ | Không dùng được | Dùng được | Tùy dịch vụ |

Các điểm cần biết khi chọn Vercel (đã đối chiếu tài liệu Vercel, **các con số đổi theo thời điểm, hãy xác nhận ở trang giá của Vercel**):
1. **Gói miễn phí (Hobby) chỉ dành cho mục đích cá nhân, phi thương mại.** Theo hướng dẫn sử dụng hợp lý của Vercel, "thương mại" được định nghĩa là việc triển khai được dùng **vì lợi ích tài chính của bất kỳ ai tham gia làm ra dự án**. Tiêu chí là **có kiếm tiền hay không**, không phải ai là người dùng. Học sinh dùng miễn phí để học tập thì không phải điểm vướng; xin donate cũng không bị tính là thương mại theo tài liệu chính thức. Trường hợp **mơ hồ** là công cụ nằm trong dịch vụ dạy học có thu phí. Vercel khuyên nếu không chắc thì hỏi bộ phận hỗ trợ của họ. Gói trả phí (Pro) hiện khoảng 20 USD mỗi người mỗi tháng theo trang giá tôi tra được.
2. **Giới hạn thời gian chạy của hàm.** Các nguồn tôi tra ghi không thống nhất (từ vài chục giây đến vài trăm giây tùy gói và thời điểm). Gọi AI sinh cả đề có thể chạy lâu, nên phải thiết kế để mỗi lần gọi ngắn (chia nhỏ theo từng phần, dùng streaming) hoặc chọn nơi chạy không giới hạn chặt.
3. **Không có bộ nhớ tồn tại giữa các lần gọi.** Trạng thái nhóm API key và hàng đợi AI bắt buộc nằm trong DB (đã thiết kế `AiKeyState`).
4. **Prisma trên môi trường serverless** cần kết nối qua bộ gom kết nối (pooler) để tránh cạn kết nối DB.
5. **Không ghi file lâu dài vào đĩa.** Thư mục `data/` không dùng được để ghi; ảnh tải lên phải để ở dịch vụ lưu trữ đối tượng. Tạo file Word trong bộ nhớ rồi trả về thì vẫn ổn.
6. **Không có container sao lưu.** Phải dựa vào sao lưu của nhà cung cấp DB và/hoặc tự chạy `pg_dump` định kỳ từ nơi khác.
7. Dữ liệu tên học sinh sẽ nằm ở máy chủ nước ngoài; chọn vùng (region) gần Việt Nam nếu được.

**Khuyến nghị:**
- Nếu bạn **không thu phí** học sinh và thật sự chỉ dùng cá nhân: Vercel Hobby + DB quản lý sẵn là phương án gọn nhất.
- Nếu có thu học phí, hoặc muốn yên tâm về điều khoản và giới hạn thời gian: **VPS + Docker Compose** hoặc dịch vụ chạy container.
- Dù chọn gì, **viết code theo kiểu không giữ trạng thái trong bộ nhớ** (mục 3) để đổi nơi chạy sau này không phải sửa kiến trúc. Docker Compose luôn được dùng ở máy phát triển để chạy PostgreSQL.
- Các mục 12.1–12.3 bên dưới mô tả phương án VPS + Docker.

### 12.1. Cấu trúc đề xuất

```
examcraft/
├─ docker-compose.yml
├─ Dockerfile
├─ .env.example
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ src/
├─ docs/                  (tài liệu, gồm file này)
├─ scripts/
│  └─ backup.sh
└─ LICENSE
```

### 12.2. `docker-compose.yml` (khung tham khảo)

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10
    # Không publish cổng 5432 ra ngoài trong môi trường chạy thật.

  app:
    build: .
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    env_file: .env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    ports:
      - "3000:3000"   # nếu có reverse proxy thì chỉ expose nội bộ

  backup:
    image: postgres:16-alpine
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      PGPASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./backups:/backups
      - ./scripts/backup.sh:/backup.sh:ro
    entrypoint: ["/bin/sh", "-c", "while true; do /bin/sh /backup.sh; sleep 86400; done"]

volumes:
  pgdata:
```

### 12.3. Việc cần có

- `Dockerfile` nhiều tầng (build → runtime), chạy bằng user không phải root, `prisma migrate deploy` khi khởi động.
- Ở môi trường phát triển: `docker compose up db` rồi `npm run dev` ngoài container cho nhanh.
- `.env.example` liệt kê đủ biến: DB, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `GEMINI_API_KEY_1..7`, `GEMINI_MODEL`, `APP_URL`.
- **Sao lưu:** `pg_dump` hàng ngày, giữ N bản gần nhất, **sao chép ra nơi khác ngoài máy chạy** (ổ ngoài, kho lưu trữ đám mây). Định kỳ **thử khôi phục** thật, vì bản sao lưu chưa từng khôi phục thử thì chưa đáng tin.
- Chạy thật: đặt sau reverse proxy có HTTPS (Caddy cấp chứng chỉ tự động, hoặc Cloudflare Tunnel nếu không có IP công khai). Chọn nơi chạy (VPS nhỏ, máy trong nhà) ở mục 18.
- Trạng thái key và hàng đợi AI luôn lấy từ bảng `AiKeyState`/DB, không dựa vào bộ nhớ của tiến trình, để chạy nhiều bản hay chuyển nơi chạy đều không đổi.

---

## 13. SƠ ĐỒ TRANG VÀ API

### 13.1. Trang

| Khu vực | Đường dẫn | Ghi chú |
|---|---|---|
| Đăng nhập | `/login` | Không có đăng ký |
| Đổi mật khẩu | `/account/password` | Bắt buộc ở lần đầu |
| Giáo viên | `/dashboard` | Tổng quan: bài đang mở, bài cần chấm |
| | `/questions` | Ngân hàng câu hỏi của tôi, lọc nhiều chiều |
| | `/questions/shared` | Ngân hàng chung (chỉ đọc), chọn câu để thêm vào đề của mình |
| | `/exams`, `/exams/[id]` | Danh sách đề, trình soạn + xem trước A4 |
| | `/groups`, `/groups/[id]` | Lớp và học sinh |
| | `/assignments`, `/assignments/[id]` | Bài giao, theo dõi, kết quả, thống kê |
| | `/templates` | Mẫu cấu trúc đề |
| Admin | `/admin/users` | Tạo, khóa, đặt lại mật khẩu |
| | `/admin/ai` | Trạng thái key, mức dùng theo giáo viên |
| | `/admin/audit` | Nhật ký thao tác |
| Học sinh (công khai) | `/a/[publicId]` | Vào bài giao |
| | `/c/[groupCode]` | Trang lớp: chọn tên, xem bài mở và lịch sử của mình |
| Chia sẻ đề | `/share/[token]` | Xem/tải, có thể thu hồi |

### 13.2. API chính (rút gọn)

- `POST /api/auth/*` — đăng nhập, đăng xuất, đổi mật khẩu
- `/api/admin/users` — CRUD tài khoản giáo viên (chỉ `SUPER_ADMIN`)
- `/api/questions`, `/api/exams`, `/api/templates` — CRUD, luôn kiểm `ownerId`
- `GET /api/questions/shared` — duyệt ngân hàng chung; `POST /api/questions/fork` — tạo bản sao các câu đã chọn
- `/api/ai/generate`, `/api/ai/tweak`, `/api/ai/ocr`, `/api/ai/parse-docx`, `/api/ai/verify` — qua hàng đợi AI
- `/api/groups`, `/api/groups/[id]/students` — lớp và học sinh
- `POST /api/assignments` — tạo snapshot và link
- Công khai cho học sinh (có rate limit):
  - `GET /api/public/a/[publicId]` — thông tin bài (đã loại đáp án), danh sách tên
  - `POST /api/public/a/[publicId]/start` — tạo `Attempt`
  - `PUT /api/public/attempts/[id]/draft` — lưu nháp
  - `POST /api/public/attempts/[id]/submit` — nộp và chấm (idempotent)
  - `GET /api/public/attempts/[id]/result` — theo chính sách hiển thị
  - `GET /api/public/attempts/[id]/leaderboard` — chỉ trả top N và vị trí của chính học sinh
- `GET /api/assignments/[id]/results.csv` — xuất bảng điểm

Mọi lỗi trả về dạng thống nhất (mã lỗi + thông điệp tiếng Việt thân thiện).

---

## 14. GIAO DIỆN

### 14.1. Nguyên tắc

- **Học sinh dùng điện thoại là chính:** nút lớn, chữ rõ, công thức dài cuộn ngang trong khung của nó, không làm trang cuộn ngang, tự lưu nháp, hiển thị đồng hồ còn lại dễ thấy.
- **Giáo viên dùng máy tính là chính:** nhưng vẫn xem được kết quả trên điện thoại.
- Mọi thao tác AI có trạng thái "đang chạy", lỗi rõ ràng, nút thử lại; không mất nội dung đang soạn khi AI lỗi.
- Thao tác xóa luôn có xác nhận; xóa học sinh/lượt làm nói rõ hậu quả.
- Hỗ trợ truy cập cơ bản: tương phản đủ, điều hướng bằng bàn phím, nhãn cho nút biểu tượng.
- Thông báo lỗi, trạng thái rỗng và hướng dẫn lần đầu bằng tiếng Việt dễ hiểu.

### 14.2. Màn hình cần thiết kế kỹ

1. Trình soạn đề (card + A4 + thanh công cụ AI).
2. Trình dựng cấu trúc đề và chọn mẫu.
3. Màn hình giao bài (chọn chế độ, thời gian, định danh, hiển thị kết quả, link/mã/QR để chiếu lên lớp).
4. Màn hình theo dõi bài giao (danh sách học sinh, trạng thái, điểm, thao tác mở lại/gia hạn/xóa).
5. Chi tiết bài làm một học sinh và chấm tay.
6. Trang học sinh: chọn tên → làm bài → kết quả → lịch sử.
7. Trang admin: người dùng, trạng thái key AI, nhật ký.

> **Chưa xem giao diện thật.** Khi bạn gửi ảnh chụp màn hình, tôi sẽ rà soát chi tiết thay vì chỉ đưa nguyên tắc.

---

## 15. NHẬP CÂU HỎI TỪ WEB VÀ NGUỒN NGOÀI

### 15.1. Yêu cầu của bạn và nhận định

Bạn muốn lấy từ các trang học online **chỉ phần câu hỏi**, cho **mục đích cá nhân**, và sẽ xem xét lại khi dùng kinh doanh.

Nhận định thẳng thắn (tôi không phải luật sư):
- Dùng cá nhân làm rủi ro thấp hơn, nhưng **không đảm bảo hợp lệ**. Điều khoản của từng trang và quyền tác giả với nội dung vẫn áp dụng. Nhiều trang cũng chủ động chặn công cụ tự động.
- Khi hệ thống có nhiều giáo viên và học sinh dùng, ranh giới "cá nhân" mờ dần. Vì vậy thiết kế dưới đây giữ các câu này **ở phạm vi riêng của người nhập** và **dễ gỡ bỏ**.

### 15.2. Ba mức nhập (làm từ mức 1)

**Mức 1 — Dán văn bản, ảnh, file Word (khuyến nghị, đã có sẵn tính năng):** giáo viên mở trang, sao chép phần câu hỏi cần dùng rồi dán; hoặc chụp ảnh; hoặc nhập file. AI tách thành câu hỏi có cấu trúc. Kết quả gần như giống crawl nhưng không tải tự động và không bị chặn.

**Mức 2 — Nhập từ danh sách URL do giáo viên chỉ định (tùy chọn, làm sau):**
- Giáo viên đăng nhập, dán một vài URL cụ thể; hệ thống tải **từng trang một**, chậm và có giới hạn số URL mỗi ngày.
- Tôn trọng `robots.txt`; khai báo User-Agent trung thực; gặp 403/429/CAPTCHA/yêu cầu đăng nhập thì **dừng**, không cố vượt.
- Chỉ trích phần câu hỏi và đáp án; bỏ logo, quảng cáo, bình luận.
- **Lời giải do AI hoặc giáo viên viết mới**, không sao chép lời giải của trang.
- Kiểm tra trùng với câu đã có trong ngân hàng.
- Kết quả đi qua màn hình duyệt 2 cột như các nguồn nhập khác.

**Mức 3 — Quét hàng loạt cả website qua sitemap, nhiều luồng, xoay IP/proxy, vượt chặn: không làm.** Đây là phần gây rủi ro lớn và công sức làm sạch dữ liệu lớn, trong khi mức 1 và 2 đã đủ nhu cầu cá nhân.

### 15.3. Gắn nhãn và ràng buộc cho câu nhập từ web

- `sourceKind = IMPORTED_WEB`, lưu `sourceUrl` và thời điểm nhập.
- `shareable = false` và `visibility = PRIVATE` bắt buộc: không đưa vào ngân hàng chung, không tạo link chia sẻ công khai, không cho giáo viên khác tạo bản sao.
- Giao diện hiển thị nguồn rõ ràng cho chính giáo viên.
- **Dễ gỡ bỏ:** có bộ lọc và nút "xóa tất cả câu nhập từ web", để khi bạn chuyển sang dùng thương mại có thể loại sạch hoặc thay bằng câu tự soạn/có giấy phép.
- Việc đưa đề có chứa các câu này ra ngoài (in phát cho học sinh, xuất Word) là do bạn tự cân nhắc; hệ thống chỉ cảnh báo nguồn gốc.

### 15.4. Các nguồn khác

1. **File của chính giáo viên:** Word, ảnh chụp đề, LaTeX (đã có).
2. **Kho LaTeX EX_Test:** chỉ nhập khi kho cho phép dùng; ghi nguồn và giấy phép vào `source` và `licenseNote`.
3. **Bộ dữ liệu công khai (VMLU, bộ toán tiểu học...):** kiểm giấy phép trước; dùng chủ yếu làm mẫu few-shot và bộ đánh giá chất lượng AI. `sourceKind = LICENSED_DATASET`.
4. **Cây phân loại kiến thức (ID6/ID7):** nhập thành danh mục chuyên đề nếu nguồn cho phép.

### 15.5. Khi chuyển sang dùng thương mại

Trước khi thu phí hoặc dùng cho doanh nghiệp, rà lại theo thứ tự: (1) xóa hoặc thay các câu `IMPORTED_WEB`; (2) kiểm giấy phép các câu `LICENSED_DATASET`; (3) kiểm điều khoản nơi chạy (ví dụ gói miễn phí của Vercel); (4) rà lại điều khoản sử dụng API AI cho mục đích thương mại và quyền riêng tư dữ liệu.

---

## 16. KIỂM THỬ VÀ NGHIỆM THU

### 16.1. Các lớp kiểm thử

| Lớp | Nội dung |
|---|---|
| Unit | Chấm điểm (mọi dạng câu, mọi biên), chuẩn hóa đáp án ngắn, trộn đề tái lập, parser LaTeX, Zod schema |
| Công thức Word | Bộ 50–100 công thức mẫu, so khớp tự động + xem bằng mắt |
| Tích hợp (có DB thật) | Luồng giao bài → làm → nộp → chấm; nộp trùng; nộp trễ; vượt số lần làm; quyền truy cập chéo giữa giáo viên |
| Bảo mật | Học sinh không lấy được đáp án trước khi cho phép; giáo viên A không thấy dữ liệu giáo viên B; route admin chặn giáo viên thường |
| End-to-end | Sinh đề → chỉnh sửa → xuất Word; học sinh làm bài trên trình duyệt di động |
| Thử tải | 100 người dùng ảo cùng vào, lưu nháp, nộp bài trong một bài giao; kiểm tra thời gian phản hồi và không mất bài |
| Ngân hàng chung | Bản sao không đổi khi câu gốc bị sửa/xóa; câu `IMPORTED_WEB` không chia sẻ được; giáo viên khác không sửa được câu gốc |
| Xếp hạng | Hòa điểm, bài chờ chấm, nhiều lượt làm, học sinh không lấy được danh sách đầy đủ qua API |
| Chất lượng AI | Bộ đề thật: đo tỷ lệ AI sinh sai đáp án theo môn, theo dõi theo thời gian |
| Thủ công | Mở file `.docx` bằng Word thật, in thử, thi thử với vài học sinh thật |

### 16.2. Tiêu chí "xong" cho một tính năng

1. Có test tự động tương ứng và chạy qua trong CI.
2. Đã thử bằng dữ liệu thật hoặc gần thật.
3. Có xử lý lỗi và thông báo người dùng.
4. Tài liệu/README cập nhật khớp thực tế.
5. Không làm lộ dữ liệu giữa các tài khoản.

### 16.3. CI

GitHub Actions: lint → kiểm kiểu → test → build, chạy với PostgreSQL ở dạng service container.

---

## 17. LỘ TRÌNH TRIỂN KHAI

**Giai đoạn 0 — Dọn dẹp (1–2 ngày)**
- [ ] Gộp hai file kế hoạch cũ thành tài liệu này, chuyển vào `docs/`; chuyển file `.docx` vào `docs/` (xem xét nội dung có thông tin cá nhân không)
- [ ] Sửa README cho đúng hướng mới và đúng khả năng thực tế
- [ ] Thêm `LICENSE`, mô tả repo, topics
- [ ] Rà soát các mục **[CẦN KIỂM TRA]** ở mục 2 (đặc biệt `/test`, `data/`, XSS, CSV)
- [ ] Chốt nơi chạy (mục 12.0), kể cả trả lời câu hỏi có thu học phí hay không

**Giai đoạn 1 — Nền tảng (1–2 tuần)**
- [ ] Docker Compose + PostgreSQL + Prisma, migration đầu tiên
- [ ] Seed: super-admin, mẫu đề hệ thống, danh sách môn
- [ ] Đăng nhập, đổi mật khẩu bắt buộc, giới hạn thử sai
- [ ] Trang admin: tạo/khóa/đặt lại mật khẩu giáo viên
- [ ] `AuditLog`, khung phân quyền ở server, CI

**Giai đoạn 2 — Chuyển nội dung sang DB**
- [ ] Câu hỏi, đề, ngân hàng câu hỏi, mẫu cấu trúc đề lưu qua Prisma
- [ ] Trang nhập một lần từ file sao lưu cũ
- [ ] Gỡ Dexie/IndexedDB khỏi luồng chính
- [ ] Lịch sử phiên bản câu hỏi; khung diff + hoàn tác ghi vào DB
- [ ] Tác giả, mức hiển thị, ngân hàng chung và tạo bản sao (mục 8.4); nhãn nguồn câu hỏi
- [ ] Module AI: hàng đợi, nhóm 7 key, `AiKeyState`, `AiUsageLog`, hạn mức theo giáo viên

**Giai đoạn 3 — Giao bài và học sinh**
- [ ] Group, Student (nhập danh sách nhiều dòng)
- [ ] Tạo Assignment với snapshot; 3 chế độ cài đặt sẵn
- [ ] Trang học sinh: chọn tên, làm bài, lưu nháp, nộp, kết quả theo chính sách
- [ ] Chấm bài ở server, đồng hồ server, chống nộp trùng
- [ ] Trang lớp `/c/[groupCode]` và lịch sử theo tên
- [ ] Thử tải 100 người dùng ảo

**Giai đoạn 4 — Màn hình giáo viên về kết quả**
- [ ] Theo dõi theo thời gian gần thực (polling)
- [ ] Chi tiết bài làm, chấm tay tự luận, xóa lượt/học sinh
- [ ] Thống kê theo câu và theo bài
- [ ] Xuất CSV an toàn
- [ ] Bảng xếp hạng top N + vị trí của mình (mục 5.9)
- [ ] Mở lại / gia hạn / đóng sớm, cấp thêm lượt

**Giai đoạn 5 — Chất lượng Word và in ấn**
- [ ] Bộ công thức mẫu và kiểm thử; thử đường LaTeX → MathML → OMML; dự phòng ảnh
- [ ] Font tương thích cho xem trước; sửa cam kết phân trang
- [ ] Kiểm thử trên Word thật

**Giai đoạn 6 — Hoàn thiện và kiểm chứng**
- [ ] Sao lưu tự động + thử khôi phục
- [ ] Rà soát bảo mật theo mục 10
- [ ] Kiểm thử với đề thật từng môn, ghi nhãn trạng thái từng môn
- [ ] Thi thử với vài học sinh thật, thu phản hồi

**Về sau (khi cần)**
- Nhập câu hỏi từ danh sách URL (mục 15, mức 2), PIN cho học sinh, tài khoản học sinh, thông báo cho giáo viên khi có bài nộp, hình học không gian và mạch điện trong `figures[]`, bản app/PWA.

---

## 18. RỦI RO VÀ CÂU HỎI CÒN MỞ

### 18.1. Rủi ro

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| AI sinh đáp án sai | Cao | Nhãn tin cậy trung thực, giáo viên duyệt, đo tỷ lệ sai bằng bộ đề thật |
| Học sinh xem kết quả của nhau | Trung bình (đã chấp nhận) | Link riêng, PIN, ẩn điểm ở trang chọn tên |
| Mất dữ liệu server | Cao | Sao lưu ngoài máy + thử khôi phục |
| Lộ/lạm dụng API key | Cao | Env/secret, không log, hạn mức theo giáo viên, giám sát |
| Công thức vỡ trong Word | Trung bình | Bộ công thức mẫu, dự phòng ảnh |
| Quá nhiều môn chưa kiểm thử | Trung bình | Nhãn trạng thái từng môn, kiểm thử tuần tự |
| Quy định dữ liệu cá nhân trẻ em | Trung bình | Chỉ lưu tên, xóa dễ dàng, không gửi AI |
| Thay đổi điều khoản/quota của Google | Trung bình | Cấu hình model qua env, theo dõi lỗi 429/403, có phương án thay mô hình |
| Câu nhập từ web vướng bản quyền/điều khoản khi dùng rộng hoặc thương mại | Trung bình | Nhãn nguồn, khóa chia sẻ, nút xóa hàng loạt, nhập chậm và có kiểm soát (mục 15) |
| Vi phạm điều khoản gói miễn phí của nơi chạy (ví dụ Vercel Hobby) | Trung bình | Chốt rõ có thu phí hay không; code viết không giữ trạng thái để đổi nơi chạy dễ |

### 18.2. Các câu hỏi đã chốt

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Chạy ở đâu | **Chưa chốt hẳn.** Xem khuyến nghị ở mục 12.0 |
| 2 | Tối đa bao nhiêu học sinh làm cùng lúc | Nhỏ (lớp học thêm); thử tải 100 người ảo (mục 5.8) |
| 3 | Giáo viên dùng chung ngân hàng câu hỏi | Có, **lưu theo tác giả, chọn câu tạo bản sao** (mục 8.4) |
| 4 | Bảng xếp hạng | Top vài người và vị trí của mình, tùy chọn mỗi bài (mục 5.9) |
| 5 | Giữ file `.docx` ý tưởng gốc trong repo | Tạm thời giữ trong `docs/`, **xóa sau** |

### 18.3. Câu hỏi còn mở (bạn trả lời khi tiện)

1. Công cụ này có dùng trong lớp học thêm **có thu học phí** không? (ảnh hưởng chọn nơi chạy và điều khoản)
2. Có cho phép bài giao **mở cho khách không thuộc lớp nào** (chế độ gõ tên tự do, không gắn lớp) không? Thiết kế hiện hỗ trợ, nhưng kết quả của khách sẽ khó gom lịch sử.
3. Giữ dữ liệu bài làm bao lâu thì tự dọn (ví dụ 12 tháng) hay chỉ xóa tay?
4. Tên tác giả có hiện trên đề in ra không? (mặc định: không)

---

## 19. DANH SÁCH VIỆC DỌN DẸP REPO

- Gộp và chuyển tài liệu vào `docs/`; viết lại theo giọng tài liệu dự án (bỏ các câu kiểu "Tôi (Agent) sẽ làm...").
- Sửa README: bỏ "Cloud File Storage" và "Offline-First (IndexedDB)", sửa mô tả điểm theo phần, sửa mô tả mã đề, sửa phần xoay key cho đúng, thêm hướng dẫn chạy Docker.
- Thêm `LICENSE`.
- File `.docx` ý tưởng gốc: tạm giữ trong `docs/`, kiểm tra không chứa thông tin cá nhân, và ghi việc "xem lại và xóa" để làm sau.
- Xóa hoặc sửa các nội dung sai/lỗi thời ở mục 2.3 và 2.4 (tên bộ dữ liệu, tên model, giờ reset quota).
- Thêm mô tả repo và topics trên GitHub.
- Thêm GitHub Actions (lint, test, build).
- Kiểm tra thư mục `data/` và quyết định: chuyển vào DB seed hoặc bỏ.
- Rà soát `.gitignore` đảm bảo không lọt `.env`, `backups/`, file chứa dữ liệu học sinh.

---

*Tài liệu cần được cập nhật khi các mục **[CẦN KIỂM TRA]** được xác minh và khi từng giai đoạn hoàn thành theo tiêu chí ở mục 16.2.*
