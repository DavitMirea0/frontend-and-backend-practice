import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {makeModel,position,trajectory,preset,Timeline} from '../lib/model.mjs';
import './style.css';
const fmt=(n,d=2)=>n.toLocaleString('ru-RU',{maximumFractionDigits:d,minimumFractionDigits:d});
function field(ctx,m,t,unfold,W,H) {
  const p=position(m,t), trace=trajectory(m,t), pad=48;
  let minX=0,maxX=m.a,minY=0,maxY=m.b;
  if(unfold){minX=Math.floor(Math.min(0,p.ux)/m.a)*m.a;maxX=Math.ceil(Math.max(m.a,p.ux)/m.a)*m.a;minY=Math.floor(Math.min(0,p.uy)/m.b)*m.b;maxY=Math.ceil(Math.max(m.b,p.uy)/m.b)*m.b;}
  const scale=Math.min((W-2*pad)/(maxX-minX),(H-2*pad)/(maxY-minY));
  const ox=(W-(maxX-minX)*scale)/2, oy=(H-(maxY-minY)*scale)/2;
  const X=x=>ox+(x-minX)*scale,Y=y=>H-oy-(y-minY)*scale;
  ctx.fillStyle='#103d35';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#356358';ctx.lineWidth=1;
  const stepX=unfold?m.a:1,stepY=unfold?m.b:1;
  for(let x=minX;x<=maxX+.001;x+=stepX){ctx.beginPath();ctx.moveTo(X(x),Y(minY));ctx.lineTo(X(x),Y(maxY));ctx.stroke();}
  for(let y=minY;y<=maxY+.001;y+=stepY){ctx.beginPath();ctx.moveTo(X(minX),Y(y));ctx.lineTo(X(maxX),Y(y));ctx.stroke();}
  ctx.fillStyle='#1b554744';ctx.fillRect(X(0),Y(m.b),m.a*scale,m.b*scale);
  ctx.strokeStyle='#9ec5b5';ctx.lineWidth=2;ctx.strokeRect(X(0),Y(m.b),m.a*scale,m.b*scale);
  ctx.lineWidth=2.4;ctx.strokeStyle='#edc96b';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(X(m.x0),Y(m.y0));
  if(unfold)ctx.lineTo(X(p.ux),Y(p.uy));else for(const q of trace)ctx.lineTo(X(q.x),Y(q.y));ctx.stroke();
  const bx=X(unfold?p.ux:p.x),by=Y(unfold?p.uy:p.y),vx=unfold?m.vx:p.vx,vy=unfold?m.vy:p.vy,speed=Math.hypot(vx,vy);
  const ex=bx+vx/speed*36,ey=by-vy/speed*36,angle=Math.atan2(ey-by,ex-bx);
  ctx.strokeStyle='#c9e6d7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(ex,ey);ctx.lineTo(ex-8*Math.cos(angle-.5),ey-8*Math.sin(angle-.5));ctx.moveTo(ex,ey);ctx.lineTo(ex-8*Math.cos(angle+.5),ey-8*Math.sin(angle+.5));ctx.stroke();
  ctx.fillStyle='#edc96b';ctx.beginPath();ctx.arc(X(m.x0),Y(m.y0),4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff9e9';ctx.beginPath();ctx.arc(bx,by,7,0,Math.PI*2);ctx.fill();
  ctx.font='16px Arial';ctx.fillStyle='#c7dcd3';ctx.fillText('0',X(0)-18,Y(0)+22);ctx.fillText(`${m.a}  x`,X(m.a)-18,Y(0)+24);ctx.fillText(`${m.b}  y`,X(0)-32,Y(m.b)-12);
  if(unfold){ctx.fillText('Зеркальные копии поля',22,27);}
  return {ox,oy,scale,minX,minY,maxY};
}
function App(){
  const [config,setConfig]=useState(preset()),[t,setT]=useState(0),[running,setRunning]=useState(false),[unfold,setUnfold]=useState(false);
  const clock=useRef(new Timeline()),canvas=useRef(null),mapping=useRef(null), model=makeModel(config),p=position(model,t);
  const period=4*config.a/model.vx;
  const isPreset=config.kind==='rational'&&config.a===config.b;
  useEffect(()=>{if(!running)return;let id;const tick=now=>{const value=clock.current.value(now);if(value>=120){clock.current.pause(now);clock.current.seek(120,now);setT(120);setRunning(false);return;}setT(value);id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[running]);
  useEffect(()=>{const c=canvas.current;mapping.current=field(c.getContext('2d'),model,t,unfold,c.width,c.height);},[config,t,unfold]);
  useEffect(()=>{const hide=()=>{if(document.hidden){clock.current.pause(performance.now());setT(Math.min(120,clock.current.value(performance.now())));setRunning(false);}};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
  function seek(value){clock.current.pause(performance.now());clock.current.seek(value,performance.now());setT(value);setRunning(false);}
  function reset(){seek(0);}
  function change(key,value){reset();setConfig(c=>({...c,[key]:value,...(key==='angle'?{ratio:null,kind:'custom'}:{})}));}
  function choose(kind){reset();setConfig(preset(kind));setUnfold(false);}
  function toggle(){const now=performance.now();if(running){clock.current.pause(now);setT(Math.min(120,clock.current.value(now)));}else{if(t>=120){clock.current.seek(0,now);setT(0);}clock.current.play(now);}setRunning(!running);}
  function click(e){if(unfold)return;const box=canvas.current.getBoundingClientRect(),m=mapping.current;const px=(e.clientX-box.left)*canvas.current.width/box.width,py=(e.clientY-box.top)*canvas.current.height/box.height;const x=(px-m.ox)/m.scale,y=(canvas.current.height-py-m.oy)/m.scale;if(x<0||x>config.a||y<0||y>config.b)return;reset();setConfig(c=>({...c,x:Math.max(.001,Math.min(.999,x/c.a)),y:Math.max(.001,Math.min(.999,y/c.b))}));}
  return <><header><a className="brand" href="/">БИЛЬЯРД<span> / лаборатория движения</span></a><span className="course">Математика для программирования · 3.2</span></header><main>
    <section className="intro"><div><p className="eyebrow">ГЕОМЕТРИЯ В ДВИЖЕНИИ</p><h1>Один шар.<br/>Два взгляда на траекторию.</h1></div><p>Запустите шар и разверните отражения в прямую. Исследуйте, когда движение повторяется.</p></section>
    <section className="lab" aria-label="Интерактивный бильярд"><div className="stage"><div className="stagebar"><div className="tabs" aria-label="Вид траектории"><button aria-pressed={!unfold} onClick={()=>setUnfold(false)}>Бильярд</button><button aria-pressed={unfold} onClick={()=>setUnfold(true)}>Развёртка</button></div><span className="state">{running?'В движении':t===0?'Готов к запуску':'Пауза'}</span></div>
      <canvas ref={canvas} width="900" height="570" onClick={click} aria-label="Поле бильярда: золотой след, светлый шар и стрелка скорости">Траектория показана на поле. Точные координаты доступны под ним.</canvas>
      <div className="readouts"><div><small>Время</small><strong>{fmt(t)} с</strong></div><div><small>Координаты (x; y)</small><strong>{fmt(p.x)}; {fmt(p.y)}</strong></div><div><small>Скорость (vₓ; vᵧ)</small><strong>{fmt(p.vx)}; {fmt(p.vy)}</strong></div></div>
      <p className="hint">{unfold?'Каждая клетка — зеркальная копия поля. Масштаб автоматически меняется.':'Щёлкните внутри поля, чтобы выбрать начальную точку. Или задайте её справа.'}</p>
    </div><aside><h2>Условия запуска</h2><div className="presets"><button className={config.kind==='rational'?'selected':''} onClick={()=>choose('rational')}>01 <span>Замкнутая<small>vᵧ / vₓ = 1/2</small></span></button><button className={config.kind==='irrational'?'selected':''} onClick={()=>choose('irrational')}>02 <span>Незамкнутая<small>vᵧ / vₓ = √2</small></span></button></div>
    <label>Угол запуска <output>{fmt(config.angle,2)}°</output><input aria-label="Угол запуска" type="range" min="0" max="359" step="1" value={config.angle} onChange={e=>change('angle',+e.target.value)}/></label>
    <label>Скорость <output>{fmt(config.speed,1)} ед/с</output><input aria-label="Скорость" type="range" min=".5" max="4" step=".1" value={config.speed} onChange={e=>change('speed',+e.target.value)}/></label>
    <div className="pair">{[['a','Ширина'],['b','Высота']].map(([k,label])=><label key={k}>{label}<select aria-label={label} value={config[k]} onChange={e=>change(k,+e.target.value)}>{[2,3,4,5,6,8,10,12].map(v=><option key={v}>{v}</option>)}</select></label>)}</div>
    <div className="pair">{[['x','x₀ / ширина'],['y','y₀ / высота']].map(([k,label])=><label key={k}>{label}<input aria-label={label} type="number" min=".001" max=".999" step=".05" value={+config[k].toFixed(3)} onChange={e=>{if(e.target.value!==''&&Number.isFinite(+e.target.value))change(k,Math.min(.999,Math.max(.001,+e.target.value)));}}/></label>)}</div>
    <div className="actions"><button className="primary" onClick={toggle}>{running?'Пауза':'Запустить'}</button><button onClick={reset}>Сброс</button></div>
    <button className="demo" onClick={()=>seek(isPreset?period:30)}>{isPreset?'Показать полный период':'Показать 30 секунд'}</button><p className="micro">Изменение параметров сбрасывает время. Один запуск ограничен 120 секундами.</p></aside></section>
    <section className="explain"><article><span className="index">01 / МОДЕЛЬ</span><h2>Отражается одна компонента</h2><p>У вертикальной стенки меняется знак vₓ, у горизонтальной — vᵧ. Модуль скорости сохраняется.</p><div className="formula">v = √(vₓ² + vᵧ²) = {fmt(config.speed,1)}</div></article><article><span className="index">02 / РАЗВЁРТКА</span><h2>Прямая через копии поля</h2><p>Сначала вычисляем X = x₀ + vₓt и Y = y₀ + vᵧt, затем возвращаем координаты в исходный прямоугольник зеркальным отображением.</p><div className="formula">x = a − |mod(X, 2a) − a|</div></article><article><span className="index">03 / ПОВТОРЕНИЕ</span><h2>{isPreset?`Период ${fmt(period)} с`:'Направление определяет повтор'}</h2><p>Для прямоугольника проверяют рациональность (a·vᵧ)/(b·vₓ), если vₓ ≠ 0. Для квадрата достаточно отношения vᵧ/vₓ.</p><p className="micro">√2 задаёт незамкнутую траекторию в точной математической модели. Конечный рисунок и числа JavaScript не доказывают непериодичность.</p></article></section>
    <footer><p>Идеальная модель: материальная точка, без трения и луз. В углу программа меняет знаки обеих компонент; это отдельное соглашение модели. Оси: x вправо, y вверх.</p><p>По заданию 3.2 П. Е. Рябова. <a href="https://math.uchicago.edu/~masur/handbook1.pdf" target="_blank" rel="noreferrer">Математическая основа: Masur & Tabachnikov, §§ 1.3–1.4</a></p></footer>
  </main></>;
}
createRoot(document.getElementById('root')).render(<App/>);
