import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze} from '../lib/matrix.mjs';
import {grade,server} from '../server.mjs';
import {questions,diagnosticIds} from '../data/questions.mjs';
const M=[[1,0,0],[1,0,0],[0,1,0],[0,1,0],[0,0,1],[0,0,1]];
test('Пример из презентации: e = (1,2,0), p = (0.5,1,0)',()=>{
  assert.deepEqual(analyze(M,[1,0,1,1,0,0]),{errors:[1,2,0],counts:[2,2,2],rates:[.5,1,0],recommended:[1]});
});
test('Нормализация меняет рекомендацию при разном числе вопросов',()=>{
  const v=analyze([[1,0],[1,0],[1,0],[1,0],[0,1]],[1,1,0,0,1]);
  assert.deepEqual(v.rates,[.5,1]);assert.deepEqual(v.recommended,[1]);
});
test('Нет данных, нет ошибок и равенство долей обрабатываются явно',()=>{
  assert.deepEqual(analyze([[1,0]],[0]).rates,[0,null]);
  assert.deepEqual(analyze([[1,0]],[0]).recommended,[]);
  assert.deepEqual(analyze([[1,0],[0,1]],[1,1]).recommended,[0,1]);
});
test('Неверные размеры и не бинарные значения отклоняются',()=>{
  for(const [m,r] of [[[],[]],[[[1,0]],[1,0]],[[[1,1]],[0]],[[[1,0]],[2]],[[[1,0],[1]],[0,1]]]) assert.throws(()=>analyze(m,r));
});
test('Каждый вопрос имеет единственный ключ и корректный индекс ответа',()=>{
  assert.equal(new Set(questions.map(q=>q.id)).size,18);
  assert.deepEqual([0,1,2].map(t=>questions.filter(q=>q.topic===t).length),[6,6,6]);
  for(const q of questions){assert.equal(q.options.length,4);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);}
  const result=grade(questions.map(q=>({id:q.id,choice:q.correct})));
  assert.equal(result.correct,18);assert.deepEqual(result.rates,[0,0,0]);
});
test('Подмена, пропуски и повторные ответы отклоняются',()=>{
  for(const a of [[],[{id:'unknown',choice:0}],[{id:'k1',choice:9}],[{id:'k1'}],[{id:'k1',choice:0},{id:'k1',choice:0}]]) assert.throws(()=>grade(a));
});
test('HTTP: вопросы без ключей, итог, демонстрация, ошибки запросов',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    const data=await (await fetch(base+'/api/questions')).json();
    assert.equal(data.questions.length,6);assert.ok(data.questions.every(q=>!('correct'in q)&&!('explanation'in q)));
    const demo=await(await fetch(base+'/api/demo')).json();assert.deepEqual(demo.errors,[1,2,0]);assert.equal(demo.demo,true);
    const all=await fetch(base+'/api/grade',{method:'POST',body:JSON.stringify({answers:diagnosticIds.map(id=>{const q=questions.find(q=>q.id===id);return {id,choice:q.correct};})})});
    assert.equal((await all.json()).correct,6);
    assert.equal((await fetch(base+'/api/questions?topic=5')).status,400);
    assert.equal((await fetch(base+'/api/grade',{method:'POST',body:'bad'})).status,400);
    assert.equal((await fetch(base+'/missing')).status,404);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
