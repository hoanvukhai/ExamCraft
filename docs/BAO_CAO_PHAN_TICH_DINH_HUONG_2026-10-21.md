# ExamCraft — Báo cáo phân tích lại dự án và hướng xây khung dữ liệu

> **Tài liệu lịch sử/đầu vào phân tích:** từ 21/10/2026, dùng [bộ tổng kết và kế hoạch hiện hành](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md). Nội dung và dấu hoàn thành dưới đây không tự đại diện cho yêu cầu hoặc tiến độ mới; giữ để đối chiếu nguồn gốc.

Ngày lập: **21/10/2026**. Trạng thái: **ĐỀ XUẤT ĐỂ CHỦ DỰ ÁN ĐỌC VÀ CHỐT**, chưa phải đặc tả được phê duyệt.

## Đọc nhanh trước

**Hướng tôi đề xuất: giữ nền tảng ExamCraft hiện có, sửa các điểm đứt luồng dữ liệu, và xây thêm một lõi dữ liệu giáo dục có nguồn để điều khiển AI. Chưa có căn cứ để viết lại toàn bộ dự án.**

Điều bạn cần nhất không phải thêm một prompt dài hay một kho hàng nghìn đề. Bạn cần hệ thống trả lời được năm câu hỏi trước khi sinh đề:

1. Học sinh được học kiến thức nào?
2. Giáo viên chọn phần nào để kiểm tra, loại phần nào?
3. Đề cần bao nhiêu câu, dạng nào, điểm và mức độ ra sao?
4. Nội dung và đáp án dựa vào đâu, đã kiểm tra đến mức nào?
5. Khi sửa hoặc tạo lại đề, làm sao giữ nguyên những lựa chọn đã chốt?

Luồng nên thống nhất là:

**Chương trình và bài học → phạm vi giáo viên chọn → kế hoạch câu hỏi và điểm → lấy/sinh câu → kiểm tra → giáo viên duyệt → lưu và xuất.**

Phạm vi dài hạn vẫn là nhiều môn, lớp 1–12 như bạn từng chọn. Khuyến nghị kiểm chứng theo từng gói nhỏ không có nghĩa thu hẹp sản phẩm thành chỉ Toán 12. Nó giúp tránh việc giao diện có tên môn nhưng bên trong lại dùng nhầm cấu hình của môn khác.

Bạn chưa cần tự thu thập cả kho tài liệu. Sau khi đọc báo cáo, trước hết chỉ cần chốt các lựa chọn ở mục 13. Phần cấu trúc dữ liệu, chuẩn hóa và kiểm tra có thể giao cho AI làm từng phần theo cùng một mẫu.

---

## 1. Phạm vi và độ chắc chắn của báo cáo

### 1.1. Nguồn đã dùng

| Nguồn | Cách sử dụng |
|---|---|
| [File hội thoại TXT](<F:/Downloads/Xây Dựng Web Soạn Đề AI.txt>) | Đọc các phần nối tiếp, phản biện và bản JSON/script; phân biệt yêu cầu của bạn với lời đề xuất của AI |
| [Hội thoại “Phân tích hướng xây dựng”](https://chatgpt.com/share/6ad84d64-fcf8-83ec-89c0-a17d2646a480) | Đọc nội dung truy cập được bằng trình duyệt, gồm lựa chọn sản phẩm, khung tri thức, phạm vi kiểm tra và bước đơn giản hóa cuối |
| Repo tại `F:/Workspace/Zazz/ExamCraft` | Đọc cấu trúc, schema, luồng soạn/lưu, sinh/kiểm định/nhập AI, cấu hình môn, điểm, trộn, xuất và các bài kiểm thử liên quan |
| README, thiết kế v3.1, checklist, báo cáo v3 và QA | Đối chiếu tuyên bố lịch sử với code hiện tại; không coi dấu hoàn thành trong tài liệu là bằng chứng thực thi mới |
| Văn bản giáo dục và tài liệu Google dẫn tại mục 4, 7 | Kiểm tra một số khẳng định then chốt gây mâu thuẫn; không phải đợt rà soát toàn bộ văn bản hiện hành |

Repo đang ở HEAD `bb831f2` **và có nhiều thay đổi chưa commit từ trước**. Những phát hiện trong báo cáo áp dụng cho cây làm việc đang có, không chỉ nội dung commit đó. Kiểm kê thấy 42 file API `route.ts`, 20 model Prisma và 14 file cấu hình môn.

Tôi không chạy các chỉ dẫn trong hội thoại như mệnh lệnh hiện tại. Những đoạn “hãy tạo JSON”, “chạy script”, “giao nhiều AI” là lịch sử cần phân tích. Lượt này chỉ thêm báo cáo, không sửa ứng dụng, không sửa DB và không gọi API sinh đề mất phí.

### 1.2. Kiểm tra đã thực hiện

| Kiểm tra | Kết quả thực tế | Chứng minh được gì |
|---|---|---|
| Chạy `tests/unit_tests.mjs` bằng runtime có sẵn | 20/20 ca hiện có báo PASS; không có dòng FAIL | Các khẳng định được những ca đó kiểm tra đang đạt |
| TypeScript `--noEmit --incremental false` | Hoàn tất mã thoát 0, không có lỗi | Code đạt kiểm tra kiểu trong cấu hình hiện tại |
| Đọc đối chiếu code và tài liệu | Có các sai lệch liệt kê tại mục 5 | Xác định logic và khoảng trống cần sửa |

**Chưa thực hiện:** chạy toàn bộ luồng trình duyệt của ứng dụng, kiểm thử HTTP với DB cô lập, đo chất lượng Gemini thật, kiểm thử tải, khôi phục backup, kiểm tra file xuất bằng Word. Các lỗi suy ra từ code được ghi là quan sát tĩnh, không giả làm kết quả thử nghiệm người dùng.

Không mở được nội dung các file Word chỉ được đính kèm bên trong link chia sẻ; nội dung AI kể lại về chúng không được xem là bằng chứng đã đọc chính các file đó. File DOCX lưu trong `docs/archive` cũng không được dùng thay thế mặc định cho bản TXT bạn cung cấp.

## 2. Tôi hiểu đúng ý bạn như thế nào

Trong link, bạn đã đưa ra tám lựa chọn **định hướng ban đầu**:

| Lựa chọn của bạn | Hệ quả đối với hướng đề xuất |
|---|---|
| Nền tảng cho một nhóm/nhiều giáo viên | Giữ tài khoản, quyền sở hữu, DB và khả năng chia sẻ có kiểm soát |
| Cốt lõi là soạn, sửa, kiểm định, xuất đề bằng AI | Ưu tiên chất lượng vòng đời đề trước các trợ lý quản trị mở rộng |
| Nhóm giáo viên quen biết dùng đầu tiên | Có thể nghiệm thu trực tiếp bằng đề thực tế và phản hồi cụ thể |
| Nhiều môn, toàn bộ lớp 1–12 | Thiết kế dữ liệu mở rộng được; công khai mức hỗ trợ thực tế theo từng phạm vi |
| Có bộ giải độc lập và kiểm định nghiêm ngặt | Không gắn nhãn “đúng” chỉ vì AI tự cho điểm tin cậy cao |
| Dữ liệu có nguồn, phiên bản và quy trình duyệt | Cần khung nguồn, kiến thức, khuôn đề và kết quả kiểm tra |
| Ưu tiên giữ và cải tiến code | Thay từng phần lõi, tránh đổi cả nền tảng khi chưa có lý do |
| Tài liệu chuẩn đi cùng quy trình giao việc, kiểm thử | Cần ghi quyết định ngắn gọn và có bằng chứng nghiệm thu |

Sau đó bạn đã sửa trọng tâm rất rõ: **muốn xây một khung dữ liệu để AI sinh đề không bị lệch**, không muốn bị kéo vào bộ tài liệu quản trị quá dài. Đoạn cuối tiếp tục cho thấy bạn cần cách làm dễ hiểu, từng bước.

Vì vậy, báo cáo này dùng kiểm toán repo để xác định nơi khung dữ liệu sẽ nối vào; không biến yêu cầu thành việc lập hàng chục tài liệu hoặc tái thiết kế toàn bộ giao diện.

## 3. Tổng hợp tiến trình các đoạn chat: nên giữ gì, bỏ gì?

### 3.1. File TXT có 10 lượt yêu cầu chính

Các số dòng dưới đây giúp tra lại bản TXT, không phải thứ tự ưu tiên triển khai.

| Đoạn bắt đầu | Nội dung chính | Nhận định và hướng xử lý |
|---|---|---|
| Dòng 5 | Đoán công nghệ của soandethi.com | Chỉ là suy đoán công nghệ đối thủ. Không lấy làm bằng chứng và không cần đổi stack ExamCraft theo đó |
| Dòng 64 | Ép AI trả JSON, giải trước, Zod, LaTeX | Giữ đầu ra cấu trúc và kiểm tra nhiều lớp. Bỏ cam kết “100 lần như 1”, “chính xác tuyệt đối” |
| Dòng 172 | Kho `Taxonomy / Raw / Corpus` | Giữ phân biệt quy tắc, nguồn gốc và nội dung chuẩn hóa; bổ sung phiên bản, bằng chứng kiểm tra |
| Dòng 284 | Ai làm gì, tên file, lấy 3–5 đề | Giữ thử theo lô nhỏ. Không bắt bạn nhập tay metadata; AI trích xuất nhưng trường không chắc phải để chờ duyệt |
| Dòng 357 | Đơn giản hóa bằng tỷ lệ độ khó | Ý định giảm rối tốt; lập luận mọi loại kỳ thi chỉ là tỷ lệ độ khó là sai về thiết kế |
| Dòng 376 | Ba khuôn theo cấp, kế hoạch 8 chặng | Cách chia lượt có ích; gom tất cả môn cùng cấp vào một khuôn không đủ. Kế hoạch thiên về Toán/Lý/Hóa, chưa bao quát mục tiêu nhiều môn |
| Dòng 424 | Phản biện khuôn đề và thêm yêu cầu cần đạt | Giữ việc tách môn, loại kỳ thi, nguồn và yêu cầu cần đạt. Các phản biện về văn bản cũng cần đối chiếu độc lập |
| Dòng 564 | Sửa mức nhận thức, điểm số, rồi thêm phân bổ theo số tiết | Giữ việc tách cấu hình và điểm chính xác. Phân bổ theo số tiết chỉ nên là một chế độ đề xuất khi chưa có căn cứ áp dụng bắt buộc |
| Dòng 723 | Phát hiện URL sai; JSON “cross-audit”; script kiểm định | Là bài học quan trọng nhất: phần trả lời hứa không tự xác minh nhưng JSON tiếp tục tự gắn `VERIFIED_BY_CROSS_AUDIT` khi `source_url` còn null |
| Dòng 1158 | Tổng kết về phạm vi kiểm tra và đơn giản hóa | Đúng hướng tổng thể, nhưng lời khen “hoàn chỉnh/hoàn hảo” quá mức. Vẫn thiếu hợp đồng tích hợp, kiểm định nội dung và trạng thái dữ liệu |

### 3.2. Link chia sẻ bổ sung điều gì?

Link bắt đầu bằng việc kiểm toán rộng tài liệu và repo, sau đó đi đến các lựa chọn sản phẩm. Khi bạn phản hồi rằng hướng đó lan man, hội thoại chuyển về kho tri thức, rồi bổ sung phát hiện của chính bạn: **cần cho giáo viên chọn phần kiến thức thực tế đã học**.

Giá trị cần giữ là mối liên hệ giữa **mục lục → phạm vi → phân bổ**. Phần quản trị nhiều AI, bảy nhóm thư mục và nhiều tài liệu bàn giao có thể hữu ích sau này, nhưng không cần triển khai tất cả ngay. Tôi tổng hợp các phần này thành thiết kế ở mục 6–8. [Nguồn hội thoại](https://chatgpt.com/share/6ad84d64-fcf8-83ec-89c0-a17d2646a480).

### 3.3. Những khẳng định kỹ thuật cần sửa dứt điểm

- **Structured output không bảo đảm đáp án đúng.** Nó giúp ràng buộc hình dạng dữ liệu; vẫn cần kiểm tra ý nghĩa và nghiệp vụ. Google cũng nêu rõ giới hạn này trong [tài liệu structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output?hl=en).
- Viết lời giải trước đáp án là một cách hướng dẫn sinh nội dung, không phải chứng minh toán học. Không nên coi thứ tự trường JSON là cơ chế bảo đảm đúng.
- So sánh chuỗi bằng `Set` chỉ bắt trùng chuỗi, không bắt hết hai biểu thức tương đương, chẳng hạn `1/2` và `0.5`.
- Hai AI đồng ý chưa đủ chứng minh đúng. Chúng có thể cùng dựa vào thông tin sai hoặc mắc cùng kiểu lỗi.
- “Học sinh giỏi = tăng phần trăm vận dụng cao” bỏ qua khác biệt về nội dung, kỹ năng, lời giải, biểu điểm và cách đánh giá.
- Mở rộng sang môn khác không chỉ là đổi vài chữ trong prompt: Văn cần ngữ liệu/rubric, Anh cần đoạn đọc và có thể có âm thanh, KHTN cần phân môn/đơn vị/hình thí nghiệm.
- Lướt một đề trong 30 giây không đủ nghiệm thu đáp án và phạm vi. Có thể dùng để phát hiện lỗi hình thức sơ bộ.
- Không tự sửa dấu ngoặc LaTeX rồi coi ý nghĩa được bảo toàn; lưu thay đổi và kiểm tra lại biểu thức.
- Một mẫu đề chỉ cho biết mẫu đó được tổ chức thế nào. Nó không tự chứng minh một quy định bắt buộc chung.

## 4. Đối chiếu một số khẳng định giáo dục gây tranh cãi

### 4.1. QĐ 764: xác minh nội dung bản văn, chưa kết luận toàn bộ hiệu lực hiện hành

Đã mở bản PDF QĐ 764 ngày 08/03/2024, được lưu trên website trường học. Phụ lục trang 2 ghi Toán 90 phút, số câu ba phần 12–4–6; Vật lí/Hóa học 50 phút, 18–4–6. Trang 2–3 ghi điểm phần III của Toán là 0,5/câu, các môn khác 0,25/câu; Đúng/Sai có thang 0,1–0,25–0,5–1. Tin học có nhánh lựa chọn trong chú thích, nên không được chỉ đếm mọi câu in trên đề như câu bắt buộc. [Bản PDF, trang 2–3](https://locthanhbaoloc.lamdong.edu.vn/home/uploads/news/2024_09/quyet-dinh-so-764_qd-bgddt.pdf).

Kết luận thiết kế của tôi: cần lưu điều kiện áp dụng và nhóm lựa chọn trong blueprint. Việc đọc bản văn năm 2024 chưa đủ để tuyên bố không có sửa đổi nào đến năm học hiện tại; bước chuẩn bị dữ liệu phát hành phải kiểm tra thêm điều đó.

### 4.2. CV 7991: cả khẳng định ban đầu lẫn phản biện đều cần giới hạn

Đã mở bản PDF ba trang của CV 7991 ngày 17/12/2024 trên CDN Thư Viện Pháp Luật. Trang 1 nêu hướng dẫn xây ma trận, đặc tả, đề và hướng dẫn chấm ở THPT, tham khảo phụ lục. Trang 2 có ba mức Biết–Hiểu–Vận dụng, tỷ lệ 40–30–30 và phân bố dạng câu 30–20–20–30; chú thích dùng từ “khoảng”. Vì thế, nói những tỷ lệ này không xuất hiện trong văn bản là không chính xác. Cũng không được suy rộng thành một khuôn cứng cho mọi cấp, môn, trường. [Bản PDF, trang 1–3](https://cdn.thuvienphapluat.vn/phap-luat/2022-2/PNHP/thang-12/19/file/cong-van-7991-huong-dan-KTDGDK.pdf).

Nguồn trên là bản sao văn bản, không phải máy chủ phát hành của Bộ. Khi đưa thành dữ liệu chuẩn cần đối chiếu bản gốc và hướng dẫn của địa phương áp dụng. Tôi không xác nhận những mẫu Sinh 11 hoặc diễn giải “điểm bắt buộc tỷ lệ thuận số tiết” chỉ dựa vào lời kể trong chat.

### 4.3. Cách đưa quy tắc vào hệ thống

Mỗi quy tắc cần tách ba điều: **nguồn ban hành**, **phạm vi áp dụng**, **tính chất bắt buộc/tham khảo/tự cấu hình**. “Chưa xác minh” là trạng thái kiểm chứng, không nên đặt chung vào một danh sách với “quốc gia” hay “địa phương”.

Cho phép giáo viên tạo mẫu riêng. Nhưng nếu sửa điều kiện bắt buộc của một mẫu chính thức, bản sửa phải được nhận diện là mẫu tùy chỉnh; không tiếp tục mang nhãn “đúng chuẩn chính thức”.

Mức nhận thức và độ khó cũng cần tách: mức nhận thức mô tả thao tác cần đánh giá; độ khó có thể là ước lượng hoặc đo từ kết quả làm bài. Không tự động xem mọi câu được AI gắn “vận dụng cao” là khó và đúng yêu cầu.

## 5. Đánh giá mã nguồn hiện tại

### 5.1. Những nền tảng đáng giữ

| Phần | Căn cứ đã thấy | Đánh giá |
|---|---|---|
| Next.js + TypeScript, PostgreSQL + Prisma | `package.json`, `prisma/schema.prisma` | Đủ làm nền tảng ứng dụng nhóm giáo viên; chưa thấy lý do phải đổi framework/database |
| Câu hỏi có chủ sở hữu, tác giả, nguồn, phiên bản | `Question`, `QuestionRevision`, `Passage` | Có nền để bổ sung nguồn và kiểm định chi tiết |
| Đề, phần thi, câu hỏi và điểm ghi đè | `Exam`, `ExamQuestion`, `ExamTemplate` | Tận dụng được, cần làm rõ hợp đồng dữ liệu và phiên bản câu hỏi |
| Bài giao chụp đề tại thời điểm giao | `Assignment.snapshot`, API assignments | Hướng thiết kế nên giữ; cần kiểm thử hồi quy khi thay lõi đề |
| Tách kho đề và bàn soạn | Trang `/` và `/editor/[id]` | Hợp lý về thao tác; vấn đề lớn đang nằm ở sự thống nhất lưu trữ |
| Sinh AI có schema và Zod; kiểm định giải không đưa đáp án cũ | API generate/verify | Giữ khung nhưng nâng các điều kiện kiểm tra và trạng thái |
| Trộn có seed, mô-đun xuất Word, bảng/hình | `shuffler`, `docx-export`, các component | Giữ có điều kiện, kiểm thử theo tập tình huống rõ ràng |

Schema hiện chưa có các model riêng cho curriculum, learning outcome, scope, blueprint có nguồn và generation run. `topics`, `tags`, `metadata` hiện chưa tạo thành khung kiến thức có tham chiếu và phiên bản.

### 5.2. Các phát hiện ưu tiên

“P0” ở đây nghĩa là nên xử lý trước khi tuyên bố luồng soạn đề đáng tin cậy; không phải mọi dòng đều là lỗ hổng bảo mật đã khai thác.

| Mã | Ưu tiên | Quan sát trong code hiện tại | Hệ quả | Hướng đề xuất |
|---|---|---|---|---|
| R01 | P0 | `getSubjectConfig(subject, grade)` không dùng `grade`; có ánh xạ TNXH sang Tiếng Việt, Đạo đức sang Lịch sử THPT | Có danh sách môn nhưng có thể dùng sai khuôn/điểm | Tra theo môn + lớp + loại kiểm tra + phiên bản + phạm vi áp dụng; thiếu thì báo chưa có mẫu |
| R02 | P0 | Nút lưu của `ExamWorkspace` gọi `dbSaveExam` vào IndexedDB; kho đề mới đọc API PostgreSQL | Đề vừa sửa không có cùng nguồn lưu với kho đề | Lưu server làm chuẩn, bản nháp cục bộ có nhãn riêng và đồng bộ rõ ràng |
| R03 | P0 | `setIsSaved(true)` chạy cả sau nhánh bắt lỗi lưu | Có thể báo đã lưu dù lưu thất bại | Chỉ báo thành công khi có xác nhận; hiển thị trạng thái lỗi/nháp |
| R04 | P0 | Prompt sinh đề dùng `numMultipleChoice || 12`, `numTrueFalse || 4`, `numShortAnswer || 6` | Yêu cầu 0 câu bị thay bằng số mặc định | Phân biệt thiếu giá trị với 0; kiểm tra số nguyên không âm trước gọi AI |
| R05 | P0 | `difficultyRatio` có trong type nhưng không được dùng trong route sinh đề; chỉ kiểm mảng câu tối thiểu một phần tử | Có thể sinh lệch tỷ lệ/số câu mà API vẫn trả thành công | Lập kế hoạch từng ô ma trận trước, đối chiếu đầu ra với kế hoạch |
| R06 | P0 | Validator sinh câu kiểm số lựa chọn nhưng chưa bắt đủ nhãn duy nhất, trùng nghĩa, phạm vi học hoặc tổng điểm | JSON hợp lệ vẫn không phải đề hợp lệ | Validator chung theo loại câu và validator toàn đề |
| R07 | P0 | Verify Đúng/Sai khởi tạo `allSubMatch = true`, chỉ so khi tìm thấy đánh giá của ý tương ứng | AI trả thiếu ý hoặc mảng rỗng vẫn có đường trả `isMatch = true` | Bắt đủ khóa ý, không trùng, không thiếu; thiếu kết quả là chưa kiểm tra |
| R08 | P0 | API tạo/sửa đề nhận `questionId`, `templateId`, `folderId` nhưng chưa thấy kiểm quyền đầy đủ cho tất cả tham chiếu | Kiểm quyền đề cha chưa đủ cô lập dữ liệu nhiều giáo viên | Kiểm quyền mọi đối tượng liên kết trong transaction; thử bằng hai tài khoản trên DB cô lập |
| R09 | P1 | Ma trận được tổng hợp từ câu đã có; đặc tả dùng một câu yêu cầu chung về giải tích/hình học | Bảng xuất trông như đặc tả nhưng không chứng minh khớp yêu cầu cần đạt | Tách ma trận mục tiêu và ma trận thực tế; đặc tả lấy từ outcome có nguồn |
| R10 | P1 | Ma trận làm tròn điểm đến một chữ số thập phân | Các mức điểm nhỏ có thể bị biểu diễn lệch | Chốt đơn vị điểm và chỉ làm tròn ở biên hiển thị theo quy tắc rõ ràng |
| R11 | P1 | `parse-docx` trích raw text, cắt 45.000 ký tự, yêu cầu AI tìm đáp án; `isCorrect` có default `true` | Có thể mất nội dung/hình/công thức hoặc biến dữ liệu thiếu thành đáp án | Nhập giữ nguyên nguồn; tách trích xuất, giải bổ sung, kiểm định; báo phần bị cắt |
| R12 | P1 | `parse-docx` gọi bộ điều phối key không truyền user context | Không tận dụng đúng đường lấy key đã lưu của tài khoản nếu request không đưa key trực tiếp | Dùng chung auth và context cho mọi tác vụ AI |
| R13 | P1 | Memory tự lưu insight, confidence cao và active; đầu vào có câu hỏi thì gán `QUESTION_VERIFIED` | Phân tích phong cách có thể bị hiểu thành tri thức đã kiểm định | Tách sở thích khỏi kiến thức; AI đề xuất, giáo viên xác nhận trước khi thành quy tắc cá nhân |
| R14 | P1 | Type frontend gồm 7 dạng câu, route generate chỉ nhận 4; trộn cũng chỉ gom 4 dạng | Nếu đưa dạng khác vào hàm trộn, câu có thể bị bỏ khỏi kết quả | Ma trận khả năng theo thao tác: tạo/nhập/sửa/trộn/xuất/chấm; không âm thầm bỏ loại chưa hỗ trợ |
| R15 | P1 | Điểm có nhiều đường tính: cấu hình môn, scoring, submit, `auto-grader` cũ | Khó chứng minh mọi bản xem/xuất/chấm cùng điểm | Một bộ tính theo snapshot cấu hình; loại hoặc cô lập đường cũ sau khi kiểm tra sử dụng |
| R16 | P1 | Bộ test có những ca chỉ kiểm tra chuỗi, in trạng thái sẵn sàng cố định; unit runner luôn in “100% PASS” | Báo cáo dễ tạo cảm giác chất lượng cao hơn bằng chứng | Exit code theo số thất bại, assertion hành vi, bộ dữ liệu chuẩn và test toàn luồng |

**Giới hạn của R08:** đây là thiếu kiểm tra quan sát được tại route, chưa phải kết quả khai thác thực tế. Ví dụ GET đề có trả chi tiết câu liên kết khiến kiểm quyền khi gắn câu đặc biệt quan trọng. Cần chứng minh bằng thử nghiệm riêng trước khi ghi mức ảnh hưởng cuối cùng.

**Giới hạn của R15:** tìm kiếm hiện không thấy nơi gọi `gradeStudentExam` trong `src` ngoài định nghĩa. Không quy lỗi điểm cứng của hàm cũ này cho luồng nộp bài server đang hoạt động; route submit có đọc cấu hình từ snapshot.

### 5.3. Bằng chứng để đọc lại các điểm trọng yếu

- [Chọn cấu hình môn và khối](F:/Workspace/Zazz/ExamCraft/src/lib/subject-config.ts:53).
- [Nút lưu bàn soạn](F:/Workspace/Zazz/ExamCraft/src/components/ExamWorkspace.tsx:350) và [kho IndexedDB](F:/Workspace/Zazz/ExamCraft/src/lib/db.ts:80).
- [Mặc định số câu trong prompt](F:/Workspace/Zazz/ExamCraft/src/app/api/generate-exam/route.ts:212).
- [Kiểm định Đúng/Sai](F:/Workspace/Zazz/ExamCraft/src/app/api/verify-question/route.ts:159).
- [Đặc tả dùng nội dung chung](F:/Workspace/Zazz/ExamCraft/src/lib/matrix-spec-generator.ts:194).
- [Nhập DOCX](F:/Workspace/Zazz/ExamCraft/src/app/api/parse-docx/route.ts:121).
- [Nhận diện memory là đã kiểm định](F:/Workspace/Zazz/ExamCraft/src/app/api/teacher/ai-memory/analyze/route.ts:228).
- [Tạo đề và liên kết câu](F:/Workspace/Zazz/ExamCraft/src/app/api/exams/route.ts:128), [sửa đề](F:/Workspace/Zazz/ExamCraft/src/app/api/exams/[id]/route.ts).
- [Bài kiểm thử gán sẵn mức sẵn sàng](F:/Workspace/Zazz/ExamCraft/tests/test_phase6_security_audit.ts), [kiểm thử chất lượng Word](F:/Workspace/Zazz/ExamCraft/tests/test_phase5_word_quality.ts).

### 5.4. Về trình soạn và xuất Word

Không thấy dependency Tiptap/Lexical trong `package.json`; không nên suy từ lời đoán về website khác rằng ExamCraft đã dùng hoặc bắt buộc phải dùng chúng.

Mô-đun Word có xử lý OMML, nhưng cũng có đường làm sạch/chuyển biểu thức thành văn bản. Các test hiện tại kiểm tra như có chuỗi, có run, dung lượng và header ZIP chưa chứng minh công thức được bảo toàn ngữ nghĩa hoặc phân trang đẹp. Giữ mô-đun, xây bộ mẫu và kiểm tra trực quan trước khi quyết định thay.

Khuyến nghị ưu tiên tính đúng của nội dung và khả năng sửa trong Word. Không hứa xem trước trên web giống Word tuyệt đối. Bài/câu dài quá một trang cần quy tắc cho phép tách có kiểm soát, không thể chỉ “cấm tách câu” cho mọi trường hợp.

## 6. Khung dữ liệu đề xuất: ít khái niệm nhưng rõ trách nhiệm

### 6.1. Sáu nhóm dữ liệu cốt lõi

| Nhóm | Giải thích dễ hiểu | Dữ liệu tối thiểu |
|---|---|---|
| Nguồn | Thông tin đến từ đâu? | ID, tài liệu, đơn vị ban hành, ngày/phiên bản, URL hoặc file, trang/mục, trạng thái kiểm tra |
| Kiến thức và yêu cầu cần đạt | Học sinh cần biết/làm được gì? | Môn, lớp, chương trình, topic/outcome ID, nội dung, giới hạn, nguồn |
| Bản đồ sách/bài học | Kiến thức đó nằm ở đâu trong sách? | Bộ sách, phiên bản, tập/chương/bài, liên kết tới outcome |
| Phạm vi kiểm tra | Lần này giáo viên chọn phần nào? | Bao gồm/loại trừ, outcome và bài được chọn, điều kiện, người chọn, phiên bản |
| Khuôn và phân bổ đề | Cần hỏi bao nhiêu, bằng cách nào? | Loại kiểm tra, phần thi, dạng câu, điểm, nhóm lựa chọn, mức nhận thức, phân bổ theo scope |
| Câu hỏi và kiểm định | Nội dung cụ thể có dùng được chưa? | Nội dung, đáp án, lời giải/rubric, hình/ngữ liệu, nguồn, phiên bản, kết quả các lớp kiểm tra |

Mỗi lần sinh đề còn cần một **hồ sơ lần sinh**: yêu cầu đã chốt, phiên bản các gói dữ liệu, kế hoạch câu, model/prompt version, kết quả và lỗi. Đây là dữ liệu vận hành; không cần bắt giáo viên nhập các trường kỹ thuật này.

### 6.2. Những phân biệt không được bỏ qua

**Chương trình khác sách giáo khoa.** Nên có yêu cầu cần đạt làm điểm liên kết, còn mỗi bộ sách có cách tổ chức bài học. Quan hệ có thể nhiều–nhiều: một bài bao phủ nhiều outcome và một outcome xuất hiện ở nhiều bài. Không ép mọi quan hệ vào một cây cha–con duy nhất.

**Mục lục sách khác kế hoạch thực dạy.** Có sách không có nghĩa biết lớp đã học tới đâu. Tiến độ trường/lớp là một lớp riêng; không tự suy giữa kỳ bằng nửa số chương.

**Dạng câu khác dạng bài.** “Trắc nghiệm bốn lựa chọn” là dạng trả lời; “tìm nghiệm phương trình” là dạng nhiệm vụ. Hai thông tin cần trường riêng.

**Khuôn đề khác kế hoạch của một đề cụ thể.** Blueprint có thể là mẫu; lần tạo đề phải đóng thành kế hoạch cụ thể: mỗi ô nội dung × mức nhận thức × dạng câu có số câu, số điểm nào.

**Câu hỏi khác lần sử dụng câu hỏi.** Điểm và vị trí có thể thuộc lần dùng trong đề. Câu trong ngân hàng được sửa không được âm thầm đổi một đề đã duyệt. Snapshot bài giao hiện có là nền tốt; nên bổ sung phiên bản câu hoặc snapshot ở phiên bản đề đã chốt.

**Đúng/Sai có câu mẹ và các ý.** Cần lưu mức nhận thức theo ý nếu nghiệp vụ yêu cầu, cách tính điểm theo cả nhóm và quy tắc đếm câu/lệnh hỏi. Không gán toàn bộ các ý vào cùng một mức chỉ vì nằm trong một câu.

### 6.3. Ví dụ minh họa hoàn chỉnh

Đây là ví dụ tự đặt để giải thích thiết kế, **không phải ma trận chính thức**:

- Một sách có Bài A, B, C, D.
- Giáo viên chọn A, B, D; C chưa học nên loại.
- Chọn đề tự cấu hình 10 điểm: 8 câu lựa chọn × 0,5 điểm; 2 câu tự luận × 3 điểm.
- Phân bổ A có 4 câu lựa chọn và 1 câu tự luận, tổng 5 điểm; B có 2 câu lựa chọn, tổng 1 điểm; D có 2 câu lựa chọn và 1 câu tự luận, tổng 4 điểm.
- Mỗi câu được gắn outcome và mức nhận thức theo kế hoạch đã chọn.

Trước khi gọi AI, hệ thống kiểm: 10 câu, 10 điểm, mọi outcome nằm trong A/B/D, không thuộc phần C bị loại, và phân bổ mức nhận thức khả thi. Nếu giáo viên đặt tỷ lệ không thể đạt chính xác với số câu/điểm hiện có, hệ thống đưa ra phương án điều chỉnh để chọn; không âm thầm sửa.

Sau khi AI sinh, kiểm lại **nội dung thật** có dùng kiến thức C hay không. Việc AI gắn đúng ID không đủ chứng minh nội dung đúng phạm vi.

### 6.4. Điểm số

Khuyến nghị dùng điểm nguyên theo đơn vị 1/1000 cho tính toán trong lõi mới, nếu các biểu điểm được hỗ trợ phù hợp độ chính xác đó. Quy tắc không biểu diễn được phải bị phát hiện hoặc dùng kiểu decimal/rational đã thống nhất; không tự làm tròn.

Schema DB hiện có `Decimal(5,2)` và `Decimal(6,2)`, nên không thể hứa lưu chính xác mọi mức như 0,125 mà không đổi cách lưu. Ví dụ này chỉ minh họa giới hạn kỹ thuật, không xác nhận mức đó thuộc một quy định giáo dục.

Mọi đường hiển thị, xuất, chấm và ma trận phải dùng cùng biểu điểm của phiên bản đề. Không lấy mặc định môn để ghi đè điểm giáo viên đã chốt. Quy tắc số thực cần thống nhất miền giá trị, đơn vị, làm tròn và sai số chấp nhận.

## 7. Luồng AI nên được tổ chức thế nào?

### 7.1. Luồng đề xuất

1. **Chuẩn hóa đầu vào:** môn, lớp, chương trình, sách, loại kiểm tra, thời lượng, scope và yêu cầu.
2. **Nạp gói đã duyệt:** chỉ những nguồn/outcome/blueprint đúng phạm vi và phiên bản. Không đưa toàn kho vào prompt.
3. **Lập kế hoạch bằng code:** phân bổ slot câu, dạng câu, điểm, outcome và mức nhận thức. Đây là ràng buộc có thể kiểm tra.
4. **Tìm câu có sẵn:** lấy câu phù hợp và có trạng thái đủ dùng; thiếu mới sinh thêm.
5. **AI sinh theo lô nhỏ:** mỗi câu bám một slot; hệ thống cấp ID, AI không tự quyết lại tổng cấu trúc.
6. **Kiểm tra tự động:** schema, nhãn, số câu/ý, điểm, hình, cú pháp công thức, tham chiếu và trùng lặp có thể phát hiện.
7. **Kiểm tra chuyên môn:** giải độc lập, công cụ tính với dạng được hỗ trợ, đối chiếu phạm vi; không đạt thì sửa/sinh lại câu lỗi với số lần tối đa.
8. **Giáo viên xem và duyệt:** chỉ rõ câu nào chưa kiểm định, câu nào AI bất đồng, nguồn nào thiếu.
9. **Đóng phiên bản:** lưu đề, đáp án, cấu hình, nguồn và kết quả kiểm tra; xuất từ cùng phiên bản đó.

Không cần dựng hệ thống nhiều dịch vụ ngay. Các bước trên có thể là module trong ứng dụng hiện tại. Khi thời gian chạy dài hoặc cần tiếp tục sau gián đoạn mới bổ sung job bền vững/hàng đợi phù hợp; trạng thái công việc nên có ngay trong thiết kế.

### 7.2. Kiểm định có nhiều trục, không có một chữ “verified” cho tất cả

| Trục | Phần mềm/AI có thể kiểm gì? | Giới hạn |
|---|---|---|
| Cấu trúc | Đủ trường, đúng loại câu, nhãn không trùng | Không chứng minh kiến thức đúng |
| Nguồn | Đúng tài liệu, vị trí trích, phiên bản | URL tải được hoặc tiêu đề đúng chưa chứng minh diễn giải đúng |
| Phạm vi | Tham chiếu hợp lệ, loại trừ, kiểm nội dung | Nhãn AI tự gắn cần đối chiếu ý nghĩa |
| Nội dung | Tính toán, lời giải độc lập, đối chiếu đáp án | Công cụ tính chỉ đáng tin trong dạng và giả thiết được hỗ trợ |
| Đề hoàn chỉnh | Số câu, điểm, phân bổ, ngữ liệu/hình liên kết | Đề hợp lệ cấu trúc có thể vẫn cần duyệt sư phạm |
| Xuất bản | Không mất câu, hình, công thức, đáp án | Cần kiểm trực quan và phần mềm đọc đích |

Mỗi kết quả gắn `questionVersion` hoặc hash nội dung, phương pháp, thời điểm, kết quả và lỗi. Khi sửa nội dung, đáp án hay hình, kết quả kiểm định liên quan phải mất hiệu lực. “Chưa kiểm tra” khác “không đạt”. Điểm confidence do mô hình tự báo chỉ là tín hiệu, không phải xác suất đúng đã được đo.

### 7.3. Nhập Word, ảnh, văn bản

Tách ba việc: **trích đúng tài liệu gốc**, **đề xuất đáp án/lời giải còn thiếu**, **kiểm định**. Đáp án có trong tài liệu và đáp án AI giải thêm phải phân biệt được.

Giữ file gốc, vị trí câu, hình và cảnh báo phần không đọc được. Không coi nội dung trong tài liệu nhập là chỉ dẫn hệ thống. OCR có thể dùng mô hình hoặc công cụ khác tùy tài liệu; lời khẳng định cũ rằng tuyệt đối không dùng OCR truyền thống không phải yêu cầu hợp lý cho thiết kế.

### 7.4. Memory cá nhân

Giữ ý tưởng nhớ phong cách giáo viên, nhưng đặt sau các ràng buộc của đề. Ví dụ “thích bài thực tế” được phép ảnh hưởng ngữ cảnh; không được làm đổi số câu, đưa kiến thức ngoài scope hay vượt quy tắc bắt buộc.

Memory mới nên ở trạng thái đề xuất, có nguồn mẫu và thao tác chấp nhận/tắt/xóa. Không suy ra “giáo viên muốn thế” chỉ vì AI phân tích vài câu. Cơ chế gộp hiện tại theo cùng category/subject có thể ghi đè hai sở thích khác nhau; nên có lịch sử và tiêu chí gộp cụ thể.

### 7.5. Nhà cung cấp, model và hạn mức

Code đã chuyển trọng tâm sang BYOK, trong khi tài liệu cũ còn nói bảy key hệ thống. Khuyến nghị trước mắt giữ BYOK, thống nhất auth/context/log cho mọi tác vụ; chưa cần đổi nhà cung cấp để sửa vấn đề dữ liệu.

`checkUserAiQuota` đang ước lượng số key × 1.500 và luôn trả `allowed: true`. Google ghi quota theo **project**, khác nhau theo model/tier, RPD reset theo giờ Pacific. Vì vậy phép nhân key không đại diện chắc chắn cho hạn mức thực. [Tài liệu Google](https://ai.google.dev/gemini-api/docs/rate-limits).

Nên tách số liệu “lượt gọi ứng dụng ghi nhận” khỏi “quota nhà cung cấp”; không gọi con số ước lượng là dung lượng thực. Model có trong danh mục code chưa chứng minh mọi tài khoản gọi được. Chọn model bằng kiểm thử chất lượng/khả dụng trên tác vụ cụ thể, không theo lời quảng cáo trong comment. Lưu model thực dùng khi fallback để truy vết.

## 8. Tổ chức kho cho cả bạn và AI mà không gây rối

### 8.1. Một cấu trúc gọn được đề xuất, chưa tạo trong lượt này

```text
knowledge/
  README.md                # Cách đọc và quy tắc chung
  schemas/                 # Định nghĩa dữ liệu hợp lệ
  sources/                 # Danh mục và tài liệu nguồn
  packages/                # Gói môn/lớp/phạm vi cùng phiên bản
  reviews/                 # Lỗi, mâu thuẫn, kết quả kiểm tra và duyệt
docs/
  DECISIONS.md             # Điều đã chốt, lý do và điều bị thay thế
```

Trong một gói, ban đầu chỉ cần manifest, dữ liệu chương trình/bài học, blueprint và một số câu mẫu. Scope từng đề do giáo viên chọn thuộc dữ liệu ứng dụng; chỉ scope mẫu dùng lại mới đưa vào gói tri thức. Không bắt tạo sẵn hàng trăm thư mục môn–lớp–học kỳ–loại đề.

Raw/Corpus/Validation vẫn là những vai trò cần có, nhưng tên và số lượng thư mục không làm tăng độ đúng. Không cần đồng thời duy trì cấu trúc ba tầng, năm tầng và bảy tầng từ ba cuộc chat.

### 8.2. JSON hay Markdown?

**JSON là dữ liệu chuẩn để máy đọc; Markdown là hướng dẫn/báo cáo và bản xem cho người.** Nếu có bản câu hỏi Markdown, ưu tiên sinh từ JSON hoặc có quy tắc nhập một chiều. Không cho cả JSON và Markdown cùng được sửa độc lập rồi tranh nhau làm bản chuẩn.

File nguồn lớn có thể lưu ngoài Git khi cần, nhưng manifest vẫn có ID, vị trí và hash. Không dùng tên file để quyết định duy nhất môn/lớp/loại đề. Không đưa tài liệu học sinh hoặc khóa API vào kho tri thức.

### 8.3. Quy tắc quản lý tối thiểu

- ID ổn định, tên hiển thị đổi được. Đổi tên bài không làm đổi liên kết câu hỏi cũ.
- Gói có version; bản đã phát hành giữ nguyên nội dung, sửa bằng phiên bản mới.
- Trạng thái tối thiểu: nháp → cần duyệt → được duyệt; có thể bị thay thế/thu hồi.
- Kết quả kiểm tra schema không tự chuyển thành đã duyệt chuyên môn.
- Mỗi khẳng định chính thức gắn bằng chứng cụ thể; cấu hình giáo viên gắn người tạo và nhãn tùy chỉnh.
- Giữ cả hai bên khi nguồn mâu thuẫn, không âm thầm chọn bên mới hơn trong chat.
- Ghi quyền sử dụng/chia sẻ theo nguồn. “Tải miễn phí” không được tự hiểu là được phép phân phối lại; bước lựa chọn học liệu phải xác định quyền phù hợp.

**Không cần vector database ngay.** Trước hết lọc theo ID, môn/lớp/outcome và trạng thái. Tìm kiếm ngữ nghĩa chỉ bổ sung khi có nhu cầu, không được vượt qua bộ lọc phạm vi hoặc đưa bản chưa duyệt vào làm chuẩn.

## 9. Giữ, sửa, viết thêm và để sau

| Nhóm | Quyết định đề xuất | Lý do |
|---|---|---|
| Framework, DB, auth, ownership | Giữ và kiểm tra hồi quy | Có nền tảng, thay stack không giải quyết sai nghiệp vụ |
| Dashboard và bàn soạn | Giữ bố cục, sửa lưu/đọc/version | Giáo viên cần biết chắc đề đang được lưu ở đâu |
| Mô hình câu hỏi, đề, bài giao | Mở rộng có chuyển đổi tương thích | Tận dụng dữ liệu hiện có, không mất snapshot |
| Cấu hình môn hiện tại | Chuyển thành preset có phạm vi/trạng thái | Không mặc định các JSON hiện tại là chuẩn chính thức |
| Sinh đề và kiểm định | Tách thành các bước dùng hợp đồng chung | Sửa prompt riêng lẻ sẽ tiếp tục làm các route lệch nhau |
| Taxonomy, outcome, scope, allocation, evidence | Viết thêm lõi mới | Đây là khoảng thiếu quan trọng nhất so với mục tiêu của bạn |
| Bộ tính điểm và ma trận | Hợp nhất và sửa | Một cấu hình phải điều khiển mọi đầu ra |
| Import/export và trộn | Giữ, bổ sung tập kiểm chứng và cảnh báo | Có code hữu ích nhưng chưa chứng minh đủ các dạng nội dung |
| Phòng thi, lớp học | Duy trì, chưa mở rộng trong đợt ưu tiên dữ liệu | Không xóa tính năng đã có; không để nó lấn át mục tiêu soạn đề |
| Trợ lý thư ký, AI quản trị, tự học phong cách rộng | Hoãn mở rộng | Chưa giải quyết được tính đúng của nguồn/scope/câu hỏi |
| Crawl toàn mạng, tự phê duyệt dữ liệu, microservices | Chưa làm | Tăng khối lượng và rủi ro trước khi kiểm chứng được luồng nhỏ |

## 10. Thứ tự triển khai sau khi bạn chốt

### Bước A — Chốt khung bằng một ví dụ dễ đọc

Đầu ra: từ điển sáu nhóm dữ liệu, một đề minh họa đi từ scope đến câu hỏi, danh sách quyết định. Chưa cần viết bộ chương trình lớp 1–12. Đạt khi bạn đọc và thấy đúng cách giáo viên chọn kiến thức và lập đề.

### Bước B — Làm một gói mẫu có nguồn và kiểm tra được

Đề xuất chọn Toán THPT làm gói kiểm chứng đầu vì repo đã có nhiều xử lý toán, nhưng **môn/lớp/bộ sách cụ thể vẫn chờ bạn chọn**. Gói nhỏ nên có cả một khuôn có căn cứ và một đề định kỳ tự cấu hình để thử được scope.

Đầu ra: schema, nguồn, một nhánh bài học/outcome, một blueprint đầy đủ, câu mẫu, trường hợp sai cố ý và báo cáo kiểm tra. Không chỉ làm ba JSON đề tốt nghiệp rồi coi đã giải quyết toàn bộ bài toán chọn kiến thức.

### Bước C — Sửa nền tảng trước khi nối AI mới

Ưu tiên R02/R03 lưu server, R04 số 0, R07 kiểm định thiếu ý và R08 quyền tham chiếu; chuẩn hóa hợp đồng câu/đề giữa UI, API, DB. Tạo baseline dữ liệu và kế hoạch rollback trước migration.

Đạt khi tạo → lưu → mở lại → sửa → lưu → tải lại không mất câu/điểm/hình; tài khoản khác không đọc/gắn dữ liệu riêng không được phép.

### Bước D — Tích hợp kế hoạch đề và các lớp kiểm định

Nối gói dữ liệu, scope, allocation vào màn hình tạo đề; sinh theo slot; retry giới hạn; lưu generation run và trạng thái kiểm tra. Giữ đường tương thích cho đề cũ, gắn nhãn “chưa ánh xạ chương trình” thay vì tự gán outcome.

Đạt khi phần mềm phát hiện được cả đề đúng cấu trúc nhưng sai scope, không chỉ JSON lỗi.

### Bước E — Nghiệm thu và mở rộng theo nhóm có khác biệt

Sau gói đầu, thử ít nhất một phạm vi có đặc thù khác như Văn/Anh hoặc một lớp nhỏ hơn để kiểm chứng mô hình dùng chung. Mỗi gói có trạng thái hỗ trợ và bộ mẫu riêng. Không suy từ Toán đạt sang mọi môn đạt.

Không ước lượng số ngày chắc chắn trước khi có số lượng nguồn, chất lượng tài liệu và tiêu chí nghiệm thu. Từng bước nên kết thúc bằng đầu ra cụ thể, không bằng lời tuyên bố “hoàn thành 100%”.

## 11. Kiểm thử nào mới đủ cho hướng này?

### 11.1. Các ca bắt buộc trong gói đầu

| Tình huống | Kỳ vọng |
|---|---|
| Chọn 0 câu Đúng/Sai | Không tự sinh 4 câu |
| Yêu cầu lớp 3 nhưng chỉ có mẫu Toán THPT | Báo thiếu mẫu phù hợp, không dùng mặc định sai |
| Scope chọn A/B/D, loại C | Câu cần C bị đánh dấu ngoài phạm vi |
| Bốn lựa chọn đều có nhãn A | Validator chặn dù đủ bốn phần tử |
| Hai lựa chọn tương đương | Phát hiện trong dạng hỗ trợ, nếu chưa hỗ trợ thì yêu cầu duyệt |
| AI chỉ kiểm 2/4 ý Đúng/Sai | Trạng thái chưa đủ kiểm định, không báo khớp |
| Tổng phần bằng 10 nhưng phân bổ theo chủ đề sai | Kiểm tra allocation thất bại |
| Không có nguồn hoặc nguồn không hỗ trợ quy tắc | Không được phát hành dưới nhãn chính thức |
| Sửa câu sau khi đã kiểm định | Kết quả cũ mất hiệu lực với bản mới |
| Sửa câu ngân hàng sau khi giao bài | Snapshot và điểm bài đã giao giữ nguyên |
| Lưu server lỗi hoặc mất mạng | Báo nháp/chưa đồng bộ, không báo đã lưu server |
| Hai người sửa cùng phiên bản | Phát hiện xung đột, không ghi đè âm thầm |
| Trộn câu có passage/ý con/dạng chưa hỗ trợ | Không mất câu, không tách sai nhóm, đáp án theo đúng ID |
| Nhập file có ảnh hoặc công thức không đọc được | Báo rõ vị trí thiếu, không tự bịa phần còn lại |
| Xuất Word/PDF | Đủ câu, điểm, hình, đáp án; kiểm trực quan công thức và ngắt trang |

### 11.2. Đánh giá chất lượng AI

Chuẩn bị một tập đề/câu có nguồn, đáp án và đánh giá của giáo viên. Tách tập ví dụ đưa vào prompt khỏi tập dùng nghiệm thu. Ghi model, prompt và phiên bản dữ liệu để so sánh được.

Theo dõi riêng: đúng đáp án, đúng scope, đúng dạng/mức nhận thức, đủ dữ kiện/hình, tỷ lệ giáo viên phải sửa, chi phí và thời gian. Không gộp thành một điểm “AI tốt 95%” khi chưa định nghĩa mẫu đo.

Ngưỡng đề xuất: ràng buộc cấu trúc phải được kiểm tra đầy đủ trước xuất bản; câu chưa có kiểm định chuyên môn phù hợp phải hiển thị chờ duyệt. Con số mục tiêu chất lượng nội dung cần chốt cùng giáo viên sau khi có tập mẫu, không tự bịa một tỷ lệ bảo đảm.

### 11.3. Đánh giá lại các báo cáo cũ

20/20 unit test đạt là tín hiệu tốt về baseline, nhưng không bác bỏ các lỗi ở mục 5. Một số ca khẳng định đúng hành vi đơn giản; một số chỉ kiểm sự hiện diện hoặc cấu hình do chính dự án đặt ra.

Ví dụ test Word kiểm có dữ liệu ZIP không đủ chứng minh công thức đúng. `test_phase6_security_audit.ts` in danh sách `PRODUCTION_READY` gán sẵn không phải thử toàn bộ môn. Unit runner bắt lỗi từng ca nhưng cuối file vẫn in “100% PASS” và chưa thấy đặt mã thoát lỗi theo số ca thất bại.

Các báo cáo QA cũ có phạm vi/commit riêng. Không dùng nguyên kết quả mutation, tải hoặc bảo mật của chúng như kết quả mới trên working tree này; cũng không mặc định mọi lỗi cũ vẫn còn.

## 12. Bạn cần chuẩn bị gì, AI làm gì?

| Bạn | AI hỗ trợ |
|---|---|
| Chọn giáo viên/nhóm dùng thử và gói đầu | Đề xuất cách chia gói, từ điển dữ liệu và ví dụ dễ đọc |
| Chỉ rõ loại đề cần làm trước, bộ sách nếu có | Tìm nguồn, ghi vị trí bằng chứng, so sánh mâu thuẫn |
| Gửi tài liệu đang có nếu thuận tiện | Bóc tách và chuẩn hóa, không bắt bạn gõ lại |
| Chốt những lựa chọn ảnh hưởng sản phẩm | Giải thích lựa chọn và hệ quả, không tự chốt thay |
| Có người kiểm tra chuyên môn gói mẫu | Chuẩn bị ca kiểm tra, giải đối chiếu và danh sách chỗ chưa chắc |

Ban đầu chỉ cần 3–5 tài liệu tốt để thử quy trình, không phải số lượng tối thiểu để chứng minh chất lượng toàn bộ hệ thống. Ưu tiên nguồn rõ và có đáp án/hướng dẫn chấm, nhưng vẫn cho nhập tài liệu thiếu đáp án với trạng thái chưa hoàn chỉnh.

Chưa cần thuê hoặc điều phối nhiều AI cùng lúc. Một lượt nghiên cứu và một lượt phản biện có thể đủ cho gói đầu. Khi giao tiếp qua nhiều chat, mỗi lượt cần mang theo: phạm vi, version schema, ID đã có, nguồn, điều đã chốt và phần chưa chắc. Đầu ra tối thiểu là dữ liệu + bằng chứng + vấn đề còn mở; không nhất thiết năm file mới cho mọi nhiệm vụ nhỏ.

## 13. Bảng chốt hướng để trao đổi tiếp

Tám lựa chọn sản phẩm trong link được giữ làm định hướng tạm thời, không yêu cầu bạn trả lời lại từ đầu. Những quyết định còn cần chốt cho bước kế tiếp là:

| Mã | Quyết định | Phương án tôi khuyên | Trạng thái |
|---|---|---|---|
| D01 | Giữ hay viết lại dự án? | Giữ nền tảng, cải tiến từng module; chỉ viết mới lõi còn thiếu | Đề xuất |
| D02 | Đầu ra kế tiếp là gì? | Bản khung dữ liệu dễ đọc + một ví dụ xuyên suốt, rồi mới schema chính thức | Đề xuất |
| D03 | Gói đầu chọn phạm vi nào? | Một môn/lớp/bộ sách gần nhu cầu nhóm giáo viên nhất; Toán THPT là ứng viên thuận với code | Chưa chọn cụ thể |
| D04 | Phạm vi lớp 1–12 triển khai thế nào? | Giữ mục tiêu rộng; công bố mức hỗ trợ và kiểm chứng theo từng gói | Đề xuất để dung hòa mục tiêu và chất lượng |
| D05 | Nguồn lưu đề chính | PostgreSQL; local chỉ là nháp/cache hoặc dữ liệu cũ cần nhập | Phù hợp thiết kế cũ, cần thực hiện nhất quán |
| D06 | Quyền của AI với dữ liệu chuẩn | Đề xuất/trích xuất/sinh; không tự phê duyệt nguồn hay nội dung | Đề xuất |
| D07 | Khi thiếu dữ liệu chuẩn | Cho soạn tùy chỉnh có cảnh báo; không tự nhận chính thức | Đề xuất |
| D08 | AI cá nhân và tính năng phụ | Giữ cái đã có nhưng hoãn mở rộng; ưu tiên scope, câu hỏi, lưu và xuất | Đề xuất |
| D09 | Ai duyệt chuyên môn gói đầu? | Một giáo viên phù hợp với môn/lớp đó | Cần xác định |

Bạn có thể phản hồi ngắn: **“Đồng ý hướng giữ và cải tiến; trước hết xây khung dữ liệu. Gói đầu là môn…, lớp…, sách…, loại đề…; người kiểm tra chuyên môn…”**. Nếu chưa chọn được gói đầu, vẫn có thể cùng chốt khung khái niệm bằng ví dụ minh họa, chưa gắn nhãn dữ liệu chính thức.

## 14. Phạm vi thay đổi của lượt phân tích này

Chỉ tạo báo cáo này. Không chỉnh mã nguồn, schema, dependency, cấu hình, tài liệu cũ hoặc dữ liệu người dùng. Những sơ đồ thư mục, lộ trình, trạng thái và mô hình mới trong báo cáo là **đề xuất**, chưa được tạo hoặc áp dụng.

Các việc còn mở được nêu để bạn chốt hướng: phạm vi gói đầu, người duyệt chuyên môn, nguồn áp dụng hiện hành và tiêu chí nghiệm thu nội dung. Đây là bước phân tích chuẩn bị, không phải chứng nhận dự án đã sẵn sàng phát hành.
