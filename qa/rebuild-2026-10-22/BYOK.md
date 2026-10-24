# S4 — Khóa AI cá nhân, quota và model

Mốc triển khai và tra nguồn: 22/10/2026. Phù hợp cá nhân/nhóm nhỏ, dùng khóa riêng của từng tài khoản. Không gọi AI thật trong đợt triển khai/test này.

## Căn cứ đã tra lại

- [Google: rate limits](https://ai.google.dev/gemini-api/docs/rate-limits): hạn mức được áp dụng theo project, có nhiều chiều RPM/TPM/RPD và thay đổi theo model/tier. Không thể nhân số khóa với1.500 để suy ra dung lượng.
- [Google: billing](https://ai.google.dev/gemini-api/docs/billing): khóa kế thừa billing/quyền của project; khóa không có gói thanh toán độc lập. Vì vậy cùng một hệ thống BYOK phục vụ cả project miễn phí và bật billing.
- [Google: models](https://ai.google.dev/api/models), [danh mục model](https://ai.google.dev/gemini-api/docs/models): model được liệt kê qua API; ví dụ từ tài liệu không bảo đảm tài khoản hiện tại có quyền sinh nội dung, quota hoặc mức giá tương ứng.

## Đã thay đổi

- Bỏ FREE/PAID hardcode theo tên model và suy luận key miễn phí từ lỗi429. Danh mục ban đầu chỉ là gợi ý được ghi ngày tra; trạng thái tier UNKNOWN. Có thể nhập modelID mới đúng định dạng hoặc đọc danh mục bằng khóa của chính mình.
- Giữ nguyên model người dùng đã chọn. Không tự đổi sang model khác khi404/503; tránh thay chất lượng/chi phí ngoài lựa chọn của giáo viên.
- Bỏ quota 1.500×số khóa. UI hiển thị riêng giới hạn thao tác nội bộ aiDailyLimit theo ngàyUTC; quota/billing của Google là chưa xác định và dẫn về AI Studio.
- Giữ lượt thao tác nội bộ bằng bản ghi102 trong transaction Serializable trước gọi AI, kiểm cả lượt thành công và đang xử lý; retry xung đột tối đa3lần. Đây là giới hạn thao tác của ứng dụng, không phải đo token/giá hoặc quota thực tế của nhà cung cấp.
- executeWithKeyRotation yêu cầu userId hợp lệ cho cả khóa tạm. Kiểm tài khoản hoạt động và yêu cầu đổi mật khẩu; chỉ lấy khóa của đúng chủ tài khoản. Không dùng khóa chung hệ thống.
- Khóa tạm chỉ dùng đúng yêu cầu đó; không âm thầm đổi sang khóa lưu. Các alias customApiKey/userApiKey/apiKey dùng chung bộ chuẩn hóa; nếu có hai giá trị khác nhau thì từ chối.
- Key lưu thử tối đa3khóa của chính tài khoản cho một thao tác. Chỉ chuyển khóa với lỗi429 hoặc lỗi khóa không hợp lệ rõ ràng; không đổi model. Nhiều khóa cùng project vẫn dùng chung giới hạn của project.
- Lỗi400 không tự làm chết khóa; lỗi403 được báo là quyền/project/billing cần kiểm. Chỉ API_KEY_INVALID/EXPIRED rõ ràng mới tắt khóa. Thông báo lỗi không lặp nguyên văn nội dung provider có thể chứa credential.
- Khi đã sinh nội dung thành công nhưng ghi nhật ký lỗi, không gọi provider lần hai. Nhánh cập nhật nhật ký/trạng thái tách khỏi nhánh gọi AI để tránh sinh trùng/tốn phí.
- Nhật ký dùng alias user_key:<id> thay nhãn đổi được; nhãn trùng/đổi tên không gán nhầm lượt mới. Thống kê tổng ngày đếm toàn bộ, không lấy số30 dòng đang hiển thị làm tổng.
- API quản lý khóa requireAuth, ownercheck, kiểm requestorigin và dữ liệu; response chỉ có khóa đã che, không ciphertext/IV/tag hay rawkey. Model lưu phải đúng định dạng, không tuyên bố đã kiểm quyền chỉ vì lưu thành công.
- “Đọc danh mục” dùng models.list với khóa trong header x-goog-api-key, không sinh nội dung. Trả rõ chỉ xác nhận đọc metadata; chưa xác nhận quota/billing/quyền generateContent. Không gắn ACTIVE giả từ một phép thử không tương ứng.
- parse-docx/OCR/tweak-question dùng cùng context đăng nhập và cùng alias khóa. Bỏ nhánh sửa câu mô phỏng nhưng báo thành công khi thiếukey; có giới hạn kích thước upload trước xử lý.
- crypto.ts từ chối mã hóa/giải mã khi thiếu SESSION_SECRET. Giữ nguyênSHA256derivation vàAES-256-GCM để tương thích khóa đã mã hóa bằng secret hiện có; không tự đổi/rotate secret. Secret phải được giữ trong gói sao lưu cấu hình.

## Kiểm thử

- tests/ai_policy.test.ts: 8/8ca đạt, gồm phân loại lỗi, model/key input, quota ứng dụng độc lập sốkey, chặn thiếuusercontext, không gọi lại khi logging lỗi, ownerretrygiữmodel, mã hóa/thiếu secret.
- Tất cả ca dùng fixture và thay thế Prisma trong tiến trình test; không ghiDB hoặc gọi provider thật.
- Kết hợp tại mốc trước thêmretrycase:23/23helperca đạt; hiện ai_policy riêng8/8đạt.
- Compile chung đang chờ điều phối loại thư mục snapshot backups khỏi tậpTypeScript và sửa auto-grader cũ khi field đúng/sai có thể thiếu; chưa lấy lỗi từ snapshot làm lý do sửa bản sao lưu.

## Giới hạn cần ghi rõ

- Chưa kiểm trực tiếp sinh nội dung/billing bằng khóa thật; không tự gọi có phí để kiểm chứng model.
- Các nhật ký cũ ghi theo nhãn không thể phân bổ chắc chắn vào từng khóa khi trùng/đổi tên; thống kê từng khóa mới chỉ đếmalias ổn định. Tổng tài khoản vẫn giữ dữ liệu cũ.
- Nếu tiến trình dừng sau khi giữ lượt, bản ghi102 được giữ đến hết ngàyUTC, theo hướng bảo thủ; chưa có tác vụ tự đoán và hoàn trả lượt có thể đã gọi provider.
- Danh mục model thử đọc tối đa1.000mục và báo hasMoreModels nếu còn trang; không coi model không thấy trong trang đầu là khóa chắc chắn không dùng được.
- Giới hạn thao tác nội bộ không đo số tiền. Muốn giới hạn chi phí phải cấu hình project/billing ở phía nhà cung cấp và xác minh token/giá theo model đang dùng.


## Kiểm compile sau hợp nhất

Sau khi loại snapshot backup khỏi tập compile và sửa grader cũ, tsc --noEmit đã đạt. ai_policy8ca và unit20ca giữ kết quả đạt; cần lấy kết quả runner tổng sau cùng từ báo cáo kiểm thử.
