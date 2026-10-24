# CV020 — Kế hoạch mục tiêu và đối chiếu thực tế (23/10/2026)

## Đã triển khai

- Kế hoạch cá nhân lưu trong `ExamMetadata.examPlan` (metadata JSON hiện có, không migration). `formatVersion:1`, ngữ cảnh môn/lớp/cách đánh giá/khung nhận thức/gói và revision, tối đa100ô. Mỗi ô giữ ID, một trong7dạng câu, mức nhận thức hoặc null, outcomeId tùy chọn, count có0, tổng điểm mục tiêu theo đơn vị0,01 hoặc null. Tổng số câu không vượt1.000; mã ô/tổ hợp không trùng; ô0câu không có điểm dương.
- `src/lib/exam-plan.ts`: kiểm cú pháp ở biên tài liệu; context cũ vẫn lưu/đọc được và được báo cần rà soát. Không xóa hay quy đổi plan khi đổi môn/lớp/khung/gói/mode. Outcome không có trong gói, ngoài scope hoặc mức không hợp khung làm kế hoạch cần review, không báo khớp.
- Đối chiếu từng câu với mọi ô bằng đúng type, cognitiveLevel và outcome ID có provenance đúng gói/revision nếu ô yêu cầu. Không suy outcome từ learningOutcome tự do. Không dùng difficulty thay cognitiveLevel. Một ứng viên mới được đếm;0ứng viên báo unmatched; nhiều ứng viên báo ambiguous và không đếm trùng/ghép tham lam. Outcome trống là không ràng buộc, nên có thể chồng ô cụ thể; hệ thống báo rõ thay vì tự quyết.
- Mục tiêu điểm là tổng của ô, không tự chia điểm cho câu. Số thập phân tối đa2chữ số được chuyển chính xác thành số nguyên theo đơn vị 0,01 điểm; cộng/delta bằng số nguyên, giữ0. Mỗi giá trị tối đa1.000.000điểm, bảo đảm tổng không vượt độ chính xác số nguyên. Điểm câu có độ chính xác cao hơn được báo cần xử lý, không làm tròn sớm hoặc tự sửa. Thiếu điểm vẫn unknown; chỉ dùng fallback phần đã chọn theo `freezeExamScoring` hiện có. Không lấy missing thành0.
- Khảo sát/nhận xét/rubric chỉ so số câu, không ép điểm hoặc đáp án/mức nhận thức. Mục tiêu điểm cũ được giữ và báo review sau đổi mode; giáo viên chủ động làm rõ, không xóa ngầm.
- `src/components/ExamPlanEditor.tsx`: nhập/sửa/bỏ ô; chọn cả7dạng, mức trong framework hiện tại và outcome từ gói; hiển thị văn bản outcome làm đặc tả tại bảng đối chiếu. Tổng và từng ô có mục tiêu/thực tế/delta, danh sách unmatched/ambiguous/missing/precision. Áp dụng rõ ràng chỉ đổi metadata; guard không ghi đè plan/ngữ cảnh mới hơn hoặc khi mất quyền sửa. Nháp vẫn giữ nếu update mới ngăn apply. Nút xác nhận rà soát ngữ cảnh hiện tại giữ nguyên các ô, không tự gán lại.
- `src/types/exam.ts` thêm kiểu; `src/lib/exam-document.ts` kiểm syntax plan và giữ lịch sử lỗi ngữ cảnh để giáo viên sửa sau. Root nối component và thêm test vào safe.

## Đã kiểm mới

- `node --import tsx --test tests/exam_plan.test.ts tests/education.test.ts`:14/14đạt (9ca plan +5hồi quy giáo dục).
- Các ca plan: ví dụ khái niệm4lựa chọn×0,5 +2ngắn×1 +2tự luận×3 =10 bằng framework cũ do giáo viên chọn để kiểm kỹ thuật; phân bổ sai dù cùng10điểm;7dạng tách biệt;0 và0,1+0,2; missing/sectionfallback/độ chính xác>2;3modekhôngđiểm; outcome text và provenance; mục tiêu ngoài scope; ambiguity nhiều outcome/generic; tối đa100ô/1.000câu; normalize giữ plan lịch sử; mã/mức sai; guard nền mới/quyền sửa.
- Sau sửa cuối (stamp toàn bộ gói, giữ ô nháp khi apply bị chặn và cảnh báo nền mới): `npx tsc --noEmit --incremental false` exit0; `npx eslint src/lib/exam-plan.ts src/components/ExamPlanEditor.tsx src/lib/exam-document.ts src/types/exam.ts tests/exam_plan.test.ts` exit0. Plan+education14/14 chạy lại đạt, có ca nội dung gói đổi nhưng giữ revision bị guard chặn.
- Không gọi provider, không ghi DB, không tự build/khởi động server. Không chỉnh scoring/matrix/export hiện có.

## Giới hạn và CV còn mở

- Đây là kế hoạch/đối chiếu cá nhân local; không phải bộ ma trận hoặc framework chuyên môn đã duyệt. Khớp nhãn không xác nhận nội dung câu đạt outcome/mức.
- Root đã kiểm mới: build/typecheck45trang và SAFE160đạt ở bản plan; HTTP16/16đạt trên DB thử ([log](http-exam-plan.log)). Tạo/lấy lại plan có outcome/provenance; plan sai count âm bị400 và bản cũ giữ nguyên; đổi revision gói giữ plan lịch sử và báo stale; public share không có examPlan.
- Browser **app production3117 thật**, đề QA có ảnh: nhập1ô tự luận/1câu/0điểm → Apply → Lưu lại → server báo Đã lưu trên máy chủ → reload/mở kế hoạch vẫn1câu/0điểm và khớp, ảnh/câu vẫn còn. [Đã lưu](plan-app-saved.txt), [sau reload](plan-app-after-reload.txt), [ảnh](plan-app-after-reload.png). Chỉ DB thử và fixture có sẵn, không nội dung thật. Đây là một ca xuyên UI→API→DB→UI; chưa bao phủ mọi dạng/bố cục.
- Harness component React riêng3122: nháp chưa Apply giữ state null; Apply mới đổi state; sửa count2 rồi nền đổi lớp7 → Apply báo stale và giữ cả nháp2/lịch sử1; xác nhận rà soát và sửa1 → Apply lớp7. [Trước Apply](plan-before-apply.txt), [đã áp dụng](plan-applied.txt), [giữ nháp](plan-stale-draft-kept.txt), [rà soát](plan-reviewed-applied.txt). Harness không DB/AI, đã dừng/đóng tab.
- Đợt bổ sung bên dưới đã nối kế hoạch mục tiêu vào bản xem trước/in ma trận và Word. Bảng mô tả thực tế cũ vẫn giữ4bucket tương thích; bảng mục tiêu mới giữ đủ7dạng riêng. Chưa kiểm bố cục in hoặc Word bằng ứng dụng đọc tài liệu thực tế.
- CV020 tiếp tục mở cho kiểm bố cục in/xuất và nghiệm thu chuyên môn đầy đủ. Luồng browser/server đại diện đã kiểm ở trên; không suy mọi ca đã đạt từ số test.




## Bổ sung — Đưa mục tiêu vào bản xem trước và Word

- `src/lib/exam-plan-output.ts` tạo cùng một biểu diễn văn bản cho A4 và Word từ compareExamPlan. Nhãn kế hoạch cá nhân, cảnh báo không chứng nhận chuyên môn/chính thức;4cột gọn: ô/dạng/mức, outcome text, số câu mục tiêu/khớp/lệch, điểm mục tiêu/đã biết/lệch hoặc không tính điểm. Không đọc đáp án, lời giải hoặc rubric.
- Tổng điểm thực tế đã biết bao gồm câu chưa khớp/mơ hồ và được ghi rõ; tổng không đủ khi có missing/precision báo Chưa rõ. Từng ô chỉ đếm câu có đúng1ứng viên. Kèm cảnh báo ngữ cảnh cũ, outcome/mức/scope, unmatched, ambiguous, thiếu điểm, độ chính xác.
- A4Preview thêm bảng/cảnh báo trước bảng thực tế, ở tab Ma trận & Đặc tả; in qua tab này dùng cùng biểu diễn. Word includeMatrix thêm cùng bảng trước bảng thực tế, header lặp khi qua trang. Không có plan thì không thêm bảng. Plan malformed trả cảnh báo, không tự xóa/sửa.
- Word explicit view exam hoặc matrix không xuất đáp án/lời giải/rubric dù includeSolutions=true; mặc định view all vẫn giữ hành vi kết hợp. ExamPlanEditor thay thông báo giới hạn xuất cũ bằng chỉ dẫn mở tab/xuất ma trận.
- `node --import tsx --test tests/exam_plan_exports.test.ts tests/exam_plan.test.ts tests/portable_and_exports.test.ts`:30/30đạt.5ca xuất mới kiểm word/document.xml từ DOCX được Packer tạo thật:7dạng; outcome text; mục tiêu/thực tế/delta từng ô+tổng; stale/unknown/ambiguous/unmatched/missing/precision; survey không ép điểm; explicit exam/matrix không lộ private sentinel; default all vẫn có đáp án; projection không đọc private fields/malformed/absent. Không gọi Word/AI/DB.
- Typecheck đợt xuất: `npx tsc --noEmit --incremental false` exit0. Focused lint `npx eslint src/lib/exam-plan-output.ts src/components/ExamPlanEditor.tsx tests/exam_plan_exports.test.ts` exit0. Whole-file lint A4Preview/docx-export exit1 do hai explicit-any cũ ở docx-export:297/362 trong bảng biến thiên; cảnh báo import Eye không dùng ở A4Preview:21. Không sửa các đoạn ngoài phạm vi này; không nhận lint toàn repo sạch. Chưa render DOCX bằng Word/LibreOffice hoặc kiểm ảnh trang A4/Word; XML đạt không chứng minh bố cục mọi tài liệu dài hoàn hảo. Root thực hiện kiểm browser/server/build chung, báo cáo nhóm này không tự nhận những kiểm chưa có kết quả.

Root tích hợp xuất: [build](build-plan-exports.log)45trang/typecheck đạt, buildId`tcSF9vvoTu8Lj5odfpOO3`; [SAFE](safe-plan-exports.log)20+145=165đạt. Browser app3117 mở tab Ma trận & Đặc tả trên plan đã lưu: thấy bảng mục tiêu1/1/0và0,00/0,00/0,00cùng bảng thực tế, ảnh chụp không thấy tràn ngang ở ca ngắn; [DOM](plan-app-matrix.txt), [ảnh](plan-app-matrix.png). Chưa kiểm phân trang tài liệu dài bằng Word/LibreOffice/PDF. HTTP16của plan kế thừa vì nhóm xuất không đổi API, xem http-exam-plan.log.



