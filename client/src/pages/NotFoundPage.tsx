
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900">
      <h1 className="text-5xl font-extrabold tracking-tight">404</h1>
      <p className="mt-4 text-xl">Page not found.</p>
      <p className="mt-2 text-sm text-slate-600">
        The page you are looking for does not exist or has been moved.
      </p>
    </div>
  )
}
