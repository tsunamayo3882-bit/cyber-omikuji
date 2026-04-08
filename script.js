// --- 1. 初期設定 & BBSログ演出 ---
const dummyLogs = [
    "[LOG: A5B2] Input: 少し疲れた -> Result: ミルクを推奨",
    "[LOG: 1940] Input: やる気が出ない -> Result: 強炭酸を推奨",
    "[LOG: FF22] Input: 成功したい -> Result: ブラックコーヒーを推奨"
];

function addBbsLog(text) {
    const logList = document.getElementById('logList');
    const newLog = document.createElement('div');
    newLog.innerText = text;
    logList.prepend(newLog);
}

dummyLogs.forEach(log => addBbsLog(log));

setInterval(() => {
    if (Math.random() > 0.7) {
        const randCode = Math.random().toString(16).substr(2, 4).toUpperCase();
        addBbsLog(`[LOG: ${randCode}] Waiting for next user...`);
    }
}, 5000);

// --- 2. 背景色ロジック（こだわり演出） ---
function getBackgroundColor(text) {
    if (text.includes("ソーダ") || text.includes("青") || text.includes("ラムネ")) return "#e0f7fa"; 
    if (text.includes("お茶") || text.includes("緑") || text.includes("メロン")) return "#f1f8e9"; 
    if (text.includes("ミルク") || text.includes("白") || text.includes("カルピス")) return "#ffffff"; 
    if (text.includes("コーラ") || text.includes("黒") || text.includes("コーヒー")) return "#efebe9"; 
    if (text.includes("イチゴ") || text.includes("赤") || text.includes("ベリー")) return "#fce4ec"; 
    return "#f5f5f5"; 
}

// --- 3. サウンド演出 ---
const seTyping = document.getElementById('seTyping');
const seClick = document.getElementById('seClick');
const seComplete = document.getElementById('seComplete');

function playSe(audioElement) {
    audioElement.currentTime = 0;
    audioElement.play().catch(e => console.log("Sound blocked"));
}

function startTypingSe() {
    seTyping.loop = true;
    seTyping.play().catch(e => console.log("Sound blocked"));
}

function stopTypingSe() {
    seTyping.loop = false;
    seTyping.pause();
    seTyping.currentTime = 0;
}

// --- 4. タイピング演出（ルビ/HTML対応） ---
async function typeWriter(element, text, speed = 30) {
    element.innerHTML = "";
    startTypingSe();
    let i = 0;
    while (i < text.length) {
        if (text[i] === "<") {
            let tagEnd = text.indexOf(">", i);
            element.innerHTML += text.substring(i, tagEnd + 1);
            i = tagEnd + 1;
        } else {
            element.innerHTML += text[i] === "\n" ? "<br>" : text[i];
            i++;
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }
    stopTypingSe();
    playSe(seComplete);
}

// --- 5. メイン処理：バックエンドAPI呼び出し ---
document.getElementById('submitBtn').addEventListener('click', async function() {
    playSe(seClick);
    const userInput = document.getElementById('userInput').value;
    const resultArea = document.getElementById('resultArea');
    const loading = document.getElementById('loading');
    const receiptWrapper = document.getElementById('receiptWrapper');
    const philosophy = document.getElementById('philosophy');

    if (!userInput) return alert('気分を入力してください。');

    // UI初期化
    resultArea.classList.remove('hidden');
    loading.classList.remove('hidden');
    receiptWrapper.classList.add('hidden');

    try {
        // バックエンド（api/chat.js）を叩く
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `
                あなたは「電脳おみくじ」です。システムログ風に、中学生でも分かる言葉で答えて。
                入力「${userInput}」に対し、以下の構成で出力して。
                1. 魂のデバッグ（哲学的な短い助言）:
                2. 適合する液体（飲み物とその理由）:
                3. 接続コード: 【 4桁の英数字 】
                `
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        let text = data.text.replace(/```html|```/g, '');

        loading.classList.add('hidden');
        receiptWrapper.classList.remove('hidden');

        // 背景色演出（BodyとContainer両方）
        const bgColor = getBackgroundColor(text);
        document.body.style.backgroundColor = bgColor;
        const container = document.querySelector('.container');
        if(container) container.style.backgroundColor = bgColor;

        // タイピング開始
        await typeWriter(philosophy, text, 40);
        
        // BBSログに追加（コードを抽出）
        const codeMatch = text.match(/【 ([A-Z0-9]{4}) 】/);
        const code = codeMatch ? codeMatch[1] : "XXXX";
        addBbsLog(`[LOG: ${code}] Input: ${userInput.substring(0,10)}... Analysis Complete.`);

    } catch (error) {
        console.error(error);
        philosophy.innerText = "通信遮断。再起動を推奨。";
    }
});

// --- 6. サブ機能（再起動・画像生成・シェア） ---
document.getElementById('retryBtn').addEventListener('click', () => {
    playSe(seClick);
    location.reload(); 
});

document.getElementById('shareBtn').addEventListener('click', () => {
    playSe(seClick);
    const receipt = document.getElementById('receiptContainer');
    const btnArea = document.getElementById('retryBtnArea');
    
    btnArea.style.display = 'none';

    html2canvas(receipt, { backgroundColor: null, scale: 2 }).then(canvas => {
        const generatedImage = document.getElementById('generatedImage');
        generatedImage.src = canvas.toDataURL("image/png");
        document.getElementById('imageModal').classList.remove('hidden');
        btnArea.style.display = 'flex';
    });
});

// SNS共有ボタン（スマホ・PC切り分け対応）
document.getElementById('share-btn')?.addEventListener('click', async () => {
    const shareData = {
        title: '電脳おみくじ - Cyber Oracle',
        text: 'AIが私の魂をデバッグした結果、最適飲料はこれでした。',
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
            window.open(twitterUrl, '_blank');
        }
    } catch (err) {
        console.error('Share failed:', err);
    }
});

document.getElementById('closeModal').addEventListener('click', () => {
    playSe(seClick);
    document.getElementById('imageModal').classList.add('hidden');
});