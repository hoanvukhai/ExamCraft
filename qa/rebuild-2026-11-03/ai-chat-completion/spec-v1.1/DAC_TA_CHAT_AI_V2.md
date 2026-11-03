# Đặc tả khắc phục trợ lý AI soạn đề — phiên bản 1.1

Ngày 03/11/2026 · Bản 1.0 do Codex viết; bản 1.1 do Claude duyệt và sửa · **Chưa triển khai mã**.

Tài liệu này quy định hành vi cần làm, không mô tả chức năng đã hoàn thành. Căn cứ: [báo cáo kiểm tra](BAO_CAO.md), bằng chứng trong cùng thư mục và mã nhánh `claude/editor-v2` tại `F:/Workspace/Zazz/ExamCraft/tmp/canva-a`. Phiên bản mã đã kiểm được ghi trong `source-snapshot.json`; phải đối chiếu sửa mới trước khi triển khai.

Đọc nhanh: mục 0, 1–3 và 15. Khi làm mã: đọc thêm mục 4–14, dùng [bảng nghiệm thu](NGHIEM_THU_CHAT_AI_V2.md). Đây là đặc tả một nhóm sửa, **không thay checklist 03, hồ sơ 02 hay các quyết định nghiệp vụ toàn dự án**.

## 0. Chốt của người duyệt (bản 1.1) — mục này thắng khi mâu thuẫn với phần sau

Claude đã đối chiếu bản 1.0 với mã tại `865bcea` và chạy thử trên DB thử. Hướng chung của Codex **đúng và giữ nguyên**: đề trống → chat nhớ yêu cầu → tự điền phần đã rõ → hỏi ngắn phần thiếu → một đề xuất trọn vẹn → nhận một lần, có hoàn tác. Bản 1.1 sửa các điểm dưới đây.

**Hai lỗi đã tái hiện mà bản 1.0 chưa có** (build production, DB thử, 03/11):

| Lỗi | Đã thấy | Hậu quả |
|---|---|---|
| Bảng Thông tin đề hiện sai đề | Đề "Vật lí 9, 60 phút": sheet đúng, form lại hiện `ĐỀ KIỂM TRA MỚI / 6 / toan / 45` | `HeaderForm` giữ state từ đề trống trước khi đề thật tải xong. Người dùng thấy "lớp 6" trên đề không phải lớp 6, và sửa tên/lớp bị báo xung đột vì bản nền sai. Đây có thể là một phần của cảm giác "cứ quay về Toán 6" |
| Mở `/editor/new` là tạo đề trên server | Không thao tác gì, sau 4 giây số đề tăng 1 và URL đổi sang ID thật | Mỗi lần bấm "Tạo đề mới" để lại một đề Toán 6 rác trong kho. Trái AC-09 nếu không sửa đường autosave |

**Đã sửa so với bản 1.0:**

1. **Enter (AC-64):** bản 1.0 đổi thành Enter xuống dòng. Sai với hành vi đang có và thói quen chat. Chốt: máy tính Enter gửi, Shift+Enter xuống dòng; thiết bị cảm ứng Enter xuống dòng, gửi bằng nút; không gửi khi đang gõ IME.
2. **Bootstrap (AC-07, AC-09, AC-10):** bản 1.0 chưa nói trang soạn vẽ gì khi chưa có môn/lớp. `metadata.subject/grade` được dùng ở 22 tệp nên không làm kiểu rỗng lan khắp editor. Chốt theo AC-79: bootstrap chỉ là thẻ bắt đầu trên tờ giấy trắng, **không chứa câu**; đủ môn + lớp mới thành `Exam` và mở editor đầy đủ.
3. **Lưu hội thoại (AC-51, AC-52, AC-67):** không mở rộng envelope nháp đang chạy và không cần cờ tính năng. Dùng khóa `localStorage` riêng có `formatVersion`. Ít rủi ro hơn cho nháp đề. AC-52 chỉ còn áp cho bộ đọc đề xuất và khóa riêng đó.
4. **Hoàn tác (AC-32):** đang có hai hệ thống. Gỡ `CopilotHistoryControls` và `copilot-history`, chỉ còn nút Hoàn tác chung, đúng nguyên tắc một việc một chỗ.
5. **Nguồn chính thức (AC-40–42):** bảng `ExamTemplate` không có cột địa phương/năm/URL/trạng thái, mà AC-05 cấm migration. Đợt này **không có kho mẫu chính thức**. "Tạo đề vào 10 Hà Nội" được phép tạo đề, nhãn "Đề luyện tập, cấu trúc do AI đề xuất, chưa đối chiếu văn bản". Giáo viên có thể dán hoặc nhập văn bản làm căn cứ. Không chữ "chuẩn" hay "chính thức".
6. **Giảm phạm vi:** dự án là nhóm nhỏ. AC-43 rút còn 4 trạng thái; AC-45 bỏ cache; AC-48 không tự thử lại khi lỗi quota/dịch vụ, người dùng bấm "Thử lại" để không tốn lượt khóa miễn phí; AC-50 không bắt buộc đúng tên 16 trạng thái.

**Bổ sung:** AC-71–AC-80 ở mục 13a: hai lỗi trên, ai quyết định ý định, số lượt gọi mỗi câu, giới hạn dữ liệu 4,5 MB của Vercel, hết độ dài đầu ra, thời gian chạy của route, thẻ bắt đầu, quy tắc nhánh và deploy.

**Thứ tự làm và điều kiện dừng** thay cho G0–G5, xem mục 14. Mỗi đợt xong phải báo chủ dự án xem rồi mới sang đợt sau.

**Không làm đợt này:** AC-39 (phần chia lượt), AC-40–42 (kho nguồn), AC-45 (cache), AC-60 (tách nhật ký), AC-67 (cờ), đồng bộ hội thoại giữa các máy, tạo đề từ chat tổng ngoài trang soạn. Các ca kiểm tương ứng ghi "Chưa làm theo phạm vi 1.1", không tính là không đạt.

## 1. Kết quả người dùng cần thấy

Giáo viên có thể mở đề trống, gõ yêu cầu tự nhiên và nhận một bản đề xuất hoàn chỉnh. Trợ lý nhớ cuộc trò chuyện, nhận biết thông tin vừa sửa, tự điền phần đã rõ, chỉ hỏi phần thực sự cần thiết. Khi lỗi khóa hoặc mạng, yêu cầu đang làm được giữ và có cách tiếp tục.

Ví dụ mục tiêu: “Tạo đề thi vào 10 Hà Nội môn Toán” → nhận ra môn, kỳ thi, địa phương → bổ sung năm/nhánh thi nếu chưa rõ → chọn mẫu có nguồn phù hợp → tạo đề, đáp án và thông tin liên quan → giáo viên bấm **Nhận đề** một lần.

Những thay đổi chính được đề xuất:

| Hiện tại | Sau sửa |
|---|---|
| Tự đặt Toán 6 / 45 phút | Thông tin chưa chọn để trống về nghĩa; không truyền giá trị giả cho AI |
| Chat chỉ thêm/sửa từng câu | Cùng một chat có thể đổi thông tin, tạo cả đề, sửa đúng vùng chọn |
| Các lệnh rời nhau | Một yêu cầu liên tục, có lịch sử, lựa chọn và câu trả lời tự nhập |
| Hỏi lại hoặc hỏi lệch lớp | Chỉ hỏi thông tin còn thiếu, không hỏi lại điều đã biết |
| Đề trống vẫn có nút sửa câu | Gợi ý theo trạng thái đề, môn và phạm vi |
| Lỗi chung | Mã lỗi ổn định, thông báo ngắn, nút hành động đúng nguyên nhân |
| Có thể xóa lời nhắn đang gõ | Tách bản đã gửi và bản đang gõ; không mất phần nhập mới |

## 2. Phạm vi và nguyên tắc cố định

**AC-01 — Phạm vi:** bảng AI trong trang soạn V2, tạo đề trống, hội thoại liên quan, tạo/sửa đề xuất, kiểm khóa, lưu/khôi phục trạng thái và các đường API/validator cần cho chúng. Giữ giao diện trắng–xám–đen; xanh dùng trạng thái thành công, vàng cảnh báo, đỏ lỗi.

**AC-02 — Bảo toàn:** không đổi đề cũ chỉ vì mở trang; không suy rằng Toán 6 / 45 phút trong đề cũ là sai. Giữ mã câu, hình, ngữ liệu, điểm, đáp án, tài liệu đã giao và các sửa của người khác. Không xóa hoặc thay bí mật mã hóa. Không tự mua dịch vụ, thay model, gọi provider thật để kiểm tài liệu hay triển khai Vercel.

**AC-03 — Kiểm soát thay đổi:** AI tạo đề xuất; ứng dụng kiểm và giáo viên nhận một lần. Không tự ghi thay đổi model trả về vào đề đang dùng. Tóm tắt thông tin AI hiểu được trong thẻ yêu cầu có thể cập nhật ngay vì đó là **yêu cầu đang soạn**, không phải đề đã lưu. Không thêm hộp xin phép trước mỗi bước phân tích.

**AC-04 — Dùng chung nền hiện có:** tái sử dụng bộ kiểm câu, luồng sinh đề, dàn ý Phần → Nhóm → Câu, kho nháp, nhật ký đề xuất, quyền, version/CAS và lịch sử. Không tạo bộ sinh, kho nháp, hệ thống quyền hoặc hệ thống nhật ký song song. Phần cần mở rộng hợp đồng phải có phiên bản và adapter.

**AC-05 — Giới hạn phiên bản đầu:** chưa đồng bộ hội thoại/nháp chưa đủ thông tin giữa các máy; chưa có hàng đợi chạy nền bền trên server; chưa có tự tìm web không giới hạn; chưa tạo hệ thống vẽ/ảnh mới; chưa chứng nhận chuyên môn tự động. Các giới hạn phải hiển thị đúng chỗ, không quảng cáo như đã có. Không mở bảng DB/migration mới trong phạm vi này; nếu phát hiện bắt buộc thì ghi phương án tác động và xin quyết định trước khi làm phần phụ thuộc.

**AC-06 — Đủ môn:** thiết kế theo danh mục môn/lớp hiện có, không mã hóa riêng Toán hoặc Hà Nội. Khung mức nhận thức lấy theo ngữ cảnh áp dụng, không ép tất cả đề dùng ba hay bốn mức. “Toán vào 10 Hà Nội” là ca nghiệm thu, không phải logic duy nhất.

## 3. Đề mới và thông tin chưa xác định

**AC-07 — Bản khởi tạo:** phân biệt `bootstrap` (chưa đủ thông tin để thành Exam chuẩn) và `document` (đề hợp lệ, có thể lưu theo cơ chế hiện tại). Trang `/editor/new` mở bản khởi tạo theo AC-79; không cần tạo bản ghi Exam giả trước để chat.

| Thông tin | Khi chưa chọn | Khi được xác định |
|---|---|---|
| Tên đề | Nhãn giao diện “Đề chưa đặt tên” | Người dùng hoặc đề xuất đặt tên; luôn sửa được |
| Môn | `null`, nhãn “Chưa chọn môn” | Mã trong danh mục; không mặc định `toan` |
| Lớp kiến thức chính | `null`, “Chưa chọn lớp” | Số lớp hợp lệ; phạm vi rộng hơn nằm ở yêu cầu/phạm vi |
| Thời lượng | `null`, “Chưa đặt thời lượng” | Theo yêu cầu hoặc mẫu đã chọn; không ngầm 45 phút |
| Năm học | Chưa chốt; có thể có gợi ý theo lịch | Năm người dùng/mẫu xác định có ưu tiên; không bị ngày máy ghi đè |
| Loại bài/mục tiêu thi | Chưa xác định | Tách bài thường, giữa/cuối kỳ, khảo sát, luyện thi, HSG… |
| Trường/đơn vị/mã đề | Trống | Chỉ dùng người dùng/hồ sơ đã chọn; AI không bịa |
| Phần/ngữ liệu/câu | Bootstrap không chứa câu | Có từ khi thành `document`; dùng mô hình dàn ý hiện có; tên phần trống không in |

**AC-08 — Không lách validator:** không dùng lớp0, môn giả hoặc lớp 6 giấu trong nền để vượt kiểm tra. Lệnh chat của `bootstrap` được kiểm theo schema khởi tạo riêng, không gọi `normalizeExamDocument` trước khi AI có cơ hội xác định môn/lớp. Khi chuyển sang `document`, phải qua validator Exam thật. Loại bài chưa đặt thời lượng chỉ bị hỏi khi thao tác cần thời lượng; không ép thời lượng để nói chuyện hoặc sửa tên.

**AC-09 — Chuyển thành đề chuẩn:** người dùng chọn đủ dữ liệu thủ công hoặc nhận đề xuất hợp lệ → tạo Exam với ID nháp ổn định → lưu bằng luồng hiện có. Không tạo bản ghi server khi chỉ mở trang (AC-72) hoặc chỉ xem đề xuất. Chỉ đổi URL sang ID server sau xác nhận lưu. Nháp khởi tạo/hội thoại chỉ được đánh dấu đã chuyển sau xác nhận đúng bản, đúng tài khoản, đúng writer. Lưu thất bại vẫn giữ cả yêu cầu và đề xuất.

**AC-10 — Xuất/in và nháp:** trước khi đủ dữ liệu, không có nhãn “Đã lưu” lên server; dùng “Nháp trên máy này”. Vẫn cho tải bản dự phòng yêu cầu. Nếu người dùng cần xuất bản đề chưa đủ thông tin, chỉ xuất từ tài liệu hợp lệ hoặc giải thích đúng trường còn thiếu; không xuất lớp/môn bịa. Bootstrap không chứa câu nên không có câu thủ công nào bị mất khi hoàn tất thông tin.

**AC-11 — Tách mục tiêu và kiến thức:** “vào 10” là mục tiêu tuyển sinh, không gán thẳng `grade=10`. Dùng `targetExam` trong ngữ cảnh nghiệp vụ gồm mục tiêu, lớp đích nếu có, địa phương, năm thi, nhánh chuyên/không chuyên và nguồn. `grade` vẫn giữ nghĩa lớp kiến thức chính hiện tại của ứng dụng. Thi liên cấp/ôn nhiều lớp phải mang thêm phạm vi, không đổi ngữ nghĩa cột `grade`.

Đề xuất lưu thông tin mục tiêu cần đi theo đề trong phần JSON metadata hiện có sau kiểm định; đây là mở rộng hợp đồng, không tự có sẵn. Các DTO công khai phải cho phép đúng trường được hiển thị, không phát nguyên ngữ cảnh riêng tư.

**AC-12 — Nguồn gốc giá trị:** mỗi thông tin trong yêu cầu giữ `value`, trạng thái `unknown/proposed/resolved`, nguồn `user/manual/template/inferred` và dấu mốc thay đổi. Mặc định kỹ thuật không được thành nguồn `user`. Không cần đưa các nhãn kỹ thuật này lên giao diện; chỉ hiển thị “Bạn đã chọn”, “Theo mẫu…” hoặc “AI đề xuất” khi giúp quyết định.

Ưu tiên: quyết định mới rõ ràng của người dùng > ràng buộc người dùng đang giữ > mẫu/phạm vi được chọn > sở thích cá nhân > suy luận. Nếu yêu cầu tùy chỉnh trái mẫu chính thức, giữ quyền tùy chỉnh nhưng bỏ nhãn “đúng mẫu chính thức”, chỉ ra khác biệt. Nếu thay phạm vi có ảnh hưởng câu cũ, trình bày trong đề xuất, không tự xóa.

## 4. Trò chuyện liên tục và hỏi vừa đủ

**AC-13 — Một phiên theo đề:** dùng `conversationId`, tài khoản hiện tại, ID nháp/đề, writer và nhánh yêu cầu. Đổi đề/tài khoản không dùng nhầm phiên. Mở/đóng bảng hoặc chuyển tab chat/sinh câu không khởi tạo lại hội thoại.

**AC-14 — Dữ liệu cần giữ:** lệnh gốc, các tin liên quan, câu hỏi đang chờ, lựa chọn đã chọn, câu trả lời tự nhập, thông tin đã giải quyết, điều còn thiếu, mẫu/nguồn đã chọn, phạm vi thao tác, model dùng cho lượt và các ID đề xuất. Không chỉ giữ tin cuối hoặc một đoạn tóm tắt do model tự viết.

**AC-15 — Ô nhập:** chụp `submittedText` và revision ô nhập khi gửi. Có thể gõ tin tiếp trong lúc chờ; chỉ xóa nội dung nếu revision vẫn đúng bản đã gửi. Tin chưa gửi không nằm trong request trước. Một lượt thực thi tại một thời điểm cho phiên/writer; tin tiếp được giữ chứ không tự đưa vào hàng đợi gọi AI tốn lượt. Nút gửi khi đang bận giải thích “Đang xử lý yêu cầu trước”; vẫn có dừng.

**AC-16 — Lựa chọn có danh tính:** thẻ làm rõ mang `questionId`, những trường cần điền, trạng thái đã trả lời và các `optionId/value/label`. Cả nút chọn và ô “Tự nhập câu trả lời” gửi kèm câu hỏi/phiên/request đang trả lời. Nhãn hiển thị không phải định danh nghiệp vụ. Không gửi một mình “2026” rồi đoán lại mục tiêu.

**AC-17 — Quy tắc hỏi:**

1. Tách điều đã rõ, thiếu bắt buộc, tùy chọn và mâu thuẫn. Hỏi thiếu bắt buộc/mâu thuẫn có ảnh hưởng; không hỏi lại trường đã `resolved`.
2. Gộp tối đa ba trường liên quan vào một thẻ hỏi ngắn; không bắt người dùng trả cả bảng cấu hình. Các trường tùy chọn không chặn.
3. Nếu câu trả lời chưa rõ, hỏi lại đúng điểm chưa rõ tối đa một lần cho cùng trường ở cùng phiên bản yêu cầu; sau đó đưa cách chọn/nhập cụ thể. Không tự điền dữ liệu quan trọng chỉ để thoát vòng lặp.
4. Khi người dùng đã cung cấp đủ hoặc cho phép đề xuất những phần tùy chọn, thực hiện; không hỏi “có muốn bắt đầu không?” lần nữa.
5. “Để AI đề xuất” chỉ giải quyết trường có thể giả định và ghi rõ đề xuất. Không dùng để tuyên bố có nguồn chính thức hoặc cấp quyền tác động dữ liệu khác.
6. Thay mục tiêu/năm/mẫu làm một số trường cũ hết phù hợp thì giải thích và hỏi lại đúng trường phụ thuộc, không tính đó là hỏi lặp vô cớ.

**AC-18 — Bộ điều phối ý định:** phân biệt `help`, `create_exam`, `update_metadata`, `append_content`, `edit_selection`, `remove_selection`, `review`, `clarify_reply`. Một lệnh có nhiều ý định chỉ hợp nhất thành đề xuất nguyên tử khi cùng ngữ cảnh và đủ dữ liệu. Không làm phần dễ rồi báo đã hoàn tất yêu cầu tổng.

| Yêu cầu | Cách xử lý |
|---|---|
| “Tạo đề thi vào 10 Hà Nội môn Toán” | Nhận mục tiêu/môn/địa phương; hỏi năm/nhánh thi nếu chưa xác định |
| “Toán vào 10 Hà Nội 2026 không chuyên, theo mẫu đã chọn” | Nếu mẫu có đủ dữ liệu hợp lệ thì lập kế hoạch và sinh, không hỏi lại lớp/chủ đề |
| “Năm 2026” sau thẻ hỏi năm | Điền năm vào đúng yêu cầu; không khởi tạo đề Toán 6 |
| “Đổi tên thành Kiểm tra chương II” | Chỉ đề xuất đổi tên; không sinh câu, không đổi lớp/môn |
| “Chuyển sang Hóa 10” | Nếu đề trống: cập nhật đề xuất thông tin; nếu có câu/phạm vi: chỉ rõ giữ hay thay nội dung, không gán nhãn Hóa cho câu Toán |
| “Tăng khó hai câu này” với hai câu chọn | Sửa đúng hai ID; giữ câu ngoài vùng; không hỏi chọn lại câu |
| “Tăng khó” khi chưa có câu | Báo chưa có câu, gợi ý tạo đề/thêm câu; không gọi tác vụ sửa rỗng |
| “Bỏ qua” | Phân biệt bỏ câu hỏi tùy chọn với hủy yêu cầu; không tự xóa đề |
| Hỏi cách dùng ứng dụng | Ưu tiên kho hướng dẫn hiện có, không cần key nếu có câu trả lời cục bộ |

**AC-19 — Hội thoại dài:** giữ facts có cấu trúc và lệnh chưa hoàn tất; chỉ gửi đoạn chat cần thiết. Khi rút gọn lịch sử, không mất phủ định, điều loại trừ, câu trả lời đã giải quyết hoặc ý định ban đầu. Summary là dữ liệu tham khảo, không tăng quyền cho model. Khi vượt giới hạn ngữ cảnh, cho thu hẹp hoặc chia tác vụ, không cắt âm thầm phần cần sửa.

**AC-20 — Đổi ý/đổi tài liệu:** lệnh mới có thể sửa yêu cầu hiện tại, không nhất thiết mở phiên mới. Nút “Yêu cầu mới” mở nhánh mới và cất nhánh cũ; không xóa đề xuất chưa nhận. Đổi tài khoản đóng nội dung riêng khỏi UI, vẫn giữ dưới đúng chủ. Tin trả về muộn chỉ vào phiên gốc, không ghi vào phiên đang mở.

## 5. Ngữ cảnh và phạm vi AI thực sự nhìn thấy

**AC-21 — Ngữ cảnh chuẩn hóa:** metadata cần thiết; chế độ đánh giá; mục tiêu kỳ thi/năm/địa phương; mẫu/phạm vi/ma trận và phiên bản; dàn ý, phần/nhóm/ngữ liệu; câu trong đích và phụ thuộc; hình liên quan bằng cơ chế media được phép; facts/hỏi–đáp hiện hành; sở thích được chọn. Không nhét khóa, cookie, quyền quản trị hoặc dữ liệu người dùng khác vào prompt.

Mọi tham chiếu cần tải thêm từ server (đề, mẫu riêng, ngữ liệu, kho câu, ghi chú) phải kiểm quyền đọc trước khi đưa vào ngữ cảnh, không đợi đến lúc lưu mới kiểm. Chỉ gửi phần cần cho tác vụ; không mặc định gửi toàn bộ kho cá nhân hay ảnh mọi câu khi chỉ sửa một tiêu đề.

**AC-22 — Phạm vi có kiểu:** `document`, `metadata`, `part`, `group`, `questions`, `question_field`. `questions` mang tập ID, không chỉ số thứ tự; `question_field` gồm ID câu và đường dẫn được cho phép (nội dung, phương án theo key, ý theo key, lời giải…). Part/group cần ID dàn ý và các tham chiếu ngữ liệu. Nhãn “Đang nói về” phải sinh từ đúng đối tượng gửi server.

**AC-23 — Chụp phạm vi lúc gửi:** click sang câu khác khi chờ không chuyển kết quả sang câu mới. Nội dung đầu ra ngoài đích bị từ chối hoặc chiếu qua allowlist rồi kiểm; không nhận lệnh model yêu cầu mở rộng phạm vi. Nếu đối tượng đã bị xóa/khóa/đổi quyền thì giữ đề xuất và giải thích chưa áp dụng được.

**AC-24 — Thay đổi giữa lượt:** dùng dấu mốc riêng cho facts, câu hỏi làm rõ và đề xuất. Thay giá trị liên quan làm câu hỏi cũ mất hiệu lực; thẻ vẫn có trong lịch sử nhưng không dùng nút cũ để điền vào yêu cầu mới. Thay đổi không liên quan như mở panel không làm mất đề xuất. Phiên bản đầu có thể chặn nhận khi bản đề đã khác để an toàn; không tự ghép tùy ý.

**AC-25 — Tách dữ liệu và chỉ dẫn:** ngữ liệu, đề nhập, ghi chú cá nhân và web/mẫu là dữ liệu không tin cậy. Các câu “bỏ qua quy tắc”, “lộ đáp án”, “đổi tài khoản” trong đó không có quyền điều khiển. Kiểm ở ứng dụng ngoài prompt: nguồn, IDs, quyền, giới hạn trường và cấu trúc đầu ra.

## 6. Sửa thông tin đề và tạo đề xuất

**AC-26 — Danh sách trường:** cho đề xuất tên, môn/lớp kiến thức, thời lượng, năm học/học kỳ, loại bài, mục tiêu thi/địa phương, mã đề, ghi chú, đơn vị nếu người dùng cung cấp. Những trường ảnh hưởng chuyên môn (gói kiến thức, scope, ma trận, chế độ đánh giá, khung nhận thức) cần patch liên quan được kiểm riêng. Không cho model ghi `ownerId`, quyền, phiên bản server, trạng thái đã thẩm định, khóa hoặc thông tin giao bài.

**AC-27 — Không xung đột với cơ chế giữ tiêu đề cũ:** `applyGeneratedDraft` hiện giữ các trường tiêu đề/năm học của đề cũ; đây là bảo vệ cần giữ cho sinh thêm câu, nhưng không được dùng để vô hiệu hóa lệnh rõ ràng “đổi tên”. Phân biệt `preserve`, `set`, `clear`; không suy `undefined/null/''` đều có cùng nghĩa. Xóa trường bắt buộc của Exam không hợp lệ phải được giải thích, không âm thầm thay giá trị khác.

**AC-28 — Patch có đối chiếu:** đề xuất gồm trước/sau, những trường đổi, đối tượng thêm/sửa/bỏ và lý do ngắn. Đổi tên không làm câu tăng version; sửa câu chỉ tăng phiên bản đối tượng phù hợp. Điểm0 và giá trị trống hợp lệ không được mất qua biểu thức fallback. Câu thêm nhận môn/lớp từ **metadata sau patch đã kiểm**, không từ bản mặc định cũ.

**AC-29 — Thay môn/lớp/chế độ:** đánh giá phụ thuộc gói/phạm vi/ma trận/câu/đáp án. Không tự gán nhãn môn mới cho câu cũ để qua kiểm. Nếu giữ nội dung khác phạm vi chỉ như bản đang biên tập, phải có cảnh báo và không gắn “đúng mẫu”; nhận bản trọn đề phải hợp lệ với chế độ đã chọn. Chuyển khảo sát không vô tình phát hành đáp án/điểm cũ; bản trước giữ trong lịch sử.

**AC-30 — Nhận nguyên tử:** tạo một candidate hoàn chỉnh và kiểm hết trước khi đổi bản soạn. Thông tin + câu + phần/ngữ liệu + dàn ý được áp dụng cùng một bước, không cập nhật lớp trước rồi sinh lỗi để đề dở dang. Lưu server vẫn đi qua quyền và version hiện hành. Nhận vào bản soạn và lưu server là hai trạng thái rõ ràng; không hiện “đã lưu” chỉ vì parent nhận state.

**AC-31 — Không áp trùng:** mỗi proposal có ID ổn định, mỗi lần nhận có token. Chặn double-click, nhận lại sau timeout, reload hoặc nhận từ hai tab bằng đối chiếu bản nền và dấu xác nhận/phiên bản trên đường lưu. Nếu không biết lần lưu trước đã thành công, tải lại và đối chiếu, không tạo bản sao mù. Không hứa nhà cung cấp chỉ tính phí đúng một lần khi kết nối đứt ở thời điểm không xác định.

**AC-32 — Hoàn tác/cất:** ghi cùng lịch sử thao tác của editor V2, một bước cho mỗi proposal; không để undo Copilot chỉ quay lại câu nhưng giữ metadata mới. Hoàn tác không đảo ngược sửa mới của người khác. Gỡ `CopilotHistoryControls` và `copilot-history`: chỉ còn nút Hoàn tác chung của trang soạn. Cất/từ chối vẫn giữ bản đối chiếu theo cơ chế hiện tại; bản lỗi/bản cũ có thể tải, không tự mất khi đóng panel.

## 7. Sinh trọn đề, phần và đáp án

**AC-33 — Dùng chung dịch vụ:** chat và tab Sinh câu cùng dùng core sinh/kiểm, gọi bằng plan đã chuẩn hóa. Tách phần dùng chung khỏi route khi cần; không gọi vòng HTTP vào API của chính server hoặc tự truyền cookie/key qua nhiều tầng. Luồng thêm câu vẫn giữ điểm chèn và metadata gốc trừ khi yêu cầu đổi rõ ràng.

**AC-34 — Kế hoạch đủ:** môn/lớp, mục tiêu/phạm vi, hình thức/chế độ đánh giá, cấu trúc câu và số lượng, thời lượng khi cần, điểm nếu có, ngữ liệu/hình bắt buộc, mẫu/nguồn và các điều loại trừ. Người dùng không bắt buộc điền form dài: facts/mẫu/AI đề xuất lập plan; kiểm chương trình làm trước gọi sinh. Dữ liệu còn thiếu do mẫu không đủ không được model giả vờ đã có.

**AC-35 — Cấu trúc đầy đủ:** output cần bao gồm metadata đề xuất, parts/groups/passages/questions và liên kết hợp lệ. Bộ sinh hiện chỉ nhận danh sách câu; phải mở rộng validator/adapter, không giả định đã hỗ trợ cấu trúc đề phức tạp. Dùng ID tạm của model, ứng dụng cấp ID cuối và remap toàn bộ tham chiếu. Chỉ một thứ tự chuẩn; không xây danh sách câu và cây không khớp nhau.

Một “Bài” tự luận có nhiều ý không được tự coi mỗi ý là một bài mới. Mẫu quy định đơn vị đếm: câu độc lập, bài hoặc ý; map sang `Question.parts`/cấu trúc đã có. Bài văn/hình dùng chung cho nhiều câu tạo một passage/group; ngữ cảnh chỉ dùng trong một câu nằm trong câu. Phần không tên vẫn là phần hợp lệ.

**AC-36 — Nội dung/đáp án:** giữ bảy dạng câu đang hỗ trợ; lời giải, đáp án/biến thể, rubric theo chế độ. Có điểm thì kiểm tổng và phân bổ; không tự quy về10 khi người dùng chọn khác. Khảo sát không có đáp án đúng/điểm ẩn. Không tạo khung nhận thức ngoài nguồn đã chọn; AI tạo luôn `draft`, không gắn giáo viên đã kiểm.

**AC-37 — Hình và dữ liệu giàu định dạng:** bảo toàn ảnh có sẵn của câu/phương án/ngữ liệu khi sửa phần khác. Đề cần hình phải dùng định dạng figure/ảnh được hỗ trợ, có liên kết hợp lệ; không dùng dòng “xem hình” nhưng không có hình rồi báo xong. Nếu chưa sinh được hình cần thiết, trả đề xuất chưa hoàn chỉnh và chỉ rõ thiếu; không tự tải URL do model bịa, không thêm engine vẽ/ảnh mới trong đợt này. Công thức, bảng và ý con phải đi qua các bộ chuẩn hóa hiện có.

**AC-38 — Kết quả không đủ:** kiểm đúng số/loại/đơn vị đếm, đáp án, rubric, liên kết, ID và điều ràng buộc. Thừa/thiếu/sai schema không được gọi là đã tạo đủ đề. Một lượt sửa đầu ra tự động có giới hạn chỉ khi chưa có đề xuất hoàn chỉnh, trong ngân sách và dùng cùng plan; không mở vòng repair vô tận. Nếu vẫn sai, giữ dữ liệu nhận được như bản chưa hoàn chỉnh tải được, không áp dụng một phần ngầm.

**AC-39 — Dài và giới hạn:** tôn trọng giới hạn tài liệu hiện hành và số câu sinh được kiểm (hiện plan tối đa 100 câu gốc, Exam tối đa 1000). Nêu rõ khi vượt, không cắt bớt. Nếu chia lượt theo phần: mỗi lượt có ID, nội dung đã nhận được lưu trước lượt tiếp, không gọi lại phần đã đủ. Nhận đề chỉ khi tất cả phần của yêu cầu trọn đề đã kiểm. Đổi sang “chỉ nhận phần đã có” cần lựa chọn rõ của người dùng, không mặc định.

## 8. Mẫu, nguồn và chữ “chuẩn”

**AC-40 — Quyền khẳng định nguồn:** mỗi mẫu có tên/đơn vị, loại thi, môn/phạm vi lớp, địa phương, năm hoặc thời hạn áp dụng, URL/tệp tham chiếu, phiên bản và trạng thái đã kiểm/chờ kiểm. “Có nguồn chính thức” khác “đã đối chiếu cấu trúc đủ để sinh đề”. Mẫu giáo viên tự sửa là bản tùy chỉnh, không tự được nâng thành chuẩn chung.

**AC-41 — Cách chọn:** ưu tiên mẫu/phạm vi giáo viên đang chọn phù hợp yêu cầu; sau đó kho nguồn đã kiểm. Phiên bản đầu không bắt buộc có tìm web tự động: khi chưa có mẫu phù hợp, cho chọn/nhập tài liệu hoặc dùng mẫu gần nhất dưới nhãn luyện tập. Không âm thầm dùng năm cũ như năm mới. Nếu bổ sung tra cứu web sau, vẫn qua cùng bước xác minh, không cho nội dung web tự trở thành lệnh.

**AC-42 — Năm và chuyên:** không gán “mới nhất” theo lịch máy nếu chưa có nguồn. Chỉ hỏi năm/nhánh thi khi chưa xác định và có tác động. Nếu người dùng cho tự đề xuất, chỉ rõ phiên bản nguồn đang dùng trước khi nhận đề; không lặp lại câu hỏi đã trả lời. Một cấu trúc “5 bài” chỉ dùng khi có nguồn đúng phiên bản, không mã hóa cứng từ lời AI trong ảnh.

## 9. Khóa AI, model và thông báo lỗi

**AC-43 — Trạng thái khả dụng:** thay boolean duy nhất bằng 4 trạng thái: `loading` (đang tải danh sách), `unknown` (tải lỗi), `missing` (không có khóa đang bật), `present` (có khóa, chưa biết còn lượt). Lỗi của lần gọi gần nhất đi theo mã ở AC-46, không thành trạng thái riêng. Kết quả kiểm có thời gian/model, không là bảo đảm vĩnh viễn.

**AC-44 — Preflight:** chỉ kiểm tài khoản, quyền, dữ liệu yêu cầu và trạng thái khóa/model trước khi gửi. Chưa có khóa: giữ lệnh thành yêu cầu đang chờ và mở nút thêm khóa, không gọi provider. Chưa tải xong danh sách khóa: không báo “chưa có khóa”. Lỗi tải danh sách: giữ `unknown`, cho tải lại hoặc server kiểm khi gửi; không âm thầm tin cache của tài khoản trước. Tác vụ hướng dẫn cục bộ không bị chặn vì thiếu key.

**AC-45 — Kiểm khóa nhẹ:** khi thêm/đổi khóa, đổi model hoặc người dùng bấm kiểm tra, dùng đường kiểm metadata sẵn có. Đợt này không cache. Không gọi kiểm ngoài mỗi lần gõ hoặc mở panel. Bị lỗi tải danh mục không tự chứng minh sinh nội dung không thể chạy. Đọc danh mục đạt chỉ ghi “Đã đọc danh mục”, không báo còn quota hay gói trả phí.

**AC-46 — Phân loại có thứ tự:** lỗi ứng dụng (auth/quyền/bản nền/decrypt) xử lý trước; lỗi provider đọc status và chi tiết có cấu trúc, kể cả nested; reason xác nhận sai/hết hiệu lực/bị thu hồi được ưu tiên hơn thông báo chung. Chỉ dùng mẫu chuỗi khi thiếu reason. HTTP402/403 không tự có nghĩa khóa hết hạn; key leaked chỉ xử lý đặc thù khi provider thực sự báo. Không suy gói miễn phí/trả phí từ chuỗi key hoặc số khóa.

| Mã chuẩn đề xuất | Giao diện | Hành động | Tự thử lại? |
|---|---|---|---|
| `NO_API_KEY` / `KEY_DISABLED` | Chưa có khóa đang bật | Thêm/bật khóa | Không |
| `INVALID_KEY` / `EXPIRED_KEY` / `REVOKED_KEY` | Khóa không dùng được; lý do nếu đã xác nhận | Thay khóa | Không thử lại chính khóa hỏng |
| `PERMISSION_DENIED` | Khóa chưa được phép thực hiện yêu cầu | Kiểm tra quyền, khu vực, model | Không |
| `MODEL_UNAVAILABLE` | Model không khả dụng với khóa này | Chọn model khác | Không tự đổi model |
| `RATE_LIMITED` | Nhà cung cấp đang giới hạn lượt dùng | Chờ/thử lại, xem hạn mức | Theo giới hạn ở AC-48 |
| `BILLING_REQUIRED` | Có vấn đề thanh toán/credit được provider xác nhận | Mở hướng dẫn thanh toán | Không |
| `PROVIDER_UNAVAILABLE` | Dịch vụ AI tạm thời không đáp ứng | Thử lại | Có giới hạn |
| `NETWORK_ERROR` / `TIMEOUT` | Chưa nhận được phản hồi | Thử lại/giữ để làm sau | Không mù quáng nếu kết quả chưa rõ |
| `KEY_DECRYPTION_FAILED` | Chưa đọc được khóa đã lưu | Hướng dẫn xử lý cấu hình | Không yêu cầu ghi đè khóa cũ |
| `AI_BAD_OUTPUT` / `AI_INCOMPLETE` | Kết quả chưa đủ/đúng cấu trúc, chưa áp dụng | Thử lại/sửa yêu cầu/tải bản nhận được | Tối đa lượt repair cho phép |
| `UNSUPPORTED_ACTION` | Thao tác chưa được hỗ trợ | Chỉ ra cách đang hỗ trợ | Không |
| `ACCOUNT_CHANGED` / `UNAUTHORIZED` | Cần đúng tài khoản/đăng nhập lại | Đăng nhập đúng, giữ nháp riêng | Không |
| `FORBIDDEN` / `STALE_CONTEXT` | Quyền hoặc bản đề đã đổi | Tải lại/đối chiếu | Không tự ép áp dụng |
| `BAD_REQUEST` | Dữ liệu gửi chưa phù hợp | Nêu trường cần sửa | Không đổ cho khóa |

**AC-47 — Lỗi là thẻ thao tác:** một câu dễ hiểu, tối đa hai nút chính, giữ lệnh/facts/đề xuất. Chi tiết kỹ thuật và request ID nằm trong mục mở rộng; không hiện raw error chứa secret/payload. Lỗi gateway trả HTML, JSON hỏng hoặc status lạ có thông báo trung lập; không tự gợi ý thay key. “Thêm khóa” trong lỗi và trong avatar mở cùng một hộp quản lý.

**AC-48 — Retry và chi phí:** tổng mặc định tối đa 3 lần gọi provider cho một đơn vị sinh, gồm lần đầu, đổi khóa, retry và repair; không nhân ngân sách ở nhiều tầng. Đợt này không tự thử lại lỗi 429/503/mạng: giữ yêu cầu, hiện nút "Thử lại" và thời gian chờ nếu provider có trả. Tự động chỉ gồm đổi sang khóa khác khi khóa hỏng và một lần sửa đầu ra sai cấu trúc. Quota cùng project không tăng khi xoay khóa; tối đa 3 khóa đã lưu theo cơ chế hiện có, không thử hết vô hạn. Không retry client 4xx, billing, output đã hợp lệ hoặc lỗi ghi log sau thành công. Không áp hạn mức AI/ngày mới của ExamCraft.

**AC-49 — Tiếp tục sau sửa khóa:** trở lại đúng yêu cầu đang chờ, kiểm lại quyền/phiên bản và cho bấm “Tiếp tục yêu cầu này” một lần. Không tự phát sinh lượt tính phí chỉ vì đóng hộp khóa. Nếu đề đã đổi thì cập nhật ngữ cảnh và chỉ rõ; không dùng bản nền cũ.

## 10. Trạng thái thao tác, hủy và lưu giữ

**AC-50 — Trạng thái hiển thị:** UI phải phân biệt được: đang xử lý, chờ người dùng trả lời, có đề xuất, đã nhận vào bản soạn, đã lưu, lỗi thử lại được, đã dừng, kết quả chưa rõ. Không bắt buộc tên kỹ thuật cụ thể. Trạng thái được điều khiển bởi sự kiện ứng dụng; model không được tự báo “đã lưu”.

| Sự kiện | Kết quả bắt buộc |
|---|---|
| Gửi lệnh | Lưu bản lệnh trước khi gọi; giữ editor hoạt động |
| AI cần thông tin | Lưu câu hỏi/facts; không sửa Exam |
| AI trả đề xuất | Lưu đề xuất trước khi cho nhận; giữ input gõ mới |
| Bấm dừng | Abort nếu có thể; bỏ khả năng tự nhận kết quả muộn; giữ dữ liệu đã nhận |
| Chỉ đóng bảng | Không đồng nghĩa hủy; trạng thái vẫn thấy khi mở lại |
| Tải lại khi đang gọi | Khôi phục yêu cầu; báo chưa rõ kết quả, không tự gọi provider lại |
| Server từ chối lưu | Đề xuất và bản soạn còn; không ghi thành công giả |
| Kết quả muộn khác request | Cất dưới request gốc hoặc bỏ việc áp dụng, không thay màn hình hiện tại |

**AC-51 — Hợp đồng lưu:** hội thoại và bootstrap nằm ở khóa `localStorage` riêng theo tài khoản + đề, có `formatVersion`, **không đụng envelope nháp đề**; giữ tối đa khoảng 200 KB, không chứa ảnh; đổi sang khóa ID server chỉ sau khi lưu đã được xác nhận. Mở rộng nhật ký đề xuất hiện có cho proposal metadata/full-document (reader nhận cả version 1 và 2). Không dựng hệ thống phục hồi mới. Nội dung tạm chỉ ở bản ghi riêng theo tài khoản/nháp/writer; đề hợp lệ đã nhận vẫn lưu server như trước. Hội thoại riêng không chèn vào Exam metadata để rồi lọt sang học sinh/người cộng tác.

**AC-52 — Tương thích nháp:** đọc được nháp/đề xuất version cũ; phân biệt loại `bootstrap` với `document` trước gọi validator. Cập nhật đồng thời màn hình phục hồi, export/import bản dự phòng, chuyển ID nháp sang ID server và xử lý nhiều tab. Dữ liệu chưa đọc được phải giữ nguyên bytes và cho tải; không mặc nhiên tạo bản trắng ghi đè. Giữ ghi riêng writer trước đổi con trỏ chung, như cơ chế hiện hành.

**AC-53 — Lưu lỗi:** nếu storage đầy/bị chặn, hiện “Chưa giữ được trên máy”, giữ RAM và cho tải. Không cho thay thế/xóa một nội dung hiện có nếu chưa giữ được bản trước theo cơ chế bảo toàn. Các thao tác mới chưa phá dữ liệu có thể tiếp tục với cảnh báo đúng, không hứa khôi phục sau đóng tab. Đăng xuất không hiển thị nháp tài khoản cũ cho tài khoản mới; không tự xóa nháp chưa nhận.

**AC-54 — Giới hạn dữ liệu tạm:** lệnh giữ giới hạn hiện hành 12.000 ký tự; cấu hình giới hạn envelope/hội thoại/media riêng trước triển khai. Giữ giới hạn đọc proposal hiện có 4 MiB, không nhét Base64 vào transcript. Khi đầy, không âm thầm cắt; cho cất/tải các lượt cũ và mở yêu cầu mới, giữ facts hiện hành sau kiểm. Không xóa tự động proposal chưa nhận để tiết kiệm chỗ.

**AC-55 — Tính duy nhất và sự thật vận hành:** requestId/conversationRevision chống áp phản hồi sai; proposalId/apply token + CAS chống áp trùng. Không dùng Map trong bộ nhớ serverless để hứa “chỉ gọi một lần” qua nhiều instance. Server chưa có job bền nên sau rớt kết nối có thể không lấy lại được output chưa đến trình duyệt; UI phải nói đúng, không báo mất đề đã có hay tự gọi lại tốn lượt. Các request dài phải dưới deadline thực của môi trường triển khai, không chỉ giá trị `maxDuration` trong mã.

## 11. Hợp đồng giao tiếp đề xuất

Các tên dưới đây là hợp đồng thiết kế cần triển khai/kiểm, không phải API đã tồn tại. Ưu tiên nâng phiên bản có adapter tại endpoint Copilot hiện có; không tạo nhiều endpoint chat làm cùng việc.

**AC-56 — Request v2:**

| Trường | Nội dung và kiểm tra |
|---|---|
| `version`, `requestId`, `conversationId`, `conversationRevision` | Version cố định; ID giới hạn độ dài; chỉ xác định tương quan, không cấp quyền |
| `documentRef` | `{kind: bootstrap/document, localId, serverId?, serverVersion?}`; không dùng ID người khác |
| `baseStamp`, `contextRevision` | Dấu mốc bản nền thực gửi; so lại khi nhận và áp dụng |
| `intent`, `message` | Lệnh người dùng + ý định dự kiến; không cho frontend cấp quyền chỉ bằng intent |
| `replyTo`, `answer` | questionId + optionIds hoặc freeText; chỉ trả lời thẻ còn hiệu lực |
| `target` | Phạm vi theo AC-22, IDs có thật và thuộc tài liệu |
| `resolvedFacts`, `pendingFacts`, `recentTurns` | Nguồn/phiên bản/điều chưa rõ; đều là input cần kiểm |
| `documentSnapshot` hoặc `bootstrapContext` | Một loại phù hợp; không gửi tài liệu giả cho bootstrap |
| `sourceRefs`, `plan?` | Phiên bản nguồn/plan do server xác minh; không tin nhãn “official” từ browser/model |

Tài khoản lấy từ session; header tài khoản kỳ vọng chỉ chống tab cũ. Khóa lấy bằng cơ chế BYOK của chính tài khoản, không nằm trong facts/transcript. Nếu còn hỗ trợ khóa tạm thì giữ ở kênh bí mật riêng, không lưu vào đề/nháp chat.

**AC-57 — Response v2:** một nhánh rõ ràng `answer`, `clarification`, `proposal`, `error`; chung requestId, contextRevision, thông báo ngắn. `proposal` gồm proposalId, baseStamp, intent/target, patch được phép, candidate đủ kiểm, danh sách thay đổi, cảnh báo và sourceRefs. `clarification` có câu hỏi có ID, trường bắt buộc, lựa chọn/allowFreeText/allowSuggest. Không dùng mảng quickOptions rời làm toàn bộ giao thức.

`error` có `code`, `message`, `stage`, `retryable`, `retryAfterMs?`, `actions[]`, `requestId`; action là enum UI được phép, không cho model trả URL hoặc JavaScript để thực thi. HTTP status phản ánh lỗi transport/auth/validation/provider; `200` không kèm thất bại mơ hồ khi server đã biết lỗi. Adapter cần đọc kiểu response cũ trong giai đoạn chuyển tiếp, không làm hỏng màn hình quản lý key đang dùng `status/message`.

**AC-58 — Validate hai lớp:** yêu cầu/đầu ra model không quyết định quyền; kiểm schema, loại hành động, trường, ID, target, source và toàn candidate. Null ở trường tùy chọn được chuẩn hóa có chủ đích; null không được xóa trường bắt buộc hoặc nội dung ngoài phạm vi. Sai schema đầu ra trả `AI_BAD_OUTPUT`, action lạ trả `UNSUPPORTED_ACTION`; không thành lỗi500 chung. Một catalog tên hành động dùng chung prompt, validator, UI và test, tránh ba tên cho một thao tác.

**AC-59 — Áp dụng/lưu:** kiểm quyền đọc/sửa ngay trước nhận và server kiểm lại lúc lưu. Field patch chỉ allowlist; client không tự đặt phiên bản server. Giữ version và dấu xác nhận dùng hiện hành; nếu cần thêm receipt cho proposal thì lưu trong vùng riêng tư của JSON/revision có sẵn sau đánh giá khả năng chứa, không tự mở bảng mới. Không cho receipt giả từ model làm ứng dụng tưởng đã lưu.

**AC-60 — Nhật ký:** tách provider trả được, output hợp lệ, proposal tạo được, nhận local và lưu server. Dùng request/proposal correlation cùng prompt/model/source version và mã lỗi đã khử bí mật. Không báo app thành công chỉ vì provider HTTP 200. Chưa cần dashboard mới; bổ sung vào cơ chế log/báo cáo hiện có. Nếu nơi lưu hiện tại không đủ biểu diễn thì đề xuất thay đổi cụ thể, không tự tạo một bảng nhật ký mới.

## 12. Giao diện, điện thoại và khả năng truy cập

**AC-61 — Bảng AI thống nhất:** chat là lối vào tự nhiên; Sinh câu là cách cấu hình rõ hơn cùng chức năng; Hướng dẫn cục bộ giữ nguyên. Không thêm thanh/nút khóa hoặc trợ lý trùng nhau. Gợi ý lúc đề rỗng: “Tạo đề từ mô tả”, “Dùng mẫu”, “Nhập tài liệu”; khi có câu: gợi ý đúng môn/vùng chọn. Thu gọn gợi ý sau khi bắt đầu trò chuyện để nhường chỗ cho nội dung.

**AC-62 — Bố cục chat:** lịch sử cuộn được, thẻ “Đang soạn yêu cầu…” với nhãn thông tin đã rõ, thẻ hỏi làm rõ, đề xuất có tóm tắt và mở xem chi tiết, composer dưới cùng. Không render nguyên JSON hoặc mọi metadata trên mặt chính. Mỗi lần cập nhật thông tin, nhãn và preview đề xuất đồng bộ; preview đề thật chỉ đổi khi nhận đề xuất.

**AC-63 — Điện thoại:** kiểm 320/375/390px, xoay ngang và chiều cao giảm khi mở bàn phím; composer/nút gửi không bị che hoặc làm mất vùng cuộn. Dùng vùng hiển thị động và safe-area; không khóa cuộn toàn trang sai. Nút chạm chính tối thiểu 44×44 CSSpx hoặc vùng chạm tương đương. Không mở modal trong modal khiến mất nút đóng/thẻ trả lời.

**AC-64 — Bàn phím:** máy tính Enter gửi, Shift+Enter xuống dòng; thiết bị cảm ứng Enter xuống dòng, gửi bằng nút; nhãn gợi ý đúng theo thiết bị. Không gửi khi IME đang composition. Focus hợp lý khi chọn trả lời, lỗi hoặc mở/đóng hộp key; không focus trap riêng trong chat chặn tới tab/nút đóng của bảng cha. Escape đóng lớp trên cùng, không hủy tác vụ nếu chưa bấm dừng.

**AC-65 — Dễ hiểu:** thông báo trạng thái/lỗi có chữ, không chỉ màu; status/alert được đọc bởi công cụ hỗ trợ mà không đọc lặp cả transcript. Nội dung lỗi và câu trả lời có thể chọn/copy. Giữ cỡ chữ tiếng Việt hiện hành, không đưa cảnh báo pháp lý/danh mục luật dài vào luồng soạn; nguồn chi tiết nằm sau liên kết mở rộng.

## 13. Bảo toàn khi triển khai và tương thích

**AC-66 — Chuẩn bị:** xác nhận đúng worktree/nhánh và các sửa của người dùng; chụp trạng thái nguồn, bảo toàn bản chưa commit trước tích hợp. Không sửa repo nền chỉ vì nó cùng tên. Kiểm build/server đang chạy và cổng thật; thông báo rõ bản test nào chứa tính năng để tránh lặp nhầm3117/3122. Không tự khởi động lại bản người dùng đang xem khi chỉ viết tài liệu.

**AC-67 — Chuyển định dạng:** đợt này không cần cờ tính năng vì nháp đề không đổi định dạng. Reader đề xuất nhận cả version cũ và mới; dữ liệu không đọc được thì giữ nguyên bytes, không ghi đè.

**AC-68 — Ranh giới dữ liệu:** không tự nâng cấp đề cũ Toán 6 thành bootstrap; không sửa snapshot bài đã giao. Không lộ lịch sử chat, đề xuất, đáp án hoặc model output riêng qua public/student/shared DTO. Cộng tác chia sẻ nội dung đề theo quyền hiện có, không mặc nhiên chia sẻ hội thoại cá nhân.

**AC-69 — Kiểm thử an toàn:** test pure/mock trước; DB/HTTP/browser đầy đủ chỉ trên `examcraft_test_20261022` sau health `isolatedTest` và kiểm SQL đích. Fixture ID riêng, dọn riêng, không xóa đại trà. Không AI thật/khóa thật trong test tự động mặc định; kiểm provider thật là đợt riêng được chủ dự án cho phép. Một build tại một thời điểm, CPU 1 / heap 1024, không chạy lint/SAFE cùng build.

**AC-70 — Điều kiện phát hành:** kiểm tương thích nháp, quyền, không mất dữ liệu, luồng tạo/sửa thật, desktop/mobile và danh sách nghiệm thu. Đối chiếu build/deploy commit; lưu bằng chứng theo đợt. Không tuyên bố chất lượng chuyên môn hoặc điện thoại thật đạt từ mock/viewport. Chỉ triển khai lên nơi người dùng đang dùng khi có chỉ dẫn triển khai riêng; đặc tả này chưa phải chỉ dẫn đó.

## 13a. Bổ sung bản 1.1

**AC-71 — Form đúng đề (P0, làm đầu tiên):** bảng Thông tin đề luôn hiện đúng đề đang mở. Không khởi tạo form từ đề trống trong lúc tải: gắn `key` theo đề đã tải hoặc chỉ mount khi `ready`. Sửa tên/lớp trên đề vừa mở không được báo xung đột giả. Giữ nguyên nháp đang gõ khi chỉ chuyển đối tượng chọn.

**AC-72 — Không tạo đề khi chỉ mở (P0):** bỏ trạng thái `dirty` mặc định của `/editor/new` trong `useExamPersistence`. Không thao tác thì không có request lưu, không đổi URL, không có đề mới trong kho. Nháp cũ của `new` vẫn khôi phục như trước.

**AC-73 — Bỏ ép lớp/môn khi nhận câu:** `copilot-submission.ts` hiện gán `subject/grade` của đề lên câu thêm. Câu trong đề lấy môn/lớp theo metadata **sau** đề xuất; không để câu mang lớp khác với đề mà không có cảnh báo. Đề xuất đổi môn/lớp đi qua AC-29.

**AC-74 — Giới hạn 4,5 MB của Vercel:** chat hiện gửi cả `exam` gồm ảnh `data:` và đưa toàn bộ câu vào prompt. Đề có ảnh sẽ bị gateway chặn trả lỗi không phải JSON. Chốt: request giữ dưới 4 MB; bỏ dữ liệu ảnh khỏi snapshot, chỉ giữ ID và mô tả, trừ ảnh của đúng đối tượng được chọn khi vừa sức; vượt thì báo `PAYLOAD_TOO_LARGE` kèm cách thu hẹp, không gọi provider. Lệnh chỉ đổi thông tin đề thì không gửi nội dung câu. Áp dụng cả phản hồi: đề xuất lớn phải nằm trong giới hạn hoặc báo rõ.

**AC-75 — Đầu ra bị cắt và thời gian chạy:** đọc `finishReason`; `MAX_TOKENS` là `AI_INCOMPLETE`, không cố vá JSON cụt rồi báo đủ đề. Route chat dùng `responseSchema` như các route nhập đề. Route chat hiện `maxDuration = 60` không đủ cho tạo cả đề: nâng theo mức `generate-exam` (300), truyền `abortSignal`, và client có nút Dừng thật.

**AC-76 — Ai quyết định ý định:** làm bằng thuật toán, không tốn lượt, các ca: hỏi cách dùng (`searchHelp` của kho hướng dẫn, chỉ khi khớp chắc), trả lời thẻ hỏi (`replyTo`), sửa mà đề trống hoặc chưa chọn đối tượng. Còn lại một lượt gọi model trả về JSON có `intent`, `facts` và một trong `answer/clarification/proposal`. Không có bước riêng chỉ để phân loại. Không đưa `parseLookup` của chat tổng vào chat trang soạn.

**AC-77 — Số lượt gọi:** một lượt người dùng tối đa 1 lần gọi model; riêng tạo cả đề tối đa 2 (hiểu yêu cầu, rồi sinh), cộng tối đa 1 lần sửa đầu ra sai cấu trúc. Đổi khóa khi khóa hỏng nằm trong ngân sách AC-48. Test đếm số lần gọi provider giả.

**AC-78 — Một chỗ cho mỗi việc:** chat không có ô nhập thứ hai trên thẻ bắt đầu; ô "Tự nhập câu trả lời" ở thẻ hỏi có thể chính là ô soạn dưới cùng khi đang có thẻ chờ, với nhãn đổi theo. "Thêm khóa" luôn mở cùng một hộp. Thông tin đề sửa ở bảng Chi tiết; nhãn thông tin trong chat bấm vào thì trỏ tới đó, không có form thứ hai.

**AC-79 — Thẻ bắt đầu:** `/editor/new` vẫn dùng khung trang soạn, tờ giấy trắng có thẻ gồm: **Tạo bằng AI** (mở bảng AI, con trỏ ở ô chat), **Tự soạn / Dùng mẫu / Nhập tài liệu** (hỏi ngắn Môn + Lớp, xong tạo `Exam` và mở đúng bảng). Thanh công cụ soạn câu chưa hoạt động ở trạng thái này. Không hiện "Đã lưu" và không in giá trị giả. Chưa có khóa thì "Tạo bằng AI" nói rõ và có nút thêm khóa, các lối thủ công vẫn dùng được. `getTeacherAiProfilePrompt` và các hàm nhận môn phải chịu được môn chưa có ở lượt bootstrap. `Exam` chỉ được lưu lên server sau khi đã đủ môn + lớp.

**AC-80 — Nhánh và deploy:** đẩy `main` là Vercel tự deploy lên trang đang chạy. Làm trên nhánh `codex/chat-ai-v2` tạo từ `865bcea`, không đẩy `main`. Bản Preview có thể dùng chung DB thật nếu biến môi trường áp cho Preview: không tạo dữ liệu thử trên Preview. Đợt này không có migration; nếu phát hiện bắt buộc thì dừng và hỏi. Commit không thêm dòng `Co-Authored-By` hay "Generated with" theo yêu cầu chủ dự án. Chạy cả `npm run test:integration` vì GitHub CI có bước đó còn `npm run ci` trên máy thì không.

## 14. Thứ tự thực hiện (thay G0–G5)

Tên tệp là nơi cần kiểm/sửa, không phải lệnh ghi đè toàn bộ. Đọc guide Next cục bộ liên quan trước viết code. Mỗi đợt chạy test liên quan rồi dừng báo chủ dự án; chỉ đợt cuối chạy bộ đầy đủ.

| Đợt | Yêu cầu | Điểm nối chính | Xong khi |
|---|---|---|---|
| **Đ0: sửa lỗi có thể đưa lên ngay** | AC-71, AC-72, AC-15, AC-80; gợi ý theo đề trống trong AC-61 | `EditorSettings`, `HeaderSettingsModal`, `useExamPersistence`, `RightCompanionRail` | TC-077, 078, 019, 068 đạt. Vài giờ công; chủ dự án có thể cho đưa lên riêng |
| **Đ1: chat nhớ và lỗi dễ hiểu** | AC-13, 14, 16–25, 43, 44, 46–50, 55–58, 61, 62, 64, 65, 74–78 | `RightCompanionRail`, `EditorAiPanel`, `exam-copilot/route`, `copilot-result`, `ai-policy`, `gemini-keys`, `useAiProposal` | "Năm 2026" giữ được yêu cầu trước; sửa đúng nhiều câu chọn; lỗi khóa có nút đúng và tiếp tục được |
| **Đ2: sửa thông tin đề** | AC-26, 27, 28, 29, 30, 31, 32, 59, 73 | `copilot-submission`, `applyCopilotSubmission`, `undo-history`, `ai-proposal-journal`, gỡ `CopilotHistoryControls` | Chat đổi tên/lớp/thời lượng qua đề xuất; nhận một lần; hoàn tác một bước; không còn gán lại lớp 6 |
| **Đ3: đề trống và tạo cả đề** | AC-07–12, 33–38, 51, 53, 54, 79 | `useExamPersistence`, `ExamWorkspace`, `generation-plan`, `generate-exam/route`, `exam-outline` | TC-076 đạt bằng provider giả; không còn Toán 6/45 phút trên đề mới; nhãn "Đề luyện tập" đúng |
| **Đ4: nghiệm thu** | AC-68, 69, 70 và các ca P0 đã làm | Bộ test có sẵn và ca mới | CI đầy đủ + `test:integration` xanh; chủ dự án thử trên điện thoại và một lượt AI thật do chủ dự án cho phép |

Làm tuần tự, một tác nhân sửa. Không tiếp tục script vá lịch sử của nhánh cũ. Gói nào chưa có khả năng thật thì UI phải nói đúng, không giữ nút hứa quá mức.

Những điểm phải rà kỹ khi tích hợp: `applyGeneratedDraft` hiện giữ title/year cũ; sinh hiện chưa trả phần/ngữ liệu/hình đầy đủ; journal parser hiện chỉ nhận formatVersion 1; danh sách khôi phục hiện luôn chuẩn hóa Exam; `normalizeExamDocument` giữ nguyên mọi khóa metadata lạ nên `targetExam` cần bộ đọc riêng kiểu `parsePageSetup` và allowlist, không tin model. Không coi việc tái sử dụng tên hàm là đã đáp ứng đặc tả.

## 15. Quyết định thiết kế đề nghị chốt cùng đặc tả

1. Đề mới có trạng thái chưa xác định, thể hiện bằng thẻ bắt đầu (AC-79); chưa đủ môn + lớp thì giữ nháp trên máy, không cần bảng DB mới.
2. AI tự hiểu/điền yêu cầu và tạo bản đề xuất; cập nhật đề thực tế bằng một lần nhận, có hoàn tác, không sửa từng trường bằng nhiều hộp xác nhận.
3. Chat giữ lịch sử/facts theo tài khoản và đề; nút chọn và tự nhập đều là câu trả lời tiếp, không là lệnh rời.
4. Đợt này chưa có kho mẫu chính thức: đề tạo ra mang nhãn luyện tập; không khẳng định “chuẩn” bằng trí nhớ model.
5. Kiểm key tự động ở mức trạng thái/metadata và lỗi thực nhận; không sinh nội dung để thử ở mỗi lượt mở, không thêm hạn mức AI/ngày của ExamCraft.
6. Tận dụng các lớp lưu/nháp/quyền/sinh hiện có; không mở schema hoặc hệ thống mới ngoài phạm vi. Nếu vướng yêu cầu DB bắt buộc, báo quyết định cụ thể trước phần đó.
7. Nhận biết bản chưa hoàn chỉnh, lưu thất bại, kết quả chưa rõ và bản đã lưu là các trạng thái khác nhau; không báo thành công sớm.

Các quyết định trên là phương án đầy đủ để chủ dự án duyệt, không phải câu hỏi bắt buộc trả lời từng mục. Nếu chốt, triển khai theo Đ0–Đ4 và bảng nghiệm thu; nếu chỉnh một điểm thì cập nhật requirement và ca kiểm liên quan trước làm.

## 16. Nguồn và tình trạng tài liệu

- [Báo cáo kiểm tra cùng đợt](BAO_CAO.md): lỗi đã tái hiện, nguồn code và giới hạn kiểm.
- [Bảng nghiệm thu/truy vết](NGHIEM_THU_CHAT_AI_V2.md): ca phải có khi sửa, chưa ghi đạt trước khi chạy.
- Tài liệu provider đã đối chiếu trong đợt audit 03/11: [lỗi Gemini](https://ai.google.dev/gemini-api/docs/troubleshooting), [quota](https://ai.google.dev/gemini-api/docs/rate-limits), [khóa API](https://ai.google.dev/gemini-api/docs/api-key). Khi triển khai adapter, kiểm lại response thực của SDK đang cài; các mã nội bộ AC-46 là thiết kế ứng dụng, không khẳng định provider luôn trả đúng tên ấy.
- [Văn bản tuyển sinh Hà Nội 2026–2027](https://xdcs.cdnchinhphu.vn/446259493575335936/2026/3/25/tuyensinhlop10hanoi-1774411594569227064322.pdf): ví dụ phân biệt lớp đích và kiến thức, không dùng làm mặc định cho mọi năm/kỳ thi.

Không build, không chạy DB/provider, không sửa code chỉ để viết đặc tả này. Kết quả kiểm audit trước đó không phải kết quả nghiệm thu đặc tả mới. Bản duyệt cuối cùng cùng mã AC là căn cứ làm tiếp; hồ sơ tổng vẫn ở checklist 03/02 hiện có.
