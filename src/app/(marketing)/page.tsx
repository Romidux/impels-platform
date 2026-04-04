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
  Globe,
  Shield,
  Sparkles,
  Check,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";

/* ── Design tokens (Kindred Commerce / Editorial Humanism) ───────── */
// Surface:            #fdf9f4  (warm cream canvas)
// Surface-low:        #f7f3ee  (slightly warmer for sections)
// Surface-card:       #ffffff  (pure white cards pop against cream)
// On-surface:         #1c1c19  (warm near-black)
// On-surface-variant: #434656  (muted body text)
// Primary:            #0040df → #5f00e3 (gradient CTA)
// Tertiary amber:     #ffddb4  (soft amber highlight)
// Shadow:             0 12px 32px -4px rgba(28,28,25,0.06)

const ease = "easeOut" as const;

const inView = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.09 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease },
};

/* ── Data ──────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Store,
    title: "Tienda lista en minutos",
    description:
      "Crea tu tienda, carga tus productos y empieza a vender. Sin código. Sin complicaciones.",
    accent: "#dde1ff",
    iconColor: "#0040df",
  },
  {
    icon: Package,
    title: "Catálogo potente",
    description:
      "Categorías, variantes de productos (talle, color), stock por variante. Todo lo que necesitás.",
    accent: "#e9ddff",
    iconColor: "#5f00e3",
  },
  {
    icon: MessageCircle,
    title: "Checkout por WhatsApp",
    description:
      "El pedido llega directo a tu WhatsApp. Así como siempre vendiste, pero organizado.",
    accent: "#dcfce7",
    iconColor: "#16a34a",
  },
  {
    icon: Palette,
    title: "Tu marca, tu estilo",
    description:
      "Elegí colores, logo y template. Tu tienda refleja tu identidad, no la nuestra.",
    accent: "#fce7f3",
    iconColor: "#db2777",
  },
  {
    icon: Globe,
    title: "URL propia de tienda",
    description:
      "Compartí el link en tus redes y grupos de WhatsApp. Cada tienda tiene su dirección.",
    accent: "#fef3c7",
    iconColor: "#d97706",
  },
  {
    icon: Shield,
    title: "Multi-rol por tienda",
    description:
      "Sumá colaboradores con roles Admin o Editor. Trabajá en equipo sin perder el control.",
    accent: "#e0f2fe",
    iconColor: "#0284c7",
  },
];

const steps = [
  {
    number: "01",
    title: "Crea tu cuenta",
    description: "Regístrate gratis en segundos. Sin tarjeta, sin trampas.",
    emoji: "👤",
  },
  {
    number: "02",
    title: "Configura tu tienda",
    description: "Nombre, logo, template y tu número de WhatsApp. Listo.",
    emoji: "🏪",
  },
  {
    number: "03",
    title: "Sube tus productos",
    description: "Fotos, precios, variantes. Tu catálogo completo en un lugar.",
    emoji: "📦",
  },
  {
    number: "04",
    title: "¡A vender!",
    description: "Compartí el link y los pedidos llegan solos a tu WhatsApp.",
    emoji: "🚀",
  },
];

const plans = [
  {
    name: "Gratis",
    price: "0",
    period: "siempre",
    description: "Para empezar y probar sin riesgo",
    features: [
      "Hasta 10 productos",
      "URL propia de tienda",
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
    period: "mes",
    description: "Para emprendedores que quieren escalar",
    features: [
      "Productos ilimitados",
      "URL propia de tienda",
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
    role: "Tienda de ropa — Asunción",
    initials: "MG",
    color: "#dde1ff",
    content:
      "Antes perdía ventas porque mis clientes no sabían qué tenía disponible. Con Impels armé mi catálogo en una tarde y ahora comparto el link en mi estado de WhatsApp.",
  },
  {
    name: "Carlos Rodríguez",
    role: "Figuras coleccionables — CDE",
    initials: "CR",
    color: "#fce7f3",
    content:
      "El sistema de variantes es increíble. Tengo el mismo producto en varios colores y tamaños, y el stock se actualiza solo. Antes todo lo llevaba en papel.",
  },
  {
    name: "Ana Martínez",
    role: "Cosméticos artesanales — Encarnación",
    initials: "AM",
    color: "#dcfce7",
    content:
      "Mis clientes piden por WhatsApp como siempre, pero ahora queda todo registrado. No pierdo más pedidos y se ven lo profesional que es mi negocio.",
  },
];

const trustStats = [
  { value: "500+", label: "tiendas activas", icon: Store },
  { value: "4.9★", label: "valoración promedio", icon: Star },
  { value: "0%", label: "comisiones por venta", icon: TrendingUp },
  { value: "< 5min", label: "tiempo de setup", icon: Clock },
];

/* ── Page ──────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div
      style={{ background: "#fdf9f4", color: "#1c1c19" }}
      className="overflow-hidden"
    >
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #fdf9f4 60%, #f0ebff 100%)" }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(93,0,227,0.06) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255,185,84,0.1) 0%, transparent 70%)",
            transform: "translate(-30%, 30%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="max-w-xl"
            >
              {/* Badge */}
              <motion.div variants={staggerItem} className="mb-6">
                <span
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full"
                  style={{ background: "#ffddb4", color: "#633f00" }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Plataforma para emprendedores de LATAM
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={staggerItem}
                className="font-display text-5xl md:text-6xl xl:text-7xl font-black mb-6 leading-[1.05] tracking-tight"
                style={{ color: "#1c1c19", letterSpacing: "-0.02em" }}
              >
                Tu tienda online,{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #0040df 0%, #5f00e3 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  lista en minutos.
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={staggerItem}
                className="text-lg md:text-xl leading-relaxed mb-8"
                style={{ color: "#434656" }}
              >
                Catálogo digital profesional con checkout optimizado para
                WhatsApp. Sin conocimientos técnicos. Sin comisiones. Sin
                complicaciones.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={staggerItem}
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 text-white font-bold px-7 py-4 rounded-2xl text-base transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #0040df 0%, #5f00e3 100%)",
                    boxShadow: "0 8px 24px -4px rgba(0,64,223,0.35)",
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Crear tienda gratis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-4 rounded-2xl text-base transition-all hover:bg-white/80"
                  style={{
                    color: "#0040df",
                    background: "rgba(0,64,223,0.06)",
                  }}
                >
                  Ver cómo funciona
                </Link>
              </motion.div>

              {/* Trust chips */}
              <motion.div
                variants={staggerItem}
                className="flex flex-wrap gap-3"
              >
                {[
                  "✅ Sin tarjeta de crédito",
                  "💬 Checkout por WhatsApp",
                  "🇵🇾 Hecho para LATAM",
                ].map((item) => (
                  <span
                    key={item}
                    className="text-sm px-3 py-1.5 rounded-full"
                    style={{ background: "#f1ede8", color: "#434656" }}
                  >
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Browser mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              {/* Browser window */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 32px 80px -8px rgba(28,28,25,0.18)",
                }}
              >
                {/* Browser chrome */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ background: "#f1ede8" }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#fc615d" }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: "#fdbc40" }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: "#34c749" }} />
                  </div>
                  <div
                    className="flex-1 rounded-lg px-3 py-1.5 text-xs"
                    style={{ background: "#e6e2dd", color: "#747688" }}
                  >
                    impels.app/store/migeko-shop
                  </div>
                </div>

                {/* Store preview */}
                <div className="p-5" style={{ background: "#fdf9f4" }}>
                  {/* Store header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, #0040df, #5f00e3)",
                        }}
                      >
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div
                          className="h-3 w-20 rounded-full"
                          style={{ background: "#e6e2dd" }}
                        />
                        <div
                          className="h-2 w-14 rounded-full mt-1"
                          style={{ background: "#f1ede8" }}
                        />
                      </div>
                    </div>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #0040df, #5f00e3)",
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Category bar */}
                  <div className="flex gap-2 mb-4">
                    {["Todo", "Ropa", "Accesorios"].map((cat, i) => (
                      <span
                        key={cat}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={
                          i === 0
                            ? {
                                background: "linear-gradient(135deg, #0040df, #5f00e3)",
                                color: "#fff",
                              }
                            : { background: "#e6e2dd", color: "#434656" }
                        }
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Product grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { bg: "linear-gradient(135deg, #dde1ff, #c4caff)", label: "Remera Basic", price: "85.000" },
                      { bg: "linear-gradient(135deg, #fce7f3, #fbb6ce)", label: "Vestido Flores", price: "140.000" },
                      { bg: "linear-gradient(135deg, #dcfce7, #86efac)", label: "Short Sport", price: "95.000" },
                    ].map((product) => (
                      <div key={product.label} className="rounded-xl overflow-hidden">
                        <div
                          className="aspect-square flex items-center justify-center"
                          style={{ background: product.bg }}
                        >
                          <Package
                            className="w-8 h-8"
                            style={{ color: "rgba(28,28,25,0.3)" }}
                          />
                        </div>
                        <div className="pt-2 pb-1">
                          <div
                            className="text-xs font-semibold truncate"
                            style={{ color: "#1c1c19" }}
                          >
                            {product.label}
                          </div>
                          <div className="text-xs font-bold" style={{ color: "#0040df" }}>
                            Gs {product.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* WhatsApp button */}
                  <div className="mt-4 flex justify-center">
                    <div
                      className="flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl"
                      style={{ background: "#16a34a" }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Pedir por WhatsApp
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge: new order */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-12 top-1/4 flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 12px 32px -4px rgba(28,28,25,0.12)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: "#dcfce7" }}
                >
                  🎉
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: "#1c1c19" }}>
                    Nuevo pedido
                  </div>
                  <div className="text-xs" style={{ color: "#434656" }}>
                    2× Remera Basic
                  </div>
                </div>
              </motion.div>

              {/* Floating badge: stats */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute -right-8 bottom-1/4 flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 12px 32px -4px rgba(28,28,25,0.12)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#dde1ff" }}
                >
                  <BarChart3 className="w-4 h-4" style={{ color: "#0040df" }} />
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: "#1c1c19" }}>
                    +32 pedidos hoy
                  </div>
                  <div className="text-xs" style={{ color: "#434656" }}>
                    Gs 1.240.000
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ───────────────────────────────────────── */}
      <section style={{ background: "#f7f3ee" }} className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {trustStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                {...inView}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#ffddb4" }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: "#764c00" }} />
                </div>
                <div>
                  <div
                    className="font-display text-xl font-black leading-none"
                    style={{ color: "#1c1c19" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#747688" }}>
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: "#fdf9f4" }} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...inView} className="text-center mb-16">
            <span
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-4"
              style={{ background: "#ffddb4", color: "#633f00" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Súper simple
            </span>
            <h2
              className="font-display text-4xl md:text-5xl font-black mb-4 tracking-tight"
              style={{ color: "#1c1c19", letterSpacing: "-0.02em" }}
            >
              De cero a vendiendo{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #0040df 0%, #5f00e3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                en 4 pasos
              </span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#434656" }}>
              Sin conocimientos técnicos. Sin complicaciones. Solo tu tienda,
              tus productos y tus ventas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                {...inView}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div
                  className="rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "#ffffff",
                    boxShadow: "0 12px 32px -4px rgba(28,28,25,0.06)",
                  }}
                >
                  <div className="text-3xl mb-3">{step.emoji}</div>
                  <div
                    className="font-display text-4xl font-black mb-3 leading-none"
                    style={{
                      background: "linear-gradient(135deg, #0040df 0%, #5f00e3 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      opacity: 0.35,
                    }}
                  >
                    {step.number}
                  </div>
                  <h3
                    className="font-display text-lg font-bold mb-2"
                    style={{ color: "#1c1c19" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#434656" }}>
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 items-center justify-center w-6 h-6">
                    <ChevronRight className="w-5 h-5" style={{ color: "#c4c5d9" }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section style={{ background: "#f7f3ee" }} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...inView} className="text-center mb-16">
            <span
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-4"
              style={{ background: "#e9ddff", color: "#5400cc" }}
            >
              <Zap className="w-3.5 h-3.5" />
              Todo lo que necesitás
            </span>
            <h2
              className="font-display text-4xl md:text-5xl font-black mb-4 tracking-tight"
              style={{ color: "#1c1c19", letterSpacing: "-0.02em" }}
            >
              Funcionalidades que impulsan{" "}
              <br className="hidden md:block" />
              <span
                style={{
                  background: "linear-gradient(135deg, #0040df 0%, #5f00e3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                tu negocio
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...inView}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 12px 32px -4px rgba(28,28,25,0.06)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: feature.accent }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.iconColor }} />
                </div>
                <h3
                  className="font-display text-lg font-bold mb-2"
                  style={{ color: "#1c1c19" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#434656" }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section style={{ background: "#fdf9f4" }} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...inView} className="text-center mb-16">
            <h2
              className="font-display text-4xl md:text-5xl font-black mb-4 tracking-tight"
              style={{ color: "#1c1c19", letterSpacing: "-0.02em" }}
            >
              Lo que dicen los que ya{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #0040df 0%, #5f00e3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                venden con Impels
              </span>
            </h2>
            <p className="text-lg" style={{ color: "#434656" }}>
              Emprendedores reales. Resultados reales.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                {...inView}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 12px 32px -4px rgba(28,28,25,0.06)",
                }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-current"
                      style={{ color: "#f59e0b" }}
                    />
                  ))}
                </div>

                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: "#434656" }}
                >
                  &ldquo;{t.content}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: t.color, color: "#1c1c19" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#1c1c19" }}>
                      {t.name}
                    </div>
                    <div className="text-xs" style={{ color: "#747688" }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: "#f7f3ee" }} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...inView} className="text-center mb-16">
            <span
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-4"
              style={{ background: "#dcfce7", color: "#15803d" }}
            >
              <Check className="w-3.5 h-3.5" />
              Precios transparentes
            </span>
            <h2
              className="font-display text-4xl md:text-5xl font-black mb-4 tracking-tight"
              style={{ color: "#1c1c19", letterSpacing: "-0.02em" }}
            >
              Sin sorpresas. Sin comisiones.
            </h2>
            <p className="text-lg" style={{ color: "#434656" }}>
              Elegí el plan que se ajuste a tu negocio. Cambiá cuando quieras.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                {...inView}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1"
                style={
                  plan.highlighted
                    ? {
                        background: "linear-gradient(135deg, #0040df 0%, #5f00e3 100%)",
                        boxShadow: "0 24px 60px -8px rgba(0,64,223,0.4)",
                      }
                    : {
                        background: "#ffffff",
                        boxShadow: "0 12px 32px -4px rgba(28,28,25,0.06)",
                      }
                }
              >
                {plan.highlighted && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full"
                    style={{ background: "#ffddb4", color: "#633f00" }}
                  >
                    ⭐ Más popular
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className="font-display text-2xl font-black mb-1"
                    style={{ color: plan.highlighted ? "#ffffff" : "#1c1c19" }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className="text-sm mb-5"
                    style={{ color: plan.highlighted ? "rgba(255,255,255,0.75)" : "#747688" }}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="font-display text-5xl font-black"
                      style={{ color: plan.highlighted ? "#ffffff" : "#1c1c19" }}
                    >
                      {plan.price}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: plan.highlighted ? "rgba(255,255,255,0.65)" : "#747688" }}
                    >
                      Gs / {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3">
                      <CheckCircle
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: plan.highlighted ? "rgba(255,255,255,0.8)" : "#0040df" }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: plan.highlighted ? "rgba(255,255,255,0.9)" : "#434656" }}
                      >
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className="block text-center font-bold py-3.5 rounded-2xl transition-all hover:scale-105"
                  style={
                    plan.highlighted
                      ? {
                          background: "#ffffff",
                          color: "#0040df",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }
                      : {
                          background: "linear-gradient(135deg, #0040df 0%, #5f00e3 100%)",
                          color: "#ffffff",
                          boxShadow: "0 8px 20px -4px rgba(0,64,223,0.3)",
                        }
                  }
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <section
        className="py-28 relative overflow-hidden"
        style={{ background: "#0f0e1a" }}
      >
        {/* Background orbs */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(0,64,223,0.25) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(95,0,227,0.2) 0%, transparent 70%)",
            transform: "translate(30%, 30%)",
          }}
        />

        <motion.div
          {...inView}
          className="relative max-w-3xl mx-auto px-6 text-center"
        >
          <div className="text-6xl mb-6">🚀</div>

          <h2
            className="font-display text-4xl md:text-6xl font-black mb-6 tracking-tight"
            style={{ color: "#ffffff", letterSpacing: "-0.02em" }}
          >
            ¿Listo para vender más?
          </h2>

          <p className="text-xl mb-10" style={{ color: "rgba(255,255,255,0.6)" }}>
            Crea tu tienda gratis hoy. Sin tarjeta de crédito. Sin límite de
            tiempo en el plan gratuito.
          </p>

          <Link
            href="/register"
            className="inline-flex items-center gap-3 font-bold px-10 py-5 rounded-2xl text-xl text-white transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #0040df 0%, #5f00e3 100%)",
              boxShadow: "0 16px 40px -8px rgba(0,64,223,0.5)",
            }}
          >
            <Zap className="w-6 h-6" />
            Crear mi tienda ahora
            <ArrowRight className="w-6 h-6" />
          </Link>

          <p className="text-sm mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            Ya son más de 500 tiendas activas en la plataforma 🎉
          </p>
        </motion.div>
      </section>
    </div>
  );
}
