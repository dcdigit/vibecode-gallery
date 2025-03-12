/*
* @description All the emojis
*/
import React, { useState, useMemo, useEffect, useCallback } from 'react';

// Expanded Unicode banks with more interesting ranges
const UNICODE_BANKS = [
  { 
    name: 'Face Emojis', 
    startCodePoint: 0x1F600,
    description: 'Facial expressions and emotions'
  },
  { 
    name: 'Dingbats & Pictographs', 
    startCodePoint: 0x1F300,
    description: 'Weather, flowers, symbols, and misc icons'
  },
  { 
    name: 'Transport & Map Symbols', 
    startCodePoint: 0x1F680,
    description: 'Vehicles, transportation, and map-related symbols'
  },
  { 
    name: 'Animal Emojis', 
    startCodePoint: 0x1F400,
    description: 'Various animal emojis'
  },
  { 
    name: 'Food & Drink', 
    startCodePoint: 0x1F300,
    description: 'Fruits, vegetables, meals, and beverages'
  },
  { 
    name: 'Activity Symbols', 
    startCodePoint: 0x1F3A0,
    description: 'Sports, games, and recreational activities'
  },
  { 
    name: 'Supplemental Symbols', 
    startCodePoint: 0x1F900,
    description: 'Additional symbols and pictographs'
  },
  { 
    name: 'CJK Unified Ideographs', 
    startCodePoint: 0x4E00,
    description: 'Chinese, Japanese, and Korean characters'
  },
  { 
    name: 'Mathematical Symbols', 
    startCodePoint: 0x2200,
    description: 'Mathematical operators and symbols'
  },
  { 
    name: 'Musical Symbols', 
    startCodePoint: 0x1D100,
    description: 'Musical notation and symbols'
  },
  { 
    name: 'Alchemical Symbols', 
    startCodePoint: 0x1F700,
    description: 'Ancient alchemical and mystical symbols'
  },
  { 
    name: 'Playing Card Symbols', 
    startCodePoint: 0x1F0A0,
    description: 'Symbols for playing cards'
  }
];

const ConsecutiveEmojiGenerator = () => {
  const [startCodePoint, setStartCodePoint] = useState(0x1F600);
  const [itemsPerPage, setItemsPerPage] = useState(250);
  const [page, setPage] = useState(0);

  // Generate emojis using consecutive code points
  const emojis = useMemo(() => {
    const generatedEmojis = [];
    let invalidCount = 0;
    const MAX_INVALID = 100; // Stop if we hit too many invalid code points

    for (let i = 0; invalidCount < MAX_INVALID; i++) {
      try {
        const emoji = String.fromCodePoint(startCodePoint + i);
        generatedEmojis.push({
          codePoint: startCodePoint + i,
          emoji: emoji
        });
        invalidCount = 0; // Reset invalid count when we find a valid emoji
      } catch (error) {
        invalidCount++;
      }
    }

    return generatedEmojis;
  }, [startCodePoint]);

  // Calculate pagination
  const totalPages = Math.ceil(emojis.length / itemsPerPage);
  const paginatedEmojis = emojis.slice(
    page * itemsPerPage, 
    (page + 1) * itemsPerPage
  );

  // Reset page when startCodePoint changes
  useEffect(() => {
    setPage(0);
  }, [startCodePoint, itemsPerPage]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (event.target !== document.body) return;

    switch (event.key) {
      case 'ArrowRight':
        if (page < totalPages - 1) {
          setPage(page + 1);
        }
        break;
      case 'ArrowLeft':
        if (page > 0) {
          setPage(page - 1);
        }
        break;
    }
  }, [page, totalPages]);

  // Add and remove event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <label className="flex items-center">
          Start Code Point (Hex):
          <input 
            type="text" 
            value={`0x${startCodePoint.toString(16)}`}
            onChange={(e) => {
              // Parse hex input, defaulting to 0x1F600 if invalid
              const parsed = parseInt(e.target.value, 16);
              setStartCodePoint(isNaN(parsed) ? 0x1F600 : parsed);
            }}
            className="ml-2 p-1 border rounded"
          />
        </label>
        
        <label className="flex items-center">
          Per Page:
          <input 
            type="number" 
            value={itemsPerPage}
            onChange={(e) => {
              const newCount = parseInt(e.target.value);
              setItemsPerPage(isNaN(newCount) ? 250 : newCount);
            }}
            min="1"
            className="ml-2 p-1 border rounded w-24"
          />
        </label>

        <button
          onClick={() => setStartCodePoint(0)}
          className="px-2 py-1 bg-green-100 hover:bg-green-200 rounded text-sm"
          title="Go to Unicode 0x0"
        >
          Home (0x0)
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {UNICODE_BANKS.map((bank, index) => (
          <button
            key={index}
            onClick={() => setStartCodePoint(bank.startCodePoint)}
            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm"
            title={bank.description}
          >
            {bank.name}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {page + 1} of {totalPages}
        </span>
        <button 
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-25 gap-1">
        {paginatedEmojis.map((emojiObj, index) => (
          <div 
            key={index} 
            className="relative group cursor-pointer hover:bg-gray-100 rounded transition-colors"
            title={`U+${emojiObj.codePoint.toString(16).toUpperCase()} - Click to set start point`}
            onClick={() => setStartCodePoint(emojiObj.codePoint)}
          >
            <span className="text-2xl md:text-3xl lg:text-4xl">
              {emojiObj.emoji}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsecutiveEmojiGenerator;