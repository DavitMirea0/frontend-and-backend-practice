import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
export const server=createServer(async(req,res)=>{
  const files={'/':['index.html','text/html'],'/index.html':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/app.css':['app.css','text/css']};
  const file=files[new URL(req.url,'http://localhost').pathname];
  if(req.method!=='GET'||!file){res.writeHead(404);res.end('Not found');return;}
  try{const bytes=await readFile(path.join(root,'dist',file[0]));res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(bytes);}catch{res.writeHead(500);res.end('Build missing. Run npm run build.');}
});
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||3002);server.listen(port,'127.0.0.1',()=>console.log(`Бильярд: http://localhost:${port}`));
  server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Порт занят. Задайте другой PORT.':e.message);process.exitCode=1;});
}
