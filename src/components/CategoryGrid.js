import { supabase } from '../../lib/supabaseClient';
import PromotionalCarousel from './PromotionalCarousel';

const OFERTAS_IMG = supabase.storage.from('imagenes').getPublicUrl('Main_Slog/OFERTAS.jpg').data.publicUrl;

const SLIDES = [
  {
    id: 'ofertas-y-coleccion',
    items: [
      { id: 'ofertas', titulo: 'OFERTAS', img: OFERTAS_IMG, path: '/ofertas' },
      { id: 'ver-todo', titulo: 'VER TODO', img: '/images/Marca_Karl.jpg', path: '/productos/todos' },
    ],
  },
  {
    id: 'nueva-coleccion',
    items: [{ id: 'nueva-coleccion', titulo: 'NUEVA COLECCIÓN', img: '/images/Marca_EA.jpg', path: '/productos/todos' }],
  },
  {
    id: 'trabaja-con-nosotros',
    items: [{ id: 'trabaja-con-nosotros', titulo: 'TRABAJA CON NOSOTROS', img: '/images/Marca_COACH.jpg' }],
  },
];

export default function CategoryGrid() {
  return <PromotionalCarousel slides={SLIDES} />;
}
