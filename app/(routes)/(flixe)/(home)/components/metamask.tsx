"use client" 

import React, { useEffect, useState } from 'react';

const MagicText = () => {
  const [stars, setStars] = useState([]);

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const animate = (star, index) => {
    star.style.setProperty('--star-left', `${rand(-10, 100)}%`);
    star.style.setProperty('--star-top', `${rand(-40, 80)}%`);

    star.style.animation = 'none';
    star.offsetHeight;
    star.style.animation = '';

    // Repeatedly animate after initial animation
    setInterval(() => animate(star, index), 1000);
  };

  useEffect(() => {
    const stars = Array.from(document.getElementsByClassName('magic-star'));

    stars.forEach((star, index) => {
      animate(star, index);
    });

    setStars(stars);
  }, []);

  return (
    <h1 className="text-white font-rubik text-4xl font-normal p-20 text-center">
      Sometimes I'll start a line of code and I
      <span className="magic">
        {stars.map((_, index) => (
          <span
            key={index}
            className="magic-star"
            style={{
              '--size': `clamp(20px, 1.5vw, 30px)`,
              animation: 'scale 700ms ease forwards',
              display: 'block',
              height: 'var(--size)',
              left: 'var(--star-left)',
              position: 'absolute',
              top: 'var(--star-top)',
              width: 'var(--size)',
            }}
          >
            <svg viewBox="0 0 512 512">
              <path d="M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z" />
            </svg>
          </span>
        ))}
        <span
          className="magic-text"
          style={{
            animation: 'background-pan 3s linear infinite, scale 1s linear infinite', // Added animation for text
            background: 'linear-gradient(to right, var(--purple), var(--violet), var(--pink), var(--purple))',
            backgroundSize: '200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          don't even know
        </span>
      </span>
      where it's going.
    </h1>
  );
};

export default MagicText;
