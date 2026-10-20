"use client";

import { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, IconButton, Typography, useMediaQuery } from '@mui/material';
import Link from 'next/link';

const SLIDE_DURATION = 6000;

export default function PromotionalCarousel({ slides }) {
  const carouselRef = useRef(null);
  const touchStartRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const goTo = (index) => {
    if (slides.length) setActiveIndex((index + slides.length) % slides.length);
  };

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    if (carouselRef.current) observer.observe(carouselRef.current);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2 || hovered || focused || touching || !visible || !pageVisible || reducedMotion) return;
    const timer = window.setTimeout(() => {
      setActiveIndex(index => (index + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [activeIndex, slides.length, hovered, focused, touching, visible, pageVisible, reducedMotion]);

  return (
    <Box
      ref={carouselRef}
      component="section"
      aria-label="Explora la tienda"
      aria-roledescription="carrusel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onTouchStart={event => {
        const touch = event.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        setTouching(true);
      }}
      onTouchEnd={event => {
        const start = touchStartRef.current;
        const end = event.changedTouches[0];
        if (start && end) {
          const dx = end.clientX - start.x;
          const dy = end.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (event.cancelable) event.preventDefault();
            goTo(activeIndex + (dx < 0 ? 1 : -1));
          }
        }
        touchStartRef.current = null;
        setTouching(false);
      }}
      onTouchCancel={() => {
        touchStartRef.current = null;
        setTouching(false);
      }}
      sx={{ width: '100%', height: { xs: '350px', md: '600px' }, position: 'relative', overflow: 'hidden', bgcolor: '#002855', touchAction: 'pan-y' }}
    >
      {slides.map((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        return (
          <Box
            key={slide.id}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${slideIndex + 1} de ${slides.length}: ${slide.items.map(item => item.titulo).join(' y ')}`}
            aria-hidden={!active}
            inert={!active}
            sx={{ position: 'absolute', inset: 0, display: 'flex', opacity: active ? 1 : 0, zIndex: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none', transition: reducedMotion ? 'none' : 'opacity 800ms ease-in-out' }}
          >
            {slide.items.map((item, index) => (
              <Box
                key={item.id}
                component={item.path ? ButtonBase : 'div'}
                {...(item.path ? { LinkComponent: Link } : {})}
                href={item.path}
                sx={{
                  width: `${100 / slide.items.length}%`, height: '100%', position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRight: index < slide.items.length - 1 ? '2px solid white' : 'none',
                  '&.Mui-focusVisible': { outline: '3px solid #FFB800', outlineOffset: '-3px' },
                }}
              >
                <Box component="img" src={item.img} alt={item.titulo} draggable={false} sx={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: active ? 'scale(1)' : 'scale(1.04)', transition: reducedMotion ? 'none' : 'transform 1400ms cubic-bezier(0.22, 1, 0.36, 1)' }} />
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.3)', zIndex: 1 }} />
                <Typography variant="h3" sx={{ color: '#fff', zIndex: 2, fontFamily: 'serif', fontWeight: 600, fontSize: { xs: '1.5rem', md: '3.5rem' }, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center', px: slide.items.length === 1 ? { xs: 6, md: 8 } : 1, overflowWrap: 'break-word', transform: active ? 'translateY(0)' : 'translateY(12px)', transition: reducedMotion ? 'none' : 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
                  {item.titulo}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      })}
      {slides.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: { xs: 16, md: 24 }, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}>
          <Box sx={{ display: 'flex', bgcolor: 'rgba(100,100,100,0.35)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderRadius: 8, px: 0.75, py: 0.25, pointerEvents: 'auto' }}>
            {slides.map((slide, index) => (
              <IconButton
                key={slide.id}
                aria-label={`Ver ${slide.items.map(item => item.titulo).join(' y ')}`}
                aria-current={activeIndex === index ? 'true' : undefined}
                onMouseEnter={() => goTo(index)}
                onClick={() => goTo(index)}
                sx={{ width: 40, height: 40, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, '&.Mui-focusVisible': { outline: '2px solid #FFB800', outlineOffset: 1 } }}
              >
                <Box sx={{ width: activeIndex === index ? 20 : 8, height: 8, borderRadius: 8, bgcolor: activeIndex === index ? '#FFB800' : 'rgba(255,255,255,0.7)', transition: reducedMotion ? 'none' : 'width 250ms ease, background-color 250ms ease' }} />
              </IconButton>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
