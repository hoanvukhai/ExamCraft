const fs=require('node:fs'),p=require('node:path'),crypto=require('node:crypto');
const root=__dirname,base=p.resolve(root,'../..');
const registry=JSON.parse(fs.readFileSync(p.join(base,'05_DANH_MUC_HOP_NHAT.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(p.join(root,'sach-va-hoc-lieu.json'),'utf8'));
const matrix=JSON.parse(fs.readFileSync(p.join(root,'ma-tran-lop-mon.json'),'utf8'));
const raw=JSON.parse(fs.readFileSync(p.join(root,'hoc-lieu-nxb-dom.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(p.join(root,'nguon/manifest.json'),'utf8'));
const errors=[];
if(new Set(registry.records.map(x=>x.id)).size!==registry.records.length)errors.push('Trùng mãSRC/TK');
for(let i=1;i<=52;i++)if(!registry.records.find(x=>x.id==='SRC-'+String(i).padStart(3,'0')))errors.push('Thiếu SRC'+i);
for(let i=1;i<=67;i++)if(!registry.records.find(x=>x.id==='TK-'+String(i).padStart(4,'0')))errors.push('Thiếu TK'+i);
if(catalog.books.length!==302)errors.push('Lệch302trang sách');
if(new Set(catalog.books.map(x=>x.url)).size!==302)errors.push('URLtrang sách lặp');
if(new Set(catalog.books.flatMap(x=>x.links.map(l=>l.url))).size!==1876)errors.push('Lệch1876URL');
if(matrix.rows.length!==161||new Set(matrix.rows.map(x=>x.grade)).size!==12)errors.push('Lệch bảng lớp/môn');
for(const f of manifest){const b=fs.readFileSync(p.join(root,'nguon',f.file));if(b.length!==f.bytes||crypto.createHash('sha256').update(b).digest('hex')!==f.sha256)errors.push('Sai hash '+f.file);}
const brokenLocalLinks=[];
const scanDirs=[base,p.resolve(base,'../ke-hoach-2026-10-21')];
const targets=[];
for(const dir of scanDirs)for(const name of fs.readdirSync(dir))if(name.endsWith('.md'))targets.push(p.join(dir,name));
targets.push(p.join(root,'SACH_VA_HOC_LIEU.md'),p.join(root,'MA_TRAN_LOP_MON.md'));
for(const file of targets){const txt=fs.readFileSync(file,'utf8');for(const m of txt.matchAll(/\]\(([^)]+)\)/g)){let s=m[1];if(/^(https?:|#)/.test(s))continue;if(s.startsWith('<')&&s.endsWith('>'))s=s.slice(1,-1);s=s.replace(/#.*$/,'').replace(/:\d+$/,'');const full=/^[A-Z]:[\\/]/i.test(s)?s:p.resolve(p.dirname(file),s);if(!fs.existsSync(full))brokenLocalLinks.push({file:p.relative(base,file),target:s});}}
const result={date:'2026-10-22',scope:'Chỉ kiểm tài liệu nghiên cứu; không test ứng dụng',registryRecords:registry.records.length,bookPages:catalog.books.length,resourceURLs:1876,coreGradeSubjectRows:matrix.rows.length,pdfHashesChecked:manifest.length,grades:[...new Set(matrix.rows.map(r=>r.grade))],rowsWithoutBookPage:matrix.rows.filter(r=>!r.bookPages.length).map(r=>`${r.grade}:${r.subject}`),pagesWithNoResourceLinks:catalog.books.filter(b=>!b.links.length).map(b=>b.id),possibleBadPages:raw.books.filter(b=>/Tên miền chưa được đăng ký|404 Not Found|Access Denied/.test(b.state)).map(b=>b.url),errors,brokenLocalLinks};
fs.writeFileSync(p.join(root,'KIEM_TRA_HO_SO.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(errors.length||brokenLocalLinks.length)process.exitCode=1;
