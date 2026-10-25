import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {questions, topics, diagnosticIds} from './data/questions.mjs';
import {analyze} from './lib/matrix.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const bank = new Map(questions.map(q => [q.id,q]));
export function grade(answers) {
  if (!Array.isArray(answers) || !answers.length || answers.length > questions.length) throw new Error('Нужен непустой список ответов');
  const seen = new Set();
  const review = answers.map(a => {
    const q = a && bank.get(a.id);
    if (!q || seen.has(a.id) || !Number.isInteger(a.choice) || a.choice < 0 || a.choice >= q.options.length) throw new Error('Некорректный или повторный ответ');
    seen.add(a.id);
    return {...q, choice:a.choice, isCorrect:a.choice===q.correct};
  });
  const M = review.map(q => topics.map((_,j) => +(j===q.topic)));
  const r = review.map(q => +!q.isCorrect);
  return {topics, M, r, ...analyze(M,r), correct:review.filter(q=>q.isCorrect).length, total:review.length, review};
}
const send = (res,status,data) => {
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
};
export const server = createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    if(req.method==='GET' && url.pathname==='/api/questions') {
      const topic = url.searchParams.get('topic');
      if(topic !== null && !['0','1','2'].includes(topic)) return send(res,400,{error:'Неизвестная тема'});
      const selected = topic===null ? diagnosticIds.map(id=>bank.get(id)) : questions.filter(q=>q.topic===Number(topic));
      return send(res,200,{topics,questions:selected.map(({correct,explanation,...q})=>q)});
    }
    if(req.method==='GET' && url.pathname==='/api/demo') {
      const wrong = new Set(['k1','d1','d2']);
      const answers = diagnosticIds.map(id => {const q=bank.get(id);return {id,choice:wrong.has(id)?(q.correct+1)%q.options.length:q.correct};});
      return send(res,200,{...grade(answers),demo:true});
    }
    if(req.method==='POST' && url.pathname==='/api/grade') {
      let raw='';
      for await(const chunk of req) {raw+=chunk;if(raw.length>16000)return send(res,413,{error:'Слишком большой запрос'});}
      try {return send(res,200,grade(JSON.parse(raw).answers));}
      catch {return send(res,400,{error:'Проверьте формат и полноту ответов'});}
    }
    const staticFiles = {'/':['index.html','text/html; charset=utf-8'],'/index.html':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/app.css':['app.css','text/css; charset=utf-8']};
    const asset=staticFiles[url.pathname];
    if(req.method==='GET' && asset) {
      const data=await readFile(path.join(root,'dist',asset[0]));
      res.writeHead(200,{'Content-Type':asset[1],'X-Content-Type-Options':'nosniff'});return res.end(data);
    }
    return send(res,404,{error:'Страница не найдена'});
  } catch {send(res,500,{error:'Не удалось обработать запрос'});}
});
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.PORT || 3000);
  server.listen(port,'127.0.0.1',()=>console.log(`Формула / Матрица: http://localhost:${port}`));
  server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'Порт занят. Закройте предыдущий сервер или задайте PORT.':err.message);process.exitCode=1;});
}
