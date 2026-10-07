// 病情评估：9 个量表共用。数据只存取在病例草稿（FmsCase）的 bqpg.<key> 下：
//   { finish, answered, total, score: "数字字符串或空串", result: "判定或空串", answers: { 原始作答 }, ...维度分 }
// 量表页边填边自动写入草稿（只写本地草稿，不调接口）：未答完时 finish=false，只有 answers/answered/total；
// 全部答完时 finish=true 并带上计分。点「保存并返回」时再按原逻辑提交接口。查看模式不自动保存。
// 滑块题只有被拖动/点击过才算作答（未作答的滑块不写入 answers）。
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
    // 页面症状部分 10 题 + 4 个细项：第 10 题“对噪音、明亮光线、异味和寒冷的敏感度”即标准 FIQR 第 10 题，
    // 10-1～10-4（fiqr_3_10_1 … fiqr_3_10_4）是它的拆分细项（噪音/光线/异味/寒冷），不计分，只存 answers。
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

    // MFI-20（Smets 1995）：页面 value 1–5 即选项“1 不符合 … 5 完全符合”。
    //   疲劳方向条目 2,5,9,10,13,14,16,17,18,19：得分 = value（1–5）
    //   正向表述条目 1,3,4,6,7,8,11,12,15,20（感觉良好/有活力等）反向：得分 = 6 - value（5–1）
    //   分越高越疲劳。总分 20–100；5 个维度各 4 题 4–20：
    //   generalFatigue 综合疲劳 1,5,12,16；physicalFatigue 躯体疲劳 2,8,14,20；
    //   reducedActivity 活动减少 3,6,10,17；reducedMotivation 动力下降 4,9,15,18；
    //   mentalFatigue 脑力疲劳 7,11,13,19。result 留空。
    mfi20: function (a) {
      var REVERSE = [1, 3, 4, 6, 7, 8, 11, 12, 15, 20];
      function item(i) { var v = num(a['mfi' + i]); if (v == null) return 0; return REVERSE.indexOf(i) !== -1 ? 6 - v : v; }
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
    //   C4 睡眠效率 = 实际睡眠小时 / 卧床时间（起床时间 − 上床时间，跨午夜 +24h；时间由页面“时/分”下拉合成 bedtime/waketime “HH:MM”）：
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
  function viewMode() { return !!(window.FmsCase && FmsCase.isViewMode && FmsCase.isViewMode()); }

  // 进度条：bar 宽度 pct%，文字 text
  function setProgress(pct, text) {
    document.querySelectorAll('.progress-block').forEach(function (b) {
      var bar = b.querySelector('.progress'), span = bar && bar.querySelector('span'), p = b.querySelector('p');
      if (bar) bar.setAttribute('aria-valuenow', pct);
      if (span) span.style.width = pct + '%';
      if (p) p.textContent = text;
    });
  }

  // 某量表的状态：done（已完成）/ partial（已填 x/N）/ empty（未填写）
  function scaleState(d) {
    if (d && d.finish) return { state: 'done', answered: d.total || null, total: d.total || null };
    var n = d ? Number(d.answered) || 0 : 0;
    if (n > 0) return { state: 'partial', answered: n, total: Number(d.total) || null };
    return { state: 'empty', answered: 0, total: d ? Number(d.total) || null : null };
  }

  // ---------------------------------------------------------------------------
  // 首页：显示每个量表的状态（未填写 / 已填 x/N / ✓ 已完成）和整体进度（已完成量表数 / 9）。
  // 从量表页返回时（含浏览器页面缓存 bfcache 恢复）在 pageshow 里重新读取草稿刷新。
  // ---------------------------------------------------------------------------
  var menu = document.querySelector('.menu');
  if (menu) {
    var renderList = function () {
      var done = 0;
      menu.querySelectorAll('a[href]').forEach(function (link) {
        var name = link.getAttribute('href').replace(/\.html.*$/, '');
        var key = KEY_MAP[name];
        if (!key) return;
        var badge = link.querySelector('em.status');
        if (!badge) {
          badge = document.createElement('em');
          var arrow = link.querySelector('span');
          var wrap = document.createElement('div');
          wrap.className = 'menu-text';
          while (link.firstChild && link.firstChild !== arrow) wrap.appendChild(link.firstChild);
          wrap.appendChild(badge);
          link.insertBefore(wrap, arrow);
        }
        var d = draft(key), st = scaleState(d), text;
        if (st.state === 'done') {
          done++;
          text = '✓ 已完成';
          if (d.score !== '' && d.score != null) text += ' · ' + d.score + '分';
          if (d.result) text += ' · ' + d.result;
        } else if (st.state === 'partial') {
          text = '已填 ' + st.answered + (st.total ? '/' + st.total : '');
        } else text = '未填写';
        badge.className = 'status' + (st.state === 'empty' ? '' : ' ' + st.state);
        badge.textContent = text;
      });
      var pct = Math.round(done / SCALES.length * 100);
      setProgress(pct, '已完成' + pct + '%（' + done + '/' + SCALES.length + '）');
    };
    renderList();
    window.addEventListener('pageshow', renderList);
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

  // 选填、不计入进度的题目：人体图选区、肌肉疼痛性质（可多选，可能一项都不符合）
  var OPTIONAL = { painRegions: 1, painNature: 1 };
  // 条件必填：PSQI 5j 选了⑵～⑷时需填写说明
  var CONDITIONAL = { psqi5_10_note: function (a) { return ['1', '2', '3'].indexOf(String(a.psqi5_10)) !== -1; } };
  var touched = {}; // 被拖动/点击过的滑块

  function fields() {
    return Array.from(form.elements).filter(function (el) { return el.name && el.type !== 'submit' && el.type !== 'button'; });
  }
  // 题目单元：同 name 为一题；data-q 相同的合并为一题（PSQI 的「时」「分」）
  function units() {
    var map = {}, list = [];
    fields().forEach(function (el) {
      var id = el.dataset.q || el.name;
      if (!map[id]) { map[id] = { id: id, els: [] }; list.push(map[id]); }
      map[id].els.push(el);
    });
    return list;
  }
  function isRequired(u, a) {
    if (OPTIONAL[u.id] || u.els[0].type === 'hidden') return false;
    if (CONDITIONAL[u.id]) return CONDITIONAL[u.id](a);
    return true;
  }
  function isAnswered(u) {
    var first = u.els[0];
    if (first.type === 'radio' || first.type === 'checkbox') return u.els.some(function (x) { return x.checked; });
    if (first.type === 'range') return !!touched[first.name];
    return u.els.every(function (x) { return String(x.value).trim() !== '' && (x.type !== 'number' || x.checkValidity()); });
  }
  function progress(a) {
    var answered = 0, total = 0, missing = [];
    units().forEach(function (u) {
      if (!isRequired(u, a)) return;
      total++;
      if (isAnswered(u)) answered++; else missing.push(u.els[0]);
    });
    return { answered: answered, total: total, missing: missing };
  }

  function pad(x) { return String(x).padStart(2, '0'); }
  function collect() {
    var a = {};
    fields().forEach(function (el) {
      if (el.disabled) return;
      if (el.type === 'radio') { if (el.checked) a[el.name] = el.value; else if (!(el.name in a)) a[el.name] = ''; }
      else if (el.type === 'checkbox') { if (!Array.isArray(a[el.name])) a[el.name] = []; if (el.checked) a[el.name].push(el.value); }
      else if (el.type === 'range') a[el.name] = touched[el.name] ? el.value : '';
      else a[el.name] = el.value;
    });
    // PSQI：时/分下拉合成 "HH:MM"，供计分（C4 睡眠效率）与原有 bedtime / waketime 字段
    ['bedtime', 'waketime'].forEach(function (n) {
      if (!(n + 'Hour' in a)) return;
      var h = a[n + 'Hour'], m = a[n + 'Minute'];
      a[n] = h !== '' && m !== '' && h != null && m != null ? pad(h) + ':' + pad(m) : '';
    });
    return a;
  }

  function updateRanges() {
    form.querySelectorAll('input[type=range]').forEach(function (input) {
      var out = input.nextElementSibling && input.nextElementSibling.querySelector('output');
      var on = !!touched[input.name];
      input.classList.toggle('untouched', !on);
      if (out) out.value = on ? input.value : '未选';
    });
  }

  function showProgress(p) {
    var pct = p.total ? Math.round(p.answered / p.total * 100) : 0;
    setProgress(pct, '已填 ' + p.answered + '/' + p.total + '（' + pct + '%）');
  }

  function scoredValue(answers, p) {
    var scored = scorer(answers);
    var value = { finish: true, score: scored.score, result: scored.result, answers: answers, answered: p.answered, total: p.total };
    Object.keys(scored).forEach(function (k) { if (k !== 'score' && k !== 'result') value[k] = scored[k]; });
    return value;
  }

  // 回显草稿（painDETECT 的 painRegions 隐藏域在这里写回，随后 pain-detect.js 按它恢复人体图选区）
  var saved = draft(key);
  if (saved && saved.answers) {
    var ans = saved.answers;
    // 旧数据只有 bedtime / waketime "HH:MM" 时拆回时/分下拉
    ['bedtime', 'waketime'].forEach(function (n) {
      var m = /^(\d{1,2}):(\d{2})/.exec(ans[n] || '');
      if (m && ans[n + 'Hour'] == null) { ans[n + 'Hour'] = String(Number(m[1])); ans[n + 'Minute'] = String(Number(m[2])); }
    });
    FmsCase.fillForm(form, ans);
    form.querySelectorAll('input[type=range]').forEach(function (r) {
      var v = ans[r.name];
      if (v != null && v !== '') touched[r.name] = true;
    });
  }
  updateRanges();
  showProgress(progress(collect()));

  // 自动保存：作答即写入病例草稿（不调接口）；查看模式不写
  var timer = null;
  function autosave() {
    clearTimeout(timer); timer = null;
    if (viewMode()) return;
    var a = collect();
    var p = progress(a);
    showProgress(p);
    if (!draft(key) && !FmsCase.hasData(a)) return;
    var value = p.answered === p.total ? scoredValue(a, p) : { finish: false, answers: a, answered: p.answered, total: p.total };
    try { FmsCase.set('bqpg.' + key, value); } catch (e) { if (errorEl) errorEl.textContent = e.message || '暂存失败'; }
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(autosave, 150); }
  function onEdit(e) {
    var t = e.target;
    if (t && t.type === 'range' && !t.disabled) touched[t.name] = true;
    if (errorEl && e.type === 'change') errorEl.textContent = '';
    updateRanges();
    schedule();
  }
  form.addEventListener('input', onEdit);
  form.addEventListener('change', onEdit);
  // 点一下滑块（不拖动、值不变）也算作答
  form.addEventListener('click', function (e) { if (e.target && e.target.type === 'range') onEdit(e); });
  // 离开页面前把尚未写入的改动立刻写入
  window.addEventListener('pagehide', function () { if (timer) autosave(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && timer) autosave(); });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearTimeout(timer); timer = null;
    var answers = collect();
    var p = progress(answers);
    showProgress(p);
    if (p.missing.length) {
      autosave();
      if (errorEl) errorEl.textContent = '还有 ' + p.missing.length + ' 题未作答或填写有误，请完成后保存（已填部分已暂存）';
      var box = p.missing[0].closest('.question, .scale-item') || p.missing[0];
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    FmsCase.save('bqpg.' + key, scoredValue(answers, p), { back: 'index.html', button: form.querySelector('button[type=submit]') });
  });
})();
