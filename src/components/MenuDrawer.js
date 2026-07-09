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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Typography variant="h5" sx={{ letterSpacing: '0.3em', mb: 4, letterSpacing: '0.2em', textAlign: 'center' }}>
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
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.03)' }
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