import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAwugtqAy4uw5c-G8ZGeemExEYNHwWFg1U"; // ここにAPIキーを貼り付け
const genAI = new GoogleGenerativeAI(API_KEY);

// BBSのダミーログ（初期表示用）
const dummyLogs = [
    "[LOG: A5B2] Input: 少し疲れた -> Result: ミルクを推奨",
    "[LOG: 1940] Input: やる気が出ない -> Result: 強炭酸を推奨",
    "[LOG: FF22] Input: 成功したい -> Result: ブラックコーヒーを推奨"
];

// BBSログを追加する関数
function addBbsLog(text) {
    const logList = document.getElementById('logList');
    const newLog = document.createElement('div');
    newLog.innerText = text;
    logList.prepend(newLog); // 最新を上に追加
}

// 初期ダミーログを表示
dummyLogs.forEach(log => addBbsLog(log));

// BBSログを自動スクロール風に演出する（簡易実装）
setInterval(() => {
    if (Math.random() > 0.7) { // 30%の確率でダミーを追加
        const randCode = Math.random().toString(16).substr(2, 4).toUpperCase();
        addBbsLog(`[LOG: ${randCode}] Waiting for next user...`);
    }
}, 5000);

// 背景色を決定する関数（少し薄めの色に変更）
function getBackgroundColor(text) {
    if (text.includes("ソーダ") || text.includes("青")) return "#f0ffff"; // ラムネ色
    if (text.includes("お茶") || text.includes("緑")) return "#f0fff0"; // お茶色
    if (text.includes("ミルク") || text.includes("白")) return "#ffffff"; // ミルク色
    if (text.includes("コーラ") || text.includes("黒")) return "#f0f0f0"; // グレー
    return "#fdfdfd"; // デフォルト
}

// サウンドを再生する関数
const seTyping = document.getElementById('seTyping');
const seClick = document.getElementById('seClick');
const seComplete = document.getElementById('seComplete');

function playSe(audioElement) {
    audioElement.currentTime = 0; // 頭出し
    audioElement.play().catch(e => console.log("Sound play blocked.")); // ブラウザのブロック対策
}

function startTypingSe() {
    seTyping.loop = true;
    seTyping.play().catch(e => console.log("Sound play blocked."));
}

function stopTypingSe() {
    seTyping.loop = false;
    seTyping.pause();
    seTyping.currentTime = 0;
}

// ルビ対応タイピング関数（SE付き）
async function typeWriter(element, text, speed = 30) {
    element.innerHTML = "";
    startTypingSe(); // SE開始
    
    let i = 0;
    while (i < text.length) {
        if (text[i] === "<") {
            // タグ（<ruby>など）は一気に処理
            let tagEnd = text.indexOf(">", i);
            element.innerHTML += text.substring(i, tagEnd + 1);
            i = tagEnd + 1;
        } else {
            element.innerHTML += text[i] === "\n" ? "<br>" : text[i];
            i++;
            // 漢字の直後などはウェイトをかけるとよりリアル
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }
    stopTypingSe(); // SE停止
    playSe(seComplete); // 完了音
}

// メイン処理：解析実行
document.getElementById('submitBtn').addEventListener('click', async function() {
    playSe(seClick); // クリック音
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
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        
        // プロンプト（ルビとレシート構成）
        const prompt = `
        あなたは「電脳おみくじ」です。システムログ風に、中学生でも分かる言葉で答えて。
        入力「${userInput}」に対し、以下の構成で出力して。
        1. 魂のデバッグ（哲学的な短い助言）:
           ・「君は今〜」などのような親しみやすいが不思議な口調で。
        2. 適合する液体（飲み物とその理由）:
           ・【 飲み物名 】理由〜
        3. 接続コード:
           ・【 4桁の英数字 】
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // 不要なmarkdown（ ```html など）が混ざる場合の除去
        text = text.replace(/```html|```/g, '');

        loading.classList.add('hidden');
        receiptWrapper.classList.remove('hidden');

        // 背景色演出
        function getBackgroundColor(text) {
    // 判定キーワードを増やす
    if (text.includes("ソーダ") || text.includes("青") || text.includes("ラムネ")) return "#e0f7fa"; 
    if (text.includes("お茶") || text.includes("緑") || text.includes("メロン")) return "#f1f8e9"; 
    if (text.includes("ミルク") || text.includes("白") || text.includes("カルピス")) return "#ffffff"; 
    if (text.includes("コーラ") || text.includes("黒") || text.includes("コーヒー")) return "#efebe9"; 
    if (text.includes("イチゴ") || text.includes("赤") || text.includes("ベリー")) return "#fce4ec"; 
    return "#f5f5f5"; 
}
       // 背景色の反映先を増やす
        const bgColor = getBackgroundColor(text);
        document.body.style.backgroundColor = bgColor;
        
        // コンテナも一緒に変えることで、色の変化がはっきり見えるようになります
        const container = document.querySelector('.container');
        if(container) container.style.backgroundColor = bgColor;

        // タイピング開始
        await typeWriter(philosophy, text, 40);
        
        // BBSログに追加（コードを抽出して）
        const codeMatch = text.match(/【 ([A-Z0-9]{4}) 】/);
        const code = codeMatch ? codeMatch[1] : "XXXX";
        addBbsLog(`[LOG: ${code}] Input: ${userInput.substring(0,10)}... Analysis Complete.`);

    } catch (error) {
        console.error(error);
        philosophy.innerText = "通信遮断。再起動を推奨。";
    }
});

// 再起動処理
document.getElementById('retryBtn').addEventListener('click', () => {
    playSe(seClick);
    document.body.style.backgroundColor = "#f9f9f9";
    location.reload(); 
});

// 画像生成とシェア
document.getElementById('shareBtn').addEventListener('click', () => {
    playSe(seClick);
    const receipt = document.getElementById('receiptContainer');
    const btnArea = document.getElementById('retryBtnArea');
    
    // 画像生成時はボタンエリアを一時的に隠す
    btnArea.style.display = 'none';

    // html2canvasで画像化
    html2canvas(receipt, {
        backgroundColor: null, // 背景を透過にする（レシート部分のみ）
        scale: 2 // 画質を上げる
    }).then(canvas => {
        const imgModal = document.getElementById('imageModal');
        const generatedImage = document.getElementById('generatedImage');
        
        // 画像を表示
        generatedImage.src = canvas.toDataURL("image/png");
        imgModal.classList.remove('hidden');
        
        // ボタンエリアを元に戻す
        btnArea.style.display = 'flex';
    });
    // SNS共有ボタンの処理
document.getElementById('share-btn').addEventListener('click', async () => {
    const shareData = {
        title: '電脳おみくじ - Cyber Oracle',
        text: 'AIが私の魂をデバッグした結果、最適飲料はこれでした。',
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // PCなどWeb Share API非対応の場合はTwitterへ飛ばす（上のコード）
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
            window.open(twitterUrl, '_blank');
        }
    } catch (err) {
        console.error('Share failed:', err);
    }
});
});

// モーダルを閉じる
document.getElementById('closeModal').addEventListener('click', () => {
    playSe(seClick);
    document.getElementById('imageModal').classList.add('hidden');
});