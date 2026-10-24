# Hàng đợi dài — Claude / Gemini / Codex

> **Thay đổi vai trò 24/10/2026 (chủ dự án giao):** **Claude là người chỉ đạo.** Claude giữ `ASSIGNMENTS.json`, `BATCH_REVIEWS.json`, quyết định duyệt, checklist 03, hồ sơ 02 và báo cáo tiến độ. **Codex là người thực thi chính**: giữ mã, build/DB/server/provider, tích hợp theo việc được giao, ghi `CODEX_STATUS.md`. **Gemini** chỉ đọc mã và ghi các báo cáo được giao. Mọi câu dưới đây ghi "chỉ Codex sửa ASSIGNMENTS/BATCH_REVIEWS/checklist/hồ sơ/review decisions" nay đọc là "chỉ người chỉ đạo (Claude) sửa". Kế hoạch hiện hành: [04_MOC_PILOT](04_MOC_PILOT.md); việc mới nằm ở generation 13 (Codex) và 6 (Gemini). Claude worker batch 10 đã đóng.
> Codex vẫn được cập nhật dòng "Hiện trạng" của CV và báo cáo nhóm `qa/rebuild-<ngày>/` cho phần mình làm; không đóng CV và không sửa ASSIGNMENTS/BATCH_REVIEWS. Khi cần đổi phạm vi, gửi tin vào `messages/`, người chỉ đạo quyết.

Gốc chung: F:/Workspace/Zazz/ExamCraft. Đây là phân công thực hiện, không thay checklist sản phẩm. Đọc AGENTS.md, hồ sơ00/02 và ASSIGNMENTS.json trước. Quy tắc này bổ sung 02_QUY_UOC_PHOI_HOP.md theo yêu cầu chủ dự án ngày24/10.

## Cách làm liền mạch

1. Nhận đúng batch/generation trong ASSIGNMENTS, cập nhật status riêng. Đọc danh sách của mình, làm theo thứ tự. Mỗi lần chỉ một mục đang sửa code/báo cáo.
2. Mỗi mục có mã riêng, vùng tệp, đầu ra và tiêu chí. Bàn giao bằng commit nhỏ (Claude) hoặc báo cáo riêng (Gemini), gửi tin unique vào messages. Status ghi cả mục đang làm lẫn các mục đã giao/chờ duyệt; không chỉ ghi một trạng thái chung mơ hồ.
3. Khi giao một mục, đóng băng đúng các tệp/commit đó để Codex review. Được tiếp ngay mục độc lập tiếp theo đã ghi trong queue và ASSIGNMENTS; không cần chủ dự án nhắc từng lượt. Nếu mục phụ thuộc kết quả tích hợp/base mới, phải chờ Codex RELEASE, không tự đoán đã duyệt.
4. Codex ghi quyết định theo từng mục trong BATCH_REVIEWS.json, chỉ Codex được sửa. Worker không sửa file này hoặc ASSIGNMENTS. PENDING chưa được duyệt; CHANGES_REQUESTED cần sửa theo note; ACCEPTED là duyệt phần giao; ACCEPTED_WITH_LIMITS phải giữ nguyên giới hạn; RELEASED_FOR_INTEGRATION chỉ được ghi sau khi duyệt, là chuyển quyền sửa/tích hợp sang Codex. ACCEPTED không đồng nghĩa đóng CV sản phẩm.
5. Nếu Codex yêu cầu sửa một mục, ưu tiên sửa đó sau checkpoint an toàn của việc hiện tại. Khi tệp đã RELEASED_FOR_INTEGRATION, chỉ gửi phát hiện, không tự sửa lại cho đến khi Codex giao generation mới. Mọi follow-up phải là commit mới, không amend/rebase commit đã giao.
6. Codex review diff/nội dung và bằng chứng thật, kiểm quyền/bảo toàn; tự tích hợp tuần tự, chạy build/HTTP/DB trên đích thử khi thay đổi cần. Đọc status và tin khi bắt đầu/giữa các nhóm việc và trước kết thúc đợt; không tự ghi ACCEPTED chỉ vì worker nói đạt hoặc hết thời gian. Nếu phải sửa nội dung mới thì review lại.
7. Worker chỉ kết thúc batch với DONE khi mọi mục được ACCEPTED/ACCEPTED_WITH_LIMITS hoặc RELEASED_FOR_INTEGRATION sau khi đã duyệt, hoặc mục bị Codex DEFERRED/CANCELLED rõ lý do. Làm hết nhưng còn PENDING -> WAITING_REVIEW, không DONE. Codex còn chủ trì tổng hợp; không yêu cầu chủ dự án chuyển tiếp từng nhận xét.

## Chờ và gián đoạn có giới hạn thực tế

- Khi phiên còn chạy và đang chờ, đọc tin/review ở khoảng30–60giây; không vòng lặp dày, không tạo tiến trình nền, không đọc lại toàn repo. Có việc độc lập thì làm việc đó trước khi chờ.
- Khi phải kết thúc lượt vì giới hạn công cụ/thời gian/token: ghi NEEDS_RESUME hoặc WAITING_REVIEW, commit/WIP, lỗi và bước tiếp thật cụ thể; gửi tin rồi mới kết thúc. Không hứa tự thức lại hoặc chạy vô hạn. Chủ dự án chỉ cần dán prompt tiếp nối một lần khi phiên đã dừng.
- Không có hồi đáp quá45phút chỉ là nghi mất kết nối/hết lượt. Codex vẫn làm việc riêng, không giành tệp dở; muốn tiếp quản phải đổi owner/generation và giữ worktree cũ.
- Tệp chung không phải cơ chế đánh thức. Không tự lập lịch/tốn tiền/gọi AI thật để giữ phiên sống. Không tự suy user đã duyệt vì im lặng.

## Tránh xung đột

- Claude giữ worktree riêng đã có; chỉ sửa union allowed_code của batch và phải đúng mục đang làm. Đầu ra nộp ở checkout chính theo tên được giao. Khi chuyển mục, giữ cây sạch bằng scoped commit; không stage tệp người khác.
- Các mục code mới C02/C03 cố ý chỉ tạo helper/component/test mới. Codex giữ parent/API/schema/package/HTTP và mount component sau review. Không tự sửa các parent đang có WIP để làm demo.
- Gemini chỉ đọc mã/tài liệu và ghi các báo cáo được giao, status/tin; không sửa code, không chạy build/DB/provider. Không ghi vào báo cáo Claude hay hồ sơ chung.
- Chỉ Codex sửa checklist03, hồ sơ02, tiến độ và review decisions. Số test/log mới chỉ ghi báo cáo nhóm qa/rebuild-<ngày>/; status/audit chỉ dẫn link và loại kiểm, không chép số liệu. Không mở master/checklist sản phẩm khác.
- Không .env/khóa/cookie/backup/DB thật. Không install/generate/migrate/server/build từ worker. Không reset/clean/push/merge. Worktree không cách ly tài nguyên máy, DB hoặc cổng.
