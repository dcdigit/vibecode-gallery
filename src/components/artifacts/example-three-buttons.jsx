import React, { useState } from 'react';

export default function ClickCounter() {
  // State array to track counts for the 3 buttons
  const [counts, setCounts] = useState([0, 0, 0]);

  // Function to handle button clicks
  const handleClick = (index) => {
    const newCounts = [...counts];
    newCounts[index] += 1;
    setCounts(newCounts);
  };

  // Common styles for the circular buttons
  const buttonStyle = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
    fontSize: '18px',
    margin: '10px',
    cursor: 'pointer'
  };

  // Style for the counter display
  const counterStyle = {
    fontSize: '18px',
    verticalAlign: 'middle'
  };

  // Container style for button-counter pairs
  const containerStyle = {
    marginBottom: '15px'
  };

  return (
    <div>
      {counts.map((count, index) => (
        <div key={index} style={containerStyle}>
          <button style={buttonStyle} onClick={() => handleClick(index)}>
            Button {index + 1}
          </button>
          <span style={counterStyle}>{count}</span>
        </div>
      ))}
    </div>
  );
}