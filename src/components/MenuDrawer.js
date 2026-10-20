"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Drawer, Box, IconButton, InputBase, List, ListItemButton, ListItemText, Collapse, Typography } from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, Search as SearchIcon } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';

const SECTIONS = [
  { label: 'Hombre', path: '/productos/hombre' },
  { label: 'Mujer', path: '/productos/mujer' },
  { label: 'Unisex', path: '/productos/unisex' },
];

const MARCAS_FALLBACK = [
  { nombre: 'Nike', slug: 'nike' },
  { nombre: 'Adidas', slug: 'adidas' },
  { nombre: 'Puma', slug: 'puma' },
  { nombre: 'New Balance', slug: 'new-balance' },
];

export default function MenuDrawer({ open, onClose }) {
  const [expanded, setExpanded] = useState(null);
  const [marcas, setMarcas] = useState(MARCAS_FALLBACK);

  useEffect(() => {
    const fetchMarcas = async () => {
      const { data, error } = await supabase
        .from('marcas')
        .select('id, nombre, slug')
        .order('nombre');
      if (!error && data && data.length > 0) {
        setMarcas(data);
      }
    };
    fetchMarcas();
  }, []);

  const toggle = (label) => {
    setExpanded((prev) => (prev === label ? null : label));
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '80%', md: '33vw' },
          backgroundColor: '#fff',
          p: 4,
          pt: 2,
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton aria-label="Cerrar menú" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        role="search"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 2, px: 2, py: 1, borderRadius: '25px', bgcolor: 'rgba(0,40,85,0.05)', border: '1px solid rgba(0,40,85,0.15)', color: '#002855' }}
      >
        <SearchIcon sx={{ fontSize: '1.2rem', flexShrink: 0 }} />
        <InputBase
          placeholder="Buscar modelo, marca, talla..."
          inputProps={{ 'aria-label': 'Buscar modelo, marca o talla' }}
          sx={{ color: 'inherit', fontSize: '0.85rem', width: '100%', minWidth: 0 }}
        />
      </Box>

      <List sx={{ pt: 1 }}>
        {SECTIONS.map((section) => {
          const isOpen = expanded === section.label;
          return (
            <Box key={section.label}>
              <ListItemButton
                onClick={() => toggle(section.label)}
                sx={{
                  py: 2,
                  color: '#002855',
                  borderBottom: '1px solid #eee',
                  '&:hover': { backgroundColor: 'rgba(0,40,85,0.05)' }
                }}
              >
                <ListItemText
                  primary={section.label}
                  primaryTypographyProps={{ fontSize: '1.1rem', fontWeight: 600 }}
                />
                <ExpandMoreIcon
                  sx={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    color: '#002855'
                  }}
                />
              </ListItemButton>
              <Collapse in={isOpen} timeout={250} unmountOnExit>
                <Box sx={{ pl: 2, pr: 1, pb: 2, pt: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: 'gray', fontSize: '0.7rem' }}
                  >
                    Marcas
                  </Typography>
                  <List disablePadding sx={{ mt: 1 }}>
                    {marcas.map((marca) => (
                      <ListItemButton
                        key={marca.slug || marca.nombre}
                        component={Link}
                        href={`${section.path}?marca=${marca.slug || marca.nombre.toLowerCase()}`}
                        onClick={onClose}
                        sx={{ py: 1.2, color: '#002855', '&:hover': { backgroundColor: 'rgba(0,40,85,0.05)' } }}
                      >
                        <ListItemText
                          primary={marca.nombre}
                          primaryTypographyProps={{ fontSize: '0.95rem' }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Drawer>
  );
}
