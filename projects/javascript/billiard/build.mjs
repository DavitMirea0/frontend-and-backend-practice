import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:{app:'src/main.jsx'},bundle:true,minify:true,outdir:'dist',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
await copyFile('src/index.html','dist/index.html');
console.log('Сборка готова: dist/');
