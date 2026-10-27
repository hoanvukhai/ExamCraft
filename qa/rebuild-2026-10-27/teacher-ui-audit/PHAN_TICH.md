# Phân tích lại giao diện và luồng sử dụng của giáo viên

Ngày 27/10/2026. Phạm vi yêu cầu: đọc và phân tích, **chưa sửa mã**. Nền mã có đợt sửa font `381a437`; đọc working tree hiện tại và giữ các thay đổi có sẵn.

## 1. Nhận định chính

Vấn đề người dùng nêu có căn cứ. Giao diện đã thống nhất một phần màu/font, nhưng cấu trúc trang, ngữ nghĩa nút bấm, nguồn dữ liệu hiển thị và vòng đời thao tác chưa được hợp nhất. Có ba tầng cần xử lý khác nhau:

1. **Lỗi hành vi/dữ liệu trên giao diện:** hình xóa thực hiện khôi phục, câu hỏi dùng chung khác định dạng kho riêng, thiếu phân trang dùng chung, lỗi tải bị hiểu thành không có dữ liệu.
2. **Lỗi tổ chức sản phẩm:** khu quản lý, bàn soạn và popup chọn nội dung dùng lẫn nhau; đi sang khảo thí như sang một ứng dụng khác; quá nhiều tên gọi cho một điểm đến.
3. **Lỗi trình bày:** khoảng cách, cỡ chữ, thanh trên, nút, bộ lọc, bảng/thẻ, xác nhận và thông báo vẫn được dựng riêng tại từng nơi.

Chỉ đổi màu hoặc thay thêm CSS sẽ không giải quyết được hai tầng đầu. Cần thống nhất hành vi và khung trang, rồi mới chỉnh chi tiết trình bày. Không cần viết lại toàn dự án hay thay DB chỉ để làm các việc này.

## 2. Thùng rác — xác nhận trực tiếp từ mã

Nguồn chính: `src/components/TeacherDashboard.tsx`, `src/app/api/exams/[id]/route.ts`, `src/lib/exam-persistence.ts`.

| Hiện trạng | Hệ quả | Hướng sửa đề xuất |
|---|---|---|
| `handleDeleteExam`, dòng322–327: khi `currentView === 'trash'`, gửi PATCH `restore:true` | Bấm hình thùng rác lại khôi phục. Đây là nhánh được lập trình sẵn, chưa có căn cứ nói DB tự khôi phục vô cớ | Tách rõ thao tác khôi phục khỏi chuyển vào thùng rác; dùng nút có chữ và biểu tượng đúng |
| Cả thẻ và bảng đều giữ `Trash2`, màu hover đỏ; chỉ đổi `title` thành Khôi phục đề, khoảng dòng1055/1139 | Trên điện thoại không có hover; người dùng nhìn thấy biểu tượng xóa và hiểu ngược hành động | Hiện nút **Khôi phục** trực tiếp, không dựa vào tooltip |
| Banner soạn đề/sinh AI/nhập file và `LocalDraftsPanel` ở ngoài điều kiện loại màn hình, khoảng dòng785–846 | Thùng rác vẫn trông như trang soạn/kho đề bình thường | Nội dung thùng rác riêng: mô tả, tìm/lọc, danh sách đã xóa, thời điểm xóa, hành động hợp lệ |
| Thẻ/hàng vẫn mở `/editor/:id`, vẫn có tải Word, nhân bản, đánh sao, đổi tên/chuyển thư mục | API đọc đề chỉ nhận `deletedAt:null`; tải/nhân bản/mở đề xóa có đường đi thất bại, còn sửa metadata bị chặn ở server | Trong thùng rác ẩn các hành động đó; nếu cần xem trước thì có chế độ chỉ đọc riêng, không mở bàn soạn bình thường |
| Có `confirm` khi chuyển vào thùng rác và có toast thành công; không phải hoàn toàn chưa có thông báo | Lời báo thiếu/không rõ cần phân biệt với việc chưa có code thông báo | Chuẩn hóa xác nhận → đang xử lý → thành công/thất bại; giữ đúng hàng bị tác động |
| Nhánh khôi phục nằm trước `try/catch`, không có trạng thái đang gửi | Mất mạng có thể không được báo rõ; có thể bấm lặp khi thao tác chưa xong | Bắt lỗi, khóa nút đúng đối tượng khi gửi, xử lý xung đột phiên bản và cho thử lại |
| Toast chung luôn có dấu tích xanh, kể cả thông báo lỗi; tự mất sau3.5 giây, không có vai trò thông báo trợ năng | Lỗi có thể nhìn như thành công hoặc bị bỏ lỡ | Phân biệt lỗi/thành công; lỗi thao tác quan trọng giữ lại ở ngữ cảnh thao tác, có nút thử lại |
| API DELETE hiện chỉ chuyển vào thùng rác; không có đường xóa vĩnh viễn được kiểm trong phạm vi này | Không thể coi biểu tượng xóa hiện tại là xóa vĩnh viễn | Trước mắt làm đúng chuyển/xóa mềm và khôi phục. Nếu bổ sung xóa vĩnh viễn: nút riêng, xác nhận riêng, kiểm liên kết bài giao/câu hỏi/ảnh và quy tắc bảo toàn trước |

Đề xuất màn hình: tiêu đề **Thùng rác**; câu giải thích ngắn; mỗi đề có tên/môn/lớp/ngày xóa, nút Khôi phục. Không đặt nút tạo đề làm nội dung chính tại đây. Điều hướng toàn ứng dụng có thể vẫn giữ để đi nơi khác.

Chưa tái hiện trên trình duyệt việc xóa/khôi phục trong đợt đọc này, không kết luận có mất dữ liệu hoặc tự khôi phục do server. Bằng chứng hiện có đủ xác nhận nhầm hành động trên UI.

## 3. Ngân hàng câu hỏi — cần trang quản lý và bộ chọn riêng

**Khuyến nghị:** có trang quản lý ngân hàng riêng. Khi giáo viên đang soạn đề, vẫn dùng popup/drawer gọn để tìm và chèn câu. Hai màn dùng chung dữ liệu và quy tắc, nhưng khác nhiệm vụ; không bê nguyên trang quản lý vào popup.

Hiện Dashboard mở `QuestionBankModal` với `allowInsert=false` và `onInsertQuestion` rỗng, khoảng dòng1434. Tuy vậy từng câu vẫn có nút vô hiệu **Mở đề để chèn**. Đây là dấu vết tái sử dụng cả màn hình thay vì chỉ phần danh sách/chọn câu. Trong màn quản lý nên có các thao tác quản lý; trong bàn soạn mới ưu tiên **Thêm vào đề**.

Các lỗi quan trọng ngoài hình thức:

| Phát hiện | Bằng chứng và ảnh hưởng | Đề xuất |
|---|---|---|
| Kho dùng chung chưa chuẩn hóa câu hỏi | Modal dòng71 nhận nguyên `data.questions`; API trả record Prisma, enum `MULTIPLE_CHOICE`, `THONG_HIEU`, phương án/đáp án trong `payload`. UI lại so với `multiple_choice`, `thong_hieu`, đọc `q.choices`/`q.correct_answer`. Kho riêng đã đi qua `normalizeQuestion` ở `question-client.ts` | Dùng chung bộ chuyển dữ liệu ở biên API/client, giữ ID quyền nguồn, ngữ liệu, hình và đáp án. Kiểm tất cả dạng câu trước thay bố cục |
| Nguy cơ chèn bản ghi chưa chuẩn hóa vào đề | `ExamWorkspace.tsx` dòng674 trở đi nhận câu được chọn rồi trải trực tiếp vào câu mới, không chuẩn hóa tại callback này | Kiểm đường chèn câu dùng chung: preview, chèn, lưu, mở lại, Word. Chưa có bằng chứng runtime để khẳng định mất câu/đáp án trong đợt này |
| Kho dùng chung chỉ lấy trang đầu | Modal gọi `/api/questions/shared` không truyền trang/lọc; API mặc định20 câu và trả `pagination`, UI bỏ phần này, lọc mảng đã nhận | Phân trang và tìm/lọc trên server; số tổng phản ánh kết quả truy vấn. Không hiển thị Không có câu nếu chỉ chưa tải trang có câu |
| Hai kho nạp dữ liệu không tương xứng | Kho riêng `listBankQuestions` lặp qua các trang để tải toàn bộ; kho dùng chung chỉ một trang | Một hợp đồng phân trang/lọc chung cho trang quản lý và bộ chọn; không coi thiếu dữ liệu là lỗi CSS |
| Bộ lọc dạng câu mới có bốn lựa chọn | Dropdown modal khoảng dòng395 chỉ có trắc nghiệm, đúng/sai, trả lời ngắn, tự luận; hệ thống hỗ trợ thêm điền khuyết, ghép đôi, sắp xếp | Dùng danh mục bảy dạng câu; render nhãn theo danh mục. Ternary hiện tại còn gán các dạng khác thành Tự luận |
| Bộ lọc độ khó giữ bốn mức cố định | Modal vẫn dùng trường difficulty cũ | Không xóa nhãn cũ hoặc ép thành nhận thức mới. Tách rõ độ khó/nhận thức theo ngữ cảnh và nguồn phù hợp, hiển thị đơn giản cho giáo viên |
| Lỗi tải/xóa chưa có thông báo tốt | `readBankQuestions`, `readSharedQuestions`, `handleDelete` có nhánh chỉ console; có thể từ đang tải sang danh sách trống | Có trạng thái tải/lỗi/trống riêng, giữ bộ lọc, thử lại; báo xóa thành công/thất bại |
| Nội dung mẫu lẫn vào sản phẩm | Có nút **Nạp 4 câu mẫu chuẩn** và tên **Ngân hàng Câu hỏi Nguyên tử (Atomic Question Bank)** | Dùng từ **Ngân hàng câu hỏi**; dữ liệu minh họa đặt riêng và nói rõ chưa thẩm định. Hàm lưu hiện ép trạng thái draft, nên không quy kết câu mẫu đã được server xác nhận chuẩn chỉ từ chữ verified ở mảng mẫu |

Lưu ý khi đọc mã cũ: comment nói nạp từ IndexedDB nhưng hàm `dbGetAllQuestionsFromBank` hiện gọi helper server. Không nên kết luận cần di chuyển DB lần nữa dựa trên comment này.

## 4. Khảo thí, lớp học và bảng điểm

Nguồn: `src/app/teacher/groups/page.tsx`, `src/app/teacher/assignments/page.tsx`, `src/app/teacher/assignments/[id]/page.tsx`, `StudentResultsModal.tsx`, `ShareModal.tsx`, `LeftNavigationRail.tsx`.

- **Chưa có khung teacher dùng chung:** thư mục teacher không có layout riêng; các trang tự dựng nền, max-width, header, breadcrumb, khoảng cách. Dashboard có app bar và sidebar, sang lớp/bài giao lại thành trang độc lập. Đổi màu đã làm chúng gần nhau về màu, chưa tạo một trải nghiệm liên tục.
- **Tên và điểm đến chưa khớp:** Dashboard gọi Khảo thí & Bảng điểm nhưng điểm đến là Bài đã giao; breadcrumb có chỗ gọi `/` là Soạn đề thi trong khi đó là Kho đề. Editor có Khảo thí Online, Chia sẻ & Thi Online; nút kết quả lại mở popup hướng dẫn rồi mới đi danh sách bài giao chung.
- **Ngữ cảnh bị vòng lại:** đang xem kết quả của một đề nhưng modal kết quả đưa về toàn bộ bài đã giao, chưa lọc sẵn theo đề. Chọn đề để giao đưa về `/` nhưng chưa có trạng thái chọn đề rõ ràng. Nên đi thẳng bài giao cụ thể hoặc danh sách lọc theo đề, có đường quay về đúng chỗ.
- **Tải lỗi có thể bị hiểu là trống:** trang danh sách bài giao chỉ gán dữ liệu khi `res.ok`; nhánh lỗi/mất mạng chưa hiện lỗi danh sách rõ, sau đó tắt loading. Khi chưa có dữ liệu cũ, UI có thể nói chưa có bài nào được giao. Khi tìm không khớp cũng dùng lời nhắn chưa có bài đã giao thay vì không có kết quả tìm kiếm.
- **Chi tiết lớp có nguy cơ hiện dữ liệu lớp trước:** `handleOpenGroupDetails` đổi `selectedGroup` trước khi tải học sinh nhưng không xóa/đánh dấu danh sách cũ; non-OK chỉ bỏ qua, lỗi chỉ console. Chuyển lớp khi mạng lỗi có đường hiện tiêu đề lớp mới với danh sách cũ. Cần chốt kết quả theo ID lớp/request, không chỉ account; chưa tái hiện bằng runtime nên coi là rủi ro có căn cứ mã, cần kiểm đầu tiên khi sửa.
- **Trạng thái có lúc bị gộp:** danh sách khai báo OPEN/CLOSED/ARCHIVED nhưng nhãn hiện dùng OPEN hoặc Đã đóng. Cần đối chiếu API/dữ liệu trạng thái lưu trữ rồi hiển thị đúng; không tự đổi record lưu trữ thành đã đóng.
- **Không cần biến tất cả thành trang:** tạo lớp ngắn hoặc xác nhận thao tác vẫn hợp modal. Quản lý học sinh dài, bảng điểm và chấm bài cần diện tích, URL/ngữ cảnh ổn định; chọn cách mở dựa trên công việc cụ thể.

## 5. Chọn môn, thư mục, tìm kiếm và cách xem

- **Danh mục môn không phải nhiều DB độc lập:** `getAllSupportedSubjects` và `getSubjectsForGrade` trong subject-config đều bọc education-catalog. Điểm lệch nằm ở cách sử dụng: kho đề lọc môn theo lớp, ngân hàng lấy tất cả môn rồi lọc lớp riêng, sinh AI có quy tắc đổi lớp/môn khác, cài đặt đề giữ môn cũ kèm cảnh báo. Không nên xóa các cơ chế giữ dữ liệu cũ để làm giao diện trông giống nhau.
- **Nhãn bị lộ mã nội bộ:** thẻ/bảng đề hiển thị `exam.subject`; ngân hàng dùng `q.subject.toUpperCase()`, có thể thấy `toan`, `NGU_VAN` thay vì tên môn tiếng Việt như trong dropdown. Cần một hàm nhãn môn và một mẫu field/bộ lọc chung.
- **Bộ chọn trình bày khác nhau:** dropdown môn của kho đề bo góc nền xám; ngân hàng bo tròn viền; các màn khác lại tự định nghĩa field. Chọn một mẫu form và quy tắc môn–lớp. Popup native của hệ điều hành có thể khác giữa máy/điện thoại; chưa có lý do thay toàn bộ native select bằng menu tự viết chỉ vì khác hình thức.
- **Cụm “ấn vào môn” cần đối chiếu đúng điểm vào khi kiểm trực tiếp:** đã đọc các vị trí chọn môn trên kho đề, ngân hàng, sinh AI và cài đặt đề; chưa giả định đó là một trang môn riêng vì hiện route không có trang môn riêng trong các điểm đã đọc.
- **Bộ lọc/kho đang giữ trong state của component:** đi khỏi Dashboard rồi quay về/tải lại chưa có URL ghi rõ thùng rác, thư mục, môn, lớp, trang. Nên mã hóa trạng thái điều hướng cần giữ vào URL, tránh tạo hàng loạt trang môn riêng chỉ để lọc danh sách.
- **Gần đây chưa khác rõ Tất cả:** cả hai dùng cùng truy vấn/sắp `updatedAt desc`, không có điều kiện thời gian riêng. Đây là quyết định sản phẩm cần thống nhất: coi là một chế độ sắp xếp hoặc quy định khoảng gần đây; không báo nó là lỗi mất dữ liệu.
- **Tìm kiếm hứa nhiều hơn thực hiện:** placeholder Dashboard nói tên đề/mã môn/năm học, API `/api/exams` hiện tìm trong title. Sửa câu hướng dẫn hoặc mở truy vấn đúng phạm vi, không làm người dùng tưởng kết quả bị thiếu.
- **Thẻ và bảng chưa tương đương:** thẻ có đổi tên/chuyển thư mục, bảng không có cùng bộ thao tác. Cần một quy tắc hành động dùng cho cả hai cách xem; nút quan trọng không chỉ là icon nhỏ.
- **Đọc lỗi khác với danh sách rỗng:** Dashboard giữ danh sách trước khi một lần nạp thất bại. Nếu ngữ cảnh view/bộ lọc đã đổi thì phải đánh dấu dữ liệu cũ hoặc không cho thao tác nhầm trên danh sách của ngữ cảnh trước.

## 6. Cấu trúc phù hợp được đề xuất

Một không gian giáo viên có điều hướng ổn định:

| Khu vực | Nhiệm vụ chính | Cách tổ chức |
|---|---|---|
| Kho đề | Tìm, lọc, sắp xếp, tạo/mở đề | Trang quản lý; thư mục/môn/lớp là bộ lọc có URL |
| Ngân hàng câu hỏi | Quản lý cá nhân/dùng chung, tìm/lọc, sửa/nhân bản/quyền chia sẻ | Trang quản lý riêng; trong editor có bộ chọn câu gọn dùng chung logic |
| Lớp học | Danh sách lớp, học sinh, link/PIN | Giữ cùng khung teacher; chi tiết có ngữ cảnh lớp ổn định |
| Bài đã giao | Bài kiểm tra/bài tập đã phát hành, trạng thái, kết quả | Trang danh sách và trang chi tiết; lọc sẵn khi đi từ một đề/lớp |
| Thùng rác | Đề đã chuyển vào thùng rác và khôi phục | Nội dung riêng, không dùng bộ hành động soạn/quản lý đề sống |
| Bàn soạn | Chỉnh câu, đáp án, xem/in, dùng AI, giao bài | Giữ bố cục biên soạn chuyên dụng; thống nhất app bar/nhãn/quy tắc nút, không ép thành bảng quản lý |
| Khóa AI và tài khoản | Quản lý key cá nhân, tài khoản | Điểm mở nhất quán; giữ chính sách theo nhà cung cấp, không phục hồi cap AI/ngày cũ |

Thành phần dùng chung nên ở mức khung trang, tiêu đề, nút, bộ lọc, danh sách, hộp xác nhận, thông báo, trạng thái lỗi/trống và logic quyền. Không tái sử dụng nguyên cả màn hình với các nút bị vô hiệu hoặc bị đổi nghĩa để giả làm màn hình khác.

## 7. Thứ tự sửa để tránh làm lại nhiều lần

**Đợt đầu — đúng hành vi và không thao tác nhầm:** tách hành động thùng rác; bỏ thao tác không hợp lệ ở đề đã xóa; chuẩn hóa câu dùng chung và phân trang/lọc; chặn hiện danh sách học sinh sai lớp; thống nhất phản hồi khi tải/xóa/khôi phục thất bại. Không triển khai xóa vĩnh viễn như một phần thay icon.

**Đợt tiếp — thống nhất cấu trúc:** khung quản lý teacher; trang ngân hàng; bộ chọn câu trong editor; tên/đường đi khảo thí; giữ trạng thái qua URL và quay lại đúng đề/lớp. Tận dụng API/lưu/quyền đã có, không viết lại cơ chế bảo toàn.

**Đợt cuối — thống nhất chi tiết:** cùng nhãn môn, field, cỡ chữ, khoảng cách, bảng/thẻ và menu; đủ dạng câu; gỡ từ ngữ kỹ thuật và dữ liệu mẫu gây hiểu sai; kiểm dọc/ngang/sáng/tối/thu phóng/bàn phím.

Đây là nhóm ưu tiên phân tích, không phải checklist/master mới và không tự đóng CV nào. Khi sửa phải kiểm bằng luồng người dùng thật: nhìn nút có hiểu đúng hành động; hủy không ghi; thành công đúng bản ghi; lỗi không giả thành trống/thành công; quay lại giữ ngữ cảnh; xem nhiều trang không bỏ sót; chèn câu giữ phương án/đáp án/ngữ liệu/hình; đề có bài giao vẫn giữ lịch sử/quyền.

## 8. Giới hạn và tiếp nối

Đợt này chỉ đọc source/API/schema và test đã có; **không chạy test mới, không build, không ghi DB, không gọi AI, không sửa mã sản phẩm**. Test F19 hiện có kiểm thao tác theo tooltip Khôi phục đề, nên test chức năng đạt trước đó chưa chứng minh biểu tượng/hành vi đã dễ hiểu với người dùng. Cũng chưa thấy kiểm bao quát trang sau của kho dùng chung trong phạm vi đã đọc.

Kết luận đủ để bắt đầu sửa theo đợt trên sau khi chủ dự án chốt: đây là nợ tổ chức giao diện kèm lỗi luồng thật, không chỉ vấn đề chưa đổi hết màu. Cần duyệt hướng phân chia trang và chính sách xóa vĩnh viễn riêng trước khi làm những phần đó. Các lỗi đã có căn cứ không cần chờ người dùng liệt kê từng màn hình mới được đưa vào kế hoạch sửa.
