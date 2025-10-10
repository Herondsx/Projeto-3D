// ÚNICA dependência: Three.js por URL (sem import-map, compatível Pages+iPad)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// ===== Helpers de CSS e números
const css = (v)=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const fmt = (v)=> isFinite(v)? new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(v)+' L' : '—';

// ===== Render, cena e câmera
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, preserveDrawingBuffer:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1115);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 220);
const target = new THREE.Vector3(0, 2.2, 0);
camera.position.set(14,10,14);

// ===== Controle de câmera (manual, leve, sem OrbitControls)
const ctrl = {
  theta: Math.atan2(camera.position.x - target.x, camera.position.z - target.z),
  phi: Math.acos((camera.position.y - target.y) / camera.position.distanceTo(target)),
  radius: camera.position.distanceTo(target),
  rotateSpeed: 0.006,
  zoomSpeed: 0.15,
  auto: false,
  autoSpeed: 1.2
};
function applyCam(){
  ctrl.phi = clamp(ctrl.phi, 0.05, Math.PI-0.05);
  ctrl.radius = clamp(ctrl.radius, 4, 60);
  const sinPhiR = Math.sin(ctrl.phi)*ctrl.radius;
  camera.position.set(
    target.x + sinPhiR*Math.sin(ctrl.theta),
    target.y + Math.cos(ctrl.phi)*ctrl.radius,
    target.z + sinPhiR*Math.cos(ctrl.theta)
  );
  camera.lookAt(target);
}
applyCam();

// arrastar (mouse/touch)
let dragging=false, lastX=0, lastY=0;
addEventListener('pointerdown', e=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; canvas.setPointerCapture?.(e.pointerId); });
addEventListener('pointerup',   e=>{ dragging=false; canvas.releasePointerCapture?.(e.pointerId); });
addEventListener('pointermove', e=>{
  if(!dragging) return;
  const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY;
  ctrl.theta -= dx*ctrl.rotateSpeed;
  ctrl.phi   -= dy*ctrl.rotateSpeed;
  applyCam();
},{passive:true});

// zoom com roda (em iPad pode ser trackpad ou acessório)
addEventListener('wheel', e=>{
  e.preventDefault();
  ctrl.radius *= (1 + Math.sign(e.deltaY)*ctrl.zoomSpeed);
  applyCam();
},{passive:false});

// pinch (gestures do Safari iOS)
addEventListener('gesturechange', e=>{
  e.preventDefault();
  const scale = e.scale; // ~1.0 neutro
  ctrl.radius *= (scale>1 ? 1+ctrl.zoomSpeed*0.5 : 1-ctrl.zoomSpeed*0.5);
  applyCam();
},{passive:false});

// botões de giro
const STEP = THREE.MathUtils.degToRad(10);
const $ = (id)=>document.getElementById(id);
$('camLeft').addEventListener('click', ()=>{ ctrl.theta += STEP; applyCam(); });
$('camRight').addEventListener('click',()=>{ ctrl.theta -= STEP; applyCam(); });
$('camUp').addEventListener('click',   ()=>{ ctrl.phi   -= STEP; applyCam(); });
$('camDown').addEventListener('click', ()=>{ ctrl.phi   += STEP; applyCam(); });
$('camReset').addEventListener('click',()=>{ camera.position.set(14,10,14); ctrl.theta=Math.atan2(14,14); ctrl.phi=Math.acos((10-2.2)/camera.position.distanceTo(target)); ctrl.radius=camera.position.distanceTo(target); applyCam(); });

// ===== Luzes
scene.add(new THREE.HemisphereLight(0xffffff, 0x20202c, 1.15));
const dir = new THREE.DirectionalLight(0xffffff, .9); dir.position.set(10,12,6); scene.add(dir);

// ===== Medidas
const L=12, W=8, H=3.2;

// ===== Piso e grade
scene.add(new THREE.GridHelper(40, 40, 0x3a3f4d, 0x2a2f3a));
const ground = new THREE.Mesh(new THREE.PlaneGeometry(20,16), new THREE.MeshStandardMaterial({color:0x161a22, roughness:.95}));
ground.rotation.x = -Math.PI/2; scene.add(ground);

// ===== Grupos
const gStructure = new THREE.Group(), gWater = new THREE.Group(), gWash = new THREE.Group();
scene.add(gStructure, gWater, gWash);

// ===== Pilares (6)
const pillarMat = new THREE.MeshStandardMaterial({color:new THREE.Color(css('--pillar'))});
const pillarGeom = new THREE.CylinderGeometry(0.10,0.10,H,24);
for(const x of [-L/2,0,L/2]) for(const z of [-W/2,W/2]){
  const p=new THREE.Mesh(pillarGeom,pillarMat);
  p.position.set(x,H/2,z); p.userData={name:'Pilar',desc:'Estrutura de sustentação do telhado.'}; gStructure.add(p);
}

// ===== Telhado
const roof = new THREE.Mesh(new THREE.BoxGeometry(L+0.5,0.15,W+0.5),
  new THREE.MeshPhysicalMaterial({color:new THREE.Color(css('--roof')), roughness:.6, metalness:.2, clearcoat:.6})
);
roof.position.set(0,H+0.1,0);
roof.userData={name:'Telhado',desc:'Superfície coletora (laranja).'}; gStructure.add(roof);

// ===== Calhas e tubos
const gutterMat = new THREE.MeshStandardMaterial({color:new THREE.Color(css('--gutter')), metalness:.6, roughness:.3});
const gutterMain = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.12,W+0.5), gutterMat);
gutterMain.position.set(L/2+0.35,H+0.02,0);
gutterMain.userData={name:'Calha principal',desc:'Beiral direito (longitudinal).'}; gStructure.add(gutterMain);

const gutterFront = new THREE.Mesh(new THREE.BoxGeometry(4,0.12,0.15), gutterMat);
gutterFront.position.set(L/2-1.0,H,W/2+0.35);
gutterFront.userData={name:'Calha frontal',desc:'Borda da frente → descida.'}; gStructure.add(gutterFront);

const downspout = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,H+0.2,24), gutterMat);
downspout.position.set(L/2+0.35,(H+0.2)/2,W/2+0.35);
downspout.userData={name:'Condutor vertical',desc:'Canto dianteiro direito.'}; gStructure.add(downspout);

const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,2.2,24), gutterMat);
pipe1.rotation.z=Math.PI/2; pipe1.position.set(L/2+0.35-1.1,0.1,W/2+0.35);
pipe1.userData={name:'Tubo até filtro',desc:'Tubulação no piso para a caixa de filtro.'}; gStructure.add(pipe1);

// Filtro, bomba
const filter = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.6,0.6), new THREE.MeshStandardMaterial({color:0xffd54f, roughness:.7}));
filter.position.set(L/2-1.7,0.35,W/2+0.35);
filter.userData={name:'Filtro (areia/carvão)',desc:'Tratamento inicial da água pluvial.'}; gStructure.add(filter);

const pump = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.45,0.45), new THREE.MeshStandardMaterial({color:0xd32f2f, roughness:.5, metalness:.4}));
pump.position.set(L/2-2.7,0.28,W/2+0.35);
pump.userData={name:'Bomba',desc:'Após o filtro, envia água ao reservatório.'}; gStructure.add(pump);

// Reservatório subterrâneo + tampão
const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,1.6,36), new THREE.MeshStandardMaterial({color:0x1976d2, metalness:.1, roughness:.7, transparent:true, opacity:.85}));
tank.position.set(L/2-4.4,-0.8,W/2+0.35);
tank.userData={name:'Reservatório subterrâneo (~2.000 L)',desc:'Enterrado; acesso pelo tampão.'}; gStructure.add(tank);

const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.06,32), new THREE.MeshStandardMaterial({color:0x424242, metalness:.2, roughness:.6}));
manhole.position.set(tank.position.x,0.03,tank.position.z);
manhole.userData={name:'Tampão de acesso',desc:'Inspeção do reservatório.'}; gStructure.add(manhole);

// Tubo até o subsolo
const pipeHoriz = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,1.0,24), gutterMat);
pipeHoriz.rotation.z = Math.PI/2; pipeHoriz.position.set(L/2-3.2,0.32,W/2+0.35); gStructure.add(pipeHoriz);
const pipeDrop  = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.5,24), gutterMat);
pipeDrop.position.set(L/2-3.7,-0.25,W/2+0.35); gStructure.add(pipeDrop);

// ===== Fluxo de água (linhas tracejadas)
const waterColor = new THREE.Color(css('--water'));
function dashed(points){
  const geo=new THREE.BufferGeometry().setFromPoints(points);
  const mat=new THREE.LineDashedMaterial({color:waterColor,dashSize:.35,gapSize:.18});
  const line=new THREE.Line(geo,mat); line.computeLineDistances(); gWater.add(line);
}
(function roofFlow(n=7){
  const y=H+0.18;
  for(let i=0;i<n;i++){
    const z=-W/2+(i+0.5)*(W/n);
    dashed([new THREE.Vector3(-L/2+0.3,y,z), new THREE.Vector3(L/2+0.25,y-0.08,z)]);
  }
})();
dashed([new THREE.Vector3(L/2+0.35,H+0.05,-W/2+0.2), new THREE.Vector3(L/2+0.35,H+0.02,W/2+0.28)]);
dashed([new THREE.Vector3(L/2-1.9,H,W/2+0.35), new THREE.Vector3(L/2+0.35,H,W/2+0.35)]);
dashed([new THREE.Vector3(L/2+0.35,H,W/2+0.35), new THREE.Vector3(L/2+0.35,0.12,W/2+0.35)]);
dashed([new THREE.Vector3(L/2+0.35,0.12,W/2+0.35), new THREE.Vector3(L/2-1.7+0.4,0.12,W/2+0.35)]);
dashed([new THREE.Vector3(L/2-1.7-0.4,0.12,W/2+0.35), new THREE.Vector3(L/2-2.7,0.12,W/2+0.35)]);
dashed([new THREE.Vector3(L/2-2.7-0.45,0.12,W/2+0.35), new THREE.Vector3(L/2-3.7,-0.4,W/2+0.35)]);
dashed([new THREE.Vector3(L/2-3.7,-0.4,W/2+0.35), new THREE.Vector3(L/2-4.4,-0.4,W/2+0.35)]);

// ===== Lava-rápido: faixas, ralo, lavadora, carro, arco, bancos, cones
function lane(x,z){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.02,6), new THREE.MeshStandardMaterial({color:0xffd54f,emissive:0x3a2a00,roughness:.6})); m.position.set(x,0.011,z); gWash.add(m); }
lane(-3,-2); lane(-3,2); lane(3,-2); lane(3,2);

const drain=new THREE.Mesh(new THREE.BoxGeometry(L-2,0.05,0.35), new THREE.MeshStandardMaterial({color:0x757575,metalness:.2,roughness:.6}));
drain.position.set(0,0.026,0); gWash.add(drain);
for(let i=-18;i<=18;i+=2){ const bar=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.06,0.34), new THREE.MeshStandardMaterial({color:0x9e9e9e,metalness:.35,roughness:.35})); bar.position.set(i*0.45,0.03,0); drain.add(bar); }

const washer=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,0.5), new THREE.MeshStandardMaterial({color:0x1565c0,metalness:.2,roughness:.7}));
washer.position.set(-5.2,0.31,-3.2); washer.userData={name:'Lavadora pressão',desc:'Canto traseiro esquerdo.'}; gWash.add(washer);

const hoseCoil=new THREE.Mesh(new THREE.TorusGeometry(0.25,0.06,12,48), new THREE.MeshStandardMaterial({color:0x111111,metalness:.3,roughness:.6}));
hoseCoil.rotation.x=Math.PI/2; hoseCoil.position.set(-5.2,0.55,-3.2); gWash.add(hoseCoil);

const wand=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,1.1,16), new THREE.MeshStandardMaterial({color:0x212121}));
wand.rotation.z=Math.PI/5; wand.position.set(-4.5,0.6,-2.7); gWash.add(wand);

const car=new THREE.Group();
const body=new THREE.Mesh(new THREE.BoxGeometry(2.8,0.7,1.4), new THREE.MeshStandardMaterial({color:0x616161,roughness:.8}));
body.position.y=0.45; car.add(body);
const roofCar=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.5,1.2), new THREE.MeshStandardMaterial({color:0x757575,roughness:.8}));
roofCar.position.set(0,0.95,0); car.add(roofCar);
const wheelGeom=new THREE.CylinderGeometry(0.35,0.35,0.3,20);
for(const [x,z] of [[-1.2,-0.6],[1.2,-0.6],[-1.2,0.6],[1.2,0.6]]){
  const w=new THREE.Mesh(wheelGeom,new THREE.MeshStandardMaterial({color:0x111111})); w.rotation.z=Math.PI/2; w.position.set(x,0.35,z); car.add(w);
}
car.position.set(3,0,0.5); gWash.add(car);

const arch=new THREE.Mesh(new THREE.TorusGeometry(1.4,0.05,12,48,Math.PI), new THREE.MeshStandardMaterial({color:0xcfd8dc,metalness:.1,roughness:.8}));
arch.rotation.z=Math.PI; arch.rotation.y=Math.PI/2; arch.position.set(-3,1.4,0); gWash.add(arch);

// ===== Chuva (leve)
const COUNT=480;
const rainPos=new Float32Array(COUNT*3);
for(let i=0;i<COUNT;i++){ rainPos[i*3+0]=THREE.MathUtils.randFloatSpread(L+2); rainPos[i*3+1]=H+5+Math.random()*3; rainPos[i*3+2]=THREE.MathUtils.randFloatSpread(W+2); }
const rainGeo=new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos,3));
const rainMat=new THREE.PointsMaterial({color:waterColor,size:0.06,transparent:true,opacity:.9});
const rain=new THREE.Points(rainGeo,rainMat); scene.add(rain);

// ===== Tooltip (hover)
const tip=document.createElement('div'); tip.id='tooltip'; tip.setAttribute('role','status'); tip.setAttribute('aria-live','polite'); document.body.appendChild(tip);
let tipTimer=null, tipsEnabled=true;
const selectable=[roof,gutterMain,gutterFront,downspout,pipe1,filter,pump,manhole,car,arch,washer,
  ...gStructure.children.filter(m=>m.geometry?.type==='CylinderGeometry'&&Math.abs((m.geometry.parameters?.height||0)-H)<1e-6)];
const raycaster=new THREE.Raycaster(), mouse=new THREE.Vector2(); let highlighted=null;

function showTip(html,x,y){
  tip.innerHTML=html; tip.classList.add('visible');
  const pad=14,w=tip.offsetWidth,h=tip.offsetHeight;
  const tx=Math.min(Math.max(x+12,pad),innerWidth-w-pad), ty=Math.min(Math.max(y+12,pad),innerHeight-h-pad);
  tip.style.transform=`translate(${tx}px,${ty}px)`;
}
function hideTip(){ tip.classList.remove('visible'); tip.style.transform='translate(-9999px,-9999px)'; }

function pick(e){
  if(!tipsEnabled) return hideTip();
  mouse.x=(e.clientX/innerWidth)*2-1; mouse.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const hit=raycaster.intersectObjects(selectable,true)[0];
  if(!hit){ hideTip(); if(highlighted){ highlighted.material?.emissive?.setHex(0x000000); highlighted=null; } return; }
  const m=hit.object, name=m.userData?.name||'Elemento', desc=m.userData?.desc?`<div style='opacity:.85; margin-top:2px'>${m.userData.desc}</div>`:'';
  showTip(`<b>${name}</b>${desc}`, e.clientX, e.clientY);
  if(highlighted && highlighted!==m){ highlighted.material?.emissive?.setHex(0x000000); }
  if(m.material && 'emissive' in m.material){ m.material.emissive.setHex(0x2255ff); highlighted=m; }
}
addEventListener('pointermove', pick, {passive:true});
addEventListener('pointerdown', e=>{ pick(e); clearTimeout(tipTimer); tipTimer=setTimeout(hideTip,2200); }, {passive:true});

// ===== UI de controles
const toggleWater = $('toggleWater'), toggleRain=$('toggleRain'), toggleTips=$('toggleTips'),
      toggleAuto=$('toggleAuto'), speed=$('speed'), speedVal=$('speedVal'),
      exportBtn=$('export');
toggleWater.addEventListener('change',()=>gWater.visible=toggleWater.checked);
toggleRain .addEventListener('change',()=>rain.visible=toggleRain.checked);
toggleTips .addEventListener('change',()=>{ tipsEnabled=toggleTips.checked; if(!tipsEnabled) hideTip(); });
toggleAuto.addEventListener('change',()=>ctrl.auto=toggleAuto.checked);
speed.addEventListener('input',()=>{ ctrl.autoSpeed=parseFloat(speed.value); speedVal.textContent=speed.value; });

exportBtn.addEventListener('click',()=>{ const url=renderer.domElement.toDataURL('image/png'); const a=document.createElement('a'); a.href=url; a.download='maquete-oficina.png'; a.click(); });

// ===== Sustentabilidade
const roofArea=$('roofArea'), runoff=$('runoff'), lossPct=$('lossPct'), rainAnnual=$('rainAnnual'),
      litersPerWash=$('litersPerWash'), washesPerDay=$('washesPerDay'),
      capYear=$('capYear'), capDay=$('capDay'), demDay=$('demDay'), coverage=$('coverage');
[roofArea,runoff,lossPct,rainAnnual,litersPerWash,washesPerDay].forEach(el=>el.addEventListener('input',updateSustain,{passive:true}));
updateSustain();
function updateSustain(){
  const A=clamp(+roofArea.value||0,1,10000);
  const C=clamp(+runoff.value||0.8,0.1,0.98);
  const Loss=clamp(+lossPct.value||10,0,50)/100;
  const Rmm=clamp(+rainAnnual.value||1880,200,4000);
  const Vyear_L=A*(Rmm/1000)*C*(1-Loss)*1000;
  const Vday_L=Vyear_L/365;
  const demand_L=clamp(+litersPerWash.value||80,10,1000)*clamp(+washesPerDay.value||20,1,1000);
  capYear.textContent=fmt(Vyear_L); capDay.textContent=fmt(Vday_L); demDay.textContent=fmt(demand_L);
  coverage.textContent=(demand_L?Math.min(100,(Vday_L/demand_L)*100):0).toFixed(0)+'%';
}

// ===== Loop de animação
let t=0; const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=clock.getDelta(); t+=dt;

  // auto-rotação
  if(ctrl.auto){ ctrl.theta += (ctrl.autoSpeed*0.003); applyCam(); }

  // anima fluxo
  gWater.traverse(o=>{ if(o.material?.isLineDashedMaterial){ o.material.dashOffset = -t*1.2; o.material.needsUpdate=true; } });

  // chuva
  const arr=rain.geometry.attributes.position.array;
  for(let i=0;i<COUNT;i++){
    arr[i*3+1] -= 6*dt;
    if(arr[i*3+1] < H+0.25){
      arr[i*3+0] = THREE.MathUtils.randFloatSpread(L+2);
      arr[i*3+1] = H+5 + Math.random()*3;
      arr[i*3+2] = THREE.MathUtils.randFloatSpread(W+2);
    }
  }
  rain.geometry.attributes.position.needsUpdate=true;

  renderer.render(scene,camera);
}
animate();

// ===== Responsivo
addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ===== Testes rápidos (HUD)
const testsEl=document.getElementById('tests'); const rerunBtn=document.getElementById('rerun');
function ok(m){return `<div class="ok">✔ ${m}</div>`} function bad(m){return `<div class="bad">✘ ${m}</div>`}
function runTests(){
  const out=[];
  try{
    out.push(scene?ok('Cena criada'):bad('Cena não criada'));
    out.push(camera?ok('Câmera criada'):bad('Câmera ausente'));
    out.push(renderer?ok('Renderer WebGL OK'):bad('Renderer não inicializado'));
    const pillars=gStructure.children.filter(m=>m.geometry?.type==='CylinderGeometry'&&Math.abs((m.geometry.parameters?.height||0)-H)<1e-6);
    out.push(pillars.length===6?ok('6 pilares presentes'):bad(`Pilares=${pillars.length}`));
    out.push(roof?ok('Telhado presente'):bad('Telhado ausente'));
    out.push(gutterMain&&downspout?ok('Calhas/condutor presentes'):bad('Calhas/condutor ausentes'));
    out.push(tank?ok('Reservatório presente'):bad('Reservatório ausente'));
    out.push(gWash.children.length>=10?ok('Elementos de lava-rápido presentes'):bad('Poucos elementos de lava-rápido'));
    out.push(typeof renderer.domElement.toDataURL==='function'?ok('Exportação PNG disponível'):bad('Export PNG indisponível'));
    out.push((tank.position.y<0)?ok('Reservatório subterrâneo'):bad('Reservatório não subterrâneo'));
    out.push(document.getElementById('roofArea')?ok('UI sustentabilidade presente'):bad('UI sustentabilidade ausente'));
  }catch(e){ out.push(bad('Exceção nos testes: '+e.message)); }
  testsEl.innerHTML = out.join('');
}
rerunBtn.addEventListener('click', runTests); runTests();
