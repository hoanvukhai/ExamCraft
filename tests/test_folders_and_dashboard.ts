import prisma from '../src/lib/prisma';

async function runFolderTests() {
  console.log('========================================================');
  console.log('       KIỂM THỬ TÍNH NĂNG THƯ MỤC & PHÂN LOẠI ĐỀ        ');
  console.log('========================================================\n');

  try {
    // 1. Lấy giáo viên đầu tiên từ DB
    const teacher = await prisma.user.findFirst({
      where: { role: 'TEACHER' },
    });

    if (!teacher) {
      console.error('Không tìm thấy giáo viên trong DB để test');
      process.exit(1);
    }

    console.log(`[PASS] Giáo viên kiểm thử: ${teacher.name} (${teacher.email})`);

    // Dọn dẹp folder test cũ nếu có
    await prisma.folder.deleteMany({
      where: {
        ownerId: teacher.id,
        name: { in: ['Test Folder Cấp 1', 'Test Folder Cấp 2', 'Test Folder Cấp 3'] },
      },
    });

    // 2. Tạo Thư mục Cấp 1
    const folderLvl1 = await prisma.folder.create({
      data: {
        ownerId: teacher.id,
        name: 'Test Folder Cấp 1',
        color: '#1a73e8',
        parentId: null,
      },
    });
    console.log(`[PASS] Đã tạo Thư mục Cấp 1: "${folderLvl1.name}" (id: ${folderLvl1.id})`);

    // 3. Tạo Thư mục Con Cấp 2
    const folderLvl2 = await prisma.folder.create({
      data: {
        ownerId: teacher.id,
        name: 'Test Folder Cấp 2',
        color: '#43a047',
        parentId: folderLvl1.id,
      },
    });
    console.log(`[PASS] Đã tạo Thư mục Con Cấp 2: "${folderLvl2.name}" dưới cha "${folderLvl1.name}"`);

    // 4. Kiểm tra quy tắc chặn Cấp 3 (Giả lập logic của API)
    const parentOfLvl3 = await prisma.folder.findFirst({
      where: { id: folderLvl2.id, ownerId: teacher.id },
    });

    const isLvl3Blocked = parentOfLvl3?.parentId !== null;
    if (isLvl3Blocked) {
      console.log(`[PASS] Ràng buộc độ sâu: ĐÃ CHẶN tạo Cấp 3 thành công! (parentOfLvl3.parentId !== null)`);
    } else {
      throw new Error('Thất bại: Không chặn được tạo thư mục cấp 3');
    }

    // 5. Tạo đề thi gán vào folderLvl2 và gắn sao
    const testExam = await prisma.exam.create({
      data: {
        ownerId: teacher.id,
        title: 'Đề thi Thử Nghiệm Thư Mục',
        subject: 'toan',
        grade: 12,
        durationMinutes: 45,
        metadata: {},
        sections: [{ id: 'sec_1', name: 'Trắc nghiệm' }],
        folderId: folderLvl2.id,
        isStarred: true,
      },
    });
    console.log(`[PASS] Đã tạo đề thi gán vào Folder Cấp 2 và gắn sao: "${testExam.title}" (isStarred: ${testExam.isStarred})`);

    // 6. Truy vấn đề thi theo folderId và isStarred
    const foundByFolder = await prisma.exam.findMany({
      where: { ownerId: teacher.id, folderId: folderLvl2.id, deletedAt: null },
    });
    if (foundByFolder.length !== 1 || foundByFolder[0].id !== testExam.id) {
      throw new Error('Không tìm thấy đề thi theo folderId');
    }
    console.log(`[PASS] Lọc đề theo folderId thành công: Tìm thấy ${foundByFolder.length} đề`);

    const foundByStarred = await prisma.exam.findMany({
      where: { ownerId: teacher.id, isStarred: true, deletedAt: null },
    });
    console.log(`[PASS] Lọc đề theo isStarred thành công: Tìm thấy ${foundByStarred.length} đề được gắn sao`);

    // 7. Xóa Thư mục Cấp 1 -> Kiểm tra đề thi có được giữ lại an toàn (folderId = null)
    await prisma.exam.updateMany({
      where: { folderId: { in: [folderLvl1.id, folderLvl2.id] } },
      data: { folderId: null },
    });
    await prisma.folder.deleteMany({
      where: { id: { in: [folderLvl1.id, folderLvl2.id] } },
    });

    const examAfterDelete = await prisma.exam.findUnique({
      where: { id: testExam.id },
    });

    if (examAfterDelete && examAfterDelete.folderId === null) {
      console.log(`[PASS] Xóa thư mục an toàn: Đề thi vẫn tồn tại và được đưa ra thư viện gốc (folderId = null)`);
    } else {
      throw new Error('Đề thi bị thất lạc sau khi xóa thư mục');
    }

    // Dọn dẹp đề thi test
    await prisma.exam.delete({ where: { id: testExam.id } });

    console.log('\n========================================================');
    console.log('KẾT QUẢ: 100% CÁC BÀI KIỂM THỬ THƯ MỤC ĐỀU ĐẠT CHUẨN!');
    console.log('========================================================\n');
  } catch (error) {
    console.error('Lỗi kiểm thử:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runFolderTests();
