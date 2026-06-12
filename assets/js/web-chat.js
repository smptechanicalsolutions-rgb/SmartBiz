(function(){
  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  const answers = [
    {
      keys: ['hi', 'hii', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
      answer: 'Hello! I am your web assistant. Ask me anything about websites, invoices, CMS, or business pages and I will answer clearly.'
    },
    {
      keys: ['bye', 'goodbye', 'see you', 'later', 'talk soon'],
      answer: 'Goodbye! If you need more help, return anytime and ask another question about your site or documents.'
    },
    {
      keys: ['thanks', 'thank you', 'thx', 'ty'],
      answer: 'You are welcome! I’m here to help with website design, CMS pages, invoices, and more.'
    },
    {
      keys: ['html', 'markup', 'tags'],
      answer: 'HTML is the page structure. Use semantic tags like header, section, article, nav, and footer so content is easy to follow. Keep headings clear and use paragraphs, lists, and tables where appropriate. A clean HTML structure makes styling easier and improves accessibility.'
    },
    {
      keys: ['css', 'style', 'styling'],
      answer: 'CSS controls colors, spacing, fonts, and layout. Build a consistent style system with a small palette, comfortable spacing, and readable typography. Use flexbox or grid for layout, keep designs responsive with media queries, and avoid inline styling so your pages stay easy to update.'
    },
    {
      keys: ['javascript', 'js', 'script', 'interactive'],
      answer: 'JavaScript adds interactivity to your website. Use it for form validation, menu toggles, dynamic totals, and useful feedback. Keep logic simple: attach events, update the DOM, and avoid large libraries when a small script is enough.'
    },
    {
      keys: ['hosting', 'domain', 'server', 'deploy'],
      answer: 'A website needs hosting and a domain. Hosting stores your files; the domain is the address people type. Choose a host with HTTPS support, backups, and good uptime. Deploy by uploading your site files or using a hosting platform, then connect the domain and test the live site.'
    },
    {
      keys: ['seo', 'search engine', 'google', 'optimization'],
      answer: 'SEO helps search engines understand your site. Use a clear page title, descriptive meta description, and structured headings. Add alt text to images, use friendly URLs, and keep pages fast and mobile-ready. Good content and page clarity matter more than keywords alone.'
    },
    {
      keys: ['responsive', 'mobile', 'tablet', 'breakpoint'],
      answer: 'Responsive design means the website works on phones, tablets, and desktops. Use fluid widths, flexible grids, and stack content vertically on smaller screens. Increase button size, adjust text spacing, and keep the layout clean so the mobile experience feels easy and readable.'
    },
    {
      keys: ['cms', 'content management', 'page editor'],
      answer: 'A CMS helps you update pages without coding. Use the editor for page text, images, SEO metadata, and publish schedules. Keep titles clear, add short summaries, and publish content when ready so the website stays current and easy to manage.'
    },
    {
      keys: ['invoice', 'billing', 'gst', 'tax', 'document'],
      answer: 'Invoices should show items, quantity, rate, taxes, and totals in a clear table. Add a summary section with the final amount and payment terms. Good invoice layout removes confusion and makes it easy for customers to pay.'
    },
    {
      keys: ['design', 'layout', 'ui', 'ux'],
      answer: 'Good design is clean, simple, and easy to scan. Use consistent spacing, readable text, and clear buttons. Group related content in cards or sections, and keep the interface uncluttered so users can find what they need fast.'
    },
    {
      keys: ['backup', 'save', 'download', 'export'],
      answer: 'Backups protect your website and business data. Export content regularly and keep copies in a safe place. If something goes wrong, restore from backup to avoid losing important information.'
    },
    {
      keys: ['link', 'share', 'whatsapp', 'message'],
      answer: 'To share website details, use short text and a direct link. For WhatsApp, create a message with a clear summary and the page URL. This helps customers open the right page quickly.'
    },
    {
      keys: ['faq', 'help', 'support'],
      answer: 'A good FAQ gives quick answers to common questions. Keep entries short and actionable, and include a clear way to get more help. This makes the website feel more friendly and easy to use.'
    },
    {
      keys: ['security', 'password', 'login', 'auth'],
      answer: 'Security starts with strong passwords and HTTPS. Use verified email or secure login flows, and keep sessions limited. Protect sensitive data and log out on shared devices.'
    }
  ];

  const fallback = 'This chat assistant is focused on website and business document topics. Ask about website design, hosting, SEO, CMS, invoices, or SmartBiz features for the best answer.';

  const suggestions = [
    'How do I create a responsive website?',
    'What makes a good invoice layout?',
    'How can I improve SEO for my business?',
    'How do I publish a CMS page?',
    'How do I secure login and passwords?'
  ];

  function appendMessage(type, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${type}`;
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = type === 'user' ? 'You' : 'AI';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    if (type === 'bot') {
      wrapper.appendChild(avatar);
      wrapper.appendChild(bubble);
    } else {
      wrapper.appendChild(bubble);
      wrapper.appendChild(avatar);
    }
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function isGreeting(text) {
    return /\b(hi|hii|hello|hey|good morning|good afternoon|good evening)\b/.test(text);
  }

  function isFarewell(text) {
    return /\b(bye|goodbye|see you|talk soon|later)\b/.test(text);
  }

  function isThankYou(text) {
    return /\b(thanks|thank you|thx|ty)\b/.test(text);
  }

  function findAnswer(text) {
    const normalized = text.toLowerCase();
    if (isGreeting(normalized)) {
      return 'Hello! I am your web assistant. Ask me anything about websites, invoices, CMS, or business pages and I will answer clearly.';
    }
    if (isFarewell(normalized)) {
      return 'Goodbye! If you need more help, return anytime and ask another question about your site or documents.';
    }
    if (isThankYou(normalized)) {
      return 'You’re welcome! I’m here to help with your website, CMS, invoices, and business pages whenever you need it.';
    }

    for (const item of answers) {
      if (item.keys.some(key => normalized.includes(key))) {
        return item.answer;
      }
    }

    const detailed = [];
    if (normalized.includes('how') || normalized.includes('what') || normalized.includes('why')) {
      detailed.push('I can help with website setup, design, SEO, hosting, CMS publishing, invoices, and security.');
    }
    if (normalized.includes('website') || normalized.includes('site')) {
      detailed.push('Start with a clear page structure, simple styling, and a fast mobile-friendly layout.');
    }
    if (normalized.includes('invoice') || normalized.includes('billing')) {
      detailed.push('Show item details, tax, and totals clearly, then add payment terms and contact info.');
    }
    if (detailed.length > 0) {
      return detailed.join(' ');
    }

    return fallback;
  }

  function setInputHeight() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(160, inputEl.scrollHeight) + 'px';
  }

  window.sendMessage = function() {
    const text = inputEl.value.trim();
    if (!text) return;
    appendMessage('user', text);
    inputEl.value = '';
    setInputHeight();
    sendBtn.disabled = true;
    setTimeout(() => {
      const answer = findAnswer(text);
      appendMessage('bot', answer);
      sendBtn.disabled = false;
      inputEl.focus();
    }, 320);
  };

  window.clearChat = function() {
    messagesEl.innerHTML = '';
    inputEl.focus();
    appendMessage('bot', 'Ready when you are. Ask a web question or tap a suggestion below.');
  };

  window.goBack = function() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'home.html';
    }
  };

  window.startDemo = function() {
    clearChat();
    suggestions.forEach((example, index) => {
      setTimeout(() => {
        appendMessage('user', example);
        setTimeout(() => {
          appendMessage('bot', findAnswer(example));
        }, 320);
      }, index * 900);
    });
  };

  window.selectSuggestion = function(text) {
    inputEl.value = text;
    setInputHeight();
    sendMessage();
  };

  inputEl.addEventListener('keydown', function(event){
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  inputEl.addEventListener('input', setInputHeight);
  setInputHeight();
  inputEl.focus();
  appendMessage('bot', 'Hello! Ask a website or business document question and I will answer in clear, easy language.');
})();
