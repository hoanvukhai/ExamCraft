# CV027 — Tiêu đề, dòng in và bảo vệ chỉnh sửa (23/10/2026)

## Đã sửa

- `src/lib/header-layout.ts`: layout v1 tối đa30dòng có ID riêng, liên kết trường cho phép hoặc dòng văn bản riêng, vị trí trái/phải/cuối đề, căn trái/giữa/phải, thứ tự và hidden. Không có override dùng dữ liệu liên kết; override chuỗi rỗng giữ1dòng trống; hidden bỏ dòng. Không dùng hidden để xóa tên quản lý đề bắt buộc.
- Bộ giải dòng dùng cùng dữ liệu hiện tại cho A4 và Word: môn/lớp, thời gian, tổng điểm thực tế theo cấu hình câu/phần đã chọn; giữ0, thiếu điểm báo chưa đủ, không lấy mục tiêu plan làm điểm thực tế. Năm học/học kỳ/ghi chú được đưa vào bản in. Dòng mặc định rỗng được bỏ, không sinh cơ quan/trường giả. Bố cục riêng có thể ghi đè văn bản chủ động, không tự nhận phù hợp mẫu chính thức.
- `HeaderSettingsModal`: bỏ cơ chế ghi toàn bộ metadata cũ và timeout tự đóng. Chỉ gửi patch trường cho phép đã sửa kèm baseline và documentId; root gọi applyHeaderSubmission trong updater. Helper chặn trường đã đổi, đề khác hoặc mất quyền bằng trả nguyên đối tượng, không setState trong updater. Dialog giữ draft khi metadata không liên quan cập nhật hoặc apply bị chặn; chỉ hiển thị đã áp dụng khi metadata từ parent khớp submission. Không nhận lưu server trước phản hồi lưu đề.
- Đổi lớp giữ nguyên môn/khung cũ và hiện option/cảnh báo cần chọn lại nếu không phù hợp; không tự chọn môn đầu, xóa framework/gói/scope/plan hoặc quy đổi mã. Gói/plan sai ngữ cảnh vẫn cần rà soát theo kiểm hiện hành.
- `src/types/exam.ts` và normalizer kiểm layout ở biên nhập/tài liệu; layout sai không vào luồng render từ import hợp lệ. `A4Preview` và `docx-export` dùng chung bộ giải, custom lines/blank/hidden/align và footer. Không đổi nội dung câu/đáp án. `ExamPlanEditor` rút gọn hướng dẫn điểm theo yêu cầu UX.
- CV021 template cá nhân/API/nguyên bản/quyền nguồn chưa triển khai trong nhóm này; không migration hoặc ghi DB.

## Kiểm mới

- `node --import tsx --test tests/header_layout.test.ts tests/exam_plan_exports.test.ts tests/portable_and_exports.test.ts`:29/29đạt, gồm8ca header,5ca mục tiêu/Word,16ca hồi quy nhập/xuất.
-8ca header kiểm: patch giữ metadata/plan và không đổi câu; field mới hơn/cross-document/mất quyền no-op và giữ submission; đổi grade giữ ngữ cảnh cũ để review; blank/hidden/binding/order roundtrip; year/notes/time/actual0/missing/section fallback/survey; mặc định không sinh trường giả + malformed/max30; patch không hợp lệ; XML Word tạo thật có căn dòng riêng/ẩn tên/year/footer/actualscore và không đáp án/lời giải trong view exam.
- Rerun8/8ca header sau bổ sung assert bảo toàn package/scope thật đạt. Focused ESLint helper/modal/plan UI/test exit0. Root chạy typecheck/build tích hợp; không chạy đồng thời theo yêu cầu tiết kiệm RAM.
- Không khởi động/tắt server, không build/typecheck riêng, không ghi DB hoặc gọi AI/provider.

## Giới hạn

- Root tích hợp: [build](build-header-layout.log)45trang/typecheck đạt; [SAFE](safe-header-layout.log)20+153=173đạt; [HTTP](http-header-layout.log)16/16đạt mới. Layout/override rỗng lưu/mở nguyên dạng; layout trùng ID bị400và giữ bản trước; public share không có layout riêng. Không nhận lint toàn repo sạch.
- Browser app production3117/hai tab IAB, chỉ fixture DB thử: A mở dialog và nhập năm/ghi chú/ẩn tên in/thêm dòng trái căn phải; B lưu plan2và đổi tên đề. A nhận bản mới trong khi nháp dialog vẫn nguyên rồi Apply chỉ các trường sửa; tên/plan2mới của B giữ đúng. [Nháp và server mới](header-draft-newer-server.txt), [áp dụng giữ plan](header-applied-preserves-plan.txt).
- B đổi cùng trường năm học; A vẫn giữ nháp năm cũ, Apply báo xung đột, chưa ghi đè. [DOM](header-conflict-keeps-draft.txt). Đọc trực tiếp DB thử trước/sau xác nhận **version/hash metadata không đổi**, giữ plan2/câu/ảnh/lời giải/điểm0 và layout; [trước](header-before-conflict-db.json), [sau](header-after-conflict-db.json). Script chỉ đọc `scripts/verify-header-layout.cjs` gắn fixture ở mốc này, không tự chạy lại sau thay fixture.
- Đóng dialog QA rồi reload: tên quản lý mới còn, tên in ẩn, năm/ghi chú/dòng riêng căn phải còn và điểm0đúng. [DOM](header-after-reload.txt), [dòng/style DOM](header-after-reload-lines.json), [ảnh](header-after-reload.png). Đã xem ảnh ca ngắn không thấy tràn; còn bố cục Word/LibreOffice thực tế và tài liệu dài. XML không chứng minh mọi trang dài hoàn hảo.
- Bố cục hiện chia vùng trái/phải/cuối đề; thứ tự giữ trong từng vùng, chưa là trình thiết kế tự do mọi khối của tài liệu hoặc mẫu1–2cột nội dung.
- Nút lưu mẫu cá nhân và provenance/phiên bản/source template server còn ở CV021. CV027 còn nghiệm thu browser, in và mẫu; không đóng CV từ số test.

