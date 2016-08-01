function doPost(e) {
  var lineBot = LineBot.factory({
    channelId: 'xxxxxxxxxxxx',
    channelSecret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    channelMid: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    autoContentsLoad: false,
  });

  lineBot
    .setOperationHandler(LineBot.EVENT_OPERATION_ADD, function(mid) {
      // 友だち追加された
      prof = lineBot.getUserProfile(mid);
      if (prof) {
        lineBot.sendText(mid, 'こんにちわ、' + prof[0].displayName + ' さん！');
      }
    })
    .setOperationHandler(LineBot.EVENT_OPERATION_BLOCK, function(mid) {
      // ブロックされた
    })
    .setMessageHandler(LineBot.EVENT_MESSAGE_TEXT, function(mid, text) {
      // テキストメッセージを受け取った
      lineBot.sendText(mid, '「' + text + '」ですね。なるほど〜');
    })
    .setMessageHandler(LineBot.EVENT_MESSAGE_STICKER, function(mid, text) {
      // スタンプを受け取った
      lineBot.sendSticker(mid, {packageId: 1, id: 2, version: 100});
    })
    .setMessageHandler(LineBot.EVENT_MESSAGE_UNKNOWN, function(mid, msg) {
      // 上記以外を受け取った
      lineBot.sendText(mid, 'ちょっと何言ってるか分からないです😆');
    });
  return lineBot.doPostWithHandlers(e);
}
