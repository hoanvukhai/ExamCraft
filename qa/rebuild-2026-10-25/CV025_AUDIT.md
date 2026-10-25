# CDX-S4 — CV025 audit

## Từng vế
- Sửa dữ kiện/đáp án: QuestionEditor.submit đặt draft/verifiedBy none, tăng version; QuestionAiReview/prepareQuestionAiSubmission cũng hạ trạng thái. Backend questionToDatabase và PATCH câu không tự cấp verified.
- Undo câu: prepareQuestionUndo giữ toàn bộ bản trước (liên kết, ảnh, đáp án), kiểm id/stamp/phạm vi; applyQuestionManualSubmission kiểm quyền và baseline lần nữa. Lịch sử chỉ bị tiêu thụ khi nhận đúng bản áp dụng. Bổ sung Làm lại câu dùng cùng guard và không phục hồi chứng nhận cũ; sửa mới xóa nhánh redo sau ACK. Lịch sử thao tác vẫn trong RAM của phiên, mốc lưu server có ExamRevision/QuestionRevision.
- Lưu ngân hàng là bản sao riêng, tách với nháp/lưu đề. Thêm requestId theo owner/câu và body giữ trong phiên client: cùng body retry giữ requestId, đổi body cấp ID mới. Server dùng ID hash owner+requestId, advisory lock trong transaction, fingerprint canonical trong payload hiện có; retry trả lại câu, không tạo thêm passage/revision. Cùng ID khác body trả 409; không thêm schema. Sau reload client không giữ requestId cũ: giới hạn cần nói rõ, không khẳng định chống trùng qua mọi phiên hoặc dedup nội dung.

## Test có sẵn (tên nguyên văn)
- manual submission guards owner, document, edit permission, full question and source baseline (tests/question_draft.test.ts).
- undo rejects another writer or changed context and is guarded again inside the current-exam updater (tests/question_commands.test.ts).
- undo history is not consumed before acknowledgement; chained undo rebases only its expected after-stamp (tests/question_commands.test.ts).
- a corrected multiple choice key is applied everywhere and graded under the new key only (tests/answer_correction.test.ts).
- history and revision change with every correction so a stale form is detectable (tests/answer_correction.test.ts).
- incremental question saves preserve history, clear optional fields, restore deleted rows and roll back atomically (tests/integration_question_save.test.ts; có sẵn, không mặc nhận đã chạy lại đợt này).

## Test mới
bank_save_receipt.test.ts, HTTP bank receipt và F23 kiểm UI sửa/undo/redo/lưu cùng liên kết, mô phỏng mất phản hồi sau server commit rồi thử lại. HTTP bank receipt và F23 đã đạt, chốt trong CODEX_GEN16_HANDOFF.md. Không tự đóng CV.

## Kiểm thực tế trước CI cuối
F20 ba lượt liên tiếp, F19, F21, F22 và F23 đã đạt trên server production cô lập (gen16-browser-evidence.json). HTTP sau đổi cách ghi báo cáo đạt 101/101 (gen16-http-atomic.log). CI cuối đã đạt TypeScript/lint/SAFE/build/HTTP/browser; SAFE 441/441, HTTP 101/101, browser 22/22. Server3117 và mock3118 đã dừng; xem ci-full-run2.log.
