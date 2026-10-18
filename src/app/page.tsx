import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ExamWorkspace from '@/components/ExamWorkspace';

export const metadata = {
  title: 'ExamCraft - Không Gian Soạn Đề AI Cho Giáo Viên',
  description: 'Trợ lý AI biên soạn đề thi, tổ chức khảo thí trực tuyến chuẩn GDPT 2018 theo phong cách Google Workspace tối giản.',
};

async function AuthenticatedWorkspace() {
  const user = await getCurrentUser();

  // Bắt buộc xác thực: Nếu chưa đăng nhập, chuyển hướng ngay về trang Đăng nhập
  if (!user) {
    redirect('/login?redirect=/');
  }

  return <ExamWorkspace currentUser={user} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#F8F9FA] dark:bg-[#181818] flex items-center justify-center text-sm font-medium text-[#5f6368] dark:text-[#9aa0a6]">
          Đang tải không gian soạn đề ExamCraft...
        </div>
      }
    >
      <AuthenticatedWorkspace />
    </Suspense>
  );
}
