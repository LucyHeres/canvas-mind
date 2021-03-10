(function (window) {
  const isValueNull = function (val) {
    return val === "" || val === null || val === undefined;
  };

  var qjm = function (opts, fn) {
    this.opts = opts;
    this.fn = fn;
    this.canvasContainer = null;
    this.canvas = null;
    this.ctx = null;
    this.ratio = null;
    this.scale = 0.8;
    this.canvasCenterPos = {};
    this.allNodePosMap = {};
    this.mind = null;

    this.init();
  };
  qjm.prototype = {
    render(data) {
      this.nodeJson = data;
      this.create_mind();
      this.add_event();
    },
    init() {
      this.canvasContainer = document.querySelector(this.opts.container);
      this.canvas = document.createElement("canvas");
      this.canvasContainer.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");

      var w = this.canvasContainer.offsetWidth;
      var h = this.canvasContainer.offsetHeight;
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
      this.canvasCenterPos = this.getCanvasCenterPos();
      this.ctx.scale(this.ratio, this.ratio);
      // 初始化缩放
      this.ctx.translate(this.canvasCenterPos.x, this.canvasCenterPos.y);
      this.ctx.scale(this.scale, this.scale);
      this.ctx.translate(-this.canvasCenterPos.x, -this.canvasCenterPos.y);
    },
    create_mind() {
      this.mind = new qjm.Mind(this, this.opts, this.nodeJson);
    },
    clearCanvas() {
      // 矩阵换算鼠标点击位置对应的新坐标
      var cT = this.ctx.getTransform();
      let matrix = [cT.a, cT.b, cT.c, cT.d, cT.e, cT.f];
      var lt = this._getXY(matrix, 0, 0);
      var rb = this._getXY(
        matrix,
        this.canvasContainer.offsetWidth,
        this.canvasContainer.offsetHeight
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
          if (this.scale * zoom > 1.1 || this.scale * zoom < 0.5) return;
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

        var all_nodes = this.allNodePosMap;
        console.log(all_nodes)
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
              console.log(`点击了${p.content}的hub节点${type}`);
              if (type == "hubPosLeft") p.expandedLeft = !p.expandedLeft;
              if (type == "hubPosRight") p.expandedRight = !p.expandedRight;
              if (type == "hubPos") p.expanded = !p.expanded;
              if (!p.children || !p.children.length) {
                this.fn.hubNodeClick && this.fn.hubNodeClick(p);
              } else {
                this.changeLayout();
              }
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
  qjm.KeyNode = function (qjm, nodeJson) {
    this.qjm = qjm;
    this.objectiveId = nodeJson.objectiveId || 0;
    this.text = nodeJson.text;
    this.shape = nodeJson.shape;
    this.x = nodeJson.x;
    this.y = nodeJson.y;
    this.width = qjm.opts.keyNodeWidth || 320;
    this.height = qjm.opts.keyNodeHeight || 100;
    this.hubRadius = qjm.opts.hubRadius || 10;
    this.lineColor = qjm.opts.lineColor || "#e3e4e5";

    this.rankIndex = nodeJson.rankIndex;
    this.direction = nodeJson.direction;
    this.isRoot = nodeJson.isRoot;
    this.parent = null;
    this.children = nodeJson.children;

    if (this.isRoot) {
      this.expandedLeft = nodeJson.expandedLeft;
      this.expandedRight = nodeJson.expandedRight;
      this.childrenCountLeft = nodeJson.childrenCountLeft;
      this.childrenCountRight = nodeJson.childrenCountRight;
      this.hubPosLeft = null;
      this.hubPosRight = null;
    } else {
      this.hubPos = null;
      this.expanded = nodeJson.expanded;
      this.childrenCount = nodeJson.childrenCount;
    }
  };
  qjm.KeyNode.prototype = {
    show() {
      this.getHubPos();
      this.drawKeyNode();
      this.drawContent();
    },
    set_mind_pos_map(type, nodePos) {
      var map = this.qjm.allNodePosMap;
      if (!map[type]) map[type] = [];
      map[type].push(nodePos);
    },
    drawKeyNode() {
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
    _drawText(str, x, y, w, h, fontsize, lineHeight, textAlign) {
      var ctx = this.qjm.ctx;
      ctx.textAlign = textAlign || "left";
      var currSumWidth = 0;
      var lineNum = 1;
      for (let i = 0; i < str.length; i++) {
        ctx.fillText(str[i], x + currSumWidth, y);
        currSumWidth += ctx.measureText(str[i]).width;
        if (i === str.length - 1) return;
        if (currSumWidth + ctx.measureText(str[i + 1]).width > w) {
          if (lineHeight * (lineNum + 1) > h) {
            ctx.fillText("...", x + currSumWidth, y);
            return;
          }
          y += lineHeight;
          lineNum += 1;
          currSumWidth = 0;
        }
      }
    },
    _drawCircle(left, top, r, centerText, bgcolor) {
      var ctx = this.qjm.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(left, top, r, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fillStyle = bgcolor;
      ctx.fill();
      ctx.restore();
    },
    _drawRect(left, top, w, h, bgcolor) {
      var ctx = this.qjm.ctx;
      ctx.save();
      ctx.fillStyle = bgcolor;
      ctx.fillRect(left, top, w, h);
      ctx.restore();
    },
    drawContent() {
      var ctx = this.qjm.ctx;
      var x0 = this.x - this.width / 2;
      var y0 = this.y - this.height / 2;
      // 画头像
      for (var i = 0; i < this.shape.length; i++) {
        var shapeobj = this.shape[i];
        if (shapeobj.type == "circle") {
          this._drawCircle(
            x0 + shapeobj.left,
            y0 + shapeobj.top,
            shapeobj.r,
            shapeobj.text,
            shapeobj.background
          );
        } else {
          this._drawRect(
            x0 + shapeobj.left,
            y0 + shapeobj.top,
            shapeobj.width,
            shapeobj.height,
            shapeobj.background
          );
        }
      }
      // 姓名+部门名
      for (var i = 0; i < this.text.length; i++) {
        var textobj = this.text[i];
        ctx.save();
        ctx.font = textobj.fontsize + "px April";
        ctx.fillStyle = textobj.color;
        ctx.textBaseline = "top";
        this._drawText(
          textobj.value,
          x0 + textobj.left,
          y0 + textobj.top,
          textobj.width,
          textobj.height,
          textobj.fontsize,
          textobj.lineHeight,
          textobj.textAlign
        );
        ctx.restore();
      }
    },
    drawLine_to_child() {
      var ctx = this.qjm.ctx;
      ctx.save();
      if (this.isRoot) {
        if (this.childrenCountRight) {
          ctx.beginPath();
          ctx.moveTo(this.x + (1 * this.width) / 2, this.y);
          ctx.strokeStyle = this.lineColor;
          ctx.lineTo(this.hubPosRight[0], this.hubPosRight[1]);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
          this.drawHub(this.hubPosRight, this.childrenCountRight);
        }
        if (this.childrenCountLeft) {
          ctx.beginPath();
          ctx.moveTo(this.x + (-1 * this.width) / 2, this.y);
          ctx.strokeStyle = this.lineColor;
          ctx.lineTo(this.hubPosLeft[0], this.hubPosLeft[1]);
          ctx.closePath();
          ctx.stroke();
          this.drawHub(this.hubPosLeft, this.childrenCountLeft);
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(this.x + (this.direction * this.width) / 2, this.y);
        ctx.strokeStyle = this.lineColor;
        ctx.lineTo(this.hubPos[0], this.hubPos[1]);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        this.drawHub(this.hubPos, this.childrenCount);
      }
    },
    drawLine_to_parent() {
      var ctx = this.qjm.ctx;
      ctx.save();
      ctx.beginPath();
      var moveToX = this.x - (this.direction * this.width) / 2;
      var moveToY = this.y;
      ctx.moveTo(moveToX, moveToY);
      ctx.strokeStyle = this.lineColor;
      if (this.parent.isRoot) {
        this.direction === 1 &&
          ctx.quadraticCurveTo(
            moveToX - 50,
            moveToY,
            this.parent.hubPosRight[0],
            this.parent.hubPosRight[1]
          );
        this.direction === -1 &&
          ctx.quadraticCurveTo(
            moveToX + 50,
            moveToY,
            this.parent.hubPosLeft[0],
            this.parent.hubPosLeft[1]
          );
      } else {
        ctx.quadraticCurveTo(
          this.direction === 1 ? moveToX - 50 : moveToX + 50,
          moveToY,
          this.parent.hubPos[0],
          this.parent.hubPos[1]
        );
      }
      ctx.stroke();
      ctx.restore();
    },
    drawHub(pos) {
      if (this.isRoot) {
        if (this.childrenCountRight) {
          this._drawHub(this.hubPosRight, this.childrenCountRight);
          this.set_mind_pos_map("hubPosRight", this);
        }
        if (this.childrenCountLeft) {
          this._drawHub(this.hubPosLeft, this.childrenCountLeft);
          this.set_mind_pos_map("hubPosLeft", this);
        }
      } else {
        if (this.childrenCount) {
          this._drawHub(this.hubPos, this.childrenCount);
          this.set_mind_pos_map("hubPos", this);
        }
      }
    },
    _drawHub(pos, childLength) {
      var ctx = this.qjm.ctx;
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(31,35,41,0.08)";
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], this.hubRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (childLength > 0) {
        ctx.save();
        ctx.fillStyle = "#000000";
        ctx.font = "30px";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(childLength, pos[0], pos[1]);
        ctx.restore();
      }
    },
    getHubPos() {
      if (this.isRoot) {
        this.hubPosLeft = [this.x + -1 * (this.width / 2 + 40), this.y];
        this.hubPosRight = [this.x + 1 * (this.width / 2 + 40), this.y];
      } else {
        this.hubPos = [this.x + this.direction * (this.width / 2 + 40), this.y];
      }
    },
    get_children_nodes(dir) {
      return this.children.filter((item) => item.direction === dir);
    },
  };

  // 树图构造函数
  qjm.Mind = function (qjm, opts, nodeJson) {
    this.qjm = qjm;
    this.opts = opts;
    this.canvasCenter = null;
    this.nodeJson = [].concat(nodeJson);
    this.nodes = [];
    this.nodesFlatArray = [];
    this.totalHeight = 0;
    this.totalMaxNodeLength = 0;

    this.get_nodes();
    this.init();
  };
  qjm.Mind.prototype = {
    init() {
      this.canvasCenter = this.qjm.getCanvasCenterPos();
      this.get_expanded_node_group();
      this.get_group_max_length();
      this.layout(); //给每个节点赋值xy坐标值
      this.show_view();
    },
    get_nodes() {
      this.nodes = this._parse(this.nodeJson,null,null)
    },
    _parse(nodeArray, parentNode, parentNodeJson) {
      let newArr = [];
      for (var i = 0; i < nodeArray.length; i++) {
        let nodeJson = nodeArray[i];
        let node = this.add_node(nodeJson);
        node.parent = parentNode;
        if (nodeJson.children) {
          node.children = this._parse(nodeJson.children, node, nodeJson);
        }
        newArr.push(node);
      }
      return newArr;
    },

    add_node(nodeJson) {
      let node = new qjm.KeyNode(this.qjm, nodeJson);
      node.id = qjm.util.newid();
      this.nodesFlatArray.push(node);
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
        if (node.direction === -1 && !node.parent.expandedLeft) return;
        if (node.direction === 1 && !node.parent.expandedRight) return;
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
        if (node.direction === -1 && !node.parent.expandedLeft) return;
        if (node.direction === 1 && !node.parent.expandedRight) return;
      }
      if (node.parent && !node.parent.isRoot) {
        if (!node.parent.expanded) return;
      }
      if (node.parent) {
        node.drawLine_to_parent();
      }
      if (
        (node.isRoot && (node.childrenCountLeft || node.childrenCountRight)) ||
        (!node.isRoot && node.childrenCount)
      ) {
        node.drawLine_to_child();
        for (let index = 0; index < node.children.length; index++) {
          let child_node = node.children[index];
          this._draw_lines(child_node);
        }
        node.drawHub();
      }
    },

    get_expanded_node_group() {
      var t = this;
      var group = [];
      for (var i = 0; i < t.nodes.length; i++) {
        var groupInfo = {
          group_index: i,
          expandedRankMaxLeft: 0,
          expandedRankMaxRight: 0,
          expandedNodesLeft: [],
          expandedNodesRight: [],
        };
        groupInfo.expandedNodesLeft[0] = t.nodes[i];
        groupInfo.expandedNodesRight[0] = t.nodes[i];

        (function _rank(obj, rankid) {
          obj.rankIndex = rankid;
          groupInfo.expandedRankMaxRight =
            obj.direction === 1 && rankid > groupInfo.expandedRankMaxRight
              ? rankid
              : groupInfo.expandedRankMaxRight;
          groupInfo.expandedRankMaxLeft =
            obj.direction === -1 && rankid > groupInfo.expandedRankMaxLeft
              ? rankid
              : groupInfo.expandedRankMaxLeft;

          // 有展开的子元素，则给下一级push进去他的所有子元素数组
          if (!groupInfo.expandedNodesLeft[rankid + 1])
            groupInfo.expandedNodesLeft[rankid + 1] = [];
          if (!groupInfo.expandedNodesRight[rankid + 1])
            groupInfo.expandedNodesRight[rankid + 1] = [];

          if (
            obj.children &&
            obj.children.length &&
            (obj.expanded || obj.expandedLeft || obj.expandedRight)
          ) {
            var children_l = [],
              children_r = [];
            obj.children.forEach((item) => {
              if (item.direction === -1) children_l.push(item);
              if (item.direction === 1) children_r.push(item);
            });
            children_l.length &&
              groupInfo.expandedNodesLeft[rankid + 1].push(children_l);
            children_r.length &&
              groupInfo.expandedNodesRight[rankid + 1].push(children_r);

            for (var j = 0; j < obj.children.length; j++) {
              _rank(obj.children[j], rankid + 1);
            }
          } else {
            // 没有展开的子元素，则给下一级加一个空元素 用来占位
            if (obj.isRoot || (!obj.isRoot && obj.direction === -1))
              groupInfo.expandedNodesLeft[rankid + 1].push({
                isEmpty: true,
                rankIndex: rankid + 1,
              });
            if (obj.isRoot || (!obj.isRoot && obj.direction === 1))
              groupInfo.expandedNodesRight[rankid + 1].push({
                isEmpty: true,
                rankIndex: rankid + 1,
              });
          }
        })(t.nodes[i], 0);

        groupInfo.expandedNodesLeft = groupInfo.expandedNodesLeft.slice(
          0,
          groupInfo.expandedRankMaxLeft + 1
        );
        groupInfo.expandedNodesRight = groupInfo.expandedNodesRight.slice(
          0,
          groupInfo.expandedRankMaxRight + 1
        );

        t.nodes[i].groupInfo = groupInfo;
      }
    },
    // 组的最大末级节点数
    get_group_max_length() {
      var t = this;
      for (var i = 0; i < t.nodes.length; i++) {
        var groupInfo = t.nodes[i].groupInfo;
        // 对比左右两边的末级节点的高度，将最大值赋值给节点组高度
        var nodeLengthLeft = qjm.util.flatArray(
          groupInfo.expandedNodesLeft[groupInfo.expandedNodesLeft.length - 1]
        ).length;
        var nodeLengthRight = qjm.util.flatArray(
          groupInfo.expandedNodesRight[groupInfo.expandedNodesRight.length - 1]
        ).length;

        groupInfo.maxNodeLength = Math.max(nodeLengthLeft, nodeLengthRight);
        groupInfo.totalHeight =
          groupInfo.maxNodeLength * t.opts.keyNodeHeight + (length - 1) * 20;
        if (nodeLengthLeft >= nodeLengthRight) {
          groupInfo.maxSideDirection = -1;
        } else {
          groupInfo.maxSideDirection = 1;
        }
      }
    },

    _get_total_height() {
      var t = this;
      t.totalHeight = 0;
      for (var i = 0; i < t.nodes.length; i++) {
        t.totalMaxNodeLength += t.nodes[i].groupInfo.maxNodeLength;
        t.totalHeight += t.nodes[i].groupInfo.totalHeight;
      }
      var top = t.canvasCenter.y - t.totalHeight / 2;
      var bottom = t.canvasCenter.y + t.totalHeight / 2;
      for (var i = 0; i < t.nodes.length; i++) {
        var groupInfo = t.nodes[i].groupInfo;

        if (i > 0 && t.nodes[i - 1].groupInfo.top_y) {
          groupInfo.top_y =
            t.nodes[i - 1].groupInfo.top_y +
            t.nodes[i - 1].groupInfo.totalHeight +
            100;
          groupInfo.centerPos = {
            x: this.canvasCenter.x,
            y: groupInfo.top_y + groupInfo.totalHeight / 2,
          };
        } else {
          groupInfo.top_y = top;
          groupInfo.centerPos = {
            x: this.canvasCenter.x,
            y: groupInfo.top_y + groupInfo.totalHeight / 2,
          };
        }
      }
    },
    layout() {
      var t = this;
      t._get_total_height();
      for (var i = 0; i < t.nodes.length; i++) {
        var group = t.nodes[i];
        var dir = group.groupInfo.maxSideDirection;
        var expandedNodesLeft = group.groupInfo.expandedNodesLeft;
        var expandedNodesRight = group.groupInfo.expandedNodesRight;
        // 比较左右两边的高度，值大则反向布局，值小的正向布局
        // 左边
        var rank_max_nodes_length_l = qjm.util.flatArray(
          expandedNodesLeft[expandedNodesLeft.length - 1]
        );
        // 右边
        var rank_max_nodes_length_r = qjm.util.flatArray(
          expandedNodesRight[expandedNodesRight.length - 1]
        );
        if (rank_max_nodes_length_l > rank_max_nodes_length_r) {
          t._layout_backward(expandedNodesLeft, -1, group.groupInfo.centerPos);
          t._layout_forward(expandedNodesRight, 1, group.groupInfo.centerPos);
        } else {
          t._layout_backward(expandedNodesRight, 1, group.groupInfo.centerPos);
          t._layout_forward(expandedNodesLeft, -1, group.groupInfo.centerPos);
        }
      }
    },

    // 反向推定位：从末级节点向根节点推定位
    _layout_backward(expandedNodes, dir, groupCenterPos) {
      // 末级
      var expandedRankMax = expandedNodes.length - 1;
      var rankMaxNodes = qjm.util.flatArray(expandedNodes[expandedRankMax]);
      let rankMaxNodesTotalHeight =
        rankMaxNodes.length * this.opts.keyNodeHeight +
        (rankMaxNodes.length - 1) * 20;

      let top_h =
        groupCenterPos.y -
        rankMaxNodesTotalHeight / 2 +
        this.opts.keyNodeHeight / 2;

      for (var i = 0; i < rankMaxNodes.length; i++) {
        rankMaxNodes[i].x =
          groupCenterPos.x +
          dir * expandedRankMax * (this.opts.keyNodeWidth + 110);
        rankMaxNodes[i].y = top_h + i * (this.opts.keyNodeHeight + 20);
      }

      // 前面级的节点
      for (var i = expandedNodes.length - 2; i >= 0; i--) {
        var currRankNodes = expandedNodes[i]; //i为级数
        var nextRankNodes = expandedNodes[i + 1]; //获取到后面那级的数据
        var currRankNodesFlat = qjm.util.flatArray(currRankNodes);
        for (var j = 0; j < currRankNodesFlat.length; j++) {
          var node = currRankNodesFlat[j];
          node.x = groupCenterPos.x + dir * i * (this.opts.keyNodeWidth + 110);

          if (nextRankNodes[j] instanceof Object && nextRankNodes[j].isEmpty) {
            node.y = nextRankNodes[j].y;
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
    _layout_forward(expandedNodes, dir, groupCenterPos) {
      var y0 = expandedNodes[0].y;
      this._layout_backward(expandedNodes, dir, groupCenterPos);
      var y1 = expandedNodes[0].y;
      var diff = y1 - y0;
      for (var i = 0; i < expandedNodes.length; i++) {
        var currRankNodes = expandedNodes[i]; //i为级数
        var currRankNodesFlat = qjm.util.flatArray(currRankNodes);
        for (var j = 0; j < currRankNodesFlat.length; j++) {
          var node = currRankNodesFlat[j];
          if (!node.isEmpty) node.y -= diff;
        }
      }
    },
  };

  // export qjMind
  if (typeof module !== "undefined" && typeof exports === "object") {
    module.exports = qjm;
  } else if (typeof define === "function" && (define.amd || define.cmd)) {
    define([], qjm);
  } else if (typeof exports === "object") {
    exports["qjMind"] = qjm;
  } else {
    window["qjMind"] = qjm;
  }
})(window);
