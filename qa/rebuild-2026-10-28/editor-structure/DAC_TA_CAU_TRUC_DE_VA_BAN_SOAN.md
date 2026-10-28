# Đặc tả: cấu trúc đề (phần · nhóm · câu · ý) và bàn soạn gọn — giao Codex

Ngày 28/10/2026. Claude viết theo hai lượt trao đổi với chủ dự án; chủ dự án đã đồng ý hướng đi. **Thay** hướng "gom vùng soạn" ở `5d1fec3` (khối "Thêm / sửa phần và nội dung dùng chung", ô "Thuộc phần" ở từng câu, thẻ "Thông tin đề", hộp "Yêu cầu ra đề"). Giữ toàn bộ logic an toàn đã có (nháp, CAS/version, kiểm quyền, xác nhận từng trường, nhật ký câu, khôi phục) — chỉ đổi mô hình cấu trúc và cách trình bày.

Nền: nhánh `rebuild/2026-10-local`, mốc `e923f89` (gồm sửa của Claude `52099b3`).

---

## A. Vấn đề hiện tại (đã kiểm trong mã và ảnh chụp)

### A1. Cấu trúc đề sai từ mô hình
- Đề là **một danh sách câu phẳng** (`Exam.questions`). "Phần" chỉ là danh sách nhãn riêng (`Exam.sections`), mỗi câu tự chọn `sectionId`. "Ngữ liệu" là nhãn `passageId` gắn vào từng câu.
- Bản in chỉ hiện tên phần **khi có câu gắn vào** (`A4Preview.tsx:109`, `docx-export.ts:540`): giáo viên bấm "Thêm phần", gõ tên, không thấy gì → lỗi "viết phần mà không thêm phần" chủ dự án gặp.
- Câu của hai phần xen nhau → tên phần in lặp nhiều lần. Ngữ liệu đứng "ngang hàng" với câu thay vì mở đầu nhóm câu.
- Ý nhỏ a/b/c chỉ có ở câu Đúng/Sai (`sub_questions`); câu tự luận không có ý có điểm riêng.

### A2. Thêm câu không nhất quán
- Ngân hàng, Nhập Word/Ảnh: **nối vào cuối đề**. Sinh bằng AI: **thay cả đề** (`GenerateModal replacesDocument`, `applyGeneratedDraft`). Không có cách thêm vào giữa hoặc vào một phần cụ thể.

### A3. Bàn soạn: một việc nhiều cửa, chữ kỹ thuật, điện thoại chật
- Sửa thông tin đề có 3 cửa (chip Header, nút "Thiết lập đề", nút "Chỉnh thông tin"); biểu mẫu mở có 2 tiêu đề + 2 nút đóng ("Thu gọn", "Đóng").
- Thêm câu có 3 cửa (menu, 4 ô màn trống, nút cuối danh sách). Điện thoại có 2 nút xem đề (công tắc + nút nổi che nội dung).
- Hai khái niệm "cần chú ý" tên gần giống: "⚠ n cần xem" (rà soát) và "Cần xử lý (n)" (nháp câu); hộp "Cần xử lý" chiếm nửa đầu cột soạn.
- Chữ cho lập trình viên lộ ra màn hình: "Bản xem trước phản ánh thay đổi hợp lệ đang nhập…", "Chỉ áp dụng các trường bạn sửa…", ngày giờ ISO `2026-10-28T09:13:20.748Z`, "Cất riêng, không chờ áp dụng", "Kế hoạch cần đối chiếu; chưa thể xác nhận khớp".
- Thông tin đề hiện 3 lần (chip, thẻ, đầu trang A4). "Yêu cầu ra đề · tùy chọn" là tên mơ hồ cho phạm vi + ma trận + khung nhận thức.
- Điện thoại 375px: 5 thanh chồng (thanh mỏng, tab menu, tên đề, công cụ, công tắc) ≈ 265px trước nội dung; bảng ma trận 7 cột vỡ.
- Mã: các tệp `components/editor/*` và `ExamWorkspace.tsx` có dòng > 1.000 ký tự, logic bảo vệ đan vào JSX → khó sửa, ai sửa cũng chỉ dám thêm.

---

## B. Mô hình cấu trúc mới

### B1. Bốn cấp, cấp nào cũng tùy chọn

| Cấp | Ví dụ thực tế | Thuộc tính | Kiểu đánh số |
|---|---|---|---|
| **Phần** | PHẦN I. TRẮC NGHIỆM; I. ĐỌC HIỂU; Section A | tiêu đề, lời dặn (rich text), điểm phần (hiển thị/kiểm), cấu hình điểm cũ (`pointsPerQuestion`, `progressiveScoring`) | I, II… · A, B… · 1, 2… · không số |
| **Nhóm** | "Bài 1", "Đọc đoạn văn sau và trả lời câu 1–5", nhóm câu chung ngữ liệu | tiêu đề/lời dẫn tùy chọn, **ngữ liệu tùy chọn** (văn bản, ảnh, bảng, nguồn) | 1, 2… · không số |
| **Câu** | Câu 1, Câu 2 | như hiện tại | liên tục cả đề (mặc định) hoặc đánh lại từ 1 mỗi phần |
| **Ý** | a) b) c); 1.1 1.2; ý Đúng/Sai | nội dung, điểm, đáp án/lời giải/barem riêng | a, b · 1.1, 1.2 · i, ii |

- Không cho lồng sâu hơn (Phần không chứa Phần; Nhóm không chứa Nhóm). Cấp sâu hơn (1.1.1) giáo viên gõ trong nội dung câu. Lý do: đề phổ thông VN (THPT 2025 Phần I/II/III, Văn Đọc hiểu/Viết, Anh Section/passage, tự luận Toán Bài 1 a/b/c) đều nằm trong 4 cấp; lồng vô hạn làm khó đọc, khó in Word, khó trộn đề.
- Đề không chia phần vẫn hợp lệ: câu đứng thẳng ở gốc.
- **Ngữ liệu không ngang hàng với câu**: ngữ liệu là phần mở đầu của Nhóm, luôn in ngay trên câu đầu tiên của nhóm.

### B2. Dữ liệu (ưu tiên không migration Prisma)
Tài liệu soạn đã được lưu nguyên trong `Exam.metadata.workspaceDocument` và cột `Exam.sections` (Json); `ExamQuestion` được ghi lại mỗi lần lưu (`exam-persistence.ts writeDocumentQuestions`). Vì vậy:

- Thêm vào `Exam` (tài liệu) trường **`outline`**: mảng nút có thứ tự, mỗi nút `{ id, kind: 'part' | 'group' | 'question', title?, instructions?, numbering?, passageId?, children?: nút[] , questionId? }`. Gốc chứa part/group/question; part chứa group/question; group chứa question. Thứ tự câu khi in/xuất/trộn = duyệt cây theo thứ tự.
- `Exam.questions` giữ nguyên là kho câu của đề (để các chỗ đọc cũ không vỡ), **thứ tự của nó được đồng bộ theo `outline`** mỗi lần sửa. `Question.sectionId` và `Question.passageId` trở thành **giá trị suy ra** từ outline (part gần nhất; passage của group) để mã cũ (Word, trộn, chấm, bài làm) vẫn chạy trong lúc chuyển dần.
- `Exam.sections` (cột Json) lưu danh sách Phần suy ra từ outline (giữ `pointsPerQuestion`/`progressiveScoring`), `ExamQuestion.sectionId` = id Phần gần nhất. Không đổi bảng.
- Ý của câu: thêm `Question.parts?: { id, label?, content, points?, answer?, solution?, rubric? }[]` dùng cho tự luận/trả lời ngắn; câu Đúng/Sai giữ `sub_questions` (không gộp ép, chỉ dùng chung bộ hiển thị/đánh số).
- Ngân hàng câu hỏi giữ `Passage` + `Question.passageId` như hiện tại. Chèn câu có ngữ liệu từ ngân hàng → tạo (hoặc dùng lại) một Nhóm có ngữ liệu đó tại vị trí chèn.
- **Nếu Codex thấy bắt buộc phải đổi schema Prisma: dừng, ghi lý do, chờ chủ dự án duyệt** (quy tắc: sao lưu `pg_dump` DB chính và duyệt trước mọi thay đổi schema DB chính).

### B3. Chuyển đề cũ (đọc là nâng cấp, không ghi ngầm)
Trong `normalizeExamDocument` / `fromDatabaseExam`, khi đề chưa có `outline`:
1. Mỗi `section` cũ có câu → một nút Phần (giữ id, tên, cấu hình điểm). Phần cũ không có câu → nút Phần rỗng (từ nay hiện ra được).
2. Các câu **liền nhau** cùng `passageId` → một Nhóm có ngữ liệu đó. Câu cùng passage nhưng không liền nhau → nhiều Nhóm cùng trỏ một passage (giữ đúng thứ tự in hiện tại, không tự xếp lại).
3. Câu không phần → ở gốc. Section mặc định `workspace` ("Nội dung bài") của bản lưu cũ → **không** tạo Phần hiển thị.
4. Không đổi ID câu, thứ tự, điểm, đáp án, ảnh, nguồn. Chỉ lưu `outline` khi giáo viên lưu đề lần sau (qua CAS như thường).
- Bài đã giao/ảnh chụp đề cho học sinh (`snapshot-scoring`, `public-exam`, `attempt-grading`, `answer-correction`) phải đọc được cả bản cũ lẫn bản có outline. Bài làm đã nộp không bị chấm lại khác.

### B4. Những chỗ phải đọc outline
A4Preview (Đề / Đáp án / Lời giải / Ma trận / Song song), `docx-export` (mọi loại Word), `ExamPresentation`, trang làm bài `/a/[publicId]` và `/test/[id]`, `public/share`, `shuffler`/`question-order` (**trộn trong từng Phần; câu trong một Nhóm có ngữ liệu đi cùng nhau; có tùy chọn trộn thứ tự nhóm trong phần**), `exam-review` (rà soát: Phần rỗng, Nhóm có ngữ liệu nhưng không câu, ý thiếu điểm/đáp án), `exam-template` (mẫu lưu cả dàn ý không câu), `generation-plan`/ma trận (đếm theo câu như cũ), `copilot-submission`, `import-document`/`exam-parser` (nhận "PHẦN I", "Câu 1", "a)" thành nút tương ứng khi có thể).

---

## C. Bàn soạn mới

### C1. Bố cục máy tính
```
┌Menu┐┌────────────────────────────────────────────────────────────────────┐┌Rail┐
│    ││ Tên đề ✎                                   ● Đã lưu   [Giao bài]     ││ 🤖 │
│    ││ [+ Thêm ▾] [Thông tin đề] [✨ Sửa bằng AI]          [Xuất ▾] [⋯]      ││ 🧠 │
│    ││ ┌ Soạn (trông như tờ đề) ───────────────┐ ┌ Xem đề | Đáp án | … ─────┐ ││ 🔑 │
│    ││ │ (dải nhỏ) Có 1 câu soạn dở · Mở       │ │                           │ ││    │
│    ││ │ PHẦN I. TRẮC NGHIỆM ✎  (3 điểm)  ⋯   │ │      Trang A4             │ ││    │
│    ││ │   Câu 1 …   [Sửa] [✨▾] [⋯]           │ │                           │ ││    │
│    ││ │   ＋ Thêm vào Phần I                   │ │                           │ ││    │
│    ││ │ PHẦN II. ĐỌC HIỂU ✎                   │ │                           │ ││    │
│    ││ │   ▣ Ngữ liệu: "Đoạn văn…" ✎           │ │                           │ ││    │
│    ││ │     Câu 2 … Câu 3 …                   │ │                           │ ││    │
│    ││ │   ＋ Thêm vào Phần II                  │ │                           │ ││    │
│    ││ │ ＋ Thêm phần                           │ │                           │ ││    │
│    ││ └───────────────────────────────────────┘ └───────────────────────────┘ ││    │
└────┘└────────────────────────────────────────────────────────────────────┘└────┘
```
- **Thanh trên**: chỉ tên đề, chấm lưu (bấm mở chi tiết như hiện có), Giao bài. **Bỏ chip thông tin đề.** Rà soát: bỏ nút cố định, tự hiện trước Giao bài/Xuất (đã có `reviewBefore`) và nằm trong menu ⋯ ("Rà soát đề").
- **Thanh công cụ**: `+ Thêm ▾` (thêm vào cuối đề hoặc vào phần đang chọn) · `Thông tin đề` · `Sửa bằng AI` · `Xuất ▾` · `⋯` (Rà soát đề, Dùng mẫu / lưu thành mẫu, Cùng soạn, Kết quả nếu đã giao, Trộn mã đề nếu không nằm ở Xuất).
- **Thông tin đề** mở thành **bảng bên phải** thay chỗ khung xem trong lúc sửa (đóng thì khung xem quay lại); máy hẹp thì toàn màn. Gồm các mục có tên rõ: *Thông tin chung* (môn, lớp, thời gian, cách đánh giá), *Dòng in đầu đề* (sở, trường, mã đề, năm học…), *Phạm vi kiến thức* (tùy chọn), *Ma trận đề* (tùy chọn), *Khung nhận thức* (tùy chọn). Một tiêu đề, một nút Đóng, một nút Áp dụng. Xem thử trực tiếp trước khi Áp dụng giữ như `27af86a`.
- **Bỏ**: thẻ "Thông tin đề" và hộp "Yêu cầu ra đề" ở cột trái; khối "Thêm / sửa phần và nội dung dùng chung"; ô "Thuộc phần / nội dung dùng chung của câu n" trong từng câu.

### C2. Cột soạn = dàn ý của tờ đề
- Mỗi **Phần** là một khối: tiêu đề và lời dặn sửa tại chỗ (bấm vào là sửa), điểm phần, menu ⋯ (Đổi kiểu đánh số, Lên/Xuống, Xóa phần — hỏi giữ câu ra gốc hay xóa luôn).
- Mỗi **Nhóm** có ngữ liệu: khối ngữ liệu sửa tại chỗ (dùng lại `PassageFields`/`FigureEditor`), câu của nhóm thụt vào.
- **Câu** giữ thẻ Sửa · ✨AI ▾ · ⋯ như P5; ⋯ thêm "Chuyển sang phần…".
- **Ý a/b/c** hiện trong thẻ câu, sửa trong trình sửa câu ("+ Thêm ý").
- **Điểm chèn "＋"**: cuối mỗi Phần, cuối mỗi Nhóm, cuối đề, và (khi rê chuột/khi bấm giữ trên điện thoại) giữa hai câu. Menu chèn: **Câu tự soạn · Từ ngân hàng · Nhập Word/Ảnh · Sinh bằng AI · Ngữ liệu (nhóm mới) · Phần mới** (Phần mới chỉ ở gốc).
- Di chuyển: nút Lên/Xuống bắt buộc (bàn phím, cảm ứng); kéo thả là tùy chọn nếu làm được an toàn. Đánh số tự cập nhật.
- **Đề trống**: hiện ngay trong cột soạn bốn nguồn thêm câu (Tự soạn · Từ ngân hàng · Nhập Word/Ảnh · Sinh bằng AI) và "＋ Thêm phần". Không có hướng dẫn đánh số bước, không cần chia phần trước.

### C3. Bốn nguồn thêm câu đều **chèn vào điểm đã chọn**
- Tự soạn: mở vùng "Soạn câu mới" ngay tại điểm chèn (giữ cơ chế nháp/xác nhận của `27af86a`).
- Ngân hàng, Nhập Word/Ảnh: chèn sau điểm chọn; câu có ngữ liệu → tạo Nhóm. Nhập Word nhận được "PHẦN" thì đề nghị tạo Phần tương ứng (giáo viên xác nhận).
- **Sinh bằng AI: đổi từ "thay cả đề" sang "thêm câu"**. Đề xuất AI hiện danh sách câu để duyệt; "Thêm vào đề" chèn tại điểm chọn. Dùng phạm vi/ma trận đề làm gợi ý. Bỏ `replacesDocument` khỏi bàn soạn; "tạo cả đề bằng AI" chỉ còn ở Kho đề (tạo đề mới), không ghi đè đề đang mở.
- Giữ guard hiện có (stamp tài liệu, tài khoản, quyền, ID trùng).

### C4. Nháp và rà soát
- "Cần xử lý" → **một dải nhỏ** đầu cột soạn: "Có n câu soạn dở · Mở" (mở danh sách gọn). Danh sách nháp đầy đủ/đã cất/không đọc được ở Kho đề ("Khôi phục nháp").
- Rà soát đổi tên hiển thị "Rà soát đề" (không dùng "cần xem" ở thanh trên). Không hiện cùng lúc hai chữ "cần xử lý"/"cần xem".

### C5. Chữ trên màn hình
- Mỗi khối tối đa **một câu hướng dẫn** bằng lời thường. Cảnh báo an toàn dài chuyển vào `title`/chú thích nhỏ hoặc chỉ hiện khi xảy ra.
- Thời gian hiển thị `vi-VN` tương đối ("lúc 16:13 hôm nay"), không ISO.
- Bỏ các chữ: "phép chiếu", "đối chiếu", "cất riêng, không chờ áp dụng", "ACK", "stamp". Ví dụ thay: "Câu này đang soạn dở trên máy. [Mở lại] [Tải về] [Bỏ]".

### C6. Điện thoại (< 640px)
- Gộp tên đề + chấm lưu + Giao bài vào **thanh mỏng trên cùng** của khung (thay logo); ẩn hàng tab menu trong bàn soạn (menu vẫn mở qua nút). Còn tối đa **3 thanh**: thanh mỏng · công cụ · công tắc Soạn/Xem.
- **Bỏ nút nổi "Xem đề"** (trùng công tắc, che nội dung).
- Ma trận: dạng thẻ dọc mỗi ô một thẻ, không bảng 7 cột.
- Điểm chèn "＋" luôn hiện (không dựa vào rê chuột).

---

## D. Thứ tự làm (mỗi bước một commit, có kiểm; ảnh 1440/1024/375/320 sáng–tối ở bước có UI)

| Bước | Việc | Kiểm chấp nhận |
|---|---|---|
| S0 | Kiểu `outline` + `Question.parts`; hàm thuần: dựng outline từ đề cũ (B3), suy `questions` order/`sectionId`/`passageId` từ outline, đánh số, chèn/xóa/di chuyển nút; validate trong `exam-document` (giới hạn số nút, không lồng sai cấp, id duy nhất, câu nào cũng đúng một chỗ) | Unit: chuyển đề cũ giữ nguyên thứ tự/ID/điểm; phần rỗng hiện; passage không liền nhau → nhiều nhóm; vòng lặp lưu–đọc không đổi; tài liệu lỗi bị từ chối |
| S1 | Bản in/xuất/trình chiếu/trang làm bài đọc outline; tên phần và ngữ liệu in đúng một lần; ý a/b/c in và xuất Word; đánh số theo cấu hình | So DOCX như các test hiện có; đề cũ in giống hệt trước (trừ phần rỗng nay hiện); bài đã giao/đã nộp chấm không đổi |
| S2 | Trộn đề theo phần/nhóm; rà soát theo cấu trúc; mẫu lưu dàn ý | F3 (bốn mã đề) đạt; câu trong nhóm ngữ liệu không bị tách |
| S3 | Cột soạn dàn ý (C2) + điểm chèn + Lên/Xuống/Chuyển phần; bỏ `ExamStructureEditor` cũ, `QuestionPlacement`, thẻ Thông tin đề, hộp Yêu cầu ra đề | Tạo Phần rỗng thấy ngay ở soạn và xem; đổi tên phần cập nhật xem trước; bàn phím tới được mọi thao tác |
| S4 | Bốn nguồn chèn vào điểm chọn (C3); AI thêm câu thay vì thay đề | Đề 10 câu + sinh AI 5 câu = 15 câu, 10 câu cũ không đổi; chèn vào giữa Phần II đúng vị trí; nhập Word có "PHẦN I" đề nghị tạo phần |
| S5 | Thông tin đề thành bảng phải (C1), thanh trên/thanh công cụ mới, nháp/rà soát (C4), chữ (C5) | Chỉ còn một cửa sửa thông tin; không còn chuỗi ISO/thuật ngữ ở C5 trên màn hình (kiểm tự động bằng tìm chuỗi) |
| S6 | Điện thoại (C6) | 375/320: ≤ 3 thanh trên nội dung, không có nút nổi, ma trận dạng thẻ, không tràn ngang |
| S7 | Dọn mã: tách logic khỏi JSX vào `lib/`; mã mới không có dòng > 200 ký tự; màu dùng biến `--ui-*` | Lint/kiểu sạch; ratchet màu không tăng |

Có thể gộp commit nếu hai bước dính chặt, nhưng báo cáo phải đối chiếu từng bước.

## E. Ràng buộc
- Không ghi DB chính; mọi ghi kiểm chỉ trên `examcraft_test_20261022` sau kiểm `isolatedTest` + SQL đích. Không gọi provider AI thật. Không đổi key/cookie/.env/khóa mã hóa/backup.
- Không đổi schema Prisma khi chưa có duyệt (B2). Không đổi API công khai trừ khi thêm trường tương thích ngược; ghi rõ trong báo cáo.
- Cổng 3117: `LOCK_3117.json` đang `USER`; build/kiểm ở worktree riêng và cổng khác (ví dụ 3122), không build đè `.next` của 3117. Một build một lúc, CPU=1, heap 1024.
- Cập nhật `tests_pilot`/`tests` theo nhãn mới; không xóa/bỏ qua kiểm để cho đạt. Chạy tối thiểu: SAFE, `test:editor`, `test:library`, `test:teacher`, `test:admin`, `test:typography`, `test:frame`, F2, F3, F4, F9, F19, F21.
- Báo cáo `qa/rebuild-<ngày>/editor-structure/BAO_CAO.md`; không ghi đè thư mục đợt trước; không tự đóng CV, không sửa checklist03/hồ sơ02/ASSIGNMENTS/BATCH_REVIEWS. Không push; Claude duyệt, chủ dự án xem thật.
- Viết mã đọc được: mỗi thành phần một trách nhiệm, không nhồi một dòng; chú thích ngắn kiểu mã xung quanh.

## F. Câu hỏi Codex có thể tự quyết (ghi lại trong báo cáo)
- Tên trường cụ thể trong `outline`, cách lưu kiểu đánh số.
- Có làm kéo thả hay chỉ Lên/Xuống (Lên/Xuống bắt buộc).
- Nhập Word nhận diện "PHẦN"/"a)" đến đâu (tối thiểu: không làm hỏng nhập hiện có).

Câu hỏi phải hỏi chủ dự án (dừng lại): cần đổi schema Prisma; muốn bỏ một chức năng đang có thay vì chuyển chỗ.
