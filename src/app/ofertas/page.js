"use client";
import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Stack, Pagination, IconButton, Badge, CircularProgress } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useRouter } from 'next/navigation';
import { useCart } from '../../components/context/CartContext';
import ProductCard from '../../components/categoria/productcard'; 
import { supabase } from '../../../lib/supabaseClient';

export default function OfertasPage() {
  const router = useRouter();
  const { cart, toggleCart } = useCart();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfertas = async () => {
      setLoading(true);
      try {
        // Consultamos productos donde en_oferta sea verdadero
        // IMPORTANTE: Traemos el stock (*) para que el botón funcione
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            stock (*)
          `)
          .eq('en_oferta', true);

        if (error) throw error;
        setProductos(data || []);
      } catch (err) {
        console.error("Error cargando ofertas:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOfertas();
  }, []);

  return (
    <Box component="main" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 }, bgcolor: '#ffffff' }}>
      <Container maxWidth="lg">
        
        {/* ENCABEZADO */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <IconButton onClick={() => router.back()} sx={{ color: 'black' }}>
            <ArrowBackIosNewIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>

          <Typography 
            variant="h5" 
            sx={{ 
              fontFamily: 'serif', 
              fontWeight: 300, 
              letterSpacing: '4px', 
              textTransform: 'uppercase', 
              textAlign: 'center', 
              flexGrow: 1,
              fontSize: { xs: '1rem', md: '1.5rem' }
            }}
          >
            OFERTAS EXCLUSIVAS
          </Typography>

          <IconButton onClick={() => toggleCart(true)} sx={{ color: 'black' }}>
            <Badge 
              badgeContent={cart.length} 
              sx={{ 
                '& .MuiBadge-badge': { 
                  bgcolor: 'black', 
                  color: 'white',
                  fontSize: '0.65rem'
                } 
              }}
            >
              <ShoppingBagOutlinedIcon sx={{ fontSize: '1.4rem' }} />
            </Badge>
          </IconButton>
        </Box>

        {/* REJILLA DE PRODUCTOS EN OFERTA */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress color="inherit" size={30} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
            {productos.length > 0 ? (
                productos.map((prod) => (
                  <Box key={prod.id} sx={{ width: { xs: '50%', md: '25%' }, p: 1 }}>
                    {/* El ProductCard ya contiene el AddToCartButton con su propia lógica */}
                    <ProductCard product={prod} />
                  </Box>
                ))
            ) : (
              <Typography sx={{ width: '100%', textAlign: 'center', mt: 4, color: 'gray', fontFamily: 'serif' }}>
                No hay ofertas disponibles en este momento.
              </Typography>
            )}
          </Box>
        )}

        {/* PAGINACIÓN LIQUID GLASS */}
        <Stack alignItems="center" sx={{ mt: 10, mb: 4 }}>
          <Pagination 
            count={1} 
            shape="rounded" 
            sx={{
              '& .MuiPagination-ul': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '50px',
                p: 1,
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
              },
              '& .MuiPaginationItem-root': {
                color: '#333',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' },
                '&.Mui-selected': { bgcolor: 'rgba(0, 0, 0, 0.08)', fontWeight: 'bold' }
              }
            }}
          />
        </Stack>
      </Container>
    </Box>
  );
}