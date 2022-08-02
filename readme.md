# canvas 思维导图 





## 值得注意的该导图支持多个根节点，也就是多个树

### 实现功能：
#### 1.节点可展开收起
#### 2.图可以拖动平移、鼠标缩放

![image](https://github.com/LucyHeres/canvas-mind/blob/master/canva-%E6%80%9D%E7%BB%B4%E5%AF%BC%E5%9B%BE.jpg)
#### 实现方法：
```js
// 树图属性数据：
var options = {
  container: "#canvas-container", //容器
  keyNodeWidth: 320, //节点宽度
  keyNodeHeight: 100, //节点高度
  hubRadius: 10, //枢纽小圆点半径
  lineColor: "#e3e4e5", //节点间连线 线条颜色
};

// 节点数据：（如下：两个根节点）
var nodeArray = [
  {
    id: "1",
    isRoot: true,
    expandedLeft: false,
    expandedRight: false,
    childrenCountLeft: 2,
    childrenCountRight: 1,
    children: [
      {
        id: "1.1",
        expanded: false,
        direction: -1,
        childrenCount: 2,
        children: [
          {
            id: "1.1.1",
            expanded: false,
            direction: -1,
            childrenCount: 0,
            children: [],
          },
          {
            id: "1.1.2",
            expanded: false,
            direction: -1,
            childrenCount: 0,
            children: [],
          },
        ],
      },
      {
        id: "1.2",
        expanded: false,
        direction: -1,
        childrenCount: 2,
        children: [
          {
            id: "1.2.1",
            expanded: false,
            direction: -1,
            childrenCount: 0,
            children: [],
          },
          {
            id: "1.2.2",
            expanded: false,
            direction: -1,
            childrenCount: 0,
            children: [],
          },
        ],
      },
      {
        id: "1.3",
        expanded: false,
        direction: 1,
        childrenCount: 2,
        children: [
          {
            id: "1.3.1",
            expanded: false,
            direction: 1,
            childrenCount: 0,
            children: [],
          },
          {
            id: "1.3.2",
            expanded: false,
            direction: 1,
            childrenCount: 0,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    isRoot: true,
    expandedLeft: false,
    expandedRight: false,
    childrenCountLeft: 2,
    childrenCountRight: 1,
    children: [
      {
        id: "2.1",
        expanded: false,
        direction: -1,
        childrenCount: 2,
        children: [
          {
            id: "2.1.1",
            expanded: false,
            direction: -1,
            childrenCount: 0,
            children: [],
          },
          {
            id: "2.1.2",
            expanded: false,
            direction: -1,
            childrenCount: 0,
            children: [],
          },
        ],
      },
      {
        id: "2.2",
        expanded: false,
        direction: -1,
        childrenCount: 2,
        children: [
          {
            id: "2.2.1",
            expanded: false,
            direction: -1,
            childrenCount: 0,
            children: [],
          },
          {
            id: "2.2.2",
            expanded: false,
            direction: -1,
            childrenCount: 0,
            children: [],
          },
        ],
      },
      {
        id: "2.3",
        expanded: false,
        direction: 1,
        childrenCount: 2,
        children: [
          {
            id: "2.3.1",
            expanded: false,
            direction: 1,
            childrenCount: 0,
            children: [],
          },
          {
            id: "2.3.2",
            expanded: false,
            direction: 1,
            childrenCount: 0,
            children: [],
          },
        ],
      },
    ],
  },
];
// 此数据只实现了树图结构的显示，节点为空白矩形，如果需要节点中展示文字或图形，则需要在每个节点中传入图形文字数据对象。
// 如下：
var text = [
  {
    value: "文字一",
    top: 20,
    left: 54,
    width: 60,
    height: 16,
    fontsize: 16,
    lineHeight: 16,
    color: "#666666",
  },
  // ...
];
var shape = [
  {
    type: "rect",
    background: "#e4393c",
    left: 0,
    top: 0,
    width: 3,
    height: 100,
  },
  // ...
];
// 讲以上两个对象传入每个节点中，即可实现节点中图形文字的显示。具体可参考 代码文件 parse.js

var qjMind = new qjMind(options, {
  keyNodeClick: function (node) {
    console.log("点击了okr节点", node.id, node.x, node.y);
    //
  },
  hubNodeClick: function (node, dir) {
    console.log("点击了hub节点", node);

    //TODO: 改变数据，改变节点展开收起属性

    // 改变后重新渲染
    qjMind.render(nodeArray);
  },
});
qjMind.render(nodeArray);
```
