"use client";
import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';

// Estilos de Swiper
import 'swiper/css';
import 'swiper/css/navigation';

const LOOKBOOK_ITEMS = [
  { id: 1, img: '/images/Marca_LV.jpg', title: 'Louis Vuitton', tag: 'NEW DROP' },
  { id: 2, img: '/images/Marca_Coach.jpg', title: 'Coach', tag: 'ESSENTIAL' },
  { id: 3, img: '/images/Marca_EA.jpg', title: 'Emporio Armani', tag: 'PHANTOM' },
  { id: 4, img: '/images/Marca_Balmain.jpg', title: 'Balmain', tag: 'HANDMADE' },
  { id: 5, img: '/images/Marca_Karl.jpg', title: 'Karl Lagerfeld', tag: 'URBAN' },
];

export default function LookbookCarousel() {
  return (
    <Box component="section" sx={{ 
      width: '100vw', 
      bgcolor: '#fff', 
      marginBottom: 4,
      marginTop: 2,
      overflow: 'hidden', // Crucial para que no se escape nada
      '& .swiper-button-next, & .swiper-button-prev': {
        color: 'black',
        '&::after': { fontSize: '1.2rem', fontWeight: 'bold' }
      }
    }}>
      
      <Box sx={{ px: 4, mb: 6, textAlign: 'center' }}>
        <Typography variant="overline" sx={{ letterSpacing: 5, color: 'gray' }}>
          Explora por marcas
        </Typography>
      </Box>

      <Swiper
        modules={[Autoplay, Navigation]}
        spaceBetween={2}
        loop={true}
        // CAMBIO CLAVE: Quitamos centeredSlides para que llene el contenedor de izquierda a derecha
        centeredSlides={false} 
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        navigation={true}
        breakpoints={{
          // Móvil
          0: { 
            slidesPerView: 1.2,
            centeredSlides: true // Solo centramos en móvil para el look de "una foto y media"
          },
          // Tablet
          600: { 
            slidesPerView: 2.5,
            centeredSlides: false
          },
          // Desktop (Aquí es donde se veía blanco)
          900: { 
            slidesPerView: 3, 
            centeredSlides: false 
          },
          // Pantallas grandes: Usamos un número que divida bien el 100% (como 4)
          1200: { 
            slidesPerView: 4, 
            centeredSlides: false // Al ser falso, la cuarta imagen pegará al borde derecho
          }
        }}
        style={{ width: '100%', height: '85vh' }}
      >
        {LOOKBOOK_ITEMS.map((item) => (
          <SwiperSlide key={item.id}>
            <Box 
              component={motion.div}
              whileHover="hover"
              sx={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative', 
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              <motion.img 
                src={item.img} 
                alt={item.title}
                variants={{ hover: { scale: 1.1 } }}
                transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
              />

              <Box sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                p: 4, 
                color: 'white',
                background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                width: '100%',
                textAlign: 'left'
              }}>
                <Typography variant="caption" sx={{ letterSpacing: 2, fontWeight: 700 }}>
                  {item.tag}
                </Typography>
                <Typography variant="h5" sx={{ fontFamily: 'serif', mt: 1 }}>
                  {item.title}
                </Typography>
              </Box>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}