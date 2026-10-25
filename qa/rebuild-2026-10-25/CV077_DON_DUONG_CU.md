# CV077 — dọn đường cũ và tài liệu (26/10, Claude)

## Tài liệu
- Chuyển bằng `git mv` sáu báo cáo V1–V3 từ `docs/` sang `docs/lich-su/`: `BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md`, `BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md`, `BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md`, `BAO_CAO_TOAN_DIEN_V3.md`, `EXAMCRAFT_THIET_KE_V3.md`, `CHECKLIST_TIEN_DO.md`. Mỗi tệp thêm dòng "Tài liệu lịch sử" ở đầu; nội dung giữ nguyên.
- Liên kết: tìm mọi `](…tên tệp.md)` trong repo (`rg --no-ignore`). Liên kết vào chỉ có ở `docs/ke-hoach-2026-10-21/05_CHUAN_BI_VA_NGUON.md` (5 dòng) → đổi sang `../lich-su/`. Liên kết tương đối đi ra từ sáu tệp được thêm một `../` (22 liên kết); liên kết giữa chúng giữ nguyên vì chuyển cùng nhau. Kiểm sau khi chuyển: mọi liên kết tương đối trong sáu tệp và tệp 05 trỏ tới tệp có thật (0 gãy). Liên kết tuyệt đối `F:/…`, `C:/…` ra ngoài repo giữ nguyên như ghi chú 24/10.
- Các báo cáo cũ trong `qa/` gốc chỉ nhắc tên tệp dạng chữ (không phải liên kết), đã có ghi chú lịch sử từ 24/10; không sửa.
- **Không chuyển** `docs/TIEN_DO_CAI_TIEN_EXAMCRAFT.md` (nơi thông báo chung hiện hành theo 00_DOC_TRUOC) và `docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md` (hướng dẫn CV076 và hồ sơ 02 đang dẫn). Kế hoạch `qa/ai-review/DOC_MOVE_PLAN.md` của Gemini bị từ chối vì đề xuất chuyển hai tệp này.
- Lời hứa cũ: tìm `7-key`, `7 key`, `1500*`, `100%` trong `docs/` (trừ `lich-su/`, `archive/`, `nghien-cuu/`) và `src/`: không còn tài liệu hiện hành hứa 7 khóa hoặc quota nhân theo khóa; các chỗ "100%" còn lại là kết quả mong đợi trong kịch bản/phiếu kiểm, hoặc CSS.

## Đường mã cũ (rà caller trước khi bỏ)
| Đường | Caller/dữ liệu | Quyết định |
|---|---|---|
| `src/app/c/[groupCode]/page.tsx` + `src/app/api/public/groups/[groupCode]/route.ts` | `src/app/teacher/groups/page.tsx` dẫn `/c/${group.publicCode}` (trang lớp cho học sinh) | Giữ: đang dùng |
| `src/lib/db.ts` (Dexie `ExamCraftDB`) | `QuestionCard.tsx`, `ExamLibraryModal.tsx`, `QuestionBankModal.tsx`; bọc `question-client` và `legacy-local` để đọc/sao kho cũ trên trình duyệt | Giữ: đang dùng, là đường đọc dữ liệu cũ của giáo viên |
| `src/app/test/[id]/page.tsx` | Không còn caller trong `src/`; link thi cũ có thể còn trong tay học sinh | Giữ: chỉ hiện thông báo "đường dẫn thi cũ không còn hỗ trợ", không đọc dữ liệu |
| `src/lib/cloud-storage.ts`, `/api/cloud/exams/[id]` (lộ đáp án, qa/00_claims R6) | Không còn tệp | Đã bỏ ở đợt trước |

Không xóa mã, không hạ schema trong đợt này. Không chạy build/test vì chỉ di chuyển tài liệu.
