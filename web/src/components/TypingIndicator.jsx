import React from 'react';
import { useSocket } from '../context/SocketContext';

const TypingIndicator = ({ activeRoomId }) => {
  const { typingUsers } = useSocket();

  const activeTypers = typingUsers[activeRoomId] || [];

  if (activeTypers.length === 0) {
    return <div className="typing-strip"></div>;
  }

  const typingText =
    activeTypers.length === 1
      ? `${activeTypers[0]} is typing...`
      : activeTypers.length === 2
      ? `${activeTypers[0]} and ${activeTypers[1]} are typing...`
      : 'Several people are typing...';

  return (
    <div className="typing-strip">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span>{typingText}</span>
    </div>
  );
};

export default TypingIndicator;
