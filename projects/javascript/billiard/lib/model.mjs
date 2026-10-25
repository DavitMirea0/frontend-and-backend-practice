// Lengths are abstract units, time is seconds. Position is evaluated directly.
export const mod = (x, n) => ((x % n) + n) % n;
export function fold(q, length) {
  const r = mod(q, 2 * length);
  return length - Math.abs(r - length);
}
function axis(q, v, length) {
  const r = mod(q, 2 * length), eps = 1e-10;
  // At the collision instant report the outgoing velocity (right limit).
  if (r < eps || 2 * length - r < eps) return {p:0, v:Math.abs(v)};
  if (Math.abs(r-length) < eps) return {p:length, v:-Math.abs(v)};
  return {p:fold(q,length), v:r < length ? v : -v};
}
export function validate(m) {
  if (![m.a,m.b,m.x0,m.y0,m.vx,m.vy].every(Number.isFinite) || m.a<=0 || m.b<=0 || m.x0<0 || m.x0>m.a || m.y0<0 || m.y0>m.b) throw new RangeError('Некорректные параметры модели');
}
export function position(m,t) {
  validate(m);
  if (!Number.isFinite(t) || t<0) throw new RangeError('Время должно быть неотрицательным');
  const ux=m.x0+m.vx*t, uy=m.y0+m.vy*t;
  const x=axis(ux,m.vx,m.a), y=axis(uy,m.vy,m.b);
  return {x:x.p,y:y.p,vx:x.v,vy:y.v,ux,uy};
}
export function trajectory(m,t) {
  position(m,t);
  const times=[0,t];
  for(const [start,v,L] of [[m.x0,m.vx,m.a],[m.y0,m.vy,m.b]]) {
    if (Math.abs(v)<1e-14) continue;
    const end=start+v*t;
    for(let k=Math.ceil(Math.min(start,end)/L);k<=Math.floor(Math.max(start,end)/L);k++) {
      const hit=(k*L-start)/v;
      if(hit>1e-10 && hit<t-1e-10) times.push(hit);
    }
  }
  times.sort((a,b)=>a-b);
  return times.filter((v,i)=>!i || v-times[i-1]>1e-9).map(t=>({...position(m,t),t}));
}
export function makeModel({a=6,b=6,speed=2,angle=26.565051177,ratio=null,x=.2,y=.3}={}) {
  const theta=ratio===null?angle*Math.PI/180:Math.atan(ratio);
  return {a,b,x0:x*a,y0:y*b,vx:speed*Math.cos(theta),vy:speed*Math.sin(theta)};
}
export function preset(kind='rational') {
  return {a:6,b:6,speed:2,angle:Math.atan(kind==='rational'?.5:Math.SQRT2)*180/Math.PI,ratio:kind==='rational'?.5:Math.SQRT2,x:.2,y:.3,kind};
}
// A monotonic wall-clock anchor avoids accumulating frame deltas.
export class Timeline {
  constructor(){this.base=0;this.anchor=null;}
  // The first animation frame can carry a timestamp preceding the click's
  // performance.now() anchor. Do not advance backwards before that anchor.
  value(now){return this.base+(this.anchor===null?0:Math.max(0,now-this.anchor)/1000);}
  play(now){if(this.anchor===null)this.anchor=now;}
  pause(now){this.base=this.value(now);this.anchor=null;}
  seek(t,now){this.base=t;if(this.anchor!==null)this.anchor=now;}
}
