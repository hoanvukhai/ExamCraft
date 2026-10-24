# Copilot: quyền tài khoản, bản nền và xác nhận áp dụng — 24/10/2026

## Đã thay đổi

- Luồng đang dùng là `RightCompanionRail` trong `ExamWorkspace`. Chụp tài khoản, mã đề, toàn bộ danh sách/thứ tự câu và ngữ cảnh môn/lớp/phạm vi/phần/ngữ liệu lúc gửi. Yêu cầu dùng `accountFetch`; API Copilot, tweak và verify kiểm `assertRequestAccount` ngay sau đăng nhập, trước đọc body/khóa/provider.
- `prepareCopilotSubmission` chỉ nhận sửa một câu, thêm câu hoặc bỏ đúng ID đã chỉ rõ. Câu sửa dùng guard câu AI chung: giữ ID/điểm/liên kết, không phục hồi đáp án cũ khi đổi dạng, tăng version, bỏ verified và ghi nguồn AI. Câu thêm có ID mới, chưa đặt điểm hoặc gắn phần/ngữ liệu/kiến thức, không nhận điểm hay liên kết do AI tự cấp. Không tự thực hiện hành động hàng loạt chưa hỗ trợ.
- `applyCopilotSubmission` so lại tài khoản/đề/ngữ cảnh/toàn câu/quyền ngay trong updater; bản đã đổi thì trả nguyên đối tượng. Chỉ thay danh sách câu; giữ metadata mới của giáo viên. Kiểm hợp lệ mọi câu nhưng không normalize lại các câu ngoài đề xuất, tránh tự đổi dữ liệu không liên quan.
- `CopilotProposalReview` giữ preview khi stale hoặc parent từ chối. Chỉ đóng và thông báo đã áp dụng khi props xác nhận đúng danh sách câu/ngữ cảnh dự kiến. Có tải JSON để giữ bản đối chiếu; chưa có journal bền cho đề xuất chưa duyệt. Không báo đã lưu máy chủ từ phản hồi này.
- Khi có đề xuất, khóa gửi thêm lệnh để tránh làm mất preview. Preview điểm khớp chính sách giữ điểm của câu sửa. Rail giữ component review khi thu gọn; mở rộng có vùng cuộn riêng. Focus lệnh từ câu chuyển sang đồng bộ props có điều kiện, effect chỉ làm focus và dọn timer.
- Workspace truyền tài khoản và updater có guard, key rail theo tài khoản/mã đề; bỏ các callback ghi nguyên câu/mảng không kiểm nền của luồng này. `ExamCopilotBar.tsx` cũ không có nơi import trong `src`; chưa chuyển hoặc xóa component không dùng đó và không coi nó đã được gia cố.

## Kiểm đã chạy

- [Focused](copilot-focused.log): **11/11**, gồm5Copilot +6đề xuất câu. Kiểm identity/context/order/toàn câu/race/quyền, giữ điểm0/hình/câu khác/metadata mới, thêm ID riêng, bỏ đúng ID, candidate và hành động sai bị từ chối. Cả hai test đã vào SAFE.
- Browser dùng [harness](copilot-browser-entry.tsx) tại `/copilot`, actual rail/review/updater, fake fetch có hàng đợi và không fallback mạng; CSP `connect-src none`. Không DB/provider và không dùng khóa thật.

| Ca UI | Kết quả / bằng chứng |
|---|---|
| Gửi → đổi phạm vi → trả AI | Preview còn, Apply và gửi lệnh bị khóa, state không đổi ngoài phạm vi. [DOM](copilot-stale-context.txt) |
| Parent từ chối → thử lại | Preview giữ sau lần bị từ chối; nhận đúng props mới đóng, giữ câu B/điểm0/hình và version4/AI/draft/none. [Từ chối](copilot-parent-refused.txt), [nhận](copilot-accepted.txt) |
| Câu B đổi ngay trong updater | Guard giữ B mới/version3 và A gốc; không có success, preview stale vẫn giữ. [DOM](copilot-updater-race.txt), [ảnh](copilot-updater-race.png) |
| Thêm câu | Giữ A/B, thêm câu ID riêng/version1/AI, chưa đặt điểm; đóng preview sau ack. [DOM](copilot-added.txt) |
| Bỏ câu | Preview nêu rõ A, chưa sửa state trước Apply; sau Apply chỉ còn B nguyên nội dung/version. [Preview](copilot-delete-preview.txt), [nhận](copilot-deleted.txt) |

## Kết quả tích hợp cuối

- [Build](build-copilot-final.log):46trang/typecheck exit0, gồm sửa nút Bảo AI chọn đúng ID câu trước mở rail. Không nhận build bị dừng hoặc lượt fixture thiếu trường là đạt.
- [SAFE](safe-copilot-final.log):20+194=214đạt. [HTTP](http-copilot-final.log):17/17mới đạt trên DB thử;3API AI kiểm stale account409/anonymous401/cross-origin403/pin đúng body sai400, usage không tăng. Hai bộ chạy trước chỉnh chọn mục tiêu UI cuối; helper/API không đổi sau đó. Không chạy lại DB chỉ vì chỉnh lựa chọn UI. Integration7 đợt canonical kế thừa.
- [Lint Copilot](copilot-lint.log):exit0,0lỗi/3warnings cũ; [AI câu/API](question-ai-changed-lint.log):exit0/9warnings. Workspace vẫn có2lỗi kế thừa trong log lint riêng; không nhận lint toàn repo sạch.
- Browser production sau build cuối: bấm Bảo AI câu1 chọn đúng câu1, mở rail và focus lệnh; chọn B rồi bấm lại A vẫn chỉ nhắm A. Chưa bấm Gửi, không provider. [DOM](copilot-production-target.txt), [ảnh](copilot-production-target.png). Đối chiếu DB readonly sau ca UI giữ3câu/lời giải/ảnh/điểm0 và hash nguồn: [PASS](question-commands-after-offline-db.json).
- Chỉ ghi/cleanup fixture DB thử. Không sửa DB chính, không nhập hoặc sử dụng khóa vừa được gửi trong chat. QAserver3117 và harness3122 đã dừng cuối đợt. Các tab QA giữ để tiếp nối, không tự reload form chưa rõ.

## Giới hạn còn mở

- Không suy AI giả thành chất lượng nhà cung cấp, đúng kiến thức/đáp án hoặc quota/chi phí thật. Chưa gọi AI thật; khóa không nằm trong source/log/báo cáo.
- Harness không dùng CSS production và không chứng minh bố cục panel khi preview dài/mobile hoặc hai browser profile độc lập. Chưa kiểm download JSON thật trong browser.
- Chưa có undo/redo riêng cho thêm/bỏ bằng Copilot hoặc journal đề xuất bền qua reload. Lịch sử server chỉ có sau lưu đề; chưa đóng CV025/035/037/053.
- Chưa cho phép áp dụng đồng thời khi câu khác thay đổi; chủ động giữ proposal để đối chiếu, không tự ghép. Cấu hình header đổi được giữ vì submission chỉ thay câu, còn các thay đổi nguồn/phạm vi bị chặn.
