const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tasarım yükleme ve analiz
app.post('/upload', upload.single('design'), async (req, res) => {
  try {
    const image = sharp(req.file.path);
    const metadata = await image.metadata();
    const analysis = await analyzeDesign(req.file.path, metadata);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tasarım analizi fonksiyonları
async function analyzeDesign(imagePath, metadata) {
  const stats = await sharp(imagePath).stats();
  
  // Renk analizi
  const colorAnalysis = {
    dominantColors: stats.channels.map((channel, index) => ({
      channel: ['red', 'green', 'blue'][index],
      mean: channel.mean,
      std: channel.std
    })),
    colorBalance: calculateColorBalance(stats)
  };
  
  // Kompozisyon analizi
  const compositionAnalysis = {
    aspectRatio: metadata.width / metadata.height,
    balance: analyzeBalance(stats),
    contrast: calculateContrast(stats)
  };
  
  return {
    colorAnalysis,
    compositionAnalysis,
    recommendations: generateRecommendations(colorAnalysis, compositionAnalysis)
  };
}

function calculateColorBalance(stats) {
  // Renk dengesi hesaplama
  const channels = stats.channels;
  const totalMean = channels.reduce((sum, ch) => sum + ch.mean, 0);
  return channels.map(ch => (ch.mean / totalMean) * 100);
}

function analyzeBalance(stats) {
  // Görsel denge analizi
  const leftWeight = stats.channels.map(ch => ch.mean).reduce((a, b) => a + b);
  const rightWeight = stats.channels.map(ch => ch.std).reduce((a, b) => a + b);
  return Math.abs(leftWeight - rightWeight) / ((leftWeight + rightWeight) / 2);
}

function calculateContrast(stats) {
  // Kontrast hesaplama
  return stats.channels.reduce((max, ch) => 
    Math.max(max, ch.max - ch.min), 0);
}

function generateRecommendations(colorAnalysis, compositionAnalysis) {
  const recommendations = [];
  
  // Renk önerileri
  if (Math.max(...colorAnalysis.colorBalance) > 50) {
    recommendations.push('Renk dağılımını daha dengeli hale getirmeyi düşünebilirsiniz.');
  }
  
  // Kompozisyon önerileri
  if (compositionAnalysis.balance > 0.2) {
    recommendations.push('Görsel elemanları daha dengeli yerleştirmeyi deneyebilirsiniz.');
  }
  
  if (compositionAnalysis.contrast < 50) {
    recommendations.push('Kontrastı artırarak tasarımınızı daha etkili hale getirebilirsiniz.');
  }
  
  return recommendations;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`DijiTasarım ${port} portunda çalışıyor`);
});