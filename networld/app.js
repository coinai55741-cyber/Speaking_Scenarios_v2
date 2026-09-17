const img=document.querySelector('#screen'), hs=document.querySelector('#hotspots'), bgm=document.querySelector('#bgm');
const sounds={click:new Audio('assets/audio/click.wav'),select:new Audio('assets/audio/select.wav'),page:new Audio('assets/audio/page.wav'),confirm:new Audio('assets/audio/confirm.wav'),correct:new Audio('assets/audio/correct.wav'),achievement:new Audio('assets/audio/achievement.wav')};

let page=1, music=true, recorder=null, stream=null, chunks=[], recording=false;
let bgmVolume=0.5, sfxVolume=0.5;
bgm.volume = bgmVolume;

function play(k){
  try{
    if (sounds[k]) {
      sounds[k].volume = sfxVolume;
      sounds[k].currentTime = 0;
      sounds[k].play().catch(()=>{});
    }
  }catch(e){}
}

const bgmSlider = document.querySelector('#bgmVol');
const bgmVal = document.querySelector('#bgmVal');
const sfxSlider = document.querySelector('#sfxVol');
const sfxVal = document.querySelector('#sfxVal');

if (bgmSlider) {
  bgmSlider.oninput = (e) => {
    bgmVolume = Number(e.target.value) / 100;
    bgm.volume = bgmVolume;
    if (bgmVal) bgmVal.textContent = `${e.target.value}%`;
  };
}
if (sfxSlider) {
  sfxSlider.oninput = (e) => {
    sfxVolume = Number(e.target.value) / 100;
    if (sfxVal) sfxVal.textContent = `${e.target.value}%`;
  };
}

function show(n){
  page=Math.max(1,Math.min(18,n));
  img.src=`assets/images/screen-${String(page).padStart(2,'0')}.jpg`;
  document.querySelector('#status').textContent=`${page} / 18`;
  hs.innerHTML='';
  if(page===18){
    let b=document.createElement('button');b.className='restart';b.textContent='重新挑戰';b.onclick=()=>{play('select');show(1)};hs.appendChild(b);
    let ret=document.createElement('button');ret.className='restart';ret.style.bottom='1.8%';ret.style.background='#2f946f';ret.style.fontSize='clamp(14px,1.5vw,22px)';ret.textContent='返回選單';ret.onclick=()=>{location.href='../classroom.html'};hs.appendChild(ret);
    play('achievement');
    return;
  }
  let b=document.createElement('button');b.className='hot'; b.setAttribute('aria-label','主要操作按鈕');
  if(page===1){Object.assign(b.style,{left:'36%',top:'67%',width:'28%',height:'17%'});b.onclick=()=>{play('select');show(2)}}
  else if(page%2===0){Object.assign(b.style,{left:'62%',top:'68%',width:'27%',height:'22%'});b.onclick=recordToggle}
  else {Object.assign(b.style,{left:'61%',top:'68%',width:'28%',height:'20%'});b.onclick=()=>{play('page');show(page+1)}}
  hs.appendChild(b);
}

async function recordToggle(){
  play('click');
  if(!recording){
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      recorder=new MediaRecorder(stream);
      chunks=[];
      recorder.ondataavailable=e=>chunks.push(e.data);
      recorder.start();
      recording=true;
      document.querySelector('.hint').textContent='錄音中…再次按畫面中的麥克風區域即可停止並送出 Demo。';
    }catch(e){
      alert('請允許瀏覽器使用麥克風後再試一次。');
    }
  }else{
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    if (stream) stream.getTracks().forEach(t=>t.stop());
    recording=false;
    play('confirm');
    setTimeout(()=>{play('correct');show(page+1)},350);
  }
}

document.querySelector('#back').onclick=()=>{play('page');show(page-1)};
document.querySelector('#next').onclick=()=>{play('page');show(page+1)};
document.querySelector('#sound').onclick=async e=>{
  music=!music;
  e.target.textContent=`♫ 音樂：${music?'開':'關'}`;
  if(music){
    try{
      bgm.volume = bgmVolume;
      await bgm.play();
    }catch(_){}
  }else {
    bgm.pause();
  }
};
document.addEventListener('pointerdown',()=>{if(music&&bgm.paused){bgm.volume=bgmVolume;bgm.play().catch(()=>{})}},{once:true});
show(1);
