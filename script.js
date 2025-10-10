// ==================================================
// Imports ESM por CDN (compatível com GitHub Pages/iPad)
import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://esm.sh/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';

// ==================================================
// Renderer / Cena / Câmera
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias:true, preserveDrawingBuffer:true, powerPreference:'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1115);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 220);
camera.position.set(14, 10, 14);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'fixed';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2.2, 0);

// ==================================================
// Luzes
scene.add(new THREE.HemisphereLight(0xffffff, 0x20202c, 1.15));
const dir = new THREE.DirectionalLight(0xffffff, .9);
dir.position.set(10,12,6);
scene.add(dir);

// ==================================================
// Medidas (m)
const L=12, W=8, H=3.2;

// Piso e grid
scene.add(new THREE.GridHelper(40, 40, 0x3a3f4d, 0x2a2f3a));
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20,16),
  new THREE.MeshStandardMaterial({color:0x161a22, roughness:.95})
);
ground.rotation.x = -Math.PI/2; scene.add(ground);

// Grupos
const gStructure = new THREE.Group(), gWater = new THREE.Group(),
      gLabels = new THREE.Group(),    gWash  = new THREE.Group();
scene.add(gStructure, gWater, gLabels, gWash);

// ==================================================
// Pilares (6)
const pillarMat = new THREE.MeshStandardMaterial({color:new THREE.Color(getVar('--pillar'))});
const pillarGeom = new THREE.CylinderGeometry(0.10,0.10,H,24);
for(const x of [-L/2,0,L/2]) for(const z of [-W/2,W/2]){
  const p = new THREE.Mesh(pillarGeom, pillarMat);
  p.position.set(x,H/2,z);
  p.userData = {name:'Pilar', desc:'Estrutura de sustentação do telhado.'};
  gStructure.add(p);
}

// Telhado
const roof = meshBox(L+0.5, 0.15, W+0.5, getVar('--roof'), {clearcoat:.6, roughness:.6, metalness:.2});
roof.position.set(0,H+0.1,0);
roof.userData = {name:'Telhado', desc:'Superfície coletora da chuva (laranja).'};
gStructure.add(roof);

// Calhas e tubos
const gutterMat = new THREE.MeshStandardMaterial({color:new THREE.Color(getVar('--gutter')), metalness:.6, roughness:.3});
const gutterMain = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.12,W+0.5), gutterMat);
gutterMain.position.set(L/2+0.35, H+0.02, 0);
gutterMain.userData = {name:'Calha principal', desc:'Beiral direito do telhado (longitudinal).'};
gStructure.add(gutterMain);

const gutterFront = new THREE.Mesh(new THREE.BoxGeometry(4,0.12,0.15), gutterMat);
gutterFront.position.set(L/2-1.0, H, W/2+0.35);
gutterFront.userData = {name:'Calha frontal', desc:'Borda frontal, conduz à descida.'};
gStructure.add(gutterFront);

const downspout = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,H+0.2,24), gutterMat);
downspout.position.set(L/2+0.35, (H+0.2)/2, W/2+0.35);
downspout.userData = {name:'Condutor vertical', desc:'Canto dianteiro direito, do telhado ao chão.'};
gStructure.add(downspout);

const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,2.2,24), gutterMat);
pipe1.rotation.z = Math.PI/2;
pipe1.position.set(L/2+0.35-1.1, 0.1, W/2+0.35);
pipe1.userData = {name:'Tubo até filtro', desc:'Tubulação no piso levando à caixa de filtro.'};
gStructure.add(pipe1);

// Filtro e bomba
const filter = meshBox(0.8,0.6,0.6,0xffd54f,{roughness:.7});
filter.position.set(L/2-1.7, 0.35, W/2+0.35);
filter.userData = {name:'Filtro (areia/carvão)', desc:'Tratamento inicial da água pluvial.'};
gStructure.add(filter);

const pump = meshBox(0.6,0.45,0.45,0xd32f2f,{roughness:.5, metalness:.4});
pump.position.set(L/2-2.7, 0.28, W/2+0.35);
pump.userData = {name:'Bomba', desc:'Após o filtro, envia água ao reservatório.'};
gStructure.add(pump);

// Reservatório subterrâneo + tampão
const tank = new THREE.Mesh(
  new THREE.CylinderGeometry(1.1,1.1,1.6,36),
  new THREE.MeshStandardMaterial({color:0x1976d2, metalness:.1, roughness:.7, transparent:true, opacity:.85})
);
tank.position.set(L/2-4.4, -0.8, W/2+0.35); // topo rente ao piso (y=0)
tank.userData = {name:'Reservatório subterrâneo (~2.000 L)', desc:'Enterrado, com tampão de acesso.'};
gStructure.add(tank);

const manhole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.35,0.35,0.06,32),
  new THREE.MeshStandardMaterial({color:0x424242, metalness:.2, roughness:.6})
);
manhole.position.set(tank.position.x, 0.03, tank.position.z);
manhole.userData = {name:'Tampão de acesso', desc:'Inspeção do reservatório.'};
gStructure.add(manhole);

// Tubo da bomba até o reservatório (desce ao subsolo)
const pipe2 = new THREE.Group();
const p2a = cyl(0.06,1.0); p2a.rotation.z=Math.PI/2; p2a.position.set(L/2-3.2, 0.32, W/2+0.35);
const p2b = cyl(0.06,0.5); p2b.position.set(L/2-3.7,-0.25, W/2+0.35);
pipe2.add(p2a,p2b); pipe2.userData = {name:'Tubo para reservatório', desc:'Liga bomba ao reservatório subterrâneo.'};
gStructure.add(pipe2);

// ==================================================
// Rótulos (opcionais; desligados por padrão)
[roof, gutterMain, downspout, filter, pump, manhole].forEach(m=>m.geometry.computeBoundingBox?.());
gLabels.visible = false;
function addLabel(mesh, text){
  const el = document.createElement('div'); el.className='lbl'; el.textContent=text;
  const l = new CSS2DObject(el); l.position.set(0,(mesh.geometry.boundingBox?.max.y||0)+0.2,0);
  mesh.updateWorldMatrix(true,true); mesh.add(l); gLabels.add(l);
}
addLabel(roof,'Telhado (captação)');
addLabel(gutterMain,'Calha principal');
addLabel(downspout,'Condutor vertical');
addLabel(filter,'Filtro');
addLabel(pump,'Bomba');
addLabel(manhole,'Reservatório subterrâneo');

// ==================================================
// Fluxo d'água (linhas tracejadas)
const waterColor = new THREE.Color(getVar('--water'));
function dashedPath(points){
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineDashedMaterial({color:waterColor, dashSize:.35, gapSize:.18});
  const line = new THREE.Line(geo, mat); line.computeLineDistances();
  gWater.add(line); return line;
}
function roofFlowLines(n=7){
  const y = H + 0.18;
  for(let i=0;i<n;i++){
    const z = -W/2 + (i+0.5)*(W/n);
    dashedPath([ new THREE.Vector3(-L/2+0.3,y,z), new THREE.Vector3(L/2+0.25,y-0.08,z) ]);
  }
}
roofFlowLines();
dashedPath([ new THREE.Vector3(L/2+0.35,H+0.05,-W/2+0.2), new THREE.Vector3(L/2+0.35,H+0.02,W/2+0.28) ]);
dashedPath([ new THREE.Vector3(L/2-1.9,H,W/2+0.35), new THREE.Vector3(L/2+0.35,H,W/2+0.35) ]);
dashedPath([ new THREE.Vector3(L/2+0.35,H,W/2+0.35), new THREE.Vector3(L/2+0.35,0.12,W/2+0.35) ]);
dashedPath([ new THREE.Vector3(L/2+0.35,0.12,W/2+0.35), new THREE.Vector3(L/2-1.7+0.4,0.12,W/2+0.35) ]);
dashedPath([ new THREE.Vector3(L/2-1.7-0.4,0.12,W/2+0.35), new THREE.Vector3(L/2-2.7,0.12,W/2+0.35) ]);
dashedPath([ new THREE.Vector3(L/2-2.7-0.45,0.12,W/2+0.35), new THREE.Vector3(L/2-3.7,-0.4,W/2+0.35) ]);
dashedPath([ new THREE.Vector3(L/2-3.7,-0.4,W/2+0.35), new THREE.Vector3(L/2-4.4,-0.4,W/2+0.35) ]);

// ==================================================
// Elementos do lava-rápido
addLane(-3,-2,0.08,6); addLane(-3,2,0.08,6); addLane(3,-2,0.08,6); addLane(3,2,0.08,6);

const drain = meshBox(L-2,0.05,0.35,0x757575,{metalness:.2,roughness:.6});
drain.position.set(0,0.026,0); gWash.add(drain);
for(let i=-18;i<=18;i+=2){ const bar=meshBox(0.02,0.06,0.34,0x9e9e9e,{metalness:.35,roughness:.35}); bar.position.set(i*0.45,0.03,0); drain.add(bar); }

const washer = meshBox(0.7,0.6,0.5,0x1565c0,{metalness:.2,roughness:.7});
washer.position.set(-5.2,0.31,-3.2); washer.userData={name:'Lavadora pressão',desc:'Canto traseiro esquerdo.'}; gWash.add(washer);

const hoseCoil = new THREE.Mesh(new THREE.TorusGeometry(0.25,0.06,12,48), new THREE.MeshStandardMaterial({color:0x111111,metalness:.3,roughness:.6}));
hoseCoil.rotation.x=Math.PI/2; hoseCoil.position.set(-5.2,0.55,-3.2); gWash.add(hoseCoil);
const wand = cyl(0.015,1.1,16,0x212121); wand.rotation.z=Math.PI/5; wand.position.set(-4.5,0.6,-2.7); gWash.add(wand);

const car = new THREE.Group();
const body = meshBox(2.8,0.7,1.4,0x616161,{roughness:.8}); body.position.y=0.45; car.add(body);
const roofCar = meshBox(1.6,0.5,1.2,0x757575,{roughness:.8}); roofCar.position.set(0,0.95,0); car.add(roofCar);
const wheelGeom = new THREE.CylinderGeometry(0.35,0.35,0.3,20);
for(const [x,z] of [[-1.2,-0.6],[1.2,-0.6],[-1.2,0.6],[1.2,0.6]]){ const w=new THREE.Mesh(wheelGeom,new THREE.MeshStandardMaterial({color:0x111111})); w.rotation.z=Math.PI/2; w.position.set(x,0.35,z); car.add(w); }
car.position.set(3,0,0.5); gWash.add(car);

const arch = new THREE.Mesh(new THREE.TorusGeometry(1.4,0.05,12,48,Math.PI), new THREE.MeshStandardMaterial({color:0xcfd8dc, metalness:.1, roughness:.8}));
arch.rotation.z=Math.PI; arch.rotation.y=Math.PI/2; arch.position.set(-3,1.4,0); gWash.add(arch);

// ==================================================
// Chuva (partículas)
const rain = (()=>{ const COUNT=600, pos=new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){ pos[i*3+0]=THREE.MathUtils.randFloatSpread(L+2); pos[i*3+1]=H+5+Math.random()*3; pos[i*3+2]=THREE.MathUtils.randFloatSpread(W+2); }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({color:waterColor,size:0.06,transparent:true,opacity:.9});
  const pts=new THREE.Points(geo,mat); pts.userData={COUNT}; return pts; })();
scene.add(rain);

// ==================================================
// Tooltip (hover/tap) + seleção
const selectable = [roof,gutterMain,gutterFront,downspout,pipe1,filter,pump,manhole,car,arch,washer,
  ...gStructure.children.filter(m=>m.geometry?.type==='CylinderGeometry' && Math.abs((m.geometry.parameters?.height||0)-H)<1e-6)];
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2(); let highlighted=null;
const tip = document.createElement('div'); tip.id='tooltip'; tip.setAttribute('role','status'); tip.setAttribute('aria-live','polite'); document.body.appendChild(tip);
let tipTimer=null;

function showTip(html,x,y){
  tip.innerHTML=html; tip.classList.add('visible');
  const pad=14, w=tip.offsetWidth, h=tip.offsetHeight;
  const tx=Math.min(Math.max(x+12,pad), innerWidth - w - pad);
  const ty=Math.min(Math.max(y+12,pad), innerHeight - h - pad);
  tip.style.transform=`translate(${tx}px,${ty}px)`;
}
function hideTip(){ tip.classList.remove('visible'); tip.style.transform='translate(-9999px,-9999px)'; }
window.showTip = showTip; // usado nos testes

function pick(e){
  mouse.x = (e.clientX/innerWidth)*2-1; mouse.y = -(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const hit = raycaster.intersectObjects(selectable,true)[0];
  if(!hit){ hideTip(); if(highlighted){ highlighted.material?.emissive?.setHex(0x000000); highlighted=null; } return; }
  const m=hit.object, name=m.userData?.name||'Elemento', desc=m.userData?.desc?`<div style='opacity:.85; margin-top:2px'>${m.userData.desc}</div>`:'';
  showTip(`<b>${name}</b>${desc}`, e.clientX, e.clientY);
  if(highlighted && highlighted!==m){ highlighted.material?.emissive?.setHex(0x000000); }
  if(m.material && 'emissive' in m.material){ m.material.emissive.setHex(0x2255ff); highlighted=m; }
}
addEventListener('pointermove', pick, {passive:true});
addEventListener('pointerdown', e=>{ pick(e); clearTimeout(tipTimer); tipTimer=setTimeout(hideTip,2200); }, {passive:true});

// ==================================================
// Controles / Export / Responsivo
const $ = id => document.getElementById(id);
const toggleWater=$('toggleWater'), toggleRain=$('toggleRain'), toggleLabels=$('toggleLabels'),
      toggleAuto=$('toggleAuto'), speed=$('speed'), speedVal=$('speedVal'),
      camUp=$('camUp'), camDown=$('camDown'), camLeft=$('camLeft'), camRight=$('camRight'), camReset=$('camReset'),
      exportBtn=$('export');

toggleWater.addEventListener('change', ()=> gWater.visible = toggleWater.checked);
toggleRain .addEventListener('change', ()=> rain.visible   = toggleRain.checked);
toggleLabels.addEventListener('change', ()=> gLabels.visible= toggleLabels.checked);

toggleAuto.addEventListener('change', ()=> controls.autoRotate = toggleAuto.checked);
speed.addEventListener('input', ()=>{ controls.autoRotateSpeed = parseFloat(speed.value); speedVal.textContent = speed.value; });

const spherical=new THREE.Spherical(), offset=new THREE.Vector3(), EPS=0.001;
function nudgeCamera(dTheta,dPhi){
  offset.copy(camera.position).sub(controls.target); spherical.setFromVector3(offset);
  spherical.theta += dTheta; spherical.phi += dPhi;
  spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, spherical.phi));
  offset.setFromSpherical(spherical); camera.position.copy(controls.target).add(offset); camera.lookAt(controls.target); controls.update();
}
const STEP = THREE.MathUtils.degToRad(10);
camLeft.addEventListener('click', ()=> nudgeCamera( STEP,0));
camRight.addEventListener('click',()=> nudgeCamera(-STEP,0));
camUp.addEventListener('click',   ()=> nudgeCamera(0,-STEP));
camDown.addEventListener('click', ()=> nudgeCamera(0, STEP));
camReset.addEventListener('click',()=>{ camera.position.set(14,10,14); controls.target.set(0,2.2,0); controls.update(); });

exportBtn.addEventListener('click', ()=>{
  const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a'); a.href=url; a.download='maquete-oficina.png'; a.click();
});

addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight);
}, {passive:true});

// ==================================================
// Calculadora de sustentabilidade (Santo André)
const roofArea=$('roofArea'), runoff=$('runoff'), lossPct=$('lossPct'), rainAnnual=$('rainAnnual'),
      litersPerWash=$('litersPerWash'), washesPerDay=$('washesPerDay'),
      capYear=$('capYear'), capDay=$('capDay'), demDay=$('demDay'), coverage=$('coverage');
[roofArea,runoff,lossPct,rainAnnual,litersPerWash,washesPerDay].forEach(el=>el.addEventListener('input', updateSustain, {passive:true}));
updateSustain();

function updateSustain(){
  const A=clamp(+roofArea.value||0,1,10000);
  const C=clamp(+runoff.value||0.8,0.1,0.98);
  const Loss=clamp(+lossPct.value||10,0,50)/100;
  const Rmm=clamp(+rainAnnual.value||1880,200,4000);
  const Vyear_L = A * (Rmm/1000) * C * (1-Loss) * 1000; // m³->L
  const Vday_L = Vyear_L/365;
  const demand_L = clamp(+litersPerWash.value||80,10,1000) * clamp(+washesPerDay.value||20,1,1000);

  capYear.textContent = fmtL(Vyear_L);
  capDay .textContent = fmtL(Vday_L);
  demDay .textContent = fmtL(demand_L);
  coverage.textContent = (demand_L? Math.min(100,(Vday_L/demand_L)*100):0).toFixed(0)+'%';
}

// ==================================================
// Loop
let t=0; const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=clock.getDelta(); t+=dt;
  controls.update();

  gWater.traverse(o=>{ if(o.material?.isLineDashedMaterial){ o.material.dashOffset = -t*1.2; o.material.needsUpdate = true; } });

  const arr = rain.geometry.attributes.position.array, COUNT = rain.userData.COUNT;
  for(let i=0;i<COUNT;i++){
    arr[i*3+1]-=6*dt;
    if(arr[i*3+1]<H+0.25){
      arr[i*3+0]=THREE.MathUtils.randFloatSpread(L+2);
      arr[i*3+1]=H+5+Math.random()*3;
      arr[i*3+2]=THREE.MathUtils.randFloatSpread(W+2);
    }
  }
  rain.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene,camera);
  labelRenderer.render(scene,camera);
}
animate();

// ==================================================
// Testes (mantidos + extras)
const testsEl=document.getElementById('tests'); const rerunBtn=document.getElementById('rerun');
rerunBtn.addEventListener('click', runTests);
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
    controls.autoRotate=true; controls.update(); out.push(controls.autoRotate?ok('Auto-rotação habilitável'):bad('Auto-rotação falhou')); controls.autoRotate=false;
    out.push(typeof renderer.domElement.toDataURL==='function'?ok('Exportação PNG disponível'):bad('Exportação PNG indisponível'));
    const before=camera.position.clone(); nudgeCamera(THREE.MathUtils.degToRad(5),0);
    out.push(before.distanceTo(camera.position)>1e-6?ok('Giro manual altera câmera'):bad('Giro manual não alterou'));
    out.push(document.getElementById('tooltip')?ok('Tooltip presente'):bad('Tooltip ausente'));
    out.push(typeof window.showTip==='function'?ok('Função tooltip disponível'):bad('Função tooltip indisponível'));
    out.push((tank.position.y<0)?ok('Reservatório subterrâneo'):bad('Reservatório não subterrâneo'));
    out.push(document.getElementById('roofArea')?ok('UI sustentabilidade presente'):bad('UI sustentabilidade ausente'));
  }catch(e){ out.push(bad('Exceção nos testes: '+e.message)); }
  testsEl.innerHTML = out.join('');
  console.table({washItems:gWash.children.length, waterLines:gWater.children.length});
}
runTests();

// ==================================================
// Utilitários
function getVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function meshBox(x,y,z,color,opts={}){ return new THREE.Mesh(new THREE.BoxGeometry(x,y,z), new THREE.MeshStandardMaterial({color, ...opts})); }
function cyl(r,h,seg=24,color=null){
  return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),
    new THREE.MeshStandardMaterial({color: color ?? new THREE.Color(getVar('--gutter')), metalness:.6, roughness:.3}));
}
function addLane(x,z,w,l){
  const m=meshBox(w,0.02,l,0xffd54f,{emissive:0x3a2a00,roughness:.6}); m.position.set(x,0.011,z); gWash.add(m); return m;
}
function fmtL(v){ return (isFinite(v)? new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(v)+' L' : '—'); }
function clamp(v,min,max){ return Math.min(max, Math.max(min, v)); }
function nudgeCamera(dTheta,dPhi){ // reusado nos testes
  const spherical=new THREE.Spherical(); const offset=new THREE.Vector3(); const EPS=0.001;
  offset.copy(camera.position).sub(controls.target); spherical.setFromVector3(offset);
  spherical.theta += dTheta; spherical.phi += dPhi; spherical.phi=Math.max(EPS,Math.min(Math.PI-EPS,spherical.phi));
  offset.setFromSpherical(spherical); camera.position.copy(controls.target).add(offset); camera.lookAt(controls.target); controls.update();
}
