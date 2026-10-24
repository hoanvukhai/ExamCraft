# BÁO CÁO ĐÁNH GIÁ ĐỘC LẬP: ĐỘI REV (INDEPENDENT REVIEWER / DEVIL'S ADVOCATE)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: REV (Independent Reviewer)
- **Nhiệm vụ**: Tái hiện độc lập các lỗi Critical/High; phản biện và kiểm tra ngẫu nhiên ≥ 20% các ca kiểm thử đạt (PASS); thực hiện hồi quy hệ thống.

---

## 1. TÁI HIỆN ĐỘC LẬP CÁC LỖI CRITICAL & HIGH

### 1.1 [CRITICAL] R6 — Rò rỉ đề thi và đáp án qua route cũ `/api/cloud/exams/[id]`
- **Tái hiện độc lập**: REV kiểm tra file `src/app/api/cloud/exams/[id]/route.ts`. Hàm `GET` gọi `getCloudExamById(id)` đọc từ `data/cloud_exams.json` mà hoàn toàn không có kiểm tra session hay lọc đáp án.
- **Xác nhận**: **LỖI TỒN TẠI THẬT (REPRODUCED 2/2)**. Bất kỳ ai gửi request đều nhận trọn vẹn trường `correct` và `solution`.

### 1.2 [CRITICAL] R22 — Mất trắng hình vẽ đồ thị và bảng biến thiên khi xuất Word
- **Tái hiện độc lập**: REV kiểm tra toàn bộ mã nguồn `src/lib/docx-export.ts`. Không hề có bất kỳ lệnh nào trích xuất `q.figures` hay chèn `ImageRun`.
- **Xác nhận**: **LỖI TỒN TẠI THẬT (REPRODUCED 2/2)**. Đồ thị Canvas và bảng biến thiên chỉ hiển thị trên Web, bị mất 100% trong file `.docx` tải về.

### 1.3 [HIGH] R2 — Lệnh `npm test` trong `package.json` trỏ sai file
- **Tái hiện độc lập**: Chạy lệnh `npm test` trong terminal.
- **Kết quả thực tế**: Chỉ chạy `tests/unit_tests.mjs` với 20 ca test cũ, bỏ qua toàn bộ 43 test tích hợp v3.1 trong `tests/run_all_v3_tests.ts`.
- **Xác nhận**: **LỖI TỒN TẠI THẬT (REPRODUCED 2/2)**.

### 1.4 [HIGH] 16.3 — Thiếu hoàn toàn CI GitHub Actions
- **Tái hiện độc lập**: Kiểm tra thư mục `.github/workflows`.
- **Kết quả thực tế**: Thư mục không tồn tại.
- **Xác nhận**: **THIẾU SÓT THỰC TẾ (REPRODUCED 2/2)**.

---

## 2. KIỂM TRA CHÉO NGẪU NHIÊN ≥ 20% CÁC CA KIỂM THỬ ĐẠT (PASS SAMPLES)

REV đã chọn ngẫu nhiên 7 ca test PASS của các squad để kiểm tra lại:
1. **Mật khẩu & Session Auth (AUTH)**: Băm bcryptjs salt 10, cookie HttpOnly. $\rightarrow$ **XÁC NHẬN PASS**.
2. **Bảo vệ chống IDOR (AUTH/API)**: Teacher B gọi câu hỏi của Teacher A bị chặn 403. $\rightarrow$ **XÁC NHẬN PASS**.
3. **Bản chụp bất biến Snapshot (DB/ROOM)**: Sửa/xóa câu hỏi gốc không đổi snapshot. $\rightarrow$ **XÁC NHẬN PASS**.
4. **Barem lũy tiến Đúng/Sai 0.1, 0.25, 0.5, 1.0 (LOG)**: Chấm điểm lũy tiến chính xác 100%. $\rightarrow$ **XÁC NHẬN PASS**.
5. **Chuẩn hóa chuỗi số trả lời ngắn (LOG)**: Dấu phẩy, dấu chấm, phân số, khoảng trắng. $\rightarrow$ **XÁC NHẬN PASS**.
6. **Bảo vệ CSV Formula Injection (MON)**: Chèn `'` vào trước ký tự nguy hiểm. $\rightarrow$ **XÁC NHẬN PASS**.
7. **Thử tải 100 học sinh ảo nộp bài (PERF)**: 100/100 nộp thành công trong 82 ms. $\rightarrow$ **XÁC NHẬN PASS**.

---

## 3. KIỂM ĐỊNH HỒI QUY (LINT & BUILD)
- **Kiểm tra Build Production**: `npm run build` biên dịch 34 routes thành công với 0 lỗi.
- **Kiểm tra Lint**: `npm run lint` phát hiện 121 lỗi cảnh báo TypeScript `any` và React 19 `useEffect set-state`. Cần làm sạch trước khi phát hành phiên bản chính thức.
