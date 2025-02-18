document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const analysisSection = document.getElementById('analysis-section');
    const fileInput = document.getElementById('design-file');
    const fileLabel = fileInput.nextElementSibling;

    // Dosya seçildiğinde etiket metnini güncelle
    fileInput.addEventListener('change', (e) => {
        const fileName = e.target.files[0]?.name || 'Dosya Seç';
        fileLabel.textContent = fileName;
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        
        if (!fileInput.files[0]) {
            alert('Lütfen bir tasarım dosyası seçin.');
            return;
        }

        formData.append('design', fileInput.files[0]);
        
        try {
            const uploadButton = uploadForm.querySelector('button');
            uploadButton.disabled = true;
            uploadButton.textContent = 'Analiz Ediliyor...';

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Yükleme sırasında bir hata oluştu');
            }

            const analysis = await response.json();
            displayAnalysis(analysis);
            analysisSection.classList.remove('hidden');
            
            uploadButton.disabled = false;
            uploadButton.textContent = 'Analiz Et';
        } catch (error) {
            console.error('Hata:', error);
            alert('Analiz sırasında bir hata oluştu: ' + error.message);
            
            const uploadButton = uploadForm.querySelector('button');
            uploadButton.disabled = false;
            uploadButton.textContent = 'Analiz Et';
        }
    });

    function displayAnalysis(analysis) {
        // Renk analizi sonuçları
        const colorResults = document.getElementById('color-results');
        const colorPalette = document.createElement('div');
        colorPalette.className = 'color-palette';
        
        analysis.colorAnalysis.dominantColors.forEach(color => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            colorItem.style.backgroundColor = `rgb(${color.mean}, ${color.mean}, ${color.mean})`;
            colorItem.innerHTML = `<span>${color.channel}: ${Math.round(color.mean)}</span>`;
            colorPalette.appendChild(colorItem);
        });
        
        colorResults.innerHTML = '';
        colorResults.appendChild(colorPalette);

        // Kompozisyon analizi sonuçları
        const compositionResults = document.getElementById('composition-results');
        compositionResults.innerHTML = `
            <ul>
                <li>En-Boy Oranı: ${analysis.compositionAnalysis.aspectRatio.toFixed(2)}</li>
                <li>Denge Değeri: ${analysis.compositionAnalysis.balance.toFixed(2)}</li>
                <li>Kontrast Seviyesi: ${analysis.compositionAnalysis.contrast.toFixed(2)}</li>
            </ul>
        `;

        // Öneriler
        const recommendationsList = document.getElementById('recommendations-list');
        recommendationsList.innerHTML = `
            <ul>
                ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    }
});