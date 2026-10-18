// Estado de carga mientras se confirma si hay una sesión abierta (ver AuthContext).
// Evita mandar a iniciar sesión a quien ya la tiene, o mostrar su pantalla antes de comprobarlo.
export default function CargandoSesion() {
  return (
    <div className="flex flex-col items-center px-4 py-16">
      <p role="status" className="text-slate-600 text-sm">
        Verificando tu sesión…
      </p>
    </div>
  );
}
