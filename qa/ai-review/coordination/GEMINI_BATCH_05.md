# Gemini — đợt dài, generation5

Task GEMINI-CONTINUOUS-BATCH trong ASSIGNMENTS.json. Gốc F:/Workspace/Zazz/ExamCraft. Đọc AGENTS.md, hồ sơ00/02, docs/phoi-hop-ai/03_HANG_DOI_LIEN_MACH.md. Chỉ đọc mã/tài liệu và ghi báo cáo riêng dưới đây, status/tin riêng; không sửa code/checklist/02/tiến độ, không build/test runtime/DB/provider/.env/backup. Mỗi mục độc lập có thể làm tiếp sau bàn giao mục trước trong lúc Codex duyệt.

Quy tắc chất lượng: ghi điều trực tiếp nhìn thấy + đường dẫn/hàm/đoạn mã, khác với suy luận và chưa kiểm. Không viết “an toàn tuyệt đối/không có lỗ hổng/đã chạy” từ việc thấy tên helper. Không suy số test từ số file hoặc chép số test vào audit; dẫn báo cáo nhóm. Không coi kết quả AI là duyệt chuyên môn. Dùng link Markdown tương đối có thật; không file:/// hoặc line giả. Ghi thời điểm và root HEAD + có working tree; HEAD không đại diện phần chưa commit.

## G01 — hoàn thành đính chính audit trước

Kế thừa GEMINI_TASK_04.md, không làm lại từ đầu. Chỉ sửa qa/ai-review/GEMINI_ACCOUNT_CALLERS.md và GEMINI_PUBLIC_POLICY_CASES.md. Giữ phụ lục đính chính.

- Loại các kết luận tuyệt đối; mô tả guard đúng thân handler, kể cả guard trực tiếp không dùng helper hợp nhất.
- Tách public view sanitized với capability private, điều kiện cookie/status/học sinh/lớp. Thiếu cookie không mặc định409; thứ tự guard quyết định.
- showResult/showSolution/leaderboard/assessmentMode là các điều kiện độc lập; không suy đáp án hiện từ điểm hiện. Deadline/grace/CAS phải có tiền điều kiện cụ thể. Không nói toàn bộ suite HTTP là test của riêng một file.
- Hiện tại memory/share đã được Codex sửa trong working tree: đối chiếu báo cáo MEMORY_AND_SHARE_VERSION và SHARE_TRANSACTION_REVALIDATION; không ghi đã có UI mới.

## G02 — kiểm liên kết tài liệu hiện hành

Đầu ra qa/ai-review/GEMINI_DOC_LINKS.md. Đọc 00/01/02, checklist03, tiến độ, docs/phoi-hop-ai/*.md và các tài liệu được chúng trỏ trực tiếp khi cần. Liệt kê link file thiếu/đường dẫn máy tuyệt đối/file:/// và anchor nghi sai; ghi file chứa, link nguyên văn, tồn tại thật hay chưa xác minh, đích đề xuất nếu tìm thấy bằng rg.

Chỉ đọc danh sách tên file/tệp cần thiết; không dump repo, không mở .env/backup/raw chat/log lớn. Không tự sửa link hoặc tìm thay lịch sử thành tài liệu hiện tại. Nếu link cũ có chủ đích lưu lịch sử thì ghi đúng, không tự gọi lỗi. Không chạy kiểm mạng/AI; URL ngoài để “chưa kiểm web”. Không lặp mọi link tốt, chỉ thống kê bằng mô tả và liệt kê vấn đề có ích.

## G03 — bộ ca kiểm thủ công cho chủ dự án

Đầu ra qa/ai-review/GEMINI_MANUAL_TEST_CARDS.md. Dựa checklist và nghiệm thu hiện có, chuẩn bị thẻ ngắn từng luồng: tạo/sửa/lưu/mở; nhập Word/ảnh/text; đáp án; mẫu; chia sẻ/copy; giao bài/học sinh/nộp; chấm/nhận xét/restore; key/usage; ghi chú AI; backup/restore.

Mỗi thẻ gồm vai trò, dữ liệu giả cần chuẩn bị, các bước bấm dễ hiểu, kết quả cần nhìn, dừng lại và giữ bản nháp nếu lỗi, báo lại gì. Tách “đã có ca kiểm kỹ thuật” và “người dùng chưa thử”; không tick đạt. Key/provider thật ghi chưa chạy và không bảo user dán key vào báo cáo. Không cho người dùng reset/restore đè DB thật hoặc nộp lại fixture đã nộp. Ca chưa có UI thì ghi “chưa có/đề xuất”, không tưởng tượng nút.

## G04 — bảng caller chỉ theo bằng chứng

Đầu ra qa/ai-review/GEMINI_CALLER_EVIDENCE.md. Tập trung các màn key/memory/template/import/share/teacher grading. Mỗi dòng: file component -> hàm gọi -> method/path API -> owner header/gate thấy ở đâu -> server guard thấy trong handler -> chưa biết/chưa kiểm. Với helper thì lần theo một cấp để chứng minh, không kết luận tên import là đủ.

Không cần audit toàn repo hoặc lặp G01. Mục tiêu cung cấp bản đồ để Codex review, không tự đề nghị refactor chỉ cho đồng nhất tên helper. Code đang thay thì ghi snapshot quan sát, không sửa scope của Claude.

## G05 — câu chữ gây ngợp hoặc hứa quá mức

Đầu ra qa/ai-review/GEMINI_UI_WORDING.md. Chỉ đọc UI thuộc luồng giáo viên/học sinh hiện có. Tập trung thuật ngữ khó, nhãn AI tự học/độ tin cậy như chứng nhận, lưu thành công giả, link xem với link làm bài, nút chưa hoạt động, lỗi lộ chi tiết kỹ thuật. Bảng: file+chuỗi đang có, vì sao khó hiểu, câu ngắn đề xuất, ngữ cảnh cần giữ.

Giới hạn những vấn đề rõ ràng, không viết lại toàn bộ UI, không đổi chính sách/luật hoặc nội dung chuyên môn. Không sửa mã; Codex chọn sau. Không lấy việc không đọc thấy nút làm bằng chứng nó không tồn tại.

## G06 — đối chiếu kho tài liệu với phạm vi môn/lớp

Đầu ra qa/ai-review/GEMINI_CONTENT_COVERAGE.md. Chỉ dùng docs/nghien-cuu/05_DANH_MUC_HOP_NHAT.md, 06_VIEC_TIEP_THEO.md và gói fixture/registry đã được bản đồ01 chỉ đến; đọc đúng phần, không toàn lịch sử chat. Dựa danh mục đã chốt để lập bảng môn/cấp/lớp/nhánh: có đường dẫn nguồn hay chưa, có dữ liệu chương trình đọc được hay chỉ URL, gói demo hay gói đã duyệt, thiếu reviewer/tài liệu gì.

Không tự suy tất cả môn học tất cả12lớp hoặc ba bộ sách áp dụng y hệt. Không loại môn ngoài Toán; nếu chưa biết chương trình thì UNKNOWN và chỉ nguồn cần đối chiếu. Không tìm web mới trong mục này, không xác nhận hiệu lực pháp lý/quyền tác giả/chất lượng giáo dục. Đây là kiểm kê để Codex phân tích tiếp, không phải học liệu chuẩn hoặc xác nhận đủ nội dung.

## G07 — chỉ mục bằng chứng kiểm hiện có

Đầu ra qa/ai-review/GEMINI_VERIFICATION_INDEX.md. Tra báo cáo nhóm mà hồ sơ02/map01 đang dẫn: nhóm lưu/nháp/quyền, import/restore, template/memory/key, share, public policy/chấm. Mỗi nhóm ghi hành vi nào được kiểm bằng unit/HTTP/DB/UI, link báo cáo và phần chưa kiểm. Không mở hết log, không chạy lại test hoặc chép số liệu. Mâu thuẫn báo cáo–code–status thì ghi mâu thuẫn, không tự chọn điều có lợi để đóng CV.

## G08 — bảng tổng hợp đợt

Đầu ra qa/ai-review/GEMINI_BATCH_SUMMARY.md. Bảng G01–G07: đầu ra, vấn đề quan trọng có bằng chứng, quyết định Codex đã ghi/chờ, bước tiếp. Không tạo checklist sản phẩm cạnh tranh hoặc kết luận toàn dự án xong. Mục nào bị chặn thì ghi chính xác phần chưa làm, không tự giảm phạm vi rồi gọi hoàn thành.

## Bàn giao và chờ

Mỗi mục gửi tin unique cho Codex và đóng băng báo cáo, tiếp mục độc lập trong danh sách. Đọc BATCH_REVIEWS.json/messages trước mục mới; CHANGES_REQUESTED ưu tiên đính chính, không sửa tệp đã chuyển quyền. Không sửa review decision hoặc status người khác. Làm hết mà chưa duyệt hết thì WAITING_REVIEW; phiên còn hoạt động chờ thưa30–60giây. Hết lượt ghi NEEDS_RESUME/bước tiếp, không tự nhận DONE hoặc giả tự thức lại. Không gửi xã giao/lặp nguyên báo cáo trong tin.
