# Tiếp nối lưu nháp và quyền — 23/10/2026

**Cập nhật sau khi chủ dự án mở Docker:** Engine đã phản hồi, container `examcraft_postgres` healthy tại cổng5436. Vòng DB mới đạt7/7; vòng HTTP đầu đạt14/14 trên DB thử. Đã kiểm browser xung đột và phục hồi nháp. Phần lỗi Docker phía dưới là lịch sử đầu đợt, không còn là chặn hiện tại. Kết quả cuối của các sửa tài khoản bổ sung xem `verification.json`.

Phạm vi: CV010/050 và kiểm tài khoản trong CV011; không đánh dấu hoàn tất toàn bộ các CV. Giữ hướng CAS cho nhóm nhỏ, không thêm hệ thống cộng tác theo từng ký tự.

## Thay đổi

- Lần tải định kỳ/focus của bàn soạn gửi tài khoản kỳ vọng. `loadExam` yêu cầu tham số này ở kiểu TypeScript để các điểm gọi mới không vô tình bỏ qua. Nếu cookie đã chuyển sang tài khoản khác, kể cả hai tài khoản cùng được xem đề, API phải trả ACCOUNT_CHANGED thay vì đưa bản mới vào nháp của tài khoản cũ.
- Khi xung đột có nút **Mở bản máy chủ, giữ riêng nháp**. Tải bằng quyền hiện tại; chỉ chuyển nội dung sau khi lưu riêng nháp và ghi cache bản máy chủ thành công. Bộ nhớ đầy/bị chặn thì giữ bản đang soạn. Bản máy chủ không bị ghi bởi thao tác này.
- Nếu giáo viên sửa thêm trong lúc tải, kết quả tải không thay bản mới sửa; yêu cầu thử lại. Lần tải dùng cùng chốt tác vụ đang chạy và generation/tài khoản như lưu; không đồng thời ghi/mở chồng nhau.
- Nháp lưu riêng nằm trong danh sách nháp theo tài khoản. Mở mục phục hồi sẽ tạo ID đề mới, bỏ serverId/version/quyền cũ và giữ câu–đáp án/ngữ liệu, để tránh tự ghi ngược vào đề gốc. Không xóa nháp nguồn.
- Chặn thao tác sửa/tạo bản sao nếu hook chưa sẵn sàng cho đúng tài khoản. Không dùng các chốt phía trình duyệt thay kiểm quyền server.

## Bằng chứng mới

- `tests/generation_and_drafts.test.ts`: thêm2ca về archive toàn tài liệu, mở phục hồi thành bản mới, cô lập tài khoản, ID không khớp và lỗi bộ nhớ. Đã kiểm cả lỗi ghi archive lẫn lỗi ghi cache sau archive; bản gốc vẫn giữ, archive đã tạo vẫn đọc được.
- Chạy cùng suite persistence:25/25 đạt. Typecheck độc lập đạt; build65376 đạt44trang. SAFE gồm20ca cũ +103ca bổ sung, xem safe-tests.log.
- Lint định hướng0lỗi, còn1cảnh báo ở điều hướng `window.location.assign` của LocalDraftsPanel (cơ chế tải lại trang đã có để đọc nháp). Không tuyên bố lint sạch toàn repo.
- Thêm assertion HTTP: tài khoản mới cùng có quyền trên đề vẫn bị từ chối GET khi header kỳ vọng là tài khoản cũ. **Assertion này chưa chạy với server thật trong đợt này.**

## Lịch sử chặn trước khi Docker hoạt động

Docker Engine local chưa đáp ứng: lúc đầu pipe `dockerDesktopLinuxEngine` không tồn tại. Đã thử mở Docker Desktop đã cài bằng tiến trình ẩn; CLI chính thức báo “already running”, nhưng lệnh đọc engine/container tiếp tục treo và đã dừng các lệnh treo của lượt này. Không đổi engine/context, reset, xóa volume/container hoặc restart toàn bộ engine để tránh ảnh hưởng dự án khác.

Vì chưa có DB thử sẵn sàng, chưa chạy lại HTTP/DB hoặc browser lưu–mở/xung đột. Các số DB7/7, HTTP14/14 và ảnh giao diện ngày22 là bằng chứng mốc cũ, không phải kết quả mới cho nút phục hồi. Chưa gọi AI thật, không ghi DB chính hoặc áp dụng migration.

## Việc đặt ra trước vòng runtime (lịch sử)

1. Khi Docker Engine hoạt động: xác nhận đúng container/cổng/DB thử theo hồ sơ bàn giao; chạy server thử từ bản dựng hiện tại và suite HTTP mới. Không seed/reset DB chính.
2. Trên dữ liệu giả: hai phiên sửa, xung đột → giữ nháp riêng/mở server → mở lại nháp thành đề mới; thử sửa trong lúc tải, lỗi bộ nhớ, logout/chuyển tài khoản và thu hồi quyền khi đang mở.
3. CV010/049/050 vẫn mở tới khi đủ ca; thao tác mở server này là lựa chọn phục hồi, chưa phải công cụ đối chiếu/ghép từng phần. Cần tiếp tục rà tài khoản kỳ vọng ở panel cộng tác/góp ý/lịch sử, không mặc nhiên coi việc sửa poll là đã phủ mọi endpoint/UI.

## Kết quả runtime sau khi tiếp tục

- DB thử duy nhất: `examcraft_test_20261022`; không seed/reset hoặc ghi DB chính, không đụng container dự án khác. Integration7/7 gồm round-trip7dạng, ghi lặp, quyền tham chiếu/chủ sở hữu, CAS đồng thời, rollback và từ chối ghi không đổi dữ liệu. Xem [integration_s1.json](../rebuild-2026-10-22/integration_s1.json), mốc checkedAt23/10.
- Browser: hai tab cùng tài khoản, dừng máy chủ QA để mô phỏng lỗi kết nối; mỗi tab sửa khác nhau. Nối lại, B lưu được, A nhận xung đột và vẫn giữ nội dung riêng. Mở bản máy chủ giữ nháp A; nháp A được mở thành đề mới, lưu ID riêng và giữ lời giải; tải lại đề gốc vẫn là nội dung B. [Xung đột](conflict-preserved.png), [bản phục hồi đã lưu](recovered-as-new.png).
- Đây là hai tab cùng ngữ cảnh trình duyệt, chưa phải hai trình duyệt độc lập/hai giáo viên. Dừng server chưa tương đương kiểm offline đầy đủ, đóng/mở browser hoặc mọi race khi quyền bị thu hồi. CV010/049/050 tiếp tục mở.

## Bổ sung tài khoản và đăng xuất

- Panel cộng tác gửi tài khoản kỳ vọng khi đọc/cấp/thu hồi quyền, đọc/gửi góp ý, đọc/khôi phục lịch sử. Ba nhóm API kiểm trước thao tác DB; sai tài khoản trả409 ACCOUNT_CHANGED. Panel được tạo lại theo đề/tài khoản và bỏ kết quả tải ban đầu sau khi unmount.
- HTTP bổ sung7yêu cầu sai tài khoản trên ba nhóm endpoint, kiểm không tạo góp ý/đổi quyền; gửi góp ý đúng tài khoản vẫn thành công và ghi đúng tác giả. Không tăng số test cha chỉ vì thêm assertion.
- Trước đây Header bỏ qua lỗi đăng xuất rồi vẫn chuyển trang. Nay chỉ chuyển khi server trả thành công; lỗi mạng/HTTP/JSON/ack báo rõ và giữ giao diện. API đăng xuất kiểm tài khoản kỳ vọng để tab cũ không thu hồi phiên tài khoản mới. Trang admin dùng cùng helper; Header chặn bấm lặp trong lúc gửi.
- SAFE bổ sung2ca logout gồm lỗi mạng/HTTP/ack không hợp lệ và truyền tài khoản kỳ vọng. HTTP logout bổ sung từ chối tab sai tài khoản, xác minh phiên mới còn dùng được rồi mới thử logout đúng.
- Giới hạn lint: file test auth có các `any` của fixture cũ; lint toàn repo chưa sạch. Không suy lint toàn dự án từ lint định hướng các file thay đổi.

## Kết quả cuối đợt

Build cuối44trang và TypeScript đạt (buildId `KHJx_jM0NuQ_FZlOZZScv`), SAFE20+105đạt, HTTP14/14đạt với assertion mới; lint5file được liệt kê trong verification.json đạt. Bản dựng đầu vướng EPERM tạo thư mục .next trong sandbox, chạy lại với quyền phù hợp đã đạt; không đổi cấu hình ứng dụng để né lỗi.

Browser trên bản dựng cuối đã thử dừng riêng server QA: logout báo lỗi và giữ bàn soạn, nối lại rồi logout thành công. Đăng nhập tài khoản giả thứ hai: tab cũ khóa sửa nhưng giữ nội dung; logout ở tab cũ bị chặn, tài khoản thứ hai tải lại kho vẫn đăng nhập và không thấy nháp tài khoản trước. [Lỗi kết nối](logout-offline.png), [chặn tab cũ](stale-account-blocked.png), [chi tiết ca và giới hạn](browser-recovery.json). Tab cũ có thể khóa từ khoảng đã logout trước khi đăng nhập lại; assertion GET ACCOUNT_CHANGED được kiểm riêng bằng HTTP, không suy từ ảnh.

Đã dừng server QA cuối đợt; Docker/container giữ nguyên. Tiếp theo là các ca độc lập/race và dữ liệu cũ/asset ở CV010/011/014/015/049/050. Chưa kiểm AI thật, chưa có nghiệm thu chuyên môn toàn môn/lớp hoặc production/rekey. Không đóng các CV đang mở chỉ từ số PASS.
