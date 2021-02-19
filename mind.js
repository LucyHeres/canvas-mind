var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth * 3;
canvas.height = window.innerHeight * 3;
ctx.textBaseline = "top";
// 屏幕的设备像素比
var devicePixelRatio = window.devicePixelRatio || 1;
// 浏览器在渲染canvas之前存储画布信息的像素比
var backingStoreRatio =
  ctx.webkitBackingStorePixelRatio ||
  ctx.mozBackingStorePixelRatio ||
  ctx.msBackingStorePixelRatio ||
  ctx.oBackingStorePixelRatio ||
  ctx.backingStorePixelRatio ||
  1;
// canvas的实际渲染倍率
var ratio = devicePixelRatio / backingStoreRatio;

createCanvas();

function createCanvas() {
  var oldWidth = canvas.width;
  var oldHeight = canvas.height;

  canvas.width = oldWidth * ratio;
  canvas.height = oldHeight * ratio;

  canvas.style.width = oldWidth + "px";
  canvas.style.height = oldHeight + "px";
  ctx.scale(ratio, ratio);
}

var util = {
  // 计算画布中心
  getCanvasCenterPos() {
    return { x: canvas.width / ratio / 2, y: canvas.height / ratio / 2 };
  },
  newid() {
    return (
      new Date().getTime().toString(16) + Math.random().toString(16).substr(2)
    ).substr(2, 16);
  },
  deepClone(obj) {
    let objClone = Array.isArray(obj) ? [] : obj instanceof Object ? {} : obj;
    if (obj && obj instanceof Array) {
      for (let i = 0; i < obj.length; i++) {
        if (obj[i]) {
          objClone[i] = util.deepClone(obj[i]);
        }
      }
    } else if (obj && obj instanceof Object) {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] && typeof obj[key] === "object") {
            objClone[key] = util.deepClone(obj[key]);
          } else {
            objClone[key] = obj[key];
          }
        }
      }
    }
    return objClone;
  },
  flatArray(arr) {
    let arr1 = [];
    arr.forEach((item) => {
      if (item instanceof Array) {
        arr1 = arr1.concat(util.flatArray(item));
      } else {
        arr1.push(item);
      }
    });
    return arr1;
  },
};

// 文本节点构造函数
function KeyNode(args) {
  let {
    id,
    content,
    x,
    y,
    width,
    height,
    child_index,
    children,
    rank_index,
    expanded,
    direction,
    isRoot,
  } = args;
  this.id = id;
  this.content = content;
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.child_index = child_index;
  this.rank_index = rank_index;
  this.children = children;
  this.expanded = expanded;
  this.direction = direction; 
  this.isRoot = isRoot;

  this.parent = null;
  this.hubPos = null;
  this.hubPos_r = null;
  this.hubPos_l = null;
}
KeyNode.prototype = {
  show() {
    this.getHubPos();
    this.drawRect();
    this.drawText();
  },
  drawRect() {
    if (!this.x || !this.y) return;
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#f2f2f2";

    ctx.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
    ctx.fill();
  },
  drawText() {
    ctx.beginPath();
    var textDOM = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='100'>
                    <foreignObject width='100%' height='100%'>
                      <div xmlns='http://www.w3.org/1999/xhtml'>
                        <div style="width:320px;height:100px;display: flex;padding:16px 18px 16px 12px;font-size:12px;">
                          <div style="flex-shrink:0;width:30px;height:30px;background-color: #1bc489;border-radius: 50%;margin-right:8px;"></div>
                          <div style="width:260px;">
                            <div style="width:100%;display:flex;align-items:center;justify-content: space-between;">
                              <div>${this.content}</div>
                              <div>进度10%</div>
                            </div>
                            <div style="width:100%;margin-top:8px;height:40px;font-size:14px;text-align:justify">副标题副标题副标题副标题副标题副标题副标题副标题副标题</div>
                          </div>
                        </div>
                      </div>
                    </foreignObject>
                  </svg>`;
    var DOMURL = self.URL || self.webkitURL || self;
    var img = new Image();
    var svg = new Blob([textDOM], {
      type: "image/svg+xml;charset=utf-8",
    });
    var url = DOMURL.createObjectURL(svg);
    img.onload = () => {
      ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2);
      DOMURL.revokeObjectURL(url);
    };
    img.src = url;
  },
  drawLine_to_child() {
    ctx.beginPath();
    if(this.isRoot){
      if(this.get_children_nodes(1).length){
        ctx.moveTo(this.x + 1 * this.width / 2, this.y);
        ctx.lineTo(this.hubPos_r[0], this.hubPos_r[1]);
      }
      if(this.get_children_nodes(-1).length){
        ctx.moveTo(this.x + -1 * this.width / 2, this.y);
        ctx.lineTo(this.hubPos_l[0], this.hubPos_l[1]);
      }
    }else{
      ctx.moveTo(this.x + this.direction * this.width / 2, this.y);
      ctx.lineTo(this.hubPos[0], this.hubPos[1]);
    }
    ctx.stroke();
  },
  drawLine_to_parent() {
    ctx.beginPath();
    ctx.moveTo(this.x - this.direction * this.width / 2, this.y);
    if(this.parent.isRoot){
      this.direction===1 && ctx.lineTo(this.parent.hubPos_r[0], this.parent.hubPos_r[1]);
      this.direction===-1 && ctx.lineTo(this.parent.hubPos_l[0], this.parent.hubPos_l[1]);
    }else{
      ctx.lineTo(this.parent.hubPos[0], this.parent.hubPos[1]);
    }
    ctx.stroke();
  },
  getHubPos() {
    if(this.isRoot){
      this.hubPos_l = [this.x + -1 * (this.width / 2 + 55), this.y];
      this.hubPos_r = [this.x + 1 * (this.width / 2 + 55), this.y];
    }else{
      this.hubPos = [this.x + this.direction * (this.width / 2 + 55), this.y];
    }
  },
  get_children_nodes(dir){
    return this.children.filter(item=>item.direction===dir);
  },
};

function Mind(opts, node_json) {
  this.opts = opts;
  this.node_json = [].concat(node_json);
  this.nodes = [];

  this.rank_max_l = 0;
  this.rank_max_r= 0;
  this.rank_nodes = [];
  this.expanded_nodes_l = [];
  this.expanded_nodes_r = [];
  this.canvas_center = util.getCanvasCenterPos();

  this.get_nodes();
  this.get_rank();

  this.get_expanded_nodes(1);
  this.get_expanded_nodes(-1);

  let rank_max_length_r = this.get_rank_max_length(1);
  let rank_max_length_l = this.get_rank_max_length(-1);
  if(rank_max_length_r>=rank_max_length_l){
    this.layout_backward(1);
    this.layout_forward(-1);
  }else{
    this.layout_backward(-1);
    this.layout_forward(1);
  }
  

  this.show_view();
}
Mind.prototype = {
  get_nodes() {
    for (var i = 0; i < this.node_json.length; i++) {
      this.nodes.push(this._parse(this.node_json[i]));
    }
  },
  _parse(node_json, parent_node, parent_node_json) {
    node_json.x = null;
    node_json.y = null;

    let node = this.add_node(node_json);
    node.parent = parent_node;
    if (node_json.children) {
      node.children = [];
      for (let index = 0; index < node_json.children.length; index++) {
        let child_node_json = node_json.children[index];
        child_node_json.child_index = index;

        let child_node = this._parse(child_node_json, node, node_json);
        node.children.push(child_node);
      }
    }
    return node;
  },

  add_node(node_json) {
    return new KeyNode({
      id: util.newid(),
      content: node_json.content,
      x: node_json.x,
      y: node_json.y,
      width: this.opts.keyNode_w,
      height: this.opts.keyNode_h,
      child_index: node_json.child_index,
      children: node_json.children,
      rank_index: node_json.rank_index,
      expanded: node_json.expanded,
      direction: node_json.direction,
      isRoot: node_json.isRoot,
    });
  },
  get_rank() {
    let t = this;
    for (var i = 0; i < this.nodes.length; i++) {
      (function _rank(obj, rankid) {
        obj.rank_index = rankid;
        t.rank_max_r = obj.direction===1 && rankid > t.rank_max_r ? rankid : t.rank_max_r;
        t.rank_max_l = obj.direction===-1 && rankid > t.rank_max_l ? rankid : t.rank_max_l;
        t.rank_nodes[rankid] = t.rank_nodes[rankid] || [];
        t.rank_nodes[rankid].push(obj);
        if (obj.children) {
          for (var j = 0; j < obj.children.length; j++) {
            _rank(obj.children[j], rankid + 1);
          }
        }
      })(t.nodes[i], 0);
    }
  },

  show_view() {
    for (var i = 0; i < this.nodes.length; i++) {
      this._draw_nodes(this.nodes[i]);
      this._draw_lines(this.nodes[i]);
    }
  },
  _draw_nodes(node) {
    if (node.parent && !node.parent.expanded) return;
    node.show();
    if (node.children) {
      for (let index = 0; index < node.children.length; index++) {
        let child_node = node.children[index];
        this._draw_nodes(child_node);
      }
    }
  },
  _draw_lines(node) {
    if (node.parent && !node.parent.expanded) return;
    if (node.children && node.expanded) {
      node.drawLine_to_child();
      for (let index = 0; index < node.children.length; index++) {
        let child_node = node.children[index];
        child_node.drawLine_to_parent();
        this._draw_lines(child_node);
      }
    }
  },

  get_expanded_nodes(dir) {
    let t = this;
    let expanded_nodes = [];
    let rank_max = dir===1?t.rank_max_r:t.rank_max_l;
    for (var i = 0; i < t.nodes.length; i++) {
      // 根节点
      if (!expanded_nodes[0]) expanded_nodes[0] = [];
      expanded_nodes[0].push(t.nodes[i]);
      // 子节点
      (function _expanded(obj) {
        if (!obj.isRoot && obj.direction !== dir) return;
        if (obj.rank_index + 1 > rank_max) return;
        if (!expanded_nodes[obj.rank_index + 1])
          expanded_nodes[obj.rank_index + 1] = [];

        if (obj.children && obj.expanded) {
          var children = obj.children.filter(item=>item.direction===dir)
          if(children.length){
            expanded_nodes[obj.rank_index + 1].push(children);
          }
        } else {
          expanded_nodes[obj.rank_index + 1].push({
            isEmpty: true,
            rank_index: obj.rank_index + 1,
          });
        }

        if (obj.children && obj.expanded) {
          for (var j = 0; j < obj.children.length; j++) {
            _expanded(obj.children[j]);
          }
        } else {
          _expanded({ isEmpty: true, rank_index: obj.rank_index + 1 });
        }
      })(t.nodes[i]);
    }
    if (dir === 1) {
      t.expanded_nodes_r = expanded_nodes;
    } else {
      t.expanded_nodes_l = expanded_nodes;
    }
  },
  get_rank_max_length(dir){
    let expanded_nodes = dir === 1 ? this.expanded_nodes_r : this.expanded_nodes_l;
    return util.flatArray(expanded_nodes[expanded_nodes.length-1]);
  }
  // 从末级节点向根节点推定位
  layout_backward(dir) {
    let expanded_nodes = dir === 1 ? this.expanded_nodes_r : this.expanded_nodes_l;

    var expanded_rank_max = expanded_nodes.length - 1;
    var rank_max_nodes = util.flatArray(expanded_nodes[expanded_rank_max]);

    let rank_max_nodes_total_height = rank_max_nodes.length * this.opts.keyNode_h + (rank_max_nodes.length - 1) * 20;
    let top_h = this.canvas_center.y - rank_max_nodes_total_height / 2 + this.opts.keyNode_h / 2;

    for (var i = 0; i < rank_max_nodes.length; i++) {
      rank_max_nodes[i].x = this.canvas_center.x + dir * expanded_rank_max * (this.opts.keyNode_w + 110);
      rank_max_nodes[i].y = top_h + i * (this.opts.keyNode_h + 20);
    }

    // 前面级的节点
    for (var i = expanded_nodes.length - 2; i >= 0; i--) {
      var curr_rank_nodes = expanded_nodes[i]; //i为级数
      var next_rank_nodes = expanded_nodes[i + 1]; //获取到后面那级的数据
      var curr_rank_nodes_flat = util.flatArray(curr_rank_nodes);
      for (var j = 0; j < curr_rank_nodes_flat.length; j++) {
        var node = curr_rank_nodes_flat[j];
        node.x = this.canvas_center.x + dir * i * (this.opts.keyNode_w + 110);
        console.log(node.content,node.x,dir)

        if (next_rank_nodes[j] instanceof Object && next_rank_nodes[j].isEmpty) {
          node.y = next_rank_nodes[j].y;
        } else {
          var children = node.children.filter(item=>item.direction===dir);
          if(children.length){
            node.y = (children[0].y + children[children.length - 1].y) / 2;
          }
        }
      }
    }

  },
  // 从根节点向末级节点推定位
  layout_forward(dir){

  }
};

// 绘制节点
new Mind({ keyNode_w: 320, keyNode_h: 100 }, [
  {
    content: "中心节点1",
    isRoot: true,
    expanded: true,
    children: [
      {
        content: "子节点1-1",
        direction: 1,
        expanded: true,
        children: [
          {
            content: "子节点1-1-1",
            direction: 1,
          },
          {
            content: "子节点1-1-2",
            direction: 1,
          },
        ],
      },
      {
        content: "子节点1-2",
        direction: -1,
        expanded: true,
        children: [
          {
            content: "子节点1-2-1",
            direction: -1,
          },
          {
            content: "子节点1-2-2",
            direction: -1,
          },
        ],
      },
    ],
  },
  {
    content: "中心节点2",
    isRoot: true,
    expanded: true,
    children: [
      {
        content: "子节点2-1",
        direction: -1,
        expanded: true,
        children: [
          {
            content: "子节点2-1-1",
            direction: -1,
          },
          {
            content: "子节点2-1-2",
            direction: -1,
          },
        ],
      },
      {
        content: "子节点2-2",
        direction: -1,
        expanded: true,
        children: [
          {
            content: "子节点2-2-1",
            direction: -1,
          },
          {
            content: "子节点2-2-2",
            direction: -1,
          },
        ],
      },
    ],
  },
]);

