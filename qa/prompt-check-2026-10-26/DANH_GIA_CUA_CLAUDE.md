# Đánh giá của Claude về lượt kiểm lời nhắc sinh đề (26/10/2026)

## Kết quả
- Tôi chạy lại `node --import tsx scripts/prompt-check.ts check qa/prompt-check-2026-10-26`: **25/25 đề được bộ kiểm tra của ứng dụng nhận** (đúng số câu từng dạng, đủ phương án, có đáp án).
- Tôi tự giải 4 đề toán (lớp 6, lớp 9, lớp 12, chuyển cấp vào 6): mọi đáp án trắc nghiệm, đúng/sai và trả lời ngắn đều đúng.
- `NHAN_XET.md` do chính Gemini sinh đề rồi tự nhận xét, nên chỉ tính là ý kiến tham khảo. Chưa có giáo viên đúng cấp xem; không dùng làm bằng chứng chuyên môn, nhất là đề học sinh giỏi, tuyển sinh, tốt nghiệp.

## Lỗi tìm thấy: đáp án đúng dồn vào A
- 99/101 câu trắc nghiệm có đáp án A; 21/23 đề mà mọi câu đều là A. Học sinh chỉ cần chọn A là đúng gần hết.
- Đây là xu hướng của mô hình sinh, không do bộ kiểm tra. Bản chạy bằng Gemini thật trên API chưa được đo riêng, nên chưa biết mức độ tương tự; sửa chung cho cả hai.
- **Đã sửa:** `src/lib/choice-balance.ts` xáo vị trí đáp án đúng sau khi sinh (đáp án đi theo nội dung, chữ cái đổi theo). Câu có phương án kiểu "Cả A và B" hoặc lời giải nhắc tên chữ cái đáp án thì giữ nguyên (khoảng 5/101 câu). Có test `tests/choice_balance.test.ts`.
- Giới hạn: chỉ áp dụng cho đề sinh bằng AI, không đổi đề nhập từ Word. Đáp án số có thể không còn xếp tăng dần sau khi xáo; giáo viên vẫn sửa được.

## Không kiểm được ở lượt này
- Hành vi thật của Gemini qua API (JSON bọc, trường `null`, giới hạn 429): chỉ lộ khi chạy bằng khóa thật. Làm khi hạn mức hồi.
- Độ khó theo kỳ thi và đúng cấu trúc đề chính thức: cần giáo viên đúng cấp.
