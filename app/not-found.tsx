import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b17] p-4">
      <div className="max-w-md space-y-4 rounded-xl border border-white/10 bg-[#0e1530]/80 p-8 text-center">
        <p className="text-4xl font-bold text-violet-400">404</p>
        <h1 className="text-xl font-bold text-white">Page not found</h1>
        <p className="text-sm text-slate-400">
          The page you are looking for does not exist or you do not have access
          to it.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Back to projects
        </Link>
      </div>
    </div>
  );
}