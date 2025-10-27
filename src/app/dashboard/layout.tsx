// import { getSession } from '@/actions/auth/getSession';
// import { redirect } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import Navbar from '../../components/general/navbar/Navbar';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {

  // const userSession = await getSession();
  // if (!userSession) {
  //   redirect('/login');
  // }


  return (
    <>
      <Navbar />
      <div className='container mx-auto px-4 py-3 flex items-center justify-between'>
        {children}
      </div>
      <Toaster />
    </>
  );
}