(()=>{
  const levels=[100,115,130];
  const storageKey='meu-dinheiro-zoom';
  let level=Number(localStorage.getItem(storageKey));
  if(!levels.includes(level))level=100;
  const value=document.querySelector('#zoom-value');
  const apply=()=>{
    document.documentElement.dataset.appZoom=String(level);
    if(value)value.textContent=level+'%';
    localStorage.setItem(storageKey,String(level));
  };
  document.querySelector('#zoom-out').addEventListener('click',()=>{
    level=levels[Math.max(0,levels.indexOf(level)-1)];apply();
  });
  document.querySelector('#zoom-in').addEventListener('click',()=>{
    level=levels[Math.min(levels.length-1,levels.indexOf(level)+1)];apply();
  });
  apply();
})();
