const { PythonShell } = require('python-shell');
const options = {
  mode: 'text',
  pythonPath: '/mnt/c/Users/ryota/Documents/kaken-webpage/python/venv/bin/python',
  pythonOptions: ['-u'],
};
async function main() {
  const pyshell = await new PythonShell('python/cp.py', options);
  //console.log("9",pyshell);
  // pythonファイル呼び出し
  let data = {
    'state': [18, 0, 15, 0, 0, 0, 1, 0, 2, 19, 21, 15, 0, 0
      , 0, 1, 6, 3, 20, 0, 15, 0, 0, 0, 1, 0, 4, 23, 0, 15,
      0, 0, 0, 1, 0, 7, 8, 0, 15, 0, 0, 0, 1, 0, 8, 23, 0, 15
      , 0, 0, 0, 1, 0, 7, 20, 0, 15, 0, 0, 1, 0, 0, 4, 19, 10
      , 15, 0, 0, 0, 1, 5, 3, 18, 0, 15, 0, 0, 0, 1, 0, 2, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'current_player': 1
  }
  pyshell.send(JSON.stringify(data)); // 文字列に直してからじゃないと送れないみたい・・・。JSONのままだと怒られる。modeをjsonで指定しても変化はなかった。
  //pyshell.send(data); 
  let best_action = 89;
  pyshell.on('message', function (message) {

    best_action = message;
    console.log("action" + best_action);
  });
  // end the input stream and allow the process to exit
  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    console.log('The exit code was: ' + code);
    console.log('The exit signal was: ' + signal);
    console.log('finished');
  });
  await console.log(best_action);

}
main();
