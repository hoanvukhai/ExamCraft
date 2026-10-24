# CV018 — Chat đề nghị phạm vi (23/10/2026)

## Đã sửa

- `src/components/KnowledgeScopeEditor.tsx`: giáo viên nhập yêu cầu bao gồm/loại trừ/giới hạn, chọn ấn bản rõ ràng nếu dùng sách; gửi bằng tài khoản UI đã chụp. Nút chat chặn khi chưa có khóa hoạt động, gói sai môn/lớp, scope không hợp lệ hoặc không có quyền sửa.
- Xem bảng năm nhóm lựa chọn hiện tại → đề nghị (include/exclude kiến thức, include/exclude yêu cầu, giới hạn phương pháp). Nhận đề nghị chỉ điền bảng nháp; giáo viên còn phải bấm Áp dụng phạm vi vào đề. Có nút hủy rõ ràng; câu hỏi làm rõ không chứa scope để áp dụng.
- `src/lib/scope-chat.ts`: schema nghiêm, đủ trường đầu ra; kiểm mã, revision, lựa chọn ấn bản và mapping của mã mới theo đúng ấn bản. Đề nghị còn unresolved chuyển thành câu hỏi làm rõ. Không tự mở rộng tiên quyết; bộ giải scope hiện hành vẫn ưu tiên loại trừ.
- Stamp bao gồm tài khoản, đề, môn/lớp, toàn bộ gói, scope đang chọn và đã lưu, sách, yêu cầu. Đổi bất kỳ ngữ cảnh nào chặn nhận kết quả cũ. Remount theo tài khoản/đề để không mang nháp chat qua đề khác; updater Apply bảo vệ scope/gói đã lưu nếu phản hồi khác đến trước.
- `src/app/api/knowledge-scope/propose/route.ts`: xác thực bằng requireRequestAuth (same-origin + pin tài khoản), kiểm đầu vào trước provider, dùng lại requestApiKey và executeWithKeyRotation cho BYOK/model/quota/log/lỗi. Không tạo luồng key hoặc provider độc lập. Không ghi đề hoặc kho từ endpoint đề nghị; thao tác AI thực tế vẫn có usage log theo hợp đồng cũ.
- Parent nối `ownerId`/`hasActiveKey` tại ExamWorkspace; không sửa các module provider chung hoặc checklist/handoff trong nhánh công việc này.

## Đã kiểm mới

- `node --import tsx --test tests/scope_chat.test.ts tests/knowledge_package.test.ts`: 17/17 đạt ở bản đầu.
- Sau siết kiểm mapping theo đúng sách: `node --import tsx --test tests/scope_chat.test.ts`: 7/7 đạt. Bảy ca gồm diff/include/exclude/giới hạn, request sai bị chặn trước callback, mã/revision/sách/thiếu trường sai, clarification, chặn nền cũ, JSON/authority thừa và thay đổi yêu cầu cần đạt/loại bỏ giới hạn.
- `npx tsc --noEmit --incremental false`: exit 0.
- `npx eslint src/components/KnowledgeScopeEditor.tsx src/lib/scope-chat.ts src/app/api/knowledge-scope/propose/route.ts tests/scope_chat.test.ts`: exit 0.
- Các ca gọi callback provider giả trong bộ nhớ; không gọi mạng AI, không ghi DB, không đọc khóa thật. Không build hoặc khởi động server trong nhóm này.

## Giới hạn và nghiệm thu còn mở

- Tích hợp root: build/typecheck45trang đạt, SAFE20+131=151đạt và HTTP16/16đạt mới; xem [bằng chứng](scope-access-verification.json), [build](build-scope-access.log), [HTTP](http-scope-access.log). API mới từ chối anonymous401, cross-origin403, sai tài khoản409, sách không có400 và quota0 trả429 APPLICATION_AI_LIMIT; không tạo usage reservation hoặc gọi nhà cung cấp trong các ca này.
- Browser IAB chạy **component production** trong harness3122 có fetch giả/CSP connect-src none: gửi → xem bảng năm nhóm không đổi scope đã áp dụng; đổi yêu cầu khóa nhận bản cũ; hủy → gửi lại → nhận chỉ đổi bảng nháp → Apply mới đổi state đề; clarification không có nút nhận và giữ scope. [Preview](scope-preview.txt), [stale](scope-stale.txt), [nhận vào nháp](scope-accepted-draft.txt), [áp dụng](scope-applied.txt), [ảnh](scope-applied.png), [làm rõ](scope-clarification.txt). Tab/harness đã dừng. Đây không phải UI end-to-end qua nhà cung cấp/DB; lưu/mở gói và scope qua DB kế thừa đợt trước, chưa nhận đã kiểm lại luồng chat→server save đầy đủ.
- Chưa đánh giá chất lượng hiểu tiếng Việt hoặc nội dung chuyên môn qua model thật/giáo viên. Test clarification dùng đầu ra giả: chứng minh không thể áp dụng kết quả cần làm rõ, không chứng minh model luôn hỏi đúng khi thiếu ngữ cảnh. System instruction yêu cầu hỏi lại khi thiếu/nhập nhằng bộ sách/bài; validator chặn sách tự chọn, mã bịa, revision sai và mã mới không có mapping trong sách đã chọn. Suy luận ngữ nghĩa sai giữa các mã hợp lệ vẫn cần giáo viên kiểm bảng trước nhận.
- Gói fixture là nội dung giả minh họa; không chứng nhận chương trình/sách hoặc độ phủ chuyên môn.
- CV018 tiếp tục mở cho kiểm browser và nghiệm thu chuyên môn; không suy hoàn thành từ số ca test.
