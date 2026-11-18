'use strict';

const $ = (id) => document.getElementById(id);
const G = 9.81;
const fmt = (value, digits = 2) => Number(value).toLocaleString('es-CO', {minimumFractionDigits: digits, maximumFractionDigits: digits});
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const rad = (deg) => deg * Math.PI / 180;

// Navegación entre módulos ----------------------------------------------------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === `panel-${tab.dataset.tab}`));
  });
});

function arrow(x1, y1, x2, y2, color, label, labelDx = 8, labelDy = -8, width = 4) {
  return `<g>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" marker-end="url(#arrow-${color.replace('#','')})"/>
    <text x="${x2 + labelDx}" y="${y2 + labelDy}" fill="${color}" font-size="15" font-weight="800">${label}</text>
  </g>`;
}
function defsArrowMarkers() {
  return `<defs>
    <marker id="arrow-e4484e" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#e4484e"/></marker>
    <marker id="arrow-2465dc" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#2465dc"/></marker>
    <marker id="arrow-269d76" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#269d76"/></marker>
    <marker id="arrow-e49a2e" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#e49a2e"/></marker>
    <marker id="arrow-8054c8" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#8054c8"/></marker>
    <marker id="arrow-254f86" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#254f86"/></marker>
  </defs>`;
}

// 1. Plano inclinado ----------------------------------------------------------
const plane = { angle: 30, mass: 5, mu: 0.2, position: 0, velocity: 0, running: false, raf: 0, last: 0 };
function planePhysics() {
  const theta = rad(plane.angle);
  const weight = plane.mass * G;
  const parallel = weight * Math.sin(theta);
  const perpendicular = weight * Math.cos(theta);
  const normal = perpendicular;
  const frictionLimit = plane.mu * normal;
  const sticks = parallel <= frictionLimit;
  // Si permanece en reposo, la fricción estática se ajusta para equilibrar P∥.
  // Si desliza, usamos fricción cinética f = μN.
  const friction = sticks ? parallel : frictionLimit;
  const net = sticks ? 0 : parallel - friction;
  const acceleration = net / plane.mass;
  return {theta, weight, parallel, perpendicular, normal, friction, frictionLimit, net, acceleration, sticks};
}
function renderRampScene() {
  const theta = rad(plane.angle), length = 500;
  const start = {x: 95, y: 285};
  const actualLength = Math.min(length, 205 / Math.max(0.08, Math.sin(theta)));
  const end = {x: start.x + actualLength * Math.cos(theta), y: start.y - actualLength * Math.sin(theta)};
  const t = {x: Math.cos(theta), y: -Math.sin(theta)};
  const n = {x: -Math.sin(theta), y: -Math.cos(theta)};
  const s = clamp(plane.position, 0, 5.4);
  const along = (5.4 - s) / 5.4 * (actualLength - 55) + 24;
  const cx = start.x + t.x * along + n.x * 23;
  const cy = start.y + t.y * along + n.y * 23;
  const box = `<g transform="translate(${cx} ${cy}) rotate(${-plane.angle})"><rect x="-23" y="-23" width="46" height="46" rx="7" fill="#e9a33a" stroke="#9b681b" stroke-width="2"/><path d="M-12 -8 L12 -8 M-12 0 L12 0" stroke="#fff4d7" stroke-width="3" stroke-linecap="round"/></g>`;
  $('ramp-scene').innerHTML = `<defs><linearGradient id="rampFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cbdcf5"/><stop offset="1" stop-color="#edf3fc"/></linearGradient></defs>
    <line x1="55" y1="286" x2="650" y2="286" stroke="#aab9d0" stroke-width="3"/>
    <path d="M${start.x} ${start.y} L${end.x} ${end.y} L${end.x} ${start.y} Z" fill="url(#rampFill)" opacity=".8"/>
    <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#315b97" stroke-width="13" stroke-linecap="round"/>
    <line x1="${start.x}" y1="${start.y+8}" x2="${end.x}" y2="${end.y+8}" stroke="#8ea8cc" stroke-width="3"/>
    <path d="M${start.x+45} ${start.y} A45 45 0 0 0 ${start.x+45*Math.cos(theta)} ${start.y-45*Math.sin(theta)}" fill="none" stroke="#2563eb" stroke-width="2"/>
    <text x="${start.x+55}" y="${start.y-8}" fill="#2055b7" font-size="14" font-weight="800">${plane.angle}°</text>
    ${box}
    <text x="${start.x}" y="315" fill="#6b7e99" font-size="12">Base</text>
    <text x="${Math.max(410,end.x-65)}" y="${Math.max(35,end.y-20)}" fill="#6b7e99" font-size="12">Plano inclinado</text>`;
}
function renderPlaneDiagram() {
  const p = planePhysics(), theta = p.theta;
  const t = {x:-Math.cos(theta), y:Math.sin(theta)}; // вниз по склону (влево-вниз)
  const n = {x:-Math.sin(theta), y:-Math.cos(theta)}; // наружу от поверхности
  const rampA = {x:105,y:300};
  const rampLength = Math.min(500, 235 / Math.max(0.08, Math.sin(theta)));
  const rampB = {x:rampA.x+rampLength*Math.cos(theta),y:rampA.y-rampLength*Math.sin(theta)};
  const origin = {x:rampA.x+(rampB.x-rampA.x)*.56-Math.sin(theta)*27,y:rampA.y+(rampB.y-rampA.y)*.56-Math.cos(theta)*27};
  const maxForce = Math.max(p.weight,p.normal,p.friction,p.parallel,1);
  const scale = Math.min(2.35, 150/maxForce);
  const vec = (dir, mag) => ({x:origin.x+dir.x*mag*scale,y:origin.y+dir.y*mag*scale});
  const weightEnd=vec({x:0,y:1},p.weight), normalEnd=vec(n,p.normal), frictionEnd=vec({x:-t.x,y:-t.y},p.friction);
  const parEnd=vec(t,p.parallel), perpEnd=vec({x:-n.x,y:-n.y},p.perpendicular);
  $('plane-diagram').innerHTML = `${defsArrowMarkers()}
    <line x1="${rampA.x}" y1="${rampA.y}" x2="${rampB.x}" y2="${rampB.y}" stroke="#8da6c9" stroke-width="12" stroke-linecap="round"/>
    <line x1="${rampA.x}" y1="${rampA.y+10}" x2="630" y2="${rampA.y+10}" stroke="#b8c8df" stroke-width="2"/>
    <g transform="translate(${origin.x} ${origin.y}) rotate(${-plane.angle})"><rect x="-28" y="-28" width="56" height="56" rx="7" fill="#e9a33a" stroke="#9b681b" stroke-width="2"/><text x="0" y="6" text-anchor="middle" fill="#fff" font-size="14" font-weight="900">m</text></g>
    ${arrow(origin.x,origin.y,weightEnd.x,weightEnd.y,'#e4484e','P',10,0)}
    ${arrow(origin.x,origin.y,normalEnd.x,normalEnd.y,'#2465dc','N',-20,-10)}
    ${p.friction>0.01?arrow(origin.x,origin.y,frictionEnd.x,frictionEnd.y,'#269d76','f',-15,-9):`<text x="${origin.x+12}" y="${origin.y-16}" fill="#269d76" font-size="13" font-weight="800">f = 0</text>`}
    ${arrow(origin.x,origin.y,parEnd.x,parEnd.y,'#e49a2e','P∥',-28,17,3)}
    ${arrow(origin.x,origin.y,perpEnd.x,perpEnd.y,'#8054c8','P⊥',8,15,3)}
    <text x="125" y="350" fill="#6d7e98" font-size="12">Las flechas representan fuerzas y componentes.</text>
    <text x="125" y="369" fill="#6d7e98" font-size="11">Diagrama idealizado, sin otras fuerzas perpendiculares.</text>`;
}
function renderPlane() {
  $('plane-angle-value').textContent = `${plane.angle}°`;
  $('plane-mass-value').textContent = `${fmt(plane.mass,1)} kg`;
  $('plane-mu-value').textContent = fmt(plane.mu,2);
  const p = planePhysics();
  $('plane-acc').innerHTML = `${fmt(p.acceleration)} <small>m/s²</small>`;
  $('plane-vel').innerHTML = `${fmt(plane.velocity)} <small>m/s</small>`;
  $('plane-dist').innerHTML = `${fmt(plane.position)} <small>m</small>`;
  $('plane-calculation').innerHTML = `
    <div class="calc-row"><span>Peso P = mg</span><strong>${fmt(p.weight)} N</strong></div>
    <div class="calc-row"><span>Componente paralela P∥</span><strong>${fmt(p.parallel)} N</strong></div>
    <div class="calc-row"><span>Componente perpendicular P⊥</span><strong>${fmt(p.perpendicular)} N</strong></div>
    <div class="calc-row"><span>Normal N</span><strong>${fmt(p.normal)} N</strong></div>
    <div class="calc-row"><span>${p.sticks ? 'Fricción estática que equilibra P∥' : 'Fricción cinética f = μN'}</span><strong>${fmt(p.friction)} N</strong></div>
    <div class="calc-row"><span>Fuerza neta paralela</span><strong>${fmt(p.net)} N</strong></div>
    <div class="calc-row emphasis"><span>Aceleración resultante</span><strong>${fmt(p.acceleration)} m/s²</strong></div>`;
  $('plane-steps').innerHTML = `<p><b>1.</b> Peso: P = mg = ${fmt(plane.mass,1)} · 9,81 = ${fmt(p.weight)} N.</p>
    <p><b>2.</b> Componente paralela: P∥ = mg sen(${plane.angle}°) = ${fmt(p.parallel)} N.</p>
    <p><b>3.</b> Normal: N = mg cos(${plane.angle}°) = ${fmt(p.normal)} N.</p>
    <p><b>4.</b> ${p.sticks ? `Como P∥ ≤ μN (${fmt(p.parallel)} ≤ ${fmt(p.frictionLimit)}), la fricción estática se ajusta a f = P∥ = ${fmt(p.friction)} N.` : `El bloque desliza: f = μN = ${fmt(plane.mu,2)} · ${fmt(p.normal)} = ${fmt(p.friction)} N.`}</p>
    <p><b>5.</b> Segunda ley: ΣF∥ = P∥ − f = ${fmt(p.net)} N.</p>
    <p><b>6.</b> a = ΣF∥/m = ${fmt(p.net)} / ${fmt(plane.mass,1)} = <b>${fmt(p.acceleration)} m/s²</b>.</p>`;
  renderPlaneDiagram(); renderRampScene();
}
function setPlaneParam(key, value) {
  plane[key] = value; plane.position = 0; plane.velocity = 0; plane.running = false;
  cancelAnimationFrame(plane.raf); $('release-block').textContent='▶ Soltar el bloque'; renderPlane();
  $('plane-status').textContent = 'Parámetros actualizados. Pulsa «Soltar el bloque» para iniciar desde el reposo.';
}
['plane-angle','plane-mass','plane-mu'].forEach((id) => $(id).addEventListener('input', (e) => {
  const key = id === 'plane-angle' ? 'angle' : id === 'plane-mass' ? 'mass' : 'mu';
  setPlaneParam(key, Number(e.target.value));
}));
$('reset-plane').addEventListener('click', () => {
  plane.angle=30;plane.mass=5;plane.mu=.2;
  $('plane-angle').value=30;$('plane-mass').value=5;$('plane-mu').value=.2;
  resetBlock();renderPlane();
});
function resetBlock() {
  cancelAnimationFrame(plane.raf);plane.running=false;plane.position=0;plane.velocity=0;plane.last=0;$('release-block').textContent='▶ Soltar el bloque';
  $('plane-status').textContent='Bloque en reposo en la parte superior de la rampa.';renderPlane();
}
$('reset-block').addEventListener('click',resetBlock);
$('release-block').addEventListener('click', () => {
  const p=planePhysics();
  if (plane.running) { plane.running=false;cancelAnimationFrame(plane.raf);$('release-block').textContent='▶ Reanudar';$('plane-status').textContent='Simulación pausada.';return; }
  if (plane.position >= 5.35) { plane.position=0;plane.velocity=0; }
  if (p.sticks || p.acceleration <= 0) {
    $('plane-status').textContent='La fricción estática puede equilibrar la componente paralela del peso: el bloque permanece en reposo.';
    return;
  }
  plane.running=true;plane.last=0;$('release-block').textContent='Ⅱ Pausar';$('plane-status').textContent='El bloque se desliza cuesta abajo con aceleración constante en este modelo.';
  const step=(ts)=>{
    if(!plane.running)return;
    if(!plane.last)plane.last=ts;
    const dt=Math.min((ts-plane.last)/1000,.04);plane.last=ts;
    plane.velocity += p.acceleration*dt;
    plane.position += plane.velocity*dt;
    if(plane.position>=5.4){plane.position=5.4;plane.running=false;$('plane-status').textContent='El bloque llegó al final de la rampa.';$('release-block').textContent='▶ Soltar de nuevo';}
    renderPlane();
    if(plane.running)plane.raf=requestAnimationFrame(step);else $('release-block').textContent='▶ Soltar de nuevo';
  };
  plane.raf=requestAnimationFrame(step);
});
$('toggle-plane-steps').addEventListener('click',()=>{
  const box=$('plane-steps');box.hidden=!box.hidden;$('toggle-plane-steps').textContent=box.hidden?'Ver procedimiento paso a paso':'Ocultar procedimiento';
});

// 2. Torque y puerta ----------------------------------------------------------
const door={force:40,arm:.8,angle:90,mass:20,sense:1,phi:0,running:false,raf:0};
function doorValues(){
  const torque=door.sense*door.arm*door.force*Math.sin(rad(door.angle));
  const inertia=(door.mass*1*1)/3; // puerta uniforme, L = 1 m, eje en el borde
  const alpha=inertia===0?0:torque/inertia;
  return {torque,inertia,alpha};
}
function renderDoor(){
  $('door-force-value').textContent=`${door.force} N`;
  $('door-arm-value').textContent=`${fmt(door.arm,2)} m`;
  $('door-angle-value').textContent=`${door.angle}°`;
  $('door-mass-value').textContent=`${door.mass} kg`;
  const v=doorValues();
  $('door-torque').innerHTML=`${fmt(Math.abs(v.torque),1)} <small>N·m</small>`;
  $('door-inertia').innerHTML=`${fmt(v.inertia,2)} <small>kg·m²</small>`;
  $('door-alpha').innerHTML=`${fmt(Math.abs(v.alpha),2)} <small>rad/s²</small>`;
  $('door-torque-work').textContent=`τ = ${fmt(door.arm,2)} · ${door.force} · sen(${door.angle}°) = ${fmt(Math.abs(v.torque),2)} N·m (${door.sense===1?'antihorario':'horario'})`;
  $('door-inertia-work').textContent=`I = ⅓ ML² = ⅓ · ${door.mass} · 1² = ${fmt(v.inertia,2)} kg·m²`;
  $('door-alpha-work').textContent=`α = τ/I = ${fmt(Math.abs(v.torque),2)} / ${fmt(v.inertia,2)} = ${fmt(Math.abs(v.alpha),2)} rad/s²`;
  const hinge={x:125,y:265}, length=430, phi=door.phi;
  const u={x:Math.cos(phi),y:-Math.sin(phi)};
  const end={x:hinge.x+u.x*length,y:hinge.y+u.y*length};
  const rPx=length*door.arm;
  const point={x:hinge.x+u.x*rPx,y:hinge.y+u.y*rPx};
  const forceDirAng=phi+door.sense*rad(door.angle);
  const fdir={x:Math.cos(forceDirAng),y:-Math.sin(forceDirAng)};
  const fLen=door.force===0?0:Math.min(110,door.force*1.35);
  const fEnd={x:point.x+fdir.x*fLen,y:point.y+fdir.y*fLen};
  const closedEnd={x:hinge.x+length,y:hinge.y};
  $('door-scene').innerHTML=`${defsArrowMarkers()}
    <path d="M${hinge.x-30} ${hinge.y-40} L${hinge.x-30} ${hinge.y+40}" stroke="#7c8fae" stroke-width="9" stroke-linecap="round"/>
    <line x1="${hinge.x}" y1="${hinge.y}" x2="${closedEnd.x}" y2="${closedEnd.y}" stroke="#cbd7e8" stroke-width="3" stroke-dasharray="7 7"/>
    <line x1="${hinge.x}" y1="${hinge.y}" x2="${end.x}" y2="${end.y}" stroke="#8b5c31" stroke-width="23" stroke-linecap="round"/>
    <line x1="${hinge.x}" y1="${hinge.y}" x2="${end.x}" y2="${end.y}" stroke="#d9a56e" stroke-width="14" stroke-linecap="round"/>
    <circle cx="${hinge.x}" cy="${hinge.y}" r="11" fill="#345c95" stroke="#fff" stroke-width="4"/>
    <circle cx="${end.x}" cy="${end.y}" r="7" fill="#8f5a2c" stroke="#fff" stroke-width="2"/>
    <circle cx="${point.x}" cy="${point.y}" r="8" fill="#2864e3" stroke="#fff" stroke-width="3"/>
    ${door.force>0?arrow(point.x,point.y,fEnd.x,fEnd.y,'#e4484e','F',8,-8,4):''}
    <path d="M${hinge.x+70} ${hinge.y} A70 70 0 ${Math.abs(door.phi)>.8?1:0} ${door.phi<0?1:0} ${hinge.x+70*Math.cos(phi)} ${hinge.y-70*Math.sin(phi)}" fill="none" stroke="#2764ce" stroke-width="3"/>
    <text x="${hinge.x-8}" y="${hinge.y+62}" fill="#2452a0" font-size="13" font-weight="800">Eje / bisagras</text>
    <text x="${(hinge.x+point.x)/2-5}" y="${(hinge.y+point.y)/2-13}" fill="#2058bd" font-size="14" font-weight="800">r = ${fmt(door.arm,2)} m</text>
    <text x="${Math.min(end.x-35,640)}" y="${Math.max(45,end.y-24)}" fill="#6c7e98" font-size="12">Puerta</text>
    <text x="420" y="325" fill="#8190a7" font-size="11">Línea punteada: posición inicial</text>`;
}
function setDoorParam(key,value){door[key]=value;renderDoor();}
[['door-force','force'],['door-arm','arm'],['door-angle','angle'],['door-mass','mass']].forEach(([id,key])=>$(id).addEventListener('input',e=>{cancelAnimationFrame(door.raf);door.running=false;door.phi=0;setDoorParam(key,Number(e.target.value));}));
document.querySelectorAll('[data-sense]').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('[data-sense]').forEach(b=>b.classList.toggle('selected',b===btn));
  door.sense=Number(btn.dataset.sense);door.phi=0;renderDoor();
}));
function resetDoorMotion(){cancelAnimationFrame(door.raf);door.running=false;door.phi=0;renderDoor();$('door-status').textContent='Puerta en su posición inicial.';}
$('reset-door-motion').addEventListener('click',resetDoorMotion);
$('reset-door').addEventListener('click',()=>{
  Object.assign(door,{force:40,arm:.8,angle:90,mass:20,sense:1,phi:0});
  $('door-force').value=40;$('door-arm').value=.8;$('door-angle').value=90;$('door-mass').value=20;
  document.querySelectorAll('[data-sense]').forEach(b=>b.classList.toggle('selected',b.dataset.sense==='1'));
  resetDoorMotion();renderDoor();
});
$('apply-torque').addEventListener('click',()=>{
  cancelAnimationFrame(door.raf);door.running=false;
  const v=doorValues();
  if(Math.abs(v.torque)<.001){$('door-status').textContent='El torque es cero: con esta dirección de fuerza no se produce giro.';return;}
  door.running=true;const start=performance.now();const initial=door.phi;
  $('door-status').textContent='La puerta está girando por efecto del torque aplicado.';
  const animate=(now)=>{
    const t=Math.min((now-start)/1000,1.6);
    door.phi=initial+.5*v.alpha*t*t;
    renderDoor();
    if(t<1.6 && Math.abs(door.phi)<rad(105)){door.raf=requestAnimationFrame(animate);}else{door.running=false;$('door-status').textContent='La aplicación del torque terminó. Reinicia la puerta para probar otra configuración.';}
  };
  door.raf=requestAnimationFrame(animate);
});

// 3. Vigas y sumatoria de torques --------------------------------------------
const loads=[{force:30,pos:-1.5},{force:30,pos:1.5},{force:0,pos:.5}];
function renderBeam(){
  let ccw=0,cw=0;const terms=[];
  loads.forEach((load,i)=>{
    $(`load${i+1}-force-value`).textContent=`${load.force} N`;
    $(`load${i+1}-pos-value`).textContent=`${fmt(load.pos,1)} m`;
    const torque=-load.pos*load.force;
    if(torque>0)ccw+=torque;else cw+=Math.abs(torque);
    terms.push({load,torque,i});
  });
  const net=ccw-cw;
  $('beam-ccw').innerHTML=`${fmt(ccw,1)} <small>N·m</small>`;
  $('beam-cw').innerHTML=`${fmt(cw,1)} <small>N·m</small>`;
  $('beam-net').innerHTML=`${fmt(net,1)} <small>N·m</small>`;
  const balanced=Math.abs(net)<.05;
  $('beam-balance').className=`balance-banner ${balanced?'balanced':'unbalanced'}`;
  $('beam-balance').textContent=balanced?'✓ Equilibrio rotacional: Στ = 0':net>0?'La viga tiende a girar en sentido antihorario':'La viga tiende a girar en sentido horario';
  $('beam-calculation').innerHTML=terms.map(({load,torque,i})=>`<div class="beam-term"><span>Carga ${i+1}: τ${i+1} = −rF</span><strong>−(${fmt(load.pos,1)})(${load.force}) = ${fmt(torque,1)} N·m</strong></div>`).join('')+
    `<div class="beam-term"><span>Sumatoria</span><strong>Στ = ${fmt(ccw,1)} − ${fmt(cw,1)} = ${fmt(net,1)} N·m</strong></div>`;
  const pivot={x:350,y:195}, beamLen=520, pixelsPerM=beamLen/4;
  let content=`${defsArrowMarkers()}<line x1="${pivot.x-beamLen/2}" y1="${pivot.y}" x2="${pivot.x+beamLen/2}" y2="${pivot.y}" stroke="#9a7045" stroke-width="17" stroke-linecap="round"/><path d="M${pivot.x-34} ${pivot.y+60} L${pivot.x+34} ${pivot.y+60} L${pivot.x} ${pivot.y+5} Z" fill="#7b99c2" stroke="#476b9f" stroke-width="2"/><circle cx="${pivot.x}" cy="${pivot.y}" r="8" fill="#1e4f96" stroke="#fff" stroke-width="3"/><text x="${pivot.x+12}" y="${pivot.y+81}" fill="#71829b" font-size="12">Apoyo</text>`;
  loads.forEach((load,i)=>{
    if(load.force<=0)return;
    const x=pivot.x+load.pos*pixelsPerM;
    const len=35+load.force*0.75;
    content+=`<line x1="${x}" y1="${pivot.y-10}" x2="${x}" y2="${pivot.y+len}" stroke="#e4484e" stroke-width="4" marker-end="url(#arrow-e4484e)"/><text x="${x+9}" y="${pivot.y+len+17}" fill="#bd3c45" font-size="12" font-weight="800">${load.force} N</text><text x="${x-20}" y="${pivot.y-18}" fill="#526b90" font-size="11">${fmt(load.pos,1)} m</text>`;
  });
  content+=`<text x="${pivot.x-beamLen/2}" y="${pivot.y+110}" fill="#75859d" font-size="12">Izquierda</text><text x="${pivot.x+beamLen/2-60}" y="${pivot.y+110}" fill="#75859d" font-size="12">Derecha</text>`;
  $('beam-scene').innerHTML=content;
}
[1,2,3].forEach(i=>{
  $(`load${i}-force`).addEventListener('input',e=>{loads[i-1].force=Number(e.target.value);renderBeam();});
  $(`load${i}-pos`).addEventListener('input',e=>{loads[i-1].pos=Number(e.target.value);renderBeam();});
});
$('reset-beam').addEventListener('click',()=>{
  const defaults=[{force:30,pos:-1.5},{force:30,pos:1.5},{force:0,pos:.5}];
  defaults.forEach((v,i)=>{loads[i]=v;$(`load${i+1}-force`).value=v.force;$(`load${i+1}-pos`).value=v.pos;});renderBeam();
});

// 4. Reto contrarreloj --------------------------------------------------------
let quiz={active:false,remaining:90,timer:0,queue:[],correct:0,errors:0,current:null,answered:false,total:0,shown:0,raf:0};
function makeQuizQuestions(){
  const m=4,theta=30;
  const vector={id:'vector-weight',type:'vector',prompt:'Selecciona en el diagrama el vector que representa el peso del bloque.',answer:'weight',explain:'El peso siempre apunta verticalmente hacia abajo, independientemente de la inclinación del plano.'};
  const vectorNormal={id:'vector-normal',type:'vector',prompt:'Selecciona el vector que representa la fuerza normal.',answer:'normal',explain:'La normal es perpendicular a la superficie de contacto y apunta hacia afuera del plano.'};
  const vectorFriction={id:'vector-friction',type:'vector',prompt:'El bloque se desliza cuesta abajo. Selecciona el vector de fricción.',answer:'friction',explain:'La fricción se opone al deslizamiento; en este caso apunta cuesta arriba.'};
  const q=[
    vector,vectorNormal,vectorFriction,
    {id:'parallel-component',type:'mc',prompt:'¿Qué expresión representa la componente del peso paralela a la rampa?',options:['mg sen θ','mg cos θ','μN','mg'],answer:0,explain:'La componente paralela al plano es mg sen θ.'},
    {id:'parallel-value',type:'mc',prompt:`Un bloque de ${m} kg está en una rampa de ${theta}°, sin fricción. ¿Cuánto vale aproximadamente la componente paralela del peso?`,options:['9,8 N','19,6 N','34,0 N','39,2 N'],answer:1,explain:'P∥ = mg sen θ = 4 · 9,81 · sen(30°) ≈ 19,6 N.'},
    {id:'normal-value',type:'mc',prompt:`Para el mismo bloque (4 kg, 30°), ¿cuánto vale aproximadamente la normal?`,options:['19,6 N','24,5 N','34,0 N','39,2 N'],answer:2,explain:'N = mg cos(30°) = 4 · 9,81 · 0,866 ≈ 34,0 N.'},
    {id:'acc-value',type:'mc',prompt:'Sin fricción, ¿cuál es la aceleración de un bloque que baja por una rampa de 30°?',options:['2,45 m/s²','4,91 m/s²','8,50 m/s²','9,81 m/s²'],answer:1,explain:'a = g sen(30°) = 9,81 · 0,5 = 4,905 m/s².'},
    {id:'torque-value',type:'mc',prompt:'Una fuerza perpendicular de 20 N se aplica a 0,5 m del eje. ¿Qué torque produce?',options:['5 N·m','10 N·m','20 N·m','40 N·m'],answer:1,explain:'τ = rF sen(90°) = 0,5 · 20 · 1 = 10 N·m.'},
    {id:'torque-angle',type:'mc',prompt:'Se aplica una fuerza de 40 N a 0,25 m del eje, formando 30° con el brazo. ¿Cuál es el torque?',options:['2,5 N·m','5 N·m','10 N·m','17,3 N·m'],answer:1,explain:'τ = 0,25 · 40 · sen(30°) = 5 N·m.'},
    {id:'zero-torque',type:'mc',prompt:'¿En cuál situación el torque respecto a las bisagras es cero?',options:['Empujar perpendicularmente en la manija','Empujar en la manija formando 45°','Empujar a lo largo de la puerta','Aumentar la fuerza perpendicular'],answer:2,explain:'Cuando la fuerza es paralela al brazo de palanca, sen(0°) = 0 y no produce torque.'},
    {id:'equilibrium',type:'mc',prompt:'¿Cuál es la condición de equilibrio rotacional?',options:['ΣF = 0 solamente','Στ = 0','τ = rF','La fuerza debe ser cero'],answer:1,explain:'En equilibrio rotacional, la suma algebraica de los torques respecto al eje es cero.'}
  ];
  return q.sort(()=>Math.random()-.5);
}
function renderQuizVector(){
  const svg=`<svg viewBox="0 0 560 280" role="img" aria-label="Diagrama de fuerzas sin etiquetas">
    ${defsArrowMarkers()}
    <line x1="70" y1="220" x2="465" y2="100" stroke="#8199bb" stroke-width="12" stroke-linecap="round"/>
    <g transform="translate(280 156) rotate(-17)"><rect x="-32" y="-30" width="64" height="60" rx="8" fill="#e9a33a" stroke="#a16b1e" stroke-width="2"/></g>
    <g class="force-arrow" data-force="weight"><line class="hit" x1="280" y1="156" x2="280" y2="255"/><line x1="280" y1="156" x2="280" y2="255" stroke="#e4484e" stroke-width="5" stroke-linecap="round" marker-end="url(#arrow-e4484e)"/><circle cx="280" cy="255" r="11" fill="transparent" stroke="transparent"/></g>
    <g class="force-arrow" data-force="normal"><line class="hit" x1="280" y1="156" x2="248" y2="58"/><line x1="280" y1="156" x2="248" y2="58" stroke="#2465dc" stroke-width="5" stroke-linecap="round" marker-end="url(#arrow-2465dc)"/></g>
    <g class="force-arrow" data-force="friction"><line class="hit" x1="280" y1="156" x2="370" y2="129"/><line x1="280" y1="156" x2="370" y2="129" stroke="#269d76" stroke-width="5" stroke-linecap="round" marker-end="url(#arrow-269d76)"/></g>
    <g class="force-arrow" data-force="parallel"><line class="hit" x1="280" y1="156" x2="205" y2="179"/><line x1="280" y1="156" x2="205" y2="179" stroke="#e49a2e" stroke-width="3" stroke-dasharray="6 4" marker-end="url(#arrow-e49a2e)"/></g>
    <text x="70" y="258" fill="#7487a3" font-size="11">Diagrama esquemático · toque una flecha</text>
  </svg>`;
  return `<p class="quiz-prompt">${quiz.current.prompt}</p><p class="quiz-subprompt">Toca directamente una de las flechas del dibujo.</p><div class="quiz-vector-diagram">${svg}</div>`;
}
function renderQuizQuestion(){
  quiz.answered=false;$('next-question').hidden=true;$('quiz-feedback').textContent='';$('quiz-feedback').className='quiz-feedback';
  const q=quiz.current;quiz.shown++;$('quiz-progress-label').textContent=`Intento ${quiz.shown} · ${quiz.queue.length} preguntas pendientes`;
  $('quiz-progress-bar').style.width=`${(quiz.correct/(quiz.total||1))*100}%`;
  if(q.type==='vector'){
    $('quiz-question').innerHTML=renderQuizVector();
    $('quiz-question').querySelector('svg').addEventListener('click',(e)=>{
      const g=e.target.closest('[data-force]');if(!g||quiz.answered)return;answerQuiz(g.dataset.force===q.answer);
    });
  } else {
    $('quiz-question').innerHTML=`<p class="quiz-prompt">${q.prompt}</p><div class="quiz-options">${q.options.map((o,i)=>`<button class="quiz-option" data-option="${i}">${o}</button>`).join('')}</div>`;
    $('quiz-question').querySelectorAll('[data-option]').forEach(btn=>btn.addEventListener('click',()=>{
      if(quiz.answered)return;
      const ok=Number(btn.dataset.option)===q.answer;
      $('quiz-question').querySelectorAll('.quiz-option').forEach(b=>{b.disabled=true;if(Number(b.dataset.option)===q.answer)b.style.borderColor='#27a36a';});
      answerQuiz(ok);
    }));
  }
  updateQuizStats();
}
function answerQuiz(correct){
  if(quiz.answered||!quiz.active)return;quiz.answered=true;
  const q=quiz.current,feedback=$('quiz-feedback');
  if(correct){quiz.correct++;feedback.textContent=`✓ ¡Correcto! ${q.explain}`;feedback.className='quiz-feedback good';}
  else{quiz.errors++;quiz.queue.push(q);feedback.textContent=`✕ Todavía no. ${q.explain} Esta pregunta volverá al final.`;feedback.className='quiz-feedback bad';}
  $('quiz-remaining').textContent=quiz.queue.length;
  $('quiz-progress-bar').style.width=`${(quiz.correct/(quiz.total||1))*100}%`;
  $('next-question').hidden=false;
  if(quiz.queue.length===0){$('next-question').textContent='Ver resultado';}else{$('next-question').textContent='Siguiente pregunta';}
  updateQuizStats();
}
function updateQuizStats(){
  $('quiz-correct').textContent=quiz.correct;$('quiz-errors').textContent=quiz.errors;$('quiz-remaining').textContent=quiz.queue.length;
  $('quiz-time').textContent=`${String(Math.floor(quiz.remaining/60)).padStart(2,'0')}:${String(quiz.remaining%60).padStart(2,'0')}`;
}
function nextQuizQuestion(){
  if(!quiz.active)return;
  if(quiz.queue.length===0){endQuiz(true);return;}
  quiz.current=quiz.queue.shift();renderQuizQuestion();
}
function startQuiz(){
  clearInterval(quiz.timer);quiz.active=true;quiz.remaining=90;quiz.queue=makeQuizQuestions();quiz.total=quiz.queue.length;quiz.correct=0;quiz.errors=0;quiz.shown=0;quiz.current=quiz.queue.shift();
  $('challenge-intro').style.display='none';$('quiz-result').hidden=true;$('quiz-stats').hidden=false;$('quiz-card').hidden=false;$('next-question').hidden=true;
  renderQuizQuestion();
  quiz.timer=setInterval(()=>{quiz.remaining--;updateQuizStats();if(quiz.remaining<=0)endQuiz(false);},1000);
}
function endQuiz(completed){
  quiz.active=false;clearInterval(quiz.timer);$('quiz-card').hidden=true;$('quiz-result').hidden=false;
  const title=completed?'¡Completaste el reto!':'¡Se acabó el tiempo!';
  $('quiz-result').innerHTML=`<h3>${title}</h3><div class="result-score">${quiz.correct}/${quiz.total}</div><p>Respuestas correctas: <b>${quiz.correct}</b> · Errores: <b>${quiz.errors}</b></p><p>${completed?'Has resuelto todas las preguntas, incluidas las que tuviste que repetir.':'Puedes volver a intentarlo para completar las preguntas pendientes.'}</p><button class="button primary" id="restart-quiz">Volver a jugar</button>`;
  $('restart-quiz').addEventListener('click',startQuiz);
  $('challenge-intro').style.display='flex';$('start-quiz').textContent='Intentar de nuevo';
}
$('start-quiz').addEventListener('click',startQuiz);
$('next-question').addEventListener('click',nextQuizQuestion);

// Inicialización --------------------------------------------------------------
renderPlane();renderDoor();renderBeam();
