var nodeObj = {
  employeeId: "uuid",
  employeeName: "张三生三世",
  departmentName: "策划范德萨范德萨加啊部",
  dangerType: 2,
  schedule: "300.00",
  objectiveDesc: "1",
  superCount: 2,
  childCount: 17,
  superOkr: [
    {
      employeeId: "uuid",
      employeeName: "张三生三世",
      departmentName: "策划范德萨范德萨加啊部",
      dangerType: 2,
      schedule: "300.00",
      objectiveDesc: "1.1",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.1",
      superCount: 0,
      childCount: 0,
    },
  ],
  childOkr: [
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
    {
      employeeId: "uuid",
      employeeName: "张",
      departmentName: "策划部",
      dangerType: 2,
      schedule: "30",
      objectiveDesc: "1.2",
      superCount: 0,
      childCount: 0,
    },
  ],
};
var array = [];
// 大数据压测
for (var i = 1; i <= 10; i++) {
  var newObj = JSON.parse(JSON.stringify(nodeObj));
  newObj.id = i;
  newObj.objectiveDesc = "" + i;
  newObj.superOkr.forEach((item,j)=>{
    item.id = "" + i + "."+j;
    item.objectiveDesc = "" + i + "."+j;
  })
  newObj.childOkr.forEach((item,j)=>{
    item.id = "" + i + "."+j;
    item.objectiveDesc = "" + i + "."+j;
  })
  array.push(newObj);
}

const getScheduleInfo = (obj) => {
  let info = {
    0: [`         ${obj.schedule}%`, "#d8d8d8"],
    1: [`正常   ${obj.schedule}%`, "#16A0FF"],
    2: [`有风险 ${obj.schedule}%`, "#FFAE11"],
    3: [`已延期 ${obj.schedule}%`, "#F73838"],
  };
  return info[obj.dangerType];
};
const initRoot = (array) => {
  for (let i = 0; i < array.length; i++) {
    array[i].isRoot = true;
  }
};

const newid = () => {
  return (
    new Date().getTime().toString(16) + Math.random().toString(16).substr(2)
  ).substr(2, 16);
};

/**
 * 格式化接口请求到的目标地图数据
 * @param array
 * @param [dir]  左边的节点：-1 | 右边的节点：1
 */
const parseOkrJSON = (array, dir) => {
  let newArr = [];
  for (let i = 0; i < array.length; i++) {
    let obj = array[i];
    let newObj = {};
    newObj.id = obj.id;
    newObj.nid = newObj.nid || newid();
    if (!("canRead" in obj)) {
      obj.canRead = 1;
    }
    newObj.canRead = obj.canRead;
    if (obj.isRoot) newObj.isRoot = obj.isRoot;
    newObj.text = getTextObj(obj);
    newObj.shape = getShapeObj(obj);
    if (obj.isRoot) {
      newObj.expandedLeft = false;
      newObj.expandedRight = false;
      newObj.childrenCountLeft = obj.superCount;
      newObj.childrenCountRight = obj.childCount;
      newObj.children = [];
      if (obj.superOkr)
        newObj.children = newObj.children.concat(
          parseOkrJSON(obj.superOkr, -1)
        );
      if (obj.childOkr)
        newObj.children = newObj.children.concat(parseOkrJSON(obj.childOkr, 1));
    } else {
      newObj.expanded = false;
      newObj.direction = dir;
      newObj.children = [];
      if (dir === -1 && obj.superCount) {
        newObj.childrenCount = obj.superCount;
        if (obj.superOkr)
          newObj.children = newObj.children.concat(
            parseOkrJSON(obj.superOkr, -1)
          );
      }
      if (dir === 1 && obj.childCount) {
        newObj.childrenCount = obj.childCount;
        if (obj.childOkr)
          newObj.children = newObj.children.concat(
            parseOkrJSON(obj.childOkr, 1)
          );
      }
    }
    newArr.push(newObj);
  }
  return newArr;
};
/**
 * 格式化单次请求到的数组
 * @param array
 * @param dir  左边的节点：-1 | 右边的节点：1
 */
const parseSingleOkrJSON = (array, dir) => {
  let newArr = [];
  for (let i = 0; i < array.length; i++) {
    let newObj = {};
    let obj = array[i];
    newObj.id = obj.id;
    newObj.nid = newObj.nid || newid();
    if (!("canRead" in obj)) {
      obj.canRead = 1;
    }
    newObj.canRead = obj.canRead;
    newObj.text = getTextObj(obj);
    newObj.shape = getShapeObj(obj);
    newObj.expanded = false;
    newObj.direction = dir;
    newObj.children = [];
    newObj.childrenCount = dir === -1 ? obj.superCount : obj.childCount;
    newArr.push(newObj);
  }
  return newArr;
};
/**
 * 初始化图形数据
 * @param obj okr对象
 */
const getShapeObj = (obj) => {
  const info = getScheduleInfo(obj);
  let arr = [
    {
      type: "circle",
      background: "rgba(27,196,137,0.10)",
      left: 30,
      top: 30,
      r: 15,
    },
  ];
  if (obj.canRead) {
    let rect = [
      {
        type: "rect",
        background: info[1],
        left: 0,
        top: 0,
        width: 3,
        height: 100,
      },
    ];
    arr = arr.concat(rect);
  }
  return arr;
};
/**
 * 初始化文字数据
 * @param obj okr对象
 */
const getTextObj = (obj) => {
  const info = getScheduleInfo(obj);
  let arr = [
    {
      value: obj.employeeName.slice(-1) || "",
      top: 24,
      left: 30,
      width: 14,
      height: 14,
      fontsize: 12,
      lineHeight: 12,
      textAlign: "center",
      color: "#1BC489",
    },
    {
      value: obj.employeeName || "",
      top: 20,
      left: 54,
      width: 60,
      height: 16,
      fontsize: 16,
      lineHeight: 16,
      color: "#666666",
    },
    {
      value: obj.departmentName || "",
      top: 20,
      left: 120,
      width: 70,
      height: 16,
      fontsize: 16,
      lineHeight: 16,
      color: "#666666",
    },
  ];
  if (obj.canRead) {
    let desc = [
      {
        value: info[0],
        top: 22,
        left: 310,
        width: 110,
        height: 14,
        fontsize: 14,
        lineHeight: 14,
        textAlign: "right",
        color: info[1],
        isShowAll:true,
      },
      {
        value: obj.objectiveDesc || "",
        top: 50,
        left: 54,
        width: 250,
        height: 40,
        fontsize: 14,
        lineHeight: 20,
        color: "#333333",
      },
    ];
    arr = arr.concat(desc);
  } else {
    let desc = [
      {
        value: "暂无权限",
        top: 60,
        left: 130,
        width: 250,
        height: 40,
        fontsize: 16,
        lineHeight: 20,
        color: "#999",
      },
    ];
    arr = arr.concat(desc);
  }
  return arr;
};
const getMindData = (data) => {
  initRoot(data);
  return parseOkrJSON(data);
};

var nodeArray = getMindData(array);
console.log(nodeArray);
