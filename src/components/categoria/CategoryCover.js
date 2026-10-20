"use client";

import { useRef, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';

export default function CategoryCover({ cover, name }) {
  const slidesRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const images = [...new Set((Array.isArray(cover) ? cover : [cover])
    .filter(image => typeof image === 'string' && image.trim())
    .map(image => image.trim()))];

  if (!images.length) return null;

  const multiple = images.length > 1;
  const goTo = (index) => {
    const slides = slidesRef.current;
    if (!slides) return;
    const nextIndex = (index + images.length) % images.length;
    slides.scrollTo({
      left: nextIndex * slides.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  return (
    <Box
      component="section"
      aria-label={`Portada de ${name}`}
      aria-roledescription={multiple ? 'carrusel' : undefined}
      sx={{ position: 'relative', mb: { xs: 4, md: 6 }, overflow: 'hidden', borderRadius: 2, bgcolor: '#f9f9f9' }}
    >
      <Box
        ref={slidesRef}
        onScroll={event => {
          const { scrollLeft, clientWidth } = event.currentTarget;
          if (clientWidth) setActiveIndex(Math.round(scrollLeft / clientWidth));
        }}
        sx={{
          display: 'flex', overflowX: multiple ? 'auto' : 'hidden',
          scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {images.map((src, index) => (
          <Box key={src} sx={{ flex: '0 0 100%', minWidth: 0, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
            <Box
              component="img"
              src={src}
              alt={`Portada de ${name}${multiple ? ` (${index + 1} de ${images.length})` : ''}`}
              draggable={false}
              sx={{ display: 'block', width: '100%', aspectRatio: { xs: '2 / 1', sm: '3 / 1', md: '4 / 1' }, objectFit: 'cover' }}
            />
          </Box>
        ))}
      </Box>
      {multiple && (
        <>
          {[
            { label: 'Portada anterior', direction: -1, side: 'left', icon: <ArrowBackIosNew fontSize="small" /> },
            { label: 'Portada siguiente', direction: 1, side: 'right', icon: <ArrowForwardIos fontSize="small" /> },
          ].map(({ label, direction, side, icon }) => (
            <IconButton
              key={side}
              aria-label={label}
              onClick={() => goTo(activeIndex + direction)}
              sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [side]: { xs: 8, md: 16 }, bgcolor: 'rgba(255,255,255,0.9)', color: '#002855', '&:hover': { bgcolor: '#fff' } }}
            >
              {icon}
            </IconButton>
          ))}
          <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            {images.map((src, index) => (
              <IconButton key={src} aria-label={`Ver portada ${index + 1}`} aria-current={activeIndex === index ? 'true' : undefined} onClick={() => goTo(index)} size="small">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: activeIndex === index ? '#FFB800' : '#fff', boxShadow: '0 0 3px rgba(0,0,0,0.5)' }} />
              </IconButton>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
