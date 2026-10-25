import test from 'node:test';
import assert from 'node:assert/strict';
import {position,trajectory,makeModel,preset,fold,Timeline} from '../lib/model.mjs';
import {server} from '../server.mjs';
test('Первый кадр до отметки запуска не даёт отрицательное время в обоих режимах',()=>{
 for(const kind of ['rational','irrational']){
  const c=new Timeline(),m=makeModel(preset(kind));
  c.play(105);
  assert.equal(c.value(100),0);
  assert.doesNotThrow(()=>trajectory(m,c.value(100)));
  assert.ok(c.value(121)>0);
  c.pause(1105);
  c.play(2005);
  assert.equal(c.value(2000),1);
  assert.doesNotThrow(()=>position(m,c.value(2000)));
 }
});
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('Отражения от четырёх стен и скорость после удара',()=>{
 for(const [vx,vy,t,x,y,ex,ey] of [[1,0,.9,.9,.5,-1,0],[-1,0,.3,.1,.5,1,0],[0,1,.6,.2,.9,0,-1],[0,-1,.6,.2,.1,0,1]]){const p=position({a:1,b:1,x0:.2,y0:.5,vx,vy},t);near(p.x,x);near(p.y,y);near(p.vx,ex);near(p.vy,ey);}
});
test('Угол: обе компоненты отражаются одновременно',()=>{const p=position({a:1,b:1,x0:.5,y0:.5,vx:1,vy:1},.5);near(p.x,1);near(p.y,1);near(p.vx,-1);near(p.vy,-1);});
test('Скорость сохраняется, координаты всегда внутри',()=>{const m=makeModel({a:3,b:5,angle:219,speed:4});for(let i=0;i<2000;i++){const p=position(m,i*.137);assert.ok(p.x>=0&&p.x<=m.a&&p.y>=0&&p.y<=m.b);near(Math.hypot(p.vx,p.vy),4);}});
test('Развёртка совпадает с независимым событийным расчётом',()=>{
 const m=makeModel({a:3,b:2,angle:147,speed:3,x:.31,y:.42});let x=m.x0,y=m.y0,vx=m.vx,vy=m.vy,time=0;
 for(let i=0;i<100;i++){const tx=vx>0?(m.a-x)/vx:-x/vx,ty=vy>0?(m.b-y)/vy:-y/vy,dt=Math.min(tx,ty);x+=vx*dt;y+=vy*dt;time+=dt;if(Math.abs(dt-tx)<1e-9)vx=-vx;if(Math.abs(dt-ty)<1e-9)vy=-vy;const p=position(m,time);near(p.x,x);near(p.y,y);near(p.vx,vx);near(p.vy,vy);}
});
test('Период возвращает положение и направление',()=>{const m=makeModel(preset());const T=4*m.a/m.vx,p=position(m,T);near(p.x,m.x0);near(p.y,m.y0);near(p.vx,m.vx);near(p.vy,m.vy);});
test('Ломаная содержит точки точных столкновений',()=>{const m={a:1,b:1,x0:.2,y0:.3,vx:1,vy:.5};const tr=trajectory(m,4);assert.equal(tr.length,8);for(const p of tr.slice(1,-1))assert.ok(Math.min(p.x,1-p.x,p.y,1-p.y)<1e-9);});
test('Пауза, продолжение и сброс часов; независимость от частоты кадров',()=>{for(const fps of [30,60,144]){const c=new Timeline();c.play(100);for(let i=1;i<fps*3;i++)c.value(100+i*1000/fps);near(c.value(3100),3);c.pause(3100);near(c.value(5000),3);c.play(6000);near(c.value(7000),4);c.pause(7000);c.seek(0,7000);near(c.value(10000),0);}});
test('Отрицательные координаты и проверка входных данных',()=>{near(fold(-.3,1),.3);assert.throws(()=>position({a:0,b:1,x0:0,y0:0,vx:1,vy:1},1));assert.throws(()=>position(makeModel(),NaN));});
test('HTTP: страница, ресурсы и неизвестный путь',async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const base=`http://127.0.0.1:${server.address().port}`;for(const f of ['/','/app.js','/app.css'])assert.equal((await fetch(base+f)).status,200);assert.equal((await fetch(base+'/server.mjs')).status,404);}finally{await new Promise(r=>server.close(r));}});
