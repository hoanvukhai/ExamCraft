# Lộ trình thực hiện và điều kiện chuyển bước

**Cụ thể hóa22/10/2026:** đọc [08](08_HO_SO_TRUOC_KHI_CODE.md), mục6–10, cho bàn giao từng đợt, gói dữ liệuND01–07, fixtureFX01–12 và các điểm chặn. S0–S9 dưới đây vẫn là lộ trình chính. Nghiên cứu trên giấy đã đủ để xin bắt đầu local; các nguồn chưa đủ được theo dõi tiếp, không đánh dấuNC05–14 hoàn thành toàn bộ. Chủ dự án đã duyệt triển khai; bắt đầu code ngày22/10/2026, tiến độ thực theo báo cáo chung và checklist.

Ngày: 21/10/2026. [Điểm vào bộ tài liệu](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md).

**Đã nhận phản hồi:** chưa có nơi triển khai/ngân sách và chưa có giáo viên/tài liệu mẫu thực tế. Vì vậy bắt đầu trên local với dữ liệu thử; không mua dịch vụ hoặc đưa dữ liệu thật lên mạng. Tìm mẫu và người duyệt nằm trong luồng chuẩn bị, không chặn mọi việc kỹ thuật.

## 1. Cách tổ chức công việc

Mỗi đợt có đầu vào, đầu ra và cổng nghiệm thu. Không gán số ngày chắc chắn khi chưa có baseline, khối lượng dữ liệu từng môn và kết quả thử luồng cộng tác. Sau S0 mới ước lượng theo khối công việc; cập nhật ước lượng khi có dữ liệu, không sửa phạm vi âm thầm để khớp ngày.

Một hạng mục nhỏ nên đi hết tạo → lưu → mở → sửa → xuất/đọc lại, thay vì làm xong toàn UI rồi mới nối DB. Dữ liệu nguồn các môn có thể chuẩn bị song song về mặt công việc với sửa nền; điều này không tự cho phép tạo nhiều agent/chat hoặc thực thi song song trên cùng dữ liệu.

## 2. Các đợt và đầu ra

| Đợt | Mục tiêu và đầu ra | Phụ thuộc | Cổng hoàn thành |
|---|---|---|---|
| S0 — Baseline và bảo toàn | Bản ghi working tree, môi trường local/DB thử, dữ liệu cũ mẫu, bằng chứng lỗi, hợp đồng/UX minh họa và danh mục môn | Bộ tài liệu này | G0: tái chạy được kiểm tra nền; biết dữ liệu ở đâu; có đường phục hồi trước migration |
| S1 — Lưu, quyền và chuyển dữ liệu | Adapter chuẩn, lưu server/nháp, version, quyền tham chiếu, chặn đường lộ dữ liệu, migration thử có đối chiếu | G0 | G1: tạo–lưu–mở–sửa không mất dữ liệu; hai tài khoản cô lập; lỗi lưu không báo thành công |
| S2 — Khung giáo dục và mẫu | Cây kiến thức/mục lục, khung mức nhận thức, scope, nguồn/hiệu lực, kế hoạch đề và mẫu tùy chỉnh | Hợp đồng S0; lưu chuẩn S1 | G2: ví dụ đủ ba cấp và nhiều đặc thù môn; nguồn/mapping rõ; không dùng THPT làm fallback |
| S3 — Bàn soạn và mẫu trực quan | Các loại câu, ba chế độ đề/đáp án, hình/ngữ liệu, tiêu đề/mẫu, undo và trạng thái dễ hiểu | G1; hợp đồng S2 | G3: soạn thủ công đầy đủ, chưa có key vẫn dùng; thử với người mới khi có người |
| S4 — BYOK và AI theo kế hoạch | Một luồng key, usage thật, sinh/sửa/kiểm định/nhập có cấu trúc, diff và giới hạn retry/chi phí | G1–G3; nguồn mẫu đủ cho ca thử | G4: 0 câu được tôn trọng, thiếu kết quả không báo đúng, key/chi phí đúng người, không sửa ngoài vùng |
| S5 — Nhập, trộn, xuất và trình chiếu | Duyệt nguồn nhập, chuyển công thức/hình, nhóm ngữ liệu, mã đề tái lập, Word/in/PDF và trình chiếu | G3; AI hỗ trợ từ S4 khi cần | G5: dữ liệu đủ sau nhập/xuất/trộn; file mở được và kiểm trực quan, không chỉ ZIP hợp lệ |
| S6 — Chia sẻ và cộng tác | Quyền xem/góp ý/sửa/nhân bản, cùng sửa đồng thời, lịch sử/thu hồi, bản công bố tách nháp | G1,G3; spike cộng tác từ S0 | G6: hai người sửa/reconnect/thu hồi quyền không mất nội dung hoặc vượt quyền |
| S7 — Giao, làm và chấm bài | Link, nhóm, session lượt làm, hạn/lượt, autosave/resume, tự luận, chấm/regrade/reveal, thống kê/CSV | G1,G3,G5; snapshot ổn định | G7: HTTP thật và hai phiên trình duyệt; không lộ đáp án, nộp hộ, sai điểm hoặc thay snapshot |
| S8 — Kho phân tích và trợ lý | Nguồn/phân tích/sở thích riêng, phản hồi, tìm kiếm trong quyền, góp kho chung và duyệt | G2,G4,G6; quy trình nguồn | G8: truy xuất không lộ kho riêng; không tự nâng insight thành chuẩn; thay nguồn vô hiệu hóa phụ thuộc |
| S9 — Độ phủ, phục hồi và phát hành thử | Hoàn thiện từng gói môn/lớp, kiểm tra hồi quy, CI, restore, tài liệu dùng và vận hành | G1–G8 | G9: ma trận độ phủ có bằng chứng, lỗi chặn đã đóng, dữ liệu phục hồi được; chỉ triển khai ngoài local khi có nơi chạy/chi phí được chốt |

Sửa an toàn khẩn trong các luồng chia sẻ/lượt làm thuộc S1; hoàn thiện trải nghiệm và đầy đủ chức năng của chúng thuộc S6/S7. Không đợi đến S7 mới xử lý lộ đáp án nếu cần dùng link với người thật. Trước G7, thử bài online bằng dữ liệu giả trong môi trường cô lập.

## 3. Đường phụ thuộc chính

S0 → S1 → S2/S3 → S4/S5 → S6/S7 → S8 → S9.

Đây là đường đơn giản để theo dõi; bảng trên là nguồn chính về phụ thuộc. Nghiên cứu nguồn và thiết kế mẫu các môn bắt đầu từ S0, không đợi Toán xong. S6 cần thử khả năng kỹ thuật sớm ở S0 để hợp đồng lưu/version không cản cộng tác sau này. S9 là tổng nghiệm thu; kiểm thử/backup không đợi đến cuối mới làm.

## 4. Những phần cần thử nhỏ trước khi chọn công nghệ

| Thử nhỏ | Cần trả lời | Quyết định sau thử |
|---|---|---|
| Cộng tác hai người | Sửa cùng khối/khác khối, offline/reconnect, undo của từng người, đổi cấu trúc câu có giữ đúng không? | Cơ chế đồng bộ văn bản và version cấu trúc; thư viện/hạ tầng phù hợp, không quyết theo giao diện mẫu |
| Xuất tài liệu nhiều môn | Phân số/hóa học/ngữ liệu dài/ảnh/bảng có giữ được và mở sửa trong Word không? | Bộ chuyển đổi, cách fallback và định dạng ảnh; không bỏ công thức im lặng |
| Chuyển dữ liệu cũ | DB payload và local phẳng đi về chuẩn mới có mất câu/hình/điểm/nguồn không? | Adapter, id mapping và bước kiểm tra trước migration |
| Dữ liệu giáo dục | Một bài sách ánh xạ nhiều kỹ năng, một kỹ năng nhiều sách có diễn đạt đúng không? | Mô hình liên kết, nguồn/phiên bản và cách giáo viên xem scope |

Thử nhỏ dùng mẫu giả/được phép, không phải xây một bản sản phẩm riêng rồi bỏ. Kết quả phải ghi giới hạn và tác động vào checklist; nếu cần thay công nghệ thì giữ hợp đồng dữ liệu và quyền.

## 5. Độ phủ môn không bị thu hẹp thành Toán

Danh mục gói có ít nhất các chiều: môn/hoạt động, cấp/lớp, chương trình, sách/phiên bản, loại bài và khả năng theo thao tác. Tách trạng thái đã làm kỹ thuật và đã duyệt chuyên môn.

- Mỗi đợt giao diện chung được kiểm bằng Toán và ít nhất một ca khác biệt: ngữ liệu Ngoại ngữ/Văn, môn tích hợp hoặc nhận xét không điểm.
- Toán 1–12 không được dùng chung một mẫu THPT; kiểm ít nhất các nhóm 1–5,6–9,10–12, rồi đi đến từng lớp/gói cụ thể.
- Nghe, thực hành, rubric/nhận xét cần trạng thái và tiêu chí riêng; không dùng nhiều lựa chọn thay cho khả năng chưa làm.
- Danh mục “mọi môn” được kiểm lại theo chương trình áp dụng trong S0/S2, không suy từ enum 19 môn hoặc 14 JSON là đã đủ.

Nếu thiếu người duyệt, vẫn hoàn thiện khung và kỹ thuật trên dữ liệu minh họa; trạng thái chuyên môn giữ “chờ duyệt”. Không phát hành nhãn “chuẩn” cho gói đó.

## 6. Chiến lược chuyển đổi không mất dữ liệu

Chụp baseline và backup → thử restore vào DB trống → lấy mẫu dữ liệu cũ → chuyển đổi thử → đối chiếu số lượng/ID/câu/hình/điểm/quyền → thử UI/API → chạy lại migration không nhân đôi → mới lên lịch áp dụng thật.

Ưu tiên thay đổi thêm trường/đọc tương thích trong giai đoạn chuyển tiếp. Nếu cần ghi song song, quy định nguồn chính và cách phát hiện lệch; không tạo thêm hai nguồn sự thật. Loại bỏ đường cũ chỉ khi đã chuyển dữ liệu, không còn caller cần nó và có cách xử lý link cũ. Quy tắc xóa dữ liệu phải theo vòng đời, không thêm Cascade hàng loạt.

Khi rollback, không hạ schema phá dữ liệu mới tùy tiện. Dừng ghi, bảo toàn dữ liệu phát sinh, xác định điểm khôi phục và chạy theo phương án đã thử. Mọi thử nghiệm phá dữ liệu chỉ trên DB cô lập có tên và đường dẫn đã kiểm tra.

## 7. Ba mức mốc sử dụng

| Mốc | Được dùng gì? | Chưa được suy ra |
|---|---|---|
| Local kỹ thuật | Dữ liệu giả, thủ công, lỗi/migration/cộng tác thử | Không phải sẵn sàng dùng đề thi thật |
| Pilot có kiểm soát | Nhóm giáo viên, gói dữ liệu có nguồn, điều kiện backup/quyền/đáp án đã đạt | Không đại diện mọi môn hoặc mọi quy mô |
| Phát hành phạm vi đã nghiệm thu | Gói có bằng chứng, vận hành có người phụ trách, quy mô tải đã đo | Không bảo đảm vô hạn tải, không lỗi hoặc AI luôn đúng |

Không tự mua hosting, kết nối Drive của người dùng, gửi lời mời giáo viên hoặc gọi AI hàng loạt từ kế hoạch này. Các đầu vào đó được chuẩn bị theo 05.

## 8. Nhịp cập nhật khi thực hiện

Mỗi phần hoàn thành ghi: CV nào, đổi gì, lý do, dữ liệu/phiên bản, ca NT và bằng chứng, lỗi còn lại, bước tiếp theo. Nếu phát sinh yêu cầu mới, thêm YC và đối chiếu tác động trước làm. Không cần tạo báo cáo dài sau mỗi chỉnh sửa nhỏ; checklist và thư mục bằng chứng đủ rõ là được.


## Cập nhật chuẩn bị nguồn22/10/2026

Trước khi chốt dữ liệu S2, thực hiện NC-05–NC-14 trong [hàng đợi nghiên cứu](F:/Workspace/Zazz/ExamCraft/docs/nghien-cuu/06_VIEC_TIEP_THEO.md). Nghiên cứu có thể đánh giá từng nhóm đủ hồ sơ trong khi tìm bù nhóm khác; không đợi mọi tỉnh đầy đủ. Điều này không tự cho phép bắt đầu code: lượt hiện tại chỉ sửa bộ chuẩn bị.

G2 bổ sung: xác định năm học/phiên bản áp dụng; phân biệt NN1/NN2 và trình độ; một PDF nhiều phụ lục được quản lý đúng; chuỗi sửa đổi không làm đổi đề đã chốt. G9 vẫn cần độ phủ từng lớp/môn; vài mẫu đại diện chỉ đủ thử mô hình.
