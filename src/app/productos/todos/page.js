"use client";
import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Pagination, Stack, IconButton, Badge, CircularProgress } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../components/context/CartContext'; 
import ProductCard from '../../../components/categoria/productcard'; 
import { supabase } from '../../../../lib/supabaseClient';

export default function VerTodoPage() {
  const router = useRouter();
  const { cart, toggleCart } = useCart();
  
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const tituloPagina = "COLECCIÓN COMPLETA";

  useEffect(() => {
    const fetchTodosLosProductos = async () => {
      setLoading(true);
      try {
        // CAMBIO CRÍTICO: Incluimos el stock (*) en la consulta
        // para que el AddToCartButton sepa cuántas unidades hay.
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            stock (*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProductos(data || []);
      } catch (err) {
        console.error("Error cargando productos:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodosLosProductos();
  }, []);

  return (
    <Box component="main" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 }, bgcolor: '#ffffff' }}>
      <Container maxWidth="lg"> 
        
        {/* CABECERA (DISEÑO ORIGINAL) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <IconButton onClick={() => router.back()} sx={{ color: '#002855' }}>
            <ArrowBackIosNewIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
          
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              color: '#002855',
              letterSpacing: '4px', 
              textTransform: 'uppercase', 
              textAlign: 'center', 
              flexGrow: 1,
              fontSize: { xs: '1rem', md: '1.5rem' }
            }}
          >
            {tituloPagina}
          </Typography>

          <IconButton onClick={() => toggleCart(true)} sx={{ color: '#002855' }}>
            <Badge 
              badgeContent={cart.length} 
              sx={{ '& .MuiBadge-badge': { bgcolor: '#FFB800', color: '#002855', fontSize: '0.65rem', fontWeight: 700 } }}
            >
              <ShoppingBagOutlinedIcon sx={{ fontSize: '1.4rem' }} />
            </Badge>
          </IconButton>
        </Box>

        {/* REJILLA DE PRODUCTOS */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress color="inherit" size={30} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
            {productos.length > 0 ? (
              productos.map((prod) => (
                <Box key={prod.id} sx={{ width: { xs: '50%', md: '25%' }, p: 1 }}>
                  {/* CAMBIO AQUÍ: Ya no pasamos onAddToCart manualmente.
                    El ProductCard ahora usa internamente el AddToCartButton inteligente 
                    que configuramos con e.stopPropagation().
                  */}
                  <ProductCard product={prod} />
                </Box>
              ))
            ) : (
              <Typography sx={{ width: '100%', textAlign: 'center', mt: 4, color: 'gray', fontFamily: 'serif' }}>
                No hay productos disponibles por el momento.
              </Typography>
            )}
          </Box>
        )}

        {/* PAGINACIÓN CON ESTILO LIQUID GLASS */}
        <Stack alignItems="center" sx={{ mt: 10, mb: 4 }}>
          <Pagination 
            count={1} 
            shape="rounded" 
            sx={paginationStyles} 
          />
        </Stack>
      </Container>
    </Box>
  );
}

const paginationStyles = {
  '& .MuiPagination-ul': {
    bgcolor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: '50px',
    p: 1,
    border: '1px solid rgba(0, 0, 0, 0.05)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
  },
  '& .MuiPaginationItem-root': {
    color: '#333',
    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' },
    '&.Mui-selected': { bgcolor: 'rgba(0, 0, 0, 0.08)', fontWeight: 'bold' }
  }
};