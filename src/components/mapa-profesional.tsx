import { useEffect, useId, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertCircle,
  List as ListIcon,
  LocateFixed,
  Map as MapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Prof = {
  id: number;
  nombre: string;
  oficio: string;
  zona: string;
  lat: number;
  lng: number;
  distanciaKm?: number;
};

const PROFESIONALES: Prof[] = [
  {
    id: 1,
    nombre: "Martín Benítez",
    oficio: "Plomería y Gas",
    zona: "Neuquén Capital y alrededores",
    lat: -38.9516,
    lng: -68.0591,
  },
  {
    id: 2,
    nombre: "Clara Rossi",
    oficio: "Electricidad Integral",
    zona: "Cipolletti y Plottier",
    lat: -38.9313,
    lng: -68.0019,
  },
  {
    id: 3,
    nombre: "Taller Plottier",
    oficio: "Electricidad",
    zona: "Plottier",
    lat: -38.9484,
    lng: -68.2271,
  },
];

const CENTRO: [number, number] = [-38.9516, -68.0591];

type EstadoBusqueda = "idle" | "buscando" | "ok" | "error";
type Vista = "mapa" | "lista";

function distKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLa = ((bLat - aLat) * Math.PI) / 180;
  const dLo = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLa / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function mensajeGeolocalizacion(code: number) {
  switch (code) {
    case 1:
      return "No diste permiso de ubicación. Podés habilitarlo en el navegador o buscar por zona.";
    case 2:
      return "No pudimos obtener tu ubicación. Revisá la señal GPS o la conexión e intentá de nuevo.";
    case 3:
      return "La búsqueda tardó demasiado. Intentá de nuevo o elegí una zona manualmente.";
    default:
      return "No pudimos obtener tu ubicación. Intentá de nuevo en unos segundos.";
  }
}

export default function MapaProfesionales() {
  const [vista, setVista] = useState<Vista>("mapa");
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [cercanos, setCercanos] = useState<Prof[]>(PROFESIONALES);
  const [estado, setEstado] = useState<EstadoBusqueda>("idle");
  const [mensaje, setMensaje] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const tituloId = useId();
  const descripcionId = useId();
  const ayudaId = useId();
  const refMapa = useRef<HTMLDivElement>(null);
  const refLista = useRef<HTMLHeadingElement>(null);
  const ultimoMarcador = useRef<HTMLElement | null>(null);
  const popupListener = useRef<{
    el: HTMLElement;
    fn: (ev: KeyboardEvent) => void;
  } | null>(null);
  const primeraRender = useRef(true);

  useEffect(() => {
    if (primeraRender.current) {
      primeraRender.current = false;
      return;
    }
    if (vista === "lista") {
      refLista.current?.focus();
    } else {
      refMapa.current?.focus();
    }
  }, [vista]);

  const manejarPopupOpen = (e: L.PopupEvent) => {
    const marcador = (e.popup as unknown as { _source?: L.Marker })._source;
    ultimoMarcador.current = marcador?.getElement() ?? null;
    const contenido =
      e.popup.getElement()?.querySelector<HTMLElement>(".leaflet-popup-content");
    if (contenido) {
      contenido.tabIndex = -1;
      const cerrarConEscape = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") {
          ev.preventDefault();
          e.popup.remove();
        }
      };
      contenido.addEventListener("keydown", cerrarConEscape);
      popupListener.current = { el: contenido, fn: cerrarConEscape };
      contenido.focus();
    }
  };

  const manejarPopupClose = () => {
    if (popupListener.current) {
      popupListener.current.el.removeEventListener(
        "keydown",
        popupListener.current.fn,
      );
      popupListener.current = null;
    }
    ultimoMarcador.current?.focus();
  };

  const buscarCercanos = () => {
    if (!navigator.geolocation) {
      setEstado("error");
      setErrorMsg(
        "Tu navegador no permite geolocalización. Podés buscar profesionales por zona.",
      );
      return;
    }

    setEstado("buscando");
    setErrorMsg("");
    setMensaje("Buscando profesionales cerca de tu ubicación…");

    navigator.geolocation.getCurrentPosition(
      (g) => {
        const p: [number, number] = [g.coords.latitude, g.coords.longitude];
        const ordenados = PROFESIONALES.map((prof) => ({
          ...prof,
          distanciaKm: distKm(p[0], p[1], prof.lat, prof.lng),
        }))
          .sort((a, b) => a.distanciaKm - b.distanciaKm)
          .slice(0, 2);

        setPos(p);
        setCercanos(ordenados);
        setEstado("ok");
        setMensaje(
          ordenados.length === 1
            ? "Se encontró 1 profesional cerca de tu ubicación."
            : `Se encontraron ${ordenados.length} profesionales cerca de tu ubicación.`,
        );
      },
      (err) => {
        setEstado("error");
        setErrorMsg(mensajeGeolocalizacion(err.code));
        setMensaje("");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={tituloId} className="text-lg font-semibold tracking-tight">
          Profesionales en tu zona
        </h2>
        <div role="group" aria-label="Vista de resultados">
          <Button
            type="button"
            size="sm"
            variant={vista === "mapa" ? "default" : "outline"}
            aria-pressed={vista === "mapa"}
            onClick={() => setVista("mapa")}
            className="mr-2"
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            <span className="ml-1.5">Mapa</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={vista === "lista" ? "default" : "outline"}
            aria-pressed={vista === "lista"}
            onClick={() => setVista("lista")}
          >
            <ListIcon className="h-4 w-4" aria-hidden="true" />
            <span className="ml-1.5">Lista</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={buscarCercanos}
          disabled={estado === "buscando"}
          aria-describedby={ayudaId}
        >
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          <span className="ml-1.5">
            {estado === "buscando"
              ? "Buscando…"
              : "Buscar profesionales cercanos"}
          </span>
        </Button>
        <p id={ayudaId} className="text-xs text-muted-foreground">
          Usamos tu ubicación solo para ordenar por distancia.
        </p>
      </div>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-foreground"
      >
        {mensaje}
      </p>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>{errorMsg}</span>
        </div>
      )}

      <div aria-busy={estado === "buscando"}>
        {vista === "mapa" ? (
          <div
            ref={refMapa}
            role="region"
            aria-labelledby={tituloId}
            aria-describedby={descripcionId}
            tabIndex={-1}
            className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <p id={descripcionId} className="sr-only">
              Mapa interactivo de profesionales. Los mismos resultados están
              disponibles en la vista de lista.
            </p>
            <MapContainer
              center={pos ?? CENTRO}
              zoom={11}
              style={{ height: 320, width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap"
              />
              {cercanos.map((p) => {
                const pp: [number, number] = [p.lat, p.lng];
                const nombre = `${p.nombre}, ${p.oficio}, ${p.zona}`;
                return (
                  <Marker
                    key={p.id}
                    position={pp}
                    icon={icon}
                    alt={nombre}
                    title={nombre}
                    keyboard
                    eventHandlers={{
                      popupopen: manejarPopupOpen,
                      popupclose: manejarPopupClose,
                    }}
                  >
                    <Popup>
                      <strong>{p.nombre}</strong>
                      <br />
                      {p.oficio}
                      <br />
                      {p.zona}
                    </Popup>
                  </Marker>
                );
              })}
              {pos && (
                <Marker
                  position={pos}
                  icon={icon}
                  alt="Tu ubicación"
                  title="Tu ubicación"
                  keyboard
                >
                  <Popup>Tu ubicación</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        ) : (
          <div>
            <h3
              ref={refLista}
              tabIndex={-1}
              className="mb-2 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Resultados de profesionales
            </h3>
            {cercanos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No encontramos profesionales cerca de tu ubicación. Probá
                ampliar la zona.
              </p>
            ) : (
              <ul aria-label="Profesionales encontrados" className="space-y-2">
                {cercanos.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <h4 className="font-semibold text-foreground">
                      {p.nombre}
                    </h4>
                    <p className="text-sm text-muted-foreground">{p.oficio}</p>
                    <p className="text-xs text-muted-foreground">
                      Zona: {p.zona}
                    </p>
                    {p.distanciaKm !== undefined && (
                      <p className="text-xs text-foreground">
                        A {p.distanciaKm.toFixed(1)} km de tu ubicación
                      </p>
                    )}
                    <a
                      href="#servicios"
                      className="mt-2 inline-block text-sm font-medium text-foreground underline underline-offset-2"
                      aria-label={`Ver perfil de ${p.nombre}`}
                    >
                      Ver perfil
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
