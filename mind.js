(function (window) {
  var qjm = function (opts, data) {
    this.opts = opts;
    this.node_json = data;
    this.canvas_container = null;
    this.canvas = null;
    this.ctx = null;
    this.ratio = null;
    this.scale = 1;
    this.canvas_center_pos = {};
    this.init();
    this.add_event();

    this.mind = new qjm.Mind(this, opts, data);
  };
  qjm.prototype = {
    init() {
      this.canvas_container = document.querySelector(this.opts.container);
      this.canvas = this.canvas_container.querySelector("canvas");
      this.ctx = this.canvas.getContext("2d");

      var w = this.canvas_container.offsetWidth * 3;
      var h = this.canvas_container.offsetHeight * 3;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
      this.canvas.style.left =
        -w / 2 + this.canvas_container.offsetWidth / 2 + "px";
      this.canvas.style.top =
        -h / 2 + this.canvas_container.offsetHeight / 2 + "px";

      // 屏幕的设备像素比
      var devicePixelRatio = window.devicePixelRatio || 1;
      // 浏览器在渲染canvas之前存储画布信息的像素比
      var backingStoreRatio =
        this.ctx.webkitBackingStorePixelRatio ||
        this.ctx.mozBackingStorePixelRatio ||
        this.ctx.msBackingStorePixelRatio ||
        this.ctx.oBackingStorePixelRatio ||
        this.ctx.backingStorePixelRatio ||
        1;
      // canvas的实际渲染倍率
      this.ratio = devicePixelRatio / backingStoreRatio;
      this.canvas.width *= this.ratio;
      this.canvas.height *= this.ratio;
      this.ctx.scale(this.ratio, this.ratio);

      this.canvas_center_pos = this.getCanvasCenterPos();
    },
    clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    // 计算画布中心
    getCanvasCenterPos() {
      return {
        x: this.canvas.width / this.ratio / 2,
        y: this.canvas.height / this.ratio / 2,
      };
    },
    add_event() {
      this.add_event_zoom();
      this.add_event_dragmove();
    },
    add_event_zoom() {
      // 禁用原生页面缩放
      window.addEventListener(
        "mousewheel",
        function (event) {
          if (event.ctrlKey === true || event.metaKey) {
            event.preventDefault();
          }
        },
        { passive: false }
      );
      //firefox
      window.addEventListener(
        "DOMMouseScroll",
        function (event) {
          if (event.ctrlKey === true || event.metaKey) {
            event.preventDefault();
          }
        },
        { passive: false }
      );
      // canvas缩放
      this.canvas.addEventListener(
        "wheel",
        qjm.util.throttle((e) => {
          e.stopPropagation();
          e.preventDefault();
          if (e.ctrlKey) {
            if (e.deltaY > 0) {
              this.scale -= 0.05;
            }
            if (e.deltaY < 0) {
              this.scale += 0.05;
            }
            if (this.scale < 0.2 || this.scale > 1.2) return;
            this.canvas.style.transform = "scale(" + this.scale + ")";
          }
        }, 35)
      );
    },
    add_event_dragmove() {
      var canvas_container = this.canvas_container;
      var canvas = this.canvas;
      var canvas_ratio = this.ratio;
      var isDown = false;
      var x, y, l, t;
      function _mousemove(e) {
        if (isDown == false) {
          return;
        }
        //获取x和y
        var nx = e.clientX;
        var ny = e.clientY;
        //计算移动后的左偏移量和顶部的偏移量
        var nl = l + nx - x;
        var nt = t + ny - y;

        canvas.style.left = nl + "px";
        canvas.style.top = nt + "px";
        return false;
      }
      function _mouseup(e) {
        //开关关闭
        canvas.style.cursor = "default";
        canvas_container.removeEventListener("mousemove", _mousemove);
        canvas_container.removeEventListener("mouseup", _mouseup);
        isDown = false;
      }
      canvas_container.addEventListener("mousedown", (e) => {
        console.log("mousedown", this.canvas.width, this.canvas.height);
        //获取x坐标和y坐标
        x = e.clientX;
        y = e.clientY;

        //获取左部和顶部的偏移量
        l = parseFloat(canvas.style.left) || 0;
        t = parseFloat(canvas.style.top) || 0;
        //开关打开
        isDown = true;
        canvas.style.cursor = "move";
        canvas_container.addEventListener("mousemove", _mousemove);
        canvas_container.addEventListener("mouseup", _mouseup);
        return false;
      });
    },
  };

  qjm.util = {
    throttle(fn, wait) {
      let timer;
      return function () {
        if (!timer) {
          timer = setTimeout(() => {
            fn.apply(this, arguments);
            clearTimeout(timer);
            timer = null;
          }, wait);
        }
      };
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
            objClone[i] = qjm.util.deepClone(obj[i]);
          }
        }
      } else if (obj && obj instanceof Object) {
        for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (obj[key] && typeof obj[key] === "object") {
              objClone[key] = qjm.util.deepClone(obj[key]);
            } else {
              objClone[key] = obj[key];
            }
          }
        }
      }
      return objClone;
    },
    flatArray(arr) {
      arr = [].concat(arr);
      let arr1 = [];
      arr.forEach((item) => {
        if (item instanceof Array) {
          arr1 = arr1.concat(qjm.util.flatArray(item));
        } else {
          arr1.push(item);
        }
      });
      return arr1;
    },
  };

  // 文本节点构造函数
  qjm.KeyNode = function (qjm, args) {
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
    this.qjm = qjm;
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
  };
  qjm.KeyNode.prototype = {
    show() {
      this.getHubPos();
      this.drawRect();
      this.drawText();
    },
    drawRect() {
      var ctx = this.qjm.ctx;
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
      var ctx = this.qjm.ctx;
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
      var ctx = this.qjm.ctx;
      ctx.beginPath();
      if (this.isRoot) {
        if (this.get_children_nodes(1).length) {
          ctx.moveTo(this.x + (1 * this.width) / 2, this.y);
          ctx.lineTo(this.hubPos_r[0], this.hubPos_r[1]);
        }
        if (this.get_children_nodes(-1).length) {
          ctx.moveTo(this.x + (-1 * this.width) / 2, this.y);
          ctx.lineTo(this.hubPos_l[0], this.hubPos_l[1]);
        }
      } else {
        ctx.moveTo(this.x + (this.direction * this.width) / 2, this.y);
        ctx.lineTo(this.hubPos[0], this.hubPos[1]);
      }
      ctx.stroke();
    },
    drawLine_to_parent() {
      var ctx = this.qjm.ctx;
      ctx.beginPath();
      ctx.moveTo(this.x - (this.direction * this.width) / 2, this.y);
      if (this.parent.isRoot) {
        this.direction === 1 &&
          ctx.lineTo(this.parent.hubPos_r[0], this.parent.hubPos_r[1]);
        this.direction === -1 &&
          ctx.lineTo(this.parent.hubPos_l[0], this.parent.hubPos_l[1]);
      } else {
        ctx.lineTo(this.parent.hubPos[0], this.parent.hubPos[1]);
      }
      ctx.stroke();
    },
    getHubPos() {
      if (this.isRoot) {
        this.hubPos_l = [this.x + -1 * (this.width / 2 + 55), this.y];
        this.hubPos_r = [this.x + 1 * (this.width / 2 + 55), this.y];
      } else {
        this.hubPos = [this.x + this.direction * (this.width / 2 + 55), this.y];
      }
    },
    get_children_nodes(dir) {
      return this.children.filter((item) => item.direction === dir);
    },
  };

  qjm.Mind = function (qjm, opts, node_json) {
    this.qjm = qjm;
    this.opts = opts;
    this.canvas_center = this.qjm.canvas_center_pos;
    this.node_json = [].concat(node_json);
    this.nodes = [];
    this.expanded_node_group = [];
    this.total_height = 0;
    this.total_max_node_length = 0;

    this.get_nodes();
    this.get_expanded_node_group();
    this.get_group_max_length();
    this.layout();
    this.show_view();
  };
  qjm.Mind.prototype = {
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
      return new qjm.KeyNode(this.qjm, {
        id: qjm.util.newid(),
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

    show_view() {
      for (var i = 0; i < this.nodes.length; i++) {
        this._draw_nodes(this.nodes[i]);
        this._draw_lines(this.nodes[i]);
        //每组的间隔
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

    get_expanded_node_group() {
      var t = this;
      var group = [];
      for (var i = 0; i < t.nodes.length; i++) {
        var group_info = {
          group_index: i,
          expanded_rank_max_l: 0,
          expanded_rank_max_r: 0,
          expanded_nodes_l: [],
          expanded_nodes_r: [],
        };
        group_info.expanded_nodes_l[0] = t.nodes[i];
        group_info.expanded_nodes_r[0] = t.nodes[i];

        (function _rank(obj, rankid) {
          obj.rank_index = rankid;
          group_info.expanded_rank_max_r =
            obj.direction === 1 && rankid > group_info.expanded_rank_max_r
              ? rankid
              : group_info.expanded_rank_max_r;
          group_info.expanded_rank_max_l =
            obj.direction === -1 && rankid > group_info.expanded_rank_max_l
              ? rankid
              : group_info.expanded_rank_max_l;

          // 有展开的子元素，则给下一级push进去他的所有子元素数组
          if (!group_info.expanded_nodes_l[rankid + 1])
            group_info.expanded_nodes_l[rankid + 1] = [];
          if (!group_info.expanded_nodes_r[rankid + 1])
            group_info.expanded_nodes_r[rankid + 1] = [];

          if (obj.children && obj.children.length && obj.expanded) {
            var children_l = [],
              children_r = [];
            obj.children.forEach((item) => {
              if (item.direction === -1) children_l.push(item);
              if (item.direction === 1) children_r.push(item);
            });
            children_l.length &&
              group_info.expanded_nodes_l[rankid + 1].push(children_l);
            children_r.length &&
              group_info.expanded_nodes_r[rankid + 1].push(children_r);

            for (var j = 0; j < obj.children.length; j++) {
              _rank(obj.children[j], rankid + 1);
            }
          } else {
            // 没有展开的子元素，则给下一级加一个空元素 用来占位
            if (obj.isRoot || (!obj.isRoot && obj.direction === -1))
              group_info.expanded_nodes_l[rankid + 1].push({
                isEmpty: true,
                rank_index: rankid + 1,
              });
            if (obj.isRoot || (!obj.isRoot && obj.direction === 1))
              group_info.expanded_nodes_r[rankid + 1].push({
                isEmpty: true,
                rank_index: rankid + 1,
              });
          }
        })(t.nodes[i], 0);

        group_info.expanded_nodes_l = group_info.expanded_nodes_l.slice(
          0,
          group_info.expanded_rank_max_l + 1
        );
        group_info.expanded_nodes_r = group_info.expanded_nodes_r.slice(
          0,
          group_info.expanded_rank_max_r + 1
        );

        t.nodes[i].group_info = group_info;
      }
    },
    // 组的最大末级节点数
    get_group_max_length() {
      var t = this;
      for (var i = 0; i < t.nodes.length; i++) {
        var group_info = t.nodes[i].group_info;
        // 对比左右两边的末级节点的高度，将最大值赋值给节点组高度
        var node_length_l = qjm.util.flatArray(
          group_info.expanded_nodes_l[group_info.expanded_nodes_l.length - 1]
        ).length;
        var node_length_r = qjm.util.flatArray(
          group_info.expanded_nodes_r[group_info.expanded_nodes_r.length - 1]
        ).length;

        group_info.max_node_length = Math.max(node_length_l, node_length_r);
        group_info.total_height =
          group_info.max_node_length * t.opts.keyNode_h + (length - 1) * 20;
        if (node_length_l >= node_length_r) {
          group_info.max_side_direction = -1;
        } else {
          group_info.max_side_direction = 1;
        }
      }
    },

    _get_total_height() {
      var t = this;
      for (var i = 0; i < t.nodes.length; i++) {
        t.total_max_node_length += t.nodes[i].group_info.max_node_length;
        t.total_height += t.nodes[i].group_info.total_height;
      }

      var top = t.canvas_center.y - t.total_height / 2;
      var bottom = t.canvas_center.y + t.total_height / 2;
      for (var i = 0; i < t.nodes.length; i++) {
        var group_info = t.nodes[i].group_info;

        if (i > 0 && t.nodes[i - 1].group_info.top_y) {
          group_info.top_y =
            t.nodes[i - 1].group_info.top_y +
            t.nodes[i - 1].group_info.total_height +
            100;
          group_info.center_pos = {
            x: this.canvas_center.x,
            y: group_info.top_y + group_info.total_height / 2,
          };
        } else {
          group_info.top_y = top;
          group_info.center_pos = {
            x: this.canvas_center.x,
            y: group_info.top_y + group_info.total_height / 2,
          };
        }
      }
    },
    layout() {
      var t = this;
      t._get_total_height();
      console.log("nodes", t.nodes);
      for (var i = 0; i < t.nodes.length; i++) {
        var group = t.nodes[i];
        var dir = group.group_info.max_side_direction;
        t._layout(
          group.group_info.expanded_nodes_r,
          1,
          group.group_info.center_pos
        );
        t._layout(
          group.group_info.expanded_nodes_l,
          -1,
          group.group_info.center_pos
        );
      }
    },

    // 从末级节点向根节点推定位
    _layout(expanded_nodes, dir, group_center_pos) {
      // 末级
      var expanded_rank_max = expanded_nodes.length - 1;
      var rank_max_nodes = qjm.util.flatArray(
        expanded_nodes[expanded_rank_max]
      );

      let rank_max_nodes_total_height =
        rank_max_nodes.length * this.opts.keyNode_h +
        (rank_max_nodes.length - 1) * 20;
      let top_h =
        group_center_pos.y -
        rank_max_nodes_total_height / 2 +
        this.opts.keyNode_h / 2;

      for (var i = 0; i < rank_max_nodes.length; i++) {
        rank_max_nodes[i].x =
          group_center_pos.x +
          dir * expanded_rank_max * (this.opts.keyNode_w + 110);
        rank_max_nodes[i].y = top_h + i * (this.opts.keyNode_h + 20);
      }

      // 前面级的节点
      for (var i = expanded_nodes.length - 2; i >= 0; i--) {
        var curr_rank_nodes = expanded_nodes[i]; //i为级数
        var next_rank_nodes = expanded_nodes[i + 1]; //获取到后面那级的数据
        var curr_rank_nodes_flat = qjm.util.flatArray(curr_rank_nodes);
        for (var j = 0; j < curr_rank_nodes_flat.length; j++) {
          var node = curr_rank_nodes_flat[j];
          node.x = group_center_pos.x + dir * i * (this.opts.keyNode_w + 110);

          if (
            next_rank_nodes[j] instanceof Object &&
            next_rank_nodes[j].isEmpty
          ) {
            node.y = next_rank_nodes[j].y;
          } else {
            var children = node.children.filter(
              (item) => item.direction === dir
            );
            if (children.length) {
              node.y = (children[0].y + children[children.length - 1].y) / 2;
            }
          }
        }
      }
    },
  };

  // export qjMind
  if (typeof module !== "undefined" && typeof exports === "object") {
    module.exports = qjm;
  } else if (typeof define === "function" && (define.amd || define.cmd)) {
    define(function () {
      return qjm;
    });
  } else {
    window["qjMind"] = qjm;
  }
})(window);
