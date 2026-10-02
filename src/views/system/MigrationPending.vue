<template>
  <main class="migration-page">
    <section class="state-card">
      <strong>{{ page?.title || '页面迁移中' }}</strong>
      <p>该页面已经纳入正式 Fibromyalgia 工程，目前保留原静态实现，等待 Vue 化。</p>
      <p class="source" v-if="page">静态源：{{ page.source }}</p>
    </section>
  </main>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { staticPages } from '../../config/staticPages'
const route = useRoute()
const page = computed(() => staticPages.find(item => item.route === route.path))
</script>
<style scoped>
.migration-page{padding:16px}.state-card{background:#fff;border:1px solid #e3e8f0;border-radius:14px;padding:18px;line-height:1.7}.state-card p{margin:8px 0 0;color:#667085}.source{font-size:12px;word-break:break-all}
</style>
