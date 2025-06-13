import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const input = path.resolve(__dirname, 'output.mp4');
const output = path.resolve(__dirname, 'boomerang.mp4');

// Asegurarse de que el archivo de entrada existe
if (!fs.existsSync(input)) {
  console.error('❌ El archivo de entrada no existe:', input);
  process.exit(1);
}

ffmpeg(input)
  .videoFilters('split[a][b];[b]reverse[brev];[a][brev]concat=n=2:v=1:a=0,format=yuv420p')
  .videoCodec('libx264')
  .outputOptions('-movflags', '+faststart')
  .on('start', cmd => console.log('⏱️  FFmpeg:', cmd))
  .on('end',   ()  => console.log('✅ Listo:', output))
  .on('error', err => console.error('❌ FFmpeg falló:', err.message))
  .save(output);
