import { redirect } from 'next/navigation'

export default function HomePage() {
  // Por ahora redirigimos directamente al dashboard
  // Más adelante aquí será la página de login
  redirect('/dashboard')
}