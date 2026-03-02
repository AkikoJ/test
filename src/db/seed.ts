import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { products } from './schema.js';

const sampleProducts = [
  {
    name: '高弹性防水涂料 HF-200',
    category: '防水涂料',
    specs: {
      elasticity: '300%',
      coverage: '1.5kg/m²',
      dryTime: '4小时',
      temperature: '-20°C ~ 80°C',
    },
    description:
      '高弹性聚合物防水涂料，适用于屋面、地下室、卫生间等部位的防水施工。具有优异的弹性和耐候性。',
    price: '128.00',
    tags: ['防水', '高弹性', '屋面', '地下室', '卫生间'],
  },
  {
    name: '聚氨酯防水涂料 PU-500',
    category: '防水涂料',
    specs: {
      elasticity: '500%',
      coverage: '2.0kg/m²',
      dryTime: '8小时',
      temperature: '-30°C ~ 90°C',
    },
    description:
      '双组份聚氨酯防水涂料，适用于桥梁、隧道、水池等高强度防水工程。',
    price: '258.00',
    tags: ['防水', '聚氨酯', '桥梁', '隧道', '工程级'],
  },
  {
    name: '通用型瓷砖胶 TC-100',
    category: '瓷砖胶',
    specs: {
      bondStrength: '0.5MPa',
      openTime: '20分钟',
      adjustTime: '15分钟',
      coverage: '4-6kg/m²',
    },
    description: '适用于室内墙地面普通瓷砖的粘贴，操作简便，粘结力强。',
    price: '45.00',
    tags: ['瓷砖', '粘贴', '室内', '通用'],
  },
  {
    name: '强力型瓷砖胶 TC-300',
    category: '瓷砖胶',
    specs: {
      bondStrength: '1.0MPa',
      openTime: '30分钟',
      adjustTime: '20分钟',
      coverage: '5-7kg/m²',
    },
    description:
      '适用于大规格瓷砖、石材及外墙瓷砖的粘贴，抗滑移性能优异。',
    price: '78.00',
    tags: ['瓷砖', '粘贴', '外墙', '大规格', '石材'],
  },
  {
    name: '柔性腻子粉 PJ-100',
    category: '腻子粉',
    specs: {
      fineness: '≤0.15mm',
      bondStrength: '0.4MPa',
      waterResistance: '48小时无异常',
      coverage: '1.2-1.5kg/m²',
    },
    description: '内墙柔性耐水腻子粉，批刮顺畅，打磨轻松，适合南方潮湿环境。',
    price: '32.00',
    tags: ['腻子', '内墙', '耐水', '柔性'],
  },
  {
    name: '外墙弹性腻子 PJ-300',
    category: '腻子粉',
    specs: {
      fineness: '≤0.18mm',
      bondStrength: '0.6MPa',
      elasticity: '100%',
      coverage: '1.5-2.0kg/m²',
    },
    description: '外墙弹性腻子粉，具有良好的弹性和抗裂性能，适用于外墙装饰基层处理。',
    price: '56.00',
    tags: ['腻子', '外墙', '弹性', '抗裂'],
  },
  {
    name: '自流平水泥 SLP-50',
    category: '自流平',
    specs: {
      strength: '25MPa',
      flowability: '130mm',
      walkableTime: '3小时',
      thickness: '4-50mm',
    },
    description: '高强度自流平水泥砂浆，适用于地暖回填、地面找平、PVC地板/地毯基层处理。',
    price: '88.00',
    tags: ['自流平', '找平', '地暖', '地板基层'],
  },
  {
    name: '丙烯酸外墙涂料 AE-100',
    category: '外墙涂料',
    specs: {
      gloss: '哑光',
      coverage: '0.2kg/m²',
      colors: '可调色',
      weatherResistance: '5年',
    },
    description: '经济型丙烯酸外墙涂料，色彩丰富，遮盖力好，适合普通外墙装饰。',
    price: '168.00',
    tags: ['外墙', '涂料', '丙烯酸', '经济型'],
  },
  {
    name: '氟碳外墙涂料 FE-500',
    category: '外墙涂料',
    specs: {
      gloss: '高光/哑光可选',
      coverage: '0.15kg/m²',
      colors: '可调色',
      weatherResistance: '15年',
    },
    description: '高端氟碳外墙涂料，超强耐候，自洁性好，适用于高档建筑外墙。',
    price: '458.00',
    tags: ['外墙', '涂料', '氟碳', '高端', '耐候'],
  },
  {
    name: '美缝剂 MF-200',
    category: '美缝剂',
    specs: {
      hardness: '4H',
      waterproof: '是',
      colors: '20+色',
      width: '1-6mm',
    },
    description: '双组份环氧美缝剂，硬度高、防水防霉，颜色丰富，适用于各类瓷砖缝隙填充。',
    price: '68.00',
    tags: ['美缝', '瓷砖', '防水', '防霉'],
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  console.log('Seeding products...');
  await db.insert(products).values(sampleProducts);
  console.log(`Inserted ${sampleProducts.length} products`);

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
