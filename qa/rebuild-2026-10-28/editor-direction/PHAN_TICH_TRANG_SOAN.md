# Thiết kế lại trang soạn đề (28/10/2026) — giao Codex

Bản này **thay** bản phân tích ngắn cùng tên (commit `af14a82`). Chủ dự án đã xem màn hình thật (ảnh 1440px, đề mới 0 câu) và yêu cầu thiết kế lại cho dễ dùng, được phép đổi nhiều. Claude phân tích từ mã: `ExamWorkspace.tsx`, `EditorToolbar.tsx`, `Header.tsx`, `A4Preview.tsx`, `QuestionCard.tsx`, `HeaderSettingsModal.tsx`, 4 khối thiết lập, 3 khối nháp, `RightCompanionRail.tsx`, `TeacherAiSecretaryDrawer.tsx`.

## 1. Bản đồ chức năng hiện có và quyết định

Ký hiệu: **Giữ** · **Chuyển** (đổi chỗ) · **Gộp** · **Bỏ**.

### Thanh trên (Header)
| Hiện có | Làm gì | Quyết định |
|---|---|---|
| Tên đề sửa tại chỗ | Đổi tên | Giữ |
| "Đã lưu trên máy chủ" | Trạng thái tự lưu | Giữ, là **nơi lưu duy nhất**; khi lỗi/xung đột/mất mạng thì chấm đổi màu và bấm vào mở các nút Thử lại / Tải nháp / Lưu thành đề mới (thay dải trạng thái lưu toàn chiều ngang) |
| Chia sẻ & Thi online | Mở ShareModal (giao bài, chia sẻ) | Giữ, đổi tên **"Giao bài"** |
| — | — | **Thêm** chip thông tin đề: "Toán 6 · 45 phút · 10 điểm" bấm mở Thiết lập đề |
| — | — | **Thêm** chip rà soát "⚠ 1 cần xem" (xem mục Rà soát) |

### Thanh công cụ (EditorToolbar) — đang 9 nút + nhãn, tràn 2 dòng
| Hiện có | Quyết định |
|---|---|
| Sửa đề bằng AI (Codex vừa chuyển từ thanh phải vào) | Giữ ở toolbar nhưng **đứng sau nhóm Thêm câu**, tên "Sửa bằng AI" |
| Ngân hàng câu hỏi · Nhập đề (Word/Ảnh) · Sinh đề AI Mới | **Gộp** vào nút menu **"+ Thêm câu ▾"**: Tự soạn câu mới · Từ ngân hàng · Nhập Word/Ảnh · Sinh bằng AI. Sinh bằng AI hỏi xác nhận nếu đề đã có câu |
| Menu Đề thi → Tiêu đề trường thi | **Gộp** vào Thiết lập đề, thẻ Thông tin |
| Menu Đề thi → Trộn 4 mã đề | **Chuyển** vào menu Xuất ("Trộn mã đề…") |
| Menu Đề thi → Ma trận của đề | **Bỏ — nút chết**: chỉ bật/tắt biến `isMatrixTabActive`, không hiển thị gì |
| Menu Đề thi → Sao lưu · Nhập kho cũ | **Chuyển** sang trang Kho đề (việc của cả tài khoản, không của một đề) |
| Menu Xuất (Word, In/PDF, Trình chiếu) | Giữ, ghi rõ: Word – đề · Word – đáp án/barem · Word – lời giải · Word – ma trận · In/PDF · Trình chiếu · Trộn mã đề |
| Bảng điểm thi | Giữ, đổi tên "Kết quả", có số bài nộp; ẩn khi đề chưa giao lần nào |
| Cùng soạn · Góp ý · Lịch sử | Giữ, rút tên thành "Cùng soạn" (giữ chú thích đầy đủ) |
| Nhãn "Đề của bạn" | Chỉ hiện khi **không** phải đề của mình ("Được mời sửa", "Chỉ xem") |

### Dải thông báo giữa toolbar và nội dung — đang chồng 3–4 tầng
| Hiện có | Thực chất | Quyết định |
|---|---|---|
| Rà soát đề · n mục cần xem | Bộ kiểm cấu trúc **không dùng AI**: thiếu đáp án, thiếu/lệch điểm, câu rỗng… | **Chuyển** thành chip trên Header; bấm mở danh sách, bấm từng mục **nhảy tới câu đó**; tự hiện lại trước khi Giao bài/Xuất |
| Bản nháp chưa lưu trên máy này | **Không phải logic cũ chết**: danh sách nháp localStorage của **cả tài khoản** (mọi đề) để cứu dữ liệu khi mất mạng/đóng trình duyệt. Sai chỗ: hiện ở mọi đề, kể cả khi rỗng | **Chuyển** danh sách sang Kho đề (mục "Khôi phục nháp", chỉ hiện khi có). Trong trang soạn chỉ hiện **banner khi chính đề này** có nháp mới hơn bản máy chủ: "Mở nháp / Bỏ" |
| Nháp câu hỏi trên máy · n | Câu đang sửa dở chưa áp dụng | Giữ cơ chế, **gộp** vào chip "Cần xử lý (n)" ở đầu danh sách câu; ẩn khi 0 (đã ẩn) |
| Đề xuất AI trên máy · n | Đề xuất Copilot chưa duyệt | Như trên, gộp chung chip "Cần xử lý" |
| Banner "Thầy cô vẫn có thể soạn… Thêm khóa AI" | Nhắc thêm khóa | **Bỏ banner cố định**. Khi bấm một chức năng AI mà chưa có khóa → hộp nhắc "Cần khóa AI" có nút Thêm khóa. Chấm màu ở nút khóa thanh phải vẫn giữ |

### Cột câu hỏi
| Hiện có | Quyết định |
|---|---|
| Tiêu đề "Ngân Hàng Câu Hỏi Trong Đề · 0 câu" | **Đổi tên** "Câu hỏi (0) · 0/10 điểm" — chữ "Ngân hàng" đang trùng nghĩa với kho Ngân hàng câu hỏi |
| Nút Lưu đề | **Bỏ** (trùng tự lưu trên Header) |
| Nút Thêm câu hỏi | **Chuyển** xuống cuối danh sách (và có trong menu Thêm câu) |
| Chọn tất cả | Giữ, chỉ hiện khi có câu |
| 4 khối gập: Phần & ngữ liệu · Mẫu cá nhân · Kiến thức & phạm vi · Kế hoạch đề | **Gộp** vào bảng **Thiết lập đề** (mục 3). Riêng ngữ liệu: hiển thị luôn trong danh sách phía trên các câu dùng nó |
| Thẻ câu: 10 nút (chọn, Đổi số liệu, Tương đương, Thẩm định, Bảo AI sửa, Lên, Xuống, Nhân bản, Sửa, Xóa) | Hiện thường trực: **Sửa** · **✨ AI ▾** (Đổi số liệu, Tạo câu tương đương, Thẩm định, Bảo AI sửa) · **⋯** (Lên, Xuống, Nhân bản, Xóa). Ô chọn hiện khi rê chuột hoặc khi đang chọn nhiều |
| Màn trống "Đề thi đang trống" | **Làm lại** thành màn bắt đầu có hướng dẫn (mục 5) |

### Cột xem trước A4 — đang 5 thẻ + 5 nút thu phóng + In + Word
| Hiện có | Quyết định |
|---|---|
| Đề thi in ấn · Song song · Bảng đáp án & Barem · Hướng dẫn giải · Ma trận & Đặc tả | Thẻ ngắn một dòng: **Đề · Đáp án · Lời giải · Ma trận**; "Song song" thành công tắc bố cục trong thẻ Đề |
| − 46% + · 100% · Vừa khung | Gộp thành "− 46% +" và một menu nhỏ (Vừa khung / 100%) |
| In / PDF · Tải file Word | **Bỏ khỏi khung xem**, chỉ còn trong menu Xuất (đang trùng). Lưu ý: hiện Word xuất theo thẻ đang xem — menu Xuất phải ghi rõ từng loại thay vì phụ thuộc thẻ |

### Thanh phải (rail) và AI
Hiện có 3 loại AI, tên gần giống nhau nên rối:
1. **Tạo câu mới**: Sinh đề AI → nằm trong "+ Thêm câu".
2. **Sửa đề đang mở**: bảng Copilot ("Sửa bằng AI" trên toolbar) + nút AI ở từng câu (mở cùng bảng). Đúng chỗ: hành động gắn với đề thì ở toolbar của đề.
3. **Hỏi đáp chung**: chat (biểu tượng robot ở rail, gọi `/api/teacher/assistant`), không sửa đề. Giữ ở rail, đổi tên "Hỏi AI", tooltip rõ "Hỏi đáp, không sửa đề".

Ghi chú cho AI (não) và Khóa AI là cài đặt, giữ ở rail. Hai bảng AI không mở cùng lúc (đã có), Thiết lập đề dùng chung khe bảng phải này: mở cái này thì thu cái kia.

## 2. Bố cục mới (máy tính)

```
┌Menu┐┌──────────────────────────────────────────────────────────────────┐┌Rail┐
│    ││ ĐỀ KIỂM TRA MỚI ✎  [Toán 6 · 45' · 10đ]      ● Đã lưu  [⚠ 1]  [Giao bài] ││ 🤖 │
│    ││ [+ Thêm câu ▾] [⚙ Thiết lập đề] [✨ Sửa bằng AI] │ [⬇ Xuất ▾] [📊 Kết quả] [👥 Cùng soạn] ⋯ ││ 🧠 │
│    ││ ┌ Câu hỏi (12) · 10/10đ · [Cần xử lý 2] ┐ ┌ [Đề|Đáp án|Lời giải|Ma trận]  − 46% + ┐ ││ 🔑 │
│    ││ │ Ngữ liệu 1 (nếu có)                    │ │                                        │ │    │
│    ││ │ Câu 1 ……  [Sửa] [✨▾] [⋯]               │ │          Trang A4                       │ │    │
│    ││ │ + Thêm câu                              │ │                                        │ │    │
│    ││ └────────────────────────────────────────┘ └────────────────────────────────────────┘ │    │
└────┘└──────────────────────────────────────────────────────────────────┘└────┘
                                       (bảng phải khi mở: Thiết lập đề / Sửa bằng AI / Hỏi AI — một cái một lúc)
```

**Toolbar một dòng, co theo chỗ trống** (container query trên vùng giữa, không theo màn hình):
- Rộng: biểu tượng + nhãn ngắn.
- Hẹp hơn (~ dưới 760px vùng giữa): các nút phụ chỉ còn biểu tượng, có `title` + `aria-label` (rê chuột hiện tên); 3 nút chính (Thêm câu, Thiết lập đề, Sửa bằng AI) giữ nhãn lâu nhất.
- Hẹp nữa: nút thừa dồn vào **⋯**. Không bao giờ xuống dòng.
- Lý do không làm toàn biểu tượng: trên cảm ứng không có rê chuột, và người dùng là giáo viên ít quen biểu tượng — nghiên cứu khả dụng (NN/g, "Icon Usability") khuyên biểu tượng phải có nhãn chữ trừ vài biểu tượng phổ quát. Google Docs làm đúng kiểu này: co dần rồi dồn vào ⋯.

## 3. Bảng Thiết lập đề (gộp 4 khối + hộp Tiêu đề trường thi)

Mở ở khe bảng phải (rộng ~480px máy tính, toàn màn hình khi hẹp; dùng `useSidePanel`). Các thẻ, mỗi thẻ có một câu giải thích bằng lời thường:

| Thẻ | Nguồn hiện tại | Giải thích cho giáo viên |
|---|---|---|
| **Thông tin** | `HeaderSettingsModal` | Môn, lớp, thời gian, cách đánh giá (chấm điểm / nhận xét), khung mức độ, các dòng tiêu đề in (Sở, trường, mã đề) |
| **Phần & ngữ liệu** | `ExamStructureEditor` | Chia đề thành Phần I, II…; thêm bài đọc/ngữ liệu dùng chung cho nhiều câu (Văn, Anh, Sử) |
| **Ma trận** | `ExamPlanEditor` | Đặt mục tiêu số câu và điểm theo dạng câu × mức độ × yêu cầu cần đạt; xem đề thật đang lệch bao nhiêu. Thay cho cả "Kế hoạch đề" lẫn nút chết "Ma trận của đề" |
| **Phạm vi kiến thức** | `KnowledgeScopeEditor` | Chọn bài/chương được ra (và loại trừ phần chưa học) để AI sinh câu đúng phạm vi. Tùy chọn |
| **Mẫu** | `ExamTemplatePanel` | Dùng một mẫu đã lưu (tiêu đề, ma trận, phần) cho đề này; hoặc lưu đề này làm mẫu |

Giữ nguyên logic và các thông báo an toàn bên trong từng khối; chỉ đổi vỏ và vị trí. Văn bản giải thích dài trong khối nên rút ngắn, phần cảnh báo để ở `title`/chú thích nhỏ.

## 4. Màn hẹp và điện thoại

Hiện tại dưới 900px vùng giữa có nút đổi "Danh sách / Xem A4" nhưng nằm **dưới** các dải thông báo nên bị đẩy khuất, trông như mất khối đề.
- Thay bằng **công tắc dính** "Soạn câu | Xem đề" ngay dưới toolbar, luôn nhìn thấy khi vùng giữa < 900px.
- Trên điện thoại (< 640px) thêm nút nổi "👁 Xem đề" góc dưới phải khi đang ở Soạn câu; bấm mở xem trước toàn màn hình có nút Đóng.
- Thanh công tắc thẻ xem trước (Đề/Đáp án/…) cuộn ngang được, không xuống 3 dòng như ảnh.
- Bảng phải (Thiết lập/Sửa bằng AI/Hỏi AI) mở toàn màn hình như đã làm.

## 5. Màn bắt đầu khi đề trống

Thay khối "Đề thi đang trống" + 4 khối gập bằng hướng dẫn ba bước:
1. **Kiểm thông tin đề**: Toán 6 · 45 phút · chấm điểm — [Sửa] (mở thẻ Thông tin).
2. **Thêm câu**: bốn thẻ lớn — Tự soạn · Từ ngân hàng · Nhập Word/Ảnh · Sinh bằng AI (thẻ AI ghi "cần khóa AI" nếu chưa có).
3. (Tùy chọn) **Dùng mẫu / đặt ma trận** — mở thẻ Mẫu hoặc Ma trận.

Khi đã có câu, màn này biến mất; các lối vào vẫn còn ở toolbar.

## 6. Tham khảo
- Google Docs: toolbar một dòng co dần vào ⋯, trạng thái lưu một chỗ cạnh tên tài liệu.
- Google Forms: thêm câu bằng một nút, thiết lập biểu mẫu ở thẻ riêng tách khỏi câu hỏi.
- Overleaf: soạn bên trái, bản PDF bên phải, màn hẹp đổi qua lại bằng công tắc.
- Quizizz/Wayground và Azota: thêm câu từ nhiều nguồn (tự soạn, ngân hàng, nhập file, AI) gom vào một nút.
- NN/g "Icon Usability": biểu tượng cần nhãn chữ; tooltip không thay được nhãn trên cảm ứng.

## 7. Thứ tự làm (mỗi bước một commit, có ảnh 1440/1024/375 sáng–tối)

| Bước | Việc | Kiểm chấp nhận |
|---|---|---|
| P0 | Bỏ nút chết "Ma trận của đề"; bỏ nút Lưu đề trùng; đổi tên "Câu hỏi (n)" | Không còn mục menu không làm gì; F19/F21 đạt |
| P1 | Dọn thông báo: Rà soát → chip Header có nhảy tới câu; trạng thái lưu vào Header; nháp tài khoản → Kho đề, banner chỉ khi đề này có nháp; bỏ banner khóa, thêm hộp nhắc khi bấm AI chưa có khóa; gộp 2 khối nháp câu/đề xuất AI thành chip "Cần xử lý" | Đề mới không còn dải nào giữa toolbar và câu hỏi; mô phỏng lỗi lưu vẫn thấy được nút Thử lại/Tải nháp; khôi phục nháp vẫn làm được từ Kho đề |
| P2 | Bảng Thiết lập đề 5 thẻ ở khe bảng phải, thay 4 khối + HeaderSettingsModal | Mọi trường cũ còn sửa được; lưu đề giữ đủ dữ liệu; mở Thiết lập thu bảng AI và ngược lại |
| P3 | Toolbar mới + menu "+ Thêm câu" + co biểu tượng/⋯ theo bề rộng | Không xuống dòng ở 1024 có mở menu + bảng phải; mọi nút có `aria-label`; Sinh AI hỏi xác nhận khi đề có câu |
| P4 | Khung xem trước: 4 thẻ một dòng, thu phóng gọn, bỏ In/Word trùng; menu Xuất ghi rõ từng loại | Xuất Word từng loại cho đúng nội dung như trước (so cấu trúc DOCX như các test hiện có) |
| P5 | Thẻ câu: Sửa · ✨AI ▾ · ⋯ | Đủ 10 thao tác cũ, bàn phím tới được hết |
| P6 | Công tắc "Soạn câu / Xem đề" dính + nút nổi trên điện thoại | 375/320: luôn thấy công tắc; xem đề rồi quay lại không mất vị trí cuộn |
| P7 | Màn bắt đầu cho đề trống | Đề mới hiện 3 bước; có câu thì ẩn |
| P8 | Dọn màu cứng `#dadce0`/`#202124` sang biến `--ui-*` trong các phần đã đụng; tách thẻ tiêu đề/danh sách câu khỏi `ExamWorkspace` | Không đổi hành vi; kiểu/lint sạch |

## 8. Ràng buộc
- Không đổi schema, API, logic lưu/CAS, logic AI hay provider. Không ghi DB chính.
- Cập nhật `tests_pilot` theo nhãn mới, giữ `aria-label` cũ khi có thể; không xóa/bỏ qua test để cho đạt.
- Chạy pilot phải ghi vào thư mục `qa/rebuild-<ngày>/` của đợt mới, **không ghi đè** `qa/rebuild-2026-10-25/` (đợt trước đã bị ghi đè `pilot-results.json`, Claude đã khôi phục).
- Một build một lúc, CPU=1, heap 1024. Báo cáo ở `qa/rebuild-<ngày>/editor-redesign/BAO_CAO.md`; không tự tick checklist/hồ sơ 02.
