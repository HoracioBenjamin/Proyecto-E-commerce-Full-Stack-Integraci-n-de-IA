"use client";
import React from 'react';
import { Box, Typography, ButtonBase, Stack } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import AddToCartButton from '../AddToCartButton';

export default function ProductCard({ product }) {
  const router = useRouter();
  const params = useParams();

  // Extraemos los datos de Supabase
  const { 
    id, 
    nombre, 
    precio, 
    imagen_url, 
    en_oferta, 
    precio_oferta 
  } = product;

  const handleNavigate = () => {
    // Priorizamos la categoría del producto si viene de Supabase, sino usamos el param o default
    const categoria = product.categorias?.slug || params.categoria || 'coleccion';
    router.push(`/productos/${categoria}/${id}`);
  };

  // Formateador de moneda para Chile (CLP)
  const formatPrice = (val) => 
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  // Buscamos la primera talla disponible en el array de stock
  const primeraTallaDisponible = product.stock?.find(s => s.cantidad > 0)?.talla;

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <ButtonBase 
        onClick={handleNavigate}
        component="div"
        sx={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          textAlign: 'left',
          borderRadius: '4px',
          overflow: 'hidden',
          // Activa el hover del botón que vive dentro
          '&:hover .add-button': { opacity: 1, transform: 'scale(1)' } 
        }}
      >
        <Box 
          sx={{ 
            width: '100%', 
            height: { xs: '220px', sm: '280px', md: '380px' }, 
            backgroundColor: '#f6f6f6', 
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #eee'
          }}
        >
          {/* BADGE DE OFERTA */}
          {en_oferta && (
            <Box sx={{
              position: 'absolute', top: 10, left: 10,
              bgcolor: '#d32f2f', color: 'white',
              px: 2.5, py: 0.5, zIndex: 2,
              fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '1px'
            }}>
              OFERTA
            </Box>
          )}

          <Box
            component="img"
            src={imagen_url}
            alt={nombre}
            sx={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.8s ease',
              '&:hover': { transform: 'scale(1.05)' }
            }}
          />

          {/* CONTENEDOR DEL BOTÓN: 
              Lo aislamos con un zIndex superior para que el clic no sea capturado por ButtonBase
          */}
          <Box sx={{ position: 'absolute', bottom: 0, right: 0, zIndex: 10 }}>
            <AddToCartButton 
              producto={product} 
              tallaSeleccionada={primeraTallaDisponible} 
            />
          </Box>
        </Box>
        
        <Box sx={{ mt: 1.5, mb: 2, textAlign: 'center', width: '100%' }}>
          <Typography sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '0.75rem', md: '0.85rem' }, 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            mb: 0.5
          }}>
            {nombre}
          </Typography>

          {en_oferta ? (
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Typography sx={{ color: '#d32f2f', fontWeight: 700, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                {formatPrice(precio_oferta)}
              </Typography>
              <Typography sx={{ color: 'text.secondary', textDecoration: 'line-through', fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                {formatPrice(precio)}
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.85rem', md: '1rem' }, fontWeight: 500 }}>
              {formatPrice(precio)}
            </Typography>
          )}
        </Box>
      </ButtonBase>
    </Box>
  );
}