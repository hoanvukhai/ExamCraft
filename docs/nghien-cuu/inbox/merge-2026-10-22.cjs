const fs = require('fs');
const crypto = require('crypto');
const base = 'docs/nghien-cuu';
const dest = base + '/inbox/2026-10-22-ban-giao';
fs.mkdirSync(dest, {recursive:true});
const names = ['BAN_GIAO_TIM_TAI_LIEU.md','DANH_MUC_DA_TIM.md','EXAMCRAFT_DANH_MUC_DEN_DOT_03.md','EXAMCRAFT_BAN_GIAO_SAU_DOT_03.md','EXAMCRAFT_DOT_03.md'];
const manifest = [];
for (const name of names) {
  const paths = ['F:/Downloads/'+name, 'F:/Downloads/'+(name.startsWith('EXAMCRAFT_')?'EXAMCRAFT_BAN_GIAO_SAU_DOT_03/':'EXAMCRAFT_BAN_GIAO_2_TEP/')+name];
  for (const p of paths) { const data = fs.readFileSync(p); manifest.push({source:p,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex'),stored:name}); }
  fs.copyFileSync(paths[0],dest+'/'+name);
}
if(manifest.some((v,i)=>i%2 && v.sha256!==manifest[i-1].sha256)) throw Error('Copies differ');
fs.writeFileSync(dest+'/manifest.json',JSON.stringify({received:'2026-10-22',files:manifest,shares:['https://chatgpt.com/share/6ad8f27a-20a0-83ec-b6b1-da7a2be549b5','https://chatgpt.com/share/6ad8f51b-0900-83ec-8da7-dcc353d07e32'],shareAccess:'Đã đọc nội dung hiển thị qua trình duyệt; không tải tệp từ chat.'},null,2));
const read = p=>fs.readFileSync(p,'utf8');
const rows = (s,prefix)=>s.split(/\r?\n/).filter(l=>new RegExp('^\\| '+prefix+'-\\d+ \\|').test(l));
const tk=rows(read(dest+'/'+names[2]),'TK');
const old=rows(read(dest+'/'+names[1]),'TK');
const src=[...rows(read(base+'/NGUON_VA_GOI.md'),'SRC'),...rows(read(base+'/01_DANH_MUC_TAI_LIEU_TU_TIM.md'),'SRC')];
if(tk.length!==54||src.length!==52||old.length!==40)throw Error(JSON.stringify({tk:tk.length,src:src.length,old:old.length}));
if(old.some((r,i)=>r!==tk[i]))throw Error('Original 40 changed');
const corrections={
 'TK-0017':'Đã có 4 phụ lục ở TK-0045–0048; không còn thiếu cả bốn.',
 'TK-0020':'Đã mở lại trang Công báo 22/10, ghi ngày ban hành/hiệu lực 12/09/2025; PDF Công báo vẫn lỗi qua công cụ; chưa so bản.',
 'TK-0041':'Đã đọc mục IV PDF 22/10: A1/A2/B theo cấp; cần lưu trình độ riêng với lớp.',
 'TK-0035':'Đã mở PDF 24 trang 22/10; scan không có text trích xuất; chưa chốt quan hệ thay thế.',
 'SRC-003':'Cùng chủ đề TK-0004; bản thay thế để đọc, chưa xác nhận cùng bytes/ấn bản.',
 'SRC-009':'Trùng URL SRC-003; liên hệ TK-0004.',
 'SRC-004':'Cùng văn bản TT32 với TK-0001; khác nơi lưu.',
 'SRC-006':'Cùng chủ đề tổng thể2018 TK-0002; chưa so nội dung.',
 'SRC-005':'Bản hợp nhất không gộp với bản gốc TK-0002 khi chưa xác định phiên bản.',
 'SRC-007':'Liên hệ TK-0019 bản sửa đổi2022; giữ nguồn tin làm đầu mối.',
 'SRC-008':'Liên hệ TK-0017 và TK-0045–0048; không đếm lại phụ lục.',
 'SRC-014':'Trùng URL SRC-010.', 'SRC-020':'Trùng URL SRC-002.', 'SRC-046':'Trùng URL SRC-030.',
 'SRC-039':'Liên hệ TK-0003; chưa xác nhận cùng phiên bản.',
 'SRC-048':'Đã tìm PDF QĐ3588 và QĐ185; xem kiểm tra bổ sung trong 04.',
 'SRC-049':'Đã đọc Điều1–2 PDF QĐ3588 bản lưu trường; xem 04.',
 'SRC-050':'Cần đối chiếu thêm TT23/2025; không dùng riêng TT17/2023 làm quy tắc hiện hành.'
};
let table='# Danh mục hợp nhất SRC và TK\n\nCập nhật 22/10/2026. Sổ tra cứu hiện hành; bản gốc giữ trong inbox. **106 mã kế thừa = 52 SRC + 54 TK, không phải 106 tài liệu độc lập.** Bảy SRC-031–037 là nhu cầu; một số mã trùng URL, một số là trang tin/cổng; bốn phụ lục NN1 dùng hai PDF. Chưa có PDF nguồn được lưu trong bộ bàn giao.\n\nTrạng thái kế thừa là lời ghi của lượt trước; chỉ cột đính chính ghi rõ kiểm tra ngày 22/10 mới là kiểm tra lại. Đã mở không có nghĩa đã duyệt. Xem báo cáo 04 và hàng đợi 06 trước khi tìm tiếp.\n\n| Mã | Nội dung và nguồn gốc | Phạm vi / loại | Trạng thái kế thừa | Đính chính / quan hệ |\n|---|---|---|---|---|\n';
const records=[];
for (const r of src) {
 const c=r.split('|').slice(1,-1).map(x=>x.trim()), id=c[0];
 const note=corrections[id]||(+id.slice(4)>=31&&+id.slice(4)<=37?'Nhu cầu tìm, không phải nguồn đã thu.':'Giữ trạng thái kế thừa; chưa kiểm lại toàn văn.');
 records.push({id,raw:r,note});
 if (+id.slice(4)<=3) table+=`| ${id} | ${c[1]} | ${c[3]} | ${c[2]}; ${c[4]} | ${note} |\n`;
 else table+=`| ${id} | ${c[2]} | ${c[1]}; ${c[3]} | ${c[4]} | ${note} |\n`;
}
for (const r of tk) {
 const c=r.split('|').slice(1,-1).map(x=>x.trim()),id=c[0];
 let note=corrections[id]||'Giữ ghi nhận đợt trước; chưa kiểm lại toàn văn.';
 if(['TK-0045','TK-0046'].includes(id))note='Hai phụ lục Nga/Nhật chung một PDF; khác NN2 2018.';
 if(['TK-0047','TK-0048'].includes(id))note='Hai phụ lục Pháp/Trung chung một PDF; khác NN2 2018.';
 records.push({id,raw:r,note}); table+=`| ${id} | ${c[1]}; ${c[4]}; ${c[5]}; Trang: ${c[6]}; Tệp: ${c[7]} | ${c[2]}; ${c[3]} | ${c[8]} | ${note} |\n`;
}
fs.writeFileSync(base+'/05_DANH_MUC_HOP_NHAT.md',table);
fs.writeFileSync(base+'/05_DANH_MUC_HOP_NHAT.json',JSON.stringify({date:'2026-10-22',legacyRecords:106,notDistinctDocuments:true,records},null,2));
console.log(JSON.stringify({filesReceived:manifest.length,uniqueFiles:5,tk:tk.length,src:src.length,original40Unchanged:true,duplicateCopiesIdentical:true}));
