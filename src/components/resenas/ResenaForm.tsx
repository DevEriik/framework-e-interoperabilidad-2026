import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Star, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ResenaFormProps {
  solicitudId: number;
  clienteId: number;
  profesionalId: string | number;
  profesionalNombre: string;
  servicioNombre: string;
  onResenaCreada?: () => void;
}

export const ResenaForm: React.FC<ResenaFormProps> = ({
  solicitudId,
  clienteId,
  profesionalId,
  profesionalNombre,
  servicioNombre,
  onResenaCreada,
}) => {
  const [calificacion, setCalificacion] = useState<number>(5);
  const [hoverPuntaje, setHoverPuntaje] = useState<number | null>(null);
  const [comentario, setComentario] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (comentario.trim().length < 5) {
      setMensajeError("El comentario debe contener al menos 5 caracteres.");
      return;
    }

    setLoading(true);

    fetch("http://localhost:3001/api/notifications/resena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profesionalNombre,
        clienteNombre: `Cliente #${clienteId}`,
        estrellas: calificacion,
        comentario: comentario.trim(),
      }),
    }).catch((err) => console.error("No se pudo notificar la reseña:", err));

    try {
      const response = await fetch("http://localhost:3001/api/resenas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          solicitud_id: solicitudId,
          cliente_id: clienteId,
          profesional_id: profesionalId,
          calificacion,
          comentario: comentario.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje || data.error || "No se pudo enviar la calificación.",
        );
      }

      setMensajeExito(
        "¡Gracias por tu reseña! Tu opinión ayuda a la comunidad de ExpertoYa.",
      );
      setComentario("");
      if (onResenaCreada) {
        onResenaCreada();
      }
    } catch (err: any) {
      setMensajeError(
        err.message || "Ocurrió un error inesperado de conexión.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border shadow-xs">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
              Calificar a {profesionalNombre}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Servicio:{" "}
              <span className="text-foreground font-medium">
                {servicioNombre}
              </span>{" "}
              (Solicitud #{solicitudId})
            </CardDescription>
          </div>
          <span className="self-start sm:self-auto text-[11px] sm:text-xs px-2.5 py-1 bg-secondary/15 text-secondary-foreground dark:text-secondary font-semibold rounded-full border border-secondary/30">
            Closed-Loop Verificado
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">
              ¿Cómo calificarías el trabajo realizado?
            </legend>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activo =
                    (hoverPuntaje !== null ? hoverPuntaje : calificacion) >=
                    star;
                  return (
                    <label
                      key={star}
                      className="flex cursor-pointer items-center rounded-md p-1 transition-transform hover:scale-110 focus-within:ring-2 focus-within:ring-primary"
                      onMouseEnter={() => setHoverPuntaje(star)}
                      onMouseLeave={() => setHoverPuntaje(null)}
                    >
                      <input
                        type="radio"
                        name={`calificacion-${solicitudId}`}
                        value={star}
                        checked={calificacion === star}
                        onChange={() => setCalificacion(star)}
                        onFocus={() => setHoverPuntaje(star)}
                        onBlur={() => setHoverPuntaje(null)}
                        aria-label={`${star} de 5 estrellas`}
                        className="sr-only"
                      />
                      <Star
                        aria-hidden="true"
                        className={`h-6 w-6 sm:h-7 sm:w-7 transition-colors ${
                          activo
                            ? "fill-primary text-primary drop-shadow-[0_2px_8px_rgba(255,140,0,0.35)]"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </label>
                  );
                })}
              </div>
              <span
                aria-hidden="true"
                className="text-xs sm:text-sm font-bold text-primary ml-1 sm:ml-2"
              >
                {hoverPuntaje !== null ? hoverPuntaje : calificacion} de 5
                estrellas
              </span>
            </div>
          </fieldset>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="comentario" className="text-sm font-semibold">
                Cuéntanos tu experiencia
              </Label>
              <span className="text-xs text-muted-foreground">
                {comentario.length}/500
              </span>
            </div>
            <textarea
              id="comentario"
              rows={3}
              value={comentario}
              maxLength={500}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Qué tal fue la puntualidad, prolijidad y trato del profesional?"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || !!mensajeExito}
            />
          </div>

          {mensajeExito && (
            <Alert
              variant="success"
              className="animate-in fade-in duration-300"
            >
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>¡Calificación enviada!</AlertTitle>
              <AlertDescription>{mensajeExito}</AlertDescription>
            </Alert>
          )}

          {mensajeError && (
            <Alert
              variant="destructive"
              className="animate-in fade-in duration-300"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atención</AlertTitle>
              <AlertDescription>{mensajeError}</AlertDescription>
            </Alert>
          )}

          <CardFooter className="px-0 pb-0 pt-2 flex flex-col sm:flex-row justify-end">
            <Button
              type="submit"
              disabled={loading || !!mensajeExito}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Publicar Calificación"
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};
