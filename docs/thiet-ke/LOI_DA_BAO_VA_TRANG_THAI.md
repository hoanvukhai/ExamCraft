# Bảng theo dõi lỗi đã báo cáo và danh mục mẫu fixture

Tài liệu này hoàn thành tiêu chí nghiệm thu cho nhiệm vụ CV-006 (phạm vi YC-11, YC-18, YC-30, nghiệm thu NT-03, NT-16, NT-18) theo kế hoạch kiểm thử và bàn giao của dự án ExamCraft.

---

## 1. Mục tiêu và phạm vi

Nhiệm vụ CV-006 yêu cầu:
1. Thu thập và phân loại toàn bộ các lỗi từng được phát hiện, báo cáo hoặc xử lý trong quá trình phát triển dự án ExamCraft (đặc biệt trong giai đoạn tái cấu trúc tháng 10/2026), xác định rõ trạng thái (đã sửa, hiện còn, chưa tái lập) kèm ca kiểm thử tự động chứng minh và tệp đề mẫu liên quan.
2. Thiết lập bảng đối chiếu các dạng fixture mẫu (dữ liệu phẳng/payload, hình ảnh object/mảng, 7 loại câu hỏi, khối ngữ liệu dùng chung, và đề thi dài khối lượng lớn) ánh xạ tới các tệp mẫu cụ thể trong kho mã nguồn để phục vụ kiểm thử hồi quy lâu dài.

---

## 2. Bảng theo dõi các lỗi đã báo cáo và trạng thái kiểm thử

| STT | Vấn đề / Lỗi kỹ thuật | Mô tả chi tiết và giải pháp | Trạng thái | Ca kiểm thử chứng minh | Tệp mẫu liên quan |
|---|---|---|---|---|---|
| 1 | Xung đột ghi đồng thời khi nộp bài | Hai lần nộp bài cùng một thời điểm gây xung đột mức tuần tự (PostgreSQL 40001), Prisma báo lỗi P2010 khiến hàm retry bỏ qua và trả 503. Đã bổ sung mã lỗi vào `isRetryableTransactionError` và xử lý idempotent. | đã sửa | 'two simultaneous submits of one attempt produce one result and no duplicate answers'<br>'lost races are retryable whichever way Prisma reports them' | tests/fixtures/pilot/toan6-bay-dang.json |
| 2 | Tranh chấp khóa khi nhiều học sinh mở bài thi | Khi nhiều học sinh trong lớp cùng lúc nhấn bắt đầu làm bài, việc khóa cấp bài giao gây nghẽn giao dịch. Đã chuyển sang khóa theo từng học sinh và thêm độ trễ ngẫu nhiên khi thử lại. | đã sửa | 'student identity (PIN, class membership, personal link) and concurrent submit on the isolated server' | tests/fixtures/pilot/toan6-bay-dang.json |
| 3 | Lỗi đánh số thứ tự trong bảng sửa đáp án | Trong giao diện sửa đáp án sau khi giao bài, số thứ tự câu hỏi bị gán theo vị trí của danh sách đã lọc thay vì số thứ tự thực của câu trong đề gốc. Đã sửa hàm hiển thị chỉ số câu. | đã sửa | 'F12 teacher corrects a short-answer key, previews, applies and the student score follows' | tests/fixtures/pilot/toan6-bay-dang.json |
| 4 | Link chia sẻ đề bị trôi theo bản sửa mới | Trước đây link chia sẻ công khai luôn đọc phiên bản mới nhất, khiến đề đã chia sẻ bị thay đổi ngoài ý muốn của giáo viên. Đã nâng cấp token mang hậu tố phiên bản dạng .v<N> để đóng băng nội dung tại thời điểm chia sẻ. | đã sửa | 'public share and assignment hide keys and assignment freezes the source'<br>'old links: a revoked or expired share link stops serving content and a refused revoke changes nothing' | tests/fixtures/pilot/toan6-bay-dang.json |
| 5 | Thiếu kiểm soát định danh khi làm bài | Trước đây thiếu kiểm tra nghiêm ngặt mã PIN, link cá nhân và học sinh khác lớp trong cùng trường lúc làm bài. Đã bổ sung tầng xác thực danh tính học sinh độc lập. | đã sửa | 'PIN: required, checked per student, and a student from another class is refused'<br>'personal link: only the student own token of this class works' | tests/fixtures/pilot/toan6-bay-dang.json |
| 6 | Lỗi 403 Origin khi lưu đề thi qua trình duyệt | Máy khách gửi yêu cầu lưu đề với tiêu đề Origin hoặc cấu trúc cookie không khớp trong môi trường kiểm thử cục bộ. Đã chuẩn hóa cơ chế kiểm tra cùng nguồn (same-origin policy) và xác thực CSRF. | đã sửa | 'anonymous, foreign owner and cross-origin writes are rejected' | tests/fixtures/pilot/toan6-bay-dang.json |
| 7 | Mất bản nháp khi tải lại trang lúc mất mạng | Khi mất kết nối internet mà giáo viên bấm tải lại trang (F5), bản nháp đang soạn có nguy cơ bị xóa trắng. Đã bổ sung tầng lưu trữ phục hồi qua LocalStorage gắn với userId và examId. | đã sửa | 'F11 a reload that fails with no network loses nothing and the draft reaches the server on reconnect'<br>'F9 offline edits reconnect safely and preserve a conflicting draft as a separate exam' | tests/fixtures/pilot/toan6-bay-dang.json |
| 8 | Lỗi định dạng và rò rỉ mã LaTeX khi xuất DOCX đề dài | Khi xuất đề thi dung lượng lớn (120 câu) kèm nhiều công thức toán và hình ảnh, hệ thống gặp nguy cơ rò rỉ cú pháp mã LaTeX thô trong tệp XML hoặc lặp lại đoạn văn ngữ liệu. Đã chuẩn hóa bộ chuyển đổi OMML và gom nhóm ngữ liệu. | đã sửa | 'a 120-question exam exports to Word in order, with passages once, images present and formulas converted'<br>'solution and parallel exports keep every answer next to its own question' | tests/docx_long_exam.test.ts |
| 9 | Chưa có bản cài đặt mở ứng dụng hoàn toàn không mạng | Ứng dụng hiện tại chưa tích hợp Service Worker để phục vụ toàn bộ mã nguồn giao diện (PWA shell) khi mở ứng dụng lần đầu mà không có mạng. Khi có mạng mở đề thì mất mạng vẫn gõ được nháp. | hiện còn | Chưa có bộ kiểm Service Worker (ghi nhận là giới hạn thiết kế) | Không áp dụng |
| 10 | Chưa hỗ trợ hoàn tác cục bộ phân tách từng người | Hiện tại khi có hai người cùng soạn đề, thao tác hoàn tác được thực hiện ở cấp độ toàn đề qua lịch sử ExamRevision của chủ đề; chưa có ngăn xếp Undo/Redo độc lập cho từng người dùng trong phiên trực tiếp. | hiện còn | 'after a restore a stale editor is refused and a refreshed editor continues; editors cannot restore' | tests/fixtures/pilot/toan6-bay-dang.json |
| 11 | Xung đột khi hai engine AI cùng can thiệp sửa một câu | Tình huống hai trợ lý AI độc lập cùng phân tích và đưa ra đề xuất chỉnh sửa đồng thời trên cùng một câu hỏi. | chưa tái lập | Mọi tác vụ AI đều yêu cầu người dùng kích hoạt tuần tự và duyệt trước khi áp dụng | tests/fixtures/pilot/toan6-bay-dang.json |

---

## 3. Danh mục mẫu dữ liệu kiểm thử (Fixture Patterns Matrix)

Để phục vụ kiểm thử tự động, tích hợp cơ sở dữ liệu và xác minh định dạng xuất bản, kho mã nguồn ExamCraft duy trì các mẫu dữ liệu chuẩn sau:

| Dạng dữ liệu (Pattern) | Đặc điểm cấu trúc kỹ thuật | Tệp mẫu đại diện trong kho mã | Mục đích kiểm thử và ứng dụng |
|---|---|---|---|
| Dữ liệu phẳng và DB Payload | Cấu trúc đối tượng đề hoàn chỉnh gồm tiêu đề, thông tin môn, mảng câu hỏi, ma trận độ khó, điểm số nguyên và số thập phân (Decimal). | tests/fixtures/pilot/toan6-bay-dang.json | Kiểm tra quá trình chuyển đổi giữa đối tượng giao diện và bản ghi lưu trữ PostgreSQL qua Prisma adapter. |
| Hình ảnh dạng object và mảng | Câu hỏi chứa trường figures hỗ trợ cả dạng mảng đối tượng {id, url, caption} và đối tượng đơn lẻ, kiểm tra khả năng tương thích ngược. | tests/fixtures/pilot/toan6-bay-dang.json | Kiểm tra render hình ảnh trên giao diện soạn thảo, trang làm bài của học sinh và nhúng hình vào tệp DOCX. |
| Đầy đủ 7 loại câu hỏi chuẩn | Chứa trọn vẹn 7 kiểu câu: Trắc nghiệm 1 lựa chọn, Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Trả lời ngắn, Tự luận, Điền khuyết, Ghép nối. | tests/fixtures/pilot/toan6-bay-dang.json | Kiểm thử bộ máy chấm điểm tự động, cơ chế xáo trộn phương án và xuất phiếu trả lời. |
| Ngữ liệu dùng chung (Passages) | Khối văn bản dài (ngữ liệu văn học, bài đọc hiểu tiếng Anh) được liên kết với nhiều câu hỏi con qua trường passageId. | tests/fixtures/pilot/mon2-ngu-lieu.json<br>qa/ai-review/fixtures/da-mon/ngu-van-7.json | Kiểm tra quy tắc xuất Word: đoạn ngữ liệu chỉ xuất hiện một lần phía trên nhóm câu hỏi liên quan, không bị lặp lại. |
| Đề dài khối lượng lớn (Long Exam) | Bộ đề gồm 120 câu hỏi tích hợp đồng thời công thức toán phức tạp, hình ảnh minh họa và các đoạn ngữ liệu dài. | tests/docx_long_exam.test.ts (sinh tự động) | Kiểm tra giới hạn chịu tải của bộ chuyển đổi XML/DOCX, bảo đảm không bị tràn bộ nhớ và không sót mã LaTeX. |
| Đề đa môn chuyên biệt | Bộ sưu tập đề thi đại diện cho các môn Toán, Ngữ văn, Tiếng Anh, KHTN, Lịch sử - Địa lý, Tin học, Tiểu học. | qa/ai-review/fixtures/da-mon/ (8 tệp JSON) | Kiểm thử nhập xuất văn bản, bảng biểu, ký tự đặc biệt tiếng Việt, công thức hóa học và hiển thị đoạn mã lập trình. |
