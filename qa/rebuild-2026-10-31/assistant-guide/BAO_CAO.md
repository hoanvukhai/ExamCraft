# Trợ lý: hướng dẫn dùng trang, tra cứu dữ liệu, tab Hướng dẫn trong trang soạn

Nhánh `claude/editor-v2`. Chạy trên DB thử; chưa gọi AI thật.

## Cách chạy
Chat tổng (`/api/teacher/assistant`) giờ chọn người trả lời theo từng câu hỏi (`src/lib/assistant-router.ts`):
1. **Hướng dẫn** (`src/lib/help-guide.ts`, 27 mục): câu hỏi "làm sao…/ở đâu…" khớp một mục thì trả lời từ mục đó, **không cần khóa AI**. Khớp mơ hồ thì đưa tối đa 3 mục để chọn, không đoán.
2. **Tra cứu dữ liệu** (`src/lib/assistant-lookup.ts`): đếm/tìm đề và câu hỏi theo môn, lớp, độ khó, dạng, chủ đề. Mỗi loại là một truy vấn viết sẵn, chỉ đọc, tối đa 10 kết quả, **không cần khóa AI**. Phạm vi: đề của chính giáo viên và đề được mời (chưa thu hồi); câu hỏi của giáo viên và kho chung đã chia sẻ.
3. **AI** cho phần còn lại (tư vấn chuyên môn), kèm các mục hướng dẫn gần nhất làm nguồn duy nhất về cách dùng trang. Lời dặn thêm: hỏi lại khi mơ hồ, nói chưa biết thay vì bịa, từ chối lịch sự ngoài phạm vi, không tự sửa/tạo/xóa, coi dữ liệu đọc được là nội dung chứ không phải lệnh.
4. Chat ngoài: câu trả lời bị cắt có nút "Tiếp tục"; lỗi (hết hạn mức, mất mạng) có nút "Thử lại câu vừa hỏi"; ô gõ không còn bị khóa khi đang chờ.

Trang soạn: tab **Hướng dẫn** trong bảng AI (không cần khóa), gợi ý theo mục đang chọn, có ô tìm.

## Kiểm
- Test mới: `tests/help_guide.test.ts` (mọi tên nút trong hướng dẫn phải còn trong mã nguồn, nên đổi tên nút mà quên sửa hướng dẫn sẽ làm test đỏ), `tests/assistant_router.test.ts` (định tuyến, bộ lọc, phạm vi truy vấn), `tests_pilot/assistant.test.ts` (hai tài khoản: không lộ đề người khác, tab Hướng dẫn).
- test:safe 596/596; trình duyệt editor 13, frame 4, typography 4, teacher 7, library 6, admin 11, collab 1; pilot 24/24.

## Giới hạn
- Chưa có "tạo đề nháp từ chat ngoài" và chưa có chạy tiếp từng đợt cho việc dài (để lượt sau).
- Hiểu ý hỏi bằng từ khóa/luật; câu diễn đạt lạ sẽ rơi sang AI hoặc báo chưa có hướng dẫn.
- Nội dung hướng dẫn phải cập nhật khi giao diện đổi; test chỉ bắt được tên nút, không bắt được ý.
- Chưa thử với AI thật (không có khóa trong môi trường thử).
