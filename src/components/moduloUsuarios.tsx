import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PerfilUsuario {
    id: number;
    nombreCompleto: string;
    email: string;
    rol: "cliente" | "profesional";
    oficio?: string;
    zona: string;
    matricula?: string;
    hashSimulado: string;
}

export function ModuloUsuarios() {
    const [perfiles, setPerfiles] = useState<PerfilUsuario[]>([
    {
        id: 1,
        nombreCompleto: "Martín Benítez",
        email: "martin.benitez@expertoya.com",
        rol: "profesional",
        oficio: "Plomería y Gas",
        zona: "Neuquén Capital y alrededores",
        matricula: "MAT-8842-NQN",
        hashSimulado: "$2a$10$X8k9...7fE2",
        },
        {
        id: 2,
        nombreCompleto: "Clara Rossi",
        email: "clara.rossi@expertoya.com",
        rol: "profesional",
        oficio: "Electricidad Integral",
        zona: "Cipolletti y Plottier",
        matricula: "MAT-5190-RN",
        hashSimulado: "$2a$10$Q9m1...3aB8",
        },
    ]);

    const [nombreCompleto, setNombreCompleto] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState<"cliente" | "profesional">("profesional");
    const [oficio, setOficio] = useState("");
    const [zona, setZona] = useState("");
    const [perfilSeleccionado, setPerfilSeleccionado] =
        useState<PerfilUsuario | null>(perfiles[0]);
    const [mensajeExito, setMensajeExito] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mensajeError, setMensajeError] = useState("");
    const [anuncioRol, setAnuncioRol] = useState("");

    const manejarCambioRol = (nuevoRol: "cliente" | "profesional") => {
        setRol(nuevoRol);
        setAnuncioRol(
        nuevoRol === "cliente"
            ? "Rol actualizado a cliente. Ya no se requiere el oficio o especialidad."
            : "Rol actualizado a profesional. El campo oficio o especialidad está disponible.",
        );
    };

    const manejarRegistro = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombreCompleto || !email || !password) return;

        setCargando(true);
        setMensajeError("");
        setMensajeExito("");

        try {
            const res = await fetch("http://localhost:3001/api/usuarios/registro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombreCompleto, email, password, rol, oficio, zona }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "No se pudo registrar el usuario.");
            }

            // Si el backend respondió OK, mostramos el perfil como antes
            const hashGenerado = `$2a$10$${btoa(password).slice(0, 12)}...`;

            const nuevoPerfil: PerfilUsuario = {
                id: perfiles.length + 1,
                nombreCompleto,
                email,
                rol,
                oficio:
                    rol === "profesional" ? oficio || "Técnico Matriculado" : undefined,
                zona: zona || "Neuquén Capital y alrededores",
                matricula:
                    rol === "profesional"
                        ? `MAT-${Math.floor(1000 + Math.random() * 9000)}-NQN`
                        : undefined,
                hashSimulado: hashGenerado,
            };

            setPerfiles([...perfiles, nuevoPerfil]);
            setPerfilSeleccionado(nuevoPerfil);
            setMensajeExito(
                `¡Usuario ${nombreCompleto} registrado con éxito! Contraseña protegida con Bcrypt.`,
            );
            setNombreCompleto("");
            setEmail("");
            setPassword("");
            setOficio("");
            setZona("");
        } catch (err: any) {
            setMensajeError(err.message || "No se pudo conectar con el servidor.");
        } finally {
            setCargando(false);
        }
    };


    return (
        <section className="space-y-6 mt-8">
        <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
            Módulo de Gestión de Usuarios y Perfiles
            </h2>
            <p className="text-sm text-muted-foreground">
            Registro autónomo de clientes-profesionales y consulta de perfiles.
            </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
            <CardHeader>
                <CardTitle>Regístrate aquí</CardTitle>
                <CardDescription>
                Registro para clientes o profesionales
                </CardDescription>
            </CardHeader>
            <form onSubmit={manejarRegistro}>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="nombreUsuario">Nombre completo</Label>
                    <Input
                    id="nombreUsuario"
                    placeholder="Ej: Juan Perez"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="emailUsuario">Correo electrónico</Label>
                    <Input
                        id="emailUsuario"
                        type="email"
                        placeholder="usuario@expertoya.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="passUsuario">Contraseña</Label>
                    <Input
                        id="passUsuario"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="rolUsuario">Rol en la plataforma</Label>
                    <select
                        id="rolUsuario"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={rol}
                        onChange={(e) =>
                        manejarCambioRol(
                            e.target.value as "cliente" | "profesional",
                        )
                        }
                    >
                        <option value="profesional">Profesional</option>
                        <option value="cliente">Cliente</option>
                    </select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="zonaUsuario">Zona de cobertura</Label>
                    <Input
                        id="zonaUsuario"
                        placeholder="Ej: Neuquén / Cipolletti"
                        value={zona}
                        onChange={(e) => setZona(e.target.value)}
                    />
                    </div>
                </div>

                <p
                    className="sr-only"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {anuncioRol}
                </p>

                {rol === "profesional" && (
                    <div className="space-y-2">
                    <Label htmlFor="oficioUsuario">Oficio o Especialidad</Label>
                    <Input
                        id="oficioUsuario"
                        placeholder="Ej: Gasista Matriculado"
                        value={oficio}
                        onChange={(e) => setOficio(e.target.value)}
                    />
                    </div>
                )}

                {mensajeExito && (
                    <p className="text-xs font-medium text-green-700 bg-green-50 p-2.5 rounded border border-green-200">
                    {mensajeExito}
                    </p>
                )}
                {mensajeError && (
                                    <p className="text-xs font-medium text-red-700 bg-red-50 p-2.5 rounded border border-red-200">
                                        {mensajeError}
                                    </p>
                                )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={cargando}>
                        {cargando ? "Registrando..." : "Registrar Usuario"}
                    </Button>
                </CardFooter>
            </form>
            </Card>

            {/* Visor de Perfil por ID (GET /api/usuarios/:id) */}
            <Card className="flex flex-col justify-between">
            <CardHeader>
                <CardTitle>Ficha de Perfil Público</CardTitle>
                <CardDescription> Vista de Perfil </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                {perfiles.map((p) => (
                    <Button
                    key={p.id}
                    variant={
                        perfilSeleccionado?.id === p.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setPerfilSeleccionado(p)}
                    >
                    ID #{p.id}: {p.nombreCompleto}
                    </Button>
                ))}
                </div>

                {perfilSeleccionado && (
                <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                        {perfilSeleccionado.nombreCompleto}
                    </h3>
                    <span className="text-xs uppercase px-2 py-0.5 rounded bg-primary/10 font-medium">
                        {perfilSeleccionado.rol}
                    </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                    {perfilSeleccionado.email}
                    </p>
                    {perfilSeleccionado.oficio && (
                    <p className="text-sm">
                        <strong>Especialidad:</strong> {perfilSeleccionado.oficio} (
                        {perfilSeleccionado.matricula})
                    </p>
                    )}
                    <p className="text-sm">
                    <strong>Zona:</strong> {perfilSeleccionado.zona}
                    </p>
                </div>
                )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground"></CardFooter>
            </Card>
        </div>
        </section>
    );
}
