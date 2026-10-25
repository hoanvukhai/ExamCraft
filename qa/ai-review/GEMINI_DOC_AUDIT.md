# BÁO CÁO RÀ SOÁT VÀ PHÂN LOẠI CÂY TÀI LIỆU DOCS/ VÀ QA/
*Đề xuất tối ưu cấu trúc tài liệu dự án ExamCraft dành cho Claude (Chủ trì điều phối)*

- **Người thực hiện:** Gemini (QA & Rà soát hồ sơ)
- **Nhiệm vụ:** GEM-R6 (P1, Generation 10)
- **Thời điểm lập (UTC):** 2026-10-25T10:35:00Z
- **Nguyên tắc thực hiện:** Chỉ lập danh mục và bảng đề xuất phân loại cho Claude duyệt; tuyệt đối không tự ý di chuyển hoặc xóa tệp trong không gian dự án.

---

## 1. TỔNG QUAN HIỆN TRẠNG CÂY TÀI LIỆU

Hệ thống tài liệu của ExamCraft hiện có 2 nhánh chính:
1. **docs/**: Chứa hồ sơ bàn giao, kế hoạch gốc 21/10, quy ước phối hợp, hướng dẫn sử dụng, nghiên cứu chương trình và các tài liệu chuyên đề mới tạo.
2. **qa/**: Chứa các báo cáo kiểm toán, nhật ký kiểm thử theo đợt ngày 24/10 và 25/10, cùng hồ sơ phối hợp AI và bộ dữ liệu đề thi mẫu.

### Ba nhóm phân loại đề xuất:
- **GIỮ:** Tài liệu đang phục vụ trực tiếp công tác điều phối, vận hành, kiểm thử hoặc là hồ sơ quy chuẩn của dự án.
- **CHUYỂN_LỊCH_SỬ:** Tài liệu thuộc giai đoạn nghiên cứu ban đầu (trước 22/10) hoặc các bản ghi tiến độ cũ đã được thay thế bởi hồ sơ bàn giao 02. Đề xuất chuyển vào `docs/lich-su/`.
- **GỘP:** Tài liệu có nội dung phân mảnh hoặc trùng lặp với các cẩm nang toàn diện hơn, đề xuất hợp nhất vào một tệp đầu mối duy nhất để tránh phân tâm cho giáo viên và lập trình viên.

---

## 2. BẢNG PHÂN LOẠI CHI TIẾT CÁC TỆP TRONG DOCS/

### A. Nhóm tệp tại thư mục gốc docs/
| Đường dẫn tệp | Phân loại | Tệp đích đề xuất hoặc Lý do |
|---|:---:|---|
| `docs/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md` | CHUYỂN_LỊCH_SỬ | Chuyển sang `docs/lich-su/` (báo cáo phân tích sơ khởi ngày 21/10). |
| `docs/BAO_CAO_TOAN_DIEN_V3.md` | CHUYỂN_LỊCH_SỬ | Chuyển sang `docs/lich-su/` (đã có hồ sơ bàn giao 00 và 02 cập nhật). |
| `docs/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md` | CHUYỂN_LỊCH_SỬ | Chuyển sang `docs/lich-su/`. |
| `docs/BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md` | CHUYỂN_LỊCH_SỬ | Chuyển sang `docs/lich-su/`. |
| `docs/CHECKLIST_TIEN_DO.md` | CHUYỂN_LỊCH_SỬ | Chuyển sang docs/lich-su/ (quy định dự án chỉ dùng 03_CHECKLIST.md). |
| `docs/EXAMCRAFT_THIET_KE_V3.md` | CHUYỂN_LỊCH_SỬ | Chuyển sang `docs/lich-su/` (thiết kế kiến trúc cũ trước khi chốt Next.js 15). |
| `docs/TIEN_DO_CAI_TIEN_EXAMCRAFT.md` | CHUYỂN_LỊCH_SỬ | Chuyển sang `docs/lich-su/`. |

---

### B. Nhóm hồ sơ cốt lõi (docs/ban-giao/ và docs/ke-hoach-2026-10-21/)
| Đường dẫn tệp | Phân loại | Ghi chú vai trò |
|---|:---:|---|
| `docs/ban-giao/00_DOC_TRUOC.md` | GIỮ | Tài liệu nhập môn bắt buộc đọc đầu tiên cho mọi nhân sự/AI. |
| `docs/ban-giao/01_BAN_DO_MA_NGUON.md` | GIỮ | Bản đồ mã nguồn tra cứu nhanh vị trí tệp và chức năng. |
| `docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md` | GIỮ | Bảng trạng thái nối tiếp chính của dự án (chỉ ghi đè dòng hiện trạng). |
| `docs/ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md` | GIỮ | Khởi đầu kế hoạch gốc. |
| `docs/ke-hoach-2026-10-21/01_TONG_KET_DU_AN.md` | GIỮ | Tổng kết bối cảnh dự án. |
| `docs/ke-hoach-2026-10-21/02_LO_TRINH.md` | GIỮ | Lộ trình tổng thể 5 giai đoạn. |
| `docs/ke-hoach-2026-10-21/03_CHECKLIST.md` | GIỮ | Checklist gốc duy nhất; kim chỉ nam tiến độ kỹ thuật. |
| `docs/ke-hoach-2026-10-21/04_NGHIEM_THU.md` | GIỮ | Tiêu chuẩn nghiệm thu chức năng. |
| `docs/ke-hoach-2026-10-21/05_CHUAN_BI_VA_NGUON.md` | GIỮ | Nguồn học liệu và dữ liệu chuẩn bị. |
| `docs/ke-hoach-2026-10-21/06_KHUNG_DU_LIEU.md` | GIỮ | Khung mô hình dữ liệu Prisma và JSON. |
| `docs/ke-hoach-2026-10-21/07_NGHIEN_CUU_VA_PROMPT.md` | GIỮ | Hướng dẫn định dạng prompt. |
| `docs/ke-hoach-2026-10-21/08_HO_SO_TRUOC_KHI_CODE.md` | GIỮ | Ranh giới kỹ thuật trước khi lập trình. |

---

### C. Nhóm phối hợp điều phối (docs/phoi-hop-ai/)
| Đường dẫn tệp | Phân loại | Ghi chú vai trò |
|---|:---:|---|
| `docs/phoi-hop-ai/00_DOC_TRUOC_KHI_PHOI_HOP.md` | GIỮ | Quy tắc nhập cuộc phối hợp AI. |
| `docs/phoi-hop-ai/01_THU_MUC_VA_QUY_TRINH.md` | GIỮ | Cấu trúc thư mục điều phối. |
| `docs/phoi-hop-ai/02_QUY_UOC_PHOI_HOP.md` | GIỮ | Quy ước vai trò cập nhật ngày 24/10 (Claude chỉ đạo, Codex mã, Gemini QA). |
| `docs/phoi-hop-ai/03_CONG_VIEC_AI_REVIEW.md` | GIỮ | Danh mục đầu việc kiểm toán. |
| `docs/phoi-hop-ai/04_MOC_PILOT.md` | GIỮ | Kế hoạch cột mốc chạy thử nghiệm thực tế. |
| `docs/phoi-hop-ai/05_TUYEN_GIAO_VIEN_VA_NGUOI_DUYET.md` | GIỮ | Kế hoạch tuyển giáo viên 6 môn và người duyệt chuyên môn. |

---

### D. Rà soát chuyên sâu các thư mục mới tạo (docs/huong-dan/, docs/bieu-mau/, docs/su-co/, docs/dien-tap/, docs/chuong-trinh-2018/, docs/van-hanh/)

Đây là trọng tâm yêu cầu của Claude nhằm dọn dẹp các tệp bị phân mảnh tạo ra trong các phiên làm việc trước:

1. **Thư mục `docs/huong-dan/`:**
   - `docs/huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md` -> **GIỮ**. Đây là bản cẩm nang giáo viên toàn diện nhất, đã cập nhật toàn bộ nhãn giao diện thực tế và luồng nghiệp vụ ngày 25/10.
   - `docs/huong-dan/HUONG_DAN_HOC_SINH_MOBILE.md` -> **GIỮ**. Bản hướng dẫn học sinh làm bài chuẩn hóa 100% nhãn nút mobile.
   - `docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md` -> **CHUYỂN_LỊCH_SỬ** (hoặc GỘP). Bản này viết cho đợt pilot cũ, nội dung ngắn và thiếu các luồng sửa đáp án, nháp mất mạng, khóa link chia sẻ. Đề xuất chuyển vào `docs/lich-su/` để tránh giáo viên đọc nhầm tài liệu cũ.
   - `docs/huong-dan/PHIEU_PHAN_HOI_PILOT.md` -> **GỘP**. Đề xuất gộp nội dung vào `docs/phoi-hop-ai/05_TUYEN_GIAO_VIEN_VA_NGUOI_DUYET.md` (nơi đã có sẵn phiếu 10 câu hỏi chuẩn hóa).
   - `docs/huong-dan/THE_KIEM_TAY_PILOT.md`, `THE_KIEM_TAY_PILOT_2.md`, `THE_KIEM_TAY_GIAO_BAI_VA_WORD.md` -> **GỘP**. Ba tệp thẻ kiểm tay đang bị phân tán (thẻ F1-F8 ở tệp 1, thẻ bổ sung ở tệp 2, thẻ xuất Word ở tệp 3). Đề xuất hợp nhất thành một tệp duy nhất: `docs/huong-dan/BO_THE_KIEM_TAY_PILOT_TONG_HOP.md`.

2. **Thư mục `docs/bieu-mau/`:**
   - `docs/bieu-mau/PHIEU_GOP_Y_MA_TRAN_DE.md` -> **GỘP / TÍCH HỢP**. Tệp này chứa mẫu phiếu sinh hoạt tổ chuyên môn. Đề xuất chuyển vào thành phụ lục của `docs/phoi-hop-ai/05_TUYEN_GIAO_VIEN_VA_NGUOI_DUYET.md` hoặc chuyển sang `docs/huong-dan/` để gom toàn bộ tài liệu hướng dẫn - biểu mẫu vào một nơi, không cần duy trì thư mục riêng chỉ có 1 tệp.

3. **Thư mục docs/su-co/:**
   - `docs/su-co/30_LOI_XUAT_WORD_VA_CACH_PHONG.md` -> **GỘP**.
     Tệp này rất hữu ích về mặt kỹ thuật cho giáo viên khi xuất file Word.
     Tuy nhiên tạo riêng thư mục docs/su-co/ chỉ cho 1 tệp làm cồng kềnh cây tài liệu.
     Đề xuất chuyển tệp này vào docs/huong-dan/SO_TAY_30_SU_CO_XUAT_WORD.md hoặc liên kết trực tiếp trong mục Sự cố của cẩm nang giáo viên đầy đủ.

4. **Thư mục `docs/dien-tap/`:**
   - `docs/dien-tap/KICH_BAN_DIEN_TAP_SU_CO.md` -> **GỘP**. Kịch bản 5 tình huống diễn tập ứng phó sự cố khẩn cấp (mất điện, sập mạng, lỗi đồng bộ). Nội dung này thuộc nhóm quản trị vận hành trường học. Đề xuất chuyển vào thư mục `docs/van-hanh/KICH_BAN_DIEN_TAP_SU_CO.md` để đứng cạnh `docs/van-hanh/VAN_HANH_PILOT_LOCAL.md`.

5. **Thư mục `docs/chuong-trinh-2018/`:**
   - `docs/chuong-trinh-2018/03_YEU_CAU_CAN_DAT_3_MON_MOI.md` -> **GỘP / ĐỔI CHỖ**. Nghiên cứu yêu cầu cần đạt GDPT 2018 cho Tiếng Anh 8, KHTN 6, Lịch sử và Địa lí 7. Tệp này bản chất là sản phẩm nghiên cứu chương trình học liệu. Đề xuất chuyển vào `docs/nghien-cuu/08_YEU_CAU_CAN_DAT_3_MON_MOI.md` hoặc `docs/nghien-cuu/goi/PILOT-3-MON-MOI/` để đồng nhất với các tài liệu nghiên cứu môn Toán và Văn trước đó. Xóa thư mục rỗng `docs/chuong-trinh-2018/`.

6. **Thư mục `docs/van-hanh/`:**
   - `docs/van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md` -> **GIỮ**. Cẩm nang vận hành sao lưu dữ liệu cục bộ.
   - `docs/van-hanh/VAN_HANH_PILOT_LOCAL.md` -> **GIỮ**. Quy trình bật tắt máy chủ và quản trị buổi thi thử nghiệm.

---

## 3. BẢNG PHÂN LOẠI CHI TIẾT CÁC TỆP TRONG QA/

| Đường dẫn / Khu vực | Phân loại | Ghi chú & Đề xuất |
|---|:---:|---|
| `qa/reports/*.md` (20 tệp) | GIỮ | Bộ báo cáo kiểm toán tĩnh 20 chuyên đề ban đầu (AIP, SEC, DB, API...). Giữ nguyên làm hồ sơ tham chiếu gốc. |
| `qa/rebuild-2026-10-24/` | GIỮ | Toàn bộ log và báo cáo đối soát khoảng trống pilot ngày 24/10. Giữ nguyên theo đúng quy ước số liệu chỉ nằm ở qa/. |
| `qa/rebuild-2026-10-25/` | GIỮ | Báo cáo đợt 25/10 (Q1, Q2, Q3, CAS, Claude run logs...). Nơi lưu trữ chứng cứ kỹ thuật hiện hành của Codex và Claude. |
| `qa/ai-review/fixtures/da-mon/` | GIỮ | Bộ 6 đề thi mẫu đa môn chuẩn GDPT 2018 (đã hoàn thiện 10 câu/đề, 0x7B UTF-8, unique IDs). Phục vụ test tự động. |
| `qa/ai-review/coordination/` | GIỮ | Các tệp ASSIGNMENTS.json, BATCH_REVIEWS.json, GEMINI_STATUS.md và tin nhắn điều phối giữa Claude - Gemini - Codex. |
| `qa/ai-review/GEMINI_UI_TEXT_AUDIT.md` | GIỮ | Báo cáo rà soát văn bản giao diện và màn hình hẹp 375px (nhiệm vụ GEM-R3). |
| `qa/ai-review/GEMINI_REGRADE_CASES.md` | GIỮ | Bộ 20 tình huống kiểm thử sửa đáp án và chấm lại (nhiệm vụ GEM-R4, 0 citation errors). |
| `qa/ai-review/GEMINI_DOC_AUDIT.md` | GIỮ | Tệp báo cáo này (nhiệm vụ GEM-R6). |

---

## 4. BẢNG TỔNG HỢP KIẾN NGHỊ DỌN DẸP CHO CLAUDE

Sau khi Claude xem xét phê duyệt, các hành động dọn dẹp cụ thể đề xuất thực hiện như sau:

1. **Hành động 1 (Chuyển lịch sử 7 tệp gốc):**
   - Di chuyển 7 tệp báo cáo cũ tại thư mục `docs/` (`BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md`, `BAO_CAO_TOAN_DIEN_V3.md`, `BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md`, `BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md`, `CHECKLIST_TIEN_DO.md`, `EXAMCRAFT_THIET_KE_V3.md`, `TIEN_DO_CAI_TIEN_EXAMCRAFT.md`) vào `docs/lich-su/`.

2. **Hành động 2 (Hợp nhất 4 thư mục đơn lẻ mới tạo):**
   - `docs/chuong-trinh-2018/03_YEU_CAU_CAN_DAT_3_MON_MOI.md` -> chuyển vào `docs/nghien-cuu/`.
   - `docs/dien-tap/KICH_BAN_DIEN_TAP_SU_CO.md` -> chuyển vào `docs/van-hanh/`.
   - `docs/su-co/30_LOI_XUAT_WORD_VA_CACH_PHONG.md` -> chuyển vào `docs/huong-dan/`.
   - `docs/bieu-mau/PHIEU_GOP_Y_MA_TRAN_DE.md` -> chuyển vào `docs/huong-dan/`.
   - Xóa bỏ 4 thư mục vỏ rỗng: docs/chuong-trinh-2018/, docs/dien-tap/, docs/su-co/, docs/bieu-mau/ để giữ cấu trúc cây thư mục docs/ gọn gàng, tinh giản.

3. **Hành động 3 (Gộp tài liệu hướng dẫn và kiểm tay):**
   - Chuyển `docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md` vào `docs/lich-su/`.
   - Gộp 3 tệp thẻ kiểm tay (`THE_KIEM_TAY_PILOT.md`, `THE_KIEM_TAY_PILOT_2.md`, `THE_KIEM_TAY_GIAO_BAI_VA_WORD.md`) thành 1 cẩm nang kiểm tay duy nhất.

---
*Báo cáo rà soát cây tài liệu ExamCraft phục vụ công tác tổ chức và bàn giao dự án.*
