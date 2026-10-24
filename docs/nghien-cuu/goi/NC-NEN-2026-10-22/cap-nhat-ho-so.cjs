const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../..');
const p=path.join(base,'05_DANH_MUC_HOP_NHAT.json');
const data=JSON.parse(fs.readFileSync(p,'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'nguon/manifest.json'),'utf8'));
const fileUrl=n=>manifest.find(x=>x.file===n).url;
const items=[
 ['TT89/2026 sửa quy định đánh giá',fileUrl('TT89-2026.pdf'),'Tiểu học/THCS/THPT; văn bản sửa đổi','Đã tải, đọc scan10trang; hiệu lực01/12/2026, chưa hiệu lực tại22/10/2026','Bản lưu cơ sở giáo dục; không dùng trạng thái hiệu lực trên trang thay Điều24'],
 ['QĐ2904/2022 đính chính TT27',fileUrl('QD2904-2022.pdf'),'Biểu mẫu đánh giá tiểu học','Đã tải và đọc2trang','Đính chính phần Tin học/Công nghệ; không thay toàn TT27'],
 ['QĐ3588/2025 danh mục SGK',fileUrl('QD3588-2025.pdf'),'Danh mục130mục, từ năm2026–27','Đã tải, đọc văn bản và trích phụ lục','130 mục không đồng nghĩa130tệp; liên hệ SRC049 là bài thông tin, chưa hợp nhất bằng bytes'],
 ['QĐ185/2026 bổ sung SGK',fileUrl('QD185-2026.pdf'),'Danh mục99mục, có ngôn ngữ/NN2','Đã tải, xem7trang; ngày29/01/2026','Sửa ngày09/01 ở đầu mối cũ; NN2 theo quyển không tự gán lớp'],
 ['Cổng tập huấn NXB và hồ sơ học liệu','https://taphuan.nxbgd.vn/tap-huan','302trang chi tiết, lớp1–12 và nhánh','Đã mở từng trang;1876URL học liệu khác nhau; chưa đọc các tệp con','Hồ sơ con NXB0001–0302 trong gói; không cộng vào số tài liệu đã duyệt; hạn chế kinh doanh'],
 ['TT14/2026 chương trình Tiếng Raglai','https://congbao.cdnchinhphu.vn/180507251028987904/2026/4/2/cong-bao-so-179-ngay-03-04-47095_1775113721_signed.pdf','Tiểu học; Công báo179','Đã đọc nhận diện và mụcVIII, trang32–33; hiệu lực03/05/2026','Chưa đọc toàn chương trình; bổ sung ngoài8tiếng trong TT34/2020'],
 ['Dự thảo sửa chương trình2026','https://xaydungchinhsach.chinhphu.vn/toan-van-du-thao-thong-tu-sua-doi-bo-sung-mot-so-noi-dung-trong-chuong-trinh-giao-duc-pho-thong-119260820174117596.htm','Dự thảo; theo dõi','Đã nhận diện là dự thảo; chưa xác minh văn bản ký thay thế','Không áp như quy định có hiệu lực'],
 ['VBHN02/2026 quy chế thi tốt nghiệp','https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/02-vbhn-bgddt.pdf','Quy chế thi, liên quan TT13/2026','Đầu mối PDF chính thức; chưa đánh giá toàn văn','Phân biệt thi tốt nghiệp với định kỳ và thi thử'],
 ['Đề Toán1 cuối HKI2025–26','https://thnguyenvantroi.haiphong.edu.vn/giao-an-de-kiem-tra/de-kiem-tra-cuoi-hoc-ki-1-mon-toan-lop-1-nam-hoc-2025-2026/ct/17225/564402','TH Nguyễn Văn Trỗi; Hải Phòng','Đã mở trang thấy tệp.doc; chưa đọc tệp','Chưa xác minh đáp án/điểm/ma trận'],
 ['Đề Tiếng Việt2 cuối kỳ2','https://thvinhphong-tienphong.haiphong.edu.vn/khoi-2/de-kiem-tra-tieng-viet-cuoi-ki-2-lop-2/ctmb/23719/331023','TH Vĩnh Phong–Tiền Phong','Trang có.docx; đích tải lỗi công cụ','Ngày đăng22/02/2025 không tự xác định năm học đề'],
 ['Đề Công nghệ8 giữa HKI','https://th-thcslekhaccan.haiphong.edu.vn/thu-vien-de-kiem-tra/kiem-tra-giua-ki-1-mo-cong-nghe-8/ctmb/9160/522449','TH–THCS Lê Khắc Cẩn','Trang có.docx tên25–26; chưa đọc tệp','Chưa đủ bộ đề/chấm/ma trận'],
 ['Đề và đáp án Ngữ văn11 cuối HKII2025–26','https://thptthanhmienii.haiphong.edu.vn/van-the-mi/de-dap-an-kiem-tra-cuoi-ki-2-mon-ngu-van-lop-11-2025-2026/vbct/42494/663657','THPT Thanh MiệnII','Đã mở trang và thấy nhãn tệp Word','Chưa kiểm nội dung đáp án và rubric; ma trận là liên kết liên quan'],
 ['Ứng viên đề Âm nhạc6–9 HKI2024–25','https://thcslythuongkiet.edu.vn/files/CUOI%20HKI/%C4%90%E1%BB%81%20ki%E1%BB%83m%20tra%20cu%E1%BB%91i%20k%E1%BB%B3%20I%20NH%E1%BA%A0C_%206%2C7%2C8%2C9%20%2824-25%29.pdf','THCS Lý Thường Kiệt; biểu diễn/đánh giá','Tìm được URL; mở lại cache miss','Chưa đọc/duyệt; không tính là bộ rubric đã đủ']
];
for(let i=0;i<items.length;i++){const [title,url,scope,status,note]=items[i],id='TK-'+String(55+i).padStart(4,'0');const r={id,raw:`| ${id} | [${title}](${url}) | ${scope} | ${status} | ${note} |`,note:'Kiểm22/10/2026: '+note,title,url,scope,status,checkedAt:'2026-10-22'};const idx=data.records.findIndex(x=>x.id===id);if(idx<0)data.records.push(r);else data.records[idx]=r;}
const updates={
 'SRC-001':'Đọc lại3trang22/10/2026: phạm vi THPT; phụ lục tham khảo. Bản lưu bổ sung https://cdn.thuvienphapluat.vn/uploads/tintuc/2024/12/19/20241210-Cong-van-7991-huong-dan-KTDGDK.pdf ; không áp chung mọi cấp/môn.',
 'SRC-002':'Quan hệ cập nhật: TK0056 QĐ2904 đính chính biểu mẫu; TK0055 TT89 sửa đổi từ01/12/2026. Không gắn TT89 đã hiệu lực tại22/10.',
 'SRC-020':'Liên hệ SRC002 cùng TT27; thêm QĐ2904 và TT89 (từ01/12/2026).',
 'SRC-021':'Đọc Điều5–7 bản Công báo22/10: https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2021/7/36881/40026-1-2021725-72622-2021-tt-bgddt.pdf ; thêm TT89 từ01/12/2026.',
 'SRC-048':'Đã mở bản thông báo trên tên miền NXB chính thức: https://nxbgd.vn/bai-viet/nha-xuat-ban-giao-duc-viet-nam-thong-bao-ve-viec-su-dung-sach-giao-khoa-nam-hoc-2026-2027 ;11đầu sách chỉnh sửa; không suy mọi sách cũ vô hiệu.',
 'TK-0018':'Đọc bản Công báo2trang: https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2021/7/34076/36399-1-2021697-69820-2021-tt-bgddt.pdf ; ban hành01/07/2021, hiệu lực16/08/2021, chuyển tiếp Tin học THCS.',
 'TK-0019':'Đã tải TT13-2022.pdf từ Chính phủ; đọc trang1–2 về chương trình tổng thểTHPT. Không đánh dấu đã đọc toàn bộ phụ lục.',
 'TK-0020':'CSDL mở lại403; kiểm bài thông tin chính thức https://xaydungchinhsach.chinhphu.vn/thong-tu-so-17-2025-tt-bgddt-sua-doi-bo-sung-mot-so-noi-dung-trong-chuong-trinh-giao-duc-pho-thong-119250916145653739.htm ; chưa đối chiếu từng dòng5phụ lục.',
 'TK-0036':'TT34 bao phủ8tiếng; bổ sung riêng TK0060 TT14/2026 Raglai, không suy TT34 bao phủ tất cả tiếng dân tộc hiện có.'
};
for(const [id,note]of Object.entries(updates)){const r=data.records.find(x=>x.id===id);if(r)r.note=note;}
data.lastResearchPass='2026-10-22-foundation';data.totalRecords=data.records.length;data.newRecords=items.length;data.linkedBookCatalog='goi/NC-NEN-2026-10-22/sach-va-hoc-lieu.json';
fs.writeFileSync(p,JSON.stringify(data,null,2));
let md=fs.readFileSync(path.join(base,'05_DANH_MUC_HOP_NHAT.md'),'utf8');
md=md.replace('Chưa có PDF nguồn được lưu trong bộ bàn giao.','Bộ bàn giao gốc không có PDF; lượt nghiên cứu tiếp theo đã lưu5PDF có manifest. Thêm13mã TK0055–0067, tổng119bản ghi; không phải119tài liệu độc lập. Danh mục con NXB giữ riêng302trang sách.');
for(const [id,note]of Object.entries(updates)){md=md.split('\n').map(line=>{if(!line.startsWith('| '+id+' |'))return line;const ix=line.lastIndexOf('|',line.lastIndexOf('|')-1);return line.slice(0,ix+1)+' '+note+' |';}).join('\n');}
md=md.replaceAll('| undefined |','| Chưa ghi riêng trong bản kế thừa |');
if(!md.includes('## Bổ sung nguồn nền'))md+='\n\n## Bổ sung nguồn nền và đầu mối22/10/2026\n\nĐánh giá chi tiết tại [báo cáo07](07_CHOT_NGUON_NEN_VA_DANH_GIA.md). Học liệu con không cộng vào số mãSRC/TK.\n\n| Mã | Nguồn | Phạm vi | Mức kiểm tra | Giới hạn |\n|---|---|---|---|---|\n'+data.records.filter(x=>items.some((_,i)=>x.id==='TK-'+String(55+i).padStart(4,'0'))).map(r=>r.raw).join('\n')+'\n';
fs.writeFileSync(path.join(base,'05_DANH_MUC_HOP_NHAT.md'),md);
console.log(JSON.stringify({records:data.records.length,newRecords:items.length,lastId:'TK-0067'}));
