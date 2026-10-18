import { PrismaClient, Role, AiKeyStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...');

  // 1. Tạo tài khoản SUPER_ADMIN đầu tiên
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@examcraft.local';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'AdminPassword2026@';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Quản Trị Viên Hệ Thống',
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
      mustChangePassword: true,
      aiDailyLimit: 500,
    },
  });

  console.log(`✅ Đã khởi tạo Super Admin: ${admin.email} (id: ${admin.id})`);

  // 2. Khởi tạo trạng thái 7 AI Keys
  const keyAliases = ['key1', 'key2', 'key3', 'key4', 'key5', 'key6', 'key7'];
  for (const alias of keyAliases) {
    await prisma.aiKeyState.upsert({
      where: { alias },
      update: {},
      create: {
        alias,
        status: AiKeyStatus.ACTIVE,
        dailyCount: 0,
      },
    });
  }
  console.log('✅ Đã khởi tạo trạng thái cho 7 Gemini API Keys (key1 -> key7)');

  // 3. Khởi tạo các mẫu cấu trúc đề thi hệ thống (ExamTemplate)
  const templates = [
    {
      name: 'Đề thi Tốt nghiệp THPT — Môn Toán (Chuẩn QĐ 764/QĐ-BGDĐT)',
      subject: 'toan',
      gradeFrom: 10,
      gradeTo: 12,
      isSystem: true,
      sections: [
        {
          id: 'part_1',
          name: 'Phần I: Câu trắc nghiệm nhiều phương án lựa chọn',
          instruction: 'Mỗi câu hỏi chỉ chọn một phương án trả lời đúng. Mỗi câu đúng được 0,25 điểm.',
          type: 'MULTIPLE_CHOICE',
          questionCount: 12,
          pointsPerQuestion: 0.25,
          totalPoints: 3.0,
        },
        {
          id: 'part_2',
          name: 'Phần II: Câu trắc nghiệm Đúng / Sai',
          instruction: 'Thí sinh trả lời Đúng hoặc Sai cho mỗi ý a, b, c, d. Điểm tối đa mỗi câu là 1,0 điểm.',
          type: 'TRUE_FALSE_GROUP',
          questionCount: 4,
          progressiveScoring: [0.0, 0.1, 0.25, 0.5, 1.0],
          totalPoints: 4.0,
        },
        {
          id: 'part_3',
          name: 'Phần III: Câu trắc nghiệm trả lời ngắn',
          instruction: 'Thí sinh điền kết quả vào ô trả lời. Mỗi câu đúng được 0,5 điểm.',
          type: 'SHORT_ANSWER',
          questionCount: 6,
          pointsPerQuestion: 0.5,
          totalPoints: 3.0,
        },
      ],
    },
    {
      name: 'Đề thi Tốt nghiệp THPT — Môn Vật lí (Chuẩn QĐ 764/QĐ-BGDĐT)',
      subject: 'vat_ly',
      gradeFrom: 10,
      gradeTo: 12,
      isSystem: true,
      sections: [
        {
          id: 'part_1',
          name: 'Phần I: Câu trắc nghiệm nhiều phương án lựa chọn',
          instruction: 'Mỗi câu hỏi chỉ chọn một phương án trả lời đúng. Mỗi câu đúng được 0,25 điểm.',
          type: 'MULTIPLE_CHOICE',
          questionCount: 18,
          pointsPerQuestion: 0.25,
          totalPoints: 4.5,
        },
        {
          id: 'part_2',
          name: 'Phần II: Câu trắc nghiệm Đúng / Sai',
          instruction: 'Thí sinh trả lời Đúng hoặc Sai cho mỗi ý a, b, c, d.',
          type: 'TRUE_FALSE_GROUP',
          questionCount: 4,
          progressiveScoring: [0.0, 0.1, 0.25, 0.5, 1.0],
          totalPoints: 4.0,
        },
        {
          id: 'part_3',
          name: 'Phần III: Câu trắc nghiệm trả lời ngắn',
          instruction: 'Thí sinh điền kết quả vào ô trả lời. Mỗi câu đúng được 0,25 điểm.',
          type: 'SHORT_ANSWER',
          questionCount: 6,
          pointsPerQuestion: 0.25,
          totalPoints: 1.5,
        },
      ],
    },
    {
      name: 'Đề thi Tốt nghiệp THPT — Môn Hóa học (Chuẩn QĐ 764/QĐ-BGDĐT)',
      subject: 'hoa_hoc',
      gradeFrom: 10,
      gradeTo: 12,
      isSystem: true,
      sections: [
        {
          id: 'part_1',
          name: 'Phần I: Câu trắc nghiệm nhiều phương án lựa chọn',
          type: 'MULTIPLE_CHOICE',
          questionCount: 18,
          pointsPerQuestion: 0.25,
          totalPoints: 4.5,
        },
        {
          id: 'part_2',
          name: 'Phần II: Câu trắc nghiệm Đúng / Sai',
          type: 'TRUE_FALSE_GROUP',
          questionCount: 4,
          progressiveScoring: [0.0, 0.1, 0.25, 0.5, 1.0],
          totalPoints: 4.0,
        },
        {
          id: 'part_3',
          name: 'Phần III: Câu trắc nghiệm trả lời ngắn',
          type: 'SHORT_ANSWER',
          questionCount: 6,
          pointsPerQuestion: 0.25,
          totalPoints: 1.5,
        },
      ],
    },
    {
      name: 'Đề thi Tốt nghiệp THPT — Môn Tiếng Anh (Chuẩn 40 câu)',
      subject: 'tieng_anh',
      gradeFrom: 10,
      gradeTo: 12,
      isSystem: true,
      sections: [
        {
          id: 'part_1',
          name: 'Phần trắc nghiệm 4 lựa chọn (40 câu)',
          type: 'MULTIPLE_CHOICE',
          questionCount: 40,
          pointsPerQuestion: 0.25,
          totalPoints: 10.0,
        },
      ],
    },
  ];

  for (const tpl of templates) {
    const existing = await prisma.examTemplate.findFirst({
      where: { name: tpl.name, isSystem: true },
    });
    if (!existing) {
      await prisma.examTemplate.create({
        data: tpl,
      });
    }
  }
  console.log(`✅ Đã khởi tạo ${templates.length} mẫu cấu trúc đề thi hệ thống chuẩn.`);

  console.log('🎉 Hoàn tất quá trình Seeding thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
