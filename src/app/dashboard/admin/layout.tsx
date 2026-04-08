import { getSession } from '@/actions/auth/getSession';
import AdminMenu from '@/components/admin/AdminMenu';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {

  const userSession = await getSession();
  if (![1, 2, 4].includes(userSession.rol)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-3 flex flex-col"> 
        <AdminMenu rol={userSession.rol} />
        {children}
    </div>
  );
}