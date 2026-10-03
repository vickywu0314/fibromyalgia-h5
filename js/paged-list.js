// 手机端分页列表：滚动到底部自动加载下一页（上拉加载更多）。
// options:
//   list / footer / empty   列表容器、底部提示、空状态元素
//   fetchPage(pageNo)       返回 { items, hasMore }
//   renderItem(item)        返回一个 DOM 元素
//   filter(items)           可选，渲染前过滤（如本地搜索）
//   sort(a, b)              可选，已加载数据的排序
//   emptyText()             空列表文案
//   precheck()              可选，返回错误文案则不请求
window.PagedList = function PagedList(options) {
  const { list, footer, empty } = options;
  let items = [], pageNo = 0, hasMore = false, loading = false, loadFailed = false, generation = 0;

  function showState(message, retry) {
    list.replaceChildren();
    footer.style.display = 'none';
    empty.textContent = message;
    empty.style.display = 'block';
    if (retry) {
      const button = document.createElement('button');
      button.textContent = '重新加载';
      button.onclick = reload;
      empty.append(document.createElement('br'), button);
    }
  }
  function renderFooter() {
    footer.style.display = 'block';
    footer.onclick = null;
    if (loading) footer.textContent = '正在加载...';
    else if (loadFailed) { footer.textContent = '加载失败，点击重试'; footer.onclick = loadNextPage; }
    else if (hasMore) footer.textContent = '上拉加载更多';
    else footer.textContent = '没有更多了';
  }
  function render() {
    const rows = options.filter ? options.filter(items) : items;
    if (!rows.length && !hasMore && !loading) return showState(options.emptyText());
    empty.style.display = 'none';
    list.replaceChildren(...rows.map(options.renderItem));
    renderFooter();
  }
  async function loadNextPage() {
    if (loading || (!hasMore && pageNo > 0)) return;
    const blocked = options.precheck && options.precheck();
    if (blocked) return showState(blocked);
    const current = generation;
    loading = true; loadFailed = false;
    if (pageNo === 0) showState('正在加载...'); else renderFooter();
    try {
      const page = await options.fetchPage(pageNo + 1);
      if (current !== generation) return;
      // 翻页期间有新增数据时，后一页可能和前一页重复，按 id 去重。
      const seen = new Set(items.map(item => item.id));
      items = items.concat(page.items.filter(item => item.id == null || !seen.has(item.id)));
      if (options.sort) items.sort(options.sort);
      pageNo += 1;
      hasMore = page.hasMore;
      loading = false;
      render();
      fillViewport();
    } catch (error) {
      if (current !== generation) return;
      loading = false;
      const message = error.name === 'AbortError' ? '请求超时，可点击重试' : error.message;
      if (pageNo === 0) showState(message, true);
      else { loadFailed = true; renderFooter(); }
    }
  }
  // 当前内容不足一屏时观察器不会再触发，主动继续加载。
  function fillViewport() {
    if (hasMore && !loadFailed && footer.getBoundingClientRect().top < window.innerHeight + 200) loadNextPage();
  }
  function reload() {
    generation++;
    items = []; pageNo = 0; hasMore = false; loading = false; loadFailed = false;
    loadNextPage();
  }
  new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting) && hasMore && !loadFailed) loadNextPage();
  }, { rootMargin: '0px 0px 200px 0px' }).observe(footer);

  return { reload, refresh() { render(); fillViewport(); } };
};
