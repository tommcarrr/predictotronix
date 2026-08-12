import '@/styles/ceefax.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-ceefax-background min-h-screen flex items-center justify-center p-4">
      {children}
    </div>
  );
}
