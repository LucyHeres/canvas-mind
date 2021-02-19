// 分叉连接点节点构造函数
function HubNode(args) {
  let { id, content, x, y, radius, relyNode } = args;
  this.id = id;
  this.content = content;
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.relyNode = relyNode;

  this.calcPos();
  this.draw();
}
HubNode.prototype.calcPos = function () {
  if (!this.relyNode) return;
  if (!this.relyNode.x || !this.relyNode.y) return;
  this.x = this.relyNode.x + 100;
  this.y = this.relyNode.y + 100;
};
HubNode.prototype.draw = function () {
  if (!this.x || !this.y) return;
  ctx.beginPath();
  ctx.fillStyle = "#e3e4e5";
  ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
  ctx.fill();
};
