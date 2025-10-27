export default function loginLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex justify-center items-center h-dvh bg-gray-100">
      {children}
    </main>
  );
}