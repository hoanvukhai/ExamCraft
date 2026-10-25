# CODEX generation 17 — bàn giao chờ duyệt

- **T1 / c9e84b8:** pilot-results và pilot-run dùng writer atomic/retry hiện có; lỗi ghi lâu dài vẫn fail. F3 và F19 mỗi luồng hai lượt đạt (gen17-F3-1/2.log, gen17-F19-1/2.log, gen17-t1-evidence.json).
- **T2 / 914f26d:** đăng ký F24 kiểm góp ý gắn câu/phiên bản, giải quyết/mở lại và DB; viewer không có nút/API403, commenter chỉ xử lý góp ý mình; tạo ghi chú tay qua UI và tải/đọc Markdown thật, đủ nhãn Nguồn/Bằng chứng/Điều chưa chắc và không chứa khóa canary giả. Form tay chưa có ô bằng chứng nên bỏ qua nhập theo chỉ dẫn (gen17-f24-result.json).
- **Sửa tối thiểu / 9114ee9:** người từng COMMENTER bị hạ VIEWER vẫn thấy Mở lại trên góp ý cũ của mình, trong khi API đã chặn. Tái hiện tại gen17-F24-downgrade-before.log; sửa một điều kiện UI yêu cầu canComment cho tác giả và bổ sung hồi quy. Không đổi API/schema.

## T3 — cùng một lượt CI cuối sau bản sửa

Log ci-gen17-full.log, build ID ISCe6FOtShR5UrbeVk-EB, mã gen17 tới 9114ee9. Không ghép số từ các lượt chạy riêng.

| Bước | Kết quả |
|---|---|
| TypeScript | PASS |
| Lint | PASS, không lỗi; vẫn còn cảnh báo |
| SAFE | 448/448 PASS |
| Build | PASS, CPU1/heap1024 |
| HTTP | 105/105 PASS |
| Browser | 23/23 PASS, F1–F7 và F9–F24 |

Tổng 540 giây theo log. gen17-ci-browser.json ghi đầy đủ cùng run và cleanup. Đã kiểm sau CI tại 2026-10-25T18:16:53.219Z: health3117 không kết nối, không listener3117/3118.

## Truy vết và giới hạn

Probe đầu dùng build trước CV063 nên chưa tải Markdown, không tính đạt (gen17-F24-probe.log). Lượt CI build mới trước hồi quy cũng đạt, giữ riêng ci-gen17-before-role-fix.log; kết luận cuối dùng lượt sau 9114ee9 ở trên. Không sửa test để hợp lỗi quyền.

Có thay đổi ngoài phạm vi ở package.json và src/lib/docx-export.ts xuất hiện sau khi build cuối được tạo. CODEX giữ nguyên, không lấy vào commit và không chứng nhận các diff đó bằng lượt CI này; Claude cần kiểm riêng phần đang sửa. F8 backup/integration riêng không thuộc CI, không chạy lại. Kiểm tự động không thay kiểm bằng mắt/Word thật hoặc duyệt chuyên môn.

Không schema/DB chính/.env/backup/bí mật/provider thật/push/reset/clean. Chỉ sửa một điều kiện UI cùng bộ kiểm; không sửa checklist/02/ASSIGNMENTS/BATCH_REVIEWS hoặc tự đóng CV. Trạng thái WAITING_REVIEW.
