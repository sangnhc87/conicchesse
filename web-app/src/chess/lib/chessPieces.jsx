import React from 'react';

/**
 * Premium Cburnett & Neo Vector Chess Set (Tournament / Lichess / Chess.com standard)
 * Enhanced with deep luxury contrasts, crisp outlines, and smooth shadows.
 */

export const PIECE_SVGS = {
  // White King
  wK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="none" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" strokeLinejoin="miter" />
        <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" fill="#ffffff" strokeLinecap="butt" strokeLinejoin="miter" />
        <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 C 20,19.5 10.5,16.5 6.5,23 C 3.5,29 12.5,30 12.5,30 L 12.5,37" fill="#ffffff" />
        <path d="M 11.5,30 C 17,27 27,27 32.5,30" />
        <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" />
        <path d="M 11.5,37 C 17,34 27,34 32.5,37" />
      </g>
    </svg>
  ),

  // White Queen
  wQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="#ffffff" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z" strokeLinecap="butt" />
        <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" strokeLinecap="butt" />
        <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" />
        <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="14" cy="9" r="2" />
        <circle cx="22.5" cy="8" r="2" />
        <circle cx="31" cy="9" r="2" />
        <circle cx="39" cy="12" r="2" />
      </g>
    </svg>
  ),

  // White Rook
  wR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="#ffffff" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" strokeLinejoin="miter" />
        <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" strokeLinejoin="miter" />
        <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" strokeLinejoin="miter" />
        <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
        <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" strokeLinejoin="miter" />
        <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
        <path d="M 11,14 L 34,14" fill="none" stroke="#1c1917" strokeLinejoin="miter" />
      </g>
    </svg>
  ),

  // White Bishop
  wB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="none" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <g fill="#ffffff" strokeLinecap="butt">
          <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.97 6.68,38.99 6,38 C 7.35,36.54 9,36 9,36 z" />
          <path d="M 12,36 C 13,32 15,31 16.5,30 C 18,29 19.5,29 22.5,29 C 25.5,29 27,29 28.5,30 C 30,31 32,32 33,36 z" />
          <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
          <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z" />
        </g>
        <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" strokeLinejoin="miter" />
      </g>
    </svg>
  ),

  // White Knight
  wN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="none" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#ffffff" />
        <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,31 C 9,32.08 7.69,32.01 7.5,30 C 6.5,31 5,31 4.5,29.5 C 4,28 5.5,27 6,25.5 C 5,26 4,24.5 4.5,23 C 5,21.5 6,20 6.5,18 C 7,16 6,15 6,15 C 7.5,13.5 8.5,13.5 10.5,13.5 C 12,13.5 13,13 13.5,12 C 14,11 14.5,9.5 16,8.5 C 17.5,7.5 20,7 22,7.5 C 24,8 25,10 25,11 C 25,12 24.5,13 24.5,14.5 C 24.5,16 25.5,17 26.5,18 z" fill="#ffffff" />
        <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#1c1917" />
        <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#1c1917" />
      </g>
    </svg>
  ),

  // White Pawn
  wP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <path d="M 22.5,9 C 20.29,9 18.5,10.79 18.5,13 C 18.5,13.89 18.79,14.71 19.28,15.38 C 17.33,16.5 16,18.59 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,18.59 27.67,16.5 25.72,15.38 C 26.21,14.71 26.5,13.89 26.5,13 C 26.5,10.79 24.71,9 22.5,9 z" fill="#ffffff" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // Black King
  bK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="none" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" strokeLinejoin="miter" />
        <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" fill="#262421" stroke="#1c1917" strokeLinecap="butt" strokeLinejoin="miter" />
        <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 C 20,19.5 10.5,16.5 6.5,23 C 3.5,29 12.5,30 12.5,30 L 12.5,37" fill="#262421" stroke="#1c1917" />
        <path d="M 11.5,30 C 17,27 27,27 32.5,30" stroke="#ffffff" strokeWidth="1.2" />
        <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" stroke="#ffffff" strokeWidth="1.2" />
        <path d="M 11.5,37 C 17,34 27,34 32.5,37" stroke="#ffffff" strokeWidth="1.2" />
      </g>
    </svg>
  ),

  // Black Queen
  bQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="#262421" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z" strokeLinecap="butt" />
        <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" strokeLinecap="butt" />
        <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="14" cy="9" r="2" />
        <circle cx="22.5" cy="8" r="2" />
        <circle cx="31" cy="9" r="2" />
        <circle cx="39" cy="12" r="2" />
      </g>
    </svg>
  ),

  // Black Rook
  bR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="#262421" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" strokeLinejoin="miter" />
        <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" strokeLinejoin="miter" />
        <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" strokeLinejoin="miter" />
        <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
        <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" strokeLinejoin="miter" />
        <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
        <path d="M 12,36 L 33,36 M 11,14 L 34,14" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="miter" />
      </g>
    </svg>
  ),

  // Black Bishop
  bB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="none" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <g fill="#262421" stroke="#1c1917" strokeLinecap="butt">
          <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.97 6.68,38.99 6,38 C 7.35,36.54 9,36 9,36 z" />
          <path d="M 12,36 C 13,32 15,31 16.5,30 C 18,29 19.5,29 22.5,29 C 25.5,29 27,29 28.5,30 C 30,31 32,32 33,36 z" />
          <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
          <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z" />
        </g>
        <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="miter" />
      </g>
    </svg>
  ),

  // Black Knight
  bN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <g fill="none" fillRule="evenodd" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#262421" />
        <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,31 C 9,32.08 7.69,32.01 7.5,30 C 6.5,31 5,31 4.5,29.5 C 4,28 5.5,27 6,25.5 C 5,26 4,24.5 4.5,23 C 5,21.5 6,20 6.5,18 C 7,16 6,15 6,15 C 7.5,13.5 8.5,13.5 10.5,13.5 C 12,13.5 13,13 13.5,12 C 14,11 14.5,9.5 16,8.5 C 17.5,7.5 20,7 22,7.5 C 24,8 25,10 25,11 C 25,12 24.5,13 24.5,14.5 C 24.5,16 25.5,17 26.5,18 z" fill="#262421" />
        <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#ffffff" stroke="#ffffff" />
        <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#ffffff" stroke="#ffffff" />
        <path d="M 24.55,10.4 C 24.19,10 23.3,9.5 22,9.5 C 20,9.5 18.5,10.5 17.5,11.5 C 16.5,12.5 15.5,14 15.5,15.5" stroke="#ffffff" strokeWidth="1.2" />
      </g>
    </svg>
  ),

  // Black Pawn
  bP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none pointer-events-none transition-transform">
      <path d="M 22.5,9 C 20.29,9 18.5,10.79 18.5,13 C 18.5,13.89 18.79,14.71 19.28,15.38 C 17.33,16.5 16,18.59 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,18.59 27.67,16.5 25.72,15.38 C 26.21,14.71 26.5,13.89 26.5,13 C 26.5,10.79 24.71,9 22.5,9 z" fill="#262421" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
};

/**
 * Pure SVG Raw String generator for PDF Canvas / HTML Export
 */
export function getPieceSvgString(pieceCode, isPrintBw = false) {
  const isWhite = pieceCode.startsWith('w');
  const type = pieceCode.substring(1).toUpperCase();
  const fillColor = isPrintBw ? (isWhite ? '#ffffff' : '#000000') : (isWhite ? '#ffffff' : '#262421');
  const strokeColor = '#1c1917';
  const innerDetailColor = isWhite ? '#1c1917' : '#ffffff';

  if (type === 'P') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <path d="M 22.5,9 C 20.29,9 18.5,10.79 18.5,13 C 18.5,13.89 18.79,14.71 19.28,15.38 C 17.33,16.5 16,18.59 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,18.59 27.67,16.5 25.72,15.38 C 26.21,14.71 26.5,13.89 26.5,13 C 26.5,10.79 24.71,9 22.5,9 z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" />
    </svg>`;
  }

  if (type === 'R') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
        <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
        <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
        <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
        <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
        <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
        <path d="M 12,36 L 33,36 M 11,14 L 34,14" fill="none" stroke="${innerDetailColor}" />
      </g>
    </svg>`;
  }

  if (type === 'N') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
        <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,31 C 9,32.08 7.69,32.01 7.5,30 C 6.5,31 5,31 4.5,29.5 C 4,28 5.5,27 6,25.5 C 5,26 4,24.5 4.5,23 C 5,21.5 6,20 6.5,18 C 7,16 6,15 6,15 C 7.5,13.5 8.5,13.5 10.5,13.5 C 12,13.5 13,13 13.5,12 C 14,11 14.5,9.5 16,8.5 C 17.5,7.5 20,7 22,7.5 C 24,8 25,10 25,11 C 25,12 24.5,13 24.5,14.5 C 24.5,16 25.5,17 26.5,18 z" />
        <circle cx="9.5" cy="25.5" r="0.8" fill="${innerDetailColor}" stroke="none" />
        <circle cx="15" cy="18" r="1.2" fill="${innerDetailColor}" stroke="none" />
      </g>
    </svg>`;
  }

  if (type === 'B') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.97 6.68,38.99 6,38 C 7.35,36.54 9,36 9,36 z" />
        <path d="M 12,36 C 13,32 15,31 16.5,30 C 18,29 19.5,29 22.5,29 C 25.5,29 27,29 28.5,30 C 30,31 32,32 33,36 z" />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
        <circle cx="22.5" cy="8" r="2.5" />
        <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" fill="none" stroke="${innerDetailColor}" />
      </g>
    </svg>`;
  }

  if (type === 'Q') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="12" r="2" />
        <circle cx="14" cy="9" r="2" />
        <circle cx="22.5" cy="8" r="2" />
        <circle cx="31" cy="9" r="2" />
        <circle cx="39" cy="12" r="2" />
        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z" />
        <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
        <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" stroke="${innerDetailColor}" />
        <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke="${innerDetailColor}" />
      </g>
    </svg>`;
  }

  if (type === 'K') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%">
      <g fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" stroke="${strokeColor}" stroke-linecap="round" />
        <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
        <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 C 20,19.5 10.5,16.5 6.5,23 C 3.5,29 12.5,30 12.5,30 L 12.5,37" />
        <path d="M 11.5,30 C 17,27 27,27 32.5,30" fill="none" stroke="${innerDetailColor}" />
        <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" fill="none" stroke="${innerDetailColor}" />
        <path d="M 11.5,37 C 17,34 27,34 32.5,37" fill="none" stroke="${innerDetailColor}" />
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
