# Đọc và lưu điểm bài làm — 24/10/2026

Nhóm CV060/061, đang kiểm; không đóng CV. Tiếp sau [giao/chấm](ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md) và [CAS nháp học sinh](STUDENT_DRAFT_CAS.md).

## Thay đổi

- `student-response-text.ts` đổi response ghép/sắp xếp thành vế/thứ tự thực đã chọn, không tự suy đáp án đúng; TFfalse→Sai, missing→Chưa trả lời,0không bị xem rỗng. Trang giáo viên không còn raw mã left/right/item cho7dạng hiện có.
- Mở chi tiết có request sequence và attempt ref; đóng/chuyển bài vô hiệu phản hồi cũ, không lấy câu của A để chấm B. Chấm chỉ khi detail.attempt.id khớp mục đang chọn; một request điểm mỗi lần, lỗi giữ ô đang nhập và báo rõ. Response chấm xong không tự mở lại bài đã đóng/chuyển; load lỗi có thông báo thay trống im lặng.
- Destructure các giá trị ổn định của hook pin account ở2trang giáo viên, sửa dependency warning mà không đưa object hook thay đổi mỗi render vào dependency.

## Bằng chứng tại mốc ghi

- Unit `student_response_text.test.ts`3/3mới đạt. Thêm vào SAFE, chưa chạy toàn SAFE cho nhóm này.
- `build-teacher-detail-review.log`46trang/typecheck exit0; `safe-teacher-detail-review.log`20+209=229đạt mới exit0. `teacher-detail-review-lint.log`4errors/11warnings, còn2any và2effect kế thừa, không còn dependency account warning; không nhận sạch toàn repo.
- Harness `scripts/qa-teacher-monitor-server.cjs`, entry `teacher-monitor-browser-entry.tsx`: chính TeacherMonitorPage, fakefetch kiểm owner pin, requestdetail trả bằng nútA/B, grade503/success có logcalls; CSPconnectnone, khôngDB/provider. NextLink thay anchor riêng vì routing không nằm trong ca kiểm; lần đầu lỗi processundefined đã sửa ở harness, không phải lỗi app Next.
- Browser tab38: A pending→đóng→B→trảB→trảA muộn, vẫn nội dungB. Nhập2.5→blur503: ô2.5 còn, banner lỗi, call đúng attemptB/questionB/savedB1. Retry thành công→GETBpending→đóng→trảB, không mở lại modal, bảng điểm2.5, unexpected0. `teacher-race-grade-error-retained.txt/png`, `teacher-race-close-before-reply.txt`. Harness session41093 đang chạy3123.
- Production DB thử tab35 mở lượt1 bảy dạng:0, TFfalse, ghép`1 → Một;2 → Hai`, ordering`one → two`,2.5partial đều đọc đúng; `teacher-detail-readable-production.txt/png`. QA3117 session34004. Không sửa bài/điểm ở productionUI đợt này.
- HTTP17 và integration7 đợt trước kế thừa vì nhóm này client-only, không sửa API; không chạy lại chỉ để tài liệu.

Giới hạn: chưa CAS/hist đối với điểm giữa2tab giáo viên; chưa chốt phản hồi rubric/nhận xét; rawJSON nguồn không nhận diện vẫn giữ để không đoán. Nháp học sinh chưa journal qua đóng trang/mất điện. Không nhận cả dự án/lint toàn repo đã sạch.
