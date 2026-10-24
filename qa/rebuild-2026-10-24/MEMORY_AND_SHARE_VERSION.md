# Sao chép đề theo phiên bản và kho ghi chú AI riêng — 24/10/2026

## Thay đổi và bảo toàn

- CV048: public share trả sourceVersion. Trang gửi phiên bản đang xem; server từ chối SOURCE_CHANGED nếu nguồn đã đổi trước khi đọc. Bản sao mới có ID ổn định theo tài khoản/link/phiên bản; retry cùng bản không sinh thêm đề và không ghi đè bản riêng đã sửa. Caller cũ không body vẫn giữ ID cũ. Không sửa/xóa bản sao hoặc dữ liệu cũ.
- Race tái hiện: hai request sao chép đồng thời gây unique constraint/HTTP500. Thêm advisory transaction lock theo chủ + copy client ID trước createExam. Lock chỉ tuần tự hóa bản sao cùng đích; không thay schema.
- Trang share chặn bấm lặp, abort/guard receipt khi đổi đề/rời trang; nguồn fetch no-store. Giữ chính sách đáp án của liên kết. Không cho phép copy nếu chưa xác nhận tài khoản/phiên bản.
- Claude memory6 đã review và tích hợp b19745f/7d713b6/d75bbea thành804459e/8cec3d9/6eae5fd. Hash37 tệp tracked root đang sửa không đổi qua cherry-pick, snapshot tại tmp/coordination/before-memory-integration.json. Không reset/push/merge, không DB chính/provider.
- CV011/063–069: memory list/create/update/delete/archive/analyze kiểm tài khoản trước body/DB/key/provider; list/export private no-store. Manual create retry có clientRequestId theo chủ, duplicate không ghi đè. Nhập archive vẫn xem trước/xác nhận và tắt mặc định; không góp chung tự động.
- Memory UI dùng gate theo lần mở/chủ, khóa khi sai tài khoản, giữ form lỗi và chữ gõ sau khi gửi; không nhận phản hồi sau đóng. Codex review thêm: begin kiểm ready, key gồm owner mong đợi, dispose đồng bộ khi đóng, không xóa file selection từ token cũ, không tự suy kết quả toggle khi receipt hỏng. Server giữ category mặc định của caller cũ, replay so cả sampleQuestion với JSON canonical.

## Bằng chứng đợt này

- Tái hiện trước lock: http-share-version-before-lock.log FAIL, HTTP copy concurrent500/unique ID; cleanup fixture đã chạy. Đây là log có lỗi được giữ lại, không dùng báo đạt.
- Unit mới: unit-memory-share.log 13/13 đạt; gồm9memory context/draft/parser và4share copy. Lint lint-memory-share.log exit0 sạch phạm vi11tệp.
- Build cuối build-memory-share.log exit0, TypeScript và46trang đạt, NEXT_BUILD_CPUS=2; máy chủ3117 đã dừng trước build rồi mở lại production vào examcraft_test_20261022. SAFE safe-memory-share.log 268/268, fail0/skip0, giới hạn2worker và chạy sau build. HTTP http-memory-share.log 27/27, fail0/skip0; ba JSON http_workflows/http_auth/http_public_policies đều PASS/cleanupComplete.
- HTTP mới kiểm: copy đồng thời cùng ID; retry/bản gốc đổi/SOURCE_CHANGED/bản riêng đã sửa và bản legacy đều giữ; mọi memory POST sai pin với JSON hỏng bị chặn trước body/provider, GET/export/DELETE sai pin bị chặn, anon/origin bị chặn. Manual note concurrent/replay/canonical sample/đổi nội dung409/default category/foreign update404/delete0/export private/delete then update404. AI usage không tăng ở ca từ chối. Không gọi provider thật.
- Kiểm unit-share-version.log trước tích hợp:10/10; typecheck-share-version.log exit0. Build-share-version.log trước lock cũng đạt nhưng không phải build cuối; lint-share-version.log có1cảnh báo điều hướng đã sửa bằng useRouter, lint cuối sạch. Không tuyên bố lint toàn repo sạch.
- CUA thử lại getState vẫn lỗi kernel assets/path (os error3). Không có UI mới, không coi unit/context/API là bằng chứng tương tác browser.

## Giới hạn còn mở

- Copy một lần mỗi phiên bản nguồn, không có nút tạo nhiều bản độc lập cùng phiên bản. Bản riêng đã sửa thì retry409 để mở từ kho; không tự tạo bản khác che mất thay đổi. Không tự đồng bộ bản sao khi nguồn đổi.
- Source/version/permission đọc trước transaction tạo bản sao: chưa kiểm race nguồn/link bị sửa hoặc thu hồi đúng lúc request đang chạy. Không khẳng định thu hồi tức thì/atomic. Lock mới chỉ bảo vệ concurrent create cùng đích.
- Hình ngoài kho, hai browser độc lập, download Word thực tế, copy sau nguồn đổi qua React chưa kiểm do CUA. CV048 giữ mở.
- Memory form chỉ trong RAM đúng context; đóng có xác nhận mất draft, chưa có journal bền qua reload. Activate là cờ riêng chưa CAS, ghi cuối thắng. Analyze bị abort ở client vẫn có thể hoàn thành server và lưu đề xuất inactive; chưa gọi AI thật để nghiệm thu chất lượng.
- Không tổng nghiệm thu hoặc đóng CV từ số test; checklist chính vẫn là nguồn tiêu chí.

## Phối hợp tiếp

- Codex7 giữ tích hợp memory/runtime và copy. Claude8 được giao ApiKeyModal async/account/form, chỉ helper/unit/code đã khoanh vùng; chưa xác nhận8 tại mốc viết. Gemini4 được giao làm chính xác điều kiện và bằng chứng hai audit, chưa xác nhận4; generation3 đã sửa false-positive chính nhưng còn cách diễn đạt quá mức và gộp điều kiện. Không dùng audit cũ như chứng nhận an toàn.
