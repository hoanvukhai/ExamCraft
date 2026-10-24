# BÁO CÁO KIỂM TOÁN LIÊN KẾT TÀI LIỆU HIỆN HÀNH (GEMINI DOC LINKS AUDIT)

- **Người thực hiện:** Gemini (QA Tài liệu / Phối hợp đa AI)
- **Nhiệm vụ:** `G02` thuộc `GEMINI-CONTINUOUS-BATCH` (Generation 5, `ASSIGNMENTS.json`)
- **Thời điểm rà soát (UTC):** 2026-10-24T13:16:00Z
- **Baseline đối chiếu:** `bb14bee` (nhánh `rebuild/2026-10-local`)
- **Phạm vi kiểm tra:**
  * 8 tài liệu hiện hành cốt lõi: `docs/ban-giao/00_DOC_TRUOC.md`, `01_BAN_DO_MA_NGUON.md`, `02_TRANG_THAI_TIEP_NOI.md`, `docs/ke-hoach-2026-10-21/03_CHECKLIST.md`, `docs/TIEN_DO_CAI_TIEN_EXAMCRAFT.md`, `docs/phoi-hop-ai/00_CACH_DUNG.md`, `02_QUY_UOC_PHOI_HOP.md`, `03_HANG_DOI_LIEN_MACH.md`.
  * Các tài liệu vệ tinh được trỏ tới: `docs/ke-hoach-2026-10-21/*.md`, `docs/nghien-cuu/*.md`, `docs/lich-su/*.md`, `qa/ai-review/*.md`.
- **Nguyên tắc:** Sử dụng kiểm tra tĩnh đường dẫn tương đối (với `LiteralPath` để tránh lỗi ký tự đại diện `[id]`); không tự ý sửa đổi hồ sơ chung/lịch sử; không kiểm tra mạng ngoài (URL ngoài ghi nhận là *Chưa kiểm web*).

---

## I. TỔNG QUAN KẾT QUẢ RÀ SOÁT

| Nhóm tài liệu | Số liên kết kiểm tra | Liên kết tương đối hợp lệ | Liên kết hỏng (Broken) | Đường dẫn máy / file:/// |
| :--- | :--- | :--- | :--- | :--- |
| **8 tài liệu bàn giao cốt lõi** | 179 | 179 (100%) | 0 | 0 |
| **Kho nghiên cứu (`docs/nghien-cuu/`)** | 68 | 68 (100%) | 0 | 0 |
| **Hồ sơ lưu trữ lịch sử (`docs/lich-su/`)** | 35 | 27 | 8 (Lệch cấp thư mục) | 0 |
| **Báo cáo chuẩn bị ban đầu (`docs/`)** | 42 | 22 | 0 | 20 (Đường dẫn máy cục bộ) |
| **Báo cáo QA AI (`qa/ai-review/`)** | 56 | 32 | 0 | 24 (file:/// URI) |

---

## II. DANH SÁCH CHI TIẾT CÁC VẤN ĐỀ LIÊN KẾT PHÁT HIỆN

### 1. Nhóm A — Liên kết tương đối bị lệch cấp thư mục (Broken Relative Links)
Các liên kết trong tệp lịch sử bị thiếu một cấp `../` khi chuyển tệp từ thư mục gốc `docs/` vào thư mục con `docs/lich-su/`.

| Tệp chứa link | Văn bản hiển thị | Đường dẫn nguyên văn trong tệp | Trạng thái kiểm tra | Đích thực tế đề xuất sửa |
| :--- | :--- | :--- | :--- | :--- |
| `docs/lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md` | Báo cáo | `../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md` | ❌ Không tồn tại | `../../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md` |
| `docs/lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md` | Chấm tay | `../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md` | ❌ Không tồn tại | `../../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md` |
| `docs/lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md` | đọc chi tiết | `../qa/rebuild-2026-10-23/TEACHER_DETAIL_REVIEW.md` | ❌ Không tồn tại | `../../qa/rebuild-2026-10-23/TEACHER_DETAIL_REVIEW.md` |
| `docs/lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md` | Tổng hợp | `../qa/rebuild-2026-10-23/TONG_HOP_DOT_2026-10-24.md` | ❌ Không tồn tại | `../../qa/rebuild-2026-10-23/TONG_HOP_DOT_2026-10-24.md` |
| `docs/lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md` | Báo cáo | `../qa/rebuild-2026-10-24/STUDENT_WRITERS_IMPORT_AND_HISTORY.md` | ❌ Không tồn tại | `../../qa/rebuild-2026-10-24/STUDENT_WRITERS_IMPORT_AND_HISTORY.md` |
| `docs/lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md` | Báo cáo | `../qa/rebuild-2026-10-24/RESTORE_NETWORK_SHARE.md` | ❌ Không tồn tại | `../../qa/rebuild-2026-10-24/RESTORE_NETWORK_SHARE.md` |
| `docs/lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md` | Báo cáo | `../qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md` | ❌ Không tồn tại | `../../qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md` |
| `docs/lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md` | Báo cáo | `../qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md` | ❌ Không tồn tại | `../../qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md` |

---

### 2. Nhóm B — Đường dẫn máy cục bộ tuyệt đối (Absolute Machine Paths)
Các báo cáo phân tích và chuẩn bị giai đoạn ban đầu (21/10/2026) ghi nhận đường dẫn tuyệt đối trên ổ đĩa máy Windows của tác giả hoặc file tạm AI. Các đường dẫn này không thể truy cập được trên các môi trường nhân bản hoặc máy khác.

| Tệp chứa link | Văn bản hiển thị | Đường dẫn nguyên văn | Tính chất & Đánh giá |
| :--- | :--- | :--- | :--- |
| `docs/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md` | File hội thoại TXT | `<F:/Downloads/Xây Dựng Web Soạn Đề AI.txt>` | ⚠️ Đường dẫn máy cá nhân (chỉ có ý nghĩa tham khảo lịch sử) |
| `docs/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md` | 9 liên kết mã nguồn (sửa đề, nút lưu,...) | `F:/Workspace/Zazz/ExamCraft/src/...:line` | ⚠️ Đường dẫn tuyệt đối kèm số dòng cố định; nên chuyển sang đường dẫn tương đối `../src/...` |
| `docs/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md` | Nhật ký AI bản gốc | `<C:/Users/ACER/.codex/attachments/.../Pasted text.txt>` | ⚠️ Tệp đính kèm cục bộ của môi trường Codex cũ |
| `docs/ke-hoach-2026-10-21/05_CHUAN_BI_VA_NGUON.md` | Nhật ký AI bổ sung | `<C:/Users/ACER/.codex/attachments/.../Pasted text.txt>` | ⚠️ Tệp đính kèm cục bộ |

*Lưu ý bảo toàn:* Các tài liệu trên thuộc nhóm hồ sơ chuẩn bị/lịch sử ngày 21/10, theo quy ước không cần sửa đổi làm thay đổi nội dung lưu trữ gốc trừ khi chủ dự án yêu cầu dọn dẹp.

---

### 3. Nhóm C — Scheme `file:///` trong các báo cáo QA AI (`qa/ai-review/`)
Trong các đợt rà soát đầu tiên, các báo cáo được tạo kèm scheme `file:///F:/Workspace/...` theo thói quen định dạng của môi trường trợ lý. Các đường dẫn này giúp nhấp chuột trực tiếp trong IDE nội bộ của máy chủ phát triển, nhưng không hiển thị được liên kết khi duyệt qua giao diện web GitHub.

| Tệp chứa link | Số lượng link `file:///` | Đánh giá & Đề xuất |
| :--- | :--- | :--- |
| `qa/ai-review/GEMINI_UX_REVIEW.md` | 11 | Chuyển thành link tương đối dạng `../../src/...` |
| `qa/ai-review/GEMINI_ACCOUNT_CALLERS.md` | 11 | Chuyển thành link tương đối dạng `../../src/...` |
| `qa/ai-review/GEMINI_PUBLIC_POLICY_CASES.md` | 2 | Chuyển thành link tương đối dạng `../../src/...` |

---

### 4. Nhóm D — Liên kết Web ngoài (External Web Links)
Tất cả các liên kết ra Internet (Google Generative AI, npm packages, văn bản giáo dục BGD) trong các tài liệu hiện hành đều được gắn trạng thái:
- **Trạng thái:** *Chưa kiểm web (Unverified external web)*
- **Lý do:** Tuân thủ triệt để quy định sandbox, không gửi request ra ngoài Internet để kiểm tra trạng thái HTTP 200/404 của máy chủ ngoài.

---

## III. KẾT LUẬN & KIẾN NGHỊ CHO CODEX

1. **8 tài liệu bàn giao cốt lõi** (`00_DOC_TRUOC`, `01_BAN_DO`, `02_TRANG_THAI`, `03_CHECKLIST`, `TIEN_DO_CAI_TIEN`, và 3 file `phoi-hop-ai`) hoàn toàn sạch lỗi, 100% liên kết nội bộ đều trỏ đúng tệp tồn tại.
2. **Kiến nghị duy nhất cần chỉnh sửa (nếu cần dọn tệp lịch sử):**
   Tại `docs/lich-su/TIEN_DO_THONG_BAO_2026-10-22_24.md`, thay thế tiền tố `../qa/` bằng `../../qa/` cho 8 liên kết trỏ tới các báo cáo nghiệm thu đợt 23-24/10.
