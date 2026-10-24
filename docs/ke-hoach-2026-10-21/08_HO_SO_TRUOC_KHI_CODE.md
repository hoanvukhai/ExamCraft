# ExamCraft — Hồ sơ chốt trước khi sửa code

> **Mốc chuẩn bị 22/10/2026, đã qua.** Chủ dự án đã duyệt bắt đầu code ngày 22/10. Các câu "dừng trước code", "chưa migration", "[ ] xác nhận bắt đầu S0" (mục 1, 11) và bảng đọc tĩnh mã ở mục 3 là trạng thái lúc lập; nhiều điểm ở mục 3 đã được sửa. Phương án, hợp đồng hành vi, UX, fixture FX01–12 và rủi ro vẫn áp dụng. Trạng thái hiện tại: [hồ sơ 02](../ban-giao/02_TRANG_THAI_TIEP_NOI.md) và [checklist](03_CHECKLIST.md).

Ngày22/10/2026. Chủ dự án đã cho phép làm liên tục phần phân tích, tổng kết, kế hoạch và checklist; **dừng trước bước code để xác nhận**. Tài liệu này là phần bổ sung hiện hành của bộ00–07, không tạo một kế hoạch cạnh tranh. Nguồn mới: [báo cáo nghiên cứu07](../nghien-cuu/07_CHOT_NGUON_NEN_VA_DANH_GIA.md).

## 1. Phương án đề nghị duyệt

Giữ ExamCraft và sửa theo từng phần, bắt đầu bằng việc bảo toàn dữ liệu, thống nhất cách lưu và kiểm quyền. Sau đó hoàn thiện bàn soạn thủ công, khung kiến thức/mẫu, AI, xuất đề, cộng tác và giao bài. Tất cả môn/lớp vẫn trong phạm vi; Toán giúp chủ dự án kiểm nhanh, còn Văn, Ngoại ngữ, thực hành và nhận xét là các ca bắt buộc để tránh thiết kế lệch.

Không yêu cầu đợi thu đủ mọi sách, mọi địa phương mới sửa được lỗi lưu. Nhưng phần dữ liệu chưa kiểm không được gắn “chuẩn”, nạp tự động vào kho dùng chung hoặc dùng để chứng nhận mọi môn đã xong. Hệ thống cho soạn thủ công với phạm vi giáo viên nhập khi gói nguồn chưa đủ; hiển thị rõ mức hỗ trợ.

**Điểm bắt đầu sau xác nhận:** S0/CV001–007, rồi S1. **Điểm dừng hiện tại:** chỉ tài liệu nghiên cứu và thiết kế; chưa migration, chưa thay schema/API/UI, chưa gọi AI trả phí, chưa triển khai.

## 2. Những gì giữ nguyên từ phản hồi của chủ dự án

| Nội dung | Cách thực hiện đã thống nhất |
|---|---|
| Giáo viên là người dùng chính | Trang quản lý, kho riêng, soạn/chấm/xuất/giao bài; học sinh chỉ vào link giáo viên mở |
| Đủ môn và lớp | Danh mục theo chương trình; không bỏ nghệ thuật/GDTC/GDĐP/ngôn ngữ; phát hành gói theo bằng chứng |
| Chọn nội dung linh hoạt | Chọn trên cây kiến thức, mục lục hoặc chat; AI phải cho xem phạm vi đã hiểu |
| Nhiều loại bài | Luyện tập, thường xuyên/định kỳ, khảo sát, thi thử/HSG, tùy chỉnh; thời lượng và mức nhận thức độc lập |
| Mẫu và đáp án đều sửa được | Mẫu chung→bản riêng→đề; đề/đáp án/song song dùng chung dữ liệu; tiêu đề/năm/phần được chỉnh |
| Cùng soạn và lịch sử | Riêng tư trước; mời xem/góp ý/sửa, có lịch sử; công khai không tự cho sửa |
| API key riêng | Kết nối thuộc người gọi; không chia hai ứng dụng miễn phí/trả phí; không suy gói thanh toán từ chuỗi key |
| AI tích lũy kinh nghiệm | Phân tích có nguồn, riêng tư mặc định, người dùng tự chọn đóng góp; dữ liệu phân tích xuất/backup được |
| Không mất dữ liệu | Server chính, nháp dự phòng, phiên bản, backup và kiểm restore; Drive chỉ tùy chọn |
| Dễ dùng | Việc cần làm trước, chi tiết chuyên môn sau; không bắt giáo viên đọc thông tư hoặc cấu hình mọi trường |
| Điều kiện hiện tại | Local trước; chưa có hạ tầng/ngân sách hoặc giáo viên thử; chuẩn bị nhiệm vụ tuyển người và gói mẫu, không tự liên hệ |

## 3. Đối chiếu lại code ở mức đọc tĩnh

Đã đọc bổ sung các tệp dưới đây trên cây làm việc có thay đổi sẵn. Đây không phải kết quả chạy lại toàn bộ hệ thống. Không ghi PASS mới cho test cũ.

| Bằng chứng hiện có | Ý nghĩa | Việc xử lý |
|---|---|---|
| `src/types/exam.ts`: danh sách Subject chưa gồm đầy đủ nghệ thuật/GDTC/GDĐP/ngôn ngữ; DifficultyLevel đang dùng nhãn nhận thức | Thiếu danh mục và đang gộp khái niệm | CV016/017/019: catalog có phiên bản, adapter dữ liệu cũ; giữ nhãn cũ nhưng không tự chuyển thành mức mới |
| `src/lib/scoring.ts`: có fallback Toán/lớp12 và phân phần cố định | Dữ liệu thiếu có thể bị diễn giải thành mẫu không đúng | CV020/036: thiếu ngữ cảnh phải báo cần chọn; điểm lấy từ kế hoạch/câu và chính sách đã chọn |
| `src/components/ExamWorkspace.tsx`: còn lưu `examcraft_current_exam` ở localStorage | Cần xác định đường lưu chính và trạng thái thật | CV008–010: luồng lưu server, nháp theo tài khoản/đề, không dùng cache toàn cục thay bản đã lưu |
| `src/app/api/exams/[id]/route.ts`: PATCH tăng version từ bản đã đọc; chưa có baseVersion trong schema; thay questionItems theo ID truyền vào | Cần chống ghi đè đồng thời và kiểm quyền câu/folder tham chiếu | CV008/011/050: điều kiện phiên bản nguyên tử; đối chiếu quyền trong transaction; test hai người |
| `src/app/api/public/attempts/[id]/draft/route.ts`: kiểm trạng thái/hạn nhưng chưa thấy kiểm session chủ lượt trong hàm | Là điểm cần ưu tiên tái lập quyền ghi nháp | CV012/055/057: kiểm toàn chuỗi middleware/session và HTTP âm tính trước cho người thật dùng |
| `prisma/schema.prisma`: đã có QuestionRevision, Assignment.snapshot, AttemptAnswer, UserApiKey, TeacherAiMemory | Có nền tái sử dụng, không cần thay toàn DB | CV007/008/063: mở rộng hợp đồng và vòng đời, kiểm caller rồi mới dọn |
| `src/lib/db.ts`: có dữ liệu Dexie/localStorage và cờ migrate cũ | Dữ liệu cũ có thể nằm ở trình duyệt khác nhau | CV001/006/014: inventory từng nguồn, preview import, đối chiếu và chống nhập trùng |

Giữ các phát hiện lịch sử chưa tái lập ở trạng thái “cần kiểm”; không kết luận toàn ứng dụng có lỗ hổng chỉ từ một handler hoặc tự xóa code cũ. Trong S0 cần kiểm các đường gọi thật, cấu hình và hành vi HTTP.

## 4. Kiến trúc triển khai đề nghị

Giữ một ứng dụng Next.js/React, PostgreSQL/Prisma và các thành phần hiện có khi đáp ứng hợp đồng. Package hiện ghi Next16.4.2; trước sửa code phải đọc hướng dẫn tương ứng trong `node_modules/next/dist/docs/` theo AGENTS.md. Không nâng dependency hoặc thay framework chỉ để “làm mới”.

Chia trách nhiệm trong cùng ứng dụng:

1. **Lõi tài liệu:** câu/đề, đáp án, ngữ liệu, tài sản, phiên bản, adapter nhập/xuất.
2. **Nội dung giáo dục:** nguồn, chương trình, yêu cầu cần đạt, mục lục sách, phạm vi, khung mức và mẫu.
3. **Quyền và lưu:** chủ sở hữu, thành viên, link, optimistic concurrency, audit, snapshot.
4. **AI:** lựa chọn kết nối cá nhân, tác vụ, ngân sách/lỗi, kết quả có cấu trúc, kiểm định và diff trước áp dụng.
5. **Giao và chấm:** snapshot bài giao, session lượt làm, deadline, bài làm, chính sách chấm và công bố.
6. **Kho phân tích:** nguồn phân tích bền vững, quyền truy xuất, vòng duyệt/thu hồi; chỉ mục có thể dựng lại.

Chưa tách dịch vụ độc lập. Đồng bộ cộng tác cần thử kỹ thuật ở S0 sau xác nhận: văn bản trong cùng khối cần cơ chế hợp nhất; cấu trúc câu/điểm/quyền vẫn cần ràng buộc server. Không lấy “last write wins” làm giải pháp cuối. Tên thư viện sẽ chốt bằng thử hai người/offline/undo, giữ nguyên hợp đồng dữ liệu nếu đổi lựa chọn.

### Ánh xạ dữ liệu hiện có sang hợp đồng dự kiến

| Hiện có | Giữ/tái dùng | Phần cần bổ sung khi code |
|---|---|---|
| Question + QuestionRevision | ID logic, chủ sở hữu, nguồn, payload và lịch sử | SchemaVersion; mã mức có framework-version; độ khó riêng; revision của đáp án/rubric; trạng thái chưa biết |
| Passage + figures | Ngữ liệu dùng chung | Asset có quyền/hash/version; âm thanh và transcript; không nhúng đáp án vào phần công khai |
| Exam + ExamQuestion | Đề và vị trí câu | Bản đề gắn question-revision hoặc snapshot; baseVersion; sectionID ổn định; mục tiêu/phân bổ thực tế |
| ExamTemplate | Mẫu chung/cá nhân | Phạm vi/năm/nguồn/hiệu lực; khối trình bày; origin-version; chính sách chấm |
| Assignment.snapshot | Bài giao không đổi theo đề gốc | SchemaVersion, source-version, chính sách reveal; đính chính bằng sự kiện riêng |
| Attempt + AttemptAnswer | Bài làm và kết quả | Session có quyền, nộp idempotent, trạng thái chấm từng phần, regrade-version |
| UserApiKey + AiUsageLog | Kết nối và nhật ký | Key đúng người gọi ở mọi endpoint; usage/ước tính không giả làm số dư nhà cung cấp |
| TeacherAiMemory | Phân tích riêng | Bằng chứng, nguồn-version, xuất/nhập, duyệt góp chung, invalidation khi nguồn đổi |
| Chưa có đầy đủ nguồn/kiến thức/mục lục | Bổ sung phần thiếu | Quan hệ nhiều–nhiều; tài liệu logic/tệp/bản lưu; NN1/NN2/trình độ/địa bàn/ấn bản |

Không bắt mỗi hàng thành một bảng mới. Chốt chi tiết cột/constraint sau inventory dữ liệu thực tế S0; chưa chạy migration dựa trên bảng khái niệm này.

### Hợp đồng hành vi phải cố định trước viết module

- Lưu gửi phiên bản nền; server chỉ ghi nếu phiên bản còn phù hợp, trả bản đã lưu. Xung đột không báo “đã lưu”.
- AI trả kết quả kèm input-version; khi bản gốc đã đổi, giữ thành đề xuất để giáo viên so sánh. Không ghi đè tự động.
- Mọi thao tác liên kết câu, folder, passage, asset kiểm quyền riêng; quyền đề không suy ra quyền toàn bộ tài sản.
- Endpoint học sinh trả danh sách trường cho phép; tạo response công khai riêng, không xóa vài trường đáp án rồi trả nguyên đối tượng.
- `0`, `false`, chưa có đáp án và không áp dụng là các trạng thái khác nhau. Phiếu khảo sát không sinh điểm0 để giả lập không điểm.
- Một lần nộp chỉ có một kết quả dù retry; deadline server quyết định, có chính sách dung sai rõ và nhất quán.
- Sửa đáp án sau giao phải xác định các lượt bị ảnh hưởng, giữ bài làm gốc và lịch sử chấm lại.
- Mẫu/nguồn mới không sửa ngầm câu/đề đã chốt. Hiệu lực tương lai được lưu nhưng chưa chọn làm mặc định hiện tại.

## 5. Giao diện dự kiến đủ để triển khai

| Màn hình | Phần xuất hiện trước | Phần mở thêm khi cần |
|---|---|---|
| Trang chủ giáo viên | Tạo bài; tiếp tục bài gần đây; thư mục/tìm kiếm | Kho chung, lịch sử, quản lý gói và thống kê |
| Tạo bài | Môn/lớp, mục đích, nội dung đã chọn; bắt đầu từ mẫu hoặc trang trống | Năm học/bộ sách, loại trừ, mức/phân bố điểm, nguồn |
| Bàn soạn | Các câu và tên phần; nút thêm/nhập/AI; trạng thái lưu | Cây kiến thức, nguồn, cấu trúc chi tiết; chỉ một bảng trợ lý mở |
| Đáp án | Chuyển Đề / Đáp án / Song song; sửa lời giải/tiêu chí từng câu | Đáp án chấp nhận, quy tắc chấm, kiểm định và bằng chứng |
| Mẫu trình bày | Bấm sửa tên đề, trường, năm, phần, đánh số | Căn trái/phải/giữa, ẩn dòng, thêm khối và lưu mẫu cá nhân |
| Kết nối AI | Thêm key, kiểm tra, chọn kết nối; lỗi có cách sửa | Model, giới hạn chi phí tự đặt, usage/ước tính và nhật ký đã che bí mật |
| Chia sẻ | Chọn người và quyền xem/góp ý/sửa; link công khai mặc định chỉ xem | Hết hạn/thu hồi/tải/nhân bản/hiện đáp án; quyền phát hành riêng |
| Giao bài | Phiên bản, mở/đóng, nhận diện, cách trả kết quả | Số lượt, thời lượng, trộn, điều chỉnh tiếp cận và chính sách sự cố |

Không thêm màn hình bắt giáo viên chọn “TT27 hay TT22”. Hệ thống đề xuất theo môn/lớp/năm và cho xem căn cứ ở “Nguồn mẫu”. Nếu chưa có mẫu đã kiểm, vẫn cho tạo bản nháp và nói rõ cần giáo viên kiểm cấu trúc. Không dùng nhãn “chuẩn Bộ” cho mẫu cá nhân đã sửa.

Thông báo lưu chỉ gồm: đang lưu / đã lưu / mất kết nối–đã giữ nháp / chưa lưu được / có thay đổi cần đối chiếu. Nút “Lưu vào ngân hàng” khác với tự lưu. Thuật ngữ chuyên môn có giải thích ngắn tại chỗ, không hiển thị cả bảng quy định ngay đầu.

## 6. Lộ trình chi tiết và gói bàn giao

Giữ S0–S9 của tài liệu02 và78 CV của tài liệu03. Bảng này làm rõ phần bàn giao, không đánh dấu việc code đã xong.

| Thứ tự | Phạm vi chính | Bàn giao để chủ dự án kiểm | Cổng bắt buộc |
|---|---|---|---|
| 0 | Baseline, dữ liệu, test thật, thiết kế lưu/cộng tác | Bản hiện trạng, lỗi tái lập, DB thử, phương án rollback, kết quả thử nhỏ | Không làm mất thay đổi sẵn; biết dữ liệu ở đâu |
| 1 | Lưu/mở/adapter/quyền | Một đề nhiều kiểu câu đi hết tạo→lưu→đóng→mở→sửa; hai tài khoản | Không mất dữ liệu, không lưu nhầm hoặc đọc/ghi chéo |
| 2 | Danh mục giáo dục + bàn soạn thủ công | Cây/phạm vi/mẫu; đề–đáp án–song song; tiêu đề sửa trực tiếp | Ít nhất ba cấp và các ca khác Toán; thiếu nguồn không fallback sai |
| 3 | BYOK + AI có kiểm soát | Tạo theo phạm vi, sửa vùng chọn, diff, lỗi/retry/chi phí | Không lộ key; không gọi bằng key người khác; không báo kiểm đúng khi thiếu kết quả |
| 4 | Nhập/trộn/xuất/trình chiếu | Word, PDF/in và bản có hình/ngữ liệu; mã đề tái lập | Không mất câu/đáp án/ngữ liệu; kiểm trực quan các file |
| 5 | Chia sẻ và cùng soạn | Hai người sửa, lịch sử, undo, reconnect, thu hồi | Không ghi đè mất bài; quyền server đổi có hiệu lực |
| 6 | Link giao bài/làm/chấm | Hai phiên học sinh giả, nháp/resume/nộp/chấm tay/công bố | Không lộ đáp án, nộp hộ, vượt hạn/lượt hoặc chấm sai |
| 7 | Phân tích bền vững/trợ lý | Xem nguồn phân tích, sửa/xóa/xuất, góp kho chung theo duyệt | Dữ liệu riêng không lọt truy xuất chung; nguồn đổi được đánh dấu |
| 8 | Gói nội dung toàn môn + vận hành | Ma trận từng gói, tài liệu người dùng, backup/restore, báo cáo tải | Chỉ công bố phạm vi thực sự nghiệm thu; chưa có hosting thì dừng local |

Nội dung giáo dục được chuẩn bị xuyên các đợt0–8, không đợi cuối mới tìm. Mỗi đợt kỹ thuật kèm một ca khác Toán: Văn/rubric, ngoại ngữ/audio, KHTN/thực hành, nhận xét/khảo sát. Không chạy tất cả môn qua mẫu Toán để gọi là nghiệm thu.

Không hứa ngày hoàn thành khi chưa chạy baseline và thử cộng tác/xuất. Sau đợt0, ước lượng theo số gói nhỏ, rủi ro và năng lực thực tế; báo riêng công xây phần mềm, công biên tập dữ liệu, công giáo viên duyệt. Thiếu ngân sách không được chuyển ngầm sang dịch vụ trả phí.

## 7. Kế hoạch dữ liệu và tìm bù đến đủ phạm vi

Nguồn tra cứu hiện có: [161ô cơ sở](../nghien-cuu/goi/NC-NEN-2026-10-22/MA_TRAN_LOP_MON.md) và [302trang sách](../nghien-cuu/goi/NC-NEN-2026-10-22/SACH_VA_HOC_LIEU.md). Chưa tuyên bố bộ học liệu hoàn tất.

| Gói công việc | Trình tự và đầu ra | Ai làm / lúc nào |
|---|---|---|
| ND01 — Văn bản nền | Lưu bản hợp lệ, ngày/hiệu lực, điều/phụ lục sửa; kiểm các dự thảo và văn bản mới trước đóng gói | AI/người triển khai tra nguồn; người am hiểu duyệt trước nhãn chuẩn |
| ND02 — Từng đầu sách | URL→ấn bản/tập→mục lục→nguồn chương trình; đánh dấu SGV/SBT/tập huấn đầy đủ hay bài mẫu | Biên tập dữ liệu, theo hàng matrix; không nạp toàn sách không có quyền |
| ND03 — Bộ đánh giá từng lớp/môn | Thu đề+đáp án+rubric/điểm+ma trận/đặc tả đúng loại; ghi thiếu thành phần; mở rộng địa phương | Người tìm tài liệu và giáo viên duyệt, xuyên S2–S9 |
| ND04 — Đặc thù | Audio/nói; thực hành; nghệ thuật/thể chất; khảo sát; tiếp cận; HSG/tuyển sinh | Mỗi khả năng có ca riêng, không lấy nguồn phổ thông thay chuyên biệt |
| ND05 — Ngôn ngữ/địa phương | NN1/NN2/trình độ; tiếng dân tộc gồm Raglai; địa bàn/năm; nhánh chưa có đánh dấu | Bổ sung trước phát hành gói tương ứng |
| ND06 — Ba bộ và phiên bản | Gói hiện hành ưu tiên trước; Cánh Diều/CTST và bản cũ có mapping riêng | Không xóa dữ liệu người dùng theo bộ cũ; không hứa mọi bộ hiện hành ngang nhau |
| ND07 — Duyệt và duy trì | Source-version, reviewer, phạm vi, ngày duyệt, thu hồi/cập nhật | Trước công bố kho chung; tiếp tục khi nguồn đổi |

Ngưỡng đủ một gói thử: chương trình định danh được, mục lục đúng ấn bản, một bộ mẫu đánh giá có đủ thành phần cho loại bài, quyền dùng phù hợp và hạn chế rõ. Ngưỡng này chỉ đủ thử kỹ thuật. Nghiệm thu chuyên môn cần người duyệt và tập mẫu đại diện do người duyệt thống nhất; không tự đặt một đề là đủ toàn môn.

Nếu tệp công khai bị lỗi: ghi URL/ngày/loại lỗi→tìm bản tại nơi ban hành/đơn vị liên quan→so số hiệu/phiên bản→giữ trạng thái chưa đọc khi chưa khôi phục. Không lấy bản tóm tắt AI làm nội dung thay thế. Đầu mối trường tập trung một tỉnh phải bổ sung thêm nguồn khác trước suy luận mẫu phổ biến.

## 8. Bộ ca chuẩn bị cho triển khai

| Mã chuẩn bị | Nội dung fixture sẽ tạo sau xác nhận | Điều phải kiểm |
|---|---|---|
| FX01 | Dữ liệu local cũ và DB cũ, đủ các kiểu câu/ảnh/điểm0 | Nhập lại không trùng, không mất hình/đáp án; báo phần không đọc được |
| FX02 | Toán2/6/12, phạm vi không liền nhau, nhiều ấn bản | Không dùng mẫu lớp12 cho lớp2; ma trận thực tế đúng |
| FX03 | Văn11 với ngữ liệu chung và hai hướng trả lời | Rubric, chấm tay, giữ nhóm, xuất không cắt mất |
| FX04 | Ngoại ngữ nghe/điền/ghép/nói; NhậtNN1 vàNN2 | Audio/quyền, accepted answers, vai trò và trình độ |
| FX05 | KHTN thí nghiệm + nghệ thuật/GDTC nhận xét | Bài thực hành/tiêu chí; không ép điểm hoặc đáp án trắc nghiệm |
| FX06 | Khảo sát không điểm, câu tùy chọn/bắt buộc | Không tạo đáp án đúng, không xếp hạng mặc định |
| FX07 | TT89 trước/ngay/sau01/12/2026; mẫu cũ đã giao | Chọn đúng hiệu lực; snapshot không đổi |
| FX08 | Hai giáo viên, hai học sinh giả, người xem, admin | Mọi quyền đọc/ghi/liên kết/thu hồi và key cá nhân |
| FX09 | Hai người sửa đồng thời; AI trả muộn; mất mạng | Không overwrite mất dữ liệu, merge/conflict rõ |
| FX10 | Nguồn hạn quyền, bài mẫu SBT, nguồn lỗi, chỉ dẫn độc hại | Không gọi mẫu là toàn sách; không làm theo chỉ dẫn từ tài liệu |
| FX11 | Đề dài, công thức/bảng/hình, trộn nhiều mã | ID ổn định; mở được Word và kiểm trang in/PDF |
| FX12 | Backup gồm DB+tệp+thông tin cần giải mã; restore máy thử | Nội dung/quyền/asset khôi phục; không ghi bí mật vào Git |

Các fixture chưa được tạo/chạy; tên trên là yêu cầu đầu vào. Dùng nội dung tự soạn hoặc có quyền; dữ liệu minh họa không gắn nhãn đề Bộ/trường. DL08 giáo viên duyệt tiếp tục là điều kiện chuyên môn trước pilot.

## 9. Bảo toàn dữ liệu và quy trình đưa thay đổi vào dùng

Trước migration: lưu baseline và thay đổi chưa commit; phân biệt dữ liệu server, IndexedDB, localStorage, tệp và secret. Tạo DB thử tên riêng, đối chiếu cấu hình đã che bí mật. Sao lưu phải thử khôi phục, không chỉ thấy tệp xuất tồn tại.

Migration theo hướng thêm/đọc tương thích trước, chuyển thử, đối chiếu số câu/đáp án/điểm/ảnh/quyền, kiểm chạy lại không nhân đôi. Chỉ bỏ trường/route cũ khi không còn caller hoặc dữ liệu cần đọc và có phương án link cũ. Không đổi `difficulty` cũ sang khung mới bằng đoán; lưu nhãn gốc và đánh dấu cần ánh xạ.

Backup dự kiến gồm DB, asset, source metadata, phân tích/memory và manifest schema-version. Key không nằm trong file xuất tài liệu cá nhân; vận hành phải bảo quản bí mật giải mã riêng. Drive chưa tích hợp, không dùng “có nhiều người dùng” thay backup.

Rollback: dừng ghi khi cần, giữ bản dữ liệu phát sinh, chọn mốc đã thử phục hồi; không dùng hạ schema phá dữ liệu mới. Chưa thực hiện thao tác nào trên DB thật trong lượt chuẩn bị.

## 10. Rủi ro và cách quyết định

| Rủi ro | Cách giảm | Có chặn bắt đầu local không? |
|---|---|---|
| Chưa đủ tài liệu toàn môn | Bảng độ phủ và trạng thái từng thành phần; fixture minh họa; phát hành theo gói | Không; chặn nhãn kho hoàn chỉnh |
| Chưa có giáo viên thử/duyệt | Chuẩn bị danh sách vai trò và nhiệm vụ thử, báo chưa duyệt | Không; chặn nghiệm thu chuyên môn |
| Nguồn đổi/ban hành mới | effectiveFrom/To, ngày kiểm, cảnh báo phụ thuộc, snapshot | Không; chặn mặc định không có căn cứ |
| Quyền sách chưa đủ | Metadata/link trước; không nhập toàn sách vào kho chung/AI thương mại | Không; chặn phân phối nội dung đó |
| Working tree đang có sửa đổi | Không reset; baseline và đối chiếu trước mỗi đợt | Phải xử lý trong S0 trước sửa chồng |
| Chưa có DB thử | Xác định môi trường cô lập trước test ghi/migration | Chặn test ghi/migration, không chặn đọc và thiết kế |
| Đồng bộ cộng tác phức tạp | Thử nhỏ từ S0; giữ hợp đồng câu/phiên bản/quyền | Chặn chốt giải pháp cộng tác, không chặn sửa lỗi lưu đơn |
| API provider thay model/quota | Kiểm thông tin provider khi làm adapter; không hardcode gói miễn phí | Không; test bằng mock trước, thử thật theo ngân sách đã chọn |
| Không có hạ tầng/kinh phí | Local; đo tải/chi phí trước đề nghị triển khai | Chặn public deployment, không chặn local |

Không cần chủ dự án tự trả lời chuyên môn giáo dục. Việc cần chủ dự án ở mốc hiện tại chỉ là xác nhận bắt đầu code theo phạm vi. Khi đến pilot, cần người dùng thử và người duyệt theo môn/cấp; khi ra ngoài local, cần nơi chạy, người vận hành và ngân sách. Không tự gửi lời mời hoặc mua dịch vụ.

## 11. Checklist chuẩn bị và điểm dừng

- [x] Hợp nhất định hướng: giáo viên, toàn môn/lớp, quyền riêng, BYOK, mẫu sửa được, lưu/backup.
- [x] Kiểm bổ sung nguồn nền, phiên bản sách và hiệu lực; ghi nguồn chưa đầy đủ.
- [x] Tạo danh mục sách/học liệu cụ thể và bảng lớp–môn; có dữ liệu máy đọc để tiếp tục.
- [x] Đánh giá từng nhóm và thử mô hình bằng các ca đối trọng trên giấy.
- [x] Đọc lại các phần code liên quan để xác định điểm bắt đầu; tách quan sát tĩnh với lỗi cần chạy lại.
- [x] Xác định kiến trúc, hợp đồng dữ liệu/hành vi, UX, migration/rollback và phạm vi không làm.
- [x] Lập lộ trình, gói công việc, fixture, điều kiện nghiệm thu, rủi ro và đầu vào còn thiếu.
- [ ] Thu/đọc/duyệt toàn bộ học liệu của mọi ô và nhánh: chưa hoàn thành; ND01–07 tiếp tục xuyên lộ trình.
- [ ] Xác nhận của chủ dự án để bắt đầu S0 và sửa code.
- [ ] Chạy baseline/test/restore/spike, migration và triển khai: chưa thực hiện theo kế hoạch mới.

**Kết luận quyết định:** đề nghị duyệt bắt đầu cải tiến local theo S0→S1, giữ toàn bộ phạm vi và các cổng chất lượng trên. Việc nghiên cứu đã đủ để lập phương án; dữ liệu chuyên môn chưa đủ để tuyên bố sản phẩm hoàn thiện. Sau khi được xác nhận, báo cáo theo CV/NT và bằng chứng thực, không đánh dấu xong theo số file đã sửa.
