const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { type } = require("os");
const { PythonShell } = require('python-shell');
const python_path = __dirname + '/python/venv/bin/python';
console.log(python_path);
console.log(typeof(python_path));
const options = {
  mode: 'json',
  pythonPath: '/mnt/c/Users/ryota/Documents/kaken-webpage/python/venv/bin/python',
  pythonOptions: ['-u'],
};
  //scriptPath: '/mnt/c/Users/ryota/Documents/kaken-webpage/python',
const encode_options = JSON.stringify(options)
console.log(encode_options);

/*
var pyshell = new PythonShell('python/cp.py', options);
// pythonファイル呼び出し
let data = {
  "state": [18, 0, 15, 0, 0, 0, 1, 0, 2, 19, 21, 15, 0, 0
    , 0, 1, 6, 3, 20, 0, 15, 0, 0, 0, 1, 0, 4, 23, 0, 15,
    0, 0, 0, 1, 0, 7, 8, 0, 15, 0, 0, 0, 1, 0, 8, 23, 0, 15
    , 0, 0, 0, 1, 0, 7, 20, 0, 15, 0, 0, 1, 0, 0, 4, 19, 10
    , 15, 0, 0, 0, 1, 5, 3, 18, 0, 15, 0, 0, 0, 1, 0, 2, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "current_player": 1
}
pyshell.send(JSON.stringify(data)); // 文字列に直してからじゃないと送れないみたい・・・。JSONのままだと怒られる。modeをjsonで指定しても変化はなかった。
var best_action = 89;
pyshell.on('message', function (message) {
  console.log("action" + message);
  best_action = message;
});
// end the input stream and allow the process to exit
pyshell.end(function (err, code, signal) {
  if (err) throw err;
  console.log('The exit code was: ' + code);
  console.log('The exit signal was: ' + signal);
  console.log('finished');
});
console.log(best_action);
*/

// HTMLやJSなどを配置するディレクトリ
const DOCUMENT_ROOT = __dirname + "/public";
/**
 * "/"にアクセスがあったらindex.htmlを返却
 */
app.get("/", (req, res) => {
  res.sendFile(DOCUMENT_ROOT + "/index.html");
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

  socket.on("post", (data) => {
    let best_action;
    console.log(JSON.stringify(data));
    /*
    data = {
      state: state,
      current_player:player
    }
    */
    pyshell.on('message', function (message) {
      console.log("action" + message);
      best_action = message;
    });
    console.log(best_action);
    // pythonファイル呼び出し
    pyshell.send(JSON.stringify(data)); // 文字列に直してからじゃないと送れないみたい・・・。JSONのままだと怒られる。modeをjsonで指定しても変化はなかった。
    pyshell.on('message', function (message) {
      console.log("action" + message);
      best_action = message;
    });

    //best_action = "1c1d"
    io.emit("action-reply", {action: best_action});
  });
});

/**
 * 3000番でサーバを起動する
 */
http.listen(3000, () => {
  console.log("listening on *:3000");
});

