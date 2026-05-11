export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page text-ink flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
