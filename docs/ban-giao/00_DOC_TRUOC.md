# ExamCraft — đọc trước khi tiếp nối

Điểm vào hiện hành cho người và AI. Cập nhật hồ sơ: 25/10/2026 (gọn theo kiểu một nơi cho số liệu). Không cần đọc lại toàn bộ chat hoặc báo cáo cũ để bắt đầu.

## Đọc ít nhưng đúng

1. Đọc `AGENTS.md` ở gốc và yêu cầu mới nhất của người dùng.
2. Đọc [02 — Trạng thái tiếp nối](02_TRANG_THAI_TIEP_NOI.md): mốc gần nhất, giới hạn, việc tiếp theo.
3. Chỉ khi cần tìm mã, tra đúng hàng trong [01 — Bản đồ mã nguồn](01_BAN_DO_MA_NGUON.md).
4. Mở mục CV liên quan trong [checklist chính](../ke-hoach-2026-10-21/03_CHECKLIST.md) (đọc dòng "Hiện trạng" và tiêu chí), rồi mới mở báo cáo nhóm/mã/test cần thiết. Không đọc toàn bộ kho tài liệu mỗi lượt; không đọc log/DOM dump trừ khi báo cáo nhóm chỉ tới.

Nếu người dùng chỉ hỏi hoặc yêu cầu sửa tài liệu, không tự tiếp tục code từ hàng đợi. Hồ sơ ghi việc tiếp theo không phải lệnh tự chạy.

## Các quyết định cần giữ

- Phục vụ giáo viên, cá nhân/nhóm nội bộ nhỏ; local trước. Học sinh làm bài qua link giáo viên mở, không xây nền tảng tự học độc lập.
- Phạm vi nhiều môn, lớp1–12 và các nhánh chương trình; Toán chỉ là tuyến thử sớm. Khung nhận thức theo nguồn áp dụng, không ép mọi môn dùng ba/bốn mức.
- Giáo viên tự quản lý key AI; không tách ứng dụng miễn phí/trả phí, không suy quota/chi phí từ số key. Chưa tự gọi AI thật có phí hay mua/triển khai dịch vụ.
- Riêng tư mặc định. Xem, góp ý, sửa, nhân bản, công bố và góp kho AI là các quyền khác nhau. Chia sẻ công khai không mặc nhiên cho mọi người sửa.
- Đề và đáp án cùng tài liệu có phiên bản; giáo viên tùy chỉnh tiêu đề/mẫu. AI đưa đề xuất để duyệt, không tự chứng nhận nội dung chuẩn.
- Server là nguồn lưu chính; giữ nháp theo tài khoản, lịch sử và đường khôi phục. Không xóa dữ liệu cũ trước đối chiếu. CAS + đồng bộ định kỳ là hướng cộng tác hiện tại cho nhóm nhỏ, chưa là ghép từng ký tự thời gian thực.
- Gói kiến thức giữ nguồn, quyền dùng và phiên bản. Số tài liệu/URL đã tìm không phải số gói chuyên môn đã duyệt. Ghi chú cá nhân riêng tư; góp kho chung chủ động và qua duyệt.

## Mỗi thông tin có một nơi chính

| Cần biết | Nguồn chính |
|---|---|
| Trạng thái ngắn, việc tiếp nối | [02](02_TRANG_THAI_TIEP_NOI.md) |
| Thông báo chung cho chủ dự án | [Tiến độ](../TIEN_DO_CAI_TIEN_EXAMCRAFT.md) |
| Toàn bộ việc/tiêu chí, không bỏ sót | [03 — 78 CV](../ke-hoach-2026-10-21/03_CHECKLIST.md) |
| Yêu cầu YC / nghiệm thu NT / thứ tự phụ thuộc | [01 — Phạm vi](../ke-hoach-2026-10-21/01_TONG_KET_DU_AN.md), [04 — Nghiệm thu](../ke-hoach-2026-10-21/04_NGHIEM_THU.md), [02 — Lộ trình](../ke-hoach-2026-10-21/02_LO_TRINH.md) |
| Quyết định chi tiết trước triển khai | [08 — Hồ sơ đã duyệt](../ke-hoach-2026-10-21/08_HO_SO_TRUOC_KHI_CODE.md) |
| Bằng chứng kỹ thuật, **số test/log** và giới hạn | Báo cáo nhóm trong `qa/rebuild-<ngày>/` (tra qua bản đồ01), [TESTING](../../qa/rebuild-2026-10-22/TESTING.md). Chỉ ghi số liệu ở đây |
| Nghiên cứu nguồn/nhánh còn thiếu | [Sổ hợp nhất](../nghien-cuu/05_DANH_MUC_HOP_NHAT.md), [hàng đợi](../nghien-cuu/06_VIEC_TIEP_THEO.md) |
| Nhật ký đợt cũ, bản trước khi viết đè | [docs/lich-su](../lich-su/README.md) và lịch sử Git; không phải trạng thái |

Đây là chỉ mục và bản tóm tắt, không thay checklist hoặc mở thêm một “master”. Yêu cầu mới nhất của người dùng quyết định phạm vi hiện tại; yêu cầu sản phẩm tra hồ sơ đã duyệt. Mã/test/bằng chứng quyết định thực tế đã làm đến đâu, không tự thay đổi yêu cầu. Có mâu thuẫn thì ghi rõ và đối chiếu nguồn liên quan, không chọn câu cũ có lợi để báo xong.

## Cách làm và bàn giao tiết kiệm

Chọn một nhóm CV có liên quan; tìm bằng `rg`, đọc đoạn cần thiết và test tương ứng. `.rgignore` loại báo cáo lịch sử, `docs/lich-su/`, `qa/` gốc, log/DOM dump và danh mục nghiên cứu lớn khỏi tìm kiếm mặc định; khi thật cần, chỉ rõ tệp hoặc thêm `--no-ignore`. Chỉ mở báo cáo cũ/chat/nguồn web khi công việc cần đối chiếu. Ghi kết quả chạy mới gắn với thay đổi hiện tại; không chạy lại build/DB/AI chỉ để đọc tài liệu. Không giảm kiểm quyền, bảo toàn hoặc kiểm thử quan trọng để tiết kiệm token. Không mặc định cần nhiều agent cùng đọc dự án.

Kết thúc mỗi đợt, theo thứ tự: (1) ghi số liệu, log và giới hạn vào báo cáo nhóm `qa/rebuild-<ngày>/`; (2) viết đè dòng "Hiện trạng" của CV liên quan, kèm liên kết báo cáo; (3) viết đè mục 1 và 3 của hồ sơ 02; (4) chỉ thêm thông báo tiến độ khi có thay đổi đáng báo, giữ ba thông báo mới nhất. Checklist, 02 và tiến độ không chép lại số test. Mẫu ghi: **đã sửa — đã kiểm (loại kiểm/đích/kết quả) — chưa kiểm/lỗi — CV còn mở — bước tiếp theo**. Nội dung cũ chuyển sang `docs/lich-su/` hoặc để lịch sử Git, không xóa mất. Không chép log hoặc lịch sử chat vào hồ sơ ngắn. Không đánh dấu hoàn tất từ việc có file hay test giả đạt.

Prompt dùng cho chat/AI mới:

> Đọc AGENTS.md và docs/ban-giao/00_DOC_TRUOC.md, rồi làm đúng yêu cầu hiện tại của tôi. Dùng trạng thái02 và mục CV liên quan; chỉ đọc thêm mã/test/tài liệu cần thiết. Giữ quyết định đã chốt và thay đổi có sẵn; kiểm thực tế trước báo xong. Cuối đợt cập nhật hồ sơ tiếp nối ngắn. Không đọc lại toàn bộ lịch sử hoặc tự chạy việc ngoài phạm vi.

Nếu AI khác không truy cập được workspace: gửi00 và02 trước, rồi mục CV/tệp liên quan theo việc được giao; gửi01 khi cần tìm mã. AI phải nói rõ giới hạn truy cập, không nhận đã đọc/chạy tệp chưa được cung cấp. Không gửi cả repo, `.env` hoặc dữ liệu thật chỉ để bổ sung ngữ cảnh.
