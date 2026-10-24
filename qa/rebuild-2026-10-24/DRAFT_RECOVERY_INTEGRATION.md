# Tích hợp khôi phục nháp chấm và ghi chú AI — 24/10/2026

## Đã thay đổi

- Tích hợp C02: fb6819b/402635e/3481b93 thành f49f75e/6faf787/db9c8da; C03: 674b4f3/c518564/e29feeb thành f5838a1/d732cf1/59aabb5. Sáu tệp mới giữ scoped commits, không reset/push/merge. Hash các tệp root trước đợt được lưu tại tmp/coordination/before-draft-integration.json; các parent thay đổi sau đó là phần Codex mount có chủ đích.
- Trang chấm ghi bản dự phòng khi sửa ô, theo teacher/attempt/question/base và writer riêng mỗi lần mở. Đọc lại hoặc storage event chỉ đưa bản vào danh sách, không tự đưa vào ô hay gửi điểm. Chọn khôi phục giữ base cũ; bản stale không được lưu đè. Rubric chưa hỗ trợ trên ô chấm hiện tại được giữ nguyên để tải/đối chiếu, không áp dụng một phần.
- Sau POST chấm thành công phải đọc lại đúng bài/câu/ngữ cảnh, đối chiếu điểm và nhận xét thật với lần gửi rồi mới bỏ bản nhập. GET khác do người khác vừa sửa, receipt thiếu, 409, mạng lỗi, đóng/mở bài khác hoặc unmount đều không dùng ACK cũ để dọn nháp mới. Retire journal còn so cả sent base/raw và ACK; không xóa bản writer khác. Bài không số không hiện điểm/chờ chấm giả trong panel nháp.
- Ghi chú AI: journal riêng từng owner/writer, ghi ngay khi sửa; panel khi mở chỉ đề nghị chọn khôi phục, thay form đang có chữ phải xác nhận. ACK hợp lệ và đúng nội dung mới dọn đúng bản đã lưu; chữ gõ sau khi gửi được giữ. Import/archive không tự bật hay góp chung.
- Có nút tải nguyên bản đã lưu và tải bản đang nhập trong RAM khi browser storage lỗi. Tệp RAM chỉ để giữ/đối chiếu, chưa có giao diện nhập lại tệp nháp. Không chứa API key/cookie; nội dung do giáo viên nhập vẫn là dữ liệu riêng nên tệp cần được giữ riêng.
- Đổi các nhãn “bộ não/tự học/áp dụng chính xác” thành ghi chú riêng và đề xuất cần chọn. Ước tính AI không được trình bày như xác nhận chuyên môn; ghi chú tự nhập có nhãn riêng.

## Kiểm mới và đích

- Unit helper/receipt: unit-draft-ui.log 26/26 đạt. Render component bằng react-dom/server: render-draft-ui.log 2/2 đạt, kiểm raw malformed của owner A không xuất hiện khi panel B, raw của chính chủ còn tải được, nháp nhận xét không thành nháp điểm chờ chấm. Đây là render tĩnh, không phải thao tác browser.
- SAFE: safe-draft-ui.log 307/307 đạt, fail0/skip0, giới hạn2worker; chạy trước build và không cùng build. Bao gồm các test mới của C02/C03, grade-save-receipt và render panel.
- Typecheck: typecheck-draft-ui-final.log exit0; lint các component/helper/test phạm vi đạt tại lint-draft-ui-final.log. Trang teacher lớn còn any/effect/refs và import thừa; không nhận toàn repo hoặc cả trang sạch lint. Các log lint-teacher-draft-page-*.log giữ nguyên kết quả từng lần.
- Lần build đầu build-draft-ui.log thất bại webpack UNKNOWN write; đồng thời khởi động lint trang báo OutOfMemoryException. Đĩa F còn hơn50GB, RAM vật lý trống khoảng1GB tại mốc đo. Không dừng ứng dụng người dùng hoặc sửa pagefile; không quy chắc lỗi write là lỗi code. Build lại tuần tự1CPU, NODE_OPTIONS=--max-old-space-size=1024 đạt tại build-draft-ui-low-memory.log (46trang/TypeScript). Không xóa log lỗi.
- HTTP tại http-draft-ui.log 28/28 đạt, fail0/skip0 trên production3117 vào examcraft_test_20261022; fixture giả, ba JSON đều PASS/cleanupComplete. Không provider hoặc DB chính. Đợt này không import/use các khóa thật người dùng gửi trước đây.
- Sau chỉnh bố trí history/giữ snapshot state và nút tải RAM: build cuối build-draft-ui-final.log exit0, TypeScript/46trang, 1CPU/heap1024; HTTP cuối http-draft-ui-final.log 28/28 đạt, fail0/skip0, ba JSON PASS/cleanupComplete. QA production3117 session87275 dùng DB thử. SAFE ở trên chạy trước các chỉnh bố trí cuối; không nhận là tương tác React sau cùng. Lint sáu component/helper/test cuối exit0 tại lint-draft-components-last.log; lint trang teacher cuối còn4errors/7warnings tại lint-teacher-draft-page-last.log, không nhận sạch toàn trang.

## UI và giới hạn còn mở

- Đã đọc skill computer-use và thử lại cua.getState: vẫn lỗi kernel assets/path os error3. Chưa click/reload/nhiều tab/mobile/download bằng browser thật, chưa xác nhận giao diện sản phẩm. Không dùng render tĩnh hoặc HTTP thay bằng chứng UI.
- localStorage không mã hóa và không giao dịch nguyên tử. Tách writer giảm ghi đè giữa trang; không tự dọn các bản cũ/writer khác. Dữ liệu đã có và raw hỏng được giữ; người dùng chung browser profile có thể đọc storage ngoài app, UI không phải ranh giới mã hóa.
- Nháp được ghi khi input thay đổi, không tự gửi server. Khi storage bị chặn/đầy, chỉ RAM và đường tải chủ động còn dùng được; không hứa giữ qua crash nếu chưa tải và browser từ chối lưu.
- Trang chấm đang bận thì khóa input/khôi phục; account error không gửi thêm. Nháp điểm không được coi là điểm đã chốt. Điểm0, pending, chuỗi rỗng và bài chỉ nhận xét giữ nghĩa riêng.
- C02/C03 đã mount nhưng chưa đóng CV010/011/060/061/064/069 vì còn UI và các tiêu chí khác; tiến độ sản phẩm không suy từ số test.

## Review worker song song

- C02/C03 chuyển quyền sang Codex12 để tích hợp. C04 bản thiết kế đã sửa về fail-closed rollback, reader tương thích và permission refs; chấp nhận có giới hạn, chưa schema/migration. C05 còn yêu cầu sửa rollback đáp án hiệu lực, khóa revision preview/apply và matching không thay prompt. C06 tổng hợp chỉ là dẫn đường, chưa thay tiêu chí nghiệm thu.
- G02 findings link đã đối chứng trước và sửa lịch sử. G01/G03/G04/G05/G07/G08 có yêu cầu đính chính cụ thể: không suy HTTP200 khi thiếu CAS/body, không bịa caller/route/field, không hứa đáp án/copy ngoài policy, không gọi fixture/guard là OCR/provider đã kiểm. G06 chấp nhận có giới hạn sau đối chứng coverage.json:161hàng đều needs_review, chưa có hàng approved. Chỉ là inventory registry nội bộ, không duyệt nội dung chương trình/DB/nguồn pháp lý.
- Chỉ Codex ghi BATCH_REVIEWS. Status WAITING_REVIEW không chứng minh AI vẫn chạy hoặc tự thức lại; chưa có bản sửa mới thì giữ đúng decision cũ, không tự nhận DONE. Tiếp tục nhận review khi worker bàn giao.

## Đối chiếu hồ sơ cuối đợt

- JSON ASSIGNMENTS/BATCH_REVIEWS hợp lệ; chưa có submission sửa mới sau các phản hồi đã ghi. Worker status cũ không được dùng thay decision của Codex.
- Kiểm241liên kết Markdown local trong bảy tệp hồ sơ/checklist/lịch sử liên quan: không có đích thiếu; không kiểm anchor hoặc web. git diff --check exit0, chỉ cảnh báo chuẩn hóa CRLF/LF. Checklist giữ8/78, không đóng thêm CV từ số test. Không chạy lại build/DB/AI để sửa tài liệu.
