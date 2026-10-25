# Tiến độ cải tiến ExamCraft

Cập nhật: 25/10/2026. Chủ dự án đã duyệt hướng và cho triển khai liên tục. Phạm vi sử dụng: cá nhân, vài người hoặc nhóm nội bộ nhỏ. Giữ một ứng dụng và PostgreSQL; chỉ thêm thành phần khi cần cho hành vi đã chốt.

## Thông báo chung

Ba thông báo mới nhất, viết cho chủ dự án; số liệu kiểm thử ở báo cáo nhóm được liên kết. Các thông báo trước: [lịch sử thông báo](lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md).

Đợt tiếp25/10: thêm Rà soát đề để chỉ rõ mục thiếu; trình chiếu chọn nhanh câu và đổi cỡ chữ; lưu ngân hàng ghi rõ bản sao riêng, chặn bấm lặp khi đang gửi. Word Song song nay xuất hai cột theo từng câu, giữ ngữ liệu và thu ảnh vừa cột. Kiểm tự động và bản dựng đạt. Kiểm trình duyệt mới đang vướng Docker/DB thử chưa chạy; chưa kiểm trực quan Word dài, chưa tổng nghiệm thu. Không ghi DB chính hoặc gọi AI thật. [Báo cáo chi tiết](../qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md).

Đợt hoàn thiện25/10: Codex làm một mình, đã sửa lưu đề để không tạo lịch sử lặp cho câu không đổi và chặn ghi đè câu mới. Đã kiểm mất mạng/nối lại và giữ nháp xung đột trên Chrome/Edge; Song song có ngữ liệu chung, giờ/mã giao bài hiển thị đúng. CSV nay có nhận xét từng câu; hướng dẫn giáo viên được rút gọn. Build và các kiểm liên quan đạt trên DB thử, giữ dữ liệu thật và không gọi AI thật. Có thể bắt đầu dùng thử luồng lõi; toàn phạm vi dự án còn các mục sau pilot, Word/in thực tế và nội dung chuyên môn cần duyệt. [Báo cáo đợt](../qa/rebuild-2026-10-25/BATCH_SUMMARY.md), [hướng dẫn ngắn](huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md).

Đợt pilot 24/10 (đêm): đã có bộ kiểm tự động chạy trên trình duyệt thật cho bảy luồng chính của giáo viên và học sinh (đăng nhập, soạn, xuất Word và trộn mã đề, chia sẻ, giao bài, làm bài, chấm) — cả bảy đạt trên dữ liệu thử; bộ kiểm cũng phát hiện và sửa một lỗi thật: mã đề có ảnh không tải được Word. Thêm cho pilot: giao bài đặt được giờ mở/đóng, số lượt, mã vào bài; xem đề và đáp án song song; giáo viên thấy giờ và mã của bài đã giao. Còn lại trước khi đưa giáo viên thật dùng: build và kiểm lại bản mới nhất (Codex đang hết lượt), thử tay việc chưa tự động hóa được (mở Word, in nhiều trang, mất mạng), và tìm giáo viên thử/người duyệt. Chưa nghiệm thu, không AI thật. [Chi tiết](../qa/rebuild-2026-10-24/PILOT_E2E.md).

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
