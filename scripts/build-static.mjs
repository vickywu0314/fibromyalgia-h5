import { cp, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
// 仅打包根目录工作副本；不读取 reference-static，也不发布依赖、配置和备份。
const assetDirectories = ['css', 'js', 'fonts', 'img', 'benbing-zhiliaoshi', 'bingqing-pinggu', 'fibromyalgia-adverse-reaction', 'fibromyalgia-auxiliary-exam', 'fibromyalgia-basic-info', 'fibromyalgia-condition-history', 'fibromyalgia-syndrome-differentiation', 'hebing-yaowu', 'jiwang-bingshi', 'shanshi-pinggu', 'shanshi-pinggu（全）', 'zhiliao-fangan'];
await mkdir('dist', { recursive: true });
const pages = (await readdir('.')).filter(name => name.endsWith('.html'));
for (const name of [...pages, ...assetDirectories].filter(name => existsSync(name))) {
  await cp(name, `dist/${name}`, { recursive: true });
}
console.log('静态部署文件已生成到 dist/，入口 index.html');
