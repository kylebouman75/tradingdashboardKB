export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-2xl font-semibold tracking-tight">Trading OS</div>
      {children}
    </div>
  )
}
