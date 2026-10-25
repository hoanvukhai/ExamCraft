# CDX-R5 — gom log đã commit

Đã thực hiện41gitmv vào chay-tho/, khôngxóa. RAW_RUN_ARCHIVE.json ghi từng đường cũ/mới vàSHA256, kiểm bytegiữ nguyên sau chuyển. scripts/archive-raw-qa.cjs mặc định dryrun; --execute mới chuyển.

Chỉ xét tệp đãcommit, đang ở gốc qa/rebuild-2026-10-25 và đúng mẫu rawlog/JSONcủa nhiệm vụ. Đọc mọi báo cáo.md và manifest.json (kể cả chưa commit trong docs/qa); tệp nào cóbasenameđượcnhắc đến được giữ lại. Tệpcó thayđổi workingtree cũng không chuyển. Giữ40tệpđượcdẫn;138rawfileuntracked để nguyên theo yêu cầu phạmvi. Không di chuyển tài liệu nguồn, ảnh, DB, backup hoặc log đangchạy.

Không có liênkết.md cần đổi: tất cả tệp được.md/manifest dẫn đều giữ đúng chỗ. Chọn bảo toàn tham chiếu thay vì chỉ quét hyperlink. Danh sáchdi chuyển đầyđủ có trongRAW_RUN_ARCHIVE.json, đườngmới nằmtrongchay-tho/. Repo đã ignore server-*.log/pilot-run-*.json mới theoquytắcClaude; không tựxóa hoặc force-add hàngloạtrawfile.

Kiểm:41tệpđích đúnghash trướcchuyển; gitdiffrenames100%,0thayđổi nội dung. Không chạy lạiDB/build chỉ để dọn báo cáo.
