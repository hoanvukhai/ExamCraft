# Việc giao cho Gemini (Antigravity): sinh đề theo lời nhắc của ExamCraft

Mục đích: kiểm xem lời nhắc sinh đề của ứng dụng làm AI trả **đúng mẫu** cho từng lớp và từng loại kỳ thi. Không dùng khóa API, không chạy máy chủ, không đụng cổng 3117, không sửa mã ứng dụng.

## Việc phải làm

Trong thư mục này có 25 tệp `*.prompt.json` và `cases.json`. Với **từng** tệp `<mã>.prompt.json`:

1. Đọc `systemInstruction` (quy tắc hệ thống) và `contents` (yêu cầu của giáo viên, dạng JSON).
2. Làm đúng như mô hình mà ứng dụng gọi: theo `systemInstruction`, trả lời cho `contents`. Chỉ trả **một đối tượng JSON** đúng cấu trúc `{title, questions:[...]}`, không giải thích thêm.
3. Lưu JSON đó vào tệp `<mã>.output.json` cùng thư mục (ví dụ `lop3-toan.output.json`). Bọc ```json được, bộ kiểm tra tự bỏ.
4. Mỗi đề soạn riêng, không sao chép đề này sang đề kia, không xem đáp án của các đề khác để làm.

Giữ đúng số câu từng dạng trong `plan` (số 0 là không tạo dạng đó). Công thức viết giữa dấu `$...$`.

## Sau khi sinh xong 25 đề

```bash
node --import tsx scripts/prompt-check.ts check qa/prompt-check-2026-10-26
```

Lệnh ghi `KET_QUA.md` (đạt/không đạt từng đề, kèm lý do). Nếu có đề **không đạt**, không tự sửa tệp kết quả cho đạt. Ghi lại lý do và chạy lại **một lần** với đề đó; lần hai vẫn không đạt thì để nguyên.

## Báo cáo `NHAN_XET.md` (cùng thư mục)

Với mỗi đề, một dòng: loại kỳ thi, có đúng cấp lớp không, độ khó có hợp loại kỳ thi không (chuyển cấp, tuyển sinh, tốt nghiệp, học sinh giỏi, giữa kì, cuối kì), có câu nào sai kiến thức hoặc đáp án sai không (nếu tự thấy). Chỉ ghi điều quan sát được; không khẳng định "đúng chuẩn Bộ". Kết luận cuối: các đề không đạt và lỗi lặp lại của lời nhắc.

## Không được làm

- Không dùng hay tìm khóa API; không gọi dịch vụ ngoài.
- Không sửa `scripts/`, `src/`, `tests/`.
- Không ghi thông tin cá nhân vào báo cáo.
