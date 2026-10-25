export function validateWait(a,b){if(![a,b].every(v=>Number.isFinite(v)&&v>=0&&v<=60))throw new RangeError('Ожидание: от 0 до 60 минут');}
export function exactProbability(a,b){validateWait(a,b);return 1-((60-a)**2+(60-b)**2)/7200;}
export function meets(x,y,a,b){return y-x<=a&&x-y<=b;}
// Mulberry32: reproducible teaching simulation, not a cryptographic generator.
export function random32(seed){if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new RangeError('Seed: целое от 0 до 4294967295');let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
export function createSimulation({a=10,b=12,seed=46}={}){
 validateWait(a,b);const rng=random32(seed);return{a,b,seed,rng,n:0,hits:0,points:[],history:[],last:null};
}
export function advance(s,count){
 if(!Number.isInteger(count)||count<0||s.n+count>1000000)throw new RangeError('Не более 1 000 000 опытов');
 for(let i=0;i<count;i++){
  const x=60*s.rng(),y=60*s.rng(),hit=meets(x,y,s.a,s.b);s.n++;if(hit)s.hits++;
  s.last={x,y,hit};if(s.points.length<800)s.points.push(s.last);
  if(s.n<=10||s.n%100===0)s.history.push({n:s.n,p:s.hits/s.n});
 }
 return s;
}
export function snapshot(s){return{a:s.a,b:s.b,seed:s.seed,n:s.n,hits:s.hits,p:s.n?s.hits/s.n:null,points:s.points.slice(),history:s.history.slice(),last:s.last};}
export function simulate(options,n=150000){return snapshot(advance(createSimulation(options),n));}
