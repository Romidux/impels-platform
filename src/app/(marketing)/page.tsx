"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  ShoppingCart,
  MessageCircle,
  Palette,
  BarChart3,
  Zap,
  Store,
  Star,
  Package,
  Users,
  Globe,
  Shield,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Store,
    title: "Tienda lista en minutos",
    description:
      "Crea tu tienda, agrega tus productos y comienza a vender sin escribir una sola línea de código.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Package,
    title: "Catálogo potente",
    description:
      "Categorías, subcategorías, variantes de productos (talle, color), stock por variante y mucho más.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: MessageCircle,
    title: "Checkout por WhatsApp",
    description:
      "Tus clientes hacen el pedido y el mensaje llega directo a tu WhatsApp. Sin pasarelas de pago complicadas.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: Palette,
    title: "Tu marca, tu estilo",
    description:
      "Elige tu template, colores, logo y personaliza tu tienda para que refleje tu marca.",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: Globe,
    title: "URL propia de tienda",
    description:
      "Cada tienda tiene su propia URL en la plataforma. Compártela en tus redes y WhatsApp.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Shield,
    title: "Multi-rol por tienda",
    description:
      "Agrega colaboradores a tu tienda con roles: Admin, Editor. Trabaja en equipo.",
    color: "from-cyan-500 to-cyan-600",
  },
];

const steps = [
  {
    number: "01",
    title: "Crea tu cuenta",
    description: "Regístrate gratis en segundos. No se requiere tarjeta.",
  },
  {
    number: "02",
    title: "Configura tu tienda",
    description:
      "Ponle nombre, logo y elige tu template. Agrega tu número de WhatsApp.",
  },
  {
    number: "03",
    title: "Sube tus productos",
    description:
      "Crea categorías y agrega tus productos con fotos, precio y variantes.",
  },
  {
    number: "04",
    title: "¡A vender!",
    description:
      "Comparte el link de tu tienda y recibe pedidos directo en WhatsApp.",
  },
];

const plans = [
  {
    name: "Gratis",
    price: "0",
    currency: "Gs",
    period: "siempre",
    description: "Para empezar y probar la plataforma",
    features: [
      "Hasta 10 productos",
      "URL propia de la tienda",
      "Checkout WhatsApp",
      "1 usuario (owner)",
      "Categorías ilimitadas",
      "Soporte básico",
    ],
    cta: "Empezar gratis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "220.000",
    currency: "Gs",
    period: "mes",
    description: "Para emprendedores que quieren escalar",
    features: [
      "Productos ilimitados",
      "URL propia de la tienda",
      "Checkout WhatsApp",
      "Hasta 5 usuarios con roles",
      "3 templates premium",
      "Personalización completa",
      "Banners y secciones",
      "Soporte prioritario",
    ],
    cta: "Empezar Pro",
    href: "/register?plan=pro",
    highlighted: true,
  },
];

const testimonials = [
  {
    name: "María García",
    role: "Dueña de tienda de ropa",
    avatar: "MG",
    content:
      "Antes perdía ventas porque mis clientes no sabían qué tenía disponible. Con Impels, armé mi catálogo en una tarde y ahora comparto el link en mi WhatsApp.",
  },
  {
    name: "Carlos Rodríguez",
    role: "Emprendedor de figuras coleccionables",
    avatar: "CR",
    content:
      "El sistema de variantes es increíble. Puedo tener el mismo producto en diferentes colores y tamaños, y el stock se actualiza solo.",
  },
  {
    name: "Ana Martínez",
    role: "Tienda de cosméticos",
    avatar: "AM",
    content:
      "Mis clientes piden por WhatsApp como siempre, pero ahora todo queda registrado. No pierdo más pedidos.",
  },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass text-blue-300 text-sm font-medium px-4 py-2 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Plataforma SaaS para emprendedores de LATAM
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
          >
            La forma más fácil de
            <br />
            <span className="gradient-text">crear tu tienda online.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-xl md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Catálogo digital profesional con checkout optimizado para WhatsApp.
            Sin conocimientos técnicos. En minutos.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 gradient-brand text-white font-bold px-8 py-4 rounded-2xl text-lg hover:shadow-glow-lg transition-all hover:scale-105"
            >
              <Zap className="w-5 h-5" />
              Crear tienda gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 glass text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white/15 transition-all"
            >
              Ver cómo funciona
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400"
          >
            {[
              ["✅", "Sin tarjeta de crédito"],
              ["🚀", "Lista en minutos"],
              ["💬", "Checkout por WhatsApp"],
              ["🇵🇾", "Hecho para LATAM"],
            ].map(([emoji, text]) => (
              <div key={text} className="flex items-center gap-2">
                <span>{emoji}</span>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          {/* Floating mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 relative mx-auto max-w-4xl"
          >
            {/* Browser chrome mockup */}
            <div className="glass-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {/* Browser bar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/20">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 bg-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
                  impels-platform.vercel.app/store/migeko
                </div>
              </div>
              {/* Fake store preview */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 min-h-[300px] flex flex-col gap-4">
                {/* Store Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="h-3 w-24 bg-white/20 rounded-full" />
                      <div className="h-2 w-16 bg-white/10 rounded-full mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-white/10 rounded-lg" />
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                {/* Product Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { color: "from-blue-800 to-blue-900", label: "Figura #01" },
                    {
                      color: "from-purple-800 to-purple-900",
                      label: "Figura #02",
                    },
                    { color: "from-pink-800 to-pink-900", label: "Figura #03" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`bg-gradient-to-br ${item.color} rounded-xl p-4 aspect-square relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <Package className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="h-2 bg-white/20 rounded-full mb-1" />
                        <div className="h-2 w-1/2 bg-blue-400/60 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
                {/* WhatsApp button */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl">
                    <MessageCircle className="w-4 h-4" />
                    Pedir por WhatsApp
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-8 top-1/4 glass-dark border border-white/10 rounded-2xl px-4 py-3 shadow-xl hidden md:flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white text-xs font-bold">
                  Nuevo pedido!
                </div>
                <div className="text-gray-400 text-xs">2x Figura Naruto</div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5,
              }}
              className="absolute -right-8 bottom-1/4 glass-dark border border-white/10 rounded-2xl px-4 py-3 shadow-xl hidden md:flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white text-xs font-bold">
                  +32 pedidos hoy
                </div>
                <div className="text-gray-400 text-xs">
                  Gs 1.240.000 en ventas
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              Súper simple
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-4">
              De cero a vendiendo en
              <span className="gradient-text"> 4 pasos</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Sin complicaciones. Sin conocimientos técnicos. Solo tu tienda,
              tus productos y tus ventas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="card p-6 h-full">
                  <div className="font-display text-6xl font-black gradient-text opacity-30 mb-3">
                    {step.number}
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                    <ChevronRight className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 text-sm font-semibold px-4 py-2 rounded-full mb-4">
              <Zap className="w-4 h-4" />
              Todo lo que necesitas
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Funcionalidades que impulsan
              <br />
              <span className="gradient-text">tu negocio</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="card p-6 group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
              <Star className="w-4 h-4" />
              Precios transparentes
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Sin sorpresas. Sin comisiones.
            </h2>
            <p className="text-gray-500 text-lg">
              Elige el plan que se ajuste a tu negocio.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`relative rounded-3xl p-8 ${
                  plan.highlighted
                    ? "gradient-brand text-white shadow-glow-lg"
                    : "border-2 border-gray-100 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1.5 rounded-full">
                    ⭐ Más popular
                  </div>
                )}
                <div className="mb-6">
                  <h3
                    className={`font-display text-2xl font-black mb-1 ${plan.highlighted ? "text-white" : "text-gray-900"}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${plan.highlighted ? "text-white/80" : "text-gray-400"}`}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-display text-5xl font-black ${plan.highlighted ? "text-white" : "text-gray-900"}`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm ${plan.highlighted ? "text-white/70" : "text-gray-400"}`}
                    >
                      {plan.currency} / {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle
                        className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? "text-white/80" : "text-blue-600"}`}
                      />
                      <span
                        className={`text-sm ${plan.highlighted ? "text-white/90" : "text-gray-600"}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center font-bold py-3.5 rounded-2xl transition-all hover:scale-105 ${
                    plan.highlighted
                      ? "bg-white text-blue-600 hover:shadow-lg"
                      : "gradient-brand text-white hover:shadow-glow"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Lo que dicen nuestros
              <span className="gradient-text"> vendedores</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {t.name}
                    </div>
                    <div className="text-gray-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto px-6 text-center"
        >
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="font-display text-4xl md:text-6xl font-black text-white mb-6">
            ¿Listo para vender más?
          </h2>
          <p className="text-gray-400 text-xl mb-10">
            Crea tu tienda gratis hoy. Sin tarjeta de crédito. Sin límite de
            tiempo en el plan gratuito.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 gradient-brand text-white font-bold px-10 py-5 rounded-2xl text-xl hover:shadow-glow-lg transition-all hover:scale-105"
          >
            <Zap className="w-6 h-6" />
            Crear mi tienda ahora
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Ya son más de 500 tiendas activas en la plataforma 🎉
          </p>
        </motion.div>
      </section>
    </div>
  );
}
