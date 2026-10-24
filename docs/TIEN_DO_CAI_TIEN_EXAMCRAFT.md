# Tiến độ cải tiến ExamCraft

Cập nhật: 24/10/2026. Chủ dự án đã duyệt hướng và cho triển khai liên tục. Phạm vi sử dụng: cá nhân, vài người hoặc nhóm nội bộ nhỏ. Giữ một ứng dụng và PostgreSQL; chỉ thêm thành phần khi cần cho hành vi đã chốt.

## Thông báo chung

Ba thông báo mới nhất, viết cho chủ dự án; số liệu kiểm thử ở báo cáo nhóm được liên kết. Các thông báo trước: [lịch sử thông báo](lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md).

Đợt chấm tay, lưu Git và gọn hồ sơ 24/10: chấm từ trang cũ hoặc hai người chấm cùng lúc không còn ghi đè nhau; người gửi sau được báo xung đột và giữ điểm đang nhập. Mỗi lần chấm có lịch sử trước/sau, chỉ chủ bài xem được. Trang chi tiết đọc được câu ghép/sắp xếp/đúng-sai và không bị phản hồi chậm của bài khác chen vào. Bản dựng, kiểm thử nền và kiểm thử API đều đạt sau lần sửa mã cuối; chưa kiểm giao diện hai tab chấm cùng câu, lint nhóm này chưa kết luận. Toàn bộ thay đổi từ 22/10 đã commit local trên nhánh `rebuild/2026-10-local`, chưa push; `.env` và `backups/` không vào Git. Hồ sơ đã gọn: số liệu chỉ ghi ở báo cáo nhóm, nhật ký cũ chuyển vào `docs/lich-su/`. Phát hiện cần xử lý, đã ghi checklist: sao chép từ link chia sẻ chỉ lưu trên trình duyệt (CV048), model AI mặc định lệch (CV032). Chỉ DB thử, không AI thật. [Chấm tay](../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md), [đọc chi tiết](../qa/rebuild-2026-10-23/TEACHER_DETAIL_REVIEW.md).

Đợt nháp học sinh 24/10: đã chặn trang cũ ghi đè nháp hoặc nộp đè bản mới; khi xung đột giữ câu đang nhập và tải bản sao được. Kiểm hai tab thật: A lưu bản mới, B bị chặn và tải được nội dung riêng, A nộp đúng; DB thử và dữ liệu nguồn giữ nguyên. Bản dựng, kiểm thử API và kiểm thử nền đạt. Chưa phục hồi nháp học sinh sau đóng trang/mất điện; chưa tổng nghiệm thu. [Báo cáo](../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md).

Đợt giao/chấm 24/10: giao bài không cần lớp; học sinh làm đủ bảy dạng, lưu nháp, mở trang mới làm tiếp, nộp được điểm tạm rồi giáo viên chấm tay thành điểm chốt; CSV và dữ liệu nguồn đối chiếu đúng. Sửa quyền khi đổi tài khoản và các nhãn/số liệu chờ chấm gây hiểu nhầm; bảng xếp hạng mặc định tắt. Chỉ DB thử, không AI thật; chưa tổng nghiệm thu. [Báo cáo](../qa/rebuild-2026-10-23/ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md).

## Trạng thái theo đợt

| Đợt | Trạng thái | Đầu ra / bằng chứng |
|---|---|---|
| S0 — Bảo toàn và kiểm nền | Đang kiểm tích hợp | Snapshot257tệp đã hash; bí mật local mã hóa DPAPI và giải mã đối chiếu; DBdump đã phục hồi21bảng; DB thử tách riêng |
| S1 — Lưu và quyền | Luồng cốt lõi và chuyển schema đã kiểm | Adapter câu–đề; ghi transaction và baseVersion; nháp theo tài khoản; kho server; nhập cũ xem trước; DTO public/token lượt/link chia sẻ |
| S2 — Giáo dục và mẫu | Đã nối luồng gói/phạm vi, còn biên tập nội dung | Gói có phiên bản/nguồn/cây kiến thức/mục lục sách; include–exclude và giới hạn phương pháp; lưu/mở lại đã kiểm. Gắn mã từng câu và kiểm phiên bản; chưa duyệt gói toàn môn, chưa chat đổi phạm vi |
| S3 — Bàn soạn | Đang làm | Sửa thủ công7dạng/đáp án/rubric/điểm0; đặt tên phần, ngữ liệu chung, ảnh/đồ thị; chỉnh tiêu đề/môn/lớp/cách đánh giá; thiếu đáp án không tự điền |
| S4 — AI | Đang kiểm | BYOK cùng chủ, giới hạn ứng dụng riêng quota nhà cung cấp; kế hoạch7dạng/số câu0; xem đề xuất trước áp dụng, giữ tiêu đề riêng/chặn bản nền cũ; rà đáp án không khớp rỗng; đề xuất sửa có bước duyệt và chặn kết quả đến muộn |
| S5 — Nhập/trộn/xuất | Một phần | Nhập7dạng/ngữ liệu có cảnh báo nguồn; trộn giữ vị trí phương án; Word giữ thứ tự, phần và nguồn ngữ liệu. Tải trực tiếp đã đối chiếuXML; trình chiếu hiện/ẩn đáp án đã kiểm; chưa nghiệm thu đầy đủ Word/PDF dài |
| S6 — Cộng tác | API và xung đột đã kiểm | Quyết định CAS + đồng bộ định kỳ cho nhóm nhỏ, lịch sử và phân quyền; chưa tuyên bố cộng tác thời gian thực từng ký tự |
| S8 — Ghi chú riêng | Một phần | Không tự xóa/ghi đè hoặc bật phân tích mới; xuất/nhập JSON theo tài khoản, nhập để tắt chờ người dùng đọc |
| S7 — Giao bài và chấm | Một phần đã kiểm | Snapshot tách nháp, cookie lượt làm, nộp lặp an toàn; giao/làm/chấm7dạng qua UI; CAS nháp học sinh và chấm tay có lịch sử (HTTP đạt, UI chấm hai tab chưa); kiểm quyền theo chủ |
| S9 và việc còn lại | Chưa hoàn tất | Theo checklist78CV; không lấy code cũ hoặc tên menu làm bằng chứng đã đạt |

## Bảo toàn dữ liệu đã thực hiện

- Mốc Git ban đầu: `bb831f240772f27ee57e4abcb83442ab0361e483`; giữ thay đổi có sẵn.
- 24/10: commit local7nhóm trên nhánh `rebuild/2026-10-local` (`86968fc`…`28d5d8e`: migration, sửa byte migration, code, tests, scripts, docs, bằng chứng QA). `main` giữ mốc ban đầu, chưa push/merge. `.gitattributes` giữ nguyên byte các migration đã áp dụng; `tmp/` để ngoài commit.
- `backups/before-rebuild-2026-10-21T22-08-28-289Z/`:257tệp,22.083.904bytes, manifestSHA256, diff và trạng thái cây. Đã kiểm nội dung bản sao khớp.
- `.env` và `.env.test` được lưu dưới dạng mã hóa trong `protected-secrets/` của snapshot; không đưa giá trị bí mật vào báo cáo/Git. Đã thử giải mã và so sánh trong bộ nhớ. Cách bảo vệ DPAPI yêu cầu cùng hồ sơ Windows khi khôi phục.
- DBdump62017bytes trong `backups/database/`, manifestSHA256; đã phục hồi vào `examcraft_restore_20261022`,21bảng. Bằng chứng: `provision-2026-10-22T03-28-44-994Z.json`. DB thử `examcraft_test_20261022` tách khỏi bản phục hồi và DB gốc.
- Đã tạo riêng bí mật ký lượt làm trong `.env`; giữ nguyên bí mật mã hóa khóa API cũ. Bản cấu hình mới được DPAPI mã hóa và giải mã đối chiếu tại `backups/config-2026-10-22-after-attempt-secret/`. Bí mật cũ đang không phù hợp cho production; chưa triển khai production và chưa xoay bí mật mã hóa khi chưa có quy trình đổi khóa an toàn.
- Dữ liệu trình duyệt cũ giữ nguyên. Có giao diện xem trước và nhập có định danh; chưa tự gán kho cũ không rõ chủ sở hữu vào tài khoản nào.
- Đã áp dụng migration có kiểm chứng vào DB ứng dụng; thêm3bảng cộng tác, không thay nội dung20bảng cũ. main-migration.json xác nhận schema và số dòng/hash. Có backup mới ngay trước áp dụng: backups/database/examcraft-2026-10-22T09-41-13-218Z.dump. Kiểm thử ghi dữ liệu giả vẫn chỉ dùng DB thử, không seed/reset DB chính.

## Thay đổi đang kiểm

1. Lưu đủ câu, đáp án chấp nhận, rubric, ảnh, ngữ liệu, điểm0 và phiên bản; nháp local có version cũ không bị nhầm là bản đã lưu server.
2. Mỗi lần sửa cần phiên bản nền; hai người ghi cùng phiên bản chỉ một lần thành công. Xung đột giữ nháp, cho tải JSON hoặc lưu thành bản sao.
3. Kho đề/ngân hàng dùng server trong quyền; lưu vào ngân hàng khác tự lưu đề. Bản sao có ID riêng.
4. API kiểm quyền tham chiếu folder/template/question. Route public chỉ gửi các trường cho phép; lượt làm cần cookie có chữ ký, không chỉ ID.
5. Nhập dữ liệu cũ kiểm từng mục, transaction từng tài liệu, giữ mục lỗi và không ghi đè bản đã nhập khi chạy lại.
6. Kiểm thử mặc định không ghi DB/gọi AI. Runner không báo PASS khi có assertion lỗi; test cũ không còn phù hợp được sửa theo hợp đồng, không làm sai nguồn để chiều test.

## Báo cáo chi tiết

- [Đọc trước khi tiếp nối — hồ sơ ngắn cho người/AI](ban-giao/00_DOC_TRUOC.md). Đợt chuẩn hóa hồ sơ chỉ sửa tài liệu: một điểm vào, bản đồ mã nguồn và trạng thái tiếp nối; checklist78CV giữ nguyên. Không chạy lại kiểm thử ứng dụng hoặc thay đổi số PASS từ việc sửa Markdown.

- [Kiểm thử và giới hạn bằng chứng](../qa/rebuild-2026-10-22/TESTING.md).
- [Quyền, link chia sẻ và lượt làm](../qa/rebuild-2026-10-22/ACCESS.md).
- [Danh mục giáo dục, khung nhận thức và điểm](../qa/rebuild-2026-10-22/EDUCATION.md).
- [Gói kiến thức, phạm vi và liên kết từng câu](../qa/rebuild-2026-10-22/KNOWLEDGE_SCOPE.md).
- [Khóa AI và giới hạn sử dụng](../qa/rebuild-2026-10-22/BYOK.md).
- [Sinh 7 dạng câu và duyệt đề xuất, giữ tiêu đề riêng](../qa/rebuild-2026-10-22/GENERATION.md).
- [Bàn soạn, AI, trộn/xuất và ghi chú riêng](../qa/rebuild-2026-10-22/WORKSPACE.md).
- [Rà soát bảo mật và dữ liệu](../qa/rebuild-2026-10-22/SECURITY_AND_DATA_REVIEW.md).
- [Checklist hiện hành](ke-hoach-2026-10-21/03_CHECKLIST.md).
- [Phương án đã duyệt](ke-hoach-2026-10-21/08_HO_SO_TRUOC_KHI_CODE.md).

Các mục đang làm không được đánh dấu hoàn thành chỉ vì đã có file. Khi kết thúc mỗi đợt, cập nhật kết quả test thực, phạm vi đã kiểm và việc còn lại tại đây; báo cáo chuyên môn vẫn chờ người duyệt.
