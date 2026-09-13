"use client";
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export default function GoldMarquee() {
  return (
    <Box sx={{ backgroundColor: '#002855', borderTop: '2px solid #FFB800', borderBottom: '2px solid #FFB800' }}>
      <Box sx={{ paddingTop: 2, paddingBottom: 2, overflow: 'hidden' }}>
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          style={{ display: 'flex', gap: '60px', width: 'max-content' }}
        >
          {[...Array(10)].map((_, i) => (
            <Typography
              key={i}
              variant="h2"
              sx={{
                fontWeight: 800,
                whiteSpace: 'nowrap',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: { xs: '2.5rem', md: '4rem' },
                display: 'flex',
                alignItems: 'center',
                // Sombra sutil para dar relieve al "vidrio"
                filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))',
              }}
            >
              {/* Acento Vivo izquierdo */}
              <span style={{ WebkitTextFillColor: '#FFB800', background: 'none' }}>◆</span>

              {/* TEXTO CON EFECTO SHIMMER VIVO */}
              <span
                style={{
                  margin: '0 20px',
                  background: `linear-gradient(
                    110deg, 
                    #FFB800 0%, 
                    #ffffff 25%, 
                    #FFB800 50%, 
                    #ffffff 75%, 
                    #FFB800 100%
                  )`,
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 5s linear infinite',
                }}
              >
                WEARSHOP - URBANO - SKATE - RUNNING - EDICIÓN ESPECIAL -  
              </span>

              {/* Acento Vivo derecho */}
              <span style={{ WebkitTextFillColor: '#FFB800', background: 'none' }}>◆</span>

              <style jsx global>{`
                @keyframes shimmer {
                  0% { background-position: 200% center; }
                  100% { background-position: 0% center; }
                }
              `}</style>
            </Typography>
          ))}
        </motion.div>
      </Box>
    </Box>
  );
}