import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ResponsiveAppBar from "../components/navbar";
import MinimalFooter from '../components/footer';
import { Inter } from "next/font/google";
import { CartProvider } from '../components/context/CartContext';
import CartDrawer from '../components/CartDrawer';
import GlobalToast from '../components/NotificationGlobalToast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TuPagina | Sitio Oficial",
  description: "Created by: Horacio Vergara",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <CartProvider>

        {/* 2. Colocamos el Navbar arriba del contenido (children) */}
        <ResponsiveAppBar />
           <CartDrawer />

        {/* El componente <main> contendrá lo que escribas en page.js */}
        <main>
          {children}
        </main>
        <MinimalFooter />
        <GlobalToast />
      </CartProvider>
      </body>
    </html>
  );
}

