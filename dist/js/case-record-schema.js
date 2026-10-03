// 由 scripts/extract-case-schema.mjs 从各模块填写页生成，供随诊病历页把字段值显示为题目和选项文字。
// 可以手工微调；模块页题目改动后建议重新生成。
window.CASE_RECORD_SCHEMA = {
 "jbxx": {
  "title": "基本信息",
  "fields": [
   {
    "key": "visitDate",
    "label": "1. 本次就诊时间",
    "type": "date",
    "group": ""
   },
   {
    "key": "name",
    "label": "2. 姓名",
    "type": "text",
    "group": ""
   },
   {
    "key": "idCard",
    "label": "3. 身份证号",
    "type": "text",
    "group": ""
   },
   {
    "key": "phone",
    "label": "手机号",
    "type": "text",
    "group": ""
   },
   {
    "key": "gender",
    "label": "3. 性别",
    "type": "single",
    "group": ""
   },
   {
    "key": "province",
    "label": "17. 常住地",
    "type": "single",
    "group": "",
    "unit": "省"
   },
   {
    "key": "marriage",
    "label": "9. 婚姻",
    "type": "single",
    "group": ""
   },
   {
    "key": "education",
    "label": "教育程度",
    "type": "single",
    "group": ""
   },
   {
    "key": "workStatus",
    "label": "工作情况",
    "type": "single",
    "group": ""
   },
   {
    "key": "smoking",
    "label": "吸烟史",
    "type": "single",
    "group": ""
   },
   {
    "key": "smokingYears",
    "label": "吸烟年数",
    "type": "text",
    "group": "",
    "unit": "年"
   },
   {
    "key": "smokingAmount",
    "label": "每日吸烟量",
    "type": "single",
    "group": ""
   },
   {
    "key": "drinking",
    "label": "饮酒史",
    "type": "single",
    "group": ""
   },
   {
    "key": "drinkingYears",
    "label": "饮酒年数",
    "type": "text",
    "group": "",
    "unit": "年"
   },
   {
    "key": "drinkType",
    "label": "每日饮酒种类",
    "type": "single",
    "group": ""
   },
   {
    "key": "drinkAmount",
    "label": "每天饮酒用量",
    "type": "text",
    "group": "",
    "unit": "ml"
   },
   {
    "key": "painOnsetDate",
    "label": "周身疼痛发病时间",
    "type": "date",
    "group": ""
   },
   {
    "key": "diagnosed",
    "label": "是否曾确诊纤维肌痛综合征",
    "type": "single",
    "group": ""
   },
   {
    "key": "diagnosisDate",
    "label": "确诊时间",
    "type": "date",
    "group": ""
   },
   {
    "key": "hospitalLevel",
    "label": "确诊医疗机构级别",
    "type": "single",
    "group": ""
   }
  ],
  "subs": {
   "csi": {
    "title": "中枢敏化程度",
    "fields": [
     {
      "key": "q1",
      "label": "1. 我晨起后仍觉疲惫且没精神",
      "type": "single",
      "group": ""
     },
     {
      "key": "q2",
      "label": "2. 我感到肌肉僵硬且疼痛",
      "type": "single",
      "group": ""
     },
     {
      "key": "q3",
      "label": "3. 我感觉浑身疼痛",
      "type": "single",
      "group": ""
     },
     {
      "key": "q4",
      "label": "4. 我头痛",
      "type": "single",
      "group": ""
     },
     {
      "key": "q5",
      "label": "5. 我睡觉不好",
      "type": "single",
      "group": ""
     },
     {
      "key": "q6",
      "label": "6. 我很难集中注意力",
      "type": "single",
      "group": ""
     },
     {
      "key": "q7",
      "label": "7. 精神压力导致我的身体症状恶化",
      "type": "single",
      "group": ""
     },
     {
      "key": "q8",
      "label": "8. 我的颈部和肩部肌肉紧张",
      "type": "single",
      "group": ""
     },
     {
      "key": "q9",
      "label": "9. 我记性差",
      "type": "single",
      "group": ""
     }
    ]
   },
   "work": {
    "title": "间接成本评估",
    "fields": [
     {
      "key": "q1",
      "label": "1. 您现在有没有带收入的工作？",
      "type": "single",
      "group": ""
     },
     {
      "key": "q2",
      "label": "因健康问题缺勤小时数",
      "type": "text",
      "group": "",
      "unit": "小时"
     },
     {
      "key": "q3",
      "label": "因其他原因缺勤小时数",
      "type": "text",
      "group": "",
      "unit": "小时"
     },
     {
      "key": "q4",
      "label": "实际工作小时数",
      "type": "text",
      "group": "",
      "unit": "小时"
     },
     {
      "key": "q5",
      "label": "5. 过去7天内，健康问题在多大程度上影响了您工作时的工作效率？",
      "type": "single",
      "group": "",
      "options": {
       "0": "0（没有影响）",
       "10": "10（完全无法工作）"
      }
     },
     {
      "key": "q6",
      "label": "6. 过去7天内，健康问题在多大程度上影响了您进行日常活动的能力（不包括有偿工作）？",
      "type": "single",
      "group": "",
      "options": {
       "0": "0（没有影响）",
       "10": "10（完全无法进行日常活动）"
      }
     }
    ]
   },
   "bodyComposition": {
    "title": "人体成分分析",
    "fields": [
     {
      "key": "bodyFatPercentage",
      "label": "体脂百分比",
      "type": "text",
      "group": "",
      "unit": "%"
     },
     {
      "key": "bodyFatMass",
      "label": "体脂量/体脂肪量",
      "type": "text",
      "group": "",
      "unit": "Kg"
     },
     {
      "key": "skeletalMuscleMass",
      "label": "骨骼肌量",
      "type": "text",
      "group": "",
      "unit": "Kg"
     },
     {
      "key": "skeletalMuscleIndex",
      "label": "骨骼肌指数",
      "type": "text",
      "group": "",
      "unit": "Kg"
     },
     {
      "key": "leanBodyMass",
      "label": "去脂体重/瘦体质量",
      "type": "text",
      "group": "",
      "unit": "Kg"
     },
     {
      "key": "visceralFatLevel",
      "label": "内脏脂肪等级",
      "type": "single",
      "group": ""
     },
     {
      "key": "ratio1",
      "label": "腰臀比",
      "type": "text",
      "group": ""
     },
     {
      "key": "ratio2",
      "label": "腰臀比",
      "type": "text",
      "group": ""
     }
    ]
   },
   "tipi": {
    "title": "人格评估：中国版10项目大五人格量表（TIPI-C）",
    "fields": [
     {
      "key": "q1",
      "label": "1. 外向的，精力充沛的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     },
     {
      "key": "q2",
      "label": "2. 爱批判人的，爱争论的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     },
     {
      "key": "q3",
      "label": "3. 可信赖的，自律的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     },
     {
      "key": "q4",
      "label": "4. 忧虑的，易心烦的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     },
     {
      "key": "q5",
      "label": "5. 经验开放的，常有新想法的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     },
     {
      "key": "q6",
      "label": "6. 内向的，安静的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     },
     {
      "key": "q7",
      "label": "7. 招人喜爱的，友善的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     },
     {
      "key": "q8",
      "label": "8. 散漫的，粗心的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     },
     {
      "key": "q9",
      "label": "9. 冷静的，情绪稳定的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     },
     {
      "key": "q10",
      "label": "10. 遵循常规的，缺乏创造性的",
      "type": "single",
      "group": "",
      "options": {
       "1": "绝对不同意",
       "2": "非常不同意",
       "3": "基本不同意",
       "4": "不确定",
       "5": "基本同意",
       "6": "非常同意",
       "7": "绝对同意"
      }
     }
    ]
   },
   "sffq": {
    "title": "膳食摄入评估：半定量膳食频率问卷（SFFQ）",
    "fields": [
     {
      "key": "oil",
      "label": "食用油 · 请输入食用情况",
      "type": "text",
      "group": "1. 食用油"
     },
     {
      "key": "s2_1_freq",
      "label": "米饭 · 食用频率",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_1_amt",
      "label": "米饭 · 每次食用量",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_1_extra",
      "label": "米饭 · 5两以上，请填入两数",
      "type": "text",
      "group": "2. 主食",
      "unit": "两"
     },
     {
      "key": "s2_2_freq",
      "label": "粥 · 食用频率",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_2_amt",
      "label": "粥 · 每次食用量",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_2_extra",
      "label": "粥 · 5两以上，请填入两数",
      "type": "text",
      "group": "2. 主食",
      "unit": "两"
     },
     {
      "key": "s2_3_freq",
      "label": "面条 · 食用频率",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_3_amt",
      "label": "面条 · 每次食用量",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_3_extra",
      "label": "面条 · 5两以上，请填入两数",
      "type": "text",
      "group": "2. 主食",
      "unit": "两"
     },
     {
      "key": "s2_4_freq",
      "label": "馒头/包子/花卷 · 食用频率",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_4_amt",
      "label": "馒头/包子/花卷 · 每次食用量",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_4_extra",
      "label": "馒头/包子/花卷 · 5两以上，请填入两数",
      "type": "text",
      "group": "2. 主食",
      "unit": "两"
     },
     {
      "key": "s2_5_freq",
      "label": "饼类 · 食用频率",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_5_amt",
      "label": "饼类 · 每次食用量",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_5_extra",
      "label": "饼类 · 5两以上，请填入两数",
      "type": "text",
      "group": "2. 主食",
      "unit": "两"
     },
     {
      "key": "s2_6_freq",
      "label": "其他谷薯类 · 食用频率",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_6_amt",
      "label": "其他谷薯类 · 每次食用量",
      "type": "single",
      "group": "2. 主食"
     },
     {
      "key": "s2_6_extra",
      "label": "其他谷薯类 · 5两以上，请填入两数",
      "type": "text",
      "group": "2. 主食",
      "unit": "两"
     },
     {
      "key": "s3_1_freq",
      "label": "大豆及豆制品 · 食用频率",
      "type": "single",
      "group": "3. 豆类及豆制品"
     },
     {
      "key": "s3_1_amt",
      "label": "大豆及豆制品 · 每次食用量",
      "type": "single",
      "group": "3. 豆类及豆制品"
     },
     {
      "key": "s3_1_extra",
      "label": "大豆及豆制品 · 5两以上，请填入两数",
      "type": "text",
      "group": "3. 豆类及豆制品",
      "unit": "两"
     },
     {
      "key": "s3_2_freq",
      "label": "杂豆类 · 食用频率",
      "type": "single",
      "group": "3. 豆类及豆制品"
     },
     {
      "key": "s3_2_amt",
      "label": "杂豆类 · 每次食用量",
      "type": "single",
      "group": "3. 豆类及豆制品"
     },
     {
      "key": "s3_2_extra",
      "label": "杂豆类 · 5两以上，请填入两数",
      "type": "text",
      "group": "3. 豆类及豆制品",
      "unit": "两"
     },
     {
      "key": "s4_1_freq",
      "label": "深色蔬菜 · 食用频率",
      "type": "single",
      "group": "4. 蔬菜"
     },
     {
      "key": "s4_1_amt",
      "label": "深色蔬菜 · 每次食用量",
      "type": "single",
      "group": "4. 蔬菜"
     },
     {
      "key": "s4_1_extra",
      "label": "深色蔬菜 · 5两以上，请填入两数",
      "type": "text",
      "group": "4. 蔬菜",
      "unit": "两"
     },
     {
      "key": "s4_2_freq",
      "label": "浅色蔬菜 · 食用频率",
      "type": "single",
      "group": "4. 蔬菜"
     },
     {
      "key": "s4_2_amt",
      "label": "浅色蔬菜 · 每次食用量",
      "type": "single",
      "group": "4. 蔬菜"
     },
     {
      "key": "s4_2_extra",
      "label": "浅色蔬菜 · 5两以上，请填入两数",
      "type": "text",
      "group": "4. 蔬菜",
      "unit": "两"
     },
     {
      "key": "s4_3_freq",
      "label": "菌藻类 · 食用频率",
      "type": "single",
      "group": "4. 蔬菜"
     },
     {
      "key": "s4_3_amt",
      "label": "菌藻类 · 每次食用量",
      "type": "single",
      "group": "4. 蔬菜"
     },
     {
      "key": "s4_3_extra",
      "label": "菌藻类 · 5两以上，请填入两数",
      "type": "text",
      "group": "4. 蔬菜",
      "unit": "两"
     },
     {
      "key": "s5_1_freq",
      "label": "水果 · 食用频率",
      "type": "single",
      "group": "5. 水果"
     },
     {
      "key": "s5_1_amt",
      "label": "水果 · 每次食用量",
      "type": "single",
      "group": "5. 水果"
     },
     {
      "key": "s5_1_extra",
      "label": "水果 · 5两以上，请填入两数",
      "type": "text",
      "group": "5. 水果",
      "unit": "两"
     },
     {
      "key": "s6_1_freq",
      "label": "猪肉 · 食用频率",
      "type": "single",
      "group": "6. 肉类"
     },
     {
      "key": "s6_1_amt",
      "label": "猪肉 · 每次食用量",
      "type": "single",
      "group": "6. 肉类"
     },
     {
      "key": "s6_1_extra",
      "label": "猪肉 · 5两以上，请填入两数",
      "type": "text",
      "group": "6. 肉类",
      "unit": "两"
     },
     {
      "key": "s6_2_freq",
      "label": "牛羊肉 · 食用频率",
      "type": "single",
      "group": "6. 肉类"
     },
     {
      "key": "s6_2_amt",
      "label": "牛羊肉 · 每次食用量",
      "type": "single",
      "group": "6. 肉类"
     },
     {
      "key": "s6_2_extra",
      "label": "牛羊肉 · 5两以上，请填入两数",
      "type": "text",
      "group": "6. 肉类",
      "unit": "两"
     },
     {
      "key": "s6_3_freq",
      "label": "禽肉 · 食用频率",
      "type": "single",
      "group": "6. 肉类"
     },
     {
      "key": "s6_3_amt",
      "label": "禽肉 · 每次食用量",
      "type": "single",
      "group": "6. 肉类"
     },
     {
      "key": "s6_3_extra",
      "label": "禽肉 · 5两以上，请填入两数",
      "type": "text",
      "group": "6. 肉类",
      "unit": "两"
     },
     {
      "key": "s6_4_freq",
      "label": "动物内脏 · 食用频率",
      "type": "single",
      "group": "6. 肉类"
     },
     {
      "key": "s6_4_amt",
      "label": "动物内脏 · 每次食用量",
      "type": "single",
      "group": "6. 肉类"
     },
     {
      "key": "s6_4_extra",
      "label": "动物内脏 · 5两以上，请填入两数",
      "type": "text",
      "group": "6. 肉类",
      "unit": "两"
     },
     {
      "key": "s7_1_freq",
      "label": "鱼类 · 食用频率",
      "type": "single",
      "group": "7. 水产品"
     },
     {
      "key": "s7_1_amt",
      "label": "鱼类 · 每次食用量",
      "type": "single",
      "group": "7. 水产品"
     },
     {
      "key": "s7_1_extra",
      "label": "鱼类 · 5两以上，请填入两数",
      "type": "text",
      "group": "7. 水产品",
      "unit": "两"
     },
     {
      "key": "s7_2_freq",
      "label": "虾蟹类 · 食用频率",
      "type": "single",
      "group": "7. 水产品"
     },
     {
      "key": "s7_2_amt",
      "label": "虾蟹类 · 每次食用量",
      "type": "single",
      "group": "7. 水产品"
     },
     {
      "key": "s7_2_extra",
      "label": "虾蟹类 · 5两以上，请填入两数",
      "type": "text",
      "group": "7. 水产品",
      "unit": "两"
     },
     {
      "key": "s7_3_freq",
      "label": "贝类及其他水产品 · 食用频率",
      "type": "single",
      "group": "7. 水产品"
     },
     {
      "key": "s7_3_amt",
      "label": "贝类及其他水产品 · 每次食用量",
      "type": "single",
      "group": "7. 水产品"
     },
     {
      "key": "s7_3_extra",
      "label": "贝类及其他水产品 · 5两以上，请填入两数",
      "type": "text",
      "group": "7. 水产品",
      "unit": "两"
     }
    ]
   },
   "tpc": {
    "title": "压痛点（TPC）",
    "fields": [
     {
      "key": "q1",
      "label": "1. 枕骨下肌肉附着处",
      "type": "multi",
      "group": ""
     },
     {
      "key": "q2",
      "label": "2. 斜方肌上缘中点",
      "type": "multi",
      "group": ""
     },
     {
      "key": "q3",
      "label": "3. 第5～7颈椎横突间隙的前面",
      "type": "multi",
      "group": ""
     },
     {
      "key": "q4",
      "label": "4. 冈上肌起始部，肩胛棘上方近内侧缘上方",
      "type": "multi",
      "group": ""
     },
     {
      "key": "q5",
      "label": "5. 肱骨外上髁远端2cm处",
      "type": "multi",
      "group": ""
     },
     {
      "key": "q6",
      "label": "6. 第2肋骨与软骨交界处",
      "type": "multi",
      "group": ""
     },
     {
      "key": "q7",
      "label": "7. 臀外上象限，臀肌前皱褶处",
      "type": "multi",
      "group": ""
     },
     {
      "key": "q8",
      "label": "8. 转子隆起的后方",
      "type": "multi",
      "group": ""
     },
     {
      "key": "q9",
      "label": "9. 膝内侧脂肪垫关节折皱线的近侧",
      "type": "multi",
      "group": ""
     }
    ]
   },
   "fs.wpi": {
    "title": "普遍疼痛指数（WPI）",
    "fields": [
     {
      "key": "painArea",
      "label": "疼痛部位",
      "type": "multi",
      "group": ""
     }
    ]
   },
   "fs.sss": {
    "title": "症状严重性量表（SSS）",
    "fields": [
     {
      "key": "q1_1",
      "label": "（1）疲劳",
      "type": "single",
      "group": "1. 在过去一周中以下症状的严重程度"
     },
     {
      "key": "q1_2",
      "label": "（2）认知症状（注意力、记忆力下降）",
      "type": "single",
      "group": "1. 在过去一周中以下症状的严重程度"
     },
     {
      "key": "q1_3",
      "label": "（3）睡醒后仍觉得疲乏",
      "type": "single",
      "group": "1. 在过去一周中以下症状的严重程度"
     },
     {
      "key": "q2_1",
      "label": "（1）头痛",
      "type": "single",
      "group": "2. 在过去六个月是否曾受以下症状困扰"
     },
     {
      "key": "q2_2",
      "label": "（2）下腹部疼痛或痉挛",
      "type": "single",
      "group": "2. 在过去六个月是否曾受以下症状困扰"
     },
     {
      "key": "q2_3",
      "label": "（3）抑郁",
      "type": "single",
      "group": "2. 在过去六个月是否曾受以下症状困扰"
     }
    ]
   }
  }
 },
 "bsbq": {
  "title": "病史病情",
  "fields": [
   {
    "key": "systemic",
    "label": "全身症状",
    "type": "multi",
    "group": "1.全身症状",
    "options": {
     "每遇寒则冷痛": "每遇寒则冷痛，"
    }
   },
   {
    "key": "stool",
    "label": "大便",
    "type": "single",
    "group": "2.二便"
   },
   {
    "key": "urine",
    "label": "小便",
    "type": "single",
    "group": "2.二便"
   },
   {
    "key": "tongueColor",
    "label": "舌色",
    "type": "single",
    "group": "3.舌象"
   },
   {
    "key": "tongueShape",
    "label": "舌形",
    "type": "single",
    "group": "3.舌象"
   },
   {
    "key": "coatColor",
    "label": "苔色",
    "type": "single",
    "group": "3.舌象"
   },
   {
    "key": "coatShape",
    "label": "苔质",
    "type": "single",
    "group": "3.舌象"
   },
   {
    "key": "menstrualStage",
    "label": "月经分期",
    "type": "single",
    "group": "4.月经情况"
   },
   {
    "key": "menstrualItems",
    "label": "月经情况",
    "type": "multi",
    "group": "4.月经情况"
   },
   {
    "key": "periodTiming",
    "label": "经期",
    "type": "single",
    "group": "4.月经情况"
   },
   {
    "key": "periodColor",
    "label": "经色",
    "type": "single",
    "group": "4.月经情况"
   },
   {
    "key": "periodAmount",
    "label": "经量",
    "type": "single",
    "group": "4.月经情况"
   },
   {
    "key": "dysmenorrhea",
    "label": "痛经",
    "type": "single",
    "group": "4.月经情况"
   }
  ]
 },
 "zhpd": {
  "title": "证候判断",
  "fields": [
   {
    "key": "mainSyndrome",
    "label": "主证",
    "type": "single",
    "group": "证候判断"
   },
   {
    "key": "hasSecondary",
    "label": "是否有兼证",
    "type": "single",
    "group": "证候判断"
   },
   {
    "key": "secondarySyndrome",
    "label": "兼证",
    "type": "single",
    "group": "证候判断"
   }
  ]
 },
 "fzjc": {
  "title": "辅助检查",
  "fields": [
   {
    "key": "cbc_wbc_status",
    "label": "白细胞",
    "type": "single",
    "group": "血常规"
   },
   {
    "key": "cbc_wbc_value",
    "label": "白细胞数值",
    "type": "text",
    "group": "血常规",
    "unit": "× 10^9/L"
   },
   {
    "key": "cbc_rbc_status",
    "label": "红细胞",
    "type": "single",
    "group": "血常规"
   },
   {
    "key": "cbc_rbc_value",
    "label": "红细胞数值",
    "type": "text",
    "group": "血常规",
    "unit": "× 10^12/L"
   },
   {
    "key": "cbc_hgb_status",
    "label": "血红蛋白",
    "type": "single",
    "group": "血常规"
   },
   {
    "key": "cbc_hgb_value",
    "label": "血红蛋白数值",
    "type": "text",
    "group": "血常规",
    "unit": "g/L"
   },
   {
    "key": "urine_wbc_status",
    "label": "白细胞",
    "type": "single",
    "group": "尿常规"
   },
   {
    "key": "urine_wbc_value",
    "label": "白细胞数值",
    "type": "text",
    "group": "尿常规",
    "unit": "leu/uL"
   },
   {
    "key": "urine_rbc_status",
    "label": "红细胞",
    "type": "single",
    "group": "尿常规"
   },
   {
    "key": "urine_rbc_value",
    "label": "红细胞数值",
    "type": "text",
    "group": "尿常规",
    "unit": "/uL"
   },
   {
    "key": "urine_protein_status",
    "label": "尿蛋白",
    "type": "single",
    "group": "尿常规"
   },
   {
    "key": "urine_protein_value",
    "label": "尿蛋白数值",
    "type": "text",
    "group": "尿常规",
    "unit": "g/L"
   },
   {
    "key": "urine_occult_status",
    "label": "尿潜血",
    "type": "single",
    "group": "尿常规"
   },
   {
    "key": "urine_occult_value",
    "label": "尿潜血数值",
    "type": "text",
    "group": "尿常规",
    "unit": "ery/uL"
   },
   {
    "key": "stool_appearance",
    "label": "便外观性",
    "type": "single",
    "group": "便常规+便潜血"
   },
   {
    "key": "stool_wbc_status",
    "label": "白细胞",
    "type": "single",
    "group": "便常规+便潜血"
   },
   {
    "key": "stool_wbc_value",
    "label": "白细胞数值",
    "type": "text",
    "group": "便常规+便潜血",
    "unit": "ul"
   },
   {
    "key": "stool_rbc_status",
    "label": "红细胞",
    "type": "single",
    "group": "便常规+便潜血"
   },
   {
    "key": "stool_rbc_value",
    "label": "红细胞数值",
    "type": "text",
    "group": "便常规+便潜血",
    "unit": "ul"
   },
   {
    "key": "stool_occult",
    "label": "便潜血",
    "type": "single",
    "group": "便常规+便潜血"
   },
   {
    "key": "alt_status",
    "label": "ALT",
    "type": "single",
    "group": "肝功能"
   },
   {
    "key": "alt_value",
    "label": "ALT数值",
    "type": "text",
    "group": "肝功能",
    "unit": "U/L"
   },
   {
    "key": "ast_status",
    "label": "AST",
    "type": "single",
    "group": "肝功能"
   },
   {
    "key": "ast_value",
    "label": "AST数值",
    "type": "text",
    "group": "肝功能",
    "unit": "U/L"
   },
   {
    "key": "bun_status",
    "label": "BUN",
    "type": "single",
    "group": "肾功能"
   },
   {
    "key": "bun_value",
    "label": "BUN数值",
    "type": "text",
    "group": "肾功能",
    "unit": "mmol/L"
   },
   {
    "key": "cr_status",
    "label": "Cr",
    "type": "single",
    "group": "肾功能"
   },
   {
    "key": "cr_value",
    "label": "Cr数值",
    "type": "text",
    "group": "肾功能",
    "unit": "umol/L"
   },
   {
    "key": "cholesterol",
    "label": "胆固醇",
    "type": "text",
    "group": "血脂",
    "unit": "mmol/L"
   },
   {
    "key": "triglyceride",
    "label": "甘油三酯",
    "type": "text",
    "group": "血脂",
    "unit": "mmol/L"
   },
   {
    "key": "ldl",
    "label": "低密度脂蛋白胆固醇",
    "type": "text",
    "group": "血脂",
    "unit": "mmol/L"
   },
   {
    "key": "hdl",
    "label": "高密度脂蛋白胆固醇",
    "type": "text",
    "group": "血脂",
    "unit": "mmol/L"
   },
   {
    "key": "apob",
    "label": "载脂蛋白B",
    "type": "text",
    "group": "血脂",
    "unit": "g/L"
   },
   {
    "key": "apoa",
    "label": "载脂蛋白A",
    "type": "text",
    "group": "血脂",
    "unit": "g/L"
   },
   {
    "key": "ecg",
    "label": "心电图结果",
    "type": "single",
    "group": "心电图"
   }
  ]
 },
 "bqpg": {
  "title": "病情评估",
  "scales": {
   "vas": {
    "title": "疼痛评估",
    "fields": [
     {
      "key": "vas",
      "label": "VAS标尺",
      "type": "number",
      "group": "疼痛VAS"
     },
     {
      "key": "painNature",
      "label": "近期肌肉疼痛性质",
      "type": "multi",
      "group": ""
     },
     {
      "key": "pain1",
      "label": "1、请选择下面的一个数字，以表示过去24小时内您疼痛最剧烈的程度。",
      "type": "number",
      "group": "疼痛评估"
     },
     {
      "key": "pain2",
      "label": "2、请选择下面的一个数字，以表示过去24小时内您疼痛最轻微的程度。",
      "type": "number",
      "group": "疼痛评估"
     },
     {
      "key": "pain3",
      "label": "3、请选择下面的一个数字，以表示过去24小时内您疼痛的平均程度。",
      "type": "number",
      "group": "疼痛评估"
     },
     {
      "key": "pain4",
      "label": "4、请选择下面的一个数字，以表示您目前的疼痛程度。",
      "type": "number",
      "group": "疼痛评估"
     }
    ]
   },
   "fiqr": {
    "title": "整体病情评估：修订版纤维肌痛影响问卷（FIQR）",
    "fields": [
     {
      "key": "fiqr_1_1",
      "label": "（1）梳头",
      "type": "number",
      "group": "1、功能"
     },
     {
      "key": "fiqr_1_2",
      "label": "（2）连续步行20分钟",
      "type": "number",
      "group": "1、功能"
     },
     {
      "key": "fiqr_1_3",
      "label": "（3）做饭",
      "type": "number",
      "group": "1、功能"
     },
     {
      "key": "fiqr_1_4",
      "label": "（4）使用吸尘器/擦地/扫地",
      "type": "number",
      "group": "1、功能"
     },
     {
      "key": "fiqr_1_5",
      "label": "（5）拎装满食品的袋子",
      "type": "number",
      "group": "1、功能"
     },
     {
      "key": "fiqr_1_6",
      "label": "（6）爬一层楼梯",
      "type": "number",
      "group": "1、功能"
     },
     {
      "key": "fiqr_1_7",
      "label": "（7）换床单",
      "type": "number",
      "group": "1、功能"
     },
     {
      "key": "fiqr_1_8",
      "label": "（8）在椅子上坐45分钟",
      "type": "number",
      "group": "1、功能"
     },
     {
      "key": "fiqr_1_9",
      "label": "（9）去买食品杂货等",
      "type": "number",
      "group": "1、功能"
     },
     {
      "key": "fiqr_2_1",
      "label": "（1）纤维肌痛使我无法完成一周的计划",
      "type": "number",
      "group": "2、整体影响"
     },
     {
      "key": "fiqr_2_2",
      "label": "（2）纤维肌痛症已经完全压垮了我",
      "type": "number",
      "group": "2、整体影响"
     },
     {
      "key": "fiqr_3_1",
      "label": "（1）请评估您的疼痛程度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_2",
      "label": "（2）请评估您的精力程度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_3",
      "label": "（3）请评估您的身体僵硬程度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_4",
      "label": "（4）请评估您的睡眠质量",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_5",
      "label": "（5）请评估您的抑郁程度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_6",
      "label": "（6）请评估您的记忆力",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_7",
      "label": "（7）请评估您的焦虑程度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_8",
      "label": "（8）请评估您的触痛程度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_9",
      "label": "（9）请评估您的平衡感",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_10",
      "label": "（10）请评估您对噪音、明亮光线、异味和寒冷的敏感度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_11",
      "label": "（11）请评估您对噪音的敏感度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_12",
      "label": "（12）请评估您对明亮光线的敏感度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_13",
      "label": "（13）请评估您对异味的敏感度",
      "type": "number",
      "group": "3、症状"
     },
     {
      "key": "fiqr_3_14",
      "label": "（14）请评估您对寒冷的敏感度",
      "type": "number",
      "group": "3、症状"
     }
    ]
   },
   "pcs": {
    "title": "疼痛灾难化评估：疼痛灾难化量表（PCS）",
    "fields": [
     {
      "key": "pcs1",
      "label": "1．我总是为疼痛会不会停止而忧心忡忡",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs2",
      "label": "2．我感觉自己撑不下去了",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs3",
      "label": "3．我感觉太难熬了，心想永远都不会好转了",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs4",
      "label": "4．我感到它比我更强大，这太可怕了",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs5",
      "label": "5．我想自己再也受不了这种痛苦了",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs6",
      "label": "6．我害怕疼痛会变本加厉",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs7",
      "label": "7．我不停地回想另一些痛苦的经历",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs8",
      "label": "8．我焦虑地等待疼痛消失",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs9",
      "label": "9．我无法从疼痛上分散注意力",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs10",
      "label": "10．我忍不住的想：这可真是疼啊！",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs11",
      "label": "11．我忍不住的想：让疼痛赶快彻底消失吧！",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs12",
      "label": "12．我没有任何办法减轻痛楚",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     },
     {
      "key": "pcs13",
      "label": "13．我怀疑这下自己要出大问题了",
      "type": "single",
      "group": "",
      "options": {
       "0": "从来没有（0分）",
       "1": "偶尔（1分）",
       "2": "适度的（2分）",
       "3": "很多时候（3分）",
       "4": "总是如此（4分）"
      }
     }
    ]
   },
   "mfi20": {
    "title": "疲劳评估：多维疲劳评价量表（MFI-20）",
    "fields": [
     {
      "key": "mfi1",
      "label": "1．我感觉良好",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi2",
      "label": "2．我感觉只能做一点体力活动",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi3",
      "label": "3．我感觉很有活力",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi4",
      "label": "4．我愿做各种令我开心的事",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi5",
      "label": "5．我觉得疲惫",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi6",
      "label": "6．我觉得我一天干很多的活",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi7",
      "label": "7．我能专心做事",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi8",
      "label": "8．在体力上我能做很多事",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi9",
      "label": "9．我害怕必须做事",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi10",
      "label": "10．我一天只能做很少的事",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi11",
      "label": "11．我能很好的集中精神",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi12",
      "label": "12．我一直在休息",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi13",
      "label": "13．我要很努力才能集中精神",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi14",
      "label": "14．我要很努力才能应对糟糕的处境",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi15",
      "label": "15．我有很多工作计划",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi16",
      "label": "16．我容易觉得疲劳",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi17",
      "label": "17．我几乎没做任何事",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi18",
      "label": "18．我不想做任何事",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi19",
      "label": "19．我容易走神",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     },
     {
      "key": "mfi20",
      "label": "20．我感觉体力状况很好",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 不符合",
       "1": "2 有点符合",
       "2": "3 一般",
       "3": "4 比较符合",
       "4": "5 完全符合"
      }
     }
    ]
   },
   "psqi": {
    "title": "睡眠评估：匹兹堡睡眠质量量表（PSQI）",
    "fields": [
     {
      "key": "bedtime",
      "label": "1．近1个月，晚上上床睡觉通常几点钟。",
      "type": "text",
      "group": ""
     },
     {
      "key": "latency",
      "label": "2．近1个月，从上床到入睡通常需要多少分钟。",
      "type": "text",
      "group": ""
     },
     {
      "key": "waketime",
      "label": "3．近1个月，通常早上几点起床。",
      "type": "text",
      "group": ""
     },
     {
      "key": "hours",
      "label": "4．近1个月，每夜通常实际睡眠多少小时（不等于卧床时间）。",
      "type": "text",
      "group": ""
     },
     {
      "key": "psqi5_1",
      "label": "a．入睡困难（30分钟内不能入睡）",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi5_2",
      "label": "b．夜间易醒或早醒",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi5_3",
      "label": "c．夜间去厕所",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi5_4",
      "label": "d．呼吸不畅",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi5_5",
      "label": "e．咳嗽或鼾声高",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi5_6",
      "label": "f．感觉冷",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi5_7",
      "label": "g．感觉热",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi5_8",
      "label": "h．做恶梦",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi5_9",
      "label": "i．疼痛不适",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi5_10",
      "label": "j．其它影响睡眠的事情",
      "type": "single",
      "group": "5．近1个月，因下列情况影响睡眠而烦恼，如有，请说明：",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi6",
      "label": "6．近1个月，总的来说，您认为自己的睡眠质量",
      "type": "single",
      "group": "",
      "options": {
       "0": "(1)很好",
       "1": "(2)较好",
       "2": "(3)较差",
       "3": "(4)很差"
      }
     },
     {
      "key": "psqi7",
      "label": "7．近1个月，您用药物催眠的情况",
      "type": "single",
      "group": "",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi8",
      "label": "8．近1个月，您常感到困倦吗",
      "type": "single",
      "group": "",
      "options": {
       "0": "(1)无",
       "1": "(2)＜1次/周",
       "2": "(3)1-2次/周",
       "3": "(4)≥3次/周"
      }
     },
     {
      "key": "psqi9",
      "label": "9．近1个月，您做事情的精力不足吗",
      "type": "single",
      "group": "",
      "options": {
       "0": "(1)没有",
       "1": "(2)偶尔有",
       "2": "(3)有时有",
       "3": "(4)经常有"
      }
     }
    ]
   },
   "had": {
    "title": "焦虑抑郁评估：医院焦虑抑郁调查量表（HAD）",
    "fields": [
     {
      "key": "had_a1",
      "label": "我感到紧张（或痛苦）",
      "type": "single",
      "group": "焦虑部分",
      "options": {
       "0": "根本没有（0分）",
       "1": "有时候（1分）",
       "2": "大多时候（2分）",
       "3": "几乎所有时候（3分）"
      }
     },
     {
      "key": "had_a2",
      "label": "我感到有点害怕好像预感到什么可怕的事情要发生",
      "type": "single",
      "group": "焦虑部分",
      "options": {
       "0": "根本没有（0分）",
       "1": "有一点，但并不使我苦恼（1分）",
       "2": "有，不太严重（2分）",
       "3": "非常肯定和十分严重（3分）"
      }
     },
     {
      "key": "had_a3",
      "label": "我的心中充满烦恼",
      "type": "single",
      "group": "焦虑部分",
      "options": {
       "0": "偶然如此（0分）",
       "1": "时时，但并不轻松（1分）",
       "2": "时常如此（2分）",
       "3": "大多数时间（3分）"
      }
     },
     {
      "key": "had_a4",
      "label": "我能够安闲而轻松地坐着",
      "type": "single",
      "group": "焦虑部分",
      "options": {
       "0": "肯定（0分）",
       "1": "经常（1分）",
       "2": "并不经常（2分）",
       "3": "根本没有（3分）"
      }
     },
     {
      "key": "had_a5",
      "label": "我有点坐立不安，好像感到非要活动不可",
      "type": "single",
      "group": "焦虑部分",
      "options": {
       "0": "根本没有（0分）",
       "1": "并不，很少（1分）",
       "2": "是，不少（2分）",
       "3": "确实非常多（3分）"
      }
     },
     {
      "key": "had_a6",
      "label": "我突然发现有恐慌感",
      "type": "single",
      "group": "焦虑部分",
      "options": {
       "0": "根本没有（0分）",
       "1": "并非经常（1分）",
       "2": "非常肯定，十分严重（2分）",
       "3": "确实很经常（3分）"
      }
     },
     {
      "key": "had_a7",
      "label": "我感到有点害怕，好像某个内脏器官变化了",
      "type": "single",
      "group": "焦虑部分",
      "options": {
       "0": "根本没有（0分）",
       "1": "有时（1分）",
       "2": "很经常（2分）",
       "3": "非常经常（3分）"
      }
     },
     {
      "key": "had_d1",
      "label": "我对以往感兴趣的事情还是有兴趣",
      "type": "single",
      "group": "抑郁部分",
      "options": {
       "0": "肯定一样（0分）",
       "1": "不像以前那样多（1分）",
       "2": "只有一点（2分）",
       "3": "基本上没有了（3分）"
      }
     },
     {
      "key": "had_d2",
      "label": "我能够哈哈大笑，并看到事物好的一面",
      "type": "single",
      "group": "抑郁部分",
      "options": {
       "0": "我经常这样（0分）",
       "1": "现在已经不太这样了（1分）",
       "2": "现在肯定是不太多了（2分）",
       "3": "根本没有（3分）"
      }
     },
     {
      "key": "had_d3",
      "label": "我感到愉快",
      "type": "single",
      "group": "抑郁部分",
      "options": {
       "0": "大多数时间（0分）",
       "1": "有时（1分）",
       "2": "并不经常（2分）",
       "3": "根本没有（3分）"
      }
     },
     {
      "key": "had_d4",
      "label": "我对自己的仪容失去兴趣",
      "type": "single",
      "group": "抑郁部分",
      "options": {
       "0": "根本没有（0分）",
       "1": "并不经常（1分）",
       "2": "经常（2分）",
       "3": "肯定（3分）"
      }
     },
     {
      "key": "had_d5",
      "label": "我对一切都是乐观地向前看",
      "type": "single",
      "group": "抑郁部分",
      "options": {
       "0": "差不多是这样（0分）",
       "1": "并不完全是这样（1分）",
       "2": "很少这样（2分）",
       "3": "几乎从不这样（3分）"
      }
     },
     {
      "key": "had_d6",
      "label": "我好像感到情绪在渐渐低落",
      "type": "single",
      "group": "抑郁部分",
      "options": {
       "0": "根本没有（0分）",
       "1": "有时（1分）",
       "2": "很经常（2分）",
       "3": "几乎所有时间（3分）"
      }
     },
     {
      "key": "had_d7",
      "label": "我能欣赏一本好书或意向好的广播或电视节目",
      "type": "single",
      "group": "抑郁部分",
      "options": {
       "0": "常常如此（0分）",
       "1": "有时（1分）",
       "2": "并非经常（2分）",
       "3": "很少（3分）"
      }
     }
    ]
   },
   "sf12": {
    "title": "生活质量评估：健康调查12条简表（SF-12）",
    "fields": [
     {
      "key": "sf1",
      "label": "1．一般来说，您认为自己的健康状况是：",
      "type": "single",
      "group": "",
      "options": {
       "0": "1 极好",
       "1": "2 很好",
       "2": "3 好",
       "3": "4 一般",
       "4": "5 差"
      }
     },
     {
      "key": "sf2",
      "label": "2．中等强度活动，例如移动桌子、推吸尘器",
      "type": "single",
      "group": "以下问题是关于您在日常生活中可能进行的活动。您目前的健康状况是否限制您进行这些活动？如果有限制，限制程度如何？",
      "options": {
       "0": "是，非常受限（1分）",
       "1": "是，稍受限（2分）",
       "2": "否，完全不受限（3分）"
      }
     },
     {
      "key": "sf3",
      "label": "3．上数层楼梯",
      "type": "single",
      "group": "以下问题是关于您在日常生活中可能进行的活动。您目前的健康状况是否限制您进行这些活动？如果有限制，限制程度如何？",
      "options": {
       "0": "是，非常受限（1分）",
       "1": "是，稍受限（2分）",
       "2": "否，完全不受限（3分）"
      }
     },
     {
      "key": "sf4",
      "label": "4．本来想要做的事情只能完成一部分",
      "type": "single",
      "group": "在过去4周内，由于身体健康原因，您在工作或其他日常活动中是否遇到以下问题？",
      "options": {
       "0": "是（1分）",
       "1": "否（2分）"
      }
     },
     {
      "key": "sf5",
      "label": "5．工作或其他活动的种类受到限制",
      "type": "single",
      "group": "在过去4周内，由于身体健康原因，您在工作或其他日常活动中是否遇到以下问题？",
      "options": {
       "0": "是（1分）",
       "1": "否（2分）"
      }
     },
     {
      "key": "sf6",
      "label": "6．本来想要做的事情只能完成一部分",
      "type": "single",
      "group": "在过去4周内，由于任何情绪问题（例如感到抑郁或焦虑），您在工作或其他日常活动中是否遇到以下问题？",
      "options": {
       "0": "是（1分）",
       "1": "否（2分）"
      }
     },
     {
      "key": "sf7",
      "label": "7．做工作或活动时不如平时仔细",
      "type": "single",
      "group": "在过去4周内，由于任何情绪问题（例如感到抑郁或焦虑），您在工作或其他日常活动中是否遇到以下问题？",
      "options": {
       "0": "是（1分）",
       "1": "否（2分）"
      }
     },
     {
      "key": "sf8",
      "label": "8．在过去4周内，疼痛在多大程度上妨碍了您的正常工作（包括外出工作和家务）？",
      "type": "single",
      "group": "在过去4周内，由于任何情绪问题（例如感到抑郁或焦虑），您在工作或其他日常活动中是否遇到以下问题？",
      "options": {
       "0": "1 完全没有影响",
       "1": "2 有一点影响",
       "2": "3 中度影响",
       "3": "4 较大影响",
       "4": "5 极大影响"
      }
     },
     {
      "key": "sf9",
      "label": "9．感到平静、安宁？",
      "type": "single",
      "group": "以下问题是关于您在过去4周内的感受。每题请选择一个最接近您感受的答案。在过去4周内，您有多少时间……",
      "options": {
       "0": "常常如此（1分）",
       "1": "大部分时间（2分）",
       "2": "相当多时间（3分）",
       "3": "有时（4分）",
       "4": "偶尔（5分）",
       "5": "从不（6分）"
      }
     },
     {
      "key": "sf10",
      "label": "10．精力充沛？",
      "type": "single",
      "group": "以下问题是关于您在过去4周内的感受。每题请选择一个最接近您感受的答案。在过去4周内，您有多少时间……",
      "options": {
       "0": "常常如此（1分）",
       "1": "大部分时间（2分）",
       "2": "相当多时间（3分）",
       "3": "有时（4分）",
       "4": "偶尔（5分）",
       "5": "从不（6分）"
      }
     },
     {
      "key": "sf11",
      "label": "11．感到心情低落、沮丧？",
      "type": "single",
      "group": "以下问题是关于您在过去4周内的感受。每题请选择一个最接近您感受的答案。在过去4周内，您有多少时间……",
      "options": {
       "0": "常常如此（1分）",
       "1": "大部分时间（2分）",
       "2": "相当多时间（3分）",
       "3": "有时（4分）",
       "4": "偶尔（5分）",
       "5": "从不（6分）"
      }
     },
     {
      "key": "sf12",
      "label": "12．在过去4周内，您的身体健康或情绪问题有多少时间妨碍了您的社交活动（如拜访朋友、亲戚等）？",
      "type": "single",
      "group": "以下问题是关于您在过去4周内的感受。每题请选择一个最接近您感受的答案。在过去4周内，您有多少时间……",
      "options": {
       "0": "所有的时间（1分）",
       "1": "大部分时间（2分）",
       "2": "一部分时间（3分）",
       "3": "小部分时间（4分）",
       "4": "没有此问题（5分）"
      }
     }
    ]
   },
   "painDetect": {
    "title": "神经病理性疼痛评估：pain DETECT量表",
    "fields": [
     {
      "key": "painRegions",
      "label": "1、疼痛主要部位",
      "type": "text",
      "group": ""
     },
     {
      "key": "radiation",
      "label": "2、疼痛发作时是否有向身体其他部位放射？",
      "type": "single",
      "group": "",
      "options": {
       "0": "无",
       "1": "有"
      }
     },
     {
      "key": "pain3",
      "label": "3、您认为您此时此刻的疼痛程度为？",
      "type": "number",
      "group": ""
     },
     {
      "key": "pain4",
      "label": "4、在过去4周中，最重的那次疼痛的程度为？",
      "type": "number",
      "group": ""
     },
     {
      "key": "pain5",
      "label": "5、在过去4周，疼痛的平均程度为？",
      "type": "number",
      "group": ""
     },
     {
      "key": "painPattern",
      "label": "6、下列描述疼痛情况的图片与您实际最相符的是：",
      "type": "single",
      "group": "",
      "options": {
       "1": "持续疼痛伴轻微波动",
       "2": "持续疼痛伴偶尔爆发痛",
       "3": "间断爆发痛，发作间期无疼痛",
       "4": "疼痛部分缓解后再次加重，持续循环"
      }
     },
     {
      "key": "symptom7",
      "label": "7、疼痛区域（人体标示图）是否有烧灼感发生？",
      "type": "single",
      "group": "",
      "options": {
       "0": "从未",
       "1": "几乎没",
       "2": "轻微",
       "3": "中等",
       "4": "重度",
       "5": "严重"
      }
     },
     {
      "key": "symptom8",
      "label": "8、疼痛区域是否有麻刺痛或针刺痛（类似蚁行感或过电样痛）发生？",
      "type": "single",
      "group": "",
      "options": {
       "0": "从未",
       "1": "几乎没",
       "2": "轻微",
       "3": "中等",
       "4": "重度",
       "5": "严重"
      }
     },
     {
      "key": "symptom9",
      "label": "9、轻触标示区域皮肤（如穿衣时衣物摩擦）即引起疼痛？",
      "type": "single",
      "group": "",
      "options": {
       "0": "从未",
       "1": "几乎没",
       "2": "轻微",
       "3": "中等",
       "4": "重度",
       "5": "严重"
      }
     },
     {
      "key": "symptom10",
      "label": "10、标示区域是否有爆发痛（如突发电击样痛）？",
      "type": "single",
      "group": "",
      "options": {
       "0": "从未",
       "1": "几乎没",
       "2": "轻微",
       "3": "中等",
       "4": "重度",
       "5": "严重"
      }
     },
     {
      "key": "symptom11",
      "label": "11、标示区域皮肤受到冷或热刺激时（比如洗澡水）是否会引起短时闯痛？",
      "type": "single",
      "group": "",
      "options": {
       "0": "从未",
       "1": "几乎没",
       "2": "轻微",
       "3": "中等",
       "4": "重度",
       "5": "严重"
      }
     },
     {
      "key": "symptom12",
      "label": "12、在标示区域是否有麻木感？",
      "type": "single",
      "group": "",
      "options": {
       "0": "从未",
       "1": "几乎没",
       "2": "轻微",
       "3": "中等",
       "4": "重度",
       "5": "严重"
      }
     },
     {
      "key": "symptom13",
      "label": "13、用手指轻压标示区域皮肤即可触发疼痛？",
      "type": "single",
      "group": "",
      "options": {
       "0": "从未",
       "1": "几乎没",
       "2": "轻微",
       "3": "中等",
       "4": "重度",
       "5": "严重"
      }
     }
    ]
   },
   "cfq": {
    "title": "认知问卷：认知失败问卷（CFQ）",
    "fields": [
     {
      "key": "cfq1",
      "label": "1．看书的时候，常因突然发现没有认真思考而不得不再看一遍。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq2",
      "label": "2．发现自己忘记了为什么要从这个房间去另外一个房间（或者从房屋的这边走到那边）。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq3",
      "label": "3．注意不到路标。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq4",
      "label": "4．在给人指路时，常分不清左右。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq5",
      "label": "5．常撞到别人。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq6",
      "label": "6．忘记是否已经关灯、关火或锁门。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq7",
      "label": "7．与别人初次见面时，常没注意听对方的姓名。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq8",
      "label": "8．事后才意识到可能说了一些无礼的话。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq9",
      "label": "9．当正在做一件事情时，常听不到别人叫我。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq10",
      "label": "10．控制不住发脾气，过后总后悔。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq11",
      "label": "11．常几天不回复重要的信件或邮件等。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq12",
      "label": "12．走在熟悉的道路上，却突然忘记该朝哪个方向走。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq13",
      "label": "13．在超市里，尽管自己想买的东西就在眼前，却常常看不见。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq14",
      "label": "14．发现自己突然想知道刚才措词是否准确。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq15",
      "label": "15．难于下决心或作出决定。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq16",
      "label": "16．忘记与他人的约会。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq17",
      "label": "17．忘记把东西放在哪里。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq18",
      "label": "18．不小心扔掉需要的东西，却保留了真正要扔掉的东西。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq19",
      "label": "19．当应该认真听的时候，却会走神或做白日梦，如听课、听讲座等。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq20",
      "label": "20．忘记别人的名字。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq21",
      "label": "21．开始做一件事情时，却无意中因别的事情分心。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq22",
      "label": "22．话都到嘴边了，可就是一时想不起来要说什么。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq23",
      "label": "23．到了商店，却忘记要买什么东西。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq24",
      "label": "24．常丢三落四。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     },
     {
      "key": "cfq25",
      "label": "25．不知道想要说什么。",
      "type": "single",
      "group": "",
      "options": {
       "0": "0 从不",
       "1": "1 偶尔",
       "2": "2 有时",
       "3": "3 经常",
       "4": "4 总是"
      }
     }
    ]
   }
  }
 },
 "blsj": {
  "title": "不良反应",
  "fields": [
   {
    "key": "hasAdverseEvent",
    "label": "是否有不良事件",
    "type": "single",
    "group": ""
   },
   {
    "key": "adverseEvents",
    "label": "不良事件",
    "type": "multi",
    "group": ""
   },
   {
    "key": "startDate",
    "label": "发生日期",
    "type": "date",
    "group": ""
   },
   {
    "key": "endDate",
    "label": "结束日期",
    "type": "date",
    "group": ""
   },
   {
    "key": "saeCategory",
    "label": "SAE类别",
    "type": "single",
    "group": ""
   },
   {
    "key": "drugMeasure",
    "label": "采取与药物的相关措施",
    "type": "single",
    "group": ""
   },
   {
    "key": "otherMeasures",
    "label": "其他措施",
    "type": "text",
    "group": ""
   },
   {
    "key": "adverseEventDetails",
    "label": "不良事件详情",
    "type": "text",
    "group": ""
   }
  ]
 }
};
