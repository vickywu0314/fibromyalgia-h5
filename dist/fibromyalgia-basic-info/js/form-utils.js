/* 基本信息模块通用表单工具：序列化 / 回显 / 条件显示 / 保存（依赖 ../js/fms-case.js） */
(function(){
  // 序列化：同名多值（复选框）输出为数组；disabled 的字段不提交
  function serialize(form){
    const data = {};
    for (const [k, v] of new FormData(form).entries()) {
      if (v instanceof File) continue;
      if (data[k] === undefined) data[k] = v;
      else if (Array.isArray(data[k])) data[k].push(v);
      else data[k] = [data[k], v];
    }
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (!cb.disabled && cb.name && data[cb.name] !== undefined && !Array.isArray(data[cb.name])) data[cb.name] = [data[cb.name]];
    });
    return data;
  }

  // 回显：按 name 写回单选 / 复选 / 文本 / 下拉
  function fill(form, data){
    if (!data) return;
    Object.keys(data).forEach(name => {
      const els = form.querySelectorAll('[name="' + (window.CSS && CSS.escape ? CSS.escape(name) : name) + '"]');
      if (!els.length) return;
      const val = data[name];
      if (val == null || (typeof val === "object" && !Array.isArray(val))) return;
      const list = Array.isArray(val) ? val.map(String) : [String(val)];
      els.forEach(el => {
        if (el.type === "radio" || el.type === "checkbox") el.checked = list.indexOf(el.value) !== -1;
        else if (el.type !== "file") el.value = list[0];
      });
    });
  }

  // 条件显示：隐藏时禁用并清空子区域内的输入，避免脏数据
  function toggle(section, show){
    if (!section) return;
    section.hidden = !show;
    section.querySelectorAll("input,select,textarea").forEach(el => {
      el.disabled = !show;
      if (!show) {
        if (el.type === "radio" || el.type === "checkbox") el.checked = false;
        else if (el.tagName === "SELECT") el.selectedIndex = 0;
        else if (el.type !== "file") el.value = "";
      }
    });
  }

  // 数据只存取在病例草稿（FmsCase，见 ../js/fms-case.js）里，不再使用页面自己的 localStorage key
  function load(path){
    const v = window.FmsCase ? FmsCase.get(path) : null;
    return v && typeof v === "object" ? v : null;
  }

  // 写草稿并提交：FmsCase.save(path, value, {merge, back, button})
  function save(path, data, opts){
    return FmsCase.save(path, data, opts || {});
  }

  /**
   * 绑定页面：从草稿 path 回显 → 刷新条件显示；暴露 window.setFormData(data) 供原生回显。
   * opts: {form, path, update(data)}；update 收到回显的数据对象（用于依赖选项列表的字段，如城市）
   * 量表类数据（{answers:{...}}）按 answers 回显。
   */
  function bind(opts){
    const form = opts.form, update = opts.update || function(){};
    let saved = load(opts.path);
    if (saved && saved.answers && typeof saved.answers === "object") saved = Object.assign({}, saved, saved.answers);
    fill(form, saved);
    update(saved || {});
    window.setFormData = function(data){
      if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return; } }
      form.reset();
      fill(form, data);
      update(data || {});
    };
  }

  window.FormUtils = {serialize: serialize, fill: fill, toggle: toggle, load: load, save: save, bind: bind};
})();
