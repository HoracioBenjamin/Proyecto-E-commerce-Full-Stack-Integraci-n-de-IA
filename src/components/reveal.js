"use client";
import { motion } from "framer-motion";

export const Reveal = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 75 }} // Empieza invisible y 75px abajo
      whileInView={{ opacity: 1, y: 0 }} // Cuando el usuario llega con el scroll
      viewport={{ once: true }} // Solo se anima una vez
      transition={{ 
        duration: 1.2, 
        ease: [0.17, 0.67, 0.83, 0.67] // Curva de lujo (Bezier)
      }}
    >
      {children}
    </motion.div>
  );
};