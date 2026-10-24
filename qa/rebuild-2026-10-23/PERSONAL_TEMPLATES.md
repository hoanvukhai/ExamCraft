# CV021 — Mẫu cá nhân, nguồn và bản sao bất biến (23/10/2026)

## Đã triển khai

- `ExamTemplate.sections` JSON giữ envelope v1; không đổi Prisma/schema/migration. Bản mới có revision riêng, owner từ phiên đăng nhập, isSystem=false, category personal/status needs_review. Mọi lần lưu tạo bản riêng; không API sửa/xóa mẫu nguồn. Snapshot chỉ gồm trường tiêu đề/bố cục, ngữ cảnh đánh giá, kế hoạch và cấu hình phần; không chứa câu hỏi/đáp án/hình/toàn bộ gói kiến thức/tài khoản.
- `src/lib/exam-template.ts` kiểm dữ liệu chặt: kế hoạch dùng schema hiện tại tối đa100ô/1.000câu; header tối đa30dòng; tối đa100phần và30nguồn; URL nguồn chỉ http(s), quyền tự khai/unknown, ngày nguồn hợp lệ. Không nhận trường owner/isSystem/status/origin/verification hay câu hỏi do client thêm. Mẫu cá nhân không được nhận nhãn phù hợp chuyên môn/chính thức.
- `src/lib/exam-template-service.ts`: GET/list chỉ own hoặc owner=null+isSystem. Mẫu của giáo viên khác trả404 cả khi đọc lẫn dùng làm nguồn sao chép. Nguồn mới được server đọc và đối chiếu revision rồi mới ghi origin. Revision nguồn cũ trả409; nguồn vẫn nguyên trạng. Các mảng sections cũ được adapter lowercase đúng7type, giữ0/progressive scoring; không suy framework/lớp cụ thể từ grade range. Revision legacy là fingerprint nội dung rawrow (key order không ảnh hưởng), nhãn luôn chưa đối chiếu. Mẫu cũ không đọc được vẫn giữ DB gốc và báo chưa thể dùng.
- POST giữ clientRequestId UUID, sinh ID theo owner+requestID, advisory transaction lock trước lookup, fingerprint nội dung. Retry cùng nội dung trả bản đã có; cùng requestID khác nội dung409; không ghi đè. Advisory void được cast text cho Prisma. Tests mock chỉ chứng minh gọi lock/thứ tự/logic retry; chưa thay bằng bằng chứng đồng thời PostgreSQL thật.
- Routes `GET/POST /api/templates`, `GET /api/templates/[id]` dùng requireRequestAuth (pin tài khoản + same-origin mutation). GET no-store; list bounded page<=10.000,limit<=50 (mặc định20). POST đọc stream và đếm byte thực tế tối đa2MB, không tin Content-Length giả; lớn hơn trả413 trước khi DB ghi.
- `metadata.templateApplication` chỉ là bản nội dung đã sao chép/provenance khai báo, không là quyền truy cập nguồn hoặc liên kết sống. Normalizer kiểm syntax, giữ snapshot lịch sử và các tham chiếu plan cũ để rà soát. Không ghi root Exam.templateId hoặc thay quyền quản lý hiện hành.
- Apply có preview và chọn rõ header/context/plan/sections; guard stamp tài khoản ngoài panel identity+document nội dung/ngữ cảnh, đổi nền trả nguyên đối tượng, không setState trong updater. Câu/đáp án/liên kết/points không đổi. Đề có câu tuyệt đối không thêm/thay sections vì có thể đổi fallback scoring; chỉ đề rỗng mới chép phần với ID mới. Gói/scope hiện tại luôn giữ; plan copy đúng revision/outcome IDs gốc, không remap, còn lệch phải review.
- Capture mới ghi null cho default-layout/no-framework; apply đổi về optional metadata chỉ khi option tương ứng được chọn. Legacy absent nghĩa không đặt, không xóa lựa chọn hiện tại; plan không có không xóa plan đang có. Tùy chỉnh sau apply được tính lệch từ snapshot, luôn là bản cá nhân cần rà soát.
- `ExamTemplatePanel` thu gọn gần phần soạn, API owner pin, list/read trước apply, xem trường hiện tại→mẫu, bố cục từng dòng, kế hoạch/phần; nguồn tự khai sửa được khi lưu cấu hình hiện tại thành bản riêng. Request ID giữ cho retry cùng nội dung. Các stamp/deviation memo theo exam để không serialize ảnh lớn khi gõ tên/nguồn. Root nối panel và thêm test vào safe.
- UX header bổ sung theo QA root: khi apply được parent xác nhận, displayForm lấy metadata mới nhất để không tiếp tục hiện giá trị cũ của trường không sửa; trước xác nhận/xung đột vẫn giữ draft. Không reset state bằng effect/render. Không sửa báo cáo HEADER_LAYOUT đang do root cập nhật.

## Đã kiểm mới

- `node --import tsx --test tests/exam_template.test.ts tests/header_layout.test.ts tests/exam_plan.test.ts`:25/25đạt (8template/service +8header +9plan).
-8ca template: hai giáo viên list/read/source isolation, owner/category/status và clone không sửa nguồn; retry/lock/thay nội dung409; legacy uppercase/zero/progressive và stale revision; authority/URL/question/limit/grade sai bị chặn; page/body stream2MB; apply đề có câu giữ section/fallback và mọi câu; empty fresh IDs/stale plan/snapshot roundtrip/deviations; explicit null chỉ clear option được chọn, absent legacy/plan không tự xóa.
- Focused ESLint helper/service/panel/modal/routes/test exit0 ở lượt cuối. Root chạy typecheck/build/HTTP tích hợp; không chạy typecheck/build/server riêng theo yêu cầu RAM.
- Không gọi provider, không ghi DB hoặc đổi seed/schema. Fake tx chạy service thật với predicate owner/system, không kết nối Prisma singleton. Chưa nhận mock lock là chứng minh concurrency PostgreSQL.

## Giới hạn và CV còn mở

- HTTP trên PostgreSQL thử và UI lưu→mở→apply→tùy chỉnh→lưu bản mẫu mới đã đạt ở đợt tích hợp bên dưới. Không dùng số test để đóng CV021; thư viện nguồn được duyệt và nghiệm thu chuyên môn vẫn mở.
- Source/rights/effective dates là thông tin tự khai, chưa reviewer chuyên môn/pháp lý; legacy names không chứng minh mẫu chính thức hiện hành. Không có nội dung gói sách/chương trình đã duyệt trong mẫu này.
- Chưa có thư viện mẫu trường/nguồn hệ thống đã duyệt hoặc quy trình duyệt/phát hành; chỉ bản cá nhân và xem nguồn cũ trong quyền hiện tại. Không có sửa/xóa/PATCH mẫu, không auto đồng bộ vào đề hoặc bài đã giao.
- Bản áp dụng là nội dung đề đã sao chép; người có quyền đọc đề có thể đọc snapshot theo quyền đề, nhưng không tự có quyền GET mẫu nguồn riêng. HTTP đã xác nhận public share bỏ templateApplication; các đường public khác vẫn phụ thuộc allowlist hiện hành.


## Bổ sung UI — Xác nhận apply, ngày nguồn và cấu hình phần

- Tách trạng thái apply khỏi thông báo gửi chung: giữ attempt dự kiến và chỉ nhận đã áp dụng khi metadata từ parent khớp bản sao đó. Trạng thái pending/rejected/applied/applied_changed được suy ra, không setState trong updater/effect/render. Own apply không tự báo bản xem trước cũ; thao tác bị guard từ chối không hiện thông báo thành công. Apply lặp bị khóa đến khi người dùng đối chiếu lại; preview/nháp vẫn giữ khi xung đột.
- Preview ghi rõ môn/phạm vi lớp đã khai và mốc từ/đến của từng nguồn, kể cả chưa ghi. Ngày ngoài khoảng tự khai tạo cảnh báo cần rà soát, không chứng nhận hiệu lực pháp lý; hai đầu mốc được tính gồm ngày đó. Ngày kiểm mặc định theo lịch máy đang dùng, test truyền mốc cố định.
- Trước copy sections vào đề rỗng, bảng hiển thị cả cấu hình hiện tại và mẫu: tên/dạng/chỉ dẫn, số câu, điểm mỗi câu, dãy progressive theo đúng thứ tự nguồn và tổng điểm phần. Giữ số0 khác chưa đặt; không suy cách chấm từ số phần tử, không làm tròn0,333. Đề có câu vẫn tuyệt đối không thay section hoặc fallback điểm.
- `node --import tsx --test tests/exam_template.test.ts`:11/11đạt (8ca cũ +3ca mới cho ack/refusal/later edit, ngày và scope nguồn, preview scoring/count/progression).
- Focused ESLint helper/panel/test exit0. Không đổi API/service hoặc chạy lại HTTP/DB/provider/build/typecheck trong đợt UI này. Root sẽ ghi bằng chứng runtime/HTTP/build/SAFE/UI riêng; test helper chưa thay kiểm browser thực tế.

## Tích hợp root — HTTP trên PostgreSQL thử

- [HTTP](http-personal-templates.log):17/17đạt, gồm10workflow và nhóm auth, chỉ `examcraft_test_20261022` qua health guard. Build đầu46trang/typecheck exit0; sau đó ba sửa UI không đổi API/service. [Build cuối](build-personal-templates-final.log)46trang/typecheck exit0; [SAFE](safe-personal-templates.log)20+164=184đạt. Các thay đổi nháp câu/mobile sau mốc này đang kiểm riêng, không nằm trong kết quả build này.
- Hai POST đồng thời cùng requestID/payload trả201+200 cùng ID; đổi payload cùng ID trả409. Hai tài khoản không xem/dùng mẫu riêng của nhau; stale account409, cross-origin403, anonymous401; body quá2MB413. Mẫu legacy hệ thống chỉ đọc trong quyền và giữ0/progressive.
- Nguồn stale409; bản dẫn xuất giữ origin/revision và JSON nguồn không đổi. Mô phỏng nguồn đổi owner chỉ trong fixture DB thử: retry bản sao đã ghi trả200 cùng ID, tạo bản mới từ nguồn đã mất quyền trả404; khôi phục owner fixture trong finally. PATCH/DELETE405. Sau chạy dọn đúng fixture, không sửa DB chính.
- Áp dụng rồi lưu/mở giữ provenance snapshot và các câu; public share không chứa templateApplication. Đây là kiểm hợp đồng server/helper, chưa thay thao tác UI.

## Browser và đối chiếu DB — hoàn tất 24/10

- App production3117/DB thử, tài khoản QA không có key: lưu mẫu gốc từ cấu hình đề, mở preview, Apply chỉ header rồi bấm Lưu. Parent xác nhận thành công, không có cảnh báo stale giả; nút Apply khóa đến khi đối chiếu lại. [DOM](templates-applied.txt).
- Đổi năm học qua dialog, UI báo đã tùy chỉnh; lưu thành mẫu mới có origin mẫu gốc. Bấm lưu lại cùng nội dung không nhân đôi. Mẫu gốc chưa có ngày và preview ghi “chưa ghi”; mẫu mới bổ sung ngày2027-01-01→2027-12-31 qua trường date UI, preview hiện đủ và báo ngoài khoảng tự khai ở ngày chạy. Không truy cập URL minh họa example.invalid hoặc nhận nguồn đã duyệt. [DOM](templates-custom-copy.txt), [ảnh](templates-custom-copy.png).
- Script `scripts/verify-personal-templates.cjs baseline|source|final` chỉ đọc fixture xác định/owner QA/DB thử. [Trước](templates-baseline-db.json), [mẫu gốc](templates-source-db.json), [sau](templates-final-db.json) đều PASS: đúng2mẫu, origin/revision đúng, hash JSON mẫu gốc không đổi; hash toàn câu/phần/plan giống trước, giữ ảnh/lời giải/điểm0. Script gắn trạng thái fixture ở mốc này, không tự chạy lại sau khi sửa câu trong nhóm khác.
- Tự động duyệt chặn reload tab cũ vì chưa xác minh nháp sạch; giữ nguyên tab cũ và dùng tab QA riêng. Không bypass hoặc bỏ nội dung tab cũ. Giao diện ngày ban đầu qua Playwright fill không thay giá trị; đã đổi sang thao tác setValue trên date field và kiểm giá trị thực trước lưu bản mới. Không sửa DB để ép ca này đạt.

