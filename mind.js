(function (window) {
  const isValueNull = function (val) {
    return val === "" || val === null || val === undefined;
  };

  var qjm = function (opts, data, fn) {
    this.opts = opts;
    this.node_json = data;
    this.fn = fn;
    this.canvas_container = null;
    this.canvas = null;
    this.ctx = null;
    this.ratio = null;
    this.scale = 1;
    this.canvas_center_pos = {};
    this.all_node_pos_map = {};
    this.mind = null;

    this.init();
    this.create_mind();
    this.add_event();
  };
  qjm.prototype = {
    init() {
      this.canvas_container = document.querySelector(this.opts.container);
      this.canvas = document.createElement("canvas");
      this.canvas_container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");

      var w = this.canvas_container.offsetWidth;
      var h = this.canvas_container.offsetHeight;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";

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
    create_mind() {
      this.mind = new qjm.Mind(this, this.opts, this.node_json);
    },
    clearCanvas() {
      // 矩阵换算鼠标点击位置对应的新坐标
      var cT = this.ctx.getTransform();
      let matrix = [cT.a, cT.b, cT.c, cT.d, cT.e, cT.f];
      var lt = this._getXY(matrix, 0, 0);
      var rb = this._getXY(
        matrix,
        this.canvas_container.offsetWidth,
        this.canvas_container.offsetHeight
      );
      this.ctx.clearRect(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    },
    changeLayout() {
      this.clearCanvas();
      this.mind.init();
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
      this.add_event_click();
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
      this.canvas.addEventListener("wheel", (e) => {
        let zoom = 1;
        e.stopPropagation();
        e.preventDefault();
        if (e.ctrlKey) {
          if (e.deltaY > 0) zoom = 0.95;
          if (e.deltaY < 0) zoom = 1.05;
          if (this.scale * zoom > 1.1 || this.scale * zoom < 0.8) return;
          this.scale *= zoom;

          this.clearCanvas();
          this.ctx.translate(e.offsetX, e.offsetY);
          this.ctx.scale(zoom, zoom);
          this.ctx.translate(-e.offsetX, -e.offsetY);

          requestAnimationFrame(() => {
            this.mind.show_view();
          });
        }
      });
    },
    add_event_dragmove() {
      var t = this;
      var canvas = this.canvas;
      var isDown = false;
      var x, y;
      function _mousemove(e) {
        if (!isDown) return;
        t.clearCanvas();
        t.ctx.translate((e.clientX - x) / t.scale, (e.clientY - y) / t.scale);
        requestAnimationFrame(() => {
          t.mind.show_view();
        });
        x = e.clientX;
        y = e.clientY;
        return false;
      }
      function _mouseup(e) {
        //开关关闭
        canvas.style.cursor = "default";
        canvas.removeEventListener("mousemove", _mousemove);
        canvas.removeEventListener("mouseup", _mouseup);
        isDown = false;
      }
      canvas.addEventListener("mousedown", (e) => {
        //获取x坐标和y坐标
        x = e.clientX;
        y = e.clientY;
        //开关打开
        isDown = true;
        canvas.style.cursor = "grabbing";
        canvas.addEventListener("mousemove", _mousemove);
        canvas.addEventListener("mouseup", _mouseup);
        return false;
      });
    },
    add_event_click() {
      var canvas = this.canvas;
      var ctx = this.ctx;
      canvas.addEventListener("click", (e) => {
        // 矩阵换算鼠标点击位置对应的新坐标
        var cT = ctx.getTransform();
        let matrix = [cT.a, cT.b, cT.c, cT.d, cT.e, cT.f];
        var newxy = this._getXY(matrix, e.offsetX, e.offsetY);
        var ex = newxy.x;
        var ey = newxy.y;

        var all_nodes = this.all_node_pos_map;
        // 点击内容节点
        for (var i = 0; i < all_nodes["keynode"].length; i++) {
          let p = all_nodes["keynode"][i];
          if (
            p.x - p.width / 2 <= ex &&
            ex <= p.x + p.width / 2 &&
            p.y - p.height / 2 <= ey &&
            ey <= p.y + p.height / 2
          ) {
            // console.log("点击了keynode:" + p.content, p.x, p.y);
            this.fn.keyNodeClick && this.fn.keyNodeClick(p);
            return;
          }
        }
        // 点击分支桥接节点
        for (var type in all_nodes) {
          if (type == "keynode") continue;
          for (var i = 0; i < all_nodes[type].length; i++) {
            let p = all_nodes[type][i];
            if (
              Math.pow(ex - p[type][0], 2) + Math.pow(ey - p[type][1], 2) <
              100
            ) {
              // console.log(`点击了${p.content}的hub节点${type}`);
              if (type == "hubPos_l") p.expanded_l = !p.expanded_l;
              if (type == "hubPos_r") p.expanded_r = !p.expanded_r;
              if (type == "hubPos") p.expanded = !p.expanded;
              this.changeLayout();
              return;
            }
          }
        }
      });
    },
    // 矩阵换算
    _getXY(matrix, mouseX, mouseY) {
      var newX = (mouseX * this.ratio - matrix[4]) / matrix[0];
      var newY = (mouseY * this.ratio - matrix[5]) / matrix[3];
      return { x: newX, y: newY };
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

  // 节点构造函数
  qjm.KeyNode = function (qjm, node_json) {
    this.qjm = qjm;
    this.id = node_json.id || 0;
    this.content = node_json.content;
    this.x = node_json.x;
    this.y = node_json.y;
    this.width = qjm.opts.keyNode_w;
    this.height = qjm.opts.keyNode_h;
    this.child_index = node_json.child_index;
    this.rank_index = node_json.rank_index;
    this.direction = node_json.direction;
    this.isRoot = node_json.isRoot;
    this.parent = null;
    this.children = node_json.children;
    if (this.root) {
      this.expanded_l = node_json.expanded_l;
      this.expanded_r = node_json.expanded_r;
      this.hubPos_l = null;
      this.hubPos_r = null;
    } else {
      this.hubPos = null;
      this.expanded = node_json.expanded;
    }
  };
  qjm.KeyNode.prototype = {
    show() {
      this.getHubPos();
      this.drawRect();
      this.drawText();
    },
    set_mind_pos_map(type, node_pos) {
      var map = this.qjm.all_node_pos_map;
      if (!map[type]) map[type] = [];
      map[type].push(node_pos);
    },
    drawRect() {
      var ctx = this.qjm.ctx;
      if (isValueNull(this.x) || isValueNull(this.y)) {
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(31,35,41,0.08)";

      ctx.fillRect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
      );
      ctx.fill();
      ctx.restore();

      this.set_mind_pos_map("keynode", this);
    },
    _drawMultiText(str, initX, initY, maxWidth, maxLine) {
      var ctx = this.qjm.ctx;
      var lineWidth = 0;
      var lastSubStrIndex = 0;
      var lineNum = 0;
      for (let i = 0; i < str.length; i++) {
        lineWidth += ctx.measureText(str[i]).width;
        if (lineWidth > this.width - 60) {
          lineNum += 1;
          if (lineNum > maxLine) {
            return;
          }
          ctx.fillText(str.substring(lastSubStrIndex, i), initX, initY);
          initY += 20;
          lineWidth = 0;
          lastSubStrIndex = i;
        }
        if (i == str.length - 1) {
          ctx.fillText(str.substring(lastSubStrIndex, i + 1), initX, initY);
        }
      }
    },
    drawText() {
      var obj = {
        avatarName: "G",
        name: "刘新",
        dept: "前端组",
        content: this.content,
      };
      var ctx = this.qjm.ctx;
      var x0 = this.x - this.width / 2;
      var y0 = this.y - this.height / 2;
      // 画头像
      ctx.save();
      ctx.beginPath();
      ctx.arc(x0 + 30, y0 + 30, 15, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fillStyle = "#1bc489";
      ctx.fill();
      ctx.restore();
      // 姓名+部门名
      ctx.save();
      ctx.font = "12px Arial";
      ctx.fillStyle = "#000000";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText(obj.name + "  " + obj.dept, x0 + 54, y0 + 20);
      ctx.font = "14px Arial";
      this._drawMultiText(obj.content, x0 + 54, y0 + 46, this.width - 60, 2);
      ctx.restore();
    },
    drawLine_to_child() {
      var ctx = this.qjm.ctx;
      ctx.save();
      if (this.isRoot) {
        if (this.get_children_nodes(1).length) {
          ctx.beginPath();
          ctx.moveTo(this.x + (1 * this.width) / 2, this.y);
          ctx.lineTo(this.hubPos_r[0], this.hubPos_r[1]);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
          this.drawHub(this.hubPos_r, this.get_children_nodes(1).length);
        }
        if (this.get_children_nodes(-1).length) {
          ctx.beginPath();
          ctx.moveTo(this.x + (-1 * this.width) / 2, this.y);
          ctx.lineTo(this.hubPos_l[0], this.hubPos_l[1]);
          ctx.closePath();
          ctx.stroke();
          this.drawHub(this.hubPos_l, this.get_children_nodes(-1).length);
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(this.x + (this.direction * this.width) / 2, this.y);
        ctx.lineTo(this.hubPos[0], this.hubPos[1]);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        this.drawHub(this.hubPos, this.children.length);
      }
    },
    drawLine_to_parent() {
      var ctx = this.qjm.ctx;
      ctx.save();
      ctx.beginPath();
      var moveToX = this.x - (this.direction * this.width) / 2;
      var moveToY = this.y;
      ctx.moveTo(moveToX,moveToY);
      if (this.parent.isRoot) {
        this.direction === 1 &&
          ctx.quadraticCurveTo(moveToX-50,moveToY,this.parent.hubPos_r[0], this.parent.hubPos_r[1]);
        this.direction === -1 &&
          ctx.quadraticCurveTo(moveToX+50,moveToY,this.parent.hubPos_l[0], this.parent.hubPos_l[1]);
      } else {
        ctx.quadraticCurveTo(this.direction===1?moveToX-50:moveToX+50,moveToY,this.parent.hubPos[0], this.parent.hubPos[1]);
      }
      ctx.stroke();
      ctx.restore();
    },
    drawHub(pos, child_len) {
      if (this.isRoot) {
        if (this.get_children_nodes(1).length) {
          this._drawHub(this.hubPos_r, this.get_children_nodes(1).length);
          this.set_mind_pos_map("hubPos_r", this);
        }
        if (this.get_children_nodes(-1).length) {
          this._drawHub(this.hubPos_l, this.get_children_nodes(-1).length);
          this.set_mind_pos_map("hubPos_l", this);
        }
      } else {
        this._drawHub(this.hubPos, this.children.length);
        this.set_mind_pos_map("hubPos", this);
      }
    },
    _drawHub(pos, child_len) {
      var ctx = this.qjm.ctx;
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(31,35,41,0.08)";
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], 10, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (child_len > 0) {
        ctx.save();
        ctx.fillStyle = "#000000";
        ctx.font = "30px";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(child_len, pos[0], pos[1]);
        ctx.restore();
      }
    },
    getHubPos() {
      if (this.isRoot) {
        this.hubPos_l = [this.x + -1 * (this.width / 2 + 40), this.y];
        this.hubPos_r = [this.x + 1 * (this.width / 2 + 40), this.y];
      } else {
        this.hubPos = [this.x + this.direction * (this.width / 2 + 40), this.y];
      }
    },
    get_children_nodes(dir) {
      return this.children.filter((item) => item.direction === dir);
    },
  };

  // 树图构造函数
  qjm.Mind = function (qjm, opts, node_json) {
    this.qjm = qjm;
    this.opts = opts;
    this.canvas_center = null;
    this.node_json = [].concat(node_json);
    this.nodes = [];
    this.nodes_flat_array = [];
    this.expanded_node_group = [];
    this.total_height = 0;
    this.total_max_node_length = 0;

    this.get_nodes();
    this.init();
  };
  qjm.Mind.prototype = {
    init() {
      this.canvas_center = this.qjm.getCanvasCenterPos();
      this.get_expanded_node_group();
      this.get_group_max_length();
      this.layout(); //给每个节点赋值xy坐标值
      this.show_view();
    },
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
      let node = new qjm.KeyNode(this.qjm, node_json);
      node.id = qjm.util.newid();
      this.nodes_flat_array.push(node);
      return node;
    },

    show_view() {
      for (var i = 0; i < this.nodes.length; i++) {
        this._draw_nodes(this.nodes[i]);
        this._draw_lines(this.nodes[i]);
        //TODO:每组的间隔
      }
    },
    _draw_nodes(node) {
      if (node.parent && node.parent.isRoot) {
        if (node.direction === -1 && !node.parent.expanded_l) return;
        if (node.direction === 1 && !node.parent.expanded_r) return;
      }
      if (node.parent && !node.parent.isRoot) {
        if (!node.parent.expanded) return;
      }
      node.show();
      if (node.children) {
        for (let index = 0; index < node.children.length; index++) {
          let child_node = node.children[index];
          this._draw_nodes(child_node);
        }
      }
    },
    _draw_lines(node) {
      if (node.parent && node.parent.isRoot) {
        if (node.direction === -1 && !node.parent.expanded_l) return;
        if (node.direction === 1 && !node.parent.expanded_r) return;
      }
      if (node.parent && !node.parent.isRoot) {
        if (!node.parent.expanded) return;
      }
      if (node.parent) {
        node.drawLine_to_parent();
      }
      if (node.children) {
        node.drawLine_to_child();
        for (let index = 0; index < node.children.length; index++) {
          // if (node.expanded) {
          let child_node = node.children[index];
          //   child_node.drawLine_to_parent();
          this._draw_lines(child_node);
          // }
        }
        node.drawHub();
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

          if (
            obj.children &&
            obj.children.length &&
            (obj.expanded || obj.expanded_l || obj.expanded_r)
          ) {
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
      t.total_height = 0;
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
      for (var i = 0; i < t.nodes.length; i++) {
        var group = t.nodes[i];
        var dir = group.group_info.max_side_direction;
        var expanded_nodes_l = group.group_info.expanded_nodes_l;
        var expanded_nodes_r = group.group_info.expanded_nodes_r;
        // 比较左右两边的高度，值大则反向布局，值小的正向布局
        // 左边
        var rank_max_nodes_length_l = qjm.util.flatArray(
          expanded_nodes_l[expanded_nodes_l.length - 1]
        );
        // 右边
        var rank_max_nodes_length_r = qjm.util.flatArray(
          expanded_nodes_r[expanded_nodes_r.length - 1]
        );
        if (rank_max_nodes_length_l > rank_max_nodes_length_r) {
          t._layout_backward(expanded_nodes_l, -1, group.group_info.center_pos);
          t._layout_forward(expanded_nodes_r, 1, group.group_info.center_pos);
        } else {
          t._layout_backward(expanded_nodes_r, 1, group.group_info.center_pos);
          t._layout_forward(expanded_nodes_l, -1, group.group_info.center_pos);
        }
      }
    },

    // 反向推定位：从末级节点向根节点推定位
    _layout_backward(expanded_nodes, dir, group_center_pos) {
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
    // 正向推定位：从根级节点向末级推定位
    _layout_forward(expanded_nodes, dir, group_center_pos) {
      var y0 = expanded_nodes[0].y;
      this._layout_backward(expanded_nodes, dir, group_center_pos);
      var y1 = expanded_nodes[0].y;
      var diff = y1 - y0;
      for (var i = 0; i < expanded_nodes.length; i++) {
        var curr_rank_nodes = expanded_nodes[i]; //i为级数
        var curr_rank_nodes_flat = qjm.util.flatArray(curr_rank_nodes);
        for (var j = 0; j < curr_rank_nodes_flat.length; j++) {
          var node = curr_rank_nodes_flat[j];
          if (!node.isEmpty) node.y -= diff;
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
