export const mostrarModalAviso = (mensaje: string, titulo = 'Aviso') => {
  window.dispatchEvent(new CustomEvent('app:mostrar-aviso', { detail: { mensaje, titulo } }));
};
