# MA TRẬN TRUY VẾT YÊU CẦU & KIỂM THỬ (REQUIREMENTS TRACEABILITY MATRIX)

- **Mục tiêu**: Đảm bảo 100% trong số 13 phân hệ tính năng được tuyên bố đều có ít nhất một kịch bản kiểm thử độc lập đối ứng.

---

## BẢNG TRUY VẾT 13 PHÂN HỆ TÍNH NĂNG

| STT | Phân Hệ Tính Năng (Tuyên Bố) | Vai Phụ Trách | Mã Test Case Dự Kiến | Trạng Thái Kiểm Thử | Ghi Chú & Bằng Chứng |
|---|---|---|---|---|---|
| **1** | **Trợ lý AI Copilot & Điều phối 7 Gemini Keys** (Least used, cooldown, log, quota) | AIP | `TC-AIP-001` $\rightarrow$ `005` | `PENDING` | Kiểm tra chọn key, cập nhật `AiKeyState`, quota ngày |
| **2** | **Đồ thị Canvas 2D & Bảng biến thiên 3 dòng** (Tiệm cận, vạch chia, bảo toàn hình) | EXP / FE | `TC-EXP-001` $\rightarrow$ `003` | `PENDING` | Kiểm tra render Canvas, tiệm cận, bảng biến thiên |
| **3** | **Quản lý Ngân hàng câu hỏi & Revisions & Fork** (Diff, rollback, fork bảo toàn tác giả, khóa câu web) | BANK | `TC-BANK-001` $\rightarrow$ `005` | `PENDING` | Kiểm tra revision diff, fork câu SHARED, chặn câu IMPORTED_WEB |
| **4** | **Trộn đề & Hoán vị 4 mã đề** (Fisher-Yates, đổi lời giải chi tiết, ma trận đáp án) | LOG | `TC-LOG-001` $\rightarrow$ `003` | `PENDING` | Kiểm tra trộn 4 mã đề, tái lập theo seed, ma trận đối soát |
| **5** | **Quản lý Lớp học & Học sinh (Zero-account)** (Dán nhiều dòng, sinh groupCode, không cần tài khoản) | ROOM / DB | `TC-ROOM-001` $\rightarrow$ `003` | `PENDING` | Kiểm tra dán tên từ Excel, mã lớp, hiển thị danh sách |
| **6** | **Giao bài & Bản chụp bất biến (Assignment Snapshot)** (3 presets, snapshot bất biến khi sửa câu gốc) | ROOM / DB | `TC-ROOM-004` $\rightarrow$ `006` | `PENDING` | Kiểm tra 3 presets, sửa câu gốc snapshot không đổi |
| **7** | **Phòng thi học sinh trực tuyến** (`/a/*`, Server timer, auto-save 15s, nộp idempotent, che giấu đáp án) | ROOM / SEC | `TC-ROOM-007` $\rightarrow$ `012` | `PENDING` | Kiểm tra server timer, auto-save draft, nộp chống bấm đúp, sanitize |
| **8** | **Chấm điểm tự động Server-Authoritative** (Phần I, Phần II lũy tiến 0.1-0.25-0.5-1.0, Phần III chuẩn hóa số) | LOG | `TC-LOG-004` $\rightarrow$ `008` | `PENDING` | Kiểm tra barem lũy tiến Bộ GD&ĐT, chuẩn hóa phân số/thập phân |
| **9** | **Màn hình giám sát giáo viên thời gian thực** (Polling 4s, phổ điểm, Item Analysis < 50%, chấm tay tự luận) | MON | `TC-MON-001` $\rightarrow$ `005` | `PENDING` | Kiểm tra cập nhật 4s, cảnh báo Item Analysis, chấm tay tự luận |
| **10** | **Xuất bảng điểm CSV an toàn** (UTF-8 BOM hiển thị tiếng Việt, escape formula injection) | MON / SEC | `TC-MON-006` $\rightarrow$ `007` | `PENDING` | Kiểm tra BOM `\uFEFF`, chống tiêm công thức `=cmd\|...` |
| **11** | **Xuất file Word .docx & Phân trang A4** (50+ công thức OMML, chống nhảy trang `keepNext`, tiêu đề chuẩn) | EXP | `TC-EXP-004` $\rightarrow$ `008` | `PENDING` | Kiểm tra cấu trúc OMML Math, thuộc tính `keepNext`, in A4 |
| **12** | **An ninh bảo mật & Kiểm soát quyền** (Session HttpOnly SameSite, lockout 5 lần, IDOR, Top & Me an toàn) | AUTH / SEC | `TC-SEC-001` $\rightarrow$ `006` | `PENDING` | Kiểm tra lockout 5 lần, chặn IDOR, kiểm tra Top & Me |
| **13** | **Sao lưu & Khôi phục tự động CSDL** (Kịch bản pg_dump PowerShell/Bash, khôi phục DB sạch) | OPS | `TC-OPS-001` $\rightarrow$ `003` | `PENDING` | Chạy thực tế backup và restore trên database QA |
