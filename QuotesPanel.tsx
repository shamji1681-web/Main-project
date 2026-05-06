import React, { useState } from 'react';
import { Textbox } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuid } from 'uuid';

const quotesData: { category: string; quotes: string[] }[] = [
  {
    category: '💼 Business',
    quotes: [
      '"The only way to do great work is to love what you do." — Steve Jobs',
      '"Innovation distinguishes between a leader and a follower." — Steve Jobs',
      '"Your time is limited, so don\'t waste it living someone else\'s life." — Steve Jobs',
      '"Success is not final, failure is not fatal: it is the courage to continue that counts." — Winston Churchill',
      '"The best way to predict the future is to create it." — Peter Drucker',
      '"Quality is not an act, it is a habit." — Aristotle',
      '"The secret of getting ahead is getting started." — Mark Twain',
      '"Don\'t be afraid to give up the good to go for the great." — John D. Rockefeller',
    ]
  },
  {
    category: '💪 Motivational',
    quotes: [
      '"Believe you can and you\'re halfway there." — Theodore Roosevelt',
      '"It does not matter how slowly you go as long as you do not stop." — Confucius',
      '"The future belongs to those who believe in the beauty of their dreams." — Eleanor Roosevelt',
      '"Strive not to be a success, but rather to be of value." — Albert Einstein',
      '"In the middle of every difficulty lies opportunity." — Albert Einstein',
      '"What you get by achieving your goals is not as important as what you become by achieving your goals." — Zig Ziglar',
      '"You miss 100% of the shots you don\'t take." — Wayne Gretzky',
      '"Everything you\'ve ever wanted is on the other side of fear." — George Addair',
    ]
  },
  {
    category: '🎨 Creative',
    quotes: [
      '"Creativity is intelligence having fun." — Albert Einstein',
      '"Every artist was first an amateur." — Ralph Waldo Emerson',
      '"Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs',
      '"Simplicity is the ultimate sophistication." — Leonardo da Vinci',
      '"Art is not what you see, but what you make others see." — Edgar Degas',
      '"The chief enemy of creativity is good sense." — Pablo Picasso',
      '"Make it simple, but significant." — Don Draper',
      '"Good design is good business." — Thomas Watson Jr.',
    ]
  },
  {
    category: '❤️ Life',
    quotes: [
      '"Life is what happens when you\'re busy making other plans." — John Lennon',
      '"The purpose of our lives is to be happy." — Dalai Lama',
      '"Life is really simple, but we insist on making it complicated." — Confucius',
      '"The only impossible journey is the one you never begin." — Tony Robbins',
      '"Be yourself; everyone else is already taken." — Oscar Wilde',
      '"Two things are infinite: the universe and human stupidity." — Albert Einstein',
      '"Be the change that you wish to see in the world." — Mahatma Gandhi',
      '"Not all those who wander are lost." — J.R.R. Tolkien',
    ]
  },
];

const QuotesPanel: React.FC = () => {
  const { canvas, canvasSize, saveToHistory } = useEditorStore();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(0);

  const addQuote = (quote: string) => {
    if (!canvas) return;
    const textbox = new Textbox(quote, {
      left: canvasSize.width / 2,
      top: canvasSize.height / 2,
      width: canvasSize.width * 0.8,
      fontSize: Math.max(24, Math.min(48, canvasSize.width * 0.03)),
      fontFamily: 'Playfair Display',
      fontStyle: 'italic',
      fill: '#1e293b',
      textAlign: 'center',
      lineHeight: 1.6,
      originX: 'center',
      originY: 'center',
    });
    (textbox as any).id = uuid();
    (textbox as any).name = quote.substring(0, 25) + '...';
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    saveToHistory();
  };

  const filteredQuotes = search
    ? quotesData.flatMap(g => g.quotes).filter(q => q.toLowerCase().includes(search.toLowerCase()))
    : quotesData[selectedCat]?.quotes || [];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg mb-3">Quotes</h3>
        <input
          type="text"
          placeholder="Search quotes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="px-4 py-2 flex gap-1.5 border-b border-gray-700/50 overflow-x-auto">
          {quotesData.map((g, i) => (
            <button
              key={i}
              onClick={() => setSelectedCat(i)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCat === i ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400 hover:text-white'
              }`}
            >
              {g.category}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredQuotes.map((quote, i) => (
          <button
            key={i}
            onClick={() => addQuote(quote)}
            className="w-full text-left p-3 rounded-lg bg-[#1e1e3a] hover:bg-[#2a2a5a] border border-gray-700/20 hover:border-purple-500/40 transition-all group"
          >
            <p className="text-gray-300 text-xs leading-relaxed group-hover:text-purple-200 transition-colors italic">
              {quote}
            </p>
          </button>
        ))}
        {filteredQuotes.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">No quotes found</div>
        )}
      </div>
    </div>
  );
};

export default QuotesPanel;
