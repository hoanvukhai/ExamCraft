# Duyệt đề xuất sửa câu AI và thẩm định theo bản nền — 24/10/2026

## Hiện trạng

Helper và wiring QuestionCard/QuestionAiReview đã được kiểm bằng kết quả giả trên component thật. Nhóm tích hợp Copilot đã đạt SAFE214 và HTTP17 mới, gồm server account-pin của tweak/verify/Copilot; build46trang/typecheck cuối đạt, production chọn đúng câu/focus đạt. Phạm vi từng lượt và giới hạn xem [COPILOT_GUARDS](COPILOT_GUARDS.md). Không suy kết quả browser giả thành chất lượng AI thật hoặc nghiệm thu chuyên môn.

- `question-ai-review.ts` chụp deep clone tuple tài khoản/đề/sourceStamp/toàn bộ câu. `questionAiBaseMatches` so đủ tuple và full stamp; `prepareQuestionAiSubmission` chỉ tạo submission khi nền còn khớp. Parent dùng `applyQuestionManualSubmission` kiểm lại nền/quyền trong updater để chặn race sau handler.
- Candidate được normalize/validate, pin ID/môn/lớp/điểm/context links theo base; version mới, status draft/verifiedBy none và token UUID mới. Normalize base rồi bỏ các body field cũ trước khi merge candidate: không phục hồi đáp án/phương án/accepted answers/cặp ghép/thứ tự của câu trước khi AI đổi dạng hoặc bỏ field. Trường unknown bị thiếu ở candidate, rubric giáo viên và hình bị thiếu ở candidate được giữ; hình candidate cung cấp được xử lý theo canonical. Rubric giữ lại có thể đã cũ và cần giáo viên rà, không được coi tự động phù hợp nội dung mới.
- Submission chấp nhận đặt aiGenerated true để adapter lưu sourceKind AI_GENERATED, không kế thừa nhầm TEACHER_WRITTEN từ base. Cờ này chỉ ghi nguồn AI, không cấp verified và chưa là trace/audit đầy đủ về model/provider/prompt/lượt gọi. Base gốc không bị đổi cờ.
- QuestionCard dùng accountFetch với tài khoản lúc gửi, giữ captured base cùng đề xuất/thẩm định. Đề xuất stale vẫn ở preview để đối chiếu/tải, nút chấp nhận bị chặn. Parent từ chối không đóng preview, không thêm history; đúng prop ack mới đóng và thêm một mốc undo. Thẩm định chỉ hiển thị khi tuple nền còn đúng, kể cả ngữ cảnh thay đổi sau khi đã nhận kết quả; không tự đánh dấu câu đã được chuyên môn duyệt.
- Root bổ sung assertRequestAccount ngay sau requireAuth ở cả tweak/verify, trước body validation/key lookup/provider. Hai assertion mới trong HTTP workflow gửi cookie tài khoản B + pin tài khoản A + body rỗng và yêu cầu409/ACCOUNT_CHANGED. **Chưa chạy HTTP sau bổ sung guard**; browser fake bên dưới chỉ chứng minh client gửi header đúng, không thay kiểm server.
- Đề xuất chưa chấp nhận giữ trong RAM của tab, có CTA tải JSON. Chưa có journal bền cho đề xuất AI chưa chấp nhận; trước đóng/reload cần chủ động giữ bản cần đối chiếu.

## Kiểm mã

- `node --import tsx --test tests/question_ai_review.test.ts`: **6/6 PASS**, exit0. Kiểm deep clone, stamp không phụ thuộc thứ tự key, đủ tuple và thay đổi chỉ ở lời giải/ảnh/đáp án/version/điểm; pin ID/context/điểm0, reset review, giữ hình/rubric/unknown; MC/short→essay không hồi đáp án; candidate sai bị từ chối; race/owner/quyền được kiểm lại trong updater. Test đã thêm SAFE, giữ các entry trước.
- Lint helper/test mới exit0. QA entry không có lỗi lint; combined lint cùng `qa-scope-server.cjs` exit1 do hai lỗi require có sẵn ở đầu script CJS, không đổi cấu hình để che lỗi.
- [Lint ba component](question-ai-ui-lint.log) exit1: hai lỗi kế thừa ở Workspace (checkUserKeys/setState trong effect và anchor) cùng18warnings. Card/Review mới không có lỗi; Card còn8warnings cũ. Không nhận lint toàn repo sạch.
- [Log build đã dừng](build-question-ai-review.log) không được nhận là build đạt. [SAFE cuối](safe-copilot-final.log)20+194=214đạt; [HTTP cuối](http-copilot-final.log)17/17đạt trên DB thử, không gọi provider. [Lint phần AI câu và API](question-ai-changed-lint.log)exit0/còn9warnings; không phủ định hai lỗi Workspace kế thừa đã ghi ở trên.

## Browser component thật, phản hồi giả có điều khiển

[QA entry](question-ai-browser-entry.tsx) render actual QuestionCard + QuestionAiReview và parent updater thật tại `http://127.0.0.1:3122/question-ai`, do `scripts/qa-scope-server.cjs` phục vụ. Các route QA cũ giữ nguyên. Fake fetch chỉ nhận tweak/verify POST với owner pin đúng, trả qua hàng đợi và không fallback native fetch; CSP connect-src none. Fixture owner `qa-ai-component`, đề `qa-ai`, không kết nối DB/provider. Dữ liệu hình fixture không có URL; kiểm giữ dữ liệu hình, không phải kiểm tải/render ảnh thật.

| Ca browser đã đạt | Bằng chứng |
|---|---|
| Tweak đang chờ → đổi ngữ cảnh → trả phản hồi | Đề xuất giữ lại, báo stale và chặn chấp nhận. [DOM](question-ai-stale-context.txt) |
| Reset → đề xuất → parent cố ý từ chối | Preview còn, refusals1, chưa có history. [DOM](question-ai-parent-refused.txt) |
| Bỏ từ chối → retry chấp nhận | Preview đóng sau ack, history1/version5; giữ điểm0/hình/section/passage/môn/lớp; đáp án/phương án MC cũ không theo sang essay. [DOM](question-ai-accepted.txt) |
| Undo sau chấp nhận | Khôi phục MC, version6, history hết. [DOM](question-ai-undo.txt) |
| Verify đang chờ → đổi ngữ cảnh → trả phản hồi | Marker kết quả stale không hiện; có cảnh báo stale. [DOM](question-ai-verifier-stale.txt) |
| Verify nền ổn định, rồi thay ngữ cảnh sau khi đã nhận | Ban đầu marker xuất hiện kèm cần giáo viên duyệt; sau đó details không còn hiện. [Nền đúng](question-ai-verifier-current.txt), [sau thay ngữ cảnh](question-ai-verifier-changed-after.txt) |
| Tweak đang chờ → sửa thủ công và Apply → trả AI | Giữ nội dung thủ công, historymanual1; đề xuất AI giữ nhưng stale/disabled. [DOM](question-ai-manual-edit-stale.txt), [ảnh](question-ai-manual-edit-stale.png) |

Tất cả call giả có captured-owner pin đúng, unexpectedRequests0; native fetch không được gọi. CTA tải đề xuất có trong UI nhưng browser download chưa được kiểm.

## Giới hạn

- Tweak route hiện chỉ nhận4dạng MC/đúng-sai/short answer/essay; helper/normalizer không thay việc còn thiếu hỗ trợ route cho đủ7dạng soạn thủ công. Không tuyên bố đã thử nhà cung cấp thật, chất lượng ngữ nghĩa, đáp án đúng, quota/BYOK thực hoặc mọi thao tác AI khác.
- Browser đây là harness cô lập component thật với phản hồi giả, không phải end-to-end provider/DB hay hai browser profile độc lập. Mất đề xuất RAM khi đóng/reload vẫn là giới hạn; download chưa được kiểm. Redo/lịch sử undo bền qua reload vẫn mở như [QUESTION_COMMANDS](QUESTION_COMMANDS.md).
- API/DB đã chạy lại qua HTTP17 của nhóm Copilot; integration7 kế thừa đợt canonical vì service/schema không đổi. Không dùng khóa thật; dữ liệu chính giữ nguyên.
