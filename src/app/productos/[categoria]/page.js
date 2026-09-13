"use client";
import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Pagination, Stack, IconButton, Badge, CircularProgress } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '../../../components/context/CartContext';
import ProductCard from '../../../components/categoria/productcard'; 
import { supabase } from '../../../../lib/supabaseClient';

export default function CategoriaPage() {
  const params = useParams();
  const router = useRouter();
  const { cart, addToCart, toggleCart } = useCart();

  // Estados para los datos reales
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoriaSlug = params.categoria;
  const categoriaNombre = categoriaSlug 
    ? categoriaSlug.replace(/-/g, ' ').toUpperCase() 
    : "COLECCIÓN";

  // Carga de productos desde Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            categorias!inner (slug),
            stock (*) // <--- ESTO TRAERÁ TODAS LAS TALLAS Y CANTIDADES
          `)
          .eq('categorias.slug', categoriaSlug);

        if (error) throw error;
        setProductos(data || []);
      } catch (err) {
        console.error("Error cargando productos:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (categoriaSlug) fetchProducts();
  }, [categoriaSlug]);

  return (
    <Box component="main" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 }, bgcolor: '#ffffff', position: 'relative' }}>
      <Container maxWidth="lg"> 
        
        {/* NAVEGACIÓN SUPERIOR (MANTENEMOS TU DISEÑO) */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 6, 
          position: 'relative',
          zIndex: 10
        }}>
          <IconButton 
            onClick={() => router.back()} 
            sx={{ color: '#002855', '&:hover': { bgcolor: 'rgba(0,40,85,0.05)' } }}
          >
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
            {categoriaNombre}
          </Typography>

          <IconButton 
            onClick={() => toggleCart(true)} 
            sx={{ color: '#002855', '&:hover': { bgcolor: 'rgba(0,40,85,0.05)' } }}
          >
            <Badge 
              badgeContent={cart.length} 
              sx={{ 
                '& .MuiBadge-badge': { 
                  fontSize: '0.6rem', height: 16, padding: '0 4px',
                  minWidth: 16, bgcolor: '#FFB800', color: '#002855', fontWeight: 700
                } 
              }}
            >
              <ShoppingBagOutlinedIcon sx={{ fontSize: '1.4rem' }} />
            </Badge>
          </IconButton>
        </Box>

        {/* REJILLA DE PRODUCTOS (DINÁMICA) */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress color="inherit" size={30} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
            {productos.length > 0 ? (
                  productos.map((prod) => (
                  <Box key={prod.id} sx={{ width: { xs: '50%', md: '25%' }, p: 1 }}>
                      <ProductCard product={prod} /> 
                    </Box>
                  ))
            ) : (
              <Typography sx={{ width: '100%', textAlign: 'center', mt: 4, color: 'gray' }}>
                No hay productos disponibles en esta categoría.
              </Typography>
            )}
          </Box>
        )}

        {/* PAGINACIÓN CON ESTILO LIQUID GLASS (MANTENEMOS TU DISEÑO) */}
        <Stack alignItems="center" sx={{ mt: 10, mb: 4 }}>
          <Pagination 
            count={1} // Podrás dinamizar esto luego con el total de productos
            shape="rounded" 
            sx={{
              '& .MuiPagination-ul': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '50px',
                p: 1,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
              },
              '& .MuiPaginationItem-root': {
                color: '#002855',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'rgba(0, 40, 85, 0.05)',
                  transform: 'translateY(-2px)',
                },
                '&.Mui-selected': {
                  bgcolor: '#002855',
                  color: '#fff',
                  fontWeight: 'bold',
                }
              }
            }}
          />
        </Stack>
      </Container>
    </Box>
  );
}