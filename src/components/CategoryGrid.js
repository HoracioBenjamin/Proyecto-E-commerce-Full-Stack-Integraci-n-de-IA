import React from "react";
import { Box, Typography, ButtonBase } from "@mui/material";
import Link from 'next/link';

const SECCIONES = [
  // Añadimos el path correspondiente a cada sección
  { id: 1, titulo: "OFERTAS", img: "/images/Marca_LV.jpg", path: "/ofertas" },
  { id: 2, titulo: "VER TODO", img: "/images/Marca_Karl.jpg", path: "/productos/todos" },
];

export default function CategoryGrid() {
  return (
    <Box
      sx={{
        width: "100%",
        height: { xs: "350px", md: "600px" },
        display: "flex",
      }}
    >
      {SECCIONES.map((item, index) => (
        <Box
          key={item.id}
          sx={{
            width: "50%",
            position: "relative",
            borderRight: index === 0 ? "2px solid white" : "none",
          }}
        >
          {/* Envolvemos el ButtonBase con Link */}
          <Link href={item.path} passHref style={{ textDecoration: 'none', width: '100%', height: '100%' }}>
            <ButtonBase
              sx={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                // Agregamos un efecto de hover suave para mejorar la UX
                '&:hover img': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Box
                component="img"
                src={item.img}
                alt={item.titulo}
                sx={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: 'transform 0.6s ease-in-out', // Suaviza el zoom
                }}
              />
              
              {/* Overlay oscuro para legibilidad */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  inset: 0, 
                  bgcolor: 'rgba(0,0,0,0.3)', 
                  zIndex: 1 
                }} 
              />

              <Typography 
                variant="h3" 
                sx={{ 
                  color: '#fff', 
                  zIndex: 2, 
                  fontFamily: 'serif', 
                  fontWeight: 600,
                  fontSize: { xs: '1.5rem', md: '3.5rem' },
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase'
                }}
              >
                {item.titulo}
              </Typography>
            </ButtonBase>
          </Link>
        </Box>
      ))}
    </Box>
  );
}