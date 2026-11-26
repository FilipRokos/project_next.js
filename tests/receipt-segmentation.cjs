const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const sharp = require('sharp');
const { chromium } = require('playwright');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 try {
 const page = await browser.newPage();
 const source = ts.transpileModule(fs.readFileSync('lib/receipt-segmentation.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 await page.addScriptTag({content:'window.exports = {};\n'+source});
 const jpeg = await sharp({create:{width:80,height:40,channels:3,background:'#ef2020'}}).jpeg().withMetadata({orientation:6}).toBuffer();
 const result = await page.evaluate(async (jpeg) => {
  const {parseSegmentation,polygonGeometry,drawReceiptPreview,extractReceipt,receiptFilename}=window.exports;
  const fixture={detected:true,confidence:.95,polygon:[[.1,.1],[.9,.1],[.1,.9]],box:[.1,.1,.9,.9]};
  parseSegmentation(fixture);
  let invalid=false;try{parseSegmentation({...fixture,polygon:[[0,0],[1,1],[.5,.5]]})}catch{invalid=true}
  const empty=parseSegmentation({detected:false,confidence:0,polygon:[],box:null});
  const source=document.createElement('canvas');source.width=100;source.height=100;
  const ctx=source.getContext('2d');ctx.fillStyle='rgb(200,100,50)';ctx.fillRect(0,0,100,100);
  const image=await createImageBitmap(source);
  const preview=document.createElement('canvas');
  let exportsBeforeConfirmation=0;
  const originalToBlob=HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob=function(...args){exportsBeforeConfirmation++;return originalToBlob.apply(this,args)};
  drawReceiptPreview(image,fixture.polygon,preview);
  const previewExports=exportsBeforeConfirmation;
  const blob=await extractReceipt(image,fixture.polygon);
  HTMLCanvasElement.prototype.toBlob=originalToBlob;
  const output=await createImageBitmap(blob);
  const read=document.createElement('canvas');read.width=output.width;read.height=output.height;
  const out=read.getContext('2d');out.drawImage(output,0,0);
  const inside=Array.from(out.getImageData(10,10,1,1).data);
  const outside=Array.from(out.getImageData(70,70,1,1).data);
  const blue=Array.from(preview.getContext('2d').getImageData(20,20,1,1).data);
  const oriented=await createImageBitmap(new Blob([new Uint8Array(jpeg)],{type:'image/jpeg'}),{imageOrientation:'from-image'});
  const orientation=[oriented.width,oriented.height];
  image.close();output.close();oriented.close();
  return {previewExports,filename:receiptFilename("Nákup 5.11.2026"),pngName:receiptFilename("Receipt.PNG"),invalid,empty:empty.detected,inside,outside,blue,orientation,size:[read.width,read.height],mime:blob.type,clamp:polygonGeometry([[-.1,0],[1.1,0],[0,1.1]],100,100)};
 },Array.from(jpeg));
 assert.equal(result.previewExports,0);assert.equal(result.filename,"Nákup 5.11.2026.webp");assert.equal(result.pngName,"Receipt.webp");
 assert.equal(result.invalid,true);assert.equal(result.empty,false);
 assert.deepEqual(result.size,[80,80]);assert.equal(result.mime,'image/webp');
 assert.ok(result.inside.every((v,i)=>Math.abs(v-[200,100,50,255][i])<=3));assert.equal(result.outside[3],0);
 assert.notDeepEqual(result.blue,result.inside);assert.deepEqual(result.orientation,[40,80]);
 assert.equal(result.clamp.width,100);assert.equal(result.clamp.height,100);
 console.log('PASS: contract, no detection, degenerate polygon, normalized mapping, crop/clamp, transparent crop background, overlay exclusion, EXIF orientation');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
