"use client";
import { useRef, useEffect, useState } from 'react'; 
import { Box, Typography, Stack, IconButton, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'; 
import { supabase } from '../../lib/supabaseClient';
import ProductCard from '../components/categoria/productcard'; 
import Link from 'next/link';

export default function ProductSelection() {
  const scrollRef = useRef(null); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar los últimos 5 productos con su stock
  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            stock (*)
          `) // TRAEMOS EL STOCK AQUÍ TAMBIÉN
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Error cargando destacados:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <Box sx={{ py: 10, backgroundColor: '#fff', position: 'relative' }}>
      {/* CABECERA */}
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="flex-end" 
        sx={{ px: { xs: 2, md: 8 }, mb: 4 }}
      >
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: '0.3em', color: 'gray' }}>
            Nuestra Selección
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: 'serif', fontWeight: 300 }}>
            Productos Más Vendidos
          </Typography>
        </Box>
        <Link href="/productos/todos" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography 
            variant="button" 
            sx={{ borderBottom: '2px solid #FFB800', cursor: 'pointer', pb: 0.5 }}
          >
            Ver todo
          </Typography>
        </Link>
      </Stack>

      {/* BOTONES DE NAVEGACIÓN */}
      <IconButton 
        onClick={() => scroll('left')}
        sx={{ 
          position: 'absolute', left: 20, top: '55%', zIndex: 10,
          display: { xs: 'none', md: 'flex' }, bgcolor: 'rgba(255,255,255,0.7)',
          '&:hover': { bgcolor: 'white' }
        }}
      >
        <ArrowBackIosNewIcon fontSize="small" />
      </IconButton>

      <IconButton 
        onClick={() => scroll('right')}
        sx={{ 
          position: 'absolute', right: 20, top: '55%', zIndex: 10,
          display: { xs: 'none', md: 'flex' }, bgcolor: 'rgba(255,255,255,0.7)',
          '&:hover': { bgcolor: 'white' }
        }}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </IconButton>

      {/* CONTENEDOR DEL CARRUSEL */}
      <Box 
        ref={scrollRef} 
        sx={{ 
          display: 'flex', 
          gap: 3, 
          overflowX: 'auto', 
          px: { xs: 2, md: 8 },
          pb: 4,
          scrollBehavior: 'smooth', 
          '&::-webkit-scrollbar': { display: 'none' } 
        }}
      >
        {loading ? (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress color="inherit" size={30} />
          </Box>
        ) : (
          products.map((product) => (
            <Box 
              key={product.id} 
              component={motion.div}
              whileHover={{ y: -5 }}
              sx={{ minWidth: { xs: '250px', md: '320px' } }}
            >
              {/* YA NO PASAMOS onAddToCart PORQUE LA CARD 
                  LO MANEJA INTERNAMENTE CON EL BOTÓN DE BOLSA */}
              <ProductCard product={product} />
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}