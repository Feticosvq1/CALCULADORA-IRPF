const $=id=>document.getElementById(id);
const N=id=>Math.max(0,Number($(id).value)||0);
const SI=id=>$(id).value==="SI";
const euro=n=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.max(0,n));
const pct=n=>new Intl.NumberFormat("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.max(0,n)*100)+" %";

const STATE=[[0,12450,.095],[12450,20200,.12],[20200,35200,.15],[35200,60000,.185],[60000,300000,.225],[300000,Infinity,.245]];
const AND=[[0,13000,.095],[13000,21000,.12],[21000,35200,.15],[35200,50000,.185],[50000,300000,.225],[300000,Infinity,.225]];

function progressive(base,table){return table.reduce((s,[lo,hi,r])=>s+(base>lo?Math.max(0,Math.min(base,hi)-lo)*r:0),0)}
function childMin(n,v){if(n<=0)return 0;if(n===1)return v[0];if(n===2)return v[0]+v[1];if(n===3)return v[0]+v[1]+v[2];return v[0]+v[1]+v[2]+v[3]+(n-4)*v[3]}

function calculate(){
  const gross=N("gross"), ss=1200, union=0, other=2000;
  // Excel: B6 = gross - Seguridad Social; B10 = B6 - gastos generales - reducción laboral.
  const netPrev=Math.max(0,gross-ss-union);
  let reduction=0;
  if(netPrev<14852) reduction=7302;
  else if(netPrev<17673.52) reduction=7302-(netPrev-14047.5)*1.75;
  else if(netPrev<19747.5) reduction=2364.34-(netPrev-17673.52)*1.75;
  reduction=Math.max(0,reduction);
  const base=Math.max(0,netPrev-other-reduction);

  const children=Math.floor(N("children"));
  const under3=Math.min(children,Math.floor(N("under3")));
  const childDis=Math.min(children,Math.floor(N("childDis")));
  const mono=SI("mono");

  // Excel DATOS: child minimum by child order + under-3 uplift + 1,200 € per disabled child.
  const childBaseState=childMin(children,[2400,2700,4000,4500])+under3*2800;
  const childBaseAnd=childMin(children,[2510,2820,4170,4700])+under3*2920;
  const childrenState=childBaseState+childDis*1200;
  const childrenAnd=childBaseAnd+childDis*1200;
  const ds=mono?childrenState:childrenState/2;
  const da=mono?childrenAnd:childrenAnd/2;

  const a65=Math.floor(N("asc65")), a75=Math.floor(N("asc75"));
  function ax(dis,help,state){
    const d33=state?3000:3130,d65=state?9000:9390,h=state?3000:3130;
    return (dis==="MAYOR 65%"?d65:dis==="MAYOR 33%"?d33:0)+(help==="SI"?h:0)
  }
  const as=a65*(1150+ax($("ascDis65").value,$("ascHelp65").value,true))+a75*(1400+ax($("ascDis75").value,$("ascHelp75").value,true));
  const aa=a65*(1200+ax($("ascDis65").value,$("ascHelp65").value,false))+a75*(1460+ax($("ascDis75").value,$("ascHelp75").value,false));

  const ms=5550+ds+as, ma=5790+da+aa;
  // Excel B50/B51 minus B52/B53: calculate tax on base less tax on the applicable minimum.
  const state=Math.max(0,progressive(base,STATE)-progressive(ms,STATE));
  const andalucia=Math.max(0,progressive(base,AND)-progressive(ma,AND));
  const annual=state+andalucia, rate=gross?annual/gross:0, monthly=annual/12;

  $("annual").textContent=euro(annual); $("rate").textContent=pct(rate); $("monthly").textContent=euro(monthly);
  $("detailBody").innerHTML=[
    ["Ingreso bruto",euro(gross)],["Seguridad Social",euro(ss)],["Rendimiento neto previo",euro(netPrev)],
    ["Otros gastos deducibles",euro(other)],["Reducción trabajo",euro(reduction)],["Base liquidable",euro(base)],
    ["Mínimo por descendientes estatal (incluye discapacidad)",euro(childrenState)],
    ["Mínimo por descendientes Andalucía (incluye discapacidad)",euro(childrenAnd)],
    ["Mínimos estatal totales",euro(ms)],["Mínimos Andalucía totales",euro(ma)],
    ["Cuota estatal tras mínimos",euro(state)],["Cuota autonómica tras mínimos",euro(andalucia)],
    ["RETENCIÓN ANUAL (equivalente a Excel B62)",euro(annual)]
  ].map(x=>`<div class="row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
}
document.querySelectorAll("input,select").forEach(e=>{e.addEventListener("input",calculate);e.addEventListener("change",calculate)});
$("toggle").addEventListener("click",()=>{const d=$("detailBody");d.hidden=!d.hidden;$("toggle").querySelector("span").textContent=d.hidden?"＋":"−"});
calculate();
