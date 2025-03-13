/*
* @description All the emojis strobing
*/

import React, { useState, useEffect } from 'react';

const emojis = [
  "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊",
  "😋", "😎", "😍", "😘", "😗", "😙", "😚", "☺️", "🙂", "🤗",
  "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥",
  "😮", "🤐", "😯", "😪", "😫", "😴", "😌", "😛", "😜", "😝",
  "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "☹️", "🙁",
  "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩",
  "🤯", "😬", "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵", "😡",
  "😠", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🤠",
  "🤡", "🤥", "🤫", "🤭", "🧐", "🤓", "😈", "👿", "👹", "👺",
  "💀", "👻", "👽", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼",

  // Additional 100 emojis:
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒",
  "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇",
  "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜",
  "🦟", "🦗", "🕷", "🕸", "🐢", "🐍", "🦎", "🦂", "🦀", "🦑",
  "🐙", "🦐", "🐠", "🐟", "🐡", "🐬", "🐳", "🐋", "🦈", "🐊",
  "🐆", "🐅", "🐃", "🐂", "🐄", "🐪", "🐫", "🦙", "🦒", "🐘",
  "🦏", "🦛", "🐐", "🐏", "🐑", "🐎", "🐖", "🐀", "🐁", "🐉",
  "🐲", "🌵", "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "☘️", "🍀",
  "🎍", "🎋", "🍁", "🍂", "🍃", "🌺", "🌻", "🌹", "🥀", "🌷"
];

const EmojiFlash = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  useEffect(() => {
    // Only run the interval when not paused
    if (!isPaused) {
      const interval = setInterval(() => {
        setIndex(prev => (prev + 1) % emojis.length);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: "20rem", textAlign: "center", marginTop: "1vh" }}>
        {emojis[index]}
      </div>
      <button 
        onClick={togglePause}
        style={{
          fontSize: "1.5rem",
          padding: "0.5rem 1.5rem",
          borderRadius: "2rem",
          border: "none",
          backgroundColor: "#f0f0f0",
          color: "#333",
          cursor: "pointer",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          transition: "all 0.2s ease",
          marginTop: "2rem"
        }}
      >
        {isPaused ? "Resume" : "Pause"}
      </button>
    </div>
  );
};

export default EmojiFlash;