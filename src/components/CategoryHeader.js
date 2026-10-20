"use client";
import React from 'react';
import { 
  Box, Container, InputBase, IconButton, Stack, Badge 
} from '@mui/material';
import { 
  Search as SearchIcon
} from '@mui/icons-material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'; // Nuevo Import
import { useCart } from '../components/context/CartContext'; // Importamos el contexto del carrito
import { styled, alpha } from '@mui/material/styles';

const NAV_OPTIONS = ['Categorías', 'Marcas', 'Ofertas', 'Otros'];

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '25px', 
  backgroundColor: alpha(theme.palette.common.white, 0.08),
  '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.12) },
  width: '100%',
  border: '1px solid rgba(255,255,255,0.1)',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,0.4)'
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 1, 1.5, 0), 
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    fontSize: '0.9rem',
  },
}));

export default function BalancedHeader({ activeTab, setActiveTab }) {
  // Traemos los datos y la acción del carrito
  const { cart, toggleCart } = useCart();

  return (
    <Box 
      sx={{ 
        bgcolor: '#002855', 
        color: '#fff', 
        py: 2, 
        borderBottom: '2px solid #FFB800' 
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" spacing={5} alignItems="center">
          
          {/* LADO IZQUIERDO: Buscador */}
          <Box sx={{ flex: 1}}>
            <Search>
              <SearchIconWrapper><SearchIcon /></SearchIconWrapper>
              <StyledInputBase placeholder="Buscar modelo, marca, talla..." />
            </Search>
          </Box>

          {/* LADO DERECHO: Navegación + Bolsa de Compras */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Stack direction="row" spacing={{ sm: 2, md: 5 }} alignItems="center">
              
              {/* Opciones de Navegación */}
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: { sm: 2, md: 4 } }}>
                {NAV_OPTIONS.map((item) => (
                  <Box
                    key={item}
                    component="button"
                    onClick={() => setActiveTab(item)}
                    sx={{
                      background: 'none',
                      border: 'none',
                      color: activeTab === item ? '#FFB800' : 'rgba(255,255,255,0.65)',
                      cursor: 'pointer',
                      fontFamily: 'serif',
                      fontSize: '0.95rem',
                      whiteSpace: 'nowrap',
                      letterSpacing: 1,
                      transition: 'color 0.3s ease, transform 0.15s ease',
                      position: 'relative',
                      '&:hover': { color: '#FFB800', transform: 'translateY(-2px)' },
                      '&:active': { transform: 'translateY(0) scale(0.95)' },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -5,
                        left: 0,
                        width: activeTab === item ? '100%' : '0%',
                        height: '2px',
                        bgcolor: '#FFB800',
                        transition: 'width 0.3s'
                      }
                    }}
                  >
                    {item}
                  </Box>
                ))}
              </Box>

              {/* CAMBIO: Botón de Bolsa de Compras con Badge integrado */}
              <IconButton 
                onClick={() => toggleCart(true)} // Al hacer clic abre el carrito lateral
                sx={{ 
                  color: '#fff', 
                  bgcolor: 'rgba(255,255,255,0.05)',
                  p: 1.2,
                  transition: 'transform 0.15s ease, background-color 0.2s ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', transform: 'scale(1.1)' },
                  '&:active': { transform: 'scale(0.9)' }
                }}
              >
                <Badge 
                  badgeContent={cart.length} 
                  color="primary"
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.65rem', 
                      bgcolor: '#FFB800', 
                      color: '#002855',
                      fontWeight: 700
                    } 
                  }}
                >
                  <ShoppingBagOutlinedIcon />
                </Badge>
              </IconButton>
              
            </Stack>
          </Box>

        </Stack>
      </Container>
    </Box>
  );
}