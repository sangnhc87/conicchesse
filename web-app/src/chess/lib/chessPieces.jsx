import React from 'react';

/**
 * Standard Cburnett Chess Vectors (Lichess standard)
 * Optimized for both high-DPI screens and ultra-sharp B&W PDF printing.
 */

export const PIECE_SVGS = {
  // White King
  wK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" strokeLinecap="butt" strokeLinejoin="miter" />
        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" fill="#fff" />
        <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" />
      </g>
    </svg>
  ),

  // White Queen
  wQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="#fff" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5 4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM13 16a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm23 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" />
        <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-7-16-7 16-7-11 2 12z" strokeLinecap="butt" />
        <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" strokeLinecap="butt" />
        <path d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 4c3.5-1 17.5-1 21 0m-20.5 4c3.5-1 16.5-1 20 0" fill="none" />
      </g>
    </svg>
  ),

  // White Rook
  wR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="#fff" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5c0-6 4-7.5 4-11.5v-2h9v2c0 4 4 5.5 4 11.5H14z" strokeLinejoin="miter" />
        <path d="M12 18h21v-4h-3v2h-4v-2h-3v2h-4v-2h-4v2h-3v-2H9v4h3z" strokeLinejoin="miter" />
        <path d="M12 36c5-2 16-2 21 0M14 31.5c4-1.5 13-1.5 17 0M14 18h17" fill="none" />
      </g>
    </svg>
  ),

  // White Bishop
  wB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <g fill="#fff" strokeLinecap="butt">
          <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z" />
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
        </g>
        <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" strokeLinejoin="miter" />
      </g>
    </svg>
  ),

  // White Knight
  wN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff" />
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.693 2.012-3 2-1.5-.084-.81-1.558-1.5-2.5-.583-.805-1.125-1.5-2.5-1.5-.5 1.5-2.5 2-2.5 2-.5-1 .5-2 1-3.5 1-1.5 2-3 2.5-5 .5-2-1.5-3-1.5-3 1.5-1.5 2.5-1.5 4.5-1.5 1.5 0 2.5-.5 3-1.5.5-1 1-2.5 2.5-3.5 1.5-1 4-1.5 6-1 2 .5 3 2.5 3 3.5s-.5 2-.5 3.5c0 1.5 1 2 2 3z" fill="#fff" />
        <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-8a1 1 0 1 1-2 0 1 1 0 1 1 2 0z" fill="#000" />
      </g>
    </svg>
  ),

  // White Pawn
  wP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // Black King
  bK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 11.63V6M20 8h5" stroke="#fff" strokeLinejoin="miter" />
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#1e293b" stroke="#fff" strokeLinecap="butt" strokeLinejoin="miter" />
        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" fill="#1e293b" stroke="#fff" />
        <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#fff" />
      </g>
    </svg>
  ),

  // Black Queen
  bQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="#1e293b" fillRule="evenodd" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5 4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM13 16a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm23 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" />
        <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-7-16-7 16-7-11 2 12z" strokeLinecap="butt" />
        <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" strokeLinecap="butt" />
        <path d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 4c3.5-1 17.5-1 21 0m-20.5 4c3.5-1 16.5-1 20 0" fill="none" />
      </g>
    </svg>
  ),

  // Black Rook
  bR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="#1e293b" fillRule="evenodd" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5c0-6 4-7.5 4-11.5v-2h9v2c0 4 4 5.5 4 11.5H14z" strokeLinejoin="miter" />
        <path d="M12 18h21v-4h-3v2h-4v-2h-3v2h-4v-2h-4v2h-3v-2H9v4h3z" strokeLinejoin="miter" />
        <path d="M12 36c5-2 16-2 21 0M14 31.5c4-1.5 13-1.5 17 0M14 18h17" fill="none" />
      </g>
    </svg>
  ),

  // Black Bishop
  bB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <g fill="#1e293b" stroke="#fff" strokeLinecap="butt">
          <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z" />
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
        </g>
        <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="#fff" strokeLinejoin="miter" />
      </g>
    </svg>
  ),

  // Black Knight
  bN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#1e293b" stroke="#fff" />
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.693 2.012-3 2-1.5-.084-.81-1.558-1.5-2.5-.583-.805-1.125-1.5-2.5-1.5-.5 1.5-2.5 2-2.5 2-.5-1 .5-2 1-3.5 1-1.5 2-3 2.5-5 .5-2-1.5-3-1.5-3 1.5-1.5 2.5-1.5 4.5-1.5 1.5 0 2.5-.5 3-1.5.5-1 1-2.5 2.5-3.5 1.5-1 4-1.5 6-1 2 .5 3 2.5 3 3.5s-.5 2-.5 3.5c0 1.5 1 2 2 3z" fill="#1e293b" stroke="#fff" />
        <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-8a1 1 0 1 1-2 0 1 1 0 1 1 2 0z" fill="#fff" />
      </g>
    </svg>
  ),

  // Black Pawn
  bP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm select-none pointer-events-none">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#1e293b" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
};

/**
 * Pure SVG Raw String generator for PDF Canvas / HTML Export
 */
export function getPieceSvgString(pieceCode, isPrintBw = false) {
  const isWhite = pieceCode.startsWith('w');
  const type = pieceCode.substring(1).toUpperCase();
  const fillColor = isPrintBw ? (isWhite ? '#ffffff' : '#000000') : (isWhite ? '#ffffff' : '#1e293b');
  const strokeColor = isPrintBw ? (isWhite ? '#000000' : '#000000') : (isWhite ? '#000000' : '#ffffff');
  const innerDetailColor = isPrintBw ? (isWhite ? '#000000' : '#ffffff') : (isWhite ? '#000000' : '#ffffff');

  if (type === 'P') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" />
    </svg>`;
  }

  if (type === 'R') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5c0-6 4-7.5 4-11.5v-2h9v2c0 4 4 5.5 4 11.5H14z" />
        <path d="M12 18h21v-4h-3v2h-4v-2h-3v2h-4v-2h-4v2h-3v-2H9v4h3z" />
        <path d="M12 36c5-2 16-2 21 0M14 31.5c4-1.5 13-1.5 17 0M14 18h17" fill="none" stroke="${innerDetailColor}" />
      </g>
    </svg>`;
  }

  if (type === 'N') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.693 2.012-3 2-1.5-.084-.81-1.558-1.5-2.5-.583-.805-1.125-1.5-2.5-1.5-.5 1.5-2.5 2-2.5 2-.5-1 .5-2 1-3.5 1-1.5 2-3 2.5-5 .5-2-1.5-3-1.5-3 1.5-1.5 2.5-1.5 4.5-1.5 1.5 0 2.5-.5 3-1.5.5-1 1-2.5 2.5-3.5 1.5-1 4-1.5 6-1 2 .5 3 2.5 3 3.5s-.5 2-.5 3.5c0 1.5 1 2 2 3z" />
        <circle cx="9.5" cy="25.5" r="0.8" fill="${innerDetailColor}" stroke="none" />
        <circle cx="15" cy="18" r="1.2" fill="${innerDetailColor}" stroke="none" />
      </g>
    </svg>`;
  }

  if (type === 'B') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z" />
        <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
        <circle cx="22.5" cy="8" r="2.5" />
        <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" fill="none" stroke="${innerDetailColor}" />
      </g>
    </svg>`;
  }

  if (type === 'Q') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="12" r="2" />
        <circle cx="22.5" cy="7.5" r="2" />
        <circle cx="39" cy="12" r="2" />
        <circle cx="11" cy="16" r="2" />
        <circle cx="34" cy="16" r="2" />
        <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-7-16-7 16-7-11 2 12z" />
        <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
        <path d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 4c3.5-1 17.5-1 21 0m-20.5 4c3.5-1 16.5-1 20 0" fill="none" stroke="${innerDetailColor}" />
      </g>
    </svg>`;
  }

  if (type === 'K') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22.5 11.63V6M20 8h5" stroke="${strokeColor}" stroke-linecap="round" />
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" />
        <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" stroke="${innerDetailColor}" />
      </g>
    </svg>`;
  }

  return '';
}

export const PIECE_NAMES_VI = {
  K: 'Vua',
  Q: 'Hậu',
  R: 'Xe',
  B: 'Tượng',
  N: 'Mã',
  P: 'Tốt'
};

export default PIECE_SVGS;
