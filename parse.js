var array = [
  {
    objectiveId: "1",
    employeeId: "uuid",
    employeeName: "迪丽热aa",
    departmentName: "策划部的技术部",
    dangerDesc: "有风险",
    schedule: "30",
    objectiveDesc:
      "这里是内容!这里是内容!这里是内容!这里是内容!这里是内容!这里是内容!这里是内容!这里是内容!这里是内容!这里是内容!这里是内容!",
    superCount: 1,
    childCount: 1,

    superOkr: [
      {
        objectiveId: "1.1",
        employeeId: "uuid",
        employeeName: "张",
        departmentName: "策划部",
        dangerDesc: "正常",
        schedule: "30",
        objectiveDesc: "这里是内容!",
        superCount: 2,
        childCount: 0,
        superOkr: [
          {
            objectiveId: "2.1.1",
            employeeId: "uuid",
            employeeName: "张",
            departmentName: "策划部",
            dangerDesc: "正常",
            schedule: "30",
            objectiveDesc: "这里是内容!",
            superCount: 0,
            childCount: 0,
          },
          {
            objectiveId: "2.1.2",
            employeeId: "uuid",
            employeeName: "张",
            departmentName: "策划部",
            dangerDesc: "正常",
            schedule: "30",
            objectiveDesc: "这里是内容!",
            superCount: 0,
            childCount: 0,
          },
        ],
      },
    ],
    childOkr: [
      {
        objectiveId: "2.1",
        employeeId: "uuid",
        employeeName: "张",
        departmentName: "策划部",
        dangerDesc: "正常",
        schedule: "30",
        objectiveDesc: "这里是内容!",
        superCount: 0,
        childCount: 2,
        childOkr: [
          {
            objectiveId: "2.1.1",
            employeeId: "uuid",
            employeeName: "张",
            departmentName: "策划部",
            dangerDesc: "正常",
            schedule: "30",
            objectiveDesc: "这里是内容!",
            superCount: 0,
            childCount: 0,
          },
          {
            objectiveId: "2.1.2",
            employeeId: "uuid",
            employeeName: "张",
            departmentName: "策划部",
            dangerDesc: "正常",
            schedule: "30",
            objectiveDesc: "这里是内容!",
            superCount: 0,
            childCount: 0,
          },
        ],
      },
    ],
  },
];

function getScheduleColor(dangerDesc) {
  return (
    {
      正常: "#16A0FF",
      有风险: "#FFAE11",
      已延期: "#F73838",
    }[dangerDesc] || "#333333"
  );
}

function initRoot() {
  for (var i = 0; i < array.length; i++) {
    array[i].isRoot = true;
  }
}

function parseJson(array, dir) {
  var newArr = [];
  for (var i = 0; i < array.length; i++) {
    var obj = array[i];
    var newObj = {};
    newObj.objectiveId = obj.objectiveId;
    if (obj.isRoot) newObj.isRoot = obj.isRoot;
    newObj.text = [
      {
        value: obj.employeeName.slice(0, 1),
        top: 24,
        left: 24,
        width: 14,
        height: 14,
        fontsize: 12,
        lineHeight: 12,
        color: "#1BC489",
      },
      {
        value: obj.employeeName,
        top: 20,
        left: 54,
        width: 60,
        height: 16,
        fontsize: 16,
        lineHeight: 16,
        color: "#666666",
      },
      {
        value: obj.departmentName,
        top: 20,
        left: 130,
        width: 80,
        height: 16,
        fontsize: 16,
        lineHeight: 16,
        color: "#666666",
      },
      {
        value: obj.dangerDesc + obj.schedule + " %",
        top: 22,
        left: 245,
        width: 110,
        height: 14,
        fontsize: 14,
        lineHeight: 14,
        textAlign: "right",
        color: getScheduleColor(obj.dangerDesc),
      },
      {
        value: obj.objectiveDesc,
        top: 50,
        left: 54,
        width: 250,
        height: 40,
        fontsize: 14,
        lineHeight: 20,
        color: "#333333",
      },
    ];
    newObj.shape = [
      {
        type: "rect",
        background: getScheduleColor(obj.dangerDesc),
        left: 0,
        top: 0,
        width: 3,
        height: 100,
      },
      {
        type: "circle",
        background: "rgba(27,196,137,0.10)",
        left: 30,
        top: 30,
        r: 15,
      },
    ];

    if (obj.isRoot) {
      newObj.expanded_l = false;
      newObj.expanded_r = false;
      newObj.children_count_l = obj.superCount;
      newObj.children_count_r = obj.childCount;
      newObj.children = [];
      newObj.children = newObj.children.concat(parseJson(obj.superOkr, -1));
      newObj.children = newObj.children.concat(parseJson(obj.childOkr, 1));
    } else {
      newObj.expanded = false;
      newObj.direction = dir;
      newObj.children = [];
      if (dir === -1 && obj.superCount) {
        newObj.children_count = obj.superCount;
        newObj.children = newObj.children.concat(parseJson(obj.superOkr, -1));
      }
      if (dir === 1 && obj.childCount) {
        newObj.children_count = obj.childCount;
        newObj.children = newObj.children.concat(parseJson(obj.childOkr, 1));
      }
    }
    newArr.push(newObj);
  }
  return newArr;
}

initRoot(array);
var node_array = parseJson(array);
