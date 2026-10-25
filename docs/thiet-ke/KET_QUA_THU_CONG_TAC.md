# Kết quả thử nghiệm cộng tác và quyết định cơ chế đồng bộ

Tài liệu này hoàn thành tiêu chí nghiệm thu cho nhiệm vụ CV-005 (phạm vi YC-13, YC-19, nghiệm thu NT-20) theo kế hoạch kiểm thử và bàn giao của dự án ExamCraft.

---

## 1. Bối cảnh và phạm vi thử nghiệm

Nhiệm vụ CV-005 yêu cầu thử nghiệm các tình huống cộng tác nhóm nhỏ trước khi hoàn thiện thiết kế lưu chính thức:
- Hai người cùng chỉnh sửa một đề thi.
- Mất mạng cục bộ và kết nối lại khi đang biên tập.
- Hoàn tác và khôi phục các phiên bản lịch sử.
- Thay đổi cấu trúc đề (thêm, bớt, đổi vị trí câu hỏi) khi có xung đột.

Mục tiêu cốt lõi: bảo đảm an toàn dữ liệu tuyệt đối, không làm mất công sức soạn bài của giáo viên, không trộn dữ liệu nửa chừng gây sai lệch đề thi, và ghi nhận quyết định kiến trúc có căn cứ khoa học thay vì chỉ liệt kê tên thư viện.

---

## 2. Kết quả thử nghiệm theo các tình huống cốt lõi

### 2.1. Hai người cùng sửa đề (Concurrent Editing)

*Hành vi hệ thống:*
- Mỗi bản ghi đề thi trên máy chủ có trường số nguyên version làm khóa kiểm soát phiên bản lạc quan (CAS - Compare-And-Swap).
- Khi hai giáo viên cùng mở đề ở phiên bản N và thực hiện chỉnh sửa:
  - Người gửi yêu cầu lưu trước sẽ thành công, máy chủ tăng số phiên bản lên N+1 và ghi lại một bản ghi lịch sử toàn vẹn (ExamRevision).
  - Người gửi yêu cầu lưu sau (vẫn mang baseVersion = N) sẽ bị máy chủ từ chối với mã lỗi HTTP 409 Conflict.
  - Tại giao diện trình duyệt của người gửi sau, hệ thống không xóa hay ghi đè nội dung đang nhập, mà hiển thị cảnh báo xung đột và cung cấp nút bấm cho phép lưu toàn bộ nội dung nháp thành một đề thi độc lập mới.

*Ca kiểm thử tự động chứng minh trong mã nguồn:*
- Tệp tests/http_collab_restore.test.ts:
  - 'two people editing different questions never lose work, and history can restore any version'
  - 'different questions from the same base: one wins, the other is refused whole and nothing is half applied'
- Tệp tests/http_workflows.test.ts:
  - 'collaboration honors view, edit, CAS, history and revocation'
- Tệp tests_pilot/pilot.test.ts:
  - 'F4 public link, collaborator edits and revoke'
  - 'F14 two teachers edit the same exam at once: the first save wins, the other keeps a draft and can save it as a copy'

---

### 2.2. Mất mạng cục bộ và kết nối lại (Offline & Reconnect)

*Hành vi hệ thống:*
- Khi giáo viên đang soạn bài mà mất kết nối mạng, trình duyệt lưu toàn bộ trạng thái vào bộ nhớ cục bộ (LocalStorage) với khóa định danh kết hợp giữa userId và examId.
- Giáo viên vẫn tiếp tục chỉnh sửa nội dung trên giao diện mà không bị gián đoạn hay mất chữ.
- Khi có mạng trở lại:
  - Hệ thống tự động gửi yêu cầu đồng bộ bản nháp lên máy chủ.
  - Nếu đề trên máy chủ chưa bị người khác sửa (version khớp), bản nháp được lưu thành công vào cơ sở dữ liệu.
  - Nếu trong thời gian mất mạng, một người dùng khác đã lưu phiên bản mới lên máy chủ, máy chủ từ chối với mã 409. Bản nháp cục bộ được bảo toàn trọn vẹn và người dùng có thể lưu thành đề mới để so sánh, không bị mất bất kỳ thay đổi nào.

*Ca kiểm thử tự động chứng minh trong mã nguồn:*
- Tệp tests_pilot/pilot.test.ts:
  - 'F9 offline edits reconnect safely and preserve a conflicting draft as a separate exam'
  - 'F11 a reload that fails with no network loses nothing and the draft reaches the server on reconnect'
  - 'F10 switching accounts in one browser keeps a local draft private to its owner and recoverable'

---

### 2.3. Hoàn tác và khôi phục lịch sử (Undo & History Restore)

*Hành vi hệ thống:*
- Mỗi lần lưu thành công trên máy chủ tạo ra một bản ghi ExamRevision chứa snapshot toàn bộ cấu trúc câu hỏi, đáp án, điểm số và tác giả sửa đổi.
- Bảng lịch sử ExamRevision là bất biến (append-only), không có thao tác xóa hay sửa đổi revision cũ.
- Khi chủ sở hữu (Owner) chọn khôi phục một phiên bản cũ (ví dụ phiên bản 1 trong khi đề đang ở phiên bản 3):
  - Máy chủ sao chép nội dung của phiên bản cũ thành phiên bản mới nhất (phiên bản 4).
  - Toàn bộ lịch sử các phiên bản 1, 2, 3 vẫn được giữ nguyên đầy đủ.
  - Người biên tập (Editor) chỉ có quyền xem lịch sử, không có quyền thực hiện khôi phục phiên bản.
  - Một biên tập viên đang giữ phiên bản cũ trước khi khôi phục nếu cố lưu sẽ bị từ chối; sau khi tải lại đề mới nhất thì có thể tiếp tục làm việc bình thường.

*Ca kiểm thử tự động chứng minh trong mã nguồn:*
- Tệp tests/http_collab_restore.test.ts:
  - 'the owner restores an older version as a new version and no history is lost'
  - 'after a restore a stale editor is refused and a refreshed editor continues; editors cannot restore'
- Tệp tests/http_permission_matrix.test.ts:
  - 'manage and publish: only the owner changes members, restores history, shares, assigns or deletes'
- Tệp tests/http_workflows.test.ts:
  - 'history restore keeps student answers, restores pending distinctly from zero, isolates owners and serializes concurrent changes'

---

### 2.4. Đổi cấu trúc đề và xung đột không trộn nửa chừng (Structural Edits & No Half Merges)

*Hành vi hệ thống:*
- Các thay đổi cấu trúc bao gồm: xóa câu hỏi, chèn câu hỏi mới, thay đổi thứ tự câu hỏi, thay đổi khối ngữ liệu dùng chung.
- Khi có xung đột giữa hai người chỉnh sửa cấu trúc (hoặc một người sửa nội dung câu hỏi trong khi người kia đã xóa câu hỏi đó):
  - Hệ thống tuyệt đối không thực hiện cơ chế tự động ghép nối từng trường (auto-field merge) hay trộn nửa chừng.
  - Toàn bộ yêu cầu lưu gửi sau bị từ chối nguyên khối (refused whole). Điều này ngăn ngừa hoàn toàn tình trạng sinh ra đề thi có câu hỏi mồ côi ngữ liệu, điểm số không khớp với tổng điểm, hoặc đáp án bị gán sai vị trí.

*Ca kiểm thử tự động chứng minh trong mã nguồn:*
- Tệp tests/http_workflows.test.ts:
  - 'structural edits conflict without partial merges and revoked writers cannot retry'
- Tệp tests/http_collab_restore.test.ts:
  - 'different questions from the same base: one wins, the other is refused whole and nothing is half applied'

---

## 3. Quyết định cơ chế đồng bộ và lý do kiến trúc

Dự án ExamCraft thống nhất sử dụng cơ chế kiểm soát phiên bản lạc quan có kiểm soát (Optimistic Concurrency Control with Version CAS) kết hợp bảo toàn bản nháp phía máy khách (Client-side Draft Preservation), thay vì áp dụng các giải pháp CRDT (Conflict-free Replicated Data Types) hay OT (Operational Transformation).

Lý do cụ thể cho quyết định này:

1. Phù hợp với đặc thù đối tượng sử dụng:
   - ExamCraft là phần mềm phục vụ cá nhân chủ dự án và nhóm nhỏ giáo viên bộ môn trong nhà trường.
   - Luồng nghiệp vụ thực tế của giáo viên là phân công soạn từng phần hoặc một người soạn, một người phản biện góp ý; không có kịch bản hàng chục người cùng lúc gõ từng ký tự vào cùng một ô nhập liệu như văn bản hành chính thông thường.

2. Tính toàn vẹn cấu trúc của dữ liệu đề thi:
   - Đề thi là một thực thể phức hợp có ràng buộc chặt chẽ: danh sách câu hỏi, nhóm câu hỏi theo ngữ liệu, ma trận mức độ nhận thức, các phương án lựa chọn, đáp án đúng và phân bổ điểm số.
   - Các thuật toán CRDT (như Yjs hay Automerge) giải quyết rất tốt bài toán mâu thuẫn chuỗi văn bản (collaborative rich text), nhưng khi áp dụng trên cây JSON phân cấp lớn có ràng buộc nghiệp vụ, việc tự động ghép (auto-merge) rất dễ sinh ra trạng thái không hợp lệ (ví dụ: một người sửa đáp án câu 3, người kia đảo vị trí câu 3 xuống câu 5 dẫn đến câu hỏi mất tính nhất quán).

3. Đơn giản hóa hạ tầng vận hành:
   - Cơ chế CAS hoạt động hoàn toàn trên nền tảng HTTP REST chuẩn, không đòi hỏi máy chủ duy trì kết nối WebSocket thường trực, không cần cụm máy chủ đồng bộ trạng thái bộ nhớ (stateful cluster) phức tạp.
   - Dữ liệu luôn được xác thực (validate) nghiêm ngặt tại một điểm vào duy nhất trước khi ghi vào PostgreSQL, giúp việc sao lưu và phục hồi dữ liệu cục bộ an toàn, tin cậy.

4. Nguyên tắc ứng xử khi xung đột:
   - Người lưu trước thành công.
   - Người lưu sau giữ nguyên bản nháp của mình, không bị mất dữ liệu, và có quyền chủ động quyết định lưu thành bản sao riêng để đối chiếu.

---

## 4. Những điều chưa làm (Giới hạn hiện tại)

Để phản ánh trung thực trạng thái dự án theo nguyên tắc bàn giao:
- Chưa hỗ trợ hoàn tác cục bộ phân tách theo từng người dùng (per-user undo): hiện tại thao tác hoàn tác hoạt động ở cấp độ đề thi thông qua việc chủ đề khôi phục lại một bản ghi lịch sử toàn vẹn (ExamRevision) trên máy chủ. Chưa có ngăn xếp Undo/Redo riêng biệt cho từng cộng tác viên trong phiên soạn thảo đồng thời.
- Chưa hỗ trợ hiển thị con trỏ trực tiếp thời gian thực (real-time live cursor / peer presence) khi hai người cùng mở một đề.
