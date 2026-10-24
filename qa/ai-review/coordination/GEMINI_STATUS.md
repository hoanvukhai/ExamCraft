# GEMINI status
task_id: GEMINI-PILOT-PREP
assignment_generation: 7
state: WAITING_REVIEW
updated_at_utc: 2026-10-24T17:15:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-P9: COMPLETED
  GEM-P10: COMPLETED
  GEM-P11: COMPLETED
  GEM-P12: COMPLETED
  GEM-P5: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-PILOT-PREP (Generation 7) theo chỉ đạo của Claude (ASSIGNMENTS.json, tin nhắn claude-gemini-20261024T160000Z).
  - Hoàn thành GEM-P9 (P0 - Codex đang chờ):
    * Sửa `tests/fixtures/pilot/toan6-bay-dang.json`: Thay thế placeholder bằng ảnh PNG dataURL hợp lệ (< 3KB < 20KB limit, 300x180 px) tại `figures[0].data.url`, đảm bảo `prepareExportFigures` và xuất Word có ảnh trơn tru.
    * Xác nhận `tests/fixtures/pilot/mon2-ngu-lieu.json`: Ngữ liệu dùng chung `pas-van6-dong-song` có 5 câu hỏi đọc hiểu cùng liên kết `passageId`.
    * Cập nhật `tests/fixtures/pilot/README.md`: Đính chính đường dẫn giao bài thành `POST /api/assignments` (loại bỏ route không tồn tại `/api/exams/:id/assign`), ghi rõ cấu trúc payload chuẩn và lưu ý không phải bộ đề thẩm định chuyên môn.
  - Hoàn thành GEM-P10 (P0):
    * Cập nhật `docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md` và `docs/huong-dan/THE_KIEM_TAY_PILOT.md` cho các tính năng mới đã tích hợp:
      1. Khung xem A4 chế độ "Song song" (`src/components/A4Preview.tsx:127`, bố cục 2 cột, tiêu đề `ĐỀ VÀ ĐÁP ÁN SONG SONG`, chú thích giáo viên, Word xuất bố cục chuẩn `all`).
      2. Nút "Tạo bản sao để sửa" trên trang chia sẻ (`src/app/share/[id]/page.tsx:190`, chỉ khi `allowCopy = true`, đã đăng nhập tài khoản giáo viên, chỉ mang theo đáp án nếu link chia sẻ cho phép hiện đáp án).
      3. Khối "Tùy chọn nâng cao: giờ mở/đóng, số lượt, mã vào bài" (`src/components/ShareModal.tsx:479-499`, giờ mở/đóng, số lượt 1-10, mã vào bài 4-12 ký tự, trộn câu hỏi/đáp án, PIN lớp).
      4. Dòng theo dõi thông số đợt thi tại trang quản lý bài giao (`src/app/teacher/assignments/[id]/page.tsx:507`: `Mở: ... · Đóng: ... · Số lượt: ... · Mã vào bài: ... (giờ theo máy này)`), huy hiệu `Đang Mở` / `Đã Đóng` và nút toggle `Đóng bài thi` / `Mở lại bài thi`.
  - Hoàn thành GEM-P11 (P1):
    * Xây dựng phiếu phản hồi giáo viên thử nghiệm và bảng ghi nhận sự cố tại `docs/huong-dan/PHIEU_PHAN_HOI_PILOT.md`.
    * Gồm 3 phần: Thông tin chung, Khảo sát trải nghiệm chi tiết bám sát 8 luồng F1–F8 (thang điểm 1-5, câu hỏi mở), và Bảng ghi nhận sự cố kỹ thuật (Bug Log: STT, thời điểm, màn hình/luồng, mức độ nghiêm trọng Blocker/High/Medium/Low, mô tả, các bước tái hiện, ảnh đính kèm).
    * Tuân thủ nghiêm ngặt quy tắc bảo vệ dữ liệu: Tuyệt đối không thu thập dữ liệu cá nhân (PII) của học sinh.
  - Hoàn thành GEM-P12 (P1):
    * Bàn giao 2 bảng đối chiếu nguồn và số trang trích dẫn:
      1. `docs/nghien-cuu/goi/PILOT-TOAN-6/02_DOI_CHIEU_NGUON.md` (Toán 6, bộ KNTT tập 1, mã `NXB-0014`, đối chiếu Sổ 05 và các QĐ 3588, QĐ 185, TT 89 trong thư mục `nguon/`).
      2. `docs/nghien-cuu/goi/PILOT-MON-2/02_DOI_CHIEU_NGUON.md` (Ngữ văn 11, bộ KNTT tập 1, mã `NXB-0028`, đối chiếu CV 3175, TT 32, TT 22).
    * Các mục kiểm tra vật lý sách in và toàn văn 123 trang/110 trang CT được ghi rõ nhãn `CHUA_XAC_MINH` theo đúng nguyên tắc trung thực.
  - Mục GEM-P5 (CV011): Đã hoàn thành từ Generation 6 tại `qa/ai-review/GEMINI_ACCOUNT_CALLERS.md` (trạng thái PENDING trong BATCH_REVIEWS).
Đang làm:
  - Hoàn tất toàn bộ 4/4 mục mới giao (GEM-P9, GEM-P10, GEM-P11, GEM-P12) cùng GEM-P5 của Generation 7.
Tiếp theo:
  - Chờ Người chỉ đạo Claude thẩm định và nghiệm thu kết quả bàn giao tại BATCH_REVIEWS.json.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã, checklist 03, hồ sơ 02, ASSIGNMENTS hay BATCH_REVIEWS.
Tệp giao trong batch:
  - tests/fixtures/pilot/toan6-bay-dang.json (GEM-P9) [ĐÃ CẬP NHẬT]
  - tests/fixtures/pilot/mon2-ngu-lieu.json (GEM-P9) [ĐÃ CẬP NHẬT]
  - tests/fixtures/pilot/README.md (GEM-P9) [ĐÃ CẬP NHẬT]
  - docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md (GEM-P10) [ĐÃ CẬP NHẬT]
  - docs/huong-dan/THE_KIEM_TAY_PILOT.md (GEM-P10) [ĐÃ CẬP NHẬT]
  - docs/huong-dan/PHIEU_PHAN_HOI_PILOT.md (GEM-P11) [ĐÃ BÀN GIAO]
  - docs/nghien-cuu/goi/PILOT-TOAN-6/02_DOI_CHIEU_NGUON.md (GEM-P12) [ĐÃ BÀN GIAO]
  - docs/nghien-cuu/goi/PILOT-MON-2/02_DOI_CHIEU_NGUON.md (GEM-P12) [ĐÃ BÀN GIAO]
  - qa/ai-review/GEMINI_ACCOUNT_CALLERS.md (GEM-P5) [ĐÃ BÀN GIAO]
Chặn việc: Không. Chờ Người chỉ đạo Claude review.
