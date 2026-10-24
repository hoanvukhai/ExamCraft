# Hoàn thiện pilot — báo cáo đợt 25/10/2026

## Kết quả

Codex chuyển về làm một mình theo yêu cầu mới của chủ dự án; không chờ Claude/Gemini. Giữ nguyên các bàn giao đã tích hợp. Đợt này hoàn thiện nhóm lưu dữ liệu, kiểm giao diện/offline, CSV nhận xét, CI và hướng dẫn. Không phải tuyên bố hoàn tất toàn bộ phạm vi 78 CV hoặc nghiệm thu chuyên môn.

Mốc mã local: `789d1aa` (lưu câu đổi và CAS), `5a5408b` (CSV nhận xét, bộ kiểm browser, CI). Không push/reset/clean; không migration mới, không thêm bảng/journal. Không ghi DB chính, không gọi provider thật hoặc dùng khóa thật. QA chỉ ở `127.0.0.1:3117` / `examcraft_test_20261022`.

[Manifest kiểm cuối](verification.json) ghi commit mã, build ID và hash tệp chính. QA3117 đã xác nhận dừng sau kiểm; giữ Docker và mọi dữ liệu hiện có.

## 1. Lưu đề và lịch sử câu — CV025/074

- Đọc câu hiện có theo lô; kiểm cả chủ sở hữu của câu đã tách khỏi đề.
- Chỉ cập nhật và tạo lịch sử khi các trường thực sự ghi xuống DB thay đổi; so JSON theo khóa, Decimal theo giá trị lưu. Điểm lẻ hơn hai chữ số không làm sinh lịch sử lặp do cột điểm làm tròn.
- Xóa ảnh/nguồn/giấy phép/điểm trong snapshot đầy đủ thực sự xóa giá trị cũ; giữ điểm 0.
- CAS riêng từng câu chặn người ghi độc lập chen vào sau bước đọc; trả xung đột và rollback cả giao dịch thay vì ghi đè câu mới.
- Ghi liên kết câu và lịch sử theo lô. Câu mới vẫn tạo từng dòng để lấy snapshot DB chính xác; chưa tối ưu phần tạo mới thành createMany.
- Giữ mọi lịch sử cũ. ExamRevision vẫn chụp toàn tài liệu theo phiên bản, kể cả ảnh; chưa giảm phần dung lượng này. Undo còn giới hạn đã ghi trong checklist.

Kiểm trực tiếp PostgreSQL: lưu lặp, đổi thứ tự, sửa một câu, xóa trường, xóa/ghép lại liên kết, thêm câu, đề rỗng, điểm lẻ, khôi phục xóa mềm, rollback, sai chủ, nền cũ và ghi câu đồng thời. Dữ liệu giả được dọn theo ID của từng lượt.

Đề mẫu 40 câu có ảnh: lưu không đổi/reorder **15 truy vấn**, sửa một câu **17 truy vấn**; ví dụ lưu không đổi 66–105ms, sửa một câu 71ms trên máy này. Đây là đo local từng giao dịch, không phải công suất nhiều người hoặc đo so sánh thời gian với mã cũ. Con số khoảng 170 truy vấn của thiết kế cũ là ước lượng đọc mã ở báo cáo trước, không phải benchmark trước/sau.

Bằng chứng: [question-save.json](question-save.json), [integration.log](integration.log), [integration_s1.json](integration_s1.json). Integration **8/8** đạt, gồm các subtest của S1.

## 2. Giao diện và offline — CV010/024/048/050

- F3 kiểm Song song có đúng ngữ liệu chung một lần và đủ hàng câu; thêm fixture Ngữ văn ngữ liệu dài cùng dùng bởi nhiều câu. Fixture vẫn là dữ liệu kỹ thuật, chưa duyệt chuyên môn.
- F5 kiểm giáo viên thấy giờ mở/đóng, số lượt và mã đã đặt; học sinh bắt đầu sau hạn bị từ chối.
- F9 tắt mạng trong context trình duyệt đang mở: giữ nội dung trong localStorage, DB chưa đổi, reconnect lưu được. Sau reload online tiếp tục sửa offline; một phiên API khác lưu bản mới; reconnect giữ bản máy chủ và nháp cũ; nút phục hồi tạo đề riêng có hậu tố “(Bản sao phục hồi)”.
- Chrome và Edge cài sẵn chạy độc lập theo lượt; không tải browser. Chưa kiểm hai engine sửa đồng thời, mở ứng dụng từ đầu khi hoàn toàn offline hoặc mọi parent journal/storage lỗi.
- Soát lại mã/HTTP hiện có: sao chép link theo phiên bản nguồn đã được triển khai và kiểm; xóa việc lặp này khỏi hàng đợi hồ sơ 02. Publication snapshot riêng vẫn là thiết kế, chưa triển khai.

| Lượt kiểm | Build ID | Kết quả | Bằng chứng |
|---|---|---|---|
| Chrome F1–F7 và F9, trước bổ sung CSV nhận xét | `0ZR-udEX0sCvS9nqvUGJR` | **8/8**, cleanup đạt | [JSON](pilot-run-0eab1188-5c6c-4d2b-86cc-267e2be422ed.json), [log](pilot-chrome-final.log) |
| Edge F9 | cùng build trên | **1/1**, cleanup đạt | [JSON](pilot-run-ca488cc5-f0be-4cf5-b472-ed184254841c.json), [log](pilot-edge-offline.log) |
| Chrome F7 sau bổ sung CSV nhận xét | `QQpcA2zF_i_LCPLcpiew-` | **1/1**, cleanup đạt | [JSON](pilot-run-872b6276-e97a-478c-a97e-648b41ad8552.json), [log](pilot-chrome-csv.log) |

Lượt đầu F9 thất bại vì bộ kiểm tìm sai tên bản sao, thiếu hậu tố phục hồi. Đã sửa kỳ vọng test; không sửa sản phẩm để lách lỗi. Giữ [JSON lượt đầu](pilot-run-57eafe3a-1e0c-4d7a-bcf5-68758c0882be.json) và ảnh/log để truy vết. `pilot-results.json` luôn là lượt gần nhất (hiện F7), không dùng nó để suy toàn bộ suite đã chạy trên cùng build cuối. Thay đổi ứng dụng giữa hai build đạt chỉ là CSV; đã kiểm lại HTTP và F7 liên quan, không chạy lại các luồng editor không đổi.

F8 sao lưu/khôi phục kế thừa bằng chứng PowerShell5.1 của [đợt trước](../rebuild-2026-10-24/PILOT_CLAUDE_INTEGRATION.md); không chạy lại để sửa tài liệu.

## 3. CSV nhận xét — CV061

CSV bài có điểm bổ sung cột “Nhận xét câu …” sau các cột cũ. Không thay điểm hoặc ghi lại bài làm; bài không số giữ cách xuất đánh giá cũ. Ô có dấu phẩy/ngoặc kép/CR/LF được quote; nội dung bắt đầu công thức được vô hiệu hóa cho bảng tính.

Kiểm unit dấu câu/xuống dòng/điểm 0/formula và HTTP thực: nhận xét có công thức được escape, tổng 0/0 giữ đúng, cookie học sinh không được xuất CSV giáo viên, bài không số không xuất điểm giả. Browser chấm thật và tải CSV chứa nhận xét đã gửi.

## 4. Kiểm cuối và CI — CV074

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| SAFE | **328/328** node:test; bước test:unit cũng đạt | [safe.log](safe.log) |
| HTTP trên bản cuối | **33/33** | [http.log](http.log), [workflows](http_workflows.json), [public policies](http_public_policies.json), [auth](http_auth.json), [options](http_assignment_options.json) |
| Build/typecheck bản cuối | đạt, **46** trang, 1 CPU / heap1024 | [build.log](build.log) |
| Lint các tệp mã đổi | đạt; không suy lint toàn repo sạch | [lint-final.log](lint-final.log), [lint-changed.log](lint-changed.log), [lint-csv.log](lint-csv.log) |
| YAML workflow | đọc được bằng js-yaml | kiểm tĩnh local; workflow remote chưa chạy |

CI thêm DB thử riêng, migrate deploy, integration và HTTP sau build; đợi health xác minh isolatedTest, dừng server cuối đợt, không tải log/artifact ra ngoài. Wrapper server đã bỏ yêu cầu phải có tệp .env, cho phép lấy cấu hình từ môi trường CI; nhánh chạy không có .env chưa được diễn tập riêng. Chưa push nên chưa có bằng chứng chạy GitHub Actions. Lệnh tương ứng đã chạy local; không coi đó là CI remote đạt.

Lần thử sandbox không tới được DB và không tạo được thư mục build có dấu ngoặc; chạy lại với quyền thực thi phù hợp trên đúng đích đã đạt. Máy ít RAM nên tất cả kiểm dài chạy tuần tự. Bộ duyệt an toàn từ chối đề xuất tự tải log lên GitHub; phương án đó đã bỏ, báo cáo giữ local.

Bằng chứng HTTP dùng timestamp UTC của ngày24; sao vào thư mục ngày local25 này và khôi phục báo cáo ngày cũ từ Git, tránh ghi đè bằng chứng lịch sử.

## 5. Hồ sơ và giới hạn bàn giao

Đã cập nhật vai trò solo, trạng thái02, dòng hiện trạng của checklist chính và hướng dẫn giáo viên. Không tạo checklist/master cạnh tranh. Hướng dẫn bỏ tham chiếu mã nguồn và lời hứa tuyệt đối, sửa nhãn nộp bài và phân biệt kiểm reload online với offline thật.

Chưa tổng nghiệm thu: Word/PDF nhiều trang cần mở xem thực tế; chất lượng AI/provider thật chưa kiểm; chưa đủ gói môn/lớp được giáo viên duyệt; publication riêng, regrade nâng cao, một số cộng tác/nháp phụ và các nhóm sau pilot vẫn theo checklist. Không tự ký duyệt thay giáo viên, không lấy số test để đóng các CV này.

Chủ dự án có thể bắt đầu thử các luồng lõi bằng [hướng dẫn ngắn](../../docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md) và [thẻ Word/offline](../../docs/huong-dan/THE_KIEM_TAY_GIAO_BAI_VA_WORD.md). Bản thử cần ưu tiên kiểm giao diện dễ hiểu, Word/in trang dài và tình huống dùng thật. Kiểm tay này không tự thay nghiệm thu chuyên môn hoặc toàn bộ backlog sau pilot.
