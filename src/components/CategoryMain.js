"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, IconButton, ButtonBase } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient'; 

export default function CategoryMain() {
  const scrollRef = useRef(null);
  
  // 1. Estado para las categorías dinámicas
  const [categories, setCategories] = useState([]);

  // 2. Carga de datos de Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*');
      
      if (!error && data) {
        // Mapeamos los datos de Supabase al formato que espera tu diseño
        const formattedData = data.map(cat => ({
          title: cat.nombre,
          img: cat.imagen_url,
          slug: cat.slug
        }));
        setCategories(formattedData);
      }
    };
    fetchCategories();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <Box sx={{ width: '100%', py: 6, bgcolor: '#f9f9f9', position: 'relative', px: { xs: 2, md: 8 } }}>
      <Typography 
        variant="h4" 
        sx={{ 
          fontFamily: 'serif', 
          textAlign: 'center', 
          mb: 4, 
          fontWeight: 600, 
          letterSpacing: '0.1em' 
        }}
      >
        COMPRAR POR CATEGORÍA
      </Typography>

      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        
        {/* BOTÓN IZQUIERDA */}
        <IconButton 
          onClick={() => scroll('left')}
          sx={{ 
            position: 'absolute', left: -20, zIndex: 5, 
            bgcolor: '#fff', boxShadow: 2,
            '&:hover': { bgcolor: '#eee' },
            display: { xs: 'none', md: 'flex' }
          }}
        >
          <ArrowBackIosNew />
        </IconButton>

        {/* CONTENEDOR DE CATEGORÍAS (IDÉNTICO AL ANTIGUO) */}
        <Box
          ref={scrollRef}
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            px: 1
          }}
        >
          {categories.map((cat) => (
            <Box 
              key={cat.title} 
              sx={{ 
                minWidth: { xs: '150px', sm: '180px', md: 'calc(20% - 13px)' }, 
                textAlign: 'center' 
              }}
            >
              {/* Navegación usando slug o título en minúsculas */}
              <Link href={`/productos/${cat.slug || cat.title.toLowerCase()}`} passHref style={{ textDecoration: 'none' }}>
                <ButtonBase
                  sx={{
                    width: '100%',
                    aspectRatio: '1/1',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                    mb: 1.5,
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  <Box
                    component="img"
                    src={cat.img}
                    alt={cat.title}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </ButtonBase>
              </Link>
              <Typography 
                variant="subtitle1" 
                sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.85rem', color: '#1a1a1a' }}
              >
                {cat.title}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* BOTÓN DERECHA */}
        <IconButton 
          onClick={() => scroll('right')}
          sx={{ 
            position: 'absolute', right: -20, zIndex: 5, 
            bgcolor: '#fff', boxShadow: 2,
            '&:hover': { bgcolor: '#eee' },
            display: { xs: 'none', md: 'flex' }
          }}
        >
          <ArrowForwardIos />
        </IconButton>
      </Box>
    </Box>
  );
}