import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// ======= CENA BÁSICA =======
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1115);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 200);
camera.position.set(14, 10, 14);

// OrbitControls agora usa o próprio canvas (removi CSS2DRenderer)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2.2, 0);

// Luzes
const hemi = new THREE.HemisphereLight(0xffffff, 0x20202c, 1.15);
hemi.position.set(0, 20, 0);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, .9);
dir.position.set(10, 12, 6);
dir.castShadow = true;
scene.add(dir);

// ======= MEDIDAS APROXIMADAS (m) =======
const L = 12;    // comprimento do telhado (eixo X)
const W = 8;     // largura do telhado (eixo Z)
const H = 3.2;   // altura dos pilares

// ======= PISO/QUADRICULADO =======
const grid = new THREE.GridHelper(40, 40, 0x3a3f4d, 0x2a2f3a);
grid.position.y = 0;
scene.add(grid);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 16),
  new THREE.MeshStandardMaterial({color:0x161a22, roughness:.95, metalness:0})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// ======= GRUPOS =======
const gStructure = new THREE.Group();
const gWater = new THREE.Group();
const gWash = new THREE.Group(); // elementos de lava-rápido
scene.add(gStructure, gWater, gWash);

// ======= PILARES (6) =======
const pillarMat = new THREE.MeshStandardMaterial({color:new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--pillar').trim())});
const pillarGeom = new THREE.CylinderGeometry(0.10, 0.10, H, 24);

const pillarX = [-L/2, 0, L/2];
const pillarZ = [-W/2, W/2];
for(const x of pillarX){
  for(const z of pillarZ){
    const p = new THREE.Mesh(pillarGeom, pillarMat);
    p.position.set(x, H/2, z);
    p.userData = { name: 'Pilar', desc:'Estrutura de sustentação do telhado.' };
    gStructure.add(p);
  }
}

// ======= TELHADO =======
const roofColor = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--roof').trim());
const roofMat = new THREE.MeshPhysicalMaterial({color:roofColor, roughness:.6, metalness:.2, clearcoat:.6});
const roof = new THREE.Mesh(new THREE.BoxGeometry(L+0.5, 0.15, W+0.5), roofMat);
roof.position.set(0, H+0.1, 0);
roof.castShadow = true; roof.receiveShadow = true;
roof.userData = { name: 'Telhado', desc:'Superfície coletora da chuva (laranja).' };
gStructure.add(roof);

// ======= CALHAS (cinza) =======
const gutterColor = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--gutter').trim());
const gutterMat = new THREE.MeshStandardMaterial({color:gutterColor, metalness:.6, roughness:.3});

const gutterMain = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, W+0.5), gutterMat);
gutterMain.position.set(L/2 + 0.35, H+0.02, 0);
gutterMain.userData = { name: 'Calha principal', desc:'Beiral direito do telhado (lado longitudinal).' };
gStructure.add(gutterMain);

const gutterFront = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 0.15), gutterMat);
gutterFront.position.set(L/2 - 1.0, H, W/2 + 0.35);
gutterFront.userData = { name: 'Calha frontal', desc:'Borda frontal do telhado, conduz à descida.' };
gStructure.add(gutterFront);

const downspout = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, H+0.2, 24), gutterMat);
downspout.position.set(L/2 + 0.35, (H+0.2)/2, W/2 + 0.35);
downspout.userData = { name: 'Condutor vertical', desc:'Canto dianteiro direito, do telhado ao chão.' };
gStructure.add(downspout);

const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 24), gutterMat);
pipe1.rotation.z = Math.PI/2;
pipe1.position.set(L/2 + 0.35 - 1.1, 0.1, W/2 + 0.35);
pipe1.userData = { name: 'Tubo até filtro', desc:'Tubulação horizontal no piso levando à caixa de filtro.' };
gStructure.add(pipe1);

const filter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), new THREE.MeshStandardMaterial({color:0xffd54f, roughness:.7, metalness:.1}));
filter.position.set(L/2 - 1.7, 0.35, W/2 + 0.35);
filter.userData = { name: 'Filtro (areia/carvão)', desc:'Tratamento inicial da água pluvial no piso frontal direito.' };
gStructure.add(filter);

const pump = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.45), new THREE.MeshStandardMaterial({color:0xd32f2f, roughness:.5, metalness:.4}));
pump.position.set(L/2 - 2.7, 0.28, W/2 + 0.35);
pump.userData = { name: 'Bomba', desc:'Após o filtro, envia água tratada ao reservatório.' };
gStructure.add(pump);

const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 36), new THREE.MeshStandardMaterial({color:0x1976d2, metalness:.1, roughness:.7}));
tank.position.set(L/2 - 4.4, 0.8, W/2 + 0.35);
tank.userData = { name: 'Reservatório (ex.: 2.000 L)', desc:'Frente direita do pátio, após a bomba.' };
gStructure.add(tank);

const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 24), gutterMat);
pipe2.rotation.z = Math.PI/2;
pipe2.position.set(L/2 - 3.55, 0.32, W/2 + 0.35);
pipe2.userData = { name: 'Tubo para reservatório', desc:'Fecha o circuito entre bomba e reservatório.' };
gStructure.add(pipe2);

// ======= (REMOVIDO) Rótulos CSS2D =======
// Toda a lógica de CSS2DRenderer e addLabel foi removida
// para evitar “cards” fixos na cena. O tooltip por hover permanece.

// ======= FLUXO DE ÁGUA (linhas tracejadas animadas) =======
const waterColor = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--water').trim());

function dashedPath(points){
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineDashedMaterial({color: waterColor, dashSize: .35, gapSize: .18, linewidth: 2});
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  gWater.add(line);
  return line;
}

function roofFlowLines(n=7){
  const y = H + 0.18;
  for(let i=0;i<n;i++){
    const z = -W/2 + (i+0.5)*(W/n);
    const from = new THREE.Vector3(-L/2+0.3, y, z);
    const to   = new THREE.Vector3(L/2+0.25, y-0.08, z);
    dashedPath([from,to]);
  }
}

roofFlowLines();
dashedPath([
  new THREE.Vector3(L/2+0.35, H+0.05, -W/2+0.2),
  new THREE.Vector3(L/2+0.35, H+0.02,  W/2+0.28)
]);
dashedPath([
  new THREE.Vector3(L/2-1.9, H, W/2+0.35),
  new THREE.Vector3(L/2+0.35, H, W/2+0.35)
]);
dashedPath([
  new THREE.Vector3(L/2+0.35, H, W/2+0.35),
  new THREE.Vector3(L/2+0.35, 0.12, W/2+0.35)
]);
dashedPath([
  new THREE.Vector3(L/2+0.35, 0.12, W/2+0.35),
  new THREE.Vector3(L/2-1.7+0.4, 0.12, W/2+0.35)
]);
dashedPath([
  new THREE.Vector3(L/2-1.7-0.4, 0.12, W/2+0.35),
  new THREE.Vector3(L/2-2.7, 0.12, W/2+0.35)
]);
dashedPath([
  new THREE.Vector3(L/2-2.7-0.45, 0.12, W/2+0.35),
  new THREE.Vector3(L/2-4.4, 0.12, W/2+0.35)
]);

// ======= ELEMENTOS DE LAVA-RÁPIDO =======
function addLane(x,z,w,l){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, l), new THREE.MeshStandardMaterial({color:0xffd54f, emissive:0x3a2a00, roughness:.6}));
  m.position.set(x, 0.011, z); gWash.add(m); return m;
}
addLane(-3, -2, 0.08, 6);
addLane(-3,  2, 0.08, 6);
addLane( 3, -2, 0.08, 6);
addLane( 3,  2, 0.08, 6);

const drain = new THREE.Mesh(new THREE.BoxGeometry(L-2, 0.05, 0.35), new THREE.MeshStandardMaterial({color:0x757575, metalness:.2, roughness:.6}));
drain.position.set(0, 0.026, 0); gWash.add(drain);
for(let i=-20;i<=20;i++){
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.34), new THREE.MeshStandardMaterial({color:0x9e9e9e, metalness:.4, roughness:.3}));
  bar.position.set(i*0.45, 0.03, 0); drain.add(bar);
}

const washer = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,0.5), new THREE.MeshStandardMaterial({color:0x1565c0, metalness:.2, roughness:.7}));
washer.position.set(-5.2, 0.31, -3.2); washer.userData = {name:'Lavadora pressão', desc:'Equipamento no canto traseiro esquerdo.'}; gWash.add(washer);
const hoseCoil = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 16, 64), new THREE.MeshStandardMaterial({color:0x111111, metalness:.3, roughness:.6}));
h oseCoil.rotation.x = Math.PI/2; hoseCoil.position.set(-5.2, 0.55, -3.2); gWash.add(hoseCoil);
const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,1.1,16), new THREE.MeshStandardMaterial({color:0x212121}));
wand.rotation.z = Math.PI/5; wand.position.set(-4.5, 0.6, -2.7); gWash.add(wand);

const car = new THREE.Group();
const body = new THREE.Mesh(new THREE.BoxGeometry(2.8,0.7,1.4), new THREE.MeshStandardMaterial({color:0x616161, roughness:.8}));
body.position.y = 0.45; car.add(body);
const roofCar = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.5,1.2), new THREE.MeshStandardMaterial({color:0x757575, roughness:.8}));
roofCar.position.set(0,0.95,0); car.add(roofCar);
const wheelGeom = new THREE.CylinderGeometry(0.35,0.35,0.3,24);
function wheel(x,z){ const w = new THREE.Mesh(wheelGeom, new THREE.MeshStandardMaterial({color:0x111111})); w.rotation.z=Math.PI/2; w.position.set(x,0.35,z); car.add(w);} 
wheel(-1.2, -0.6); wheel(1.2, -0.6); wheel(-1.2, 0.6); wheel(1.2, 0.6);
car.position.set(3,0,0.5); gWash.add(car);

const arch = new THREE.Mesh(new THREE.TorusGeometry(1.4,0.05,16,64,Math.PI), new THREE.MeshStandardMaterial({color:0xcfd8dc, metalness:.1, roughness:.8}));
arch.rotation.z = Math.PI; arch.rotation.y = Math.PI/2; arch.position.set(-3,1.4,0); gWash.add(arch);

const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.1,0.7), new THREE.MeshStandardMaterial({color:0x424242}));
bench.position.set(-6.5,0.55,2.6); gWash.add(bench);
const legsGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 16);
function leg(dx,dz){ const l = new THREE.Mesh(legsGeom, new THREE.MeshStandardMaterial({color:0x2b2b2b})); l.position.set(-6.5+dx,0.3,2.6+dz); gWash.add(l);} 
leg(-1, -0.3); leg(1, -0.3); leg(-1, 0.3); leg(1, 0.3);

function addCone(x,z){
  const cone = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.32,0.06,24), new THREE.MeshStandardMaterial({color:0x202020}));
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.18,0.5,24), new THREE.MeshStandardMaterial({color:0xff6d00}));
  body.position.y = 0.28; cone.add(base, body); cone.position.set(x,0,z); gWash.add(cone); return cone;
}
addCone(-1.8,-2.2); addCone(-1.8,2.2); addCone(1.8,-2.2); addCone(1.8,2.2);

// ======= CHUVA (partículas simples) =======
const rainGeo = new THREE.BufferGeometry();
const COUNT = 600; // partículas
const rainPos = new Float32Array(COUNT*3);
for(let i=0;i<COUNT;i++){
  const x = THREE.MathUtils.randFloatSpread(L+2);
  const z = THREE.MathUtils.randFloatSpread(W+2);
  const y = H+5+ Math.random()*3;
  rainPos[i*3+0]=x; rainPos[i*3+1]=y; rainPos[i*3+2]=z;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.PointsMaterial({color:waterColor, size:0.06, transparent:true, opacity:.9});
const rain = new THREE.Points(rainGeo, rainMat);
scene.add(rain);

// ======= INTERAÇÕES =======
const selectable = [roof, gutterMain, gutterFront, downspout, pipe1, filter, pump, tank, car, arch, washer, ...gStructure.children.filter(m=>m.geometry?.type==='CylinderGeometry' && Math.abs((m.geometry.parameters?.height||0)-H)<1e-6)];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let highlighted = null;

// ======= CONTROLES DE CÂMERA =======
const toggleWater = document.getElementById('toggleWater');
const toggleRain = document.getElementById('toggleRain');
const toggleAuto = document.getElementById('toggleAuto');
const speed = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
const camUp = document.getElementById('camUp');
const camDown = document.getElementById('camDown');
const camLeft = document.getElementById('camLeft');
const camRight = document.getElementById('camRight');
const camReset = document.getElementById('camReset');
const exportBtn = document.getElementById('export');

toggleWater.addEventListener('change', ()=>{ gWater.visible = toggleWater.checked; });
toggleRain.addEventListener('change', ()=>{ rain.visible = toggleRain.checked; });

toggleAuto.addEventListener('change', ()=>{ controls.autoRotate = toggleAuto.checked; });
speed.addEventListener('input', ()=>{ controls.autoRotateSpeed = parseFloat(speed.value); speedVal.textContent = speed.value; });

// ======= GIRO MANUAL (compatível iPad) =======
const spherical = new THREE.Spherical();
const offset = new THREE.Vector3();
const EPS = 0.001;
function nudgeCamera(deltaTheta, deltaPhi){
  offset.copy(camera.position).sub(controls.target);
  spherical.setFromVector3(offset);
  spherical.theta += deltaTheta;         // azimute (eixo Y)
  spherical.phi   += deltaPhi;           // polar (0 = topo)
  spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, spherical.phi));
  offset.setFromSpherical(spherical);
  camera.position.copy(controls.target).add(offset);
  camera.lookAt(controls.target);
  controls.update();
}

const STEP = THREE.MathUtils.degToRad(10);
camLeft.addEventListener('click', ()=> nudgeCamera( STEP, 0));
camRight.addEventListener('click',()=> nudgeCamera(-STEP, 0));
camUp.addEventListener('click',   ()=> nudgeCamera(0, -STEP));
camDown.addEventListener('click', ()=> nudgeCamera(0,  STEP));
camReset.addEventListener('click', ()=>{ camera.position.set(14,10,14); controls.target.set(0,2.2,0); controls.update(); });

// Exportar PNG do canvas
exportBtn.addEventListener('click', ()=>{
  const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = 'maquete-oficina.png'; a.click();
});

// ======= LOOP =======
let t=0; const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta(); t+=dt;

  controls.update();

  // Anima o traçado d'água (linhas tracejadas)
  gWater.traverse(obj=>{
    if(obj.material && obj.material.isLineDashedMaterial){ obj.material.dashOffset = -t*1.2; obj.material.needsUpdate = true; }
  });

  // Anima chuva descendo
  const arr = rain.geometry.attributes.position.array;
  for(let i=0;i<COUNT;i++){
    arr[i*3+1] -= 6*dt; // queda
    if(arr[i*3+1] < H+0.25){
      arr[i*3+0] = THREE.MathUtils.randFloatSpread(L+2);
      arr[i*3+1] = H+5 + Math.random()*3;
      arr[i*3+2] = THREE.MathUtils.randFloatSpread(W+2);
    }
  }
  rain.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}
animate();

// ======= TOOLTIP (hover/tap) =======
const tip = document.createElement('div');
tip.id = 'tooltip'; tip.setAttribute('role','status'); tip.setAttribute('aria-live','polite');
document.body.appendChild(tip);
let tipTimer=null;
function showTip(html,x,y){
  tip.innerHTML = html; tip.classList.add('visible');
  const pad=14; const w=tip.offsetWidth, h=tip.offsetHeight;
  const tx = Math.min(Math.max(x+12, pad), innerWidth - w - pad);
  const ty = Math.min(Math.max(y+12, pad), innerHeight - h - pad);
  tip.style.transform = `translate(${tx}px,${ty}px)`;
}
function hideTip(){ tip.classList.remove('visible'); tip.style.transform='translate(-9999px,-9999px)'; }
window.showTip = showTip; // para testes

function pick(e){
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(selectable, true)[0];
  if(!hit){ hideTip(); if(highlighted){ highlighted.material?.emissive?.setHex(0x000000); highlighted=null; } return; }
  const m = hit.object;
  const name = m.userData?.name || 'Elemento';
  const desc = m.userData?.desc ? `<div style='opacity:.85; margin-top:2px'>${m.userData.desc}</div>` : '';
  showTip(`<b>${name}</b>${desc}`, e.clientX, e.clientY);
  if(highlighted && highlighted!==m){ highlighted.material?.emissive?.setHex(0x000000); }
  if(m.material && 'emissive' in m.material){ m.material.emissive.setHex(0x2255ff); highlighted=m; }
}
window.addEventListener('pointermove', pick, {passive:true});
window.addEventListener('pointerdown', (e)=>{ pick(e); clearTimeout(tipTimer); tipTimer=setTimeout(hideTip, 2200); }, {passive:true});

// Responsivo
addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ======= TESTES AUTOMÁTICOS (Smoke Tests) =======
const testsEl = document.getElementById('tests');
const rerunBtn = document.getElementById('rerun');

function ok(msg){ return `<div class="ok">✔ ${msg}</div>` }
function bad(msg){ return `<div class="bad">✘ ${msg}</div>` }

function runTests(){
  const out = [];
  try{
    out.push(scene ? ok('Cena criada') : bad('Cena não criada'));
    out.push(camera ? ok('Câmera criada') : bad('Câmera ausente'));
    out.push(renderer ? ok('Renderer WebGL OK') : bad('Renderer não inicializado'));
    const pillars = gStructure.children.filter(m=>m.geometry?.type==='CylinderGeometry' && Math.abs((m.geometry.parameters?.height||0)-H)<1e-6);
    out.push(pillars.length===6 ? ok('6 pilares presentes') : bad(`Quantidade de pilares = ${pillars.length} (esperado 6)`));
    out.push(roof ? ok('Telhado presente') : bad('Telhado ausente'));
    out.push(gutterMain && downspout ? ok('Calhas/condutor presentes') : bad('Calhas/condutor ausentes'));
    out.push(tank ? ok('Reservatório presente') : bad('Reservatório ausente'));
    out.push(gWash.children.length>=10 ? ok('Elementos de lava-rápido presentes') : bad('Poucos elementos de lava-rápido'));
    controls.autoRotate=true; controls.update();
    out.push(controls.autoRotate ? ok('Auto-rotação habilitável') : bad('Falha ao habilitar auto-rotação'));
    controls.autoRotate=false;
    out.push(typeof renderer.domElement.toDataURL==='function' ? ok('Exportação PNG disponível') : bad('Exportação PNG indisponível'));
    const before = camera.position.clone(); nudgeCamera(THREE.MathUtils.degToRad(5), 0); const moved = before.distanceTo(camera.position) > 1e-6; out.push(moved ? ok('Giro manual altera câmera') : bad('Giro manual não alterou câmera'));
    // Testes do tooltip
    out.push(document.getElementById('tooltip') ? ok('Tooltip presente') : bad('Tooltip ausente'));
    out.push(typeof window.showTip==='function' ? ok('Função de tooltip disponível') : bad('Função de tooltip indisponível'));
  }catch(e){ out.push(bad('Exceção nos testes: '+e.message)); }
  testsEl.innerHTML = out.join('');
  console.table({ washItems: gWash.children.length, waterLines: gWater.children.length });
}

rerunBtn.addEventListener('click', runTests);
runTests(); // executa ao carregar
