(function(){
  // Simple color utilities
  function parseRGB(css) {
    if (!css) return null;
    css = css.trim();
    if (css.startsWith('rgb')) {
      const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
      if (m) return [parseInt(m[1]),parseInt(m[2]),parseInt(m[3]), m[4]?parseFloat(m[4]):1];
    }
    // hex
    if (css[0]==='#'){
      let hex = css.slice(1);
      if (hex.length===3) hex = hex.split('').map(h=>h+h).join('');
      const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
      return [r,g,b,1];
    }
    return null;
  }

  function luminance([r,g,b]){
    const srgb=[r,g,b].map(v=>v/255).map(c => c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4));
    return 0.2126*srgb[0]+0.7152*srgb[1]+0.0722*srgb[2];
  }
  function contrastRatio(rgb1,rgb2){
    const L1=luminance(rgb1), L2=luminance(rgb2);
    const lighter=Math.max(L1,L2), darker=Math.min(L1,L2);
    return (lighter+0.05)/(darker+0.05);
  }
  function darken([r,g,b,a],factor){
    return [Math.max(0,Math.round(r*factor)), Math.max(0,Math.round(g*factor)), Math.max(0,Math.round(b*factor)), a];
  }
  function toCSS(rgb){ return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; }

  function checkButtons(){
    const buttons = Array.from(document.querySelectorAll('.btn, button, a.btn'));
    buttons.forEach(btn=>{
      const style = window.getComputedStyle(btn);
      const fg = parseRGB(style.color) || [0,0,0];
      // determine background: climb until non-transparent
      let bg = null; let el = btn;
      while(el && el !== document.documentElement){
        const s = window.getComputedStyle(el);
        const b = parseRGB(s.backgroundColor);
        if (b && !(b[0]===0 && b[1]===0 && b[2]===0 && b[3]===0)) { bg=b; break; }
        el = el.parentElement;
      }
      if (!bg) bg = [255,255,255];
      const ratio = contrastRatio(fg,bg);
      if (ratio < 4.5){
        console.warn('Low contrast for button:', btn, 'ratio:', ratio.toFixed(2));
        btn.classList.add('low-contrast');
        // apply corrective darker background if computed background appears light
        try{
          const darker = darken(bg, 0.82);
          btn.style.backgroundColor = toCSS(darker);
          btn.style.color = '#ffffff';
        }catch(e){}
      }
    });
  }

  // Run checks after load and on resize
  function run(){
    try{ checkButtons(); }catch(e){console.warn('a11y check failed',e);}  
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', run); else run();
  window.addEventListener('resize', function(){ setTimeout(run,120); });
})();
