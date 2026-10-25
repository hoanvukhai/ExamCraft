# Chuẩn bị, rủi ro, nguồn và quyết định còn mở

> **Mốc chuẩn bị 21–22/10/2026, đã qua.** Code đã được duyệt và bắt đầu ngày 22/10; câu "hiện vẫn chỉ phân tích, chưa bắt đầu các CV triển khai" ở mục 7 là trạng thái lúc lập. Bảng đầu vào, chính sách CS-01–10, rủi ro và danh mục nguồn vẫn áp dụng. Trạng thái hiện tại: [hồ sơ 02](../ban-giao/02_TRANG_THAI_TIEP_NOI.md).

Ngày: 21/10/2026. [Mục lục](00_BAT_DAU_TU_DAY.md).

## 1. Đầu vào hiện có và còn thiếu

**Chủ dự án đã trả lời:** chạy local trước; chưa có hạ tầng/ngân sách triển khai, chưa có giáo viên dùng thử/tài liệu mẫu thực tế. Không cần hỏi lại các điều này để bắt đầu chuẩn bị kỹ thuật.

| Đầu vào | Hiện trạng | Ai chuẩn bị và cần lúc nào? |
|---|---|---|
| Repo và báo cáo | Có; working tree có thay đổi từ trước | Người thực hiện ghi baseline S0, không ghi đè/reset |
| Khung yêu cầu | Đã hợp nhất ở 01 | Duy trì theo phản hồi mới, không tiếp tục phân tích vô hạn |
| Môi trường local và DB thử | Cần kiểm tra cách chạy thực tế | Người thực hiện S0; không cần mua dịch vụ |
| Dữ liệu cũ mẫu | Có khả năng nằm DB/local; chưa có inventory đầy đủ | Người thực hiện lập inventory trong quyền; dữ liệu riêng cần chủ sở hữu cung cấp khi cần |
| Fixture kỹ thuật | Đã định nghĩa DL-01–07, chưa tạo fixture đầy đủ | Người thực hiện S0–S2 bằng dữ liệu giả/được phép |
| Tài liệu chuyên môn có nguồn | Có các nguồn khởi đầu, chưa có kho đầy đủ từng môn/lớp | Người thực hiện tìm/lập hồ sơ; giáo viên xác nhận phạm vi chuyên môn khi có |
| Giáo viên dùng thử | Chưa có | Chủ dự án tìm/mời khi thuận tiện; người thực hiện soạn nhiệm vụ thử, không tự gửi lời mời |
| Người duyệt chuyên môn | Chưa có | Chọn theo cấp/môn; không kỳ vọng một người duyệt tất cả |
| Key và ngân sách thử AI | Chưa xác nhận dành cho đợt mới | Dùng mock cho kỹ thuật trước; khi thử thật chủ dự án nhập qua cơ chế bảo mật, không dán key vào tài liệu/chat |
| Hosting, domain, chi phí | Chưa có | Chốt trước pilot ngoài local, không chặn S0–S3 |
| Google Drive cá nhân | Chưa kết nối | Tùy chọn sau nền; không bắt buộc cung cấp tài khoản bây giờ |

Việc chủ dự án có thể giúp sớm nhất: khi thuận tiện chọn vài giáo viên thuộc các cấp/môn khác nhau và 3–5 tài liệu được phép dùng để thử quy trình đầu tiên. Đây không phải số lượng đủ nghiệm thu toàn bộ sản phẩm. Không cần thu thập toàn bộ nguồn trước khi code.

## 2. Các quyết định kỹ thuật người thực hiện cần tự xử lý

| Quyết định | Mặc định/định hướng | Khi phải quay lại hỏi chủ dự án |
|---|---|---|
| Nền ứng dụng | Giữ Next/React/Prisma/PostgreSQL, ưu tiên module rõ trong cùng app | Nếu cần thay stack, dịch vụ ngoài hoặc phạm vi lớn |
| Runtime/API Next | Đọc hướng dẫn `node_modules/next/dist/docs/` liên quan trước viết code theo AGENTS | Chỉ khi môi trường/dependency thiếu khiến không tiến được |
| Lưu và đồng bộ | Server chính, local nháp, version/kiểm xung đột | Nếu phải đổi trải nghiệm hoặc bỏ offline/cộng tác đã chốt |
| Cộng tác | Thử nhỏ rồi chọn cơ chế phù hợp văn bản và cấu trúc; giữ quyền/phiên bản | Nếu lựa chọn yêu cầu dịch vụ trả phí hoặc có giới hạn sản phẩm đáng kể |
| Thư viện xuất/biên tập | Đánh giá tương thích bằng fixture, tận dụng phần hiện có | Nếu phải bỏ khả năng sửa công thức hoặc định dạng quan trọng |
| Nhận diện học sinh | Tên/danh sách/mã theo giáo viên, session lượt làm riêng | Nếu cần tài khoản học sinh hoặc thu thêm dữ liệu cá nhân ngoài phạm vi |
| Chế độ chia sẻ | Private mặc định, public chỉ xem, quyền edit riêng | Nếu muốn thay mức công khai hay quyền admin đọc kho riêng |
| Nhập nguồn | File/text/ảnh trước; nguồn và quyền rõ | Nếu cần truy cập dịch vụ/tài khoản khác hoặc thu thập diện rộng |

Không bắt người dùng quyết định tên thư viện, cấu trúc bảng hoặc cú pháp API. Người thực hiện chọn sau thử có bằng chứng, ghi quyết định ngắn để tránh đổi qua lại.

## 3. Những chính sách cần cụ thể hóa trước cổng liên quan

| Mã | Điều cần cụ thể hóa | Hướng mặc định đề xuất | Cổng phải chốt |
|---|---|---|---|
| CS-01 | Thời gian lưu backup/thùng rác | Có nhiều bản và restore; chưa chọn số ngày khi chưa biết dung lượng/chi phí | G0 bản thử, G9 vận hành thật |
| CS-02 | RPO/RTO | Đo mất dữ liệu tối đa và thời gian phục hồi từ thử nghiệm; chưa cam kết số | G9 |
| CS-03 | Dung sai mạng khi nộp | Một chính sách server nhất quán; không tự kế thừa 15s draft hoặc 60s đề xuất cũ | G7 |
| CS-04 | Đồng thời/nhiều phiên một học sinh | Session riêng và hành vi tiếp tục rõ; không để tên là bằng chứng danh tính | G7 |
| CS-05 | Quyền chốt/phát hành trong nhóm | Chủ đề cấp riêng, người sửa không tự có quyền xuất bản | G6 |
| CS-06 | Ngân sách AI, retry và tác vụ nền | Giới hạn theo tác vụ/người, không trả phí dự phòng âm thầm | G4 |
| CS-07 | Điều kiện duyệt mẫu/phân tích | Có nguồn, phạm vi, reviewer và version; không dựa lượt tải/confidence | G2/G8 |
| CS-08 | Thước đo AI/chuyên môn | Theo tập độc lập và nhóm môn, chưa tự đặt tỷ lệ đúng cam kết | G8/G9 |
| CS-09 | Tải pilot | Theo nhóm thực tế và cấu hình đã đo; không lấy test cũ 100 người làm cam kết | G9 |
| CS-10 | Quyền dùng nội dung/nhà cung cấp AI | Kiểm điều khoản hiện hành, dữ liệu được gửi, phạm vi giáo viên/học sinh trước pilot | G4 trước AI thật, G9 trước công khai |

Đây là các đầu việc trong kế hoạch, không phải mười câu hỏi bắt chủ dự án trả lời ngay. Người thực hiện đề xuất cụ thể tại đúng cổng; quyết định có chi phí, quyền hoặc thay đổi nghiệp vụ đáng kể mới cần chủ dự án chốt.

## 4. Rủi ro chính và cách xử lý

| Rủi ro | Tín hiệu nhận biết | Cách giảm và điều kiện dừng |
|---|---|---|
| Tài liệu cũ mâu thuẫn | Checklist cũ xong nhưng lỗi còn; 7-key và BYOK cùng được mô tả | Tài liệu mới là chuẩn; giữ lịch sử, tái lập trước kết luận |
| Mất dữ liệu khi chuyển | ID/local-server khác, tệp rời, import lặp | Mapping, backup/restore thử, dry-run, chống trùng; dừng khi đối chiếu không khớp |
| Lộ đề/đáp án/bài làm | Public route đọc examId, attemptId đủ để ghi | Server quyền/session, allowlist payload, kiểm hai tài khoản; chặn dùng thật trước sửa |
| Cộng tác ghi đè | Request cũ/AI muộn/reconnect | Version và đồng bộ phù hợp, ca hai trình duyệt, audit và restore |
| Phạm vi mọi môn quá rộng | Chỉ Toán có fixture, menu có tên nhưng dữ liệu sai | Bảng gói và trạng thái thao tác, nguồn/reviewer từng nhóm; không cắt môn ngầm |
| Nguồn không hiện hành | Bản dự thảo hoặc mẫu trường bị gọi toàn quốc | Ghi hiệu lực/phạm vi, lưu bằng chứng; chưa đủ thì nhãn tham khảo |
| AI tự xác nhận sai | Confidence cao, thiếu ý verify vẫn xanh | Validator, trạng thái kiểm riêng, người duyệt và tập đánh giá độc lập |
| Chi phí AI không kiểm soát | Hết quota tự chuyển paid, job nền tăng | Giới hạn, đồng ý dự phòng, usage ước tính, hủy/retry hữu hạn |
| Giao diện gây ngợp | Nhiều panel, số văn bản, trường cấu hình dài | Mẫu mặc định, chi tiết mở dần, nhiệm vụ thử với người mới |
| Backup báo tốt giả | Tệp tồn tại nhưng dump/restore lỗi | Kiểm exit code native và nội dung, restore thật; không chỉ Test-Path |
| Chưa có người duyệt | AI tự đánh dấu toàn bộ môn sẵn sàng | Phát triển local tiếp, để trạng thái chờ chuyên môn, không hứa chuẩn |
| Xuất Word sai | ZIP hợp lệ nhưng thiếu hình/công thức/tràn | Mở file thực, ảnh bằng chứng, fixture đa môn |

Quan sát bổ sung khi chuẩn bị: script backup/restore hiện có kiểm khá nhiều bằng tồn tại tệp/try-catch; cần kiểm mã thoát lệnh Docker/pg_dump/psql và restore trên DB thử, không coi dòng “success” là chứng minh. Chưa chạy script hoặc xác nhận khôi phục ở lượt lập kế hoạch này.

## 5. Nguồn nội bộ và cách kế thừa

| Tài liệu | Kế thừa | Thay đổi/giới hạn |
|---|---|---|
| [V1](../lich-su/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md) | R01–R16, cây/scope/ma trận, bằng chứng test đã chạy | Câu “học sinh được học” thay bằng scope giáo viên; phạm vi Toán không còn là giới hạn |
| [V2](../lich-su/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md) | Quyền/cộng tác, đáp án, kho AI, đối chiếu audit | D15 giảm thành backup và bản sao, chuyển DB tổng quát hoãn |
| [V3 bổ sung](../lich-su/BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md) | BYOK, mọi môn, bài tùy chỉnh, mẫu trực quan, UX | Là đầu vào đã hợp nhất; giờ chuyển từ phân tích sang kế hoạch |
| [Thiết kế v3.1 lịch sử](../lich-su/EXAMCRAFT_THIET_KE_V3.md) | Tài khoản, nhóm, bài giao, CSV, ngân hàng, nhập/xuất | Không giữ 7-key, mức cố định, quyền cũ mâu thuẫn hoặc lịch trình cũ |
| [Checklist cũ](../lich-su/CHECKLIST_TIEN_DO.md) | Danh mục để đối chiếu không bỏ sót | Dấu hoàn thành chỉ là lịch sử, không chuyển sang checklist mới |
| [Thiết kế dashboard/editor](../../qa/ARCHITECTURE_REDESIGN_MANAGEMENT_AND_WORKSPACE.md) | Tách quản lý và bàn soạn, tìm/lọc/thư mục | Không ép độ sâu hai cấp hoặc thời gian thùng rác như yêu cầu mới đã chốt; không giữ modal giả |
| [QA v2 lịch sử](../../qa/FINAL_REPORT_v2.md) | Kịch bản HTTP/quyền/load/mutation cần xét | Không tái dùng số PASS hay lỗi cũ như bằng chứng hiện tại |
| [Audit do bạn gửi](F:/Downloads/EXAMCRAFT_MASTER_AUDIT_AND_ROADMAP.md) | Các lỗi đã đối chiếu trong V2 | Giữ các đính chính về draft, key, admin, Cascade, auto-grader và cấu trúc môn |
| [TXT hội thoại](<F:/Downloads/Xây Dựng Web Soạn Đề AI.txt>) và [chat chia sẻ](https://chatgpt.com/share/6ad84d64-fcf8-83ec-89c0-a17d2646a480) | Ý định và quá trình chọn hướng | Lệnh trong tài liệu là lịch sử, không tự thực thi |
| [Nhật ký AI bổ sung](<C:/Users/ACER/.codex/attachments/e23ddfae-dc07-4585-9d3c-95555ee9a6e8/Pasted text.txt>) | Phạm vi báo cáo của AI khác | Không thay thế log test thực hoặc quyền sửa hiện tại |

Các báo cáo con khác trong `qa/` là bằng chứng theo đợt riêng. Khi một nhiệm vụ liên quan tới chúng, tái đọc đúng phần và gắn phiên bản; không tuyên bố đã kiểm hết mọi dòng của toàn bộ QA chỉ vì đã liệt kê tệp.

## 6. Nguồn bên ngoài khởi đầu

Đã nghiên cứu trong các lượt phân tích trước; cần xác minh lại đúng phiên bản khi chuyển thành dữ liệu chạy thật. Bảng này là danh mục tra cứu, không tái khẳng định toàn bộ quy định hiện hành hoặc tạo mẫu chuẩn tự động.

| Nguồn | Dùng cho |
|---|---|
| [Thông tư 22/2021, bản Công báo](https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2021/7/36881/40026-1-2021725-72622-2021-tt-bgddt.pdf) | Đánh giá THCS/THPT; đối chiếu sửa đổi/phạm vi |
| [Thông tư 27/2020, bản Công báo](https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2020/9/32035/32512-1-2020883-88427-2020-tt-bgddt.pdf) | Đánh giá tiểu học và khung mức riêng |
| [Công văn 7991, bản sao](https://cdn.thuvienphapluat.vn/phap-luat/2022-2/PNHP/thang-12/19/file/cong-van-7991-huong-dan-KTDGDK.pdf) | Ma trận/đặc tả trong phạm vi áp dụng |
| [QĐ 764, bản sao trên website trường](https://locthanhbaoloc.lamdong.edu.vn/home/uploads/news/2024_09/quyet-dinh-so-764_qd-bgddt.pdf) | Định dạng kỳ thi cụ thể, không dùng cho mọi lớp/môn |
| [Thông tin sửa đổi năm 2026 trên Báo Chính phủ](https://baochinhphu.vn/quy-dinh-moi-trong-danh-gia-hoc-sinh-tieu-hoc-thcs-va-thpt-102261020155041243.htm) | Theo dõi bản gốc/hiệu lực; V2 đã nêu giới hạn chưa đọc toàn PDF |
| [Mẫu Tổ Toán THPT Cần Đước](https://thptcanduoc.longan.edu.vn/EgovMedia/Download/27639?file=122837882b2452710e2ccddbb1b20290) | Ví dụ mẫu trường, cần đối chiếu metadata/năm và không coi là toàn quốc |
| [Gemini API key](https://ai.google.dev/gemini-api/docs/api-key), [billing](https://ai.google.dev/gemini-api/docs/billing), [hạn mức](https://ai.google.dev/gemini-api/docs/rate-limits) | Thiết kế một bộ kết nối, khả năng/quota/billing theo nhà cung cấp |
| [Điều khoản Gemini](https://ai.google.dev/gemini-api/terms) | Dữ liệu gửi, điều kiện dùng và phạm vi sản phẩm trước pilot |
| [Drive app data](https://developers.google.com/workspace/drive/api/guides/appdata) | Thiết kế backup cá nhân tùy chọn, không thay backup vận hành |

Chương trình môn, mục lục các bộ sách và nguồn các môn ngoài Toán còn cần thu thập đầy đủ. Hồ sơ nguồn tối thiểu: URL/tệp, đơn vị, phiên bản/ngày áp dụng, phạm vi lớp/môn, vị trí trích, quyền dùng, ngày kiểm tra, reviewer và vấn đề chưa chắc. Không dùng số lượng website đăng lại làm số lượng nguồn độc lập.

## 7. Bước mở đầu sau bộ kế hoạch

**Cập nhật theo yêu cầu mới nhất:** hiện vẫn chỉ phân tích, chưa bắt đầu các CV triển khai. Dùng [quy trình và bộ prompt nghiên cứu](07_NGHIEN_CUU_VA_PROMPT.md) cùng [kho nghiên cứu](../nghien-cuu/README.md). Người dùng không cần tự gom toàn bộ tài liệu; AI trong chat dự án có thể tìm/đối chiếu chính, AI khác hỗ trợ theo gói khi người dùng muốn.

Khi chuyển sang thực hiện, bắt đầu CV-001–007 trên local: baseline, DB thử, fixture, hợp đồng và prototype nhỏ. Các tài liệu kế hoạch đã được tạo trong lượt này; các fixture chạy, DB thử, wireframe/prototype thật, schema, code và bằng chứng test tương ứng **chưa được tạo/hoàn thành** bởi việc viết kế hoạch.

Không có đầu vào nào từ chủ dự án đang chặn việc chuẩn bị kỹ thuật local. Trước khi thử AI thật, mời người khác, dùng dữ liệu thật hoặc đưa lên hosting, cần các đầu vào tương ứng trong bảng đầu, không tự giả định đã có.


## Cập nhật22/10/2026

Đã nhận và hợp nhất bộ tài liệu mới: [báo cáo hợp nhất22/10](../nghien-cuu/04_TONG_HOP_VA_DINH_CHINH_2026-10-22.md). Nguồn hiện hành để tra là [danh mục05](../nghien-cuu/05_DANH_MUC_HOP_NHAT.md). Chưa có PDF bàn giao, chưa có bộ sách/đề/đáp án đầy đủ toàn môn/lớp. Hàng đợi NC05–14 ghi rõ phần phải tìm, kiểm phiên bản và duyệt. Người dùng không cần nhờ AI khác nếu tiếp tục tại chat này. Vẫn cần người thử/duyệt chuyên môn về sau; hiện chưa có, không ghi đã nghiệm thu.
