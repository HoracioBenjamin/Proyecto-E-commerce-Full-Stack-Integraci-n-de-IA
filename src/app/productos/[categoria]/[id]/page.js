"use client";
import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Button, Stack, 
  Divider, Rating, Avatar, IconButton, CircularProgress 
} from '@mui/material';
import { ShoppingBagOutlined } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '../../../../components/context/CartContext';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { supabase } from '../../../../../lib/supabaseClient';
import { Dialog, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';


const NAVY_MAIN = '#001f3f';
const NAVY_HOVER = '#003366';
const NAVY_LIGHT = '#e6ebf0';

export default function ProductoDetalle() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [producto, setProducto] = useState(null);
  const [tallasDisponibles, setTallasDisponibles] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [openModal, setOpenModal] = useState(false);
  const handleToggleModal = () => setOpenModal(!openModal);

  useEffect(() => {
    const fetchProductoDetalle = async () => {
      setLoading(true);
      try {
        // 1. Consulta con JOIN a la tabla 'marcas'
        // Asumiendo que en tu tabla 'productos' la columna se llama 'marca_id'
        const { data: prodData, error: prodError } = await supabase
          .from('productos')
          .select('*, marcas(*)') // Esto trae todos los campos de producto y los de su marca asociada
          .eq('id', id)
          .single();

        if (prodError) throw prodError;

        // 2. Traer tallas con stock
        const { data: stockData, error: stockError } = await supabase
          .from('stock')
          .select('talla, cantidad')
          .eq('producto_id', id)
          .gt('cantidad', 0); 

        if (stockError) throw stockError;

        setProducto(prodData);
        setTallasDisponibles(stockData.map(s => s.talla));
        if (stockData.length > 0) setSelectedSize(stockData[0].talla);
        
      } catch (err) {
        console.error("Error cargando detalles:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductoDetalle();
  }, [id]);

  const handleAdd = () => {
    if (!selectedSize) return alert("Por favor selecciona una talla");
    addToCart({
      id: producto.id,
      name: producto.nombre,
      price: producto.en_oferta ? producto.precio_oferta : producto.precio,
      img: producto.imagen_url,
      size: selectedSize
    });
  };

  const handleDirectBuy = () => {
    if (!selectedSize) return alert("Por favor selecciona una talla");
    addToCart({
      id: producto.id,
      name: producto.nombre,
      price: producto.en_oferta ? producto.precio_oferta : producto.precio,
      img: producto.imagen_url,
      size: selectedSize
    }, false);
    router.push('/checkout');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: NAVY_MAIN }} />
      </Box>
    );
  }

  if (!producto) return <Typography sx={{ textAlign: 'center', mt: 10, color: NAVY_MAIN }}>Producto no encontrado.</Typography>;

  const formatPrice = (val) => `$${val?.toLocaleString('es-CL')}`;

return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh', pt: { xs: 0, md: 6 }, pb: 10 }}>
      <Container maxWidth="lg">
        <Grid 
          container 
          spacing={{ xs: 0, md: 8 }} 
          alignItems="flex-start"
          sx={{ flexWrap: { md: 'nowrap' }, display: 'flex' }}
        >
          {/* COLUMNA IZQUIERDA: IMAGEN */}
          <Grid item xs={12} md={6} sx={{ width: '100%', maxWidth: { md: '50%' }, flexBasis: { md: '50%' } }}>
            <Box 
              onClick={handleToggleModal} // <-- Abrir al hacer click
              sx={{ 
                width: '100%', 
                height: { xs: '450px', md: '650px' }, 
                borderRadius: { xs: 0, md: '12px' }, 
                overflow: 'hidden',
                boxShadow: { md: '0 12px 40px rgba(0,31,63,0.12)' },
                position: 'relative',
                cursor: 'zoom-in', // Cambio de cursor para indicar que es clickeable
                bgcolor: '#f4f4f4'
              }}
            >
              <Box 
                component="img" 
                src={producto.imagen_url} 
                alt={producto.nombre}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
              />
            </Box>
          </Grid>

          {/* COLUMNA DERECHA: DATOS (Siempre a la derecha en PC) */}
          <Grid item xs={12} md={6} sx={{ 
            width: '100%',
            maxWidth: { md: '50%' }, 
            flexBasis: { md: '50%' } 
          }}>
            {/* El sticky hará que los datos bajen contigo si la imagen es muy larga */}
            <Box sx={{ position: { md: 'sticky' }, top: 60, p: { xs: 3, md: 0 } }}>
              
              {/* SECCIÓN DE LA MARCA */}
              {producto.marcas && (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Box 
                    component="img"
                    src={producto.marcas.logo_url} 
                    alt={producto.marcas.nombre}
                    sx={{ 
                      width: 50, height: 50, objectFit: 'contain',
                      border: `1px solid ${NAVY_LIGHT}`, borderRadius: '50%',
                      bgcolor: 'white', p: 0.5
                    }} 
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: NAVY_MAIN, letterSpacing: 1.5 }}>
                    {producto.marcas.nombre.toUpperCase()}
                  </Typography>
                </Stack>
              )}

              <Typography variant="h3" sx={{ 
                fontFamily: 'serif', mb: 2, fontWeight: 500, 
                textTransform: 'uppercase', color: NAVY_MAIN,
                fontSize: { xs: '1.8rem', md: '2.8rem' }, lineHeight: 1.2
              }}>
                {producto.nombre}
              </Typography>

              {/* PRECIO */}
              <Stack direction="row" spacing={2} alignItems="baseline" sx={{ mb: 4 }}>
                {producto.en_oferta ? (
                  <>
                    <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 700 }}>
                      {formatPrice(producto.precio_oferta)}
                    </Typography>
                    <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'gray', fontWeight: 300 }}>
                      {formatPrice(producto.precio)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 500, color: NAVY_MAIN }}>
                    {formatPrice(producto.precio)}
                  </Typography>
                )}
              </Stack>
              
              <Divider sx={{ mb: 4, borderColor: NAVY_LIGHT }} />
              
              <Typography variant="body1" sx={{ color: '#444', mb: 5, lineHeight: 1.8, fontSize: '1.1rem' }}>
                {producto.descripcion}
              </Typography>

              {/* SELECCIÓN DE TALLA */}
              <Box sx={{ mb: 6 }}>
                <Typography variant="caption" sx={{ mb: 2, display: 'block', fontWeight: 800, letterSpacing: 2, color: NAVY_MAIN }}>
                  TALLAS DISPONIBLES
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                  {tallasDisponibles.map((t) => (
                    <Button
                      key={t}
                      onClick={() => setSelectedSize(t)}
                      sx={{
                        minWidth: '55px', height: '55px', borderRadius: '50%',
                        border: '1px solid',
                        borderColor: selectedSize === t ? NAVY_MAIN : '#eee',
                        bgcolor: selectedSize === t ? NAVY_MAIN : 'transparent',
                        color: selectedSize === t ? 'white' : NAVY_MAIN,
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: selectedSize === t ? NAVY_MAIN : NAVY_LIGHT }
                      }}
                    >
                      {t}
                    </Button>
                  ))}
                </Stack>
              </Box>

              {/* BOTONES DE COMPRA */}
              <Stack spacing={2}>
                <Button 
                  fullWidth variant="contained" onClick={handleDirectBuy}
                  disabled={tallasDisponibles.length === 0}
                  sx={{ 
                    bgcolor: NAVY_MAIN, color: 'white', py: 2.5, borderRadius: '4px', 
                    fontWeight: 'bold', fontSize: '1rem', '&:hover': { bgcolor: NAVY_HOVER } 
                  }}
                >
                  COMPRAR AHORA
                </Button>
                <Button 
                  fullWidth variant="outlined" onClick={handleAdd}
                  disabled={tallasDisponibles.length === 0}
                  startIcon={<ShoppingBagOutlined />}
                  sx={{ 
                    borderColor: NAVY_MAIN, color: NAVY_MAIN, py: 2.5, borderRadius: '4px', 
                    fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(0,31,63,0.04)' } 
                  }}
                >
                  AÑADIR A LA BOLSA
                </Button>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Dialog
        open={openModal}
        onClose={handleToggleModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
        BackdropComponent={Backdrop}
        BackdropProps={{
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.9)' } // Fondo oscuro profundo
        }}
      >
        {/* Botón de cerrar (X) */}
        <IconButton
          onClick={handleToggleModal}
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            zIndex: 10
          }}
        >
          <CloseIcon fontSize="large" />
        </IconButton>

        {/* La Imagen en grande */}
        <Box
          component="img"
          src={producto.imagen_url}
          alt={producto.nombre}
          sx={{
            maxWidth: '100%',
            maxHeight: '90vh',
            objectFit: 'contain', // Aquí usamos contain para verla COMPLETA
            borderRadius: '4px'
          }}
        />
      </Dialog>
    </Box>
  );
}