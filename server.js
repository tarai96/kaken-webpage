const crypto = require('crypto');
const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { type } = require("os");
const { setTimeout } = require("timers/promises");
//import { setTimeout } from "timers/promises";
//const sleep = waitTime => setTimeout(waitTime);
//const sleep = waitTime => new Promise(resolve => setTimeout(resolve, waitTime));
const sleep = (waitTime) => {
  const startTime = Date.now();
  while (Date.now() - startTime < waitTime);
};
const sleepRepeat = (waitTime, repeatTimes, func) => {
  let count = 0;
  const id = setInterval(() => {
    func(++count);
    if (count >= repeatTimes) clearInterval(id);
  }, waitTime);
}
const { PythonShell } = require('python-shell');
const python_path = __dirname + '/python/venv/bin/python';
console.log(python_path);
console.log(typeof(python_path));
const options = {
  mode: 'text',
  pythonPath: '/mnt/c/Users/ryota/Documents/kaken-webpage/python/venv/bin/python',
  pythonOptions: ['-u'],
};
  //scriptPath: '/mnt/c/Users/ryota/Documents/kaken-webpage/python',
//const encode_options = JSON.stringify(options);
//console.log(encode_options);
/*
 * action_buffer = [{"token":token0,"action": action0}]
 */
let action_buffer = [];
//let best_action = -1;
const pyshell = new PythonShell('python/cp.py', options);
pyshell.on('message', function (message) {
  let data = JSON.parse(message);
  console.log("action" + data.action);
  //best_action = message;
  action_buffer.push(data);
});

// HTMLやJSなどを配置するディレクトリ
const DOCUMENT_ROOT = __dirname + "/public";
/**
 * "/"にアクセスがあったらindex.htmlを返却
 */
app.get("/", (req, res) => {
  res.sendFile(DOCUMENT_ROOT + "/index.html");
});
/*
app.get("/shogi", (req, res) => {
  res.sendFile(DOCUMENT_ROOT + "/index.html");
});
*/
app.get("/othello", (req, res) => {
  res.sendFile(DOCUMENT_ROOT + "/othellogame.html");
});

app.get("/:file", (req, res) => {
  res.header('Content-Type', 'text/plain;charset=utf-8');
  res.sendFile(DOCUMENT_ROOT + "/" + req.params.file);
});
app.get("/image/:file", (req, res) => {
  res.sendFile(DOCUMENT_ROOT + "/image" + "/" + req.params.file);
});


/**
 * [イベント] ユーザーが接続
 */
io.on("connection", (socket) => {
  console.log("ユーザーが接続しました");
  //---------------------------------
  // ログイン
  //---------------------------------
  (() => {
    // トークンを作成
    const token = makeToken(socket.id);

    // 本人にトークンを送付
    io.to(socket.id).emit("token", { token: token });
  })();

  socket.on("post", (data) => {
    encode_data = JSON.stringify(data);
    console.log("71", encode_data);
    /*
    data = {
      mode: "shogi" (string)
      state: state, (array)
      current_player:player (int)
      token: token (string)
    }
    */
    // python呼び出し
    pyshell.send(encode_data); // 文字列に直してからじゃないと送れないみたい・・・。JSONのままだと怒られる。modeをjsonで指定しても変化はなかった。
    let get_repeat = setInterval(function () {
      const idx_data = action_buffer.findIndex(pydata => {
        return pydata.token === data.token
      });
      if (idx_data !== -1) {
        // dataをbufferから削除しつつ取得する
        const action_data = action_buffer.splice(idx_data,1)[0];
        console.log(action_data);
        const best_action = action_data.action;
        console.log("reply:", best_action);
        io.to(socket.id).emit("action-reply", { action: best_action });
        clearInterval(get_repeat);
      }
    }, 50);
  });
});

/**
 * 8080番でサーバを起動する
 */
http.listen(8080, () => {
  console.log("listening on *:8080");
});

/**
 * トークンを作成する
 *
 * @param  {string} id - socket.id
 * @return {string}
 */
function makeToken(id) {
  const str = "aqwsedrftgyhujiko" + id;
  return (crypto.createHash("sha1").update(str).digest('hex'));
}