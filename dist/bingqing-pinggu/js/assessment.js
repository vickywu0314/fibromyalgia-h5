// 病情评估：9 个量表共用。数据只存取在病例草稿（FmsCase）的 bqpg.<key> 下：
//   { finish: true, score: "数字字符串或空串", result: "判定或空串", answers: { 原始作答 }, ...维度分 }
// 依赖 ../js/fms-api.js 与 ../js/fms-case.js（页面里先于本文件引入）。
(function () {
  'use strict';

  // 页面 data-assessment → 草稿 bqpg 下的 key
  var KEY_MAP = {
    vas: 'vas', fiqr: 'fiqr', pcs: 'pcs', mfi20: 'mfi20', psqi: 'psqi',
    had: 'had', sf12: 'sf12', 'pain-detect': 'painDetect', cfq: 'cfq'
  };
  var SCALES = ['vas', 'fiqr', 'pcs', 'mfi20', 'psqi', 'had', 'sf12', 'painDetect', 'cfq'];

  function num(v) { var n = Number(v); return v === '' || v == null || isNaN(n) ? null : n; }
  function sum(a, names) { return names.reduce(function (t, k) { return t + (num(a[k]) || 0); }, 0); }
  function range(prefix, from, to) { var r = []; for (var i = from; i <= to; i++) r.push(prefix + i); return r; }
  function round1(x) { return Math.round(x * 10) / 10; }
  function str(x) { return x == null || x === '' ? '' : String(x); }

  // ---------------------------------------------------------------------------
  // 计分。每个函数接收 answers（name → value），返回 { score, result, ...维度 }。
  // ---------------------------------------------------------------------------
  var SCORERS = {
    // VAS：range name="vas" 取值 0–10 即疼痛 VAS 分值，score = vas。
    // pain1–pain4（24h 最重/最轻/平均/目前，0–10）只放 answers。
    // result 按页面说明分段：0 无痛；1–3 轻度；4–6 中度；7–9 重度；10 剧痛
    // （页面原文“4-7 中度、7-9 重度”在 7 分重叠，7 分归入重度）。
    vas: function (a) {
      var v = num(a.vas);
      var level = v == null ? '' : v === 0 ? '无痛' : v <= 3 ? '轻度' : v <= 6 ? '中度' : v <= 9 ? '重度' : '剧痛';
      return { score: str(v), result: level };
    },

    // FIQR（Bennett 2009）：所有条目 0–10，分越高越差。
    //   功能 functionScore = 第 1 部分 9 题总和 / 3（0–30）
    //   整体影响 impactScore = 第 2 部分 2 题总和（0–20）
    //   症状 symptomScore = 第 3 部分标准 10 题（页面 fiqr_3_1 … fiqr_3_10）总和 / 2（0–50）
    //   总分 = 三者之和（0–100），保留 1 位小数。
    // 页面症状部分有 14 题：第 10 题“对噪音、明亮光线、异味和寒冷的敏感度”即标准 FIQR 第 10 题，
    // 第 11–14 题是它的拆分细项（噪音/光线/异味/寒冷），不计分，只存 answers。
    // severity（另加 key）：<39 轻度；39–<59 中度；≥59 重度（任务给定分级）。
    // result 留空（FIQR 无公认二分判定）。
    fiqr: function (a) {
      var fn = sum(a, range('fiqr_1_', 1, 9)) / 3;
      var im = sum(a, range('fiqr_2_', 1, 2));
      var sy = sum(a, range('fiqr_3_', 1, 10)) / 2;
      var total = round1(fn + im + sy);
      return {
        score: total.toFixed(1), result: '',
        functionScore: round1(fn).toFixed(1), impactScore: String(im), symptomScore: round1(sy).toFixed(1),
        severity: total < 39 ? '轻度' : total < 59 ? '中度' : '重度'
      };
    },

    // PCS（Sullivan 1995）：13 题，每题 0–4（页面 value 即分值），总分 0–52。
    //   rumination 反复思考 = 8,9,10,11；magnification 夸大 = 6,7,13；helplessness 无助 = 1,2,3,4,5,12。
    // result：总分 ≥30 为“是”（临床显著的疼痛灾难化），否则“否”。
    pcs: function (a) {
      var total = sum(a, range('pcs', 1, 13));
      return {
        score: String(total), result: total >= 30 ? '是' : '否',
        rumination: String(sum(a, ['pcs8', 'pcs9', 'pcs10', 'pcs11'])),
        magnification: String(sum(a, ['pcs6', 'pcs7', 'pcs13'])),
        helplessness: String(sum(a, ['pcs1', 'pcs2', 'pcs3', 'pcs4', 'pcs5', 'pcs12']))
      };
    },

    // MFI-20（Smets 1995）：页面 value 0–4 对应选项“1 不符合 … 5 完全符合”。
    //   疲劳方向条目 2,5,9,10,13,14,16,17,18,19：得分 = value + 1（1–5）
    //   正向表述条目 1,3,4,6,7,8,11,12,15,20（感觉良好/有活力等）反向：得分 = 5 - value（5–1）
    //   分越高越疲劳。总分 20–100；5 个维度各 4 题 4–20：
    //   generalFatigue 综合疲劳 1,5,12,16；physicalFatigue 躯体疲劳 2,8,14,20；
    //   reducedActivity 活动减少 3,6,10,17；reducedMotivation 动力下降 4,9,15,18；
    //   mentalFatigue 脑力疲劳 7,11,13,19。result 留空。
    mfi20: function (a) {
      var REVERSE = [1, 3, 4, 6, 7, 8, 11, 12, 15, 20];
      function item(i) { var v = num(a['mfi' + i]) || 0; return REVERSE.indexOf(i) !== -1 ? 5 - v : v + 1; }
      function dim(list) { return String(list.reduce(function (t, i) { return t + item(i); }, 0)); }
      var total = 0; for (var i = 1; i <= 20; i++) total += item(i);
      return {
        score: String(total), result: '',
        generalFatigue: dim([1, 5, 12, 16]), physicalFatigue: dim([2, 8, 14, 20]),
        reducedActivity: dim([3, 6, 10, 17]), reducedMotivation: dim([4, 9, 15, 18]),
        mentalFatigue: dim([7, 11, 13, 19])
      };
    },

    // PSQI（Buysse 1989；刘贤臣中文版）：7 个成分各 0–3，总分 0–21。
    //   C1 主观睡眠质量 = 第 6 题（0 很好 … 3 很差）
    //   C2 入睡时间 = 第 2 题（0 ≤15min,1 16–30,2 31–60,3 >60）+ 5a（0–3）之和：0→0,1–2→1,3–4→2,5–6→3
    //   C3 睡眠时间 = 第 4 题小时数：>7→0，6–7→1，5–<6→2，<5→3
    //   C4 睡眠效率 = 实际睡眠小时 / 卧床时间（起床时间 − 上床时间，跨午夜 +24h）：
    //      ≥85%→0，75–84%→1，65–74%→2，<65%→3
    //   C5 睡眠障碍 = 5b–5j（9 题，各 0–3）之和：0→0,1–9→1,10–18→2,19–27→3
    //   C6 催眠药物 = 第 7 题（0–3）
    //   C7 日间功能障碍 = 第 8 题 + 第 9 题（各 0–3）之和：0→0,1–2→1,3–4→2,5–6→3
    // result：总分 >7 为“是”（睡眠质量差），否则“否”。
    psqi: function (a) {
      function band2(x) { return x === 0 ? 0 : x <= 2 ? 1 : x <= 4 ? 2 : 3; }
      var c1 = num(a.psqi6) || 0;
      var c2 = band2((num(a.latency) || 0) + (num(a.psqi5_1) || 0));
      var h = num(a.hours) || 0;
      var c3 = h > 7 ? 0 : h >= 6 ? 1 : h >= 5 ? 2 : 3;
      var c4 = '';
      var bed = minutes(a.bedtime), wake = minutes(a.waketime);
      if (bed != null && wake != null) {
        var inBed = wake - bed; if (inBed <= 0) inBed += 24 * 60;
        var eff = h * 60 / inBed * 100;
        c4 = eff >= 85 ? 0 : eff >= 75 ? 1 : eff >= 65 ? 2 : 3;
      }
      var d = sum(a, range('psqi5_', 2, 10));
      var c5 = d === 0 ? 0 : d <= 9 ? 1 : d <= 18 ? 2 : 3;
      var c6 = num(a.psqi7) || 0;
      var c7 = band2((num(a.psqi8) || 0) + (num(a.psqi9) || 0));
      var comps = [c1, c2, c3, c4, c5, c6, c7];
      var total = c4 === '' ? null : comps.reduce(function (t, x) { return t + x; }, 0);
      return {
        score: str(total), result: total == null ? '' : total > 7 ? '是' : '否',
        components: { sleepQuality: c1, sleepLatency: c2, sleepDuration: c3, sleepEfficiency: c4, sleepDisturbance: c5, sleepMedication: c6, daytimeDysfunction: c7 }
      };
    },

    // HAD（Zigmond & Snaith 1983）：页面 value 已是 0–3 分值（反向条目已按分值排列）。
    //   anxietyScore = had_a1–a7 之和（0–21），depressionScore = had_d1–d7 之和（0–21），score = 两者之和（0–42）。
    //   anxietyResult / depressionResult：0–7 无，8–10 可疑，11–21 有。
    //   result：焦虑或抑郁任一 ≥8 为“是”，否则“否”。
    had: function (a) {
      var an = sum(a, range('had_a', 1, 7)), de = sum(a, range('had_d', 1, 7));
      function lv(x) { return x >= 11 ? '有' : x >= 8 ? '可疑' : '无'; }
      return {
        score: String(an + de), result: an >= 8 || de >= 8 ? '是' : '否',
        anxietyScore: String(an), depressionScore: String(de), anxietyResult: lv(an), depressionResult: lv(de)
      };
    },

    // SF-12：PCS-12 / MCS-12 需按 SF-12 官方常模回归权重换算，这里不实现；只保存原始作答。
    // score、result 留空。
    sf12: function () { return { score: '', result: '' }; },

    // painDETECT（Freynhagen 2006）：
    //   第 7–13 题（symptom7–symptom13）各 0–5，求和 0–35；
    //   第 6 题疼痛模式（painPattern）：1 持续伴轻微波动 0；2 持续伴偶尔爆发痛 −1；
    //     3 间断爆发痛、间期无痛 +1；4 部分缓解后再次加重 +1；
    //   第 2 题放射痛（radiation）：1 有 +2，0 无 0。
    //   总分 −1–38。第 3–5 题疼痛强度、人体图选区（painRegions，逗号分隔）不计分，只存 answers。
    //   result：≤12 阴性；13–18 不确定；≥19 阳性。
    painDetect: function (a) {
      var PATTERN = { 1: 0, 2: -1, 3: 1, 4: 1 };
      var total = sum(a, range('symptom', 7, 13)) + (PATTERN[a.painPattern] || 0) + (String(a.radiation) === '1' ? 2 : 0);
      return { score: String(total), result: total <= 12 ? '阴性' : total <= 18 ? '不确定' : '阳性' };
    },

    // CFQ（Broadbent 1982）：25 题，每题 0–4（页面 value 即分值），总分 0–100。result 留空。
    cfq: function (a) { return { score: String(sum(a, range('cfq', 1, 25))), result: '' }; }
  };

  function minutes(t) {
    var m = /^(\d{1,2}):(\d{2})/.exec(t || '');
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  function draft(key) {
    var v = window.FmsCase ? FmsCase.get('bqpg.' + key) : null;
    return v && typeof v === 'object' ? v : null;
  }

  // 进度条：已完成量表数 / 9
  function updateProgress() {
    var done = SCALES.filter(function (k) { var d = draft(k); return d && d.finish; }).length;
    var pct = Math.round(done / SCALES.length * 100);
    document.querySelectorAll('.progress-block').forEach(function (b) {
      var bar = b.querySelector('.progress'), span = bar && bar.querySelector('span'), p = b.querySelector('p');
      if (bar) bar.setAttribute('aria-valuenow', pct);
      if (span) span.style.width = pct + '%';
      if (p) p.textContent = '已完成' + pct + '%（' + done + '/' + SCALES.length + '）';
    });
  }

  // ---------------------------------------------------------------------------
  // 首页：显示每个量表的完成状态
  // ---------------------------------------------------------------------------
  var menu = document.querySelector('.menu');
  if (menu) {
    updateProgress();
    menu.querySelectorAll('a[href]').forEach(function (link) {
      var name = link.getAttribute('href').replace(/\.html.*$/, '');
      var key = KEY_MAP[name];
      if (!key) return;
      var d = draft(key);
      var badge = document.createElement('em');
      badge.className = 'status' + (d && d.finish ? ' done' : '');
      var text = d && d.finish ? '已完成' : '未填写';
      if (d && d.finish && d.score !== '' && d.score != null) text += ' · ' + d.score + '分';
      if (d && d.finish && d.result) text += ' · ' + d.result;
      badge.textContent = text;
      var arrow = link.querySelector('span');
      var wrap = document.createElement('div');
      wrap.className = 'menu-text';
      while (link.firstChild && link.firstChild !== arrow) wrap.appendChild(link.firstChild);
      wrap.appendChild(badge);
      link.insertBefore(wrap, arrow);
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // 量表页
  // ---------------------------------------------------------------------------
  var form = document.querySelector('[data-assessment]');
  if (!form) return;
  var key = KEY_MAP[form.dataset.assessment];
  var scorer = SCORERS[key];
  var errorEl = form.querySelector('.error');

  function updateRanges() {
    form.querySelectorAll('input[type=range]').forEach(function (input) {
      var out = input.nextElementSibling && input.nextElementSibling.querySelector('output');
      if (out) out.value = input.value;
    });
  }

  // 回显草稿（painDETECT 的 painRegions 隐藏域在这里写回，随后 pain-detect.js 按它恢复人体图选区）
  var saved = draft(key);
  if (saved && saved.answers) FmsCase.fillForm(form, saved.answers);
  updateRanges();
  updateProgress();
  form.addEventListener('input', updateRanges);
  form.addEventListener('change', function () { if (errorEl) errorEl.textContent = ''; });

  function collect() {
    var a = {};
    Array.from(form.elements).forEach(function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === 'radio') { if (el.checked) a[el.name] = el.value; else if (!(el.name in a)) a[el.name] = ''; }
      else if (el.type === 'checkbox') { if (!Array.isArray(a[el.name])) a[el.name] = []; if (el.checked) a[el.name].push(el.value); }
      else a[el.name] = el.value;
    });
    return a;
  }

  // 计分需要的题目必须作答：所有单选组 + PSQI 的时间/小时数（人体图选区不强制）
  function firstMissing(a) {
    var missing = [];
    var seen = {};
    form.querySelectorAll('input[type=radio]').forEach(function (r) {
      if (seen[r.name]) return; seen[r.name] = 1;
      if (a[r.name] === '') missing.push(r);
    });
    form.querySelectorAll('input[type=time], input[type=number]').forEach(function (el) {
      if (el.value === '' || (el.type === 'number' && !el.checkValidity())) missing.push(el);
    });
    missing.sort(function (x, y) { return x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    return { count: missing.length, el: missing[0] };
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var answers = collect();
    var miss = firstMissing(answers);
    if (miss.count) {
      if (errorEl) errorEl.textContent = '还有 ' + miss.count + ' 题未作答或填写有误，请完成后保存';
      var box = miss.el.closest('.question, .scale-item') || miss.el;
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var scored = scorer(answers);
    var value = { finish: true, score: scored.score, result: scored.result, answers: answers };
    Object.keys(scored).forEach(function (k) { if (k !== 'score' && k !== 'result') value[k] = scored[k]; });
    FmsCase.save('bqpg.' + key, value, { back: 'index.html', button: form.querySelector('button[type=submit]') });
  });
})();
