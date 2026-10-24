# Nháp sửa từng câu và màn hình nhỏ — 24/10/2026

## Vấn đề và thay đổi

- Bảng sửa câu trước đây giữ draft nội bộ nhưng nút Lưu đề chỉ lưu exam đã áp dụng. Đóng/mở bảng có thể mất phần đang gõ; poll nhận câu mới khi form chưa áp dụng còn có nguy cơ ghi đè lời giải/đáp án mới hơn.
- `question-draft.ts`: guard đúng tài khoản/đề/câu, toàn nội dung nền và cấu hình liên quan (môn/lớp/khung/gói/scope/phần/ngữ liệu). Updater bị từ chối trả nguyên đối tượng, không làm bẩn đề. Sửa tiêu đề hoặc câu khác không cản áp dụng đúng câu. Giá trị0 và lời giải giữ nguyên.
- Journal tách tài khoản/đề/câu/writer, token từng lần sửa. Gõ được ghi ngay vào localStorage; thất bại giữ RAM/cảnh báo, không xóa nguồn bền cũ. Chỉ retire raw revision đã xác nhận; không xóa nháp mới hơn. Nháp phục hồi từ writer khác chỉ được retire nếu đúng nội dung nguồn đó đã áp dụng (bỏ qua version/status/verifiedBy do áp dụng đổi); sửa khác nội dung thì giữ nguồn. Stamp câu canonical theo key để tránh xung đột giả do thứ tự JSON. Nháp số chưa hợp lệ được giữ bản tải chẩn đoán, không tự biến NaN thành null/0. Giới hạn đọc4MB; quá giới hạn vẫn giữ raw trong RAM để tải, không nhận đã bảo vệ reload.
- `QuestionEditor/QuestionCard`: khôi phục nháp, giữ sau đóng/toggle, không đóng tự động hoặc báo thành công trước parent ack. Chỉ sau áp dụng được xác nhận mới ghi undo và xóa trạng thái kiểm định cũ. Nháp đang gõ sau ack cũ được giữ. Câu/nền đã đổi thì giữ form, khóa Apply, cho đọc nội dung/lời giải hiện tại để đối chiếu.
- `QuestionDraftPanel`: chỉ mục theo tài khoản giúp tìm cả nháp câu đã xóa/đề khác hoặc đề vừa đổi ID sau ack; tải raw, cất bản riêng rồi vẫn tải được, không tự chèn/remap orphan. Cất yêu cầu chép/đọc lại archive trước retire slot cũ; nguồn thay đổi hoặc hết chỗ lưu thì giữ nguyên. SSR ban đầu dùng snapshot trống rồi mới đọc storage sau hydration.
- Nút Lưu đề chặn khi có nháp câu hiện hành/chưa đọc được, giải thích phải Apply hoặc cất riêng. Autosave vẫn lưu phần exam đã áp dụng; nháp local khác với bản đề đã lưu trên server. Không tự flush form cũ vào câu mới.
- Browser360px trước sửa: canvas main chỉ30,4px do rail trái240px và rail phải52px. [Ảnh trước](mobile-before.png). Đã đổi rail trái thành drawer phủ trên mobile, mặc định thu gọn; rail phải thu gọn ẩn trên mobile, mở trợ lý dùng lớp phủ. Có nút nền đóng công cụ, không ép bề rộng vùng soạn. Thêm min-w-0 cho fieldset. Chưa kiểm giao diện sau sửa ở thời điểm ghi mục này.

## Kiểm mới

- [Focused](question-draft-focused.log):8/8đạt, gồm guard câu/nền/quyền, hai writer/account/doc, ack cũ, quota giữ nguồn, invalid number giữ raw, archive malformed/stale/failure, chỉ mục sau đổi ID và phục hồi khác nội dung không retire nguồn. Chỉ storage giả/RAM, không gọi DB/AI.
- [Focused lint](question-draft-lint.log) exit0 cho helper/panel/QuestionEditor/test. Không nhận lint toàn repo hoặc các tệp cũ sạch.
- `package.json` đã đưa test mới vào SAFE. [Build cuối](build-question-drafts-mobile-final.log)46trang/typecheck exit0; [SAFE](safe-question-drafts-mobile.log)20+172=192đạt. HTTP17 của nhóm mẫu được kế thừa vì không đổi API/service; browser dưới đây có ghi/đọc DB thử thật. Không chạy lại API hoặc DB integration chỉ để tăng số kiểm.

## Browser thực tế và DB thử

- Không key,360px: mở/đóng drawer bằng hamburger và nút nền đạt; main từ30,4px trước sửa lên322,4px, documentWidth=360.390px: main352,8px, documentWidth=390, form/điểm0/nút Apply hiển thị đủ; đã xem ảnh [360](mobile-after-360.png), [390](mobile-editor-390.png). Viewport đã reset. Chưa là nghiệm thu toàn màn hình/mobile keyboard/zoom/đọc màn hình.
- A gõ nháp chưa Apply→Lưu đề bị chặn giải thích; đóng/mở bảng giữ sentinel. [Lưu ngoài](question-drafts-global-save-blocked.txt), [mở lại](question-drafts-reopened.txt). Tab B mới tải app độc lập đọc đúng nháp A từ localStorage: [fresh mount](question-drafts-fresh-tab-recovery.txt).
- B sửa nội dung nháp phục hồi trở về câu gốc và thêm lời giải QA khác, Apply được parent xác nhận, autosave ghi DB thật. A giữ nháp cũ; sau poll thấy cảnh báo/Apply disabled, phần đối chiếu có câu/lời giải B. B không retire nháp A khác nội dung. [DOM](question-drafts-stale-kept.txt), [ảnh](question-drafts-stale-kept.png).
- `scripts/verify-question-drafts.cjs before|after-b|after-stale` chỉ đọc fixture owner/email/DB thử: [trước](question-drafts-before-db.json), [B đã lưu](question-drafts-after-b-db.json), [A bị chặn](question-drafts-after-stale-db.json) PASS. Hash câu và version sau A bị chặn giống B; nội dung/ảnh/phần/plan/điểm0giữ nguyên. Đây là fixture giả, lời giải B có sentinel QA; không sửa dữ liệu thật. Không chạy lại script phase này sau khi tiếp tục sửa fixture.
- Cất riêng nháp A qua UI→mục đã cất vẫn có sentinel và nút tải; đóng/mở Sửa lấy đúng lời giải B: [DOM](question-drafts-archived-new-base.txt). Đóng form chưa sửa và bấm Lưu, xác nhận sạch rồi reload thật tab A; bản server và nháp đã cất đều còn: [sau reload](question-drafts-after-reload.txt). Chưa tải lại file raw qua bộ nhập vì đây là bản phục hồi thủ công, không phải định dạng nhập đề được hỗ trợ.

## Giới hạn và tiếp nối

- Browser đã kiểm các ca nêu trên; chưa đủ toàn tiêu chí CV023/025/029/050, chưa nhận đã xong dự án. CV009 phần lưu exam trước đây giữ nguyên; nháp form câu là lớp bảo vệ bổ sung.
- localStorage không là giao dịch liên tab. Journal/token và so raw giảm mất bản; không coi đây là CRDT hay khóa nguyên tử. Nguồn không tự bị xóa khi không đọc được, quá giới hạn hoặc không còn liên kết.
- Nháp thuộc ID đề cũ được tìm trong chỉ mục tài khoản và tải/cất, chưa tự gắn vào ID server mới. Phải đối chiếu bằng tay; không tuyên bố luồng tạo đề mới đang gõ form đã tự chuyển nháp hoàn hảo.
- Khi câu/nền đã đổi: tải/cất nháp cũ rồi đóng/mở bảng sửa để lấy bản hiện tại; chưa có UI ghép từng trường/xung đột. Các nút AI/undo khác vẫn theo hợp đồng trước, không nhận đã kiểm hết.
- Một agent dừng do giới hạn sử dụng sau proposal, chưa ghi mã; root trực tiếp triển khai và kiểm nhóm này. Không sửa schema/DB chính, không gọi provider.
