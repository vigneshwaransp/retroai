const fs = require('fs');
const https = require('https');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url} -> ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  
  try {
    await download('https://media.giphy.com/media/l3q2t2Ka5wQ1tG9vG/giphy.gif', path.join(publicDir, 'robot-video.gif'));
    await download('https://media.giphy.com/media/l3q2t2Ka5wQ1tG9vG/giphy.mp4', path.join(publicDir, 'robot-video.mp4'));
    console.log('All downloads succeeded.');
  } catch (err) {
    console.error('Download failed:', err);
  }
}

main();
