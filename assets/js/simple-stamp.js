/**
 * Simple Working Stamp System - Just like the original but better
 */

// Simple stamp creation function that always works
window.createSimpleStamp = function(topText, bottomText, centerText, size = 80, color = '#000000') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const c = size / 2;
  const rOuter = Math.floor(size / 2) - 6;
  const rInner = rOuter - 18;
  const rDash = rInner - 18;

  ctx.clearRect(0, 0, size, size);

  // Set styles
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Outer circle
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(c, c, rOuter, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(c, c, rInner, 0, Math.PI * 2);
  ctx.stroke();

  // Dashed circle
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.arc(c, c, rDash, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Top arc text
  if (topText) {
    const fontSize = Math.max(12, Math.floor(size / 11));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    
    const chars = topText.toUpperCase().split('');
    const angleStep = (Math.PI * 0.92) / chars.length;
    let startAngle = -Math.PI / 2 - (Math.PI * 0.92) / 2;
    
    chars.forEach((char, i) => {
      const angle = startAngle + angleStep * i;
      const x = c + (rOuter - 6) * Math.cos(angle);
      const y = c + (rOuter - 6) * Math.sin(angle);
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(char, 0, -3);
      ctx.restore();
    });
  }

  // Bottom arc text
  if (bottomText) {
    const fontSize = Math.max(12, Math.floor(size / 12));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    
    const chars = bottomText.toUpperCase().split('');
    const angleStep = (Math.PI * 0.92) / chars.length;
    let startAngle = Math.PI / 2 - (Math.PI * 0.92) / 2;
    
    chars.forEach((char, i) => {
      const angle = startAngle - angleStep * i;
      const x = c + (rOuter - 9) * Math.cos(angle);
      const y = c + (rOuter - 9) * Math.sin(angle);
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle - Math.PI / 2);
      ctx.fillText(char, 0, 3);
      ctx.restore();
    });
  }

  // Stars
  const starFont = Math.max(14, Math.floor(size / 11.5));
  ctx.font = `bold ${starFont}px Arial, sans-serif`;
  
  // Star 1
  const starAngle1 = (Math.PI / 2) + 0.14 - 0.12;
  const starX1 = c + (rOuter - 9) * Math.cos(starAngle1);
  const starY1 = c + (rOuter - 9) * Math.sin(starAngle1);
  ctx.fillText('★', starX1, starY1);
  
  // Star 2
  const starAngle2 = (Math.PI / 2) + 0.14 + 0.12;
  const starX2 = c + (rOuter - 9) * Math.cos(starAngle2);
  const starY2 = c + (rOuter - 9) * Math.sin(starAngle2);
  ctx.fillText('★', starX2, starY2);

  // Center text
  if (centerText) {
    const fontSize = Math.max(12, Math.floor(size / 15));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillText(centerText, c, c);
  }

  return canvas.toDataURL('image/png');
};

// Simple save function
window.saveSimpleStamp = function() {
  const topInput = document.getElementById('stampTopText');
  const bottomInput = document.getElementById('stampBottomText');
  const centerInput = document.getElementById('stampCompanyName');
  const companyField = document.getElementById('companyName');
  const colorInput = document.getElementById('stampColor');
  
  const top = (topInput && topInput.value) || '';
  const bottom = (bottomInput && bottomInput.value) || 'OFFICIAL';
  const center = (centerInput && centerInput.value) || (companyField && companyField.value) || '';
  const color = (colorInput && colorInput.value) ? colorInput.value : '#000000';
  
  console.log('Creating simple stamp:', { top, bottom, center, color });
  
  const stampData = window.createSimpleStamp(top, bottom, center, 80, color);
  
  // Save to both old and new formats for compatibility
  const stampObj = {
    svg: stampData,
    size: 80,
    topText: top,
    bottomText: bottom,
    centerText: center,
    color: color,
    version: 12,
    createdAt: new Date().toISOString()
  };
  
  localStorage.setItem('invoiceStamp', JSON.stringify(stampObj));
  localStorage.setItem('stampConfig', JSON.stringify(stampObj));
  
  console.log('Simple stamp saved successfully!');
  alert('Stamp saved successfully! Open Preview Document to see it.');
};

// Test function
window.testSimpleStamp = function() {
  console.log('Testing simple stamp...');
  const testStamp = window.createSimpleStamp('TEST', 'OFFICIAL', 'COMPANY', 80, '#000000');
  console.log('Test stamp created:', testStamp ? 'SUCCESS' : 'FAILED');
  alert('Simple stamp test: ' + (testStamp ? 'SUCCESS' : 'FAILED'));
};

console.log('Simple stamp system loaded');
