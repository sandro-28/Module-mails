import { Mail } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Logo / Branding */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
          MailForge
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Email marketing platform
        </p>
      </div>

      {/* Auth card container */}
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} MailForge. All rights reserved.
      </p>
    </div>
  )
}
