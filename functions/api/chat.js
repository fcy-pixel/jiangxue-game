/**
 * functions/api/chat.js
 * Cloudflare Pages Function — Qwen API 代理
 * 
 * 部署後可在環境變量設置 QWEN_API_KEY（作為後備）
 * 前端也可傳入 apiKey
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const { messages, characterId, apiKey: clientKey } = body;

    // 優先用前端傳入的 key，其次用環境變量
    const apiKey = (clientKey && clientKey.trim()) || env.QWEN_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '請設置 Qwen API Key（在遊戲開始頁面輸入）' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: '無效的請求格式' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 調用 Qwen API (DashScope / Aliyun)，設 6 秒超時
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);

    let qwenResp;
    try {
      qwenResp = await fetch(
        'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'qwen-turbo',
            messages,
            max_tokens: 180,
            temperature: 0.85,
            top_p: 0.9,
          }),
        }
      );
    } finally {
      clearTimeout(t);
    }

    if (!qwenResp.ok) {
      const errText = await qwenResp.text();
      console.error('Qwen API error:', qwenResp.status, errText);
      return new Response(
        JSON.stringify({ error: `Qwen API 錯誤 (${qwenResp.status})` }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const data = await qwenResp.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (err) {
    console.error('Function error:', err);
    const isTimeout = err.name === 'AbortError';
    return new Response(
      JSON.stringify({ error: isTimeout ? 'Qwen API 請求超時' : '伺服器內部錯誤' }),
      { status: isTimeout ? 504 : 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
