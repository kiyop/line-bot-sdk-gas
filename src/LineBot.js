(function(global) {
  global.LineBot = (function() {
    function LineBot(config) {
      this.operationHandlers = {};
      this.messageHandlers = {};
      this.baseUrl = config.baseUrl || 'https://trialbot-api.line.me/v1';
      this.headers  = {
        'X-Line-ChannelID': config.channelId,
        'X-Line-ChannelSecret': config.channelSecret,
        'X-Line-Trusted-User-With-ACL': config.channelMid,
      };
      // 画像・動画・音声の自動取得 (default: on)
      this.autoContentsLoad = (config.autoContentsLoad === undefined) ? true: config.autoContentsLoad;
      // 署名の自動検証もできるようにしたいが、Google App Script ではリクエストヘッダの取得ができないため難しいかも
      // http://line.github.io/line-bot-api-doc/ja/api/callback/post.html#signagure-verification
    };

    LineBot.prototype.setOperationHandler = function(eventType, handler) {
      this.operationHandlers[eventType.toString()] = handler;
      return this;
    }

    LineBot.prototype.setMessageHandler = function(eventType, handler) {
      this.messageHandlers[eventType.toString()] = handler;
      return this;
    };

    LineBot.prototype.makeContent_ = function(output) {
      return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
    };

    LineBot.prototype.ok_ = function(data) {
      var res = {result: true};
      if (data) {
        res.data = data;
      }
      return this.makeContent_(res);
    };

    LineBot.prototype.err_ = function(msg) {
      return this.makeContent_({result: false, message: msg ? msg : 'unknown error.'});
    };

    LineBot.prototype.eventDispatcher_ = function(req) {
      if (req.eventType == '138311609100106403') {
        // ユーザー操作
        var op = req.content, opType = op.opType, from = op.params[0];
        switch (op.opType) {
          case EVENT_OPERATION_ADD:
            // 友達追加された (ブロック解除含む)
            if (this.operationHandlers[opType]) {
              this.operationHandlers[opType](from, msg);
            }
            break;
          case EVENT_OPERATION_BLOCK:
            // ブロックされた
            if (this.operationHandlers[opType]) {
              this.operationHandlers[opType](from, msg);
            }
            break;
        }
        if (this.operationHandlers[EVENT_OPERATION_ANY]) {
          this.operationHandlers[EVENT_OPERATION_ANY](from, req); // 種類を区別しないハンドラを呼び出す (種別ハンドラがあっても)
        }
        if (!this.operationHandlers[EVENT_OPERATION_ANY] && !this.operationHandlers[opType] && this.operationHandlers[EVENT_OPERATION_UNKNOWN]) {
          this.operationHandlers[EVENT_OPERATION_UNKNOWN](from, req); // 対応するハンドラがない場合に呼び出す
        }
      } else if (req.eventType == '138311609000106303') {
        // メッセージ受信
        var msg = req.content, msgType = msg.contentType, from = msg.from;
        switch (msgType) {
          case EVENT_MESSAGE_TEXT: // テキスト
            if (this.messageHandlers[msgType]) {
              this.messageHandlers[msgType](from, msg.text, msg);
            }
            break;
          case EVENT_MESSAGE_IMAGE: // 画像
          case EVENT_MESSAGE_VIDEO: // 動画
          case EVENT_MESSAGE_AUDIO: // 音声
            if (this.messageHandlers[msgType]) {
              this.messageHandlers[msgType](from, this.autoContentsLoad ? this.getMessageContent(msg.id) : null, msg);
            }
            break;
          case EVENT_MESSAGE_LOCATION: // 位置情報
            if (this.messageHandlers[msgType]) {
              this.messageHandlers[msgType](from, msg.location.title, msg.location.address, msg.location.latitude, msg.location.longitude, msg);
            }
            break;
          case EVENT_MESSAGE_STICKER: // スタンプ
            if (this.messageHandlers[msgType]) {
              this.messageHandlers[msgType](from, msg.contentMetadata.STKPKGID, msg.contentMetadata.STKID, msg.contentMetadata.STKVER, msg.contentMetadata.STKTXT, msg);
            }
            break;
          case EVENT_MESSAGE_CONTACT: // 連絡先
            if (this.messageHandlers[msgType]) {
              this.messageHandlers[msgType](from, msg.contentMetadata.mid, msg.contentMetadata.displayName, msg);
            }
            break;
        }
        if (this.messageHandlers[EVENT_MESSAGE_ANY]) {
          this.messageHandlers[EVENT_MESSAGE_ANY](from, req); // 種類を区別しないハンドラを呼び出す (種別ハンドラがあっても)
        }
        if (!this.messageHandlers[EVENT_MESSAGE_ANY] && !this.messageHandlers[msgType] && this.messageHandlers[EVENT_MESSAGE_UNKNOWN]) {
          this.messageHandlers[EVENT_MESSAGE_UNKNOWN](from, req); // 対応するハンドラがない場合に呼び出す
        }
      }
    };

    LineBot.prototype.doPostWithHandlers = function(event) {
      if (event.postData && event.postData.length > 0 && event.postData.type == 'application/json') {
        var input;
        try {
          input = JSON.parse(event.postData.contents);
        } catch(exception) {
          return this.err_('input error.');
        }
        if (input && Array.isArray(input.result) && input.result.length > 0) {
          for (var i in input.result) {
            this.eventDispatcher_(input.result[i]);
          }
        }
      }
      return this.ok_();
    };

    LineBot.prototype.sendMessage_ = function(to, content) {
      content.toType = 1;
      var url = this.baseUrl + '/events',
        options = {
          'method': 'post',
          'contentType': 'application/json; charset=utf-8',
          'muteHttpExceptions': true,
          'headers': this.headers,
          'payload': JSON.stringify({
            'to': Array.isArray(to) ? to : [to],
            'toChannel': 1383378250,
            'eventType': '138311608800106203',
            'content': content || {},
          })
        },
        res = UrlFetchApp.fetch(url, options);
      return (res.getResponseCode() == 200);
    }

    LineBot.prototype.sendText = function(to, text) {
      return this.sendMessage_(to, {
        'contentType': EVENT_MESSAGE_TEXT,
        'text': text
      });
    };

    LineBot.prototype.sendSticker = function(to, stickerPackageId, stickerId, stickerVersion) {
      if (typeof stickerPackageId == 'object' && stickerPackageId.packageId && stickerPackageId.id && stickerPackageId.version) {
        [stickerPackageId, stickerId, stickerVersion] = [stickerPackageId.packageId, stickerPackageId.id, stickerPackageId.version];
      }
      return this.sendMessage_(to, {
        'contentType': EVENT_MESSAGE_STICKER,
        'contentMetadata': {
          'STKPKGID': stickerPackageId,
          'STKID': stickerId,
          'STKVER': stickerVersion || 100,
        }
      });
    };

    LineBot.prototype.getMessageContent_ = function(messageId, isPreview) {
      var url = this.baseUrl + '/bot/message/' + messageId + '/content' + (isPreview ? '/preview' : ''),
        options = {
          'method': 'get',
          'muteHttpExceptions': true,
          'headers': this.headers,
        },
        res = UrlFetchApp.fetch(url, options);
      return (res.getResponseCode() == 200) ? res.getBlob() : false;
    };

    LineBot.prototype.getMessageContent = function(messageId) {
      return this.getMessageContent_(messageId, false);
    };

    LineBot.prototype.getMessageContentPreview = function(messageId) {
      return this.getMessageContent_(messageId, true);
    };

    LineBot.prototype.getUserProfile = function(userId) {
      var url = this.baseUrl + '/profiles?mids=' + (Array.isArray(userId) ? to : [userId]).join(','),
        options = {
          'method': 'get',
          'contentType': 'application/json; charset=utf-8',
          'muteHttpExceptions': true,
          'headers': this.headers,
        },
        res = UrlFetchApp.fetch(url, options);
      if (res.getResponseCode() == 200) {
        try {
          return JSON.parse(res.getContentText()).contacts;
        } catch(error) {}
      }
      return false;
    };

    return LineBot;
  })();
})(this);

/**
 * LineBot インスタンスの作成
 *
 * @param {assoc} config
 * @return {LineBotInstance}
 * @return LineBotInstance
 */
function factory(config) {
  return new LineBot(config);
}

