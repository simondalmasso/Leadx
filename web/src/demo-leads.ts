import type { Contact } from "./types";

const now = Date.now();
const ago = (days: number, hours = 0) => new Date(now - ((days * 24 + hours) * 60 * 60 * 1000)).toISOString();

export const DEMO_CONTACTS: Contact[] = [
  ["Lucía Torres", "Nómada Studio", "lucia@nomada.demo", "+54 9 11 5555 0101", "Calificado", "Formulario web", "Enviar propuesta de identidad visual", 0, 4],
  ["Martín Acosta", "Brava Café", "martin@brava.demo", "+54 9 341 555 0122", "Propuesta", "Referido", "Confirmar presupuesto y fecha de implementación", 0, 9],
  ["Sofía Herrera", "Lumen Arquitectura", "sofia@lumen.demo", "+54 9 342 555 0148", "Contactado", "Instagram", "Retomar conversación el martes", 1, 2],
  ["Tomás Rivas", "Surco Tech", "tomas@surco.demo", "+54 9 351 555 0190", "Nuevo", "Landing", "Primera llamada de descubrimiento", 1, 8],
  ["Camila Méndez", "Casa Norte", "camila@casanorte.demo", "+54 9 261 555 0184", "Cliente", "Evento", "Revisión mensual de resultados", 2, 3],
  ["Agustín Vidal", "Ronda Legal", "agustin@ronda.demo", "+54 9 11 5555 0166", "Calificado", "LinkedIn", "Compartir caso de uso del equipo comercial", 2, 10],
  ["Valentina Paz", "Atelier 44", "valentina@atelier44.demo", "+54 9 342 555 0117", "Pausado", "Referido", "Revisar nuevamente el mes próximo", 3, 1],
  ["Nicolás Serra", "Marea Commerce", "nicolas@marea.demo", "+54 9 341 555 0150", "Contactado", "WhatsApp", "Enviar integración disponible", 3, 7],
  ["Julieta Bianchi", "Cauce Salud", "julieta@cauce.demo", "+54 9 11 5555 0131", "Nuevo", "Formulario web", "Calificar necesidad y tamaño de equipo", 4, 0],
  ["Federico Luna", "Delta Obras", "federico@delta.demo", "+54 9 351 555 0175", "Propuesta", "Google", "Resolver observaciones del contrato", 4, 8],
  ["Paula Álvarez", "Mono Estudio", "paula@mono.demo", "+54 9 342 555 0189", "Cliente", "Referido", "Pedir testimonio del onboarding", 5, 5],
  ["Renzo Gómez", "Terracota", "renzo@terracota.demo", "+54 9 261 555 0108", "Calificado", "Newsletter", "Agendar demo con socio", 6, 3],
].map(([name, company, email, phone, status, source, next_action, days, hours], index) => ({
  id: `demo-${index + 1}`,
  name: String(name),
  company: String(company),
  email: String(email),
  phone: String(phone),
  status: status as Contact["status"],
  source: String(source),
  notes: index % 3 === 0 ? "Contacto ficticio de la demo pública. Ningún dato de esta vista pertenece a una persona real." : "",
  next_action: String(next_action),
  created_at: ago(Number(days), Number(hours)),
  updated_at: ago(Number(days), Number(hours)),
  demo: true,
}));
