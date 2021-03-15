(function (window) {
  const GROUP_DISTANCE = 30;
  const NODE_DISTANCE = 20;
  const LEVEL_DISTANCE = 110;
  const SCALE_STEP = 0.05;
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
    this.add_event();
  };
  qjm.prototype = {
    /**
     * 对外暴露函数:渲染树图数据
     * @param data
     */
    render(data) {
      this.clearCanvas();
      this.nodeJson = data;
      this.create_mind();
    },
    /**
     * 对外暴露函数:通过外部控件缩放
     * @param dir
     */
    scaleControl(dir) {
      this._scale(
        SCALE_STEP * dir,
        this.canvasCenterPos.x,
        this.canvasCenterPos.y
      );
    },
    // 初始化画布
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
    // 初始化画布事件
    add_event() {
      this.add_event_zoom();
      this.add_event_mouse();
    },
    // 初始化树图，每次数据改变会重新初始化视图
    create_mind() {
      this.mind = new qjm.Mind(this, this.opts, this.nodeJson);
    },
    // 清空画布
    clearCanvas() {
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
    // 计算画布中心
    getCanvasCenterPos() {
      return {
        x: this.canvas.width / this.ratio / 2,
        y: this.canvas.height / this.ratio / 2,
      };
    },
    // 缩放计算
    _scale(zoom, cx, cy) {
      var s = Math.round(this.scale * 100 + zoom * 100) / 100;
      if (s > 1.1 || s < 0.3) {
        return;
      }
      this.clearCanvas();
      this.ctx.translate(cx, cy);
      this.ctx.scale(
        (this.scale + zoom) / this.scale,
        (this.scale + zoom) / this.scale
      );
      this.ctx.translate(-cx, -cy);
      this.scale += zoom;
      requestAnimationFrame(() => {
        this.mind.show_view();
      });
    },
    // 画布事件：缩放
    add_event_zoom() {
      // 禁用原生页面缩放
      window.addEventListener(
        "mousewheel",
        function (event) {
          if (event.ctrlKey === true || event.metaKey) {
            event.preventDefault();
          }
        },
        {
          passive: false,
        }
      );
      //firefox
      window.addEventListener(
        "DOMMouseScroll",
        function (event) {
          if (event.ctrlKey === true || event.metaKey) {
            event.preventDefault();
          }
        },
        {
          passive: false,
        }
      );
      // canvas缩放
      this.canvas.addEventListener("wheel", (e) => {
        let zoom = 1;
        e.stopPropagation();
        e.preventDefault();
        if (e.ctrlKey) {
          if (e.deltaY > 0) {
            this._scale(-SCALE_STEP, e.offsetX, e.offsetY);
          }
          if (e.deltaY < 0) {
            this._scale(SCALE_STEP, e.offsetX, e.offsetY);
          }
        }
      });
    },
    /**
     * 画布事件：拖动 位移
     */
    add_event_mouse() {
      var t = this;
      var canvas = this.canvas;
      var isDown = false;
      var x, y, startX, startY;
      var cw = parseFloat(t.canvas.style.width);
      var ch = parseFloat(t.canvas.style.height);
      function _mousemove(e) {
        if (!isDown) return;
        // 触发点击事件
        if (
          Math.abs(e.clientX - startX) < 2 &&
          Math.abs(e.clientY - startY) < 2
        ) {
          return;
        }
        var limit = t.valid_move_boundary();
        var dx = (e.clientX - x) / t.scale;
        var dy = (e.clientY - y) / t.scale;

        if (limit.left > cw - 400) {
          //右边界
          t.ctx.translate(e.clientX < x ? dx : 0, dy);
        } else if (limit.right <= 400) {
          //左边界
          t.ctx.translate(e.clientX > x ? dx : 0, dy);
        } else if (limit.top > ch - 200) {
          //下边界
          t.ctx.translate(dx, e.clientY < y ? dy : 0);
        } else if (limit.bottom < 200) {
          //上边界
          t.ctx.translate(dx, e.clientY > y ? dy : 0);
        } else {
          t.ctx.translate(dx, dy);
        }
        x = e.clientX;
        y = e.clientY;

        t.clearCanvas();
        requestAnimationFrame(() => {
          t.mind.show_view();
        });
        return false;
      }
      function _mouseup(e) {
        // 触发点击事件
        if (
          Math.abs(e.clientX - startX) < 2 &&
          Math.abs(e.clientY - startY) < 2
        ) {
          t.click_node(e);
        }
        //开关关闭
        canvas.style.cursor = "default";
        canvas.removeEventListener("mousemove", _mousemove);
        canvas.removeEventListener("mouseup", _mouseup);
        isDown = false;
      }
      canvas.addEventListener("mousedown", (e) => {
        console.log("mousedown", x, y);
        //获取x坐标和y坐标
        startX = x = e.clientX;
        startY = y = e.clientY;
        //开关打开
        isDown = true;
        canvas.style.cursor = "grabbing";
        canvas.addEventListener("mousemove", _mousemove);
        canvas.addEventListener("mouseup", _mouseup);
        return false;
      });
    },
    // 画布事件：点击 内容节点、分支枢纽节点
    click_node(e) {
      var canvas = this.canvas;
      var ctx = this.ctx;
      // 矩阵换算鼠标点击位置对应的新坐标
      var cT = ctx.getTransform();
      let matrix = [cT.a, cT.b, cT.c, cT.d, cT.e, cT.f];
      var newxy = this._getXY(matrix, e.offsetX, e.offsetY);
      var ex = newxy.x;
      var ey = newxy.y;

      var all_nodes = this.allNodePosMap;
      // 点击内容节点
      for (var i = 0; i < all_nodes["keynode"].length; i++) {
        let p = all_nodes["keynode"][i];
        if (
          p.x - p.width / 2 <= ex &&
          ex <= p.x + p.width / 2 &&
          p.y - p.height / 2 <= ey &&
          ey <= p.y + p.height / 2
        ) {
          console.log("点击了keynode:", p.objectiveId, p.x, p.y);
          this.fn.keyNodeClick && this.fn.keyNodeClick(p);
          return;
        }
      }
      // 点击分支枢纽节点
      for (var type in all_nodes) {
        if (type == "keynode") continue;
        for (var i = 0; i < all_nodes[type].length; i++) {
          let p = all_nodes[type][i];
          if (
            Math.pow(ex - p[type][0], 2) + Math.pow(ey - p[type][1], 2) <
            100
          ) {
            // console.log(`点击了${p.objectiveId}的hub节点${type}`);
            if (type == "hubPosLeft") {
              this.fn.hubNodeClick && this.fn.hubNodeClick(p, -1);
            }
            if (type == "hubPosRight") {
              this.fn.hubNodeClick && this.fn.hubNodeClick(p, 1);
            }
            if (type == "hubPos") {
              this.fn.hubNodeClick && this.fn.hubNodeClick(p, p.direction);
            }
            return;
          }
        }
      }
    },
    // 移动时边界限制
    valid_move_boundary() {
      var t = this;
      var limit = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      };
      var cT = t.ctx.getTransform();
      let matrix = [cT.a, cT.b, cT.c, cT.d, cT.e, cT.f];
      let boundary = t.mind.get_mind_boundary();
      console.log(boundary);

      limit.left = t._reverse_getXY(matrix, boundary.l, 0).x;
      limit.right = t._reverse_getXY(matrix, boundary.r, 0).x;
      limit.top = t._reverse_getXY(matrix, 0, boundary.t).y;
      limit.bottom = t._reverse_getXY(matrix, 0, boundary.b).y;

      return limit;
    },
    // 矩阵换算
    _getXY(matrix, mouseX, mouseY) {
      var newX = (mouseX * this.ratio - matrix[4]) / matrix[0];
      var newY = (mouseY * this.ratio - matrix[5]) / matrix[3];
      return {
        x: newX,
        y: newY,
      };
    },
    // 矩阵逆换算
    _reverse_getXY(matrix, x, y) {
      var newX = (x * matrix[0] + matrix[4]) / this.ratio;
      var newY = (y * matrix[3] + matrix[5]) / this.ratio;
      return {
        x: newX,
        y: newY,
      };
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
    isValueNull(val) {
      return val === "" || val === null || val === undefined;
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
    // 获取枢纽节点坐标
    getHubPos() {
      if (this.isRoot) {
        this.hubPosLeft = [this.x + -1 * (this.width / 2 + 40), this.y];
        this.hubPosRight = [this.x + 1 * (this.width / 2 + 40), this.y];
      } else {
        this.hubPos = [this.x + this.direction * (this.width / 2 + 40), this.y];
      }
    },
    set_mind_pos_map(type, nodePos) {
      var map = this.qjm.allNodePosMap;
      if (!map[type]) map[type] = [];
      map[type].push(nodePos);
    },
    // 画内容节点
    drawKeyNode() {
      var ctx = this.qjm.ctx;
      if (qjm.util.isValueNull(this.x) || qjm.util.isValueNull(this.y)) {
        return;
      }
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(31,35,41,0.08)";
      ctx.fillRect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
      );
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
    // 画节点内的内容 文字、形状 …
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
    // 画父节点向子节点的连线
    drawLine_to_child() {
      var ctx = this.qjm.ctx;
      ctx.save();
      ctx.strokeStyle = this.lineColor;
      if (this.isRoot) {
        if (this.childrenCountRight) {
          ctx.moveTo(this.x + (1 * this.width) / 2, this.y);
          ctx.lineTo(this.hubPosRight[0], this.hubPosRight[1]);
          ctx.stroke();
          this.drawHub(this.hubPosRight, this.childrenCountRight);
        }
        if (this.childrenCountLeft) {
          ctx.moveTo(this.x + (-1 * this.width) / 2, this.y);
          ctx.lineTo(this.hubPosLeft[0], this.hubPosLeft[1]);
          ctx.stroke();
          this.drawHub(this.hubPosLeft, this.childrenCountLeft);
        }
      } else {
        ctx.moveTo(this.x + (this.direction * this.width) / 2, this.y);
        ctx.lineTo(this.hubPos[0], this.hubPos[1]);
        ctx.stroke();
        this.drawHub(this.hubPos, this.childrenCount);
      }
      ctx.restore();
    },
    // 画子节点向父节点的连线 贝塞尔曲线
    drawLine_to_parent() {
      var ctx = this.qjm.ctx;
      var moveToX = this.x - (this.direction * this.width) / 2;
      var moveToY = this.y;
      ctx.save();
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
    // 画枢纽节点
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
      // 圆
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(31,35,41,0.08)";
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], this.hubRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      // 子节点个数
      ctx.fillStyle = "#000000";
      ctx.font = "30px";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(childLength, pos[0], pos[1]);
      ctx.restore();
    },
  };

  // 树图构造函数
  qjm.Mind = function (qjm, opts, nodeJson) {
    this.qjm = qjm;
    this.opts = opts;
    this.canvasCenter = null;
    this.nodeJson = [].concat(nodeJson);
    this.nodes = [];
    this.leftLevelMax = 0;
    this.rightLevelMax = 0;
    // 树图边界
    this.boundary = {
      l: 0,
      r: 0,
      t: 0,
      b: 0,
    };
    this.nodeGroupInfo = [];
    // 树图总高度
    this.totalHeight = 0;
    this.init();
  };
  qjm.Mind.prototype = {
    init() {
      this.canvasCenter = this.qjm.getCanvasCenterPos();
      this.get_nodes();
      this.get_group_height();
      this.get_mind_boundary();
      this.layout(); //给每个节点赋值xy坐标值
      this.show_view();
    },
    // 初始化所有节点数据
    get_nodes() {
      this.nodes = this._parse(this.nodeJson, null, null, 0);
    },
    _parse(nodeArray, parentNode, parentNodeJson, level, groupIndex) {
      let newArr = [];
      for (var i = 0; i < nodeArray.length; i++) {
        let nodeJson = nodeArray[i];

        let node = this.add_node(nodeJson);
        node.level = level;
        node.parent = parentNode;
        if (nodeJson.isRoot) {
          node.groupIndex = i;
        } else {
          node.groupIndex = parentNode.groupIndex;
        }

        if (nodeJson.isRoot) {
          let leftNodesExpanded = [];
          let rightNodesExpanded = [];
          let leftNodesAll = [];
          let rightNodesAll = [];

          for (let n = 0, len = nodeJson.children.length; n < len; n++) {
            let item = nodeJson.children[n];
            item.direction === -1 && leftNodesAll.push(item);
            item.direction === 1 && rightNodesAll.push(item);
          }

          if (nodeJson.expandedLeft && leftNodesAll.length) {
            leftNodesExpanded = this._parse(
              leftNodesAll,
              node,
              nodeJson,
              level + 1
            );
          } else {
            leftNodesExpanded = [];
            this._set_last_Level_nodes(-1, node);
          }

          if (nodeJson.expandedRight && rightNodesAll.length) {
            rightNodesExpanded = this._parse(
              rightNodesAll,
              node,
              nodeJson,
              level + 1
            );
          } else {
            rightNodesExpanded = [];
            this._set_last_Level_nodes(1, node);
          }

          node.children = [].concat(leftNodesExpanded, rightNodesExpanded);
        } else {
          if (
            nodeJson.expanded &&
            nodeJson.children &&
            nodeJson.children.length
          ) {
            node.children = this._parse(
              nodeJson.children,
              node,
              nodeJson,
              level + 1
            );
          } else {
            node.children = [];
            this._set_last_Level_nodes(node.direction, node);
          }
        }

        newArr.push(node);
      }
      return newArr;
    },
    _set_last_Level_nodes(dir, node) {
      if (!this.nodeGroupInfo[node.groupIndex]) {
        this.nodeGroupInfo[node.groupIndex] = {
          leftLastLevelNodes: [],
          rightLastLevelNodes: [],
          leftLevelMax: 0,
          rightLevelMax: 0,
          maxSide: -1,
          maxSideLength: 0,
          height: 0,
          topY: 0,
        };
      }
      if (dir === -1) {
        this.nodeGroupInfo[node.groupIndex].leftLastLevelNodes.push(node);
        this.nodeGroupInfo[node.groupIndex].leftLevelMax = Math.max(
          this.nodeGroupInfo[node.groupIndex].leftLevelMax,
          node.level
        );
      }
      if (dir === 1) {
        this.nodeGroupInfo[node.groupIndex].rightLastLevelNodes.push(node);
        this.nodeGroupInfo[node.groupIndex].rightLevelMax = Math.max(
          this.nodeGroupInfo[node.groupIndex].rightLevelMax,
          node.level
        );
      }
    },
    add_node(nodeJson) {
      let node = new qjm.KeyNode(this.qjm, nodeJson);
      node.id = qjm.util.newid();
      return node;
    },

    show_view() {
      this.qjm.allNodePosMap = {};
      this._draw_mind_elements(this.nodes);
    },
    _draw_mind_elements(nodeArray) {
      for (var i = 0; i < nodeArray.length; i++) {
        let node = nodeArray[i];
        node.show();
        if (node.parent) {
          node.drawLine_to_parent();
        }
        if (
          node.childrenCountLeft ||
          node.childrenCountRight ||
          node.childrenCount
        ) {
          node.drawLine_to_child();
          this._draw_mind_elements(node.children);
          node.drawHub();
        }
      }
    },

    layout() {
      for (let i = 0, len = this.nodes.length; i < len; i++) {
        let left = this.nodeGroupInfo[i].leftLastLevelNodes;
        let right = this.nodeGroupInfo[i].rightLastLevelNodes;
        // 获取末级节点数更多的一边
        if (left.length > right.length) {
          this._layout_large_side(left, i);
          this._layout_small_side(right, i);
        } else {
          this._layout_large_side(right, i);
          this._layout_small_side(left, i);
        }
      }
    },
    _layout(node) {
      if (!node.parent) return;
      if (node.parent) {
        let children = [];
        if (node.parent.isRoot) {
          children = node.parent.children.filter(
            (item) => item.direction === node.direction
          );
        } else {
          children = node.parent.children;
        }
        let dir = node.parent.isRoot ? 0 : node.parent.direction;
        node.parent.x =
          this.canvasCenter.x +
          dir * (LEVEL_DISTANCE + this.opts.keyNodeWidth) * node.parent.level;
        node.parent.y = (children[0].y + children[children.length - 1].y) / 2;

        this._layout(node.parent);
      }
    },
    _layout_large_side(lastLevelNodes, groupIndex, diffY) {
      diffY = diffY || 0;
      // 计算出末级节点的坐标
      for (let i = 0; i < lastLevelNodes.length; i++) {
        let node = lastLevelNodes[i];
        let dir = node.isRoot ? 0 : node.direction;
        node.x =
          this.canvasCenter.x +
          dir * (LEVEL_DISTANCE + this.opts.keyNodeWidth) * node.level;
        node.y =
          this.nodeGroupInfo[groupIndex].topY +
          this.opts.keyNodeHeight / 2 +
          this.opts.keyNodeHeight * i +
          NODE_DISTANCE * i -
          diffY;
        this._layout(node);
      }
    },
    _layout_small_side(lastLevelNodes, groupIndex) {
      let y0 = this.nodes[groupIndex].y;
      console.log(this.nodes[groupIndex]);
      this._layout_large_side(lastLevelNodes, groupIndex);
      let y1 = this.nodes[groupIndex].y;
      let diffY = y1 - y0;
      this._layout_large_side(lastLevelNodes, groupIndex, diffY);
    },

    get_group_height() {
      for (let i = 0, len = this.nodeGroupInfo.length; i < len; i++) {
        let group = this.nodeGroupInfo[i];
        // 高度
        if (
          group.leftLastLevelNodes.length > group.rightLastLevelNodes.length
        ) {
          group.maxSide = -1;
          group.maxSideLength = group.leftLastLevelNodes.length;
        } else {
          group.maxSide = 1;
          group.maxSideLength = group.rightLastLevelNodes.length;
        }

        group.height =
          group.maxSideLength * this.opts.keyNodeHeight +
          (group.maxSideLength - 1) * NODE_DISTANCE;

        this.totalHeight += group.height;
        // 宽度
        this.leftLevelMax = Math.max(this.leftLevelMax, group.leftLevelMax);
        this.rightLevelMax = Math.max(this.rightLevelMax, group.rightLevelMax);
      }
      for (let i = 0, len = this.nodeGroupInfo.length; i < len; i++) {
        let group = this.nodeGroupInfo[i];
        let preGroupTop = this.nodeGroupInfo[i - 1]
          ? this.nodeGroupInfo[i - 1].topY
          : this.canvasCenter.y - this.totalHeight / 2;
        let preGroupHeight = this.nodeGroupInfo[i - 1]
          ? this.nodeGroupInfo[i - 1].height
          : 0;
        group.topY = preGroupTop + preGroupHeight + GROUP_DISTANCE;
      }

      // 总高度
      this.totalHeight += (this.nodeGroupInfo.length - 1) * GROUP_DISTANCE;
    },

    // 获取上下左右四个边界值
    get_mind_boundary() {
      // 边界
      let leftBoundary =
        this.canvasCenter.x -
        this.leftLevelMax * (LEVEL_DISTANCE + this.opts.keyNodeWidth) -
        this.opts.keyNodeWidth / 2;
      let rightBoundary =
        this.canvasCenter.x +
        this.rightLevelMax * (LEVEL_DISTANCE + this.opts.keyNodeWidth) +
        this.opts.keyNodeWidth / 2;

      this.boundary = {
        l: leftBoundary,
        r: rightBoundary,
        t: this.canvasCenter.y - this.totalHeight / 2,
        b: this.boundary.t + this.totalHeight,
      };
      return this.boundary;
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
