"use client";
import React from 'react';
import { Drawer, Box, Typography, IconButton, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function MenuDrawer({ open, onClose }) {
  const menuItems = ['Usuario', 'Iniciar Sesion', 'Ver Pedido', 'Ver compras', 'Realizar Devolucion'];

  return (
    <Drawer 
      anchor="left" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '80%', md: '33vw' },
          backgroundColor: '#fff',
          p: 4
        }
      }}
    >
      {/* Botón para cerrar */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box
          component="img"
          src="/images/logo-shoesduoc-navy.svg"
          alt="ShoesDuoc — WearShop"
          sx={{ height: 36, width: 'auto' }}
        />
      </Box>
      <Typography variant="h5" sx={{ letterSpacing: '0.2em', mb: 4, textAlign: 'center', color: '#002855', fontWeight: 700 }}>
        Cuenta
      </Typography>

      <List>
        {menuItems.map((text) => (
          <ListItem key={text} disablePadding>
            <ListItemButton 
              onClick={onClose}
              sx={{ 
                py: 2, 
                textAlign: 'center',
                color: '#002855',
                '&:hover': { backgroundColor: 'rgba(0,40,85,0.05)' }
              }}
            >
              <ListItemText 
                primary={text} 
                primaryTypographyProps={{ 
                  
                  fontSize: '1.1rem'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}