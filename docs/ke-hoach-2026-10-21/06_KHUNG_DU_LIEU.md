# Khung dữ liệu, vòng đời và ví dụ trước triển khai

Ngày: 21/10/2026. **Hợp đồng khái niệm để cụ thể hóa trong CV-007**, không phải schema Prisma/API đã triển khai. [Mục lục](00_BAT_DAU_TU_DAY.md).

## 1. Mô hình dữ liệu chung

| Khái niệm | Dữ liệu tối thiểu | Liên kết và ràng buộc |
|---|---|---|
| Nguồn | ID, tác giả/đơn vị, URL/tệp, hash, phiên bản, ngày/phạm vi, quyền dùng, trạng thái | Một tài liệu có nhiều lần phát hành; lưu vị trí bằng chứng và điều chưa rõ |
| Gói chương trình | Môn/cấp/lớp, phiên bản, trạng thái, nguồn | Không gói nào mặc nhiên đại diện mọi lớp |
| Kiến thức/yêu cầu cần đạt | ID, mô tả, lớp/phạm vi, quan hệ tiên quyết, nguồn | Không đồng nhất cây kiến thức với mục lục sách |
| Mục lục sách | Bộ sách/ấn bản/tập, chương/bài/mục, thứ tự, nguồn | Liên kết nhiều-nhiều với kiến thức/yêu cầu có bằng chứng |
| Khung mức nhận thức | ID/version, mã mức, tên hiển thị, định nghĩa, thứ tự nếu có, nguồn | Biết/Hiểu/Vận dụng là một khung; khung khác không tự quy đổi |
| Phạm vi chọn | Include/exclude, giới hạn phương pháp/tiên quyết, sách/version nếu chọn | Thay đổi bởi UI/chat đều tạo cùng trạng thái scope |
| Mẫu đánh giá | Mục đích, khung mức, cấu trúc, điểm, ràng buộc, nguồn/phạm vi | Bản riêng có origin/version và ghi phần tùy chỉnh |
| Kế hoạch đề | Scope, slots/phân bổ, dạng câu, điểm, mức nhận thức, cách chấm | Mục tiêu được so với thực tế, có thể không điểm/mức trong bài phù hợp |
| Câu và phiên bản | ID/version, loại, nội dung, lựa chọn/ý có ID, ngữ liệu, tài sản, phạm vi, mức, nguồn | Sửa nội dung không đổi ID logic; tạo revision, cập nhật kiểm định |
| Đáp án/lời giải/rubric | Liên kết câu-version, đáp án chấp nhận, lời giải, tiêu chí/điểm, trạng thái | Có thể thiếu khi nháp; thiếu không đồng nghĩa rỗng là đúng |
| Kiểm định | Câu/đề-version hoặc hash, phương pháp, kết quả, đủ/chưa đủ, ai/khi nào, bằng chứng | Cấu trúc đạt khác nội dung đã duyệt; model đồng thuận không là xác minh độc lập |
| Đề và phiên bản | Metadata, sections, question-version refs, điểm thực tế, mẫu trình bày | Tên hiển thị không phải ID, nguồn chuẩn cho xem/xuất |
| Khối trình bày | ID, vai trò, nội dung/binding, thứ tự, vùng/căn chỉnh, hidden/override | Không dùng dòng/trang làm ID; null/chưa nhập khác cố ý ẩn |
| Ngữ liệu/tài sản | ID/version, loại, nội dung/tệp, hash, nguồn, khả năng render | Nhiều câu cùng dùng; giữ nhóm khi trộn; asset có quyền riêng phù hợp |
| Thành viên/link | Đối tượng/version, người/phạm vi truy cập, quyền, hết hạn/thu hồi | Public view không suy edit/download/fork/answers; không chứa key |
| Bài giao | Chủ sở hữu, snapshot, opens/closes/duration, nhận diện, reveal, số lượt | Snapshot bất biến; thời gian server có nguồn chính |
| Lượt làm | Bài giao/student, session quyền, số lượt, deadline, draft-version, trạng thái | Quyền ghi không dựa vào ID công khai; uniqueness/concurrency rõ |
| Kết quả | Response theo ID, điểm từng phần, pending/manual/final, regrade-version | Giữ bài làm gốc khi đính chính; audit thay đổi điểm |
| Phân tích/memory | Nguồn-version, nội dung có cấu trúc, bản đọc, bằng chứng, phạm vi, quyền, reviewer | Riêng tư mặc định; đóng góp tạo bản duyệt riêng |
| Kết nối AI | Owner, provider, key mã hóa/phần che, trạng thái, cấu hình | Không suy billing từ key; usage theo ID; không xuất bí mật trong gói tài liệu |
| Tác vụ AI | Người yêu cầu, kết nối, input refs/version, model/prompt version, usage, trạng thái | Retry/hủy hữu hạn, kết quả muộn cần so version trước apply |

Không bắt mỗi khái niệm thành một bảng. Tận dụng model hiện tại khi phù hợp; quan hệ và tính bất biến quyết định thiết kế. Dùng kiểu câu có payload riêng và validator rõ, không nhét mọi thứ vào một chuỗi HTML/Markdown rồi mất khả năng chấm/trộn.

## 2. Vòng đời đề và câu

Nháp có thể chưa đủ đáp án/nguồn; cho phép lưu. “Đủ cấu trúc”, “AI đã kiểm”, “Giáo viên đã duyệt” là trạng thái khác nhau, có version và phạm vi. Chốt đề cần kiểm các điều kiện cho hành động dự định: xuất phiếu không điểm khác giao bài chấm tự động.

Đề đang soạn → phiên bản chốt → bản công bố/link hoặc snapshot bài giao. Bản đang soạn tiếp tục đổi nhưng không thay snapshot. Đính chính bài đã giao tạo sự kiện/revision riêng, chỉ rõ học sinh/lượt ảnh hưởng và cách chấm lại.

Nhân bản câu/đề tạo chủ sở hữu mới và origin; không trỏ vào một bản sống có thể thay đổi dưới chân người dùng. Không xóa cascade dữ liệu lịch sử chỉ để giải quyết lỗi khóa ngoại.

## 3. Quy tắc API cần giữ khi chi tiết hóa

- Validate kiểu dữ liệu và quyền ở server; mỗi tham chiếu liên kết phải hợp lệ trong quyền người gọi.
- Dùng schema/version rõ tại biên nhập/DB/UI; adapter chịu trách nhiệm chuẩn hóa, không rải `toLowerCase` và fallback khắp component.
- Lưu có baseVersion hoặc điều kiện tương đương; server trả revision/updatedAt để UI biết bản nào được lưu. Conflict có phản hồi riêng dễ hiểu.
- Tạo/import/giao/nộp cần chiến lược chống thao tác trùng và transaction phù hợp. Không chỉ kiểm rồi ghi rời nhau khi có request đồng thời.
- Phản hồi người làm theo danh sách trường cho phép; đáp án/lời giải/nguồn riêng không lọt qua field mới hoặc nested payload.
- Empty, null, 0 và false phân biệt. Điểm dùng đơn vị/decimal chính xác với quy tắc làm tròn rõ; không toán tử `||` thay số 0 hợp lệ.
- Asset tham chiếu có quyền/hash; thay file không âm thầm đổi bản chốt. Nguồn không còn truy cập vẫn giữ thông tin bằng chứng được phép lưu.
- Lỗi cho người dùng có hành động tiếp theo; log nội bộ có correlation ID nhưng không secret/tài liệu riêng không cần thiết.

## 4. Ma trận quyền khởi đầu

| Thao tác | Chủ đề | Người sửa | Người góp ý | Người xem/khách | Học sinh |
|---|---|---|---|---|---|
| Đọc bản được cấp | Có | Có | Có | Theo link | Chỉ bài được giao |
| Sửa nội dung nháp | Có | Có | Không | Không | Không |
| Góp ý | Có | Có | Có | Không mặc định | Theo chức năng bài giao nếu có |
| Chốt/phát hành/cấp quyền | Có | Chỉ khi cấp riêng | Không | Không | Không |
| Tải/nhân bản | Có | Theo quyền | Theo quyền | Theo link/quyền | Theo bài giao, không mặc định |
| Dùng AI | Key của mình | Key của mình | Chỉ khi chức năng/quyền cho phép, key của mình | Không mặc định | Không thuộc luồng AI giáo viên |
| Đọc đáp án | Có | Theo quyền biên soạn | Theo quyền | Theo chính sách link | Theo chính sách trả kết quả |
| Đóng góp kho AI chung | Với dữ liệu có quyền | Không suy từ edit | Không | Không | Không |

Admin vận hành không tự trở thành chủ mọi đề. Mẫu/quyền duyệt kho chung có vai trò riêng. Người sửa có thể suy ra đáp án khi được biên soạn toàn câu, nên không hứa giữ bí mật đáp án với người có đầy đủ quyền sửa câu đó; cần xác định phạm vi tài liệu được mời.

## 5. Ví dụ xuyên suốt có số liệu kiểm được

Ví dụ **tự đặt để kiểm kỹ thuật**, không phải ma trận chính thức: phiếu luyện tập Toán lớp 6, cộng/trừ phân số, loại bài toán thực tế; chưa gắn bộ sách nếu mapping chưa được xác minh.

| Thành phần | Giá trị minh họa |
|---|---|
| Scope | Hai kỹ năng cộng/trừ phân số; loại bài toán thực tế; kiến thức/phương pháp theo lựa chọn giáo viên |
| Khung nhận thức | `demo-bhv-v1`: Biết, Hiểu, Vận dụng; đây là nhãn minh họa chưa được duyệt |
| Phân bổ | 4 lựa chọn × 0,5 = 2; 2 ngắn × 1 = 2; 2 tự luận × 3 = 6; tổng 10 điểm |
| Mức theo điểm | 4 lựa chọn ở Biết = 2; 2 ngắn + 1 tự luận ở Hiểu = 5; 1 tự luận ở Vận dụng = 3 |
| Câu mẫu | ID `demo-q-01`, revision 1: tính 1/2 + 1/3; đáp án 5/6, lời giải quy đồng |
| Sửa | Revision 2 đổi 1/3 thành 1/4; đáp án đề xuất 3/4; kiểm định revision 1 không áp revision 2 |
| Tên phần | Hiển thị “A. Khởi động” nhưng type câu không đổi; tên không làm ID |
| Cộng tác | A chủ đề, B edit; B sửa lời giải, A sửa tiêu đề; AI trả kết quả revision cũ cần so trước apply |
| Chốt/giao | Chốt đề V2; Assignment lưu snapshot V2; sửa đề V3 không đổi bài đã giao |
| Phân tích | Ghi “đề mẫu này có 20/50/30% điểm”; không suy thành quy tắc tất cả đề lớp 6 |

Thêm ba ví dụ đối trọng khi tạo fixture: ngữ liệu Ngoại ngữ có ghép/điền và nhiều câu cùng đoạn; bài tự luận Văn có nhiều hướng trả lời/rubric; phiếu khảo sát ý kiến không có đáp án đúng hoặc điểm. Chúng kiểm việc lõi không bị đóng khung bởi Toán.

## 6. Khuôn hồ sơ gói nội dung

Mỗi gói có: ID, môn/hoạt động, lớp/cấp, chương trình/version, sách/version nếu có, danh sách nguồn, cây/mapping, mẫu loại bài, framework mức, các dạng câu, quy tắc điểm, fixture, validator hỗ trợ, hạn chế, reviewer và ngày duyệt.

Trạng thái theo từng thành phần: nguồn thu thập / mapping đề xuất / đã duyệt mapping / kỹ thuật đạt / chuyên môn đạt. Không một nhãn xanh duy nhất che các phần chưa có. Mỗi cập nhật nguồn tạo phiên bản mới và danh sách phần phụ thuộc cần xem lại.

## 7. Khuôn nguồn và bản phân tích

Hồ sơ nguồn gồm: ID, tác giả/đơn vị, nơi đăng, số hiệu nếu có, ngày ban hành/hiệu lực riêng, môn/lớp/địa phương, URL/tệp/hash, vị trí trang/đoạn, quyền dùng, ngày kiểm tra, trạng thái và điểm chưa chắc.

Bản phân tích gồm: sourceVersion, question/examVersion nếu liên quan, kết luận, bằng chứng từng kết luận, mức chắc chắn/điểm chưa kiểm, người/model tạo, thời điểm, reviewer, quyền và trạng thái. Sở thích giáo viên lưu riêng, có thể tắt/xóa. Chỉ mục tìm kiếm có thể dựng lại từ dữ liệu gốc; không dùng embeddings hoặc chat làm bản lưu duy nhất.

## 8. Ranh giới của tài liệu này

Chưa tạo schema DB mới, endpoint mới, seed chương trình, nội dung sách hay fixture chạy. Đây là hợp đồng để biến thành thiết kế kỹ thuật sau baseline, tránh sửa code trước rồi mới phát hiện hai module hiểu khác nhau. Tên ID minh họa không được phát hành như mã chương trình chính thức.


## 9. Bổ sung từ nguồn thực tế22/10/2026

- Tách tài liệu logic (văn bản/phụ lục) với tệp và địa chỉ lưu. Một tệp chứa nhiều phụ lục; một tài liệu có nhiều bản lưu. URL giống không có nghĩa mọi phụ lục là cùng nội dung.
- Quan hệ bản gốc/sửa đổi/hợp nhất ghi phạm vi sửa và nguồn chứng cứ. Gói nội dung chỉ dùng chuỗi phiên bản đã xác định; tài liệu gốc không tự bị xóa khi có bản mới.
- Bổ sung năm học, sách/ấn bản, địa bàn và mốc địa giới khi áp dụng; chương trình NN1/NN2, ngôn ngữ, cấp/trình độ. Không chỉ khóa bằng môn+lớp.
- Nhãn mức nhận thức, độ khó và trình độ ngôn ngữ là ba khái niệm riêng. Không suy A1/A2/B là mức nhận thức.
- Trạng thái truy cập, bản lưu cục bộ, đã đọc nội dung, đã kiểm phiên bản và được duyệt sử dụng độc lập. Kèm ngày và người/công cụ ghi nhận; thông tin kế thừa từ AI có provenance riêng.
- Ví dụ kiểm mô hình: TK0045/0046 hai phụ lục chungPDF; SRC004/TK0001 cùng văn bản khác nơi lưu; TT32 với TT13/2022 và TT17/2025 là chuỗi sửa đổi; Khmer có trình độ. Những ví dụ này không tự tạo schema hay seed mới.
# Bổ sung hợp đồng từ nghiên cứu22/10/2026

- Ngày ban hành, ngày bắt đầu/kết thúc hiệu lực, năm học, ngày kiểm tra và trạng thái duyệt là các trường khác nhau. TT89 là ví dụ nguồn đã ký nhưng hiệu lực tương lai; dự thảo có vòng đời riêng.
- Mỗi học liệu có vai trò SGK/SGV/bài tập/tập huấn/âm thanh/cập nhật; chỉ có bài mẫu không được gắn là toàn văn. `canAccess`, `readScope`, `reviewStatus`, `usageRights` không suy ra lẫn nhau.
- Gói ngôn ngữ mở rộng được: tám tiếng trong TT34 không là enum đóng; thêm Raglai theo nguồn; NN2 có cấp/trình độ/quyển, không bắt buộc grade1–12.
- Đầu sách theo nhánh Công nghệ/Tin học/GDTC và chuyên đề không bị gộp chỉ vì cùng môn/lớp. Mục lục sách khác cây yêu cầu cần đạt, có liên kết nhiều–nhiều.
- Thay nguồn tạo danh sách phân tích/mẫu/mapping cần xem lại; không sửa tự động snapshot đã giao. Danh mục research chưa được seed vào DB như dữ liệu đã duyệt.

Ánh xạ model hiện có, hợp đồng hành vi và trình tự migration xem [hồ sơ08](08_HO_SO_TRUOC_KHI_CODE.md). Phần dưới là hợp đồng khái niệm nền vẫn áp dụng.

