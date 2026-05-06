export interface TemplateData {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  canvasWidth: number;
  canvasHeight: number;
  objects: any[];
  background: string;
}

export const templates: TemplateData[] = [
  // Visiting Card Templates
  {
    id: 'vc-1',
    name: 'Modern Dark',
    category: 'visiting-card',
    thumbnail: '',
    canvasWidth: 1050,
    canvasHeight: 600,
    background: '#1a1a2e',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 1050, height: 600, fill: '#1a1a2e', selectable: false, evented: false },
      { type: 'Rect', left: 0, top: 0, width: 8, height: 600, fill: '#e94560' },
      { type: 'Textbox', left: 50, top: 80, text: 'JOHN DOE', fontSize: 48, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#ffffff', width: 500 },
      { type: 'Textbox', left: 50, top: 140, text: 'Creative Director', fontSize: 24, fontFamily: 'Inter', fill: '#e94560', width: 500 },
      { type: 'Rect', left: 50, top: 190, width: 60, height: 3, fill: '#e94560' },
      { type: 'Textbox', left: 50, top: 230, text: '+1 (555) 123-4567', fontSize: 18, fontFamily: 'Inter', fill: '#a0a0b0', width: 400 },
      { type: 'Textbox', left: 50, top: 265, text: 'john@company.com', fontSize: 18, fontFamily: 'Inter', fill: '#a0a0b0', width: 400 },
      { type: 'Textbox', left: 50, top: 300, text: 'www.company.com', fontSize: 18, fontFamily: 'Inter', fill: '#a0a0b0', width: 400 },
      { type: 'Textbox', left: 700, top: 400, text: 'COMPANY', fontSize: 36, fontFamily: 'Bebas Neue', fill: '#ffffff', width: 300, textAlign: 'right' },
      { type: 'Textbox', left: 700, top: 445, text: 'STUDIOS', fontSize: 36, fontFamily: 'Bebas Neue', fill: '#e94560', width: 300, textAlign: 'right' },
    ]
  },
  {
    id: 'vc-2',
    name: 'Clean Minimal',
    category: 'visiting-card',
    thumbnail: '',
    canvasWidth: 1050,
    canvasHeight: 600,
    background: '#ffffff',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 1050, height: 600, fill: '#ffffff', selectable: false, evented: false },
      { type: 'Rect', left: 0, top: 560, width: 1050, height: 40, fill: '#2563eb' },
      { type: 'Textbox', left: 60, top: 60, text: 'Jane Smith', fontSize: 44, fontFamily: 'Playfair Display', fontWeight: 'bold', fill: '#1e293b', width: 500 },
      { type: 'Textbox', left: 60, top: 120, text: 'UX Designer', fontSize: 22, fontFamily: 'Inter', fill: '#2563eb', width: 500 },
      { type: 'Rect', left: 60, top: 165, width: 40, height: 4, fill: '#2563eb' },
      { type: 'Textbox', left: 60, top: 200, text: '📧  jane@design.co', fontSize: 16, fontFamily: 'Inter', fill: '#64748b', width: 400 },
      { type: 'Textbox', left: 60, top: 235, text: '📱  +1 (555) 987-6543', fontSize: 16, fontFamily: 'Inter', fill: '#64748b', width: 400 },
      { type: 'Textbox', left: 60, top: 270, text: '🌐  www.janesmith.design', fontSize: 16, fontFamily: 'Inter', fill: '#64748b', width: 400 },
      { type: 'Circle', left: 820, top: 120, radius: 80, fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 2 },
      { type: 'Textbox', left: 850, top: 170, text: 'JS', fontSize: 40, fontFamily: 'Playfair Display', fontWeight: 'bold', fill: '#2563eb', width: 100, textAlign: 'center' },
    ]
  },
  {
    id: 'vc-3',
    name: 'Bold Gradient',
    category: 'visiting-card',
    thumbnail: '',
    canvasWidth: 1050,
    canvasHeight: 600,
    background: '#0f0c29',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 1050, height: 600, fill: '#0f0c29', selectable: false, evented: false },
      { type: 'Rect', left: 0, top: 0, width: 400, height: 600, fill: '#7c3aed' },
      { type: 'Textbox', left: 40, top: 180, text: 'ALEX\nJOHNSON', fontSize: 52, fontFamily: 'Bebas Neue', fill: '#ffffff', width: 320, lineHeight: 1 },
      { type: 'Rect', left: 40, top: 310, width: 50, height: 4, fill: '#fbbf24' },
      { type: 'Textbox', left: 40, top: 340, text: 'Marketing Lead', fontSize: 20, fontFamily: 'Inter', fill: '#e0d5ff', width: 300 },
      { type: 'Textbox', left: 450, top: 180, text: 'CONTACT', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#7c3aed', letterSpacing: 300, width: 300 },
      { type: 'Rect', left: 450, top: 210, width: 40, height: 2, fill: '#7c3aed' },
      { type: 'Textbox', left: 450, top: 240, text: '+1 (555) 234-5678\nalex@marketing.io\nwww.alexjohnson.com\n123 Business Ave, NY', fontSize: 16, fontFamily: 'Inter', fill: '#a0a0c0', width: 400, lineHeight: 1.8 },
    ]
  },
  {
    id: 'vc-4',
    name: 'Elegant Gold',
    category: 'visiting-card',
    thumbnail: '',
    canvasWidth: 1050,
    canvasHeight: 600,
    background: '#0d1117',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 1050, height: 600, fill: '#0d1117', selectable: false, evented: false },
      { type: 'Rect', left: 20, top: 20, width: 1010, height: 560, fill: 'transparent', stroke: '#d4a853', strokeWidth: 1 },
      { type: 'Textbox', left: 100, top: 150, text: 'VICTORIA', fontSize: 54, fontFamily: 'Playfair Display', fill: '#d4a853', width: 500 },
      { type: 'Textbox', left: 100, top: 215, text: 'WELLINGTON', fontSize: 54, fontFamily: 'Playfair Display', fill: '#ffffff', width: 500 },
      { type: 'Rect', left: 100, top: 290, width: 100, height: 2, fill: '#d4a853' },
      { type: 'Textbox', left: 100, top: 320, text: 'Interior Designer', fontSize: 20, fontFamily: 'Inter', fill: '#888', width: 300 },
      { type: 'Textbox', left: 600, top: 320, text: '+1 555 999 0000\nvictoria@design.com\nNew York, NY', fontSize: 15, fontFamily: 'Inter', fill: '#888', width: 400, textAlign: 'right', lineHeight: 1.8 },
    ]
  },
  // Letterhead Templates
  {
    id: 'lh-1',
    name: 'Corporate Blue',
    category: 'letterhead',
    thumbnail: '',
    canvasWidth: 2480,
    canvasHeight: 3508,
    background: '#ffffff',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 2480, height: 3508, fill: '#ffffff', selectable: false, evented: false },
      { type: 'Rect', left: 0, top: 0, width: 2480, height: 200, fill: '#1e40af' },
      { type: 'Textbox', left: 120, top: 50, text: 'COMPANY NAME', fontSize: 64, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#ffffff', width: 1000 },
      { type: 'Textbox', left: 120, top: 120, text: 'Your Tagline Goes Here', fontSize: 28, fontFamily: 'Inter', fill: '#93c5fd', width: 600 },
      { type: 'Textbox', left: 1400, top: 60, text: '123 Business Street\nCity, State 12345\nPhone: (555) 123-4567\nwww.company.com', fontSize: 22, fontFamily: 'Inter', fill: '#dbeafe', width: 1000, textAlign: 'right', lineHeight: 1.6 },
      { type: 'Rect', left: 120, top: 350, width: 2240, height: 2, fill: '#dbeafe' },
      { type: 'Textbox', left: 120, top: 450, text: 'Dear Sir/Madam,\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', fontSize: 28, fontFamily: 'Inter', fill: '#1e293b', width: 2240, lineHeight: 1.8 },
      { type: 'Rect', left: 0, top: 3400, width: 2480, height: 108, fill: '#1e40af' },
      { type: 'Textbox', left: 120, top: 3420, text: 'Confidential - Company Name © 2024', fontSize: 22, fontFamily: 'Inter', fill: '#93c5fd', width: 2240, textAlign: 'center' },
    ]
  },
  {
    id: 'lh-2',
    name: 'Modern Minimal',
    category: 'letterhead',
    thumbnail: '',
    canvasWidth: 2480,
    canvasHeight: 3508,
    background: '#ffffff',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 2480, height: 3508, fill: '#ffffff', selectable: false, evented: false },
      { type: 'Rect', left: 0, top: 0, width: 12, height: 3508, fill: '#10b981' },
      { type: 'Textbox', left: 120, top: 100, text: 'STUDIO', fontSize: 72, fontFamily: 'Bebas Neue', fill: '#1e293b', width: 500 },
      { type: 'Rect', left: 120, top: 185, width: 60, height: 5, fill: '#10b981' },
      { type: 'Textbox', left: 1400, top: 100, text: 'info@studio.com\n+1 (555) 000-0000\nwww.studio.com', fontSize: 22, fontFamily: 'Inter', fill: '#64748b', width: 1000, textAlign: 'right', lineHeight: 1.6 },
    ]
  },
  // Brochure Templates
  {
    id: 'br-1',
    name: 'Tech Startup',
    category: 'brochure',
    thumbnail: '',
    canvasWidth: 2480,
    canvasHeight: 3508,
    background: '#0f172a',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 2480, height: 3508, fill: '#0f172a', selectable: false, evented: false },
      { type: 'Rect', left: 0, top: 0, width: 2480, height: 1200, fill: '#1e293b' },
      { type: 'Textbox', left: 200, top: 300, text: 'INNOVATE\nTRANSFORM\nGROW', fontSize: 120, fontFamily: 'Bebas Neue', fill: '#ffffff', width: 2080, lineHeight: 1.1 },
      { type: 'Rect', left: 200, top: 720, width: 100, height: 6, fill: '#3b82f6' },
      { type: 'Textbox', left: 200, top: 780, text: 'Building the future of technology, one solution at a time.', fontSize: 36, fontFamily: 'Inter', fill: '#94a3b8', width: 1500 },
      { type: 'Textbox', left: 200, top: 1400, text: 'OUR SERVICES', fontSize: 48, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#3b82f6', width: 1000 },
      { type: 'Rect', left: 200, top: 1470, width: 60, height: 4, fill: '#3b82f6' },
      { type: 'Textbox', left: 200, top: 1550, text: '✦  Web Development\n✦  Mobile Applications\n✦  Cloud Solutions\n✦  AI & Machine Learning\n✦  Cybersecurity', fontSize: 32, fontFamily: 'Inter', fill: '#e2e8f0', width: 1000, lineHeight: 2 },
    ]
  },
  // Sign Board Templates
  {
    id: 'sb-1',
    name: 'Restaurant Sign',
    category: 'sign-board',
    thumbnail: '',
    canvasWidth: 3600,
    canvasHeight: 2400,
    background: '#1a1a1a',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 3600, height: 2400, fill: '#1a1a1a', selectable: false, evented: false },
      { type: 'Rect', left: 40, top: 40, width: 3520, height: 2320, fill: 'transparent', stroke: '#d4a853', strokeWidth: 3 },
      { type: 'Textbox', left: 200, top: 300, text: 'THE GOLDEN', fontSize: 180, fontFamily: 'Playfair Display', fontWeight: 'bold', fill: '#d4a853', width: 3200, textAlign: 'center' },
      { type: 'Textbox', left: 200, top: 520, text: '— KITCHEN —', fontSize: 120, fontFamily: 'Playfair Display', fill: '#ffffff', width: 3200, textAlign: 'center' },
      { type: 'Rect', left: 1400, top: 700, width: 800, height: 3, fill: '#d4a853' },
      { type: 'Textbox', left: 200, top: 780, text: 'FINE DINING & COCKTAILS', fontSize: 48, fontFamily: 'Montserrat', fill: '#d4a853', width: 3200, textAlign: 'center' },
      { type: 'Textbox', left: 200, top: 1000, text: 'OPEN DAILY\n11:00 AM — 11:00 PM', fontSize: 60, fontFamily: 'Inter', fill: '#999', width: 3200, textAlign: 'center', lineHeight: 1.5 },
      { type: 'Textbox', left: 200, top: 1600, text: '📍 123 Main Street, Downtown', fontSize: 40, fontFamily: 'Inter', fill: '#777', width: 3200, textAlign: 'center' },
      { type: 'Textbox', left: 200, top: 1700, text: '📞 (555) 123-4567', fontSize: 40, fontFamily: 'Inter', fill: '#777', width: 3200, textAlign: 'center' },
    ]
  },
  {
    id: 'sb-2',
    name: 'Open/Closed Sign',
    category: 'sign-board',
    thumbnail: '',
    canvasWidth: 3600,
    canvasHeight: 2400,
    background: '#dc2626',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 3600, height: 2400, fill: '#dc2626', selectable: false, evented: false },
      { type: 'Rect', left: 60, top: 60, width: 3480, height: 2280, fill: 'transparent', stroke: '#ffffff', strokeWidth: 6 },
      { type: 'Textbox', left: 200, top: 500, text: 'OPEN', fontSize: 400, fontFamily: 'Bebas Neue', fill: '#ffffff', width: 3200, textAlign: 'center' },
      { type: 'Textbox', left: 200, top: 1000, text: 'COME ON IN!', fontSize: 100, fontFamily: 'Inter', fontWeight: 'bold', fill: '#fecaca', width: 3200, textAlign: 'center' },
      { type: 'Textbox', left: 200, top: 1400, text: 'MON-SAT: 9AM - 9PM\nSUN: 10AM - 6PM', fontSize: 60, fontFamily: 'Inter', fill: '#ffffff', width: 3200, textAlign: 'center', lineHeight: 1.5 },
    ]
  },
  // Poster Templates
  {
    id: 'po-1',
    name: 'Event Poster',
    category: 'poster',
    thumbnail: '',
    canvasWidth: 2400,
    canvasHeight: 3600,
    background: '#0a0a0a',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 2400, height: 3600, fill: '#0a0a0a', selectable: false, evented: false },
      { type: 'Textbox', left: 150, top: 200, text: 'MUSIC\nFESTIVAL', fontSize: 200, fontFamily: 'Bebas Neue', fill: '#ffffff', width: 2100, lineHeight: 0.95 },
      { type: 'Textbox', left: 150, top: 650, text: '2024', fontSize: 300, fontFamily: 'Bebas Neue', fill: '#ef4444', width: 2100 },
      { type: 'Rect', left: 150, top: 980, width: 2100, height: 4, fill: '#ef4444' },
      { type: 'Textbox', left: 150, top: 1050, text: 'FEATURING', fontSize: 36, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#ef4444', width: 2100 },
      { type: 'Textbox', left: 150, top: 1120, text: 'Artist Name  ·  Band Name  ·  DJ Name\nSpecial Guest  ·  Live Orchestra', fontSize: 48, fontFamily: 'Inter', fill: '#d4d4d8', width: 2100, lineHeight: 1.6 },
      { type: 'Rect', left: 150, top: 1350, width: 2100, height: 4, fill: '#333' },
      { type: 'Textbox', left: 150, top: 1420, text: 'DECEMBER 15-17  ·  CENTRAL PARK', fontSize: 42, fontFamily: 'Inter', fontWeight: 'bold', fill: '#ffffff', width: 2100 },
      { type: 'Textbox', left: 150, top: 1500, text: 'TICKETS: www.musicfest.com', fontSize: 32, fontFamily: 'Inter', fill: '#888', width: 2100 },
    ]
  },
  // Social Media Templates
  {
    id: 'sm-1',
    name: 'Instagram Post',
    category: 'social-media',
    thumbnail: '',
    canvasWidth: 1080,
    canvasHeight: 1080,
    background: '#4f46e5',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 1080, height: 1080, fill: '#4f46e5', selectable: false, evented: false },
      { type: 'Rect', left: 60, top: 60, width: 960, height: 960, fill: 'transparent', stroke: '#ffffff', strokeWidth: 2 },
      { type: 'Textbox', left: 120, top: 250, text: 'BIG\nSALE', fontSize: 160, fontFamily: 'Bebas Neue', fill: '#ffffff', width: 840, textAlign: 'center', lineHeight: 0.95 },
      { type: 'Textbox', left: 120, top: 600, text: 'UP TO', fontSize: 36, fontFamily: 'Inter', fill: '#c7d2fe', width: 840, textAlign: 'center' },
      { type: 'Textbox', left: 120, top: 650, text: '70% OFF', fontSize: 120, fontFamily: 'Bebas Neue', fill: '#fbbf24', width: 840, textAlign: 'center' },
      { type: 'Textbox', left: 120, top: 820, text: 'Shop Now → www.store.com', fontSize: 28, fontFamily: 'Inter', fill: '#e0e7ff', width: 840, textAlign: 'center' },
    ]
  },
  // Flyer Templates
  {
    id: 'fl-1',
    name: 'Fitness Flyer',
    category: 'flyer',
    thumbnail: '',
    canvasWidth: 1275,
    canvasHeight: 1875,
    background: '#000000',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 1275, height: 1875, fill: '#000000', selectable: false, evented: false },
      { type: 'Rect', left: 0, top: 0, width: 1275, height: 600, fill: '#dc2626' },
      { type: 'Textbox', left: 80, top: 100, text: 'GET FIT\nTODAY', fontSize: 120, fontFamily: 'Bebas Neue', fill: '#ffffff', width: 1100, lineHeight: 0.95 },
      { type: 'Textbox', left: 80, top: 380, text: 'Join our exclusive fitness program', fontSize: 28, fontFamily: 'Inter', fill: '#fecaca', width: 1100 },
      { type: 'Textbox', left: 80, top: 700, text: 'WHAT WE OFFER', fontSize: 36, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#dc2626', width: 1100 },
      { type: 'Textbox', left: 80, top: 780, text: '💪 Personal Training\n🏋️ Group Classes\n🧘 Yoga & Meditation\n🥗 Nutrition Plans', fontSize: 28, fontFamily: 'Inter', fill: '#e5e5e5', width: 1100, lineHeight: 2 },
      { type: 'Rect', left: 80, top: 1200, width: 1100, height: 200, fill: '#dc2626', rx: 10, ry: 10 },
      { type: 'Textbox', left: 100, top: 1240, text: 'FIRST MONTH FREE!', fontSize: 52, fontFamily: 'Bebas Neue', fill: '#ffffff', width: 1060, textAlign: 'center' },
      { type: 'Textbox', left: 100, top: 1310, text: 'Limited time offer. Sign up now!', fontSize: 24, fontFamily: 'Inter', fill: '#fecaca', width: 1060, textAlign: 'center' },
      { type: 'Textbox', left: 80, top: 1500, text: '📞 (555) GYM-FIT  |  www.getfit.com', fontSize: 24, fontFamily: 'Inter', fill: '#888', width: 1100, textAlign: 'center' },
    ]
  },
];

export const getTemplatesByCategory = (category: string): TemplateData[] => {
  return templates.filter(t => t.category === category);
};
