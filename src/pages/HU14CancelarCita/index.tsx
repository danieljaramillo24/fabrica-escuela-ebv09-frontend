import { useEffect, useRef, useState } from 'react';
import DialogoConfirmacion from '../../components/DialogoConfirmacion';
import { useAuth } from '../../hooks/useAuth';
import { ApiError, getErrorMessage } from '../../services/api';
import { cancelarCita } from '../../services/citas.service';
import type { Cita } from '../../types/cita';
import { fechaCorta, hora12 } from '../../utils/fechas';

interface CancelarCitaDialogoProps {
  cita: Cita;
  /** La persona decidió mantener la cita (escenario 3) o cerró el diálogo */
  onMantener: () => void;
  /** La cita quedó cancelada y el horario liberado (escenario 1) */
  onCancelada: () => void;
}

// HU-14 — Cancelar cita: PUT /api/citas/{id}/cancelar. No es una pantalla con ruta propia: se abre
// desde "Mis citas" (HU-13) como diálogo de confirmación. Solo el dueño de la cita puede cancelarla;
// el servidor valida también si la cita admite cancelación (ya cancelada, ya ocurrida o fuera del
// periodo permitido) y responde 409 en ese caso.
export default function CancelarCitaDialogo({ cita, onMantener, onCancelada }: CancelarCitaDialogoProps) {
  const { cerrarSesion } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);

  async function confirmar() {
    if (enviando) return;
    setError(null);

    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setEnviando(true);

    try {
      await cancelarCita(cita.idCita, controlador.signal);
      onCancelada();
    } catch (falla) {
      if (falla instanceof DOMException && falla.name === 'AbortError') return;
      if (falla instanceof ApiError && falla.status === 401) {
        cerrarSesion();
        return;
      }
      setError(getErrorMessage(falla));
      setEnviando(false);
    }
  }

  return (
    <DialogoConfirmacion
      titulo="¿Cancelar esta cita?"
      descripcion="Esta acción no se puede deshacer. Se liberará el horario para otras personas."
      textoConfirmar="Sí, cancelar cita"
      textoCancelar="Mantener cita"
      peligro
      enviando={enviando}
      error={error}
      onConfirmar={confirmar}
      onCancelar={onMantener}
    >
      <p>
        {cita.especialidad} · {cita.especialista}
      </p>
      <p>
        {fechaCorta(cita.fecha)} · {hora12(cita.hora)}
      </p>
    </DialogoConfirmacion>
  );
}
