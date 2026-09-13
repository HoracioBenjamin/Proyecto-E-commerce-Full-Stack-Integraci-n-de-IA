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
  title: "WearShop | ShoesDuoc",
  description: "WearShop — E-Commerce & Retail Analytics | Duoc UC Sede Puente Alto",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/apple-touch-icon.png",
  },
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

