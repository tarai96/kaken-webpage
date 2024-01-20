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
const encode_options = JSON.stringify(options);
console.log(encode_options);


const pyshell = new PythonShell('python/cp.py', options);
/*
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
    console.log("71",JSON.stringify(data));
    /*
    data = {
      state: state,
      current_player:player
    }
    */
    // pythonファイル呼び出し
    pyshell.on('message', function (message) {
      console.log("action" + message);
      best_action = message;
    });
    pyshell.send(JSON.stringify(data)); // 文字列に直してからじゃないと送れないみたい・・・。JSONのままだと怒られる。modeをjsonで指定しても変化はなかった。
    console.log("83",best_action);
    let get_repeat = setInterval(function () {
      if (best_action !== undefined) {
        console.log("reply:", best_action);
        io.emit("action-reply", { action: best_action });
        clearInterval(get_repeat);
      }
    }, 3000);
    /*
    sleepRepeat(3000, 10, (count) => {
      console.log(`${count}回目`);
      if (best_action !== undefined) {
        console.log("reply:", best_action);
        io.emit("action-reply", { action: best_action });
        clearInterval(sleepRepeat);
      }
    });
    */
    //best_action = "1c1d"
    /*
    // pythonから答えが返ってくるのを待つ
    for (let i = 0; i < 101; i++) {
      if (best_action === undefined) {
        if (i % 100 == 0) {
          console.log("95,bestaction:", best_action);
          i = 0;
        }
        //sleep(3000);
        continue;
      } else {
        console.log("reply:", best_action);
        io.emit("action-reply", { action: best_action });
        break;
      }
    }
    */
  //  io.emit("action-reply", { action: best_action });
  });
});

/**
 * 3000番でサーバを起動する
 */
http.listen(3000, () => {
  console.log("listening on *:3000");
});

