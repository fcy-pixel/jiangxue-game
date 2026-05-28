#!/usr/bin/env node
/**
 * generate-portraits.js
 * 使用通義萬象（Qwen WANX 2.1）API 生成角色肖像
 *
 * ⚠️  重要說明：
 *   WANX 圖片生成模型目前只在阿里雲中國節點（dashscope.aliyuncs.com）提供。
 *   如你持有中國 DashScope 帳號，請：
 *   1. 在 https://dashscope.aliyuncs.com 取得 API Key
 *   2. QWEN_API_KEY=sk-中國節點金鑰 node generate-portraits.js
 *
 * 現時遊戲已使用 SVG 水墨畫風格肖像作替代，無需執行此腳本。
 *
 * 使用方式：
 *   QWEN_API_KEY=sk-xxx node generate-portraits.js
 */

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');

/* ─── 配置 ─────────────────────────────────────────────── */
const API_KEY  = process.env.QWEN_API_KEY;
const HOST     = 'dashscope.aliyuncs.com';   // WANX 只在中國節點
const IMG_DIR  = path.join(__dirname, 'images', 'portraits');

if (!API_KEY) {
  console.error('請設定環境變數：QWEN_API_KEY=sk-你的中國節點金鑰');
  process.exit(1);
}

/* ─── 角色提示詞 ────────────────────────────────────────── */
const CHARACTERS = [
  {
    id:       'liuzongyuan',
    prompt:   '柳宗元，唐代文學家，中國傳統工筆水墨人物畫，身穿素色儒服，' +
              '神情憂鬱沉思，眉間輕蹙，手持毛筆，背景為白雪江岸，' +
              '正面半身肖像，線條清晰，古典文人氣質',
    negative: '現代服裝，變形，模糊，低畫質，西方風格',
  },
  {
    id:       'wangshuwwen',
    prompt:   '王叔文，唐代政治改革家，中國傳統工筆水墨人物畫，身穿深色官服，' +
              '神情堅毅果決，目光銳利，正面半身肖像，' +
              '古典官員氣質，背景為朝堂',
    negative: '現代服裝，變形，模糊，低畫質',
  },
  {
    id:       'liuyuxi',
    prompt:   '劉禹錫，唐代詩人，中國傳統工筆水墨人物畫，身穿寬袖文人服，' +
              '面帶豁達笑意，眉宇開朗，正面半身肖像，' +
              '豪邁飄逸的文人氣質',
    negative: '現代服裝，變形，模糊，低畫質',
  },
  {
    id:       'hanyu',
    prompt:   '韓愈，唐代文學家，中國傳統工筆水墨人物畫，身穿正式儒服，' +
              '表情嚴肅端莊，鬚髯清晰，正面半身肖像，' +
              '古典儒家學者氣質',
    negative: '現代服裝，變形，模糊，低畫質',
  },
  {
    id:       'fisherman',
    prompt:   '中國古代江上漁翁，水墨山水人物畫，老者，身披蓑衣斗笠，' +
              '坐於孤舟執竿垂釣，寒江白雪背景，' +
              '超脫自然的道家隱者氣質，遠景留白',
    negative: '現代服裝，變形，模糊，低畫質',
  },
  {
    id:       'emperor',
    prompt:   '唐憲宗，唐代皇帝，中國傳統工筆人物畫，身穿明黃龍袍，' +
              '頭戴帝冕，端坐威嚴，正面半身肖像，' +
              '帝王氣度，背景為宮殿',
    negative: '現代服裝，變形，模糊，低畫質',
  },
];

/* ─── 工具函式 ──────────────────────────────────────────── */
function apiRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { reject(new Error('JSON parse error: ' + raw.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(filepath);
    proto.get(url, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(resolve); });
    }).on('error', err => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function submitTask(char) {
  const resp = await apiRequest(
    {
      hostname: HOST,
      path:     '/api/v1/services/aigc/text2image/image-synthesis',
      method:   'POST',
      headers: {
        'Authorization':    `Bearer ${API_KEY}`,
        'Content-Type':     'application/json',
        'X-DashScope-Async': 'enable',
      },
    },
    {
      model: 'wanx2.1-t2i-turbo',
      input: {
        prompt:          char.prompt,
        negative_prompt: char.negative,
      },
      parameters: {
        style: '<chinese ink painting>',
        size:  '768*1024',
        n:     1,
      },
    }
  );
  if (resp.status !== 200) {
    throw new Error(`Submit HTTP ${resp.status}: ${JSON.stringify(resp.data)}`);
  }
  return resp.data.output.task_id;
}

async function pollTask(taskId, maxTries = 40) {
  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, 4000));
    const resp = await apiRequest(
      {
        hostname: HOST,
        path:     `/api/v1/tasks/${taskId}`,
        method:   'GET',
        headers:  { 'Authorization': `Bearer ${API_KEY}` },
      },
      null
    );
    const status = resp.data?.output?.task_status;
    process.stdout.write(`  [${i+1}/${maxTries}] ${status}\r`);
    if (status === 'SUCCEEDED') {
      console.log('');
      return resp.data.output.results[0].url;
    }
    if (status === 'FAILED') {
      throw new Error('Task FAILED: ' + JSON.stringify(resp.data));
    }
  }
  throw new Error('Timeout waiting for image generation');
}

/* ─── 主程序 ────────────────────────────────────────────── */
async function main() {
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

  for (const char of CHARACTERS) {
    const outPath = path.join(IMG_DIR, `${char.id}.png`);
    if (fs.existsSync(outPath)) {
      console.log(`  ✓ ${char.id}.png 已存在，跳過`);
      continue;
    }
    console.log(`\n▶ 生成 ${char.id}（${char.prompt.slice(0, 20)}…）`);
    try {
      const taskId = await submitTask(char);
      console.log(`  任務 ID：${taskId}`);
      const imgUrl = await pollTask(taskId);
      console.log(`  下載中…`);
      await downloadImage(imgUrl, outPath);
      console.log(`  ✓ 儲存至 images/portraits/${char.id}.png`);
    } catch (err) {
      console.error(`  ✗ ${char.id} 失敗：${err.message}`);
    }
  }

  console.log('\n全部完成！');
  console.log('如需重新部署，執行：');
  console.log('  git add images/ && git commit -m "feat: 加入 AI 生成角色肖像" && git push');
  console.log('  npx wrangler pages deploy . --project-name jiangxue-game');
}

main().catch(err => { console.error(err); process.exit(1); });
