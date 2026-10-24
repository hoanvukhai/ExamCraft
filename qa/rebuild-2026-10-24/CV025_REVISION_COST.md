# CV025 — chi phí ghi phiên bản mọi câu khi lưu đề (phân tích, chỉ đọc)

24/10/2026, Claude (chỉ đạo). Đọc `src/lib/exam-persistence.ts` và các nơi dùng `QuestionRevision`; truy vấn chỉ đọc đếm dòng trên DB thử và DB chính. Không sửa mã, không chạy test.

## 1. Hiện trạng
Mỗi lần lưu đề bằng `document` (tự lưu sau ~0,9 giây ngừng gõ), `writeDocumentQuestions` ([exam-persistence.ts:48](../../src/lib/exam-persistence.ts)) làm với **mỗi câu**, kể cả câu không đổi: đọc câu, ghi đè câu (tăng `version`), tạo một `QuestionRevision` chứa bản chụp đầy đủ của dòng (kèm hình), tạo lại dòng `ExamQuestion`. Ngoài ra mỗi lần lưu còn một `ExamRevision` chứa toàn bộ tài liệu.

## 2. Ước lượng (suy từ mã, không đo thời gian)
- Số truy vấn trong một giao dịch ≈ **4N + 10** (N câu): 40 câu ≈ 170, 100 câu ≈ 410. Giao dịch có giới hạn 30 giây; chạy trên DB cùng máy thì chấp nhận được, trên DB từ xa sẽ chậm rõ.
- Số dòng lịch sử câu sinh ra mỗi phút = N × số lần lưu mỗi phút. Với 40 câu và 10–20 lần lưu/phút khi đang soạn: **400–800 dòng/phút**, vài chục nghìn dòng mỗi giờ soạn. Mỗi dòng nén khoảng 1,3KB cho câu chữ; câu có hình dạng data-URL lặp lại cả ảnh ở mọi dòng.
- Hệ quả khác: `version` của câu tăng theo số lần lưu chứ không theo số lần sửa, và danh sách lịch sử câu (`/api/questions/[id]/revisions`) đầy các dòng "Lưu trong đề …" giống hệt nhau, che mất những lần sửa thật.

## 3. Số đo thực có
| DB | Dòng lịch sử câu | Từ lưu đề | Giống hệt dòng liền trước | Dung lượng |
|---|---|---|---|---|
| Thử | 116 | 116 | **67 (58%)** | 147 kB, tối đa 1,7 kB/dòng |
| Chính | 0 | 0 | — | — |
`ExamRevision`: 161 dòng, 146 kB (DB thử); 0 (DB chính). Đây là dữ liệu QA nhỏ, không đại diện cho dùng thật; nó chỉ cho thấy hơn một nửa dòng là lặp. DB chính chưa có dữ liệu để đo.

## 4. Đề xuất thiết kế (không migration)
1. Tải các câu đã có của đề bằng **một** truy vấn `findMany` theo danh sách ID thay vì N lần `findUnique`.
2. Với mỗi câu, so sánh dữ liệu sắp ghi với dòng hiện có bằng một hàm thuần `questionRowChanged(existing, data)`: so mọi trường mà `questionToDatabase` ghi (môn, lớp, loại, mức, nội dung, hình, payload, lời giải, điểm, chủ đề, thẻ, nguồn, giấy phép, cờ AI, trạng thái xóa mềm) sau khi chuẩn hóa: khóa JSON sắp xếp (PostgreSQL JSONB đổi thứ tự khóa), `Decimal` về số, `undefined` ≡ `null`. Giống cách `createExam` đã so (`comparable`).
3. Câu **không đổi**: không cập nhật, không tạo dòng lịch sử, giữ `version`. Câu **đổi**: cập nhật + đúng một dòng lịch sử (như nay). Câu **mới**: tạo bằng `createMany` (câu và lịch sử tạo hàng loạt).
4. `ExamQuestion`: xóa các dòng thừa rồi `createMany` một lần (hoặc chỉ ghi khác biệt vị trí/phần/điểm ghi đè), thay vì N lần `create`.
5. Kết quả mong đợi: số truy vấn ≈ 6 + 2 × (số câu đổi); dòng lịch sử mỗi lần lưu bằng số câu thật sự đổi (thường 0–2).

## 5. Rủi ro và cách chặn
- **Bỏ sót thay đổi** (nghiêm trọng, mất dữ liệu): hàm so sánh phải liệt kê cùng danh sách trường với bước ghi; có test "đổi riêng từng trường → phải được ghi", gồm hình, điểm 0, `accepted_answers`, hướng dẫn chấm, `sub_questions.isCorrect`, `matchingPairs`, `correctOrder`. Khi nghi ngờ thì coi là đổi (ghi), không bỏ qua.
- **Báo thay đổi giả** (chỉ tốn thêm dòng): do thứ tự khóa, `Decimal`, `undefined`/`null`; có test lưu lại hai lần liên tiếp phải ra 0 dòng mới.
- Khôi phục câu bị xóa mềm (`deletedAt`) vẫn phải ghi; kiểm quyền chủ sở hữu giữ nguyên (`existing.ownerId`).
- Không dọn các dòng lặp đã có: lịch sử là bằng chứng, chỉ ngừng sinh thêm. Không đổi thao tác "khôi phục từ phiên bản" ở `question-history.ts`.
- Việc ngoài phạm vi này nhưng đáng đo: `ExamRevision` lưu toàn bộ tài liệu (kể cả ảnh) mỗi lần lưu. Có thể bỏ qua khi tài liệu giống hệt bản liền trước (một truy vấn so sánh trong cùng giao dịch); chưa làm vì cần quyết định về "mỗi version một bản chụp" (khóa duy nhất theo `examId, version`).

## 6. Kế hoạch kiểm khi làm (cho Codex, sau bộ kiểm pilot)
1. Unit cho `questionRowChanged` (từng trường, key order, Decimal, null/undefined).
2. HTTP trên DB thử: lưu cùng một tài liệu hai lần → số dòng `QuestionRevision` và `version` câu không đổi, `ExamRevision` vẫn tăng như cũ; đổi lời giải của đúng một câu → đúng một dòng mới, câu khác không đổi; chèn/đổi thứ tự câu → vị trí đúng, không dòng lịch sử.
3. Đo trước/sau: thời gian một lần lưu đề 40 câu có hình và số truy vấn (bật log truy vấn Prisma trên DB thử), ghi vào báo cáo nhóm.
4. Hồi quy: `persistence_permissions`, `question_history`, `http_workflows` phải giữ nguyên kết quả.

## 7. Ưu tiên
P1, không chặn pilot (DB nhỏ, một giáo viên). Nên làm trước khi nhiều người soạn dài hoặc đề nhiều ảnh (CV074 đo tải). Công ước lượng cho Codex: nửa ngày đến một ngày gồm test.
