# Bản nền điểm và lịch sử chấm — 24/10/2026

CV060/061, đang kiểm; tiếp [giao diện chấm](TEACHER_DETAIL_REVIEW.md). Không migration: dùng bảng AuditLog có sẵn, chỉ kiểm dữ liệu giả/DB thử.

## Đã sửa, chưa đủ bằng chứng nghiệm thu

- `manual-grade-revision.ts` tạo token gắn attempt/question/response/điểm tự động/điểm tay/nhận xét. GETdetail trả gradeRevision cho từng câu; POST bắt buộc baseGradeRevision, kiểm cùng row-lock đã có trước upsert/chốt tổng.
- Nền cũ khác trạng thái hiện tại trả409GRADE_CONFLICT; không thay điểm/nhận xét/tổng/lịch sử. Retry mất receipt được nhận khi điểm tay/nhận xét đã đúng yêu cầu, không ghi thêm lịch sử trùng; không coi điểm tự động0 là điểm tay0 đã chấm.
- Audit action`attempt.grade` cùng transaction với answer/tổng: questionKey, trước/sau điểm/nhận xét và tổng, actorId. Không ghi response học sinh vào meta. GET owner đã kiểm quyền mới đọc50lần gần nhất, có cờ còn lịch sử cũ; UI xem gần đây, không tự dựng lịch sử cũ chưa có event.
- UI gửi token theo câu đang mở; lỗi409 giữ ô nhập và báo rõ; không tự lấy nền mới để ghi đè. Harness cũ đã thêm gradeRevision giả, chưa chạy lại sau đổi payload này.
- API GET bỏ2`any` cũ qua asObject và Map suy kiểu; chưa nhận lint sạch đến khi chạy xong.

## Kiểm hiện tại

Các log dưới đây được tạo lúc 11:06–11:07 ngày 24/10, sau lần sửa mã cuối (11:01–11:03); không có tệp `src/`, `tests/`, `scripts/`, `prisma/` nào đổi sau log. Cây mã đã kiểm trùng với commit local `28d5d8e` (nhánh `rebuild/2026-10-local`). Đợt cập nhật hồ sơ này chỉ đọc log, không chạy lại build/DB/AI.

- Build: [build-manual-grade-cas.log](build-manual-grade-cas.log) có "Compiled successfully", TypeScript hoàn tất, sinh46trang và in đủ bảng route; không có dòng error/warn. Log không ghi exit code nên chỉ kết luận theo nội dung log.
- SAFE: [safe-manual-grade-cas.log](safe-manual-grade-cas.log) unit20/20 + node211/211, fail0 (tổng231). Gồm ca `manual grade bases bind the attempt, question, comment and actual answer state` của `manual_grade_revision.test.ts`.
- HTTP: [http-manual-grade-cas.log](http-manual-grade-cas.log)17/17, fail0. Ca chấm nằm trong subtest `attempt cookie is required; submit is idempotent and essay remains pending`: thiếu bản nền→400; câu ngoài snapshot/điểm vượt tối đa→400; tab đổi tài khoản→409`ACCOUNT_CHANGED`, attempt/answers không đổi, 0 sự kiện; hai lần chấm cùng nền đồng thời→một200/một409 và đúng1sự kiện; trang cũ gửi lại→409`GRADE_CONFLICT`, DB không đổi; chấm đúng nền→200, tổng1.29, hết chờ chấm; gửi lại sau mất receipt→200, không thêm sự kiện (tổng2); lịch sử2bản có điểm/nhận xét sau; giáo viên khác đọc→404; thống kê bảng điểm đúng. Log không ghi server thử được dựng từ bản build nào; theo thứ tự thời gian thì HTTP chạy sau build.
- Lint: [manual-grade-cas-new-lint.log](manual-grade-cas-new-lint.log) rỗng (0 byte). Từng có log rỗng khi tiến trình chưa xong, nên chưa đủ căn cứ nhận lint sạch.
- UI2tab cùng câu **đã chạy 24/10** (production build trên DB thử, server đã dừng): A2.5→2.25 = 200, tổng9.25, 1sự kiện; B từ nền cũ nhập1.75 = 409, DB không đổi, ô giữ1.75 và có banner báo sửa ở trang khác; A2.25→2.5 = 200, tổng về9.5, lịch sử2bản đúng thứ tự. Lượt2 không bị đụng. Chi tiết: [manual-grade-two-tab-ui.txt](manual-grade-two-tab-ui.txt). Khả năng cookie học sinh cũ không dùng lại không ảnh hưởng ca này (chỉ phiên giáo viên).
- Lint nhóm chấm chạy lại: [manual-grade-lint-final.log](manual-grade-lint-final.log). `manual-grade-revision.ts`, `student-response-text.ts`, API chấm và2test mới không có cảnh báo; chỉ trang giáo viên `assignments/[id]/page.tsx` có3errors (2any, 1setState trong effect — kế thừa) và7warnings import không dùng.

Giới hạn: lịch sử UI50gần nhất, chưa paging/UI khôi phục điểm từ lịch sử, chưa đính chính đáp án/regrade/gia hạn, chưa reviewer chuyên môn/rubric/nhận xét đầy đủ; chưa hai browser độc lập (cùng một browser, cùng cookie). Không đóng CV060/061 chỉ từ số test.
