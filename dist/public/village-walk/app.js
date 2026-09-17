(()=>{
 const img=document.getElementById('screen'), hs=document.getElementById('hotspots'), game=document.getElementById('game');
 const A={birds:new Audio('audio/birds.mp3'),walk:new Audio('audio/walk.mp3'),click:new Audio('audio/click.mp3'),next:new Audio('audio/next.mp3'),record:new Audio('audio/record.mp3'),success:new Audio('audio/success.mp3'),finish:new Audio('audio/finish.mp3')};
 
 let bgmVolume = 0.5;
 let sfxVolume = 0.5;
 A.birds.loop=true; A.birds.volume=bgmVolume * 0.32; A.walk.volume=sfxVolume;

 const bgmSlider = document.getElementById('bgmVol');
 const bgmVal = document.getElementById('bgmVal');
 const sfxSlider = document.getElementById('sfxVol');
 const sfxVal = document.getElementById('sfxVal');

 if (bgmSlider) {
   bgmSlider.oninput = (e) => {
     bgmVolume = Number(e.target.value) / 100;
     A.birds.volume = bgmVolume * 0.32;
     if (bgmVal) bgmVal.textContent = `${e.target.value}%`;
   };
 }
 if (sfxSlider) {
   sfxSlider.oninput = (e) => {
     sfxVolume = Number(e.target.value) / 100;
     if (sfxVal) sfxVal.textContent = `${e.target.value}%`;
   };
 }
 const hints={2:'看看巷子通往哪裡，再觀察沿途有哪些客莊景物。',4:'觀察道路的轉彎位置，以及建築所在的位置。',6:'仔細看看屋頂的形狀、外觀與建築特色。',8:'仔細看看牆面、屋頂與門窗使用了哪些材料。',10:'觀察人物的動作，以及桌面和周圍環境。',12:'仔細觀察這些手工用品的外形、材料與用途。',14:'觀察居民正在做什麼，再想想你最想了解哪一件事。',16:'看看周圍有哪些傳統物件，再觀察它們與生活環境的關係。',18:'回想前面走過的地方，以及你看到的人、建築、物件和生活情境。',20:'回想整趟走讀經驗，再整理自己最想分享的內容。'};
 // 每一頁都使用自己的按鍵座標；不共用固定熱區，避免點到圖片上不存在的區域。
 const controls={
  1:{start:[4.8,68.8,27.2,11.5]},
  2:{hint:[4.2,51.0,28.0,6.8],record:[5.0,63.0,28.0,20.5]},
  3:{retry:[4.4,73.5,14.1,8.8],next:[19.1,73.5,14.0,8.8]},
  4:{hint:[4.2,49.8,28.0,6.8],record:[5.0,59.0,28.0,20.5]},
  5:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
  6:{hint:[4.2,52.0,28.0,6.8],record:[5.0,61.5,28.0,20.5]},
  7:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
  8:{hint:[4.2,50.0,28.0,6.8],record:[5.0,59.0,28.0,20.5]},
  9:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 10:{hint:[4.2,57.0,28.0,6.8],record:[5.0,68.0,28.0,18.0]},
 11:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 12:{hint:[4.2,56.5,28.0,6.8],record:[5.0,67.0,28.0,18.0]},
 13:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 14:{hint:[4.2,49.0,28.0,6.8],record:[5.0,59.0,28.0,20.0]},
 15:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 16:{hint:[4.2,55.5,28.0,6.8],record:[5.0,66.0,28.0,18.5]},
 17:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 18:{hint:[4.2,56.0,28.0,6.8],record:[5.0,66.0,28.0,18.5]},
 19:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 20:{hint:[4.2,53.0,28.0,6.8],record:[5.0,63.0,28.0,20.0]},
 21:{retry:[4.4,72.7,14.1,8.8],finish:[19.1,72.7,16.8,8.8]},
 22:{replay:[32.6,79.8,16.2,7.8],done:[50.2,79.8,16.8,7.8]}
 };
 let page=1, recording=false, busy=false, recorder=null, stream=null, hintOpen=false;
 const play=(a)=>{try{if(a){a.volume=sfxVolume;a.currentTime=0;a.play().catch(()=>{})}}catch(e){}};
 const birds=()=>{if(!recording&&(page===1||[2,4,6,8,10,12,14,16,18,20].includes(page))){A.birds.volume=bgmVolume*0.32;A.birds.play().catch(()=>{})}else A.birds.pause()};
 const stopBirds=()=>{A.birds.pause();A.birds.currentTime=0};
 function closeHint(){hintOpen=false;const c=document.getElementById('hintCard');if(c)c.remove()}
 function go(n){recording=false;busy=false;cleanupMic();closeHint();page=Math.max(1,Math.min(22,n));img.src=`images/${String(page).padStart(2,'0')}.jpg`;render();setTimeout(birds,100)}
 function hit(box,fn,label){if(!box)return;const [x,y,w,h]=box;const b=document.createElement('button');b.className='hit';b.style.cssText=`left:${x}%;top:${y}%;width:${w}%;height:${h}%`;b.setAttribute('aria-label',label);b.onclick=fn;hs.appendChild(b)}
 function toggleHint(){play(A.click);if(hintOpen){closeHint();return}const text=hints[page];if(!text)return;hintOpen=true;const c=document.createElement('div');c.id='hintCard';c.className='hint-card';c.setAttribute('role','status');c.innerHTML=`<div class="hint-title">💡 觀察提示</div><div class="hint-text">${text}</div>`;game.appendChild(c)}
 function transition(n){closeHint();play(A.next);setTimeout(()=>{play(A.walk);go(n)},250)}
 function cleanupMic(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}recorder=null}
 async function startRecording(){if(busy||recording)return;closeHint();stopBirds();play(A.record);try{stream=await navigator.mediaDevices.getUserMedia({audio:true});recorder=new MediaRecorder(stream);recorder.start();recording=true}catch(e){recording=true}}
 function stopAndRecognize(){if(busy||!recording)return;busy=true;recording=false;try{if(recorder&&recorder.state!=='inactive')recorder.stop()}catch(e){}cleanupMic();setTimeout(()=>{play(A.success);go(page+1)},650)}
 function recordToggle(){if(recording)stopAndRecognize();else startRecording()}
 function render(){hs.innerHTML='';closeHint();const c=controls[page]||{};
  if(page===1){hit(c.start,()=>{play(A.click);transition(2)},'開始挑戰');return}
  if(page>=2&&page<=20&&page%2===0){hit(c.hint,toggleHint,'觀察提示');hit(c.record,recordToggle,'開始錄音／停止錄音並送出辨識');return}
  if(page>=3&&page<=21&&page%2===1){hit(c.retry,()=>{play(A.click);go(page-1)},'重新錄音');if(page===21)hit(c.finish,()=>transition(22),'完成挑戰');else hit(c.next,()=>transition(page+1),'下一題');return}
  if(page===22){play(A.finish);hit(c.replay,()=>{play(A.click);go(1)},'再玩一次');hit(c.done,()=>{play(A.click);setTimeout(()=>{location.href='../classroom.html';},400);},'完成')}
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)A.birds.pause();else birds()});render();
})();
