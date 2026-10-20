/* Deterministic crops only. No application UI is generated or reconstructed. */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const audit = process.env.PORTFOLIO_SOURCE_REPOS || '/tmp/portfolio-master-audit.fyT0Zf';
async function embedded(file) {
  const svg = await fs.readFile(path.join(root, file), 'utf8');
  return Buffer.from(svg.match(/data:image\/webp;base64,([^"]+)/)[1], 'base64');
}
async function exportScreen(folder, name, input, crop) {
  const dest = path.join(root, 'assets/projects', folder);
  await fs.mkdir(dest, { recursive: true });
  let pipeline = sharp(input);
  if (crop) pipeline = pipeline.extract(crop);
  const pixels = await pipeline.png().toBuffer();
  const meta = await sharp(pixels).metadata();
  await fs.writeFile(path.join(dest, `${name}-source.png`), pixels);
  for (const width of [...new Set([Math.min(640, meta.width), meta.width])]) {
    await sharp(pixels).resize({ width }).webp({ quality: 92 }).toFile(path.join(dest, `${name}-${width}.webp`));
  }
  console.log(`${folder}/${name}: ${meta.width}×${meta.height}`);
}
(async () => {
  await exportScreen('chatra', 'classroom', path.join(root, 'img/chatraweb.jpg'), { left:297, top:241, width:1060, height:662 });
  await exportScreen('chatra', 'mobile-classes', path.join(root, 'img/video-posters/mainscreen.jpg'));
  await exportScreen('soyle', 'adaptive-plan', path.join(audit, 'Soyle/docs/screenshots/adaptive-plan.png'));
  await exportScreen('soyle', 'landing', path.join(root, 'img/soyle-home.jpg'));
  await exportScreen('digital-urpaq', 'discovery', path.join(root, 'img/digital-urpaq.jpg'), { left:297, top:241, width:1060, height:662 });
  await exportScreen('freelanceos', 'finance-mobile', path.join(root, 'img/freelanceOS.jpg'), { left:938, top:72, width:392, height:841 });
  await exportScreen('rugpull', 'risk-dashboard', await embedded('img/crypto-macbook-card.svg'));
  await exportScreen('chatra', 'api-reference', path.join(root, 'img/fastqpi.jpg'), { left:297, top:241, width:1060, height:662 });
})();
