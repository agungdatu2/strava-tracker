import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
      <p className="text-6xl">🏃</p>
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground text-sm">Sepertinya kamu tersesat di jalur yang salah.</p>
      <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
