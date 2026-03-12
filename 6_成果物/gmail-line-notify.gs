/* ▼=== 設定値 ===▼ */
const CHANNEL_ACCESS_TOKEN = '+uslo4ANLP9tSQakkVau+VkVymQGfE1QC1BUCvViaOE6Y05zyfdodsF6d7RF9WfVgqecJn1ccWv5vlxv5Wngn6rFZk1fgoHWz7JVOBDuTZzzaPspTJ1SAQKWrMTdFgAC6bYmoL76780wKbiQVARH1AdB04t89/1O/w1cDnyilFU=';
const USER_ID              = 'U9d345a0ea37b193b59d4a1cc4221de04';

/**
 * 「レバテック」を含む、または awasawa@cpaoffice.jp からの
 * 直近24時間の新着スレッドから件名をLINEプッシュ通知
 * 送信元によってメッセージの冒頭を出し分ける
 */
function checkLevatechMails() {
  const query   = 'newer_than:1d {レバテック from:awasawa@cpaoffice.jp}';
  const threads = GmailApp.search(query);
  const prop    = PropertiesService.getScriptProperties();
  const sentIds = (prop.getProperty('notified') || '')
                    .split(',').filter(Boolean);

  // 通知するテキストをためる配列
  let titles = [];

  threads.forEach(thread => {
    const tid = String(thread.getId());
    if (sentIds.includes(tid)) return;  // 既に通知済みならスキップ

    const message = thread.getMessages()[0];
    const subject = message.getSubject() || '(件名なし)';
    const from    = message.getFrom();

    // 送信元によって冒頭メッセージを出し分け
    let label;
    if (from.includes('awasawa@cpaoffice.jp')) {
      label = '粟澤先生からメッセージが届きました。';
    } else {
      label = 'レバテックからメッセージが届きました。';
    }

    const text = `${label}\n件名：${subject}`;
    titles.push(text);
    sentIds.push(tid);
  });

  // ためたテキストがあればまとめて送信＆プロパティ更新
  if (titles.length) {
    pushToLine(titles.join('\n\n'));
    prop.setProperty('notified', sentIds.join(','));
  }
}

/**
 * LINE Messaging API でプッシュ送信
 */
function pushToLine(text) {
  const payload = {
    to:       USER_ID,
    messages: [{ type: 'text', text }]
  };
  const options = {
    method:      'post',
    contentType: 'application/json',
    headers:     { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
}