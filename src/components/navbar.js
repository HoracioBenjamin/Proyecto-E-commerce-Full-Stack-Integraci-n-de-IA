"use client";
import * as React from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Box, Badge, InputBase, 
  Menu, MenuItem, Divider 
} from '@mui/material';
import { Menu as MenuIcon, Search as SearchIcon, PersonOutline as PersonOutlineIcon } from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { useCart } from '../components/context/CartContext'; 
import MenuDrawer from './MenuDrawer'; 
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';

// ⚠️ IMPORTA TU CLIENTE DE SUPABASE (Ajusta la ruta según la ubicación de este archivo)
import { supabase } from '../../lib/supabaseClient'; 

export default function GucciNavbar() {
  const { cart, toggleCart } = useCart();
  const [openMenu, setOpenMenu] = React.useState(false);
  const pathname = usePathname(); 
  
  // ESTADO PARA EL SCROLL
  const [isScrolled, setIsScrolled] = React.useState(false);

  // NUEVOS ESTADOS PARA AUTENTICACIÓN Y EL MENÚ DESPLEGABLE
  const [user, setUser] = React.useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null); // Controla dónde se ancla el menú

  React.useEffect(() => {
    // 1. Detectar scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);

    // 2. Obtener sesión inicial de Supabase
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchSession();

    // 3. Escuchar cambios de autenticación (Login / Logout) en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  // FUNCIONES PARA EL MENÚ DE USUARIO
  const handleOpenUserMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorEl(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleCloseUserMenu();
  };

  // LÓGICA PRINCIPAL: 
  const isHomePage = pathname === '/';
  const showNavElements = !isHomePage || isScrolled;

  return (
    <>
      <AppBar 
        elevation={0} 
        sx={{ 
          position: 'fixed', 
          top: 0,
          width: '100%',
          zIndex: 1100,
          backgroundColor: '#002855',
          backdropFilter: 'blur(20px)', 
          webkitBackdropFilter: 'blur(20px)',
          color: '#fff', 
          borderBottom: '2px solid #FFB800',
          transition: 'all 0.3s ease-in-out', 
        }}
      >
        <Toolbar sx={{ height: { xs: '60px', md: '80px' }, px: 2, display: 'flex' }}>
          
          {/* 1. LADO IZQUIERDO */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: { xs: 0.5, md: 2 } }}>
            <IconButton onClick={() => setOpenMenu(true)} size="large" edge="start" color="inherit">
              <MenuIcon />
            </IconButton>

            {showNavElements && (
              <>
                <Box 
                  sx={{ 
                    display: { xs: 'none', md: 'flex' }, 
                    alignItems: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    px: 2,
                    py: 0.5,
                    borderRadius: '20px',
                    width: '240px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'opacity 0.3s ease',
                    animation: isHomePage ? 'fadeIn 0.3s ease-in-out' : 'none'
                  }}
                >
                  <SearchIcon sx={{ fontSize: '1.2rem', mr: 1, color: 'rgba(255,255,255,0.6)' }} />
                  <InputBase
                    placeholder="Buscar modelo, marca, talla..."
                    sx={{ color: 'inherit', fontSize: '0.85rem', width: '100%', '& .MuiInputBase-input': { padding: 0 } }}
                  />
                </Box>

                <IconButton color="inherit" sx={{ display: { xs: 'flex', md: 'none' }, animation: isHomePage ? 'fadeIn 0.3s ease-in-out' : 'none' }}>
                  <SearchIcon />
                </IconButton>
              </>
            )}
          </Box>

          {/* 2. CENTRO: Logo */}
          <Box sx={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
              <Box
                component="img"
                src="/images/logo-shoesduoc.svg"
                alt="ShoesDuoc — WearShop"
                sx={{ height: { xs: 30, md: 40 }, width: 'auto', display: 'block' }}
              />
            </Link>
          </Box>

          {/* 3. LADO DERECHO: Perfil + Carrito */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
            
            {/* LÓGICA DE USUARIO: Condicional según si está conectado o no */}
            {user ? (
              <>
                <IconButton size="large" color="inherit" onClick={handleOpenUserMenu}>
                  {/* Badge con puntito verde abajo a la derecha */}
                  <Badge 
                    color="success" 
                    variant="dot" 
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  >
                    <PersonOutlineIcon />
                  </Badge>
                </IconButton>

                {/* Menú Desplegable del Usuario */}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleCloseUserMenu}
                  // Estilos para que el menú aparezca justo debajo del icono
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    elevation: 3,
                    sx: { mt: 1.5, minWidth: '180px', borderRadius: '8px' }
                  }}
                >
                  {/* Mostrar el correo del usuario a modo de información */}
                  <MenuItem disabled sx={{ opacity: '1 !important', pb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {user.email}
                    </Typography>
                  </MenuItem>
                  
                  <Divider sx={{ my: '0 !important' }} />
                  
                  <MenuItem onClick={handleCloseUserMenu} sx={{ py: 1.5, fontSize: '0.9rem' }}>
                    Mi Perfil
                  </MenuItem>
                  <MenuItem onClick={handleCloseUserMenu} sx={{ py: 1.5, fontSize: '0.9rem' }}>
                    Mis Pedidos
                  </MenuItem>
                  
                  <Divider sx={{ my: '0 !important' }} />
                  
                  <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#d32f2f', fontSize: '0.9rem', fontWeight: 500 }}>
                    Cerrar Sesión
                  </MenuItem>
                </Menu>
              </>
            ) : (
              /* Usuario NO conectado: Redirigir al login */
              <IconButton size="large" color="inherit" component={Link} href="/login">
                <PersonOutlineIcon />
              </IconButton>
            )}

            {/* CARRITO */}
            {showNavElements && (
              <IconButton 
                size="large" 
                color="inherit" 
                onClick={() => toggleCart(true)}
                sx={{ animation: isHomePage ? 'fadeIn 0.3s ease-in-out' : 'none' }}
              >
                <Badge 
                  badgeContent={cart.length} 
                  color="primary" 
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', bgcolor: '#FFB800', color: '#002855', fontWeight: 700 } }}
                >
                  <ShoppingBagOutlinedIcon />
                </Badge>
              </IconButton>
            )}
          </Box>

        </Toolbar>
      </AppBar>

      {/* Menú Lateral */}
      <MenuDrawer open={openMenu} onClose={() => setOpenMenu(false)} />
      
      {/* Espaciador */}
      <Toolbar sx={{ height: { xs: '60px', md: '80px' } }} />
    </>
  );
}