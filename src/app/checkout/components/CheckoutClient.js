"use client";
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { ChevronLeft } from '@mui/icons-material';
import { useCart } from '../../../components/context/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';

// Importamos los 3 pasos visuales
import OrderSummary from './OrderSummary';
import ShippingForm from './ShippingForm';
import PaymentMethod from './PaymentMethod';

export default function CheckoutClient() {
  const { cart, total, removeFromCart, updateQuantity, updateSize } = useCart();
  const router = useRouter();
  
  // ESTADOS DE USUARIO Y BASE DE DATOS
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [regionesBD, setRegionesBD] = useState([]); 
  const [comunasBD, setComunasBD] = useState([]);   
  const [comunasFiltradas, setComunasFiltradas] = useState([]); 
  const [emailExiste, setEmailExiste] = useState(false);
  const [perfilVinculado, setPerfilVinculado] = useState(null);

  // ESTADOS PARA CONTROLAR EL FLUJO es decir son variables que solo lo cargan en shipping form o en el component que se desee cargar
  const [step, setStep] = useState(1); 
  const [tipoEnvio, setTipoEnvio] = useState('domicilio'); 
  const [metodoPago, setMetodoPago] = useState('webpay'); 
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', rut: '', email: '', telefono: '', 
    region: '', comuna: '', direccion: '', estacionMetro: ''
  });
//estas variables estan manejando el precio de el envio y presencial que luego lo pasare a supabase
const preciosEnvio = { domicilio: 10, presencial: 10 };
  const costoEnvio = preciosEnvio[tipoEnvio];
  const totalFinal = total + costoEnvio;

  // EFECTOS (Lógica de carga)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single();
        const meta = session.user.user_metadata || {};
        setFormData((prev) => ({
          ...prev,
          nombre: perfil?.nombres || meta?.display_name || meta?.name || '',
          apellido: perfil?.apellidos || '',
          rut: perfil?.rut || '',
          email: session.user.email || '',
          telefono: perfil?.telefono || meta?.phone || ''
        }));
      }
      setLoadingUser(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const fetchUbicaciones = async () => {
      try {
        const { data: regionesData } = await supabase.from('regiones').select('*').order('id', { ascending: true }); 
        const { data: comunasData } = await supabase.from('comunas').select('*').order('nombre', { ascending: true }); 
        setRegionesBD(regionesData || []);
        setComunasBD(comunasData || []);
      } catch (err) {
        console.error("Error cargando datos de ubicación:", err.message);
      }
    };
    fetchUbicaciones();
  }, []);

  // FUNCIONES CONTROLADORAS
  const handleEmailBlur = async () => {
    if (user || !formData.email) return;
    try {
      const { data } = await supabase.from('perfiles').select('id').eq('email', formData.email.trim().toLowerCase()).maybeSingle();
      if (data) { setEmailExiste(true); setPerfilVinculado(data.id); } 
      else { setEmailExiste(false); setPerfilVinculado(null); }
    } catch (err) { console.error(err); }
  };

  const handleRegionChange = (e) => {
    const regionSeleccionada = e.target.value;
    setFormData({ ...formData, region: regionSeleccionada, comuna: '' });
    const filtradas = comunasBD.filter(c => String(c.region_id || c.region) === String(regionSeleccionada));
    setComunasFiltradas(filtradas);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleTipoEnvioChange = (e) => setTipoEnvio(e.target.value);

  const handleSubmitFinal = async () => {
    const finalPerfilId = user ? user.id : (perfilVinculado ? perfilVinculado : null);
    const payloadPedido = {
      perfil_id: finalPerfilId, datos_envio: formData, tipo_envio: tipoEnvio,
      costo_envio: costoEnvio, metodo_pago: metodoPago, productos: cart,
      total_productos: total, total_pagar: totalFinal, metodo_invitado: !user 
    };

    if (metodoPago === 'mercadopago') {
      try {
        const response = await fetch('/api/checkout/mercadopago', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadPedido),
        });
        const data = await response.json();
        if (data.init_point) window.location.href = data.init_point;
        else alert("No se pudo generar el enlace de pago de Mercado Pago.");
      } catch (err) {
        alert("Ocurrió un error de red al intentar procesar tu pago.");
      }
    }
  };

  const formatPrice = (value) => {
    const numero = Number(value);
    return isNaN(numero) ? '$0' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(numero);
  };

  const getStepTitle = () => {
    if (step === 1) return "Finalizar Compra";
    if (step === 2) return "Datos y Envío";
    return "Método de Pago";
  };

  //aca solamente comanezamos a crear las variables para luego ser cargadas en los components, aca simplemente elegimos que cargar de los const
  // o variables creadas arriba, aca cargamos solo lo que queremos mostrar
  return (
    <Box sx={{ bgcolor: '#fbfbfb', minHeight: '100vh', pt: { xs: 2, md: 4 }, pb: 8}}>
      <Container maxWidth="md">
        <Button 
          startIcon={<ChevronLeft />} 
          onClick={() => {
            if (step === 3) setStep(2);
            else if (step === 2) setStep(1);
            else router.back();
          }}
          sx={{ color: 'gray', mb: 2, textTransform: 'none' }}
        >
          {step === 3 ? "Volver a datos de envío" : step === 2 ? "Volver al resumen" : "Volver"}
        </Button>
        
        <Typography variant="h4" sx={{ fontFamily: 'serif', mb: 3, fontWeight: 500 }}>
          {getStepTitle()}
        </Typography>

        {/* RENDERIZADO CONDICIONAL DE LOS COMPONENTES (Los 3 pasos) */}
        {step === 1 && (
          <OrderSummary 
            cart={cart} total={total} formatPrice={formatPrice}
            removeFromCart={removeFromCart} updateQuantity={updateQuantity} 
            updateSize={updateSize} setStep={setStep} router={router}
          />
        )}

        {step === 2 && cart.length > 0 && (
          <ShippingForm 
            user={user} loadingUser={loadingUser} emailExiste={emailExiste}
            formData={formData} handleChange={handleChange} handleEmailBlur={handleEmailBlur}
            regionesBD={regionesBD} comunasFiltradas={comunasFiltradas} handleRegionChange={handleRegionChange}
            tipoEnvio={tipoEnvio} handleTipoEnvioChange={handleTipoEnvioChange}
            totalFinal={totalFinal} formatPrice={formatPrice} setStep={setStep}
            preciosEnvio={preciosEnvio} //aca se pasa el precio de el envio que luego lo pasaremos con supabese
          />
        )}

        {step === 3 && cart.length > 0 && (
          <PaymentMethod 
            metodoPago={metodoPago} setMetodoPago={setMetodoPago}
            total={total} costoEnvio={costoEnvio} tipoEnvio={tipoEnvio}
            totalFinal={totalFinal} formatPrice={formatPrice} handleSubmitFinal={handleSubmitFinal}
          />
        )}

        {cart.length > 0 && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Pagos procesados de forma segura mediante plataformas encriptadas.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}