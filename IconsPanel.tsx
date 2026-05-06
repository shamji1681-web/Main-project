import React, { useState, useCallback } from 'react';
import { loadSVGFromString, util, IText, Group, FabricObject, type FabricObjectProps } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuid } from 'uuid';

const emojiIcons = [
  '⭐','❤️','🔥','✅','❌','⚡','💎','🎯','🏆','🎨',
  '📱','💻','🖥️','⌨️','🖨️','📷','🎬','🎵','🎤','🎧',
  '📞','📧','🌐','🔗','📍','🏠','🏢','🏪','🏭','🏗️',
  '🚗','✈️','🚀','⛵','🚆','🚲','🛵','🏍️','🚌','🚕',
  '🍕','🍔','☕','🍷','🍰','🍣','🥗','🍝','🌮','🍩',
  '👤','👥','💼','📊','📈','📉','💰','💳','🏧','💵',
  '🔔','🔕','📢','📣','🔊','🔇','🎙️','📻','📺','🎮',
  '✏️','📝','📋','📌','📎','✂️','📐','📏','🗂️','📁',
  '🔒','🔓','🔑','🛡️','⚙️','🔧','🔨','🪛','🔩','🧰',
  '❗','❓','💡','🔍','👁️','👆','👇','👈','👉','✋',
  '🌟','💫','✨','🌙','☀️','🌈','🌊','🌺','🌸','🍀',
  '📆','⏰','⏱️','🕐','📅','🗓️','⌛','⏳','🔄','♻️',
];

interface SvgIconDef {
  name: string;
  svg: string;
}

const SVG_ICONS: SvgIconDef[] = [
  // Contact & Communication
  { name: 'phone', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' },
  { name: 'mobile', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>' },
  { name: 'whatsapp', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>' },
  { name: 'email', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' },
  { name: 'envelope', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 22,20 2,20 2,6"/></svg>' },
  { name: 'website', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' },
  { name: 'globe', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' },
  { name: 'fax', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 2 15 7 20 7"/><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 18h8"/><path d="M8 14h8"/><path d="M8 10h1"/></svg>' },
  { name: 'contact-book', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  
  // Maps & Location
  { name: 'location', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
  { name: 'map-marker', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
  { name: 'map-pin', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
  { name: 'navigation', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>' },
  { name: 'compass', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>' },
  
  // Buildings & Business
  { name: 'building', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/><line x1="12" y1="22" x2="12" y2="22"/></svg>' },
  { name: 'office', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3z"/><path d="M9 21V9m6 12V9"/></svg>' },
  { name: 'company', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
  { name: 'office-building', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { name: 'corporate', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
  { name: 'briefcase', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
  { name: 'workspace', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>' },
  { name: 'meeting-room', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>' },
  { name: 'desk', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18"/><path d="M5 12v7"/><path d="M19 12v7"/><path d="M2 5h20v4H2z"/></svg>' },
  
  // Money & Finance
  { name: 'rupee', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12"/><path d="M6 8h12"/><path d="M6 3a7.5 7.5 0 0 1 0 15h3l6 4"/></svg>' },
  { name: 'dollar', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { name: 'euro', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5a7.5 7.5 0 0 0-11.8 1.5M16 12H5m11 0c0 4-3 7.5-7 7.5a7.5 7.5 0 0 1-4.2-1.5"/></svg>' },
  { name: 'wallet', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>' },
  { name: 'credit-card', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
  { name: 'debit-card', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
  { name: 'invoice', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="18" x2="16" y2="18"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/></svg>' },
  { name: 'receipt', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>' },
  { name: 'payment', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
  { name: 'cash', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>' },
  
  // Documents & Office
  { name: 'file', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>' },
  { name: 'document', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>' },
  { name: 'folder', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' },
  { name: 'clipboard', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>' },
  { name: 'paperclip', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>' },
  { name: 'contract', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>' },
  { name: 'report', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="20" x2="9" y2="10"/></svg>' },
  
  // Tech & Devices
  { name: 'computer', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
  { name: 'laptop', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>' },
  { name: 'mobile-device', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>' },
  { name: 'cloud', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>' },
  { name: 'server', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6" y2="6"/><line x1="6" y1="18" x2="6" y2="18"/></svg>' },
  { name: 'database', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  { name: 'wifi', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>' },
  { name: 'settings', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },

  // Social Media
  { name: 'Facebook', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>' },
  { name: 'Instagram', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>' },
  { name: 'Twitter', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>' },
  { name: 'LinkedIn', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>' },
  { name: 'YouTube', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.11 1 12 1 12s0 3.89.42 5.58a2.78 2.78 0 0 0 1.94 2c1.71.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.89 23 12 23 12s0-3.89-.42-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>' },
  { name: 'Telegram', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' },
  { name: 'Snapchat', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c2 0 4.5 1.5 5 4.5 1 .5 2 1 2 2.5 0 2.5-1.5 3-1.5 4.5 0 1 1 1.5 1.5 2 0 .5-1 2.5-3 2.5-1.5 0-2-.5-3.5-.5S10 18 8.5 18s-1.5-2-1.5-2.5c.5-.5 1.5-1 1.5-2 0-1.5-1.5-2-1.5-4.5 0-1.5 1-2 2-2.5.5-3 3-4.5 5-4.5z"/></svg>' },
  { name: 'Pinterest', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 20l4-9"/><path d="M10.7 7.1c.3-1.1 1.1-1.6 2.3-1.6 1.8 0 2.5 1.5 2.5 3 0 2.4-.8 4.5-2.5 4.5-1 0-1.5-.6-1.5-1.5 0-.7.3-1.5.3-2.1"/></svg>' },
  { name: 'Reddit', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M17 11.5c0-1.4-1.1-2.5-2.5-2.5-.7 0-1.3.3-1.8.8-.9-.6-2.1-1-3.3-1l.6-2.6 1.8.4c0 .6.4 1 1 1 .6 0 1-.4 1-1s-.4-1-1-1c-.5 0-.8.3-.9.7l-2.1-.5c-.2 0-.3.1-.4.3l-.7 3.3c-1.3 0-2.5.4-3.5 1-.5-.5-1.1-.8-1.8-.8C2.1 9 1 10.1 1 11.5c0 .9.5 1.7 1.2 2.1-.1.3-.2.6-.2.9 0 2.5 4.5 4.5 10 4.5s10-2 10-4.5c0-.3-.1-.6-.2-.9.7-.4 1.2-1.2 1.2-2.1z"/></svg>' },
  { name: 'Messenger', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/><polyline points="7 14 11 10 13 14 17 10"/></svg>' },
  { name: 'Discord', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6a10.4 10.4 0 0 0-12 0L4 8v10l2 2 2-2 4 4 4-4 2 2 2-2V8l-2-2z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/></svg>' },
  { name: 'Skype', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M8 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M18.5 18.5a8.5 8.5 0 1 1-13 0 8.5 8.5 0 0 1 13 0z"/><path d="M15 13a3 3 0 1 0-6 0 3 3 0 0 0 6 0z"/></svg>' },
  { name: 'Zoom', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/><polygon points="22 8 16 12 22 16 22 8"/></svg>' },
  { name: 'TikTok', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>' },
  { name: 'Twitch', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-2 9h-2V6h2v5zm-5 0h-2V6h2v5z"/></svg>' },
  { name: 'Medium', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2 2 6.48 2 12z"/><path d="M7 12c0 2.76 1.12 5 2.5 5s2.5-2.24 2.5-5-1.12-5-2.5-5S7 9.24 7 12z"/><path d="M13.5 12c0 2.21.45 4 1 4s1-1.79 1-4-.45-4-1-4-1 1.79-1 4z"/><path d="M17.5 12c0 1.66.22 3 .5 3s.5-1.34.5-3-.22-3-.5-3-.5 1.34-.5 3z"/></svg>' },
  { name: 'Amazon', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18c4 2 14 2 18 0"/><path d="M18 15l3 3-3 3"/><path d="M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/></svg>' },
];

const IconsPanel: React.FC = () => {
  const { canvas, canvasSize, saveToHistory } = useEditorStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'svg' | 'emoji'>('svg');

  const addEmoji = useCallback((emoji: string) => {
    if (!canvas) return;
    const text = new IText(emoji, {
      left: canvasSize.width / 2,
      top: canvasSize.height / 2,
      fontSize: 80,
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
    });
    (text as any).id = uuid();
    (text as any).name = `Emoji: ${emoji}`;
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveToHistory();
  }, [canvas, canvasSize, saveToHistory]);

  const addSvgIcon = useCallback(async (def: SvgIconDef) => {
    if (!canvas) return;
    try {
      const parsed = await loadSVGFromString(def.svg);
      const objects = (parsed.objects || []).filter(Boolean) as FabricObject[];
      
      const filteredObjects = objects.filter(obj => {
        if (obj.type === 'rect' && obj.width === 24 && obj.height === 24 && (obj.fill === 'none' || !obj.fill)) return false;
        return true;
      });

      const grouped = util.groupSVGElements(filteredObjects, parsed.options as Partial<FabricObjectProps> || {}) as Group;
      
      const defaultColor = '#374151';
      grouped.set({
        left: canvasSize.width / 2,
        top: canvasSize.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: 3,
        scaleY: 3,
        fill: defaultColor,
      });

      // Recursively apply fill/stroke to children (replace 'currentColor' with actual color)
      const applyColor = (o: any) => {
        if (o.getObjects) {
          o.getObjects().forEach(applyColor);
          return;
        }
        if (o.set) {
          // Replace currentColor with actual color
          if (o.fill === 'currentColor') o.set('fill', defaultColor);
          else if (o.fill && o.fill !== 'none') o.set('fill', defaultColor);
          if (o.stroke === 'currentColor') o.set('stroke', defaultColor);
          else if (o.stroke && o.stroke !== 'none') o.set('stroke', defaultColor);
        }
      };
      applyColor(grouped);

      (grouped as any).id = uuid();
      (grouped as any).name = def.name;
      // Tag it so effects system knows this is an SVG icon
      (grouped as any).__isSvgIcon = true;
      // Store the base color for effects transformations
      (grouped as any).__baseColor = defaultColor;

      canvas.add(grouped);
      canvas.setActiveObject(grouped);
      canvas.renderAll();
      saveToHistory();
    } catch (err) {
      console.error('Invalid SVG', err);
    }
  }, [canvas, canvasSize, saveToHistory]);

  const filteredEmojis = search 
    ? emojiIcons.filter(e => e.includes(search)) 
    : emojiIcons;

  const filteredSvgIcons = search 
    ? SVG_ICONS.filter(v => v.name.toLowerCase().includes(search.toLowerCase()))
    : SVG_ICONS;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg mb-3">Icons</h3>
        <input 
          type="text" 
          placeholder="Search icons..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500" 
        />
        <div className="flex gap-2 mt-3">
          <button 
            onClick={() => setTab('svg')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'svg' ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400'}`}
          >
            SVG Icons
          </button>
          <button 
            onClick={() => setTab('emoji')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'emoji' ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400'}`}
          >
            Emoji Icons
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {tab === 'svg' ? (
          <div className="grid grid-cols-4 gap-2">
            {filteredSvgIcons.map((def, i) => (
              <button key={`svg-${i}`} onClick={() => addSvgIcon(def)}
                className="aspect-square rounded-lg bg-[#1e1e3a] hover:bg-[#2a2a5a] border border-gray-700/20 flex flex-col items-center justify-center p-2 transition-all hover:scale-105 group">
                <div className="w-full h-full text-gray-300 group-hover:text-white" dangerouslySetInnerHTML={{ __html: def.svg }} />
                <span className="sr-only">{def.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {filteredEmojis.map((emoji, i) => (
              <button key={i} onClick={() => addEmoji(emoji)}
                className="aspect-square rounded-lg bg-[#1e1e3a] hover:bg-[#2a2a5a] border border-gray-700/20 flex items-center justify-center text-2xl transition-all hover:scale-110">
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IconsPanel;
