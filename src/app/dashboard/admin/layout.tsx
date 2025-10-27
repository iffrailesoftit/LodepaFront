import { getSession } from '@/actions/auth/getSession';
import AdminMenu from '@/components/admin/AdminMenu';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {

  const userSession = await getSession();
  if (userSession.rol!==1) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-3 flex flex-col"> 
        <AdminMenu />
        {children}
    </div>
  );
}