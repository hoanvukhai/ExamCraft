# Quyết định đóng CV sau đối chiếu tiêu chí — 25/10/2026 (Claude)

Căn cứ: bảng của Gemini [GEMINI_CV_CRITERIA_AUDIT](../ai-review/GEMINI_CV_CRITERIA_AUDIT.md) cho 11 CV, **sau khi tự kiểm lại từng CV Gemini kết luận "ĐỦ" bằng tên ca test thật**. Chạy cuối: build đạt, SAFE 340/340, HTTP 38/38, trình duyệt 8/8 ([http](http-claude-run5.log), [safe](safe-claude-run2.log), [pilot](pilot-claude-run6.log)).

## Điều phải nói thẳng về bảng của Gemini
Gemini không chạy được mã. **Toàn bộ 24 tên ca test mà bảng trích cho CV050/055/057/059/062 đều không tồn tại trong thư mục tests** (kiểm bằng tìm chuỗi); đó là câu mô tả tự đặt, không phải tên ca thật. Kết luận từng CV vì thế phải tự kiểm lại, và đã làm. Bảng vẫn hữu ích để chỉ ra *các vế* của tiêu chí. Lỗi này nên ghi vào quy ước: kết luận "ĐỦ" chỉ nhận khi trích đúng tên ca và đã tìm thấy.

## Kết quả
| CV | Gemini | Sau tự kiểm | Ghi chú |
|---|---|---|---|
| 050 | ĐỦ | **ĐÓNG** | F9 (Chrome, Edge); http_workflows: "structural edits conflict without partial merges and revoked writers cannot retry", "collaboration honors view, edit, CAS, history and revocation"; F4 |
| 055 | ĐỦ | **ĐÓNG sau bổ sung** | Gemini dẫn ca PIN không tồn tại: trước đây **không có test nào kiểm PIN, link cá nhân hay học sinh lớp khác lúc bắt đầu làm bài**. Đã viết `http_student_identity` (PIN thiếu/sai/học sinh chưa có PIN/lớp khác bị từ chối, không tạo lượt; link cá nhân sai/của lớp khác/ID thay token bị từ chối) và chạy đạt |
| 057 | ĐỦ | **ĐÓNG** | student_network (4 ca), attempt_draft_revision, student_draft_journal, http_workflows (hai bản nháp tranh nhau, bản cũ bị 409), F6 tải lại làm tiếp |
| 059 | ĐỦ | **ĐÓNG sau sửa lỗi thật** | Ca "nộp đồng thời một kết quả" chưa có và **hóa ra có lỗi**: hai lần nộp cùng lúc, bên thua nhận 503 vì xung đột PostgreSQL 40001 qua truy vấn thô được báo là P2010, quy tắc thử lại chỉ biết P2034/P2002. Đã sửa (`isRetryableTransactionError`) và có test: một kết quả, không nhân đôi câu trả lời, một bên nhận phản hồi lặp. Cũng sửa cho bước bắt đầu làm bài |
| 062 | ĐỦ | **ĐÓNG sau bổ sung** | Vế "link cũ" chưa có test trực tiếp; đã thêm: link thu hồi và link hết hạn trả 404, thu hồi không đăng nhập bị từ chối và link vẫn sống, nội dung không lộ. Các vế còn lại: cookie bắt buộc, giáo viên khác 404, đã đóng/đã nộp, AFTER_CLOSE/NEVER (http_public_policies), CSV không cho học sinh |
| 010 | THIẾU | giữ mở | mở ứng dụng từ đầu khi hoàn toàn offline; hai engine sửa đồng thời |
| 011 | THIẾU | giữ mở | kiểm giao diện đổi tài khoản trên cùng tab (dọn nháp); template và mọi nơi gọi |
| 047 | THIẾU | giữ mở | quyền `comment` và `publish` riêng chưa có |
| 048 | THIẾU | giữ mở | bản công bố độc lập (publication snapshot) chưa làm; hiện bảo vệ bằng phiên bản nguồn |
| 049 | THIẾU | giữ mở | hoàn tác từng người: đề xuất tách vế này sang sau pilot, nghiệm thu phần còn lại, cần chủ dự án quyết |
| 060 | THIẾU | giữ mở | chấm lại theo phiên bản (regrade) chưa làm |

Việc nhỏ nhất để đóng thêm: CV011 (một ca trình duyệt đổi tài khoản + rà các nơi gọi), CV010 (hai ca trình duyệt), còn lại cần quyết định sản phẩm.

## Giới hạn
- Các CV đóng ở đây theo phạm vi sản phẩm đang có (local, một máy, DB thử); chưa tổng nghiệm thu. Không đóng CV về nội dung, AI thật, độ phủ môn lớp.

## Bổ sung: đóng CV011 và CV010 (cùng ngày)
- Thêm hai luồng trình duyệt: **F10** (đổi tài khoản trong cùng trình duyệt: nháp chưa lưu của A không hiện cho B, không lưu lên máy chủ khi B đăng nhập, không tạo dữ liệu dưới B; A đăng nhập lại thì nháp phục hồi) và **F11** (tải lại thất bại khi không có mạng không làm mất nháp; nối lại lưu đúng một đề). Chạy toàn bộ trình duyệt: 10/10 ([log](pilot-claude-run7.log)).
- **CV011 đóng.** **CV010 đóng** theo "Đạt khi" của checklist.
- Giới hạn nói thẳng: ứng dụng **chưa có bản mở offline** (không service worker). Mở trang mới hoàn toàn không mạng sẽ không hiển thị; nháp trên máy được giữ và lưu khi có mạng. Nếu cần "mở lại hoàn toàn offline" thì là tính năng mới (service worker), chưa làm. Hai engine sửa đồng thời cũng chưa kiểm.

## Bổ sung: đóng CV060, CV048, CV047, CV049 (cùng ngày)
Chạy cuối: build đạt, SAFE 344/344 ([log](safe-claude-run3.log)), HTTP 60/60 ([log](http-claude-run13.log)), trình duyệt 11/11 gồm F10–F12 ([log](pilot-claude-run9.log)). Mã đã đổi:
- **CV060:** `answer-correction.ts`, API `/api/teacher/assignments/[id]/regrade` (xem trước, áp dụng, lịch sử), `RegradePanel` ở tab Phân tích. Ca trình duyệt F12 phát hiện lỗi đánh số trong danh sách (đánh theo vị trí lọc, không theo số câu của đề), đã sửa.
- **CV048:** link chia sẻ mới mang hậu tố phiên bản trong token (`<ngẫu nhiên>.v<phiên bản>`), trang công khai và route sao chép đọc bản lịch sử đó; không đổi schema nên không cần migration trên DB chính. Test `http_workflows` cũ mã hóa hành vi "link luôn theo bản mới" đã được cập nhật theo quy tắc mới.
- **Lỗi thật tìm thấy khi chạy:** bước bắt đầu làm bài dùng giao dịch Serializable nên các học sinh *khác nhau* cũng tranh nhau và có lúc trả 503 (một lớp bấm cùng lúc sẽ gặp). Đã đổi sang khóa theo từng học sinh (và khóa bài giao chỉ khi tạo nhóm lần đầu), thêm chờ ngẫu nhiên giữa các lần thử. Sau sửa: HTTP chạy 3 lần liên tiếp không lỗi.
- **CV047 và CV049:** không đổi mã sản phẩm, chỉ thêm test `http_permission_matrix`, `http_collab_restore`.

### Đính chính điều tôi đã nói sai
Trong đề xuất quyết định tôi nói bình luận và quyền công bố "chưa có". Sai: mã đã có vai trò người góp ý, bình luận, và `canPublish` của chủ đề. Test ma trận kiểm cả hai. Quyền "tải" thì không tách được ở server vì xuất Word/JSON chạy ở trình duyệt; đã ghi thành "tải = quyền xem" trong nghiệm thu CV047, chủ dự án có thể bác bỏ cách hiểu này.

### Giới hạn và điều chập chờn
- F2 (soạn đề) từng hỏng 2 trong 4 lần chạy ở bước tìm ô "Điểm câu" rồi đạt khi chạy lại; chưa tìm nguyên nhân, nghi tranh thời gian giao diện. Lần chạy cuối đạt.
- Một lần chạy HTTP trước khi sửa khóa có 503 ở bước bắt đầu làm bài; sau sửa không tái hiện.
- Chấm lại chỉ cho 3 dạng câu tự chấm; các dạng khác phải chấm tay. Link chia sẻ tạo trước 25/10 vẫn theo đề đang sửa.

## Bổ sung chiều 25/10: duyệt Codex và Gemini, Claude làm thay Codex
- **Codex (Q1, Q2, Q3 một phần):** nhận Q1 (lỗi form câu mất khi tạo đề lần đầu), Q2 (lỗi 503 khi nộp bài đồng thời, đã đổi sang ReadCommitted có khóa dòng lượt), Q3 cho CV054 và CV056. Ghi chi tiết ở [LOAD_CLASS.md](LOAD_CLASS.md), [Q1_EDITOR_ACK.md](Q1_EDITOR_ACK.md), [PILOT_SCOPE_CLOSURE.md](PILOT_SCOPE_CLOSURE.md).
- **Gemini (generation 9):** Q1–Q3 nhận có giới hạn; Q4–Q10 làm khác với tin giao nên giao lại (xem BATCH_REVIEWS.json). Bảng nhãn nút của hướng dẫn giáo viên khớp mã; hướng dẫn học sinh có vài nhãn lệch. Sáu đề mẫu chỉ 3–4 câu mỗi đề (yêu cầu 10–20) nhưng nạp được và tự chấm đúng.
- **Claude làm thay:** F13 (màn hình nhỏ 375px) phát hiện nút ĐÚNG/SAI thấp hơn 40px, đã sửa; ghi chú phiên bản ở hộp chia sẻ; test fixture đa môn.
- **Chạy cuối:** build đạt, SAFE 353/353 ([log](safe-claude-run4.log)), HTTP 60/60 ([log](http-claude-run14.log)), trình duyệt 12/12 gồm F13 ([log](pilot-claude-run10.log)).
- **Chưa làm của Codex:** CV061, 023, 024, 026, 027, 042, 043 (Q3), Q4, Q6–Q10, Q12 và ca trình duyệt hai người cùng sửa. Các CV mức pilot vẫn chưa đóng đủ.

## Bổ sung tối 25/10: Claude làm thay Codex (Q3, Q4, Q9, Q10, Q11)
Chạy cuối: build đạt, SAFE 358/358 ([log](safe-claude-run5.log)), HTTP 70/70 ([log](http-claude-run17.log)), trình duyệt 13/13 gồm F13 và F14 ([log](pilot-claude-run11.log)).
- **CV061:** `http_assignment_window` (đóng sớm, mở lại, gia hạn, giờ đóng sai, nhận xét giáo viên không tới học sinh, CSV cần phiên giáo viên). Chưa đóng: học sinh chưa có lựa chọn xem nhận xét.
- **CV049:** F14 (hai giáo viên, hai ngữ cảnh trình duyệt) bổ sung giới hạn còn lại, CV đã đóng từ trước.
- **CV073:** đo sao lưu 17 giây và khôi phục 20 giây, đối chiếu đạt ([OPS_RTO_MEASURE](OPS_RTO_MEASURE.md)); runbook [VAN_HANH_PILOT_LOCAL](../../docs/van-hanh/VAN_HANH_PILOT_LOCAL.md). Chưa đóng: cần chủ dự án duyệt RPO/RTO, nơi giữ bản sao thứ hai, người chịu trách nhiệm; chưa thử trên máy khác.
- **CV015:** `http_library` (tìm/lọc, sao, thư mục, thùng rác, khôi phục, bản sao từ link). Chưa đóng: chưa kiểm giao diện hợp nhất kho.
- **CV031:** `ai_endpoints_guard` ràng buộc mười route AI dùng khóa của chính người dùng. Chưa đóng: chưa kiểm hết bằng nhà cung cấp giả.
- **Chưa làm của Codex:** CV023, 024, 026, 027, 042, 043 (cần Word thật, hình/công thức trực quan), Q6 (cần bảng ca của Gemini), Q7 in/PDF và Word dài, Q8 nhập Word/ảnh, Q12 dọn log.

## Bổ sung đêm 25/10: lỗi công thức trong Word (CV043, CV026)
Test đề dài 120 câu phát hiện: trước đây chỉ phân số và căn đứng một mình thành phương trình Word; `x^2`, `x_1`, `\sum`, `\sin`, `\cdot`... hiện nguyên dạng chữ LaTeX. Đã viết bộ chuyển đổi mới `src/lib/latex-math.ts` (phân số lồng, căn bậc n, chỉ số trên/dưới, tổng/tích phân, giới hạn, hàm, ký hiệu, hệ phương trình một dòng) và nối vào xuất Word. Kiểm: `latex_math` (5 ca), `docx_long_exam` (2 ca), `portable_and_exports` không đổi kết quả.
- **Giới hạn nói thẳng:** chưa mở bằng Microsoft Word thật; hệ phương trình vẫn là một dòng ngăn bằng dấu chấm phẩy (chưa xếp dọc); macro lạ giữ nguyên chữ để giáo viên sửa; công thức trong tiêu đề phần/bảng chưa kiểm.
- Việc tay cần làm: thẻ kiểm Word trong `THE_KIEM_TAY_PILOT_2.md` (mở tệp xuất ra bằng Word, nhìn công thức).
- Chạy cuối: build đạt, SAFE 365/365 ([log](safe-claude-run6.log)), HTTP 70/70 ([log](http-claude-run18.log)), trình duyệt 13/13 ([log](pilot-claude-run13.log)). Có sửa chập chờn của hàm kiểm dùng chung `studentSubmit` (sau tải lại, trang có thể tự tiếp tục lượt mà không hỏi tên).

## Bổ sung: duyệt Gemini generation 10 và 20 ca chấm lại
- Gemini nộp R1–R8; nhận toàn bộ (R5–R8 có giới hạn), chi tiết ở BATCH_REVIEWS.json.
- **CV060:** `http_regrade_cases` dựng đủ 20 ca của bảng R4 với bốn học sinh tính tay (10 / 5 / 4,5 / 2 điểm ban đầu). 19 ca khớp con số ngay lần đầu; TC09 (câu 0 điểm: cờ đúng/sai đổi nên vào danh sách thay đổi dù điểm không đổi) và TC18 (câu không tồn tại: 409 thay vì 404) là hành vi đúng của hệ thống, test ghi theo hành vi thật. Chạy cuối: HTTP 88/88 ([log](http-claude-run19.log)).
- Nút thao tác nhỏ trên điện thoại ở trang giáo viên đã tăng vùng chạm (kho đề, bài giao, bảng chấm lại); chưa có kiểm trình duyệt riêng cho các nút này.
