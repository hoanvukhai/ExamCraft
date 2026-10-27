/* eslint-disable @typescript-eslint/no-require-imports -- Read-only CommonJS audit CLI, run from repository root. */
const fs=require('node:fs'),cp=require('node:child_process'),ts=require('typescript');
const files=cp.execFileSync('git',['diff','--name-only','--','src/app','src/components/A4Preview.tsx'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(x=>x.endsWith('.tsx'));
function normalized(source,file){
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const result=ts.transform(ast,[context=>{
  const visit=node=>{
   if(ts.isJsxAttribute(node)&&['className','aria-label'].includes(node.name.getText(ast)))return undefined;
   if(file==='src/app/admin/keys/page.tsx'&&ts.isVariableDeclaration(node)&&node.name.getText(ast)==='pill')return ts.factory.updateVariableDeclaration(node,node.name,node.exclamationToken,node.type,ts.factory.createStringLiteral('PRESENTATION'));
   return ts.visitEachChild(node,visit,context);
  };return node=>ts.visitNode(node,visit);
 }]);
 const printed=ts.createPrinter().printFile(result.transformed[0]);result.dispose();return printed;
}
const results=files.map(file=>({file,equalOutsideClassNamesAndPill:normalized(fs.readFileSync(file,'utf8'),file)===normalized(cp.execFileSync('git',['show','af919b3:'+file],{encoding:'utf8'}),file)}));
fs.writeFileSync('qa/rebuild-2026-10-27/ui-page-review/source-audit.json',JSON.stringify({scope:'JSX classes, aria-label and admin/keys pill class constant only; CSS reviewed separately',results},null,2));
console.log(JSON.stringify(results)); if(results.some(x=>!x.equalOutsideClassNamesAndPill))process.exitCode=1;

