// translations.js — English & Hindi translation dictionary
const translations = {
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.programmes': 'Programmes',
    'nav.media': 'Media',
    'nav.contact': 'Contact',
    'nav.sursukoon': '🎵 Sur-Sukoon',
    // Hero
    'hero.label': 'Est. 26 January 2005 • Jaipur, Rajasthan',
    'hero.title': 'Utkarsh Samajik Seva Sansthan',
    'hero.tagline': '"An NGO to the people, for the people, by the people"',
    'hero.hindi': '"Dridh Sankalp, Nihswarth Seva, Jankalyan"',
    'hero.btn.explore': 'Explore Programmes',
    'hero.btn.volunteer': 'Volunteer With Us',
    'hero.btn.sursukoon': '← Visit Sur-Sukoon 🎵',
    'banner.visit.sursukoon': 'Visit Sur-Sukoon →',
    // Impact
    'impact.cities': 'Cities Reached',
    'impact.founded': 'Est. Year',
    'impact.volunteers': 'Volunteers',
    'impact.programmes': 'Programmes',
    // Sections
    'section.programmes': 'Our Programmes',
    'section.programmes.heading': 'Creating Change Across Rajasthan',
    'section.programmes.sub': 'Initiatives that create lasting change in communities across Rajasthan',
    'section.upcoming': 'Upcoming Programmes',
    'section.upcoming.label': 'Open for All',
    'section.upcoming.sub': 'Open for everyone — join any upcoming initiative near you',
    'section.news': 'Press Coverage',
    'section.news.sub': 'Utkarsh in the news',
    // About page
    'about.hero.label': 'About Us',
    'about.hero.title': 'Know Who We Are',
    'about.hero.sub': 'A registered NGO committed to social welfare, community development, and people empowerment since 2005.',
    'about.profile': 'Organisation Profile',
    'about.mission': 'Our Mission',
    'about.mandate': 'Core Mandate Areas',
    'about.team': 'Team Strength',
    'about.leadership': 'Leadership',
    'about.operations': 'Areas of Operation',
    // Programmes page
    'prog.hero.label': 'What We Do',
    'prog.hero.title': 'Our Programmes',
    'prog.hero.sub': '8 core initiatives creating meaningful impact across Rajasthan and beyond.',
    // Media page
    'media.hero.label': 'Gallery & News',
    'media.hero.title': 'Media Centre',
    'media.hero.sub': 'Photos, videos, and press coverage from our events and campaigns.',
    // Contact page
    'contact.hero.label': 'Get in Touch',
    'contact.hero.title': 'Contact Us',
    'contact.hero.sub': "We'd love to hear from you. Reach us at our Jaipur or Delhi office.",
    // Buttons
    'btn.joinus': 'Join Us',
    'btn.learnmore': 'Learn More',
    'btn.register': 'Register Now',
    'btn.submit': 'Submit',
    'btn.cancel': 'Cancel',
    'btn.download': 'Download CSV',
    // Forms
    'form.name': 'Full Name',
    'form.phone': 'Phone Number',
    'form.email': 'Email Address',
    'form.message': 'Message',
    'form.required': 'required',
    'form.name.placeholder': 'Enter your full name',
    'form.phone.placeholder': 'Enter your phone number',
    'form.email.placeholder': 'Enter your email address',
    'form.message.placeholder': 'Write your message here...',
    // Contact
    'contact.jaipur': 'Jaipur Office (Main)',
    'contact.delhi': 'Delhi Office',
    'contact.phone': 'Phone',
    'contact.address': 'Address',
    'contact.query': 'Query Type',
    'contact.query.ngo': 'NGO Related',
    'contact.query.ss': 'Sur-Sukoon Related',
    'contact.query.vol': 'Volunteering',
    // Footer
    'footer.quicklinks': 'Quick Links',
    'footer.programmes': 'Programmes',
    'footer.contact': 'Contact',
    'footer.home': 'Home',
    'footer.aboutus': 'About Us',
    'footer.media': 'Media & Gallery',
    'footer.contactus': 'Contact Us',
    'footer.sursukoon': 'Sur-Sukoon Website',
    'footer.reg': 'Reg. No. 357/Jaipur/2004-05',
    'footer.rights': '© 2025 Utkarsh Samajik Seva Sansthan. All rights reserved.',
    // Toast messages
    'toast.success': 'Success!',
    'toast.error': 'Error',
    'toast.loading': 'Please wait...',
    'toast.join.success': 'Thank you! We will contact you shortly.',
    'toast.contact.success': 'Your message has been sent. We will reply soon!',

    // ─── Sur-Sukoon Portal ───
    // Navbar
    'ss.nav.home': 'Home',
    'ss.nav.about': 'About',
    'ss.nav.gallery': 'Gallery',
    'ss.nav.register': 'Register Now',
    'ss.nav.utkarsh': '← Utkarsh NGO',
    // Hero
    'ss.presents': '✦ UTKARSH PRESENTS ✦',
    'ss.tagline': 'Ek Manch... Aapki Awaaz ke Naam',
    'ss.hero.date': 'DATE',
    'ss.hero.time': 'TIME',
    'ss.hero.venue': 'VENUE',
    'ss.hero.seats': 'PERFORMER SEATS',
    'ss.performer': 'Performer',
    'ss.audience': 'Audience',
    'ss.free': 'Free Entry',
    'ss.register.performer': '↗ Register as Performer',
    'ss.register.audience': '🎟 Free Audience Entry',
    'ss.btn.unmute': 'Unmute',
    'ss.btn.mute': 'Mute',
    // Sections
    'ss.section.highlights': 'Highlights',
    'ss.section.highlights.label': 'Watch & Relive',
    'ss.section.upcoming': 'Upcoming Events',
    'ss.section.upcoming.label': "What's Coming",
    'ss.section.spirit': 'Sur-Sukoon Spirit',
    'ss.sing': 'Sing',
    'ss.share': 'Share',
    'ss.inspire': 'Inspire',
    'ss.sing.desc': 'Every voice deserves a stage. Sur-Sukoon gives you that platform — professional, respectful, and celebratory.',
    'ss.share.desc': 'Share your music with an audience that truly listens. Create memories that last a lifetime with Sur-Sukoon.',
    'ss.inspire.desc': 'Your performance can inspire the next generation of singers. Be the reason someone falls in love with music.',
    // Footer
    'ss.footer.links': 'Quick Links',
    'ss.footer.contact': 'Contact',
    'ss.footer.desc': 'A cultural celebration of music and voice, presented by Utkarsh Samajik Seva Sansthan.',
    'ss.footer.home': 'Home',
    'ss.footer.register': 'Register',
    'ss.footer.gallery': 'Gallery',
    'ss.footer.about': 'About Sur-Sukoon',
    'ss.footer.utkarsh': 'Utkarsh NGO Portal',
    'ss.footer.copy': '© 2025 Sur-Sukoon by Utkarsh Samajik Seva Sansthan. All rights reserved.',
    // Gallery
    'ss.gallery.photos': 'PHOTOS',
    'ss.gallery.videos': 'VIDEOS',
    'ss.gallery.photo.heading': 'Photo Gallery',
    'ss.gallery.video.heading': 'Video Gallery',
    'ss.gallery.subtitle': 'Relive the magical moments from past Sur-Sukoon events.',
    'ss.gallery.empty.photos': 'No photos yet. Check back soon!',
    'ss.gallery.empty.videos': 'No videos yet. Check back soon!',
    // About page
    'ss.about.hero.label': '🌟 Our Story',
    'ss.about.hero.title': 'About Sur-Sukoon',
    'ss.about.hero.sub': 'Where every voice finds its moment. A celebration of music, culture, and community.',
    'ss.about.identity.label': 'Our Identity',
    'ss.about.identity.title': 'What is Sur-Sukoon?',
    'ss.about.stage.title': 'Your Stage Awaits',
    'ss.about.stage.sub': 'Register now to perform at Sur-Sukoon Season 5 or come watch as an audience member — absolutely free!',
    'ss.about.stage.cta.performer': 'Register as Performer',
    'ss.about.stage.cta.audience': 'Free Audience Entry',
    // Registration
    'ss.reg.hero.label': '📝 Registration',
    'ss.reg.heading': 'Join Sur-Sukoon',
    'ss.reg.subtitle': "Choose your role and fill the form below. We'll confirm on WhatsApp!",
    'ss.reg.tab.performer': '🎤 Performer',
    'ss.reg.tab.audience': '👥 Audience',
    'ss.reg.name': 'Full Name',
    'ss.reg.phone': 'Phone Number',
    'ss.reg.email': 'Email Address',
    'ss.reg.city': 'City',
    'ss.reg.event': 'Select Event',
    'ss.reg.song': 'Song Name or Genre',
    'ss.reg.duration': 'Performance Duration',
    'ss.reg.requirements': 'Special Requirements (optional)',
    'ss.reg.payment': '💳 Payment Details',
    'ss.reg.screenshot': 'Upload Payment Screenshot',
    'ss.reg.submit.performer': 'Register as Performer 🎤',
    'ss.reg.submit.audience': 'Register as Audience 👥',
    // Registration placeholders
    'ss.reg.name.ph': 'Enter your full name',
    'ss.reg.phone.ph': 'Enter your phone number',
    'ss.reg.email.ph': 'Enter your email (optional)',
    'ss.reg.city.ph': 'Your city',
    'ss.reg.song.ph': 'e.g. Bollywood Classic, Ghazal...',
    'ss.reg.requirements.ph': 'Any special needs or notes...',
  },
  hi: {
    // Navbar
    'nav.home': 'मुख्य पृष्ठ',
    'nav.about': 'हमारे बारे में',
    'nav.programmes': 'कार्यक्रम',
    'nav.media': 'मीडिया',
    'nav.contact': 'संपर्क',
    'nav.sursukoon': '🎵 सुर-सुकून',
    // Hero
    'hero.label': 'स्थापना 26 जनवरी 2005 • जयपुर, राजस्थान',
    'hero.title': 'उत्कर्ष सामाजिक सेवा संस्थान',
    'hero.tagline': '"जनता का, जनता के लिए, जनता द्वारा एक NGO"',
    'hero.hindi': '"दृढ़ संकल्प, निस्वार्थ सेवा, जनकल्याण"',
    'hero.btn.explore': 'कार्यक्रम देखें',
    'hero.btn.volunteer': 'स्वयंसेवक बनें',
    'hero.btn.sursukoon': '← सुर-सुकून देखें 🎵',
    'banner.visit.sursukoon': 'सुर-सुकून देखें →',
    // Impact
    'impact.cities': 'शहरों तक पहुँच',
    'impact.founded': 'स्थापना वर्ष',
    'impact.volunteers': 'स्वयंसेवक',
    'impact.programmes': 'कार्यक्रम',
    // Sections
    'section.programmes': 'हमारे कार्यक्रम',
    'section.programmes.heading': 'राजस्थान भर में बदलाव ला रहे हैं',
    'section.programmes.sub': 'राजस्थान के समुदायों में स्थायी बदलाव लाने वाली पहलें',
    'section.upcoming': 'आगामी कार्यक्रम',
    'section.upcoming.label': 'सभी के लिए खुला',
    'section.upcoming.sub': 'सभी के लिए खुला — अपने नजदीक के किसी भी कार्यक्रम में शामिल हों',
    'section.news': 'मीडिया कवरेज',
    'section.news.sub': 'उत्कर्ष समाचार में',
    // About page
    'about.hero.label': 'हमारे बारे में',
    'about.hero.title': 'जानिए हम कौन हैं',
    'about.hero.sub': '2005 से सामाजिक कल्याण, सामुदायिक विकास और जन सशक्तिकरण के लिए प्रतिबद्ध एक पंजीकृत NGO।',
    'about.profile': 'संस्था परिचय',
    'about.mission': 'हमारा मिशन',
    'about.mandate': 'मुख्य कार्यक्षेत्र',
    'about.team': 'दल की शक्ति',
    'about.leadership': 'नेतृत्व',
    'about.operations': 'कार्यक्षेत्र',
    // Programmes page
    'prog.hero.label': 'हम क्या करते हैं',
    'prog.hero.title': 'हमारे कार्यक्रम',
    'prog.hero.sub': 'राजस्थान और उससे आगे सार्थक प्रभाव डालने वाली 8 मुख्य पहलें।',
    // Media page
    'media.hero.label': 'गैलरी और समाचार',
    'media.hero.title': 'मीडिया केंद्र',
    'media.hero.sub': 'हमारे कार्यक्रमों और अभियानों की तस्वीरें, वीडियो और मीडिया कवरेज।',
    // Contact page
    'contact.hero.label': 'संपर्क करें',
    'contact.hero.title': 'हमसे संपर्क करें',
    'contact.hero.sub': 'हम आपसे सुनना चाहते हैं। हमारे जयपुर या दिल्ली कार्यालय में संपर्क करें।',
    // Buttons
    'btn.joinus': 'जुड़ें',
    'btn.learnmore': 'अधिक जानें',
    'btn.register': 'अभी पंजीकरण करें',
    'btn.submit': 'जमा करें',
    'btn.cancel': 'रद्द करें',
    'btn.download': 'CSV डाउनलोड',
    // Forms
    'form.name': 'पूरा नाम',
    'form.phone': 'फ़ोन नंबर',
    'form.email': 'ईमेल पता',
    'form.message': 'संदेश',
    'form.required': 'आवश्यक',
    'form.name.placeholder': 'अपना पूरा नाम दर्ज करें',
    'form.phone.placeholder': 'अपना फ़ोन नंबर दर्ज करें',
    'form.email.placeholder': 'अपना ईमेल पता दर्ज करें',
    'form.message.placeholder': 'अपना संदेश यहाँ लिखें...',
    // Contact
    'contact.jaipur': 'जयपुर कार्यालय (मुख्य)',
    'contact.delhi': 'दिल्ली कार्यालय',
    'contact.phone': 'फ़ोन',
    'contact.address': 'पता',
    'contact.query': 'प्रश्न का प्रकार',
    'contact.query.ngo': 'NGO संबंधित',
    'contact.query.ss': 'सुर-सुकून संबंधित',
    'contact.query.vol': 'स्वयंसेवा',
    // Footer
    'footer.quicklinks': 'त्वरित लिंक',
    'footer.programmes': 'कार्यक्रम',
    'footer.contact': 'संपर्क',
    'footer.home': 'मुख्य पृष्ठ',
    'footer.aboutus': 'हमारे बारे में',
    'footer.media': 'मीडिया और गैलरी',
    'footer.contactus': 'संपर्क करें',
    'footer.sursukoon': 'सुर-सुकून वेबसाइट',
    'footer.reg': 'पंजीकरण संख्या 357/जयपुर/2004-05',
    'footer.rights': '© 2025 उत्कर्ष सामाजिक सेवा संस्थान। सर्वाधिकार सुरक्षित।',
    // Toast messages
    'toast.success': 'सफल!',
    'toast.error': 'त्रुटि',
    'toast.loading': 'कृपया प्रतीक्षा करें...',
    'toast.join.success': 'धन्यवाद! हम शीघ्र आपसे संपर्क करेंगे।',
    'toast.contact.success': 'आपका संदेश भेजा गया। हम जल्द जवाब देंगे!',

    // ─── Sur-Sukoon Portal ───
    // Navbar
    'ss.nav.home': 'मुख्य पृष्ठ',
    'ss.nav.about': 'हमारे बारे में',
    'ss.nav.gallery': 'गैलरी',
    'ss.nav.register': 'अभी पंजीकरण करें',
    'ss.nav.utkarsh': '← उत्कर्ष NGO',
    // Hero
    'ss.presents': '✦ उत्कर्ष प्रस्तुत करता है ✦',
    'ss.tagline': 'एक मंच... आपकी आवाज़ के नाम',
    'ss.hero.date': 'तारीख',
    'ss.hero.time': 'समय',
    'ss.hero.venue': 'स्थान',
    'ss.hero.seats': 'प्रस्तुतकर्ता सीटें',
    'ss.performer': 'प्रस्तुतकर्ता',
    'ss.audience': 'दर्शक',
    'ss.free': 'मुफ़्त प्रवेश',
    'ss.register.performer': '↗ प्रस्तुतकर्ता के रूप में पंजीकरण',
    'ss.register.audience': '🎟 मुफ़्त दर्शक प्रवेश',
    'ss.btn.unmute': 'अनम्यूट करें',
    'ss.btn.mute': 'म्यूट करें',
    // Sections
    'ss.section.highlights': 'हाइलाइट्स',
    'ss.section.highlights.label': 'देखें और फिर जीएं',
    'ss.section.upcoming': 'आगामी कार्यक्रम',
    'ss.section.upcoming.label': 'आने वाला है',
    'ss.section.spirit': 'सुर-सुकून भावना',
    'ss.sing': 'गाएं',
    'ss.share': 'साझा करें',
    'ss.inspire': 'प्रेरित करें',
    'ss.sing.desc': 'हर आवाज़ को एक मंच मिलना चाहिए। सुर-सुकून आपको वह मंच देता है — पेशेवर, सम्मानजनक और उत्सवपूर्ण।',
    'ss.share.desc': 'अपना संगीत उन दर्शकों के साथ साझा करें जो सच में सुनते हैं। सुर-सुकून के साथ जीवनभर की यादें बनाएं।',
    'ss.inspire.desc': 'आपका प्रदर्शन गायकों की अगली पीढ़ी को प्रेरित कर सकता है। वह कारण बनें जिससे कोई संगीत से प्यार करे।',
    // Footer
    'ss.footer.links': 'त्वरित लिंक',
    'ss.footer.contact': 'संपर्क',
    'ss.footer.desc': 'उत्कर्ष सामाजिक सेवा संस्थान द्वारा प्रस्तुत संगीत और आवाज़ का सांस्कृतिक उत्सव।',
    'ss.footer.home': 'मुख्य पृष्ठ',
    'ss.footer.register': 'पंजीकरण',
    'ss.footer.gallery': 'गैलरी',
    'ss.footer.about': 'सुर-सुकून के बारे में',
    'ss.footer.utkarsh': 'उत्कर्ष NGO पोर्टल',
    'ss.footer.copy': '© 2025 सुर-सुकून — उत्कर्ष सामाजिक सेवा संस्थान। सर्वाधिकार सुरक्षित।',
    // Gallery
    'ss.gallery.photos': 'फ़ोटो',
    'ss.gallery.videos': 'वीडियो',
    'ss.gallery.photo.heading': 'फ़ोटो गैलरी',
    'ss.gallery.video.heading': 'वीडियो गैलरी',
    'ss.gallery.subtitle': 'पिछले सुर-सुकून कार्यक्रमों के जादुई पलों को फिर से जीएं।',
    'ss.gallery.empty.photos': 'अभी कोई फ़ोटो नहीं। जल्द देखें!',
    'ss.gallery.empty.videos': 'अभी कोई वीडियो नहीं। जल्द देखें!',
    // About page
    'ss.about.hero.label': '🌟 हमारी कहानी',
    'ss.about.hero.title': 'सुर-सुकून के बारे में',
    'ss.about.hero.sub': 'जहां हर आवाज़ को अपना पल मिलता है। संगीत, संस्कृति और समुदाय का उत्सव।',
    'ss.about.identity.label': 'हमारी पहचान',
    'ss.about.identity.title': 'सुर-सुकून क्या है?',
    'ss.about.stage.title': 'आपका मंच आपका इंतज़ार कर रहा है',
    'ss.about.stage.sub': 'सुर-सुकून सीज़न 5 में प्रस्तुति देने के लिए अभी पंजीकरण करें या दर्शक के रूप में आएं — बिल्कुल मुफ़्त!',
    'ss.about.stage.cta.performer': 'प्रस्तुतकर्ता के रूप में पंजीकरण करें',
    'ss.about.stage.cta.audience': 'मुफ़्त दर्शक प्रवेश',
    // Registration
    'ss.reg.hero.label': '📝 पंजीकरण',
    'ss.reg.heading': 'सुर-सुकून में शामिल हों',
    'ss.reg.subtitle': 'अपनी भूमिका चुनें और नीचे फॉर्म भरें। हम WhatsApp पर पुष्टि करेंगे!',
    'ss.reg.tab.performer': '🎤 प्रस्तुतकर्ता',
    'ss.reg.tab.audience': '👥 दर्शक',
    'ss.reg.name': 'पूरा नाम',
    'ss.reg.phone': 'फ़ोन नंबर',
    'ss.reg.email': 'ईमेल पता',
    'ss.reg.city': 'शहर',
    'ss.reg.event': 'कार्यक्रम चुनें',
    'ss.reg.song': 'गाने का नाम या शैली',
    'ss.reg.duration': 'प्रदर्शन अवधि',
    'ss.reg.requirements': 'विशेष आवश्यकताएं (वैकल्पिक)',
    'ss.reg.payment': '💳 भुगतान विवरण',
    'ss.reg.screenshot': 'भुगतान स्क्रीनशॉट अपलोड करें',
    'ss.reg.submit.performer': 'प्रस्तुतकर्ता के रूप में पंजीकरण 🎤',
    'ss.reg.submit.audience': 'दर्शक के रूप में पंजीकरण 👥',
    // Registration placeholders
    'ss.reg.name.ph': 'अपना पूरा नाम दर्ज करें',
    'ss.reg.phone.ph': 'अपना फ़ोन नंबर दर्ज करें',
    'ss.reg.email.ph': 'ईमेल दर्ज करें (वैकल्पिक)',
    'ss.reg.city.ph': 'आपका शहर',
    'ss.reg.song.ph': 'जैसे बॉलीवुड क्लासिक, ग़ज़ल...',
    'ss.reg.requirements.ph': 'कोई विशेष आवश्यकता या टिप्पणी...',
  }
};

// Get translation
function t(key) {
  const lang = localStorage.getItem('utkarsh_lang') || 'en';
  return translations[lang][key] || translations.en[key] || key;
}

// Apply translations to page
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) {
      el.setAttribute(attr, t(key));
    } else {
      el.textContent = t(key);
    }
  });
  // Handle placeholder translations
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}

// Initialize language system
function initLang() {
  const currentLang = localStorage.getItem('utkarsh_lang') || 'en';
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      localStorage.setItem('utkarsh_lang', lang);
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
      applyTranslations();
    });
  });
  applyTranslations();
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initLang();
});
