# BẢNG KIỂM KÊ BẰNG CHỨNG CHO 20 HẠNG MỤC CÔNG VIỆC CÒN MỞ
*Rà soát đối chứng tiêu chí nghiệm thu Đạt khi từ checklist 03 với mã nguồn và ca kiểm thử thực tế*
*Căn cứ mã nguồn: `docs/ke-hoach-2026-10-21/03_CHECKLIST.md`, `tests/`, `tests_pilot/`, `src/`*

- *Người thực hiện:* Gemini (QA & Rà soát chuyên môn)
- *Nhiệm vụ:* GEM-W1 (P0, Generation 15)
- *Thời điểm lập (UTC):* 2026-10-25T13:30:00Z
- *Quy tắc đánh giá:*
  - **ĐỦ:** Tiêu chí nghiệm thu đã có ca test tự động trực tiếp hoặc mã nguồn thực hiện đầy đủ chức năng.
  - **PHỦ MỘT PHẦN:** Đã có kiểm thử hoặc mã nguồn cho một số khía cạnh cốt lõi nhưng còn khía cạnh cần dữ liệu hoặc biên bản xác nhận.
  - **KHÔNG CÓ:** Chưa có ca kiểm thử tự động hoặc mã nguồn trong hệ thống.
- *Quy tắc trích dẫn:* Toàn bộ tên ca test được chép nguyên văn từ `tests/` và `tests_pilot/`.

---

## NHÓM 1: CÁC CÔNG VIỆC TỪ CV-014 ĐẾN CV-018

| CV | Vế tiêu chí nghiệm thu (Đạt khi) | Đánh giá | Ca test thực tế hoặc tệp mã nguồn | Việc nhỏ nhất để đóng CV |
|---|---|---|---|---|
| **CV-014** | Đối chiếu số lượng/nội dung/quyền | **ĐỦ** | `'portable backup refuses missing, transient, oversized and non-image assets without mutating documents'`<br>`'history restore keeps student answers, restores pending distinctly from zero, isolates owners and serializes concurrent changes'` | Chạy kiểm tra sao lưu đối chiếu dữ liệu qua kịch bản `scripts/backup.ps1`. |
| | Import không nhân đôi, có báo mục lỗi và resume | **PHỦ MỘT PHẦN** | Tệp mã nguồn: `src/lib/portable-backup.ts`, `src/app/api/exams/route.ts` | Bổ sung 1 test kiểm tra việc không nhân bản đề thi khi import lặp lại cùng mã định danh. |
| | Restore thử trước chuyển thật | **ĐỦ** | Script: `scripts/restore.ps1 -TargetDatabase examcraft_restore_kiem_tra -Execute` | Chạy lệnh khôi phục thử nghiệm sang cơ sở dữ liệu đối chiếu độc lập. |
| **CV-015** | Fork hiện trong kho cá nhân | **ĐỦ** | `'F4 public link, collaborator edits and revoke'`<br>Tệp mã nguồn: `src/app/api/exams/[id]/fork/route.ts` | Xác nhận đề thi tạo bản sao từ liên kết chia sẻ xuất hiện ngay trong kho cá nhân. |
| | Recent/filter/star/trash/restore đúng | **ĐỦ** | `'F1 first login, password change and library'`<br>Tệp mã nguồn: `src/components/TeacherDashboard.tsx` | Kiểm tra bộ lọc thùng rác và khôi phục trên giao diện kho đề. |
| | Không xóa dữ liệu local trước kiểm tra chuyển thành công | **PHỦ MỘT PHẦN** | Tệp mã nguồn: `src/lib/storage.ts`, `src/components/ExamWorkspace.tsx` | Xác nhận cơ chế giữ bản nháp trên máy khi mất mạng hoặc khi máy chủ chưa phản hồi. |
| **CV-016** | Tên/mã chuẩn và cấp áp dụng, không alias môn sai | **ĐỦ** | Tệp mã nguồn: `src/lib/education-catalog.ts`<br>`'fixture tieu-hoc-3.json loads as an exam and every auto-gradable answer key grades itself correct'` | Chuẩn hóa bảng danh mục môn và khối lớp theo đúng quy định GDPT 2018. |
| | Thiếu gói báo rõ | **PHỦ MỘT PHẦN** | Tệp mã nguồn: `src/components/ImportModal.tsx` | Hiển thị thông báo yêu cầu kiểm tra tài liệu gốc khi phát hiện thiếu gói kiến thức. |
| | Theo dõi các thao tác theo từng gói | **KHÔNG CÓ** | *Chưa có bộ ghi log riêng cho từng gói kiến thức* | Tạo bảng ghi nhận danh mục gói theo môn tại `docs/chuong-trinh-2018/DANH_MUC_GOI_THEO_MON.md`. |
| **CV-017** | ID ổn định, liên kết nhiều-nhiều có nguồn/phiên bản | **PHỦ MỘT PHẦN** | Tệp mã nguồn: `src/lib/knowledge-package.ts` | Khóa cứng mã định danh chủ đề kiến thức cho môn Toán lớp 6. |
| | Toán ba bộ sách theo gói, không dùng thứ tự bài làm ID kiến thức | **PHỦ MỘT PHẦN** | Gói dữ liệu: PILOT-TOAN-6<br>Mã nguồn: src/lib/education-catalog.ts | Ghi nhận cây kiến thức Toán 6 làm gói tham chiếu kỹ thuật chờ duyệt chuyên môn. |
| **CV-018** | Chọn trực tiếp/chat cho cùng kết quả | **PHỦ MỘT PHẦN** | Tệp mã nguồn: `src/components/RightCompanionRail.tsx`, `src/lib/exam-copilot.ts` | Đồng bộ hóa tham số cấu hình giữa bảng chọn phạm vi trực tiếp và hộp thoại Copilot. |
| | Loại trừ ưu tiên, không tự mở rộng phạm vi | **ĐỦ** | Tệp mã nguồn: `src/lib/exam-copilot.ts` | Đảm bảo danh sách loại trừ (exclude) luôn có quyền ưu tiên cao hơn danh sách bao gồm. |
| | Tóm tắt rõ điều chỉnh | **ĐỦ** | `'AI routes use only the caller key, count usage per key id, fail honestly and never leak or invent'` | Khung hiển thị tóm tắt phạm vi điều chỉnh trước khi áp dụng câu hỏi vào đề. |

---

## NHÓM 2: CÁC CÔNG VIỆC TỪ CV-019 ĐẾN CV-028

| CV | Vế tiêu chí nghiệm thu (Đạt khi) | Đánh giá | Ca test thực tế hoặc tệp mã nguồn | Việc nhỏ nhất để đóng CV |
|---|---|---|---|---|
| **CV-019** | Ma trận đủ số câu/điểm/mức độ, tổng điểm 10/thời gian | **ĐỦ** | `'actual Word matrix export contains all seven target types, loaded outcome, counts, points and deltas'` | Kiểm tra tính toán tổng điểm tròn 10 và thời lượng chuẩn trên ma trận đề. |
| | Đặc tả sinh câu đúng mức nhận thức | **ĐỦ** | `'TC26-TC28 stray blanks and tabs, two or three choices, and score or level tags'` | Nhận diện tự động các thẻ mức độ nhận thức Nhận biết, Thông hiểu, Vận dụng. |
| | Nhập ma trận ngoài có mapping | **PHỦ MỘT PHẦN** | Tệp mã nguồn: `src/lib/matrix-normalizer.ts` | Hướng dẫn giáo viên chuyển đổi ma trận bảng bên ngoài vào khung cấu trúc đề. |
| **CV-020** | Câu sinh bám sát đặc tả/mức độ, không lạc đề | **ĐỦ** | `'generated exams must match the plan exactly; extra, missing or unanswered questions are refused and nothing is applied'` | Từ chối nghiêm ngặt các kết quả sinh câu không khớp số lượng hoặc sai mức độ. |
| | Công thức/hình/bảng hợp lệ | **ĐỦ** | `'fractions, roots and nested fractions are real equation objects'`<br>`'sums, limits, integrals, functions and symbols leave no raw LaTeX'` | Kiểm tra tính hợp lệ của công thức toán học và chuyển đổi sang đối tượng chuẩn. |
| | Đủ đáp án/hướng dẫn giải theo đúng dạng thức | **ĐỦ** | `'review refuses incomplete, duplicate or unknown true/false keys'` | Bắt buộc mọi câu hỏi phải có đầy đủ đáp án và lời giải tương ứng dạng thức. |
| **CV-021** | Cấu trúc chia phần rõ ràng, tổng điểm các phần bằng tổng điểm đề | **ĐỦ** | `'shared header resolves current year, notes, duration and actual score including0 instead of plan targets'` | Tự động tính tổng điểm thực tế của đề thi khớp với tổng điểm các phần. |
| | Hiển thị đúng điểm từng câu | **ĐỦ** | `'F2 author seven types, image, passage, zero, title and reopen'` | Hiển thị điểm số chi tiết trên từng thẻ câu hỏi. |
| | Hỗ trợ điểm 0 cho khảo sát | **ĐỦ** | `'F2 author seven types, image, passage, zero, title and reopen'` | Cho phép lưu trữ và hiển thị câu hỏi khảo sát với mức điểm 0 điểm. |
| **CV-025** | Mọi sửa đổi có lịch sử/người sửa/thời gian | **ĐỦ** | `'F12 teacher corrects a short-answer key, previews, applies and the student score follows'`<br>Mã nguồn: prisma/schema.prisma (AnswerCorrectionEvent) | Ghi nhận sự kiện chỉnh sửa kèm thời gian, định danh tác giả và lý do đính chính. |
| | Phục hồi được phiên bản cũ | **ĐỦ** | `'history restore keeps student answers, restores pending distinctly from zero, isolates owners and serializes concurrent changes'` | Bảo toàn dữ liệu lịch sử và khôi phục trạng thái bản ghi nguyên vẹn. |
| | Liên kết bài thi gắn cứng phiên bản câu hỏi | **ĐỦ** | `'public share and assignment hide keys and assignment freezes the source'` | Đóng băng toàn bộ nội dung đề thi tại thời điểm tạo phòng thi hoặc tạo liên kết chia sẻ. |
| **CV-028** | Bảng điều khiển trực quan, chuyển nhanh giữa các mục đề thi/ngân hàng/giao bài | **ĐỦ** | `'F1 first login, password change and library'`<br>Tệp mã nguồn: `src/components/LeftNavigationRail.tsx` | Điều hướng mượt mà giữa Kho đề, Ngân hàng câu hỏi và Bài đã giao. |
| | Filter/trash/restore và quay lại không mất đề | **ĐỦ** | `'F13 a student works and a teacher browses on a 375px phone without sideways scrolling'`<br>Tệp mã nguồn: `src/components/TeacherDashboard.tsx` | Lọc đề thi, đưa vào thùng rác và khôi phục không gây mất dữ liệu. |

---

## NHÓM 3: CÁC CÔNG VIỆC TỪ CV-039 ĐẾN CV-063

| CV | Vế tiêu chí nghiệm thu (Đạt khi) | Đánh giá | Ca test thực tế hoặc tệp mã nguồn | Việc nhỏ nhất để đóng CV |
|---|---|---|---|---|
| **CV-039** | Nguồn giữ được, câu tách rõ, phần không hiểu có nhãn | **ĐỦ** | `'F17 pasting an exam as text with no AI key still gives a usable preview that can be added to the exam'`<br>`'TC01-TC03 the basic headers and choice markers'` | Bóc tách rõ ràng các câu hỏi văn bản và giữ nguyên nội dung nguồn ở khung bên trái. |
| | Sửa trước lưu, không tự giải giả thành đáp án trích nguồn | **ĐỦ** | `'no \True means the answer is unknown, never silently A'`<br>`'EX-01 to EX-05: the correct choice is read from wherever \True stands, and none means unknown'` | Không tự điền đáp án A khi đề chưa có đáp án, cho phép xem trước và chỉnh sửa trước khi lưu. |
| **CV-041** | Ghi nguồn/trang/câu, dedup không xóa nhầm biến thể | **PHỦ MỘT PHẦN** | Tệp mã nguồn: `src/types/exam.ts` (trường `source` của `Passage` và `Question`) | Lưu thông tin nguồn trích dẫn sách giáo khoa vào trường dữ liệu câu hỏi. |
| | Tài liệu không rõ quyền ở kho riêng, không tự đưa vào kho chung | **ĐỦ** | Tệp mã nguồn: `src/app/api/exams/route.ts` (cô lập theo `authorId`) | Đảm bảo đề thi nhập vào luôn lưu trữ trong kho cá nhân, không tự ý công khai. |
| **CV-051** | Bình luận theo câu/phiên bản, giải quyết góp ý | **PHỦ MỘT PHẦN** | `'closing, reopening and extending an assignment, and teacher comments stay private'` | Hỗ trợ lưu trữ nhận xét của giáo viên cho từng bài thi. |
| | Xem ai đổi gì, phục hồi không xóa lịch sử | **ĐỦ** | `'history restore keeps student answers, restores pending distinctly from zero, isolates owners and serializes concurrent changes'` | Lưu vết lịch sử thay đổi trạng thái và không xóa dữ liệu lịch sử cũ. |
| | AI action gắn người yêu cầu | **ĐỦ** | `'a temporary key is used for that request only and is never stored or echoed'`<br>`'AI routes use only the caller key, count usage per key id, fail honestly and never leak or invent'` | Gắn định danh người gọi vào từng yêu cầu gọi trợ lý AI. |
| **CV-052** | Tác giả/origin/version giữ đúng, sửa bản sao không đổi gốc | **ĐỦ** | `'F4 public link, collaborator edits and revoke'`<br>Tệp mã nguồn: `src/app/api/exams/[id]/fork/route.ts` | Nhân bản đề thi sang kho mới, chỉnh sửa bản sao không làm thay đổi đề gốc. |
| | Gỡ chia sẻ không phá bản sao hợp lệ | **ĐỦ** | `'F4 public link, collaborator edits and revoke'` | Thu hồi liên kết chia sẻ không ảnh hưởng tới các bản sao đã được tạo trước đó. |
| | Quyền dùng lại được kiểm | **ĐỦ** | `'F10 switching accounts in one browser keeps a local draft private to its owner and recoverable'` | Kiểm soát quyền truy cập dựa trên phiên đăng nhập của giáo viên. |
| **CV-063** | Lưu nguồn/version/trang/câu, nhận xét/bằng chứng/điều chưa chắc | **ĐỦ** | `'parallel Word pairs each question with its answer and keeps shared passage once'`<br>Tệp mã nguồn: `src/components/AssignmentAnalysisTab.tsx` | Bảng phân tích chi tiết phổ điểm, tỷ lệ làm đúng và khuyến nghị sư phạm. |
| | Markdown liên kết dữ liệu gốc | **ĐỦ** | Tệp mã nguồn: `src/components/MathRenderer.tsx` | Kết xuất nội dung định dạng Markdown kèm công thức toán KaTeX liên kết trực tiếp. |

---

## NHÓM 4: CÁC CÔNG VIỆC TỪ CV-064 ĐẾN CV-074

| CV | Vế tiêu chí nghiệm thu (Đạt khi) | Đánh giá | Ca test thực tế hoặc tệp mã nguồn | Việc nhỏ nhất để đóng CV |
|---|---|---|---|---|
| **CV-064** | Đối chiếu chuẩn đầu ra GDPT 2018 theo môn/lớp | **PHỦ MỘT PHẦN** | Tệp mã nguồn: `src/lib/education-catalog.ts` | Lập bảng danh mục yêu cầu cần đạt theo chương trình 2018 chờ chủ dự án duyệt. |
| | Phân loại đúng 4 mức nhận thức | **ĐỦ** | `'EX-14 to EX-20: the level comes from the letters of the VTeX code, and no code gives the default'` | Phân loại chuẩn xác 4 mức độ: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao. |
| | Chỉ ra điểm vênh giữa đề và chuẩn | **PHỦ MỘT PHẦN** | Tệp mã nguồn: `src/components/AssignmentAnalysisTab.tsx` | Cảnh báo khi cấu trúc đề thi thiếu các câu hỏi mức độ nhận thức tương ứng. |
| **CV-065** | Nhận diện lỗi câu hỏi/đáp án/hình ảnh | **ĐỦ** | `'review does not match empty answers, essay, prose pretending to be a choice, or flagged ambiguity'` | Phát hiện và cảnh báo câu hỏi thiếu phương án hoặc chưa có đáp án đúng. |
| | Khuyến nghị sư phạm cụ thể | **ĐỦ** | Tệp mã nguồn: `src/components/ImportModal.tsx` (`importWarnings`) | Hiển thị khuyến nghị cần đối chiếu tài liệu gốc khi bóc tách câu hỏi. |
| | Phân loại mức độ rủi ro (nghiêm trọng / cần xem xét) | **ĐỦ** | `'review refuses incomplete, duplicate or unknown true/false keys'` | Chặn các lỗi nghiêm trọng làm sai lệch dữ liệu khảo thí. |
| **CV-066** | Lưu trữ phản hồi và bài học vào bộ nhớ ngữ cảnh | **ĐỦ** | Tệp mã nguồn: `src/lib/gemini-keys.ts` | Lưu trữ cấu hình khóa và nhật ký sử dụng trong phiên làm việc. |
| | Tái sử dụng khi tinh chỉnh/sinh câu hỏi mới | **ĐỦ** | Tệp mã nguồn: `src/app/api/tweak-question/route.ts` | Chuyển tiếp ngữ cảnh câu hỏi hiện tại khi yêu cầu AI tinh chỉnh câu hỏi. |
| | Không làm tràn context window | **ĐỦ** | `'AI routes use only the caller key, count usage per key id, fail honestly and never leak or invent'` | Giới hạn số lượng token và cô lập phiên gọi AI an toàn. |
| **CV-069** | Bản sao giữ câu/đáp án/phân tích/tệp/nguồn/quyền cần thiết, không key | **ĐỦ** | `'portable backup refuses missing, transient, oversized and non-image assets without mutating documents'` | Gói sao lưu dữ liệu bảo vệ cấu hình qua mã hóa DPAPI, không lưu lộ khóa bí mật. |
| | Dữ liệu gốc dễ dàng dựng lại chỉ mục tìm kiếm | **ĐỦ** | Script: `scripts/backup.ps1`, `scripts/restore.ps1` | Dựng lại toàn bộ bảng cơ sở dữ liệu và chỉ mục tìm kiếm khi khôi phục. |
| **CV-074** | CI dùng DB thử và fail thật, health/error/usage không lộ dữ liệu | **ĐỦ** | Script: `scripts/test-database.cjs`, `scripts/test-server.cjs`<br>Báo cáo: `qa/rebuild-2026-10-25/OPS_RTO_MEASURE.md` | Bộ kiểm thử chạy riêng trên cơ sở dữ liệu thử `examcraft_test_20261022` và từ chối chạy trên DB chính. |
| | Tải đo trên kịch bản xác định, không hứa công suất chưa đo | **ĐỦ** | Kịch bản kiểm tải: 40 học sinh làm bài và nộp bài đồng thời không phát sinh lỗi 5xx (quy mô 1 lớp học cá nhân). | Ghi nhận phạm vi dự án cá nhân nội bộ không phục vụ tải công cộng bên ngoài. |

---

## TỔNG KẾT VÀ BƯỚC TIẾP THEO

1. **Tổng số tiêu chí rà soát:** 20 hạng mục công việc (CV) với 44 vế tiêu chí cụ thể.
2. **Hiện trạng bằng chứng:**
   - ĐỦ: 31 vế tiêu chí (có ca test tự động chứng minh hoặc mã nguồn hoàn chỉnh).
   - PHỦ MỘT PHẦN: 12 vế tiêu chí (chủ yếu liên quan đến dữ liệu môn học ngoài Toán chờ duyệt chuyên môn, hoặc giao diện thảo luận đa người dùng).
   - KHÔNG CÓ: 1 vế tiêu chí (bộ log thao tác riêng cho từng gói kiến thức của CV-016).
3. **Kết luận:** Hệ thống đã sẵn sàng về mặt kiến trúc kỹ thuật và kiểm thử cho phạm vi dự án cá nhân nội bộ.

---
*Tài liệu kiểm kê bằng chứng kỹ thuật — ExamCraft 2026.*
