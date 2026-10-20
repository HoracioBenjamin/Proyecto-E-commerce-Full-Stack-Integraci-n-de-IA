"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { supabase } from '../../lib/supabaseClient';

// Estilos de Swiper
import 'swiper/css';
import 'swiper/css/navigation';

const MARCAS_FALLBACK = [
  { id: 1, img: '/images/Marca_LV.jpg', title: 'Louis Vuitton', tag: 'NEW DROP' },
  { id: 2, img: '/images/Marca_Coach.jpg', title: 'Coach', tag: 'ESSENTIAL' },
  { id: 3, img: '/images/Marca_EA.jpg', title: 'Emporio Armani', tag: 'PHANTOM' },
  { id: 4, img: '/images/Marca_Balmain.jpg', title: 'Balmain', tag: 'HANDMADE' },
  { id: 5, img: '/images/Marca_Karl.jpg', title: 'Karl Lagerfeld', tag: 'URBAN' },
];

export default function LookbookCarousel() {
  const [marcasAbiertas, setMarcasAbiertas] = useState(true);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [marcaActiva, setMarcaActiva] = useState(0);
  // Marcas desde Supabase (nombre, logo_url, imagen_portada); fallback local si falla
  const [marcas, setMarcas] = useState(MARCAS_FALLBACK);

  useEffect(() => {
    const fetchMarcas = async () => {
      const { data, error } = await supabase
        .from('marcas')
        .select('id, nombre, logo_url, imagen_portada, slug')
        .order('nombre');
      if (!error && data && data.length > 0) {
        setMarcas(
          data.map((m) => ({
            id: m.id,
            title: m.nombre,
            img: m.imagen_portada || m.logo_url,
            tag: (m.slug || m.nombre).toUpperCase().replace(/-/g, ' '),
          }))
        );
      }
    };
    fetchMarcas();
  }, []);

  // Centra el carrusel en el card de la marca seleccionada
  const centrarEnMarca = (index) => {
    if (swiperInstance) {
      swiperInstance.slideToLoop(index, 600);
    }
  };

  return (
    <Box component="section" sx={{ 
      width: '100%',
      maxWidth: '100%',
      bgcolor: '#fff', 
      marginBottom: 4,
      marginTop: 2,
      overflow: 'hidden',
      boxSizing: 'border-box',
      '& .swiper-button-next, & .swiper-button-prev': {
        color: '#002855',
        '&::after': { fontSize: '1.2rem', fontWeight: 'bold' }
      }
    }}>
      
      <Box sx={{ px: 4, mb: 6, textAlign: 'center' }}>
        <Typography variant="overline" sx={{ letterSpacing: 5, color: 'gray' }}>
          Explora por marcas
        </Typography>

        {/* Flecha minimalista solo-punta que despliega la línea de marcas */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
          <IconButton
            onClick={() => setMarcasAbiertas((prev) => !prev)}
            aria-label={marcasAbiertas ? 'Ocultar marcas' : 'Mostrar marcas'}
            aria-expanded={marcasAbiertas}
            size="small"
            sx={{
              color: 'gray',
              p: 0.5,
              '&:hover': { bgcolor: 'transparent', color: '#002855' }
            }}
          >
            <ExpandMoreIcon
              fontSize="small"
              sx={{
                fontWeight: 300,
                transform: marcasAbiertas ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            />
          </IconButton>
        </Box>

        {/* Línea única con los nombres de cada marca: centra su card al pasar el mouse */}
        <Collapse in={marcasAbiertas} timeout={300}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: { xs: 1.5, md: 2.5 },
              mt: 1.5
            }}
          >
            {marcas.map((item, i) => (
              <React.Fragment key={item.id}>
                {i > 0 && (
                  <Typography component="span" sx={{ color: '#ccc', fontWeight: 300 }}>
                    |
                  </Typography>
                )}
                <Typography
                  component="span"
                  onMouseEnter={() => centrarEnMarca(i)}
                  onClick={() => centrarEnMarca(i)}
                  sx={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: marcaActiva === i ? '#FFB800' : '#002855',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'color 0.3s ease',
                    '&:hover': { color: '#FFB800' }
                  }}
                >
                  {item.title}
                </Typography>
              </React.Fragment>
            ))}
          </Box>
        </Collapse>
      </Box>

      <Swiper
        modules={[Autoplay, Navigation]}
        onSwiper={setSwiperInstance}
        onSlideChange={(s) => setMarcaActiva(s.realIndex)}
        spaceBetween={2}
        loop={true}
        // Centrado activo en todos los tamaños: el seleccionado queda en medio
        centeredSlides={true}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        navigation={true}
        breakpoints={{
          // Móvil
          0: { 
            slidesPerView: 1,
            centeredSlides: true
          },
          // Tablet
          600: { 
            slidesPerView: 3,
            centeredSlides: true
          },
          // Desktop
          900: { 
            slidesPerView: 3, 
            centeredSlides: true
          },
          // Pantallas grandes: 3 visibles (5 slides >= 3 + 2, loop activo sin blancos)
          1200: { 
            slidesPerView: 3, 
            centeredSlides: true
          }
        }}
        style={{ width: '100%', maxWidth: '100%', height: '85vh', overflow: 'hidden' }}
      >
        {marcas.map((item) => (
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