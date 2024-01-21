// サーバーに個人として識別されるようにするコード

//自分自身の情報を入れる
const IAM = {
  token: null,  // トークン
  name: null    // 名前
};
// トークンを発行されたら
socket.on("token", (data) => {
  IAM.token = data.token;
});