import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { TeacherDashboard } from '@/components/TeacherDashboard';

export const metadata = {
  title: 'ExamCraft - Kho Đề & Quản Lý Đề Thi Giáo Viên',
  description: 'Không gian quản lý thư mục đề thi, ngân hàng câu hỏi và biên soạn đề kiểm tra chuẩn GDPT 2018.',
};

async function AuthenticatedDashboard() {
  const user = await getCurrentUser();

  // Bắt buộc xác thực: Nếu chưa đăng nhập, chuyển hướng ngay về trang Đăng nhập
  if (!user) {
    redirect('/login?redirect=/');
  }
  if (user.mustChangePassword) redirect('/login?change=required');

  return <TeacherDashboard currentUser={user} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#F8F9FA] dark:bg-[#17181a] flex items-center justify-center text-sm font-medium text-[#5f6368] dark:text-[#9aa0a6]">
          Đang tải kho đề thi ExamCraft...
        </div>
      }
    >
      <AuthenticatedDashboard />
    </Suspense>
  );
}
