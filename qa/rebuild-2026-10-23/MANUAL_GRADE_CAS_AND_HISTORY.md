# Bản nền điểm và lịch sử chấm — 24/10/2026

CV060/061, đang kiểm; tiếp [giao diện chấm](TEACHER_DETAIL_REVIEW.md). Không migration: dùng bảng AuditLog có sẵn, chỉ kiểm dữ liệu giả/DB thử.

## Đã sửa, chưa đủ bằng chứng nghiệm thu

- `manual-grade-revision.ts` tạo token gắn attempt/question/response/điểm tự động/điểm tay/nhận xét. GETdetail trả gradeRevision cho từng câu; POST bắt buộc baseGradeRevision, kiểm cùng row-lock đã có trước upsert/chốt tổng.
- Nền cũ khác trạng thái hiện tại trả409GRADE_CONFLICT; không thay điểm/nhận xét/tổng/lịch sử. Retry mất receipt được nhận khi điểm tay/nhận xét đã đúng yêu cầu, không ghi thêm lịch sử trùng; không coi điểm tự động0 là điểm tay0 đã chấm.
- Audit action`attempt.grade` cùng transaction với answer/tổng: questionKey, trước/sau điểm/nhận xét và tổng, actorId. Không ghi response học sinh vào meta. GET owner đã kiểm quyền mới đọc50lần gần nhất, có cờ còn lịch sử cũ; UI xem gần đây, không tự dựng lịch sử cũ chưa có event.
- UI gửi token theo câu đang mở; lỗi409 giữ ô nhập và báo rõ; không tự lấy nền mới để ghi đè. Harness cũ đã thêm gradeRevision giả, chưa chạy lại sau đổi payload này.
- API GET bỏ2`any` cũ qua asObject và Map suy kiểu; chưa nhận lint sạch đến khi chạy xong.

## Kiểm hiện tại

- Unit `manual_grade_revision.test.ts`2/2mới đạt; thêm SAFE, chưa chạy toàn SAFE.
- `build-manual-grade-cas.log` session78269 đang build; QA3117/3123 đã dừng trước build.
- HTTP đã bổ sung2grade cùngbase1thắng/1conflict, khôngsideeffects/audit khi stale, retry không tăngevent, history2bản và foreign404; cleanup log chỉ fixture actorIds trong DB thử. Chưa chạy trên bản mới.
- Cần UI2tab cùng câu ở fixture bảy dạng: A2.5→2.25, B1.75từnềncũ phải409/giữô; A2.25→2.5trảđiểmfixturebanđầu, history2bản. Không đụng DB chính. Ghi rõ đây là lịch sử mới bật, không có sự kiện cho điểm2.5cũ.

Giới hạn dự kiến: lịch sử UI50gần nhất, chưa paging/UI khôi phục điểm từ lịch sử, chưa reviewer chuyên môn/rubric/nhận xét đầy đủ; không đóng CV060 chỉ từ testcount.
