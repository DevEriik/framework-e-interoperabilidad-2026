import { useState, useEffect, useRef, type FormEvent } from "react";
import { ResenaForm } from "@/components/resenas/ResenaForm";
import { ResenasList } from "@/components/resenas/ResenasList";
import { useTheme } from "@/components/theme-provider";
import { ModuloUsuarios } from "./components/moduloUsuarios";
import VideoCallRoom, { CallLauncherButton } from "./TP3/VideoCallRoom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Home,
  Wrench,
  Users,
  ClipboardList,
  Star,
  LogIn,
  MapPin,
  Clock,
  Send,
} from "lucide-react";
import MapaProfesionales from "@/components/mapa-profesional";

const NAV_ITEMS = [
  { id: "inicio", label: "Inicio", icon: Home, href: "#inicio" },
  { id: "servicios", label: "Servicios", icon: Wrench, href: "#servicios" },
  {
    id: "profesionales",
    label: "Profesionales",
    icon: Users,
    href: "#profesionales",
  },
  {
    id: "cotizacion",
    label: "Cotizar",
    icon: ClipboardList,
    href: "#cotizacion",
  },
  { id: "resenas", label: "Reseñas", icon: Star, href: "#resenas" },
];

export default function App() {
  const { theme, setTheme } = useTheme();
  const [refreshResenas, setRefreshResenas] = useState(0);
  const [activeSection, setActiveSection] = useState("inicio");
  const [enLlamada, setEnLlamada] = useState(false);

  const handleNavigate = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      const sectionIds = [
        "inicio",
        "servicios",
        "profesionales",
        "cotizacion",
        "resenas",
      ];
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [cotizacion, setCotizacion] = useState({
    nombre: "",
    servicio: "",
    detalle: "",
  });
  const [enviandoCotizacion, setEnviandoCotizacion] = useState(false);
  const [estadoCotizacion, setEstadoCotizacion] = useState<
    "idle" | "ok" | "error"
  >("idle");
  const [erroresCotizacion, setErroresCotizacion] = useState<{
    nombre?: string;
    servicio?: string;
    detalle?: string;
  }>({});
  const camposCotizacion = useRef({
    nombre: null as HTMLInputElement | null,
    servicio: null as HTMLInputElement | null,
    detalle: null as HTMLInputElement | null,
  });

  const handleEnviarCotizacion = async (e: FormEvent) => {
    e.preventDefault();
    const nuevosErrores: typeof erroresCotizacion = {};
    if (!cotizacion.nombre.trim())
      nuevosErrores.nombre = "Ingresá tu nombre completo.";
    if (!cotizacion.servicio.trim())
      nuevosErrores.servicio = "Indicá el oficio requerido.";
    if (!cotizacion.detalle.trim())
      nuevosErrores.detalle = "Describí el problema a cotizar.";

    setErroresCotizacion(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      setEstadoCotizacion("error");
      const primerCampo = (["nombre", "servicio", "detalle"] as const).find(
        (campo) => nuevosErrores[campo],
      );
      if (primerCampo) camposCotizacion.current[primerCampo]?.focus();
      return;
    }

    setErroresCotizacion({});
    setEnviandoCotizacion(true);
    try {
      const res = await fetch("http://localhost:3001/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto: cotizacion.nombre,
          oficio: cotizacion.servicio,
          descripcion: cotizacion.detalle,
        }),
      });
      if (!res.ok) throw new Error("Falló el envío");
      setEstadoCotizacion("ok");
      setCotizacion({ nombre: "", servicio: "", detalle: "" });
    } catch {
      setEstadoCotizacion("error");
    } finally {
      setEnviandoCotizacion(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-8">
            <a
              href="#inicio"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate("inicio");
              }}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            >
              <span className="text-base sm:text-lg font-bold tracking-tight text-primary">
                ExpertoYa!
              </span>
            </a>
            <nav
              className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground"
              aria-label="Navegación principal de escritorio"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate(item.id);
                    }}
                    className={`flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-3 py-1.5 rounded-md text-xs lg:text-sm transition-all duration-200 ${isActive ? "text-primary bg-primary/10 font-semibold shadow-xs" : "hover:text-foreground hover:bg-muted/60"}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={
                theme === "dark"
                  ? "Cambiar a modo claro"
                  : "Cambiar a modo oscuro"
              }
              aria-label="Alternar modo oscuro"
              className="h-9 w-9 rounded-lg"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-warning" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
            </Button>
            <CallLauncherButton
              chatStatus="active"
              onStartCall={() => setEnLlamada(true)}
            />
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex items-center gap-1.5 font-medium"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Iniciar Sesión</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden h-9 w-9"
              title="Iniciar Sesión"
              aria-label="Iniciar Sesión"
            >
              <LogIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-10 pb-24 md:pb-12">
        <div id="inicio" className="space-y-2 scroll-mt-20">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Plataforma de Servicios
          </h1>
          <section id="mapa" className="scroll-mt-20">
            <MapaProfesionales />
          </section>
          <p className="text-sm text-muted-foreground">
            Estado base del template con componentes desacoplados de Shadcn/ui.
          </p>
        </div>

        <section id="servicios" className="scroll-mt-20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2
                id="profesionales"
                className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"
              >
                <Wrench className="h-5 w-5 text-primary" /> Servicios y
                Profesionales
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Especialistas verificados con matrícula al día y disponibilidad
                en tu zona.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="flex flex-col justify-between hover:border-primary/50 transition-colors shadow-xs">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold">
                      Plomería y Gas
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Martín Benítez • Matrícula Profesional
                    </CardDescription>
                  </div>
                  <span className="shrink-0 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary-foreground dark:text-secondary border border-secondary/25">
                    Matriculado
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2.5">
                <p>
                  Reparaciones de cañerías, destapes integrales e instalación de
                  artefactos certificados.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Zona: Neuquén Capital y alrededores</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between items-stretch sm:items-center pt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-secondary shrink-0" />{" "}
                  Disponibilidad inmediata
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <CallLauncherButton
                    chatStatus="active"
                    onStartCall={() => setEnLlamada(true)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Ver Perfil
                  </Button>
                </div>
              </CardFooter>
            </Card>
            <Card className="flex flex-col justify-between hover:border-primary/50 transition-colors shadow-xs">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold">
                      Electricidad Integral
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Clara Rossi • Técnica Electricista
                    </CardDescription>
                  </div>
                  <span className="shrink-0 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary-foreground dark:text-secondary border border-secondary/25">
                    Técnica
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2.5">
                <p>
                  Montaje de tableros trifásicos, cableados domiciliarios y
                  certificaciones de obra.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Zona: Cipolletti y Plottier</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between items-stretch sm:items-center pt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-secondary shrink-0" />{" "}
                  Presupuestos sin cargo
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Ver Perfil
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section id="cotizacion" className="scroll-mt-20">
          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold">
                    Solicitud de Cotización
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Formulario estándar para coordinar una visita técnica sin
                    costo de presupuesto.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={handleEnviarCotizacion}
                  noValidate
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">
                        Nombre completo
                        <span aria-hidden="true" className="text-destructive">
                          {" "}
                          *
                        </span>
                      </Label>
                      <Input
                        id="nombre"
                        ref={(el) => {
                          camposCotizacion.current.nombre = el;
                        }}
                        placeholder="Ej: Juan Pérez"
                        value={cotizacion.nombre}
                        onChange={(e) => {
                          setCotizacion({
                            ...cotizacion,
                            nombre: e.target.value,
                          });
                          setErroresCotizacion((prev) => ({
                            ...prev,
                            nombre: undefined,
                          }));
                        }}
                        required
                        aria-invalid={!!erroresCotizacion.nombre}
                        aria-describedby={
                          erroresCotizacion.nombre ? "error-nombre" : undefined
                        }
                      />
                      {erroresCotizacion.nombre && (
                        <p
                          id="error-nombre"
                          className="text-xs font-medium text-destructive"
                        >
                          {erroresCotizacion.nombre}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="servicio">
                        Oficio requerido
                        <span aria-hidden="true" className="text-destructive">
                          {" "}
                          *
                        </span>
                      </Label>
                      <Input
                        id="servicio"
                        ref={(el) => {
                          camposCotizacion.current.servicio = el;
                        }}
                        placeholder="Ej: Electricidad"
                        value={cotizacion.servicio}
                        onChange={(e) => {
                          setCotizacion({
                            ...cotizacion,
                            servicio: e.target.value,
                          });
                          setErroresCotizacion((prev) => ({
                            ...prev,
                            servicio: undefined,
                          }));
                        }}
                        required
                        aria-invalid={!!erroresCotizacion.servicio}
                        aria-describedby={
                          erroresCotizacion.servicio
                            ? "error-servicio"
                            : undefined
                        }
                      />
                      {erroresCotizacion.servicio && (
                        <p
                          id="error-servicio"
                          className="text-xs font-medium text-destructive"
                        >
                          {erroresCotizacion.servicio}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detalle">
                      Descripción del problema
                      <span aria-hidden="true" className="text-destructive">
                        {" "}
                        *
                      </span>
                    </Label>
                    <Input
                      id="detalle"
                      ref={(el) => {
                        camposCotizacion.current.detalle = el;
                      }}
                      placeholder="Detalla brevemente el trabajo que necesitas cotizar"
                      value={cotizacion.detalle}
                      onChange={(e) => {
                        setCotizacion({
                          ...cotizacion,
                          detalle: e.target.value,
                        });
                        setErroresCotizacion((prev) => ({
                          ...prev,
                          detalle: undefined,
                        }));
                      }}
                      required
                      aria-invalid={!!erroresCotizacion.detalle}
                      aria-describedby={
                        erroresCotizacion.detalle ? "error-detalle" : undefined
                      }
                    />
                    {erroresCotizacion.detalle && (
                      <p
                        id="error-detalle"
                        className="text-xs font-medium text-destructive"
                      >
                        {erroresCotizacion.detalle}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row sm:justify-start">
                    <Button
                      type="submit"
                      disabled={enviandoCotizacion}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 font-medium"
                    >
                      <Send className="h-4 w-4" />
                      <span>
                        {enviandoCotizacion
                          ? "Enviando..."
                          : "Enviar Solicitud"}
                      </span>
                    </Button>
                  </div>
                  {estadoCotizacion === "ok" && (
                    <Alert variant="success">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <AlertDescription>
                        Solicitud enviada. El profesional fue notificado por
                        correo.
                      </AlertDescription>
                    </Alert>
                  )}
                  {estadoCotizacion === "error" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <AlertDescription>
                        No se pudo enviar. Revisá los campos marcados o intentá
                        de nuevo más tarde.
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </CardContent>
          </Card>
        </section>

        <section id="estados" className="scroll-mt-20 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Estados del Sistema
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Demostración visual de alertas de estado utilizando los tokens
              semánticos oficiales de ExpertoYa! en modo claro y oscuro.
            </p>
          </div>
          <div className="space-y-3">
            <Alert variant="success" role="status">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <div>
                <AlertTitle>Operación Exitosa</AlertTitle>
                <AlertDescription>
                  Tu solicitud de cotización ha sido confirmada con éxito. El
                  profesional matriculado se contactará a la brevedad.
                </AlertDescription>
              </div>
            </Alert>
            <Alert variant="warning" role="status">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                <AlertTitle>Alta Demanda en la Zona</AlertTitle>
                <AlertDescription>
                  Atención: Alta concurrencia de pedidos en este rubro. El
                  tiempo estimado de respuesta puede demorar hasta 24 horas
                  hábiles.
                </AlertDescription>
              </div>
            </Alert>
            <Alert variant="destructive" role="status">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div>
                <AlertTitle>Error en la Validación</AlertTitle>
                <AlertDescription>
                  No se pudo procesar la solicitud. Por favor verifica que los
                  campos obligatorios del formulario estén completos y vuelve a
                  intentar.
                </AlertDescription>
              </div>
            </Alert>
          </div>
        </section>

        <section
          id="resenas"
          className="scroll-mt-20 space-y-6 pt-6 border-t border-border"
        >
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary uppercase tracking-wider">
                Módulo Closed-Loop
              </span>
              <span className="text-xs text-muted-foreground">
                TP Universitario • ExpertoYa
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Evaluación y Calificaciones de Profesionales
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Permite a los clientes evaluar de manera contenida la calidad del
              servicio una vez finalizada la solicitud de trabajo.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-5">
              <ResenaForm
                solicitudId={1}
                clienteId={1}
                profesionalId="16311898-ac60-4a3e-a843-d4d00fdc89f9"
                profesionalNombre="Daniela Oñatibia"
                servicioNombre="Reparación de pérdida de agua en cocina"
                onResenaCreada={() => setRefreshResenas((prev) => prev + 1)}
              />
            </div>
            <div className="lg:col-span-7">
              <ResenasList
                profesionalId="16311898-ac60-4a3e-a843-d4d00fdc89f9"
                profesionalNombre="Daniela Oñatibia"
                actualizarTrigger={refreshResenas}
              />
            </div>
          </div>
        </section>
        <ModuloUsuarios />
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] transition-colors"
        aria-label="Menú principal inferior móvil"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(item.id);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-all duration-200 relative select-none rounded-lg ${isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground active:scale-95"}`}
                aria-label={item.label}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
                )}
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${isActive ? "bg-primary/15 scale-110" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] leading-tight tracking-tight text-center truncate max-w-full px-0.5">
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Modal de Videollamada WebRTC (TP3 - ExpertoYa) */}
      {enLlamada && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="w-full max-w-4xl max-h-[95vh] flex flex-col relative my-auto">
            <VideoCallRoom
              chatStatus="active"
              roomUrl="https://expertoya.daily.co/diagnostico-demo"
              userName="Abril (Cliente ExpertoYa)"
              userRole="cliente"
              onCloseCall={() => setEnLlamada(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
